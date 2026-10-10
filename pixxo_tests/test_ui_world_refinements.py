"""Loading, live prerequisites, building tags, saves, bevels and working fields."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe', headless=True)
    page = browser.new_page(viewport={'width': 1440, 'height': 1000})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto((root/'pixxo.html').as_uri())
    page.wait_for_function('StartScreen.ready')
    page.locator('[data-start=new]').click()
    page.wait_for_function('StartScreen.started')
    page.evaluate('tutorialFinish();saveGame();startShow()')
    page.wait_for_selector('#pixxo-loading', state='detached')
    page.evaluate("""()=>{window.resumePainted=false;window.resumeLoaded=false;
        const original=loadGame;loadGame=function(...args){const s=document.getElementById('pixxo-loading');window.resumeLoaded=!!s&&!s.classList.contains('loaded')&&getComputedStyle(s).opacity==='1';return original(...args);};
        startDialog.addEventListener('click',e=>{if(e.target.closest('[data-start=continue]'))requestAnimationFrame(()=>{const s=document.getElementById('pixxo-loading');window.resumePainted=!!s&&!s.classList.contains('loaded');});},{once:true});
        StartScreen.started=false;
    }""")
    page.locator('[data-start=continue]').click()
    page.wait_for_function('StartScreen.started&&!StartScreen.loading')
    page.wait_for_selector('#pixxo-loading', state='detached')
    assert page.evaluate('resumePainted&&resumeLoaded'), 'Loader was not painted before loading'
    page.evaluate('tutorialFinish();setSpeed(0)')
    axe = os.environ.get('PIXXO_AXE_SCRIPT')
    if axe:
        page.add_script_tag(path=axe)
    print('Continue paints loading before loading saved world.')

    page.evaluate("""()=>{window.beforeReq=B.fischer.req;B.fischer.req=999999;G.quests.u_fischer=false;G.gold=99999;for(const k in G.stock)G.stock[k]=500;UI.cat='roh';UI.holdUI=false;renderItems(true);window.liveCard=document.querySelector('#items [data-b=fischer]');window.liveViewport=document.querySelector('.items-viewport');liveViewport.focus();liveViewport.scrollLeft=30;window.liveScroll=liveViewport.scrollLeft;}""")
    assert page.locator('#items [data-b=fischer]').is_disabled()
    page.evaluate('G.quests.u_fischer=true')
    page.wait_for_function('!document.querySelector("#items [data-b=fischer]").disabled', timeout=3000)
    assert page.evaluate('document.querySelector("#items [data-b=fischer]")===liveCard&&document.activeElement===liveViewport&&liveViewport.scrollLeft===liveScroll')
    page.evaluate('G.gold=0')
    page.wait_for_function('document.querySelector("#items [data-b=fischer]").disabled')
    page.evaluate('G.gold=99999;B.fischer.req=beforeReq')
    print('Prerequisites update with keyboard focus and preserve card nodes and scroll.')

    page.evaluate("""()=>{const port=G.blds.find(b=>b.type==='kontor');window.testFarm={id:888771,type:'farm',x:port.x+8,y:port.y+8,w:B.farm.w,h:B.farm.h,island:activeIsland,paused:false,fire:0,conn:true,eff:1,prog:0,status:'Produziert',inputStock:{}};G.byId.set(testFarm.id,testFarm);UI.sel=testFarm.id;openWin('info','Getreidehof',infoHTML);refreshWins();}""")
    body = page.locator('.win[data-id=info] .wb')
    page.evaluate('testFarm.staffAssigned=8;testFarm.staffEff=1;refreshWins()')
    assert body.locator('[data-act=field-sites]').count() == 0
    assert body.locator('p[role=status]').count() == 0
    assert body.locator('[data-act=fields]').inner_text() == 'Feld platzieren'
    assert f"0 / {page.evaluate('FIELD_RULES.farm.count')} Ackerfläche" in body.inner_text()
    assert 'maximal 24 Felder Abstand' not in body.inner_text()
    assert 'Betriebsflächen: einzeln' not in body.inner_text()
    assert body.locator('.tag.status-error').inner_text() == 'Kein Lager in Reichweite'
    assert body.locator('.building-actions .btn').count() == 3
    sizes = body.locator('.building-actions .btn').evaluate_all('(els)=>els.map(e=>{const r=e.getBoundingClientRect();return {width:r.width,height:r.height,top:r.top};})')
    assert max(s['width'] for s in sizes)-min(s['width'] for s in sizes)<1
    assert len(set(s['top'] for s in sizes))==1 and min(s['height'] for s in sizes)>=44
    page.evaluate('testFarm.type="schaefer";testFarm.w=B.schaefer.w;testFarm.h=B.schaefer.h;refreshWins()')
    assert body.locator('[data-act=fields]').inner_text() == 'Gehege platzieren'
    page.evaluate('testFarm.paused=true;refreshWins()')
    assert body.locator('.tag').inner_text() == 'Pausiert'
    assert body.locator('.tag.status-error').count() == 0
    page.evaluate('testFarm.fire=50;refreshWins()')
    assert body.locator('.tag.status-error').inner_text() == 'In Flammen'
    page.evaluate('testFarm.fire=0;testFarm.paused=false;testFarm.type="farm";refreshWins()')
    page.locator('.win[data-id=info]').screenshot(path=str(root/'pixxo_tests/building-window-compact.png'))
    for width in [1440,320]:
        page.set_viewport_size({'width':width,'height':1000})
        assert body.evaluate('e=>e.scrollWidth<=e.clientWidth'), 'Building window overflows'
        sizes=body.locator('.building-actions .btn').evaluate_all('es=>es.map(e=>e.getBoundingClientRect().top)')
        assert len(set(sizes))==1, 'Action buttons wrap into rows'
        if axe:
            violations=page.evaluate("async()=> (await axe.run('.win[data-id=info]')).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.html)}))")
            assert not violations, violations
    page.set_viewport_size({'width':1440,'height':1000})
    print('Building status tags, shortened fields and equal action buttons verified.')

    print(page.evaluate("""()=>{
        const owner=testFarm,b={id:888772,type:'acker',fieldOwner:owner.id,island:activeIsland,rotation:0},before={time:G.time,speed:G.speed},stock=JSON.stringify(G.stock),canvas=document.createElement('canvas');
        canvas.width=700;canvas.height=770;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.fillStyle='#21190f';ctx.fillRect(0,0,700,770);ctx.font='16px sans-serif';
        try{G.speed=1;let row=0;
            for(const crop of Object.keys(FIELD_CROP_SPRITES)){owner.type=crop;owner.status='Produziert';ctx.fillStyle='#fff0dd';ctx.fillText(crop,10,row*110+20);const names=new Set();for(let f=0;f<6;f++){G.time=f/3;names.add(workshopSprite(b));const source=HD_CATALOG.get(workshopSprite(b)).pixelSource;nativeDrawImage.call(ctx,source,10+f*110,row*110+30,64,64);nativeDrawImage.call(ctx,fieldWorkerSprite(f),26+f*110,row*110+38,32,32);}if(names.size!==1)throw Error('Workers must not be baked into field textures');row++;}
            owner.paused=true;G.time=1;const idle=workshopSprite(b);G.time=2;if(workshopSprite(b)!==idle||idle.includes('_work_'))throw Error('Paused farm still works');owner.paused=false;
            owner.status='Rohstoffe fehlen';if(workshopSprite(b).includes('_work_'))throw Error('Blocked farm still works');owner.status='Produziert';
            owner.fire=10;if(workshopSprite(b).includes('_work_'))throw Error('Burning farm still works');owner.fire=0;
            for(let r=0;r<4;r++){b.rotation=r;const source=SP[workshopSprite(b)];if(source.width!==16||source.height!==16)throw Error('Worker changed field raster');}
        }finally{G.time=before.time;G.speed=before.speed;owner.type='farm';owner.status='Produziert';owner.paused=false;owner.fire=0;}
        if(JSON.stringify(G.stock)!==stock)throw Error('Animation changes resources');const img=document.createElement('img');img.id='working-fields-test';img.src=canvas.toDataURL();Object.assign(img.style,{position:'fixed',inset:0,zIndex:999999});document.body.append(img);return {crops:Object.keys(FIELD_CROP_SPRITES).length,frames:6,raster:'16 x 16'};
    }"""))
    page.locator('#working-fields-test').screenshot(path=str(root/'pixxo_tests/working-fields.png'))
    page.emulate_media(reduced_motion='reduce')
    assert page.evaluate("(()=>{const b={id:888772,type:'acker',fieldOwner:testFarm.id,island:activeIsland};G.time=2;const a=workshopSprite(b);G.time=3;return a===workshopSprite(b);})()")
    page.emulate_media(reduced_motion='no-preference')
    page.evaluate('document.getElementById("working-fields-test").remove();closeWin("info");UI.sel=null;G.byId.delete(testFarm.id);openWin_menu()')
    page.locator('.win[data-id=menu] [data-act=save]').click()
    assert page.locator('#save-feedback').is_visible()
    assert 'erfolgreich gespeichert' in page.locator('#save-feedback-text').inner_text()
    assert page.evaluate('!!localStorage.getItem(SAVEKEY)')
    if axe:
        for width in [1440,320]:
            page.set_viewport_size({'width':width,'height':568 if width==320 else 1000})
            violations=page.evaluate("async()=> (await axe.run('#save-feedback')).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.html)}))")
            assert not violations, violations
            assert page.locator('#save-feedback').evaluate('(e)=>e.scrollWidth<=e.clientWidth')
            assert page.locator('#save-feedback').evaluate("e=>[...e.querySelectorAll('h2,p,button')].every(n=>parseFloat(getComputedStyle(n).fontSize)>=14)")
    page.keyboard.press('Escape')
    assert page.locator('#save-feedback').is_hidden()
    assert page.locator('.win[data-id=menu] [data-act=save]').evaluate('e=>e===document.activeElement')
    page.evaluate('saveGame()')
    assert page.locator('#save-feedback').is_hidden(), 'Autosave must not open feedback'
    page.evaluate("""()=>{window.storageWrite=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===SAVEKEY)throw new Error('Test storage full');return storageWrite.call(this,k,v);};winAct('menu',{act:'save'});Storage.prototype.setItem=storageWrite;}""")
    assert page.locator('#save-feedback-title').inner_text() == 'Speichern fehlgeschlagen'
    page.locator('[data-save-feedback-close]').click()
    print('Manual save success/failure, Escape focus, 320px reflow and axe verified.')
    page.set_viewport_size({'width':1440,'height':1000})

    print(page.evaluate("""()=>{
        const port=G.blds.find(b=>b.type==='kontor'),x=port.x+1,y=port.y+1,saved=[],deposit=G.deposits;
        for(let b=y-5;b<=y+5;b++)for(let a=x-5;a<=x+5;a++){const k=IDX(a,b);saved.push([k,G.tiles[k],G.road[k],G.occ[k]]);G.tiles[k]=T.GRASS;G.road[k]=0;G.occ[k]=0;}
        G.deposits=[];let corners=0;
        try{for(const [dx,dy] of [[-1,-1],[1,-1],[1,1],[-1,1]]){
            const k=IDX(x,y);G.tiles[k]=corners%2?T.ORE:T.ROCK;const a={x:x+dx,y},b={x,y:y+dy};
            if(!rockCornerBevel(x,y,dx,dy)||!roadStepAllowed(a.x,a.y,b.x,b.y)||plannedRoadPath(a,b)?.length!==2)throw Error('Exposed rock corner blocks diagonal '+JSON.stringify({dx,dy,bevel:rockCornerBevel(x,y,dx,dy),step:roadStepAllowed(a.x,a.y,b.x,b.y),path:plannedRoadPath(a,b),island:islandAt(x,y),activeIsland}));
            G.road[IDX(x+dx,y+dy)]=1;if(roadStepAllowed(a.x,a.y,b.x,b.y))throw Error('T junction makes triangle');G.road[IDX(x+dx,y+dy)]=0;
            G.occ[k]=999;if(roadStepAllowed(a.x,a.y,b.x,b.y))throw Error('Occupied rock allowed');G.occ[k]=0;
            G.tiles[IDX(x+dx,y)]=T.SHAL;if(rockCornerBevel(x,y,dx,dy))throw Error('Water bevel allowed');G.tiles[IDX(x+dx,y)]=T.GRASS;
            G.tiles[IDX(x+dx,y)]=T.ROCK;if(rockCornerBevel(x,y,dx,dy))throw Error('Internal mountain bevel allowed');G.tiles[IDX(x+dx,y)]=T.GRASS;corners++;
        }
        const canvas=document.createElement('canvas');canvas.width=canvas.height=16;const ctx=canvas.getContext('2d');clipRockTile(ctx,x,y,0,0);ctx.fillStyle='#fff';ctx.fillRect(0,0,16,16);const data=ctx.getImageData(0,0,16,16).data;if(data[3]||data[(8*16+8)*4+3]!==255)throw Error('Clip is not beveled');
        for(let b=y;b<y+4;b++)for(let a=x;a<x+4;a++)G.tiles[IDX(a,b)]=T.ROCK;
        G.road[IDX(x-1,y)]=G.road[IDX(x,y-1)]=2;land.chunks.clear();MOUNTAIN_TERRACES.delete(G.tiles);
        const preview=document.createElement('canvas');preview.width=preview.height=528;const g=preview.getContext('2d');g.imageSmoothingEnabled=false;g.scale(3,3);
        for(let b=y-5;b<=y+5;b++)for(let a=x-5;a<=x+5;a++){const chunk=terrainChunk(Math.floor(a/16),Math.floor(b/16));nativeDrawImage.call(g,chunk,(a%16)*32,(b%16)*32,32,32,(a-x+5)*16,(b-y+5)*16,16,16);}
        g.save();g.translate((5-x)*16,(5-y)*16);drawRoadTile(g,16,true,x-1,y);drawRoadTile(g,64,true,x,y-1);g.restore();
        const img=document.createElement('img');img.id='rock-bevel-test';img.src=preview.toDataURL();Object.assign(img.style,{position:'fixed',inset:0,zIndex:999999});document.body.append(img);
        }finally{G.deposits=deposit;for(const [k,t,r,o] of saved){G.tiles[k]=t;G.road[k]=r;G.occ[k]=o;}land.chunks.clear();MOUNTAIN_TERRACES.delete(G.tiles);}
        return {beveledCorners:corners,ore:true,waterBlocked:true,tJunctionBlocked:true};
    }"""))
    page.locator('#rock-bevel-test').screenshot(path=str(root/'pixxo_tests/rock-beveled-road.png'))
    page.evaluate('document.getElementById("rock-bevel-test").remove()')
    page.evaluate("""()=>{const b=G.blds.find(b=>b.type==='kontor'),original=upgradeRequest,tool=UI.tool,draws=[];try{UI.tool='upgrade';upgradeRequest=c=>c===b?{ready:true,affordable:true}:null;drawUpgradeArrows({drawImage:(...a)=>draws.push(a)});if(draws.length!==1||draws[0][2]!==upgradeArrowTop(b)-24)throw Error('Upgrade arrow placement');}finally{UI.tool=tool;upgradeRequest=original;}}""")
    assert not errors, errors
    browser.close()
