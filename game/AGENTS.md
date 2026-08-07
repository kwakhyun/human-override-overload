# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Durable project decisions

- The current game is an AI-adaptive survivor and tactical tower-defense hybrid, not a stealth campaign. Earlier stealth maps, detection rules, patrol contracts, and weapon-slot rules are legacy only and must not constrain the active game.
- The core promise is visible in every run: the player creates a build, the arena AI measures damage and movement habits, and periodic counter-protocols change the enemy composition to punish over-reliance on that build.
- Optimize the opening two minutes for judging and capture: combat begins immediately, basic enemies die in one or two hits, the first level-up arrives quickly, and the first AI counter appears within roughly forty seconds.
- Use one polished five-minute arena run before adding more maps. The open circular arena must not contain invisible collision walls; the generated floor image and actual navigable area are the same continuous space.
- Use project-original assets under `public/assets/survivor/`: `adaptive-arena.png`, `player.png`, `hunter.png`, `suppressor.png`, and `brute.png`. Actor PNGs are transparent top-down renders facing east and may be rotated, eased, recoiled, flashed, and squashed in-engine.
- Preserve the visual language: near-black industrial metal, cyan player and XP feedback, red enemy prediction/counter signals, and amber deployable defenses. HUD copy should make the AI-learning premise legible during play without opening a document.
- Controls are WASD movement, Space dash, Q sentry deployment, and E EMP pylon deployment. Player weapons auto-target so mouse aiming is optional and the game remains immediately playable on a browser.
- The user will create background music separately with Suno AI. Do not add third-party music. Sound effects remain project-original and procedurally synthesized with Web Audio.
- Level-up choices, deployable towers, enemy waves, elites, a final boss, and a result summary are required parts of a complete run. Avoid adding breadth that delays polish on this loop.
