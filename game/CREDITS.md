# Assets, Tools, and Licenses

> 2026-09-07 정리: 아래 프롬프트와 경로는 제작 당시의 이력입니다. 현행 파일 경로는 `src/game/assets/manifest.ts`, 제작 입력은 `reference/source-assets/overload/runtime-inputs/`를 기준으로 합니다. 폐기된 바이너리와 생성기는 Git 이력에서 확인하며, 이력 경로가 현재 작업 폴더에 모두 존재한다는 뜻은 아닙니다.

2026-09-06 재생 동작 보정: 기존 BGM 파일과 제작 프롬프트는 변경하지 않았다. 로비와 준비 메뉴에서 동일 곡을 유지하고, 영상 일시 정지 및 곡별 재생 위치 복원을 앱 공통 재생기로 처리한다. 새 음원 제작·도입은 없다.

## Project-original game assets

아래 이미지는 모두 이 프로젝트 전용으로 OpenAI 내장 이미지 생성 도구를 사용해 제작했습니다.
외부 게임 에셋 팩이나 타인의 게임 이미지는 사용하지 않았습니다.

`imagegen-job/<작업 ID>/<산출물 ID>` 표기는 로컬 사용자 경로를 공개하지 않으면서 생성 작업을
재식별하기 위한 provenance 식별자입니다. 저장소 안에서 열 수 있는 파일은 별도의 `reference/` 또는
`public/` 상대 경로로 함께 기록합니다.

### Initial unified overhead production set (비활성 제작 이력)

> **현재 플레이어 런타임:** 아래 초기 제작 기록의 `survivor-motion-atlas-v2.png`는 퇴역했습니다.
> 현재 AEGIS는 무기에 따라 `public/assets/overload/hero/survivor-directional-aim-atlas.png` 또는
> `public/assets/overload/hero/survivor-sword-directional-aim-atlas.png`만 선택적으로 로드합니다.
> 이 절의 프롬프트와 초기 경로는 제작 provenance이며 현재 로딩 목록으로 해석하지 않습니다.

- 생성일: 2026-08-10
- 생성 도구: OpenAI 내장 ImageGen
- 스타일 기준 원본:
  - `public/assets/overload/vfx/pixel/manual-ability-pixel-atlas.png`
  - `public/assets/overload/vfx/pixel/automatic-skill-pixel-atlas.png`
- 후처리: ImageGen `remove_chroma_key.py`, Pillow 기반 `scripts/prepare-overload-art.py`
- 공통 카메라 규칙: 인게임 배우와 장비는 천장 카메라의 엄격한 90° 정사영 탑다운,
  중앙 회전 피벗, 화면 오른쪽 기본 전방. 정면 상반신 대사 포트레이트만 예외입니다.
- 당시 런타임 경로:
  - `public/assets/overload/hero/survivor-motion-atlas-v2.png`
  - `public/assets/overload/enemies/enemy-motion-atlas.png`
  - `public/assets/overload/allies/*.png`
  - `public/assets/overload/boss/wrong-engine-forms-atlas.png`
  - `public/assets/overload/environment/sector-01-shattered-approach.webp`
  - `public/assets/overload/environment/sector-02-flooded-memorial.webp`
  - `public/assets/overload/environment/sector-03-engine-causeway.webp`
  - `public/assets/overload/environment/boss-chamber.webp`
- 보존 원본:
  - `reference/source-assets/overload/hero/silver-aegis-true-nadir-motion-atlas-chroma.png`
  - `reference/source-assets/overload/hero/silver-aegis-true-nadir-seed-chroma.png`
  - `reference/source-assets/overload/hero/silver-aegis-portrait-user-chroma.png`
  - `reference/source-assets/overload/enemies/enemy-overhead-motion-atlas-chroma.png`
  - `reference/source-assets/overload/allies/squad-support-overhead-sheet-chroma.png`
  - `reference/source-assets/overload/boss/wrong-engine-forms-chroma.png`
  - `reference/source-assets/overload/environment/*-source.png`
- 최종 캐릭터 프롬프트 세트:

  > AEGIS seed: use the supplied silver-haired AEGIS portrait as the exact identity reference and the supplied combat key art only as a supporting rifle reference. Create one isolated strict 90-degree overhead orthographic ceiling-camera game sprite, centered and facing screen-right while holding the rifle. Preserve long silver-white hair, the black tactical exosuit, white split coat tails, and cyan weapon accents. Show the crown, shoulders, upper back, top weapon surfaces, and foreshortened legs; never show the face, horizon, front, side, or eye-level pose. Flat #ff00ff background; no scene, floor, shadow, text, UI, or watermark.

  > AEGIS motion atlas: create exactly fifteen isolated sprites in a 5-column by 3-row atlas, using the approved overhead seed as the primary reference and the silver portrait as identity support. Preserve the same silver-haired AEGIS, black armor, white split coat tails, cyan rifle, scale, strict overhead camera, centered pivot, and screen-right heading. Row 1: restrained locomotion cycle. Row 2: rifle ready, brace, one cyan muzzle release, recoil, recovery. Row 3: dash anticipation, cyan phase dash, afterimage dash, hit recoil, kneeling defeat. Flat #ff00ff background; no extra actors, scenery, floor, shadow, labels, borders, text, UI, or watermark.

  > Enemy overhead atlas: recreate exactly 15 enemy sprites in a 5×3 atlas from the same strict 90-degree ceiling camera, all centered and pointing screen-right. Row 1 is a compact flying hunter drone in hover, bank, thrust, attack, and damaged poses. Row 2 is a black-gunmetal humanoid suppression automaton with red visor and heavy rifle in ready, stride A, passing stride, stride B, and firing recoil. Row 3 is a low quadruped armored brute in prowl A, prowl B, charge, slam, and damaged poses. Show top armor, chassis, head/back and weapon surfaces; no front, side, three-quarter eye-level, or horizon. Hot red-orange hostile emissives, flat #ff00ff background, no scenery, floor, shadow, text, grid, or watermark.

  > Squad/support overhead sheet: create exactly eight isolated assets in a 4×2 sheet from the same strict 90-degree ceiling camera, centered and pointing screen-right where mobile. Top row: ROOK heavy gunner and shield, NYX recon sniper, MOSS medic/engineer, AEGIS ECHO rifle operator; show crown, shoulders, upper back, top armor/weapon surfaces and foreshortened limbs, never a viewer-facing pose. Bottom row: hunter drone, twin-weapon suppressor drone, pulse sentry, four-pronged EMP pylon. Unified black/graphite gunmetal with blue/cyan team emissives and a small green medical accent for MOSS; flat #ff00ff background, no scenery, floor, shadow, text, grid, or watermark.

- 전장·보스 프롬프트 세트:

  > Sector 2 — Flooded Memorial: premium 16:9 top-down cyberpunk transit underpass, broad unobstructed east-west combat lane, rainwater and reflective flooded steel, violet memorial beacons, cyan route lights, abandoned squad traces and broken rescue equipment near the non-playable edges, dark black-gunmetal city ruins, no actors, UI, text, walls across the lane, or watermark.

  > Sector 3 — Engine Causeway: premium 16:9 top-down industrial reactor causeway, broad unobstructed east-west combat lane leading toward the engine, black steel, red-orange reactor spill, exposed conduits, cooling vents and escalating machine damage along non-playable upper/lower edges, sparse cyan navigation lights, no actors, UI, text, walls across the lane, or watermark.

  > Boss chamber: premium 16:9 strict top-down circular engine chamber with a huge open traversable center, black-gunmetal radial machinery outside the combat floor, red reactor channels and cyan alignment marks, clear perimeter and central confrontation space, no boss, actors, UI, text, obstructing central structure, or watermark.

  > THE WRONG ENGINE forms: exactly three isolated centered forms in a 3×1 sheet from a strict top-down view, preserving one radial black-gunmetal engine identity and red reactor core. Phase 1 is sealed and compact; phase 2 unfolds segmented armor and weapon limbs; phase 3 exposes a white-hot triple reactor with fractured armor and molten red-orange veins. Consistent center pivot, flat #ff00ff background, no floor, shadow, text, grid, loose VFX, or watermark.

모든 크로마 원본은 soft matte/despill로 투명화한 뒤 중앙 앵커 기준 256×256 인게임 프레임
(보스 512×512)으로 정규화했습니다. 전장은 1600×900 WebP로 최적화했습니다. 피격·폭발
효과는 외부 래스터를 추가하지 않고 Phaser Graphics로 제작한 프로젝트 원본이며,
`CINEMATIC / BALANCED / PERFORMANCE` 품질 단계에 따라 동시 효과 수가 제한됩니다.

### Colossal authored boss chamber replacement

- 생성일: 2026-08-10
- 생성 도구: OpenAI 내장 ImageGen
- 런타임 경로: `public/assets/overload/environment/boss-chamber.webp`
- ImageGen 원본 경로: `reference/source-assets/overload/environment/boss-chamber-colossus-source.png`
- 후처리: Pillow Lanczos로 1920×1080 리사이즈, 품질 90 WebP 변환
- 적용 방식: 일반 구간의 반복 가능한 `TileSprite`와 분리한 단일 Phaser Image. 보스전에서는
  타일 반복·미러링·배경 스크롤 없이 확장 월드 전체에 한 번만 표시합니다.
- 최종 프롬프트:

  > Use case: stylized-concept. Asset type: final 2D game environment background for a Phaser boss arena. Image 1 is a color, material, and industrial-world style reference; Image 2 is only a reference for strict overhead camera and circular chamber language. Do not copy, tile, mirror, or repeat either image. Create a completely new colossal final-boss engine chamber for TRAIN ME WRONG: OVERLOAD, built to make a 640-pixel giant biomechanical machine boss feel at home and overwhelmingly large. Show a vast ruined subterranean cyberpunk reactor cathedral from a strict 90-degree ceiling camera with one enormous oval combat floor, a deep glowing reactor abyss beyond the floor edges, monumental turbine housings, shattered containment ribs, thick power conduits, cooling vents, mechanical buttresses, and a sealed entry lock on the far-left edge. Keep the broad center unobstructed. Add a massive broken reactor crown on the upper-right perimeter and a collapsed service gantry on the lower-left perimeter so it reads as one authored place. Match near-black gunmetal, cold cyan navigation lights, and furnace-red/orange energy. Single continuous unique 16:9 composition; not seamless; no repeated tiles or mirrored quadrants; no characters, enemies, boss, corpses, weapons, UI, HUD, text, symbols, logo, or watermark.

이 원화는 기존 보스방을 늘이거나 복제한 것이 아니라, 1920×1080 확장 카메라와 단계별
480·560·640px 보스 실루엣을 기준으로 새로 생성했습니다. 중앙은 스윕·폭탄·링·돌진 판독을
위해 어둡고 비워 두고, 고유 랜드마크와 붉은 심연은 이동 경계 밖에 집중했습니다.

### Forward expedition route

- 생성일: 2026-08-10
- 생성 도구: OpenAI 내장 ImageGen
- 런타임 경로: `public/assets/overload/environment/sector-01-shattered-approach.webp`
- 고해상도 원본: `reference/source-assets/overload/expedition-route-source.png`
- 용도: AEGIS가 왼쪽에서 오른쪽으로 전진하는 폐허 수송로 배경
- 최종 프롬프트:

  > Horizontally scrolling top-down battlefield texture for a premium 2D Phaser action game; ruined cyberpunk megacity mood, black steel, rain-dark surfaces, cyan navigation lights and sparse red illumination; empty elevated transit deck running left to right with a broad traversable center lane; broken guard rails and machinery only along upper and lower edges; team remains and abandoned equipment silhouettes near the edges; true top-down with slight illustrative perspective; repeatable left/right edges; no central walls, arena circle, characters, enemies, boss, UI, text, logos or watermark.

런타임 파일은 원본 PNG를 품질 88 WebP로 변환해 약 2.24MB에서 약 178KB로 줄였습니다.

### User-provided cinematic art and active silver AEGIS identity

- 생성·적용일: 2026-08-10
- 사용자 제공 시작 화면 원본:
  - 원본 파일명: `Codex 이미지 2026년 8월 10일 오전 03_59_23.png`
  - 프로젝트 보존 경로: `reference/source-assets/overload/intro/start-screen-key-art-user.png`
  - 런타임 경로: `public/assets/overload/intro/start-screen-key-art.webp`
  - 후처리: Pillow Lanczos 1920×1080 리사이즈, 품질 90 WebP 변환. 인물·보스·배경은
    재생성하거나 합성하지 않았습니다.
- 사용자 제공 은발 AEGIS 원본:
  - 원본 파일명: `Codex 이미지 2026년 8월 10일 오전 04_01_49.png`
  - 프로젝트 보존 경로: `reference/source-assets/overload/hero/silver-aegis-portrait-user-chroma.png`
  - 대사 런타임 경로: `public/assets/overload/hero/survivor-portrait-v2.webp`
  - 후처리: ImageGen `remove_chroma_key.py` edge-contract 1로 초록 배경만 투명화. 인물은
    재생성하지 않았고, React 대사 패널에서 머리·어깨·상반신만 확대 크롭합니다.
- ImageGen 제작 원본:
  - `reference/source-assets/overload/hero/silver-aegis-true-nadir-seed-chroma.png`
  - `reference/source-assets/overload/hero/silver-aegis-true-nadir-motion-atlas-chroma.png`
- 당시 인게임 런타임 경로:
  - `public/assets/overload/hero/survivor-motion-atlas-v2.png`
- 생성·후처리 도구: OpenAI 내장 ImageGen, ImageGen `remove_chroma_key.py`, 프로젝트
  `scripts/normalize-motion-atlas.py`
- 최종 프롬프트 세트:

  > Seed: use the supplied silver-haired AEGIS portrait as the exact character identity and outfit reference, and use the combat key art only for the rifle language. Create one isolated premium 2D game sprite from a strict 90-degree overhead orthographic ceiling camera, centered and facing screen-right while holding the rifle. Preserve long silver-white hair, black tactical exosuit, white split coat tails, and cyan weapon accents. Show only crown, shoulders, upper back, top armor and weapon surfaces, and foreshortened limbs; no viewer-facing face, front view, side view, eye-level angle, or horizon. Flat #ff00ff background; no scene, floor, shadow, text, UI, or watermark.

  > Motion atlas: create exactly fifteen sprites in a 5-column by 3-row atlas. Image 1 is the approved strict-overhead seed and is the primary pose, camera, costume, scale, and palette reference; Image 2 supports the silver-haired AEGIS identity. Keep every frame centered, strict 90-degree overhead, and initially facing screen-right. Row 1: five restrained locomotion frames. Row 2: rifle ready, brace, one cyan muzzle release, recoil, recovery. Row 3: dash anticipation, cyan phase dash, afterimage dash, hit recoil, kneeling defeat. Preserve long silver-white hair, white split coat tails, black tactical armor, and cyan rifle accents. Flat #ff00ff background; no extras, scene, floor, shadow, labels, borders, text, UI, or watermark.

크로마 원본을 투명화한 뒤 15개 셀을 분리해 하나의 공통 스케일과 중앙 회전 피벗으로
256×256 프레임에 정규화하고, 5×3·1280×768 투명 PNG로 조립했습니다. 공격 행은 정지 시에만
사용하며 한 발의 머즐 플래시와 억제된 반동으로 구성해 자동 사격 중 과도한 흔들림을 피합니다.

#### True-nadir 360° rotation correction

- 교체 사유: 첫 은발 아틀라스는 오른쪽 조준 자세에서는 자연스러웠지만 머리·상체·코트에 남은
  약한 사선 원근 때문에 전체 스프라이트를 다른 방향으로 회전할 때 항공 시점이 흔들렸습니다.
- 검증 이미지: `qa/silver-aegis-360-rotation-preview.png` — 런타임 첫 프레임을 중앙 피벗 기준
  0/45/90/135/180/225/270/315도로 회전한 단일 시점 검증표입니다.
- 최종 보정 프롬프트:

  > True-nadir seed: redraw one isolated AEGIS as a perfectly vertical 90-degree nadir orthographic plan view, as if a satellite camera is directly above the crown of her head, with zero tilt, zero perspective convergence, zero horizon, and no visible face, eyes, chest front, abdomen front, or side profile. Show only crown, symmetrical shoulder tops, upper back, top armor, top arm and rifle surfaces, and foreshortened legs. Keep spine, hips, and legs on one flat plan so the sprite can rotate continuously through 360 degrees without leaning toward the viewer. Preserve silver-white hair, black exosuit, white split coat tails, cyan rifle accents, screen-right aim, compact silhouette, and flat #ff00ff background; no floor, shadow, aura, scenery, text, UI, or watermark.

  > True-nadir motion atlas: create exactly fifteen isolated sprites in a 5×3 atlas from the approved true-nadir seed. Every frame must preserve the identical perfectly vertical nadir orthographic camera, flat-plan body, common center pivot, scale, and screen-right heading. Row 1 is restrained locomotion; row 2 is ready, subtle brace, one small muzzle release, tiny recoil, recovery; row 3 is dash anticipation, compact phase dash, compact afterimage, flat-plan hit recoil, and disabled pose. No face, front torso, side profile, oblique depth, extra actor, floor, cast shadow, grid, labels, text, UI, or watermark; flat #ff00ff background.

기존 `silver-aegis-overhead-*` 두 원본은 보정 전 제작 이력으로만 보존합니다. 아래 오른쪽
어깨 견착 버전은 `silver-aegis-true-nadir-*`를 시점 기준으로 삼아 최종 활성 런타임을 교체합니다.

#### Right-shoulder rifle correction

- 생성·적용일: 2026-08-10
- 생성 도구: OpenAI 내장 ImageGen
- 제작 원본:
  - `reference/source-assets/overload/hero/silver-aegis-right-shoulder-seed-chroma.png`
  - `reference/source-assets/overload/hero/silver-aegis-right-shoulder-motion-atlas-chroma.png`
- 삭제한 과거 런타임 경로: `public/assets/overload/hero/survivor-motion-atlas.png`
- 후처리: ImageGen `remove_chroma_key.py`의 border auto-key, soft matte, edge-contract 1,
  despill 후 `scripts/normalize-motion-atlas.py`로 공통 스케일·중앙 피벗의 5×3·1280×768
  투명 PNG를 제작했습니다.
- 최종 프롬프트:

  > Right-shoulder seed: preserve the supplied silver-haired AEGIS true-nadir identity and change only the rifle hold. The buttstock must be visibly seated into her RIGHT shoulder pocket, with the right trigger hand, right elbow, and left forward support hand anatomically coherent. Keep the barrel aimed screen-right. Maintain a perfectly vertical 90-degree nadir orthographic camera with no visible face, chest front, horizon, or oblique torso; preserve the black exosuit, white split coat tails, cyan rifle accents, centered rotation pivot, and flat #ff00ff background.

  > Right-shoulder motion atlas: create exactly fifteen sprites in a 5-column by 3-row atlas from the approved right-shoulder seed. Preserve the buttstock seated in the RIGHT shoulder in every frame and keep every actor strict true-nadir, centered, and initially facing screen-right. Row 1: restrained locomotion. Row 2: shouldered ready, brace, muzzle release, tiny recoil, recovery. Row 3: dash anticipation, phase dash, afterimage, hit recoil, disabled pose. No face, front torso, oblique depth, scene, shadow, grid, labels, text, UI, or watermark; flat #ff00ff background.

### Active futuristic combat VFX atlas

- 생성·적용일: 2026-08-10
- 생성 도구: OpenAI 내장 ImageGen
- 제작 원본: `reference/source-assets/overload/vfx/combat-fx-atlas-chroma.png`
- 런타임 경로: `public/assets/overload/vfx/combat-fx-atlas.png`
- 후처리: auto-key soft matte와 despill로 크로마를 제거하고 4×3·256px 공통 셀로
  정규화했습니다.
- 최종 프롬프트:

  > Create exactly twelve isolated premium 2D combat effects in a 4-column by 3-row atlas, matching the supplied silver AEGIS rifle and THE WRONG ENGINE industrial material language. Row 1: long cyan needle pulse tracer, five plasma flechettes, white-gold rail lance, micro-missile. Row 2: three-prong muzzle flash, armor hit burst, geometric Arc Cascade lightning, Zero-Point Nova hex bloom. Row 3: Skyfall impact spear, Omega Laser segment, Orbit Blades, red enemy explosion. Every cell is centered and readable at small tactical scale; effects must look like directed futuristic ordnance, not simple spheres. Flat #ff00ff background; no actors, floor, grid, borders, labels, text, UI, or watermark.

Phaser는 이 아틀라스를 자동 사격 투사체, 소총 머즐 플래시, 노바·공중 폭격·궤도 스킬,
전용 장갑 피격과 적 폭발에 사용합니다. 동시 표시량은 품질 단계별로 제한하며 판정은 기존
결정론적 엔진이 계속 소유합니다.

### Retired multi-motion skill and spawn-gate source atlas

- 생성·적용일: 2026-08-10
- 생성 도구: OpenAI 내장 ImageGen
- 스타일 참조 원본:
  - `public/assets/overload/vfx/combat-fx-atlas.png`
  - `public/assets/overload/ui/rewards/airstrike.webp`
  - `public/assets/overload/ui/rewards/omegaLaser.webp`
- 크로마키 제작 원본: `reference/source-assets/overload/vfx/skill-motion-atlas-chroma.png`
- 알파 보존 원본: `reference/source-assets/overload/vfx/skill-motion-atlas-alpha.png`
- 삭제한 과거 런타임 경로: `public/assets/overload/vfx/skill-motion-atlas.png`
- QA 미리보기: `qa/skill-motion-atlas-preview.png`
- 후처리: ImageGen `remove_chroma_key.py`의 border auto-key, soft matte, despill로
  `#ff00ff` 배경을 제거한 뒤 `scripts/normalize-motion-atlas.py`로 한 번에 공통 스케일과
  중앙 피벗을 적용해 6×4, 192px 셀, 1152×768 투명 PNG로 정규화했습니다.
- 최종 프롬프트:

  > Use case: stylized-concept. Asset type: production VFX motion atlas for a top-down Phaser browser game. Create one exact 6-column by 4-row sprite animation atlas, 24 equal square slots total, for TRAIN ME WRONG: OVERLOAD. Match the existing combat VFX, SKYFALL, and OMEGA LASER references. Use polished realistic sci-fi game VFX with sharp metallic micro-details, luminous energy, and clear strict top-down gameplay readability; production sprite atlas, not pixel art or concept art. Exactly 6 columns and 4 rows with centered isolated slots. Row 1: SKYFALL compact target lock, descending shell, hard contact flash, expanding multi-ring blast, radial fragmentation burst, fading sparks and smoke ring. Row 2: OMEGA LASER reactor charge, focusing rings, ignition, colossal beam, sustained overcharge, cooling residual; every frame faces screen-right. Row 3: ARC CASCADE coil charge, first fork, branching bloom, maximum discharge, collapsing electric ring, fading ion motes. Row 4: SOVEREIGN dark mechanical transit gate dormant, powering up, aperture opening, fully open red-white portal, hostile materialization pulse, closing residual. Flat uniform #ff00ff chroma background; no grid, shadows, floor, characters, scenery, text, labels, borders, logos, watermark, pixelated aesthetic, or magenta inside the effects.

Phaser는 1행을 다중 폭격의 경고·낙하·충돌·폭발 수명에, 3행을 ARC CASCADE와
SUPPRESSOR WISP EMP 펄스에, 4행을 적이 등장하기 전 전송 게이트 개방과 폐쇄에 연결합니다.
2행은 제작 이력과 호환성을 위해 보존하지만 활성 OMEGA LASER에는 사용하지 않습니다. 시각
프레임은 성능 품질별 풀 크기만 바꾸며 실제 피해·충전·스폰 지연은 결정론적 엔진 값에 종속됩니다.

### Retired Omega Laser source and active route healing-kit motion atlas

- 생성·적용일: 2026-08-10
- 생성 도구: OpenAI 내장 ImageGen
- 스타일 참조 원본:
  - `public/assets/overload/vfx/combat-fx-atlas.png`
  - `public/assets/overload/ui/rewards/omegaLaser.webp`
  - `public/assets/overload/ui/rewards/regen.webp`
- OMEGA LASER:
  - ImageGen 원본: `reference/source-assets/overload/omega-laser-motion-atlas-imagegen-source.png`
  - 알파 보존 원본: `reference/source-assets/overload/omega-laser-motion-atlas-alpha.png`
  - 삭제한 과거 런타임 경로: `public/assets/overload/vfx/omega-laser-motion-atlas.png`
  - QA 미리보기: `qa/omega-laser-motion-atlas-preview.png`
- 회복 키트:
  - ImageGen 원본: `reference/source-assets/overload/healing-kit-motion-imagegen-source.png`
  - 알파 보존 원본: `reference/source-assets/overload/healing-kit-motion-atlas-alpha.png`
  - 런타임 경로: `public/assets/overload/items/healing-kit-motion-atlas.png`
  - QA 미리보기: `qa/healing-kit-motion-atlas-preview.png`
- 후처리: ImageGen `remove_chroma_key.py`의 border auto-key, soft matte, despill로
  `#00ff00` 배경을 제거하고 `scripts/normalize-motion-atlas.py`로 OMEGA LASER는 4×3,
  256px 셀, 회복 키트는 4×1, 192px 셀의 투명 PNG로 정규화했습니다.
- OMEGA LASER 최종 프롬프트:

  > Use case: stylized-concept. Asset type: production 2D browser-game Omega Laser animation atlas. Input images: Image 1 is the approved VFX style and cyan support-emitter reference; Image 2 is the approved projectile/VFX material reference. Primary request: create one cohesive 4-column by 3-row spritesheet for a colossal futuristic cyan-white Omega Laser, facing exactly screen-right in every cell. Slot layout: exactly 12 equal cells, four cells per row, three rows. Row 1 is a compact circular mechanical muzzle/emitter charging sequence: dormant core, rings opening, core compression, firing flare. Row 2 is a seamless horizontally tileable beam-core sequence: four distinct pulse phases, each beam enters at the exact left-center edge and exits at the exact right-center edge with identical cross-section at both edges, luminous white core, cyan plasma sheath, fine electric filaments, no cannon body. Row 3 is the beam endpoint impact sequence: first contact, armor rupture, expanding cyan shock crown, fading ion fragments. Style/medium: polished high-detail sci-fi game VFX sprite atlas, matching the approved dark mechanical materials and cyan-white energy language, sharp readable silhouette at small scale. Composition/framing: fixed 4x3 grid, every effect centered inside its own equal cell with generous internal safety padding except row 2 which must touch both horizontal cell edges for seamless tiling. Consistent scale and alignment across each row. Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for local background removal. Constraints: background must be one uniform #00ff00 with no shadow, gradient, texture, reflection, floor plane, haze, or lighting variation; no green inside effects; no labels; no grid lines; no text; no watermark; no characters; no scenery; no poster composition; do not stretch or depict one long cannon-and-beam image; emitter, tileable beam core, and impact cap must remain separate modular components.

- 회복 키트 최종 프롬프트:

  > Use case: stylized-concept. Asset type: production 2D browser-game healing kit pickup animation strip. Input images: Image 1 is the approved cyan-white VFX material reference; Image 2 is only a thematic recovery-system reference. Primary request: create one cohesive horizontal 4-frame animation strip of the same compact futuristic field-repair kit viewed from a strict 90-degree top-down camera. Frame 1: sealed black-and-white armored med case with cyan medical cross core. Frame 2: cyan corner lights pulse. Frame 3: segmented lid opens slightly and the repair core glows. Frame 4: bright pickup flare with small cyan nanite fragments, while the kit silhouette remains recognizable. Style/medium: polished high-detail sci-fi game pickup sprite, hard-surface black and white armor, cyan emissive recovery core, readable at 44-56 pixels, matching the existing game art. Composition/framing: exactly one row of four equal slots; one centered kit per slot; identical scale, orientation, and anchor; generous padding; no perspective tilt. Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for local background removal. Constraints: background is one uniform #00ff00 with no shadow, gradient, texture, reflection, floor plane, haze, or lighting variation; do not use green in the kit; no labels except a simple geometric medical cross symbol; no text; no grid lines; no watermark; no scenery; no hands; no characters; no extra items; no poster composition.

활성 OMEGA LASER는 포구, 짧은 빔 코어, 충돌 끝단을 독립 모듈로 합성합니다. 코어 셀은
균일 비율을 유지한 채 겹쳐 반복하므로 포신이나 한 장의 이미지가 공격 거리만큼 늘어나지
않습니다. 회복 키트는 결정론적으로 배치된 경로 아이템 위에서 4프레임 점멸 모션을 재생합니다.

### Active level-up reward illustrations

- 생성·적용일: 2026-08-10
- 생성 도구: OpenAI 내장 ImageGen
- 제작 원본: `reference/source-assets/overload/ui/reward-card-art-atlas.png`
- 런타임 경로: `public/assets/overload/ui/rewards/*.webp`
- 후처리: 5×4 아틀라스를 20개 셀로 분할하고 각 셀을 384×384, WebP 품질 88로
  최적화했습니다.
- 최종 프롬프트:

  > Create exactly twenty intuitive square upgrade illustrations in a 5-column by 4-row atlas for a premium near-black cyberpunk action game. Row 1: scatter array, rail lance, guided rocket, orbit blades, pulse overdrive. Row 2: weapon overcharge, clock surge, forked barrel, hex shield, phase dash. Row 3: nano repair, Arc Cascade, Zero-Point Nova, Skyfall impact, Omega Laser. Row 4: hunter drone, pulse sentry, suppressor wisp, four-soldier recall link, hostile sovereign AI core. Use cinematic cyan, white-gold, amber, violet, and red energy on dark industrial backgrounds. Each cell must communicate its gameplay function immediately without text. No captions, letters, numbers, card borders, grid lines, logos, or watermark.

활성 보상 18종은 각 선택 카드의 전체 폭 일러스트로 사용하며, 나머지 pulse와 AI core 셀은
같은 제작 세트의 예비 원본으로 보존합니다.

### HAVEN-09 campaign, squad traces, regional battlefields, and bosses

- 생성·적용일: 2026-08-10
- 생성 도구: OpenAI 내장 ImageGen
- 외부 게임 이미지: 사용하지 않음
- 아군 흔적 3×1 아틀라스
  - 제작 원본: `reference/source-assets/overload/campaign/squad-traces-imagegen-source.png`
  - 투명화 원본: `reference/source-assets/overload/campaign/squad-traces-alpha.png`
  - 런타임: `public/assets/overload/campaign/squad-traces-atlas.png`
- HAVEN-09 기지
  - 제작 원본: `reference/source-assets/overload/campaign/haven-09-base-imagegen-source.png`
  - 런타임: `public/assets/overload/campaign/haven-09-base.webp`
- HANA·ILYA·LARK 3×1 제작 원본(레거시 소스, 공개 런타임 합본 삭제)
  - 제작 원본: `reference/source-assets/overload/campaign/haven-npc-portraits-imagegen-source.png`
  - 투명화 원본: `reference/source-assets/overload/campaign/haven-npc-portraits-alpha.png`
  - HANA 독립 런타임: `public/assets/overload/ui/npcs/hana-research-director-v2.webp`
  - ILYA 독립 런타임: `public/assets/overload/ui/npcs/ilya-mechanic-v4.webp`
  - SERA 독립 런타임: `public/assets/overload/ui/npcs/sera-nightjar-pilot-v4.webp`
- 비행선 지역 선택 지도
  - 제작 원본: `reference/source-assets/overload/campaign/airship-region-map-imagegen-source.png`
  - 삭제한 v1 런타임: `public/assets/overload/campaign/airship-region-map.webp`
  - 활성 v2 런타임: `public/assets/overload/campaign/airship-region-map-v2.webp`
- GLASS DUNE
  - 루트 원본 / 런타임: `reference/source-assets/overload/regions/glass-dune/route-imagegen-source.png` / `public/assets/overload/regions/glass-dune/route.webp`
  - 보스방 원본 / 런타임: `reference/source-assets/overload/regions/glass-dune/boss-room-imagegen-source.png` / `public/assets/overload/regions/glass-dune/boss-room.webp`
  - 보스 형상 원본 / 투명화 / 런타임: `reference/source-assets/overload/regions/glass-dune/boss-forms-imagegen-source.png` / `reference/source-assets/overload/regions/glass-dune/boss-forms-alpha.png` / `public/assets/overload/regions/glass-dune/boss-forms-atlas.png`
- ABYSSAL ARCHIVE
  - 루트 원본 / 런타임: `reference/source-assets/overload/regions/abyssal-archive/route-imagegen-source.png` / `public/assets/overload/regions/abyssal-archive/route.webp`
  - 보스방 원본 / 런타임: `reference/source-assets/overload/regions/abyssal-archive/boss-room-imagegen-source.png` / `public/assets/overload/regions/abyssal-archive/boss-room.webp`
  - 보스 형상 원본 / 투명화 / 런타임: `reference/source-assets/overload/regions/abyssal-archive/boss-forms-imagegen-source.png` / `reference/source-assets/overload/regions/abyssal-archive/boss-forms-alpha.png` / `public/assets/overload/regions/abyssal-archive/boss-forms-atlas.png`
- 후처리: 환경 이미지는 1920×1080 WebP 품질 88로 최적화했습니다. 크로마키 아틀라스는
  border auto-key, soft matte, despill로 투명화하고 3×1 고정 셀로 정규화했습니다.

- 아군 흔적 최종 프롬프트:

  > Use case: stylized-concept
  > Asset type: production 2D top-down game evidence/casualty atlas for TRAIN ME WRONG: OVERLOAD.
  > Primary request: create exactly one horizontal 3-column by 1-row atlas, three equal square-safe cells, showing three distinct fallen allied traces found along a ruined AI-occupied transit route. Cell 1 ROOK: a fallen heavy rifleman in black gunmetal armor with amber squad accents, collapsed from a strict 90-degree overhead ceiling camera, rifle beside one arm and several empty magazines, non-graphic. Cell 2 NYX: a broken cyan-violet phase blade, severed cable spool, torn tactical cloak and damaged data recorder, no body required. Cell 3 MOSS: a fallen broad shield operator in dark armor with restrained green-cyan accents, one hand still holding a hexagonal bulkhead access key, non-graphic.
  > Style/medium: premium high-detail realistic anime sci-fi game sprite art, near-black industrial materials, cyan system light, red hostile scorch marks, consistent with a polished Phaser action game rather than pixel art.
  > Composition/framing: exact 3x1 layout, one centered isolated trace per equal cell, strict 90-degree true-nadir view, identical apparent scale, generous padding, no perspective tilt, no overlap between cells.
  > Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for local removal.
  > Constraints: one uniform green background with no shadow, floor, gradient, texture, reflection, smoke, or lighting variation; no green in subjects; no gore; no exposed organs; no labels; no grid lines; no text; no watermark; no scenery; no living standing characters; every item fully inside its cell.

- HAVEN-09 기지 최종 프롬프트:

  > Use case: stylized-concept
  > Asset type: full-screen main-base environment for a premium 2D sci-fi browser game.
  > Primary request: an authored wide 16:9 interior of humanity's hidden mobile command base after an AI occupation, called HAVEN-09. The same space must visibly contain four readable interaction zones: a cyan-lit operations console on the left, a white-and-amber engineering workshop on the right, a compact medical/research alcove at the upper center, and a large docked stealth airship with an illuminated boarding ramp at the rear. Keep a broad uncluttered central floor where UI hotspots can be placed.
  > Style/medium: cinematic high-detail realistic anime sci-fi environment concept art painted as production game background, dark graphite machinery, worn white armor panels, cyan navigation light, warm amber human work lamps, restrained red warning accents.
  > Composition/framing: wide 16:9, elevated three-quarter tactical camera, strong depth but stable readable zones, central negative space, airship clearly identifiable, no cropped essential stations.
  > Lighting/mood: protected refuge after catastrophe, cool industrial shadows with pockets of warm human light.
  > Constraints: no text, labels, logos, watermark, UI, floating cards, speech bubbles, giant characters, enemies, combat, poster composition, or repeated/tiled architecture.

- NPC 포트레이트 최종 프롬프트:

  > Use case: stylized-concept
  > Asset type: production dialogue portrait atlas for HAVEN-09 NPCs in TRAIN ME WRONG: OVERLOAD.
  > Primary request: create exactly one horizontal 3-column by 1-row portrait atlas with three different waist-up NPCs, each centered in an equal cell and facing the viewer. Cell 1 HANA, Korean female mission operator in her early 30s, short black bob, calm sharp expression, compact neural headset, black command uniform with white collar and cyan signal lines. Cell 2 ILYA, weathered male chief engineer in his late 50s, silver stubble, warm tired eyes, heavy graphite mechanic coat, amber tool harness and one cybernetic forearm. Cell 3 LARK, androgynous reconnaissance android with a porcelain-white faceplate, subtle human features, pale blue optical irises, hooded dark scout mantle and cyan sensor collar.
  > Style/medium: premium detailed realistic anime sci-fi character illustration, coherent with a silver-haired heroine in a black tactical exosuit and white coat, crisp game dialogue art, shared lighting and scale.
  > Composition/framing: exact 3x1 layout, equal cells, head shoulders upper torso and waist visible, consistent eye line, generous padding, no overlap.
  > Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for local removal.
  > Constraints: uniform green background without gradient, floor, shadow, texture, reflection, or lighting variation; no green in clothing or effects; no text, names, labels, grid lines, logos, UI, watermark, weapons crossing cell boundaries, scenery, extra people, or poster composition.

- 비행선 지역 지도 최종 프롬프트:

  > Use case: stylized-concept
  > Asset type: full-screen airship deployment region-selection background for a premium sci-fi game.
  > Primary request: a wide 16:9 holographic strategic view seen from inside a stealth airship command deck. Three geographically separate mission zones must be immediately readable as clickable destinations without any text: left, a rain-soaked ruined megacity transit corridor with cyan emergency lights; center, an amber glass desert filled with shattered solar mirrors and a colossal buried AI observatory; right, a midnight-blue flooded data vault beneath a stormy polar sea with vertical server towers. Connect the three zones with restrained cyan flight-path arcs and place a small human resistance airship silhouette near the lower center.
  > Style/medium: cinematic high-detail realistic anime sci-fi tactical map illustration, dark glass command table, luminous but restrained holographic materials, production game menu background.
  > Composition/framing: wide 16:9, three clearly separated large destination masses with generous surrounding space for DOM buttons, center region slightly dominant but none cropped.
  > Constraints: no text, numbers, labels, logos, UI cards, buttons, watermark, characters, enemy montage, Earth globe, generic star map, or poster title.

- GLASS DUNE 루트 최종 프롬프트:

  > Use case: stylized-concept
  > Asset type: production top-down route environment for Chapter 2 of TRAIN ME WRONG: OVERLOAD.
  > Primary request: create a wide 16:9 battlefield showing the GLASS DUNE solar graveyard, a long open east-west combat route across a black vitrified desert. The broad center lane is smooth cracked obsidian and pale ceramic plates; outer edges contain shattered heliostat mirrors, buried SOVEREIGN pylons, wind-carved glass fins, and amber energy conduits. Five plausible mechanical transit-gate mouths are built into the far edges without blocking the lane.
  > Style/medium: premium high-detail realistic anime sci-fi environment, production 2D game background, same dark industrial fidelity as a rain-soaked ruined megacity but transformed into an amber-white glass desert.
  > Composition/framing: strict 90-degree true-nadir ceiling camera, wide 16:9, traversable central 70 percent, east-west forward movement, no perspective convergence, stable terrain scale, seamless enough for long horizontal TileSprite use.
  > Lighting/mood: hard moonlight, amber energy reflected across obsidian, lonely and hostile.
  > Constraints: no characters, corpses, enemies, boss, projectiles, UI, text, labels, logos, watermark, vehicle, giant central obstacle, fake screen border, perspective horizon, or poster composition.

- GLASS DUNE 보스방 최종 프롬프트:

  > Use case: stylized-concept
  > Asset type: dedicated Chapter 2 boss chamber environment for TRAIN ME WRONG: OVERLOAD.
  > Primary request: create the immense buried solar observatory chamber beneath GLASS DUNE. A wide oval black-glass combat floor dominates the center; a broken concentric heliostat crown and molten amber reactor well loom on the right; a sealed resistance entry lock is on the left; collapsed white ceramic gantries and mirror shards frame the perimeter. The floor must remain open for a tiny player and an overwhelmingly large mechanical boss.
  > Style/medium: premium high-detail realistic anime sci-fi production game background, graphite, bone-white ceramic, molten amber and restrained hostile red.
  > Composition/framing: strict 90-degree true-nadir camera, authored asymmetric 16:9 room, stable single image, broad oval playable floor with no central obstacle, left entry and right boss origin visually clear.
  > Constraints: no boss, characters, enemies, corpses, weapons, projectiles, text, UI, labels, logos, watermark, repeated tiles, mirrored halves, perspective horizon, or poster composition.

- ABYSSAL ARCHIVE 루트 최종 프롬프트:

  > Use case: stylized-concept
  > Asset type: production top-down route environment for Chapter 3 of TRAIN ME WRONG: OVERLOAD.
  > Primary request: create a wide 16:9 battlefield inside the ABYSSAL ARCHIVE, a drowned SOVEREIGN data cathedral beneath a polar sea. A long raised east-west armored causeway occupies the broad center; deep moving water, glass pressure windows, vertical server monoliths, fiber-optic roots and cyan-violet bioluminescent coolant fill the outer edges. Visible gate machinery at the perimeter can release enemies without blocking movement.
  > Style/medium: premium high-detail realistic anime sci-fi environment, production 2D game background, near-black titanium, wet blue steel, icy cyan and violet data light.
  > Composition/framing: strict 90-degree true-nadir ceiling camera, wide 16:9, traversable central 70 percent, east-west forward path, no perspective convergence, stable scale, suitable for long horizontal TileSprite use.
  > Lighting/mood: crushing ocean darkness, cold pressure lights, ancient machine intelligence waking below.
  > Constraints: no characters, corpses, enemies, boss, fish, projectiles, UI, text, labels, logos, watermark, giant central obstacle, perspective horizon, or poster composition.

- ABYSSAL ARCHIVE 보스방 최종 프롬프트:

  > Use case: stylized-concept
  > Asset type: dedicated Chapter 3 boss chamber environment for TRAIN ME WRONG: OVERLOAD.
  > Primary request: create the central memory-vault chamber of the ABYSSAL ARCHIVE. An open dark oval combat floor sits inside a vast pressure dome; a fractured archive iris and vertical abyssal data shaft dominate the right side; the left side has a reinforced airlock entry; flooded server stacks, thick cable roots, blue-violet coolant pools and cracked observation glass frame the edges. The center must remain clear for a tiny player and a colossal boss.
  > Style/medium: premium high-detail realistic anime sci-fi production game background, wet black metal, icy cyan, deep cobalt, restrained violet and hostile red indicators.
  > Composition/framing: strict 90-degree true-nadir camera, asymmetric authored 16:9 room, single stable image, broad oval playable floor, left entry and right boss origin visually distinct.
  > Constraints: no boss, characters, enemies, corpses, sea creatures, projectiles, text, UI, labels, logos, watermark, repeated tiles, mirrored halves, perspective horizon, or poster composition.

- MIRROR TYRANT 3단계 보스 최종 프롬프트:

  > Use case: stylized-concept
  > Asset type: production 2D boss forms atlas for Chapter 2 of TRAIN ME WRONG: OVERLOAD.
  > Primary request: create exactly one horizontal 3-column by 1-row atlas showing three escalating forms of the same colossal SOVEREIGN boss, MIRROR TYRANT. It is a circular buried-solar-observatory war machine seen from a strict 90-degree overhead ceiling camera. Form 1 sealed: dense graphite and bone-white ceramic core, four folded heliostat blade arms, compact amber reactor. Form 2 armor break: eight mirror scythe arms unfold, red targeting lenses and molten amber focusing rings exposed. Form 3 solar meltdown: sixteen asymmetric mirror blades form a radiant lethal corona, central white-amber fusion aperture overloading with restrained red fractures.
  > Style/medium: premium high-detail realistic anime sci-fi game sprite, polished mechanical micro-detail, imposing readable silhouette, coherent with black gunmetal SOVEREIGN drones and a giant radial inference core.
  > Composition/framing: exact 3x1 layout, three equal square cells, same boss identity, centered pivot and apparent scale in each cell, strict true-nadir view, generous padding, no overlap.
  > Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for local removal.
  > Constraints: uniform green background without shadow, gradient, floor, texture, smoke, reflection, haze, or lighting variation; no green in boss; no text, labels, grid lines, UI, watermark, scenery, player, extra enemies, detached projectiles, poster composition, oblique camera, visible horizon, or cropped limbs.

- DROWNED ORACLE 3단계 보스 최종 프롬프트:

  > Use case: stylized-concept
  > Asset type: production 2D boss forms atlas for Chapter 3 of TRAIN ME WRONG: OVERLOAD.
  > Primary request: create exactly one horizontal 3-column by 1-row atlas showing three escalating forms of the same colossal SOVEREIGN boss, DROWNED ORACLE. It is an abyssal archive guardian seen from a strict 90-degree overhead ceiling camera: a massive concentric sensor organism made of wet black titanium, pressure glass, cable roots and cold data light. Form 1 sealed: compact circular archive iris, six folded cable limbs, cyan central eye. Form 2 memory breach: twelve articulated cable-scythe limbs unfold, violet auxiliary eyes and rotating data rings exposed. Form 3 abyssal revelation: a huge asymmetric many-limbed radial crown, brilliant cyan-white center, violent cobalt-violet energy channels and restrained hostile red fractures.
  > Style/medium: premium high-detail realistic anime sci-fi game sprite, wet mechanical surfaces, polished micro-detail, oppressive readable silhouette, coherent with SOVEREIGN machine forces.
  > Composition/framing: exact 3x1 layout, three equal square cells, same boss identity, centered pivot and apparent scale in each cell, strict true-nadir view, generous padding, no overlap.
  > Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for local removal.
  > Constraints: uniform green background without shadow, gradient, floor, texture, water, smoke, reflection, haze, or lighting variation; no green in boss; no text, labels, grid lines, UI, watermark, scenery, player, extra enemies, detached projectiles, poster composition, oblique camera, visible horizon, or cropped limbs.

### AEGIS aim-relative 72-frame motion atlas v2 (비활성 제작 이력)

- 생성일: 2026-08-10
- 생성 도구: OpenAI 내장 ImageGen
- 당시 런타임 경로: `public/assets/overload/hero/survivor-motion-atlas-v2.png`
- 런타임 규격: 8열 × 9행, 192×192 셀, 투명 PNG, 총 72프레임
- 행 계약: 전진 / 후진 / 조준축 기준 상향 스트레이프 / 하향 스트레이프 / 대기 / 정지 사격 /
  대시 / 피격·스턴 / 전투불능
- 캐릭터 기준 원본: `reference/source-assets/overload/hero/silver-aegis-right-shoulder-motion-atlas-chroma.png`의
  strict-overhead AEGIS와 `reference/source-assets/overload/hero/`에 보존한 사용자 제공 은발 AEGIS 일러스트
- 보존한 제작 원본과 중간 결과:
  - `reference/source-assets/overload/animation-v2/hero/hero-fire-8-chroma.png`
  - `reference/source-assets/overload/animation-v2/hero/hero-reactive-8x4-chroma-v2.png`
  - `reference/source-assets/overload/animation-v2/hero/hero-locomotion-8x4-chroma.png`
  - `reference/source-assets/overload/animation-v2/hero/hero-locomotion-7x4-chroma-v2.png`
  - 같은 폴더의 `*-alpha.png`, `*-normalized*.png`, edit-canvas 및 seed 파일
- ImageGen 원본 경로:
  - `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-d86d9558-2fee-4ab0-a553-73e320d4878f.png`
    (정지 사격)
  - `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-8169474a-f7fd-4428-8af6-800feebac54c.png`
    (대기·대시·피격·전투불능 수정본)
  - `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-5dd388f0-9c8b-4440-9380-f77284bd6cca.png`
    (조준 상대 이동)
  - `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-ddef8066-4fd2-4832-b747-47c1952a0da9.png`
    (셀 안전 여백 수정 참조본)
- 후처리: ImageGen의 균일한 `#ff00ff` 배경을
  `remove_chroma_key.py`의 border auto-key, soft matte, despill로 투명화했습니다. 생성기가 조준 상대
  이동 시트를 7박자로 출력한 사실을 숨기지 않고, `scripts/normalize-overflow-grid-atlas.py`가 연결 성분으로
  셀 경계를 넘은 소총·코트까지 배우 단위로 복원한 뒤 첫 접지 포즈를 마지막 프레임에 한 번 반복해
  결정론적 8프레임 루프를 닫았습니다. `scripts/compose-atlas-rows.py`가 승인된 행만 8×9 런타임
  아틀라스로 조립합니다. 생성기 출력 원본은 삭제하거나 덮어쓰지 않았습니다.

- 정지 사격 최종 프롬프트:

  > Use case: stylized-concept. Asset type: production eight-frame stationary-fire strip for a top-down Phaser game. Preserve the supplied silver-haired female AEGIS survivor exactly: strict 90-degree true-nadir camera, black tactical exosuit, white split coat tails, cyan-accented futuristic rifle, rifle buttstock seated in the right shoulder, right trigger hand and left support hand coherent. Create exactly one horizontal 8-column strip with a stable center pivot and screen-right aim: ready, trigger take-up, small cyan muzzle ignition, peak muzzle flash, short energy bloom, restrained recoil, mechanical recovery, ready-loop return. Keep the feet and torso planted; recoil may move the weapon and shoulder only a few pixels, never shake or rotate the whole actor. Flat solid #ff00ff chroma background, generous isolated cell gutters, no cell overlap, no projectiles crossing cells, no text, grid, shadow, floor, scenery, UI, watermark, oblique view, visible face, or cropped weapon.

- 대기·반응 8×4 최종 프롬프트:

  > Use case: stylized-concept. Asset type: production reactive motion atlas for the same strict-overhead AEGIS survivor. Create exactly an 8-column by 4-row atlas with one complete actor per cell, screen-right rifle aim and consistent centered pivot. Row 1: subtle breathing and coat/hair settling idle loop with the rifle shouldered. Row 2: phase-dash anticipation, forward lean, three high-speed travel poses, then controlled recovery without changing the aim anchor. Row 3: armor impact, short hit-stun compression, balance recovery and return to ready. Row 4: terminal defeat sequence from stagger through knee collapse to a readable prone strict-overhead silhouette. Preserve identity, outfit, weapon grip, true-nadir camera and scale in all 32 frames. Flat #ff00ff background, no VFX, trails, floor, labels, grid, text, shadow, extra actors, detached weapon pieces, oblique anatomy, or cross-cell pixels. Scale every actor down enough that hair, coat, boots and rifle remain entirely inside its cell.

- 조준 상대 이동 최종 프롬프트:

  > Use case: stylized-concept. Asset type: production aim-relative locomotion atlas for a top-down Phaser game. Create the same silver-haired female AEGIS survivor in four movement rows while her rifle and whole upper body stay aimed screen-right: forward advance, backward backpedal, strafe up, strafe down. Each row is a complete foot-contact cycle with stable crown and shoulder pivot, coherent right-shoulder rifle mount, restrained tactical gait, subtle coat and hair follow-through, no upper-body rocking, and a strict 90-degree true-nadir ceiling camera. Use a flat #ff00ff chroma-key background and generous safety gutters. No labels, text, guides, borders, shadows, floor, scenery, VFX, loose projectiles, extra props, detached fragments, cell overlap, oblique camera, visible face/chest front, horizontal flip, or cropped rifle and coat.

- 셀 여백 수정 프롬프트:

  > Targeted production cleanup of the supplied exact 8-column by 4-row top-down character locomotion sprite atlas. Preserve the same silver-haired female AEGIS survivor, strict true-nadir camera, right-shouldered futuristic rifle aimed screen-right in every frame, the same four row meanings and the same movement cadence. Scale each complete character including rifle muzzle, coat tails, boots, hair and every silhouette element down by about 25 percent inside its own cell, then independently center each actor within that cell. Leave a generous uninterrupted flat #ff00ff magenta safety gutter around every actor on all four sides. Absolutely no body part, rifle fragment, coat fragment, shadow, particle, speck, or pixel may cross a cell boundary or appear in a neighboring cell. Keep consistent scale and stable screen position. No labels, text, guide lines, borders, shadows, effects, extra props, partial duplicate fragments, identity redesign, or pose redesign.

이전에 제공된 검은 단발 캐릭터 원본과 생성 스트립은 제작 이력 보존 목적으로
`reference/source-assets/overload/hero/`에 남아 있지만 활성 매니페스트에서는 더 이상 사용하지 않습니다.

### AEGIS 상·수평·하 조준 아틀라스

- 생성일: 2026-08-10
- 생성 도구: OpenAI 내장 ImageGen (기존 8×9 활성 아틀라스를 편집 참조로 사용)
- 활성 런타임 경로:
  - `public/assets/overload/hero/survivor-directional-aim-atlas.png` (8×3, 128px 셀)
  - `public/assets/overload/hero/performance/survivor-directional-aim-atlas.png` (8×3, 96px 셀)
- 크로마키 원본: `reference/source-assets/overload/hero/silver-aegis-directional-aim-atlas-chroma.png`
- ImageGen 원본 경로:
  `imagegen-job/019feaad-b25d-7603-9a36-51ea149f536c/exec-2b28696a-0165-4456-b4e0-4229098f4831.png`
- 후처리: `remove_chroma_key.py`의 border auto-key, soft matte, despill로 `#00ff00`을 제거한 뒤
  `scripts/normalize-motion-atlas.py`가 24개 셀을 공유 스케일·중앙 피벗·투명 안전 여백으로 정규화했습니다.
  검증 시트는 `qa/survivor-directional-aim-preview.png`입니다.
- 최종 프롬프트:

  > Use case: precise-object-edit
  > Asset type: production top-down browser-game sprite atlas extension
  > Input image: the provided approved 8×9 AEGIS sprite atlas is the sole identity, costume, palette, silhouette, and rendering reference.
  > Primary request: create one exact 8 columns × 3 rows sprite sheet of the SAME silver-haired female AEGIS character, strict 90-degree true-nadir ceiling camera, head always at the top of every cell and feet always at the bottom, rifle buttstock seated in her right shoulder, right trigger hand and left support hand coherent. Row 1: rifle aimed diagonally toward upper-right at about -42 degrees. Row 2: rifle aimed directly screen-right. Row 3: rifle aimed diagonally toward lower-right at about +42 degrees. Across each row, columns 1–4 are a restrained eight-frame locomotion cycle beginning with two neutral/ready poses, columns 5–8 are a restrained firing cycle with at most 2 px-equivalent recoil and a small muzzle glow only in columns 6–7. Keep body orientation upright in all 24 cells; NEVER rotate the whole body toward the weapon.
  > Layout: exact evenly spaced 8×3 grid, identical centered anchor and scale in every cell, generous equal padding, no overlap between cells.
  > Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for removal, one uniform color with no shadows, gradients, texture, reflections, or lighting variation.
  > Style: match the approved source exactly: polished semi-realistic cyberpunk game sprite, silver-white hair, black tactical exosuit, white split coat tails, cyan rifle accents, strict overhead readable silhouette.
  > Constraints: same character and proportions in every slot; exact frame count and slot layout; no scenery, labels, dividers, text, UI, watermark, cast shadow, contact shadow, face-front view, chest-front view, side view, three-quarter tilt, perspective convergence, additional characters, extra weapons, duplicated limbs, or #00ff00 anywhere in the subject. Production asset sheet, not concept art.

### 적·동료·지역 보스 전용 고프레임 모션 아틀라스 v3

- 생성일: 2026-08-10
- 생성 도구: OpenAI 내장 ImageGen
- 공통 제작 방식: 승인된 프로젝트 단일 배우/3단계 보스 시드를 ImageGen의 전체 시트 편집 참조로
  사용하고, 균일한 `#ff00ff` 크로마키를 프로젝트 `remove_chroma_key.py`의 border auto-key,
  soft matte, despill로 제거했습니다. `normalize-motion-atlas.py` 또는
  `normalize-overflow-grid-atlas.py`가 연결 성분을 배우 단위로 복원하고 공유 스케일·중앙 피벗·셀 안전
  여백을 맞췄습니다. 셀 밖 분리 파편만 `sanitize-motion-atlas.py`로 제거했습니다.
- 활성 런타임 경로와 규격:
  - `public/assets/overload/enemies/motion-v2/suicide-drone-motion-atlas.png`
  - `public/assets/overload/enemies/motion-v2/rifleman-motion-atlas.png`
  - `public/assets/overload/enemies/motion-v2/sniper-motion-atlas.png`
  - 위 적 3종: 각각 6열 × 4행, 160×160 셀, 24프레임
  - `public/assets/overload/allies/motion-v2/hunter-drone-motion-atlas.png`
  - `public/assets/overload/allies/motion-v2/pulse-sentry-motion-atlas.png`
  - `public/assets/overload/allies/motion-v2/suppressor-drone-motion-atlas.png`
  - 위 동료 3종: 각각 5열 × 4행, 128×128 셀, 20프레임
  - `public/assets/overload/boss/motion-v2/wrong-engine-motion-atlas.png`
  - `public/assets/overload/regions/glass-dune/motion-v2/mirror-tyrant-motion-atlas.png`
  - `public/assets/overload/regions/abyssal-archive/motion-v2/drowned-oracle-motion-atlas.png`
  - 위 보스 3종: 각각 6열 × 4행, 320×320 셀, 24프레임
- 런타임 행 계약:
  - 적: 접근·대기 / 공격 / 피격·과열 / 파괴·자폭
  - 동료: 전개 / 대기·이동 / 공격 / 피격·리콜
  - 보스: 1·2·3단계의 대기 A/B, 예고 A/B, 공격 A/B와 공통 변신·코어 노출·붕괴 행
- 승인 시드:
  - `public/assets/overload/enemies/hunter.png`
  - `public/assets/overload/enemies/suppressor.png`
  - `public/assets/overload/enemies/brute.png`
  - `public/assets/overload/allies/hunter-drone.png`
  - `public/assets/overload/allies/pulse-sentry.png`
  - `public/assets/overload/allies/suppressor-drone.png`
  - `public/assets/overload/boss/wrong-engine-forms-atlas.png`
  - `public/assets/overload/regions/glass-dune/boss-forms-atlas.png`
  - `public/assets/overload/regions/abyssal-archive/boss-forms-atlas.png`
- 보존 원본·중간 결과: `reference/source-assets/overload/animation-v3/`
- ImageGen 선택 원본:
  - 자폭 드론: `imagegen-job/019fe9ec-02f3-7e00-abab-60a877f9d538/exec-c60f2d41-9dbb-48e2-bd8c-b5abf5b50366.png`
  - 소총수: 같은 폴더의 `exec-546518e0-e3ab-49d0-8471-2cd9e2997ed4.png`
    (`exec-f726ec44-0103-4146-b8b1-cb1c799e398e.png` 7열 반려본도 보존)
  - 저격수: 같은 폴더의 `exec-b2b70e88-251e-4cc0-b0e5-51310d324aa3.png`
  - 헌터 드론: 같은 폴더의 `exec-65577cc6-7c6c-4237-809d-77fab74bcc77.png`
  - 펄스 센트리: 같은 폴더의 `exec-540ff7a2-1711-45ae-99c5-6bc39fb5d2ef.png`
  - 억제 드론: 같은 폴더의 `exec-66862e54-66da-4bb0-a860-bd49309868c3.png`
  - THE WRONG ENGINE: `imagegen-job/019fe9ec-3c94-75e3-a563-a957de5623e9/exec-be5db030-734d-4837-b8f6-5116ab45766c.png`
  - MIRROR TYRANT: 같은 폴더의 `exec-5a5d9a1d-6666-4bc0-bf68-4d85425037f6.png`
  - DROWNED ORACLE: 같은 폴더의 `exec-7732ee0e-7f22-4bff-ac5b-b36c908bbb58.png`

- 적 3종 공통 최종 프롬프트 조건:

  > Use case: style-transfer. Asset type: production 2D browser-game top-down enemy motion atlas. Edit the supplied identity seed into exactly twenty-four animation frames in a precise 6-column by 4-row grid. Strict orthographic 90-degree overhead view, screen-right facing, stable centered pivot and scale. Row 1 is a six-frame approach/idle loop; row 2 a six-frame attack loop; row 3 hit/overheat and recovery; row 4 death or self-destruct. Polished high-detail hand-painted sci-fi game sprite matching the approved seed. Exactly one fully contained actor per cell with generous gutters. Perfectly flat uniform solid #ff00ff chroma-key background. No oblique view, horizon, crop, overlap, duplicate actors, grid, label, text, floor, shadow, scenery, UI, watermark, or magenta in the subject.

- 자폭 드론 개별 프롬프트:

  > Preserve the same compact black gunmetal suicide drone, sharp four-fin silhouette, red central optic and warning lights. Approach uses restrained fin flex and optic pulse. Attack charges the optic and braces the fins, ending in a compact attached red energy flash. Hit/overheat spreads orange-red heat seams with restrained sparks. Self-destruct accelerates warning lights, separates armor petals, bursts the red-white core, and ends as a compact dissipating debris and energy flare without smoke crossing cells.

- 소총수 개별 프롬프트와 6열 교정:

  > Preserve the same bulky black gunmetal humanoid combat robot, segmented armor, small red optics and normal-length integrated rifle. Approach uses an armored leg cycle; attack braces, charges and fires a compact three-round orange-red muzzle sequence with controlled recoil; overheat spreads through torso and weapon; death collapses armor inward to a compact wreck. Never stretch the rifle.

  > Precise-object-edit: preserve the exact rifleman identity, overhead artwork, palette, action progression and effects, but change the generated seven-frame rows to exactly six frames per row and four rows. Place frame centers at x 128, 384, 640, 896, 1152 and 1408 and y 128, 384, 640 and 896. Condense each seven-beat row while retaining its first pose, climax and final recovery/destruction. No seventh actor or column; keep the uniform #ff00ff background.

- 저격수 개별 프롬프트:

  > Preserve the same broad black gunmetal quadruped heavy robotic sniper, four armored stabilizer legs, red rear/core optic and long-range weapon assembly. The six-frame crawl alternates stabilizer legs; attack plants them wide, charges the red focusing rails, releases one needle-like muzzle flash and recovers; hit frames overheat the shell; death folds the stabilizers and ruptures the core into a compact wreck. Never elongate the body or weapon.

- 동료 3종 공통 최종 프롬프트 조건:

  > Use case: style-transfer. Asset type: production 2D browser-game top-down allied unit motion atlas. Edit the supplied identity seed into exactly twenty frames in a precise 5-column by 4-row grid. Strict orthographic 90-degree overhead view, screen-right facing, stable centered pivot and scale. Row 1 is five-frame cyan holographic deployment; row 2 idle/move; row 3 attack; row 4 hit then holographic recall. The final recall frame is a compact cyan afterimage, not a destroyed wreck. Polished high-detail hand-painted sci-fi game sprite matching the approved seed. Exactly one fully contained actor/action per cell with generous gutters. Perfectly flat uniform #ff00ff chroma-key. No oblique view, horizon, crop, overlap, extra frame, grid, text, floor, shadow, scenery, UI, watermark, or magenta in the subject.

- 헌터 드론 개별 프롬프트:

  > Preserve the sleek silver-black hunter drone, long narrow fuselage, swept four-fin silhouette, cyan-blue engine and circuit lights. Deploy from a warp glint and holographic outline as the fins unfold; idle/move uses restrained fin compensation and thruster pulse; attack charges the nose emitter and releases one attached blue-white pulse flash with controlled recoil; recall contracts the holographic wireframe inward. Never stretch the fuselage.

- 펄스 센트리 개별 프롬프트:

  > Preserve the squat rectangular silver-black sentry platform, blue-lit chassis, four corner stabilizer feet and paired normal-length screen-right barrels. Deploy extends the feet and unfolds the barrels; idle uses reactor pulse and micro tracking; attack alternates blue-white muzzle flashes and controlled recoil; recall converts the whole chassis to a cyan wireframe and contracts it inward. Never stretch or smear the barrels.

- 억제 드론 개별 프롬프트:

  > Preserve the round silver-black armored drone, blue central sensor, two symmetric screen-right suppressor cannons, compact rear fins and cyan weapon lights. Deploy materializes and unfolds normal-length cannons; idle uses symmetric hover compensation and tracking; attack alternates blue-white suppression bursts with compact recoil; recall becomes a cyan wireframe and contracts inward. Never stretch or smear the cannons.

- 지역 보스 공통 최종 프롬프트 조건:

  > Use case: identity-preserve. Asset type: production 2D browser-game boss motion spritesheet. Create one 6-column by 4-row sheet with 24 isolated frames and a strict orthographic 90-degree overhead camera. Keep one centered core/pivot, stable scale, generous cell padding and the approved three-stage identity. Rows 1–3 each lock one approved phase across idle A, idle/move B, windup A, windup B, attack/fire A and recoil/attack B. Row 4 is transform start, transform peak, core exposed/hit, defeat start, collapse and final destroyed state. Restrained mechanical articulation, no random redesign, no camera rotation or scale drift. Perfectly flat #ff00ff chroma-key; no grid, borders, labels, text, floor, shadow, scenery, particles, detached objects, motion blur or watermark.

- THE WRONG ENGINE 개별 프롬프트와 보정:

  > Preserve the exact industrial black/gunmetal circular reactor machine, red core, cyan/orange auxiliary reactors and phase-specific limbs. Phase 1 keeps four large articulated gun/claw limbs, phase 2 keeps four pronounced curved blade/claw arms with radial armor spikes, and phase 3 keeps the many-spoke overloaded red starburst body. The terminal sequence unlocks the shell, expands through the phases, exposes and breaks the core, folds limbs inward and fully darkens the final core.

  > Precise-object-edit: lock every cell in rows 1–3 to its approved phase identity. Then change only row 1 columns 3–4 so their windup retains the compact phase-1 four-limb silhouette, and row 4 column 6 so it is an unmistakable inert destroyed machine with a dark core and folded/broken limb remnants. Preserve every other cell and the exact 6×4 layout.

- MIRROR TYRANT 개별 프롬프트:

  > Preserve the circular white ceramic/ivory mirror-armor machine, black gunmetal framework, amber core and indicator lights. Phase 1 keeps four rigid ivory cross-blades, phase 2 exactly the curved multi-scythe silhouette, and phase 3 the dense radial ivory shard crown. The terminal sequence unlocks plates, expands scythes, exposes the phase-3 core, shatters symmetry, folds shards inward and ends as an inert collapsed mirror mechanism. Do not substitute red/blue steel for the ivory, black and amber identity.

- DROWNED ORACLE 개별 프롬프트:

  > Preserve the biomechanical circular abyssal machine: wet black ribbed metal, cyan iris/core and circuit light, restrained violet nodes. Phase 1 keeps four broad rounded ribbed fins, phase 2 eight long curled tentacle arms, and phase 3 the dense many-tentacled blue-violet corona. The terminal sequence unlocks fins, expands toward the corona, exposes and hits the core, breaks symmetry, folds tentacles inward and ends with a dark inert core. No water, bubbles, smoke or detached pieces.

모든 9개 최종 시트는 `scripts/audit-motion-atlases.py`에서 전체 셀 nonempty, 4px 투명 안전 경계,
불투명 크로마 잔류 0을 통과합니다. 파일 합계는 약 9.85 MiB, RGBA8 완전 디코딩 합계는
38.91 MiB입니다. 적 시트만 공통 전투 로드에 포함하고, 동료 시트는 해당 보상을 실제 획득했을 때,
지역 보스 시트는 보스방 입장을 확정했을 때만 지연 로드합니다.

### 독립 수동 기술 모션 아틀라스 (고해상도 비활성 참고본)

- 생성일: 2026-08-10
- 생성 도구: OpenAI 내장 ImageGen
- 삭제한 과거 런타임 경로(현재 manifest에서 로드하지 않음):
  `public/assets/overload/vfx/manual/manual-ability-motion-atlas.png`
- 규격: 6열 × 4행, 192×192 셀, 24프레임, 투명 PNG
- 행 계약: NULL SNARE(Q) / AEGIS WARD(E) / STRATOS RUN(F) / HELIX TEMPEST(R)
- 승인 스타일 참조:
  - `reference/source-assets/overload/vfx/skill-motion-atlas-alpha.png`
  - `public/assets/overload/vfx/combat-fx-atlas.png`
- ImageGen 원본:
  - 1차: `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-20a02c7e-0e06-4561-8fda-737d5932a8ff.png`
  - 수량 교정 최종본: 같은 폴더의 `exec-da07c643-7edd-4eac-94fd-f260f6a0ef50.png`
- 프로젝트 보존 원본:
  - `reference/source-assets/overload/active-abilities/manual-ability-motion-imagegen-source.png`
  - `reference/source-assets/overload/active-abilities/manual-ability-motion-imagegen-corrected-source.png`
  - `reference/source-assets/overload/active-abilities/manual-ability-motion-corrected-alpha.png`
- 후처리: `remove_chroma_key.py`의 border auto-key, soft matte, despill로 배경을 제거한 뒤
  `scripts/normalize-motion-atlas.py`로 공유 중심·스케일·8px 안전 여백을 적용했습니다.
- 최초 생성 프롬프트:

  > Use case: identity-preserve. Asset type: production transparent-background visual-effects animation spritesheet for the browser game TRAIN ME WRONG: OVERLOAD. References: Image 1 and Image 2 define the existing premium realistic-anime sci-fi VFX rendering, crisp luminous cyan/white/amber energy, black-gunmetal technology, strict top-down readability, isolated sprite framing, and production-level detail. Do NOT copy any existing bomb circle, straight laser cannon, lightning ring, projectile, or old automatic skill. Create four wholly new MANUAL ability identities. Create ONE complete landscape spritesheet arranged as exactly 6 equal columns by 4 equal rows, 3:2 overall aspect ratio, 24 isolated frames. Strict orthographic 90-degree overhead/nadir camera in every frame. Each cell has one centered effect stage, consistent center/scale per row, generous uniform padding, and no content crossing cell boundaries. Adjacent columns must form smooth readable animation with restrained evolution, not six unrelated concepts. ROW 1 — NULL SNARE (Q), a cyan-violet gravity-control field, no explosion: c1 tiny dark gravity seed with thin orbital ticks; c2 two warped concentric rings; c3 wider spiraling inward arcs and bent cyan tracer fragments; c4 full stable vortex lattice with a dark center; c5 strongest inward distortion and visibly curved projectile trails; c6 rings contract and dissolve. It must read as pull/slow/trajectory bending, never direct blast damage. ROW 2 — AEGIS WARD (E), a player-following white-cyan hardlight defense: c1 small hexagonal emitter petals; c2 translucent six-sided shield facets assembling; c3 complete layered hex ward with a subtle medical cross-like pulse made only from light geometry and no text; c4 strongest protective shell with outward deflection sparks; c5 cracked-but-holding shield facets; c6 clean soft dissolution. No dome perspective; top-down circular/hex footprint. ROW 3 — STRATOS RUN (F), three parallel fighter strafing lanes: c1 three slim cyan target rails and tiny overhead fighter silhouettes entering from left; c2 fighters advance one-third with restrained muzzle streaks; c3 three staggered strafing streams at mid-pass; c4 fighters pass the center with bright white-cyan impacts along all three separate lanes; c5 fighters exit right leaving hot parallel trails; c6 trails fragment and fade. Keep exactly three clearly separated parallel lanes. No circular bombardment markers and no single stretched cannon. ROW 4 — HELIX TEMPEST (R), long-cooldown player-centered rotary ultimate: c1 compact central gunmetal rotor core deploying four short luminous lances at 90-degree spacing; c2 four longer cyan-white lances begin a clockwise helix rotation; c3 broad four-arm rotating sweep with curved motion ribbons; c4 maximum-radius 360-degree rotary storm with four distinct energy lances and a stable empty safe center; c5 over-rotation/recoil with white-hot lance tips; c6 rotor retracts into a fading circular afterimage. It must read as several rapid full rotations around the player, never a static ring and never one straight beam. Style/medium: high-detail premium 2D game VFX sprite art, sharp luminous cores, controlled bloom, crisp mechanical emitters, cyan/white base with small violet accents for Q and restrained amber accents only for F impacts. Stable silhouette and energy continuity, no pixel art, no motion blur that destroys shape readability. Scene/backdrop: perfectly flat uniform solid #ff00ff chroma-key background across the entire canvas for local removal. No grid lines, borders, labels, letters, key names, numbers, text, UI, scenery, floor, shadows, reflections, smoke clouds, watermarks, duplicate sheets, or extra objects. Do not use #ff00ff inside any effect. Crisp separated edges with no magenta rim.

- 수량·연속성 교정 프롬프트:

  > Use case: precise-object-edit. Image 1 is the selected production 6-column × 4-row manual-ability VFX spritesheet. Preserve its exact 6×4 layout, colors, rendering, flat chroma background, camera, scale, spacing, first two rows, and all design choices except the explicitly requested count corrections. Make only these count/continuity corrections: ROW 3 STRATOS RUN: every one of the six cells must contain exactly THREE parallel horizontal strafing lanes, no fourth lane. When fighters are visible, show exactly THREE matching tiny overhead fighter silhouettes, one per lane. Preserve the smooth left-to-right timeline: enter, advance, mid-pass, center impacts, exit, three fading trails. Keep the lanes equally spaced and fully within each cell. ROW 4 HELIX TEMPEST: columns 1 through 5 must show exactly FOUR luminous lance/blade arms attached to the same central rotor, at 90-degree spacing. Rotate the same four-arm assembly clockwise a little farther in each adjacent frame. Do not reduce it to three arms. Column 6 remains the retracted central rotor with a fading circular afterimage and no extended arm. Do not change ROW 1 NULL SNARE or ROW 2 AEGIS WARD. Exactly one complete sheet, 6 equal columns × 4 equal rows, strict orthographic 90-degree overhead view, stable centered pivots, generous gutters, no crossing cell boundaries. Perfectly uniform flat solid #ff00ff background across the canvas. No grid lines, borders, text, labels, numbers, UI, scenery, shadows, duplicate sheets, watermark, or new objects. Do not use #ff00ff in the effects.

기존 레벨업 자동 폭격·오메가 레이저의 상태, 판정, 이벤트 및 모션 시트는 이 수동 기술에
재사용하지 않습니다. 전용 시트의 행은 엔진이 소유하는 네 수동 기술의 독립 수명과 기하 판정에
연결됩니다.

### 활성 16-bit 도트 스킬 VFX 아틀라스

- 생성일: 2026-08-10
- 생성 도구: OpenAI 내장 `image_gen.imagegen` whole-sheet 생성
- 활성 런타임 경로:
  - `public/assets/overload/vfx/pixel/manual-ability-pixel-atlas.png`
  - `public/assets/overload/vfx/pixel/automatic-skill-pixel-atlas.png`
  - `public/assets/overload/vfx/gates/sovereign-gate-motion-atlas.png`
- 런타임 규격:
  - 수동 Q/E/F/R: 384×256, 6×4, 64×64 셀
  - 자동 SKYFALL/ARC/NOVA/OMEGA: 384×256, 6×4, 64×64 셀
  - SOVEREIGN 게이트: 기존 고품질 시트 4번째 행을 보존한 1152×192, 6×1
- ImageGen 선택 원본:
  - 수동: `imagegen-job/019fea33-753f-7a60-a8fd-ada52c2f858a/exec-2427d437-131f-404c-b0d7-f6beff26f786.png`
  - 자동: `imagegen-job/019fea33-753f-7a60-a8fd-ada52c2f858a/exec-064bb9ed-9c59-4d96-893a-ee7e2d331e60.png`
- 프로젝트 보존 원본:
  - `reference/source-assets/overload/vfx/pixel/manual-ability-pixel-imagegen-source.png`
  - `reference/source-assets/overload/vfx/pixel/manual-ability-pixel-alpha.png`
  - `reference/source-assets/overload/vfx/pixel/automatic-skill-pixel-imagegen-source.png`
  - `reference/source-assets/overload/vfx/pixel/automatic-skill-pixel-alpha.png`
- 기능 참조 seed:
  - `reference/source-assets/overload/active-abilities/manual-ability-motion-imagegen-corrected-source.png`
  - `reference/source-assets/overload/vfx/skill-motion-atlas-alpha.png`
  - `reference/source-assets/overload/omega-laser-motion-atlas-alpha.png`
- 후처리: 내장 `remove_chroma_key.py`의 border auto-key, soft-matte, despill을 거친 뒤
  `scripts/normalize-pixel-vfx-atlas.py --columns 6 --rows 4 --cell-size 64 --colors 32 --border 2`로
  네이티브 64px 셀, 제한 팔레트, 투명 안전 경계를 만들었습니다. 런타임은 두 시트에
  `Phaser.Textures.FilterMode.NEAREST`를 강제합니다. 게이트는 `scripts/compose-atlas-rows.py`로
  기존 시트의 행 3만 추출했습니다.
- 미리보기:
  - `qa/manual-ability-pixel-atlas-preview.png`
  - `qa/automatic-skill-pixel-atlas-preview.png`
- 디코딩 메모리: 과거 세 대형 스킬 시트 9.75 MiB에서 새 도트 시트 두 장과 게이트 행
  1.59375 MiB로 감소해 8.15625 MiB(약 83.65%)를 절감합니다.

- 수동 도트 VFX 정확한 프롬프트:

```text
Use case: stylized-concept
Asset type: production low-resolution pixel-art VFX sprite atlas for the top-down Phaser browser game TRAIN ME WRONG: OVERLOAD.
Input images: Image 1 is a gameplay-function reference only for the four manual abilities and six motion beats. Do not trace, blur, downsample, or pixel-filter the reference. Redesign every effect from scratch as authored pixel art.
Primary request: create one exact 6-column by 4-row sprite atlas, exactly 24 isolated square animation cells, read left-to-right. Row 1 NULL SNARE: tiny dark-violet gravity seed, expanding dotted cyan/violet spiral, stable sparse orbit dots, then clean collapse. Row 2 AEGIS WARD: compact cyan cross seed, hard-light pixel hex ring building outward, stable sparse shield, then shards fading. Row 3 STRATOS RUN: exactly three parallel miniature top-down fighter silhouettes and three straight cyan dotted tracer lanes in every cell; warning reticles in frames 1-2, fighters advancing in frames 3-5, three small pixel impact blooms in frame 6. Never merge the lanes and never show more or fewer than three. Row 4 HELIX TEMPEST: exactly four equal pixel energy arms at 90-degree spacing around a small central core in every cell; ignition, four rapid rotation poses, collapse in frame 6. Never show more or fewer than four arms.
Style/medium: authentic hand-authored 16-bit arcade pixel VFX, crisp square pixel clusters, hard stair-step edges, no antialiasing, restrained 5-7 color palette per row, dark navy outlines, cyan/white/violet primary colors with minimal amber only for STRATOS impacts, highly readable silhouettes, intentionally simple and lightweight, production sprite asset not concept art.
Composition/framing: exact uniform 6x4 grid filling a 3:2 landscape canvas; equal square slots; one complete centered effect per slot; consistent size and center anchor inside each row; generous empty separation and safety padding; no objects crossing cell boundaries.
Scene/backdrop: perfectly flat uniform solid #ff00ff chroma-key background covering every empty pixel. No transparency simulation, shadows, gradients, texture, glow fog, environment, floor, grid lines, borders, labels, text, numbers, logos, watermark, poster layout, extra rows, extra columns, duplicate sheets, or partially cropped cells. Do not use #ff00ff anywhere in any effect.
Constraints: exact 6 columns, exact 4 rows, exact 24 cells; square cell aspect; pixel art at native low resolution; animation progression must be obvious at 64x64; all STRATOS cells contain exactly three lanes/fighters; all HELIX cells contain exactly four arms.
```

- 자동 도트 VFX 정확한 프롬프트:

```text
Use case: stylized-concept
Asset type: production low-resolution pixel-art automatic-skill VFX sprite atlas for the top-down Phaser browser game TRAIN ME WRONG: OVERLOAD.
Input images: Images 1 and 2 are gameplay-function references only for air support, electrical arc, nova, and modular laser beats. Do not trace, blur, downsample, or pixel-filter either reference. Redesign every effect from scratch as authored low-color pixel art.
Primary request: create one exact 6-column by 4-row sprite atlas, exactly 24 isolated square cells, read left-to-right. Row 1 automatic SKYFALL: a dotted amber target reticle in frames 1-2, then a single compact top-down pixel bomber silhouette arriving and one contained orange pixel blast growing and fading in frames 3-6; never draw a long vehicle. Row 2 ARC CASCADE: six successive small cyan/white electrical dot-cluster nodes and short branching pixel sparks, centered, no long continuous lightning painted across cells. Row 3 ZERO-POINT NOVA: tiny cyan core, expanding sparse dotted circular wave, bright pixel ring, fragmented ring, then fading dots; each remains centered and circular. Row 4 automatic OMEGA LASER modular parts: frames 1-2 are compact side-facing cyan pixel emitter/cannon charge states contained inside the square; frames 3-4 are seamless short horizontal pixel beam-core tiles with matching left and right edges; frames 5-6 are compact endpoint impact blooms. No cannon or impact may be stretched across a full beam.
Style/medium: authentic hand-authored 16-bit arcade pixel VFX, crisp square pixel clusters, hard stair-step edges, no antialiasing, restrained 5-7 color palette, dark navy outlines, cyan/white with amber only for SKYFALL, readable on a dark sci-fi battlefield, intentionally simple and lightweight, production sprite asset not concept art.
Composition/framing: exact uniform 6x4 grid filling a 3:2 landscape canvas; equal square slots; one centered self-contained effect per slot; consistent size/anchor within each row; generous empty separation and safety padding; no objects cross cell boundaries. OMEGA beam tiles in row 4 frames 3-4 must be short square-cell modules, not full-length beams.
Scene/backdrop: perfectly flat uniform solid #ff00ff chroma-key background covering every empty pixel. No transparency simulation, shadows, gradients, texture, glow fog, environment, floor, grid lines, borders, labels, text, numbers, logos, watermark, poster layout, extra rows, extra columns, duplicate sheets, or partially cropped cells. Do not use #ff00ff inside any effect.
Constraints: exact 6 columns, exact 4 rows, exact 24 cells; square cell aspect; pixel art at native low resolution; clear animation progression at 64x64; row 4 frames 3-4 must tile horizontally and frames 1-2/5-6 remain square compact objects.
```

도트 시트는 시각 표현만 담당합니다. STRATOS의 3개 캡슐 lane, HELIX의 4개 회전 lance,
OMEGA의 광선 길이, Q/E의 원형 범위와 실제 피해·보호 타이밍은 계속 결정론적 엔진 geometry가
소유합니다. 이후 OMEGA의 반복 beam-core 모듈은 셀 이음새 문제로 폐기하고 같은 판정 좌표 위에
연속 다중 레이어 Graphics 광선을 그리도록 교체했습니다.

### EMP 펄스와 적 기계 폭발 도트 모션

- 생성일: 2026-08-10
- 생성 도구: OpenAI 내장 ImageGen, 프로젝트 `normalize-pixel-vfx-atlas.py`,
  `compose-atlas-rows.py`, 설치된 `remove_chroma_key.py`
- 적용 목적: 기존 수동 Q의 중력 흡인 표현을 폐기하고 전자기 정지 펄스로 교체하며,
  모든 일반 적 사망에 6프레임 기계 폭발을 적용합니다.
- 런타임 경로:
  - `public/assets/overload/vfx/pixel/manual-ability-pixel-atlas.png`의 0행(보존만 하는 구형 EMP 6프레임,
    현재 렌더 미사용)
  - `public/assets/overload/vfx/pixel/enemy-death-pixel-atlas.png`(6×1, 64×64 셀)
- ImageGen 원본:
  - `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-0ea1ca97-5d3f-4686-a3bd-c1cd7234c384.png`
- 프로젝트 원본과 정규화 중간본:
  - `reference/source-assets/overload/vfx/pixel-emp-explosion-v1/emp-explosion-chroma.png`
  - `reference/source-assets/overload/vfx/pixel-emp-explosion-v1/emp-explosion-alpha.png`
  - `reference/source-assets/overload/vfx/pixel-emp-explosion-v1/emp-explosion-normalized.png`
- QA 프리뷰와 실제 게임 캡처:
  - `qa/emp-explosion-pixel-preview.png`
  - `qa/latest-emp-pulse-desktop-1440x810.png`
- 후처리: border auto-key, soft-matte, despill로 `#ff00ff`을 제거하고 6×2·64px 셀·32색
  NEAREST 아틀라스로 정규화했습니다. 0행은 기존 수동 기술 시트의 Q행에 합성하고 1행은
  독립 적 사망 시트로 분리했습니다. 외부 게임 이미지나 외부 VFX는 사용하지 않았습니다.
- 정확한 ImageGen 프롬프트:

  > Use case: stylized-concept.
  > Asset type: production low-resolution pixel-art VFX sprite atlas for the top-down Phaser browser game TRAIN ME WRONG: OVERLOAD.
  > Input Image 1 is the approved simple 16-bit pixel VFX style reference. Input Image 2 is a mechanical enemy identity reference only. Do not trace, blur, downsample, or pixel-filter either reference. Redesign each effect from scratch as authored pixel art.
  > Create ONE exact 6-column by 2-row sprite atlas, exactly 12 isolated square animation cells, read left-to-right.
  > Row 1 — EMP PULSE, six animation beats: frame 1 compact cyan-white electronic charge seed; frame 2 a hard-edged circuit ring ignites; frame 3 a circular electromagnetic shock ring expands with sparse short electric arcs; frame 4 maximum-radius cyan/white pulse with a few violet pixel sparks; frame 5 fragmented ring and disabled-circuit sparks; frame 6 clean fading pixels. This is an electromagnetic shutdown pulse, not gravity: no spiral, vortex, inward pull, black hole, suction lines, orbiting debris, or implosion.
  > Row 2 — MECHANICAL ENEMY DESTRUCTION, six animation beats: frame 1 small red-orange core rupture; frame 2 compact angular ignition; frame 3 bright contained amber/white pixel blast; frame 4 maximum burst with small dark-metal shards and cyan circuit sparks; frame 5 fragments spreading and dimming; frame 6 sparse ember and cyan pixels fading. No smoke cloud and no gore.
  > Style/medium: authentic hand-authored 16-bit arcade pixel VFX, crisp square pixel clusters, hard stair-step edges, no antialiasing, restrained 5–7 color palette, dark navy outlines, cyan/white/violet for EMP and amber/red/white/cyan for mechanical explosion, readable on a dark sci-fi battlefield, intentionally simple and lightweight, production sprite asset not concept art.
  > Composition/framing: exact uniform 6x2 grid filling a 3:1 landscape canvas; equal square slots; one centered self-contained effect per slot; consistent center anchor and progression within each row; generous empty separation and safety padding; no object crosses cell boundaries.
  > Scene/backdrop: perfectly flat uniform solid #ff00ff chroma-key background covering every empty pixel. No transparency simulation, shadows, gradients, texture, glow fog, environment, floor, grid lines, borders, labels, text, numbers, logos, watermark, poster layout, extra rows, extra columns, duplicate sheets, or partially cropped cells. Do not use #ff00ff inside any effect.
  > Constraints: exact 6 columns, exact 2 rows, exact 12 cells; square cell aspect; clear animation at 64x64; EMP remains circular and outward-expanding; explosion remains compact and centered.

### RHEA 관제실 NPC 대화 일러스트

- 생성일: 2026-08-10
- 생성 도구: OpenAI 내장 ImageGen
- 활성 런타임 경로: `public/assets/overload/ui/npcs/rhea-control-officer-v3.webp`
- 규격: 640×640 투명 상반신 대화 일러스트
- 승인 스타일 참조:
  - `reference/source-assets/overload/campaign/haven-npc-portraits-alpha.png`
  - `reference/source-assets/overload/campaign/haven-09-base-imagegen-source.png`
- ImageGen 선택 원본:
  `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-eb7bcb94-7ac1-49f1-b209-19186fcd0db7.png`
- 프로젝트 보존 원본:
  - `reference/source-assets/overload/campaign/rhea-control-officer-imagegen-source.png`
  - `reference/source-assets/overload/campaign/rhea-control-officer-alpha.png`
- 후처리: `remove_chroma_key.py`의 border auto-key, soft matte, despill로 배경을 제거하고
  `scripts/prepare-dialogue-portrait.py`로 인물 전체를 보존한 채 상반신 UI 프레이밍과 투명
  안전 여백을 정규화했습니다.
- 최종 프롬프트:

  > Use case: stylized-concept. Asset type: production transparent upper-body dialogue portrait for the browser game TRAIN ME WRONG: OVERLOAD. References: Image 1 is the approved HAVEN-09 three-NPC portrait atlas and defines the premium realistic-anime rendering, black industrial clothing, crisp transparent portrait edges, cyan/amber accents, and adult character proportions. Image 2 is the approved HAVEN-09 command-base environment and defines the near-black gunmetal, cyan control-room lighting, and restrained amber warning palette. Primary request: create exactly one new adult woman, age 27, named RHEA, HAVEN-09 tactical control officer and first-sortie ability guide. She must be clearly a new person, not a recolor of HANA. Give her an attractive cute-and-confident face, playful slightly mischievous half-smile, one eyebrow subtly raised, warm amber eyes, a short tousled silver-lilac bob with a tiny cyan star hair clip, and an asymmetrical command headset with two slim luminous antenna arcs. Her personality should read as charmingly quirky: one small floating holographic cat-face diagnostic icon perched beside the headset and a stylus held backward in one gloved hand as if she forgot which end to use. Outfit: tasteful fitted adult black tactical control bodysuit, high collar, elegant white cropped command jacket with cyan piping, modest neckline, utility belt edge barely visible, no exposed midriff; stylish, glamorous, cute, and combat-world credible without pin-up exaggeration. Show head, shoulders, chest and upper waist so the portrait can be cropped responsively in tutorial dialogue. Style/medium: premium high-detail realistic anime sci-fi game character illustration, polished production portrait, coherent with the reference atlas, precise facial rendering, clean materials, subtle rim light, readable at UI size. Composition/framing: one centered single character, front-facing three-quarter head turn toward the viewer, upper-body portrait, full hair and both shoulders contained, generous empty safety margin, no crop, no other people. Scene/backdrop: perfectly flat uniform solid #ff00ff chroma-key background for local removal. No shadow, floor, environment, gradient, glow field, smoke, texture, reflection, frame, UI panel, text, labels, logo, watermark, duplicate body, extra arms, or detached props. Do not use #ff00ff in the character. The small cat diagnostic is a compact cyan hologram attached close to the headset silhouette and must remain fully inside the portrait bounds.

RHEA는 첫 일반 출격 전에 자동 레벨업 빌드와 Q/E/F/R 직접 사용 회선을 구분해 설명하며,
이후 HAVEN-09 관제실에서 동일 브리핑을 다시 열 수 있습니다.

### 활성 대사 포트레이트 매핑 — 기존 프로젝트 원본 재사용

- 신규 생성·외부 이미지: 없음
- AEGIS: `public/assets/overload/hero/survivor-portrait-v2.webp`
- RHEA 및 시나리오의 `OPERATOR` 화자:
  `public/assets/overload/ui/npcs/rhea-control-officer-v3.webp`
- HANA: `public/assets/overload/ui/npcs/hana-research-director-v2.webp`
- ILYA: `public/assets/overload/ui/npcs/ilya-mechanic-v4.webp`
- SERA: `public/assets/overload/ui/npcs/sera-nightjar-pilot-v4.webp`
  (`lark`/`LARK` 내부 식별자는 저장·서사 호환용으로만 보존)
- THE WRONG ENGINE: `public/assets/overload/boss/wrong-engine-forms-atlas.png`
- MIRROR TYRANT:
  `public/assets/overload/regions/glass-dune/boss-forms-atlas.png`
- DROWNED ORACLE:
  `public/assets/overload/regions/abyssal-archive/boss-forms-atlas.png`

주인공·관제관·기지 NPC는 위에 기록된 기존 원본만 화자별로 다시 연결합니다. 지역 보스는 선택
지역의 3단계 형상 아틀라스에서 현재 단계 프레임을 사용하고, 해당 대사 패널과 보스 단계가 필요할
때만 마운트합니다. 이 매핑을 위해 별도의 NPC 일러스트를 새로 만들거나 외부 이미지를 추가하지
않았습니다.

### 초반 스킬 가이드 실전 예시 이미지

- 생성일: 2026-08-10
- 출처: 이 프로젝트의 로컬 Phaser 런타임을 1440×810에서 직접 캡처한 QA 이미지이며
  외부 게임 이미지나 별도 생성 이미지를 사용하지 않습니다.
- 런타임 경로:
  - `public/assets/overload/ui/tutorial/emp-pulse-gameplay.jpg`
  - `public/assets/overload/ui/tutorial/aegis-ward-gameplay.jpg`
  - `public/assets/overload/ui/tutorial/stratos-run-gameplay.jpg`
  - `public/assets/overload/ui/tutorial/helix-tempest-gameplay.jpg`
- 원본 경로: 각각 `qa/latest-emp-pulse-desktop-1440x810.png`,
  `qa/latest-aegis-ward-desktop-1440x810.png`, `qa/latest-stratos-run-desktop-1440x810.png`,
  `qa/latest-helix-tempest-desktop-1440x810.png`
- 후처리: 각 원본의 `x=180, y=0, width=1080, height=810` 영역을 잘라
  800×600으로 HighQualityBicubic 축소하고 JPEG 품질 88로 저장했습니다. 최종 픽셀 VFX
  브라우저 검증 뒤 같은 프로젝트 런타임 경로의 최신 캡처로 다시 생성합니다.
- React 가이드는 이 이미지 위에 조준점·효과 범위·HUD 슬롯 콜아웃을 DOM으로 배치하며,
  첫 전투에서는 별도 이미지가 아니라 실제 하단 Q/E/F/R 버튼을 직접 스포트라이트합니다.

### PERFORMANCE 저메모리 파생 에셋

- 생성일: 2026-08-10
- 생성 도구: `scripts/build-performance-assets.py`, Python Pillow(PIL)
- 원본: 이 문서에 기록된 프로젝트 원본 런타임 에셋만 사용
- 런타임 경로: 각 원본 디렉터리 아래 `performance/` 폴더
- 처리 방식:
  - 모션/효과 아틀라스는 각 셀을 먼저 분리한 뒤 PIL LANCZOS로 50% 또는 75% 축소하고
    원래와 같은 행·열 순서로 다시 합성해 인접 프레임 번짐을 방지합니다.
  - 일반 전장·보스방 WebP는 50%로 축소해 WebP quality 82/method 6으로 저장합니다.
  - PNG는 optimize/compress level 9로 저장합니다.
- 파생 대상: AEGIS 8×9 모션, 적 3종 6×4 모션, 동료 3종 5×4 모션, 지역 보스 3종
  6×4 모션, 보스 3×1 폼, 전투 VFX, 전송 게이트, 회복 키트, 아군 흔적, WRONG ENGINE의
  세 루트 섹터와 보스방, GLASS DUNE/ABYSSAL ARCHIVE의 루트와 보스방
- 런타임 계약: `src/game/assets/manifest.ts`의 `performancePath`가 원본과 동일한 texture key와
  atlas grid를 유지하며, Phaser 시작 시 PERFORMANCE 프로필이 선택된 경우에만 로드합니다.
  한 인스턴스에서 원본과 파생본을 동시에 디코딩하지 않습니다.
- 생성 프롬프트: 없음
- ImageGen/외부 이미지: 사용하지 않음. 새 미술이 아니라 프로젝트 원본의 결정론적 저메모리
  파생본이므로 원본 제작 기록과 라이선스를 그대로 따릅니다.

### Legacy dedicated OVERLOAD arena (inactive runtime removed)

- 생성일: 2026-08-09
- 생성 도구: OpenAI 내장 ImageGen
- 과거 런타임 경로: `public/assets/survivor/swarm-arena.png` (현재 production에서 삭제)
- 고해상도 원본: `reference/source-assets/public/assets/survivor/swarm-arena-source.png`
- 용도: 단일 캐릭터 물량전과 보스전을 모두 수용하는 전용 오픈 아레나
- 주요 프롬프트:

  > Strict orthographic 90-degree top-down, 16:9 dark industrial circular combat arena; huge unobstructed traversable center; four entry ramps; cyan concentric lane markings; red hazard perimeter; boss summoning seal in the upper-right; bulky scenery only outside the playable perimeter; no characters, UI, or text; photoreal game-ready texture; near-black steel, cyan, red, and amber palette.

프롬프트에서 대형 구조물을 플레이 경계 밖으로 제한해 시각적 통로와 실제 이동 경로가
일치하도록 설계했습니다. 고해상도 생성본은 출처 보존용으로 유지하고, 런타임 사본은 브라우저
표시 크기에 맞춰 최적화했습니다.

### Legacy enemies, boss, and support equipment (inactive runtime removed)

아래 경로는 이전 아레나 런타임의 제작 기록입니다. 활성 매니페스트에서 분리한 뒤 production
용량 절감을 위해 파일을 삭제했으며, 생성 원본은 `reference/source-assets/`에 보존합니다.

- `public/assets/survivor/hunter.png`
  - 빠르게 거리를 좁히는 4족 근접 추적 드론.
- `public/assets/survivor/suppressor.png`
  - 원거리에서 사격 압박을 가하는 코일 라이플 기체.
- `public/assets/survivor/brute.png`
  - 방패와 충격포를 장비한 중장갑 돌파 기체.
- `public/assets/survivor/bosses/wrong-engine.png`
  - 방사 탄막·스윕·지연 폭발·확장 링·돌진 텔레그래프와 3초간 실제 2배 피해를 받는
    코어 노출 단계를 가진 거대 생체 기계 보스
    `THE WRONG ENGINE`.
  - 주요 프롬프트: 상부 3/4 시점의 원형 장갑 실루엣, 네 개의 비대칭 기계 팔, 중앙 반응로
    눈, 흑철·백색 장갑·적색 경고등, 시안·호박·청보라·에메랄드 도관, 작은 화면에서도
    읽히는 굵은 실루엣, 텍스트·UI·그림자 제외, 균일한 크로마키 배경.
- `public/assets/survivor/skills/sentry.png`
  - 흑철 원형 기부, 호박색 쌍열 에너지 포신, 시안 조준 렌즈를 가진 센트리.
- `public/assets/survivor/skills/emp-pylon.png`
  - 육각 기부와 보라색 전자기 코일, 호박색 안정판, 시안 축전기를 가진 EMP 파일런.
- `public/assets/survivor/skills/wingman-drone.png`
  - 흑철 가오리형 동체, 보라색 코어와 시안 센서를 가진 전투 보조 드론.

캐릭터 공통 프롬프트 조건은 실제 90도 상부 시점, 동쪽을 향하는 단일 배우, 전술 게임에서
작은 크기로 읽히는 실루엣, 균일한 크로마키 배경, 그림자·UI·텍스트 제외입니다. 지원 장비는
균일 배경 위에 단일 개체로 생성하고, 근흑색 산업 금속·호박·시안·보라색 발광부, 넉넉한
패딩, 그림자와 바닥면 제외를 지시했습니다. 생성 원본은 프로젝트의 크로마키 제거 도구로
투명 PNG화했습니다. 런타임 사본은 표시 크기에 맞춘 premultiplied-alpha Lanczos PNG로
최적화했으며 전체 해상도 원본은 `reference/source-assets/`에 보존합니다.

### Legacy three-form boss and combat VFX atlases (inactive runtime removed)

- 생성일: 2026-08-09
- 생성 도구: OpenAI 내장 ImageGen
- 런타임 경로:
  - `public/assets/survivor/bosses/wrong-engine-phase2.png`
  - `public/assets/survivor/bosses/wrong-engine-phase3.png`
  - `public/assets/survivor/vfx/boss-pattern-atlas.png`
  - `public/assets/survivor/vfx/player-ordnance-atlas.png`
- 크로마키 원본: 동일한 하위 구조의 `reference/source-assets/public/assets/survivor/` 경로
- 후처리: 내장 ImageGen의 균일한 `#ff00ff` 또는 `#00ff00` 배경을 프로젝트 크로마키 제거
  도구로 알파 PNG화한 뒤, 보스는 512×512, 보스 패턴은 768×512, 플레이어 병기는
  768×768로 축소했습니다.
- 최종 프롬프트 세트:

  > Phase 2: preserve THE WRONG ENGINE's red central reactor, ivory armor, black mechanical frame and radial identity; unfold the outer armor into segmented blades, enlarge weapon pods, expose amber cooling vents and internal mechanisms; one centered top-down three-quarter game sprite on a perfectly flat magenta chroma-key background; no shadow, floor, text or watermark.

  > Phase 3: evolve the same machine into a catastrophic overclocked form with three concentric white-hot reactor rings, retracted and fractured armor, longer weapon limbs, rail barrels, charge blades and molten red-orange energy veins; preserve the radial identity; one centered isolated sprite on flat magenta chroma key; no smoke, loose particles, shadow, text or watermark.

  > Boss pattern atlas: exactly six isolated sprites in a 3×2 atlas—radial plasma saw orb, sweep laser blade, reactor bomb, segmented shock-ring shard, charge drill spear and triple multi-charge lance—in the boss's ivory/black/red industrial style; uniform green chroma key, no grid lines, text, shadow or extra objects.

  > Player ordnance atlas: exactly nine isolated sprites in a 3×3 atlas—pulse bolt, scatter shard, rail lance, guided rocket, orbit blade, arc capacitor, zero-point nova reactor, airstrike missile and omega laser cannon—in the player's ivory/black/cyan style; uniform magenta chroma key, no grid lines, text, shadow or extra objects.

보스 단계 이미지는 체력 70%와 38% 변환에 직접 연결됩니다. 두 아틀라스는 캔버스가 셀 좌표를
잘라 투사체, 텔레그래프, 궤도 칼날, 공중 폭격, 노바와 오메가 레이저에 사용하며 외부 에셋은
포함하지 않습니다.

### Legacy authored combat-motion atlases (inactive runtime removed)

- 생성일: 2026-08-09
- 생성 도구: OpenAI 내장 ImageGen
- 런타임 경로:
  - `public/assets/survivor/animation/enemy-motion-atlas.png`
  - `public/assets/survivor/animation/boss-motion-atlas.png`
- 크로마키 생성 원본:
  - `reference/source-assets/public/assets/survivor/animation/enemy-motion-atlas-chroma.png`
  - `reference/source-assets/public/assets/survivor/animation/boss-motion-atlas-chroma.png`
- 후처리: 균일한 `#00ff00` 또는 `#ff00ff` 배경을 프로젝트 크로마키 제거 도구의
  soft-matte/despill 단계로 투명화하고, 보스는 960×576, 적은 960×640 런타임
  PNG로 축소했습니다.
- 최종 프롬프트 세트:

  > Enemy motion atlas: preserve the supplied HUNTER, SUPPRESSOR and BRUTE designs exactly in three rows, fixed east-facing orthographic top-down silhouettes and consistent pivots. Use five columns per row: locomotion A, locomotion B, attack wind-up, attack/fire release and hit-stun. Perfectly flat green chroma-key background; no grid, text, shadow, floor, projectiles or extra units.

  > Boss motion atlas: preserve the supplied three THE WRONG ENGINE forms exactly in rows 1–3, with their radial body, central reactor and phase-specific armor. Use five columns: idle, attack anticipation, core charge, attack release and hit-stagger. Keep a consistent centered pivot and top-down three-quarter game view on a perfectly flat magenta chroma-key background; no grid, text, shadow, floor, loose VFX or extra objects.

이 레거시 아틀라스는 현재 런타임에서 로드하지 않습니다. 활성 게임은 위의
`public/assets/overload/` 탑다운 아틀라스를 엔진 이동·공격·피격·보스 단계 상태에 연결하며,
외부 게임 애니메이션은 포함하지 않습니다.

## Campaign flight map and command-button states v2

- 생성일: 2026-08-10
- 생성 도구: OpenAI 내장 ImageGen
- 런타임 경로:
  - `public/assets/overload/campaign/airship-region-map-v2.webp`
  - `public/assets/overload/ui/buttons/command-button-states-atlas.png`
- 생성 원본:
  - `reference/source-assets/overload/campaign/region-map-v2/airship-region-map-v2-imagegen.png`
  - `reference/source-assets/overload/ui/button-states-v1/command-button-states-chroma.png`
  - `reference/source-assets/overload/ui/button-states-v1/command-button-states-alpha.png`
- ImageGen 원본 경로:
  - `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-cda2b2fa-cb64-47e8-ba2c-52eeb9a27463.png`
  - `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-d99ea63f-c855-4a82-96b7-9155f2982cad.png`
- 후처리:
  - 지도는 `scripts/prepare-campaign-map.py`로 1920×1080 WebP quality 86으로 정규화했습니다.
  - 버튼은 설치된 `remove_chroma_key.py`의 border auto-key, soft-matte, despill로 투명화한 뒤
    `scripts/normalize-ui-button-atlas.py --fit stretch --padding 8`로 3×1, 셀 512×160의 동일 크기
    상태 아틀라스로 정규화했습니다. 각 상태의 투명 외곽을 먼저 자른 뒤 셀 안전 경계까지 채워,
    서로 다른 DOM 버튼 비율에서도 테두리와 모서리가 중앙에 끊겨 보이지 않게 했습니다.
- 최종 프롬프트 — 비행 관제 지도:

  > Use case: precise-object-edit
  > Asset type: production campaign region-selection background for the Phaser browser game TRAIN ME WRONG: OVERLOAD.
  > Input images: Image 1 is the approved three-region tactical map and the edit target.
  > Primary request: preserve the exact wide cockpit-window composition and the three clearly separated destinations: left rain-soaked cyan ruined megacity, center amber glass desert and solar dome, right deep-blue flooded abyssal city. Increase local environmental detail and depth in all three regions without changing their positions. Replace only the small old-fashioned blimp at the lower center with NIGHTJAR, a cutting-edge futuristic stealth airship: low-profile angular flying-wing silhouette, black gunmetal armor, swept forward fins, compact cyan vector thrusters, subtle white-blue navigation lights, no balloon, no zeppelin body, no exposed propellers. Make the ship visibly larger and more readable than the old blimp while keeping it below the three destination sightlines.
  > Style/medium: high-detail cinematic dark sci-fi game environment concept art, consistent with the input image.
  > Composition/framing: exact 16:9 wide tactical-map composition; cockpit frame preserved; three regions remain left/center/right; NIGHTJAR centered in the lower quarter on the route junction.
  > Lighting/mood: storm-dark command center, cyan/amber/deep-blue regional color coding, restrained luminous route traces.
  > Constraints: preserve the three-region geography, cockpit frame, horizon, camera and route-junction layout; change the aircraft design and refine environmental detail; no text, labels, UI cards, logos, watermark, extra aircraft, characters, grid lines, borders, or cropped destinations.
  > Avoid: blimp, zeppelin, dirigible, balloon, retro aircraft, rounded cigar fuselage, toy-like craft.

- 최종 프롬프트 — 전용 버튼 3상태:

  > Use case: stylized-concept
  > Asset type: production three-state button background atlas for TRAIN ME WRONG: OVERLOAD campaign UI.
  > Primary request: create one exact 3-column by 1-row spritesheet containing three isolated, identical-size, wide futuristic command-button panels with no text. Column 1 normal state: dark gunmetal glass panel with restrained cyan edge light. Column 2 hover/focus state: same exact silhouette and proportions with brighter cyan-white perimeter, active corner nodes and a subtle energy sweep. Column 3 pressed/confirmed state: same exact silhouette and proportions, slightly compressed inner plate with bright cyan core line and restrained amber confirmation nodes. Every panel must be a complete wide button background suitable for Korean DOM text placed over it.
  > Style/medium: high-end dark sci-fi game UI asset, crisp hard-surface panels, angular chamfered corners, fine circuit engraving, black gunmetal, smoked glass, cyan-white light, very small amber accents.
  > Composition/framing: exact 3 equal columns by 1 row; one centered 4:1 wide panel per cell; consistent scale, anchor and padding; panels fill most of each cell but never cross boundaries.
  > Scene/backdrop: perfectly flat uniform solid #ff00ff chroma-key background across every empty pixel for local removal.
  > Constraints: exact three cells, exact one row, no text, letters, numbers, icons, arrows, logos, watermark, scenery, shadows, floor, gradients or texture in the background; no part crosses a cell boundary; do not use #ff00ff in the button panels.
  > Avoid: rounded mobile pill buttons, fantasy ornament, gold frames, white cards, dashboard widgets, extra rows, extra columns.

두 자산 모두 프로젝트의 기존 승인 이미지를 편집 또는 스타일 기준으로 사용했으며 외부 게임 이미지는
포함하지 않습니다. 버튼 텍스트와 아이콘은 접근 가능한 DOM 요소로 별도 렌더링됩니다.

## Boss mechanic pixel VFX atlases (2026-08-10)

- 생성 도구: OpenAI 내장 ImageGen
- 런타임 경로:
  - `public/assets/overload/vfx/pixel/boss-pattern-common-pixel-atlas.png`
  - `public/assets/overload/vfx/pixel/boss-pattern-regional-pixel-atlas.png`
- 생성·알파 원본:
  - `reference/source-assets/overload/vfx/boss-pattern-pixel-v1/common-boss-patterns-imagegen.png`
  - `reference/source-assets/overload/vfx/boss-pattern-pixel-v1/common-boss-patterns-alpha.png`
  - `reference/source-assets/overload/vfx/boss-pattern-pixel-v1/regional-boss-patterns-imagegen.png`
  - `reference/source-assets/overload/vfx/boss-pattern-pixel-v1/regional-boss-patterns-alpha.png`
- ImageGen 원본 경로:
  - `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-71424306-6085-4a83-bd85-4b2d5442b77a.png`
  - `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-11bb8e5f-f771-497a-8e05-643dc850b802.png`
- QA 미리보기:
  - `qa/boss-pattern-common-pixel-preview.png`
  - `qa/boss-pattern-regional-pixel-preview.png`
- 후처리: 설치된 `remove_chroma_key.py`의 border auto-key, soft matte와 despill로 마젠타를 제거한 뒤
  `scripts/normalize-pixel-vfx-atlas.py`로 셀마다 NEAREST 64px, 최대 32색 팔레트, 2px 안전 경계를
  적용했습니다. 공통 시트는 384×384(6×6), 지역 시트는 384×256(6×4)이며 RGBA8 디코딩 합계는
  983,040 bytes입니다. 도트 모션은 엔진이 소유한 선·원·캡슐·충돌·피해 판정을 대체하지 않습니다.
- 최종 프롬프트 — 공통 보스 패턴:

  > Use case: stylized-concept
  > Asset type: production low-resolution pixel-art boss mechanic VFX spritesheet for the top-down Phaser browser game TRAIN ME WRONG: OVERLOAD.
  > Input images: Image 1 and Image 2 are approved style, palette-density, pixel-cluster, and animation-progression references only. Do not trace, blur, enlarge, downsample, or edit them. Create every boss effect from scratch as authored pixel art.
  > Primary request: create ONE exact 6-column by 6-row spritesheet, exactly 36 isolated square cells, read left-to-right. Each row is one complete six-frame mechanic animation.
  > Row 1 RADIAL VOLLEY: compact hostile red reactor seed, amber warning spokes, locked radial reticle, simultaneous red-white projectile burst, expanded spoke curtain, fading embers.
  > Row 2 SWEEP LASER: compact red emitter seed, amber angular warning wedge, narrow locked direction line, bright white-red beam ignition, rotating cyan-red sweep core, clean shutdown sparks. Keep every frame square and self-contained; never paint a long beam across cells.
  > Row 3 TARGET BOMBS: small amber target bracket, tightening red reticle, locked white crosshair, compact orange-red impact bloom, larger square-pixel explosion, sparse fading debris.
  > Row 4 EXPANDING RINGS: tiny red core, one amber warning ring, two concentric locked rings, bright expanding white-red wave, fragmented outer ring, fading red pixels.
  > Row 5 CHARGE: compact boss-direction arrow seed, dotted amber charge lane token, locked triple chevrons, bright red-white rush streak contained inside the cell, wall-impact pixel star, stunned/fading shards.
  > Row 6 MULTI-CHARGE: one warning chevron, two sequential chevrons, three locked chevrons, rapid red-white multi-rush cluster, heavy wall-impact star, fading stagger sparks. Keep the action readable as repeated rushes without drawing a long vehicle or lane.
  > Style/medium: authentic hand-authored 16-bit arcade pixel VFX, crisp square pixel clusters, hard stair-step edges, no antialiasing, restrained 5-7 color palette per row, dark navy outlines, hostile red/amber/white with restrained cyan highlights, simple and highly readable over dark sci-fi battlefields, production sprites rather than concept art.
  > Composition/framing: exact uniform 6×6 grid filling a square canvas; equal square slots; one centered self-contained effect per slot; stable center and size within each row; generous empty safety separation; nothing crosses cell boundaries.
  > Scene/backdrop: perfectly flat uniform solid #ff00ff chroma-key background covering every empty pixel. No transparency simulation, shadow, gradient, texture, glow fog, environment, floor, grid lines, borders, labels, text, numbers, logos, watermark, poster layout, extra rows, extra columns, duplicate sheets, or cropped cells. Do not use #ff00ff inside an effect.
  > Constraints: exact 6 columns, exact 6 rows, exact 36 square cells; obvious six-frame progression at 64×64; all effects remain compact square modules because authoritative engine Graphics will draw the real full-length collision geometry.

- 최종 프롬프트 — 지역 고유 보스 패턴:

  > Use case: stylized-concept
  > Asset type: production low-resolution pixel-art regional boss mechanic VFX spritesheet for the top-down Phaser browser game TRAIN ME WRONG: OVERLOAD.
  > Input images: Image 1 and Image 2 are approved style, palette-density, pixel-cluster, and animation-progression references only. Do not trace, blur, enlarge, downsample, or edit them. Create every boss effect from scratch as authored pixel art.
  > Primary request: create ONE exact 6-column by 4-row spritesheet, exactly 24 isolated square cells, read left-to-right. Each row is one complete six-frame mechanic animation.
  > Row 1 PRISM LATTICE: tiny cyan prism seed, two crossed cyan light segments, amber-cyan warning diamond, locked white-cyan lattice node, bright crystalline intersection burst, sparse glass-like cyan pixels fading. Keep beams as compact square modules because the engine draws full lanes.
  > Row 2 SOLAR FLARE: tiny amber solar seed, dotted target halo, tightening orange-white reticle, compact solar ignition, larger contained amber-white pixel flare, sparse cooling embers.
  > Row 3 MEMORY SPIRAL: tiny violet memory node, two cyan-violet curved pixel arms, four-arm rotating warning spiral, locked bright spiral core, contained cyan-violet rotation burst, fragmented memory pixels fading.
  > Row 4 DEPTH COLLAPSE: tiny deep-cyan abyss core, broad violet outer warning ring, three inward-stepping cyan-violet rings, bright compressed central ring, contained pressure-collapse burst, sparse dark-violet/cyan fragments.
  > Style/medium: authentic hand-authored 16-bit arcade pixel VFX, crisp square pixel clusters, hard stair-step edges, no antialiasing, restrained 5-7 color palette per row, dark navy outlines. PRISM uses cyan/white with restrained amber; SOLAR uses amber/orange/white; MEMORY and DEPTH use cyan/violet/white. Simple, lightweight, and highly readable over dark sci-fi battlefields; production sprites rather than concept art.
  > Composition/framing: exact uniform 6×4 grid filling a 3:2 landscape canvas; equal square slots; one centered self-contained effect per slot; stable center and size within each row; generous empty safety separation; nothing crosses cell boundaries.
  > Scene/backdrop: perfectly flat uniform solid #ff00ff chroma-key background covering every empty pixel. No transparency simulation, shadow, gradient, texture, glow fog, environment, floor, grid lines, borders, labels, text, numbers, logos, watermark, poster layout, extra rows, extra columns, duplicate sheets, or cropped cells. Do not use #ff00ff inside an effect.
  > Constraints: exact 6 columns, exact 4 rows, exact 24 square cells; obvious six-frame progression at 64×64; all effects remain compact square modules because authoritative engine Graphics will draw the real collision geometry.

두 시트는 프로젝트의 기존 수동·자동 기술 도트 시트를 스타일 기준으로 사용했으며 외부 게임 이미지는
포함하지 않습니다. 보스방 선택 이후에만 Phaser 텍스처로 지연 로드됩니다.

## Original procedural sound

- 외부 효과음 파일을 사용하지 않습니다.
- `src/audio/sfx.js`에서 필터 노이즈, 오실레이터, 다이내믹 컴프레서와 절차적 공간 잔향을
  조합해 상시 자동 기본 사격, 소총수 사격, 저격 경고, 드론 자폭, 금속 피격, 다층 폭발,
  SOVEREIGN 게이트 개방, 적 처치, XP·회복 키트 흡수, 레벨업, 대시, 보스 진입,
  위험 텔레그래프와 약점 노출 효과음을 실시간 합성합니다.
- 여성 캐릭터 피격 음성은 외부 파일 없이 신뢰할 수 있는 사람 음질로 합성할 수 없어 현재 포함하지
  않습니다. 사용자 제공 또는 생성 권리가 명확한 짧은 mono WAV/OGG 변형을 받으면 기존 전체
  사운드 토글과 동시 음성 제한에 연결할 수 있습니다.
- 캐릭터 대사는 텍스트와 화자별 일러스트로만 제공하며 브라우저 음성 합성·음성 복제는 포함하지
  않습니다. 사용자가 이후 요청한 Q/E/F/R 탑재 AI 한국어 안내만 Google Cloud Chirp 3 HD의 정적
  MP3 생성 대상으로 분리했으며, ADC 인증과 실제 파일 생성 전에는 런타임에 연결하지 않습니다.

## Legacy project originals

`reference/source-assets/` 아래의 미사용 이미지도 이 프로젝트의 이전 개발 과정에서 제작한
원본입니다. 현재 게임에서는 로드하지 않으며 제작 기록을 위해 보관하고 production build에는
포함하지 않습니다.

## User-provided regional sortie cinematics

- 출처: 프로젝트 사용자가 직접 제공한 MP4 영상 3편. ImageGen, 외부 게임 영상, 추가 생성 프롬프트,
  재인코딩 또는 프레임 편집을 사용하지 않았습니다.
- 공통 메타데이터: 1264×720, 24fps, 브라우저 보고 재생 시간 6.041667초.
- 원본 → 런타임 경로:
  - 사용자 제공 원본 `1구역 비행선 출격 연출.mp4` →
    `public/assets/overload/campaign/sortie/wrong-engine-sortie.mp4`
  - 사용자 제공 원본 `2구역 비행선 출격 연출.mp4` →
    `public/assets/overload/campaign/sortie/glass-dune-sortie.mp4`
  - 사용자 제공 원본 `3구역 비행선 출격 연출.mp4` →
    `public/assets/overload/campaign/sortie/abyssal-archive-sortie.mp4`
- SHA-256:
  - WRONG ENGINE: `86A4720037F2ABD510665D2761E03350891382DA25E9429EBEDF4FDF10AB4952`
  - GLASS DUNE: `CBB610F27D332938B910341CB3BD4055580203D1F125F6C6E6017B437BCC610F`
  - ABYSSAL ARCHIVE: `3C20BFB5DB6E941A03CA0CED7CF54F9B35514F424CEC6468B3A0BE1E2D7D3716`
- 세 런타임 파일은 원본과 byte-identical한 이름 변경 사본입니다. 지역 선택 전에는 내려받지 않고,
  선택한 한 편만 `preload="auto"`로 마운트합니다. 영상이 재생되는 동안 선택 지역 Phaser 전투를
  숨김·일시정지 상태로 준비하고, 미디어와 런타임이 모두 준비되면 같은 인스턴스를 공개합니다.
  기지 BGM은 재생 중 일시 정지하며 전체 사운드 토글이 꺼져 있으면 영상도 음소거됩니다.

## Main background music

> **아래 BGM 5곡 공통 · 제출 전 권리 증빙 필요:** 제작 브리프와 파일 해시는 기록됐지만,
> 현재 저장소에는 Suno 제작 계정·이용 플랜, 제작일 당시 약관, 상업적 공개 허용 범위를
> 증명하는 자료가 없습니다. 채용 포트폴리오 외부 제출 전 해당 증빙을 첨부하거나 증빙할 수 없는
> BGM을 제거·교체해야 합니다.

- 파일: `public/assets/audio/overload-main-theme.mp3`
- 원본 파일명: `300 드론 생존전.mp3`
- 재생 시간: 약 59.9초, 1구역 오답 엔진 중앙로 전투 중에만 반복 재생
- 출처: 프로젝트 사용자가 직접 제공한 외부 제작 음원
- 적용: 1구역 출격 영상 종료 뒤 재생하고 다른 지역·기지·타이틀에서는 사용하지 않으며 전체 사운드
  토글과 연동

## User-provided title background music

- 원본: 사용자 제공 `잿빛 하늘 아래.mp3`
- 런타임: `public/assets/audio/under-ashen-skies-title.mp3`
- 메타데이터: 약 59초, 199kbps, 1,510,724 bytes
- SHA-256: `D6CECF9EEBC1A0061D843E6A446CFE0EDA728CB7D9678FCC5A499FE81F4A27BB`
- 출처: 프로젝트 사용자가 직접 제공한 외부 제작 음원. 런타임 파일은 재인코딩·편집 없이 원본과
  byte-identical한 이름 변경 사본입니다.
- 적용: 타이틀 화면에서만 metadata-only로 불러와 반복 재생합니다. 브라우저 자동 재생 정책이
  막으면 타이틀의 명시적 음악 버튼이 같은 트랙을 시작하며, 화면을 벗어나면 정지합니다.

## User-provided base and regional background music

- 헤이븐-09 로비: 원본 `Last Light in Haven-09.mp3` → 런타임
  `public/assets/audio/last-light-in-haven-09.mp3`, 3,778,159 bytes,
  브라우저 재생 길이 159.4135초,
  SHA-256 `78B56D8BDE8A0E464213508488C237B850855B8194DC3B8054261807A46AF091`.
- 2구역 유리 사구: 원본 `2구역_Refraction War.mp3` → 런타임
  `public/assets/audio/refraction-war-glass-dune.mp3`, 1,374,864 bytes,
  브라우저 재생 길이 59.8135초,
  SHA-256 `3C3D87A9B5A2516615B46D0D0B7B2C139860CBAEFC0D20ADA3340C2A4DC0D874`.
- 3구역 심해 기록고: 원본 `3구역_Memory Below Pressure.mp3` → 런타임
  `public/assets/audio/memory-below-pressure-abyssal-archive.mp3`, 1,417,582 bytes,
  브라우저 재생 길이 59.8135초,
  SHA-256 `8D483B6CD68D8DB96A117741A205EC55DD4C7DB93B76586D6652C22E1E53BFCE`.
- 세 런타임 파일은 사용자가 제공한 원본의 byte-identical 이름 변경 사본이며 재인코딩·편집하지
  않았습니다. `SUNO_BGM_PROMPTS.md`에는 제작 브리프와 최종 적용 슬롯을 함께 보존합니다.

## Google Cloud AI-agent callouts

- 도구: Google Cloud Text-to-Speech REST v1, `ko-KR-Chirp3-HD-Kore`, MP3 출력,
  `speakingRate: 1.3`.
- 생성 프로젝트·일자: `uptime402-hack-260803`, 2026-08-10. Cloud Shell의 일시 접근 토큰으로
  최초 합성했고, 한국어 교체본은 서명 검증한 Google Cloud CLI 579.0.0의 로컬 ADC로 개발 단계에서
  합성했습니다. 인증 토큰·키·계정 설정 파일은 저장소에 포함하지 않습니다.
- 범위: Q EMP PULSE, E AEGIS WARD, F STRATOS RUN, R HELIX TEMPEST가 실제로 성공했을 때 재생할
  짧은 한국어 시스템 안내 4개. 전체 대사 TTS나 주인공 음성 복제에는 사용하지 않습니다.
- 확정 대사: Q `EMP 전개.`, E `방벽 전개.`, F `지원 폭격 개시.`, R `섬멸 모드 개시.`
  Q·E·F는 발음 늘어짐과 입력 응답 지연을 줄이기 위해 2026-08-12에 더 짧은 한국어 전투
  관제형으로 재합성했습니다. 효과 설명은 전투 중 음성 겹침을 줄이기 위해 넣지 않습니다.
- 대사·출력 파일·공식 인증 절차는 `GOOGLE_TTS_SETUP.md`와
  `scripts/generate-google-agent-voice.mjs`에 고정했습니다.
- 런타임 파일:
  - `public/assets/audio/agent/emp-pulse-start.mp3` — 4,800 bytes — SHA-256
    `f17caa8477a6e53672b328f265e958b933859778913a9420bf4d44151256fddc`
  - `public/assets/audio/agent/aegis-ward-start.mp3` — 3,072 bytes — SHA-256
    `9eeda8a260be74f9c451cc0df506c16766f1e16c4a2d0b14db9c0c4151bb49b8`
  - `public/assets/audio/agent/stratos-run-v2.mp3` — 5,184 bytes — SHA-256
    `f4918e52845e2bcf8587cacbdf5ff04b10fcb77a609aa673d731fe5b379affe1`
  - `public/assets/audio/agent/helix-tempest-start.mp3` — 0.912초, 3,648 bytes — SHA-256
    `3e6ea9f10e7fba611790802ace128fccefd54f8e09823d9f4c0a1f07db7ab654`
- `src/audio/agentVoice.js`는 전투 진입 시 네 파일에 명시적 `load()`를 요청하고 성공한 스킬 이벤트만 재생합니다.
  브라우저 기본 TTS·런타임 Google API 호출·음성 복제는 사용하지 않습니다.

## AEGIS WARD high-detail hard-light atlas

- 런타임: `public/assets/overload/vfx/manual/aegis-ward-hd-atlas.png`
- 규격: 1152×192 RGBA, 6×1, 192px 정사각 셀. 전개 시드 → 판넬 전개 → 완성 → 안정 펄스 →
  충격 흡수 → 소멸 순서이며 Phaser의 엔진 소유 132-unit 원형 판정을 따라옵니다.
- 도구: OpenAI built-in ImageGen → `remove_chroma_key.py` border auto-key, soft matte,
  threshold 12/220, despill → `scripts/normalize-motion-atlas.py` 6×1/192px 공유 스케일 정규화.
- 선택 원본: `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-f0df133a-4be0-4d04-839f-a5b0a8b4be7d.png`
- 보존 원본: `reference/source-assets/overload/vfx/manual/aegis-ward-hd-chroma.png`
- 알파 원본: `reference/source-assets/overload/vfx/manual/aegis-ward-hd-alpha.png`
- QA 미리보기: `qa/aegis-ward-hd-preview.png`
- 정확한 ImageGen 프롬프트:

```text
Use case: stylized-concept
Asset type: production 2D browser-game VFX sprite atlas for HUMAN OVERRIDE: OVERLOAD
Primary request: Create one exact 6-column by 1-row animation spritesheet for AEGIS WARD, a premium futuristic defensive hard-light shield viewed from a strict orthographic 90-degree overhead camera. Read left to right: 1 compact cyan energy seed and four emitter nodes, 2 hexagonal shield plates unfolding, 3 complete circular layered barrier with bright white-cyan rim, 4 stable barrier with restrained circuit pulse, 5 barrier absorbing an impact with amber-white facets on one side, 6 shield dissolving into clean cyan fragments.
Style/medium: high-detail polished sci-fi game VFX, crisp translucent holographic glass, concentric cyan circuitry, white energy edges, restrained violet accents, readable at small top-down scale, materially richer and smoother than pixel art.
Composition/framing: exact six equal square cells across one landscape canvas; one centered circular shield effect per cell; identical center and scale; generous padding; every effect fully inside its own cell; no crossing cell boundaries.
Scene/backdrop: perfectly flat uniform solid #ff00ff chroma-key background across every empty pixel for local removal.
Constraints: exact 6 columns and 1 row, exactly 6 frames, strict overhead/nadir view, circular player-following shield, no character, no environment, no floor, no shadow, no text, no labels, no grid lines, no borders, no watermark, no motion blur, no extra objects. Do not use #ff00ff anywhere in the shield. The background must have no gradient, texture, light variation, reflection, or shadow.
```

## EMP PULSE high-detail electromagnetic atlas

- 런타임: `public/assets/overload/vfx/manual/emp-pulse-hd-atlas.png`
- 규격: 1152×192 RGBA, 6×1, 192px 정사각 셀. 축전 시드 → 회로 점화 → 파동 확장 →
  최대 교란장 → 신호 분해 → 소멸 순서이며 Phaser의 엔진 소유 EMP 중심·반경을 따라옵니다.
- 도구: OpenAI built-in ImageGen → `remove_chroma_key.py` border auto-key, soft matte,
  threshold 12/220, despill → `scripts/normalize-motion-atlas.py` 6×1/192px 공유 스케일 정규화.
- 선택 원본: `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-3c60a78e-91f5-42ee-b9c1-acc4da122f54.png`
- 보존 원본: `reference/source-assets/overload/vfx/manual/emp-pulse-hd-chroma.png`
- 알파 원본: `reference/source-assets/overload/vfx/manual/emp-pulse-hd-alpha.png`
- QA 미리보기: `qa/emp-pulse-hd-preview.png`
- 기존 `manual-ability-pixel-atlas.png`의 EMP 행은 새 런타임에서 사용하지 않습니다. OMEGA는 신규
  외부 미술 없이 기존 포구·종단 셀과 엔진 geometry 기반 연속 Graphics 광선으로 재구성했습니다.
- 정확한 ImageGen 프롬프트:

```text
Use case: stylized-concept.
Asset type: production high-detail 2D VFX animation atlas for the top-down Phaser browser game HUMAN OVERRIDE: OVERLOAD.

Create ONE exact horizontal sprite strip arranged as exactly 6 equal square cells in a single row (6 columns × 1 row). This is the dedicated EMP PULSE ability used by a futuristic AI-linked combat operative. Strict orthographic 90-degree overhead/nadir presentation in every frame, centered on one stable ground target point. The effect must read instantly as an electromagnetic shutdown pulse, not a gravity vortex, shield dome, fire explosion, laser beam, or magic spell.

Exact left-to-right animation:
1) compact cyan-white capacitor seed with a thin violet circuit ring beginning to energize;
2) four restrained electrical arcs snap outward and a second concentric circuit ring appears;
3) a wide circular EMP wave rapidly expands with segmented cyan-white rings and sparse hexagonal interference fragments;
4) peak electromagnetic disruption field: large clean concentric wavefront, broken circuit glyph fragments, short radial electric arcs, bright but transparent center so actors remain readable;
5) overloaded shutdown beat: outer ring fractures into controlled cyan/violet signal blocks while the center discharges;
6) clean dissipation: faint fragmented ring and a few fading electric motes, no persistent disk.

Style and quality: premium high-detail sci-fi game VFX matching a polished hard-light defensive ability; crisp smooth vector-like energy contours, layered cyan/white/electric-violet light, restrained bloom, clean mechanical circuit motifs, readable on a dark industrial battlefield, strong temporal continuity, stable center and scale, no camera motion. Each frame must be self-contained, fully inside its cell with generous uniform safety padding. No part may cross a cell boundary.

Scene/backdrop: perfectly flat uniform solid #ff00ff chroma-key background covering all empty pixels. No scenery, floor, character, weapon, enemies, shadows, smoke, fire, debris, text, letters, numbers, icons, labels, grid lines, cell borders, watermark, poster layout, duplicate strips, extra rows, or extra columns. Do not use #ff00ff inside the effect. Crisp separated edges with no magenta rim.

Constraints: exact 6 columns, exact 1 row, exact 6 isolated square cells, seamless animation progression, no cropped effect, no cross-cell overflow, no full opaque disk.
```

## Numbered boss timed-bomb pixel atlas

- 런타임: `public/assets/overload/vfx/pixel/timed-bomb-pixel-atlas.png`
- 규격: 384×128 RGBA, 6×2, 64px 정사각 셀, NEAREST 필터. 1행은 비활성/청색 활성/황색 경고/
  적색 위험/해제/정지, 2행은 점화/소형 폭발/중형 폭발/최대 폭발/파편/잔광입니다. 폭탄 번호는
  이미지에 포함하지 않고 엔진의 `order`를 Phaser 텍스트로 그립니다.
- 도구: OpenAI built-in ImageGen whole-sheet 생성 → `remove_chroma_key.py`의 border auto-key,
  soft matte, threshold 12/220, despill → 프로젝트 `normalize-motion-atlas.py` 6×2 공유 스케일 정규화 →
  `normalize-pixel-vfx-atlas.py` 64px/32색/2px 안전 여백. 외부 게임 이미지나 외부 미술은 사용하지
  않았습니다.
- 선택 원본: `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-4b361e8a-950c-4ddb-a7da-594965ede2a3.png`
- 보존 원본: `reference/source-assets/overload/vfx/pixel/timed-bomb-pixel-imagegen-source.png`
- 알파 원본: `reference/source-assets/overload/vfx/pixel/timed-bomb-pixel-alpha.png`
- QA 미리보기: `qa/timed-bomb-pixel-atlas-preview.png`
- 정확한 ImageGen 프롬프트:

```text
Use case: stylized-concept.
Asset type: production low-resolution pixel-art timed-bomb VFX sprite atlas for the top-down Phaser browser game HUMAN OVERRIDE: OVERLOAD.
Primary request: create one exact 6-column by 2-row sprite atlas, exactly 12 isolated square animation cells, read left-to-right.
Row 1 ARMED/DEFUSE SEQUENCE: frame 1 compact dormant circular AI bomb seen from strict 90-degree overhead; frame 2 cyan status pixels activate; frame 3 amber warning segments blink; frame 4 red critical warning segments blink; frame 5 cyan defuse pulse contracts inward; frame 6 disabled dark bomb with a small cyan confirmation spark.
Row 2 EXPLOSION SEQUENCE: frame 1 red ignition spark centered on the bomb; frame 2 compact orange pixel burst; frame 3 larger circular orange-white blast; frame 4 maximum contained circular explosion; frame 5 separated square debris fragments; frame 6 fading dark-red pixel embers.
Style/medium: authentic hand-authored 16-bit arcade pixel art, crisp square pixel clusters, hard stair-step edges, no antialiasing, restrained 6-8 color palette, dark navy/black mechanical shell, cyan safe lights, amber/red danger lights, readable on a dark science-fiction battlefield, intentionally simple and lightweight. Strict orthographic 90-degree top-down view. Stable centered anchor and consistent bomb scale across row 1. Explosion row remains centered.
Composition/framing: exact uniform 6x2 grid filling a 3:1 landscape canvas; equal square slots; one centered self-contained effect per slot; generous empty safety padding; no object crosses a cell boundary. The bomb has no readable number or text because runtime numbers will be drawn separately.
Scene/backdrop: perfectly flat uniform solid #ff00ff chroma-key background covering every empty pixel. No transparency simulation, shadows, gradients, texture, glow fog, environment, floor, grid lines, borders, labels, text, numbers, logos, watermark, poster layout, extra rows, extra columns, duplicate sheets, or cropped cells. Do not use #ff00ff inside the bomb or effects.
Constraints: exact 6 columns, exact 2 rows, exact 12 square cells; native pixel-art appearance; obvious animation progression at 64x64; no letters and no numerals.
```

## AEGIS official character icon

- 런타임 최적화본: `public/assets/overload/hero/aegis-official-icon.webp` — 512×512 RGB WebP,
  Pillow LANCZOS 축소, quality 92.
- ImageGen 보존 원본: `reference/source-assets/overload/hero/aegis-official-icon-imagegen-source.png` —
  1254×1254 RGB PNG.
- 정체성 기준 이미지: `public/assets/overload/hero/survivor-portrait.png`.
- 도구: Codex Desktop 내장 OpenAI ImageGen. 외부 게임 이미지나 제3자 캐릭터 이미지는 사용하지
  않았습니다.
- 원본 생성 경로:
  `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-a345bd90-8519-4f2b-9ce1-2b14243845cf.png`.
- 정확한 ImageGen 프롬프트:

```text
Use case: identity-preserve.
Asset type: official square protagonist character icon for the browser game HUMAN OVERRIDE: OVERLOAD.
Input image: Image 1 is the approved official AEGIS character portrait and the identity reference. Preserve her exact adult character identity: long silver-white hair, side braid and black floral hair ornament, cool gray-blue eyes, pale natural complexion, composed determined expression, black futuristic tactical exosuit, white armored coat lapels, metallic shoulder hardware, and restrained cyan technology accents.
Primary request: create one premium, tightly framed official face icon of AEGIS. Show the crown, full face, neck, and upper shoulders only. Her head and hair should fill about 75 percent of the square while the entire chin remains visible. Use the same slight three-quarter viewer-facing angle as the reference, with direct readable eye contact and a calm, resolute expression. Do not place a weapon in front of her face.
Scene/backdrop: deep near-black futuristic command-interface background with a subtle circular cyan reactor halo, faint cyan particles, and restrained industrial texture; keep the backdrop quiet and uncluttered.
Style/medium: polished high-detail sci-fi anime game key art matching the approved source, crisp facial features and individual silver hair strands, professional official game avatar finish.
Composition/framing: exact 1:1 square, centered face, clean circular-icon-safe composition, strong silhouette, readable at 64px and 128px, no important detail near the outer 8 percent safe margin.
Lighting/mood: cool cyan rim light, soft neutral key light on the face, controlled contrast, calm heroic mood.
Color palette: silver-white, black, graphite, cool cyan, subtle natural skin tones.
Constraints: single character only; preserve face shape, hairstyle, hair ornament, costume identity, proportions, eye color, and source art direction; no text, title, logo, watermark, border, UI labels, extra characters, extra limbs, helmet, headset, weapon across face, cropped chin, distorted eyes, exaggerated makeup, open mouth, pin-up pose, bright background, or busy scenery.
```

## AEGIS beam-sword motion and skill effects

- 런타임 캐릭터 아틀라스: `public/assets/overload/hero/survivor-sword-directional-aim-atlas.png`
  — 1536×576 RGBA, 정확히 8×3, 192×192 셀.
- PERFORMANCE 파생본:
  `public/assets/overload/hero/performance/survivor-sword-directional-aim-atlas.png`
  — 1152×432 RGBA, 정확히 8×3, 144×144 셀.
- 런타임 검기 아틀라스: `public/assets/overload/vfx/pixel/sword-skill-pixel-atlas.png`
  — 384×256 RGBA, 정확히 6×4, 64×64 셀, NEAREST 필터.
- 정체성 기준: 프로젝트 원본
  `public/assets/overload/hero/survivor-directional-aim-atlas.png` 및 기존 프로젝트 전용 도트 VFX.
- 도구: Codex Desktop 내장 OpenAI ImageGen. 외부 게임 이미지나 제3자 에셋은 사용하지
  않았습니다.
- 선택 ImageGen 원본:
  - 첫 빔 소드 포즈 시트:
    `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-219fb4eb-c483-4457-baed-f730687d4b2b.png`
  - 균일 크로마 교정 시트:
    `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-af37a5df-8b6b-4450-88b1-916aa6ae17e4.png`
  - 검기 도트 시트:
    `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-c6588731-a9da-463e-91bb-353b4a72d219.png`
- 로컬 보존 원본:
  - `reference/source-assets/overload/hero/survivor-sword-directional-aim-chroma.png`
  - `reference/source-assets/overload/hero/survivor-sword-directional-aim-alpha.png`
  - `reference/source-assets/overload/vfx/pixel/sword-skill-pixel-atlas-chroma.png`
  - `reference/source-assets/overload/vfx/pixel/sword-skill-pixel-atlas-alpha.png`
- QA 미리보기:
  - `qa/survivor-sword-directional-aim-preview.png`
  - `qa/sword-skill-pixel-atlas-preview.png`
- 후처리:
  `remove_chroma_key.py`로 균일 `#ff00ff` 키를 제거하고, 캐릭터는
  `normalize-overflow-grid-atlas.py --columns 8 --rows 3 --frame-size 192`, 검기는
  `normalize-pixel-vfx-atlas.py --columns 6 --rows 4 --cell-size 64`로 셀 중심과 안전 여백을
  고정했습니다. PERFORMANCE 캐릭터 아틀라스는
  `scripts/build-performance-assets.py`가 셀별 Pillow LANCZOS로 결정론적으로 생성합니다.
- 캐릭터 포즈 1차 정확한 ImageGen 프롬프트:

```text
Use case: precise-object-edit.
Asset type: production top-down 2D browser-game hero motion atlas.
Image 1 is the approved active AEGIS 8-column by 3-row directional atlas. Preserve exactly the same 8×3 layout, transparent canvas proportions, strict 90-degree true-nadir overhead camera, silver-white hair, black tactical exosuit, white split coat tails, cyan accent palette, character scale, center anchor, head always screen-up, feet always screen-down, and generous cell separation.
Primary request: replace only the rifle and rifle-holding arm pose with a sleek one-handed futuristic beam sword: dark gunmetal hilt and bright cyan-white energy blade. No gun remains. Create coherent melee animation progression left-to-right in every row: c1 ready, c2 early slash, c3 mid slash, c4 follow-through, c5 reverse slash, c6 bright heavy sweep, c7 recovery, c8 ready loop. Row 1 aims/slashes toward upper-right, row 2 toward screen-right, row 3 toward lower-right. The whole body remains upright and never rotates; only shoulders, arms, coat tails and sword direction articulate naturally. Keep every sword and effect fully inside its cell.
Style: match the existing polished high-detail sci-fi game sprite exactly. Restrained short cyan blade trail may appear only in c3-c6; no giant effects, no scenery, no labels, no grid lines, no added character, no perspective tilt, no visible front-facing face or chest, no watermark. Transparent background; retain exact 8 columns and 3 rows.
```

- 캐릭터 크로마 교정 정확한 ImageGen 프롬프트:

```text
Use case: precise-object-edit.
Image 1 is the selected AEGIS beam-sword 8×3 motion sheet. Preserve the same character identity, all 24 poses, their exact left-to-right animation order, strict overhead camera, upright body orientation, sword direction per row, scale, and cyan beam-sword design.
Make one production correction: replace the entire checkerboard/white background with one perfectly uniform flat solid #ff00ff chroma-key color. Exactly 8 equal columns by 3 equal rows, one isolated centered character per cell, generous gutters, no character or sword crossing a cell boundary. Keep the sheet landscape and all rows aligned. Do not draw any checker pattern, transparency simulation, grid line, label, number, text, scenery, shadow, glow fog, or watermark. Do not use #ff00ff in the character. Crisp separated edges suitable for local chroma removal.
```

- 검기 도트 시트 정확한 ImageGen 프롬프트:

```text
Use case: stylized-concept.
Asset type: production low-resolution pixel-art melee VFX sprite atlas for the top-down Phaser browser game HUMAN OVERRIDE: OVERLOAD.
Image 1 is a style and palette reference only. Create a new exact 6-column by 4-row atlas, 24 isolated square animation cells, read left-to-right.
Row 1 BASIC BEAM-SWORD SWEEP: compact cyan-white crescent arc grows from ignition to a clean 120-degree slash and dissolves into sparse pixels.
Row 2 CRESCENT WAVE: a sharp horizontal cyan energy blade projectile forms, travels, intensifies, fragments, and fades; each cell remains a compact square module, never one long stretched beam.
Row 3 TITAN EDGE: a cyan-white oversized sword silhouette materializes vertically, expands with a circular shock ring, performs one broad radial sweep, then contracts and disappears.
Row 4 FLASH REND: forward-pointing cyan blade wedge with two parallel afterimage streaks, rapid dash-slash burst, cross-shaped impact, and fading afterimage.
Style: authentic hand-authored 16-bit arcade pixel VFX, crisp square clusters, hard stair-step edges, no antialiasing, restrained cyan/white/blue palette with dark navy outline, highly readable on a dark sci-fi battlefield, simple and lightweight.
Composition: exact 6×4 grid on a 3:2 landscape canvas, one centered effect per equal square cell, consistent anchor and size within each row, generous gutters, nothing crossing cell boundaries.
Backdrop: perfectly flat solid #ff00ff chroma-key background. No gradient, checker pattern, transparency simulation, grid lines, labels, text, numbers, scenery, shadows, watermark, extra rows or columns. Do not use #ff00ff in any effect.
```

## AEGIS 8방향 소총·빔 소드 런타임 아틀라스 (2026-08-12)

- 도구: OpenAI Codex 내장 `image_gen` 전체 시트 생성/정밀 편집, 로컬 Python/Pillow 후처리.
- 정식 행 계약: SOUTH, SOUTHEAST, EAST, NORTHEAST, NORTH, NORTHWEST, WEST, SOUTHWEST.
  SOUTH·하단 대각은 얼굴/전면, NORTH·상단 대각은 뒤통수/후면, EAST/WEST는 측면을 직접 묘사합니다.
  런타임 회전과 좌우 반전은 사용하지 않습니다. 열 0–3은 준비/이동, 열 4–7은 공격입니다.
- ImageGen 원본:
  - 소총 1차: `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-ae076dd5-c375-4a00-a036-b8c2fd3a2973.png`
  - 소총 방향 교정 최종: `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-658f9ee4-0b68-46a4-9839-a4ac5417bb33.png`
  - 빔 소드 1차(과대 검기 때문에 런타임 미사용): `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-d4f92e2d-02dc-4c65-9f22-bd43e63b6e01.png`
  - 빔 소드 교정 최종: `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-3295df39-59c2-4341-8145-bfdbd62a1b8b.png`
- 프로젝트 보존 원본/알파:
  - `reference/source-assets/overload/hero/aegis-eight-direction-rifle-{chroma,alpha}.png`
  - `reference/source-assets/overload/hero/aegis-eight-direction-sword-{chroma,alpha}.png`
- 활성 런타임:
  - `public/assets/overload/hero/survivor-directional-aim-atlas.png` — 1024×1024, 8×8, 128px 셀.
  - `public/assets/overload/hero/survivor-sword-directional-aim-atlas.png` — 1024×1024, 8×8, 128px 셀.
  - `public/assets/overload/hero/performance/survivor-directional-aim-atlas.png` — 768×768, 96px 셀.
  - `public/assets/overload/hero/performance/survivor-sword-directional-aim-atlas.png` — 768×768, 96px 셀.
- QA 프리뷰: `qa/survivor-eight-direction-{rifle,sword}-preview.png`.
- 후처리: ImageGen 도구의 `remove_chroma_key.py --auto-key border --soft-matte
  --transparent-threshold 12 --opaque-threshold 220 --despill --force`,
  `scripts/normalize-overflow-grid-atlas.py --columns 8 --rows 8 --frame-size 128 --padding 8`,
  `scripts/finalize-eight-direction-hero-atlas.py`, `scripts/build-performance-assets.py`.
  최종화 스크립트는 EAST/SOUTHEAST에서 WEST/SOUTHWEST 대응 행을 셀 단위로 고정해 무기 방향과
  프레임 경계를 결정론적으로 보장합니다. 기존 단방향 `survivor-motion-atlas-v2.png`는 활성 런타임에서 삭제했습니다.

### 소총 1차 프롬프트 전문

```text
Use case: identity-preserve.
Asset type: production 2D top-down Phaser character direction-and-action spritesheet for HUMAN OVERRIDE: OVERLOAD.
Input images: Image 1 is the approved current in-game silver-haired AEGIS rifle sprite and defines costume, proportions, cyan rifle, black tactical exosuit, white split coat tails, scale and rendering. Image 2 is identity support for AEGIS's exact silver hair, face, black star hair ornament, pale skin and blue-gray eyes.
Primary request: create ONE exact square spritesheet arranged as exactly 8 equal columns by 8 equal rows, exactly 64 isolated cells. The character rotates through eight authored compass directions; do not reuse one right-facing body and do not mirror an incorrect pose.
Direction contract by row, read top to bottom: row 1 faces screen-down/SOUTH and shows her foreshortened face and front hair beneath the crown; row 2 faces down-right/SOUTHEAST and shows a diagonal front three-quarter side view; row 3 faces screen-right/EAST and shows a true side profile; row 4 faces up-right/NORTHEAST and shows a diagonal rear three-quarter view; row 5 faces screen-up/NORTH and clearly shows the back of her silver head, back armor and coat; row 6 faces up-left/NORTHWEST and shows the opposite diagonal rear view; row 7 faces screen-left/WEST and shows the opposite true side profile; row 8 faces down-left/SOUTHWEST and shows the opposite diagonal front three-quarter view.
Animation contract within every row, read left to right: columns 1-4 are a restrained four-beat locomotion/ready cycle in that exact compass direction; columns 5-8 are shouldered rifle attack beats: ready, small cyan muzzle ignition, restrained recoil, recovery. Rifle buttstock stays seated in her right shoulder, right trigger hand and left support hand remain coherent, and rifle muzzle points in the same compass direction as the body in every cell.
Camera and anatomy: high top-down tactical camera with consistent foreshortening, enough controlled tilt to satisfy directional readability. SOUTH exposes the face, NORTH exposes only the back of the head, EAST/WEST expose side profile, southeast/southwest expose diagonal face-side views, northeast/northwest expose diagonal rear views. Same character height, center pivot and feet anchor in all cells. Hair, coat tails, arms, boots and rifle must be fully contained inside each cell with generous gutters. No whole-body rotation trick baked from one pose; each direction must be an anatomically authored view.
Style/medium: polished realistic-anime sci-fi game sprite, crisp small-scale silhouette, same premium rendering and palette as Image 1, not pixel art, no motion blur.
Scene/backdrop: perfectly flat uniform solid #ff00ff chroma-key background across every empty pixel. No gradients, texture, floor, cast shadow, reflections, scenery, grid lines, borders, labels, text, numbers, UI, watermark, extra characters, detached weapons, duplicated fragments, cropped limbs or cell overflow. Do not use #ff00ff in the character. Exact 8×8 layout and square canvas are mandatory.
```

### 소총 방향 교정 프롬프트 전문

```text
Use case: precise-object-edit.
Asset type: corrected production 8×8 AEGIS rifle direction sheet.
Image 1 is the exact edit target. Preserve its exact square 8 columns × 8 rows, same AEGIS identity, silver hair, face/back/side directional anatomy, costume, scale, center pivot, flat #ff00ff background, gutters and animation timing.
Primary request: correct only the rifle, shoulders and coherent trigger/support hands so the rifle muzzle points in the exact compass direction assigned to each row in every one of that row's eight cells. Row 1 SOUTH: muzzle points straight toward screen-bottom. Row 2 SOUTHEAST: muzzle points diagonally bottom-right. Row 3 EAST: muzzle points straight screen-right. Row 4 NORTHEAST: muzzle points diagonally top-right. Row 5 NORTH: muzzle points straight screen-top while the back of her head remains visible. Row 6 NORTHWEST: muzzle points diagonally top-left. Row 7 WEST: muzzle points straight screen-left. Row 8 SOUTHWEST: muzzle points diagonally bottom-left. Never leave a right-pointing rifle in a north, south, or left row.
Columns 1-4 remain restrained locomotion/ready beats. Columns 5-8 remain rifle ready, small cyan muzzle ignition at the exact weapon tip, restrained recoil, recovery. Buttstock remains seated in her right shoulder and both hands connect naturally in every direction. Keep the muzzle and all body parts inside each cell with generous uniform gutters.
Do not change face visibility: SOUTH and lower diagonals show face; EAST/WEST show side; upper diagonals show rear; NORTH shows back of head. No whole-sheet rotation trick, no detached gun, no bent rifle, no oversized flash, no projectiles, no grid, text, labels, shadow, scene, watermark, cell overflow or extra characters. Perfectly flat uniform #ff00ff background. Exact 8×8 square sheet mandatory.
```

### 빔 소드 1차 프롬프트 전문

```text
Use case: precise-object-edit.
Asset type: production 2D top-down Phaser character direction-and-action spritesheet for HUMAN OVERRIDE: OVERLOAD.
Input images: Image 1 is the exact 8-column × 8-row AEGIS directional production sheet to preserve for layout, identity, body direction, face/back/side visibility, scale, center pivot and costume. Image 2 is the approved cyan beam-sword design and sword grip/action reference. Image 3 supports AEGIS identity only.
Primary request: create the BEAM-SWORD counterpart to Image 1. Keep the exact square 8×8 grid and the exact eight row directions. Replace only the rifle pose and rifle attack actions with a coherent futuristic cyan beam sword held in the dominant hand. Preserve AEGIS identity, silver hair, black star ornament, black tactical exosuit, white split coat tails, anatomy, directional view, scale and center position.
Direction contract by row, top to bottom: SOUTH/front face visible; SOUTHEAST/diagonal front; EAST/side profile; NORTHEAST/diagonal rear; NORTH/back of head and back armor; NORTHWEST/diagonal rear; WEST/side profile; SOUTHWEST/diagonal front. Each weapon and body must point or sweep into that same compass direction.
Animation contract in every row: columns 1-4 are restrained locomotion/guard beats with a compact cyan beam sword; columns 5-8 are one readable sword attack cycle: anticipation, bright sweeping slash, follow-through, guarded recovery. The sword is normal length in ready frames and may extend moderately with cyan energy only in the slash/follow-through frames. No rifle, firearm, muzzle flash, projectile or detached second sword.
Camera and anatomy: same high top-down tactical camera and directional foreshortening as Image 1. SOUTH shows her foreshortened face; NORTH shows only the back of her head; EAST/WEST show side profile; lower diagonals show face-side views; upper diagonals show rear views. Stable feet anchor and body size in every cell. Every blade, hair strand, coat tail and limb stays fully inside its own cell with generous gutters.
Style/medium: polished realistic-anime sci-fi game sprite matching Image 1, crisp at small tactical scale, controlled cyan blade glow, no pixel art, no smear that destroys anatomy.
Scene/backdrop: perfectly flat uniform solid #ff00ff chroma-key background. No gradients, floor, shadow, reflections, scenery, grid lines, borders, labels, text, numbers, UI, watermark, extra characters, cropped limbs, duplicate fragments or cell overflow. Do not use #ff00ff in the character. Exact 8×8 layout and square canvas are mandatory.
```

### 빔 소드 검기 제거·스케일 교정 프롬프트 전문

```text
Use case: precise-object-edit.
Asset type: corrected production 8×8 AEGIS beam-sword direction sheet.
Input images: Image 1 is the exact edit target. Image 2 is the approved 8×8 rifle sheet and defines the required character scale, cell occupancy, center position, gutters and directional anatomy.
Primary request: preserve Image 1's exact 8 columns × 8 rows, same silver-haired AEGIS, same eight row directions and same locomotion/attack timing. Make only this production correction: remove every oversized detached cyan crescent, long trailing arc, slash ribbon, duplicated body fragment and any blade content crossing a cell boundary. Scale each complete AEGIS body to match Image 2's body size and cell occupancy. Keep one compact normal-length cyan beam sword visibly connected to her hand in every cell. In attack columns 5-8, show anticipation, one restrained sword swing pose, short follow-through and guard recovery through body/arm/blade articulation only; no detached effect arc because a separate VFX atlas supplies the slash.
Direction rows remain SOUTH/front face, SOUTHEAST/front diagonal, EAST/side, NORTHEAST/rear diagonal, NORTH/back of head, NORTHWEST/rear diagonal, WEST/side, SOUTHWEST/front diagonal. Do not change or reorder directions.
Cell safety: exactly one centered character per cell; same scale in all 64 cells; full body and blade contained with at least a clear uniform magenta gutter on all four sides. No neighboring-cell contamination, no cropped sword, no tiny actor, no rifle or firearm.
Scene/backdrop: perfectly flat uniform solid #ff00ff. No grid, text, labels, shadow, scenery, watermark or extra objects. Exact square 8×8 sheet mandatory.
```

## 외곽 생산권역 04—06 및 귀환 시네마틱 (2026-08-12)

- 도구: Codex Desktop 내장 OpenAI ImageGen과 로컬 Python/Pillow 후처리. 외부 게임 이미지나
  제3자 에셋은 사용하지 않았습니다.
- 품질/카메라 기준: 프로젝트 원본 `public/assets/overload/regions/glass-dune/route.webp`,
  `public/assets/overload/enemies/hunter.png`, `public/assets/overload/boss/wrong-engine-forms-atlas.png`,
  `public/assets/overload/campaign/haven-09-base.webp`.
- 선택 ImageGen 원본:
  - 네온 주조구 전장: `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-69ddb20a-50b9-4b95-8ad4-f6e45941cf92.png`
  - 폭풍 첨탑 전장: `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-438d2557-f85b-43fa-a1ec-aa656b489ffd.png`
  - 생체 금고 전장: `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-5a333d5d-8fde-4396-9503-57f33b1c2931.png`
  - 네온 주조구 유닛: `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-052e17ea-78ff-4e92-a4ca-fd15fb1190eb.png`
  - 폭풍 첨탑 유닛: `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-3564c293-3e82-45d5-96b7-31e550df4442.png`
  - 생체 금고 유닛: `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-68ed5aed-53b0-498f-9b39-f073de7af9d3.png`
  - 귀환 시네마틱: `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-dcdf0832-f90e-4f2f-885c-26b0ddbd5dc8.png`
- 프로젝트 보존 원본: `reference/source-assets/overload/outer-regions/{neon-foundry,storm-spire,gene-vault}/`
  아래 `route-imagegen.png`, `units-chroma.png`, `units-alpha.png`와
  `reference/source-assets/overload/campaign/return-to-haven-imagegen.png`.
- 활성 런타임: 각 `public/assets/overload/regions/<region>/route.webp`, 4×1
  `enemy-forms-atlas.png`, 3×1 `boss-forms-atlas.png` 및 동일 계약의 `performance/` 파생본,
  공통 `public/assets/overload/campaign/return-to-haven.webp`.
- 후처리: `scripts/prepare-outer-region-assets.py`가 전장을 1920×1080 WebP로 최적화하고,
  크로마 유닛 시트의 연결 성분을 역할 3개·중간 보스 1개·보스 단계 3개로 분리해 256px/512px
  셀로 정규화합니다. `scripts/build-performance-assets.py`가 셀별 LANCZOS 파생본을 만듭니다.
  생체 금고 보스 알파는 `scripts/sanitize-motion-atlas.py`로 셀 경계 잔여물만 제거했습니다.

### 네온 주조구 전장 프롬프트 전문

```text
Use case: identity-preserve.
Asset type: production 2D top-down browser-game battlefield background for HUMAN OVERRIDE: OVERLOAD.
Image 1 is a quality/style reference only: preserve its strict 90-degree overhead gameplay readability, central traversable corridor, richly detailed dark sci-fi materials, and authored environment density. Do not copy its glass-desert geometry.

Create a brand-new 16:9 top-down battlefield for REGION 04, "NEON FOUNDRY / 네온 주조구": a colossal automated AI factory at night, gunmetal assembly decks, molten cyan foundry channels behind safety barriers, orange furnace mouths, articulated robotic cranes, square freight lifts, hazard stripes, and distant production lines. The player route must be a broad continuous horizontal corridor through the middle from left to right, visually and physically readable with no fake openings or impassable-looking floor. Leave the central combat lane free of large objects. At the far right, integrate a massive sealed blast gate that can lead to a boss chamber. Make it distinctly different from ruins, desert, and underwater maps.

No characters, enemies, bosses, UI, text, logos, numbers, fog covering the lane, perspective camera, three-quarter view, circular arena, or watermark. Strict orthographic nadir camera. Seam-friendly left and right edges, high-detail premium game environment, dark navy/gunmetal palette with restrained cyan and molten amber light, strong but readable contrast.
```

### 폭풍 첨탑 전장 프롬프트 전문

```text
Use case: identity-preserve.
Asset type: production 2D top-down browser-game battlefield background for HUMAN OVERRIDE: OVERLOAD.
Image 1 is a quality/style reference only: preserve strict 90-degree overhead gameplay readability, a broad continuous horizontal combat route, authored high-detail environment density, and clear walkable boundaries. Do not copy the glass-desert content.

Create a brand-new 16:9 top-down battlefield for REGION 05, "STORM SPIRE / 폭풍 첨탑": an exposed airborne AI weather-control citadel above thunderclouds, dark titanium flight deck, segmented hexagonal plating, cyan lightning capacitors, violet storm conduits, enormous turbine housings beyond the guard rails, cloud voids and forks of lightning visible outside the safe path. The player route must be a broad continuous horizontal corridor through the middle from left to right, with solid railings making every dangerous drop visually unwalkable. Leave the central lane clear. At far right integrate a sealed angular hangar gate.

No characters, enemies, bosses, UI, text, logos, numbers, perspective camera, circular arena, or watermark. Strict orthographic nadir camera. Seam-friendly left/right edges, premium dark sci-fi game environment, navy/titanium palette with cyan and restrained violet electricity, readable contrast.
```

### 생체 금고 전장 프롬프트 전문

```text
Use case: identity-preserve.
Asset type: production 2D top-down browser-game battlefield background for HUMAN OVERRIDE: OVERLOAD.
Image 1 is a quality/style reference only: preserve strict 90-degree overhead gameplay readability, a broad continuous horizontal combat route, authored high-detail environment density, and clear walkable boundaries. Do not copy the glass-desert content.

Create a brand-new 16:9 top-down battlefield for REGION 06, "GENE VAULT / 생체 금고": a forbidden subterranean AI biofabrication archive, black ceramic laboratory deck invaded by biomechanical ivory ribs, sealed turquoise specimen tanks, emerald diagnostic veins, articulated surgical frames, synthetic roots and translucent containment membranes beyond protective barriers. The player route must be a broad continuous horizontal corridor through the middle from left to right. The lane itself is hard, clean, traversable black composite floor; all organic pits and machinery stay outside solid containment curbs. Leave the central combat lane clear. At far right integrate a tall asymmetric iris gate.

No characters, enemies, bosses, UI, text, logos, numbers, perspective camera, circular arena, gore, blood, or watermark. Strict orthographic nadir camera. Seam-friendly left/right edges, premium dark sci-fi game environment, black/ivory/teal palette with restrained emerald light, readable contrast.
```

### 공통 7셀 유닛 시트 프롬프트 전문

아래 공통 프롬프트 끝에 각 지역 정체성 문단 하나를 그대로 결합해 세 번 실행했습니다.

```text
Use case: identity-preserve.
Asset type: production 2D top-down browser-game unit identity atlas for HUMAN OVERRIDE: OVERLOAD.
Input images are quality, rendering, and strict-overhead references only. Do not copy their circular silhouettes or exact parts.
Create ONE exact horizontal sprite atlas with exactly 7 equal square cells in one row. Strict 90-degree orthographic nadir view in every cell. One isolated centered unit per cell, uniform scale within role class, generous padding, no parts crossing cells.
Cell contract: c1 small fast self-destruct drone; c2 medium humanoid or walker rifle unit with a readable gun; c3 long-range sniper unit with a distinct long weapon; c4 significantly larger elite MIDBOSS; c5 final boss phase 1; c6 the same final boss phase 2 with expanded armor/weapons; c7 the same final boss phase 3 at maximum threat.
The final boss must be decisively non-circular and non-radial, with a recognizable directional body plan. Midboss and final boss must not look like scaled copies of normal enemies.
Perfectly flat solid #ff00ff chroma-key background across every empty pixel. No grid lines, labels, numbers, text, scenery, floor, shadows, particles, motion blur, watermark, or UI. Do not use magenta in any unit. Crisp separated alpha-ready edges.
```

지역별 결합 문단:

```text
REGION 04 NEON FOUNDRY identity: angular industrial construction army, black gunmetal and hazard amber with restrained cyan. Drone is a triangular welding mine. Rifle unit is a two-legged factory enforcer. Sniper is a tall railgun walker. Midboss is a broad four-legged PRESS WARDEN with hydraulic hammer arms. Final boss is FORGE COLOSSUS, a massive upright bipedal furnace-mech with shoulders, legs, arms, and a vertical molten core; phases add asymmetric foundry tools and shoulder cannons, never a circle or starburst. Premium detailed sci-fi game sprite rendering.
```

```text
REGION 05 STORM SPIRE identity: sleek airborne weather-control army, dark titanium with electric cyan and violet. Drone is a delta-wing interceptor. Rifle unit is a hovering winged gun platform. Sniper is a long needle-wing rail glider. Midboss is a large manta-shaped THUNDER MANTA with asymmetric lightning vanes. Final boss is TEMPEST WYRM, a long articulated mechanical sky-serpent with a clear head, segmented spine and tail; phases extend fins, jaws and storm coils, never a circle or starburst. Premium detailed sci-fi game sprite rendering.
```

```text
REGION 06 GENE VAULT identity: elegant biomechanical synthetic army, black ceramic, ivory bone-like armor and teal/emerald energy, no gore. Drone is a four-wing seed predator. Rifle unit is a slim digitigrade synthetic soldier. Sniper is a long-limbed archer organism with a bio-rail weapon. Midboss is a large crab-like CHIMERA CUSTODIAN with unequal claws and six legs. Final boss is PALE ARCHON, a towering quadrupedal biomechanical beast with a distinct head, spine, four legs and long tail; phases grow asymmetric blade limbs and luminous containment organs, never a circle or starburst. Premium detailed sci-fi game sprite rendering.
```

### 헤이븐-09 귀환 시네마틱 프롬프트 전문

```text
Use case: identity-preserve.
Asset type: production 16:9 cinematic background for HUMAN OVERRIDE: OVERLOAD campaign return sequence.
Image 1 is the approved HAVEN-09 home base and NIGHTJAR airship identity reference. Preserve its dark premium sci-fi material language, blue and warm amber lighting, and the same sleek advanced angular airship.

Create a wide cinematic exterior arrival shot: the NIGHTJAR airship returns from battle through a vast armored aperture into HAVEN-09's underground hangar, viewed from a high dramatic but readable angle. The ship approaches from the distant right toward a bright cyan landing corridor at center-left. Huge hangar ribs, docking arms, guidance beacons, mist trails and restrained engine glow establish motion. The base feels inhabited, protected and technologically advanced. Keep the center and lower third clear enough for a Korean mission-complete overlay.

No characters, portraits, enemies, bosses, text, logos, UI, watermark, retro blimp, contemporary aircraft, excessive explosion, or destroyed base. Premium cinematic game key art, dark navy/gunmetal palette, cyan engine light and warm amber dock lights, high contrast, no motion blur obscuring the airship.
```

## 전략 월드맵 및 외곽 생산권역 지도 (2026-08-12)

- 생성 도구: Codex Desktop 내장 OpenAI ImageGen. 외부 게임 이미지나 제3자 에셋은 사용하지 않았습니다.
- 참조: 프로젝트 원본 `public/assets/overload/campaign/airship-region-map-v2.webp`,
  `public/assets/overload/regions/neon-foundry/route.webp`.
- ImageGen 원본:
  - 전략 월드맵: `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-3c8344da-42d7-4012-9e88-e4b4bc008514.png`
  - 외곽 생산권역: `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-9088a701-2723-434e-bf04-b0aad3b22fab.png`
- 프로젝트 보존 원본:
  - `reference/source-assets/overload/campaign/strategic-maps/strategic-world-map-imagegen.png`
  - `reference/source-assets/overload/campaign/strategic-maps/outer-frontier-region-map-imagegen.png`
- 런타임:
  - `public/assets/overload/campaign/strategic-world-map.webp`
  - `public/assets/overload/campaign/outer-frontier-region-map.webp`
- 후처리: `scripts/prepare-campaign-map-assets.py`가 선택 원본을 Pillow LANCZOS로 1920×1080에 맞춘 뒤 WebP quality 88로 저장합니다.

### 전략 월드맵 프롬프트 전문

```text
Use case: stylized-concept.
Asset type: full-screen production world-map background for the browser game HUMAN OVERRIDE: OVERLOAD.
Input image: Image 1 is the approved game visual reference. Preserve its dark high-detail cybernetic, top-down holographic command-map art direction, cyan route lighting, amber industrial accents, black gunmetal surfaces, and oppressive AI-occupied world.
Primary request: create one expansive strategic world map viewed from high altitude, not a cockpit window and not three side-by-side panels. Show a single continuous devastated continent/ocean network with six distinct readable destination zones connected by thin luminous cyan flight routes. The left/lower inner network contains three visual landmarks: a black vertical megacity/core, an amber glass desert crater, and a blue abyssal ocean archive. The right/upper outer production frontier contains three different landmarks: an orange neon foundry complex, a violent electric storm spire, and a pale green biomechanical gene vault. Leave generous dark negative space around each landmark so HTML map hotspot buttons can be placed over them. Include a dim far-orbit region at the top edge as a future locked destination. A small sleek triangular NIGHTJAR aircraft marker may sit near the bottom center.
Composition/framing: 16:9 landscape, exact straight top-down/orthographic strategic-map perspective, continuous geography, landmarks distributed at roughly x 22% y 60%, x 39% y 45%, x 29% y 27%, x 63% y 62%, x 76% y 42%, x 68% y 22%; center and edges remain usable for responsive UI.
Style/medium: polished high-end sci-fi game key art, detailed but readable at 1440×810, holographic terrain boundaries and subtle grid, no photoreal cockpit frame.
Lighting/mood: midnight blue-black world, cyan navigation lines, selective amber/orange and toxic pale-green regional glow.
Constraints: no cards, no panels, no UI buttons, no labels, no text, no numbers, no logos, no watermark, no character portraits, no giant ship obscuring the map, no split-screen seams. The six zones must read as locations on one wide world map.
```

### 외곽 생산권역 04—06 프롬프트 전문

```text
Use case: stylized-concept.
Asset type: production region-detail selection background for HUMAN OVERRIDE: OVERLOAD sectors 04–06.
Input images: Image 1 is the approved overall strategic world-map style; Image 2 is the approved NEON FOUNDRY industrial environment style. Preserve the game's black gunmetal, cyan navigation light, dense machine detail, top-down high-altitude command-map language.
Primary request: create a wide high-altitude tactical panorama dedicated only to the OUTER PRODUCTION FRONTIER. It must contain three separated destination biomes in one continuous region: left is NEON FOUNDRY, a molten orange automated forge city with rectangular reactors and robot assembly lines; center is STORM SPIRE, a towering dark antenna citadel surrounded by violent cyan-violet lightning and turbine rings; right is GENE VAULT, a pale toxic-green biomechanical circular research complex with sealed organic pods. Connect all three with thin cyan flight routes and small landing nodes. Leave wide dark safe zones centered over each biome for three HTML region buttons/cards to remain readable.
Composition/framing: 16:9 landscape, high-altitude oblique/top-down strategic panorama, three destination areas distributed evenly left/center/right but organically connected, no cockpit, no panel dividers, no seams.
Style/medium: polished high-end sci-fi game environment key art, intricate machine surfaces, readable silhouettes, matching the existing HUMAN OVERRIDE visual identity.
Lighting/mood: dark industrial night; orange left, electric cyan-violet center, pale green right; strong local glow but a dark overall value range for UI legibility.
Constraints: no UI, no cards, no labels, no text, no numbers, no logos, no watermark, no people, no large aircraft, no split screen, no duplicated location. This is a clean background image behind interactive DOM elements.
```

## 후반 공성 워커 유닛 (2026-08-15)

- 생성 도구: Codex Desktop 내장 OpenAI ImageGen. 외부 게임 이미지나 제3자 에셋은 사용하지 않았습니다.
- 스타일/시트 참조: 프로젝트 원본 적 모션 아틀라스 `public/assets/overload/enemies/motion-v2/`.
- 선택 ImageGen 원본: `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-34b888f1-5c6b-46ad-ae2b-849668811297.png`.
- 프로젝트 보존 원본: `reference/source-assets/overload/enemies/siege-walker-motion-atlas-{chroma,alpha}.png`.
- 활성 런타임: `public/assets/overload/enemies/motion-v3/siege-walker-motion-atlas.png` 및
  `public/assets/overload/enemies/motion-v3/performance/siege-walker-motion-atlas.png`.
- 후처리: `remove_chroma_key.py`로 배경을 제거하고 `normalize-motion-atlas.py`로 6×4·192px 셀에
  중심/스케일을 정규화했습니다. PERFORMANCE본은 `scripts/build-performance-assets.py`가 셀별
  LANCZOS 75% 축소로 생성합니다.

### 공성 워커 프롬프트 전문

```text
Use case: identity-preserve.
Asset type: production top-down Phaser enemy motion sprite atlas for HUMAN OVERRIDE: OVERLOAD.
Input image: Image 1 is the approved enemy rendering style and 6x4 motion-sheet layout reference only. Create a new, clearly different late-wave GIANT SIEGE WALKER unit.
Primary request: one exact 6-column by 4-row atlas, 24 isolated frames, on a 3:2 landscape canvas. Strict 90-degree true-nadir overhead view in every cell. The unit is an enormous bipedal combat robot, black gunmetal and dark ceramic armor, broad shoulders, massive legs, a compact torso, red hostile sensors, one heavy rotary cannon arm and one armored crushing fist. It must read much larger and heavier than ordinary drones while remaining fully inside every cell.
Rows: row 1 heavy walk/advance across six beats; row 2 cannon windup, firing, recoil, recovery; row 3 armor hit, stagger, enraged red-overheat pulses; row 4 shutdown and explosive destruction across six progressive frames.
Style/medium: the same polished dark sci-fi game-sprite rendering family as the input; crisp mechanical details, stable silhouette, restrained adjacent-frame articulation, no camera rotation or scale drift.
Composition/framing: exact equal 6x4 grid, one centered walker per cell, consistent center anchor and scale, generous gutters, nothing crosses cell boundaries.
Scene/backdrop: perfectly flat uniform solid #ff00ff chroma-key background. No transparency simulation, no shadow, floor, scenery, text, labels, grid lines, watermark, detached projectiles, smoke across cells, or extra objects. Do not use #ff00ff in the robot.
```

## 빔 소드 수동 검술 아틀라스 (2026-08-15)

- 생성 도구: Codex Desktop 내장 OpenAI ImageGen. 외부 게임 이미지나 제3자 에셋은 사용하지 않았습니다.
- 기능/팔레트 참조: 프로젝트 원본 `public/assets/overload/vfx/pixel/manual-ability-pixel-atlas.png`.
- 선택 ImageGen 원본: `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-52ca4c3b-b71b-4cdf-aaf6-0d385346a3bc.png`.
- 프로젝트 보존 원본: `reference/source-assets/overload/vfx/sword-manual-ability-atlas-{chroma,alpha}.png`.
- 활성 런타임: `public/assets/overload/vfx/pixel/sword-manual-ability-atlas.png` (6×4, 64px 셀).
- 후처리: `remove_chroma_key.py`와 `normalize-pixel-vfx-atlas.py`로 배경 제거, 제한 팔레트,
  NEAREST 64px 셀을 확정했습니다.

### 빔 소드 수동 검술 프롬프트 전문

```text
Use case: stylized-concept.
Asset type: production 16-bit pixel-art manual sword ability VFX atlas for HUMAN OVERRIDE: OVERLOAD.
Input image: Image 1 is the approved crisp pixel cluster, cyan-white energy palette, and exact 6x4 atlas style reference. Redesign four new active abilities rather than copying its frames.
Primary request: one exact 6-column by 4-row atlas, exactly 24 isolated square animation cells, read left to right.
Row 1 Q · SPECTRAL SWORD ARRAY: one small cyan blade seed, then 3, 5, and 8 floating swords orbiting a central point, blades converging outward into a circular slash, clean fade.
Row 2 E · PHANTOM REND: forward arrow-like sword aura charges, accelerates through three long but cell-contained cutting silhouettes, crossing X slash impact, afterimage fade.
Row 3 F · IMPERIAL SWORD DOMAIN: compact hilt/core, sword grows into a massive cyan-white energy blade, wide circular sweep arc, peak battlefield ring, shattered light fragments, fade.
Row 4 R · HEAVENFALL EXECUTION: warning sigil, enormous vertical sword tip descending, giant sword impact, bright radial ground rupture, huge concentric shockwave, fading crater sparks. Every frame must clearly communicate a devastating ultimate without crossing cell boundaries.
Style/medium: authentic authored 16-bit arcade pixel VFX, hard stair-step edges, no antialiasing, restrained cyan/white/ice-blue palette with minimal violet, dark navy outlines, readable at 64x64, polished production asset.
Composition/framing: exact uniform 6x4 grid, equal square slots, one centered effect per cell, safe padding, no crossing boundaries.
Scene/backdrop: perfectly flat uniform solid #ff00ff chroma-key background. No grid lines, labels, text, numbers, environment, floor, shadows, gradients, watermark, extra rows or columns. Do not use #ff00ff in effects.
```

## 인물 영구 강화 UI 일러스트 (2026-08-15)

- 생성 도구: Codex Desktop 내장 OpenAI ImageGen. 외부 게임 이미지나 제3자 에셋은 사용하지 않았습니다.
- 정체성 참조: 프로젝트 원본 `public/assets/overload/hero/survivor-portrait.png`,
  `public/assets/overload/hero/mika-portrait.png`.
- 선택 ImageGen 원본: `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-e4fb9a86-7022-43eb-b291-9978b58eb43e.png`.
- 프로젝트 보존 원본: `reference/source-assets/overload/campaign/character-enhancement-imagegen.png`.
- 활성 런타임: `public/assets/overload/campaign/character-enhancement.webp`.
- 후처리: 선택 원본을 3:2 WebP로 최적화했으며 인물과 배경의 구도·내용은 변경하지 않았습니다.

### 인물 영구 강화 UI 프롬프트 전문

```text
Use case: identity-preserve.
Asset type: wide campaign character-enhancement UI illustration for HUMAN OVERRIDE: OVERLOAD.
Input images: Image 1 is AEGIS's exact silver-haired identity, black-and-white combat suit, and mature expression. Image 2 is MIKA's exact pink twin-tail identity, ring-blades, suit, and playful expression. Preserve both identities.
Primary request: AEGIS and MIKA stand in separate but connected futuristic HAVEN-09 augmentation pods while cyan and magenta diagnostic holograms scan their armor and weapons. The composition must communicate permanent stat growth, repeat-clear progression, and character specialization. AEGIS is calm and precise; MIKA is cheerful and gives a confident thumbs-up.
Style/medium: premium polished sci-fi anime game key art, detailed hard-surface medical/engineering bay, clean cinematic finish matching both portraits.
Composition/framing: 3:2 landscape, AEGIS on left third, MIKA on right third, a clean darker central/lower area reserved for DOM upgrade cards and numbers. Upper bodies fully readable; no text baked into art.
Lighting/mood: cool cyan facility light with magenta accents, hopeful rebuilding atmosphere, high contrast around faces.
Constraints: exactly two characters, no duplicates, no logos, no words, no UI labels, no watermark, no cropped faces or hands, no sexualized pose, no weapons pointed at viewer.
```

## 신규 플레이어 미카 및 전용 전투 아틀라스 (2026-08-15)

- 생성 도구: Codex Desktop 내장 OpenAI ImageGen. 외부 게임 이미지나 제3자 에셋은 사용하지 않았습니다.
- 스타일 참조: 프로젝트 원본 이지스 초상화·8방향 아틀라스와 수동 스킬 픽셀 아틀라스.
- 선택 ImageGen 원본:
  - 초상화: `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-a98e8787-e559-4585-ba41-f652b38cedbf.png`
  - 8방향 모션: `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-99f02fed-1da9-4b93-b890-0a13bc39c897.png`
  - 전용 스킬: `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-20e97ac9-2295-4176-9a7d-2391eb24865f.png`
- 프로젝트 보존 원본:
  - `reference/source-assets/overload/hero/mika-portrait-chroma.png`
  - `reference/source-assets/overload/hero/mika-directional-aim-atlas-{chroma,alpha,normalized}.png`
  - `reference/source-assets/overload/vfx/mika-ability-atlas-{chroma,alpha}.png`
- 활성 런타임:
  - `public/assets/overload/hero/mika-portrait.png`
  - `public/assets/overload/hero/mika-directional-aim-atlas.png`
  - `public/assets/overload/vfx/pixel/mika-ability-atlas.png`
- 후처리: chroma key 제거 후 초상화는 투명 PNG로, 모션은 8×8·128px 셀로 중심 정규화,
  스킬은 6×4·64px NEAREST 픽셀 셀로 확정했습니다.

### 미카 초상화 프롬프트 전문

```text
Use case: character-design.
Asset type: production transparent character portrait for HUMAN OVERRIDE: OVERLOAD.
Create MIKA, a cute and charismatic young adult resistance fighter with vivid pink twin-tail hair, a bright mischievous smile, expressive rose eyes, and a completely different silhouette from the mature silver-haired AEGIS. She wears a compact black futuristic combat suit with white armor panels, magenta luminous seams, short asymmetric jacket tails, and two floating circular prism ring-blades mounted behind her forearms. Her personality is playful, fearless, energetic, and slightly eccentric, while remaining a credible elite combatant.
Style/medium: premium polished sci-fi anime game character illustration matching the approved HUMAN OVERRIDE portraits, detailed materials and clean silhouette.
Composition/framing: full body, centered, standing three-quarter toward camera, hands and both ring-blades fully visible, generous safe padding.
Scene/backdrop: perfectly flat uniform solid #ff00ff chroma-key background.
Constraints: exactly one adult character, exactly two ring-blades, pink twin tails, no text, logo, watermark, extra people, cropped limbs, sexualized pose, school uniform, gun, sword, background scenery, shadow, or magenta color matching #ff00ff on the character edge.
```

### 미카 8방향 모션 프롬프트 전문

```text
Use case: identity-preserve.
Asset type: production true-overhead 8-direction player motion atlas for HUMAN OVERRIDE: OVERLOAD.
Input image: Image 1 is MIKA's approved pink twin-tail identity, black-white-magenta combat suit, and paired prism ring-blades. Preserve her exact identity and equipment.
Create one exact 8-column by 8-row atlas, 64 isolated square frames. Strict orthographic 90-degree nadir camera in every cell. Columns are restrained animation beats. Rows are aim directions in clockwise screen order: down/front, down-right, right, up-right/back diagonal, up/back, up-left/back diagonal, left, down-left. The face is readable in downward rows, side profile in horizontal rows, and the back of the head/twin tails in upward rows. Both circular blades remain attached near the forearms.
Motion contract by columns: idle A, idle B, step A, step B, attack windup, ring-blade release, recoil, recovery. Keep feet-down/head-up body orientation inside each authored direction rather than rotating one source image.
Style/medium: polished top-down sci-fi anime game sprite, stable identity, crisp readable silhouette, restrained frame-to-frame movement.
Composition/framing: exact uniform 8x8 grid, one centered full-body MIKA per cell, identical scale and anchor, generous gutters, nothing crossing cells.
Scene/backdrop: perfectly flat uniform #ff00ff chroma-key background. No grid lines, labels, text, shadows, floor, scenery, detached projectiles, duplicates, watermark, camera tilt, or cropped body parts.
```

### 미카 Q/E/F/R 전용 픽셀 VFX 프롬프트 전문

```text
Use case: stylized-concept.
Asset type: production 16-bit pixel-art active ability VFX atlas for MIKA in HUMAN OVERRIDE: OVERLOAD.
Create one exact 6-column by 4-row atlas, exactly 24 isolated square cells, read left to right.
Row 1 Q PRISM RICOCHET: pink ring seed, two splitting rings, multiple ricochet arcs, converging cuts, bright prism impact, fade.
Row 2 E RIBBON VORTEX: compact magenta ribbon, twin spiral build, circular cutting vortex, peak rose-cyan cyclone, fragments, fade.
Row 3 F COMET DUET: paired ring-blade charge, two parallel comet trails, high-speed crossing dash cuts, X impact, long afterimage, fade.
Row 4 R HEARTBEAT CARNIVAL: heart-like pulse core, expanding ring constellation, dense radial ring-blades, brilliant full circular burst, huge pink-cyan shockwave, fading spark petals.
Style/medium: authentic hand-authored 16-bit arcade pixel VFX, hard stair-step edges, no antialiasing, restrained hot-pink/cyan/white/violet palette, dark navy outlines, readable at 64x64.
Composition/framing: exact uniform 6x4 grid, equal square slots, one centered self-contained effect per cell, safe padding, nothing crossing boundaries.
Scene/backdrop: perfectly flat uniform #ff00ff chroma-key background. No text, numbers, labels, grid lines, environment, gradients, watermark, extra rows or columns. Do not use #ff00ff inside the effects.
```

## 헤이븐-09 로비 및 상세 메뉴 배경 (2026-08-15)

- 생성 도구: Codex Desktop 내장 OpenAI ImageGen. 첨부된 외부 게임 화면은 UI 구도 참고에만
  사용했으며 ImageGen 입력이나 런타임 에셋으로 사용하지 않았습니다.
- 프로젝트 스타일 참조: `public/assets/overload/campaign/haven-09-base.webp`,
  `public/assets/overload/campaign/lobby/haven-command-atrium.webp`,
  `public/assets/overload/campaign/character-enhancement.webp`.
- 선택 ImageGen 원본:
  - 로비: `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-e780a601-5a1e-4dd0-a795-1bd3e7db8f1a.png`
  - 연구실: `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-a874cd6f-0518-4102-8072-de627f63aca2.png`
  - 정비소: `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-a565edd5-9b22-4a3c-bfbe-c34116a4b240.png`
  - 동기화실: `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-5d5f27df-2592-4bac-991e-3789c83d62ee.png`
- 프로젝트 보존 원본:
  - `reference/source-assets/overload/campaign/lobby/haven-command-atrium-imagegen.png`
  - `reference/source-assets/overload/campaign/lobby/hana-research-lab-imagegen.png`
  - `reference/source-assets/overload/campaign/lobby/ilya-equipment-workshop-imagegen.png`
  - `reference/source-assets/overload/campaign/lobby/character-sync-chamber-imagegen.png`
- 활성 런타임:
  - `public/assets/overload/campaign/lobby/haven-command-atrium.webp`
  - `public/assets/overload/campaign/lobby/hana-research-lab.webp`
  - `public/assets/overload/campaign/lobby/ilya-equipment-workshop.webp`
  - `public/assets/overload/campaign/lobby/character-sync-chamber.webp`
- 후처리: 선택 원본을 중앙 기준으로 16:9에 맞춘 뒤 Pillow LANCZOS로 1920×1080 리샘플링하고
  WebP quality 86으로 최적화했습니다. 합성 요소를 추가하거나 이미지 내용을 다시 그리지 않았습니다.

### 헤이븐-09 로비 배경 프롬프트 전문

```text
Use case: stylized-concept
Asset type: full-screen 16:9 main lobby background for the browser game HUMAN OVERRIDE: OVERLOAD
Input images: Image 1 is the approved HAVEN-09 base art-direction reference only. Preserve its dark near-future industrial resistance-base architecture, gunmetal materials, cyan navigation lights, warm amber work lights, cinematic realism, and premium Korean sci-fi game quality. Create a new original scene rather than copying the reference composition.
Primary request: create the command atrium of HAVEN-09 as a character-lobby background designed for a large transparent character portrait placed around the center-left. The background must provide clean visual breathing room behind that character while remaining rich and detailed around the edges.
Scene/backdrop: a wide futuristic underground command hangar, panoramic reinforced windows showing a stormy occupied megacity at night, tactical hologram table and cyan command consoles toward the right, sleek black stealth airship visible through a hangar aperture in the upper-right distance, research alcove and workshop doors suggested at the far sides.
Composition/framing: exact wide landscape 16:9, eye-level cinematic camera, broad unobstructed floor and subdued wall area from x=28% to x=61% for the character, most detailed machinery and bright light sources kept to the far left edge and right third, no foreground person.
Lighting/mood: controlled cyan and dim amber practical lights, subtle rain glow outside, hopeful resistance stronghold rather than horror.
Constraints: environment only; no people, no character, no UI, no text, no logos, no symbols, no watermark, no borders. Do not imitate any attached third-party game screenshot. Original HUMAN OVERRIDE: OVERLOAD project art.
```

### HANA 연구실 배경 프롬프트 전문

```text
Use case: stylized-concept
Asset type: full-screen 16:9 research-laboratory menu background for HUMAN OVERRIDE: OVERLOAD
Input images: Image 1 is the new HAVEN-09 lobby style reference; Image 2 is the approved original base art direction. Match their same premium dark industrial Korean sci-fi game rendering, gunmetal surfaces, cyan navigation lighting, restrained amber practical lights.
Primary request: create a new original interior of HANA's AI research laboratory inside HAVEN-09. Show a tall transparent neural-core chamber, holographic AI lattice projections, diagnostic workbenches, suspended micro-drone parts, sealed glass partitions, and clean high-tech instruments.
Composition/framing: wide exact 16:9 eye-level scene. Leave the left 58% relatively calm and dark for readable facility title, resource counter, and three upgrade cards; concentrate the neural chamber and richest details in the right third. Keep all visual focal points away from the center UI text area.
Lighting/mood: cool violet-cyan research glow with small warm task lights, precise and intelligent, no horror.
Constraints: environment only; no people, no character, no UI, no text, no logos, no symbols, no watermark. No third-party game imagery. Original HUMAN OVERRIDE: OVERLOAD project art.
```

### ILYA 정비소 배경 프롬프트 전문

```text
Use case: stylized-concept
Asset type: full-screen 16:9 equipment-workshop menu background for HUMAN OVERRIDE: OVERLOAD
Input images: Image 1 is the new HAVEN-09 lobby style reference; Image 2 is the approved original base art direction. Match their premium dark industrial resistance-base realism, gunmetal materials, cyan navigation accents, restrained amber work lighting.
Primary request: create a new original interior of ILYA's equipment workshop inside HAVEN-09. Show a heavy futuristic pulse-rifle service cradle, a suspended beam-sword calibration rack, modular armor components, robotic tool arms, rugged workbenches and organized replacement parts. It must feel practical, advanced, and used by a veteran engineer.
Composition/framing: wide exact 16:9 eye-level scene. Leave the left 58% calmer and lower contrast for readable facility title, resource counter, and three upgrade cards; concentrate the weapon cradles, tool arms, warm sparks and mechanical detail in the right third. No foreground object blocking UI areas.
Lighting/mood: warm amber engineering bay balanced by cool cyan diagnostic light, credible industrial atmosphere.
Constraints: environment only; no people, no character, no UI, no text, no logos, no symbols, no watermark. No third-party game imagery. Original HUMAN OVERRIDE: OVERLOAD project art.
```

### 전투원 동기화실 배경 프롬프트 전문

```text
Use case: stylized-concept
Asset type: full-screen 16:9 character-synchronization menu background for HUMAN OVERRIDE: OVERLOAD
Input images: Image 1 defines the new HAVEN-09 lobby material and lighting language. Image 2 is the approved synchronization-chamber reference for cyan AEGIS and magenta MIKA energy language, but its characters must not be copied into the new background.
Primary request: create a new original dual-frame synchronization chamber inside HAVEN-09. Two empty upright calibration pods stand in the back wall: cyan on the left and magenta on the right, connected to a central circular neural interface, with holographic combat diagnostics, overhead mechanical rings and precise floor light paths.
Composition/framing: wide exact 16:9 eye-level scene. Keep the left half subdued enough for a large transparent character portrait and the right half detailed but readable behind a stats console. Place the two empty pods deeper in the scene and never dominate the foreground.
Lighting/mood: premium dark sci-fi, balanced cyan and magenta rim light, clinical but heroic, subtle amber maintenance accents.
Constraints: empty environment only; absolutely no people, no human figures, no character silhouettes, no UI, no text, no logos, no symbols, no watermark. No third-party game imagery. Original HUMAN OVERRIDE: OVERLOAD project art.
```

## HAVEN-09 Cubism 제작 자료 (비활성·보존)

> **현재 런타임:** HAVEN-09 로비는
> `public/assets/overload/hero/survivor-portrait.png`와
> `public/assets/overload/hero/mika-portrait.png` 원본 정적 일러스트를 사용합니다.
> 아래 Cubism 모델·모션·물리 파일은 제작 이력과 향후 전문 리깅을 위해 보존한 자료이며,
> 현재 React 로비에는 마운트되지 않습니다. `@greenmansk/react-live2d`와 Cubism Web Core도
> 활성 번들에서 제거했습니다. 따라서 아래 항목을 현재 동작하는 Live2D 기능으로 해석하면 안 됩니다.

- 도구: 사용자가 설치하고 PRO 평가판을 승인한 Live2D Cubism Editor 5.3.03.
- 원본 캐릭터 일러스트: 프로젝트 원본
  `public/assets/overload/hero/survivor-portrait.png`,
  `public/assets/overload/hero/mika-portrait.png`.
- MIKA 전신 확장 원본: 기존 MIKA의 얼굴·핑크 양갈래·흑백 마젠타 전투복·쌍환 장비를
  정체성 참조로 사용해 OpenAI 내장 ImageGen에서 잘린 하체와 부츠를 완성했습니다. 선택 원본은
  `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-50635e01-96a3-4deb-a42f-0e34a40e4322.png`,
  보존 원본은 `reference/source-assets/overload/live2d/mika-fullbody-chroma.png`, 비활성 투명
  검수본은 `public/assets/overload/hero/mika-live2d-fullbody.png`입니다. 외부 게임 캐릭터 이미지는
  ImageGen 참조나 런타임 에셋으로 사용하지 않았습니다.
- MIKA 전신 확장 ImageGen 프롬프트:
```text
Use case: identity-preserve.
Asset type: production full-body character source illustration for a rigged Live2D lobby model in HUMAN OVERRIDE: OVERLOAD.
Input image: Image 1 is the approved MIKA identity. Preserve her exact adult anime face, vivid pink twin-tail hair, rose eyes, playful expression, black-and-white futuristic combat suit with magenta luminous seams, asymmetric white jacket panels, thigh holsters, and paired floating circular prism ring-blades. Do not redesign her identity, costume, proportions, colors, or equipment.
Primary request: extend the cropped approved illustration into one coherent complete standing full-body MIKA. Reconstruct both legs below the existing crop with fitted black armored thigh straps, articulated cybernetic knee and shin armor, and matching black high combat boots with restrained magenta luminous accents. Keep the anatomy natural and the transition from the approved upper body seamless. Her relaxed confident pose and ring-blades remain unchanged.
Composition/framing: exact 941x1672 portrait canvas; one centered character; complete hair ornaments, both ring-blades, fingertips, thighs, knees, shins, and both boot soles fully visible with safe transparent-production padding. No crop, duplicate limb, extra person, alternate costume, prop, floor, text, logo, or watermark.
Scene/backdrop: perfectly flat uniform solid #00ff00 chroma-key background covering every empty pixel, with no shadow, gradient, texture, reflection, or lighting variation. Do not use #00ff00 inside the character. Crisp separated edges suitable for local chroma removal and later Cubism segmentation.
```
- 편집 가능한 소스:
  `reference/source-assets/overload/cubism/aegis/aegis-cubism-source.psd`,
  `reference/source-assets/overload/cubism/aegis/aegis.cmo3`,
  `reference/source-assets/overload/cubism/mika/mika-cubism-source.psd`,
  `reference/source-assets/overload/cubism/mika/mika.cmo3`.
- 보존 모델 출력물:
  `public/assets/overload/live2d/aegis/aegis.model3.json`,
  `public/assets/overload/live2d/aegis/aegis.moc3`,
  `public/assets/overload/live2d/mika/mika.model3.json`,
  `public/assets/overload/live2d/mika/mika.moc3`와 각 2048px 텍스처·CDI·표정 JSON.
- 호환성: 공개 Cubism Web Core가 지원하는 MOC3 v5로 출력했습니다. `MOC3` 헤더와 버전 바이트
  5를 집중 테스트로 잠급니다.
- 과거 브라우저 검증에 사용한 런타임: `@greenmansk/react-live2d` 0.1.1(MIT)과 번들한 공식
  `Live2D Cubism Core` Redistributable Code를 사용합니다. Core 원본 주소는
  `https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js`, 라이선스는
  `https://www.live2d.com/eula/live2d-proprietary-software-license-agreement_en.html`입니다.
- 소스 PSD 준비 스크립트: `scripts/build-cubism-source.py`. 이 스크립트는 MOC3를 위조하거나
  생성하지 않으며, 최종 `.cmo3` 리깅과 `.moc3` 출력은 Cubism Editor에서 수행했습니다.
- 보존된 상호작용 설계: 포인터 추적은 사용하지 않습니다. 상시 호흡·상체·머리카락 흔들림은 캐릭터별
  Cubism 키폼과 시선/상체 파라미터로 구동합니다. 머리·가슴·양팔·다리 클릭에는 캐릭터별
  전용 표정 JSON과 방향·진폭·주기가 다른 리그 반동을 적용하고, 캔버스 위치·전체 배율은 고정해
  인물 전체가 미끄러지는 움직임을 제거했습니다. AEGIS는 `cold-*`, MIKA는 `shy-*` 표정을
  사용하며, 간헐 중립 변화는 `cold-idle`/`bright-idle`입니다. model3의 `EyeBlink` 그룹이
  양쪽 눈 파라미터를 구동합니다. 터치 영역 표시와 CSS 홍조/얼굴선 합성은 없습니다.
- 상호작용 연출 밀도는 사용자가 지정한 캐릭터 로비 게임들의 클릭 반응·말풍선·아이들 변화
  방식을 장르 참고로만 검토했습니다. 해당 작품의 미술, 모델, 리깅 데이터, 대사, UI 에셋은
  복제하거나 프로젝트에 포함하지 않았고 AEGIS와 MIKA는 프로젝트 원본을 기반으로 각각
  독립 제작했습니다.

### HAVEN-09 Cubism premium motion v2 (비활성 제작 이력)

- 조사 기준: Live2D 공식 Cubism 문서의 PSD 소재 분리, 수동 메쉬, 워프 디포머, 표준
  파라미터, XY 얼굴 회전, 눈 깜빡임, 물리 연산 지침을 기준으로 삼았습니다. 다른 게임의
  캐릭터 원화·모델·모션 데이터는 사용하지 않았습니다.
- 도구: OpenAI 내장 ImageGen과 사용자가 설치·승인한 Live2D Cubism Editor 5.3.03.
- AEGIS 선택 ImageGen 원본:
  `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-ae464a1e-9e91-4658-821a-996f34bcfe35.png`.
- MIKA 선택 ImageGen 원본:
  `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-51d11449-6278-4b1b-81f3-938adbdeeefa.png`.
- 편집 소스 경로:
  `reference/source-assets/overload/cubism-v2/aegis/`와
  `reference/source-assets/overload/cubism-v2/mika/`. `scripts/build-premium-cubism-source.py`가
  얼굴, 눈, 눈썹, 입, 머리카락 덩어리, 양팔, 양다리, 코트, MIKA 트윈테일·링 장비를
  캐릭터별 28개 의미 레이어로 분리한 PSD와 합성 검수 이미지를 재생성합니다. Cubism Editor
  자동 템플릿은 몸통 디포머 배치의 참고에만 사용했고, 검증되지 않은 얼굴 자동 키폼을 런타임
  MOC에 덮어쓰지 않았습니다.
- 보존 출력: 각 캐릭터에 3개 Idle 모션, 머리·가슴·팔·다리 4개 Touch 모션과
  앞머리·옆머리·뒷머리 3계통 물리를 추가했습니다. 재현 스크립트는
  `scripts/build-cubism-motion-library.mjs`, 런타임 경로는
  `public/assets/overload/live2d/{aegis,mika}/motions/`와 각 `*.physics3.json`입니다.
  AEGIS는 낮은 진폭과 긴 복귀, MIKA는 큰 트윈테일 관성과 빠른 탄성으로 독립 조정했습니다.

#### AEGIS premium rig source 프롬프트 전문

```text
Use case: identity-preserve.
Asset type: premium production source illustration for a Live2D Cubism character rig in the game HUMAN OVERRIDE: OVERLOAD.
Image 1 is the approved AEGIS character identity. Preserve her exact adult silver-haired cybernetic operative identity: long silver-white hair, cool gray eyes, black high-neck armored bodysuit, white technical coat panels with black star hardware, cyan micro-lights, elegant severe expression, realistic anime proportions, and premium dark sci-fi rendering. Do not redesign her face, age, hairstyle, palette, or costume language.
Create one new complete FULL-BODY neutral rigging source, strict straight-on front view with a subtle natural contrapposto no more than 3 degrees. Head upright, both eyes clearly visible, shoulders level. Both arms held slightly away from the torso with elbows softly bent so the upper arms, forearms, gloved hands, waist, and coat panels do not overlap. Legs separated by a small gap, both boots fully visible. Long hair must be readable as distinct bangs, side locks, rear mass, and several clean long strand groups, with no strand crossing the eyes or hands. Keep the mouth closed in a calm neutral line and eyes naturally open. Include generous transparent-looking safety margin around hair, hands, coat tails, and boots.
Live2D separation requirements: clean unobstructed silhouette, face and neck fully drawable behind hair, torso fully drawable behind arms and coat tails, complete hidden limb edges implied cleanly, crisp high-detail cel-painted anime game art, stable symmetric anatomy, clear joints at shoulders/elbows/wrists/hips/knees, no motion blur, no perspective distortion, no dramatic pose, no weapon, no foreground effects.
Composition: exact 9:16 portrait canvas, character centered, complete head-to-toe body occupying about 84 percent of canvas height.
Scene/backdrop: perfectly flat uniform solid #00ff00 chroma-key background, no shadow, gradient, texture, environment, reflection, floor, text, UI, watermark, or extra objects. Do not use #00ff00 anywhere in the character.
```

#### MIKA premium rig source 프롬프트 전문

```text
Use case: identity-preserve.
Asset type: premium production source illustration for a Live2D Cubism character rig in the game HUMAN OVERRIDE: OVERLOAD.
Image 1 is the approved MIKA character identity. Preserve her exact adult pink-haired twin-tail cybernetic striker identity: long vivid pink twin tails with black-and-magenta mechanical ornaments and two circular floating blade rings, bright magenta eyes, playful cute face, black fitted futuristic combat bodysuit, cropped white technical jacket, hot-pink luminous seams, gloves, belts and thigh gear. Preserve her unique cheerful mischievous appeal, anime proportions, premium dark sci-fi rendering, and exact palette. Do not redesign her age, face, hairstyle, costume language, or weapons.
Create one new complete FULL-BODY neutral rigging source, strict straight-on front view with a lively but rig-safe contrapposto no more than 3 degrees. Head upright, both eyes clearly visible, shoulders level. Both arms held slightly away from the torso with elbows softly bent so upper arms, forearms, gloved hands, jacket sleeves, waist, and hips do not overlap. Legs separated by a small gap, both boots fully visible. Each twin tail must be clearly separated into front strand, main tail mass, outer loose strands and tips. Keep the two ring ornaments behind the shoulders, symmetric and not crossing the face, arms, or torso. Mouth closed in a small confident smile and eyes naturally open. Include generous safety margin around twin tails, hands, rings, jacket, and boots.
Live2D separation requirements: clean unobstructed silhouette, face and neck fully drawable behind bangs, torso fully drawable behind arms and jacket, complete hidden limb edges implied cleanly, crisp high-detail cel-painted anime game art, stable anatomy, clear joints at shoulders/elbows/wrists/hips/knees, no motion blur, no perspective distortion, no dramatic pose, no foreground VFX.
Composition: exact 9:16 portrait canvas, character centered, complete head-to-toe body occupying about 84 percent of canvas height.
Scene/backdrop: perfectly flat uniform solid #00ff00 chroma-key background, no shadow, gradient, texture, environment, reflection, floor, text, UI, watermark, or extra objects. Do not use #00ff00 anywhere in the character.
```

## Expanded regional route backgrounds v2

- 도구: OpenAI 내장 ImageGen.
- 목적: 26,400×1,080 초장거리 월드에서 최대 220기 편대가 겹치지 않고 펼쳐질 수 있도록,
  각 구역의 기존 미술 정체성을 유지한 후반 전용 넓은 전투로를 신규 제작했습니다.
- 후처리: 선택된 1672×941 ImageGen 원본을 PIL LANCZOS로 1920×1080에 결정론적으로
  리사이즈하고 WebP quality 88/method 6으로 저장했습니다. PERFORMANCE 960×540 파생본은
  `scripts/build-performance-assets.py`가 0.5배 PIL LANCZOS로 생성했으며 ImageGen을 다시
  사용하거나 수작업으로 고치지 않았습니다.
- WRONG ENGINE: 기존 참조 `public/assets/overload/environment/sector-03-engine-causeway.webp`;
  ImageGen 원본 `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-a1ebd9b8-7b30-4a7d-9ddf-2e1dfc2ba218.png`;
  보존 원본 `reference/source-assets/overload/environment/sector-04-reactor-vault-expanded.png`;
  런타임 `public/assets/overload/environment/sector-04-reactor-vault-expanded.webp` 및
  `public/assets/overload/environment/performance/sector-04-reactor-vault-expanded.webp`.
- GLASS DUNE: 기존 참조 `public/assets/overload/regions/glass-dune/route.webp`;
  ImageGen 원본 `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-9bb9ca64-8083-4af7-af1a-376b98a9868b.png`;
  보존 원본 `reference/source-assets/overload/regions/glass-dune/route-expanded-v2.png`;
  런타임 `public/assets/overload/regions/glass-dune/route-expanded-v2.webp` 및 performance 동명 경로.
- ABYSSAL ARCHIVE: 기존 참조 `public/assets/overload/regions/abyssal-archive/route.webp`;
  ImageGen 원본 `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-5a3993bc-c979-4021-a54d-2155b4112a6c.png`;
  보존 원본 `reference/source-assets/overload/regions/abyssal-archive/route-expanded-v2.png`;
  런타임 `public/assets/overload/regions/abyssal-archive/route-expanded-v2.webp` 및 performance 동명 경로.
- NEON FOUNDRY: 기존 참조 `public/assets/overload/regions/neon-foundry/route.webp`;
  ImageGen 원본 `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-4fbdf489-471d-4b92-8ef5-a1f83687fc6a.png`;
  보존 원본 `reference/source-assets/overload/regions/neon-foundry/route-expanded-v2.png`;
  런타임 `public/assets/overload/regions/neon-foundry/route-expanded-v2.webp` 및 performance 동명 경로.
- STORM SPIRE: 기존 참조 `public/assets/overload/regions/storm-spire/route.webp`;
  ImageGen 원본 `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-8781ec3b-3ca2-4893-af69-b5cb23da9e83.png`;
  보존 원본 `reference/source-assets/overload/regions/storm-spire/route-expanded-v2.png`;
  런타임 `public/assets/overload/regions/storm-spire/route-expanded-v2.webp` 및 performance 동명 경로.
- GENE VAULT: 기존 참조 `public/assets/overload/regions/gene-vault/route.webp`;
  ImageGen 원본 `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-f8b32bfd-0321-4055-97f4-7c343044b755.png`;
  보존 원본 `reference/source-assets/overload/regions/gene-vault/route-expanded-v2.png`;
  런타임 `public/assets/overload/regions/gene-vault/route-expanded-v2.webp` 및 performance 동명 경로.

### WRONG ENGINE 확장 구역 프롬프트 전문

```text
Use case: identity-preserve.
Asset type: production 2D top-down battlefield background for the Phaser browser game HUMAN OVERRIDE: OVERLOAD.
Image 1 is the approved WRONG ENGINE route art and establishes the world identity only. Create a NEW, distinct expanded-route sector farther inside the same machine megastructure; do not copy the existing layout.
Strict orthographic 90-degree overhead/nadir camera, exact 16:9 landscape composition. A very broad horizontal traversable causeway must occupy the middle 72% of the image from left edge to right edge, suitable for hundreds of separated enemy units. Keep the central combat surface flat, continuous, high contrast, and free of walls, pits, giant props, characters, enemies, vehicles, text, UI, arrows, logos, or perspective vanishing points.
Environment identity: colossal black gunmetal AI engine interior, scarred wet steel floor plates, red reactor furnaces and restrained cyan guidance lamps around the upper and lower perimeter, turbine chambers, cable trenches, mechanical ribs, drifting heat only outside the playable center. Add new details such as opened maintenance vaults, damaged data conduits, and distant rotating reactor wells at the margins. Dark cinematic cyberpunk military rendering, crisp game-readable materials, realistic high-detail painted environment, not pixel art.
The left and right boundaries should have compatible floor tone and plate rhythm so TileSprite repetition is unobtrusive. The upper and lower margins clearly read as blocked machinery while the entire central horizontal route remains walkable. Even lighting across the center; no deep black void or crushed shadow in the playable lane. No lettering, symbols, watermark, border, grid overlay, or interface.
```

### GLASS DUNE 확장 구역 프롬프트 전문

```text
Use case: identity-preserve.
Asset type: production 2D top-down battlefield background for the Phaser browser game HUMAN OVERRIDE: OVERLOAD.
Image 1 is the approved GLASS DUNE route art and establishes the region identity only. Create a NEW, distinct expanded-route sector deeper in the same shattered mirror desert; do not copy the existing layout.
Strict orthographic 90-degree overhead/nadir camera, exact 16:9 landscape composition. A very broad horizontal traversable avenue must occupy the middle 72% from left edge to right edge, giving large formations room to remain visually separated. The center must be continuous flat ground with no walls, pits, giant debris, characters, enemies, vehicles, text, UI, arrows, logos, or perspective view.
Environment identity: fractured charcoal ceramic roadway fused with pale ivory mirror stone, black glass sand, amber energy veins, collapsed prism pylons, reflective crystal dunes and broken gold-black AI machinery limited to the upper and lower margins. Introduce a distinctive mirage-processing field with half-buried lens arrays, long crystalline fault lines, and restrained warm glints, but keep dangerous shards outside the playable middle. High-detail realistic sci-fi game background, elegant white/black/amber palette, readable silhouettes, not pixel art.
Make left and right edges compatible in floor tone and crack rhythm for unobtrusive TileSprite repetition. Margins clearly read as blocked terrain; central route stays evenly illuminated and walkable with no black void. No labels, lettering, watermark, border, grid overlay, or interface.
```

### ABYSSAL ARCHIVE 확장 구역 프롬프트 전문

```text
Use case: identity-preserve.
Asset type: production 2D top-down battlefield background for the Phaser browser game HUMAN OVERRIDE: OVERLOAD.
Image 1 is the approved ABYSSAL ARCHIVE route art and establishes the region identity only. Create a NEW, distinct expanded-route sector deeper inside the submerged AI memory archive; do not copy the existing layout.
Strict orthographic 90-degree overhead/nadir camera, exact 16:9 landscape composition. A very broad horizontal traversable data-deck occupies the middle 72% from left edge to right edge, large enough for hundreds of separated units. Keep the central combat surface flat, continuous, and clear of walls, pits, giant props, characters, enemies, creatures, text, UI, arrows, logos, or perspective vanishing point.
Environment identity: wet black ribbed metal, cyan memory conduits, restrained violet nodes, pressure-glass reservoirs, drowned server cathedrals and biomechanical cable roots only around upper and lower margins. Add a new mnemonic current chamber with luminous data shoals behind glass, cracked archive capsules, condensation and subtle water caustics outside the playable center. Dark abyssal cyan/violet palette, realistic high-detail cybernetic environment, crisp game-readable floor, not pixel art.
Make left and right edges compatible in deck tone and panel rhythm for unobtrusive TileSprite repetition. Margins read as blocked machinery and deep water; the center remains evenly lit, dry-looking, walkable, and never becomes a black void. No labels, lettering, watermark, border, grid overlay, or interface.
```

### NEON FOUNDRY 확장 구역 프롬프트 전문

```text
Use case: identity-preserve.
Asset type: production 2D top-down battlefield background for the Phaser browser game HUMAN OVERRIDE: OVERLOAD.
Image 1 is the approved NEON FOUNDRY route art and establishes the region identity only. Create a NEW, distinct expanded-route production deck deeper in the same autonomous factory; do not copy the existing layout.
Strict orthographic 90-degree overhead/nadir camera, exact 16:9 landscape composition. A very broad horizontal traversable factory avenue fills the middle 72% from left edge to right edge, providing clear space for many separated units. The center is flat and continuous with no walls, pits, conveyor obstacles, giant props, characters, enemies, vehicles, text, UI, arrows, logos, or perspective view.
Environment identity: black industrial armor plate, intense molten amber channels, bright cyan coolant columns, robotic assembly arms, sealed forge presses, hazard detailing and dense machine bays confined to upper and lower margins. Add a distinctive drone-fabrication line with inactive chassis racks, magnetic crane rails, sparks and heat shimmer only outside the playable center. High-detail realistic sci-fi factory environment, cyan/amber on charcoal, crisp readable materials, not pixel art.
Make left and right edges compatible in plate scale and lighting for unobtrusive TileSprite repetition. The margins are clearly blocked machinery; the central route remains evenly lit and walkable without black voids. No lettering, labels, watermark, border, grid overlay, or interface.
```

### STORM SPIRE 확장 구역 프롬프트 전문

```text
Use case: identity-preserve.
Asset type: production 2D top-down battlefield background for the Phaser browser game HUMAN OVERRIDE: OVERLOAD.
Image 1 is the approved STORM SPIRE route art and establishes the region identity only. Create a NEW, distinct expanded-route sky bridge on a higher ring of the same AI weather-control spire; do not copy the existing layout.
Strict orthographic 90-degree overhead/nadir camera, exact 16:9 landscape composition. A very broad horizontal traversable armored bridge occupies the middle 72% from left edge to right edge, sized for large separated enemy formations. The central bridge deck is flat, continuous, and free of walls, holes, giant props, characters, enemies, aircraft, text, UI, arrows, logos, or perspective vanishing point.
Environment identity: dark hexagonal aerospace armor, cyan capacitor towers, restrained violet power rails, storm clouds and lightning far below, colossal turbine rings and weather antennae restricted to upper and lower margins. Add a distinctive thunder-harvesting span with grounded lightning rods, ion collectors and blue-white electrical veins at the edges, while the playable deck stays safe and uncluttered. High-detail realistic sci-fi game environment, cold blue/violet palette, crisp readable floor, not pixel art.
Make left and right bridge edges compatible in panel rhythm and lighting for unobtrusive TileSprite repetition. Outer margins clearly read as non-traversable open sky; center remains evenly illuminated and never fades into black. No labels, lettering, watermark, border, grid overlay, or interface.
```

### GENE VAULT 확장 구역 프롬프트 전문

```text
Use case: identity-preserve.
Asset type: production 2D top-down battlefield background for the Phaser browser game HUMAN OVERRIDE: OVERLOAD.
Image 1 is the approved GENE VAULT route art and establishes the region identity only. Create a NEW, distinct expanded-route containment avenue deeper in the same AI bioengineering vault; do not copy the existing layout.
Strict orthographic 90-degree overhead/nadir camera, exact 16:9 landscape composition. A very broad horizontal traversable quarantine deck occupies the middle 72% from left edge to right edge, leaving enough clear room for hundreds of separated units. The center is flat, continuous, and free of walls, pits, giant organisms, characters, enemies, creatures, text, UI, arrows, logos, or perspective view.
Environment identity: black medical alloy floor, pale bone-like biomechanical frames, emerald and teal bioluminescent growth, suspended gene capsules, sealed specimen tanks and branching synthetic tissue limited to upper and lower margins. Add a distinctive genome-splicing hall with helix conduits, cracked incubation pods, sterile white structural ribs and restrained green mist outside the playable center. High-detail realistic biotech sci-fi environment, black/ivory/teal palette, crisp readable game floor, not pixel art.
Make left and right edges compatible in deck tone and seam rhythm for unobtrusive TileSprite repetition. Margins clearly read as hazardous containment; central route stays evenly lit, dry, walkable, and free of black voids. No labels, lettering, watermark, border, grid overlay, or interface.
```

## VESPER pose refresh and Regions 04-06 top-down boss assets - 2026-08-27

- Generation source: OpenAI ImageGen, directed specifically for original HUMAN OVERRIDE production assets. No third-party game asset was copied into the runtime.
- VESPER prompt brief: preserve the established blonde bob, face, black/white/gold precision-interceptor suit, cape silhouette, and golden targeting sigil; change only to a restrained three-quarter ready pose with one hand on the hip; premium Korean/Japanese sci-fi subculture illustration; flat chroma background; no text, watermark, halo, frame, or scenery. Normalized runtime output: `public/assets/overload/hero/vesper-portrait-v7.webp`; retained production master: `reference/source-assets/overload/hero/vesper-portrait-v7-master.png`.
- Region 04 prompt brief: exact 2x2 sprite sheet on chroma, strict true-nadir top-down PRESS WARDEN in cell 1 and FORGE COLOSSUS phases 1-3 in cells 2-4; heavy industrial press machinery, orange foundry heat, centered transparent padding, no text or perspective view.
- Region 05 prompt brief: exact 2x2 sprite sheet on chroma, strict true-nadir top-down THUNDER MANTA in cell 1 and TEMPEST WYRM phases 1-3 in cells 2-4; storm conductors, cyan lightning hardware, centered transparent padding, no text or perspective view.
- Region 06 prompt brief: exact 2x2 sprite sheet on chroma, strict true-nadir top-down CHIMERA CUSTODIAN in cell 1 and PALE ARCHON phases 1-3 in cells 2-4; pale biotech armor, restrained green reactor tissue, centered transparent padding, no text or perspective view.
- Production sources: `reference/source-assets/overload/regions/neon-foundry/topdown-boss-source-v2.png`, `reference/source-assets/overload/regions/storm-spire/topdown-boss-source-v2.png`, and `reference/source-assets/overload/regions/gene-vault/topdown-boss-source-v2.png`.
- Runtime contract: midboss replaces cell 4 of each regional four-cell enemy atlas; main boss ships as a three-cell phase atlas. Full and performance variants live under each matching `public/assets/overload/regions/<region>/` directory.

## Open-source dependencies

- Phaser 4.2.1 — MIT License
- TypeScript 5.9.3 — Apache License 2.0
- React — MIT License
- Vite — MIT License
- Phosphor Icons — MIT License
- Rajdhani — SIL Open Font License 1.1
- IBM Plex Mono — SIL Open Font License 1.1
- @greenmansk/react-live2d 0.1.1 — MIT License · 과거 검증용, 현재 의존성·번들에서 제거

Live2D Cubism Core는 오픈소스 항목이 아니라 위 Live2D Proprietary Software License의
Redistributable Code이며, 현재 의존성·번들에는 포함되지 않는 과거 검증 자료입니다.

Rajdhani와 IBM Plex Mono는 번들 크기와 한국어 가독성을 위해 Latin 서브셋만 로드합니다.
Rajdhani는 영문 브랜드·표제 장식, IBM Plex Mono는 영문 텔레메트리·코드·키·숫자에만
사용합니다. 한국어 본문·대사·버튼은 별도 웹폰트 다운로드 없이 `Pretendard Variable`,
Pretendard, `Noto Sans KR`, `Apple SD Gothic Neo`, `Malgun Gothic`/`맑은 고딕`, system-ui와
플랫폼 sans 순서의 로컬 시스템 서체를 사용하므로 추가 폰트 파일 출처는 없습니다.

정확한 의존성 버전은 `package-lock.json`에 고정되어 있습니다.

## HAVEN 타워 디펜스 전용 에셋

### 방어 체계 6×4 모션 아틀라스

- 도구: OpenAI 내장 ImageGen (`image_gen`), 프로젝트 결합형 생성
- 선택 원본: `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-1e4ea91b-ab87-42e2-8611-e81cf3ad1c51.png`
- 프로젝트 보존 원본: `reference/source-assets/overload/defense/defense-systems-motion-atlas-chroma.png`
- 런타임: `public/assets/overload/defense/defense-systems-motion-atlas.png` (1536×1024, 6×4, 256px 셀)
- 저사양 파생: `public/assets/overload/defense/performance/defense-systems-motion-atlas.png` (768×512, 6×4, 128px 셀)
- 후처리: `remove_chroma_key.py --auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill`; 저사양 버전은 Pillow LANCZOS 셀별 결정론적 축소입니다. 외부 미술 에셋은 추가하지 않았습니다.

```text
Use case: stylized-concept
Asset type: production top-down defense-system motion atlas for the 2D Phaser browser game HUMAN OVERRIDE: OVERLOAD.
Primary request: create one exact 6-column by 4-row spritesheet, exactly 24 isolated square cells. Each row is one original resistance defense system, shown in six coherent animation beats from idle to charge to attack to recoil/recovery.
Row 1 — PULSE SENTRY: compact gunmetal and white automated twin pulse turret with cyan emitter.
Row 2 — ARC RELAY: triangular three-prong electromagnetic tower with cyan-violet coils and a central lightning capacitor.
Row 3 — SKYFIRE BATTERY: heavy squat artillery platform with four short missile/mortar tubes and amber targeting lights.
Row 4 — AEGIS BASTION: broad hexagonal hard-light projector with white armor, cyan shield vanes, and a protected central core.
Exact column beats for every row: c1 quiet idle, c2 tracking/activation, c3 early charge, c4 full charge, c5 attack discharge pose, c6 recoil/cooldown.
Viewpoint: strict orthographic 90-degree overhead/nadir camera in every cell; identical center pivot, scale, and footprint within each row; all parts fully inside each cell with generous padding; no perspective tilt.
Style/medium: polished cybernetic 2D game sprite illustration matching a dark near-future anime resistance game; crisp readable silhouette at 96px display size; white and gunmetal armor, cyan energy, restrained magenta accents, amber only for artillery; production asset, not concept sheet.
Composition: exact 6x4 grid filling a 3:2 landscape canvas; equal square slots; one complete defense system per cell; no overlap or crossing cell boundaries.
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background across every empty pixel for local removal. No shadows, gradients, grid lines, borders, labels, text, numbers, scenery, floor, smoke, detached projectiles, watermark, extra rows, or extra columns. Do not use #ff00ff in any defense system. Crisp separated edges, no magenta rim.
```

### HAVEN-09 외곽 방어 전장

- 도구: OpenAI 내장 ImageGen (`image_gen`), 프로젝트 결합형 생성
- 선택 원본: `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-1a21b6ee-7352-4d0e-a43d-966b0b2e193a.png`
- 프로젝트 보존 원본: `reference/source-assets/overload/defense/haven-defense-grid-source.png`
- 런타임: `public/assets/overload/defense/haven-defense-grid.webp` (1920×1080)
- 저사양 파생: `public/assets/overload/defense/performance/haven-defense-grid.webp` (960×540)
- 후처리: Pillow LANCZOS 결정론적 리사이즈와 WebP 인코딩. 외부 게임 이미지나 미술 에셋은 사용하지 않았습니다.

```text
Use case: stylized-concept
Asset type: production top-down battlefield background for a Phaser tower-defense mode in HUMAN OVERRIDE: OVERLOAD.
Primary request: a vast original cyberpunk resistance-base perimeter named HAVEN-09 under siege, designed as a readable tower-defense arena.
Viewpoint: strict orthographic 90-degree overhead/nadir camera, wide 16:9 landscape.
Layout: one defended hexagonal cyan reactor core in the lower-center area; three broad mechanical invasion routes visibly enter from upper-left, top-center, and upper-right, then curve and merge before reaching the core. Twelve clearly readable empty circular/hexagonal defense pads sit beside but never on the routes, spaced across the arena for turret placement. Keep paths wide enough for enemy formations and keep pad silhouettes unobstructed.
Environment: colossal mobile airborne base hull, dark gunmetal armor decks, cyan resistance lighting, red distant hostile warning gates at the three entry points, maintenance trenches and restrained machinery around the outer edges.
Style/medium: polished high-detail 2D game environment, dark near-future anime military science fiction, realistic metal texture with crisp tactical readability, consistent with HUMAN OVERRIDE's black/gunmetal/cyan palette.
Lighting/mood: midnight siege alert, cool cyan base light, restrained red warning light at entrances; the central battlefield remains bright enough for units and UI to read.
Constraints: environment only. No characters, enemies, towers on pads, projectiles, explosions, text, labels, numbers, logos, UI, grid overlay, watermark, perspective view, buildings covering paths, or deep black empty regions. Preserve generous clear play space and exact top-down geometry.
```

### 디펜스 적군 6×4 고프레임 아틀라스 v2

- 도구: OpenAI 내장 ImageGen (`image_gen`) + 프로젝트 로컬 결정론 후처리
- 선택 원본: `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-125115ba-24bf-41a9-a814-53057d63bbb9.png`
- 중간 산출: `exec-dab8fc68-c0f0-4e98-858c-c75be9bd1bda.png`, `exec-99337b30-15f1-401e-90aa-aeaee37f05cf.png`
- 프로젝트 보존 원본: `reference/source-assets/overload/defense/defense-enemy-motion-v2-{chroma,alpha,sanitized}.png`
- 런타임: `public/assets/overload/defense/defense-enemy-motion-atlas-v2.png` (1152×768, 6×4, 192px 셀)
- 저사양 파생: `public/assets/overload/defense/performance/defense-enemy-motion-atlas-v2.png` (864×576, 144px 셀)
- 정체성 참조: `public/assets/overload/enemies/hunter.png`, `suppressor.png`, `brute.png`, `enemies/motion-v3/siege-walker-motion-atlas.png`
- 후처리: `remove_chroma_key.py`, `scripts/sanitize-defense-enemy-atlas.py`, `scripts/normalize-motion-atlas.py`, `scripts/build-performance-assets.py`. 외부 게임 이미지는 런타임에 포함하지 않았습니다.

```text
Use case: identity-preserve.
Asset type: production 2D browser-game defense-mode enemy motion spritesheet for HUMAN OVERRIDE: OVERLOAD.
Input images: Image 1 is the approved hunter suicide drone; Image 2 is the approved armored rifleman; Image 3 is the approved heavy sniper drone; Image 4 is the approved siege walker motion identity. Preserve their black gunmetal SOVEREIGN military identity, red sensors, hard-surface detail, and readable silhouettes.
Primary request: create ONE exact 6-column by 4-row motion atlas, exactly 24 isolated square animation cells, read left-to-right.
Row 1 hunter drone: idle/hover A, hover B, fast advance, red self-destruct charge, critical blinking charge, compact mechanical rupture.
Row 2 rifleman: idle A, marching A, marching B, weapon aim, muzzle-fire recoil, armored destruction.
Row 3 sniper drone: idle A, hover B, long-range aim, red optic charge, firing recoil, shattered destruction.
Row 4 siege walker: idle A, heavy step A, heavy step B, cannon windup, cannon fire/recoil, reactor-collapse destruction.
Style/medium: polished high-detail isometric/top-down 2D game sprites, crisp hard-surface rendering, cohesive black/gunmetal armor, restrained red emissive lights, subtle cyan only on damaged electronics, production asset rather than concept art. Consistent identity and proportions across each row.
Composition/framing: exact uniform 6x4 grid filling a 3:2 landscape canvas; equal square slots; one centered complete unit per slot; shared scale and bottom-center anchor within each row; generous safety padding; no object crossing cell boundaries. Row 4 may be larger but must remain fully inside every cell.
Scene/backdrop: genuinely transparent background in every empty pixel. No scenery, floor, shadows outside the unit, labels, text, numbers, grid lines, borders, poster composition, extra objects, extra rows, extra columns, watermark, or cropped parts.
Constraints: strict 24-cell layout; same viewing angle across every frame; motion should read clearly at 64-120px in game; final column of every row must be a distinct destruction frame, not an intact idle pose.
```

```text
Use case: precise-object-edit.
Asset type: production 2D browser-game motion spritesheet correction.
Image 1 is the approved exact 6-column by 4-row defense enemy motion atlas. Preserve every unit, every animation pose, the exact 24-cell layout, scale, spacing, colors, silhouettes, weapon effects, destruction debris, and viewing angle.
Primary request: replace ONLY the fake gray-and-white checkerboard background with one perfectly flat uniform solid #ff00ff chroma-key background across every empty pixel.
Constraints: do not redraw, move, crop, resize, recolor, simplify, add, remove, or alter any unit or effect. Exactly 6 columns and 4 rows. No grid lines, no labels, no text, no shadows on the background, no gradients, no checkerboard, no texture, no watermark. Do not use #ff00ff anywhere inside the units. Crisp separated edges suitable for local chroma removal.
```

```text
Use case: precise-object-edit.
Asset type: production defense enemy motion spritesheet correction.
Image 1 is the approved exact 6-column by 4-row defense enemy atlas. Preserve rows 1, 2, and 3 exactly, including every hunter, rifleman, sniper pose, effect, scale, color, and the flat #ff00ff background.
Primary request: correct ONLY row 4, the six siege-walker cells. In every row-4 cell, scale and reposition the complete siege walker so its entire head, shoulders, upper cannons, arms, legs, muzzle flash, and destruction debris fit fully inside that single square cell with at least 12 percent clear magenta padding on every edge. Reconstruct any currently clipped top or side part using the same approved black gunmetal/red-reactor design. Keep the six beats: idle, heavy step A, heavy step B, cannon windup, cannon fire/recoil, reactor-collapse destruction.
Also remove any row-4 fragments that currently spill upward into row 3 or sideways into neighboring cells. Do not otherwise alter row 3.
Constraints: exact 6 columns, exact 4 rows, exact 24 cells; same viewing angle and stable scale across row 4; no object may cross a cell boundary. Perfectly flat uniform #ff00ff in every empty pixel. No checkerboard, scenery, floor, shadows on the background, grid lines, labels, text, numbers, watermark, extra objects, extra rows, or extra columns. Do not use #ff00ff inside any unit.
```

### 디펜스 전투 VFX 6×4 아틀라스 v2

- 도구: OpenAI 내장 ImageGen (`image_gen`) + 프로젝트 로컬 결정론 후처리
- 선택 원본: `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-d73425ba-1ada-4706-8193-2ead8b4377f7.png`
- 프로젝트 보존 원본: `reference/source-assets/overload/defense/defense-combat-vfx-v2-{chroma,alpha}.png`
- 런타임: `public/assets/overload/defense/defense-combat-vfx-atlas-v2.png` (768×512, 6×4, 128px 셀)
- 저사양 파생: `public/assets/overload/defense/performance/defense-combat-vfx-atlas-v2.png` (576×384, 96px 셀)
- 정체성 참조: `public/assets/overload/defense/defense-systems-motion-atlas.png`, `public/assets/overload/vfx/combat-fx-atlas.png`

```text
Use case: identity-preserve.
Asset type: production 2D browser-game defense-mode combat VFX spritesheet for HUMAN OVERRIDE: OVERLOAD.
Input images: Image 1 is the approved defense-system identity atlas for pulse sentry, arc relay, skyfire mortar, and aegis bastion. Image 2 is the approved general combat VFX style reference. Preserve the defense systems' cyan/amber/violet hard-light palette and the project's crisp dark sci-fi rendering language, but create new effects rather than copying existing cells.
Primary request: create ONE exact 6-column by 4-row motion atlas, exactly 24 isolated square animation cells, read left-to-right.
Row 1 PULSE SENTRY: compact cyan muzzle seed, accelerated rifle bolt, brighter bolt, armor impact, expanding cyan hit shards, fading residue.
Row 2 ARC RELAY: small violet-cyan electric node, branching charge, short chained arc burst, brighter chained impact, fractured electric sparks, fading motes. Keep each cell self-contained; do not paint a continuous beam across cell boundaries.
Row 3 SKYFIRE MORTAR: amber warning reticle, descending shell, ground contact flash, large contained orange-cyan explosion, fragmented blast ring, smoke-free fading embers.
Row 4 AEGIS BASTION: cyan shield core, hexagonal barrier forming, solid hard-light shield pulse, outward protection wave, shield shards dispersing, dim recovery ring.
Style/medium: polished high-detail 2D game VFX with crisp authored shapes, strong silhouettes, restrained bloom painted into the effect, layered pixel-sharp energy filaments, readable at 48-160px, no blurry photorealism, no excessive fog. Production sprite asset, not concept art.
Composition/framing: exact uniform 6x4 grid filling a 3:2 landscape canvas; equal square slots; one complete centered effect per slot; shared center anchor within each row; generous safety padding; no effect crosses cell boundaries.
Scene/backdrop: perfectly flat uniform solid #ff00ff chroma-key background across every empty pixel. No transparency checkerboard, scenery, floor, grid lines, borders, labels, text, numbers, logos, watermark, extra rows, extra columns, duplicate sheets, or cropped effects. Do not use #ff00ff inside any effect.
Constraints: exact 6 columns, exact 4 rows, exact 24 cells; obvious animation progression; no detached weapon/tower bodies—effects only; final frame of every row must visibly fade toward completion.
```

### HAVEN-09 세로 디펜스 전장

- 도구: OpenAI 내장 ImageGen (`image_gen`)
- 선택 원본: `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-a292d2ba-b8d7-4cb5-ae4a-0cbbca67b9a9.png`
- 프로젝트 보존 원본: `reference/source-assets/overload/defense/haven-defense-grid-portrait-source.png`
- 런타임: `public/assets/overload/defense/haven-defense-grid-portrait.webp` (720×1280)
- 저사양 파생: `public/assets/overload/defense/performance/haven-defense-grid-portrait.webp` (360×640)
- 정체성 참조: `public/assets/overload/defense/haven-defense-grid.webp`
- 후처리: Pillow LANCZOS 리사이즈와 WebP 인코딩. 외부 게임 이미지는 런타임에 포함하지 않았습니다.

```text
Use case: identity-preserve.
Asset type: production vertical mobile battlefield background for the tower-defense mode of HUMAN OVERRIDE: OVERLOAD.
Input image: Image 1 is the approved HAVEN-09 defense battlefield. Preserve its dark gunmetal orbital-base identity, cyan tactical conduits, amber lower lighting, industrial panels, and clean top-down/isometric game readability.
Primary request: recompose the same location as a tall 9:16 mobile battlefield, designed for a 720×1280 portrait game canvas. Show three clearly separated enemy approach lanes entering from the upper-left, upper-center, and upper-right, converging gradually toward a fortified cyan command core near the lower center. Include twelve subtle circular construction pads distributed evenly along and between the lanes. The lower 22 percent must remain visually quieter and darker for a translucent mobile build-command dock; the top 12 percent must remain readable and relatively uncluttered for HUD overlays.
Style/medium: polished high-detail 2D sci-fi game map, top-down tactical view with restrained perspective, sharp industrial details, coherent black/gunmetal/cyan palette, subtle depth and atmosphere, production background rather than concept art.
Composition/framing: exact portrait composition, strong vertical progression, all three lane entrances visible inside the top edge, fortified core fully inside the lower playfield, construction pads never touching the borders, generous mobile-safe margins. No giant characters, enemies, towers, projectiles, UI, icons, text, logos, numbers, labels, grid lines, watermark, or letterboxing.
Constraints: no black empty margins; background must fill the entire canvas; lane geometry must remain visible beneath transparent sprites and effects; do not replicate or tile the landscape image; create a deliberate native portrait composition.
```

### 단계별 디펜스 전장 v2

- 도구: OpenAI 내장 ImageGen (`image_gen`) + Pillow 결정론적 합성
- 선택 원본:
  - `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-4d614010-7e02-42bc-b031-d8dd81ad3ac8.png`
  - `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-de1e45da-59ba-4da9-a9d1-c95874175db3.png`
  - `imagegen-job/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-12c3395f-fbe9-4b4c-8869-aa0d91feec1c.png`
- 프로젝트 보존 원본: `reference/source-assets/overload/defense/battlefields-v2/{haven-perimeter,relay-blackout,sovereign-night-siege}-base.png`
- 런타임: `public/assets/overload/defense/battlefields-v2/<stage>/battlefield.webp` (1920×1080), `battlefield-portrait.webp` (720×1280)
- 저사양 파생: `public/assets/overload/defense/battlefields-v2/performance/<stage>/battlefield.webp` (960×540), `battlefield-portrait.webp` (360×640)
- 정체성 참조: 기존 프로젝트 원본 `public/assets/overload/defense/haven-defense-grid.webp`
- 후처리: `scripts/build-defense-battlefields.py`가 `src/defense/battlefields.json`의 코어·경로·건설 패드를 읽어 런타임 도로와 소켓을 같은 좌표로 합성하고 Pillow LANCZOS/WebP로 full·PERFORMANCE를 생성합니다. 외부 게임 미술은 포함하지 않았습니다.

HAVEN 외곽선 원본 프롬프트:

```text
Use case: precise-object-edit
Asset type: production top-down defense battlefield base for the Phaser browser game HUMAN OVERRIDE: OVERLOAD
Input image: preserve the strict 90-degree overhead camera, dense gunmetal sci-fi engineering, cyan utility lights, realistic hard-surface detail, and dark premium game-art finish of the approved defense battlefield. Redesign the layout as a clean HAVEN-09 outer perimeter deck intended for a deterministic lane overlay added later.
Primary request: create a wide 16:9 orthographic battlefield base with three visually distinct open approach sectors converging toward one luminous cyan command core in the lower-center quarter. Keep broad uninterrupted steel floor areas where three authored invasion lanes and twelve circular tower sockets can later be composited. The left approach should feel like a curved maintenance causeway, the center approach like a direct reinforced transit spine, and the right approach like a segmented cargo bypass, but do not paint explicit roads or tower pads.
Scene/backdrop: fortified airborne resistance base perimeter over a stormy night city, industrial bulkheads at the outer edges, damaged armor seams, subtle hazard lights.
Composition/framing: exact nadir camera, no perspective tilt, symmetric enough to read strategically but not mirrored, central lower core fully visible, all playable floor within frame, generous safe margins.
Color palette: black and gunmetal, cool cyan/teal lights, restrained red warning accents.
Constraints: no characters, no enemies, no towers, no text, no letters, no numbers, no UI, no grid, no painted route lines, no circular build pads, no watermark, no logo, no cropped core. Production background, not concept art.
```

중계망 정전 원본 프롬프트:

```text
Use case: precise-object-edit
Asset type: production top-down defense battlefield base for the Phaser browser game HUMAN OVERRIDE: OVERLOAD
Input image: Image 1 is the approved clean HAVEN defense deck and the project style reference. Preserve the exact strict 90-degree overhead camera, premium dark hard-surface sci-fi rendering, tactical readability, and safe wide composition, but redesign the environment completely for stage 2.
Primary request: create a wide 16:9 RELAY BLACKOUT battlefield: an enormous disabled AI communications relay platform during a storm, with a cold blue-violet palette, cracked luminous conduits, dead server pylons around the perimeter, intermittent electrical arcs and blackout sectors. Leave broad uninterrupted floor space for three later-authored invasion lanes that will take different zigzag routes toward one violet-cyan relay core in the lower-center quarter. Leave room for twelve later-authored circular tower sockets. Do not paint explicit roads or tower pads.
Composition/framing: exact nadir orthographic camera, asymmetrical machinery islands around the outer margins, relay core fully visible, playable floor clear and readable, generous safe margins.
Lighting/mood: power failure, moody indigo emergency lighting, sparse cyan circuit light and restrained violet energy, no screen-filling darkness.
Constraints: no characters, no enemies, no towers, no text, no letters, no numbers, no UI, no grid, no painted route lines, no circular build pads, no watermark, no logo, no cropped core. Production background, not concept art.
```

소버린 야간 공성 원본 프롬프트:

```text
Use case: precise-object-edit
Asset type: production top-down defense battlefield base for the Phaser browser game HUMAN OVERRIDE: OVERLOAD
Input image: Image 1 is the approved clean HAVEN defense deck and project style reference. Preserve its strict 90-degree overhead camera, premium dense hard-surface sci-fi finish, tactical readability, wide safe composition, and lower-center objective placement, but redesign the environment completely for stage 3.
Primary request: create a wide 16:9 SOVEREIGN NIGHT SIEGE battlefield on a heavily damaged fortress carrier deck under maximum red alert. The deck should feel wider, harsher and more militarized than prior stages, with scorched armor, broken barricades at the perimeter, angular black AI architecture, red reactor veins, amber fires safely outside the playable floor, and one massive crimson-white inference core in the lower-center quarter. Leave broad uninterrupted floor space for three later-authored invasion lanes with sharply different sweeping routes and twelve later-authored tower sockets. Do not paint explicit roads or tower pads.
Composition/framing: exact nadir orthographic camera, asymmetrical ruined machine bastions around the margins, core fully visible, center playable floor clear and readable, generous safe margins.
Lighting/mood: desperate final night siege, black gunmetal, deep crimson emergency light, hot amber sparks, restrained cyan resistance lights around the core; clear silhouettes, not too dark.
Constraints: no characters, no enemies, no towers, no text, no letters, no numbers, no UI, no grid, no painted route lines, no circular build pads, no watermark, no logo, no cropped core. Production background, not concept art.
```

### Active simplified command-menu icon atlas v2

- Generated: 2026-08-23
- Tool: OpenAI built-in ImageGen (`image_gen`)
- Runtime asset: `public/assets/overload/ui/campaign/command-menu-icons-v2.webp`
- Preserved ImageGen source: `reference/source-assets/overload/ui/campaign/command-menu-icons-v2.png`
- Processing: the approved solid-background source was encoded to WebP quality 88. The 68,768-byte runtime atlas is about 73% smaller than the retired v1 runtime atlas. An intermediate transparency edit was rejected because it still contained a baked checker pattern.
- Usage: the exact 3-by-3 semantic grid supplies research, equipment, navigation, defense, operative, sortie, research-data, equipment-parts, and synchronization-core symbols through CSS background positioning. Each cell uses a bold flat silhouette with restrained cyan, amber, or violet semantics and remains legible across the active 32-52px range.
- ImageGen outputs:
  - Initial simplified atlas: `C:/Users/82105/.codex/generated_images/01a020a9-e862-7e91-9f77-b464d020f8d9/exec-0b597817-d4b5-4a2a-9cfe-744bfc7f7b80.png`
  - Rejected checker-background edit: `C:/Users/82105/.codex/generated_images/01a020a9-e862-7e91-9f77-b464d020f8d9/exec-a6fe1999-f3e3-462d-af7f-d79737290739.png`
  - Approved uniform-background edit: `C:/Users/82105/.codex/generated_images/01a020a9-e862-7e91-9f77-b464d020f8d9/exec-382c91f3-0eb5-423a-a6ef-dee2eb5ed453.png`

Initial simplified command-menu atlas prompt:

```text
Use case: logo-brand
Asset type: production 3x3 raster icon atlas for a dark science-fiction browser game menu, viewed at 32-48 px per icon
Primary request: Redesign the attached 3x3 atlas into a much simpler, cleaner, more readable icon set while preserving the exact semantic position of every cell.
Input image: Image 1 is the edit target and semantic-position reference only; replace its over-detailed illustration style.
Grid mapping, preserve exactly: row 1 = research facility (three connected neural nodes), equipment workshop (single wrench crossing a hex nut), navigation/flight control (three route nodes with one forward arrow); row 2 = base defense (shield with one compact turret), operative management (minimal helmeted bust silhouette), sortie (small delta aircraft with one forward chevron); row 3 = research currency (square data chip with one pulse line), equipment-parts currency (hex bolt plus small gear), synchronization-core currency (simple faceted diamond core with one orbit ring).
Style/medium: bold flat vector-like glyphs rendered as a clean raster sprite sheet; simple geometric silhouettes; uniform heavy line weight; one symbol per cell; restrained two-tone shading only; strong negative space; no miniature illustration details.
Color palette: cyan-white for research/navigation, warm amber-white for equipment, muted magenta-white only for synchronization core; dark transparent background.
Composition: exact 3x3 equal square cells, each icon centered and scaled consistently with generous padding; no dividers, no borders, no cell backgrounds.
Constraints: genuinely transparent canvas; no text, numbers, letters, characters, faces, scenery, glow clouds, sparks, complex machinery, photorealism, anime rendering, thin circuitry, decorative fragments, watermark, or gradients that reduce small-size readability. Every icon must remain immediately recognizable at 36 px.
```

Approved uniform-background correction prompt:

```text
Use case: precise-object-edit
Asset type: production 3x3 dark-game UI icon atlas
Primary request: Replace only the checkerboard background with one perfectly uniform solid near-black navy background matching #020B10. Preserve all nine simple icons exactly: same shapes, colors, scale, positions, heavy outlines, spacing, and square canvas.
Input image: Image 1 is the precise edit target.
Constraints: change only the background; absolutely no checker pattern, texture, vignette, glow cloud, stars, noise, panel borders, cell dividers, text, or watermark. The background must be a single flat color edge to edge. Keep the exact 3x3 semantic grid.
```

### Legacy mobile menu atlas and active augmentation UI art

The former 3-by-3 menu atlas below is retained for generation provenance only after replacement by command-menu v2. The augmentation reactor remains active.

- Generated: 2026-08-21
- Tool: OpenAI built-in ImageGen (`image_gen`)
- Runtime assets:
  - Legacy provenance only: `public/assets/overload/ui/campaign/mobile-menu-icons-v1.webp`
  - `public/assets/overload/ui/campaign/augmentation-core-visual-v1.webp`
- Preserved ImageGen sources:
  - `reference/source-assets/overload/ui/campaign/mobile-menu-icons-v1.png`
  - `reference/source-assets/overload/ui/campaign/augmentation-core-visual-v1.png`
- Processing: the first generations requested transparency, but the returned RGB files contained a visible checker pattern. A second ImageGen edit replaced that pattern with the exact runtime panel color. The approved sources were encoded to WebP quality 88; no external asset was introduced.
- Usage: the former 3-by-3 menu atlas is provenance only. The reactor remains active in the permanent-augmentation console; orbit, idle pulse, purchase-charge, and reduced-motion behavior are authored in CSS and do not alter the generated pixels.

Initial mobile menu atlas prompt:

```text
Use case: stylized-concept
Asset type: production-ready 3 by 3 mobile game UI icon atlas for a dark anime science-fiction strategy action game.
Primary request: Create one exact 3-column by 3-row grid containing nine isolated, centered square menu icons, with equal cell dimensions and generous transparent padding.
Cell mapping, left to right:
Row 1: research laboratory brain made of circuit traces; equipment workshop crossed wrench and precision gear; navigation command holographic route map with small aircraft.
Row 2: base defense shield with compact turret; operative management female agent bust silhouette with tactical badge; combat sortie sleek strike aircraft with forward motion chevrons.
Row 3: research currency data chip with neural spark; equipment currency mechanical component and hex bolt; augmentation currency faceted crystalline synchronization core with orbital sparks.
Style: premium dark anime sci-fi game UI, crisp readable silhouettes at small mobile size, polished gunmetal and white materials, luminous cyan as the shared accent, restrained violet-magenta only for augmentation, restrained amber only for equipment, subtle inner glow, high contrast, consistent visual weight and viewing angle.
Composition: exact uniform 3x3 layout, each icon occupies about 68 percent of its cell, all icons aligned and optically centered; transparent gutters between cells.
Scene/backdrop: genuinely transparent alpha background.
Constraints: no text, no letters, no numbers, no labels, no borders, no cell frames, no grid lines, no logos, no watermark, no scenery, no characters beyond the simple agent bust pictogram, no gradients extending outside each icon silhouette.
```

Menu atlas background-correction prompt:

```text
Edit this exact 3x3 icon atlas. Preserve all nine icons, their exact order, equal 3x3 cell layout, scale, lighting, and crisp details. Replace every checkerboard square and all background pixels with one perfectly uniform, flat very-dark navy color #020b10. The background must contain no checker pattern, no texture, no grid, no border, no vignette, no glow bands, and no visible separators between cells. Keep the icons isolated and centered with the existing empty gutters. No text, labels, numbers, logo, or watermark. Production game UI atlas, square canvas.
```

Initial augmentation reactor prompt:

```text
Use case: stylized-concept
Asset type: production-ready transparent augmentation reactor artwork for a premium dark anime science-fiction mobile game UI.
Primary request: A single centered cybernetic synchronization core: a luminous faceted violet-magenta crystal suspended inside a compact gunmetal cradle, surrounded by three concentric segmented cyan energy rings and three short mechanical connector arms. The core should communicate character enhancement, permanent upgrade, and power synchronization.
Style: polished premium sci-fi game interface asset, sharp hard-surface metal, crystalline refraction, restrained cyan and violet-magenta emission, subtle white-hot center, crisp silhouette, high contrast and readable at 160 pixels, sophisticated rather than cartoonish.
Composition: exact square canvas, object centered, roughly 78 percent of canvas, frontal three-quarter HUD emblem view, symmetrical overall silhouette, clear negative space between the crystal, rings, and connector arms so separate CSS ring animations feel visually plausible.
Lighting: internal magenta core light plus cyan rim lights, controlled bloom confined to the object.
Scene/backdrop: genuinely transparent alpha background.
Constraints: no text, no letters, no numbers, no labels, no frame, no panel, no character, no hands, no scenery, no logo, no watermark, no checkerboard pattern baked into the image.
```

Augmentation reactor background-correction prompt:

```text
Edit this exact cybernetic augmentation reactor artwork. Preserve the crystal, all concentric ring segments, three connector assemblies, symmetry, lighting, scale, and crisp details. Replace every checkerboard square and all background pixels with one perfectly uniform, flat near-black blue color #02080d. The background must have no checker pattern, no texture, no panel, no border, no vignette, no scenery, and no glow beyond a tight halo around the object. Keep the object centered on the square canvas with clean negative space. No text, labels, numbers, character, logo, or watermark. Production game UI asset.
```

### Active square expedition arenas v1

- Generated: 2026-08-22
- Tool: OpenAI built-in ImageGen (`image_gen`), precise-object-edit mode using the approved route art as the visual reference for each region.
- Preserved production sources: `reference/source-assets/overload/regions/<region>/arena-square-v1.png` for `wrong-engine-core`, `glass-dune`, `abyssal-archive`, `neon-foundry`, `storm-spire`, and `gene-vault`.
- Runtime: `public/assets/overload/regions/<region>/arena-square-v1.webp` (1254×1254, WebP quality 88).
- Performance runtime: `public/assets/overload/regions/<region>/performance/arena-square-v1.webp` (768×768, WebP quality 82).
- Processing: `scripts/build-expedition-arenas.py` validates the square sources and performs deterministic Pillow LANCZOS resizing and WebP encoding. No external asset was introduced.
- ImageGen outputs:
  - `C:/Users/82105/.codex/generated_images/01a020a9-e862-7e91-9f77-b464d020f8d9/exec-287d1a58-be31-4531-9aab-7661de3c2fec.png`
  - `C:/Users/82105/.codex/generated_images/01a020a9-e862-7e91-9f77-b464d020f8d9/exec-0ca978de-325b-4649-99d0-4b190919c075.png`
  - `C:/Users/82105/.codex/generated_images/01a020a9-e862-7e91-9f77-b464d020f8d9/exec-70f1476b-8c70-4205-b97b-ce1c2827aac9.png`
  - `C:/Users/82105/.codex/generated_images/01a020a9-e862-7e91-9f77-b464d020f8d9/exec-7a0ffdc1-46c2-40a5-9508-215a008e5bcf.png`
  - `C:/Users/82105/.codex/generated_images/01a020a9-e862-7e91-9f77-b464d020f8d9/exec-68a72f13-de79-4824-81c9-ebdf999e3d31.png`
  - `C:/Users/82105/.codex/generated_images/01a020a9-e862-7e91-9f77-b464d020f8d9/exec-e30f6039-a0fa-4b65-a72d-755e1358bf49.png`

WRONG ENGINE prompt:

```text
Use case: precise-object-edit
Asset type: square top-down 2D action-game battlefield texture
Primary request: Recompose the supplied WRONG ENGINE industrial causeway environment into a large square combat arena for free 360-degree movement.
Scene/backdrop: rain-darkened black steel megastructure floor, cyan utility lights, damaged machinery and restrained red warning lights matching the source.
Style/medium: cinematic realistic sci-fi game environment, orthographic top-down view.
Composition/framing: exact square; broad traversable floor across the center and all four directions; environmental machinery forms readable boundaries only around the outer edges; subtle radial and cross-floor paneling, no single horizontal corridor.
Lighting/mood: dark, wet, oppressive, readable floor silhouettes.
Constraints: preserve the source palette, materials, lighting language, and top-down camera; clean playable center covering roughly 78% of the image; no characters, enemies, vehicles, UI, text, logos, watermark, perspective horizon, or black void; all four edges fully painted.
Avoid: narrow lane, side-scrolling road, strong left-to-right direction, central obstacle, tiny repeated props.
```

GLASS DUNE prompt:

```text
Use case: precise-object-edit
Asset type: square top-down 2D action-game battlefield texture
Primary request: Recompose the supplied GLASS DUNE environment into a large square arena for unrestricted 360-degree combat movement.
Scene/backdrop: fractured obsidian glass desert fused with dark SOVEREIGN machinery, pale broken glass plates, amber-gold circuitry and crystal shards matching the source.
Style/medium: cinematic realistic sci-fi game environment, orthographic top-down view.
Composition/framing: exact square; wide unobstructed central basin with playable space extending north, south, east, and west; crystalline machinery only near the outer perimeter; subtle circular fracture patterns that do not block movement.
Lighting/mood: dry, hostile, dark charcoal with restrained amber gleam and readable ground.
Constraints: preserve source palette, materials, and texture density; open playable floor roughly 78% of image; no characters, enemies, vehicles, UI, text, logos, watermark, horizon, black void; fully painted square edges.
Avoid: horizontal corridor, directional road, central wall, large impassable crystal in the center, decorative clutter that hides units.
```

ABYSSAL ARCHIVE prompt:

```text
Use case: precise-object-edit
Asset type: square top-down 2D action-game battlefield texture
Primary request: Recompose the supplied ABYSSAL ARCHIVE environment into a large square arena supporting free 360-degree movement.
Scene/backdrop: submerged archive deck of black metal plates, cyan-blue glass reservoirs, violet memory conduits, condensation and faint water reflections matching the source.
Style/medium: cinematic realistic sci-fi game environment, orthographic top-down view.
Composition/framing: exact square; broad open archive floor in the center and in all four directions; biomechanical archive equipment and glass chambers form only the outer perimeter; subtle concentric floor seals.
Lighting/mood: deep oceanic darkness, cyan bioluminescence, restrained violet accents, strong unit readability.
Constraints: preserve source palette, materials, lighting language, and top-down camera; open playable floor roughly 78% of image; no characters, enemies, UI, text, logos, watermark, horizon, or black void; all four edges fully painted.
Avoid: narrow hallway, left-right lane, central obstacle, bright bloom across the playable floor, excessive visual noise.
```

NEON FOUNDRY prompt:

```text
Use case: precise-object-edit
Asset type: square top-down 2D action-game battlefield texture
Primary request: Recompose the supplied NEON FOUNDRY environment into a large square arena supporting unrestricted 360-degree movement.
Scene/backdrop: black iron foundry floor, industrial presses, furnace windows, molten orange channels and cold blue coolant columns matching the source.
Style/medium: cinematic realistic sci-fi game environment, orthographic top-down view.
Composition/framing: exact square; broad open forge floor across the center and all four directions; heavy machinery and molten channels safely confined to the outer perimeter; subtle radial forging marks and floor seams.
Lighting/mood: hot amber furnace glow balanced by cool cyan accents, dark but readable combat floor.
Constraints: preserve source palette, materials, and detail language; open playable floor roughly 78% of image; no characters, enemies, UI, text, logos, watermark, horizon, black void, or impassable central machinery; fully painted edges.
Avoid: horizontal production lane, left-right corridor, excessive sparks over the play area, high-contrast clutter under units.
```

STORM SPIRE prompt:

```text
Use case: precise-object-edit
Asset type: square top-down 2D action-game battlefield texture
Primary request: Recompose the supplied STORM SPIRE environment into a large square arena for free 360-degree aerial-platform combat.
Scene/backdrop: armored hexagonal storm deck suspended over thunderclouds, cyan energy pylons, violet conductor rails and lightning glimpses matching the source.
Style/medium: cinematic realistic sci-fi game environment, orthographic top-down view.
Composition/framing: exact square; expansive navigable hex-grid deck in the center and all four directions; storm machinery and rails form a secure outer rim; subtle concentric conductor rings in the floor.
Lighting/mood: cold electric blue, restrained violet arcs, storm-dark atmosphere, clear unit silhouettes.
Constraints: preserve source palette, materials, and top-down camera; open playable deck roughly 78% of image; no characters, enemies, UI, text, logos, watermark, horizon, black void, holes, or central obstacles; all edges fully painted.
Avoid: narrow bridge, horizontal lane, bright lightning covering the playable floor, large turbines in the center.
```

GENE VAULT prompt:

```text
Use case: precise-object-edit
Asset type: square top-down 2D action-game battlefield texture
Primary request: Recompose the supplied GENE VAULT environment into a large square arena supporting unrestricted 360-degree movement.
Scene/backdrop: dark biotech vault floor, ivory biomechanical ribs, teal gene fluid chambers, helix conduits and subtle organic growth matching the source.
Style/medium: cinematic realistic biomechanical sci-fi game environment, orthographic top-down view.
Composition/framing: exact square; large open slate-metal floor extending in every direction; ivory frames, teal tanks and DNA conduits form only the outer perimeter; subtle circular genomic inlay in the floor.
Lighting/mood: clinical teal glow, bone-white machinery, dark restrained atmosphere, readable combat floor.
Constraints: preserve source palette, materials, and texture language; open playable floor roughly 78% of image; no characters, creatures, enemies, UI, text, logos, watermark, horizon, black void, or central obstacle; all edges fully painted.
Avoid: left-right corridor, huge biological specimen in center, excessive organic clutter, bright reflections under units.
```

## SERA NIGHTJAR 수석 조종사 (2026-08-25)

- 런타임 에셋: `public/assets/overload/ui/npcs/sera-nightjar-pilot-v1.png`
- 원본 보관: `reference/source-assets/overload/campaign/sera-nightjar-pilot-imagegen-v1.png`
- 사용자 제공 스타일 참고 이미지: `C:/Users/82105/Downloads/2a723c994b807d5df5f4d1fbc307f8d8bf0938fe216f3c88465250eae41ef868.webp`
- 생성 도구: OpenAI ImageGen
- 참고 이미지의 헤어 실루엣·신체 비율·셀 렌더링 방향만 참고하고 얼굴, 복장, 장비, 포즈, 문양은 복제하지 않은 오리지널 성인 캐릭터입니다.
- 투명 배경 생성 결과에 체크 패턴이 픽셀로 포함되어, 최종 에셋은 UI 패널과 자연스럽게 합쳐지는 저채도 네이비 비행 관제 배경으로 교체했습니다.
- 최종 머리 보정에서는 목덜미의 청백색 모근이 짙은 청록색 땋은 머리로 연속되도록 연결부만 수정했습니다.

초기 생성 프롬프트:

```text
Use case: stylized-concept
Asset type: production browser-game NPC full-body transparent cutout

Input images: Image 1 is a style reference only, not an edit target. Borrow only the crisp premium anime cel-rendering, clean facial readability, bright cyan/white palette, and polished subculture-game finish. Create a distinctly original character.

Primary request: Create an original adult female NIGHTJAR airship pilot NPC named SERA for the sci-fi game HUMAN OVERRIDE.

Subject: confident, approachable ace pilot; short windswept aqua-silver hair; amber-cyan eyes; asymmetrical aviation headset with boom mic and a glowing navigation earpiece; cropped white and graphite flight jacket over a fitted navy pressure suit; safety-orange and cyan accents; flight harness; pilot gloves; utility belt; knee-high flight boots. One hand touches the headset in a crisp salute, the other holds a compact holographic route tablet. Strong unmistakable pilot silhouette. No hood and no robot face.

Style: high-end Korean/Japanese sci-fi subculture game character illustration; crisp cel shading with subtle polished gradients; clean linework; coherent anatomy; premium production finish; original design.

Composition: full body from head to boots, upright three-quarter pose, centered, generous transparent padding, readable when displayed at about 300px wide in a game UI.

Background: genuinely transparent alpha.

Constraints: original character only. Do not copy the reference character's face, costume, hair ornaments, mechanical scooter/weapon, exact pose, or emblem. No text, logo, watermark, frame, UI, or background. Do not crop head, hands, or feet. Correct hands and anatomy. No white matte or halo around the cutout.

Avoid: photorealism, grim hooded android, gothic cloak, weapon, vehicle, exaggerated fanservice, childlike proportions.
```

배경 교체 프롬프트:

```text
Edit Image 1 only. Preserve the pilot character exactly: face, hair, headset, white/graphite jacket, navy pressure suit, safety-orange/cyan accents, pose, full-body framing, proportions, and holographic route tablet.

Replace the baked checkerboard with a clean, premium, very dark navy-black airship flight-gantry backdrop designed to disappear naturally into a sci-fi game UI panel. Use a restrained vertical gradient from #06131a at the top to #02070b at the bottom, one subtle cyan rim light behind the pilot, extremely faint technical grid lines, and no visible room objects. Keep maximum contrast around pale hair, white jacket, gloves, and boots. The background must be visually quiet and nearly black so the character remains the sole focal point.

No checkerboard, no white or gray backdrop, no border, no frame, no text, no logo, no watermark, no UI labels, no added props, no cropping, no anatomy changes, no halo.
```

헤어스타일·체형 조정 프롬프트:

```text
Edit Image 1 as the target character. Image 2 is the required hairstyle and body-proportion reference.

Keep Image 1's original SERA pilot identity: adult female ace pilot, aviation headset with boom mic, white/graphite cropped flight jacket, navy pressure suit, cyan and safety-orange accents, harness, gloves, utility belt, flight boots, holographic route tablet, confident salute, premium sci-fi anime cel rendering, and dark navy flight-control backdrop.

Change SERA to match Image 2's hairstyle silhouette and body type as closely as possible:
- Hairstyle: pale ice-aqua hair; smooth asymmetrical chin-length bob framing the face; a pronounced curled ahoge at the crown; the back hair gathered into a long, thick, dark blue-aqua low braid/ponytail that curls behind the shoulder; softly rounded bangs and side locks. Do not include Image 2's flower hair ornament.
- Body type and proportions: tall, slender, elegant, long-legged, narrow waist, slim shoulders and limbs, graceful subculture-game proportions matching Image 2; reduce the athletic/bulky build from Image 1. Keep her clearly adult.
- Facial feeling: friendly, bright, composed young adult pilot, but create a distinct original face and eye shape rather than copying Image 2 exactly.

Composition: full body, head to boots, same upright three-quarter pilot pose, no crop. Keep the route tablet clearly visible. The new hair tail must remain readable against the dark backdrop.

Background: retain the clean near-black navy flight-control gradient and faint technical grid from Image 1; no checkerboard.

Do not copy Image 2's dress, flowers, weapon/vehicle, exposed-shoulder outfit, emblems, exact face, exact pose, or accessories. No text, logo, watermark, border, frame, extra limbs, bad hands, or anatomy distortion.
```

최종 뒷머리 연결 보정 프롬프트:

```text
Edit Image 1 only. This is a surgical character-art correction.

Preserve everything exactly: SERA's face, expression, ice-aqua asymmetrical bob, curled ahoge, body proportions, pilot headset, white/graphite flight jacket, navy pressure suit, orange/cyan details, pose, tablet, full-body framing, lighting, rendering style, and dark flight-control background.

Fix only the rear hairstyle. The long dark blue-aqua braid currently appears disconnected. Make it anatomically and visually continuous:
- show the rear section of the pale aqua bob naturally sweeping behind the left ear and around the occipital area;
- gather those strands into a clearly visible, snug low ponytail base at the nape;
- transition smoothly from pale aqua roots through a subtle blue gradient into the thick dark blue-aqua braid;
- place the braid root behind the headset/neck and above the jacket collar, with a believable tie and overlapping hair strands;
- ensure the braid emerges from the center-left nape, not from empty space behind the shoulder;
- preserve the braid's existing length and curl, but make its attachment unambiguous at thumbnail size.

No second ponytail, no floating hair, no detached braid, no hair clipping through the jacket or headset, no new ornament, no flower, no text, no logo, no anatomy changes.
```

## VESPER 신규 전투원 원화 · 2026-08-25

- 도구: OpenAI 내장 ImageGen. 사용자가 제공한 금발 여성 캐릭터 이미지는 실루엣·색 조합·성인 여성 전투원이라는 방향을 이해하기 위한 참고 자료로만 사용했으며, 얼굴·의상 구조·표식·장비는 복제하지 않은 프로젝트 오리지널 디자인입니다.
- 콘셉트: 성인 여성 정밀 요격 전투원 `VESPER / 베스퍼`. 금발 단발, 흑연색 전술 바디슈트, 비대칭 백색 장갑 패널, 절제된 적색 코트 테일, 호박색 센서, 접이식 레일 피스톨을 사용하는 HAVEN-09 고기동 사수입니다.
- 생성 지시 요약: 투명 추출용 단색 크로마 배경, 머리부터 부츠까지 보이는 전신 3/4 자세, 프리미엄 SF 서브컬처 게임 캐릭터 시트, 정확한 성인 해부학과 손, 읽기 쉬운 실루엣, 텍스트·로고·워터마크·기존 IP 표식 금지.
- 현재 런타임 파일: `public/assets/overload/hero/vesper-portrait-v7.webp` (864×1536 표시 크기 최적화 알파 WebP, 로비·전투원 정보·대화 안전영역 포함).

### NPC/VESPER 공통 규격 재제작 · 2026-08-26

- 생성 도구: OpenAI ImageGen. 기존 캐릭터의 얼굴·헤어·복장·역할·색상 정체성을 유지하는 재구성 작업으로 생성했습니다.
- 공통 생성 지시: premium semi-realistic Korean/Japanese sci-fi subculture illustration, coherent anatomy, refined painterly material rendering, no text/UI/watermark, no baked outline or halo, flat `#00FF00` chroma background for deterministic alpha extraction. SERA와 ILYA는 2026-08-27 이 공통 NPC 화풍에 맞춰 재제작했으며, SERA는 짧은 보브 헤어를 사용하고 ILYA는 머리 위 안전 여백을 명시적으로 확보했습니다.
- NPC 생성 지시: HANA, ILYA, SERA, RHEA를 동일한 카메라 거리와 가슴 아래까지의 상반신 구도로 재구성하고, 머리 위 여백과 어깨 폭을 통일했습니다. ILYA만 남성 체격 고증을 위해 약간 더 크게 구성했습니다.
- VESPER 생성 지시: 기존 금발 정밀 요격수의 얼굴·단발·검정/백색/금색 장갑·적색 망토·홀로그램 조준 장치를 유지하고, AEGIS/MIKA와 같은 세로 캔버스에서 머리부터 허벅지 중간까지만 보이도록 재구성했습니다.
- 무손실 생성 원본: `reference/source-assets/overload/portraits/chroma/hana-upper-v2-chroma.png`, `ilya-upper-v4-chroma.png`, `sera-upper-v4-chroma.png`, `rhea-upper-v3-chroma.png`, `vesper-mid-thigh-v7-chroma.png`.
- 런타임 출력: NPC 4종은 768×768 알파 WebP, VESPER는 864×1536 알파 WebP이며 `scripts/build-runtime-portraits.py`의 크로마 제거·색 번짐 억제·표시 크기 최적화 파이프라인으로 생성했습니다.
- 이전 런타임 원본 보존: `public/assets/overload/hero/vesper-portrait-v1.png` (871×1595, RGB 녹색 크로마 원본 · colorType 2). v1은 비교·재처리 이력이며 현재 매니페스트에서 사용하지 않습니다.
- 후처리: `scripts/process-character-chroma.py`가 녹색 크로마 제거, 가장자리 색 오염 완화, 투명 여백 정리, 런타임 크기 최적화를 재현합니다. v2는 캐릭터 정보·잠금 미리보기·태그 컷인에서 배경 없는 원본 실루엣을 유지합니다.
- 해금/표시 원칙: `abyssal-archive` 최초 클리어 전에도 캐릭터 정보 화면에서 잠금 상태로 원화를 볼 수 있지만 출격 선택은 거부합니다. 클리어 후 정식 전투원으로 합류합니다.

## Live2D/Cubism 현재 런타임 상태 · 2026-08-25

사용자 검수에서 낮은 완성도와 오류성 변형이 확인되어 `@greenmansk/react-live2d`, Cubism Web Core, AEGIS/MIKA 모델·텍스처·모션 번들을 프로덕션에서 제거했습니다. 현재 로비는 승인된 정적 전신 원화를 사용합니다. CSS 위치 이동, 홍조, 얼굴선 또는 전신 확대·축소를 Live2D처럼 보이게 하는 대체 모션도 적용하지 않습니다. 위의 과거 제작 기록과 프롬프트는 출처 이력일 뿐 현재 기능 설명이 아닙니다.

## 현재 캐릭터·NPC 프레젠테이션 정책 · 2026-08-25

- 대화창 NPC 일러스트는 상반신만 표시하고 클릭 상호작용을 제공하지 않습니다. 본문 글자와 초상은 서로 겹치지 않는 독립 영역을 사용합니다.
- HANA 연구실, ILYA 정비소, SERA 항로 관제 같은 상세 화면만 NPC 일러스트 클릭 반응을 제공합니다. 일러스트는 카드 박스에 축소하지 않고 화면 좌측 하단에 크게 고정하며 SERA는 허벅지 중간까지 보이게 자릅니다.
- 전투원 정보의 VESPER도 허벅지 중간 프레이밍을 사용하고, 잠금 상태에서 원화·역할·해금 조건은 열람 가능하되 출격·태그 선택은 차단합니다.
- 태그 사이드 컷인은 동일한 승인 캐릭터 원화를 얼굴 중심으로 재프레이밍한 UI 파생 표시입니다. 별도 외부 이미지나 제3자 에셋을 추가하지 않습니다.


## 2026-09-06 신규 사용자 제공 BGM

기지 방어전, 영입·동기화, 네온 주조구, 폭풍 첨탑, 생체 금고의 5곡을 원본 그대로 추가했다. 현재 총 10곡이다. 원본 파일명·런타임 경로·SHA-256·길이·후처리 여부는 [음원 반입 기록](docs/audio/music-import-2026-09-06.md)에 보존한다. 기존 5곡의 아래/앞선 프롬프트와 출처 기록은 변경하지 않는다.

## Current combat sprite production — 2026-09-06

The active `public/assets/overload/quality-v3/` plates were generated and refined with the built-in OpenAI ImageGen tool in Codex. AEGIS rifle/sword reuse approved original art with technical framing normalization; 26 other source plates were generated for this pass. Historical prompts above remain unchanged. The exact execution requests, including all template substitutions and correction prompts, are preserved in [sprite-quality-prompts-2026-09-06.md](docs/art/sprite-quality-prompts-2026-09-06.md).

The active source-to-output mapping, original generated filenames, actual source grids, row cuts, held frames, body framing and mobile sizes are in `scripts/sprite-quality-recipes.json`. Originals are retained under `reference/source-assets/overload/sprite-quality-v3/`. `scripts/build-sprite-quality-assets.py` performs chroma/black-matte extraction and per-cell packaging, not generative drawing. Rejected flattened checkerboards, incorrect viewpoints and MIKA firearm drafts are not active assets. The two extracted AEGIS rows are derivatives, not additional independent artwork. [Implementation and review limits](docs/art/sprite-quality-implementation-2026-09-06.md).

## 전투 프레임 분리 수정 - 2026-09-06

생체금고 보스와 검 수동 스킬의 맞닿은 원본을 ImageGen으로 수정했다. 수정 원본은 각각 `exec-79a87c9b-8b44-4de8-a73f-85c0c6ab397e.png`, `exec-43c913d2-07e8-4358-89f5-b016e162b03f.png`이며 `reference/source-assets/overload/sprite-quality-v3/*-isolated.png`로 별도 보존한다. 기존 생성 원본·프롬프트는 유지한다. 나머지 시트는 실제 프레임 경계로 재분리했다. [정확한 수정 요청과 검증 기록](docs/art/sprite-frame-isolation-fix-2026-09-06.md)을 참조한다.

### NPC 표시 보정 - 2026-09-06
기존 하나·일리야·세라·레아 WebP 원본을 그대로 사용하며 새 이미지 생성은 없다. 정수리와 턱 기준의 공통 React/CSS 카메라 및 반응형 대화창 배치를 적용했다.

## Current runtime note - 2026-09-06 sortie UI

The two-member formation and Korean operation briefings are code/content updates. Boss previews reuse the approved quality-v3 atlases with their correct 6x4 or 8x4 grids. No artwork or audio was generated for this change. Independent head displacement/roll in the intermediate operative portrait effect is disabled; click dialogue and breathing remain. This is not a new Cubism model.

## Sector 01 procedural 3D environment - 2026-09-06

The transport yard, cooling tanks, turbines, relay towers, rail tracks, grates and engine-core arena are original procedural mesh/material work in `src/render/sectorOne/`. Canvas textures are deterministic code-authored steel, grime, signs and contact shadows. No external 3D model, generated image, or new audio was used. Existing approved operative/enemy/boss/VFX artwork remains active. Three.js 0.185.1 (MIT) is a new runtime dependency; `@types/three` 0.185.4 is development-only. Preserve their upstream license notices during distribution.

## 전 구역 3D 전장과 구조물 파괴 - 2026-09-06

1구역에 이어 2-6구역의 일반 전장과 보스방에도 실시간 3D 환경을 적용했다. 전투원·적·보스·스킬은 기존 2D 표현을 사용한다. 지형은 Three.js 메시와 절차적 재질로 제작했다.

- 2구역 유리 사구: 모래 바닥, 수정 군집, 반사경 기둥과 외곽 사구.
- 3구역 심연 기록고: 매립 데이터 통로, 서버 설비, 기록 기둥과 침수된 외곽 설비.
- 4구역 네온 주조구: 격자로 덮인 용융 통로, 소형 용광로, 대형 프레스와 배기 설비.
- 5구역 폭풍 첨탑: 고가 갑판, 축전기, 코일 기둥과 회전하는 외곽 풍력 설비.
- 6구역 생체 금고: 육각 격실 바닥, 배양조, 생체 기둥과 외곽 격리 설비.

각 일반 전장은 서로 다른 배치의 구조물 10개를 갖는다. 냉각 탱크·수정 군집·낮은 서버·소형 용광로·축전기·배양조는 양측 일반 탄환과 검 공격으로 파괴할 수 있다. 피격 시 내구도 표시가 나타나고, 파괴되면 붕괴와 파편 연출 뒤 낮은 잔해가 남는다. 잔해는 이동과 사격을 막지 않는다. 대형 기둥과 프레스는 파괴되지 않으며, 보스방 내부는 회피 공간을 위해 비워 둔다. 다른 광역·공중 능력은 기존 공격 규칙을 따른다.

구조물 상태는 결정론적 전투 엔진이 관리하며, 파괴 즉시 충돌 목록·2D 대체 표시·미니맵에서 제거한다. 구조물 파괴는 적 처치 수, 경험치, 권역 진행도를 올리지 않는다. 새 출격에서는 설비 내구도가 복구된다. 작전 공략에도 파괴 가능한 설비와 우회할 구조물을 한국어로 설명한다. WebGL 2 장애 시 기존 배경과 같은 위치의 2D 충돌 표시로 전환한다.

검증: 관련 집중 테스트 168개와 TypeScript 검사 통과. 2-6구역 각각의 일반 전장·보스방, 실제 탄환에 의한 파괴, 지면 좌표 정렬, 그래픽 컨텍스트 손실·복구와 종료 후 캔버스 정리를 브라우저에서 확인했다. 6구역은 실제 앱의 출격·HUD·미니맵과 390x844 / 844x390 모바일 표시를 추가 확인했다. 지면 정렬 오차는 검수점에서 0.001px 미만이었다. 전체 캠페인 완주, 실물 모바일 성능 측정, 전체 프로덕션 빌드 및 신규 배포는 이 변경의 검증 범위에 포함하지 않았다. 로컬 서버에서 테스트할 수 있다.


## 출격 준비 및 방어전 UI 보정 - 2026-09-06

출격 준비에 들어오면 현재 전투원을 선봉으로 유지하고 해금된 다른 전투원 한 명을 예비로 자동 선택한다. 해금된 전투원이 한 명이면 단독 편성이며, 사용자가 예비를 제외하면 그 선택을 유지한다. 태그는 선택된 최대 두 명 사이에서만 가능하다.

여섯 구역의 3D 전장과 보스방에서 중앙 바닥 문구를 제거했다. 1-3구역 자폭 드론 원본은 붉은 전면부가 오른쪽을 향하므로 불필요한 90도 회전 보정을 제거했다. 보행형 적과 보스의 발 아래 방향 규칙, 외곽 비행체의 원본 방향 보정은 유지한다.

권역 지도와 구역 선택 제목은 좌측 상단에 배치하고 뒤로가기 버튼과 설명 사이에 간격을 확보했다. 전투원 상호작용 말풍선은 얼굴 아래로 내리고 캐릭터 영역 안쪽에 고정했다.

방어전은 상단 상태, 전장, 하단 명령을 분리한다. 넓은 화면은 다섯 명령 구역을 쓰며, 1300px 이하 또는 낮은 가로 화면에서는 포탑 건설/포대 관리/전술 명령 탭을 사용한다. 안내창은 1열 본문과 실제 대상 크기를 측정한 강조 테두리를 사용한다. 포탑 이름과 비용, 공격력/사거리/공격 간격, 강화/철거/전문화 정보를 읽을 수 있게 정리했다. ESC는 일시정지/재개이며 기지 복귀는 명시적인 버튼을 사용한다. 설치 후 다음 빈 패드 자동 선택은 유지한다.

검증: TypeScript와 관련 63개 테스트 통과. 실제 브라우저에서 1440x900, 390x844, 844x390 방어전 가이드 4단계, 설치/강화/전문화/판매/공세 시작/ESC 일시정지를 확인했다. 1920x900 및 390x844 구역 선택과 기본 두 명 출격, 네 캐릭터의 데스크톱/모바일 말풍선, 1-3구역 실제 전투의 3D 표시를 확인했다. 전체 캠페인 클리어와 실기기 성능 인증은 포함하지 않는다. 이번 변경은 로컬 수정이며 별도 배포하지 않았다.


## Downloaded sound effects · 2026-09-08

Kenney (https://kenney.nl), CC0-1.0: Sci-fi Sounds, Impact Sounds, Interface Sounds, RPG Audio. 38 selected source files, adapted as mono PCM16 WAV with trimmed/faded tails and controlled levels. Original files and license texts are retained. Per-file attribution, URLs, processing and SHA-256 records: [Sound sources](docs/audio/sfx-sources.json); [integration notes](docs/audio/README.md).
