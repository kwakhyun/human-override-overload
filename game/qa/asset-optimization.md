# Runtime Asset Optimization QA

## 2026-08-31 load-boundary and production packaging audit

- A fresh AEGIS/pulse-rifle run now loads only the selected region, selected weapon, and unlocked operative assets.
- Full-profile route preload changed from 32 files / 10.50 MiB to 26 files / 5.48 MiB (47.8% transfer reduction).
- Performance-profile route preload changed from 32 files / 7.51 MiB to 26 files / 3.34 MiB (55.5% transfer reduction).
- Combat readiness waits only for available operative/RHEA DOM portraits. Reward-card images move to an idle preload after Phaser is ready.
- Forty-six historical or authoring-only public inputs remain reproducible in source but are pruned from `dist/client`, removing 21.41 MiB from each production package.
- Regression contracts: `tests/performance-assets.test.mjs` and `tests/production-asset-policy.test.mjs`.

The current policy is inspectable with `npm run analyze:assets`; the explicit file list lives in `scripts/production-asset-policy.mjs`.

## 2026-08-09 sprite resize audit

Date: 2026-08-09

The production sprites were resized with premultiplied-alpha Lanczos resampling. The square canvas, transparent padding, aspect ratio, and rotation pivot were preserved. Original files are retained under `reference/source-assets/public/assets/survivor/`.

| Asset | Source | Runtime | Before | After | Reduction |
| --- | ---: | ---: | ---: | ---: | ---: |
| `player.png` | 1254x1254 | 384x384 | 579,713 B | 68,725 B | 88.1% |
| `hunter.png` | 1254x1254 | 384x384 | 634,231 B | 75,295 B | 88.1% |
| `suppressor.png` | 1254x1254 | 384x384 | 501,513 B | 64,552 B | 87.1% |
| `brute.png` | 1254x1254 | 384x384 | 1,124,964 B | 126,666 B | 88.7% |
| `bosses/wrong-engine.png` | 1254x1254 | 512x512 | 1,981,607 B | 399,529 B | 79.8% |
| `skills/sentry.png` | 384x384 | 192x192 | 134,589 B | 36,569 B | 72.8% |
| `skills/emp-pylon.png` | 384x384 | 192x192 | 170,379 B | 44,839 B | 73.7% |
| `skills/wingman-drone.png` | 384x384 | 192x192 | 98,542 B | 26,879 B | 72.7% |

Runtime sprite transfer size changed from 5,225,538 bytes (4.98 MiB) to 843,054 bytes (0.80 MiB), an 83.9% reduction. Estimated decoded RGBA texture memory changed from 31.69 MiB to 3.67 MiB, an 88.4% reduction.

Quality was compared after rendering both source and runtime files at their largest current Retina display sizes on a dark background. PSNR ranged from 44.21 dB for the 420 px boss to 60.98 dB for a 156 px character. Mean absolute RGB error ranged from 0.048 to 0.760 on a 0-255 scale. The contact sheet was also inspected at original resolution and showed no visible silhouette, pivot, or alpha-edge regression.

`adaptive-arena.png` was removed from the production `public/` tree and preserved at `reference/source-assets/public/assets/survivor/adaptive-arena.png`, so Vite no longer copies the unused 2,558,389-byte image into the build.

Visual evidence: `qa/asset-optimization-contact-sheet.png`
