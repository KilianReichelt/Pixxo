"""Native wildlife, sparse smoke, habitat safety, zoom and reduced-motion gates."""
import base64
from pathlib import Path
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True,args=['--allow-file-access-from-files'])
    page=browser.new_page(viewport={'width':1920,'height':1080})
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((root/'pixxo.html').as_uri());page.wait_for_function('StartScreen.ready')
    page.locator('[data-start=new]').click();page.wait_for_function('StartScreen.started&&!StartScreen.loading');page.evaluate('tutorialFinish();setSpeed(0)')
    print(page.evaluate("""()=>{
      const check=(ok,text)=>{if(!ok)throw Error(text);};
      const board={tiles:new Uint8Array(MAPW*MAPH),occ:new Int32Array(MAPW*MAPH),road:new Uint8Array(MAPW*MAPH),river:new Uint8Array(MAPW*MAPH)};
      const x=64,y=64;for(let yy=y;yy<y+32;yy++)for(let xx=x;xx<x+32;xx++)board.tiles[IDX(xx,yy)]=T.GRASS;
      for(let xx=x+2;xx<x+30;xx++){board.tiles[IDX(xx,y+15)]=T.SHAL;board.river[IDX(xx,y+15)]=1;}
      const path=ambientPath(board,'boat',x+2,y+15,23);check(path.length>=20,'Boat does not follow river');
      const boat={kind:'boat',path,seed:0};board.road[IDX(x+18,y+15)]=1;board.bridges={[IDX(x+18,y+15)]:{dx:0,dy:1,kind:1,part:'deck',pier:false}};
      let crossed=false;for(let time=0;time<300;time++){const pos=ambientPosition(boat,board,time);check(pos,'Boat disappears at bridge');if(pos.x/16>x+18)crossed=true;}check(crossed,'Boat stops before bridge');
      check(AMBIENT_LIFE.boatFrames===8,'Short rowing animation');
      board.road[IDX(x+18,y+15)]=0;
      const pool=ambientChunk(board,2,2);check(pool.some(e=>e.kind==='deer'),'No wildlife candidates');
      for(const e of pool)for(const k of e.path)check(ambientHabitat(board,e.kind,k%MAPW,Math.floor(k/MAPW)),'Path leaves habitat');
      board.occ[IDX(x+5,y+5)]=99;check(ambientNearBuildings(board,x+7,y+7),'Wildlife does not avoid building');board.occ[IDX(x+5,y+5)]=0;
      const actual=ambientBoard,oldZ=UI.z;ambientBoard=()=>board;
      try{
        UI.z=.5;ENT.length=0;addAmbientLife(x*16,y*16,(x+32)*16,(y+32)*16);check(!ENT.length,'Wildlife at distant zoom');
        UI.z=1;ENT.length=0;addAmbientLife(x*16,y*16,(x+32)*16,(y+32)*16);check(ENT.length>0&&ENT.length<=AMBIENT_LIFE.maxVisible&&ambientFrame.boats<=AMBIENT_LIFE.maxBoats,'Visible population limits');
        const snapshot=JSON.stringify(ENT);addAmbientLife(x*16,y*16,(x+32)*16,(y+32)*16);check(JSON.stringify(ENT.slice(0,JSON.parse(snapshot).length))===snapshot,'Pause moves wildlife');
        for(let cy=0;cy<12;cy++)for(let cx=0;cx<12;cx++)ambientChunk(board,cx,cy);check(ambientPools.get(board.tiles).chunks.size<=AMBIENT_LIFE.maxChunks,'Unbounded spatial cache');
      }finally{ambientBoard=actual;UI.z=oldZ;}
      const homes=Array.from({length:100},(_,id)=>({id,type:'haus',pop:12,fire:0})),smoking=homes.filter(b=>ambientHouseSmoke(b,0));check(smoking.length>5&&smoking.length<30,'Smoke synchronized or ubiquitous');
      check(!ambientHouseSmoke({id:0,type:'haus',pop:0,fire:0},0)&&!ambientHouseSmoke({id:0,type:'haus',pop:12,fire:10},0),'Empty/burning house smoke');
      for(const tier of [2,3,4])for(let v=0;v<4;v++)for(let rot=0;rot<4;rot++){
        const n=buildingPreviewSprite({id:2,type:'haus',tier,visualVariant:v,rotation:rot,island:activeIsland}),source=HD_CATALOG.get(n).pixelSource;
        check(source._homeChimneys?.length>0,'Missing chimney metadata');
        for(const q of source._homeChimneys)check(q.x>=0&&q.x<source.width&&q.y>=0&&q.y<source.height&&source.getContext('2d').getImageData(q.x,q.y,1,1).data[3]===255,'Smoke disconnected from chimney');
      }
      for(const id of MUTED_GOOD_IDS){const before=MUTED_GOOD_ORIGINALS.get(id).getContext('2d').getImageData(0,0,16,16).data,after=HD_CATALOG.get(id).pixelSource.getContext('2d').getImageData(0,0,16,16).data;let oldChroma=0,newChroma=0;
        for(let i=0;i<before.length;i+=4){check(before[i+3]===after[i+3],'Icon silhouette changed '+id);if(!before[i+3])continue;const max=Math.max(...before.slice(i,i+3));oldChroma+=max-Math.min(...before.slice(i,i+3));newChroma+=Math.max(...after.slice(i,i+3))-Math.min(...after.slice(i,i+3));if(max<80)check(before.slice(i,i+3).every((v,k)=>v===after[i+k]),'Icon contour changed '+id);}
        check(newChroma<oldChroma*.8,'Icon still saturated '+id);
      }
      return {bridgeSafe:true,smoking:smoking.length,mutedIcons:MUTED_GOOD_IDS.length,chimneyRotations:48,maxVisible:AMBIENT_LIFE.maxVisible};
    }"""))
    page.emulate_media(reduced_motion='reduce')
    assert page.evaluate("""()=>{const entry={kind:'boat',seed:3,path:[IDX(64,64),IDX(65,64)]},board={tiles:G.tiles,occ:G.occ,road:G.road,river:G.river},old=G.time;try{G.time=5;const a=ambientTime();G.time=500;return a===ambientTime()&&a===0;}finally{G.time=old;}}""")
    art=page.evaluate("""()=>{
      const a=document.createElement('canvas');a.width=1020;a.height=480;const c=a.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#657b5e';c.fillRect(0,0,a.width,a.height);c.font='14px sans-serif';
      ['boat','deer','goat','gull','fish','shark'].forEach((kind,col)=>[[1,0],[0,1],[-1,0],[0,-1]].forEach(([dx,dy],row)=>{
        const x=col*170+8,y=row*120+24,name=ambientSprite(kind,dx,dy,row%2),source=HD_CATALOG.get(name).pixelSource,data=source.getContext('2d').getImageData(0,0,16,16).data;
        if(source.width!==16||source.height!==16||data.some((v,i)=>i%4===3&&v!==0&&v!==255))throw Error('Non-native animal '+kind);
        c.fillStyle='#fff';c.fillText(kind+' / '+row*90+'°',x,y-8);nativeDrawImage.call(c,source,x,y,64,64);c.fillStyle='#303e45';c.fillRect(x+80,y,64,64);nativeDrawImage.call(c,source,x+80,y,64,64);c.fillStyle='rgba(8,16,42,.58)';c.fillRect(x+80,y,64,64);
      }));return a.toDataURL();
    }""")
    (root/'pixxo_tests/ambient-life-sprites.png').write_bytes(base64.b64decode(art.split(',')[1]))
    icons=page.evaluate("""()=>{
      const a=document.createElement('canvas');a.width=840;a.height=480;const c=a.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#28362b';c.fillRect(0,0,a.width,a.height);c.font='14px sans-serif';
      MUTED_GOOD_IDS.forEach((id,i)=>{const x=i%3*280+12,y=Math.floor(i/3)*120+24;c.fillStyle='#fff';c.fillText(GN[id].n+' · vorher / jetzt',x,y-8);nativeDrawImage.call(c,MUTED_GOOD_ORIGINALS.get(id),x,y,64,64);nativeDrawImage.call(c,HD_CATALOG.get(id).pixelSource,x+100,y,64,64);});return a.toDataURL();
    }""")
    (root/'pixxo_tests/muted-goods-comparison.png').write_bytes(base64.b64decode(icons.split(',')[1]))
    assert not errors,errors
    browser.close()
    print('PASS: habitat-safe wildlife, bridge passages, sparse native chimney smoke, bounded caches, zoom/reduced motion and subdued goods.')
