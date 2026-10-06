/* GoldRadar Elite — Deal score, price history badges, watchlist alerts */
(function(){
'use strict';

// ── Deal scorer ──────────────────────────────────────────────────────────────
function dealScore(item){
  let score = 0, reasons = [];

  const premPct = item.goldValue > 0
    ? ((item.final - item.goldValue) / item.goldValue) * 100
    : null;

  if(premPct !== null){
    if(premPct <= 2)       { score += 40; reasons.push('Near-spot price'); }
    else if(premPct <= 5)  { score += 30; reasons.push('Low premium'); }
    else if(premPct <= 10) { score += 18; reasons.push('Moderate premium'); }
    else if(premPct <= 15) { score += 8;  reasons.push('High premium'); }
    else                   { score += 0;  reasons.push('Very high premium'); }
  }

  if(item.mrp > 0 && item.final < item.mrp){
    const offPct = ((item.mrp - item.final) / item.mrp) * 100;
    if(offPct >= 15)      { score += 30; reasons.push(offPct.toFixed(0)+'% off MRP'); }
    else if(offPct >= 10) { score += 22; reasons.push(offPct.toFixed(0)+'% off MRP'); }
    else if(offPct >= 5)  { score += 14; reasons.push(offPct.toFixed(0)+'% off MRP'); }
    else                  { score += 6;  }
  }

  if(item.coupon){ score += 10; reasons.push('Coupon applied'); }
  if(item.bank){ score += 10; reasons.push('Bank offer'); }

  const trusted = ['Tanishq','MMTC-PAMP','Bangalore Refinery','IBJA'];
  if(item.brand && trusted.some(t => item.brand.includes(t))){ score += 10; reasons.push('Trusted brand'); }

  score = Math.min(100, Math.max(0, Math.round(score)));

  let label, cls;
  if(score >= 75)      { label='Excellent'; cls='score-ex'; }
  else if(score >= 55) { label='Good';      cls='score-good'; }
  else if(score >= 35) { label='Fair';      cls='score-fair'; }
  else                 { label='Poor';      cls='score-poor'; }

  return { score, label, cls, reasons };
}

// ── Price history badge ───────────────────────────────────────────────────────
function histBadge(listingId, currentPrice, phist){
  if(!phist || !phist[listingId]) return null;
  const prices = phist[listingId];
  if(!prices.length) return null;
  const lowest = Math.min(...prices.map(x=>x.p));
  const highest = Math.max(...prices.map(x=>x.p));
  const avg = prices.reduce((a,b)=>a+b.p,0)/prices.length;
  let badge = null;
  if(currentPrice <= lowest * 1.01)       badge = { text:'📉 Lowest ever', cls:'badge-low' };
  else if(currentPrice <= avg * 1.02)     badge = { text:'✅ Below avg', cls:'badge-avg' };
  else if(currentPrice >= highest * 0.99) badge = { text:'🔺 Near high', cls:'badge-high' };
  return { badge, lowest, highest, avg, count: prices.length };
}

// ── Watchlist ─────────────────────────────────────────────────────────────────
const WL_KEY = 'gr_watchlist_v1';
function getWatchlist(){ try { return JSON.parse(localStorage.getItem(WL_KEY)||'{}'); } catch(e){ return {}; } }
function saveWatchlist(wl){ try { localStorage.setItem(WL_KEY, JSON.stringify(wl)); } catch(e){} }
function isWatched(id){ return !!getWatchlist()[id]; }
function toggleWatch(id, meta){
  const wl = getWatchlist();
  if(wl[id]){ delete wl[id]; saveWatchlist(wl); return false; }
  else { wl[id] = { ...meta, addedAt: Date.now() }; saveWatchlist(wl); return true; }
}
function setAlertPrice(id, price){ const wl = getWatchlist(); if(wl[id]) wl[id].alertPrice = price; saveWatchlist(wl); }

// ── HTML builders ─────────────────────────────────────────────────────────────
function scoreBarHtml(s){
  const { score, label, cls } = s;
  const color = cls==='score-ex'?'#34d399':cls==='score-good'?'#e8c56a':cls==='score-fair'?'#f5b942':'#f87171';
  return `<div class="gr-score ${cls}"><div class="gr-score-bar-wrap"><div class="gr-score-bar" style="width:${score}%;background:${color}"></div></div><span class="gr-score-label">Deal score: ${score}/100 · <b>${label}</b></span></div>`;
}
function watchBtnHtml(id, watched){
  return `<button class="gr-watch-btn ${watched?'on':''}" data-wid="${id}">${watched?'👁 Watching':'+ Watch'}</button>`;
}

// ── Score chip (called by app.js) ─────────────────────────────────────────────
function scoreChip(item){
  const sc = dealScore(item);
  const color = sc.cls==='score-ex'?'#34d399':sc.cls==='score-good'?'#e8c56a':sc.cls==='score-fair'?'#f5b942':'#f87171';
  return `<span class="gr-chip" style="background:${color}22;color:${color};border:1px solid ${color}44;border-radius:99px;font-size:11px;font-weight:700;padding:2px 8px">${sc.score}/100 · ${sc.label}</span>`;
}

// ── Watch chip (called by app.js) ─────────────────────────────────────────────
function watchChip(id, meta){
  const watched = isWatched(id);
  return `<button class="gr-watch-btn ${watched?'on':''}" data-wid="${JSON.stringify(meta).replace(/"/g,'&quot;')}" data-id="${id}" onclick="window.GRX&&GRX._onWatch(this)">${watched?'👁 Watching':'+ Watch'}</button>`;
}

// ── History chip (called by app.js) ──────────────────────────────────────────
function histChip(listingId, currentPrice, phist){
  const hi = histBadge(listingId, currentPrice, phist);
  if(!hi || !hi.badge) return '';
  return `<span class="gr-hist-badge ${hi.badge.cls}">${hi.badge.text}</span>`;
}

// ── Decorate card ─────────────────────────────────────────────────────────────
function decorateCard(cardEl, item, phist){
  if(cardEl.dataset.grDone) return;
  cardEl.dataset.grDone = '1';
  const id = item.id || (item.store+'-'+item.weight+'-'+item.karat);
  const sc = dealScore(item);
  const scoreEl = document.createElement('div');
  scoreEl.innerHTML = scoreBarHtml(sc);
  cardEl.appendChild(scoreEl.firstElementChild);
  const hi = histBadge(id, item.final, phist);
  if(hi && hi.badge){
    const b = document.createElement('span');
    b.className = 'gr-hist-badge '+hi.badge.cls;
    b.textContent = hi.badge.text;
    const badgeSlot = cardEl.querySelector('.badge');
    if(badgeSlot) badgeSlot.appendChild(b); else cardEl.insertBefore(b, cardEl.firstChild);
  }
  const watched = isWatched(id);
  const wDiv = document.createElement('div');
  wDiv.className = 'gr-watch-wrap';
  wDiv.innerHTML = watchBtnHtml(id, watched);
  cardEl.appendChild(wDiv);
  wDiv.querySelector('.gr-watch-btn').addEventListener('click', function(){
    const nowWatched = toggleWatch(id, { store:item.store, weight:item.weight, karat:item.karat, price:item.final, brand:item.brand });
    this.className = 'gr-watch-btn '+(nowWatched?'on':'');
    this.textContent = nowWatched ? '👁 Watching' : '+ Watch';
    if(nowWatched){ const ap = prompt('Set alert price (₹)? Leave blank to skip.'); if(ap && !isNaN(+ap)) setAlertPrice(id, +ap); }
  });
}

// ── Check alerts ──────────────────────────────────────────────────────────────
function checkAlerts(listings){
  const wl = getWatchlist();
  listings.forEach(item => {
    const id = item.id || (item.store+'-'+item.weight+'-'+item.karat);
    const entry = wl[id];
    if(!entry || !entry.alertPrice) return;
    if(item.final <= entry.alertPrice && !entry.alerted){
      if('Notification' in window && Notification.permission === 'granted'){
        new Notification('GoldRadar Alert 🏅', { body:`${item.store} ${item.weight}g ${item.karat} dropped to ₹${item.final.toLocaleString('en-IN')}!`, icon:'/icon-192.png' });
      }
      entry.alerted = true; saveWatchlist(wl);
    } else if(item.final > entry.alertPrice){ entry.alerted = false; saveWatchlist(wl); }
  });
}

// ── Watchlist panel ───────────────────────────────────────────────────────────
function renderWatchlistPanel(){
  const wl = getWatchlist();
  const keys = Object.keys(wl);
  const panel = document.getElementById('grWatchPanel');
  if(!panel) return;
  if(!keys.length){ panel.innerHTML = '<p class="gr-wl-empty">No items in watchlist. Click "+ Watch" on any listing.</p>'; return; }
  panel.innerHTML = keys.map(id => {
    const e = wl[id];
    return `<div class="gr-wl-card"><div class="gr-wl-name">${e.store||''} · ${e.weight||''}g · ${e.karat||''}</div><div class="gr-wl-brand">${e.brand||''}</div><div class="gr-wl-price">Added at ₹${(e.price||0).toLocaleString('en-IN')}</div>${e.alertPrice?`<div class="gr-wl-alert">Alert: ₹${e.alertPrice.toLocaleString('en-IN')}</div>`:''}<button class="gr-wl-remove" data-wid="${id}">Remove</button></div>`;
  }).join('');
  panel.querySelectorAll('.gr-wl-remove').forEach(btn => {
    btn.addEventListener('click', function(){ const w=getWatchlist(); delete w[this.dataset.wid]; saveWatchlist(w); renderWatchlistPanel(); });
  });
}

// ── Public API ────────────────────────────────────────────────────────────────
window.GRX = {
  init: function(cfg, phist){ this._cfg=cfg; this._phist=phist||{}; },
  decorateAll: function(listings, phist){
    phist = phist||this._phist||{};
    document.querySelectorAll('.card:not([data-gr-done])').forEach((card,i)=>{ if(listings[i]) decorateCard(card,listings[i],phist); });
    checkAlerts(listings);
    renderWatchlistPanel();
  },
  scoreChip, watchChip, histChip, dealScore, histBadge, isWatched, toggleWatch, getWatchlist, renderWatchlistPanel,
  _onWatch: function(btn){
    const id = btn.dataset.id||'item-'+Math.random().toString(36).slice(2);
    let meta={}; try{ meta=JSON.parse(btn.dataset.wid.replace(/&quot;/g,'"')); }catch(e){}
    const nowWatched = toggleWatch(id,{...meta,price:meta.final||0});
    btn.className='gr-watch-btn '+(nowWatched?'on':'');
    btn.textContent=nowWatched?'👁 Watching':'+ Watch';
    if(nowWatched && 'Notification' in window && Notification.permission!=='granted') Notification.requestPermission();
    renderWatchlistPanel();
  }
};

// ── Auto-decorate on render ───────────────────────────────────────────────────
const obs = new MutationObserver(()=>{
  const grid = document.getElementById('grid');
  if(!grid) return;
  grid.querySelectorAll('.card:not([data-gr-done])').forEach(card=>{
    card.dataset.grDone='1';
    const finEl=card.querySelector('.fin');
    const final=finEl?parseFloat(finEl.textContent.replace(/[^0-9.]/g,''))||0:0;
    const sc=dealScore({final,mrp:0,goldValue:0,coupon:false,bank:false});
    const scoreEl=document.createElement('div'); scoreEl.innerHTML=scoreBarHtml(sc); card.appendChild(scoreEl.firstElementChild);
    const id='card-'+Math.random().toString(36).slice(2);
    const wDiv=document.createElement('div'); wDiv.className='gr-watch-wrap'; wDiv.innerHTML=watchBtnHtml(id,false); card.appendChild(wDiv);
    wDiv.querySelector('.gr-watch-btn').addEventListener('click',function(){
      const nw=toggleWatch(id,{price:final}); this.className='gr-watch-btn '+(nw?'on':''); this.textContent=nw?'👁 Watching':'+ Watch';
      if(nw && 'Notification' in window && Notification.permission!=='granted') Notification.requestPermission();
    });
  });
});

document.addEventListener('DOMContentLoaded',()=>{
  const grid=document.getElementById('grid');
  if(grid) obs.observe(grid,{childList:true,subtree:false});
  renderWatchlistPanel();
});

})();
