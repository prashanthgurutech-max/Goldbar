/* GoldRadar elite layer.
   Three independent pieces, all pure where possible so app.js can call them inside its templates:
     GRX.hist   price history per listing: lowest in 30/90 days, change since yesterday, sparkline
     GRX.score  explainable 0-100 deal score
     GRX.watch  price watchlist kept in the visitor's browser, plus optional email alerts via Supabase
   Loaded before app.js. Everything degrades to empty strings when data is missing, so the page
   works exactly as before on day one, when there is only a single day of price history. */
window.GRX = (function () {
  'use strict';
  const tr = (k, v) => (window.I18N ? I18N.t(k, v) : k);
  const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  let PH = { days: [], p: {} };   // price history, loaded by app.js
  let CFG = {};

  /* ---------------------------------------------------------------- history */

  // Every recorded price for a listing, oldest first, with its day. Nulls dropped.
  function series(id) {
    const row = PH.p && PH.p[String(id)];
    if (!row) return [];
    const out = [];
    for (let i = 0; i < row.length; i++) if (row[i] != null) out.push({ d: PH.days[i], v: row[i] });
    return out;
  }

  // Everything the UI needs about one listing's price past. Returns null when there is
  // not enough history to say anything honest (fewer than 2 distinct recorded days).
  function stats(l) {
    const s = series(l.id);
    if (s.length < 2) return null;
    const now = typeof l.price === 'number' ? l.price : s[s.length - 1].v;
    const within = n => {
      const cut = Date.now() - n * 864e5;
      return s.filter(x => Date.parse(x.d + 'T00:00:00+05:30') >= cut);
    };
    const lows = arr => (arr.length ? Math.min.apply(null, arr.map(x => x.v)) : null);
    const highs = arr => (arr.length ? Math.max.apply(null, arr.map(x => x.v)) : null);
    const w30 = within(30), w90 = within(90);
    const prev = s[s.length - 2].v;                     // previous recorded day
    const weekAgo = within(8)[0];
    return {
      days: s.length,
      now,
      first: s[0],
      low30: lows(w30), high30: highs(w30),
      low90: lows(w90), lowAll: lows(s), highAll: highs(s),
      dayDelta: now - prev,
      weekDelta: weekAgo ? now - weekAgo.v : null,
      atLow30: w30.length > 1 && now <= lows(w30),
      atLowAll: s.length > 2 && now <= lows(s),
      series: s
    };
  }

  // The badge shown on a card: "Lowest in 30 days", "Down ₹412 since yesterday", etc.
  function badge(l) {
    const t = stats(l);
    if (!t) return '';
    const bits = [];
    if (t.atLowAll && t.days >= 5) bits.push(`<span class="ph-tag low">${tr('Lowest ever recorded')}</span>`);
    else if (t.atLow30) bits.push(`<span class="ph-tag low">${tr('Lowest in 30 days')}</span>`);
    if (t.dayDelta < 0) bits.push(`<span class="ph-tag down">${tr('Down {p} since {d}', { p: inr(-t.dayDelta), d: t.series[t.series.length - 2].d.slice(8) + '/' + t.series[t.series.length - 2].d.slice(5, 7) })}</span>`);
    else if (t.dayDelta > 0) bits.push(`<span class="ph-tag up">${tr('Up {p}', { p: inr(t.dayDelta) })}</span>`);
    if (!bits.length && t.low30 != null && t.now > t.low30)
      bits.push(`<span class="ph-tag mut">${tr('{p} above its 30-day low', { p: inr(t.now - t.low30) })}</span>`);
    return bits.length ? `<div class="ph">${bits.join('')}${spark(l)}</div>` : '';
  }

  // Tiny inline sparkline, no library. Width scales with however many days exist.
  function spark(l) {
    const t = stats(l);
    if (!t || t.series.length < 3) return '';
    const v = t.series.map(x => x.v), W = 72, H = 22;
    const mn = Math.min.apply(null, v), mx = Math.max.apply(null, v), rng = mx - mn || 1;
    const x = i => (i * W / (v.length - 1)).toFixed(1);
    const y = n => (H - 3 - (n - mn) / rng * (H - 6)).toFixed(1);
    const pts = v.map((n, i) => x(i) + ',' + y(n)).join(' ');
    const rising = v[v.length - 1] >= v[0];
    const c = rising ? 'var(--red)' : 'var(--green)';
    return `<svg class="ph-spark" viewBox="0 0 ${W} ${H}" aria-label="${tr('{n}-day price trend', { n: v.length })}" role="img">
      <polyline points="${pts}" fill="none" stroke="${c}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>
      <circle cx="${x(v.length - 1)}" cy="${y(v[v.length - 1])}" r="2.2" fill="${c}"/></svg>`;
  }

  // The rows added to the "What you pay" panel when history exists.
  function histRows(l) {
    const t = stats(l);
    if (!t) return '';
    const r = (a, b) => `<div class="r"><span>${a}</span><span>${b}</span></div>`;
    return r(tr('Lowest in 30 days'), t.low30 != null ? inr(t.low30) : '–')
      + (t.days >= 5 ? r(tr('Lowest recorded'), inr(t.lowAll)) : '')
      + r(tr('Tracked for'), tr('{n} days', { n: t.days }));
  }

  /* ------------------------------------------------------------------ score */

  // 0-100, and the reasons behind it. Deliberately dominated by premium over gold value,
  // because that is the only number that decides whether gold is bought well.
  const BANDS = [[80, 'Excellent', 'ex'], [65, 'Good', 'gd'], [45, 'Fair', 'fr'], [0, 'Poor', 'pr']];
  function score(l) {
    const parts = [];
    // Premium over the metal's own value: 55 points, zero by +12%.
    const vs = typeof l.vs === 'number' ? l.vs : 0;
    const pPrem = Math.max(0, Math.min(1, 1 - Math.max(0, vs) / 12)) * 55;
    parts.push({ label: tr('Premium over gold value'), got: pPrem, max: 55, note: (vs >= 0 ? '+' : '') + vs.toFixed(1) + '%' });
    // Offers actually applied: 15 points, full at a 6% saving.
    const savePct = l.price > 0 ? (l.save || 0) / l.price * 100 : 0;
    const pSave = Math.max(0, Math.min(1, savePct / 6)) * 15;
    parts.push({ label: tr('Coupon and bank offers'), got: pSave, max: 15, note: savePct > 0 ? '−' + savePct.toFixed(1) + '%' : tr('none') });
    // How recently the price was verified: 15 points.
    const hrs = l.checked ? (Date.now() - new Date(l.checked)) / 36e5 : 1e9;
    const pFresh = hrs <= (CFG.staleHours || 24) ? 15 : hrs <= (CFG.expiredHours || 72) ? 8 : 2;
    parts.push({ label: tr('Price freshness'), got: pFresh, max: 15, note: l.checked ? tr('{n} h old', { n: Math.round(hrs) }) : tr('unknown') });
    // Brand you have personally verified: 10 points, 3 when simply unverified.
    const ver = !!(window.GRVerified && GRVerified(l));
    parts.push({ label: tr('Verified brand'), got: ver ? 10 : 3, max: 10, note: ver ? tr('yes') : tr('not checked') });
    // Where it sits in its own price history: 5 points.
    const t = stats(l);
    let pHist = 2.5, hNote = tr('no history yet');
    if (t && t.high30 != null && t.low30 != null) {
      const rng = t.high30 - t.low30;
      pHist = rng > 0 ? (1 - (t.now - t.low30) / rng) * 5 : 5;
      hNote = t.atLow30 ? tr('at its 30-day low') : inr(t.now - t.low30) + ' ' + tr('above its low');
    }
    parts.push({ label: tr('Against its own history'), got: pHist, max: 5, note: hNote });

    const total = Math.round(parts.reduce((a, b) => a + b.got, 0));
    const band = BANDS.find(b => total >= b[0]);
    return { total, label: band[1], cls: band[2], parts };
  }

  function scoreChip(l) {
    const s = score(l);
    return `<span class="ds ds-${s.cls}" title="${tr('Deal score')}: ${s.total}/100"><b>${s.total}</b><i>${tr(s.label)}</i></span>`;
  }

  function scorePanel(l) {
    const s = score(l);
    return `<details class="bd ds-panel"><summary>${tr('Deal score')}: ${s.total}/100 · ${tr(s.label)}</summary>
      ${s.parts.map(p => `<div class="r"><span>${p.label} <em>${esc(p.note)}</em></span><span>${p.got.toFixed(0)}/${p.max}</span></div>`).join('')}
      <div class="r tot"><span>${tr('Total')}</span><span>${s.total}/100</span></div>
      <p>${tr('The score is mostly how far the price sits above the gold it contains, then offers, how recently we checked the price, whether you have verified the brand, and where it sits in its own price history. It is a guide, not advice.')}</p></details>`;
  }

  /* -------------------------------------------------------------- watchlist */

  const WKEY = 'gr_watch';
  const readWatch = () => { try { return JSON.parse(localStorage.getItem(WKEY) || '[]'); } catch (e) { return []; } };
  const writeWatch = w => { try { localStorage.setItem(WKEY, JSON.stringify(w)); } catch (e) {} };

  function isWatched(id) { return readWatch().some(w => w.id === id); }

  function toggleWatch(l, target) {
    const w = readWatch(), i = w.findIndex(x => x.id === l.id);
    if (i >= 0) { w.splice(i, 1); writeWatch(w); return false; }
    w.push({
      id: l.id, target: Math.round(target), at: Date.now(),
      store: l.store, brand: l.brand, weight: l.weight, karat: l.karat, seen: l.final
    });
    writeWatch(w);
    return true;
  }

  function watchBtn(l) {
    const on = isWatched(l.id);
    return `<button class="watchbtn${on ? ' on' : ''}" type="button" data-watch="${l.id}">${on ? tr('Watching') : tr('Alert me on a drop')}</button>`;
  }

  // Which watched items are at or below their target right now.
  function hits(all) {
    const w = readWatch(), out = [];
    for (const it of w) {
      const l = all.find(x => x.id === it.id);
      if (l && l.final <= it.target) out.push({ ...it, now: l.final, l });
    }
    return out;
  }

  function init(cfg, ph) {
    CFG = cfg || {};
    PH = (ph && ph.days) ? ph : { days: [], p: {} };
  }

  return {
    init, stats, series, badge, spark, histRows,
    score, scoreChip, scorePanel,
    readWatch, writeWatch, isWatched, toggleWatch, watchBtn, hits,
    get days() { return PH.days.length; }
  };
})();
