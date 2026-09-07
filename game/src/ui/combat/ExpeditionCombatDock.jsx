import { useEffect, useRef, useState } from 'react';
import { CheckCircle, Crosshair, Lightning, LockSimple, Pulse, ShieldChevron, Target, Timer } from '@phosphor-icons/react';
import { cooldownPresentation, formatCooldown } from './cooldownPresentation.js';

const ABILITY_COOLDOWN_FALLBACK = Object.freeze({
  dash: 2.35,
  empPulse: 18,
  aegisWard: 28,
  stratosRun: 34,
  helixTempest: 72,
  spectralSwordArray: 6,
  phantomRend: 9,
  imperialSwordDomain: 15,
  heavenfallExecution: 45,
  chain: 4.8,
  nova: 9,
  airstrike: 18,
  omegaLaser: 22,
});


const COMBAT_DOCK_SLOTS = Object.freeze([
  Object.freeze({ id: "dash", key: "SPACE", label: "위상 대시", icon: Lightning, action: "dash", abilityKeys: Object.freeze([]) }),
  Object.freeze({ id: "empPulse", key: "Q", label: "EMP 펄스", icon: Pulse, action: "empPulse", abilityKeys: Object.freeze(["empPulse"]) }),
  Object.freeze({ id: "aegisWard", key: "E", label: "방벽 전개", icon: ShieldChevron, action: "aegisWard", abilityKeys: Object.freeze(["aegisWard"]) }),
  Object.freeze({ id: "stratosRun", key: "F", label: "항공 지원", icon: Target, action: "stratosRun", abilityKeys: Object.freeze(["stratosRun"]) }),
  Object.freeze({ id: "helixTempest", key: "R", label: "섬멸 모드", icon: Crosshair, action: "helixTempest", abilityKeys: Object.freeze(["helixTempest"]) }),
]);

function resolveCombatDockSlot(hud, slot) {
  const blocked = Boolean(hud?.player?.stunned) || Number(hud?.player?.hp) <= 0;
  if (slot.id === "dash") {
    const remaining = Math.max(0, Number(hud?.player?.dashCooldown) || 0);
    const cooldownMax = Math.max(0.01, Number(hud?.player?.dashMax) || ABILITY_COOLDOWN_FALLBACK.dash);
    const presentation = cooldownPresentation({ remaining, cooldownMax, blocked });
    return {
      ...slot,
      ...presentation,
      locked: false,
      remaining,
      activeRemaining: 0,
    };
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
  const presentation = cooldownPresentation({ remaining, cooldownMax, locked, blocked, available: targetAvailable, ready: ability?.ready !== false });
  return {
    ...slot,
    id: ability?.id || slot.id,
    label: ability?.nameKo || slot.label,
    ultimate: Boolean(ability?.ultimate),
    ...presentation,
    locked,
    remaining,
    activeRemaining,
    available: targetAvailable,
  };
}

export function ExpeditionCombatDock({ hud, compact = false, onDash, onTag, onActivateAbility, tutorialAbilityId = null, onTutorialTarget }) {
  const player = hud?.player || { hp: 0, maxHp: 1 };
  const tagStatus = player.tagReady ? "교대 가능" : player.stunned ? "행동 불가" : player.tagCooldown > 0 ? `${formatCooldown(player.tagCooldown)}초` : "대기";
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
    <aside className={`expedition-combat-dock skill-readiness${compact ? " is-commercial-compact" : ""}${player.reserveCharacterId ? " has-tag" : ""}${tutorialAbilityId ? " is-tutorial-active" : ""}${healthRatio <= 0.3 ? " is-danger-state" : ""}`} aria-label="생존 및 액티브 능력 상태">
      <div className={`vital-cluster${healthRatio <= 0.3 ? " is-critical" : ""}`}>
        {damageWarning && <i className="vital-damage-flash" key={`damage-${damagePulse}`} aria-hidden="true" />}
        <span>{player.characterId === "mika" ? "미카" : player.characterId === "vesper" ? "베스퍼" : "이지스"} 내구도 <small>레벨 {hud?.level || 1}</small></span>
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
          const StatusIcon = slot.locked ? LockSimple : slot.ready ? CheckCircle : Timer;
          const activate = () => {
            if (tutorialAbilityId) {
              if (tutorialTarget) onTutorialTarget?.();
              return;
            }
            if (!slot.ready) return;
            if (slot.action === "dash") onDash?.();
            else onActivateAbility?.(slot.action);
          };
          return (
            <button
              type="button"
              className={`combat-ability-chip is-${slot.state}${slot.ultimate ? " is-ultimate" : ""}${tutorialTarget ? " is-tutorial-target" : ""}${tutorialDimmed ? " is-tutorial-dimmed" : ""}`}
              onClick={activate}
              aria-label={`${slot.key} ${slot.label}. ${slot.status}`}
              aria-keyshortcuts={slot.key === "SPACE" ? "Space" : slot.key}
              aria-disabled={tutorialAbilityId ? !tutorialTarget : !slot.ready}
              data-combat-ability={slot.id}
              data-skill-state={slot.state}
              title={`${slot.key} · ${slot.label} · ${slot.status}`}
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
              <span className="combat-ability-copy">
                <strong>{slot.label}</strong>
                <b className="combat-skill-status"><StatusIcon weight="fill" aria-hidden="true" />{slot.status}</b>
                {slot.activeRemaining > 0 && <small className="combat-skill-duration">효과 {formatCooldown(slot.activeRemaining)}초</small>}
              </span>
              <span className="combat-skill-meter" aria-hidden="true"><i style={{ transform: `scaleX(${slot.meter})` }} /></span>
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
        {player.reserveCharacterId && (
          <button
            type="button"
            className={`combat-tag-switch${player.tagReady ? " is-ready" : " is-cooling"}${player.characterId === "mika" ? " is-mika" : player.characterId === "vesper" ? " is-vesper" : player.characterId === "nox" ? " is-nox" : " is-aegis"}`}
            onClick={() => onTag?.()}
            disabled={!player.tagReady}
            aria-label={`T 캐릭터 교대. ${tagStatus}`}
            aria-keyshortcuts="T"
          >
            <span><kbd>T</kbd><strong>{player.reserveCharacterId === "mika" ? "미카" : player.reserveCharacterId === "vesper" ? "베스퍼" : player.reserveCharacterId === "nox" ? "녹스" : "이지스"}</strong></span>
            <small>{tagStatus}</small>
          </button>
        )}
      </div>
    </aside>
  );
}

