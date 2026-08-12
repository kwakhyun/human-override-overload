import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pipeline = await import(new URL("../scripts/generate-google-agent-voice.mjs", import.meta.url));

test("Google Chirp 3 HD pipeline defines one concise Korean callout per manual ability", async () => {
  assert.equal(pipeline.GOOGLE_TTS_LANGUAGE, "ko-KR");
  assert.equal(pipeline.GOOGLE_TTS_VOICE, "ko-KR-Chirp3-HD-Kore");
  assert.equal(pipeline.GOOGLE_TTS_SPEAKING_RATE, 1.3);
  assert.equal(pipeline.GOOGLE_TTS_ENDPOINT, "https://texttospeech.googleapis.com/v1/text:synthesize");
  assert.deepEqual(Object.keys(pipeline.AGENT_VOICE_LINES), [
    "empPulse",
    "aegisWard",
    "stratosRun",
    "helixTempest",
  ]);
  assert.deepEqual(
    Object.values(pipeline.AGENT_VOICE_LINES).map((line) => line.key),
    ["Q", "E", "F", "R"],
  );
  assert.deepEqual(
    Object.values(pipeline.AGENT_VOICE_LINES).map((line) => line.text),
    [
      "전자기 펄스 전개.",
      "이지스 방벽 전개.",
      "항공 지원 개시.",
      "섬멸 모드 개시.",
    ],
  );
  for (const line of Object.values(pipeline.AGENT_VOICE_LINES)) {
    assert.match(line.text, /[가-힣]/);
    assert.doesNotMatch(line.text, /\b(?:deployed|online|confirmed|authorized)\b/i);
    assert.match(line.file, /^[a-z0-9-]+\.mp3$/);
    assert.ok(line.text.length <= 16);
  }
  assert.match(await readFile(new URL("../scripts/generate-google-agent-voice.mjs", import.meta.url), "utf8"), /--abilities=/);
});

test("voice generation keeps credentials out of the browser runtime and repository", async () => {
  const source = await readFile(new URL("../scripts/generate-google-agent-voice.mjs", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
  assert.match(source, /GOOGLE_CLOUD_TTS_ACCESS_TOKEN/);
  assert.match(source, /gcloud\(\["auth", "application-default", "print-access-token"\]\)/);
  assert.match(source, /languageCode: GOOGLE_TTS_LANGUAGE/);
  assert.match(source, /speakingRate: GOOGLE_TTS_SPEAKING_RATE/);
  assert.doesNotMatch(source, /AIza[0-9A-Za-z_-]{20,}/);
  assert.doesNotMatch(app, /texttospeech\.googleapis\.com|GOOGLE_CLOUD|speechSynthesis/);
});
