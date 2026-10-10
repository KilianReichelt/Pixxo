"""Export a separate advanced inspection save in a temporary browser profile."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True,args=['--allow-file-access-from-files'])
    page=browser.new_page(viewport={'width':1600,'height':1000},accept_downloads=True)
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('console',lambda m:print(m.text,flush=True) if m.type=='log' else None)
    page.goto((root/'pixxo.html').as_uri());page.wait_for_function('StartScreen.ready')
    page.evaluate("""()=>{let state=7341;Math.random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};}""")
    page.locator('[data-start=new]').click();page.wait_for_function('StartScreen.started')
    page.add_script_tag(path=str(root/'pixxo_tests/build_advanced_demo.js'))
    summary=page.evaluate('buildAdvancedDemo()')
    print(json.dumps(summary,ensure_ascii=False),flush=True)
    with page.expect_download() as exported:
        page.evaluate('pixxoExportSave()')
    exported.value.save_as(str(root/'Pixxo_Demo_Flussstadt.json'))
    page.screenshot(path=str(root/'pixxo_tests/advanced-demo.png'))
    # The exported file must survive the same import/load path used by players.
    save=(root/'Pixxo_Demo_Flussstadt.json').read_text(encoding='utf-8')
    assert page.evaluate('pixxoImportSave',save)
    assert page.evaluate("""()=>{setSpeed(0);const p=G.blds.find(b=>b.type==='ausstellungspalast'),r=G.blds.find(b=>b.type==='rathaus');return WORLD.highestTier===4&&G.blds.filter(b=>b.type==='haus').length===48&&CIVIC_CHAINS.every(([t])=>G.blds.some(b=>b.type===t))&&p.project.stage===2&&p.project.active&&r.project.stage===3&&Object.values(G.bridges).some(b=>b.part==='deck')&&Object.values(G.bridges).every(b=>Math.abs(b.dx)+Math.abs(b.dy)===1)&&G.riverIslands.includes(activeIsland)&&G.river===WORLD.board.river;}""")
    assert not errors,errors
    print('PASS: advanced save exported, reimported and verified; personal saves untouched.',flush=True)
    browser.close()
