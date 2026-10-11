"""Release gate for native civic art, deferred projects, housing, decor and scenes."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parent.parent
fixture_js=r"""(scene)=>{
 setSpeed(0);tutorialFinish();for(const id in WINS)closeWin(id);
 WORLD.islands=WORLD.islands.map((g,i)=>i===activeIsland?G:null);WORLD.cpuInitialized=true;
 G.blds=[];G.byId.clear();G.occ.fill(0);G.road.fill(0);G.bridges={};G.carts=[];G.fireEngines=[];G.deposits=[];G.gold=1000000;G.nid=1;
 WORLD.fleet=[];WORLD.routes=[];
 WORLD.highestTier=4;for(const g of GOODS)G.stock[g.id]=10000;
 const m=ISLANDS[activeIsland],ox=Math.floor(m.wx)-30,oy=Math.floor(m.wy)-23;
 const grass=(x,y)=>{const k=IDX(x,y);G.tiles[k]=T.GRASS;if(G.river)G.river[k]=0;islandOwners[k]=activeIsland;};
 // Lay out a continuous town district, rather than building on isolated cleared footprints.
 for(let y=-15;y<=65;y++)for(let x=-20;x<=80;x++)grass(ox+x,oy+y);
 for(let y=-12;y<=62;y++)for(let x=-17;x<=77;x++)if((x<1||x>61||y<0||y>43)&&hs(x,y,113)>.65)G.tiles[IDX(ox+x,oy+y)]=T.FOREST;
 if(scene===0)for(let y=-15;y<=65;y++){const bend=48+Math.round(Math.sin(y/12)*3);for(let x=bend;x<bend+5;x++){const k=IDX(ox+x,oy+y);G.tiles[k]=T.SHAL;if(G.river)G.river[k]=1;}}
 const add=(type,x,y,extra={})=>{const d=B[type],b={id:G.nid++,island:activeIsland,type,x:ox+x,y:oy+y,w:d.w,h:d.h,tier:1,pop:0,rotation:0,visualVariant:0,paused:false,prog:0,conn:true,acc:-1,eff:1,status:'',fire:0,need:{},sat:{},mood:0,cov:{},age:0,inputStock:{},...extra};for(const [x,y] of footprintCells(b.x,b.y,b.w,b.h)){grass(x,y);G.occ[IDX(x,y)]=b.id;}G.blds.push(b);G.byId.set(b.id,b);return b;};
 const road=(x,y,stone=false)=>{grass(ox+x,oy+y);const k=IDX(ox+x,oy+y);G.road[k]=stone?2:1;};
 const lane=(x1,y1,x2,y2,stone=false)=>{let x=x1,y=y1;while(true){road(x,y,stone);if(x===x2&&y===y2)break;x+=Math.sign(x2-x);y+=Math.sign(y2-y);}};
 const housing=(x,y,cols,rows,tier)=>{for(let row=0;row<rows;row++)for(let col=0;col<cols;col++)add('haus',x+col*5,y+row*6,{tier,pop:TIERS[tier].cap,visualVariant:(row+col)%4});};
 if(scene===0){
  housing(6,9,5,3,1);housing(32,15,2,2,2);lane(4,13,43,13);lane(4,19,43,19);lane(4,25,43,25);lane(5,4,5,31);lane(30,4,30,31);
  add('markt',17,4);add('gemeinschaftshaus',32,7);add('lager',2,4);add('garten',36,26);add('farm',6,30);add('muehle',16,31);add('baeckerei',23,31);add('holzfaeller',42,27);add('deko_heuwagen',11,28);add('deko_eiche',33,31);
 }else{
  // Organic terrain and streets: a growing town follows its coast, river and hills.
  const coast=y=>scene===1?44+Math.round(Math.sin(y/9)*4+Math.sin(y/22)*3):scene===2?63+Math.round(Math.sin(y/13)*4):49+Math.round(Math.sin(y/11)*5);
  for(let y=-40;y<=100;y++)for(let x=-60;x<=130;x++)if(INMAP(ox+x,oy+y)){
   const k=IDX(ox+x,oy+y),c=coast(y),river=scene===2&&Math.abs(x-(39+Math.round(Math.sin(y/9)*3)))<2;
   const hills=((x+11)**2/140+(y-7)**2/240<1)||((x+3)**2/130+(y+12)**2/100<1);
   G.tiles[k]=x>c+3?T.DEEP:x>=c||river?T.SHAL:x>=c-2?T.SAND:hills?T.ROCK:
    Math.sin(x/6)+Math.cos(y/7)+Math.sin((x+y)/11)>1.25&&hs(x,y,scene+135)>.2?T.FOREST:T.GRASS;
   if(G.river)G.river[k]=river?1:0;islandOwners[k]=x<c?activeIsland:-1;
  }
  const walk=(points,stone=true)=>{for(let i=1;i<points.length;i++)lane(...points[i-1],...points[i],stone);};
  const safe=(type,x,y,extra={})=>{const d=B[type];if(!d)return null;const cells=footprintCells(ox+x,oy+y,d.w,d.h);
   if(cells.some(([xx,yy])=>!INMAP(xx,yy)||G.occ[IDX(xx,yy)]||G.road[IDX(xx,yy)]||G.tiles[IDX(xx,yy)]<T.GRASS||G.tiles[IDX(xx,yy)]===T.ROCK))return null;
   return add(type,x,y,extra);
  };
  if(scene===1){
   walk([[3,-5],[10,3],[12,11],[19,18],[17,28],[24,37],[26,48]]);
   walk([[-5,20],[5,17],[12,11],[23,9],[35,12],[42,17]]);
   walk([[5,40],[10,31],[17,28],[30,27],[40,32],[46,40]]);
   walk([[34,-7],[36,4],[38,11],[40,19],[39,27],[43,35],[42,48]]);
   walk([[19,18],[27,17],[31,23],[39,27]]);
   add('markt',20,20);add('kirche',5,23);add('gemeinschaftshaus',28,32);add('garten',22,10);
   add('kontor',coast(23)-3,23,{tier:2});add('werft',coast(5)-5,5);add('fischer',coast(37)-2,37);add('lager',34,20);
   for(const [type,x,y] of [['deko_kistenstapel',42,19],['deko_fassgruppe',41,28],['deko_fischernetz',45,34],['deko_anker',41,32],['deko_seilrolle',41,12],['deko_warensaecke',43,25]])safe(type,x,y);
   WORLD.fleet=[{id:901,type:'clipper',name:'Johanna',anchor:{x:ox+52,y:oy+25},heading:2},{id:902,type:'schooner',name:'Aurora',anchor:{x:ox+54,y:oy+8},heading:6},{id:903,type:'schooner',name:'Friedrich',anchor:{x:ox+55,y:oy+39},heading:3}].map(sh=>({...sh,at:activeIsland,cargo:[],buildLeft:0,phase:'idle',remaining:0}));
  }else if(scene===2){
   walk([[3,-4],[10,4],[12,13],[19,19],[18,27],[24,35],[24,48]],false);
   walk([[-3,28],[7,27],[18,27],[28,24],[34,18]],false);
   walk([[4,6],[12,13],[23,11],[29,6],[34,1]],false);
   walk([[19,19],[28,17],[34,18]],true);walk([[24,35],[32,38],[34,47]],false);
   walk([[46,6],[49,15],[46,25],[49,34],[52,43]],false);
   add('markt',20,20);add('gemeinschaftshaus',26,28);add('kirche',4,17);add('garten',24,6);add('brunnen',18,17);
   add('farm',2,36);add('muehle',8,34);add('baeckerei',12,32);add('lager',30,40);
   for(const [x,y] of [[2,41],[5,42],[7,40],[9,42],[12,40]])safe('getreidefeld',x,y);
   // Two complete native bridges across the meandering river.
   for(const y of [18,35]){const mid=39+Math.round(Math.sin(y/9)*3),cells=[];
    for(let x=mid-3;x<=mid+3;x++){const k=IDX(ox+x,oy+y);G.road[k]=1;cells.push(k);}
    cells.forEach((k,i)=>G.bridges[k]={dx:1,dy:0,kind:1,part:i===0||i===cells.length-1?'ramp':'deck',pier:bridgePierIndices(cells.length).has(i),cells,wasRoad:false});
   }
  }else{
   walk([[4,-4],[9,4],[14,10],[12,19],[18,26],[16,34],[23,43]]);
   walk([[-4,21],[4,17],[12,19],[22,15],[32,17],[40,24],[44,33]]);
   walk([[18,26],[26,29],[36,28],[40,24]]);walk([[14,10],[25,8],[34,5],[42,9]]);
   walk([[23,43],[31,39],[36,28]]);
   add('gemeinschaftshaus',23,19);add('garten',30,9);add('kirche',5,26);add('markt',28,32);add('lager',38,35);
   for(const [type,x,y] of [['deko_pavillon',34,21],['deko_springbrunnen',19,21],['deko_statue',28,27],['deko_gedenkstein',31,18],['deko_blumenbeet',24,25],['deko_bank',20,28],['deko_lichterbogen',33,30]])safe(type,x,y);
  }
  // Scatter buildable parcels beside branching streets; no repeated rows or blocks.
  let homes=0;for(let i=0;i<1800&&homes<(scene===1?58:scene===2?44:40);i++){
   const x=2+Math.floor(hs(i,scene,8321)*47),y=-2+Math.floor(hs(i,scene,1927)*46);
   const tier=scene===1?(hs(i,1,61)>.72?3:2):scene===2?(hs(i,2,61)>.66?2:1):(hs(i,3,61)>.25?4:3);
   const d=B.haus,cells=footprintCells(ox+x-1,oy+y-1,d.w+2,d.h+2);
   if(cells.some(([xx,yy])=>!INMAP(xx,yy)||G.occ[IDX(xx,yy)]))continue;
   if(!ringCells({x:ox+x,y:oy+y,w:d.w,h:d.h}).some(([xx,yy])=>INMAP(xx,yy)&&G.road[IDX(xx,yy)]))continue;
   if(safe('haus',x,y,{tier,pop:TIERS[tier].cap,visualVariant:i%4}))homes++;
  }
  for(let i=0;i<65;i++){
   const x=1+Math.floor(hs(i,scene,145)*45),y=Math.floor(hs(i,scene,146)*44);
   const near=ambientNearBuildings(WORLD.board,x+ox,y+oy,3);
   if(near)safe(['deko_bank','deko_blumenkuebel','deko_lampe','deko_birke','deko_hecke','deko_handkarren'][i%6],x,y);
  }
 }

 for(const type of ['farm','muehle','baeckerei','holzfaeller'])if(!B[type])throw Error('Missing fixture type '+type);
 G.roads=Array.from(G.road).filter(Boolean).length;G.dirty=true;PERF_ROADS.delete(G.road);land=null;buildLand();rebuildNet();
 if(WORLD.fog){WORLD.fog.cells.fill(1);WORLD.fog.islands.fill(true);fogDirty=true;}
 Object.assign(dayClock(),{minutes:scene===3?1020:720,enabled:false,system:false});UI.sel=null;UI.selectedShip=null;UI.hover=null;UI.ghostT=null;setTool(null);centerOn(ox+(scene===1?30:25),oy+(scene===1?24:21));setZoom(scene===1?1.7:1.55,innerWidth/2,innerHeight/2);render();
 return {buildings:G.blds.length,homes:G.blds.filter(b=>b.type==='haus').length};
}"""

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True,args=['--allow-file-access-from-files'])
    page=browser.new_page(viewport={'width':1920,'height':1280})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((root/'pixxo.html').as_uri());page.wait_for_function('StartScreen.ready')
    page.locator('[data-start=new]').click();page.wait_for_function('StartScreen.started');page.evaluate('tutorialFinish();setSpeed(0)')
    print(page.evaluate(r"""()=>{
      const check=(ok,message)=>{if(!ok)throw Error(message);};
      check(!CIVIC_PROJECTS_ENABLED,'Project gate');
      WORLD.highestTier=4;for(const type of Object.keys(CIVIC_PROJECTS)){check(!unlocked(type)&&!buildingRelevant(type),'Project visible');check(!canPlace(type,0,0).ok,'Project can be placed');}
      const town={id:9999,type:'rathaus',conn:true,paused:false,fire:0,project:{stage:3,active:true,progress:.37,workers:40},inputStock:{holz:7}};
      const fake={blds:[town],byId:new Map([[town.id,town]]),stock:{holz:1},carts:[{projectCargo:true,target:town.id,col:'holz',qty:5}],projectClaims:{}};
      civicNormalize(fake);check(town.paused&&town.project.progress===.37&&town.project.stage===3&&town.project.workers===0,'Saved project not dormant');check(fake.carts.length===0&&fake.stock.holz===6,'Project cargo not returned');check(civicEffects(fake).tax===1&&!civicStartStage(town)&&buildingUpkeep(town)===0,'Dormant project effects/upkeep');
      for(const g of GOODS){const a=HD_CATALOG.get(g.id).pixelSource;check(a.width===16&&a.height===16,'Icon size '+g.id);}
      for(const [w,h] of [[17,16],[16,17]]){const a=document.createElement('canvas');a.width=w;a.height=h;let rejected=false;try{publishPixel('zement',a,w,h)}catch{rejected=true}check(rejected,'Size gate missing');}
      const factoryTypes=['zementwerk','betonwerk','glashuette','kalkbrennerei'],factoryPixels=new Set();
      for(const type of factoryTypes){const art=nativeCivicArt(type);check(art.low.width===64&&art.low.height===60,'Factory grid');factoryPixels.add(art.low.toDataURL());for(let rot=0;rot<4;rot++){const b={id:7,type,tier:1,rotation:rot,island:activeIsland};const n=buildingPreviewSprite(b);check(nightWindows(n).lights.length>0,'Factory night pane');}}
      check(factoryPixels.size===4,'Factories identical');
      for(let tier=2;tier<=4;tier++){const images=new Set();for(let v=0;v<4;v++){const art=nativeTownHouseArt(tier,v);check(art.low.width===48&&art.low.height===48,'House grid');const data=art.low.getContext('2d').getImageData(0,0,48,48).data;check([...data].filter((_,i)=>i%4===3).every(a=>a===0||a===255),'Soft home edges');images.add(art.low.toDataURL());for(let rot=0;rot<4;rot++){const b={id:8,type:'haus',tier,visualVariant:v,rotation:rot,island:activeIsland};check(nightWindows(buildingPreviewSprite(b)).lights.length>=2,'House panes');}}check(images.size===4,'House variants identical');}
      check(DEKO_GROUPS.length===6&&DEKO_GROUPS.every(g=>g.items.length>=8),'Decor groups');
      for(const [type] of DEKO_DEFINITIONS){const a=nativeDecorationArt(type),data=a.low.getContext('2d').getImageData(0,0,a.w,a.h).data;check(a.w===B[type].w*16&&a.h===B[type].h*16+12,'Decor grid '+type);check([...data].filter((_,i)=>i%4===3).every(a=>a===0||a===255),'Soft decoration '+type);check(data.some((v,i)=>i%4===3&&v),'Blank decor '+type);if(B[type].nightLight)check(a.low._nightWindows.length>0,'Missing decor lights '+type);}
      const market=importedBuilding('markt');check(market.low._nightWindows.length>=3&&market.low._nightWindows.every(p=>p.w===2&&p.h===2),'Market lights exceed bulbs');
      for(let cells=3;cells<=BRIDGE_LIMIT+2;cells++){const indices=[0,...bridgePierIndices(cells),cells-1],gaps=indices.slice(1).map((n,i)=>n-indices[i]);check(Math.max(...gaps)-Math.min(...gaps)<=1,'Uneven support '+cells);check(indices.slice(1,-1).every((n,i,a)=>i===0||n-a[i-1]>=2),'Adjacent supports '+cells);}
      for(const [dx,dy] of LAND_STEPS)for(const kind of [1,2]){const a=bridgeSprite(dx,dy,kind,'deck',true);check(a.width===24&&a.height===24,'Supersampled bridge');const data=a.getContext('2d').getImageData(0,0,24,24).data;check([...data].filter((_,i)=>i%4===3).every(a=>a===0||a===255),'Soft bridge edges');}
      return {goods:GOODS.length,houseVariants:12,houseRotations:48,factories:4,decor:DEKO_DEFINITIONS.size,groups:DEKO_GROUPS.map(g=>[g.n,g.items.length]),nativeBridges:16,deferredProjects:true};
    }"""))
    # Generate four deliberately different layouts through the actual game renderer.
    scene_names=['river','harbor','citizens','aristocrats']
    for index,name in enumerate(scene_names):
        print(name,page.evaluate(fixture_js,index))
        style=page.add_style_tag(content='body > :not(#cv):not(script):not(style){visibility:hidden!important} #cv{outline:none!important}')
        page.evaluate('window.sceneWarnings=drawBuildingWarnings;drawBuildingWarnings=()=>{};for(let i=0;i<40;i++)render()')
        if index>0: page.screenshot(path=str(root/f'assets/start-world-{name}.png'))
        page.evaluate('()=>{drawBuildingWarnings=sceneWarnings}')
        style.evaluate('(e)=>e.remove()')
    page.set_viewport_size({'width':1440,'height':1000})
    # Real upgrade, then save/reload: a successful transition randomizes exactly once.
    print(page.evaluate(r"""()=>{
      const b=G.blds.find(b=>b.type==='haus');b.tier=3;b.conn=true;b.pop=TIERS[3].cap;b.cov={markt:true,kirche:true,gemeinschaft:true};b.supplyTime=30;b.visualVariant=0;for(const g of Object.keys(TIERS[4].goods))b.sat[g]=true;
      const random=Math.random;Math.random=()=>.99;try{if(upgradeHouse(b)!==true)throw Error('Upgrade failed');}finally{Math.random=random;}
      if(b.tier!==4||b.visualVariant!==3)throw Error('Upgrade did not choose fourth variant');window.refreshHomeId=b.id;saveGame();return {upgrade:true,variant:b.visualVariant};
    }"""))
    home_id=page.evaluate('refreshHomeId')
    page.reload();page.wait_for_function('StartScreen.ready');page.wait_for_function('sceneryImage.complete&&sceneryImage.naturalWidth>0')
    assert page.evaluate('getComputedStyle(sceneryImage).animationName')=='none'
    assert page.locator('[data-start-background]').count()==0
    chosen=page.evaluate('sceneryImage.src')
    page.locator('[data-start=continue]').click();page.wait_for_function('StartScreen.started&&!StartScreen.loading')
    assert page.evaluate('(id)=>G.byId.get(id)?.visualVariant===3',home_id)
    page.evaluate('tutorialFinish();setSpeed(0);UI.barMode="deko";renderBar()')
    # Category buttons retain focus, expose selection and stay usable at 200% text.
    for width in [1440,768,390,320]:
        page.set_viewport_size({'width':width,'height':1000})
        for category in ['natur','stadt','land','hafen','zaeune','fest']:
            button=page.locator(f'[data-deko-category="{category}"]');button.focus();page.keyboard.press('Enter')
            assert button.get_attribute('aria-pressed')=='true'
            assert page.evaluate('(cat)=>[...document.querySelectorAll("#items [data-b]")].length>=7&&[...document.querySelectorAll("#items [data-b]")].every(e=>B[e.dataset.b].cat==="deko_"+cat)',category)
            if width==1440 and os.environ.get('PIXXO_AXE_SCRIPT'):
                page.add_script_tag(path=os.environ['PIXXO_AXE_SCRIPT'])
                violations=page.evaluate("async()=> (await axe.run(document.querySelectorAll('#bar,#items,#barModes'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))")
                assert not violations,violations
            assert page.evaluate('(cat)=>document.activeElement?.dataset.dekoCategory===cat',category),(width,category,page.evaluate('document.activeElement.outerHTML'))
            assert page.evaluate("""()=>{const dekoCategories=document.querySelector('#bar'),r=dekoCategories.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&[...dekoCategories.querySelectorAll('[data-deko-category]')].every(e=>{const r=e.getBoundingClientRect();return r.width>=24&&r.height>=44&&parseFloat(getComputedStyle(e).fontSize)>=14})}""")
        page.screenshot(path=str(root/f'pixxo_tests/deko-categories-{width}.png'))
    page.evaluate('document.documentElement.style.fontSize="200%";renderBar()')
    assert page.evaluate("document.querySelector('#bar').getBoundingClientRect().right<=innerWidth&&getComputedStyle(document.querySelector('#bar')).overflowX==='auto'")
    page.evaluate('document.documentElement.style.fontSize=""')
    # Selecting an enabled card uses the ordinary building event handler.
    page.set_viewport_size({'width':1440,'height':1000})
    page.evaluate('UI.cat="deko_natur";renderBar()')
    card=page.locator('#items [data-b]:not(:disabled)').first
    chosen_decor=card.get_attribute('data-b');card.focus();page.keyboard.press('Enter')
    assert page.evaluate('(type)=>UI.tool==="build"&&UI.type===type',chosen_decor)
    page.locator('#dekoToggle').click()
    assert page.evaluate('UI.barMode==="build"&&UI.cat===null')
    page.locator('#bar [data-cat]').first.click()
    assert page.evaluate('UI.cat&&!UI.cat.startsWith("deko_")')
    page.set_viewport_size({'width':1440,'height':1000})
    # Day and night contact sheet: factories, services, all house variants and every ornament.
    page.evaluate(r"""()=>{
      const entries=[...['zementwerk','betonwerk','glashuette','kalkbrennerei','gemeinschaftshaus','garten'].map(type=>({type,tier:1,visualVariant:0})),...[2,3,4].flatMap(tier=>[0,1,2,3].map(visualVariant=>({type:'haus',tier,visualVariant}))),...[...DEKO_DEFINITIONS.keys()].map(type=>({type,tier:1,visualVariant:0}))];
      const a=document.createElement('canvas');a.width=1200;a.height=Math.ceil(entries.length/5)*215;const c=a.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#657b5e';c.fillRect(0,0,a.width,a.height);c.font='16px sans-serif';
      entries.forEach((e,i)=>{const b={...e,id:i+1,island:activeIsland,rotation:0},n=buildingPreviewSprite(b),source=HD_CATALOG.get(n)?.pixelSource||SP[n],x=i%5*240+8,y=Math.floor(i/5)*215+28;c.fillStyle='#fff';c.fillText(B[e.type].n+(e.type==='haus'?' '+e.tier+'/'+e.visualVariant:''),x,y-9);nativeDrawImage.call(c,source,x,y,source.width*2,source.height*2);const nx=x+120;c.fillStyle='#303e45';c.fillRect(nx,y,110,170);nativeDrawImage.call(c,source,nx,y,source.width*1.5,source.height*1.5);const state=nightWindowState(nightWindows(n),b);nativeDrawImage.call(c,state.mask,nx,y,source.width*1.5,source.height*1.5);});
      const img=document.createElement('img');img.id='refresh-art-sheet';img.src=a.toDataURL();Object.assign(img.style,{position:'absolute',top:'0',left:'0',zIndex:'999999',width:'1200px'});document.body.append(img);
    }""")
    page.locator('#refresh-art-sheet').screenshot(path=str(root/'pixxo_tests/city-refresh-art.png'))
    page.evaluate('document.getElementById("refresh-art-sheet").remove()')
    page.emulate_media(reduced_motion='reduce')
    assert page.evaluate('getComputedStyle(sceneryImage).animationName')=='none'
    assert page.evaluate('sceneryImage.src')==chosen
    assert not errors,errors
    browser.close()
    print('PASS: native art, icons, dormant saves, housing upgrade/reload, categories, keyboard, reflow, four backgrounds and bridge supports.')
