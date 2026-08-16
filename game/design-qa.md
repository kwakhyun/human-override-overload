# Design QA — HUMAN OVERRIDE: OVERLOAD

- 최초 검증일: 2026-08-10
- 최신 전체 검증일: 2026-08-15
- 브라우저: Codex 인앱 브라우저·Edge WebGL
- 데스크톱 뷰포트: 1440×810, DPR 1
- 모바일 기준 뷰포트: 320×700, 360×800, 390×844 세로 · 812×375 보조 가로
- 시작 화면 원본: `reference/source-assets/overload/intro/start-screen-key-art-user.png`
- 은발 AEGIS 원본: `reference/source-assets/overload/hero/silver-aegis-portrait-user-chroma.png`
- 시작 화면 캡처: `qa/intro-implementation-1440x810.png`
- 대사창 캡처: `qa/dialogue-silver-aegis-1440x810.png`
- 모바일 캡처: `qa/intro-mobile-landscape-812x375.png`,
  `qa/dialogue-mobile-landscape-812x375.png`
- 비교 이미지: `qa/intro-design-comparison.png`, `qa/dialogue-design-comparison.png`
- 수직 고정 방향 조준 시트: `qa/survivor-directional-aim-preview.png`
- 오른쪽 어깨 견착 아틀라스: `qa/silver-aegis-motion-preview.png`
- 전용 전투 VFX 아틀라스: `qa/combat-fx-atlas-preview.png`
- 스킬 모션 아틀라스: `qa/skill-motion-atlas-preview.png`
- 활성 도트 스킬 아틀라스: `qa/manual-ability-pixel-atlas-preview.png`,
  `qa/automatic-skill-pixel-atlas-preview.png`
- 점진형 게이트 스폰: `qa/progressive-gate-spawn.png`
- 스킬 모션 실전 화면: `qa/skill-motion-combat.png`, `qa/omega-laser-live.png`
- 최신 모바일 가로 전투: `qa/mobile-landscape-combat-812x375.png`
- 최신 모바일 세로 흐름: `qa/mobile-portrait-title-390x844.png`,
  `qa/mobile-portrait-home-390x844.png`, `qa/mobile-portrait-combat-390x844.png`,
  `qa/mobile-portrait-joystick-390x844.png`
- 최신 세로 디펜스: `qa/defense-mode-mobile-portrait.png`,
  `qa/defense-guide-mobile-portrait.png`
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

### Iteration 3 — 당시 passed, Iteration 12에서 표시 방식 교체

- AEGIS를 얼굴·가슴 전면이 전혀 보이지 않는 90° true-nadir 정사영으로 다시 생성하고
  공통 스케일·중앙 피벗을 검증했습니다.
- 당시에는 한 프레임을 여러 방향으로 회전하는 방식을 시험했으나, 머리와 발의 화면 방향을
  항상 고정해 달라는 최신 요구에 따라 이 런타임 방식은 더 이상 사용하지 않습니다.
- 최신 활성 계약은 8×8 상하좌우·대각선 전용 시트이며, 단일 자세 회전과 좌우 반전을 모두 폐기했습니다.

### Iteration 4 — 당시 passed, Iteration 12에서 표시 방식 교체

- AEGIS 15개 모션 프레임 모두에서 소총 개머리판을 오른쪽 어깨에 견착하고, 오른손 방아쇠와
  왼손 전방 지지가 유지되는 새 true-nadir 아틀라스로 교체함.
- 당시 전체 회전 프리뷰에서 오른쪽 어깨 견착과 중앙 피벗을 확인했습니다. 최신 런타임은
  이 전체 회전 경로를 폐기하고 머리 위/발 아래 방향을 고정합니다.
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

- 초반 활성 적을 낮추고 레벨·처치·경과 시간에 따라 단계적으로 증가하는 압력 상한을 적용함.
  최신 첫 지역 고정 예산 300기와 후속 지역 1,000기 예산은 Iteration 12 계약으로 분리함.
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
- 우측 하단에 AEGIS와 진행 목적지를 표시하는 소형 경로 미니맵을 추가함. 최신 전술 미니맵은
  살아 있는 적 표본과 활성 게이트까지 표시하고 설명 문구를 최소화하도록 Iteration 12에서 확장함.
- `qa/omega-laser-atlas-only.png`, `qa/skyfall-warning-atlas-only.png`,
  `qa/skyfall-impact-atlas-only.png`에서 단순 노란 사각형·원형 폴백이 사라졌음을 확인함.
- 데스크톱과 812×375 모바일 가로에서 경로 미니맵의 진행 노드와 다음 목표를 확인했고,
  최신 인앱 브라우저 콘솔 warning/error는 0개임.

### Iteration 7 — passed

- WRONG ENGINE CORE는 균형형, GLASS DUNE은 저격 플랫폼 우세, ABYSSAL ARCHIVE는 자폭
  드론 우세로 선발대와 후속 증원 조합을 분리했습니다. 첫 지역 300기, 후속 지역 1,000기 예산과
  다섯 게이트, 성장형 압력 상한을 함께 유지합니다.
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
  자산은 요청되지 않았습니다. 보스방·폼은 선택 지역 전멸 뒤 자동 전환이 시작될 때 별도 로드됩니다.
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
  동료는 실제 획득 시, 보스는 자동 클리어 전환이 시작될 때 로드합니다.
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

### Iteration 12 — passed

- 첫 WRONG ENGINE 수송로의 고정 예산을 300기로 낮추고, 후속 두 지역은 기존 1,000기 예산을
  유지하는 지역별 계약으로 분리했습니다. 적이 남은 채 입구에 닿으면 한국어 전멸 안내와 잠긴
  격벽을 보여 주고 보스 자산·스테이지를 노출하지 않아야 합니다.
- 300기 전멸 즉시 전투를 멈추고 1.2초 워닝 팝업·붉은 경계·복합 이펙트, 1.6초 AEGIS 당황
  연출을 순서대로 재생한 뒤 수동 승인이나 우측 추가 이동 없이 독립 보스방으로 자동 전환하는
  계약을 적용했습니다.
- THE WRONG ENGINE은 560,000 HP로 완화하고, 빗나간 돌진이 벽에 닿으면 2.6초 그로기와
  2.5배 받는 피해가 실제 엔진 상태에 적용되어야 합니다. 하단 낭떠러지·붕괴 외곽은 이동을 막고,
  맵 끝 배경은 카메라 이동·확대 중에도 검게 비지 않아야 합니다.
- AEGIS 활성 표현은 8×8 나침반 방향 시트를 사용합니다. 전체 스프라이트 회전·좌우 반전은 0으로
  고정하고 아래/위/옆/대각선별 전면·후면·측면 실루엣을 직접 선택합니다. 각 행의 총구 앵커와
  발포 이펙트, 탄도 시작점 및 고대비 조준 포인터가 같은 좌표식을 사용해야 합니다.
- 마우스 휠 확대 중에도 AEGIS 중심 카메라와 포인터 재투영을 유지해야 합니다. 전술 미니맵은
  플레이어·살아 있는 적 제한 표본·활성 게이트·목적지만 표시하고 설명 텍스트를 최소화합니다.
- 레벨업 창의 첫 카드가 실제 포인터/키보드 포커스 없이 호버처럼 보이면 안 됩니다. 중앙 하단
  한국어 우선 HUD는 피해 시 체력바 점멸·맥동, 그림형 SPACE/Q/E/F/R 아이콘, 입력 키 오버레이와
  시계 방향 쿨다운 마스크를 제공해야 합니다.
- 한국어 본문·대사·버튼은 네트워크 요청이 없는 `Pretendard Variable`→Pretendard→
  `Noto Sans KR`→`Apple SD Gothic Neo`→`Malgun Gothic`/`맑은 고딕`→system-ui 플랫폼
  폴백을 사용합니다. 번들 Rajdhani는 영문 브랜드·표제, IBM Plex Mono는 영문 텔레메트리·코드·
  키·숫자에만 쓰는 Latin 서브셋으로 제한해 한국어 글리프가 Latin 전용 서체로 우회하지 않게 했습니다.
- 대사 패널은 현재 화자를 기준으로 AEGIS 주인공 포트레이트, RHEA/`OPERATOR` 관제관
  일러스트, HANA·ILYA·LARK 기존 3열 아틀라스의 0·1·2번 프레임을 선택합니다. 세 지역 보스는
  선택 지역의 기존 3단계 형상 아틀라스에서 현재 단계를 사용하고 필요한 대사 표면에서만
  지연 마운트합니다. 이 매핑에 별도 NPC 이미지나 외부 미술을 추가하지 않았습니다.
- HAVEN-09의 HANA·ILYA·LARK·RHEA는 각 담당 시설의 배경 원근에 맞는 작은 월드 피겨로
  표시하고, 대화를 열었을 때만 기존 큰 일러스트를 사용해야 합니다. 상시 자동 기본 공격, 독립
  수동 Q/E/F/R과 도트 스킬 VFX 계약은 변경하지 않습니다.
- 낮은 음질의 런타임 음성 합성 경로를 제거했습니다. 현재 대사는 텍스트와 화자별 일러스트만
  사용하며 음성 복제·외부 음성 서비스는 없습니다. 절차적 SFX와 사용자 제공 BGM은 그대로입니다.
- 자동 회귀 테스트 222/222와 TypeScript 검사가 통과했습니다. Edge 1440×810·812×375 전체
  플레이 QA도 `errors: []`로 끝났고 첫 구역 300기 HUD, 방향별 조준, 휠 확대의 페이지 스크롤
  차단, 전술 미니맵, 중립 레벨업 포커스, 액티브 스킬, 일시 정지와 모바일 가로 무겹침을 확인했습니다.
- 같은 QA에서 OPERATOR/RHEA→AEGIS, 거울 폭군→AEGIS 대사의 화자별 일러스트와 HANA·ILYA·
  LARK 0%·50%·100% 아틀라스 프레임, RHEA 독립 초상화를 확인했습니다. 모든 대화 패널·초상화·
  본문·버튼은 viewport 안에 있었고, 한국어 본문 computed font 첫 후보는 `Pretendard Variable`,
  브라우저 Web Speech 전역 접근은 0회였습니다. 보스 아틀라스는 정사각 한 셀만 노출하도록
  인접 프레임 누출까지 수정 후 재검증했습니다.
- production build와 Sites worker 4/4가 통과했습니다. 글꼴 산출물은 기존 38개 약 721.3KiB에서
  Latin 전용 10개 약 139.1KiB로 줄었으며 Phaser vendor는 1,684.94kB raw/381.36kB gzip의
  독립 지연 청크를 유지합니다. `http://127.0.0.1:4174/` 서버는 HTTP 200으로 계속 실행 중입니다.

### Iteration 13 — passed

- 시작 화면을 헤이븐-09 캠페인 진입점으로 다시 정리하고 전용 3상태 지휘 버튼 아틀라스와
  hover/확인/닫기 절차적 UI 효과음을 연결했습니다. 새 슬롯은 전투 캔버스를 만들지 않고 기지의
  NPC 안내 대화에서 시작하며, 저장 슬롯 선택 뒤 곧바로 전장에 투입되던 경로는 제거했습니다.
- HANA 연구실과 ILYA 정비소는 자원·현재/다음 효과·랭크·구매 가능 상태를 더 큰 한국어 본문으로
  보여 줍니다. NPC 대화, 시설, 구역 상세는 `ESC`로 한 단계씩 닫히고, 실제 Edge에서 연구실
  본문 14px와 ESC 닫기를 확인했습니다.
- NIGHTJAR 비행선과 세 지역을 새 v2 작전 지도에 통합했습니다. 구역 hover/focus는 카드와 해당
  전장 배경을 확대하며, 카드를 눌러도 즉시 전투하지 않고 적 조합·보스 패턴·목표·보상을 담은
  상세 창을 엽니다. 별도 `출격 준비 완료 · 작전 시작` 승인 뒤에만 첫 전술 가이드와 Phaser를
  시작합니다.
- Q는 기존 중력 포획을 완전히 폐기한 `EMP PULSE`입니다. 포인터 중심 반경 300 안의 일반 기계를
  3.6초, 엘리트를 1.8초 정지시키되 적·투사체 위치를 당기거나 휘지 않으며 직접 피해도 주지
  않습니다. 수동 스킬 시트의 Q 행과 가이드 실전 크롭도 신규 EMP 도트 애니메이션으로 교체했습니다.
- 모든 일반 적 파괴는 6프레임 64px NEAREST 도트 폭발 시트를 사용합니다. 이 표현은 기존
  `enemyBurst` 좌표와 수명만 소비하고 권위 있는 사망·피해·드롭 판정은 계속 결정론 엔진이 소유합니다.
- 활성 매니페스트에서 끊긴 public 자산 7개와 복원 금지 상태였던 `survivor/`·`adversarial/`
  프로토타입 소스/전용 테스트 13개를 제거했습니다. 총 20개·3,369,381바이트이며 그중 public
  전송 후보는 3,145,096바이트입니다. ImageGen 원본과 제작 계보는 `reference/source-assets/`에
  유지했고 모든 제거분은 Git 기록에서 복구할 수 있습니다.
- 자동 회귀 187/187, Sites 4/4, TypeScript, production build가 통과했습니다. 전체 Edge
  1440×810·812×375 플레이 QA는 `errors: []`였고, 별도 HTTP 자산 추적에서도 실패 응답 0건을
  확인했습니다. 새 슬롯 기지 시작, NPC/시설, 구역 hover 확대, 상세 단계의 전투 미생성, 명시적
  출격 승인, EMP 키보드·모바일 터치, 화자별 초상화와 한국어 서체를 모두 실제 조작했습니다.

### Iteration 14 — passed

- HAVEN-09 NPC 3열 아틀라스는 잘린 프레임의 배경 폭을 `300% auto`로 고정하고 0%·50%·100%
  위치를 사용해 HANA·ILYA·LARK 옆에 인접 캐릭터가 비치지 않게 했습니다. 별도 RHEA 일러스트도
  같은 단일 프레임 클립 경계 안에 유지합니다.
- 전용 지휘 버튼 시트는 투명 외곽을 제거한 뒤 각 512×160 셀 안전 경계까지 채웠고, DOM의
  normal/hover/pressed 상태를 0%·50%·100%에 고정해 테두리와 화살표가 찌그러지거나 중앙에서
  끊기던 문제를 수정했습니다.
- 지역과 보스는 한국어 우선 한영 혼합 이름으로 정리했습니다. 활성 예시는 `오답 엔진 중앙로 / WRONG
  ENGINE CORE`, `유리 사구 / GLASS DUNE`, `심해 기록고 / ABYSSAL ARCHIVE`, `거울 폭군 ·
  MIRROR TYRANT`이며 한국어 본문과 기존 영문 고유명사를 동시에 보존합니다.
- 공통 보스 기믹은 6×6/64px, 지역 고유 기믹은 6×4/64px NEAREST 도트 시트로 제작했습니다.
  방사·스윕·폭탄·링·돌진·다중 돌진과 프리즘 격자·태양 폭발·기억 나선·심도 붕괴의 경고 3프레임,
  발동/충돌 3프레임을 보스방에서만 지연 로드합니다. 거대한 보스 아래에 가려지지 않도록 공격 방향
  외곽 또는 실제 표적/교차점에 배치하고, 엔진의 선·원·캡슐 판정 Graphics는 그대로 유지합니다.
- Edge 1440×810·812×375 전체 플레이 QA는 `errors: []`였습니다. Phaser TextureManager에서 공통·
  지역 보스 시트 두 키를 확인했고, 실제 `prismLattice` 상태를 기다려 프리즘 도트 교차점과 두 실제
  광선 경고가 동시에 보이는 캡처를 검수했습니다. NPC 단일 크롭, 버튼 3상태와 한영 혼합 보스명도
  같은 실행에서 통과했습니다.
- 자동 회귀 191/191, TypeScript, production build, Sites worker 4/4가 통과했습니다. 두 보스 도트
  시트의 RGBA8 합계는 983,040 bytes이며 이미 64px 저해상도이므로 PERFORMANCE에서도 별도 중복
  파생 없이 같은 텍스처를 사용합니다. `http://127.0.0.1:4174/` 서버는 HTTP 200으로 계속 실행 중입니다.

### Iteration 15 — passed

- 구역 상세에서 출격을 승인하면 선택한 지역 전용 사용자 제공 6초 MP4를 전체 화면으로 재생하고,
  실제 `ended` 이벤트 직후에만 Phaser 전투를 생성합니다. 첫 출격은 RHEA 가이드를 마친 뒤 영상으로
  이어지며 이후 출격도 같은 순서를 유지합니다. 영상 오류 시에는 작전을 막지 않고 전투로 복구하고,
  자동 재생이 차단된 환경에서는 같은 사용자 제스처 안에서 재생할 수 있는 명시적 버튼을 표시합니다.
- 세 영상은 각각 1264×720·24fps·6.041667초이며 원본을 재인코딩하거나 편집하지 않고 바이트 단위로
  복사했습니다. 선택하지 않은 지역 영상은 마운트하지 않고 선택 영상도 `preload="metadata"`만 사용해
  초기 화면과 기지의 전송·메모리 비용을 늘리지 않습니다. 출격 영상 중 전투 BGM은 멈추고, 사용자가
  켠 사운드 설정은 영상 음소거 상태에도 그대로 반영됩니다.
- Edge 1440×810에서 세 지역 영상을 실제 종료까지 각각 재생해 영상 중 canvas 0개, 종료 뒤 canvas
  생성, 잘못된 지역 영상 0개를 확인했습니다. 브라우저가 보고한 실제 재생 구간은 6.102~6.119초였고
  console/page/HTTP 실패는 모두 0개였습니다. 812×375 모바일 가로에서도 영상과 최소 작전 표기가
  viewport 안에 유지되는 것을 확인했습니다.
- 자동 회귀 193/193, TypeScript, production build, Sites worker 4/4가 통과했습니다.
  `http://127.0.0.1:4174/` 로컬 서버는 QA를 위해 종료하지 않고 계속 실행 중입니다.

### Iteration 16 — complete · Google Chirp agent callouts

- 사용자 제공 `잿빛 하늘 아래.mp3`를 재인코딩 없이
  `public/assets/audio/under-ashen-skies-title.mp3`로 복사하고 타이틀에만 연결했습니다. Edge의
  사용자 제스처 필수 자동 재생 정책에서 명시적 음악 버튼을 누른 뒤 0.34 볼륨으로 재생되고,
  저장 슬롯 화면으로 나가면 audio source가 제거되고 즉시 정지하는 것을 확인했습니다. 파일은
  1,510,724 bytes, 브라우저 재생 길이 59.8135초이며 console/page 오류는 0개였습니다.
- 기존 `overload-main-theme.mp3`는 오답 엔진 중앙로 전투에만 남겼습니다. 헤이븐-09 로비·유리
  사구·심해 기록고는 전용 음원이 제공되기 전까지 무음이고, 각 지역의 분위기·템포·악기·루프·
  제외 요소를 포함한 Suno Instrumental 프롬프트를 `SUNO_BGM_PROMPTS.md`에 기록했습니다.
- Q/E/F/R 탑재 AI 안내를 Google Cloud Text-to-Speech `ko-KR-Chirp3-HD-Kore`의 자연스러운 한국어
  발동 확인 문장으로 교체했습니다. 뒤쪽 효과 설명을 제거한 네 MP3는 합계 30,624 bytes이고 로컬
  ADC 산출 SHA-256과 파일이
  일치합니다. 인증 정보는
  브라우저 번들·저장소에 없으며 `manualAbilityActivated` 성공 이벤트에서만 재생합니다.
- 개발 Strict Mode가 첫 음성 객체를 폐기한 뒤 재사용하던 수명주기 문제를 QA에서 발견해, 전투 화면
  effect가 다시 설정될 때 새 음성 버스를 만들도록 수정했습니다. Edge 실제 전투에서 Q/E/F/R 네
  쿨다운이 각각 18/28/34/72초로 소모되고 네 정확한 MP3 재생 호출·HTTP 200·`audio/mpeg`·오류 0을
  확인했습니다. 거절 이벤트와 브라우저 TTS는 음성을 재생하지 않습니다.
- 자동 회귀 200/200, TypeScript, production build, Sites worker 4/4가 통과했습니다.
  `http://127.0.0.1:4174/` 서버는 HTTP 200으로 계속 실행 중입니다.

### Iteration 17 — complete · 지역 BGM, 전진형 압력, 군중 최적화

- 사용자가 제공한 `Last Light in Haven-09.mp3`, `2구역_Refraction War.mp3`,
  `3구역_Memory Below Pressure.mp3`를 재인코딩 없이 각각 헤이븐-09 로비, 유리 사구, 심해
  기록고에 분리 적용했습니다. 원본/런타임 SHA-256이 모두 일치합니다. Edge 실제 화면에서 세
  트랙이 `audio/mpeg` 206으로 로드되고 159.4135/59.8135/59.8135초 길이와 증가하는 재생 시간을
  확인했으며, 출격 영상 뒤에는 선택 지역 음악만 재생됐습니다.
- 원정 압력은 초반 36기를 유지하면서 실제 전진율 10/34/60/82%에서 124/180/260/400기 증원
  큐가 순차 해금되도록 변경했습니다. 전진율이 주 압력 신호이고 레벨·처치·시간은 보조합니다.
  AEGIS보다 720 월드 단위 이상 뒤처진 적은 제거되지 않고 원거리 대기를 해제한 뒤 가속 추격합니다.
- 다수 처치 때 6프레임 도트 폭발 위에 중복되던 절차적 원·광선 묘사를 제거했습니다. 화면 안 적,
  적 투사체, 저격 경고, 보스 위험 기하와 다섯 게이트는 그대로 두고 아군 탄도 비행과 그림자만
  밀도에 따라 샘플링합니다. 220적/620투사체에서 render-submit CPU P95는 데스크톱 4.1ms,
  모바일 4.2ms였고, 2코어/2GiB PERFORMANCE는 4.0ms와 18.968MiB RGBA8을 기록했습니다.
  CPU ×4 스트레스 P95는 26.9ms로 33.3ms 렌더 예산 안이지만 scene drop 17%여서 상한 자료로만
  보존합니다.
- 실제 브라우저 캡처에서 데스크톱·모바일 220기 스트레스 전장의 적/투사체/HUD/미니맵이 유지되고,
  기지와 2·3구역 화면이 viewport 안에 있음을 확인했습니다. favicon 404도 inline 프로젝트 아이콘으로
  제거해 최종 console/page/HTTP 오류는 `[]`입니다. 자동 회귀 202/202, TypeScript와 production
  build가 통과했고 4174 서버는 종료하지 않았습니다.

### Iteration 18 — complete · 짧은 한국어 탑재 AI 음성

- Google LLC 서명을 확인한 Windows Google Cloud CLI 579.0.0을 설치하고 로컬 ADC를
  `uptime402-hack-260803` 할당량 프로젝트에 연결했습니다. 인증 토큰·키·ADC 파일은 프로젝트와
  브라우저 번들에 포함하지 않습니다.
- `ko-KR-Chirp3-HD-Kore` 여성 음성으로 Q `EMP 전개.`, E `방벽 전개.`,
  F `지원 폭격 개시.`, R `섬멸 모드 개시.`만 합성했습니다. Q·E·F는 발음과 응답 시간을 줄인 관제형 문구로
  2026-08-12 재생성했으며 런타임 MP3 길이는 각각 1.416/0.912초입니다.
- Edge 실제 전투에서 성공한 Q/E/F/R 이벤트가 정확한 네 MP3를 호출했고 모든 응답은 HTTP 200,
  `audio/mpeg`, 파일 크기 일치, console/page/HTTP 오류 `[]`였습니다. 전투 HUD와 스킬 쿨다운도
  캡처에서 유지됐습니다.
- 자동 회귀 202/202, TypeScript, production build, Sites worker 4/4가 통과했고
  `http://127.0.0.1:4174/` 서버는 종료하지 않았습니다.

### Iteration 19 — complete · 상위 권역 지도와 외곽 생산권역

- 기존 01—03과 신규 04—06을 각각 하나의 상위 권역으로 묶고, 07—09는 후속 제작을 알리는
  비활성 프리뷰로 배치했습니다. 권역 카드에서 한 번, 개별 구역 상세에서 한 번 선택하는 2단계
  출격 구조이며 ESC는 상세→권역→기지 순서로 한 단계씩 닫습니다.
- 01—03 전체 클리어 시 LARK 위에 점멸 `!`가 나타나고 전용 브리핑이 재생됩니다. 저장 슬롯에
  `outer-sector-briefed`가 기록되기 전에는 이미 선행 조건을 충족했어도 04—06 출격이 거부됩니다.
- 네온 주조구·폭풍 첨탑·생체 금고에 전용 1920×1080 전장, 역할별 4×1 적/중간보스 아틀라스,
  이족형·기계룡·사족형 3×1 최종 보스 아틀라스를 추가했습니다. 각 일반 물량을 전멸시키면
  52,000/56,000/60,000 HP 중간 보스가 출현하고, 중간 보스를 격파해야 자동 보스 전환이 진행됩니다.
- 모든 지역 승리는 공통 NIGHTJAR 귀환 장면을 거쳐 헤이븐-09로 돌아갑니다. 필수 회귀 59/59와
  TypeScript 검사가 통과했으며 전체 테스트·production build는 시간 제한 지침에 따라 생략했습니다.
- Edge 실브라우저에서 LARK 알림→3개 권역 지도→04—06 상세→네온 주조구 전투를 한 흐름으로
  재현했습니다. 844×390 가로 화면의 가로 넘침은 0px였고, 전투 TextureManager에 신규 적 아틀라스가
  등록된 상태에서 살아 있는 적이 렌더됐으며 console/page/request 오류는 `[]`였습니다.

### Iteration 20 — complete · 연속 오메가 광선과 고해상도 EMP

- 자동 OMEGA LASER의 64px 빔 코어 반복 배치를 제거하고 엔진의 실제 시작·종단 좌표를 따라
  보라색 외곽광, 시안 에너지층, 양측 레일, 백색 코어와 이동 펄스를 한 번에 그리는 연속 Graphics
  경로로 교체했습니다. 품질 단계별 이동 펄스 수만 3/5/8개로 제한하며 판정은 변경하지 않았습니다.
- Q EMP PULSE는 1152×192 RGBA, 6×1 고해상도 전용 시트를 사용합니다. 전자기 시드·회로 점화·
  파동 확장·최대 교란·분해·소멸 프레임을 실제 엔진 반경에 맞추고 PERFORMANCE에서는 보조 내부
  원만 생략합니다.
- 로컬 실제 전투에서 EMP와 OMEGA를 동시에 재생해 셀 이음새 없는 연속 광선과 투명 EMP 프레임을
  캔버스로 확인했습니다. TypeScript와 관련 회귀 34/34가 통과했고 전체 테스트는 사용자 지침에
  따라 생략했습니다. 4174 서버는 HTTP 200으로 계속 실행 중입니다.

## 현재 판단 — Iteration 20 complete

- Iteration 11까지의 저사양 PERFORMANCE 기준선과 회귀 결과는 유효합니다.
- 시작 화면은 제공된 원본을 충실히 보존하며 필요한 정보만 표시함.
- 대사 포트레이트는 상반신만 노출되며 AEGIS, RHEA/OPERATOR, HANA/ILYA/LARK 및 지역 보스를
  실제 화자와 현재 보스 단계에 맞춰 기존 원본에서 선택함.
- 한국어 UI는 네트워크 없는 한국어 우선 시스템 서체를 사용하고 Rajdhani/IBM Plex Mono의
  Latin 번들은 영문 장식·텔레메트리에만 제한함.
- 모바일은 가로 모드 플레이와 세로 회전 가드를 모두 제공함.
- 플레이어 런타임 스프라이트는 수직 항공 시점을 유지하되 전체 회전하지 않고 상향·수평·하향
  조준 행과 좌우 반전만 사용함.
- 소총은 오른쪽 어깨에 견착되며 방향별 총구 앵커·발포 효과·고대비 포인터 정합성을 캡처로 확인함.
- AEGIS 중심 카메라, 휠 확대, 보스 압도 구도, 전용 탄도/VFX와 그림형 레벨업 카드를 데스크톱·
  모바일 가로에서 재검증함.
- 적 밀도는 성장에 맞춰 증가하고 모든 증원은 전장 게이트를 통해 진입함.
- 좌우 이동과 장거리 탄도는 하나의 확장 월드 좌표계에서 대칭적으로 유지됨.
- 자동 OMEGA LASER와 SKYFALL, 독립 수동 Q/E/F/R이 서로 다른 전용 모션과 엔진 상태를 사용함.
- 전술 미니맵은 플레이어·살아 있는 적 표본·게이트·목적지를 최소 문구로 표시함.
- 지역별 적 조합과 보스 시그니처가 전투 감각을 구분하며, HANA/ILYA 영구 성장이 실제 다음
  출격 수치에 연결됨.
- Phaser는 전투 진입 때만 내려오고 선택 지역의 일반 전장과 보스 자산도 두 단계로 지연 로드됨.

final result: pass — 01—03/04—06/07—09 상위 권역 지도, LARK 신규 항로 브리핑과 저장 해금,
외곽 생산권역의 전용 적·중간 보스·비원형 최종 보스, 전 지역 공통 귀환 연출을 구현했습니다.
이번 변경의 필수 회귀 59/59와 TypeScript 검사가 통과했습니다.

### Iteration 21 — complete · 캐릭터 정보 및 영구 강화 화면

- Source visual truth:
  `C:/Users/82105/Downloads/Screenshot_이환_20260531_160540.jpg` (576×500)와
  `C:/Users/82105/Downloads/img (1).jpg` (1110×625). 두 레퍼런스의 공통 구성인 좌측 대형
  캐릭터 일러스트, 우측 정보 콘솔, 상단 분류 탭, 외곽 캐릭터 선택 레일을 현재 프로젝트의
  SOVEREIGN 청록/마젠타 시각 언어로 옮겼습니다.
- Implementation evidence:
  `qa/character-information-desktop.png` (1280×720),
  `qa/character-information-mika.png` (1280×720),
  `qa/character-information-upgrades.png` (1280×720),
  `qa/character-information-mobile-landscape.png` (844×390).
- Normalization: 브라우저 CSS viewport와 캡처 픽셀은 DPR 1에서 각각 1280×720 및 844×390으로
  일치합니다. 전체 비교본 `qa/character-information-comparison.png`은 576×500 원본을 높이
  720px, 폭 829px로 비례 확대하고 1280×720 구현 캡처와 나란히 배치했습니다.
- State: 슬롯 01 헤이븐-09의 `인물 영구 강화` 화면. AEGIS 기본 정보, MIKA 전환, 영구 강화 탭,
  ESC 닫기와 재열기를 확인했습니다. 캐릭터 전환은 실제 슬롯 출격 편성에 저장됩니다.
- Full-view comparison: 레퍼런스와 구현 모두 일러스트가 약 47~52%의 주 시각 영역을 차지하고,
  정보 패널과 캐릭터 레일이 우측에 머뭅니다. 구현은 투명 원본 포트레이트를 `contain`으로 표시해
  얼굴·무기·복장 실루엣을 자르거나 늘이지 않습니다.
- Focused comparison: 기본 능력치 2열, Q/E/F/R 4칸, 영구 강화 3행, 캐릭터 썸네일을 별도로
  확인했습니다. 큰 한국어 이름과 능력치 숫자, 입력 키, 강화 비용의 계층이 유지됩니다.

**Findings**

- P0/P1/P2 없음. 데스크톱과 844×390 모바일 가로 모두 가로 넘침이 없고 핵심 버튼이 viewport
  안에 있습니다. 모바일 구현은 긴 설명을 한 줄로 압축하고 캐릭터 일러스트를 계속 우선합니다.

**Comparison history**

- 첫 캡처에서 레퍼런스의 주요 비율, 캐릭터 크롭, 탭·정보·스킬·레일 구조가 모두 확인되어
  수정이 필요한 P0/P1/P2가 없었습니다. 이후 MIKA, 강화 탭, 모바일 가로를 추가 캡처해 동일
  구조가 유지되는 것을 확인했습니다.

**Required fidelity surfaces**

- Typography: 한국어 우선 Pretendard/Noto Sans KR 계열과 숫자 전용 mono를 유지하며 줄바꿈 없음.
- Spacing/layout: 47% 일러스트 / 정보 콘솔 / 76px 선택 레일, 모바일은 42% / 콘솔 / 56px.
- Colors/tokens: AEGIS 청록, MIKA 마젠타 상태색과 기존 기지 암색 재질을 사용.
- Image quality: 941×1672 투명 원본 포트레이트를 비왜곡 표시하고 자연 크기 로드 완료 확인.
- Copy/content: 실제 저장 슬롯 능력치, 주무기, 캐릭터별 Q/E/F/R, 동기화 랭크와 코어를 표시.
- Browser: console warning/error `[]`; 기본↔영구 강화, AEGIS↔MIKA, ESC 닫기/재열기 정상.

final result: passed

### Iteration 22 — complete · 모션 포트레이트 중심 헤이븐 로비

- Source visual truth:
  `C:/Users/82105/Downloads/KakaoTalk_20211112_103053137.jpg` (1024×576)를 주 레이아웃
  기준으로 삼고, `gj_gallery_file_06143005_1.jpg`, `Portfolio_img_29182423_1.png`,
  `RCLzrXEAuT7InkwJsS6JZorjCk1hxxe4etiyQ2dzJ3XQ7qLSNQmFQBDdzxIHQnqfZMmWdl3Q4CNJ6u8mOFUh5w.webp`의
  중앙 캐릭터·가장자리 메뉴·우상단 재화 구조를 보조 기준으로 사용했습니다. 제3자 이미지는
  구도 참고에만 사용했고 프로젝트 런타임에 포함하지 않았습니다.
- Implementation evidence:
  `qa/haven-lobby-motion-portrait-1569x912.png`, `qa/haven-lobby-motion-844x390.png`,
  `qa/haven-research-facility-1569x912.png`, `qa/haven-character-info-motion-1569x912.png`,
  `qa/haven-lobby-reference-comparison.png`.
- State: 슬롯 01 헤이븐-09 로비에서 현재 편성된 AEGIS/MIKA 전신 일러스트를 중앙 주 시각으로
  표시하고, 좌측 NPC 메뉴, 우측 전투원·출격 주요 행동, 우상단 연구 자료·장비 부품·동기화 코어를
  배치했습니다. 재화 버튼은 연구실·정비소·전투원 정보로 직접 연결됩니다.
- Motion portrait (superseded by Iteration 23): 이 단계의 포인터 시차는 이후 사용자 요청에 따라
  제거했습니다. 정적 PNG를 Cubism Live2D라고 표기하지 않는 원칙과 리깅 모델 교체 조건만
  유지합니다.
- Authored backgrounds: 로비, HANA 연구실, ILYA 정비소, 전투원 동기화실에 각각 별도
  1920×1080 WebP를 적용했습니다. 로비와 다음 상세 화면에 필요한 DOM 이미지 그룹은 기존
  선로딩 경로에서 함께 디코드되어 화면 전환 때 빈 배경을 노출하지 않습니다.

**Findings**

- P0/P1/P2 없음. 1569×912과 844×390 가로 모두 document 가로·세로 넘침이 없고 재화,
  NPC, 캐릭터 정보, 출격 버튼이 viewport 안에 있습니다.
- 포인터를 포트레이트 우상단으로 이동했을 때 CSS 상태가 `7.70px / -2.80px / 0.48deg`로
  갱신되어 모션이 실제 입력에 반응함을 확인했습니다.
- 연구실 및 전투원 정보 화면의 별도 배경과 ESC/기지 복귀 동선을 확인했고 브라우저
  warning/error는 `[]`입니다.

**Comparison history**

- `qa/haven-lobby-reference-comparison.png`에서 주 레퍼런스와 구현을 동일 높이로 나란히 비교했습니다.
  레퍼런스의 중앙 캐릭터, 우상단 재화, 가장자리 메뉴 계층은 유지하면서 현재 프로젝트의 어두운
  헤이븐-09 재질과 SOVEREIGN 청록/마젠타 상태색으로 통일했습니다.

**Required fidelity surfaces**

- Typography: 한국어 우선 UI 서체, 순수 영문 장식과 숫자만 기존 display/mono 서체 사용.
- Spacing/layout: 중앙 캐릭터를 화면의 약 42~48% 주 시각으로 유지하고 좌우 메뉴와 겹치지 않음.
- Colors/tokens: 청록 탐색/연구, 앰버 정비, 마젠타 동기화 코어의 기존 상태색 유지.
- Image quality: 1920×1080 상세 배경과 기존 투명 전신 포트레이트를 비왜곡 표시.
- Browser: 1569×912 및 844×390, warning/error `[]`, 연구실·전투원 정보 전환 정상.

final result: passed

### Iteration 23 — complete · 클릭 반응 로비와 MIKA 합류

- Interaction: 중앙 포트레이트의 수동 포인터 추적을 제거했습니다. 머리·가슴·왼팔·오른팔·다리
  영역을 클릭하거나 터치할 때만 가벼운 표정 처리와 말풍선이 나타납니다. AEGIS는 냉정하고
  차가운 반응, MIKA는 홍조와 부끄러운 항의를 영역별로 표시합니다. 현재 구현은 정적 PNG 기반
  상호작용이며 Cubism Live2D 모델로 오표기하지 않습니다.
- Progression: 새 슬롯에서는 MIKA 선택과 태그를 잠급니다. 첫 `wrong-engine-core` 승리 때만
  구조 신호·합류 시나리오를 재생하고 `mika-unlocked`를 저장한 뒤 캐릭터 정보, 출격 편성,
  전투 태그에 노출합니다. 잠긴 저장 데이터나 직접 런치 주입도 AEGIS로 안전하게 정규화됩니다.
- Narrative: 전투 대화 패널은 현재 조작 캐릭터 ID를 소비해 AEGIS/MIKA 화자명과 전용
  일러스트를 함께 전환합니다. 태그 후에도 이전 캐릭터 초상화가 남지 않습니다.
- UI: 로비·연구실·정비소·동기화실의 배경 명도를 올리고 한국어 메뉴 글자 크기 하한을
  확대했습니다. 공용 커맨드 버튼은 이미지 아틀라스를 제거하고 CSS hover/focus/pressed 상태로
  통일했습니다. 잠긴 MIKA 카드는 해금 조건을 명시합니다.
- Verification: 캠페인 진행·UI·시각 자산·지연 로딩·전투 엔진·Phaser 계약 집중 테스트
  `128/128`, `npm run typecheck`, `git diff --check`를 통과했습니다. 1569×912 데스크톱과
  844×390 모바일 가로에서 AEGIS/MIKA 반응, MIKA 잠금 카드, 해금 후 편성, MIKA 전투 초상화,
  배경 가독성과 overflow를 확인했고 브라우저 warning/error는 `[]`였습니다. 전체 테스트와
  production build는 사용자의 시간 우선 검증 지침에 따라 이번 논리 변경에서는 실행하지
  않았습니다.

final result: passed

### Iteration 24 — complete · 실제 Cubism Live2D 로비 모델

- Model pipeline: AEGIS/MIKA 원본을 분리한 PSD와 편집 가능한 `.cmo3`를 보존하고, Cubism
  Editor 5.3.03에서 브라우저 Core 호환 MOC3 v5·model3·CDI·2048px 텍스처를 출력했습니다.
- Runtime: 번들한 공식 Cubism Core와 React WebGL 런타임으로 로비 모델을 그립니다. 모델이
  준비된 뒤 기존 PNG 폴백의 opacity는 0이며, 오류일 때만 정적 일러스트가 남습니다.
- Interaction: 기본 포인터 추적 없음. 투명한 머리·가슴·양팔·다리 버튼만 시선·상체와 실제
  Cubism `cold`/`shy` 표정 파라미터를 실행합니다. `showHitAreas=false`이며 AEGIS 얼굴의 청록
  실루엣, MIKA의 CSS 홍조 등 합성 오버레이는 없습니다.
- Browser QA: 1440×810 Edge WebGL에서 AEGIS와 MIKA 모두 `data-live2d-ready=true`, 실제
  canvas 520×737/480×737, 폴백 opacity 0을 확인했습니다. 두 영역 클릭 후 인물별 말풍선과
  표정 호출이 정상입니다. 물리·포즈·사용자 데이터 파일이 없는 현재 경량 모델의 선택적 경고만
  존재하며 모델 로드·렌더 오류는 없습니다.
- Focused verification: Cubism 모델 번들/버전/표정, 캠페인 UI, typecheck만 실행했습니다.
  전체 테스트와 production build는 사용자의 마지막 최종 검증 지침에 따라 생략했습니다.

final result: passed

### Iteration 25 — complete · Cubism 상시 호흡 및 영역별 반응

- Root cause: 두 MOC3는 정상 로드됐지만 원본 키폼의 시각 변형량이 작아 정지 이미지처럼
  보였습니다. AEGIS 템플릿을 MIKA에 덮는 시도는 인물 실루엣이 겹치는 미리보기 단계에서
  취소해 원본 리깅과 미술을 보존했습니다.
- Runtime motion: 두 모델 모두 `requestAnimationFrame` 기반의 저속 호흡, 상하 중심 이동,
  미세 좌우 흔들림, 시선/상체 변화와 간헐 표정을 Cubism 렌더러 내부에서 실행합니다.
  `prefers-reduced-motion`에서는 상시 이동을 멈추되 터치 반응은 유지합니다.
- Touch reactions: 머리·가슴·양팔·다리는 서로 다른 표정 파일, 시선, 상체 방향, 모델 중심과
  배율 반동을 사용합니다. AEGIS는 절제된 회피 동작, MIKA는 더 큰 당황/부끄러움 동작입니다.
- Framing: MIKA 모델 배율을 0.82로 낮추고 Y 기준점을 0.075로 올렸으며 로비 컨테이너도
  448px 상한으로 축소했습니다. 모바일 가로에서도 별도 270px 상한을 사용합니다.
- Focused QA: Cubism/캠페인 14/14와 typecheck가 통과했습니다. 1440×810 Edge에서 AEGIS와
  MIKA 모두 720ms 간격의 idle canvas 프레임과 터치 전/후 프레임이 실제로 달라졌고,
  `data-live2d-ready=true`, 폴백 opacity 0, 로드 오류 0을 확인했습니다. 전체 테스트와 build는
  사용자의 빠른 반복 지침에 따라 실행하지 않았습니다.

> Iteration 26의 실제 분리 리그와 전신 재출력이 이 배율·반응 구현을 대체합니다.

final result: superseded

### Iteration 26 — complete · 캐릭터별 분리 리그와 MIKA 전신 프레이밍

- Root cause: Cubism Editor 5.3 기본 MOC 출력은 번들 Web Core와 맞지 않았고, 중복 MIKA
  문서 중 빈 탭에서 호환 MOC를 한 차례 내보내 로딩 완료 캔버스가 투명해지는 문제도 있었습니다.
  AEGIS와 전신 MIKA 원본 탭에서 각각 `SDK 5.0 / Cubism 5.0 대응` MOC3 v5를 다시 출력했습니다.
- Character-specific rig: AEGIS와 MIKA는 별도 PSD·CMO3·MOC3·2048px 텍스처를 사용합니다.
  눈 파츠에는 좌우 EyeOpen 키폼, 상체와 후면 머리카락에는 AngleX 키폼을 적용했으며 model3의
  `EyeBlink` 그룹과 캐릭터별 idle/area expression을 결합했습니다. 한 캐릭터 리그를 다른
  캐릭터에 복제하지 않았습니다.
- Motion: 상시 호흡·좌우 상체/머리카락 흔들림과 간헐 표정을 Cubism 파라미터로 실행합니다.
  터치 중에는 캔버스 위치와 전체 scale을 바꾸지 않고 머리·가슴·팔·다리별 방향, 진폭, 주기와
  표정을 달리해 단순한 전신 위치 이동을 제거했습니다.
- Framing: MIKA의 기존 상반신 원본을 프로젝트 정체성을 유지한 전신 941×1672 원본으로
  확장하고 로비 scale 0.94, Y -0.035로 배치했습니다. 1440×810 캡처에서 머리 장식, 쌍환,
  손끝, 양쪽 부츠가 모두 캔버스 안에 남습니다.
- Focused QA: Cubism/캠페인 계약 14/14와 typecheck 통과. Edge WebGL에서 두 모델 모두
  `data-live2d-ready=true`, 폴백 opacity 0, 8회 idle 표본 중 프레임 변화 감지, 터치 4영역에서
  4개의 서로 다른 canvas 프레임을 확인했습니다. 물리·포즈·사용자 데이터가 없는 경량 모델의
  선택적 경고 외 로드/페이지 오류는 없습니다. 전체 테스트와 production build는 실행하지
  않았습니다.

final result: passed

### Iteration 27 — complete · 세로 모바일 전투와 앱 이관 경계

- Mobile contract: 세로 화면 회전 가드와 시뮬레이션 정지를 제거했습니다. 터치 기기의 세로
  전투는 Phaser `ENVELOP` 프레젠테이션으로 화면을 채우며, 내부 결정론 좌표계는 1280×720을
  그대로 유지합니다.
- Movement and aim: 버튼·대화·모달을 제외한 전투 화면 어디서든 touch/pen 드래그를 시작하면
  접점에 플로팅 아날로그 조이스틱이 나타납니다. 12% deadzone, 연속 magnitude, 대각선 1.0
  상한을 유지하고 pointer-up/cancel/lost-capture/blur에서 입력을 해제합니다. 모바일 세로
  전투는 가장 가까운 materialized live hostile을 자동 조준하고, 보스전에서는 보스를 우선합니다.
- Portrait UI: HP/액티브 도크는 하단 safe area 위에, 목표·사운드는 상단, 미니맵은 그 아래에
  배치했습니다. 대화 다음 버튼, 세로 레벨업 목록, 결과 액션과 출격 확인 CTA는 세로 viewport
  안에서 읽고 누를 수 있게 재배치했습니다.
- Native boundary: `src/platform/mobileRuntime.ts`를 첫 플랫폼 감지 경계로 추가하고,
  `docs/mobile-app-release-roadmap.md`에 Capacitor 셸, 저장·오디오·생명주기 어댑터,
  AAB/TestFlight, 개인정보·서명·스토어 심사 체크리스트를 기록했습니다.
- Verification: 모바일·Phaser HUD/runtime 집중 테스트 39/39와 typecheck가 통과했습니다.
  Edge 390×844 실제 터치 에뮬레이션에서 플로팅 조이스틱으로 플레이어 X가 580→878.3으로
  이동했고, 모바일 자동 조준과 세로 프레젠테이션이 활성화됐습니다. 목표·미니맵·하단 도크는
  모두 viewport 안에 남았고 가로 overflow 0, console/page error 0을 확인했습니다. 세로 출격
  확인 화면은 CTA가 스크롤 없이 노출되며, 구역 카드는 한 장을 크게 읽고 옆으로 넘기는
  scroll-snap 구조로 보정했습니다.

final result: passed

### Iteration 28 — complete · 초장거리 구역과 유닛 비겹침

- Route scale: 일반전 월드를 26,400×1,080, 실제 전진 거리를 25,000으로 확장했습니다.
- Crowd readability: 적의 실제 일러스트 반경과 엘리트 배율을 사용하는 결정론적 공간 해시
  분리로 최대 220기 압력에서도 실루엣이 한 점에 포개지지 않습니다. 게이트 8기 편대는
  104×112 간격의 2열×4행으로 먼저 물질화하며, 핫 루프는 기존 버킷과 scratch를 재사용합니다.
- Regional art: WRONG ENGINE의 원자로 금고와 GLASS DUNE, ABYSSAL ARCHIVE, NEON FOUNDRY,
  STORM SPIRE, GENE VAULT의 후반 확장 섹터를 각각 새로 제작했습니다. 중앙 72%는 넓고
  연속된 전투로이며 지역별 위험 지형은 상·하단 비이동 영역으로 한정했습니다.
- Low-memory parity: 원본 1920×1080 WebP와 동일 구도의 PERFORMANCE 960×540 WebP를
  같은 텍스처 키로 선택 로드합니다. 두 품질 계층을 한 런에서 중복 로드하지 않습니다.
- Focused verification: 공간 분리·고정 시드 엔진 테스트 78/78, 지역 매니페스트·캠페인
  계약 35/35와 TypeScript 검사가 통과했습니다. 6개 1920×1080 원본과 6개 960×540
  PERFORMANCE 파생본의 치수·파일 존재를 확인하고, 원본 6장을 직접 비교해 중앙 전투로,
  지역 팔레트, 상·하단 비이동 경계, 글자·유닛 부재를 확인했습니다. 전체 테스트와 production
  build는 사용자의 빠른 반복 지침에 따라 실행하지 않았습니다.

final result: passed

### Iteration 29 — complete · MIKA 기본 공격 정상화와 증강 성장

- Root cause: 공통 사격 타이머 목록에는 `halo`가 있었지만 MIKA 생성 시 `fireTimers.halo`가
  초기화되지 않았습니다. 첫 감산부터 값이 `NaN`이 되어 쿨다운 분기가 영구적으로 열렸고,
  의도한 약 0.36초 간격 대신 매 60 Hz 시뮬레이션 스텝마다 고화력 관통탄 두 발이 생성됐습니다.
- Baseline: `halo` 타이머를 0으로 명시 초기화했습니다. 해금 직후 MIKA는 0.42초 간격의
  단발 링 블레이드를 사용하며 관통 0, 반경 8, 레벨 1 피해 34.8에서 시작합니다.
- Level-up progression: MIKA 전용 무기 보상 `프리즘 링 동기화`를 5랭크로 추가했습니다.
  첫 MIKA 무기 카드는 이 증강을 확정 제시하며, 속도·피해·반경·관통과 발사 수를 단계적으로
  올립니다. 5랭크에서 쌍발, 속도 930, 관통 3, 반경 13, 레벨 1 피해 49.25와 0.36초 간격으로
  기존의 의도된 완성형 프로필에 도달합니다.
- Focused verification: 1초 기본 사격이 2~3회뿐이고 타이머가 유한한지, 첫 전용 보상과
  5랭크 선택, 최종 두 발의 속도·피해·반경·관통을 고정하는 엔진 테스트 79/79가 통과했습니다.
  전체 테스트와 production build는 사용자의 빠른 반복 지침에 따라 실행하지 않았습니다.

final result: passed

### Iteration 30 — complete · 레아의 HAVEN 타워 디펜스

- Mode boundary: 메인 기지에 레아가 담당하는 독립 `기지 방어 · 디펜스` 진입점을 추가했습니다.
  React는 3단계 작전 선택, 전술 도크, 결과·보상을 담당하고 `src/defense/engine.js`가 배치,
  웨이브, 이동, 공격, 코어 피해와 승패를 60 Hz 결정론적으로 판정합니다.
- Defense systems: 12개 고정 패드에 펄스 센트리, 아크 릴레이, 스카이파이어 포대, 이지스
  바스티온을 배치하고 3랭크까지 강화합니다. 단일 표적, 연쇄, 장거리 범위 폭발, 감속 광역 펄스로
  역할을 분리했습니다.
- Escalation and rewards: 6/8/10웨이브 3단계를 순차 해금합니다. 웨이브 규모와 헌터·소총수·
  저격수·공성 워커 비중이 함께 상승하며, 승리 시 첫/반복 보상을 구분해 기존 슬롯의 연구 자료,
  장비 부품, 증강 코어에 직접 반영하고 동일 run id 중복 지급을 막습니다.
- Art and performance: HAVEN 외곽 3경로 전장과 6×4 방어 체계 모션 아틀라스를 프로젝트 전용으로
  제작했습니다. FULL 1920×1080/1536×1024와 PERFORMANCE 960×540/768×512를 동일 키로
  선택 로드해 한 런에서 두 품질 계층을 중복 적재하지 않습니다.
- Focused verification: 신규 엔진·저장·캠페인 UI·Phaser 경계 테스트 27/27와 TypeScript 검사가
  통과했습니다. 전체 테스트와 production build는 사용자의 빠른 반복 지침에 따라 실행하지
  않았습니다.
- Browser smoke: 1280×720 로컬 Edge에서 메인 기지의 디펜스 진입, 레아 브리핑, 3단계 잠금,
  12개 패드 전장, 펄스 센트리 배치(270→200), 8기 첫 웨이브 조기 개시와 실시간 처치를 확인했습니다.
  신규 모드 page error는 0이며, 기존 Cubism 모델의 선택적 physics/pose/user-data 부재 경고만
  유지됩니다.

final result: passed

### Iteration 31 — complete · Cubism premium motion/physics v2

- Professional reference: Live2D 공식 소재 분리, 수동 메쉬, 워프 디포머, 표준 파라미터,
  XY 얼굴 회전, 눈 깜빡임, 물리 연산 문서를 기준으로 기존 로비 리그의 병목을 다시
  감사했습니다. 외부 게임의 원화·모델·모션은 가져오지 않았습니다.
- Rig sources: AEGIS/MIKA 정체성을 유지한 정면 전신 중립 원화를 ImageGen으로 새로 만들고,
  얼굴·눈·눈썹·입·머리카락·양팔·양다리·코트·트윈테일·링 장비를 캐릭터별 28개 의미
  레이어로 분리하는 재현 가능한 PSD 파이프라인을 추가했습니다. Cubism 자동 템플릿은 몸통
  디포머 참고로만 사용하고 검증되지 않은 얼굴 키폼은 현재 정상 MOC에 덮어쓰지 않았습니다.
- Runtime motion: 각 모델의 model3에 3종 Idle, 머리·가슴·팔·다리 4종 Touch motion3와
  앞·옆·뒷머리 3계통 physics3를 연결했습니다. AEGIS는 절제된 느린 복귀, MIKA는 더 빠르고
  탄성 있는 트윈테일 반응으로 진폭·지연·가속도를 독립 조정했습니다. 터치 종료 후 기본 대기
  루프로 자연스럽게 복귀하며 캔버스 앵커와 배율은 계속 고정됩니다.
- Runtime hygiene: 빈 Pose/UserData 파일을 정식 Cubism 형식으로 제공해 로더의 선택 파일
  경고를 제거했습니다. 폴백 PNG는 모델 준비 뒤 opacity 0을 유지하고, 터치 실루엣과 포인터
  추적은 다시 추가하지 않았습니다.
- Focused verification: Cubism 모델·모션·물리와 캠페인 UI 14/14, TypeScript 검사가
  통과했습니다. Edge 1440×810에서 AEGIS 520×737, MIKA 448×737 캔버스가 모두 ready,
  폴백 opacity 0, 대기 프레임 변화 true, 터치 반응 변화 true, 서로 다른 터치 프레임 4/4,
  console/page error·warning 0을 확인했습니다. 전체 테스트와 production build는 사용자의
  빠른 반복 지침에 따라 실행하지 않았습니다.

final result: passed

### Iteration 32 — complete · 포트폴리오 전체 회귀 검증

- Static suite: 현재 확장 전장 거리(동료 흔적 4,800/13,200/21,800)와 MIKA 전용 사격 렌더
  계약을 과거 테스트에 반영했습니다. `npm test` 266/266, TypeScript 검사, production Vite build
  (4,613 modules), Sites worker 4/4가 모두 통과했습니다.
- Core browser flow: Edge에서 데스크톱 1440×810, 모바일 가로 812×375, 모바일 세로
  390×844를 각각 검증했습니다. 첫 로딩, 저장 슬롯, 기지, 상위 권역/개별 구역 선택, 첫 전투
  가이드, 출격 영상, 일반전, 보스 패턴, 레벨업, 일시정지, 전술 미니맵, 세로 터치 조이스틱과
  자동 조준까지 console/page/network error 0을 확인했습니다.
- Presentation and media: AEGIS 520×737, MIKA 448×737 Cubism 캔버스는 idle frame 변화,
  터치 반응, 부위별 서로 다른 4개 반응이 모두 확인됐습니다. 타이틀/기지/2·3구역 BGM과
  Q/E/F/R 한국어 에이전트 음원(0.768~1.296초)은 실제 재생·MIME·metadata를 통과했습니다.
  세 출격 영상은 6.041667초이며, 숨겨진 Phaser 캔버스를 379~468ms 안에 백그라운드에
  장착하고 영상 종료 약 6.67초에 동일 런타임을 노출했습니다.
- Extended modes: 외곽 생산권역 4~6 월드맵·지역 배경·NEON FOUNDRY 전투 자산·브리핑 저장과
  타워 디펜스 3단계 선택, 패드 선택, 펄스 센트리 설치, 첫 웨이브 개시를 실제 브라우저에서
  검증했습니다. 캡처를 육안 확인해 화면 잘림, 빈 이미지, 치명적 겹침을 발견하지 않았습니다.
- Performance: RTX 4060 Ti/Edge WebGL의 8개 240-frame 프로파일이 오류 0으로 완료됐습니다.
  220적/620투사체 장면은 데스크톱·모바일에서 scene P95 36.7/36.5ms, render-submit P95
  2.9/2.5ms이며 adaptive PERFORMANCE를 유지했습니다. 보스 장면 render-submit P95는
  1.1~1.3ms, 최악 scene P95는 모바일 WRONG ENGINE의 48.2ms(50ms 예산 초과 4.6%)였습니다.
  프로파일의 decoded RGBA8는 장면별 58.317~76.032MiB이고 오류·리소스 실패는 0입니다.
- Runtime state: 검증 종료 후 `http://127.0.0.1:4174/`는 HTTP 200이며 QA 서버를 종료하지
  않았습니다.

final result: passed

### Iteration 33 — complete · 로비 Cubism 최종 판정과 원본 일러스트 전환

- Final diagnosis: 공개 런타임에서 두 MOC3와 WebGL Canvas는 로드됐지만, 8회 표본의 MIKA
  유휴 변화량이 화면 픽셀의 약 0.25%에 그쳐 육안상 정지 상태와 다르지 않았습니다. AEGIS도
  승인 원본의 얼굴을 독립적으로 변형할 수 없는 프록시 구조여서 이음새 없는 표정·머리카락
  반응을 동시에 만족하지 못했습니다. 파일이 로드되는 것과 고품질 Live2D가 완성된 것은
  다르다고 판정하고 마지막 프록시 리깅 시도를 종료했습니다.
- Runtime fallback: 로비는 `survivor-portrait.png`와 `mika-portrait.png` 원본을 고정된 3/4
  구도로 직접 렌더링합니다. Cubism React 의존성과 활성 컴포넌트를 제거했으며 Canvas, CSS
  홍조·얼굴선, 전신 이동 애니메이션을 만들지 않습니다. 투명한 머리·가슴·양팔·다리 터치
  영역과 캐릭터별 말풍선 대사는 유지합니다. 제작용 Cubism 자료는 향후 전문 독립 리깅을 위한
  비활성 자료로만 보존합니다.
- Focused verification: 로비/캠페인 계약 13/13과 TypeScript 검사가 통과했습니다. Edge
  1440×810에서 두 원본이 각각 941×1672로 완전히 로드되고 Canvas 0개, 터치 대사 정상,
  console/page error 0임을 확인하고 AEGIS·MIKA 로비 캡처를 육안 검토했습니다. 사용자의
  시간 절약 지침에 따라 전체 테스트와 production build는 실행하지 않았습니다.

final result: passed

### Iteration 34 — complete · 디펜스 첫 도전 가이드와 전술 UI 개편

- First-attempt onboarding: 새 저장 슬롯의 첫 `HAVEN 방어선`에서 레아가 기지 내구도, 건설 패드,
  네 포대의 역할, 공세 개시를 실제 UI 위 4단계 스포트라이트로 안내합니다. 안내 중에는 Phaser
  시뮬레이션과 건설·강화·웨이브 입력을 모두 정지시키며 Space/Enter/방향키/ESC는 가이드 전용으로
  처리합니다. 완료 또는 건너뛰기는 슬롯의 `defenseGuideSeen`과 호환 스토리 플래그로 영구 저장됩니다.
- Tactical hierarchy: 상단은 헤이븐 방벽 내구도를 가장 크게 두고 웨이브, 현장 적, 격파, 배치 자원을
  한 번에 읽도록 정리했습니다. 전장에는 세 침공 경로, 코어 표식, 12개 건설 패드의 선택·점유·강화
  단계를 추가하고, 하단 도크는 포대 역할·비용·단축키와 공세 상태를 명확히 분리했습니다.
- Responsive presentation: 데스크톱과 390×844 세로 모바일 모두 핵심 HUD, 명령 도크, 나가기 버튼,
  가이드 카드가 뷰포트 안에 유지됩니다. 세로 화면에서 16:9 Phaser 전장을 `contain`으로 보존하면서
  남는 영역은 동일 전장 배경으로 채워 검은 공백처럼 보이지 않게 했습니다.
- Essential verification: 디펜스 엔진·런타임·캠페인 저장 집중 테스트 17/17과 TypeScript 검사가
  통과했습니다. Edge 실전 QA에서 3단계 잠금, 4단계 가이드, Space 입력 차단, 가이드 저장, 패드 선택,
  펄스 센트리 설치, 첫 웨이브 개시, 데스크톱·세로 모바일 경계를 확인했고 console/page/HTTP 오류는
  `[]`였습니다. 사용자의 빠른 반복 지침에 따라 전체 테스트와 production build는 실행하지 않았습니다.

final result: passed

### Iteration 35 — complete · 모바일 세로 전용 UI와 전투 프레이밍

- Portrait menu system: 390×844 화면에서 타이틀을 68px, 주요 CTA를 58px 높이로 확대하고,
  저장 슬롯을 358px 폭의 한 열 카드로 전환했습니다. 상위 권역 지도는 258×95px 좌표 버튼과
  19px 지역명을 사용하며, 하위 구역은 88vw 단일 스냅 카드, 출격 준비는 전체 높이 상세 패널과
  하단 고정 승인 버튼으로 재구성했습니다. `viewport-fit=cover`와 safe-area inset을 모든 핵심
  상·하단 표면에 적용했습니다.
- Portrait combat: Phaser 논리 전장은 1280×720과 동일하게 유지하면서 touch+portrait 런타임에만
  route 1.12 / boss 1.06 표시 배율을 적용했습니다. 캔버스는 390×844 전체를 채우고 목표 17px,
  HP 25px, 148px 전술 미니맵, 158px 하단 전투 도크와 아이콘 아래 한국어 스킬명을 제공합니다.
  빈 전장 터치 조이스틱과 근접 적 자동 조준은 그대로 유지하며 판정·스폰·공격 규칙은 변경하지
  않았습니다.
- Essential verification: 모바일/Phaser HUD·런타임·캠페인 UI 집중 테스트 50/50과 TypeScript
  검사가 통과했습니다. Edge 390×844 실제 터치 QA에서 슬롯 3장이 한 열로 배치되고, 월드맵 버튼이
  viewport 안에 유지되며, 전투 가로 overflow 0px, 플레이어 이동, 세로 자동 조준, console/page/network
  오류 0을 확인했습니다. `qa/playtest-mobile-portrait.mjs`가 타이틀부터 저장 슬롯, 기지, 권역,
  구역, 출격, 전투, 조이스틱까지 캡처와 최소 크기를 회귀 검증합니다. 사용자의 빠른 반복 지침에
  따라 전체 테스트와 production build는 실행하지 않았습니다.

final result: passed

### Iteration 36 — complete · 모바일 세로 편의성 및 접근성 보강

- Touch-first guidance: 모바일 타이틀에서 데스크톱 WASD·마우스 문구를 숨기고 화면 드래그 이동,
  근접 적 자동 조준, 하단 스킬 아이콘 사용을 48px 터치 카드로 설명합니다. 하위 구역의 가로 스냅
  카드 위에는 42px `좌우로 밀어 구역 선택` 안내를 추가했습니다.
- In-combat convenience: 사운드 버튼 옆에 48×48px 일시정지 버튼을 상시 배치하고 대화·레벨업·
  튜토리얼 중에는 중복 입력을 차단합니다. 세로 일시정지 화면은 36px 제목, 14px 본문 버튼과
  56px 이상 한 열 액션으로 바꿔 `처음부터`와 `헤이븐-09 기지로`가 줄바꿈되지 않습니다.
  대시·태그·Q/E/F/R·일시정지/재개는 coarse pointer에서만 짧은 선택적 진동을 사용합니다.
- Essential verification: 모바일 세로·Phaser HUD·캠페인 UI 집중 테스트 21/21과 TypeScript 검사가
  통과했습니다. Edge 390×844 실제 터치 QA에서 모바일 조작 카드 48.75/48.75/42px, 스와이프 안내
  42px 이상, 일시정지 버튼 48×48px, 일시정지 액션 56px 이상, 가로 overflow 0px, 조이스틱 이동,
  console/page/network 오류 0을 확인했습니다. 전체 테스트와 production build는 사용자의 빠른 반복
  지침에 따라 실행하지 않았습니다.

final result: passed

### Iteration 37 — complete · PC/모바일 독립 반응형 계층과 한글 가독성

- Independent responsive systems: 세로 모바일과 fine-pointer PC의 마지막 CSS 계층을 분리했습니다.
  1440×600처럼 높이가 짧은 PC도 모바일 8px 축소 타이포그래피를 상속하지 않으며, 캠페인 본문은
  11px 이상, 뒤로가기/닫기 버튼은 36–38px 이상으로 유지합니다.
- Portrait readability: 기지 명령을 2열 + 전체 폭 디펜스로 재배치하고 장식용 후행 아이콘을 숨겨
  세 명령명을 한 줄로 유지했습니다. 권역 제목의 `· 구역 선택`을 의미 단위로 묶고 320px에서는
  31px 제목을 사용합니다. 출격 상세의 정보표와 캐릭터 편성을 한 열로 전환하고 무기 영문 보조명을
  숨겨 한글 이름을 우선했으며, 전체 폭 출격 버튼과 86px 스크롤 여유를 확보했습니다.
- Essential verification: 모바일/캠페인 집중 테스트 14/14와 TypeScript 검사가 통과했습니다.
  Edge에서 320×700, 360×800, 390×844 세로 모바일과 1440×600/1440×810 PC를 직접 조작했습니다.
  360px 홈 명령은 모두 20px 높이 한 줄, 출격 정보는 최대 두 줄, 단일 캐릭터 카드는 298px,
  출격 버튼은 314px 전체 폭이었고 가로 overflow와 console/page 오류는 모두 0이었습니다. 320px
  상세창은 viewport 기준 `(8, 8)–(312, 692)` 안에 고정됐습니다. 전체 테스트와 production build는
  사용자 지침에 따라 실행하지 않았습니다.

final result: passed

### Iteration 38 — complete · 자연스러운 한국어 문구 교정

- Copy audit: 타이틀, 저장 슬롯, 기지, 연구·장비·전투원 강화, 스킬 가이드, 권역·구역 선택,
  출격, 전투 HUD, 공세 경고, 결과 화면과 시나리오 대사의 번역투를 점검했습니다.
- Writing direction: `소거 확인`, `전송 중`, `전투 회선`, `편성 확정`처럼 명사가 연달아 붙는
  표현을 `적 전멸`, `불러오는 중`, `사용 스킬`, `이 편성으로 출격`처럼 짧고 행동이 분명한
  한국어로 바꿨습니다. 한영 혼합 고유명사와 전투 규칙은 그대로 유지했습니다.
- Verification: 문구·캠페인·HUD·전투 엔진 집중 테스트 105/105와 TypeScript 검사가 통과했습니다.
  Edge 1440×810과 390×844에서 저장 슬롯부터 기지, 권역 선택, 구역 상세까지 직접 이동해 새 문구와
  의미 단위 줄바꿈을 확인했습니다. 두 화면 모두 가로 overflow 0px, 상세창과 출격 버튼이 viewport
  안에 들어왔으며 console/page/network 오류는 0건이었습니다. 전체 테스트와 production build는
  사용자 지침에 따라 실행하지 않았습니다.

final result: passed

### Iteration 39 — complete · 디펜스 고프레임 미술과 네이티브 세로 전장

- Dedicated defense art: 헌터·소총수·저격수·공성 워커를 역할별 행으로 나눈 6×4 적 모션
  아틀라스와 펄스 탄도·연쇄 전격·박격 폭발·이지스 방벽을 분리한 6×4 전투 VFX 아틀라스를
  제작했습니다. 이동·충전·피격·파괴 프레임은 안정적인 적/effect ID로 재사용하며, Phaser tween은
  판정이 아닌 파괴 연출에만 사용합니다.
- Native portrait runtime: 세로 화면은 데스크톱 16:9 캔버스를 축소하지 않고 720×1280 전용
  HAVEN-09 전장과 고정 좌표 변환을 사용합니다. WebView가 fine pointer를 보고해도 세로 비율이면
  전용 런타임을 선택합니다. 기지 내구도 우선 HUD, 한 줄 포대 팔레트, 하단 명령 도크와 4단계
  레아 가이드는 390×844 safe area 안에서 스크롤과 가로 overflow 없이 유지됩니다.
- Essential verification: 디펜스 엔진·런타임 집중 테스트와 TypeScript 검사가 통과했습니다.
  Edge 390×844에서 실제 720×1280 Phaser 캔버스, 패드 선택, 펄스 센트리 배치, 첫 공세 6기,
  파괴 모션과 세로 전장 표시를 확인했습니다. 전체 테스트와 production build는 사용자 지침에 따라
  실행하지 않았습니다.

final result: passed

### Iteration 40 — complete · 모바일 텍스처 상주량 및 디펜스 렌더 핫루프 최적화

- Boot-time texture policy: 터치 중심 모바일 전투와 세로 디펜스는 기기 성능 등급과 무관하게
  표시 크기에 충분한 PERFORMANCE 아틀라스를 부트 시 한 번만 선택합니다. 데스크톱은 기존
  품질 감지를 유지하며, 실행 중 full/performance 텍스처 교체나 이중 상주는 허용하지 않습니다.
  태그 전환에 필요한 MIKA 8방향 시트도 8×8 셀 경계를 보존한 768×768 파생본으로 추가했습니다.
- Defense render loop: 타워·적·투사체·효과의 생존 ID Set과 건설 패드 랭크 Map을 재사용하고,
  적 애니메이션 오프셋은 생성 시 한 번만 파싱합니다. 같은 프레임은 `setFrame`을 다시 호출하지
  않아 다수 웨이브에서 GC 압력과 Texture frame lookup을 줄였습니다.
- Full verification: `npm test` 269/269, TypeScript 검사, production Vite build(4,610 modules),
  Sites worker 4/4가 통과했습니다. 타이틀→저장 슬롯→기지→권역/구역→출격→일반전/보스,
  외곽 4~6구역, BGM, 한국어 문구, 로비 초상화, 디펜스 첫 가이드와 모바일 세로 전장을
  Edge에서 재검증했으며 console/page/network 오류는 0개였습니다.
- Measured result: RTX 4060 Ti/Edge WebGL 240-frame 계측에서 390×844의 220적/620투사체
  decoded RGBA8는 58.317MiB에서 26.025MiB(-55.4%), 수송로는 26.077MiB에서
  6.519MiB(-75.0%)로 감소했습니다. 모바일 WRONG ENGINE 보스는 76.030MiB에서
  33.094MiB(-56.5%)였고, 2코어/2GiB 에뮬레이션은 전투 scene/render-submit P95
  37.9/3.7ms, 보스 35.7/1.1ms, 전투 drop 0%를 기록했습니다. 실제 VRAM과 GPU 완료 시간은
  브라우저가 공개하지 않으므로 수치는 TextureManager 중복 제거 RGBA8와 CPU 제출 시간입니다.
- Visual QA: 1440×810, 812×375, 390×844 캡처를 육안 확인했습니다. 일반 부하와 보스 위험
  패턴, 모바일 하단 스킬 도크, 전술 지도, 디펜스 720×1280 전장과 명령 도크가 모두 표시되며
  검은 빈 화면, HTTP 실패, 가로 overflow가 없었습니다. 세로 디펜스가 실제 performance
  전용 6×4 아틀라스 세 개를 요청하는 것도 네트워크 응답으로 고정했습니다.

final result: passed

### Iteration 41 — complete · 대규모 업데이트 이후 문서 정합성 감사

- Runtime-to-document audit: 최근 활성 소스와 2026-08-15 검증 기준을 루트 소개서,
  런타임 README, durable decisions, 프로젝트 가이드, AI 활용 보고서, CREDITS, BGM·TTS 절차와
  모바일 앱 출시 로드맵을 대조했습니다. 6개 구역의 300/1,000/1,000/1,100/1,150/1,200기 예산, AEGIS·MIKA와
  소총·검별 스킬, 태그, 외곽 중간 보스, 모바일 세로 플로팅 조이스틱, 타워 디펜스, 출격 중
  백그라운드 로딩을 현재 계약으로 통일했습니다.
- Retired-feature clarity: 활성 로비는 승인된 정적 AEGIS·MIKA 원본을 사용하며 Cubism 모델·모션은
  비활성 제작 자료라는 점을 CREDITS와 가이드에 명시했습니다. 01—03구역만 6초 출격 MP4와 전용
  BGM을 갖고, 04—06구역은 포스터 전환·무음 전투라는 현재 에셋 수명도 구분했습니다. 원격
  GitHub 저장소는 소유자 관리 Private, 공개 플레이는 현재 Sites 주소로 표기했습니다.
- Deliverables: 두 프로젝트 Markdown 원본을 갱신하고 `scripts/build-project-pdfs.py`로 게임 소개와
  AI 활용 PDF를 다시 생성했습니다. 링크·경로·금지된 이전 명칭·PDF 필수 문구를 정적 검사하고
  모든 PDF 페이지를 PNG로 렌더해 표·문단·이미지·페이지 번호의 잘림과 겹침을 확인했습니다.
  Google Play API 36 일정과 Apple 최소 기능 기준은 각 플랫폼의 공식 문서로 다시 확인했습니다.
- Verification scope: 이번 변경은 문서와 생성 PDF만 대상으로 했습니다. 사용자의 빠른 반복 지침에
  따라 전체 게임 테스트·production build·Sites 검증은 다시 실행하지 않았으며, 최신 전체 기준은
  Iteration 40의 269/269와 build/Sites 통과 상태입니다.

final result: passed

### Iteration 42 — complete · 모바일 기지 NPC 대화창 재구성

- Root cause: 세로 휴대폰에서도 900px 이하 공통 압축 규칙이 적용되어 초상화용 230px 왼쪽 여백 뒤에
  본문과 두 행동 버튼이 함께 눌렸고, `사용 스킬 브리핑` 같은 한국어 행동명이 글자 단위 세로 줄바꿈으로
  무너졌습니다.
- Portrait layout: 기지 NPC 대화창을 safe area 안의 하단 시트로 분리하고, 화자 초상화 108px,
  본문 15px, 52px 행동 버튼을 각각 독립 영역에 배치했습니다. 380px 이하에서는 보조 행동과 `다음`을
  한 줄씩 쌓고, 터치 화면에 불필요한 Space/ESC 도움말은 숨깁니다.
- Verification scope: 캠페인 UI 집중 테스트와 TypeScript 검사를 실행했으며, 전체 테스트·production build·
  공개 배포는 사용자의 빠른 반복 지침에 따라 생략했습니다.

final result: passed

### Iteration 43 — complete · 모바일 대화 초상화 레이어와 전체 폭 패널

- Layering: 휴대폰 세로 화면에서 NPC 초상화를 154px로 확대하고 패널 높이보다 96px 위로 올려,
  일러스트가 대화창 뒤에서 겹쳐 보이도록 초상화와 본문/행동의 z축을 분리했습니다. 긴 대사의
  스크롤 권한은 패널 전체가 아니라 본문 레이어가 가집니다.
- Width and safe area: 대화창은 좌우 여백 없이 화면 전체 폭을 차지하며 하단 safe area를 패딩으로
  흡수합니다. 380px 이하에서는 초상화를 132px로 조정하고 행동 버튼은 기존처럼 한 줄씩 쌓습니다.
- Verification scope: 캠페인 UI 집중 테스트와 420×900 브라우저 캡처를 확인하며, 전체 테스트·build·
  배포는 실행하지 않습니다.

final result: passed

### Iteration 44 — complete · 디펜스 단계별 전장과 경로 정합

- Side-content hierarchy: 기지의 `기지 방어` 진입 버튼을 메인 출격보다 낮고 작은 보조 명령으로
  축소하고, 모바일에서도 전체 폭 대형 CTA 대신 68% 폭의 얕은 버튼으로 유지했습니다.
- Single geometry source: `src/defense/battlefields.json`에 세 단계의 코어·세 침공로·열두 건설 패드를
  각각 분리했습니다. 적 이동은 점을 향한 조향에서 누적 경로 길이 샘플링으로 바뀌어 코너를 잘라
  지나가지 않으며, 모든 패드는 침공로 외곽 72px 이상에 위치합니다.
- Stage art and loading: 헤이븐 외곽선, 중계망 정전, 소버린 야간 공성의 가로/세로 전장을 별도로
  제작하고 동일 좌표 데이터로 도로와 소켓을 합성했습니다. 선택 카드에는 저용량 단계 미리보기를
  표시하고 Phaser는 선택 단계의 full 또는 PERFORMANCE 전장 한 쌍만 로드합니다.
- Essential verification: 디펜스 엔진·런타임·캠페인 UI·모바일 세로 집중 테스트 23/23과 TypeScript
  검사가 통과했습니다. 실제 브라우저에서 세 단계가 각자의 전장만 로드하는지, 새 건설 패드 선택과
  첫 웨이브 시작, 390×844 세로 HUD 경계를 확인했으며 콘솔·페이지·HTTP 오류는 0건이었습니다.
  전체 테스트·production build·배포는 사용자의 빠른 반복 지침에 따라 생략했습니다.

final result: passed

### Iteration 45 — complete · 디펜스 UI 가독성 재설계

- Hierarchy: 상단 HUD를 `방벽 내구도`, `웨이브`, `남은 적`, `격파`, `자원`으로 간결하게 정리하고,
  하단 명령창은 타워 이름·비용과 `웨이브 시작`을 가장 크게 표시했습니다. 타워 선택 정보는 레이블과
  이름을 두 줄로 분리해 붙어 보이지 않도록 했습니다.
- Readability: 데스크톱 핵심 레이블/수치는 12px/22~24px, 행동명은 16px로 확대했습니다. 390×844
  세로 화면에서는 핵심 레이블 12~13px, 수치 20~22px, 행동명 16px, 첫 도전 가이드 본문 15px와
  48px 행동 버튼을 유지합니다. 선택 화면과 결과 화면의 설명·통계·보상도 같은 체계로 확대했습니다.
- Essential verification: TypeScript 검사와 디펜스·캠페인·모바일 집중 테스트 17/17이 통과했습니다.
  브라우저에서 1440×810 및 390×844 화면의 실제 계산 글자 크기와 HUD 경계를 확인했으며,
  콘솔·페이지·HTTP 오류는 0건이었습니다. 전체 테스트·production build·배포는 실행하지 않았습니다.

final result: passed

### Iteration 46 — complete · MIKA 미연시 합류 장면과 빔 소드 해금 교본

- Recruitment staging: `wrong-engine-core` 최초 승리 뒤 RHEA→MIKA→AEGIS→MIKA 순서로 화자별
  실제 일러스트를 화면 중앙에 교체하고, 하단 전체 폭 대화창에서 한 줄씩 진행하도록 합류 장면을
  재구성했습니다. Space/Enter와 큰 행동 버튼이 같은 진행 경로를 사용합니다.
- Mobile framing: 412×915 세로 화면에서는 인물 일러스트를 대화창 뒤까지 크게 내리고, 266px
  하단 대화창과 56px 버튼을 safe area 안에 유지합니다. 데스크톱 1280×720에서는 대화창·진행선·
  중앙 인물이 겹치거나 잘리지 않는 것을 확인했습니다.
- Sword progression: `beam-sword`는 2구역 `glass-dune` 보스 첫 승리 전까지 출격 카드와 저장 API에서
  잠기며, 위조·구형 선택값도 펄스 소총으로 정리됩니다. 첫 해금 직후 전용 교본이 자동으로 열리고
  이후 출격 화면에서 다시 볼 수 있습니다. Q/E/F/R 쿨타임은 6/9/15/45초로 단축했습니다.
- Essential verification: TypeScript 검사와 캠페인 저장·캠페인 UI·무기 선택·검술 집중 테스트
  32/32가 통과했습니다. 실제 브라우저에서 최초 1구역 승리 합류 장면, 모바일 세로 구도, 2구역
  승리 직후 검술 교본을 확인했습니다. 전체 테스트·production build·배포는 실행하지 않았습니다.

final result: passed

### Iteration 47 — complete · 모바일 대화·스킬 가이드 품질 점검

- Dialogue QA: 390×844와 320×700 세로 화면에서 미카 합류 장면의 중앙 일러스트, 266px 하단
  대화창, 56px 진행 버튼을 확인했습니다. 긴 대사에서도 가로 넘침·문자 단위 줄바꿈·화면 밖 잘림은
  발생하지 않았습니다.
- Guide root cause: 900px 이하 공통 압축 규칙의 `left: 128px` 가로 화면용 관제관 레일이 세로
  휴대폰에도 적용되어 320px 화면의 스킬 예시가 10px 폭까지 압축되고 오른쪽 조작부가 잘렸습니다.
- Portrait guide: 레아를 88px 상단 안내 띠로 분리하고, 가이드 콘솔은 safe area 안의 전체 폭을
  사용합니다. Q/E/F/R은 66px 터치 탭, 스킬 예시와 설명은 내부 세로 스크롤, 이전·다음 버튼은
  48px 고정 행동 영역으로 구성해 작은 글자로 전체 화면을 억지 압축하지 않습니다.
- Verification scope: 모바일 세로·캠페인 UI 집중 테스트와 TypeScript 검사, 390×844 및 320×700
  실제 브라우저 확인만 실행했습니다. 전체 테스트·production build·배포는 실행하지 않았습니다.

final result: passed

### Iteration 48 — complete · 앱 출시 기준 모바일 전용 UI 구조

- Root cause: 휴대폰에서도 `max-height` 기반 데스크톱 압축 규칙이 먼저 적용되어 기지, 전투원 정보,
  디펜스 화면에 5~10px 글자와 22~39px 버튼이 남았습니다. 기존 화면의 단순 비율 축소만으로는
  실제 터치 조작과 한국어 가독성을 확보할 수 없었습니다.
- HAVEN mobile shell: 기지 화면을 `기지 정보·재화 → 중앙 캐릭터 → 가로 시설 레일 → 2+1 하단
  명령 덱` 순서로 재구성했습니다. 세 재화는 이름과 수치를 함께 표시하고, NPC 버튼은 64px,
  출격·전투원 버튼은 72px, 보조 콘텐츠인 기지 방어는 전체 폭 54px 버튼으로 유지합니다.
- Independent menus: 연구실·정비소는 단일 열 스크롤 시트, 전투원 정보는 상단 명령바·큰 일러스트·
  가로 캐릭터 레일·독립 스크롤 정보창으로 분리했습니다. 사용 스킬은 2×2 카드로 배치하고 본문은
  14px, 주요 행동은 48~52px 이상으로 고정했습니다.
- Defense mobile shell: 상단에는 방벽과 웨이브 정보를 두 줄로 표시하고, 하단에는 선택 정보·2×2
  타워 팔레트·58px 웨이브 행동을 분리했습니다. 첫 도전 가이드도 14px 본문과 48px 행동으로
  확대했습니다.
- Browser evidence: 390×844 기지 화면에서 시설 버튼 64px, 전투원·출격 73px, 기지 방어 54px,
  360×800 디펜스에서 타워 62px·웨이브 58px를 측정했습니다. 전투원 정보 콘솔은 482~836px로
  화면 안에 맞고 본문만 독립 스크롤합니다. 두 해상도 모두 문서 폭과 viewport 폭이 일치했으며
  console warning/error는 0건입니다.
- Capture artifacts: `qa/mobile-native-ui-v4/01-haven-home-390x844.png`,
  `02-character-info-390x844.png`, `03-research-lab-390x844.png`,
  `04-defense-combat-360x800.png`에 실제 렌더 결과를 보관합니다.
- Verification scope: TypeScript와 모바일·캠페인·디펜스 집중 테스트 18/18, 실제 390×844/360×800
  safe area, 글자 크기, 터치 영역, 내부 스크롤을 확인했습니다. 전체 테스트·production build·배포는
  사용자가 최종 검증을 요청하기 전까지 실행하지 않습니다.

final result: passed
