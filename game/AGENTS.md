# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Durable project decisions

- The current game is a four-front survivor-command and tactical tower-defense hybrid, not a stealth campaign or a single-arena leveling game. Earlier stealth systems, one-arena counter protocols, XP gems, and level-up choice overlays are legacy only.
- The battlefield is a 2x2 command grid with four visually distinct sectors and four distinct hero archetypes. The overview shows every front simultaneously; selecting one sector focuses the camera and gives that hero manual control while all other living heroes remain under AI control.
- All sectors share one gold treasury. Enemies award gold immediately on death; there is no XP or scrap currency. Gold buys hero-specific permanent upgrades, sprite-backed drone/sentry/EMP skills, healing items, shields, and team repair.
- A fallen hero permanently breaches that sector for the run. Its existing and newly spawned enemies move into surviving adjacent sectors, and every surviving front receives an invasion-level difficulty increase.
- Keep the run at five minutes, make common enemies die in one or two hits, start combat immediately in all four sectors, and deploy a final sector warden near extraction.
- Controls are 1-4 or pointer sector selection, WASD movement, Space dash, Q sentry, E EMP pylon, Tab/Escape overview, and B shop. Weapons auto-target so pointer aiming remains optional.
- Health bars must stay directly above every living hero; damaged enemies, elites, and bosses also show local health bars. Map visuals and traversable play space must remain identical open arenas with no invisible collision geometry.
- Preserve the near-black industrial base and red danger language while giving each sector a distinct accent: cryo cyan, forge amber, archive violet, and bio green. Shared gold uses amber.
- Project-original generated deployable assets live under `public/assets/survivor/skills/`: `sentry.png`, `emp-pylon.png`, and `wingman-drone.png`. Keep them as real transparent raster sprites, not code-drawn placeholders.
- The user will create background music separately with Suno AI. Do not add third-party music. Sound effects remain project-original and procedurally synthesized with Web Audio.
