import * as THREE from 'three';
import { FLOOR_SIN } from './projection.js';

export type TerrainSite = { id: string; kind: string; x: number; y: number; radius: number; height: number; maxHp: number };
export type TerrainDefinition = { style: string; label: string; bossLabel: string; floor: number; steel: number;
  dark: number; trim: number; accent: number; secondary: number; sky: number; structures: readonly TerrainSite[] };
type Batch = {
  add: (geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, h: number, rotation?: THREE.Euler) => void;
  box: (material: THREE.Material, x: number, y: number, w: number, d: number, h: number, lift?: number) => void;
  cylinder: (material: THREE.Material, x: number, y: number, r: number, h: number, lift?: number, segments?: number, top?: number) => void;
  finish: () => void;
};
type Builder = {
  route: THREE.Group; boss: THREE.Group;
  material: (color: number, map?: THREE.Texture, emissive?: number) => THREE.MeshStandardMaterial;
  texture: (kind: 'floor' | 'metal' | 'shadow') => THREE.Texture;
  batch: (parent: THREE.Group) => Batch;
  trackMaterial: (material: THREE.Material) => void;
  register: (site: TerrainSite, group: THREE.Group, materials: THREE.Material[]) => void;
  rotor: (object: THREE.Object3D, speed: number) => void;
};

// Authored geometry stays in simulation units. Raised interior props are built
// only from registered circular footprints; floor inlays are always walkable.
export function buildRegionalEnvironment(c: Builder, theme: TerrainDefinition) {
  const { style } = theme;
  const floorTexture = c.texture('floor'); floorTexture.repeat.set(20, 20);
  const metal = c.texture('metal');
  const floor = c.material(theme.floor, floorTexture), steel = c.material(theme.steel, metal);
  floor.metalness = .06; floor.roughness = .95;
  const dark = c.material(theme.dark), trim = c.material(theme.trim, metal);
  const accent = c.material(theme.accent, undefined, theme.accent); accent.emissiveIntensity = .38;
  const secondary = c.material(theme.secondary, undefined, theme.secondary); secondary.emissiveIntensity = .3;
  const black = c.material(theme.sky);
  const crystal = c.material(theme.accent); crystal.roughness = .18; crystal.metalness = .7;
  const shadow = new THREE.MeshBasicMaterial({ map: c.texture('shadow'), transparent: true, depthWrite: false, opacity: .6 });
  c.trackMaterial(shadow);
  const shadowAt = (b: Batch, x: number, y: number, r: number) =>
    b.add(new THREE.PlaneGeometry(r * 2.9, r * 2.5), shadow, x + 15, y + 18, .7, new THREE.Euler(-Math.PI / 2, 0, 0));

  for (const [parent, w, d] of [[c.route, 4096, 4096], [c.boss, 1920, 1080]] as const) {
    const route = parent === c.route, inset = route ? 144 : 54, b = c.batch(parent);
    // A low outside sea/cloud/desert bed and thick platform edge create depth
    // without misleading holes inside the playable rectangle.
    b.box(black, w / 2, d / 2, w + 1800, d + 1800, 10, -180);
    b.box(dark, w / 2, d / 2, w - inset * 2 + 84, d - inset * 2 + 84, 140, -152);
    b.box(floor, w / 2, d / 2, w - inset * 2 + 20, d - inset * 2 + 20, 8, -8);
    for (const x of [inset - 32, w - inset + 32]) {
      b.box(steel, x, d / 2, 40, d - inset * 2 + 80, 32, -4);
      b.box(accent, x, d / 2, 5, d - inset * 2 + 80, 3, 28);
      for (let y = inset + 80; y < d - inset; y += 330) {
        b.box(dark, x, y, 38, 74, 64);
        b.box(trim, x, y, 42, 80, 8, 64);
      }
    }
    for (const y of [inset - 30, d - inset + 30]) {
      b.box(steel, w / 2, y, w - inset * 2 + 64, 38, 30);
      b.box(secondary, w / 2, y, w - inset * 2 + 64, 4, 2, 30);
    }

    if (style === 'glass') {
      // Broken glass strata and buried prism conduits, all level with the sand.
      for (let y = inset + 220; y < d - inset; y += 480) for (let x = inset + 190; x < w - inset; x += 530) {
        const phase = (Math.floor(x) + Math.floor(y)) % 7;
        b.cylinder(phase % 2 ? steel : dark, x, y, 115 + phase * 7, 2, .2, 5, 105 + phase * 7);
        b.box(trim, x + 26, y + 9, 110, 3, 1, 2.5);
      }
      for (const x of [w * .28, w * .72]) {
        b.box(dark, x, d / 2, 26, d - inset * 2, 1, .1);
        b.box(secondary, x, d / 2, 3, d - inset * 2, 1, 1.2);
      }
      for (const x of [-150, w + 150]) for (let y = 180; y < d; y += 430) {
        b.add(new THREE.SphereGeometry(210, 12, 6), floor, x, y, -155, new THREE.Euler(0, y * .01, .2));
        b.add(new THREE.ConeGeometry(90, 300, 5), crystal, x, y, 50, new THREE.Euler(.16, y, .22));
      }
    } else if (style === 'archive') {
      // Sunk data channels below a grated archive catwalk.
      for (const x of [w * .29, w * .71]) {
        b.box(black, x, d / 2, 110, d - inset * 2, 1, .1);
        b.box(accent, x, d / 2, 9, d - inset * 2, 1, .3);
        for (let y = inset + 20; y < d - inset; y += 32) b.box(steel, x, y, 108, 5, 1, 2);
      }
      for (let y = inset + 240; y < d - inset; y += 540) {
        b.box(dark, w / 2, y, w - inset * 2 - 140, 76, 1, .3);
        for (let x = inset + 95; x < w - inset - 80; x += 58) b.box(secondary, x, y, 15, 3, 1, 1.6);
      }
      for (const x of [-130, w + 130]) for (let y = 160; y < d; y += 480) {
        b.box(steel, x, y, 130, 160, 300, -100);
        b.box(dark, x, y, 146, 180, 20, 200);
        for (let h = -30; h < 180; h += 48) b.box(accent, x, y + 82, 100, 3, 3, h);
        b.box(trim, x, y, 30, 260, 18, 220);
      }
    } else if (style === 'foundry') {
      for (const x of [w * .27, w * .73]) {
        b.box(black, x, d / 2, 122, d - inset * 2, 1, .1);
        b.box(secondary, x, d / 2, 62, d - inset * 2, 1, .3);
        // Contained molten channels have a continuous walkable grate above.
        for (let y = inset + 10; y < d - inset; y += 27) b.box(steel, x, y, 126, 15, 2, 1);
        for (const dx of [-70, 70]) b.box(trim, x + dx, d / 2, 7, d - inset * 2, 2, 1);
      }
      for (let y = inset + 260; y < d - inset; y += 520) {
        b.box(dark, w / 2, y, 360, 160, 1, .2);
        for (let k = -3; k <= 3; k++) b.box(steel, w / 2 + k * 46, y, 24, 154, 2, .5);
        b.box(accent, w / 2, y - 90, 350, 4, 2, 1);
      }
      for (const x of [-130, w + 130]) for (let y = 200; y < d; y += 480) {
        b.box(steel, x, y, 150, 245, 170);
        b.cylinder(dark, x, y, 70, 160, 170, 12);
        b.cylinder(trim, x, y, 90, 14, 330, 12);
        b.box(secondary, x, y + 124, 95, 3, 44, 80);
      }
    } else if (style === 'storm') {
      for (let y = inset + 220; y < d - inset; y += 420) {
        b.box(dark, w / 2, y, w - inset * 2 - 80, 90, 1, .1);
        b.box(trim, w / 2, y - 43, w - inset * 2 - 80, 3, 1, 1.2);
        b.box(accent, w / 2, y, w - inset * 2 - 100, 3, 1, 1.5);
        for (const x of [w * .3, w * .7]) b.cylinder(steel, x, y, 70, 2, 2, 8);
      }
      for (const x of [w * .33, w * .67]) for (let y = inset + 70; y < d - inset; y += 140)
        b.box(secondary, x, y, 6, 36, 1, 1);
      for (const x of [-160, w + 160]) for (let y = 200; y < d; y += 570) {
        b.cylinder(steel, x, y, 32, 340, -70, 12, 20);
        b.cylinder(dark, x, y, 48, 14, 245, 16);
        b.cylinder(accent, x, y, 11, 26, 270, 8);
        const rotor = new THREE.Group(); rotor.position.set(x, 310, y / FLOOR_SIN); parent.add(rotor);
        for (let i = 0; i < 3; i++) {
          const blade = new THREE.Mesh(new THREE.BoxGeometry(155, 9, 25), trim), a = i * Math.PI * 2 / 3;
          blade.position.set(Math.cos(a) * 74, 0, Math.sin(a) * 74); blade.rotation.y = -a; rotor.add(blade);
        }
        c.rotor(rotor, .65);
      }
    } else {
      // Sealed hexagonal specimen deck; organic conduits run under its glass.
      for (let y = inset + 200; y < d - inset; y += 370) for (let x = inset + 190; x < w - inset; x += 410) {
        b.cylinder(dark, x, y, 130, 1, .1, 6);
        b.cylinder(steel, x, y, 121, 1, 1.2, 6);
        b.cylinder(floor, x, y, 109, 1, 2.3, 6);
      }
      for (const x of [w * .31, w * .69]) {
        b.box(dark, x, d / 2, 38, d - inset * 2, 1, .1);
        b.box(accent, x, d / 2, 5, d - inset * 2, 1, 1.3);
      }
      for (const x of [-135, w + 135]) for (let y = 170; y < d; y += 440) {
        b.cylinder(dark, x, y, 86, 180, -35, 12, 50);
        b.add(new THREE.SphereGeometry(63, 12, 8), crystal, x, y, 150);
        for (let h = 10; h < 220; h += 38) b.cylinder(trim, x, y, 89 - h * .2, 8, h, 12);
      }
    }

    // Flush staging seal / final-arena containment seal, clear of obstacles.
    const cx = route ? 2048 : 1130, cy = route ? 2048 : 540, r = route ? 218 : 370;
    b.cylinder(dark, cx, cy, r, 2, 2, style === 'gene' ? 6 : 64);
    b.cylinder(trim, cx, cy, r - 8, 1, 4, style === 'gene' ? 6 : 64);
    b.cylinder(floor, cx, cy, r - 13, 1, 5, style === 'gene' ? 6 : 64);
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6;
      b.box(i % 3 ? steel : accent, cx + Math.cos(a) * (r - 25), cy + Math.sin(a) * (r - 25), 12, 12, 1, 6.2);
    }
    b.finish();
  }

  for (const site of theme.structures) {
    const group = new THREE.Group(); c.route.add(group);
    const materials = [steel, dark, trim, accent, secondary, crystal, black].map(material => {
      const copy = material.clone(); copy.transparent = true; c.trackMaterial(copy); return copy;
    });
    const [s, dk, tr, ac, se, cr, bk] = materials;
    const b = c.batch(group), { x, y, radius: r, height: h, kind } = site;
    shadowAt(b, x, y, r);
    b.cylinder(dk, x, y, r, 12, 0, 24);
    b.cylinder(tr, x, y, r * .9, 6, 12, 24);
    if (kind === 'crystal') {
      for (let i = 0; i < 5; i++) {
        const a = i * Math.PI * 2 / 5, scale = i === 0 ? 1 : .62;
        b.add(new THREE.CylinderGeometry(0, r * .29, h * scale, 5), i % 2 ? cr : ac,
          x + Math.cos(a) * r * .38, y + Math.sin(a) * r * .35, 18 + h * scale / 2,
          new THREE.Euler(.08 * Math.sin(a), a, .12 * Math.cos(a)));
      }
      b.cylinder(se, x, y, r * .52, 6, 18, 6);
    } else if (kind === 'mirror') {
      b.cylinder(s, x, y, r * .35, h * .6, 18, 12);
      b.add(new THREE.BoxGeometry(r * 1.22, h * .58, 18), tr, x, y, h * .72, new THREE.Euler(-.26, -.35, 0));
      b.add(new THREE.BoxGeometry(r * 1.08, h * .49, 20), cr, x, y + 4, h * .72, new THREE.Euler(-.26, -.35, 0));
      b.box(se, x, y + r * .68, r * .8, 8, 20, 28);
    } else if (kind === 'server' || kind === 'archive') {
      b.box(s, x, y, r * 1.25, r * 1.2, h - 28, 18);
      b.box(dk, x, y + r * .61, r, 6, h - 52, 28);
      for (let lift = 38; lift < h - 30; lift += 27) {
        b.box(tr, x, y + r * .65, r * .95, 5, 12, lift);
        b.box(ac, x - r * .23, y + r * .69, r * .18, 3, 4, lift + 4);
        b.box(se, x + r * .27, y + r * .69, 5, 3, 5, lift + 4);
      }
      for (const dx of [-r * .67, r * .67]) b.box(tr, x + dx, y, 12, r * 1.28, h - 10, 18);
      b.box(dk, x, y, r * 1.44, r * 1.36, 14, h);
      if (kind === 'archive') {
        b.cylinder(ac, x, y, r * .22, 24, h + 14, 6);
        for (const dx of [-r * .48, r * .48]) b.box(tr, x + dx, y, 13, 30, 45, h + 14);
      }
    } else if (kind === 'furnace') {
      b.cylinder(s, x, y, r * .79, h - 30, 18, 16, r * .7);
      b.cylinder(dk, x, y, r * .84, 14, h - 12, 16);
      b.cylinder(se, x, y, r * .61, 3, h + 2, 24);
      for (let i = 0; i < 4; i++) b.box(tr, x - r * .5 + i * r / 3, y, 8, r * 1.12, 10, h + 5);
      b.box(dk, x, y + r * .76, r * .76, 9, 50, 40);
      b.box(se, x, y + r * .81, r * .55, 4, 30, 50);
      for (const dx of [-r * .8, r * .8]) b.cylinder(tr, x + dx, y, 10, h * .7, 18, 8);
    } else if (kind === 'press') {
      b.box(s, x, y, r * 1.3, r * 1.17, 35, 18);
      for (const dx of [-r * .65, r * .65]) {
        b.box(dk, x + dx, y, r * .26, r * .8, h - 18, 18);
        b.box(tr, x + dx, y + r * .41, 12, 8, h - 45, 35);
      }
      b.box(s, x, y, r * 1.64, r * 1.08, 32, h - 14);
      b.cylinder(tr, x, y, r * .25, h * .35, h * .48, 12);
      b.box(dk, x, y, r * .9, r * .8, 22, h * .47);
      b.box(se, x, y + r * .6, r * 1.15, 4, 5, 44);
      b.box(ac, x, y + r * .56, r * 1.24, 4, 6, h - 2);
    } else if (kind === 'coil' || kind === 'capacitor') {
      b.cylinder(s, x, y, r * .55, h * .65, 18, 12, r * .35);
      for (let lift = 35; lift < h * .7; lift += 27) b.cylinder(tr, x, y, r * .7, 9, lift, 20);
      b.cylinder(ac, x, y, r * .23, h * .35, h * .66, 12);
      if (kind === 'coil') {
        for (let lift = h * .72; lift < h; lift += 24) b.cylinder(dk, x, y, r * .48, 6, lift, 20);
        b.cylinder(tr, x, y, 6, 38, h, 8, 0);
      } else {
        b.cylinder(tr, x, y, r * .54, 14, h - 4, 12);
        for (const dx of [-r * .68, r * .68]) b.box(dk, x + dx, y, 16, 26, h * .64, 22);
        b.box(se, x, y + r * .7, r * .6, 7, 20, 25);
      }
    } else if (kind === 'pod') {
      b.cylinder(dk, x, y, r * .74, 30, 18, 16);
      b.cylinder(cr, x, y, r * .59, h - 65, 48, 16);
      b.add(new THREE.SphereGeometry(r * .37, 12, 8), ac, x, y + r * .4, h * .53);
      for (const dx of [-r * .65, r * .65]) b.box(tr, x + dx, y, 16, 22, h - 40, 30);
      b.cylinder(tr, x, y, r * .73, 16, h - 12, 16, r * .55);
      b.box(dk, x, y + r * .69, r * .72, 12, 26, 29);
      b.box(ac, x, y + r * .76, r * .48, 3, 7, 41);
    } else {
      b.cylinder(dk, x, y, r * .59, h * .76, 18, 8, r * .32);
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3;
        b.add(new THREE.ConeGeometry(r * .22, h * .82, 6), tr,
          x + Math.cos(a) * r * .54, y + Math.sin(a) * r * .54, h * .45,
          new THREE.Euler(.25 * Math.sin(a), a, -.25 * Math.cos(a)));
      }
      b.add(new THREE.SphereGeometry(r * .4, 12, 8), ac, x, y, h * .75);
      for (let lift = 32; lift < h * .6; lift += 30) b.cylinder(se, x, y, r * .62, 5, lift, 12);
    }
    // The short amber seam is shared by all destructible props.
    if (site.maxHp > 0) {
      b.box(bk, x, y + r * .86, r * .58, 8, 20, 18);
      b.box(se, x, y + r * .91, r * .4, 3, 4, 27);
    }
    b.finish(); c.register(site, group, materials);
  }
}
