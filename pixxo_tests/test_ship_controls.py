"""Selection outline, direct sea commands, route overlay and tool cursors."""
import base64
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    page=browser.new_page(viewport={'width':1920,'height':1080},reduced_motion='reduce')
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((root/'pixxo.html').as_uri());page.wait_for_function('StartScreen.ready')
    page.locator('[data-start=new]').click();page.wait_for_function('StartScreen.started');page.evaluate('tutorialFinish();setSpeed(0)')
    page.evaluate("""()=>{WORLD.fleet=[{id:9901,type:'clipper',name:'Seestern',at:activeIsland,cargo:[],phase:'idle',remaining:0,buildLeft:0}];WORLD.routes=[];setTool(null);selectShip(9901);setZoom(2,innerWidth/2,innerHeight/2);centerOn(G.dock.x,G.dock.y);render()}""")
    target=page.evaluate("""()=>{const p=freeShipPosition(WORLD.fleet[0]);for(let r=8;r<45;r++)for(const [dx,dy] of [[r,0],[0,r],[-r,0],[0,-r]]){const x=Math.floor(p.x+dx),y=Math.floor(p.y+dy);if(INMAP(x,y)&&G.tiles[IDX(x,y)]<=T.SHAL&&seaPath(p,{x,y})){const target={x:(((x+.5)*16-UI.cam.x)*UI.sc+cv.width/2)/UI.DR,y:(((y+.5)*16-UI.cam.y)*UI.sc+cv.height/2)/UI.DR};if(document.elementFromPoint(target.x,target.y)===cv)return target;}}throw Error('No water destination');}""")
    page.mouse.move(target['x'],target['y'])
    assert page.evaluate("UI.cursorMode==='buoy'&&getComputedStyle(cv).cursor.includes('data:image/png')")
    page.mouse.click(target['x'],target['y'])
    assert page.evaluate("!!WORLD.fleet[0].manualTrip&&UI.selectedShip===9901&&UI.tool===null")
    # Drawing is tested independently of the background and night tint.
    data=page.evaluate("""()=>{const sh=WORLD.fleet[0],a=document.createElement('canvas');a.width=a.height=600;const c=a.getContext('2d'),p=freeShipPosition(sh);c.setTransform(.5,0,0,.5,300-p.x*8,300-p.y*8);drawSelectedShipRoute(c,sh);const pixels=c.getImageData(0,0,600,600).data;if(!pixels.some((v,i)=>i%4===3&&v))throw Error('No route drawn');const outline=shipOutline(makeDirectionalShip(0,'clipper',0)),native=outline.getContext('2d').getImageData(0,0,68,68).data;if(!native.some((v,i)=>i%4===3&&v===255)||native.some((v,i)=>i%4===3&&v!==0&&v!==255))throw Error('Invalid selection outline');render();return outline.toDataURL()}""")
    (root/'pixxo_tests/ship-selection-outline.png').write_bytes(base64.b64decode(data.split(',')[1]))
    page.screenshot(path=str(root/'pixxo_tests/ship-selection-route.png'))
    for tool in ['upgrade','demo','build','road','move']:
        assert page.evaluate("tool=>{setTool(tool,['build','move'].includes(tool)?'haus':undefined);return UI.cursorMode===(tool==='build'?'default':tool==='road'?'road_'+(UI.roadMode||'path'):tool)&&getComputedStyle(cv).cursor.includes('data:image/png')}",tool)
    page.evaluate('setTool(null)')
    page.evaluate("""()=>{const baseline=PIXXO_CURSORS.default.canvas.getContext('2d').getImageData(0,0,32,32).data;
      for(const mode of ['buoy','upgrade','demo','build','road','move']){const canvas=PIXXO_CURSORS[mode].canvas,pixels=canvas.getContext('2d').getImageData(0,0,32,32).data;if(!pixels.every((v,i)=>v===baseline[i]))throw Error('Changed cursor base: '+mode);if(canvas.width!==64||canvas.height!==48)throw Error('Cursor bounds: '+mode);}
      for(const icon of Object.values(PIXXO_CURSOR_BASES)){if(icon.width!==16||icon.height!==16)throw Error('Base is not native');const pixels=icon.getContext('2d').getImageData(0,0,16,16).data;if(pixels.some((v,i)=>i%4===3&&v!==0&&v!==255))throw Error('Smoothed cursor base');}
    }""")
    separate=page.evaluate("Object.fromEntries(Object.entries(PIXXO_CURSOR_BASES).map(([name,icon])=>[name,icon.toDataURL()]))")
    (root/'assets/cursors').mkdir(exist_ok=True)
    for name,data in separate.items():
        (root/f'assets/cursors/{"cursor" if name=="default" else "pointer"}.png').write_bytes(base64.b64decode(data.split(',')[1]))
    cursors=page.evaluate("""()=>{const a=document.createElement('canvas');a.width=800;a.height=130;const c=a.getContext('2d');c.fillStyle='#657b5e';c.fillRect(0,0,800,130);c.fillStyle='#fff';c.font='14px sans-serif';Object.entries(PIXXO_CURSORS).forEach(([name,value],j)=>{c.fillText(name,j*100+4,18);c.drawImage(value.canvas,j*100+12,38);});return a.toDataURL()}""")
    (root/'pixxo_tests/custom-cursors.png').write_bytes(base64.b64decode(cursors.split(',')[1]))
    # Name editing stays inline and keyboard accessible without recurring costs.
    page.evaluate('selectShip(9901)')
    assert 'Gold / Min.' not in page.locator('.win[data-id=ship]').inner_text()
    assert page.locator('.ship-heading h2 [data-act=ship-edit-name] img').count()==1
    page.locator('[data-act=ship-edit-name]').focus();page.keyboard.press('Enter')
    assert page.locator('#shipname').evaluate('e=>document.activeElement===e')
    page.locator('#shipname').fill('Aurora')
    page.locator('[data-act=ship-rename]').click()
    assert page.evaluate('WORLD.fleet[0].name')=='Aurora'
    page.evaluate('WINS.ship.hold=false;refreshWin(WINS.ship)')
    # Four slots form one row; typography still fits compact fields at mobile width.
    page.evaluate("stepFleet(10000);selectShip(9901)")
    page.evaluate("()=>{const sh=WORLD.fleet.find(s=>s.id===9901);window.cargoTestAnchor={...sh.anchor};sh.anchor={...G.dock};sh.cargo=[];selectShip(9901);}")
    assert page.evaluate("()=>{const cells=[...WINS.ship.body.querySelectorAll('.cargo-slot.empty')].map(e=>e.getBoundingClientRect());return WINS.ship.el.getBoundingClientRect().width>=920&&cells.every(e=>e.width>=100)&&WINS.ship.body.querySelector('.transfer-columns section[aria-label=Schiffsladung]').getBoundingClientRect().width>WINS.ship.body.querySelector('.transfer-columns section[aria-label=Inselvorrat]').getBoundingClientRect().width}")
    assert page.evaluate("[...document.querySelectorAll('.cargo-full-label')].every(e=>e.getClientRects().length===1&&e.getBoundingClientRect().width<=e.closest('.cargo-slot').clientWidth-16)")
    page.locator('.win[data-id=ship]').screenshot(path=str(root/'pixxo_tests/ship-cargo-wide.png'))
    if os.environ.get('PIXXO_AXE_SCRIPT'):
        page.add_script_tag(path=os.environ['PIXXO_AXE_SCRIPT'])
        assert not page.evaluate("async()=> (await axe.run('.win[data-id=ship]',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))")
    assert page.locator('.cargo-slot.empty').count()==4
    assert all('50 t frei' not in t for t in page.locator('.cargo-slot.empty').all_text_contents())
    assert page.evaluate("()=>{const cells=[...WINS.ship.body.querySelectorAll('.cargo-slot.empty')].map(e=>e.getBoundingClientRect());return cells.every(e=>Math.abs(e.top-cells[0].top)<1)}")
    assert page.evaluate("getComputedStyle(WINS.ship.body,'::-webkit-scrollbar').width==='22px'")
    for width in [320,768,1440]:
        page.set_viewport_size({'width':width,'height':1080})
        assert page.evaluate('WINS.ship.body.scrollWidth<=WINS.ship.body.clientWidth+1'),page.evaluate('({viewport:innerWidth,body:WINS.ship.body.clientWidth,content:WINS.ship.body.scrollWidth,labels:[...document.querySelectorAll(".cargo-slot-name")].map(e=>({width:e.getBoundingClientRect().width,text:e.innerText}))})')
    page.evaluate('document.documentElement.style.fontSize="200%"')
    assert page.evaluate('WINS.ship.body.scrollWidth<=WINS.ship.body.clientWidth+1')
    page.evaluate('document.documentElement.style.fontSize=""')
    page.evaluate('document.querySelectorAll(".win").forEach(e=>e.style.left="12px");WORLD.fleet[0].type="schooner";WINS.ship.hold=false;refreshWin(WINS.ship)')
    assert page.evaluate('WINS.ship.el.getBoundingClientRect().width===760')
    assert page.locator('.cargo-slot.empty').count()==2
    assert page.evaluate('(()=>{const cells=[...document.querySelectorAll(".cargo-slot.empty")].map(e=>e.getBoundingClientRect());return Math.abs(cells[0].width-cells[1].width)<1&&cells[0].width>170})()')
    page.evaluate('WORLD.fleet.find(s=>s.id===9901).anchor=cargoTestAnchor;WINS.ship.hold=false;refreshWin(WINS.ship)')
    assert page.evaluate('WINS.ship.el.getBoundingClientRect().width===640')
    page.locator('.win[data-id=ship]').screenshot(path=str(root/'pixxo_tests/ship-schooner-compact.png'))
    page.evaluate('WORLD.fleet[0].type="clipper";WINS.ship.hold=false;refreshWin(WINS.ship)')
    page.evaluate("""()=>{const sh=WORLD.fleet[0],p=freeShipPosition(sh),other=ISLANDS.findIndex((m,i)=>i!==activeIsland),slot=()=>({load:null,unload:null});WORLD.islands[other]={...G,cpu:false,stock:{...G.stock},dock:{...G.dock}};G.stock.fisch=100;
      const stations=[{island:activeIsland,slots:Array.from({length:4},slot)},{island:other,slots:Array.from({length:4},slot)}];stations[0].slots[0].load={good:'fisch',qty:20};stations[1].slots[0].unload={good:'fisch',qty:20};
      const result=commitTradeRoute({name:'Anfahrt',ships:[sh.id],stations,reserve:0,waitForSpace:false,waitForGoods:false},null);if(result!==true)throw Error(result);
      if(!sh.routeApproach||Math.hypot(freeShipPosition(sh).x-p.x,freeShipPosition(sh).y-p.y)>1)throw Error('Assignment teleports the ship');
      stepFleet(sh.routeApproach.duration/2);if(sh.cargo.length||G.stock.fisch!==100)throw Error('Ship loads before arriving');saveGame();const stored=JSON.parse(localStorage.getItem(SAVEKEY));if(!stored.fleet[0].routeApproach.remaining)throw Error('Approach progress not saved');
      stepFleet(10000);stepFleet(10000);if(sh.cargo[0]?.qty!==20||G.stock.fisch!==80)throw Error('Ship does not load after approaching its port');}""")
    page.evaluate('closeWin("ship")');assert page.evaluate('UI.selectedShip===null')
    assert not errors,errors
    print('PASS: Selected ship outline, click-to-sail, world route, native tool cursors, four cargo slots and 22px scrollbars.')
    browser.close()
