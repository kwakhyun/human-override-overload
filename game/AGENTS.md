# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Durable project decisions

- The user's latest explicit replacement direction always supersedes earlier core-loop proposals. The active game is `TRAIN ME WRONG: OVERLOAD`, a single-character open-arena survivor run. Historical prototype code may remain for provenance, but it must not influence the active UI, controls, pacing, economy, or documentation unless the user explicitly asks to restore it.
- Keep one controllable player actor on screen. Movement is WASD or arrow keys, Space dashes, and pointer movement aims. The basic weapon fires continuously toward the pointer; never require a pointer click or held button to perform the default attack.
- Open every run with an immediate, visually overwhelming enemy rush. Use a fixed total of 300 enemies, target full swarm clearance at roughly 28–40 seconds depending on build and aim, enter a 2-second transition after the remaining count reaches zero, and finish the entire run in roughly 65–80 seconds.
- Present combat through a player-following zoomed camera instead of showing the entire arena at once. Keep a readable lower-right minimap with the player, hostile clusters, boss, and current camera footprint.
- Escalate the 300-enemy phase with explicitly warned mass-surges at fixed run times. The warning must precede the gate burst, remain readable over combat, and be reinforced by red edge treatment and sound.
- Enemy kills grant XP. The first level-up must occur within 6–10 seconds. Pause combat for each three-choice reward and always represent the broader build space across weapons, skills, and allies rather than a single linear stat track.
- Include repeatable offensive skill progression and visible mastery transformations. Arc Cascade, Zero-Point Nova, Skyfall air support, and the Omega Laser must all have real combat effects; long-cooldown ultimates require telegraph, impact, cooldown HUD, and materially higher crowd-clearing power. Master ranks should visibly flood the nearby battlefield with upgraded area attacks.
- After the swarm is cleared, transition to the giant `THE WRONG ENGINE` boss. Its encounter must combine distinctly telegraphed radial fire, sweeps, delayed blast zones, expanding rings, and charges. Dodging a charge into the arena boundary exposes the core for three seconds and applies a real 2× damage multiplier.
- Preserve readable combat feedback at crowd scale: remaining-enemy count, XP pickup and level progress, level-up choices, kill chains, boss entrance, danger telegraphs, weak-point exposure, hit-stop, damage feedback, and victory state must be legible without explanatory prose.
- Use `public/assets/survivor/swarm-arena.png` as the active dedicated map. The open center and four entry ramps are fully traversable; bulky scenery belongs outside the playable perimeter so the map image never implies a collision that is absent or hides a collision that exists.
- Reuse the project-original player, enemy, boss, drone, sentry, and deployable raster assets under `public/assets/survivor/`. The dedicated map was generated for this direction on 2026-08-09 with OpenAI's built-in ImageGen. Preserve its full-resolution source at `reference/source-assets/public/assets/survivor/swarm-arena-source.png`.
- Runtime raster assets must stay display-size optimized. Preserve full-resolution sources under `reference/source-assets/` instead of loading them into the game or copying unused images into the production build.
- Maintain adaptive `CINEMATIC / BALANCED / PERFORMANCE` quality tiers with live frame-time hysteresis. Low-end rendering must cap DPR, cache static backgrounds and repeated effects, cull invisible work, disable expensive Canvas filters, cap particles and concurrent audio voices, and keep fixed-step simulation separate from render cadence.
- Preserve the near-black industrial arena, cyan player and navigation language, amber reward and weak-point language, and red enemy-danger language. Avoid generic dashboard styling; the canvas combat view is the dominant surface.
- The user will create background music separately with Suno AI. Do not add third-party music. Sound effects remain project-original and procedurally synthesized with Web Audio.
