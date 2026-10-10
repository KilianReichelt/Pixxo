"""River generation/migration, cardinal bridges, logistics and build filters."""
import os
from io import BytesIO
from pathlib import Path
from PIL import Image, ImageChops
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True,args=['--allow-file-access-from-files'])
    page=browser.new_page(viewport={'width':1440,'height':1000})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((root/'pixxo.html').as_uri());page.wait_for_function('StartScreen.ready')
    page.locator('[data-start=new]').click();page.wait_for_function('StartScreen.started')
    page.evaluate('tutorialFinish();setSpeed(0)')
    page.evaluate("""()=>{const k=G.riverCells.find(k=>islandAt(k%MAPW,Math.floor(k/MAPW))===activeIsland);if(k!==undefined){centerOn(k%MAPW,Math.floor(k/MAPW));setZoom(2);}}""")
    page.screenshot(path=str(root/'pixxo_tests/generated-river.png'))
    print(page.evaluate("""()=>{
      window.verify=(ok,text)=>{if(!ok)throw Error(text);};
      verify(G.river===WORLD.board.river,'River board not shared');
      verify(G.riverIslands.length>=3,'Not enough generated rivers: '+G.riverIslands.length);
      verify(G.river.some(Boolean),'No river cells');
      for(const island of G.riverIslands){const cells=G.riverCells.filter(k=>islandOwners[k]===island),mouths=cells.filter(k=>[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>{const n=k+dx+dy*MAPW;return G.tiles[n]<=T.SHAL&&!G.river[n];}));
        verify(mouths.some(a=>mouths.some(b=>Math.hypot(a%MAPW-b%MAPW,Math.floor(a/MAPW)-Math.floor(b/MAPW))>=24)),'River does not connect opposite coasts: '+island);
        const seen=new Set([cells[0]]),queue=[cells[0]];for(let i=0;i<queue.length;i++)for(const offset of [-1,1,-MAPW,MAPW]){const n=queue[i]+offset;if(G.river[n]&&islandOwners[n]===island&&!seen.has(n)){seen.add(n);queue.push(n);}}
        verify(seen.size===cells.length,'Disconnected river: '+island);
      }
      verify(Object.values(CIVIC_PROJECTS).every(p=>p.stages.every(s=>s.seconds===1200)),'Construction duration');
      const count=G.river.reduce((a,b)=>a+b,0);saveGame();const saved=JSON.parse(localStorage.getItem(SAVEKEY));
      verify(saved.riverVersion===RIVER_VERSION&&saved.riverIslands.length===G.riverIslands.length,'Generation version not saved');
      const m=ISLANDS[activeIsland],x=Math.floor(m.wx)-25,y=Math.floor(m.wy)+28;window.bridgeFixture={x,y};
      G.gold=1000000;for(const good of GOODS)G.stock[good.id]=1000;WORLD.highestTier=4;for(const type in B)G.quests['u_'+type]=true;
      const stone=G.deposits.find(d=>d.type==='steinbruch'&&!d.legacy);verify(stone,'No stone deposit');verify(place('steinbruch',stone.x,stone.y).ok,'Stone quarry unlock');
      G.deposits=G.deposits.filter(d=>d.x<x-24||d.x>x+24||d.y<y-24||d.y>y+24);
      for(let yy=y-24;yy<y+25;yy++)for(let xx=x-24;xx<x+25;xx++){const k=IDX(xx,yy);if(G.occ[k])continue;G.tiles[k]=T.GRASS;G.river[k]=0;islandOwners[k]=activeIsland;}
      verify(place('lager',x-19,y-12).ok,'Test warehouse');
      window.bridgeCases=[];
      verify(LAND_STEPS.filter(([dx,dy])=>dx&&dy).every(([dx,dy])=>riverCrossing(IDX(x,y),dx,dy)===null),'Diagonal bridge accepted');
      for(const [dx,dy] of LAND_STEPS.filter(([dx,dy])=>Math.abs(dx)+Math.abs(dy)===1))for(const width of [1,2,3,5]){
        const cells=Array.from({length:width+2},(_,i)=>IDX(x+dx*i,y+dy*i));
        for(const k of cells){G.road[k]=0;delete G.bridges[k];G.river[k]=0;G.tiles[k]=T.GRASS;PERF_ROADS.get(G.road)?.delete(k);}
        for(const k of cells.slice(1,-1)){G.river[k]=1;G.tiles[k]=T.SHAL;}
        const plan={tool:'road',island:activeIsland,mode:'path',path:plannedRoadPath({x,y},{x:x+dx*(width+1),y:y+dy*(width+1)})};
        verify(plan.path&&plan.path.join(',')===cells.join(','),'Non-straight crossing '+[dx,dy,width]);
        const before=G.stock.holz;verify(commitRoadPlan(plan)===true,'Bridge build failed');verify(G.stock.holz===before-width*3,'Wood cost wrong');
        verify(cells.every(k=>G.road[k]&&G.bridges[k]),'Incomplete crossing');
        verify(cells.slice(1,-1).some(k=>G.bridges[k].pier)===(width>2),'Missing/unnecessary piers');
        for(let i=0;i<cells.length-1;i++)verify(roadNeighbours(cells[i]).includes(cells[i+1]),'Disconnected bridge');
        const beforeStone=G.stock.stein;verify(roadUpgrade(x+dx,y+dy),'Stone upgrade failed');verify(G.stock.stein===beforeStone-width*3-2,'Stone cost wrong');verify(cells.every(k=>G.road[k]===2&&G.bridges[k].kind===2),'Partial upgrade');
        verify(demolishAt(x+dx,y+dy),'Bridge demolition failed');verify(cells.slice(1,-1).every(k=>!G.road[k]&&!G.bridges[k]),'Orphan deck');
        for(const k of cells){G.river[k]=0;G.tiles[k]=T.GRASS;G.road[k]=0;delete G.bridges[k];PERF_ROADS.get(G.road)?.delete(k);}
        bridgeCases.push([dx,dy,width]);
      }
      // Manual single click selects a complete span, never an isolated water tile.
      for(let yy=y-10;yy<=y+10;yy++)for(let i=1;i<=3;i++){const k=IDX(x+i,yy);G.river[k]=1;G.tiles[k]=T.SHAL;}
      UI.roadMode='woodbridge';setTool('road');beginConstructionPlan({x:x+2,y});
      verify(constructionPlan.bridgePlan.spans.length===1,'Manual bridge planning');
      const span=constructionPlan.bridgePlan.spans[0],oldGold=G.gold,oldWood=G.stock.holz;G.stock.holz=0;
      verify(commitRoadPlan(constructionPlan)!==true&&G.gold===oldGold&&span.cells.every(k=>!G.road[k]),'Failed bridge charged/partially built');
      G.stock.holz=oldWood;finishConstructionPlan();verify(span.cells.every(k=>G.road[k]),'Single click bridge incomplete');
      window.savedSpan=span.cells;
      // Link both warehouses through this actual bridge and send actual cargo.
      const left=G.blds.find(b=>b.type==='lager'),right=place('lager',x+5,y-B.lager.h).b;verify(right,'Second warehouse');
      const link=plannedRoadPath({x:x-18,y:y-12+B.lager.h},{x,y});verify(link,'Warehouse link');verify(commitRoadPlan({path:link,island:activeIsland,mode:'path'})===true,'Left approach');
      verify(commitRoadPlan({path:plannedRoadPath({x:x+4,y},{x:x+6,y}),island:activeIsland,mode:'path'})===true,'Right approach');
      G.dirty=true;rebuildNet();const path=deliveryPath(left,right);verify(path&&path.some(k=>isRiver(k)),'Logistics do not cross bridge');
      G.stock.bretter=0;const cart={path,t:0,col:'bretter',qty:5,source:left.id,target:right.id,destination:'warehouse'};G.carts.push(cart);for(let i=0;i<100&&cart.qty;i++)advanceDeliveries(1);
      verify(G.stock.bretter===5&&!G.carts.includes(cart),'Cart did not arrive across bridge');
      saveGame();return {rivers:G.riverIslands.length,riverCells:count,bridgeCases:bridgeCases.length,transport:'passed'};
    }"""))
    page.locator('#bar [data-tool=road]').click()
    page.locator('#bar [data-tool=road]').click()
    assert page.locator('[data-road-mode]').count()==4
    page.locator('[data-road-mode=stonebridge]').focus();page.keyboard.press('Enter')
    assert page.evaluate("UI.roadMode==='stonebridge'&&UI.tool==='road'")
    assert page.evaluate("document.activeElement?.dataset.roadMode==='stonebridge'")
    page.evaluate("UI.cat='veredel';setTool(null);renderBar();renderItems(true)")
    assert page.evaluate("""()=>{const present=new Set([...document.querySelectorAll('#items .bi[data-b]')].map(c=>+c.dataset.popTier));return document.querySelectorAll('#population-filters button').length===present.size+1&&[...document.querySelectorAll('#population-filters [data-population-filter]')].every(b=>+b.dataset.populationFilter===0||present.has(+b.dataset.populationFilter));}""")
    print(page.evaluate("""()=>{
      const expected={1:'#67412c',2:'#ad7443',3:'#b6c6c7',4:'#dab248'},heights=[];
      for(const card of document.querySelectorAll('#items .bi[data-pop-tier]')){
        verify(getComputedStyle(card).getPropertyValue('--tier-ribbon').trim()===expected[card.dataset.popTier],'Wrong ribbon color '+card.dataset.popTier);
      }
      const tiers=[...document.querySelectorAll('#items .bi[data-b]')].map(c=>+c.dataset.popTier);
      verify(tiers.every((tier,i)=>!i||tier>=tiers[i-1]),'Buildings not ordered by population');
      for(const tier of [0,...new Set(tiers),0]){UI.populationFilter=tier;renderItems(true);heights.push(document.querySelector('#items').getBoundingClientRect().height);}
      verify(Math.max(...heights)-Math.min(...heights)<.1,'Filter changes tray height: '+heights);
      verify(!document.querySelector('.population-empty'),'Empty-category message remains');
      return {ribbonColors:'passed',sorted:'passed',filterHeights:heights};
    }"""))
    page.locator('[data-population-filter="4"]').focus();page.keyboard.press('Enter')
    assert page.evaluate("[...document.querySelectorAll('#items .bi[data-b]:not([hidden])')].every(c=>c.dataset.popTier==='4')")
    assert page.locator('#items .bi[data-b]:visible').count()>0
    assert page.locator('#items .population-badge').count()==0
    frame=page.evaluate("""()=>{const c=document.querySelector('#items .bi[data-b]:not([hidden])'),s=getComputedStyle(c,'::after');return {aria:c.getAttribute('aria-label'),title:c.title,tier:TIERS[4].n,mask:s.maskComposite,padding:s.paddingTop,top:s.top};}""")
    assert frame['tier'] in frame['aria'] and frame['tier'] in frame['title'] and frame['top']=='0px',frame
    card=page.locator('#items .bi[data-b]:visible').first
    shine=Image.open(BytesIO(card.screenshot())).convert('RGB')
    style=page.add_style_tag(content='#items .bi::after{display:none!important}')
    plain=Image.open(BytesIO(card.screenshot())).convert('RGB')
    style.evaluate('(s)=>s.remove()')
    assert ImageChops.difference(shine,plain).crop((40,0,shine.width,shine.height)).getbbox() is None,'Ribbon extends beyond top-left corner'
    assert ImageChops.difference(shine,plain).getbbox() is not None,'Ribbon missing'
    if os.environ.get('PIXXO_AXE_SCRIPT'):
        page.add_script_tag(path=os.environ['PIXXO_AXE_SCRIPT'])
        violations=page.evaluate("""async()=> (await axe.run('#population-filters',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))""")
        assert not violations,violations
    for width in [320,768,1440]:
        page.set_viewport_size({'width':width,'height':1000});page.evaluate('renderItems(true)')
        assert page.evaluate("""()=>{const f=document.querySelector('#population-filters'),r=f.getBoundingClientRect(),buttons=[...f.querySelectorAll('button')];return r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&buttons.every(b=>Math.abs(b.getBoundingClientRect().top-buttons[0].getBoundingClientRect().top)<1&&parseFloat(getComputedStyle(b).fontSize)>=14&&b.getBoundingClientRect().height>=44);}"""),width
    page.evaluate("document.documentElement.style.fontSize='32px';renderItems(true)")
    page.set_viewport_size({'width':320,'height':1000});page.evaluate('renderItems(true)')
    assert page.evaluate("""()=>{const f=document.querySelector('#population-filters'),r=f.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&getComputedStyle(f).flexWrap==='nowrap'&&getComputedStyle(f).overflowX==='auto';}""")
    page.evaluate("document.documentElement.style.fontSize='';renderItems(true)")
    page.set_viewport_size({'width':1440,'height':1000});page.evaluate('renderItems(true)')
    assert page.evaluate("[...document.querySelectorAll('#items .bi b,#items .population-badge')].every(e=>parseFloat(getComputedStyle(e).fontSize)>=14)")
    page.screenshot(path=str(root/'pixxo_tests/building-tier-filters.png'))
    print(page.evaluate("""()=>{const c=document.createElement('canvas');c.width=760;c.height=310;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.fillStyle='#376f8f';g.fillRect(0,0,c.width,c.height);g.font='16px sans-serif';g.fillStyle='#fff';LAND_STEPS.forEach(([dx,dy],i)=>{for(const kind of [1,2]){const x=i*94,y=kind===1?24:170;g.fillText(dx+','+dy,x+4,y);for(let j=0;j<3;j++)nativeDrawImage.call(g,bridgeSprite(dx,dy,kind,j===1?'deck':'ramp',j===1),x+16,y+15+j*27,60,60);}});const img=document.createElement('img');img.id='bridge-art-test';img.src=c.toDataURL();Object.assign(img.style,{position:'fixed',inset:0,zIndex:999999});document.body.append(img);return {artVariants:BRIDGE_ART_CACHE.size};}"""))
    page.locator('#bridge-art-test').screenshot(path=str(root/'pixxo_tests/bridge-directions.png'));page.evaluate('document.getElementById("bridge-art-test").remove()')
    page.reload();page.wait_for_function('StartScreen.ready');page.locator('[data-start=continue]').click();page.wait_for_function('StartScreen.started&&!StartScreen.loading')
    assert page.evaluate("Object.values(G.bridges).some(b=>b.part==='deck')&&G.river===WORLD.board.river")
    assert not errors,errors
    print('PASS: four bridge directions, diagonal rejection, widths, costs, supports, upgrade, logistics, ribbon colors, stable filter height, responsive layout, reload.')
    # A separate context represents a legacy save, never touching the user's real save.
    legacy=browser.new_page(viewport={'width':1440,'height':1000})
    legacy.goto((root/'pixxo.html').as_uri());legacy.wait_for_function('StartScreen.ready')
    legacy.locator('[data-start=new]').click();legacy.wait_for_function('StartScreen.started')
    legacy.evaluate('tutorialFinish();setSpeed(0);saveGame()')
    print(legacy.evaluate("""()=>{
      const check=(ok,message)=>{if(!ok)throw Error(message);};
      const saved=JSON.parse(localStorage.getItem(SAVEKEY));delete saved.riverVersion;delete saved.riverIslands;delete saved.riverCells;
      saved.fog.islands=ISLANDS.map((_,i)=>i===0||i===1);saved.active=0;
      localStorage.setItem(SAVEKEY,JSON.stringify(saved));
      const cpu=saved.islands.findIndex(g=>g?.cpu),before=cpu>=0?saved.islands[cpu].blds.map(b=>[b.id,b.x,b.y,b.type]):[];
      check(loadGame(),'Legacy load failed');check(!G.riverIslands.includes(0)&&!G.riverIslands.includes(1),'Discovered islands modified');
      check(G.riverIslands.length>=3,'Undiscovered islands not migrated');
      if(cpu>=0){check(JSON.stringify(WORLD.islands[cpu].blds.map(b=>[b.id,b.x,b.y,b.type]))===JSON.stringify(before),'CPU buildings modified');for(const b of WORLD.islands[cpu].blds)for(const [x,y] of footprintCells(b.x,b.y,b.w,b.h))check(!isRiver(IDX(x,y)),'River through CPU building');}
      const cells=G.riverCells.join(','),islands=G.riverIslands.join(',');check(JSON.parse(localStorage.getItem(SAVEKEY)).riverVersion===RIVER_VERSION,'Migration marker not persisted');
      check(loadGame(),'Second legacy load failed');check(G.riverCells.join(',')===cells&&G.riverIslands.join(',')===islands,'Migration ran twice / rivers shifted');
      return {migration:'once',discovered:'unchanged',cpu:'preserved',rivers:G.riverIslands.length};
    }"""))
    legacy.reload();legacy.wait_for_function('StartScreen.ready');legacy.locator('[data-start=continue]').click();legacy.wait_for_function('StartScreen.started&&!StartScreen.loading')
    assert legacy.evaluate("G.riverCells.length>0&&!G.riverIslands.includes(0)&&JSON.parse(localStorage.getItem(SAVEKEY)).riverVersion===RIVER_VERSION")
    print(legacy.evaluate("""()=>{const verify=(ok,message)=>{if(!ok)throw Error(message);};setSpeed(0);saveGame();const saved=JSON.parse(localStorage.getItem(SAVEKEY));saved.riverVersion=1;const protectedIsland=saved.riverIslands[0];saved.fog.islands[protectedIsland]=true;const cells=saved.riverCells.filter(e=>e[1]===protectedIsland).map(e=>e[0]).sort((a,b)=>a-b);localStorage.setItem(SAVEKEY,JSON.stringify(saved));verify(loadGame(),'Version-one load failed');verify(JSON.stringify(G.riverCells.filter(k=>islandOwners[k]===protectedIsland).sort((a,b)=>a-b))===JSON.stringify(cells),'Existing discovered river changed');verify(JSON.parse(localStorage.getItem(SAVEKEY)).riverVersion===RIVER_VERSION,'Version-one upgrade not persisted');return {versionUpgrade:'passed',discoveredRiver:'preserved'};}"""))
    browser.close()
