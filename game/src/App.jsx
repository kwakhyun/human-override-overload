import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowCounterClockwise,
  ArrowLeft,
  Brain,
  Broadcast,
  CaretRight,
  Check,
  Coins,
  Crosshair,
  Drone,
  FirstAid,
  Heartbeat,
  Lightning,
  Pause,
  Play,
  ShieldCheck,
  ShieldChevron,
  ShoppingCart,
  SpeakerHigh,
  SpeakerSlash,
  Strategy,
  Timer,
  Trophy,
  UsersThree,
  Warning,
  WaveSine,
} from "@phosphor-icons/react";
import { createSfxEngine } from "./audio/sfx.js";
import {
  clearPressedInput,
  createGameState,
  createInputState,
  drainEvents,
  purchaseShopItem,
  returnToOverview,
  selectControlledZone,
  stepGame,
} from "./survivor/engine.js";
import {
  formatTime,
  GAME_HEIGHT,
  GAME_WIDTH,
  getShopItemCost,
  SHOP_ITEMS,
} from "./survivor/data.js";
import { renderGame } from "./survivor/renderer.js";

const ICONS = {
  Broadcast,
  Crosshair,
  Drone,
  FirstAid,
  Heartbeat,
  Lightning,
  ShieldCheck,
  ShieldChevron,
  UsersThree,
  WaveSine,
};

const EVENT_SOUNDS = {
  playerShot: "shoot",
  enemyShot: "enemyShot",
  enemyHit: "enemyHit",
  enemyKilled: "kill",
  goldEarned: "collect",
  playerHit: "playerHit",
  dash: "dash",
  purchase: "upgrade",
  purchaseDenied: "denied",
  build: "build",
  buildDenied: "denied",
  towerShot: "towerShot",
  empPulse: "emp",
  arc: "arc",
  zoneFall: "counter",
  invasion: "boss",
  bossSpawn: "boss",
  focus: "reward",
  victory: "victory",
  defeat: "capture",
};

const ASSET_PATHS = {
  player: "./assets/survivor/player.png",
  hunter: "./assets/survivor/hunter.png",
  suppressor: "./assets/survivor/suppressor.png",
  brute: "./assets/survivor/brute.png",
  sentry: "./assets/survivor/skills/sentry.png",
  emp: "./assets/survivor/skills/emp-pylon.png",
  drone: "./assets/survivor/skills/wingman-drone.png",
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
  const zones = state.zones.map((zone) => {
    const hero = state.heroes[zone.id];
    const threats = state.enemies.filter((enemy) => !enemy.dead && enemy.targetZoneId === zone.id).length;
    return {
      id: zone.id,
      code: zone.code,
      name: zone.name,
      korean: zone.korean,
      accent: zone.accent,
      status: zone.status,
      pressure: zone.pressure,
      invasionLevel: zone.invasionLevel,
      threats,
      hero: {
        name: hero.name,
        role: hero.role,
        hp: hero.hp,
        maxHp: hero.maxHp,
        shield: hero.shield,
        kills: hero.kills,
        dead: hero.dead,
        color: hero.color,
        upgrades: { ...hero.upgrades },
        damage: hero.stats.damage,
        fireInterval: hero.stats.fireInterval,
        regen: hero.stats.regen,
        sentryCooldown: hero.sentryCooldown,
        empCooldown: hero.empCooldown,
        dashCooldown: hero.dashCooldown,
      },
    };
  });
  const selected = Number.isInteger(state.controlledZoneId) ? zones[state.controlledZoneId] : null;
  return {
    status: state.status,
    time: state.time,
    timeLeft: state.timeLeft,
    wave: state.wave,
    gold: state.gold,
    controlledZoneId: state.controlledZoneId,
    zones,
    selected,
    alive: zones.filter((zone) => zone.status === "active").length,
    enemies: state.enemies.length,
    runStats: { ...state.runStats },
    invasionFlash: state.invasionFlash,
  };
}

function IntroScreen({ assetsReady, assetError, onStart }) {
  const sectors = [
    ["01", "CRYO RELAY", "AEGIS / 돌격"],
    ["02", "EMBER FORGE", "ROOK / 화력"],
    ["03", "NEON ARCHIVE", "NYX / 전격"],
    ["04", "VERDANT VAULT", "MOSS / 생존"],
  ];
  return (
    <main className="intro-shell">
      <div className="intro-grid" aria-hidden="true">
        {sectors.map(([number], index) => <i key={number} className={`sector-light sector-${index + 1}`} />)}
      </div>
      <section className="intro-copy" aria-labelledby="game-title">
        <div className="eyebrow"><span /> MULTI-FRONT SURVIVAL COMMAND</div>
        <h1 id="game-title">TRAIN ME <em>WRONG</em></h1>
        <p className="intro-lead">
          네 전선, 네 영웅, 하나의 자금망.<br />
          <b>한 곳은 직접 지휘하고 나머지는 AI에게 맡기세요.</b>
        </p>
        <div className="sector-preview" aria-label="방어 구역 목록">
          {sectors.map(([number, name, hero], index) => (
            <article key={name} style={{ "--sector": index }}>
              <span>{number}</span>
              <div><strong>{name}</strong><small>{hero}</small></div>
            </article>
          ))}
        </div>
        <div className="intro-actions">
          <button type="button" className="primary-cta" onClick={onStart} disabled={!assetsReady}>
            <Play weight="fill" />
            {assetError ? "에셋 로딩 실패" : assetsReady ? "4개 전선 가동" : "전술 자산 로딩 중"}
          </button>
          <div className="run-spec"><Timer weight="duotone" /><span><strong>05:00</strong> SHARED GOLD RUN</span></div>
        </div>
        <div className="control-primer">
          <span><kbd>1–4</kbd> 전선 선택</span>
          <span><kbd>WASD</kbd> 직접 이동</span>
          <span><kbd>SPACE</kbd> 대시</span>
          <span><kbd>Q / E</kbd> 설치 스킬</span>
          <span><kbd>TAB</kbd> 전체 상황판</span>
          <span><kbd>B</kbd> 전술 상점</span>
        </div>
      </section>
      <aside className="intro-doctrine">
        <Brain weight="fill" />
        <span>COMMAND DOCTRINE</span>
        <p>한 전선이 무너지면 그곳의 적은 멈추지 않습니다. 살아남은 구역으로 이동해 침공 레벨을 높입니다.</p>
      </aside>
    </main>
  );
}

function ZoneCard({ zone, selected, onSelect }) {
  const hp = Math.max(0, zone.hero.hp / Math.max(1, zone.hero.maxHp) * 100);
  const pressure = Math.round(zone.pressure * 100);
  return (
    <button
      type="button"
      className={`zone-card ${selected ? "selected" : ""} ${zone.status === "fallen" ? "fallen" : ""}`}
      style={{ "--zone-accent": zone.accent }}
      onClick={() => zone.status === "active" && onSelect(zone.id)}
      disabled={zone.status === "fallen"}
      aria-label={`${zone.korean} ${zone.status === "fallen" ? "함락" : "선택"}`}
    >
      <span className="zone-index">0{zone.id + 1}</span>
      <div className="zone-card-main">
        <strong>{zone.name}</strong>
        <small>{zone.status === "fallen" ? "SECTOR BREACHED" : `${zone.hero.name} · ${selected ? "MANUAL" : "AI"}`}</small>
        <div className="micro-bars">
          <i><b style={{ width: `${hp}%` }} /></i>
          <i className="pressure"><b style={{ width: `${pressure}%` }} /></i>
        </div>
      </div>
      <div className="zone-threat">
        <small>HOSTILES</small>
        <b>{String(zone.threats).padStart(2, "0")}</b>
      </div>
      {zone.invasionLevel > 0 && zone.status === "active" ? <em>INVASION +{zone.invasionLevel}</em> : null}
    </button>
  );
}

function CommandHud({ hud, audioEnabled, shopOpen, onToggleAudio, onSelectZone, onOverview, onToggleShop }) {
  const focused = hud.selected;
  return (
    <>
      <header className="command-header">
        <div className="command-brand"><Brain weight="fill" /><span>TRAIN ME <b>WRONG</b></span></div>
        <div className="shared-gold"><Coins weight="fill" /><div><small>SHARED WAR CHEST</small><strong>{Math.floor(hud.gold).toLocaleString()} G</strong></div></div>
        <div className="front-status"><small>FRONTS ONLINE</small><strong>{hud.alive}<i>/4</i></strong><span>{hud.enemies} HOSTILES</span></div>
        <div className="wave-status"><small>ASSAULT WAVE</small><strong>{String(hud.wave).padStart(2, "0")}</strong></div>
        <div className="run-timer"><Timer weight="duotone" /><div><small>EXTRACTION IN</small><strong>{formatTime(hud.timeLeft)}</strong></div></div>
        <button type="button" className="icon-button" onClick={onToggleAudio} aria-label={audioEnabled ? "효과음 끄기" : "효과음 켜기"}>
          {audioEnabled ? <SpeakerHigh weight="fill" /> : <SpeakerSlash weight="fill" />}
        </button>
      </header>

      <nav className="zone-deck" aria-label="전선 선택">
        {hud.zones.map((zone) => (
          <ZoneCard key={zone.id} zone={zone} selected={hud.controlledZoneId === zone.id} onSelect={onSelectZone} />
        ))}
      </nav>

      <div className="view-actions">
        {focused ? (
          <button type="button" onClick={onOverview}><ArrowLeft /> 전체 전선 <kbd>TAB</kbd></button>
        ) : (
          <div className="overview-callout"><Strategy weight="duotone" /><span>전선을 클릭하거나 <kbd>1–4</kbd>를 눌러 직접 지휘</span></div>
        )}
        <button type="button" className={`shop-toggle ${shopOpen ? "active" : ""}`} onClick={onToggleShop} disabled={!focused}>
          <ShoppingCart weight="duotone" /> 전술 상점 <kbd>B</kbd>
        </button>
      </div>

      {focused ? <HeroReadout zone={focused} /> : null}
      {hud.invasionFlash > 0 ? (
        <div className="invasion-banner"><Warning weight="fill" /><div><span>FRONT COLLAPSED</span><strong>적 병력이 생존 구역으로 침공합니다</strong></div></div>
      ) : null}
    </>
  );
}

function HeroReadout({ zone }) {
  const hero = zone.hero;
  const hp = Math.max(0, hero.hp / Math.max(1, hero.maxHp) * 100);
  return (
    <aside className="hero-readout" style={{ "--zone-accent": zone.accent }}>
      <header><span>MANUAL LINK / 0{zone.id + 1}</span><i>LIVE</i></header>
      <div className="hero-name"><small>{hero.role}</small><strong>{hero.name}</strong><em>{zone.korean}</em></div>
      <div className="hero-health"><span>INTEGRITY</span><strong>{Math.ceil(hero.hp)} / {hero.maxHp}</strong><i><b style={{ width: `${hp}%` }} /></i></div>
      {hero.shield > 0 ? <div className="shield-line"><ShieldCheck weight="fill" /> BARRIER {Math.ceil(hero.shield)}</div> : null}
      <dl>
        <div><dt>DMG</dt><dd>{Math.round(hero.damage)}</dd></div>
        <div><dt>RATE</dt><dd>{(1 / hero.fireInterval).toFixed(1)}/s</dd></div>
        <div><dt>REGEN</dt><dd>{hero.regen.toFixed(1)}</dd></div>
        <div><dt>KILLS</dt><dd>{hero.kills}</dd></div>
      </dl>
      <footer>
        <span className={!hero.upgrades.sentry ? "locked" : ""}><kbd>Q</kbd> SENTRY {hero.upgrades.sentry ? `LV.${hero.upgrades.sentry}` : "LOCK"}</span>
        <span className={!hero.upgrades.emp ? "locked" : ""}><kbd>E</kbd> EMP {hero.upgrades.emp ? `LV.${hero.upgrades.emp}` : "LOCK"}</span>
      </footer>
    </aside>
  );
}

function ShopDrawer({ hud, onBuy, onClose }) {
  const zone = hud.selected;
  if (!zone) return null;
  return (
    <div className="shop-backdrop">
      <aside className="shop-drawer" style={{ "--zone-accent": zone.accent }} aria-label="전술 상점">
        <header>
          <div><span>PAUSED / SHARED ECONOMY</span><h2><ShoppingCart weight="duotone" /> 전술 상점</h2><p>{zone.hero.name} · {zone.korean} 강화</p></div>
          <button type="button" onClick={onClose} aria-label="상점 닫기"><CaretRight /></button>
        </header>
        <div className="shop-wallet"><Coins weight="fill" /><span>공유 골드</span><strong>{Math.floor(hud.gold)} G</strong></div>
        <div className="shop-list">
          {SHOP_ITEMS.map((item) => {
            const level = zone.hero.upgrades[item.id] || 0;
            const cost = getShopItemCost(item, level);
            const maxed = !item.consumable && level >= item.max;
            const unavailable = maxed || hud.gold < cost || (item.id === "medkit" && zone.hero.hp >= zone.hero.maxHp);
            const Icon = ICONS[item.icon] || Crosshair;
            return (
              <button type="button" key={item.id} onClick={() => onBuy(item.id)} disabled={unavailable}>
                <Icon weight="duotone" />
                <div><span>{item.tag}</span><strong>{item.korean}</strong><small>{item.description}</small></div>
                <i>{maxed ? <Check weight="bold" /> : `${cost} G`}</i>
                {!item.consumable ? <em>LV.{level}/{item.max}</em> : null}
              </button>
            );
          })}
        </div>
        <footer><Pause weight="fill" /> 상점이 열린 동안 모든 전선은 일시 정지됩니다.</footer>
      </aside>
    </div>
  );
}

function ResultScreen({ result, onRestart }) {
  const victory = result.status === "victory";
  const alive = result.heroes.filter((hero) => !hero.dead).length;
  return (
    <main className={`result-shell ${victory ? "victory" : "defeat"}`}>
      <div className="result-grid-bg" aria-hidden="true" />
      <section className="result-card">
        <div className="result-emblem">{victory ? <Trophy weight="duotone" /> : <Warning weight="duotone" />}</div>
        <div className="eyebrow"><span /> {victory ? "EXTRACTION WINDOW SECURED" : "ALL DEFENSE FRONTS LOST"}</div>
        <h1>{victory ? "FOUR FRONTS. ONE COMMAND." : "THE INVASION CASCADED"}</h1>
        <p>{victory ? "공유 골드와 전선 전환으로 적의 연쇄 침공을 견뎠습니다." : "첫 함락 이후 병력 이동을 막지 못했습니다. 다음 작전에서는 위험 전선을 더 일찍 강화하세요."}</p>
        <div className="result-stats">
          <div><span>FRONTS SAVED</span><strong>{alive} / 4</strong></div>
          <div><span>ELIMINATIONS</span><strong>{result.runStats.kills}</strong></div>
          <div><span>GOLD EARNED</span><strong>{result.runStats.goldEarned}</strong></div>
          <div><span>INVASIONS</span><strong>{result.runStats.invasions}</strong></div>
        </div>
        <button type="button" className="primary-cta" onClick={onRestart}><ArrowCounterClockwise weight="bold" /> 새 작전 시작</button>
      </section>
    </main>
  );
}

function GameScreen({ assets, audioEnabled, onToggleAudio, onFinish }) {
  const canvasRef = useRef(null);
  const gameRef = useRef(createGameState());
  const inputRef = useRef(createInputState());
  const shopOpenRef = useRef(false);
  const sfxRef = useRef(null);
  const [hud, setHud] = useState(() => buildHud(gameRef.current));
  const [shopOpen, setShopOpen] = useState(false);

  if (!sfxRef.current) sfxRef.current = createSfxEngine();
  sfxRef.current.setEnabled(audioEnabled);

  const syncHud = useCallback(() => setHud(buildHud(gameRef.current)), []);
  const closeShop = useCallback(() => {
    shopOpenRef.current = false;
    gameRef.current.paused = false;
    setShopOpen(false);
  }, []);
  const toggleShop = useCallback(() => {
    if (!Number.isInteger(gameRef.current.controlledZoneId)) return;
    const next = !shopOpenRef.current;
    shopOpenRef.current = next;
    gameRef.current.paused = next;
    setShopOpen(next);
  }, []);
  const focusZone = useCallback((zoneId) => {
    closeShop();
    if (selectControlledZone(gameRef.current, zoneId)) syncHud();
  }, [closeShop, syncHud]);
  const overview = useCallback(() => {
    closeShop();
    returnToOverview(gameRef.current);
    syncHud();
  }, [closeShop, syncHud]);

  useEffect(() => {
    const input = inputRef.current;
    const handleKey = (event, down) => {
      const handled = ["KeyW", "KeyA", "KeyS", "KeyD", "Space", "KeyQ", "KeyE", "KeyB", "Tab", "Escape", "Digit1", "Digit2", "Digit3", "Digit4"].includes(event.code);
      if (handled) event.preventDefault();
      if (event.code === "KeyW" || event.code === "ArrowUp") input.up = down;
      if (event.code === "KeyS" || event.code === "ArrowDown") input.down = down;
      if (event.code === "KeyA" || event.code === "ArrowLeft") input.left = down;
      if (event.code === "KeyD" || event.code === "ArrowRight") input.right = down;
      if (!down || event.repeat) return;
      if (event.code === "Space") input.dashPressed = true;
      if (event.code === "KeyQ") input.deploySentryPressed = true;
      if (event.code === "KeyE") input.deployEmpPressed = true;
      if (event.code === "KeyB") toggleShop();
      if (event.code === "Tab" || event.code === "Escape") overview();
      if (/Digit[1-4]/.test(event.code)) focusZone(Number(event.code.at(-1)) - 1);
    };
    const down = (event) => handleKey(event, true);
    const up = (event) => handleKey(event, false);
    window.addEventListener("keydown", down, { passive: false });
    window.addEventListener("keyup", up, { passive: false });
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [focusZone, overview, toggleShop]);

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
        if (sound && !(event.type === "enemyHit" && Math.random() > 0.28) && !(event.type === "enemyKilled" && Math.random() > 0.42)) sfxRef.current.play(sound);
        if ((event.type === "victory" || event.type === "defeat") && !finishTimer) {
          finishTimer = window.setTimeout(() => onFinish(state), 900);
        }
      }
      renderGame(ctx, state, assets);
      if (now - lastHud > 90) {
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

  const handleCanvasPointer = (event) => {
    if (Number.isInteger(gameRef.current.controlledZoneId)) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width * GAME_WIDTH;
    const y = (event.clientY - rect.top) / rect.height * GAME_HEIGHT;
    const zoneId = (x >= GAME_WIDTH / 2 ? 1 : 0) + (y >= GAME_HEIGHT / 2 ? 2 : 0);
    focusZone(zoneId);
  };

  const buy = (itemId) => {
    purchaseShopItem(gameRef.current, itemId);
    syncHud();
  };

  return (
    <main className="game-shell">
      <canvas ref={canvasRef} width={GAME_WIDTH} height={GAME_HEIGHT} onPointerDown={handleCanvasPointer} aria-label="네 개의 방어 전선을 지휘하는 TRAIN ME WRONG 게임" />
      <CommandHud
        hud={hud}
        audioEnabled={audioEnabled}
        shopOpen={shopOpen}
        onToggleAudio={onToggleAudio}
        onSelectZone={focusZone}
        onOverview={overview}
        onToggleShop={toggleShop}
      />
      {shopOpen ? <ShopDrawer hud={hud} onBuy={buy} onClose={closeShop} /> : null}
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
