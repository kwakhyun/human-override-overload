# HUMAN OVERRIDE: OVERLOAD

4명 전투원과 6개 구역의 실시간 3D 배경·2D 전투를 결합한 웹 액션 서바이버입니다. 이 문서는 현재 실행·제작·검증 경로를 안내합니다. 상세 기획과 과거 측정 조건은 별도 문서에서 관리합니다.

## 실행과 검사

검증 환경은 Node.js 24.14.0입니다. 저장소의 `game/`에서 실행합니다.

```bash
npm ci
npm run dev -- --port 4174
npm test
npm run build
```

- `npm run analyze:assets`: 모든 구역·전투원·방어전·화질 단계·화면·음원의 누락과 미사용 공개 파일을 검사합니다.
- `npm run analyze:content`: 현재 콘텐츠와 경제 수치를 산출합니다.
- `npm run test:sites`: 저장 API와 배포 Worker를 검사합니다.
- 빌드는 에셋 검사 → TypeScript → Vite → Sites 패키징 순서입니다. 산출물은 `dist/client`, `dist/server`, `dist/.openai`입니다.
- `scripts/production-asset-policy.mjs`가 에셋 소유권과 구형 공개 경로를 검사합니다.
- `public/`은 실제 게임에 필요한 파일만 포함합니다. 제작 도구와 원본, 검수 화면, PDF는 배포하지 않습니다.

## 현재 플레이 규칙

- AEGIS는 기본 전투원입니다. MIKA는 01구역, VESPER는 03구역, NOX는 04구역 최초 클리어로 합류합니다.
- 출격은 최대 두 명입니다. 가능한 경우 현재 전투원과 다른 해금 전투원 한 명을 기본 선택하고, 단독 출격으로 바꿀 수 있습니다. 태그는 선택한 두 명만 번갈아 사용합니다.
- 각 전투원은 Q부터 시작하며 동기화 성장으로 E·F·R을 해금합니다. 스킬 상태와 재사용 대기시간은 엔진이 관리하고 교대 후에도 보존합니다.
- 내부망 01–03을 모두 해방하면 외곽 권역이 자동으로 열립니다. 브리핑 대화는 별도 잠금 조건이 아닙니다.
- 6개 구역과 보스방은 3D 배경을 공유하며 테마별 구조물이 다릅니다. 지정된 소형 구조물은 파괴 후 이동·사격 경로를 열고, 처치 수나 경험치는 주지 않습니다.
- 적은 전장 주변 8곳의 전송 게이트에서 진입합니다. 비행 지원은 SERA의 선행 정찰 지원·긴급 보급 지원·요격기 엄호 지원 중 하나를 선택합니다.
- 방어전은 세 작전과 네 종류 포탑을 사용하는 별도 결정론 엔진입니다. 캠페인 저장·재화·설정과 연결됩니다.

## 코드 구조

| 위치 | 책임 |
| --- | --- |
| `src/App.jsx` | 화면 이동, 진행 흐름, 앱 수명의 음악·설정·컨트롤러 연결 |
| `src/ui/campaign/CampaignScreens.jsx` | 기지, 전투원, 권역 선택, 출격 화면 |
| `src/ui/combat/ExpeditionCombatDock.jsx` | 전투 체력·스킬·태그 HUD |
| `src/ui/combat/cooldownPresentation.js` | 사용 가능·재충전·잠김 등 상태 표현 |
| `src/ui/defense/DefenseScreens.jsx` | 방어전 UI와 전술 안내 |
| `src/ui/combat/combatPresentation.js` | 전투 안내·대사·이벤트의 표현 |
| `src/ui/portrait/`, `src/ui/settings/` | 일러스트 카메라·상호작용, 설정 |
| `src/swarm/engine.js` | 캠페인 전투 판정·시간·상태 |
| `src/defense/engine.js` | 방어전 판정·웨이브·명령 |
| `src/game/content/` | 전투원·스킬·구역·지형·기지의 콘텐츠 규칙 |
| `src/game/save/`, `src/game/settings/` | 진행 저장·클라우드 복제·설정 |
| `src/game/assets/manifest.ts` | 런타임 에셋 등록과 상황별 로딩 |
| `src/phaser/` | 입력, 카메라, 씬 수명, 2D 렌더링 |
| `src/render/environment/` | 전 구역 Three.js 지형·투영·구조물 표현 |
| `src/audio/` | 음악 전환·재생 유지, 효과음, 음성 |
| `src/styles/` | 화면별 추가 스타일과 현재 HUD 규칙 |
| `worker/index.js`, `db/schema.ts`, `drizzle/`, `.openai/` | 저장 API, DB 스키마·마이그레이션, 배포 설정 |

React·Phaser·Three.js는 같은 시뮬레이션 상태를 표현합니다. 피해·충돌·스킬 시간은 렌더러로 옮기지 않으며, Three.js에 독립 실행 루프를 추가하지 않습니다. WebGL 장애 시 대체 지형과 기존 충돌 규칙을 유지합니다.

## 에셋과 제작 자료

현재 에셋은 `public/assets/`에 247개, 약 120.45MiB입니다. 최신 스프라이트는 `overload/quality-v3/`, 현재 일러스트와 음원은 manifest가 지정한 경로를 따릅니다. 구형 파일명에 숫자를 붙여 공개 폴더에 계속 쌓지 않습니다.

- `reference/source-assets/overload/runtime-inputs/`: AEGIS 원본 아틀라스, AEGIS·MIKA 원본 일러스트, 공통 비율 계약, Cubism 부위 분리 좌표입니다.
- `reference/source-assets/overload/sprite-quality-v3/`: 현행 그래픽을 다시 만드는 검수된 원본과 프레임 분리 자료입니다.
- `reference/source-assets/overload/live2d-production/`: 진행 중인 Cubism 원본입니다. AEGIS `parts-v2`는 완성된 상용 리깅이 아닙니다. 실제 제작 상태는 [리깅 기록](docs/live2d/aegis-parts-v2-session-2026-09-06.md)을 따릅니다.
- `tools/`: 로컬 전투 스프라이트·일러스트·현재 Cubism 검수 화면입니다. 개발 서버의 `/tools/combat-sprite-review.html` 등에서 엽니다.
- `docs/project/media/`: 문서에 실제로 쓰는 영구 이미지입니다. 임시 QA 캡처 경로와 사용자 다운로드 폴더에 의존하지 않습니다.
- `output/pdf/`: 현재 제출·열람용 PDF입니다. 생성 중간본은 `tmp/pdfs/`에 둡니다.
- `qa/`, `tmp/`, `dist/`: 재생성 가능한 검증·작업·빌드 결과입니다. 현재 필요한 제작 원본과 혼용하지 않습니다.

제작 명령은 [도구 안내](scripts/README.md), 정리 범위와 남은 로컬 파일은 [정리 기록](docs/maintenance/project-cleanup-2026-09-07.md)에 있습니다. 과거 시안·프롬프트·측정 결과는 [CREDITS](CREDITS.md), 관련 문서와 Git 이력으로 확인합니다.

## 검증

2026-09-07 정리 작업에서 현행 자동 테스트 410개, TypeScript, production 빌드, 프레임 분리 검사 2개를 통과했습니다. 구형 프로토타입 엔진과 그 전용 테스트 11개는 함께 제거했습니다. 실제 브라우저에서 출격·스킬 사용·재충전·일시정지·태그·PC/세로/가로 배치를 확인했습니다. 현행 에셋 209개의 파일 해시는 정리 전과 같습니다.

주요 브라우저 검수는 로컬 서버를 켠 뒤 `node scripts/verify-skill-readiness.mjs`와 `node scripts/verify-combat-sprites.mjs`로 실행합니다. 현재 도구는 Windows Edge와 번들 Playwright를 사용합니다. 다른 환경은 도구의 실행 경로를 맞춰야 합니다. 이 검수는 실제 모바일 기기의 성능 인증이나 전체 캠페인 클리어 기록을 뜻하지 않습니다.

## 문서

- [플레이 가이드](docs/project/game-guide-ko.md)
- [전투 콘텐츠 기획](docs/project/content-design-baseline-ko.md)
- [서비스 구조·저장·운영](docs/service-architecture-ko.md)
- [AI 활용과 검증 범위](docs/project/ai-usage-report-ko.md)
- [개발 포트폴리오](docs/project/portfolio-ko.md)
- [채용 제출용 PDF](output/pdf/human-override-overload-recruitment-portfolio.pdf)
- [에셋·라이선스·제작 이력](CREDITS.md)
- [음성 생성](GOOGLE_TTS_SETUP.md), [Suno BGM 프롬프트](SUNO_BGM_PROMPTS.md)
- [모바일 출시 로드맵](docs/mobile-app-release-roadmap.md)

공개 사이트: https://human-override-overload.khyun97.chatgpt.site


## 다운로드 효과음 · 2026-09-08

CC0 효과음 38개를 전투·보스·방어전·메뉴 효과음 52종에 연결했습니다. 현재 25개는 실제 총기·폭발·기계 조작 녹음으로 교체했으며, 메뉴음은 낮고 건조하게 조정했습니다. 나머지 13개는 기존 Kenney 효과음입니다. 총격·검·전투원별 발사·보호막·피격을 구분하며, 음원이 아직 준비되지 않았거나 로딩에 실패하면 기존 합성음으로 즉시 대체합니다. 출처와 원본, 변환 내역은 [효과음 기록](docs/audio/README.md)에 보존합니다. 로컬 미리보기의 `/tools/sfx-review.html`에서 각 효과음을 청음할 수 있습니다.
