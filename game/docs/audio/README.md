# 인터넷 효과음 적용 · 2026-09-08

Kenney의 Sci-fi Sounds, Impact Sounds, Interface Sounds, RPG Audio에서 38개 원본을 선별했습니다. 네 팩 모두 제공자의 CC0 라이선스를 확인했습니다. 라이선스 원문은 이 폴더의 kenney-*-LICENSE.txt에 보존합니다.

- https://kenney.nl/assets/sci-fi-sounds
- https://kenney.nl/assets/impact-sounds
- https://kenney.nl/assets/interface-sounds
- https://kenney.nl/assets/rpg-audio

원본: `reference/source-assets/overload/runtime-inputs/audio/kenney/`
실제 게임 파일: `public/assets/audio/sfx/kenney-v1/`
원본명·출처·변환 결과 해시·길이: [sfx-sources.json](sfx-sources.json)
이벤트별 연결·음량: `src/audio/sfxSamples.js`

38개 WAV는 총 1,288,900바이트입니다. 필요한 소리만 모노 PCM16으로 변환했습니다. 무음 앞뒤를 정리하고 잔향을 제한하며, 시작/끝 페이드와 피크·평균 레벨 제한을 적용했습니다. 원본은 변경 없이 따로 보존합니다. 총격·베기·금속 명중은 두 소리를 번갈아 재생합니다. 전투원별 기본 발사음과 검, 보호막 발동음은 별도 항목입니다. 투사체 명중은 발사음을 중복 재생하지 않습니다.

처음 오디오를 시작할 때 최대 네 요청씩 미리 읽고 해독한 버퍼를 재사용합니다. 준비되지 않았거나 해독에 실패한 파일은 기존 합성 효과음으로 즉시 대체하며 과거 이벤트를 나중에 재생하지 않습니다. 기존 음소거·음량 설정, 이벤트 빈도 제한, 일반 16/우선 24 음성 제한을 유지합니다. 음소거는 이미 울리는 효과음에도 적용됩니다. 배경음악·대사·게임 판정은 수정하지 않았습니다.

로컬 청음 화면: `/tools/sfx-review.html`. 버튼별로 현재 효과음을 재생합니다.
기존 합성기를 유지한 항목은 decoy, autoToggle, hacked, detectionTick입니다. 특수 캐릭터 스킬마다 독립적인 신규 원본을 제작한 것은 아닙니다.

검증 명령:
- `node --test tests/sfx-samples.test.mjs`
- `npm test`, `npm run build`
- 로컬 미리보기에서 `node scripts/verify-sfx-samples.mjs`

자동 검증은 파일·출처 해시, WAV 형식, 음량 경계, 준비/실패/폐기 시점, 동시 재생 제한 및 실제 Web Audio 재생을 확인합니다. 최종 음색 취향과 실물 휴대전화·헤드폰 청감 평가는 사용자가 청음 화면에서 추가 확인할 수 있습니다.

## 이번 검증 결과

전체 자동 테스트 418개, Sites Worker 검사 7개, TypeScript 및 production 빌드를 통과했습니다. 에셋 소유권 검사는 247개, 누락 0, 미사용 0입니다. 실제 Edge 브라우저에서 38개 파일을 모두 해독하고 52개 효과음 항목을 재생했으며, AEGIS 출격의 자동 사격·대시 버튼·EMP·보호막·일시정지/재개와 데스크톱/세로 화면을 확인했습니다. 런타임 오류와 음원 HTTP 실패는 0입니다. 전투 흐름 검사는 기존 디버그 안내 생략 경로를 사용했으며 전체 캠페인이나 실물 모바일의 청감 검증은 아닙니다.
