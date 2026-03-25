"use client";

import dynamic from "next/dynamic";

const CalvinHobbesScene = dynamic(
  () =>
    import("@/components/calvin-hobbes-scene").then((m) => ({
      default: m.CalvinHobbesScene,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-[#258888] flex items-center justify-center">
        <span className="font-mono text-[11px] text-[#90cc38] tracking-widest uppercase animate-pulse">
          LOADING_SCENE...
        </span>
      </div>
    ),
  }
);

export function CalvinHobbesLoader() {
  return (
    <div className="w-full h-[520px] border border-outline overflow-hidden bg-[#258888]">
      <CalvinHobbesScene />
    </div>
  );
}
