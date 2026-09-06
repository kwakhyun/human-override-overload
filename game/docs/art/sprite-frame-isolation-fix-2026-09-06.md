# 전투 프레임 분리 수정 - 2026-09-06

## 결함과 수정

사용자가 제시한 폭풍첨탑·생체금고·네온주조구 보스 및 방어전 적의 반대편 조각은 실제 게임용 PNG에도 포함되어 있었다. 이전 검수의 출력 여백·해상도 검사와 대기 상태 중심의 런타임 확인으로는 원본 절단 오류를 잡지 못했다. 기존 완료 보고의 한계이며, 검수 화면만의 문제로 취급하지 않는다.

- 23개 비전투원 시트의 실제 원본 프레임 직사각형을 `scripts/sprite-source-layouts.json`에 기록했다. 각 행의 간격뿐 아니라 프레임별 상하 경계가 다를 수 있다. 원본 해시·크기가 바뀌면 재검수 없이 패킹할 수 없다.
- 폭풍첨탑·네온주조구 보스, 방어전 방향 시트를 비롯한 기존 원본은 다시 분리했다. 생체금고 적의 흰색 가이드 선은 명시된 원본 격자 위치에서만 제거했다.
- 생체금고 보스와 검 수동 스킬은 원본 안에서 그림끼리 맞닿은 구간이 있어 ImageGen으로 간격을 수정했다. 이전 원본을 덮어쓰지 않고 `*-isolated.png`로 별도 보존한다.
- 수정 생체금고 원본의 첫 세 행은 실제로 7개 포즈, 마지막 행은 8개다. 회복 칸은 해당 단계의 대기 포즈를 재사용하여 런타임 8열 계약을 유지한다. 32칸을 32개의 독립 제작 포즈로 설명하지 않는다.
- 한 시트에 공통 배율을 적용한다. 보스는 중심, 방어전 적은 발 기준으로 배치하며, VFX는 확장 시 효과 중심이 따라 움직이지 않도록 원본 격자 기준을 유지한다.
- 리사이즈 이전 원본 경계에서 알파가 32/255를 넘는 그림이 잘리면 빌드가 실패한다. 출력 여백만 추가하여 원본 절단 오류를 감추는 방식은 회귀 테스트에서 거부된다.
- 검수 화면은 빌더가 생성한 행·열 정보와 이미지 해시를 읽는다. 각 카드에서 프레임을 고정할 수 있고 보스 변형·파괴 행까지 전체 프레임을 순차 재생한다. 새 해시로 수정 전 이미지 캐시를 구분한다.

## 확인 범위

- 28개 원본 시트의 실제 프레임 905개에서 원본 경계 절단 검사 통과. 보류·회복 프레임 매핑 후 게임용 916칸과 기본·모바일 PNG 60개를 생성했다. 5개 전투원 시트의 정규 격자도 검사했다.
- 916개 출력 프레임을 행·열 번호가 있는 연락 시트로 펼쳐 시각 검수했다. 모든 프레임을 실제 전투에서 하나씩 재생했다는 의미는 아니다.
- 원본 분리 회귀 검사 2개, 관련 Node 검사 15개 통과. 원본 회귀 검사는 보존된 제작 원본과 Pillow/NumPy가 필요하다.
- Edge의 실제 Phaser 장면에서 6개 보스의 대기와 3단계 공격 프레임, 네 전투원의 스킬, 방어전과 모바일 PERFORMANCE 로딩을 확인했다. 검수 화면은 제보된 프레임을 고정해 재확인했다. 스크립트 오류 및 이미지 요청 오류 없음.
- 통제된 렌더러 검수이며 캠페인 전 구간 플레이 또는 실물 모바일 기기 벤치마크는 아니다. 게임 규칙·스킬 피해·판정·지상 유닛 방향 정책은 변경하지 않았다. 로컬 적용 상태이며 이번 수정의 커밋·배포는 수행하지 않았다.

## 재현

```text
python scripts/test-sprite-source-layouts.py
python scripts/build-sprite-quality-assets.py
node --test tests/sprite-quality-assets.test.mjs tests/motion-atlas-assets.test.mjs tests/performance-assets.test.mjs tests/actor-facing.test.mjs tests/sprite-presentation.test.mjs
node scripts/verify-combat-sprites.mjs
```

`scripts/audit-sprite-source-cuts.py`는 후보 경계를 제안하는 제작 보조 도구다. 검수 없이 후보를 배포 좌표로 자동 채택하지 않는다. 검수 증거는 `qa/sprite-quality-v3/`에 보관한다.

## 수정 원본 제작 요청

### gene-vault-boss

Edit this original game sprite sheet ONLY to repair spacing and frame isolation. Preserve the exact ivory bone mechanical boss with lime green circular central core, its same forms, colors and painted game-sprite aesthetic. Reproduce the entire sheet as exactly EIGHT columns and FOUR rows (32 distinct slots): rows 1-3 preserve the same progression of forms, row 4 preserves transformation and death. Each slot must contain ONE COMPLETE isolated boss/pose including every blade tip and all owned debris. CRITICAL: there must be VERY WIDE EMPTY BLUE GUTTERS between ALL sprites, no adjacent sprites touch or overlap even the widest starburst in row 3 columns 6 and 7. Reduce all bosses uniformly to 55% of each slot width and height if necessary. Exactly equal rectangular slots. The canvas outer edges also have safe blue padding. Each frame centered at the boss core, coherent scale across the whole sheet; intact silhouettes. Uniform pure royal BLUE #0000ff chroma backdrop; no guide lines, borders, lettering, labels or grid. Do not bake any extra sparks that belong to neighbors into another slot. The source is the reference target, maintain boss identity. This is technical repair of an atlas, not redesign.

### sword-manual-skills

Edit this existing 6-column 4-row game ability sprite sheet to repair frame isolation ONLY. Keep identical clean cyan-white sci-fi energy blades, ring, cross slash, rising swords and falling sword impacts; exact same graphic style and four rows of six progressive frames. Ensure the long vertical sword tips and their glow in row 3 and row 4 are completely isolated with WIDE PURE BLACK EMPTY GUTTERS between the two rows. Do not let any beam or tip touch another frame. All SIX columns and FOUR rows exactly equal slot geometry. Scale all four effects uniformly to fit within 65% of each square slot with centered consistent anchors. Preserve each frame's timing: startup, expansion, peak, sustain, fade and end. Pure BLACK #000000 backdrop for additive compositing, no checkerboard, no guide lines, no labels. Every glow belongs to a single isolated frame; whole fully visible effects, generous black outer border. Preserve existing designs, no unrelated new decorations.
