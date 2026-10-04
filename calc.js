(function(){
  const $=s=>document.querySelector(s),tr=(k,v)=>I18N.t(k,v),inr=n=>'₹'+Math.round(n).toLocaleString('en-IN');
  const num=id=>{const v=parseFloat($(id).value);return isFinite(v)?v:0};
  const gm=n=>(Math.round(n*100)/100).toLocaleString('en-IN')+' '+tr('{w} g',{w:''}).trim();
  const box=(a,b)=>`<div><small>${a}</small><b>${b}</b></div>`;
  let G=0,S=0;
  function run(){
    if(!G)return;
    const g=G,s=S/1000;
    $('#used').textContent=tr('Rates used: 24K gold {g} / g, silver {s} / kg.',{g:inr(g),s:inr(S)});
    const a1=num('#a1');
    $('#r1').innerHTML=[24,22,18,14].map(k=>box(k+'K',gm(a1/(g*k/24)))).join('')+box(tr('Silver'),gm(a1/s));
    $('#ratio').textContent=tr('Gold-to-silver price ratio: {r}. Enter an amount and a possible price change for each metal.',{r:(g/s).toFixed(1)});
    const a2=num('#a2'),gc=num('#g2'),sc=num('#s2'),gg=a2/g,ss=a2/s;
    $('#r2').innerHTML=box(tr('24K gold you get'),gm(gg))+box(tr('Silver you get'),gm(ss))+box(tr('Gold')+' · '+tr('Value after change'),inr(a2*(1+gc/100)))+box(tr('Silver')+' · '+tr('Value after change'),inr(a2*(1+sc/100)));
    const a3=num('#a3'),m3=Math.min(120,Math.max(1,Math.round(num('#m3')))),r=num('#p3')/100;let grams=0;
    for(let i=0;i<m3;i++)grams+=a3/(g*Math.pow(1+r,i/12));
    const endP=g*Math.pow(1+r,(m3-1)/12);
    $('#r3').innerHTML=box(tr('Total invested'),inr(a3*m3))+box(tr('24K gold collected'),gm(grams))+box(tr('Estimated value at the end'),inr(grams*endP));
    const P=num('#a4'),n=Math.min(120,Math.max(1,Math.round(num('#m4')))),i=num('#i4')/1200;
    const emi=i===0?P/n:P*i*Math.pow(1+i,n)/(Math.pow(1+i,n)-1);
    $('#r4').innerHTML=box(tr('Monthly EMI'),inr(emi))+box(tr('Total interest'),inr(emi*n-P))+box(tr('Total payable'),inr(emi*n));
  }
  window.onLangChange=run;
  document.querySelectorAll('input').forEach(e=>e.addEventListener('input',run));
  fetch('data/rates.json',{cache:'no-cache'}).then(r=>r.json()).then(r=>{G=r.gold24;S=r.silver_kg;run()}).catch(()=>{$('#used').textContent='Could not load rates.'});
})();
