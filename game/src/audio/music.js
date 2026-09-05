import {
  BASE_BGM_PATH,
  DEFENSE_BGM_PATH,
  RECRUITMENT_BGM_PATH,
  REGION_BGM_PATHS,
  TITLE_BGM_PATH,
} from "../game/assets/manifest.ts";

export function resolveMusicTrack(screen, regionId) {
  if (["loading", "guide", "sword-guide"].includes(screen)) return undefined;
  if (screen === "intro") return TITLE_BGM_PATH;
  if (["base", "regions", "flight-operations", "defense-select", "defense-result"].includes(screen)) return BASE_BGM_PATH;
  if (screen === "defense") return DEFENSE_BGM_PATH;
  if (["recruit", "vesper-recruit", "nox-recruit"].includes(screen)) return RECRUITMENT_BGM_PATH;
  if (screen === "game") return REGION_BGM_PATHS[regionId] || null;
  return null;
}

export function musicTrackGain(track) {
  if (track === RECRUITMENT_BGM_PATH) return 0.30;
  if (track === REGION_BGM_PATHS["neon-foundry"]) return 0.36;
  return track === TITLE_BGM_PATH ? 0.34 : 0.38;
}

export function musicTrackLabel(screen, regionId) {
  if (screen === "intro") return "잿빛 하늘 아래";
  if (["base", "regions", "flight-operations", "defense-select", "defense-result"].includes(screen)) return "LAST LIGHT IN HAVEN-09";
  if (["loading", "guide", "sword-guide"].includes(screen)) return "이전 화면의 음악 유지";
  if (screen === "defense") return "기지 방어전";
  if (["recruit", "vesper-recruit", "nox-recruit"].includes(screen)) return "영입 · 동기화";
  if (screen === "game" && regionId === "wrong-engine-core") return "OVERLOAD MAIN THEME";
  if (screen === "game" && regionId === "glass-dune") return "REFRACTION WAR";
  if (screen === "game" && regionId === "abyssal-archive") return "MEMORY BELOW PRESSURE";
  if (screen === "game" && regionId === "neon-foundry") return "네온 주조구";
  if (screen === "game" && regionId === "storm-spire") return "폭풍 첨탑";
  if (screen === "game" && regionId === "gene-vault") return "생체 금고";
  return "배경음악 없음";
}
