"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const SRC =
  "https://gwymehqkxnsurinrisdl.supabase.co/storage/v1/object/public/assets/profile.png";

const COLS = 7;
const ROWS = 9;
const TILES = Array.from({ length: COLS * ROWS }, (_, i) => ({
  col: i % COLS,
  row: Math.floor(i / COLS),
  delay: (i % COLS) * 38 + Math.floor(i / COLS) * 62,
}));

export function ProfilePixelator() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [initDone, setInitDone] = useState(false);
  const [hoverKey, setHoverKey] = useState(0);
  const [hovered, setHovered] = useState(false);

  // Dissolve-out on scroll into view (tiles start opaque, reveal image beneath)
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInitDone(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const onEnter = () => {
    setHoverKey((k) => k + 1); // force tile remount → animation restarts
    setHovered(true);
  };
  const onLeave = () => setHovered(false);

  return (
    <div
      ref={wrapRef}
      className="relative w-full h-full"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <Image
        loading="eager"
        alt="Profile picture"
        fill
        className="w-full h-full object-cover"
        src={SRC}
      />
      <div className="absolute inset-0 bg-primary/10 mix-blend-overlay pointer-events-none" />

      {/* Init reveal — tiles dissolve away to expose the image */}
      {!initDone && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${COLS}, 1fr)`,
            gridTemplateRows: `repeat(${ROWS}, 1fr)`,
          }}
        >
          {TILES.map(({ delay }, i) => (
            <div key={i} className="bg-surface" />
          ))}
        </div>
      )}

      {initDone && !hovered && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${COLS}, 1fr)`,
            gridTemplateRows: `repeat(${ROWS}, 1fr)`,
          }}
        >
          {TILES.map(({ delay }, i) => (
            <div
              key={i}
              className="bg-surface"
              style={{
                animation: `profile-cell-out 420ms cubic-bezier(0.34,1.56,0.64,1) ${180 + delay}ms both`,
              }}
            />
          ))}
        </div>
      )}

      {/* Hover — tiles cascade in over the image */}
      {hovered && (
        <div
          key={hoverKey}
          className="absolute inset-0 pointer-events-none"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${COLS}, 1fr)`,
            gridTemplateRows: `repeat(${ROWS}, 1fr)`,
          }}
        >
          {TILES.map(({ delay }, i) => (
            <div
              key={i}
              className="bg-surface"
              style={{
                animation: `cal-cell-in 420ms cubic-bezier(0.34,1.56,0.64,1) ${delay}ms both`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
