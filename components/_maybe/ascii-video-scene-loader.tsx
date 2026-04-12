"use client";

import dynamic from "next/dynamic";

const AsciiVideoScene = dynamic(
  () =>
    import("./ascii-video-scene").then((m) => ({
      default: m.AsciiVideoScene,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <span className="font-mono text-[11px] text-[#00ff41] tracking-widest uppercase animate-pulse">
          LOADING_ASCII...
        </span>
      </div>
    ),
  },
);

export function AsciiVideoLoader() {
  return (
    <div className="w-full h-[520px] border border-outline overflow-hidden bg-black">
      <AsciiVideoScene />
    </div>
  );
}
