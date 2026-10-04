// "Share GoldRadar" button: native share sheet on phones, WhatsApp link elsewhere.
(function () {
  const site = () => location.origin + location.pathname.replace(/[^\/]*$/, '');
  const msg = () => (window.I18N && I18N.lang === 'te')
    ? 'బంగారు నాణేలు, బార్ల ధరలు Myntra, Ajio, Flipkart, Shopsy, Amazon లో పోల్చండి: '
    : 'Compare gold coin & bar prices across Myntra, Ajio, Flipkart, Shopsy & Amazon, with offers applied: ';
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-share]'); if (!b) return; e.preventDefault();
    const url = site(), text = msg();
    if (navigator.share) navigator.share({ title: 'GoldRadar', text, url }).catch(() => {});
    else window.open('https://wa.me/?text=' + encodeURIComponent(text + url), '_blank', 'noopener');
  });
})();
