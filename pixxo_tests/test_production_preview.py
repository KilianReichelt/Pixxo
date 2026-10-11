"""Production recipe hover/focus graph, missing fertility and placement cursor."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    page=browser.new_page(viewport={'width':1440,'height':1000})
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((root/'pixxo.html').as_uri());page.wait_for_function('StartScreen.ready');page.locator('[data-start=new]').click();page.wait_for_function('StartScreen.started')
    page.evaluate('tutorialFinish();setSpeed(0);G.gold=100000;for(const k in G.stock)G.stock[k]=10000;WORLD.highestTier=4;islandMeta().fert=[];UI.cat=B.seifensiederei.cat;renderItems(true)')
    print(page.evaluate("""()=>{const g=productionGraph('seifensiederei');for(const good of ['blueten','gewuerz','glas','seife'])if(!g.goods.includes(good))throw Error('Missing ingredient '+good);for(const input of ['blueten','gewuerz','glas'])if(!g.edges.some(([a,b])=>a===input&&b==='seife'))throw Error('Missing recipe edge');if(!g.blocked.has('gewuerz'))throw Error('Missing fertility not marked');return {goods:g.goods,edges:g.edges};}"""))
    card=page.locator('[data-b=seifensiederei]');card.scroll_into_view_if_needed();card.hover()
    page.wait_for_function('!productionPreview.hidden')
    assert page.locator('#production-preview svg').get_attribute('aria-label').find('Fruchtbarkeit fehlt')>=0
    assert page.locator('#production-preview circle[r="25"]').count()==1
    assert page.locator('#production-preview path[stroke="#ff7161"]').count()>=1
    assert page.locator('#production-preview svg > g:first-of-type path').evaluate_all("paths=>paths.every(p=>!/[LCQ]/.test(p.getAttribute('d')))")
    page.locator('#production-preview').screenshot(path=str(root/'pixxo_tests/production-chain-soap.png'))
    node=page.locator('#production-preview [data-good=glas]').first
    node.hover();page.wait_for_timeout(500)
    assert page.locator('#production-node-name').inner_text()=='Glas'
    assert page.locator('#production-preview').is_visible()
    node.focus();assert page.locator('#production-node-name').inner_text().startswith('Glas')
    page.locator('#production-preview').hover();page.wait_for_timeout(220)
    assert page.locator('#production-preview').is_visible()
    page.keyboard.press('Escape');assert page.locator('#production-preview').is_hidden()
    page.evaluate('showProductionPreview(document.querySelector("[data-b=seifensiederei]"))')
    page.mouse.move(1,1)
    assert page.locator('#production-preview').is_hidden()
    page.evaluate('showProductionPreview(document.querySelector("[data-b=seifensiederei]"))')
    for width in [1440,768,320]:
        page.set_viewport_size({'width':width,'height':1000})
        page.wait_for_function("()=>{const r=productionPreview.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1}")
    page.evaluate('document.documentElement.style.fontSize="200%";positionProductionPreview()')
    assert page.evaluate('productionPreview.getBoundingClientRect().right<=innerWidth+1')
    page.evaluate('document.documentElement.style.fontSize=""')
    page.set_viewport_size({'width':1440,'height':1000})
    if os.environ.get('PIXXO_AXE_SCRIPT'):
        page.add_script_tag(path=os.environ['PIXXO_AXE_SCRIPT'])
        violations=page.evaluate("async()=> (await axe.run('#production-preview',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))")
        assert not violations,violations
    page.evaluate('UI.cat=B.weberei.cat;renderItems(true);showProductionPreview(document.querySelector("[data-b=weberei]"))')
    assert page.evaluate('productionPreview.scrollHeight<=productionPreview.clientHeight+1'),page.evaluate('({content:productionPreview.scrollHeight,height:productionPreview.clientHeight})')
    page.locator('#production-preview').screenshot(path=str(root/'pixxo_tests/production-chain-weaving.png'))
    page.locator('#production-preview [data-good=blueten]').first.hover()
    assert page.locator('#production-node-name').inner_text()=='Blüten'
    page.evaluate('hideProductionPreview();UI.cat=B.holzfaeller.cat;renderItems(true)')
    page.locator('[data-b=holzfaeller]').focus()
    assert page.locator('#production-preview').is_visible()
    page.evaluate('UI.cat=null;renderItems(true)');assert page.locator('#production-preview').is_hidden()
    page.evaluate('setTool("build","haus")')
    assert page.evaluate('UI.cursorMode')=='default'
    assert page.evaluate('cv.style.getPropertyValue("--pixxo-world-cursor")===PIXXO_CURSORS.default.css')
    for mode in ['path','stone','woodbridge','stonebridge']:
        page.evaluate('(mode)=>{UI.roadMode=mode;setTool("road")}',mode)
        assert page.evaluate('UI.cursorMode')=='road_'+mode
    assert page.evaluate('new Set(["path","stone","woodbridge","stonebridge"].map(m=>PIXXO_CURSORS["road_"+m].canvas.toDataURL())).size===4')
    page.emulate_media(reduced_motion='reduce')
    assert page.evaluate('productionGraph("tischlerei").edges.some(([a,b])=>a==="werkzeug"&&b==="moebel")')
    for mode in ['build','deko','fleet']:
        page.evaluate('(mode)=>{UI.barMode=mode;renderBar()}',mode)
        assert page.evaluate("[...document.querySelectorAll('#bar .cb')].every(e=>{const s=getComputedStyle(e);return s.alignItems==='center'&&s.justifyContent==='center'&&s.textAlign==='center'})")
    print(page.evaluate("""()=>{
      let checked=0;for(const [type,d] of Object.entries(B)){
        if(!d.out||!Object.keys(d.out).length)continue;
        const card=document.createElement('button');card.dataset.b=type;showProductionPreview(card);
        const points=[...productionPreview.querySelectorAll('[data-good]')].map(e=>{const m=e.transform.baseVal.getItem(0).matrix;return {x:m.e,y:m.f};});
        for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++)if(Math.hypot(points[i].x-points[j].x,points[i].y-points[j].y)<51)throw Error('Overlapping nodes '+type);
        const segments=[...productionPreview.querySelectorAll('svg > g:first-of-type path')].map(e=>{const d=e.getAttribute('d'),n=d.match(/-?[0-9.]+/g).map(Number);return d.includes(' H ')?{x1:n[0],y1:n[1],x2:n[2],y2:n[1]}:{x1:n[0],y1:n[1],x2:n[0],y2:n[2]};});
        for(const h of segments.filter(s=>s.y1===s.y2))for(const v of segments.filter(s=>s.x1===s.x2))if(v.x1>Math.min(h.x1,h.x2)&&v.x1<Math.max(h.x1,h.x2)&&h.y1>Math.min(v.y1,v.y2)&&h.y1<Math.max(v.y1,v.y2))throw Error('Crossed recipe branches '+type);
        checked++;
      }hideProductionPreview();return {layoutsWithoutOverlaps:checked};
    }"""))
    assert not errors,errors
    browser.close()
    print('PASS: Recipe graph, hover/focus/Escape, fertility, viewport/reflow, Axe and default placement cursor.')
