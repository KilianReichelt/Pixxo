from pathlib import Path
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    pg=b.new_page(viewport={'width':1440,'height':1000});errors=[]
    pg.on('pageerror',lambda e:errors.append(str(e)))
    pg.goto((Path(__file__).resolve().parent.parent/'pixxo.html').as_uri())
    pg.evaluate('G.speed=0;for(const id in WINS)closeWin(id);UI.z=1;UI.sc=UI.DR;centerOn(ISLANDS[activeIsland].wx,ISLANDS[activeIsland].wy);window.zoomAnchor=scr2w(900,500)')
    pg.mouse.move(900,500);pg.mouse.wheel(0,-120)
    result=pg.evaluate('({z:UI.z,drift:Math.hypot(scr2w(900,500).x-window.zoomAnchor.x,scr2w(900,500).y-window.zoomAnchor.y)})')
    assert 1.1<result['z']<1.14 and result['drift']<.0001
    pg.mouse.wheel(0,120);assert abs(pg.evaluate('UI.z')-1)<.0001
    pg.evaluate('setZoom(ZMIN,900,500)');pg.mouse.wheel(0,120);assert pg.evaluate('UI.z')==.1
    pg.evaluate('setZoom(ZMAX,900,500)');pg.mouse.wheel(0,-120);assert pg.evaluate('UI.z')==4
    print('ZOOM',result,'ERRORS',errors);assert not errors
    b.close()
