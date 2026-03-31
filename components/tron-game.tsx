"use client";

import { useEffect, useRef } from "react";

const CELL = 6;
const TICK_MS = 90;
const RESET_MS = 1400;
const CYAN = "#00E5FF";
const PINK = "#FF4081";
const BG = "#0a0a0a";
// 20% chance per tick a bot picks a random safe turn instead of optimal
const RANDOM_CHANCE = 0.2;

type Dir = [number, number];

function turnLeft([dx, dy]: Dir): Dir  { return [dy, -dx]; }
function turnRight([dx, dy]: Dir): Dir { return [-dy, dx]; }

function safeAhead(
  grid: Uint8Array, cols: number, rows: number,
  x: number, y: number, [dx, dy]: Dir, depth = 14,
): number {
  let count = 0;
  for (let i = 1; i <= depth; i++) {
    const nx = x + dx * i, ny = y + dy * i;
    if (nx < 0 || nx >= cols || ny < 0 || ny >= rows || grid[ny * cols + nx]) break;
    count++;
  }
  return count;
}

type Bot = { x: number; y: number; dir: Dir; alive: boolean };
type State = {
  bots: [Bot, Bot];
  grid: Uint8Array;
  cols: number;
  rows: number;
  phase: "playing" | "p1" | "p2" | "draw";
};
type Score = { p1: number; p2: number };

function botAI(bot: Bot, grid: Uint8Array, cols: number, rows: number): Dir {
  const candidates: Dir[] = [bot.dir, turnLeft(bot.dir), turnRight(bot.dir)];
  // Score each candidate
  const scored = candidates.map(d => ({
    d,
    score: safeAhead(grid, cols, rows, bot.x, bot.y, d),
  }));
  const safe = scored.filter(c => c.score > 0);

  // Occasionally pick a random safe direction to break symmetry
  if (safe.length > 1 && Math.random() < RANDOM_CHANCE) {
    return safe[Math.floor(Math.random() * safe.length)].d;
  }

  // Otherwise take optimal
  let best = bot.dir, bestScore = -1;
  for (const { d, score } of scored) {
    if (score > bestScore) { bestScore = score; best = d; }
  }
  return best;
}

function initGame(cols: number, rows: number): State {
  const grid = new Uint8Array(cols * rows);
  // Randomize vertical start position slightly to break symmetry
  const yOff = Math.floor((Math.random() - 0.5) * rows * 0.3);
  const b1: Bot = {
    x: Math.floor(cols * 0.25),
    y: Math.floor(rows * 0.5) + yOff,
    dir: [1, 0],
    alive: true,
  };
  const b2: Bot = {
    x: Math.floor(cols * 0.75),
    y: Math.floor(rows * 0.5) - yOff,
    dir: [-1, 0],
    alive: true,
  };
  grid[b1.y * cols + b1.x] = 1;
  grid[b2.y * cols + b2.x] = 2;
  return { bots: [b1, b2], grid, cols, rows, phase: "playing" };
}

export function TronGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<State | null>(null);
  const scoreRef = useRef<Score>({ p1: 0, p2: 0 });
  const lastTickRef = useRef(0);
  const animRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    const cols = Math.floor(canvas.width / CELL);
    const rows = Math.floor(canvas.height / CELL);
    stateRef.current = initGame(cols, rows);
    lastTickRef.current = performance.now();

    const draw = (ctx: CanvasRenderingContext2D) => {
      const s = stateRef.current!;
      const score = scoreRef.current;
      const { cols, rows, grid, bots, phase } = s;
      const W = canvas.width, H = canvas.height;

      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      // grid lines
      ctx.strokeStyle = "rgba(0,229,255,0.04)";
      ctx.lineWidth = 1;
      for (let x = 0; x <= cols; x++) {
        ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, rows * CELL); ctx.stroke();
      }
      for (let y = 0; y <= rows; y++) {
        ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(cols * CELL, y * CELL); ctx.stroke();
      }

      // trails
      for (let i = 0; i < grid.length; i++) {
        if (!grid[i]) continue;
        const gx = i % cols, gy = Math.floor(i / cols);
        const c = grid[i] === 1 ? CYAN : PINK;
        ctx.fillStyle = c;
        ctx.shadowColor = c;
        ctx.shadowBlur = 3;
        ctx.fillRect(gx * CELL + 1, gy * CELL + 1, CELL - 2, CELL - 2);
      }
      ctx.shadowBlur = 0;

      // bot heads
      for (const [i, bot] of bots.entries()) {
        if (!bot.alive) continue;
        const c = i === 0 ? CYAN : PINK;
        ctx.fillStyle = c;
        ctx.shadowColor = c;
        ctx.shadowBlur = 16;
        ctx.fillRect(bot.x * CELL, bot.y * CELL, CELL, CELL);
        ctx.shadowBlur = 0;
      }

      // score
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = CYAN;
      ctx.shadowColor = CYAN;
      ctx.shadowBlur = 6;
      ctx.fillText(String(score.p1), W / 2 - 18, 16);
      ctx.fillStyle = "rgba(150,160,165,0.5)";
      ctx.shadowBlur = 0;
      ctx.fillText(":", W / 2, 16);
      ctx.fillStyle = PINK;
      ctx.shadowColor = PINK;
      ctx.shadowBlur = 6;
      ctx.fillText(String(score.p2), W / 2 + 18, 16);
      ctx.shadowBlur = 0;

      // round-end overlay
      if (phase !== "playing") {
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(0, 0, W, H);
        const winner = phase === "p1" ? CYAN : phase === "p2" ? PINK : "#ffffff";
        const label = phase === "draw" ? "DRAW" : `${phase === "p1" ? "CYAN" : "PINK"} WINS`;
        ctx.font = "bold 12px monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = winner;
        ctx.shadowColor = winner;
        ctx.shadowBlur = 12;
        ctx.fillText(label, W / 2, H / 2);
        ctx.shadowBlur = 0;
      }
    };

    const tick = () => {
      const s = stateRef.current!;
      if (s.phase !== "playing") return;
      const { bots, grid, cols, rows } = s;

      const dirs = bots.map(b => b.alive ? botAI(b, grid, cols, rows) : b.dir) as [Dir, Dir];

      for (const [i, bot] of bots.entries()) {
        if (!bot.alive) continue;
        bot.dir = dirs[i];
        bot.x += bot.dir[0];
        bot.y += bot.dir[1];
      }

      for (const bot of bots) {
        if (!bot.alive) continue;
        const { x, y } = bot;
        if (x < 0 || x >= cols || y < 0 || y >= rows || grid[y * cols + x] !== 0) {
          bot.alive = false;
        }
      }

      for (const [i, bot] of bots.entries()) {
        if (bot.alive) grid[bot.y * cols + bot.x] = i + 1;
      }

      const [a1, a2] = [bots[0].alive, bots[1].alive];
      if (!a1 && !a2) s.phase = "draw";
      else if (!a1) { s.phase = "p2"; scoreRef.current.p2++; }
      else if (!a2) { s.phase = "p1"; scoreRef.current.p1++; }

      if (s.phase !== "playing") {
        setTimeout(() => {
          stateRef.current = initGame(cols, rows);
          lastTickRef.current = performance.now();
        }, RESET_MS);
      }
    };

    const loop = (now: number) => {
      const ctx = canvas.getContext("2d");
      if (ctx) draw(ctx);
      if (now - lastTickRef.current >= TICK_MS) {
        tick();
        lastTickRef.current = now;
      }
      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <div ref={containerRef} className="bg-surface-container border border-outline relative overflow-hidden min-h-[250px]">
      <div className="absolute top-2 left-3 z-10 pointer-events-none">
        <p className="text-primary text-[10px] uppercase tracking-widest font-bold font-mono">TRON</p>
      </div>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
