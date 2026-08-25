function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

export const DEFAULT_CHARACTER_ID = "aegis";

export const PLAYABLE_CHARACTERS = deepFreeze({
  aegis: {
    id: "aegis",
    name: "AEGIS",
    koreanName: "이지스",
    role: "정밀 제압 · 생존 전투",
    weaponName: "펄스 소총 · 빔 소드",
    description: "펄스 소총과 빔 소드를 상황에 맞춰 바꾸며 안정적으로 공격하고 버팁니다.",
    portraitAssetKey: "player",
    accent: "cyan",
    unlockRegionId: null,
    unlockRegionName: null,
    unlockDescription: "기본 지급 전투원",
    traitName: "적응형 병기 체계",
    traitDescription: "원거리와 근접 무장을 교체하며 어떤 전장에서도 안정적으로 대응합니다.",
  },
  mika: {
    id: "mika",
    name: "MIKA",
    koreanName: "미카",
    role: "고속 난전 · 연쇄 섬멸",
    weaponName: "프리즘 링블레이드",
    description: "분홍빛 에너지 고리를 튕겨 여러 적을 연달아 베어 내는 변칙 근접 전투원입니다.",
    portraitAssetKey: "mikaPortrait",
    accent: "magenta",
    unlockRegionId: "wrong-engine-core",
    unlockRegionName: "오답 엔진 중앙로",
    unlockDescription: "오답 엔진 중앙로 최초 클리어 시 합류",
    traitName: "연쇄 굴절",
    traitDescription: "공격이 주변 표적 사이를 튕기며 밀집한 적을 빠르게 정리합니다.",
  },
  vesper: {
    id: "vesper",
    name: "VESPER",
    koreanName: "베스퍼",
    role: "정밀 요격 · 고기동 사격",
    weaponName: "폴딩 레일 피스톨",
    description: "고속 기동으로 사선을 바꾸고 압축 레일탄으로 우선 표적을 정밀하게 제거합니다.",
    portraitAssetKey: "vesperPortrait",
    accent: "amber",
    unlockRegionId: "abyssal-archive",
    unlockRegionName: "심해 기록고",
    unlockDescription: "심해 기록고 최초 클리어 시 합류",
    traitName: "제로 벡터",
    traitDescription: "최대 내구도는 낮지만 이동 속도와 공격 피해, 발사 속도가 크게 증가합니다.",
  },
});

const ORDERED_CHARACTERS = Object.freeze(Object.values(PLAYABLE_CHARACTERS));

export function sanitizeCharacterId(value) {
  return Object.prototype.hasOwnProperty.call(PLAYABLE_CHARACTERS, value) ? value : DEFAULT_CHARACTER_ID;
}

export function getPlayableCharacter(value) {
  return PLAYABLE_CHARACTERS[sanitizeCharacterId(value)];
}

export function getPlayableCharacters() {
  return ORDERED_CHARACTERS;
}

export function isCharacterUnlocked(characterId, completedRegionIds = []) {
  const character = PLAYABLE_CHARACTERS[sanitizeCharacterId(characterId)];
  if (!character?.unlockRegionId) return true;
  return Array.isArray(completedRegionIds) && completedRegionIds.includes(character.unlockRegionId);
}

export function getUnlockedPlayableCharacters(completedRegionIds = []) {
  return ORDERED_CHARACTERS.filter((character) => isCharacterUnlocked(character.id, completedRegionIds));
}
