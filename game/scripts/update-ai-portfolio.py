"""Rebuild the supplied nine-page AI portfolio for the 2026-09-06 release.

Source: Downloads/human-override-overload-ai-report.pdf (2026-08-31).
Evidence: release 75b6e0c, AGENTS.md, docs/project/ai-usage-report-ko.md,
docs/live2d/aegis-parts-v2-session-2026-09-06.md, and reviewed qa/ui-* captures.
Historical measurements retain their original conditions; they are not new 3D benchmarks.
"""
from pathlib import Path
from html import escape
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.lib.utils import ImageReader
from PIL import Image, ImageOps
from pypdf import PdfReader

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'output/pdf/human-override-overload-ai-report-updated.pdf'
TMP=ROOT/'tmp/pdfs/ai-report-update'
TMP.mkdir(parents=True,exist_ok=True)
pdfmetrics.registerFont(TTFont('KR','C:/Windows/Fonts/malgun.ttf'))
pdfmetrics.registerFont(TTFont('KRB','C:/Windows/Fonts/malgunbd.ttf'))
W,H=595.2756,841.8898
INK='#102932'; MUTED='#506B77'; CYAN='#007E94'; PALE='#EAF7FA'; LINE='#BED4DC'; PAPER='#F7FBFC'; DARK='#061D26'; PINK='#FFF0F3'
c=canvas.Canvas(str(OUT),pagesize=(W,H),pageCompression=1)
c.setTitle('HUMAN OVERRIDE: OVERLOAD | AI 협업 개발 포트폴리오 | 2026.09.06')
c.setAuthor('kwakhyun');c.setSubject('Updated nine-page portfolio based on release 75b6e0c')
def fill(v):c.setFillColor(colors.HexColor(v))
def text(x,y,s,size=10,color=INK,bold=False):
 fill(color);c.setFont('KRB' if bold else 'KR',size);c.drawString(x,H-y-size,s)
def para(x,y,w,s,size=10,color=INK,bold=False,limit=None):
 style=ParagraphStyle('p',fontName='KRB' if bold else 'KR',fontSize=size,leading=size*1.55,textColor=colors.HexColor(color),wordWrap='CJK')
 p=Paragraph(escape(s).replace('\n','<br/>'),style);_,h=p.wrap(w,900)
 if limit is not None:assert h<=limit,(s[:30],h,limit)
 p.drawOn(c,x,H-y-h);return h
def box(x,y,w,h,bg='white',border=LINE):
 fill('#FFFFFF' if bg=='white' else bg);c.setStrokeColor(colors.HexColor(border));c.roundRect(x,H-y-h,w,h,7,stroke=1,fill=1)
def card(x,y,w,h,label,title,body,bg='white'):
 box(x,y,w,h,bg);text(x+12,y+11,label,8,CYAN,True)
 th=para(x+12,y+29,w-24,title,12,INK,True)
 para(x+12,y+35+th,w-24,body,9.5,MUTED,limit=h-43-th)
def band(y,label,body,bg=PALE,h=66):
 box(40,y,515,h,bg);text(53,y+12,label,9,CYAN,True);para(145,y+12,397,body,9.5,MUTED,limit=h-21)
def shot(path,x,y,w,h,caption=None):
 im=Image.open(path).convert('RGB'); im=ImageOps.contain(im,(int(w*2.5),int(h*2.5)))
 fill(DARK);c.roundRect(x,H-y-h,w,h,5,stroke=0,fill=1)
 iw,ih=im.size;dw=min(w,iw/2.5);dh=min(h,ih/2.5)
 c.drawImage(ImageReader(im),x+(w-dw)/2,H-y-(h+dh)/2,dw,dh)
 if caption:para(x,y+h+6,w,caption,8,MUTED,limit=28)
def base(n,section,title,subtitle):
 fill(PAPER);c.rect(0,0,W,H,stroke=0,fill=1);fill(DARK);c.rect(0,H-31,W,31,stroke=0,fill=1)
 text(40,10,'HUMAN OVERRIDE: OVERLOAD  /  '+section,7,'#ACDDE6');text(512,10,f'{n:02d} / 09',7,'#ACDDE6')
 text(40,55,f'{n-1:02d}',10,CYAN,True);para(76,51,479,title,19,INK,True,limit=59);para(76,91,479,subtitle,9,MUTED,limit=44)
 c.setStrokeColor(colors.HexColor(LINE));c.line(40,43,555,43);text(40,806,'AI 협업 게임 개발 포트폴리오 · 2026.09.06 개정',7,MUTED);text(535,806,str(n),8,MUTED)
def end():c.showPage()
def steps(y,items,h=75):
 gap=8;w=(515-gap*(len(items)-1))/len(items)
 for i,(title,body) in enumerate(items):
  x=40+i*(w+gap);box(x,y,w,h);text(x+10,y+9,f'{i+1:02d}',8,CYAN,True);para(x+10,y+25,w-20,title,10,INK,True);para(x+10,y+44,w-20,body,8.5,MUTED,limit=h-48)

# 1 / Cover retains the dark key-art opening of the supplied portfolio.
fill(DARK);c.rect(0,0,W,H,stroke=0,fill=1)
shot(ROOT/'public/assets/overload/intro/start-screen-key-art.webp',0,0,W,305)
text(40,332,'HUMAN OVERRIDE: OVERLOAD',11,'#62D8E8',True)
para(40,359,515,'AI와 함께 웹 게임을\n설계하고 검증한 과정',27,'#FFFFFF',True)
para(40,452,505,'아이디어를 실제 플레이 가능한 게임으로 만들고, 사용자 피드백을 구현·검증·배포로 연결한 개인 프로젝트입니다.',12,'#B9D4DC')
text(40,517,'6개 3D 구역  /  4명 전투원  /  PC + 모바일 웹',11,'#9DDEEA',True)
for i,(label,title,body) in enumerate([
 ('문제','AI 결과는 검증 전 초안','코드와 에셋을 실제 전투와 UI에 적용한 뒤 어색한 동작과 실패 조건을 찾았습니다.'),
 ('판단','플레이로 기준 보완','품질 기준을 정하고, 재현한 문제를 구현과 테스트·작업 규칙에 함께 반영했습니다.'),
 ('결과','공개 서비스로 연결','3D 배경과 2D 전투, 2인 태그와 방어전, 익명 클라우드 저장을 공개했습니다.')]):
 card(40+i*175,555,165,156,label,title,body,PALE)
text(40,733,'개인 프로젝트 / 2026.08 - 2026.09 / 기획·설계·구현·AI 제작·QA·배포',8,'#B9D4DC')
text(40,760,'PUBLIC DEMO → human-override-overload.khyun97.chatgpt.site',9,'#62D8E8',True)
c.linkURL('https://human-override-overload.khyun97.chatgpt.site',(40,H-780,555,H-753),relative=0)
text(40,798,'공개본 기준: 2026.09.06 · 75b6e0c',8,'#B9D4DC');text(516,798,'01 / 09',8,'#B9D4DC');end()

# 2 / Summary and development decisions.
base(2,'EXECUTIVE SUMMARY','MVP 개발 과정과 방향 전환','초안 생성보다 적용 기준, 직접 플레이와 수정 근거를 중심으로 개발했습니다.')
shot(ROOT/'qa/ui-drone-abyssal-archive.png',40,133,515,188,'최신 검수: 심해 기록고의 3D 바닥과 전면 방향으로 접근하는 2D 자폭 드론')
for i,(v,l) in enumerate([('6개','3D 작전 구역'),('4명','플레이 전투원'),('60Hz','고정 간격 엔진'),('3슬롯','로컬 + 클라우드')]):
 box(40+i*131,355,122,60);text(50+i*131,364,v,19,CYAN,True);text(50+i*131,394,l,8,MUTED)
band(429,'검증 가설','AI 초안을 기존 규칙에 맞춰 적용한 뒤 직접 QA하고, 구현과 함께 테스트·작업 기준을 갱신하는 반복 개발을 진행했습니다.',h=68)
text(40,519,'2026년 8월 - 9월 개발 흐름',13,INK,True)
steps(548,[('잠입·지휘','대규모 교전에 맞지 않아 전환'),('온라인 보스','응답 지연으로 실시간 적용 제외'),('생존 액션','웨이브·성장·보스 구조 확립'),('현재 공개본','3D 지형·2인 편성·UI 개선')],90)
band(661,'최신 확장','6개 구역과 보스방의 3D 배경, 일부 구조물 파괴, 스프라이트 방향 보정, 방어전 조작과 캐릭터 말풍선을 개선했습니다.',h=75)
text(40,762,'담당 범위: 기획 / React·Phaser·Three.js / 에셋 적용 / 서버 저장 / QA·배포',8.5,MUTED);end()

# 3 / Rules, pair selection and unlocks.
base(3,'PRODUCT INTENT','게임의 핵심 플레이 구조','기지의 준비, 2인 편성, 전투 보상과 다음 구역 개방을 하나의 루프로 연결했습니다.')
shot(ROOT/'qa/ui-portrait-aegis-1440.png',40,132,253,157,'현재 로비: 얼굴 아래에 배치한 상호작용 말풍선')
shot(ROOT/'qa/ui-region-1920.png',302,132,253,157,'구역 선택: 좌측 상단 제목과 분리된 뒤로가기')
card(40,325,253,117,'01 · 편성','기본 두 명, 선택된 두 명만 태그','현재 전투원과 다른 해금 전투원 한 명을 기본 선택합니다. 한 명만 해금했거나 예비를 제외하면 단독 출격합니다.')
card(302,325,253,117,'02 · 성장','Q에서 E-F-R로 단계적 습득','전투원별 스킬 습득 상태와 재사용 대기시간을 교대 후에도 유지합니다. 연구·장비·항공 지원은 기지에서 준비합니다.')
steps(459,[('준비','연구·장비·지원'),('편성','최대 2명과 구역'),('전투','웨이브·성장·보스'),('귀환','재화·다음 구역')],72)
text(40,552,'전투원 개방 조건과 역할',13,INK,True)
rows=[('AEGIS','기본','생존형 전술 요원'),('MIKA','01구역 첫 클리어','연쇄 공격과 보호막'),('VESPER','03구역 첫 클리어','고기동 정밀 요격'),('NOX','04구역 첫 클리어','표식 분배·모노와이어 처형')]
box(40,578,515,132)
for i,(a,b,d) in enumerate(rows):
 y=587+i*30;text(52,y,a,10,CYAN,True);text(149,y,b,9);text(305,y,d,9)
band(730,'진행 규칙','1-3구역을 모두 클리어하면 다음 권역이 열립니다. 브리핑 대화는 추가 출격 잠금 조건으로 사용하지 않습니다.',h=57);end()

# 4 / Added Three.js responsibility and destruction ownership.
base(4,'SYSTEM DESIGN','판정은 엔진에, 표현은 렌더러에','실시간 3D 배경을 추가하면서도 기존 2D 전투와 결정론적 판정 구조를 유지했습니다.')
steps(137,[('React UI','메뉴·HUD·대화'),('60Hz 엔진','이동·피해·상태'),('Phaser','입력·카메라·2D'),('Three.js','지형·구조물·파편')],85)
shot(ROOT/'qa/storm-spire-3d-structure.png',40,245,253,158,'폭풍 첨탑: 구역 테마에 맞춘 구조물')
shot(ROOT/'qa/gene-vault-3d-rubble.png',302,245,253,158,'생체 금고: 파괴 후 잔해 표현 · 이전 지형 검수 캡처')
card(40,446,253,135,'CASE 01','6개 구역의 3D 배경','유리 사막, 침수 기록고, 네온 주조구, 폭풍 첨탑, 생체 금고까지 확장했습니다. 지형은 코드로 만든 메시·절차적 재질이며 캐릭터와 VFX는 2D입니다.')
card(302,446,253,135,'CASE 02','파괴와 충돌을 같은 상태로','지정된 작은 구조물은 탄환과 검 공격으로 파괴됩니다. 파괴 즉시 이동·사격 경로가 열리며 잔해는 시각 효과입니다. 처치 수나 경험치를 주지 않습니다.')
card(40,597,253,120,'CASE 03','한 카메라와 같은 좌표','Phaser 카메라와 시계에 3D 투영을 동기화합니다. 별도 애니메이션 루프나 물리 엔진을 추가하지 않고, WebGL 실패 시 대체 배경을 사용합니다.',PALE)
card(302,597,253,120,'CASE 04','원본 시점에 맞춘 스프라이트','보행형 적·보스는 발이 아래로 향하게 유지합니다. 1-3구역 자폭 드론은 오른쪽을 향한 원본 전면부에 맞춰 불필요한 90도 보정을 제거했습니다.',PALE)
text(40,748,'보스 경고와 피해 판정은 같은 좌표·반경을 사용하며 패링·폭탄 제거도 엔진이 판정합니다.',9,MUTED);end()

# 5 / Service and historical performance evidence.
base(5,'SERVICE & PERFORMANCE','오프라인 저장과 에셋 전달 구조','브라우저에서 전투를 실행하고 저장 복제와 에셋 전달을 Worker·D1·R2로 분리했습니다.')
steps(137,[('브라우저','로컬 3슬롯 저장'),('Worker API','입력·리비전 검사'),('D1','진행 기록 복제'),('R2','런타임 에셋 캐시')],85)
card(40,243,253,143,'저장 순서','로컬 기록 뒤 비동기 동기화','진행은 로컬에 즉시 기록하고 업로드는 뒤에서 처리합니다. 네트워크가 끊겨도 플레이를 유지하며 재연결 시 다시 동기화합니다. 리비전 충돌은 슬롯별 시각을 비교합니다.',PALE)
card(302,243,253,143,'서비스 경계','익명 기기 저장과 검증','기기 토큰은 해시로 저장하고 동일 출처, 본문 크기와 슬롯 구조를 검사합니다. 계정 로그인과 기기 간 저장 이전은 현재 제공 범위에 포함하지 않습니다.',PINK)
text(40,409,'선택한 콘텐츠만 로드하는 전략',14,INK,True)
card(40,441,253,119,'런타임 로딩','구역·무기·선택 편성에 맞춤','선택한 최대 두 전투원의 전투 자산과 구역을 준비합니다. 보스방은 별도 진입 시 로드하며, 보상 이미지는 준비 이후 유휴 시간에 읽습니다.')
card(302,441,253,119,'패키징','제작 이력과 배포 파일 분리','제작용 원본은 보존하되 현재 빌드는 이력용 파일 46개, 21.41MiB를 배포에서 제외합니다. 영상·음원 Range 요청은 정적 원본으로 전달합니다.')
text(40,582,'과거 측정 기록 · 2026.08.31 에셋 분석',12,INK,True)
for i,(v,l) in enumerate([('-47.8%','full: 10.50 → 5.48MiB'),('-55.5%','performance: 7.51 → 3.34MiB')]):
 box(40+i*262,611,253,73,PALE);text(53+i*262,621,v,22,CYAN,True);text(53+i*262,655,l,10,MUTED)
band(705,'측정 범위','새 AEGIS 슬롯·펄스 소총·첫 구역 조건의 과거 전송량 비교입니다. 최신 3D 배경과 새 스프라이트를 포함한 재측정치나 전체 로딩 시간·VRAM 개선율이 아닙니다.',h=79);end()

# 6 / Fresh UI captures.
base(6,'UI / UX','출격 준비와 캐릭터 상호작용 개선','정보를 더 넣기보다 선택·상태·조작을 읽을 수 있도록 배치와 동작을 정리했습니다.')
shot(ROOT/'qa/ui-sortie-390.png',40,137,162,351,'출격 준비: 두 명 기본 편성')
shot(ROOT/'qa/ui-region-390.png',216,137,162,351,'구역 선택: 제목과 탐색 분리')
shot(ROOT/'qa/ui-portrait-vesper-390.png',392,137,163,351,'말풍선: 얼굴 아래에 고정')
card(40,529,165,146,'01 · 출격','이해할 수 있는 작전 정보','한국어 적 구성·보스 위험과 대응, 보상·진행 조건을 제공합니다. 실제 보스 이미지는 올바르게 분리한 프레임을 표시합니다.')
card(215,529,165,146,'02 · 일러스트','일관된 비율과 대화 위치','전투원 비율과 NPC 대화 구도를 통일했습니다. 머리만 흔드는 연출을 제거하고, 말풍선은 인물 영역 안쪽에 배치합니다.')
card(390,529,165,146,'03 · 음악','화면과 독립적인 재생','앱 수명 동안 하나의 BGM 재생기를 유지합니다. 같은 곡이면 위치를 이어가고, 다른 곡에서 돌아오면 저장한 재생 위치를 복원합니다.')
band(688,'모바일 조작','터치 이동·자동 조준을 PC와 같은 전투 입력으로 변환합니다. 세로 화면에서도 레벨업 선택, 스킬 사용과 보스방 자동 전환이 이어지도록 구성했습니다.',h=83);end()

# 7 / Defense, current management + UI response.
base(7,'DEFENSE MODE','독립 타워 디펜스와 명령 UI','3개 스테이지, 스테이지별 12개 패드와 4종 포탑을 별도 결정론 엔진으로 구현했습니다.')
shot(ROOT/'qa/ui-defense-manage-1440.png',40,135,337,223,'최신 데스크톱 검수: 상단 상태·전장·하단 명령 분리')
shot(ROOT/'qa/ui-defense-manage-390.png',391,135,164,355,'모바일: 건설·관리·전술 탭')
card(40,402,337,116,'개선 사례','좁은 열에 몰린 안내와 버튼을 재구성','인물 이미지 제거 뒤 남은 안내창의 2열 배치를 1열로 바꿨습니다. 포탑 이름·비용·강화·철거 금액과 공격 수치가 잘리지 않도록 정리했습니다.',PALE)
steps(539,[('작전 선택','3종 지휘 전술'),('포탑 배치','다음 빈 패드 선택'),('전투 개입','명령·우선순위'),('관리·보상','강화·전문화·철거')],78)
card(40,634,253,112,'전술 선택','설치 후에도 바뀌는 판단','3종 표적 우선순위, 2단계 전문화 분기, Q/W/E 전술 명령과 조기 공세 호출을 제공합니다. 0/1/2배속과 ESC 일시정지를 지원합니다.')
card(302,634,253,112,'검증 경계','조작 검수와 밸런스는 별개','가이드 4단계와 설치·강화·전문화·판매·공세 시작을 브라우저에서 확인했습니다. 외부 사용자 이해도와 장기 자원 수급은 아직 검증하지 않았습니다.',PINK)
text(40,765,'캠페인과 공유: 프로필 재화·저장·설정 / 모드별 소유: 포탑·적·웨이브·코어 상태',8.5,MUTED);end()

# 8 / Updated tools + honest Live2D checkpoint.
base(8,'AI WORKFLOW','Codex와 제작 도구를 활용한 개발','AI에 맡긴 구현과 사람이 결정한 방향·품질 기준을 구분해 기록했습니다.')
steps(135,[('기준 확인','기존 규칙·제약'),('AI 초안','코드·에셋 후보'),('직접 QA','플레이·화면 검수'),('기준 보완','수정·테스트·문서')],78)
card(40,233,253,134,'CODEX DESKTOP','구현과 반복 수정 지원','코드 탐색, 구조 변경, 에셋 적용과 테스트 작성을 맡겼습니다. 직접 만든 전투원 제작 플러그인과 Game Studio 스킬로 등록·성장·스프라이트 검수 순서를 표준화했습니다.',PALE)
card(302,233,253,134,'보조 제작 도구','시각·음향 작업을 분리','ImageGen으로 이미지 후보를 만들고 Grok으로 영상을 제작했습니다. Suno AI로 만든 BGM 5곡을 적용했으며 전술 음성에는 Google Cloud TTS를 사용했습니다.')
card(40,385,253,127,'직접 결정한 사항','게임 규칙과 품질 승인','방향 전환, 전투 수치, 편성 제한과 UI 상태를 결정했습니다. 화면 캡처로 잘림·비율·진행 방향을 지적하고 최종 적용 및 공개 여부를 판단했습니다.')
card(302,385,253,127,'스프라이트 후처리','원본 분리부터 다시 검수','셀 크기만 맞추는 대신 원본 프레임 좌표와 해시를 확인했습니다. 이웃 프레임 노출을 수정하고 스킬 스타일, 지상·비행체 방향 규칙을 통일했습니다.')
box(40,533,515,146,PALE);text(53,545,'LIVE2D · 완료 범위와 제작 중 범위',9,CYAN,True)
para(53,567,489,'현재 게임은 승인된 일러스트와 호흡·눈깜박임·부위 반응을 유지합니다. 머리 포즈 이동은 제거했습니다. 별도의 AEGIS Cubism v2는 24개 소재 메시와 실제로 작성한 4개 채널(호흡·앞머리·뒷머리·왼쪽 팔꿈치)을 가진 로컬 검수 모델입니다.',10,MUTED)
para(53,639,489,'얼굴 분리, 가려진 면, 오른팔·옷 물리는 추가 제작이 필요합니다. 완성 모델의 게임 적용은 보류한 상태입니다.',9.5,INK)
band(700,'폐기와 재개','잠입·지휘·온라인 보스 초안은 현재 액션 방향과 맞지 않아 폐기했습니다. 과거 리깅도 품질 미달로 제외한 뒤, Cubism Editor에서 AEGIS 부위 분리와 독립 리깅 제작을 다시 시작했습니다.',h=83);end()

# 9 / Latest release verification, old benchmarks and limits.
base(9,'VALIDATION & LIMITS','검증 방식과 현재 제공 범위','최신 배포 확인, 과거의 조건부 성능 기록과 아직 검증하지 않은 영역을 나눴습니다.')
for i,(v,l) in enumerate([('419개','전체 테스트 통과'),('통과','TypeScript·Vite 빌드'),('반영 확인','공개 JS·CSS 일치')]):
 box(40+i*175,136,165,74,PALE);text(53+i*175,147,v,21,CYAN,True);text(53+i*175,183,l,9,MUTED)
band(229,'최신 검수','1440×900, 390×844, 844×390 방어전 조작, 1920×900·390×844 기본 편성, 네 전투원의 말풍선, 1-3구역 드론 방향을 확인했습니다. 배포 커밋은 75b6e0c입니다.',h=84)
text(40,334,'조건을 명시한 과거 성능 기록',13,INK,True)
card(40,363,165,140,'과거 기록 01','시뮬레이션 약 2.85배','동일 시드, 적 220기·투사체 620개 조건. step 중앙값 280.969 → 98.599μs. 최신 3D 화면의 FPS 수치가 아닙니다.')
card(215,363,165,140,'과거 기록 02','텍스처 추정치 -55.4%','모바일 전투의 RGBA8 추정치 58.317 → 26.025MiB. 물리 GPU VRAM 실측값이나 최신 에셋 전체 수치가 아닙니다.')
card(390,363,165,140,'과거 기록 03','첫 출격 에셋 -47.8%','2026.08.31 AEGIS 첫 출격 full 프로필 전송량 비교입니다. 현재 3D 빌드 로딩 시간의 개선율로 해석하지 않습니다.')
text(40,525,'아직 확인하지 못한 부분',13,INK,True)
card(40,554,165,126,'LIMIT 01','사용자·밸런스 지표','외부 플레이테스트의 이탈률·재도전율·조작 이해도와 장기 자원 수급은 측정하지 않았습니다.',PINK)
card(215,554,165,126,'LIMIT 02','기기와 출시 범위','실기기 장시간 FPS·발열·메모리 검증과 모바일 스토어 출시는 완료하지 않았습니다. 본 문서는 공개 웹 버전 기준입니다.',PINK)
card(390,554,165,126,'LIMIT 03','계정과 Live2D','계정 로그인·기기 간 저장 이전은 제공하지 않습니다. AEGIS 독립 리깅과 다른 전투원의 완성 Cubism 모델도 미완료입니다.',PINK)
box(40,706,515,80,DARK,DARK);text(54,718,'PUBLIC DEMO',9,'#6ADAE9',True)
text(54,740,'human-override-overload.khyun97.chatgpt.site',11,'#FFFFFF',True)
text(54,765,'최신 공개본: 2026.09.06 / v31 / 소스 커밋 75b6e0c',8,'#B9D4DC')
c.linkURL('https://human-override-overload.khyun97.chatgpt.site',(40,H-786,555,H-706),relative=0);end()
c.save()
r=PdfReader(OUT);assert len(r.pages)==9
alltext='\n'.join(p.extract_text() for p in r.pages)
for required in ['419','Three.js','75b6e0c','24개','2인','BGM']:
 assert required in alltext,required
print(OUT)
print('Pages:',len(r.pages),'Bytes:',OUT.stat().st_size)
