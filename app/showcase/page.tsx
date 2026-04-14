"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { VIEWS } from "./views";

// Previews are authored for a 180×100 container. This hook measures the actual
// card width and returns the scale factor needed to fill it.
function usePreviewScale() {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / 180);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, scale };
}

export default function ShowcasePage() {
  const { ref: scaleRef, scale } = usePreviewScale();

  return (
    <div className="min-h-screen">
      <div
        className="flex gap-10 px-2 pb-4 overflow-x-auto flex-wrap"
        style={{ scrollbarWidth: "none" } as React.CSSProperties}
      >
        {VIEWS.map((view, i) => (
          <Link
            key={view.id}
            href={`/showcase/${view.id}`}
            className="flex flex-col gap-2 text-left active:scale-[0.98] transition-transform w-full sm:w-72 sm:shrink-0"
          >
            <div
              ref={i === 0 ? scaleRef : undefined}
              className="relative w-full rounded-md overflow-hidden aspect-[9/5]"
            >
              {/* Inner content always rendered at 180×100, scaled to fill container */}
              <div
                style={{
                  position: "absolute",
                  width: 180,
                  height: 100,
                  transformOrigin: "top left",
                  transform: `scale(${scale})`,
                }}
              >
                <div className="size-full [clip-path:inset(0_round_6px)]">
                  {view.preview}
                </div>
              </div>
              <div
                className="pointer-events-none absolute inset-0 rounded-md"
                style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)" }}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <span
                className="font-mono text-[10px] uppercase tracking-[0.22em]"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                {view.label}
              </span>
              <span
                className="font-mono text-[9px]"
                style={{ color: "rgba(255,255,255,0.25)" }}
              >
                {view.description}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
