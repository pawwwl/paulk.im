"use client";
import { useEffect, useRef } from "react";

const COLS = 20;
const ROWS = 13;
const TOTAL = COLS * ROWS;
const TILES = Array.from({ length: TOTAL }, (_, i) => i);

export function DotGrid() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const tiles = Array.from(container.children) as HTMLElement[];
    let activeIdx = -1;
    let rafId = -1;

    const onMove = (e: MouseEvent) => {
      if (rafId !== -1) return; // already scheduled for this frame
      rafId = requestAnimationFrame(() => {
        rafId = -1;
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
          if (activeIdx >= 0) tiles[activeIdx]?.classList.remove("dot-tile--active");
          activeIdx = -1;
          return;
        }

        const col = Math.floor((x / rect.width) * COLS);
        const row = Math.floor((y / rect.height) * ROWS);
        const idx = Math.min(row * COLS + col, TOTAL - 1);

        if (idx === activeIdx) return;
        if (activeIdx >= 0) tiles[activeIdx]?.classList.remove("dot-tile--active");
        tiles[idx]?.classList.add("dot-tile--active");
        activeIdx = idx;
      });
    };

    const onLeave = () => {
      if (rafId !== -1) { cancelAnimationFrame(rafId); rafId = -1; }
      if (activeIdx >= 0) tiles[activeIdx]?.classList.remove("dot-tile--active");
      activeIdx = -1;
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave);
    return () => {
      if (rafId !== -1) cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0, opacity: 0.1 }}
    >
      <div ref={containerRef} className="dot-grid w-full h-full">
        {TILES.map((i) => (
          <div key={i} className="dot-tile" />
        ))}
      </div>
    </div>
  );
}
