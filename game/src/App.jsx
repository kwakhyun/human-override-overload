import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowsOutLineHorizontal,
  Atom,
  Brain,
  Broadcast,
  Check,
  Crosshair,
  Drone,
  Heartbeat,
  Lightning,
  Magnet,
  Play,
  ShieldChevron,
  SpeakerHigh,
  SpeakerSlash,
  Timer,
  Trophy,
  Warning,
  WaveSine,
  Wind,
} from "@phosphor-icons/react";
import { createSfxEngine } from "./audio/sfx.js";
import {
  applyUpgrade,
  clearPressedInput,
  createGameState,
  createInputState,
  drainEvents,
  stepGame,
} from "./survivor/engine.js";
import { formatTime, GAME_HEIGHT, GAME_WIDTH, UPGRADES } from "./survivor/data.js";
import { renderGame } from "./survivor/renderer.js";

const ICONS = {
  Crosshair,
  ArrowsOutLineHorizontal,
  ArrowRight,
  Lightning,
  WaveSine,
  Atom,
  Drone,
  ShieldChevron,
  Wind,
  Magnet,
  Heartbeat,
  Broadcast,
};

const EVENT_SOUNDS = {
  playerShot: "shoot",
  enemyShot: "enemyShot",
  enemyHit: "enemyHit",
  enemyKilled: "kill",
  playerHit: "playerHit",
  dash: "dash",
  levelUp: "reward",
  upgradeApplied: "upgrade",
  counter: "counter",
  build: "build",
  buildDenied: "denied",
  towerShot: "towerShot",
  empPulse: "emp",
  arc: "arc",
  towerHacked: "hacked",
  bossSpawn: "boss",
  victory: "victory",
  defeat: "capture",
};

const ASSET_PATHS = {
  arena: "./assets/survivor/adaptive-arena.png",
  player: "./assets/survivor/player.png",
  hunter: "./assets/survivor/hunter.png",
  suppressor: "./assets/survivor/suppressor.png",
  brute: "./assets/survivor/brute.png",
};

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}

function useGameAssets() {
  const [assets, setAssets] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all(Object.entries(ASSET_PATHS).map(async ([key, source]) => [key, await loadImage(source)]))
      .then((entries) => {
        if (!cancelled) setAssets(Object.fromEntries(entries));
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { assets, error };
}

function buildHud(state) {
  const damage = state.runStats.damage;
  const damageTotal = Object.values(damage).reduce((sum, value) => sum + value, 0) || 1;
  const boss = state.enemies.find((enemy) => enemy.boss);
  return {
    timeLeft: state.timeLeft,
    hp: state.player.hp,
    maxHp: state.player.maxHp,
    xp: state.player.xp,
    xpNext: state.player.xpNext,
    level: state.player.level,
    kills: state.player.kills,
    score: state.player.score,
    scrap: state.player.scrap,
    wave: state.wave,
    enemyCount: state.enemies.length,
    dash: 1 - state.player.dashCooldown / state.player.stats.dashCooldown,
    counter: state.counter,
    counterFlash: state.counterFlash,
    upgrades: { ...state.player.upgrades },
    towers: state.towers.length,
    sentries: state.towers.filter((tower) => tower.kind === "sentry").length,
    pylons: state.towers.filter((tower) => tower.kind === "emp").length,
    damageMix: {
      ballistic: damage.ballistic / damageTotal,
      arc: damage.arc / damageTotal,
      orbit: damage.orbit / damageTotal,
      tower: damage.tower / damageTotal,
    },
    boss: boss ? { hp: boss.hp, maxHp: boss.maxHp } : null,
    status: state.status,
  };
}

function IntroScreen({ assetsReady, assetError, onStart }) {
  return (
    <main className="intro-shell">
      <div className="intro-arena" aria-hidden="true" />
      <div className="intro-noise" aria-hidden="true" />
      <section className="intro-content" aria-labelledby="game-title">
        <div className="eyebrow"><span /> AI-ADAPTIVE COMBAT SIMULATION</div>
        <h1 id="game-title">TRAIN ME <em>WRONG</em></h1>
        <p className="intro-lead">
          강해질수록, 적도 당신에게 맞춰 진화한다.
          하나의 빌드에 안주하지 말고 AI의 확신을 역이용하세요.
        </p>

        <div className="intro-loop" aria-label="게임 핵심 진행">
          <article>
            <span className="loop-number">01</span>
            <Crosshair weight="duotone" />
            <div><strong>BUILD</strong><p>처치하고 데이터로 무기를 증폭</p></div>
          </article>
          <ArrowRight className="loop-arrow" weight="bold" />
          <article>
            <span className="loop-number">02</span>
            <Brain weight="duotone" />
            <div><strong>ADAPT</strong><p>AI가 피해원과 움직임을 분석</p></div>
          </article>
          <ArrowRight className="loop-arrow" weight="bold" />
          <article className="danger-step">
            <span className="loop-number">03</span>
            <Warning weight="duotone" />
            <div><strong>BREAK</strong><p>카운터 웨이브가 오기 전에 전략 전환</p></div>
          </article>
        </div>

        <div className="intro-actions">
          <button type="button" className="primary-cta" onClick={onStart} disabled={!assetsReady}>
            <Play weight="fill" />
            {assetError ? "에셋 로딩 실패" : assetsReady ? "훈련 프로토콜 시작" : "전투 시뮬레이션 로딩 중"}
          </button>
          <div className="run-spec">
            <Timer weight="duotone" />
            <span><strong>05:00</strong> ONE COMPLETE RUN</span>
          </div>
        </div>

        <div className="control-primer">
          <span><kbd>WASD</kbd> 이동</span>
          <span><kbd>SPACE</kbd> 위상 대시</span>
          <span><kbd>Q</kbd> 센트리 · 18</span>
          <span><kbd>E</kbd> EMP 파일런 · 28</span>
          <span className="auto-fire"><Crosshair weight="bold" /> 무기는 자동 조준·사격</span>
        </div>
      </section>
      <aside className="intro-telemetry" aria-label="AI 훈련 상태">
        <span>MODEL / UNTRAINED</span>
        <i />
        <span>COUNTERS / 04</span>
        <i />
        <span>RUN / LOCAL</span>
      </aside>
    </main>
  );
}

function Meter({ value, max, className = "", label, display }) {
  const amount = Math.max(0, Math.min(100, value / Math.max(1, max) * 100));
  return (
    <div className={`hud-meter ${className}`}>
      <div className="meter-label"><span>{label}</span><strong>{display}</strong></div>
      <div className="meter-track"><i style={{ width: `${amount}%` }} /></div>
    </div>
  );
}

function DamageBar({ label, value, tone }) {
  return (
    <div className="damage-row">
      <span>{label}</span>
      <div><i className={tone} style={{ width: `${Math.max(2, value * 100)}%` }} /></div>
      <strong>{Math.round(value * 100)}%</strong>
    </div>
  );
}

function UpgradeList({ hud }) {
  const active = UPGRADES.filter((upgrade) => hud.upgrades[upgrade.id] > 0);
  return (
    <aside className="upgrade-stack hud-glass">
      <header><span>ACTIVE BUILD</span><strong>LV.{hud.level}</strong></header>
      <div className="upgrade-items">
        {active.length ? active.slice(-6).map((upgrade) => {
          const Icon = ICONS[upgrade.icon] || Lightning;
          return (
            <div className="upgrade-chip" key={upgrade.id}>
              <Icon weight="duotone" />
              <span>{upgrade.name}</span>
              <strong>{hud.upgrades[upgrade.id]}</strong>
            </div>
          );
        }) : (
          <div className="empty-build"><Brain weight="duotone" /><span>빌드 데이터 없음<br />첫 레벨업을 기다리는 중</span></div>
        )}
      </div>
      <footer><span>KILLS</span><strong>{String(hud.kills).padStart(3, "0")}</strong><span>SCORE</span><strong>{hud.score.toLocaleString()}</strong></footer>
    </aside>
  );
}

function AiPanel({ hud }) {
  return (
    <aside className={`ai-panel hud-glass protocol-${hud.counter.id}`}>
      <header>
        <span><Brain weight="fill" /> ENEMY MODEL</span>
        <i className={hud.counter.id === "sampling" ? "learning" : "locked"}>{hud.counter.id === "sampling" ? "LEARNING" : "LOCKED"}</i>
      </header>
      <div className="protocol-name" style={{ "--protocol": hud.counter.color }}>
        <small>CURRENT COUNTER</small>
        <strong>{hud.counter.name}</strong>
        <p>{hud.counter.short}</p>
      </div>
      <div className="damage-profile">
        <div className="profile-label"><span>OBSERVED DAMAGE MIX</span><span>LIVE</span></div>
        <DamageBar label="PULSE" value={hud.damageMix.ballistic} tone="cyan" />
        <DamageBar label="ARC" value={hud.damageMix.arc} tone="violet" />
        <DamageBar label="BLADES" value={hud.damageMix.orbit} tone="red" />
        <DamageBar label="TOWERS" value={hud.damageMix.tower} tone="amber" />
      </div>
      <p className="protocol-detail">{hud.counter.detail}</p>
    </aside>
  );
}

function CounterBanner({ hud }) {
  if (hud.counterFlash <= 0) return null;
  return (
    <div className="counter-banner" style={{ "--protocol": hud.counter.color }}>
      <Warning weight="fill" />
      <div><span>AI COUNTER-PROTOCOL DEPLOYED</span><strong>{hud.counter.name}</strong></div>
      <p>{hud.counter.short}</p>
    </div>
  );
}

function UpgradeOverlay({ choices, hud, onChoose }) {
  if (!choices.length) return null;
  return (
    <div className="modal-backdrop upgrade-backdrop">
      <section className="upgrade-modal" aria-labelledby="upgrade-title">
        <div className="level-orbit"><Lightning weight="fill" /><span>LV.{hud.level}</span></div>
        <div className="modal-kicker">COUNTER YOUR COUNTER</div>
        <h2 id="upgrade-title">전투 프로토콜을 선택하세요</h2>
        <p>시간이 정지했습니다. 현재 AI 대응을 읽고 빌드의 방향을 바꾸세요.</p>
        <div className="choice-grid">
          {choices.map((upgrade, index) => {
            const Icon = ICONS[upgrade.icon] || Lightning;
            const nextLevel = (hud.upgrades[upgrade.id] || 0) + 1;
            return (
              <button type="button" key={upgrade.id} onClick={() => onChoose(upgrade.id)}>
                <span className="choice-index">0{index + 1}</span>
                <Icon weight="duotone" />
                <small>{upgrade.tag} / LV.{nextLevel}</small>
                <strong>{upgrade.name}</strong>
                <p>{upgrade.description}</p>
                <i>SELECT <ArrowRight weight="bold" /></i>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function BossBar({ boss }) {
  if (!boss) return null;
  const amount = Math.max(0, boss.hp / boss.maxHp * 100);
  return (
    <div className="boss-bar">
      <span>FINAL EXAM</span>
      <strong>THE INSTRUCTOR</strong>
      <div><i style={{ width: `${amount}%` }} /></div>
      <b>{Math.ceil(amount)}%</b>
    </div>
  );
}

function GameHud({ hud, audioEnabled, onToggleAudio }) {
  return (
    <>
      <header className="top-hud">
        <div className="micro-brand"><Brain weight="fill" /><span>TRAIN ME <b>WRONG</b></span></div>
        <Meter label="INTEGRITY" value={hud.hp} max={hud.maxHp} display={`${Math.ceil(hud.hp)} / ${hud.maxHp}`} className="health-meter" />
        <Meter label={`LEVEL ${hud.level} / DATA`} value={hud.xp} max={hud.xpNext} display={`${Math.floor(hud.xp)} / ${hud.xpNext}`} className="xp-meter" />
        <div className="wave-readout"><small>WAVE</small><strong>{String(hud.wave).padStart(2, "0")}</strong><span>{hud.enemyCount} HOSTILES</span></div>
        <div className="timer-readout"><Timer weight="duotone" /><div><small>CYCLE REMAINING</small><strong>{formatTime(hud.timeLeft)}</strong></div></div>
        <button type="button" className="audio-toggle" aria-label={audioEnabled ? "효과음 끄기" : "효과음 켜기"} onClick={onToggleAudio}>
          {audioEnabled ? <SpeakerHigh weight="fill" /> : <SpeakerSlash weight="fill" />}
        </button>
      </header>
      <UpgradeList hud={hud} />
      <AiPanel hud={hud} />
      <BossBar boss={hud.boss} />
      <CounterBanner hud={hud} />
      <footer className="bottom-hud">
        <div className="ability-slot dash-slot"><kbd>SPACE</kbd><span>PHASE DASH</span><i style={{ "--charge": `${Math.max(0, hud.dash) * 100}%` }} /></div>
        <div className={`ability-slot ${hud.scrap < 18 || hud.sentries >= 4 ? "disabled" : ""}`}><kbd>Q</kbd><span>SENTRY <b>{hud.sentries}/4</b></span><small>18 DATA</small></div>
        <div className={`ability-slot ${hud.scrap < 28 || hud.pylons >= 2 ? "disabled" : ""}`}><kbd>E</kbd><span>EMP PYLON <b>{hud.pylons}/2</b></span><small>28 DATA</small></div>
        <div className="scrap-readout"><span>BUILD DATA</span><strong>{Math.floor(hud.scrap)}</strong></div>
      </footer>
    </>
  );
}

function ResultScreen({ result, onRestart }) {
  const victory = result.status === "victory";
  const damage = result.runStats.damage;
  const dominant = Object.entries(damage).sort((a, b) => b[1] - a[1])[0]?.[0] || "ballistic";
  return (
    <main className={`result-shell ${victory ? "victory" : "defeat"}`}>
      <div className="result-arena" aria-hidden="true" />
      <section className="result-card">
        <div className="result-emblem">{victory ? <Trophy weight="duotone" /> : <Warning weight="duotone" />}</div>
        <div className="eyebrow"><span /> {victory ? "TRAINING MODEL DEFEATED" : "TRAINING SUBJECT TERMINATED"}</div>
        <h1>{victory ? "YOU TRAINED IT WRONG" : "THE MODEL LEARNED YOU"}</h1>
        <p>{victory ? "카운터에 맞춰 빌드를 바꾸며 최종 교관을 파괴했습니다." : "같은 전략을 반복했습니다. 다음 런에는 AI가 확신하기 전에 방향을 바꾸세요."}</p>
        <div className="result-grid">
          <div><span>SURVIVAL</span><strong>{formatTime(result.time)}</strong></div>
          <div><span>ELIMINATIONS</span><strong>{result.player.kills}</strong></div>
          <div><span>FINAL SCORE</span><strong>{result.player.score.toLocaleString()}</strong></div>
          <div><span>PEAK WAVE</span><strong>{result.runStats.highestWave}</strong></div>
        </div>
        <div className="result-analysis">
          <Brain weight="fill" />
          <div><small>AI FINAL READ</small><strong>DOMINANT SOURCE / {dominant.toUpperCase()}</strong><p>{result.runStats.counters.length}개의 카운터 프로토콜이 배치되었습니다.</p></div>
        </div>
        <button type="button" className="primary-cta" onClick={onRestart}><Play weight="fill" /> 새 모델로 재훈련</button>
      </section>
    </main>
  );
}

function GameScreen({ assets, audioEnabled, onToggleAudio, onFinish }) {
  const canvasRef = useRef(null);
  const gameRef = useRef(createGameState());
  const inputRef = useRef(createInputState());
  const sfxRef = useRef(null);
  const [hud, setHud] = useState(() => buildHud(gameRef.current));
  const [choices, setChoices] = useState([]);

  if (!sfxRef.current) sfxRef.current = createSfxEngine();
  sfxRef.current.setEnabled(audioEnabled);

  useEffect(() => {
    const input = inputRef.current;
    const handleKey = (event, down) => {
      if (["KeyW", "KeyA", "KeyS", "KeyD", "Space", "KeyQ", "KeyE"].includes(event.code)) event.preventDefault();
      if (event.code === "KeyW" || event.code === "ArrowUp") input.up = down;
      if (event.code === "KeyS" || event.code === "ArrowDown") input.down = down;
      if (event.code === "KeyA" || event.code === "ArrowLeft") input.left = down;
      if (event.code === "KeyD" || event.code === "ArrowRight") input.right = down;
      if (down && !event.repeat && event.code === "Space") input.dashPressed = true;
      if (down && !event.repeat && event.code === "KeyQ") input.deploySentryPressed = true;
      if (down && !event.repeat && event.code === "KeyE") input.deployEmpPressed = true;
    };
    const down = (event) => handleKey(event, true);
    const up = (event) => handleKey(event, false);
    window.addEventListener("keydown", down, { passive: false });
    window.addEventListener("keyup", up, { passive: false });
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pixelRatio = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(GAME_WIDTH * pixelRatio);
    canvas.height = Math.round(GAME_HEIGHT * pixelRatio);
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    let frame = 0;
    let last = performance.now();
    let lastHud = 0;
    let finishTimer = null;
    sfxRef.current.start();
    sfxRef.current.play("start");

    const loop = (now) => {
      const state = gameRef.current;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      stepGame(state, inputRef.current, dt);
      clearPressedInput(inputRef.current);
      for (const event of drainEvents(state)) {
        const sound = EVENT_SOUNDS[event.type];
        if (sound && !(event.type === "enemyHit" && Math.random() > 0.3) && !(event.type === "enemyKilled" && Math.random() > 0.45)) sfxRef.current.play(sound);
        if (event.type === "levelUp") setChoices(event.choices);
        if ((event.type === "victory" || event.type === "defeat") && !finishTimer) {
          finishTimer = window.setTimeout(() => onFinish(state), 850);
        }
      }
      renderGame(ctx, state, assets);
      if (now - lastHud > 70) {
        setHud(buildHud(state));
        lastHud = now;
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      if (finishTimer) window.clearTimeout(finishTimer);
    };
  }, [assets, onFinish]);

  const chooseUpgrade = (id) => {
    applyUpgrade(gameRef.current, id);
    setChoices([]);
    setHud(buildHud(gameRef.current));
  };

  return (
    <main className="game-shell">
      <canvas ref={canvasRef} width={GAME_WIDTH} height={GAME_HEIGHT} aria-label="TRAIN ME WRONG AI 적응형 전투 경기장" />
      <GameHud hud={hud} audioEnabled={audioEnabled} onToggleAudio={onToggleAudio} />
      <UpgradeOverlay choices={choices} hud={hud} onChoose={chooseUpgrade} />
    </main>
  );
}

export function App() {
  const { assets, error } = useGameAssets();
  const [screen, setScreen] = useState("intro");
  const [result, setResult] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);

  const start = useCallback(() => {
    if (!assets) return;
    setResult(null);
    setScreen("game");
  }, [assets]);

  const finish = useCallback((state) => {
    setResult(state);
    setScreen("result");
  }, []);

  const toggleAudio = useCallback(() => setAudioEnabled((enabled) => !enabled), []);
  const content = useMemo(() => {
    if (screen === "game" && assets) return <GameScreen assets={assets} audioEnabled={audioEnabled} onToggleAudio={toggleAudio} onFinish={finish} />;
    if (screen === "result" && result) return <ResultScreen result={result} onRestart={start} />;
    return <IntroScreen assetsReady={Boolean(assets)} assetError={error} onStart={start} />;
  }, [assets, audioEnabled, error, finish, result, screen, start, toggleAudio]);

  return content;
}
