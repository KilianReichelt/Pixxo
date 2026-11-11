/* A position may be requested by hit feedback, wildlife, wakes and the fleet.
   Reuse it only during one render call; input/simulation always see fresh state. */
const SHIP_RENDER_POSITIONS={active:false,frame:0,entries:new WeakMap(),metrics:{hits:0,misses:0}};
// Drawing repeatedly asks for the same world-wide lists (once per deposit in
// particular). Keep their order and object identities for this synchronous
// render only; simulation and input continue to get fresh lists.
let renderWorldBuildings=null,renderWorldDeposits=null,drawingDeposits=null;
const uncachedWorldBuildings=worldBuildings,uncachedWorldDeposits=allDeposits;
worldBuildings=function(){if(!SHIP_RENDER_POSITIONS.active)return uncachedWorldBuildings();return renderWorldBuildings??=uncachedWorldBuildings();};
allDeposits=function(){if(drawingDeposits!==null)return drawingDeposits;if(!SHIP_RENDER_POSITIONS.active)return uncachedWorldDeposits();return renderWorldDeposits??=uncachedWorldDeposits();};
const renderShipPosition=freeShipPosition;
freeShipPosition=function(sh){
 if(!SHIP_RENDER_POSITIONS.active)return renderShipPosition(sh);
 const cached=SHIP_RENDER_POSITIONS.entries.get(sh);if(cached?.frame===SHIP_RENDER_POSITIONS.frame){SHIP_RENDER_POSITIONS.metrics.hits++;return cached.position;}
 const position=renderShipPosition(sh);SHIP_RENDER_POSITIONS.entries.set(sh,{frame:SHIP_RENDER_POSITIONS.frame,position});SHIP_RENDER_POSITIONS.metrics.misses++;return position;
};
const cachedPositionsRender=render;
render=function(...args){const previous={active:SHIP_RENDER_POSITIONS.active,buildings:renderWorldBuildings,deposits:renderWorldDeposits};SHIP_RENDER_POSITIONS.active=true;SHIP_RENDER_POSITIONS.frame++;renderWorldBuildings=renderWorldDeposits=null;try{return cachedPositionsRender(...args);}finally{SHIP_RENDER_POSITIONS.active=previous.active;renderWorldBuildings=previous.buildings;renderWorldDeposits=previous.deposits;}};

/* Keep diagonal road shapes at every zoom without repeating eight connectivity
   checks per tile and frame. Network rebuilds invalidate the board's mask map. */
const RENDER_ROAD_MASKS=new WeakMap();
function roadRenderMask(x,y){
 let masks=RENDER_ROAD_MASKS.get(G.road);if(!masks){masks=new Map();RENDER_ROAD_MASKS.set(G.road,masks);}const key=IDX(x,y);if(masks.has(key))return masks.get(key);
 const mask=LAND_STEPS.reduce((value,[dx,dy],i)=>value|(INMAP(x+dx,y+dy)&&G.road[IDX(x+dx,y+dy)]&&roadStepAllowed(x,y,x+dx,y+dy)?1<<i:0),0);
 masks.set(key,mask);if(masks.size>50000)masks.delete(masks.keys().next().value);return mask;
}
const roadMasksRebuild=rebuildNet;rebuildNet=function(...args){if(G?.road)RENDER_ROAD_MASKS.delete(G.road);return roadMasksRebuild(...args);};

// Deposit markers are world-wide. Avoid submitting markers wholly outside the
// raster, including their entrance sprite, resource badge and selection stroke.
// Unusual transforms/effects keep the original drawing path.
function depositRenderViewport(ctx){
 if(!ctx.getTransform||!ctx.canvas||ctx.filter&&ctx.filter!=='none'||ctx.globalCompositeOperation&&ctx.globalCompositeOperation!=='source-over'||ctx.shadowColor&&!['transparent','rgba(0, 0, 0, 0)'].includes(ctx.shadowColor))return null;
 const m=ctx.getTransform();if(m.b!==0||m.c!==0||![m.a,m.d,m.e,m.f].every(Number.isFinite)||!m.a||!m.d)return null;
 const x0=(-2-m.e)/m.a,x1=(ctx.canvas.width+2-m.e)/m.a,y0=(-2-m.f)/m.d,y1=(ctx.canvas.height+2-m.f)/m.d;
 return {x0:Math.min(x0,x1),x1:Math.max(x0,x1),y0:Math.min(y0,y1),y1:Math.max(y0,y1)};
}
const uncroppedDepositsDraw=drawDeposits;
drawDeposits=function(ctx,...args){
 const view=depositRenderViewport(ctx);if(!view)return uncroppedDepositsDraw(ctx,...args);
 let spriteW=16,spriteH=16;for(const side of ['left','right','back','front'])for(let frame=0;frame<=4;frame++){const sprite=SP['stollen_'+side+frame];if(sprite){spriteW=Math.max(spriteW,sprite.width);spriteH=Math.max(spriteH,sprite.height);}}
 const nodes=allDeposits().filter(node=>{
  // The original mine-preview loop also sets stroke state for offscreen nodes.
  // Keep selected-type nodes so later drawing inherits exactly that state.
  if(typeof UI!=='undefined'&&node.type===UI.type&&['build','move'].includes(UI.tool))return true;
  const d=B[node.type];if(!d)return true;
  const ax=node.anchor?.x??node.x,ay=node.anchor?.y??node.y;
  const x0=Math.min(node.x,ax)*16,y0=Math.min(node.y*16,ay*16-3),x1=Math.max((node.x+d.w)*16,(ax+Math.max(d.w,1))*16+spriteW),y1=Math.max((node.y+d.h)*16,(ay+Math.max(d.h,1))*16+spriteH);
  return x1>=view.x0&&x0<=view.x1&&y1>=view.y0&&y0<=view.y1;
 });
 const previous=drawingDeposits;drawingDeposits=nodes;try{return uncroppedDepositsDraw(ctx,...args);}finally{drawingDeposits=previous;}
};

