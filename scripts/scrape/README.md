# concertarchives scraper

Two scripts — explore first, then scrape.

## Setup

```bash
npm install -D playwright
npx playwright install chromium
```

## Step 1 — explore (map the HTML selectors)

Visits one listing page in a real browser, dumps the DOM structure, saves a
screenshot and the full HTML to `scripts/scrape/output/`.

```bash
node scripts/scrape/explore.mjs bands
node scripts/scrape/explore.mjs venues
node scripts/scrape/explore.mjs concerts
```

Open `output/bands.html` in a browser or editor, find the row/card elements,
then update the `SELECTORS` block in `scrape.mjs` to match.

## Step 2 — scrape

```bash
# single type, 10 pages (default)
node scripts/scrape/scrape.mjs --type bands

# more pages
node scripts/scrape/scrape.mjs --type bands --pages 50

# all three types
node scripts/scrape/scrape.mjs --type all --pages 20
```

Output lands in `scripts/scrape/output/{bands,venues,concerts}.json`.

## Selectors (update after exploring)

In `scrape.mjs`, the `SELECTORS` object has a block per type:

| field | what to put there |
|---|---|
| `url(page)` | URL pattern — already set |
| `waitFor` | a selector that appears when the list has loaded |
| `row` | selector for each result row/card |
| `extract(row)` | function that pulls fields out of one row element |
