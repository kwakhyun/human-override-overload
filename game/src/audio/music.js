import {
  BASE_BGM_PATH,
  REGION_BGM_PATHS,
  TITLE_BGM_PATH,
} from "../game/assets/manifest.ts";

export function resolveMusicTrack(screen, regionId) {
  if (screen === "intro") return TITLE_BGM_PATH;
  if (["base", "flight-operations", "defense-select", "defense-result"].includes(screen)) return BASE_BGM_PATH;
  if (screen === "defense") return REGION_BGM_PATHS["wrong-engine-core"] || null;
  if (screen === "game") return REGION_BGM_PATHS[regionId] || null;
  return null;
}

export function musicTrackLabel(screen, regionId) {
  if (screen === "intro") return "잿빛 하늘 아래";
  if (["base", "flight-operations", "defense-select", "defense-result"].includes(screen)) return "LAST LIGHT IN HAVEN-09";
  if (screen === "defense") return "OVERLOAD MAIN THEME";
  if (screen === "game" && regionId === "wrong-engine-core") return "OVERLOAD MAIN THEME";
  if (screen === "game" && regionId === "glass-dune") return "REFRACTION WAR";
  if (screen === "game" && regionId === "abyssal-archive") return "MEMORY BELOW PRESSURE";
  return "배경음악 없음";
}
