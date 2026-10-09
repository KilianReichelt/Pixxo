from playwright.sync_api import sync_playwright
from pathlib import Path
import json
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    page=b.new_page(viewport={'width':1440,'height':1000});errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((Path(__file__).resolve().parent.parent/'pixxo.html').as_uri());page.wait_for_timeout(200)
    page.evaluate('newGame(1234);resetWorld();G.speed=0;afterNewWorld();G.gold=100000;for(const k in G.stock)G.stock[k]=70')
    # Kontor, Ausbau, freies Versetzen und belegte Ziele.
    out=page.evaluate('''() => {let k;for(let y=10;y<100&&!k;y++)for(let x=10;x<100;x++)if(canPlace('kontor',x,y).ok){k=place('kontor',x,y).b;break}grantStart();G.ship=null;const houses=[];for(let y=10;y<100&&houses.length<6;y++)for(let x=10;x<100&&houses.length<6;x++)if(canPlace('haus',x,y).ok)houses.push(place('haus',x,y).b);houses.forEach(h=>h.pop=4);const before=capOf();upgradePort(k);const after=capOf();const h=houses[0],old={x:h.x,y:h.y},money=G.gold,stock=JSON.stringify(G.stock);let dest;for(let y=0;y<MAPH&&!dest;y++)for(let x=0;x<MAPW;x++)if(Math.hypot(x-h.x,y-h.y)>4&&canMoveBuilding(h,x,y).ok){dest={x,y};break}const moved=moveBuilding(h,dest.x,dest.y);const unchanged=G.gold===money&&JSON.stringify(G.stock)===stock;const occupied=canMoveBuilding(h,houses[1].x,houses[1].y).ok;h.tier=3;h.pop=14;WORLD.highestTier=3;downgradeHouse(h);const down={tier:h.tier,pop:h.pop};return {before,after,moved:moved.ok,unchanged,occupied,down,old,new:{x:h.x,y:h.y},id:h.id}}''')
    print('MOVE PORT DOWNGRADE',out)
    assert out['before']==75 and out['after']==150 and out['moved'] and out['unchanged'] and not out['occupied']
    assert out['down']=={'tier':2,'pop':8}
    # Tatsächliche Tastaturaktion: Verschiebewerkzeug öffnen, Vorschau bewegen, abbrechen.
    page.evaluate(f"UI.sel={out['id']};openWin_info()")
    page.get_by_role('button',name='Verschieben',exact=True).click()
    page.keyboard.press('ArrowRight');page.keyboard.press('Escape')
    assert page.evaluate('UI.tool') is None
    page.evaluate(f"UI.sel={out['id']};openWin_info()")
    page.get_by_role('button',name='Zurückstufen',exact=True).click()
    assert page.evaluate(f'G.byId.get({out["id"]}).tier')==1
    # Freischaltung von Aufträgen und Bevölkerung.
    unlock=page.evaluate("G.quests={};WORLD.highestTier=1;({quests:questHTML(),pop:popHTML()})")
    assert 'Handelsmetropole' not in unlock['quests'] and 'Bürger' not in unlock['pop'] and 'Patrizier' not in unlock['pop']
    print('UNLOCK OK')
    # Begrenzte Lager und pausierte Routen bewahren Ladung.
    page.evaluate('establishIsland(1);G.stock.holz=70;WORLD.islands[1].stock.holz=75;WORLD.fleet=[{id:90,type:"schooner",name:"Prüfschiff",at:0,route:91,buildLeft:0,cargo:[],phase:"load",remaining:0}];WORLD.routes=[{id:91,name:"Test",ship:90,from:0,to:1,out:[{good:"holz",qty:50}],back:[],reserve:10,paused:false}];')
    full=page.evaluate('''() => {for(let t=0;t<180;t++)stepWorld(1);return {source:G.stock.holz,dest:WORLD.islands[1].stock.holz,cargo:WORLD.fleet[0].cargo,status:WORLD.fleet[0].status}}''')
    print('FULL STORAGE',full);assert full['source']==20 and full['dest']==75 and full['cargo'][0]['qty']==50
    recovered=page.evaluate('''() => {WORLD.routes[0].paused=true;WORLD.islands[1].stock.holz=20;for(let t=0;t<40;t++)stepWorld(1);return {dest:WORLD.islands[1].stock.holz,cargo:WORLD.fleet[0].cargo,phase:WORLD.fleet[0].phase}}''')
    assert recovered['dest']==70 and recovered['cargo']==[]
    print('UNLOAD AND PAUSE OK',recovered)
    # Simulation der Brotkette und Vergleich bedarfsgerechter und zu großer Industrie.
    result=page.evaluate('''() => {
      function fixture(types){newGame(1234);resetWorld();G.dirty=false;G.gotStart=true;G.nextShip=99999;G.nextFire=99999;G.blds=types.map((type,i)=>({id:i+1,type,x:40+i*3,y:40,w:B[type].w,h:B[type].h,tier:1,pop:type==='haus'?4:0,paused:false,prog:0,conn:true,eff:1,fire:0,need:{},sat:{},cov:{markt:true},age:0}));G.stock.fisch=70;G.stock.getreide=0;G.stock.mehl=0;G.stock.brot=0;}
      fixture(['kontor','farm','farm','muehle','baeckerei','baeckerei']);for(let t=0;t<3000;t++)step(.1);const bread={grain:G.cnt.prod.getreide,flour:G.cnt.prod.mehl,bread:G.cnt.prod.brot};
      fixture(['kontor','markt','fischer','holzfaeller','saegewerk',...Array(20).fill('haus')]);for(let t=0;t<6000;t++)step(.1);const lean={tax:G.cnt.tax,upkeep:G.cnt.upk,net:(G.cnt.tax-G.cnt.upk)/10};
      fixture(['kontor','markt','fischer','holzfaeller','saegewerk',...Array(20).fill('haus'),...Array(10).fill('schmiede')]);for(let t=0;t<6000;t++)step(.1);const overbuilt={net:(G.cnt.tax-G.cnt.upk)/10};return {bread,lean,overbuilt};}''')
    print('SIMULATION',result)
    assert result['bread']['bread']>=6 and result['bread']['flour']>result['bread']['bread']
    assert result['lean']['net']>0 and result['overbuilt']['net']<0
    # Fixe Abbauplätze sind nach dem Speichern unverändert und außerhalb nicht baubar.
    nodes=page.evaluate('''() => {newGame(1234);resetWorld();G.speed=0;afterNewWorld();G.gold=100000;for(const k in G.stock)G.stock[k]=70;for(let i=1;i<ISLANDS.length;i++)establishIsland(i);const counts=WORLD.islands.map(g=>({iron:g.deposits.filter(n=>n.type==='mine').length,stone:g.deposits.filter(n=>n.type==='steinbruch').length}));const blocked=canPlace('mine',50,50).ok;const before=JSON.stringify(WORLD.islands.map(g=>g.deposits));saveGame();loadGame();return {counts,blocked,same:before===JSON.stringify(WORLD.islands.map(g=>g.deposits))}}''')
    print('DEPOSITS',nodes)
    assert nodes['same'] and not nodes['blocked'] and nodes['counts'][7]['iron']==0
    # Alten Spielstand im ursprünglichen Format übernehmen.
    migrated=page.evaluate('''() => {const o=packIsland(G);Object.assign(o,{v:2,gold:1234,time:42,stock:{...G.stock,bretter:35}});localStorage.setItem(SAVEKEY,JSON.stringify(o));const ok=loadGame();return {ok,gold:G.gold,time:G.time,planks:G.stock.bretter,islands:WORLD.islands.length}}''')
    assert migrated=={'ok':True,'gold':1234,'time':42,'planks':35,'islands':12}
    print('LEGACY SAVE OK')
    print('FONT',page.evaluate("({family:getComputedStyle(document.body).fontFamily,loaded:document.fonts.check('16px LowresPixel')})"))
    # Automatisierte Prüfung von Größe, Namen und Fokusfähigkeit der sichtbaren Bedienelemente.
    page.evaluate('for(const id in WINS)closeWin(id);renderTop(true);openWin_world()')
    a11y=page.evaluate('''() => {const buttons=Array.from(document.querySelectorAll('button')).filter(e=>e.getClientRects().length);return {small:buttons.filter(e=>{const r=e.getBoundingClientRect();return r.width<43.9||r.height<43.9}).map(e=>e.innerText),unnamed:buttons.filter(e=>!e.innerText.trim()&&!e.getAttribute('aria-label')&&!e.title).length,font:Math.min(...Array.from(document.querySelectorAll('button,p,span,h3')).filter(e=>e.getClientRects().length&&!e.closest('.sr-only')).map(e=>parseFloat(getComputedStyle(e).fontSize)))}}''')
    print('ACCESSIBILITY',a11y);assert not a11y['small'] and not a11y['unnamed'] and a11y['font']>=14
    for width in [1440,768,390,320]:
        page.set_viewport_size({'width':width,'height':900});page.screenshot(path=f'pixxo-final-{width}.png')
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    print('ERRORS',errors);assert not errors
    b.close()
