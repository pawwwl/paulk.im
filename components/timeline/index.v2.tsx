"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { TIME_LINE, SKILLS } from "@/lib/data";

const COLORS = ["#4D96D9", "#F4A020", "#E85D7A", "#5AAD6B"];
const MAX_radius = 220;

const TYPE_COLOR: Record<string, string> = {
  domain:    "#E85D7A",
  language:  "#5AAD6B",
  framework: "#4D96D9",
  database:  "#60A5FA",
  cloud:     "#A78BFA",
};

function splitDate(d: string) {
  const parts = d.split(" ");
  return parts.length === 2
    ? { month: parts[0].toUpperCase(), year: parts[1] }
    : { month: "", year: d };
}

// ── Skill sphere ──────────────────────────────────────────────────────────────
function SkillCloud({ size = 260 }: { size?: number }) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const rotRef      = useRef({ x: 0.3, y: 0 });
  const mousePosRef = useRef({ x: size / 2, y: size / 2 });
  const isDragging  = useRef(false);
  const lastMouse   = useRef({ x: 0, y: 0 });
  const rafRef      = useRef<number>(0);

  const positions = (() => {
    const n = SKILLS.length;
    const offset = 2 / n;
    const inc = Math.PI * (3 - Math.sqrt(5));
    return SKILLS.map((skill, i) => {
      const y = i * offset - 1 + offset / 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const phi = i * inc;
      return {
        x: Math.cos(phi) * r * 90,
        y: y * 90,
        z: Math.sin(phi) * r * 90,
        label: skill.label,
        color: TYPE_COLOR[skill.type] ?? "#ffffff",
      };
    });
  })();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const cx = size / 2, cy = size / 2;

    function animate() {
      ctx!.clearRect(0, 0, size, size);
      if (!isDragging.current) {
        const dx   = mousePosRef.current.x - cx;
        const dy   = mousePosRef.current.y - cy;
        const maxD = Math.sqrt(cx * cx + cy * cy);
        const speed = 0.003 + (Math.sqrt(dx * dx + dy * dy) / maxD) * 0.008;
        rotRef.current.y += (dx / size) * speed + 0.004;
        rotRef.current.x += (dy / size) * speed * 0.3;
      }
      const cosX = Math.cos(rotRef.current.x);
      const sinX = Math.sin(rotRef.current.x);
      const cosY = Math.cos(rotRef.current.y);
      const sinY = Math.sin(rotRef.current.y);
      const projected = positions.map(p => {
        const rx  = p.x * cosY - p.z * sinY;
        const rz  = p.x * sinY + p.z * cosY;
        const ry  = p.y * cosX + rz * sinX;
        const rz2 = rz * cosX - p.y * sinX;
        const scale   = (rz2 + 200) / 300;
        const opacity = Math.max(0.15, Math.min(1, (rz2 + 110) / 160));
        return { sx: cx + rx, sy: cy + ry, scale, opacity, label: p.label, color: p.color, rz: rz2 };
      });
      projected.sort((a, b) => a.rz - b.rz);
      projected.forEach(p => {
        const fontSize = Math.round(9 * p.scale + 1);
        ctx!.save();
        ctx!.globalAlpha  = p.opacity;
        ctx!.font         = `500 ${fontSize}px monospace`;
        ctx!.textAlign    = "center";
        ctx!.textBaseline = "middle";
        const tw      = ctx!.measureText(p.label).width;
        const padX    = 6 * p.scale;
        const padY    = 3 * p.scale;
        const rw      = tw + padX * 2;
        const rh      = fontSize + padY * 2;
        const rx      = p.sx - rw / 2;
        const ry      = p.sy - rh / 2;
        ctx!.beginPath();
        ctx!.roundRect(rx, ry, rw, rh, rh / 2);
        ctx!.strokeStyle = p.color;
        ctx!.lineWidth   = 0.8 * p.scale;
        ctx!.stroke();
        ctx!.fillStyle = p.color;
        ctx!.fillText(p.label, p.sx, p.sy);
        ctx!.restore();
      });
      rafRef.current = requestAnimationFrame(animate);
    }
    animate();
    return () => cancelAnimationFrame(rafRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ cursor: isDragging.current ? "grabbing" : "grab" }}
      onMouseMove={e => {
        const rect = canvasRef.current!.getBoundingClientRect();
        mousePosRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        if (isDragging.current) {
          rotRef.current.y += (e.clientX - lastMouse.current.x) * 0.005;
          rotRef.current.x += (e.clientY - lastMouse.current.y) * 0.005;
          lastMouse.current = { x: e.clientX, y: e.clientY };
        }
      }}
      onMouseDown={e => { isDragging.current = true; lastMouse.current = { x: e.clientX, y: e.clientY }; }}
      onMouseUp={()   => { isDragging.current = false; }}
      onMouseLeave={() => { isDragging.current = false; }}
    />
  );
}

// ── Timeline ──────────────────────────────────────────────────────────────────
export function TimelineSectionV2() {
  // Rotation angle lives purely in refs — RAF writes directly to DOM nodes so
  // we never trigger a React re-render at 60 fps.
  // activeId / autoRotate are the only React state; they change infrequently.
  const [autoRotate, setAutoRotate] = useState(true);
  const [activeId,   setActiveId]   = useState<number | null>(null);
  const [radius,     setRadius]     = useState(MAX_radius);
  const [, startTransition]         = useTransition();

  // Refs that mirror or extend state for use inside RAF / effect closures
  const radiusRef   = useRef(MAX_radius);
  const targetIdRef = useRef<number | null>(null); // set synchronously; React state follows via transition
  radiusRef.current = radius;

  useEffect(() => {
    function updateRadius() {
      const r = window.innerWidth < 640 ? 170 : MAX_radius;
      setRadius(r);
      radiusRef.current = r;
    }
    updateRadius();
    window.addEventListener("resize", updateRadius);
    return () => window.removeEventListener("resize", updateRadius);
  }, []);

  const sectionRef  = useRef<HTMLDivElement>(null);
  const rafRef      = useRef<number>(0);
  const lastRef     = useRef<number>(0);
  const rotAngleRef = useRef(0);
  const rotAnimRef  = useRef<number>(0);
  const lockedRef   = useRef(false);

  // DOM refs — RAF writes styles directly, never through React
  const ringRef  = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);

  const N          = TIME_LINE.length;
  const seg        = 360 / N;
  const colorStops = [
    ...TIME_LINE.map((_, i) => `${COLORS[i % COLORS.length]} ${(i * seg).toFixed(1)}deg`),
    `${COLORS[0]} 360deg`,
  ].join(", ");

  // Write rotation directly to the DOM — no setState, no re-render
  function applyRotation(angle: number) {
    const r   = radiusRef.current;
    const aid = targetIdRef.current;

    if (ringRef.current) {
      const from = (((angle - 90) % 360) + 360) % 360;
      ringRef.current.style.background =
        `conic-gradient(from ${from.toFixed(2)}deg, ${colorStops})`;
    }

    nodeRefs.current.forEach((el, i) => {
      if (!el) return;
      const angleDeg = ((i / N) * 360 + angle) % 360;
      const rad      = (angleDeg * Math.PI) / 180;
      const x        = r * Math.cos(rad);
      const y        = r * Math.sin(rad);
      const sinVal   = Math.sin(rad);
      const isActive = aid === i;
      const opacity  = isActive ? 1 : Math.max(0.35, 0.35 + 0.65 * ((1 + sinVal) / 2));
      const scale    = isActive ? 1 : Math.max(0.75, 0.75 + 0.25 * ((1 + sinVal) / 2));
      const zIndex   = isActive ? 200 : Math.round(50 + 50 * ((1 + Math.cos(rad)) / 2));
      el.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
      el.style.opacity   = String(opacity);
      el.style.zIndex    = String(zIndex);
    });
  }

  // Lerp to target angle — direct DOM, no setState
  const animateToAngle = (target: number) => {
    cancelAnimationFrame(rotAnimRef.current);
    function step() {
      const cur  = rotAngleRef.current;
      const diff = ((target - cur + 540) % 360) - 180;
      if (Math.abs(diff) < 0.25) {
        rotAngleRef.current = target % 360;
        applyRotation(target % 360);
        return;
      }
      const next = cur + diff * 0.12;
      rotAngleRef.current = next;
      applyRotation(next);
      rotAnimRef.current = requestAnimationFrame(step);
    }
    rotAnimRef.current = requestAnimationFrame(step);
  };

  // Auto-rotate loop — direct DOM
  useEffect(() => {
    if (!autoRotate) return;
    cancelAnimationFrame(rotAnimRef.current);
    function tick(now: number) {
      const dt = lastRef.current ? now - lastRef.current : 0;
      lastRef.current = now;
      const next = (rotAngleRef.current + dt * 0.018) % 360;
      rotAngleRef.current = next;
      applyRotation(next);
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRotate]);

  // ── Scroll-lock via IntersectionObserver ────────────────────────────────────
  // When the section fully enters the viewport: lock page scroll and smoothly
  // activate node 0. When the user scrolls again (wheel/touch) while locked:
  // release the lock and deactivate all nodes.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    function lock() {
      if (lockedRef.current) return;
      lockedRef.current = true;
      document.body.style.overflow = "hidden";
      // Damped rotation to node 0
      targetIdRef.current = 0;
      animateToAngle(270);
      setAutoRotate(false);
      startTransition(() => setActiveId(0));
    }

    function unlock() {
      if (!lockedRef.current) return;
      lockedRef.current = false;
      document.body.style.overflow = "";
      targetIdRef.current = null;
      setAutoRotate(true);
      startTransition(() => setActiveId(null));
    }

    function onWheel(e: WheelEvent) {
      if (lockedRef.current) {
        // Any scroll while locked releases it
        e.preventDefault();
        unlock();
      }
    }

    function onTouchMove() {
      if (lockedRef.current) unlock();
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          lock();
          window.addEventListener("wheel",     onWheel,     { passive: false });
          window.addEventListener("touchmove", onTouchMove, { passive: true  });
        } else {
          unlock();
          window.removeEventListener("wheel",     onWheel);
          window.removeEventListener("touchmove", onTouchMove);
        }
      },
      { threshold: 0.9 }
    );

    observer.observe(section);
    return () => {
      observer.disconnect();
      window.removeEventListener("wheel",     onWheel);
      window.removeEventListener("touchmove", onTouchMove);
      document.body.style.overflow = "";
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Prev / Next / node click ────────────────────────────────────────────────
  const goTo = (idx: number) => {
    targetIdRef.current = idx;
    animateToAngle(270 - (idx / N) * 360);
    setAutoRotate(false);
    startTransition(() => setActiveId(idx));
  };

  const prevNode = () => goTo(((targetIdRef.current ?? 0) - 1 + N) % N);
  const nextNode = () => goTo(((targetIdRef.current ?? -1) + 1) % N);

  const toggleNode = (i: number) => {
    if (targetIdRef.current === i) {
      targetIdRef.current = null;
      setAutoRotate(true);
      startTransition(() => setActiveId(null));
    } else {
      goTo(i);
    }
  };

  return (
    <div ref={sectionRef} className="h-screen flex flex-col items-center justify-center px-6">
      <div
        className="relative flex items-center justify-center"
        style={{ height: radius * 2 + 120 }}
        onClick={() => {
          if (targetIdRef.current !== null) {
            targetIdRef.current = null;
            setAutoRotate(true);
            startTransition(() => setActiveId(null));
          }
        }}
      >
        {/* Orbit ring — RAF writes background directly via ringRef */}
        <div
          ref={ringRef}
          className="absolute rounded-full flex items-center justify-center"
          style={{ width: radius * 2, height: radius * 2, opacity: 0.5 }}
        >
          <div className="rounded-full" style={{ width: radius * 2 - 3, height: radius * 2 - 3, background: "#0a0a0a" }} />
        </div>

        {/* Center — skill cloud or active item details */}
        <div
          className="absolute z-10 flex items-center justify-center transition-opacity duration-300"
          style={{ width: radius * 2 - 40, maxWidth: 260 }}
          onClick={e => e.stopPropagation()}
        >
          {activeId === null ? (
            <SkillCloud size={Math.min(260, radius * 2 - 40)} />
          ) : (() => {
            const item  = TIME_LINE[activeId];
            const color = COLORS[activeId % COLORS.length];
            return (
              <div className="w-full px-2 text-center">
                <div className="h-px w-8 mx-auto mb-3" style={{ background: color }} />
                <p className="font-headline font-bold text-sm text-white tracking-tight leading-snug mb-1">{item.name}</p>
                <p className="font-mono text-[10px] italic mb-3" style={{ color }}>{item.role}</p>
                <p className="font-mono text-[10px] text-white/60 leading-relaxed">{item.description}</p>
                {item.tools && (
                  <div className="mt-3 flex flex-wrap gap-1 justify-center">
                    {item.tools.map(t => (
                      <span key={t} className="px-1.5 py-0.5 font-mono text-[9px] border" style={{ color, borderColor: `${color}40` }}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Nodes — outer div is RAF-owned (no style prop); inner div is React-owned */}
        {TIME_LINE.map((item, i) => {
          const color    = COLORS[i % COLORS.length];
          const isActive = activeId === i;
          const { month, year } = splitDate(item.date);
          return (
            <div
              key={i}
              ref={el => { nodeRefs.current[i] = el; }}
              className="absolute cursor-pointer"
              onClick={e => { e.stopPropagation(); toggleNode(i); }}
            >
              <div
                className="w-16 h-16 rounded-full border-2 flex flex-col items-center justify-center transition-all duration-300"
                style={{
                  borderColor:     color,
                  backgroundColor: isActive ? color : "rgba(0,0,0,0.6)",
                  boxShadow:       isActive ? `0 0 18px ${color}80` : "none",
                  transform:       isActive ? "scale(1.35)" : "scale(1)",
                }}
              >
                <span className="font-mono text-[8px] tracking-[0.15em] leading-none" style={{ color: isActive ? "#000" : `${color}99` }}>{month}</span>
                <span className="font-headline text-sm font-light leading-tight"       style={{ color: isActive ? "#000" : color }}>{year}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Prev / Next navigation */}
      <div className="flex items-center gap-6 mt-8">
        <button
          className="px-4 py-1.5 font-mono text-[11px] tracking-widest border border-white/20 text-white/50 hover:text-white hover:border-white/50 transition-colors disabled:opacity-20 disabled:pointer-events-none"
          onClick={prevNode}
          disabled={activeId === null}
        >
          ← prev
        </button>

        {/* Node index indicator */}
        <span className="font-mono text-[10px] text-white/30 tabular-nums w-12 text-center">
          {activeId !== null ? `${String(activeId + 1).padStart(2, "0")} / ${String(N).padStart(2, "0")}` : ""}
        </span>

        <button
          className="px-4 py-1.5 font-mono text-[11px] tracking-widest border border-white/20 text-white/50 hover:text-white hover:border-white/50 transition-colors disabled:opacity-20 disabled:pointer-events-none"
          onClick={nextNode}
          disabled={activeId === null}
        >
          next →
        </button>
      </div>
    </div>
  );
}
