from pathlib import Path
from playwright.sync_api import sync_playwright
import json
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    pg=b.new_page(viewport={'width':1440,'height':1000});errors=[]
    pg.on('pageerror',lambda e:errors.append(str(e)))
    pg.goto((Path(__file__).resolve().parent.parent/'pixxo.html').as_uri());pg.wait_for_timeout(500)
    pg.evaluate("startNew()")
    start=pg.evaluate('({w:MAPW,h:MAPH,count:ISLANDS.length,start:activeIsland,ports:G.blds.filter(b=>b.type==="kontor").length,stock:G.stock.bretter,fert:ISLANDS.map(m=>m.fert.length),name:ISLANDS.map((m,i)=>islandName(i)),tutorial:!!WINS.tutorial,pixels:land.parts.reduce((n,p)=>n+p.image.width*p.image.height,0)})')
    print('START',json.dumps(start,ensure_ascii=False));assert start['w']==896 and start['h']==672 and start['count']==22 and start['ports']==1 and start['stock']==20 and min(start['fert'])>=2 and start['tutorial']
    assert start['name'].count('Unentdeckt')==21
    assert pg.evaluate('G.quests.q1')
    assert pg.locator('#sidebar .sidegroup h2').all_text_contents()==['Aufträge','Ereignisse']
    assert pg.locator('#sidebar #quest').count()==1 and pg.locator('#sidebar #toasts').count()==1
    assert pg.locator('.speeds .tb').count()==2
    pg.evaluate('setSpeed(1)')
    for speed in [2,4,1]:
        pg.locator('.speeds .tb').nth(1).click();assert pg.evaluate('G.speed')==speed
    assert pg.locator('.speeds .tb').nth(1).get_attribute('aria-label')=='Normal'
    pg.get_by_role('button',name='Pause',exact=True).click();assert pg.evaluate('G.speed')==0
    pg.get_by_role('button',name='Pause',exact=True).click();assert pg.evaluate('G.speed')==1
    assert pg.locator('#sidebar').bounding_box()['width']==64
    assert pg.locator('#sidebar').evaluate('e=>Math.abs(e.getBoundingClientRect().top+e.offsetHeight/2-innerHeight/2)')<1
    assert pg.evaluate('getComputedStyle($("#sidebar")).backgroundImage===getComputedStyle($("#bar")).backgroundImage')
    assert not pg.locator('.sidepanel').is_visible()
    pg.locator('[data-side="quest"]').click();assert pg.locator('#side-quest').is_visible() and not pg.locator('#side-events').is_visible()
    pg.locator('[data-side="events"]').click();assert pg.locator('#side-events').is_visible() and not pg.locator('#side-quest').is_visible()
    pg.locator('[data-side="events"]').click();assert not pg.locator('.sidepanel').is_visible()
    pg.get_by_role('button',name="Los geht's",exact=True).click();assert pg.evaluate('WORLD.tutorial.step')==1
    pg.get_by_role('button',name='Tutorial schließen',exact=True).click()
    pg.evaluate("G.speed=0;UI.cat='roh';renderBar();renderItems(true);renderIslandFacts()")
    cards=pg.locator('#items .bi').evaluate_all('(els)=>els.map(e=>({h:e.offsetHeight,scroll:e.scrollHeight,client:e.clientHeight}))')
    print('CARDS',cards);assert all(c['h']==156 and c['scroll']<=c['client'] for c in cards)
    facts=pg.evaluate('''() => {const mm=$('#mmw').getBoundingClientRect(),f=$('#islandfacts').getBoundingClientRect(),tools=$('.maptools').getBoundingClientRect();return {flush:Math.abs(f.bottom-mm.top),width:mm.width,toolsLeft:tools.right<mm.left,fertNums:document.querySelectorAll('.factitem[title*="Fruchtbarkeit"] b').length,world:document.querySelectorAll('[data-w="world"]').length}}''')
    print('LAYOUT',facts);assert facts['flush']<1 and facts['width']==224 and facts['toolsLeft'] and facts['fertNums']==0 and facts['world']==0
    pg.screenshot(path=str(Path(__file__).parent/'pixxo-expansion-cards.png'))
    pg.evaluate("UI.cat='wohnen';renderBar();renderItems(true)")
    assert pg.locator('#items').bounding_box()['width']<220
    # Manuelle Fahrt, tatsächliche Ladung und Gründung am Standort des Schiffs.
    result=pg.evaluate('''() => {const home=activeIsland;const sh={id:WORLD.nextId++,type:'schooner',name:'Pionier',at:home,route:null,buildLeft:0,cargo:[],status:'Im Hafen'};WORLD.fleet.push(sh);G.gold=10000;G.stock.bretter=40;G.stock.werkzeug=20;
      const load1=transferShip(sh,'bretter',10,true),load2=transferShip(sh,'werkzeug',8,true);let dest,water;
      for(let i=0;i<ISLANDS.length&&dest===undefined;i++){if(i===home)continue;for(const beach of ISLANDS[i].beaches){for(let y=beach.y-5;y<beach.y+8&&!water;y++)for(let x=beach.x-5;x<beach.x+8;x++){if(INMAP(x,y)&&G.tiles[IDX(x,y)]<=T.SHAL){sh.anchor={x:x+.5,y:y+.5};if(foundingSite(i,sh)){dest=i;water={x,y};break}}}if(water)break}}
      delete sh.anchor;const before=colonize(dest,sh.id),sail=sailShip(sh,water.x,water.y);const len=sh.manualTrip?.path.length;UI.selectedShip=sh.id;drawMini();stepFleet(9999);const near=!!foundingSite(dest,sh),gold=G.gold,found=colonize(dest,sh.id),g=WORLD.islands[dest],port=g?.blds.find(b=>b.type==='kontor');return {load1,load2,before,sail,len,near,found,cargo:sh.cargo,goldSpent:gold-G.gold,dest,name:islandName(dest),stock:g?.stock.bretter,port,position:freeShipPosition(sh)}}''')
    print('FOUNDING',json.dumps(result,ensure_ascii=False));assert result['load1'] is True and result['load2'] is True and result['before'] is not True and result['sail'] is True and result['near'] and result['found'] is True and result['goldSpent']==800 and result['cargo']==[] and result['stock']==0
    assert result['name']!='Unentdeckt'
    # Bedienung über das echte Schiffsfenster, nicht nur über Simulationsfunktionen.
    pg.evaluate('selectShip(WORLD.fleet[0].id)')
    pg.get_by_role('button',name='Fahrtziel wählen',exact=True).click()
    assert pg.evaluate('UI.tool')=='sail'
    pg.locator('#hint [data-act="cancel"]').click();assert pg.evaluate('UI.tool') is None
    fog=pg.evaluate('''() => {const sh=WORLD.fleet[0],i=ISLANDS.findIndex((m,i)=>!WORLD.fog.islands[i]),m=ISLANDS[i];sh.anchor={x:m.wx+Math.min(55,m.size*56)+12,y:m.wy};updateFog(1);const fade=fogFades.has(i);UI.vt+=2;prepareFog();const c=fogCanvas.getContext('2d'),cx=Math.floor(m.wx),cy=Math.floor(m.wy);return {revealed:WORLD.fog.islands[i],fade,centerAlpha:c.getImageData(cx,cy,1,1).data[3],borderAlpha:c.getImageData(0,0,1,1).data[3],light:c.getImageData(0,0,1,1).data[0],width:fogCanvas.width,variants:SHIP_SPRITES.schooner.length,unique:new Set(SHIP_SPRITES.schooner.map(c=>c.toDataURL())).size,headings:Array.from({length:8},(_,i)=>headingForPath([[0,0],[Math.cos(i*Math.PI/4),Math.sin(i*Math.PI/4)]],0))}}''')
    print('FOG AND DIRECTIONS',fog);assert fog['revealed'] and fog['fade'] and fog['centerAlpha']==0 and fog['borderAlpha']==255 and fog['variants']==8 and fog['unique']==8 and fog['headings']==list(range(8))
    assert fog['light']>=180 and fog['width']==896
    pg.evaluate("UI.selectedShip=null;UI.cat=null;renderBar();centerOn(MAPW/2,MAPH/2);UI.z=.0625;UI.sc=UI.z*UI.DR;saveGame()")
    layout=pg.evaluate('ISLANDS.map(m=>[m.ox,m.oy])');pg.screenshot(path=str(Path(__file__).parent/'pixxo-expansion-world.png'))
    pg.evaluate('WORLD.fog.islands.fill(true);fogDirty=true;prepareFog()');pg.screenshot(path=str(Path(__file__).parent/'pixxo-expansion-world-uncovered.png'))
    pg.reload();pg.wait_for_timeout(300);assert pg.evaluate('ISLANDS.map(m=>[m.ox,m.oy])')==layout
    assert pg.evaluate('WORLD.islands.filter(Boolean).length')==2
    assert pg.evaluate('WORLD.islands.filter(Boolean).every(g=>g.tiles===G.tiles&&g.byId===G.byId)')
    layouts=[]
    for seed in [1234,55172,975321]:
        data=pg.evaluate('''seed=>{activeIsland=0;newGame(seed);resetWorld();G.speed=0;afterNewWorld();return {coords:ISLANDS.map(m=>[m.ox,m.oy]),beaches:ISLANDS.map(m=>m.beaches.length),deposits:ISLANDS.map((m,i)=>unsettledDeposits(i).length)}}''',seed)
        print('SEED',seed,data);assert all(n>=1 for n in data['beaches']);layouts.append(data['coords'])
        assert len(set(x for x,y in data['coords']))>17 and len(set(y for x,y in data['coords']))>17
    assert layouts[0]!=layouts[1]!=layouts[2]
    workers=pg.evaluate('''() => {const saved=G.blds;const house={type:'haus',tier:1,pop:4},a={type:'holzfaeller',envEff:1},b={type:'saegewerk',envEff:1},c={type:'fischer',envEff:1};G.blds=[house,a,b,c];const scarce=assignWorkforce(G),eff=a.eff;b.paused=true;const paused=assignWorkforce(G),pausedEff=a.eff;G.blds.push({type:'haus',tier:2,pop:100});const separate=assignWorkforce(G);house.pop=0;const empty=assignWorkforce(G);G.blds=saved;return {demand:scarce.demand[1],free:scarce.free[1],eff,pausedDemand:paused.demand[1],pausedEff,separateSupply:separate.supply[1],empty:empty.ratio[1]}}''')
    print('WORKFORCE',workers);assert workers['demand']==12 and workers['free']==-8 and abs(workers['eff']-1/3)<.001 and workers['pausedDemand']==8 and workers['pausedEff']==.5 and workers['separateSupply']==4 and workers['empty']==0
    slowdown=pg.evaluate('''() => {const saved=G.blds,stock={...G.stock},port={type:'kontor',tier:1,conn:true,fire:0};const house={type:'haus',tier:1,pop:4,conn:true,cov:{markt:true},need:{},sat:{},fire:0};const mill={type:'saegewerk',conn:true,paused:false,fire:0,prog:0,eff:1,envEff:1};const wood={type:'holzfaeller',conn:false,envEff:1,fire:0};G.blds=[port,house,mill,wood];G.dirty=false;G.stock.holz=50;G.stock.bretter=0;assignWorkforce(G);workforceStep(15);const partial=mill.prog;G.blds.push({...house,need:{},sat:{},pop:4});assignWorkforce(G);workforceStep(15);const output=G.stock.bretter;G.blds=saved;G.stock=stock;return {partial,output}}''')
    print('PRODUCTION SPEED',slowdown);assert abs(slowdown['partial']-.5)<.001 and slowdown['output']==1
    pg.evaluate("G.blds.push({type:'haus',tier:1,pop:1000});UI.cat='roh';WORLD.highestTier=2;renderBar();renderItems(true)")
    pg.evaluate("UI.cat='roh';WORLD.highestTier=2;renderBar();renderItems(true)")
    assert all('/Min.' not in t for t in pg.locator('#items .sz').all_text_contents())
    assert pg.locator('[data-b="holzfaeller"] .sz').inner_text().endswith('4')
    assert pg.locator('#items .sz').evaluate_all('(els)=>els.every(e=>getComputedStyle(e).textAlign==="center")')
    # Auch ohne Vorkommen werden keine leeren Bergbau-Icons gezeigt.
    pg.evaluate('UI.viewedIsland=activeIsland;G.deposits=[];renderIslandFacts()')
    assert pg.locator('.factitem[title*="Abbauplätzen"]').count()==0
    pg.set_viewport_size({'width':390,'height':844});pg.wait_for_timeout(200)
    assert pg.evaluate('document.documentElement.scrollWidth<=innerWidth')
    buttons=pg.locator('.maptools button').evaluate_all('(els)=>els.map(e=>({w:e.offsetWidth,h:e.offsetHeight}))');assert all(e['w']==28 and e['h']==28 for e in buttons)
    pg.locator('[data-minizoom="plus"]').click();assert pg.evaluate('UI.mmZoom')==1
    pg.locator('[data-minizoom="minus"]').click();assert pg.evaluate('UI.mmZoom')==0
    pg.evaluate('G.speed=0;setTool("road");window.testCam={...UI.cam}')
    pg.keyboard.press('ArrowRight');pg.keyboard.press('x');pg.keyboard.press('Escape')
    assert pg.evaluate('UI.tool==="road"&&UI.cam.x===window.testCam.x&&UI.cam.y===window.testCam.y')
    pg.locator('#hint [data-act="cancel"]').click()
    assert pg.locator('.factsummary').evaluate('e=>getComputedStyle(e).minHeight')=='30px'
    assert pg.locator('.factsummary').evaluate('e=>e.offsetHeight')==30
    assert pg.locator('#barToggle').evaluate('e=>parseFloat(getComputedStyle(e).bottom)')==8
    assert pg.get_by_role('button',name='Warenleiste anpassen',exact=True).inner_text()=='+'
    pg.screenshot(path=str(Path(__file__).parent/'pixxo-expansion-mobile.png'))
    print('ERRORS',errors);assert not errors
    b.close()
