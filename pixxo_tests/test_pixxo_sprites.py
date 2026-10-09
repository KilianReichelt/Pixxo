from pathlib import Path
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    pg=b.new_page(viewport={'width':1440,'height':1000});errors=[]
    pg.on('pageerror',lambda e:errors.append(str(e)))
    pg.goto((Path(__file__).resolve().parent.parent/'pixxo.html').as_uri())
    data=pg.evaluate('''()=>{G.speed=0;closeWin('tutorial');const rows=Object.keys(B).flatMap(type=>Array.from({length:type==='haus'?3:type==='kontor'?4:1},(_,i)=>({type,tier:i+1,name:typeSprite(type,i+1)}))).map(row=>({...row,url:SP[row.name].toDataURL(),w:SP[row.name].width,h:SP[row.name].height}));const duplicates=rows.filter((row,i)=>rows.some((r,j)=>j<i&&r.url===row.url));const c=document.createElement('canvas');c.id='sprite-review';c.width=1200;c.height=Math.ceil(rows.length/6)*170;c.style.cssText='position:fixed;inset:0;z-index:99999;background:#313b2d';const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.fillStyle='#313b2d';ctx.fillRect(0,0,c.width,c.height);rows.forEach((r,i)=>{const x=i%6*200,y=Math.floor(i/6)*170;ctx.drawImage(SP[r.name],x+60,y+8,SP[r.name].width*2,SP[r.name].height*2);ctx.fillStyle='#fff4dc';ctx.font='16px LowresPixel';ctx.fillText(B[r.type].n+' '+r.tier,x+5,y+158)});document.body.append(c);return {count:rows.length,duplicates:duplicates.map(r=>r.name),werft:SP.b_werft!==SP.b_kontor,spice:SP.b_gewuerzfarm!==SP.b_farm}}''')
    assert data['duplicates']==[] and data['werft'] and data['spice']
    pg.locator('#sprite-review').screenshot(path=str(Path(__file__).parent/'pixxo-building-sprites.png'))
    print('SPRITES',data,'ERRORS',errors);assert not errors
    b.close()
