# HUMAN OVERRIDE 서비스 아키텍처

## 목표와 선택

HUMAN OVERRIDE는 실시간 멀티플레이가 아닌 단일 플레이 브라우저 게임입니다. 프레임마다 서버와
통신하는 구조는 비용과 지연만 늘리므로 전투·디펜스 판정은 기존 60Hz 결정론 엔진에 유지합니다.
서버가 꼭 필요한 저장 복제와 에셋 전달만 ChatGPT Sites가 관리하는 Cloudflare 호환 Edge 계층에 배치합니다.

```text
브라우저
├─ React UI + Phaser View
├─ 60Hz 결정론 전투/디펜스 엔진
├─ localStorage v2 3슬롯 (즉시 저장·오프라인 권위)
└─ Cloud save sync
          │ same-origin HTTPS /api/v1
ChatGPT Sites 관리형 Worker
├─ 정적 SPA / 라우팅 fallback
├─ 익명 세션·저장 API
├─ D1: 프로필 토큰 해시 + revisioned campaign JSON
└─ R2: /cdn/assets/overload/* read-through 원본 캐시
          └─ Cache-Control 기반 Sites/CDN Edge 응답 캐시
```

이 선택은 별도 VM, 상시 실행 Node 서버, 로드 밸런서와 관리형 Postgres를 직접 운영하지 않는
현재 트래픽 단계의 가성비 우선 구조입니다. D1과 R2는 개인 Cloudflare 계정에 직접 만든 자원이 아니라
`.openai/hosting.json`의 논리 바인딩을 통해 Sites가 관리하며, 비용·용량은 해당 Sites 플랜 한도를 따릅니다.

## 요청 경계

| 경로 | 메서드 | 역할 |
|---|---|---|
| `/api/v1/health` | GET | D1·R2 바인딩 상태 확인 |
| `/api/v1/session` | POST | 브라우저별 익명 프로필과 일회 표시 bearer token 발급 |
| `/api/v1/save` | GET | 현재 revision과 캠페인 문서 조회 |
| `/api/v1/save` | PUT | `expectedRevision` 기반 낙관적 저장 |
| `/cdn/assets/overload/*` | GET/HEAD | R2 → `/assets/overload/*` Sites 정적 원본 순서로 조회 |

API 쓰기는 same-origin만 허용하며 저장 본문은 512KiB로 제한합니다. bearer token 원문은 브라우저에만
있고 D1에는 SHA-256 해시만 저장합니다. 저장 JSON은 v2와 정확히 세 슬롯인지 서버에서 다시
검증하며 모든 API 응답은 `no-store`입니다.

## 데이터 모델과 충돌 처리

- `cloud_profiles`: 익명 프로필 ID, token hash, 생성·최근 접속 시각
- `campaign_saves`: 프로필당 한 행, revision, payload JSON, checksum, client/server 갱신 시각
- 로컬 저장은 UI 조작 직후 동기적으로 완료되고 네트워크 업로드는 650ms debounce 후 수행합니다.
- 두 탭이나 재연결이 충돌하면 서버가 409와 현재 revision을 반환합니다.
- 클라이언트는 원격 문서를 다시 읽고 각 슬롯의 `updatedAt`을 독립 비교해 최신 슬롯만 병합한 뒤
  새 revision으로 한 번 재시도합니다.
- 서버 장애나 오프라인 상태는 플레이를 막지 않습니다. 다음 저장 또는 `online` 이벤트에서 다시
  동기화합니다.

현재 인증은 기기별 익명 세션입니다. 계정 로그인, 기기 변경 복원, 경쟁 랭킹 또는 결제 검증이
필요해질 때만 OAuth/계정 테이블과 서버 권위 명령 검증을 추가합니다.

## R2·CDN 전략

R2 키는 `site-assets/<release-version>/assets/overload/...` 형식입니다. 프로덕션 빌드는 소스의
`/assets/overload/` 참조를 Worker가 소유하는 `/cdn/assets/overload/` namespace로 변환합니다. 첫 요청은
해당 CDN 경로를 실제 Sites 정적 원본 경로로 매핑해 응답하면서 비동기로 R2에 복사하고, 이후
R2 read-through 원본으로 동작합니다. 응답의 장기 캐시 헤더로 Cloudflare CDN 캐시도 활용합니다. Range 요청은 영상·음원
seek 호환성을 위해 R2를 우회하되 같은 매핑을 거쳐 Sites 원본에 그대로 전달합니다. 새 에셋을 같은 URL로 교체할 때는 Worker의
`SERVICE_VERSION`과 `R2_CACHE_VERSION`을 함께 올려 이전 객체와 분리합니다.

## 빌드와 배포

```bash
npm ci
npm run db:generate   # db/schema.ts 변경 시에만
npm test
npm run build
npm run test:sites
```

`npm run build`는 다음 Sites 계약을 만듭니다.

- `dist/client/index.html`과 정적 번들
- `dist/server/index.js` Worker
- `dist/.openai/hosting.json`의 `DB` D1, `FILES` R2 논리 바인딩
- `dist/.openai/drizzle/*.sql` D1 마이그레이션
- `public/`에서 미사용 파일을 제거하고 제작 원본을 `reference/`로 분리한 `dist/client/` 런타임 에셋

클라이언트는 선택 구역·무기·실제 해금 전투원의 Phaser 아틀라스만 부트 번들에 포함합니다.
전투 대화에 필요한 포트레이트만 준비 완료 조건으로 사용하고, 레벨업 보상 이미지는 전투 준비 뒤
유휴 프리로드합니다. `npm run analyze:assets`로 제작 전용 목록과 현재 제외 용량을 확인할 수 있습니다.

배포 후 `/api/v1/health` 200, 새 익명 세션, 빈 저장 조회, revision 1 저장, 재조회와 대표
`/cdn/assets/overload/`의 Sites 최초 응답과 R2 재조회 응답을 smoke test합니다. 운영 토큰이나 환경 비밀은 Git에 커밋하지 않습니다.

## 확장 판단 기준

다음 조건 전에는 별도 API VM·Postgres로 분리하지 않습니다.

- 계정/길드/랭킹처럼 여러 행을 조인하고 강한 트랜잭션이 필요한 기능
- 서버 권위 멀티플레이 또는 치트 방지 판정
- D1의 실제 측정 쿼리·용량 한계를 지속적으로 초과
- 장기 작업, 매치메이킹, 실시간 소켓처럼 Worker 요청 수명 밖의 처리

그 전까지는 같은 Worker를 얇은 API 경계로 유지하고, 전투 성능 문제는 서버 이전이 아니라
에셋 크기, Phaser draw call, 오브젝트 풀, 공간 인덱스와 시뮬레이션 프로파일링에서 해결합니다.
