const COLS = 7;
const ROWS = 9;

const TILES = Array.from({ length: COLS * ROWS }, (_, i) => {
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  return (col + row) % 2 === 0
    ? { inDelay: "0ms", outDelay: "60ms" }
    : { inDelay: "60ms", outDelay: "0ms" };
});

export function ProfileChecker() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${COLS}, 1fr)`,
        gridTemplateRows: `repeat(${ROWS}, 1fr)`,
      }}
    >
      {TILES.map(({ inDelay, outDelay }, i) => (
        <div
          key={i}
          className="checker-tile"
          style={
            {
              "--d-in": inDelay,
              "--d-out": outDelay,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
