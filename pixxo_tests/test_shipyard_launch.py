"""Ship production duration, launch site and direct pixel selection."""
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
        const gold=G.gold,result=buildShip('schooner');if(result!==true)throw Error(result);const sh=WORLD.fleet.at(-1);window.launchShip=sh;
        if(sh.buildLeft!==300||G.gold!==gold-SHIPS.schooner.cost.gold||sh.yardId!==yard.id)throw Error('Wrong cost/duration/source yard');
        if(!sh.anchor||G.tiles[IDX(Math.floor(sh.anchor.x),Math.floor(sh.anchor.y))]>T.SHAL||Math.hypot(sh.anchor.x-cx(yard),sh.anchor.y-cy(yard))>8||!seaPath(G.dock,sh.anchor))throw Error('Ship does not launch in front of yard');
        stepFleet(299);if(sh.buildLeft!==1)throw Error('Schooner completes early');stepFleet(1);if(sh.buildLeft!==0)throw Error('Schooner does not complete');
        const p=freeShipPosition(sh);if(Math.hypot(p.x-cx(yard),p.y-cy(yard))>8)throw Error('Completion moves ship to Kontor');
        const next=buildShip('clipper');if(next!==true)throw Error(next);const clipper=WORLD.fleet.at(-1);if(clipper.buildLeft!==1200)throw Error('Clipper duration wrong');stepFleet(1199);if(clipper.buildLeft!==1)throw Error('Clipper completes early');stepFleet(1);if(clipper.buildLeft!==0)throw Error('Clipper does not complete');
        setTool(null);UI.sel=null;setZoom(3,innerWidth/2,innerHeight/2);centerOn(p.x,p.y);render();return {seconds:[300,1200],launch:p,ship:sh.id,shipyard:yard.id};}"""))
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
