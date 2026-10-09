from pathlib import Path
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    pg=b.new_page(viewport={'width':1440,'height':1000});errors=[]
    pg.on('pageerror',lambda e:errors.append(str(e)))
    pg.goto((Path(__file__).resolve().parent.parent/'pixxo.html').as_uri())
    pg.evaluate('G.speed=0;closeWin("tutorial")')
    pg.locator('[data-tool="road"]').click()
    assert pg.get_by_role('dialog',name='Wege und Straßen',exact=True).count()==0
    assert pg.evaluate('UI.tool')=='road'
    road=pg.evaluate('''() => {let site;const m=ISLANDS[activeIsland];for(let y=m.oy;y<m.oy+112&&!site;y++)for(let x=m.ox;x<m.ox+112;x++)if(placeRoad(x,y)){site={x,y};break}return site}''');assert road
    assert pg.evaluate('G.road[IDX('+str(road['x'])+','+str(road['y'])+')]')==1
    pg.evaluate('''() => {const p=G.blds[0];G.blds.push({...p,id:9999,type:'steinbruch',x:p.x+5});G.stock.stein=20;G.gold=1000;}''')
    pg.locator('#hint [data-act="cancel"]').click();pg.locator('[data-tool="upgrade"]').click()
    out=pg.evaluate('''site=>{const gold=G.gold,stone=G.stock.stein;paintCell(site.x,site.y);const level=G.road[IDX(site.x,site.y)];paintCell(site.x,site.y);const spent={gold:gold-G.gold,stone:stone-G.stock.stein};G.blds=G.blds.filter(b=>b.id!==9999);saveGame();loadGame();return {level,spent,restored:G.road[IDX(site.x,site.y)],different:SP.road15.toDataURL()!==SP.stoneroad15.toDataURL()}}''',road)
    print('ROAD LEVELS',out,'ERRORS',errors);assert out=={'level':2,'spent':{'gold':4,'stone':1},'restored':2,'different':True} and not errors
    pg.evaluate('setTool(null);UI.z=3;UI.sc=3*UI.DR');pg.evaluate('s=>centerOn(s.x+.5,s.y+.5)',road)
    pg.screenshot(path=str(Path(__file__).parent/'pixxo-stone-road.png'))
    b.close()
