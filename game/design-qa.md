# Design QA — TRAIN ME WRONG Adaptive Survivor

- Source visual truth: `/Users/kwakhyun/Documents/NAN2026/game/reference/train-me-wrong-visual-target.png`
- Implementation screenshot: `/Users/kwakhyun/Documents/NAN2026/game/qa/implementation-survivor-density.png`
- Normalized comparison: `/Users/kwakhyun/Documents/NAN2026/game/qa/design-qa-survivor-comparison.png`
- Browser target: `http://127.0.0.1:4173/`
- Intended viewport: 16:9 desktop game frame
- Source pixels: 1672 × 941, normalized to 1440 × 810
- Implementation browser capture: 779 × 762; visible game frame 779 × 438, normalized to 1440 × 810
- CSS game frame during final capture: 779 × 438
- Canvas backing store: 2304 × 1296 at devicePixelRatio 2, logical game space 1152 × 648
- State: Wave 02, Level 07, 15 hostiles, `KINETIC SHELL` counter active, mixed Pulse/Arc/Blade build

The source is a selected visual-direction target rather than a pixel-identical screen contract. The user
explicitly authorized discarding the previous stealth layout, so the shift from corridors to an open survivor
arena is intentional. The comparison evaluates whether the new game preserves the source's premium top-down
sci-fi finish, black-blue metal, cyan player feedback, red threat language, compact HUD, and tactical clarity.

## Full-view comparison evidence

`qa/design-qa-survivor-comparison.png` places the source and implementation in one normalized 2880 × 850
image. The implemented arena keeps the source's orthographic camera, dark industrial materials, restrained
emissive color, small diegetic panels, and cyan/red semantic split. The open center, four entry gates, level
build panel, and enemy-model panel support the new survivor loop without appearing like unrelated UI.

## Focused-region evidence

No extra crop was required because the original-size comparison keeps the two side HUD panels, top meters,
bottom equipment bar, actor silhouettes, projectiles, and counter rings readable. The browser was also
inspected directly in three focused states:

- Intro: title hierarchy, three-step loop, primary CTA, control primer.
- Level-up: three 3-choice protocol cards with icon, type, next level, description, and keyboard focus style.
- Gameplay: transparent actor edges, 15–18 simultaneous enemies, XP return particles, towers, orbitals,
  health loss, and the live `KINETIC SHELL` counter panel.

## Required fidelity surfaces

- Fonts and typography: Rajdhani provides the condensed tactical display hierarchy; IBM Plex Mono is limited
  to telemetry, counters, and numeric readouts. Korean body copy remains legible and does not clip.
- Spacing and layout rhythm: HUD occupies the perimeter and preserves a large unobstructed combat center.
  Side panels, top meters, and bottom actions do not overlap at the tested 16:9 frame.
- Colors and tokens: cyan remains player/data/ready, red remains enemy/counter/damage, amber remains build
  equipment, and violet remains hacker/daemon. Contrast is sufficient over the dark arena.
- Image quality and asset fidelity: the arena is a dedicated 16:9 asset rather than a stretched stealth map.
  Four top-down actor PNGs have clean alpha edges and distinct silhouettes. A 2× backing store prevents canvas
  blur on high-density displays.
- Copy and content: the intro states the build → analysis → counter loop; the in-game AI panel explains both
  what was learned and how the player can respond. No prototype or prompt language leaks into the game.
- Icons: all product UI icons come from one Phosphor family with consistent duotone/filled use.
- Accessibility and states: semantic buttons, canvas label, audio label, visible keyboard focus, reduced-motion
  fallback, disabled equipment styling, hover states, upgrade pause, counter alert, and result states exist.

## Comparison history

### Iteration 1 — blocked

- P1 gameplay progression: 30 kills could occur while XP remained at 0 because distant data fragments did not
  reach a stationary player.
- Fix: raised the base magnet radius and made fragments automatically return after 1.35 seconds.
- Post-fix evidence: the first level-up appeared at 9 kills; later browser states reached Level 7–8 with the
  upgrade modal and active build list working.

### Iteration 2 — blocked

- P2 survivor density: Wave 02 showed only one or two living enemies because multishot cleared the spawn rate.
- Fix: increased Wave 02+ group size, increased spawn cadence, added the Pursuit Swarm group bonus, and capped
  concurrent enemies at 90 for performance safety.
- Post-fix evidence: the final browser capture shows 15 hostiles around the player; DOM inspection observed 18
  hostiles immediately before the capture. Health fell from 100 to 73–82, confirming meaningful pressure.

### Iteration 3 — passed

- No remaining actionable P0, P1, or P2 visual or core-flow issue was found.
- Browser console warnings/errors: none.
- Primary interactions tested: start CTA, automatic fire, XP collection, Space dash, Q sentry deployment,
  repeated level-up choices, AI damage-mix analysis, first counter activation, and dense Wave 02 combat.

## Follow-up polish

- P3: run a dedicated 5-minute capture pass for the final boss/result transition when recording the submission
  video; the underlying victory/defeat states are implemented, but the full-duration result was not included in
  this visual comparison.

final result: passed

