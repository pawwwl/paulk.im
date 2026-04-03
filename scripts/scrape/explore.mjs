/**
 * explore.mjs
 *
 * Visits concertarchives.org listing pages in a real browser and dumps the
 * relevant HTML structure so you can identify the correct CSS selectors before
 * running the full scraper.
 *
 * Usage:
 *   node scripts/scrape/explore.mjs [bands|venues|concerts]
 *
 * Prerequisites:
 *   npm install -D playwright
 *   npx playwright install chromium
 */

import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "output");
mkdirSync(OUT_DIR, { recursive: true });

const TARGETS = {
  bands: "https://www.concertarchives.org/bands",
  venues: "https://www.concertarchives.org/venues",
  concerts: "https://www.concertarchives.org/concerts",
};

const target = process.argv[2] ?? "bands";
if (!TARGETS[target]) {
  console.error(`Unknown target "${target}". Choose: bands | venues | concerts`);
  process.exit(1);
}

console.log(`\n[explore] target: ${target}`);
console.log(`[explore] url:    ${TARGETS[target]}\n`);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  viewport: { width: 1280, height: 900 },
  locale: "en-US",
});

const page = await context.newPage();

console.log("[explore] navigating...");
await page.goto(TARGETS[target], { waitUntil: "networkidle", timeout: 30_000 });

// ── Dump page title & URL (confirm we landed correctly) ───────────────────
const title = await page.title();
const url = page.url();
console.log(`[explore] landed:  ${url}`);
console.log(`[explore] title:   ${title}\n`);

// ── Dump outermost containers ─────────────────────────────────────────────
const structure = await page.evaluate(() => {
  const summary = [];

  // Walk the top-level children of <main> or <body> and record tag+class+id
  const root = document.querySelector("main") ?? document.body;
  const walk = (el, depth) => {
    if (depth > 4) return;
    const tag = el.tagName.toLowerCase();
    const id = el.id ? `#${el.id}` : "";
    const cls = el.className
      ? "." + String(el.className).trim().split(/\s+/).join(".")
      : "";
    const text = el.textContent?.trim().slice(0, 60).replace(/\s+/g, " ") ?? "";
    summary.push("  ".repeat(depth) + `<${tag}${id}${cls}> "${text}"`);
    for (const child of el.children) walk(child, depth + 1);
  };
  walk(root, 0);
  return summary.join("\n");
});

console.log("── DOM STRUCTURE (depth ≤ 4) ───────────────────────────────");
console.log(structure);
console.log();

// ── Dump first 3 list items in full ──────────────────────────────────────
// Try common Rails/Bootstrap patterns
const listSelectors = [
  "table tbody tr",
  ".table tbody tr",
  "[class*='item']",
  "[class*='row']",
  "[class*='card']",
  "[class*='result']",
  "li",
];

let itemsHTML = null;
let matchedSelector = null;

for (const sel of listSelectors) {
  const items = await page.$$(sel);
  if (items.length > 2) {
    matchedSelector = sel;
    const first3 = items.slice(0, 3);
    const htmlParts = await Promise.all(
      first3.map((h) => h.evaluate((el) => el.outerHTML)),
    );
    itemsHTML = htmlParts.join("\n\n---\n\n");
    break;
  }
}

if (itemsHTML) {
  console.log(`── FIRST 3 ITEMS (selector: "${matchedSelector}") ─────────────────`);
  console.log(itemsHTML.slice(0, 4000)); // cap at 4k chars
  console.log();
} else {
  console.log("── Could not auto-detect list items. Dumping full body HTML ────");
  const bodyHTML = await page.evaluate(() => document.body.innerHTML.slice(0, 6000));
  console.log(bodyHTML);
  console.log();
}

// ── Pagination ────────────────────────────────────────────────────────────
const pagination = await page.evaluate(() => {
  const paginationEl =
    document.querySelector("[class*='pagination']") ??
    document.querySelector("nav") ??
    document.querySelector("[aria-label*='page']");
  return paginationEl?.outerHTML?.slice(0, 1000) ?? "not found";
});
console.log("── PAGINATION HTML ─────────────────────────────────────────────");
console.log(pagination);
console.log();

// ── Save screenshot for visual reference ─────────────────────────────────
const screenshotPath = join(OUT_DIR, `${target}.png`);
await page.screenshot({ path: screenshotPath, fullPage: false });
console.log(`[explore] screenshot saved → ${screenshotPath}`);

// ── Save full HTML for offline inspection ────────────────────────────────
const htmlPath = join(OUT_DIR, `${target}.html`);
const fullHTML = await page.content();
writeFileSync(htmlPath, fullHTML);
console.log(`[explore] full HTML saved  → ${htmlPath}`);

await browser.close();
console.log("\n[explore] done. Inspect the output above, then update SELECTORS in scrape.mjs");
