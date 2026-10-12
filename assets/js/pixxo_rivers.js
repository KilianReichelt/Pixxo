/* Deterministic rivers; bridge cells remain part of the existing road/transport graph. */
const RIVER_VERSION=2,BRIDGE_LIMIT=16;
let riverLoadPolicy=null,riverGeneratedBoard=null,riverRestoredCells=null,riverRegenerateIslands=null,riverSavedObstacles=new Set();
function generateRiver(board,meta,island,seed){
 const size=ISLAND_SIZE,index=(x,y)=>IDX(x+meta.ox,y+meta.oy),inside=(x,y)=>x>=3&&y>=3&&x<size-3&&y<size-3;
 const protectedSite=(x,y)=>riverSavedObstacles.has(index(x,y))||meta.beaches?.some(b=>Math.hypot(x+meta.ox-b.x-B.kontor.w/2,y+meta.oy-b.y-B.kontor.h/2)<15);
 const usable=(x,y)=>inside(x,y)&&(islandOwners[index(x,y)]===island||islandOwners[index(x,y)]<0)&&!mountainMassifs[index(x,y)]&&!protectedSite(x,y);
 const angle=hs(island,17,seed+3071)*Math.PI*2,ux=Math.cos(angle),uy=Math.sin(angle);
 let source=null,best=Infinity;
 for(let y=6;y<size-6;y++)for(let x=6;x<size-6;x++){
  if(!usable(x,y)||!BUILDABLE(board.tiles[index(x,y)]))continue;
  const score=Math.hypot(x-size/2,y-size/2)+hs(x,y,seed)*4;
  if(score<best){best=score;source={x,y};}
 }
 if(!source)return false;
 const mouths=[];
 for(let y=4;y<size-4;y++)for(let x=4;x<size-4;x++){
  if(!usable(x,y)||board.tiles[index(x,y)]>T.SHAL)continue;
  if(![[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>usable(x+dx,y+dy)&&board.tiles[index(x+dx,y+dy)]>T.SHAL))continue;
  const dx=x-source.x,dy=y-source.y,d=Math.hypot(dx,dy);if(d<9)continue;
  const projection=dx*ux+dy*uy;mouths.push({x,y,projection,score:Math.abs(projection)/d*40+d*.1+hs(x,y,seed+13)*5});
 }
 mouths.sort((a,b)=>b.score-a.score);
 const route=mouth=>{
  const local=(x,y)=>y*size+x,start=local(source.x,source.y),goal=local(mouth.x,mouth.y),prev=new Map([[start,-1]]),cost=new Map([[start,0]]),heap=[];
  const push=(k,f)=>{let i=heap.length;while(i){const p=(i-1)>>1;if(heap[p].f<=f)break;heap[i]=heap[p];i=p;}heap[i]={k,f};};
  const pop=()=>{const a=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let c=i*2+1;if(c+1<heap.length&&heap[c+1].f<heap[c].f)c++;if(heap[c].f>=last.f)break;heap[i]=heap[c];i=c;}heap[i]=last;}return a.k;};
  push(start,0);const seen=new Set();
  while(heap.length){const k=pop();if(seen.has(k))continue;seen.add(k);if(k===goal)break;const x=k%size,y=Math.floor(k/size);
   for(const [dx,dy] of LAND_STEPS){const nx=x+dx,ny=y+dy,n=local(nx,ny);if(!usable(nx,ny)||seen.has(n)||n!==goal&&board.tiles[index(nx,ny)]<=T.SHAL||dx&&dy&&(!usable(nx,y)||!usable(x,ny)))continue;
    const t=board.tiles[index(nx,ny)],next=cost.get(k)+Math.hypot(dx,dy)*(1+(t===T.ROCK||t===T.ORE?3:0)+vnoise(seed+983,nx/7,ny/7)*2);
    if(cost.has(n)&&cost.get(n)<=next)continue;cost.set(n,next);prev.set(n,k);push(n,next+Math.hypot(nx-mouth.x,ny-mouth.y));
   }
  }
  if(!prev.has(goal))return null;
  const path=[];for(let k=goal;k>=0;k=prev.get(k))path.push(k);path.reverse();return path.length>=10?path:null;
 };
 // Both branches must reach opposite coasts before any terrain is changed.
 // Routing through the interior prevents short rivers that merely follow a beach.
 const branches=[];for(const sign of [-1,1]){let branch=null;for(const mouth of mouths.filter(m=>m.projection*sign>=12).slice(0,8)){branch=route(mouth);if(branch)break;}if(!branch)return false;branches.push(branch);}
 const path=[...branches[0].slice().reverse(),...branches[1].slice(1)];
  for(let i=0;i<path.length;i++){const x=path[i]%size,y=Math.floor(path[i]/size),radius=1.05+(vnoise(seed+719,x/9,y/9)>.65?.4:0);
   if(i&&x!==path[i-1]%size&&y!==Math.floor(path[i-1]/size)){const join=index(x,Math.floor(path[i-1]/size));if(!board.river[join])board.riverCells.push(join);board.tiles[join]=T.SHAL;board.fish[join]=0;board.river[join]=1;islandOwners[join]=island;}
   for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const nx=x+dx,ny=y+dy;if(Math.hypot(dx,dy)>radius||!usable(nx,ny))continue;const k=index(nx,ny);board.tiles[k]=T.SHAL;board.fish[k]=0;if(!board.river[k])board.riverCells.push(k);board.river[k]=1;islandOwners[k]=island;}
  }
 return true;
}
const riverGenMap=genMap;genMap=function(seed,...args){
 const board=riverGenMap(seed,...args);board.river=new Uint8Array(board.tiles.length);board.riverCells=[];board.bridges={};board.riverIslands=[];
 if(riverRestoredCells!==null){board.riverIslands=[...(riverLoadPolicy||[])];for(const entry of riverRestoredCells){const k=Array.isArray(entry)?entry[0]:entry;if(!Number.isInteger(k)||k<0||k>=board.tiles.length||board.river[k])continue;const x=k%MAPW,y=Math.floor(k/MAPW);let i=Array.isArray(entry)?entry[1]:islandOwners[k];if(i<0)i=board.riverIslands.slice().sort((a,b)=>Math.hypot(x-ISLANDS[a].wx,y-ISLANDS[a].wy)-Math.hypot(x-ISLANDS[b].wx,y-ISLANDS[b].wy))[0];const m=ISLANDS[i];if(!m||!board.riverIslands.includes(i)||x<m.ox||y<m.oy||x>=m.ox+ISLAND_SIZE||y>=m.oy+ISLAND_SIZE)continue;board.tiles[k]=T.SHAL;board.fish[k]=0;board.river[k]=1;board.riverCells.push(k);islandOwners[k]=i;}}
 for(let i=0;i<ISLANDS.length;i++)if(riverRestoredCells!==null?riverRegenerateIslands?.includes(i):riverLoadPolicy===null||riverLoadPolicy.includes(i)){if(generateRiver(board,ISLANDS[i],i,seed+i*913))board.riverIslands.push(i);}
 riverGeneratedBoard=board;return board;
};
const riverNewGame=newGame;newGame=function(seed,style=1,shared=null){const g=riverNewGame(seed,style,shared),board=shared||riverGeneratedBoard;
 g.river=board?.tiles===g.tiles?board.river:null;g.riverCells=board?.riverCells||[];g.bridges=board?.bridges||{};g.riverIslands=board?.riverIslands||[];return g;
};
const riverResetWorld=resetWorld;resetWorld=function(...args){riverResetWorld(...args);Object.assign(WORLD.board,{river:G.river,riverCells:G.riverCells,bridges:G.bridges,riverIslands:G.riverIslands});};
const riverPack=packIsland;packIsland=function(g){return {...riverPack(g),bridges:Object.fromEntries(Object.entries(g.bridges||{}).filter(([k])=>islandAt(+k%MAPW,Math.floor(+k/MAPW))===g.island))};};
const riverUnpack=unpackIsland;unpackIsland=function(o,...args){const g=riverUnpack(o,...args);Object.assign(g.bridges,o.bridges||{});return g;};
const riverLoad=loadGame;loadGame=function(...args){
 let saved;try{saved=JSON.parse(localStorage.getItem(SAVEKEY));}catch{}
 if(saved?.riverVersion===RIVER_VERSION&&Array.isArray(saved.riverIslands)){riverLoadPolicy=saved.riverIslands.filter(i=>Number.isInteger(i)&&i>=0&&i<ISLANDS.length);if(Array.isArray(saved.riverCells))riverRestoredCells=saved.riverCells;}
 else if(saved){const unseen=ISLANDS.map((_,i)=>i).filter(i=>!saved.fog?.islands?.[i]&&(!saved.islands?.[i]?.blds?.length||saved.islands?.[i]?.cpu)&&i!==(saved.active||0));riverLoadPolicy=unseen;
  if(saved.riverVersion>=1&&Array.isArray(saved.riverCells)&&Array.isArray(saved.riverIslands)){riverRegenerateIslands=unseen;riverLoadPolicy=saved.riverIslands.filter(i=>Number.isInteger(i)&&i>=0&&i<ISLANDS.length&&!unseen.includes(i));riverRestoredCells=saved.riverCells.filter(entry=>Array.isArray(entry)&&riverLoadPolicy.includes(entry[1]));}
  // Unseen AI settlements remain intact; river routing avoids their buildings and roads.
  const width=saved.mapWidth||MAPW;for(const g of saved.islands||[])if(g){for(const b of g.blds||[])for(let y=b.y-1;y<b.y+(b.h||B[b.type]?.h||1)+1;y++)for(let x=b.x-1;x<b.x+(b.w||B[b.type]?.w||1)+1;x++)riverSavedObstacles.add(y*width+x);for(const k of g.roads||[])for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)riverSavedObstacles.add(k+dy*width+dx);}
 }
 try{const result=riverLoad(...args);if(result&&saved?.riverVersion!==RIVER_VERSION)saveGame();return result;}finally{riverLoadPolicy=null;riverRestoredCells=null;riverRegenerateIslands=null;riverSavedObstacles.clear();}
};
function isRiver(k,g=G){return !!g?.river?.[k];}
function riverBank(x,y,island=activeIsland){return roadTileAllowed(x,y,island)&&!isRiver(IDX(x,y));}
function riverCrossing(bank,dx,dy,island=activeIsland){
 if(!LAND_STEPS.some(([sx,sy])=>sx===dx&&sy===dy))return null;
 const cells=[bank],x=bank%MAPW,y=Math.floor(bank/MAPW);if(!riverBank(x,y,island))return null;
 for(let n=1;n<=BRIDGE_LIMIT+1;n++){const nx=x+dx*n,ny=y+dy*n;if(!INMAP(nx,ny)||islandAt(nx,ny)!==island)return null;const k=IDX(nx,ny);
  if(isRiver(k)){if(G.occ[k]||G.bridges[k]&&(G.bridges[k].dx!==dx||G.bridges[k].dy!==dy)&&(G.bridges[k].dx!==-dx||G.bridges[k].dy!==-dy))return null;cells.push(k);continue;}
  if(cells.length<2||!riverBank(nx,ny,island))return null;cells.push(k);return {cells,dx,dy};
 }return null;
}
function riverCrossingAt(k,island=activeIsland){
 const x=k%MAPW,y=Math.floor(k/MAPW),options=[];
 for(const [dx,dy] of [[1,0],[0,1],[1,1],[1,-1]])for(let n=1;n<=BRIDGE_LIMIT;n++){const bx=x-dx*n,by=y-dy*n;if(!INMAP(bx,by))break;if(isRiver(IDX(bx,by)))continue;const span=riverCrossing(IDX(bx,by),dx,dy,island);if(span?.cells.includes(k))options.push(span);break;}
 return options.sort((a,b)=>a.cells.length-b.cells.length||Math.abs(a.dx*a.dy)-Math.abs(b.dx*b.dy))[0]||null;
}
const riverRoadAllowed=roadTileAllowed;roadTileAllowed=function(x,y,island=activeIsland){return riverRoadAllowed(x,y,island)||INMAP(x,y)&&islandAt(x,y)===island&&isRiver(IDX(x,y))&&!G.occ[IDX(x,y)];};
const riverRoadStep=roadStepAllowed;roadStepAllowed=function(x,y,nx,ny,g=G){
 if(!INMAP(x,y)||!INMAP(nx,ny))return false;const a=IDX(x,y),b=IDX(nx,ny),dx=nx-x,dy=ny-y;
 if(isRiver(a,g)||isRiver(b,g)){if(Math.abs(dx)>1||Math.abs(dy)>1||!dx&&!dy)return false;
  for(const k of [a,b])if(isRiver(k,g)){const deck=g.bridges?.[k];if(!deck||!(deck.dx===dx&&deck.dy===dy||deck.dx===-dx&&deck.dy===-dy))return false;}
  return true;
 }return riverRoadStep(x,y,nx,ny,g);
};
const riverPlanRoad=plannedRoadPath;plannedRoadPath=function(start,end,island=activeIsland,maxLength=Infinity){
 if(start.x===end.x&&start.y===end.y&&isRiver(IDX(start.x,start.y))){return riverCrossingAt(IDX(start.x,start.y),island)?.cells||null;}
 const from=roadEndpoint(start,end,island),to=roadEndpoint(end,start,island);if(!from||!to||isRiver(IDX(from.x,from.y))||isRiver(IDX(to.x,to.y)))return null;
 const first=IDX(from.x,from.y),goal=IDX(to.x,to.y),prev=new Map([[first,null]]),cost=new Map([[first,0]]),heap=[],closed=new Set();
 const push=(k,f)=>{let i=heap.length;while(i){const p=(i-1)>>1;if(heap[p].f<=f)break;heap[i]=heap[p];i=p;}heap[i]={k,f};};
 const pop=()=>{const a=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let c=i*2+1;if(c+1<heap.length&&heap[c+1].f<heap[c].f)c++;if(heap[c].f>=last.f)break;heap[i]=heap[c];i=c;}heap[i]=last;}return a.k;};
 const heuristic=k=>Math.hypot(k%MAPW-to.x,Math.floor(k/MAPW)-to.y)*.35;push(first,heuristic(first));
 while(heap.length){const k=pop();if(closed.has(k))continue;closed.add(k);if(k===goal){const parts=[];for(let n=goal;n!==first;){const edge=prev.get(n);parts.push(edge.cells);n=edge.from;}return [first,...parts.reverse().flat()];}
  const x=k%MAPW,y=Math.floor(k/MAPW);
  for(const [dx,dy] of LAND_STEPS){const nx=x+dx,ny=y+dy;if(!INMAP(nx,ny))continue;let cells=[IDX(nx,ny)];
   if(isRiver(cells[0])){const span=riverCrossing(k,dx,dy,island);if(!span)continue;cells=span.cells.slice(1);}
   else if(!riverBank(nx,ny,island)||!roadStepAllowed(x,y,nx,ny)||dx&&dy&&(!roadCornerPlacementAllowed(nx,y,-dx,dy,island)||!roadCornerPlacementAllowed(x,ny,dx,-dy,island)))continue;
   const n=cells[cells.length-1],length=cells.length*Math.hypot(dx,dy);if(Math.hypot(n%MAPW-from.x,Math.floor(n/MAPW)-from.y)+Math.hypot(n%MAPW-to.x,Math.floor(n/MAPW)-to.y)>maxLength)continue;
   const next=cost.get(k)+cells.reduce((sum,c)=>sum+(G.road[c]?.35:1),0)*Math.hypot(dx,dy);if(closed.has(n)||cost.has(n)&&cost.get(n)<=next)continue;
   cost.set(n,next);prev.set(n,{from:k,cells});push(n,next+heuristic(n));
  }
 }return null;
};
function riverPlanDetails(plan){
 const path=plan.path,mode=plan.mode||UI.roadMode||'path',kind=mode==='stone'||mode==='stonebridge'?2:1,spans=[],cost={},changes=new Set();
 const add=p=>{for(const [g,n] of Object.entries(p))cost[g]=(cost[g]||0)+n;};
 if(!path)return {spans,cost,changes:[],kind,valid:false};
 for(let i=0;i<path.length;i++){const k=path[i];if(!isRiver(k))continue;let end=i;while(end<path.length&&isRiver(path[end]))end++;if(i===0||end===path.length)return {spans,cost,changes:[],kind,valid:false};
  const dx=Math.sign(k%MAPW-path[i-1]%MAPW),dy=Math.sign(Math.floor(k/MAPW)-Math.floor(path[i-1]/MAPW)),span=riverCrossing(path[i-1],dx,dy,plan.island);
  if(!span||span.cells.length!==end-i+2||span.cells.some((c,j)=>c!==path[i-1+j]))return {spans,cost,changes:[],kind,valid:false};spans.push(span);i=end-1;
 }
 if(mode.includes('bridge')&&!spans.length)return {spans,cost,changes:[],kind,valid:false};
 for(const k of new Set(path)){if(G.road[k]>=kind)continue;changes.add(k);if(isRiver(k))add(G.road[k]?{gold:6,stein:3}:kind===2?{gold:10,holz:3,stein:3}:{gold:4,bretter:3});else add(G.road[k]?{gold:4,stein:1}:kind===2?{gold:ROAD_COST+4,stein:1}:{gold:ROAD_COST});}
 return {spans,cost,changes:[...changes],kind,valid:true};
}
function updateRiverPlanSummary(){let el=document.getElementById('road-plan-summary');const plan=constructionPlan?.tool==='road'?constructionPlan:null;
 if(UI.cat!=='roads'||!plan&&!UI.paintFail){el?.remove();return;}
 if(!el){el=document.createElement('p');el.id='road-plan-summary';el.setAttribute('role','status');el.setAttribute('aria-live','polite');$('#items').before(el);}
 const d=plan?.bridgePlan,text=plan?d?.valid?`${d.spans.length} Brücke${d.spans.length===1?'':'n'} · Gesamt: ${Object.entries(d.cost).map(([g,n])=>fmt(n)+' '+(g==='gold'?'Gold':GN[g].n)).join(' · ')||'bereits vorhanden'}${canAfford(d.cost)?'':' · Material oder Gold fehlt'}`:'Keine vollständige Überquerung möglich.':UI.paintFail;
 if(el.textContent!==text)el.textContent=text;el.dataset.error=String(!plan||!d?.valid||!canAfford(d.cost));const rect=$('#items').getBoundingClientRect();el.style.left=rect.left+'px';el.style.bottom=innerHeight-rect.top-2+'px';el.style.maxWidth=rect.width+'px';
}
const riverUpdatePlan=updateConstructionPlan;updateConstructionPlan=function(t){riverUpdatePlan(t);const p=constructionPlan;if(p?.tool==='road'){p.mode=UI.roadMode||'path';p.bridgePlan=riverPlanDetails(p);p.newRoads=p.bridgePlan.changes;p.gold=p.bridgePlan.cost.gold||0;updateHint();updateRiverPlanSummary();}};
const riverFinishPlan=finishConstructionPlan;finishConstructionPlan=function(...args){const result=riverFinishPlan(...args);updateRiverPlanSummary();return result;};
const riverCancelPlan=cancelConstructionPlan;cancelConstructionPlan=function(...args){const result=riverCancelPlan(...args);UI.paintFail='';updateRiverPlanSummary();return result;};
// Include the bank intervals when distributing supports; adjacent supports never touch.
function bridgePierIndices(cellCount){const water=cellCount-2;if(water<=2)return new Set();const count=Math.max(1,Math.floor(water/3)),indices=new Set();for(let i=1;i<=count;i++)indices.add(Math.round(i*(water+1)/(count+1)));return indices;}
const riverCommitRoad=commitRoadPlan;commitRoadPlan=function(plan){
 const details=riverPlanDetails(plan);if(!details.valid)return 'Plane eine vollständige Überquerung von Ufer zu Ufer.';
 if(activeIsland!==plan.island||plan.path.some(k=>!roadTileAllowed(k%MAPW,Math.floor(k/MAPW),plan.island)))return 'Die Baufläche hat sich geändert. Bitte erneut planen.';
 if(!whList().length)return 'Zuerst ein Kontor gründen.';
 if(details.kind===2&&!stoneRoadUnlocked())return 'Für Steinbrücken und Straßen wird ein Steinbruch benötigt.';
 if(!canAfford(details.cost))return 'Für den gesamten Weg einschließlich Brücken fehlt Gold oder Baumaterial.';
 payCost(details.cost);
 for(const span of details.spans){const cells=span.cells.filter(k=>isRiver(k)&&G.tiles[k]<=T.SHAL),piers=bridgePierIndices(cells.length+2),id=span.cells[0]+':'+span.cells[span.cells.length-1];
  for(const k of span.cells)if(!cells.includes(k))delete G.bridges[k];
  cells.forEach((k,j)=>{const existing=G.bridges[k],kind=Math.max(details.kind,G.road[k]||1);G.bridges[k]={id,cells,dx:span.dx,dy:span.dy,kind,part:j===0||j===cells.length-1?'ramp':'deck',pier:piers.has(j+1),wasRoad:existing?.wasRoad??!!G.road[k]};});
 }
 for(const k of details.changes){if(!G.road[k])G.roads++;G.road[k]=details.kind;if(G.tiles[k]===T.FOREST)G.tiles[k]=T.GRASS;PERF_ROADS.get(G.road)?.add(k);}
 G.dirty=true;rebuildNet();saveGame();renderTop(true);return true;
};
const riverPlaceRoad=placeRoad;placeRoad=function(x,y){const k=IDX(x,y);if(!INMAP(x,y)||!isRiver(k)||G.road[k])return riverPlaceRoad(x,y);
 const options=[];for(const [dx,dy] of LAND_STEPS)for(let n=1;n<=BRIDGE_LIMIT;n++){const bx=x-dx*n,by=y-dy*n;if(!INMAP(bx,by))break;const bank=IDX(bx,by);if(isRiver(bank))continue;if(G.road[bank]){const span=riverCrossing(bank,dx,dy);if(span?.cells.includes(k))options.push(span);}break;}
 const span=options.sort((a,b)=>a.cells.length-b.cells.length)[0]||riverCrossingAt(k);return !!span&&commitRoadPlan({path:span.cells,island:activeIsland,mode:CPU_WORK?'path':UI.roadMode||'path'})===true;
};
function bridgeUpgradeTileCost(k){return isRiver(k)?{gold:6,stein:3}:{gold:4,stein:1};}
const riverUpgrade=roadUpgrade;roadUpgrade=function(x,y){const k=IDX(x,y),b=G.bridges?.[k];if(!b)return riverUpgrade(x,y);
 if(!stoneRoadUnlocked())return false;const cost={};for(const n of b.cells)if(G.road[n]===1)for(const [g,q] of Object.entries(bridgeUpgradeTileCost(n)))cost[g]=(cost[g]||0)+q;
 if(!Object.keys(cost).length||!canAfford(cost))return false;payCost(cost);for(const n of b.cells){G.road[n]=2;if(G.bridges[n])G.bridges[n].kind=2;}G.dirty=true;return true;
};
const riverAreaUpgrade=areaUpgradeTargets;areaUpgradeTargets=function(...args){const target=riverAreaUpgrade(...args);if(target.type!=='road')return target;const roads=new Set(target.roads);for(const k of target.roads)for(const n of G.bridges?.[k]?.cells||[])if(G.road[n]===1)roads.add(n);target.roads=[...roads];target.cost={};for(const k of roads)for(const [g,n] of Object.entries(bridgeUpgradeTileCost(k)))target.cost[g]=(target.cost[g]||0)+n;return target;};
const riverDemolish=demolishAt;demolishAt=function(x,y){
 if(!INMAP(x,y))return false;const k=IDX(x,y),b=G.bridges?.[k];if(!b)return riverDemolish(x,y);
 if(WORLD.islands[islandAt(x,y)]?.cpu&&!CPU_WORK)return 'Diese Insel gehört einem anderen Siedler.';
 if(CPU_WORK){for(const n of b.cells){if(!G.bridges[n])continue;if(isRiver(n)||!G.bridges[n].wasRoad){if(G.road[n]){G.roads--;G.gold++;}G.road[n]=0;PERF_ROADS.get(G.road)?.delete(n);}delete G.bridges[n];}G.dirty=true;return true;}
 if(WINS['area-demolition'])return false;
 pendingAreaDemolition={island:activeIsland,rect:{x0:x,y0:y,x1:x,y1:y},buildings:[],roads:[...b.cells]};
 openWin('area-demolition','Brücke abreißen',areaDemolitionHTML);return false;
};
const riverDemolitionTargets=areaDemolitionTargets;areaDemolitionTargets=function(...args){const t=riverDemolitionTargets(...args),roads=new Set(t.roads);for(const k of t.roads)for(const n of G.bridges?.[k]?.cells||[])roads.add(n);t.roads=[...roads];return t;};
const riverWinAct=winAct;winAct=function(id,ds){const cells=ds.act==='area-demolish-confirm'?pendingAreaDemolition?.roads:null,result=riverWinAct(id,ds);if(cells)for(const k of cells)delete G.bridges[k];return result;};
const BRIDGE_ART_CACHE=new Map();
function bridgeArchFor(cells,index){const supports=[0,...bridgePierIndices(cells.length+2),cells.length+1].sort((a,b)=>a-b);return {tile:index+1,supports};}
function bridgeSprite(dx,dy,kind,part,pier=false,arch=null){
 const key=[dx,dy,kind,part,pier,arch?JSON.stringify(arch):''].join(':');if(BRIDGE_ART_CACHE.has(key))return BRIDGE_ART_CACHE.get(key);
 const canvas=document.createElement('canvas');canvas.width=canvas.height=24;const {r,p,ln}=civicPainter(canvas),len=Math.hypot(dx,dy),ux=dx/len,uy=dy/len,vx=-uy,vy=ux,point=(a,b)=>[12+a*ux+b*vx,(kind===2?7:11)+a*uy+b*vy],extent=8*len+1;
 // Stone arches span the intervals between actual supports, on the visible front face.
 if(kind===2){
  const layout=arch||{tile:1,supports:[0,2]};
  for(let a=-extent;a<=extent;a++){
   const position=layout.tile+a/(16*len),right=layout.supports.find(v=>v>=position)??layout.supports.at(-1),left=[...layout.supports].reverse().find(v=>v<=position)??layout.supports[0],span=right-left;
   const t=span?Math.max(-1,Math.min(1,(position-left)/span*2-1)):1,depth=Math.round(4+7*(1-Math.sqrt(Math.max(0,1-t*t)))),q=point(a,5);
   r(q[0],q[1],1,depth,'#808283');r(q[0],q[1]+depth-1,1,1,'#5b5d5e');
   if(Math.round(position*16)%5===0)r(q[0],q[1]+1,1,Math.max(1,depth-2),'#5b5d5e');
   if(a%3===0)r(q[0],q[1]+depth-2,1,1,'#a1a3a4');
  }
 }
 // Stone uses the road's neutral grey cobble palette, rather than green stone.
 if(pier){r(10,13,4,9,kind===2?'#808283':'#654d31');r(10,14,1,7,kind===2?'#a1a3a4':'#bc9362');r(9,21,6,2,'#3b5959');for(let y=16;y<21;y+=3)r(11,y,3,1,kind===2?'#5b5d5e':'#47392c');}
 p([point(-extent,-5),point(extent,-5),point(extent,5),point(-extent,5)],kind===2?'#5b5d5e':'#493723');
 p([point(-extent,-4),point(extent,-4),point(extent,4),point(-extent,4)],kind===2?'#808283':'#b18854');
 for(let a=-extent;a<extent;a+=2){const q=point(a,-4),z=point(a,4);ln(...q,...z,kind===2?'#5b5d5e':'#735535');if(kind===2){const q=point(a+1,a%4===0?0:-2);r(q[0],q[1],1,1,'#969899');}}
 for(const side of [-1,1]){const q=point(-extent,side*5),z=point(extent,side*5);ln(q[0],q[1]-2,z[0],z[1]-2,kind===2?'#b0b2b3':'#d2ad70');ln(q[0],q[1]-1,z[0],z[1]-1,kind===2?'#787a7b':'#8a6940');for(let a=-extent+2;a<extent;a+=5){const q=point(a,side*5);r(q[0],q[1]-3,1,4,kind===2?'#969899':'#b8945e');}}
 if(part==='ramp')for(const a of [-6,6]){const q=point(a,-4),z=point(a,4);ln(...q,...z,kind===2?'#a1a3a4':'#e0bd7f');}
 BRIDGE_ART_CACHE.set(key,canvas);return canvas;
}
const STONE_SPAN_ART=new Map();
function stoneSpanArt(count,dx,dy){
 const key=count+':'+dx+':'+dy;if(STONE_SPAN_ART.has(key))return STONE_SPAN_ART.get(key);
 const a=document.createElement('canvas'),len=Math.hypot(dx,dy),ux=dx/len,uy=dy/len,vx=-uy,vy=ux,minX=Math.min(0,(count-1)*dx*16),minY=Math.min(0,(count-1)*dy*16);
 a.width=Math.abs((count-1)*dx*16)+24;a.height=Math.abs((count-1)*dy*16)+32;
 const {r,p,ln}=civicPainter(a),point=(along,across)=>[12-minX+along*ux+across*vx,7-minY+along*uy+across*vy],start=-8*len-1,end=(count-1)*16*len+8*len+1,supports=[0,...bridgePierIndices(count+2),count+1].sort((x,y)=>x-y);
 // One continuous arch face, so neither brickwork nor vaults restart at tile boundaries.
 for(let along=start;along<=end;along+=.5){
  const position=1+along/(16*len),right=supports.find(v=>v>=position)??supports.at(-1),left=[...supports].reverse().find(v=>v<=position)??supports[0],span=right-left,t=span?Math.max(-1,Math.min(1,(position-left)/span*2-1)):1;
  const depth=Math.round(2+12*(1-Math.sqrt(Math.max(0,1-t*t)))),q=point(along,5),x=Math.round(q[0]),y=Math.round(q[1]);
  r(x,y,1,depth,'#808283');r(x,y+depth-1,1,1,'#4f5152');r(x,y+depth-2,1,1,'#a1a3a4');
  if(Math.floor(position*16)%6===0)r(x,y+1,1,Math.max(1,depth-3),'#5b5d5e');
 }
 for(const support of bridgePierIndices(count+2)){const q=point((support-1)*16*len,0);r(q[0]-2,q[1]+5,5,17,'#808283');r(q[0]-2,q[1]+5,1,16,'#b0b2b3');for(let y=8;y<21;y+=4)r(q[0]-1,q[1]+y,4,1,'#5b5d5e');}
 p([point(start,-5),point(end,-5),point(end,5),point(start,5)],'#5b5d5e');p([point(start,-4),point(end,-4),point(end,4),point(start,4)],'#808283');
 for(let along=start;along<end;along+=4){ln(...point(along,-4),...point(along,4),'#5b5d5e');const q=point(along+1,0);r(q[0],q[1],1,1,'#969899');}
 for(const side of [-1,1]){const q=point(start,side*5),z=point(end,side*5);ln(q[0],q[1]-2,z[0],z[1]-2,'#b0b2b3');ln(q[0],q[1]-1,z[0],z[1]-1,'#787a7b');}
 const result={canvas:a,minX,minY};STONE_SPAN_ART.set(key,result);return result;
}
function drawStoneBridgeSpan(ctx,b){
 const cells=b.cells;if(!cells?.length)return;const first=cells[0],art=stoneSpanArt(cells.length,b.dx,b.dy);
 ctx.drawImage(art.canvas,first%MAPW*16-4+art.minX,Math.floor(first/MAPW)*16-4+art.minY);
}
const riverDrawRoad=drawRoadTile;drawRoadTile=function(ctx,mask,stone,x,y){const b=G.bridges?.[IDX(x,y)];if(b){if(b.kind===2){if(!ctx._stoneSpanDrawn?.has(b.id)){ctx._stoneSpanDrawn?.add(b.id);drawStoneBridgeSpan(ctx,b);}return;}ctx.drawImage(bridgeSprite(b.dx,b.dy,b.kind,b.part,b.pier,bridgeArchFor(b.cells,b.cells.indexOf(IDX(x,y)))),x*16-4,y*16-4,24,24);return;}riverDrawRoad(ctx,mask,stone,x,y);};
const riverGhost=drawGhost;drawGhost=function(ctx){const p=constructionPlan;if(p?.tool!=='road'||!p.bridgePlan?.valid)return riverGhost(ctx);ctx.save();ctx.fillStyle=canAfford(p.bridgePlan.cost)?'rgba(235,212,149,.45)':'rgba(222,107,88,.5)';for(const k of p.newRoads)ctx.fillRect(k%MAPW*16,Math.floor(k/MAPW)*16,16,16);ctx.globalAlpha=.7;for(const span of p.bridgePlan.spans){const cells=span.cells.filter(k=>isRiver(k)&&G.tiles[k]<=T.SHAL),piers=bridgePierIndices(cells.length+2);if(p.bridgePlan.kind===2)drawStoneBridgeSpan(ctx,{cells,dx:span.dx,dy:span.dy});else cells.forEach((k,i)=>ctx.drawImage(bridgeSprite(span.dx,span.dy,p.bridgePlan.kind,i===0||i===cells.length-1?'ramp':'deck',piers.has(i+1),bridgeArchFor(cells,i)),k%MAPW*16-4,Math.floor(k/MAPW)*16-4,24,24));}ctx.restore();};
const riverDrawLand=drawLandRegion;drawLandRegion=function(ctx,x0,y0,x1,y1){riverDrawLand(ctx,x0,y0,x1,y1);if(!G.river)return;
 const phase=WORK_ART.reduced.matches?0:Math.floor(G.time*2)%8;ctx.save();ctx.fillStyle='#85b9bd';ctx.globalAlpha=.35;
 for(const k of G.riverCells||[]){const x=k%MAPW,y=Math.floor(k/MAPW);if(x*16<x0-16||y*16<y0-16||x*16>x1||y*16>y1||!isRiver(k))continue;ctx.fillRect(x*16+3+(x+phase)%8,y*16+5+(y%3),4,1);ctx.fillRect(x*16+2+(phase+3)%7,y*16+12,3,1);}
 ctx.restore();
};

const spacedBridgeUnpack=unpackIsland;unpackIsland=function(...args){
 const g=spacedBridgeUnpack(...args),seen=new Set();
 for(const bridge of Object.values(g.bridges||{})){
 if(seen.has(bridge.id))continue;seen.add(bridge.id);
 const old=bridge.cells||[],cells=old.filter(k=>isRiver(k,g)&&g.tiles[k]<=T.SHAL),piers=bridgePierIndices(cells.length+2);
 for(const k of old)if(!cells.includes(k))delete g.bridges[k];
 cells.forEach((k,i)=>{const part=g.bridges[k];if(part){part.cells=cells;part.part=i===0||i===cells.length-1?'ramp':'deck';part.pier=piers.has(i+1);}});
 }
 return g;
};

const stoneSpanDrawLand=drawLandRegion;
drawLandRegion=function(ctx,...args){const previous=ctx._stoneSpanDrawn;ctx._stoneSpanDrawn=new Set();try{return stoneSpanDrawLand(ctx,...args);}finally{ctx._stoneSpanDrawn=previous;}};
