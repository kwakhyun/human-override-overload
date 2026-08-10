# HUMAN OVERRIDE: OVERLOAD

![HUMAN OVERRIDE: OVERLOAD key art](game/public/assets/overload/intro/start-screen-key-art.webp)

고도로 발달한 통치 AI **SOVEREIGN**이 장악한 세계에서, 전투원 **AEGIS**가 기계 군단을 뚫고 지역 추론핵을 파괴하는 Phaser 기반 탑다운 액션 서바이버입니다.

- [상세 런타임 문서](game/README.md)
- [에셋·도구·라이선스 기록](game/CREDITS.md)

## 게임 흐름

게임은 전투가 아니라 이동 기지 **HAVEN-09**에서 시작합니다. 연구원 HANA와 정비사 ILYA에게 영구 강화를 구매하고, 조종사 LARK의 비행선에서 작전 구역을 선택한 뒤 6초 출격 연출을 거쳐 전장에 진입합니다.

첫 지역 **오답 엔진 중앙로 · WRONG ENGINE CORE**에서는 전진형 수송로를 따라 기계 군단 300기를 제거합니다. 후속 지역 **유리 사구 · GLASS DUNE**와 **심해 기록고 · ABYSSAL ARCHIVE**는 각각 1,000기의 고유 적 조합과 독립 보스전을 제공합니다. 세 보스는 서로 다른 패턴, Shift 패링, 순서형 시한폭탄 기믹을 사용합니다.

## 조작

| 입력 | 기능 |
| --- | --- |
| WASD / 방향키 | 이동 |
| 마우스 / 트랙패드 | 조준; 기본 사격은 상시 자동 |
| Space | 무적 대시 |
| Q | EMP PULSE |
| E | AEGIS WARD |
| F | STRATOS RUN |
| R | HELIX TEMPEST |
| Shift | 보스 패링 타이밍에 공격 반사 |
| 마우스 휠 | 카메라 줌 |
| Esc | 일시정지·창 닫기·기지 귀환 |

모바일은 가로 모드 전용 HUD와 터치 이동·조준·스킬·패링 입력을 지원합니다.

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

- Phaser 4.2.1 + WebGL 전투 렌더링
- React 기반 타이틀·기지·캠페인·HUD 인터페이스
- TypeScript + Vite production build
- 고정 60Hz 결정론 전투 시뮬레이션
- CINEMATIC / BALANCED / PERFORMANCE 자동 품질 조정
- 플레이어·적·동료·지역 보스의 전용 모션 아틀라스
- 지역별 지연 로딩과 저사양 전용 경량 텍스처
- 3개 저장 슬롯, 연구·장비 영구 성장, 독립 지역 진행

## AI 활용 제작

기획, Phaser 전면 이전, 구현, 리팩터링, 브라우저 QA, 성능 계측, 문서화와 Git 작업을 **OpenAI Codex Desktop** 중심의 바이브코딩 워크플로로 진행했습니다. ChatGPT / OpenAI ImageGen은 캐릭터·보스·전장·UI·스프라이트 제작, Grok은 구역별 출격 영상, Suno AI는 타이틀·기지·지역 BGM, Gemini는 이미지·영상·음원 제작의 참고 검토, Google Cloud TTS는 짧은 한국어 전술 음성 제작에 활용했습니다.

게임의 적 이동·공격·보스 패턴은 생성형 API가 아니라 브라우저에서 실행되는 결정론적 게임 로직입니다. 상세 프롬프트, 선택 기준, 후처리, 원본·런타임 경로와 라이선스는 [CREDITS](game/CREDITS.md)에 기록했습니다.

## 저장소 안내

공개 저장소에는 실행에 필요한 소스와 런타임 에셋만 포함합니다. 로컬 QA 캡처, 생성 중간본, 브라우저 프로파일, 세션 인계 파일과 인증 정보는 제외합니다. 프로젝트 전용 AI 생성 에셋의 개별 재배포·재판매는 허용되지 않으며, 오픈소스 의존성은 각 원 라이선스를 따릅니다.
