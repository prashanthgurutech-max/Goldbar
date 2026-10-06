/* GoldRadar Elite — Deal score, price history, watchlist */
(function(){
'use strict';

// ── Deal scorer ───────────────────────────────────────────────────────────────
function dealScore(item){
  let score=0,reasons=[];
  const premPct=item.goldValue>0?((item.final-item.goldValue)/item.goldValue)*100:
                item.vs!=null?item.vs:null;
  if(premPct!==null){
    if(premPct<=2)      {score+=40;reasons.push('Near-spot price');}
    else if(premPct<=5) {score+=30;reasons.push('Low premium');}
    else if(premPct<=10){score+=18;reasons.push('Moderate premium');}
    else if(premPct<=15){score+=8; reasons.push('High premium');}
    else                {score+=0; reasons.push('Very high premium');}
  }
  if(item.mrp>0&&item.final<item.mrp){
    const off=((item.mrp-item.final)/item.mrp)*100;
    if(off>=15)     {score+=30;reasons.push(off.toFixed(0)+'% off MRP');}
    else if(off>=10){score+=22;reasons.push(off.toFixed(0)+'% off MRP');}
    else if(off>=5) {score+=14;reasons.push(off.toFixed(0)+'% off MRP');}
    else            {score+=6;}
  }
  if(item.save>0){
    const sp=(item.save/(item.price||item.final+item.save))*100;
    if(sp>=15)     {score=Math.max(score,score+10);reasons.push('Big saving');}
    else if(sp>=5) {reasons.push('Some saving');}
  }
  if(item.coupon||item.c>0){score+=5;reasons.push('Coupon applied');}
  if(item.bank||item.b>0){score+=5;reasons.push('Bank offer');}
  const trusted=['Tanishq','MMTC-PAMP','Bangalore Refinery','IBJA'];
  if(item.brand&&trusted.some(t=>item.brand.includes(t))){score+=10;reasons.push('Trusted brand');}
  score=Math.min(100,Math.max(0,Math.round(score)));
  let label,cls;
  if(score>=75)     {label='Excellent';cls='score-ex';}
  else if(score>=55){label='Good';     cls='score-good';}
  else if(score>=35){label='Fair';     cls='score-fair';}
  else              {label='Poor';     cls='score-poor';}
  return{score,label,cls,reasons};
}

// ── Colour helper ─────────────────────────────────────────────────────────────
function scoreColor(cls){
  return cls==='score-ex'?'#34d399':cls==='score-good'?'#e8c56a':cls==='score-fair'?'#f5b942':'#f87171';
}

// ── Price history helpers ─────────────────────────────────────────────────────
const PHIST_KEY='gr_phist_v1';
let _phist={};

function histInfo(listingId,currentPrice){
  const ph=_phist&&(_phist.p||_phist);
  const prices=ph[listingId];
  if(!prices||!prices.length)return null;
  const vals=prices.map(x=>typeof x==='object'?x.p:x);
  const lowest=Math.min(...vals),highest=Math.max(...vals);
  const avg=vals.reduce((a,b)=>a+b,0)/vals.length;
  let badge=null;
  if(currentPrice<=lowest*1.01)     badge={text:'📉 Lowest ever',cls:'badge-low'};
  else if(currentPrice<=avg*1.02)   badge={text:'✅ Below avg',  cls:'badge-avg'};
  else if(currentPrice>=highest*0.99)badge={text:'🔺 Near high', cls:'badge-high'};
  return{badge,lowest,highest,avg,count:vals.length};
}

// ── Watchlist storage ─────────────────────────────────────────────────────────
const WL_KEY='gr_watchlist_v2';

function readWatch(){
  try{return JSON.parse(localStorage.getItem(WL_KEY)||'[]');}catch(e){return[];}
}
function writeWatch(list){
  try{localStorage.setItem(WL_KEY,JSON.stringify(list));}catch(e){}
}
function toggleWatch(listing,price){
  let list=readWatch();
  const idx=list.findIndex(x=>x.id===listing.id);
  if(idx>=0){list.splice(idx,1);}
  else{list.push({id:listing.id,brand:listing.brand,store:listing.store,
    weight:listing.weight,karat:listing.karat,target:Math.round(price*0.97)});}
  writeWatch(list);
}
function hits(allListings){
  const w=readWatch();
  return w.filter(it=>{const l=allListings.find(x=>x.id===it.id);return l&&l.final<=it.target;});
}

// ── HTML builders ─────────────────────────────────────────────────────────────

// Inline score chip — used inline after store name in cards
function scoreChip(item){
  const sc=dealScore(item);
  const c=scoreColor(sc.cls);
  return `<span class="gr-chip" style="background:${c}22;color:${c};border:1px solid ${c}44;border-radius:99px;font-size:11px;font-weight:700;padding:2px 8px;margin-left:6px;vertical-align:middle">${sc.score}/100 · ${sc.label}</span>`;
}

// Price history badge — placed after price line in cards (GRX.badge)
function badge(item){
  const id=item.id||(item.store+'-'+item.weight+'-'+item.karat);
  const hi=histInfo(id,item.final);
  if(!hi||!hi.badge)return'';
  return `<span class="gr-hist-badge ${hi.badge.cls}">${hi.badge.text}</span>`;
}

// Expanded score panel — shown inside card details (GRX.scorePanel)
function scorePanel(item){
  const sc=dealScore(item);
  const c=scoreColor(sc.cls);
  return `<div class="gr-score ${sc.cls}" style="margin-top:8px">
    <div class="gr-score-bar-wrap"><div class="gr-score-bar" style="width:${sc.score}%;background:${c}"></div></div>
    <span class="gr-score-label">Deal score: ${sc.score}/100 · <b>${sc.label}</b>${sc.reasons.length?' · '+sc.reasons.join(', '):''}</span>
  </div>`;
}

// Watch button — on each card (GRX.watchBtn)
function watchBtn(item){
  const list=readWatch();
  const watched=list.some(x=>x.id===item.id);
  return `<button class="gr-watch-btn ${watched?'on':''}" data-watch="${item.id}" type="button">${watched?'👁 Watching':'+ Watch'}</button>`;
}

// History rows — used inside breakdown <details> (GRX.histRows)
function histRows(item){
  const id=item.id||(item.store+'-'+item.weight+'-'+item.karat);
  const hi=histInfo(id,item.final);
  if(!hi)return'';
  const inr=n=>'₹'+Math.round(n).toLocaleString('en-IN');
  return `<div class="r"><span>Lowest ever</span><span>${inr(hi.lowest)}</span></div>
    <div class="r"><span>Avg price (${hi.count} days)</span><span>${inr(hi.avg)}</span></div>
    <div class="r"><span>Highest</span><span>${inr(hi.highest)}</span></div>`;
}

// ── Public API ────────────────────────────────────────────────────────────────
window.GRX={
  init:function(cfg,phist){this._cfg=cfg;_phist=phist||{};},
  scoreChip,
  badge,
  scorePanel,
  watchBtn,
  readWatch,
  writeWatch,
  toggleWatch,
  hits,
  histRows,
  dealScore,
  // legacy aliases kept for any other callers
  scoreChipHtml:scoreChip,
  watchChip:function(id,meta){const l=Object.assign({id},meta||{});return watchBtn(l);},
  histChip:badge,
  isWatched:function(id){return readWatch().some(x=>x.id===id);},
  getWatchlist:readWatch,
  renderWatchlistPanel:function(){}, // handled by app.js watchPanel()
  decorateAll:function(listings){
    if(!listings)return;
    document.querySelectorAll('.card:not([data-gr-done])').forEach((card,i)=>{
      if(!listings[i])return;
      card.dataset.grDone='1';
    });
  }
};

})();
