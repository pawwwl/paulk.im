"use client";

import { useEffect, useRef, useState } from "react";

// ── Config ────────────────────────────────────────────────────────────────────
const GAP = 12;
function cellSize() { return window.innerWidth < 640 ? 120 : 200; }
const RADIUS = 8;
const FRICTION = 0.92;

const KLIPY_KEY = process.env.NEXT_PUBLIC_KLIPPY_KEY
const KLIPY_CID = "showcase";

// ── Types ─────────────────────────────────────────────────────────────────────
type GifItem = {
  id: string;
  title: string;
  mp4Url: string;
  pageUrl: string;
};

// ── Fetch ─────────────────────────────────────────────────────────────────────
function parseGifs(data: unknown): GifItem[] {
  const rows = ((data as Record<string, unknown>)?.data as Record<string, unknown>)?.data;
  return ((rows ?? []) as Record<string, unknown>[])
    .map((g) => {
      const file = (g.file as Record<string, Record<string, Record<string, string>>>) ?? {};
      const size = file.sm ?? file.xs ?? file.md ?? {};
      return {
        id:      String(g.id ?? ""),
        title:   String(g.title ?? ""),
        mp4Url:  size.mp4?.url ?? size.webm?.url ?? "",
        pageUrl: `https://klipy.com/gifs/${String(g.slug ?? "")}`,
      };
    })
    .filter((g) => g.mp4Url);
}

async function fetchPages(url: string): Promise<GifItem[]> {
  const [p1, p2] = await Promise.all([
    fetch(`${url}&page=1&per_page=50`).then((r) => r.json()),
    fetch(`${url}&page=2&per_page=50`).then((r) => r.json()),
  ]);
  return [...parseGifs(p1), ...parseGifs(p2)];
}

async function fetchTrending(): Promise<GifItem[]> {
  return fetchPages(
    `https://api.klipy.com/api/v1/${KLIPY_KEY}/gifs/trending?customer_id=${KLIPY_CID}`,
  );
}

async function fetchSearch(q: string): Promise<GifItem[]> {
  return fetchPages(
    `https://api.klipy.com/api/v1/${KLIPY_KEY}/gifs/search?q=${encodeURIComponent(q)}&customer_id=${KLIPY_CID}`,
  );
}

// ── Drawing ───────────────────────────────────────────────────────────────────
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y,     x + w, y + r,     r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x,     y + h, x,     y + h - r, r);
  ctx.lineTo(x,     y + r);
  ctx.arcTo(x,     y,     x + r, y,         r);
  ctx.closePath();
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, cw: number,
  gif: GifItem,
  video: HTMLVideoElement | null,
  hover: boolean,
) {
  ctx.save();
  roundRect(ctx, x, y, cw, cw, RADIUS);
  ctx.clip();

  if (video && video.readyState >= 2) {
    const vw   = video.videoWidth;
    const vh   = video.videoHeight;
    const side = Math.min(vw, vh);
    ctx.drawImage(video, (vw - side) / 2, (vh - side) / 2, side, side, x, y, cw, cw);
  } else {
    ctx.fillStyle = "#0c0c0c";
    ctx.fillRect(x, y, cw, cw);
    ctx.fillStyle = "rgba(255,255,255,0.07)";
    ctx.font = "400 9px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("…", x + cw / 2, y + cw / 2);
  }

  if (hover) {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(x, y, cw, cw);
    const label = gif.title.length > 22 ? gif.title.slice(0, 20) + "…" : gif.title;
    ctx.font = "600 11px monospace";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + cw / 2, y + cw / 2 - 8);
    ctx.font = "400 9px monospace";
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fillText("⎘ copy", x + cw / 2, y + cw / 2 + 10);
  }

  ctx.restore();
  roundRect(ctx, x, y, cw, cw, RADIUS);
  ctx.strokeStyle = hover ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.05)";
  ctx.lineWidth = 1;
  ctx.stroke();
}

// ── Component ─────────────────────────────────────────────────────────────────
export function GodlyGifs() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const camRef     = useRef({ x: 0, y: 0 });
  const velRef     = useRef({ x: 0, y: 0 });
  const dragRef    = useRef({ active: false, lastX: 0, lastY: 0, moved: false });
  const mouseRef   = useRef({ x: -9999, y: -9999 });
  const rafRef     = useRef<number>(0);
  const gifsRef    = useRef<GifItem[]>([]);
  const videosRef  = useRef<(HTMLVideoElement | null)[]>([]);
  const visibleRef = useRef(new Set<number>());
  const stageRef   = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  const [cursor,    setCursor]    = useState<"grab" | "grabbing">("grab");
  const [loaded,    setLoaded]    = useState(false);
  const [expanded,  setExpanded]  = useState(false);
  const [query,     setQuery]     = useState("");
  const [searching, setSearching] = useState(false);
  const [toast,     setToast]     = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  };
  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;

  // ── Load gifs (tears down old videos) ────────────────────────────────────
  const loadGifs = (gifs: GifItem[]) => {
    videosRef.current.forEach((v) => { v?.pause(); v?.remove(); });
    visibleRef.current = new Set();
    gifsRef.current   = gifs;
    videosRef.current = gifs.map((g) => {
      const vid = document.createElement("video");
      vid.src         = g.mp4Url;
      vid.loop        = true;
      vid.muted       = true;
      vid.playsInline = true;
      vid.preload     = "auto";
      stageRef.current?.appendChild(vid);
      return vid;
    });
    camRef.current = { x: 0, y: 0 };
    velRef.current = { x: 0, y: 0 };
  };

  useEffect(() => {
    fetchTrending().then((gifs) => {
      loadGifs(gifs);
      setLoaded(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Search ────────────────────────────────────────────────────────────────
  const handleSearch = async () => {
    const q = query.trim();
    setSearching(true);
    const gifs = q ? await fetchSearch(q) : await fetchTrending();
    loadGifs(gifs);
    setSearching(false);
    setExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleExpand = () => {
    setExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 10);
  };

  const handleCollapse = () => {
    setExpanded(false);
    setQuery("");
  };

  // ── Canvas loop ───────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width  = canvas.offsetWidth  * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = (_now: number) => {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);

      if (!dragRef.current.active) {
        velRef.current.x *= FRICTION;
        velRef.current.y *= FRICTION;
        camRef.current.x += velRef.current.x;
        camRef.current.y += velRef.current.y;
      }

      const gifs = gifsRef.current;
      const N    = gifs.length;

      if (N === 0) {
        ctx.fillStyle    = "rgba(255,255,255,0.15)";
        ctx.font         = "400 12px monospace";
        ctx.textAlign    = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("loading gifs…", W / 2, H / 2);
        rafRef.current = requestAnimationFrame(draw as FrameRequestCallback);
        return;
      }

      const cw     = cellSize();
      const stride = cw + GAP;
      const cam    = camRef.current;
      const mx     = mouseRef.current.x;
      const my     = mouseRef.current.y;

      const col0 = Math.floor(cam.x / stride) - 1;
      const col1 = Math.ceil((cam.x + W) / stride) + 1;
      const row0 = Math.floor(cam.y / stride) - 1;
      const row1 = Math.ceil((cam.y + H) / stride) + 1;

      const nowPlaying = new Set<number>();

      for (let row = row0; row <= row1; row++) {
        for (let col = col0; col <= col1; col++) {
          const sx  = col * stride - cam.x;
          const sy  = row * stride - cam.y;
          const idx = (((col * 7 + row * 13) % N) + N) % N;
          const gif = gifs[idx];
          if (!gif?.mp4Url) continue;
          const anyVisible = sx + cw > 0 && sy + cw > 0 && sx < W && sy < H;
          if (anyVisible) nowPlaying.add(idx);
          const video = videosRef.current[idx];
          const hover = mx >= sx && mx <= sx + cw && my >= sy && my <= sy + cw;
          drawCell(ctx, sx, sy, cw, gif, video, hover);
        }
      }

      const prev = visibleRef.current;
      videosRef.current.forEach((vid, i) => {
        if (!vid) return;
        if (nowPlaying.has(i) && !prev.has(i))      vid.play().catch(() => {});
        else if (!nowPlaying.has(i) && prev.has(i)) { vid.pause(); vid.currentTime = 0; }
      });
      visibleRef.current = nowPlaying;

      rafRef.current = requestAnimationFrame(draw as FrameRequestCallback);
    };
    rafRef.current = requestAnimationFrame(draw as FrameRequestCallback);

    const onDown = (e: PointerEvent) => {
      dragRef.current = { active: true, lastX: e.clientX, lastY: e.clientY, moved: false };
      velRef.current  = { x: 0, y: 0 };
      setCursor("grabbing");
    };
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      if (!dragRef.current.active) return;
      const dx = e.clientX - dragRef.current.lastX;
      const dy = e.clientY - dragRef.current.lastY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragRef.current.moved = true;
      camRef.current.x -= dx;
      camRef.current.y -= dy;
      velRef.current.x = velRef.current.x * 0.6 + -dx * 0.4;
      velRef.current.y = velRef.current.y * 0.6 + -dy * 0.4;
      dragRef.current.lastX = e.clientX;
      dragRef.current.lastY = e.clientY;
    };
    const onUp = (e: PointerEvent) => {
      if (e.target !== canvas) { dragRef.current.active = false; setCursor("grab"); return; }
      const wasDrag = dragRef.current.moved;
      dragRef.current.active = false;
      setCursor("grab");
      if (!wasDrag) {
        const rect   = canvas.getBoundingClientRect();
        const cx     = e.clientX - rect.left;
        const cy     = e.clientY - rect.top;
        const N      = gifsRef.current.length;
        if (!N) return;
        const cw     = cellSize();
        const stride = cw + GAP;
        const col    = Math.floor((cx + camRef.current.x) / stride);
        const row    = Math.floor((cy + camRef.current.y) / stride);
        const sx     = col * stride - camRef.current.x;
        const sy     = row * stride - camRef.current.y;
        if (cx >= sx && cx <= sx + cw && cy >= sy && cy <= sy + cw) {
          const idx = (((col * 7 + row * 13) % N) + N) % N;
          const gif = gifsRef.current[idx];
          if (gif?.mp4Url) {
            navigator.clipboard.writeText(gif.mp4Url).catch(() => {});
            showToastRef.current(`copied link — ${gif.title}`);
          }
        }
      }
    };
    const onLeave = () => {
      dragRef.current.active = false;
      mouseRef.current = { x: -9999, y: -9999 };
      setCursor("grab");
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      velRef.current.x += e.deltaX * 0.25;
      velRef.current.y += e.deltaY * 0.25;
    };

    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup",   onUp);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup",   onUp);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("wheel", onWheel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-full" style={{ backgroundColor: "#080808" }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block select-none"
        style={{ cursor, touchAction: "none" }}
      />

      {/* ── Expanding search ─────────────────────────────────────────────── */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)" }}
      >
        <div
          style={{
            width:           expanded ? 300 : 44,
            height:          44,
            borderRadius:    9999,
            overflow:        "hidden",
            display:         "flex",
            alignItems:      "center",
            backgroundColor: "rgba(8,8,8,0.88)",
            backdropFilter:  "blur(20px)",
            border:          "1px solid rgba(255,255,255,0.12)",
            transition:      "width 0.28s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          {/* Search icon button — always present, fades when expanded */}
          <button
            onClick={expanded ? undefined : handleExpand}
            style={{
              flexShrink:     0,
              width:          44,
              height:         44,
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              color:          expanded ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.7)",
              cursor:         expanded ? "default" : "pointer",
              transition:     "color 0.2s",
            }}
          >
            {/* Search icon (inline SVG — no lucide dep) */}
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4" />
              <line x1="10" y1="10" x2="14" y2="14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>

          {/* Input + X — only interactive when expanded */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); if (e.key === "Escape") handleCollapse(); }}
            placeholder="search gifs…"
            style={{
              flex:         1,
              background:   "transparent",
              border:       "none",
              outline:      "none",
              color:        "#fff",
              fontFamily:   "monospace",
              fontSize:     11,
              opacity:      expanded ? 1 : 0,
              pointerEvents: expanded ? "auto" : "none",
              transition:   "opacity 0.2s 0.05s",
              minWidth:     0,
            }}
          />

          {/* X button */}
          <button
            onClick={handleCollapse}
            style={{
              flexShrink:     0,
              width:          36,
              height:         36,
              marginRight:    4,
              borderRadius:   9999,
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              color:          "rgba(255,255,255,0.4)",
              opacity:        expanded ? 1 : 0,
              pointerEvents:  expanded ? "auto" : "none",
              transition:     "opacity 0.15s, background 0.15s",
              cursor:         "pointer",
              background:     "transparent",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <line x1="1" y1="1" x2="10" y2="10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              <line x1="10" y1="1" x2="1"  y2="10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>

          {/* Search submit */}
          <button
            onClick={handleSearch}
            disabled={searching}
            style={{
              flexShrink:    0,
              marginRight:   6,
              padding:       "3px 10px",
              borderRadius:  9999,
              fontFamily:    "monospace",
              fontSize:      10,
              color:         searching ? "rgba(255,255,255,0.25)" : "#fff",
              border:        "1px solid rgba(255,255,255,0.15)",
              background:    "transparent",
              cursor:        searching ? "default" : "pointer",
              whiteSpace:    "nowrap",
              opacity:       expanded ? 1 : 0,
              pointerEvents: expanded ? "auto" : "none",
              transition:    "opacity 0.15s",
            }}
          >
            {searching ? "…" : "go"}
          </button>
        </div>
      </div>

      {/* ── Toast ────────────────────────────────────────────────────────── */}
      {toast && (
        <div
          style={{
            position:        "fixed",
            bottom:          76,
            left:            "50%",
            transform:       "translateX(-50%)",
            background:      "rgba(8,8,8,0.88)",
            backdropFilter:  "blur(20px)",
            border:          "1px solid rgba(255,255,255,0.12)",
            color:           "#fff",
            fontFamily:      "monospace",
            fontSize:        11,
            padding:         "8px 16px",
            borderRadius:    9999,
            whiteSpace:      "nowrap",
            pointerEvents:   "none",
          }}
        >
          {toast}
        </div>
      )}

      {/* Videos must be in the DOM for the browser to decode frames */}
      <div ref={stageRef} aria-hidden="true" style={{ position: "fixed", top: -9999, left: -9999, pointerEvents: "none" }} />
    </div>
  );
}
