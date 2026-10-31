// Decides which listings get a new price. Pure logic, no network.
function median(a) {
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

// Keep the same "checked" format the file already uses
function nowLike(prev) {
  if (typeof prev === "number") return prev > 1e12 ? Date.now() : Math.floor(Date.now() / 1000);
  return new Date().toISOString();
}

// results: Map(url -> { status: "OK"|"WEAK"|"NO PRICE"|"BLOCKED"|"ERROR", price })
export function applyUpdates(list, results, { onlyStores, maxChange = 0.4 }) {
  const out = { updated: [], rejected: [], failed: [], skipped: [] };
  const want = (onlyStores || []).map((s) => s.toLowerCase());

  // Typical price per gram this run, to catch a link that points at the wrong product
  const perGram = [];
  for (const l of list) {
    const r = results.get(l.url);
    if (r && r.status === "OK" && r.price && Number(l.weight) > 0) perGram.push(r.price / Number(l.weight));
  }
  const med = perGram.length ? median(perGram) : null;

  for (const l of list) {
    const tag = `${l.store} ${l.weight}g ${l.karat}K`;
    if (want.length && !want.includes(String(l.store).toLowerCase())) {
      out.skipped.push({ tag, store: l.store });
      continue;
    }
    const r = results.get(l.url);
    if (!r || r.status !== "OK" || !r.price) {
      out.failed.push({ tag, store: l.store, why: r ? r.status : "NOT FETCHED" });
      continue;
    }
    const old = Number(l.price);
    if (old > 0 && Math.abs(r.price - old) / old > maxChange) {
      out.rejected.push({ tag, store: l.store, why: `change ${old} -> ${r.price} is over ${maxChange * 100}%` });
      continue;
    }
    const pg = r.price / Number(l.weight);
    if (med && (pg < med * 0.6 || pg > med * 1.6)) {
      out.rejected.push({ tag, store: l.store, why: `per-gram ${Math.round(pg)} is far from typical ${Math.round(med)}` });
      continue;
    }
    if (r.price !== old) out.updated.push({ tag, store: l.store, old, price: r.price });
    l.price = r.price;
    l.checked = nowLike(l.checked);
  }
  return out;
}
