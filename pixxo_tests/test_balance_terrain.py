from pathlib import Path
import json
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    page=browser.new_page(); errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((root/'pixxo.html').as_uri())
    rows=page.evaluate('''()=>{
      const rows=[],random=Math.random;
      for(const seed of [1234,3074,55172,975321,42,713,555,2026]){
        let rnd=seed>>>0;Math.random=()=>{rnd+=0x6d2b79f5;let t=rnd;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296};
        startNew();G.speed=0;for(const id in WINS)closeWin(id);
        // Nur Bauplatzprüfung: ausreichend Geld und Material für canPlace.
        G.gold=100000;for(const good of GOODS)G.stock[good.id]=1000;
        const m=ISLANDS[activeIsland],sites={};
        for(const type of ['haus','holzfaeller','saegewerk','markt','fischer','steinbruch']){
          let found=null;
          if(type==='steinbruch')found=G.deposits.find(d=>d.type===type&&(canPlace(type,d.x,d.y).ok||canPlace(type,d.x,d.y).why==='Außerhalb des Baugebiets'));
          else for(let y=m.oy;y<m.oy+112&&!found;y++)for(let x=m.ox;x<m.ox+112;x++)if(canPlace(type,x,y).ok){found={x,y};break}
          if(!found)throw Error('Kein Bauplatz für '+type+' bei Start '+seed+': '+JSON.stringify(G.deposits.filter(d=>d.type===type).map(d=>({x:d.x,y:d.y,result:canPlace(type,d.x,d.y)}))));
          sites[type]={x:found.x,y:found.y,requiresWarehouse:!canPlace(type,found.x,found.y).ok};
        }
        rows.push({seed,island:activeIsland,sites});
      }
      Math.random=random;return rows;
    }''')
    print(json.dumps(rows,ensure_ascii=False),'ERRORS',errors);assert not errors
    browser.close()
