"""Eight-frame native demolition, all rotations/night, gameplay and reduced motion."""
import base64
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    page=browser.new_page(viewport={'width':1440,'height':1000})
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((root/'pixxo.html').as_uri());page.wait_for_function('StartScreen.ready');page.locator('[data-start=new]').click();page.wait_for_function('StartScreen.started');page.evaluate('tutorialFinish();setSpeed(0)')
    sheet=page.evaluate(r"""()=>{
      const examples=[{type:'haus',tier:1,visualVariant:0},{type:'haus',tier:2,visualVariant:2},{type:'haus',tier:3,visualVariant:1},{type:'haus',tier:4,visualVariant:3},...['zementwerk','betonwerk','glashuette','kalkbrennerei','kirche','werft','garten','gemeinschaftshaus'].map(type=>({type,tier:1}))];
      const overview=document.createElement('canvas');overview.width=1440;overview.height=examples.length*190*2;const c=overview.getContext('2d');c.imageSmoothingEnabled=false;c.font='14px sans-serif';
      let checked=0,maxMs=0;
      for(let n=0;n<examples.length;n++)for(let rotation=0;rotation<4;rotation++){
        const b={...examples[n],id:800+n,island:activeIsland,x:0,y:0,w:B[examples[n].type].w,h:B[examples[n].type].h,rotation},source=demolitionSource(b).source,start=performance.now(),frames=demolitionFrames(source);maxMs=Math.max(maxMs,performance.now()-start);
        if(frames.length!==8||frames.some(a=>a.width!==source.width||a.height!==source.height))throw Error('Native bounds '+b.type);
        if(frames[0].toDataURL()!==source.toDataURL())throw Error('Initial appearance changed '+b.type);
        if(demolitionFrames(source)!==frames)throw Error('Frame cache not shared');
        for(const a of frames){const pixels=a.getContext('2d').getImageData(0,0,a.width,a.height).data;if(pixels.some((v,i)=>i%4===3&&v!==0&&v!==255))throw Error('Soft native edges '+b.type);}
        if(new Set(frames.map(a=>a.toDataURL())).size<6)throw Error('Collapse frames too similar '+b.type);
        if(rotation===0)for(let night=0;night<2;night++)for(let f=0;f<8;f++){
          const x=f*180,y=(n*2+night)*190;c.fillStyle=night?'#26313b':'#657b5e';c.fillRect(x,y,180,190);c.fillStyle='#fff0cb';c.fillText(B[b.type].n+' '+(f+1)+(night?' Nacht':''),x+4,y+18);
          const effect={source,frames,x:x+Math.max(0,(180-source.width*2)/2),y:y+24,start:UI.vt-f/8*.72};c.save();c.translate(effect.x,effect.y);c.scale(2,2);effect.x=effect.y=0;drawDemolition(c,effect);if(night){c.globalCompositeOperation='source-atop';c.fillStyle='rgba(12,24,45,.45)';c.fillRect(0,0,source.width,source.height);}c.restore();
        }
        checked++;
      }
      if(DEMOLITION_FRAMES.size>48||demolitionPixels>DEMOLITION_ART.cachePixels)throw Error('Cache exceeds limit');
      window.demolitionMeasurements={appearances:checked,maxPrepareMs:Math.round(maxMs*100)/100};return overview.toDataURL();
    }""")
    (root/'pixxo_tests/demolition-eight-frames.png').write_bytes(base64.b64decode(sheet.split(',')[1]))
    print(page.evaluate('demolitionMeasurements'))
    print(page.evaluate(r"""()=>{
      const port=G.blds.find(b=>b.type==='kontor'),x=port.x+10,y=port.y+10;
      window.addDemolitionFixture=(type,dx,dy,extra={})=>{const d=B[type],b={id:G.nid++,type,x:x+dx,y:y+dy,w:d.w,h:d.h,island:activeIsland,tier:1,pop:0,rotation:0,visualVariant:0,inputStock:{},...extra};G.blds.push(b);G.byId.set(b.id,b);for(const [tx,ty] of footprintCells(b.x,b.y,b.w,b.h)){G.tiles[IDX(tx,ty)]=T.GRASS;islandOwners[IDX(tx,ty)]=activeIsland;G.occ[IDX(tx,ty)]=b.id;}return b;};
      const house=addDemolitionFixture('haus',0,0,{tier:3,rotation:2,visualVariant:3}),cost=type2cost(house).gold||0,gold=G.gold;
      const result=demolishAt(house.x,house.y);if(result!==false||!WINS.demolition||DEMOLITION_EFFECTS.length)throw Error('Unconfirmed demolition animated');winAct('demolition',{act:'demolish-confirm'});if(G.byId.has(house.id)||G.occ[IDX(house.x,house.y)]||G.gold!==gold+Math.floor(cost*.5))throw Error('Demolition logic/refund changed '+JSON.stringify({result,exists:G.byId.has(house.id),occupied:G.occ[IDX(house.x,house.y)],gold,cost,after:G.gold}));
      if(DEMOLITION_EFFECTS.length!==1)throw Error('Missing visual effect');
      addDemolitionEffects(0,0,MAPW*16,MAPH*16);const effect=DEMOLITION_EFFECTS[0];if(!effect.frames||effect.frames.length!==8)throw Error('Frames not prepared');
      const canvas=document.createElement('canvas');canvas.width=canvas.height=100;const ctx=canvas.getContext('2d');const copy={...effect,x:0,y:0,start:UI.vt};ctx.globalAlpha=.7;drawDemolition(ctx,copy);if(ctx.globalAlpha!==.7)throw Error('Drawing state leaked');
      ENT.length=0;addDemolitionEffects(0,0,MAPW*16,MAPH*16);if(!ENT.some(e=>e[1]===6&&e[0]===effect.depth))throw Error('Effect not depth sorted');
      const count=DEMOLITION_EFFECTS.length;if(demolishAt(port.x,port.y)===true||DEMOLITION_EFFECTS.length!==count)throw Error('Refused demolition animated');
      const silent=addDemolitionFixture('haus',5,0);removeBld(silent,false);if(DEMOLITION_EFFECTS.length!==count)throw Error('Non-demolition removal animated');
      const farm=addDemolitionFixture('farm',10,0),field=addDemolitionFixture('acker',15,0,{fieldOwner:farm.id});removeBld(farm,true);if(G.byId.has(field.id)||DEMOLITION_EFFECTS.length!==count+2)throw Error('Attached field removal changed');
      for(let i=0;i<4;i++)addDemolitionEffects(0,0,MAPW*16,MAPH*16);UI.vt+=1;addDemolitionEffects(0,0,MAPW*16,MAPH*16);if(DEMOLITION_EFFECTS.length)throw Error('Completed effects retained');
      saveGame();if(localStorage.getItem(SAVEKEY).includes('DEMOLITION'))throw Error('Effects persisted');
      return {refund:true,freeTile:true,depthSorting:true,fields:true,cleanup:true};
    }"""))
    page.emulate_media(reduced_motion='reduce');page.wait_for_function('WORK_ART.reduced.matches')
    page.evaluate(r"""()=>{const b=addDemolitionFixture('haus',0,10);removeBld(b,true);addDemolitionEffects(0,0,MAPW*16,MAPH*16);const effect=DEMOLITION_EFFECTS[0];if(effect.frames!==null)throw Error('Reduced motion generated collapse');const c=document.createElement('canvas');c.width=c.height=100;UI.vt+=.09;drawDemolition(c.getContext('2d'),{...effect,x:0,y:0});if(!c.getContext('2d').getImageData(0,0,100,100).data.some((v,i)=>i%4===3&&v>0&&v<255))throw Error('Reduced motion fade missing');UI.vt+=.1;addDemolitionEffects(0,0,MAPW*16,MAPH*16);if(DEMOLITION_EFFECTS.length)throw Error('Reduced motion cleanup');}""")
    assert not errors,errors
    browser.close()
    print('PASS: Eight native collapse frames, rotations/day/night, refunds/fields, cache, drawing order and reduced motion.')
