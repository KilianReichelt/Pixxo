from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    page=browser.new_page(viewport={'width':1440,'height':1000});errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((root/'pixxo_isometrisch.html').as_uri())
    page.evaluate('G.speed=0;for(const id in WINS)closeWin(id);UI.z=2;UI.sc=2*UI.DR')
    before=page.evaluate('({...UI.cam})')
    page.mouse.move(850,650);page.mouse.down();page.mouse.move(970,690,steps=8);page.mouse.up()
    after=page.evaluate('({...UI.cam})');assert abs(after['x']-before['x']+50)<.1 and abs(after['y']-before['y']-10)<.1
    page.mouse.move(880,550);anchor=page.evaluate('scr2w(880,550)');page.mouse.wheel(0,120)
    drift=page.evaluate('p=>Math.hypot(scr2w(880,550).x-p.x,scr2w(880,550).y-p.y)',anchor);assert drift<.0001
    candidate=page.evaluate('''()=>{const port=G.blds.find(b=>b.type==='kontor');for(let y=port.y-15;y<port.y+15;y++)for(let x=port.x-15;x<port.x+15;x++)if(canPlace('haus',x,y).ok){centerOn(x+1,y+1);setTool('build','haus');return {x,y,p:isoScreen(x+1.15,y+1.15),count:G.blds.length}}}''');assert candidate
    page.keyboard.press('r');page.mouse.click(candidate['p']['x'],candidate['p']['y'])
    built=page.evaluate('''()=>{const b=G.blds[G.blds.length-1];return {x:b.x,y:b.y,rotation:b.rotation,id:b.id,count:G.blds.length}}''')
    assert built['x']==candidate['x'] and built['y']==candidate['y'] and built['rotation']==1 and built['count']==candidate['count']+1
    page.evaluate('setTool(null);render()');pos=page.evaluate('id=>{const b=G.byId.get(id);return isoScreen(cx(b),cy(b))}',built['id'])
    page.mouse.click(pos['x'],pos['y']);assert page.evaluate('UI.sel')==built['id']
    page.locator('[data-act="move"]').click()
    move=page.evaluate('''id=>{const b=G.byId.get(id);for(let y=b.y-10;y<b.y+10;y++)for(let x=b.x-10;x<b.x+10;x++)if((x!==b.x||y!==b.y)&&canMoveBuilding(b,x,y).ok){centerOn(x+1,y+1);return {x,y,p:isoScreen(x+1.15,y+1.15)}}}''',built['id'])
    page.mouse.click(move['p']['x'],move['p']['y']);assert page.evaluate('id=>G.byId.get(id).x',built['id'])==move['x']
    page.locator('[data-act="demo"]').click();assert page.locator('[data-act="demolish-confirm"]').is_visible();page.locator('[data-act="demolish-cancel"]').click()
    assert page.evaluate('id=>G.byId.has(id)',built['id'])
    page.evaluate('for(const id in WINS)closeWin(id);UI.mmZoom=0;drawMini()')
    dest=page.evaluate('''()=>{const v=isoMiniView(),m=ISLANDS[activeIsland],p=isoPoint(m.wx,m.wy);return {x:m.wx,y:m.wy,u:(p.x*v.scale+v.ox)/112,v:(p.y*v.scale+v.oy)/112}}''')
    box=page.locator('#mm').bounding_box();page.mouse.click(box['x']+box['width']*dest['u'],box['y']+box['height']*dest['v'])
    cam=page.evaluate('({x:UI.cam.x/16,y:UI.cam.y/16})');assert abs(cam['x']-dest['x'])<2 and abs(cam['y']-dest['y'])<2
    variants=page.evaluate('''()=>({buildings:Object.keys(B).flatMap(t=>Array.from({length:t==='haus'?3:t==='kontor'?4:1},(_,i)=>isoSprite(t,i+1).image.toDataURL())),ships:Object.values(SHIP_SPRITES).flat().map(c=>c.toDataURL()),stollen:['front','left','right','back'].flatMap(side=>Array.from({length:5},(_,i)=>SP['stollen_'+side+i].toDataURL()))})''')
    assert len(set(variants['buildings']))==30 and len(set(variants['ships']))==16 and len(set(variants['stollen']))==20
    page.evaluate('saveGame()');page.reload();page.evaluate('G.speed=0')
    assert page.evaluate('id=>G.byId.get(id).rotation',built['id'])==1 and page.evaluate('id=>G.byId.get(id).x',built['id'])==move['x']
    page.set_viewport_size({'width':390,'height':844});page.evaluate('for(const id in WINS)closeWin(id);UI.cat="roh";renderBar()')
    page.screenshot(path=str(root/'pixxo_tests/pixxo-isometrisch-mobil.png'))
    print('INTERACTIONS',{'pan':after,'zoomDrift':drift,'built':built,'moved':move,'minimap':cam,'uniqueBuildings':30,'uniqueShips':16,'uniqueStollen':20},'ERRORS',errors)
    assert not errors
    browser.close()
