// WIP file integrity and isolation check. This is not an art-quality approval.
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const output = 'qa/cubism-parts-2026-09-05';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1180, height: 1100 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://localhost:4174/tools/cubism-parts-review.html');
  await page.waitForFunction(() => document.body.dataset.ready || document.body.dataset.error);
  assert.equal(await page.getAttribute('body', 'data-error'), null);
  const report = await page.evaluate(() => {
    const { model, snapshot } = window.__cubismReview;
    const neutral = snapshot(0, 0);
    const samples = [-30, -15, 15, 30].map(value => {
      const sample = snapshot(0, value);
      return { value, changes: sample.map((vertices, i) => ({
        id: model.drawables.ids[i],
        maxDelta: Math.max(...vertices.map((n, j) => Math.abs(n - neutral[i][j])))
      })).filter(x => x.maxDelta > 1e-7) };
    });
    const restored = snapshot(0, 0);
    return {
      status: 'Technical WIP verification; production quality NOT approved',
      drawables: model.drawables.count,
      samples,
      restoredDelta: Math.max(...restored.flatMap((v, i) => v.map((n, j) => Math.abs(n - neutral[i][j])))),
      invalidUVs: model.drawables.vertexUvs.flatMap(v => Array.from(v)).filter(n => !Number.isFinite(n) || n < 0 || n > 1).length,
      parameters: Array.from(model.parameters.ids)
    };
  });
  assert.equal(report.drawables, 30);
  assert.equal(report.invalidUVs, 0);
  assert.equal(report.restoredDelta, 0);
  for (const sample of report.samples) {
    assert.deepEqual(sample.changes.map(x => x.id), ['Hand_ScreenL']);
    assert.ok(sample.changes[0].maxDelta > 0.0001);
  }
  await page.screenshot({ path: `${output}/neutral.png`, fullPage: true });
  await page.locator('#head').evaluate(input => { input.value = '30'; input.dispatchEvent(new Event('input')); });
  await page.waitForFunction(() => document.getElementById('headValue').value === '30.0');
  await page.screenshot({ path: `${output}/hand-positive.png`, fullPage: true });
  await page.locator('#neutral').click();
  await page.locator('#react').click();
  await page.waitForFunction(() => Number(document.getElementById('headValue').value) !== 0);
  await page.waitForFunction(() => Number(document.getElementById('headValue').value) === 0, null, { timeout: 5000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('#react').click();
  assert.equal(await page.locator('#headValue').textContent(), '0.0');
  assert.deepEqual(errors, []);
  await writeFile(`${output}/report.json`, JSON.stringify({ ...report, clickRecovery: true, reducedMotion: true, errors }, null, 2));
  console.log(JSON.stringify(report));
} finally { await browser.close(); }
