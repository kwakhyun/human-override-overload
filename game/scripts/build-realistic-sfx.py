"""Rebuild the recorded SFX selection (Python: numpy, scipy, soundfile).

Run from game/; originals are retained unchanged, never downloaded at build time.
"""
import hashlib
import json
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, resample_poly, sosfilt

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'reference/source-assets/overload/runtime-inputs/audio/realism'
OUT = ROOT / 'public/assets/audio/sfx/realism-v2'
RATE = 44100
PACKS = {
    'firearms': ('The Free Firearm Sound Library', 'Ben Jaszczak, Brian Nelson, Kevin Heras, Matthew Nanney', 'https://opengameart.org/content/the-free-firearm-sound-library'),
    'equipment': ('Equipment Clicks III', 'LFA', 'https://opengameart.org/content/equipment-clicks-iii'),
    'blasts': ('25 CC0 bang / firework SFX', 'rubberduck', 'https://opengameart.org/content/25-cc0-bang-firework-sfx'),
}
# id, source, start/end seconds, playback rate, maximum duration, lowpass Hz.
# Single shots are cut from multi-shot recordings using their authored sheet.
RECIPES = [
    ('pulse-1', 'firearms/AR-15-D_32P.wav', .68, 1.4, 1, .48, 8200),
    ('pulse-2', 'firearms/AR-15-D_32P.wav', 5.62, 6.4, 1, .48, 8200),
    ('turret', 'firearms/AK-47-C_28P.wav', .59, 1.4, .94, .46, 7000),
    ('enemy-shot', 'firearms/AK-47-C_28P.wav', 3.23, 4.1, 1, .4, 5200),
    ('warrant', 'firearms/AK-47-C_28P.wav', 6, 6.9, .9, .58, 7500),
    ('needle', 'firearms/Mosin-Nagant-M_26P.wav', 1.11, 2.2, 1, .68, 8500),
    ('rail', 'firearms/Mosin-Nagant-M_26P.wav', 6.08, 7.3, .9, .8, 7600),
    ('halo', 'firearms/SKS-U_19P.wav', 2.59, 3.5, .96, .48, 6800),
    ('arc', 'firearms/SKS-U_19P.wav', 7.99, 8.9, .86, .4, 5000),
    ('explosion', 'blasts/cannon_01.ogg', 0, 1.24, .8, 1.5, 6500),
    ('emp', 'blasts/cannon_04.ogg', 0, .92, .72, 1.25, 4200),
    ('boss-break', 'blasts/bang_04.ogg', 0, 1.09, .8, 1.35, 5800),
    ('boss-death', 'blasts/cannon_02.ogg', 0, 1.8, .85, 2, 6000),
    ('click', 'equipment/equipment-clicks.wav', .87, 1.05, .72, .14, 1600),
    ('hover', 'equipment/equipment-clicks.wav', .87, 1.05, .7, .065, 1100),
    ('select', 'equipment/equipment-clicks.wav', 2.17, 2.4, .7, .15, 1600),
    ('confirm', 'equipment/equipment-clicks.wav', .2, .62, .75, .36, 1900),
    ('close', 'equipment/equipment-clicks.wav', 1.47, 1.68, .68, .18, 1350),
    ('upgrade', 'equipment/equipment-clicks.wav', 3.27, 3.6, .68, .32, 1800),
    ('collect', 'equipment/equipment-clicks.wav', .87, 1.05, .85, .09, 1500),
    ('victory', 'equipment/equipment-clicks.wav', .2, .65, .6, .65, 1800),
    ('denied', 'equipment/equipment-clicks.wav', 2.79, 3.05, .58, .25, 950),
    ('build', 'equipment/equipment-clicks.wav', 3.72, 4.08, .64, .4, 1600),
    ('sell', 'equipment/equipment-clicks.wav', 4.29, 4.57, .7, .3, 1450),
    ('repair', 'equipment/equipment-clicks.wav', 5.09, 5.42, .65, .35, 1700),
]

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def filt(x, frequency, kind):
    return sosfilt(butter(2, frequency, kind, fs=RATE, output='sos'), x)

def build():
    manifest_path = ROOT / 'docs/audio/sfx-sources.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    assets = {a['id']: a for a in manifest['assets']}
    OUT.mkdir(parents=True, exist_ok=True)
    for id, source, start, end, speed, cap, cutoff in RECIPES:
        original = SOURCE / source
        data, sr = sf.read(original, always_2d=True)
        x = data[int(start*sr):int(end*sr)].mean(axis=1)
        # Keep a 2ms preroll so threshold trimming cannot blunt the transient.
        active = np.flatnonzero(np.abs(x) > np.max(np.abs(x)) * .015)
        x = x[max(0, active[0]-int(sr*.002)):]
        x = resample_poly(x, RATE, round(sr*speed))[:round(cap*RATE)]
        group = source.split('/')[0]
        x = filt(x, 45 if group == 'equipment' else 32, 'highpass')
        x = filt(x, cutoff, 'lowpass')
        if group != 'equipment':
            x += .45 * filt(x, 260, 'lowpass')
        # Very short attack fade; longer tail fade avoids a hard cutoff.
        attack = min(len(x), round(RATE * .0004))
        tail = min(len(x)//2, round(RATE * (.025 if group == 'equipment' else .12)))
        x[:attack] *= np.linspace(0, 1, attack)
        x[-tail:] *= np.linspace(1, 0, tail)**1.5
        rms = np.sqrt(np.mean(x*x))
        x *= min(.74 / np.max(np.abs(x)), (.13 if group == 'equipment' else .18) / max(rms, 1e-9))
        path = OUT / (id + '.wav')
        sf.write(path, x, RATE, subtype='PCM_16')
        output, _ = sf.read(path)
        pack, author, url = PACKS[group]
        assets[id] = dict(id=id, pack=pack, author=author, license='CC0-1.0', sourceUrl=url,
            original=original.name, sourcePath=original.relative_to(ROOT).as_posix(), sourceSha256=digest(original),
            path=path.relative_to(ROOT/'public').as_posix(), sha256=digest(path), sourceSeconds=round(len(data)/sr, 5),
            durationSeconds=round(len(output)/RATE, 5), sampleRate=RATE, channels=1, bytes=path.stat().st_size,
            maxDuration=cap, peak=round(float(np.max(np.abs(output))), 6),
            edit=dict(startSeconds=start, endSeconds=end, playbackRate=speed, lowpassHz=cutoff,
                      recipe='scripts/build-realistic-sfx.py'))
    manifest['processing'] = '25 recorded-source replacements: per-file edits and reproducible recipe recorded below. Other Kenney v1 files retain their original documented trim/fade/gain treatment. PCM16 mono, peak below 0.75; no generated audio.'
    manifest['assets'] = list(assets.values())
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(f'{len(RECIPES)} replacements; {sum(a["bytes"] for a in assets.values())} total runtime bytes')

if __name__ == '__main__':
    build()
