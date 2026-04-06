"use client";

import { useEffect, useRef } from "react";

function buildRingPath(
  cx: number,
  cy: number,
  R: number,
  w: number,
  amp: number,
  freq: number,
  phase: number,
): string {
  const steps = 180;
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * Math.PI * 2;
    const r = R + amp * Math.sin(freq * theta + phase);
    const cmd = i === 0 ? "M" : "L";
    pts.push(
      `${cmd} ${(cx + r * Math.cos(theta)).toFixed(1)},${(cy + r * Math.sin(theta)).toFixed(1)}`,
    );
  }
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

const CX = 120;
const CY = 120;

const RINGS = [
  { R: 100, w: 12, speed: 0.0005, color: "#E85D7A", opacity: 0.55, phaseOffset: 0 },
  { R:  78, w:  9, speed: 0.0008, color: "#4D96D9", opacity: 0.55, phaseOffset: Math.PI / 3 },
  { R:  56, w:  8, speed: 0.0011, color: "#F4A020", opacity: 0.55, phaseOffset: Math.PI * 0.8 },
  { R:  34, w:  6, speed: 0.0015, color: "#5AAD6B", opacity: 0.55, phaseOffset: Math.PI / 6 },
];

const AMP_RANGE  = [4,  400] as const;
const FREQ_RANGE = [2,  50] as const;
const CHANGE_INTERVAL_MS = [800, 3000] as const;
const MAX_AT_EXTREME = 2;

// Boundaries for "upper" and "lower" zones (top/bottom 30% of each range)
const HIGH_AMP  = AMP_RANGE[0]  + (AMP_RANGE[1]  - AMP_RANGE[0])  * 0.7;
const LOW_AMP   = AMP_RANGE[0]  + (AMP_RANGE[1]  - AMP_RANGE[0])  * 0.3;
const HIGH_FREQ = FREQ_RANGE[0] + (FREQ_RANGE[1] - FREQ_RANGE[0]) * 0.7;
const LOW_FREQ  = FREQ_RANGE[0] + (FREQ_RANGE[1] - FREQ_RANGE[0]) * 0.3;

function randBetween(lo: number, hi: number) {
  return lo + Math.random() * (hi - lo);
}

type RingState = {
  amp: number; targetAmp: number;
  freq: number; targetFreq: number;
  nextChangeAt: number;
};

function isHigh(s: RingState) { return s.targetAmp >= HIGH_AMP  && s.targetFreq >= HIGH_FREQ; }
function isLow(s: RingState)  { return s.targetAmp <= LOW_AMP   && s.targetFreq <= LOW_FREQ; }

function pickTarget(states: RingState[], i: number) {
  const others = states.filter((_, j) => j !== i);
  const canGoHigh = others.filter(isHigh).length < MAX_AT_EXTREME;
  const canGoLow  = others.filter(isLow).length  < MAX_AT_EXTREME;
  return {
    targetAmp:  randBetween(canGoLow ? AMP_RANGE[0]  : LOW_AMP,   canGoHigh ? AMP_RANGE[1]  : HIGH_AMP),
    targetFreq: randBetween(canGoLow ? FREQ_RANGE[0] : LOW_FREQ,  canGoHigh ? FREQ_RANGE[1] : HIGH_FREQ),
  };
}

export function WaveTick() {
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const rafRef = useRef<number>(0);
  const ringStates = useRef<RingState[]>(
    RINGS.map(() => {
      const amp  = randBetween(...AMP_RANGE);
      const freq = randBetween(...FREQ_RANGE);
      return { amp, targetAmp: amp, freq, targetFreq: freq, nextChangeAt: 0 };
    }),
  );

  useEffect(() => {
    function tick(now: number) {
      RINGS.forEach((ring, i) => {
        const el = pathRefs.current[i];
        if (!el) return;

        const s = ringStates.current[i];

        // Pick new random targets on interval (constrained by threshold rules)
        if (now >= s.nextChangeAt) {
          const { targetAmp, targetFreq } = pickTarget(ringStates.current, i);
          s.targetAmp  = targetAmp;
          s.targetFreq = targetFreq;
          s.nextChangeAt = now + randBetween(...CHANGE_INTERVAL_MS);
        }

        // Lerp toward targets
        s.amp  += (s.targetAmp  - s.amp)  * 0.03;
        s.freq += (s.targetFreq - s.freq) * 0.03;

        const phase = (now * ring.speed + ring.phaseOffset) % (Math.PI * 2);
        el.setAttribute(
          "d",
          buildRingPath(CX, CY, ring.R, ring.w, s.amp, s.freq, phase),
        );
      });
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div
      className="relative border border-outline overflow-hidden flex items-center justify-center"
    >
      <svg viewBox="0 0 240 240" width="100%" height="100%">
        {RINGS.map((ring, i) => (
          <path
            key={i}
            ref={(el) => {
              pathRefs.current[i] = el;
            }}
            fill={ring.color}
            fillOpacity={ring.opacity}
            fillRule="nonzero"
          />
        ))}
      </svg>
    </div>
  );
}
