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
    weaponName: "선택 메인 장비",
    description: "펄스 소총과 빔 소드를 교체하며 안정적인 화력과 방어를 운용합니다.",
    portraitAssetKey: "player",
    accent: "cyan",
  },
  mika: {
    id: "mika",
    name: "MIKA",
    koreanName: "미카",
    role: "고속 난전 · 연쇄 섬멸",
    weaponName: "프리즘 링블레이드",
    description: "핑크 에너지 고리를 튕겨 다수의 적을 연쇄 절단하는 변칙 근접 전투원입니다.",
    portraitAssetKey: "mikaPortrait",
    accent: "magenta",
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
