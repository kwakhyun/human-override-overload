# Animation overhaul asset and memory plan — 2026-08-10

## 구현 상태 — Iteration 8

- P1 영웅 마스터는 계획의 48프레임을 넘어 8×9, 192px 셀, 총 72프레임으로 출하했습니다.
  단일 atlas는 1536×1728, 약 10.1 MiB RGBA8로 2048×2048 / 16 MiB 제한 안에 있습니다.
- AnimationDirector가 영웅과 적의 실제 엔진 상태를 클립으로 선택하고, 동료·보스도 정적
  프레임 왜곡 없이 상태 기반 보간을 사용합니다. 적·동료·지역 보스의 전용 고프레임 atlas는
  이 문서의 P1/P2 후속 범위로 남겨 두었습니다.
- 선택 지역 일반전 자산과 보스방 자산의 단계별 로딩, Phaser/runtime/view/simulation 청크 분리는
  적용됐습니다. 최종 `phaser-vendor`는 1,684.94kB raw로 1.8MB 목표 안에 있습니다.
- 1440×810 및 812×375 Playwright QA, 전체 174개 회귀 테스트, Sites 4개 검사를 통과했습니다.

## 결론

현재 `public/assets/overload`의 런타임 PNG/WebP 57개는 모두 `src/`에서 참조된다. 파일 전송량은 14.55 MiB로 작지만, 브라우저가 RGBA8 텍스처로 펼치면 전체 잠재 점유량은 133.89 MiB다. mipmap을 생성하면 이론상 약 178.5 MiB까지 늘 수 있다. 따라서 모든 캐릭터와 VFX의 프레임을 한 번에 증설하면 저사양 기기에서 품질 프리셋을 낮춰도 텍스처 메모리는 줄지 않는 구조가 된다.

권장 방향은 다음과 같다.

1. 전투 로딩을 `A. 선택 지역의 루트 전투`와 `B. 입장 확인 후 선택 지역 보스`의 두 단계로 고정한다.
2. 시작 화면, 기지, NPC, 지역 선택, 보상 카드는 전투 텍스처 수명에서 제외하고 해당 화면에서만 지연 로드한다.
3. 하나의 거대 atlas를 만들지 않는다. 영웅, 적 역할별, 선택된 동료별, 공용 VFX, 대형 스킬 VFX, 선택 지역 보스 단계별로 나눈다.
4. 출하 atlas는 어떤 품질에서도 최대 2048×2048, 즉 RGBA8 16 MiB를 넘지 않는다. PERFORMANCE는 1024×1024를 우선한다.
5. CINEMATIC/BALANCED/PERFORMANCE는 같은 clip ID와 pivot을 공유하는 별도 해상도·프레임 밀도 변형을 사용한다. 초기 품질 판정 뒤 한 변형만 올리고, 전투 중 하향 시 낮은 변형을 먼저 올린 다음 교체한다.

이 문서는 계획만 정의한다. 런타임, manifest, App, 기존 문서는 변경하지 않았다.

## 측정 기준

- 조사 루트: `public/assets/overload/**/*.{png,webp}`
- 활성 판정: `src/**/*.{js,jsx,ts,tsx,css,html}`에서 실제 런타임 경로가 참조되는지 확인
- 파일 크기: 2026-08-10 작업 트리의 실제 바이트 수. 이미지는 Vite `public/`에서 그대로 복사되므로 gzip 전 크기로 본다.
- 픽셀 크기: PNG IHDR 또는 WebP VP8/VP8L/VP8X 헤더에서 직접 읽었다.
- 예상 GPU: `width × height × 4`의 RGBA8 한 장 기준이다. 드라이버 정렬, 별도 캔버스, framebuffer, font atlas, DOM compositor 표면은 포함하지 않는다.
- mipmap을 켜면 해당 텍스처는 약 `GPU × 1.33`, 품질 변형 교체 중에는 구 atlas와 신 atlas가 잠시 공존하므로 교체 대상만큼 순간 피크가 추가된다.
- WebP/PNG 압축률은 GPU 점유량을 줄이지 않는다. 전송량과 디코드 후 메모리는 별도 예산으로 관리해야 한다.

## 현재 인벤토리 요약

| 분류 | 파일 수 | 실제 전송 | 예상 RGBA8/GPU |
| --- | ---: | ---: | ---: |
| allies | 8 | 0.35 MiB | 2.00 MiB |
| boss | 4 | 2.11 MiB | 6.00 MiB |
| campaign | 3 | 1.05 MiB | 17.51 MiB |
| enemies | 4 | 0.74 MiB | 4.50 MiB |
| environment | 4 | 0.76 MiB | 24.39 MiB |
| hero | 2 | 2.19 MiB | 9.75 MiB |
| intro | 1 | 0.31 MiB | 7.91 MiB |
| items | 1 | 0.16 MiB | 0.56 MiB |
| regions | 6 | 3.62 MiB | 37.64 MiB |
| ui | 21 | 1.39 MiB | 14.25 MiB |
| vfx | 3 | 1.87 MiB | 9.38 MiB |
| **합계** | **57** | **14.55 MiB** | **133.89 MiB** |

현재 소스 참조에서 벗어난 PNG/WebP는 0개다. 다만 “참조됨”은 “동시에 필요함”과 같지 않다. 특히 App의 DOM 이미지 로더는 38개를 한꺼번에 요청하며, 이 묶음만 7.66 MiB 전송/64.48 MiB 디코드 크기다. DOM `Image`가 항상 WebGL texture로 상주한다고 단정할 수는 없지만, 브라우저 decoded-image cache와 compositor 메모리의 동시 압력을 만든다.

Phaser의 현재 로딩 수명은 이미 루트/보스 두 호출로 나뉘어 있으나, 보스 진입 뒤 루트 텍스처가 제거되지는 않는다.

| 현재 시나리오 | 파일 수 | 전송 | Phaser RGBA8 | DOM 경로와 합친 URL union RGBA8 |
| --- | ---: | ---: | ---: | ---: |
| WRONG ENGINE 루트 A | 18 | 4.47 MiB | 37.60 MiB | 88.34 MiB |
| GLASS DUNE 루트 A | 15 | 4.16 MiB | 27.35 MiB | 83.57 MiB |
| ABYSSAL ARCHIVE 루트 A | 15 | 3.99 MiB | 27.35 MiB | 83.57 MiB |
| WRONG ENGINE 보스 B까지 누적 | 20 | 5.84 MiB | 48.51 MiB | 96.25 MiB |
| GLASS DUNE 보스 B까지 누적 | 17 | 5.45 MiB | 38.26 MiB | 94.48 MiB |
| ABYSSAL ARCHIVE 보스 B까지 누적 | 17 | 5.39 MiB | 38.26 MiB | 94.48 MiB |

`URL union`은 같은 URL의 중복을 한 번만 센 상한 참고치이며 실제 WebGL residency 측정값은 아니다. 그래도 애니메이션 증설 전에 화면별 DOM preload와 Phaser TextureManager 수명을 분리해야 한다는 결론은 변하지 않는다. Chapter 1 루트는 1600×900 배경 3장을 동시에 올려 배경만 16.48 MiB를 사용한다.

## 전체 활성 파일

아래 GPU 값은 mipmap 없는 한 장의 RGBA8 기준이다.

| 런타임 경로 | 픽셀 크기 | 실제 전송 | 예상 GPU |
| --- | ---: | ---: | ---: |
| `allies/aegis-echo.png` | 256×256 | 29.5 KiB | 0.25 MiB |
| `allies/emp-pylon.png` | 256×256 | 45.2 KiB | 0.25 MiB |
| `allies/hunter-drone.png` | 256×256 | 50.8 KiB | 0.25 MiB |
| `allies/moss.png` | 256×256 | 35.6 KiB | 0.25 MiB |
| `allies/nyx.png` | 256×256 | 29.0 KiB | 0.25 MiB |
| `allies/pulse-sentry.png` | 256×256 | 58.0 KiB | 0.25 MiB |
| `allies/rook.png` | 256×256 | 52.1 KiB | 0.25 MiB |
| `allies/suppressor-drone.png` | 256×256 | 58.5 KiB | 0.25 MiB |
| `boss/wrong-engine-forms-atlas.png` | 1536×512 | 1083.6 KiB | 3.00 MiB |
| `boss/wrong-engine-phase1.png` | 512×512 | 311.5 KiB | 1.00 MiB |
| `boss/wrong-engine-phase2.png` | 512×512 | 356.4 KiB | 1.00 MiB |
| `boss/wrong-engine-phase3.png` | 512×512 | 412.9 KiB | 1.00 MiB |
| `campaign/airship-region-map.webp` | 1920×1080 | 349.6 KiB | 7.91 MiB |
| `campaign/haven-09-base.webp` | 1920×1080 | 310.0 KiB | 7.91 MiB |
| `campaign/squad-traces-atlas.png` | 1152×384 | 417.6 KiB | 1.69 MiB |
| `enemies/brute.png` | 256×256 | 50.8 KiB | 0.25 MiB |
| `enemies/enemy-motion-atlas.png` | 1280×768 | 645.6 KiB | 3.75 MiB |
| `enemies/hunter.png` | 256×256 | 32.4 KiB | 0.25 MiB |
| `enemies/suppressor.png` | 256×256 | 31.9 KiB | 0.25 MiB |
| `environment/boss-chamber.webp` | 1920×1080 | 319.9 KiB | 7.91 MiB |
| `environment/sector-01-shattered-approach.webp` | 1600×900 | 122.3 KiB | 5.49 MiB |
| `environment/sector-02-flooded-memorial.webp` | 1600×900 | 166.2 KiB | 5.49 MiB |
| `environment/sector-03-engine-causeway.webp` | 1600×900 | 174.9 KiB | 5.49 MiB |
| `hero/survivor-motion-atlas.png` | 1280×768 | 621.6 KiB | 3.75 MiB |
| `hero/survivor-portrait.png` | 941×1672 | 1620.1 KiB | 6.00 MiB |
| `intro/start-screen-key-art.webp` | 1920×1080 | 313.3 KiB | 7.91 MiB |
| `items/healing-kit-motion-atlas.png` | 768×192 | 161.3 KiB | 0.56 MiB |
| `regions/abyssal-archive/boss-forms-atlas.png` | 1536×512 | 972.5 KiB | 3.00 MiB |
| `regions/abyssal-archive/boss-room.webp` | 1920×1080 | 456.5 KiB | 7.91 MiB |
| `regions/abyssal-archive/route.webp` | 1920×1080 | 389.0 KiB | 7.91 MiB |
| `regions/glass-dune/boss-forms-atlas.png` | 1536×512 | 948.5 KiB | 3.00 MiB |
| `regions/glass-dune/boss-room.webp` | 1920×1080 | 370.1 KiB | 7.91 MiB |
| `regions/glass-dune/route.webp` | 1920×1080 | 566.0 KiB | 7.91 MiB |
| `ui/npcs/haven-npc-portraits-atlas.png` | 1536×512 | 807.2 KiB | 3.00 MiB |
| `ui/rewards/aiCore.webp` | 384×384 | 38.1 KiB | 0.56 MiB |
| `ui/rewards/airstrike.webp` | 384×384 | 36.4 KiB | 0.56 MiB |
| `ui/rewards/chain.webp` | 384×384 | 26.3 KiB | 0.56 MiB |
| `ui/rewards/damage.webp` | 384×384 | 38.1 KiB | 0.56 MiB |
| `ui/rewards/dash.webp` | 384×384 | 30.5 KiB | 0.56 MiB |
| `ui/rewards/drone.webp` | 384×384 | 21.5 KiB | 0.56 MiB |
| `ui/rewards/fireRate.webp` | 384×384 | 40.8 KiB | 0.56 MiB |
| `ui/rewards/multishot.webp` | 384×384 | 25.2 KiB | 0.56 MiB |
| `ui/rewards/nova.webp` | 384×384 | 35.7 KiB | 0.56 MiB |
| `ui/rewards/omegaLaser.webp` | 384×384 | 23.8 KiB | 0.56 MiB |
| `ui/rewards/orbit.webp` | 384×384 | 27.8 KiB | 0.56 MiB |
| `ui/rewards/pulse.webp` | 384×384 | 27.0 KiB | 0.56 MiB |
| `ui/rewards/rail.webp` | 384×384 | 28.9 KiB | 0.56 MiB |
| `ui/rewards/regen.webp` | 384×384 | 33.6 KiB | 0.56 MiB |
| `ui/rewards/rocket.webp` | 384×384 | 25.9 KiB | 0.56 MiB |
| `ui/rewards/scatter.webp` | 384×384 | 26.3 KiB | 0.56 MiB |
| `ui/rewards/sentry.webp` | 384×384 | 28.7 KiB | 0.56 MiB |
| `ui/rewards/shield.webp` | 384×384 | 33.0 KiB | 0.56 MiB |
| `ui/rewards/squadRecall.webp` | 384×384 | 33.5 KiB | 0.56 MiB |
| `ui/rewards/suppressor.webp` | 384×384 | 34.4 KiB | 0.56 MiB |
| `vfx/combat-fx-atlas.png` | 1024×768 | 402.4 KiB | 3.00 MiB |
| `vfx/omega-laser-motion-atlas.png` | 1024×768 | 749.4 KiB | 3.00 MiB |
| `vfx/skill-motion-atlas.png` | 1152×768 | 759.3 KiB | 3.38 MiB |

## 두 단계 전투 로딩 계획

시작/기지/지역 선택 화면은 전투 로딩 단계에 포함하지 않는다. 이 화면들의 DOM 이미지는 보이는 화면의 묶음만 올리고 화면 이탈 때 `<img>` 참조와 canvas 복사본을 해제한다. 보상 일러스트도 20장을 앱 시작에 모두 올리지 않고, 레벨업이 일시정지된 동안 제안된 카드 3장만 지연 로드한다.

### A — 루트 전투 진입

필수 resident:

- 현재 품질의 hero core/state atlas
- 드론 자폭형, 소총수, 저격수의 적 역할별 core atlas
- 공용 탄도/피격/소형 폭발 atlas
- 선택된 지역의 루트 배경과 흔적/회복 아이템
- 이미 보유했거나 이번 전투에서 선택된 동료 atlas만
- 현재 빌드에서 실제 활성화된 대형 스킬 atlas만

수명 규칙:

- 세 지역의 루트와 세 보스 묶음을 동시에 올리지 않는다.
- Chapter 1의 섹터 3장은 CINEMATIC/BALANCED에서 `현재 + 다음`만 resident, PERFORMANCE에서는 현재 섹터 1장만 resident로 둔다. 다음 섹터 전송은 가능하지만 디코드/TextureManager 등록은 전환 직전에 한다.
- 동료와 대형 스킬은 레벨업 일시정지를 안전한 로딩 창으로 쓴다. 선택되지 않은 후보 atlas는 즉시 버린다.
- 정적 폴백 한 장은 각 역할 atlas와 같은 key family에 두어 디코드 실패, context 복구, PERFORMANCE frame decimation에도 사용할 수 있게 한다.

### B — 보스 입장 확인 후

입장 팝업에서 사용자가 확인한 뒤에만 다음을 올린다.

- 선택 지역의 보스방 WebP
- 선택 지역 보스의 3개 고해상도 form base
- phase 1/2/3 motion overlay와 transform/defeat atlas
- 해당 보스의 폭탄/스윕/링/돌진 또는 지역 전용 signature VFX

새 묶음의 upload가 끝난 뒤 한 프레임 이상 정상 texture를 확인하고 fade 전환한다. 그 다음 루트 배경, 흔적, 루트 전용 대형 스킬 atlas를 제거한다. 보스가 잡몹을 소환할 수 있으므로 공용 적 core와 공용 impact VFX는 유지한다. 보스 phase 2/3 atlas가 크면 B 단계 내부에서 phase 1+공용을 우선 올리고, 전투 시작 직후 phase 2/3을 순차 prefetch하되 실제 texture 등록은 경계 전에 완료한다.

품질이 자동 하향되면 낮은 변형을 먼저 로드하고 clip의 프레임 경계에서 교체한 뒤 높은 변형을 제거한다. 자동 상향은 보스 입장, 레벨업, 대화처럼 simulation이 일시정지된 시점에만 허용해 전투 중 upload hitch를 막는다.

## atlas 제작 규격

공통 규칙:

- 모든 gameplay actor는 한 방향의 엄격한 90° 수직 탑다운 원본을 회전시킨다. 8방향 그림을 별도로 만들지 않는다.
- 모든 프레임은 동일한 canvas, pivot, 발/몸통 중심, 소총 견착점을 유지한다. hero는 오른쪽 어깨 견착 기준선을 고정한다.
- 셀 사이 투명 padding 4 px 이상, 색상 extrusion 2 px를 둔다. 인접 프레임 bleed가 없어야 한다.
- 프레임은 의미 단위 clip으로 명명하고 tier마다 동일한 clip ID를 사용한다. 프레임 수가 적은 tier는 timing table로 같은 총 재생 시간을 유지한다.
- atlas 한 장의 출하 상한은 2048×2048/16 MiB RGBA8다. CINEMATIC도 4096 mega-atlas를 만들지 않는다. BALANCED는 1536 이하를 선호하고 PERFORMANCE는 1024 이하를 선호한다.
- 정적 배경은 atlas에 넣지 않고 WebP 단일 텍스처로 둔다. 투명 actor/VFX는 우선 PNG, 이후 실제 기기 검증을 통과한 경우에만 KTX2/Basis 계열을 별도 검토한다.

| 역할 | CINEMATIC 권장 셀/프레임 | atlas 분할과 최대 크기 | BALANCED | PERFORMANCE |
| --- | --- | --- | --- | --- |
| Hero AEGIS | 192×192, 48f: idle 4, run 8, fire 6, dash 6, hit 4, reload/vent 6, skill 6, defeat 8 | `hero-core` 32f 1536×768 + `hero-state` 16f 1536×384 | 192×192, 36f | 128×128, 24f; 1024 이하 |
| Enemies | 역할당 192×192, 24f: approach 6, attack 6, hit 4, death/self-destruct 8. 드론/소총수/저격수 총 72f | 역할당 한 장, 6×4 셀=1152×768. 역할을 한 mega-atlas로 합치지 않음 | 역할당 18f, 같은 192 셀 | 역할당 12f, 128 셀; 역할당 768×256~512 |
| Humanoid allies | 유닛당 160×160, 24f: idle 4, move 6, fire 6, skill 4, hit 2, defeat 2 | 유닛별 6×4=960×640; 선택/보유 유닛만 resident | 유닛당 18f, 160 셀 | 유닛당 12f, 96 셀 |
| Drone/deployable allies | 유닛당 128×128, 20f: deploy 4, idle 4, attack 6, hit 2, destroy 4 | 유닛별 5×4=640×512 | 유닛당 16f, 128 셀 | 유닛당 10~12f, 96 셀 |
| Selected boss | form base 512×512×3 + 384×384 overlay 38f: phase별 8, transform 6, defeat 8 | base 1536×512; phase별 overlay 1536×768; transition/defeat 최대 1536×1536. 지역별 완전 분리 | base 512, overlay 320, 총 28f | base 384, overlay 256, 총 16f |
| Core combat VFX | 128×128, 48f: muzzle, hit, armor break, small explosion | 8×6=1024×768 | 36f, 128 셀 | 24f, 96 셀 |
| Heavy skill VFX | 256×256, 40f: bombardment warning/impact, electric arcs, laser charge/caps/impact | 8×5=2048×1280; 기술군별 분리 가능 | 28f, 256 셀 | 16f, 128 셀 |
| Selected boss VFX | 256×256, 24f; telegraph shape와 실제 판정은 engine 데이터를 그대로 사용 | 6×4=1536×1024; 지역별 한 장 | 18f, 224 셀 | 12f, 128 셀 |

Omega Laser는 긴 포신이나 한 프레임을 X축으로 늘이지 않는다. `emitter/muzzle`, 반복 가능한 `core tile`, `start/end cap`, `impact`를 같은 시간축으로 재생한다. beam 길이는 가운데 core tile을 반복하거나 shader/geometry로 채우고 양 끝 sprite의 종횡비는 고정한다. bombardment도 경고 원을 확대하는 방식에 의존하지 않고 `warning`, `descent`, `ground flash`, `debris/smoke` clip을 분리한다.

## tier별 애니메이션 원시/GPU/전송 예산

`원시`는 실제 프레임 셀의 `frame count × cell area × 4`다. `GPU cap`은 padding과 atlas 빈 공간을 포함한 상한이다. 전송 목표는 현재 PNG들의 약 15~35% 압축률을 바탕으로 한 범위이며, 실제 export 뒤 다시 측정해야 한다. Allies는 동시에 서로 다른 두 유닛 atlas가 resident인 보수적 경우다. Boss 값은 세 지역 합계가 아니라 현재 선택 지역 하나다.

| 그룹 | CINEMATIC 원시 / GPU cap / 전송 | BALANCED 원시 / GPU cap / 전송 | PERFORMANCE 원시 / GPU cap / 전송 |
| --- | --- | --- | --- |
| Hero | 6.75 / 7.50 MiB / 1.2~1.9 MiB | 5.06 / 5.50 / 0.9~1.4 | 1.50 / 1.75 / 0.3~0.6 |
| Enemies 3 roles | 10.13 / 10.80 / 1.8~3.0 | 7.59 / 8.20 / 1.3~2.2 | 2.25 / 2.50 / 0.45~0.8 |
| Allies, active 2 | 4.69 / 5.20 / 0.8~1.5 | 3.52 / 4.00 / 0.7~1.2 | 0.84 / 1.00 / 0.2~0.4 |
| Route core+heavy VFX | 13.00 / 14.00 / 2.8~5.0 | 9.25 / 10.00 / 2.0~3.5 | 1.84 / 2.20 / 0.4~0.9 |
| Healing/items reserve | 0.56 / 0.75 / 0.15~0.3 | 0.38 / 0.50 / 0.1~0.2 | 0.16 / 0.25 / 0.05~0.1 |
| Selected boss motion | 24.38 / 25.50 / 5.0~8.0 | 13.94 / 15.00 / 3.0~5.0 | 5.69 / 6.30 / 1.3~2.2 |
| Selected boss VFX | 6.00 / 6.50 / 1.3~2.4 | 3.45 / 4.00 / 0.8~1.5 | 0.75 / 1.00 / 0.2~0.5 |

Stage A의 새 애니메이션 resident 목표는 대략 CINEMATIC 38 MiB, BALANCED 28 MiB, PERFORMANCE 8 MiB다. 보스방에서는 route heavy VFX를 제거하고 core VFX만 남긴 뒤 boss motion/signature를 더해 각각 약 60/40/14 MiB 안에 맞춘다. 여기에 선택 지역 배경, font, 소형 UI texture가 추가된다.

## 품질 프리셋별 전체 상한

현재 품질 governor의 렌더 목표인 60/45/40 FPS는 그대로 전제한다. 아래 상한은 Phaser가 관리하는 gameplay image/atlas용이며 framebuffer, DOM compositor, 브라우저 자체 cache는 제외한다. 그래서 장치 전체 GPU 메모리보다 의도적으로 낮다.

| 프리셋 | gameplay texture resident | 그중 animation | A 전송 상한 | B 추가 전송 상한 | atlas 한 장 | 배경 resident |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| CINEMATIC | 96 MiB | 64 MiB | 12 MiB | 10 MiB | 2048×2048 / 16 MiB | 현재+다음 섹터 또는 보스방 |
| BALANCED | 64 MiB | 40 MiB | 8 MiB | 6 MiB | hard 2048, preferred 1536 | 현재 섹터 1장; 다음은 전송만 prefetch |
| PERFORMANCE | 36 MiB | 20 MiB | 5 MiB | 3 MiB | hard 2048, preferred 1024 | 1280×720 이하 현재 배경 1장 |

교체 순간 피크는 위 resident 상한의 125% 이내로 제한한다. 새 texture가 준비되기 전에 기존 texture를 지우지 않되, 성공한 다음 프레임에 즉시 제거한다. mipmap은 기본적으로 actor/VFX에 생성하지 않으며, 축소 품질이 실제 화면에서 개선되는 배경만 측정 후 허용한다.

현재 common Phaser 묶음만 이미 19.44 MiB다. 이는 제안한 PERFORMANCE animation 상한의 약 97%이므로, 대량 프레임 추가 전에 PERFORMANCE 전용 128/96px atlas와 DOM 지연 로딩을 먼저 갖춰야 한다. 현재 Chapter 1 Stage A 37.60 MiB도 PERFORMANCE 전체 상한을 1.60 MiB 넘으므로 섹터 한 장 resident 또는 1280×720 변형이 선행 조건이다.

## 구현 우선순위

### P0 — 예산을 강제할 기반

1. manifest descriptor에 `lifetime: shell | route | boss`, `tier`, `bytes`, `decodedBytes`, `clipMap`, `fallbackKey`를 둘 수 있게 설계한다.
2. 앱 시작 시 38개 DOM 이미지를 모두 받는 경로를 화면 단위 지연 로딩으로 나누고, 전투 진입 때 shell 이미지를 해제한다.
3. 품질별 URL resolver와 atlas clip table을 하나의 의미 계약으로 만든다. tier마다 frame index가 달라도 `hero.fire`, `sniper.attack`, `boss.phase2.sweep` 같은 clip ID는 같아야 한다.
4. TextureManager의 현재 key, 원본 크기, 추정 decoded bytes를 합산하는 개발용 계측과 CI asset-budget 검사를 추가한다.

### P1 — 가장 자주 보이는 모션

1. Hero 48-frame master를 먼저 만들고 오른쪽 어깨 견착, pivot, 360° 회전, 이동/공격 중 흔들림을 고정한다.
2. 드론 자폭형, 소총수, 저격수 atlas를 역할별로 제작한다. attack/death clip이 실제 engine event와 동기화되는지만 view layer에서 소비한다.
3. core hit/muzzle/explosion과 Omega Laser, bombardment, electric heavy VFX를 분리 atlas로 교체한다. 판정과 telegraph authority는 engine에 남긴다.

### P2 — 선택적으로 로드되는 고비용 모션

1. WRONG ENGINE을 기준으로 boss base+overlay 규격을 검증한 뒤 MIRROR TYRANT, DROWNED ORACLE에 같은 구조를 적용한다.
2. 동료는 유닛별 atlas로 제작하고 실제 선택 시에만 로드한다. 한 atlas에 8종 전체를 넣지 않는다.
3. 보스 phase 2/3 prefetch와 route texture eviction이 upload hitch 없이 동작하는지 검증한다.

### P3 — 압축과 장치 검증

1. PNG export에 무손실 최적화를 적용하고 alpha edge를 확인한다.
2. Windows 통합 GPU와 Android landscape에서 Spector/브라우저 memory 측정을 수행한다.
3. KTX2/Basis는 Phaser 4 로더, alpha 품질, context 복구, Sites 캐시가 모두 검증된 뒤에만 선택적으로 도입한다. 도입 전에는 이 문서의 RGBA8 예산을 기준으로 유지한다.

## 완료 판정

- 어떤 출하 atlas도 2048×2048 또는 16 MiB RGBA8를 넘지 않는다.
- 선택하지 않은 지역, 동료, 스킬, 보스 texture key가 TextureManager에 존재하지 않는다.
- 보스 입장 뒤 route-only texture가 제거되고, 전환 피크가 tier 상한의 125% 이하로 돌아온다.
- CINEMATIC/BALANCED/PERFORMANCE에서 같은 clip의 총 재생 시간과 engine event timing이 동일하다.
- hero와 모든 actor는 360° 회전 중 pivot drift가 1 display pixel 이하이고, muzzle/견착점 drift가 2 pixel 이하이다.
- Omega Laser core는 길이 변화 시 늘어난 사각형이나 포신 왜곡이 없고, 시작/끝 cap과 실제 판정선이 일치한다.
- 폭격/전기/보스 경고의 마지막 damage frame이 engine telegraph 종료와 일치한다.
- 220 enemies + 620 projectiles 장면에서 P95 render frame은 CINEMATIC 16.7 ms, BALANCED 22.2 ms, PERFORMANCE 25 ms 목표를 만족하거나 governor가 한 단계 하향한다. 기존 약 4.157 ms/step은 simulation 수치이므로 별도의 Phaser GPU frame 측정이 필요하다.
- decode/upload는 전투이거나 판정이 진행되는 프레임에 실행되지 않고, 레벨업·대화·보스 입장 pause 창에서 끝난다.
- texture decode 실패와 WebGL context restore에서 정적 폴백으로 게임 진행이 유지된다.
