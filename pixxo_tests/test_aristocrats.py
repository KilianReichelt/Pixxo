"""Production, service coverage, fourth-tier upgrades and disabled civic projects."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True,args=['--allow-file-access-from-files'])
    page=browser.new_page(viewport={'width':1440,'height':1000})
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((root/'pixxo.html').as_uri());page.wait_for_function('StartScreen.ready')
    page.locator('[data-start=new]').click();page.wait_for_function('StartScreen.started&&!StartScreen.loading')
    page.evaluate('tutorialFinish();setSpeed(0)')
    print(page.evaluate("""()=>{
      const check=(ok,text)=>{if(!ok)throw Error(text);};window.civicCheck=check;
      check(TIERS.length===5&&TIERS[4].n==='Aristokraten','Fourth tier absent');
      check(B.rathaus.w===8&&B.rathaus.h===8&&B.ausstellungspalast.w===12&&B.ausstellungspalast.h===10,'Project geometry scaled incorrectly');
      WORLD.highestTier=1;check(unlocked('brunnen')&&!unlocked('garten')&&!unlocked('gemeinschaftshaus'),'Settler unlocks');
      WORLD.highestTier=2;check(unlocked('garten')&&unlocked('gemeinschaftshaus')&&!unlocked('betonwerk'),'Citizen unlocks / first patrician upgrade');
      for(const type of ['blumenhof','sandgrube','kalkbrennerei','glashuette'])check(unlocked(type)&&B[type].workforce.tier===2&&buildingPopulationTier(type)===2,'Citizen soap supplier '+type);
      for(const good of ['blueten','sand','kalk','glas'])check(goodVisibleInStore(good),'Hidden citizen ingredient '+good);
      check(TIERS[2].luxury.moebel&&B.tischlerei.in.werkzeug===.25,'Citizen furniture/tool wear');
      check(JSON.stringify(B.seifensiederei.in)===JSON.stringify({blueten:1,gewuerz:1,glas:1}),'Soap recipe');
      WORLD.highestTier=3;check(unlocked('gemeinschaftshaus')&&unlocked('betonwerk')&&!unlocked('ausstellungspalast'),'Patrician bootstrap');
      for(const tier of TIERS.filter(Boolean)){const b={tier:tier.id},needs=pixxoHouseNeeds(b);check([...needs.services,...needs.goods].every(n=>Number.isInteger(pixxoResidentsForNeed(b,n))&&pixxoResidentsForNeed(b,n)>0),'Fractional residents');}
      check(!TIERS[1].svc.includes('brunnen')&&TIERS[3].svc.includes('gemeinschaft'),'Housing needs wrong');
      check(CIVIC_CHAINS.every(c=>!B[c[0]].fertility),'Unexpected unsatisfied fertility requirement');
      const meta=ISLANDS[activeIsland],x=Math.floor(meta.wx)-38,y=Math.floor(meta.wy)+8;window.civicFixture={x,y};G.gold=1000000;
      for(const good of GOODS)G.stock[good.id]=1000;
      G.deposits=G.deposits.filter(d=>d.x<x-2||d.x>x+82||d.y<y-28||d.y>y+18);
      for(let yy=y-28;yy<y+18;yy++)for(let xx=x-2;xx<x+82;xx++)if(!G.occ[IDX(xx,yy)]){G.tiles[IDX(xx,yy)]=T.GRASS;if(G.river)G.river[IDX(xx,yy)]=0;islandOwners[IDX(xx,yy)]=activeIsland;}
      if(G.riverCells){const kept=G.riverCells.filter(k=>G.river[k]);G.riverCells.splice(0,G.riverCells.length,...kept);}
      WORLD.highestTier=4;for(const type in B)G.quests['u_'+type]=true;
      const build=(type,xx,yy)=>{const r=place(type,xx,yy);check(r.ok,type+': '+r.why);return r.b;};
      window.civicBuild=build;
      const wh=build('lager',x,y-B.lager.h),garden=build('garten',x+45,y-B.garten.h),community=build('gemeinschaftshaus',x+52,y-B.gemeinschaftshaus.h),well=build('brunnen',x+59,y-B.brunnen.h),factory=build('betonwerk',x+64,y-B.betonwerk.h);
      window.civicFactory=factory;window.civicGarden=garden;window.civicWell=well;
      const homes=[];for(let i=0;i<12;i++){const b=build('haus',x+2+i*5,y+1);b.tier=i<3?2:i<6?3:4;b.pop=TIERS[b.tier].cap;homes.push(b);}window.civicHomes=homes;
      for(let xx=x;xx<x+76;xx++)check(placeRoad(xx,y),'Road placement');
      G.dirty=true;rebuildNet();check(factory.conn,'Factory road connection');
      check(homes.some(b=>b.cov.garten)&&homes.some(b=>b.cov.gemeinschaft),'New service coverage');
      check(civicWellCovered(factory),'Well does not protect nearby factory');
      const b=homes[0],oldCov=b.cov;b.cov={...oldCov,garten:true};const lower=houseRates(b);b.cov={...oldCov,garten:false};const normal=houseRates(b);b.cov=oldCov;
      for(const g of ['brot','honig','most'])if(normal[g])check(Math.abs(lower[g]/normal[g]-.85)<1e-9,'Garden rate '+g);check(lower.kartoffeln===normal.kartoffeln,'Garden alters potatoes');

      check(!CIVIC_PROJECTS_ENABLED&&!unlocked('rathaus')&&!unlocked('ausstellungspalast'),'Grand projects offered');
      check(!canPlace('rathaus',x+10,y-8).ok&&!canPlace('ausstellungspalast',x+28,y-10).ok,'Disabled project can be built');
      check(civicProjects().length===0&&civicEffects().production===1&&civicEffects().tax===1,'Disabled project effects');
      return {chains:CIVIC_CHAINS.length,services:'garden, community, well',grandProjects:'disabled'};
    }"""))
    print(page.evaluate("""()=>{const check=civicCheck;
      civicBuild('lager',civicFixture.x+70,civicFixture.y-B.lager.h);G.dirty=true;rebuildNet();
      const factory=civicFactory,originalType=factory.type;
      for(const [type] of CIVIC_CHAINS){factory.type=type;const d=B[type];factory.inputStock=Object.fromEntries(Object.entries(d.in).map(([g,n])=>[g,n*2]));for(const g of Object.keys(d.out))G.stock[g]=0;factory.prog=.999;assignWorkforce(G);const before={...G.cnt.prod};step(1);for(const [g,n] of Object.entries(d.out))check((G.cnt.prod[g]||0)-(before[g]||0)===n,'Production cycle failed: '+type+' ('+factory.status+')');for(const [g,n] of Object.entries(d.in))check(factory.inputStock[g]===n,'Input consumption failed: '+type);}
      for(const type of ['tischlerei','seifensiederei','kelterei','parfuemerie']){
        factory.type=type;const d=B[type];assignWorkforce(G);
        const toolBefore=G.cnt.cons.werkzeug||0;
        for(let cycle=0;cycle<4;cycle++){
          factory.inputStock=Object.fromEntries(Object.entries(d.in).map(([g,n])=>[g,n*2]));for(const g of Object.keys(d.out))G.stock[g]=0;
          factory.prog=.999;const before={...G.cnt.prod};step(1);
          for(const [g,n] of Object.entries(d.out))check((G.cnt.prod[g]||0)-(before[g]||0)===n,'Extended recipe output '+type+' '+factory.status);
          for(const [g,n] of Object.entries(d.in))check(Math.abs(factory.inputStock[g]-n)<1e-8,'Extended recipe input '+type+'/'+g);
        }
        if(type==='tischlerei')check(Math.abs((G.cnt.cons.werkzeug||0)-toolBefore-1)<1e-8,'One tool per four furniture');
        // Each additional input must block real production when unavailable.
        for(const missing of Object.keys(d.in)){
          G.carts=[];factory.inputStock=Object.fromEntries(Object.entries(d.in).map(([g,n])=>[g,g===missing?0:n*2]));factory.prog=.999;
          const before={...G.cnt.prod};step(.1);for(const g of Object.keys(d.out))check((G.cnt.prod[g]||0)===(before[g]||0),'Recipe ignores missing '+type+'/'+missing);
        }
      }
      factory.type=originalType;for(const [g,n] of Object.entries(UPG[4]))if(g!=='gold')G.stock[g]=Math.max(G.stock[g]||0,n);G.dirty=true;rebuildNet();
      const home=civicHomes[0];home.tier=3;home.pop=TIERS[3].cap;home.cov={markt:true,kirche:true,gemeinschaft:true};home.conn=true;home.supplyTime=30;for(const g of Object.keys(TIERS[4].goods))home.sat[g]=true;check(nextTierReq(home).ok,'Cannot upgrade to Aristocrats');check(upgradeHouse(home)===true&&home.tier===4,'Upgrade fails');check(nextTierReq(home)===null,'Fifth tier offered');
      check(Number.isFinite(popByTier()[4])&&popHTML().includes('Aristokraten'),'Fourth tier UI counting');

      check(saveGame()===true,'Save failed');return {upgrade:civicHomes[0].tier,variant:civicHomes[0].variant,production:'all civic chains'};
    }"""))
    page.reload();page.wait_for_function('StartScreen.ready');page.locator('[data-start=continue]').click();page.wait_for_function('StartScreen.started&&!StartScreen.loading')
    assert page.evaluate("G.blds.some(b=>b.type==='haus'&&b.tier===4)&&civicEffects().production===1&&!unlocked('rathaus')")
    assert not errors,errors
    print('PASS: civic production chains, services, fourth-tier upgrade and reload; grand projects excluded.')
    browser.close()
