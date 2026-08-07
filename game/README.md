# TRAIN ME WRONG — Adaptive Survivor

플레이어의 강한 빌드를 그대로 따라잡는 적 AI에 맞서, 전투 중 전략을 계속 틀어야 하는
5분짜리 웹 서바이벌·전술 타워 디펜스 게임입니다. 모든 판단과 게임 상태는 브라우저 안에서
실행되며 외부 API나 API 키가 필요하지 않습니다.

## 핵심 루프

1. 몰려오는 적을 자동 사격으로 처치하고 데이터 조각을 획득합니다.
2. 레벨업마다 3개 프로토콜 중 하나를 골라 무기·능력·방어 시설을 성장시킵니다.
3. 적 AI가 40초마다 피해원, 이동량, 설치물 의존도를 분석합니다.
4. 탄도 장갑, 장거리 포격, 타워 해커, 추적 군집 중 하나가 실제 다음 웨이브에 반영됩니다.
5. 5분째 등장하는 최종 보스 `THE INSTRUCTOR`를 파괴하면 한 런이 끝납니다.

## 조작

- `WASD` / 방향키: 관성 기반 이동
- `Space`: 무적 시간이 포함된 위상 대시
- `Q`: 센트리 배치(데이터 18, 최대 4기)
- `E`: EMP 파일런 배치(데이터 28, 최대 2기)
- 무기: 가까운 적을 자동 조준·사격

## 성장 시스템

- 무기: Pulse Overdrive, Forked Barrel, Ghost Round, Zero-Latency Trigger
- 공격 능력: Arc Cascade, Data Blades, Wingman Daemon
- 생존/유틸리티: Recursive Armor, Vector Legs, Data Magnet, Combat Patch
- 방어 시설: Sentry Firmware

일반 헌터는 기본 펄스 한 발에 제거됩니다. 레벨업은 초반 수 초 안에 시작되며, 데이터
조각은 1.35초 후 플레이어에게 자동 귀환해 전투 흐름이 끊기지 않습니다.

## AI 카운터 구조

- `KINETIC SHELL`: 펄스 비중이 높으면 일부 헌터가 탄도 피해 45%를 흡수
- `AREA DENIAL`: 이동량이 적으면 장거리 사수 비중 증가
- `TOWER HIJACK`: 설치물 의존도가 높으면 타워를 마비시키는 NULL 해커 투입
- `PURSUIT SWARM`: 이동량이 많고 피해원이 섞이면 빠른 다방향 추적 군집 투입

우측 `ENEMY MODEL` HUD는 현재 피해원 비율, 선택된 카운터, 대응 힌트를 실시간으로
표시합니다. AI 활용이 문서에만 존재하지 않고 플레이 규칙으로 직접 보이도록 설계했습니다.

## 실행과 검증

```bash
npm install
npm run dev
```

```bash
npm test
npm run build
npm run test:sites
```

## 에셋과 오디오

활성 전장과 캐릭터는 `public/assets/survivor/`에 있는 프로젝트 전용 이미지입니다. 배우
이미지는 마젠타 크로마키 제거 후 투명 PNG로 정리했고, 회전·가속·감속·반동·대시 잔상·
피격 플래시를 엔진에서 합성합니다. 효과음은 외부 음원 없이 `src/audio/sfx.js`에서 Web
Audio로 실시간 합성합니다. 자세한 출처는 [`CREDITS.md`](./CREDITS.md)를 참고하세요.

배경음악은 사용자가 Suno AI로 별도 제작할 예정이며 현재 빌드에는 포함하지 않았습니다.

