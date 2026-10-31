// Writes data/sheet_seed.csv from data/listings.json, to load into the Google Sheet.
import fs from "node:fs";
import { toCsv } from "./csv.mjs";

const FILE = process.env.LISTINGS_FILE || "data/listings.json";
const OUTFILE = process.env.SEED_FILE || "data/sheet_seed.csv";
const AUTO = (process.env.AUTO_STORES || "Flipkart,Shopsy").split(",").map((s) => s.trim().toLowerCase());

const raw = JSON.parse(fs.readFileSync(FILE, "utf8"));
const list = Array.isArray(raw) ? raw : raw.listings;
if (!Array.isArray(list)) throw new Error("Unexpected shape in " + FILE);

function iso(v) {
  if (v == null || v === "") return "";
  const ms = typeof v === "number" ? (v > 1e12 ? v : v * 1000) : Date.parse(v);
  return Number.isFinite(ms) ? new Date(ms).toISOString().replace(/\.\d+Z$/, "Z") : "";
}

const rows = [["id", "store", "brand", "karat", "weight_g", "title", "price", "verified", "checked_at", "mode", "url"]];
list.forEach((l, i) =>
  rows.push([
    l.id ?? i + 1, l.store, l.brand ?? "", l.karat, l.weight, l.title ?? "", l.price, "",
    iso(l.checked), AUTO.includes(String(l.store).toLowerCase()) ? "AUTO" : "MANUAL", l.url ?? "",
  ])
);
fs.writeFileSync(OUTFILE, toCsv(rows));
console.log(`Wrote ${rows.length - 1} rows to ${OUTFILE}`);
