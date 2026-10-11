"""Placement aid, one-tile well, rowing, settings and in-game return dialog."""
import base64
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe', headless=True, args=['--allow-file-access-from-files'])
    page = browser.new_page(viewport={'width':1440, 'height':1000})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('dialog', lambda d: (_ for _ in ()).throw(AssertionError('Unexpected browser dialog: '+d.message)))
    page.goto((root/'pixxo.html').as_uri()); page.wait_for_function('StartScreen.ready')
    page.locator('[data-start=settings]').click()
    assert page.locator('[data-start=tutorial]').count() == 0
    assert 'Der Hintergrund bleibt stationär' not in page.locator('#pixxo-start').inner_text()
    assert not page.locator('[data-start-preference=reducedMotion]').is_checked()
    page.locator('[data-start-preference=reducedMotion]').check()
    assert page.evaluate('WORK_ART.reduced.matches && document.body.classList.contains("reduced-motion")')
    page.locator('[data-start-preference=skipTutorials]').check()
    page.reload(); page.wait_for_function('StartScreen.ready')
    page.locator('[data-start=settings]').click()
    assert page.locator('[data-start-preference=reducedMotion]').is_checked()
    assert page.locator('[data-start-preference=skipTutorials]').is_checked()
    page.locator('[data-start-preference=reducedMotion]').uncheck()
    assert page.evaluate('!WORK_ART.reduced.matches')
    assert page.locator('#start-music-status').inner_text().startswith('Aktueller Titel:')
    page.wait_for_function('musicPlayer && !musicPlayer.paused')
    start_time = page.evaluate('musicPlayer.currentTime')
    page.evaluate('Object.defineProperty(document,"hidden",{configurable:true,value:true});document.dispatchEvent(new Event("visibilitychange"))')
    page.wait_for_function('(t)=>musicPlayer.currentTime>t+.2&&!musicPlayer.paused', arg=start_time)
    page.evaluate('delete document.hidden')
    if os.environ.get('PIXXO_AXE_SCRIPT'):
        page.add_script_tag(path=os.environ['PIXXO_AXE_SCRIPT'])
        assert not page.evaluate("async()=> (await axe.run('#pixxo-start',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))")
    page.locator('[data-start=home]').click(); page.locator('[data-start=new]').click()
    page.wait_for_function('StartScreen.started && !StartScreen.loading')
    assert page.evaluate('tutorialPanel.hidden && WORLD.tutorial.dismissed')
    print(page.evaluate(r'''()=>{
      const check=(ok,label)=>{if(!ok)throw Error(label);};setSpeed(0);
      check(B.brunnen.w===1&&B.brunnen.h===1&&buildingSize('brunnen').w===1,'Well footprint');
      const art=nativeCivicArt('brunnen');check(art.w===16&&art.h===28,'Well native bounds');
      const home=G.blds.find(b=>b.type==='kontor'),x=home.x+7,y=home.y+2;
      for(let yy=y-6;yy<y+12;yy++)for(let xx=x-6;xx<x+14;xx++){const k=IDX(xx,yy);if(!G.occ[k]){G.tiles[k]=T.GRASS;G.river[k]=0;G.road[k]=0;islandOwners[k]=activeIsland;}}
      G.gold=100000;G.stock.stein=100;G.stock.bretter=100;G.dirty=true;rebuildNet();
      setTool('build','brunnen');UI.hover={x,y};UI.touch=false;
      let strokes=0;const recorder={save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},stroke(){strokes++}};
      drawPlacementGrid(recorder);check(strokes===2,'No local grid');
      clickTile({x,y});const well=G.blds.find(b=>b.type==='brunnen'&&b.x===x&&b.y===y);check(well,'Well not placed');
      strokes=0;drawPlacementGrid(recorder);check(strokes===0,'Grid remains after building');
      UI.hover={x:x+2,y};drawPlacementGrid(recorder);check(strokes===2,'Grid does not follow next parcel');
      UI.moveId=well.id;setTool('move','brunnen');UI.hover={x:x+2,y};strokes=0;drawPlacementGrid(recorder);check(strokes===2,'No move grid');
      clickTile(UI.hover);check(!UI.tool&&well.x===x+2,'Move failed');strokes=0;drawPlacementGrid(recorder);check(strokes===0,'Move grid remains');
      // Old 2x2 save data is reconstructed with the current 1x1 footprint on load.
      well.w=well.h=2;saveGame();check(loadGame(),'Reload failed');const restored=G.byId.get(well.id);check(restored.w===1&&restored.h===1,'Old well not migrated');
      check(G.occ[IDX(restored.x,restored.y)]===well.id&&G.occ[IDX(restored.x+1,restored.y)]!==well.id,'Old occupancy remains');
      const board={tiles:new Uint8Array(MAPW*MAPH),road:new Uint8Array(MAPW*MAPH),occ:new Int32Array(MAPW*MAPH),river:new Uint8Array(MAPW*MAPH)};
      const fish=ambientChunk(board,2,2).filter(e=>e.kind==='fish');check(fish.length>=6,'Deep sea lacks fish schools');
      for(let xx=64;xx<90;xx++)board.tiles[IDX(xx,80)]=T.GRASS;
      const coastPath=ambientPath(board,'boat',70,79,12);check(coastPath.length>=10,'No coastal boat path');
      for(const direction of [[1,0],[0,1],[-1,0],[0,-1]]){
       const frames=[];for(let frame=0;frame<8;frame++){const source=HD_CATALOG.get(ambientSprite('boat',...direction,frame)).pixelSource;frames.push(source.toDataURL());const d=source.getContext('2d').getImageData(0,0,16,16).data;check(d.every((v,i)=>i%4!==3||v===0||v===255),'Soft boat pixels');}
       check(new Set(frames).size>=6,'Too few distinct rowing frames');
      }
      return {well:'1x1',placementGrid:true,oldSave:true,deepSeaSchools:fish.length,rowFrames:8};
    }'''))
    page.evaluate("()=>{for(const id in WINS)closeWin(id);const b=G.blds.find(b=>b.type==='brunnen');centerOn(cx(b),cy(b));setZoom(3,innerWidth/2,innerHeight/2);setTool('build','brunnen');UI.hover={x:b.x+2,y:b.y+1};UI.touch=false;for(let i=0;i<30;i++)render()}")
    page.screenshot(path=str(root/'pixxo_tests/placement-grid.png'))
    page.evaluate('setTool(null);toggleWin("menu");winAct("menu",{act:"start-home"})')
    assert page.locator('#start-return-confirm').is_visible()
    assert page.evaluate('document.activeElement.dataset.return==="cancel"')
    if os.environ.get('PIXXO_AXE_SCRIPT'):
        page.add_script_tag(path=os.environ['PIXXO_AXE_SCRIPT'])
        assert not page.evaluate("async()=> (await axe.run('#start-return-confirm',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>v.id)")
    page.screenshot(path=str(root/'pixxo_tests/start-return-confirm.png'))
    page.keyboard.press('Escape');assert not page.locator('#start-return-confirm').is_visible()
    page.evaluate('winAct("menu",{act:"start-home"})')
    page.locator('[data-return=confirm]').click();assert page.locator('#pixxo-start').is_visible()
    # Native day/night well, all rotations, and every rowing frame for local review.
    data=page.evaluate(r'''()=>{
      const a=document.createElement('canvas');a.width=1080;a.height=660;const c=a.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#657b5e';c.fillRect(0,0,a.width,a.height);c.fillStyle='#fff0c6';c.font='16px sans-serif';
      for(let rot=0;rot<4;rot++){const n=buildingPreviewSprite({id:7,type:'brunnen',rotation:rot,island:activeIsland,tier:1}),src=HD_CATALOG.get(n)?.pixelSource||SP[n];const x=rot*260+12;c.fillStyle='#fff0c6';c.fillText('Brunnen '+rot*90+'° · Tag / Nacht',x,22);nativeDrawImage.call(c,src,x,38,src.width*3,src.height*3);c.fillStyle='#303e45';c.fillRect(x+115,38,120,100);nativeDrawImage.call(c,src,x+115,38,src.width*3,src.height*3);c.fillStyle='rgba(8,16,42,.5)';c.fillRect(x+115,38,120,100);}
      [[1,0],[0,1],[-1,0],[0,-1]].forEach(([dx,dy],row)=>{for(let frame=0;frame<8;frame++){const x=frame*130+15,y=170+row*105,n=ambientSprite('boat',dx,dy,frame),src=HD_CATALOG.get(n).pixelSource;c.fillStyle='#285f9c';c.fillRect(x,y,96,64);nativeDrawImage.call(c,src,x+8,y,64,64);c.fillStyle='#fff0c6';c.fillText('Frame '+(frame+1),x,y+86);}});
      nativeDrawImage.call(c,PIXXO_CURSOR_BASES.default,15,610,32,32);return a.toDataURL();
    }''')
    (root/'pixxo_tests/well-rowing-preview.png').write_bytes(base64.b64decode(data.split(',')[1]))
    assert not errors, errors
    browser.close()
    print('PASS: local placement grid, one-tile well/save migration, coastal boats, eight rowing frames, deep-sea schools, saved settings, music and native dialog.')
