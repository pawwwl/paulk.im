"use client";

import { useEffect, useRef, useState } from "react";

const DENSITY = " .`'^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";
const FONT_SIZE = 10;

export function AsciiVideoScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "running" | "denied">("idle");

  const stop = () => {
    const video = videoRef.current!;
    const stream = video.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    video.srcObject = null;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setStatus("idle");
  };

  const start = async () => {
    setStatus("loading");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      setStatus("running");
    } catch {
      setStatus("denied");
    }
  };

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

      // Draw video mirrored to offscreen at grid resolution
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
          // Perceived brightness
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
      <canvas ref={canvasRef} className="w-full h-full" width={640} height={480} />

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
