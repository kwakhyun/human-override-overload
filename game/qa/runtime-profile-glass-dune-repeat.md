# Phaser runtime profile

Generated: 2026-08-10T05:27:36.438Z

Samples per scenario: 240

Manual Q/E/F/R motion texture present: 1/1 scenarios (overload-manual-ability-motion-atlas).

The 220-enemy / 620-projectile route fixture also requests all three optional ally motion atlases before sampling.

| Viewport / scenario | Quality | Observed actors | scene P95 | rAF P95 | render-submit P95 | dropped scene | loaded texture | decoded RGBA8 | route | boss |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| mobile-landscape-812x375/glass-dune-boss | cinematic | 0E / 159P | 21.1 ms | 7 ms | 1.1 ms | 0.0% | 17.729 MiB | 61.43 MiB | 7.91 MiB | 20.285 MiB |

## Measurement limits

- `loaded texture` is the deduplicated Resource Timing encoded-body size for same-document image assets; it can include DOM preview images as well as Phaser textures.
- `decoded RGBA8` is the deduplicated `width × height × 4` footprint of sources registered in Phaser TextureManager.
- Normal browser JavaScript cannot read physical VRAM allocation, driver padding, mipmap copies, render targets, compositor copies, or image-cache residency.
- `render-submit` measures CPU wall time between Phaser pre-render and post-render events; it does not wait for GPU completion.
- Headless Edge performance and GPU identity may differ from a visible browser.

