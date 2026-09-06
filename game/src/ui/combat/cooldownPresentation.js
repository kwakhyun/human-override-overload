// HUD-only formatting. Never advance a timer independently of the simulation.
export function formatCooldown(seconds) {
  const remaining = Math.max(0, Number(seconds) || 0);
  if (remaining === 0) return "0";
  // Round up so a positive engine timer can never read as zero / ready.
  return remaining < 10 ? (Math.ceil(remaining * 10) / 10).toFixed(1) : String(Math.ceil(remaining));
}

export function cooldownPresentation({ remaining = 0, cooldownMax = 1, locked = false, blocked = false, available = true, ready = true } = {}) {
  const cooling = remaining > 0;
  const state = locked ? "locked" : blocked ? "blocked" : cooling ? "cooling" : !available ? "unavailable" : ready ? "ready" : "waiting";
  const status = {
    locked: "잠김", blocked: "행동 불가", cooling: `${formatCooldown(remaining)}초`,
    unavailable: "대상 없음", ready: "사용 가능", waiting: "대기",
  }[state];
  return {
    state, status, ready: state === "ready",
    meter: locked ? 0 : Math.max(0, Math.min(1, 1 - remaining / Math.max(0.01, cooldownMax))),
  };
}
