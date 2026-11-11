/* Sorted entity pictures in world-aligned tiles: panning reuses interior tiles.
   Each tile includes every overlapping sprite, preserving depth at its edges. */
const OVERVIEW_LAYER={board:null,cache:new Map(),maxEntries:128,tileSize:512,scale:.25,maxWidth:2048,maxHeight:1536,metrics:{built:0,reused:0,bytes:0}};
function overviewEntityBounds(e){
 if(e[1]===0){const s=natureTreeSprite(e[2],e[3],e[4]),p=natureTreePose(e[2],e[3],s,e[4]);return {x:p.left,y:p.base-s.height,w:s.width,h:s.height};}
 const b=e[2];if(e[1]===1){const s=overviewBuildingVisual(b);return s?{x:b.x*16+b.w*8-s.width/2,y:(b.y+b.h)*16-s.height,w:s.width,h:s.height+(b.fire>0?16:0)}:null;}
 const plan=coastPierPlanFor(b);if(!plan?.cells.length)return null;const xs=plan.cells.map(c=>c[0]*16),ys=plan.cells.map(c=>c[1]*16);return {x:Math.min(...xs)-8,y:Math.min(...ys)-16,w:Math.max(...xs)-Math.min(...xs)+32,h:Math.max(...ys)-Math.min(...ys)+48};
}
function drawOverviewEntities(ctx,entities){
 if(entities.some(e=>![0,1,8].includes(e[1])))return false;
 if(OVERVIEW_LAYER.board!==G.tiles){OVERVIEW_LAYER.board=G.tiles;OVERVIEW_LAYER.cache.clear();OVERVIEW_LAYER.metrics.bytes=0;}
 const m=ctx.getTransform(),width=ctx.canvas.width,height=ctx.canvas.height;if(!width||!height||m.b||m.c||m.a<=0||m.d<=0)return false;
 // At minimum zoom the screen covers hundreds of small world tiles. Grow the
 // grid, keeping 128px raster tiles, so the visible set fits the bounded cache.
 let size=OVERVIEW_LAYER.tileSize;while((Math.ceil(width/m.a/size)+1)*(Math.ceil(height/m.d/size)+1)>96)size*=2;
 const scale=128/size;if(OVERVIEW_LAYER.gridSize!==size){OVERVIEW_LAYER.gridSize=size;OVERVIEW_LAYER.cache.clear();}
 const minX=Math.floor(-m.e/m.a/size),minY=Math.floor(-m.f/m.d/size),maxX=Math.floor((width-m.e)/m.a/size),maxY=Math.floor((height-m.f)/m.d/size),buckets=new Map();
 for(const e of entities){const r=overviewEntityBounds(e);if(!r)continue;
  let hash=2166136261;const mix=n=>{hash=Math.imul(hash^(Number(n)||0),16777619);};mix(e[1]);for(const n of [r.x,r.y,r.w,r.h])mix(n*4);
  if(e[1]===0){mix(e[2]);mix(e[3]);mix(e[4]?.slot);}else{const b=e[2];for(const n of [b.id,b.tier,b.rotation,b.visualVariant,b.fire>0])mix(n);for(let i=0;i<b.type.length;i++)mix(b.type.charCodeAt(i));}
  for(let y=Math.max(minY,Math.floor(r.y/size));y<=Math.min(maxY,Math.floor((r.y+r.h)/size));y++)for(let x=Math.max(minX,Math.floor(r.x/size));x<=Math.min(maxX,Math.floor((r.x+r.w)/size));x++){
   const key=x+':'+y;let bucket=buckets.get(key);if(!bucket){bucket={x,y,entities:[],hash:2166136261};buckets.set(key,bucket);}bucket.entities.push(e);bucket.hash=Math.imul(bucket.hash^hash,16777619);
  }
 }
 for(const [key,bucket]of buckets){let entry=OVERVIEW_LAYER.cache.get(key);
  if(!entry||entry.hash!==bucket.hash||entry.count!==bucket.entities.length||entry.revision!==lodArtRevision){
   const canvas=entry?.canvas||document.createElement('canvas');canvas.width=canvas.height=size*scale;const c=canvas.getContext('2d');c.setTransform(scale,0,0,scale,-bucket.x*size*scale,-bucket.y*size*scale);c.imageSmoothingEnabled=false;
   for(const e of bucket.entities){if(e[1]===0){const s=natureTreeSprite(e[2],e[3],e[4]);natureDrawTree(c,e[2],e[3],s,e[4]);}else if(e[1]===1)drawOverviewBuilding(c,e[2]);else drawCoastPier(c,e[2]);}
   entry={canvas,hash:bucket.hash,count:bucket.entities.length,revision:lodArtRevision};OVERVIEW_LAYER.metrics.built++;
  }else OVERVIEW_LAYER.metrics.reused++;
  OVERVIEW_LAYER.cache.delete(key);OVERVIEW_LAYER.cache.set(key,entry);nativeDrawImage.call(ctx,entry.canvas,bucket.x*size,bucket.y*size,size,size);
 }
 while(OVERVIEW_LAYER.cache.size>OVERVIEW_LAYER.maxEntries)OVERVIEW_LAYER.cache.delete(OVERVIEW_LAYER.cache.keys().next().value);
 OVERVIEW_LAYER.metrics.bytes=OVERVIEW_LAYER.cache.size*(size*scale)**2*4;return true;
}
