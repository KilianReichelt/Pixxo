/* Decorative trips use existing ambient boats. No fleet, stock or save objects. */
const FISHING_BOATS={states:new WeakMap(),failures:new WeakMap(),maxVisible:12,maxSearch:1200,radius:18,metrics:{visible:0,routes:0}};
function fishingSeaCell(x,y,blocked){
 if(!INMAP(x,y))return false;const k=IDX(x,y);
 return G.tiles[k]<=T.SHAL&&!G.river?.[k]&&!G.occ[k]&&!G.road[k]&&!G.bridges?.[k]?.pier&&!blocked.has(k);
}
function fishingSeaLoop(origin,blocked){
 for(const r of [2,1]){const points=[[0,0],[r,0],[r,r],[0,r],[-r,r],[-r,0],[-r,-r],[0,-r],[r,-r],[r,0],[0,0]].map(([x,y])=>[origin[0]+x,origin[1]+y]);
  const safe=points.every((p,i)=>{if(!i)return true;const a=points[i-1],steps=Math.ceil(Math.hypot(p[0]-a[0],p[1]-a[1])*4);for(let n=0;n<=steps;n++){const t=n/steps,x=Math.floor(a[0]+(p[0]-a[0])*t),y=Math.floor(a[1]+(p[1]-a[1])*t);if(!fishingSeaCell(x,y,blocked))return false;}return true;});
  if(safe){const lengths=[0];for(let i=1;i<points.length;i++)lengths.push(lengths.at(-1)+Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]));return {points,lengths,length:lengths.at(-1)};}
 }return null;
}
function fishingBoatRoute(b){
 const plan=coastPierPlanFor(b);if(!plan?.cells.length)return null;
 const [dx,dy]={north:[0,-1],east:[1,0],south:[0,1],west:[-1,0]}[plan.side],tip=plan.cells.at(-1),blocked=new Set();
 for(const p of coastalPierPlans().values())for(const [x,y]of p.cells)blocked.add(IDX(x,y));
 let start=null;for(let n=1;n<=4;n++){const x=tip[0]+dx*n,y=tip[1]+dy*n;if(!INMAP(x,y)||G.tiles[IDX(x,y)]>T.SHAL||G.river?.[IDX(x,y)])break;if(fishingSeaCell(x,y,blocked)){start={x,y};break;}}
 if(!start)return null;
 const first=IDX(start.x,start.y),queue=[first],previous=new Map([[first,-1]]);let best=first,bestScore=-Infinity;
 for(let i=0;i<queue.length&&i<FISHING_BOATS.maxSearch;i++){
  const k=queue[i],x=k%MAPW,y=Math.floor(k/MAPW),distance=Math.hypot(x-start.x,y-start.y),outward=(x-start.x)*dx+(y-start.y)*dy;
  if(distance>=6&&distance<=15&&outward>=4){const score=outward*.7+distance*.3+hs(x,y,b.id+543)*3;if(score>bestScore){bestScore=score;best=k;}}
  for(const [sx,sy]of LAND_STEPS){const nx=x+sx,ny=y+sy,n=IDX(nx,ny);if(previous.has(n)||Math.hypot(nx-start.x,ny-start.y)>FISHING_BOATS.radius||!fishingSeaCell(nx,ny,blocked)||sx&&sy&&(!fishingSeaCell(nx,y,blocked)||!fishingSeaCell(x,ny,blocked)))continue;previous.set(n,k);queue.push(n);}
 }
 if(best===first)return null;const path=[];for(let k=best;k!==-1;k=previous.get(k))path.push([k%MAPW+.5,Math.floor(k/MAPW)+.5]);path.reverse();
 const lengths=[0];for(let i=1;i<path.length;i++)lengths.push(lengths.at(-1)+Math.hypot(path[i][0]-path[i-1][0],path[i][1]-path[i-1][1]));
 FISHING_BOATS.metrics.routes++;return {path,lengths,length:lengths.at(-1),loop:fishingSeaLoop(path.at(-1),blocked),loopDistance:0,board:G.tiles,piers:coastalPierPlans(),x:b.x,y:b.y,phase:'dock',distance:0,wait:3+b.id%9,last:(WORLD.islands[b.island??activeIsland]||G).time,blocked};
}
function fishingBoatWorking(b){return b.conn&&!b.paused&&b.fire<=0&&(b.staffEff??1)>0&&(b.eff??1)>0&&b.status!=='Lager voll';}
function advanceFishingBoat(state,b,time){
 let dt=WORK_ART.reduced.matches?0:Math.max(0,Math.min(60,time-state.last));state.last=time;
 const working=fishingBoatWorking(b),speed=.7;
 if(!working&&state.phase==='outbound'){state.phase='return';state.wait=0;}
 if(!working&&state.phase==='fishing'){if(state.loop)state.wait=Math.min(state.wait,(state.loop.length-state.loopDistance%state.loop.length)/speed);else state.wait=0;}
 for(let transition=0;dt>1e-8&&transition<8;transition++){
  if(state.phase==='dock'||state.phase==='fishing'){
   if(state.phase==='dock'&&!working)break;
   const used=Math.min(dt,state.wait);if(state.phase==='fishing')state.loopDistance+=used*speed;dt-=used;state.wait-=used;if(state.wait>1e-8)break;
   state.phase=state.phase==='dock'?'outbound':'return';
  }else{
   const remaining=state.phase==='outbound'?state.length-state.distance:state.distance,used=Math.min(dt,remaining/speed);dt-=used;state.distance+=used*speed*(state.phase==='outbound'?1:-1);
   if(used+1e-8<remaining/speed)break;
   if(state.phase==='outbound'){state.distance=state.length;state.phase='fishing';state.loopDistance=0;state.wait=state.loop?state.loop.length/speed*(1+b.id%2):9+b.id%7;}
   else{state.distance=0;state.phase='dock';state.wait=7+b.id%5;}
  }
 }
 return state;
}
function fishingBoatPosition(state){
 if(state.phase==='fishing'&&state.loop){const distance=state.loopDistance%state.loop.length,p=smoothSeaSample(state.loop,distance),next=smoothSeaSample(state.loop,(distance+.15)%state.loop.length);return {x:p.x*16,y:p.y*16,dx:next.x-p.x,dy:next.y-p.y};}
 const p=smoothSeaSample({points:state.path,lengths:state.lengths,length:state.length},state.distance),next=smoothSeaSample({points:state.path,lengths:state.lengths,length:state.length},Math.max(0,Math.min(state.length,state.distance+(state.phase==='return'?-.15:.15))));
 return {x:p.x*16,y:p.y*16,dx:next.x-p.x||state.path[1][0]-state.path[0][0],dy:next.y-p.y||state.path[1][1]-state.path[0][1]};
}
function addFishingBoats(x0,y0,x1,y1){
 FISHING_BOATS.metrics.visible=0;if(UI.z<WORLD_DETAIL.people)return;let builds=0;
 for(const b of worldBuildings()){
  if(b.type!=='fischer'||b.x*16<x0-400||b.y*16<y0-400||b.x*16>x1+400||b.y*16>y1+400||WORLD.fog&&!WORLD.fog.islands[b.island??activeIsland])continue;
  const time=(WORLD.islands[b.island??activeIsland]||G).time;let state=FISHING_BOATS.states.get(b);
  if(state&&(state.board!==G.tiles||state.x!==b.x||state.y!==b.y||state.piers!==coastalPierPlans())){FISHING_BOATS.states.delete(b);state=null;}
  if(!state){const failed=FISHING_BOATS.failures.get(b);if(!fishingBoatWorking(b)||failed?.board===G.tiles&&failed.x===b.x&&failed.y===b.y&&time<failed.retry||builds>=1)continue;builds++;state=fishingBoatRoute(b);if(!state){FISHING_BOATS.failures.set(b,{board:G.tiles,x:b.x,y:b.y,retry:time+10});continue;}FISHING_BOATS.states.set(b,state);}
  advanceFishingBoat(state,b,time);
  const pos=fishingBoatPosition(state);if(pos.x<x0-16||pos.y<y0-16||pos.x>x1+16||pos.y>y1+16)continue;
  const frame=WORK_ART.reduced.matches?0:Math.floor(time*6+b.id)%AMBIENT_LIFE.boatFrames,name=ambientSprite('boat',pos.dx,pos.dy,frame);
  ENT.push([pos.y+4,7,name,Math.round(pos.x)-8,Math.round(pos.y)-12]);
  if(++FISHING_BOATS.metrics.visible>=FISHING_BOATS.maxVisible)break;
 }
}
const fishingStreetPeople=addStreetPeople;addStreetPeople=function(...args){fishingStreetPeople(...args);addFishingBoats(...args);};
