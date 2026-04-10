"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const TILE_SIZE = 100;
const STAGGER_MS = 50;

function getGridDims(clientWidth: number, clientHeight: number) {
  const size = clientWidth > 800 ? TILE_SIZE : 50;
  return {
    columns: Math.floor(clientWidth / size),
    rows: Math.floor(clientHeight / size),
  };
}

export function StaggeredGrid() {
  const [dims, setDims] = useState({ columns: 0, rows: 0 });
  const [toggled, setToggled] = useState(false);
  // Per-tile opacity: 0 or 1
  const [opacities, setOpacities] = useState<number[]>([]);
  const animRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const buildGrid = useCallback(() => {
    const { columns, rows } = getGridDims(
      document.body.clientWidth,
      document.body.clientHeight,
    );
    setDims({ columns, rows });
    setOpacities((prev) => {
      const total = columns * rows;
      // preserve toggled state value for new tiles
      if (prev.length === total) return prev;
      const val = prev[0] ?? 1;
      return Array(total).fill(val);
    });
  }, []);

  useEffect(() => {
    buildGrid();
    window.addEventListener("resize", buildGrid);
    return () => window.removeEventListener("resize", buildGrid);
  }, [buildGrid]);

  const handleTileClick = useCallback(
    (index: number) => {
      const next = !toggled;
      setToggled(next);

      const { columns, rows } = dims;
      const total = columns * rows;

      const fromCol = index % columns;
      const fromRow = Math.floor(index / columns);

      // Cancel any in-flight animations
      animRef.current.forEach(clearTimeout);
      animRef.current = [];

      const targetOpacity = next ? 0 : 1;

      for (let i = 0; i < total; i++) {
        const col = i % columns;
        const row = Math.floor(i / columns);
        const dist = Math.sqrt((col - fromCol) ** 2 + (row - fromRow) ** 2);
        const delay = dist * STAGGER_MS;

        const t = setTimeout(() => {
          setOpacities((prev) => {
            const next = [...prev];
            next[i] = targetOpacity;
            return next;
          });
        }, delay);

        animRef.current.push(t);
      }
    },
    [toggled, dims],
  );

  const { columns, rows } = dims;
  const total = columns * rows;

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Gradient is always present — tiles hide it, clicking reveals it */}
      <div
        className="absolute inset-0"
        style={{
          animation: "sg-bg-pan 10s linear infinite",
          background:
            "linear-gradient(to right, rgb(98,0,234), rgb(236,64,122), rgb(98,0,234))",
          backgroundSize: "200%",
        }}
      />

      {/* Tile grid */}
      <div
        className="absolute inset-0"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          zIndex: 2,
        }}
      >
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            onClick={() => handleTileClick(i)}
            className="relative cursor-pointer"
            style={{
              opacity: opacities[i] ?? 1,
              transition: "opacity 300ms ease",
            }}
          >
            <div
              className="absolute transition-colors duration-150"
              style={{
                inset: "0.5px",
                backgroundColor: "rgb(15,15,15)",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.backgroundColor =
                  "rgb(30,30,30)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.backgroundColor =
                  "rgb(15,15,15)")
              }
            />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes sg-bg-pan {
          from { background-position: 0% center; }
          to   { background-position: -200% center; }
        }
      `}</style>
    </div>
  );
}
