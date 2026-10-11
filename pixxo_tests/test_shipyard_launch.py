"""Ship production duration, launch site and direct pixel selection."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    page=browser.new_page(viewport={'width':1440,'height':1000})
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((root/'pixxo.html').as_uri());page.wait_for_function('StartScreen.ready');page.locator('[data-start=new]').click();page.wait_for_function('StartScreen.started');page.evaluate('tutorialFinish();setSpeed(0)')
    print(page.evaluate("""()=>{const port=G.blds.find(b=>b.type==='kontor');G.gold=100000;for(const k in G.stock)G.stock[k]=500;G.quests.u_werft=true;WORLD.highestTier=3;let yard;
        const reasons={};let valid=0;for(let y=port.y-100;y<port.y+100&&!yard;y++)for(let x=port.x-100;x<port.x+100;x++){const result=canPlace('werft',x,y);if(result.ok){valid++;const b={x,y,w:B.werft.w,h:B.werft.h};if(shipyardLaunchPoint(b)){yard=place('werft',x,y).b;break;}}else reasons[result.why]=(reasons[result.why]||0)+1;}
        if(!yard)throw Error('No valid coastal shipyard '+JSON.stringify({reasons,valid,dock:G.dock}));yard.conn=true;yard.paused=false;yard.fire=0;yard.eff=1;yard.staffEff=1;UI.sel=yard.id;window.launchYard=yard;
        selectB(yard.id);WINS.info.hold=true;const gold=G.gold,result=buildShip('schooner');if(result!==true)throw Error(result);const sh=WORLD.fleet.at(-1);window.launchShip=sh;
        if(!WINS.info.body.textContent.includes('5 Min. 00 Sek. verbleibend.')||WINS.info.hold||[...WINS.info.body.querySelectorAll('[data-act=shipbuild]')].some(b=>!b.disabled))throw Error('Shipyard does not refresh immediately');if(formatShipBuildTime(61.1)!=='1 Min. 02 Sek.'||formatShipBuildTime(59.1)!=='1 Min. 00 Sek.')throw Error('Duration rounding');
        if(sh.buildLeft!==300||G.gold!==gold-SHIPS.schooner.cost.gold||sh.yardId!==yard.id)throw Error('Wrong cost/duration/source yard');
        if(!sh.anchor||G.tiles[IDX(Math.floor(sh.anchor.x),Math.floor(sh.anchor.y))]>T.SHAL||Math.hypot(sh.anchor.x-cx(yard),sh.anchor.y-cy(yard))>8||!seaPath(G.dock,sh.anchor))throw Error('Ship does not launch in front of yard');
        yard.staffEff=1;stepFleet(299);refreshWin(WINS.info);if(!WINS.info.body.textContent.includes('0 Min. 01 Sek. verbleibend.'))throw Error('Shipyard countdown format');if(sh.buildLeft!==1)throw Error('Schooner completes early');yard.staffEff=1;stepFleet(1);if(sh.buildLeft!==0)throw Error('Schooner does not complete');
        const p=freeShipPosition(sh);if(Math.hypot(p.x-cx(yard),p.y-cy(yard))>8)throw Error('Completion moves ship to Kontor');
        if(!SHIP_NAMES.includes(sh.name))throw Error('Launched ship has no real name');
        const next=buildShip('clipper');if(next!==true)throw Error(next);const clipper=WORLD.fleet.at(-1);if(clipper.buildLeft!==1200)throw Error('Clipper duration wrong');yard.staffEff=1;stepFleet(1199);if(clipper.buildLeft!==1)throw Error('Clipper completes early');stepFleet(1);if(clipper.buildLeft!==0)throw Error('Clipper does not complete');
        if(!SHIP_NAMES.includes(clipper.name)||clipper.name===sh.name)throw Error('Ship name duplicate or generic');
        clipper.name='Meine Johanna';saveGame();if(JSON.parse(localStorage.getItem(SAVEKEY)).fleet.find(s=>s.id===clipper.id).name!=='Meine Johanna')throw Error('Custom name not saved');
        setTool(null);UI.sel=null;setZoom(3,innerWidth/2,innerHeight/2);centerOn(p.x,p.y);render();return {seconds:[300,1200],launch:p,ship:sh.id,shipyard:yard.id};}"""))
    # The actual keyboard action must update the held building window immediately.
    page.evaluate('selectB(launchYard.id);launchYard.conn=true;launchYard.paused=false')
    page.locator('[data-act=shipbuild][data-type=schooner]').focus();page.keyboard.press('Enter')
    assert page.locator('.win[data-id=info]').inner_text().find('5 Min. 00 Sek. verbleibend.')>=0,page.evaluate('({window:WINS.info.body.textContent,fleet:WORLD.fleet.map(s=>({type:s.type,left:s.buildLeft})),active:document.activeElement.outerHTML,held:WINS.info.hold,static:WINS.info.static,log:UI.log})')
    assert 'Baugeschwindigkeit' not in page.locator('.win[data-id=info]').inner_text()
    assert page.evaluate("[...document.querySelectorAll('.ship-build-row')].every(row=>row.querySelector('.cost')&&row.querySelector('[data-act=shipbuild]'))")
    assert page.evaluate("()=>{const row=document.querySelector('.ship-build-row'),a=row.querySelector('.cost').getBoundingClientRect(),b=row.querySelector('button').getBoundingClientRect();return b.right<=a.left&&Math.abs((a.top+a.bottom)/2-(b.top+b.bottom)/2)<2}")
    page.locator('.win[data-id=info]').screenshot(path=str(root/'pixxo_tests/shipyard-compact.png'))
    assert page.evaluate('WINS.info.body.scrollHeight<=WINS.info.body.clientHeight+1'),page.evaluate('({height:WINS.info.body.clientHeight,content:WINS.info.body.scrollHeight})')
    for width in [320,768,1440]:
        page.set_viewport_size({'width':width,'height':1000})
        assert page.evaluate("()=>{const body=WINS.info.body;return body.scrollWidth<=body.clientWidth+1&&[...body.querySelectorAll('p,span,button,b')].every(e=>parseFloat(getComputedStyle(e).fontSize)>=14)}")
    if os.environ.get('PIXXO_AXE_SCRIPT'):
        page.add_script_tag(path=os.environ['PIXXO_AXE_SCRIPT'])
        assert not page.evaluate("async()=> (await axe.run('.win[data-id=info]',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))")
    page.evaluate('closeWin("info");UI.sel=null')
    target=page.evaluate("""()=>{const sh=launchShip,p=freeShipPosition(sh),sprite=makeDirectionalShip(sh.heading||0,sh.type,Math.floor(G.time*3)%6),pixels=sprite.getContext('2d').getImageData(0,0,64,64).data;for(let y=38;y<60;y++)for(let x=16;x<48;x++)if(pixels[(y*64+x)*4+3]){const wx=Math.round(p.x*16)-32+x+.5,wy=Math.round(p.y*16)-48+y+.5;if(shipAtWorldPoint(wx,wy)?.id!==sh.id)continue;return {x:((wx-UI.cam.x)*UI.sc+cv.width/2)/UI.DR,y:((wy-UI.cam.y)*UI.sc+cv.height/2)/UI.DR};}throw Error('No selectable ship pixels');}""")
    page.mouse.click(target['x'],target['y'])
    page.wait_for_function('UI.selectedShip===launchShip.id&&!!WINS.ship')
    assert page.locator('.win[data-id=ship]').is_visible()
    page.evaluate('closeWin("ship");UI.barMode="fleet";renderBar()')
    page.locator('[data-select-ship]').first.focus();page.keyboard.press('Enter')
    assert page.locator('.win[data-id=ship]').is_visible()
    assert not errors,errors
    print('PASS: Direct ship click and existing keyboard fleet selection.')
    browser.close()
