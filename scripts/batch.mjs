// Parsing and matching for the batch price update. No file or network access.

// Reduce a product link to a key that survives tracking params and share links
export function key(u) {
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

function toPrice(tok) {
  const n = Number(String(tok).replace(/[^\d.]/g, ""));
  return /\d/.test(tok) && Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

// "url price [force]" on each line. Several pairs on one line also work.
export function parseBatch(text) {
  const pairs = [];
  const bad = [];
  for (const line of String(text).split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const toks = t.split(/[\s;]+/).filter(Boolean);
    let url = null;
    for (let i = 0; i < toks.length; i++) {
      const tok = toks[i];
      if (/^https?:\/\//i.test(tok)) {
        if (url) bad.push({ line: t, why: "link without a price: " + url });
        url = tok;
      } else if (url) {
        const price = toPrice(tok);
        if (price) {
          const force = (toks[i + 1] || "").toLowerCase() === "force";
          pairs.push({ url, price, force });
          if (force) i++;
          url = null;
        }
      }
    }
    if (url) bad.push({ line: t, why: "link without a price: " + url });
  }
  return { pairs, bad };
}

function nowLike(prev) {
  if (typeof prev === "number") return prev > 1e12 ? Date.now() : Math.floor(Date.now() / 1000);
  return new Date().toISOString();
}

export function applyBatch(list, pairs, maxChange = 0.4) {
  const out = { updated: [], failed: [] };
  for (const p of pairs) {
    const k = key(p.url);
    const hits = list.filter((l) => key(l.url || "") === k);
    if (!k || !hits.length) {
      out.failed.push({ ...p, why: "no listing has this product link" });
      continue;
    }
    for (const l of hits) {
      const old = Number(l.price);
      if (old > 0 && Math.abs(p.price - old) / old > maxChange && !p.force) {
        out.failed.push({ ...p, why: `change ${old} -> ${p.price} is over ${maxChange * 100}%, add the word force to allow it` });
        continue;
      }
      l.price = p.price;
      l.checked = nowLike(l.checked);
      out.updated.push({ tag: `${l.store} ${l.weight}g ${l.karat}K`, old, price: p.price });
    }
  }
  return out;
}
