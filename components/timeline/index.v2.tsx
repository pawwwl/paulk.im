"use client";

import { useEffect, useRef, useState } from "react";
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
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const rotRef     = useRef({ x: 0.3, y: 0 });
  const mousePosRef = useRef({ x: size / 2, y: size / 2 });
  const isDragging = useRef(false);
  const lastMouse  = useRef({ x: 0, y: 0 });
  const rafRef     = useRef<number>(0);

  // Fibonacci sphere positions
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

      // Auto-rotate + mouse-influence when not dragging
      if (!isDragging.current) {
        const dx = mousePosRef.current.x - cx;
        const dy = mousePosRef.current.y - cy;
        const maxD = Math.sqrt(cx * cx + cy * cy);
        const speed = 0.003 + (Math.sqrt(dx * dx + dy * dy) / maxD) * 0.008;
        rotRef.current.y += (dx / size) * speed + 0.004;
        rotRef.current.x += (dy / size) * speed * 0.3;
      }

      const cosX = Math.cos(rotRef.current.x);
      const sinX = Math.sin(rotRef.current.x);
      const cosY = Math.cos(rotRef.current.y);
      const sinY = Math.sin(rotRef.current.y);

      // Project, sort back-to-front
      const projected = positions.map(p => {
        const rx = p.x * cosY - p.z * sinY;
        const rz = p.x * sinY + p.z * cosY;
        const ry = p.y * cosX + rz * sinX;
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
        const borderR = rh / 2;

        // Pill border
        ctx!.beginPath();
        ctx!.roundRect(rx, ry, rw, rh, borderR);
        ctx!.strokeStyle = p.color;
        ctx!.lineWidth   = 0.8 * p.scale;
        ctx!.stroke();

        // Label
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
      onMouseDown={e => {
        isDragging.current = true;
        lastMouse.current  = { x: e.clientX, y: e.clientY };
      }}
      onMouseUp={()    => { isDragging.current = false; }}
      onMouseLeave={()  => { isDragging.current = false; }}
    />
  );
}

// ── Timeline ──────────────────────────────────────────────────────────────────
export function TimelineSectionV2() {
  const [rotationAngle, setRotationAngle] = useState(0);
  const [autoRotate,    setAutoRotate]    = useState(true);
  const [activeId,      setActiveId]      = useState<number | null>(null);
  const radius = MAX_radius;
  const sectionRef    = useRef<HTMLDivElement>(null); // tall scroll container
  const containerRef  = useRef<HTMLDivElement>(null); // sticky inner content
  const rafRef        = useRef<number>(0);
  const lastRef       = useRef<number>(0);
  const scrollDriven   = useRef(false);
  const suppressScroll = useRef(false);
  const rotAngleRef    = useRef(0);   // shadows rotationAngle for RAF access
  const rotAnimRef     = useRef<number>(0);

  // Lerp rotationAngle to target along the shortest arc
  const animateToAngle = (target: number) => {
    cancelAnimationFrame(rotAnimRef.current);
    function step() {
      const cur  = rotAngleRef.current;
      const diff = ((target - cur + 540) % 360) - 180; // shortest path in [-180, 180]
      if (Math.abs(diff) < 0.25) {
        rotAngleRef.current = target % 360;
        setRotationAngle(target % 360);
        return;
      }
      const next = cur + diff * 0.12;
      rotAngleRef.current = next;
      setRotationAngle(next);
      rotAnimRef.current = requestAnimationFrame(step);
    }
    rotAnimRef.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    if (!autoRotate) return;
    cancelAnimationFrame(rotAnimRef.current);
    function tick(now: number) {
      const dt = lastRef.current ? now - lastRef.current : 0;
      lastRef.current = now;
      const next = (rotAngleRef.current + dt * 0.018) % 360;
      rotAngleRef.current = next;
      setRotationAngle(next);
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [autoRotate]);

  // ── Scroll-driven node activation ──────────────────────────────────────────
  // sectionRef is a tall container (N * 100vh). As the user scrolls through it,
  // the sticky inner div stays pinned and progress (0→1) drives node activation.
  useEffect(() => {
    const N = TIME_LINE.length;
    function onScroll() {
      if (suppressScroll.current) return;
      const el = sectionRef.current;
      if (!el) return;
      const { top, height } = el.getBoundingClientRect();
      const viewH    = window.innerHeight;
      // progress: 0 when section top reaches viewport top, 1 when section bottom reaches viewport top
      const scrollable = height - viewH;
      const progress   = scrollable > 0 ? Math.max(0, Math.min(1, -top / scrollable)) : 0;

      if (top > 0) {
        // Section not yet pinned — stay inactive
        scrollDriven.current = false;
        setActiveId(null);
        setAutoRotate(true);
        return;
      }

      if (progress >= 1) {
        // Scrolled past last node — reset
        scrollDriven.current = false;
        setActiveId(null);
        setAutoRotate(true);
        return;
      }

      const idx = Math.min(N - 1, Math.floor(progress * N));
      scrollDriven.current = true;
      setActiveId(prev => {
        if (prev === idx) return prev;
        animateToAngle(270 - (idx / N) * 360);
        return idx;
      });
      setAutoRotate(false);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleNode = (i: number) => {
    scrollDriven.current = false;
    if (activeId === i) {
      setActiveId(null);
      setAutoRotate(true);
    } else {
      const targetAngle = (i / TIME_LINE.length) * 360;
      animateToAngle(270 - targetAngle);
      setActiveId(i);
      setAutoRotate(false);

      const el = sectionRef.current;
      if (el) {
        const sectionTop = el.getBoundingClientRect().top + window.scrollY;
        const scrollable = el.offsetHeight - window.innerHeight;
        suppressScroll.current = true;
        window.scrollTo({ top: sectionTop + (i / TIME_LINE.length) * scrollable, behavior: "smooth" });
        window.addEventListener("scrollend", () => { suppressScroll.current = false; }, { once: true });
      }
    }
  };

  return (
    // Tall outer container — gives scroll travel space (N+1 screens)
    <div ref={sectionRef} style={{ height: `${TIME_LINE.length * 45 + 100}vh` }}>
      {/* Sticky inner — pins to viewport while user scrolls through outer */}
      <div
        ref={containerRef}
        className="sticky top-0 h-screen flex items-center justify-center px-6"
        onClick={() => { if (!scrollDriven.current) { setActiveId(null); setAutoRotate(true); } }}
      >
      <div
        className="relative flex items-center justify-center"
        style={{ height: radius * 2 + 120 }}
      >
        {/* Orbit ring — conic gradient between node colors, rotates with nodes */}
        {(() => {
          const from = (((rotationAngle - 90) % 360) + 360) % 360;
          const seg  = 360 / TIME_LINE.length;
          const stops = [
            ...TIME_LINE.map((_, i) => `${COLORS[i % COLORS.length]} ${(i * seg).toFixed(1)}deg`),
            `${COLORS[0]} 360deg`,
          ].join(", ");
          return (
            <div
              className="absolute rounded-full flex items-center justify-center"
              style={{ width: radius * 2, height: radius * 2, background: `conic-gradient(from ${from.toFixed(2)}deg, ${stops})`, opacity: 0.5 }}
            >
              {/* Inner circle punches a hole to create the ring */}
              <div className="rounded-full" style={{ width: radius * 2 - 3, height: radius * 2 - 3, background: "#0a0a0a" }} />
            </div>
          );
        })()}


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

        {/* Nodes */}
        {TIME_LINE.map((item, i) => {
          const color    = COLORS[i % COLORS.length];
          const angleDeg = ((i / TIME_LINE.length) * 360 + rotationAngle) % 360;
          const rad      = (angleDeg * Math.PI) / 180;
          const x        = radius * Math.cos(rad);
          const y        = radius * Math.sin(rad);
          const sinVal   = Math.sin(rad);
          const opacity  = Math.max(0.35, 0.35 + 0.65 * ((1 + sinVal) / 2));
          const scale    = Math.max(0.75, 0.75 + 0.25 * ((1 + sinVal) / 2));
          const zIndex   = Math.round(50 + 50 * ((1 + Math.cos(rad)) / 2));
          const isActive = activeId === i;
          const { month, year } = splitDate(item.date);

          return (
            <div
              key={i}
              className="absolute transition-[transform,opacity] duration-200 cursor-pointer"
              style={{
                transform: `translate(${x}px, ${y}px) scale(${isActive ? 1 : scale})`,
                opacity:    isActive ? 1 : opacity,
                zIndex:     isActive ? 200 : zIndex,
              }}
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
                <span className="font-headline text-sm font-light leading-tight" style={{ color: isActive ? "#000" : color }}>{year}</span>
              </div>

            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}
