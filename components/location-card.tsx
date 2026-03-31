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

// ── Fractal ridge via midpoint displacement (periodic, seamless) ─────────────
// roughness: decay per octave — 0.50=smooth hills, 0.70=jagged peaks
// nPts: number of control points — smaller = fewer, broader, more distinct peaks
function makeJaggedRidgeFn(
  seed: number,
  minFrac: number,
  maxFrac: number,
  roughness = 0.62,
  nPts = 512,
  initialDisp = 0.88,
) {
  const rng = mkRng(seed);
  const N = nPts; // must be power-of-2
  const pts = new Float32Array(N + 1);
  const range = maxFrac - minFrac;

  // Both endpoints equal → seamless tile
  const startY = minFrac + rng() * range;
  pts[0] = startY;
  pts[N] = startY;

  let step = N;
  let disp = range * initialDisp;
  while (step > 1) {
    const half = step >> 1;
    for (let i = 0; i < N; i += step) {
      const mid = (pts[i] + pts[i + step]) * 0.5;
      pts[i + half] = mid + (rng() - 0.5) * disp;
    }
    step = half;
    disp *= roughness;
  }

  for (let i = 0; i <= N; i++)
    pts[i] = Math.max(minFrac, Math.min(maxFrac, pts[i]));

  return (lx: number) => {
    const t = ((((lx / TILE) % 1) + 1) % 1) * N;
    const i = Math.floor(t);
    const f = t - i;
    return pts[i] * (1 - f) + pts[(i + 1) % N] * f;
  };
}

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
    arr.push({
      x,
      w,
      h,
      cols,
      rows,
      wins,
      antennaH: rng() > 0.55 ? 8 + rng() * 22 : 0,
      outline,
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
// Continuous rolling foothills (fractal ridge is fine for rounded hills)
const RIDGE_HILLS = makeJaggedRidgeFn(44, 0.5, 0.68, 0.66, 128, 0.75);
const STARS = makeStars(70);

// Building factories (called per mount so window state is per-instance)
const mkSkysc = () => makeBuildings(33, 11, 28, 68, 120, 0, 5);
const mkMidR = () => makeBuildings(44, 14, 35, 38, 70, 1, 6);
const mkApts = () => makeBuildings(55, 42, 85, 20, 40, 2, 12);

// ── Component ─────────────────────────────────────────────────────────────────
export function LocationCard() {
  const [elevation, setElevation] = useState(0);
  const [showConditions, setShowConditions] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollRef = useRef(0);
  const tRef = useRef(0);

  // Mutable per-mount building state (window flicker)
  const bRef = useRef<{
    sc: Building[];
    mr: Building[];
    ap: Building[];
  } | null>(null);
  if (!bRef.current)
    bRef.current = { sc: mkSkysc(), mr: mkMidR(), ap: mkApts() };

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
    function drawRidge(
      fn: (x: number) => number,
      scrollX: number,
      color: string,
    ) {
      ctx!.beginPath();
      ctx!.moveTo(0, H);
      for (let sx = 0; sx <= W; sx += 2) {
        const lx = (((sx + scrollX) % TILE) + TILE) % TILE;
        ctx!.lineTo(sx, fn(lx) * H);
      }
      ctx!.lineTo(W, H);
      ctx!.closePath();
      ctx!.fillStyle = color;
      ctx!.fill();
    }

    function drawRidgeLine(
      fn: (x: number) => number,
      scrollX: number,
      color: string,
      lineWidth = 0.75,
    ) {
      ctx!.beginPath();
      for (let sx = 0; sx <= W; sx += 2) {
        const lx = (((sx + scrollX) % TILE) + TILE) % TILE;
        sx === 0 ? ctx!.moveTo(sx, fn(lx) * H) : ctx!.lineTo(sx, fn(lx) * H);
      }
      ctx!.strokeStyle = color;
      ctx!.lineWidth = lineWidth;
      ctx!.stroke();
    }

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
      fill: string,
      winCol: string,
    ) {
      for (const b of buildings) {
        for (let copy = 0; copy < 2; copy++) {
          const sx = b.x - scrollX + copy * TILE;
          if (sx + b.w < 0 || sx > W) continue;
          const top = H - b.h;
          // Body
          ctx!.fillStyle = fill;
          ctx!.fillRect(sx, top, b.w, b.h);
          // Outline
          ctx!.strokeStyle = b.outline;
          ctx!.lineWidth = 0.75;
          ctx!.strokeRect(sx + 0.375, top + 0.375, b.w - 0.75, b.h - 0.75);
          // Antenna
          if (b.antennaH > 0) {
            ctx!.fillStyle = fill;
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
          ctx!.fillStyle = winCol;
          for (let r = 0; r < b.rows; r++) {
            for (let c = 0; c < b.cols; c++) {
              if (!b.wins[r * b.cols + c].lit) continue;
              ctx!.fillRect(sx + 3 + c * csp, top + 5 + r * rsp, 4, 5);
            }
          }
        }
      }
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
      const hr = new Date().getHours() + new Date().getMinutes() / 60;
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
      const mtnFarC = rgbaC3(
        lerpC3(k0.mF, k1.mF, kt),
        lerp(k0.mFa, k1.mFa, kt),
      );
      const mtnMidC = rgbaC3(
        lerpC3(k0.mM, k1.mM, kt),
        lerp(k0.mMa, k1.mMa, kt),
      );
      const mtnNearC = rgbaC3(
        lerpC3(k0.mN, k1.mN, kt),
        lerp(k0.mNa, k1.mNa, kt),
      );

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

      const s4 = (scroll * 0.35) % TILE;
      const hillsC = rgbaC3(
        lerpC3(k0.mN, k1.mN, kt),
        Math.min(1, lerp(k0.mNa, k1.mNa, kt) + 0.06),
      );
      drawRidge(RIDGE_HILLS, s4, hillsC);
      drawRidgeLine(RIDGE_HILLS, s4, "rgba(30,70,140,0.15)");

      // ── Buildings (lights dim during the day) ─────────────────────────────
      const bldFill = `rgb(${lerp(42, 3, litFrac) | 0},${lerp(46, 8, litFrac) | 0},${lerp(53, 16, litFrac) | 0})`;
      const scScroll = (scroll * 0.5) % TILE;
      drawBuildings(
        sc,
        scScroll,
        bldFill,
        `rgba(255,155,50,${(litFrac * 0.72).toFixed(2)})`,
      );
      const mrScroll = (scroll * 0.72) % TILE;
      drawBuildings(
        mr,
        mrScroll,
        bldFill,
        `rgba(255,140,42,${(litFrac * 0.58).toFixed(2)})`,
      );
      const apScroll = (scroll * 1.0) % TILE;
      drawBuildings(
        ap,
        apScroll,
        bldFill,
        `rgba(255,125,38,${(litFrac * 0.5).toFixed(2)})`,
      );

      // ── Ground haze ────────────────────────────────────────────────────────
      const hazeC = lerpC3(k0.sB, k1.sB, kt);
      const haze = ctx!.createLinearGradient(0, H * 0.8, 0, H);
      haze.addColorStop(0, "rgba(0,0,0,0)");
      haze.addColorStop(0.5, rgbaC3(hazeC, 0.55));
      haze.addColorStop(1, rgbaC3(hazeC, 0.92));
      ctx!.fillStyle = haze;
      ctx!.fillRect(0, H * 0.8, W, H * 0.2);
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
