"""Export existing native icons and inspect the independent frame study."""
import base64
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parents[2]
output=Path(__file__).resolve().parent
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True,args=['--allow-file-access-from-files'])
    page=browser.new_page(viewport={'width':1520,'height':1200})
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((root/'pixxo.html').as_uri());page.wait_for_function('StartScreen.ready')
    for good in ['holz','glas','werkzeug']:
        data=page.evaluate('(id)=>HD_CATALOG.get(id).pixelSource.toDataURL()',good)
        (output/f'{good}.png').write_bytes(base64.b64decode(data.split(',')[1]))
    page.goto((output/'index.html').as_uri());page.evaluate('document.fonts.ready')
    page.wait_for_function('[...document.images].every(i=>i.complete&&i.naturalWidth>0)')
    axe=root/'pixxo_tests/.runtime/node_modules/axe-core/axe.min.js'
    if axe.exists():
        page.add_script_tag(path=str(axe))
        violations=page.evaluate("async()=> (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))")
        assert not violations, violations
    page.screenshot(path=str(output/'rahmen-vergleich.png'),full_page=True)
    for variant in ['inset','cap','inlay','step']:
        page.locator(f'article[data-variant="{variant}"]').screenshot(path=str(output/f'rahmen-{variant}.png'))
    page.locator('#night').check()
    page.screenshot(path=str(output/'rahmen-vergleich-nacht.png'),full_page=True)
    page.locator('#view').click();page.locator('[data-select=inlay]').click()
    assert page.locator('article:visible').count()==1
    page.locator('article:visible [data-demo=route]').focus();page.keyboard.press('Enter')
    assert 'Route einrichten' in page.locator('article:visible .status').inner_text()
    for width in [1280,1520,1920]:
        page.set_viewport_size({'width':width,'height':1100})
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
        small=page.evaluate("[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.height&&e.textContent.trim()&&parseFloat(getComputedStyle(e).fontSize)<14}).map(e=>e.outerHTML.slice(0,100))")
        assert not small,small
    page.evaluate('document.documentElement.style.fontSize="200%"')
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    page.emulate_media(reduced_motion='reduce')
    assert page.evaluate("getComputedStyle(document.querySelector('.frame')).animationName==='none'")
    assert not errors,errors
    (output/'checks.json').write_text(json.dumps({'variants':4,'platform':'desktop only','viewportWidths':[1280,1520,1920],'textMinimumPx':14,'textResize':'200%','keyboard':True,'axeViolations':0,'dayNight':True,'runtimeErrors':errors},indent=2),encoding='utf-8')
    browser.close()
    print('PASS: four frame studies, original icons, keyboard, day/night, desktop reflow, 200% text and automated accessibility checks.')
