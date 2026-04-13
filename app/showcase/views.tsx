"use client";

import {
  GodlyMusic,
  GodlyClips,
  GodlyWeather,
  GodlyGifs,
  StaggeredGrid,
  DynamicFormBuilder,
  WordleGame,
} from "@/components/showcase";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ViewDef = {
  id: string;
  label: string;
  description: string;
  glowColor: string;
  preview: React.ReactNode;
  component: React.ReactNode;
};

// ── View definitions ──────────────────────────────────────────────────────────

export const VIEWS: ViewDef[] = [
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
          { x: 10, y: 12, label: "New York  22°" },
          { x: 10, y: 34, label: "London  15°" },
          { x: 10, y: 56, label: "Tokyo  28°" },
          { x: 10, y: 78, label: "Paris  18°" },
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

export const MARQUEE_ITEMS = [...VIEWS, ...VIEWS, ...VIEWS];
