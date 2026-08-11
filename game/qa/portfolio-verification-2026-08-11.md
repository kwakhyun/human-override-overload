# HUMAN OVERRIDE: OVERLOAD 포트폴리오 검증 보고서

검증 일시: 2026-08-11 (KST)

검증 기준: local `main` / `4687de8`에서 시작

실행 환경: Windows, Microsoft Edge (Playwright headless), WebGL2, NVIDIA GeForce RTX 4060 Ti

## 결론

포트폴리오 공개를 막는 기능·렌더링·패키징 결함은 발견되지 않았다. 전체 자동 테스트, TypeScript, 프로덕션 빌드, Sites 패키징, 데스크톱/모바일 가로 실플레이, 오디오, 출격 영상, 보스 위기 기믹, 고부하 런타임 계측이 모두 통과했다.

## 자동 검증

| 항목 | 결과 |
|---|---:|
| `npm test` | 210 / 210 통과 |
| `npm run typecheck` | 통과 |
| `npm run build` | 통과, 4,600 modules transformed |
| `npm run test:sites` | 4 / 4 통과 |
| Sites 필수 산출물 | `dist/client/index.html`, `dist/server/index.js`, `dist/.openai/hosting.json` 확인 |

프로덕션 주요 JavaScript 청크는 Phaser 1,684.94 kB(raw)/381.36 kB(gzip), React vendor 193.81/60.54 kB, 앱 진입 207.23/59.78 kB이며 Phaser 전투 런타임은 동적 분할 상태를 유지한다.

## 브라우저 실플레이

- 타이틀 → 저장 슬롯 → 헤이븐-09 → 구역 상세 → 출격 영상 → 전투 흐름을 실제 브라우저로 통과했다.
- 첫 구역 300기, 후속 구역 1,000기 HUD와 전술 미니맵의 플레이어·적·게이트 표식을 확인했다.
- Q/E/F/R, Space, 휠 줌, ESC 일시정지, 레벨업 선택창, 3개 지역 보스, NPC 초상화, 첫 전투 오버레이를 확인했다.
- 레벨업 선택창은 초기 카드 포커스 0, 호버 0이었다.
- 데스크톱 HUD와 미니맵, 모바일 가로 HUD와 미니맵/터치 D-pad의 겹침은 0이었다.
- 브라우저 콘솔 오류, page error, HTTP 4xx/5xx는 0건이었다.
- 대표 캡처는 `qa/latest-*.png`와 `qa/runtime-profile-screenshots/`에 갱신했다.

## 오디오와 영상

- 타이틀 `under-ashen-skies-title.mp3`, 기지 `last-light-in-haven-09.mp3`, 유리 사구 `refraction-war-glass-dune.mp3`, 심해 기록고 `memory-below-pressure-abyssal-archive.mp3`가 화면별로 재생됐다.
- 3개 출격 MP4는 모두 6.041667초이며 종료 전에 Canvas가 생성되지 않고, 종료 직후 6.47–6.64초 범위에서 전투 Canvas가 표시됐다.
- Q/E/F/R 한국어 에이전트 음성 4개는 모두 HTTP 200으로 로드되고 스킬 성공 시 재생됐다. 길이는 0.984–1.68초다.

## 보스 위기 기믹

- 디버그 `bombs` 장면에서 캐릭터보다 큰 시한폭탄 2개와 고대비 순서 숫자 1·2를 화면 안에서 확인했다.
- 디버그 `parry` 장면에서 `지금 패링`이 `white-space: nowrap`, 실제 텍스트 line rect 1개로 표시됐다.
- 패링 1.5초, 2/4/8 폭탄 순서·시간 초과·오답 폭발 규칙은 엔진 테스트에서 통과했다.

## 고부하 런타임 계측

정확히 220 enemies / 620 player projectiles인 결정론 픽스처와 3개 지역 보스를 데스크톱 1440×810 및 모바일 가로 812×375에서 각 240 프레임 측정했다.

- 8 / 8 장면 오류 0, 활성 저해상도 스킬 텍스처 8 / 8, 폐기 고해상도 스킬 텍스처 0 / 3
- 적응형 품질이 선택한 30/45fps 프레임 예산 기준 드롭률 0.0%
- scene P95 27.9–35.4ms, rAF P95 7.0ms, render-submit CPU P95 0.9–2.4ms
- 이미지 전송 프록시 10.353–13.339MiB
- Phaser TextureManager 중복 제거 RGBA8 추정 48.601–66.310MiB

세부 원본은 `qa/runtime-profile-portfolio-final.json`, 요약은 `qa/runtime-profile-portfolio-final.md`에 있다. 물리 VRAM과 GPU 완료 시간은 일반 브라우저 API로 읽을 수 없으므로, RGBA8은 TextureManager 소스 추정치이며 render-submit은 GPU 완료 대기 시간이 아닌 CPU 명령 제출 시간이다.

## 검증 중 보정한 QA 계약

1. 네이티브 64px 시한폭탄 시트를 PERFORMANCE 공용 픽셀 자산 목록과 선택 지역 보스 로더 기대값에 추가했다.
2. 지역 보스 프로파일러가 2·3구역을 독립 실행할 때 첫 구역 클리어 슬롯을 준비하도록 수정했다.
3. 적응형 30/45fps 전환 뒤에도 60fps 기준으로 드롭률을 계산하던 계측기를 현재 `renderFps` 기준으로 수정했다.

위 변경은 게임 규칙을 바꾸지 않으며 테스트·프로파일러 정확도만 높인다.
