"use client";

import Link from "next/link";
import { VIEWS } from "./views";

export default function ShowcasePage() {
  return (
    <div
      className="flex gap-8 px-2 pb-4 overflow-x-auto flex-wrap"
      style={{ scrollbarWidth: "none" } as React.CSSProperties}
    >
      {VIEWS.map((view) => (
        <Link
          key={view.id}
          href={`/showcase/${view.id}`}
          className="shrink-0 flex flex-col gap-2 text-left active:scale-[0.98] transition-transform"
          style={{ width: 180 }}
        >
          <div
            className="relative w-full rounded-md overflow-hidden"
            style={{ height: 100 }}
          >
            <div className="size-full [clip-path:inset(0_round_6px)]">
              {view.preview}
            </div>
            <div
              className="pointer-events-none absolute inset-0 rounded-md"
              style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)" }}
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <span
              className="font-mono text-[10px] uppercase tracking-[0.22em]"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              {view.label}
            </span>
            <span
              className="font-mono text-[9px]"
              style={{ color: "rgba(255,255,255,0.25)" }}
            >
              {view.description}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
