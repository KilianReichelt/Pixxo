from pathlib import Path
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    pg=b.new_page(viewport={'width':1440,'height':1000});errors=[]
    pg.on('pageerror',lambda e:errors.append(str(e)))
    pg.goto((Path(__file__).resolve().parent.parent/'pixxo.html').as_uri())
    pg.evaluate('closeWin("tutorial");activeIsland=0;newGame(1234);resetWorld();G.speed=0;afterNewWorld()')
    result=pg.evaluate('''() => ISLANDS.map((m,i)=>({i,nodes:unsettledDeposits(i).map(n=>{const a=n.anchor,d=B[n.type],s=a.side;const cells=s==='north'||s==='south'?Array.from({length:d.w},(_,j)=>[n.x+j,s==='north'?n.y-1:n.y+d.h]):Array.from({length:d.h},(_,j)=>[s==='west'?n.x-1:n.x+d.w,n.y+j]);return {type:n.type,anchor:!!mountainMassifs[IDX(a.x,a.y)],contact:cells.filter(([x,y])=>mountainMassifs[IDX(x,y)]&&[T.ROCK,T.ORE].includes(G.tiles[IDX(x,y)])).length,flat:footprintCells(n.x,n.y,d.w,d.h).every(([x,y])=>BUILDABLE(G.tiles[IDX(x,y)]))}})}))''')
    assert all(n['anchor'] and n['contact']>=2 and n['flat'] for row in result for n in row['nodes'])
    assert all(not row['nodes'] for row in result[12:20])
    pg.evaluate('const n=G.deposits.find(n=>n.type==="mine");centerOn(n.x+1,n.y);UI.z=2;UI.sc=2*UI.DR')
    pg.screenshot(path=str(Path(__file__).parent/'pixxo-massif-docking.png'))
    pg.evaluate('const n=G.deposits.find(n=>n.type==="mine");clickTile({x:n.anchor.x,y:n.anchor.y})')
    assert pg.get_by_role('dialog',name='Abbauplatz am Gebirgsrand',exact=True).count()==1
    print('MASSIF DOCKING',[(r['i'],len(r['nodes'])) for r in result],'ERRORS',errors);assert not errors
    b.close()
