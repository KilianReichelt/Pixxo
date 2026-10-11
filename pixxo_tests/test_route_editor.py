"""Real route button, circular cargo orders, multiple ships and accessible full-screen UI."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    page=browser.new_page(viewport={'width':1920,'height':1080})
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((root/'pixxo.html').as_uri());page.wait_for_function('StartScreen.ready')
    page.locator('[data-start=new]').click();page.wait_for_function('StartScreen.started');page.evaluate('tutorialFinish();setSpeed(0)')
    page.evaluate("""()=>{WORLD.fleet=[{id:9001,type:'schooner',name:'Möwe',at:activeIsland,cargo:[],phase:'idle',remaining:0,buildLeft:0},{id:9002,type:'clipper',name:'Seestern',at:activeIsland,cargo:[],phase:'idle',remaining:0,buildLeft:0}];WORLD.routes=[];selectShip(9001)}""")
    page.locator('[data-act=ship-plan-route]').focus();page.keyboard.press('Enter')
    assert page.locator('#trade-route-dialog').is_visible()
    assert page.locator('#routeform [type=submit]').is_disabled()
    page.locator('.trade-save-blocked').focus()
    assert page.locator('#trade-save-help').is_visible()
    assert page.locator('#trade-save-help').inner_text()=='Für eine Route musst du mindestens zwei Inseln besiedelt haben'
    assert page.locator('.trade-options').is_visible()
    assert page.locator('.trade-options summary').count()==0
    assert page.locator('[name=reserve]').is_visible()
    assert page.evaluate("[...document.querySelectorAll('.trade-checkbox input')].every(e=>e.getBoundingClientRect().width===20&&e.getBoundingClientRect().height===20)")
    page.locator('.trade-help').first.focus()
    assert page.locator('.trade-help-wrap').first.locator('[role=tooltip]').is_visible()
    page.keyboard.press('Escape')
    assert page.locator('#trade-route-dialog').is_visible()
    assert not page.locator('.trade-help-wrap').first.locator('[role=tooltip]').is_visible()
    page.locator('[name=reserve]').focus()
    assert page.locator('[data-mode=unload]').first.is_disabled()
    assert page.evaluate("()=>{const l=document.querySelector('.trade-route-left').getBoundingClientRect(),r=document.querySelector('.trade-route-right').getBoundingClientRect();return Math.abs(l.width/innerWidth-.4)<.01&&Math.abs(r.width/innerWidth-.6)<.01}")
    page.keyboard.press('Escape')
    assert page.evaluate("document.activeElement.matches('[data-act=ship-plan-route]')")
    # Real sea paths and actual map positions; states represent three owned ports and one opponent.
    page.evaluate("""()=>{window.routeHome=activeIsland;window.routeOther=ISLANDS.findIndex((m,i)=>i!==activeIsland);window.routeThird=ISLANDS.findIndex((m,i)=>i!==activeIsland&&i!==routeOther);window.routeCPU=ISLANDS.findIndex((m,i)=>![activeIsland,routeOther,routeThird].includes(i));
      for(const i of [routeOther,routeThird,routeCPU]){const p=nearestWater(G.dock,{x:ISLANDS[i].wx,y:ISLANDS[i].wy});if(!p)throw Error('No coast');WORLD.islands[i]={...G,stock:Object.fromEntries(GOODS.map(g=>[g.id,100])),blds:[],byId:new Map(),dock:{x:p.x+.5,y:p.y+.5},cpu:i===routeCPU};WORLD.fog.islands[i]=true;}WORLD.fog.cells.fill(255);PERF_FOG.miniDirty=true;fogDirty=true;routeForm(null)}""")
    page.locator('[data-route-action=ships]').click();page.locator('[data-route-action=ship-add][data-ship="9002"]').click()
    assert page.locator('.trade-assigned-ship').count()==2
    assert page.locator('.trade-station .trade-slot').count()==4
    other=page.evaluate('routeOther');third=page.evaluate('routeThird');home=page.evaluate('routeHome');cpu=page.evaluate('routeCPU')
    assert page.locator(f'.trade-map-port[data-island="{cpu}"]').count()==0
    page.locator(f'.trade-map-port[data-island="{other}"]').click()
    page.locator(f'.trade-map-port[data-island="{third}"]').click()
    assert page.locator('.trade-station').count()==3
    assert page.locator('#routeform [type=submit]').is_enabled()
    assert page.locator('.trade-slot-number').first.inner_text()=='Frachtplatz 1'
    assert page.evaluate("[...document.querySelectorAll('.trade-map-port.selected')].every(e=>e.getBoundingClientRect().width===32&&e.getBoundingClientRect().height===32)")
    assert page.evaluate("()=>{const text=document.querySelector('.trade-reserve span').getBoundingClientRect(),input=document.querySelector('[name=reserve]').getBoundingClientRect();return Math.abs((text.top+text.bottom)/2-(input.top+input.bottom)/2)<2&&Math.abs(input.right-document.querySelector('.trade-reserve').getBoundingClientRect().right)<2}"),page.evaluate("[...document.querySelectorAll('.trade-reserve,.trade-reserve span,.trade-reserve input')].map(e=>({tag:e.tagName,class:e.className,r:e.getBoundingClientRect().toJSON(),flex:getComputedStyle(e).flex,width:getComputedStyle(e).width}))")
    def set_order(station,slot,mode,good,qty):
        page.locator(f'[data-route-action=goods][data-station="{station}"][data-slot="{slot}"][data-mode={mode}]').click()
        assert page.locator('[data-route-action=order-save]').inner_text()==('Ware laden' if mode=='load' else 'Ware entladen')
        page.locator(f'[data-route-action=pick][data-good={good}]').click()
        page.locator('[data-picker-quantity]').fill(str(qty))
        if qty<50:
            page.locator('[data-route-action=quantity-up]').click()
            assert page.locator('[data-picker-quantity]').input_value()==str(qty+1)
            page.locator('[data-route-action=quantity-down]').focus();page.keyboard.press('Enter')
            assert page.locator('[data-picker-quantity]').input_value()==str(qty)
        else:
            page.locator('[data-route-action=quantity-up]').click()
            assert page.locator('[data-picker-quantity]').input_value()=='50'
        assert page.locator('.trade-quantity-step svg').count()==2
        page.locator('[data-route-action=order-save]').click()
    # A load at the last station enables return-cargo unloading at the first station.
    set_order(2,0,'load','fisch',40)
    assert page.locator('[data-mode=unload][data-station="0"][data-slot="0"]').is_enabled()
    set_order(0,0,'unload','fisch',20)
    set_order(0,2,'load','holz',50)
    set_order(1,2,'unload','holz',50)
    page.locator('[data-route-action=goods][data-station="0"][data-slot="2"][data-mode=load]').click()
    page.locator('[data-picker-quantity]').fill('51');page.locator('[data-route-action=order-save]').click()
    assert '1 und 50' in page.locator('.trade-picker-error').inner_text()
    page.locator('[data-picker-quantity]').fill('50');page.locator('[data-route-action=order-save]').click()
    assert page.locator('[data-mode=load][data-station="0"][data-slot="2"] .trade-order-arrow').count()==1
    assert page.evaluate("()=>[...document.querySelectorAll('.trade-slot [data-mode]')].every(b=>b.querySelector('.trade-order-arrow img').src===url(b.dataset.mode==='load'?'i_cargo_down':'i_cargo_up'))")
    assert page.evaluate("()=>[...document.querySelectorAll('.trade-order-icon')].every(e=>{const arrow=e.querySelector('.trade-order-arrow').getBoundingClientRect(),cargo=e.querySelector('.trade-order-cargo').getBoundingClientRect();return arrow.bottom<=cargo.top+1&&Math.abs((arrow.left+arrow.right)/2-(cargo.left+cargo.right)/2)<1})")
    assert page.evaluate("()=>{const heights=[...document.querySelectorAll('.trade-slot .trade-icon-button')].map(e=>e.getBoundingClientRect().height);return Math.max(...heights)-Math.min(...heights)<1}")
    assert page.evaluate("()=>[...document.querySelectorAll('.trade-slot .trade-icon-button')].every(e=>{const b=e.getBoundingClientRect(),i=e.querySelector('.trade-order-icon').getBoundingClientRect();return Math.abs((i.left+i.right)/2-(b.left+b.right)/2)<1&&Math.abs((i.top+i.bottom)/2-(b.top+b.bottom)/2)<1})")
    assert page.evaluate("()=>{const a=document.querySelector('.trade-route-footer .trade-save-wrap').getBoundingClientRect(),b=document.querySelector('.trade-route-footer>button').getBoundingClientRect();return Math.abs(a.width-b.width)<1}")
    assert page.locator('.trade-reserve .pixxo-number-step svg').count()==2
    reserve=page.locator('[name=reserve]')
    reserve.fill('500');page.locator('.trade-reserve [data-number-step="1"]').click();assert reserve.input_value()=='500'
    reserve.fill('0');page.locator('.trade-reserve [data-number-step="-1"]').focus();page.keyboard.press('Enter');assert reserve.input_value()=='0'
    reserve.focus();page.keyboard.press('ArrowUp');assert reserve.input_value()=='1'
    reserve.fill('10');reserve.dispatch_event('change')
    assert page.evaluate("[...document.querySelectorAll('#routeform input[type=number]')].every(e=>e.closest('.pixxo-number-control,.trade-quantity-control'))")
    page.locator('.trade-options').scroll_into_view_if_needed()
    page.mouse.move(1900,20)
    page.locator('.trade-options').screenshot(path=str(root/'pixxo_tests/route-options-compact.png'))
    page.locator('.trade-help').first.hover()
    page.screenshot(path=str(root/'pixxo_tests/route-options-help.png'))
    page.mouse.move(1900,20)
    page.screenshot(path=str(root/'pixxo_tests/route-editor-fullhd.png'))
    if os.environ.get('PIXXO_AXE_SCRIPT'):
        page.add_script_tag(path=os.environ['PIXXO_AXE_SCRIPT'])
        def audit():
            violations=page.evaluate("async()=> (await axe.run('#trade-route-dialog',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))")
            assert not violations,violations
        audit()
        page.locator('[data-route-action=goods][data-station="2"][data-slot="0"][data-mode=load]').click();audit();page.keyboard.press('Escape')
    # Native modal keeps keyboard focus inside the editor.
    for _ in range(25):
        page.keyboard.press('Tab');assert page.evaluate("!!document.activeElement.closest('#trade-route-dialog')")
    for width in [320,768,1440,1920]:
        page.set_viewport_size({'width':width,'height':1080})
        assert page.evaluate("()=>{const el=WINS.route.body;return el.scrollWidth<=el.clientWidth+1&&[...el.querySelectorAll('span,p,b,button,label,input,h2,h3,summary')].filter(e=>e.getClientRects().length).every(e=>parseFloat(getComputedStyle(e).fontSize)>=14)}"),page.evaluate('({w:WINS.route.body.scrollWidth,c:WINS.route.body.clientWidth})')
    page.evaluate("document.documentElement.style.fontSize='200%'")
    page.set_viewport_size({'width':1000,'height':1000})
    assert page.evaluate('WINS.route.body.scrollWidth<=WINS.route.body.clientWidth+1')
    page.evaluate("document.documentElement.style.fontSize='';document.querySelector('#routeform [type=submit]').click()")
    assert not page.locator('#trade-route-dialog').count()
    assert page.evaluate('WORLD.routes[0].ships.length===2&&WORLD.fleet.every(s=>s.route===WORLD.routes[0].id)')
    page.evaluate('saveGame()');stored=page.evaluate('JSON.parse(localStorage.getItem(SAVEKEY))');assert '9002' in str(stored)
    page.evaluate('routeForm(WORLD.routes[0].id)');assert page.locator('.trade-assigned-ship').count()==2
    page.keyboard.press('Escape')
    assert not errors,errors
    print('PASS: Working ship button, full-screen 40/60 layout, mixed fleets, circular orders, limits, map, keyboard, reflow and save.')
    browser.close()
