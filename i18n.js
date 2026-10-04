// English / Telugu switch. English text is the key. Add a pair to TE to translate more text.
(function () {
  const TE = {
    'KARAT': 'క్యారెట్', 'WEIGHT': 'బరువు', 'STORE': 'స్టోర్', 'Apply coupons': 'కూపన్లు వర్తింపజేయి', 'Apply bank offers': 'బ్యాంక్ ఆఫర్లు వర్తింపజేయి',
    'Sort': 'క్రమం', 'Lowest final price': 'తక్కువ తుది ధర', 'Lowest ₹/g pure': 'తక్కువ ₹/గ్రా స్వచ్ఛం', 'Biggest saving': 'ఎక్కువ ఆదా',
    'Cheapest at each weight': 'ప్రతి బరువుకు చౌకైన ధర', 'Store comparison': 'స్టోర్ల పోలిక',
    'best final price for each store, selected karat': 'ప్రతి స్టోర్‌లో ఎంచుకున్న క్యారెట్‌కు ఉత్తమ తుది ధర',
    'Market value by weight': 'బరువు వారీగా మార్కెట్ విలువ', "what the gold itself is worth at today's rate": 'నేటి రేటు ప్రకారం బంగారం విలువ',
    'Rate history': 'రేటు చరిత్ర', 'last 30 days': 'గత 30 రోజులు', 'Gold 24K / g': 'బంగారం 24K / గ్రా', 'Silver / kg': 'వెండి / కిలో',
    'Store links may be affiliate links. We may earn a commission at no extra cost to you.': 'స్టోర్ లింకులు అఫిలియేట్ లింకులు కావచ్చు. మీకు అదనపు ఖర్చు లేకుండా మాకు కమిషన్ రావచ్చు.',
    'Prices are indicative and change often. Check the final price, coupon and stock on the store before buying. This is not investment advice.': 'ధరలు సూచనాత్మకమైనవి, తరచుగా మారుతాయి. కొనే ముందు స్టోర్‌లో తుది ధర, కూపన్, స్టాక్ చూడండి. ఇది పెట్టుబడి సలహా కాదు.',
    'About': 'మా గురించి', 'Privacy': 'గోప్యత', 'Disclaimer': 'నిరాకరణ', 'Calculators': 'కాలిక్యులేటర్లు', 'Buying guide': 'కొనుగోలు గైడ్', '← Back to prices': '← ధరలకు తిరిగి',
    "Today's 24K {p} / g": 'నేటి 24K {p} / గ్రా', 'updated {a}': 'అప్‌డేట్: {a}',
    '{n} min ago': '{n} నిమిషాల క్రితం', '{n} h ago': '{n} గంటల క్రితం', '{n} d ago': '{n} రోజుల క్రితం',
    'GOLD {k}K': 'బంగారం {k}K', 'per gram': 'గ్రాముకు', 'SILVER': 'వెండి', 'per 1 kg · {g} / g': 'కిలోకు · {g} / గ్రా',
    '{c} on {s}: LIVE, applied to prices': '{s}లో {c}: లైవ్, ధరలకు వర్తింపు', '{c} on {s}: not live': '{s}లో {c}: లైవ్ కాదు', 'checked {a}': 'తనిఖీ: {a}',
    'BEST PRICE · {w} g {k}K': 'ఉత్తమ ధర · {w} గ్రా {k}K', 'per gram of pure gold': 'స్వచ్ఛ బంగారం గ్రాముకు', 'listed {p}': 'లిస్ట్ ధర {p}',
    'Buy on {s}': '{s}లో కొనండి', 'Affiliate link': 'అఫిలియేట్ లింక్', 'You save {p} with offers': 'ఆఫర్లతో మీరు {p} ఆదా చేస్తారు',
    'Coupon {c}: −{p}': 'కూపన్ {c}: −{p}', '{v}% vs gold value {m}': 'బంగారం విలువ {m} కంటే {v}%', '{p} cheaper than {s}': '{s} కంటే {p} తక్కువ',
    'No {w} g {k}K listing. Try another weight or store.': '{w} గ్రా {k}K లిస్టింగ్ లేదు. మరో బరువు లేదా స్టోర్ ప్రయత్నించండి.',
    'No {w} g {k}K listing on {s}. Try another weight or store.': '{s}లో {w} గ్రా {k}K లిస్టింగ్ లేదు. మరో బరువు లేదా స్టోర్ ప్రయత్నించండి.',
    '{k}K, lowest final price across all stores': '{k}K, అన్ని స్టోర్లలో తక్కువ తుది ధర', 'no listing': 'లిస్టింగ్ లేదు', '{p} / g pure': '{p} / గ్రా స్వచ్ఛం', '{w} g': '{w} గ్రా',
    '{w} g {k}K deals': '{w} గ్రా {k}K డీల్స్', '{n} listing': '{n} లిస్టింగ్', '{n} listings': '{n} లిస్టింగ్‌లు', ' · final price after selected offers': ' · ఎంచుకున్న ఆఫర్ల తర్వాత తుది ధర',
    'Best price': 'ఉత్తమ ధర', 'Coupon {c} is not live right now': 'కూపన్ {c} ప్రస్తుతం లైవ్‌లో లేదు', 'Coupon {c} available': 'కూపన్ {c} అందుబాటులో ఉంది',
    '{l} available': '{l} అందుబాటులో ఉంది', '{v}% vs gold value': 'బంగారం విలువతో పోలిస్తే {v}%', 'Nothing to show.': 'చూపడానికి ఏమీ లేదు.',
    'GOLD VALUE': 'బంగారం విలువ', 'Price checked {a}': 'ధర తనిఖీ: {a}', ' · likely outdated, check the store': ' · పాతది కావచ్చు, స్టోర్‌లో చూడండి', ' · may be outdated': ' · పాతది కావచ్చు',
    'Share on WhatsApp': 'WhatsAppలో షేర్ చేయండి', 'Report wrong price': 'తప్పు ధర తెలపండి',
    'Sample data. Rates and store prices below are made up to show the layout.': 'శాంపిల్ డేటా. కింది రేట్లు, ధరలు లేఅవుట్ చూపడానికి కల్పించినవి.',
    'Gold and silver rates are live. Store prices below are SAMPLES, not real listings yet.': 'బంగారం, వెండి రేట్లు లైవ్. కింది స్టోర్ ధరలు శాంపిల్ మాత్రమే, నిజమైన లిస్టింగ్‌లు కావు.',
    'Gold and silver rates are samples.': 'బంగారం, వెండి రేట్లు శాంపిల్ మాత్రమే.',
    // buy now or wait
    'Buy now or wait?': 'ఇప్పుడు కొనాలా, ఆగాలా?', 'Good time to buy': 'కొనడానికి మంచి సమయం', 'Near the average': 'సగటుకు దగ్గరగా', 'Above average, consider waiting': 'సగటు కంటే ఎక్కువ, ఆగడం పరిశీలించండి',
    "24K today {p} is {d}% {dir} its {n}-day average of {a}. Last 7 days: {w}%.": 'నేటి 24K {p}, {n} రోజుల సగటు {a} కంటే {d}% {dir}. గత 7 రోజులు: {w}%.',
    'below': 'తక్కువ', 'above': 'ఎక్కువ', 'Based on past prices only. Not investment advice.': 'గత ధరల ఆధారంగా మాత్రమే. పెట్టుబడి సలహా కాదు.',
    // breakdown
    'What you pay': 'మీరు చెల్లించేది', 'Listed price': 'లిస్ట్ ధర', 'Final price': 'తుది ధర', 'Gold value at today\'s rate': 'నేటి రేటు ప్రకారం బంగారం విలువ',
    'Premium over gold value': 'బంగారం విలువపై ప్రీమియం', 'Per gram of pure gold': 'స్వచ్ఛ బంగారం గ్రాముకు',
    'Listed prices normally include GST. Delivery or other charges, if any, appear at checkout on the store.': 'లిస్ట్ ధరల్లో సాధారణంగా GST కలిసి ఉంటుంది. డెలివరీ లేదా ఇతర ఛార్జీలు ఉంటే, స్టోర్ చెక్‌అవుట్‌లో కనిపిస్తాయి.',
    // calculators
    'Gold and silver calculators': 'బంగారం, వెండి కాలిక్యులేటర్లు', 'Rates used: 24K gold {g} / g, silver {s} / kg.': 'వాడిన రేట్లు: 24K బంగారం {g} / గ్రా, వెండి {s} / కిలో.',
    'How much gold can I buy?': 'నా డబ్బుతో ఎంత బంగారం కొనవచ్చు?', 'Amount (₹)': 'మొత్తం (₹)', 'Gold vs silver': 'బంగారం vs వెండి',
    'Gold-to-silver price ratio: {r}. Enter an amount and a possible price change for each metal.': 'బంగారం–వెండి ధర నిష్పత్తి: {r}. మొత్తం, ప్రతి లోహానికి ధర మార్పు ఇవ్వండి.',
    'Gold price change (%)': 'బంగారం ధర మార్పు (%)', 'Silver price change (%)': 'వెండి ధర మార్పు (%)',
    '24K gold you get': 'మీకు వచ్చే 24K బంగారం', 'Silver you get': 'మీకు వచ్చే వెండి', 'Value after change': 'మార్పు తర్వాత విలువ', 'Gold': 'బంగారం', 'Silver': 'వెండి',
    'Monthly gold savings plan': 'నెలవారీ బంగారం పొదుపు ప్లాన్', 'Monthly amount (₹)': 'నెలకు మొత్తం (₹)', 'Months': 'నెలలు', 'Assumed price change per year (%)': 'ఏడాదికి అంచనా ధర మార్పు (%)',
    'Total invested': 'మొత్తం పెట్టుబడి', '24K gold collected': 'జమ అయ్యే 24K బంగారం', 'Estimated value at the end': 'చివరికి అంచనా విలువ',
    'This is an estimate using the price change you enter. Real prices can move either way.': 'మీరు ఇచ్చిన ధర మార్పుతో వేసిన అంచనా ఇది. నిజ ధరలు రెండు వైపులా మారవచ్చు.',
    'Gold loan EMI': 'గోల్డ్ లోన్ EMI', 'Loan amount (₹)': 'లోన్ మొత్తం (₹)', 'Interest per year (%)': 'ఏడాదికి వడ్డీ (%)', 'Monthly EMI': 'నెలవారీ EMI', 'Total interest': 'మొత్తం వడ్డీ', 'Total payable': 'మొత్తం చెల్లింపు',
    'Processing fees and other charges are not included.': 'ప్రాసెసింగ్ ఫీజులు, ఇతర ఛార్జీలు చేర్చలేదు.',
    'Gold price per gram': 'గ్రాము బంగారం ధర'
  };
  let lang = 'en';
  try { const q = new URLSearchParams(location.search).get('lang'); lang = (q === 'te' || q === 'en') ? q : (localStorage.getItem('gr_lang') || 'en'); } catch (e) {}
  if (lang !== 'te') lang = 'en';
  function t(k, v) { let s = (lang === 'te' && TE[k]) || k; if (v) for (const x in v) s = s.split('{' + x + '}').join(v[x]); return s; }
  function apply() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(e => {
      if (!e.dataset.en) e.dataset.en = e.innerHTML.trim();
      e.innerHTML = (lang === 'te' && TE[e.dataset.en]) || e.dataset.en;
    });
    const b = document.getElementById('langBtn'); if (b) b.textContent = lang === 'te' ? 'English' : 'తెలుగు';
  }
  function set(l) { lang = l; try { localStorage.setItem('gr_lang', l); } catch (e) {} apply(); if (window.onLangChange) window.onLangChange(); }
  window.I18N = { t, apply, set, get lang() { return lang; } };
  const b = document.getElementById('langBtn'); if (b) b.onclick = () => set(lang === 'te' ? 'en' : 'te');
  apply();
})();
