"""Isolierte, wiederholbare Messung der Spielarbeiten, kein Nutzerspielstand."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    page=browser.new_page(viewport={'width':1440,'height':1000})
    page.goto((root/'pixxo.html').as_uri());page.wait_for_function('StartScreen.ready')
    played=(root/'pixxo_tests/showcase-played-save.json').read_text(encoding='utf-8')
    page.evaluate('(save)=>{localStorage.setItem(SAVEKEY,save);startRender();}',played)
    page.locator('[data-start=continue]').click();page.wait_for_function('StartScreen.started')
    page.evaluate('tutorialFinish();setSpeed(0);dayClock().system=false;dayClock().minutes=1200;UI.z=1;UI.sc=UI.DR')
    result=page.evaluate("""() => {
        const stats={};for(const name of ['render','stepWorld','cpuDecision','cpuBuild','cpuFields','canPlace','rebuildNet','drawMini','saveGame','terrainChunk','drawWorldFog']){
            const fn=eval(name);stats[name]={calls:0,total:0,max:0};eval(name+'=function(...args){const start=performance.now();try{return fn(...args)}finally{const elapsed=performance.now()-start,s=stats[name];s.calls++;s.total+=elapsed;s.max=Math.max(s.max,elapsed)}}');
        }
        for(let i=0;i<30;i++)render();for(let i=0;i<5;i++)drawMini();saveGame();
        for(const g of WORLD.islands)if(g?.cpu){g.cpu.age=Math.max(300,g.cpu.age);g.cpu.decision=60;}
        for(let i=0;i<20;i++)stepWorld(.05);
        return {buildings:worldBuildings().length,cpu:WORLD.islands.filter(g=>g?.cpu).length,stats};
    }""")
    print(json.dumps(result,ensure_ascii=False,indent=2));browser.close()
