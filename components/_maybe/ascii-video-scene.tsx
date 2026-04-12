"use client";

import { useEffect, useRef, useState } from "react";

const DENSITY =
  " .`'^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";
const FONT_SIZE = 10;
const SPIN_CHARS = ".,-~:;=!*#$@";

function drawDonut(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  A: number,
  B: number,
) {
  const cols = Math.floor(canvas.width / FONT_SIZE);
  const rows = Math.floor(canvas.height / FONT_SIZE);
  const buf = new Array<string>(cols * rows).fill(" ");
  const zbuf = new Float32Array(cols * rows);
  const sinA = Math.sin(A),
    cosA = Math.cos(A);
  const sinB = Math.sin(B),
    cosB = Math.cos(B);
  const scale = Math.min(cols, rows) * 0.4;

  for (let j = 0; j < Math.PI * 2; j += 0.06) {
    const cosJ = Math.cos(j),
      sinJ = Math.sin(j);
    for (let i = 0; i < Math.PI * 2; i += 0.02) {
      const sinI = Math.sin(i),
        cosI = Math.cos(i);
      const h = cosJ + 2;
      const D = 1 / (sinI * h * sinA + sinJ * cosA + 5);
      const t = sinI * h * cosA - sinJ * sinA;
      const xp = Math.floor(
        cols / 2 + scale * D * (cosI * h * cosB - t * sinB),
      );
      const yp = Math.floor(
        rows / 2 + scale * D * (cosI * h * sinB + t * cosB),
      );
      const N = Math.floor(
        8 *
          ((sinJ * sinA - sinI * cosJ * cosA) * cosB -
            sinI * cosJ * sinA -
            sinJ * cosA -
            cosI * cosJ * sinB),
      );
      const o = xp + cols * yp;
      if (yp >= 0 && yp < rows && xp >= 0 && xp < cols && D > zbuf[o]) {
        zbuf[o] = D;
        buf[o] = SPIN_CHARS[Math.max(0, Math.min(N, SPIN_CHARS.length - 1))];
      }
    }
  }

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ff3b9a";
  ctx.font = `${FONT_SIZE}px monospace`;
  ctx.textBaseline = "top";
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const ch = buf[row * cols + col];
      if (ch !== " ") ctx.fillText(ch, col * FONT_SIZE, row * FONT_SIZE);
    }
  }
}

function rotateCubePoint(
  px: number,
  py: number,
  pz: number,
  sinA: number,
  cosA: number,
  sinB: number,
  cosB: number,
): [number, number, number] {
  const ry1 = py * cosA - pz * sinA;
  const rz1 = py * sinA + pz * cosA;
  const rx2 = px * cosB + rz1 * sinB;
  const ry2 = ry1;
  const rz2 = -px * sinB + rz1 * cosB;
  return [rx2, ry2, rz2];
}

function drawCube(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  A: number,
  B: number,
) {
  const cols = Math.floor(canvas.width / FONT_SIZE);
  const rows = Math.floor(canvas.height / FONT_SIZE);
  const buf = new Array<string>(cols * rows).fill(" ");
  const zbuf = new Float32Array(cols * rows).fill(-Infinity);
  const sinA = Math.sin(A),
    cosA = Math.cos(A);
  const sinB = Math.sin(B),
    cosB = Math.cos(B);
  const scale = Math.min(cols, rows) * 0.35;

  const faces: Array<{
    n: [number, number, number];
    u: [number, number, number];
    v: [number, number, number];
  }> = [
    { n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] },
    { n: [0, 0, -1], u: [-1, 0, 0], v: [0, 1, 0] },
    { n: [1, 0, 0], u: [0, 0, -1], v: [0, 1, 0] },
    { n: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0] },
    { n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, -1] },
    { n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1] },
  ];

  const lx = 0.6 / Math.sqrt(1.61),
    ly = 0.8 / Math.sqrt(1.61),
    lz = -0.5 / Math.sqrt(1.61);

  for (const face of faces) {
    const [rnx, rny, rnz] = rotateCubePoint(
      face.n[0],
      face.n[1],
      face.n[2],
      sinA,
      cosA,
      sinB,
      cosB,
    );
    const L = rnx * lx + rny * ly + rnz * lz;
    if (L <= 0) continue;
    const ch =
      SPIN_CHARS[
        Math.min(Math.floor(L * (SPIN_CHARS.length - 1)), SPIN_CHARS.length - 1)
      ];

    for (let ui = -1; ui <= 1; ui += 0.025) {
      for (let vi = -1; vi <= 1; vi += 0.025) {
        const px = face.n[0] + ui * face.u[0] + vi * face.v[0];
        const py = face.n[1] + ui * face.u[1] + vi * face.v[1];
        const pz = face.n[2] + ui * face.u[2] + vi * face.v[2];
        const [rx, ry, rz] = rotateCubePoint(
          px,
          py,
          pz,
          sinA,
          cosA,
          sinB,
          cosB,
        );
        const z = rz + 5;
        if (z <= 0) continue;
        const D = 1 / z;
        const xp = Math.floor(cols / 2 + scale * D * rx);
        const yp = Math.floor(rows / 2 - scale * D * ry);
        if (xp < 0 || xp >= cols || yp < 0 || yp >= rows) continue;
        const o = yp * cols + xp;
        if (D > zbuf[o]) {
          zbuf[o] = D;
          buf[o] = ch;
        }
      }
    }
  }

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ff3b9a";
  ctx.font = `${FONT_SIZE}px monospace`;
  ctx.textBaseline = "top";
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const ch = buf[row * cols + col];
      if (ch !== " ") ctx.fillText(ch, col * FONT_SIZE, row * FONT_SIZE);
    }
  }
}

function drawMatrix(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  drops: number[],
) {
  const cols = Math.floor(canvas.width / FONT_SIZE);
  const rows = Math.floor(canvas.height / FONT_SIZE);

  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ff3b9a";
  ctx.font = `${FONT_SIZE}px monospace`;
  ctx.textBaseline = "top";

  for (let col = 0; col < drops.length && col < cols; col++) {
    const row = drops[col];
    if (row >= 0 && row < rows) {
      ctx.fillText(
        DENSITY[Math.floor(Math.random() * DENSITY.length)],
        col * FONT_SIZE,
        row * FONT_SIZE,
      );
    }
    drops[col]++;
    if (drops[col] > rows + 10 && Math.random() > 0.97) {
      drops[col] = Math.floor(Math.random() * -20);
    }
  }
}

type AnimType = "donut" | "cube" | "matrix";

export function AsciiVideoScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number | null>(null);
  const [status, setStatus] = useState<
    "idle" | "loading" | "running" | "denied"
  >("idle");
  const animTypeRef = useRef<AnimType>(
    (["donut", "cube", "matrix"] as AnimType[])[Math.floor(Math.random() * 3)],
  );
  const animStateRef = useRef({
    A: 0,
    B: 0,
    drops: [] as number[],
    lastMatrix: 0,
  });

  const stop = () => {
    const video = videoRef.current!;
    const stream = video.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    video.srcObject = null;
    setStatus("idle");
  };

  const start = async () => {
    setStatus("loading");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      setStatus("running");
    } catch {
      setStatus("denied");
    }
  };

  // Idle / denied animation
  useEffect(() => {
    if (status !== "idle" && status !== "denied") return;

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const type = animTypeRef.current;
    const state = animStateRef.current;

    if (type === "matrix" && state.drops.length === 0) {
      const cols = Math.floor(canvas.width / FONT_SIZE);
      state.drops = Array.from({ length: cols }, () =>
        Math.floor(Math.random() * -30),
      );
    }

    const animate = (ts: number) => {
      if (type === "donut") {
        drawDonut(ctx, canvas, state.A, state.B);
        state.A += 0.07;
        state.B += 0.03;
      } else if (type === "cube") {
        drawCube(ctx, canvas, state.A, state.B);
        state.A += 0.04;
        state.B += 0.017;
      } else {
        if (ts - state.lastMatrix > 60) {
          drawMatrix(ctx, canvas, state.drops);
          state.lastMatrix = ts;
        }
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [status]);

  // Camera animation
  useEffect(() => {
    if (status !== "running") return;

    const canvas = canvasRef.current!;
    const video = videoRef.current!;
    const ctx = canvas.getContext("2d")!;

    const offscreen = document.createElement("canvas");
    const offCtx = offscreen.getContext("2d")!;

    const draw = () => {
      if (video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      const cols = Math.floor(canvas.width / FONT_SIZE);
      const rows = Math.floor(canvas.height / FONT_SIZE);

      offscreen.width = cols;
      offscreen.height = rows;

      offCtx.save();
      offCtx.translate(cols, 0);
      offCtx.scale(-1, 1);
      offCtx.drawImage(video, 0, 0, cols, rows);
      offCtx.restore();

      const { data } = offCtx.getImageData(0, 0, cols, rows);

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ff3b9a";
      ctx.font = `${FONT_SIZE}px monospace`;
      ctx.textBaseline = "top";

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const idx = (row * cols + col) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          const charIdx = Math.floor(brightness * (DENSITY.length - 1));
          ctx.fillText(DENSITY[charIdx], col * FONT_SIZE, row * FONT_SIZE);
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      const stream = video.srcObject as MediaStream | null;
      stream?.getTracks().forEach((t) => t.stop());
      video.srcObject = null;
    };
  }, [status]);

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      <video ref={videoRef} className="hidden" playsInline muted />
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        width={640}
        height={480}
      />

      {status === "idle" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <button
            onClick={start}
            className="font-mono text-[11px] uppercase tracking-[0.2em] text-black bg-accent-pink px-6 py-3 hover:bg-accent-green transition-colors"
          >
            enable_camera
          </button>
          <span className="font-mono text-[10px] text-accent-pink/50 tracking-widest uppercase">
            webcam required
          </span>
        </div>
      )}

      {status === "running" && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
          <button
            onClick={stop}
            className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent-pink border border-accent-pink/40 px-4 py-2 hover:border-accent-pink hover:bg-accent-pink/10 transition-colors"
          >
            disable_camera
          </button>
        </div>
      )}

      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-[11px] text-accent-pink tracking-widest uppercase animate-pulse">
            initializing_camera...
          </span>
        </div>
      )}

      {status === "denied" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <span className="font-mono text-[11px] text-red-400 tracking-widest uppercase">
            camera_access_denied
          </span>
          <button
            onClick={start}
            className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent-pink border border-accent-pink/40 px-4 py-2 hover:border-accent-pink transition-colors"
          >
            retry
          </button>
        </div>
      )}
    </div>
  );
}
