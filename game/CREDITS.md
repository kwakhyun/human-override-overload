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
  - `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-d86d9558-2fee-4ab0-a553-73e320d4878f.png`
    (정지 사격)
  - `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-8169474a-f7fd-4428-8af6-800feebac54c.png`
    (대기·대시·피격·전투불능 수정본)
  - `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-5dd388f0-9c8b-4440-9380-f77284bd6cca.png`
    (조준 상대 이동)
  - `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-ddef8066-4fd2-4832-b747-47c1952a0da9.png`
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
  `C:/Users/82105/.codex/generated_images/019feaad-b25d-7603-9a36-51ea149f536c/exec-2b28696a-0165-4456-b4e0-4229098f4831.png`
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
  - 자폭 드론: `C:/Users/82105/.codex/generated_images/019fe9ec-02f3-7e00-abab-60a877f9d538/exec-c60f2d41-9dbb-48e2-bd8c-b5abf5b50366.png`
  - 소총수: 같은 폴더의 `exec-546518e0-e3ab-49d0-8471-2cd9e2997ed4.png`
    (`exec-f726ec44-0103-4146-b8b1-cb1c799e398e.png` 7열 반려본도 보존)
  - 저격수: 같은 폴더의 `exec-b2b70e88-251e-4cc0-b0e5-51310d324aa3.png`
  - 헌터 드론: 같은 폴더의 `exec-65577cc6-7c6c-4237-809d-77fab74bcc77.png`
  - 펄스 센트리: 같은 폴더의 `exec-540ff7a2-1711-45ae-99c5-6bc39fb5d2ef.png`
  - 억제 드론: 같은 폴더의 `exec-66862e54-66da-4bb0-a860-bd49309868c3.png`
  - THE WRONG ENGINE: `C:/Users/82105/.codex/generated_images/019fe9ec-3c94-75e3-a563-a957de5623e9/exec-be5db030-734d-4837-b8f6-5116ab45766c.png`
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
  - 1차: `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-20a02c7e-0e06-4561-8fda-737d5932a8ff.png`
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
  - 수동: `C:/Users/82105/.codex/generated_images/019fea33-753f-7a60-a8fd-ada52c2f858a/exec-2427d437-131f-404c-b0d7-f6beff26f786.png`
  - 자동: `C:/Users/82105/.codex/generated_images/019fea33-753f-7a60-a8fd-ada52c2f858a/exec-064bb9ed-9c59-4d96-893a-ee7e2d331e60.png`
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
  - `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-0ea1ca97-5d3f-4686-a3bd-c1cd7234c384.png`
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
  `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-eb7bcb94-7ac1-49f1-b209-19186fcd0db7.png`
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
  - `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-cda2b2fa-cb64-47e8-ba2c-52eeb9a27463.png`
  - `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-d99ea63f-c855-4a82-96b7-9155f2982cad.png`
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
  - `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-71424306-6085-4a83-bd85-4b2d5442b77a.png`
  - `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-11bb8e5f-f771-497a-8e05-643dc850b802.png`
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
  - `C:/Users/82105/Downloads/1구역 비행선 출격 연출.mp4` →
    `public/assets/overload/campaign/sortie/wrong-engine-sortie.mp4`
  - `C:/Users/82105/Downloads/2구역 비행선 출격 연출.mp4` →
    `public/assets/overload/campaign/sortie/glass-dune-sortie.mp4`
  - `C:/Users/82105/Downloads/3구역 비행선 출격 연출.mp4` →
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

- 원본: `C:/Users/82105/Downloads/잿빛 하늘 아래.mp3`
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
- 선택 원본: `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-f0df133a-4be0-4d04-839f-a5b0a8b4be7d.png`
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
- 선택 원본: `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-3c60a78e-91f5-42ee-b9c1-acc4da122f54.png`
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
- 선택 원본: `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-4b361e8a-950c-4ddb-a7da-594965ede2a3.png`
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
    `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-219fb4eb-c483-4457-baed-f730687d4b2b.png`
  - 균일 크로마 교정 시트:
    `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-af37a5df-8b6b-4450-88b1-916aa6ae17e4.png`
  - 검기 도트 시트:
    `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-c6588731-a9da-463e-91bb-353b4a72d219.png`
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
  - 소총 1차: `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-ae076dd5-c375-4a00-a036-b8c2fd3a2973.png`
  - 소총 방향 교정 최종: `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-658f9ee4-0b68-46a4-9839-a4ac5417bb33.png`
  - 빔 소드 1차(과대 검기 때문에 런타임 미사용): `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-d4f92e2d-02dc-4c65-9f22-bd43e63b6e01.png`
  - 빔 소드 교정 최종: `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-3295df39-59c2-4341-8145-bfdbd62a1b8b.png`
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
  - 네온 주조구 전장: `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-69ddb20a-50b9-4b95-8ad4-f6e45941cf92.png`
  - 폭풍 첨탑 전장: `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-438d2557-f85b-43fa-a1ec-aa656b489ffd.png`
  - 생체 금고 전장: `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-5a333d5d-8fde-4396-9503-57f33b1c2931.png`
  - 네온 주조구 유닛: `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-052e17ea-78ff-4e92-a4ca-fd15fb1190eb.png`
  - 폭풍 첨탑 유닛: `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-3564c293-3e82-45d5-96b7-31e550df4442.png`
  - 생체 금고 유닛: `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-68ed5aed-53b0-498f-9b39-f073de7af9d3.png`
  - 귀환 시네마틱: `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-dcdf0832-f90e-4f2f-885c-26b0ddbd5dc8.png`
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
  - 전략 월드맵: `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-3c8344da-42d7-4012-9e88-e4b4bc008514.png`
  - 외곽 생산권역: `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-9088a701-2723-434e-bf04-b0aad3b22fab.png`
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
- 선택 ImageGen 원본: `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-34b888f1-5c6b-46ad-ae2b-849668811297.png`.
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
- 선택 ImageGen 원본: `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-52ca4c3b-b71b-4cdf-aaf6-0d385346a3bc.png`.
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
- 선택 ImageGen 원본: `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-e4fb9a86-7022-43eb-b291-9978b58eb43e.png`.
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
  - 초상화: `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-a98e8787-e559-4585-ba41-f652b38cedbf.png`
  - 8방향 모션: `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-99f02fed-1da9-4b93-b890-0a13bc39c897.png`
  - 전용 스킬: `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-20e97ac9-2295-4176-9a7d-2391eb24865f.png`
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
  - 로비: `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-e780a601-5a1e-4dd0-a795-1bd3e7db8f1a.png`
  - 연구실: `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-a874cd6f-0518-4102-8072-de627f63aca2.png`
  - 정비소: `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-a565edd5-9b22-4a3c-bfbe-c34116a4b240.png`
  - 동기화실: `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-5d5f27df-2592-4bac-991e-3789c83d62ee.png`
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

## HAVEN-09 Cubism Live2D character models

- 도구: 사용자가 설치하고 PRO 평가판을 승인한 Live2D Cubism Editor 5.3.03.
- 원본 캐릭터 일러스트: 프로젝트 원본
  `public/assets/overload/hero/survivor-portrait.png`,
  `public/assets/overload/hero/mika-portrait.png`.
- MIKA 전신 확장 원본: 기존 MIKA의 얼굴·핑크 양갈래·흑백 마젠타 전투복·쌍환 장비를
  정체성 참조로 사용해 OpenAI 내장 ImageGen에서 잘린 하체와 부츠를 완성했습니다. 선택 원본은
  `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-50635e01-96a3-4deb-a42f-0e34a40e4322.png`,
  보존 원본은 `reference/source-assets/overload/live2d/mika-fullbody-chroma.png`, 투명 런타임
  폴백은 `public/assets/overload/hero/mika-live2d-fullbody.png`입니다. 외부 게임 캐릭터 이미지는
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
- 런타임 모델:
  `public/assets/overload/live2d/aegis/aegis.model3.json`,
  `public/assets/overload/live2d/aegis/aegis.moc3`,
  `public/assets/overload/live2d/mika/mika.model3.json`,
  `public/assets/overload/live2d/mika/mika.moc3`와 각 2048px 텍스처·CDI·표정 JSON.
- 호환성: 공개 Cubism Web Core가 지원하는 MOC3 v5로 출력했습니다. `MOC3` 헤더와 버전 바이트
  5를 집중 테스트로 잠급니다.
- 브라우저 런타임: `@greenmansk/react-live2d` 0.1.1(MIT)과 번들한 공식
  `Live2D Cubism Core` Redistributable Code를 사용합니다. Core 원본 주소는
  `https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js`, 라이선스는
  `https://www.live2d.com/eula/live2d-proprietary-software-license-agreement_en.html`입니다.
- 소스 PSD 준비 스크립트: `scripts/build-cubism-source.py`. 이 스크립트는 MOC3를 위조하거나
  생성하지 않으며, 최종 `.cmo3` 리깅과 `.moc3` 출력은 Cubism Editor에서 수행했습니다.
- 상호작용: 포인터 추적은 사용하지 않습니다. 상시 호흡·상체·머리카락 흔들림은 캐릭터별
  Cubism 키폼과 시선/상체 파라미터로 구동합니다. 머리·가슴·양팔·다리 클릭에는 캐릭터별
  전용 표정 JSON과 방향·진폭·주기가 다른 리그 반동을 적용하고, 캔버스 위치·전체 배율은 고정해
  인물 전체가 미끄러지는 움직임을 제거했습니다. AEGIS는 `cold-*`, MIKA는 `shy-*` 표정을
  사용하며, 간헐 중립 변화는 `cold-idle`/`bright-idle`입니다. model3의 `EyeBlink` 그룹이
  양쪽 눈 파라미터를 구동합니다. 터치 영역 표시와 CSS 홍조/얼굴선 합성은 없습니다.
- 상호작용 연출 밀도는 사용자가 지정한 캐릭터 로비 게임들의 클릭 반응·말풍선·아이들 변화
  방식을 장르 참고로만 검토했습니다. 해당 작품의 미술, 모델, 리깅 데이터, 대사, UI 에셋은
  복제하거나 프로젝트에 포함하지 않았고 AEGIS와 MIKA는 프로젝트 원본을 기반으로 각각
  독립 제작했습니다.

### HAVEN-09 Cubism premium motion v2

- 조사 기준: Live2D 공식 Cubism 문서의 PSD 소재 분리, 수동 메쉬, 워프 디포머, 표준
  파라미터, XY 얼굴 회전, 눈 깜빡임, 물리 연산 지침을 기준으로 삼았습니다. 다른 게임의
  캐릭터 원화·모델·모션 데이터는 사용하지 않았습니다.
- 도구: OpenAI 내장 ImageGen과 사용자가 설치·승인한 Live2D Cubism Editor 5.3.03.
- AEGIS 선택 ImageGen 원본:
  `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-ae464a1e-9e91-4658-821a-996f34bcfe35.png`.
- MIKA 선택 ImageGen 원본:
  `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-51d11449-6278-4b1b-81f3-938adbdeeefa.png`.
- 편집 소스 경로:
  `reference/source-assets/overload/cubism-v2/aegis/`와
  `reference/source-assets/overload/cubism-v2/mika/`. `scripts/build-premium-cubism-source.py`가
  얼굴, 눈, 눈썹, 입, 머리카락 덩어리, 양팔, 양다리, 코트, MIKA 트윈테일·링 장비를
  캐릭터별 28개 의미 레이어로 분리한 PSD와 합성 검수 이미지를 재생성합니다. Cubism Editor
  자동 템플릿은 몸통 디포머 배치의 참고에만 사용했고, 검증되지 않은 얼굴 자동 키폼을 런타임
  MOC에 덮어쓰지 않았습니다.
- 런타임 출력: 각 캐릭터에 3개 Idle 모션, 머리·가슴·팔·다리 4개 Touch 모션과
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
  ImageGen 원본 `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-a1ebd9b8-7b30-4a7d-9ddf-2e1dfc2ba218.png`;
  보존 원본 `reference/source-assets/overload/environment/sector-04-reactor-vault-expanded.png`;
  런타임 `public/assets/overload/environment/sector-04-reactor-vault-expanded.webp` 및
  `public/assets/overload/environment/performance/sector-04-reactor-vault-expanded.webp`.
- GLASS DUNE: 기존 참조 `public/assets/overload/regions/glass-dune/route.webp`;
  ImageGen 원본 `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-9bb9ca64-8083-4af7-af1a-376b98a9868b.png`;
  보존 원본 `reference/source-assets/overload/regions/glass-dune/route-expanded-v2.png`;
  런타임 `public/assets/overload/regions/glass-dune/route-expanded-v2.webp` 및 performance 동명 경로.
- ABYSSAL ARCHIVE: 기존 참조 `public/assets/overload/regions/abyssal-archive/route.webp`;
  ImageGen 원본 `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-5a3993bc-c979-4021-a54d-2155b4112a6c.png`;
  보존 원본 `reference/source-assets/overload/regions/abyssal-archive/route-expanded-v2.png`;
  런타임 `public/assets/overload/regions/abyssal-archive/route-expanded-v2.webp` 및 performance 동명 경로.
- NEON FOUNDRY: 기존 참조 `public/assets/overload/regions/neon-foundry/route.webp`;
  ImageGen 원본 `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-4fbdf489-471d-4b92-8ef5-a1f83687fc6a.png`;
  보존 원본 `reference/source-assets/overload/regions/neon-foundry/route-expanded-v2.png`;
  런타임 `public/assets/overload/regions/neon-foundry/route-expanded-v2.webp` 및 performance 동명 경로.
- STORM SPIRE: 기존 참조 `public/assets/overload/regions/storm-spire/route.webp`;
  ImageGen 원본 `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-8781ec3b-3ca2-4893-af69-b5cb23da9e83.png`;
  보존 원본 `reference/source-assets/overload/regions/storm-spire/route-expanded-v2.png`;
  런타임 `public/assets/overload/regions/storm-spire/route-expanded-v2.webp` 및 performance 동명 경로.
- GENE VAULT: 기존 참조 `public/assets/overload/regions/gene-vault/route.webp`;
  ImageGen 원본 `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-f8b32bfd-0321-4055-97f4-7c343044b755.png`;
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

## Open-source dependencies

- Phaser 4.2.1 — MIT License
- TypeScript 5.9.3 — Apache License 2.0
- React — MIT License
- Vite — MIT License
- Phosphor Icons — MIT License
- Rajdhani — SIL Open Font License 1.1
- IBM Plex Mono — SIL Open Font License 1.1
- @greenmansk/react-live2d 0.1.1 — MIT License

Live2D Cubism Core는 오픈소스 항목이 아니라 위 Live2D Proprietary Software License의
Redistributable Code입니다.

Rajdhani와 IBM Plex Mono는 번들 크기와 한국어 가독성을 위해 Latin 서브셋만 로드합니다.
Rajdhani는 영문 브랜드·표제 장식, IBM Plex Mono는 영문 텔레메트리·코드·키·숫자에만
사용합니다. 한국어 본문·대사·버튼은 별도 웹폰트 다운로드 없이 `Pretendard Variable`,
Pretendard, `Noto Sans KR`, `Apple SD Gothic Neo`, `Malgun Gothic`/`맑은 고딕`, system-ui와
플랫폼 sans 순서의 로컬 시스템 서체를 사용하므로 추가 폰트 파일 출처는 없습니다.

정확한 의존성 버전은 `package-lock.json`에 고정되어 있습니다.

## HAVEN 타워 디펜스 전용 에셋

### 방어 체계 6×4 모션 아틀라스

- 도구: OpenAI 내장 ImageGen (`image_gen`), 프로젝트 결합형 생성
- 선택 원본: `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-1e4ea91b-ab87-42e2-8611-e81cf3ad1c51.png`
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
- 선택 원본: `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-1a21b6ee-7352-4d0e-a43d-966b0b2e193a.png`
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
- 선택 원본: `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-125115ba-24bf-41a9-a814-53057d63bbb9.png`
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
- 선택 원본: `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-d73425ba-1ada-4706-8193-2ead8b4377f7.png`
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
- 선택 원본: `C:/Users/82105/.codex/generated_images/019fe745-e7af-7d81-b358-1e3b946bb17c/exec-a292d2ba-b8d7-4cb5-ae4a-0cbbca67b9a9.png`
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
