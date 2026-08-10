# 새 Codex 세션 첫 프롬프트

아래 내용을 새 Windows Codex 세션의 첫 메시지로 그대로 붙여 넣으세요.

```text
이 프로젝트는 NAN 2026 해커톤 사전 과제용 웹 게임 `TRAIN ME WRONG: OVERLOAD`입니다.
이전 macOS Codex 세션에서 개발한 작업을 Windows Codex Desktop에서 이어갑니다.

프로젝트 루트는 현재 열려 있는 `PROJECT/NAN2026`이고, 실제 Vite 앱은 `game/`입니다.
먼저 파일을 변경하지 말고 다음 문서를 전부 읽어주세요.

1. `game/AGENTS.md`
2. `game/README.md`
3. `game/CREDITS.md`
4. `../HANDOFF/CHAT_LOG.md` 또는 패키지 루트의 `HANDOFF/CHAT_LOG.md`
5. `../HANDOFF/HANDOFF_MANIFEST.md` 또는 패키지 루트의 `HANDOFF/HANDOFF_MANIFEST.md`

그다음 아래를 순서대로 수행하세요.

- `git status`와 최근 커밋을 확인합니다. 기준 커밋은 `3b70349`입니다.
- `game/`에서 Windows용 의존성을 `npm ci`로 설치합니다.
- `npm test`, `npm run build`, `npm run test:sites`를 실행합니다.
- 로컬 서버를 직접 실행하고 Codex 브라우저에서 첫 화면, 1,000기 물량전, 레벨업 모달,
  보스 3단계와 에임 정합성을 확인한 뒤 서버를 종료합니다.
- 확인 결과와 현재 구조를 간단히 요약하고, 다음 사용자 요청을 기다립니다.

현재 활성 게임 규칙을 임의로 과거 버전으로 되돌리지 마세요.

- 한 번에 한 캐릭터만 직접 조작
- 포인터 조준 + 상시 자동 기본 공격
- WASD/방향키 이동, Space 무적 대시, F 4-FRONT RECALL
- 고정 1,000기 적 전멸 후 THE WRONG ENGINE 보스전
- 보스 HP 840,000, 70%와 38%에서 전용 이미지로 변신
- 레벨업은 최초 6.4~9.6초, 이후 최소 5.4초 전투 간격
- 누적 레벨은 최대 3랭크 선택과 초과 영구 보너스로 압축
- 플레이어/적/보스 5×3 모션 아틀라스와 정적 폴백
- 줌 카메라, 미니맵, 캔버스 밖 COMBAT TELEMETRY HUD
- 보스 폭탄/스윕/링/돌진의 시각 경고와 실제 판정 일치
- 저사양 브라우저용 CINEMATIC/BALANCED/PERFORMANCE 자동 품질 조절

과거 `survivor/`, `adversarial/`, 4구역 관련 코드가 일부 남아 있어도 현재 App 런타임에
재연결하지 마세요. 사용자가 명시적으로 요청할 때만 복원합니다.

에셋은 프로젝트 원본입니다. 외부 게임 이미지를 추가하지 말고, 새 이미지가 필요하면 기존
스타일을 기준으로 ImageGen을 사용한 뒤 `CREDITS.md`에 프롬프트·도구·런타임 경로와 원본
경로를 기록하세요. 사용자 제공 BGM은 `game/public/assets/audio/overload-main-theme.mp3`이며
교체하지 마세요.

현재 공개 Sites 주소는
https://train-me-wrong-nan2026.khyun97.chatgpt.site
입니다. 사용자가 공개 배포를 명시적으로 요청하기 전에는 배포하지 마세요.

이전 최종 검증은 전체 테스트 101/101, Sites 4/4, production build 성공, 단일 탭 60 FPS,
적 220기+투사체 620개 벤치 약 4.157ms/step입니다. Windows 결과가 다르면 원인을 진단하고
사용자 승인 없이 핵심 게임 루프를 폐기하지 마세요.
```
