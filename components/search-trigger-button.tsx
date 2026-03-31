"use client";

export function SearchTriggerButton() {
  return (
    <button
      onClick={() =>
        window.dispatchEvent(
          new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
        )
      }
      className="hidden sm:flex items-center gap-2 border border-outline px-3 py-1.5 font-mono text-[10px] text-on-surface-variant hover:border-primary/50 hover:text-primary transition-colors cursor-pointer"
    >
      <span>⌘K</span>
      <span className="opacity-50">search</span>
    </button>
  );
}
