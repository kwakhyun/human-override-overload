# Google Cloud AI agent voice pipeline

탑재 AI 시스템 음성은 브라우저 `speechSynthesis`나 런타임 네트워크 호출을 사용하지 않습니다.
Google Cloud Text-to-Speech의 `ko-KR-Chirp3-HD-Kore`로 한국어 MP3를 개발 단계에서 한 번
생성한 뒤 정적 게임 자산으로 검수·커밋하는 구조입니다. **현재 런타임은 F/R 두 음성만 재생**하며,
과거 Q/E 파일은 제작 이력으로 보존하되 `AGENT_VOICE_PATHS`에 등록하지 않습니다. 인증 정보는
브라우저 번들이나 저장소에 들어가지 않습니다.

## 제작된 대사와 런타임 상태

- Q / EMP PULSE: `EMP 전개.` · 제작 이력만 보존, 런타임 제외
- E / AEGIS WARD: `방벽 전개.` · 제작 이력만 보존, 런타임 제외
- F / STRATOS RUN: `지원 폭격 개시.` · 런타임 사용
- R / HELIX TEMPEST: `섬멸 모드 개시.` · 런타임 사용

## 현재 적용 상태

- Google Cloud 프로젝트: `uptime402-hack-260803`
- API: Cloud Text-to-Speech API 활성화
- 음성: `ko-KR-Chirp3-HD-Kore`
- 발화 속도: 1.3배(`speakingRate: 1.3`)
- 출력: 보존 MP3 4개, 런타임 등록 MP3 2개, `public/assets/audio/agent/`
- 런타임: `src/audio/agentVoice.js`가 성공한 `manualAbilityActivated`만 재생
- 적용 범위: AEGIS 펄스 소총 F/R만 재생. Q/E, 빔 소드, MIKA, VESPER는 전용 런타임 파일이 없어 무음
- 인증: Cloud Shell의 일시 접근 토큰으로 개발 단계에서만 합성했으며 저장소·브라우저 번들에는 없음

| 키 | 상태 | 파일 | 크기 | SHA-256 |
| --- | --- | --- | ---: | --- |
| Q | 보존만 | `emp-pulse-start.mp3` | 4,800 bytes | `f17caa8477a6e53672b328f265e958b933859778913a9420bf4d44151256fddc` |
| E | 보존만 | `aegis-ward-start.mp3` | 3,072 bytes | `9eeda8a260be74f9c451cc0df506c16766f1e16c4a2d0b14db9c0c4151bb49b8` |
| F | 활성 | `stratos-run-v2.mp3` | 5,184 bytes | `f4918e52845e2bcf8587cacbdf5ff04b10fcb77a609aa673d731fe5b379affe1` |
| R | 활성 | `helix-tempest-start.mp3` | 3,648 bytes | `3e6ea9f10e7fba611790802ace128fccefd54f8e09823d9f4c0a1f07db7ab654` |

## 공식 재생성 절차

1. Google Cloud 프로젝트에서 Cloud Text-to-Speech API와 결제를 활성화합니다.
2. Google Cloud CLI를 설치합니다.
3. `gcloud auth application-default login`으로 로컬 ADC를 설정합니다.
4. PowerShell에서 `$env:GOOGLE_CLOUD_PROJECT="프로젝트_ID"`를 설정합니다.
5. `npm run generate:agent-voice`를 실행합니다.

특정 음성만 교체할 때는 `node scripts/generate-google-agent-voice.mjs --abilities=stratosRun,helixTempest`처럼
쉼표로 대상을 지정해 검수 완료된 다른 음원을 보존합니다.

생성 위치는 `public/assets/audio/agent/`입니다. 생성기는 Windows의 `gcloud.cmd`도 직접 처리합니다.
재생성 후 대상 음원의 대사·길이·무음·클리핑과 위
해시 변경을 검토합니다. F/R 런타임 파일을 바꿀 때만 `AGENT_VOICE_PATHS`를 갱신하고, 모든 생성·교체는 CREDITS에 기록합니다. 인증이 없는 상태에서는
기존 저품질 브라우저 TTS로 대체하지 않고 현재 승인된 정적 파일을 유지합니다.

- Chirp 3 HD: https://cloud.google.com/text-to-speech/docs/chirp3-hd
- 오디오 파일 생성: https://cloud.google.com/text-to-speech/docs/create-audio
- 로컬 ADC 설정: https://cloud.google.com/docs/authentication/set-up-adc-local-dev-environment
