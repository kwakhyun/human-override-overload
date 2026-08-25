# Android / iOS 앱 출시 로드맵

## 결론

현재 React + Phaser + 결정론 시뮬레이션을 폐기하거나 네이티브 엔진으로 다시 만들 필요는 없습니다.
첫 앱 버전은 **Capacitor 네이티브 셸** 안에 기존 Vite 결과물을 넣는 방식이 가장 효율적입니다.
전투 규칙과 콘텐츠는 웹·Android·iOS가 공유하고, 저장·오디오·진동·백버튼·앱 생명주기만
플랫폼 어댑터로 분리합니다. Capacitor는 기존 웹 프로젝트에 Android/iOS 플랫폼을 추가하고
네이티브 API에 접근하는 공식적인 웹 네이티브 런타임입니다.

현재 웹 기준선(2026년 8월 25일)은 캠페인 6개 구역, AEGIS·MIKA·VESPER 해금·태그, 펄스 소총·빔 소드,
Q부터 E→F→R을 여는 캐릭터별 스킬 성장, 3단계 타워 디펜스, 설정 메뉴와 모바일 세로 전용 UI까지 포함합니다. 앱 이관은 이 기능을 줄이는 재개발이
아니라, 검증된 웹 빌드를 네이티브 생명주기와 스토어 배포 체계에 연결하는 작업으로 봅니다.

- Capacitor 문서: <https://capacitorjs.com/docs>
- Android App Bundle: <https://developer.android.com/guide/app-bundle>
- Apple 앱 심사 지침: <https://developer.apple.com/app-store/review/guidelines/>

## 지금부터 유지할 경계

1. `src/swarm/engine.js`와 `src/defense/engine.js`는 플랫폼과 무관한 캠페인·방어 작전 권위 계층으로 유지합니다.
2. `src/phaser/`는 화면·입력 어댑터이며 모바일 캠페인은 세로 화면, 플로팅 조이스틱, 자동 조준을 사용하고 디펜스는 독립 720×1,280 전장을 사용합니다.
3. React는 HUD·로비·캐릭터·장비·지역 선택·타워 디펜스 메뉴·저장 슬롯·설정을 담당하고 CSS `safe-area-inset-*`를 항상 존중합니다. 하단 스킬 HUD와 미니맵, 태그 컷인은 노치·홈 인디케이터와 겹치지 않게 각 모서리 안전 영역 안에 고정합니다.
4. `src/platform/` 아래에 웹/Capacitor 차이를 모읍니다. 전투 코드가 Android 또는 iOS API를 직접
   호출하지 않게 합니다.
5. 사용자 제공 음원과 필수 전투 에셋은 앱 번들에 포함해 오프라인 첫 실행에서도 빈 화면이 없게 합니다.

다음 네이티브 단계에서 추가할 어댑터는 다음과 같습니다.

- 저장: 기존 슬롯 JSON을 보존한 채 `localStorage`에서 Capacitor Preferences 또는 파일 저장소로 이전
- 앱 생명주기: 백그라운드 진입 시 시뮬레이션·BGM 정지, 복귀 시 시간 샘플 초기화
- 오디오: 통화·다른 앱 오디오 인터럽션과 무음 모드 정책 처리
- 입력: Android 시스템 백버튼, iOS 홈 인디케이터 안전 영역, 선택적 햅틱
- 화면: Android manifest와 iOS Info.plist에서 세로 방향 기본값 설정
- 에셋: 6개 지역·3개 캐릭터·NPC 상세 일러스트·태그 컷인·디펜스의 지연 로딩 계약과 PERFORMANCE 텍스처 프로필 유지
- 업데이트: 세이브 스키마 버전과 에셋 캐시 버전을 앱 버전과 독립적으로 관리

## 권장 출시 순서

### 1. 모바일 웹 기준선

- 360×800, 390×844, 430×932 세로 화면에서 HUD·조이스틱·대화·레벨업·결과 화면 검증
- 저사양 Android 기준으로 30fps PERFORMANCE, 중간 기기 45fps BALANCED 목표
- 터치 2개 이상을 사용해 이동 중 대시·해금된 Q/E/F/R가 동시 입력되는지 검증하고 잠긴 스킬이 쿨타임을 소비하지 않는지 확인
- 3인 태그 순환·얼굴 컷인, 무기 전환, 보스 패링·슬로 모션 순서형 시한폭탄과 디펜스 건설·즉시 타워 재선택·웨이브 시작까지 실기기 터치 검증
- NPC 대화창은 상반신·확대 본문이 겹치지 않고 클릭 반응이 없으며, 상세 시설 화면의 하단 고정 NPC 일러스트만 클릭 대사를 재생하는지 확인
- 마스터/BGM/SFX, 화면·성능, 조작·접근성 설정이 재시작 뒤 유지되고 캠페인·디펜스 양쪽 오디오에 반영되는지 확인
- 브라우저 새로고침·백그라운드·화면 잠금 이후 세이브와 전투 정지 상태 검증

### 2. Capacitor 셸 추가

웹 프로젝트가 안정된 커밋에서 별도 브랜치로 진행합니다.

```text
npm install @capacitor/core @capacitor/cli
npx cap init
npm install @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios
npm run build
npx cap sync
```

`android/`와 `ios/`는 생성 후 소스 관리하되 서명 파일, 인증서, provisioning profile,
서비스 계정 키는 절대 저장소에 커밋하지 않습니다. iOS 빌드·서명·업로드에는 macOS와 Xcode가
필요합니다.

### 3. 내부 테스트

- Android: 서명된 AAB를 Play Console 내부 테스트에 먼저 배포합니다. 신규 앱과 업데이트는
  Google Play의 현재 target API 요구사항을 따라야 합니다. 2026년 8월 31일부터 신규 앱과
  업데이트는 Android 16 / API 36 이상 대상 요구가 적용됩니다. 실제 제출 직전에는 아래 공식
  문서에서 일정과 예외를 다시 확인합니다.
- iOS: Xcode로 archive를 만들고 App Store Connect에 업로드한 뒤 TestFlight 내부 테스트부터
  진행합니다.
- 실기기 최소 행렬: 저사양 Android 1대, 중간 Android 1대, 최신 Android 1대, 작은 iPhone 1대,
  노치/Dynamic Island iPhone 1대, iPad 1대.

공식 문서:

- Google Play target API: <https://support.google.com/googleplay/android-developer/answer/11926878?hl=ko>
- Google Play 테스트 트랙: <https://support.google.com/googleplay/android-developer/answer/9845334?hl=ko>
- TestFlight: <https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview>
- Apple 빌드 업로드: <https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds/>

### 4. 스토어 제출 준비

- 고유 패키지 ID와 Bundle ID, 버전/빌드 번호
- Android upload key와 Play App Signing, iOS 배포 인증서와 provisioning
- 공식 아이콘, 스플래시, 휴대폰/태블릿 스크린샷, 30–60초 미리보기 영상
- 연령 등급, 지원 URL, 개인정보 처리방침, 저작권·AI 생성 에셋 출처
- Google Data Safety와 App Store Privacy의 실제 수집 데이터 선언
- Apple privacy manifest와 사용하는 SDK의 required-reason API 점검
- 오프라인 실행, 복구 가능한 저장, 결제 없이 완결되는 기본 플레이, 계정 삭제가 필요한 경우 삭제 흐름

공식 문서:

- Google Data Safety: <https://support.google.com/googleplay/android-developer/answer/10787469?hl=ko>
- App Store Privacy: <https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/>
- Apple privacy manifest: <https://developer.apple.com/documentation/bundleresources/privacy-manifest-files>
- Apple Developer Program 등록: <https://developer.apple.com/programs/enroll/>

## 심사 위험을 줄이는 기준

단순히 웹사이트를 감싼 앱처럼 보이지 않게 해야 합니다. 게임은 로컬 에셋 기반의 완전한 전투,
오프라인 첫 실행, 네이티브 생명주기, 안전 영역, 백버튼, 선택적 햅틱, 안정적인 저장과 실기기 성능을
제공해야 합니다. Apple 심사 지침 4.2의 최소 기능 요구를 충족하도록 실제 게임 경험을 중심으로
설계하고, 웹 링크 모음이나 원격 페이지 셸 형태로 배포하지 않습니다.

## 아직 하지 않을 일

- Capacitor 패키지와 `android/`, `ios/` 프로젝트는 모바일 웹 QA 기준선이 확정되기 전에 추가하지 않습니다.
- 웹과 앱을 서로 다른 전투 코드로 포크하지 않습니다.
- 앱 안에서 원격 Vite 사이트를 여는 방식으로 출시하지 않습니다.
- 서명 키·클라우드 인증 정보·스토어 비밀값을 클라이언트 번들이나 Git에 넣지 않습니다.
