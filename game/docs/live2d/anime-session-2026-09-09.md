# Anime Cubism portraits — 2026-09-09

The lobby and operative profile now load four real Cubism MOC3 models made from the approved 960×1280 anime illustrations. Lobby artwork is 80% and profile artwork 82% of the previous framing scale. Anatomical crown alignment, aspect ratio, concealed lower crop, static fallback and matching touch coordinates share `portraitFraming.js`.

## Authored result

| Model | Visible ArtMeshes | Vertices | Deformers |
| --- | ---: | ---: | ---: |
| AEGIS | 20 | 677 | 14 |
| MIKA | 21 | 726 | 14 |
| VESPER | 20 | 756 | 13 |
| NOX | 21 | 726 | 14 |

Cubism 5.4 alpha2 created the meshes and keyed rotation/warp deformers. SDK 5.0 MOC3 exports are evaluated by Cubism Core. The user approved installation and manually granted the local editing integration Allow/Edit. No credentials are stored in this repository.

Authored channels: left/right eye opening, front/side/back hair, left/right arms, left/right coat and torso breathing. AEGIS's joined hands remain fixed; the other models' separated hands or forearms follow their corresponding arm. Eye closure combines a compressed open-eye mesh and separately painted eyelids, with a narrow opacity transition at 0.35–0.4. Head X/Y/Z stay exactly zero during idle, pointer movement and touch. Character-specific host-side springs drive hair/garments; these are not exported Cubism physics3 simulations.

This is a restrained portrait rig. Independent iris tracking, mouth/lip sync, eyebrow expressions and large three-dimensional head turns are **not implemented**. Existing default parameter names do not imply those capabilities. The previous one-image WebGL warp is no longer the lobby/profile runtime. Its development review remains historical material.

## Materials and reproducibility

- Approved masters: `reference/source-assets/overload/runtime-inputs/anime-2026-09-09/transparent/`.
- Current editable PSDs, CMO3s, MOC3 exports, isolated PNGs and key records: `reference/source-assets/overload/live2d-production/anime-v2/`.
- Authored contours: `anime-v1-parts.json` and `anime-v1-eyes.json` (versioned contour names retained); generated eyelid prompts/source hashes: `anime-blink-generation.json`; saved rig hashes/control records: `anime-rig-build.json`.
- `prepare-anime-live2d.py`: NumPy, Pillow and SciPy; user-authorized background/edge processing. The neutral full-resolution part composite has zero changed visible channels against each approved PNG. Hidden face paint is restricted to covered areas, and exposed eye backing is filled from nearby source skin.
- `package-anime-live2d-psd.mjs` and `pack-anime-live2d-textures.mjs`: run from `game/` with authoring-only `sharp@0.35.4` and `ag-psd@31.0.2` installed under `tmp/cubism-tools/`. `author-anime-live2d.mjs` takes a caller-owned approved RPC connection; it does not open or authorize one. Import PSD, generate deformation-small meshes, author controls, edit eye warp endpoint geometry in the Editor, save CMO3 and export SDK 5.0. `authored-eye-keys.json` records those native geometry endpoints.

The alpha Editor's polygon texture packing produced overlapping disconnected mesh islands for MIKA. Runtime textures are therefore compiled from the preserved original part PNGs into padded, non-overlapping rectangles. `runtime-textures.json` describes source bounds, atlas positions and source hashes. The renderer remaps UVs **once at the neutral pose**; animated geometry/opacity/order still comes from the unmodified MOC3. MIKA and NOX have two 2048px pages; AEGIS and VESPER one. The raw Editor atlas is retained as authoring history and is not the shipped texture.

The Core redistributable retains its original Live2D copyright/license header. Third-party terms are linked in that file; it is not original game code. No new runtime npm dependency was added.

## Runtime and validation

`InteractivePortrait.jsx` loads the Cubism renderer lazily, aborts work on unmount, releases Core/GPU resources and retains the static approved image on asset/WebGL failure. Textures upload once per model; vertex data updates each frame. Premultiplied-alpha sampling prevents dark seams around face, mouth and skin partitions. OS/game reduced-motion renders the neutral pose and stops animation; hidden/inert views suspend their frame loop. Dialogue uses the shared static frame without allocating a model.

- 419 Node tests passed, including bounded repeated touch motion, zero head motion, complete blink cycles, independent arm response, refresh-rate stability, UV coordinate/page mapping and framing.
- TypeScript and production build passed. Asset ownership: 233 required, zero missing, zero unowned.
- `scripts/verify-anime-cubism.mjs` checks the actual game in isolated headless Edge at 1440×900, 390×844 and 844×390, all four profiles, touch controls, reduced motion, no per-frame texture uploads, detached-model resource release and context-loss fallback. No browser errors. Set `PLAYWRIGHT_MODULE`, optional `EDGE_EXECUTABLE` and `QA_BASE_URL` for another environment.
- `qa/cubism-anime-2026-09-09/model-report.json` records each parameter's actual affected meshes and exact neutral vertex restoration for all four MOC3s. The browser report and 12 open/midpoint/closed-eye renders accompany desktop/mobile captures in that directory.

These checks establish local rendering and interaction behavior, not physical-device frame-rate certification or completion of the unimplemented facial features above. Combat, sound effects, save progression and story content were not changed by this work.
