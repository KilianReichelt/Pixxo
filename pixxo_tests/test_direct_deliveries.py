from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(r'C:\Users\k.reichelt\Desktop\Pixxo')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
 for filename in ['pixxo.html']:
  page=browser.new_page(viewport={'width':1440,'height':1000});errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto((root/filename).as_uri())
  result=page.evaluate('''()=>{
   G.speed=0;for(const id in WINS)closeWin(id);
   const ox=ISLANDS[activeIsland].ox+25,oy=ISLANDS[activeIsland].oy+25;
   G.blds=[];G.byId.clear();G.road.fill(0);G.stock=Object.fromEntries(GOODS.map(g=>[g.id,0]));G.carts=[];G.dirty=false;G.nextShip=1e9;G.nextFire=1e9;
   function add(id,type,x,y){const b={id,island:activeIsland,type,x,y,...buildingSize(type,0),tier:1,pop:0,paused:false,prog:0,conn:true,acc:IDX(x,y-1),eff:1,envEff:1,staffEff:1,status:'',fire:0,need:{},sat:{},cov:{},age:0};G.blds.push(b);G.byId.set(id,b);return b}
   const wh=add(90001,'kontor',ox-10,oy),wood=add(90002,'holzfaeller',ox,oy),saw=add(90003,'saegewerk',ox+16,oy),far=add(90004,'saegewerk',ox+26,oy);
   for(let x=ox-10;x<=ox+29;x++)G.road[IDX(x,oy-1)]=1;
   G.deliveryPaths=new Map();let target=deliveryTarget(wood,'holz',1);
   if(target.b!==saw)throw Error('Nicht der nächste Betrieb');
   const directLength=target.path.length;
   deliverProduction(wood,'holz',1,target);
   if(G.stock.holz!==0||deliveryIncoming(saw,'holz')!==1)throw Error('Holz wurde ins Kontor geliefert');
   const packed=JSON.parse(JSON.stringify(packIsland(G)));
   if(packed.carts.length!==1||packed.carts[0].qty!==1)throw Error('Lieferung nicht gespeichert');
   advanceDeliveries(.1);if(saw.inputStock?.holz)throw Error('Lieferung ohne Fahrzeit');
   advanceDeliveries(20);if(saw.inputStock.holz!==1||G.stock.holz!==0)throw Error('Lieferung nicht angekommen');
   wood.paused=true;far.paused=true;workforceStep(B.saegewerk.cycle);
   if(G.stock.bretter!==1||saw.inputStock.holz!==0||G.stock.holz!==0)throw Error('Sägewerk verbraucht falschen Vorrat');
   // Ein voller Inselbestand darf direkte Weiterverarbeitung nicht verhindern.
   wood.paused=false;saw.paused=false;G.stock.holz=capOf();wood.prog=.999;
   workforceStep(.05);if(!G.carts.some(c=>c.qty&&c.target===saw.id))throw Error('Volles Kontor blockiert Direktlieferung');
   G.stock.holz=0;G.carts=[];saw.inputStock={holz:5};far.paused=false;
   if(deliveryTarget(wood,'holz',1)?.b!==far)throw Error('Voller Betrieb blockiert anderen Abnehmer');
   saw.paused=true;far.paused=true;if(deliveryTarget(wood,'holz',1))throw Error('Pausierter Betrieb erhält Ware');
   deliverProduction(wood,'holz',1,null);if(G.stock.holz!==1)throw Error('Überschuss fehlt im Lager');
   saw.paused=false;saw.inputStock={};G.deliveryPaths=new Map();deliverProduction(wood,'holz',1,deliveryTarget(wood,'holz',1));
   G.road[IDX(ox+8,oy-1)]=0;advanceDeliveries(.1);if(G.stock.holz!==2)throw Error('Ware bei Straßenabriss verloren');
   G.deliveryPaths=new Map();if(deliveryTarget(wood,'holz',1))throw Error('Lieferung ohne Straßenweg');
   G.road[IDX(ox+8,oy-1)]=1;G.deliveryPaths=new Map();G.carts=[];
   saw.inputStock={holz:2};removeBld(saw,false);advanceDeliveries(.1);if(G.stock.holz!==4)throw Error('Betriebsvorrat bei Abriss verloren');
   // Originalzustand mit Lieferung im Save wiederherstellen und laden.
   G=unpackIsland(packed,WORLD.board);WORLD.islands[activeIsland]=G;G.speed=0;saveGame();
   if(!loadGame())throw Error('Speicherstand nicht geladen');G.speed=0;
   const restored=G.byId.get(90003);restored.conn=true;advanceDeliveries(20);
   if(restored.inputStock.holz!==1||G.stock.holz!==0)throw Error('Lieferung beim Laden verloren/verdoppelt');
   UI.sel=restored.id;const info=infoHTML();if(!info.includes('Waren im Betrieb'))throw Error('Betriebsvorrat nicht sichtbar');
   restored.inputStock.holz=3;saveGame();loadGame();G.speed=0;
   if(G.byId.get(90003).inputStock.holz!==3)throw Error('Betriebsvorrat nicht gespeichert');
   for(const b of G.blds)b.paused=true;
   const farm=add(90005,'farm',ox+8,oy+5);G.dirty=false;G.stock.getreide=0;G.carts=[];
   const fert=B.farm.fertility;if(fert&&!islandMeta().fert.includes(fert))islandMeta().fert.push(fert);
   if(B.farm.cycle!==60||B.farm.out.getreide!==1)throw Error('Falsche Bauernhof-Grundwerte');
   for(let i=0;i<118;i++)workforceStep(.5);
   if(G.stock.getreide!==0)throw Error('Bauernhof produziert vor einer Minute');
   workforceStep(.5);workforceStep(.5);
   if(G.stock.getreide!==1)throw Error('Bauernhof produziert nicht genau eins pro Minute');
   farm.eff=.5;farm.prog=0;for(let i=0;i<120;i++)workforceStep(.5);
   if(G.stock.getreide!==1)throw Error('Halb besetzter Bauernhof produziert zu schnell');
   for(let i=0;i<120;i++)workforceStep(.5);
   if(G.stock.getreide!==2)throw Error('Halb besetzter Bauernhof produziert nicht alle zwei Minuten');
   return {directLength,producedBoards:1,localStock:3,farmCycle:60,checks:18};
  }''')
  print(filename,result,'ERRORS',errors);assert not errors
  page.close()
 browser.close()
