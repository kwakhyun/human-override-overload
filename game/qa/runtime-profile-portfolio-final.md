# Phaser runtime profile

Generated: 2026-08-11T05:53:13.427Z

Samples per scenario: 240

Low-end emulation: disabled.

Active pixel-skill + dedicated gate textures present: 8/8 scenarios (overload-manual-ability-pixel-atlas, overload-automatic-skill-pixel-atlas, overload-sovereign-gate-motion-atlas).

Retired high-resolution skill textures resident: 0/3 (overload-manual-ability-motion-atlas, overload-skill-motion-atlas, overload-omega-laser-motion-atlas).

The 220-enemy / 620-projectile route fixture also requests all three optional ally motion atlases before sampling.

| Viewport / scenario | Quality | Observed actors | scene P95 | rAF P95 | render-submit P95 | dropped scene | loaded texture | decoded RGBA8 | route | boss |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| desktop-1440x810/wrong-engine-route-220x620 | performance | 220E / 620P | 35.4 ms | 7 ms | 2.4 ms | 0.0% | 10.353 MiB | 48.601 MiB | 18.167 MiB | 0 MiB |
| desktop-1440x810/wrong-engine-boss | performance | 0E / 159P | 35.4 ms | 7 ms | 1.1 ms | 0.0% | 13.339 MiB | 66.31 MiB | 18.167 MiB | 21.41 MiB |
| desktop-1440x810/glass-dune-boss | balanced | 0E / 171P | 27.9 ms | 7 ms | 1.4 ms | 0.0% | 12.722 MiB | 56.051 MiB | 7.91 MiB | 21.41 MiB |
| desktop-1440x810/abyssal-archive-boss | performance | 0E / 170P | 35.2 ms | 7 ms | 0.9 ms | 0.0% | 13.271 MiB | 56.053 MiB | 7.91 MiB | 21.41 MiB |
| mobile-landscape-812x375/wrong-engine-route-220x620 | performance | 220E / 620P | 35.3 ms | 7 ms | 2.2 ms | 0.0% | 10.353 MiB | 48.601 MiB | 18.167 MiB | 0 MiB |
| mobile-landscape-812x375/wrong-engine-boss | performance | 0E / 169P | 35.2 ms | 7 ms | 1 ms | 0.0% | 13.339 MiB | 66.308 MiB | 18.167 MiB | 21.41 MiB |
| mobile-landscape-812x375/glass-dune-boss | performance | 0E / 170P | 35.1 ms | 7 ms | 1.2 ms | 0.0% | 12.722 MiB | 56.051 MiB | 7.91 MiB | 21.41 MiB |
| mobile-landscape-812x375/abyssal-archive-boss | performance | 0E / 158P | 35.1 ms | 7 ms | 0.9 ms | 0.0% | 12.965 MiB | 56.053 MiB | 7.91 MiB | 21.41 MiB |

## Measurement limits

- `loaded texture` is the deduplicated Resource Timing encoded-body size for same-document image assets; it can include DOM preview images as well as Phaser textures.
- `decoded RGBA8` is the deduplicated `width × height × 4` footprint of sources registered in Phaser TextureManager.
- Normal browser JavaScript cannot read physical VRAM allocation, driver padding, mipmap copies, render targets, compositor copies, or image-cache residency.
- `render-submit` measures CPU wall time between Phaser pre-render and post-render events; it does not wait for GPU completion.
- Headless Edge performance and GPU identity may differ from a visible browser.
