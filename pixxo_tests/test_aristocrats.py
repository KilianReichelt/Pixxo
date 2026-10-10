"""Isolated browser integration tests for housing, fourth tier and civic projects."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True,args=['--disable-backgrounding-occluded-windows','--allow-file-access-from-files'])
    page=browser.new_page(viewport={'width':1440,'height':1000})
    errors=[]
    page.on('pageerror',lambda e:(errors.append(str(e)),print('JS ERROR:',e)))
    page.goto((root/'pixxo.html').as_uri())
    page.bring_to_front()
    page.wait_for_function('StartScreen.ready')
    page.locator('[data-start=new]').click()
    page.wait_for_function('StartScreen.started')
    page.evaluate('tutorialFinish();setSpeed(0)')
    print(page.evaluate("""()=>{
      const check=(ok,text)=>{if(!ok)throw Error(text);};window.civicCheck=check;
      check(TIERS.length===5&&TIERS[4].n==='Aristokraten','Fourth tier absent');
      check(B.rathaus.w===8&&B.rathaus.h===8&&B.ausstellungspalast.w===12&&B.ausstellungspalast.h===10,'Project geometry scaled incorrectly');
      WORLD.highestTier=1;check(unlocked('brunnen')&&!unlocked('garten')&&!unlocked('gemeinschaftshaus'),'Settler unlocks');
      WORLD.highestTier=2;check(unlocked('garten')&&unlocked('gemeinschaftshaus')&&!unlocked('betonwerk'),'Citizen unlocks / first patrician upgrade');
      WORLD.highestTier=3;check(unlocked('gemeinschaftshaus')&&unlocked('betonwerk')&&!unlocked('ausstellungspalast'),'Patrician bootstrap');
      for(const tier of TIERS.filter(Boolean))check(Number.isInteger(tier.cap/pixxoHouseNeedCount({tier:tier.id})),'Fractional residents');
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
      const wh=build('lager',x,y-B.lager.h),town=build('rathaus',x+10,y-B.rathaus.h),palace=build('ausstellungspalast',x+28,y-B.ausstellungspalast.h),garden=build('garten',x+45,y-B.garten.h),community=build('gemeinschaftshaus',x+52,y-B.gemeinschaftshaus.h),well=build('brunnen',x+59,y-B.brunnen.h),factory=build('betonwerk',x+64,y-B.betonwerk.h);
      window.civicTown=town;window.civicPalace=palace;window.civicFactory=factory;window.civicGarden=garden;window.civicWell=well;
      const homes=[];for(let i=0;i<12;i++){const b=build('haus',x+2+i*5,y+1);b.tier=i<6?3:4;b.pop=TIERS[b.tier].cap;homes.push(b);}window.civicHomes=homes;
      for(let xx=x;xx<x+76;xx++)check(placeRoad(xx,y),'Road placement');
      G.dirty=true;rebuildNet();check(town.conn&&palace.conn&&factory.conn&&civicProjectWarehouses(town).length,'Project road connection');
      check(homes.some(b=>b.cov.garten)&&homes.some(b=>b.cov.gemeinschaft),'New service coverage');
      check(civicWellCovered(factory),'Well does not protect nearby factory');
      const b=homes[0],oldCov=b.cov;b.cov={...oldCov,garten:true};const lower=houseRates(b);b.cov={...oldCov,garten:false};const normal=houseRates(b);b.cov=oldCov;
      for(const g of ['brot','honig','most'])if(normal[g])check(Math.abs(lower[g]/normal[g]-.85)<1e-9,'Garden rate '+g);check(lower.kartoffeln===normal.kartoffeln,'Garden alters potatoes');
      check(!canPlace('rathaus',x+2,y-25).ok,'Duplicate project allowed');
      const before=G.gold;check(civicStartStage(town),'Start phase');check(G.gold===before-CIVIC_PROJECTS.rathaus.stages[0].cost.gold,'Phase gold not paid once');check(!civicStartStage(town)&&G.gold===before-4000,'Gold paid twice');
      const staff=workforceFor(G);check(town.project.workers===40&&staff.construction.reduce((a,b)=>a+b,0)===40,'Construction workforce');check(factory.staffEff===1,'Construction steals employed workers');
      civicRequestProjects(2);check(G.carts.some(c=>c.projectCargo&&c.target===town.id),'No material carts');check(Object.keys(town.inputStock||{}).length===0,'Material teleports');
      for(let i=0;i<150&&Object.entries(CIVIC_PROJECTS.rathaus.stages[0].cost).some(([g,n])=>g!=='gold'&&(town.inputStock?.[g]||0)<n);i++){advanceDeliveries(2);civicRequestProjects(2);}
      check(Object.entries(CIVIC_PROJECTS.rathaus.stages[0].cost).every(([g,n])=>g==='gold'||town.inputStock[g]>=n),'Delivery did not complete');
      civicStepProjects(CIVIC_PROJECTS.rathaus.stages[0].seconds/2);check(Math.abs(town.project.progress-.5)<1e-9,'Construction timing');town.paused=true;assignWorkforce(G);check(town.project.workers===0,'Paused construction retains workers');civicStepProjects(CIVIC_PROJECTS.rathaus.stages[0].seconds/2);check(town.project.progress===.5,'Paused construction advances');town.paused=false;assignWorkforce(G);civicStepProjects(CIVIC_PROJECTS.rathaus.stages[0].seconds/2);check(town.project.stage===1&&!town.project.active,'Phase not completed');
      check(civicEffects().tax===1,'Premature island bonus');selectB(town.id);check(!!WINS.project&&!WINS.info,'Own project window missing');
      return {tiers:TIERS.filter(Boolean).map(t=>[t.n,t.cap]),chains:CIVIC_CHAINS.length,phase1:'delivered and built'};
    }"""))
    page.locator('[data-act=project-start]').focus()
    page.keyboard.press('Enter')
    assert page.evaluate('civicTown.project.active')
    assert page.evaluate("packIsland(G).blds.find(b=>b.id===civicTown.id).project.active")
    assert page.locator('[data-act=project-pause]').count()==0
    page.evaluate('winAct("project",{act:"project-pause"})')
    assert page.evaluate('!civicTown.paused&&civicTown.project.active')
    page.locator('.win[data-id=project]').screenshot(path=str(root/'pixxo_tests/project-construction.png'))
    if os.environ.get('PIXXO_AXE_SCRIPT'):
        page.add_script_tag(path=os.environ['PIXXO_AXE_SCRIPT'])
        assert not page.evaluate("""async()=> (await axe.run('.win[data-id="project"]',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>v.id)""")
    page.set_viewport_size({'width':320,'height':1000})
    assert page.evaluate("""()=>{const body=document.querySelector('.win[data-id=project] .wb');return body.scrollWidth<=body.clientWidth+1;}""")
    page.set_viewport_size({'width':1440,'height':1000})
    print(page.evaluate("""()=>{const check=civicCheck,town=civicTown,palace=civicPalace;
      town.paused=false;for(const b of [town,palace]){const d=CIVIC_PROJECTS[b.type];while(b.project.stage<d.stages.length){if(!b.project.active)check(civicStartStage(b),'Cannot start later phase');const s=d.stages[b.project.stage];for(const [g,n] of Object.entries(s.cost))if(g!=='gold'){b.inputStock??={};b.inputStock[g]=n;}assignWorkforce(G);check(b.project.workers===s.workers,'Not enough available builders');civicStepProjects(s.seconds);}}
      assignWorkforce(G);const effects=civicEffects();check(effects.production===1.2&&effects.luxury===.9&&Math.abs(effects.tax-1.2)<1e-9&&effects.upkeep===.9,'Wrong completed effects '+JSON.stringify(effects));
      const eff=civicFactory.eff;assignWorkforce(G);check(Math.abs(civicFactory.eff-eff)<1e-9,'Production multiplier compounds');check(Math.abs(eff-1.2)<1e-9,'Production bonus absent');
      G.dirty=true;rebuildNet();check(Math.abs(civicFactory.eff-1.2)<1e-9,'Production bonus compounds on network rebuild '+civicFactory.eff);
      UI.sel=town.id;winAct('info',{act:'pause'});check(!town.paused,'Project can be paused indirectly');town.conn=false;check(civicEffects().tax===1.1&&civicEffects().upkeep===1,'Disconnected Rathaus still grants bonus');town.conn=true;
      const other={blds:[],byId:new Map(),projectIds:[]};check(civicEffects(other).production===1,'Bonus leaks to other island');
      civicBuild('lager',civicFixture.x+70,civicFixture.y-B.lager.h);G.dirty=true;rebuildNet();
      const factory=civicFactory,originalType=factory.type;
      for(const [type] of CIVIC_CHAINS){factory.type=type;const d=B[type];factory.inputStock=Object.fromEntries(Object.entries(d.in).map(([g,n])=>[g,n*2]));for(const g of Object.keys(d.out))G.stock[g]=0;factory.prog=.999;assignWorkforce(G);const before={...G.cnt.prod};step(1);for(const [g,n] of Object.entries(d.out))check((G.cnt.prod[g]||0)-(before[g]||0)===n,'Production cycle failed: '+type+' ('+factory.status+')');for(const [g,n] of Object.entries(d.in))check(factory.inputStock[g]===n,'Input consumption failed: '+type);}
      factory.type=originalType;for(const [g,n] of Object.entries(UPG[4]))if(g!=='gold')G.stock[g]=Math.max(G.stock[g]||0,n);G.dirty=true;rebuildNet();
      const home=civicHomes[0];home.tier=3;home.pop=TIERS[3].cap;home.cov={markt:true,kirche:true,gemeinschaft:true};home.conn=true;home.supplyTime=30;for(const g of Object.keys(TIERS[4].goods))home.sat[g]=true;check(nextTierReq(home).ok,'Cannot upgrade to Aristocrats');check(upgradeHouse(home)===true&&home.tier===4,'Upgrade fails');check(nextTierReq(home)===null,'Fifth tier offered');
      check(Number.isFinite(popByTier()[4])&&popHTML().includes('Aristokraten'),'Fourth tier UI counting');
      selectB(palace.id);return {completedStages:[town.project.stage,palace.project.stage],effects};}"""))
    page.locator('.win[data-id=project]').screenshot(path=str(root/'pixxo_tests/project-completed.png'))
    if os.environ.get('PIXXO_AXE_SCRIPT'):
        page.add_script_tag(path=os.environ['PIXXO_AXE_SCRIPT'])
        violations=page.evaluate("""async()=> (await axe.run('.win[data-id="project"]',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))""")
        assert not violations,violations
    for width in [320,768,1440]:
        page.set_viewport_size({'width':width,'height':1000})
        dimensions=page.evaluate("""()=>{const w=document.querySelector('.win[data-id=project]'),r=w.getBoundingClientRect(),body=w.querySelector('.wb');return {right:r.right,left:r.left,scroll:body.scrollWidth,client:body.clientWidth,small:[...w.querySelectorAll('p,span,button,td,th,h2,h3')].filter(e=>parseFloat(getComputedStyle(e).fontSize)<14).map(e=>e.outerHTML.slice(0,80))};}""")
        print('Layout:',width,dimensions)
        assert dimensions['right']<=width+1 and dimensions['left']>=0 and dimensions['scroll']<=dimensions['client']+1 and not dimensions['small'],width
    page.set_viewport_size({'width':1440,'height':1000})
    print(page.evaluate("""()=>{const check=civicCheck;const canvas=document.createElement('canvas');canvas.width=1100;canvas.height=820;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#68746d';c.fillRect(0,0,1100,820);c.font='16px sans-serif';c.fillStyle='#fff';
      let i=0;for(const type of CIVIC_ART_TYPES){const a=civicBuildingArt(type,0),colors=new Set(),pixels=a.low.getContext('2d').getImageData(0,0,a.low.width,a.low.height).data;for(let k=0;k<pixels.length;k+=4){check(pixels[k+3]===0||pixels[k+3]===255,'Blurred sprite '+type);if(pixels[k+3])colors.add(pixels.slice(k,k+3).join(','));}check(colors.size>=12,'Sprite lacks detail '+type);const phases=new Set();for(let f=0;f<6;f++)phases.add(civicBuildingArt(type,f,CIVIC_PROJECTS[type]?1:null).low.toDataURL());check(phases.size>=4,'Sprite animation absent '+type);const x=(i%5)*215,y=Math.floor(i/5)*190;nativeDrawImage.call(c,a.low,x+8,y+24,190,155);c.fillText(B[type].n,x+8,y+18);i++;}
      for(let tier=1;tier<=4;tier++){const a=tier===4?civicBuildingArt('haus4'):importedBuilding('haus',tier);nativeDrawImage.call(c,a.low,8+(tier-1)*215,602,160,155);c.fillText(TIERS[tier].n,8+(tier-1)*215,596);}for(let i=0;i<CIVIC_GOODS.length;i++)nativeDrawImage.call(c,civicGoodArt(CIVIC_GOODS[i][0]),8+i*60,775,48,48);nativeDrawImage.call(c,civicGoodArt('i_t4'),660,775,48,48);const img=document.createElement('img');img.id='civic-art-test';img.src=canvas.toDataURL();Object.assign(img.style,{position:'fixed',inset:0,zIndex:999999});document.body.append(img);check(saveGame()===true,'Save fails');return {sprites:CIVIC_ART_TYPES.size+1,icons:CIVIC_GOODS.length+1,save:true};}"""))
    page.locator('#civic-art-test').screenshot(path=str(root/'pixxo_tests/aristocrat-art.png'))
    page.evaluate('document.getElementById("civic-art-test").remove()')
    page.emulate_media(reduced_motion='reduce')
    assert page.evaluate("""()=>{const b=civicPalace,old=G.time;G.time=1;const a=spName(b);G.time=19;const z=spName(b);G.time=old;return a===z;}""")
    page.reload();page.wait_for_function('StartScreen.ready')
    page.locator('[data-start=continue]').click()
    page.wait_for_function('!StartScreen.loading&&StartScreen.started')
    assert page.evaluate("""()=>{const b=G.blds.find(b=>b.type==='ausstellungspalast');return b?.project.stage===5&&civicEffects().production===1.2&&civicClaimed('rathaus')&&civicClaimed('ausstellungspalast')&&G.stock.beton>=0;}""")
    assert not errors,errors
    print('PASS: keyboard, responsive UI, icons, animations, persistent completion/uniqueness and reload.')
    browser.close()
