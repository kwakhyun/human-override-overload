import assert from 'node:assert/strict';
import test from 'node:test';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { privateAssetPaths, checkIndex, checkPush } from '../scripts/check-public-assets.mjs';

test('only reviewed screenshots are exempt from artwork exclusion', () => {
  const forbidden = ['game/public/assets/hero.PNG', 'game/reference/config.json', 'game/output/report.pdf', 'game/public/assets/overload/live2d/model.json', 'copy/hero.psd', 'game/docs/project/media/new-art.webp', 'game/qa/atlas.png'];
  assert.deepEqual(privateAssetPaths([...forbidden, 'game/docs/project/media/screenshots/01-title.png', 'game/src/App.jsx', 'game/public/assets/audio/theme.mp3']), forbidden);
});

test('Git index and outgoing history both reject private artwork without deleting local files', () => {
  const cwd = mkdtempSync(path.join(tmpdir(), 'public-assets-test-'));
  const git = (...args) => execFileSync('git', args, { cwd, encoding:'utf8' }).trim();
  try {
    git('init', '-q'); git('config', 'user.name', 'Asset Policy Test'); git('config', 'user.email', 'asset-policy@example.invalid');
    git('config', 'core.hooksPath', '.no-test-hooks');
    writeFileSync(path.join(cwd, 'code.js'), 'export const example = 1;');
    git('add', 'code.js'); git('commit', '-qm', 'code');
    const baseline = git('rev-parse', 'HEAD');
    writeFileSync(path.join(cwd, 'art.webp'), 'private-art-test');
    git('add', 'art.webp');
    assert.throws(() => checkIndex(cwd), /art.webp/);
    mkdirSync(path.join(cwd, 'game'));
    assert.throws(() => checkIndex(path.join(cwd, 'game')), /art.webp/);
    git('commit', '-qm', 'artwork added');
    git('rm', '--cached', 'art.webp'); git('commit', '-qm', 'artwork untracked');
    assert.doesNotThrow(() => checkIndex(cwd));
    assert.throws(() => checkPush(`refs/heads/main ${git('rev-parse','HEAD')} refs/heads/main ${baseline}\n`, cwd), /Outgoing commit/);
    assert.doesNotThrow(() => checkPush(`refs/heads/main ${git('rev-parse','HEAD')} refs/heads/main ${git('rev-parse','HEAD~1')}\n`, cwd));
    assert.doesNotThrow(() => checkPush(`(delete) ${'0'.repeat(40)} refs/heads/old ${baseline}\n`, cwd));
  } finally {
    assert.ok(path.resolve(cwd).startsWith(path.resolve(tmpdir()) + path.sep + 'public-assets-test-'));
    rmSync(cwd, { recursive:true, force:true });
  }
});
