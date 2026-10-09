from pathlib import Path
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    pg=b.new_page(viewport={'width':1440,'height':1000});errors=[]
    pg.on('pageerror',lambda e:errors.append(str(e)))
    pg.goto((Path(__file__).resolve().parent.parent/'pixxo.html').as_uri())
    pg.evaluate('G.speed=0;closeWin("tutorial");G.gold=10000;for(const k in G.stock)G.stock[k]=70')
    ids=pg.evaluate('''() => {const m=ISLANDS[activeIsland],homes=[];for(let y=m.oy;y<m.oy+112&&homes.length<6;y++)for(let x=m.ox;x<m.ox+112&&homes.length<6;x++)if(canPlace('haus',x,y).ok)homes.push(place('haus',x,y).b);for(const h of homes){h.pop=4;h.conn=true;h.cov={markt:true,kapelle:true};h.supplyTime=30}return {house:homes[0].id,port:G.blds.find(b=>b.type==='kontor').id}}''')
    pg.locator('[data-tool="upgrade"]').click();assert pg.evaluate('UI.tool')=='upgrade'
    cost=pg.evaluate('''id=>{const b=G.byId.get(id);UI.hover={x:b.x,y:b.y};UI.tipPos={x:900,y:500};updateUpgradeTip();return {cost:upgradeRequest(b).cost,ready:upgradeRequest(b).ready}}''',ids['house'])
    assert cost['ready'] and cost['cost']=={'bretter':4}
    assert pg.locator('#upgradeTip').is_visible() and '4' in pg.locator('#upgradeTip').inner_text()
    outcome=pg.evaluate('''id=>{const b=G.byId.get(id),gold=G.gold;clickTile({x:b.x,y:b.y});return {tier:b.tier,spent:gold-G.gold}}''',ids['house']);assert outcome=={'tier':2,'spent':0}
    port=pg.evaluate('''id=>{const b=G.byId.get(id),gold=G.gold;clickTile({x:b.x,y:b.y});return {tier:b.tier,spent:gold-G.gold}}''',ids['port']);assert port=={'tier':2,'spent':750}
    sprites=pg.evaluate('''() => ({arrows:Array.from({length:6},(_,i)=>SP['i_upgrade'+i].toDataURL()),stollen:['front','left','right'].map(side=>Array.from({length:5},(_,f)=>SP['stollen_'+side+f].toDataURL()))})''')
    assert len(set(sprites['arrows']))>=4 and len(set(a for row in sprites['stollen'] for a in row))==15
    pg.screenshot(path=str(Path(__file__).parent/'pixxo-upgrade-tool.png'))
    print('UPGRADES',outcome,port,'STOLLEN VARIANTS',15,'ERRORS',errors);assert not errors
    b.close()
