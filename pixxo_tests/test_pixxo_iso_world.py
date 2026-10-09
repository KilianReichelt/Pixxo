from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    page=b.new_page(viewport={'width':1440,'height':1000});errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((root/'pixxo_isometrisch.html').as_uri());page.evaluate('G.speed=0;for(const id in WINS)closeWin(id)')
    data=page.evaluate('''()=>{WORLD.fog.islands.fill(true);WORLD.fog.cells.fill(255);fogDirty=true;centerOn(MAPW/2,MAPH/2);UI.z=.1;UI.sc=.1*UI.DR;render();const timings=[];for(let i=0;i<5;i++){render();timings.push(ISO.frameMs)}return {timings,projection:[[0,0],[MAPW,0],[0,MAPH],[MAPW,MAPH]].map(([x,y])=>{const p=isoScreen(x,y),q=scr2w(p.x,p.y);return Math.hypot(q.x/16-x,q.y/16-y)}),back:Array.from({length:5},(_,i)=>SP['stollen_back'+i].toDataURL()),wind:Array.from({length:8},(_,i)=>isoSprite('muehle',1,0,i).image.toDataURL())}}''')
    assert max(data['projection'])<.00001 and len(set(data['back']))==5 and len(set(data['wind']))>=4
    assert sum(data['timings'])/5<150
    page.screenshot(path=str(root/'pixxo_tests/pixxo-isometrisch-welt.png'))
    for filename in ['pixxo.html','pixxo_isometrisch.html']:
        pg=b.new_page();pg.goto((root/filename).as_uri())
        assert pg.evaluate("Object.keys(SP).filter(k=>/^stollen_back[0-4]$/.test(k)).length")==5
        assert "a.side==='south'?'back'" in (root/filename).read_text(encoding='utf-8')
        pg.close()
    print('WORLD',{'frameMs':data['timings'],'projectionError':max(data['projection']),'backFrames':5,'windFrames':len(set(data['wind']))},'ERRORS',errors);assert not errors
    b.close()
