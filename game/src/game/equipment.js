export const WEAPONS = {
  pulse: {
    id: "pulse",
    name: "PULSE-7",
    korean: "펄스 카빈",
    description: "균형 잡힌 표준 에너지 소총",
    color: "#42efff",
    cooldown: 0.28,
    speed: 430,
    damage: 2.2,
    count: 1,
    spread: 0,
    size: 3.2,
  },
  arc: {
    id: "arc",
    name: "ARC NEEDLE",
    korean: "아크 니들",
    description: "빠른 탄속과 짧은 연사 간격",
    color: "#9f8cff",
    cooldown: 0.18,
    speed: 520,
    damage: 1.65,
    count: 1,
    spread: 0,
    size: 2.7,
  },
  scatter: {
    id: "scatter",
    name: "SCATTER-3",
    korean: "산탄 버스트",
    description: "근거리에서 강력한 3발 확산 사격",
    color: "#ffb75e",
    cooldown: 0.58,
    speed: 390,
    damage: 2.15,
    count: 3,
    spread: 0.16,
    size: 3.5,
  },
  rail: {
    id: "rail",
    name: "RAIL LANCE",
    korean: "레일 랜스",
    description: "적을 관통하는 고위력 단발 사격",
    color: "#f7fbff",
    cooldown: 0.92,
    speed: 720,
    damage: 6,
    count: 1,
    spread: 0,
    size: 4,
    piercing: true,
  },
};

export const ABILITIES = {
  shield: {
    id: "shield",
    name: "PHASE SHIELD",
    korean: "위상 방어막",
    description: "3.2초 동안 적 탄환을 무효화",
    type: "active",
    cooldown: 12,
  },
  emp: {
    id: "emp",
    name: "EMP BLOOM",
    korean: "EMP 블룸",
    description: "3초 동안 드론과 사격 AI를 마비",
    type: "active",
    cooldown: 13,
  },
  overclock: {
    id: "overclock",
    name: "OVERCLOCK",
    korean: "오버클럭",
    description: "대시 재사용 대기시간 30% 감소",
    type: "passive",
  },
  ghost: {
    id: "ghost",
    name: "GHOST MESH",
    korean: "고스트 메시",
    description: "드론 탐지 거리와 상승 속도 감소",
    type: "passive",
  },
};

export const INITIAL_LOADOUT = {
  weapons: ["pulse"],
  abilities: [],
  activeWeapon: "pulse",
};

const REWARD_POOLS = [
  ["arc", "scatter", "shield", "emp"],
  ["rail", "overclock", "ghost", "shield", "emp", "scatter", "arc"],
];

export function getEquipment(id) {
  return WEAPONS[id] ?? ABILITIES[id];
}

export function getRewardChoices(stageIndex, loadout) {
  const owned = new Set([...loadout.weapons, ...loadout.abilities]);
  return (REWARD_POOLS[Math.min(stageIndex, REWARD_POOLS.length - 1)] ?? [])
    .filter((id) => !owned.has(id))
    .slice(0, 4)
    .map(getEquipment);
}

export function applyReward(loadout, rewardId) {
  if (WEAPONS[rewardId]) {
    const weapons = loadout.weapons.includes(rewardId)
      ? loadout.weapons
      : [...loadout.weapons, rewardId].slice(-3);
    return { ...loadout, weapons, activeWeapon: rewardId };
  }
  if (ABILITIES[rewardId] && !loadout.abilities.includes(rewardId)) {
    return { ...loadout, abilities: [...loadout.abilities, rewardId] };
  }
  return loadout;
}

export function createWeaponProjectiles(weaponId, origin, facing) {
  const weapon = WEAPONS[weaponId] ?? WEAPONS.pulse;
  const center = (weapon.count - 1) / 2;
  return Array.from({ length: weapon.count }, (_, index) => {
    const angle = facing + (index - center) * weapon.spread;
    return {
      x: origin.x + Math.cos(angle) * 22,
      y: origin.y + Math.sin(angle) * 22,
      velocityX: Math.cos(angle) * weapon.speed,
      velocityY: Math.sin(angle) * weapon.speed,
      damage: weapon.damage,
      piercing: Boolean(weapon.piercing),
      color: weapon.color,
      size: weapon.size,
      life: 1.35,
      hitIds: [],
    };
  });
}
