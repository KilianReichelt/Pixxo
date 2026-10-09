from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(r'C:\Users\k.reichelt\Desktop\Pixxo')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
 page=browser.new_page(viewport={'width':1440,'height':1000});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto((root/'pixxo.html').as_uri())
 result=page.evaluate('''()=>{
  G.speed=0;for(const id in WINS)closeWin(id);
  const realBuildings=G.blds,originalStocks={...G.stock},originalGold=G.gold;
  const rows=[];
  for(let tier=1;tier<=3;tier++){
   const b={id:90009,type:'haus',tier,pop:TIERS[tier].cap,conn:true,cov:{markt:true,kapelle:true,kirche:true},need:{},sat:{},mood:1,age:0,fire:0,prog:0};
   const port={type:'kontor',tier:1,pop:0,conn:true,age:0,fire:0};
   G.blds=[port,b];G.dirty=false;G.nextShip=1e9;G.nextFire=1e9;G.ship=null;G.carts=[];
   const goods={...TIERS[tier].goods,...additionalHouseGoods(b)};
   for(const g of GOODS)G.stock[g.id]=100;
   const previous={...G.stock};workforceStep(60);
   for(const [g,rate] of Object.entries(goods)){
    const used=previous[g]-G.stock[g],expected=rate*TIERS[tier].cap;
    if(Math.abs(used-expected)>1e-8)throw Error('Falscher Verbrauch '+tier+' '+g+': '+used+' statt '+expected);
   }
   const fedIncome=houseIncome(b),satisfaction=b.mood;
   for(const g in goods){
    for(const item of GOODS)G.stock[item.id]=100;
    workforceStep(1);const supplied=houseIncome(b);G.stock[g]=0;workforceStep(1);
    if(houseIncome(b)>=supplied)throw Error('Ware ohne Einkommenswirkung: '+g+' auf Stufe '+tier);
   }
   for(const g of Object.keys(additionalHouseGoods(b)))G.stock[g]=0;
   G.stock.brot=0;workforceStep(1);const withoutBread=houseIncome(b);
   if(fedIncome<=withoutBread||breadIncome(b)!==0)throw Error('Brot erhöht Einkommen nicht');
   for(const g of GOODS)G.stock[g.id]=100;b.cov.markt=false;const before={...G.stock};workforceStep(60);
   for(const g in goods)if(G.stock[g]!==before[g])throw Error('Verbrauch ohne Marktplatz '+g);
   if(extraHouseIncome(b)!==0)throw Error('Bonus ohne Marktplatz');
   rows.push({tier,goods:Object.keys(goods),fedIncome,withoutBread,satisfaction});
  }
  // Neue Häuser benötigen keine zusätzlichen Waren für Wachstum und Aufstieg.
  const h={type:'haus',tier:1,pop:2,conn:true,cov:{markt:true},need:{},sat:{},mood:0,age:0,fire:0};
  G.blds=[h];G.stock.fisch=100;G.stock.brot=0;G.stock.tuch=0;workforceStep(10);
  if(h.mood!==1||h.pop<=2)throw Error('Zusatzwaren blockieren Spielstart');
  const farmer={type:'haus',tier:1,pop:4},lumber={type:'holzfaeller',envEff:1},saw={type:'saegewerk',envEff:1},fish={type:'fischer',envEff:1};
  G.blds=[farmer,lumber,saw,fish];let staff=assignWorkforce(G);
  if(staff.demand[1]!==12||staff.free[1]!==-8||Math.abs(lumber.eff-1/3)>1e-8)throw Error('Personalbedarf nicht verdoppelt');
  saw.paused=true;staff=assignWorkforce(G);if(staff.demand[1]!==8||lumber.eff!==.5)throw Error('Pausieren gibt keine Arbeitskräfte frei');
  G.blds.push({type:'haus',tier:2,pop:100});staff=assignWorkforce(G);if(staff.ratio[1]!==.5)throw Error('Falsche Bevölkerungsstufe zählt');
  G.blds=realBuildings;G.stock=originalStocks;G.gold=originalGold;
  const house=G.blds.find(b=>b.type==='haus');house.conn=true;house.cov.markt=true;house.sat.brot=true;house.sat.tuch=true;UI.sel=house.id;
  const html=infoHTML();if(!html.includes('Zusätzliche Versorgung')||!html.includes('Davon durch zusätzliche Waren'))throw Error('Versorgung im Fenster fehlt');
  openWin_info();renderTop(true);render();return {rows,staffNeeded:{wood:B.holzfaeller.workforce.count,sawmill:B.saegewerk.workforce.count,farm:B.farm.workforce.count,bakery:B.baeckerei.workforce.count},earlyGrowth:h.pop};
 }''')
 page.screenshot(path=str(root/'pixxo_tests'/'pixxo-verbrauch-versorgung.png'))
 print(result,'ERRORS',errors);assert not errors
 browser.close()
