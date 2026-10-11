"""Desktop tutorial guards, native ruins/arches/mines, pause and custom cursors."""
import base64
from pathlib import Path
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True,args=['--allow-file-access-from-files'])
    page=browser.new_page(viewport={'width':1920,'height':1080})
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((root/'pixxo.html').as_uri());page.wait_for_function('StartScreen.ready')
    page.locator('[data-start=new]').click();page.wait_for_function('StartScreen.started&&!StartScreen.loading')
    page.wait_for_function('!tutorialShade.hidden')
    assert page.locator('#tour-shade svg').is_visible()
    assert 'Optional:' not in page.locator('#pixxo-tour').inner_text()
    page.evaluate('setTool("build","haus")')
    before=page.evaluate('JSON.stringify({n:G.blds.length,stock:G.stock,gold:G.gold,roads:G.roads})')
    page.mouse.click(850,550);page.locator('#cv').focus();page.keyboard.press('Enter')
    page.evaluate('clickTile(tileAt(850,550));beginConstructionPlan(tileAt(850,550));finishConstructionPlan()')
    assert before==page.evaluate('JSON.stringify({n:G.blds.length,stock:G.stock,gold:G.gold,roads:G.roads})')
    assert page.evaluate('constructionPlan===null')
    page.evaluate('setTool(null)')
    page.add_script_tag(path=str(root/'pixxo_tests/.runtime/node_modules/axe-core/axe.min.js'))
    assert page.evaluate("async()=> (await axe.run(tutorialPanel,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>v.id)")==[]
    assert page.locator('#goodsbar').evaluate('e=>!!e.closest("[inert]")')
    for i in range(15):
        assert page.evaluate('WORLD.tutorial.step')==i
        page.evaluate('tutorialUpdate()')
        assert page.locator('#tour-shade mask rect[fill=black]').count()>=2
        assert 'Optional:' not in page.locator('#pixxo-tour').inner_text()
        if i==2: page.screenshot(path=str(root/'pixxo_tests/tutorial-focus.png'))
        if i==7:
            assert page.locator('#tour-shade mask rect[fill=black]').count()==3
        page.locator('[data-tour=next]').click()
    assert page.locator('#tour-shade').is_hidden()
    assert page.evaluate('WORLD.tutorial.done&&!tutorialBlocksConstruction()')
    assert not page.locator('#goodsbar').evaluate('e=>!!e.closest("[inert]")')
    page.evaluate('setSpeed(0)')
    print(page.evaluate(r'''()=>{
      const check=(v,m)=>{if(!v)throw Error(m)},sizes=new Map();
      for(const [type,d] of Object.entries(B))if(type!=='ruine'&&d.w&&d.h)for(let rotation=0;rotation<4;rotation++){const z=buildingSize(type,rotation);sizes.set(z.w+'x'+z.h,z);}
      sizes.set('3x3',{w:3,h:3});
      const rows=[...sizes.values()].sort((a,b)=>a.w-b.w||a.h-b.h),canvas=document.createElement('canvas');canvas.width=1400;canvas.height=rows.length*140;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.fillStyle='#393b32';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.font='16px sans-serif';ctx.fillStyle='#f3e6c8';
      rows.forEach((z,row)=>{
        const hashes=new Set(),b={type:'ruine',w:z.w,h:z.h},first=ruinSprite(b);
        for(let frame=0;frame<8;frame++){
          const entry=HD_CATALOG.get(first.slice(0,-1)+frame),a=entry.pixelSource;
          check(a.width===z.w*16&&a.height===z.h*16+12,'Native ruin footprint');hashes.add(a.toDataURL());
          const data=a.getContext('2d').getImageData(0,0,a.width,a.height).data;for(let i=3;i<data.length;i+=4)check(data[i]===0||data[i]===255,'Antialiased ruin');
          const field={...b,ruinField:true},name=ruinSprite(field);check(HD_CATALOG.get(name.slice(0,-1)+frame).pixelSource.height===z.h*16,'Field footprint');
          if(z.w<=5&&z.h<=5)nativeDrawImage.call(ctx,a,50+frame*165,row*140+24,a.width*2,a.height*2);
        }
        check(hashes.size===8,'Eight different ruin frames '+z.w+'x'+z.h);ctx.fillText(z.w+'x'+z.h,5,row*140+20);
      });
      window.ruinOverview=canvas.toDataURL();
      const art=document.createElement('canvas');art.width=1000;art.height=1320;const c=art.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#376d79';c.fillRect(0,0,1000,1320);c.font='16px sans-serif';c.fillStyle='#f3e6c8';
      for(const [row,[dx,dy]] of [[1,0],[0,1],[1,1],[1,-1]].entries()){
        const cells=Array.from({length:7},(_,i)=>i),supports=bridgePierIndices(9);c.fillText('Steinbrücke '+dx+','+dy,12,row*260+18);
        const art=stoneSpanArt(7,dx,dy);nativeDrawImage.call(c,art.canvas,60,row*260+30,art.canvas.width*2,art.canvas.height*2);
      }
      for(const [col,side] of ['south','west','north','east'].entries()){const b={type:'mine',w:B.mine.w,h:B.mine.h},a=miningEntranceArt(b,side,1);nativeDrawImage.call(c,a,12+col*220,1125,a.width*2,a.height*2);c.fillText(side,12+col*220,1120);}
      window.bridgeMineOverview=art.toDataURL();
      const portalSouth=miningEntranceArt({type:'mine',w:3,h:3},'south',0);check(portalSouth.width===48&&portalSouth.height===60,'Mine native grid');
      return {ruinFootprints:rows.length,frames:8};
    }'''))
    for name,var in [('ruins-eight-frames.png','ruinOverview'),('stone-arches-and-mines.png','bridgeMineOverview')]:
        (root/'pixxo_tests'/name).write_bytes(base64.b64decode(page.evaluate(var).split(',')[1]))
    page.evaluate('StartPrefs.reducedMotion=true;UI.vt=2.7')
    assert page.evaluate('ruinSprite({w:2,h:3},true).endsWith("_0")')
    page.evaluate('StartPrefs.reducedMotion=false;setSpeed(1)')
    page.wait_for_function('UI.vt>2.8');page.evaluate('setSpeed(0)')
    page.wait_for_function('document.body.classList.contains("game-paused")')
    clock=page.evaluate('({vt:UI.vt,time:G.time,ruin:ruinSprite({w:2,h:3},true)})')
    page.wait_for_timeout(450)
    assert clock==page.evaluate('({vt:UI.vt,time:G.time,ruin:ruinSprite({w:2,h:3},true)})')
    assert page.evaluate('getComputedStyle(document.body).animationPlayState')=='paused'
    page.evaluate('setSpeed(1)');page.wait_for_function('!document.body.classList.contains("game-paused")&&UI.vt>'+str(clock['vt']))
    page.evaluate('setSpeed(0);openWin_pins()')
    page.wait_for_function('!pixelScrollbars.get(WINS.pins.body).y.rail.hidden')
    assert page.locator('.win[data-id=pins] .wx').evaluate('e=>getComputedStyle(e).cursor===PIXXO_CURSORS.pointer.css')
    assert page.locator('.pixxo-scrollbar:not([hidden])').first.evaluate('e=>getComputedStyle(e).cursor===PIXXO_CURSORS.pointer.css')
    assert page.evaluate('Array.from(document.querySelectorAll("body *")).filter(e=>e.getClientRects().length).every(e=>getComputedStyle(e).cursor.startsWith("url("))')
    print(page.evaluate(r'''()=>{
      const oldGhost=ghostTile,oldTool=UI.tool,oldType=UI.type,oldPlaced=UI.placementGridPlaced;
      try{
        ghostTile=()=>({x:100,y:100});UI.tool='build';UI.type='haus';UI.placementGridPlaced=null;
        const a=document.createElement('canvas');a.width=a.height=480;const c=a.getContext('2d');c.fillStyle='#657b4b';c.fillRect(0,0,480,480);c.translate(-100*16+240,-100*16+240);
        const original=c.stroke.bind(c),alphas=[],points=[],move=c.moveTo.bind(c);c.stroke=()=>{alphas.push(c.strokeStyle);original()};c.moveTo=(x,y)=>{points.push([x,y]);move(x,y)};drawPlacementGrid(c);
        if(new Set(alphas).size<10||Math.min(...points.map(p=>p[0]))>93*16||Math.max(...points.map(p=>p[0]))<107*16)throw Error('Grid range/fade');
        window.placementGridPreview=a.toDataURL();const n=alphas.length;UI.placementGridPlaced={tool:UI.tool,type:UI.type,x:100,y:100};drawPlacementGrid(c);if(alphas.length!==n)throw Error('Grid remains after placement');
        const markers=document.createElement('canvas');markers.width=640;markers.height=200;const g=markers.getContext('2d');g.imageSmoothingEnabled=false;g.fillStyle='#657b4b';g.fillRect(0,0,640,200);g.font='16px sans-serif';g.fillStyle='#f3e6c8';
        ['front','left','back','right'].forEach((side,i)=>{const a=HD_CATALOG.get('stollen_'+side+'0').pixelSource;if(a.width!==16||a.height!==16)throw Error('Marker grid');nativeDrawImage.call(g,a,i*160+16,35,128,128);g.fillText(side,i*160+16,20)});window.mineMarkerPreview=markers.toDataURL();
        return {grid:'eight-tile fade, clears after placement',mineMarkers:4};
      }finally{ghostTile=oldGhost;UI.tool=oldTool;UI.type=oldType;UI.placementGridPlaced=oldPlaced;}
    }'''))
    for name,var in [('placement-grid-fade.png','placementGridPreview'),('mine-placeholders-compact.png','mineMarkerPreview')]:
        (root/'pixxo_tests'/name).write_bytes(base64.b64decode(page.evaluate(var).split(',')[1]))
    print(page.evaluate(r'''()=>{
      for(const id in WINS)closeWin(id);const d=G.blds.find(b=>b.type==='kontor'),x=d.x+15,y=d.y+15;G.gold=100000;for(const g of GOODS)G.stock[g.id]=10000;
      for(let yy=y-3;yy<y+15;yy++)for(let xx=x-3;xx<x+15;xx++){const k=IDX(xx,yy);G.occ[k]=0;G.road[k]=0;delete G.bridges[k];G.tiles[k]=T.GRASS;G.river[k]=0;islandOwners[k]=activeIsland;}
      const cells=Array.from({length:7},(_,i)=>IDX(x+i,y+i));for(const k of cells.slice(1,-1)){G.tiles[k]=T.SHAL;G.river[k]=1;G.riverCells.push(k);}
      const crossing=riverCrossing(cells[0],1,1);if(!crossing||crossing.cells.length!==7)throw Error('Diagonal crossing rejected');
      const path=plannedRoadPath({x,y},{x:x+6,y:y+6});if(!path||!riverPlanDetails({path,island:activeIsland,mode:'woodbridge'}).valid)throw Error('Diagonal planner');
      if(commitRoadPlan({path:cells,island:activeIsland,mode:'woodbridge'})!==true)throw Error('Diagonal commit');
      if(G.bridges[cells[0]]||G.bridges[cells[6]]||!cells.slice(1,-1).every(k=>G.bridges[k]?.dx===1&&G.bridges[k]?.dy===1))throw Error('Diagonal water-only metadata');
      if(!roadStepAllowed(x,y,x+1,y+1)||!roadStepAllowed(x+1,y+1,x+2,y+2))throw Error('Diagonal transport');
      const pillar=cells[3],board={tiles:G.tiles,road:G.road,occ:G.occ,river:G.river,bridges:G.bridges};G.bridges[pillar].pier=true;
      if(ambientHabitat(board,'boat',pillar%MAPW,Math.floor(pillar/MAPW)))throw Error('Pier not an obstacle');
      const entry={kind:'boat',path:cells.slice(1,-1),seed:1};ambientPosition(entry,board,0);if(entry.path.some(k=>ambientBridge(board,k)?.pier))throw Error('Boat cached route through pier');
      return {diagonal:true,waterOnly:true,boatsAvoidPiers:true};
    }'''))
    assert not errors,errors
    browser.close()
    print('PASS: tutorial focus/build lock, native eight-frame ruin footprints, diagonal bridges, pause and custom cursors.')
