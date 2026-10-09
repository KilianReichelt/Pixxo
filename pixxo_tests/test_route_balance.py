from pathlib import Path
import json
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe', headless=True)
    page = browser.new_page(viewport={'width':1440, 'height':1000})
    errors=[]
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto((root/'pixxo.html').as_uri())
    result=page.evaluate('''()=>{
      G.speed=0;for(const id in WINS)closeWin(id);
      const checks=[];const check=(ok,label)=>{if(!ok)throw Error(label);checks.push(label)};
      const originalVoyage=voyageTime;voyageTime=()=>1;
      const home=activeIsland,other=ISLANDS.findIndex((m,i)=>i!==home);
      const stock=()=>Object.fromEntries(GOODS.map(g=>[g.id,0]));
      const a=G,b={...G,stock:stock(),blds:[{type:'kontor',tier:1}],dock:{...G.dock}};
      a.stock=stock();a.blds=[{type:'kontor',tier:1}];WORLD.islands[other]=b;
      const route={id:9000,name:'Prüfroute',from:home,to:other,reserve:10,out:[{good:'bretter',qty:50}],back:[{good:'trauben',qty:50}],paused:false};
      const ship={id:9001,type:'schooner',name:'Prüfschiff',at:other,route:route.id,phase:'unload',remaining:0,cargo:[{good:'bretter',qty:12}],buildLeft:0};
      WORLD.routes=[route];WORLD.fleet=[ship];const cap=islandCap(b);b.stock.bretter=cap;b.stock.trauben=60;
      const total=good=>a.stock[good]+b.stock[good]+WORLD.fleet.reduce((n,s)=>n+s.cargo.filter(c=>c.good===good).reduce((q,c)=>q+c.qty,0),0);
      const before=[total('bretter'),total('trauben')];
      stepFleet(1);check(ship.phase==='load'&&ship.cargo[0].qty===12,'Volles Lager hält die Route nicht an');
      ship.remaining=0;stepFleet(1);check(ship.phase==='travel'&&ship.cargo.length===2,'Restladung und Rückfracht bleiben erhalten');
      ship.remaining=0;stepFleet(1);check(ship.cargo.length===0&&a.stock.bretter===12&&a.stock.trauben===50,'Restladung kommt am Quellhafen an');
      check(before[0]===total('bretter')&&before[1]===total('trauben'),'Warenbilanz bleibt erhalten');
      ship.phase='load';ship.remaining=0;ship.cargo=[];a.stock.bretter=100;stepFleet(1);
      check(ship.cargo.length===0&&a.stock.bretter===100,'Keine Beladung für volle Ziellager');
      b.stock.bretter=cap-35;ship.at=home;ship.phase='load';ship.remaining=0;
      WORLD.fleet.push({...ship,id:9002,phase:'travel',to:other,cargo:[{good:'bretter',qty:20}],remaining:1000});stepFleet(1);
      check(ship.cargo[0].qty===15,'Weitere ankommende Schiffe werden berücksichtigt');
      WORLD.fleet=[ship];b.stock.bretter=0;a.stock.bretter=150;ship.at=home;ship.phase='load';ship.remaining=0;ship.cargo=[];
      route.waitForSpace=true;route.out=[{good:'bretter',qty:50},{good:'bretter',qty:50}];stepFleet(1);
      check(ship.cargo.length===2&&ship.cargo.every(c=>c.qty===50)&&a.stock.bretter===50,'Zwei Frachträume derselben Ware fassen 100 Tonnen');
      route.waitForSpace=true;ship.at=other;ship.phase='unload';ship.remaining=0;ship.cargo=[{good:'bretter',qty:12}];b.stock.bretter=cap;
      stepFleet(1);check(ship.phase==='unload'&&ship.cargo[0].qty===12,'Gewähltes Warten erhält die Ladung');
      b.stock.bretter-=12;ship.remaining=0;stepFleet(1);check(ship.phase==='load'&&ship.cargo.length===0,'Warten endet bei freiem Lagerplatz');
      ship.phase='load';ship.cargo=[];ship.remaining=0;ship.at=home;route.ship=ship.id;delete ship.anchor;
      voyageTime=originalVoyage;routeForm(route.id);
      const form=document.querySelector('#routeform');check(form.elements.waitForSpace.checked,'Routenformular übernimmt die Warteoption');
      check([...form.querySelectorAll('.routecargo')].filter(el=>getComputedStyle(el).display!=='none').length===4,'Schoner zeigt je Richtung nur zwei Frachträume');
      form.elements.waitForSpace.checked=false;saveRoute({target:form,preventDefault(){}});
      check(route.waitForSpace===false,'Routenformular speichert die Warteoption');
      const stored=JSON.parse(localStorage.getItem(SAVEKEY));check(JSON.stringify(stored).includes('waitForSpace'),'Warteoption wird im Spielstand gespeichert');
      check(ADDITIONAL_SUPPLY_RATE===.25&&EXTRA_INCOME_MULTIPLIER===2.5,'Zusatzbedarf und gewünschter Einkommensbonus');
      check(B.kelterei.in.trauben===1,'Kelterei verwendet eine Tonne Trauben');
      return {checks,capacity:cap};
    }''')
    print(json.dumps(result,ensure_ascii=False),'ERRORS',errors)
    assert not errors
    page.evaluate('routeForm(9000)')
    page.locator('[name="waitForSpace"]').scroll_into_view_if_needed()
    page.screenshot(path=str(root/'pixxo_tests'/'pixxo-handelsroute-lageroption.png'))
    browser.close()
