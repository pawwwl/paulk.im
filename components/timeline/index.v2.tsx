"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { TIME_LINE, SKILLS } from "@/lib/data";
import { StripedPattern } from "@/components/striped-pattern";

const COLORS = ["#4D96D9", "#F4A020", "#E85D7A", "#5AAD6B"];
const MAX_radius = 220;

const TYPE_COLOR: Record<string, string> = {
  domain: "#E85D7A",
  language: "#5AAD6B",
  framework: "#4D96D9",
  database: "#60A5FA",
  cloud: "#A78BFA",
};

// ── Wavy ring path ────────────────────────────────────────────────────────────
// Builds a closed donut path: outer edge (clockwise) then inner edge (CCW)
// so the non-zero fill rule punches a hole, giving a ring shape.
// cx/cy are the center in the element's own coordinate space (i.e. = radius).
function buildRingPath(
  cx: number,
  cy: number,
  R: number, // nominal ring radius
  w: number, // ring thickness
  amp: number, // wave amplitude
  freq: number, // number of sine waves around the ring
  phase: number,
): string {
  const steps = 180;
  const pts: string[] = [];
  // Outer edge — clockwise
  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * Math.PI * 2;
    const r = R + amp * Math.sin(freq * theta + phase);
    const cmd = i === 0 ? "M" : "L";
    pts.push(
      `${cmd} ${(cx + r * Math.cos(theta)).toFixed(1)},${(cy + r * Math.sin(theta)).toFixed(1)}`,
    );
  }
  // Inner edge — counter-clockwise (creates hole under non-zero fill rule)
  for (let i = steps; i >= 0; i--) {
    const theta = (i / steps) * Math.PI * 2;
    const r = R - w + amp * Math.sin(freq * theta + phase + Math.PI * 0.6);
    pts.push(
      `L ${(cx + r * Math.cos(theta)).toFixed(1)},${(cy + r * Math.sin(theta)).toFixed(1)}`,
    );
  }
  pts.push("Z");
  return pts.join(" ");
}

function splitDate(d: string) {
  const parts = d.split(" ");
  return parts.length === 2
    ? { month: parts[0].toUpperCase(), year: parts[1] }
    : { month: "", year: d };
}

// ── Skill sphere ──────────────────────────────────────────────────────────────
function SkillCloud({ size = 260 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotRef = useRef({ x: 0.3, y: 0 });
  const mousePosRef = useRef({ x: size / 2, y: size / 2 });
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);

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
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const cx = size / 2,
      cy = size / 2;

    function animate() {
      ctx!.clearRect(0, 0, size, size);
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
      const projected = positions.map((p) => {
        const rx = p.x * cosY - p.z * sinY;
        const rz = p.x * sinY + p.z * cosY;
        const ry = p.y * cosX + rz * sinX;
        const rz2 = rz * cosX - p.y * sinX;
        const scale = (rz2 + 200) / 300;
        const opacity = Math.max(0.15, Math.min(1, (rz2 + 110) / 160));
        return {
          sx: cx + rx,
          sy: cy + ry,
          scale,
          opacity,
          label: p.label,
          color: p.color,
          rz: rz2,
        };
      });
      projected.sort((a, b) => a.rz - b.rz);
      projected.forEach((p) => {
        const fontSize = Math.round(9 * p.scale + 1);
        ctx!.save();
        ctx!.globalAlpha = p.opacity;
        ctx!.font = `500 ${fontSize}px monospace`;
        ctx!.textAlign = "center";
        ctx!.textBaseline = "middle";
        const tw = ctx!.measureText(p.label).width;
        const padX = 6 * p.scale;
        const padY = 3 * p.scale;
        const rw = tw + padX * 2;
        const rh = fontSize + padY * 2;
        const rx = p.sx - rw / 2;
        const ry = p.sy - rh / 2;
        ctx!.beginPath();
        ctx!.roundRect(rx, ry, rw, rh, rh / 2);
        ctx!.strokeStyle = p.color;
        ctx!.lineWidth = 0.8 * p.scale;
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
      onMouseMove={(e) => {
        const rect = canvasRef.current!.getBoundingClientRect();
        mousePosRef.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
        if (isDragging.current) {
          rotRef.current.y += (e.clientX - lastMouse.current.x) * 0.005;
          rotRef.current.x += (e.clientY - lastMouse.current.y) * 0.005;
          lastMouse.current = { x: e.clientX, y: e.clientY };
        }
      }}
      onMouseDown={(e) => {
        isDragging.current = true;
        lastMouse.current = { x: e.clientX, y: e.clientY };
      }}
      onMouseUp={() => {
        isDragging.current = false;
      }}
      onMouseLeave={() => {
        isDragging.current = false;
      }}
    />
  );
}

// ── Timeline ──────────────────────────────────────────────────────────────────
export function TimelineSectionV2() {
  // Rotation angle lives purely in refs — RAF writes directly to DOM nodes so
  // we never trigger a React re-render at 60 fps.
  // activeId / autoRotate are the only React state; they change infrequently.
  const [autoRotate, setAutoRotate] = useState(true);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [radius, setRadius] = useState(MAX_radius);
  const [, startTransition] = useTransition();

  // Refs that mirror or extend state for use inside RAF / effect closures
  const radiusRef = useRef(MAX_radius);
  const targetIdRef = useRef<number | null>(null); // set synchronously; React state follows via transition
  radiusRef.current = radius;

  useEffect(() => {
    function updateRadius() {
      const r = window.innerWidth < 640 ? 190 : MAX_radius;
      setRadius(r);
      radiusRef.current = r;
    }
    updateRadius();
    window.addEventListener("resize", updateRadius);
    return () => window.removeEventListener("resize", updateRadius);
  }, []);

  const rafRef = useRef<number>(0);
  const lastRef = useRef<number>(0);
  const rotAngleRef = useRef(0);
  const rotAnimRef = useRef<number>(0);
  const wavePhaseRef = useRef(0);
  const waveRafRef = useRef<number>(0);

  // DOM refs — RAF writes styles directly, never through React
  const ringRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);

  const N = TIME_LINE.length;
  const seg = 360 / N;
  const colorStops = [
    ...TIME_LINE.map(
      (_, i) => `${COLORS[i % COLORS.length]} ${(i * seg).toFixed(1)}deg`,
    ),
    `${COLORS[0]} 360deg`,
  ].join(", ");

  // Write rotation directly to the DOM — no setState, no re-render
  function applyRotation(angle: number) {
    const r = radiusRef.current;
    const aid = targetIdRef.current;

    if (ringRef.current) {
      const from = (((angle - 90) % 360) + 360) % 360;
      ringRef.current.style.background = `conic-gradient(from ${from.toFixed(2)}deg, ${colorStops})`;
    }

    nodeRefs.current.forEach((el, i) => {
      if (!el) return;
      const angleDeg = ((i / N) * 360 + angle) % 360;
      const rad = (angleDeg * Math.PI) / 180;
      const x = r * Math.cos(rad);
      const y = r * Math.sin(rad);
      const sinVal = Math.sin(rad);
      const isActive = aid === i;
      const opacity = isActive
        ? 1
        : Math.max(0.35, 0.35 + 0.65 * ((1 + sinVal) / 2));
      const scale = isActive
        ? 1
        : Math.max(0.75, 0.75 + 0.25 * ((1 + sinVal) / 2));
      const zIndex = isActive
        ? 200
        : Math.round(50 + 50 * ((1 + Math.cos(rad)) / 2));
      el.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
      el.style.opacity = String(opacity);
      el.style.zIndex = String(zIndex);
    });
  }

  // Lerp to target angle — direct DOM, no setState
  const animateToAngle = (target: number) => {
    cancelAnimationFrame(rotAnimRef.current);
    function step() {
      const cur = rotAngleRef.current;
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

  // ── Wave displacement loop ─────────────────────────────────────────────────
  // Runs independently of rotation so the ring ripples even when static.
  useEffect(() => {
    function waveTick(now: number) {
      wavePhaseRef.current = (now * 0.0008) % (Math.PI * 2);
      if (ringRef.current) {
        const r = radiusRef.current;
        ringRef.current.style.clipPath = `path('${buildRingPath(r, r, r, 1.5, 0.5, 6, wavePhaseRef.current)}')`;
      }
      waveRafRef.current = requestAnimationFrame(waveTick);
    }
    waveRafRef.current = requestAnimationFrame(waveTick);
    return () => cancelAnimationFrame(waveRafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Prev / Next / node click ────────────────────────────────────────────────
  const goTo = (idx: number) => {
    targetIdRef.current = idx;
    animateToAngle(270 - (idx / N) * 360);
    setAutoRotate(false);
    startTransition(() => setActiveId(idx));
  };

  const advance = () => {
    if (targetIdRef.current === null) {
      goTo(0);
    } else if (targetIdRef.current >= N - 1) {
      targetIdRef.current = null;
      setAutoRotate(true);
      startTransition(() => setActiveId(null));
    } else {
      goTo(targetIdRef.current + 1);
    }
  };

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
    <div className="h-screen flex flex-col items-center justify-center px-6">
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
        {/* Striped background — fades in behind the ring when a node is active */}
        <div
          className="absolute rounded-full overflow-hidden transition-opacity duration-500"
          style={{
            width: radius * 2,
            height: radius * 2,
            opacity: activeId !== null ? 1 : 0,
            color:
              activeId !== null
                ? COLORS[activeId % COLORS.length]
                : "transparent",
          }}
        >
          <StripedPattern width={12} height={12} className="opacity-10" />
        </div>

        {/* Orbit ring — conic gradient clipped to a wavy donut path by the wave loop */}
        <div
          ref={ringRef}
          className="absolute"
          style={{ width: radius * 2, height: radius * 2, opacity: 0.5 }}
        />

        {/* Center — skill cloud or active item details */}
        <div
          className="absolute z-10 flex items-center justify-center transition-opacity duration-300"
          style={{ width: radius * 2 - 40, maxWidth: 260 }}
          onClick={(e) => e.stopPropagation()}
        >
          {activeId === null ? (
            <SkillCloud size={Math.min(260, radius * 2 - 40)} />
          ) : (
            (() => {
              const item = TIME_LINE[activeId];
              const color = COLORS[activeId % COLORS.length];
              return (
                <div className="w-full px-2 text-center">
                  <div
                    className="h-px w-8 mx-auto mb-3"
                    style={{ background: color }}
                  />
                  <p className="font-headline font-bold text-sm text-white tracking-tight leading-snug mb-1">
                    {item.name}
                  </p>
                  <p
                    className="font-mono text-[10px] italic mb-3"
                    style={{ color }}
                  >
                    {item.role}
                  </p>
                  <p className="font-mono text-[10px] text-white/60 leading-relaxed">
                    {item.description}
                  </p>
                  {item.tools && (
                    <div className="mt-3 flex flex-wrap gap-1 justify-center">
                      {item.tools.map((t) => (
                        <span
                          key={t}
                          className="px-1.5 py-0.5 font-mono text-[9px] border"
                          style={{ color, borderColor: `${color}40` }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()
          )}
        </div>

        {/* Nodes — outer div is RAF-owned (no style prop); inner div is React-owned */}
        {TIME_LINE.map((item, i) => {
          const color = COLORS[i % COLORS.length];
          const isActive = activeId === i;
          const { month, year } = splitDate(item.date);
          return (
            <div
              key={i}
              ref={(el) => {
                nodeRefs.current[i] = el;
              }}
              className="absolute cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(i);
              }}
            >
              <div
                className="w-16 h-16 rounded-full border-2 flex flex-col items-center justify-center transition-all duration-300"
                style={{
                  borderColor: color,
                  backgroundColor: isActive ? color : "rgba(0,0,0,0.6)",
                  boxShadow: isActive ? `0 0 18px ${color}80` : "none",
                  transform: isActive ? "scale(1.35)" : "scale(1)",
                }}
              >
                <span
                  className="font-mono text-[8px] tracking-[0.15em] leading-none"
                  style={{ color: isActive ? "#000" : `${color}99` }}
                >
                  {month}
                </span>
                <span
                  className="font-headline text-sm font-light leading-tight"
                  style={{ color: isActive ? "#000" : color }}
                >
                  {year}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex items-center mt-8">
        <div className="relative inline-flex">
          <button
            className="relative px-8 py-3 font-mono text-xs tracking-widest border border-white/20 text-white/50 hover:text-white hover:border-white/50 transition-colors"
            onClick={advance}
          >
            {activeId === null
              ? "Timeline →"
              : activeId === N - 1
                ? "close ×"
                : "next →"}
          </button>
        </div>
      </div>
    </div>
  );
}
