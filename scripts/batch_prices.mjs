import fs from "node:fs";
import { parseBatch, applyBatch } from "./batch.mjs";

const LISTINGS = process.env.LISTINGS_FILE || "data/listings.json";
const BATCH = process.env.BATCH_FILE || "data/price_updates.txt";

const HEADER = `# Paste one line per coin: the product link, a space, then the price.
# Example: https://www.myntra.com/gold-coin/brand/name/12345678/buy 15200
# Add the word force after a price to allow a change of more than 40%.
# When you commit this file, the prices are applied and this file is cleared.
`;

const text = fs.existsSync(BATCH) ? fs.readFileSync(BATCH, "utf8") : "";
const { pairs, bad } = parseBatch(text);
if (!pairs.length && !bad.length) {
  console.log("Nothing to do: no lines in " + BATCH);
  process.exit(0);
}

const raw = JSON.parse(fs.readFileSync(LISTINGS, "utf8"));
const list = Array.isArray(raw) ? raw : raw.listings;
if (!Array.isArray(list)) throw new Error("Unexpected shape in " + LISTINGS);

const out = applyBatch(list, pairs);
if (out.updated.length) fs.writeFileSync(LISTINGS, JSON.stringify(raw, null, 2) + "\n");

// Clear the file, but keep anything that failed as a comment so it is easy to fix
let keep = HEADER;
for (const f of out.failed) keep += `# FAILED (${f.why}): ${f.url} ${f.price}\n`;
for (const b of bad) keep += `# FAILED (${b.why}): ${b.line}\n`;
fs.writeFileSync(BATCH, keep);

let md = `## Batch price update\n\n- Updated: ${out.updated.length}\n- Failed: ${out.failed.length + bad.length}\n`;
if (out.updated.length) md += "\n### Updated\n" + out.updated.map((u) => `- ${u.tag}: ${u.old} -> ${u.price}`).join("\n") + "\n";
if (out.failed.length || bad.length)
  md += "\n### Failed\n" + [...out.failed.map((f) => `- ${f.url} ${f.price}: ${f.why}`), ...bad.map((b) => `- ${b.line}: ${b.why}`)].join("\n") + "\n";
console.log(md);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
if (out.failed.length || bad.length) process.exit(1);
