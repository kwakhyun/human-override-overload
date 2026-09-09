import { resolveSortieRoster } from './game/content/sortieFormation.js';
import { getRegionalTerrain } from './game/content/regionalTerrain.js';
import { NpcPortraitImage } from './ui/portrait/NpcPortraitImage.jsx';
import { OperativePortraitImage } from './ui/portrait/InteractivePortrait.jsx';
import { StorySceneScreen, StoryArchiveScreen } from './ui/campaign/StoryScreens.jsx';
import { STORY_ART, STORY_EPISODES, isStoryAvailable } from './game/content/storyEpisodes.js';
import { ExpeditionCombatDock } from './ui/combat/ExpeditionCombatDock.jsx';
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowCounterClockwise,
  ArrowLeft,
  ArrowRight,
  Crosshair,
  GearSix,
  Lightning,
  MapPin,
  MapTrifold,
  HouseLine,
  NavigationArrow,
  Pause,
  Play,
  Pulse,
  ShieldChevron,
  SpeakerHigh,
  SpeakerSlash,
  Sparkle,
  Sword,
  Target,
  Timer,
  Trophy,
  Warning,
} from "@phosphor-icons/react";
import { createSfxEngine } from "./audio/sfx.js";
import { resolveMusicTrack, musicTrackGain } from "./audio/music.js";
import { createMusicPlayer } from "./audio/musicPlayer.js";
import { createAgentVoice } from "./audio/agentVoice.js";
import { DOM_PREVIEW_ASSET_PATHS, getRegionArenaAsset } from "./game/assets/manifest.ts";
import { preloadDomImages, scheduleDomImagePreload } from "./game/assets/domPreloader.js";
import { useDialogFocusTrap } from "./ui/useDialogFocusTrap.js";
import { GameSettingsOverlay } from "./ui/settings/GameSettingsOverlay.jsx";
import {
  DEFAULT_GAME_SETTINGS,
  GAME_SETTINGS_STORAGE_KEY as SETTINGS_STORAGE_KEY,
  loadGameSettings,
  mergeGameSettings,
  persistGameSettings,
} from "./game/settings/gameSettings.js";
import {
  BASE_NPCS,
  DEFAULT_REGION_ID,
  getCampaignRegions,
  getRegionClusters,
  OUTER_SECTOR_BRIEFING_FLAG,
  getRegion,
} from "./game/content/campaign.js";
import {
  BASE_CURRENCIES,
  getBaseFacility,
  getBaseResourceExchanges,
  getBaseUpgrades,
} from "./game/content/baseUpgrades.js";
import { getMainWeapons, isMainWeaponUnlocked } from "./game/content/weapons.js";
import { getPlayableCharacters, isCharacterUnlocked } from "./game/content/characters.js";
import { getCharacterSkillLoadout, getCharacterSkillRanks } from "./game/content/characterSkills.js";
import { resolveCharacterDialogueLine } from "./game/content/characterDialogue.js";
import { getFlightPlans } from "./game/content/flightOperations.js";
import { getDefenseStage, getDefenseStages } from "./defense/content.js";
import {
  canLaunchRegion,
  canLaunchDefenseStage,
  consumeCampaignPostVictoryStep,
  completeAbilityGuide,
  completeSwordAbilityGuide,
  completeCombatOverlay,
  completeDefenseGuide,
  completeOuterSectorBriefing,
  completeRegion,
  completeDefenseStage,
  createCampaignSlot,
  getCampaignCombatBonuses,
  getCampaignFlightPlan,
  getCampaignMainWeapon,
  getCampaignPostVictorySteps,
  getCampaignCharacter,
  getCampaignSlot,
  getCampaignResourceExchangeStatus,
  getCampaignUpgradeStatus,
  exchangeCampaignResources,
  loadCampaign,
  purchaseCampaignUpgrade,
  saveCampaign,
  setCampaignMainWeapon,
  setCampaignCharacter,
  setCampaignFlightPlan,
} from "./game/save/campaignSave.js";
import { startCampaignCloudSync } from "./game/save/cloudCampaignSync.js";
import {
  AbilityGuideScreen,
  DefenseStageSelectScreen,
  HomeBaseScreen,
  LarkFlightOperationsScreen,
  MANUAL_ABILITY_GUIDE,
  RegionSelectScreen,
  ReturnCinematicScreen,
  SaveSlotScreen,
  SortieCinematicScreen,
} from "./ui/campaign/CampaignScreens.jsx";
import { DefenseArenaScreen, DefenseResultScreen } from "./ui/defense/DefenseScreens.jsx";
import {
  EVENT_BANNERS,
  NARRATIVE_BOSS_REGION_IDS,
  SCENARIO_SCRIPT,
  SIGNATURE_PATTERN_BANNERS,
  ULTIMATE_WARNING_BANNERS,
  localizeBossName,
  localizeObjective,
  localizeSpeakerName,
  mixedRegionName,
  resolveEventSound,
  resolveNarrativePortrait,
} from "./ui/combat/combatPresentation.js";
const ASSET_PATHS = DOM_PREVIEW_ASSET_PATHS;
// DOM screens consume URL refs while a small, screen-scoped warmup layer makes
// the next visible surface decode-ready. Phaser textures remain owned by its
// loader and are never mirrored through this DOM-only cache.
const DOM_ASSET_REFS = Object.freeze(Object.fromEntries(
  Object.entries(ASSET_PATHS).map(([key, source]) => [key, Object.freeze({ src: source })]),
));

const INITIAL_DOM_ASSET_KEYS = Object.freeze(["intro"]);
const BASE_NPC_DOM_ASSET_KEYS = Object.freeze([
  "hanaPortrait",
  "ilyaPortrait",
  "nightjarPilot",
  "rheaControlOfficer",
]);
const REGION_MAP_DOM_ASSET_KEYS = Object.freeze(["airshipRegionMap", "innerNetworkRegionMap", "outerFrontierRegionMap", "player", "mikaPortrait", "vesperPortrait", "noxPortrait"]);
const GUIDE_DOM_ASSET_KEYS = Object.freeze([
  "rheaControlOfficer",
  "tutorialEmpPulse",
  "tutorialAegisWard",
  "tutorialStratosRun",
  "tutorialHelixTempest",
]);
const DEFENSE_DOM_ASSET_KEYS = Object.freeze(["defenseBattlefield", "defenseBattlefieldPortrait"]);
const COMBAT_REWARD_DOM_ASSET_KEYS = Object.freeze(Object.keys(ASSET_PATHS).filter((key) => key.startsWith("reward")));

function domAssetSources(keys) {
  return keys.map((key) => DOM_ASSET_REFS[key]?.src).filter(Boolean);
}

function characterPortraitAssetKey(characterId) {
  if (characterId === "mika") return "mikaPortrait";
  if (characterId === "vesper") return "vesperPortrait";
  if (characterId === "nox") return "noxPortrait";
  return "player";
}

function baseSurfaceAssetKeys(characterId) {
  return ["havenLobby", characterPortraitAssetKey(characterId), ...BASE_NPC_DOM_ASSET_KEYS];
}

const BASE_BONUS_LABELS = Object.freeze({
  damageMultiplier: ["공격 피해", "percent"],
  xpGainMultiplier: ["경험치 획득", "percent"],
  moveSpeedMultiplier: ["이동 속도", "percent"],
  fireRateMultiplier: ["발사 속도", "percent"],
  rifleDamageMultiplier: ["소총 피해", "percent"],
  swordDamageMultiplier: ["검술 피해", "percent"],
  maxHpFlat: ["최대 내구도", "flat"],
  healingMultiplier: ["회복 효율", "percent"],
});

const FACILITY_COPY = Object.freeze({
  research: {
    kicker: "하나 · 전술 데이터 분석실",
    description: "전장에서 회수한 연산 데이터를 분석하여 상시 전술 능력을 영구 증폭합니다. 상위 단계 연구는 추가 작전 구역 해방이 필요합니다.",
    currencyHint: "지역 추론핵을 파괴하면 획득",
  },
  equipment: {
    kicker: "일리야 · 병기 및 외골격 정비소",
    description: "노획한 장비 부품으로 주무기 펄스 소총과 빔 소드, 방호 장갑 및 나나이트 수복기를 영구 개조합니다.",
    currencyHint: "적 군단과 보스의 잔해에서 회수",
  },
  augmentation: {
    kicker: "헤이븐-09 · 신경 동기화 챔버",
    description: "동기화 코어를 주입하여 전투원의 기체 반응성과 전투 신경계를 영구적으로 증강합니다.",
    currencyHint: "지역을 반복 공략하고 추론핵을 파괴하면 획득",
  },
});

function formatBaseBonusEntries(entries = []) {
  const totals = new Map();
  for (const entry of entries) {
    for (const [key, value] of Object.entries(entry?.bonuses || {})) totals.set(key, (totals.get(key) || 0) + Number(value || 0));
  }
  if (!totals.size) return "효과 없음";
  return [...totals].map(([key, value]) => {
    const [label, type] = BASE_BONUS_LABELS[key] || [key, "flat"];
    return `${label} +${type === "percent" ? Math.round(value * 100) + "%" : Math.round(value)}`;
  }).join(" · ");
}

function formatCurrencyMap(values = {}) {
  return Object.entries(values).map(([currencyId, amount]) => {
    const label = BASE_CURRENCIES[currencyId]?.koreanName || currencyId;
    return `${label} ${Math.max(0, Number(amount) || 0)}`;
  }).join(" + ");
}

function primeCombatAim(host) {
  if (!host || typeof window === "undefined") return;
  const canvas = host.querySelector?.("canvas");
  if (!canvas) return;
  const bounds = canvas.getBoundingClientRect();
  if (!(bounds.width > 0 && bounds.height > 0)) return;
  const options = {
    bubbles: true,
    clientX: bounds.left + bounds.width * 0.78,
    clientY: bounds.top + bounds.height * 0.5,
    pointerId: 1,
    pointerType: "mouse",
    isPrimary: true,
  };
  const PointerEventClass = window.PointerEvent || window.MouseEvent;
  canvas.dispatchEvent(new PointerEventClass("pointermove", options));
}

const CATEGORY_META = Object.freeze({
  weapon: { label: "신규 무기", korean: "무기", color: "cyan" },
  skill: { label: "핵심 기술", korean: "기술", color: "amber" },
  ally: { label: "전투 동료", korean: "동료", color: "violet" },
});


const REWARD_NAMES_KO = Object.freeze({
  haloMatrix: "프리즘 링 동기화",
  prismTempo: "프리즘 템포",
  heartGuard: "하트 가드",
  scatter: "산탄 배열",
  rail: "관통 레일탄",
  rocket: "유도 폭발탄",
  orbit: "궤도 칼날",
  crescentWave: "초승달 검기",
  titanEdge: "거대 검신",
  flashRend: "섬광 돌진참",
  bladeStorm: "환검 폭풍",
  damage: "화력 증폭",
  fireRate: "가속 격발",
  multishot: "다중 탄두",
  shield: "재생 방벽",
  dash: "위상 대시",
  regen: "나나이트 수복",
  edgeReach: "검신 공명",
  edgeGuard: "수호 검집",
  chain: "연쇄 전격",
  nova: "영점 충격파",
  airstrike: "공중 폭격",
  omegaLaser: "오메가 레이저",
  drone: "추적 드론",
  sentry: "관통 호위기",
  suppressor: "억제 지원기",
});

const PAUSED_GAMEPLAY_KEYS = new Set(["Space", "KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "KeyQ", "KeyE", "KeyF", "KeyR", "KeyT", "Digit1", "Digit2", "Digit3"]);

const REWARD_COPY = Object.freeze({
  haloMatrix: "미카의 기본 링 블레이드를 단발 무관통 상태에서 쌍발·고속·다중 관통 공격으로 단계적으로 동기화합니다.",
  prismTempo: "헤일로 적중 시 미카의 수동 스킬 재사용 대기시간을 줄이고 칼날의 관통력을 강화합니다.",
  heartGuard: "미카의 수동 스킬이 적중하면 전용 프리즘 방벽을 회복합니다.",
  scatter: "근거리 부채꼴 탄막으로 밀집한 적을 한 번에 찢습니다.",
  rail: "한 줄의 적을 끝까지 관통하는 고출력 레일 탄을 발사합니다.",
  rocket: "밀집 지점에 광역 폭발을 일으키는 유도 로켓을 추가합니다.",
  orbit: "플레이어 주위를 회전하며 접근한 적을 절단합니다.",
  crescentWave: "조준 방향으로 화려한 검기를 날려 한 줄의 적을 관통합니다.",
  titanEdge: "검신이 일정 시간 거대해지며 주변 전장을 한 번에 휩씁니다.",
  flashRend: "조준 방향으로 빠르게 돌진해 긴 경로의 적을 베어냅니다.",
  bladeStorm: "주변을 여러 차례 회전 베기해 포위한 적을 밀어냅니다.",
  damage: "모든 무기와 동료가 주는 피해가 25% 증가합니다.",
  fireRate: "전체 무기의 공격 주기가 19% 빨라집니다.",
  multishot: "기본 펄스 사격에 추가 투사체 한 발을 결합합니다.",
  shield: "피격 후 다시 충전되는 내구도 40의 보호막을 얻습니다.",
  dash: "대시 재사용 시간이 줄고 무적 시간이 길어집니다.",
  regen: "손상된 체력을 전투 중 지속적으로 복구합니다.",
  edgeReach: "모든 검술의 사거리와 충격 피해가 증가합니다.",
  edgeGuard: "검 공격이 적중할 때마다 소형 전투 방벽을 재충전합니다.",
  chain: "밀집한 적 사이를 연쇄 번개가 도약합니다. 3랭크에서 전장 폭풍으로 진화합니다.",
  nova: "주기적으로 충격파를 방출합니다. 3랭크에서 화면 전체를 휩쓰는 이중 폭발이 됩니다.",
  airstrike: "긴 재사용 시간 뒤 적 밀집 지역을 연속 폭격합니다. 마스터 시 15발 포화 폭격을 호출합니다.",
  omegaLaser: "조준 방향으로 거대 레이저포를 호출합니다. 마스터 시 광폭 빔이 전장을 관통합니다.",
  drone: "장거리에서 적을 추적하는 기동 편대입니다. 고랭크에서 장갑을 관통합니다.",
  sentry: "현재 전투원을 따라 이동하며 좌우 한 쌍의 관통탄을 발사합니다. 고랭크에서 고속 관통 편대로 진화합니다.",
  suppressor: "EMP를 반복 방출해 밀집한 적의 속도를 늦추고 피해를 주는 광역 제어 동료입니다.",
});

const REWARD_ART_KEYS = Object.freeze({
  haloMatrix: "rewardPulse",
  prismTempo: "rewardFireRate",
  heartGuard: "rewardShield",
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
  const [state, setState] = useState({ ready: false, error: false, progress: 0 });

  useEffect(() => {
    let active = true;
    void preloadDomImages(domAssetSources(INITIAL_DOM_ASSET_KEYS), (progress) => {
      if (active) setState((current) => ({ ...current, progress }));
    }).then(({ failed }) => {
      if (active) setState({ ready: true, error: failed > 0, progress: 1 });
    });
    return () => {
      active = false;
    };
  }, []);

  return {
    assets: state.ready ? DOM_ASSET_REFS : null,
    error: state.error,
    progress: state.progress,
  };
}

function formatTime(seconds) {
  const safe = Math.max(0, Math.floor(Number(seconds) || 0));
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

function InitialAssetLoadingScreen({ progress = 0, label = "초기 작전 자료 준비 중" }) {
  const percent = Math.round(Math.max(0, Math.min(1, Number(progress) || 0)) * 100);
  return (
    <main className="initial-asset-loading" role="status" aria-live="polite">
      <div className="initial-loader-emblem"><Pulse weight="fill" /></div>
      <small>HUMAN OVERRIDE // ASSET WARMUP</small>
      <strong>{label}</strong>
      <div className="initial-loader-track"><i style={{ width: `${percent}%` }} /></div>
      <b>{percent}%</b>
    </main>
  );
}

function triggerTouchFeedback(pattern = 12, enabled = true) {
  if (!enabled) return;
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  if (typeof window !== "undefined" && !window.matchMedia?.("(pointer: coarse)").matches) return;
  navigator.vibrate(pattern);
}

function IntroScreen({ assets, assetError, onStart, musicPlaying, onToggleMusic, onOpenSettings }) {
  return (
    <main className="overload-intro intro-cinematic">
      {assets?.intro && (
        <img
          className="intro-key-art"
          src={assets.intro.src}
          alt="끊어진 고가선 너머 소버린의 하얀 성채를 바라보는 이지스"
          fetchPriority="high"
          decoding="async"
          draggable="false"
        />
      )}
      <section className="intro-minimal-content" aria-labelledby="game-title">
        <small>소버린 점령지 · 기지 캠페인</small>
        <h1 id="game-title"><span>HUMAN</span><em>OVERRIDE</em><b>OVERLOAD</b></h1>
        <p>헤이븐-09에서 대원들과 작전을 준비하고, 세계를 지배한 초지능 AI의 기계 군단과 지역 추론핵을 파괴하세요.</p>
        <button
          className="primary-cta intro-start command-ui-button"
          type="button"
          data-ui-sound="uiConfirm"
          onClick={onStart}
          disabled={!assets && !assetError}
        >
          <span>{assets || assetError ? "게임 시작 · 헤이븐-09" : "작전 자료 불러오는 중"}</span>
          {assets || assetError ? <Play weight="fill" /> : <i className="loading-ring" />}
        </button>
        <small className="intro-start-note">저장 슬롯 선택 후 기지에서 첫 작전을 안내합니다.</small>
        <button
          className={`intro-music-toggle${musicPlaying ? " is-playing" : ""}`}
          type="button"
          data-ui-sound="uiConfirm"
          onClick={onToggleMusic}
          aria-label={musicPlaying ? "타이틀 음악 끄기" : "타이틀 음악 재생"}
        >
          {musicPlaying ? <SpeakerHigh weight="fill" /> : <SpeakerSlash />}
          <span>{musicPlaying ? "타이틀 음악 재생 중" : "타이틀 음악 재생"}</span>
        </button>
        <button
          className="intro-settings-toggle"
          type="button"
          data-ui-sound="uiConfirm"
          onClick={onOpenSettings}
          aria-label="환경 설정 열기"
        >
          <GearSix weight="fill" />
          <span>환경 설정</span>
        </button>
        {assetError && <p className="asset-warning"><Warning /> 일부 이미지 대신 안전 렌더링을 사용합니다.</p>}
        <div className="intro-minimal-controls" aria-label="게임 조작">
          <span><kbd>WASD</kbd> 이동</span>
          <span><kbd>마우스</kbd> 조준</span>
          <span><kbd>스페이스</kbd> 대시</span>
          <span><kbd>Q/E/F/R</kbd> 액티브</span>
          <strong><Pulse weight="fill" /> 기본 공격 상시 자동</strong>
        </div>
        <div className="intro-mobile-controls" aria-label="모바일 게임 조작">
          <span><NavigationArrow weight="fill" /><b>화면을 누른 채 드래그</b><small>이동</small></span>
          <span><Crosshair weight="fill" /><b>가까운 적 자동 추적</b><small>조준·사격</small></span>
          <strong><Lightning weight="fill" /> 하단 스킬 아이콘을 눌러 능력 사용</strong>
        </div>
      </section>
    </main>
  );
}

function CombatAbilityTutorialOverlay({ ability, stepIndex, totalSteps, portrait, onNext, onBack, onSkip }) {
  const modalRef = useRef(null);
  useDialogFocusTrap(modalRef, Boolean(ability));

  useEffect(() => {
    if (!ability) return undefined;
    const handleTutorialKey = (event) => {
      if (event.repeat) return;
      const expected = event.code === `Key${ability.key}`;
      const next = expected || event.code === "Space" || event.code === "Enter" || event.code === "ArrowRight";
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
      <section className={`combat-tutorial-card tutorial-${ability.id}`} ref={modalRef} tabIndex={-1}>
        {portraitSource && <div className="combat-tutorial-npc"><NpcPortraitImage source={portraitSource} npcId="rhea" alt="전술 관제관 레아" /></div>}
        <div className="combat-tutorial-copy">
          <small>레아 · 실전 인터페이스 {stepIndex + 1} / {totalSteps}</small>
          <header><kbd>{ability.key}</kbd><div><h2 id="combat-tutorial-title">{ability.koreanName}</h2><span>{ability.name}</span></div></header>
          <p>{ability.overlayPrompt}</p>
          <b><kbd>SPACE</kbd> 또는 빛나는 실제 {ability.key} 버튼으로 다음 설명을 확인합니다.</b>
        </div>
        <footer>
          <button type="button" onClick={onBack} disabled={stepIndex === 0}><ArrowLeft weight="bold" /> 이전</button>
          <button type="button" className="combat-tutorial-skip" onClick={onSkip}>건너뛰기 <kbd>Esc</kbd></button>
          <button type="button" className="combat-tutorial-next" onClick={onNext}>{stepIndex === totalSteps - 1 ? "실전 시작" : "다음"} <ArrowRight weight="bold" /></button>
        </footer>
      </section>
    </div>
  );
}

const TAG_CUTSCENE_COPY = Object.freeze({
  nox: Object.freeze({ assetKey: "noxPortrait", name: "녹스", callout: "NOX // RED WARRANT" }),
  aegis: Object.freeze({ assetKey: "player", name: "이지스", callout: "AEGIS // LINK SHIFT" }),
  mika: Object.freeze({ assetKey: "mikaPortrait", name: "미카", callout: "MIKA // PRISM LINK" }),
  vesper: Object.freeze({ assetKey: "vesperPortrait", name: "베스퍼", callout: "VESPER // NIGHT LINK" }),
});

function TagCutsceneOverlay({ cutscene }) {
  if (!cutscene?.source) return null;
  return (
    <aside
      className={`combat-tag-cutscene is-${cutscene.characterId}`}
      aria-live="polite"
      aria-label={`${cutscene.name} 전투원 태그 완료`}
    >
      <span className="combat-tag-cutscene-rail" aria-hidden="true" />
      <img src={cutscene.source} alt="" />
      <div>
        <small>{cutscene.callout}</small>
        <strong>{cutscene.name}</strong>
        <b>COMBAT LINK</b>
      </div>
    </aside>
  );
}

function PauseOverlay({ audioSettings, settingsSaved, onAudioSettingsChange, onResume, onRestart, onBase }) {
  const modalRef = useRef(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  useDialogFocusTrap(modalRef, !settingsOpen);
  useEffect(() => {
    modalRef.current?.querySelector(".pause-resume")?.focus({ preventScroll: true });
  }, [pendingAction, settingsOpen]);
  useEffect(() => {
    if (!pendingAction) return undefined;
    const cancel = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!event.repeat) setPendingAction(null);
    };
    window.addEventListener("keydown", cancel, true);
    return () => window.removeEventListener("keydown", cancel, true);
  }, [pendingAction]);
  if (settingsOpen) return <GameSettingsOverlay settings={audioSettings} saved={settingsSaved} onChange={onAudioSettingsChange} onReset={() => onAudioSettingsChange?.({ ...DEFAULT_GAME_SETTINGS })} onClose={() => setSettingsOpen(false)} />;
  return (
    <div className="expedition-pause" role="dialog" aria-modal="true" aria-labelledby="pause-title" data-pause-confirmation={pendingAction || undefined}>
      <section className="expedition-pause-card" ref={modalRef} tabIndex={-1}>
        <small>HAVEN-09 · OPERATION PAUSED</small>
        <h2 id="pause-title">{pendingAction ? pendingAction === "restart" ? "처음부터 다시 시작할까요?" : "기지로 돌아갈까요?" : "일시 정지"}</h2>
        {pendingAction ? (
          <>
            <p>이번 출격의 레벨과 증강은 사라집니다. 이전에 저장한 해방 기록과 기지 강화는 유지됩니다.</p>
            <div className="pause-confirm-actions">
              <button type="button" className="pause-resume" onClick={() => setPendingAction(null)} autoFocus><ArrowLeft weight="bold" /><span>전투 메뉴로</span></button>
              <button type="button" className="pause-confirm-leave" onClick={pendingAction === "restart" ? onRestart : onBase}><ArrowCounterClockwise weight="bold" /><span>{pendingAction === "restart" ? "출격 다시 시작" : "기지로 복귀"}</span></button>
            </div>
          </>
        ) : (
          <>
            <p>전투 시뮬레이션과 입력이 정지되었습니다.</p>
            <div>
              <button type="button" className="pause-resume" onClick={onResume} autoFocus><Play weight="fill" /><span>계속</span><kbd>ESC</kbd></button>
              <button type="button" onClick={() => setSettingsOpen(true)}><GearSix weight="fill" /><span>게임 설정</span></button>
              <button type="button" onClick={() => setPendingAction("restart")}><ArrowCounterClockwise weight="bold" /><span>처음부터</span></button>
              <button type="button" onClick={() => setPendingAction("base")} disabled={!onBase}><MapTrifold weight="fill" /><span>{onBase ? "헤이븐-09 기지로" : "기지 잠김"}</span></button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function RewardArtwork({ option, assets }) {
  const id = String(option?.id || "");
  const source = assets?.[REWARD_ART_KEYS[id]];
  if (source) return <img src={source.src} alt="" />;
  if (["crescentWave", "titanEdge", "flashRend", "bladeStorm", "edgeReach", "edgeGuard"].includes(id)) return <Sword weight="fill" />;
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
        <div className="reward-kicker"><Sparkle weight="fill" /> 전술 시스템 증강 · LEVEL {level}</div>
        <h2 id="reward-title">오버로드 프로토콜</h2>
        <p>전투가 잠시 멈췄습니다. 이번 출격에서 사용할 강화를 고르세요.</p>
        {queuedRewards > 1 && <div className="reward-queue-status"><Timer weight="bold" /> 쌓인 레벨업 {queuedRewards}회를 한 번에 강화합니다.</div>}
        <div className="reward-options">
          {offer.map((option, index) => {
            const meta = CATEGORY_META[option.category] || CATEGORY_META.skill;
            const badgeType = option.mastery ? "master" : option.level ? "upgrade" : "new";
            const badgeLabel = option.mastery ? "최종 진화" : option.level ? `랭크 ${option.level} → ${option.nextLevel || option.level + 1}` : "NEW 신규";
            return (
              <button className={`reward-card is-${meta.color}`} data-badge-type={badgeType} key={`${option.category}-${option.id}-${index}`} type="button" onClick={() => onChoose(option.id)}>
                <span className="reward-index">0{index + 1}</span>
                <span className={`reward-status-ribbon is-${badgeType}`}>{badgeLabel}</span>
                <div className="reward-art"><RewardArtwork option={option} assets={assets} /></div>
                <small className="reward-category-label">{meta.label} · {meta.korean}</small>
                <strong>{REWARD_NAMES_KO[option.id] || option.koreanName || option.name}</strong>
                <p>{REWARD_COPY[option.id] || option.description}</p>
                <div className="reward-card-footer"><span>{option.mastery ? "최종 진화 완료" : option.level ? `랭크 ${option.level} 강화` : "신규 장비 획득"}</span><b>선택 <ArrowRight /></b></div>
              </button>
            );
          })}
        </div>
        <span className="reward-note">클릭 또는 숫자키 1–3으로 선택 · 다음 증강은 전술 교전 간격 후 전개됩니다.</span>
      </section>
    </div>
  );
}

const FLOATING_JOYSTICK_BLOCKED_SELECTOR = [
  "button",
  "a",
  "input",
  "select",
  "textarea",
  "[role='dialog']",
  ".narrative-panel",
  ".reward-backdrop",
  ".expedition-pause",
  ".combat-tutorial-layer",
].join(",");

function FloatingTouchJoystick({ surfaceRef, onMove, disabled = false }) {
  const joystickRef = useRef(null);

  useEffect(() => {
    const surface = surfaceRef.current;
    const joystick = joystickRef.current;
    if (!surface || !joystick) return undefined;
    if (disabled) {
      joystick.classList.remove("is-active");
      joystick.style.setProperty("--joystick-knob-x", "0px");
      joystick.style.setProperty("--joystick-knob-y", "0px");
      onMove(0, 0);
      return undefined;
    }
    const pointer = { id: null, startX: 0, startY: 0 };
    const radius = 58;
    const deadzone = 0.12;

    const setVisual = (clientX, clientY, knobX = 0, knobY = 0, active = false) => {
      const bounds = surface.getBoundingClientRect();
      const visualRadius = 72;
      const x = Math.max(visualRadius, Math.min(bounds.width - visualRadius, clientX - bounds.left));
      const y = Math.max(visualRadius, Math.min(bounds.height - visualRadius, clientY - bounds.top));
      joystick.style.setProperty("--joystick-x", `${x}px`);
      joystick.style.setProperty("--joystick-y", `${y}px`);
      joystick.style.setProperty("--joystick-knob-x", `${knobX}px`);
      joystick.style.setProperty("--joystick-knob-y", `${knobY}px`);
      joystick.classList.toggle("is-active", active);
    };

    const update = (event) => {
      const rawX = event.clientX - pointer.startX;
      const rawY = event.clientY - pointer.startY;
      const distance = Math.hypot(rawX, rawY);
      const clampScale = distance > radius ? radius / distance : 1;
      const knobX = rawX * clampScale;
      const knobY = rawY * clampScale;
      const magnitude = Math.min(1, distance / radius);
      const activeMagnitude = magnitude <= deadzone ? 0 : (magnitude - deadzone) / (1 - deadzone);
      const unitX = distance > 0 ? rawX / distance : 0;
      const unitY = distance > 0 ? rawY / distance : 0;
      setVisual(pointer.startX, pointer.startY, knobX, knobY, true);
      onMove(unitX * activeMagnitude, unitY * activeMagnitude, event);
    };

    const begin = (event) => {
      if (event.pointerType === "mouse" || pointer.id !== null) return;
      if (event.target instanceof Element && event.target.closest(FLOATING_JOYSTICK_BLOCKED_SELECTOR)) return;
      pointer.id = event.pointerId;
      pointer.startX = event.clientX;
      pointer.startY = event.clientY;
      event.preventDefault();
      surface.setPointerCapture?.(event.pointerId);
      setVisual(event.clientX, event.clientY, 0, 0, true);
      onMove(0, 0, event);
    };

    const move = (event) => {
      if (pointer.id !== event.pointerId) return;
      event.preventDefault();
      update(event);
    };

    const end = (event) => {
      if (pointer.id === null || (event?.pointerId !== undefined && pointer.id !== event.pointerId)) return;
      pointer.id = null;
      joystick.classList.remove("is-active");
      joystick.style.setProperty("--joystick-knob-x", "0px");
      joystick.style.setProperty("--joystick-knob-y", "0px");
      onMove(0, 0, event);
    };

    const cancel = () => end();
    surface.addEventListener("pointerdown", begin, { passive: false });
    surface.addEventListener("pointermove", move, { passive: false });
    surface.addEventListener("pointerup", end, { passive: false });
    surface.addEventListener("pointercancel", end, { passive: false });
    surface.addEventListener("lostpointercapture", end, { passive: false });
    window.addEventListener("blur", cancel);
    document.addEventListener("visibilitychange", cancel);
    return () => {
      surface.removeEventListener("pointerdown", begin);
      surface.removeEventListener("pointermove", move);
      surface.removeEventListener("pointerup", end);
      surface.removeEventListener("pointercancel", end);
      surface.removeEventListener("lostpointercapture", end);
      window.removeEventListener("blur", cancel);
      document.removeEventListener("visibilitychange", cancel);
      onMove(0, 0);
    };
  }, [disabled, onMove, surfaceRef]);

  return (
    <div ref={joystickRef} className={`floating-touch-joystick${disabled ? " is-disabled" : ""}`} aria-hidden="true">
      <span className="floating-touch-joystick-ring" />
      <i className="floating-touch-joystick-knob" />
    </div>
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
      ) : portrait.npcId || portrait.variant === "operator" ? (
        <NpcPortraitImage source={portrait.source} npcId={portrait.npcId || "rhea"} alt={portrait.alt} />
      ) : ['hero', 'mika', 'vesper', 'nox'].includes(portrait.variant) ? (
        <OperativePortraitImage source={portrait.source} characterId={portrait.variant === 'hero' ? 'aegis' : portrait.variant} alt={portrait.alt} />
      ) : (
        <img src={portrait.source} alt={portrait.alt} draggable="false" decoding="async" fetchPriority="high" />
      )}
    </div>
  );
}

function NarrativePanel({ dialogue, assets, region, bossStage, characterId = "aegis", onAdvance }) {
  if (!dialogue) return null;
  const lines = SCENARIO_SCRIPT[dialogue.beat] || [];
  const scriptedLine = lines[dialogue.index];
  if (!scriptedLine) return null;
  const line = resolveCharacterDialogueLine(scriptedLine, dialogue.beat, dialogue.index, characterId);
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
        <span>{finalLine ? "계속 전진" : "다음"}<kbd>SPACE</kbd></span><ArrowRight weight="bold" />
      </button>
    </section>
  );
}

const CLEAR_TRANSITION_COPY = Object.freeze({
  warning: Object.freeze(["적 전멸 확인", "보스 구역의 방어망이 무너지고 있습니다."]),
  panic: Object.freeze(["소버린 비상 신호 감지", "지역 추론핵이 퇴로를 막고 있습니다. 곧바로 추격하세요."]),
  swap: Object.freeze(["보스 구역으로 이동", "전장을 전환하고 있습니다. 잠시 후 최종 교전이 시작됩니다."]),
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

function RouteMinimap({ hud, region }) {
  const expedition = hud?.expedition;
  if (!expedition) return null;
  const bossRoom = Boolean(hud?.boss || expedition.bossRoom);
  const routeLength = Math.max(1, Number(expedition.routeLength) || 1);
  const progress = bossRoom ? 0.94 : clampMapRatio(expedition.progress, 0);
  const traces = Array.isArray(expedition.traces) ? expedition.traces : [];
  const minimap = expedition.minimap || hud?.minimap || {};
  const player = minimap.player || { x: progress, y: 0.5 };
  const playerX = clampMapRatio(player?.x, 0.5);
  const playerY = clampMapRatio(player?.y, 0.5);
  const enemies = Array.isArray(minimap.enemies) ? minimap.enemies.slice(0, 32) : [];
  const gates = !bossRoom && Array.isArray(minimap.gates)
    ? minimap.gates.filter((gate) => gate?.active).slice(0, 8)
    : [];
  const hostiles = Math.max(0, Number(minimap.liveEnemyCount ?? hud?.enemiesRemaining) || 0);
  const arenaAsset = bossRoom ? null : getRegionArenaAsset(hud?.regionId || region?.id, "performance");
  const terrain = !bossRoom && getRegionalTerrain(hud?.regionId || region?.id);
  const terrainSites = minimap.structures ?? terrain?.structures ?? [];
  const terrainColor = terrain ? `#${terrain.accent.toString(16).padStart(6, '0')}` : '#83bbc5';

  return (
    <aside className={bossRoom ? "route-minimap is-boss" : "route-minimap is-arena"} aria-label={`전술 미니맵. 작전 진행 ${Math.round(progress * 100)}%, 현재 출현 적 ${hostiles}기`}>
      <header><MapTrifold weight="fill" /><span>전술 지도</span><b>출현 {hostiles}</b></header>
      <div className={bossRoom ? "route-minimap-field is-boss" : "route-minimap-field is-arena"} aria-hidden="true">
        {terrain ? <svg className="route-minimap-terrain" viewBox="0 0 4096 4096">
          <rect x="144" y="144" width="3808" height="3808" fill="#10252e" stroke="#577984" strokeWidth="28" />
          <path d="M2048 144V3952M144 2048H3952" fill="none" stroke={terrainColor} opacity=".28" strokeWidth="18" />
          <circle cx="2048" cy="2048" r="248" fill="#1d3640" stroke="#8a713c" strokeWidth="26" />
          {terrainSites.map(site => <circle key={site.id} cx={site.x} cy={site.y} r={site.radius} fill={site.breakable || site.maxHp > 0 ? "#b58945" : terrainColor} stroke="#e0e5cf" strokeWidth="14" />)}
        </svg> : arenaAsset?.path && <img className="route-minimap-backdrop" src={arenaAsset.path} alt="" draggable="false" />}
        {!bossRoom && <i className="route-minimap-scan" />}
        {traces.map((trace) => (
          <span
            className={trace.triggered ? "route-minimap-node is-cleared" : "route-minimap-node"}
            style={{
              left: `${clampMapRatio(trace?.x, Number(trace.distance) / routeLength) * 100}%`,
              top: `${clampMapRatio(trace?.y, 0.5) * 100}%`,
            }}
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
        {gates.map((gate, index) => (
          <i
            className="route-minimap-transit-gate"
            style={{
              left: `${clampMapRatio(gate?.x) * 100}%`,
              top: `${clampMapRatio(gate?.y) * 100}%`,
              "--gate-progress": clampMapRatio(gate?.progress, 1),
            }}
            key={gate?.id ?? `${gate?.gateId || "gate"}-${index}`}
          />
        ))}
        <span
          className="route-minimap-player"
          style={{ left: `${playerX * 100}%`, top: `${playerY * 100}%` }}
        ><NavigationArrow weight="fill" /></span>
      </div>
    </aside>
  );
}

function PhaserArenaScreen({ assets, regionId, region, combatBonuses, characterSkillRanks, mainWeaponId, characterId, partyCharacterIds, mikaUnlocked = false, vesperUnlocked = false, noxUnlocked = false, soundEnabled, audioSettings, settingsSaved, sfx, onToggleSound, onAudioSettingsChange, onFinish, onBase, showCombatTutorial = false, skipOpeningNarrative = false, onCombatTutorialComplete, preparing = false, onRuntimeProgress, onRuntimeReady }) {
  const hostRef = useRef(null);
  const frameRef = useRef(null);
  const controllerRef = useRef(null);
  const finishReportedRef = useRef(false);
  const pausedRef = useRef(false);
  const [hud, setHud] = useState(null);
  const [banner, setBanner] = useState(null);
  const [dialogue, setDialogue] = useState(null);
  const [paused, setPaused] = useState(false);
  const [combatTutorialStep, setCombatTutorialStep] = useState(-1);
  const [tagCutscene, setTagCutscene] = useState(null);
  const [openingNarrativeComplete, setOpeningNarrativeComplete] = useState(!showCombatTutorial);
  const [runRevision, setRunRevision] = useState(0);
  const [hudDensityPreference, setHudDensityPreference] = useState("auto");
  const airstrikeBannerShownRef = useRef(false);
  const autoBossEntryHandledRef = useRef(false);
  const combatTutorialActiveRef = useRef(false);
  const combatTutorialHandledRef = useRef(false);
  const openingNarrativeBeatRef = useRef(null);
  const openingScenarioHandledRef = useRef(false);
  const agentVoiceRef = useRef(null);
  const tagCutsceneTimeoutRef = useRef(0);
  const preparingRef = useRef(preparing);
  const onFinishRef = useRef(onFinish);
  const onRuntimeProgressRef = useRef(onRuntimeProgress);
  const onRuntimeReadyRef = useRef(onRuntimeReady);
  const showCombatTutorialRef = useRef(showCombatTutorial);
  const skipOpeningNarrativeRef = useRef(skipOpeningNarrative);
  const combatBonusesSignature = JSON.stringify(combatBonuses || {});
  const runtimeCombatBonusesRef = useRef({ signature: combatBonusesSignature, value: combatBonuses });
  if (runtimeCombatBonusesRef.current.signature !== combatBonusesSignature) {
    runtimeCombatBonusesRef.current = { signature: combatBonusesSignature, value: combatBonuses };
  }
  const characterSkillRanksSignature = JSON.stringify(characterSkillRanks || {});
  const runtimeCharacterSkillRanksRef = useRef({ signature: characterSkillRanksSignature, value: characterSkillRanks });
  if (runtimeCharacterSkillRanksRef.current.signature !== characterSkillRanksSignature) {
    runtimeCharacterSkillRanksRef.current = { signature: characterSkillRanksSignature, value: characterSkillRanks };
  }
  onFinishRef.current = onFinish;
  onRuntimeProgressRef.current = onRuntimeProgress;
  onRuntimeReadyRef.current = onRuntimeReady;
  showCombatTutorialRef.current = showCombatTutorial;
  skipOpeningNarrativeRef.current = skipOpeningNarrative;

  useEffect(() => {
    const voice = createAgentVoice();
    agentVoiceRef.current = voice;
    return () => {
      if (agentVoiceRef.current === voice) agentVoiceRef.current = null;
      voice.dispose();
    };
  }, []);

  useEffect(() => {
    const voice = agentVoiceRef.current;
    voice?.setEnabled(soundEnabled);
    voice?.setVolume(audioSettings?.voiceVolume ?? DEFAULT_GAME_SETTINGS.voiceVolume);
    if (soundEnabled) voice?.preload();
  }, [audioSettings?.voiceVolume, soundEnabled]);

  useEffect(() => {
    preparingRef.current = preparing;
    if (!preparing) primeCombatAim(hostRef.current);
    controllerRef.current?.setSuspended(preparing || pausedRef.current || combatTutorialActiveRef.current);
    if (!preparing && !pausedRef.current && !combatTutorialActiveRef.current) {
      controllerRef.current?.focus();
    }
  }, [preparing]);

  useEffect(() => {
    openingNarrativeBeatRef.current = null;
    openingScenarioHandledRef.current = false;
    setOpeningNarrativeComplete(!showCombatTutorial);
    setHudDensityPreference("auto");
    window.clearTimeout(tagCutsceneTimeoutRef.current);
    setTagCutscene(null);
  }, [regionId, runRevision, showCombatTutorial]);

  useEffect(() => () => window.clearTimeout(tagCutsceneTimeoutRef.current), []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    airstrikeBannerShownRef.current = false;
    autoBossEntryHandledRef.current = false;
    let stopped = false;
    let bannerTimeout = 0;
    let runtimeReadyReported = false;
    let cancelDeferredCombatPreload = () => {};
    const availableCombatPortraitKeys = new Set(["player", "rheaControlOfficer", characterPortraitAssetKey(characterId)]);
    if (mikaUnlocked) availableCombatPortraitKeys.add("mikaPortrait");
    if (vesperUnlocked) availableCombatPortraitKeys.add("vesperPortrait");
    if (noxUnlocked) availableCombatPortraitKeys.add("noxPortrait");
    const combatDomReady = preloadDomImages(domAssetSources([...availableCombatPortraitKeys]));

    const reportRuntimeReady = () => {
      if (runtimeReadyReported) return;
      runtimeReadyReported = true;
      void combatDomReady.then(() => {
        if (stopped) return;
        onRuntimeReadyRef.current?.();
        cancelDeferredCombatPreload = scheduleDomImagePreload(domAssetSources(COMBAT_REWARD_DOM_ASSET_KEYS));
      });
    };

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
          ? "최종 화력이 해방되어 광역 공격이 전장을 연달아 휩씁니다."
          : "누적된 전투 데이터로 공격 속도와 피해량이 증가합니다."];
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
          if (event.type === "playerHit") triggerTouchFeedback(event.critical ? [26, 18, 34] : 18, audioSettings?.hapticsEnabled !== false);
          if (event.type === "manualAbilityActivated" && (event.ability === "stratosRun" || event.ability === "helixTempest")) {
            agentVoiceRef.current?.play(event.ability);
          }
          if (event.type === "characterTagged") {
            const characterId = String(event.characterId || "aegis");
            const copy = TAG_CUTSCENE_COPY[characterId] || TAG_CUTSCENE_COPY.aegis;
            const source = assets?.[copy.assetKey]?.src || assets?.[copy.assetKey] || "";
            window.clearTimeout(tagCutsceneTimeoutRef.current);
            setTagCutscene({
              ...copy,
              characterId,
              source,
              key: `${characterId}-${event.time}`,
            });
            tagCutsceneTimeoutRef.current = window.setTimeout(() => setTagCutscene(null), 1180);
          }
          const sound = resolveEventSound(event);
          if (sound) sfx.play(sound);
          if (event.type === "scenario" && SCENARIO_SCRIPT[event.beat]) {
            const openingScenario = !openingScenarioHandledRef.current;
            openingScenarioHandledRef.current = true;
            if (skipOpeningNarrativeRef.current && openingScenario) {
              window.queueMicrotask(() => {
                if (!stopped) controller?.continueStory();
              });
            } else {
              if (showCombatTutorialRef.current && !openingNarrativeBeatRef.current) openingNarrativeBeatRef.current = event.beat;
              setDialogue({ beat: event.beat, index: 0, key: `${event.beat}-${event.time}` });
            }
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
          onFinishRef.current(result);
        },
        onLoadProgress: (progress) => {
          if (!stopped) onRuntimeProgressRef.current?.(progress);
        },
        onReady: () => {
          primeCombatAim(host);
          controllerRef.current?.setSuspended(preparingRef.current || pausedRef.current || combatTutorialActiveRef.current);
          if (!preparingRef.current && !pausedRef.current && !combatTutorialActiveRef.current) controllerRef.current?.focus();
          reportRuntimeReady();
        },
      }, {
        regionId,
        combatBonuses: runtimeCombatBonusesRef.current.value,
        characterSkillRanks: runtimeCharacterSkillRanksRef.current.value,
        mainWeaponId,
        characterId,
        partyCharacterIds,
        mikaUnlocked,
        vesperUnlocked,
        noxUnlocked,
        startSuspended: preparingRef.current,
        qualityPreference: audioSettings?.graphicsQuality,
        screenShakeEnabled: audioSettings?.screenShakeEnabled !== false,
      });
      controllerRef.current = controller;
      controller.setSuspended(preparingRef.current || pausedRef.current || combatTutorialActiveRef.current);
    }).catch(() => {
      if (stopped) return;
      setBanner({ key: "phaser-runtime-error", type: "playerHit", title: "게임 화면 초기화 실패", subtitle: "브라우저의 WebGL 또는 Canvas 지원을 확인해 주세요." });
      reportRuntimeReady();
    });

    return () => {
      stopped = true;
      window.clearTimeout(bannerTimeout);
      cancelDeferredCombatPreload();
      controllerRef.current = null;
      controller?.destroy();
    };
  }, [assets, characterId, characterSkillRanksSignature, combatBonusesSignature, mainWeaponId, partyCharacterIds, mikaUnlocked, noxUnlocked, regionId, runRevision, sfx, vesperUnlocked]);

  const selectReward = useCallback((id) => {
    controllerRef.current?.chooseReward(id);
  }, []);

  const setTouchMovement = useCallback((x, y, event) => {
    event?.preventDefault();
    controllerRef.current?.setMovement?.(x, y);
  }, []);

  const activateDash = useCallback(() => {
    triggerTouchFeedback(12, audioSettings?.hapticsEnabled !== false);
    controllerRef.current?.dash();
  }, [audioSettings?.hapticsEnabled]);

  const activateAbility = useCallback((slot) => {
    triggerTouchFeedback(14, audioSettings?.hapticsEnabled !== false);
    controllerRef.current?.activateAbility?.(slot);
  }, [audioSettings?.hapticsEnabled]);

  const activateTag = useCallback(() => {
    triggerTouchFeedback([10, 20, 10], audioSettings?.hapticsEnabled !== false);
    controllerRef.current?.tag?.();
  }, [audioSettings?.hapticsEnabled]);

  const advanceDialogue = useCallback(() => {
    if (!dialogue) return;
    const lines = SCENARIO_SCRIPT[dialogue.beat] || [];
    if (dialogue.index < lines.length - 1) {
      setDialogue({ ...dialogue, index: dialogue.index + 1 });
      return;
    }
    if (dialogue.beat === openingNarrativeBeatRef.current) setOpeningNarrativeComplete(true);
    setDialogue(null);
    controllerRef.current?.continueStory();
  }, [dialogue]);

  useEffect(() => {
    if (!dialogue || preparing) return undefined;
    const handleDialogueKey = (event) => {
      if (event.repeat) return;
      if (event.code !== "Enter" && event.code !== "Space") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      advanceDialogue();
    };
    window.addEventListener("keydown", handleDialogueKey, true);
    return () => window.removeEventListener("keydown", handleDialogueKey, true);
  }, [advanceDialogue, dialogue, preparing]);

  const rewardOpen = Boolean(hud?.rewards?.options?.length);
  const combatTutorialAbilities = useMemo(() => MANUAL_ABILITY_GUIDE.filter((ability) => {
    const state = hud?.abilities?.[ability.id];
    return Boolean(state) && !state.locked && Number(state.rank || 0) > 0;
  }), [hud?.abilities]);

  const pauseCombat = useCallback(() => {
    if (preparing || pausedRef.current || combatTutorialActiveRef.current || dialogue || rewardOpen) return;
    triggerTouchFeedback(10, audioSettings?.hapticsEnabled !== false);
    pausedRef.current = true;
    setPaused(true);
    controllerRef.current?.setSuspended(true);
  }, [audioSettings?.hapticsEnabled, dialogue, preparing, rewardOpen]);

  useEffect(() => {
    const onHidden = () => { if (document.hidden) pauseCombat(); };
    window.addEventListener("blur", pauseCombat);
    document.addEventListener("visibilitychange", onHidden);
    return () => {
      window.removeEventListener("blur", pauseCombat);
      document.removeEventListener("visibilitychange", onHidden);
    };
  }, [pauseCombat]);

  useEffect(() => {
    if (!showCombatTutorial || !openingNarrativeComplete || combatTutorialHandledRef.current || combatTutorialStep >= 0) return;
    if (!hud || dialogue || rewardOpen || combatTutorialAbilities.length === 0) return;
    combatTutorialActiveRef.current = true;
    setCombatTutorialStep(0);
    controllerRef.current?.setSuspended(true);
  }, [combatTutorialAbilities.length, combatTutorialStep, dialogue, hud, openingNarrativeComplete, rewardOpen, showCombatTutorial]);

  const finishCombatTutorial = useCallback(() => {
    if (combatTutorialHandledRef.current) return;
    combatTutorialHandledRef.current = true;
    combatTutorialActiveRef.current = false;
    setCombatTutorialStep(-1);
    onCombatTutorialComplete?.();
    if (!pausedRef.current && !dialogue && !rewardOpen) {
      controllerRef.current?.setSuspended(false);
      controllerRef.current?.focus();
    }
  }, [dialogue, onCombatTutorialComplete, rewardOpen]);

  const advanceCombatTutorial = useCallback(() => {
    if (combatTutorialStep >= combatTutorialAbilities.length - 1) {
      finishCombatTutorial();
      return;
    }
    setCombatTutorialStep((step) => Math.min(combatTutorialAbilities.length - 1, step + 1));
  }, [combatTutorialAbilities.length, combatTutorialStep, finishCombatTutorial]);

  const rewindCombatTutorial = useCallback(() => {
    setCombatTutorialStep((step) => Math.max(0, step - 1));
  }, []);

  const resumeCombat = useCallback(() => {
    if (combatTutorialActiveRef.current) return;
    triggerTouchFeedback(8, audioSettings?.hapticsEnabled !== false);
    pausedRef.current = false;
    setPaused(false);
    controllerRef.current?.setSuspended(false);
    controllerRef.current?.focus();
  }, [audioSettings?.hapticsEnabled]);

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
    if (preparing) return undefined;
    const handleEscape = (event) => {
      // The foreground menu owns navigation; never resume combat beneath it.
      if (paused && document.querySelector(".game-settings-layer")) return;
      if (paused && event.key === "Escape" && document.querySelector("[data-pause-confirmation]")) return;
      if (paused && event.key !== "Escape") {
        if (PAUSED_GAMEPLAY_KEYS.has(event.code)) {
          if (!(event.code === "Space" && event.target?.closest?.("button"))) event.preventDefault();
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
      if (combatTutorialActiveRef.current || dialogue || rewardOpen) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      pausedRef.current = true;
      setPaused(true);
      controllerRef.current?.setSuspended(true);
    };
    window.addEventListener("keydown", handleEscape, true);
    return () => window.removeEventListener("keydown", handleEscape, true);
  }, [dialogue, paused, preparing, resumeCombat, rewardOpen]);

  const xpRatio = Math.max(0, Math.min(1, Number(hud?.xp || 0) / Math.max(1, Number(hud?.nextXp || 1))));
  const routeRatio = hud?.boss
    ? Math.max(0, Math.min(1, Number(hud.boss.hp || 0) / Math.max(1, Number(hud.boss.maxHp || 1))))
    : Math.max(0, Math.min(1, Number(hud?.expedition?.progress || 0)));
  const playerStunTime = Math.max(0, Number(hud?.player?.stunTimer ?? hud?.player?.stun ?? hud?.player?.stunnedFor ?? 0) || 0);
  const playerStunned = Boolean(hud?.player?.stunned) || playerStunTime > 0;
  const parry = hud?.boss?.parry;
  const parryActive = Boolean(parry?.life > 0);
  const parryProgress = parryActive
    ? Math.max(0, Math.min(1, Number(parry.life || 0) / Math.max(0.001, Number(parry.duration || 1))))
    : 0;
  const bossSiren = Boolean(hud?.boss?.siren?.active);
  const bombSequence = hud?.boss?.bombSequence;
  const bombPhase = String(bombSequence?.phase || "");
  const bombSlowMotion = bombPhase === "siren" || bombPhase === "armed";
  const bombTargeting = bombPhase === "armed";
  const bombRetaliation = bombPhase === "retaliation";
  const mobileBossPatternActive = parryActive || bombSlowMotion || bombRetaliation;
  const bombArmorActive = Boolean(hud?.boss?.bombArmor?.active);
  const hudAutoFocusEligible = Number(hud?.time || 0) >= 6 || Number(hud?.kills || 0) > 0;
  const hudFocusMode = Boolean(
    !hud?.boss
    && !dialogue
    && !rewardOpen
    && combatTutorialStep < 0
    && (hudDensityPreference === "compact" || (hudDensityPreference === "auto" && hudAutoFocusEligible)),
  );
  const toggleHudFocus = () => {
    triggerTouchFeedback(8, audioSettings?.hapticsEnabled !== false);
    setHudDensityPreference(hudFocusMode ? "expanded" : "compact");
  };
  const openingProtection = hud?.openingProtection;
  const combatAccessibilityNotice = playerStunned
    ? `기체 행동 불가 ${Math.ceil(playerStunTime)}초`
    : hud?.surge?.warning
      ? `${hud.surge.warning.label} ${Math.ceil(Number(hud.surge.warning.startsIn || 0))}초 후 시작`
      : openingProtection?.active
        ? openingProtection.graceRemaining > 0
          ? `전투 진입 보호 ${Math.ceil(openingProtection.graceRemaining)}초`
          : `전투 진입 피해 완화 ${Math.ceil(openingProtection.remaining)}초`
        : "";

  const playerHp = Math.max(0, Number(hud?.player?.hp) || 0);
  const playerMaxHp = Math.max(1, Number(hud?.player?.maxHp) || 1);
  const isCriticalHealth = playerHp > 0 && (playerHp / playerMaxHp) <= 0.3;
  const combatTutorialAbility = combatTutorialStep >= 0
    ? combatTutorialAbilities[combatTutorialStep] || null
    : null;

  return (
    <main
      className={`expedition-game is-phaser-runtime${parryActive ? " is-parry-window" : ""}${bossSiren ? " is-boss-siren" : ""}${bombSlowMotion ? " is-bomb-slow-motion" : ""}${bombTargeting ? " is-bomb-targeting" : ""}${bombRetaliation ? " is-bomb-retaliation" : ""}${mobileBossPatternActive ? " is-mobile-boss-pattern" : ""}${hudFocusMode ? " is-hud-focus" : ""}${isCriticalHealth ? " is-low-health" : ""}`}
      aria-hidden={preparing ? "true" : undefined}
      inert={preparing}
    >
      <section className="expedition-stage">
          <div className="expedition-canvas-frame" ref={frameRef}>
            {isCriticalHealth && <div className="critical-health-vignette" aria-hidden="true" />}
            <div
              ref={hostRef}
              className="game-canvas phaser-host"
              role="application"
              tabIndex="0"
              aria-label="HUMAN OVERRIDE Phaser 전진형 생존 전장. 모바일에서는 가까운 적을 자동 조준합니다."
              onPointerDown={() => controllerRef.current?.focus()}
            />
            {tagCutscene && <TagCutsceneOverlay key={tagCutscene.key} cutscene={tagCutscene} />}
            <div className="expedition-hud" aria-label="필수 전투 정보">
              <div className={hud?.boss ? "route-objective is-boss" : "route-objective"}>
                <span>{hud?.boss ? `${hud.boss.stage || 1}단계` : `${hud?.expedition?.bossRoom ? 4 : Math.min(3, (hud?.expedition?.checkpoint || 0) + 1)} / 4 구간`}</span>
                <strong>{hud?.boss ? localizeBossName(hud.boss.name) : localizeObjective(hud?.expedition?.objective, hud)}</strong>
                <div><i style={{ width: `${routeRatio * 100}%` }} /></div>
                {openingProtection?.active && (
                  <em className="combat-entry-shield" aria-hidden="true">
                    <ShieldChevron weight="fill" />
                    {openingProtection.graceRemaining > 0
                      ? `진입 보호 ${Math.ceil(openingProtection.graceRemaining)}초`
                      : `피해 완화 ${Math.ceil(openingProtection.remaining)}초`}
                  </em>
                )}
                <b>{hud?.boss ? `체력 ${Math.ceil(hud.boss.hp || 0)}` : `남은 적 ${hud?.enemiesRemaining ?? 0}기`}</b>
              </div>
              <div className="expedition-hud-actions" aria-label="전투 편의 기능">
                <button
                  type="button"
                  className="expedition-sound"
                  onClick={onToggleSound}
                  aria-label={soundEnabled ? "전체 사운드 끄기" : "전체 사운드 켜기"}
                  data-tooltip={soundEnabled ? "사운드 끄기" : "사운드 켜기"}
                >
                  {soundEnabled ? <SpeakerHigh weight="fill" /> : <SpeakerSlash />}
                </button>
                <button
                  type="button"
                  className="expedition-focus-toggle"
                  onClick={toggleHudFocus}
                  aria-expanded={!hudFocusMode}
                  aria-label={hudFocusMode ? "전술 정보 펼치기" : "전투 HUD 간소화"}
                  data-tooltip={hudFocusMode ? "전술 정보 펼치기" : "전투 HUD 간소화"}
                >
                  <MapTrifold weight={hudFocusMode ? "fill" : "regular"} />
                </button>
                <button
                  type="button"
                  className="expedition-pause-toggle"
                  onClick={pauseCombat}
                  disabled={Boolean(dialogue || rewardOpen || combatTutorialStep >= 0)}
                  aria-label="전투 일시정지"
                  aria-keyshortcuts="Escape"
                  data-tooltip="일시정지 · ESC"
                >
                  <Pause weight="fill" />
                </button>
              </div>
            </div>
            <p className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">{combatAccessibilityNotice}</p>
            {!dialogue && !rewardOpen ? (
              <ExpeditionCombatDock
                hud={hud}
                compact={hudFocusMode}
                onDash={activateDash}
                onTag={activateTag}
                onActivateAbility={activateAbility}
                tutorialAbilityId={combatTutorialAbility?.id || null}
                onTutorialTarget={advanceCombatTutorial}
              />
            ) : null}
            {combatTutorialStep >= 0 && (
              <CombatAbilityTutorialOverlay
                ability={combatTutorialAbility}
                stepIndex={combatTutorialStep}
                totalSteps={combatTutorialAbilities.length}
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
            {parryActive && (
              <button
                className="boss-parry-prompt"
                type="button"
                onPointerDown={(event) => {
                  if (event.pointerType === "mouse") return;
                  event.preventDefault();
                  event.stopPropagation();
                  triggerTouchFeedback(18, audioSettings?.hapticsEnabled !== false);
                  controllerRef.current?.parry?.();
                }}
                onClick={(event) => {
                  if (event.detail !== 0 && event.nativeEvent?.pointerType !== "mouse") return;
                  controllerRef.current?.parry?.();
                }}
                style={{ "--parry-progress": `${Math.round(parryProgress * 360)}deg` }}
                aria-label="지금 보스 공격 패링"
              >
                <span><kbd>SHIFT</kbd><strong>지금 패링</strong></span>
                <small>공격이 닿기 전에 반사</small>
              </button>
            )}
            {bombSequence && (
              <div className={`boss-bomb-directive is-${bombSequence.phase}`} role="status" aria-live="assertive">
                <Warning weight="fill" />
                <span>
                  <small>{bombRetaliation ? "실패 · 슬로우 모션 해제" : bombSequence.phase === "siren" ? "전역 폭발 경보 · 슬로우 모션" : "숫자 순서대로 폭탄 클릭"}</small>
                  <strong>{bombRetaliation ? `남은 폭탄 ${bombSequence.retaliationCount}개 추적 중` : bombSequence.phase === "siren" ? `${bombSequence.count}개 설치 중` : `다음 번호 ${bombSequence.expectedOrder}`}</strong>
                </span>
                <b>{Math.max(0, Number(bombSequence.timer || 0)).toFixed(1)}초</b>
              </div>
            )}
            {bombArmorActive && (
              <div className="boss-bomb-armor" role="status" aria-live="polite">
                <ShieldChevron weight="fill" />
                <span><small>해제 실패 · 방어 회로 활성</small><strong>보스가 받는 피해 {Math.round((hud.boss.bombArmor.damageMultiplier || 0.16) * 100)}%</strong></span>
                <b>{Math.max(0, Number(hud.boss.bombArmor.timer || 0)).toFixed(1)}초</b>
              </div>
            )}
            {(parryActive || bombSlowMotion || bombRetaliation) && <div className="boss-crisis-screen" aria-hidden="true"><i /><i /></div>}
            {playerStunned && <div className="stun-screen-effect" aria-hidden="true"><i /><i /><i /><i /></div>}
            {!dialogue && <RouteMinimap hud={hud} region={region} />}
            {!dialogue && <RouteClearTransition transition={hud?.expedition?.clearTransition} />}
            <div className="expedition-xp"><i style={{ width: `${xpRatio * 100}%` }} /></div>
            <div className="transient-controls">
              <span>이동: WASD</span>
              <span>{mainWeaponId === "beam-sword" ? "포인터 방향 · 빔 소드 자동 베기" : "포인터로 조준 · 소총 자동 발사"}</span>
            </div>
            <div className="touch-controls expedition-touch-controls" aria-label="화면 어디서나 드래그하여 이동">
              <FloatingTouchJoystick surfaceRef={frameRef} onMove={setTouchMovement} disabled={mobileBossPatternActive} />
              <span className="portrait-touch-hint">빈 곳을 누른 채 드래그해 이동 · 가까운 적 자동 조준</span>
            </div>
            <NarrativePanel dialogue={dialogue} assets={assets} region={region} bossStage={hud?.boss?.stage} characterId={hud?.player?.characterId || characterId} onAdvance={advanceDialogue} />
            {paused && <PauseOverlay audioSettings={audioSettings} settingsSaved={settingsSaved} onAudioSettingsChange={onAudioSettingsChange} onResume={resumeCombat} onRestart={restartCombat} onBase={onBase ? returnToBase : null} />}
          </div>
      </section>

      <LevelUpOverlay offer={hud?.rewards?.options} level={hud?.level || 1} assets={assets} rewardState={hud?.rewards} onChoose={selectReward} />
    </main>
  );
}

function ResultScreen({ result, assets, region, onRestart, onBase, onContinue }) {
  const victory = result?.status === "victory" || result?.phase === "victory";
  const stats = result?.stats || {};
  const directAttempts = Math.max(0, Number(stats.shots || 0));
  const directHits = Math.max(0, Number(stats.hits || 0));
  const suppliedDirectAccuracy = Number(stats.directAccuracy ?? stats.projectileAccuracy);
  const accuracy = directAttempts > 0
    ? Number.isFinite(suppliedDirectAccuracy)
      ? Math.round(suppliedDirectAccuracy <= 1 ? suppliedDirectAccuracy * 100 : suppliedDirectAccuracy)
      : Math.round(directHits / directAttempts * 100)
    : null;
  const bossName = region?.bossName || region?.boss?.name || "SOVEREIGN CORE";
  const bossDisplayName = localizeBossName(bossName);
  const campaignRewards = result?.campaignRewards;
  const previousBestTime = Number(result?.previousBestTime) || 0;
  const runTime = Number(result?.time) || 0;
  const pbImprovement = previousBestTime > 0 && runTime > 0 && runTime < previousBestTime
    ? previousBestTime - runTime
    : 0;
  const rankTotal = (category) => Object.values(result?.build?.[category] || {}).reduce(
    (total, rank) => total + Math.max(0, Number(rank) || 0),
    0,
  );
  return (
    <main className={victory ? "overload-result is-victory" : "overload-result is-defeat"}>
      <div className="ambient-grid" aria-hidden="true" />
      {assets?.map && <img className="result-map" src={assets.map.src} alt="" />}
      <section className="result-card">
        <div className="result-emblem">{victory ? <Trophy weight="fill" /> : <Warning weight="fill" />}</div>
        <div className="result-kicker">{victory ? `${bossDisplayName} 파괴 완료` : "이지스 신호 소실"}</div>
        <h1>{victory ? "작전 성공" : "작전 실패"}</h1>
        <p>{victory ? `${mixedRegionName(region)}의 군단과 지역 추론핵을 파괴했습니다. 작전 기록을 기지에 저장합니다.` : "소버린이 이번 전투 방식을 학습했습니다. 다음 출격에서는 이동 경로와 성장 방향을 바꿔 보세요."}</p>
        {(assets?.bossPhase3 || assets?.boss) && <img className="result-boss" src={(assets.bossPhase3 || assets.boss).src} alt={`${bossDisplayName} 최종 광폭화 형상`} />}
        <div className="result-stats">
          <span><small>처치한 적</small><b>{result?.kills || result?.stats?.kills || 0}</b></span>
          <span><small>최종 레벨</small><b>LV.{result?.level || 1}</b></span>
          <span><small>직접 공격 명중률</small><b>{accuracy === null ? "공격 없음" : `${accuracy}%`}</b></span>
          <span><small>작전 시간</small><b>{formatTime(result?.time || 0)}</b></span>
        </div>
        {victory && (
          <div className="result-evidence" aria-label="작전 분석 결과">
            <span><small>개인 기록</small><b>{!previousBestTime ? "첫 기록" : pbImprovement > 0 ? `${formatTime(pbImprovement)} 단축` : `PB ${formatTime(result?.bestTime || previousBestTime)}`}</b></span>
            <span><small>완성 빌드</small><b>무기 {rankTotal("weapons")} · 스킬 {rankTotal("skills")} · 동료 {rankTotal("allies")}</b></span>
            <span><small>보스 대응</small><b>패링 {stats.bossParries || 0} · 폭탄 {stats.bossBombsDefused || 0}</b><em>실패 {Number(stats.bossParryFailures || 0) + Number(stats.bossBombFailures || 0)}회</em></span>
          </div>
        )}
        <p className="result-kill-breakdown" aria-label="처치 기여 분석">
          <span>직접 {stats.directKills || 0}</span>
          <span>스킬 {stats.abilityKills || 0}</span>
          <span>지원 {stats.supportKills || 0}</span>
          <span>자폭·환경 {stats.environmentKills || 0}</span>
        </p>
        {victory && campaignRewards && (
          <div className="result-rewards" aria-label="이번 작전 획득 자원">
            <small>{campaignRewards.firstClear ? "첫 승리 보상" : "반복 공략 보상"}</small>
            <span>연구 자료 +{campaignRewards.researchData || 0}</span>
            <span>장비 부품 +{campaignRewards.equipmentParts || 0}</span>
            <span>동기화 코어 +{campaignRewards.augmentationCores || 0}</span>
          </div>
        )}
        <div className="result-actions">
          {victory ? (
            <button className="primary-cta result-continue" type="button" onClick={onContinue || onBase}><span>작전 기록 저장 · 계속</span><ArrowRight weight="bold" /></button>
          ) : (
            <>
              <button className="primary-cta" type="button" onClick={onRestart}><span>같은 구역 재도전</span><ArrowCounterClockwise weight="bold" /></button>
              {onBase && <button className="result-base-return" type="button" onClick={onBase}><span>헤이븐-09로 귀환</span><HouseLine weight="bold" /></button>}
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export function App() {
  const { assets, error: assetError, progress: assetProgress } = useGameAssets();
  const [screen, setScreen] = useState("intro");
  const [storyEpisodeId, setStoryEpisodeId] = useState("prologue");
  const [storyReplay, setStoryReplay] = useState(false);
  const [audioSettings, setAudioSettings] = useState(loadGameSettings);
  const [settingsSaved, setSettingsSaved] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(() => audioSettings.masterSoundEnabled !== false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [result, setResult] = useState(null);
  const [campaign, setCampaign] = useState(() => loadCampaign());
  const [activeSlotId, setActiveSlotId] = useState(null);
  const [activeRegionId, setActiveRegionId] = useState(DEFAULT_REGION_ID);
  const [sortieCharacterIds, setSortieCharacterIds] = useState(null);
  const [activeDefenseStageId, setActiveDefenseStageId] = useState("haven-perimeter");
  const [activeDefenseDoctrineId, setActiveDefenseDoctrineId] = useState("rapidDeployment");
  const [defenseResult, setDefenseResult] = useState(null);
  const [activeNpc, setActiveNpc] = useState(null);
  const [npcLineIndex, setNpcLineIndex] = useState(0);
  const [activeFacilityId, setActiveFacilityId] = useState(null);
  const [guideReturnScreen, setGuideReturnScreen] = useState("sortie");
  const [swordGuideReturnScreen, setSwordGuideReturnScreen] = useState("return");
  const [bgmPlaying, setBgmPlaying] = useState(false);
  const [transitionLabel, setTransitionLabel] = useState("다음 화면 준비 중");
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [sortieVideoComplete, setSortieVideoComplete] = useState(false);
  const [repeatSortie, setRepeatSortie] = useState(false);
  const [combatRuntimeReady, setCombatRuntimeReady] = useState(false);
  const [combatLoadProgress, setCombatLoadProgress] = useState(0);
  const bgmRef = useRef(null);
  const musicPlayerRef = useRef(null);
  const transitionTokenRef = useRef(0);
  const sfx = useMemo(() => createSfxEngine(), []);

  useEffect(() => startCampaignCloudSync({
    onCampaign: (nextCampaign) => setCampaign(nextCampaign),
  }), []);

  const regions = useMemo(() => getCampaignRegions(), []);
  const defenseStages = useMemo(() => getDefenseStages(), []);
  const regionClusters = useMemo(() => getRegionClusters(), []);
  const mainWeapons = useMemo(() => getMainWeapons(), []);
  const flightPlans = useMemo(() => getFlightPlans(), []);
  const playableCharacterDefinitions = useMemo(() => getPlayableCharacters(), []);
  const regionPreviewSources = useMemo(
    () => regions.map((region) => region?.assets?.dom?.thumbnail?.path).filter(Boolean),
    [regions],
  );
  const npcs = useMemo(() => Object.values(BASE_NPCS), []);
  const activeSlot = useMemo(
    () => (activeSlotId ? getCampaignSlot(campaign, activeSlotId) : null),
    [activeSlotId, campaign],
  );
  const playableCharacters = useMemo(
    () => playableCharacterDefinitions.map((character) => ({
      ...character,
      unlocked: isCharacterUnlocked(character.id, activeSlot?.completedRegionIds || []),
    })),
    [activeSlot?.completedRegionIds, playableCharacterDefinitions],
  );
  const unlockedPlayableCharacters = useMemo(
    () => playableCharacters.filter((character) => character.unlocked),
    [playableCharacters],
  );
  const mikaUnlocked = isCharacterUnlocked("mika", activeSlot?.completedRegionIds || []);
  const vesperUnlocked = isCharacterUnlocked("vesper", activeSlot?.completedRegionIds || []);
  const noxUnlocked = isCharacterUnlocked("nox", activeSlot?.completedRegionIds || []);
  const beamSwordUnlocked = isMainWeaponUnlocked("beam-sword", activeSlot?.completedRegionIds || []);
  const activeRegion = useMemo(() => getRegion(activeRegionId) || getRegion(DEFAULT_REGION_ID), [activeRegionId]);
  const activeBgmPath = useMemo(() => resolveMusicTrack(screen, activeRegionId), [screen, activeRegionId]);
  const slotIndex = activeSlotId ? Math.max(0, Number(activeSlotId.split("-")[1] || 1) - 1) : 0;
  const campaignView = activeSlot ? { ...activeSlot, slotIndex } : null;
  const larkAlert = Boolean(
    activeSlot
    && ["wrong-engine-core", "glass-dune", "abyssal-archive"].every((regionId) => activeSlot.completedRegionIds.includes(regionId))
    && !activeSlot.storyFlags.includes(OUTER_SECTOR_BRIEFING_FLAG)
  );
  const availableFacilityUpgrades = useMemo(() => {
    if (!activeSlotId || !activeSlot) return { research: false, equipment: false, augmentation: false };
    const checkFacility = (npcId) => {
      const upgrades = getBaseUpgrades(npcId);
      return upgrades.some((upgrade) => {
        const status = getCampaignUpgradeStatus(campaign, activeSlotId, upgrade.id);
        return Boolean(status.purchasable);
      });
    };
    return {
      research: checkFacility("hana"),
      equipment: checkFacility("ilya"),
      augmentation: checkFacility("aegis"),
    };
  }, [activeSlotId, activeSlot, campaign]);
  const combatBonuses = useMemo(
    () => (activeSlotId ? getCampaignCombatBonuses(campaign, activeSlotId) : null),
    [activeSlotId, campaign],
  );
  const characterSkillRanks = useMemo(
    () => getCharacterSkillRanks(activeSlot?.progression),
    [activeSlot?.progression],
  );
  const activeMainWeaponId = useMemo(
    () => (activeSlotId ? getCampaignMainWeapon(campaign, activeSlotId) : "pulse-rifle"),
    [activeSlotId, campaign],
  );
  const activeCharacterId = useMemo(
    () => (activeSlotId ? getCampaignCharacter(campaign, activeSlotId) : "aegis"),
    [activeSlotId, campaign],
  );
  const activeFlightPlan = useMemo(
    () => (activeSlotId ? getCampaignFlightPlan(campaign, activeSlotId) : flightPlans[0] || null),
    [activeSlotId, campaign, flightPlans],
  );
  const activeFacility = useMemo(() => {
    if (!activeFacilityId || !activeSlotId || !activeSlot) return null;
    const facility = getBaseFacility(activeFacilityId);
    if (!facility) return null;
    const currency = BASE_CURRENCIES[facility.currencyId];
    const facilityNpc = BASE_NPCS[facility.npcId] || null;
    const copy = FACILITY_COPY[facility.id] || {};
    const progression = activeSlot.progression || {};
    const upgrades = getBaseUpgrades(facility.npcId).map((upgrade, index) => {
      const status = getCampaignUpgradeStatus(campaign, activeSlotId, upgrade.id);
      const rank = status.rank || 0;
      const skillLoadout = upgrade.characterId ? getCharacterSkillLoadout(upgrade.characterId) : null;
      const currentRanks = upgrade.ranks.slice(0, rank);
      const nextRanks = upgrade.ranks.slice(0, Math.min(upgrade.ranks.length, rank + 1));
      const characterLockedReason = status.reason === "character-locked" ? "전투원 해금 필요" : null;
      const lockedReason = status.reason === "rank-locked"
        ? `${status.requiredCompletedRegions}개 지역 해방 필요`
        : status.reason === "insufficient-funds" ? `${currency?.koreanName || "재화"} 부족`
          : status.reason === "base-locked" ? "헤이븐-09 잠김" : null;
      return {
        id: upgrade.id,
        characterId: upgrade.characterId || null,
        statusReason: status.reason || null,
        requiredRegionId: status.requiredRegionId || null,
        skillLoadout,
        unlockedSkills: skillLoadout?.skills.filter((skill) => skill.requiredGrade <= rank) || [],
        nextSkillUnlock: skillLoadout?.skills.find((skill) => skill.requiredGrade === rank + 1) || null,
        skillUnlockRanks: upgrade.ranks.map((entry) => ({
          rank: entry.rank,
          slot: entry.unlockSlot || null,
          abilityKey: entry.unlockAbilityKey || null,
          name: entry.unlockName || null,
          cost: entry.cost,
          requiresCompletedRegions: entry.requiresCompletedRegions,
        })),
        order: index + 1,
        category: upgrade.category === "research" ? "영구 연구" : upgrade.category === "augmentation" ? "인물 강화" : "영구 장비",
        name: upgrade.koreanName,
        description: upgrade.description,
        rank,
        maxRank: upgrade.ranks.length,
        currentEffect: formatBaseBonusEntries(currentRanks),
        nextEffect: formatBaseBonusEntries(nextRanks),
        nextCost: status.cost || 0,
        canPurchase: Boolean(status.purchasable),
        lockedReason: characterLockedReason || lockedReason,
      };
    });
    const exchanges = facility.id === "research" ? getBaseResourceExchanges(facility.npcId).map((exchange) => {
      const status = getCampaignResourceExchangeStatus(campaign, activeSlotId, exchange.id);
      const lockedReason = status.reason === "exchange-locked"
        ? `${status.requiredCompletedRegions}개 지역 해방 필요`
        : status.reason === "insufficient-funds" ? "재료 부족"
          : status.reason === "base-locked" ? "헤이븐-09 잠김" : null;
      return {
        ...exchange,
        canExchange: Boolean(status.exchangeable),
        lockedReason,
        costLabel: formatCurrencyMap(status.costs || exchange.costs),
        rewardLabel: formatCurrencyMap(status.rewards || exchange.rewards),
      };
    }) : [];
    return {
      ...facility,
      ...copy,
      name: facility.koreanName,
      currency: progression[facility.currencyId] || 0,
      currencyLabel: currency?.koreanName || facility.currencyId,
      currencyShortLabel: facility.currencyId === "researchData" ? "연구 자료" : facility.currencyId === "augmentationCores" ? "동기화 코어" : "장비 부품",
      artSource: facility.id === "research"
        ? assets?.hanaResearchLab
        : facility.id === "equipment"
          ? assets?.ilyaEquipmentWorkshop
          : facility.id === "augmentation" ? assets?.characterSyncChamber : null,
      augmentationCoreVisual: facility.id === "augmentation" ? assets?.augmentationCoreVisual : null,
      npc: facilityNpc ? {
        ...facilityNpc,
        portraitSource: assets?.[facilityNpc.portraitKey] || facilityNpc.portraitPath,
      } : null,
      selectedCharacterId: activeCharacterId,
      mainWeaponId: activeMainWeaponId,
      weapons: facility.id === "augmentation" ? mainWeapons : [],
      completedRegionIds: activeSlot.completedRegionIds || [],
      equipmentRanks: progression.equipmentRanks || {},
      characters: facility.id === "augmentation" ? playableCharacters.map((character) => ({
        ...character,
        weaponName: character.id === "mika" || character.id === "vesper" || character.id === "nox"
          ? character.weaponName
          : mainWeapons.find((weapon) => weapon.id === activeMainWeaponId)?.koreanName || character.weaponName,
        portraitSource: assets?.[character.portraitAssetKey] || assets?.player,
      })) : [],
      combatStats: facility.id === "augmentation" ? {
        maxHp: 360 + (combatBonuses?.maxHpFlat || 0),
        damageOutput: Math.round((combatBonuses?.damageMultiplier || 1) * 100),
        aegisSpeed: Math.round(245 * (combatBonuses?.moveSpeedMultiplier || 1)),
        mikaSpeed: Math.round(245 * 1.08 * (combatBonuses?.moveSpeedMultiplier || 1)),
        vesperSpeed: Math.round(245 * 1.12 * (combatBonuses?.moveSpeedMultiplier || 1)),
        noxSpeed: Math.round(245 * 1.06 * (combatBonuses?.moveSpeedMultiplier || 1)),
        fireRate: Math.round((combatBonuses?.fireRateMultiplier || 1) * 100),
        completedRegions: activeSlot.completedRegionIds?.length || 0,
      } : null,
      upgrades,
      exchanges,
    };
  }, [activeFacilityId, activeSlotId, activeSlot, campaign, assets, activeCharacterId, activeMainWeaponId, playableCharacters, mainWeapons, combatBonuses]);
  const campaignAssets = useMemo(() => ({
    homeBase: assets?.havenLobby || assets?.havenBase,
    researchLab: assets?.hanaResearchLab,
    equipmentWorkshop: assets?.ilyaEquipmentWorkshop,
    characterSyncChamber: assets?.characterSyncChamber,
    augmentationCoreVisual: assets?.augmentationCoreVisual,
    hanaPortrait: assets?.hanaPortrait,
    ilyaPortrait: assets?.ilyaPortrait,
    nightjarPilot: assets?.nightjarPilot,
    controlOfficer: assets?.rheaControlOfficer,
    regionMap: assets?.airshipRegionMap,
    playerPortrait: assets?.player,
    mikaPortrait: assets?.mikaPortrait,
    vesperPortrait: assets?.vesperPortrait,
    noxPortrait: assets?.noxPortrait,
    tutorialEmpPulse: assets?.tutorialEmpPulse,
    tutorialAegisWard: assets?.tutorialAegisWard,
    tutorialStratosRun: assets?.tutorialStratosRun,
    tutorialHelixTempest: assets?.tutorialHelixTempest,
    returnToHaven: assets?.returnToHaven,
    defenseBattlefield: assets?.defenseBattlefield,
    defenseBattlefieldPortrait: assets?.defenseBattlefieldPortrait,
    sortieVideos: Object.freeze({
      "wrong-engine-core": assets?.sortieWrongEngine,
      "glass-dune": assets?.sortieGlassDune,
      "abyssal-archive": assets?.sortieAbyssalArchive,
    }),
  }), [assets]);
  const debugGuideBypass = import.meta.env.DEV
    && typeof window !== "undefined"
    && new URLSearchParams(window.location.search).get("debug") === "1";

  useEffect(() => {
    if (!assets) return undefined;
    return scheduleDomImagePreload(domAssetSources(baseSurfaceAssetKeys(activeCharacterId)));
  }, [activeCharacterId, assets]);

  useEffect(() => {
    if (screen === "sortie" && sortieVideoComplete && combatRuntimeReady) setScreen("game");
  }, [combatRuntimeReady, screen, sortieVideoComplete]);

  useEffect(() => () => {
    sfx.dispose();
  }, [sfx]);
  useEffect(() => {
    const player = createMusicPlayer(bgmRef.current, { gainForTrack: musicTrackGain });
    musicPlayerRef.current = player;
    return () => {
      player.dispose();
      musicPlayerRef.current = null;
    };
  }, []);
  useEffect(() => sfx.setEnabled(soundEnabled), [sfx, soundEnabled]);
  useEffect(() => sfx.setVolume(audioSettings.sfxVolume), [audioSettings.sfxVolume, sfx]);
  useEffect(() => { setSettingsSaved(persistGameSettings(audioSettings).saved); }, [audioSettings]);
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("game-reduced-motion", Boolean(audioSettings.reducedMotion));
    root.classList.toggle("game-high-contrast", Boolean(audioSettings.highContrast));
    return () => {
      root.classList.remove("game-reduced-motion");
      root.classList.remove("game-high-contrast");
    };
  }, [audioSettings.highContrast, audioSettings.reducedMotion]);
  useEffect(() => {
    musicPlayerRef.current?.update({
      track: activeBgmPath,
      enabled: soundEnabled,
      volume: audioSettings.musicVolume,
    });
  }, [activeBgmPath, audioSettings.musicVolume, soundEnabled]);

  useEffect(() => {
    const handleButtonPointer = (event) => {
      const button = event.target instanceof Element ? event.target.closest("button") : null;
      if (!button || button.disabled) return;
      sfx.start();
      sfx.play(button.dataset.uiSound || "click");
    };
    const handleButtonHover = (event) => {
      const button = event.target instanceof Element ? event.target.closest("button") : null;
      const previous = event.relatedTarget instanceof Element ? event.relatedTarget.closest("button") : null;
      if (!button || button === previous || button.disabled) return;
      sfx.play("uiHover");
    };
    document.addEventListener("pointerdown", handleButtonPointer, true);
    document.addEventListener("pointerover", handleButtonHover, true);
    return () => {
      document.removeEventListener("pointerdown", handleButtonPointer, true);
      document.removeEventListener("pointerover", handleButtonHover, true);
    };
  }, [sfx]);

  useEffect(() => {
    const handleBaseEscape = (event) => {
      if (event.key !== "Escape" || screen !== "base") return;
      if (activeFacilityId) {
        event.preventDefault();
        setActiveFacilityId(null);
      } else if (activeNpc) {
        event.preventDefault();
        setActiveNpc(null);
        setNpcLineIndex(0);
      }
    };
    window.addEventListener("keydown", handleBaseEscape);
    return () => window.removeEventListener("keydown", handleBaseEscape);
  }, [activeFacilityId, activeNpc, screen]);

  const startTitleMusic = useCallback(() => {
    sfx.start();
    if (!activeBgmPath) return;
    if (bgmPlaying) {
      musicPlayerRef.current?.update({ enabled: false });
      setBgmPlaying(false);
      setSoundEnabled(false);
      setAudioSettings((current) => mergeGameSettings(current, { masterSoundEnabled: false }));
      return;
    }
    setSoundEnabled(true);
    setAudioSettings((current) => mergeGameSettings(current, { masterSoundEnabled: true }));
    musicPlayerRef.current?.update({ track: activeBgmPath, enabled: true, volume: audioSettings.musicVolume });
  }, [activeBgmPath, audioSettings.musicVolume, bgmPlaying, sfx]);

  const prepareSurface = useCallback((label, sources, onReady) => {
    const token = transitionTokenRef.current + 1;
    transitionTokenRef.current = token;
    setTransitionLabel(label);
    setTransitionProgress(0);
    setScreen("loading");
    void preloadDomImages(sources, (progress) => {
      if (transitionTokenRef.current === token) setTransitionProgress(progress);
    }).then(() => {
      if (transitionTokenRef.current === token) onReady();
    });
  }, []);

  const openPostVictoryStep = useCallback((nextStep) => {
    if (STORY_EPISODES[nextStep]) {
      setStoryEpisodeId(nextStep);
      setStoryReplay(false);
      prepareSurface("작전 기록 불러오는 중", [STORY_ART[STORY_EPISODES[nextStep].lines[0].art]], () => setScreen("story"));
      return;
    }
    if (nextStep === "sword-guide") {
      setSwordGuideReturnScreen("post-victory");
      setScreen("sword-guide");
      return;
    }
    if (nextStep === "return") {
      prepareSurface("나이트자 귀환 항로 준비 중", [DOM_ASSET_REFS.returnToHaven?.src], () => setScreen("return"));
      return;
    }
    setScreen("base");
  }, [prepareSurface]);

  const openSaveSlots = useCallback(() => {
    sfx.start();
    sfx.play("start");
    setSettingsOpen(false);
    setScreen("save");
  }, [sfx]);

  const beginSortieCinematic = useCallback((regionId) => {
    const isRepeatSortie = Boolean(activeSlot?.completedRegionIds?.includes(regionId));
    const bypassCinematic = Boolean(debugGuideBypass);
    setActiveRegionId(regionId);
    setRepeatSortie(isRepeatSortie || bypassCinematic);
    setSortieVideoComplete(isRepeatSortie || bypassCinematic);
    setCombatRuntimeReady(false);
    setCombatLoadProgress(0);
    musicPlayerRef.current?.update({ track: null });
    const region = getRegion(regionId) || getRegion(DEFAULT_REGION_ID);
    prepareSurface("출격 영상과 작전 표식 준비 중", [region?.assets?.dom?.thumbnail?.path], () => setScreen("sortie"));
  }, [activeSlot, debugGuideBypass, prepareSurface]);

  const enterCombat = useCallback(() => {
    setSortieVideoComplete(true);
  }, []);

  const handleCombatRuntimeReady = useCallback(() => setCombatRuntimeReady(true), []);
  const handleCombatRuntimeProgress = useCallback((progress) => {
    setCombatLoadProgress(Math.max(0, Math.min(1, Number(progress) || 0)));
  }, []);

  const launchCombat = useCallback((regionId, requestedParty) => {
    const slot = activeSlotId ? getCampaignSlot(campaign, activeSlotId) : null;
    if (!slot || !canLaunchRegion(slot, regionId)) return;
    const party = Array.isArray(requestedParty) ? requestedParty : sortieCharacterIds || [activeCharacterId];
    setSortieCharacterIds(resolveSortieRoster({ characterId: party[0] || activeCharacterId,
      partyCharacterIds: party, mikaUnlocked, vesperUnlocked, noxUnlocked }));
    setActiveNpc(null);
    setActiveFacilityId(null);
    setActiveRegionId(regionId);
    setResult(null);
    if (!slot.abilityGuideSeen && !debugGuideBypass) {
      setGuideReturnScreen("sortie");
      prepareSurface("전술 가이드 준비 중", domAssetSources(GUIDE_DOM_ASSET_KEYS), () => setScreen("guide"));
      return;
    }
    beginSortieCinematic(regionId);
  }, [activeSlotId, activeCharacterId, sortieCharacterIds, mikaUnlocked, vesperUnlocked, noxUnlocked, beginSortieCinematic, campaign, debugGuideBypass, prepareSurface]);

  const selectSaveSlot = useCallback((index) => {
    setSortieCharacterIds(null);
    const slotId = `slot-${index + 1}`;
    const existing = getCampaignSlot(campaign, slotId);
    const nextCampaign = existing ? campaign : createCampaignSlot(campaign, slotId);
    const nextSlot = getCampaignSlot(nextCampaign, slotId);
    setCampaign(nextCampaign);
    saveCampaign(nextCampaign);
    setActiveSlotId(slotId);
    setActiveRegionId(nextSlot?.lastRegionId || DEFAULT_REGION_ID);
    const isFreshSlot = !existing;
    setActiveNpc(isFreshSlot ? BASE_NPCS.rhea : null);
    setNpcLineIndex(0);
    setActiveFacilityId(null);
    setResult(null);
    setGuideReturnScreen("base");
    const pendingStep = getCampaignPostVictorySteps(nextCampaign, slotId)[0];
    if (pendingStep) {
      openPostVictoryStep(pendingStep);
      return;
    }
    const nextCharacterId = getCampaignCharacter(nextCampaign, slotId);
    prepareSurface("헤이븐-09 기지 불러오는 중", domAssetSources(baseSurfaceAssetKeys(nextCharacterId)), () => setScreen("base"));
  }, [campaign, openPostVictoryStep, prepareSurface]);

  const continuePostVictory = useCallback(() => {
    const nextStep = activeSlotId ? getCampaignPostVictorySteps(campaign, activeSlotId)[0] : null;
    openPostVictoryStep(nextStep || "return");
  }, [activeSlotId, campaign, openPostVictoryStep]);

  const consumePostVictoryScene = useCallback((step, sourceCampaign = campaign) => {
    if (!activeSlotId) {
      setScreen("base");
      return sourceCampaign;
    }
    const completed = consumeCampaignPostVictoryStep(sourceCampaign, activeSlotId, step);
    setCampaign(completed);
    saveCampaign(completed);
    openPostVictoryStep(getCampaignPostVictorySteps(completed, activeSlotId)[0]);
    return completed;
  }, [activeSlotId, campaign, openPostVictoryStep]);

  const finish = useCallback((nextResult) => {
    const status = nextResult?.status || nextResult?.phase;
    const regionId = nextResult?.regionId || activeRegionId;
    if (status === "victory" && activeSlotId) {
      const slotBeforeVictory = getCampaignSlot(campaign, activeSlotId);
      const completed = completeRegion(campaign, activeSlotId, regionId, {
        ...nextResult,
        status: "victory",
        runId: nextResult?.runId || `${regionId}-${Date.now()}`,
      });
      saveCampaign(completed);
      setCampaign(completed);
      setActiveNpc(null);
      setActiveFacilityId(null);
      const completedSlot = getCampaignSlot(completed, activeSlotId);
      const previousBestTime = slotBeforeVictory?.regionRecords?.[regionId]?.bestTime || null;
      const completedRecord = completedSlot?.regionRecords?.[regionId] || null;
      setResult({
        ...nextResult,
        regionId,
        previousBestTime,
        bestTime: completedRecord?.bestTime || null,
        campaignRewards: completedSlot?.lastRegionRewards || null,
      });
      setScreen("result");
      return;
    }
    setResult({ ...nextResult, regionId });
    setScreen("result");
  }, [activeRegionId, activeSlotId, campaign]);

  const finishSwordAbilityGuide = useCallback(() => {
    if (swordGuideReturnScreen === "post-victory") {
      consumePostVictoryScene("sword-guide");
      return;
    }
    let nextCampaign = campaign;
    if (activeSlotId) {
      nextCampaign = completeSwordAbilityGuide(campaign, activeSlotId);
      setCampaign(nextCampaign);
      saveCampaign(nextCampaign);
    }
    if (swordGuideReturnScreen === "return") {
      prepareSurface("나이트자 귀환 항로 준비 중", [DOM_ASSET_REFS.returnToHaven?.src], () => setScreen("return"));
      return;
    }
    setScreen(swordGuideReturnScreen);
  }, [activeSlotId, campaign, consumePostVictoryScene, prepareSurface, swordGuideReturnScreen]);

  const openSwordAbilityGuide = useCallback((returnScreen = "regions") => {
    if (!beamSwordUnlocked) return;
    setSwordGuideReturnScreen(returnScreen);
    setScreen("sword-guide");
  }, [beamSwordUnlocked]);

  const talkToNpc = useCallback((npc) => {
    setActiveFacilityId(null);
    setActiveNpc(npc?.id === "lark" ? {
      ...npc,
      interactionLabel: npc.flightOperationLabel || npc.interactionLabel,
      dialogue: larkAlert
        ? npc.milestoneDialogue || npc.dialogue
        : npc.flightOperationsDialogue || npc.dialogue,
    } : npc);
    setNpcLineIndex(0);
  }, [larkAlert]);

  const closeNpc = useCallback(() => {
    setActiveNpc(null);
    setNpcLineIndex(0);
  }, []);

  const openFacility = useCallback((facilityId) => {
    const facility = getBaseFacility(facilityId);
    if (!facility) return;
    setActiveNpc(null);
    setNpcLineIndex(0);
    const facilityAssetKeys = facilityId === "research"
      ? ["hanaResearchLab", "hanaPortrait"]
      : facilityId === "equipment"
        ? ["ilyaEquipmentWorkshop", "ilyaPortrait"]
        : ["characterSyncChamber", "augmentationCoreVisual", characterPortraitAssetKey(activeCharacterId)];
    prepareSurface(
      `${facility.koreanName} 인터페이스 준비 중`,
      domAssetSources(facilityAssetKeys),
      () => {
        setActiveFacilityId(facilityId);
        setScreen("base");
      },
    );
  }, [activeCharacterId, prepareSurface]);

  const closeFacility = useCallback(() => setActiveFacilityId(null), []);

  const openRegionSelect = useCallback(() => {
    closeNpc();
    closeFacility();
    prepareSurface(
      "비행선 전술 지도 준비 중",
      [...domAssetSources(REGION_MAP_DOM_ASSET_KEYS), ...regionPreviewSources],
      () => setScreen("regions"),
    );
  }, [closeFacility, closeNpc, prepareSurface, regionPreviewSources]);

  const openFlightOperations = useCallback(() => {
    closeNpc();
    closeFacility();
    prepareSurface(
      "나이트자 항로 작전 데이터 동기화 중",
      domAssetSources(["airshipRegionMap", "nightjarPilot", "havenLobby"]),
      () => setScreen("flight-operations"),
    );
  }, [closeFacility, closeNpc, prepareSurface]);

  const openDefenseSelect = useCallback(() => {
    closeNpc();
    closeFacility();
    prepareSurface("레아 방어 관제망 준비 중", domAssetSources(DEFENSE_DOM_ASSET_KEYS), () => setScreen("defense-select"));
  }, [closeFacility, closeNpc, prepareSurface]);

  const launchDefense = useCallback((stageId, doctrineId = "rapidDeployment") => {
    const slot = activeSlotId ? getCampaignSlot(campaign, activeSlotId) : null;
    if (!slot || !canLaunchDefenseStage(slot, stageId)) {
      sfx.play("denied");
      return;
    }
    setActiveDefenseStageId(stageId);
    setActiveDefenseDoctrineId(doctrineId);
    setDefenseResult(null);
    setScreen("defense");
  }, [activeSlotId, campaign, sfx]);

  const finishDefense = useCallback((nextResult) => {
    if (nextResult?.status === "victory" && activeSlotId) {
      const completed = completeDefenseStage(campaign, activeSlotId, nextResult.stageId || activeDefenseStageId, nextResult);
      saveCampaign(completed);
      setCampaign(completed);
      setDefenseResult({ ...nextResult, rewards: getCampaignSlot(completed, activeSlotId)?.lastDefenseRewards || null });
    } else {
      setDefenseResult(nextResult);
    }
    setScreen("defense-result");
  }, [activeDefenseStageId, activeSlotId, campaign]);

  const handleNpcInteraction = useCallback((interaction) => {
    closeNpc();
    closeFacility();
    if (interaction === "open-ability-guide") {
      setGuideReturnScreen("base");
      prepareSurface("전술 가이드 준비 중", domAssetSources(GUIDE_DOM_ASSET_KEYS), () => setScreen("guide"));
      return;
    }
    if (interaction === "open-region-select") {
      if (larkAlert && activeSlotId) {
        const nextCampaign = completeOuterSectorBriefing(campaign, activeSlotId);
        setCampaign(nextCampaign);
        saveCampaign(nextCampaign);
      }
      openRegionSelect();
      return;
    }
    if (interaction === "open-flight-operations") {
      if (larkAlert && activeSlotId) {
        const nextCampaign = completeOuterSectorBriefing(campaign, activeSlotId);
        setCampaign(nextCampaign);
        saveCampaign(nextCampaign);
      }
      openFlightOperations();
    }
  }, [activeSlotId, campaign, closeFacility, closeNpc, larkAlert, openFlightOperations, openRegionSelect, prepareSurface]);

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
    if (guideReturnScreen === "sortie") {
      beginSortieCinematic(activeRegionId);
      return;
    }
    setScreen(guideReturnScreen);
  }, [activeRegionId, activeSlotId, beginSortieCinematic, campaign, guideReturnScreen]);

  const finishCombatOverlay = useCallback(() => {
    if (!activeSlotId) return;
    setCampaign((currentCampaign) => {
      const nextCampaign = completeCombatOverlay(currentCampaign, activeSlotId);
      saveCampaign(nextCampaign);
      return nextCampaign;
    });
  }, [activeSlotId]);

  const finishDefenseGuide = useCallback(() => {
    if (!activeSlotId) return;
    const nextCampaign = completeDefenseGuide(campaign, activeSlotId);
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

  const exchangeBaseResources = useCallback((exchangeId) => {
    if (!activeSlotId) return;
    const exchange = exchangeCampaignResources(campaign, activeSlotId, exchangeId);
    if (!exchange.ok) {
      sfx.play("alert");
      return;
    }
    setCampaign(exchange.campaign);
    saveCampaign(exchange.campaign);
    sfx.play("upgrade");
  }, [activeSlotId, campaign, sfx]);

  const selectMainWeapon = useCallback((mainWeaponId) => {
    if (!activeSlotId) return;
    const nextCampaign = setCampaignMainWeapon(campaign, activeSlotId, mainWeaponId);
    setCampaign(nextCampaign);
    saveCampaign(nextCampaign);
    sfx.play("click");
  }, [activeSlotId, campaign, sfx]);

  const selectCharacter = useCallback((characterId) => {
    if (!activeSlotId) return;
    const nextCampaign = setCampaignCharacter(campaign, activeSlotId, characterId);
    setCampaign(nextCampaign);
    saveCampaign(nextCampaign);
    sfx.play("click");
  }, [activeSlotId, campaign, sfx]);

  const selectFlightPlan = useCallback((planId) => {
    if (!activeSlotId) return;
    const currentPlanId = getCampaignFlightPlan(campaign, activeSlotId)?.id;
    const nextCampaign = setCampaignFlightPlan(campaign, activeSlotId, planId);
    const nextPlanId = getCampaignFlightPlan(nextCampaign, activeSlotId)?.id;
    if (nextPlanId !== planId || nextPlanId === currentPlanId) {
      sfx.play(nextPlanId === currentPlanId ? "click" : "denied");
      return;
    }
    setCampaign(nextCampaign);
    saveCampaign(nextCampaign);
    sfx.play("uiConfirm");
  }, [activeSlotId, campaign, sfx]);

  const toggleSound = useCallback(() => {
    const nextEnabled = !soundEnabled;
    setSoundEnabled(nextEnabled);
    setAudioSettings((current) => mergeGameSettings(current, { masterSoundEnabled: nextEnabled }));
  }, [soundEnabled]);

  const updateAudioSettings = useCallback((patch) => {
    setAudioSettings((current) => mergeGameSettings(current, patch));
    if (Object.prototype.hasOwnProperty.call(patch || {}, "masterSoundEnabled")) {
      setSoundEnabled(patch.masterSoundEnabled !== false);
    }
  }, []);

  const resetGameSettings = useCallback(() => {
    setAudioSettings({ ...DEFAULT_GAME_SETTINGS });
    setSoundEnabled(DEFAULT_GAME_SETTINGS.masterSoundEnabled);
    sfx.play("uiConfirm");
  }, [sfx]);

  let content;
  if (!assets) {
    content = <InitialAssetLoadingScreen progress={assetProgress} />;
  } else if (screen === "loading") {
    content = <InitialAssetLoadingScreen progress={transitionProgress} label={transitionLabel} />;
  } else if (screen === "save") {
    content = <SaveSlotScreen slots={campaign.slots} onSelect={selectSaveSlot} onBack={() => setScreen("intro")} />;
  } else if (screen === "story") {
    content = <StorySceneScreen key={`${storyReplay}:${storyEpisodeId}`} episodeId={storyEpisodeId} replay={storyReplay} onComplete={() => {
      if (storyReplay) setScreen("story-archive");
      else consumePostVictoryScene(storyEpisodeId);
    }} />;
  } else if (screen === "story-archive" && activeSlot) {
    content = <StoryArchiveScreen completedRegionIds={activeSlot.completedRegionIds} onBack={() => setScreen("base")} onReplay={id => {
      if (!isStoryAvailable(id, activeSlot.completedRegionIds)) return;
      setStoryEpisodeId(id);
      setStoryReplay(true);
      prepareSurface("작전 기록 불러오는 중", [STORY_ART[STORY_EPISODES[id].lines[0].art]], () => setScreen("story"));
    }} />;
  } else if (screen === "guide") {
    content = (
      <AbilityGuideScreen
        assets={campaignAssets}
        npc={BASE_NPCS.rhea}
        guideType="starter"
        onComplete={finishAbilityGuide}
        onBack={guideReturnScreen === "base" ? () => setScreen("base") : null}
      />
    );
  } else if (screen === "sword-guide") {
    content = (
      <AbilityGuideScreen
        assets={campaignAssets}
        npc={BASE_NPCS.rhea}
        guideType="sword"
        onComplete={finishSwordAbilityGuide}
        onBack={swordGuideReturnScreen === "regions" || swordGuideReturnScreen === "base" ? () => setScreen(swordGuideReturnScreen) : null}
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
        larkAlert={larkAlert}
        availableUpgrades={availableFacilityUpgrades}
        onNpc={talkToNpc}
        onAdvanceNpc={() => setNpcLineIndex((index) => index + 1)}
        onCloseNpc={closeNpc}
        onOpenFacility={openFacility}
        onNpcInteraction={handleNpcInteraction}
        onPurchaseUpgrade={purchaseBaseUpgrade}
        onExchangeResources={exchangeBaseResources}
        onCharacterChange={selectCharacter}
        onWeaponChange={selectMainWeapon}
        onOpenSwordGuide={() => openSwordAbilityGuide("base")}
        onCloseFacility={closeFacility}
        onBoard={openRegionSelect}
        onDefense={openDefenseSelect}
        onOpenSettings={() => setSettingsOpen(true)}
        onArchive={() => { closeNpc(); closeFacility(); setScreen("story-archive"); }}
        onTitle={() => { closeNpc(); closeFacility(); setScreen("save"); }}
      />
    );
  } else if (screen === "flight-operations" && campaignView) {
    content = (
      <LarkFlightOperationsScreen
        campaign={campaignView}
        pilot={BASE_NPCS.lark}
        plans={flightPlans}
        activePlanId={activeFlightPlan?.id}
        assets={campaignAssets}
        onSelect={selectFlightPlan}
        onBack={() => setScreen("base")}
      />
    );
  } else if (screen === "regions" && campaignView) {
    content = <RegionSelectScreen regions={regions} clusters={regionClusters} campaign={campaignView} assets={campaignAssets} weapons={mainWeapons} equippedWeaponId={activeMainWeaponId} characters={unlockedPlayableCharacters} selectedCharacterId={activeCharacterId} onCharacterChange={selectCharacter} onSelect={launchCombat} onBack={() => setScreen("base")} />;
  } else if (screen === "defense-select" && campaignView) {
    content = <DefenseStageSelectScreen stages={defenseStages} campaign={campaignView} assets={campaignAssets} onSelect={launchDefense} onBack={() => setScreen("base")} />;
  } else if (screen === "defense") {
    content = <DefenseArenaScreen stageId={activeDefenseStageId} doctrineId={activeDefenseDoctrineId} assets={campaignAssets} sfx={sfx} showTutorial={activeDefenseStageId === "haven-perimeter" && !activeSlot?.defenseGuideSeen} onTutorialComplete={finishDefenseGuide} onFinish={finishDefense} onBase={() => setScreen("base")} />;
  } else if (screen === "defense-result") {
    content = <DefenseResultScreen result={defenseResult} stage={getDefenseStage(activeDefenseStageId)} rewards={defenseResult?.rewards} onRetry={() => { setDefenseResult(null); setScreen("defense"); }} onBase={() => setScreen("base")} />;
  } else if (screen === "sortie" || screen === "game") {
    content = (
      <div className={`combat-runtime-shell${screen === "sortie" ? " is-preparing" : " is-live"}`}>
        <PhaserArenaScreen
          assets={assets}
          regionId={activeRegionId}
          region={activeRegion}
          combatBonuses={combatBonuses}
          characterSkillRanks={characterSkillRanks}
          mainWeaponId={activeMainWeaponId}
          characterId={sortieCharacterIds?.[0] || activeCharacterId}
          partyCharacterIds={sortieCharacterIds}
          mikaUnlocked={mikaUnlocked}
          vesperUnlocked={vesperUnlocked}
          noxUnlocked={noxUnlocked}
          soundEnabled={soundEnabled}
          audioSettings={audioSettings}
          settingsSaved={settingsSaved}
          sfx={sfx}
          onToggleSound={toggleSound}
          onAudioSettingsChange={updateAudioSettings}
          onFinish={finish}
          onBase={activeSlot?.homeBaseUnlocked ? () => setScreen("base") : null}
          showCombatTutorial={Boolean(activeSlot && !activeSlot.combatOverlaySeen && !debugGuideBypass && audioSettings.combatHintsEnabled !== false)}
          skipOpeningNarrative={repeatSortie}
          onCombatTutorialComplete={finishCombatOverlay}
          preparing={screen === "sortie"}
          onRuntimeProgress={handleCombatRuntimeProgress}
          onRuntimeReady={handleCombatRuntimeReady}
        />
        {screen === "sortie" && (
          <SortieCinematicScreen
            region={activeRegion}
            videoSource={campaignAssets.sortieVideos[activeRegionId]}
            posterSource={activeRegion?.assets?.dom?.thumbnail?.path}
            soundEnabled={soundEnabled}
            combatLoadProgress={combatLoadProgress}
            combatReady={combatRuntimeReady}
            videoComplete={sortieVideoComplete}
            repeatSortie={repeatSortie}
            onComplete={enterCombat}
          />
        )}
      </div>
    );
  } else if (screen === "return") {
    content = <ReturnCinematicScreen region={activeRegion} backgroundSource={campaignAssets.returnToHaven} onComplete={() => consumePostVictoryScene("return")} />;
  } else if (screen === "result") {
    content = <ResultScreen result={result} assets={assets} region={activeRegion} onRestart={() => launchCombat(activeRegionId)} onBase={activeSlot?.homeBaseUnlocked ? () => setScreen("base") : null} onContinue={continuePostVictory} />;
  } else {
    content = (
      <IntroScreen
        assets={assets}
        assetError={assetError}
        onStart={openSaveSlots}
        musicPlaying={bgmPlaying}
        onToggleMusic={startTitleMusic}
        onOpenSettings={() => setSettingsOpen(true)}
      />
    );
  }

  return (
    <>
      {content}
      {settingsOpen && (
        <GameSettingsOverlay
          key={SETTINGS_STORAGE_KEY}
          settings={audioSettings}
          saved={settingsSaved}
          onChange={updateAudioSettings}
          onReset={resetGameSettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      <audio
        key="app-background-music"
        ref={bgmRef}
        loop
        preload="metadata"
        hidden
        aria-hidden="true"
        onPlay={() => setBgmPlaying(true)}
        onPause={() => setBgmPlaying(false)}
      />
    </>
  );
}
