// Shared helpers for gift.html and tracker.html. (The main page, app.js, has its own copy of the price maths.)
window.GR = (function () {
  const j = (u, opt) => fetch(u, { cache: 'no-cache' }).then(r => { if (!r.ok) throw new Error(u); return r.json(); }).catch(e => { if (opt) return opt; throw e; });
  const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
  const D = {};
  let city = '';
  try { city = localStorage.getItem('gr_city') || ''; } catch (e) {}
  async function load() {
    const [cfg, rates, list, offers, cities, ver] = await Promise.all([
      j('data/config.json'), j('data/rates.json'), j('data/listings.json'),
      j('data/offers.json', {}), j('data/cities.json', { cities: [] }), j('data/verified.json', { brands: {} })]);
    Object.assign(D, { cfg, rates, list, offers, cities: cities.cities || [], ver: ver.brands || {} });
    if (!city || !D.cities.some(c => c.name === city)) city = (D.cities[0] || {}).name || '';
    return D;
  }
  const adj = () => D.cities.find(c => c.name === city) || { adjust24: 0, adjustSilverKg: 0 };
  const rates = () => ({ gold24: D.rates.gold24 + (adj().adjust24 || 0), silver_kg: D.rates.silver_kg + (adj().adjustSilverKg || 0) });
  const setCity = c => { city = c; try { localStorage.setItem('gr_city', c); } catch (e) {} };
  function offerAmt(o, base) { if (!o) return 0; let d = o.type === 'flat' ? o.value : base * o.value / 100; if (o.max) d = Math.min(d, o.max); if (o.min && base < o.min) d = 0; return Math.max(0, Math.round(d)); }
  const couponLive = o => !!o && (!D.offers[o.code] || D.offers[o.code].live === true);
  function calc(l) {
    const c = couponLive(l.coupon) ? offerAmt(l.coupon, l.price) : 0, b = offerAmt(l.bank, l.price - c);
    const final = l.price - c - b, pure = l.weight * l.karat / 24, market = D.rates.gold24 * pure;
    return { ...l, c, b, final, pure, perg: final / pure, market, vs: (final - market) / market * 100, save: l.price - final };
  }
  const subId = l => ('gr-' + l.store + '-' + l.weight + 'g-' + l.karat + 'k').toLowerCase().replace(/[^a-z0-9-]/g, '');
  function link(l) {
    const a = (D.cfg.affiliate || {})[l.store], u0 = l.url || '#'; if (!a) return u0;
    try {
      if (a.template) return a.template.replace('{urlenc}', encodeURIComponent(u0)).replace('{url}', u0).replace('{sub}', encodeURIComponent(subId(l)));
      if (a.param && a.value) { const x = new URL(u0); x.searchParams.set(a.param, a.value); Object.entries(a.extra || {}).forEach(([k, v]) => x.searchParams.set(k, v)); if (a.subParam) x.searchParams.set(a.subParam, subId(l)); return x.toString(); }
    } catch (e) {}
    return u0;
  }
  const verified = l => { const k = Object.keys(D.ver).find(b => b.toLowerCase() === String(l.brand).toLowerCase()); return k && D.ver[k].verified === true ? D.ver[k] : null; };
  return { load, D, inr, adj, rates, setCity, get city() { return city; }, calc, link, verified };
})();
