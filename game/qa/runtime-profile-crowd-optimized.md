# Phaser runtime profile

Generated: 2026-08-10T12:29:49.360Z

Samples per scenario: 240

Low-end emulation: disabled.

Active pixel-skill + dedicated gate textures present: 2/2 scenarios (overload-manual-ability-pixel-atlas, overload-automatic-skill-pixel-atlas, overload-sovereign-gate-motion-atlas).

Retired high-resolution skill textures resident: 0/3 (overload-manual-ability-motion-atlas, overload-skill-motion-atlas, overload-omega-laser-motion-atlas).

The 220-enemy / 620-projectile route fixture also requests all three optional ally motion atlases before sampling.

| Viewport / scenario | Quality | Observed actors | scene P95 | rAF P95 | render-submit P95 | dropped scene | loaded texture | decoded RGBA8 | route | boss |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| desktop-1440x810/wrong-engine-route-220x620 | performance | 220E / 620P | 35.7 ms | 7.1 ms | 4.1 ms | 99.6% | 10.353 MiB | 48.601 MiB | 18.167 MiB | 0 MiB |
| mobile-landscape-812x375/wrong-engine-route-220x620 | performance | 220E / 620P | 36.2 ms | 7.1 ms | 4.2 ms | 97.5% | 10.353 MiB | 48.601 MiB | 18.167 MiB | 0 MiB |

## Measurement limits

- `loaded texture` is the deduplicated Resource Timing encoded-body size for same-document image assets; it can include DOM preview images as well as Phaser textures.
- `decoded RGBA8` is the deduplicated `width × height × 4` footprint of sources registered in Phaser TextureManager.
- Normal browser JavaScript cannot read physical VRAM allocation, driver padding, mipmap copies, render targets, compositor copies, or image-cache residency.
- `render-submit` measures CPU wall time between Phaser pre-render and post-render events; it does not wait for GPU completion.
- Headless Edge performance and GPU identity may differ from a visible browser.

