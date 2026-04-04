"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TIME_LINE } from "@/lib/data";

// ── Config ────────────────────────────────────────────────────────────────────
// Each item gets its own accent color, cycling through the palette.
const COLORS = ["#4D96D9", "#F4A020", "#E85D7A", "#5AAD6B"];
const N = TIME_LINE.length;
const CONN_LEN = 0; // horizontal connector length in px (each side)

function splitDate(d: string) {
  const parts = d.split(" ");
  return parts.length === 2
    ? { month: parts[0].toUpperCase(), year: parts[1] }
    : { month: "", year: d };
}

// ── Component ─────────────────────────────────────────────────────────────────
export function TimelineSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rowRefs      = useRef<(HTMLDivElement | null)[]>(Array(N).fill(null));
  const drawnRef     = useRef(0);
  const npRef        = useRef<number[]>(Array(N).fill(0));

  const [svgW,         setSvgW]         = useState(0);
  const [svgH,         setSvgH]         = useState(0);
  const [nodeYs,       setNodeYs]       = useState<number[]>([]);
  const [drawn,        setDrawn]        = useState(0);
  const [nodeProgress, setNodeProgress] = useState<number[]>(Array(N).fill(0));

  // ── Measure ──
  const measure = useCallback(() => {
    const c = containerRef.current;
    if (!c) return;
    const cr = c.getBoundingClientRect();
    setSvgW(c.offsetWidth);
    setSvgH(c.scrollHeight);
    setNodeYs(
      rowRefs.current.map((el) => {
        if (!el) return 0;
        const r = el.getBoundingClientRect();
        return r.top + r.height / 2 - cr.top;
      }),
    );
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    return () => { cancelAnimationFrame(id); window.removeEventListener("resize", measure); };
  }, [measure]);

  // ── rAF scroll animation ──
  useEffect(() => {
    if (!nodeYs.length) return;
    const y0    = nodeYs[0];
    const yLast = nodeYs[N - 1];
    const tLen  = (yLast - y0) || 1;
    let rafId: number;

    function update() {
      const c = containerRef.current;
      if (!c) return;
      const { top, height } = c.getBoundingClientRect();
      const viewH = window.innerHeight;
      const prog  = Math.max(0, Math.min(1, (viewH - top) / height));

      const targetD = (tLen + 40) * prog;
      let nd = drawnRef.current + (targetD - drawnRef.current) * 0.12;
      if (Math.abs(targetD - nd) < 1) nd = targetD;
      drawnRef.current = nd;
      setDrawn(nd);

      let changed = false;
      nodeYs.forEach((ny, i) => {
        const dist   = drawnRef.current - (ny - y0);
        const target = Math.max(0, Math.min(1, dist / 40));
        let np = npRef.current[i] + (target - npRef.current[i]) * 0.12;
        if (Math.abs(target - np) < 0.005) np = target;
        if (Math.abs(np - npRef.current[i]) > 0.001) changed = true;
        npRef.current[i] = np;
      });
      if (changed) setNodeProgress([...npRef.current]);
      rafId = requestAnimationFrame(update);
    }
    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, [nodeYs]);

  // ── Derived geometry ──
  const cx     = svgW / 2;
  const y0     = nodeYs[0] ?? 0;
  const yLast  = nodeYs[N - 1] ?? svgH;
  const tLen   = Math.max(0, yLast - y0);
  const dashOff = tLen ? Math.max(0, tLen - drawn) : 9999;

  return (
    <div className="mx-auto my-60 max-w-2xl px-6 lg:px-8">
      <div ref={containerRef} className="relative">

        {/* ── SVG layer ──────────────────────────────────────────────────── */}
        {nodeYs.length > 0 && svgW > 0 && (
          <svg
            className="absolute inset-0 pointer-events-none z-0"
            width={svgW}
            height={svgH}
            style={{ overflow: "visible" }}
            aria-hidden
          >
            <defs>
              <filter id="dot-glow" x="-150%" y="-150%" width="400%" height="400%">
                <feGaussianBlur stdDeviation="3" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Ghost trunk */}
            <line x1={cx} y1={y0} x2={cx} y2={yLast}
              stroke="rgba(255,255,255,0.06)" strokeWidth={1} />

            {/* Animated trunk */}
            <line
              x1={cx} y1={y0} x2={cx} y2={yLast}
              stroke="rgba(255,255,255,0.18)" strokeWidth={1}
              strokeDasharray={tLen || 9999}
              strokeDashoffset={dashOff}
            />

            {/* Per-node graphics */}
            {TIME_LINE.map((_, i) => {
              const color   = COLORS[i % COLORS.length];
              const ny      = nodeYs[i] ?? 0;
              const np      = nodeProgress[i];
              // Connector starts drawing once node is 40% visible
              const cp      = Math.max(0, Math.min(1, (np - 0.4) / 0.6));
              // Even items: connector goes RIGHT; odd: LEFT
              const isRight = i % 2 === 0;
              const x1      = isRight ? cx + CONN_LEN : cx - CONN_LEN;

              return (
                <g key={i}>
                  {/* Ghost connector */}
                  <line x1={cx} y1={ny} x2={x1} y2={ny}
                    stroke={color} strokeWidth={1} opacity={0.08} />

                  {/* Animated connector */}
                  <line
                    x1={cx} y1={ny} x2={x1} y2={ny}
                    stroke={color} strokeWidth={1}
                    strokeDasharray={CONN_LEN}
                    strokeDashoffset={CONN_LEN * (1 - cp)}
                    opacity={np > 0.2 ? 1 : 0}
                  />

                  {/* Terminal dot on connector */}
                  <circle cx={x1} cy={ny} r={3.5}
                    fill={color}
                    opacity={cp > 0.85 ? 1 : 0}
                  />

                  {/* Outer ring — light gray */}
                  <circle cx={cx} cy={ny} r={22}
                    fill="none"
                    stroke="rgba(255,255,255,0.14)"
                    strokeWidth={1}
                    opacity={np}
                  />

                  {/* Inner ring — colored */}
                  <circle cx={cx} cy={ny} r={13}
                    fill="none"
                    stroke={color}
                    strokeWidth={1.5}
                    opacity={np}
                  />

                  {/* Centre dot — colored, glows when lit */}
                  <circle cx={cx} cy={ny} r={5}
                    fill={color}
                    opacity={np}
                    filter={np > 0.7 ? "url(#dot-glow)" : undefined}
                  />
                </g>
              );
            })}
          </svg>
        )}

        {/* ── Content rows ───────────────────────────────────────────────── */}
        <div className="flex flex-col">
          {TIME_LINE.map((item, i) => {
            const isRight = i % 2 === 0; // connector RIGHT → year LEFT, content RIGHT
            const color   = COLORS[i % COLORS.length];
            const np      = nodeProgress[i];
            const cp      = Math.max(0, Math.min(1, (np - 0.4) / 0.6));
            const { month, year } = splitDate(item.date);

            const yearEl = (
              <div style={{ color, opacity: np }}>
                <p className="text-[10px] font-mono tracking-[0.25em] opacity-60 mb-1">
                  {month}
                </p>
                <p className="text-5xl font-headline font-light tracking-widest leading-none">
                  {year}
                </p>
              </div>
            );

            const contentEl = (
              <div
                style={{
                  opacity:   cp,
                  transform: `translateY(${(1 - cp) * 8}px)`,
                }}
              >
                {/* Colored rule */}
                <div className="h-px w-10 mb-3" style={{ background: color }} />
                <p className="font-headline font-bold text-sm text-on-surface tracking-tight leading-snug mb-1">
                  {item.name}
                </p>
                <p className="font-mono text-[11px] italic text-accent-pink mb-2.5">
                  {item.role}
                </p>
                <p className="font-mono text-[11px] text-on-surface-variant leading-relaxed">
                  {item.description}
                </p>
                {item.tools && (
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {item.tools.map((t, ti) => (
                      <span
                        key={t}
                        className="px-1.5 py-0.5 font-mono text-[9px] border"
                        style={{
                          color,
                          borderColor: `${color}35`,
                          "--tl-ti": ti,
                        } as React.CSSProperties}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );

            return (
              <div
                key={i}
                ref={(el) => { rowRefs.current[i] = el; }}
                className="relative z-10 flex items-center py-10"
              >
                {/* Left column */}
                <div className="flex-1 flex justify-end pr-8">
                  {isRight ? yearEl : contentEl}
                </div>

                {/* Zero-width anchor at trunk x — SVG draws node here */}
                <div className="w-0 shrink-0" />

                {/* Right column */}
                <div className="flex-1 pl-8">
                  {isRight ? contentEl : yearEl}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
