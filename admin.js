const $=s=>document.querySelector(s);let sb,D,per='daily';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
async function boot(){
  const cfg=(await (await fetch('data/config.json',{cache:'no-cache'})).json()).supabase||{};
  if(!cfg.url||!cfg.anonKey){$('#app').innerHTML='<div class="login"><b>Supabase is not set up yet.</b><span class="mut">Fill "supabase" in data/config.json (see README).</span></div>';return}
  sb=supabase.createClient(cfg.url,cfg.anonKey);
  $('#out').onclick=async()=>{await sb.auth.signOut();location.reload()};
  const {data}=await sb.auth.getSession(); data.session?load():login();
}
function login(msg){
  $('#out').hidden=true;
  $('#app').innerHTML=`<form class="login" id="f"><b>Admin sign in</b><input id="em" type="email" placeholder="Email" autocomplete="username" required><input id="pw" type="password" placeholder="Password" autocomplete="current-password" required><button class="btn" style="margin:0">Sign in</button><div class="err">${esc(msg||'')}</div></form>`;
  $('#f').onsubmit=async e=>{e.preventDefault();const {error}=await sb.auth.signInWithPassword({email:$('#em').value,password:$('#pw').value});error?login(error.message):load()};
}
async function load(){
  const {data,error}=await sb.rpc('gr_admin_stats');
  if(error){await sb.auth.signOut();return login(/not allowed/.test(error.message)?'This account is not an admin.':error.message)}
  D=data;$('#out').hidden=false;draw();
}
function bars(rows,label){
  const mx=Math.max(1,...rows.map(r=>r.n));return rows.length?rows.map(r=>`<div class="rowb"><span>${esc(r.k)}</span><i style="width:${Math.max(3,r.n/mx*100)}%"></i><span>${r.n}</span></div>`).join(''):'<span class="mut">No data yet</span>'
}
function draw(){
  const T=D.totals,k=(t,l)=>`<div class="kpi"><div class="k">${l}</div><div class="v">${T[t].visits}</div><div class="u">${T[t].uniques} unique visitors</div></div>`;
  const rows=D[per],mx=Math.max(1,...rows.map(r=>r.visits));
  const sum=rows.reduce((a,r)=>a+r.visits,0);
  $('#app').innerHTML=`<h2>Traffic <small>times in IST · visits count every page open, unique visitors count each browser once per period</small></h2>
  <div class="kpis">${k('today','TODAY')}${k('week','LAST 7 DAYS')}${k('month','LAST 30 DAYS')}${k('all','ALL TIME')}</div>
  <h2>Visits <small>${sum} in this view</small></h2>
  <div class="seg" id="per">${[['daily','Daily, 30 days'],['weekly','Weekly, 12 weeks'],['monthly','Monthly, 12 months']].map(([m,l])=>`<button data-p="${m}" class="${m===per?'on':''}">${l}</button>`).join('')}</div>
  <div class="bars">${rows.map(r=>`<div class="${r.visits?'':'z'}" style="height:${r.visits/mx*100}%" title="${r.k}: ${r.visits} visits, ${r.uniques} unique"></div>`).join('')}</div>
  <div class="tablewrap" style="margin-top:12px"><table><tr><th>${per==='daily'?'DAY':per==='weekly'?'WEEK STARTING':'MONTH'}</th><th>VISITS</th><th>UNIQUE VISITORS</th></tr>${rows.slice().reverse().map(r=>`<tr><td>${r.k}</td><td>${r.visits}</td><td>${r.uniques}</td></tr>`).join('')}</table></div>
  <h2>Last 30 days</h2><div class="two">
   <div class="panel"><h3>BUY CLICKS BY STORE</h3>${bars(D.clicks)}</div>
   <div class="panel"><h3>POPULAR WEIGHTS (g)</h3>${bars(D.weights)}</div>
   <div class="panel"><h3>POPULAR KARATS</h3>${bars(D.karats)}</div>
   <div class="panel"><h3>DEVICES</h3>${bars(D.devices)}</div>
   <div class="panel"><h3>WHERE VISITORS CAME FROM</h3>${bars(D.referrers)}</div></div>
  <p class="mut" style="margin:20px 0 40px;font-size:13px">To exclude your own visits, open the main site once on each of your devices with <b>?notrack=1</b> added to the address.</p>`;
  $('#per').onclick=e=>{const p=e.target.dataset.p;if(p){per=p;draw()}};
}
boot();
