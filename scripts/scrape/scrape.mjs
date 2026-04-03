/**
 * scrape.mjs
 *
 * Scrapes artists, venues, and concerts from concertarchives.org into JSON.
 * Uses Playwright so Cloudflare's JS challenge is solved by a real browser.
 *
 * Usage:
 *   node scripts/scrape/scrape.mjs --type bands   [--pages 10] [--out ./output]
 *   node scripts/scrape/scrape.mjs --type venues  [--pages 10]
 *   node scripts/scrape/scrape.mjs --type concerts [--pages 10]
 *   node scripts/scrape/scrape.mjs --type all     [--pages 10]
 *
 * Prerequisites:
 *   npm install -D playwright
 *   npx playwright install chromium
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SELECTORS — update these after running explore.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── CLI args ──────────────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, arg, i, arr) => {
    if (arg.startsWith("--")) pairs.push([arg.slice(2), arr[i + 1] ?? true]);
    return pairs;
  }, []),
);

const TYPE = args.type ?? "bands";
const MAX_PAGES = Number(args.pages ?? 10);
const OUT_DIR = String(args.out ?? join(__dirname, "output"));
mkdirSync(OUT_DIR, { recursive: true });

const VALID_TYPES = ["bands", "venues", "concerts", "all"];
if (!VALID_TYPES.includes(TYPE)) {
  console.error(`--type must be one of: ${VALID_TYPES.join(" | ")}`);
  process.exit(1);
}

// ── Selectors ─────────────────────────────────────────────────────────────
// Run explore.mjs first and update these to match the actual HTML.
const SELECTORS = {
  bands: {
    url: (page) => `https://www.concertarchives.org/bands?page=${page}`,
    waitFor: "table, [class*='band'], [class*='artist']",
    row: "table tbody tr",
    extract: (row) => ({
      name: row.querySelector("td:nth-child(1) a")?.textContent?.trim() ?? null,
      url: row.querySelector("td:nth-child(1) a")?.href ?? null,
      concertCount: parseInt(
        row.querySelector("td:nth-child(2)")?.textContent?.replace(/,/g, "").trim() ?? "0",
        10,
      ) || null,
    }),
  },

  venues: {
    url: (page) => `https://www.concertarchives.org/venues?page=${page}`,
    waitFor: "table, [class*='venue']",
    row: "table tbody tr",
    extract: (row) => ({
      name: row.querySelector("td:nth-child(1) a")?.textContent?.trim() ?? null,
      url: row.querySelector("td:nth-child(1) a")?.href ?? null,
      location: row.querySelector("td:nth-child(2)")?.textContent?.trim() ?? null,
      concertCount: parseInt(
        row.querySelector("td:nth-child(3)")?.textContent?.replace(/,/g, "").trim() ?? "0",
        10,
      ) || null,
    }),
  },

  concerts: {
    url: (page) => `https://www.concertarchives.org/concerts?page=${page}`,
    waitFor: "table, [class*='concert']",
    row: "table tbody tr",
    extract: (row) => ({
      artist: row.querySelector("td:nth-child(1) a")?.textContent?.trim() ?? null,
      venue: row.querySelector("td:nth-child(2) a")?.textContent?.trim() ?? null,
      location: row.querySelector("td:nth-child(3)")?.textContent?.trim() ?? null,
      date: row.querySelector("td:nth-child(4)")?.textContent?.trim() ?? null,
      url: row.querySelector("td:nth-child(1) a")?.href ?? null,
    }),
  },
};

// ── Scrape one type ───────────────────────────────────────────────────────
async function scrapeType(browser, type) {
  const config = SELECTORS[type];
  const results = [];
  const page = await browser.newPage();

  console.log(`\n[${type}] starting — up to ${MAX_PAGES} pages`);

  for (let pageNum = 1; pageNum <= MAX_PAGES; pageNum++) {
    const url = config.url(pageNum);
    console.log(`[${type}] page ${pageNum}/${MAX_PAGES} — ${url}`);

    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
      await page.waitForSelector(config.waitFor, { timeout: 10_000 }).catch(() => null);

      const rows = await page.evaluate(
        ({ rowSelector, extractFn }) => {
          const rows = [...document.querySelectorAll(rowSelector)];
          if (rows.length === 0) return null;
          // eslint-disable-next-line no-new-func
          const extract = new Function("row", `return (${extractFn})(row)`);
          return rows.map(extract);
        },
        { rowSelector: config.row, extractFn: config.extract.toString() },
      );

      if (!rows || rows.length === 0) {
        console.log(`[${type}] page ${pageNum} — no rows found, stopping`);
        break;
      }

      // Filter out empty/null rows
      const valid = rows.filter((r) => r && Object.values(r).some(Boolean));
      results.push(...valid);
      console.log(`[${type}] page ${pageNum} — got ${valid.length} rows (total: ${results.length})`);

      // Check if there's a next page; stop early if not
      const hasNext = await page.evaluate((pageNum) => {
        const links = [...document.querySelectorAll("a")];
        return links.some(
          (a) =>
            a.href?.includes(`page=${pageNum + 1}`) ||
            a.textContent?.trim() === String(pageNum + 1) ||
            a.rel === "next",
        );
      }, pageNum);

      if (!hasNext) {
        console.log(`[${type}] no next page found after page ${pageNum}, stopping`);
        break;
      }

      // Polite delay between requests
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 400));
    } catch (err) {
      console.error(`[${type}] page ${pageNum} error: ${err.message}`);
      break;
    }
  }

  await page.close();
  return results;
}

// ── Main ──────────────────────────────────────────────────────────────────
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

const context = await browser.newContext({
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  viewport: { width: 1280, height: 900 },
  locale: "en-US",
  extraHTTPHeaders: {
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  },
});

// Reuse the same authenticated context across all tabs
const launchBrowser = { newPage: () => context.newPage() };

const types = TYPE === "all" ? ["bands", "venues", "concerts"] : [TYPE];

for (const t of types) {
  const data = await scrapeType(launchBrowser, t);

  const outPath = join(OUT_DIR, `${t}.json`);
  writeFileSync(outPath, JSON.stringify(data, null, 2));
  console.log(`\n[${t}] ✓ wrote ${data.length} records → ${outPath}`);
}

await browser.close();
console.log("\n[scrape] done");
