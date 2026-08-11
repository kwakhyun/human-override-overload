# Assets, Tools, and Licenses

## Project-original game assets

아래 이미지는 모두 이 프로젝트 전용으로 OpenAI 내장 이미지 생성 도구를 사용해 제작했습니다.
외부 게임 에셋 팩이나 타인의 게임 이미지는 사용하지 않았습니다.

### Active unified overhead production set

- 생성일: 2026-08-10
- 생성 도구: OpenAI 내장 ImageGen
- 스타일 기준 원본:
  - `public/assets/overload/vfx/pixel/manual-ability-pixel-atlas.png`
  - `public/assets/overload/vfx/pixel/automatic-skill-pixel-atlas.png`
- 후처리: ImageGen `remove_chroma_key.py`, Pillow 기반 `scripts/prepare-overload-art.py`
- 공통 카메라 규칙: 인게임 배우와 장비는 천장 카메라의 엄격한 90° 정사영 탑다운,
  중앙 회전 피벗, 화면 오른쪽 기본 전방. 정면 상반신 대사 포트레이트만 예외입니다.
- 런타임 경로:
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
  - 대사 런타임 경로: `public/assets/overload/hero/survivor-portrait.png`
  - 후처리: ImageGen `remove_chroma_key.py` edge-contract 1로 초록 배경만 투명화. 인물은
    재생성하지 않았고, React 대사 패널에서 머리·어깨·상반신만 확대 크롭합니다.
- ImageGen 제작 원본:
  - `reference/source-assets/overload/hero/silver-aegis-true-nadir-seed-chroma.png`
  - `reference/source-assets/overload/hero/silver-aegis-true-nadir-motion-atlas-chroma.png`
- 인게임 런타임 경로:
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
- HANA·ILYA·LARK 3×1 포트레이트 아틀라스
  - 제작 원본: `reference/source-assets/overload/campaign/haven-npc-portraits-imagegen-source.png`
  - 투명화 원본: `reference/source-assets/overload/campaign/haven-npc-portraits-alpha.png`
  - 런타임: `public/assets/overload/ui/npcs/haven-npc-portraits-atlas.png`
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

### AEGIS aim-relative 72-frame motion atlas v2

- 생성일: 2026-08-10
- 생성 도구: OpenAI 내장 ImageGen
- 활성 런타임 경로: `public/assets/overload/hero/survivor-motion-atlas-v2.png`
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
  - `<local-user>/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-d86d9558-2fee-4ab0-a553-73e320d4878f.png`
    (정지 사격)
  - `<local-user>/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-8169474a-f7fd-4428-8af6-800feebac54c.png`
    (대기·대시·피격·전투불능 수정본)
  - `<local-user>/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-5dd388f0-9c8b-4440-9380-f77284bd6cca.png`
    (조준 상대 이동)
  - `<local-user>/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-ddef8066-4fd2-4832-b747-47c1952a0da9.png`
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
  `<local-user>/.codex/generated_images/019feaad-b25d-7603-9a36-51ea149f536c/exec-2b28696a-0165-4456-b4e0-4229098f4831.png`
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
  - 자폭 드론: `<local-user>/.codex/generated_images/019fe9ec-02f3-7e00-abab-60a877f9d538/exec-c60f2d41-9dbb-48e2-bd8c-b5abf5b50366.png`
  - 소총수: 같은 폴더의 `exec-546518e0-e3ab-49d0-8471-2cd9e2997ed4.png`
    (`exec-f726ec44-0103-4146-b8b1-cb1c799e398e.png` 7열 반려본도 보존)
  - 저격수: 같은 폴더의 `exec-b2b70e88-251e-4cc0-b0e5-51310d324aa3.png`
  - 헌터 드론: 같은 폴더의 `exec-65577cc6-7c6c-4237-809d-77fab74bcc77.png`
  - 펄스 센트리: 같은 폴더의 `exec-540ff7a2-1711-45ae-99c5-6bc39fb5d2ef.png`
  - 억제 드론: 같은 폴더의 `exec-66862e54-66da-4bb0-a860-bd49309868c3.png`
  - THE WRONG ENGINE: `<local-user>/.codex/generated_images/019fe9ec-3c94-75e3-a563-a957de5623e9/exec-be5db030-734d-4837-b8f6-5116ab45766c.png`
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
  - 1차: `<local-user>/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-20a02c7e-0e06-4561-8fda-737d5932a8ff.png`
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
  - 수동: `<local-user>/.codex/generated_images/019fea33-753f-7a60-a8fd-ada52c2f858a/exec-2427d437-131f-404c-b0d7-f6beff26f786.png`
  - 자동: `<local-user>/.codex/generated_images/019fea33-753f-7a60-a8fd-ada52c2f858a/exec-064bb9ed-9c59-4d96-893a-ee7e2d331e60.png`
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
소유합니다. 정사각 셀을 긴 공격 범위로 늘이지 않고 점선 geometry와 반복 beam-core 모듈을
같은 판정 좌표 위에 배치합니다.

### EMP 펄스와 적 기계 폭발 도트 모션

- 생성일: 2026-08-10
- 생성 도구: OpenAI 내장 ImageGen, 프로젝트 `normalize-pixel-vfx-atlas.py`,
  `compose-atlas-rows.py`, 설치된 `remove_chroma_key.py`
- 적용 목적: 기존 수동 Q의 중력 흡인 표현을 폐기하고 전자기 정지 펄스로 교체하며,
  모든 일반 적 사망에 6프레임 기계 폭발을 적용합니다.
- 런타임 경로:
  - `public/assets/overload/vfx/pixel/manual-ability-pixel-atlas.png`의 0행(EMP 6프레임)
  - `public/assets/overload/vfx/pixel/enemy-death-pixel-atlas.png`(6×1, 64×64 셀)
- ImageGen 원본:
  - `<local-user>/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-0ea1ca97-5d3f-4686-a3bd-c1cd7234c384.png`
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
- 활성 런타임 경로: `public/assets/overload/ui/npcs/rhea-control-officer.png`
- 규격: 640×640 투명 상반신 대화 일러스트
- 승인 스타일 참조:
  - `public/assets/overload/ui/npcs/haven-npc-portraits-atlas.png`
  - `reference/source-assets/overload/campaign/haven-09-base-imagegen-source.png`
- ImageGen 선택 원본:
  `<local-user>/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-eb7bcb94-7ac1-49f1-b209-19186fcd0db7.png`
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
- AEGIS: `public/assets/overload/hero/survivor-portrait.png`
- RHEA 및 시나리오의 `OPERATOR` 화자:
  `public/assets/overload/ui/npcs/rhea-control-officer.png`
- HANA·ILYA·LARK: 기존
  `public/assets/overload/ui/npcs/haven-npc-portraits-atlas.png`의 0·1·2번 프레임
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
  - `<local-user>/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-cda2b2fa-cb64-47e8-ba2c-52eeb9a27463.png`
  - `<local-user>/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-d99ea63f-c855-4a82-96b7-9155f2982cad.png`
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
  - `<local-user>/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-71424306-6085-4a83-bd85-4b2d5442b77a.png`
  - `<local-user>/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-11bb8e5f-f771-497a-8e05-643dc850b802.png`
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
  - `<local-user>/Downloads/1구역 비행선 출격 연출.mp4` →
    `public/assets/overload/campaign/sortie/wrong-engine-sortie.mp4`
  - `<local-user>/Downloads/2구역 비행선 출격 연출.mp4` →
    `public/assets/overload/campaign/sortie/glass-dune-sortie.mp4`
  - `<local-user>/Downloads/3구역 비행선 출격 연출.mp4` →
    `public/assets/overload/campaign/sortie/abyssal-archive-sortie.mp4`
- SHA-256:
  - WRONG ENGINE: `86A4720037F2ABD510665D2761E03350891382DA25E9429EBEDF4FDF10AB4952`
  - GLASS DUNE: `CBB610F27D332938B910341CB3BD4055580203D1F125F6C6E6017B437BCC610F`
  - ABYSSAL ARCHIVE: `3C20BFB5DB6E941A03CA0CED7CF54F9B35514F424CEC6468B3A0BE1E2D7D3716`
- 세 런타임 파일은 원본과 byte-identical한 이름 변경 사본입니다. 지역 선택 전에는 내려받지 않고,
  선택한 한 편만 `preload="metadata"`로 마운트합니다. 기지 BGM은 재생 중 일시 정지하며 영상의
  `ended` 이벤트 직후 선택 지역 Phaser 전투와 메인 BGM을 시작합니다. 전체 사운드 토글이 꺼져
  있으면 영상도 음소거됩니다.

## Main background music

- 파일: `public/assets/audio/overload-main-theme.mp3`
- 원본 파일명: `300 드론 생존전.mp3`
- 재생 시간: 약 59.9초, 1구역 오답 엔진 중앙로 전투 중에만 반복 재생
- 출처: 프로젝트 사용자가 직접 제공한 외부 제작 음원
- 적용: 1구역 출격 영상 종료 뒤 재생하고 다른 지역·기지·타이틀에서는 사용하지 않으며 전체 사운드
  토글과 연동
- 생성 프롬프트, 사용 도구의 이용 플랜 및 세부 라이선스 정보는 최종 AI 활용 기술 문서 작성
  전에 사용자 제공 정보로 보완합니다.

## User-provided title background music

- 원본: `<local-user>/Downloads/잿빛 하늘 아래.mp3`
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
- 확정 대사: Q `전자기 펄스 전개.`, E `이지스 방벽 전개.`, F `공중 소사 좌표 확인.`,
  R `나선 폭풍 승인.` 효과 설명은 전투 중 음성 겹침을 줄이기 위해 넣지 않습니다.
- 대사·출력 파일·공식 인증 절차는 `GOOGLE_TTS_SETUP.md`와
  `scripts/generate-google-agent-voice.mjs`에 고정했습니다.
- 런타임 파일:
  - `public/assets/audio/agent/emp-pulse-online.mp3` — 1.560초, 6,240 bytes — SHA-256
    `eee7883d296c2559756ecd60106bae7b667b8c2dd953395790dccb3f9d27c9f9`
  - `public/assets/audio/agent/aegis-ward-online.mp3` — 1.680초, 6,720 bytes — SHA-256
    `d48cd4c7a1a3442140225f5c6a1bcc10e3ceef1058e0a0f29bc3f89816d6aecb`
  - `public/assets/audio/agent/stratos-run-confirmed.mp3` — 1.080초, 4,320 bytes — SHA-256
    `d1315b5449bbfeb2f385f74d05221c7a4ad7cbdf1c6cd887a19547516eabb513`
  - `public/assets/audio/agent/helix-tempest-authorized.mp3` — 0.984초, 3,936 bytes — SHA-256
    `7dedba20d726cf6eae9db617b4bd7f83828d053e2590b306da39086097364d45`
- `src/audio/agentVoice.js`는 전투 진입 시 네 파일에 명시적 `load()`를 요청하고 성공한 스킬 이벤트만 재생합니다.
  브라우저 기본 TTS·런타임 Google API 호출·음성 복제는 사용하지 않습니다.

## Numbered boss timed-bomb pixel atlas

- 런타임: `public/assets/overload/vfx/pixel/timed-bomb-pixel-atlas.png`
- 규격: 384×128 RGBA, 6×2, 64px 정사각 셀, NEAREST 필터. 1행은 비활성/청색 활성/황색 경고/
  적색 위험/해제/정지, 2행은 점화/소형 폭발/중형 폭발/최대 폭발/파편/잔광입니다. 폭탄 번호는
  이미지에 포함하지 않고 엔진의 `order`를 Phaser 텍스트로 그립니다.
- 도구: OpenAI built-in ImageGen whole-sheet 생성 → `remove_chroma_key.py`의 border auto-key,
  soft matte, threshold 12/220, despill → 프로젝트 `normalize-motion-atlas.py` 6×2 공유 스케일 정규화 →
  `normalize-pixel-vfx-atlas.py` 64px/32색/2px 안전 여백. 외부 게임 이미지나 외부 미술은 사용하지
  않았습니다.
- 선택 원본: `<local-user>/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-4b361e8a-950c-4ddb-a7da-594965ede2a3.png`
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
  `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-a345bd90-8519-4f2b-9ce1-2b14243845cf.png`.
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

## Open-source dependencies

- Phaser 4.2.1 — MIT License
- TypeScript 5.9.3 — Apache License 2.0
- React — MIT License
- Vite — MIT License
- Phosphor Icons — MIT License
- Rajdhani — SIL Open Font License 1.1
- IBM Plex Mono — SIL Open Font License 1.1

Rajdhani와 IBM Plex Mono는 번들 크기와 한국어 가독성을 위해 Latin 서브셋만 로드합니다.
Rajdhani는 영문 브랜드·표제 장식, IBM Plex Mono는 영문 텔레메트리·코드·키·숫자에만
사용합니다. 한국어 본문·대사·버튼은 별도 웹폰트 다운로드 없이 `Pretendard Variable`,
Pretendard, `Noto Sans KR`, `Apple SD Gothic Neo`, `Malgun Gothic`/`맑은 고딕`, system-ui와
플랫폼 sans 순서의 로컬 시스템 서체를 사용하므로 추가 폰트 파일 출처는 없습니다.

정확한 의존성 버전은 `package-lock.json`에 고정되어 있습니다.
