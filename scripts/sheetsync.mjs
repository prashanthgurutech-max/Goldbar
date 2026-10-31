// Applies rows from the Google Sheet to the listings. No network or file access.
// Reduce a product link to a key that survives tracking params and share links
function key(u) {
  try {
    const x = new URL(u);
    const host = x.host.replace(/^www\./, "").toLowerCase();
    const asin = x.pathname.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
    if (asin) return "amazon:" + asin[1].toUpperCase();
    const pid = x.searchParams.get("pid");
    if (pid) return host + ":pid:" + pid;
    if (host.endsWith("myntra.com")) {
      const id = x.pathname.match(/\/(\d{5,})(?:\/buy)?\/?$/);
      if (id) return "myntra:" + id[1];
    }
    if (host.endsWith("ajio.com")) {
      const id = x.pathname.match(/\/p\/([A-Za-z0-9_]+)/);
      if (id) return "ajio:" + id[1];
    }
    return host + x.pathname.replace(/\/+$/, "").toLowerCase();
  } catch {
    return "";
  }
}

export function parseTime(v) {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  if (/^\d+(\.\d+)?$/.test(s)) { const n = Number(s); return n > 1e12 ? n : n * 1000; }
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : null;
}

function formatLike(prev, ms) {
  if (typeof prev === "number") return prev > 1e12 ? ms : Math.floor(ms / 1000);
  return new Date(ms).toISOString();
}

function toPrice(v) {
  const n = Number(String(v ?? "").replace(/[^\d.]/g, ""));
  return /\d/.test(String(v ?? "")) && Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

export function applySheet(list, table, maxChange = 0.4) {
  const [head, ...body] = table;
  const col = (n) => head.map((h) => h.trim().toLowerCase()).indexOf(n);
  const ci = { id: col("id"), price: col("price"), checked: col("checked_at"), url: col("url") };
  if (ci.price < 0 || ci.checked < 0 || (ci.id < 0 && ci.url < 0)) throw new Error("Sheet is missing columns (need id or url, price, checked_at)");

  const out = { applied: [], verified: [], ignored: 0, rejected: [], unmatched: [] };
  for (const r of body) {
    const id = ci.id >= 0 ? String(r[ci.id] ?? "").trim() : "";
    const url = ci.url >= 0 ? String(r[ci.url] ?? "").trim() : "";
    let l = id ? list.find((x) => String(x.id) === id) : undefined;
    if (!l && url) l = list.find((x) => key(x.url || "") === key(url));
    if (!l) { out.unmatched.push({ id, url }); continue; }

    const tag = `${l.store} ${l.weight}g ${l.karat}K`;
    const sheetMs = parseTime(r[ci.checked]);
    if (sheetMs == null) { out.ignored++; continue; }          // never stamped: leave the listing alone
    const listMs = parseTime(l.checked);
    if (listMs != null && sheetMs <= listMs) { out.ignored++; continue; } // listing already newer (e.g. auto updater)

    const price = toPrice(r[ci.price]);
    if (!price) { out.rejected.push({ id: String(l.id), tag, why: "price is empty or not a number" }); continue; }
    const old = Number(l.price);
    if (old > 0 && Math.abs(price - old) / old > maxChange) {
      out.rejected.push({ id: String(l.id), tag, why: `change ${old} -> ${price} is over ${maxChange * 100}%` });
      continue;
    }
    l.price = price;
    l.checked = formatLike(l.checked, sheetMs);
    (price !== old ? out.applied.push({ tag, old, price }) : out.verified.push({ tag }));
  }
  return out;
}
