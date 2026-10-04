// Daily rate update. Node 20+, no dependencies.
// Gold/silver: international price (USD/oz) x USD/INR x (1 + premium) -> INR per gram / kg.
// If data/rates.json contains a "manual" block, that wins:  "manual": {"gold24": 14975, "silver_kg": 195000}
import { readFileSync, writeFileSync } from 'node:fs';
const rd = f => JSON.parse(readFileSync(f, 'utf8'));
const get = async u => { const r = await fetch(u); if (!r.ok) throw new Error(u + ' ' + r.status); return r.json(); };
const OZ = 31.1035;
const cfg = rd('data/config.json').rates || {};
const gp = cfg.indiaPremiumPct ?? 0, sp = cfg.silverPremiumPct ?? gp;
const old = rd('data/rates.json');
let gold24, silver_kg, source;
if (old.manual && old.manual.gold24 && old.manual.silver_kg) {
  ({ gold24, silver_kg } = old.manual); source = 'Manual entry';
} else {
  const [xau, xag, fx] = await Promise.all([
    get('https://api.gold-api.com/price/XAU'), get('https://api.gold-api.com/price/XAG'),
    get('https://open.er-api.com/v6/latest/USD')]);
  const inr = fx.rates.INR;
  gold24 = Math.round(xau.price / OZ * inr * (1 + gp / 100));
  silver_kg = Math.round(xag.price / OZ * 1000 * inr * (1 + sp / 100));
  source = `gold-api.com x open.er-api.com USD/INR ${inr.toFixed(2)}, +${gp}% premium (estimate)`;
}
const now = new Date();
const ist = new Date(now.getTime() + 5.5 * 3600e3);
const out = { ...old, mode: 'live', updated: ist.toISOString().slice(0, 19) + '+05:30', gold24, silver_kg, source };
writeFileSync('data/rates.json', JSON.stringify(out, null, 1));
const hist = rd('data/history.json'); const d = ist.toISOString().slice(0, 10);
const last = hist[hist.length - 1];
if (last && last.d === d) { last.g24 = gold24; last.s = silver_kg; } else hist.push({ d, g24: gold24, s: silver_kg });
writeFileSync('data/history.json', JSON.stringify(hist.slice(-90)));
console.log('gold24', gold24, 'silver_kg', silver_kg, source);
