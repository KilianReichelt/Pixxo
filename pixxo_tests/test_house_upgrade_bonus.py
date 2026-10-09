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
  const house=G.blds.find(b=>b.type==='haus');Object.assign(house,{tier:1,pop:4,conn:true,cov:{markt:true,kapelle:true,kirche:true},sat:{},need:{},mood:1,supplyTime:60});
  for(const g of GOODS)G.stock[g.id]=100;G.stock.tuch=.75;G.gold=10000;
  for(const [g,rate] of Object.entries({...TIERS[1].goods,...additionalHouseGoods(house)}))supplyHouseGood(house,g,rate,1);
  let req=nextTierReq(house),cloth=req.list.find(x=>x.icon==='tuch');
  if(!cloth.ok||!req.ok||G.stock.tuch>=3)throw Error('Tuchversorgung trotz kleinem Vorrat nicht anerkannt');
  const bonus=extraHouseIncome(house),oldBonus=4*(.25+.125);
  if(Math.abs(bonus/oldBonus-2.5)>1e-9)throw Error('Bonus nicht um 150 % erhöht');
  UI.sel=house.id;const html=infoHTML();
  const text=document.createElement('div');text.innerHTML=html;
  if(!/Tuch\s*erfüllt/.test(text.textContent)||/Tuch\s*fehlt/.test(text.textContent))throw Error('Aufstiegsanzeige widerspricht Versorgung');
  if(upgradeHouse(house)!==true||house.tier!==2)throw Error('Tatsächlicher Aufstieg scheitert');
  Object.assign(house,{tier:2,pop:8,conn:true,cov:{markt:true,kapelle:true,kirche:true},need:{},sat:{},mood:1,supplyTime:60});
  for(const [g,rate] of Object.entries({...TIERS[2].goods,...additionalHouseGoods(house)})){
   G.stock[g]=.75;supplyHouseGood(house,g,rate,1);
  }
  req=nextTierReq(house);if(!req.ok)throw Error('Patrizieraufstieg trotz Versorgung gesperrt');
  const citizenBonus=extraHouseIncome(house),oldCitizenBonus=8*(.25+3*.125);
  if(Math.abs(citizenBonus/oldCitizenBonus-2.5)>1e-9)throw Error('Bürgerbonus falsch');
  G.stock.wein=0;supplyHouseGood(house,'wein',TIERS[3].goods.wein,1);
  if(nextTierReq(house).list.find(x=>x.icon==='wein').ok)throw Error('Fehlender Wein erfüllt Aufstieg');
  house.cov.markt=false;house.sat.wein=true;
  if(nextTierReq(house).list.some(x=>GN[x.icon]&&x.ok)||extraHouseIncome(house)!==0)throw Error('Versorgung ohne Markt anerkannt');
  house.cov.markt=true;house.conn=false;
  if(nextTierReq(house).list.some(x=>GN[x.icon]&&x.ok))throw Error('Versorgung ohne Straße anerkannt');
  Object.assign(house,{tier:1,pop:4,conn:true,cov:{markt:true,kapelle:true},sat:{fisch:true,brot:true,tuch:true},mood:1,supplyTime:60});
  G.stock.tuch=.75;UI.sel=house.id;G.dirty=false;openWin_info();renderTop(true);render();
  return {clothStock:G.stock.tuch,suppliedCloth:true,upgradeSucceeded:true,oldBonus,newBonus:bonus,oldCitizenBonus,newCitizenBonus:citizenBonus,multiplier:EXTRA_INCOME_MULTIPLIER};
 }''')
 page.screenshot(path=str(root/'pixxo_tests'/'pixxo-aufstieg-tuch-bonus.png'))
 print(result,'ERRORS',errors);assert not errors
 browser.close()
