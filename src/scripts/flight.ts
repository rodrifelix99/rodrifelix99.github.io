// The night flight. One fixed stage: a canvas city, DOM beacons projected into
// it, and a camera driven by scroll. ScrollCraft's worldflight mode owns the
// track, the copy windows and the waypoint legs; this file owns the world.
// The engine is untouched.

interface StopData { id: string; kind: string; t: number; t0: number; t1: number; w: number; side?: 'lead' | 'trail'; era: string; projects?: string[] }
interface LegData { id: string; label: string; ground?: string; c0: number; w: number }
interface RouteData { stops: StopData[]; legs: LegData[]; total: number }

interface Light { x: number; z: number; c: number; b: number; ph: number }
interface Beacon {
  el: HTMLElement; id: string; x: number; z: number; h: number; size: number;
  glow: string; pick: boolean; sprite: HTMLCanvasElement | null;
  sx: number; sy: number; sp: number; vis: number;
  // finale
  fx0: number; fy0: number; fs0: number; fx1: number; fy1: number; fs1: number; fd: number;
}
interface Pair { li: number; x0: number; y0: number; s0: number; a0: number; x1: number; y1: number; d: number; ph: number }

const data: RouteData = JSON.parse(document.getElementById('route-data')!.textContent!);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

const root = document.querySelector<HTMLElement>('[data-sc-mode="worldflight"]')!;
const world = document.querySelector<HTMLElement>('[data-sc-world]')!;
const canvas = world.querySelector<HTMLCanvasElement>('canvas.city')!;
const ctx = canvas.getContext('2d', { alpha: false })!;
const beaconLayer = world.querySelector<HTMLElement>('.beacons')!;

const ZPER = 150;            // world units per viewport-height of track
const CAM_H = 55;            // cruising altitude
// The palette comes from the page's theme tokens, so the city matches the type.
const css = getComputedStyle(document.documentElement);
const tok = (n: string) => css.getPropertyValue(n).trim();
const toRgb = (c: string) => {
  const probe = document.createElement('canvas').getContext('2d')!;
  probe.fillStyle = c;
  const h = probe.fillStyle as string; // normalised to #rrggbb
  return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(',');
};
const LIGHT_COLORS = tok('--lights').split('|').map((x) => x.trim());
const ACCENT = toRgb(tok('--sc-accent'));
const INK = toRgb(tok('--sc-ink'));
const SKY = tok('--sky').split('|').map((x) => x.trim());
const CANVAS = tok('--sc-canvas');
const WORD_FONT = `${tok('--word-weight')} {size}px ${tok('--sc-font-display')}`;

const stops = data.stops;
const stopById = Object.fromEntries(stops.map((s) => [s.id, s]));
const finaleStop = stops.find((s) => s.kind === 'finale')!;
const originStop = stops.find((s) => s.kind === 'origin')!;
const camZ = (t: number) => t * ZPER;
const CITY_END = camZ(originStop.t1) + 140;

// ------------------------------------------------------------ utilities --
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const clamp01 = (v: number) => clamp(v, 0, 1);
const smooth = (u: number) => { u = clamp01(u); return u * u * (3 - 2 * u); };
const smoother = (u: number) => { u = clamp01(u); return u * u * u * (u * (u * 6 - 15) + 10); };
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

// ---------------------------------------------------------------- world --
// The city thins out as the route goes back in time: dense now, a few lights
// at the start, then nothing but water.
function eraDensity(z: number) {
  const anchors: [number, number][] = [
    [-400, 1], [camZ(stopById['log-2026b'].t1), 1], [camZ(stopById['log-2025'].t1), 0.85],
    [camZ(stopById['log-2024'].t1), 0.8], [camZ(stopById['log-2023'].t1), 0.68],
    [camZ(stopById['log-2021'].t1), 0.5], [camZ(stopById['log-2019'].t1), 0.34],
    [CITY_END - 60, 0.16], [CITY_END, 0],
  ];
  if (z >= CITY_END) return 0;
  for (let i = 1; i < anchors.length; i++) {
    if (z <= anchors[i][0]) {
      const [z0, d0] = anchors[i - 1], [z1, d1] = anchors[i];
      return lerp(d0, d1, smooth((z - z0) / (z1 - z0)));
    }
  }
  return 0;
}
const riverX = (z: number) => -175 + 38 * Math.sin(z / 420) + 18 * Math.sin(z / 170 + 1.3);
const RIVER_HALF = 34;
const XMAX = 760, ZBACK = 1300;

function buildCity(scale: number): Light[] {
  const r = rng(1999);
  const out: Light[] = [];
  // a few soft centres of density, so the city has neighbourhoods
  const blobs = Array.from({ length: 46 }, () => ({ x: (r() - 0.5) * 820, z: -200 + r() * (CITY_END + 200), s: 60 + r() * 160 }));
  const blob = (x: number, z: number) => {
    let v = 0;
    for (const b of blobs) { const dx = x - b.x, dz = z - b.z; v += Math.exp(-(dx * dx + dz * dz) / (2 * b.s * b.s)); }
    return Math.min(1, v);
  };
  // The city carries on past the edges of the route and behind "now", fading
  // out, so it never reads as a rectangle when you look back at it.
  const edge = (x: number, z: number) => smooth((XMAX - Math.abs(x)) / 300) * (z < -220 ? smooth((z + ZBACK) / (ZBACK - 220)) : 1);
  const accept = (x: number, z: number) => {
    if (Math.abs(x - riverX(z)) < RIVER_HALF) return false;
    const far = Math.abs(x) > 430 || z < -220;
    const d = eraDensity(z) * (0.25 + 0.75 * blob(x, z)) * scale * edge(x, z) * (far ? 1.6 : 1);
    return r() < d;
  };
  const push = (x: number, z: number) => {
    const c = r();
    out.push({ x, z, c: c < 0.62 ? 0 : c < 0.9 ? 1 : c < 0.97 ? 2 : 3, b: r() < 0.12 ? 1 : 0, ph: r() * 6.283 });
  };
  for (let x = -XMAX; x <= XMAX; x += 16) {
    const far = Math.abs(x) > 430;
    for (let z = -ZBACK; z < CITY_END; z += (far || z < -220 ? 2.2 : 1) * (5 + r() * 9)) {
      const jx = x + (r() - 0.5) * 2;
      if (accept(jx, z)) push(jx, z);
    }
  }
  for (let z = -ZBACK; z < CITY_END; z += z < -220 ? 44 : 22) {
    for (let x = -XMAX; x <= XMAX; x += (Math.abs(x) > 430 || z < -220 ? 2.2 : 1) * (5 + r() * 9)) {
      const jz = z + (r() - 0.5) * 2;
      if (accept(x, jz)) push(x, jz);
    }
  }
  // windows and yards between the streets
  for (let i = 0; i < 5200 * scale; i++) {
    const x = (r() - 0.5) * 840, z = -220 + r() * (CITY_END + 220);
    if (accept(x, z)) push(x, z);
  }
  // one bridge of lights across the river near the start, because it is Lisbon
  for (let x = riverX(40) - RIVER_HALF - 6; x < riverX(40) + RIVER_HALF + 6; x += 3.2) {
    out.push({ x, z: 40 + (x - riverX(40)) * 0.12, c: 1, b: 1, ph: r() * 6.283 });
  }
  out.sort((a, b) => a.z - b.z);
  return out;
}

// ------------------------------------------------------------ viewport --
let W = 0, H = 0, DPR = 1, F = 1, portrait = false, lateral = 1;
let lights: Light[] = [];
let lightZ = new Float32Array(0);

function resize() {
  W = innerWidth; H = innerHeight;
  DPR = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  portrait = W / H < 0.9;
  const fov = (portrait ? 60 : 48) * Math.PI / 180;
  F = (H / 2) / Math.tan(fov / 2);
  // On a narrow screen the beacons come in towards the route, or they would
  // stand outside the frame.
  lateral = portrait ? 0.32 : Math.min(1, (W / H) / 1.5);
  placeBeacons();
  letters = null;
  dirty = true;
}

// --------------------------------------------------------------- camera --
interface Cam { x: number; y: number; z: number; yaw: number; pitch: number }
const cam: Cam = { x: 0, y: CAM_H, z: 0, yaw: 0, pitch: 0.3 };
let cy = 1, sy = 0, cp = 1, sp = 0;

function setCam(c: Cam) {
  Object.assign(cam, c);
  cy = Math.cos(cam.yaw); sy = Math.sin(cam.yaw);
  cp = Math.cos(cam.pitch); sp = Math.sin(cam.pitch);
}
// Projects a world point. Returns depth in pz (<= 0 means behind the camera).
let px = 0, py = 0, pz = 0;
function project(x: number, y: number, z: number) {
  const dx = x - cam.x, dy = y - cam.y, dz = z - cam.z;
  const x1 = cy * dx - sy * dz;
  const z1 = sy * dx + cy * dz;
  const y2 = cp * dy + sp * z1;
  const z2 = -sp * dy + cp * z1;
  pz = z2;
  if (z2 <= 0.5) return false;
  px = W / 2 + (F * x1) / z2;
  py = H / 2 - (F * y2) / z2;
  return true;
}

// Where the camera should be for a point on the track. Between stops the
// camera keeps moving; it eases right down over each stop so a plate and its
// beacon hold still long enough to read.
function cruise(t: number): Cam {
  const pitchBase = portrait ? 0.46 : 0.31;
  let k = 0;
  for (let i = 0; i < stops.length; i++) if (stops[i].kind !== 'finale' && t >= stops[i].t) k = i;
  const a = stops[k];
  const b = stops[Math.min(k + 1, stops.length - 1)];
  const span = Math.max(b.t - a.t, 0.001);
  const u = clamp01((t - a.t) / span);
  const e = lerp(u, smoother(u), 0.62);
  const z = camZ(lerp(a.t, b.t, b === a ? 0 : e));
  const sideOf = (s: StopData) => (s.kind === 'pick' || s.kind === 'log' || s.kind === 'origin') ? (s.side === 'lead' ? 1 : -1) : 0;
  // lean towards the beacon side a touch, so the beacon sits in its third
  const yaw = lerp(sideOf(a), sideOf(b), smooth(u)) * (portrait ? 0.05 : 0.07);
  const x = lerp(sideOf(a), sideOf(b), smooth(u)) * 6 * lateral;
  return { x, y: CAM_H, z, yaw, pitch: pitchBase };
}

const FINALE_TURN = 0.15, FINALE_FORM = 0.6;
function finalePose(): Cam {
  return { x: 0, y: portrait ? 260 : 210, z: CITY_END + (portrait ? 260 : 170), yaw: Math.PI, pitch: portrait ? 0.34 : 0.25 };
}
function poseAt(t: number): { cam: Cam; f: number } {
  const F0 = finaleStop.t0;
  if (t < F0) return { cam: cruise(t), f: -1 };
  const f = clamp01((t - F0) / finaleStop.w);
  const a = cruise(F0 - 0.0001), b = finalePose();
  const u = smoother(f / FINALE_TURN);
  return {
    cam: {
      x: lerp(a.x, b.x, u),
      y: lerp(a.y, b.y, smooth(u)),
      z: lerp(a.z, b.z, u),
      yaw: lerp(a.yaw, b.yaw, u),
      pitch: lerp(a.pitch, b.pitch, u),
    },
    f,
  };
}

// -------------------------------------------------------------- beacons --
const beacons: Beacon[] = [];
function initBeacons() {
  beaconLayer.querySelectorAll<HTMLElement>('.beacon').forEach((el) => {
    beacons.push({
      el, id: el.dataset.id!, x: 0, z: 0, h: 0, size: 0,
      glow: el.dataset.glow || '#FF6A3D', pick: el.dataset.pick === '1', sprite: null,
      sx: 0, sy: 0, sp: 0, vis: -1,
      fx0: 0, fy0: 0, fs0: 0, fx1: 0, fy1: 0, fs1: 0, fd: 0,
    });
  });
  for (const b of beacons) b.sprite = poolSprite(b.glow);
}
function placeBeacons() {
  const r = rng(7);
  const byStop: Record<string, Beacon[]> = {};
  for (const b of beacons) {
    const sid = b.el.dataset.stop!;
    (byStop[sid] ||= []).push(b);
  }
  for (const s of stops) {
    const list = byStop[s.id];
    if (!list) continue;
    // a plate on the left puts its beacons on the right, and the other way round
    const dir = s.side === 'lead' ? 1 : -1;
    const z0 = camZ(s.t);
    if (s.kind === 'pick') {
      const b = list[0];
      // rank shows as size: Arcana, the top pick, is the largest beacon on the route
      const rank = +(b.el.dataset.rank || 8);
      b.size = 27 - (rank - 1) * 1.1;
      b.x = dir * (40 + b.size * 0.3) * lateral; b.z = z0 + 125; b.h = 18 + b.size * 0.4;
    } else {
      list.forEach((b, i) => {
        const n = list.length;
        b.z = z0 + 70 + (i / Math.max(n - 1, 1)) * 150 + r() * 12;
        b.x = dir * (26 + ((i * 37) % 70) + r() * 14) * (portrait ? 0.42 : lateral);
        b.h = 11 + r() * 5;
        b.size = 9;
      });
    }
  }
}
function poolSprite(color: string) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, color + 'cc');
  grad.addColorStop(0.35, color + '55');
  grad.addColorStop(1, color + '00');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return c;
}

// ---------------------------------------------------------------- years --
// Each era's year stands at the edge of its district like a sign seen from the
// air: real text, upright, so it stays crisp at every size.
interface Year { el: HTMLElement; z: number; vis: number }
const years: Year[] = [];
function initYears() {
  world.querySelectorAll<HTMLElement>('.year').forEach((el) => {
    const first = stopById[el.dataset.stop!];
    years.push({ el, z: camZ(first.t) + 210, vis: -1 });
  });
}
function placeYears(fade: number) {
  // Only the nearest year ahead is shown, so two signs never stack up.
  let nearest: Year | null = null, nd = Infinity;
  for (const y of years) {
    if (project(0, 0, y.z) && pz > 120 && pz < nd) { nd = pz; nearest = y; }
  }
  for (const y of years) {
    let op = 0;
    if (y === nearest && fade > 0 && project(0, 0, y.z)) {
      // seen from far off, gone before it gets close enough to fill the frame
      op = fog(pz) * clamp01((pz - 120) / 140) * fade;
    }
    if (op < 0.01) {
      if (y.vis !== 0) { y.el.style.visibility = 'hidden'; y.vis = 0; }
      continue;
    }
    const size = (24 * F) / pz;
    y.el.style.transform = `translate3d(${px.toFixed(1)}px,${py.toFixed(1)}px,0) scale(${(size / 200).toFixed(4)}) translate(-50%,-82%)`;
    y.el.style.opacity = op.toFixed(3);
    if (y.vis !== 1) { y.el.style.visibility = 'visible'; y.vis = 1; }
  }
}

// ------------------------------------------------------------- finale --
let letters: { pts: Float32Array; n: number; icons: { x: number; y: number }[]; iconSize: number; dot: number } | null = null;
let pairs: Pair[] = [];
let pairsReady = false;

function buildLetters() {
  const off = document.createElement('canvas');
  off.width = Math.round(W); off.height = Math.round(H);
  const g = off.getContext('2d', { willReadFrequently: true })!;
  const word = 'FELIX';
  const maxW = portrait ? W * 0.88 : Math.min(W * 0.72, 1080);
  let fs = 100;
  g.font = WORD_FONT.replace('{size}', String(fs));
  fs = fs * (maxW / g.measureText(word).width);
  fs = Math.min(fs, H * (portrait ? 0.2 : 0.36));
  g.font = WORD_FONT.replace('{size}', String(fs));
  const tw = g.measureText(word).width;
  const top = portrait ? H * 0.2 : H * 0.17;
  const capH = fs * 0.72;
  g.fillStyle = '#fff';
  g.textBaseline = 'alphabetic';
  g.fillText(word, (W - tw) / 2, top + capH);
  // The serif is drawn a little heavier than the type on the page, so its
  // stems are wide enough for the app icons to settle inside them.
  const bold = fs * 0.045;
  g.strokeStyle = '#fff'; g.lineWidth = bold; g.lineJoin = 'round';
  g.strokeText(word, (W - tw) / 2, top + capH);
  const img = g.getImageData(0, 0, off.width, off.height).data;
  const alpha = (x: number, y: number) => {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= off.width || y >= off.height) return 0;
    return img[(y * off.width + x) * 4 + 3];
  };
  const r = rng(14);
  const gap = portrait ? 2.9 : clamp(fs / 70, 3.4, 4.6);
  const pts: number[] = [];
  const inner: { x: number; y: number }[] = [];
  // an icon lands only where the letter is at least as wide as the icon
  const iconSize = clamp(fs * 0.1, 12, 34);
  const rad = iconSize * 0.5;
  for (let y = top - bold; y < top + capH + bold; y += gap) {
    for (let x = (W - tw) / 2 - bold; x < (W + tw) / 2 + bold; x += gap) {
      const jx = x + (r() - 0.5) * gap * 0.6, jy = y + (r() - 0.5) * gap * 0.6;
      if (alpha(jx, jy) > 140) {
        pts.push(jx, jy);
        let ok = true;
        for (let a = 0; a < 8 && ok; a++) {
          const an = (a / 8) * Math.PI * 2;
          if (alpha(jx + Math.cos(an) * rad, jy + Math.sin(an) * rad) < 140) ok = false;
        }
        if (ok) inner.push({ x: jx, y: jy });
      }
    }
  }
  // spread the icons evenly through the letterforms
  const icons: { x: number; y: number }[] = [];
  if (inner.length) {
    inner.sort((a, b) => a.x - b.x);
    icons.push(inner[0]);
    const dmin = new Float32Array(inner.length).fill(Infinity);
    while (icons.length < beacons.length && icons.length < inner.length) {
      const last = icons[icons.length - 1];
      let best = -1, bd = -1;
      for (let i = 0; i < inner.length; i++) {
        const d = (inner[i].x - last.x) ** 2 + (inner[i].y - last.y) ** 2;
        if (d < dmin[i]) dmin[i] = d;
        if (dmin[i] > bd) { bd = dmin[i]; best = i; }
      }
      icons.push(inner[best]);
    }
  }
  letters = { pts: new Float32Array(pts), n: pts.length / 2, icons, iconSize, dot: clamp(gap * 0.5, 1.4, 2.4) };
  pairsReady = false;
}

// Called once the camera has settled into the finale pose: every visible light
// is matched to a point in the letters, left to right, so they rise rather
// than cross.
function buildPairs() {
  if (!letters) buildLetters();
  const L = letters!;
  const vis: { i: number; x: number; y: number; s: number; a: number }[] = [];
  for (let i = 0; i < lights.length; i++) {
    const l = lights[i];
    if (!project(l.x, 0, l.z)) continue;
    if (px < -40 || px > W + 40 || py < -40 || py > H + 40) continue;
    vis.push({ i, x: px, y: py, s: lightSize(pz), a: fog(pz) });
  }
  const r = rng(20);
  const n = L.n;
  // sample the visible lights evenly down to the number of targets
  const chosen: typeof vis = [];
  if (vis.length >= n) {
    const step = vis.length / n;
    for (let k = 0; k < n; k++) chosen.push(vis[Math.floor(k * step + r() * step * 0.9)]);
  } else {
    for (let k = 0; k < n; k++) chosen.push(vis[k % Math.max(vis.length, 1)] || { i: 0, x: W / 2, y: H, s: 1, a: 0.5 });
  }
  chosen.sort((a, b) => a.x - b.x);
  const targets: { x: number; y: number }[] = [];
  for (let k = 0; k < n; k++) targets.push({ x: L.pts[k * 2], y: L.pts[k * 2 + 1] });
  targets.sort((a, b) => a.x - b.x);
  let minY = Infinity, maxY = -Infinity;
  for (const c of chosen) { minY = Math.min(minY, c.y); maxY = Math.max(maxY, c.y); }
  pairs = chosen.map((c, k) => ({
    li: c.i, x0: c.x, y0: c.y, s0: c.s, a0: c.a, x1: targets[k].x, y1: targets[k].y,
    // the far edge of the city lifts first and the wave rolls towards you
    d: 0.42 * ((c.y - minY) / Math.max(maxY - minY, 1)) + 0.1 * r(), ph: r() * 6.283,
  }));
  // beacons travel to their own places in the name
  beacons.forEach((b, i) => {
    const target = L.icons[i % Math.max(L.icons.length, 1)] || { x: W / 2, y: H / 2 };
    const ok = project(b.x, b.h, b.z);
    b.fx0 = ok ? px : b.x * 2 + W / 2; b.fy0 = ok ? py : H + 80;
    b.fs0 = ok ? clamp((b.size * F) / pz, 6, 200) : 30;
    b.fx1 = target.x; b.fy1 = target.y; b.fs1 = L.iconSize;
    b.fd = 0.3 + 0.22 * r();
  });
  pairsReady = true;
}

// ---------------------------------------------------------------- draw --
let fogFar = 1100;
const fog = (z: number) => clamp01(1 - (z - 260) / (fogFar - 260)) ** 1.25;
const lightSize = (z: number) => clamp(44 / z + 0.5, 0.65, 3.2);
// Lights are soft round points, not squares: a solid core with a short falloff.
function dotSprite(rgb: string) {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, `rgba(${rgb},1)`);
  grad.addColorStop(0.28, `rgba(${rgb},0.95)`);
  grad.addColorStop(0.5, `rgba(${rgb},0.35)`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grad; g.fillRect(0, 0, 32, 32);
  return c;
}
const dots = LIGHT_COLORS.map(dotSprite);
const DOT_SPREAD = 2.6; // sprite diameter per pixel of visible core
const glowSprite = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, `rgba(${LIGHT_COLORS[1]},0.9)`);
  grad.addColorStop(0.3, `rgba(${LIGHT_COLORS[0]},0.28)`);
  grad.addColorStop(1, `rgba(${LIGHT_COLORS[2]},0)`);
  g.fillStyle = grad; g.fillRect(0, 0, 32, 32);
  return c;
})();

let time = 0;
let dirty = true;

function lowerBound(z: number) {
  let lo = 0, hi = lightZ.length;
  while (lo < hi) { const m = (lo + hi) >> 1; if (lightZ[m] < z) lo = m + 1; else hi = m; }
  return lo;
}

function drawSky(f: number) {
  // horizon: where a ray at the camera's height would meet the far fog
  const horizon = H / 2 - F * Math.tan(cam.pitch);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, SKY[0]);
  g.addColorStop(clamp01(horizon / H - 0.12), SKY[1]);
  g.addColorStop(clamp01(horizon / H), SKY[2]);
  g.addColorStop(clamp01(horizon / H + 0.06), SKY[3]);
  g.addColorStop(1, CANVAS);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // a handful of stars, fixed to the sky so they turn with the camera
  const r = rng(3);
  ctx.fillStyle = `rgba(${INK},0.5)`;
  for (let i = 0; i < 90; i++) {
    const az = r() * Math.PI * 2, el = r() * 0.5 + 0.03;
    let a = az - cam.yaw;
    a = Math.atan2(Math.sin(a), Math.cos(a));
    if (Math.abs(a) > 1.2) { r(); continue; }
    const x = W / 2 + F * Math.tan(a);
    const y = horizon - F * Math.tan(el);
    const tw = reduce ? 0.6 : 0.45 + 0.35 * Math.sin(time * 0.9 + i);
    if (y < horizon - 6) { ctx.globalAlpha = tw * (f >= 0 ? 1 : 0.8) * r(); ctx.drawImage(dots[1], x - 1.6, y - 1.6, 3.2, 3.2); } else r();
  }
  ctx.globalAlpha = 1;
}

function drawGround(fade: number) {
  if (fade <= 0) return;
  // the route ahead, dashed, in the accent
  ctx.strokeStyle = `rgba(${ACCENT},0.5)`;
  ctx.lineWidth = 1.2;
  ctx.setLineDash([6, 9]);
  ctx.beginPath();
  let started = false;
  const zA = cam.z - 30, zB = Math.min(cam.z + 900, CITY_END);
  for (let z = zA; z < zB; z += 8) {
    const t = z / ZPER;
    const c = cruise(t);
    if (!project(c.x, 0, z)) { started = false; continue; }
    const a = fog(pz) * fade;
    if (a < 0.02) continue;
    if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
  }
  ctx.globalAlpha = fade;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}

function drawLights(f: number, fB: number) {
  const ahead = Math.cos(cam.yaw) > 0;
  const turning = Math.abs(Math.sin(cam.yaw)) > 0.2;
  const zMin = turning ? cam.z - fogFar : ahead ? cam.z - 40 : cam.z - fogFar;
  const zMax = turning ? cam.z + fogFar : ahead ? cam.z + fogFar : cam.z + 40;
  const i0 = lowerBound(zMin), i1 = lowerBound(zMax);
  const fadeRest = fB > 0 ? 1 - smooth(fB * 1.8) : 1;
  ctx.globalCompositeOperation = 'lighter';
  {
    for (let i = i0; i < i1; i++) {
      const l = lights[i];
      if (!project(l.x, 0, l.z)) continue;
      if (px < -4 || px > W + 4 || py < -4 || py > H + 4) continue;
      let a = fog(pz);
      if (a < 0.02) continue;
      if (!reduce && l.b) a *= 0.75 + 0.25 * Math.sin(time * 1.7 + l.ph);
      a *= fadeRest;
      if (a < 0.02) continue;
      const s = lightSize(pz);
      ctx.globalAlpha = a;
      const d = s * DOT_SPREAD;
      ctx.drawImage(dots[l.c], px - d / 2, py - d / 2, d, d);
      if (l.b && pz < 240) {
        const gs = s * 7;
        ctx.globalAlpha = a * 0.55;
        ctx.drawImage(glowSprite, px - gs / 2, py - gs / 2, gs, gs);
      }
    }
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}

function drawPoolsAndBeams(fade: number) {
  if (fade <= 0) return;
  ctx.globalCompositeOperation = 'lighter';
  for (const b of beacons) {
    if (!project(b.x, 0, b.z)) continue;
    const gx = px, gy = py, gz = pz;
    // the light on the ground keeps clear of the year rail, like its icon
    const a = fog(gz) * fade * (portrait ? 1 : clamp01((W - 190 - gx) / 70));
    if (a < 0.02) continue;
    // pool of the app's colour on the ground: an ellipse from the ground basis
    const R = b.pick ? 22 : 9;
    project(b.x + R, 0, b.z); const ux = px - gx, uy = py - gy;
    project(b.x, 0, b.z + R); const vx = px - gx, vy = py - gy;
    ctx.globalAlpha = a * (b.pick ? 0.9 : 0.7);
    ctx.setTransform(ux / 32 * DPR, uy / 32 * DPR, vx / 32 * DPR, vy / 32 * DPR, gx * DPR, gy * DPR);
    ctx.drawImage(b.sprite!, -32, -32, 64, 64);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    // a thin beam from the ground to the icon
    if (project(b.x, b.h - b.size * 0.5, b.z)) {
      const grad = ctx.createLinearGradient(gx, gy, px, py);
      grad.addColorStop(0, b.glow + '00');
      grad.addColorStop(1, b.glow + 'aa');
      ctx.strokeStyle = grad;
      ctx.lineWidth = b.pick ? 1.6 : 1;
      ctx.globalAlpha = a;
      ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(px, py); ctx.stroke();
    }
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}

function drawLetters(fB: number) {
  if (!pairsReady) return;
  const L = letters!;
  ctx.globalCompositeOperation = 'lighter';
  for (const p of pairs) {
    const e = smoother((fB - p.d) / 0.44);
    const x = lerp(p.x0, p.x1, e);
    const y = lerp(p.y0, p.y1, e) - Math.sin(Math.PI * e) * 26;
    const s = lerp(p.s0, L.dot, e);
    let a = lerp(p.a0, 1, e);
    if (e >= 1 && !reduce) a *= 0.86 + 0.14 * Math.sin(time * 1.2 + p.ph);
    const c = lights[p.li]?.c ?? 0;
    const d = s * DOT_SPREAD;
    ctx.globalAlpha = a;
    ctx.drawImage(dots[e > 0.6 && c === 3 ? 1 : c], x - d / 2, y - d / 2, d, d);
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}

function placeBeaconEls(f: number, fB: number) {
  const fade = f < 0 ? 1 : 1 - smooth(f / FINALE_TURN * 1.4);
  for (const b of beacons) {
    let x: number, y: number, size: number, op: number, label = false;
    if (fB > 0 && pairsReady) {
      const e = smoother((fB - b.fd) / 0.42);
      x = lerp(b.fx0, b.fx1, e);
      y = lerp(b.fy0, b.fy1, e) - Math.sin(Math.PI * e) * 40;
      size = lerp(b.fs0, b.fs1, e);
      op = e > 0 ? clamp01(e * 3) : 0;
    } else {
      if (!project(b.x, b.h, b.z)) { hideBeacon(b); continue; }
      size = (b.size * F) / pz;
      x = px; y = py;
      // fade in from the distance and out as it passes too close
      op = fog(pz) * clamp01((pz - 22) / 30) * fade;
      // Archive beacons are named as you pass them. A pick is named by its
      // plate, so its label only shows while it is still far off.
      label = op > 0.6 && (b.pick ? size > 30 && size < 110 : size > (portrait ? 30 : 40));
      if (x < -size * 2 || x > W + size * 2 || y < -size * 2 || y > H + size) { hideBeacon(b); continue; }
      // keep clear of the year rail on the right edge
      if (!portrait) { const railX = W - 190; op *= clamp01((railX - x) / 70); if (x > railX - 30) label = false; }
    }
    if (op < 0.01) { hideBeacon(b); continue; }
    b.el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
    b.el.style.setProperty('--s', (size / 96).toFixed(4));
    b.el.style.setProperty('--half', (size / 2).toFixed(1) + 'px');
    b.el.style.opacity = op.toFixed(3);
    if (b.vis !== 1) { b.el.style.visibility = 'visible'; b.vis = 1; }
    b.el.classList.toggle('is-labelled', label);
  }
}
function hideBeacon(b: Beacon) {
  if (b.vis !== 0) { b.el.style.visibility = 'hidden'; b.vis = 0; }
}

function render() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const { f } = state;
  const fB = f < 0 ? 0 : clamp01((f - FINALE_TURN) / (FINALE_FORM - FINALE_TURN));
  fogFar = f < 0 ? 1100 : lerp(1100, 3400, smooth(f / FINALE_TURN));
  drawSky(f);
  const groundFade = f < 0 ? 1 : 1 - smooth(f / FINALE_TURN);
  drawGround(groundFade);
  placeYears(groundFade);
  drawLights(f, fB);
  drawPoolsAndBeams(groundFade);
  if (fB > 0) {
    if (!pairsReady) buildPairs();
    drawLetters(fB);
  } else if (f >= 0 && f < FINALE_TURN) {
    pairsReady = false;
  }
  placeBeaconEls(f, fB);
  world.dataset.scVerifyState = `${cam.z.toFixed(0)}|${cam.yaw.toFixed(2)}|${fB.toFixed(2)}`;
}

// ---------------------------------------------------------- scroll loop --
const state = { t: 0, target: 0, f: -1 };
let rootTop = 0;
let mx = 0.5, my = 0.5, lx = 0.5, ly = 0.5;

function trackT() {
  return clamp((scrollY - rootTop) / Math.max(innerHeight, 1), 0, data.total);
}

// Under reduced motion the camera never travels. It holds the framing of the
// stop being read and dissolves to the next one.
let snapped = '';
function reducedTarget(t: number) {
  if (t >= finaleStop.t0) {
    const f = (t - finaleStop.t0) / finaleStop.w;
    return f < FINALE_TURN + 0.05 ? finaleStop.t0 + finaleStop.w * (FINALE_TURN + 0.01) : finaleStop.t1;
  }
  let s = stops[0];
  for (const st of stops) if (t >= st.t0 && st.kind !== 'silence') s = st;
  return s.t;
}

function frame(now: number) {
  time = now / 1000;
  const raw = trackT();
  if (reduce) {
    const tgt = reducedTarget(raw);
    const key = tgt.toFixed(3);
    if (key !== snapped) {
      const first = snapped === '';
      snapped = key;
      if (first) { state.t = tgt; dirty = true; }
      else {
        world.classList.add('is-dissolving');
        setTimeout(() => { state.t = tgt; dirty = true; world.classList.remove('is-dissolving'); }, 200);
      }
    }
  } else {
    state.target = raw;
    const d = state.target - state.t;
    if (Math.abs(d) > 0.0004) { state.t += d * 0.12; dirty = true; }
    else if (d !== 0) { state.t = state.target; dirty = true; }
  }
  if (finePointer && !reduce) {
    const dx = mx - lx, dy = my - ly;
    if (Math.abs(dx) + Math.abs(dy) > 0.0005) { lx += dx * 0.06; ly += dy * 0.06; dirty = true; }
  }
  const pose = poseAt(state.t);
  state.f = pose.f;
  // the camera leans a little towards the pointer, so the city answers you
  pose.cam.yaw += (lx - 0.5) * 0.05 * (pose.f < 0 ? 1 : 0.3);
  pose.cam.pitch += (ly - 0.5) * 0.03 * (pose.f < 0 ? 1 : 0.3);
  setCam(pose.cam);
  // the city breathes: lights twinkle, so it keeps drawing while on screen
  if (!reduce) dirty = true;
  if (dirty) { render(); dirty = false; }
  updateChrome(raw);
  if (!document.hidden) requestAnimationFrame(frame);
}

// --------------------------------------------------------------- chrome --
const mapLinks = [...document.querySelectorAll<HTMLAnchorElement>('[data-goto-leg]')];
const marker = document.querySelector<HTMLElement>('.map__marker');
const readout = document.querySelector<HTMLElement>('[data-era-readout]');
let lastLeg = -1;
function updateChrome(t: number) {
  document.documentElement.classList.toggle('past-hero', t > 0.55);
  let k = 0;
  for (let i = 0; i < data.legs.length; i++) if (t >= data.legs[i].c0 - 0.001) k = i;
  if (k !== lastLeg) {
    lastLeg = k;
    mapLinks.forEach((a, i) => { if (i === k) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current'); });
    if (readout) readout.textContent = data.legs[k].label;
  }
  if (marker && mapLinks.length) {
    const leg = data.legs[k];
    const u = clamp01((t - leg.c0) / leg.w);
    const a = mapLinks[k], b = mapLinks[Math.min(k + 1, mapLinks.length - 1)];
    const ya = a.offsetTop + a.offsetHeight / 2, yb = b.offsetTop + b.offsetHeight / 2;
    marker.style.transform = `translate3d(0,${lerp(ya, yb, k === mapLinks.length - 1 ? 0 : u).toFixed(1)}px,0)`;
  }
}

export function goto(id: string, instant = false) {
  const s = stopById[id];
  if (!s) return;
  const t = s.kind === 'finale' ? s.t1 : s.t;
  scrollTo({ top: rootTop + t * innerHeight + 1, behavior: instant || reduce ? 'instant' : 'smooth' });
}
(window as any).__flightGoto = goto;

function measure() { rootTop = root.getBoundingClientRect().top + scrollY; }

// --------------------------------------------------------------- start --
function start() {
  lights = buildCity(portraitAtStart() ? 0.55 : 1);
  lightZ = new Float32Array(lights.map((l) => l.z));
  initBeacons();
  initYears();
  resize();
  measure();
  state.t = state.target = trackT();
  addEventListener('resize', () => { resize(); measure(); });
  if (finePointer) {
    addEventListener('pointermove', (e) => { mx = e.clientX / innerWidth; my = e.clientY / innerHeight; }, { passive: true });
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) requestAnimationFrame(frame); });

  mapLinks.forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); goto(a.dataset.gotoLeg!); }));
  document.querySelectorAll<HTMLElement>('[data-goto]').forEach((el) => el.addEventListener('click', (e) => {
    e.preventDefault();
    const dlg = el.closest('dialog');
    if (dlg) dlg.close();
    goto(el.dataset.goto!);
  }));
  // Keyboard focus that lands in a plate nobody can see flies to that plate.
  document.querySelector('[data-sc-world-copy]')!.addEventListener('focusin', (e) => {
    const block = (e.target as HTMLElement).closest<HTMLElement>('[data-stop]');
    if (!block) return;
    if (parseFloat(block.style.opacity || '0') < 0.6) goto(block.dataset.stop!, true);
  });

  requestAnimationFrame(frame);
}
function portraitAtStart() { return innerWidth / innerHeight < 0.9 || innerWidth < 700; }

// The engine sizes its spacer once at mount. One resize after load and after
// the fonts settle makes it re-measure (worldflight.md section 7b).
function relayout() { dispatchEvent(new Event('resize')); }

const SC = (window as any).ScrollCraft;
if (SC) SC.mount(document);
document.fonts.ready.then(() => { letters = null; relayout(); dirty = true; });
addEventListener('load', relayout);
start();
