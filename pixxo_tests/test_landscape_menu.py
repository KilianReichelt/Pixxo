"""Landschaftsvariation, Terrain-Caches und kompaktes Spielmenü prüfen."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    page=browser.new_page(viewport={'width':1440,'height':1000})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((root/'pixxo.html').as_uri())
    page.wait_for_function('StartScreen.ready')
    played=(root/'pixxo_tests/showcase-played-save.json').read_text(encoding='utf-8')
    page.evaluate('(save)=>{localStorage.setItem(SAVEKEY,save);startRender();}',played)
    page.locator('[data-start="continue"]').click()
    page.wait_for_function('StartScreen.started')
    page.evaluate('tutorialFinish();setSpeed(0);dayClock().minutes=720;dayClock().system=false')
    data=page.evaluate("""() => {
        const trees=new Set(),grass=new Set(),tiles=Array.from(G.tiles),before=LANDSCAPE_CACHE.size;
        for(let y=10;y<60;y++)for(let x=10;x<60;x++){
            const tree=landscapeTreeSprite(x,y),tile=landscapeGrassSprite(x,y);
            if(tree!==landscapeTreeSprite(x,y)||tile!==landscapeGrassSprite(x,y))throw Error('Instabile Variante');
            trees.add(tree);grass.add(tile);
        }
        for(let y=10;y<60;y++)for(let x=10;x<60;x++)landscapeGrassSprite(x,y,true);
        if(tiles.some((v,i)=>v!==G.tiles[i]))throw Error('Terrain verändert');
        return {trees:trees.size,grass:grass.size,cache:LANDSCAPE_CACHE.size};
    }""")
    assert data['trees']==32 and data['grass']==48 and data['cache']<=80,data
    # Actual native game scene: same played save, no artificial buildings.
    page.evaluate("""() => {
        const homes=G.blds.filter(b=>b.type==='haus');centerOn(homes.reduce((s,b)=>s+cx(b),0)/homes.length,homes.reduce((s,b)=>s+cy(b),0)/homes.length);
        UI.z=1.3;UI.sc=UI.z*UI.DR;render();
    }""")
    page.screenshot(path=str(root/'pixxo_tests/landscape-houses.png'))
    fog=page.evaluate("""() => {
        const sample=()=>Array.from(fogChunk(0,0).getContext('2d').getImageData(0,0,1,1).data);
        dayClock().minutes=720;const day=sample();dayClock().minutes=0;const night=sample();dayClock().minutes=720;
        return {day,night};
    }""")
    assert sum(fog['night'][:3])<sum(fog['day'][:3]) and fog['night'][3]==fog['day'][3],fog
    page.evaluate('openWin_menu()')
    menu=page.locator('.win[data-id="menu"]')
    for action in ['start-home','start-settings','start-credits','save','new','save-export','save-import','tutorial-open']:
        assert menu.locator(f'[data-act="{action}"]').is_visible(),action
    assert not menu.locator('details,.zoomlabel,.logline').count()
    assert menu.locator('.wb').evaluate('e=>e.scrollHeight<=e.clientHeight')
    axe=os.environ.get('PIXXO_AXE_SCRIPT')
    if axe:
        page.add_script_tag(path=axe)
        violations=page.evaluate("""async()=> (await axe.run(document.querySelector('.win[data-id=menu]'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))""")
        assert not violations,violations
    page.screenshot(path=str(root/'pixxo_tests/compact-game-menu.png'))
    assert menu.locator('#music-volume').is_visible()
    for key in ['music','effects','ambient']:
        label=menu.locator(f'label[for="{key}-volume"]').bounding_box()
        slider=menu.locator(f'#{key}-volume').bounding_box()
        assert abs(label['y']+label['height']/2-slider['y']-slider['height']/2)<1
    for width in [390,320]:
        page.set_viewport_size({'width':width,'height':900})
        assert menu.evaluate('e=>e.getBoundingClientRect().right<=innerWidth')
        assert menu.locator('.wb').evaluate('e=>e.scrollWidth<=e.clientWidth')
    page.evaluate('closeWin("menu");openWin_store()')
    store=page.locator('.win[data-id="store"]')
    assert store.locator('.tbl').evaluate('e=>getComputedStyle(e).tableLayout')=='fixed'
    page.set_viewport_size({'width':1440,'height':1000})
    first=store.locator('th').nth(1).bounding_box()['width']
    store.evaluate("e=>e.style.setProperty('--store-name-width','35%')")
    assert store.locator('th').nth(1).bounding_box()['width']>first
    assert not errors,errors
    browser.close()
    print('PASS: 32 Baumfarben/-formen, 48 Wiesenvarianten, stabile Caches, Nachtnebel, kompaktes Menü und einstellbare Lager-Spalten.')
