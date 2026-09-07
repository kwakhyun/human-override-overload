# Recorded sound sources · 2026-09-08

All three upstream asset pages explicitly label their downloads CC0. The unchanged selected inputs are retained under `reference/source-assets/overload/runtime-inputs/audio/realism/`. Runtime edits are derivatives, not new recordings. See [per-file hashes and edit recipes](sfx-sources.json).

| Source | Creator | Download | Selected material |
| --- | --- | --- | --- |
| [The Free Firearm Sound Library](https://opengameart.org/content/the-free-firearm-sound-library) | Ben Jaszczak, Brian Nelson, Kevin Heras, Matthew Nanney | [Prepared SFX Library.7z](https://opengameart.org/sites/default/files/Prepared%20SFX%20Library.7z) | AR-15 D_32P, AK-47 C_28P, Mosin Nagant M_26P, SKS U_19P |
| [Equipment Clicks III](https://opengameart.org/content/equipment-clicks-iii) | LFA | [equipment_clicks3.wav](https://opengameart.org/sites/default/files/equipment_clicks3.wav) | Mechanical actions recorded from a bolt-action rifle, stapler and tape measure; individual objects are not identified per transient. |
| [25 CC0 bang / firework SFX](https://opengameart.org/content/25-cc0-bang-firework-sfx) | rubberduck | [25-CC0-bang-sfx.zip](https://opengameart.org/sites/default/files/25-CC0-bang-sfx.zip) | cannon_01, cannon_02, cannon_04, bang_04; fireworks recordings edited for game explosions, not recordings of military bombs. |

License reference for all selected inputs: [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). The firearm library's original prepared master CSV is retained with the recordings and identifies weapon, microphone perspective and shot type. The four selected recordings contain multiple single shots; each runtime cue extracts one shot. No automatic burst is played for a single simulation shot.

`scripts/build-realistic-sfx.py` rebuilds the 25 replacements using Python with numpy, scipy and soundfile. It uses exact source windows, 2ms preroll, mono resampling, selected playback rates, high/low-pass filtering, mild recorded low-frequency reinforcement, 0.4ms attack and bounded tail fades, and peak/RMS attenuation. It adds no oscillator, generated audio or artificial gunshot layer. Runtime files use a new `realism-v2` URL; replaced Kenney runtime files are removed, while all original Kenney authoring inputs remain available.

Nine ranged-attack files use recorded firearms, four explosive files use recorded bangs, and twelve menu/reward/build files use mechanical actions. Sword, dash, shield, impact and warning identities retain the existing thirteen Kenney files. Maximum firing tails are 0.4–0.8s, explosions 1.25–2s, mechanical actions 0.065–0.65s. The full bank remains 38 PCM16 mono files, 1,644,252 bytes, with 52 cue mappings. Mechanical menu playback is quieter than combat, and unready/offline menu fallback uses a low-pass noise click without pitched tones. Rifle fallback removes the previous sawtooth laser sweep.

Validation: all 38 file/source hashes, PCM format, sub-0.75 peaks and the 2MiB bank budget are checked automatically. The Edge browser plays all 52 mappings and checks real sortie firing, dash, EMP, shield, pause/resume and portrait layout. These checks prove source selection and playback wiring, not subjective listening approval or physical-device loudness certification.
