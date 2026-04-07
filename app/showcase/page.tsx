"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { GodlyMusic, GodlyGifs, GodlyWeather } from "@/components/godly";
import { AsciiVideoLoader } from "./ascii-video-loader";

// ── Tags ──────────────────────────────────────────────────────────────────────

const TAGS = [
  { id: "music", label: "MUSIC" },
  { id: "gifs", label: "GIFS" },
  { id: "weather", label: "WEATHER" },
];

// Three copies → marquee animates -33.333% for a seamless loop
const MARQUEE_ITEMS = [...TAGS, ...TAGS, ...TAGS];

// ── Views ─────────────────────────────────────────────────────────────────────

function Placeholder({ label }: { label: string }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-background">
      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-on-surface-variant">
        {label}
      </span>
      <span className="font-mono text-[10px] text-outline">
        — coming soon —
      </span>
    </div>
  );
}

const VIEWS: Record<string, React.ReactNode> = {
  music: <GodlyMusic />,
  gifs: <GodlyGifs />,
  weather: <GodlyWeather />,
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ShowcasePage() {
  const [active, setActive] = useState("music");
  const trackRef = useRef<HTMLDivElement>(null);

  const pauseMarquee = () => {
    if (trackRef.current) trackRef.current.style.animationPlayState = "paused";
  };
  const resumeMarquee = () => {
    if (trackRef.current) trackRef.current.style.animationPlayState = "running";
  };

  return (
    <>
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 w-full z-50 h-12 border-b border-outline/20 overflow-hidden flex items-center"
        style={{ backgroundColor: "#0e0e0e" }}
      >
        {/* Scrolling tag track */}
        <div
          ref={trackRef}
          className="flex items-center gap-10 whitespace-nowrap px-6"
          style={{ animation: "showcase-marquee 28s linear infinite" }}
          onMouseEnter={pauseMarquee}
          onMouseLeave={resumeMarquee}
        >
          {MARQUEE_ITEMS.map((tag, i) => {
            const isActive = active === tag.id;
            return (
              <button
                key={i}
                onClick={() => setActive(tag.id)}
                className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] px-3 py-1 border transition-all duration-150 flex-shrink-0 cursor-pointer"
                style={{
                  color: isActive ? "#00e5ff" : "rgba(255,255,255,0.35)",
                  borderColor: isActive ? "#00e5ff" : "transparent",
                }}
              >
                {isActive && (
                  <span style={{ color: "#00e5ff", fontSize: 8 }}>▶</span>
                )}
                {tag.label}
              </button>
            );
          })}
        </div>

        {/* Logo overlay — sits on top of the marquee on the left */}
        <div
          className="absolute left-0 top-0 h-full flex items-center pl-5 pr-16 z-10 pointer-events-none"
          style={{
            background: "linear-gradient(to right, #0e0e0e 62%, transparent)",
          }}
        >
          <Link href="/" className="pointer-events-auto">
            <span className="font-mono font-bold text-primary tracking-widest text-xs uppercase">
              Pawwwl_
            </span>
          </Link>
        </div>

        {/* Right fade */}
        <div
          className="absolute right-0 top-0 h-full w-16 z-10 pointer-events-none"
          style={{
            background: "linear-gradient(to left, #0e0e0e, transparent)",
          }}
        />
      </nav>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="w-screen h-screen overflow-hidden pt-12">
        {VIEWS[active]}
      </div>
    </>
  );
}
