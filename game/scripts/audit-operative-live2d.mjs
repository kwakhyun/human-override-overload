import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPlayableCharacters } from "../src/game/content/characters.js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function nonemptyFile(file) {
  try {
    const info = await stat(file);
    return info.isFile() && info.size > 0;
  } catch { return false; }
}

export async function auditModelBundle(directory, characterId) {
  const errors = [];
  const folder = path.resolve(directory, characterId);
  const manifestPath = path.join(folder, `${characterId}.model3.json`);
  let manifest;
  try { manifest = JSON.parse(await readFile(manifestPath, "utf8")); }
  catch { return { characterId, manifestPath, filesReady: false, errors: ["모델 설정 파일이 없거나 올바른 JSON이 아닙니다."], visualQuality: "not-evaluated" }; }
  if (manifest?.Version !== 3) errors.push("model3 Version은 3이어야 합니다.");
  const refs = manifest?.FileReferences || {};
  const files = [];
  const requireFile = (label, value) => {
    if (typeof value !== "string" || !value.trim()) errors.push(`${label} 파일 참조가 없습니다.`);
    else files.push({ label, value });
  };
  requireFile("Moc", refs.Moc);
  requireFile("Physics", refs.Physics);
  if (!Array.isArray(refs.Textures) || !refs.Textures.length) errors.push("텍스처가 없습니다.");
  else refs.Textures.forEach((file, index) => requireFile(`Texture ${index}`, file));
  if (!Array.isArray(refs.Motions?.Idle) || !refs.Motions.Idle.length) errors.push("Idle 모션이 없습니다.");
  if (!Array.isArray(refs.Expressions) || !refs.Expressions.length) errors.push("표정 파일이 없습니다.");
  if (refs.Motions && typeof refs.Motions === "object") {
    for (const [group, motions] of Object.entries(refs.Motions)) {
      if (!Array.isArray(motions)) { errors.push(`${group} 모션 목록이 잘못되었습니다.`); continue; }
      motions.forEach((motion, index) => requireFile(`${group} ${index}`, motion?.File));
    }
  }
  if (Array.isArray(refs.Expressions)) refs.Expressions.forEach((expression, index) => requireFile(`Expression ${index}`, expression?.File));
  for (const optional of ["Pose", "DisplayInfo", "UserData"]) if (refs[optional]) requireFile(optional, refs[optional]);
  for (const { label, value } of files) {
    const resolved = path.resolve(folder, value);
    const relative = path.relative(folder, resolved);
    if (/^[a-z]+:/i.test(value) || path.isAbsolute(value) || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
      errors.push(`${label}: 모델 폴더 내부의 상대 파일 경로를 사용하세요.`);
    } else if (!await nonemptyFile(resolved)) errors.push(`${label}: 참조 파일이 없거나 비어 있습니다 (${value}).`);
  }
  return { characterId, manifestPath, filesReady: errors.length === 0, checkedReferences: files.length, errors, visualQuality: "not-evaluated" };
}

async function main() {
  const directory = path.resolve(process.argv[2] || path.join(projectRoot, "reference/source-assets/overload/live2d-production"));
  const results = await Promise.all(getPlayableCharacters().map(({ id }) => auditModelBundle(directory, id)));
  console.log(JSON.stringify({ directory, status: "file-readiness-only", results }, null, 2));
  if (results.some((result) => !result.filesReady)) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
