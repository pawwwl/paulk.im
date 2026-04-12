"use client";
import { useEffect, useRef } from "react";

const COLS = 10;
const ROWS = 13;
const TOTAL = COLS * ROWS;
const RADIUS = 2; // tiles away from cursor that light up

export function ProfileWave() {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const tiles = Array.from(grid.children) as HTMLElement[];
    let rafId = -1;
    let prevActive = new Set<number>();

    const onMove = (e: MouseEvent) => {
      if (rafId !== -1) return;
      rafId = requestAnimationFrame(() => {
        rafId = -1;
        const rect = grid.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const curCol = Math.floor((x / rect.width) * COLS);
        const curRow = Math.floor((y / rect.height) * ROWS);

        const nextActive = new Set<number>();
        for (let r = -RADIUS; r <= RADIUS; r++) {
          for (let c = -RADIUS; c <= RADIUS; c++) {
            const dist = Math.sqrt(r * r + c * c);
            if (dist > RADIUS) continue;
            const col = curCol + c;
            const row = curRow + r;
            if (col < 0 || col >= COLS || row < 0 || row >= ROWS) continue;
            const idx = row * COLS + col;
            const delay = Math.round((dist / RADIUS) * 80);
            const tile = tiles[idx];
            if (tile) {
              tile.style.setProperty("--wd", `${delay}ms`);
              nextActive.add(idx);
            }
          }
        }

        // Add newly active
        for (const idx of nextActive) {
          if (!prevActive.has(idx)) tiles[idx]?.classList.add("profile-wave__tile--on");
        }
        // Remove no longer active
        for (const idx of prevActive) {
          if (!nextActive.has(idx)) tiles[idx]?.classList.remove("profile-wave__tile--on");
        }

        prevActive = nextActive;
      });
    };

    const onLeave = () => {
      if (rafId !== -1) { cancelAnimationFrame(rafId); rafId = -1; }
      for (const idx of prevActive) tiles[idx]?.classList.remove("profile-wave__tile--on");
      prevActive.clear();
    };

    const parent = grid.parentElement!;
    parent.addEventListener("mousemove", onMove, { passive: true });
    parent.addEventListener("mouseleave", onLeave);
    return () => {
      if (rafId !== -1) cancelAnimationFrame(rafId);
      parent.removeEventListener("mousemove", onMove);
      parent.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={gridRef}
      className="absolute inset-0 pointer-events-none"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${COLS}, 1fr)`,
        gridTemplateRows: `repeat(${ROWS}, 1fr)`,
      }}
    >
      {Array.from({ length: TOTAL }).map((_, i) => (
        <div key={i} className="profile-wave__tile" />
      ))}
    </div>
  );
}
