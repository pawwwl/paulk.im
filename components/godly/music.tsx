"use client";

import { useEffect, useRef, useState } from "react";

// ── Config ────────────────────────────────────────────────────────────────────
const GAP = 12;
function cellSize() {
  return window.innerWidth < 640 ? 120 : 200;
}
const RADIUS = 8;
const FRICTION = 0.92;

// ── Artists to fetch from iTunes ──────────────────────────────────────────────
// [artist, count] — count controls how many distinct songs to pull per artist.
const ARTISTS: [string, number][] = [
  ["Kendrick Lamar", 1],
  ["Frank Ocean", 1],
  ["Tyler the Creator", 1],
  ["Radiohead", 1],
  ["Kanye West", 1],
  ["The Beatles", 1],
  ["Pink Floyd", 1],
  ["Bon Iver", 4],
  ["LCD Soundsystem", 1],
  ["Aphex Twin", 1],
  ["Daft Punk", 4],
  ["SZA", 1],
  ["Four Tet", 1],
  ["Thundercat", 1],
  ["Portishead", 1],
  ["Massive Attack", 4],
  ["Noname", 1],
  ["Little Simz", 1],
  ["DJ Snake", 4],
  ["Lane 8", 5],
  ["Sultan + Shepard", 5],
  ["Chris Lake", 5],
  ["Linkin Park", 3],
  ["Justice", 5],
  ["Sammy Virji", 1],
  ["SG Lewis", 5],
  ["Elderbrook", 5],
  ["The Weeknd", 3],
  ["Emancipator", 5],
  ["Christian Loeffler", 5],
  ["ODESZA", 5],
  ["Aaliyah", 4],
  ["Brandy", 4],
  ["TLC", 4],
];

type Album = {
  artist: string;
  track: string;
  title: string;
  year: string;
  artUrl: string;
  previewUrl: string;
  grad: [string, string];
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

async function fetchAllAlbums(): Promise<(Album | null)[]> {
  // Fetch each artist once with attribute=artistTerm, using the declared count
  const artistResults = new Map<string, Record<string, unknown>[]>();
  await Promise.all(
    ARTISTS.map(async ([artist, count]) => {
      try {
        const limit = Math.max(count * 2, 5);
        const res = await fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(artist)}&entity=song&attribute=artistTerm&limit=${limit}`,
        );
        const data = await res.json();
        const results: Record<string, unknown>[] = data.results ?? [];
        // Shuffle so we get different tracks each load
        for (let k = results.length - 1; k > 0; k--) {
          const j = Math.floor(Math.random() * (k + 1));
          [results[k], results[j]] = [results[j], results[k]];
        }
        artistResults.set(artist, results);
      } catch {
        artistResults.set(artist, []);
      }
    }),
  );

  // Expand ARTISTS tuples into a flat list, picking sequential results per artist
  let globalIdx = 0;
  const albums: (Album | null)[] = [];
  for (const [artist, count] of ARTISTS) {
    const results = artistResults.get(artist) ?? [];
    for (let i = 0; i < count; i++) {
      const r = results[i];
      albums.push(
        r
          ? {
              artist: String(r.artistName ?? ""),
              track: String(r.trackName ?? ""),
              title: String(r.collectionName ?? r.trackName ?? ""),
              year: String(r.releaseDate ?? "").slice(0, 4),
              artUrl: String(r.artworkUrl100 ?? "").replace(
                "100x100bb",
                "600x600bb",
              ),
              previewUrl: String(r.previewUrl ?? ""),
              grad: GRADS[globalIdx % GRADS.length],
            }
          : null,
      );
      globalIdx++;
    }
  }
  return albums;
}

// ── Drawing ───────────────────────────────────────────────────────────────────
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

const WAVE_COLORS = ["#4D96D9", "#F4A020", "#E85D7A", "#5AAD6B"];

function drawWaveBorder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cw: number,
  now: number,
) {
  const t = now * 0.001;
  const w = cw,
    h = cw;
  const perimeter = 2 * (w + h);
  const steps = 240;
  const amp = 3;
  const freq = 10;
  const speed = 3.5;
  const cx = x + w / 2;
  const cy = y + h / 2;

  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const progress = i / steps;
    const dist = progress * perimeter;
    const wave = amp * Math.sin(freq * progress * Math.PI * 2 - t * speed);
    let px: number, py: number, nx: number, ny: number;
    if (dist < w) {
      px = x + dist;
      py = y;
      nx = 0;
      ny = -1;
    } else if (dist < w + h) {
      px = x + w;
      py = y + (dist - w);
      nx = 1;
      ny = 0;
    } else if (dist < 2 * w + h) {
      px = x + w - (dist - w - h);
      py = y + h;
      nx = 0;
      ny = 1;
    } else {
      px = x;
      py = y + h - (dist - 2 * w - h);
      nx = -1;
      ny = 0;
    }
    pts.push([px + nx * wave, py + ny * wave]);
  }

  const conicAngle = (t * 0.4) % (Math.PI * 2);
  const grad = ctx.createConicGradient(conicAngle, cx, cy);
  WAVE_COLORS.forEach((c, i) => {
    grad.addColorStop(i / WAVE_COLORS.length, c + "bb");
  });
  grad.addColorStop(1, WAVE_COLORS[0] + "bb");

  ctx.save();
  ctx.beginPath();
  pts.forEach(([px, py], i) =>
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py),
  );
  ctx.closePath();
  ctx.shadowColor = "rgba(255,255,255,0.25)";
  ctx.shadowBlur = 6;
  ctx.strokeStyle = grad;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

function drawPlayingEffects(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cw: number,
  now: number,
) {
  const t = now * 0.001;
  const cx = x + cw / 2;
  const cy = y + cw / 2;
  const reach = Math.hypot(cw, cw);

  ctx.save();
  roundRect(ctx, x, y, cw, cw, RADIUS);
  ctx.clip();
  const angle = (t * 1.2) % (Math.PI * 2);
  const spread = Math.PI / 5;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, reach, angle - spread / 2, angle + spread / 2);
  ctx.closePath();
  const colorIdx =
    Math.floor(((t * 0.4) / (Math.PI * 2)) * WAVE_COLORS.length) %
    WAVE_COLORS.length;
  const beam = ctx.createLinearGradient(
    cx,
    cy,
    cx + Math.cos(angle) * reach,
    cy + Math.sin(angle) * reach,
  );
  beam.addColorStop(0, WAVE_COLORS[colorIdx] + "30");
  beam.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = beam;
  ctx.fill();
  ctx.restore();

  drawWaveBorder(ctx, x, y, cw, now);
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cw: number,
  album: Album,
  img: HTMLImageElement | null,
  hover: boolean,
  playing: boolean,
  dimmed: boolean,
  now: number,
) {
  ctx.save();
  roundRect(ctx, x, y, cw, cw, RADIUS);
  ctx.clip();

  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, x, y, cw, cw);
  } else {
    const g = ctx.createLinearGradient(x, y, x + cw, y + cw);
    g.addColorStop(0, album.grad[0]);
    g.addColorStop(1, album.grad[1]);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, cw, cw);
  }

  if (dimmed && !playing) {
    ctx.fillStyle = "rgba(0,0,0,0.72)";
    ctx.fillRect(x, y, cw, cw);
  }

  if (hover || playing) {
    ctx.fillStyle = playing ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.72)";
    ctx.fillRect(x, y, cw, cw);

    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "22px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(playing ? "⏸" : "▶", x + cw / 2, y + cw / 2 - 28);

    ctx.font = "600 11px monospace";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(album.artist, x + cw / 2, y + cw / 2);

    ctx.font = "400 9px monospace";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    const track =
      album.track.length > 24 ? album.track.slice(0, 22) + "…" : album.track;
    ctx.fillText(track, x + cw / 2, y + cw / 2 + 14);

    ctx.font = "400 8px monospace";
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillText(album.year, x + cw / 2, y + cw / 2 + 26);
  }

  ctx.restore();

  if (playing) {
    drawPlayingEffects(ctx, x, y, cw, now);
  } else {
    roundRect(ctx, x, y, cw, cw, RADIUS);
    ctx.strokeStyle = hover
      ? "rgba(255,255,255,0.3)"
      : "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export function GodlyMusic() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const camRef = useRef({ x: 0, y: 0 });
  const velRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef({ active: false, lastX: 0, lastY: 0, moved: false });
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef<number>(0);
  const albumsRef = useRef<(Album | null)[]>([]);
  const imgsRef = useRef<(HTMLImageElement | null)[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playingIdx = useRef<number | null>(null);
  const [cursor, setCursor] = useState<"grab" | "grabbing">("grab");
  const [loaded, setLoaded] = useState(false);
  const [playingId, setPlayingId] = useState<number | null>(null);

  // ── Player state ────────────────────────────────────────────────────────────
  const playlistRef = useRef<number[]>([]); // album indices
  const playlistPosRef = useRef<number>(-1);
  const [playerAlbumIdx, setPlayerAlbumIdx] = useState<number | null>(null);
  const [playerPlaying, setPlayerPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0–1
  const progressRafRef = useRef<number>(0);

  useEffect(() => {
    fetchAllAlbums().then((albums) => {
      albumsRef.current = albums;
      imgsRef.current = albums.map((a) => {
        if (!a) return null;
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.src = a.artUrl;
        return img;
      });
      setLoaded(true);
    });
  }, []);

  // ── Core play-by-album-index (used by canvas clicks + player) ──────────────
  const playAlbumDirect = (idx: number, fromPlayer = false) => {
    const album = albumsRef.current[idx];
    if (!album?.previewUrl) return;

    if (playingIdx.current === idx && !fromPlayer) {
      // Toggle off from canvas click
      audioRef.current?.pause();
      audioRef.current = null;
      playingIdx.current = null;
      setPlayingId(null);
      setPlayerPlaying(false);
      cancelAnimationFrame(progressRafRef.current);
      return;
    }

    audioRef.current?.pause();
    cancelAnimationFrame(progressRafRef.current);

    const audio = new Audio(album.previewUrl);
    audio.volume = 0.7;
    audio.play().catch(() => {});

    const tickProgress = () => {
      if (!audio.duration) {
        progressRafRef.current = requestAnimationFrame(tickProgress);
        return;
      }
      setProgress(audio.currentTime / audio.duration);
      progressRafRef.current = requestAnimationFrame(tickProgress);
    };
    progressRafRef.current = requestAnimationFrame(tickProgress);

    audio.addEventListener("ended", () => {
      cancelAnimationFrame(progressRafRef.current);
      // Auto-advance playlist
      const pos = playlistPosRef.current;
      const list = playlistRef.current;
      if (pos >= 0 && pos < list.length - 1) {
        const nextPos = pos + 1;
        playlistPosRef.current = nextPos;
        playAlbumDirect(list[nextPos], true);
        setPlayerAlbumIdx(list[nextPos]);
      } else {
        playingIdx.current = null;
        setPlayingId(null);
        setPlayerPlaying(false);
        setProgress(0);
      }
    });

    audioRef.current = audio;
    playingIdx.current = idx;
    setPlayingId(idx);
    setPlayerAlbumIdx(idx);
    setPlayerPlaying(true);
    setProgress(0);
  };

  const playAlbum = (idx: number) => {
    const album = albumsRef.current[idx];
    if (!album) return;
    // Scope playlist to this artist so next/prev stays within their songs
    const artistList = albumsRef.current
      .map((a, i) => ({ a, i }))
      .filter(({ a }) => a?.artist === album.artist)
      .map(({ i }) => i);
    playlistRef.current = artistList;
    playlistPosRef.current = artistList.indexOf(idx);
    playAlbumDirect(idx, false);
  };

  // ── Playlist controls ────────────────────────────────────────────────────────
  const buildPlaylist = () => {
    const albums = albumsRef.current;
    const pool = albums.map((a, i) => ({ a, i })).filter(({ a }) => !!a);
    // Fisher-Yates shuffle
    const indices = pool.map(({ i }) => i);
    for (let k = indices.length - 1; k > 0; k--) {
      const j = Math.floor(Math.random() * (k + 1));
      [indices[k], indices[j]] = [indices[j], indices[k]];
    }
    return indices;
  };

  const playerPlay = () => {
    if (playerPlaying) {
      audioRef.current?.pause();
      cancelAnimationFrame(progressRafRef.current);
      setPlayerPlaying(false);
      return;
    }
    if (audioRef.current && playerAlbumIdx !== null) {
      // Resume
      audioRef.current.play().catch(() => {});
      const audio = audioRef.current;
      const tickProgress = () => {
        if (!audio.duration) {
          progressRafRef.current = requestAnimationFrame(tickProgress);
          return;
        }
        setProgress(audio.currentTime / audio.duration);
        progressRafRef.current = requestAnimationFrame(tickProgress);
      };
      progressRafRef.current = requestAnimationFrame(tickProgress);
      setPlayerPlaying(true);
      return;
    }
    // Start fresh tracklist
    const list = buildPlaylist();
    if (!list.length) return;
    playlistRef.current = list;
    playlistPosRef.current = 0;
    setPlayerAlbumIdx(list[0]);
    playAlbumDirect(list[0], true);
  };

  const playerPrev = () => {
    const pos = playlistPosRef.current;
    const list = playlistRef.current;
    if (pos <= 0) return;
    const nextPos = pos - 1;
    playlistPosRef.current = nextPos;
    setPlayerAlbumIdx(list[nextPos]);
    playAlbumDirect(list[nextPos], true);
  };

  const playerNext = () => {
    let list = playlistRef.current;
    let pos = playlistPosRef.current;
    if (!list.length) {
      list = buildPlaylist();
      if (!list.length) return;
      playlistRef.current = list;
      pos = -1;
    }
    if (pos >= list.length - 1) return;
    const nextPos = pos + 1;
    playlistPosRef.current = nextPos;
    setPlayerAlbumIdx(list[nextPos]);
    playAlbumDirect(list[nextPos], true);
  };

  const playerShuffle = () => {
    const list = buildPlaylist();
    if (!list.length) return;
    playlistRef.current = list;
    playlistPosRef.current = 0;
    setPlayerAlbumIdx(list[0]);
    playAlbumDirect(list[0], true);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = canvas.offsetWidth * dpr;
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

      const cw = cellSize();
      const stride = cw + GAP;
      const cam = camRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      const col0 = Math.floor(cam.x / stride) - 1;
      const col1 = Math.ceil((cam.x + W) / stride) + 1;
      const row0 = Math.floor(cam.y / stride) - 1;
      const row1 = Math.ceil((cam.y + H) / stride) + 1;

      for (let row = row0; row <= row1; row++) {
        for (let col = col0; col <= col1; col++) {
          const sx = col * stride - cam.x;
          const sy = row * stride - cam.y;
          const idx = (((col * 7 + row * 13) % N) + N) % N;
          const album = albums[idx];
          if (!album) continue;
          const img = imgsRef.current[idx];
          const hover = mx >= sx && mx <= sx + cw && my >= sy && my <= sy + cw;
          const playing = playingIdx.current === idx;
          const playingArtist =
            playingIdx.current !== null
              ? albums[playingIdx.current]?.artist
              : null;
          const dimmed =
            !!playingArtist && album.artist !== playingArtist && !playing;
          drawCell(ctx, sx, sy, cw, album, img, hover, playing, dimmed, now);
        }
      }

      rafRef.current = requestAnimationFrame(draw as FrameRequestCallback);
    };
    rafRef.current = requestAnimationFrame(draw as FrameRequestCallback);

    const onDown = (e: PointerEvent) => {
      dragRef.current = {
        active: true,
        lastX: e.clientX,
        lastY: e.clientY,
        moved: false,
      };
      velRef.current = { x: 0, y: 0 };
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
      // Rolling average so inertia on release is smooth, not a single noisy frame
      velRef.current.x = velRef.current.x * 0.6 + -dx * 0.4;
      velRef.current.y = velRef.current.y * 0.6 + -dy * 0.4;
      dragRef.current.lastX = e.clientX;
      dragRef.current.lastY = e.clientY;
    };
    const onUp = (e: PointerEvent) => {
      if (e.target !== canvas) {
        dragRef.current.active = false;
        setCursor("grab");
        return;
      }
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
        const cw = cellSize();
        const stride = cw + GAP;
        const col = Math.floor((cx + cam.x) / stride);
        const row = Math.floor((cy + cam.y) / stride);
        const sx = col * stride - cam.x;
        const sy = row * stride - cam.y;
        if (cx >= sx && cx <= sx + cw && cy >= sy && cy <= sy + cw) {
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
    window.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("wheel", onWheel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  // Stop audio on unmount
  useEffect(
    () => () => {
      audioRef.current?.pause();
    },
    [],
  );

  return (
    <div
      className="relative w-full h-full"
      style={{ backgroundColor: "#080808" }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block select-none"
        style={{ cursor, touchAction: "none" }}
        data-playing={playingId}
      />

      {/* ── Audio player ──────────────────────────────────────────────────── */}
      {(() => {
        const album =
          playerAlbumIdx !== null ? albumsRef.current[playerAlbumIdx] : null;
        return (
          <div
            className={playerPlaying ? "player-border-glow" : ""}
            onWheel={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              bottom: 16,
              left: "50%",
              transform: "translateX(-50%)",
              width: 360,
            }}
          >
            <div
              className="flex items-center gap-3 px-4 py-3 w-full"
              style={{
                backgroundColor: "rgba(8,8,8,0.88)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {/* Album art */}
              <div
                className="w-9 h-9 flex-shrink-0 overflow-hidden"
                style={{ border: "1px solid rgba(255,255,255,0.08)" }}
              >
                {album &&
                playerAlbumIdx !== null &&
                imgsRef.current[playerAlbumIdx]?.src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imgsRef.current[playerAlbumIdx]!.src}
                    alt={album.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full"
                    style={{ background: "rgba(255,255,255,0.04)" }}
                  />
                )}
              </div>

              {/* Track info + progress */}
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <p className="font-mono text-[10px] text-white truncate leading-none">
                  {album
                    ? `${album.artist} — ${album.track}`
                    : "press play to shuffle"}
                </p>
                {/* Progress bar */}
                <div
                  className="w-full h-0.5 cursor-pointer"
                  style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                  onClick={(e) => {
                    const audio = audioRef.current;
                    if (!audio || !audio.duration) return;
                    const rect = (
                      e.currentTarget as HTMLDivElement
                    ).getBoundingClientRect();
                    audio.currentTime =
                      ((e.clientX - rect.left) / rect.width) * audio.duration;
                  }}
                >
                  <div
                    className="h-full transition-none"
                    style={{
                      width: `${progress * 100}%`,
                      backgroundColor: "#4D96D9",
                    }}
                  />
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1">
                {/* Prev */}
                <button
                  onClick={playerPrev}
                  className="w-7 h-7 flex items-center justify-center"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                  title="Previous"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="currentColor"
                  >
                    <polygon points="11,1 4,6 11,11" />
                    <rect x="1" y="1" width="2" height="10" />
                  </svg>
                </button>
                {/* Play/Pause */}
                <button
                  onClick={playerPlay}
                  className="w-8 h-8 flex items-center justify-center"
                  style={{
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                  title={playerPlaying ? "Pause" : "Play"}
                >
                  {playerPlaying ? (
                    <svg
                      width="10"
                      height="12"
                      viewBox="0 0 10 12"
                      fill="currentColor"
                    >
                      <rect x="0" y="0" width="3.5" height="12" />
                      <rect x="6.5" y="0" width="3.5" height="12" />
                    </svg>
                  ) : (
                    <svg
                      width="10"
                      height="12"
                      viewBox="0 0 10 12"
                      fill="currentColor"
                    >
                      <polygon points="0,0 10,6 0,12" />
                    </svg>
                  )}
                </button>
                {/* Next */}
                <button
                  onClick={playerNext}
                  className="w-7 h-7 flex items-center justify-center"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                  title="Next"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="currentColor"
                  >
                    <polygon points="1,1 8,6 1,11" />
                    <rect x="9" y="1" width="2" height="10" />
                  </svg>
                </button>
                {/* Shuffle */}
                <button
                  onClick={playerShuffle}
                  className="w-7 h-7 flex items-center justify-center"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                  title="Shuffle new list"
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M1 4h2.5a4 4 0 0 1 3.2 1.6L8 7"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M1 12h2.5a4 4 0 0 0 3.2-1.6l3.6-4.8A4 4 0 0 1 13.5 4H15"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M8 9l1.3 1.4A4 4 0 0 0 12.5 12H15"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <polyline
                      points="13,2 15,4 13,6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <polyline
                      points="13,10 15,12 13,14"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
