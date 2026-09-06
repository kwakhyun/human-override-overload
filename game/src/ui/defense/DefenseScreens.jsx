import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ArrowCounterClockwise,
  ArrowLeft,
  ArrowRight,
  ArrowsClockwise,
  Coins,
  Crosshair,
  FastForward,
  HouseLine,
  Lightning,
  Pause,
  Play,
  Pulse,
  Robot,
  ShieldChevron,
  ShieldStar,
  Sparkle,
  Target,
  Trash,
  Warning,
} from "@phosphor-icons/react";
import { DEFENSE_TOWER_DEFINITIONS, getDefenseStage } from "../../defense/content.js";
import { useDialogFocusTrap } from "../useDialogFocusTrap.js";

const DEFENSE_TOWER_ICONS = Object.freeze({
  pulseSentry: Target,
  arcRelay: Lightning,
  skyfireBattery: Robot,
  aegisBastion: ShieldChevron,
});

const DEFENSE_GUIDE_STEPS = Object.freeze([
  Object.freeze({ target: "core", kicker: "01 · 방어 목표", title: "헤이븐 방벽을 지키세요", description: "세 침투로의 적이 중앙 추론핵에 도달하면 방벽이 손상됩니다. 상단 내구도가 0이 되면 작전 실패입니다." }),
  Object.freeze({ target: "field", kicker: "02 · 화망 설계", title: "패드를 선택해 사거리와 축선을 확인하세요", description: "선택한 포대의 사거리와 현재 표적이 전장에 표시됩니다. 선두·강적·밀집 우선순위를 바꿔 같은 배치에서도 전술을 조정할 수 있습니다." }),
  Object.freeze({ target: "palette", kicker: "03 · 체계 조합", title: "네 체계의 역할을 조합하세요", description: "센트리 단일 화력, 릴레이 연쇄 제압, 스카이파이어 범위 폭격, 바스티온 감속을 조합하고 2단계부터 전문화를 선택하세요." }),
  Object.freeze({ target: "wave", kicker: "04 · 지휘 개입", title: "웨이브 정보와 전술 명령을 활용하세요", description: "조기 호출 현상금과 다음 적 구성을 확인하세요. Q·W·E 전술 명령, T 표적 우선순위, S 판매, F 2배속으로 전황에 직접 개입합니다." }),
]);

function DefenseSpotlightGuide({ stepIndex, onNext, onBack, onSkip }) {
  const modalRef = useRef(null);
  const step = DEFENSE_GUIDE_STEPS[stepIndex];
  const [targetBounds, setTargetBounds] = useState(null);
  useLayoutEffect(() => {
    const root = modalRef.current?.closest('.defense-runtime-screen');
    const selectors = { core: '.defense-core-status', field: '.defense-phaser-host', palette: '[data-defense-tower-palette]', wave: '.defense-command-actions' };
    const target = root?.querySelector(selectors[step?.target]);
    if (!target) return;
    const measure = () => {
      const r = target.getBoundingClientRect();
      setTargetBounds({ left: r.left + 2, top: r.top + 2, width: Math.max(0, r.width - 4), height: Math.max(0, r.height - 4), right: 'auto', bottom: 'auto' });
    };
    measure(); const observer = new ResizeObserver(measure); observer.observe(target);
    window.addEventListener('resize', measure);
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); };
  }, [step?.target]);
  useDialogFocusTrap(modalRef, Boolean(step));
  if (!step) return null;
  const final = stepIndex === DEFENSE_GUIDE_STEPS.length - 1;
  return (
    <section className={`defense-guide-overlay is-${step.target}`} data-defense-guide-step={stepIndex + 1} aria-label={`디펜스 첫 도전 가이드 ${stepIndex + 1}단계`}>
      <div className={`defense-guide-spotlight is-${step.target}`} style={targetBounds || { display: "none" }} aria-hidden="true" />
      <article className="defense-guide-card" role="dialog" aria-modal="true" aria-labelledby="defense-guide-title" ref={modalRef} tabIndex={-1}>
        <div className="defense-guide-copy">
          <small>{step.kicker} · 레아 전술 교신</small>
          <h2 id="defense-guide-title">{step.title}</h2>
          <p>{step.description}</p>
          <div className="defense-guide-progress" aria-label={`${DEFENSE_GUIDE_STEPS.length}단계 중 ${stepIndex + 1}단계`}>
            {DEFENSE_GUIDE_STEPS.map((item, index) => <i className={index <= stepIndex ? "is-active" : ""} key={item.target} />)}
          </div>
          <footer>
            <button type="button" className="defense-guide-skip" onClick={onSkip}>가이드 건너뛰기 <kbd>ESC</kbd></button>
            <span>
              <button type="button" disabled={stepIndex === 0} onClick={onBack}><ArrowLeft weight="bold" /> 이전</button>
              <button type="button" className="defense-guide-next" onClick={onNext}>{final ? "배치 시작" : "다음"}<ArrowRight weight="bold" /></button>
            </span>
          </footer>
        </div>
      </article>
    </section>
  );
}

export function DefenseArenaScreen({ stageId, doctrineId, assets, sfx, showTutorial = false, onTutorialComplete, onFinish, onBase }) {
  const hostRef = useRef(null);
  const controllerRef = useRef(null);
  const [hud, setHud] = useState(null);
  const [dockTab, setDockTab] = useState("build");
  const [loadProgress, setLoadProgress] = useState(0);
  const [tutorialStep, setTutorialStep] = useState(showTutorial ? 0 : -1);
  const stage = getDefenseStage(stageId);
  const tutorialActive = showTutorial && tutorialStep >= 0;
  const activeDockTab = tutorialActive ? 'build' : dockTab;
  useEffect(() => {
    if (hud?.selectedNodeId) setDockTab(hud?.selectedTower ? 'manage' : 'build');
  }, [hud?.selectedNodeId, hud?.selectedTower?.id]);

  useEffect(() => setTutorialStep(showTutorial ? 0 : -1), [showTutorial, stageId]);

  const finishTutorial = useCallback(() => {
    controllerRef.current?.setSuspended(false);
    setTutorialStep(-1);
    onTutorialComplete?.();
  }, [onTutorialComplete]);

  const advanceTutorial = useCallback(() => {
    if (tutorialStep >= DEFENSE_GUIDE_STEPS.length - 1) finishTutorial();
    else setTutorialStep((step) => Math.min(DEFENSE_GUIDE_STEPS.length - 1, step + 1));
  }, [finishTutorial, tutorialStep]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    let cancelled = false;
    let controller = null;
    void import("../../phaser/createDefenseGame.ts").then(({ createDefenseGame }) => {
      if (cancelled) return;
      controller = createDefenseGame(host, {
        onHud: (nextHud) => !cancelled && setHud(nextHud),
        onEvent: (event) => {
          if (cancelled) return;
          if (event.type === "defenseNodeSelected" || event.type === "defenseTargetPriorityChanged") sfx.play("defenseSelect");
          else if (event.type === "defenseTowerBuilt") sfx.play("defenseBuild");
          else if (event.type === "defenseTowerUpgraded" || event.type === "defenseTowerSpecialized") sfx.play("defenseUpgrade");
          else if (event.type === "defenseTowerSold") sfx.play("defenseSell");
          else if (event.type === "defenseEarlyWaveCalled" || event.type === "defenseWaveStarted") sfx.play("defenseWave");
          else if (event.type === "defenseWaveCleared") sfx.play("defenseClear");
          else if (event.type === "defenseAbilityActivated") sfx.play("defenseAbility");
          else if (event.type === "defenseCoreHit") sfx.play("defenseBreach");
          else if (event.type === "defenseCoreRepaired") sfx.play("defenseRepair");
          else if (event.type === "defenseEnemyDestroyed" && event.elite) sfx.play("defenseEliteDown");
          else if (event.type === "defenseTowerFired") sfx.play("towerShot");
          else if (event.type === "defenseEnemyHit") sfx.play("enemyHit");
          else if (event.type === "defenseVictory") sfx.play("victory");
          else if (event.type === "defenseDefeat") sfx.play("defenseDefeat");
        },
        onFinish: (result) => !cancelled && onFinish(result),
        onLoadProgress: (progress) => !cancelled && setLoadProgress(progress),
        onReady: () => !cancelled && setLoadProgress(1),
      }, stageId, doctrineId);
      controllerRef.current = controller;
    });
    return () => {
      cancelled = true;
      controllerRef.current = null;
      controller?.destroy();
    };
  }, [doctrineId, onFinish, sfx, stageId]);

  useEffect(() => {
    if (loadProgress < 1) return;
    controllerRef.current?.setSuspended(tutorialActive);
  }, [loadProgress, tutorialActive]);

  useEffect(() => {
    const escape = (event) => {
      if (event.repeat) return;
      if (tutorialActive && ["Escape", "Enter", " ", "ArrowRight", "ArrowLeft"].includes(event.key)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (event.key === "Escape") finishTutorial();
        else if (event.key === "ArrowLeft") setTutorialStep((step) => Math.max(0, step - 1));
        else advanceTutorial();
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        controllerRef.current?.setSpeed(hud?.simulationSpeed === 0 ? 1 : 0);
      }
    };
    window.addEventListener("keydown", escape, true);
    return () => window.removeEventListener("keydown", escape, true);
  }, [advanceTutorial, finishTutorial, hud?.simulationSpeed, tutorialActive]);

  const selectedTowerDefinition = hud?.selectedTower ? DEFENSE_TOWER_DEFINITIONS[hud.selectedTower.type] : null;
  const selectedTowerUpgradeCost = selectedTowerDefinition && hud?.selectedTower?.rank < 3
    ? Math.round(selectedTowerDefinition.cost * (0.7 + hud.selectedTower.rank * 0.45))
    : null;
  const selectedNodeLabel = hud?.selectedNodeId ? `방어 패드 ${String(hud.selectedNodeId).split("-").at(-1)}` : "원형 패드를 선택하세요";
  const guideTarget = tutorialActive ? DEFENSE_GUIDE_STEPS[tutorialStep]?.target : null;
  const priorityLabels = { first: "선두 우선", strong: "강적 우선", cluster: "밀집 우선" };
  const enemyLabels = { hunter: "드론", rifleman: "장갑", sniper: "저격", siegeWalker: "공성", elite: "정예" };
  const abilityIcons = { empSweep: Pulse, orbitalStrike: Crosshair, emergencyRepair: ShieldStar };
  const nextWaveEntries = Object.entries(hud?.nextWave || {}).filter(([, count]) => count > 0);
  return (
    <main
      className="defense-runtime-screen defense-ui-v4"
      style={assets?.defenseBattlefield ? {
        "--defense-battlefield": `url("${assets.defenseBattlefield?.src || assets.defenseBattlefield}")`,
        "--defense-battlefield-portrait": `url("${assets.defenseBattlefieldPortrait?.src || assets.defenseBattlefieldPortrait || assets.defenseBattlefield?.src || assets.defenseBattlefield}")`,
      } : undefined}
    >
      <div className="defense-phaser-host" ref={hostRef} inert={tutorialActive} />
      {loadProgress < 1 && <div className="defense-load-chip">방어 체계 동기화 {Math.round(loadProgress * 100)}%</div>}
      <header inert={tutorialActive} className="defense-combat-hud" data-defense-phase={hud?.phase || "intermission"}>
        <div className={`defense-core-status${guideTarget === "core" ? " is-guide-target" : ""}`}><span><small>방벽 내구도</small><b>{hud?.baseHp ?? stage?.baseHp} / {hud?.maxBaseHp ?? stage?.baseHp}</b></span><i><em style={{ width: `${Math.max(0, (hud?.baseHp ?? stage?.baseHp ?? 1) / (hud?.maxBaseHp ?? stage?.baseHp ?? 1) * 100)}%` }} /></i></div>
        <div className="defense-wave-command" aria-live="polite">
          <span><small>WAVE {String(hud?.wave || 1).padStart(2, "0")} / {String(hud?.totalWaves || stage?.waveCounts.length).padStart(2, "0")}</small><b>{hud?.phase === "wave" ? `교전 중 · 잔존 ${hud?.liveEnemies || 0}` : "다음 공세 분석 완료"}</b></span>
          <i><em style={{ width: `${Math.round((hud?.waveProgress || 0) * 100)}%` }} /></i>
        </div>
        <div className="defense-wave-status"><span><small>격파</small><b>{hud?.kills || 0}</b></span><span><small>전술 자원</small><b><Coins weight="fill" /> {hud?.credits || 0}</b></span><span><small>정예</small><b>{hud?.eliteEnemies || 0}</b></span></div>
        <div className="defense-speed-controls" aria-label="전투 속도"><button type="button" className={hud?.simulationSpeed === 0 ? "is-active" : ""} onClick={() => controllerRef.current?.setSpeed(0)} aria-label="일시정지" title="일시정지 · ESC"><Pause weight="fill" /></button><button type="button" className={hud?.simulationSpeed === 1 ? "is-active" : ""} onClick={() => controllerRef.current?.setSpeed(1)}><Play weight="fill" />1×</button><button type="button" className={hud?.simulationSpeed === 2 ? "is-active" : ""} onClick={() => controllerRef.current?.setSpeed(2)}><FastForward weight="fill" />2×</button></div>
        <button type="button" className="defense-exit" data-ui-sound="uiClose" onClick={onBase}><HouseLine weight="bold" /> 기지로</button>
      </header>

      <div className={`defense-guide-world-target${guideTarget === "field" ? " is-guide-target" : ""}`} aria-hidden="true" />
      <aside
        className={`defense-command-dock${hud?.selectedNodeId ? " has-selected-pad" : " needs-pad"}${hud?.selectedTower ? " has-selected-tower" : " is-deployment"}${hud?.phase === "wave" ? " is-combat" : " is-preparation"}`}
        data-defense-phase={hud?.phase || "intermission"}
        data-dock-tab={activeDockTab}
        inert={tutorialActive}
        aria-label={hud?.phase === "wave" ? "방어전 전술 명령" : "방어전 출격 준비"}
      >
        <nav className="defense-dock-tabs" aria-label="방어전 명령 패널">
          {[['build', '포탑 건설'], ['manage', '포대 관리'], ['abilities', '전술 명령']].map(([id, label]) =>
            <button type="button" key={id} aria-pressed={activeDockTab === id} onClick={() => setDockTab(id)}>{label}</button>)}
        </nav>
        <header>
          <div><small>{hud?.selectedTower ? "FIRE CONTROL" : "DEPLOYMENT PAD"}</small><strong>{hud?.selectedTower ? selectedTowerDefinition?.name : selectedNodeLabel}</strong></div>
          <div className="defense-pad-stepper" aria-label="건설 패드 순환 선택">
            <button type="button" onClick={() => controllerRef.current?.cycleNode(-1)} aria-label="이전 건설 패드"><ArrowLeft weight="bold" /></button>
            <span><kbd>←</kbd><kbd>→</kbd><b>패드 선택</b></span>
            <button type="button" onClick={() => controllerRef.current?.cycleNode(1)} aria-label="다음 건설 패드"><ArrowRight weight="bold" /></button>
          </div>
          {hud?.selectedTower ? <span>RANK {hud.selectedTower.rank} / 3 · {priorityLabels[hud.selectedTower.targetPriority]}</span> : <span>{hud?.selectedNodeId ? "배치 체계를 선택하세요" : "빛나는 패드를 먼저 선택하세요"}</span>}
        </header>
        <div className={`defense-tower-palette${guideTarget === "palette" ? " is-guide-target" : ""}`} data-defense-tower-palette>
          {Object.values(DEFENSE_TOWER_DEFINITIONS).map((tower, index) => {
            const Icon = DEFENSE_TOWER_ICONS[tower.id] || Crosshair;
            const disabled = !hud?.selectedNodeId || Boolean(hud?.selectedTower) || (hud?.credits || 0) < tower.cost;
            const compactName = { pulseSentry: "펄스 포탑", arcRelay: "연쇄 전격", skyfireBattery: "광역 포격", aegisBastion: "감속 방벽" }[tower.id];
            return <button type="button" data-defense-tower={tower.id} aria-label={`${tower.name}, ${tower.role}, 자원 ${tower.cost}`} title={hud?.selectedTower ? "빈 패드로 이동하면 바로 설치할 수 있습니다." : tower.description} disabled={disabled} onClick={() => controllerRef.current?.buildTower(tower.id)} key={tower.id}><kbd>{index + 1}</kbd><Icon weight="duotone" /><span className="defense-tower-copy"><b>{compactName}</b><small>{tower.role}</small></span><em>{tower.cost}</em></button>;
          })}
        </div>
        <section className="defense-tower-console">
          {hud?.selectedTower ? (
            <>
              <div className="defense-tower-metrics"><span><small>공격력</small><b>{hud.selectedTower.damage}</b></span><span><small>사거리</small><b>{hud.selectedTower.range}</b></span><span><small>공격 간격</small><b>{hud.selectedTower.cooldown}s</b></span></div>
              <div className="defense-tower-quick-actions">
                <button type="button" onClick={() => controllerRef.current?.cycleTargetPriority()}><ArrowsClockwise weight="bold" /><span><small>표적 규칙 <kbd>T</kbd></small><b>{priorityLabels[hud.selectedTower.targetPriority]}</b></span></button>
                <button type="button" className="defense-upgrade-button" disabled={hud.selectedTower.rank >= 3 || (hud?.credits || 0) < (selectedTowerUpgradeCost || 0)} onClick={() => controllerRef.current?.upgradeTower()}><Sparkle weight="duotone" /><span><small>{hud.selectedTower.rank >= 3 ? "강화 완료" : `비용 ${selectedTowerUpgradeCost}`} <kbd>U</kbd></small><b>{hud.selectedTower.rank >= 3 ? "최대 단계" : "즉시 강화"}</b></span></button>
                <button type="button" className="defense-sell-button" onClick={() => controllerRef.current?.sellTower()}><Trash weight="bold" /><span><small>철거 <kbd>S</kbd></small><b>+{hud.selectedTower.sellRefund}</b></span></button>
              </div>
              {hud.selectedTower.rank >= 2 && !hud.selectedTower.specialization && <div className="defense-specialization"><small>전문화 선택 · 변경 불가</small><span>{hud.selectedTower.branches.map((branch, index) => <button type="button" style={{ "--branch-accent": branch.accent }} onClick={() => controllerRef.current?.specializeTower(index)} key={branch.id}><kbd>{index ? "X" : "Z"}</kbd><b>{branch.name}</b><em>{branch.detail}</em></button>)}</span></div>}
              {hud.selectedTower.specialization && <div className="defense-specialization is-locked"><small>전문화 적용</small><b>{hud.selectedTower.branches.find((branch) => branch.id === hud.selectedTower.specialization)?.name}</b></div>}
            </>
          ) : (
            <div className="defense-next-wave-intel"><small>NEXT WAVE INTEL</small><strong>적 구성 사전 분석</strong><span>{nextWaveEntries.map(([role, count]) => <b className={role === "elite" || role === "siegeWalker" ? "is-danger" : ""} key={role}><em>{enemyLabels[role]}</em>{count}</b>)}</span></div>
          )}
        </section>
        <section className="defense-command-abilities">
          <header><span><small>TACTICAL COMMAND LINK</small><b>전술 명령</b></span><i><em style={{ width: `${Math.round((hud?.commandPoints || 0) / Math.max(1, hud?.maxCommandPoints || 100) * 100)}%` }} /></i><strong>{Math.floor(hud?.commandPoints || 0)}</strong></header>
          <div>{(hud?.abilities || []).map((ability, index) => { const Icon = abilityIcons[ability.id] || Crosshair; const repairAtFull = ability.id === "emergencyRepair" && hud?.baseHp >= hud?.maxBaseHp; return <button type="button" disabled={!ability.ready || repairAtFull} onClick={() => controllerRef.current?.activateAbility(ability.id)} key={ability.id}><kbd>{["Q", "W", "E"][index]}</kbd><Icon weight="duotone" /><span><b>{ability.name}</b><small>{ability.cooldownRemaining > 0 ? `${ability.cooldownRemaining.toFixed(1)}초` : ability.detail}</small></span><em>{ability.cost}</em></button>; })}</div>
        </section>
        <div className="defense-command-actions">
          <button type="button" className={`defense-wave-button${guideTarget === "wave" ? " is-guide-target" : ""}`} data-defense-wave aria-label="웨이브 시작" disabled={!hud?.readyToStart} onClick={() => controllerRef.current?.startWave()}><Warning weight="duotone" /><span><small>{hud?.earlyCallBonus > 0 ? `조기 호출 현상금 +${hud.earlyCallBonus}` : hud?.wave === 1 ? "첫 웨이브" : `${Math.ceil(hud?.intermission || 0)}초`}</small><b>{hud?.readyToStart ? "공세 즉시 호출" : "방어 진행 중"}</b></span><Play weight="fill" /></button>
        </div>
      </aside>
      {tutorialActive && <DefenseSpotlightGuide stepIndex={tutorialStep} onNext={advanceTutorial} onBack={() => setTutorialStep((step) => Math.max(0, step - 1))} onSkip={finishTutorial} />}
    </main>
  );
}

export function DefenseResultScreen({ result, stage, rewards, onRetry, onBase }) {
  const victory = result?.status === "victory";
  return (
    <main className={`defense-result-screen${victory ? " is-victory" : " is-defeat"}`}>
      <section>
        <small>RHEA DEFENSE CONTROL · {stage?.subtitle}</small>
        <div className="defense-result-rank" aria-label={`작전 평가 ${result?.rank || "D"}`}>{result?.rank || "D"}</div>
        <h1>{victory ? "방어 작전 성공" : "추론핵 방어 실패"}</h1>
        <p>{victory ? "방어 작전 기록을 저장했습니다. 회수한 자원은 기지 저장고에 보관됩니다." : "포대 배치와 사격 범위를 조정한 뒤 다시 도전하세요."}</p>
        <div className="defense-result-stats"><span><small>작전 점수</small><b>{(result?.score || 0).toLocaleString()}</b></span><span><small>도달 웨이브</small><b>{result?.waves || 0} / {result?.totalWaves || stage?.waveCounts.length}</b></span><span><small>격파</small><b>{result?.kills || 0}</b></span><span><small>방벽 잔존</small><b>{result?.coreHp ?? 0} / {result?.maxCoreHp ?? stage?.baseHp}</b></span><span><small>조기 호출 수익</small><b>+{result?.earlyCallCredits || 0}</b></span></div>
        {victory && rewards && <div className="defense-result-rewards"><span>회수 보상</span><b>연구 자료 +{rewards.researchData}</b><b>장비 부품 +{rewards.equipmentParts}</b><b>동기화 코어 +{rewards.augmentationCores}</b></div>}
        <footer><button type="button" className="primary-cta" onClick={onRetry}><ArrowCounterClockwise weight="bold" /> 같은 방어선 재도전</button><button type="button" className="result-base-return" onClick={onBase}><HouseLine weight="bold" /> 헤이븐-09로 복귀</button></footer>
      </section>
    </main>
  );
}
