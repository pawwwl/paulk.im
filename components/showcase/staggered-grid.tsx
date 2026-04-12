"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Always exactly 40 cells (20 pairs). Layout adapts to viewport aspect ratio.
const TOTAL_CARDS = 40;
const NUM_PAIRS = TOTAL_CARDS / 2; // 20

const EMOJIS = [
  "🌟", "🎨", "🦋", "🌈", "🔮", "🎭", "🦄", "🌸", "⚡", "🎪",
  "🌊", "🎯", "🔥", "💫", "🎸", "🦊", "🌙", "🎵", "🍀", "🦁",
];

// Factor pairs [columns, rows] for 40 — pick the one whose aspect ratio
// best matches the viewport.
const LAYOUTS: [number, number][] = [[4, 10], [5, 8], [8, 5], [10, 4]];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getGridDims(width: number, height: number) {
  const ratio = width / height;
  const [columns, rows] = LAYOUTS.reduce((best, pair) =>
    Math.abs(pair[0] / pair[1] - ratio) < Math.abs(best[0] / best[1] - ratio) ? pair : best
  );
  return { columns, rows };
}

interface Card {
  emoji: string;
  pairId: number;
}

function makeCards(): Card[] {
  const pairs: Card[] = [];
  for (let i = 0; i < NUM_PAIRS; i++) {
    pairs.push({ emoji: EMOJIS[i], pairId: i }, { emoji: EMOJIS[i], pairId: i });
  }
  return shuffle(pairs);
}

type BgMode = "default" | "success" | "fail";

interface RainDrop {
  id: number;
  emoji: string;
  x: number;
  delay: number;
  duration: number;
}

export function StaggeredGrid() {
  const [dims, setDims] = useState({ columns: 0, rows: 0 });
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<number[]>([]);
  const [flash, setFlash] = useState<{ indices: number[]; kind: "success" | "fail" } | null>(null);
  const [bgMode, setBgMode] = useState<BgMode>("default");
  const [won, setWon] = useState(false);
  const [rain, setRain] = useState<RainDrop[]>([]);
  const locked = useRef(false);

  const startGame = useCallback(() => {
    const { columns, rows } = getGridDims(window.innerWidth, window.innerHeight);
    setDims({ columns, rows });
    setCards(makeCards());
    setFlipped(new Set());
    setMatched(new Set());
    setSelected([]);
    setFlash(null);
    setBgMode("default");
    setWon(false);
    setRain([]);
    locked.current = false;
  }, []);

  useEffect(() => {
    startGame();
    window.addEventListener("resize", startGame);
    return () => window.removeEventListener("resize", startGame);
  }, [startGame]);

  const handleClick = useCallback(
    (i: number) => {
      if (locked.current) return;
      if (!cards[i]) return;
      if (matched.has(i) || flipped.has(i)) return;
      if (selected.length >= 2) return;

      const newFlipped = new Set(flipped).add(i);
      const newSelected = [...selected, i];
      setFlipped(newFlipped);
      setSelected(newSelected);

      if (newSelected.length === 2) {
        const [a, b] = newSelected;

        if (cards[a].pairId === cards[b].pairId) {
          // Match!
          setTimeout(() => {
            setMatched((prev) => {
              const next = new Set(prev).add(a).add(b);
              if (next.size === cards.length) {
                setWon(true);
                setRain(
                  Array.from({ length: 55 }, (_, id) => ({
                    id,
                    emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
                    x: Math.random() * 100,
                    delay: Math.random() * 5,
                    duration: 2.5 + Math.random() * 3,
                  }))
                );
              }
              return next;
            });
            setFlash({ indices: [a, b], kind: "success" });
            setBgMode("success");
            setSelected([]);
            setTimeout(() => {
              setFlash(null);
              setBgMode("default");
            }, 950);
          }, 200);
        } else {
          // Mismatch
          locked.current = true;
          setFlash({ indices: [a, b], kind: "fail" });
          setBgMode("fail");
          setTimeout(() => {
            setFlipped((prev) => {
              const next = new Set(prev);
              next.delete(a);
              next.delete(b);
              return next;
            });
            setSelected([]);
            setFlash(null);
            setBgMode("default");
            locked.current = false;
          }, 1150);
        }
      }
    },
    [cards, flipped, matched, selected]
  );

  const { columns, rows } = dims;
  const gridTotal = columns * rows;

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Background layers — cross-fade between modes */}
      <div
        className="absolute inset-0"
        style={{
          animation: "sg-bg-pan 10s linear infinite",
          background: "linear-gradient(to right, rgb(98,0,234), rgb(236,64,122), rgb(98,0,234))",
          backgroundSize: "200%",
          opacity: bgMode === "default" ? 1 : 0,
          transition: "opacity 350ms ease",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          animation: "sg-bg-pan 3.5s linear infinite",
          background: "linear-gradient(to right, rgb(0,200,100), rgb(255,220,0), rgb(80,220,120))",
          backgroundSize: "200%",
          opacity: bgMode === "success" ? 1 : 0,
          transition: "opacity 300ms ease",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          animation: "sg-bg-pan 2.5s linear infinite",
          background: "linear-gradient(to right, rgb(170,0,50), rgb(20,20,100), rgb(170,0,50))",
          backgroundSize: "200%",
          opacity: bgMode === "fail" ? 1 : 0,
          transition: "opacity 300ms ease",
        }}
      />

      {/* Card grid */}
      <div
        className="absolute inset-0"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          zIndex: 2,
        }}
      >
        {Array.from({ length: gridTotal }).map((_, i) => {
          const card = cards[i];
          const isFlipped = flipped.has(i) || matched.has(i);
          const isMatched = matched.has(i);
          const flashKind = flash?.indices.includes(i) ? flash.kind : null;
          const isClickable = !!card && !isMatched && !locked.current && !flipped.has(i) && selected.length < 2;

          return (
            <div
              key={i}
              onClick={() => handleClick(i)}
              style={{
                position: "relative",
                perspective: "700px",
                cursor: isClickable ? "pointer" : "default",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: "0.5px",
                  transformStyle: "preserve-3d",
                  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                  transition: "transform 400ms cubic-bezier(0.4,0,0.2,1)",
                }}
              >
                {/* Face down */}
                <div
                  className={isClickable ? "sg-face-down" : undefined}
                  style={{
                    position: "absolute",
                    inset: 0,
                    WebkitBackfaceVisibility: "hidden",
                    backfaceVisibility: "hidden",
                    backgroundColor: "rgb(15,15,15)",
                  }}
                />
                {/* Face up */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    WebkitBackfaceVisibility: "hidden",
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isMatched
                      ? "linear-gradient(135deg, rgb(10,160,80), rgb(100,200,40))"
                      : "linear-gradient(135deg, rgb(60,0,180), rgb(200,40,100))",
                    fontSize: "clamp(1.2rem, 4vmin, 2.5rem)",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      animation:
                        flashKind === "success"
                          ? "sg-match-burst 750ms cubic-bezier(0.34,1.56,0.64,1) both"
                          : flashKind === "fail"
                          ? "sg-fail-shake 500ms ease both"
                          : undefined,
                    }}
                  >
                    {card?.emoji}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Win overlay */}
      {won && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ zIndex: 30, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)" }}
        >
          {/* Raining emojis */}
          {rain.map(({ id, emoji, x, delay, duration }) => (
            <span
              key={id}
              style={{
                position: "absolute",
                top: "-3rem",
                left: `${x}%`,
                fontSize: "2rem",
                animation: `sg-rain ${duration}s ${delay}s linear infinite`,
                pointerEvents: "none",
                userSelect: "none",
              }}
            >
              {emoji}
            </span>
          ))}

          {/* Congrats card */}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              textAlign: "center",
              animation: "sg-win-pop 600ms cubic-bezier(0.34,1.56,0.64,1) both",
              padding: "2.5rem 3.5rem",
              borderRadius: "1.5rem",
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.18)",
              boxShadow: "0 8px 60px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ fontSize: "4.5rem", marginBottom: "0.4rem", animation: "sg-trophy-spin 1s 700ms cubic-bezier(0.34,1.56,0.64,1) both" }}>🏆</div>
            <div
              style={{
                fontSize: "1.9rem",
                fontWeight: 800,
                color: "white",
                textShadow: "0 0 30px rgba(255,215,0,0.9), 0 0 60px rgba(255,215,0,0.4)",
                marginBottom: "0.3rem",
                letterSpacing: "-0.01em",
              }}
            >
              Congratulations!
            </div>
            <div style={{ color: "rgba(255,255,255,0.65)", fontSize: "1rem", marginBottom: "1.8rem" }}>
              You matched every pair.
            </div>
            <button
              onClick={startGame}
              style={{
                padding: "0.75rem 2.2rem",
                borderRadius: "2rem",
                border: "none",
                background: "linear-gradient(to right, rgb(98,0,234), rgb(236,64,122))",
                color: "white",
                fontSize: "1rem",
                fontWeight: 700,
                cursor: "pointer",
                letterSpacing: "0.02em",
                boxShadow: "0 4px 20px rgba(98,0,234,0.5)",
              }}
            >
              Play again
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes sg-bg-pan {
          from { background-position: 0% center; }
          to   { background-position: -200% center; }
        }

        .sg-face-down:hover {
          background-color: rgb(30,30,30) !important;
          transition: background-color 120ms ease;
        }

        @keyframes sg-match-burst {
          0%   { transform: scale(1) rotate(0deg);   filter: brightness(1); }
          20%  { transform: scale(1.9) rotate(-18deg); filter: brightness(3) drop-shadow(0 0 10px gold); }
          45%  { transform: scale(1.5) rotate(12deg);  filter: brightness(2) drop-shadow(0 0 6px gold); }
          70%  { transform: scale(1.15) rotate(-4deg); filter: brightness(1.4); }
          100% { transform: scale(1) rotate(0deg);   filter: brightness(1); }
        }

        @keyframes sg-fail-shake {
          0%, 100% { transform: translateX(0) rotate(0deg);    filter: brightness(1); }
          15%       { transform: translateX(-6px) rotate(-8deg); filter: brightness(0.6) saturate(2) hue-rotate(200deg); }
          35%       { transform: translateX(6px)  rotate(8deg);  filter: brightness(0.6) saturate(2) hue-rotate(200deg); }
          55%       { transform: translateX(-4px) rotate(-4deg); filter: brightness(0.8); }
          75%       { transform: translateX(4px)  rotate(4deg);  filter: brightness(0.8); }
        }

        @keyframes sg-rain {
          0%   { transform: translateY(-60px) rotate(0deg);   opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0.5; }
        }

        @keyframes sg-win-pop {
          from { transform: scale(0.5) translateY(30px); opacity: 0; }
          to   { transform: scale(1)   translateY(0);    opacity: 1; }
        }

        @keyframes sg-trophy-spin {
          from { transform: scale(0) rotate(-180deg); opacity: 0; }
          to   { transform: scale(1) rotate(0deg);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
