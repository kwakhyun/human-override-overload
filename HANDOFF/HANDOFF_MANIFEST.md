# NAN2026 / TRAIN ME WRONG: OVERLOAD 인수인계

생성일: 2026-08-10 (Asia/Seoul)

이 패키지는 macOS의 Codex Desktop에서 개발한 NAN 2026 해커톤용 웹 게임을
Windows PC의 Codex Desktop에서 그대로 이어가기 위한 이동용 사본입니다.

## 패키지 구조

- `PROJECT/NAN2026/`
  - 프로젝트 전체 소스와 `.git` 이력
  - 실제 앱은 `PROJECT/NAN2026/game/`
  - `node_modules/`와 `dist/`는 용량 및 플랫폼 호환성 때문에 제외
- `HANDOFF/CHAT_LOG.md`
  - 초기 기획부터 최신 배포까지의 개발 대화 재구성 로그
- `HANDOFF/THREAD_EXPORT_RECENT.json`
  - Codex에서 가져온 최근 10개 턴의 원시 내보내기
- `HANDOFF/FIRST_PROMPT.md`
  - 새 Codex 세션의 첫 메시지로 그대로 붙여 넣을 프롬프트
- `HANDOFF/WINDOWS_SETUP.md`
  - Windows PowerShell 실행 및 검증 절차

## 현재 기준 상태

- Git 기준 커밋: `3b70349` (`feat: upgrade overload combat and animation`)
- Git 작업 트리: 패키징 전 clean
- 공개 Sites URL:
  - https://train-me-wrong-nan2026.khyun97.chatgpt.site
- Sites 최신 공개 버전: 2026-08-09 배포 성공
- 로컬 개발 서버: 종료 상태
- 최종 검증:
  - 전체 테스트 101/101 통과
  - Sites 테스트 4/4 통과
  - production build 성공
  - 단일 브라우저 탭 로컬 QA 60 FPS
  - 적 220기 + 투사체 620개 스트레스 벤치 약 4.157ms/step

## 현재 게임

활성 게임은 `TRAIN ME WRONG: OVERLOAD`입니다. 과거 잠입 게임, 4구역 지휘 게임,
적대적 예측 보스전 코드가 저장소에 일부 남아 있지만 현재 UI와 런타임은 단일 캐릭터
오픈 아레나 생존 액션입니다.

- 포인터로 조준, 기본 공격은 자동 발사
- WASD/방향키 이동, Space 무적 대시
- F로 과거 4전선 동료 4인 자동전투 호출
- 고정 1,000기 물량전 후 3단계 보스전
- 레벨업 선택은 연속 모달 대신 최소 5.4초 전투 간격과 배치 선택 적용
- 보스 HP 840,000, 70%/38%에서 전용 외형으로 변이
- 보스 접촉은 치명타, 0.8초 스턴, 1.4초 재피격 방지
- 줌 카메라와 우측 하단 미니맵
- 플레이어/적/보스 5×3 모션 아틀라스
- 프로젝트 원본 스프라이트 및 Web Audio 절차적 SFX
- 사용자 제공 BGM `game/public/assets/audio/overload-main-theme.mp3`

## 중요한 문서

새 Codex는 작업 전에 아래 파일을 반드시 읽어야 합니다.

1. `PROJECT/NAN2026/game/AGENTS.md`
2. `PROJECT/NAN2026/game/README.md`
3. `PROJECT/NAN2026/game/CREDITS.md`
4. `HANDOFF/CHAT_LOG.md`
5. `HANDOFF/FIRST_PROMPT.md`

## 제외 항목

- `node_modules/`: Windows에서 `npm ci`로 재생성
- `dist/`: Windows에서 `npm run build`로 재생성
- 임시 배포 아카이브와 개발 서버 로그
- Sites 소스 저장소의 단기 인증 토큰 및 기타 비밀값

`.openai/hosting.json`에는 비밀값이 아니라 기존 Sites 프로젝트를 찾기 위한 project ID만
포함되어 있습니다.
