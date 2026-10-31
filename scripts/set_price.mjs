import fs from "node:fs";

const FILE = process.env.LISTINGS_FILE || "data/listings.json";
const raw = JSON.parse(fs.readFileSync(FILE, "utf8"));
const list = Array.isArray(raw) ? raw : raw.listings;
if (!Array.isArray(list)) throw new Error("Unexpected shape in " + FILE);

// Reduce a product URL to a key that survives tracking params and name changes
function key(u) {
  try {
    const x = new URL(u);
    const host = x.host.replace(/^www\./, "").toLowerCase();
    const asin = x.pathname.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
    if (asin) return "amazon:" + asin[1].toUpperCase();
    const pid = x.searchParams.get("pid");
    if (pid) return host + ":pid:" + pid;
    return host + x.pathname.replace(/\/+$/, "").toLowerCase();
  } catch {
    return "";
  }
}

const target = key(process.env.IN_URL || "");
const price = Math.round(Number(String(process.env.IN_PRICE || "").replace(/[^\d.]/g, "")));
if (!target || !(price > 0)) throw new Error("Need a valid url and a price above 0");

const hits = list.filter((l) => key(l.url || "") === target);
if (!hits.length) throw new Error("No listing in " + FILE + " has this product URL: " + target);

for (const l of hits) {
  const old = Number(l.price);
  if (old > 0 && Math.abs(price - old) / old > 0.4 && process.env.IN_FORCE !== "true") {
    throw new Error(`Change from ${old} to ${price} is over 40%. Re-run with force=true if it is correct.`);
  }
  const prev = l.checked;
  l.price = price;
  // Keep the same format the file already uses for "checked"
  l.checked =
    typeof prev === "number"
      ? prev > 1e12 ? Date.now() : Math.floor(Date.now() / 1000)
      : new Date().toISOString();
  console.log(`Updated ${l.store} ${l.weight}g ${l.karat}K: ${old} -> ${price}`);
}
fs.writeFileSync(FILE, JSON.stringify(raw, null, 2) + "\n");
