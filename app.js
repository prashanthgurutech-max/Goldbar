const $=s=>document.querySelector(s);
const inr=n=>'₹'+Math.round(n).toLocaleString('en-IN');
const KARATS=[24,22,18,14],WEIGHTS=[1,2,5,10,20];
const st={karat:24,weight:1,store:'All',coupon:true,bank:true,sort:'final',hist:'g24',range:'30',city:'',cmp:[]};
let CFG,RATES,LIST,HIST,OFFERS={},CITIES=[],FEST={festivals:[]},VER={};
const tr=(k,v)=>I18N.t(k,v);

async function load(){
  const j=u=>fetch(u,{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error(u);return r.json()});
  [CFG,RATES,LIST,HIST]=await Promise.all([j('data/config.json'),j('data/rates.json'),j('data/listings.json'),j('data/history.json')]);
  try{OFFERS=await j('data/offers.json')}catch(e){OFFERS={}}
  const o=(u,d)=>j(u).catch(()=>d);
  [CITIES,FEST,VER]=await Promise.all([o('data/cities.json',{cities:[]}).then(x=>x.cities||[]),o('data/festivals.json',{festivals:[]}),o('data/verified.json',{brands:{}}).then(x=>x.brands||{})]);
  try{st.city=localStorage.getItem('gr_city')||''}catch(e){}
  if(!CITIES.some(c=>c.name===st.city))st.city=(CITIES[0]||{}).name||'';
  $('#siteName').textContent=CFG.siteName||'GoldRadar';
  bannerSet();
  const p=new URLSearchParams(location.search);
  if(KARATS.includes(+p.get('k')))st.karat=+p.get('k');
  if(WEIGHTS.includes(+p.get('w')))st.weight=+p.get('w');
  setup();render();
  window.GRTrack&&GRTrack.init(CFG.supabase);
}
function offerAmt(o,base){if(!o)return 0;let d=o.type==='flat'?o.value:base*o.value/100;if(o.max)d=Math.min(d,o.max);if(o.min&&base<o.min)d=0;return Math.max(0,Math.round(d))}
function couponLive(o){return !!o&&(!OFFERS[o.code]||OFFERS[o.code].live===true)}
function calc(l){
  const c=st.coupon&&couponLive(l.coupon)?offerAmt(l.coupon,l.price):0;
  const b=st.bank?offerAmt(l.bank,l.price-c):0;
  const final=l.price-c-b,pure=l.weight*l.karat/24,market=RATES.gold24*pure;
  return{...l,c,b,final,perg:final/pure,market,vs:(final-market)/market*100,save:l.price-final};
}
function subId(l){return ('gr-'+l.store+'-'+l.weight+'g-'+l.karat+'k').toLowerCase().replace(/[^a-z0-9-]/g,'')}
function affOn(l){const a=(CFG.affiliate||{})[l.store];return !!a&&!!(a.template||(a.param&&a.value))}
function link(l){
  const a=(CFG.affiliate||{})[l.store],u0=l.url||'#';
  if(!a)return u0;
  try{
    if(a.template){                      // network deep link, e.g. https://linksredirect.com/?cid=123&source=linkkit&url={urlenc}&subid={sub}
      return a.template.replace('{urlenc}',encodeURIComponent(u0)).replace('{url}',u0).replace('{sub}',encodeURIComponent(subId(l)));
    }
    if(a.param&&a.value){                // tag appended to the store's own link, e.g. Amazon ?tag=yourtag-21
      const x=new URL(u0);x.searchParams.set(a.param,a.value);
      Object.entries(a.extra||{}).forEach(([k,v])=>x.searchParams.set(k,v));
      if(a.subParam)x.searchParams.set(a.subParam,subId(l));
      return x.toString();
    }
  }catch(e){}
  return u0;
}

function fresh(l){const t=l.checked||CFG.listingsChecked;if(!t)return{txt:'',cls:''};const h=(Date.now()-new Date(t))/36e5,s=CFG.staleHours||24,x=CFG.expiredHours||72;
  return{h,cls:h>x?'bad':h>s?'warn':'ok',txt:tr('Price checked {a}',{a:ago(t)})+(h>x?tr(' · likely outdated, check the store'):h>s?tr(' · may be outdated'):'')}}
const SITE=()=>location.origin+location.pathname.replace(/index\.html$/,'');
function shareUrl(l){return 'https://wa.me/?text='+encodeURIComponent(`${l.brand} ${l.weight} g ${l.karat}K gold at ${l.store}: ${inr(l.final)} (${inr(l.perg)} per gram of pure gold). Compare all stores: ${SITE()}?k=${l.karat}&w=${l.weight}`)}
function reportUrl(l){const ct=CFG.contact||{};const msg=`Wrong price on GoldRadar. Store: ${l.store}. Product: ${l.brand} ${l.weight} g ${l.karat}K. Shown: ${inr(l.price)}. Page: ${SITE()}`;
  if(ct.whatsapp)return 'https://wa.me/'+String(ct.whatsapp).replace(/\D/g,'')+'?text='+encodeURIComponent(msg);
  if(ct.email)return 'mailto:'+ct.email+'?subject='+encodeURIComponent('Wrong price report')+'&body='+encodeURIComponent(msg);return ''}
function acts(l){const r=reportUrl(l);return `<div class="acts"><a href="${shareUrl(l)}" target="_blank" rel="noopener">${tr('Share on WhatsApp')}</a>${r?`<a href="${r}" target="_blank" rel="noopener">${tr('Report wrong price')}</a>`:''}</div>`}
function rows(f){return LIST.filter(f).map(calc)}
function sorter(){return st.sort==='perg'?(a,b)=>a.perg-b.perg:st.sort==='save'?(a,b)=>b.save-a.save||a.final-b.final:(a,b)=>a.final-b.final}
function setup(){
  $('#karatSeg').innerHTML=KARATS.map(k=>`<button data-k="${k}">${k}K</button>`).join('');
  $('#weightChips').innerHTML=WEIGHTS.map(w=>`<button data-w="${w}">${w} g</button>`).join('');
  $('#storeChips').innerHTML=['All',...CFG.stores].map(s=>`<button data-s="${s}">${s}</button>`).join('');
  $('#karatSeg').onclick=e=>{const k=e.target.dataset.k;if(k){st.karat=+k;render();GRTrack.select(st.weight,st.karat)}};
  $('#weightChips').onclick=e=>{const w=e.target.dataset.w;if(w){st.weight=+w;render();GRTrack.select(st.weight,st.karat)}};
  $('#storeChips').onclick=e=>{const s=e.target.dataset.s;if(s){st.store=s;render()}};
  $('#optCoupon').onchange=e=>{st.coupon=e.target.checked;render()};
  $('#optBank').onchange=e=>{st.bank=e.target.checked;render()};
  $('#sortSel').onchange=e=>{st.sort=e.target.value;render()};
  $('#histSeg').onclick=e=>{const m=e.target.dataset.m;if(m){st.hist=m;hist()}};
  $('#rangeSeg').onclick=e=>{const r=e.target.dataset.r;if(r){st.range=r;hist()}};
  $('#citySel').innerHTML=CITIES.map(c=>`<option>${c.name}</option>`).join('');
  $('#citySel').onchange=e=>setCity(e.target.value);
  $('#cityTable').onclick=e=>{const r=e.target.closest('tr[data-city]');if(r)setCity(r.dataset.city)};
  document.addEventListener('click',e=>{const b=e.target.closest('[data-cmp]');if(!b)return;const id=+b.dataset.cmp,i=st.cmp.indexOf(id);if(i>=0)st.cmp.splice(i,1);else{st.cmp.push(id);if(st.cmp.length>2)st.cmp.shift()}render()});
  $('#cmpPanel').onclick=e=>{if(e.target.closest('[data-cmpclear]')){st.cmp=[];render()}};
  $('#cheapRow').onclick=e=>{const c=e.target.closest('[data-w]');if(c){st.weight=+c.dataset.w;render();GRTrack.select(st.weight,st.karat);$('#grid').scrollIntoView({behavior:'smooth',block:'start'})}};
  document.addEventListener('click',e=>{const a=e.target.closest('a[data-store]');if(a)GRTrack.click(a.dataset.store,st.weight,st.karat)});
  $('#affNote').hidden=!Object.values(CFG.affiliate||{}).some(a=>a.template||a.value);
}
function ago(iso){const m=Math.max(0,(Date.now()-new Date(iso))/6e4);return m<60?tr('{n} min ago',{n:Math.round(m)}):m<1440?tr('{n} h ago',{n:Math.round(m/60)}):tr('{n} d ago',{n:Math.round(m/1440)})}
function render(){
  const g=RATES.gold24;
  const cad=CITIES.find(c=>c.name===st.city)||{},gd=g+(cad.adjust24||0),sd=RATES.silver_kg+(cad.adjustSilverKg||0);
  $('#citySel').value=st.city;$('#cityNote').textContent=st.city?tr("Estimated from the national rate plus a local adjustment. Your jeweller's rate may differ."):'';
  $('#liveRate').innerHTML=tr("Today's 24K {p} / g",{p:'<b>'+inr(gd)+'</b>'});
  $('#liveAge').textContent=' · '+tr('updated {a}',{a:ago(RATES.updated)});
  $('#rates').innerHTML=KARATS.map(k=>`<div class="rate"><div class="k">${tr('GOLD {k}K',{k})}</div><div class="v">${inr(gd*k/24)}</div><div class="u">${tr('per gram')}</div></div>`).join('')+
    `<div class="rate"><div class="k">${tr('SILVER')}</div><div class="v">${inr(sd)}</div><div class="u">${tr('per 1 kg · {g} / g',{g:inr(sd/1000)})}</div></div>`;
  $('#offerStatus').innerHTML=Object.entries(OFFERS).map(([c,o])=>`<span class="pill ${o.live?'':'red'}">${tr(o.live?'{c} on {s}: LIVE, applied to prices':'{c} on {s}: not live',{c,s:o.store})}</span> <span class="mut" style="font-size:12px">${tr('checked {a}',{a:ago(o.checked)})}</span>`).join(' ');
  document.querySelectorAll('#karatSeg button').forEach(b=>b.classList.toggle('on',+b.dataset.k===st.karat));
  document.querySelectorAll('#weightChips button').forEach(b=>b.classList.toggle('on',+b.dataset.w===st.weight));
  document.querySelectorAll('#storeChips button').forEach(b=>b.classList.toggle('on',b.dataset.s===st.store));
  const kf=l=>l.karat===st.karat;
  // hero
  const here=rows(l=>kf(l)&&l.weight===st.weight&&(st.store==='All'||l.store===st.store)).sort((a,b)=>a.final-b.final);
  const h=here[0];
  $('#best').innerHTML=h?`<div class="hero"><div><div class="tag">${tr('BEST PRICE · {w} g {k}K',{w:st.weight,k:st.karat})}${st.store!=='All'?' · '+st.store:''}</div>
    <div class="store">${h.store}</div><div class="price">${inr(h.final)}</div>
    <div class="chk ${fresh(h).cls}">${fresh(h).txt}</div>${vbadge(h)}
    <div class="sub">${inr(h.perg)} ${tr('per gram of pure gold')} · ${h.brand}${h.save>0?` · ${tr('listed {p}',{p:inr(h.price)})}`:''}</div>
    <a class="btn" data-store="${h.store}" href="${link(h)}" target="_blank" rel="noopener sponsored">${tr('Buy on {s}',{s:h.store})}</a>${affOn(h)?`<div class="aff">${tr('Affiliate link')}</div>`:''}${acts(h)}${breakdown(h)}</div>
    <div class="meta">${h.save>0?`<span class="pill">${tr('You save {p} with offers',{p:inr(h.save)})}</span>`:''}
    ${h.c?`<span class="pill gold">${tr('Coupon {c}: −{p}',{c:h.coupon.code,p:inr(h.c)})}</span>`:''}${h.b?`<span class="pill gold">${h.bank.label}: −${inr(h.b)}</span>`:''}
    <span class="pill ${h.vs>0?'red':''}">${tr('{v}% vs gold value {m}',{v:(h.vs>=0?'+':'')+h.vs.toFixed(1),m:inr(h.market)})}</span>
    ${here[1]?`<span class="mut">${tr('{p} cheaper than {s}',{p:inr(here[1].final-h.final),s:here[1].store})}</span>`:''}</div></div>`
    :`<div class="empty" style="margin-top:20px">${st.store!=='All'?tr('No {w} g {k}K listing on {s}. Try another weight or store.',{w:st.weight,k:st.karat,s:st.store}):tr('No {w} g {k}K listing. Try another weight or store.',{w:st.weight,k:st.karat})}</div>`;
  // cheapest per weight
  $('#cheapSub').textContent=tr('{k}K, lowest final price across all stores',{k:st.karat});
  $('#cheapRow').innerHTML=WEIGHTS.map(w=>{const r=rows(l=>kf(l)&&l.weight===w).sort((a,b)=>a.final-b.final)[0];
    return r?`<button class="cc ${w===st.weight?'on':''}" data-w="${w}"><div class="w">${tr('{w} g',{w}).toUpperCase()}</div><div class="p">${inr(r.final)}</div><div class="s">${r.store}</div><div class="mut" style="font-size:12px">${tr('{p} / g pure',{p:inr(r.perg)})}</div></button>`
    :`<button class="cc ${w===st.weight?'on':''}" data-w="${w}"><div class="w">${tr('{w} g',{w}).toUpperCase()}</div><div class="p mut">–</div><div class="s mut">${tr('no listing')}</div></button>`}).join('');
  // listings
  $('#listHead').textContent=tr('{w} g {k}K deals',{w:st.weight,k:st.karat});
  const sorted=here.slice().sort(sorter());
  $('#listCount').textContent=sorted.length?tr(sorted.length>1?'{n} listings':'{n} listing',{n:sorted.length})+(st.coupon||st.bank?tr(' · final price after selected offers'):''):'';
  $('#grid').innerHTML=sorted.length?sorted.map(l=>`<div class="card ${l.id===h.id?'best':''}">${l.id===h.id?`<span class="pill gold badge">${tr('Best price')}</span>`:''}
    <div class="st">${l.store}</div><div class="br">${l.brand} · ${l.title}</div>${vbadge(l)}
    <div><span class="fin">${inr(l.final)}</span>${l.save>0?`<s>${inr(l.price)}</s>`:''}</div>
    ${l.c?`<div class="off">${tr('Coupon {c}: −{p}',{c:l.coupon.code,p:inr(l.c)})}</div>`:l.coupon&&!couponLive(l.coupon)?`<div class="mut" style="font-size:13px">${tr('Coupon {c} is not live right now',{c:l.coupon.code})}</div>`:l.coupon&&!st.coupon?`<div class="mut" style="font-size:13px">${tr('Coupon {c} available',{c:l.coupon.code})}</div>`:''}
    ${l.b?`<div class="off">${l.bank.label}: −${inr(l.b)}</div>`:l.bank&&!st.bank?`<div class="mut" style="font-size:13px">${tr('{l} available',{l:l.bank.label})}</div>`:''}
    <div class="row"><span>${tr('{p} / g pure',{p:inr(l.perg)})}</span><span>${tr('{v}% vs gold value',{v:(l.vs>=0?'+':'')+l.vs.toFixed(1)})}</span></div>
    <div class="chk ${fresh(l).cls}">${fresh(l).txt}</div>
    <a class="buy" data-store="${l.store}" href="${link(l)}" target="_blank" rel="noopener sponsored">${tr('Buy on {s}',{s:l.store})}</a>${affOn(l)?`<div class="aff">${tr('Affiliate link')}</div>`:''}${acts(l)}${breakdown(l)}<button class="cmpbtn ${st.cmp.includes(l.id)?'on':''}" data-cmp="${l.id}" type="button">${tr(st.cmp.includes(l.id)?'Added to compare':'Compare')}</button></div>`).join(''):`<div class="empty">${tr('Nothing to show.')}</div>`;
  // comparison
  const S=CFG.stores;
  $('#cmp').innerHTML=`<tr><th>${tr('WEIGHT')}</th>${S.map(s=>`<th>${s.toUpperCase()}</th>`).join('')}<th>${tr('GOLD VALUE')}</th></tr>`+
   WEIGHTS.map(w=>{const best={};S.forEach(s=>{best[s]=rows(l=>kf(l)&&l.weight===w&&l.store===s).sort((a,b)=>a.final-b.final)[0]});
    const min=Math.min(...S.map(s=>best[s]?best[s].final:Infinity));
    return `<tr><td>${tr('{w} g',{w})}</td>${S.map(s=>best[s]?`<td class="${best[s].final===min?'best':''}">${inr(best[s].final)}</td>`:'<td class="na">–</td>').join('')}<td>${inr(g*w*st.karat/24)}</td></tr>`}).join('');
  // market value table
  $('#mv').innerHTML=`<tr><th>${tr('WEIGHT')}</th>${KARATS.map(k=>`<th>${k}K</th>`).join('')}</tr>`+
   WEIGHTS.map(w=>{return `<tr><td>${tr('{w} g',{w})}</td>${KARATS.map(k=>`<td>${inr(g*w*k/24)}</td>`).join('')}</tr>`}).join('');
  cityTable(g);festival();cmpPanel();
  signal();
  hist();
}
function hist(){
  document.querySelectorAll('#histSeg button').forEach(b=>b.classList.toggle('on',b.dataset.m===st.hist));
  document.querySelectorAll('#rangeSeg button').forEach(b=>b.classList.toggle('on',b.dataset.r===st.range));
  const n=st.range==='all'?HIST.length:+st.range,H0=HIST.slice(-n);
  if(H0.length<2){$('#hist').innerHTML=`<div class="empty">${tr('Not enough days yet.')}</div>`;$('#histNote').textContent='';return}
  $('#histSub').textContent=tr('last {n} days',{n:H0.length});
  const idx=k=>H0.map(h=>h[k]/H0[0][k]*100);
  const series=st.hist==='cmp'?[{v:idx('g24'),c:'#e4b85b',n:tr('Gold')},{v:idx('s'),c:'#cbd5e1',n:tr('Silver')}]:[{v:H0.map(h=>h[st.hist]),c:'#e4b85b'}];
  const all=series.flatMap(s=>s.v),mn=Math.min(...all),mx=Math.max(...all),W=900,Hh=260,P=56,pad=(mx-mn)*.1||1;
  const fmt=st.hist==='cmp'?v=>v.toFixed(0):inr;
  const x=i=>P+i*(W-P-12)/(H0.length-1),y=v=>Hh-26-(v-(mn-pad))/(mx-mn+2*pad)*(Hh-46);
  const line=s=>s.v.map((v,i)=>`${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const first=H0[0].d,last=H0[H0.length-1].d,one=series.length===1;
  $('#hist').innerHTML=`<svg viewBox="0 0 ${W} ${Hh}" role="img" aria-label="${tr('Rate history')}">
   ${[0,.5,1].map(t=>{const v=mn+(mx-mn)*t;return `<line x1="${P}" x2="${W-12}" y1="${y(v)}" y2="${y(v)}" stroke="#242a38"/><text x="${P-6}" y="${y(v)+4}" fill="#8f97a8" font-size="12" text-anchor="end">${fmt(v)}</text>`}).join('')}
   ${one?`<polygon points="${x(0)},${Hh-26} ${line(series[0])} ${x(H0.length-1)},${Hh-26}" fill="rgba(228,184,91,.12)"/>`:''}
   ${series.map(s=>`<polyline points="${line(s)}" fill="none" stroke="${s.c}" stroke-width="2.5" stroke-linejoin="round"/><circle cx="${x(H0.length-1)}" cy="${y(s.v[s.v.length-1])}" r="4.5" fill="${s.c}"/>`).join('')}
   ${one?'':series.map((s,i)=>`<circle cx="${P+8+i*90}" cy="14" r="5" fill="${s.c}"/><text x="${P+18+i*90}" y="18" fill="#d9d5c8" font-size="12">${s.n}</text>`).join('')}
   <text x="${P}" y="${Hh-6}" fill="#8f97a8" font-size="12">${first}</text><text x="${W-12}" y="${Hh-6}" fill="#8f97a8" font-size="12" text-anchor="end">${last}</text></svg>`;
  $('#histNote').textContent=(st.hist==='cmp'?tr('Both start at 100 so you can compare how each moved.')+' ':'')+(H0.some(h=>!h.r)?tr('Earlier days are sample values. Real history builds up every day.'):'');
}
function breakdown(l){
  const prem=l.final-l.market,row=(a,b,c)=>`<div class="r${c?' '+c:''}"><span>${a}</span><span>${b}</span></div>`;
  return `<details class="bd"><summary>${tr('What you pay')}</summary>
    ${row(tr('Listed price'),inr(l.price))}
    ${l.c?row(tr('Coupon {c}',{c:l.coupon.code}),'−'+inr(l.c),'off'):''}
    ${l.b?row(l.bank.label,'−'+inr(l.b),'off'):''}
    ${row(tr('Final price'),inr(l.final),'tot')}
    ${row(tr("Gold value at today's rate"),inr(l.market))}
    ${row(tr('Premium over gold value'),(prem>=0?'+':'−')+inr(Math.abs(prem))+' ('+(l.vs>=0?'+':'')+l.vs.toFixed(1)+'%)')}
    ${row(tr('Per gram of pure gold'),inr(l.perg))}
    <p>${tr('Listed prices normally include GST. Delivery or other charges, if any, appear at checkout on the store.')}</p></details>`;
}
function signal(){
  const el=$('#signal');if(!el)return;
  const real=(HIST||[]).filter(h=>h.r),n=real.length;
  if(RATES.mode==='sample'||n<7){el.innerHTML='';return}
  const v=real.slice(-30).map(h=>h.g24),avg=v.reduce((a,b)=>a+b,0)/v.length,today=RATES.gold24,d=(today-avg)/avg*100;
  const w7=v.length>=8?(today-v[v.length-8])/v[v.length-8]*100:null;
  const cls=d<=-1.5?'good':d>=1.5?'wait':'mid',head=d<=-1.5?'Good time to buy':d>=1.5?'Above average, consider waiting':'Near the average';
  el.innerHTML=`<div class="sig ${cls}"><b>${tr('Buy now or wait?')}</b> <span class="pill ${cls==='wait'?'red':cls==='mid'?'gold':''}">${tr(head)}</span>
    <div class="mut">${tr('24K today {p} is {d}% {dir} its {n}-day average of {a}. Last 7 days: {w}%.',{p:inr(today),d:Math.abs(d).toFixed(1),dir:tr(d<0?'below':'above'),n:v.length,a:inr(avg),w:w7===null?'–':(w7>=0?'+':'')+w7.toFixed(1)})}
    ${tr('Based on past prices only. Not investment advice.')}</div></div>`;
}


function bannerSet(){const rs=RATES.mode==='sample',ls=CFG.listingsAreSample!==false,b=$('#sampleBanner');
  if(rs||ls){b.hidden=false;b.textContent=tr(rs&&ls?'Sample data. Rates and store prices below are made up to show the layout.':ls?'Gold and silver rates are live. Store prices below are SAMPLES, not real listings yet.':'Gold and silver rates are samples.')}else b.hidden=true}

function setCity(c){st.city=c;try{localStorage.setItem('gr_city',c)}catch(e){}render()}
function cityTable(g){
  $('#cityTable').innerHTML=`<tr><th>${tr('CITY')}</th><th>24K</th><th>22K</th><th>18K</th><th>${tr('SILVER / KG')}</th></tr>`+
   CITIES.map(c=>{const a=g+(c.adjust24||0);return `<tr data-city="${c.name}" class="${c.name===st.city?'sel':''}"><td>${c.name}</td><td>${inr(a)}</td><td>${inr(a*22/24)}</td><td>${inr(a*18/24)}</td><td>${inr(RATES.silver_kg+(c.adjustSilverKg||0))}</td></tr>`}).join('');
  $('#citySection').hidden=!CITIES.length;
}
function vbadge(l){const k=Object.keys(VER).find(b=>b.toLowerCase()===String(l.brand).toLowerCase()),v=k&&VER[k];
  return v&&v.verified===true?`<div class="ver" title="${(v.note||'').replace(/"/g,'')}">✔ ${tr('Verified brand')}${v.checked?' · '+tr('Certificate confirmed {d}',{d:v.checked}):''}</div>`:''}
function festival(){
  const el=$('#festival'),deals=$('#festDeals');el.innerHTML='';deals.innerHTML='';
  const ist=new Date(Date.now()+5.5*36e5).toISOString().slice(0,10),day=s=>Date.parse(s+'T00:00:00Z');
  const up=(FEST.festivals||[]).map(f=>({...f,n:Math.round((day(f.date)-day(ist))/864e5)})).filter(f=>f.n>=0).sort((a,b)=>a.n-b.n)[0];
  if(!up)return;
  const nm=tr(up.name),txt=up.n===0?tr('{f} is today',{f:nm}):up.n===1?tr('{f} is tomorrow',{f:nm}):tr('{f} in {n} days',{f:nm,n:up.n});
  const win=FEST.dealsWindowDays||45,near=up.n<=win;
  el.innerHTML=`<div class="fest"><span class="fd">🎉</span><b>${txt}</b>${near?` <a href="#festDeals">${tr('Best deals for {f}',{f:nm})} →</a>`:''}</div>`;
  if(!near)return;
  const top=rows(l=>l.karat===24).sort((a,b)=>a.vs-b.vs).slice(0,3);
  if(!top.length)return;
  deals.innerHTML=`<h2>${tr('Best deals for {f}',{f:nm})} <small>${tr('Lowest premium over gold value, 24K')}</small></h2><div class="grid">`+top.map(l=>`<div class="card"><div class="st">${l.store}</div><div class="br">${l.brand} · ${l.title}</div>${vbadge(l)}
    <div><span class="fin">${inr(l.final)}</span></div><div class="row"><span>${tr('{p} / g pure',{p:inr(l.perg)})}</span><span>${tr('{v}% vs gold value',{v:(l.vs>=0?'+':'')+l.vs.toFixed(1)})}</span></div>
    <a class="buy" data-store="${l.store}" href="${link(l)}" target="_blank" rel="noopener sponsored">${tr('Buy on {s}',{s:l.store})}</a></div>`).join('')+'</div>';
}
function cmpPanel(){
  const el=$('#cmpPanel'),ls=st.cmp.map(id=>LIST.find(x=>x.id===id)).filter(Boolean).map(calc);
  if(!ls.length){el.hidden=true;el.innerHTML='';return}
  el.hidden=false;
  if(ls.length<2){el.innerHTML=`<div class="cmpbar"><b>${tr('Compare')}</b> <span class="mut">${tr('Pick one more listing to compare.')}</span> <button data-cmpclear type="button">${tr('Clear')}</button></div>`;return}
  const [a,b]=ls,best=Math.min(a.final,b.final);
  const row=(lab,f,hl)=>`<tr><th>${lab}</th>${[a,b].map(l=>`<td class="${hl&&hl(l)?'best':''}">${f(l)}</td>`).join('')}</tr>`;
  el.innerHTML=`<div class="cmpbox"><div class="cmphead"><b>${tr('Compare listings')}</b><button data-cmpclear type="button">${tr('Clear')}</button></div><div class="tablewrap"><table>
   ${row(tr('STORE'),l=>l.store)}${row(tr('Brand'),l=>l.brand+(vbadge(l)?' ✔':''))}${row(tr('WEIGHT'),l=>tr('{w} g',{w:l.weight})+' · '+l.karat+'K')}
   ${row(tr('Listed price'),l=>inr(l.price))}${row(tr('Coupon'),l=>l.c?'−'+inr(l.c):'–')}${row(tr('Bank offer'),l=>l.b?'−'+inr(l.b):'–')}
   ${row(tr('Final price'),l=>inr(l.final),l=>l.final===best)}${row(tr('Per gram of pure gold'),l=>inr(l.perg),l=>l.perg===Math.min(a.perg,b.perg))}
   ${row(tr('Premium over gold value'),l=>(l.vs>=0?'+':'')+l.vs.toFixed(1)+'%',l=>l.vs===Math.min(a.vs,b.vs))}
   ${row(tr('Price checked {a}',{a:''}).trim(),l=>l.checked?ago(l.checked):'–')}
   <tr><th></th>${[a,b].map(l=>`<td><a class="buy" data-store="${l.store}" href="${link(l)}" target="_blank" rel="noopener sponsored">${tr('Buy on {s}',{s:l.store})}</a></td>`).join('')}</tr></table></div>
   <div class="mut" style="font-size:13px;margin-top:6px">${a.perg===b.perg?tr('Same price per gram'):tr('{s} is cheaper per gram by {p}',{s:(a.perg<b.perg?a:b).store+' '+(a.perg<b.perg?a:b).weight+' g '+(a.perg<b.perg?a:b).karat+'K',p:inr(Math.abs(a.perg-b.perg))})}</div></div>`;
}
window.onLangChange=()=>{bannerSet();setup2();render()};
function setup2(){$('#citySel').innerHTML=CITIES.map(c=>`<option>${c.name}</option>`).join('')}
load().catch(e=>{document.body.insertAdjacentHTML('afterbegin',`<div class="banner" style="margin:16px">Could not load data: ${e.message}. Serve the folder over HTTP (see README).</div>`)});
