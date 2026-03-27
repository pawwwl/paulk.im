"use client";

import { useEffect, useRef, useState } from "react";

export function DrawingCanvas() {
  const [started, setStarted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const getPos = (
    e: MouseEvent | TouchEvent,
    canvas: HTMLCanvasElement,
  ): { x: number; y: number } => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  useEffect(() => {
    if (!started) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    const startDrawing = (e: MouseEvent | TouchEvent) => {
      isDrawing.current = true;
      lastPoint.current = getPos(e, canvas);
    };

    const draw = (e: MouseEvent | TouchEvent) => {
      if (!isDrawing.current || !lastPoint.current) return;
      e.preventDefault();
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const pos = getPos(e, canvas);
      ctx.beginPath();
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = "rgba(0,229,255,0.85)";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      lastPoint.current = pos;
    };

    const stopDrawing = () => {
      isDrawing.current = false;
      lastPoint.current = null;
    };

    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseleave", stopDrawing);
    canvas.addEventListener("touchstart", startDrawing, { passive: false });
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", stopDrawing);

    return () => {
      canvas.removeEventListener("mousedown", startDrawing);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", stopDrawing);
      canvas.removeEventListener("mouseleave", stopDrawing);
      canvas.removeEventListener("touchstart", startDrawing);
      canvas.removeEventListener("touchmove", draw);
      canvas.removeEventListener("touchend", stopDrawing);
    };
  }, [started]);

  return (
    <div
      ref={containerRef}
      className="bg-surface-container border border-outline relative rounded-none overflow-hidden min-h-[250px]"
    >
      {!started ? (
        <button
          onClick={() => setStarted(true)}
          className="absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-3 group cursor-pointer"
        >
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(0,229,255,0.12) 1px, transparent 1px)",
              backgroundSize: "18px 18px",
            }}
          />
          <p className="relative z-10 text-primary text-[10px] uppercase tracking-widest font-bold font-mono">
            CANVAS
          </p>
          <p className="relative z-10 text-on-surface-variant font-mono text-sm group-hover:text-on-surface transition-colors">
            tap to draw
          </p>
        </button>
      ) : (
        <>
          <canvas ref={canvasRef} className="w-full h-full block" />
          <button
            onClick={() => {
              const canvas = canvasRef.current;
              const ctx = canvas?.getContext("2d");
              if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
            }}
            className="absolute bottom-3 right-3 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-on-surface border border-outline hover:border-primary/50 transition-colors bg-surface-container/80"
          >
            clear
          </button>
        </>
      )}
    </div>
  );
}
