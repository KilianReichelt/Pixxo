from pathlib import Path
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    pg=b.new_page(viewport={'width':1440,'height':1000});errors=[]
    pg.on('pageerror',lambda e:errors.append(str(e)))
    pg.goto((Path(__file__).resolve().parent.parent/'pixxo.html').as_uri());pg.wait_for_timeout(200)
    pg.evaluate('newGame(1234);resetWorld();G.speed=0;afterNewWorld();renderTop(true)')
    assert pg.evaluate("document.fonts.check('16px LowresPixel')")
    for category in ['lager','wohnen','roh','veredel','dienst']:
        pg.locator(f'[data-cat="{category}"]').click();pg.wait_for_timeout(40)
        bounds=pg.evaluate('''() => {const e=document.querySelector('#items'),r=e.getBoundingClientRect(),bar=document.querySelector('#bar').getBoundingClientRect();return {top:r.top,bottom:r.bottom,bar:bar.top,inner:e.clientHeight,required:e.scrollHeight}}''')
        print(category,bounds)
        assert bounds['bottom']<bounds['bar'] and bounds['top']>=pg.evaluate("document.querySelector('#top').getBoundingClientRect().bottom")
        assert bounds['required']<=bounds['inner']+1
        pg.screenshot(path=f'pixxo-items-{category}.png')
    pg.locator('[data-cat="dienst"]').click()
    heights=pg.evaluate("Array.from(document.querySelectorAll('#top button')).filter(e=>e.getClientRects().length).map(e=>e.getBoundingClientRect().height)")
    assert all(h==44 for h in heights)
    print('TOP HEIGHTS',set(heights))
    assert pg.evaluate("document.querySelector('#islandfacts').getBoundingClientRect().width<=document.querySelector('#mm').getBoundingClientRect().width")
    # Minikarte: Klick und Ziehen funktionieren ohne geöffnetes Menü.
    r=pg.locator('#mm').bounding_box()
    pg.mouse.click(r['x']+r['width']*.25,r['y']+r['height']*.3)
    coords=pg.evaluate('({x:UI.cam.x/16,y:UI.cam.y/16,windows:Object.keys(WINS)})')
    print('MINIMAP CLICK',coords)
    assert abs(coords['x']-112)<1 and abs(coords['y']-100.8)<1 and not coords['windows']
    pg.mouse.move(r['x']+10,r['y']+10);pg.mouse.down();pg.mouse.move(r['x']+r['width']*.7,r['y']+r['height']*.8);pg.mouse.up()
    assert abs(pg.evaluate('UI.cam.x/16')-313.6)<1
    pg.get_by_role('button',name='Minikarte vergrößern',exact=True).click()
    assert pg.evaluate('UI.mmZoom')==1
    pg.get_by_role('button',name='Minikarte verkleinern',exact=True).click()
    assert pg.evaluate('UI.mmZoom')==0
    # Abbauplätze stehen vollständig außerhalb des Gebirges.
    deposits=pg.evaluate('''() => G.deposits.map(n=>({type:n.type,flat:footprintCells(n.x,n.y,B[n.type].w,B[n.type].h).every(([x,y])=>BUILDABLE(G.tiles[IDX(x,y)])),edge:ringCells({...n,w:B[n.type].w,h:2}).some(([x,y])=>[T.ROCK,T.ORE].includes(G.tiles[IDX(x,y)]))}))''')
    assert all(n['flat'] and n['edge'] for n in deposits)
    print('EDGE DEPOSITS',deposits)
    pg.evaluate("const n=G.deposits[0];clickTile({x:n.x+1,y:n.y+1})")
    assert pg.get_by_role('dialog',name='Abbauplatz am Gebirgsrand').count()==1
    pg.screenshot(path='pixxo-deposit-choice.png')
    pg.evaluate('closeWin("deposit")')
    # Speichern bewahrt einen bestehenden neuen Abbauplatz samt Effizienz.
    built=pg.evaluate('''() => {const n=G.deposits[0];const d=B[n.type];G.stock.holz=70;G.stock.bretter=70;G.stock.stein=70;G.stock.werkzeug=70;G.gold=10000;G.quests['u_'+n.type]=true;const wh={id:500,type:'lager',tier:1,x:n.x+4,y:n.y+4,w:3,h:3};G.blds.push(wh);G.byId.set(wh.id,wh);const r=place(n.type,n.x,n.y);if(!r.ok)return r;rebuildNet();saveGame();loadGame();const restored=G.byId.get(r.b.id);return {ok:true,eff:restored.eff,flat:footprintCells(restored.x,restored.y,restored.w,restored.h).every(([x,y])=>BUILDABLE(G.tiles[IDX(x,y)]))}}''')
    print('MINING SAVE',built);assert built['ok'] and built['eff']==1 and built['flat']
    assert not pg.evaluate("Boolean(B.mine.env||B.steinbruch.env)")
    for w in [1920,1440,768,390,320]:
        pg.set_viewport_size({'width':w,'height':1000});pg.evaluate('renderTop(true);renderBar()');pg.screenshot(path=f'pixxo-layout-{w}.png')
        assert pg.evaluate('document.documentElement.scrollWidth<=innerWidth')
    print('ERRORS',errors);assert not errors
    b.close()
