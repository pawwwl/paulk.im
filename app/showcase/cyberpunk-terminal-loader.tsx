"use client";

import dynamic from "next/dynamic";

const CyberpunkTerminalScene = dynamic(
  () =>
    import("@/components/cyberpunk-terminal-scene").then((m) => ({
      default: m.CyberpunkTerminalScene,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-[#000a05] flex items-center justify-center">
        <span className="font-mono text-[11px] text-[#00ff41] tracking-widest uppercase animate-pulse">
          BOOTING_TERMINAL...
        </span>
      </div>
    ),
  }
);

export function CyberpunkTerminalLoader() {
  return (
    <div className="w-full h-[520px] border border-outline overflow-hidden bg-[#000a05]">
      <CyberpunkTerminalScene />
    </div>
  );
}
