"""Native ships, all headings/phases, ocean, surf and daytime cloud shadows."""
from pathlib import Path
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    page=browser.new_page(viewport={'width':1440,'height':1000})
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((root/'pixxo.html').as_uri());page.wait_for_function('StartScreen.ready')
    page.locator('[data-start=new]').click();page.wait_for_function('StartScreen.started');page.evaluate('tutorialFinish();setSpeed(0)')
    print(page.evaluate("""()=>{
        const stock=JSON.stringify(G.stock),canvas=document.createElement('canvas');canvas.width=1160;canvas.height=600;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#285f9c';c.fillRect(0,0,1160,600);c.font='16px sans-serif';c.fillStyle='#fff0dd';let minColors=100;
        for(const [row,type] of ['schooner','clipper'].entries()){c.fillText(type+' — alle acht Richtungen',10,row*165+20);const headings=new Set();for(let d=0;d<8;d++){const phases=new Set();for(let f=0;f<6;f++){const source=makeDirectionalShip(d,type,f);if(source.width!==64||source.height!==64||source!==makeDirectionalShip(d,type,f))throw Error('Raster/cache changed');const pixels=source.getContext('2d').getImageData(0,0,64,64).data,colors=new Set();for(let i=0;i<pixels.length;i+=4){if(pixels[i+3]!==0&&pixels[i+3]!==255)throw Error('Blurred ship edge');if(pixels[i+3])colors.add(pixels[i]+','+pixels[i+1]+','+pixels[i+2]);}minColors=Math.min(minColors,colors.size);phases.add(Array.from(pixels).join(','));if(!f)headings.add(Array.from(pixels).join(','));}if(phases.size<4)throw Error('Directional animation absent');nativeDrawImage.call(c,makeDirectionalShip(d,type,0),10+d*142,row*165+30,128,128);}if(headings.size!==8)throw Error('Missing diagonal views');}
        for(let f=0;f<6;f++)nativeDrawImage.call(c,makeDirectionalShip(7,'clipper',f),10+f*142,365,128,128);c.fillText('Klipper nach Nordost — sechs Phasen',10,350);
        if(MARITIME_SHIP_CACHE.size!==96||minColors<18)throw Error('Insufficient detail / unbounded cache');if(JSON.stringify(G.stock)!==stock)throw Error('Art changed resources');
        const img=document.createElement('img');img.id='marine-ships-test';img.src=canvas.toDataURL();Object.assign(img.style,{position:'fixed',inset:0,zIndex:999999});document.body.append(img);return {directions:8,phases:6,cached:96,minColors};
    }"""))
    page.locator('#marine-ships-test').screenshot(path=str(root/'pixxo_tests/detailed-ships.png'))
    page.evaluate('document.getElementById("marine-ships-test").remove()')
    print(page.evaluate("""()=>{
        const canvas=document.createElement('canvas');canvas.width=768;canvas.height=512;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;const hashes=new Set();
        for(let f=0;f<12;f++){const s=oceanSprite(f);if(s!==oceanSprite(f))throw Error('Water cache misses');hashes.add(s.toDataURL());nativeDrawImage.call(c,s,(f%6)*128,Math.floor(f/6)*128);}
        if(hashes.size!==12||OCEAN_SPRITES.size!==12)throw Error('Water lacks phases');
        c.fillStyle=c.createPattern(oceanSprite(3),'repeat');c.fillRect(0,256,768,256);const clock=dayClock(),minutes=clock.minutes,system=clock.system,time=G.time;
        try{clock.system=false;clock.minutes=720;G.time=0;const before=c.getImageData(0,256,768,256).data;drawDayClouds(c,0,256,768,512);const after=c.getImageData(0,256,768,256).data;if(before.every((v,i)=>v===after[i]))throw Error('Day clouds absent');clock.minutes=0;const a=Array.from(after);drawDayClouds(c,0,256,768,512);const night=c.getImageData(0,256,768,256).data;if(a.some((v,i)=>v!==night[i]))throw Error('Clouds visible at night');}finally{clock.minutes=minutes;clock.system=system;G.time=time;}
        const img=document.createElement('img');img.id='marine-water-test';img.src=canvas.toDataURL();Object.assign(img.style,{position:'fixed',inset:0,zIndex:999999});document.body.append(img);return {waterPhases:hashes.size,clouds:'day only'};
    }"""))
    page.locator('#marine-water-test').screenshot(path=str(root/'pixxo_tests/detailed-water.png'))
    page.evaluate('document.getElementById("marine-water-test").remove()')
    print(page.evaluate("""()=>{
        const c=document.createElement('canvas');c.width=640;c.height=220;const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;const oldTiles=G.tiles,oldTime=G.time;G.tiles=new Uint8Array(oldTiles.length);for(let x=10;x<20;x++)G.tiles[IDX(x,10)]=T.SAND;
        try{for(let f=0;f<4;f++){ctx.save();ctx.translate(f*160-10*16,40-10*16);ctx.fillStyle='#c9b47c';ctx.fillRect(10*16,10*16,160,64);ctx.fillStyle=ctx.createPattern(oceanSprite(f),'repeat');ctx.fillRect(10*16,9*16,160,16);G.time=f*1.1;drawBeachSurf(ctx,10,9,19,10);ctx.restore();}}finally{G.tiles=oldTiles;G.time=oldTime;}
        const img=document.createElement('img');img.id='marine-surf-test';img.src=c.toDataURL();Object.assign(img.style,{position:'fixed',inset:0,zIndex:999999});document.body.append(img);return {surfPhases:4};
    }"""))
    page.locator('#marine-surf-test').screenshot(path=str(root/'pixxo_tests/beach-surf.png'))
    page.emulate_media(reduced_motion='reduce')
    assert page.evaluate("""(()=>{const calls=[],ctx={drawImage:s=>calls.push(s)},time=G.time;try{G.time=1;drawShipSprite(ctx,{x:1,y:1},7,'clipper');G.time=99;drawShipSprite(ctx,{x:1,y:1},7,'clipper');return calls[0]===calls[1];}finally{G.time=time;}})()""")
    page.emulate_media(reduced_motion='no-preference')
    print(page.evaluate("""()=>{const c=document.createElement('canvas');c.width=680;c.height=280;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.fillStyle='#767b87';g.fillRect(0,0,680,280);g.font='16px sans-serif';g.fillStyle='#fff';const entries=[];for(const [row,type] of ['steinbruch','mine'].entries())for(const [col,side] of ['south','east','north','west'].entries()){const source=importedPixels(IMPORTED_ENTRIES.get(type+'_berg_'+side),0);entries.push({type,side,w:source.width,h:source.height});nativeDrawImage.call(g,source,10+col*160,row*140+30,source.width*2,source.height*2);g.fillText(type+' '+side,10+col*160,row*140+20);}const img=document.createElement('img');img.id='mine-source-test';img.src=c.toDataURL();Object.assign(img.style,{position:'fixed',inset:0,zIndex:999999});document.body.append(img);return entries;}"""))
    page.locator('#mine-source-test').screenshot(path=str(root/'pixxo_tests/mine-original-directions.png'))
    page.evaluate('document.getElementById("mine-source-test").remove();document.getElementById("marine-surf-test").remove()')
    print(page.evaluate("""()=>{const canvas=document.createElement('canvas');canvas.width=760;canvas.height=410;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#727985';c.fillRect(0,0,760,410);c.font='16px sans-serif';c.fillStyle='#fff';
        for(const [row,type] of ['steinbruch','mine'].entries())for(const [col,side] of ['south','east','north','west'].entries()){const b={type,w:B[type].w,h:B[type].h},art=miningEntranceArt(b,side,1);nativeDrawImage.call(c,art,10+col*175,25+row*135,art.width*2,art.height*2);c.fillText(type+' '+side,10+col*175,20+row*135);}
        const front=HD_CATALOG.get('stollen_front0')?.pixelSource||SP.stollen_front0;
        for(const [col,side,turn] of [[0,'front',0],[1,'left',1],[2,'right',3]]){const source=HD_CATALOG.get('stollen_'+side+'0')?.pixelSource||SP['stollen_'+side+'0'],data=source.getContext('2d').getImageData(0,0,16,16).data;
            const expected=document.createElement('canvas');expected.width=expected.height=16;const e=expected.getContext('2d');e.imageSmoothingEnabled=false;e.translate(8,8);e.rotate(turn*Math.PI/2);nativeDrawImage.call(e,front,-8,-8,16,16);const bytes=e.getImageData(0,0,16,16).data;for(let k=0;k<data.length;k++)if(data[k]!==bytes[k])throw Error('Marker is not an exact quarter-turn');nativeDrawImage.call(c,source,10+col*175,315,64,64);c.fillText('Bauplatz '+side,10+col*175,305);}
        const img=document.createElement('img');img.id='mine-refined-test';img.src=canvas.toDataURL();Object.assign(img.style,{position:'fixed',inset:0,zIndex:999999});document.body.append(img);return {markers:'exact quarter-turns',mines:'four sides'};}"""))
    page.locator('#mine-refined-test').screenshot(path=str(root/'pixxo_tests/refined-mines.png'))
    page.evaluate('document.getElementById("mine-refined-test").remove()')
    print(page.evaluate("""()=>{const canvas=document.createElement('canvas');canvas.width=780;canvas.height=260;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#285f9c';c.fillRect(0,0,780,260);const phases=new Set();for(let f=0;f<6;f++){const a=shipyardArt(f,true);phases.add(a.low.toDataURL());nativeDrawImage.call(c,a.low,5+f*128,10,120,158);}if(phases.size!==6)throw Error('Shipyard lacks six phases');const img=document.createElement('img');img.id='yard-refined-test';img.src=canvas.toDataURL();Object.assign(img.style,{position:'fixed',inset:0,zIndex:999999});document.body.append(img);return {yardFrames:phases.size,buildSeconds:[SHIPS.schooner.build,SHIPS.clipper.build]};}"""))
    page.locator('#yard-refined-test').screenshot(path=str(root/'pixxo_tests/refined-shipyard.png'))
    page.evaluate('document.getElementById("yard-refined-test").remove()')
    print(page.evaluate("""()=>{const b={type:'werft',id:7,w:B.werft.w,h:B.werft.h,island:activeIsland,conn:true,eff:1},canvas=document.createElement('canvas');canvas.width=520;canvas.height=180;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#10192a';c.fillRect(0,0,520,180);const counts=[];for(let rotation=0;rotation<4;rotation++){b.rotation=rotation;const name=shipyardSprite(b),windows=nightWindows(name);if(windows.lights.length<4)throw Error('Missing shipyard windows for rotation '+rotation);counts.push(windows.lights.length);nativeDrawImage.call(c,HD_CATALOG.get(name).pixelSource,rotation*130+4,10,120,158);nativeDrawImage.call(c,windows.mask,rotation*130+4,10,120,158);}const img=document.createElement('img');img.id='yard-night-test';img.src=canvas.toDataURL();Object.assign(img.style,{position:'fixed',inset:0,zIndex:999999});document.body.append(img);return {shipyardNightWindows:counts};}"""))
    page.locator('#yard-night-test').screenshot(path=str(root/'pixxo_tests/shipyard-night-windows.png'))
    assert not errors,errors
    browser.close()
