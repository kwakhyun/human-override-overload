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

## 공식 준비 절차

1. Google Cloud 프로젝트에서 Cloud Text-to-Speech API와 결제를 활성화합니다.
2. Google Cloud CLI를 설치합니다.
3. `gcloud auth application-default login`으로 로컬 ADC를 설정합니다.
4. PowerShell에서 `$env:GOOGLE_CLOUD_PROJECT="프로젝트_ID"`를 설정합니다.
5. `npm run generate:agent-voice`를 실행합니다.

생성 위치는 `public/assets/audio/agent/`입니다. 생성 성공 후 네 음원을 직접 청취하고 길이·무음·
클리핑을 확인한 다음에만 런타임 manifest와 `manualAbilityActivated` 이벤트에 연결합니다. 인증이 없는
상태에서는 기존 저품질 브라우저 TTS로 대체하지 않고 음성 없이 안전하게 유지합니다.

- Chirp 3 HD: https://cloud.google.com/text-to-speech/docs/chirp3-hd
- 오디오 파일 생성: https://cloud.google.com/text-to-speech/docs/create-audio
- 로컬 ADC 설정: https://cloud.google.com/docs/authentication/set-up-adc-local-dev-environment

