// Pulls a price out of a product page's HTML. Trusted sources first.
// "trusted" = structured data the store publishes for search engines.
function toNumber(v) {
  const n = Number(String(v).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

function walk(node, out) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) return node.forEach((n) => walk(n, out));
  if (node.offers) {
    const offers = Array.isArray(node.offers) ? node.offers : [node.offers];
    for (const o of offers) {
      const p = toNumber(o.price ?? o.lowPrice ?? o.priceSpecification?.price);
      if (p) out.push(p);
    }
  }
  for (const k of Object.keys(node)) if (k !== "offers") walk(node[k], out);
}

export function extractPrice(html) {
  const found = [];

  // 1) JSON-LD (schema.org Product / Offer)
  for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const prices = [];
      walk(JSON.parse(m[1]), prices);
      if (prices.length) return { price: prices[0], source: "jsonld", trusted: true };
    } catch {}
  }

  // 2) meta tags
  const metaRe =
    /<meta[^>]+(?:property|name|itemprop)=["'](?:product:price:amount|og:price:amount|price)["'][^>]*content=["']([^"']+)["']/i;
  const m2 = html.match(metaRe);
  if (m2 && toNumber(m2[1])) return { price: toNumber(m2[1]), source: "meta", trusted: true };
  const m2b = html.match(
    /<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name|itemprop)=["'](?:product:price:amount|og:price:amount|price)["']/i
  );
  if (m2b && toNumber(m2b[1])) return { price: toNumber(m2b[1]), source: "meta", trusted: true };

  // 3) embedded app JSON: informational only, never trusted for writes
  const m3 = html.match(/"(?:sellingPrice|finalPrice|offerPrice|price)"\s*:\s*"?(\d[\d,]{2,}(?:\.\d+)?)"?/);
  if (m3 && toNumber(m3[1])) return { price: toNumber(m3[1]), source: "embedded", trusted: false };

  return { price: null, source: "none", trusted: false };
}

export function looksBlocked(text, title) {
  const t = (title || "").toLowerCase();
  if (/access denied|captcha|robot|just a moment|attention required|forbidden|blocked/.test(t)) return true;
  return String(text || "").trim().length < 300;
}
