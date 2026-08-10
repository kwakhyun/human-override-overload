import { execFileSync } from "node:child_process";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
export const AGENT_VOICE_OUTPUT_DIRECTORY = path.resolve(scriptDirectory, "../public/assets/audio/agent");
export const GOOGLE_TTS_ENDPOINT = "https://texttospeech.googleapis.com/v1/text:synthesize";
export const GOOGLE_TTS_VOICE = "en-US-Chirp3-HD-Kore";

export const AGENT_VOICE_LINES = Object.freeze({
  empPulse: Object.freeze({
    key: "Q",
    file: "emp-pulse-online.mp3",
    text: "EMP pulse deployed. Hostile systems suspended.",
  }),
  aegisWard: Object.freeze({
    key: "E",
    file: "aegis-ward-online.mp3",
    text: "Aegis Ward online. Defensive envelope stabilized.",
  }),
  stratosRun: Object.freeze({
    key: "F",
    file: "stratos-run-confirmed.mp3",
    text: "Stratos Run confirmed. Air support entering the combat zone.",
  }),
  helixTempest: Object.freeze({
    key: "R",
    file: "helix-tempest-authorized.mp3",
    text: "Helix Tempest authorized. Full-spectrum assault engaged.",
  }),
});

function gcloud(args) {
  try {
    return execFileSync("gcloud", args, { encoding: "utf8", windowsHide: true }).trim();
  } catch {
    return "";
  }
}

function resolveCredentials() {
  const accessToken = process.env.GOOGLE_CLOUD_TTS_ACCESS_TOKEN
    || gcloud(["auth", "application-default", "print-access-token"]);
  const projectId = process.env.GOOGLE_CLOUD_PROJECT
    || process.env.GCLOUD_PROJECT
    || gcloud(["config", "get-value", "project"]);
  if (!accessToken || !projectId || projectId === "(unset)") {
    throw new Error(
      "Google Cloud ADC is unavailable. Install gcloud, enable Cloud Text-to-Speech, run "
      + "`gcloud auth application-default login`, and set GOOGLE_CLOUD_PROJECT before retrying.",
    );
  }
  return { accessToken, projectId };
}

async function synthesize(line, credentials) {
  const response = await fetch(GOOGLE_TTS_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${credentials.accessToken}`,
      "Content-Type": "application/json; charset=utf-8",
      "x-goog-user-project": credentials.projectId,
    },
    body: JSON.stringify({
      input: { text: line.text },
      voice: { languageCode: "en-US", name: GOOGLE_TTS_VOICE },
      audioConfig: { audioEncoding: "MP3" },
    }),
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 600);
    throw new Error(`Google Cloud TTS ${response.status}: ${detail}`);
  }
  const payload = await response.json();
  if (!payload.audioContent) throw new Error("Google Cloud TTS returned no audioContent.");
  return Buffer.from(payload.audioContent, "base64");
}

export async function generateAgentVoice() {
  const credentials = resolveCredentials();
  await mkdir(AGENT_VOICE_OUTPUT_DIRECTORY, { recursive: true });
  const pending = [];
  try {
    for (const [ability, line] of Object.entries(AGENT_VOICE_LINES)) {
      const outputPath = path.join(AGENT_VOICE_OUTPUT_DIRECTORY, line.file);
      const temporaryPath = `${outputPath}.tmp`;
      const audio = await synthesize(line, credentials);
      await writeFile(temporaryPath, audio);
      pending.push({ ability, outputPath, temporaryPath, bytes: audio.byteLength });
    }
    for (const output of pending) await rename(output.temporaryPath, output.outputPath);
  } catch (error) {
    await Promise.all(pending.map((output) => rm(output.temporaryPath, { force: true })));
    throw error;
  }
  return pending.map(({ ability, outputPath, bytes }) => ({ ability, outputPath, bytes }));
}

function printPlan() {
  console.log(JSON.stringify({
    endpoint: GOOGLE_TTS_ENDPOINT,
    voice: GOOGLE_TTS_VOICE,
    outputDirectory: AGENT_VOICE_OUTPUT_DIRECTORY,
    lines: AGENT_VOICE_LINES,
  }, null, 2));
}

const invokedDirectly = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  if (process.argv.includes("--dry-run")) {
    printPlan();
  } else {
    generateAgentVoice()
      .then((outputs) => console.log(JSON.stringify(outputs, null, 2)))
      .catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
      });
  }
}
