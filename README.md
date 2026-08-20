# HUMAN OVERRIDE: OVERLOAD

![HUMAN OVERRIDE: OVERLOAD key art](game/public/assets/overload/intro/start-screen-key-art.webp)

통치 AI **SOVEREIGN**이 장악한 세계에서, 이동 기지 **HAVEN-09**의 전투원 **AEGIS**와 **MIKA**가 기계 군단을 돌파하는 Phaser 기반 탑다운 액션 서바이버입니다. 6개 캠페인 구역, 캐릭터·무기별 전투 체계, 보스 패링·시한폭탄 기믹, 영구 성장과 별도 타워 디펜스 모드를 한 프로젝트에 담았습니다.

- [상세 런타임 문서](game/README.md)
- [전투 콘텐츠 기획 기준선](game/docs/project/content-design-baseline-ko.md)
- [게임 소개·플레이 가이드](game/docs/project/game-guide-ko.md)
- [AI 활용 기술 문서](game/docs/project/ai-usage-report-ko.md)
- [에셋·도구·라이선스 기록](game/CREDITS.md)
- [모바일 앱 출시 로드맵](game/docs/mobile-app-release-roadmap.md)
- [게임 소개 PDF](game/output/pdf/HUMAN_OVERRIDE_OVERLOAD_Game_Guide_KO.pdf)
- [AI 활용 기술 PDF](game/output/pdf/HUMAN_OVERRIDE_OVERLOAD_AI_Technical_Report_KO.pdf)
- [전투 콘텐츠 기획 PDF](game/output/pdf/HUMAN_OVERRIDE_OVERLOAD_Content_Design_Baseline_KO.pdf)
- [공개 플레이 사이트](https://human-override-overload.khyun97.chatgpt.site)

## 게임 흐름

게임은 전투가 아니라 HAVEN-09에서 시작합니다. HANA의 연구실, ILYA의 정비소와 캐릭터 동기화 화면에서 영구 강화를 준비하고, LARK의 비행선에서 작전 권역과 구역을 선택한 뒤 전장에 진입합니다.

- **소버린 내부망 · 01-03:** 오답 엔진 중앙로, 유리 사구, 심해 기록고
- **외곽 권역 · 04-06:** 네온 주조구, 폭풍 첨탑, 생체 금고
- **방어 작전:** 12개 방어 거점에 4종 포탑을 배치하는 3단계 타워 디펜스

캠페인 전장은 26,400×1,080 월드에서 진행됩니다. 근접형 8기로 시작한 뒤 현재 웨이브를 전멸하고 다음 전투 구간까지 전진하면 14→22→34→52→79→120→180→220기 관문 공세가 이어집니다. 전진만으로 미처치 적을 건너뛸 수 없고, 최종 공세는 종점 전에 배치됩니다. 첫 지역은 ROOK·NYX·MOSS 흔적을 모두 확인해야 하며, 외곽 권역은 적 예산 뒤 출현하는 중간 보스까지 격파하면 독립 보스전으로 자동 전환됩니다. 모든 지역 승리는 즉시 저장되며, 결과·보상과 해금 장면을 확인한 뒤 NIGHTJAR 귀환 연출로 이어집니다.

## 캐릭터와 장비

- **AEGIS:** 기본 펄스 소총을 사용하며, 2구역 유리 사구 보스 첫 클리어 후 빔 소드와 전용 짧은 주기 Q/E/F/R 검술을 해금합니다. 무기에 따라 수동 스킬과 레벨업 성장 트리가 바뀝니다.
- **MIKA:** 1구역 첫 클리어 직후 중앙 캐릭터 일러스트와 하단 대화창으로 구성된 합류 장면을 거쳐 팀에 들어옵니다. 쌍환 장비와 전용 프리즘·리본 스킬, 링 적중으로 스킬 회전을 줄이는 PRISM TEMPO와 수동 적중 보호막 HEART GUARD를 사용합니다.
- **태그:** MIKA 해금 뒤 전투 중 `T`로 캐릭터를 교대합니다. 태그에는 10초 쿨타임이 있습니다.

레벨업으로 얻는 자동 무기·스킬·동료 증강과 Q/E/F/R 직접 사용 스킬은 서로 독립된 시스템입니다.

## 조작

| 입력 | 기능 |
| --- | --- |
| WASD / 방향키 | 이동 |
| 마우스 / 트랙패드 | 조준; 기본 공격은 상시 자동 |
| Space | 무적 대시 |
| Q / E / F / R | 현재 캐릭터·무기의 전용 수동 스킬 |
| T | AEGIS ↔ MIKA 태그(해금 후) |
| Shift | 보스 패링 타이밍에 공격 반사 |
| 마우스 클릭 | 순서형 시한폭탄 해제 |
| 마우스 휠 | 카메라 줌 |
| Esc | 일시정지·창 닫기·기지 귀환 |

모바일 세로 전투는 버튼과 대화창을 제외한 화면 어디서든 시작하는 원형 플로팅 조이스틱과 최근접 위협 자동 조준을 사용합니다. PC와 모바일은 각 화면에 맞춘 독립 UI를 사용하며 같은 결정론 시뮬레이션과 판정을 공유합니다. 디펜스 모드도 720×1,280 세로 전장을 별도로 제공합니다.

## 빠른 실행

실제 Vite 앱은 `game/`입니다. Node.js 20 이상을 권장합니다.

```bash
cd game
npm ci
npm run dev
```

production 산출물은 다음 명령으로 생성합니다.

```bash
npm run build
```

## 기술 구성

- Phaser 4.2.1 + WebGL 캠페인·디펜스 렌더링
- React 기반 타이틀·기지·캠페인·HUD 인터페이스
- TypeScript + Vite production build
- 고정 60Hz 결정론 전투·디펜스 시뮬레이션
- CINEMATIC / BALANCED / PERFORMANCE 자동 품질 조정
- 플레이어·적·동료·지역 보스·방어 시설의 전용 스프라이트
- 지역별 지연 로딩, 출격 영상 중 백그라운드 전투 준비, 저사양 경량 텍스처
- 3개 저장 슬롯, 캐릭터·무기 선택, 연구·장비·증강 영구 성장

## AI 활용 제작

기획, Phaser 전면 이전, 구현, 리팩터링, 브라우저 QA, 성능 계측, 문서화와 Git 작업을 **OpenAI Codex Desktop** 중심의 바이브코딩 워크플로로 진행했습니다. ChatGPT / OpenAI ImageGen은 캐릭터·보스·전장·UI·스프라이트 제작, Grok은 1-3구역 출격 영상, Suno AI는 타이틀·기지·1-3구역 BGM, Gemini는 이미지·영상·음원 제작의 참고 검토, Google Cloud TTS는 짧은 한국어 전술 음성 제작에 활용했습니다.

게임의 적 이동·공격·보스 패턴은 생성형 API가 아니라 브라우저에서 실행되는 결정론적 게임 로직입니다. 상세 프롬프트, 선택 기준, 후처리, 원본·런타임 경로와 라이선스는 [CREDITS](game/CREDITS.md)에 기록했습니다.

**제출 전 권리 증빙 필요:** Suno BGM 5곡은 제작 파일·해시·브리프를 보존했지만, 현재 저장소에는 제작 계정·이용 플랜과 제작일 당시 상업적 공개 허용 범위를 입증하는 자료가 없습니다. 외부 포트폴리오 제출 전 증빙을 첨부하거나 증빙할 수 없는 트랙을 제거·교체해야 합니다.

## 저장소 안내

현재 GitHub 원격 저장소는 소유자가 직접 **Private**로 운영합니다. 실행에 필요한 소스와 런타임 에셋만 버전 관리하며, 로컬 QA 캡처, 생성 중간본, 브라우저 프로파일, 세션 인계 파일과 인증 정보는 제외합니다. 프로젝트 전용 AI 생성 에셋의 개별 재배포·재판매는 허용되지 않으며, 오픈소스 의존성은 각 원 라이선스를 따릅니다.
