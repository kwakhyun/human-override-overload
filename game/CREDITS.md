# Assets, Tools, and Licenses

## Active original game assets

아래 이미지는 모두 이 프로젝트 전용으로 OpenAI 내장 이미지 생성 도구를 사용해 신규
제작했습니다. 외부 게임 에셋 팩이나 타인의 게임 이미지는 사용하지 않았습니다.

- `public/assets/survivor/adaptive-arena.png`
  - AI 전투 훈련용 원형 파운드리 전장.
  - 주요 프롬프트: 직교 90도 상부 시점, 16:9 개방형 원형 전장, 4개 진입 게이트, 중앙
    반응로, 흑철·시안·적색·호박색 팔레트, 캐릭터·UI·텍스트 제외.
- `public/assets/survivor/player.png`
  - 흰 세라믹 장갑, 암청색 관절, 시안 바이저와 펄스 라이플을 가진 전투 엔지니어.
- `public/assets/survivor/hunter.png`
  - 4족 근접 추적 드론.
- `public/assets/survivor/suppressor.png`
  - 장거리 코일 라이플을 사용하는 AI 사수. NULL 해커 변형도 이 원본에 엔진 색 변환을 적용합니다.
- `public/assets/survivor/brute.png`
  - 방패와 충격포를 가진 중장갑 기체. 최종 보스의 시각 원본으로도 사용합니다.

캐릭터 공통 프롬프트 조건은 실제 90도 상부 시점, 동쪽을 향하는 단일 배우, 전술 게임에서
작은 크기로 읽히는 실루엣, 균일한 `#ff00ff` 배경, 그림자·UI·텍스트 제외입니다. 생성 원본은
내장 `imagegen`을 사용했고, 프로젝트의 크로마키 제거 도구로 투명 PNG화했습니다.

## Original procedural sound

- 외부 효과음 파일을 사용하지 않습니다.
- `src/audio/sfx.js`에서 필터 노이즈, 오실레이터, 다이내믹 컴프레서, 절차적 공간 잔향을
  조합해 펄스 사격, 아크, 적 사격, 처치, 피격, 대시, 건설, EMP, 해킹, AI 카운터, 보스
  경보음을 실시간 합성합니다.

## Legacy prototypes

`public/assets/generated/`의 시설 맵·잠입 캐릭터·드론·보안 요원 이미지는 이전 잠입형
프로토타입에서 제작한 프로젝트 전용 생성물입니다. 현재 게임 코드에서는 로드하지 않지만
커밋 이력과 개발 과정을 보존하기 위해 저장소에 유지합니다.

## Pending music

- 배경음악은 Suno AI로 별도 제작 예정이며 현재 저장소에는 음원 파일이 없습니다.
- 최종 음원 추가 시 생성일, 주요 프롬프트, 이용 플랜과 라이선스를 이 문서에 추가합니다.

## Open-source dependencies

- React — MIT License
- Vite — MIT License
- Phosphor Icons — MIT License
- Rajdhani — SIL Open Font License 1.1
- IBM Plex Mono — SIL Open Font License 1.1

정확한 버전은 `package-lock.json`에 고정되어 있습니다.

