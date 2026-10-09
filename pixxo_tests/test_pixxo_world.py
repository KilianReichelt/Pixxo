from pathlib import Path
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    pg=b.new_page(viewport={'width':1440,'height':1000});errors=[]
    pg.on('pageerror',lambda e:errors.append(str(e)))
    pg.goto((Path(__file__).resolve().parent.parent/'pixxo.html').as_uri());pg.wait_for_timeout(300)
    pg.evaluate('activeIsland=0;newGame(1234);resetWorld();G.speed=0;afterNewWorld();G.gold=10000;for(const k in G.stock)G.stock[k]=70')
    coast=pg.evaluate('''() => ({w:MAPW,h:MAPH,beaches:ISLANDS.map(m=>m.beaches.length),land:ISLANDS.map(m=>{let n=0;for(let y=m.oy;y<m.oy+112;y++)for(let x=m.ox;x<m.ox+112;x++)if(G.tiles[IDX(x,y)]>=T.SAND)n++;return n})})''')
    print('WORLD',coast);assert coast['w']==448 and all(0<n<=3 for n in coast['beaches']) and all(n>500 for n in coast['land'])
    setup=pg.evaluate('''() => {const s=ISLANDS[0].beaches.find(s=>canPlace('kontor',s.x,s.y).ok);const port=place('kontor',s.x,s.y).b;grantStart();G.ship=null;G.stock.tuch=50;G.quests.u_werft=true;let yard;for(let y=0;y<112&&!yard;y++)for(let x=0;x<112;x++)if(canPlace('werft',x,y).ok){yard=place('werft',x,y).b;break}if(!yard)return {fail:'Werftplatz fehlt'};const starts=ringCells(port).filter(([x,y])=>INMAP(x,y)&&BUILDABLE(G.tiles[IDX(x,y)])&&!G.occ[IDX(x,y)]);const ends=new Set(ringCells(yard).filter(([x,y])=>INMAP(x,y)).map(([x,y])=>IDX(x,y)));const prev=new Map(),q=starts.map(([x,y])=>IDX(x,y));q.forEach(k=>prev.set(k,-1));let last;for(let h=0;h<q.length;h++){const k=q[h];if(ends.has(k)){last=k;break}const x=k%MAPW,y=Math.floor(k/MAPW);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,n=IDX(nx,ny);if(INMAP(nx,ny)&&!prev.has(n)&&BUILDABLE(G.tiles[n])&&!G.occ[n]&&inArea(nx,ny)){prev.set(n,k);q.push(n)}}}for(let k=last;k!==undefined&&k>=0;k=prev.get(k))placeRoad(k%MAPW,Math.floor(k/MAPW));rebuildNet();UI.sel=yard.id;openWin_info();return {yard:yard.id,conn:yard.conn,port:port.id}}''')
    print('REAL SHIPYARD',setup);assert setup['conn']
    pg.get_by_role('button',name='Schoner bauen',exact=True).click()
    pg.evaluate('for(let i=0;i<65;i++)stepWorld(1);for(const id in WINS)closeWin(id);renderTop(true)')
    assert pg.evaluate('WORLD.fleet[0].buildLeft')==0
    pg.get_by_role('button',name='Schiffe & Routen',exact=True).click()
    fleet=pg.get_by_role('dialog',name='Schiffe & Handelsrouten')
    assert fleet.get_by_role('button',name='Schoner bauen').count()==0
    pg.evaluate('for(const id in WINS)closeWin(id)')
    build_h=pg.locator('#bar').bounding_box()['height']
    pg.get_by_role('button',name='Schiffe anzeigen',exact=True).click()
    fleet_h=pg.locator('#bar').bounding_box()['height']
    assert build_h==fleet_h
    pg.locator('[data-select-ship]').first.click()
    assert pg.get_by_role('dialog',name='Schiff',exact=True).count()==1
    pg.locator('#shipname').fill('Seeadler')
    pg.get_by_role('button',name='Name speichern',exact=True).click()
    assert pg.evaluate('WORLD.fleet[0].name')=='Seeadler'
    pg.evaluate('closeWin("ship");for(let i=1;i<12;i++)establishIsland(i)')
    shared=pg.evaluate('WORLD.islands.every(g=>g.tiles===G.tiles&&g.occ===G.occ&&g.road===G.road&&g.byId===G.byId)')
    assert shared
    print('SHARED TERRAIN',shared,'BAR HEIGHTS',build_h,fleet_h)
    pg.evaluate("WORLD.routes=[{id:77,name:'Holzfahrt',from:0,to:1,ship:WORLD.fleet[0].id,out:[{good:'holz',qty:25}],back:[],reserve:10,paused:false}];WORLD.fleet[0].route=77;WORLD.fleet[0].phase='load';WORLD.fleet[0].remaining=0;stepWorld(1);selectShip(WORLD.fleet[0].id)")
    route=pg.evaluate('''() => {const p=routeWaterPath(0,1);return {len:p.length,water:p.every(([x,y])=>G.tiles[IDX(Math.floor(x),Math.floor(y))]<=T.SHAL)}}''')
    assert route['water'];print('SEA ROUTE',route)
    pg.screenshot(path='pixxo-ship-details.png')
    pg.evaluate('closeWin("ship");closeWin("info");centerOn(MAPW/2,MAPH/2);setZoom(.125,innerWidth/2,innerHeight/2);saveGame()')
    pg.screenshot(path='pixxo-shared-world.png')
    pg.reload();pg.wait_for_timeout(300)
    assert pg.evaluate('WORLD.islands.filter(Boolean).length')==12
    assert pg.evaluate('WORLD.islands.every(g=>g.tiles===G.tiles&&g.byId===G.byId)')
    assert pg.evaluate('WORLD.fleet[0].name')=='Seeadler'
    print('SHARED SAVE OK')
    pg.evaluate("G.speed=0;UI.barMode='build';WORLD.highestTier=1;UI.cat='roh';renderBar();renderItems(true)")
    assert pg.locator('[data-b="mine"]').count()==0
    assert pg.locator('[data-b="farm"]').is_disabled()
    pg.evaluate("WORLD.highestTier=2;renderBar();renderItems(true)")
    assert pg.locator('[data-b="mine"]').count()==1 and pg.locator('[data-b="mine"]').is_disabled()
    assert 'Ab 60 Einwohnern' in pg.locator('[data-b="mine"]').get_attribute('aria-label')
    print('BUILDING FILTER AND DISABLED REQUIREMENTS OK')
    print('ERRORS',errors);assert not errors
    b.close()
