export const MIKA_RECRUIT_DIALOGUE = Object.freeze([
  Object.freeze({ speaker: "레아", portrait: "rhea", text: "오답 엔진 잔해에서 저항군 신호를 잡았어. 생존자 한 명이 헤이븐-09에 구조를 요청하고 있어." }),
  Object.freeze({ speaker: "미카", portrait: "mika", text: "미카야! 네가 그 소문난 이지스지? 혼자 멋있는 건 불공평하니까, 다음 작전부터 나도 같이 갈게." }),
  Object.freeze({ speaker: "이지스", portrait: "aegis", text: "전투 기록은 확인했어. 명령을 따를 수 있다면 합류를 허가한다." }),
  Object.freeze({ speaker: "미카", portrait: "mika", text: "차갑기는. 그래도 방금 나 받아 준 거 맞지? 링블레이드 전투원 미카, 지금부터 팀에 합류합니다!" }),
]);

// Character dialogue lives outside the scenario timeline so each operative can
// keep a stable voice without duplicating campaign progression data.
const CHARACTER_DIALOGUE_OVERRIDES = Object.freeze({
  mika: Object.freeze({
    deployment: Object.freeze({
      1: "생존자 신호부터 확인하자. 아무도 놓치지 않을 거야.",
    }),
    "rook-trace": Object.freeze({
      1: "루크의 탄창… 진짜 끝까지 버틴 거네. 이 기록, 내가 반드시 이어 갈게.",
    }),
    "nyx-trace": Object.freeze({
      1: "닉스의 위상 칼날이야. 이 패턴, 내가 더 화려하게 되돌려줄 수 있겠는데?",
    }),
    "moss-trace": Object.freeze({
      1: "모스의 기록도 확보했어. 세 사람 몫까지 살아서 돌아가자.",
    }),
    "sovereign-panic": Object.freeze({
      0: "저 덩치가 우릴 겁주려는 모양인데, 미안하지만 난 겁먹을 시간도 없거든!",
    }),
    "engine-encounter": Object.freeze({
      1: "오답 엔진 확인. 저 핵을 깨면 다 같이 집으로 돌아갈 수 있어.",
    }),
    "engine-destroyed": Object.freeze({
      1: "좋아, 길이 열렸어! 헤이븐-09에 멋지게 귀환하자.",
    }),
    "glass-dune-deployment": Object.freeze({
      1: "반사 신호가 사방에서 튀어. 내 링블레이드가 길을 찾아낼게.",
    }),
    "glass-dune-encounter": Object.freeze({
      1: "거울 폭군이라… 빛을 되받는 솜씨라면 나도 자신 있어!",
    }),
    "glass-dune-destroyed": Object.freeze({
      1: "유리 사구 확보! 반짝이는 전리품은 내가 먼저 찜한다?",
    }),
    "abyssal-archive-deployment": Object.freeze({
      1: "침수 기록고야. 발밑 조심하고, 내 궤적만 따라와.",
    }),
    "abyssal-archive-encounter": Object.freeze({
      1: "침묵한 예언자 발견. 조용히 끝내 달라는 뜻으로 알아들을게.",
    }),
    "abyssal-archive-destroyed": Object.freeze({
      1: "기록 회수 완료! 이번에도 우리 팀워크가 정답이었네.",
    }),
    "neon-foundry-encounter": Object.freeze({
      1: "용광로 열기 상승 중. 뜨거워도 내 회전은 멈추지 않아!",
    }),
    "neon-foundry-destroyed": Object.freeze({
      1: "네온 주조소 정지 확인. 식기 전에 빠져나가자.",
    }),
    "storm-spire-encounter": Object.freeze({
      1: "번개가 내 링을 쫓아오네. 좋아, 누가 더 빠른지 해 보자!",
    }),
    "storm-spire-destroyed": Object.freeze({
      1: "폭풍 첨탑 제압! 하늘도 이제 우리 편이야.",
    }),
    "gene-vault-encounter": Object.freeze({
      1: "유전자 금고 핵심부야. 끝까지 같이 가는 거다, 약속!",
    }),
    "gene-vault-destroyed": Object.freeze({
      1: "마지막 봉인 해제! 이제 정말 모두에게 돌아갈 길이 생겼어.",
    }),
  }),
  vesper: Object.freeze({
    deployment: Object.freeze({ 1: "전술 링크 연결. 우선 표적부터 조용히 지울게." }),
    "rook-trace": Object.freeze({ 1: "루크의 탄착 흔적이야. 잔류 열원을 따라가면 만날 수 있어." }),
    "nyx-trace": Object.freeze({ 1: "닉스가 남긴 절단면을 찾았어. 교전 방향을 역산한다." }),
    "moss-trace": Object.freeze({ 1: "모스의 생체 기록 확보. 회수 경로를 열어 둘게." }),
    "sovereign-panic": Object.freeze({ 0: "경로 예측 실패. 그래도 포기할 시간은 없어. 돌파한다." }),
    "engine-encounter": Object.freeze({ 1: "오답 엔진 시야 확보. 약점 좌표를 고정했어." }),
    "engine-destroyed": Object.freeze({ 1: "중심부 붕괴 확인. 다음 사선으로 이동하자." }),
    "glass-dune-deployment": Object.freeze({ 1: "반사 지형 보정 완료. 내 탄도는 속이지 못해." }),
    "glass-dune-encounter": Object.freeze({ 1: "거울 폭군 조준 완료. 가짜 궤적부터 걷어 낸다." }),
    "glass-dune-destroyed": Object.freeze({ 1: "표적 소멸. 반사 신호도 전부 정지했어." }),
    "abyssal-archive-deployment": Object.freeze({ 1: "심해 기록고 진입. 여기서부터는 내가 길을 열게." }),
    "abyssal-archive-encounter": Object.freeze({ 1: "침몰한 예언자 확인. 기록과 함께 끝내자." }),
    "abyssal-archive-destroyed": Object.freeze({ 1: "기록 회수 완료. 이제 헤이븐-09가 내 귀환 지점이야." }),
    "neon-foundry-encounter": Object.freeze({ 1: "열원 과다. 냉각부 한 점만 꿰뚫으면 돼." }),
    "neon-foundry-destroyed": Object.freeze({ 1: "주조로 정지. 사선은 깨끗해." }),
    "storm-spire-encounter": Object.freeze({ 1: "낙뢰 주기 계산 완료. 빈 틈에 들어간다." }),
    "storm-spire-destroyed": Object.freeze({ 1: "폭풍 소거 확인. 다음 좌표를 줘." }),
    "gene-vault-encounter": Object.freeze({ 1: "유전자 금고 중심부 포착. 오염되기 전에 제거한다." }),
    "gene-vault-destroyed": Object.freeze({ 1: "생체 신호 전부 정지. 임무 종료." }),
  }),
});

export function resolveCharacterDialogueLine(scriptedLine, beat, index, characterId = "aegis") {
  if (!scriptedLine || scriptedLine.speaker !== "AEGIS" || characterId === "aegis") return scriptedLine;
  const localizedText = CHARACTER_DIALOGUE_OVERRIDES[characterId]?.[beat]?.[index];
  if (!localizedText) return scriptedLine;
  return Object.freeze({
    ...scriptedLine,
    speaker: characterId === "mika" ? "MIKA" : characterId === "vesper" ? "VESPER" : scriptedLine.speaker,
    text: localizedText,
  });
}
