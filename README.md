# GoldRadar

Compare 24K, 22K, 18K and 14K gold coin and bar prices (1 g to 20 g) across Myntra, Ajio, Flipkart, Shopsy and Amazon, with coupons and bank offers applied, plus today's gold and silver rates and a 30-day history. Dark theme, works on iPhone, no build step.

**Right now it runs on SAMPLE data** (set `listingsAreSample` to false in data/config.json once data/listings.json holds real prices). The page shows a yellow "Sample data" banner until real rates are written by the updater. Store prices (data/listings.json) are fake until you connect a real source.

## Files
- index.html, styles.css, app.js: the site
- data/rates.json: today's 24K gold per gram and silver per kg (the updater rewrites this)
- data/listings.json: one row per store listing (see format below)
- data/history.json: daily rates for the chart
- data/config.json: store names, affiliate tags, rate premium
- scripts/update_rates.mjs + .github/workflows/update.yml: free twice-a-day rate update on GitHub
- .github/workflows/blinkdeal.yml + scripts/set_blinkdeal.mjs + data/offers.json: manual BLINKDEAL6 switch
- track.js, admin.html, admin.js, sql/traffic.sql: visitor counter and private admin page
- scripts/make_sample.py: regenerates the sample data

## Put it online (GitHub Pages, free)
1. On github.com create a new public repository, e.g. `goldradar`.
2. Unzip this folder in the Files app, then in the repo choose Add file > Upload files and upload index.html, styles.css, app.js and the `data` and `scripts` folders.
3. The hidden `.github` folder is easiest to add by hand: Add file > Create new file, name it `.github/workflows/update.yml`, and paste the contents of that file.
4. Settings > Pages > Source: Deploy from a branch > main > / (root) > Save. Your site appears at https://YOUR-NAME.github.io/goldradar
5. Settings > Actions > General > Workflow permissions: Read and write permissions > Save. Then Actions > Update gold and silver rates > Run workflow once. Rates turn live and the sample banner disappears.

## Rates
The updater takes the international gold and silver price and the USD/INR rate from free public sources and adds `indiaPremiumPct` (duty, GST and local margin) from data/config.json. This is an ESTIMATE. Compare it with the Indian retail rate you trust and change `indiaPremiumPct` until it matches. To type rates yourself, add this to data/rates.json (the updater then keeps your numbers):
`"manual": { "gold24": 14975, "silver_kg": 195000 }`

## Listings format (data/listings.json)
```
{ "id": 1, "store": "Flipkart", "brand": "Brand", "karat": 24, "weight": 5, "price": 77524,
  "title": "5 g 24K gold coin", "url": "https://...",
  "coupon": { "code": "CODE", "type": "pct", "value": 6, "max": 2000, "note": "optional" },
  "bank":   { "label": "10% off with XYZ card", "type": "pct", "value": 10, "max": 1000 } }
```
`type` is `pct` or `flat`. `max` and `min` (minimum order) are optional. Final price = price minus coupon, then minus bank offer. The Apply toggles on the page switch them on and off.

## Connecting real store prices (honest note)
The stores block automated reading from cloud servers (you saw this with Myntra on GitHub). Options, in order of reliability: official affiliate product feeds or APIs where a store has one (Amazon, Flipkart), a manual daily paste into listings.json for the best deals, or a small script on a machine you control. Check each store's terms before collecting prices automatically. Until a source is chosen, keep the sample banner on.

## Affiliate links (all Buy buttons)
Every Buy button, in the best-deal card and in the listings, goes through the link builder in app.js, using the settings in data/config.json under `affiliate`. A store with no setting gets a plain link. A store with a setting gets your affiliate link and a small "Affiliate link" label, and the footer shows the disclosure line. Best-price ranking never uses commission; it is by final price only.

Two ways to set each store:
1. Tag on the store's own link (Amazon, Flipkart, Shopsy):
   `"Amazon": { "param": "tag", "value": "yourtag-21", "subParam": "ascsubtag" }`
   `"Flipkart": { "param": "affid", "value": "your-flipkart-id", "extra": {}, "subParam": "affExtParam1" }`
2. Network deep link (Myntra, Ajio, or any store through Cuelinks, EarnKaro, vCommission, Admitad and similar): copy the "deep link" pattern from your network dashboard and put `{urlenc}` where the product URL goes (and `{sub}` where a tracking id goes):
   `"Myntra": { "template": "https://linksredirect.com/?cid=YOUR_ID&source=linkkit&url={urlenc}&subid={sub}" }`
   Check the exact pattern in your own dashboard; each network differs.

Sub ids look like `gr-myntra-5g-24k`, so your network reports show which weight and karat sold.
Important: affiliate links only work with real product URLs. Put each real product page in the `url` field of data/listings.json.

## Run it on your computer
`python3 -m http.server 8000` in this folder, then open http://localhost:8000

## BLINKDEAL6 switch (only you can change it)
Myntra's coupon cannot be detected automatically, so you switch it by hand. When it is ON, the coupon is taken off every Myntra price on the site and a green LIVE chip shows; when OFF, Myntra prices show without it.
- In the GitHub app (or github.com): your repository > Actions > "BLINKDEAL6 switch" > Run workflow > choose `true` or `false` > Run. The site updates in about a minute.
- Only people with write access to your repository can run it, and that is only you.
- It is stored in data/offers.json. You can also edit `"live": true/false` there.

## Visitor counts (Supabase) – private admin page
The site counts visits itself and shows them only to you at `/admin.html` (not linked anywhere on the site).
What is stored: a random id kept in the visitor's browser, the time, device type (phone/tablet/desktop), where they came from (for example whatsapp or google.com), and which weight, karat and store button they used. No names, emails or IP addresses.

One-time setup:
1. Supabase > SQL Editor > paste all of `sql/traffic.sql` > Run.
2. In the same editor run this, with the email you use to sign in to Supabase apps (it must already exist under Authentication > Users; create it there if not):
   `insert into gr_admins (user_id) select id from auth.users where email = 'YOUR_EMAIL' on conflict do nothing;`
3. Supabase > Project Settings > API: copy the Project URL (just `https://xxxx.supabase.co`) and the anon public key into data/config.json under `"supabase": { "url": "...", "anonKey": "..." }`. The anon key is safe to publish; the tables cannot be read without your admin sign-in.
4. Open `https://YOUR-NAME.github.io/goldradar/admin.html` and sign in.
5. To leave out your own visits, open the main site once on each of your devices with `?notrack=1` at the end of the address.

You see: today, last 7 days, last 30 days and all-time visits with unique visitors; daily (30 days), weekly (12 weeks) and monthly (12 months) tables and bars; Buy clicks per store; most viewed weights and karats; phone vs desktop; and referrers. Times are IST. Visitors who turn on "Do Not Track" are not counted.

## Pre-launch features
- **Price checked time**: each listing shows "Price checked X ago" from its `checked` field in data/listings.json. After `staleHours` (24) it turns amber "may be outdated", after `expiredHours` (72) red "likely outdated". Update `checked` whenever you re-verify a price.
- **About / Privacy / Disclaimer** pages (about.html, privacy.html, disclaimer.html) are templates. Read them and edit to suit you. They fill your contact from `contact` in data/config.json.
- **Share and report**: every card has "Share on WhatsApp" (opens a chat with the product, price and a link back to the same karat/weight). "Report wrong price" appears once you set `"contact": {"whatsapp": "91XXXXXXXXXX", "email": ""}` in data/config.json.
- **Add to home screen**: manifest.webmanifest and icons are included. On iPhone: Safari > Share > Add to Home Screen. On Android Chrome: menu > Install app.

## Version 2 features
- **Telugu toggle** (button top right, or `?lang=te`). English text is the key in `i18n.js`; add a pair to the `TE` list to translate more text.
- **Buy now or wait?** badge compares today's 24K rate with the average of the last 30 real days. It stays hidden until 7 real days are saved (the updater marks real days with `r:1`; the sample days do not count).
- **What you pay** box on every listing: listed price, coupon, bank offer, final price, gold value and premium.
- **calc.html**: how much gold can I buy, gold vs silver, monthly savings plan, gold loan EMI.
- **guide.html**: buying guide in English and Telugu.
