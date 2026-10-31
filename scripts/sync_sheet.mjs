import fs from "node:fs";
import { parseCsv } from "./csv.mjs";
import { applySheet } from "./sheetsync.mjs";

const LISTINGS = process.env.LISTINGS_FILE || "data/listings.json";
const STATE = process.env.STATE_FILE || "data/sheet_sync_state.json";
const url = process.env.SHEET_CSV_URL;
const localCsv = process.env.SHEET_CSV_FILE; // used for testing

let text;
if (localCsv) text = fs.readFileSync(localCsv, "utf8");
else {
  if (!url) { console.log("SHEET_CSV_URL is not set yet, so there is nothing to sync. Add it under Settings > Secrets and variables > Actions > Variables."); process.exit(0); }
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) { console.error("Could not download the sheet: HTTP " + res.status); process.exit(1); }
  text = await res.text();
  if (/^\s*<(!doctype|html)/i.test(text)) { console.error("The link returned a web page, not CSV. Re-publish the sheet as CSV."); process.exit(1); }
}

const table = parseCsv(text);
if (table.length < 2) { console.error("The sheet looks empty."); process.exit(1); }

const raw = JSON.parse(fs.readFileSync(LISTINGS, "utf8"));
const list = Array.isArray(raw) ? raw : raw.listings;
if (!Array.isArray(list)) throw new Error("Unexpected shape in " + LISTINGS);

const out = applySheet(list, table);
if (out.applied.length || out.verified.length) fs.writeFileSync(LISTINGS, JSON.stringify(raw, null, 2) + "\n");

// Only fail (and so email you) for rejections that are new since the last run
const prev = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, "utf8")).rejected || [] : [];
const now = out.rejected.map((r) => r.id);
const fresh = out.rejected.filter((r) => !prev.includes(r.id));
fs.writeFileSync(STATE, JSON.stringify({ rejected: now }, null, 1) + "\n");

let md = `## Sheet sync\n\n- Price changes applied: ${out.applied.length}\n- Re-verified, same price: ${out.verified.length}\n- Unchanged or older than the site: ${out.ignored}\n- Rejected: ${out.rejected.length}\n- Rows not found in listings: ${out.unmatched.length}\n`;
if (out.applied.length) md += "\n### Applied\n" + out.applied.map((u) => `- ${u.tag}: ${u.old} -> ${u.price}`).join("\n") + "\n";
if (out.verified.length) md += "\n### Re-verified\n" + out.verified.map((u) => `- ${u.tag}`).join("\n") + "\n";
if (out.rejected.length) md += "\n### Rejected (fix the price in the sheet)\n" + out.rejected.map((u) => `- row id ${u.id}, ${u.tag}: ${u.why}`).join("\n") + "\n";
console.log(md);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
if (fresh.length) process.exit(1);
