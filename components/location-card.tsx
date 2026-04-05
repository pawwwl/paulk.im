"use client";

import { useEffect, useRef, useState } from "react";

// ── Constants ─────────────────────────────────────────────────────────────────
const TILE = 1200; // logical px width of one seamless loop tile

// ── Seeded PRNG ───────────────────────────────────────────────────────────────
function mkRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 0x100000000;
  };
}

// ── Scene interpolation helpers ───────────────────────────────────────────────
type C3 = [number, number, number];
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpC3 = (a: C3, b: C3, t: number): C3 => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];
const rgbaC3 = ([r, g, b]: C3, a: number) =>
  `rgba(${r | 0},${g | 0},${b | 0},${a.toFixed(2)})`;

// Keyframes: sky top/bot RGB, star alpha, window-lit fraction, mountain layer colors
type SceneKF = {
  h: number;
  sT: C3;
  sB: C3;
  sa: number;
  lf: number;
  mF: C3;
  mFa: number;
  mM: C3;
  mMa: number;
  mN: C3;
  mNa: number;
};
const SCENE_KFS: SceneKF[] = [
  {
    h: 0,
    sT: [0, 3, 12],
    sB: [3, 10, 30],
    sa: 1.0,
    lf: 1.0,
    mF: [18, 38, 85],
    mFa: 0.7,
    mM: [10, 24, 60],
    mMa: 0.82,
    mN: [5, 14, 40],
    mNa: 0.9,
  },
  {
    h: 5,
    sT: [10, 5, 28],
    sB: [45, 18, 42],
    sa: 0.7,
    lf: 0.8,
    mF: [22, 32, 72],
    mFa: 0.62,
    mM: [14, 20, 52],
    mMa: 0.76,
    mN: [8, 12, 36],
    mNa: 0.88,
  },
  {
    h: 6,
    sT: [150, 55, 10],
    sB: [225, 135, 55],
    sa: 0.0,
    lf: 0.4,
    mF: [110, 78, 55],
    mFa: 0.55,
    mM: [75, 55, 38],
    mMa: 0.7,
    mN: [45, 33, 22],
    mNa: 0.85,
  },
  {
    h: 8,
    sT: [50, 110, 195],
    sB: [155, 198, 236],
    sa: 0.0,
    lf: 0.0,
    mF: [85, 108, 138],
    mFa: 0.52,
    mM: [62, 88, 118],
    mMa: 0.68,
    mN: [40, 62, 92],
    mNa: 0.82,
  },
  {
    h: 13,
    sT: [22, 90, 188],
    sB: [138, 188, 234],
    sa: 0.0,
    lf: 0.0,
    mF: [90, 115, 145],
    mFa: 0.48,
    mM: [66, 92, 122],
    mMa: 0.64,
    mN: [42, 66, 96],
    mNa: 0.78,
  },
  {
    h: 18,
    sT: [38, 105, 196],
    sB: [158, 200, 234],
    sa: 0.0,
    lf: 0.0,
    mF: [85, 108, 138],
    mFa: 0.52,
    mM: [62, 88, 118],
    mMa: 0.68,
    mN: [40, 62, 92],
    mNa: 0.82,
  },
  {
    h: 19.5,
    sT: [185, 60, 12],
    sB: [172, 50, 8],
    sa: 0.0,
    lf: 0.2,
    mF: [105, 68, 42],
    mFa: 0.58,
    mM: [70, 48, 30],
    mMa: 0.72,
    mN: [42, 30, 20],
    mNa: 0.86,
  },
  {
    h: 21,
    sT: [8, 5, 32],
    sB: [45, 16, 42],
    sa: 0.5,
    lf: 0.6,
    mF: [22, 34, 75],
    mFa: 0.65,
    mM: [12, 22, 55],
    mMa: 0.78,
    mN: [6, 12, 36],
    mNa: 0.9,
  },
  {
    h: 22,
    sT: [0, 3, 12],
    sB: [3, 10, 30],
    sa: 1.0,
    lf: 1.0,
    mF: [18, 38, 85],
    mFa: 0.7,
    mM: [10, 24, 60],
    mMa: 0.82,
    mN: [5, 14, 40],
    mNa: 0.9,
  },
  {
    h: 24,
    sT: [0, 3, 12],
    sB: [3, 10, 30],
    sa: 1.0,
    lf: 1.0,
    mF: [18, 38, 85],
    mFa: 0.7,
    mM: [10, 24, 60],
    mMa: 0.82,
    mN: [5, 14, 40],
    mNa: 0.9,
  },
];

// ── Building types ────────────────────────────────────────────────────────────
interface WinState {
  lit: boolean;
  cd: number;
}
interface Building {
  x: number;
  w: number;
  h: number;
  cols: number;
  rows: number;
  wins: WinState[];
  antennaH: number;
  outline: string;
  dayFill: C3;
}

function makeBuildings(
  seed: number,
  minW: number,
  maxW: number,
  minH: number,
  maxH: number,
  minGap: number,
  maxGap: number,
): Building[] {
  const rng = mkRng(seed);
  const arr: Building[] = [];
  let x = 0;
  while (x < TILE + maxW) {
    const w = minW + rng() * (maxW - minW);
    const h = minH + rng() * (maxH - minH);
    const cols = Math.max(1, Math.floor((w - 4) / 9));
    const rows = Math.max(1, Math.floor((h - 6) / 13));
    const wins: WinState[] = Array.from({ length: cols * rows }, () => ({
      lit: rng() > 0.42,
      cd: rng() * 500 + 80,
    }));
    // Varied outline shades: bright cyan, mid teal, dim green, faint
    const outlinePick = rng();
    const outline =
      outlinePick > 0.75
        ? `rgba(0,229,255,${(0.25 + rng() * 0.35).toFixed(2)})`
        : outlinePick > 0.5
          ? `rgba(0,200,120,${(0.15 + rng() * 0.3).toFixed(2)})`
          : outlinePick > 0.25
            ? `rgba(0,140,70,${(0.12 + rng() * 0.2).toFixed(2)})`
            : `rgba(0,80,35,${(0.1 + rng() * 0.15).toFixed(2)})`;
    // Daytime building colors: concrete, sandstone, brick, steel, terracotta
    const DAY_PALETTES: C3[] = [
      [108, 104, 98],  // concrete grey
      [118, 110, 92],  // sandstone
      [102, 78, 64],   // warm brick
      [90, 96, 102],   // steel blue-grey
      [114, 92, 76],   // terracotta
      [98, 104, 94],   // sage grey
      [122, 112, 100], // warm limestone
      [84, 90, 96],    // slate
    ];
    const dayFill = DAY_PALETTES[Math.floor(rng() * DAY_PALETTES.length)];
    arr.push({
      x,
      w,
      h,
      cols,
      rows,
      wins,
      antennaH: rng() > 0.55 ? 8 + rng() * 22 : 0,
      outline,
      dayFill,
    });
    x += w + minGap + rng() * (maxGap - minGap);
  }
  return arr;
}

// ── Mountain types ────────────────────────────────────────────────────────────
interface Mountain {
  cx: number; // center x in tile space
  w: number; // width in px (tile space)
  hFrac: number; // peak height as fraction of H
  baseFrac: number; // base y as fraction of H
  peakOff: number; // peak x offset as fraction of w (-0.3..0.3)
  leftShY: number; // left shoulder height fraction of peak height (0 = none)
  leftShX: number; // left shoulder x as fraction of w (negative)
  rightShY: number;
  rightShX: number;
  snowFrac: number; // fraction of mountain height covered by snow
}

function makeMountainLayer(
  seed: number,
  count: number,
  baseFrac: number,
  minHFrac: number,
  maxHFrac: number,
  minW: number,
  maxW: number,
  minSnow: number,
  maxSnow: number,
): Mountain[] {
  const rng = mkRng(seed);
  const mountains: Mountain[] = [];
  const spacing = TILE / count;
  for (let i = 0; i < count; i++) {
    const cx = spacing * (i + 0.5) + (rng() - 0.5) * spacing * 0.6;
    const w = minW + rng() * (maxW - minW);
    const hFrac = minHFrac + rng() * (maxHFrac - minHFrac);
    const peakOff = (rng() - 0.5) * 0.22;
    const hasLeftSh = rng() > 0.3;
    const hasRightSh = rng() > 0.3;
    mountains.push({
      cx,
      w,
      hFrac,
      baseFrac,
      peakOff,
      leftShY: hasLeftSh ? 0.52 + rng() * 0.28 : 0,
      leftShX: -(0.18 + rng() * 0.14),
      rightShY: hasRightSh ? 0.48 + rng() * 0.28 : 0,
      rightShX: 0.16 + rng() * 0.14,
      snowFrac: minSnow + rng() * (maxSnow - minSnow),
    });
  }
  return mountains;
}

// ── Star type ─────────────────────────────────────────────────────────────────
interface Star {
  lx: number;
  yFrac: number;
  r: number;
  phase: number;
  ts: number;
}
function makeStars(n: number): Star[] {
  const rng = mkRng(999);
  return Array.from({ length: n }, () => ({
    lx: rng() * TILE,
    yFrac: rng() * 0.5,
    r: 0.4 + rng() * 1.2,
    phase: rng() * Math.PI * 2,
    ts: 0.4 + rng() * 1.7,
  }));
}

// ── Pre-generate static scene data (module-level) ─────────────────────────────
// Individual mountain layers (back → front). baseFrac = base y as fraction of H.
const MTNS_FAR = makeMountainLayer(
  11,
  6,
  0.68,
  0.48,
  0.63,
  230,
  460,
  0.4,
  0.64,
);
const MTNS_MID = makeMountainLayer(
  33,
  9,
  0.72,
  0.27,
  0.44,
  140,
  270,
  0.1,
  0.27,
);
const MTNS_NEAR = makeMountainLayer(
  22,
  11,
  0.76,
  0.15,
  0.28,
  85,
  180,
  0.0,
  0.0,
);
const STARS = makeStars(70);

// ── Weather ───────────────────────────────────────────────────────────────────
type WeatherType = "none" | "snow" | "rain" | "wind" | "fog" | "storm" | "earthquake";
interface EqCollapse {
  layer: "sc" | "mr" | "ap";
  idx: number;
  tilt: number;
  targetTilt: number;
  fallY: number;
  type: "collapse" | "lean";
  startDelay: number; // ms before this building starts moving
}
interface EqSmoke {
  x: number; y: number; vx: number; vy: number;
  r: number; alpha: number; life: number; maxLife: number;
}
interface EqState {
  eqTime: number;
  shakeAmt: number;
  collapses: EqCollapse[];
  debris: Array<{ x: number; y: number; vx: number; vy: number; w: number; h: number; rot: number; rotV: number; alpha: number; life: number }>;
  smoke: EqSmoke[];
  initialized: boolean;
}
interface WxParticle {
  x: number; y: number; vx: number; vy: number;
  r: number; len: number; alpha: number;
  // wind swirl only
  trail?: Array<{ x: number; y: number }>;
  life?: number;
  maxLife?: number;
}
interface LightningBolt {
  pts: Array<{ x: number; y: number }>;
  branches: Array<Array<{ x: number; y: number }>>;
  age: number;
  maxAge: number;
}
interface LightningState {
  bolts: LightningBolt[];
  flash: number;
  nextStrike: number;
}

// Curl flow field for Van Gogh-style wind swirls — overlapping sine/cosine
// waves at different scales produce large turbulent vortices.
function windFlowAngle(x: number, y: number, t: number): number {
  const s = 0.0032, ts = t * 0.00011;
  return Math.sin(x * s + ts) * 1.8
       + Math.cos(y * s * 0.85 - ts * 0.65) * 1.3
       + Math.sin((x - y) * s * 0.55 + ts * 0.45) * 0.9;
}

// Building factories (called per mount so window state is per-instance)
const mkSkysc = () => makeBuildings(33, 11, 28, 68, 120, 0, 2);
const mkMidR = () => makeBuildings(44, 14, 35, 38, 70, 0, 2);
const mkApts = () => makeBuildings(55, 42, 85, 20, 40, 0, 3);

// ── Component ─────────────────────────────────────────────────────────────────
export function LocationCard() {
  const [elevation, setElevation] = useState(0);
  const [showConditions, setShowConditions] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollRef = useRef(0);
  const tRef = useRef(0);
  const startHrRef = useRef(
    new Date().getHours() + new Date().getMinutes() / 60,
  );

  // Mutable per-mount building state (window flicker)
  const bRef = useRef<{
    sc: Building[];
    mr: Building[];
    ap: Building[];
  } | null>(null);
  if (!bRef.current)
    bRef.current = { sc: mkSkysc(), mr: mkMidR(), ap: mkApts() };

  // Randomized inclement weather — repicked each day/night cycle
  const weatherRef = useRef<WeatherType | null>(null);
  if (!weatherRef.current) {
    const picks: WeatherType[] = ["none", "snow", "rain", "wind", "fog", "storm", "earthquake"];
    weatherRef.current = picks[Math.floor(Math.random() * picks.length)];
  }
  const wxPRef = useRef<WxParticle[]>([]);
  const wxPhaseRef = useRef<"on" | "off">("on");
  const wxPhaseStartRef = useRef(0);
  const lightningRef = useRef<LightningState>({ bolts: [], flash: 0, nextStrike: 2000 + Math.random() * 4000 });
  const eqStateRef = useRef<EqState>({ eqTime: 0, shakeAmt: 0, collapses: [], debris: [], smoke: [], initialized: false });

  // ── Elevation count-up on scroll into view ────────────────────────────────
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        const target = 5280,
          duration = 2200,
          t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - t0) / duration, 1);
          setElevation(Math.round((1 - Math.pow(2, -10 * p)) * target));
          if (p < 1) requestAnimationFrame(tick);
          else setTimeout(() => setShowConditions(true), 300);
        };
        requestAnimationFrame(tick);
        observer.disconnect();
      },
      { threshold: 0.4 },
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  // ── Canvas render loop ────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let lastTs = 0;
    let W = 0,
      H = 0;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas!.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas!.width = Math.round(W * dpr);
      canvas!.height = Math.round(H * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    // ── Helpers ──────────────────────────────────────────────────────────────
    function drawMountainLayer(
      mountains: Mountain[],
      scrollX: number,
      bodyColor: string,
      outlineColor: string,
    ) {
      for (const m of mountains) {
        const baseY = m.baseFrac * H;
        const h = m.hFrac * H;
        for (let copy = 0; copy < 2; copy++) {
          const sx = m.cx - scrollX + copy * TILE;
          if (sx + m.w / 2 < -5 || sx - m.w / 2 > W + 5) continue;
          const px = sx + m.peakOff * m.w;
          const py = baseY - h;

          // Silhouette path
          ctx!.beginPath();
          ctx!.moveTo(sx - m.w / 2, baseY);
          if (m.leftShY > 0)
            ctx!.lineTo(sx + m.leftShX * m.w, baseY - h * m.leftShY);
          ctx!.lineTo(px, py);
          if (m.rightShY > 0)
            ctx!.lineTo(sx + m.rightShX * m.w, baseY - h * m.rightShY);
          ctx!.lineTo(sx + m.w / 2, baseY);
          ctx!.closePath();

          // Body
          ctx!.fillStyle = bodyColor;
          ctx!.fill();

          // Snow cap — clip to mountain shape, gradient from peak down
          if (m.snowFrac > 0) {
            ctx!.save();
            ctx!.clip();
            const snowBottom = py + h * (1 - m.snowFrac) * 0.55;
            const g = ctx!.createLinearGradient(0, py - 4, 0, snowBottom);
            g.addColorStop(0, "rgba(225,240,255,0.96)");
            g.addColorStop(0.45, "rgba(210,230,255,0.68)");
            g.addColorStop(1, "rgba(190,220,255,0.00)");
            ctx!.fillStyle = g;
            ctx!.fillRect(sx - m.w / 2, py - 4, m.w, snowBottom - py + 4);
            ctx!.restore();
          }

          // Subtle outline
          ctx!.beginPath();
          ctx!.moveTo(sx - m.w / 2, baseY);
          if (m.leftShY > 0)
            ctx!.lineTo(sx + m.leftShX * m.w, baseY - h * m.leftShY);
          ctx!.lineTo(px, py);
          if (m.rightShY > 0)
            ctx!.lineTo(sx + m.rightShX * m.w, baseY - h * m.rightShY);
          ctx!.lineTo(sx + m.w / 2, baseY);
          ctx!.strokeStyle = outlineColor;
          ctx!.lineWidth = 0.75;
          ctx!.stroke();
        }
      }
    }

    function drawBuildings(
      buildings: Building[],
      scrollX: number,
      nightFill: C3,
      winCol: string,
      dayWinCol?: string,
      dayFrac = 0,
      alphaMap?: Map<number, number>,
    ) {
      for (let bIdx = 0; bIdx < buildings.length; bIdx++) {
        const alphaOverride = alphaMap?.get(bIdx);
        if (alphaOverride === 0) continue;
        const needsAlpha = alphaOverride !== undefined && alphaOverride < 1;
        if (needsAlpha) { ctx!.save(); ctx!.globalAlpha = alphaOverride!; }
        const b = buildings[bIdx];
        for (let copy = 0; copy < 2; copy++) {
          const sx = b.x - scrollX + copy * TILE;
          if (sx + b.w < 0 || sx > W) continue;
          const top = H - b.h;
          // Body — blend night fill → per-building day color
          const bc = lerpC3(nightFill, b.dayFill, dayFrac);
          ctx!.fillStyle = `rgb(${bc[0] | 0},${bc[1] | 0},${bc[2] | 0})`;
          ctx!.fillRect(sx, top, b.w, b.h);
          // Daytime shadow: dark gradient on right ~40% of face
          if (dayFrac > 0.01) {
            const shadeA = dayFrac * 0.45;
            const sg = ctx!.createLinearGradient(sx + b.w * 0.55, 0, sx + b.w, 0);
            sg.addColorStop(0, `rgba(0,0,0,0)`);
            sg.addColorStop(1, `rgba(0,0,0,${shadeA.toFixed(2)})`);
            ctx!.fillStyle = sg;
            ctx!.fillRect(sx, top, b.w, b.h);
          }
          // Outline
          ctx!.strokeStyle = b.outline;
          ctx!.lineWidth = 0.75;
          ctx!.strokeRect(sx + 0.375, top + 0.375, b.w - 0.75, b.h - 0.75);
          // Antenna
          if (b.antennaH > 0) {
            ctx!.fillStyle = `rgb(${bc[0] | 0},${bc[1] | 0},${bc[2] | 0})`;
            ctx!.fillRect(sx + b.w / 2 - 1, top - b.antennaH, 2, b.antennaH);
            ctx!.strokeStyle = b.outline;
            ctx!.strokeRect(
              sx + b.w / 2 - 1 + 0.375,
              top - b.antennaH + 0.375,
              1.25,
              b.antennaH - 0.75,
            );
          }
          // Windows
          const csp = (b.w - 6) / b.cols;
          const rsp = (b.h - 8) / b.rows;
          for (let r = 0; r < b.rows; r++) {
            for (let c = 0; c < b.cols; c++) {
              const wx = sx + 3 + c * csp;
              const wy = top + 5 + r * rsp;
              // Daytime: all windows show as reflective glass
              if (dayWinCol) {
                ctx!.fillStyle = dayWinCol;
                ctx!.fillRect(wx, wy, 4, 5);
              }
              // Night: only lit windows glow
              if (b.wins[r * b.cols + c].lit) {
                ctx!.fillStyle = winCol;
                ctx!.fillRect(wx, wy, 4, 5);
              }
            }
          }
          // Snow on rooftop — lumpy cap with icicle drips
          const snowH = Math.max(2, b.w * 0.045);
          const sg = ctx!.createLinearGradient(0, top - snowH, 0, top + snowH * 0.6);
          sg.addColorStop(0, "rgba(230,242,255,0.97)");
          sg.addColorStop(1, "rgba(200,225,248,0.0)");
          ctx!.fillStyle = sg;
          ctx!.beginPath();
          // Slightly bumpy roofline using seeded offsets derived from building x
          const bumpCount = Math.ceil(b.w / 7);
          ctx!.moveTo(sx, top + snowH * 0.4);
          for (let i = 0; i <= bumpCount; i++) {
            const bx = sx + (i / bumpCount) * b.w;
            const bumpSeed = Math.sin(b.x * 0.37 + i * 1.9) * 0.5 + 0.5;
            const by = top - snowH * (0.5 + bumpSeed * 0.6);
            ctx!.lineTo(bx, by);
          }
          ctx!.lineTo(sx + b.w, top + snowH * 0.4);
          ctx!.closePath();
          ctx!.fill();
          // Icicle drips along roofline
          const icicleCount = Math.floor(b.w / 9);
          for (let i = 0; i < icicleCount; i++) {
            const ix = sx + 4 + i * (b.w - 8) / Math.max(1, icicleCount - 1);
            const iLen = snowH * (0.7 + Math.sin(b.x * 0.53 + i * 2.3) * 0.3);
            const ig = ctx!.createLinearGradient(0, top, 0, top + iLen);
            ig.addColorStop(0, "rgba(210,235,255,0.85)");
            ig.addColorStop(1, "rgba(190,220,250,0.0)");
            ctx!.fillStyle = ig;
            ctx!.beginPath();
            ctx!.moveTo(ix - 1.5, top);
            ctx!.lineTo(ix, top + iLen);
            ctx!.lineTo(ix + 1.5, top);
            ctx!.closePath();
            ctx!.fill();
          }
        }
        if (needsAlpha) ctx!.restore();
      }
    }

    // ── Weather particle spawner ──────────────────────────────────────────────
    function spawnWx(wx: WeatherType, windAng: number, scatter: boolean): WxParticle {
      const r = Math.random;
      if (wx === "snow") {
        return { x: r() * W, y: scatter ? r() * H : -5, vx: (r() - 0.5) * 18, vy: 45 + r() * 55, r: 1 + r() * 2, len: 0, alpha: 0.4 + r() * 0.5 };
      }
      if (wx === "fog") {
        // Wide, tall wisps that drift slowly left-to-right
        return { x: scatter ? r() * W : W + 80, y: scatter ? r() * H * 0.85 : r() * H * 0.85, vx: -(4 + r() * 8), vy: (r() - 0.5) * 2, r: 55 + r() * 90, len: 0, alpha: 0.03 + r() * 0.055 };
      }
      if (wx === "storm") {
        // Heavy diagonal rain
        const spd = 480 + r() * 220;
        const ang = 0.32;
        const ln = 14 + r() * 18;
        return { x: scatter ? r() * W : r() * W - Math.sin(ang) * H, y: scatter ? r() * H : -ln, vx: Math.sin(ang) * spd, vy: Math.cos(ang) * spd, r: 0.6 + r() * 0.5, len: ln, alpha: 0.3 + r() * 0.45 };
      }
      if (wx === "wind") {
        const maxLife = 3000 + r() * 3000;
        return { x: r() * W, y: r() * H, vx: 0, vy: 0, r: 0.9 + r() * 1.3, len: 0, alpha: 0.38 + r() * 0.42, trail: [], life: scatter ? r() * maxLife : 0, maxLife };
      }
      const spd = 360 + r() * 180;
      const ln = 10 + r() * 14;
      return { x: scatter ? r() * W : r() * W - Math.sin(windAng) * H, y: scatter ? r() * H : -ln, vx: Math.sin(windAng) * spd, vy: Math.cos(windAng) * spd, r: 0.5 + r() * 0.4, len: ln, alpha: 0.25 + r() * 0.4 };
    }

    // ── Lightning bolt generator ──────────────────────────────────────────────
    function makeBolt(x: number, yTop: number, yBot: number, roughness: number, steps: number) {
      const pts: Array<{ x: number; y: number }> = [{ x, y: yTop }];
      let cx = x;
      for (let i = 1; i <= steps; i++) {
        cx += (Math.random() - 0.5) * roughness;
        pts.push({ x: cx, y: yTop + (yBot - yTop) * (i / steps) });
      }
      // 2-3 branches off a random mid-segment
      const branches: Array<Array<{ x: number; y: number }>> = [];
      const branchCount = 1 + Math.floor(Math.random() * 2);
      for (let b = 0; b < branchCount; b++) {
        const startIdx = 2 + Math.floor(Math.random() * (pts.length - 4));
        const origin = pts[startIdx];
        const bLen = (yBot - yTop) * (0.2 + Math.random() * 0.3);
        const bPts: Array<{ x: number; y: number }> = [{ x: origin.x, y: origin.y }];
        let bx = origin.x;
        const bSteps = 4 + Math.floor(Math.random() * 3);
        for (let i = 1; i <= bSteps; i++) {
          bx += (Math.random() - 0.5) * roughness * 0.7;
          bPts.push({ x: bx, y: origin.y + bLen * (i / bSteps) });
        }
        branches.push(bPts);
      }
      return { pts, branches };
    }

    // ── Frame loop ────────────────────────────────────────────────────────────
    function frame(ts: number) {
      animId = requestAnimationFrame(frame);
      if (!W || !H) {
        lastTs = ts;
        return;
      }

      const dt = Math.min(ts - lastTs, 50);
      lastTs = ts;
      tRef.current += dt;
      scrollRef.current += dt * 0.038; // ~45px/s base
      const scroll = scrollRef.current;
      const t = tRef.current;
      const { sc, mr, ap } = bRef.current!;

      // Window flicker (~30fps cadence)
      if (Math.floor(ts / 33) !== Math.floor((ts - dt) / 33)) {
        for (const group of [sc, mr, ap]) {
          for (const b of group) {
            for (const w of b.wins) {
              w.cd -= 33;
              if (w.cd <= 0) {
                w.lit = !w.lit;
                w.cd = 80 + Math.random() * 700;
              }
            }
          }
        }
      }

      // ── Time-of-day scene params ──────────────────────────────────────────
      // Start at real local time, fast-forward through 24h every 30 seconds
      const totalHours = startHrRef.current + (tRef.current / 30000) * 24;
      const hr = totalHours % 24;
      // ── Weather phase: 15 s on → 15 s off → repeat ───────────────────────
      const phaseDur = 15000;
      const phaseElapsed = tRef.current - wxPhaseStartRef.current;
      if (phaseElapsed >= phaseDur) {
        wxPhaseStartRef.current = tRef.current;
        if (wxPhaseRef.current === "on") {
          wxPhaseRef.current = "off";
        } else {
          wxPhaseRef.current = "on";
          const prev = weatherRef.current;
          const picks = (["none", "snow", "rain", "wind", "fog", "storm", "earthquake"] as WeatherType[]).filter(w => w !== prev);
          weatherRef.current = picks[Math.floor(Math.random() * picks.length)];
          wxPRef.current = [];
          eqStateRef.current = { eqTime: 0, shakeAmt: 0, collapses: [], debris: [], smoke: [], initialized: false };
        }
      }
      const isOff = wxPhaseRef.current === "off";
      // Ease-in over 3 s, ease-out over full 15 s off phase
      const fadeIn  = !isOff ? Math.min(1, Math.pow(phaseElapsed / 3000, 1.5)) : 1;
      const fadeOut = isOff ? Math.pow(Math.max(0, 1 - phaseElapsed / phaseDur), 1.5) : 1;
      const wxFade  = fadeIn * fadeOut;
      let k0 = SCENE_KFS[0],
        k1 = SCENE_KFS[1];
      for (let i = 0; i < SCENE_KFS.length - 1; i++) {
        if (hr >= SCENE_KFS[i].h && hr < SCENE_KFS[i + 1].h) {
          k0 = SCENE_KFS[i];
          k1 = SCENE_KFS[i + 1];
          break;
        }
      }
      const kt = (hr - k0.h) / (k1.h - k0.h);
      const skyTop = lerpC3(k0.sT, k1.sT, kt);
      const skyBot = lerpC3(k0.sB, k1.sB, kt);
      const starAlpha = lerp(k0.sa, k1.sa, kt);
      const litFrac = lerp(k0.lf, k1.lf, kt);
      const dayFrac = 1 - litFrac;
      const mtnFarC = rgbaC3(lerpC3(k0.mF, k1.mF, kt), 1);
      const mtnMidC = rgbaC3(lerpC3(k0.mM, k1.mM, kt), 1);
      const mtnNearC = rgbaC3(lerpC3(k0.mN, k1.mN, kt), 1);

      // Sun: rises east (left) ~6am, arcs overhead, sets west (right) ~8pm
      const sunOpacity = Math.max(
        0,
        Math.min(
          1,
          hr < 5
            ? 0
            : hr < 7
              ? (hr - 5) / 2
              : hr < 19
                ? 1
                : hr < 21
                  ? (21 - hr) / 2
                  : 0,
        ),
      );
      const dayProg = Math.max(0, Math.min(1, (hr - 6) / 14));
      const sunAngle = dayProg * Math.PI;
      const duskDawn = 1 - Math.sin(sunAngle); // 1 at horizon, 0 at zenith
      const sunX = W * (0.06 + 0.88 * dayProg);
      const sunY = H * (0.58 - 0.52 * Math.sin(sunAngle));
      const sunR = Math.min(W * 0.055, H * 0.11);
      const sunRGB: C3 = [
        255,
        lerp(140, 245, 1 - duskDawn),
        lerp(20, 190, 1 - duskDawn),
      ];

      // Moon: rises east ~8pm, arcs overnight, sets west ~6am
      const moonOpacity = Math.max(
        0,
        Math.min(
          1,
          hr < 4
            ? 1
            : hr < 6
              ? (6 - hr) / 2
              : hr < 20
                ? 0
                : hr < 22
                  ? (hr - 20) / 2
                  : 1,
        ),
      );
      const nightProg = Math.min(1, ((hr - 20 + 24) % 24) / 10);
      const moonAngle = nightProg * Math.PI;
      const mR = Math.min(W * 0.1, H * 0.22);
      const mx = W * (0.06 + 0.88 * nightProg);
      const my = H * (0.55 - 0.48 * Math.sin(moonAngle));

      // ── Global save — earthquake shake offset applied here ────────────��───────
      ctx!.save();
      if (weatherRef.current === "earthquake" && eqStateRef.current.shakeAmt > 0.5) {
        const s = eqStateRef.current.shakeAmt;
        ctx!.translate((Math.random() - 0.5) * s * 2, (Math.random() - 0.5) * s * 0.6);
      }

      // ── Sky ────────────────────────────────────────────────────────────────
      const sky = ctx!.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(
        0,
        `rgb(${skyTop[0] | 0},${skyTop[1] | 0},${skyTop[2] | 0})`,
      );
      sky.addColorStop(
        1.0,
        `rgb(${skyBot[0] | 0},${skyBot[1] | 0},${skyBot[2] | 0})`,
      );
      ctx!.fillStyle = sky;
      ctx!.fillRect(0, 0, W, H);

      // ── Sun ────────────────────────────────────────────────────────────────
      if (sunOpacity > 0.01) {
        const sg = ctx!.createRadialGradient(
          sunX,
          sunY,
          sunR * 0.5,
          sunX,
          sunY,
          sunR * 4,
        );
        sg.addColorStop(0, rgbaC3(sunRGB, 0.3 * sunOpacity));
        sg.addColorStop(1, rgbaC3(sunRGB, 0));
        ctx!.fillStyle = sg;
        ctx!.fillRect(sunX - sunR * 4, sunY - sunR * 4, sunR * 8, sunR * 8);
        const sb = ctx!.createRadialGradient(
          sunX - sunR * 0.2,
          sunY - sunR * 0.2,
          0,
          sunX,
          sunY,
          sunR,
        );
        sb.addColorStop(
          0,
          `rgba(255,255,${lerp(150, 255, 1 - duskDawn) | 0},${sunOpacity.toFixed(2)})`,
        );
        sb.addColorStop(1, rgbaC3(sunRGB, sunOpacity));
        ctx!.beginPath();
        ctx!.arc(sunX, sunY, sunR, 0, Math.PI * 2);
        ctx!.fillStyle = sb;
        ctx!.fill();
      }

      // ── Moon ───────────────────────────────────────────────────────────────
      if (moonOpacity > 0.01) {
        const glow = ctx!.createRadialGradient(
          mx,
          my,
          mR * 0.7,
          mx,
          my,
          mR * 3.2,
        );
        glow.addColorStop(
          0,
          `rgba(180,220,255,${(0.18 * moonOpacity).toFixed(2)})`,
        );
        glow.addColorStop(
          0.4,
          `rgba(100,160,240,${(0.07 * moonOpacity).toFixed(2)})`,
        );
        glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx!.fillStyle = glow;
        ctx!.fillRect(mx - mR * 3.2, my - mR * 3.2, mR * 6.4, mR * 6.4);
        const mb = ctx!.createRadialGradient(
          mx - mR * 0.18,
          my - mR * 0.18,
          0,
          mx,
          my,
          mR,
        );
        mb.addColorStop(0, `rgba(240,248,255,${moonOpacity.toFixed(2)})`);
        mb.addColorStop(0.35, `rgba(208,232,248,${moonOpacity.toFixed(2)})`);
        mb.addColorStop(0.72, `rgba(144,184,216,${moonOpacity.toFixed(2)})`);
        mb.addColorStop(1, `rgba(48,96,160,${moonOpacity.toFixed(2)})`);
        ctx!.beginPath();
        ctx!.arc(mx, my, mR, 0, Math.PI * 2);
        ctx!.fillStyle = mb;
        ctx!.fill();
      }

      // ── Stars (fade with daylight) ─────────────────────────────────────────
      if (starAlpha > 0.01) {
        const starScroll = (scroll * 0.12) % TILE;
        for (const s of STARS) {
          const sx = (((s.lx - starScroll + TILE * 10) % TILE) / TILE) * W;
          const sy = s.yFrac * H;
          const tw = 0.35 + 0.65 * Math.sin(t * 0.001 * s.ts + s.phase);
          ctx!.beginPath();
          ctx!.arc(sx, sy, s.r, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(200,220,255,${(tw * 0.75 * starAlpha).toFixed(2)})`;
          ctx!.fill();
        }
      }

      // ── Mountain layers (back → front) ────────────────────────────────────
      const s1 = (scroll * 0.06) % TILE;
      drawMountainLayer(MTNS_FAR, s1, mtnFarC, "rgba(100,150,200,0.08)");

      const s2 = (scroll * 0.13) % TILE;
      drawMountainLayer(MTNS_MID, s2, mtnMidC, "rgba(80,120,180,0.08)");

      const s3 = (scroll * 0.22) % TILE;
      drawMountainLayer(MTNS_NEAR, s3, mtnNearC, "rgba(50,90,150,0.07)");


      // ── Buildings (lights dim during the day) ─────────────────────────────
      const nightFill: C3 = [lerp(42, 3, litFrac), lerp(46, 8, litFrac), lerp(53, 16, litFrac)];
      const dayWinAlpha = dayFrac * 0.28;
      const dayWinCol =
        dayWinAlpha > 0.01
          ? `rgba(160,205,235,${dayWinAlpha.toFixed(2)})`
          : undefined;
      // During earthquake, the earthquake block owns drawing collapsed buildings to avoid double-draw.
      // Only skip buildings that the earthquake block will actually draw (fallY still on-screen).
      // Once a building has fallen off-screen, let drawBuildings show it normally again.
      const eqActive = weatherRef.current === "earthquake" && (wxPhaseRef.current === "on" || wxFade > 0.005) && eqStateRef.current.initialized;
      const eqVisible = (c: EqCollapse, buildings: Building[]) => {
        const b = buildings[c.idx];
        return b && c.fallY <= H + b.h + 100;
      };
      // Compute clearFade here so drawBuildings can use replenish alpha
      const EQ_CLEAR_START = 10000, EQ_CLEAR_END = 15000;
      const eqClearFade = !eqActive ? 1 : eqStateRef.current.eqTime < EQ_CLEAR_START ? 1
        : Math.max(0, 1 - (eqStateRef.current.eqTime - EQ_CLEAR_START) / (EQ_CLEAR_END - EQ_CLEAR_START));
      const replenishAlpha = 1 - eqClearFade;
      const mkAlphaMap = (layer: "sc" | "mr" | "ap", buildings: Building[]) => {
        if (!eqActive) return undefined;
        const m = new Map<number, number>();
        for (const c of eqStateRef.current.collapses) {
          if (c.layer !== layer || !eqVisible(c, buildings)) continue;
          if (eqStateRef.current.eqTime < c.startDelay) continue; // not yet started → drawn normally
          let alpha: number;
          if (replenishAlpha > 0.005) {
            // clear phase: fade functional building back in
            alpha = replenishAlpha;
          } else {
            // active phase: fade functional building out as broken building tilts in
            const tiltFrac = Math.abs(c.targetTilt) > 0
              ? Math.min(1, Math.abs(c.tilt) / Math.abs(c.targetTilt))
              : 1;
            alpha = 1 - tiltFrac;
          }
          m.set(c.idx, alpha < 0.005 ? 0 : alpha);
        }
        return m.size > 0 ? m : undefined;
      };
      const scAlpha = mkAlphaMap("sc", sc);
      const mrAlpha = mkAlphaMap("mr", mr);
      const apAlpha = mkAlphaMap("ap", ap);
      const scScroll = (scroll * 0.5) % TILE;
      drawBuildings(
        sc,
        scScroll,
        nightFill,
        `rgba(255,155,50,${(litFrac * 0.72).toFixed(2)})`,
        dayWinCol,
        dayFrac,
        scAlpha,
      );
      const mrScroll = (scroll * 0.72) % TILE;
      drawBuildings(
        mr,
        mrScroll,
        nightFill,
        `rgba(255,140,42,${(litFrac * 0.58).toFixed(2)})`,
        dayWinCol,
        dayFrac,
        mrAlpha,
      );
      const apScroll = (scroll * 1.0) % TILE;
      drawBuildings(
        ap,
        apScroll,
        nightFill,
        `rgba(255,125,38,${(litFrac * 0.5).toFixed(2)})`,
        dayWinCol,
        dayFrac,
        apAlpha,
      );

      // ── Inclement weather ─────────────────────────────────────────────────────
      const wx = weatherRef.current!;
      if (wx !== "none" && (wxPhaseRef.current === "on" || wxFade > 0.005)) {
        const windAng = wx === "snow" ? 0.06 : 0.22;
        const count = wx === "snow" ? 130 : wx === "rain" ? 230 : wx === "fog" ? 18 : wx === "storm" ? 320 : 60;
        const ps = wxPRef.current;
        // Spawn up to 25 new particles per frame to avoid a single-frame spike
        if (!isOff) {
          const spawnCap = 25;
          let spawned = 0;
          while (ps.length < count && spawned < spawnCap) {
            ps.push(spawnWx(wx, windAng, ps.length === 0));
            spawned++;
          }
        }

        // Overcast veil — fades with wxFade
        const oa = (wx === "snow" ? 0.15 : wx === "rain" ? 0.25 : wx === "fog" ? 0.08 : wx === "storm" ? 0.42 : 0.28) * wxFade;
        ctx!.fillStyle = `rgba(140,155,170,${oa.toFixed(3)})`;
        ctx!.fillRect(0, 0, W, H);

        ctx!.save();
        if (wx === "wind") {
          // ── Van Gogh swirl trails ──────────────────────────────────────────
          const TRAIL = 42;
          const SPEED = 105 * wxFade; // slow to a stop during OFF
          for (let i = 0; i < ps.length; i++) {
            const p = ps[i];
            p.life = (p.life ?? 0) + dt;
            // During OFF, don't respawn expired particles
            if (p.life > (p.maxLife ?? 6000)) {
              if (isOff) { ps.splice(i--, 1); continue; }
              ps[i] = spawnWx(wx, windAng, false);
              continue;
            }
            const ang = windFlowAngle(p.x, p.y, t);
            p.vx = Math.cos(ang) * SPEED;
            p.vy = Math.sin(ang) * SPEED;
            p.x += p.vx * dt * 0.001;
            p.y += p.vy * dt * 0.001;
            let wrapped = false;
            if (p.x < -60) { p.x = W + 60; wrapped = true; }
            else if (p.x > W + 60) { p.x = -60; wrapped = true; }
            if (p.y < -60) { p.y = H + 60; wrapped = true; }
            else if (p.y > H + 60) { p.y = -60; wrapped = true; }
            const trail = p.trail!;
            if (wrapped) trail.length = 0;
            trail.push({ x: p.x, y: p.y });
            if (trail.length > TRAIL) trail.shift();
            if (trail.length < 2) continue;
            const lifeFade = Math.min(1, p.life / 600) * Math.min(1, ((p.maxLife ?? 6000) - p.life) / 600) * wxFade;
            const t1 = Math.floor(trail.length * 0.35);
            const t2 = Math.floor(trail.length * 0.68);
            const tiers = [
              { from: 0,  to: t1,           a: p.alpha * lifeFade * 0.18 },
              { from: t1, to: t2,           a: p.alpha * lifeFade * 0.50 },
              { from: t2, to: trail.length, a: p.alpha * lifeFade },
            ];
            for (const { from, to, a } of tiers) {
              if (to - from < 1) continue;
              ctx!.beginPath();
              ctx!.moveTo(trail[from].x, trail[from].y);
              for (let j = from + 1; j < to; j++) ctx!.lineTo(trail[j].x, trail[j].y);
              ctx!.strokeStyle = `rgba(195,218,255,${a.toFixed(3)})`;
              ctx!.lineWidth = p.r;
              ctx!.lineJoin = "round";
              ctx!.lineCap = "round";
              ctx!.stroke();
            }
          }
        } else if (wx === "fog") {
          // ── Fog wisps ─────────────────────────────────────────────────────
          for (let i = 0; i < ps.length; i++) {
            const p = ps[i];
            p.x += p.vx * wxFade * dt * 0.001;
            p.y += p.vy * wxFade * dt * 0.001 + Math.sin(t * 0.00045 + p.alpha * 20) * 0.15;
            if (p.x < -p.r * 2) {
              if (isOff) { ps.splice(i--, 1); continue; }
              ps[i] = spawnWx(wx, windAng, false);
              continue;
            }
            const a = (p.alpha * wxFade).toFixed(4);
            const g = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
            g.addColorStop(0, `rgba(200,215,225,${a})`);
            g.addColorStop(1, `rgba(200,215,225,0)`);
            ctx!.beginPath();
            ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx!.fillStyle = g;
            ctx!.fill();
          }
        } else if (wx === "storm") {
          // ── Storm: heavy rain + lightning ─────────────────────────────────
          const lt = lightningRef.current;

          // Advance bolt ages, cull expired
          for (let i = lt.bolts.length - 1; i >= 0; i--) {
            lt.bolts[i].age += dt;
            if (lt.bolts[i].age > lt.bolts[i].maxAge) lt.bolts.splice(i, 1);
          }

          // Decay flash
          lt.flash = Math.max(0, lt.flash - dt * 0.008);

          // Trigger new strike during ON phase
          if (!isOff && t > lt.nextStrike) {
            const bx = W * (0.1 + Math.random() * 0.8);
            const { pts, branches } = makeBolt(bx, 0, H * (0.55 + Math.random() * 0.35), 28, 10);
            lt.bolts.push({ pts, branches, age: 0, maxAge: 180 + Math.random() * 120 });
            lt.flash = 0.18 + Math.random() * 0.18;
            lt.nextStrike = t + 2500 + Math.random() * 5000;
          }

          // Flash overlay
          if (lt.flash > 0.005) {
            ctx!.fillStyle = `rgba(200,220,255,${(lt.flash * wxFade).toFixed(3)})`;
            ctx!.fillRect(0, 0, W, H);
          }

          // Draw rain
          const stormAng = 0.32;
          for (let i = 0; i < ps.length; i++) {
            const p = ps[i];
            p.x += p.vx * wxFade * dt * 0.001;
            p.y += p.vy * wxFade * dt * 0.001;
            if (p.y > H + 30 || p.x > W + 200) {
              if (isOff) { ps.splice(i--, 1); continue; }
              ps[i] = spawnWx(wx, stormAng, false);
              continue;
            }
            ctx!.beginPath();
            ctx!.moveTo(p.x, p.y);
            ctx!.lineTo(p.x - Math.sin(stormAng) * p.len, p.y - Math.cos(stormAng) * p.len);
            ctx!.strokeStyle = `rgba(180,210,240,${(p.alpha * wxFade).toFixed(3)})`;
            ctx!.lineWidth = p.r;
            ctx!.stroke();
          }

          // Draw bolts
          function drawPolyline(pts: Array<{ x: number; y: number }>, alpha: number, width: number) {
            if (pts.length < 2) return;
            ctx!.beginPath();
            ctx!.moveTo(pts[0].x, pts[0].y);
            for (let j = 1; j < pts.length; j++) ctx!.lineTo(pts[j].x, pts[j].y);
            ctx!.strokeStyle = `rgba(220,235,255,${alpha.toFixed(3)})`;
            ctx!.lineWidth = width;
            ctx!.lineJoin = "round";
            ctx!.stroke();
          }

          for (const bolt of lt.bolts) {
            const lifeFrac = 1 - bolt.age / bolt.maxAge;
            const ba = lifeFrac * lifeFrac * wxFade;
            // Outer glow
            drawPolyline(bolt.pts, ba * 0.25, 6);
            // Core
            drawPolyline(bolt.pts, ba * 0.9, 1.5);
            for (const br of bolt.branches) {
              drawPolyline(br, ba * 0.55, 1);
            }
          }

        } else if (wx === "earthquake") {
          // ── Earthquake: shake + building collapse + debris ─────────────────
          const eqs = eqStateRef.current;

          // ── Init: select most buildings across all layers ─────────────────
          if (!eqs.initialized) {
            eqs.initialized = true;
            const rng = mkRng(42);
            const addLayer = (layer: "sc" | "mr" | "ap", buildings: Building[], collapseRate: number, leanRate: number) => {
              buildings.forEach((_, idx) => {
                const r = rng();
                const dir = rng() > 0.5 ? 1 : -1;
                if (r < collapseRate) {
                  eqs.collapses.push({ layer, idx, tilt: 0, targetTilt: dir * (Math.PI * 0.38 + rng() * 0.3), fallY: 0, type: "collapse", startDelay: rng() * 3000 });
                } else if (r < collapseRate + leanRate) {
                  eqs.collapses.push({ layer, idx, tilt: 0, targetTilt: dir * (0.06 + rng() * 0.14), fallY: 0, type: "lean", startDelay: rng() * 3000 });
                }
              });
            };
            addLayer("sc", sc, 0.45, 0.35);
            addLayer("mr", mr, 0.40, 0.40);
            addLayer("ap", ap, 0.35, 0.45);
          }

          // ── Shake: 0–5 s ramp up, 5–10 s ramp down, 10–15 s quiet exit ──
          eqs.eqTime += dt;
          const EQ_PEAK = 5000, EQ_SHAKE_END = 10000, EQ_MAX = 14;
          const exitPhase = eqs.eqTime >= EQ_SHAKE_END;
          if (eqs.eqTime < EQ_PEAK) {
            eqs.shakeAmt = EQ_MAX * Math.sqrt(eqs.eqTime / EQ_PEAK);
          } else if (eqs.eqTime < EQ_SHAKE_END) {
            eqs.shakeAmt = EQ_MAX * Math.pow(1 - (eqs.eqTime - EQ_PEAK) / (EQ_SHAKE_END - EQ_PEAK), 2);
          } else {
            eqs.shakeAmt = 0;
          }

          // ── Dust veil ─────────────────────────────────────────────────────
          // Fade out over last 5 s of the 15 s on-phase (10 000 → 15 000 ms)
          const clearFade = eqClearFade;
          ctx!.fillStyle = `rgba(160,130,85,${(0.22 * wxFade * clearFade).toFixed(3)})`;
          ctx!.fillRect(-20, -20, W + 40, H + 40);

          // ── Collapse / lean each selected building ─────────────────────────
          for (const col of eqs.collapses) {
            if (eqs.eqTime < col.startDelay) continue;
            const buildings = col.layer === "sc" ? sc : col.layer === "mr" ? mr : ap;
            const sf = col.layer === "sc" ? 0.5 : col.layer === "mr" ? 0.72 : 1.0;
            const b = buildings[col.idx];
            const scrollX = (scroll * sf) % TILE;

            // shake intensity drives tilt speed and debris chaos (peaks at 5 s)
            const physScale = isOff ? 1 : wxFade;
            const shakeIntensity = eqs.shakeAmt / EQ_MAX; // 0–1
            const tiltDir = col.targetTilt > 0 ? 1 : -1;
            if (exitPhase) {
              col.tilt = col.targetTilt; // snap so all buildings are fully tilted for clear
            } else if (Math.abs(col.tilt) < Math.abs(col.targetTilt) - 0.001) {
              // linear rate directly proportional to shake intensity so tilt is visible by 3-5s
              const rate = 0.06 + shakeIntensity * 0.24; // 0.06–0.30 rad/s
              col.tilt += tiltDir * rate * dt * 0.001 * physScale;
              if (Math.abs(col.tilt) > Math.abs(col.targetTilt)) col.tilt = col.targetTilt;
            }
            if (exitPhase) {
              // hold position during clear phase — fade out via clearFade instead
            } else if (col.type === "collapse") {
              col.fallY += Math.abs(col.tilt) * 180 * dt * 0.001 * physScale;
            }

            // skip drawing once fully off-screen below
            if (col.fallY > H + b.h + 100) continue;

            for (let copy = 0; copy < 2; copy++) {
              const sx = b.x - scrollX + copy * TILE;
              if (sx + b.w < -300 || sx > W + 300) continue;
              const top = H - b.h - col.fallY;
              const pivotX = col.tilt > 0 ? sx + b.w : sx;

              // Debris: starts at 3 s, intensity and velocity scale with shake
              const activePhase = eqs.eqTime >= 3000 && !exitPhase && !isOff;
              if (activePhase && col.type === "collapse" && Math.abs(col.tilt) > 0.05 && col.fallY < b.h * 2) {
                const spawnChance = 0.04 + shakeIntensity * 0.32;
                if (Math.random() < spawnChance) {
                  const speed = 80 + shakeIntensity * 240;
                  for (let n = 0; n < Math.ceil(1 + shakeIntensity * 2); n++) {
                    eqs.debris.push({
                      x: sx + Math.random() * b.w, y: top + Math.random() * b.h * 0.5,
                      vx: (Math.random() - 0.5) * speed * 2, vy: -(Math.random() * speed + 40),
                      w: 2 + Math.random() * 9, h: 2 + Math.random() * 7,
                      rot: Math.random() * Math.PI * 2, rotV: (Math.random() - 0.5) * 10,
                      alpha: 0.65 + Math.random() * 0.35, life: 1800 + Math.random() * 1200,
                    });
                  }
                }
              }

              // Smoke: also gated to active phase, rate scales with intensity
              if (activePhase && Math.abs(col.tilt) > 0.08 && Math.random() < 0.03 + shakeIntensity * 0.07) {
                eqs.smoke.push({
                  x: sx + b.w * (0.15 + Math.random() * 0.7),
                  y: top + b.h * (0.05 + Math.random() * 0.35),
                  vx: (Math.random() - 0.5) * 14,
                  vy: -(10 + Math.random() * 22),
                  r: 5 + Math.random() * 10,
                  alpha: 0.09 + Math.random() * 0.11,
                  life: 3500 + Math.random() * 3000,
                  maxLife: 3500 + Math.random() * 3000,
                });
              }

              // Draw tilted building: fades in with tilt, fades out during clear phase
              const tiltFrac = Math.abs(col.targetTilt) > 0
                ? Math.min(1, Math.abs(col.tilt) / Math.abs(col.targetTilt))
                : 1;
              ctx!.save();
              ctx!.globalAlpha = wxFade * clearFade * tiltFrac;
              ctx!.translate(pivotX, H);
              ctx!.rotate(col.tilt);
              ctx!.translate(-pivotX, -H);

              const bc = lerpC3([72, 55, 43] as C3, b.dayFill, dayFrac * 0.2);
              ctx!.fillStyle = `rgb(${bc[0] | 0},${bc[1] | 0},${bc[2] | 0})`;
              ctx!.fillRect(sx, top, b.w, b.h);
              ctx!.strokeStyle = "rgba(40,28,18,0.85)";
              ctx!.lineWidth = 0.75;
              ctx!.strokeRect(sx + 0.375, top + 0.375, b.w - 0.75, b.h - 0.75);

              // Crack lines
              const crk = mkRng((b.x * 41) | 0);
              ctx!.strokeStyle = "rgba(22,12,6,0.6)";
              ctx!.lineWidth = 1;
              for (let c = 0; c < 4; c++) {
                const ckx = sx + 4 + crk() * (b.w - 8);
                const cky = top + 4 + crk() * (b.h - 8);
                ctx!.beginPath();
                ctx!.moveTo(ckx, cky);
                ctx!.lineTo(ckx + (crk() - 0.5) * 18, cky + crk() * 28);
                ctx!.stroke();
              }

              // Broken windows — dark with occasional fire glow
              const csp2 = (b.w - 6) / b.cols;
              const rsp2 = (b.h - 8) / b.rows;
              for (let row = 0; row < b.rows; row++) {
                for (let col2 = 0; col2 < b.cols; col2++) {
                  const wx2 = sx + 3 + col2 * csp2;
                  const wy2 = top + 5 + row * rsp2;
                  const isFire = mkRng((b.x * 13 + row * 7 + col2 * 3) | 0)() > 0.93;
                  ctx!.fillStyle = isFire
                    ? "rgba(255,110,10,0.7)"
                    : "rgba(12,8,5,0.88)";
                  ctx!.fillRect(wx2, wy2, 4, 5);
                }
              }

              ctx!.restore();

              // Rising dust cloud at pivot base
              const dustAmt = Math.min(1, Math.abs(col.tilt) / 0.3) * wxFade * clearFade;
              if (dustAmt > 0.01) {
                const dustRad = b.w * (1.5 + Math.abs(col.tilt) * 2.5);
                const dg = ctx!.createRadialGradient(pivotX, H, 0, pivotX, H, dustRad);
                dg.addColorStop(0, `rgba(175,145,100,${(0.5 * dustAmt).toFixed(3)})`);
                dg.addColorStop(0.45, `rgba(175,145,100,${(0.18 * dustAmt).toFixed(3)})`);
                dg.addColorStop(1, "rgba(175,145,100,0)");
                ctx!.fillStyle = dg;
                ctx!.fillRect(pivotX - dustRad, H - dustRad, dustRad * 2, dustRad);
              }
            }
          }

          // ── Smoke — rises off the top during off phase ────────────────────
          for (let i = eqs.smoke.length - 1; i >= 0; i--) {
            const s = eqs.smoke[i];
            s.x += s.vx * dt * 0.001;
            s.y += s.vy * dt * 0.001;
            s.vx += (Math.random() - 0.5) * 3 * dt * 0.001;
            s.vy *= 1 - 0.002 * dt;
            if (!isOff && !exitPhase) s.life -= dt;
            const sr = Math.max(0, s.r * (1 + (1 - s.life / s.maxLife) * 5));
            // Exit when off-screen top; during on phase also expire by life
            if (s.y + sr < -20 || s.life <= 0) { eqs.smoke.splice(i, 1); continue; }
            const sa = (s.alpha * Math.min(1, s.life / 600) * clearFade).toFixed(3);
            const grey = (55 + (1 - s.life / s.maxLife) * 75) | 0;
            const sg = ctx!.createRadialGradient(s.x, s.y, 0, s.x, s.y, sr);
            sg.addColorStop(0, `rgba(${grey},${grey},${grey},${sa})`);
            sg.addColorStop(1, `rgba(${grey},${grey},${grey},0)`);
            ctx!.beginPath();
            ctx!.arc(s.x, s.y, sr, 0, Math.PI * 2);
            ctx!.fillStyle = sg;
            ctx!.fill();
          }

          // ── Debris — flies off-screen during off phase ────────────────────
          for (let i = eqs.debris.length - 1; i >= 0; i--) {
            const d = eqs.debris[i];
            d.x += d.vx * dt * 0.001;
            d.y += d.vy * dt * 0.001;
            d.vy += 520 * dt * 0.001;
            d.rot += d.rotV * dt * 0.001;
            if (!isOff) d.life -= dt;
            // Expire by life; always remove when off-screen
            if (d.y > H + 60 || d.x < -100 || d.x > W + 100 || d.life <= 0) {
              eqs.debris.splice(i, 1); continue;
            }
            const a = (Math.min(1, d.life / 400) * d.alpha * clearFade).toFixed(3);
            ctx!.save();
            ctx!.translate(d.x, d.y);
            ctx!.rotate(d.rot);
            ctx!.fillStyle = `rgba(130,108,82,${a})`;
            ctx!.fillRect(-d.w / 2, -d.h / 2, d.w, d.h);
            ctx!.restore();
          }

        } else {
          // ── Snow / Rain ────────────────────────────────────────────────────
          for (let i = 0; i < ps.length; i++) {
            const p = ps[i];
            // Scale velocity down during OFF so particles visibly slow
            p.x += p.vx * wxFade * dt * 0.001;
            p.y += p.vy * wxFade * dt * 0.001;
            if (wx === "snow") p.x += Math.sin(t * 0.0007 + p.alpha * 12) * 0.4 * wxFade;
            if (p.y > H + 30 || p.x > W + 150 || p.x < -150) {
              if (isOff) { ps.splice(i--, 1); continue; }
              ps[i] = spawnWx(wx, windAng, false);
              continue;
            }
            const a = (p.alpha * wxFade).toFixed(3);
            if (wx === "snow") {
              ctx!.beginPath();
              ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
              ctx!.fillStyle = `rgba(215,230,255,${a})`;
              ctx!.fill();
            } else {
              ctx!.beginPath();
              ctx!.moveTo(p.x, p.y);
              ctx!.lineTo(p.x - Math.sin(windAng) * p.len, p.y - Math.cos(windAng) * p.len);
              ctx!.strokeStyle = `rgba(175,205,235,${a})`;
              ctx!.lineWidth = p.r;
              ctx!.stroke();
            }
          }
        }
        ctx!.restore();
      }

      ctx!.restore(); // end global frame save (earthquake shake)
    }

    animId = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className="md:col-span-2 border border-outline overflow-hidden relative min-h-[250px]"
    >
      {/* Canvas fills the card as background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ display: "block" }}
        aria-hidden="true"
      />

      {/* Content overlay */}
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 p-8 py-12 h-full">
        <div className="absolute top-4 left-4">
          <span className="bg-blue-300/90 text-on-primary px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-widest">
            LOCATION: DENVER_CO
          </span>
        </div>
      </div>
    </div>
  );
}
