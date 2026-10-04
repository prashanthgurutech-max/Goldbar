(async function () {
  const $ = s => document.querySelector(s), tr = (k, v) => I18N.t(k, v);
  try { await GR.load(); } catch (e) { $('#picks').innerHTML = '<div class="empty">Could not load data.</div>'; return; }
  const inr = GR.inr, TIPS = { wedding: 'Larger coins (5 g and up) are common for weddings. Keep the invoice and certificate with the gift.', diwali: 'Many families buy a coin around Dhanteras. Check the festival deals on the main page.', birthday: 'Small coins (1 to 2 g) suit most budgets.', baby: 'A 1 to 2 g coin in a sealed pack is a lasting gift.', anniv: 'A 24K coin or small bar is a simple, lasting gift.', self: 'Bars cost less per gram than small coins. Compare the premium.' };
  const st = { budget: 35000, occ: 'wedding' };
  $('#bchips').innerHTML = [20000, 35000, 50000, 100000, 200000].map(b => `<button data-b="${b}" type="button">${inr(b)}</button>`).join('');
  $('#bchips').onclick = e => { const b = e.target.dataset.b; if (b) { $('#budget').value = b; run(); } };
  $('#budget').oninput = run; $('#occ').onchange = run;
  function card(l, tags) {
    const v = GR.verified(l);
    return `<div class="card"><div>${tags.map(t => `<span class="pill gold" style="margin-right:4px">${tr(t)}</span>`).join('')}</div>
      <div class="st">${l.store}</div><div class="br">${l.brand} · ${l.title}</div>${v ? `<div class="ver">✔ ${tr('Verified brand')}</div>` : ''}
      <div><span class="fin">${inr(l.final)}</span>${l.save > 0 ? `<s>${inr(l.price)}</s>` : ''}</div>
      <div class="row"><span>${tr('{p} / g pure', { p: inr(l.perg) })}</span><span>${tr('{v}% vs gold value', { v: (l.vs >= 0 ? '+' : '') + l.vs.toFixed(1) })}</span></div>
      <div class="mut" style="font-size:13px">${tr('You get {g} g of pure gold', { g: l.pure.toFixed(2) })}</div>
      <a class="buy" data-store="${l.store}" href="${GR.link(l)}" target="_blank" rel="noopener sponsored">${tr('Buy on {s}', { s: l.store })}</a></div>`;
  }
  function run() {
    st.budget = +$('#budget').value || 0; st.occ = $('#occ').value;
    $('#tip').textContent = tr(TIPS[st.occ]);
    document.querySelectorAll('#bchips button').forEach(b => b.classList.toggle('on', +b.dataset.b === st.budget));
    const ok = GR.D.list.filter(l => l.karat === 24).map(GR.calc).filter(l => l.final <= st.budget);
    if (!ok.length) { $('#picks').innerHTML = `<div class="empty">${tr('No listing fits this budget. Try a higher budget.')}</div>`; return; }
    const picks = [], add = (l, t) => { if (!l) return; const p = picks.find(x => x.l.id === l.id); if (p) p.t.push(t); else picks.push({ l, t: [t] }); };
    add(ok.slice().sort((a, b) => b.pure - a.pure || a.final - b.final)[0], 'Most gold for your budget');
    add(ok.slice().sort((a, b) => a.vs - b.vs)[0], 'Lowest premium over gold value');
    add(ok.filter(l => GR.verified(l)).sort((a, b) => a.vs - b.vs)[0], 'From a verified brand');
    $('#picks').innerHTML = picks.map(p => card(p.l, p.t)).join('');
  }
  window.onLangChange = run; run();
})();
