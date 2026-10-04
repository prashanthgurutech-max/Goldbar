// Languages: English, Telugu, Hindi, Tamil, Kannada. English text is the key.
// Translations live in translations.js as rows: [english, telugu, hindi, tamil, kannada]. Add a row to translate more text.
(function () {
  const LANGS = [['en', 'English'], ['te', 'తెలుగు'], ['hi', 'हिन्दी'], ['ta', 'தமிழ்'], ['kn', 'ಕನ್ನಡ']], IDX = { te: 1, hi: 2, ta: 3, kn: 4 }, T = { te: {}, hi: {}, ta: {}, kn: {} };
  (window.I18N_ROWS || []).forEach(r => { for (const l in IDX) if (r[IDX[l]]) T[l][r[0]] = r[IDX[l]]; });
  let lang = 'en';
  try { const q = new URLSearchParams(location.search).get('lang'); lang = LANGS.some(x => x[0] === q) ? q : (localStorage.getItem('gr_lang') || 'en'); } catch (e) {}
  if (!LANGS.some(x => x[0] === lang)) lang = 'en';
  function t(k, v) { let s = (lang !== 'en' && T[lang][k]) || k; if (v) for (const x in v) s = s.split('{' + x + '}').join(v[x]); return s; }
  function apply() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(e => {
      if (!e.dataset.en) e.dataset.en = e.innerHTML.trim();
      e.innerHTML = (lang !== 'en' && T[lang][e.dataset.en]) || e.dataset.en;
    });
    const s = document.getElementById('langSel'); if (s) s.value = lang;
  }
  function set(l) { lang = l; try { localStorage.setItem('gr_lang', l); } catch (e) {} apply(); if (window.onLangChange) window.onLangChange(); }
  window.I18N = { t, apply, set, get lang() { return lang; }, LANGS, T };
  const s = document.getElementById('langSel');
  if (s) { s.innerHTML = LANGS.map(x => `<option value="${x[0]}">${x[1]}</option>`).join(''); s.onchange = () => set(s.value); }
  apply();
})();
