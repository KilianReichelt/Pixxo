"""LOD gates and bounded terrain work on the real 864-resident Full-HD save."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True,args=['--allow-file-access-from-files'])
    page=browser.new_page(viewport={'width':1920,'height':1080})
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((root/'pixxo.html').as_uri());page.wait_for_function('StartScreen.ready')
    page.evaluate('(s)=>{localStorage.setItem(SAVEKEY,s);startRender()}',(root/'Pixxo_Demo_Flussstadt.json').read_text(encoding='utf-8'))
    page.locator('[data-start=continue]').click();page.wait_for_function('StartScreen.started&&!StartScreen.loading')
    print(page.evaluate("""()=>{
      tutorialFinish();setSpeed(0);const home=G.blds.find(b=>b.type==='haus');centerOn(cx(home),cy(home));UI.sel=null;setTool(null);
      const check=(ok,message)=>{if(!ok)throw Error(message)},original={spName,streetPeople,bubbleFor,terrainChunk},counts={sprites:0,people:0,bubbles:0,misses:0};
      spName=function(...a){counts.sprites++;return original.spName(...a)};streetPeople=function(...a){counts.people++;return original.streetPeople(...a)};bubbleFor=function(...a){counts.bubbles++;return original.bubbleFor(...a)};
      terrainChunk=function(x,y){if(!land.chunks.has(x+':'+y))counts.misses++;return original.terrainChunk(x,y)};
      try{
        setZoom(.75,innerWidth/2,innerHeight/2);render();check(ENT.some(e=>e[1]===0)&&counts.people>0&&counts.sprites>0,'Detail rendering missing');
        counts.people=0;setZoom(.5,innerWidth/2,innerHeight/2);render();check(counts.people===0&&!ENT.some(e=>e[1]===5),'People retained at neighbourhood zoom');
        setZoom(.451,innerWidth/2,innerHeight/2);land.chunks.clear();for(let i=0;i<120;i++)render();counts.misses=0;for(let i=0;i<5;i++)render();check(counts.misses===0,'Visible terrain still evicted every frame');
        check(land.chunks.size<=LAND_CACHE_LIMIT&&[...land.chunks.values()].every(a=>a.width<=256&&a.height<=256),'Terrain cache not native / bounded');
        const overviewCounts=[];
        for(const zoom of [.4,.2,.05]){setZoom(zoom,innerWidth/2,innerHeight/2);Object.assign(counts,{sprites:0,people:0,bubbles:0});render();check(!ENT.some(e=>[0,2,5].includes(e[1])),'Overview keeps trees, carts or people');check(counts.sprites===0&&counts.people===0&&counts.bubbles===0,'Overview keeps detailed buildings or bubbles');overviewCounts.push({zoom,buildings:ENT.filter(e=>e[1]===1).length});}
        Object.assign(dayClock(),{minutes:0,enabled:false,system:false});counts.sprites=0;render();check(counts.sprites===0,'Night panes regenerate detailed overview sprites');
        // Every type, including decoration and disabled legacy monuments, follows the same gate.
        const ctx=cv.getContext('2d');for(const type of Object.keys(B))drawBld(ctx,{type,x:home.x,y:home.y,w:B[type].w,h:B[type].h,tier:4,fire:0});check(counts.sprites===0,'A building type bypasses overview');
        check(nextTierReq(home)!==undefined,'Gameplay state changed by LOD');
        return {population:totalPop(),terrainCache:land.chunks.size,cacheLimit:LAND_CACHE_LIMIT,overviewCounts,allBuildingTypes:Object.keys(B).length};
      }finally{spName=original.spName;streetPeople=original.streetPeople;bubbleFor=original.bubbleFor;terrainChunk=original.terrainChunk;}
    }"""))
    assert not errors,errors
    print('PASS: people/tree/bubble/building/night LOD; every visible terrain chunk remains cached.')
    browser.close()
