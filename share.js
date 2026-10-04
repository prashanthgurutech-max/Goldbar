// "Share GoldRadar" button: native share sheet on phones, WhatsApp link elsewhere.
(function () {
  const site = () => location.origin + location.pathname.replace(/[^\/]*$/, '');
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-share]'); if (!b) return; e.preventDefault();
    const url = site(), text = I18N.t('Compare gold coin & bar prices across Myntra, Ajio, Flipkart, Shopsy & Amazon, with offers applied: ');
    if (navigator.share) navigator.share({ title: 'GoldRadar', text, url }).catch(() => {});
    else window.open('https://wa.me/?text=' + encodeURIComponent(text + url), '_blank', 'noopener');
  });
})();
