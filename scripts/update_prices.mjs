// Reads store pages for listings in data/listings.json and updates prices.
// Writes a price only when it was read cleanly and passes sanity checks.
import fs from "node:fs";
import { extractPrice, looksBlocked } from "./extract.mjs";
import { applyUpdates } from "./apply.mjs";

const FILE = process.env.LISTINGS_FILE || "data/listings.json";
const ONLY = (process.env.ONLY_STORES || "Flipkart,Shopsy").split(",").map((s) => s.trim()).filter(Boolean);
const raw = JSON.parse(fs.readFileSync(FILE, "utf8"));
const list = Array.isArray(raw) ? raw : raw.listings;
if (!Array.isArray(list)) throw new Error("Unexpected shape in " + FILE);

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const { chromium } = await import("playwright");
const browser = await chromium.launch();
const ctx = await browser.newContext({ userAgent: UA, locale: "en-IN" });

const results = new Map();
const urls = [
  ...new Set(
    list.filter((l) => ONLY.map((s) => s.toLowerCase()).includes(String(l.store).toLowerCase()) && /^https?:\/\//.test(l.url || "")).map((l) => l.url)
  ),
];
for (const url of urls) {
  const res = { status: "", price: null };
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(3000);
    const html = await page.content();
    const text = await page.evaluate(() => document.body?.innerText || "");
    if (looksBlocked(text, await page.title())) res.status = "BLOCKED";
    else {
      const e = extractPrice(html);
      res.price = e.price;
      res.status = e.price ? (e.trusted ? "OK" : "WEAK") : "NO PRICE";
    }
  } catch (err) {
    res.status = "ERROR";
  }
  await page.close();
  results.set(url, res);
  await new Promise((r) => setTimeout(r, 2000));
}
await browser.close();

const out = applyUpdates(list, results, { onlyStores: ONLY });
fs.writeFileSync(FILE, JSON.stringify(raw, null, 2) + "\n"); // rejected or failed rows were left untouched

let md = `## Price update\n\n- Updated: ${out.updated.length}\n- Failed to read: ${out.failed.length}\n- Rejected by safety checks: ${out.rejected.length}\n- Skipped (store blocked in the test run): ${out.skipped.length}\n`;
if (out.updated.length) md += "\n### Updated\n" + out.updated.map((u) => `- ${u.tag}: ${u.old} -> ${u.price}`).join("\n") + "\n";
if (out.failed.length) md += "\n### Could not read\n" + out.failed.map((u) => `- ${u.tag}: ${u.why}`).join("\n") + "\n";
if (out.rejected.length) md += "\n### Rejected\n" + out.rejected.map((u) => `- ${u.tag}: ${u.why}`).join("\n") + "\n";
console.log(md);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);

// Fail the run (GitHub then emails you) if anything we tried could not be updated
if (out.failed.length || out.rejected.length) process.exit(1);
