"use client";

import { useEffect, useRef, useState } from "react";

// ── Config ────────────────────────────────────────────────────────────────────
const CELL_W   = 200;
const CELL_H   = 200;
const GAP      = 16;
const STRIDE_X = CELL_W + GAP;
const STRIDE_Y = CELL_H + GAP;
const RADIUS   = 8;
const FRICTION  = 0.88;

// ── Albums to fetch from iTunes ───────────────────────────────────────────────
const SEARCHES = [
  "Kendrick Lamar DAMN",
  "Frank Ocean Blonde",
  "Tyler the Creator Igor",
  "Radiohead OK Computer",
  "Kanye West My Beautiful Dark Twisted Fantasy",
  "The Beatles Abbey Road",
  "Pink Floyd Dark Side of the Moon",
  "Burial Untrue",
  "James Blake James Blake",
  "Bon Iver For Emma Forever Ago",
  "LCD Soundsystem Sound of Silver",
  "Aphex Twin Selected Ambient Works",
  "Daft Punk Random Access Memories",
  "SZA SOS",
  "Floating Points Promises",
  "Four Tet There Is Love in You",
  "Thundercat Drunk",
  "Steve Reich Music for 18 Musicians",
  "John Coltrane A Love Supreme",
  "Miles Davis Kind of Blue",
  "Sufjan Stevens Illinois",
  "Animal Collective Merriweather Post Pavilion",
  "Portishead Dummy",
  "Massive Attack Mezzanine",
  "Caribou Swim",
  "Darkside Psychic",
  "Blood Orange Freetown Sound",
  "Solange A Seat at the Table",
  "Noname Room 25",
  "Little Simz Sometimes I Might Be Introvert",
  "Lane 8 Little Voices",
  "Lane 8 Brightest Lights",
  "Lane 8 Rise",
  "Sultan Shepard Welcome to the Night",
  "Chris Lake Black Book",
  "Chris Lake At War With Yourself",
  "Linkin Park Hybrid Theory",
  "Linkin Park Meteora",
  "Linkin Park Minutes to Midnight",
  "Justice Cross",
  "Justice Audio Video Disco",
  "Justice Woman",
  "Sammy Virji Solid Ground",
  "SG Lewis Times",
  "SG Lewis AudioLust HigherLove",
  "Elderbrook Why Do We Shake in the Cold",
  "Elderbrook Old Friend",
  "The Weeknd After Hours",
  "The Weeknd Starboy",
  "The Weeknd Beauty Behind the Madness",
  "Emancipator Soon It Will Be Cold Enough",
  "Emancipator Safe in the Steep Cliffs",
  "Christian Loeffler Mare",
  "Christian Loeffler Graal",
  "ODESZA A Moment Apart",
  "ODESZA In Return",
  "ODESZA The Last Goodbye",
  "Aaliyah Aaliyah",
  "Aaliyah One in a Million",
  "Brandy Never Say Never",
  "Brandy Full Moon",
  "TLC CrazySexyCool",
  "TLC FanMail",
];

// ── Tags (parallel to SEARCHES) ──────────────────────────────────────────────
const TAGS: string[][] = [
  ["hip-hop"],                  // Kendrick DAMN
  ["r&b", "alternative"],       // Frank Ocean Blonde
  ["hip-hop", "alternative"],   // Tyler Igor
  ["rock", "alternative"],      // Radiohead OK Computer
  ["hip-hop"],                  // Kanye MBDTF
  ["rock", "classic"],          // Beatles Abbey Road
  ["rock", "classic"],          // Pink Floyd DSOTM
  ["electronic", "ambient"],    // Burial Untrue
  ["electronic", "r&b"],        // James Blake
  ["indie", "folk"],            // Bon Iver
  ["electronic", "indie"],      // LCD Soundsystem
  ["electronic", "ambient"],    // Aphex Twin
  ["electronic", "dance"],      // Daft Punk RAM
  ["r&b", "hip-hop"],           // SZA SOS
  ["electronic", "jazz"],       // Floating Points
  ["electronic", "ambient"],    // Four Tet
  ["jazz", "r&b"],              // Thundercat
  ["classical", "ambient"],     // Steve Reich
  ["jazz", "classic"],          // Coltrane
  ["jazz", "classic"],          // Miles Davis
  ["indie", "folk"],            // Sufjan Stevens
  ["indie", "electronic"],      // Animal Collective
  ["electronic", "trip-hop"],   // Portishead
  ["electronic", "trip-hop"],   // Massive Attack
  ["electronic", "indie"],      // Caribou
  ["electronic", "ambient"],    // Darkside
  ["r&b", "indie"],             // Blood Orange
  ["r&b", "soul"],              // Solange
  ["hip-hop"],                  // Noname
  ["hip-hop"],                  // Little Simz
  ["electronic", "dance"],      // Lane 8 Little Voices
  ["electronic", "dance"],      // Lane 8 Brightest Lights
  ["electronic", "dance"],      // Lane 8 Rise
  ["electronic", "dance"],      // Sultan + Shepard
  ["electronic", "dance"],      // Chris Lake Black Book
  ["electronic", "dance"],      // Chris Lake At War
  ["rock"],                     // Linkin Park Hybrid Theory
  ["rock"],                     // Linkin Park Meteora
  ["rock"],                     // Linkin Park Minutes
  ["electronic", "dance"],      // Justice Cross
  ["electronic", "dance"],      // Justice AVD
  ["electronic", "dance"],      // Justice Woman
  ["electronic", "dance"],      // Sammy Virji
  ["r&b", "electronic"],        // SG Lewis Times
  ["r&b", "electronic"],        // SG Lewis AudioLust
  ["electronic", "indie"],      // Elderbrook Cold
  ["electronic", "indie"],      // Elderbrook Old Friend
  ["r&b", "pop"],               // Weeknd After Hours
  ["r&b", "pop"],               // Weeknd Starboy
  ["r&b", "pop"],               // Weeknd Beauty
  ["electronic", "ambient"],    // Emancipator Cold
  ["electronic", "ambient"],    // Emancipator Cliffs
  ["electronic", "ambient"],    // Loeffler Mare
  ["electronic", "ambient"],    // Loeffler Graal
  ["electronic", "indie"],      // ODESZA Moment Apart
  ["electronic", "indie"],      // ODESZA In Return
  ["electronic", "indie"],      // ODESZA Last Goodbye
  ["r&b", "classic"],           // Aaliyah
  ["r&b", "classic"],           // Aaliyah One in a Million
  ["r&b", "classic"],           // Brandy Never Say Never
  ["r&b", "classic"],           // Brandy Full Moon
  ["r&b", "classic"],           // TLC CrazySexyCool
  ["r&b", "classic"],           // TLC FanMail
];

const ALL_TAGS = Array.from(new Set(TAGS.flat())).sort();

type Album = {
  artist: string;
  title: string;
  year: string;
  artUrl: string;
  previewUrl: string;
  grad: [string, string];
  tags: string[];
};

const GRADS: [string, string][] = [
  ["#0d0010", "#1a0020"],
  ["#000d10", "#001a20"],
  ["#100d00", "#201a00"],
  ["#000010", "#00001a"],
  ["#100000", "#200000"],
  ["#001000", "#002000"],
  ["#100010", "#200020"],
  ["#001010", "#002020"],
];

async function fetchAlbum(query: string, idx: number): Promise<Album | null> {
  try {
    // Search for a track (not album) so we get a previewUrl
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=1`,
    );
    const data = await res.json();
    const r = data.results?.[0];
    if (!r) return null;
    return {
      artist:     r.artistName,
      title:      r.collectionName ?? r.trackName,
      year:       r.releaseDate?.slice(0, 4) ?? "",
      artUrl:     r.artworkUrl100.replace("100x100bb", "600x600bb"),
      previewUrl: r.previewUrl ?? "",
      grad:       GRADS[idx % GRADS.length],
      tags:       TAGS[idx] ?? [],
    };
  } catch {
    return null;
  }
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

const WAVE_COLORS = ["#4D96D9", "#F4A020", "#E85D7A", "#5AAD6B"];

function drawWaveBorder(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  now: number,
) {
  const t         = now * 0.001;
  const w         = CELL_W;
  const h         = CELL_H;
  const perimeter = 2 * (w + h);
  const steps     = 240;
  const amp       = 3;
  const freq      = 10;
  const speed     = 3.5;
  const cx        = x + w / 2;
  const cy        = y + h / 2;

  // Build point list
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const progress = i / steps;
    const dist     = progress * perimeter;
    const wave     = amp * Math.sin(freq * progress * Math.PI * 2 - t * speed);
    let px: number, py: number, nx: number, ny: number;
    if (dist < w) {
      px = x + dist;           py = y;     nx = 0;  ny = -1;
    } else if (dist < w + h) {
      px = x + w;              py = y + (dist - w);          nx = 1;  ny = 0;
    } else if (dist < 2 * w + h) {
      px = x + w - (dist - w - h); py = y + h;               nx = 0;  ny = 1;
    } else {
      px = x;                  py = y + h - (dist - 2 * w - h); nx = -1; ny = 0;
    }
    pts.push([px + nx * wave, py + ny * wave]);
  }

  // Conic gradient — rotates with time so color cycles around the border
  const conicAngle = (t * 0.4) % (Math.PI * 2);
  const grad = ctx.createConicGradient(conicAngle, cx, cy);
  WAVE_COLORS.forEach((c, i) => {
    grad.addColorStop(i / WAVE_COLORS.length, c + "bb"); // ~73% opacity
  });
  grad.addColorStop(1, WAVE_COLORS[0] + "bb");

  ctx.save();
  ctx.beginPath();
  pts.forEach(([px, py], i) => i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py));
  ctx.closePath();
  ctx.shadowColor = "rgba(255,255,255,0.25)";
  ctx.shadowBlur  = 6;
  ctx.strokeStyle = grad;
  ctx.lineWidth   = 1.5;
  ctx.stroke();
  ctx.restore();
}

function drawPlayingEffects(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  now: number,
) {
  const t     = now * 0.001;
  const cx    = x + CELL_W / 2;
  const cy    = y + CELL_H / 2;
  const reach = Math.hypot(CELL_W, CELL_H);

  // ── Rotating beam (gradient-tinted) ───────────────────────────────────────
  ctx.save();
  roundRect(ctx, x, y, CELL_W, CELL_H, RADIUS);
  ctx.clip();
  const angle  = (t * 1.2) % (Math.PI * 2);
  const spread = Math.PI / 5;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, reach, angle - spread / 2, angle + spread / 2);
  ctx.closePath();
  const colorIdx = Math.floor((t * 0.4 / (Math.PI * 2)) * WAVE_COLORS.length) % WAVE_COLORS.length;
  const beam = ctx.createLinearGradient(cx, cy, cx + Math.cos(angle) * reach, cy + Math.sin(angle) * reach);
  beam.addColorStop(0, WAVE_COLORS[colorIdx] + "30"); // very subtle
  beam.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = beam;
  ctx.fill();
  ctx.restore();

  // ── Sine wave border ──────────────────────────────────────────────────────
  drawWaveBorder(ctx, x, y, now);
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  album: Album,
  img: HTMLImageElement | null,
  hover: boolean,
  playing: boolean,
  now: number,
) {
  ctx.save();
  roundRect(ctx, x, y, CELL_W, CELL_H, RADIUS);
  ctx.clip();

  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, x, y, CELL_W, CELL_H);
  } else {
    const g = ctx.createLinearGradient(x, y, x + CELL_W, y + CELL_H);
    g.addColorStop(0, album.grad[0]);
    g.addColorStop(1, album.grad[1]);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, CELL_W, CELL_H);
  }

  if (hover || playing) {
    ctx.fillStyle = playing ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.72)";
    ctx.fillRect(x, y, CELL_W, CELL_H);

    // Play/pause icon
    const iconY = y + CELL_H / 2 - 30;
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "22px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(playing ? "⏸" : "▶", x + CELL_W / 2, iconY);

    // Artist
    ctx.font = "600 12px monospace";
    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "middle";
    ctx.fillText(album.artist, x + CELL_W / 2, y + CELL_H / 2);

    // Title
    ctx.font = "400 10px monospace";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    const title = album.title.length > 28 ? album.title.slice(0, 26) + "…" : album.title;
    ctx.fillText(title, x + CELL_W / 2, y + CELL_H / 2 + 16);

    // Year
    ctx.font = "400 9px monospace";
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillText(album.year, x + CELL_W / 2, y + CELL_H / 2 + 30);
  }

  ctx.restore();

  if (playing) {
    drawPlayingEffects(ctx, x, y, now);
  } else {
    // Static border
    roundRect(ctx, x, y, CELL_W, CELL_H, RADIUS);
    ctx.strokeStyle = hover ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export function GodlyCanvas() {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const camRef      = useRef({ x: 0, y: 0 });
  const velRef      = useRef({ x: 0, y: 0 });
  const dragRef     = useRef({ active: false, lastX: 0, lastY: 0, moved: false });
  const mouseRef    = useRef({ x: -9999, y: -9999 });
  const rafRef      = useRef<number>(0);
  const albumsRef   = useRef<(Album | null)[]>([]);
  const imgsRef     = useRef<(HTMLImageElement | null)[]>([]);
  const audioRef    = useRef<HTMLAudioElement | null>(null);
  const playingIdx  = useRef<number | null>(null);
  const [cursor, setCursor]       = useState<"grab" | "grabbing">("grab");
  const [loaded, setLoaded]       = useState(false);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const activeTagRef              = useRef<string | null>(null);

  useEffect(() => {
    Promise.all(SEARCHES.map(fetchAlbum)).then((albums) => {
      albumsRef.current = albums;
      imgsRef.current   = albums.map((a) => {
        if (!a) return null;
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.src = a.artUrl;
        return img;
      });
      setLoaded(true);
    });
  }, []);

  // Play/stop helper
  const playAlbum = (idx: number) => {
    const album = albumsRef.current[idx];
    if (!album?.previewUrl) return;

    // Toggle off if same
    if (playingIdx.current === idx) {
      audioRef.current?.pause();
      audioRef.current = null;
      playingIdx.current = null;
      setPlayingId(null);
      return;
    }

    // Stop previous
    audioRef.current?.pause();
    const audio = new Audio(album.previewUrl);
    audio.volume = 0.7;
    audio.play().catch(() => {});
    audio.addEventListener("ended", () => {
      playingIdx.current = null;
      setPlayingId(null);
    });
    audioRef.current  = audio;
    playingIdx.current = idx;
    setPlayingId(idx);
  };

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

    const draw = (now: number) => {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);

      if (!dragRef.current.active) {
        velRef.current.x *= FRICTION;
        velRef.current.y *= FRICTION;
        camRef.current.x += velRef.current.x;
        camRef.current.y += velRef.current.y;
      }

      const albums = albumsRef.current;
      const N = albums.length;

      if (N === 0) {
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.font = "400 12px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("loading…", W / 2, H / 2);
        rafRef.current = requestAnimationFrame(draw as FrameRequestCallback);
        return;
      }

      const cam = camRef.current;
      const mx  = mouseRef.current.x;
      const my  = mouseRef.current.y;

      const col0 = Math.floor(cam.x / STRIDE_X) - 1;
      const col1 = Math.ceil((cam.x + W) / STRIDE_X) + 1;
      const row0 = Math.floor(cam.y / STRIDE_Y) - 1;
      const row1 = Math.ceil((cam.y + H) / STRIDE_Y) + 1;

      for (let row = row0; row <= row1; row++) {
        for (let col = col0; col <= col1; col++) {
          const sx = col * STRIDE_X - cam.x;
          const sy = row * STRIDE_Y - cam.y;
          const idx = (((col * 7 + row * 13) % N) + N) % N;
          const album = albums[idx];
          if (!album) continue;
          const tag = activeTagRef.current;
          const filtered = tag !== null && !album.tags.includes(tag);
          const img     = imgsRef.current[idx];
          const hover   = !filtered && mx >= sx && mx <= sx + CELL_W && my >= sy && my <= sy + CELL_H;
          const playing = playingIdx.current === idx;
          drawCell(ctx, sx, sy, album, img, hover, playing, now);
          if (filtered) {
            ctx.save();
            roundRect(ctx, sx, sy, CELL_W, CELL_H, RADIUS);
            ctx.fillStyle = "rgba(0,0,0,0.65)";
            ctx.fill();
            ctx.restore();
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
      velRef.current.x  = -dx;
      velRef.current.y  = -dy;
      dragRef.current.lastX = e.clientX;
      dragRef.current.lastY = e.clientY;
    };
    const onUp = (e: PointerEvent) => {
      if (e.target !== canvas) { dragRef.current.active = false; setCursor("grab"); return; }
      const wasDrag = dragRef.current.moved;
      dragRef.current.active = false;
      setCursor("grab");

      if (!wasDrag) {
        // It was a click — find which cell
        const rect = canvas.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        const albums = albumsRef.current;
        const N = albums.length;
        if (N === 0) return;
        const cam = camRef.current;
        const col = Math.floor((cx + cam.x) / STRIDE_X);
        const row = Math.floor((cy + cam.y) / STRIDE_Y);
        const sx  = col * STRIDE_X - cam.x;
        const sy  = row * STRIDE_Y - cam.y;
        if (cx >= sx && cx <= sx + CELL_W && cy >= sy && cy <= sy + CELL_H) {
          const idx = (((col * 7 + row * 13) % N) + N) % N;
          playAlbum(idx);
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

  // Stop audio on unmount
  useEffect(() => () => { audioRef.current?.pause(); }, []);

  const [filterOpen, setFilterOpen] = useState(false);

  const toggleTag = (tag: string) => {
    const next = activeTag === tag ? null : tag;
    activeTagRef.current = next;
    setActiveTag(next);
  };

  return (
    <div className="relative w-full h-full" style={{ backgroundColor: "#080808" }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block select-none"
        style={{ cursor }}
        data-playing={playingId}
      />

      {/* Shuffle button */}
      <button
        onClick={() => {
          const albums = albumsRef.current.filter(Boolean);
          if (!albums.length) return;
          const pool = activeTag
            ? albumsRef.current.map((a, i) => ({ a, i })).filter(({ a }) => a?.tags.includes(activeTag))
            : albumsRef.current.map((a, i) => ({ a, i }));
          if (!pool.length) return;
          const { i } = pool[Math.floor(Math.random() * pool.length)];
          playAlbum(i);
        }}
        className="fixed bottom-6 right-20 w-11 h-11 flex items-center justify-center transition-all duration-200"
        style={{
          border: "1px solid rgba(255,255,255,0.25)",
          backgroundColor: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(10px)",
          color: "rgba(255,255,255,0.85)",
        }}
        title="Shuffle"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M1 4h2.5a4 4 0 0 1 3.2 1.6L8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M1 12h2.5a4 4 0 0 0 3.2-1.6l3.6-4.8A4 4 0 0 1 13.5 4H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M8 9l1.3 1.4A4 4 0 0 0 12.5 12H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <polyline points="13,2 15,4 13,6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="13,10 15,12 13,14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Filter button */}
      <button
        onClick={() => setFilterOpen((o) => !o)}
        className="fixed bottom-6 right-6 w-11 h-11 flex items-center justify-center transition-all duration-200"
        style={{
          border: `1px solid ${filterOpen ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.25)"}`,
          backgroundColor: filterOpen ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.7)",
          backdropFilter: "blur(10px)",
          color: "rgba(255,255,255,0.85)",
        }}
        title="Filter by genre"
      >
        {/* Filter icon */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <line x1="2" y1="4"  x2="14" y2="4"  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="4" y1="8"  x2="12" y2="8"  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="6" y1="12" x2="10" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        {activeTag && (
          <span
            className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
            style={{ backgroundColor: "#E85D7A" }}
          />
        )}
      </button>

      {/* Filter dial */}
      {filterOpen && (
        <div
          className="fixed bottom-20 right-6 p-4 flex flex-col gap-2"
          style={{
            backgroundColor: "rgba(8,8,8,0.82)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.12)",
            minWidth: 160,
          }}
        >
          <p className="font-mono text-[9px] tracking-[0.2em] uppercase mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>
            Genre
          </p>
          {ALL_TAGS.map((tag) => {
            const active = activeTag === tag;
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className="flex items-center gap-2 font-mono text-[11px] tracking-widest uppercase text-left transition-all duration-150 px-2 py-1"
                style={{
                  color: active ? "#fff" : "rgba(255,255,255,0.5)",
                  backgroundColor: active ? "rgba(255,255,255,0.08)" : "transparent",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all duration-150"
                  style={{ backgroundColor: active ? "#fff" : "rgba(255,255,255,0.2)" }}
                />
                {tag}
              </button>
            );
          })}
          {activeTag && (
            <button
              onClick={() => { activeTagRef.current = null; setActiveTag(null); }}
              className="mt-1 font-mono text-[9px] tracking-widest uppercase transition-colors duration-150"
              style={{ color: "#E85D7A", textAlign: "left", paddingLeft: 8 }}
            >
              clear ×
            </button>
          )}
        </div>
      )}
    </div>
  );
}
