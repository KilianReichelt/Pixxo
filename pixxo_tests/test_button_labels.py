"""Tooltip-free dynamic buttons and visible missing-fertility states."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    page=browser.new_page(viewport={'width':1440,'height':1000})
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((root/'pixxo.html').as_uri());page.wait_for_function('StartScreen.ready')
    assert page.locator('button[title],button [title]').count()==0
    page.locator('[data-start=new]').click();page.wait_for_function('StartScreen.started')
    page.evaluate('tutorialFinish();setSpeed(0)')
    fixtures=page.evaluate("""()=>{
      G.gold=100000;for(const k in G.stock)G.stock[k]=10000;WORLD.highestTier=4;
      window.fertBefore=[...islandMeta().fert];islandMeta().fert=[];
      const types=Object.keys(B).filter(t=>B[t].fertility&&buildingRelevant(t));
      if(!types.length)throw Error('No fertility buildings');
      return types.map(type=>({type,cat:B[type].cat,good:B[type].fertility}));
    }""")
    for item in fixtures:
        page.evaluate('(cat)=>{UI.cat=cat;renderItems(true)}',item['cat'])
        card=page.locator('[data-b="'+item['type']+'"]')
        assert card.is_disabled()
        assert 'fertility-missing' in card.get_attribute('class')
        assert 'Fruchtbarkeit fehlt:' in card.get_attribute('aria-label')
        assert card.locator('.fertility-warning img').count()==1
        assert card.locator('.fertility-cross').count()==1
        assert card.locator('.fertility-warning').evaluate("e=>getComputedStyle(e).filter==='none'&&getComputedStyle(e).opacity==='1'")
        assert card.evaluate("e=>getComputedStyle(e.querySelector(':scope > b')).filter==='grayscale(1)'")
        page.evaluate('(good)=>{islandMeta().fert.push(good);renderItems(true)}',item['good'])
        assert card.locator('.fertility-warning').count()==0
        assert 'fertility-missing' not in card.get_attribute('class')
        page.evaluate('islandMeta().fert=[];renderItems(true)')
    # Neither nested cost/workforce labels nor later button updates restore tooltips.
    page.evaluate("""()=>{
      const button=document.createElement('button');button.id='tooltip-test';button.title='Zusatzaktion';
      button.innerHTML='<span title="Kosten">★</span>';document.body.append(button);
    }""")
    page.wait_for_function('!document.querySelector("#tooltip-test[title],#tooltip-test [title]")')
    page.evaluate('document.getElementById("tooltip-test").title="Neue Aktion"')
    page.wait_for_function('!document.getElementById("tooltip-test").hasAttribute("title")')
    page.evaluate('document.getElementById("tooltip-test").remove()')
    assert page.locator('button[title],button [title]').count()==0
    item=fixtures[0];page.evaluate('(cat)=>{UI.cat=cat;renderItems(true)}',item['cat'])
    for width in [1440,768,320]:
        page.set_viewport_size({'width':width,'height':1000});page.evaluate('renderItems(true)')
        assert page.evaluate("[...document.querySelectorAll('#items button')].every(e=>parseFloat(getComputedStyle(e).fontSize)>=14)")
    page.set_viewport_size({'width':1440,'height':1000});page.evaluate('renderItems(true)')
    page.locator('[data-b="'+item['type']+'"]').scroll_into_view_if_needed()
    page.locator('#items').screenshot(path=str(root/'pixxo_tests/missing-fertility.png'))
    if os.environ.get('PIXXO_AXE_SCRIPT'):
        page.add_script_tag(path=os.environ['PIXXO_AXE_SCRIPT'])
        violations=page.evaluate("async()=> (await axe.run('#items',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))")
        assert not violations,violations
    assert not errors,errors
    browser.close()
    print('PASS: Dynamic buttons without tooltips, fertility badges, responsive layout and accessibility.')
