#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const policy = JSON.parse(readFileSync(new URL('./public-asset-policy.json', import.meta.url), 'utf8'));
const screenshots = new Set(policy.allowedScreenshots);
const artwork = /\.(png|jpe?g|webp|gif|avif|bmp|tiff?|svg|ico|ps[db]|cmo3|moc3|blend|xcf|kra|ktx2?|dds)$/i;

export function privateAssetPaths(paths) {
  return paths.filter(file => !screenshots.has(file) && (
    /^(game\/reference\/|game\/output\/|game\/public\/assets\/overload\/live2d\/)/i.test(file)
    || artwork.test(file)
  ));
}

const git = (args, cwd) => execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
const pathsFrom = value => value.split('\0').filter(Boolean);
const requirePublic = (files, label) => {
  const denied = privateAssetPaths(files);
  if (denied.length) throw new Error(`${label}: ${denied.length} private artwork/source file(s) must not be published:\n${denied.slice(0,20).join('\n')}\nKeep these files locally and remove them from the Git index with git rm --cached. Do not bypass this check with --no-verify.`);
};

export function checkIndex(cwd) {
  const root = git(['rev-parse', '--show-toplevel'], cwd).trim();
  requirePublic(pathsFrom(git(['ls-files', '-z'], root)), 'Git index');
}

export function checkPush(input, cwd) {
  cwd = git(['rev-parse', '--show-toplevel'], cwd).trim();
  const inspected = new Set();
  for (const line of input.trim().split(/\r?\n/).filter(Boolean)) {
    const [localRef, localSha, , remoteSha] = line.split(/\s+/);
    if (!/^[0-9a-f]{40,64}$/i.test(localSha || '') || !/^[0-9a-f]{40,64}$/i.test(remoteSha || '')) throw new Error('Invalid pre-push reference input.');
    if (/^0+$/.test(localSha)) continue;
    requirePublic(pathsFrom(git(['ls-tree', '-r', '--name-only', '-z', localSha], cwd)), localRef);
    const range = /^0+$/.test(remoteSha) ? localSha : `${remoteSha}..${localSha}`;
    for (const commit of git(['rev-list', range], cwd).trim().split(/\r?\n/).filter(Boolean)) {
      if (inspected.has(commit)) continue;
      inspected.add(commit);
      // Check every outgoing addition, even an asset removed again in a later commit.
      requirePublic(pathsFrom(git(['diff-tree', '--root', '-m', '-r', '--no-commit-id', '--name-only', '-z', '--diff-filter=ACMR', commit], cwd)), `Outgoing commit ${commit}`);
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.includes('--push')) checkPush(readFileSync(0, 'utf8'), process.cwd());
    else checkIndex(process.cwd());
    console.log('Public repository asset check passed.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
