# Cubism Editor 제작 기록 — 2026-09-05

상태: 이지스 호흡·머리 기울임 작업본. 네 캐릭터 고품질 Live2D 제작 및 게임 적용은 미완료.

## 원본과 결과

제작 폴더는 `reference/source-assets/overload/live2d-production/`다. 이 폴더는 기존 제작 원본 정책에 따라 Git에서 제외되어 있으며 현재 컴퓨터에 보관된다.

| 캐릭터 | 원본 파일명 (`public/assets/overload/hero/`) | 신규 결과 |
| --- | --- | --- |
| AEGIS | `survivor-portrait-v2.webp` | 승인 PNG, 단일 레이어 PSD, Editor CMO3, MOC3, MODEL3, CDI3, 텍스처 |
| MIKA | `mika-portrait-v2.webp` | 승인 PNG, 단일 레이어 PSD |
| VESPER | `vesper-portrait-v7.webp` | 승인 PNG, 단일 레이어 PSD |
| NOX | `nox-portrait-v1.webp` | 승인 PNG, 단일 레이어 PSD |

캐릭터별 하위 폴더에 `<id>-approved.png`, `<id>-working.psd`가 있다. PNG는 sharp로 WebP를 디코딩했고, PSD는 ag-psd로 동일 RGBA를 담았다. 원화 포즈나 외형을 수정하지 않았다. 부위 분리나 가려진 면 복원이 된 자료로 간주하면 안 된다. 과거 `cubism/` 및 `cubism-v2/`의 실패 리그는 사용하지 않았다.

## 직접 편집한 구조

Cubism Editor 5.3.04에서 신규 PSD를 새 모델로 가져왔다. 자동 메시의 큰 변형 프리셋으로 원화 ArtMesh를 생성한 후 워프 디포머를 직접 추가했다.

- `AEGIS_Breath_Torso`: 보간 8×12, 베지어 4×6. `ParamBreath` 0/1. 1에서 어깨·흉부의 세 제어점을 약간 위·바깥으로 이동했다. 머리 상단 및 하체 기준점을 고정했다.
- `AEGIS_Head_Response`: 동일 분할. 상체 디포머 아래에서 원화를 감싼다. `ParamAngleZ` -30/0/30. 머리 상단과 눈 높이 제어점을 좌우 극값으로 편집하고 어깨 이하를 고정했다.
- 중립 파라미터 상태로 저장했다. 아틀라스는 1024×2048, 원본 배율 100%, 회전 0°, 위치 32/32다. 자동 패킹의 축소·회전은 수정했다.
- SDK 5.0 대상으로 `aegis-working.moc3`를 출력했다. 실제 런타임 메시 수는 1이다. 출력 이후 아틀라스가 포함된 편집본도 다시 저장했다.

## 검증

검수 URL: `http://localhost:4174/tools/cubism-editor-review.html`.

검수 페이지는 작업용 단일 메시의 정상 블렌드 렌더러다. Cubism Core가 계산한 정점·UV·인덱스를 그대로 그린다. 마스크나 복합 블렌드를 지원하는 일반 게임용 Cubism 렌더러로 사용하면 안 된다. 호흡·클릭의 시간 곡선은 검수 페이지에서 구동하며 Editor에서 제작한 모션 파일은 아직 없다.

`scripts/verify-cubism-working.mjs` 실행 결과:

- `ParamBreath` 최대 정점 변화 약 0.009118 모델 단위. 하체 변화는 0.000001 미만.
- 머리 양쪽 극값 최대 변화 약 0.028925 모델 단위.
- 중립으로 복귀한 정점은 원래 정점과 동일.
- 실제 대기 시간 경과 시 호흡 변화, 클릭 시 머리 반응 및 복귀 확인.
- OS 모션 최소화에서 호흡·머리 파라미터 0 유지.
- 브라우저 실행 오류 없음. 중립·머리 극값 화면 저장. 텍스처 방향·원화 프레임 직접 확인.

이는 실행 검증 결과다. 고품질 모델로 판정하거나 네 캐릭터의 완료 증거로 사용하지 않는다. 현재 파일은 게임에 연결하지 않았다.

## 도구 출처와 실패 자료

PSD 패킹 도구는 제작 폴더의 `tools/package.json` 및 잠금 파일에 기록된 ag-psd다. 게임 런타임 의존성을 변경하지 않았다.

검수용 `tools/live2dcubismcore.min.js`는 [공식 Cubism Core 배포 URL](https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js)에서 내려받았다. 해당 파일 헤더가 가리키는 [Live2D 독점 소프트웨어 사용권](https://www.live2d.com/eula/live2d-proprietary-software-license-agreement_en.html)이 적용된다. 현재 제작 폴더에서만 사용하며 게임 배포 파일에 포함하지 않았다.

현재 이지스의 눈만 감도록 ImageGen 편집을 시도했으나 출력의 해상도·선화가 바뀌고 체크무늬가 RGB 배경에 포함됐다. 해당 출력은 프로젝트에 복사하거나 텍스처에 사용하지 않았다. 독립 눈 깜빡임 제작은 미완료다.

다음 제작 항목은 승인 원화의 부위 분리와 가려진 면 복원, 독립 눈·입·머리카락·팔다리 메시 및 키폼, 캐릭터별 물리와 터치 모션, 네 모델의 시각 검수 및 게임 통합이다.
