"""Die Menüvorschau aus einer regulär gespielten, isolierten Partie rendern."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe", headless=True)
    page = browser.new_page(viewport={"width": 2400, "height": 1600})
    capture_only=os.environ.get('PIXXO_SHOWCASE_CAPTURE_ONLY')=='1'
    resume=capture_only or os.environ.get('PIXXO_SHOWCASE_RESUME')=='1'
    if resume:
        played=(root/'pixxo_tests/showcase-played-save.json').read_text(encoding='utf-8')
    page.on("console", lambda message: print(message.text, flush=True) if message.type == "log" else None)
    page.goto((root / "pixxo.html").as_uri())
    page.wait_for_function("StartScreen.ready")
    if resume:
        page.evaluate('(played)=>{localStorage.setItem(SAVEKEY,played);startRender();}',played)
    page.locator('[data-start="continue"]' if resume else '[data-start="new"]').click()
    page.wait_for_function("StartScreen.started")
    if capture_only:
        summary=page.evaluate('({time:G.time,population:totalPop(),citizens:empireTier(2)})')
    else:
        page.add_script_tag(path=str(root / "pixxo_tests/build_showcase.js"))
        summary = page.evaluate("playShowcase(Number(" + os.environ.get("PIXXO_SHOWCASE_SEED", "7341") + ")," + os.environ.get("PIXXO_SHOWCASE_MINUTES", "160") + "," + ('true' if resume else 'false') + ")")
    print(json.dumps(summary, ensure_ascii=False), flush=True)
    if not capture_only:
        with page.expect_download() as exported:
            page.evaluate('pixxoExportSave()')
        exported.value.save_as(str(root / 'pixxo_tests/showcase-played-save.json'))
    assert summary["citizens"] >= 1, "Die Beispielpartie hat die Bürgerstufe noch nicht erreicht."
    page.evaluate("""() => {
        setSpeed(0);tutorialPanel.hidden=true;for(const id in WINS)closeWin(id);
        const homes=G.blds.filter(b=>b.type==='haus'),x=homes.reduce((n,b)=>n+cx(b),0)/homes.length,y=homes.reduce((n,b)=>n+cy(b),0)/homes.length;
        centerOn(x,y);setZoom(1.6,innerWidth/2,innerHeight/2);WORLD.dayClock.minutes=720;WORLD.dayClock.enabled=false;WORLD.dayClock.system=false;
        UI.sel=null;UI.hover=null;UI.ghostT=null;setTool(null);render();
    }""")
    page.add_style_tag(content="body > :not(#cv):not(script):not(style){visibility:hidden!important} #cv{outline:none!important}")
    page.screenshot(path=str(root / "assets/start-world.png"))
    print("Echte Spielwelt als assets/start-world.png gerendert.", flush=True)
    browser.close()
