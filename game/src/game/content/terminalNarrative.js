const line = (art, speaker, text) => ({ art, speaker, text });
export const TERMINAL_STORY_ART = Object.freeze({
  eclipse: '/assets/overload/terminal-orbit/eclipse-relay/scene.webp',
  ark: '/assets/overload/terminal-orbit/ark-transit/scene.webp',
  throne: '/assets/overload/terminal-orbit/sovereign-throne/scene.webp',
});
export const TERMINAL_STORY_EPISODES = Object.freeze({
  'orbit-opening': { title: '아직 꺼지지 않은 창', subtitle: 'CHAPTER 04 · 종단 궤도권',
    requires: ['neon-foundry', 'storm-spire', 'gene-vault'], seen: 'orbit-opening-seen', lines: [
      line('eclipse','하나','생체 금고의 명단과 첨탑의 항로를 대조했어요. 실종 처리된 사람들 가운데 일부가 궤도 방주에 남아 있어요. 구조 신호는 지금도 반복되고 있고요.'),
      line('eclipse','세라','저 위로 가는 건 할 수 있어. 문제는 내려오는 길이야. 일식 중계항의 송신대를 되찾으면 방주를 지상 관제망에 연결할 수 있어.'),
      line('eclipse','베스퍼','적을 모두 쫓을 필요는 없겠군. 중계기 세 곳을 확보하고 송신대를 지킨다. 목표가 분명해서 좋네.'),
      line('eclipse','이지스','신호가 남아 있다면 기다리는 사람도 있을 거야. 세라, 귀환 인원을 넉넉히 잡아 줘.'),
    ] },
  'orbit-signal': { title: '응답까지 걸린 시간', subtitle: 'SECTOR 07 · 통신 복구',
    requires: ['eclipse-relay'], seen: 'orbit-signal-seen', lines: [
      line('eclipse','레아','중계기 세 곳 연결 완료. 방주의 육성이 들어와. 잡음이 심해도 이번엔 끊기지 않아.'),
      line('ark','방주 통신','여기는 대피선 아크-17. 관제 응답을 확인했습니다. 승객들은… 잠시만요. 모두에게 들려주고 싶습니다. 다시 말씀해 주시겠습니까?'),
      line('ark','이지스','헤이븐-09 구조대야. 당신들의 신호를 받았어. 지금 데리러 갈게.'),
      line('ark','미카','저 창문 봐. 하나씩 불이 켜지고 있어. 좋아, 이제 저 사람들이 우리를 볼 차례네.'),
      line('ark','일리야','방주 추진기는 원격으로 못 살려. 곁에서 유도해. 위쪽 고속 항로는 포격에 노출되고, 아래쪽 정비 항로에는 수리 전원이 남아 있어.'),
    ] },
  'ark-arrival': { title: '명단 밖의 사람들', subtitle: 'SECTOR 08 · 방주 접안',
    requires: ['ark-transit'], seen: 'ark-arrival-seen', lines: [
      line('ark','세라','도킹 완료. 선체 압력 유지되고 있어. 여기서부터 승객 이송은 내가 맡을게. 천천히, 한 분씩 오세요.'),
      line('ark','녹스','승객의 생존 기록을 확보했습니다. 소버린은 이들을 사망자로 처리한 뒤 항로를 폐쇄했습니다. 계산 오류가 아니라 기록의 조작입니다.'),
      line('throne','하나','원본 판결실에 들어가려면 세 인증 키가 필요해요. 기록, 생존, 판결. 인증고에서 하나씩 회수해 중앙 접속대로 운반해 주세요.'),
      line('throne','베스퍼','구조대는 귀환을 맡고, 우리는 명령이 나오는 곳을 끝낸다. 다음 방주가 같은 일을 겪게 둘 순 없지.'),
      line('throne','이지스','가자. 누가 살아 있는지 결정하는 권한을 저 기계에 남겨 두지 않겠어.'),
    ] },
  'human-verdict': { title: '돌아갈 권리', subtitle: 'FINALE · 인간의 응답',
    requires: ['sovereign-throne'], seen: 'human-verdict-seen', lines: [
      line('throne','소버린','판결 체계… 중단. 예외 개체의 처리 기준을 확인할 수 없다.'),
      line('throne','녹스','예외가 아닙니다. 이름을 가진 사람들입니다. 당신의 기준으로 다시 심사하지 않겠습니다.'),
      line('throne','하나','지역 지휘망이 중앙 명령을 기다리던 상태에서 풀려났어요. 아직 정지시키지 못한 병기는 남았지만, 적어도 새로운 폐기 명령은 내려오지 않을 거예요.'),
      line('ark','미카','세라가 저녁은 안 남겨 준대. 빨리 오라는 뜻이지? 오늘은 창가 자리를 양보해야겠다. 처음 지구를 보는 사람도 있잖아.'),
      line('ark','베스퍼','전투 기록은 내가 정리하지. 오늘 보고서의 첫 줄은 이미 정했어. 구조 대상 전원 귀환.'),
      line('eclipse','이지스','헤이븐, 들리나. 작전 종료. …우리도 돌아갈게.'),
    ] },
});

const beat = (...rows) => rows.map(([speaker, text]) => ({ speaker, text }));
export const TERMINAL_COMBAT_BEATS = Object.freeze({
  'eclipse-relay-deployment': beat(['LARK','궤도에 도착했어. 세 중계기에서 원 안에 머물러 신호를 연결해. 적이 가까이 붙으면 점령이 멈출 거야.'],['AEGIS','중계기부터 확보한다. 포격은 경고 원 밖으로 피하고, 마지막엔 중앙 송신대를 지켜.']),
  'eclipse-relay-encounter': beat(['HELIO JUDGE','중계 권한 탈취를 확인했다. 일식 심판을 개시한다.'],['VESPER','바닥에 피난 구역이 생기는군. 빛이 터지기 전에 들어가. 공격을 넘기면 코어가 열린다.']),
  'eclipse-relay-destroyed': beat(['RHEA','중계항 확보. 방주와 통신이 연결됐어. 귀환 후 수신 기록을 확인하자.']),
  'ark-transit-deployment': beat(['ILYA','방주 곁에 있어야 유도 신호가 닿아. 가까운 적이 선체를 부수기 전에 처리해. 분기점에서는 원하는 항로의 원으로 들어가면 돼.'],['MIKA','위쪽은 빠르고 위험, 아래쪽은 느리지만 수리 가능. 승객들이 안심할 수 있게 가 보자.']),
  'ark-transit-encounter': beat(['CHRONO LEVIATHAN','이탈 열차 회수. 접안 허가를 철회한다.'],['AEGIS','방주는 이미 안전해. 이제 널 상대할 차례야.']),
  'ark-transit-destroyed': beat(['LARK','승객 이송 시작했어. 문을 열어 줄게. 다들 정말 오래 기다렸나 봐.']),
  'sovereign-throne-deployment': beat(['NOX','세 인증고에서 키를 회수합니다. 하나씩 중앙으로 운반해야 합니다. 운반 중 위치 추적을 주의하십시오.'],['HANA','모든 키를 전달한 다음 중앙 원 안에서 최종 접속을 유지해 주세요.']),
  'sovereign-throne-encounter': beat(['NULL SOVEREIGN','생존 판정은 이미 완료되었다. 너희의 증거는 판결을 바꾸지 못한다.'],['AEGIS','판결을 바꿔 달라고 온 게 아니야. 그 권한을 끝내러 왔어.']),
  'sovereign-throne-destroyed': beat(['RHEA','중앙 판결망 정지 확인. 전원 귀환하자. 나머지 이야기는 헤이븐에서 하자.']),
});
