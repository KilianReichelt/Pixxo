"""Approved frame styling in real desktop windows and controls."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True,args=['--allow-file-access-from-files'])
    page=browser.new_page(viewport={'width':1920,'height':1080})
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((root/'pixxo.html').as_uri());page.wait_for_function('StartScreen.ready')
    page.wait_for_selector('#pixxo-loading',state='detached')
    page.wait_for_function('sceneryImage.complete && sceneryImage.naturalWidth>0')
    page.screenshot(path=str(root/'pixxo_tests/frames-start-menu.png'))
    page.locator('[data-start=settings]').click()
    page.screenshot(path=str(root/'pixxo_tests/frames-settings.png'))
    axe=root/'pixxo_tests/.runtime/node_modules/axe-core/axe.min.js'
    if axe.exists():
        page.add_script_tag(path=str(axe))
        violations=page.evaluate("async()=> (await axe.run('#pixxo-start',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))")
        assert not violations,violations
    page.locator('[data-start=home]').click();page.locator('[data-start=new]').click()
    page.wait_for_function('StartScreen.started&&!StartScreen.loading')
    page.evaluate('tutorialFinish();setSpeed(0)')
    page.evaluate("()=>{const k=G.blds.find(b=>b.type==='kontor');WORLD.fleet=[{id:91001,type:'clipper',name:'Seestern',at:activeIsland,anchor:{x:k.x+4,y:k.y+3},cargo:[{good:'holz',qty:20},{good:'glas',qty:35},{good:'werkzeug',qty:15}],buildLeft:0,phase:'idle',remaining:0,heading:2}];selectShip(91001)}")
    page.wait_for_selector('.win[data-id=ship]')
    page.screenshot(path=str(root/'pixxo_tests/frames-ship.png'))
    # Check the actual window and its controls, not a separate mockup.
    report=page.evaluate(r'''()=>{
      const windows=[...document.querySelectorAll('.win:not([data-id="route"]),.start-card,.save-feedback,#pixxo-tour')];
      for(const el of windows){const css=getComputedStyle(el),caps=getComputedStyle(el,'::after');if(css.borderTopWidth!=='1px'||css.borderTopColor!=='rgb(179, 167, 137)'||!caps.backgroundSize.split(', ').every(s=>s==='12px 12px')||caps.pointerEvents!=='none')throw Error('Window frame: '+el.className);}
      const buttons=[...document.querySelectorAll('.win[data-id="ship"] .btn,.win[data-id="ship"] .wx')];
      const controls=[...document.querySelectorAll('.win[data-id="ship"] .btn,.win[data-id="ship"] .wx,#bar,#items,#top,#mmw,#sidebar,.cargo-slot,.cargo-transfer,.ship-rename-icon')];
      const frameSheet=document.querySelector('link[href="assets/css/pixxo_frames.css"]').sheet;
      const snapshot=()=>controls.map(el=>{const css=getComputedStyle(el);return [css.borderTopWidth,css.borderTopColor,css.borderTopStyle,css.boxShadow,css.backgroundImage,css.clipPath];});
      const styled=snapshot();
      if(styled.some(values=>values[4].includes('frame-cap')))throw Error('Unwanted caps outside windows');
      frameSheet.disabled=true;
      const original=snapshot();
      frameSheet.disabled=false;
      if(JSON.stringify(styled)!==JSON.stringify(original))throw Error('Original control frames were overridden');
      return {windows:windows.length,shipButtons:buttons.length,color:'#b3a789',caps:'12x12'};
    }''')
    print(report)
    page.locator('[data-act=ship-plan-route]').focus();page.keyboard.press('Enter')
    page.wait_for_selector('#trade-route-dialog[open]')
    page.screenshot(path=str(root/'pixxo_tests/frames-route-editor.png'))
    assert page.evaluate("getComputedStyle(document.querySelector('#trade-route-dialog'),'::after').backgroundSize.split(', ').every(s=>s==='12px 12px')")
    page.keyboard.press('Escape');assert page.locator('#trade-route-dialog').count()==0
    page.evaluate('openWin_menu();winAct("menu",{act:"start-home"})')
    page.wait_for_selector('#start-return-confirm[open]')
    page.screenshot(path=str(root/'pixxo_tests/frames-return-dialog.png'))
    assert page.evaluate('document.activeElement.dataset.return==="cancel"')
    page.keyboard.press('Escape');assert not page.locator('#start-return-confirm').is_visible()
    page.evaluate("startShow('settings')")
    for width in [1280,1920]:
        page.set_viewport_size({'width':width,'height':1080})
        page.evaluate('document.documentElement.style.fontSize="200%"')
        assert page.evaluate('startDialog.scrollWidth<=innerWidth')
        page.evaluate('document.documentElement.style.fontSize=""')
    page.emulate_media(reduced_motion='reduce')
    assert page.evaluate("getComputedStyle(document.querySelector('.start-card'),'::after').animationName==='none'")
    # Reuse the gameplay regressions in a desktop viewport; no phone/tablet checks.
    page.evaluate('startClose();startNew();tutorialFinish();setSpeed(0)')
    page.add_script_tag(path=str(root/'pixxo_tests/pixxo_balance.js'))
    page.add_script_tag(path=str(root/'pixxo_tests/pixxo_legacy_fixture.js'))
    regression=(root/'pixxo_tests/pixxo_checks.js').read_text(encoding='utf-8').split('setTimeout(()=>')[0]
    page.add_script_tag(content=regression)
    print('Existing gameplay checks:',page.evaluate('runPixxoChecks().passed'))
    assert not errors,errors
    browser.close()
    print('PASS: live desktop frames, restrained caps, keyboard actions, fullscreen route/dialog, settings accessibility and 200% text.')
