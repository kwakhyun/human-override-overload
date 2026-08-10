# Google Cloud AI agent voice pipeline

Q/E/F/R 시스템 음성은 브라우저 `speechSynthesis`나 런타임 네트워크 호출을 사용하지 않습니다.
Google Cloud Text-to-Speech의 `ko-KR-Chirp3-HD-Kore`로 네 개의 한국어 MP3를 개발 단계에서 한 번
생성한 뒤 정적 게임 자산으로 검수·커밋하는 구조입니다. 인증 정보는 브라우저 번들이나 저장소에
들어가지 않습니다.

## 확정 대사

- Q / EMP PULSE: `전자기 펄스 전개.`
- E / AEGIS WARD: `이지스 방벽 전개.`
- F / STRATOS RUN: `공중 소사 좌표 확인.`
- R / HELIX TEMPEST: `나선 폭풍 승인.`

## 현재 적용 상태

- Google Cloud 프로젝트: `uptime402-hack-260803`
- API: Cloud Text-to-Speech API 활성화
- 음성: `ko-KR-Chirp3-HD-Kore`
- 출력: MP3 4개, `public/assets/audio/agent/`
- 런타임: `src/audio/agentVoice.js`가 성공한 `manualAbilityActivated`만 재생
- 인증: Cloud Shell의 일시 접근 토큰으로 개발 단계에서만 합성했으며 저장소·브라우저 번들에는 없음

| 키 | 파일 | 길이 | 크기 | SHA-256 |
| --- | --- | ---: | ---: | --- |
| Q | `emp-pulse-online.mp3` | 2.088초 | 8,352 bytes | `1c8a53fa6da80ffb656eb4f656ca8a6c1fde5dcc58347f8290ddbaa78e286dad` |
| E | `aegis-ward-online.mp3` | 2.136초 | 8,544 bytes | `3b6056c4e41493557a70995856ec05210fe5c56e3a26eb7360c8d08d623deb0e` |
| F | `stratos-run-confirmed.mp3` | 1.656초 | 6,624 bytes | `61f742ac083247adadb348bdf5b81b6eaf3edee629e735a46813c2a061476623` |
| R | `helix-tempest-authorized.mp3` | 1.776초 | 7,104 bytes | `8666c526e4cda41b4b1ef619d48b20e01f5ec3b6c35bc4347918d3b167aaeb37` |

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
