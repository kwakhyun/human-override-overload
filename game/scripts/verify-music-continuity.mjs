import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const { chromium } = createRequire(import.meta.url)('playwright');
const browser = await chromium.launch({ headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const output = 'qa/music-continuity-2026-09-06';
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://localhost:4174/');
  await page.getByRole('button', { name: '게임 시작 · 헤이븐-09', exact: true }).click();
  await page.getByRole('button', { name: /SLOT 01 신규/ }).click();
  await page.locator('.interactive-portrait.is-rendered').waitFor();
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.querySelector('audio')?.readyState >= 2);
  await page.evaluate(() => {
    const audio = document.querySelector('audio');
    window.musicProbe = { audio, reloads: 0 };
    audio.addEventListener('loadstart', () => window.musicProbe.reloads++);
    audio.currentTime = 30;
  });
  await page.waitForFunction(() => document.querySelector('audio').currentTime > 30.05);
  const samples = [];
  async function sample(name) {
    const result = await page.evaluate(() => {
      const audio = document.querySelector('audio');
      return { sameElement: audio === window.musicProbe.audio, time: audio.currentTime, paused: audio.paused, reloads: window.musicProbe.reloads, src: audio.src };
    });
    assert.equal(result.sameElement, true, name);
    assert.equal(result.paused, false, name);
    assert.equal(result.reloads, 0, name);
    assert.ok(result.time >= 30, name);
    if (samples.length) assert.ok(result.time >= samples.at(-1).time, name);
    samples.push({ name, ...result });
  }
  await sample('lobby');
  for (let visit = 0; visit < 2; visit++) {
    await page.locator('.base-character-action').click();
    await page.locator('.character-art-stage .interactive-portrait.is-rendered').waitFor();
    await sample(`operative-${visit}`);
    await page.getByRole('button', { name: '전투원 정보 닫기' }).click();
    await page.locator('.base-character-action').waitFor();
    await sample(`lobby-${visit}`);
  }
  await page.getByRole('button', { name: /전술 침투선 나이트자/ }).click();
  await page.waitForFunction(() => document.querySelectorAll('button').length > 0);
  await sample('regions');
  await page.keyboard.press('Escape');
  await page.locator('.base-character-action').waitFor();
  await sample('return-from-regions');
  // Also exercise real HTMLMediaElement seeking across two different MP3s.
  const transport = await page.evaluate(async () => {
    const { createMusicPlayer } = await import('/src/audio/musicPlayer.js');
    const audio = document.createElement('audio'); audio.loop = true;
    document.querySelector('audio').pause();
    const player = createMusicPlayer(audio);
    const wait = () => new Promise((resolve, reject) => {
      audio.addEventListener('playing', resolve, { once: true });
      audio.addEventListener('error', () => reject(new Error('Audio load failed')), { once: true });
    });
    let ready = wait(); player.update({ track: '/assets/audio/last-light-in-haven-09.mp3' }); await ready;
    audio.currentTime = 45;
    ready = wait(); player.update({ track: '/assets/audio/overload-main-theme.mp3' }); await ready;
    audio.currentTime = 12;
    ready = wait(); player.update({ track: '/assets/audio/last-light-in-haven-09.mp3' }); await ready;
    const resumed = audio.currentTime;
    player.update({ track: null }); const silent = audio.paused;
    player.update({ track: undefined }); const loadingStillSilent = audio.paused;
    player.dispose();
    return { resumed, silent, loadingStillSilent };
  });
  assert.ok(transport.resumed >= 45 && transport.resumed < 46);
  assert.equal(transport.silent, true); assert.equal(transport.loadingStillSilent, true);
  assert.deepEqual(errors, []);
  await mkdir(output, { recursive: true });
  const report = { samples, transport, errors };
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally { await browser.close(); }
