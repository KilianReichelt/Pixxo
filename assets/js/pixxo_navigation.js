/* Gemeinsame Navigation für freie Fahrten und Handelsrouten. */
const SEA_STEPS=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,Math.SQRT2],[-1,1,Math.SQRT2],[1,-1,Math.SQRT2],[-1,-1,Math.SQRT2]];
let seaSearch=null;
function seaSearchState(){
 if(!seaSearch||seaSearch.tiles!==G.tiles){const n=MAPW*MAPH;seaSearch={tiles:G.tiles,stamp:new Uint32Array(n),closed:new Uint32Array(n),cost:new Float64Array(n),prev:new Int32Array(n),generation:0};waterRoutes.clear();}
 return seaSearch;
}
function seaStepAllowed(x,y,dx,dy){return INMAP(x+dx,y+dy)&&G.tiles[IDX(x+dx,y+dy)]<=T.SHAL&&(!dx||!dy||(G.tiles[IDX(x+dx,y)]<=T.SHAL&&G.tiles[IDX(x,y+dy)]<=T.SHAL));}
function nearestWater(from,to){
 if(!from||!INMAP(Math.floor(from.x),Math.floor(from.y))||!INMAP(Math.floor(to.x),Math.floor(to.y)))return null;
 if(G.tiles[IDX(Math.floor(from.x),Math.floor(from.y))]>T.SHAL)return null;
 let best=null,distance=Infinity;const x=Math.floor(to.x),y=Math.floor(to.y);
 // Der äußere Ring ist erst beendet, wenn kein näherer Punkt mehr möglich ist.
 for(let r=0;r<Math.max(MAPW,MAPH);r++){
  const candidates=[];
  const consider=(px,py)=>{if(!INMAP(px,py)||G.tiles[IDX(px,py)]>T.SHAL)return;const d=(px-x)**2+(py-y)**2;if(d<distance)candidates.push({x:px,y:py,d});};
  for(let dx=-r;dx<=r;dx++){consider(x+dx,y-r);if(r)consider(x+dx,y+r);}
  for(let dy=-r+1;dy<r;dy++){consider(x-r,y+dy);if(r)consider(x+r,y+dy);}
  candidates.sort((a,b)=>a.d-b.d);
  for(const candidate of candidates){if(candidate.d>=distance)break;const path=seaPath(candidate,from);if(path){distance=candidate.d;best={x:candidate.x,y:candidate.y,path:path.reverse()};break;}}
  if(best&&(r+1)**2>distance)break;
 }
 return best;
}
seaPath=function(from,to){
 if(!from||!to)return null;const sx=Math.floor(from.x),sy=Math.floor(from.y),ex=Math.floor(to.x),ey=Math.floor(to.y);
 if(!INMAP(sx,sy)||!INMAP(ex,ey)||G.tiles[IDX(sx,sy)]>T.SHAL||G.tiles[IDX(ex,ey)]>T.SHAL)return null;
 const s=seaSearchState(),gen=++s.generation,start=IDX(sx,sy),end=IDX(ex,ey),heap=[];
 const heuristic=(x,y)=>{const dx=Math.abs(ex-x),dy=Math.abs(ey-y);return Math.max(dx,dy)+(Math.SQRT2-1)*Math.min(dx,dy);};
 const less=(a,b)=>Math.abs(a[1]-b[1])<1e-8?a[2]<b[2]:a[1]<b[1];
 const push=(k,f,h)=>{const entry=[k,f,h];let i=heap.length;heap.push(entry);while(i){const p=(i-1)>>1;if(!less(entry,heap[p]))break;heap[i]=heap[p];i=p;}heap[i]=entry;};
 const pop=()=>{const root=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let c=i*2+1;if(c+1<heap.length&&less(heap[c+1],heap[c]))c++;if(!less(heap[c],last))break;heap[i]=heap[c];i=c;}heap[i]=last;}return root[0];};
 s.stamp[start]=gen;s.cost[start]=0;s.prev[start]=-1;push(start,heuristic(sx,sy),heuristic(sx,sy));
 while(heap.length){const k=pop();if(s.closed[k]===gen)continue;s.closed[k]=gen;if(k===end){const path=[];for(let p=end;p>=0;p=s.prev[p])path.push([p%MAPW+.5,Math.floor(p/MAPW)+.5]);return path.reverse();}
  const x=k%MAPW,y=Math.floor(k/MAPW);for(const [dx,dy,length] of SEA_STEPS){if(!seaStepAllowed(x,y,dx,dy))continue;const n=IDX(x+dx,y+dy),cost=s.cost[k]+length;if(s.closed[n]===gen||s.stamp[n]===gen&&cost>=s.cost[n])continue;s.stamp[n]=gen;s.cost[n]=cost;s.prev[n]=k;const h=heuristic(x+dx,y+dy);push(n,cost+h,h);}
 }
 return null;
};
const PATH_LENGTHS=new WeakMap();
function seaPathLength(path){if(!path)return 0;if(PATH_LENGTHS.has(path))return PATH_LENGTHS.get(path);let n=0;for(let i=1;i<path.length;i++)n+=Math.hypot(path[i][0]-path[i-1][0],path[i][1]-path[i-1][1]);PATH_LENGTHS.set(path,n);return n;}
routeWaterPath=function(a,b){
 const from=WORLD?.islands[a]?.dock,to=WORLD?.islands[b]?.dock;if(!from||!to)return null;seaSearchState();
 const key=[WORLD.rootSeed,from.x,from.y,to.x,to.y].join(':');if(waterRoutes.has(key))return waterRoutes.get(key);
 const path=seaPath(from,to);waterRoutes.set(key,path);if(path)waterRoutes.set([WORLD.rootSeed,to.x,to.y,from.x,from.y].join(':'),path.slice().reverse());return path;
};
voyageTime=function(a,b,type){return Math.max(35,seaPathLength(routeWaterPath(a,b))/3/SHIPS[type].speed);};
sailShip=function(sh,x,y){
 if(!sh||sh.route||sh.buildLeft>0||sh.expedition!==undefined)return 'Dieses Schiff ist nicht verfügbar.';
 const from=freeShipPosition(sh),target=nearestWater(from,{x,y});if(!target)return 'Hier gibt es keine erreichbare Wasserstelle.';
 const path=target.path;if(!path)return 'Dieses Fahrtziel ist nicht erreichbar.';
 if(path.length===1){delete sh.manualTrip;sh.status='Vor Anker';return true;}
 const duration=Math.max(2,seaPathLength(path)/3/SHIPS[sh.type].speed);sh.manualTrip={path,duration,remaining:duration};sh.status='Unterwegs';soundEffect('ship');renderBar();return true;
};
function interpolatedSeaPosition(path,progress){
 const index=clamp(progress,0,1)*(path.length-1),i=Math.floor(index),a=path[i],b=path[Math.min(i+1,path.length-1)],f=index-i;
 return {x:a[0]+(b[0]-a[0])*f,y:a[1]+(b[1]-a[1])*f,index};
}
freeShipPosition=function(sh){
 if(sh.manualTrip)return interpolatedSeaPosition(sh.manualTrip.path,1-sh.manualTrip.remaining/sh.manualTrip.duration);
 if(sh.route&&sh.phase==='travel'){const path=routeWaterPath(sh.at,sh.to);if(path)return interpolatedSeaPosition(path,1-(sh.remaining||0)/voyageTime(sh.at,sh.to,sh.type));}
 return sh.anchor||WORLD.islands[sh.at]?.dock;
};
shipActivity=function(sh){
 if(sh.buildLeft>0)return ['i_prod','Im Bau'];if(sh.expedition!==undefined)return ['i_quest','Gründung'];
 if(sh.route)return ['i_route',WORLD.routes.find(r=>r.id===sh.route)?.paused?'Route pausiert':'Auf Handelsroute'];
 return sh.manualTrip?['i_sailing','In Bewegung']:['i_anchor','Stehend'];
};
/* Drei bewusst unterschiedliche, auch textlich benannte Zustandszeichen. */
for(const [name,text] of [['i_sailing','➜'],['i_anchor','⚓'],['i_route','⇄']]){const c=document.createElement('canvas');c.width=c.height=24;const g=c.getContext('2d');g.fillStyle='#ffe3a0';g.font='bold 22px Segoe UI Symbol';g.textAlign='center';g.textBaseline='middle';g.fillText(text,12,12);SP[name]=c;urlC[name]=c.toDataURL();}
const navigationRenderBar=renderBar;renderBar=function(){navigationRenderBar();if(UI.barMode==='fleet')for(const sh of WORLD.fleet){const button=document.querySelector(`[data-select-ship="${sh.id}"]`);if(!button)continue;const text=(sh.name||SHIPS[sh.type].n)+' · '+shipActivity(sh)[1];button.setAttribute('aria-label',text);button.title=text;}};
const navigationRenderTop=renderTop;renderTop=function(...args){navigationRenderTop(...args);if(UI.barMode==='fleet')renderBar();};
const navigationRouteForm=routeForm;routeForm=function(id){
 navigationRouteForm(id);const form=$('#routeform');if(!form)return;
 const preview=document.createElement('p');preview.className='route-preview';preview.setAttribute('aria-live','polite');form.prepend(preview);
 const update=()=>{const from=+form.elements.from.value,to=+form.elements.to.value,sh=WORLD.fleet.find(s=>s.id===+form.elements.ship.value);preview.textContent=from===to?'Wähle zwei verschiedene Häfen.':`${ISLANDS[from].name} ⇄ ${ISLANDS[to].name} · ${SHIPS[sh.type].slots} Frachträume je Richtung · Entladung automatisch am Ziel`;};
 form.addEventListener('change',update);update();
};
const navigationDetails=shipHTML;shipHTML=function(){const h=navigationDetails(),sh=WORLD.fleet.find(s=>s.id===UI.selectedShip);if(!sh)return h;return h+`<div class="sect">Routenplanung</div><button class="btn primary" data-act="ship-plan-route" ${sh.buildLeft||sh.manualTrip||sh.expedition!==undefined?'disabled':''}>${sh.route?'Handelsroute bearbeiten':'Handelsroute einrichten'}</button><p class="small">Zwei besiedelte Inseln mit Kontor und ein freies Schiff im Hafen werden benötigt. Waren und Mengen legst du für jede Fahrtrichtung fest.</p>`;};
const navigationWinAct=winAct;winAct=function(id,ds){if(ds.act==='ship-plan-route'){const sh=WORLD.fleet.find(s=>s.id===UI.selectedShip);if(sh)routeForm(sh.route||null);return;}navigationWinAct(id,ds);};

/* Entdeckung ist sofort und dauerhaft; keine verzögerte Inselblende. */
updateFog=function(dt){
 if(!WORLD?.fog)return;fogClock+=dt;if(fogClock<.2)return;fogClock=0;
 for(const sh of WORLD.fleet){if(sh.buildLeft>0)continue;const p=freeShipPosition(sh);if(!p)continue;revealSea(p.x,p.y);
  const radius=23;
  for(let y=Math.max(0,Math.floor(p.y-radius));y<Math.min(MAPH,p.y+radius);y++)for(let x=Math.max(0,Math.floor(p.x-radius));x<Math.min(MAPW,p.x+radius);x++){
   const k=IDX(x,y),i=islandOwners[k];if(i<0||WORLD.fog.islands[i]||G.tiles[k]<T.SAND||Math.hypot(x+.5-p.x,y+.5-p.y)>radius)continue;
   WORLD.fog.islands[i]=true;fogFades.delete(i);fogDirty=true;PERF_FOG.miniDirty=true;PERF_FOG.chunks.clear();UI.viewedIsland=i;renderIslandFacts();
  }
 }
};
renderIslandFacts=function(){
 const el=$('#islandfacts'),i=UI.viewedIsland??activeIsland;if(!el||!ISLANDS[i])return;
 if(WORLD.fog&&!WORLD.fog.islands[i]){el.innerHTML='';el._last=null;return;}
 const m=ISLANDS[i],deposits=WORLD.islands[i]?.deposits||unsettledDeposits(i),goods=[...m.fert.map(k=>[k,GN[k].n]),...(['mine','steinbruch','lehmgrube'].filter(type=>deposits.some(n=>n.type===type)).map(type=>type==='mine'?['erz','Eisenerz']:type==='lehmgrube'?['lehm','Lehm']:['stein','Stein']))];
 const h=`<button class="factsummary" data-facts aria-label="Ressourcen auf ${attr(m.name)}. Abbauplätze öffnen"><strong>${esc(m.name)}</strong>${goods.map(([k,n])=>`<span class="factitem">${ic(k,1)}<span>${esc(n)}</span></span>`).join('')||'<span>Keine besonderen Vorkommen</span>'}</button>`;
 if(el._last!==h&&!el.contains(document.activeElement)){el.innerHTML=h;el._last=h;}
};

/* Pixelraster, Holzpalette und helle Segel passen zur vorhandenen Weltgrafik. */
makeDirectionalShip=function(dir,type){
 const c=document.createElement('canvas');c.width=c.height=32;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
 const angle=dir*Math.PI/4,dx=Math.cos(angle),dy=Math.sin(angle)*.65,nx=-Math.sin(angle),ny=Math.cos(angle)*.65,length=type==='clipper'?12:10;
 const point=(u,v)=>[Math.round(16+dx*u+nx*v),Math.round(24+dy*u+ny*v)];
 const poly=(points,color,drop=0)=>{g.fillStyle=color;g.beginPath();points.forEach(([u,v],i)=>{const [x,y]=point(u,v);if(i)g.lineTo(x,y+drop);else g.moveTo(x,y+drop);});g.closePath();g.fill();};
 const hull=[[-length,-4],[length-4,-4],[length+2,0],[length-4,4],[-length,4],[-length-1,0]];
 poly(hull,'#203f47',3);poly(hull,'#382c25',2);poly(hull,'#795033',1);poly(hull,'#b68b54');poly([[-length+2,-2],[length-3,-2],[length,0],[length-3,2],[-length+2,2]],'#dbb777');
 for(const u of type==='clipper'?[-6,3]:[-3,4]){const [x,y]=point(u,0),h=type==='clipper'?15:12;g.fillStyle='#493426';g.fillRect(x,y-h,1,h);g.fillStyle='#6e5c43';g.fillRect(x-4,y-h+3,9,1);g.fillStyle='#c6b88b';g.fillRect(x-4,y-h+4,8,6);g.fillStyle='#eee3bc';g.fillRect(x-3,y-h+3,6,6);g.fillStyle='#fff0cc';g.fillRect(x-2,y-h+3,2,5);g.fillStyle='#a29571';g.fillRect(x-4,y-h+9,8,1);g.fillStyle='#913d34';g.fillRect(x+1,y-h-1,4,2);}
 const [x,y]=point(-length+3,0);g.fillStyle='#63432b';g.fillRect(x-2,y-3,4,3);g.fillStyle='#e5c68a';g.fillRect(x-2,y-3,4,1);
 const scaled=document.createElement('canvas');scaled.width=scaled.height=64;const out=scaled.getContext('2d');out.imageSmoothingEnabled=false;out.drawImage(c,0,0,64,64);return scaled;
};
for(const type of ['schooner','clipper'])for(let dir=0;dir<8;dir++)SHIP_SPRITES[type][dir]=makeDirectionalShip(dir,type);
drawFleet=function(ctx){
 const a=scr2w(0,0),b=scr2w(innerWidth,innerHeight);
 for(const sh of WORLD?.fleet||[]){if(sh.buildLeft>0)continue;const p=freeShipPosition(sh);if(!p||p.x*16<a.x-64||p.x*16>b.x+64||p.y*16<a.y-64||p.y*16>b.y+64)continue;
  const path=sh.manualTrip?.path||(sh.route&&sh.phase==='travel'?routeWaterPath(sh.at,sh.to):null);if(path)sh.heading=headingForPath(path,p.index||0);drawShipSprite(ctx,p,sh.heading||0,sh.type);
 }
};

/* Übersichtsdetail verhindert das Verdrängen hunderter Terrainkacheln pro Frame. */
const detailedLandRegion=drawLandRegion;
drawLandRegion=function(ctx,x0,y0,x1,y1){
 if(!land||land._tiles!==G.tiles)buildLand();
 if(UI.z<.45){nativeDrawImage.call(ctx,mmBase,x0/16,y0/16,(x1-x0)/16,(y1-y0)/16,x0,y0,x1-x0,y1-y0);return;}
 detailedLandRegion(ctx,x0,y0,x1,y1);
};
const detailedWorldFog=drawWorldFog;
drawWorldFog=function(ctx,x0,y0,x1,y1){
 if(UI.z>=.45){detailedWorldFog(ctx,x0,y0,x1,y1);return;}
 const image=prepareFog();if(image)nativeDrawImage.call(ctx,image,0,0,MAPW*16,MAPH*16);
 ctx.fillStyle=nightFogEdgeColor();if(x0<0)ctx.fillRect(x0,y0,-x0,y1-y0);if(y0<0)ctx.fillRect(0,y0,MAPW*16,-y0);if(x1>MAPW*16)ctx.fillRect(MAPW*16,y0,x1-MAPW*16,y1-y0);if(y1>MAPH*16)ctx.fillRect(0,MAPH*16,MAPW*16,y1-MAPH*16);
};
/* Gebäudeverweise bleiben gültig bei Bewegung; Neubauten und Laden erneuern die Liste. */
let buildingListCache={world:null,states:[],list:[]};
worldBuildings=function(){
 if(!WORLD)return G.blds;
 if(buildingListCache.world!==WORLD||WORLD.islands.some((g,i)=>buildingListCache.states[i]?.array!==g?.blds||buildingListCache.states[i]?.length!==g?.blds.length)){
  buildingListCache={world:WORLD,states:WORLD.islands.map(g=>({array:g?.blds,length:g?.blds.length})),list:WORLD.islands.filter(Boolean).flatMap(g=>g.blds)};
 }
 return buildingListCache.list;
};
