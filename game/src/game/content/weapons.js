function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

export const DEFAULT_MAIN_WEAPON_ID = "pulse-rifle";
export const BEAM_SWORD_UNLOCK_REGION_ID = "glass-dune";

export const MAIN_WEAPONS = deepFreeze({
  "pulse-rifle": {
    id: "pulse-rifle",
    name: "PULSE RIFLE",
    koreanName: "펄스 소총",
    role: "원거리 제압",
    description: "포인터 방향으로 고속 펄스탄을 자동 사격합니다. 산탄·레일·로켓 중심의 증강이 등장합니다.",
    treeLabel: "사격 통제 트리",
    unlockRegionId: null,
  },
  "beam-sword": {
    id: "beam-sword",
    name: "BEAM SWORD",
    koreanName: "빔 소드",
    role: "근접 광역 섬멸",
    description: "주변을 자동으로 베어 내며 검기·거대 검신·돌진 참격 중심의 증강이 등장합니다.",
    treeLabel: "공명 검술 트리",
    unlockRegionId: BEAM_SWORD_UNLOCK_REGION_ID,
    unlockDescription: "유리 사구 최초 클리어",
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

export function isMainWeaponUnlocked(mainWeaponId, completedRegionIds = []) {
  const weapon = getMainWeapon(mainWeaponId);
  if (!weapon.unlockRegionId) return true;
  return Array.isArray(completedRegionIds) && completedRegionIds.includes(weapon.unlockRegionId);
}

export function sanitizeMainWeaponIdForProgression(value, completedRegionIds = []) {
  const weaponId = sanitizeMainWeaponId(value);
  return isMainWeaponUnlocked(weaponId, completedRegionIds) ? weaponId : DEFAULT_MAIN_WEAPON_ID;
}
