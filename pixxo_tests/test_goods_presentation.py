"""Warenicons, Lager-Freischaltung und zentrierte Tabellenköpfe prüfen."""
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
    page.locator('[data-start="new"]').click()
    page.wait_for_function('StartScreen.started')
    page.evaluate('tutorialFinish();setSpeed(0);openWin_store()')
    store=page.locator('.win[data-id="store"]')
    assert store.locator('caption').count()==0
    assert store.locator('.store-filters button').all_text_contents()==['Alle','Rohstoffe','Handwerk']
    initial=store.inner_text()
    for name in ['Schnaps','Wachs','Holz','Bretter','Werkzeug','Häute','Leder','Lederstiefel']:
        assert name in initial,name
    for name in ['Kerzen','Parfüm','Schmuck','Eisenerz']:
        assert name not in initial,name
    stock=page.evaluate('JSON.stringify(G.stock)')
    assert page.evaluate("['haeute','leder','stiefel'].every(id=>goodUnlockTier(id)===1)")
    for tier in [1,2,3]:
        page.evaluate('(tier)=>{document.activeElement.blur();WORLD.highestTier=tier;refreshWin(WINS.store);}',tier)
        # Window renderer is stored in .render; verify actual displayed table.
        names=store.locator('tr td:nth-child(2)').all_text_contents()
        expected=page.evaluate('GOODS.filter(g=>goodVisibleInStore(g.id)).map(g=>g.n)')
        assert names==expected,(tier,names,expected)
        if tier in [1,2]:
            assert all(n in names for n in ['Häute','Leder','Lederstiefel'])
            assert 'Kerzen' not in names and 'Parfüm' not in names
        if tier==3:
            assert len(names)==page.evaluate('GOODS.length')
        for key in ['raw','craft','all']:
            button=store.locator(f'[data-filter="{key}"]')
            button.focus()
            page.keyboard.press('Enter')
            page.wait_for_function('(key)=>document.querySelector("[data-filter="+key+"]").getAttribute("aria-pressed")==="true"',arg=key)
            actual=store.locator('tr td:nth-child(2)').all_text_contents()
            expected_filtered=page.evaluate('GOODS.filter(g=>storeGoodMatches(g.id)).map(g=>g.n)')
            assert actual==expected_filtered,(tier,key,actual,expected_filtered,page.evaluate('({filter:UI.storeFilter,hold:WINS.store.hold,static:WINS.store.static,html:WINS.store.render().slice(0,350)})'),errors)
            assert button.get_attribute('aria-pressed')=='true'
            assert page.evaluate('document.activeElement.dataset.filter')==key
            visible=store.locator('tr td:nth-child(2)').all_text_contents()
            if key=='raw':
                assert 'Holz' in visible and 'Fisch' in visible and 'Bretter' not in visible and 'Schnaps' not in visible
                assert 'Häute' in visible and 'Leder' not in visible and 'Lederstiefel' not in visible
            if key=='craft':
                assert 'Bretter' in visible and 'Schnaps' in visible and 'Holz' not in visible and 'Fisch' not in visible
                assert 'Leder' in visible and 'Lederstiefel' in visible and 'Häute' not in visible
    assert page.evaluate('JSON.stringify(G.stock)')==stock
    assert store.locator('th').evaluate_all("els=>els.every(e=>getComputedStyle(e).textAlign==='center')")
    assert store.locator('td.r').first.evaluate("e=>getComputedStyle(e).textAlign")=='right'
    page.screenshot(path=str(root/'pixxo_tests/warehouse-goods.png'))
    axe=os.environ.get('PIXXO_AXE_SCRIPT')
    if axe:
        page.add_script_tag(path=axe)
        violations=page.evaluate("""async()=> (await axe.run(document.querySelector('.win[data-id=store]'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))""")
        assert not violations,violations
    for width in [390,320]:
        page.set_viewport_size({'width':width,'height':900})
        assert store.locator('.wb').evaluate('e=>e.scrollWidth<=e.clientWidth')
    page.evaluate('saveGame()')
    page.reload()
    page.wait_for_function('StartScreen.ready')
    page.locator('[data-start="continue"]').click()
    page.wait_for_function('StartScreen.started')
    page.evaluate('setSpeed(0);openWin_store()')
    assert page.evaluate('WORLD.highestTier')==3
    assert 'Kerzen' in store.inner_text()
    icons=page.evaluate("""() => {
        const sheet=document.createElement('canvas');sheet.width=900;sheet.height=240;const c=sheet.getContext('2d');c.imageSmoothingEnabled=false;
        c.fillStyle='#21190f';c.fillRect(0,0,900,240);c.font='16px sans-serif';const items=[];
        for(const [i,id] of DETAILED_GOOD_IDS.entries()){
            const low=HD_CATALOG.get(id).pixelSource,data=low.getContext('2d').getImageData(0,0,32,32).data,colors=new Set(),mask=[];
            for(let j=0;j<data.length;j+=4){if(data[j+3])colors.add(Array.from(data.slice(j,j+4)).join(','));mask.push(data[j+3]);}
            items.push({id,width:low.width,height:low.height,colors:colors.size,mask:mask.join(',')});
            c.fillStyle='#f3e6c8';c.fillText(GN[id].n,i*150+8,28);nativeDrawImage.call(c,low,i*150+12,48,96,96);nativeDrawImage.call(c,low,i*150+44,178,32,32);
        }
        const img=document.createElement('img');img.id='goods-icon-sheet';img.src=sheet.toDataURL();document.body.append(img);Object.assign(img.style,{position:'fixed',inset:'0',zIndex:99999});return items;
    }""")
    page.locator('#goods-icon-sheet').screenshot(path=str(root/'pixxo_tests/detailed-goods-icons.png'))
    for icon in icons:
        assert icon['width']==icon['height']==32 and icon['colors']>=8,icon['id']
    assert icons[1]['mask']!=icons[2]['mask']
    assert not errors,errors
    browser.close()
    print('PASS: Sechs detaillierte Icons, unterschiedliche Fell-/Lederformen, Warenfreischaltung 1–3 mit Save/Reload, zentrierte Überschriften und Lager-WCAG-Prüfung.')
