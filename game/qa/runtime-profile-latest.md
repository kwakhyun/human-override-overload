# Phaser runtime profile

Generated: 2026-08-10T06:23:34.805Z

Samples per scenario: 240

Active pixel-skill + dedicated gate textures present: 8/8 scenarios (overload-manual-ability-pixel-atlas, overload-automatic-skill-pixel-atlas, overload-sovereign-gate-motion-atlas).

Retired high-resolution skill textures resident: 0/3 (overload-manual-ability-motion-atlas, overload-skill-motion-atlas, overload-omega-laser-motion-atlas).

The 220-enemy / 620-projectile route fixture also requests all three optional ally motion atlases before sampling.

| Viewport / scenario | Quality | Observed actors | scene P95 | rAF P95 | render-submit P95 | dropped scene | loaded texture | decoded RGBA8 | route | boss |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| desktop-1440x810/wrong-engine-route-220x620 | performance | 220E / 620P | 28.5 ms | 13.9 ms | 11.8 ms | 19.9% | 13.455 MiB | 47.007 MiB | 18.167 MiB | 0 MiB |
| desktop-1440x810/wrong-engine-boss | cinematic | 0E / 157P | 27.9 ms | 14 ms | 1 ms | 7.9% | 9.246 MiB | 63.53 MiB | 18.167 MiB | 20.285 MiB |
| desktop-1440x810/glass-dune-boss | cinematic | 0E / 156P | 28.7 ms | 20.6 ms | 1.3 ms | 8.7% | 9.992 MiB | 53.273 MiB | 7.91 MiB | 20.285 MiB |
| desktop-1440x810/abyssal-archive-boss | cinematic | 0E / 157P | 28.2 ms | 20.8 ms | 1.2 ms | 8.7% | 9.058 MiB | 53.273 MiB | 7.91 MiB | 20.285 MiB |
| mobile-landscape-812x375/wrong-engine-route-220x620 | performance | 220E / 620P | 30.7 ms | 13.9 ms | 8.3 ms | 34.9% | 13.455 MiB | 47.007 MiB | 18.167 MiB | 0 MiB |
| mobile-landscape-812x375/wrong-engine-boss | performance | 0E / 158P | 34.9 ms | 20.9 ms | 1.1 ms | 24.1% | 9.246 MiB | 63.53 MiB | 18.167 MiB | 20.285 MiB |
| mobile-landscape-812x375/glass-dune-boss | performance | 0E / 174P | 35.9 ms | 20.9 ms | 1 ms | 29.9% | 9.992 MiB | 53.273 MiB | 7.91 MiB | 20.285 MiB |
| mobile-landscape-812x375/abyssal-archive-boss | performance | 0E / 159P | 36.4 ms | 20.9 ms | 1 ms | 26.3% | 9.058 MiB | 53.273 MiB | 7.91 MiB | 20.285 MiB |

## Measurement limits

- `loaded texture` is the deduplicated Resource Timing encoded-body size for same-document image assets; it can include DOM preview images as well as Phaser textures.
- `decoded RGBA8` is the deduplicated `width × height × 4` footprint of sources registered in Phaser TextureManager.
- Normal browser JavaScript cannot read physical VRAM allocation, driver padding, mipmap copies, render targets, compositor copies, or image-cache residency.
- `render-submit` measures CPU wall time between Phaser pre-render and post-render events; it does not wait for GPU completion.
- Headless Edge performance and GPU identity may differ from a visible browser.

