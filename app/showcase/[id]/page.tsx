"use client";

import { use, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VIEWS } from "../views";

export default function ShowcaseViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const currentIndex = VIEWS.findIndex((v) => v.id === id);

  if (currentIndex === -1) notFound();

  const view = VIEWS[currentIndex];

  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div
      className="fixed inset-0 z-60 flex flex-col"
      style={{ backgroundColor: "#0e0e0e" }}
    >
      {/* Header */}
      <div
        className="shrink-0 h-12 border-b flex items-center justify-between px-5 relative"
        style={{ borderColor: "rgba(255,255,255,0.1)" }}
      >
        {/* Logo */}
        <Link
          href="/"
          className="font-mono font-bold text-primary tracking-widest text-xs uppercase"
        >
          Pawwwl_
        </Link>

        {/* Current view label */}
        <span
          className="font-mono text-[11px] uppercase tracking-[0.22em] absolute left-1/2 -translate-x-1/2"
          style={{ color: "rgba(255,255,255,0.35)" }}
        >
          {view.label}
        </span>

        {/* Menu button */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex flex-col justify-center gap-[5px] w-6 h-6 items-center rounded cursor-pointer"
          aria-label="Open menu"
        >
          <span className="block w-4 bg-accent-pink h-[1.5px] rounded-2xl" />
          <span className="block w-4 bg-accent-pink h-[1.5px] rounded-2xl" />

          <span className="block w-4 bg-accent-pink h-[1.5px] rounded-2xl" />
        </button>
      </div>

      {/* View content */}
      <div className="flex-1 overflow-hidden relative">
        {view.component}
      </div>

      {/* Drawer backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-70"
          style={{ background: "rgba(0,0,0,0.55)" }}
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 bottom-0 z-80 flex flex-col"
        style={{
          width: 260,
          background: "#111",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          transform: drawerOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 260ms cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* Drawer header */}
        <div
          className="flex items-center justify-between px-5 h-12 shrink-0 border-b"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          <span
            className="font-mono text-[10px] uppercase tracking-[0.3em]"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            Showcase
          </span>
          <button
            onClick={() => setDrawerOpen(false)}
            className="flex items-center justify-center w-7 h-7"
            aria-label="Close menu"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <line
                x1="1"
                y1="1"
                x2="10"
                y2="10"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <line
                x1="10"
                y1="1"
                x2="1"
                y2="10"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* View list */}
        <div className="flex-1 overflow-y-auto py-3">
          {VIEWS.map((v) => {
            const isActive = v.id === id;
            return (
              <Link
                key={v.id}
                href={`/showcase/${v.id}`}
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-3 px-5 py-3 transition-colors"
                style={{
                  background: isActive
                    ? "rgba(255,255,255,0.05)"
                    : "transparent",
                  borderLeft: `2px solid ${isActive ? "#00e5ff" : "transparent"}`,
                }}
              >
                {/* Preview thumbnail */}
                <div
                  className="shrink-0 rounded overflow-hidden"
                  style={{ width: 44, height: 30 }}
                >
                  <div className="w-full h-full [clip-path:inset(0_round_4px)] pointer-events-none">
                    {v.preview}
                  </div>
                </div>

                <div className="flex flex-col gap-0.5 min-w-0">
                  <span
                    className="font-mono text-[11px] uppercase tracking-[0.18em]"
                    style={{
                      color: isActive ? "#00e5ff" : "rgba(255,255,255,0.7)",
                    }}
                  >
                    {v.label}
                  </span>
                  <span
                    className="font-mono text-[9px] truncate"
                    style={{ color: "rgba(255,255,255,0.25)" }}
                  >
                    {v.description}
                  </span>
                </div>

                {isActive && (
                  <span
                    className="ml-auto shrink-0 font-mono text-[8px]"
                    style={{ color: "#00e5ff" }}
                  >
                    ▶
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Back to showcase */}
        <div
          className="shrink-0 border-t px-5 py-4"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          <Link
            href="/showcase"
            className="font-mono text-[10px] uppercase tracking-[0.22em]"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            ← All showcase
          </Link>
        </div>
      </div>
    </div>
  );
}
