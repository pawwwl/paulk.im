"use client";

import { useEffect, useRef } from "react";

const PADDLE_H = 60;
const PADDLE_W = 10;
const PUCK_R = 7;
const BOT_SPEED = 3.8;

export function AirHockey() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const state = {
      puck: { x: 0, y: 0, vx: 2, vy: 1.5 },
      p1: { y: 0, score: 0 },
      p2: { y: 0, score: 0 },
      animId: 0,
    };

    const resize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      state.puck.x = canvas.width / 2;
      state.puck.y = canvas.height / 2;
      state.p1.y = canvas.height / 2;
      state.p2.y = canvas.height / 2;
    };
    resize();

    const reset = () => {
      const W = canvas.width;
      const H = canvas.height;
      state.puck.x = W / 2;
      state.puck.y = H / 2;
      const angle = (Math.random() * Math.PI) / 4 - Math.PI / 8;
      const dir = Math.random() > 0.5 ? 1 : -1;
      state.puck.vx = dir * 2 * Math.cos(angle);
      state.puck.vy = 2 * Math.sin(angle);
    };

    const clamp = (v: number, lo: number, hi: number) =>
      Math.max(lo, Math.min(hi, v));

    const botTrack = (py: number, target: number) => {
      if (py < target - 2) return py + Math.min(BOT_SPEED, target - py);
      if (py > target + 2) return py - Math.min(BOT_SPEED, py - target);
      return py;
    };

    const loop = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const W = canvas.width;
      const H = canvas.height;
      const p1x = PADDLE_W / 2 + 6;
      const p2x = W - PADDLE_W / 2 - 6;

      // Bot AI
      state.p1.y = clamp(
        botTrack(
          state.p1.y,
          state.puck.vx < 0 ? state.puck.y : H / 2,
        ),
        PADDLE_H / 2,
        H - PADDLE_H / 2,
      );
      state.p2.y = clamp(
        botTrack(
          state.p2.y,
          state.puck.vx > 0 ? state.puck.y : H / 2,
        ),
        PADDLE_H / 2,
        H - PADDLE_H / 2,
      );

      // Move puck
      state.puck.x += state.puck.vx;
      state.puck.y += state.puck.vy;

      // Top/bottom walls
      if (state.puck.y - PUCK_R < 0) {
        state.puck.y = PUCK_R;
        state.puck.vy = Math.abs(state.puck.vy);
      }
      if (state.puck.y + PUCK_R > H) {
        state.puck.y = H - PUCK_R;
        state.puck.vy = -Math.abs(state.puck.vy);
      }

      // P1 paddle collision
      if (
        state.puck.vx < 0 &&
        state.puck.x - PUCK_R <= p1x + PADDLE_W / 2 &&
        state.puck.x + PUCK_R >= p1x - PADDLE_W / 2 &&
        Math.abs(state.puck.y - state.p1.y) < PADDLE_H / 2 + PUCK_R
      ) {
        const deflect = (state.puck.y - state.p1.y) / (PADDLE_H / 2);
        state.puck.vx = Math.abs(state.puck.vx) * 1.04;
        state.puck.vy = deflect * 4.5;
        state.puck.x = p1x + PADDLE_W / 2 + PUCK_R + 1;
      }

      // P2 paddle collision
      if (
        state.puck.vx > 0 &&
        state.puck.x + PUCK_R >= p2x - PADDLE_W / 2 &&
        state.puck.x - PUCK_R <= p2x + PADDLE_W / 2 &&
        Math.abs(state.puck.y - state.p2.y) < PADDLE_H / 2 + PUCK_R
      ) {
        const deflect = (state.puck.y - state.p2.y) / (PADDLE_H / 2);
        state.puck.vx = -Math.abs(state.puck.vx) * 1.04;
        state.puck.vy = deflect * 4.5;
        state.puck.x = p2x - PADDLE_W / 2 - PUCK_R - 1;
      }

      // Speed cap
      const spd = Math.hypot(state.puck.vx, state.puck.vy);
      if (spd > 5) {
        state.puck.vx = (state.puck.vx / spd) * 5;
        state.puck.vy = (state.puck.vy / spd) * 5;
      }

      // Goals
      if (state.puck.x < 0) {
        state.p2.score++;
        reset();
      } else if (state.puck.x > W) {
        state.p1.score++;
        reset();
      }

      // ── Draw ──────────────────────────────────────────────
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, W, H);

      // Grid bg
      ctx.strokeStyle = "rgba(0,229,255,0.04)";
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      for (let x = 0; x < W; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += 24) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // Center line
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = "rgba(0,229,255,0.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(W / 2, 0);
      ctx.lineTo(W / 2, H);
      ctx.stroke();
      ctx.setLineDash([]);

      // Center circle
      ctx.strokeStyle = "rgba(0,229,255,0.12)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, 28, 0, Math.PI * 2);
      ctx.stroke();

      // P1 paddle (cyan)
      ctx.shadowColor = "#00E5FF";
      ctx.shadowBlur = 10;
      ctx.fillStyle = "#00E5FF";
      ctx.fillRect(
        p1x - PADDLE_W / 2,
        state.p1.y - PADDLE_H / 2,
        PADDLE_W,
        PADDLE_H,
      );

      // P2 paddle (pink)
      ctx.shadowColor = "#FF4081";
      ctx.shadowBlur = 10;
      ctx.fillStyle = "#FF4081";
      ctx.fillRect(
        p2x - PADDLE_W / 2,
        state.p2.y - PADDLE_H / 2,
        PADDLE_W,
        PADDLE_H,
      );

      // Puck
      ctx.shadowColor = "rgba(255,255,255,0.9)";
      ctx.shadowBlur = 14;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(state.puck.x, state.puck.y, PUCK_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Score
      ctx.font = "bold 16px monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(0,229,255,0.8)";
      ctx.fillText(String(state.p1.score), W / 2 - 22, 20);
      ctx.fillStyle = "rgba(100,120,130,0.5)";
      ctx.fillText(":", W / 2, 20);
      ctx.fillStyle = "rgba(255,64,129,0.8)";
      ctx.fillText(String(state.p2.score), W / 2 + 22, 20);

      state.animId = requestAnimationFrame(loop);
    };

    state.animId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(state.animId);
  }, []);

  return (
    <div
      ref={containerRef}
      className="bg-surface-container border border-outline relative overflow-hidden min-h-[250px]"
    >
      <div className="absolute top-2 left-3 z-10 pointer-events-none">
        <p className="text-primary text-[10px] uppercase tracking-widest font-bold font-mono">
          BOT_VS_BOT
        </p>
      </div>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
