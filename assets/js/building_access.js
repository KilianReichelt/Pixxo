/* Visual access spurs reuse road imagery; they never add traversable cells. */
const BUILDING_ACCESS_CACHE=new WeakMap();let buildingAccessRevision=0;
const accessRebuildNet=rebuildNet;rebuildNet=function(...args){try{return accessRebuildNet.apply(this,args);}finally{buildingAccessRevision++;}};
function buildingRoadAccess(b,state=G){
 const d=B[b.type];if(!d||!b.conn||b.type==='ruine'||d.requiresRoad===false||['field','decor'].includes(d.kind))return null;
 const old=BUILDING_ACCESS_CACHE.get(b);if(!state.dirty&&old?.state===state&&old.roads===state.road&&old.dist===state.dist&&old.revision===buildingAccessRevision&&old.type===b.type&&old.x===b.x&&old.y===b.y&&old.w===b.w&&old.h===b.h&&(!old.access||old.material===state.road[old.access.cell]))return old.access;
 const roads=state.road,candidates=[];
 for(const [x,y]of ringCells(b)){
  if(!INMAP(x,y))continue;const k=IDX(x,y);if(!roads[k]||state.bridges?.[k]||state.dist&&state.dist[k]<0)continue;
  if(state.tiles&&state.tiles[k]<=T.SHAL)continue;
  const side=y===b.y+b.h?'south':x===b.x-1?'west':x===b.x+b.w?'east':'north',horizontal=side==='west'||side==='east';
  const offset=horizontal?Math.abs(y+.5-(b.y+b.h/2)):Math.abs(x+.5-(b.x+b.w/2)),priority=side==='south'?0:side==='north'?2:1;
  candidates.push({k,x,y,side,score:priority*100+offset});
 }
 candidates.sort((a,b)=>a.score-b.score||a.k-b.k);const site=candidates[0];if(!site){BUILDING_ACCESS_CACHE.set(b,{state,roads:state.road,dist:state.dist,revision:buildingAccessRevision,type:b.type,x:b.x,y:b.y,w:b.w,h:b.h,access:null});return null;}
 const a=[site.x*16+8,site.y*16+8],z=a.slice();
 if(site.side==='south')z[1]=(b.y+b.h)*16-8;else if(site.side==='north')z[1]=b.y*16+8;
 else if(site.side==='west')z[0]=b.x*16+8;else z[0]=(b.x+b.w)*16-8;
 const access={building:b,cell:site.k,side:site.side,a,b:z,stone:roads[site.k]===2,horizontal:a[1]===z[1]};
 BUILDING_ACCESS_CACHE.set(b,{state,roads:state.road,dist:state.dist,revision:buildingAccessRevision,type:b.type,x:b.x,y:b.y,w:b.w,h:b.h,material:roads[site.k],access});return access;
}
function drawBuildingRoadConnections(ctx,x0,y0,x1,y1){
 for(const b of worldBuildings()){
  if(b.x*16>x1+16||(b.x+b.w)*16<x0-16||b.y*16>y1+16||(b.y+b.h)*16<y0-16)continue;
  const access=buildingRoadAccess(b);if(!access)continue;
  if(globalThis.RoadImageReview?.drawBuildingAccess?.(ctx,access))continue;
  // Original-art fallback uses the existing straight road source, clipped to
  // a single narrow path. It never invokes bridge or network mutation code.
  const left=Math.min(access.a[0],access.b[0])-4,top=Math.min(access.a[1],access.b[1])-4,right=Math.max(access.a[0],access.b[0])+4,bottom=Math.max(access.a[1],access.b[1])+4;
  ctx.save();ctx.beginPath();ctx.rect(left,top,right-left,bottom-top);ctx.clip();
  for(let y=Math.floor(top/16);y<=Math.floor((bottom-1)/16);y++)for(let x=Math.floor(left/16);x<=Math.floor((right-1)/16);x++)ctx.drawImage(diagonalRoadSprite(access.horizontal?10:5,access.stone,x,y),x*16,y*16,16,16);
  ctx.restore();
 }
}
