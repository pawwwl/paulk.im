"use client";

import { useEffect, useRef } from "react";

// Two harmonics: amp*sin(freq*θ) + amp2*sin(freq2*θ)
// steps is a live parameter so rings morph between polygon and organic.
function buildRingPath(
  cx: number,
  cy: number,
  R: number,
  w: number,
  amp: number,
  freq: number,
  amp2: number,
  freq2: number,
  phase: number,
  steps: number,
): string {
  const n = Math.max(3, Math.round(steps));
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const theta = (i / n) * Math.PI * 2;
    const r =
      R +
      amp * Math.sin(freq * theta + phase) +
      amp2 * Math.sin(freq2 * theta + phase);
    const cmd = i === 0 ? "M" : "L";
    pts.push(
      `${cmd} ${(cx + r * Math.cos(theta)).toFixed(1)},${(cy + r * Math.sin(theta)).toFixed(1)}`,
    );
  }
  for (let i = n; i >= 0; i--) {
    const theta = (i / n) * Math.PI * 2;
    const r =
      R -
      w +
      amp * Math.sin(freq * theta + phase + Math.PI * 0.6) +
      amp2 * Math.sin(freq2 * theta + phase + Math.PI * 0.6);
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
  {
    R: 130,
    w: 12,
    speed: 0.0005,
    color: "#E85D7A",
    opacity: 0.55,
    phaseOffset: 0,
  },
  {
    R: 100,
    w: 9,
    speed: 0.0008,
    color: "#4D96D9",
    opacity: 0.55,
    phaseOffset: Math.PI / 3,
  },
  {
    R: 78,
    w: 8,
    speed: 0.0011,
    color: "#F4A020",
    opacity: 0.55,
    phaseOffset: Math.PI * 0.8,
  },
  {
    R: 56,
    w: 6,
    speed: 0.0015,
    color: "#5AAD6B",
    opacity: 0.55,
    phaseOffset: Math.PI / 6,
  },
  {
    R: 38,
    w: 6,
    speed: 0.002,
    color: "#00e5ff",
    opacity: 0.55,
    phaseOffset: Math.PI / 6,
  },
];

// Primary harmonic ranges (with high/low threshold detection)
const AMP_RANGE = [4, 100] as const;
const FREQ_RANGE = [2, 100] as const;

// Second harmonic — unconstrained, free to roam
const AMP2_RANGE = [0, 50] as const;
const FREQ2_RANGE = [1, 50] as const;

// Steps: 3 = triangle, 4 = square, … 180 = smooth
const STEPS_RANGE = [3, 180] as const;

const CHANGE_INTERVAL_MS = [800, 3000] as const;
const MAX_AT_EXTREME = 2;

function randBetween(lo: number, hi: number) {
  return lo + Math.random() * (hi - lo);
}

type RingState = {
  amp: number;
  targetAmp: number;
  freq: number;
  targetFreq: number;
  amp2: number;
  targetAmp2: number;
  freq2: number;
  targetFreq2: number;
  steps: number;
  targetSteps: number;
  nextChangeAt: number;
};

function isHigh(s: RingState) {
  const highAmp = AMP_RANGE[0] + (AMP_RANGE[1] - AMP_RANGE[0]) * 0.7;
  const highFreq = FREQ_RANGE[0] + (FREQ_RANGE[1] - FREQ_RANGE[0]) * 0.7;
  return s.targetAmp >= highAmp && s.targetFreq >= highFreq;
}
function isLow(s: RingState) {
  const lowAmp = AMP_RANGE[0] + (AMP_RANGE[1] - AMP_RANGE[0]) * 0.3;
  const lowFreq = FREQ_RANGE[0] + (FREQ_RANGE[1] - FREQ_RANGE[0]) * 0.3;
  return s.targetAmp <= lowAmp && s.targetFreq <= lowFreq;
}

function pickTarget(states: RingState[], i: number) {
  const highAmp = AMP_RANGE[0] + (AMP_RANGE[1] - AMP_RANGE[0]) * 0.7;
  const lowAmp = AMP_RANGE[0] + (AMP_RANGE[1] - AMP_RANGE[0]) * 0.3;
  const highFreq = FREQ_RANGE[0] + (FREQ_RANGE[1] - FREQ_RANGE[0]) * 0.7;
  const lowFreq = FREQ_RANGE[0] + (FREQ_RANGE[1] - FREQ_RANGE[0]) * 0.3;

  const others = states.filter((_, j) => j !== i);
  const canGoHigh = others.filter(isHigh).length < MAX_AT_EXTREME;
  const canGoLow = others.filter(isLow).length < MAX_AT_EXTREME;

  return {
    targetAmp: randBetween(
      canGoLow ? AMP_RANGE[0] : lowAmp,
      canGoHigh ? AMP_RANGE[1] : highAmp,
    ),
    targetFreq: randBetween(
      canGoLow ? FREQ_RANGE[0] : lowFreq,
      canGoHigh ? FREQ_RANGE[1] : highFreq,
    ),
    // Second harmonic and steps are unconstrained
    targetAmp2: randBetween(...AMP2_RANGE),
    targetFreq2: randBetween(...FREQ2_RANGE),
    targetSteps: randBetween(...STEPS_RANGE),
  };
}

function makeRingState(): RingState {
  const amp = randBetween(...AMP_RANGE);
  const freq = randBetween(...FREQ_RANGE);
  const amp2 = randBetween(...AMP2_RANGE);
  const freq2 = randBetween(...FREQ2_RANGE);
  const steps = randBetween(...STEPS_RANGE);
  return {
    amp,
    targetAmp: amp,
    freq,
    targetFreq: freq,
    amp2,
    targetAmp2: amp2,
    freq2,
    targetFreq2: freq2,
    steps,
    targetSteps: steps,
    nextChangeAt: 0,
  };
}

export function WaveTick() {
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const rafRef = useRef<number>(0);
  const ringStates = useRef<RingState[]>(RINGS.map(makeRingState));

  useEffect(() => {
    function tick(now: number) {
      RINGS.forEach((ring, i) => {
        const el = pathRefs.current[i];
        if (!el) return;

        const s = ringStates.current[i];

        if (now >= s.nextChangeAt) {
          const t = pickTarget(ringStates.current, i);
          s.targetAmp = t.targetAmp;
          s.targetFreq = t.targetFreq;
          s.targetAmp2 = t.targetAmp2;
          s.targetFreq2 = t.targetFreq2;
          s.targetSteps = t.targetSteps;
          s.nextChangeAt = now + randBetween(...CHANGE_INTERVAL_MS);
        }

        s.amp += (s.targetAmp - s.amp) * 0.03;
        s.freq += (s.targetFreq - s.freq) * 0.03;
        s.amp2 += (s.targetAmp2 - s.amp2) * 0.03;
        s.freq2 += (s.targetFreq2 - s.freq2) * 0.03;
        s.steps += (s.targetSteps - s.steps) * 0.02; // slower — polygon stages are more visible

        const phase = (now * ring.speed + ring.phaseOffset) % (Math.PI * 2);
        el.setAttribute(
          "d",
          buildRingPath(
            CX,
            CY,
            ring.R,
            ring.w,
            s.amp,
            s.freq,
            s.amp2,
            s.freq2,
            phase,
            s.steps,
          ),
        );
      });
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div
      className="relative border border-outline overflow-hidden flex items-center justify-center min-h-[250px]"
      style={{ backgroundColor: "oklch(0.18 0.02 260)" }}
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
