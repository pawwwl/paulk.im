"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ── 5×7 pixel font ─────────────────────────────────────────────────────────────

const GLYPHS: Record<string, number[]> = {
  " ": [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000],
  A: [0b01110, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  B: [0b11110, 0b10001, 0b10001, 0b11110, 0b10001, 0b10001, 0b11110],
  C: [0b01111, 0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b01111],
  D: [0b11110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b11110],
  E: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b11111],
  F: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b10000],
  G: [0b01111, 0b10000, 0b10000, 0b10011, 0b10001, 0b10001, 0b01111],
  H: [0b10001, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  I: [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b11111],
  J: [0b00111, 0b00010, 0b00010, 0b00010, 0b00010, 0b10010, 0b01100],
  K: [0b10001, 0b10010, 0b10100, 0b11000, 0b10100, 0b10010, 0b10001],
  L: [0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b11111],
  M: [0b10001, 0b11011, 0b10101, 0b10001, 0b10001, 0b10001, 0b10001],
  N: [0b10001, 0b11001, 0b10101, 0b10011, 0b10001, 0b10001, 0b10001],
  O: [0b01110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  P: [0b11110, 0b10001, 0b10001, 0b11110, 0b10000, 0b10000, 0b10000],
  Q: [0b01110, 0b10001, 0b10001, 0b10001, 0b10101, 0b10010, 0b01101],
  R: [0b11110, 0b10001, 0b10001, 0b11110, 0b10100, 0b10010, 0b10001],
  S: [0b01111, 0b10000, 0b10000, 0b01110, 0b00001, 0b00001, 0b11110],
  T: [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100],
  U: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  V: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01010, 0b00100],
  W: [0b10001, 0b10001, 0b10001, 0b10101, 0b10101, 0b11011, 0b10001],
  X: [0b10001, 0b10001, 0b01010, 0b00100, 0b01010, 0b10001, 0b10001],
  Y: [0b10001, 0b10001, 0b01010, 0b00100, 0b00100, 0b00100, 0b00100],
  Z: [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b10000, 0b11111],
  "0": [0b01110, 0b10001, 0b10011, 0b10101, 0b11001, 0b10001, 0b01110],
  "1": [0b00100, 0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  "2": [0b01110, 0b10001, 0b00001, 0b00110, 0b01000, 0b10000, 0b11111],
  "3": [0b11110, 0b00001, 0b00001, 0b01110, 0b00001, 0b00001, 0b11110],
  "4": [0b00010, 0b00110, 0b01010, 0b10010, 0b11111, 0b00010, 0b00010],
  "5": [0b11111, 0b10000, 0b10000, 0b11110, 0b00001, 0b00001, 0b11110],
  "6": [0b01110, 0b10000, 0b10000, 0b11110, 0b10001, 0b10001, 0b01110],
  "7": [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b01000, 0b01000],
  "8": [0b01110, 0b10001, 0b10001, 0b01110, 0b10001, 0b10001, 0b01110],
  "9": [0b01110, 0b10001, 0b10001, 0b01111, 0b00001, 0b00001, 0b01110],
  ".": [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00100],
  "!": [0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00000, 0b00100],
  "?": [0b01110, 0b10001, 0b00001, 0b00110, 0b00100, 0b00000, 0b00100],
  "-": [0b00000, 0b00000, 0b00000, 0b11111, 0b00000, 0b00000, 0b00000],
  "'": [0b00100, 0b00100, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000],
  ",": [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00110, 0b00100],
};

// ── Grid constants ─────────────────────────────────────────────────────────────

const CHAR_W = 5;
const CHAR_H = 7;
const CHAR_GAP = 1;
const LINE_GAP = 3;
const COLS = 240;
const ROWS = 240;
const PAD_COL = 8;
const CHARS_PER_LINE = Math.floor((COLS - PAD_COL * 2) / (CHAR_W + CHAR_GAP));

// ── Text → lit dots ───────────────────────────────────────────────────────────

function wordWrap(text: string, maxLen: number): string[] {
  const words = text.split(" ").filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length <= maxLen) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      let w = word;
      while (w.length > maxLen) {
        lines.push(w.slice(0, maxLen));
        w = w.slice(maxLen);
      }
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function computeLitDots(text: string): Set<number> {
  const upper = text.toUpperCase().replace(/[^A-Z0-9 !?.,'"\-]/g, "");
  const lines = wordWrap(upper, CHARS_PER_LINE);
  const MAX_LINES = Math.floor((ROWS - 6) / (CHAR_H + LINE_GAP));
  const display = lines.slice(-MAX_LINES);

  const lineH = CHAR_H + LINE_GAP;
  const startRow = PAD_COL;

  const lit = new Set<number>();
  display.forEach((line, li) => {
    line.split("").forEach((ch, ci) => {
      const glyph = GLYPHS[ch] ?? GLYPHS[" "];
      const col0 = PAD_COL + ci * (CHAR_W + CHAR_GAP);
      glyph.forEach((bits, r) => {
        for (let b = 0; b < CHAR_W; b++) {
          if (bits & (1 << (CHAR_W - 1 - b))) {
            const dr = startRow + li * lineH + r;
            const dc = col0 + b;
            if (dr >= 0 && dr < ROWS && dc >= 0 && dc < COLS) {
              lit.add(dr * COLS + dc);
            }
          }
        }
      });
    });
  });
  return lit;
}

// ── Canvas dot grid ────────────────────────────────────────────────────────────

const DIM_COLOR = "#161616";
const FLICKER_COUNT = 18;
const FLICKER_BRIGHT = "rgba(255,255,255,0.5)";
const STAGGER_PER_COL = 4;  // ms delay per grid column
const FADE_MS = 120;        // ms to fully light up after stagger delay

function parseColor(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function DotGrid({ litDots, litColor }: { litDots: Set<number>; litColor: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const litDotsRef = useRef(litDots);
  const litColorRef = useRef(litColor);
  const flickerRef = useRef<Set<number>>(new Set());
  const rafRef = useRef<number>(0);
  // idx → timestamp when dot first became lit
  const birthRef = useRef<Map<number, number>>(new Map());
  const prevDotsRef = useRef<Set<number>>(new Set());

  litDotsRef.current = litDots;
  litColorRef.current = litColor;

  // When litDots changes, record birth time for newly lit dots and clear removed ones
  useEffect(() => {
    const now = performance.now();
    const prev = prevDotsRef.current;
    const next = litDots;
    const births = birthRef.current;

    // New dots
    for (const idx of next) {
      if (!prev.has(idx)) births.set(idx, now);
    }
    // Removed dots
    for (const idx of prev) {
      if (!next.has(idx)) births.delete(idx);
    }

    prevDotsRef.current = new Set(next);
  }, [litDots]);

  // Single rAF loop — flicker + stagger animation
  useEffect(() => {
    const total = ROWS * COLS;
    let lastFlicker = 0;

    const loop = (t: number) => {
      rafRef.current = requestAnimationFrame(loop);

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const cssW = window.innerWidth;
      const cssH = window.innerHeight;

      if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
        canvas.width = Math.round(cssW * dpr);
        canvas.height = Math.round(cssH * dpr);
      }

      const sx = cssW / COLS;
      const sy = cssH / ROWS;
      const r = Math.min(sx, sy) * 0.22;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);

      const dots = litDotsRef.current;
      const color = litColorRef.current;
      const births = birthRef.current;
      const flicker = flickerRef.current;

      // Update flicker set every 80ms
      if (t - lastFlicker > 80) {
        lastFlicker = t;
        const next = new Set<number>();
        for (let i = 0; i < FLICKER_COUNT; i++) next.add(Math.floor(Math.random() * total));
        flickerRef.current = next;
      }

      // Separate lit dots into stable (alpha=1) and animating (0<alpha<1)
      const stable: number[] = [];
      // Map alpha → list of idx, quantized to 10 buckets for batching
      const animBuckets = new Map<number, number[]>();

      for (const idx of dots) {
        const born = births.get(idx) ?? t;
        const col = idx % COLS;
        const staggerDelay = col * STAGGER_PER_COL;
        const elapsed = t - born - staggerDelay;
        if (elapsed >= FADE_MS) {
          stable.push(idx);
        } else if (elapsed > 0) {
          const alpha = Math.round((elapsed / FADE_MS) * 10) / 10; // 0.1 … 0.9
          if (!animBuckets.has(alpha)) animBuckets.set(alpha, []);
          animBuckets.get(alpha)!.push(idx);
        }
        // elapsed <= 0: dot is waiting for its stagger delay, stays dim
      }

      // Draw dim dots
      ctx.fillStyle = DIM_COLOR;
      ctx.beginPath();
      for (let idx = 0; idx < total; idx++) {
        if (!dots.has(idx) && !flicker.has(idx)) {
          const c = idx % COLS;
          const row = (idx - c) / COLS;
          ctx.moveTo(c * sx + sx / 2 + r, row * sy + sy / 2);
          ctx.arc(c * sx + sx / 2, row * sy + sy / 2, r, 0, Math.PI * 2);
        }
      }
      ctx.fill();

      // Draw flicker dots
      ctx.fillStyle = FLICKER_BRIGHT;
      ctx.beginPath();
      for (const idx of flicker) {
        if (!dots.has(idx)) {
          const c = idx % COLS;
          const row = (idx - c) / COLS;
          ctx.moveTo(c * sx + sx / 2 + r, row * sy + sy / 2);
          ctx.arc(c * sx + sx / 2, row * sy + sy / 2, r, 0, Math.PI * 2);
        }
      }
      ctx.fill();

      // Draw stable lit dots (full alpha, one batch)
      ctx.globalAlpha = 1;
      ctx.fillStyle = color;
      ctx.beginPath();
      for (const idx of stable) {
        const c = idx % COLS;
        const row = (idx - c) / COLS;
        ctx.moveTo(c * sx + sx / 2 + r, row * sy + sy / 2);
        ctx.arc(c * sx + sx / 2, row * sy + sy / 2, r, 0, Math.PI * 2);
      }
      ctx.fill();

      // Draw animating dots per alpha bucket
      const [cr, cg, cb] = parseColor(color.startsWith("#") ? color : "#5dff3b");
      for (const [alpha, indices] of animBuckets) {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
        ctx.beginPath();
        for (const idx of indices) {
          const c = idx % COLS;
          const row = (idx - c) / COLS;
          ctx.moveTo(c * sx + sx / 2 + r, row * sy + sy / 2);
          ctx.arc(c * sx + sx / 2, row * sy + sy / 2, r, 0, Math.PI * 2);
        }
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Resize
  useEffect(() => {
    const onResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", top: 48, left: 0, right: 0, bottom: 0, display: "block", width: "100dvw", height: "calc(100dvh - 48px)" }}
    />
  );
}

// ── Speech recognition types ──────────────────────────────────────────────────

interface SREvent {
  results: {
    length: number;
    [i: number]: { isFinal: boolean; [j: number]: { transcript: string } };
  };
  resultIndex: number;
}
interface SR {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: SREvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

const QUESTION_STARTERS = /^(who|what|when|where|why|how|is|are|was|were|can|could|would|should|do|does|did|have|has|had|will|shall|may|might|am)\b/i;

function normalizeSpeech(t: string): string {
  return t.trim();
}

function punctuate(t: string): string {
  const trimmed = t.trim();
  if (!trimmed) return trimmed;
  // Already ends with punctuation
  if (/[.?,!]$/.test(trimmed)) return trimmed;
  const wordCount = trimmed.split(/\s+/).length;
  if (QUESTION_STARTERS.test(trimmed)) return trimmed + "?";
  if (wordCount <= 3) return trimmed + ",";
  return trimmed + ".";
}

function createSR(): SR | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Ctor =
    (window as any).SpeechRecognition ??
    (window as any).webkitSpeechRecognition;
  if (!Ctor) return null;
  const sr: SR = new Ctor();
  sr.continuous = true;
  sr.interimResults = true;
  sr.lang = "en-US";
  return sr;
}

// ── Main component ─────────────────────────────────────────────────────────────

export function Speech2Led() {
  const [finalText, setFinalText] = useState("");
  const [interim, setInterim] = useState("");
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const srRef = useRef<SR | null>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ok = !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );
    setSupported(ok);
  }, []);

  const displayText =
    (finalText + (interim ? " " + interim : "")).trim() || "SAY SOMETHING";
  const litDots = useMemo(() => computeLitDots(displayText), [displayText]);
  const litColor = listening ? "#5dff3b" : "#00e5ff";

  const stop = useCallback(() => {
    srRef.current?.stop();
    srRef.current = null;
    setListening(false);
    setInterim("");
  }, []);

  const start = useCallback(() => {
    const sr = createSR();
    if (!sr) return;
    srRef.current = sr;
    setFinalText("");
    setInterim("");

    sr.onresult = (e: SREvent) => {
      let interimBuf = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) {
          setFinalText((prev) => (prev + " " + punctuate(normalizeSpeech(res[0].transcript))).trimStart());
        } else {
          interimBuf += normalizeSpeech(res[0].transcript);
        }
      }
      setInterim(interimBuf);
    };

    sr.onerror = (e) => {
      if (e.error !== "no-speech") {
        setListening(false);
        setInterim("");
      }
    };

    sr.onend = () => {
      setListening(false);
      setInterim("");
    };

    sr.start();
    setListening(true);
  }, []);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ background: "#0a0a0a", isolation: "isolate" }}
    >
      <DotGrid litDots={litDots} litColor={litColor} />

      {supported && (
        <div
          className="fixed inset-x-0 bottom-8 flex flex-col items-center gap-3 pointer-events-none"
          style={{ zIndex: 70 }}
        >
          <button
            onClick={toggle}
            className="pointer-events-auto relative flex items-center justify-center size-14 rounded-full cursor-pointer transition-all duration-200"
            style={{
              background: listening
                ? "rgba(93,255,59,0.1)"
                : "rgba(255,255,255,0.05)",
              border: `1px solid ${listening ? "rgba(93,255,59,0.4)" : "rgba(255,255,255,0.1)"}`,
              boxShadow: listening ? "0 0 20px rgba(93,255,59,0.15)" : "none",
            }}
          >
            {listening && (
              <span
                className="absolute inset-0 rounded-full animate-ping"
                style={{
                  background: "rgba(93,255,59,0.12)",
                  animationDuration: "1.4s",
                }}
              />
            )}
            {listening ? (
              <svg width="16" height="16" viewBox="0 0 16 16">
                <rect
                  x="3"
                  y="3"
                  width="10"
                  height="10"
                  rx="2"
                  fill="rgba(93,255,59,0.9)"
                />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <rect x="6.5" y="1" width="5" height="8" rx="2.5" />
                <path d="M3 9a6 6 0 0 0 12 0" />
                <line x1="9" y1="15" x2="9" y2="17" />
                <line x1="6" y1="17" x2="12" y2="17" />
              </svg>
            )}
          </button>

          <span
            className="pointer-events-none font-mono text-[9px] uppercase tracking-[0.3em]"
            style={{
              color: listening
                ? "rgba(93,255,59,0.5)"
                : "rgba(255,255,255,0.15)",
            }}
          >
            {listening ? "listening" : "tap to speak"}
          </span>
        </div>
      )}
    </div>
  );
}
