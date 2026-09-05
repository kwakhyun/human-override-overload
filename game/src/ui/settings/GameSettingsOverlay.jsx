import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowCounterClockwise,
  ArrowsInSimple,
  ArrowsOutSimple,
  CheckCircle,
  Crosshair,
  GameController,
  GearSix,
  Gauge,
  Keyboard,
  Monitor,
  Mouse,
  Pulse,
  SpeakerHigh,
  SpeakerSlash,
  X,
} from "@phosphor-icons/react";
import { useDialogFocusTrap } from "../useDialogFocusTrap.js";

const SETTINGS_TABS = Object.freeze([
  { id: "general", label: "일반", code: "01", icon: GearSix },
  { id: "audio", label: "오디오", code: "02", icon: SpeakerHigh },
  { id: "graphics", label: "그래픽", code: "03", icon: Monitor },
  { id: "controls", label: "조작", code: "04", icon: GameController },
]);

const QUALITY_OPTIONS = Object.freeze([
  { id: "auto", label: "자동", detail: "기기 성능에 맞춰 자동 조정" },
  { id: "cinematic", label: "고품질", detail: "60 FPS · 고급 효과" },
  { id: "balanced", label: "균형", detail: "45 FPS · 안정적인 품질" },
  { id: "performance", label: "성능", detail: "30 FPS · 발열과 부하 감소" },
]);

function ToggleRow({ icon: Icon, title, description, checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      className="settings-toggle-row"
      aria-pressed={Boolean(checked)}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
    >
      <span className="settings-row-icon"><Icon weight="fill" /></span>
      <span className="settings-row-copy"><strong>{title}</strong><small>{description}</small></span>
      <span className={`settings-switch${checked ? " is-on" : ""}`} aria-hidden="true"><i /></span>
      <b>{checked ? "켜짐" : "꺼짐"}</b>
    </button>
  );
}

function VolumeSlider({ title, description, value, onChange, disabled = false }) {
  const percent = Math.round(Math.max(0, Math.min(1, Number(value) || 0)) * 100);
  return (
    <label className={`settings-volume-row${disabled ? " is-disabled" : ""}`}>
      <span><strong>{title}</strong><small>{description}</small></span>
      <input
        type="range"
        min="0"
        max="100"
        step="1"
        value={percent}
        disabled={disabled}
        aria-label={`${title} 음량`}
        style={{ "--settings-range-progress": `${percent}%` }}
        onChange={(event) => onChange?.(Number(event.target.value) / 100)}
      />
      <output>{percent}</output>
    </label>
  );
}

function GeneralSettings({ settings, onChange }) {
  return (
    <div className="settings-section-grid">
      <header><small>GAMEPLAY &amp; ACCESSIBILITY</small><h3>일반 설정</h3><p>안내 정보와 화면 가독성을 플레이 환경에 맞게 조정합니다.</p></header>
      <ToggleRow icon={Crosshair} title="전투 도움말" description="첫 출격의 조작 안내와 상황별 전술 팁을 표시합니다." checked={settings.combatHintsEnabled !== false} onChange={(value) => onChange({ combatHintsEnabled: value })} />
      <ToggleRow icon={Gauge} title="고대비 인터페이스" description="HUD 외곽선과 핵심 텍스트 대비를 강화합니다." checked={Boolean(settings.highContrast)} onChange={(value) => onChange({ highContrast: value })} />
      <ToggleRow icon={Pulse} title="모션 최소화" description="장식 애니메이션과 강한 화면 전환을 줄입니다." checked={Boolean(settings.reducedMotion)} onChange={(value) => onChange({ reducedMotion: value })} />
      <aside className="settings-info-strip"><CheckCircle weight="fill" /><span>접근성과 음량은 즉시 적용됩니다. 그래픽 품질과 카메라 흔들림은 다음 전투부터 적용됩니다.</span></aside>
    </div>
  );
}

function AudioSettings({ settings, onChange }) {
  const enabled = settings.masterSoundEnabled !== false;
  return (
    <div className="settings-section-grid">
      <header><small>AUDIO MIXER</small><h3>오디오 설정</h3><p>전투 효과와 음성의 우선순위를 개별적으로 조정합니다.</p></header>
      <ToggleRow icon={enabled ? SpeakerHigh : SpeakerSlash} title="전체 사운드" description="모든 음악·효과음·음성을 한 번에 켜거나 끕니다." checked={enabled} onChange={(value) => onChange({ masterSoundEnabled: value })} />
      <div className="settings-volume-stack">
        <VolumeSlider title="배경 음악" description="타이틀과 작전 구역 음악" value={settings.musicVolume} disabled={!enabled} onChange={(value) => onChange({ musicVolume: value })} />
        <VolumeSlider title="효과음" description="무기·피격·메뉴 피드백" value={settings.sfxVolume} disabled={!enabled} onChange={(value) => onChange({ sfxVolume: value })} />
        <VolumeSlider title="전술 음성" description="전투원 스킬 음성" value={settings.voiceVolume} disabled={!enabled} onChange={(value) => onChange({ voiceVolume: value })} />
      </div>
    </div>
  );
}

function GraphicsSettings({ settings, onChange, fullscreen, onToggleFullscreen, fullscreenError }) {
  return (
    <div className="settings-section-grid">
      <header><small>DISPLAY &amp; PERFORMANCE</small><h3>그래픽 설정</h3><p>선택한 품질은 다음 전투 진입 시 렌더러에 적용됩니다.</p></header>
      <fieldset className="settings-quality-field">
        <legend>그래픽 품질</legend>
        <div className="settings-quality-options">
          {QUALITY_OPTIONS.map((option) => (
            <button type="button" className={settings.graphicsQuality === option.id ? "is-selected" : ""} aria-pressed={settings.graphicsQuality === option.id} onClick={() => onChange({ graphicsQuality: option.id })} key={option.id}>
              <strong>{option.label}</strong><small>{option.detail}</small>
            </button>
          ))}
        </div>
      </fieldset>
      <ToggleRow icon={Pulse} title="카메라 흔들림" description="강한 피격과 보스 패턴의 충격 연출을 사용합니다." checked={settings.screenShakeEnabled !== false} onChange={(value) => onChange({ screenShakeEnabled: value })} />
      <button type="button" className="settings-fullscreen-row" onClick={onToggleFullscreen}>
        <span className="settings-row-icon">{fullscreen ? <ArrowsInSimple weight="bold" /> : <ArrowsOutSimple weight="bold" />}</span>
        <span className="settings-row-copy"><strong>{fullscreen ? "전체 화면 종료" : "전체 화면으로 전환"}</strong><small>브라우저 도구 모음을 숨기고 게임 화면에 집중합니다.</small></span>
        <b>{fullscreen ? "사용 중" : "전환"}</b>
      </button>
      {fullscreenError && <p className="settings-inline-error" role="status">브라우저에서 전체 화면 전환을 허용하지 않았습니다.</p>}
    </div>
  );
}

function ControlsSettings({ settings, onChange }) {
  return (
    <div className="settings-section-grid">
      <header><small>INPUT REFERENCE</small><h3>조작 설정</h3><p>현재 작전에 사용하는 기본 입력 체계를 확인합니다.</p></header>
      <div className="settings-control-layout settings-desktop-controls">
        <article><Keyboard weight="fill" /><div><strong>이동과 회피</strong><span><kbd>WASD</kbd> 이동</span><span><kbd>SPACE</kbd> 위상 대시</span><span><kbd>SHIFT</kbd> 패링</span></div></article>
        <article><Mouse weight="fill" /><div><strong>조준과 전투</strong><span><kbd>마우스</kbd> 조준</span><span><kbd>Q / E / F / R</kbd> 전술 스킬</span><span><kbd>T</kbd> 전투원 교대</span></div></article>
      </div>
      <div className="settings-control-layout settings-touch-controls">
        <article><GameController weight="fill" /><div><strong>터치 이동과 조준</strong><span>전장 빈 곳을 누른 채 드래그해 이동합니다.</span><span>가까운 적을 자동으로 조준하고 공격합니다.</span></div></article>
        <article><Crosshair weight="fill" /><div><strong>회피와 전술 스킬</strong><span>하단의 대시·스킬·교대 버튼을 누르세요.</span><span>보스 패링과 번호 폭탄은 화면 안내에 따라 터치하세요.</span></div></article>
      </div>
      <ToggleRow icon={Pulse} title="터치 진동 피드백" description="지원되는 모바일 기기에서 피격과 스킬 입력을 진동으로 알립니다." checked={settings.hapticsEnabled !== false} onChange={(value) => onChange({ hapticsEnabled: value })} />
      <aside className="settings-info-strip"><GameController weight="fill" /><span>모바일에서는 화면 드래그 이동과 자동 조준이 활성화됩니다.</span></aside>
    </div>
  );
}

export function GameSettingsOverlay({ settings = {}, saved = true, onChange, onReset, onClose }) {
  const modalRef = useRef(null);
  const [activeTab, setActiveTab] = useState("general");
  const [fullscreen, setFullscreen] = useState(() => typeof document !== "undefined" && Boolean(document.fullscreenElement));
  const [fullscreenError, setFullscreenError] = useState(false);
  const [resetPending, setResetPending] = useState(false);
  useDialogFocusTrap(modalRef, true);

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.repeat) return;
      if (resetPending) setResetPending(false);
      else onClose?.();
    };
    const handleFullscreen = () => {
      setFullscreen(Boolean(document.fullscreenElement));
      setFullscreenError(false);
    };
    window.addEventListener("keydown", handleKey, true);
    document.addEventListener("fullscreenchange", handleFullscreen);
    return () => {
      window.removeEventListener("keydown", handleKey, true);
      document.removeEventListener("fullscreenchange", handleFullscreen);
    };
  }, [onClose, resetPending]);

  const toggleFullscreen = async () => {
    setFullscreenError(false);
    try {
      if (document.fullscreenElement && document.exitFullscreen) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      else setFullscreenError(true);
    } catch {
      setFullscreenError(true);
    }
  };

  return createPortal(
    <div className="game-settings-layer" role="dialog" aria-modal="true" aria-labelledby="game-settings-title" onMouseDown={(event) => event.target === event.currentTarget && onClose?.()}>
      <section className="game-settings-console" ref={modalRef} tabIndex={-1}>
        <header className="game-settings-header">
          <div><small>HAVEN-09 SYSTEM CONFIGURATION</small><h2 id="game-settings-title">환경 설정</h2></div>
          <span>LOCAL PROFILE · AUTO SAVE</span>
          <button type="button" className="settings-close" aria-label="설정 닫기" onClick={onClose}><X weight="bold" /></button>
        </header>
        <div className="game-settings-body">
          <nav className="game-settings-tabs" role="tablist" aria-label="설정 분류">
            {SETTINGS_TABS.map(({ id, label, code, icon: Icon }, index) => (
              <button type="button" role="tab" id={`settings-tab-${id}`} aria-controls="settings-panel" aria-selected={activeTab === id} tabIndex={activeTab === id ? 0 : -1} className={activeTab === id ? "is-active" : ""} onClick={() => { setActiveTab(id); setResetPending(false); }} onKeyDown={(event) => {
                const offset = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
                if (offset === undefined && event.key !== "Home" && event.key !== "End") return;
                event.preventDefault();
                const next = event.key === "Home" ? 0 : event.key === "End" ? SETTINGS_TABS.length - 1 : (index + offset + SETTINGS_TABS.length) % SETTINGS_TABS.length;
                setActiveTab(SETTINGS_TABS[next].id);
                setResetPending(false);
                document.getElementById(`settings-tab-${SETTINGS_TABS[next].id}`)?.focus();
              }} key={id}>
                <small>{code}</small><Icon weight="fill" /><strong>{label}</strong>
              </button>
            ))}
          </nav>
          <article className="game-settings-content" id="settings-panel" role="tabpanel" aria-labelledby={`settings-tab-${activeTab}`} tabIndex={0}>
            {activeTab === "general" && <GeneralSettings settings={settings} onChange={onChange} />}
            {activeTab === "audio" && <AudioSettings settings={settings} onChange={onChange} />}
            {activeTab === "graphics" && <GraphicsSettings settings={settings} onChange={onChange} fullscreen={fullscreen} onToggleFullscreen={toggleFullscreen} fullscreenError={fullscreenError} />}
            {activeTab === "controls" && <ControlsSettings settings={settings} onChange={onChange} />}
          </article>
        </div>
        <footer className="game-settings-footer">
          <div className="settings-reset-actions">
            <button type="button" className="settings-reset" aria-label={resetPending ? "모든 설정을 기본값으로 복원" : "기본값 복원"} onClick={() => {
              if (!resetPending) { setResetPending(true); return; }
              onReset?.();
              setResetPending(false);
            }}><ArrowCounterClockwise weight="bold" /> {resetPending ? "복원 확인" : "기본값 복원"}</button>
            {resetPending && <button type="button" onClick={() => setResetPending(false)}>취소</button>}
          </div>
          <p className={`settings-save-status${saved ? "" : " is-unsaved"}`} role="status"><CheckCircle weight="fill" />{resetPending ? "음량·화면·조작 설정을 모두 복원할까요?" : saved ? "설정 저장 완료" : "기기에 저장하지 못했습니다. 이번 실행에만 적용됩니다."}</p>
          <button type="button" className="settings-confirm" onClick={onClose}>설정 완료 <kbd>ESC</kbd></button>
        </footer>
      </section>
    </div>, document.body,
  );
}
