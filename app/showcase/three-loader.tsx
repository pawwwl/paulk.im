"use client";

import dynamic from "next/dynamic";

const ThreeScene = dynamic(
  () => import("@/components/three-scene").then((m) => ({ default: m.ThreeScene })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-[#0e0e0e] flex items-center justify-center">
        <span className="font-mono text-[11px] text-primary tracking-widest uppercase animate-pulse">
          LOADING_SCENE...
        </span>
      </div>
    ),
  }
);

export function ThreeSceneLoader() {
  return (
    <div className="w-full h-[520px] border border-outline overflow-hidden bg-[#0e0e0e]">
      <ThreeScene />
    </div>
  );
}
