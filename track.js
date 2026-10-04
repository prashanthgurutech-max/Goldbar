// Anonymous visit counter. Sends to your Supabase via the gr_track function. No names, emails or IPs are stored.
(function () {
  let cfg = null, vid = null, skip = false;
  const dev = () => { const w = innerWidth; return w < 700 ? 'mobile' : w < 1100 ? 'tablet' : 'desktop'; };
  const ref = () => {
    try {
      const u = new URLSearchParams(location.search).get('utm_source'); if (u) return u.slice(0, 40);
      if (!document.referrer) return null;
      const h = new URL(document.referrer).hostname.replace(/^www\./, ''); return h === location.hostname ? null : h;
    } catch (e) { return null; }
  };
  const send = (kind, o) => {
    if (!cfg || skip) return;
    fetch(cfg.url + '/rest/v1/rpc/gr_track', {
      method: 'POST', keepalive: true,
      headers: { apikey: cfg.anonKey, Authorization: 'Bearer ' + cfg.anonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_kind: kind, p_visitor: vid, p_store: o.store || null, p_weight: o.weight || null, p_karat: o.karat || null,
        p_device: o.device || null, p_ref: o.ref || null })
    }).catch(() => {});
  };
  let timer;
  window.GRTrack = {
    init(c) {
      try {
        if (new URLSearchParams(location.search).get('notrack') === '1') localStorage.setItem('gr_skip', '1');   // open the site once with ?notrack=1 to exclude your own devices
        skip = localStorage.getItem('gr_skip') === '1' || navigator.doNotTrack === '1';
        vid = localStorage.getItem('gr_vid') || (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now());
        localStorage.setItem('gr_vid', vid);
      } catch (e) { vid = String(Math.random()).slice(2) + Date.now(); }
      if (!c || !c.url || !c.anonKey) return;
      cfg = c; send('visit', { device: dev(), ref: ref() });
    },
    click(store, weight, karat) { send('click', { store, weight, karat }); },
    select(weight, karat) { clearTimeout(timer); timer = setTimeout(() => send('select', { weight, karat }), 900); }
  };
})();
