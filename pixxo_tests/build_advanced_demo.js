/* A separate, explicitly stocked inspection save. Never runs in the user's browser. */
async function buildAdvancedDemo(){
 const check=(ok,text)=>{if(!ok)throw Error(text);};
 tutorialFinish();setSpeed(0);UI.roadMode='path';
 const meta=ISLANDS[activeIsland],port=G.blds.find(b=>b.type==='kontor');
 check(G.riverIslands.includes(activeIsland),'Starting island has no river');
 meta.name=meta.customName='Flussstadt – Demo';WORLD.highestTier=4;
 G.gold=2000000;for(const good of GOODS)G.stock[good.id]=3000;
 for(const type in B)G.quests['u_'+type]=true;
 for(const [x,y] of ringCells(port))if(roadTileAllowed(x,y))placeRoad(x,y);
 for(const [x,y] of [[port.x-1,port.y-1],[port.x+port.w,port.y-1],[port.x-1,port.y+port.h],[port.x+port.w,port.y+port.h]])if(roadTileAllowed(x,y))placeRoad(x,y);
 const built=[];
 async function build(type,target={x:meta.wx,y:meta.wy}){
  const d=B[type],sites=[];
  if(['mine','steinbruch','lehmgrube'].includes(type))sites.push(...G.deposits.filter(n=>n.type===type&&!n.legacy));
  else for(let y=Math.floor(meta.wy)-85;y<meta.wy+85;y++)for(let x=Math.floor(meta.wx)-85;x<meta.wx+85;x++)if(canPlace(type,x,y).ok)sites.push({x,y});
  sites.sort((a,b)=>Math.hypot(a.x+d.w/2-target.x,a.y+d.h/2-target.y)-Math.hypot(b.x+d.w/2-target.x,b.y+d.h/2-target.y));
  for(const site of sites.slice(0,100)){
   if(!canPlace(type,site.x,site.y).ok||!cpuPreservesRoadCorners(site.x,site.y,d.w,d.h))continue;
   const mock={x:site.x,y:site.y,w:d.w,h:d.h},foot=footprintCells(site.x,site.y,d.w,d.h).map(([x,y])=>IDX(x,y));
   const endpoints=ringCells(mock).filter(([x,y])=>roadTileAllowed(x,y));
   const roads=[...minimapRoadCells(G.road)].filter(k=>islandOwners[k]===activeIsland);
   endpoints.sort((a,b)=>Math.min(...roads.map(k=>Math.hypot(a[0]-k%MAPW,a[1]-Math.floor(k/MAPW))))-Math.min(...roads.map(k=>Math.hypot(b[0]-k%MAPW,b[1]-Math.floor(k/MAPW)))));
   let path=null;
   for(const [x,y] of endpoints.slice(0,4)){
    const start=roads.slice().sort((a,b)=>Math.hypot(a%MAPW-x,Math.floor(a/MAPW)-y)-Math.hypot(b%MAPW-x,Math.floor(b/MAPW)-y))[0];if(start===undefined)break;
    for(const k of foot)G.occ[k]=-1;
    try{path=plannedRoadPath({x:start%MAPW,y:Math.floor(start/MAPW)},{x,y});}finally{for(const k of foot)G.occ[k]=0;}
    if(path&&!path.some(k=>foot.includes(k)))break;path=null;
   }
   if(!path)continue;const result=place(type,site.x,site.y);if(!result.ok)continue;
   check(commitRoadPlan({tool:'road',mode:'path',path,island:activeIsland})===true,'Road to '+type);
   rebuildNet();check(result.b.conn,'Disconnected '+type);built.push(result.b);
   if(built.length%8===0){console.log('Demo buildings: '+built.length);await new Promise(r=>setTimeout(r,0));}
   return result.b;
  }
  throw Error('No legal site for '+type);
 }
 // The large footprints get first choice; all placement respects the generated terrain.
 const warehouse=await build('lager');port.tier=3;warehouse.tier=3;
 const palace=await build('ausstellungspalast',{x:meta.wx+17,y:meta.wy});
 const town=await build('rathaus',{x:meta.wx-18,y:meta.wy});
 const market=await build('markt',{x:meta.wx,y:meta.wy+16});
 const church=await build('kirche',{x:meta.wx,y:meta.wy+27});
 await build('gemeinschaftshaus',{x:meta.wx-14,y:meta.wy+20});
 await build('garten',{x:meta.wx+12,y:meta.wy+19});await build('brunnen',{x:meta.wx,y:meta.wy+11});
 await build('feuer',{x:meta.wx+10,y:meta.wy+28});
 const homes=[];for(let i=0;i<48;i++){
  const angle=i*Math.PI*2/13,radius=12+Math.floor(i/13)*7;
  const home=await build('haus',{x:cx(market)+Math.cos(angle)*radius,y:cy(market)+Math.sin(angle)*radius});
  home.tier=i<12?1:i<24?2:i<40?3:4;home.pop=TIERS[home.tier].cap;home.sat=Object.fromEntries(Object.keys(TIERS[home.tier].goods).map(g=>[g,true]));home.age=3600;homes.push(home);
 }
 const industry={x:meta.wx-25,y:meta.wy-24};
 for(const delta of [-20,20]){const wh=await build('lager',{x:industry.x+delta,y:industry.y});wh.tier=3;}
 await build('steinbruch',industry);
 for(const [type] of CIVIC_CHAINS)await build(type,industry);
 // Keep the reference materials stocked: this is an inspection sandbox, not an economic challenge.
 for(const good of GOODS)G.stock[good.id]=3000;
 town.project={stage:3,active:false,progress:0,workers:0};
 palace.project={stage:2,active:false,progress:0,workers:0};
 civicNormalize(G);rebuildNet();check(civicStartStage(palace),'Cannot start palace phase');
 const phase=CIVIC_PROJECTS.ausstellungspalast.stages[2];palace.inputStock=Object.fromEntries(Object.entries(phase.cost).filter(([g])=>g!=='gold').map(([g,n])=>[g,Math.floor(n*.75)]));
 const crossings=[];
 for(const [dx,dy,kind] of [[1,0,2],[0,1,1],[-1,0,1],[0,-1,2]]){
  let selected=null;
  const banks=G.riverCells.filter(k=>islandOwners[k]===activeIsland).map(k=>k-dx-dy*MAPW).filter(k=>riverBank(k%MAPW,Math.floor(k/MAPW)));
  banks.sort((a,b)=>Math.hypot(a%MAPW-meta.wx,Math.floor(a/MAPW)-meta.wy)-Math.hypot(b%MAPW-meta.wx,Math.floor(b/MAPW)-meta.wy));
  for(const bank of banks){const span=riverCrossing(bank,dx,dy);if(!span||span.cells.some(k=>G.bridges[k])||crossings.some(s=>Math.hypot(s.cells[0]%MAPW-bank%MAPW,Math.floor(s.cells[0]/MAPW)-Math.floor(bank/MAPW))<10))continue;
   if(commitRoadPlan({tool:'road',mode:kind===2?'stonebridge':'woodbridge',path:span.cells,island:activeIsland})!==true)continue;selected=span;break;
  }
  if(selected)crossings.push({...selected,kind});
 }
 check(crossings.length>=2&&crossings.every(s=>Math.abs(s.dx)+Math.abs(s.dy)===1),'Not enough cardinal demonstration bridges');
 // Connect demonstration bridges to the live network so carts can use them.
 for(const span of crossings){const k=span.cells[0],start=[...minimapRoadCells(G.road)].filter(n=>!G.bridges[n]&&islandOwners[n]===activeIsland).sort((a,b)=>Math.hypot(a%MAPW-k%MAPW,Math.floor(a/MAPW)-Math.floor(k/MAPW))-Math.hypot(b%MAPW-k%MAPW,Math.floor(b/MAPW)-Math.floor(k/MAPW)))[0];
  const path=plannedRoadPath({x:start%MAPW,y:Math.floor(start/MAPW)},{x:k%MAPW,y:Math.floor(k/MAPW)});if(path)commitRoadPlan({mode:'path',path,island:activeIsland});
 }
 const showcaseSpan=crossings[0],farBank=showcaseSpan.cells.at(-1),farWarehouse=await build('lager',{x:farBank%MAPW+showcaseSpan.dx*7,y:Math.floor(farBank/MAPW)+showcaseSpan.dy*7});farWarehouse.tier=3;
 G.dirty=true;rebuildNet();assignWorkforce(G);civicRequestProjects(2);requestLogistics(2);
 let cargoSource=G.blds.find(b=>b.type==='lager'&&b.id!==farWarehouse.id&&deliveryPath(b,farWarehouse)?.some(k=>isRiver(k)));
 if(!cargoSource){const nearBank=showcaseSpan.cells[0];cargoSource=await build('lager',{x:nearBank%MAPW-showcaseSpan.dx*5,y:Math.floor(nearBank/MAPW)-showcaseSpan.dy*5});cargoSource.tier=3;G.dirty=true;rebuildNet();}
 const cargoPath=deliveryPath(cargoSource,farWarehouse);check(cargoPath?.some(k=>isRiver(k)),'Demo warehouse route misses the river');
 G.carts.push({path:cargoPath,t:0,col:'bretter',qty:5,source:cargoSource.id,target:farWarehouse.id,destination:'warehouse'});
 check(palace.project.workers===phase.workers,'Too few free construction workers');
 G.gold=2000000;G.time=3*3600;G.nextFire=G.time+1200;WORLD.tutorial={version:2,done:true,dismissed:true};
 WORLD.dayClock={minutes:840,enabled:true,system:false};WORLD.fog.islands[activeIsland]=true;
 revealSea(meta.wx,meta.wy,ISLAND_SIZE/2);setSpeed(1);setTool(null);UI.cat=null;setZoom(.9,innerWidth/2,innerHeight/2);centerOn(meta.wx,meta.wy+8);render();
 check(saveGame(),'Demo save failed');
 return {name:meta.name,island:activeIsland,population:totalPop(),buildings:G.blds.length,chains:CIVIC_CHAINS.length,rivers:G.riverIslands.length,bridges:crossings.map(s=>({kind:s.kind,dx:s.dx,dy:s.dy,width:s.cells.length-2})),town:[town.x,town.y],palace:[palace.x,palace.y],palacePhase:3,workers:palace.project.workers};
}
