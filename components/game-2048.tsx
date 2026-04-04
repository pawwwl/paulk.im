"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ── Constants ─────────────────────────────────────────────────────────────────
const GRID = 4;
const GAP = 8;
const ANIM_MS = 120;

// Tile colors matching the site palette (dark theme)
const TILE_COLORS: Record<number, { bg: string; fg: string }> = {
  0:    { bg: "#1e1e1e", fg: "transparent" },
  2:    { bg: "#1c3a3f", fg: "#cce8ed" },
  4:    { bg: "#14434a", fg: "#b8e4eb" },
  8:    { bg: "#005f6b", fg: "#00e5ff" },
  16:   { bg: "#006a5a", fg: "#5dff3b" },
  32:   { bg: "#7a1f3a", fg: "#ffb3cc" },
  64:   { bg: "#991a44", fg: "#ff3b9a" },
128:   { bg: "#004a7a", fg: "#00e5ff" },
256:   { bg: "#005c99", fg: "#ffffff" },
512:   { bg: "#1a006e", fg: "#b8a0ff" },
1024:  { bg: "#2d0080", fg: "#d4c0ff" },
2048:  { bg: "#00e5ff", fg: "#000000" },
};

function tileColor(v: number) {
  return TILE_COLORS[v] ?? { bg: "#1a0050", fg: "#ffffff" };
}

// ── Game logic ────────────────────────────────────────────────────────────────
type Board = number[][];

function empty(): Board {
  return Array.from({ length: GRID }, () => Array(GRID).fill(0));
}

function addRandom(board: Board): Board {
  const cells: [number, number][] = [];
  for (let r = 0; r < GRID; r++)
    for (let c = 0; c < GRID; c++)
      if (board[r][c] === 0) cells.push([r, c]);
  if (!cells.length) return board;
  const [r, c] = cells[Math.floor(Math.random() * cells.length)];
  const next = board.map((row) => [...row]);
  next[r][c] = Math.random() < 0.9 ? 2 : 4;
  return next;
}

function slideRow(row: number[]): { row: number[]; score: number } {
  const vals = row.filter((v) => v !== 0);
  let score = 0;
  for (let i = 0; i < vals.length - 1; i++) {
    if (vals[i] === vals[i + 1]) {
      vals[i] *= 2;
      score += vals[i];
      vals.splice(i + 1, 1);
    }
  }
  while (vals.length < GRID) vals.push(0);
  return { row: vals, score };
}

function moveLeft(board: Board): { board: Board; score: number; moved: boolean } {
  let score = 0;
  let moved = false;
  const next = board.map((row) => {
    const { row: newRow, score: s } = slideRow(row);
    if (newRow.some((v, i) => v !== row[i])) moved = true;
    score += s;
    return newRow;
  });
  return { board: next, score, moved };
}

function rotate90(board: Board): Board {
  return board[0].map((_, c) => board.map((row) => row[c]).reverse());
}

function move(board: Board, dir: "left" | "right" | "up" | "down") {
  const rotations = { left: 0, down: 1, right: 2, up: 3 };
  let b = board;
  const n = rotations[dir];
  for (let i = 0; i < n; i++) b = rotate90(b);
  const result = moveLeft(b);
  let nb = result.board;
  for (let i = 0; i < (4 - n) % 4; i++) nb = rotate90(nb);
  return { board: nb, score: result.score, moved: result.moved };
}

function hasWon(board: Board) {
  return board.some((row) => row.some((v) => v >= 2048));
}

function isGameOver(board: Board) {
  for (const dir of ["left", "right", "up", "down"] as const) {
    if (move(board, dir).moved) return false;
  }
  return true;
}

function newGame(): Board {
  return addRandom(addRandom(empty()));
}

// ── Animated tile ─────────────────────────────────────────────────────────────
interface TileAnim {
  value: number;
  // logical grid position (can be fractional during slide)
  row: number;
  col: number;
  // target position
  toRow: number;
  toCol: number;
  // 0..1 progress
  progress: number;
  // spawn animation (scale 0→1)
  spawn: number;
  // merge pop (scale 1→1.2→1)
  pop: number;
  merged: boolean;
  id: number;
}

let nextId = 1;

function boardToTiles(board: Board): TileAnim[] {
  const tiles: TileAnim[] = [];
  for (let r = 0; r < GRID; r++)
    for (let c = 0; c < GRID; c++)
      if (board[r][c] !== 0)
        tiles.push({ value: board[r][c], row: r, col: c, toRow: r, toCol: c, progress: 1, spawn: 1, pop: 0, merged: false, id: nextId++ });
  return tiles;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function Game2048() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<{
    board: Board;
    tiles: TileAnim[];
    score: number;
    best: number;
    animating: boolean;
    won: boolean;
    over: boolean;
    raf: number;
  }>({
    board: newGame(),
    tiles: [],
    score: 0,
    best: 0,
    animating: false,
    won: false,
    over: false,
    raf: 0,
  });

  // Sync tiles from initial board
  useEffect(() => {
    stateRef.current.tiles = boardToTiles(stateRef.current.board);
  }, []);

  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [over, setOver] = useState(false);
  const [won, setWon] = useState(false);

  // ── Drawing ──────────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.width / dpr;
    const H = canvas.height / dpr;

    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = "#111111";
    ctx.fillRect(0, 0, W, H);

    // Grid area — square, centered
    const gridSize = Math.min(W, H) - GAP * 2;
    const ox = (W - gridSize) / 2;
    const oy = (H - gridSize) / 2;
    const cellSize = (gridSize - GAP * (GRID + 1)) / GRID;

    // Grid background
    ctx.fillStyle = "#161616";
    roundRect(ctx, ox, oy, gridSize, gridSize, 8);
    ctx.fill();

    // Empty cell slots
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        const x = ox + GAP + c * (cellSize + GAP);
        const y = oy + GAP + r * (cellSize + GAP);
        ctx.fillStyle = "#1e1e1e";
        roundRect(ctx, x, y, cellSize, cellSize, 6);
        ctx.fill();
      }
    }

    // Draw tiles
    const s = stateRef.current;
    for (const tile of s.tiles) {
      if (tile.value === 0) continue;

      // Interpolate position
      const t = easeOut(Math.min(tile.progress, 1));
      const row = tile.row + (tile.toRow - tile.row) * t;
      const col = tile.col + (tile.toCol - tile.col) * t;

      const x = ox + GAP + col * (cellSize + GAP);
      const y = oy + GAP + row * (cellSize + GAP);

      // Scale for spawn / pop
      let scale = tile.spawn < 1 ? easeOut(tile.spawn) * 1.1 : 1;
      if (tile.pop > 0) scale = 1 + Math.sin(tile.pop * Math.PI) * 0.18;

      const { bg, fg } = tileColor(tile.value);

      ctx.save();
      ctx.translate(x + cellSize / 2, y + cellSize / 2);
      ctx.scale(scale, scale);

      // Tile background
      ctx.fillStyle = bg;
      roundRect(ctx, -cellSize / 2, -cellSize / 2, cellSize, cellSize, 6);
      ctx.fill();

      // Glow for high values
      if (tile.value >= 128) {
        ctx.shadowColor = fg;
        ctx.shadowBlur = 10 + Math.log2(tile.value / 64) * 4;
      }

      // Value text
      if (fg !== "transparent") {
        const fontSize = cellSize * (tile.value >= 1024 ? 0.28 : tile.value >= 128 ? 0.34 : 0.4);
        ctx.font = `bold ${fontSize}px "Space Grotesk", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = fg;
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        if (tile.value >= 128) {
          ctx.shadowColor = fg;
          ctx.shadowBlur = 8;
        }
        ctx.fillText(String(tile.value), 0, 0);
      }

      ctx.restore();
    }
  }, []);

  // ── Animation loop ────────────────────────────────────────────────────────────
  const startLoop = useCallback(() => {
    const s = stateRef.current;
    let lastTs = 0;

    function loop(ts: number) {
      const dt = Math.min(ts - lastTs, 50);
      lastTs = ts;

      let needsDraw = false;
      let animDone = true;

      for (const tile of s.tiles) {
        if (tile.progress < 1) {
          tile.progress = Math.min(1, tile.progress + dt / ANIM_MS);
          animDone = false;
          needsDraw = true;
        }
        if (tile.spawn < 1) {
          tile.spawn = Math.min(1, tile.spawn + dt / (ANIM_MS * 0.8));
          animDone = false;
          needsDraw = true;
        }
        if (tile.pop > 0) {
          tile.pop = Math.max(0, tile.pop - dt / (ANIM_MS * 0.7));
          animDone = false;
          needsDraw = true;
        }
      }

      if (needsDraw) draw();

      if (!animDone) {
        s.raf = requestAnimationFrame(loop);
      } else {
        s.animating = false;
      }
    }

    s.raf = requestAnimationFrame(loop);
  }, [draw]);

  // ── Resize ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    function resize() {
      if (!canvas || !container) return;
      const dpr = window.devicePixelRatio || 1;
      const { width, height } = container.getBoundingClientRect();
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(dpr, dpr);
      draw();
    }

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();
    return () => ro.disconnect();
  }, [draw]);

  // ── Input handling ────────────────────────────────────────────────────────────
  const handleMove = useCallback((dir: "left" | "right" | "up" | "down") => {
    const s = stateRef.current;
    if (s.animating || s.over) return;

    const result = move(s.board, dir);
    if (!result.moved) return;

    // Build next tile list with slide animations
    const prevTiles = s.tiles.filter((t) => t.value !== 0);
    const nextTiles: TileAnim[] = [];

    // For each cell in the new board, figure out where it slid from
    // Simple approach: re-derive from board diff
    const nextBoard = result.board;
    const spawned: [number, number][] = [];

    // Find which cells are new (spawned after merge)
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        const nv = nextBoard[r][c];
        if (nv === 0) continue;

        // Find a prev tile that could have moved here
        const match = prevTiles.find(
          (pt) => pt.value === nv && pt.toRow === r && pt.toCol === c
        );

        if (match) {
          nextTiles.push({ ...match, toRow: r, toCol: c });
        } else {
          spawned.push([r, c]);
        }
      }
    }

    // Compute slide destinations per direction
    const slideMap = computeSlideMap(s.board, dir);

    // Rebuild tiles with correct from/to positions
    const animTiles: TileAnim[] = [];
    for (const [fromR, fromC, toR, toC, merged] of slideMap) {
      const src = prevTiles.find((pt) => pt.row === fromR && pt.col === fromC && pt.value === s.board[fromR][fromC]);
      if (!src) continue;
      animTiles.push({
        ...src,
        toRow: toR,
        toCol: toC,
        progress: 0,
        merged,
        pop: merged ? 0 : src.pop,
      });
    }

    // Add spawn animation for new tiles (after board update adds random)
    s.board = addRandom(nextBoard);
    s.score += result.score;
    if (s.score > s.best) s.best = s.score;

    // Find the newly spawned tile
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        if (nextBoard[r][c] === 0 && s.board[r][c] !== 0) {
          animTiles.push({ value: s.board[r][c], row: r, col: c, toRow: r, toCol: c, progress: 1, spawn: 0, pop: 0, merged: false, id: nextId++ });
        }
      }
    }

    // Merged tiles pop
    for (const tile of animTiles) {
      if (tile.merged) tile.pop = 1;
    }

    // Sync non-moving tiles
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        const v = nextBoard[r][c];
        if (v === 0) continue;
        const moved = animTiles.some((t) => t.toRow === r && t.toCol === c);
        if (!moved) {
          const existing = prevTiles.find((pt) => pt.row === r && pt.col === c);
          if (existing) animTiles.push({ ...existing, progress: 1 });
        }
      }
    }

    s.tiles = animTiles;
    s.won = hasWon(s.board);
    s.over = isGameOver(s.board);
    s.animating = true;

    setScore(s.score);
    setBest(s.best);
    setWon(s.won);
    setOver(s.over);

    startLoop();
  }, [startLoop]);

  // ── Keyboard ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const keyMap: Record<string, "left" | "right" | "up" | "down"> = {
      ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down",
      a: "left", d: "right", w: "up", s: "down",
    };

    function onKey(e: KeyboardEvent) {
      const dir = keyMap[e.key];
      if (!dir) return;
      // Only handle if canvas/container is focused or no input is focused
      const active = document.activeElement;
      if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) return;
      e.preventDefault();
      handleMove(dir);
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleMove]);

  // ── Touch / swipe ─────────────────────────────────────────────────────────────
  const touchRef = useRef<{ x: number; y: number } | null>(null);

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY };
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (!touchRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchRef.current.x;
    const dy = t.clientY - touchRef.current.y;
    touchRef.current = null;
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
    if (Math.abs(dx) > Math.abs(dy)) handleMove(dx > 0 ? "right" : "left");
    else handleMove(dy > 0 ? "down" : "up");
  }

  // ── Reset ─────────────────────────────────────────────────────────────────────
  function reset() {
    const s = stateRef.current;
    cancelAnimationFrame(s.raf);
    s.board = newGame();
    s.tiles = boardToTiles(s.board);
    s.score = 0;
    s.animating = false;
    s.won = false;
    s.over = false;
    setScore(0);
    setWon(false);
    setOver(false);
    draw();
  }

  return (
    <div
      className="md:col-span-1 border border-outline overflow-hidden relative flex flex-col min-h-[250px]"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-3 pt-3 pb-1">
        <span className="bg-primary/90 text-on-primary px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-widest">
          2048
        </span>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="bg-surface-container border border-outline px-2 py-1 font-mono text-[9px] text-on-surface-variant text-center">
              <div className="text-[8px] uppercase tracking-widest opacity-60">score</div>
              <div className="text-primary font-bold">{score}</div>
            </div>
            <div className="bg-surface-container border border-outline px-2 py-1 font-mono text-[9px] text-on-surface-variant text-center">
              <div className="text-[8px] uppercase tracking-widest opacity-60">best</div>
              <div className="text-accent-green font-bold">{best}</div>
            </div>
          </div>
          <button
            onClick={reset}
            className="border border-outline px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-on-surface-variant hover:border-primary hover:text-primary transition-all"
          >
            new
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="relative flex-1 min-h-0">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* Game over / win overlay */}
        {(over || won) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-20 gap-3">
            <p className="font-headline font-black text-2xl tracking-tighter" style={{ color: won ? "#00e5ff" : "#ff3b9a" }}>
              {won ? "2048!" : "game over"}
            </p>
            <button
              onClick={reset}
              className="border border-primary px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-primary hover:bg-primary hover:text-on-primary transition-all"
            >
              play again
            </button>
          </div>
        )}
      </div>

      <div className="px-3 pb-2 pt-1 font-mono text-[8px] text-on-surface-variant/40 tracking-widest">
        ARROWS / WASD / SWIPE
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function easeOut(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Returns [fromRow, fromCol, toRow, toCol, merged] for each non-zero tile that moves
function computeSlideMap(board: Board, dir: "left" | "right" | "up" | "down"): [number, number, number, number, boolean][] {
  const result: [number, number, number, number, boolean][] = [];

  const rotations = { left: 0, down: 1, right: 2, up: 3 };
  const n = rotations[dir];

  // Rotate board, compute moves in "left" space, rotate back
  let b = board;
  for (let i = 0; i < n; i++) b = rotate90(b);

  for (let r = 0; r < GRID; r++) {
    const row = b[r];
    const sources: number[] = row.map((_, i) => i).filter((i) => row[i] !== 0);
    let writePos = 0;
    let i = 0;
    while (i < sources.length) {
      const fromC = sources[i];
      if (i + 1 < sources.length && row[sources[i]] === row[sources[i + 1]]) {
        // merge
        const [fr, fc] = rotateBack([r, fromC], n);
        const [tr, tc] = rotateBack([r, writePos], n);
        result.push([fr, fc, tr, tc, true]);
        const [fr2, fc2] = rotateBack([r, sources[i + 1]], n);
        result.push([fr2, fc2, tr, tc, true]);
        i += 2;
      } else {
        const [fr, fc] = rotateBack([r, fromC], n);
        const [tr, tc] = rotateBack([r, writePos], n);
        result.push([fr, fc, tr, tc, false]);
        i++;
      }
      writePos++;
    }
  }

  return result;
}

function rotateBack([r, c]: [number, number], n: number): [number, number] {
  let pos: [number, number] = [r, c];
  for (let i = 0; i < (4 - n) % 4; i++) {
    const [pr, pc] = pos;
    pos = [pc, GRID - 1 - pr];
  }
  return pos;
}
