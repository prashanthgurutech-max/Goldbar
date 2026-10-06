// Gold investment comparator: physical coin/bar vs digital gold vs Gold ETF vs Sovereign Gold Bond (SGB).
// All four start from the same assumed gold price growth, so the comparison is purely about
// the cost of each route in and out, plus how each is taxed. Every rate is editable because
// making charges, spreads and tax law all vary and change — defaults are typical, not promises.
(function () {
  const $ = s => document.querySelector(s);
  const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
  const pct = n => (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
  const tr = (k, v) => (window.I18N ? I18N.t(k, v) : k);

  const ids = ['amount', 'years', 'cagr', 'making', 'resale', 'dgBuy', 'dgSell', 'etfExp', 'etfFric', 'sgbInt', 'ltcgRate', 'stcgRate'];
  const read = () => Object.fromEntries(ids.map(id => [id, +($('#' + id).value || 0)]));

  function compute(v) {
    const H = Math.max(0.1, v.years), g = v.cagr / 100, GST = 0.03;
    const grow = (1 + g) ** H;
    const ltRate = v.ltcgRate / 100, stRate = v.stcgRate / 100;

    // Physical coin or bar
    const coinGoldBought = v.amount / (1 + v.making / 100) / (1 + GST);
    const coinGrossExit = coinGoldBought * grow;
    const coinProceeds = coinGrossExit * (1 - v.resale / 100);
    const coinGain = Math.max(0, coinProceeds - v.amount);
    const coinLT = H >= 2;
    const coinTax = coinGain * (coinLT ? ltRate : stRate);
    const coin = {
      key: 'coin', name: tr('Gold coin or bar'),
      lines: [
        [tr('Making charges'), '− ' + pct(-v.making) + ' ' + tr('of price')],
        [tr('GST on purchase'), '− 3%'],
        [tr('Jeweller buy-back deduction at exit'), '− ' + v.resale.toFixed(1) + '%'],
        [tr('Tax on gain'), '− ' + inr(coinTax) + ' (' + (coinLT ? tr('LTCG') : tr('STCG')) + ' ' + ((coinLT ? v.ltcgRate : v.stcgRate).toFixed(1)) + '%)']
      ],
      net: coinProceeds - coinTax,
      why: tr('You hold the metal itself. Making charges and GST are paid once on the way in; a jeweller typically deducts a little on the way out even with the original bill.')
    };

    // Digital gold (SafeGold / MMTC-PAMP style apps)
    const dgGoldBought = v.amount / (1 + v.dgBuy / 100) / (1 + GST);
    const dgGrossExit = dgGoldBought * grow;
    const dgProceeds = dgGrossExit * (1 - v.dgSell / 100);
    const dgGain = Math.max(0, dgProceeds - v.amount);
    const dgLT = H >= 2;
    const dgTax = dgGain * (dgLT ? ltRate : stRate);
    const digital = {
      key: 'digital', name: tr('Digital gold'),
      lines: [
        [tr('Buy spread'), '− ' + pct(-v.dgBuy) + ' ' + tr('of price')],
        [tr('GST on purchase'), '− 3%'],
        [tr('Sell spread at exit'), '− ' + v.dgSell.toFixed(1) + '%'],
        [tr('Tax on gain'), '− ' + inr(dgTax) + ' (' + (dgLT ? tr('LTCG') : tr('STCG')) + ' ' + ((dgLT ? v.ltcgRate : v.stcgRate).toFixed(1)) + '%)']
      ],
      net: dgProceeds - dgTax,
      why: tr('No locker needed and you can sell any time, but the app’s buy/sell spread is charged every time, on top of GST on each purchase, and taxed as a capital asset like physical gold.')
    };

    // Gold ETF (on the stock exchange, held in demat)
    const etfUnits = v.amount * (1 - v.etfFric / 100);
    const etfGrowth = (1 + g - v.etfExp / 100) ** H;   // expense ratio drags NAV growth every year
    const etfGrossExit = etfUnits * etfGrowth;
    const etfProceeds = etfGrossExit * (1 - v.etfFric / 100);
    const etfGain = Math.max(0, etfProceeds - v.amount);
    const etfLT = H >= 1;                               // listed security: 12-month LTCG threshold
    const etfTax = etfGain * (etfLT ? ltRate : stRate);
    const etf = {
      key: 'etf', name: tr('Gold ETF'),
      lines: [
        [tr('Brokerage, both trades'), '− ' + pct(-v.etfFric * 2) + ' ' + tr('(approx.)')],
        [tr('Expense ratio, per year'), '− ' + v.etfExp.toFixed(2) + '%'],
        [tr('No GST on ETF units'), '₹0'],
        [tr('Tax on gain'), '− ' + inr(etfTax) + ' (' + (etfLT ? tr('LTCG') : tr('STCG')) + ' ' + ((etfLT ? v.ltcgRate : v.stcgRate).toFixed(1)) + '%)']
      ],
      net: etfProceeds - etfTax,
      why: tr('No GST and the smallest buy/sell friction, but a yearly expense ratio compounds against you the longer you hold, and you need a demat account.')
    };

    // Sovereign Gold Bond (government-issued, 8-year tenor, 2.5%/yr interest)
    const sgbGoldExit = v.amount * grow;                 // full amount tracks gold, no haircut going in
    const sgbInterestTotal = v.amount * (v.sgbInt / 100) * H;  // simple interest, paid out twice a year
    const atMaturity = H >= 8;
    const sgbGain = Math.max(0, sgbGoldExit - v.amount);
    const sgbCapGainTax = atMaturity ? 0 : sgbGain * (H >= 2 ? ltRate : stRate);
    const sgbInterestTax = sgbInterestTotal * stRate;     // interest is always taxed at your slab rate, every year
    const sgb = {
      key: 'sgb', name: tr('Sovereign Gold Bond'),
      lines: [
        [tr('No making charges, spread or GST'), '₹0'],
        [tr('Interest, {n}%/yr on the amount invested', { n: v.sgbInt }), '+ ' + inr(sgbInterestTotal)],
        [tr('Tax on interest, every year, at your slab rate'), '− ' + inr(sgbInterestTax)],
        [tr('Tax on gain at redemption'), atMaturity ? tr('exempt, held to 8-year maturity') : '− ' + inr(sgbCapGainTax)]
      ],
      net: sgbGoldExit + sgbInterestTotal - sgbInterestTax - sgbCapGainTax,
      why: tr('The only route with no entry cost at all, plus interest on top, and the gain is tax-free if held to the 8-year maturity. The trade-off: new tranches open only on set dates, and redeeming early means selling on the exchange, which can trade at a discount to gold’s actual price.') + (atMaturity ? '' : ' ' + tr('At this horizon it has not reached the tax-free maturity window yet.'))
    };

    return [coin, digital, etf, sgb].map(o => ({ ...o, cagrAchieved: H > 0 ? ((o.net / v.amount) ** (1 / H) - 1) * 100 : 0 }));
  }

  function render() {
    const v = read();
    if (!(v.amount > 0) || !(v.years > 0)) return;
    const opts = compute(v).sort((a, b) => b.net - a.net);
    const best = opts[0].net;
    $('#invGrid').innerHTML = opts.map((o, i) => {
      const gain = o.net - v.amount, pos = gain >= 0;
      return `<div class="opt${o.net === best ? ' win' : ''}"><div class="rank">#${i + 1}</div>
        <div class="nm">${o.name}${o.net === best ? ` <span class="pill">${tr('Best net')}</span>` : ''}</div>
        <div class="net ${pos ? 'pos' : 'neg'}">${inr(o.net)}</div>
        <div class="sub">${tr('from {a} over {y} years', { a: inr(v.amount), y: v.years })} · ${pct(o.cagrAchieved)} ${tr('CAGR after costs and tax')}</div>
        ${o.lines.map(l => `<div class="ln"><span>${l[0]}</span><span>${l[1]}</span></div>`).join('')}
        <div class="why">${o.why}</div></div>`;
    }).join('');
    const spread = opts[0].net - opts[opts.length - 1].net;
    $('#invSummary').textContent = tr('At {g}% assumed gold growth over {y} years, {w} comes out {p} ahead of {l} on the same {a} — purely from how each is bought, held and taxed.', {
      g: v.cagr, y: v.years, w: opts[0].name, p: inr(spread), l: opts[opts.length - 1].name, a: inr(v.amount)
    });
  }

  function setup() {
    ids.forEach(id => { const el = $('#' + id); if (el) el.addEventListener('input', render); });
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup); else setup();
  window.onLangChange = render;
})();
