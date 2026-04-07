"use client";

import { useEffect, useRef, useState } from "react";

// ── Config ────────────────────────────────────────────────────────────────────
const GAP = 12;
function cellSize() {
  return window.innerWidth < 640 ? 120 : 200;
}
const RADIUS = 8;
const FRICTION = 0.92;

// ── Top 50 cities ─────────────────────────────────────────────────────────────
// fetchName is the slug used in the goweather.xyz URL when it differs from name
// continent: na · sa · af · eu · as · oc
const CITIES = [
  { name: "New York",      country: "US", continent: "na", fetchName: "New+York"     },
  { name: "London",        country: "GB", continent: "eu"                             },
  { name: "Tokyo",         country: "JP", continent: "as"                             },
  { name: "Paris",         country: "FR", continent: "eu"                             },
  { name: "Dubai",         country: "AE", continent: "as"                             },
  { name: "Singapore",     country: "SG", continent: "as"                             },
  { name: "Sydney",        country: "AU", continent: "oc"                             },
  { name: "Los Angeles",   country: "US", continent: "na", fetchName: "Los+Angeles"  },
  { name: "Toronto",       country: "CA", continent: "na"                             },
  { name: "Mumbai",        country: "IN", continent: "as"                             },
  { name: "São Paulo",     country: "BR", continent: "sa", fetchName: "Sao+Paulo"    },
  { name: "Shanghai",      country: "CN", continent: "as"                             },
  { name: "Berlin",        country: "DE", continent: "eu"                             },
  { name: "Mexico City",   country: "MX", continent: "na", fetchName: "Mexico+City"  },
  { name: "Seoul",         country: "KR", continent: "as"                             },
  { name: "Amsterdam",     country: "NL", continent: "eu"                             },
  { name: "Chicago",       country: "US", continent: "na"                             },
  { name: "Hong Kong",     country: "HK", continent: "as", fetchName: "Hong+Kong"    },
  { name: "Rome",          country: "IT", continent: "eu"                             },
  { name: "Madrid",        country: "ES", continent: "eu"                             },
  { name: "Buenos Aires",  country: "AR", continent: "sa", fetchName: "Buenos+Aires" },
  { name: "Cairo",         country: "EG", continent: "af"                             },
  { name: "Istanbul",      country: "TR", continent: "eu"                             },
  { name: "Bangkok",       country: "TH", continent: "as"                             },
  { name: "Johannesburg",  country: "ZA", continent: "af"                             },
  { name: "Moscow",        country: "RU", continent: "eu"                             },
  { name: "Lagos",         country: "NG", continent: "af"                             },
  { name: "Karachi",       country: "PK", continent: "as"                             },
  { name: "Jakarta",       country: "ID", continent: "as"                             },
  { name: "Dhaka",         country: "BD", continent: "as"                             },
  { name: "Kinshasa",      country: "CD", continent: "af"                             },
  { name: "Lima",          country: "PE", continent: "sa"                             },
  { name: "Bogota",        country: "CO", continent: "sa"                             },
  { name: "Santiago",      country: "CL", continent: "sa"                             },
  { name: "Vienna",        country: "AT", continent: "eu"                             },
  { name: "Warsaw",        country: "PL", continent: "eu"                             },
  { name: "Stockholm",     country: "SE", continent: "eu"                             },
  { name: "Oslo",          country: "NO", continent: "eu"                             },
  { name: "Helsinki",      country: "FI", continent: "eu"                             },
  { name: "Zurich",        country: "CH", continent: "eu"                             },
  { name: "Nairobi",       country: "KE", continent: "af"                             },
  { name: "Accra",         country: "GH", continent: "af"                             },
  { name: "Casablanca",    country: "MA", continent: "af"                             },
  { name: "Riyadh",        country: "SA", continent: "as"                             },
  { name: "Tehran",        country: "IR", continent: "as"                             },
  { name: "Lahore",        country: "PK", continent: "as"                             },
  { name: "Kolkata",       country: "IN", continent: "as"                             },
  { name: "Melbourne",     country: "AU", continent: "oc"                             },
  { name: "Auckland",      country: "NZ", continent: "oc"                             },
  { name: "Lisbon",        country: "PT", continent: "eu"                             },
] as const;

const CONTINENT_TAGS = [
  { id: "na", label: "North America" },
  { id: "sa", label: "South America" },
  { id: "af", label: "Africa"        },
  { id: "eu", label: "Europe"        },
  { id: "as", label: "Asia"          },
  { id: "oc", label: "Etc"           },
] as const;

type City = (typeof CITIES)[number];

type WeatherData = {
  city:        City;
  temp:        number;  // celsius, parsed from "21 °C"
  windKph:     number;  // parsed from "6 km/h"
  description: string;  // raw e.g. "Partly cloudy"
};

// ── Description-based helpers ─────────────────────────────────────────────────
type WeatherCat = "clear" | "cloudy" | "fog" | "rain" | "snow" | "storm";

function weatherCat(desc: string): WeatherCat {
  const d = desc.toLowerCase();
  if (d.includes("thunder") || d.includes("storm"))            return "storm";
  if (d.includes("snow") || d.includes("blizzard") || d.includes("sleet")) return "snow";
  if (d.includes("rain") || d.includes("drizzle") || d.includes("shower")) return "rain";
  if (d.includes("fog") || d.includes("mist") || d.includes("haze"))       return "fog";
  if (d.includes("cloud") || d.includes("overcast"))           return "cloudy";
  if (d.includes("clear") || d.includes("sunny") || d.includes("sun"))     return "clear";
  return "cloudy";
}

function weatherEmoji(desc: string): string {
  return { clear: "☀", cloudy: "⛅", fog: "🌫", rain: "🌧", snow: "❄", storm: "⛈" }[weatherCat(desc)];
}

// ── Color palettes per condition ──────────────────────────────────────────────
const PALETTES: Record<WeatherCat, { bg0: string; bg1: string; accent: string }> = {
  clear:  { bg0: "#1a0a00", bg1: "#3a1800", accent: "#f5a830" },
  cloudy: { bg0: "#0a0d14", bg1: "#15202e", accent: "#7ba3c8" },
  fog:    { bg0: "#0d0d0d", bg1: "#1e1e1e", accent: "#9ea8b4" },
  rain:   { bg0: "#000d1a", bg1: "#001630", accent: "#4d96d9" },
  snow:   { bg0: "#08101a", bg1: "#0f1e38", accent: "#bdd4f0" },
  storm:  { bg0: "#08000f", bg1: "#160025", accent: "#a066ff" },
};

// ── Fetch ─────────────────────────────────────────────────────────────────────
function parseNum(s: string): number {
  return parseInt(s.replace(/[^-\d]/g, ""), 10) || 0;
}

async function fetchWeather(): Promise<WeatherData[]> {
  return Promise.all(
    CITIES.map(async (city) => {
      try {
        const slug = (city as { fetchName?: string }).fetchName ?? city.name;
        const res  = await fetch(`https://goweather.xyz/v2/weather/${encodeURIComponent(slug)}`);
        const d    = await res.json() as { temperature?: string; wind?: string; description?: string };
        return {
          city,
          temp:        parseNum(d.temperature ?? "0"),
          windKph:     parseNum(d.wind        ?? "0"),
          description: d.description ?? "",
        } satisfies WeatherData;
      } catch {
        return { city, temp: 0, windKph: 0, description: "" };
      }
    }),
  );
}

// ── Canvas helpers ────────────────────────────────────────────────────────────
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
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

// ── Weather effect painters ───────────────────────────────────────────────────
function drawClear(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, cw: number, now: number,
) {
  const t   = now * 0.001;
  const cx  = x + cw / 2;
  const cy  = y + cw * 0.38;
  const r   = cw * 0.14;
  const numSpokes = 12;

  // Glow
  const glow = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, cw * 0.55);
  glow.addColorStop(0, "rgba(245,168,48,0.18)");
  glow.addColorStop(1, "rgba(245,168,48,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(x, y, cw, cw);

  // Rotating spokes
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(t * 0.4);
  ctx.strokeStyle = "rgba(245,168,48,0.35)";
  ctx.lineWidth = 1;
  for (let i = 0; i < numSpokes; i++) {
    const a = (i / numSpokes) * Math.PI * 2;
    const inner = r * 1.5;
    const outer = r * 2.4 + Math.sin(t * 2 + i) * r * 0.3;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
    ctx.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
    ctx.stroke();
  }
  ctx.restore();

  // Sun disc
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  const disc = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r);
  disc.addColorStop(0, "#ffe577");
  disc.addColorStop(1, "#f5a830");
  ctx.fillStyle = disc;
  ctx.fill();
}

function drawCloudy(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, cw: number, now: number,
) {
  const t = now * 0.0005;
  // Two slowly drifting cloud blobs
  const clouds = [
    { ox: 0.2, oy: 0.32, rx: 0.22, ry: 0.10, speed: 0.12, alpha: 0.28 },
    { ox: 0.5, oy: 0.45, rx: 0.30, ry: 0.12, speed: 0.08, alpha: 0.22 },
  ];
  ctx.save();
  ctx.fillStyle = "rgba(120,150,190,0.18)";
  for (const c of clouds) {
    const bx = x + (((c.ox + t * c.speed) % 1.4) - 0.2) * cw;
    const by = y + c.oy * cw;
    ctx.globalAlpha = c.alpha;
    ctx.beginPath();
    ctx.ellipse(bx, by, c.rx * cw, c.ry * cw, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawFog(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, cw: number, now: number,
) {
  const t = now * 0.0003;
  ctx.save();
  for (let i = 0; i < 4; i++) {
    const oy = y + (0.25 + i * 0.15) * cw;
    const shift = ((t * (0.06 + i * 0.02) + i * 0.4) % 1.6) - 0.3;
    const bx = x + shift * cw;
    ctx.globalAlpha = 0.12 - i * 0.02;
    ctx.fillStyle = "#9ea8b4";
    ctx.beginPath();
    ctx.ellipse(bx + cw * 0.5, oy, cw * 0.6, cw * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawRain(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, cw: number, now: number,
) {
  const t    = now * 0.001;
  const n    = 28;
  const spd  = 180; // px/s equivalent via t

  ctx.save();
  ctx.strokeStyle = "rgba(77,150,217,0.55)";
  ctx.lineWidth   = 1;

  for (let i = 0; i < n; i++) {
    const fx   = x + ((i * 37 + 11) % (cw + 10));
    const fy   = ((t * spd + i * (cw / n) * 1.5) % (cw + 20)) - 10;
    const len  = 7 + (i % 4) * 3;
    ctx.globalAlpha = 0.3 + (i % 3) * 0.15;
    ctx.beginPath();
    ctx.moveTo(fx - 1, y + fy);
    ctx.lineTo(fx - 3, y + fy + len);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawSnow(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, cw: number, now: number,
) {
  const t   = now * 0.001;
  const n   = 22;
  const spd = 40;

  ctx.save();
  ctx.fillStyle = "rgba(180,210,240,0.7)";

  for (let i = 0; i < n; i++) {
    const fx   = x + ((i * 43 + 7) % cw) + Math.sin(t * 0.8 + i * 1.3) * 6;
    const fy   = ((t * spd + i * (cw / n) * 1.7) % (cw + 10)) - 5;
    const r    = 1.5 + (i % 3) * 0.8;
    ctx.globalAlpha = 0.4 + (i % 4) * 0.1;
    ctx.beginPath();
    ctx.arc(fx, y + fy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawStorm(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, cw: number, now: number,
) {
  // Rain
  drawRain(ctx, x, y, cw, now);

  // Occasional lightning flash
  const t     = now * 0.001;
  const cycle = 4.0; // seconds per cycle
  const phase = t % cycle;
  if (phase < 0.08) {
    ctx.save();
    ctx.fillStyle = `rgba(180,120,255,${0.25 * (1 - phase / 0.08)})`;
    ctx.fillRect(x, y, cw, cw);
    ctx.restore();
  }

  // Lightning bolt
  const boltPhase = (t * 0.5) % 5;
  if (boltPhase < 0.12) {
    const bx = x + cw * 0.52;
    const by = y + cw * 0.1;
    ctx.save();
    ctx.strokeStyle = `rgba(200,160,255,${0.8 * (1 - boltPhase / 0.12)})`;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = "#a066ff";
    ctx.shadowBlur  = 8;
    ctx.beginPath();
    ctx.moveTo(bx,          by);
    ctx.lineTo(bx - cw * 0.06, by + cw * 0.22);
    ctx.lineTo(bx + cw * 0.04, by + cw * 0.22);
    ctx.lineTo(bx - cw * 0.08, by + cw * 0.45);
    ctx.stroke();
    ctx.restore();
  }
}

function drawWeatherEffect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, cw: number,
  cat: WeatherCat, now: number,
) {
  switch (cat) {
    case "clear":  return drawClear(ctx, x, y, cw, now);
    case "cloudy": return drawCloudy(ctx, x, y, cw, now);
    case "fog":    return drawFog(ctx, x, y, cw, now);
    case "rain":   return drawRain(ctx, x, y, cw, now);
    case "snow":   return drawSnow(ctx, x, y, cw, now);
    case "storm":  return drawStorm(ctx, x, y, cw, now);
  }
}

// ── Cell draw ─────────────────────────────────────────────────────────────────
function drawCell(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, cw: number,
  w: WeatherData,
  hover: boolean,
  now: number,
  useFahrenheit: boolean,
) {
  const cat     = weatherCat(w.description);
  const palette = PALETTES[cat];
  const big     = cw >= 160;

  ctx.save();
  roundRect(ctx, x, y, cw, cw, RADIUS);
  ctx.clip();

  // Background
  const bg = ctx.createLinearGradient(x, y, x + cw, y + cw);
  bg.addColorStop(0, palette.bg0);
  bg.addColorStop(1, palette.bg1);
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, cw, cw);

  // Animated weather effect
  drawWeatherEffect(ctx, x, y, cw, cat, now);

  // Hover overlay
  if (hover) {
    ctx.fillStyle = "rgba(0,0,0,0.60)";
    ctx.fillRect(x, y, cw, cw);
  }

  const displayTemp = useFahrenheit ? Math.round(w.temp * 9 / 5 + 32) : w.temp;
  const unit        = useFahrenheit ? "°F" : "°C";

  if (hover) {
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";

    ctx.font      = `bold ${big ? 28 : 19}px monospace`;
    ctx.fillStyle = palette.accent;
    ctx.fillText(`${displayTemp}${unit}`, x + cw / 2, y + cw * 0.28);

    ctx.font      = `600 ${big ? 11 : 8}px monospace`;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(w.city.name, x + cw / 2, y + cw * 0.46);

    ctx.font      = `400 ${big ? 9 : 7}px monospace`;
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillText(w.description, x + cw / 2, y + cw * 0.57);

    if (big) {
      ctx.font      = "400 8px monospace";
      ctx.fillStyle = "rgba(255,255,255,0.38)";
      ctx.fillText(`Wind ${w.windKph} km/h`, x + cw / 2, y + cw * 0.70);
    }
  } else {
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";

    ctx.font        = `bold ${big ? 32 : 22}px monospace`;
    ctx.fillStyle   = palette.accent;
    ctx.shadowColor = palette.accent;
    ctx.shadowBlur  = 8;
    ctx.fillText(`${displayTemp}°`, x + cw / 2, y + cw * 0.37);
    ctx.shadowBlur  = 0;

    ctx.font      = `600 ${big ? 11 : 8}px monospace`;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(w.city.name, x + cw / 2, y + cw * 0.56);

    ctx.font      = `400 ${big ? 10 : 7}px monospace`;
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fillText(`${w.city.country} ${weatherEmoji(w.description)}`, x + cw / 2, y + cw * 0.70);
  }

  ctx.restore();

  // Border
  roundRect(ctx, x, y, cw, cw, RADIUS);
  ctx.strokeStyle = hover ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.06)";
  ctx.lineWidth   = 1;
  ctx.stroke();
}

// ── Component ─────────────────────────────────────────────────────────────────
export function GodlyWeather() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const camRef     = useRef({ x: 0, y: 0 });
  const velRef     = useRef({ x: 0, y: 0 });
  const dragRef    = useRef({ active: false, lastX: 0, lastY: 0, moved: false });
  const mouseRef   = useRef({ x: -9999, y: -9999 });
  const rafRef     = useRef<number>(0);
  const dataRef    = useRef<WeatherData[]>([]);
  const [loaded, setLoaded]   = useState(false);
  const [cursor, setCursor]   = useState<"grab" | "grabbing">("grab");
  const [fahrenheit, setFahrenheit] = useState(false);
  const fahrenheitRef   = useRef(false);
  const filteredRef     = useRef<WeatherData[]>([]);
  const [activeContinent, setActiveContinent] = useState<string | null>(null);

  // Keep ref in sync with state so the draw loop can read it
  useEffect(() => { fahrenheitRef.current = fahrenheit; }, [fahrenheit]);

  useEffect(() => {
    fetchWeather().then((data) => {
      dataRef.current   = data;
      filteredRef.current = data;
      setLoaded(true);
    });
  }, []);

  const selectContinent = (id: string | null) => {
    const next = activeContinent === id ? null : id;
    filteredRef.current = next
      ? dataRef.current.filter((d) => d.city.continent === next)
      : dataRef.current;
    camRef.current = { x: 0, y: 0 };
    velRef.current = { x: 0, y: 0 };
    setActiveContinent(next);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr    = Math.min(window.devicePixelRatio, 2);
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

      const data = filteredRef.current;
      const N    = data.length;

      if (N === 0) {
        ctx.fillStyle    = "rgba(255,255,255,0.15)";
        ctx.font         = "400 12px monospace";
        ctx.textAlign    = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("fetching weather…", W / 2, H / 2);
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

      for (let row = row0; row <= row1; row++) {
        for (let col = col0; col <= col1; col++) {
          const sx  = col * stride - cam.x;
          const sy  = row * stride - cam.y;
          const idx = (((col * 7 + row * 13) % N) + N) % N;
          const w   = data[idx];
          const hover = mx >= sx && mx <= sx + cw && my >= sy && my <= sy + cw;
          drawCell(ctx, sx, sy, cw, w, hover, now, fahrenheitRef.current);
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
      velRef.current.x  = velRef.current.x * 0.6 + -dx * 0.4;
      velRef.current.y  = velRef.current.y * 0.6 + -dy * 0.4;
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
        // Click = toggle °C/°F
        setFahrenheit((f) => !f);
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

  return (
    <div className="relative w-full h-full" style={{ backgroundColor: "#080808" }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block select-none"
        style={{ cursor, touchAction: "none" }}
      />

      {/* ── HUD ────────────────────────────────────────────────────────────── */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          position:   "fixed",
          bottom:     16,
          left:       "50%",
          transform:  "translateX(-50%)",
          display:    "flex",
          alignItems: "center",
          gap:        6,
          backgroundColor: "rgba(8,8,8,0.88)",
          backdropFilter:  "blur(20px)",
          border:          "1px solid rgba(255,255,255,0.1)",
          padding:    "6px 10px",
        }}
      >
        {/* Continent tags */}
        {CONTINENT_TAGS.map((tag) => {
          const active = activeContinent === tag.id;
          return (
            <button
              key={tag.id}
              onClick={() => selectContinent(tag.id)}
              className="font-mono text-[9px] uppercase tracking-[0.18em] px-2 py-1"
              style={{
                color:       active ? "#00e5ff" : "rgba(255,255,255,0.35)",
                border:      `1px solid ${active ? "#00e5ff" : "transparent"}`,
                cursor:      "pointer",
                background:  "transparent",
                transition:  "color 0.15s, border-color 0.15s",
              }}
            >
              {active && <span style={{ fontSize: 7, marginRight: 3 }}>▶</span>}
              {tag.label}
            </button>
          );
        })}

        {/* Divider */}
        <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.1)", margin: "0 2px" }} />

        {/* °C / °F toggle */}
        <button
          onClick={() => setFahrenheit((f) => !f)}
          className="font-mono text-[9px] uppercase tracking-[0.18em] px-2 py-1"
          style={{ color: "rgba(255,255,255,0.35)", cursor: "pointer", background: "transparent", border: "1px solid transparent" }}
        >
          {fahrenheit ? "°F" : "°C"}
        </button>
      </div>
    </div>
  );
}
