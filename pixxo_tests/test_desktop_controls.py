"""Bridge safety, Deko navigation, custom scrollbars, pins, credits and move cursor."""
import base64
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True,args=['--allow-file-access-from-files'])
 page=browser.new_page(viewport={'width':1920,'height':1080},reduced_motion='reduce')
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto((root/'pixxo.html').as_uri());page.wait_for_function('StartScreen.ready')
 page.locator('[data-start=new]').click();page.wait_for_function('StartScreen.started&&!StartScreen.loading');page.evaluate('tutorialFinish();setSpeed(0)')
 page.locator('#dekoToggle').click();page.wait_for_selector('#bar .deko-viewport')
 assert page.locator('[data-deko-category]').count()==6
 assert page.locator('[data-deko-scroll=right]').is_visible()
 category=page.evaluate('UI.cat')
 page.locator('[data-deko-scroll=right]').click();page.wait_for_function('document.querySelector("#bar .deko-viewport").scrollLeft>0')
 page.locator('#deko-viewport').focus();page.keyboard.press('Home');page.wait_for_function('document.querySelector("#bar .deko-viewport").scrollLeft===0')
 rect=page.locator('#deko-viewport').bounding_box();page.mouse.move(rect['x']+rect['width']*.8,rect['y']+30);page.mouse.down();page.mouse.move(rect['x']+rect['width']*.4,rect['y']+30,steps=8);page.mouse.up()
 assert page.evaluate('document.querySelector("#deko-viewport").scrollLeft>0&&UI.cat===null')
 page.locator('#bar').screenshot(path=str(root/'pixxo_tests/deko-category-navigation.png'))
 page.locator('#deko-viewport').focus();page.keyboard.press('End')
 page.locator('[data-deko-category=fest]').click();assert page.evaluate('UI.cat==="deko_fest"')
 page.evaluate('openWin_menu()');state=page.evaluate('JSON.stringify({cam:UI.cam,z:UI.z,seed:G.seed,started:StartScreen.started})')
 page.locator('[data-act=start-credits]').click();page.wait_for_selector('.win[data-id=credits]')
 assert not page.locator('#pixxo-start').is_visible()
 assert state==page.evaluate('JSON.stringify({cam:UI.cam,z:UI.z,seed:G.seed,started:StartScreen.started})')
 assert 'Kilian Reichelt' in page.locator('.win[data-id=credits]').inner_text()
 assert page.locator('.win[data-id=credits] .wt').evaluate('e=>getComputedStyle(e).cursor===PIXXO_CURSORS.window_move.css')
 assert page.evaluate('PIXXO_CURSORS.window_move.css.endsWith("16 16, move")')
 image=page.evaluate('PIXXO_CURSOR_BASES.window_move.toDataURL()');(root/'assets/cursors/move.png').write_bytes(base64.b64decode(image.split(',')[1]))
 page.locator('.win[data-id=credits]').screenshot(path=str(root/'pixxo_tests/credits-in-game.png'))
 page.evaluate('for(const id in WINS)closeWin(id);WORLD.pins=[...DEFAULT_PINS];openWin_pins()')
 sixth=page.evaluate('GOODS.find(g=>!WORLD.pins.includes(g.id)).id');page.locator('[data-act=pin][data-g="'+sixth+'"]').click()
 assert page.evaluate('WORLD.pins.length===6')
 seventh=page.evaluate('GOODS.find(g=>!WORLD.pins.includes(g.id)).id')
 assert page.locator('[data-act=pin][data-g="'+seventh+'"]').is_disabled()
 page.evaluate('(g)=>winAct("pins",{act:"pin",g})',seventh);assert page.evaluate('WORLD.pins.length===6')
 page.locator('[data-act=pin][data-g="'+sixth+'"]').click();assert page.evaluate('WORLD.pins.length===5')
 assert page.locator('[data-act=pin][data-g="'+seventh+'"]').is_enabled()
 page.wait_for_function('pixelScrollbars.get(WINS.pins.body)?.y.rail.isConnected&&!pixelScrollbars.get(WINS.pins.body).y.rail.hidden')
 thumb=page.locator('.pixxo-scrollbar.vertical:not([hidden]) .pixxo-scroll-thumb').last
 assert thumb.evaluate('e=>getComputedStyle(e.parentElement,"::before").width==="14px"')
 before=page.evaluate('WINS.pins.body.scrollTop');thumb.focus();page.keyboard.press('PageDown');page.wait_for_function('(before)=>WINS.pins.body.scrollTop>before',arg=before)
 thumb.focus();page.keyboard.press('Home');page.wait_for_function('WINS.pins.body.scrollTop===0')
 rect=thumb.bounding_box();page.mouse.move(rect['x']+5,rect['y']+12);page.mouse.down();page.mouse.move(rect['x']+5,rect['y']+112,steps=8);page.mouse.up();assert page.evaluate('WINS.pins.body.scrollTop>0')
 page.locator('.win[data-id=pins]').screenshot(path=str(root/'pixxo_tests/pixel-scrollbar.png'))
 # Legacy pin lists are normalized on load, preserving the first six unique goods.
 page.evaluate('WORLD.pins=GOODS.slice(0,9).map(g=>g.id);saveGame();loadGame();setSpeed(0)')
 assert page.evaluate('WORLD.pins.length===6&&new Set(WORLD.pins).size===6')
 print(page.evaluate(r'''()=>{
 for(const id in WINS)closeWin(id);WORLD.cpuInitialized=true;
 const d=G.blds.find(b=>b.type==='kontor'),x=d.x+15,y=d.y+15;G.gold=100000;for(const g of GOODS)G.stock[g.id]=10000;
 for(let yy=y-3;yy<=y+3;yy++)for(let xx=x-3;xx<x+15;xx++){const k=IDX(xx,yy);G.occ[k]=0;G.road[k]=0;delete G.bridges[k];G.tiles[k]=T.GRASS;G.river[k]=0;islandOwners[k]=activeIsland;}
 const cells=Array.from({length:7},(_,i)=>IDX(x+i,y));for(const k of cells.slice(1,-1)){G.tiles[k]=T.SHAL;G.river[k]=1;}G.riverCells.push(...cells.slice(1,-1));
 G.road[cells[0]]=1;G.road[cells[6]]=1;G.roads=2;PERF_ROADS.delete(G.road);
 window.bridgeFixture={x,y,cells};
 if(commitRoadPlan({path:cells,island:activeIsland,mode:'woodbridge'})!==true)throw Error('Bridge placement');
 if(cells.filter(k=>G.bridges[k]).length!==5||G.bridges[cells[0]]||G.bridges[cells[6]])throw Error('Bridge placed on land');
 if(!G.bridges[cells[1]].cells.every(k=>isRiver(k)&&G.tiles[k]<=T.SHAL))throw Error('Span includes land');
 const before=G.gold;if(demolishAt(x+3,y)!==false||!WINS['area-demolition']||G.gold!==before||!G.bridges[cells[3]])throw Error('Single deletion bypasses confirmation');
 if(areaDemolitionRoadRemovals(pendingAreaDemolition).length!==5)throw Error('Wrong bridge refund');
 return {bridgeWaterTiles:5,refund:5};
 }'''))
 assert 'Holzbrücke' in page.locator('.win[data-id=area-demolition]').inner_text()
 page.locator('.win[data-id=area-demolition]').screenshot(path=str(root/'pixxo_tests/bridge-demolition-confirm.png'))
 page.locator('[data-act=area-demolish-cancel]').click();assert page.evaluate('!!G.bridges[bridgeFixture.cells[3]]')
 page.evaluate(r'''()=>{saveGame();const o=JSON.parse(localStorage.getItem(SAVEKEY)),g=o.islands[activeIsland],cells=bridgeFixture.cells,part=g.bridges[cells[3]];for(const k of cells)g.bridges[k]={...part,cells,part:k===cells[0]||k===cells[6]?'ramp':'deck',wasRoad:k===cells[0]||k===cells[6]};localStorage.setItem(SAVEKEY,JSON.stringify(o));loadGame();setSpeed(0);if(G.bridges[cells[0]]||G.bridges[cells[6]]||!G.bridges[cells[3]].cells.every(k=>isRiver(k)&&G.tiles[k]<=T.SHAL))throw Error('Legacy land bridge migration');}''')
 page.evaluate('setTool("demo");beginConstructionPlan({x:bridgeFixture.x+2,y:bridgeFixture.y});updateConstructionPlan({x:bridgeFixture.x+3,y:bridgeFixture.y});finishConstructionPlan()')
 assert page.locator('.win[data-id=area-demolition]').is_visible()
 assert page.evaluate('bridgeFixture.cells.slice(1,-1).every(k=>!!G.bridges[k]&&G.road[k])')
 gold=page.evaluate('G.gold');page.locator('[data-act=area-demolish-confirm]').click()
 assert page.evaluate('bridgeFixture.cells.every(k=>!G.bridges[k])&&bridgeFixture.cells.slice(1,-1).every(k=>!G.road[k])&&G.road[bridgeFixture.cells[0]]===1&&G.road[bridgeFixture.cells[6]]===1')
 assert page.evaluate('G.gold')==gold+5
 assert not errors,errors
 browser.close()
 print('PASS: Deko arrows/drag/keyboard, in-game credits, custom move cursor, six pins and reload, 14px pixel scrollbars, and confirmed water-only bridge deletion/refund.')
