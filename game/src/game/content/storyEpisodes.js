// Scene CGs belong to the DOM story viewer; never preload them into combat.
export const STORY_ART = Object.freeze({
  aegis: '/assets/overload/story/awakening/aegis.webp',
  mika: '/assets/overload/story/awakening/mika.webp',
  vesper: '/assets/overload/story/awakening/vesper.webp',
  nox: '/assets/overload/story/awakening/nox.webp',
  hana: '/assets/overload/story/awakening/hana.webp',
  ilya: '/assets/overload/story/awakening/ilya.webp',
  sera: '/assets/overload/story/awakening/sera.webp',
  rhea: '/assets/overload/story/awakening/rhea.webp',
  title: '/assets/overload/story/awakening/citadel.webp',
});
const line = (art, speaker, text) => Object.freeze({ art, speaker, text });
export const STORY_EPISODES = Object.freeze({
  prologue: {
    title: '비가 그친 뒤에도', subtitle: 'PROLOGUE · 끊어진 고가선', requires: [], seen: 'story-prologue-seen',
    lines: [
      line('aegis', '이지스', '고가선은 여기서 끊겼어. 대피 열차는 마지막 신호를 남긴 뒤 사라졌고. …하지만 선로 아래에서 아직 사람의 목소리가 들려.'),
      line('aegis', '레아 · 무전', '확인했어. 헤이븐-09 관제관 레아야. 적의 감시 주기 사이로 구조 항로를 열었어. 네가 엄호해 주면 모두 데려올 수 있어.'),
      line('aegis', '이지스', '내 호출부호는 이지스. 마지막 한 사람이 탑승할 때까지 이 자리를 지킬게.'),
      line('rhea', '레아', '구조 명단 전원 확인. 이제 네 차례야, 이지스. 돌아올 곳이 없는 사람에게도 돌아올 곳은 필요하니까.'),
      line('rhea', '레아', '헤이븐-09에 온 걸 환영해. 첫 목표는 WRONG ENGINE의 추론핵. 사람을 숫자로만 읽는 저 기계에, 우리가 아직 살아 있다는 걸 알려 주자.'),
    ],
  },
  'core-fragment': {
    title: '기억하지 못하는 빛', subtitle: 'CHAPTER 01 · 회수한 추론핵', requires: ['wrong-engine-core'], seen: 'story-core-fragment-seen',
    lines: [
      line('hana', '하나', '추론핵에서 전투 명령을 분리했어요. 그런데 그 아래에 다른 기록이 있어요. 대피 방송, 구조 요청… 소버린이 지우려 했던 사람들의 목소리예요.'),
      line('hana', '이지스', 'WRONG ENGINE이 적으로 분류했던 건 우리 무기가 아니었군. 지워지지 않는 기억이었어.'),
      line('hana', '하나', '아직 결론은 일러요. 잡음 사이로 반복되는 좌표부터 대조하죠. 유리 사구의 중계점, 그리고 심해 기록고와 연결돼 있어요.'),
      line('ilya', '일리야', '기록은 내가 따로 보관하지. 추론핵을 그대로 기지망에 꽂는 실수는 안 해. 이 작은 정찰기에 격리해서 읽힐 거야.'),
      line('ilya', '일리야', '고장 난 기계라고 전부 쓸모없는 건 아니지. 이 녀석도 다음엔 누군가를 집으로 데려오는 눈이 될 거다.'),
    ],
  },
  recruit: {
    title: '네 궤도에 합류할게', subtitle: 'RECRUITMENT · MIKA', requires: ['wrong-engine-core'], seen: 'mika-recruit-seen',
    lines: [
      line('mika', '미카', '추론핵이 꺼지니까 격납고 문도 열리네! 저 천장, 진짜 우주처럼 보이지? 다 고장 난 항로 투영기야. 여기서 별만 세느라 지루해 죽는 줄 알았어.'),
      line('mika', '레아 · 무전', '신원 확인. 미카, 프리즘 블레이드 운용자. 탈출 경로를 보낼게. 링을 회수하고 수송정으로 와.'),
      line('mika', '이지스', '혼자서 이 격납고를 지킨 거야? 네가 만든 궤적 덕분에 적의 사각을 찾았어.'),
      line('mika', '미카', '그럼 다음엔 둘이서 만들자. 네가 길을 열면, 빈틈은 내가 채울게. 호출부호 미카—오늘부터 같은 궤도야!'),
    ],
  },
  'vesper-recruit': {
    title: '마지막 좌표의 지휘관', subtitle: 'RECRUITMENT · VESPER', requires: ['abyssal-archive'], seen: 'vesper-recruit-seen',
    lines: [
      line('vesper', '레아 · 무전', '기록고에서 지휘실 영상이 복원됐어. 창밖 함대는 과거의 전술 모의 화면이야. 실재하는 지원군으로 오인하지 마.'),
      line('vesper', '베스퍼', '알고 있어. 그래서 혼자 남았지. 존재하지 않는 함대에 구조 신호를 보내게 둘 순 없으니까.'),
      line('vesper', '이지스', '드라운드 오라클이 무너졌어. 네가 지켜 낸 좌표도 확보했고. 이제 그 의자에서 일어나도 돼.'),
      line('vesper', '베스퍼', '좋아. 다음 지휘실은 창밖에 진짜 동료가 보이는 곳이면 좋겠군. 호출부호 베스퍼. 정밀 차단과 기동 저격을 맡지.'),
    ],
  },
  'outer-signal': {
    title: '구름 너머의 응답', subtitle: 'INTERLUDE · 나이트자의 새 항로', requires: ['wrong-engine-core', 'glass-dune', 'abyssal-archive'], seen: 'story-outer-signal-seen',
    lines: [
      line('sera', '세라', '세 구역의 좌표를 겹쳤더니 항로가 하나 남았어. 지도에는 없는데, 구름 위에서 계속 같은 응답이 돌아와.'),
      line('sera', '이지스', '우리를 부르는 건가? 아니면 기다리고 있는 건가.'),
      line('title', '하나 · 분석 기록', '수신한 좌표를 시각화했어요. 이 하얀 성채는 추론핵이 그린 가상 구조예요. 실제 지형인지, 소버린의 내부 모델인지는 아직 알 수 없어요.'),
      line('title', '레아 · 무전', '세 구역의 기록으로 외곽 항로가 검증됐어. 출격 권한을 열었으니, 지금 확인된 길부터 확보하자. 세라에게 들르면 더 자세한 작전 브리핑도 받을 수 있어.'),
      line('sera', '세라', '돌아오는 길까지 그려 놓고 출발하자. 난 언제나 그쪽이 더 중요하거든. 헤이븐에서 기다릴게.'),
    ],
  },
  'nox-recruit': {
    title: '삭제할 수 없는 증거', subtitle: 'RECRUITMENT · NOX', requires: ['neon-foundry'], seen: 'nox-recruit-seen',
    lines: [
      line('nox', '이지스', '주조로의 통제망은 끊겼어. 그런데 옥상에서 우리를 따라오는 붉은 신호가 있어. 적의 표식인가?'),
      line('nox', '녹스', '아닙니다. 폐기 중인 심사 기록을 묶어 두는 봉인선입니다. 소버린이 사람들에게 내린 판결의 원본을 확보했습니다.'),
      line('nox', '레아 · 무전', '자료의 원본성과 탈출 경로를 확인했어. 헤이븐은 증언도, 증인도 보호해. 수송정으로 와.'),
      line('nox', '녹스', '호출부호 녹스. 표식 심사와 전장 처형을 담당하겠습니다. 다음 판결의 근거는 명령이 아니라, 우리가 직접 확인한 사실이어야 합니다.'),
    ],
  },
});
export function isStoryAvailable(id, completedRegionIds = []) {
  const episode = STORY_EPISODES[id];
  return Boolean(episode && episode.requires.every(region => completedRegionIds.includes(region)));
}
export function availableStoryEpisodes(completedRegionIds = []) {
  return Object.entries(STORY_EPISODES).filter(([id]) => isStoryAvailable(id, completedRegionIds));
}
