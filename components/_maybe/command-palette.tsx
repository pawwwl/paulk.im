"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type SearchItem = {
  id: string;
  type: "page" | "section" | "demo" | "skill" | "experience";
  title: string;
  description: string | null;
  url: string;
};

const TYPE_LABELS: Record<SearchItem["type"], string> = {
  page: "PAGE",
  section: "SECTION",
  demo: "DEMO",
  skill: "SKILL",
  experience: "EXP",
};

const TYPE_COLORS: Record<SearchItem["type"], string> = {
  page: "text-primary border-primary/40 bg-primary/10",
  section: "text-accent-green border-accent-green/40 bg-accent-green/10",
  demo: "text-accent-pink border-accent-pink/40 bg-accent-pink/10",
  skill: "text-[#a78bfa] border-[#a78bfa]/40 bg-[#a78bfa]/10",
  experience: "text-on-surface-variant border-outline bg-surface-container",
};

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const debouncedQuery = useDebounce(query, 150);

  // Open on ⌘K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  // Fetch results
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then((data) => {
        setResults(data);
        setSelected(0);
      })
      .finally(() => setLoading(false));
  }, [debouncedQuery, open]);

  const navigate = useCallback(
    (item: SearchItem) => {
      setOpen(false);
      router.push(item.url);
    },
    [router]
  );

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelected((s) => Math.min(s + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelected((s) => Math.max(s - 1, 0));
      } else if (e.key === "Enter" && results[selected]) {
        navigate(results[selected]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, results, selected, navigate]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-2xl border border-outline bg-[#0e0e0e] shadow-[0_0_60px_rgba(0,229,255,0.08)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-outline">
          <span className="text-primary font-mono text-sm select-none">›_</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, skills, experience, demos..."
            className="flex-1 bg-transparent text-on-surface font-mono text-sm outline-none placeholder:text-on-surface-variant/50"
          />
          {loading && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          )}
          <span className="font-mono text-[10px] text-on-surface-variant/40 hidden sm:block">
            ESC
          </span>
        </div>

        {/* Results */}
        {results.length > 0 ? (
          <ul className="py-1 max-h-[400px] overflow-y-auto">
            {results.map((item, i) => (
              <li key={item.id}>
                <button
                  onMouseEnter={() => setSelected(i)}
                  onClick={() => navigate(item)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${
                    selected === i ? "bg-surface-container" : "hover:bg-surface"
                  }`}
                >
                  <span
                    className={`mt-0.5 shrink-0 px-1.5 py-0.5 border font-mono text-[9px] uppercase tracking-widest ${TYPE_COLORS[item.type]}`}
                  >
                    {TYPE_LABELS[item.type]}
                  </span>
                  <div className="min-w-0">
                    <p className="text-on-surface font-mono text-sm truncate">
                      {item.title}
                    </p>
                    {item.description && (
                      <p className="text-on-surface-variant font-mono text-xs mt-0.5 line-clamp-1">
                        {item.description}
                      </p>
                    )}
                  </div>
                  {selected === i && (
                    <span className="ml-auto shrink-0 font-mono text-[10px] text-primary/60 self-center">
                      ↵
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          !loading && query.length > 0 && (
            <p className="px-4 py-6 font-mono text-xs text-on-surface-variant/50 text-center">
              no results for &quot;{query}&quot;
            </p>
          )
        )}

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-outline/50">
          <span className="font-mono text-[9px] text-on-surface-variant/30 uppercase tracking-widest">
            ↑↓ navigate · ↵ open · esc close
          </span>
        </div>
      </div>
    </div>
  );
}
