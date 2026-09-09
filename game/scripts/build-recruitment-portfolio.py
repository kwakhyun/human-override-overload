"""Recruitment edit of the supplied AI portfolio; evidence baseline 75b6e0c.

Uses shared layout helpers and durable evidence under docs/project/media/recruitment.
Screenshots are actual QA/user captures, cropped only for readable detail.
No hiring outcomes, user metrics or new benchmarks are asserted.
"""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
from lib.portfolio_pdf import (OUT, TMP, W, H, INK, MUTED, CYAN, PALE, LINE, PAPER, DARK, PINK, colors, Image, ImageReader, PdfReader, begin_document, fill, text, para, box, card, band, shot, base, end, steps)
c=begin_document()

URL='https://human-override-overload.khyun97.chatgpt.site'
def crop(src,name,rect):
 p=TMP/(name+'.png');Image.open(src).crop(rect).save(p);return p
def lead(y,title,body):
 text(40,y,title,13,INK,True);para(40,y+29,515,body,11,MUTED,limit=76)
def row(y,label,body,h=72):
 text(40,y,label,10,CYAN,True);para(125,y,430,body,11,INK,limit=h-12)
 c.setStrokeColor(colors.HexColor(LINE));c.line(40,H-y-h,555,H-y-h)
def result(y,body,h=72):band(y,'확인 결과',body,h=h)
def footerlink(y):
 text(40,y,'게임 플레이 → human-override-overload.khyun97.chatgpt.site',9,CYAN,True)
 c.linkURL(URL,(40,H-y-20,555,H-y+3),relative=0)

before=ROOT/'docs/project/media/recruitment'
guide_before=crop(before/'defense-before.png','guide-before',(1420,100,1890,690))
guide_after=crop(ROOT/'docs/project/media/recruitment/ui-defense-guide-1440-1.png','guide-after',(980,88,1420,370))
drone_before=crop(before/'drone-before.png','drone-before',(455,100,760,490))
drone_after=crop(ROOT/'docs/project/media/recruitment/ui-drone-abyssal-archive.png','drone-after',(1040,190,1310,580))


def arrow(x1,y1,x2,y2,color=CYAN):
 import math
 c.saveState();c.setStrokeColor(colors.HexColor(color));c.setLineWidth(1.3)
 c.line(x1,H-y1,x2,H-y2)
 angle=math.atan2(y2-y1,x2-x1)
 for turn in (-0.55,0.55):
  c.line(x2,H-y2,x2-6*math.cos(angle+turn),H-(y2-6*math.sin(angle+turn)))
 c.restoreState()

def node(x,y,w,h,kicker,title,body,bg=PALE):
 box(x,y,w,h,bg);text(x+13,y+11,kicker,8,CYAN,True)
 text(x+13,y+29,title,12,INK,True)
 para(x+13,y+52,w-26,body,9.5,MUTED,limit=h-60)

def marker(x,y,n):
 fill(CYAN);c.setStrokeColor(colors.white);c.setLineWidth(1.5)
 c.circle(x,H-y,10,stroke=1,fill=1);text(x-3,y-6,str(n),9,'#FFFFFF',True)

# 1: The candidate's contribution, not the tool list, leads the cover.
fill(DARK);c.rect(0,0,W,H,stroke=0,fill=1)
shot(ROOT/'public/assets/overload/intro/start-screen-anime-v1.webp',0,0,W,290)
text(40,317,'HUMAN OVERRIDE: OVERLOAD',12,'#6ADAE9',True)
para(40,351,515,'플레이에서 발견한 문제를\n설계와 구현으로 해결했습니다',25,'#FFFFFF',True)
para(40,443,510,'AI와 함께 만든 웹 액션 게임을 직접 플레이하고 수정하며,\n기획부터 공개 배포까지 연결한 개인 프로젝트입니다.',12,'#BCD8E0')
text(40,517,'곽현  |  게임 기획·시스템 설계·구현·QA',12,'#6ADAE9',True)
for i,(label,title,body) in enumerate([
 ('01 · 조작 경험','읽고 선택할 수 있는 UI','깨진 방어전 안내와 명령 배치를 실제 조작 흐름에 맞춰 개선했습니다.'),
 ('02 · 전투 규칙','선택과 결과의 일치','출격 편성을 두 명으로 명확히 하고 태그·로딩·재도전에 같은 규칙을 적용했습니다.'),
 ('03 · 품질 판단','보이는 오류의 원인 수정','드론 방향과 프레임 분리 문제를 원본 기준으로 수정하고 재발 조건을 검증했습니다.')]):
 card(40+i*175,558,165,147,label,title,body,PALE)
text(40,734,'개인 프로젝트 · 2026.08 - 2026.09 · PC / 모바일 웹',9,'#BCD8E0')
text(40,762,'공개 게임  →  human-override-overload.khyun97.chatgpt.site',9,'#6ADAE9',True)
c.linkURL(URL,(40,H-786,555,H-753),relative=0)
text(40,803,'채용 제출용 포트폴리오 · 2026.09.07',8,'#BCD8E0');text(518,803,'01 / 09',8,'#BCD8E0');end()

# 2: A one-page reading map and clear ownership boundary.
base(2,'PROJECT & ROLE','무엇을 만들고, 무엇을 결정했는가','6개 구역과 4명 전투원으로 구성한 탑다운 액션 게임입니다.')
shot(ROOT/'docs/project/media/recruitment/ui-portrait-aegis-1440.png',40,137,515,245,'실제 로비 화면 · 연구·장비·출격과 캐릭터 상호작용을 한 공간에 배치했습니다.')
steps(423,[('기지 준비','연구·장비·지원'),('출격 편성','최대 두 전투원'),('전투·성장','웨이브와 보스'),('귀환','보상과 다음 구역')],79)
row(527,'내가 결정한 것','플레이 방향, 전투·성장 규칙, 출격 제한과 UI 우선순위를 정했습니다. 직접 플레이한 결과를 바탕으로 수정 범위와 품질 승인, 공개 여부를 판단했습니다.',81)
row(625,'AI와 수행한 것','Codex에 코드 탐색·구현·반복 수정을 맡기고, 생성 도구로 이미지·음향 후보를 제작했습니다. 결과는 실제 게임에 적용한 뒤 화면과 동작을 검수했습니다.',81)
band(729,'읽는 순서','조작 UI 개선(3쪽) → 편성 규칙(4쪽) → 에셋 품질(5쪽) → 3D 확장·저장 구조(6-7쪽) → 협업·검증(8-9쪽)',h=58);end()

# 3: A visible before/after establishes a concrete problem-solving story.
base(3,'CASE 01 · UI / UX','안내를 읽고 바로 조작할 수 있도록','방어전의 깨진 문장과 겹치는 버튼을 화면 장식이 아닌 조작 문제로 보았습니다.')
text(40,137,'개선 전 · 안내문이 좁은 열에 몰림',10,CYAN,True)
text(251,137,'개선 후 · 본문과 이동 버튼을 함께 읽기',10,CYAN,True)
shot(guide_before,40,165,188,239)
shot(guide_after,251,165,304,239)
text(40,412,'문제 확인 당시 화면과 수정 후 검수 화면에서 안내창 부분만 발췌했습니다.',8.5,MUTED)
row(451,'문제 발견','인물 이미지를 뺀 뒤에도 안내창의 2열 구조가 남아 본문이 좁은 칸에 몰렸습니다. 포탑 버튼도 기존 배치 규칙이 충돌해 이름과 아이콘이 겹쳤습니다.',82)
row(548,'판단·개선','안내는 한 열로 정리하고, 상태·전장·명령 영역을 분리했습니다. 작은 화면은 건설·포대 관리·전술 명령을 탭으로 나눠 필요한 조작을 읽을 공간을 확보했습니다.',82)
result(650,'데스크톱·모바일 세로·가로 화면에서 안내 4단계, 설치·강화·전문화·판매·공세 시작을 조작했습니다. ESC는 기지 이탈 대신 일시정지로 바꿨습니다.',91)
text(40,763,'설계 기준: 전장을 가리지 않으면서, 현재 선택과 다음 행동을 읽을 수 있어야 한다.',9,CYAN,True);end()

# 4: Enlarge the selected pair instead of shrinking a complete mobile screen.
base(4,'CASE 02 · GAME RULES','출격 때 고른 두 명만 교대하도록','편성 화면의 선택이 실제 전투까지 그대로 이어지도록 규칙을 정리했습니다.')
party=crop(ROOT/'docs/project/media/recruitment/ui-sortie-1920.png','sortie-selected-pair',(800,100,1540,572))
shot(party,40,138,515,328)
text(40,475,'실제 출격 준비 화면에서 편성 영역 발췌 · 선봉 이지스 / 교대 미카',8.5,MUTED)
box(40,503,515,39,PALE)
text(56,514,'기본 2명 선택',11,CYAN,True);arrow(171,523,212,523)
text(226,514,'선택한 두 명만 태그',11,INK,True);arrow(349,523,390,523)
text(408,514,'재도전에도 유지',11,INK,True)
card(40,565,165,137,'문제','선택의 의미가 약함','편성과 관계없이 해금한 전투원 전체를 태그할 수 있었습니다. 준비 화면에서는 매번 두 번째 인원을 추가해야 했습니다.')
card(215,565,165,137,'판단','두 명을 기본으로','선봉과 다른 한 명을 기본 선택합니다. 한 명만 해금했거나 직접 제외한 경우에는 단독 출격도 허용합니다.',PALE)
card(390,565,165,137,'적용','전투까지 같은 규칙','편성·전투 준비·태그·재도전이 같은 명단을 사용합니다. 교대 시 쿨다운을 유지하고 단독 출격은 태그를 막습니다.')
result(724,'모든 두 명 조합의 반복 교대를 검사했습니다. 실제 브라우저에서도 두 명 기본 선택과 출격 흐름을 확인했습니다.',65);end()

# 5: Art QA as reasoning, not asset-production volume.
base(5,'CASE 03 · VISUAL QA','드론이 걷는 듯 보이는 원인을 찾다','같은 이미지라도 전면 방향과 이동 방향이 어긋나면 전투가 어색해집니다.')
text(40,139,'개선 전 · 몸체가 이동 방향과 어긋남',10,CYAN,True)
text(304,139,'개선 후 · 붉은 전면부가 진행 방향을 향함',10,CYAN,True)
shot(drone_before,40,168,251,251);shot(drone_after,304,168,251,251)
text(40,428,'1-3구역 자폭 드론 · 서로 다른 전투 시점의 캡처를 확대해 방향을 비교했습니다.',8.5,MUTED)
row(462,'원인 확인','자폭 드론 원본은 붉은 전면부가 오른쪽을 향합니다. 여기에 위쪽을 향한 다른 에셋의 90도 보정까지 적용하면서, 다리가 달린 기계처럼 접근하는 모습이 나타났습니다.',83)
row(561,'수정 기준','원본의 전면 방향에 맞춰 회전 기준을 분리했습니다. 보행형 적과 보스는 발이 아래로 향하게 유지하고, 상공에서 본 비행체에만 진행 방향 회전을 허용했습니다.',83)
result(664,'8방향 회전 검사를 추가하고 1-3구역 실제 전투를 확인했습니다. 별도로 프레임 경계 밖에 이웃 이미지가 보이던 문제도 원본 분할 좌표부터 수정했습니다.',89)
text(40,774,'에셋의 해상도보다 먼저 확인한 것: 원본 시점, 프레임 경계, 실제 움직임의 일치.',9,CYAN,True);end()

# 6: Detail crop with editorial markers connects the image to the system design.
base(6,'SYSTEM EXTENSION','3D 지형을 더하면서 전투는 유지하기','기존 2D 캐릭터와 전투 감각을 살리고 구역별 공간 표현부터 확장했습니다.')
terrain=crop(ROOT/'docs/project/media/recruitment/storm-spire-3d-structure.png','terrain-detail',(480,135,1150,610))
shot(terrain,40,137,515,365)
marker(451,273,1);marker(178,382,2);arrow(191,382,216,382,'#73DFEE')
box(56,153,166,35,DARK,DARK);text(67,163,'폭풍 첨탑 · 실제 검수 화면',9,'#FFFFFF',True)
text(40,514,'01',10,CYAN,True);text(63,514,'3D 구조물 · 높이와 입체감',10,INK,True)
text(316,514,'02',10,CYAN,True);text(339,514,'2D 캐릭터 · 기존 표현 유지',10,INK,True)
text(40,540,'화면 일부를 확대했습니다. 번호와 설명은 문서에서 추가한 주석입니다.',8,MUTED)
card(40,572,165,130,'확장 범위','여섯 구역의 공간','캐릭터까지 전부 3D로 바꾸기보다 지형·구조물·그림자에 집중했습니다. 각 구역과 보스전에 적용했습니다.')
card(215,572,165,130,'일치 기준','보이는 곳과 충돌','전투 엔진의 이동·충돌 상태를 기준으로 2D 캐릭터와 3D 지형의 위치가 맞도록 연결했습니다.',PALE)
card(390,572,165,130,'전투 변화','파괴로 열리는 경로','일부 소형 구조물은 공격으로 파괴됩니다. 파괴 상태와 충돌을 함께 갱신해 이동·공격 경로가 열리게 했습니다.')
result(724,'여섯 구역의 일반 전장·보스전, 구조물 파괴와 카메라 투영을 검수했습니다. 화면 전환 후 그래픽 자원 정리도 확인했습니다.',65);end()

# 7: Separate save and music flows; keep historical measurement conditions visible.
base(7,'SERVICE DESIGN','저장과 로딩이 플레이를 막지 않도록','진행 기록은 끊김없이 이어가고, 로딩과 음악은 필요한 순간에만 처리했습니다.')
text(40,143,'01   저장은 즉시, 서버 동기화는 뒤에서',12,INK,True)
node(40,179,226,102,'플레이 결과','기기에 먼저 저장','로컬 저장을 완료한 뒤 다음 플레이로 이어집니다.')
node(329,179,226,102,'백그라운드 처리','서버에 동기화','응답을 기다리느라 진행이 멈추지 않도록 분리했습니다.')
arrow(278,228,317,228)
text(40,301,'연결이 끊겨도 기기의 기록은 유지',9.5,MUTED)
box(329,295,226,37,'white');text(342,306,'연결 복구 후 동기화 재시도',9,CYAN,True)
arrow(545,295,545,283)
text(40,366,'02   화면이 바뀌어도 같은 곡은 이어서',12,INK,True)
for x,label in [(40,'기지 로비'),(216,'연구실'),(392,'장비고')]:
 box(x,403,163,40,'white');text(x+48,416,label,10,INK,True)
 arrow(x+81.5,447,x+81.5,465)
box(40,469,515,59,PALE)
text(56,480,'공통 음악 관리자',11,CYAN,True)
text(56,502,'같은 곡 → 재생 유지    /    다른 곡 → 전환    /    복귀 → 재생 위치 복원',9.5,INK)
text(40,557,'03   출격에 필요한 자원부터 불러오기',12,INK,True)
para(40,584,515,'선택한 구역·무기·최대 두 전투원의 자산을 먼저 준비합니다. 보스 자산은 등장 전에, 고급 이미지 묶음은 기본 준비 이후에 불러오도록 분리했습니다.',10.5,MUTED,limit=49)
box(40,645,515,93,PALE)
text(56,659,'-47.8%',29,CYAN,True)
para(211,658,322,'첫 출격 필수 전송량 감소\n10.50MiB → 5.48MiB',12,INK,True)
text(56,710,'측정: 2026.08.31 · AEGIS / 펄스 소총 / 첫 구역 / full 프로필',8.5,MUTED)
para(40,750,515,'선택적 로딩으로 줄인 전송량입니다. 최신 3D 버전의 전체 로딩 시간이나 FPS를 측정한 수치는 아닙니다.',9,MUTED,limit=36);end()

# 8: A connected work loop shows ownership and review, with one concrete example.
base(8,'AI COLLABORATION','AI에 구현을 맡기고, 판단은 직접 했습니다','결과를 빠르게 만드는 것과 게임에 적용할 품질을 갖추는 것을 구분했습니다.')
text(40,145,'도구보다 먼저 정한 것: 이 게임에 필요한 범위',12,INK,True)
para(40,175,515,'대규모 군중 전투에 맞지 않는 잠입·엄폐 규칙은 철회했습니다. 실시간 동기화 부담이 큰 온라인 보스전도 보류하고 싱글 전투 액션에 집중했습니다.',11,MUTED,limit=62)
node(40,267,237,127,'01 · 직접 결정','문제와 완료 기준 정의','플레이 목적, 전투 규칙, 화면에서 보여야 할 정보를 먼저 정했습니다.')
node(318,267,237,127,'02 · AI와 수행','코드 탐색과 구현 반복','Codex로 원인을 좁히고 수정했습니다. 이미지·음성·음악 후보도 제작했습니다.','white')
node(318,441,237,127,'03 · 직접 검수','실제 게임에서 확인','PC·모바일에서 조작하고 화면을 보며 잘림·크기·방향·재생 오류를 확인했습니다.')
node(40,441,237,127,'04 · 판단과 기록','채택하거나 다시 수정','기준을 만족하면 반영하고 테스트·작업 규칙을 남겼습니다. 미달하면 다시 수정했습니다.','white')
arrow(284,330,311,330);arrow(436,402,436,433);arrow(311,505,284,505)
arrow(159,433,159,402)
box(40,592,515,73,PALE)
text(54,604,'실제 사례 · 자폭 드론의 이동 방향',10,CYAN,True)
para(54,627,487,'어색한 돌진 발견 → 원본의 정면 방향 확인 → 회전 보정 수정 → 8방향 테스트와 실제 전투 검수',10,INK,limit=33)
para(40,688,515,'반복되는 검수 항목은 테스트와 개인 플러그인에 정리했습니다. 전투원 추가 시 자산 등록·저장·전투 검수의 누락을 줄이기 위한 작업입니다.',10,MUTED,limit=47)
para(40,752,515,'활용 도구  ·  Codex / ImageGen / Grok(음성) / Suno AI(BGM 5곡) / Google Cloud TTS(시스템 음성)',8.5,MUTED,limit=29);end()

# 9: Consolidated, candid validation limits rather than repetitive disclaimers.
base(9,'EVIDENCE & NEXT STEPS','구현 결과와 검증 범위를 함께 제시합니다','아래 결과는 2026년 9월 6일 공개 배포본을 기준으로 정리했습니다.')
for i,(v,l) in enumerate([('419개','자동 테스트 통과'),('PC·모바일','브라우저 조작 검수'),('공개 배포','빌드와 반영 확인')]):
 box(40+i*175,140,165,83,PALE);text(53+i*175,153,v,20,CYAN,True);text(53+i*175,193,l,9,MUTED)
row(251,'무엇을 확인했나','전투·저장·화면 전환 테스트와 타입 검사·빌드를 통과했습니다. 기본 편성, 드론 방향, 방어전 조작과 네 캐릭터 말풍선을 실제 브라우저에서 확인했습니다.',84)
row(352,'어떤 화면인가','방어전은 1440×900, 390×844, 844×390에서 확인했습니다. 구역 선택은 1920×900·390×844, 전투원 상호작용은 데스크톱·모바일에서 검수했습니다.',84)
text(40,460,'다음 검증 과제',13,INK,True)
card(40,491,253,124,'사용성·밸런스','외부 플레이테스트','조작 이해도, 이탈·재도전 비율과 장기 자원 수급은 아직 측정하지 않았습니다. 실제 사용자 관찰로 조작과 성장 흐름을 평가할 단계입니다.')
card(302,491,253,124,'실행 환경','실기기 장시간 플레이','브라우저 화면 검수에 더해 실기기의 FPS·발열·메모리 검증이 필요합니다. 모바일 스토어 출시와 계정 기반 기기 간 저장 이전은 미제공 상태입니다.')
band(636,'제작 중 항목','게임에는 기존 일러스트 기반 상호작용을 적용했습니다. AEGIS 독립 Cubism 리깅은 호흡·머리카락·왼쪽 팔꿈치까지 작업한 로컬 검수 모델이며, 얼굴과 나머지 부위를 추가 제작 중입니다.',h=87)
footerlink(748)
text(40,779,'확인 가능한 소스: github.com/kwakhyun/human-override-overload · 75b6e0c',8,MUTED)
c.linkURL('https://github.com/kwakhyun/human-override-overload',(40,H-799,555,H-775),relative=0)
end();c.save()
r=PdfReader(OUT);assert len(r.pages)==9
plain='\n'.join(p.extract_text() for p in r.pages)
for s in ['곽현','419','75b6e0c','47.8','Cubism']:assert s in plain,s
assert '\ufffd' not in plain
print(OUT);print('Pages:',len(r.pages),'Bytes:',OUT.stat().st_size)
