"""Cross-tile field paths and pig enclosure art, without touching user saves."""
from pathlib import Path
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    page=browser.new_page(viewport={'width':1100,'height':900})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((root/'pixxo.html').as_uri());page.wait_for_function('StartScreen.ready')
    page.locator('[data-start=new]').click();page.wait_for_function('StartScreen.started')
    page.evaluate('tutorialFinish();setSpeed(0)')
    print(page.evaluate("""()=>{
        const owner={id:888777,type:'farm',paused:false,fire:0,conn:true,eff:1,status:'Produziert'},fields=[];
        for(let y=10;y<13;y++)for(let x=10;x<16;x++)if(x!==12||y!==11)fields.push({id:900000+fields.length,type:'acker',fieldOwner:owner.id,x,y,w:1,h:1});
        fields.push({id:900020,type:'acker',fieldOwner:owner.id,x:20,y:10,w:1,h:1});
        const g={blds:fields,byId:new Map([[owner.id,owner]]),time:0,speed:1};window.workerFixture={g,owner};
        const pool=fieldWorkerPool(g),visited=pool.workers.map(()=>new Set());let previous=null;
        for(let step=0;step<1200;step++){g.time=step*.05;const people=fieldWorkerPositions(g);
            if(people.length!==4)throw Error('Unexpected worker density');
            people.forEach((person,i)=>{const x=Math.floor(person.x/16),y=Math.floor(person.y/16);if(!fields.some(f=>f.x===x&&f.y===y))throw Error('Worker crosses gap or foreign ground');visited[i].add(x+','+y);if(previous&&Math.hypot(person.x-previous[i].x,person.y-previous[i].y)>.27)throw Error('Worker teleports');});previous=people;
        }
        if(visited[0].size<5||visited[1].size<5||visited[2].size<5||visited[3].size!==1)throw Error('Cross-tile paths missing');
        if(fieldWorkerPool(g)!==pool)throw Error('Routes rebuilt without field changes');
        owner.paused=true;if(fieldWorkerPositions(g).length)throw Error('Paused owner has workers');owner.paused=false;
        owner.fire=30;if(fieldWorkerPositions(g).length)throw Error('Burning owner has workers');owner.fire=0;
        owner.status='Rohstoffe fehlen';if(fieldWorkerPositions(g).length)throw Error('Blocked owner has workers');owner.status='Produziert';
        fields[0].x=9;if(fieldWorkerPool(g)===pool)throw Error('Moved field did not invalidate route');fields[0].x=10;
        fields[1].fire=20;const changed=fieldWorkerPool(g);if(changed.workers.some(p=>p.path.includes(IDX(fields[1].x,fields[1].y))))throw Error('Worker on burning field');delete fields[1].fire;
        const canvas=document.createElement('canvas');canvas.width=800;canvas.height=390;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.fillStyle='#21190f';ctx.fillRect(0,0,800,390);ctx.font='16px sans-serif';ctx.fillStyle='#fff0dd';
        ctx.fillText('Feldarbeiter: mehrere Kacheln, Lücke bleibt frei',10,20);
        for(let step=0;step<3;step++){ctx.save();ctx.translate(10+step*260,35);ctx.scale(2,2);for(const field of fields)if(field.x<20)nativeDrawImage.call(ctx,cropFieldArt('farm').low,(field.x-10)*16,(field.y-10)*16,16,16);g.time=step*5;for(const person of fieldWorkerPositions(g))if(person.x<20*16)nativeDrawImage.call(ctx,fieldWorkerSprite(person.frame),person.x-10*16-3,person.y-10*16-8);ctx.restore();}
        ctx.fillText('Schweinegehege: sechs eigene Animationsphasen',10,165);const unique=new Set();
        for(let f=0;f<6;f++){const art=livestockEnclosureArt('pig',f),sheep=livestockEnclosureArt(false,f);if(art===sheep||art.width!==32||art.height!==48)throw Error('Pig sprite uses sheep or wrong raster');const pixels=Array.from(art.getContext('2d').getImageData(0,0,32,48).data).join(',');unique.add(pixels);if(pixels===Array.from(sheep.getContext('2d').getImageData(0,0,32,48).data).join(','))throw Error('Pig art identical to sheep');nativeDrawImage.call(ctx,art,10+f*130,180,96,144);}
        if(unique.size!==6)throw Error('Pig animation needs six phases');
        const img=document.createElement('img');img.id='roaming-workers-test';img.src=canvas.toDataURL();Object.assign(img.style,{position:'fixed',inset:0,zIndex:999999});document.body.append(img);
        return {visited:visited.map(s=>s.size),workers:4,pigFrames:unique.size};
    }"""))
    page.locator('#roaming-workers-test').screenshot(path=str(root/'pixxo_tests/roaming-fields-and-pigs.png'))
    page.emulate_media(reduced_motion='reduce')
    assert page.evaluate("(()=>{const g=workerFixture.g;g.time=1;const a=JSON.stringify(fieldWorkerPositions(g));g.time=999;return a===JSON.stringify(fieldWorkerPositions(g));})()")
    page.emulate_media(reduced_motion='no-preference')
    print(page.evaluate("""()=>{const b=G.blds.find(b=>b.type==='kontor'),original=bubbleFor,vt=UI.vt,positions=[];const canvas=document.createElement('canvas');canvas.width=500;canvas.height=220;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
        try{bubbleFor=item=>item===b?'schnaps':null;for(let frame=0;frame<4;frame++){const translations=[],translate=c.translate.bind(c);c.translate=(x,y)=>{translations.push(y);translate(x,y);};UI.vt=frame/3;drawBuildingWarnings(c,-Infinity,-Infinity,Infinity,Infinity);c.translate=translate;positions.push(translations[0]);}if(new Set(positions).size!==3)throw Error('Bubble not animated');const size=Math.max(1,1.5*UI.DR/UI.sc),gap=upgradeArrowTop(b)-Math.max(...positions)-22*size;if(Math.abs(gap)>1)throw Error('Bubble too far above roof');return {bubblePhases:new Set(positions).size,roofGap:gap};}finally{bubbleFor=original;UI.vt=vt;}}"""))
    page.emulate_media(reduced_motion='reduce')
    assert page.evaluate("""(()=>{const b=G.blds.find(b=>b.type==='kontor'),original=bubbleFor,vt=UI.vt,positions=[],canvas=document.createElement('canvas'),c=canvas.getContext('2d'),translate=c.translate.bind(c);try{bubbleFor=item=>item===b?'schnaps':null;c.translate=(x,y)=>{positions.push(y);translate(x,y);};UI.vt=1;drawBuildingWarnings(c,-Infinity,-Infinity,Infinity,Infinity);UI.vt=5;drawBuildingWarnings(c,-Infinity,-Infinity,Infinity,Infinity);return positions[0]===positions[1];}finally{bubbleFor=original;UI.vt=vt;}})()""")
    page.emulate_media(reduced_motion='no-preference')
    page.evaluate("""()=>{const owner={id:888779,type:'schweinehof',paused:false,fire:0,conn:true,eff:1,status:'Produziert'},field={id:888780,type:'gehege',fieldOwner:owner.id,island:activeIsland,rotation:0},before={time:G.time,speed:G.speed};G.byId.set(owner.id,owner);try{G.speed=1;const names=new Set();for(let f=0;f<6;f++){G.time=f/3;const name=workshopSprite(field);if(!name.includes('schweine'))throw Error('Placed pig enclosure uses wrong animals');names.add(name);}if(names.size!==6)throw Error('Pig phases not used');UI.fieldOwner=owner.id;setTool('build','gehege');if(HD_CATALOG.get('b_gehege').pixelSource!==livestockEnclosureArt('pig',0))throw Error('Pig preview uses wrong animals');owner.paused=true;G.time=1;const a=workshopSprite(field);G.time=2;if(a!==workshopSprite(field))throw Error('Paused pigs animate');}finally{G.byId.delete(owner.id);G.time=before.time;G.speed=before.speed;setTool(null);UI.fieldOwner=null;}}""")
    assert not errors,errors
    browser.close()
