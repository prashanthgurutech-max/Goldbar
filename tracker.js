(async function () {
  const $ = s => document.querySelector(s), tr = (k, v) => I18N.t(k, v), KEY = 'gr_hold';
  try { await GR.load(); } catch (e) { $('#sum').textContent = 'Could not load rates.'; return; }
  const inr = GR.inr;
  let H = []; try { H = JSON.parse(localStorage.getItem(KEY) || '[]'); if (!Array.isArray(H)) H = []; } catch (e) { H = []; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(H)); } catch (e) { $('#err').textContent = 'Could not save on this browser (private mode?).'; } };
  $('#d').value = new Date(Date.now() + 5.5 * 36e5).toISOString().slice(0, 10);
  $('#citySel').innerHTML = GR.D.cities.map(c => `<option>${c.name}</option>`).join('');
  $('#citySel').value = GR.city; $('#citySel').onchange = e => { GR.setCity(e.target.value); render(); };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  $('#add').onclick = () => {
    const w = parseFloat($('#w').value), p = parseFloat($('#p').value), k = +$('#k').value, d = $('#d').value;
    if (!(w > 0) || !(p > 0) || !d) { $('#err').textContent = tr('Enter the date, weight and price paid.'); return; }
    $('#err').textContent = ''; H.push({ id: Date.now(), d, w, k, p, n: $('#n').value.trim().slice(0, 60) }); save();
    $('#w').value = ''; $('#p').value = ''; $('#n').value = ''; render();
  };
  $('#tbl').onclick = e => { const b = e.target.closest('[data-del]'); if (b && confirm(tr('Delete this purchase?'))) { H = H.filter(x => x.id !== +b.dataset.del); save(); render(); } };
  $('#dl').onclick = e => { e.preventDefault(); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(H, null, 1)], { type: 'application/json' })); a.download = 'goldradar-holdings.json'; a.click(); };
  $('#up').onchange = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { try { const a = JSON.parse(r.result); if (!Array.isArray(a) || !a.every(x => x && x.w > 0 && x.p > 0 && x.k && x.d)) throw 0; H = a.map(x => ({ id: x.id || Date.now() + Math.random(), d: String(x.d), w: +x.w, k: +x.k, p: +x.p, n: String(x.n || '').slice(0, 60) })); save(); render(); } catch (err) { $('#err').textContent = tr('That file is not a valid backup.'); } }; r.readAsText(f); e.target.value = ''; };
  function render() {
    const g = GR.rates().gold24, box = (a, b, c) => `<div><small>${a}</small><b${c ? ` style="color:${c}"` : ''}>${b}</b></div>`;
    const pure = H.reduce((a, x) => a + x.w * x.k / 24, 0), inv = H.reduce((a, x) => a + x.p, 0), val = pure * g, pl = val - inv;
    $('#sum').innerHTML = H.length ? box(tr('Total pure gold (24K)'), pure.toFixed(2) + ' g') + box(tr('Total invested'), inr(inv)) + box(tr('Value today'), inr(val)) +
      box(tr('Profit / loss'), (pl >= 0 ? '+' : '−') + inr(Math.abs(pl)) + ' (' + (inv ? (pl / inv * 100).toFixed(1) : '0') + '%)', pl >= 0 ? 'var(--green)' : 'var(--red)') : '';
    $('#tbl').innerHTML = H.length ? `<tr><th>${tr('Date')}</th><th>${tr('Weight (g)')}</th><th>${tr('Price paid (₹)')}</th><th>${tr('Value today')}</th><th>${tr('Profit / loss')}</th><th></th></tr>` +
      H.slice().sort((a, b) => b.d.localeCompare(a.d)).map(x => { const v = x.w * x.k / 24 * g, d = v - x.p; return `<tr><td>${esc(x.d)}${x.n ? '<br><small class="mut">' + esc(x.n) + '</small>' : ''}</td><td>${x.w} g · ${x.k}K</td><td>${inr(x.p)}</td><td>${inr(v)}</td><td style="color:${d >= 0 ? 'var(--green)' : 'var(--red)'}">${d >= 0 ? '+' : '−'}${inr(Math.abs(d))}</td><td><button data-del="${x.id}" type="button" class="x" aria-label="Delete">✕</button></td></tr>`; }).join('')
      : `<tr><td class="mut" style="text-align:center">${tr('No purchases added yet.')}</td></tr>`;
  }
  window.onLangChange = render; render();
})();
