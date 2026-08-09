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
  Play,
  Pulse,
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

const ASSET_PATHS = Object.freeze({
  map: "./assets/survivor/swarm-arena.png",
  player: "./assets/survivor/player.png",
  hunter: "./assets/survivor/hunter.png",
  suppressor: "./assets/survivor/suppressor.png",
  brute: "./assets/survivor/brute.png",
  boss: "./assets/survivor/bosses/wrong-engine.png",
  bossPhase2: "./assets/survivor/bosses/wrong-engine-phase2.png",
  bossPhase3: "./assets/survivor/bosses/wrong-engine-phase3.png",
  bossPatterns: "./assets/survivor/vfx/boss-pattern-atlas.png",
  playerOrdnance: "./assets/survivor/vfx/player-ordnance-atlas.png",
  playerMotion: "./assets/survivor/animation/player-motion-atlas.png",
  enemyMotion: "./assets/survivor/animation/enemy-motion-atlas.png",
  bossMotion: "./assets/survivor/animation/boss-motion-atlas.png",
  sentry: "./assets/survivor/skills/sentry.png",
  emp: "./assets/survivor/skills/emp-pylon.png",
  drone: "./assets/survivor/skills/wingman-drone.png",
});

const BGM_PATH = "./assets/audio/overload-main-theme.mp3";
const OPTIONAL_ASSET_KEYS = new Set(["playerMotion", "enemyMotion", "bossMotion"]);

const EVENT_SOUNDS = Object.freeze({
  swarmStart: "enemyAlert",
  shot: "shoot",
  enemyKilled: "kill",
  levelUp: "analysis",
  rewardChosen: "upgrade",
  dash: "dash",
  playerHit: "playerHit",
  swarmCleared: "merge",
  bossIntro: "boss",
  bossPatternTelegraph: "bossTelegraph",
  bossPatternFire: "rail",
  bossStage: "bossBreak",
  bossStagePulse: "alert",
  bossRageBurst: "bossTelegraph",
  bossWeakness: "core",
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
  ultimateImpact: "rail",
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
  swarmStart: ["MASS INCURSION · 1,000", "전방위 게이트에서 적 1,000기가 연속 투입됩니다."],
  swarmCleared: ["DATASET PURGED", "남은 경험치를 흡수합니다. 보스 신호 감지."],
  bossIntro: ["THE WRONG ENGINE", "공격 경고선을 읽고 빈틈을 만들어내세요."],
  bossStage: ["PATTERN EVOLVED", "보스 공격 조합이 더 빨라집니다."],
  bossStagePulse: ["⚠ BERSERK EVOLUTION", "장갑 형상과 공격 알고리즘이 다시 변이합니다."],
  bossWeakness: ["CORE EXPOSED · ×2", "돌진을 벽에 꽂았습니다. 지금 모든 화력을 집중하세요."],
  surgeWarning: ["⚠ MASS WAVE INBOUND", "게이트 신호 폭증. 대량 공세가 곧 전장에 진입합니다."],
  surgeStart: ["OVERLOAD WAVE", "사방 게이트 개방. 광역 화력으로 포위망을 찢으세요."],
  skillMastered: ["MASTER EVOLUTION", "스킬이 최종 형태로 진화했습니다. 광역 섬멸 프로토콜 가동."],
  ultimateWarning: ["ULTIMATE SUPPORT LOCKED", "공중 지원 좌표 확정. 충격 범위에서 화력을 집중하세요."],
  squadSummon: ["4-FRONT RECALL", "AEGIS · ROOK · NYX · MOSS 전투 링크가 12초간 동기화됩니다."],
  overdrive: ["WEAPON OVERDRIVE", "처치 데이터가 화력 제한기를 해제합니다."],
  bossContact: ["⚠ CRUSH IMPACT", "보스 본체와 충돌했습니다. 구동계가 일시 정지됩니다."],
  bossContactHit: ["⚠ CRUSH IMPACT", "보스 본체와 충돌했습니다. 구동계가 일시 정지됩니다."],
  playerStunned: ["SYSTEM JAMMED", "이동과 대시가 잠시 차단됩니다."],
});

const CATEGORY_META = Object.freeze({
  weapon: { label: "NEW WEAPON", korean: "무기", color: "cyan" },
  skill: { label: "CORE SKILL", korean: "기술", color: "amber" },
  ally: { label: "COMBAT ALLY", korean: "동료", color: "violet" },
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
  squadRecall: 30,
  chain: 4.8,
  nova: 9,
  airstrike: 18,
  omegaLaser: 22,
});

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
  chain: "밀집한 적 사이를 연쇄 번개가 도약합니다. RANK 3에서 전장 폭풍으로 진화합니다.",
  nova: "주기적으로 충격파를 방출합니다. RANK 3에서 화면 전체를 휩쓰는 이중 폭발이 됩니다.",
  airstrike: "긴 재사용 시간 뒤 적 밀집 지역을 연속 폭격합니다. 마스터 시 15발 포화 폭격을 호출합니다.",
  omegaLaser: "조준 방향으로 거대 레이저포를 호출합니다. 마스터 시 광폭 빔이 전장을 관통합니다.",
  drone: "가까운 적을 자율 추적하는 기동형 전투 드론입니다.",
  sentry: "현재 위치에 고속 연사 센트리를 설치합니다.",
  suppressor: "밀집한 적을 감속시키고 연쇄 충격을 가하는 동료입니다.",
});

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}

function useGameAssets() {
  const [state, setState] = useState({ assets: null, error: false });
  useEffect(() => {
    let cancelled = false;
    Promise.all(Object.entries(ASSET_PATHS).map(async ([key, source]) => {
      try {
        return [key, await loadImage(source)];
      } catch (error) {
        if (OPTIONAL_ASSET_KEYS.has(key)) return [key, null];
        throw error;
      }
    }))
      .then((entries) => {
        if (!cancelled) setState({ assets: Object.fromEntries(entries), error: false });
      })
      .catch(() => {
        if (!cancelled) setState({ assets: null, error: true });
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return state;
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
  if (event?.type === "shot" && WEAPON_EVENT_SOUNDS[kind]) return WEAPON_EVENT_SOUNDS[kind];
  if (IMPACT_EVENT_TYPES.has(event?.type)) {
    if (kind === "chain") return "arc";
    if (kind === "nova" || kind === "pulseOverdrive") return "emp";
    if (kind === "rail" || kind === "airstrike" || kind === "omegaLaser") return "rail";
    if (kind === "rocket") return "bossBreak";
    if (event?.type === "explosion") return "enemyHit";
    return WEAPON_EVENT_SOUNDS[kind] || "enemyHit";
  }
  return direct;
}

function IntroScreen({ assets, assetError, onStart }) {
  return (
    <main className="overload-intro">
      <div className="ambient-grid" aria-hidden="true" />
      <header className="intro-header">
        <div className="brand-lockup">
          <span className="brand-mark"><Crosshair weight="bold" /></span>
          <span><b>NULL LABS</b><small>OVERLOAD SURVIVAL DIVISION</small></span>
        </div>
        <div className="build-chip"><i /> NAN 2026 PLAYABLE BUILD</div>
      </header>

      <section className="overload-hero" aria-labelledby="game-title">
        <div className="overload-copy">
          <div className="eyebrow"><span /> ONE PILOT · 1,000 HOSTILES · THREE BOSS FORMS</div>
          <h1 id="game-title">TRAIN ME <em>WRONG</em><small>OVERLOAD</small></h1>
          <p className="overload-deck">
            사격은 멈추지 않습니다. <strong>당신은 조준과 생존에만 집중하세요.</strong><br />
            적의 경험치를 흡수해 무기·기술·동료를 진화시키고 최종 보스를 무너뜨리세요.
          </p>

          <div className="overload-loop" aria-label="핵심 플레이 루프">
            <article><span>01</span><Crosshair weight="bold" /><div><b>AIM</b><small>포인터로 탄막을 지휘</small></div></article>
            <article><span>02</span><Sparkle weight="fill" /><div><b>EVOLVE</b><small>3지선다로 빌드 완성</small></div></article>
            <article><span>03</span><Warning weight="fill" /><div><b>BREAK</b><small>패턴을 피해 보스 처치</small></div></article>
          </div>

          <button className="primary-cta" type="button" onClick={onStart} disabled={!assets && !assetError}>
            <span>{assets || assetError ? "오버로드 시작" : "전투 에셋 로딩 중"}</span>
            {assets || assetError ? <Play weight="fill" /> : <i className="loading-ring" />}
          </button>
          {assetError && <p className="asset-warning"><Warning /> 일부 이미지 대신 안전 렌더링을 사용합니다.</p>}

          <div className="control-legend overload-controls">
            <span><kbd>WASD</kbd> 이동</span>
            <span><kbd>SPACE</kbd> 대시</span>
            <span><kbd>MOUSE</kbd> 조준</span>
            <strong><Pulse weight="fill" /> AUTO FIRE</strong>
          </div>
        </div>

        <div className="overload-visual" aria-hidden="true">
          {assets?.map && <img className="overload-map" src={assets.map.src} alt="" draggable="false" />}
          <div className="arena-scan" />
          {assets?.player && <img className="overload-player" src={assets.player.src} alt="" draggable="false" />}
          {assets?.hunter && Array.from({ length: 7 }, (_, index) => (
            <img className={`overload-enemy enemy-${index + 1}`} src={assets.hunter.src} alt="" draggable="false" key={index} />
          ))}
          {assets?.boss && <img className="overload-boss" src={assets.boss.src} alt="" draggable="false" />}
          <div className="threat-counter"><small>HOSTILE DATASET</small><strong>1,000</strong><span>UNITS LOCKED</span></div>
          <div className="auto-fire-tag"><i /> CONTINUOUS FIRE ONLINE</div>
        </div>
      </section>

      <footer className="intro-footer">
        <span>PROJECT-ORIGINAL ART · PROCEDURAL WEB AUDIO · BROWSER-LOCAL SIMULATION</span>
        <span>BUILD 1.0 / OVERLOAD REBOOT</span>
      </footer>
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
        <span>{bossPhase ? `PHASE ${hud.boss.stage || 1}` : "SWARM PURGE"}</span>
        <strong>{bossPhase ? hud.boss.name || "THE WRONG ENGINE" : "HOSTILE DATASET"}</strong>
        <b>{bossPhase ? (weakness > 0 ? `×${hud.boss.damageMultiplier || 2} CORE` : `${Math.ceil(hud.boss.hp)} HP`) : `${hud?.enemiesRemaining ?? 1000} LEFT`}</b>
      </div>
      <div className="progress-bar"><i style={{ width: `${(bossPhase ? bossRatio : swarmRatio) * 100}%` }} /><span /></div>
      <div className="progress-meta">
        <span>{bossPhase ? (hud.boss.transforming ? `⚠ EVOLUTION LOCK · ${hud.boss.transformTimer.toFixed(1)}s` : hud.boss.pattern ? `PATTERN · ${String(hud.boss.pattern).toUpperCase()}` : `ENRAGE ×${Number(hud.boss.enrage || 1).toFixed(1)}`) : `${hud?.kills || 0} / ${hud?.totalEnemies || 1000} PURGED`}</span>
        <span>{bossPhase
          ? (weakness > 0 ? `CORE EXPOSED ${weakness.toFixed(1)}s` : "DODGE TELEGRAPHS")
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
  const entries = [
    ["squadRecall", "4-FRONT RECALL"],
    ["chain", "ARC CASCADE"],
    ["nova", "ZERO NOVA"],
    ["airstrike", "SKYFALL"],
    ["omegaLaser", "Ω LASER"],
  ].filter(([id]) => Number(abilities?.[id]?.rank) > 0);
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

function RewardArtwork({ option, assets }) {
  const id = String(option?.id || "");
  const source = id.includes("drone") ? assets?.drone
    : id.includes("sentry") ? assets?.sentry
      : id.includes("suppress") ? assets?.emp
        : null;
  if (source) return <img src={source.src} alt="" />;
  if (option?.category === "weapon") return <Target weight="fill" />;
  if (id.includes("shield") || id.includes("regen")) return <ShieldChevron weight="fill" />;
  return <Lightning weight="fill" />;
}

function LevelUpOverlay({ offer, level, assets, rewardState, onChoose }) {
  const firstOptionRef = useRef(null);
  const modalRef = useRef(null);
  const offerKey = offer?.map((option) => option.id).join("|") || "";
  useEffect(() => {
    if (!offerKey) return undefined;
    const previouslyFocused = document.activeElement;
    const frame = requestAnimationFrame(() => firstOptionRef.current?.focus());
    const trapFocus = (event) => {
      if (event.key !== "Tab") return;
      const buttons = modalRef.current?.querySelectorAll("button:not([disabled])");
      if (!buttons?.length) return;
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {
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
      <section className="reward-modal" ref={modalRef} key={offerKey}>
        <div className="reward-kicker"><Sparkle weight="fill" /> NEURAL LOADOUT EVOLUTION · LV.{level}</div>
        <h2 id="reward-title">CHOOSE YOUR OVERLOAD</h2>
        <p>전투는 일시 정지되었습니다. 세 선택지는 동일한 전투 가치로 조정됩니다.</p>
        {queuedRewards > 1 && <div className="reward-queue-status"><Timer weight="bold" /> 축적된 레벨업 {queuedRewards}회를 이번 선택 1회로 압축했습니다.</div>}
        <div className="reward-options">
          {offer.map((option, index) => {
            const meta = CATEGORY_META[option.category] || CATEGORY_META.skill;
            return (
              <button ref={index === 0 ? firstOptionRef : null} className={`reward-card is-${meta.color}`} key={option.id} type="button" onClick={() => onChoose(option.id)}>
                <span className="reward-index">0{index + 1}</span>
                <div className="reward-art"><RewardArtwork option={option} assets={assets} /></div>
                <small>{meta.label} · {meta.korean}</small>
                <strong>{option.name}</strong>
                <p>{REWARD_COPY[option.id] || option.description}</p>
                <div><span>{option.mastery ? `RANK ${option.level} → MASTER` : option.level ? `RANK ${option.level} → ${option.nextLevel || option.level + 1}` : "INSTALL NEW"}</span><b>SELECT <ArrowRight /></b></div>
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
      let copy = EVENT_BANNERS[event.type];
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

  const touchRecall = useCallback((event) => {
    event?.preventDefault();
    if (inputRef.current) inputRef.current.supportPressed = true;
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
            <div className="combat-help"><span><kbd>WASD</kbd> MOVE</span><span><kbd>SPACE</kbd> PHASE DASH</span><span><kbd>F</kbd> 4-FRONT RECALL</span><span><kbd>MOUSE</kbd> AIM</span><b><Pulse weight="fill" /> AUTO FIRE</b></div>
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
            <button className="touch-recall" type="button" aria-label="4구역 동료 호출" onPointerDown={touchRecall}><Sparkle weight="fill" /> RECALL</button>
            <button className="touch-dash" type="button" aria-label="무적 대시" onPointerDown={touchDash}><Lightning weight="fill" /> DASH</button>
          </div>
        </div>
      </section>

      <LevelUpOverlay offer={hud?.rewards?.options} level={hud?.level || 1} assets={assets} rewardState={hud?.rewards} onChoose={selectReward} />
    </main>
  );
}

function ResultScreen({ result, assets, onRestart }) {
  const victory = result?.status === "victory" || result?.phase === "victory";
  const accuracy = result?.stats?.shots ? Math.round((result.stats.hits || 0) / result.stats.shots * 100) : 0;
  return (
    <main className={victory ? "overload-result is-victory" : "overload-result is-defeat"}>
      <div className="ambient-grid" aria-hidden="true" />
      {assets?.map && <img className="result-map" src={assets.map.src} alt="" />}
      <section className="result-card">
        <div className="result-emblem">{victory ? <Trophy weight="fill" /> : <Warning weight="fill" />}</div>
        <div className="result-kicker">{victory ? "THE WRONG ENGINE TERMINATED" : "OVERLOAD SIGNAL LOST"}</div>
        <h1>{victory ? "SWARM: ERASED" : "THE SWARM ADAPTED"}</h1>
        <p>{victory ? "1,000기의 공세를 오버드라이브 화력으로 돌파하고 3단계 최종 엔진까지 파괴했습니다." : "다음 런에서는 이동 경로와 3지선다 빌드를 바꿔보세요."}</p>
        {(assets?.bossPhase3 || assets?.boss) && <img className="result-boss" src={(assets.bossPhase3 || assets.boss).src} alt="The Wrong Engine 최종 광폭화 형상" />}
        <div className="result-stats">
          <span><small>HOSTILES PURGED</small><b>{result?.kills || result?.stats?.kills || 0}</b></span>
          <span><small>FINAL LEVEL</small><b>LV.{result?.level || 1}</b></span>
          <span><small>SHOT ACCURACY</small><b>{accuracy}%</b></span>
          <span><small>RUN TIME</small><b>{formatTime(result?.time || 0)}</b></span>
        </div>
        <button className="primary-cta" type="button" onClick={onRestart}><span>새 빌드로 재도전</span><ArrowCounterClockwise weight="bold" /></button>
      </section>
    </main>
  );
}

export function App() {
  const { assets, error: assetError } = useGameAssets();
  const [screen, setScreen] = useState("intro");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [result, setResult] = useState(null);
  const bgmRef = useRef(null);
  const sfx = useMemo(() => createSfxEngine(), []);

  useEffect(() => () => {
    bgmRef.current?.pause();
    sfx.dispose();
  }, [sfx]);
  useEffect(() => sfx.setEnabled(soundEnabled), [sfx, soundEnabled]);
  useEffect(() => {
    if (bgmRef.current) bgmRef.current.muted = !soundEnabled;
  }, [soundEnabled]);

  const start = useCallback(() => {
    sfx.start();
    sfx.play("start");
    const bgm = bgmRef.current;
    if (bgm) {
      bgm.currentTime = 0;
      bgm.volume = 0.38;
      bgm.muted = !soundEnabled;
      bgm.play().catch(() => {
        // Browsers may still decline playback if the initiating gesture is lost.
      });
    }
    setResult(null);
    setScreen("game");
  }, [sfx, soundEnabled]);

  const finish = useCallback((nextResult) => {
    const bgm = bgmRef.current;
    if (bgm) {
      bgm.pause();
      bgm.currentTime = 0;
    }
    setResult(nextResult);
    setScreen("result");
  }, []);

  const toggleSound = useCallback(() => setSoundEnabled((enabled) => !enabled), []);

  let content;
  if (screen === "game") content = <ArenaScreen assets={assets} soundEnabled={soundEnabled} sfx={sfx} onToggleSound={toggleSound} onFinish={finish} />;
  else if (screen === "result") content = <ResultScreen result={result} assets={assets} onRestart={start} />;
  else content = <IntroScreen assets={assets} assetError={assetError} onStart={start} />;

  return (
    <>
      {content}
      <audio ref={bgmRef} src={BGM_PATH} loop preload="auto" hidden aria-hidden="true" />
    </>
  );
}
