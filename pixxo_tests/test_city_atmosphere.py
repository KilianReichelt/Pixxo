"""Straßen, Pixelgang, Musikmischung, Wetter und Konturhöhen prüfen."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    page=browser.new_page(viewport={'width':1440,'height':1000})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((root/'pixxo.html').as_uri())
    page.wait_for_function('StartScreen.ready')
    page.locator('[data-start="new"]').click()
    page.wait_for_function('StartScreen.started')
    page.evaluate('tutorialFinish();setSpeed(0)')
    port_sources=page.evaluate("""() => {
        const sheet=document.createElement('canvas');sheet.width=1600;sheet.height=600;const c=sheet.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#385b2d';c.fillRect(0,0,1600,600);c.font='16px sans-serif';const info=[];
        for(let tier=1;tier<=4;tier++){const source=HD_CATALOG.get(typeSprite('kontor',tier)).pixelSource;c.fillStyle='#f3e6c8';c.fillText('Kontor '+tier,(tier-1)*400+8,28);nativeDrawImage.call(c,source,(tier-1)*400+8,48,source.width*2.5,source.height*2.5);info.push({tier,w:source.width,h:source.height,flag:kontorFlagPixels(tier).pixels.length});}
        const image=document.createElement('img');image.id='port-review-sheet';image.src=sheet.toDataURL();Object.assign(image.style,{position:'fixed',inset:0,zIndex:99999});document.body.append(image);return info;
    }""")
    page.locator('#port-review-sheet').screenshot(path=str(root/'pixxo_tests/kontor-flags.png'))
    page.evaluate('document.querySelector("#port-review-sheet").remove()')
    print('Kontorquellen:',port_sources,flush=True)
    results=page.evaluate("""() => {
        const check=(ok,label)=>{if(!ok)throw Error(label);},meta=ISLANDS[activeIsland],x=meta.ox+50,y=meta.oy+50;
        const g={tiles:new Uint8Array(G.tiles.length).fill(T.GRASS),road:new Uint8Array(G.road.length),occ:new Int32Array(G.occ.length)};
        const rotate=(x,y,r)=>r===0?[x,y]:r===1?[-y,x]:r===2?[-x,-y]:[y,-x];
        for(let r=0;r<4;r++){
            g.road.fill(0);const nodes=[[0,0],[-1,0],[1,0],[0,1]].map(q=>rotate(...q,r)).map(([a,b])=>IDX(x+a,y+b));
            nodes.forEach(k=>g.road[k]=1);
            for(const k of nodes){check(roadNeighbours(k,g).length===(k===nodes[0]?3:1),'T-Kreuzung ohne diagonale Dreiecke');check(streetNeighbours(k,g).join()===roadNeighbours(k,g).join(),'Fußgänger gleiche Straßenregeln');}
        }
        g.road.fill(0);g.road[IDX(x,y)]=g.road[IDX(x+1,y+1)]=1;
        check(roadNeighbours(IDX(x,y),g).includes(IDX(x+1,y+1)),'Zwei diagonale Punkte verbunden');
        g.road[IDX(x+1,y)]=1;check(!roadStepAllowed(x,y,x+1,y+1,g),'Keine Eckabkürzung');
        for(let color=0;color<4;color++){
            const a=streetPersonSprite(1,0,0,color),b=streetPersonSprite(1,0,1,color);
            check(a.width===2&&a.height===8&&b.width===2&&b.height===8,'Fußgänger 2 × 8');
            const aa=a.getContext('2d').getImageData(0,0,2,8).data,bb=b.getContext('2d').getImageData(0,0,2,8).data;
            check(aa.slice(0,48).join()===bb.slice(0,48).join(),'Oberkörper unverändert');
            for(let yy=6;yy<8;yy++)for(let xx=0;xx<2;xx++){check(aa[(yy*2+xx)*4+3]===(xx===0?255:0),'Linker Schritt');check(bb[(yy*2+xx)*4+3]===(xx===1?255:0),'Rechter Schritt');}
        }
        const shuffled=new Set();let previous=-1;
        for(let round=0;round<100;round++){const q=musicShuffle(previous);check(q.length===12&&new Set(q).size===12,'Jeder Titel einmal pro Runde');check(q[0]!==previous,'Keine direkte Wiederholung');shuffled.add(q.join());previous=q.at(-1);}
        check(shuffled.size>90,'Abwechslungsreiche Musikmischung');
        const flagChecks=[];
        for(let tier=1;tier<=4;tier++){
            const base=HD_CATALOG.get(typeSprite('kontor',tier)).pixelSource,flag=kontorFlagPixels(tier),data=base.getContext('2d').getImageData(0,0,base.width,base.height).data,frames=new Set();
            check(flag.pixels.length>0,'Sichtbare Kontorflagge gefunden, Stufe '+tier);const ys=flag.pixels.map(p=>p.y),minY=Math.min(...ys)-2,maxY=Math.max(...ys)+2;
            for(let frame=0;frame<8;frame++){
                const source=HD_CATALOG.get(kontorFlagSprite(tier,frame)).pixelSource,pixels=source.getContext('2d').getImageData(0,0,source.width,source.height).data;frames.add(source.toDataURL());
                check(source.width===base.width&&source.height===base.height,'Kontorauflösung erhalten');
                for(let yy=0;yy<base.height;yy++)for(let xx=0;xx<base.width;xx++)if(xx<flag.minX||xx>flag.maxX||yy<minY||yy>maxY)for(let channel=0;channel<4;channel++)check(pixels[(yy*base.width+xx)*4+channel]===data[(yy*base.width+xx)*4+channel],'Außerhalb der Flagge unverändert');
            }
            check(frames.size>=6,'Wehende Flaggenphasen');flagChecks.push({tier,frames:frames.size});
        }
        g.tiles.fill(T.GRASS);for(let yy=0;yy<13;yy++)for(let xx=0;xx<17;xx++)g.tiles[IDX(x+xx,y+yy)]=T.ROCK;
        const mountain=mountainTerraceField(activeIsland,g.tiles),height=(xx,yy)=>mountain.heights[(yy-meta.oy)*mountain.size+xx-meta.ox];
        check(height(x,y)===1,'Außenkante Stufe 1');
        check(height(x+2,y+2)===2,'Zwei Kacheln Abstand');
        check(height(x+6,y+6)===4,'Breites Massiv bildet Gipfel');
        const before=Array.from(G.tiles),state=weatherState();weatherBeginRain(360);weatherStep(230);
        const e=weatherState().puddleEvents[0],puddles=[];
        for(let gy=Math.floor(meta.oy/PUDDLE_CELL);gy<Math.ceil((meta.oy+ISLAND_SIZE)/PUDDLE_CELL);gy++)for(let gx=Math.floor(meta.ox/PUDDLE_CELL);gx<Math.ceil((meta.ox+ISLAND_SIZE)/PUDDLE_CELL);gx++){
            const puddle=weatherPuddle(G,e,gx,gy);if(puddle)puddles.push({gx,gy,...puddle});
        }
        check(puddles.length>10,'Pfützen verteilt über die Insel');check(new Set(puddles.map(q=>q.rx+':'+q.ry)).size===5,'Genau fünf Pfützengrößen');
        check(weatherRainAmount()>0,'Regenstärke blendet ein');weatherStep(131);
        const wet=weatherPuddle(G,e,puddles[0].gx,puddles[0].gy)?.wet||0;weatherStep(30);
        const drier=weatherPuddle(G,e,puddles[0].gx,puddles[0].gy)?.wet||0;check(drier<wet,'Pfütze trocknet nach Regen');
        weatherState().nextAt=weatherState().time+1000;weatherStep(300);check(weatherState().puddleEvents.length===0,'Pfützen vollständig weg');
        check(before.every((v,i)=>v===G.tiles[i]),'Wetter verändert Terrain nicht');
        check(!WEATHER_TYPES.storm.implemented,'Gewitter nur Datenbasis');
        WORLD.weather=weatherCreate(WORLD.rootSeed);weatherStep(weatherState().nextAt+30);check(weatherState().type==='rain','Zufälliger Regen startet automatisch');
        weatherStep(weatherState().end-weatherState().time+1);check(weatherState().type==='clear'&&weatherState().puddleEvents.length>0,'Regen endet, Pfützen bleiben');
        WORLD.weather=weatherCreate(WORLD.rootSeed);weatherBeginRain(120);weatherStep(30);const weather=JSON.stringify(weatherState());saveGame();check(loadGame(),'Spielstand laden');setSpeed(0);check(JSON.stringify(weatherState())===weather,'Regen und Pfützen speichern');
        WORLD.tutorial={version:2,step:0};openTutorial();const time=weatherState().time;stepWorld(5);check(weatherState().time===time,'Tutorial pausiert Wetter');tutorialFinish();
        const sheet=document.createElement('canvas');sheet.width=1050;sheet.height=650;const c=sheet.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#385b2d';c.fillRect(0,0,sheet.width,sheet.height);c.font='16px sans-serif';
        const names=['tree0','tree1','tree_birch','tree_oak'];
        for(let i=0;i<4;i++){const tree=i<2?landscapeClone(names[i]):landscapeNewTree(names[i]);c.fillStyle='#f3e6c8';c.fillText(names[i],i*150+12,28);nativeDrawImage.call(c,tree,i*150+12,50,tree.width*4,tree.height*4);}
        const port=HD_CATALOG.get(typeSprite('kontor',1)).pixelSource;c.fillStyle='#f3e6c8';c.fillText('Kontor',650,28);nativeDrawImage.call(c,port,640,50,port.width*3,port.height*3);
        const market=HD_CATALOG.get(typeSprite('markt',1)).pixelSource;c.fillStyle='#f3e6c8';c.fillText('Markt',50,348);nativeDrawImage.call(c,market,50,380,market.width*3,market.height*3);
        const image=document.createElement('img');image.id='atmosphere-sheet';image.src=sheet.toDataURL();Object.assign(image.style,{position:'fixed',inset:0,zIndex:99999});document.body.append(image);
        const flagPixels=[],data=port.getContext('2d').getImageData(0,0,port.width,port.height).data;
        for(let yy=0;yy<port.height*.4;yy++)for(let xx=0;xx<port.width;xx++){const i=(yy*port.width+xx)*4;if(data[i+3]&&data[i]>data[i+1]*1.4&&data[i]>data[i+2]*1.3)flagPixels.push([xx,yy,Array.from(data.slice(i,i+4))]);}
        return {musicRounds:shuffled.size,puddles:puddles.length,portSize:[port.width,port.height],flagChecks};
    }""")
    page.locator('#atmosphere-sheet').screenshot(path=str(root/'pixxo_tests/atmosphere-sprites.png'))
    page.evaluate('document.querySelector("#atmosphere-sheet").remove()')
    page.locator('#dekoToggle').click()
    assert page.evaluate("UI.barMode==='deko' && dekoToggle.dataset.icon==='i_houses'")
    assert page.locator('#dekoToggle').get_attribute('aria-pressed')=='true'
    page.locator('#dekoToggle').focus()
    page.keyboard.press('Enter')
    assert page.evaluate("UI.barMode==='build' && dekoToggle.dataset.icon==='pixxo_deko'")
    page.evaluate('setSpeed(1);weatherBeginRain(90);weatherStep(30);weatherAudioSync()')
    page.wait_for_function('rainAudio && rainAudio.target>0')
    assert page.evaluate('rainAudio.gain!==Sound.effects && !musicPlayer.paused')
    page.evaluate('Sound.prefs.effects=0;audioLevels()')
    assert page.evaluate('rainAudio.target')>0
    page.evaluate('Sound.prefs.ambient=0;audioLevels()')
    assert page.evaluate('rainAudio.target')==0
    page.evaluate('Sound.prefs.effects=.6;Sound.prefs.ambient=.5;audioLevels();setSpeed(0);weatherAudioSync()')
    assert page.evaluate('rainAudio.target')==0
    page.evaluate('dayClock().minutes=720;dayClock().system=false;UI.z=2;UI.sc=2*UI.DR;const port=G.blds.find(b=>b.type==="kontor");centerOn(cx(port),cy(port));render()')
    page.screenshot(path=str(root/'pixxo_tests/rain-puddles.png'))
    page.evaluate('const island=ISLANDS[activeIsland],field=mountainTerraceField(activeIsland);let max=0,index=0;field.heights.forEach((v,i)=>{if(v>max){max=v;index=i}});const x=island.ox+index%field.size,y=island.oy+Math.floor(index/field.size);revealSea(x,y,60);centerOn(x,y);render()')
    page.screenshot(path=str(root/'pixxo_tests/mountain-terraces.png'))
    page.emulate_media(reduced_motion='reduce')
    assert page.evaluate('WORK_ART.reduced.matches')
    assert page.evaluate('workshopSprite(G.blds.find(b=>b.type==="kontor"))===rotatedSprite(typeSprite("kontor",G.blds.find(b=>b.type==="kontor").tier),G.blds.find(b=>b.type==="kontor").rotation||0)')
    page.evaluate('render()')
    previous=page.evaluate('musicIndex')
    page.reload()
    page.wait_for_function('StartScreen.ready && musicPlayer')
    assert page.evaluate('musicIndex')!=previous
    assert not errors,errors
    print(json.dumps(results,ensure_ascii=False))
    browser.close()
