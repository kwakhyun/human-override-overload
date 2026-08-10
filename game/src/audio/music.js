import {
  BASE_BGM_PATH,
  REGION_BGM_PATHS,
  TITLE_BGM_PATH,
} from "../game/assets/manifest.ts";

export function resolveMusicTrack(screen, regionId) {
  if (screen === "intro") return TITLE_BGM_PATH;
  if (screen === "base") return BASE_BGM_PATH;
  if (screen === "game") return REGION_BGM_PATHS[regionId] || null;
  return null;
}

export function musicTrackLabel(screen, regionId) {
  if (screen === "intro") return "잿빛 하늘 아래";
  if (screen === "base") return "헤이븐-09 로비";
  if (screen === "game" && regionId === "wrong-engine-core") return "OVERLOAD MAIN THEME";
  if (screen === "game" && regionId === "glass-dune") return "유리 사구 전투";
  if (screen === "game" && regionId === "abyssal-archive") return "심해 기록고 전투";
  return "배경음악 없음";
}
