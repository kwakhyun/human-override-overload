# Google Cloud AI agent voice pipeline

Q/E/F/R 시스템 음성은 브라우저 `speechSynthesis`나 런타임 네트워크 호출을 사용하지 않습니다.
Google Cloud Text-to-Speech의 `en-US-Chirp3-HD-Kore`로 네 개의 영어 MP3를 개발 단계에서 한 번
생성한 뒤 정적 게임 자산으로 검수·커밋하는 구조입니다. 인증 정보는 브라우저 번들이나 저장소에
들어가지 않습니다.

## 확정 대사

- Q / EMP PULSE: `EMP pulse deployed. Hostile systems suspended.`
- E / AEGIS WARD: `Aegis Ward online. Defensive envelope stabilized.`
- F / STRATOS RUN: `Stratos Run confirmed. Air support entering the combat zone.`
- R / HELIX TEMPEST: `Helix Tempest authorized. Full-spectrum assault engaged.`

## 현재 적용 상태

- Google Cloud 프로젝트: `uptime402-hack-260803`
- API: Cloud Text-to-Speech API 활성화
- 음성: `en-US-Chirp3-HD-Kore`
- 출력: MP3 4개, `public/assets/audio/agent/`
- 런타임: `src/audio/agentVoice.js`가 성공한 `manualAbilityActivated`만 재생
- 인증: Cloud Shell의 일시 접근 토큰으로 개발 단계에서만 합성했으며 저장소·브라우저 번들에는 없음

| 키 | 파일 | 크기 | SHA-256 |
| --- | --- | ---: | --- |
| Q | `emp-pulse-online.mp3` | 16,512 bytes | `afb3179c222d5493c3d8d7e8d237616006be56600a5488c2d5be892f25339456` |
| E | `aegis-ward-online.mp3` | 19,104 bytes | `d04eebc2bdeb189c3db8752594c56ee90528407252d19ecb95c7020fa2309d0e` |
| F | `stratos-run-confirmed.mp3` | 20,736 bytes | `5d0af56e69f52cd787432ede2118f1b379bee14de424315e0ec27317d1ff5939` |
| R | `helix-tempest-authorized.mp3` | 19,392 bytes | `86a87a663329df3a5dc0a6441aceed39154f8d969a2aeef8dad9304fd460a1e8` |

## 공식 재생성 절차

1. Google Cloud 프로젝트에서 Cloud Text-to-Speech API와 결제를 활성화합니다.
2. Google Cloud CLI를 설치합니다.
3. `gcloud auth application-default login`으로 로컬 ADC를 설정합니다.
4. PowerShell에서 `$env:GOOGLE_CLOUD_PROJECT="프로젝트_ID"`를 설정합니다.
5. `npm run generate:agent-voice`를 실행합니다.

생성 위치는 `public/assets/audio/agent/`입니다. 재생성 후 네 음원의 대사·길이·무음·클리핑과 위
해시 변경을 검토하고 `AGENT_VOICE_PATHS` 및 CREDITS를 함께 갱신합니다. 인증이 없는 상태에서는
기존 저품질 브라우저 TTS로 대체하지 않고 현재 승인된 정적 파일을 유지합니다.

- Chirp 3 HD: https://cloud.google.com/text-to-speech/docs/chirp3-hd
- 오디오 파일 생성: https://cloud.google.com/text-to-speech/docs/create-audio
- 로컬 ADC 설정: https://cloud.google.com/docs/authentication/set-up-adc-local-dev-environment
