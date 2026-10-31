// TEST RUN ONLY. Reads every product link in data/listings.json and reports
// which stores can be read from GitHub's servers. It changes no files.
import fs from "node:fs";
import { extractPrice, looksBlocked } from "./extract.mjs";

const FILE = process.env.LISTINGS_FILE || "data/listings.json";
const raw = JSON.parse(fs.readFileSync(FILE, "utf8"));
const list = Array.isArray(raw) ? raw : raw.listings;
if (!Array.isArray(list)) throw new Error("Unexpected shape in " + FILE);

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const { chromium } = await import("playwright");
const browser = await chromium.launch();
const ctx = await browser.newContext({ userAgent: UA, locale: "en-IN" });

const seen = new Map();
const rows = [];
for (const l of list.slice(0, 120)) {
  const url = l.url || "";
  if (!/^https?:\/\//.test(url)) {
    rows.push({ store: l.store, w: l.weight, k: l.karat, stored: l.price, status: "NO LINK", found: "", source: "", len: 0 });
    continue;
  }
  let res = seen.get(url);
  if (!res) {
    res = { status: "", found: null, source: "", len: 0 };
    const page = await ctx.newPage();
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.waitForTimeout(3000);
      const html = await page.content();
      const text = await page.evaluate(() => document.body?.innerText || "");
      const title = await page.title();
      res.len = text.length;
      if (looksBlocked(text, title)) res.status = "BLOCKED";
      else {
        const e = extractPrice(html);
        res.found = e.price;
        res.source = e.source;
        res.status = e.price ? (e.trusted ? "OK" : "WEAK") : "NO PRICE";
      }
    } catch (err) {
      res.status = "ERROR";
      res.source = String(err.message || err).slice(0, 60);
    }
    await page.close();
    seen.set(url, res);
    await new Promise((r) => setTimeout(r, 2000)); // be gentle with the stores
  }
  rows.push({ store: l.store, w: l.weight, k: l.karat, stored: l.price, ...res });
}
await browser.close();

const by = {};
for (const r of rows) {
  by[r.store] ??= { OK: 0, WEAK: 0, "NO PRICE": 0, BLOCKED: 0, ERROR: 0, "NO LINK": 0 };
  by[r.store][r.status]++;
}
let md = "## Store readability (test run, nothing changed)\n\n| Store | OK | Weak | No price | Blocked | Error | No link |\n|---|---|---|---|---|---|---|\n";
for (const [s, c] of Object.entries(by))
  md += `| ${s} | ${c.OK} | ${c.WEAK} | ${c["NO PRICE"]} | ${c.BLOCKED} | ${c.ERROR} | ${c["NO LINK"]} |\n`;
md += "\n## Per listing\n\n| Store | Weight | Karat | Stored | Found | Source | Status | Page text |\n|---|---|---|---|---|---|---|---|\n";
for (const r of rows)
  md += `| ${r.store} | ${r.w}g | ${r.k}K | ${r.stored} | ${r.found ?? ""} | ${r.source} | ${r.status} | ${r.len} |\n`;
console.log(md);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
