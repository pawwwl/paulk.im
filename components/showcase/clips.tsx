"use client";

import { useEffect, useRef, useState } from "react";

// ── Config ────────────────────────────────────────────────────────────────────
const GAP = 12;
function cellSize() { return window.innerWidth < 640 ? 120 : 200; }
const RADIUS = 8;
const FRICTION = 0.92;

const PEXELS_KEY = process.env.NEXT_PUBLIC_PEXELS_API_KEY ?? "";

// ── Types ─────────────────────────────────────────────────────────────────────
type ClipItem = {
  id:       string;
  title:    string;
  mp4Url:   string;
  thumbUrl: string;
  w:        number;
  h:        number;
};

type LayoutItem = { x: number; y: number; w: number; h: number; idx: number };
type Layout     = { items: LayoutItem[]; blockW: number; blockH: number };

type PexelsFile = { quality: string; file_type: string; width: number; height: number; link: string };
type PexelsVideo = { id: number; width: number; height: number; image: string; video_files: PexelsFile[] };

// ── Fetch ─────────────────────────────────────────────────────────────────────
function parseClips(data: unknown): ClipItem[] {
  const videos = ((data as Record<string, unknown>)?.videos ?? []) as PexelsVideo[];
  return videos.flatMap((v) => {
    const mp4s = v.video_files.filter((f) => f.file_type === "video/mp4");
    const file = mp4s.find((f) => f.quality === "sd") ?? mp4s.find((f) => f.quality === "hd") ?? mp4s[0];
    if (!file) return [];
    return [{
      id:       String(v.id),
      title:    "",
      mp4Url:   file.link,
      thumbUrl: v.image,
      w:        v.width,
      h:        v.height,
    }];
  });
}

const HEADERS = { Authorization: PEXELS_KEY };

async function fetchTrending(): Promise<ClipItem[]> {
  const [p1, p2] = await Promise.all([
    fetch("https://api.pexels.com/videos/popular?per_page=50&page=1", { headers: HEADERS }).then((r) => r.json()),
    fetch("https://api.pexels.com/videos/popular?per_page=50&page=2", { headers: HEADERS }).then((r) => r.json()),
  ]);
  return [...parseClips(p1), ...parseClips(p2)];
}

async function fetchSearch(q: string): Promise<ClipItem[]> {
  const [p1, p2] = await Promise.all([
    fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(q)}&per_page=50&page=1`, { headers: HEADERS }).then((r) => r.json()),
    fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(q)}&per_page=50&page=2`, { headers: HEADERS }).then((r) => r.json()),
  ]);
  return [...parseClips(p1), ...parseClips(p2)];
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
  x: number, y: number, w: number, h: number,
  clip: ClipItem,
  video: HTMLVideoElement | null,
  thumb: HTMLImageElement | null,
  hover: boolean,
  playing: boolean,
) {
  ctx.save();
  roundRect(ctx, x, y, w, h, RADIUS);
  ctx.clip();

  ctx.fillStyle = "#000";
  ctx.fillRect(x, y, w, h);

  if (playing && video && video.readyState >= 2) {
    ctx.drawImage(video, x, y, w, h);
  } else if (thumb && thumb.complete && thumb.naturalWidth > 0) {
    ctx.drawImage(thumb, x, y, w, h);
  } else {
    ctx.fillStyle = "#111";
    ctx.fillRect(x, y, w, h);
  }

  const ref = Math.min(w, h);

  if (hover || !playing) {
    ctx.fillStyle = playing ? "rgba(0,0,0,0)" : "rgba(0,0,0,0.42)";
    if (!playing) ctx.fillRect(x, y, w, h);

    if (hover && !playing) {
      const pr = ref * 0.18;
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2, pr, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.fill();
      ctx.fillStyle = "#fff";
      const tx = x + w / 2 - pr * 0.28;
      const ty = y + h / 2;
      ctx.beginPath();
      ctx.moveTo(tx - pr * 0.3, ty - pr * 0.52);
      ctx.lineTo(tx + pr * 0.6, ty);
      ctx.lineTo(tx - pr * 0.3, ty + pr * 0.52);
      ctx.closePath();
      ctx.fill();
    }

    if (hover && playing) {
      const pr = ref * 0.18;
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2, pr, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.fill();
      ctx.fillStyle = "#fff";
      const bw = pr * 0.25;
      const bh = pr * 0.7;
      const bx = x + w / 2 - bw - pr * 0.15;
      const by = y + h / 2 - bh / 2;
      ctx.fillRect(bx,            by, bw, bh);
      ctx.fillRect(bx + bw * 2.2, by, bw, bh);
    }
  }

  ctx.restore();
  roundRect(ctx, x, y, w, h, RADIUS);
  ctx.strokeStyle = hover ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.05)";
  ctx.lineWidth = 1;
  ctx.stroke();
}

// ── Layout ────────────────────────────────────────────────────────────────────
function computeLayout(clips: ClipItem[], canvasWidth: number): Layout {
  if (!clips.length) return { items: [], blockW: 1, blockH: 1 };
  const cw   = cellSize();
  const cols = Math.max(2, Math.floor((canvasWidth + GAP) / (cw + GAP)));
  const colH = new Array<number>(cols).fill(0);
  const items: LayoutItem[] = [];

  for (let i = 0; i < clips.length; i++) {
    const ar  = (clips[i].w / clips[i].h) || 1;
    const ch  = Math.round(cw / ar);
    const col = colH.indexOf(Math.min(...colH));
    items.push({ x: col * (cw + GAP), y: colH[col], w: cw, h: ch, idx: i });
    colH[col] += ch + GAP;
  }

  // blockW includes a trailing GAP so adjacent tiles are spaced consistently
  return { items, blockW: cols * (cw + GAP), blockH: Math.max(...colH) };
}

// ── Component ─────────────────────────────────────────────────────────────────
export function GodlyClips() {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const camRef      = useRef({ x: 0, y: 0 });
  const velRef      = useRef({ x: 0, y: 0 });
  const dragRef     = useRef({ active: false, lastX: 0, lastY: 0, moved: false });
  const mouseRef    = useRef({ x: -9999, y: -9999 });
  const rafRef      = useRef<number>(0);
  const clipsRef    = useRef<ClipItem[]>([]);
  const videosRef   = useRef<(HTMLVideoElement | null)[]>([]);
  const thumbsRef   = useRef<(HTMLImageElement | null)[]>([]);
  const playingRef  = useRef<number | null>(null);
  const layoutRef   = useRef<Layout | null>(null);
  const stageRef    = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLInputElement>(null);

  const [cursor,    setCursor]    = useState<"grab" | "grabbing">("grab");
  const [loaded,    setLoaded]    = useState(false);
  const [expanded,  setExpanded]  = useState(false);
  const [query,     setQuery]     = useState("");
  const [searching, setSearching] = useState(false);

  // ── Load clips (tears down old videos) ───────────────────────────────────
  const loadClips = (clips: ClipItem[]) => {
    videosRef.current.forEach((v) => { v?.pause(); v?.remove(); });
    playingRef.current = null;
    clipsRef.current  = clips;
    videosRef.current = clips.map((c) => {
      const vid = document.createElement("video");
      vid.src         = c.mp4Url;
      vid.loop        = true;
      vid.muted       = true;
      vid.playsInline = true;
      vid.preload     = "metadata";
      stageRef.current?.appendChild(vid);
      return vid;
    });
    thumbsRef.current = clips.map((c) => {
      if (!c.thumbUrl) return null;
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.src = c.thumbUrl;
      return img;
    });
    camRef.current  = { x: 0, y: 0 };
    velRef.current  = { x: 0, y: 0 };
    layoutRef.current = computeLayout(clips, canvasRef.current?.offsetWidth ?? window.innerWidth);
  };

  useEffect(() => {
    fetchTrending().then((clips) => {
      loadClips(clips);
      setLoaded(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Search ────────────────────────────────────────────────────────────────
  const handleSearch = async () => {
    const q = query.trim();
    setSearching(true);
    const clips = q ? await fetchSearch(q) : await fetchTrending();
    loadClips(clips);
    setSearching(false);
    setExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleExpand  = () => { setExpanded(true); setTimeout(() => inputRef.current?.focus(), 10); };
  const handleCollapse = () => { setExpanded(false); setQuery(""); };

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
      if (clipsRef.current.length)
        layoutRef.current = computeLayout(clipsRef.current, canvas.offsetWidth);
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

      const clips  = clipsRef.current;
      const layout = layoutRef.current;

      if (!layout || !clips.length) {
        ctx.fillStyle    = "rgba(255,255,255,0.15)";
        ctx.font         = "400 12px monospace";
        ctx.textAlign    = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("loading clips…", W / 2, H / 2);
        rafRef.current = requestAnimationFrame(draw as FrameRequestCallback);
        return;
      }

      const { items, blockW, blockH } = layout;
      const cam = camRef.current;
      const mx  = mouseRef.current.x;
      const my  = mouseRef.current.y;

      const tileCol0 = Math.floor(cam.x / blockW) - 1;
      const tileCol1 = Math.ceil((cam.x + W) / blockW) + 1;
      const tileRow0 = Math.floor(cam.y / blockH) - 1;
      const tileRow1 = Math.ceil((cam.y + H) / blockH) + 1;

      for (let tr = tileRow0; tr <= tileRow1; tr++) {
        for (let tc = tileCol0; tc <= tileCol1; tc++) {
          for (const item of items) {
            const sx = tc * blockW + item.x - cam.x;
            const sy = tr * blockH + item.y - cam.y;
            if (sx + item.w < 0 || sx > W || sy + item.h < 0 || sy > H) continue;
            const hover   = mx >= sx && mx <= sx + item.w && my >= sy && my <= sy + item.h;
            const playing = playingRef.current === item.idx;
            drawCell(ctx, sx, sy, item.w, item.h, clips[item.idx], videosRef.current[item.idx], thumbsRef.current[item.idx], hover, playing);
          }
        }
      }

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
        const layout = layoutRef.current;
        if (!layout || !layout.items.length) return;

        const { blockW, blockH, items } = layout;
        const localX = ((cx + camRef.current.x) % blockW + blockW) % blockW;
        const localY = ((cy + camRef.current.y) % blockH + blockH) % blockH;
        const item   = items.find((it) => localX >= it.x && localX <= it.x + it.w && localY >= it.y && localY <= it.y + it.h);
        if (!item) return;

        const vid = videosRef.current[item.idx];
        if (!vid) return;
        if (playingRef.current === item.idx) {
          vid.pause();
          playingRef.current = null;
        } else {
          const prev = playingRef.current;
          if (prev !== null) videosRef.current[prev]?.pause();
          playingRef.current = item.idx;
          vid.play().catch(() => {});
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

    canvas.addEventListener("pointerdown",  onDown);
    window.addEventListener("pointermove",   onMove);
    window.addEventListener("pointerup",     onUp);
    canvas.addEventListener("pointerleave",  onLeave);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      canvas.removeEventListener("pointerdown",  onDown);
      window.removeEventListener("pointermove",   onMove);
      window.removeEventListener("pointerup",     onUp);
      canvas.removeEventListener("pointerleave",  onLeave);
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
            width: expanded ? 300 : 44, height: 44, borderRadius: 9999,
            overflow: "hidden", display: "flex", alignItems: "center",
            backgroundColor: "rgba(8,8,8,0.88)", backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.12)",
            transition: "width 0.28s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          <button
            onClick={expanded ? undefined : handleExpand}
            style={{
              flexShrink: 0, width: 44, height: 44,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: expanded ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.7)",
              cursor: expanded ? "default" : "pointer", transition: "color 0.2s",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4" />
              <line x1="10" y1="10" x2="14" y2="14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); if (e.key === "Escape") handleCollapse(); }}
            placeholder="search clips…"
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              color: "#fff", fontFamily: "monospace", fontSize: 11,
              opacity: expanded ? 1 : 0, pointerEvents: expanded ? "auto" : "none",
              transition: "opacity 0.2s 0.05s", minWidth: 0,
            }}
          />

          <button
            onClick={handleCollapse}
            style={{
              flexShrink: 0, width: 36, height: 36, marginRight: 4, borderRadius: 9999,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "rgba(255,255,255,0.4)", opacity: expanded ? 1 : 0,
              pointerEvents: expanded ? "auto" : "none",
              transition: "opacity 0.15s, background 0.15s",
              cursor: "pointer", background: "transparent",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <line x1="1" y1="1" x2="10" y2="10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              <line x1="10" y1="1" x2="1"  y2="10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>

          <button
            onClick={handleSearch}
            disabled={searching}
            style={{
              flexShrink: 0, marginRight: 6, padding: "3px 10px", borderRadius: 9999,
              fontFamily: "monospace", fontSize: 10,
              color: searching ? "rgba(255,255,255,0.25)" : "#fff",
              border: "1px solid rgba(255,255,255,0.15)", background: "transparent",
              cursor: searching ? "default" : "pointer", whiteSpace: "nowrap",
              opacity: expanded ? 1 : 0, pointerEvents: expanded ? "auto" : "none",
              transition: "opacity 0.15s",
            }}
          >
            {searching ? "…" : "go"}
          </button>
        </div>
      </div>

      {/* Videos must be in the DOM for the browser to decode frames */}
      <div ref={stageRef} aria-hidden="true" style={{ position: "fixed", top: -9999, left: -9999, pointerEvents: "none" }} />
    </div>
  );
}
