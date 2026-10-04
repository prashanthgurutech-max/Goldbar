// Sets BLINKDEAL6 live or not live in data/offers.json. Usage: LIVE=true|false node scripts/set_blinkdeal.mjs
import { readFileSync, writeFileSync } from 'node:fs';
const f = 'data/offers.json';
const v = process.env.LIVE;
if (v !== 'true' && v !== 'false') { console.error('LIVE must be true or false'); process.exit(1); }
const offers = JSON.parse(readFileSync(f, 'utf8'));
const ist = new Date(Date.now() + 5.5 * 3600e3);
offers.BLINKDEAL6 = { store: 'Myntra', live: v === 'true', checked: ist.toISOString().slice(0, 19) + '+05:30', source: 'manual' };
writeFileSync(f, JSON.stringify(offers, null, 1));
console.log('BLINKDEAL6 live =', offers.BLINKDEAL6.live);
