"""Generates SAMPLE data (fake prices) so the app can be shown before real prices are connected."""
import json, random, datetime as dt
random.seed(7)
G24 = 14975; SILVER = 195000
now = dt.datetime(2026,10,4,5,0)
rates = {"mode":"sample","updated":now.strftime("%Y-%m-%dT%H:%M:00+05:30"),"gold24":G24,"silver_kg":SILVER,
         "source":"Sample values for layout testing"}
json.dump(rates, open('data/rates.json','w'), indent=1)
# history
hist=[]; g=G24*0.93; s=SILVER*0.92
for i in range(30,-1,-1):
    d=(now-dt.timedelta(days=i)).strftime("%Y-%m-%d")
    g*=1+random.uniform(-0.006,0.0095); s*=1+random.uniform(-0.01,0.012)
    hist.append({"d":d,"g24":round(g),"s":round(s)})
k=G24/hist[-1]["g24"]; ks=SILVER/hist[-1]["s"]
for h in hist: h["g24"]=round(h["g24"]*k); h["s"]=round(h["s"]*ks)
json.dump(hist, open('data/history.json','w'))
stores=["Myntra","Ajio","Flipkart","Shopsy","Amazon"]
bias={"Myntra":0.030,"Ajio":0.034,"Flipkart":0.012,"Shopsy":0.010,"Amazon":0.022}
brands=["Sample Mint","Demo Refinery","Sample Bullion"]
offers={"Myntra":{"code":"BLINKDEAL6","type":"pct","value":6,"max":2000,"note":"Coupon (sample)"},
        "Ajio":{"code":"SAMPLE5","type":"pct","value":5,"max":1500,"note":"Coupon (sample)"}}
bank={"Flipkart":{"label":"10% off, sample bank card","type":"pct","value":10,"max":1000},
      "Amazon":{"label":"7.5% off, sample bank card","type":"pct","value":7.5,"max":1500},
      "Shopsy":{"label":"5% off, sample bank card","type":"pct","value":5,"max":500}}
L=[]; n=0
for st in stores:
  for kt in (24,22,18,14):
    for w in range(1,21):
      if random.random()<0.12: continue   # not every size exists everywhere
      pure=G24*kt/24
      small=0.045/(w**0.5)               # small coins cost more per gram
      mk=bias[st]+small+random.uniform(-0.004,0.012)
      price=round(pure*w*(1+mk))
      n+=1
      item={"id":n,"store":st,"brand":random.choice(brands),"karat":kt,"weight":w,"price":price,
            "title":f"{w} g {kt}K gold {'coin' if w<=10 else 'bar'}","url":"https://example.com/"+st.lower()}
      if st in offers and random.random()<0.85: item["coupon"]=offers[st]
      if st in bank and random.random()<0.8: item["bank"]=bank[st]
      L.append(item)
json.dump(L, open('data/listings.json','w'), indent=0)
print(len(L),"sample listings")
