"use client";

import { useEffect, useRef, useState } from "react";

const LOGO_SIZE = 72;
const HIT_DIST = 5;

const SAD_EMOJIS = ["😢", "😠", "😤", "😵", "🤬", "😖", "😣", "😩"];
const HAPPY_EMOJIS = ["😄", "🥳", "😂", "🎉", "😎", "🤩", "😇", "🙌"];
const CONFETTI_COLORS = ["#00E5FF", "#FF4081", "#69FF47", "#FFD600", "#E040FB", "#FF6D00"];

type Particle = {
  x: number; y: number; vx: number; vy: number;
  color: string; size: number; life: number; maxLife: number;
  rot: number; rotV: number;
};
type Point = { x: number; y: number };

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function closestPtOnSeg(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number,
) {
  const dx = bx - ax, dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 0.001) return { x: ax, y: ay };
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  return { x: ax + t * dx, y: ay + t * dy };
}

function redrawStrokes(canvas: HTMLCanvasElement, strokes: Point[][]) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const stroke of strokes) {
    if (stroke.length < 2) continue;
    ctx.beginPath();
    ctx.moveTo(stroke[0].x, stroke[0].y);
    for (let i = 1; i < stroke.length; i++) ctx.lineTo(stroke[i].x, stroke[i].y);
    ctx.stroke();
  }
}

export function DvdCornerEmoji() {
  const containerRef = useRef<HTMLDivElement>(null);
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const posRef = useRef({
    x: 40 + Math.random() * 120,
    y: 40 + Math.random() * 80,
    vx: (Math.random() > 0.5 ? 1 : -1) * 0.55,
    vy: (Math.random() > 0.5 ? 1 : -1) * 0.55,
  });
  const animRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const strokesRef = useRef<Point[][]>([]);
  const currentStrokeRef = useRef<Point[] | null>(null);

  const [pos, setPos] = useState({ x: posRef.current.x, y: posRef.current.y });
  const [emoji, setEmoji] = useState("🙂");
  const [color, setColor] = useState(CONFETTI_COLORS[0]);

  useEffect(() => {
    const container = containerRef.current;
    const confettiCanvas = confettiCanvasRef.current;
    const drawCanvas = drawCanvasRef.current;
    if (!container || !confettiCanvas || !drawCanvas) return;

    const syncDrawCanvas = () => {
      drawCanvas.width = container.clientWidth;
      drawCanvas.height = container.clientHeight;
      redrawStrokes(drawCanvas, strokesRef.current);
    };
    syncDrawCanvas();

    const ro = new ResizeObserver(syncDrawCanvas);
    ro.observe(container);

    const spawnConfetti = (cx: number, cy: number) => {
      for (let i = 0; i < 60; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 3.5;
        particlesRef.current.push({
          x: cx, y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2,
          color: randomFrom(CONFETTI_COLORS),
          size: 4 + Math.random() * 5,
          life: 1,
          maxLife: 80 + Math.random() * 60,
          rot: Math.random() * Math.PI * 2,
          rotV: (Math.random() - 0.5) * 0.2,
        });
      }
    };

    const fireCorner = (cx: number, cy: number) => {
      setColor(randomFrom(CONFETTI_COLORS));
      setEmoji(randomFrom(HAPPY_EMOJIS));
      spawnConfetti(cx, cy);
    };
    const loop = () => {
      const W = container.clientWidth;
      const H = container.clientHeight;
      confettiCanvas.width = W;
      confettiCanvas.height = H;
      const ctx = confettiCanvas.getContext("2d");
      if (!ctx) return;

      const p = posRef.current;
      p.x += p.vx;
      p.y += p.vy;

      let hitX = false, hitY = false;

      if (p.x <= 0) { p.x = 0; p.vx = Math.abs(p.vx); hitX = true; }
      else if (p.x + LOGO_SIZE >= W) { p.x = W - LOGO_SIZE; p.vx = -Math.abs(p.vx); hitX = true; }
      if (p.y <= 0) { p.y = 0; p.vy = Math.abs(p.vy); hitY = true; }
      else if (p.y + LOGO_SIZE >= H) { p.y = H - LOGO_SIZE; p.vy = -Math.abs(p.vy); hitY = true; }

      if (hitX || hitY) {
        if (hitX && hitY) {
          fireCorner(p.x + LOGO_SIZE / 2, p.y + LOGO_SIZE / 2);
        } else {
          setColor(randomFrom(CONFETTI_COLORS));
          setEmoji(randomFrom(SAD_EMOJIS));
        }
      }

      // Stroke collision
      const corners = [
        { x: p.x,             y: p.y },
        { x: p.x + LOGO_SIZE, y: p.y },
        { x: p.x,             y: p.y + LOGO_SIZE },
        { x: p.x + LOGO_SIZE, y: p.y + LOGO_SIZE },
      ];

      let hitStrokeIdx = -1;
      outer: for (let s = 0; s < strokesRef.current.length; s++) {
        const stroke = strokesRef.current[s];
        for (let i = 0; i < stroke.length - 1; i++) {
          const a = stroke[i], b = stroke[i + 1];
          const sdx = b.x - a.x, sdy = b.y - a.y;
          const sLen = Math.hypot(sdx, sdy);
          if (sLen < 1) continue;
          const nx = -sdy / sLen, ny = sdx / sLen;

          for (const corner of corners) {
            const closest = closestPtOnSeg(corner.x, corner.y, a.x, a.y, b.x, b.y);
            const dist = Math.hypot(corner.x - closest.x, corner.y - closest.y);
            if (dist < HIT_DIST) {
              const dot = p.vx * nx + p.vy * ny;
              p.vx -= 2 * dot * nx;
              p.vy -= 2 * dot * ny;
              p.x += nx * (HIT_DIST - dist);
              p.y += ny * (HIT_DIST - dist);
              hitStrokeIdx = s;
              break outer;
            }
          }
        }
      }

      if (hitStrokeIdx !== -1) {
        strokesRef.current = strokesRef.current.filter((_, i) => i !== hitStrokeIdx);
        const dc = drawCanvasRef.current;
        if (dc) redrawStrokes(dc, strokesRef.current);
        setColor(randomFrom(CONFETTI_COLORS));
        setEmoji(randomFrom(SAD_EMOJIS));
      }

      setPos({ x: p.x, y: p.y });

      // Draw confetti
      ctx.clearRect(0, 0, W, H);
      particlesRef.current = particlesRef.current.filter(pt => pt.life > 0);
      for (const pt of particlesRef.current) {
        pt.x += pt.vx; pt.y += pt.vy;
        pt.vy += 0.12; pt.vx *= 0.99;
        pt.rot += pt.rotV;
        pt.life -= 1 / pt.maxLife;
        ctx.save();
        ctx.globalAlpha = Math.max(0, pt.life);
        ctx.translate(pt.x, pt.y);
        ctx.rotate(pt.rot);
        ctx.fillStyle = pt.color;
        ctx.fillRect(-pt.size / 2, -pt.size / 2, pt.size, pt.size * 0.5);
        ctx.restore();
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(animRef.current); ro.disconnect(); };
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent): Point => {
    const rect = containerRef.current!.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    currentStrokeRef.current = [getPos(e)];
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!currentStrokeRef.current) return;
    e.preventDefault();
    const drawCanvas = drawCanvasRef.current;
    if (!drawCanvas) return;
    const pt = getPos(e);
    const stroke = currentStrokeRef.current;
    const ctx = drawCanvas.getContext("2d");
    if (ctx && stroke.length > 0) {
      const last = stroke[stroke.length - 1];
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
    }
    stroke.push(pt);
  };

  const handlePointerUp = () => {
    if (!currentStrokeRef.current) return;
    if (currentStrokeRef.current.length > 1) {
      strokesRef.current = [...strokesRef.current, currentStrokeRef.current];
    }
    currentStrokeRef.current = null;
  };

  const clearDrawing = () => {
    strokesRef.current = [];
    const drawCanvas = drawCanvasRef.current;
    if (drawCanvas) drawCanvas.getContext("2d")?.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
  };

  return (
    <div
      ref={containerRef}
onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
      className="relative bg-surface-container border border-outline overflow-hidden min-h-[250px] select-none cursor-crosshair"
    >
      {/* persistent stroke layer */}
      <canvas ref={drawCanvasRef} className="absolute inset-0 pointer-events-none" />

      {/* confetti layer */}
      <canvas ref={confettiCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* bouncing emoji box */}
      <div
        className="absolute pointer-events-none flex items-center justify-center"
        style={{ left: pos.x, top: pos.y, width: LOGO_SIZE, height: LOGO_SIZE, backgroundColor: color }}
      >
        <span style={{ fontSize: 40, lineHeight: 1 }}>{emoji}</span>
      </div>

    </div>
  );
}
