from pathlib import Path
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    page=browser.new_page(viewport={'width':1440,'height':1000});errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((Path(__file__).resolve().parent.parent/'pixxo.html').as_uri())
    page.evaluate('startNew()')
    page.evaluate('G.speed=0;closeWin("tutorial")')
    initial=page.evaluate('({stock:G.stock,ship:G.ship,next:G.nextShip,time:G.time,min:ZMIN,costs:CONSTRUCTION_COSTS,started:!!Sound.ctx})')
    assert initial['stock']['bretter']==20 and sum(initial['stock'].values())==20 and initial['ship'] is None
    assert 300<=initial['next']-initial['time']<=600 and initial['min']==.1 and not initial['started']
    assert initial['costs']['haus']=={'bretter':2} and initial['costs']['holzfaeller']=={'gold':100} and initial['costs']['saegewerk']=={'gold':100}
    assert 'stein' not in initial['costs']['steinbruch']
    page.mouse.click(900,500);page.wait_for_timeout(400)
    assert page.evaluate('Sound.ctx.state')=='running'
    page.evaluate('openWin_menu()')
    page.locator('#music-volume').fill('0');page.locator('#effects-volume').fill('75')
    assert page.evaluate('Sound.prefs.music')==0 and page.evaluate('Sound.prefs.effects')==.75
    page.locator('[data-audio-mute]').click();before=page.evaluate('Sound.played');page.evaluate('soundEffect("danger")');assert page.evaluate('Sound.played')==before
    page.locator('[data-audio-mute]').click()
    audible=page.evaluate('''async()=>{const analyser=Sound.ctx.createAnalyser();analyser.fftSize=2048;Sound.master.connect(analyser);soundEffect('build');await new Promise(r=>setTimeout(r,140));const data=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(data);const rms=Math.sqrt(data.reduce((s,v)=>s+v*v,0)/data.length);analyser.disconnect();return rms}''')
    assert audible>.0001
    page.evaluate('''for(const k of ['upgrade','trade','ship','danger','demolish','error','production','success'])soundEffect(k);closeWin('menu');setTool('build','saegewerk')''')
    page.keyboard.press('r');assert page.evaluate('UI.rotation')==1
    built=page.evaluate('''()=>{const m=ISLANDS[activeIsland];for(let y=m.oy;y<m.oy+112;y++)for(let x=m.ox;x<m.ox+112;x++)if(canPlace('saegewerk',x,y).ok){const r=place('saegewerk',x,y);rebuildNet();saveGame();return {id:r.b.id,w:r.b.w,h:r.b.h,rotation:r.b.rotation,sprite:spName(r.b),gold:G.gold,boards:G.stock.bretter}}}''')
    assert built and built['w']==2 and built['h']==3 and built['rotation']==1 and built['boards']==20
    page.evaluate('setTool(null)');page.keyboard.press('r');assert page.evaluate('UI.rotation')==1
    page.reload();page.evaluate('G.speed=0;closeWin("tutorial")')
    restored=page.evaluate('id=>{const b=G.byId.get(id);return {w:b.w,h:b.h,rotation:b.rotation,music:Sound.prefs.music,effects:Sound.prefs.effects,muted:Sound.prefs.muted}}',built['id'])
    assert restored=={'w':2,'h':3,'rotation':1,'music':0,'effects':.75,'muted':False}
    merchant=page.evaluate('''()=>{G.dock=findDock();G.ship=null;G.time=G.nextShip;stepShip(0);const first=G.ship?.kind,delay=G.nextShip-G.time;G.ship={kind:'colonist'};const stock=JSON.stringify(G.stock);stepShip(0);return {first,delay,legacyRemoved:!G.ship,unchanged:stock===JSON.stringify(G.stock)}}''')
    assert merchant['first']=='trade' and 300<=merchant['delay']<=600 and merchant['legacyRemoved'] and merchant['unchanged']
    page.evaluate('openWin_menu()');page.screenshot(path=str(Path(__file__).parent/'pixxo-audio-menu.png'))
    print('START',initial['stock'],'ROTATION',restored,'AUDIO RMS',audible,'MERCHANT',merchant,'ERRORS',errors)
    assert not errors
    browser.close()
