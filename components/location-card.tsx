"use client";

import { useEffect, useRef, useState } from "react";
import { Icon_Location } from "./icons";
import Image from "next/image";

// Deterministic snowflakes — pre-calculated to avoid hydration mismatch
const SNOWFLAKES = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  left: `${(i * 43 + 3) % 100}%`,
  delay: `${((i * 137) % 600) / 100}s`,
  duration: `${6 + ((i * 97) % 500) / 100}s`,
  size: i % 5 === 0 ? 3 : i % 3 === 0 ? 2 : 1.5,
  opacity: 0.25 + ((i * 7) % 5) * 0.1,
  drift: (i % 2 === 0 ? 1 : -1) * (8 + (i % 4) * 5),
}));

export function LocationCard() {
  const [elevation, setElevation] = useState(0);
  const [showConditions, setShowConditions] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Elevation count-up
          const target = 5280;
          const duration = 2200;
          const startTime = performance.now();

          const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out expo
            const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            setElevation(Math.round(eased * target));
            if (progress < 1) {
              rafRef.current = requestAnimationFrame(animate);
            } else {
              // Reveal conditions line after elevation finishes
              setTimeout(() => setShowConditions(true), 300);
            }
          };
          rafRef.current = requestAnimationFrame(animate);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );

    if (cardRef.current) observer.observe(cardRef.current);
    return () => {
      observer.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className="md:col-span-2 bg-surface-container border border-outline overflow-hidden relative min-h-[250px]"
    >
      {/* Base mountain photo — very subtle */}
      <Image
        fill
        alt="Snowy Rocky Mountains"
        loading="eager"
        className="absolute inset-0 w-full h-full object-cover opacity-5 pointer-events-none"
        src="https://gwymehqkxnsurinrisdl.supabase.co/storage/v1/object/public/assets/location.png"
      />

      {/* Aurora glow — above peak line */}
      <div className="aurora-glow absolute inset-x-0 pointer-events-none" style={{ top: '20%', height: '35%' }} />

      {/* SVG Mountain layers */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Far range */}
        <svg
          className="mountain-layer-far absolute bottom-0 w-full"
          viewBox="0 0 1200 300"
          preserveAspectRatio="xMidYMax slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 0,300 L 0,175 Q 200,138 400,152 Q 600,112 800,122 Q 1000,106 1200,130 L 1200,300 Z"
            fill="rgba(0,229,255,0.03)"
          />
        </svg>

        {/* Mid range */}
        <svg
          className="mountain-layer-mid absolute bottom-0 w-full"
          viewBox="0 0 1200 300"
          preserveAspectRatio="xMidYMax slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 0,300 L 0,235 L 100,218 L 200,183 L 280,208 L 360,162 L 440,192 L 520,143 L 600,172 L 680,128 L 760,158 L 840,122 L 920,146 L 1000,132 L 1080,152 L 1200,142 L 1200,300 Z"
            fill="rgba(0,229,255,0.055)"
          />
        </svg>

        {/* Front range — iconic Denver skyline */}
        <svg
          className="mountain-layer-front absolute bottom-0 w-full"
          viewBox="0 0 1200 300"
          preserveAspectRatio="xMidYMax slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="peak-glow" x="-20%" y="-50%" width="140%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="snowcap" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
              <stop offset="60%" stopColor="rgba(180,220,230,0.12)" />
              <stop offset="100%" stopColor="rgba(0,229,255,0.06)" />
            </linearGradient>
          </defs>
          {/* Mountain body */}
          <path
            d="M 0,300 L 0,278 L 150,268 L 250,258 L 340,268 L 420,233 L 492,252 L 544,187 L 578,222 L 624,167 L 648,187 L 678,118 L 698,146 L 720,124 L 748,168 L 788,182 L 838,148 L 858,114 L 875,130 L 892,116 L 912,148 L 952,168 L 1002,160 L 1062,174 L 1122,162 L 1200,178 L 1200,300 Z"
            fill="url(#snowcap)"
            filter="url(#peak-glow)"
          />
          {/* Snow-cap highlights on tallest peaks */}
          <path
            d="M 668,126 L 678,118 L 688,124 L 698,146 L 720,124 L 732,138 L 720,124 L 698,146 L 688,124 Z"
            fill="rgba(255,255,255,0.6)"
          />
          <path
            d="M 850,120 L 858,114 L 866,120 L 875,130 L 884,122 L 892,116 L 900,124 L 892,116 L 875,130 L 866,120 Z"
            fill="rgba(255,255,255,0.5)"
          />
        </svg>
      </div>

      {/* Snow particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {SNOWFLAKES.map((flake) => (
          <div
            key={flake.id}
            className="absolute rounded-full bg-white"
            style={{
              left: flake.left,
              top: "-8px",
              width: `${flake.size}px`,
              height: `${flake.size}px`,
              opacity: flake.opacity,
              animationName: "snowfall",
              animationDuration: flake.duration,
              animationDelay: flake.delay,
              animationTimingFunction: "linear",
              animationIterationCount: "infinite",
              // CSS custom prop for drift — read in keyframes via @property isn't needed
              // We just bake drift into inline transform via a second animation
              ["--drift" as string]: `${flake.drift}px`,
            }}
          />
        ))}
      </div>

      {/* Topo-ring pulse — centered on icon */}
      <div
        className="absolute pointer-events-none z-10"
        style={{ left: "calc(2rem + 3rem)", top: "50%", transform: "translate(-50%, -50%)" }}
        aria-hidden="true"
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute rounded-full border border-primary/25"
            style={{
              width: "96px",
              height: "96px",
              top: "-48px",
              left: "-48px",
              animationName: "topo-ring",
              animationDuration: "3.5s",
              animationDelay: `${i * 1.15}s`,
              animationTimingFunction: "ease-out",
              animationIterationCount: "infinite",
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 p-8 py-12 h-full">
        <div className="flex-shrink-0 w-24 h-24 bg-primary/10 border border-primary/20 flex items-center justify-center text-primary relative">
          <Icon_Location />
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-[11px] text-primary font-bold uppercase font-mono tracking-tight">
            TIME_ZONE: MST
          </p>
          <h4 className="text-3xl font-headline font-black uppercase text-on-surface leading-none">
            DENVER_CO
          </h4>
          <p className="text-[11px] text-on-surface-variant font-mono uppercase tracking-widest mt-1">
            ELEV:{" "}
            <span className="text-primary tabular-nums">
              {elevation.toLocaleString()}
            </span>{" "}
            FT &nbsp;·&nbsp; MILE HIGH CITY
          </p>
          <p
            className="text-[10px] text-on-surface-variant/60 font-mono uppercase tracking-widest transition-opacity duration-700"
            style={{ opacity: showConditions ? 1 : 0 }}
          >
            39.7392° N, 104.9903° W &nbsp;·&nbsp; FRONT RANGE
          </p>
        </div>

        {/* Compass rose — decorative */}
        <div className="hidden md:flex ml-auto mr-4 flex-col items-center opacity-20">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="24" r="22" stroke="#00e5ff" strokeWidth="0.75" />
            <circle cx="24" cy="24" r="2.5" fill="#00e5ff" />
            {/* N */}
            <polygon points="24,4 21.5,24 26.5,24" fill="#00e5ff" />
            {/* S */}
            <polygon points="24,44 21.5,24 26.5,24" fill="#00e5ff" opacity="0.5" />
            {/* E */}
            <polygon points="44,24 24,21.5 24,26.5" fill="#00e5ff" opacity="0.5" />
            {/* W */}
            <polygon points="4,24 24,21.5 24,26.5" fill="#00e5ff" opacity="0.5" />
            <text x="23" y="14" fill="#00e5ff" fontSize="5" fontFamily="monospace" textAnchor="middle">N</text>
          </svg>
        </div>
      </div>
    </div>
  );
}
