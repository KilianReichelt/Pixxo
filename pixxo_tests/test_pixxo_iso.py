from pathlib import Path
import json
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    page=browser.new_page(viewport={'width':1440,'height':1000});errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((root/'pixxo_isometrisch.html').as_uri())
    page.wait_for_timeout(1500)
    if errors:print('ERRORS',errors)
    assert not errors
    page.evaluate('G.speed=0;for(const id in WINS)closeWin(id)')
    result=page.evaluate('''()=>{const b=G.blds.find(b=>b.type==='kontor');centerOn(cx(b),cy(b));UI.z=2;UI.sc=2*UI.DR;render();const p=isoScreen(cx(b),cy(b));return {buildings:worldBuildings().length,time:G.time,key:SAVEKEY,p,inverse:tileAt(p.x,p.y),tile:{x:Math.floor(cx(b)),y:Math.floor(cy(b))},sprites:ISO.sprites.size,frame:ISO.frameMs}}''')
    assert result['inverse']==result['tile'] and result['buildings']==8 and result['key']=='pixxo_iso_v1'
    page.screenshot(path=str(root/'pixxo_tests/pixxo-isometrisch.png'))
    page.evaluate('''()=>{const rows=Object.keys(B).flatMap(t=>Array.from({length:t==='haus'?3:t==='kontor'?4:1},(_,i)=>({t,tier:i+1})));const c=document.createElement('canvas');c.id='iso-review';c.width=1320;c.height=Math.ceil(rows.length/6)*180;c.style.cssText='position:fixed;inset:0;z-index:999999;background:#303d39';const g=c.getContext('2d');g.fillStyle='#303d39';g.fillRect(0,0,c.width,c.height);g.imageSmoothingEnabled=false;rows.forEach((r,i)=>{const s=isoSprite(r.t,r.tier),x=i%6*220,y=Math.floor(i/6)*180;g.drawImage(s.image,x+110-s.ax*1.5,y+135-s.ay*1.5,s.image.width*1.5,s.image.height*1.5);g.fillStyle='#f1e6c9';g.font='16px LowresPixel';g.fillText(B[r.t].n+' '+r.tier,x+6,y+170)});document.body.append(c)}''')
    page.locator('#iso-review').screenshot(path=str(root/'pixxo_tests/pixxo-isometrisch-sprites.png'))
    print('ISOMETRIC',result,'ERRORS',errors)
    browser.close()
