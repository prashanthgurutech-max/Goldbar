/* GoldRadar premium layer: count-up numbers, staggered entrances, scroll reveal, header polish. */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var fmt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

  /* header shadow and scroll progress */
  var top = $('.top'), bar = document.createElement('div'); bar.id = 'pprog'; document.body.appendChild(bar);
  function onScroll() {
    var y = window.scrollY || 0, h = document.documentElement.scrollHeight - innerHeight;
    if (top) top.classList.toggle('scrolled', y > 8);
    bar.style.width = h > 0 ? Math.min(100, y / h * 100) + '%' : '0';
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* coin flip when a weight chip is picked */
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('#weightChips button')) {
      var d = $('.dot'); if (!d) return; d.classList.remove('flip'); void d.offsetWidth; d.classList.add('flip');
    }
  });

  if (reduce) return;

  /* count-up for rupee amounts */
  function countUp(el) {
    if (el.dataset.cu) return;
    var t = el.textContent.trim(), m = /^(₹)\s?([\d,]+)$/.exec(t);
    if (!m) return;
    var to = parseInt(m[2].replace(/,/g, ''), 10); if (!to || to < 50) return;
    el.dataset.cu = '1';
    var from = Math.round(to * 0.9), t0 = performance.now(), dur = 750;
    (function step(now) {
      var p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = '₹' + fmt.format(Math.round(from + (to - from) * e));
      if (p < 1) requestAnimationFrame(step); else el.textContent = t;
    })(t0);
  }
  var CU = '.rate .v,.hero .price,.card .fin,.cheap b,.cheap .v,#liveRate b';
  function stagger(root, sel) {
    var list = root.querySelectorAll(sel);
    for (var i = 0; i < list.length; i++) list[i].style.setProperty('--i', Math.min(i, 12));
  }
  var pending = false;
  function sweep() {
    pending = false;
    document.querySelectorAll(CU).forEach(countUp);
    ['#rates', '#grid', '#cheapRow', '#picks'].forEach(function (id) {
      var r = $(id); if (r) stagger(r, ':scope > *');
    });
  }
  var mo = new MutationObserver(function () { if (!pending) { pending = true; requestAnimationFrame(sweep); } });
  mo.observe(document.body, { childList: true, subtree: true });
  sweep();

  /* scroll reveal for sections and panels */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    document.querySelectorAll('main > section, main .calc, main > h2').forEach(function (s, i) {
      if (s.getBoundingClientRect().top < innerHeight * 0.9) return; /* already in view */
      s.classList.add('js-rv'); io.observe(s);
    });
    setTimeout(function () { document.querySelectorAll('.js-rv:not(.in)').forEach(function (s) { if (s.getBoundingClientRect().top < innerHeight * 1.5) s.classList.add('in'); }); }, 2500);
  }
})();
