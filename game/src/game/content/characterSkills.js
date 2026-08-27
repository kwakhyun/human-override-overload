import { sanitizeCharacterId } from "./characters.js";

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

export const CHARACTER_SKILL_SLOTS = Object.freeze(["Q", "E", "F", "R"]);
export const CHARACTER_ABILITY_KEYS = Object.freeze([
  "empPulse",
  "aegisWard",
  "stratosRun",
  "helixTempest",
]);

// Single source of truth for character-owned combat links. A future operative
// can add a loadout without introducing another branch in the simulation.
export const CHARACTER_SKILL_LOADOUTS = deepFreeze({
  aegis: {
    characterId: "aegis",
    progressionId: "aegis-skill-link",
    skills: [
      { slot: "Q", runtimeKey: "empPulse", requiredGrade: 0, name: "EMP Pulse", koreanName: "EMP 펄스" },
      { slot: "E", runtimeKey: "aegisWard", requiredGrade: 1, name: "Aegis Ward", koreanName: "방벽 전개" },
      { slot: "F", runtimeKey: "stratosRun", requiredGrade: 2, name: "Stratos Run", koreanName: "항공 지원" },
      { slot: "R", runtimeKey: "helixTempest", requiredGrade: 3, name: "Helix Tempest", koreanName: "섬멸 모드" },
    ],
  },
  mika: {
    characterId: "mika",
    progressionId: "mika-skill-link",
    skills: [
      { slot: "Q", runtimeKey: "empPulse", requiredGrade: 0, name: "Prism Ricochet", koreanName: "프리즘 허밍" },
      { slot: "E", runtimeKey: "aegisWard", requiredGrade: 1, name: "Ribbon Vortex", koreanName: "리본 와류" },
      { slot: "F", runtimeKey: "stratosRun", requiredGrade: 2, name: "Comet Duet", koreanName: "쌍성 질주" },
      { slot: "R", runtimeKey: "helixTempest", requiredGrade: 3, name: "Heartbeat Carnival", koreanName: "심장박동 카니발" },
    ],
  },
  vesper: {
    characterId: "vesper",
    progressionId: "vesper-skill-link",
    skills: [
      { slot: "Q", runtimeKey: "empPulse", requiredGrade: 0, name: "VECTOR STEP", koreanName: "벡터 스텝" },
      { slot: "E", runtimeKey: "aegisWard", requiredGrade: 1, name: "ZERO MARK", koreanName: "제로 마크" },
      { slot: "F", runtimeKey: "stratosRun", requiredGrade: 2, name: "RAIL BURST", koreanName: "레일 버스트" },
      { slot: "R", runtimeKey: "helixTempest", requiredGrade: 3, name: "DEADLINE", koreanName: "데드라인" },
    ],
  },
  nox: {
    characterId: "nox",
    progressionId: "nox-skill-link",
    skills: [
      { slot: "Q", runtimeKey: "empPulse", requiredGrade: 0, name: "CENSOR GRID", koreanName: "검열 격자" },
      { slot: "E", runtimeKey: "aegisWard", requiredGrade: 1, name: "NULL APPEAL", koreanName: "항소 무효" },
      { slot: "F", runtimeKey: "stratosRun", requiredGrade: 2, name: "RED WARRANT", koreanName: "적색 영장" },
      { slot: "R", runtimeKey: "helixTempest", requiredGrade: 3, name: "FINAL DECREE", koreanName: "최종 판결" },
    ],
  },
});

function createProgressionLine(characterId, copy, unlockRegionId = null) {
  const loadout = CHARACTER_SKILL_LOADOUTS[characterId];
  return {
    id: loadout.progressionId,
    ownerId: "aegis",
    characterId,
    category: "augmentation",
    currencyId: "augmentationCores",
    name: copy.name,
    koreanName: copy.koreanName,
    description: copy.description,
    unlockRegionId,
    ranks: loadout.skills.slice(1).map((skill, index) => ({
      rank: index + 1,
      cost: index + 1,
      requiresCompletedRegions: index + 1,
      unlockAbilityKey: skill.runtimeKey,
      unlockSlot: skill.slot,
      unlockName: skill.koreanName,
      bonuses: {},
    })),
  };
}

export const CHARACTER_SKILL_PROGRESSION_LINES = deepFreeze({
  "aegis-skill-link": createProgressionLine("aegis", {
    name: "AEGIS COMBAT LINK",
    koreanName: "이지스 전투 링크",
    description: "동기화 코어로 전투 링크 등급을 높여 E, F, R 스킬을 순서대로 해금합니다.",
  }),
  "mika-skill-link": createProgressionLine("mika", {
    name: "MIKA COMBAT LINK",
    koreanName: "미카 전투 링크",
    description: "미카의 링블레이드 제어 등급을 높여 E, F, R 스킬을 순서대로 해금합니다.",
  }, "wrong-engine-core"),
  "vesper-skill-link": createProgressionLine("vesper", {
    name: "VESPER COMBAT LINK",
    koreanName: "베스퍼 전투 링크",
    description: "베스퍼의 전술 의식 등급을 높여 E, F, R 스킬을 순서대로 해금합니다.",
  }, "abyssal-archive"),
  "nox-skill-link": createProgressionLine("nox", {
    name: "NOX JUDGMENT LINK",
    koreanName: "녹스 판결 링크",
    description: "동기화 코어로 검은 장부의 전술 권한을 복원해 E, F, R 판결 기술을 순차적으로 해금합니다.",
  }, "neon-foundry"),
});

export const LEGACY_AEGIS_AUGMENTATION_IDS = Object.freeze([
  "aegis-assault-sync",
  "aegis-vital-frame",
  "aegis-reflex-drive",
]);

export const LEGACY_AEGIS_AUGMENTATION_COSTS = Object.freeze([2, 5, 9]);

function maxSkillGrade(loadout) {
  return Math.max(0, ...loadout.skills.map((skill) => Number(skill.requiredGrade) || 0));
}

function clampGrade(value, maximum = 3) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(maximum, Math.floor(number))) : 0;
}

export function sanitizeCharacterSkillRanks(value) {
  const source = value && typeof value === "object" ? value : {};
  return Object.freeze(Object.fromEntries(Object.keys(CHARACTER_SKILL_LOADOUTS).map((characterId) => [
    characterId,
    clampGrade(source[characterId], maxSkillGrade(CHARACTER_SKILL_LOADOUTS[characterId])),
  ])));
}

export function getCharacterSkillLoadout(characterId) {
  return CHARACTER_SKILL_LOADOUTS[sanitizeCharacterId(characterId)];
}

export function getCharacterSkillGrade(progression, characterId) {
  const loadout = getCharacterSkillLoadout(characterId);
  const ranks = progression?.augmentationRanks && typeof progression.augmentationRanks === "object"
    ? progression.augmentationRanks
    : progression;
  return clampGrade(ranks?.[loadout.progressionId], maxSkillGrade(loadout));
}

export function getCharacterSkillRanks(progression) {
  return sanitizeCharacterSkillRanks(Object.fromEntries(Object.keys(CHARACTER_SKILL_LOADOUTS).map((characterId) => [
    characterId,
    getCharacterSkillGrade(progression, characterId),
  ])));
}

export function getCharacterAbilityUnlockState(characterSkillRanks, characterId, runtimeKey) {
  const loadout = getCharacterSkillLoadout(characterId);
  const skill = loadout.skills.find((entry) => entry.runtimeKey === runtimeKey) || null;
  const grade = clampGrade(characterSkillRanks?.[loadout.characterId], maxSkillGrade(loadout));
  const requiredGrade = skill?.requiredGrade ?? Number.POSITIVE_INFINITY;
  return Object.freeze({
    characterId: loadout.characterId,
    progressionId: loadout.progressionId,
    grade,
    skill,
    requiredGrade,
    unlocked: Boolean(skill) && grade >= requiredGrade,
  });
}

export function isCharacterAbilityUnlocked(characterSkillRanks, characterId, runtimeKey) {
  return getCharacterAbilityUnlockState(characterSkillRanks, characterId, runtimeKey).unlocked;
}
