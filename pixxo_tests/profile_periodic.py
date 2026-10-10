"""Periodische CPU-Bauplanung in isolierter ausgebauter Testwelt messen."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    page=browser.new_page()
    page.goto((root/'pixxo.html').as_uri());page.wait_for_function('StartScreen.ready')
    page.evaluate('(save)=>{localStorage.setItem(SAVEKEY,save);startRender();}',(root/'pixxo_tests/showcase-played-save.json').read_text(encoding='utf-8'))
    page.locator('[data-start=continue]').click();page.wait_for_function('StartScreen.started')
    page.evaluate('tutorialFinish();setSpeed(0)')
    print(json.dumps(page.evaluate("""()=>{
        const stats={};for(const name of ['cpuBuild','plannedRoadPath','canPlace','saveGame','rebuildNet']){const fn=eval(name);stats[name]={calls:0,max:0,total:0};eval(name+'=function(...args){const start=performance.now();try{return fn(...args)}finally{const t=performance.now()-start,s=stats[name];s.calls++;s.max=Math.max(s.max,t);s.total+=t}}');}
        const runs=[];for(const g of WORLD.islands.filter(g=>g?.cpu))withCPU(g,()=>{
            G.gold=100000;for(const good of Object.keys(GN))G.stock[good]=999;G.cpu.age=500;
            for(const type of ['feuer','markt','haus','holzfaeller']){const t=performance.now();let built=cpuBuild(type),slices=1;
                while(typeof CPU_BUILD_JOBS!=='undefined'&&CPU_BUILD_JOBS.has(G)&&slices<1000){CPU_BUILD_JOBS.get(G).nextAt=0;built=cpuBuild(type)||built;slices++;}
                if(typeof CPU_BUILD_JOBS!=='undefined'&&CPU_BUILD_JOBS.has(G))throw Error('CPU-Suche beendet nicht');
                runs.push({island:g.island,type,ms:performance.now()-t,built:!!built,slices});}
        });return {runs,stats};
    }"""),ensure_ascii=False,indent=2),flush=True)
    browser.close()
