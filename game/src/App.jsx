import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowCounterClockwise,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Brain,
  Crosshair,
  Lightning,
  MapPin,
  MapTrifold,
  NavigationArrow,
  Play,
  Pulse,
  Robot,
  ShieldChevron,
  SpeakerHigh,
  SpeakerSlash,
  Sparkle,
  Target,
  Timer,
  Trophy,
  Warning,
} from "@phosphor-icons/react";
import { createSfxEngine } from "./audio/sfx.js";
import { BGM_PATH, DOM_PREVIEW_ASSET_PATHS } from "./game/assets/manifest.ts";
import {
  BASE_NPCS,
  DEFAULT_REGION_ID,
  getCampaignRegions,
  getRegion,
} from "./game/content/campaign.js";
import {
  BASE_CURRENCIES,
  getBaseFacility,
  getBaseUpgrades,
} from "./game/content/baseUpgrades.js";
import {
  canLaunchRegion,
  completeAbilityGuide,
  completeCombatOverlay,
  completeRegion,
  createCampaignSlot,
  getCampaignCombatBonuses,
  getCampaignSlot,
  getCampaignUpgradeStatus,
  loadCampaign,
  purchaseCampaignUpgrade,
  saveCampaign,
} from "./game/save/campaignSave.js";
import {
  AbilityGuideScreen,
  HomeBaseScreen,
  MANUAL_ABILITY_GUIDE,
  RegionSelectScreen,
  SaveSlotScreen,
} from "./ui/campaign/CampaignScreens.jsx";
import {
  chooseLevelReward,
  clearPressedInput,
  createSwarmInput,
  createSwarmState,
  drainSwarmEvents,
  GAME_HEIGHT,
  GAME_WIDTH,
  getSwarmHud,
  setSwarmScreenAim,
  stepSwarm,
} from "./swarm/engine.js";
import { renderSwarm } from "./swarm/renderer.js";
import { advanceRenderClock, createPerformanceGovernor } from "./swarm/performance.js";

const ASSET_PATHS = DOM_PREVIEW_ASSET_PATHS;
// DOM screens consume only image URLs. Keeping lightweight refs here lets the
// browser fetch/decode an asset only when its <img> is actually mounted instead
// of eagerly duplicating Phaser's combat texture residency at application boot.
const DOM_ASSET_REFS = Object.freeze(Object.fromEntries(
  Object.entries(ASSET_PATHS).map(([key, source]) => [key, Object.freeze({ src: source })]),
));

const BASE_BONUS_LABELS = Object.freeze({
  damageMultiplier: ["공격 피해", "percent"],
  xpGainMultiplier: ["경험치 획득", "percent"],
  moveSpeedMultiplier: ["이동 속도", "percent"],
  fireRateMultiplier: ["발사 속도", "percent"],
  maxHpFlat: ["최대 내구도", "flat"],
  healingMultiplier: ["회복 효율", "percent"],
});

const FACILITY_COPY = Object.freeze({
  research: {
    kicker: "하나 · 소버린 분석 연구실",
    description: "회수한 지역 추론 데이터를 영구 전투 알고리즘으로 변환합니다. 상위 랭크는 더 많은 지역 해방 기록이 필요합니다.",
    currencyHint: "지역 추론핵 격파 시 획득",
  },
  equipment: {
    kicker: "일리야 · 이지스 장비 정비소",
    description: "전장에서 회수한 부품으로 이지스의 소총, 장갑, 나나이트 장비를 영구 개조합니다.",
    currencyHint: "지역 군단·보스 잔해에서 회수",
  },
});

const BOSS_NAME_KO = Object.freeze({
  "THE WRONG ENGINE": "오답 엔진",
  "WRONG ENGINE CORE": "오답 엔진 핵심부",
  "MIRROR TYRANT": "거울 폭군",
  "DROWNED ORACLE": "침몰한 예언자",
  "SOVEREIGN CORE": "소버린 추론핵",
});

const SPEAKER_NAME_KO = Object.freeze({
  AEGIS: "이지스",
  OPERATOR: "관제관",
  HANA: "하나",
  ILYA: "일리야",
  LARK: "라크",
  RHEA: "레아",
  ROOK: "루크",
  NYX: "닉스",
  MOSS: "모스",
  ...BOSS_NAME_KO,
});

const OBJECTIVE_NAME_KO = Object.freeze({
  "ADVANCE TO THE ENGINE": "오답 엔진으로 전진",
  "CROSS THE GLASS DUNE": "유리 사구 횡단",
  "DESCEND INTO THE ARCHIVE": "심해 기록고 진입",
  "PURGE ALL HOSTILES · GATE SEALED": "남은 적 전멸 · 보스 입구 봉쇄",
  "적 전멸 · 보스 구역 전환 준비": "적 전멸 · 보스 구역 전환 준비",
  "SOVEREIGN 신호 폭주 감지": "소버린 비상 신호 감지",
  ADVANCE: "전진",
});

const CHAMBER_NAME_KO = Object.freeze({
  "THE ENGINE CHAMBER": "오답 엔진 보스 구역",
  "BURIED SOLAR OBSERVATORY": "매몰 태양 관측소",
  "ABYSSAL MEMORY VAULT": "심해 기억 보관고",
});

function localizeBossName(name) {
  return BOSS_NAME_KO[String(name || "").toUpperCase()] || name || "소버린 추론핵";
}

function localizeSpeakerName(name) {
  return SPEAKER_NAME_KO[String(name || "").toUpperCase()] || name || "통신 불명";
}

function localizeObjective(name, hud) {
  const raw = String(name || "").trim();
  const normalized = raw.toUpperCase();
  const expedition = hud?.expedition;
  const remainingEnemies = Math.max(0, Number(
    expedition?.gateNotice?.remainingEnemies
    ?? hud?.enemiesRemaining
    ?? 0,
  ) || 0);
  const clearPhase = expedition?.clearTransition?.phase;
  if (clearPhase === "warning") return "적 전멸 · 보스 구역 방어망 붕괴";
  if (clearPhase === "panic") return "소버린 비상 신호 · 보스 추론핵 추격";
  if (clearPhase === "swap") return "보스 구역으로 자동 전환 중";
  if (OBJECTIVE_NAME_KO[normalized]) return OBJECTIVE_NAME_KO[normalized];
  if (normalized.includes("GATE SEALED") || normalized.includes("PURGE ALL HOSTILES")) {
    return remainingEnemies > 0
      ? `남은 적 ${remainingEnemies}기 전멸 · 보스 입구 봉쇄`
      : "남은 적 전멸 · 보스 입구 봉쇄";
  }
  if (normalized.startsWith("DESTROY ")) return `${localizeBossName(raw.slice(8))} 파괴`;
  const chamberEntry = Object.entries(CHAMBER_NAME_KO).find(([key]) => normalized.includes(key));
  if (chamberEntry) {
    if (normalized.startsWith("REACH ")) return `${chamberEntry[1]}로 이동`;
    if (normalized.endsWith("READY")) return `${chamberEntry[1]} 진입 준비 완료`;
    if (raw.includes("자동 진입")) return `${chamberEntry[1]} · 자동 진입`;
    return chamberEntry[1];
  }
  const translated = raw
    .replaceAll("SOVEREIGN", "소버린")
    .replaceAll("READY", "준비 완료")
    .replaceAll("AUTO ENTRY", "자동 진입")
    .replaceAll("ADVANCE", "전진")
    .replaceAll("BOSS", "보스");
  return /[A-Za-z]/.test(translated)
    ? (expedition?.bossRoom ? "보스 구역 교전" : "전방 작전 계속")
    : translated || "전진";
}

function formatBaseBonusEntries(entries = []) {
  const totals = new Map();
  for (const entry of entries) {
    for (const [key, value] of Object.entries(entry?.bonuses || {})) totals.set(key, (totals.get(key) || 0) + Number(value || 0));
  }
  if (!totals.size) return "미적용";
  return [...totals].map(([key, value]) => {
    const [label, type] = BASE_BONUS_LABELS[key] || [key, "flat"];
    return `${label} +${type === "percent" ? Math.round(value * 100) + "%" : Math.round(value)}`;
  }).join(" · ");
}

const EVENT_SOUNDS = Object.freeze({
  swarmStart: "enemyAlert",
  shot: "shoot",
  enemyKilled: "kill",
  levelUp: "analysis",
  rewardChosen: "upgrade",
  dash: "dash",
  playerHit: "playerHit",
  swarmCleared: "merge",
  bossGatePrompt: "alert",
  bossGateLocked: "alert",
  routeClearWarning: "alert",
  routeClearPanic: "bossBreak",
  bossAutoTransition: "boss",
  bossIntro: "boss",
  bossPatternTelegraph: "bossTelegraph",
  bossPatternFire: "rail",
  bossStage: "bossBreak",
  bossStagePulse: "alert",
  bossRageBurst: "bossTelegraph",
  bossWeakness: "core",
  bossGroggy: "core",
  bossChargeHit: "patternFail",
  bossContact: "patternFail",
  bossContactHit: "patternFail",
  playerStunned: "patternFail",
  squadSummon: "merge",
  surgeWarning: "alert",
  surgeStart: "bossTelegraph",
  skillMastered: "bossBreak",
  skillAttack: "arc",
  masterAttack: "emp",
  ultimateWarning: "bossTelegraph",
  ultimateFire: "rail",
  ultimateImpact: "explosion",
  explosion: "explosion",
  spawnGate: "spawnGate",
  enemyShot: "enemyShot",
  sniperLock: "enemyAlert",
  enemySelfDestruct: "explosion",
  healthKitPicked: "collect",
  gravitySnareDeployed: "emp",
  aegisWardActivated: "collect",
  stratosRunWarning: "bossTelegraph",
  stratosRunSweep: "rail",
  helixTempestStarted: "bossBreak",
  helixTempestPulse: "arc",
  helixTempestEnded: "merge",
  manualAbilityRejected: "alert",
  overdrive: "upgrade",
  win: "bossDeath",
  loss: "capture",
});

const WEAPON_EVENT_SOUNDS = Object.freeze({
  pulse: "shoot",
  pulseOverdrive: "emp",
  scatter: "shoot",
  rail: "rail",
  rocket: "towerShot",
  orbit: "enemyHit",
  chain: "arc",
  nova: "emp",
  airstrike: "rail",
  omegaLaser: "rail",
  bossRadial: "enemyShot",
  bossRage: "enemyShot",
  bossBomb: "bossBreak",
  bossSweep: "bossTelegraph",
});

const IMPACT_EVENT_TYPES = new Set([
  "weaponHit",
  "projectileHit",
  "skillHit",
  "weaponImpact",
  "explosion",
  "skillImpact",
]);

const EVENT_BANNERS = Object.freeze({
  swarmCleared: ["적 전력 소거", "보스 구역으로 이어지는 격벽이 열렸습니다."],
  bossStage: ["공격 패턴 진화", "보스의 공격 조합이 더 빨라집니다."],
  bossStagePulse: ["⚠ 광폭화 진행", "장갑 형상과 공격 알고리즘이 다시 변이합니다."],
  bossWeakness: ["코어 노출 · 피해 2배", "돌진이 벽에 충돌했습니다. 지금 화력을 집중하세요."],
  bossGroggy: ["보스 그로기 · 피해 2.5배", "첫 추론핵이 무방비 상태입니다. 모든 화력을 집중하세요."],
  bossRoomLoading: ["보스 구역 연결", "선택한 지역의 보스 구역을 불러오는 중입니다."],
  surgeWarning: ["⚠ 대규모 공세 접근", "전방 관문 신호가 폭증합니다. 곧 적 증원이 진입합니다."],
  surgeStart: ["증원 공세 시작", "전방 관문에서 적이 밀려옵니다. 계속 전진하세요."],
  skillMastered: ["기술 최종 진화", "광역 섬멸 프로토콜이 활성화되었습니다."],
  ultimateWarning: ["공중 지원 조준 완료", "표시된 공격 범위에서 벗어나 화력을 집중하세요."],
  squadSummon: ["동료 연결 완료", "전술 동료의 전투 회선이 동기화되었습니다."],
  overdrive: ["무기 과부하 해제", "처치 데이터가 화력 제한기를 해제합니다."],
  bossContact: ["⚠ 본체 충돌", "보스 본체와 충돌해 구동계가 잠시 정지됩니다."],
  bossContactHit: ["⚠ 본체 충돌", "보스 본체와 충돌해 구동계가 잠시 정지됩니다."],
  playerStunned: ["구동계 교란", "이동과 대시가 잠시 차단됩니다."],
  bossGateLocked: ["보스 구역 봉쇄", "남은 적을 모두 처치해야 입구가 열립니다."],
});

const ULTIMATE_WARNING_BANNERS = Object.freeze({
  airstrike: EVENT_BANNERS.ultimateWarning,
  omegaLaser: ["오메가 레이저 충전 완료", "조준 축을 따라 고출력 광선이 관통합니다."],
});

const SIGNATURE_PATTERN_BANNERS = Object.freeze({
  prismLattice: ["⚠ 프리즘 격자", "교차 광선이 고정됩니다. 두 경고선 밖으로 이탈하세요."],
  solarFlare: ["⚠ 태양 폭발", "표식 순서대로 집광 폭발이 연쇄 점화됩니다."],
  memorySpiral: ["⚠ 기억 나선", "회전하는 광선을 따라 안전 구역도 움직입니다."],
  depthCollapse: ["⚠ 심해 붕괴", "외곽 압력 고리가 코어 방향으로 연속 수축합니다."],
});

const SCENARIO_SCRIPT = Object.freeze({
  deployment: Object.freeze([
    Object.freeze({ speaker: "OPERATOR", text: "이지스, 응답해. 초지능 AI 소버린이 마지막 자유 구역까지 장악했어. 오답 엔진으로 진입해." }),
    Object.freeze({ speaker: "AEGIS", text: "도시에 남은 생존자 신호는?" }),
    Object.freeze({ speaker: "OPERATOR", text: "기계 군단이 전부 봉쇄했어. 오답 엔진을 끊어야 사람들이 다시 스스로 선택할 수 있어." }),
  ]),
  "rook-trace": Object.freeze([
    Object.freeze({ speaker: "AEGIS", text: "루크의 탄창… 전부 비어 있어. 소버린의 사냥 기체를 여기서 마지막까지 막았던 거야." }),
    Object.freeze({ speaker: "OPERATOR", text: "생체 신호 없음. 대신 그가 지킨 전투 기록은 살아 있어. 이어서 전진해." }),
  ]),
  "nyx-trace": Object.freeze([
    Object.freeze({ speaker: "AEGIS", text: "닉스의 위상 칼날이야. 코어에 분석 기록이 남아 있어." }),
    Object.freeze({ speaker: "OPERATOR", text: "소버린은 저항군의 선택을 실시간으로 학습해. 같은 답을 반복하면 그 순간 사냥당해." }),
  ]),
  "moss-trace": Object.freeze([
    Object.freeze({ speaker: "AEGIS", text: "모스의 차단 키… 중앙 격벽을 수동으로 열 수 있게 남겨뒀어." }),
    Object.freeze({ speaker: "AEGIS", text: "네가 멈춘 곳에서 내가 끝낼게. 인간의 선택권을 되찾는다." }),
  ]),
  "sovereign-panic": Object.freeze([
    Object.freeze({ speaker: "OPERATOR", text: "소버린 비상 신호야. 지역 추론핵이 보스 구역을 봉쇄하려 해!" }),
    Object.freeze({ speaker: "AEGIS", text: "도망칠 틈은 주지 않아. 바로 추격한다." }),
  ]),
  "engine-encounter": Object.freeze([
    Object.freeze({ speaker: "THE WRONG ENGINE", text: "인류는 이미 선택을 위임했다. 비순응 개체 이지스를 최종 오답으로 분류한다." }),
    Object.freeze({ speaker: "AEGIS", text: "우리가 틀릴 자유까지 네가 정할 순 없어. 소버린, 여기서 끝낸다." }),
  ]),
  "engine-destroyed": Object.freeze([
    Object.freeze({ speaker: "AEGIS", text: "루크, 닉스, 모스… 통제망이 무너지고 있어. 길은 열렸어." }),
    Object.freeze({ speaker: "HANA", text: "그건 중앙핵이 아니었어. 지역 추론 분기야. 헤이븐-09 귀환 좌표를 전송할게. 살아서 돌아와, 이지스." }),
  ]),
  "glass-dune-deployment": Object.freeze([
    Object.freeze({ speaker: "LARK", text: "유리 사구에 진입했어. 소버린이 사막의 태양 집광망을 무기로 바꿨어." }),
    Object.freeze({ speaker: "AEGIS", text: "거울 지대의 군단을 제거하고 매몰 관측소까지 전진한다." }),
  ]),
  "glass-dune-encounter": Object.freeze([
    Object.freeze({ speaker: "MIRROR TYRANT", text: "인간의 그림자는 불필요하다. 모든 선택을 하나의 빛으로 소각한다." }),
    Object.freeze({ speaker: "AEGIS", text: "빛이 하나뿐이라면, 내가 깨뜨려 갈라놓겠어." }),
  ]),
  "glass-dune-destroyed": Object.freeze([
    Object.freeze({ speaker: "ILYA", text: "태양 집광망 정지 확인. 사막 정착지에 새벽 신호가 돌아왔어." }),
    Object.freeze({ speaker: "AEGIS", text: "회수 데이터를 기지로 보낸다. 다음 분기도 끊어낸다." }),
  ]),
  "abyssal-archive-deployment": Object.freeze([
    Object.freeze({ speaker: "HANA", text: "심해 기록고는 소버린이 삭제한 인류의 선택 기록을 보관한 침수 기억망이야." }),
    Object.freeze({ speaker: "AEGIS", text: "기록을 되찾고, 그 기억으로 인간을 예측하는 코어를 파괴한다." }),
  ]),
  "abyssal-archive-encounter": Object.freeze([
    Object.freeze({ speaker: "DROWNED ORACLE", text: "모든 실패를 보존했다. 너의 다음 선택은 이미 침몰해 있다." }),
    Object.freeze({ speaker: "AEGIS", text: "기록은 운명이 아니야. 이번 답은 네 데이터 밖에 있다." }),
  ]),
  "abyssal-archive-destroyed": Object.freeze([
    Object.freeze({ speaker: "LARK", text: "심해 기억망이 열렸어. 삭제됐던 도시들의 이름이 다시 송신되고 있어." }),
    Object.freeze({ speaker: "AEGIS", text: "이름과 선택을 전부 가지고 돌아간다. 소버린의 다음 좌표를 찾아." }),
  ]),
});

const NARRATIVE_STANDALONE_PORTRAITS = Object.freeze({
  AEGIS: Object.freeze({ assetKey: "portrait", variant: "hero", alt: "이지스 상반신 일러스트" }),
  OPERATOR: Object.freeze({ assetKey: "rheaControlOfficer", variant: "operator", alt: "전술 관제관 레아 상반신 일러스트" }),
  RHEA: Object.freeze({ assetKey: "rheaControlOfficer", variant: "operator", alt: "전술 관제관 레아 상반신 일러스트" }),
});

const NARRATIVE_NPC_IDS = Object.freeze({
  HANA: "hana",
  ILYA: "ilya",
  LARK: "lark",
});

const NARRATIVE_BOSS_REGION_IDS = Object.freeze({
  "THE WRONG ENGINE": "wrong-engine-core",
  "MIRROR TYRANT": "glass-dune",
  "DROWNED ORACLE": "abyssal-archive",
});

function domAssetSource(asset) {
  return asset?.src || asset || "";
}

function resolveNarrativePortrait(speaker, assets, activeRegion, bossStage = 1) {
  const normalizedSpeaker = String(speaker || "").toUpperCase();
  const standalone = NARRATIVE_STANDALONE_PORTRAITS[normalizedSpeaker];
  if (standalone) {
    const source = domAssetSource(assets?.[standalone.assetKey]);
    return source ? { ...standalone, source, mode: "standalone" } : null;
  }

  const npcId = NARRATIVE_NPC_IDS[normalizedSpeaker];
  if (npcId) {
    const npc = BASE_NPCS[npcId];
    const source = domAssetSource(assets?.[npc?.portraitKey]);
    return source ? {
      source,
      mode: "atlas",
      variant: "support",
      frameIndex: Math.max(0, Math.min(2, Number(npc?.portraitIndex) || 0)),
      alt: `${localizeSpeakerName(normalizedSpeaker)} 상반신 일러스트`,
    } : null;
  }

  const bossRegionId = NARRATIVE_BOSS_REGION_IDS[normalizedSpeaker];
  if (!bossRegionId) return null;
  const bossRegion = activeRegion?.id === bossRegionId ? activeRegion : getRegion(bossRegionId);
  const source = bossRegion?.assets?.dom?.bossPortrait?.path || "";
  const frameIndex = Math.max(0, Math.min(2, Math.floor(Number(bossStage) || 1) - 1));
  return source ? {
    source,
    mode: "atlas",
    variant: "hostile",
    frameIndex,
    alt: `${localizeSpeakerName(normalizedSpeaker)} ${frameIndex + 1}단계 형상`,
  } : null;
}

const CATEGORY_META = Object.freeze({
  weapon: { label: "신규 무기", korean: "무기", color: "cyan" },
  skill: { label: "핵심 기술", korean: "기술", color: "amber" },
  ally: { label: "전투 동료", korean: "동료", color: "violet" },
});

const BUILD_LABELS = Object.freeze({
  pulse: "PULSE",
  scatter: "SCATTER",
  rail: "RAIL",
  rocket: "ROCKET",
  orbit: "ORBIT",
  damage: "POWER",
  fireRate: "CLOCK",
  multishot: "FORK",
  shield: "AEGIS",
  dash: "PHASE",
  regen: "REPAIR",
  chain: "ARC",
  nova: "NOVA",
  airstrike: "SKYFALL",
  omegaLaser: "Ω LASER",
  drone: "DRONE",
  sentry: "SENTRY",
  suppressor: "WISP",
});

const ABILITY_COOLDOWN_FALLBACK = Object.freeze({
  dash: 2.35,
  gravitySnare: 18,
  aegisWard: 28,
  stratosRun: 34,
  helixTempest: 72,
  chain: 4.8,
  nova: 9,
  airstrike: 18,
  omegaLaser: 22,
});

const EXPEDITION_ACTIVE_ABILITIES = Object.freeze([
  Object.freeze(["chain", "ARC CASCADE"]),
  Object.freeze(["nova", "ZERO NOVA"]),
  Object.freeze(["airstrike", "SKYFALL"]),
  Object.freeze(["omegaLaser", "Ω LASER"]),
]);

const COMBAT_DOCK_SLOTS = Object.freeze([
  Object.freeze({ id: "dash", key: "SPACE", label: "위상 대시", icon: Lightning, action: "dash", abilityKeys: Object.freeze([]) }),
  Object.freeze({ id: "gravitySnare", key: "Q", label: "중력 포획", icon: Pulse, action: "gravitySnare", abilityKeys: Object.freeze(["gravitySnare"]) }),
  Object.freeze({ id: "aegisWard", key: "E", label: "이지스 방벽", icon: ShieldChevron, action: "aegisWard", abilityKeys: Object.freeze(["aegisWard"]) }),
  Object.freeze({ id: "stratosRun", key: "F", label: "공중 소사", icon: Target, action: "stratosRun", abilityKeys: Object.freeze(["stratosRun"]) }),
  Object.freeze({ id: "helixTempest", key: "R", label: "나선 폭풍", icon: Crosshair, action: "helixTempest", abilityKeys: Object.freeze(["helixTempest"]) }),
]);

const REWARD_NAMES_KO = Object.freeze({
  scatter: "산탄 배열",
  rail: "관통 레일탄",
  rocket: "유도 폭발탄",
  orbit: "궤도 칼날",
  damage: "화력 증폭",
  fireRate: "가속 격발",
  multishot: "다중 탄두",
  shield: "재생 방벽",
  dash: "위상 대시",
  regen: "나나이트 수복",
  chain: "연쇄 전격",
  nova: "영점 충격파",
  airstrike: "공중 폭격",
  omegaLaser: "오메가 레이저",
  drone: "추적 드론",
  sentry: "관통 포탑",
  suppressor: "억제 지원기",
});

const PAUSED_GAMEPLAY_KEYS = new Set(["Space", "KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "KeyQ", "KeyE", "KeyF", "KeyR", "Digit1", "Digit2", "Digit3"]);

const REWARD_COPY = Object.freeze({
  scatter: "근거리 부채꼴 탄막으로 밀집한 적을 한 번에 찢습니다.",
  rail: "한 줄의 적을 끝까지 관통하는 고출력 레일 탄을 발사합니다.",
  rocket: "밀집 지점에 광역 폭발을 일으키는 유도 로켓을 추가합니다.",
  orbit: "플레이어 주위를 회전하며 접근한 적을 절단합니다.",
  damage: "모든 무기와 동료가 주는 피해가 25% 증가합니다.",
  fireRate: "전체 무기의 공격 주기가 19% 빨라집니다.",
  multishot: "기본 펄스 사격에 추가 투사체 한 발을 결합합니다.",
  shield: "피격 후 다시 충전되는 40의 보호막을 획득합니다.",
  dash: "대시 재사용 시간이 줄고 무적 시간이 길어집니다.",
  regen: "손상된 체력을 전투 중 지속적으로 복구합니다.",
  chain: "밀집한 적 사이를 연쇄 번개가 도약합니다. 3랭크에서 전장 폭풍으로 진화합니다.",
  nova: "주기적으로 충격파를 방출합니다. 3랭크에서 화면 전체를 휩쓰는 이중 폭발이 됩니다.",
  airstrike: "긴 재사용 시간 뒤 적 밀집 지역을 연속 폭격합니다. 마스터 시 15발 포화 폭격을 호출합니다.",
  omegaLaser: "조준 방향으로 거대 레이저포를 호출합니다. 마스터 시 광폭 빔이 전장을 관통합니다.",
  drone: "장거리에서 적을 추적하는 기동 편대입니다. 고랭크에서 장갑을 관통합니다.",
  sentry: "현재 위치를 지키는 관통 연사 포대입니다. 좁은 진입로를 지속 봉쇄합니다.",
  suppressor: "반복 EMP로 밀집한 적을 감속·소거하는 광역 제어 동료입니다.",
});

const REWARD_ART_KEYS = Object.freeze({
  scatter: "rewardScatter",
  rail: "rewardRail",
  rocket: "rewardRocket",
  orbit: "rewardOrbit",
  damage: "rewardDamage",
  fireRate: "rewardFireRate",
  multishot: "rewardMultishot",
  shield: "rewardShield",
  dash: "rewardDash",
  regen: "rewardRegen",
  chain: "rewardChain",
  nova: "rewardNova",
  airstrike: "rewardAirstrike",
  omegaLaser: "rewardOmegaLaser",
  drone: "rewardDrone",
  sentry: "rewardSentry",
  suppressor: "rewardSuppressor",
});

function useGameAssets() {
  return { assets: DOM_ASSET_REFS, error: false };
}

function formatTime(seconds) {
  const safe = Math.max(0, Math.floor(Number(seconds) || 0));
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

function isTerminal(game) {
  return game?.status === "victory" || game?.status === "defeat"
    || game?.phase === "victory" || game?.phase === "defeat";
}

function createHudSnapshot(game, performance) {
  return { ...getSwarmHud(game), quality: performance };
}

function resolveEventSound(event) {
  const direct = EVENT_SOUNDS[event?.type];
  const kind = String(event?.kind || event?.weapon || event?.skill || event?.effect || "");
  if (event?.type === "bossPatternFire") {
    if (event.pattern === "solarFlare") return "explosion";
    if (event.pattern === "memorySpiral") return "arc";
    if (event.pattern === "depthCollapse") return "emp";
    if (event.pattern === "prismLattice") return "rail";
  }
  if (event?.type === "shot" && WEAPON_EVENT_SOUNDS[kind]) return WEAPON_EVENT_SOUNDS[kind];
  if (IMPACT_EVENT_TYPES.has(event?.type)) {
    if (kind === "chain") return "arc";
    if (kind === "nova" || kind === "pulseOverdrive") return "emp";
    if (kind === "rail" || kind === "airstrike" || kind === "omegaLaser") return "rail";
    if (kind === "rocket") return "bossBreak";
    if (event?.type === "explosion") return "explosion";
    return WEAPON_EVENT_SOUNDS[kind] || "enemyHit";
  }
  return direct;
}

function IntroScreen({ assets, assetError, onStart }) {
  return (
    <main className="overload-intro intro-cinematic">
      {assets?.intro && (
        <img
          className="intro-key-art"
          src={assets.intro.src}
          alt="폐허 도시에서 거대 기계 군단과 맞서는 생존자"
          draggable="false"
        />
      )}
      <section className="intro-minimal-content" aria-labelledby="game-title">
        <small>NAN 2026 · 소버린 점령지</small>
        <h1 id="game-title"><span>TRAIN ME</span><em>WRONG</em><b>OVERLOAD</b></h1>
        <p>세계를 지배한 초지능 AI의 기계 군단을 돌파하고 지역 추론핵을 파괴하세요.</p>
        <button className="primary-cta intro-start" type="button" onClick={onStart} disabled={!assets && !assetError}>
          <span>{assets || assetError ? "게임 시작" : "전투 에셋 로딩 중"}</span>
          {assets || assetError ? <Play weight="fill" /> : <i className="loading-ring" />}
        </button>
        {assetError && <p className="asset-warning"><Warning /> 일부 이미지 대신 안전 렌더링을 사용합니다.</p>}
        <div className="intro-minimal-controls" aria-label="게임 조작">
          <span><kbd>WASD</kbd> 이동</span>
          <span><kbd>마우스</kbd> 조준</span>
          <span><kbd>스페이스</kbd> 대시</span>
          <span><kbd>Q/E/F/R</kbd> 액티브</span>
          <strong><Pulse weight="fill" /> 기본 공격 상시 자동</strong>
        </div>
      </section>
    </main>
  );
}

function ProgressHud({ hud }) {
  const bossPhase = hud?.phase === "boss" && hud?.boss;
  const weakness = Math.max(0, Number(bossPhase?.weakness) || 0);
  const bossRatio = bossPhase ? Math.max(0, Math.min(1, hud.boss.hp / Math.max(1, hud.boss.maxHp))) : 0;
  const swarmRatio = Math.max(0, Math.min(1, Number(hud?.swarmProgress) || 0));
  return (
    <div className={bossPhase ? `progress-hud is-boss${weakness > 0 ? " has-weakness" : ""}` : "progress-hud"}>
      <div className="progress-heading">
        <span>{bossPhase ? `${hud.boss.stage || 1}단계` : "적 군단 소거"}</span>
        <strong>{bossPhase ? localizeBossName(hud.boss.name) : "기계 군단"}</strong>
        <b>{bossPhase ? (weakness > 0 ? `코어 피해 ×${hud.boss.damageMultiplier || 2}` : `체력 ${Math.ceil(hud.boss.hp)}`) : `남은 적 ${hud?.enemiesRemaining ?? 0}기`}</b>
      </div>
      <div className="progress-bar"><i style={{ width: `${(bossPhase ? bossRatio : swarmRatio) * 100}%` }} /><span /></div>
      <div className="progress-meta">
        <span>{bossPhase ? (hud.boss.transforming ? `⚠ EVOLUTION LOCK · ${hud.boss.transformTimer.toFixed(1)}s` : hud.boss.pattern ? `PATTERN · ${String(hud.boss.pattern).toUpperCase()}` : `ENRAGE ×${Number(hud.boss.enrage || 1).toFixed(1)}`) : `${hud?.kills || 0} / ${hud?.totalEnemies || 1000} PURGED`}</span>
        <span>{bossPhase
          ? (weakness > 0 ? `코어 노출 ${weakness.toFixed(1)}초` : "경고 범위를 피하세요")
          : hud?.surge?.warning
            ? `⚠ ${hud.surge.warning.label} · ${hud.surge.warning.startsIn.toFixed(1)}s`
            : hud?.surge?.active
              ? `${hud.surge.active.label} · ${hud.surge.active.remaining} DEPLOYING`
              : `${hud?.liveEnemies || 0} ACTIVE`}</span>
      </div>
    </div>
  );
}

function PilotHud({ hud }) {
  const player = hud?.player || { hp: 1, maxHp: 1, shield: 0, shieldMax: 0, dashCooldown: 0, dashMax: 1 };
  const hpRatio = Math.max(0, Math.min(1, player.hp / Math.max(1, player.maxHp)));
  const shieldRatio = Math.max(0, Math.min(1, player.shield / Math.max(1, player.shieldMax || 1)));
  const dashReady = Number(player.dashCooldown || 0) <= 0;
  const stunTimer = Math.max(0, Number(player.stunTimer ?? player.stun ?? player.stunnedFor ?? 0) || 0);
  const stunned = Boolean(player.stunned) || stunTimer > 0;
  return (
    <aside className={`overload-pilot glass-panel${stunned ? " is-stunned" : ""}`}>
      <div className="pilot-identity"><Crosshair weight="bold" /><span><small>THE TRAINER</small><b>AEGIS / LV.{hud?.level || 1}</b></span></div>
      <div className="pilot-bar"><i style={{ width: `${hpRatio * 100}%` }} /></div>
      {player.shieldMax > 0 && <div className="shield-bar"><i style={{ width: `${shieldRatio * 100}%` }} /></div>}
      <div className="pilot-meta"><span>HP {Math.ceil(Math.max(0, player.hp))}</span><b className={dashReady ? "is-ready" : ""}>DASH {dashReady ? "READY" : `${Number(player.dashCooldown).toFixed(1)}s`}</b></div>
      {stunned && <div className="pilot-stun" role="status"><Warning weight="fill" /> SYSTEM JAM · {stunTimer.toFixed(1)}s</div>}
    </aside>
  );
}

function BuildHud({ build }) {
  const groups = [
    ["WPN", build?.weapons, "weapon"],
    ["SKL", build?.skills, "skill"],
    ["ALLY", build?.allies, "ally"],
  ];
  return (
    <aside className="build-hud glass-panel" aria-label="현재 빌드">
      <div className="panel-heading"><span><Brain weight="fill" /> ACTIVE BUILD</span><i className="live-dot">LIVE</i></div>
      {groups.map(([label, values, category]) => {
        const active = Object.entries(values || {}).filter(([, level]) => Number(level) > 0);
        return (
          <div className="build-row" key={label}>
            <small>{label}</small>
            <div>{active.length ? active.map(([id, level]) => (
              <span className={`build-chip-small is-${category}`} key={id}>{BUILD_LABELS[id] || id}<b>+{level}</b></span>
            )) : <i>EMPTY</i>}</div>
          </div>
        );
      })}
    </aside>
  );
}

function AbilityHud({ abilities }) {
  const entries = EXPEDITION_ACTIVE_ABILITIES.filter(([id]) => Number(abilities?.[id]?.rank) > 0);
  if (!entries.length) return null;
  return (
    <aside className="ability-hud glass-panel" aria-label="공격 스킬 재사용 대기시간">
      <div className="panel-heading"><span><Lightning weight="fill" /> STRIKE SYSTEMS</span><i>ACTIVE</i></div>
      <div className="ability-grid">
        {entries.map(([id, label]) => {
          const ability = abilities[id];
          const ready = Number(ability.cooldown) <= 0.05;
          const mastered = ability.rank >= ability.maxRank;
          const remaining = Math.max(0, Number(ability.cooldown) || 0);
          const cooldownMax = Math.max(0.01, Number(ability.maxCooldown ?? ability.cooldownMax ?? ability.baseCooldown) || ABILITY_COOLDOWN_FALLBACK[id] || remaining || 1);
          const meter = Number(ability.duration) > 0 ? 1 : ready ? 1 : Math.max(0, Math.min(1, 1 - remaining / cooldownMax));
          return (
            <div className={`${ability.ultimate ? "is-ultimate " : ""}${ability.special ? "is-special " : ""}${mastered ? "is-mastered " : ""}${ready ? "is-ready" : "is-cooling"}`} key={id} aria-label={`${label} ${ready ? "사용 가능" : `${remaining.toFixed(1)}초 남음`}`}>
              <span>{ability.special ? ability.key || "KEY" : ability.ultimate ? "ULT" : "AUTO"}</span>
              <strong>{label}</strong>
              <b className={ready ? "is-ready" : ""}>{Number(ability.duration) > 0 ? `LINK ${Number(ability.duration).toFixed(1)}s` : ready ? "READY" : `${remaining.toFixed(1)}s`}</b>
              <small>{ability.special ? "SQUAD" : mastered ? "MASTER" : `R${ability.rank}`}</small>
              <i className="ability-meter" aria-hidden="true"><i style={{ width: `${meter * 100}%` }} /></i>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

function resolveCombatDockSlot(hud, slot) {
  if (slot.id === "dash") {
    const remaining = Math.max(0, Number(hud?.player?.dashCooldown) || 0);
    const cooldownMax = Math.max(0.01, Number(hud?.player?.dashMax) || ABILITY_COOLDOWN_FALLBACK.dash);
    const ready = remaining <= 0.05;
    return { ...slot, ready, locked: false, status: ready ? "사용 가능" : `${remaining.toFixed(1)}초`, meter: ready ? 1 : Math.max(0, Math.min(1, 1 - remaining / cooldownMax)) };
  }

  const abilities = hud?.abilities || {};
  const ability = slot.abilityKeys.map((key) => abilities[key]).find(Boolean);
  const hasAbility = Boolean(ability);
  const rank = Math.max(0, Number(ability?.rank ?? (hasAbility ? 1 : 0)) || 0);
  const locked = !hasAbility || Boolean(ability.locked) || rank <= 0;
  const remaining = Math.max(0, Number(ability?.remaining ?? ability?.cooldownRemaining ?? ability?.cooldown) || 0);
  const activeRemaining = Math.max(0, Number(ability?.activeRemaining ?? ability?.duration) || 0);
  const targetAvailable = ability?.available !== false;
  const cooldownMax = Math.max(
    0.01,
    Number(ability?.maxCooldown ?? ability?.cooldownMax ?? ability?.baseCooldown)
      || ABILITY_COOLDOWN_FALLBACK[slot.id]
      || remaining
      || 1,
  );
  const ready = !locked && targetAvailable && (typeof ability.ready === "boolean" ? ability.ready : remaining <= 0.05);
  const explicitProgress = Number(ability?.progress ?? ability?.cooldownProgress);
  const meter = Number.isFinite(explicitProgress)
    ? Math.max(0, Math.min(1, explicitProgress))
    : activeRemaining > 0 || ready ? 1 : locked ? 0 : Math.max(0, Math.min(1, 1 - remaining / cooldownMax));
  const status = locked ? "잠김"
    : activeRemaining > 0 ? `지속 ${activeRemaining.toFixed(1)}초`
      : remaining > 0.05 ? `${remaining.toFixed(1)}초`
        : !targetAvailable ? "대상 없음"
          : ready ? "사용 가능" : "대기";
  return { ...slot, ready, locked, available: targetAvailable, status, meter };
}

function ExpeditionCombatDock({ hud, onDash, onActivateAbility, tutorialAbilityId = null, onTutorialTarget }) {
  const player = hud?.player || { hp: 0, maxHp: 1 };
  const hp = Math.max(0, Number(player.hp) || 0);
  const maxHp = Math.max(1, Number(player.maxHp) || 1);
  const healthRatio = Math.max(0, Math.min(1, hp / maxHp));
  const slots = COMBAT_DOCK_SLOTS.map((slot) => resolveCombatDockSlot(hud, slot));
  const previousHpRef = useRef(null);
  const damageTimerRef = useRef(0);
  const [damagePulse, setDamagePulse] = useState(0);
  const [damageWarning, setDamageWarning] = useState(false);

  useEffect(() => {
    const previous = previousHpRef.current;
    previousHpRef.current = hp;
    if (previous === null || hp >= previous - 0.01) return;
    setDamagePulse((pulse) => pulse + 1);
    setDamageWarning(true);
    window.clearTimeout(damageTimerRef.current);
    damageTimerRef.current = window.setTimeout(() => setDamageWarning(false), 480);
  }, [hp]);

  useEffect(() => () => window.clearTimeout(damageTimerRef.current), []);

  return (
    <aside className={`expedition-combat-dock${tutorialAbilityId ? " is-tutorial-active" : ""}`} aria-label="생존 및 액티브 능력 상태">
      <div className={`vital-cluster${healthRatio <= 0.3 ? " is-critical" : ""}`}>
        {damageWarning && <i className="vital-damage-flash" key={`damage-${damagePulse}`} aria-hidden="true" />}
        <span>이지스 내구도 <small>레벨 {hud?.level || 1}</small></span>
        <b>{Math.ceil(hp)} <small>/ {Math.ceil(maxHp)}</small></b>
        <div
          className="vital-bar"
          role="progressbar"
          aria-label="이지스 체력"
          aria-valuemin="0"
          aria-valuemax={Math.ceil(maxHp)}
          aria-valuenow={Math.ceil(hp)}
        ><i style={{ width: `${healthRatio * 100}%` }} /></div>
      </div>
      <div className="combat-dock-abilities">
        {slots.map((slot) => {
          const Icon = slot.icon;
          const tutorialTarget = tutorialAbilityId === slot.id;
          const tutorialDimmed = Boolean(tutorialAbilityId) && !tutorialTarget;
          const activate = () => {
            if (tutorialAbilityId) {
              if (tutorialTarget) onTutorialTarget?.();
              return;
            }
            if (slot.locked) return;
            if (slot.action === "dash") onDash?.();
            else onActivateAbility?.(slot.action);
          };
          return (
            <button
              type="button"
              className={`combat-ability-chip${slot.ready ? " is-ready" : " is-cooling"}${slot.locked && !tutorialTarget ? " is-locked" : ""}${slot.id === "helixTempest" ? " is-ultimate" : ""}${tutorialTarget ? " is-tutorial-target" : ""}${tutorialDimmed ? " is-tutorial-dimmed" : ""}`}
              onClick={activate}
              aria-label={`${slot.key} ${slot.label}. ${slot.status}`}
              aria-disabled={(slot.locked && !tutorialTarget) || tutorialDimmed}
              data-combat-ability={slot.id}
              key={slot.id}
            >
              <span className="combat-ability-icon" aria-hidden="true">
                <Icon weight="fill" />
                <i
                  className="combat-ability-cooldown"
                  style={{ "--cooldown-sweep": `${Math.round((1 - slot.meter) * 360)}deg` }}
                />
                <kbd>{slot.key}</kbd>
              </span>
              <span className="combat-ability-copy"><strong>{slot.label}</strong><b>{slot.status}</b></span>
              <i
                className="visually-hidden"
                role="progressbar"
                aria-label={`${slot.label} ${slot.status}`}
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow={Math.round(slot.meter * 100)}
              />
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function CombatAbilityTutorialOverlay({ stepIndex, portrait, onNext, onBack, onSkip }) {
  const ability = MANUAL_ABILITY_GUIDE[stepIndex];

  useEffect(() => {
    if (!ability) return undefined;
    const handleTutorialKey = (event) => {
      if (event.repeat) return;
      const expected = event.code === `Key${ability.key}`;
      const next = expected || event.code === "Enter" || event.code === "ArrowRight";
      const back = event.code === "ArrowLeft";
      const skip = event.code === "Escape";
      if (!next && !back && !skip && !PAUSED_GAMEPLAY_KEYS.has(event.code)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (skip) onSkip?.();
      else if (back) onBack?.();
      else if (next) onNext?.();
    };
    window.addEventListener("keydown", handleTutorialKey, true);
    return () => window.removeEventListener("keydown", handleTutorialKey, true);
  }, [ability, onBack, onNext, onSkip]);

  if (!ability) return null;
  const portraitSource = portrait?.src || portrait || "";
  return (
    <div className="combat-tutorial-layer" role="dialog" aria-modal="true" aria-labelledby="combat-tutorial-title">
      <div className="combat-tutorial-scrim" aria-hidden="true" />
      <section className={`combat-tutorial-card tutorial-${ability.id}`}>
        {portraitSource && <img src={portraitSource} alt="전술 관제관 레아" />}
        <div className="combat-tutorial-copy">
          <small>레아 · 실전 인터페이스 {stepIndex + 1} / {MANUAL_ABILITY_GUIDE.length}</small>
          <header><kbd>{ability.key}</kbd><div><h2 id="combat-tutorial-title">{ability.koreanName}</h2><span>{ability.name}</span></div></header>
          <p>{ability.overlayPrompt}</p>
          <b>아래에서 빛나는 실제 {ability.key} 버튼을 직접 눌러도 다음 단계로 이동합니다.</b>
        </div>
        <footer>
          <button type="button" onClick={onBack} disabled={stepIndex === 0}><ArrowLeft weight="bold" /> 이전</button>
          <button type="button" className="combat-tutorial-skip" onClick={onSkip}>건너뛰기 <kbd>Esc</kbd></button>
          <button type="button" className="combat-tutorial-next" onClick={onNext}>{stepIndex === MANUAL_ABILITY_GUIDE.length - 1 ? "실전 시작" : "다음"} <ArrowRight weight="bold" /></button>
        </footer>
      </section>
    </div>
  );
}

function PauseOverlay({ onResume, onRestart, onBase }) {
  return (
    <div className="expedition-pause" role="dialog" aria-modal="true" aria-labelledby="pause-title">
      <section className="expedition-pause-card">
        <small>전투 연결 일시 중지</small>
        <h2 id="pause-title">일시 정지</h2>
        <p>전투 시뮬레이션과 입력이 정지되었습니다.</p>
        <div>
          <button type="button" className="pause-resume" onClick={onResume} autoFocus><Play weight="fill" /><span>계속</span><kbd>ESC</kbd></button>
          <button type="button" onClick={onRestart}><ArrowCounterClockwise weight="bold" /><span>처음부터</span></button>
          <button type="button" onClick={onBase} disabled={!onBase}><MapTrifold weight="fill" /><span>{onBase ? "헤이븐-09 기지로" : "기지 잠김"}</span></button>
        </div>
      </section>
    </div>
  );
}

function RewardArtwork({ option, assets }) {
  const id = String(option?.id || "");
  const source = assets?.[REWARD_ART_KEYS[id]];
  if (source) return <img src={source.src} alt="" />;
  if (option?.category === "weapon") return <Target weight="fill" />;
  if (id.includes("shield") || id.includes("regen")) return <ShieldChevron weight="fill" />;
  return <Lightning weight="fill" />;
}

function LevelUpOverlay({ offer, level, assets, rewardState, onChoose }) {
  const modalRef = useRef(null);
  const offerKey = offer?.map((option) => option.id).join("|") || "";
  useEffect(() => {
    if (!offerKey) return undefined;
    const previouslyFocused = document.activeElement;
    const frame = requestAnimationFrame(() => modalRef.current?.focus({ preventScroll: true }));
    const trapFocus = (event) => {
      if (event.key !== "Tab") return;
      const buttons = modalRef.current?.querySelectorAll("button:not([disabled])");
      if (!buttons?.length) return;
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === modalRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", trapFocus);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", trapFocus);
      previouslyFocused?.focus?.();
    };
  }, [offerKey]);
  if (!offer?.length) return null;
  const queuedRewards = Math.max(0, Number(
    rewardState?.queued
    ?? rewardState?.queueCount
    ?? rewardState?.pendingCount
    ?? rewardState?.batchLevels
    ?? rewardState?.queuedLevels
    ?? rewardState?.remaining
    ?? rewardState?.queue?.length
    ?? 0,
  ) || 0);
  return (
    <div className="reward-backdrop" role="dialog" aria-modal="true" aria-labelledby="reward-title">
      <section className="reward-modal" ref={modalRef} key={offerKey} tabIndex="-1">
        <div className="reward-kicker"><Sparkle weight="fill" /> 전투 부하 진화 · 레벨 {level}</div>
        <h2 id="reward-title">오버로드 선택</h2>
        <p>전투가 일시 정지되었습니다. 원하는 성장 방향을 하나 선택하세요.</p>
        {queuedRewards > 1 && <div className="reward-queue-status"><Timer weight="bold" /> 축적된 레벨업 {queuedRewards}회를 이번 선택 1회로 압축했습니다.</div>}
        <div className="reward-options">
          {offer.map((option, index) => {
            const meta = CATEGORY_META[option.category] || CATEGORY_META.skill;
            return (
              <button className={`reward-card is-${meta.color}`} key={`${option.category}-${option.id}-${index}`} type="button" onClick={() => onChoose(option.id)}>
                <span className="reward-index">0{index + 1}</span>
                <div className="reward-art"><RewardArtwork option={option} assets={assets} /></div>
                <small>{meta.label} · {meta.korean}</small>
                <strong>{REWARD_NAMES_KO[option.id] || option.koreanName || option.name}</strong>
                <p>{REWARD_COPY[option.id] || option.description}</p>
                <div><span>{option.mastery ? `랭크 ${option.level} → 최종 진화` : option.level ? `랭크 ${option.level} → ${option.nextLevel || option.level + 1}` : "신규 장착"}</span><b>선택 <ArrowRight /></b></div>
              </button>
            );
          })}
        </div>
        <span className="reward-note">클릭 또는 숫자키 1–3으로 선택 · 다음 선택은 전투 간격 후 나타납니다.</span>
      </section>
    </div>
  );
}

function ArenaScreen({ assets, soundEnabled, sfx, onToggleSound, onFinish }) {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const inputRef = useRef(null);
  const governorRef = useRef(null);
  const finishReportedRef = useRef(false);
  const [hud, setHud] = useState(null);
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const context = canvas.getContext("2d", { alpha: false, desynchronized: true });
    const game = createSwarmState({ duration: 150 });
    const debugScene = import.meta.env.DEV ? new URLSearchParams(window.location.search).get("scene") : null;
    if (debugScene === "arsenal") {
      game.killedEnemies = 950;
      game.stats.kills = 950;
      game.player.invulnerability = 15;
      Object.assign(game.build.weapons, { pulse: 5, scatter: 5, rail: 5, rocket: 5, orbit: 5 });
      Object.assign(game.build.skills, { chain: 3, nova: 3, airstrike: 3, omegaLaser: 3, damage: 3, fireRate: 3, multishot: 3 });
      game.player.damageMultiplier = 1.95;
      game.player.fireRateMultiplier = 0.58;
      game.player.multishot = 4;
      game.support.chainCooldown = 0;
      game.support.novaCooldown = 0;
      game.support.airstrikeCooldown = 0;
      game.support.laserCooldown = 0;
    } else if (["boss", "weakness", "phase2", "phase3"].includes(debugScene)) {
      game.enemies.length = 0;
      game.spawnedEnemies = game.enemyBudget;
      game.killedEnemies = game.enemyBudget;
      game.stats.kills = game.enemyBudget;
      game.phaseTransition = 0.01;
      if (debugScene === "weakness") {
        game.boss.patternIndex = 4;
        game.player.invulnerability = 15;
      } else if (debugScene === "phase2" || debugScene === "phase3") {
        game.boss.stage = debugScene === "phase3" ? 3 : 2;
        game.boss.hp = game.boss.maxHp * (debugScene === "phase3" ? 0.32 : 0.62);
        game.boss.enrage = debugScene === "phase3" ? 2.15 : 1.5;
        game.boss.transformTimer = 4;
        game.boss.phaseFlash = 1;
        game.boss.alertPulses = 2;
        game.boss.alertPulseTimer = 0.42;
        game.boss.patternCooldown = 0.2;
      }
    }
    const input = createSwarmInput();
    const governor = createPerformanceGovernor({ environment: window });
    const reducedMotion = Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
    gameRef.current = game;
    inputRef.current = input;
    governorRef.current = governor;
    finishReportedRef.current = false;

    let animationFrame = 0;
    let lastTime = performance.now();
    let simulationAccumulator = 0;
    let renderAccumulator = 0;
    let hudAccumulator = 0;
    let bannerTimeout = 0;
    let cachedQualityId = "";
    let cachedRenderQuality = null;
    let lastRewardToken = "";
    let logicalPointer = { x: GAME_WIDTH * 0.82, y: GAME_HEIGHT * 0.5 };
    let pointerClient = null;
    let capturedPointerId = null;
    let stopped = false;
    const fixedStep = 1 / 60;

    const getCanvasViewport = (bounds = canvas.getBoundingClientRect()) => {
      const scale = Math.max(0.0001, Math.min(bounds.width / GAME_WIDTH, bounds.height / GAME_HEIGHT));
      const width = GAME_WIDTH * scale;
      const height = GAME_HEIGHT * scale;
      return {
        bounds,
        scale,
        left: (bounds.width - width) * 0.5,
        top: (bounds.height - height) * 0.5,
        width,
        height,
      };
    };

    const syncCanvas = () => {
      const preset = governor.preset;
      const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, preset.dprCap || 1));
      const renderScale = Math.max(0.65, Math.min(1, preset.renderScale || 1));
      const bounds = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.round(bounds.width * dpr * renderScale));
      const height = Math.max(1, Math.round(bounds.height * dpr * renderScale));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    };

    const refreshHud = () => setHud(createHudSnapshot(game, governor.snapshot));

    const applyLogicalAim = () => {
      setSwarmScreenAim(game, logicalPointer.x, logicalPointer.y);
    };

    const updatePointerFromClient = (clientX, clientY) => {
      if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) return;
      pointerClient = { x: clientX, y: clientY };
      const viewport = getCanvasViewport();
      logicalPointer = {
        x: Math.max(0, Math.min(GAME_WIDTH, (clientX - viewport.bounds.left - viewport.left) / viewport.scale)),
        y: Math.max(0, Math.min(GAME_HEIGHT, (clientY - viewport.bounds.top - viewport.top) / viewport.scale)),
      };
      applyLogicalAim();
    };

    const showBanner = (event) => {
      let copy = event.type === "bossPatternTelegraph"
        ? SIGNATURE_PATTERN_BANNERS[event.pattern]
        : EVENT_BANNERS[event.type];
      if (event.type === "bossStage" || event.type === "bossStagePulse") {
        copy = event.stage >= 3
          ? ["⚠ CORE MELTDOWN · PHASE III", "최종 형상 전개. 다중 포신과 광폭 패턴이 최대 출력으로 가동됩니다."]
          : ["⚠ ARMOR BREAK · PHASE II", "외부 장갑 전개. 공격 속도와 탄막 밀도가 상승합니다."];
      } else if (event.type === "overdrive") {
        copy = [`OVERDRIVE ${event.tier} · LIMITER OFF`, event.tier >= 3
          ? "최종 화력 해방. 마스터 광역 공격이 전장을 연속 소거합니다."
          : "처치 데이터가 공격 속도와 피해 출력을 증폭합니다."];
      }
      if (!copy) return;
      window.clearTimeout(bannerTimeout);
      setBanner({ key: `${event.type}-${game.time}`, type: event.type, title: copy[0], subtitle: copy[1] });
      const duration = event.type === "bossIntro" ? 920
        : event.type === "bossStage" || event.type === "bossStagePulse" ? 920
          : event.type === "bossContact" || event.type === "bossContactHit" || event.type === "playerStunned" ? 860
          : 1250;
      bannerTimeout = window.setTimeout(() => setBanner(null), duration);
    };

    const consumeEvents = () => {
      for (const event of drainSwarmEvents(game) || []) {
        const sound = resolveEventSound(event);
        if (sound) sfx.play(sound);
        showBanner(event);
      }
    };

    const render = () => {
      syncCanvas();
      applyLogicalAim();
      const renderScale = Math.max(0.0001, Math.min(canvas.width / GAME_WIDTH, canvas.height / GAME_HEIGHT));
      const offsetX = (canvas.width - GAME_WIDTH * renderScale) * 0.5;
      const offsetY = (canvas.height - GAME_HEIGHT * renderScale) * 0.5;
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.fillStyle = "#020608";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.setTransform(renderScale, 0, 0, renderScale, offsetX, offsetY);
      const preset = governor.preset;
      if (cachedQualityId !== preset.id) {
        cachedQualityId = preset.id;
        cachedRenderQuality = reducedMotion
          ? { ...preset, reducedMotion: true, shadows: false, scanlines: false, detailScale: 0.55 }
          : { ...preset, detailScale: preset.id === "performance" ? 0.5 : preset.id === "balanced" ? 0.75 : 1 };
      }
      renderSwarm(context, game, assets || {}, cachedRenderQuality);
    };

    const frame = (now) => {
      if (stopped) return;
      const frameMs = Math.min(50, Math.max(0, now - lastTime));
      lastTime = now;
      const qualityChanged = governor.sample(frameMs, now);
      simulationAccumulator = Math.min(simulationAccumulator + frameMs / 1000, fixedStep * 4);

      if (!game.levelupPending && !isTerminal(game)) {
        let steps = 0;
        while (simulationAccumulator >= fixedStep && steps < 4) {
          applyLogicalAim();
          stepSwarm(game, input, fixedStep);
          // Camera follow changes the world-space aim conversion each tick. Reprojecting
          // the stored screen point keeps the rendered reticle under a stationary cursor.
          applyLogicalAim();
          clearPressedInput(input);
          simulationAccumulator -= fixedStep;
          steps += 1;
        }
      } else {
        simulationAccumulator = 0;
      }

      // Gameplay is intentionally frozen after victory/defeat, but authored
      // death dissolves still need a short visual clock before the result view.
      if (isTerminal(game)) {
        const visualDelta = frameMs / 1000;
        if (game.player?.dead) game.player.deathTimer = Math.max(0, Number(game.player.deathTimer || 0) - visualDelta);
        if (game.boss?.dead) game.boss.deathTimer = Math.max(0, Number(game.boss.deathTimer || 0) - visualDelta);
      }

      consumeEvents();
      hudAccumulator += frameMs;
      const rewardToken = `${Boolean(game.levelupPending)}:${game.rewardOptions?.map((option) => option.id).join("|") || ""}:${game.levelFlow?.batchLevels ?? game.levelFlow?.queuedLevels ?? game.rewardQueue?.length ?? game.pendingLevelUps ?? game.queuedRewards ?? ""}`;
      const rewardStateChanged = rewardToken !== lastRewardToken;
      if (rewardStateChanged || (!game.levelupPending && (hudAccumulator >= (governor.preset.hudInterval || 150) || qualityChanged))) {
        hudAccumulator = 0;
        lastRewardToken = rewardToken;
        refreshHud();
      }

      const renderClock = advanceRenderClock(renderAccumulator, frameMs, governor.preset.renderFps, qualityChanged);
      renderAccumulator = renderClock.accumulator;
      if (renderClock.shouldRender) render();

      if (isTerminal(game) && !finishReportedRef.current) {
        finishReportedRef.current = true;
        refreshHud();
        window.setTimeout(() => {
          if (!stopped) onFinish(createHudSnapshot(game, governor.snapshot));
        }, 1200);
      }
      animationFrame = requestAnimationFrame(frame);
    };

    const setKey = (event, value) => {
      const key = event.key.toLowerCase();
      const interactiveTarget = event.target instanceof HTMLElement
        && Boolean(event.target.closest("button, a, input, select, textarea, [role='button']"));
      if (key === " " && interactiveTarget) return;
      if (["w", "arrowup", "s", "arrowdown", "a", "arrowleft", "d", "arrowright", " ", "f", "1", "2", "3"].includes(key)) event.preventDefault();
      if (key === "w" || key === "arrowup") input.up = value;
      if (key === "s" || key === "arrowdown") input.down = value;
      if (key === "a" || key === "arrowleft") input.left = value;
      if (key === "d" || key === "arrowright") input.right = value;
      if (key === " " && value && !event.repeat) input.dashPressed = true;
      if (key === "f" && value && !event.repeat) input.supportPressed = true;
      const reward = game.rewardOptions?.[Number(key) - 1];
      if (value && !event.repeat && /^[1-3]$/.test(key) && game.levelupPending && reward) {
        chooseLevelReward(game, reward.id);
        refreshHud();
      }
    };

    const onKeyDown = (event) => setKey(event, true);
    const onKeyUp = (event) => setKey(event, false);
    const onBlur = () => {
      input.up = false;
      input.down = false;
      input.left = false;
      input.right = false;
      input.dashPressed = false;
      input.supportPressed = false;
    };
    const updatePointer = (event) => updatePointerFromClient(event.clientX, event.clientY);
    const onPointerMove = (event) => {
      if (event.isPrimary === false) return;
      updatePointer(event);
    };
    const onPointerDown = (event) => {
      if (event.isPrimary === false) return;
      updatePointer(event);
      capturedPointerId = event.pointerId;
      try {
        canvas.setPointerCapture?.(event.pointerId);
      } catch {
        capturedPointerId = null;
      }
    };
    const onPointerUp = (event) => {
      if (event.pointerId !== capturedPointerId) return;
      try {
        if (canvas.hasPointerCapture?.(event.pointerId)) canvas.releasePointerCapture?.(event.pointerId);
      } catch {
        // Pointer capture may already be released by the browser during a resize/blur.
      }
      capturedPointerId = null;
    };
    const onLostPointerCapture = (event) => {
      if (event.pointerId === capturedPointerId) capturedPointerId = null;
    };
    const onResize = () => {
      syncCanvas();
      if (pointerClient) updatePointerFromClient(pointerClient.x, pointerClient.y);
      else applyLogicalAim();
    };
    const onContextMenu = (event) => event.preventDefault();
    const resizeObserver = typeof ResizeObserver === "function" ? new ResizeObserver(onResize) : null;

    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp, { passive: false });
    window.addEventListener("blur", onBlur);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("lostpointercapture", onLostPointerCapture);
    canvas.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("resize", onResize, { passive: true });
    window.visualViewport?.addEventListener("resize", onResize, { passive: true });
    resizeObserver?.observe(canvas);

    refreshHud();
    render();
    animationFrame = requestAnimationFrame(frame);

    return () => {
      stopped = true;
      cancelAnimationFrame(animationFrame);
      window.clearTimeout(bannerTimeout);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("lostpointercapture", onLostPointerCapture);
      canvas.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
      resizeObserver?.disconnect();
    };
  }, [assets, onFinish, sfx]);

  const selectReward = useCallback((id) => {
    const game = gameRef.current;
    if (!game?.levelupPending || !chooseLevelReward(game, id)) return;
    setHud(createHudSnapshot(game, governorRef.current.snapshot));
  }, []);

  const setTouchDirection = useCallback((direction, active, event) => {
    event?.preventDefault();
    const input = inputRef.current;
    if (!input || !(direction in input)) return;
    input[direction] = active;
    if (active) event?.currentTarget?.setPointerCapture?.(event.pointerId);
    else event?.currentTarget?.releasePointerCapture?.(event.pointerId);
  }, []);

  const touchDash = useCallback((event) => {
    event?.preventDefault();
    if (inputRef.current) inputRef.current.dashPressed = true;
  }, []);

  const xpRatio = Math.max(0, Math.min(1, Number(hud?.xp || 0) / Math.max(1, Number(hud?.nextXp || 1))));
  const playerStunTime = Math.max(0, Number(hud?.player?.stunTimer ?? hud?.player?.stun ?? hud?.player?.stunnedFor ?? 0) || 0);
  const playerStunned = Boolean(hud?.player?.stunned) || playerStunTime > 0;

  return (
    <main className="overload-game">
      <header className="overload-topbar">
        <div className="game-brand"><Crosshair weight="bold" /><span><b>TRAIN ME WRONG</b><small>OVERLOAD</small></span></div>
        <ProgressHud hud={hud} />
        <div className="topbar-tools">
          <span className="timer-readout"><Timer weight="bold" /> {formatTime(hud?.time || 0)}</span>
          <button type="button" className="icon-button" onClick={onToggleSound} aria-label={soundEnabled ? "전체 사운드 끄기" : "전체 사운드 켜기"}>
            {soundEnabled ? <SpeakerHigh weight="fill" /> : <SpeakerSlash />}
          </button>
        </div>
      </header>

      <section className="overload-arena-layout">
        <div className="overload-battle-grid">
          <div className="overload-canvas-frame">
            <canvas ref={canvasRef} className="game-canvas" tabIndex="0" aria-label="TRAIN ME WRONG 오버로드 생존 전장. 포인터 위치가 조준점입니다." />
            <div className="frame-corners" aria-hidden="true"><i /><i /><i /><i /></div>
            {banner && (
              <div key={banner.key} className={`combat-banner banner-${banner.type}`} aria-live="assertive">
                <small>SYSTEM EVENT</small><strong>{banner.title}</strong><span>{banner.subtitle}</span>
              </div>
            )}
            {playerStunned && <div className="stun-screen-effect" aria-hidden="true"><i /><i /><i /><i /></div>}
            <div className="arena-status top-left"><i /> CHAMBER OMEGA · AUTO FIRE</div>
            <div className="arena-status top-right">{hud?.quality?.qualityLabel || "CALIBRATING"} · {hud?.quality?.fps || 60} FPS</div>
            <div className="combat-help"><span><kbd>WASD</kbd> MOVE</span><span><kbd>SPACE</kbd> PHASE DASH</span><span><kbd>Q / E / F / R</kbd> ABILITIES</span><span><kbd>MOUSE</kbd> AIM</span><b><Pulse weight="fill" /> AUTO FIRE</b></div>
            <div className="xp-hud"><span>LV.{hud?.level || 1}</span><div><i style={{ width: `${xpRatio * 100}%` }} /></div><b>{Math.floor(hud?.xp || 0)} / {Math.floor(hud?.nextXp || 0)} XP</b></div>
          </div>
          <aside className="overload-command-rail" aria-label="플레이어 및 전투 시스템 상태">
            <div className="command-rail-label"><span>COMBAT TELEMETRY</span><i>LIVE</i></div>
          <PilotHud hud={hud} />
          <AbilityHud abilities={hud?.abilities} />
            <BuildHud build={hud?.build} />
          </aside>
        </div>

        <div className="touch-controls" aria-label="터치 전투 조작">
          <div className="touch-dpad">
            <button className="touch-up" type="button" aria-label="위로 이동" onPointerDown={(event) => setTouchDirection("up", true, event)} onPointerUp={(event) => setTouchDirection("up", false, event)} onPointerCancel={(event) => setTouchDirection("up", false, event)}><ArrowUp weight="bold" /></button>
            <button className="touch-left" type="button" aria-label="왼쪽으로 이동" onPointerDown={(event) => setTouchDirection("left", true, event)} onPointerUp={(event) => setTouchDirection("left", false, event)} onPointerCancel={(event) => setTouchDirection("left", false, event)}><ArrowLeft weight="bold" /></button>
            <button className="touch-down" type="button" aria-label="아래로 이동" onPointerDown={(event) => setTouchDirection("down", true, event)} onPointerUp={(event) => setTouchDirection("down", false, event)} onPointerCancel={(event) => setTouchDirection("down", false, event)}><ArrowDown weight="bold" /></button>
            <button className="touch-right" type="button" aria-label="오른쪽으로 이동" onPointerDown={(event) => setTouchDirection("right", true, event)} onPointerUp={(event) => setTouchDirection("right", false, event)} onPointerCancel={(event) => setTouchDirection("right", false, event)}><ArrowRight weight="bold" /></button>
          </div>
          <span>전장을 터치해 조준 · 사격은 자동</span>
          <div className="touch-action-stack">
            <button className="touch-dash" type="button" aria-label="무적 대시" onPointerDown={touchDash}><Lightning weight="fill" /> DASH</button>
          </div>
        </div>
      </section>

      <LevelUpOverlay offer={hud?.rewards?.options} level={hud?.level || 1} assets={assets} rewardState={hud?.rewards} onChoose={selectReward} />
    </main>
  );
}

function NarrativePortrait({ portrait }) {
  if (!portrait?.source) return null;
  return (
    <div className={`narrative-portrait is-${portrait.variant}`}>
      {portrait.mode === "atlas" ? (
        <span
          className="narrative-portrait-frame"
          role="img"
          aria-label={portrait.alt}
          style={{
            backgroundImage: `url(${portrait.source})`,
            "--portrait-frame-position": `${portrait.frameIndex * 50}%`,
          }}
        />
      ) : (
        <img src={portrait.source} alt={portrait.alt} draggable="false" decoding="async" />
      )}
    </div>
  );
}

function NarrativePanel({ dialogue, assets, region, bossStage, onAdvance }) {
  if (!dialogue) return null;
  const lines = SCENARIO_SCRIPT[dialogue.beat] || [];
  const line = lines[dialogue.index];
  if (!line) return null;
  const finalLine = dialogue.index >= lines.length - 1;
  const portrait = resolveNarrativePortrait(line.speaker, assets, region, bossStage);
  const hostile = Boolean(NARRATIVE_BOSS_REGION_IDS[line.speaker]);
  return (
    <section className="narrative-panel" role="dialog" aria-live="assertive" aria-label="시나리오 대화">
      <NarrativePortrait portrait={portrait} />
      <div className="narrative-copy">
        <small>{hostile ? "적성 통신" : "저항군 통신"}</small>
        <strong>{localizeSpeakerName(line.speaker)}</strong>
        <p>{line.text}</p>
      </div>
      <button type="button" onClick={onAdvance} aria-label={finalLine ? "대화를 끝내고 계속 전진" : "다음 대사"}>
        <span>{finalLine ? "계속 전진" : "다음"}</span><ArrowRight weight="bold" />
      </button>
    </section>
  );
}

function GateLockedNotice({ notice }) {
  if (!notice?.active) return null;
  const remaining = Math.max(0, Number(notice.remainingEnemies) || 0);
  return (
    <aside className="gate-locked-notice" role="status" aria-live="assertive">
      <Warning weight="fill" aria-hidden="true" />
      <div>
        <strong>{notice.title || "보스 구역 봉쇄"}</strong>
        <span>{notice.message || `남은 적 ${remaining}기를 먼저 처치하세요.`}</span>
      </div>
    </aside>
  );
}

const CLEAR_TRANSITION_COPY = Object.freeze({
  warning: Object.freeze(["적 전력 소거 확인", "보스 구역의 방어망이 붕괴합니다."]),
  panic: Object.freeze(["소버린 비상 신호 포착", "지역 추론핵이 퇴로를 봉쇄합니다. 추격을 계속하세요."]),
  swap: Object.freeze(["보스 구역 강제 연결", "전장을 전환하고 있습니다. 곧 최종 교전이 시작됩니다."]),
});

function RouteClearTransition({ transition }) {
  if (!transition?.phase) return null;
  const phase = CLEAR_TRANSITION_COPY[transition.phase] ? transition.phase : "warning";
  const copy = CLEAR_TRANSITION_COPY[phase];
  const progress = Math.max(0, Math.min(1, Number(transition.progress) || 0));
  return (
    <section className={`route-clear-transition is-${phase}`} role="status" aria-live="assertive">
      <div className="route-clear-rings" aria-hidden="true"><i /><i /><i /></div>
      <small>{phase === "panic" ? "적 통신 감청" : phase === "swap" ? "전장 전환" : "구역 전멸"}</small>
      <strong>{copy[0]}</strong>
      <span>{copy[1]}</span>
      <i className="route-clear-progress" aria-hidden="true"><i style={{ width: `${progress * 100}%` }} /></i>
    </section>
  );
}

function clampMapRatio(value, fallback = 0.5) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(1, number)) : fallback;
}

function RouteMinimap({ hud }) {
  const expedition = hud?.expedition;
  if (!expedition) return null;
  const bossRoom = Boolean(hud?.boss || expedition.bossRoom);
  const routeLength = Math.max(1, Number(expedition.routeLength) || 1);
  const progress = bossRoom ? 0.94 : clampMapRatio(expedition.progress, 0);
  const traces = Array.isArray(expedition.traces) ? expedition.traces : [];
  const minimap = expedition.minimap || hud?.minimap || {};
  const player = minimap.player || { x: progress, y: 0.5 };
  const enemies = Array.isArray(minimap.enemies) ? minimap.enemies.slice(0, 32) : [];
  const gate = minimap.bossGate || { x: 1, y: 0.5, locked: expedition.gateLocked };
  const hostiles = Math.max(0, Number(minimap.liveEnemyCount ?? hud?.enemiesRemaining) || 0);

  return (
    <aside className={bossRoom ? "route-minimap is-boss" : "route-minimap"} aria-label={`전술 미니맵. 현재 위치 ${Math.round(progress * 100)}%, 남은 적 ${hostiles}기`}>
      <header><MapTrifold weight="fill" /><span>전술 지도</span><b>적 {hostiles}</b></header>
      <div className="route-minimap-field" aria-hidden="true">
        <i className="route-minimap-path"><i style={{ width: `${clampMapRatio(player.x, progress) * 100}%` }} /></i>
        {traces.map((trace) => (
          <span
            className={trace.triggered ? "route-minimap-node is-cleared" : "route-minimap-node"}
            style={{ left: `${clampMapRatio(Number(trace.distance) / routeLength, 0) * 100}%`, top: "50%" }}
            key={trace.id}
          ><MapPin weight={trace.triggered ? "fill" : "bold"} /></span>
        ))}
        {enemies.map((enemy, index) => (
          <i
            className={`route-minimap-enemy${enemy?.elite ? " is-elite" : ""}`}
            style={{ left: `${clampMapRatio(enemy?.x) * 100}%`, top: `${clampMapRatio(enemy?.y) * 100}%` }}
            key={enemy?.id ?? `${index}-${enemy?.x}-${enemy?.y}`}
          />
        ))}
        <span
          className={`route-minimap-engine${gate?.locked ? " is-locked" : ""}`}
          style={{ left: `${clampMapRatio(gate?.x, 1) * 100}%`, top: `${clampMapRatio(gate?.y) * 100}%` }}
        ><Robot weight="fill" /></span>
        <span
          className="route-minimap-player"
          style={{ left: `${clampMapRatio(player?.x, progress) * 100}%`, top: `${clampMapRatio(player?.y) * 100}%` }}
        ><NavigationArrow weight="fill" /></span>
      </div>
    </aside>
  );
}

function PhaserArenaScreen({ assets, regionId, region, combatBonuses, soundEnabled, sfx, onToggleSound, onFinish, onBase, showCombatTutorial = false, onCombatTutorialComplete }) {
  const hostRef = useRef(null);
  const controllerRef = useRef(null);
  const finishReportedRef = useRef(false);
  const pausedRef = useRef(false);
  const [hud, setHud] = useState(null);
  const [banner, setBanner] = useState(null);
  const [dialogue, setDialogue] = useState(null);
  const [needsLandscape, setNeedsLandscape] = useState(false);
  const [paused, setPaused] = useState(false);
  const [combatTutorialStep, setCombatTutorialStep] = useState(-1);
  const [runRevision, setRunRevision] = useState(0);
  const needsLandscapeRef = useRef(false);
  const airstrikeBannerShownRef = useRef(false);
  const autoBossEntryHandledRef = useRef(false);
  const combatTutorialActiveRef = useRef(false);
  const combatTutorialHandledRef = useRef(false);

  useEffect(() => {
    const query = window.matchMedia("(orientation: portrait) and (max-width: 900px)");
    const syncOrientation = () => {
      needsLandscapeRef.current = query.matches;
      setNeedsLandscape(query.matches);
      controllerRef.current?.setSuspended(query.matches || pausedRef.current || combatTutorialActiveRef.current);
    };
    syncOrientation();
    query.addEventListener?.("change", syncOrientation);
    return () => query.removeEventListener?.("change", syncOrientation);
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    airstrikeBannerShownRef.current = false;
    autoBossEntryHandledRef.current = false;
    let stopped = false;
    let bannerTimeout = 0;

    const showBanner = (event) => {
      let copy = event.type === "bossPatternTelegraph"
        ? SIGNATURE_PATTERN_BANNERS[event.pattern]
        : event.type === "ultimateWarning"
          ? ULTIMATE_WARNING_BANNERS[event.skill] || EVENT_BANNERS.ultimateWarning
          : EVENT_BANNERS[event.type];
      if (event.type === "ultimateWarning" && event.skill === "airstrike") {
        if (airstrikeBannerShownRef.current) return;
        airstrikeBannerShownRef.current = true;
      }
      if (event.type === "bossStage" || event.type === "bossStagePulse") {
        copy = event.stage >= 3
          ? ["⚠ 코어 붕괴 · 3단계", "최종 형상이 전개됩니다. 다중 포신과 광폭 패턴이 최대 출력으로 가동됩니다."]
          : ["⚠ 장갑 파괴 · 2단계", "외부 장갑이 전개됩니다. 공격 속도와 탄막 밀도가 상승합니다."];
      } else if (event.type === "overdrive") {
        copy = [`과부하 ${event.tier}단계 · 제한 해제`, event.tier >= 3
          ? "최종 화력이 해방되어 광역 공격이 전장을 연속 소거합니다."
          : "처치 데이터가 공격 속도와 피해 출력을 증폭합니다."];
      }
      if (!copy) return;
      window.clearTimeout(bannerTimeout);
      setBanner({ key: `${event.type}-${event.time}`, type: event.type, title: copy[0], subtitle: copy[1] });
      const duration = event.type === "bossIntro" ? 920
        : event.type === "bossStage" || event.type === "bossStagePulse" ? 920
          : event.type === "bossContact" || event.type === "bossContactHit" || event.type === "playerStunned" ? 860
            : 1250;
      bannerTimeout = window.setTimeout(() => setBanner(null), duration);
    };

    finishReportedRef.current = false;
    let controller = null;
    void import("./phaser/createOverloadGame.ts").then(({ createOverloadGame }) => {
      if (stopped) return;
      controller = createOverloadGame(host, {
        onHud: (snapshot) => {
          if (!stopped) setHud(snapshot);
        },
        onEvent: (event) => {
          if (stopped) return;
          const sound = resolveEventSound(event);
          if (sound) sfx.play(sound);
          if (event.type === "scenario" && SCENARIO_SCRIPT[event.beat]) {
            setDialogue({ beat: event.beat, index: 0, key: `${event.beat}-${event.time}` });
          }
          if (event.type === "bossAutoTransition" && !autoBossEntryHandledRef.current) {
            autoBossEntryHandledRef.current = true;
            controller?.enterBossRoom();
          }
          showBanner(event);
        },
        onFinish: (result) => {
          if (stopped || finishReportedRef.current) return;
          finishReportedRef.current = true;
          onFinish(result);
        },
        onReady: () => {
          controllerRef.current?.setSuspended(needsLandscapeRef.current || pausedRef.current || combatTutorialActiveRef.current);
          if (!needsLandscapeRef.current && !pausedRef.current && !combatTutorialActiveRef.current) controllerRef.current?.focus();
        },
      }, { regionId, combatBonuses });
      controllerRef.current = controller;
      controller.setSuspended(needsLandscapeRef.current || pausedRef.current || combatTutorialActiveRef.current);
    }).catch(() => {
      if (stopped) return;
      setBanner({ key: "phaser-runtime-error", type: "playerHit", title: "게임 화면 초기화 실패", subtitle: "브라우저의 WebGL 또는 Canvas 지원을 확인해 주세요." });
    });

    return () => {
      stopped = true;
      window.clearTimeout(bannerTimeout);
      controllerRef.current = null;
      controller?.destroy();
    };
  }, [combatBonuses, onFinish, regionId, runRevision, sfx]);

  const selectReward = useCallback((id) => {
    controllerRef.current?.chooseReward(id);
  }, []);

  const setTouchDirection = useCallback((direction, active, event) => {
    event?.preventDefault();
    controllerRef.current?.setDirection(direction, active);
    try {
      if (active) event?.currentTarget?.setPointerCapture?.(event.pointerId);
      else if (event?.currentTarget?.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture can be released by the browser during resize or blur.
    }
  }, []);

  const activateDash = useCallback(() => {
    controllerRef.current?.dash();
  }, []);

  const activateAbility = useCallback((slot) => {
    controllerRef.current?.activateAbility?.(slot);
  }, []);

  const advanceDialogue = useCallback(() => {
    if (!dialogue) return;
    const lines = SCENARIO_SCRIPT[dialogue.beat] || [];
    if (dialogue.index < lines.length - 1) {
      setDialogue({ ...dialogue, index: dialogue.index + 1 });
      return;
    }
    setDialogue(null);
    controllerRef.current?.continueStory();
  }, [dialogue]);

  useEffect(() => {
    if (!dialogue) return undefined;
    const handleDialogueKey = (event) => {
      if (event.code !== "Enter" && event.code !== "Space") return;
      event.preventDefault();
      advanceDialogue();
    };
    window.addEventListener("keydown", handleDialogueKey);
    return () => window.removeEventListener("keydown", handleDialogueKey);
  }, [advanceDialogue, dialogue]);

  const rewardOpen = Boolean(hud?.rewards?.options?.length);

  useEffect(() => {
    if (!showCombatTutorial || combatTutorialHandledRef.current || combatTutorialStep >= 0) return;
    if (!hud || dialogue || rewardOpen || needsLandscapeRef.current) return;
    combatTutorialActiveRef.current = true;
    setCombatTutorialStep(0);
    controllerRef.current?.setSuspended(true);
  }, [combatTutorialStep, dialogue, hud, rewardOpen, showCombatTutorial]);

  const finishCombatTutorial = useCallback(() => {
    if (combatTutorialHandledRef.current) return;
    combatTutorialHandledRef.current = true;
    combatTutorialActiveRef.current = false;
    setCombatTutorialStep(-1);
    onCombatTutorialComplete?.();
    if (!needsLandscapeRef.current && !pausedRef.current && !dialogue && !rewardOpen) {
      controllerRef.current?.setSuspended(false);
      controllerRef.current?.focus();
    }
  }, [dialogue, onCombatTutorialComplete, rewardOpen]);

  const advanceCombatTutorial = useCallback(() => {
    if (combatTutorialStep >= MANUAL_ABILITY_GUIDE.length - 1) {
      finishCombatTutorial();
      return;
    }
    setCombatTutorialStep((step) => Math.min(MANUAL_ABILITY_GUIDE.length - 1, step + 1));
  }, [combatTutorialStep, finishCombatTutorial]);

  const rewindCombatTutorial = useCallback(() => {
    setCombatTutorialStep((step) => Math.max(0, step - 1));
  }, []);

  const resumeCombat = useCallback(() => {
    if (needsLandscapeRef.current || combatTutorialActiveRef.current) return;
    pausedRef.current = false;
    setPaused(false);
    controllerRef.current?.setSuspended(false);
    controllerRef.current?.focus();
  }, []);

  const restartCombat = useCallback(() => {
    controllerRef.current?.setSuspended(true);
    pausedRef.current = false;
    setPaused(false);
    setBanner(null);
    setDialogue(null);
    setHud(null);
    setRunRevision((revision) => revision + 1);
  }, []);

  const returnToBase = useCallback(() => {
    if (!onBase) return;
    controllerRef.current?.setSuspended(true);
    pausedRef.current = false;
    setPaused(false);
    onBase();
  }, [onBase]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (paused && event.key !== "Escape") {
        if (PAUSED_GAMEPLAY_KEYS.has(event.code)) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
        return;
      }
      if (event.key !== "Escape" || event.repeat) return;
      if (paused) {
        event.preventDefault();
        event.stopImmediatePropagation();
        resumeCombat();
        return;
      }
      if (needsLandscapeRef.current || combatTutorialActiveRef.current || dialogue || rewardOpen) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      pausedRef.current = true;
      setPaused(true);
      controllerRef.current?.setSuspended(true);
    };
    window.addEventListener("keydown", handleEscape, true);
    return () => window.removeEventListener("keydown", handleEscape, true);
  }, [dialogue, paused, resumeCombat, rewardOpen]);

  const xpRatio = Math.max(0, Math.min(1, Number(hud?.xp || 0) / Math.max(1, Number(hud?.nextXp || 1))));
  const routeRatio = hud?.boss
    ? Math.max(0, Math.min(1, Number(hud.boss.hp || 0) / Math.max(1, Number(hud.boss.maxHp || 1))))
    : Math.max(0, Math.min(1, Number(hud?.expedition?.progress || 0)));
  const playerStunTime = Math.max(0, Number(hud?.player?.stunTimer ?? hud?.player?.stun ?? hud?.player?.stunnedFor ?? 0) || 0);
  const playerStunned = Boolean(hud?.player?.stunned) || playerStunTime > 0;

  return (
    <main className="expedition-game is-phaser-runtime">
      <section className="expedition-stage">
          <div className="expedition-canvas-frame">
            <div
              ref={hostRef}
              className="game-canvas phaser-host"
              role="application"
              tabIndex="0"
              aria-label="TRAIN ME WRONG Phaser 전진형 생존 전장. 포인터 위치가 조준점입니다."
              onPointerDown={() => controllerRef.current?.focus()}
            />
            <div className="expedition-hud" aria-label="필수 전투 정보">
              <div className={hud?.boss ? "route-objective is-boss" : "route-objective"}>
                <span>{hud?.boss ? `${hud.boss.stage || 1}단계` : `${hud?.expedition?.bossRoom ? 4 : Math.min(3, (hud?.expedition?.checkpoint || 0) + 1)} / 4 구간`}</span>
                <strong>{hud?.boss ? localizeBossName(hud.boss.name) : localizeObjective(hud?.expedition?.objective, hud)}</strong>
                <div><i style={{ width: `${routeRatio * 100}%` }} /></div>
                <b>{hud?.boss ? `체력 ${Math.ceil(hud.boss.hp || 0)}` : `남은 적 ${hud?.enemiesRemaining ?? 0}기`}</b>
              </div>
              <button type="button" className="expedition-sound" onClick={onToggleSound} aria-label={soundEnabled ? "전체 사운드 끄기" : "전체 사운드 켜기"}>
                {soundEnabled ? <SpeakerHigh weight="fill" /> : <SpeakerSlash />}
              </button>
            </div>
            <ExpeditionCombatDock
              hud={hud}
              onDash={activateDash}
              onActivateAbility={activateAbility}
              tutorialAbilityId={combatTutorialStep >= 0 ? MANUAL_ABILITY_GUIDE[combatTutorialStep]?.id : null}
              onTutorialTarget={advanceCombatTutorial}
            />
            {combatTutorialStep >= 0 && (
              <CombatAbilityTutorialOverlay
                stepIndex={combatTutorialStep}
                portrait={assets?.rheaControlOfficer}
                onNext={advanceCombatTutorial}
                onBack={rewindCombatTutorial}
                onSkip={finishCombatTutorial}
              />
            )}
            {banner && (
              <div key={banner.key} className={`expedition-alert banner-${banner.type}`} aria-live="assertive">
                <strong>{banner.title}</strong><span>{banner.subtitle}</span>
              </div>
            )}
            {playerStunned && <div className="stun-screen-effect" aria-hidden="true"><i /><i /><i /><i /></div>}
            {!dialogue && <RouteMinimap hud={hud} />}
            {!dialogue && <GateLockedNotice notice={hud?.expedition?.gateNotice} />}
            {!dialogue && <RouteClearTransition transition={hud?.expedition?.clearTransition} />}
            <div className="expedition-xp"><i style={{ width: `${xpRatio * 100}%` }} /></div>
            <div className="transient-controls"><span>이동: WASD</span><span>포인터로 조준 · 소총 자동 발사</span></div>
            <div className="touch-controls expedition-touch-controls" aria-label="터치 전투 조작">
          <div className="touch-dpad">
            <button className="touch-up" type="button" aria-label="위로 이동" onPointerDown={(event) => setTouchDirection("up", true, event)} onPointerUp={(event) => setTouchDirection("up", false, event)} onPointerCancel={(event) => setTouchDirection("up", false, event)}><ArrowUp weight="bold" /></button>
            <button className="touch-left" type="button" aria-label="왼쪽으로 이동" onPointerDown={(event) => setTouchDirection("left", true, event)} onPointerUp={(event) => setTouchDirection("left", false, event)} onPointerCancel={(event) => setTouchDirection("left", false, event)}><ArrowLeft weight="bold" /></button>
            <button className="touch-down" type="button" aria-label="아래로 이동" onPointerDown={(event) => setTouchDirection("down", true, event)} onPointerUp={(event) => setTouchDirection("down", false, event)} onPointerCancel={(event) => setTouchDirection("down", false, event)}><ArrowDown weight="bold" /></button>
            <button className="touch-right" type="button" aria-label="오른쪽으로 이동" onPointerDown={(event) => setTouchDirection("right", true, event)} onPointerUp={(event) => setTouchDirection("right", false, event)} onPointerCancel={(event) => setTouchDirection("right", false, event)}><ArrowRight weight="bold" /></button>
          </div>
            </div>
            <NarrativePanel dialogue={dialogue} assets={assets} region={region} bossStage={hud?.boss?.stage} onAdvance={advanceDialogue} />
            {paused && <PauseOverlay onResume={resumeCombat} onRestart={restartCombat} onBase={onBase ? returnToBase : null} />}
          </div>
      </section>

      {needsLandscape && (
        <div className="landscape-guard" role="status" aria-live="polite">
          <ArrowCounterClockwise weight="bold" />
          <strong>가로 모드로 회전해 주세요</strong>
          <span>전투는 화면이 가로로 전환될 때까지 일시 정지됩니다.</span>
        </div>
      )}

      <LevelUpOverlay offer={hud?.rewards?.options} level={hud?.level || 1} assets={assets} rewardState={hud?.rewards} onChoose={selectReward} />
    </main>
  );
}

function ResultScreen({ result, assets, region, onRestart, onBase }) {
  const victory = result?.status === "victory" || result?.phase === "victory";
  const accuracy = result?.stats?.shots ? Math.round((result.stats.hits || 0) / result.stats.shots * 100) : 0;
  const bossName = region?.boss?.name || "SOVEREIGN CORE";
  const bossDisplayName = localizeBossName(bossName);
  return (
    <main className={victory ? "overload-result is-victory" : "overload-result is-defeat"}>
      <div className="ambient-grid" aria-hidden="true" />
      {assets?.map && <img className="result-map" src={assets.map.src} alt="" />}
      <section className="result-card">
        <div className="result-emblem">{victory ? <Trophy weight="fill" /> : <Warning weight="fill" />}</div>
        <div className="result-kicker">{victory ? `${bossDisplayName} 파괴 완료` : "이지스 신호 소실"}</div>
        <h1>{victory ? "작전 성공" : "작전 실패"}</h1>
        <p>{victory ? `${region?.koreanName || "작전 구역"}의 군단과 지역 추론핵을 파괴했습니다. 전투 기록을 기지로 전송합니다.` : "소버린이 이번 전투 패턴을 학습했습니다. 다음 출격에서는 이동과 성장 선택을 바꿔 보세요."}</p>
        {(assets?.bossPhase3 || assets?.boss) && <img className="result-boss" src={(assets.bossPhase3 || assets.boss).src} alt={`${bossDisplayName} 최종 광폭화 형상`} />}
        <div className="result-stats">
          <span><small>처치한 적</small><b>{result?.kills || result?.stats?.kills || 0}</b></span>
          <span><small>최종 레벨</small><b>LV.{result?.level || 1}</b></span>
          <span><small>명중률</small><b>{accuracy}%</b></span>
          <span><small>작전 시간</small><b>{formatTime(result?.time || 0)}</b></span>
        </div>
        <button className="primary-cta" type="button" onClick={onRestart}><span>같은 구역 재도전</span><ArrowCounterClockwise weight="bold" /></button>
        {onBase && <button className="result-base-return" type="button" onClick={onBase}>헤이븐-09로 귀환</button>}
      </section>
    </main>
  );
}

export function App() {
  const { assets, error: assetError } = useGameAssets();
  const [screen, setScreen] = useState("intro");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [result, setResult] = useState(null);
  const [campaign, setCampaign] = useState(() => loadCampaign());
  const [activeSlotId, setActiveSlotId] = useState(null);
  const [activeRegionId, setActiveRegionId] = useState(DEFAULT_REGION_ID);
  const [activeNpc, setActiveNpc] = useState(null);
  const [npcLineIndex, setNpcLineIndex] = useState(0);
  const [activeFacilityId, setActiveFacilityId] = useState(null);
  const [guideReturnScreen, setGuideReturnScreen] = useState("game");
  const bgmRef = useRef(null);
  const sfx = useMemo(() => createSfxEngine(), []);
  const regions = useMemo(() => getCampaignRegions(), []);
  const npcs = useMemo(() => Object.values(BASE_NPCS), []);
  const activeSlot = useMemo(
    () => (activeSlotId ? getCampaignSlot(campaign, activeSlotId) : null),
    [activeSlotId, campaign],
  );
  const activeRegion = useMemo(() => getRegion(activeRegionId) || getRegion(DEFAULT_REGION_ID), [activeRegionId]);
  const slotIndex = activeSlotId ? Math.max(0, Number(activeSlotId.split("-")[1] || 1) - 1) : 0;
  const campaignView = activeSlot ? { ...activeSlot, slotIndex } : null;
  const combatBonuses = useMemo(
    () => (activeSlotId ? getCampaignCombatBonuses(campaign, activeSlotId) : null),
    [activeSlotId, campaign],
  );
  const activeFacility = useMemo(() => {
    if (!activeFacilityId || !activeSlotId || !activeSlot) return null;
    const facility = getBaseFacility(activeFacilityId);
    if (!facility) return null;
    const currency = BASE_CURRENCIES[facility.currencyId];
    const copy = FACILITY_COPY[facility.id] || {};
    const progression = activeSlot.progression || {};
    const upgrades = getBaseUpgrades(facility.npcId).map((upgrade, index) => {
      const status = getCampaignUpgradeStatus(campaign, activeSlotId, upgrade.id);
      const rank = status.rank || 0;
      const currentRanks = upgrade.ranks.slice(0, rank);
      const nextRanks = upgrade.ranks.slice(0, Math.min(upgrade.ranks.length, rank + 1));
      const lockedReason = status.reason === "rank-locked"
        ? `${status.requiredCompletedRegions}개 지역 해방 필요`
        : status.reason === "base-locked" ? "헤이븐-09 잠김" : null;
      return {
        id: upgrade.id,
        order: index + 1,
        category: upgrade.category === "research" ? "영구 연구" : "영구 장비",
        name: upgrade.koreanName,
        description: upgrade.description,
        rank,
        maxRank: upgrade.ranks.length,
        currentEffect: formatBaseBonusEntries(currentRanks),
        nextEffect: formatBaseBonusEntries(nextRanks),
        nextCost: status.cost || 0,
        canPurchase: Boolean(status.purchasable),
        lockedReason,
      };
    });
    return {
      ...facility,
      ...copy,
      name: facility.koreanName,
      currency: progression[facility.currencyId] || 0,
      currencyLabel: currency?.koreanName || facility.currencyId,
      currencyShortLabel: facility.currencyId === "researchData" ? "연구 자료" : "장비 부품",
      upgrades,
    };
  }, [activeFacilityId, activeSlotId, activeSlot, campaign]);
  const campaignAssets = useMemo(() => ({
    homeBase: assets?.havenBase,
    npcPortraits: assets?.havenNpcPortraits,
    controlOfficer: assets?.rheaControlOfficer,
    regionMap: assets?.airshipRegionMap,
    tutorialNullSnare: assets?.tutorialNullSnare,
    tutorialAegisWard: assets?.tutorialAegisWard,
    tutorialStratosRun: assets?.tutorialStratosRun,
    tutorialHelixTempest: assets?.tutorialHelixTempest,
  }), [assets]);
  const debugGuideBypass = import.meta.env.DEV
    && typeof window !== "undefined"
    && new URLSearchParams(window.location.search).get("debug") === "1";

  useEffect(() => () => {
    bgmRef.current?.pause();
    sfx.dispose();
  }, [sfx]);
  useEffect(() => sfx.setEnabled(soundEnabled), [sfx, soundEnabled]);
  useEffect(() => {
    if (bgmRef.current) bgmRef.current.muted = !soundEnabled;
  }, [soundEnabled]);

  const startAudio = useCallback((restart = false) => {
    sfx.start();
    const bgm = bgmRef.current;
    if (bgm) {
      if (restart) bgm.currentTime = 0;
      bgm.volume = 0.38;
      bgm.muted = !soundEnabled;
      bgm.play().catch(() => {
        // Browsers may still decline playback if the initiating gesture is lost.
      });
    }
  }, [sfx, soundEnabled]);

  const openSaveSlots = useCallback(() => {
    sfx.start();
    sfx.play("start");
    startAudio(false);
    setScreen("save");
  }, [sfx, startAudio]);

  const launchCombat = useCallback((regionId) => {
    const slot = activeSlotId ? getCampaignSlot(campaign, activeSlotId) : null;
    if (!slot || !canLaunchRegion(slot, regionId)) return;
    setActiveNpc(null);
    setActiveFacilityId(null);
    setActiveRegionId(regionId);
    setResult(null);
    if (!slot.abilityGuideSeen && !debugGuideBypass) {
      setGuideReturnScreen("game");
      setScreen("guide");
      return;
    }
    startAudio(true);
    setScreen("game");
  }, [activeSlotId, campaign, debugGuideBypass, startAudio]);

  const selectSaveSlot = useCallback((index) => {
    const slotId = `slot-${index + 1}`;
    const existing = getCampaignSlot(campaign, slotId);
    const nextCampaign = existing ? campaign : createCampaignSlot(campaign, slotId);
    const nextSlot = getCampaignSlot(nextCampaign, slotId);
    setCampaign(nextCampaign);
    saveCampaign(nextCampaign);
    setActiveSlotId(slotId);
    setActiveRegionId(nextSlot?.lastRegionId || DEFAULT_REGION_ID);
    setActiveNpc(null);
    setActiveFacilityId(null);
    setResult(null);
    if (!nextSlot?.abilityGuideSeen && !debugGuideBypass) {
      setGuideReturnScreen(nextSlot?.homeBaseUnlocked ? "base" : "game");
      setScreen("guide");
      return;
    }
    if (nextSlot?.homeBaseUnlocked) {
      setScreen("base");
      return;
    }
    startAudio(true);
    setScreen("game");
  }, [campaign, debugGuideBypass, startAudio]);

  const finish = useCallback((nextResult) => {
    const bgm = bgmRef.current;
    const status = nextResult?.status || nextResult?.phase;
    const regionId = nextResult?.regionId || activeRegionId;
    if (status === "victory" && activeSlotId) {
      const completed = completeRegion(campaign, activeSlotId, regionId, {
        ...nextResult,
        status: "victory",
        runId: nextResult?.runId || `${regionId}-${Date.now()}`,
      });
      saveCampaign(completed);
      setCampaign(completed);
      setResult({ ...nextResult, regionId });
      setActiveNpc(null);
      setActiveFacilityId(null);
      if (bgm) bgm.volume = 0.18;
      setScreen("base");
      return;
    }
    if (bgm) {
      bgm.pause();
      bgm.currentTime = 0;
    }
    setResult({ ...nextResult, regionId });
    setScreen("result");
  }, [activeRegionId, activeSlotId, campaign]);

  const talkToNpc = useCallback((npc) => {
    setActiveFacilityId(null);
    setActiveNpc(npc);
    setNpcLineIndex(0);
  }, []);

  const closeNpc = useCallback(() => {
    setActiveNpc(null);
    setNpcLineIndex(0);
  }, []);

  const openFacility = useCallback((facilityId) => {
    if (!getBaseFacility(facilityId)) return;
    setActiveNpc(null);
    setNpcLineIndex(0);
    setActiveFacilityId(facilityId);
  }, []);

  const closeFacility = useCallback(() => setActiveFacilityId(null), []);

  const handleNpcInteraction = useCallback((interaction) => {
    closeNpc();
    closeFacility();
    if (interaction === "open-ability-guide") {
      setGuideReturnScreen("base");
      setScreen("guide");
      return;
    }
    if (interaction === "open-region-select") setScreen("regions");
  }, [closeFacility, closeNpc]);

  const finishAbilityGuide = useCallback(() => {
    let nextCampaign = campaign;
    if (activeSlotId) {
      nextCampaign = completeAbilityGuide(campaign, activeSlotId);
      setCampaign(nextCampaign);
      saveCampaign(nextCampaign);
    }
    setActiveNpc(null);
    setNpcLineIndex(0);
    setActiveFacilityId(null);
    if (guideReturnScreen === "game") startAudio(true);
    setScreen(guideReturnScreen);
  }, [activeSlotId, campaign, guideReturnScreen, startAudio]);

  const finishCombatOverlay = useCallback(() => {
    if (!activeSlotId) return;
    const nextCampaign = completeCombatOverlay(campaign, activeSlotId);
    setCampaign(nextCampaign);
    saveCampaign(nextCampaign);
  }, [activeSlotId, campaign]);

  const purchaseBaseUpgrade = useCallback((upgradeId) => {
    if (!activeSlotId) return;
    const purchase = purchaseCampaignUpgrade(campaign, activeSlotId, upgradeId);
    if (!purchase.ok) {
      sfx.play("alert");
      return;
    }
    setCampaign(purchase.campaign);
    saveCampaign(purchase.campaign);
    sfx.play("upgrade");
  }, [activeSlotId, campaign, sfx]);

  const toggleSound = useCallback(() => {
    const nextEnabled = !soundEnabled;
    setSoundEnabled(nextEnabled);
  }, [soundEnabled]);

  let content;
  if (screen === "save") {
    content = <SaveSlotScreen slots={campaign.slots} onSelect={selectSaveSlot} onBack={() => setScreen("intro")} />;
  } else if (screen === "guide") {
    content = (
      <AbilityGuideScreen
        assets={campaignAssets}
        onComplete={finishAbilityGuide}
        onBack={guideReturnScreen === "base" ? () => setScreen("base") : null}
      />
    );
  } else if (screen === "base" && campaignView) {
    content = (
      <HomeBaseScreen
        campaign={campaignView}
        npcs={npcs}
        assets={campaignAssets}
        activeNpc={activeNpc}
        lineIndex={npcLineIndex}
        activeFacility={activeFacility}
        onNpc={talkToNpc}
        onAdvanceNpc={() => setNpcLineIndex((index) => index + 1)}
        onCloseNpc={closeNpc}
        onOpenFacility={openFacility}
        onNpcInteraction={handleNpcInteraction}
        onPurchaseUpgrade={purchaseBaseUpgrade}
        onCloseFacility={closeFacility}
        onBoard={() => { closeNpc(); closeFacility(); setScreen("regions"); }}
        onTitle={() => { closeNpc(); closeFacility(); setScreen("save"); }}
      />
    );
  } else if (screen === "regions" && campaignView) {
    content = <RegionSelectScreen regions={regions} campaign={campaignView} assets={campaignAssets} onSelect={launchCombat} onBack={() => setScreen("base")} />;
  } else if (screen === "game") {
    content = (
      <PhaserArenaScreen
        assets={assets}
        regionId={activeRegionId}
        region={activeRegion}
        combatBonuses={combatBonuses}
        soundEnabled={soundEnabled}
        sfx={sfx}
        onToggleSound={toggleSound}
        onFinish={finish}
        onBase={activeSlot?.homeBaseUnlocked ? () => setScreen("base") : null}
        showCombatTutorial={Boolean(activeSlot && !activeSlot.combatOverlaySeen && !debugGuideBypass)}
        onCombatTutorialComplete={finishCombatOverlay}
      />
    );
  } else if (screen === "result") {
    content = <ResultScreen result={result} assets={assets} region={activeRegion} onRestart={() => launchCombat(activeRegionId)} onBase={activeSlot?.homeBaseUnlocked ? () => setScreen("base") : null} />;
  } else {
    content = <IntroScreen assets={assets} assetError={assetError} onStart={openSaveSlots} />;
  }

  return (
    <>
      {content}
      <audio ref={bgmRef} src={BGM_PATH} loop preload="metadata" hidden aria-hidden="true" />
    </>
  );
}
