# Design QA — TRAIN ME WRONG: OVERLOAD

- 검증일: 2026-08-10
- 브라우저: Codex 인앱 브라우저
- 데스크톱 뷰포트: 1440×810, DPR 1
- 모바일 가로 뷰포트: 812×375, DPR 1
- 시작 화면 원본: `reference/source-assets/overload/intro/start-screen-key-art-user.png`
- 은발 AEGIS 원본: `reference/source-assets/overload/hero/silver-aegis-portrait-user-chroma.png`
- 시작 화면 캡처: `qa/intro-implementation-1440x810.png`
- 대사창 캡처: `qa/dialogue-silver-aegis-1440x810.png`
- 모바일 캡처: `qa/intro-mobile-landscape-812x375.png`,
  `qa/dialogue-mobile-landscape-812x375.png`
- 비교 이미지: `qa/intro-design-comparison.png`, `qa/dialogue-design-comparison.png`
- 360° 시점 검증: `qa/silver-aegis-360-rotation-preview.png`
- 오른쪽 어깨 견착 아틀라스: `qa/silver-aegis-motion-preview.png`
- 전용 전투 VFX 아틀라스: `qa/combat-fx-atlas-preview.png`
- 스킬 모션 아틀라스: `qa/skill-motion-atlas-preview.png`
- 활성 도트 스킬 아틀라스: `qa/manual-ability-pixel-atlas-preview.png`,
  `qa/automatic-skill-pixel-atlas-preview.png`
- 점진형 게이트 스폰: `qa/progressive-gate-spawn.png`
- 스킬 모션 실전 화면: `qa/skill-motion-combat.png`, `qa/omega-laser-live.png`
- 최신 모바일 가로 전투: `qa/mobile-landscape-combat-812x375.png`
- OMEGA LASER 아틀라스 단독 렌더: `qa/omega-laser-atlas-only.png`
- SKYFALL 전용 경고·충돌: `qa/skyfall-warning-atlas-only.png`, `qa/skyfall-impact-atlas-only.png`
- 진행 경로 미니맵: `qa/route-minimap-desktop.png`, `qa/route-minimap-mobile-812x375.png`
- 레벨업 일러스트 비교: `qa/reward-design-comparison.png`
- 중심 카메라 보스전: `qa/boss-centered-vfx-1440x810.png`
- 모바일 보스전: `qa/boss-centered-mobile-landscape-812x375.png`
- 모바일 보상 선택: `qa/reward-cards-mobile-landscape-812x375.png`
- 최신 큰 글자 가이드: `qa/latest-rhea-guide-desktop-1440x810.png`,
  `qa/latest-rhea-guide-mobile-812x375.png`
- 실제 HUD 스포트라이트: `qa/latest-combat-tutorial-desktop-1440x810.png`,
  `qa/latest-combat-tutorial-mobile-812x375.png`

## 비교 결과

`qa/intro-design-comparison.png`은 1920×1080 사용자 원본을 1440×810으로 정규화하고 같은
1440×810 인앱 브라우저 캡처와 한 화면에 배치했습니다. 원본의 캐릭터·거대 엔진·적 군단 구도를
그대로 유지하면서 좌측 어두운 영역에 제목, 한 줄 목표, 시작 버튼, 핵심 조작만 추가했습니다.
기존 헤더, 통계 카드, 적 몽타주, 위협 카운터와 푸터는 제거되어 키 아트가 주 화면으로 읽힙니다.

`qa/dialogue-design-comparison.png`은 사용자 제공 은발 캐릭터 상반신과 실제 대사창을 한 화면에
배치했습니다. 런타임은 인물을 재생성하지 않고 초록 배경만 투명화했으며, 머리·어깨·가슴 상단까지
확대 크롭합니다. 데스크톱과 812×375 모바일 가로 화면에서 모두 대사 텍스트와 겹치지 않습니다.

## 반복 검토

### Iteration 1 — passed

- 시작 화면 1440×810: 제목과 CTA 대비가 충분하고 핵심 인물의 얼굴, 소총, 보스 코어를 가리지 않음.
- 모바일 가로 812×375: 제목, 목표, CTA와 조작 정보가 한 화면 안에 유지됨.
- 모바일 세로 375×812: 가로 모드 회전 안내가 나타나며 전투 시뮬레이션이 일시 정지됨.
- 시작 CTA, Phaser 진입, 배치 대사, 보상 선택을 실제로 조작함.

### Iteration 2 — blocked

- 첫 은발 5×3 아틀라스는 오른쪽 조준에서는 자연스러웠지만 머리·상체·코트에 약한 사선 원근이
  남아 전체 스프라이트를 다른 방향으로 회전할 때 항공 카메라가 흔들려 보였음.

### Iteration 3 — passed

- AEGIS를 얼굴·가슴 전면이 전혀 보이지 않는 90° true-nadir 정사영으로 다시 생성함.
- 15개 셀을 하나의 공통 스케일과 256×256 중앙 피벗으로 재정규화함.
- `qa/silver-aegis-360-rotation-preview.png`에서 실제 런타임 첫 프레임을 45° 간격으로 8방향
  회전해 정수리, 어깨·등, 무기 상면과 코트 테일이 동일한 천장 시점을 유지함을 확인함.
- 인앱 브라우저에서 실제 Phaser 캔버스의 좌·우·상·하 조준을 입력해 캡처함.
- 로드 실패 이미지 0개, Phaser 캔버스 1개를 확인함.

### Iteration 4 — passed

- AEGIS 15개 모션 프레임 모두에서 소총 개머리판을 오른쪽 어깨에 견착하고, 오른손 방아쇠와
  왼손 전방 지지가 유지되는 새 true-nadir 아틀라스로 교체함.
- 새 런타임 첫 프레임을 45° 간격으로 회전한 `qa/silver-aegis-360-rotation-preview.png`에서
  오른쪽 어깨 견착, 중앙 피벗, 수직 항공 시점이 8방향 모두 유지됨을 재확인함.
- 기본 펄스·산탄·레일·로켓, 머즐 플래시, 노바·공중 폭격, 전용 장갑 피격·폭발을 4×3
  전투 VFX 아틀라스와 품질별 Phaser 이미지 풀에 연결함. 실제 전투 화면에서 기본 공격이
  원형 구체가 아닌 길고 방향성 있는 소총 탄도로 표시됨.
- 18개 활성 보상마다 고유 384×384 WebP 일러스트를 연결함. 1440×810에서는 3장 비교가
  한눈에 들어오고, 812×375에서는 세로 카드 목록과 스크롤로 모든 선택을 유지함.
- 일반전과 보스전 모두 카메라 좌표를 AEGIS와 정확히 일치시킴. 보스방 시작 위치를 조정해
  0.78 줌에서도 미도색 가장자리 없이 AEGIS는 중앙, 3단계 보스는 화면 우측을 압도하도록 구성함.
- 812×375 모바일 가로 보스전과 375×812 세로 회전 가드를 다시 확인함.
- 새 브라우저 탭에서 시작 화면과 보상 디버그 장면을 로드해 콘솔 warning/error 0개를 확인함.

### Iteration 5 — passed

- 초반 활성 적을 36기로 낮추고 레벨·처치·경과 시간에 따라 220기까지 단계적으로 증가하는
  압력 상한을 적용함. 후속 964기는 네 차례 증원으로 정확히 분배됨.
- 적이 AEGIS 주변 허공에 생성되지 않고 전장에 배치된 5개 SOVEREIGN 게이트에서 개방 →
  물질화 → 전진 순서로 등장함을 `qa/progressive-gate-spawn.png`에서 확인함.
- 전진 거리를 플레이어의 실제 월드 좌표 하나로 통일하고 일반전 월드를 13,200px로 확장함.
  좌우 이동 속도 대칭과 기존 1,920px 경계 밖 투사체 생존을 자동 테스트로 검증함.
- 공중 폭격, Ω 레이저, 전기 계열, 게이트 개방을 6×4 전용 모션 아틀라스로 교체함.
  실제 Phaser 화면 `qa/skill-motion-combat.png`, `qa/omega-laser-live.png`에서 재생을 확인함.
- 당시 E 키 자동 사격 토글을 시험했으나 이후 요구 변경으로 완전히 제거했습니다. 현재 기본 공격은
  항상 자동이며 E는 독립 수동 방어 기술 AEGIS WARD에만 사용됩니다.
- 모든 대표 전투 스킬이 이미 마스터된 디버그 빌드에서 비어 있는 보상 카드가 생기는 경계
  문제를 발견해 수정하고 회귀 테스트를 추가함.
- 812×375 모바일 가로 전투에서 핵심 HUD, 캐릭터 중심 카메라, AUTO 상태를 확인했고
  최신 인앱 브라우저 콘솔 warning/error는 0개임.

### Iteration 6 — passed

- OMEGA LASER 아틀라스 위에 남아 있던 광폭 Phaser Graphics 선을 제거함. 랭크 3의 노란
  사각형 폴백 대신 전용 포신·에너지 빔 셀을 실제 1,500 유닛 판정 거리까지 확장해 표시함.
- SKYFALL을 `telegraphGraphics`와 일반 충격파 원형 패스에서 제외함. 조준 링, 낙하탄,
  지면 충돌, 확산 폭발, 잔광으로 이어지는 아틀라스 프레임만 보이는 것을 실제 전투에서 확인함.
- 우측 하단에 AEGIS, ROOK·NYX·MOSS 흔적, 엔진 노드, 현재 섹터와 다음 동쪽 목표를 표시하는
  소형 경로 미니맵을 추가함. 모바일 가로에서는 상단 HUD 아래로 축소 이동해 터치 조작과 겹치지 않음.
- `qa/omega-laser-atlas-only.png`, `qa/skyfall-warning-atlas-only.png`,
  `qa/skyfall-impact-atlas-only.png`에서 단순 노란 사각형·원형 폴백이 사라졌음을 확인함.
- 데스크톱과 812×375 모바일 가로에서 경로 미니맵의 진행 노드와 다음 목표를 확인했고,
  최신 인앱 브라우저 콘솔 warning/error는 0개임.

### Iteration 7 — passed

- WRONG ENGINE CORE는 균형형, GLASS DUNE은 저격 플랫폼 우세, ABYSSAL ARCHIVE는 자폭
  드론 우세로 초기 36기와 후속 증원 조합을 분리했습니다. 고정 1,000기 예산, 5개 게이트,
  성장형 220기 압력 상한은 유지됩니다.
- MIRROR TYRANT의 `PRISM LATTICE`·`SOLAR FLARE`, DROWNED ORACLE의
  `MEMORY SPIRAL`·`DEPTH COLLAPSE`를 추가했습니다. Phaser 경고가 엔진의 동일 geometry를
  읽으며 자동 테스트로 경고선·폭발점·수축 링과 실제 피해 판정의 일치를 확인했습니다.
- HAVEN-09의 HANA 연구실과 ILYA 장비고를 실제 조작했습니다. 각 시설은 3개 업그레이드 라인,
  3랭크, 현재/다음 효과, 지역 해방 잠금, DATA/PARTS 비용을 표시하며 구매 결과는 다음 출격의
  피해·경험치·이동·연사·내구도·회복 계산에 반영됩니다. QA 중에는 기존 저장 자원을 소비하지
  않았습니다.
- 812×375 모바일 가로에서 ILYA 장비 카드 3개가 한 화면에 정렬되고 모든 구매 CTA가 잘리지
  않음을 확인했습니다.
- 초기 페이지에는 Phaser vendor/runtime/view 청크가 없었습니다. GLASS DUNE 출격 시 공통
  전투 자산과 `regions/glass-dune/route.webp`만 추가됐고, GLASS DUNE 보스방·폼 및 ABYSSAL
  자산은 요청되지 않았습니다. 보스방·폼은 1,000기 전멸 후 입장 확정 시 별도 로드됩니다.
- 프로덕션 청크는 `phaser-vendor` 1,684.94kB raw / 381.36kB gzip,
  `overload-simulation` 78.38kB, `overload-view` 38.44kB,
  `overload-runtime` 15.51kB, `overload-assets` 6.45kB입니다. 빌드 경고와 브라우저
  console warning/error는 모두 0개였습니다.
- 전체 회귀 테스트 159/159, Sites 검사 4/4, TypeScript 검사와 production build가 통과했습니다.

### Iteration 8 — passed

- AEGIS를 192px 셀의 8×9, 총 72프레임 수직 항공 아틀라스로 교체했습니다. 조준 방향을
  기준으로 전진·후진·상하 스트레이프를 분리하고 정지 사격·대시·피격/스턴·사망 클립을
  독립 행으로 구성했습니다. 이동 사격은 이동 클립을 우선해 소총 반동 때문에 몸 전체가
  흔들리던 현상을 제거했습니다.
- 적은 ID별 클립 시계를 유지하며 spawn/move/windup/attack/hit/death 상태를 기존 5×3
  아틀라스에 결정론적으로 매핑합니다. 동료·설치물은 원본 정적 프레임을 왜곡하지 않고 소환,
  이동 안정화, 반동, 펄스만 보간하며 보스는 3단계 폼 위에 경고·공격·변신·피격·사망 상태를
  부드럽게 적용합니다.
- ROOK·NYX·MOSS 흔적을 54·58·62px로 축소해 74px AEGIS보다 작게 유지했습니다.
- 중앙 하단 HUD는 360 HP 바를 가장 크게 표시하고 아래에 SPACE 대시와 Q NULL SNARE,
  E AEGIS WARD, F STRATOS RUN, R HELIX TEMPEST 버튼·쿨다운을 배치했습니다. 812×375에서는 좌상단 도크,
  우상단 미니맵, 좌하단 투명 D-pad로 분리해 서로 겹치지 않습니다.
- 4-FRONT RECALL과 기본 공격 토글 경로를 제거했습니다. 기본 공격은 계속 자동이며 Q는
  중력 포획·투사체 굴절, E는 회복·임시 실드·상태 방어, F는 3항로 순차 소사, R은
  360° 4랜스 회전 광역기입니다. 네 수동 기술은 레벨업 자동 스킬 상태와 완전히 분리됩니다.
  키 반복 입력은 무시하고 같은 API를 모바일 버튼도 사용합니다.
- ESC로 전투를 정지하고 계속·처음부터·해금 시 기지 귀환을 선택할 수 있습니다. SKYFALL
  좌표 확정 배너는 한 런에서 최초 1회만 표시하면서 후속 SFX/VFX는 유지합니다.
- THE WRONG ENGINE 1단계 돌진만 경고를 1.05초, 이동을 0.68초로 완화하고 접촉 피해를
  낮췄습니다. 2·3단계와 다른 지역 보스 규칙은 변경하지 않았습니다.
- Playwright로 1440×810과 812×375를 실제 조작해 Q/E/R 키보드, F 클릭, 모바일 Q 터치,
  ESC 재개, 첫 보스 코어 노출을 확인했습니다. DOM 겹침과 브라우저 console/page/HTTP 오류는
  0개였습니다. 전체 회귀 테스트 174/174, Sites 4/4, TypeScript 및 production build가
  통과했고 Phaser vendor 청크는 1,684.94kB raw / 381.36kB gzip입니다.

### Iteration 9 — passed

- 자폭 드론·소총수·저격수 3종을 각각 6×4/24프레임, 헌터 드론·펄스 센트리·억제 드론을
  각각 5×4/20프레임, 세 지역 보스를 각각 6×4/24프레임 전용 시트로 교체했습니다. 적은 공통,
  동료는 실제 획득 시, 보스는 입장 확정 시 로드합니다.
- Q/E/F/R은 `gravitySnare`·`aegisWard`·`stratosRun`·`helixTempest`라는 별도 엔진 상태,
  쿨타임, 이벤트, 판정 기하를 사용합니다. 레벨업 ARC/NOVA/SKYFALL/OMEGA는 자동 빌드로 남고
  어느 수동 기술도 기존 자동 폭격 원·오메가 빔 엔티티를 재사용하지 않습니다.
- 수동 기술은 6×4/192px 전용 ImageGen 모션 시트를 사용합니다. STRATOS의 세 편대 셀은
  정사각 비율로 이동시키고 긴 항로는 세 개의 실제 캡슐 판정선으로 그려, 포신/기체를 길게
  늘이는 왜곡을 차단했습니다. HELIX의 네 실제 랜스는 3.2초 동안 여러 바퀴 회전합니다.
- 신규 관제관 RHEA 일러스트와 첫 출격 브리핑을 추가했습니다. 자동 빌드와 직접 승인 회선을
  명시적으로 구분하고 네 키의 용도·쿨타임·권장 타이밍을 설명하며 완료 상태는 슬롯별 저장됩니다.
  HAVEN-09의 RHEA에게서 언제든 다시 열 수 있습니다.
- Edge/RTX 4060 Ti에서 적 220기·투사체 620개를 240프레임 계측했습니다. 데스크톱·모바일
  전장 scene P95는 21.5ms, render-submit P95는 9.1~9.4ms였고, 수동 기술 시트를 포함한
  Phaser RGBA8 추정치는 전장 55.164MiB입니다. 8개 통합 시나리오의 console/page 오류는 0개였습니다.
- 1440×810과 812×375에서 RHEA 가이드, 중앙 하단/모바일 좌상단 전투 도크, Q/E 키보드,
  F 버튼, R 키보드, 모바일 Q 터치를 다시 조작했습니다. 수동 시전 후 18/28/34/72초 쿨타임이
  올바르게 표시되고 HUD·미니맵·D-pad는 겹치지 않았습니다.

### 캐릭터 TTS — 활성 대사 연결

- `src/audio/characterTts.js`의 브라우저/OS Web Speech API 발화를 RHEA 브리핑·실전 가이드,
  HAVEN-09 NPC, AEGIS·관제실·세 지역 보스의 실제 현재 대사에 연결했습니다.
  한국어 음성을 우선 선택하고 AEGIS·RHEA·HANA·ILYA·LARK·OPERATOR 및 지역 보스별로
  고정 pitch/rate/volume 프로필을 적용하는 구조입니다.
- 자동 재생은 허용하지 않으며 첫 사용자 클릭·키·터치 제스처가 확인된 뒤에만 발화합니다.
  Web Speech API 미지원 또는 정책 차단 환경은 대화 흐름에 영향을 주지 않는 무음 폴백 대상입니다.
- 이 기반은 외부 TTS, 음성 복제 또는 캐릭터 전용 음원 파일이 아닙니다. 실제 목소리와 음질은
  장치·운영체제·브라우저·설치된 한국어 음성에 따라 달라집니다.
- 문장과 화면 전환, 전체 사운드 음소거 시 이전 발화를 취소합니다. Codex 인앱 브라우저는
  Web Speech API를 노출하지 않아 무음 폴백을 확인했고, 모의 합성기 회귀 테스트로 한국어
  우선 선택·프로필·우선순위 교체·취소·dispose 계약을 검증했습니다.

### Iteration 10 — passed

- RHEA 첫 브리핑을 실제 800×600 전투 크롭, 데스크톱 15–17px 본문, 모바일 10–11px 본문,
  한 문장 요약과 최대 두 항목으로 재구성했습니다. 첫 출격 뒤 전투를 정지하고 실제 하단
  Q/E/F/R 버튼을 순서대로 강조하는 DOM 스포트라이트를 추가했습니다.
- `abilityGuideSeen`과 `combatOverlaySeen`은 슬롯별로 독립 저장되며 기존 슬롯은 새 실전
  오버레이를 한 번 볼 수 있도록 안전하게 false로 마이그레이션합니다. DEV `?debug=1`은 두 안내를
  명시적으로 우회하고 RHEA 재브리핑은 실전 오버레이 기록을 초기화하지 않습니다.
- 수동 Q/E/F/R과 자동 SKYFALL/ARC/NOVA/OMEGA를 두 개의 6×4/64px 도트 아틀라스로
  교체하고 NEAREST 필터를 적용했습니다. 기존 세 대형 스킬 시트를 active manifest에서 제거해
  디코딩 메모리를 9.75MiB에서 1.59375MiB로 83.65% 절감했습니다. 게이트는 기존 고품질 행만
  6×1로 분리했으며 1행 아틀라스가 row 0을 읽도록 런타임 감사를 통해 교정했습니다.
- 새 도트 효과가 실제 발동된 1440×810 전투 화면을 다시 800×600으로 크롭해 네 가이드 예시를
  갱신했습니다. 데스크톱 가이드 핵심 문장은 17px/25.5px이고, 812×375에서도 네 탭·예시·요약이
  한 화면 안에 유지됩니다. 실전 오버레이는 데스크톱과 모바일 모두 실제 Q 슬롯을 강조하며
  전투 도크·미니맵·D-pad와 겹치지 않았습니다.
- Edge 브라우저 재생 QA는 데스크톱 Q/E/F/R·SPACE, 모바일 Q 터치, 보스 1단계와 ESC 흐름을
  통과했고 console/page 오류는 0개였습니다. 전체 회귀 테스트 201/201, Sites 4/4,
  TypeScript 및 production build가 통과했습니다.
- RTX 4060 Ti 단독 220적/620투사체 재현은 CINEMATIC에서 scene/rAF/render-submit P95
  21.7/7.1/10.3ms, scene drop 0.4%였습니다. 8개 연속 배치는 스케줄러·governor 변동으로
  동일 전장 scene P95가 데스크톱 28.5ms, 모바일 30.7ms였지만 render-submit P95는
  11.8/8.3ms였습니다. 전장 중복 제거 RGBA8 추정치는 47.007MiB로 이전 55.164MiB보다
  8.157MiB 감소했습니다. 물리 VRAM과 GPU 완료 시간은 브라우저 API가 공개하지 않습니다.
- TTS는 실제 대사 표면에 연결됐지만 Codex 인앱 브라우저에는 Web Speech API가 없어 의도한
  무음 폴백으로 동작했습니다. 지원 브라우저의 모의 합성기 테스트에서는 한국어 우선 선택,
  캐릭터별 프로필, 사용자 제스처 게이트와 화면 전환 취소를 검증했습니다.

### Iteration 11 — passed

- 판정·입력·스폰·쿨타임을 담당하는 결정론 엔진은 계속 60Hz 고정 스텝으로 실행하고,
  표시 계층만 CINEMATIC 1280×720/60fps, BALANCED 1050×590/45fps,
  PERFORMANCE 896×504/30fps로 분리했습니다.
- PERFORMANCE는 부트 시 저메모리 에셋 프로필을 고정합니다. 프로젝트 원본을
  `scripts/build-performance-assets.py`와 PIL LANCZOS로 아틀라스 셀마다 독립 축소했으며,
  원본과 동일한 texture key/grid를 사용하고 한 게임 인스턴스에 두 프로필을 함께 올리지 않습니다.
  이 파생 과정에는 ImageGen이나 외부 미술을 사용하지 않았습니다.
- 화면 밖 배우·투사체·픽업·파티클·텍스트·장식 효과를 생성/Graphics 작업 전에 제외하고,
  저사양에서는 배우 모션과 장식 VFX cadence 및 동시 개수를 줄였습니다. 실제 판정과 연결된
  저격/보스 텔레그래프, HUD, 미니맵은 계속 매 프레젠테이션 프레임에 갱신합니다.
- React의 전체 DOM 이미지 선로드를 제거해 실제 표면에 마운트된 이미지에만 로드를 맡기고,
  사용자 제공 BGM은 metadata만 선로드합니다. blur/숨김/WebGL context loss에는 품질 governor
  표본을 정지·초기화하며 focus/context restore 뒤 깨끗한 타이밍 기준으로 재개합니다.
- 적 220기·투사체 620개의 동일 seeded 엔진 부하는 120회 워밍업, 1,200스텝×7 중앙값에서
  280.969µs/step → 98.599µs/step(2.85×, -64.9%)으로 감소했고 seeded fingerprint는
  동일했습니다.
- 2코어/2GiB/DPR 2 에뮬레이션에서 적 220기/투사체 620개를 240프레임 재측정했습니다.
  PERFORMANCE 896×504/30fps와 performance 에셋 프로필을 끝까지 유지했고 scene/update/
  render-submit P95는 36.0/2.4/3.1ms, scene drop 1.2%였습니다. 보스전은
  40.4/1.0/1.1ms, drop 1.7%였습니다. 두 장면 모두 console/page 오류는 0개였습니다.
- 같은 220/620 전장의 Phaser RGBA8 추정치는 full 47.007MiB에서 performance
  18.031MiB로 61.6%, 루트 텍스처는 18.167MiB에서 4.542MiB로 75.0%, 이미지 전송
  추정치는 7.964MiB에서 4.761MiB로 40.2% 감소했습니다. CPU ×4 별도 스트레스에서도
  scene/update/render-submit P95 47.1/11.2/14.5ms와 drop 2.1%를 유지했습니다.
- DEV의 220/620 고정 부하 주입기가 품질을 강제로 CINEMATIC으로 바꾸던 측정 오염을 제거하고,
  저사양 auto-quality ceiling과 에셋 프로필을 그대로 보존하는 회귀 테스트를 추가했습니다.
  화면 안 적을 stride로 숨기던 경로, 일반 적 탄환 샘플링, 다섯 번째 게이트 누락도 제거해
  저사양에서도 보이지 않는 피해나 허공 스폰이 발생하지 않도록 고정했습니다. 런타임 품질 변경은
  현재 Phaser 프레임 콜백 뒤로 지연해 RAF 루프가 중복 시작되지 않도록 했습니다.
  연속 플레이 QA를 위해 `http://127.0.0.1:4174/` 로컬 서버는 종료하지 않고 계속 실행 중입니다.

## 현재 판단

- P0/P1/P2 시각 또는 핵심 흐름 문제 없음.
- 시작 화면은 제공된 원본을 충실히 보존하며 필요한 정보만 표시함.
- 대사 포트레이트는 상반신만 노출됨.
- 모바일은 가로 모드 플레이와 세로 회전 가드를 모두 제공함.
- 플레이어 런타임 스프라이트는 연속 360° 전체 회전에 적합한 수직 항공 시점임.
- 소총은 모든 동작에서 오른쪽 어깨에 일관되게 견착됨.
- AEGIS 중심 카메라, 보스 압도 구도, 전용 탄도/VFX와 그림형 레벨업 카드가 데스크톱과
  모바일 가로 화면에서 정상 표시됨.
- 적 밀도는 성장에 맞춰 증가하고 모든 증원은 전장 게이트를 통해 진입함.
- 좌우 이동과 장거리 탄도는 하나의 확장 월드 좌표계에서 대칭적으로 유지됨.
- 자동 OMEGA LASER와 SKYFALL, 독립 수동 Q/E/F/R이 서로 다른 전용 모션과 엔진 상태를 사용함.
- 소형 미니맵이 전진 방향과 다음 시나리오 흔적·엔진 목적지를 지속 안내함.
- 지역별 적 조합과 보스 시그니처가 전투 감각을 구분하며, HANA/ILYA 영구 성장이 실제 다음
  출격 수치에 연결됨.
- Phaser는 전투 진입 때만 내려오고 선택 지역의 일반 전장과 보스 자산도 두 단계로 지연 로드됨.

final result: passed — low-end PERFORMANCE profile, 220/620 route, boss room, build, and Sites worker verified
