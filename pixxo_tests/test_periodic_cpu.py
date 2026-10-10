"""Fortgesetzte CPU-Bauplanung läuft im normalen Welt-Takt fertig."""
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    page=browser.new_page()
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((root/'pixxo.html').as_uri());page.wait_for_function('StartScreen.ready')
    page.evaluate('(save)=>{localStorage.setItem(SAVEKEY,save);startRender();}',(root/'pixxo_tests/showcase-played-save.json').read_text(encoding='utf-8'))
    page.locator('[data-start=continue]').click();page.wait_for_function('StartScreen.started')
    page.evaluate('tutorialFinish();setSpeed(0)')
    print(page.evaluate("""async()=>{
        const player=G,active=activeIsland,g=WORLD.islands.filter(g=>g?.cpu)[1],fields=UI.fieldOwner;
        for(const cpu of WORLD.islands.filter(g=>g?.cpu))cpu.cpu.decision=0;
        withCPU(g,()=>{G.gold=100000;for(const good of Object.keys(GN))G.stock[good]=999;G.cpu.age=500;cpuBuild('feuer');});
        if(!CPU_BUILD_JOBS.has(g))throw Error('Keine fortsetzbare Bauplanung');
        let slices=0,max=0;while(CPU_BUILD_JOBS.has(g)&&slices<1000){await new Promise(r=>setTimeout(r,16));const start=performance.now();stepWorld(.005);max=Math.max(max,performance.now()-start);slices++;if(G!==player||activeIsland!==active||UI.fieldOwner!==fields)throw Error('CPU verändert Spielerauswahl');}
        if(CPU_BUILD_JOBS.has(g))throw Error('Bauauftrag bleibt hängen');
        withCPU(g,()=>{delete G.cpu.retries.feuer;cpuBuild('feuer');G.gold=0;cpuBuild('feuer');if(CPU_BUILD_JOBS.has(G))throw Error('Unbezahlbarer Auftrag bleibt hängen');});
        return {slices,maxWorldTickMs:max,complete:true};
    }"""))
    assert not errors,errors
    browser.close()
