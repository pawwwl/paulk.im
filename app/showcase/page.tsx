"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  GodlyMusic,
  GodlyClips,
  GodlyWeather,
  GodlyGifs,
  StaggeredGrid,
  DynamicFormBuilder,
  WordleGame,
} from "@/components/showcase";

// ── Views ─────────────────────────────────────────────────────────────────────

type ViewDef = {
  id: string;
  label: string;
  description: string;
  glowColor: string;
  preview: React.ReactNode;
  component: React.ReactNode;
};

// ── Glow card grid ────────────────────────────────────────────────────────────


const VIEWS: ViewDef[] = [
  {
    id: "music",
    label: "MUSIC",
    description: "Infinite album grid · drag to explore",
    glowColor: "#4D96D9",
    preview: (
      <div
        className="w-full h-full relative overflow-hidden"
        style={{ background: "#111" }}
      >
        {[
          ["#2d0050", "#4a007a"],
          ["#003050", "#005080"],
          ["#402800", "#704500"],
          ["#1a0040", "#320070"],
          ["#400010", "#700025"],
          ["#004010", "#007025"],
          ["#350030", "#600055"],
          ["#003535", "#005f5f"],
          ["#2d0050", "#4a007a"],
        ].map((g, i) => (
          <div
            key={i}
            className="absolute rounded-md"
            style={{
              width: 38,
              height: 38,
              left: (i % 3) * 44 + 8,
              top: Math.floor(i / 3) * 44 + 8,
              background: `linear-gradient(135deg, ${g[0]}, ${g[1]})`,
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          />
        ))}
      </div>
    ),
    component: <GodlyMusic />,
  },
  {
    id: "clips",
    label: "CLIPS",
    description: "Pexels video wall · infinite scroll",
    glowColor: "#e85d7a",
    preview: (
      <div
        className="w-full h-full relative overflow-hidden"
        style={{ background: "#111" }}
      >
        {[
          { x: 8, y: 8, w: 54, h: 36 },
          { x: 70, y: 8, w: 54, h: 52 },
          { x: 8, y: 52, w: 54, h: 28 },
          { x: 70, y: 68, w: 54, h: 28 },
          { x: 8, y: 88, w: 54, h: 36 },
          { x: 70, y: 104, w: 54, h: 28 },
        ].map((r, i) => (
          <div
            key={i}
            className="absolute rounded-md flex items-center justify-center"
            style={{
              left: r.x,
              top: r.y,
              width: r.w,
              height: r.h,
              background: `rgba(255,255,255,${0.08 + (i % 3) * 0.04})`,
              border: "1px solid rgba(255,255,255,0.14)",
            }}
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="rgba(255,255,255,0.45)"
            >
              <polygon points="2,1 9,5 2,9" />
            </svg>
          </div>
        ))}
      </div>
    ),
    component: <GodlyClips />,
  },
  {
    id: "weather",
    label: "WEATHER",
    description: "Live weather for 50 cities worldwide",
    glowColor: "#5aaff0",
    preview: (
      <div
        className="w-full h-full relative overflow-hidden"
        style={{ background: "#080f1a" }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 30%, rgba(30,100,220,0.55) 0%, transparent 70%)",
          }}
        />
        {[
          { x: 10, y: 12, w: 100, label: "New York  22°" },
          { x: 10, y: 34, w: 88, label: "London  15°" },
          { x: 10, y: 56, w: 96, label: "Tokyo  28°" },
          { x: 10, y: 78, w: 80, label: "Paris  18°" },
        ].map((r, i) => (
          <div
            key={i}
            className="absolute font-mono"
            style={{
              left: r.x,
              top: r.y,
              fontSize: 8,
              color: `rgba(255,255,255,${0.85 - i * 0.1})`,
              letterSpacing: "0.05em",
            }}
          >
            {r.label}
          </div>
        ))}
      </div>
    ),
    component: <GodlyWeather />,
  },
  // {
  //   id: "speech2led",
  //   label: "SPEECH2LED",
  //   description: "Voice to LED board · speech API",
  //   glowColor: "#5dff3b",
  //   preview: (
  //     <div
  //       className="w-full h-full relative overflow-hidden flex items-center justify-center"
  //       style={{ background: "#080808" }}
  //     >
  //       <div className="px-4 w-full">
  //         {[
  //           [1,0,1,0,1,0,0,0,1],
  //           [1,1,1,1,0,0,0,0,1],
  //           [1,0,1,0,1,0,0,0,1],
  //         ].map((row, r) => (
  //           <div key={r} className="flex justify-center gap-1.5 mb-1.5">
  //             {row.map((on, c) => (
  //               <div
  //                 key={c}
  //                 className="rounded-full"
  //                 style={{
  //                   width: 5,
  //                   height: 5,
  //                   background: on
  //                     ? `rgba(93,255,59,${0.5 + r * 0.15})`
  //                     : "rgba(255,255,255,0.07)",
  //                 }}
  //               />
  //             ))}
  //           </div>
  //         ))}
  //       </div>
  //       <div
  //         className="absolute inset-0"
  //         style={{
  //           background: "linear-gradient(to bottom, transparent 50%, #080808)",
  //         }}
  //       />
  //     </div>
  //   ),
  //   component: <Speech2Led />,
  // },
  {
    id: "gifs",
    label: "GIFS",
    description: "Trending GIFs · infinite canvas",
    glowColor: "#f4a020",
    preview: (
      <div
        className="w-full h-full relative overflow-hidden"
        style={{ background: "#111" }}
      >
        {[
          { x: 8, y: 8, w: 116, h: 48, c: "rgba(77,150,217,0.28)" },
          { x: 8, y: 64, w: 54, h: 48, c: "rgba(244,160,32,0.28)" },
          { x: 70, y: 64, w: 54, h: 48, c: "rgba(232,93,122,0.28)" },
          { x: 8, y: 120, w: 116, h: 36, c: "rgba(90,173,107,0.28)" },
        ].map((r, i) => (
          <div
            key={i}
            className="absolute rounded-md"
            style={{
              left: r.x,
              top: r.y,
              width: r.w,
              height: r.h,
              background: r.c,
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <div
              className="w-full h-0.5 mt-1"
              style={{ background: `rgba(255,255,255,${0.18 + i * 0.04})` }}
            />
          </div>
        ))}
      </div>
    ),
    component: <GodlyGifs />,
  },
  {
    id: "form-builder",
    label: "FORMS",
    description: "Dynamic form builder · IndexedDB storage",
    glowColor: "#4D96D9",
    preview: (
      <div
        className="w-full h-full relative overflow-hidden"
        style={{ background: "#131313" }}
      >
        {/* Mini sidebar */}
        <div
          className="absolute top-0 left-0 bottom-0"
          style={{
            width: 38,
            background: "#1a1a1a",
            borderRight: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: 6,
                top: 16 + i * 18,
                width: 26,
                height: 8,
                borderRadius: 3,
                background:
                  i === 0 ? "rgba(77,150,217,0.45)" : "rgba(255,255,255,0.1)",
                border: `1px solid ${i === 0 ? "rgba(77,150,217,0.55)" : "rgba(255,255,255,0.12)"}`,
              }}
            />
          ))}
        </div>
        {/* Mini field cards */}
        {[
          { y: 10, w: 80, color: "#4D96D9" },
          { y: 28, w: 66, color: "#F4A020" },
          { y: 46, w: 74, color: "#5AAD6B" },
          { y: 64, w: 58, color: "#E85D7A" },
        ].map((r, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: 46,
              top: r.y,
              width: r.w,
              height: 14,
              borderRadius: 4,
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.13)",
              display: "flex",
              alignItems: "center",
              gap: 4,
              paddingLeft: 4,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: 2,
                background: r.color + "88",
              }}
            />
            <div
              style={{
                flex: 1,
                height: 2,
                background: "rgba(255,255,255,0.22)",
                borderRadius: 1,
              }}
            />
          </div>
        ))}
      </div>
    ),
    component: <DynamicFormBuilder />,
  },
  {
    id: "wordle",
    label: "WORDLE",
    description: "Classic word game · animated reveals",
    glowColor: "#538d4e",
    preview: (
      <div
        className="w-full h-full relative overflow-hidden flex items-center justify-center"
        style={{ background: "#131313" }}
      >
        {/* Mini 3-row x 5-col board preview */}
        {[
          ["#4a4a4e","#c9af3b","#538d4e","#4a4a4e","#4a4a4e"],
          ["#538d4e","#538d4e","#4a4a4e","#c9af3b","#4a4a4e"],
          ["rgba(255,255,255,0.18)","rgba(255,255,255,0.18)","rgba(255,255,255,0.18)","rgba(255,255,255,0.18)","rgba(255,255,255,0.18)"],
        ].map((row, r) => (
          <div
            key={r}
            className="absolute flex gap-0.75"
            style={{ top: 18 + r * 22 }}
          >
            {row.map((color, c) => (
              <div
                key={c}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 2,
                  background: color,
                  border: `1px solid ${color.startsWith("rgba") ? "rgba(255,255,255,0.25)" : color}`,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    ),
    component: <WordleGame />,
  },
  {
    id: "mem-emoji",
    label: "MemEmoji",
    description: "Staggered tile reveal · click to toggle",
    glowColor: "#ec407a",
    preview: (
      <div
        className="w-full h-full relative overflow-hidden"
        style={{ background: "#0f0f0f" }}
      >
        {/* Mini gradient strip behind tiles */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgb(98,0,234), rgb(236,64,122))",
          }}
        />
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: (i % 6) * 22 + 4,
              top: Math.floor(i / 6) * 22 + 4,
              width: 20,
              height: 20,
              backgroundColor: "rgb(20,20,20)",
              opacity: i % 7 === 3 ? 0 : 0.82,
            }}
          />
        ))}
      </div>
    ),
    component: <StaggeredGrid />,
  },
];

// Three copies for a seamless marquee loop
const MARQUEE_ITEMS = [...VIEWS, ...VIEWS, ...VIEWS];

// ── Modal ─────────────────────────────────────────────────────────────────────

function ViewModal({
  view,
  onClose,
  onSwitch,
}: {
  view: ViewDef;
  onClose: () => void;
  onSwitch: (id: string) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  // Curtain: separate "shown" view from the incoming view so we can swap
  // under the curtain while it's opaque, then reveal.
  const [shownView, setShownView] = useState(view);
  const [curtainKey, setCurtainKey] = useState(0);
  const pendingRef = useRef(view);

  useEffect(() => {
    if (view.id === shownView.id) return;
    pendingRef.current = view;
    setCurtainKey((k) => k + 1);
    // Swap the displayed view at the midpoint of the curtain sweep (~130ms in)
    const t = setTimeout(() => setShownView(pendingRef.current), 130);
    return () => clearTimeout(t);
  }, [view.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-60 flex flex-col"
      style={{ backgroundColor: "#0e0e0e" }}
    >
      {/* Marquee nav */}
      <div
        className="shrink-0 h-12 border-b overflow-hidden flex items-center relative"
        style={{ borderColor: "rgba(255,255,255,0.1)" }}
      >
        <div
          ref={trackRef}
          className="flex items-center gap-10 whitespace-nowrap px-6"
          style={{ animation: "showcase-marquee 28s linear infinite" }}
          onMouseEnter={() => {
            if (trackRef.current)
              trackRef.current.style.animationPlayState = "paused";
          }}
          onMouseLeave={() => {
            if (trackRef.current)
              trackRef.current.style.animationPlayState = "running";
          }}
        >
          {MARQUEE_ITEMS.map((v, i) => {
            const isActive = view.id === v.id;
            return (
              <button
                key={i}
                onClick={() => onSwitch(v.id)}
                className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] px-3 py-1 border transition-all duration-150 shrink-0 cursor-pointer"
                style={{
                  color: isActive ? "#00e5ff" : "rgba(255,255,255,0.35)",
                  borderColor: isActive ? "#00e5ff" : "transparent",
                }}
              >
                {isActive && (
                  <span style={{ color: "#00e5ff", fontSize: 8 }}>▶</span>
                )}
                {v.label}
              </button>
            );
          })}
        </div>

        {/* Left fade + logo */}
        <div
          className="absolute left-0 top-0 h-full flex items-center pl-5 pr-16 pointer-events-none z-10"
          style={{
            background: "linear-gradient(to right, #0e0e0e 62%, transparent)",
          }}
        >
          <span className="font-mono font-bold text-primary tracking-widest text-xs uppercase pointer-events-auto">
            Pawwwl_
          </span>
        </div>

        {/* Right fade + close */}
        <div
          className="absolute right-0 top-0 h-full flex items-center justify-end pr-5 z-10 w-32"
          style={{
            background: "linear-gradient(to left, #0e0e0e 60%, transparent)",
          }}
        >
          <button
            onClick={onClose}
            className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest"
            style={{ color: "rgba(255,255,255,0.35)" }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.color =
                "rgba(255,255,255,0.7)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.color =
                "rgba(255,255,255,0.35)")
            }
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <line
                x1="1"
                y1="1"
                x2="10"
                y2="10"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <line
                x1="10"
                y1="1"
                x2="1"
                y2="10"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
            ESC
          </button>
        </div>
      </div>

      {/* View content */}
      <div className="flex-1 overflow-hidden">{shownView.component}</div>

      {/* Scan curtain — fixed overlay that sweeps down then off, hiding the swap */}
      <div
        key={curtainKey}
        className="pointer-events-none fixed inset-0"
        style={{
          zIndex: 65,
          background: "#0e0e0e",
          animation: "view-curtain 300ms ease-in-out both",
        }}
      />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function ShowcaseContent() {
  const router = useRouter();
  const params = useSearchParams();
  const activeId = params.get("view");
  const activeView = VIEWS.find((v) => v.id === activeId) ?? null;

  const setActiveId = (id: string | null) => {
    const url = id ? `?view=${id}` : "?";
    router.push(url);
  };

  return (
    <>
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <div>
        {/* Top bar with logo */}

        {/* Preview cards row */}
        <div
          className="flex gap-8 px-2 pb-4 overflow-x-auto flex-wrap"
          style={{ scrollbarWidth: "none" } as React.CSSProperties}
        >
          {VIEWS.map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveId(view.id)}
              className="shrink-0 flex flex-col gap-2 text-left cursor-pointer active:scale-[0.98] transition-transform"
              style={{ width: 180 }}
            >
              <div
                className="relative w-full rounded-md overflow-hidden"
                style={{ height: 100 }}
              >
                {/* Preview content */}
                <div className="size-full [clip-path:inset(0_round_6px)]">
                  {view.preview}
                </div>

                {/* Border */}
                <div
                  className="pointer-events-none absolute inset-0 rounded-md"
                  style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)" }}
                />
              </div>
              {/* Label */}
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
            </button>
          ))}
        </div>
      </div>

      {/* ── Background ───────────────────────────────────────────────────── */}
      <div className="w-screen h-screen" />

      {/* ── Modal ────────────────────────────────────────────────────────── */}
      {activeView && (
        <ViewModal
          view={activeView}
          onClose={() => setActiveId(null)}
          onSwitch={(id) => setActiveId(id)}
        />
      )}
    </>
  );
}

export default function ShowcasePage() {
  return (
    <Suspense>
      <ShowcaseContent />
    </Suspense>
  );
}
