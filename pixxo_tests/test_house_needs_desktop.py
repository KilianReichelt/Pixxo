"""Weighted residents, migration, compact needs and downgrade confirmation."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True,args=['--allow-file-access-from-files'])
 page=browser.new_page(viewport={'width':1920,'height':1080},reduced_motion='reduce')
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto((root/'pixxo.html').as_uri());page.wait_for_function('StartScreen.ready')
 page.locator('[data-start=new]').click();page.wait_for_function('StartScreen.started&&!StartScreen.loading');page.evaluate('tutorialFinish();setSpeed(0)')
 print(page.evaluate(r'''()=>{
 const check=(v,m)=>{if(!v)throw Error(m)};
 check(JSON.stringify(TIERS.filter(Boolean).map(t=>t.cap))==='[6,10,16,22]','House capacities');
 for(const t of TIERS.filter(Boolean)){
 const h={type:'haus',tier:t.id,pop:0,conn:true,fire:0,cov:{},sat:{}},needs=pixxoHouseNeeds(h);
 for(const n of needs.services){h.cov={};h.sat={};h.cov[n]=true;check(pixxoHouseCapacity(h)===pixxoResidentsForNeed(h,n),'Service reward '+n);}
 for(const n of needs.goods){h.cov={markt:true};h.sat={};const before=pixxoHouseCapacity(h);h.sat[n]=true;check(pixxoHouseCapacity(h)-before===pixxoResidentsForNeed(h,n),'Goods reward '+n);}
 h.cov=Object.fromEntries(needs.services.map(n=>[n,true]));h.sat=Object.fromEntries(needs.goods.map(n=>[n,true]));check(pixxoHouseCapacity(h)===t.cap,'Full capacity');
 for(const n of Object.keys(t.luxury))h.sat[n]=true;check(pixxoHouseCapacity(h)===t.cap,'Luxury adds no residents');h.conn=false;check(pixxoHouseCapacity(h)===0,'Disconnected');h.conn=true;h.fire=1;check(pixxoHouseCapacity(h)===0,'Fire');
 }
 for(const [tier,pop] of [[3,24],[4,36]]){const h={tier,pop};pixxoHousePopulationStep(h,TIERS[tier].cap,0);check(h.pop===pop,'No abrupt population clamp');pixxoHousePopulationStep(h,TIERS[tier].cap,5);check(h.pop<pop&&h.pop>TIERS[tier].cap,'Gradual legacy departure');pixxoHousePopulationStep(h,TIERS[tier].cap,120);check(h.pop===TIERS[tier].cap,'Legacy converges');}
 const d=G.blds.find(b=>b.type==='kontor'),x=d.x+10,y=d.y+5;
 for(let yy=y;yy<y+3;yy++)for(let xx=x;xx<x+3;xx++){const k=IDX(xx,yy);G.tiles[k]=T.GRASS;G.occ[k]=0;G.road[k]=0;islandOwners[k]=activeIsland;}
 const h={id:G.nid++,island:activeIsland,type:'haus',x,y,w:3,h:3,tier:3,pop:16,conn:true,fire:0,paused:false,eff:1,status:'Bewohnt',age:0,mood:1,need:{},sat:Object.fromEntries(GOODS.map(g=>[g.id,true])),cov:{markt:true,kirche:true,gemeinschaft:true},rotation:0,visualVariant:0};
 G.blds.push(h);G.byId.set(h.id,h);for(const [xx,yy] of footprintCells(x,y,3,3))G.occ[IDX(xx,yy)]=h.id;G.dirty=false;window.testNeedHouse=h;
 h.pop=24;const live=G,packed=packIsland(G),loaded=unpackIsland(packed);check(loaded.byId.get(h.id).pop===24,'Reload preserves legacy population');G=live;h.pop=16;
 selectB(h.id);return {capacities:TIERS.filter(Boolean).map(t=>t.cap),tax:TIERS[4].tax};
 }'''))
 page.wait_for_selector('.win[data-id=info]')
 assert 'Jedes erfüllte Bedürfnis' not in page.locator('.win[data-id=info]').inner_text()
 assert 'Zurückstufen ohne Materialerstattung' not in page.locator('.win[data-id=info]').inner_text()
 assert page.locator('.need-name',has_text='Bücher').count()==1
 assert page.locator('.need-residents .sr-only').all_text_contents()==['Patrizier']*12
 assert page.locator('.need-residents img').count()==12
 assert page.evaluate(r'''()=>[...document.querySelectorAll('.needgroup .needs')].filter(list=>list.querySelector('.need-residents')).every(list=>{
 const nodes=[...list.querySelectorAll('.nd')],columns=getComputedStyle(list).gridTemplateColumns.split(' ').length;
 if(columns!==(nodes.length>=6?2:1))return false;
 const rects=nodes.map(n=>n.querySelector('.need-residents').getBoundingClientRect());return rects.every((r,i)=>Math.abs(r.right-rects[i%columns].right)<1);
 })''')
 assert page.locator('.hd .small').inner_text()==page.evaluate('HOUSE_FLAVOR[3]')
 assert page.locator('.gold-rate img').count()>=2
 axe=root/'pixxo_tests/.runtime/node_modules/axe-core/axe.min.js'
 if axe.exists():
  page.add_script_tag(path=str(axe))
  assert not page.evaluate("async()=> (await axe.run('.win[data-id=info]',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))")
 page.locator('.win[data-id=info]').screenshot(path=str(root/'pixxo_tests/house-needs-weighted.png'))
 for tier in [1,2,3,4]:
  page.evaluate('(tier)=>{testNeedHouse.tier=tier;testNeedHouse.pop=TIERS[tier].cap;testNeedHouse.cov=Object.fromEntries(TIERS[tier].svc.map(n=>[n,true]));WINS.info.last=null;WINS.info.hold=false;WINS.info.el.querySelector("[data-close]").focus();refreshWin(WINS.info)}',tier)
  assert page.locator('.hd .small').inner_text()==page.evaluate('(tier)=>HOUSE_FLAVOR[tier]',tier)
  assert set(page.locator('.need-residents .sr-only').all_text_contents())=={page.evaluate('(tier)=>TIERS[tier].n',tier)}
 page.evaluate('document.documentElement.style.fontSize="200%"')
 assert page.evaluate('WINS.info.body.scrollWidth<=WINS.info.body.clientWidth+1')
 page.evaluate('document.documentElement.style.fontSize=""')
 page.locator('[data-act=downgrade]').click();page.wait_for_selector('#house-downgrade-confirm[open]')
 assert page.evaluate('testNeedHouse.tier===4&&document.activeElement.dataset.houseDowngrade==="cancel"')
 assert 'keine Baumaterialien erstattet' in page.locator('#house-downgrade-confirm').inner_text()
 if axe.exists():
  assert not page.evaluate("async()=> (await axe.run('#house-downgrade-confirm',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))")
 page.locator('#house-downgrade-confirm').screenshot(path=str(root/'pixxo_tests/house-downgrade-confirm.png'))
 page.keyboard.press('Escape');assert page.evaluate('testNeedHouse.tier===4&&!houseDowngradeDialog.open')
 page.locator('[data-act=downgrade]').click();page.locator('[data-house-downgrade=cancel]').click();assert page.evaluate('testNeedHouse.tier===4')
 resources=page.evaluate('JSON.stringify({gold:G.gold,stock:G.stock})')
 page.locator('[data-act=downgrade]').click();page.locator('[data-house-downgrade=confirm]').click()
 assert page.evaluate('testNeedHouse.tier===3')
 assert page.evaluate('JSON.stringify({gold:G.gold,stock:G.stock})')==resources
 page.add_script_tag(path=str(root/'pixxo_tests/pixxo_balance.js'))
 balance=page.evaluate('pixxoBalanceModel()');(root/'pixxo_tests/weighted-house-balance.json').write_text(json.dumps(balance,ensure_ascii=False,indent=2),encoding='utf-8')
 assert all(r['net']>0 for r in balance if r['extraSupply'] and not r['luxury'] and r['population'][1]>0)
 assert not errors,errors
 browser.close()
 print('PASS: weighted rewards, gradual legacy migration, icons/alignment, six-item columns, flavour, 200% text, downgrade cancellation/confirmation and late-game balance without luxury.')
