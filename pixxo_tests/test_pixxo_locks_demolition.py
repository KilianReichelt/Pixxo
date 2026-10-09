from pathlib import Path
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    page=browser.new_page(viewport={'width':1440,'height':1000});errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((Path(__file__).resolve().parent.parent/'pixxo.html').as_uri())
    page.evaluate('G.speed=0;closeWin("tutorial");G.gold=20000;G.stock.bretter=70;G.stock.stein=70')
    lock=page.evaluate('''()=>{G.quests.u_werft=true;const a=unlocked('werft');const q=canPlace('werft',G.blds[0].x,G.blds[0].y);UI.cat='lager';renderBar();const hidden=!document.querySelector('[data-b="werft"]');delete G.quests.u_werft;WORLD.highestTier=2;UI.cat='lager';renderBar();return {a,why:q.why,hidden,disabled:document.querySelector('[data-b="werft"]').disabled,text:buildingUnlockText('werft')}}''')
    assert not lock['a'] and lock['hidden'] and lock['disabled'] and 'Bürger' in lock['why'] and '150' in lock['text']
    progression=page.evaluate('''()=>{const home={id:999991,type:'haus',tier:2,pop:149};G.blds.push(home);const before=unlocked('werft');home.pop=150;const after=unlocked('werft');G.blds.pop();return {before,after}}''')
    assert progression=={'before':False,'after':True}
    building=page.evaluate('''()=>{setTool('build','holzfaeller');const m=ISLANDS[activeIsland];for(let y=m.oy;y<m.oy+112;y++)for(let x=m.ox;x<m.ox+112;x++)if(canPlace('holzfaeller',x,y).ok){const b=place('holzfaeller',x,y).b;setTool(null);return {id:b.id,x,y,gold:G.gold}}}''')
    page.evaluate('b=>demolishAt(b.x,b.y)',building)
    assert page.get_by_role('dialog',name='Gebäude abreißen',exact=True).is_visible()
    assert '50 Gold' in page.get_by_role('dialog',name='Gebäude abreißen',exact=True).inner_text()
    assert page.evaluate('id=>G.byId.has(id)',building['id'])
    page.locator('[data-act="demolish-cancel"]').click()
    assert page.evaluate('id=>G.byId.has(id)',building['id']) and page.evaluate('G.gold')==building['gold']
    page.evaluate('b=>demolishAt(b.x,b.y)',building)
    page.screenshot(path=str(Path(__file__).parent/'pixxo-demolition-confirm.png'))
    page.locator('[data-act="demolish-confirm"]').click()
    assert not page.evaluate('id=>G.byId.has(id)',building['id']) and page.evaluate('G.gold')==building['gold']+50
    assert page.evaluate('G.occ[IDX('+str(building['x'])+','+str(building['y'])+')]')==0
    page.reload();assert not page.evaluate('id=>G.byId.has(id)',building['id'])
    print('LOCKS',lock,progression,'REFUND',50,'ERRORS',errors);assert not errors
    browser.close()
