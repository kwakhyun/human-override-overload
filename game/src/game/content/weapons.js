function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

export const DEFAULT_MAIN_WEAPON_ID = "pulse-rifle";

export const MAIN_WEAPONS = deepFreeze({
  "pulse-rifle": {
    id: "pulse-rifle",
    name: "PULSE RIFLE",
    koreanName: "펄스 소총",
    role: "원거리 제압",
    description: "포인터 방향으로 고속 펄스탄을 자동 사격합니다. 산탄·레일·로켓 중심 증강이 출현합니다.",
    treeLabel: "사격 통제 트리",
  },
  "beam-sword": {
    id: "beam-sword",
    name: "BEAM SWORD",
    koreanName: "빔 소드",
    role: "근접 광역 섬멸",
    description: "주변을 자동으로 베어내며 검기·거대 검신·돌진 참격 중심 증강이 출현합니다.",
    treeLabel: "공명 검술 트리",
  },
});

const ORDERED_MAIN_WEAPONS = Object.freeze(Object.values(MAIN_WEAPONS));

export function sanitizeMainWeaponId(value) {
  return Object.prototype.hasOwnProperty.call(MAIN_WEAPONS, value) ? value : DEFAULT_MAIN_WEAPON_ID;
}

export function getMainWeapon(value) {
  return MAIN_WEAPONS[sanitizeMainWeaponId(value)];
}

export function getMainWeapons() {
  return ORDERED_MAIN_WEAPONS;
}
