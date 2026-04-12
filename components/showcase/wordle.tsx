"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ── Constants ─────────────────────────────────────────────────────────────────

const ROWS = 6;
const COLS = 5;
const FLIP_HALF = 190; // ms per flip half (out + in)
const FLIP_STAGGER = 290; // ms between tile reveal starts

// ── Word List ─────────────────────────────────────────────────────────────────

const WORD_LIST = [
  "ABOUT","ABOVE","ABUSE","ACTOR","ACUTE","ADMIT","ADOPT","ADULT","AFTER","AGAIN",
  "AGENT","AGREE","AHEAD","ALIEN","ALIKE","ALIVE","ALLOW","ALONE","ALONG","ALTER",
  "ANGEL","ANGER","ANGLE","APART","APPLE","APPLY","ARENA","ARISE","ARMOR","AUDIO",
  "BADGE","BAKER","BASIC","BASIS","BEACH","BEGAN","BEGIN","BEING","BENCH","BIRTH",
  "BLACK","BLADE","BLANK","BLAST","BLAZE","BLEED","BLESS","BLIND","BLOCK","BLOOD",
  "BLOOM","BLOWN","BLUES","BLUNT","BOARD","BONUS","BOOST","BOOTH","BOUND","BRACE",
  "BRAIN","BRAVE","BREAK","BRICK","BRIDE","BRIEF","BRING","BRISK","BROAD","BROKE",
  "BROOK","BROOM","BRUSH","BUILD","BUILT","BUNCH","BURST","BUYER","CABLE","CANDY",
  "CANOE","CARRY","CATCH","CAUSE","CHAIR","CHALK","CHAOS","CHARM","CHART","CHASE",
  "CHEAP","CHECK","CHESS","CHEST","CHIEF","CHILD","CHOSE","CHUNK","CIVIC","CIVIL",
  "CLAIM","CLAMP","CLASS","CLEAN","CLEAR","CLIMB","CLING","CLOCK","CLOSE","CLOUD",
  "COACH","COAST","COMET","CORAL","COULD","COUNT","COVER","CRACK","CRAFT","CRANE",
  "CRASH","CRAZY","CREAM","CREEK","CRIME","CRISP","CROSS","CROWD","CRUEL","CRUSH",
  "CURVE","CYCLE","DAILY","DANCE","DREAM","DRINK","DRIVE","DRONE","DROWN","EAGLE",
  "EARTH","EIGHT","ELITE","EMBER","EMPTY","ENEMY","ENJOY","ENTER","EQUAL","ERROR",
  "ESSAY","EVENT","EXACT","EXIST","EXTRA","FAINT","FAITH","FALSE","FANCY","FATAL",
  "FAULT","FEAST","FIBER","FIELD","FIFTY","FIGHT","FINAL","FIRST","FIXED","FLAME",
  "FLASH","FLOCK","FLOOD","FLOOR","FLUTE","FOCUS","FORCE","FORGE","FORTH","FOUND",
  "FRAME","FRANK","FRAUD","FRESH","FRONT","FRUIT","FULLY","GHOST","GIVEN","GLASS",
  "GLOBE","GLOSS","GLOVE","GOING","GRACE","GRAIN","GRAND","GRANT","GRASP","GRASS",
  "GRAVE","GREAT","GREED","GREET","GRIEF","GRIND","GROUP","GROVE","GUARD","GUESS",
  "GUEST","GUIDE","GUILT","HAPPY","HARSH","HEART","HEAVY","HENCE","HONOR","HOUSE",
  "HUMAN","HUMOR","HURRY","IMAGE","IMPLY","INDEX","INPUT","ISSUE","JOINT","JUDGE",
  "KNOWN","LABEL","LARGE","LASER","LATER","LAUGH","LAYER","LEARN","LEASE","LEAST",
  "LEGAL","LEMON","LEVEL","LIGHT","LIMIT","LOCAL","LODGE","LOGIC","LOOSE","LOVER",
  "LUCKY","LUNAR","LUNCH","MAGIC","MAJOR","MAPLE","MARSH","MATCH","MAYBE","MAYOR",
  "MEDIA","MERIT","METAL","MINOR","MINUS","MORAL","MOUNT","MOUSE","MOUTH","MOVIE",
  "MUSIC","NAIVE","NERVE","NEVER","NIGHT","NOBLE","NOISE","NORTH","NOVEL","NURSE",
  "OCEAN","OFFER","OFTEN","ONSET","OUTER","OWNER","OZONE","PAINT","PANEL","PAPER",
  "PARTY","PATCH","PAUSE","PEACE","PEARL","PENNY","PHASE","PHONE","PHOTO","PIANO",
  "PILOT","PINCH","PIXEL","PIVOT","PLACE","PLAIN","PLANE","PLANK","PLATE","PLAZA",
  "POINT","POKER","POLAR","POWER","PRESS","PRICE","PRIDE","PRIME","PRINT","PRIOR",
  "PRIZE","PROBE","PROOF","PROUD","PROVE","PRISM","PULSE","PUNCH","PUPIL","QUOTA",
  "QUOTE","RADAR","RADIO","RAISE","RALLY","RANCH","RANGE","RAPID","RATIO","REACH",
  "READY","REALM","REBEL","RELAY","REPLY","RIDGE","RIGHT","RIGID","RISKY","RIVAL",
  "RIVER","ROCKY","ROUND","ROUTE","ROYAL","RULER","RURAL","RUSTY","SAINT","SAUCE",
  "SCALE","SCARE","SCENE","SCOPE","SCORE","SCOUT","SERVE","SETUP","SEVEN","SHADE",
  "SHAKE","SHAME","SHAPE","SHARE","SHARP","SHELL","SHIFT","SHIRT","SHOCK","SHORE",
  "SHORT","SHOUT","SIGHT","SINCE","SIXTH","SKILL","SKULL","SLAVE","SLEEK","SLEEP",
  "SLICE","SLIDE","SLOPE","SMALL","SMART","SMELL","SMILE","SMOKE","SNAKE","SNEAK",
  "SOLAR","SOLVE","SORRY","SOUTH","SPACE","SPARE","SPARK","SPEAR","SPEED","SPEND",
  "SPICE","SPIKE","SPINE","SPITE","SPLIT","SPORT","SPRAY","SQUAD","STACK","STAGE",
  "STAKE","STAND","STARE","START","STATE","STEAM","STEEL","STEEP","STEER","STERN",
  "STICK","STILL","STING","STOCK","STONE","STORM","STORY","STOUT","STOVE","STRIP",
  "STUDY","STUFF","STYLE","SUGAR","SUPER","SURGE","SWAMP","SWEAR","SWEEP","SWEET",
  "SWIFT","SWING","SWARM","TABLE","TASTE","TEACH","TEETH","THANK","THEME","THICK",
  "THING","THINK","THIRD","THREE","THROW","THUMB","TIGER","TIGHT","TIMER","TITLE",
  "TODAY","TOKEN","TOTAL","TOUCH","TOUGH","TOWEL","TOWER","TOXIC","TRACE","TRACK",
  "TRADE","TRAIL","TRAIN","TREND","TRICK","TROOP","TROUT","TRUCK","TRULY","TRUNK",
  "TRUST","TRUTH","TULIP","TWICE","TWIST","ULTRA","UNDER","UNION","UNITY","UNTIL",
  "UPPER","UPSET","URBAN","USAGE","USUAL","UTTER","VAGUE","VALID","VALUE","VALVE",
  "VAPOR","VAULT","VENUE","VERSE","VIDEO","VIGOR","VIRAL","VISIT","VITAL","VIVID",
  "VOICE","VOTER","WAGER","WASTE","WATCH","WATER","WEAVE","WEIRD","WHITE","WHOLE",
  "WITCH","WOMAN","WOMEN","WORLD","WORSE","WORST","WORTH","WOUND","WRIST","WROTE",
  "YACHT","YOUNG","YOUTH","ZEBRA","ZESTY",
];

// ── Types ─────────────────────────────────────────────────────────────────────

type CellState = "empty" | "typed" | "correct" | "present" | "absent";
// 0 = unflipped (shows typed look)
// 1 = flipping-out (scaleY 1→0, typed look)
// 2 = flipping-in  (scaleY 0→1, colored look)
// 3 = done (colored look, no animation)
type TilePhase = 0 | 1 | 2 | 3;

type Cell = { letter: string; cellState: CellState };

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeBoard(): Cell[][] {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({ letter: "", cellState: "empty" as CellState }))
  );
}

function makePhases(): TilePhase[][] {
  return Array.from({ length: ROWS }, () => Array<TilePhase>(COLS).fill(0));
}

function checkGuess(guess: string, answer: string): CellState[] {
  const result: CellState[] = Array(COLS).fill("absent");
  const ans = answer.split("");
  const gue = guess.split("");
  // Pass 1: correct positions
  for (let i = 0; i < COLS; i++) {
    if (gue[i] === ans[i]) {
      result[i] = "correct";
      ans[i] = "#";
      gue[i] = "*";
    }
  }
  // Pass 2: present letters
  for (let i = 0; i < COLS; i++) {
    if (gue[i] === "*") continue;
    const idx = ans.indexOf(gue[i]);
    if (idx !== -1) {
      result[i] = "present";
      ans[idx] = "#";
    }
  }
  return result;
}

const STATE_PRIORITY: Record<CellState, number> = {
  correct: 3, present: 2, absent: 1, typed: 0, empty: 0,
};

const TILE_BG: Record<CellState, string> = {
  empty: "transparent",
  typed: "transparent",
  correct: "#538d4e",
  present: "#b59f3b",
  absent: "#4a4a4e",
};

const TILE_BORDER: Record<CellState, string> = {
  empty: "rgba(255,255,255,0.5)",
  typed: "rgba(255,255,255,0.80)",
  correct: "#538d4e",
  present: "#b59f3b",
  absent: "#5a5a5c",
};

const KB_ROWS = [
  ["Q","W","E","R","T","Y","U","I","O","P"],
  ["A","S","D","F","G","H","J","K","L"],
  ["ENTER","Z","X","C","V","B","N","M","⌫"],
];

// ── Component ─────────────────────────────────────────────────────────────────

export function WordleGame() {
  const [board, setBoard] = useState<Cell[][]>(makeBoard);
  const [phases, setPhases] = useState<TilePhase[][]>(makePhases);
  const [currentRow, setCurrentRow] = useState(0);
  const [currentCol, setCurrentCol] = useState(0);
  const [answer, setAnswer] = useState<string>("");
  const [keyStates, setKeyStates] = useState<Record<string, CellState>>({});
  const [shakingRow, setShakingRow] = useState<number | null>(null);
  const [bouncingRow, setBouncingRow] = useState<number | null>(null);
  const [poppingCell, setPoppingCell] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [message, setMessage] = useState<string>("");
  const msgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  // Stable refs so event handler closures don't stale
  const boardRef = useRef(board);
  boardRef.current = board;
  const currentRowRef = useRef(currentRow);
  currentRowRef.current = currentRow;
  const currentColRef = useRef(currentCol);
  currentColRef.current = currentCol;
  const answerRef = useRef(answer);
  answerRef.current = answer;
  const gameOverRef = useRef(gameOver);
  gameOverRef.current = gameOver;
  const isRevealingRef = useRef(isRevealing);
  isRevealingRef.current = isRevealing;

  useEffect(() => {
    setAnswer(WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)]);
  }, []);

  const showMessage = useCallback((msg: string, duration = 1800) => {
    setMessage(msg);
    if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
    msgTimerRef.current = setTimeout(() => setMessage(""), duration);
  }, []);

  const shake = useCallback((row: number) => {
    setShakingRow(row);
    setTimeout(() => setShakingRow(null), 520);
  }, []);

  const handleKey = useCallback(
    (key: string) => {
      if (gameOverRef.current || isRevealingRef.current) return;
      if (!answerRef.current) return;

      const row = currentRowRef.current;
      const col = currentColRef.current;
      const answer = answerRef.current;
      const board = boardRef.current;

      // ── Backspace ──────────────────────────────────────────────────────────
      if (key === "BACKSPACE" || key === "⌫") {
        if (col === 0) return;
        setBoard((prev) => {
          const next = prev.map((r) => r.map((c) => ({ ...c })));
          next[row][col - 1] = { letter: "", cellState: "empty" };
          return next;
        });
        setCurrentCol(col - 1);
        return;
      }

      // ── Enter ─────────────────────────────────────────────────────────────
      if (key === "ENTER") {
        if (col < COLS) {
          shake(row);
          showMessage("Not enough letters");
          return;
        }

        const guess = board[row].map((c) => c.letter).join("");
        const result = checkGuess(guess, answer);

        // Bake colors into board state (phases gate the visual reveal)
        const newBoard = board.map((r) => r.map((c) => ({ ...c })));
        for (let c = 0; c < COLS; c++) newBoard[row][c].cellState = result[c];
        setBoard(newBoard);
        setIsRevealing(true);

        // Staggered tile flip
        for (let c = 0; c < COLS; c++) {
          const delay = c * FLIP_STAGGER;
          setTimeout(() => {
            setPhases((prev) => {
              const next = prev.map((r) => [...r]) as TilePhase[][];
              next[row][c] = 1; // flip-out
              return next;
            });
          }, delay);
          setTimeout(() => {
            setPhases((prev) => {
              const next = prev.map((r) => [...r]) as TilePhase[][];
              next[row][c] = 2; // flip-in (color visible)
              return next;
            });
          }, delay + FLIP_HALF);
          setTimeout(() => {
            setPhases((prev) => {
              const next = prev.map((r) => [...r]) as TilePhase[][];
              next[row][c] = 3; // settled
              return next;
            });
          }, delay + FLIP_HALF * 2);
        }

        const doneAt = (COLS - 1) * FLIP_STAGGER + FLIP_HALF * 2 + 80;
        setTimeout(() => {
          // Update keyboard colors
          setKeyStates((prev) => {
            const next = { ...prev };
            for (let c = 0; c < COLS; c++) {
              const letter = newBoard[row][c].letter;
              const state = result[c];
              if (!next[letter] || STATE_PRIORITY[state] > STATE_PRIORITY[next[letter]]) {
                next[letter] = state;
              }
            }
            return next;
          });

          setIsRevealing(false);
          const won = result.every((s) => s === "correct");

          if (won) {
            setGameOver(true);
            setBouncingRow(row);
            const msgs = ["Genius!","Magnificent!","Impressive!","Splendid!","Great!","Phew!"];
            showMessage(msgs[Math.min(row, msgs.length - 1)], 3500);
          } else if (row === ROWS - 1) {
            setGameOver(true);
            showMessage(answer, 5000);
          } else {
            setCurrentRow(row + 1);
            setCurrentCol(0);
          }
        }, doneAt);

        return;
      }

      // ── Letter ────────────────────────────────────────────────────────────
      if (/^[A-Z]$/.test(key) && col < COLS) {
        const cellKey = `${row}-${col}`;
        setPoppingCell(cellKey);
        setTimeout(() => setPoppingCell(null), 130);
        setBoard((prev) => {
          const next = prev.map((r) => r.map((c) => ({ ...c })));
          next[row][col] = { letter: key, cellState: "typed" };
          return next;
        });
        setCurrentCol(col + 1);
      }
    },
    [shake, showMessage]
  );

  // Physical + native mobile keyboard listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toUpperCase();
      if (k === "BACKSPACE" || k === "ENTER" || /^[A-Z]$/.test(k)) {
        e.preventDefault();
        handleKey(k);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleKey]);

  // Route native mobile keyboard input through handleKey
  const onHiddenChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    e.target.value = "";
    for (const ch of val) {
      if (/^[A-Z]$/.test(ch)) handleKey(ch);
    }
  }, [handleKey]);

  const focusHiddenInput = useCallback(() => {
    hiddenInputRef.current?.focus();
  }, []);

  const resetGame = useCallback(() => {
    setBoard(makeBoard());
    setPhases(makePhases());
    setCurrentRow(0);
    setCurrentCol(0);
    setAnswer(WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)]);
    setKeyStates({});
    setShakingRow(null);
    setBouncingRow(null);
    setPoppingCell(null);
    setGameOver(false);
    setIsRevealing(false);
    setMessage("");
  }, []);

  return (
    <div
      className="flex flex-col items-center justify-center h-full w-full select-none overflow-auto py-6"
      style={{ background: "#0e0e0e", fontFamily: "var(--font-mono)" }}
    >
      {/* Hidden input to capture native mobile keyboard */}
      <input
        ref={hiddenInputRef}
        onChange={onHiddenChange}
        inputMode="text"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="characters"
        spellCheck={false}
        style={{
          position: "absolute",
          opacity: 0,
          pointerEvents: "none",
          width: 1,
          height: 1,
          top: 0,
          left: 0,
        }}
      />

      {/* Header */}
      <div
        className="font-mono text-[11px] uppercase tracking-[0.35em] mb-5"
        style={{ color: "rgba(255,255,255,0.25)", letterSpacing: "0.4em" }}
      >
        WORDLE
      </div>

      {/* Toast message */}
      <div style={{ height: 36, display: "flex", alignItems: "center", marginBottom: 10 }}>
        {message && (
          <div
            key={message}
            className="font-mono text-[11px] uppercase tracking-widest px-4 py-1.5 rounded"
            style={{
              background: "rgba(255,255,255,0.92)",
              color: "#111",
              fontWeight: 700,
              animation: "wordle-msg-in 180ms cubic-bezier(0.34,1.56,0.64,1) both",
            }}
          >
            {message}
          </div>
        )}
      </div>

      {/* Board — tiles scale down on narrow screens */}
      <div
        style={
          {
            display: "flex",
            flexDirection: "column",
            gap: 6,
            marginBottom: 28,
            "--tile": "clamp(44px, calc((100vw - 56px) / 5), 54px)",
          } as React.CSSProperties
        }
      >
        {board.map((row, r) => {
          const isShaking = shakingRow === r;
          const isBouncing = bouncingRow === r;
          return (
            <div
              key={r}
              style={{
                display: "flex",
                gap: 6,
                animation: isShaking ? "wordle-shake 520ms ease-in-out both" : undefined,
              }}
            >
              {row.map((cell, c) => {
                const phase = phases[r][c];
                const showColor = phase >= 2;
                const isPopping = poppingCell === `${r}-${c}`;

                const bg = showColor ? TILE_BG[cell.cellState] : "transparent";
                const borderColor = showColor
                  ? TILE_BORDER[cell.cellState]
                  : cell.letter
                  ? TILE_BORDER["typed"]
                  : TILE_BORDER["empty"];

                let anim = "none";
                if (isPopping) {
                  anim = "wordle-pop 130ms ease-out both";
                } else if (phase === 1) {
                  anim = `wordle-flip-out ${FLIP_HALF}ms ease-in forwards`;
                } else if (phase === 2) {
                  anim = `wordle-flip-in ${FLIP_HALF}ms ease-out forwards`;
                } else if (isBouncing) {
                  anim = `wordle-bounce 650ms cubic-bezier(0.34,1.56,0.64,1) calc(${c} * 90ms) both`;
                }

                return (
                  <div
                    key={c}
                    onClick={focusHiddenInput}
                    style={{
                      width: "var(--tile)",
                      height: "var(--tile)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "calc(var(--tile) * 0.41)",
                      fontWeight: 800,
                      color: "#fff",
                      background: bg,
                      border: `2px solid ${borderColor}`,
                      borderRadius: 4,
                      animation: anim,
                      transition: "border-color 80ms ease, background 80ms ease",
                      letterSpacing: "0.02em",
                      cursor: "text",
                    }}
                  >
                    {cell.letter}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Keyboard — keys scale down on narrow screens */}
      <div
        style={
          {
            display: "flex",
            flexDirection: "column",
            gap: 7,
            alignItems: "center",
            "--key-w": "clamp(27px, calc((100vw - 77px) / 10), 38px)",
          } as React.CSSProperties
        }
      >
        {KB_ROWS.map((row, ri) => (
          <div key={ri} style={{ display: "flex", gap: 5 }}>
            {row.map((key) => {
              const state = keyStates[key];
              const isWide = key === "ENTER" || key === "⌫";
              const bg = state ? TILE_BG[state] : "rgba(255,255,255,0.1)";
              return (
                <button
                  key={key}
                  onClick={() => handleKey(key)}
                  style={{
                    width: isWide ? "calc(var(--key-w) * 1.63)" : "var(--key-w)",
                    height: "calc(var(--key-w) * 1.47)",
                    borderRadius: 4,
                    border: "none",
                    outline: "none",
                    background: bg,
                    color: "#fff",
                    fontSize: isWide ? "calc(var(--key-w) * 0.24)" : "calc(var(--key-w) * 0.37)",
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                    letterSpacing: isWide ? "0.08em" : "0.04em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    transition: "background 300ms ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    userSelect: "none",
                    touchAction: "manipulation",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  {key}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* New game */}
      {gameOver && (
        <button
          onClick={resetGame}
          className="mt-7 font-mono text-[10px] uppercase tracking-[0.22em] px-5 py-2 rounded transition-all duration-150"
          style={{
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "rgba(255,255,255,0.45)",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.55)";
            (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.85)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.2)";
            (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)";
          }}
        >
          NEW GAME
        </button>
      )}
    </div>
  );
}
