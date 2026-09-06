import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { SECTOR_ONE_STRUCTURES } from '../../game/content/sectorOneStructures.js';
import { getRegionalTerrain } from '../../game/content/regionalTerrain.js';
import { buildRegionalEnvironment, type TerrainSite, type TerrainDefinition } from './buildRegionalEnvironment';
import { FLOOR_SIN, FLOOR_COS } from './projection.js';

type Structure = TerrainSite;
type Frame = { boss: boolean; time: number; quality: string; player: any; enemies: any[]; terrain: { sites: any[] } };
type Camera2D = { width: number; height: number; zoom: number; getWorldPoint: (x: number, y: number) => { x: number; y: number } };

// An imperative presentation adapter: the Phaser clock and camera are the only
// frame authority. There is no second RAF, simulation, input, or physics world.
export class SectorOneEnvironment {
  readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera();
  private readonly route = new THREE.Group();
  private readonly boss = new THREE.Group();
  private readonly textures = new Set<THREE.Texture>();
  private readonly materials = new Set<THREE.Material>();
  private readonly rotors: { object: THREE.Object3D; speed: number }[] = [];
  private readonly occluders: { site: Structure; group: THREE.Group; debris: THREE.InstancedMesh;
    settled: boolean; materials: THREE.Material[]; opacity: number; destroyed: boolean }[] = [];
  private readonly theme: TerrainDefinition;
  private readonly regionId: string;
  private readonly referenceCanvas: HTMLCanvasElement;
  private disposed = false;
  private contextLost = false;
  private width = 0;
  private height = 0;
  private previousCss = '';
  private readonly oldPosition: string;
  private readonly oldZIndex: string;
  private readonly oldParentPosition: string;
  private readonly parent: HTMLElement;

  constructor(canvas: HTMLCanvasElement, regionId = 'wrong-engine-core') {
    this.regionId = regionId;
    this.theme = getRegionalTerrain(regionId) as TerrainDefinition;
    if (!this.theme) throw new Error('Unknown terrain region');
    this.referenceCanvas = canvas;
    if (!canvas.parentElement) throw new Error('Battle canvas is not mounted');
    this.parent = canvas.parentElement;
    // Phaser uses WebGL 1. A separate WebGL 2 canvas avoids unsafe shared state.
    this.renderer = new THREE.WebGLRenderer({ alpha: false, antialias: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(1);
    this.renderer.setClearColor(this.theme.sky);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.domElement.dataset.regionalTerrain = regionId;
    if (regionId === 'wrong-engine-core') this.renderer.domElement.dataset.sectorOneTerrain = '3d';
    this.renderer.domElement.setAttribute('aria-hidden', 'true');
    this.oldPosition = canvas.style.position; this.oldZIndex = canvas.style.zIndex;
    this.oldParentPosition = this.parent.style.position;
    if (getComputedStyle(this.parent).position === 'static') this.parent.style.position = 'relative';
    canvas.style.position = 'relative'; canvas.style.zIndex = '1';
    this.renderer.domElement.style.cssText = 'position:absolute;left:0;top:0;pointer-events:none;z-index:0;display:none';
    this.parent.insertBefore(this.renderer.domElement, canvas);
    this.renderer.domElement.addEventListener('webglcontextlost', this.onLost);
    this.renderer.domElement.addEventListener('webglcontextrestored', this.onRestored);
    this.scene.add(this.route, this.boss);
    const desert = this.theme.style === 'glass';
    this.scene.add(new THREE.HemisphereLight(desert ? 0xffefce : 0xb3dfeb, 0x1e2026, 2.2));
    const key = new THREE.DirectionalLight(desert ? 0xffe2ad : 0xc0edff, 3.4); key.position.set(-1800, 2800, -1300); this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xffb06a, 1.6); rim.position.set(1900, 600, 1400); this.scene.add(rim);
    try {
      if (this.theme.style === 'transit') this.build();
      else buildRegionalEnvironment({ route: this.route, boss: this.boss,
        material: this.material.bind(this), texture: this.texture.bind(this), batch: this.batch.bind(this),
        trackMaterial: material => this.materials.add(material),
        register: this.registerStructure.bind(this), rotor: (object, speed) => this.rotors.push({ object, speed }),
      }, this.theme);
    } catch (error) { this.dispose(); throw error; }
  }

  get available() { return !this.disposed && !this.contextLost; }
  private onLost = (event: Event) => { event.preventDefault(); this.contextLost = true; this.renderer.domElement.style.display = 'none'; };
  private onRestored = () => { this.contextLost = false; };

  private material(color: number, map?: THREE.Texture, emissive = 0) {
    const m = new THREE.MeshStandardMaterial({ color, map, roughness: .76, metalness: .48, emissive, emissiveIntensity: emissive ? 2.2 : 0 });
    this.materials.add(m); return m;
  }

  private texture(kind: 'floor' | 'metal' | 'shadow') {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = kind === 'floor' ? 512 : 128;
    const c = canvas.getContext('2d')!; const s = canvas.width;
    if (kind === 'shadow') {
      const gradient = c.createRadialGradient(s / 2, s / 2, 8, s / 2, s / 2, s / 2);
      gradient.addColorStop(0, '#000b'); gradient.addColorStop(.58, '#0008'); gradient.addColorStop(1, '#0000');
      c.fillStyle = gradient; c.fillRect(0, 0, s, s);
    } else {
      const sand = kind === 'floor' && this.theme.style === 'glass';
      c.fillStyle = kind === 'floor' ? (sand ? '#d1c5aa' : '#829096') : '#9aa1a0'; c.fillRect(0, 0, s, s);
      let seed = 4174;
      const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
      for (let i = 0; i < s * s / 2; i++) {
        c.fillStyle = `rgba(${random() > .5 ? '0,0,0' : '255,255,255'},${random() * .07})`;
        c.fillRect(random() * s, random() * s, 1 + random() * 3, 1);
      }
      if (sand) {
        for (let y = 0; y < s; y += 18) {
          c.strokeStyle = '#78665312'; c.lineWidth = 3; c.beginPath();
          for (let x = 0; x <= s; x += 8) {
            const py = y + Math.sin(x / s * Math.PI * 4) * 7;
            if (x === 0) c.moveTo(x, py); else c.lineTo(x, py);
          }
          c.stroke();
        }
      } else {
        c.strokeStyle = '#121c22'; c.lineWidth = 5; c.strokeRect(2, 2, s - 4, s - 4);
        c.strokeStyle = '#c4d5d344'; c.lineWidth = 2; c.strokeRect(7, 7, s - 14, s - 14);
      }
      if (kind === 'floor' && !sand) {
        // Broad oil/grime variation, worn inspection paint, and hairline cracks
        // keep the modular steel deck from reading as a pristine checkerboard.
        for (let i = 0; i < 8; i++) {
          const x = random() * s, y = random() * s, radius = 18 + random() * 90;
          const stain = c.createRadialGradient(x, y, 0, x, y, radius);
          stain.addColorStop(0, '#17212835'); stain.addColorStop(1, '#17212800');
          c.fillStyle = stain; c.fillRect(x - radius, y - radius, radius * 2, radius * 2);
        }
        c.fillStyle = '#dec79255'; c.fillRect(28, 36, 64, 5); c.fillRect(28, 36, 5, 25);
        c.fillStyle = '#18282e'; c.font = '12px monospace'; c.fillText(this.theme.label.slice(0, 2) + ' / DECK', 29, 87);
        c.strokeStyle = '#263239'; c.lineWidth = 3;
        c.beginPath(); c.moveTo(0, s / 2); c.lineTo(s, s / 2); c.stroke();
        for (const x of [17, s - 17]) for (const y of [17, s / 2 - 14, s / 2 + 14, s - 17]) {
          c.fillStyle = '#121b20'; c.beginPath(); c.arc(x, y, 4, 0, Math.PI * 2); c.fill();
          c.fillStyle = '#94a0a1'; c.fillRect(x - 2, y - 2, 3, 2);
        }
        for (let i = 0; i < 50; i++) {
          const x = random() * s, y = random() * s;
          c.strokeStyle = '#111a2222'; c.lineWidth = 1;
          c.beginPath(); c.moveTo(x, y); c.lineTo(x + random() * 50, y - random() * 8); c.stroke();
        }
      }
    }
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());
    this.textures.add(texture); return texture;
  }

  private batch(parent: THREE.Group) {
    const bins = new Map<THREE.Material, THREE.BufferGeometry[]>();
    const add = (geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, h: number, rotation = new THREE.Euler()) => {
      const matrix = new THREE.Matrix4().compose(new THREE.Vector3(x, h, y / FLOOR_SIN),
        new THREE.Quaternion().setFromEuler(rotation), new THREE.Vector3(1, 1, 1 / FLOOR_SIN));
      geometry.applyMatrix4(matrix);
      const list = bins.get(material) || []; list.push(geometry); bins.set(material, list);
    };
    const box = (m: THREE.Material, x: number, y: number, w: number, d: number, h: number, lift = 0) =>
      add(new THREE.BoxGeometry(w, h, d), m, x, y, lift + h / 2);
    const cylinder = (m: THREE.Material, x: number, y: number, r: number, h: number, lift = 0, segments = 24, top = r) =>
      add(new THREE.CylinderGeometry(top, r, h, segments), m, x, y, lift + h / 2);
    const finish = () => {
      for (const [material, geometries] of bins) {
        const merged = mergeGeometries(geometries, false)!;
        parent.add(new THREE.Mesh(merged, material)); geometries.forEach(g => g.dispose());
      }
      bins.clear();
    };
    return { add, box, cylinder, finish };
  }

  private build() {
    const floorTexture = this.texture('floor'); floorTexture.repeat.set(24, 24);
    const metalTexture = this.texture('metal');
    const steel = this.material(0x566871, metalTexture), dark = this.material(0x192b34), trim = this.material(0x839598);
    const rust = this.material(0x644735, metalTexture), amber = this.material(0xa57728), black = this.material(0x111d24);
    const cyan = this.material(0x4bd1dc, undefined, 0x0b7d93), orange = this.material(0xdb8643, undefined, 0x793414);
    const floor = this.material(0x6b7d88, floorTexture);
    const shadowMaterial = new THREE.MeshBasicMaterial({ map: this.texture('shadow'), transparent: true, depthWrite: false, opacity: .65 });
    this.materials.add(shadowMaterial);
    const shadow = (batch: ReturnType<SectorOneEnvironment['batch']>, x: number, y: number, r: number) =>
      batch.add(new THREE.PlaneGeometry(r * 2.8, r * 2.4), shadowMaterial, x + 18, y + 20, .7, new THREE.Euler(-Math.PI / 2, 0, 0));
    for (const [parent, w, d] of [[this.route, 4096, 4096], [this.boss, 1920, 1080]] as const) {
      const b = this.batch(parent);
      b.box(floor, w / 2, d / 2, w + 600, d + 600, 48, -48);
      // Armored boundary and service trench. All raised rim geometry is beyond
      // the simulation's existing walkable inset; grates in the yard are flush.
      const inset = parent === this.route ? 144 : 54;
      for (const x of [inset - 56, w - inset + 56]) {
        b.box(dark, x, d / 2, 96, d + 200, 46, -2);
        b.box(trim, x, d / 2, 8, d + 200, 48, 0);
        b.box(cyan, x + (x < w / 2 ? 36 : -36), d / 2, 6, d - 50, 3, 0);
        for (let y = 180; y < d; y += 320) {
          b.box(steel, x, y, 88, 76, 140); b.box(rust, x, y, 104, 96, 16, 140);
          b.box(cyan, x, y, 40, 40, 5, 158);
        }
      }
      for (const y of [inset - 45, d - inset + 45]) {
        b.box(dark, w / 2, y, w, 72, 30);
        b.box(trim, w / 2, y, w, 12, 8, 30);
        b.box(orange, w / 2, y + (y < d / 2 ? 26 : -26), w - 120, 5, 3);
      }
      // Flush transport rails, sleeper bolts and recessed cable grates.
      for (const x of [w / 2 - 210, w / 2 + 210]) {
        b.box(black, x, d / 2, 36, d - inset * 2, 1, .2);
        b.box(trim, x - 10, d / 2, 5, d - inset * 2, 2, .3);
        b.box(rust, x + 10, d / 2, 5, d - inset * 2, 2, .3);
        for (let y = inset + 40; y < d - inset; y += 70) b.box(dark, x, y, 48, 9, 2, .4);
      }
      for (const y of parent === this.route ? [570, 1460, 2700, 3500] : [210, 880]) {
        b.box(black, w / 2, y, w - inset * 2 - 120, 48, 6, -6);
        b.box(cyan, w / 2, y, w - inset * 2 - 120, 6, 1, -2);
        for (let x = inset + 60; x < w - inset - 60; x += 28) b.box(steel, x, y, 8, 48, 2, .2);
      }
      // Painted safety lines and broad mesh service hatches are walkable.
      for (const x of [w / 2 - 285, w / 2 + 285]) for (let y = inset + 120; y < d - inset; y += 180) {
        b.box(amber, x, y, 7, 68, 1, 1.2);
      }
      for (const y of parent === this.route ? [1190, 2060, 2920] : [520]) for (const x of [w / 2 - 410, w / 2 + 410]) {
        b.box(black, x, y, 150, 180, 3, -2);
        b.box(trim, x - 75, y, 4, 184, 2, 1); b.box(trim, x + 75, y, 4, 184, 2, 1);
        for (let gy = -80; gy <= 80; gy += 16) b.box(steel, x, y + gy, 144, 4, 2, 1);
        for (let gx = -60; gx <= 60; gx += 20) b.box(steel, x + gx, y, 3, 176, 1, 3);
      }
      if (parent === this.route) {
        b.cylinder(dark, 2048, 2048, 248, 6, -5, 64);
        b.cylinder(steel, 2048, 2048, 222, 2, 1, 64);
        b.cylinder(dark, 2048, 2048, 208, 2, 2, 64);
        for (let i = 0; i < 12; i++) {
          const a = i * Math.PI / 6;
          b.box(i % 3 ? amber : cyan, 2048 + Math.cos(a) * 232, 2048 + Math.sin(a) * 232, 15, 15, 3, 3);
        }
      } else {
        // The boss arena stays unobstructed for every existing radial pattern.
        b.cylinder(dark, 1150, 540, 400, 5, -4, 64);
        b.cylinder(trim, 1150, 540, 372, 2, 1, 64);
        b.cylinder(dark, 1150, 540, 365, 2, 2, 64);
        b.cylinder(black, 1150, 540, 240, 2, 3, 64);
        for (let i = 0; i < 24; i++) {
          const a = i / 24 * Math.PI * 2;
          b.box(i % 3 ? amber : orange, 1150 + Math.cos(a) * 385, 540 + Math.sin(a) * 385, 12, 12, 3, 3);
        }
      }
      b.finish();
    }
    for (const site of SECTOR_ONE_STRUCTURES) {
      const group = new THREE.Group(); this.route.add(group);
      const localMaterials = [steel, dark, trim, rust, amber, black, cyan, orange].map(m => {
        const clone = m.clone(); clone.transparent = true; this.materials.add(clone); return clone;
      });
      const [s, dk, tr, rs, am, bk, cy, or] = localMaterials;
      const b = this.batch(group), { x, y, radius: r, height: h } = site;
      shadow(b, x, y, r);
      b.cylinder(dk, x, y, r, 18, 0, 32);
      b.cylinder(tr, x, y, r * .88, 12, 18, 32);
      b.cylinder(site.kind === 'coolant' ? s : rs, x, y, r * .76, h - 42, 30, 24);
      b.cylinder(dk, x, y, r * .86, 16, h - 12, 32, r * .72);
      b.cylinder(tr, x, y, r * .6, 8, h + 4, 24);
      b.cylinder(bk, x, y, r * .5, 4, h + 12, 32);
      for (const lift of [40, h * .5, h - 28]) b.cylinder(tr, x, y, r * .8, 5, lift, 32);
      // Service-facing control panel, warning plate and recessed status strip.
      b.box(dk, x, y + r * .74, r * .65, 13, 52, h * .42);
      b.box(cy, x - r * .13, y + r * .83, r * .28, 3, 16, h * .42 + 22);
      b.box(am, x + r * .18, y + r * .83, r * .15, 3, 9, h * .42 + 26);
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4, px = x + Math.cos(a) * r * .79, py = y + Math.sin(a) * r * .79;
        b.box(i % 2 ? rs : tr, px, py, 12, 12, h * .65, 30);
        b.box(i % 2 ? am : cy, x + Math.cos(a) * r * .94, y + Math.sin(a) * r * .94, 10, 10, 3, 19);
      }
      if (site.kind === 'relay') {
        b.cylinder(cy, x, y, r * .24, h * .4, h + 14, 16);
        for (let i = 0; i < 4; i++) b.cylinder(dk, x, y, r * .45, 6, h + 22 + i * 24, 24);
        b.cylinder(or, x, y, 10, 12, h * 1.4 + 18, 12);
      } else {
        const rotor = new THREE.Group(); rotor.position.set(x, h + 20, y / FLOOR_SIN); group.add(rotor);
        for (let i = 0; i < 7; i++) {
          const blade = new THREE.Mesh(new THREE.BoxGeometry(r * .55, 5, r * .12), tr);
          const a = i * Math.PI * 2 / 7; blade.position.set(Math.cos(a) * r * .23, 0, Math.sin(a) * r * .23);
          blade.rotation.y = -a + .32; rotor.add(blade);
        }
        b.cylinder(site.kind === 'coolant' ? cy : or, x, y, r * .12, 7, h + 23, 16);
        this.rotors.push({ object: rotor, speed: site.kind === 'coolant' ? .7 : 1.2 });
      }
      b.finish(); this.registerStructure(site, group, localMaterials);
    }
    // Oversized perimeter pipework, transformers and exhaust banks.
    const yard = this.batch(this.route);
    for (const x of [-35, 4131]) for (let y = 230; y < 4096; y += 520) {
      shadow(yard, x, y, 140);
      yard.box(rust, x, y, 200, 320, 120); yard.box(dark, x, y, 215, 335, 18, 120);
      for (let i = -1; i <= 1; i++) {
        yard.cylinder(steel, x + i * 48, y, 19, 160, 138, 12);
        yard.cylinder(dark, x + i * 48, y, 28, 15, 298, 12);
        yard.box(orange, x + i * 48, y + 165, 16, 5, 12, 62);
      }
    }
    for (const y of [-45, 4141]) for (let x = 240; x < 4096; x += 330) {
      yard.box(steel, x, y, 200, 160, 165); yard.box(rust, x, y, 216, 176, 14, 165);
      for (let i = -2; i <= 2; i++) yard.box(dark, x + i * 30, y + 82, 16, 6, 110, 22);
    }
    yard.finish();
  }

  private registerStructure(site: Structure, group: THREE.Group, materials: THREE.Material[]) {
    const material = this.material(this.theme.steel);
    const debris = new THREE.InstancedMesh(new THREE.OctahedronGeometry(12, 0), material, 8);
    debris.position.set(site.x, 0, site.y / FLOOR_SIN);
    debris.visible = false; debris.frustumCulled = false; this.route.add(debris);
    this.occluders.push({ site, group, debris, materials, opacity: 1, settled: false, destroyed: false });
  }

  private updateStructures(frame: Frame) {
    const pose = new THREE.Object3D();
    for (const record of this.occluders) {
      const state = frame.terrain?.sites.find(site => site.id === record.site.id);
      const age = state?.destroyedAt == null ? -1 : Math.max(0, frame.time - state.destroyedAt);
      record.destroyed = age >= 0;
      if (age >= 0) {
        record.group.visible = age < .28;
        record.group.scale.y = Math.max(.04, 1 - age / .28);
        record.debris.visible = true;
        if (!record.settled) {
          const t = Math.min(1.4, age);
          for (let i = 0; i < 8; i++) {
            const a = i * Math.PI / 4 + (record.site.x % 31) * .1;
            const reach = record.site.radius * (.38 + (i % 3) * .2) + t * 35;
            const h = Math.max(5 + (i % 3) * 4, record.site.height * .45 + (65 + i * 9) * t - 270 * t * t);
            pose.position.set(Math.cos(a) * reach, h, Math.sin(a) * reach / FLOOR_SIN);
            pose.rotation.set(i + t * (i + 1), a + t * 2, t * 3);
            pose.scale.set(1 + i % 2, .5 + (i % 3) * .3, 1.2);
            pose.updateMatrix(); record.debris.setMatrixAt(i, pose.matrix);
          }
          record.debris.instanceMatrix.needsUpdate = true;
          record.settled = age >= 1.4;
        }
        continue;
      }
      if (record.debris.visible) {
        record.debris.visible = false; record.group.visible = true;
        record.group.scale.y = 1; record.settled = false;
      }
      const { x, y, radius } = record.site;
      const h = record.site.height * (record.site.kind === 'relay' ? 1.4 : 1) + 40;
      const behind = (actor: any) => !actor.dead && Math.abs(actor.x - x) < radius + 14
        && actor.y > y - radius - h * FLOOR_COS - 45 && actor.y < y + 20;
      const fade = behind(frame.player) || frame.enemies.some(behind);
      record.opacity += ((fade ? .22 : 1) - record.opacity) * .3;
      const hit = state && frame.time - state.hitAt < .13;
      for (const material of record.materials) {
        material.opacity = record.opacity; material.depthWrite = record.opacity > .95;
        if (material instanceof THREE.MeshStandardMaterial) {
          if (material.userData.baseEmissive === undefined) material.userData.baseEmissive = material.emissiveIntensity;
          material.emissiveIntensity = hit ? material.userData.baseEmissive + .5 : material.userData.baseEmissive;
        }
      }
    }
  }

  render(camera: Camera2D, frame: Frame) {
    if (!this.available) return false;
    const canvas = this.referenceCanvas;
    const css = canvas.style.cssText;
    if (this.previousCss !== css) {
      this.previousCss = css;
      const style = this.renderer.domElement.style;
      style.width = canvas.style.width || '100%'; style.height = canvas.style.height || '100%';
      style.marginLeft = canvas.style.marginLeft; style.marginTop = canvas.style.marginTop;
      style.transform = canvas.style.transform;
    }
    const scale = frame.quality === 'performance' ? .65 : frame.quality === 'cinematic' ? 1 : .85;
    const width = Math.max(1, Math.round(camera.width * scale)), height = Math.max(1, Math.round(camera.height * scale));
    if (width !== this.width || height !== this.height) {
      this.width = width; this.height = height; this.renderer.setSize(width, height, false);
    }
    const center = camera.getWorldPoint(camera.width / 2, camera.height / 2);
    const halfW = camera.width / camera.zoom / 2, halfH = camera.height / camera.zoom / 2;
    this.camera.left = -halfW; this.camera.right = halfW; this.camera.top = halfH; this.camera.bottom = -halfH;
    this.camera.near = 1; this.camera.far = 24000;
    this.camera.position.set(center.x, 9000 * FLOOR_SIN, center.y / FLOOR_SIN + 9000 * FLOOR_COS);
    this.camera.lookAt(center.x, 0, center.y / FLOOR_SIN); this.camera.updateProjectionMatrix();
    this.route.visible = !frame.boss; this.boss.visible = frame.boss;
    for (const rotor of this.rotors) rotor.object.rotation.y = frame.time * rotor.speed;
    this.updateStructures(frame);
    this.renderer.domElement.style.display = 'block';
    this.renderer.render(this.scene, this.camera);
    return true;
  }

  snapshot() {
    return { active: this.available, regionId: this.regionId, kind: this.route.visible ? (this.theme.style === 'transit' ? 'transport-yard' : this.theme.style) : `${this.theme.style}-boss`,
      calls: this.renderer.info.render.calls, triangles: this.renderer.info.render.triangles,
      geometries: this.renderer.info.memory.geometries, textures: this.renderer.info.memory.textures,
      width: this.width, height: this.height, structures: this.theme.structures.length, destroyedStructures: this.occluders.filter(record => record.destroyed).length,
      fadedStructures: this.occluders.filter(record => record.opacity < .5).length };
  }

  dispose() {
    if (this.disposed) return; this.disposed = true;
    this.renderer.domElement.removeEventListener('webglcontextlost', this.onLost);
    this.renderer.domElement.removeEventListener('webglcontextrestored', this.onRestored);
    this.scene.traverse(object => {
      if (object instanceof THREE.Mesh) object.geometry.dispose();
      if (object instanceof THREE.InstancedMesh) object.dispose();
    });
    this.materials.forEach(material => material.dispose()); this.textures.forEach(texture => texture.dispose());
    this.renderer.dispose(); this.renderer.forceContextLoss(); this.renderer.domElement.remove();
    this.referenceCanvas.style.position = this.oldPosition; this.referenceCanvas.style.zIndex = this.oldZIndex;
    this.parent.style.position = this.oldParentPosition;
  }
}
