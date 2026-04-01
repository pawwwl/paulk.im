"use client";

import { useEffect, useRef } from "react";

const PADDLE_H = 60;
const PADDLE_W = 10;
const PUCK_R = 7;
const BOT_SPEED = 5;
const SPEED_CAP = 16;
const INIT_SPEED = 6;
const HIT_ACCEL = 1.09;
const SCORE_DELAY = 1600;

export function AirHockey() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const state = {
      puck: { x: 0, y: 0, vx: INIT_SPEED, vy: 3.5 },
      p1: { y: 0, score: 0 },
      p2: { y: 0, score: 0 },
      animId: 0,
      controlled: null as null | "p1" | "p2",
      mouseY: 0,
      scored: null as null | { winner: "p1" | "p2"; until: number },
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
      state.puck.vx = dir * INIT_SPEED * Math.cos(angle);
      state.puck.vy = INIT_SPEED * Math.sin(angle);
    };

    const clamp = (v: number, lo: number, hi: number) =>
      Math.max(lo, Math.min(hi, v));

    const botTrack = (py: number, target: number) => {
      if (py < target - 2) return py + Math.min(BOT_SPEED, target - py);
      if (py > target + 2) return py - Math.min(BOT_SPEED, py - target);
      return py;
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      state.mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
    };

    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const W = canvas.width;
      if (x < W / 2) {
        state.controlled = state.controlled === "p1" ? null : "p1";
      } else {
        state.controlled = state.controlled === "p2" ? null : "p2";
      }
      if (labelRef.current) {
        labelRef.current.textContent =
          state.controlled === "p1"
            ? "P1_HUMAN"
            : state.controlled === "p2"
              ? "P2_HUMAN"
              : "BOT_VS_BOT";
      }
    };

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("click", onClick);

    const loop = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const W = canvas.width;
      const H = canvas.height;
      const p1x = PADDLE_W / 2 + 6;
      const p2x = W - PADDLE_W / 2 - 6;
      const now = performance.now();

      // ── Score celebration freeze ──────────────────────────
      if (state.scored) {
        if (now < state.scored.until) {
          drawScene(ctx, W, H, p1x, p2x);
          drawScoreCelebration(ctx, W, H, state.scored.winner, state.scored.until - now);
          state.animId = requestAnimationFrame(loop);
          return;
        } else {
          state.scored = null;
          reset();
        }
      }

      // ── Paddle movement ───────────────────────────────────
      if (state.controlled === "p1") {
        state.p1.y = clamp(state.mouseY, PADDLE_H / 2, H - PADDLE_H / 2);
      } else {
        state.p1.y = clamp(
          botTrack(state.p1.y, state.puck.vx < 0 ? state.puck.y : H / 2),
          PADDLE_H / 2,
          H - PADDLE_H / 2,
        );
      }
      if (state.controlled === "p2") {
        state.p2.y = clamp(state.mouseY, PADDLE_H / 2, H - PADDLE_H / 2);
      } else {
        state.p2.y = clamp(
          botTrack(state.p2.y, state.puck.vx > 0 ? state.puck.y : H / 2),
          PADDLE_H / 2,
          H - PADDLE_H / 2,
        );
      }

      // ── Move puck ─────────────────────────────────────────
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
        state.puck.vx = Math.abs(state.puck.vx) * HIT_ACCEL;
        state.puck.vy = deflect * 6;
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
        state.puck.vx = -Math.abs(state.puck.vx) * HIT_ACCEL;
        state.puck.vy = deflect * 6;
        state.puck.x = p2x - PADDLE_W / 2 - PUCK_R - 1;
      }

      // Speed cap
      const spd = Math.hypot(state.puck.vx, state.puck.vy);
      if (spd > SPEED_CAP) {
        state.puck.vx = (state.puck.vx / spd) * SPEED_CAP;
        state.puck.vy = (state.puck.vy / spd) * SPEED_CAP;
      }

      // Goals
      if (state.puck.x < 0) {
        state.p2.score++;
        state.puck.vx = 0;
        state.puck.vy = 0;
        state.scored = { winner: "p2", until: now + SCORE_DELAY };
      } else if (state.puck.x > W) {
        state.p1.score++;
        state.puck.vx = 0;
        state.puck.vy = 0;
        state.scored = { winner: "p1", until: now + SCORE_DELAY };
      }

      drawScene(ctx, W, H, p1x, p2x);

      // Pick-a-side instruction
      if (state.controlled === null) {
        const pulse = 0.55 + 0.45 * Math.sin(now / 500);
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = `rgba(200,220,230,${pulse * 0.7})`;
        ctx.fillText("CLICK A SIDE TO PLAY", W / 2, H - 12);
      }

      state.animId = requestAnimationFrame(loop);
    };

    const drawScene = (
      ctx: CanvasRenderingContext2D,
      W: number,
      H: number,
      p1x: number,
      p2x: number,
    ) => {
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

      // Side tints
      if (state.controlled !== "p1") {
        ctx.fillStyle = "rgba(0,229,255,0.06)";
        ctx.fillRect(0, 0, W / 2, H);
      }
      if (state.controlled !== "p2") {
        ctx.fillStyle = "rgba(255,64,129,0.06)";
        ctx.fillRect(W / 2, 0, W / 2, H);
      }

      // P1 paddle (cyan)
      ctx.shadowColor = "#00E5FF";
      ctx.shadowBlur = state.controlled === "p1" ? 18 : 10;
      ctx.fillStyle = "#00E5FF";
      ctx.fillRect(
        p1x - PADDLE_W / 2,
        state.p1.y - PADDLE_H / 2,
        PADDLE_W,
        PADDLE_H,
      );

      // P2 paddle (pink)
      ctx.shadowColor = "#FF4081";
      ctx.shadowBlur = state.controlled === "p2" ? 18 : 10;
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
    };

    const drawScoreCelebration = (
      ctx: CanvasRenderingContext2D,
      W: number,
      H: number,
      winner: "p1" | "p2",
      msLeft: number,
    ) => {
      const t = msLeft / SCORE_DELAY; // 1→0 as time expires
      const fade = Math.min(1, t * 3); // fade in fast, hold, fade out at end
      const isP1 = winner === "p1";
      const color = isP1 ? "0,229,255" : "255,64,129";
      const label = isP1 ? "P1 SCORES" : "P2 SCORES";

      ctx.fillStyle = `rgba(${color},${0.08 * fade})`;
      ctx.fillRect(0, 0, W, H);

      ctx.shadowColor = `rgba(${color},0.9)`;
      ctx.shadowBlur = 24 * fade;
      ctx.font = `bold ${Math.round(22 * (1 + 0.15 * (1 - t)))}px monospace`;
      ctx.textAlign = "center";
      ctx.fillStyle = `rgba(${color},${fade})`;
      ctx.fillText(label, W / 2, H / 2);
      ctx.shadowBlur = 0;
    };

    state.animId = requestAnimationFrame(loop);

    const ro = new ResizeObserver(resize);
    ro.observe(container);

    return () => {
      cancelAnimationFrame(state.animId);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("click", onClick);
      ro.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="bg-surface-container border border-outline relative overflow-hidden min-h-[250px]"
    >
      <div className="absolute top-2 left-3 z-10 pointer-events-none">
        <p
          ref={labelRef}
          className="text-primary text-[10px] uppercase tracking-widest font-bold font-mono"
        >
          BOT_VS_BOT
        </p>
      </div>
      <canvas ref={canvasRef} className="w-full h-full block cursor-pointer" />
    </div>
  );
}
