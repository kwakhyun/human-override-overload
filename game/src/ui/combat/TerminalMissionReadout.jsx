import './terminal-mission.css';
export function TerminalMissionReadout({ mission, boss }) {
  if (!mission) return null;
  if (boss) return boss.terminalAdvice || boss.weakness > 0
    ? <p className="terminal-advice">{boss.weakness > 0 ? `코어 노출 · ${boss.weakness.toFixed(1)}초 동안 피해 2배` : boss.terminalAdvice}</p>
    : null;
  const target = mission.targets[0];
  const inRange = target && target.distance <= target.radius;
  return <section className="terminal-mission-readout" aria-label="작전 목표 안내">
    {mission.ark && <p className={mission.ark.hp / mission.ark.maxHp < .3 ? 'is-danger' : ''}>
      <strong>방주 선체 {Math.ceil(mission.ark.hp / mission.ark.maxHp * 100)}%</strong>
      <span>{mission.route === 'fast' ? '고속 항로' : mission.route === 'safe' ? '정비 항로' : '항로 선택 전'}</span>
    </p>}
    {target && <p className="terminal-target">
      <i aria-hidden="true" style={{ transform: `rotate(${target.angle}rad)` }}>➜</i>
      <strong>{target.label}</strong><span>{inRange ? (target.progress > 0 ? `${Math.floor(target.progress * 100)}%` : '범위 안') : `${target.distance}m`}</span>
    </p>}
    {mission.kind === 'escort' && !mission.route && mission.targets.length === 2 && <small>위: 고속·위험 / 아래: 정비·수리</small>}
  </section>;
}
