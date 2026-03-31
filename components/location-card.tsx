"use client";

import { useEffect, useRef, useState } from "react";
import { Icon_Location } from "./icons";

// ── Constants ─────────────────────────────────────────────────────────────────
const TILE = 1200; // logical px width of one seamless loop tile

// ── Seeded PRNG ───────────────────────────────────────────────────────────────
function mkRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return (s >>> 0) / 0x100000000;
  };
}

// ── Periodic ridge function (Fourier harmonics → zero seam) ──────────────────
function makeRidgeFn(seed: number, minFrac: number, maxFrac: number) {
  const rng = mkRng(seed);
  const mid = (minFrac + maxFrac) / 2;
  const amp = (maxFrac - minFrac) / 2;
  const hs = Array.from({ length: 6 }, (_, k) => ({
    a: (rng() * 2 - 1) * amp / (k * 0.7 + 1),
    phase: rng() * Math.PI * 2,
    freq: k + 1,
  }));
  return (lx: number) => {
    let y = mid;
    for (const h of hs) y += h.a * Math.sin(h.freq * 2 * Math.PI * (lx / TILE) + h.phase);
    return Math.max(minFrac, Math.min(maxFrac, y));
  };
}

// ── Building types ────────────────────────────────────────────────────────────
interface WinState { lit: boolean; cd: number; }
interface Building { x: number; w: number; h: number; cols: number; rows: number; wins: WinState[]; antennaH: number; }

function makeBuildings(
  seed: number,
  minW: number, maxW: number,
  minH: number, maxH: number,
  minGap: number, maxGap: number,
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
    arr.push({ x, w, h, cols, rows, wins, antennaH: rng() > 0.55 ? 8 + rng() * 22 : 0 });
    x += w + minGap + rng() * (maxGap - minGap);
  }
  return arr;
}

// ── Star type ─────────────────────────────────────────────────────────────────
interface Star { lx: number; yFrac: number; r: number; phase: number; ts: number; }
function makeStars(n: number): Star[] {
  const rng = mkRng(999);
  return Array.from({ length: n }, () => ({
    lx: rng() * TILE,
    yFrac: rng() * 0.50,
    r: 0.4 + rng() * 1.2,
    phase: rng() * Math.PI * 2,
    ts: 0.4 + rng() * 1.7,
  }));
}

// ── Pre-generate static scene data (module-level) ─────────────────────────────
const FAR_RIDGE  = makeRidgeFn(11, 0.14, 0.46);
const MID_RIDGE  = makeRidgeFn(22, 0.28, 0.58);
const STARS      = makeStars(70);

// Building factories (called per mount so window state is per-instance)
const mkSkysc = () => makeBuildings(33, 14, 36,  90, 160, 0,  5);
const mkMidR  = () => makeBuildings(44, 18, 45,  50,  90, 1,  6);
const mkApts  = () => makeBuildings(55, 55, 110, 28,  52, 2, 12);

// ── Component ─────────────────────────────────────────────────────────────────
export function LocationCard() {
  const [elevation, setElevation]       = useState(0);
  const [showConditions, setShowConditions] = useState(false);
  const cardRef   = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollRef = useRef(0);
  const tRef      = useRef(0);

  // Mutable per-mount building state (window flicker)
  const bRef = useRef<{ sc: Building[]; mr: Building[]; ap: Building[] } | null>(null);
  if (!bRef.current) bRef.current = { sc: mkSkysc(), mr: mkMidR(), ap: mkApts() };

  // ── Elevation count-up on scroll into view ────────────────────────────────
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      const target = 5280, duration = 2200, t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - t0) / duration, 1);
        setElevation(Math.round((1 - Math.pow(2, -10 * p)) * target));
        if (p < 1) requestAnimationFrame(tick);
        else setTimeout(() => setShowConditions(true), 300);
      };
      requestAnimationFrame(tick);
      observer.disconnect();
    }, { threshold: 0.4 });
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
    let W = 0, H = 0;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas!.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas!.width  = Math.round(W * dpr);
      canvas!.height = Math.round(H * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    // ── Helpers ──────────────────────────────────────────────────────────────
    function drawRidge(fn: (x: number) => number, scrollX: number, color: string) {
      ctx!.beginPath();
      ctx!.moveTo(0, H);
      for (let sx = 0; sx <= W; sx += 2) {
        const lx = ((sx + scrollX) % TILE + TILE) % TILE;
        ctx!.lineTo(sx, fn(lx) * H);
      }
      ctx!.lineTo(W, H);
      ctx!.closePath();
      ctx!.fillStyle = color;
      ctx!.fill();
    }

    function drawSnowCaps(fn: (x: number) => number, scrollX: number, threshFrac: number) {
      ctx!.save();
      // Clip to ridge shape
      ctx!.beginPath();
      ctx!.moveTo(0, H);
      for (let sx = 0; sx <= W; sx += 2) {
        const lx = ((sx + scrollX) % TILE + TILE) % TILE;
        ctx!.lineTo(sx, fn(lx) * H);
      }
      ctx!.lineTo(W, H);
      ctx!.closePath();
      ctx!.clip();
      // Gradient snow: bright at very top, fades below threshold
      const g = ctx!.createLinearGradient(0, 0.20 * H, 0, threshFrac * H);
      g.addColorStop(0, "rgba(215,255,230,0.65)");
      g.addColorStop(1, "rgba(215,255,230,0.00)");
      ctx!.fillStyle = g;
      ctx!.fillRect(0, 0, W, threshFrac * H);
      ctx!.restore();
    }

    function drawBuildings(buildings: Building[], scrollX: number, fill: string, winCol: string) {
      for (const b of buildings) {
        for (let copy = 0; copy < 2; copy++) {
          const sx = b.x - scrollX + copy * TILE;
          if (sx + b.w < 0 || sx > W) continue;
          const top = H - b.h;
          // Body
          ctx!.fillStyle = fill;
          ctx!.fillRect(sx, top, b.w, b.h);
          // Antenna
          if (b.antennaH > 0) {
            ctx!.fillRect(sx + b.w / 2 - 1, top - b.antennaH, 2, b.antennaH);
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
      if (!W || !H) { lastTs = ts; return; }

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

      // ── Sky ────────────────────────────────────────────────────────────────
      const sky = ctx!.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0,    "#010d04");
      sky.addColorStop(0.45, "#021508");
      sky.addColorStop(0.78, "#072010");
      sky.addColorStop(1.0,  "#0b2810");
      ctx!.fillStyle = sky;
      ctx!.fillRect(0, 0, W, H);

      // ── Moon ───────────────────────────────────────────────────────────────
      const mR = Math.min(W * 0.26, H * 0.60);
      const mx = W * 0.5, my = -mR * 0.08;
      // Outer glow
      const glow = ctx!.createRadialGradient(mx, my, mR * 0.7, mx, my, mR * 3.2);
      glow.addColorStop(0,   "rgba(0,230,80,0.22)");
      glow.addColorStop(0.4, "rgba(0,180,55,0.07)");
      glow.addColorStop(1,   "rgba(0,0,0,0)");
      ctx!.fillStyle = glow;
      ctx!.fillRect(mx - mR * 3.2, my - mR * 3.2, mR * 6.4, mR * 6.4);
      // Moon body
      const mb = ctx!.createRadialGradient(mx - mR * 0.18, my - mR * 0.18, 0, mx, my, mR);
      mb.addColorStop(0,    "#00ff80");
      mb.addColorStop(0.35, "#00dd62");
      mb.addColorStop(0.72, "#009940");
      mb.addColorStop(1,    "#003f1a");
      ctx!.beginPath();
      ctx!.arc(mx, my, mR, 0, Math.PI * 2);
      ctx!.fillStyle = mb;
      ctx!.fill();

      // ── Stars (twinkling) ──────────────────────────────────────────────────
      const starScroll = (scroll * 0.12) % TILE;
      for (const s of STARS) {
        const sx = ((s.lx - starScroll + TILE * 10) % TILE) / TILE * W;
        const sy = s.yFrac * H;
        const tw = 0.35 + 0.65 * Math.sin(t * 0.001 * s.ts + s.phase);
        ctx!.beginPath();
        ctx!.arc(sx, sy, s.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(180,255,205,${(tw * 0.62).toFixed(2)})`;
        ctx!.fill();
      }

      // ── Layer 1: Far range (slowest — distant Rockies) ─────────────────────
      const farScroll = (scroll * 0.09) % TILE;
      drawRidge(FAR_RIDGE, farScroll, "rgba(0,55,20,0.38)");

      // ── Layer 2: Front Range with snow caps ────────────────────────────────
      const midScroll = (scroll * 0.20) % TILE;
      drawRidge(MID_RIDGE, midScroll, "rgba(0,44,16,0.72)");
      drawSnowCaps(MID_RIDGE, midScroll, 0.44);

      // ── Layer 3: Denver skyscrapers ────────────────────────────────────────
      const scScroll = (scroll * 0.50) % TILE;
      drawBuildings(sc, scScroll, "#030f06", "rgba(255,155,50,0.72)");

      // ── Layer 4: Mid-rise ──────────────────────────────────────────────────
      const mrScroll = (scroll * 0.72) % TILE;
      drawBuildings(mr, mrScroll, "#020d05", "rgba(255,140,42,0.58)");

      // ── Layer 5: Apartments (closest, fastest) ─────────────────────────────
      const apScroll = (scroll * 1.0) % TILE;
      drawBuildings(ap, apScroll, "#01090303", "rgba(255,125,38,0.50)");

      // ── Ground haze ────────────────────────────────────────────────────────
      const haze = ctx!.createLinearGradient(0, H * 0.80, 0, H);
      haze.addColorStop(0,   "rgba(0,0,0,0)");
      haze.addColorStop(0.5, "rgba(0,28,8,0.55)");
      haze.addColorStop(1,   "rgba(0,40,12,0.90)");
      ctx!.fillStyle = haze;
      ctx!.fillRect(0, H * 0.80, W, H * 0.20);
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
        <div className="flex-shrink-0 w-24 h-24 bg-primary/10 border border-primary/20 flex items-center justify-center text-primary relative">
          <Icon_Location />
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-[11px] text-primary font-bold uppercase font-mono tracking-tight">
            TIME_ZONE: MST
          </p>
          <h4 className="text-3xl font-headline font-black uppercase text-on-surface leading-none">
            DENVER_CO
          </h4>
          <p className="text-[11px] text-on-surface-variant font-mono uppercase tracking-widest mt-1">
            ELEV:{" "}
            <span className="text-primary tabular-nums">
              {elevation.toLocaleString()}
            </span>{" "}
            FT &nbsp;·&nbsp; MILE HIGH CITY
          </p>
          <p
            className="text-[10px] text-on-surface-variant/60 font-mono uppercase tracking-widest transition-opacity duration-700"
            style={{ opacity: showConditions ? 1 : 0 }}
          >
            39.7392° N, 104.9903° W &nbsp;·&nbsp; FRONT RANGE
          </p>
        </div>

        <div className="hidden md:flex ml-auto mr-4 flex-col items-center opacity-20">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="24" r="22" stroke="#00e5ff" strokeWidth="0.75" />
            <circle cx="24" cy="24" r="2.5" fill="#00e5ff" />
            <polygon points="24,4 21.5,24 26.5,24" fill="#00e5ff" />
            <polygon points="24,44 21.5,24 26.5,24" fill="#00e5ff" opacity="0.5" />
            <polygon points="44,24 24,21.5 24,26.5" fill="#00e5ff" opacity="0.5" />
            <polygon points="4,24 24,21.5 24,26.5" fill="#00e5ff" opacity="0.5" />
            <text x="23" y="14" fill="#00e5ff" fontSize="5" fontFamily="monospace" textAnchor="middle">N</text>
          </svg>
        </div>
      </div>
    </div>
  );
}
