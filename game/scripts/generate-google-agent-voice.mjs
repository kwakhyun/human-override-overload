import { execFileSync } from "node:child_process";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
export const AGENT_VOICE_OUTPUT_DIRECTORY = path.resolve(scriptDirectory, "../public/assets/audio/agent");
export const GOOGLE_TTS_ENDPOINT = "https://texttospeech.googleapis.com/v1/text:synthesize";
export const GOOGLE_TTS_LANGUAGE = "ko-KR";
export const GOOGLE_TTS_VOICE = "ko-KR-Chirp3-HD-Kore";
export const GOOGLE_TTS_SPEAKING_RATE = 1.3;

export const AGENT_VOICE_LINES = Object.freeze({
  empPulse: Object.freeze({
    key: "Q",
    file: "emp-pulse-start.mp3",
    text: "EMP 전개.",
  }),
  aegisWard: Object.freeze({
    key: "E",
    file: "aegis-ward-start.mp3",
    text: "방벽 전개.",
  }),
  stratosRun: Object.freeze({
    key: "F",
    file: "stratos-run-v2.mp3",
    text: "지원 폭격 개시.",
  }),
  helixTempest: Object.freeze({
    key: "R",
    file: "helix-tempest-start.mp3",
    text: "섬멸 모드 개시.",
  }),
});

function gcloud(args) {
  try {
    const command = process.platform === "win32"
      ? (process.env.ComSpec || "cmd.exe")
      : "gcloud";
    const commandArgs = process.platform === "win32"
      ? ["/d", "/s", "/c", "gcloud.cmd", ...args]
      : args;
    return execFileSync(command, commandArgs, {
      encoding: "utf8",
      windowsHide: true,
    }).trim();
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
      voice: { languageCode: GOOGLE_TTS_LANGUAGE, name: GOOGLE_TTS_VOICE },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: GOOGLE_TTS_SPEAKING_RATE,
      },
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

export async function generateAgentVoice(abilities = Object.keys(AGENT_VOICE_LINES)) {
  const credentials = resolveCredentials();
  await mkdir(AGENT_VOICE_OUTPUT_DIRECTORY, { recursive: true });
  const pending = [];
  try {
    for (const ability of abilities) {
      const line = AGENT_VOICE_LINES[ability];
      if (!line) throw new Error(`Unknown agent voice ability: ${ability}`);
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
    language: GOOGLE_TTS_LANGUAGE,
    voice: GOOGLE_TTS_VOICE,
    speakingRate: GOOGLE_TTS_SPEAKING_RATE,
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
    const abilityArgument = process.argv.find((argument) => argument.startsWith("--abilities="));
    const abilities = abilityArgument
      ? abilityArgument.slice("--abilities=".length).split(",").map((ability) => ability.trim()).filter(Boolean)
      : undefined;
    generateAgentVoice(abilities)
      .then((outputs) => console.log(JSON.stringify(outputs, null, 2)))
      .catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
      });
  }
}
