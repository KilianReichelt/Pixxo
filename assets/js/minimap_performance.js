/* Cache the exact final-size terrain picture, not a second world-sized canvas. */
const MINIMAP_BASE_CACHE={source:null,key:'',revision:0,image:null,metrics:{builds:0,reuses:0}};
function drawMinimapBase(ctx){
 if(!ctx.getTransform||!ctx.canvas||ctx.globalAlpha!==1||ctx.globalCompositeOperation!=='source-over'||ctx.filter&&ctx.filter!=='none')return nativeDrawImage.call(ctx,mmBase,0,0);
 const m=ctx.getTransform(),w=ctx.canvas.width,h=ctx.canvas.height;
 const key=[MINIMAP_BASE_CACHE.revision,w,h,m.a,m.b,m.c,m.d,m.e,m.f,ctx.imageSmoothingEnabled].join(':');
 if(MINIMAP_BASE_CACHE.source!==mmBase||MINIMAP_BASE_CACHE.key!==key){
  const image=MINIMAP_BASE_CACHE.image||document.createElement('canvas');image.width=w;image.height=h;
  const c=image.getContext('2d');c.imageSmoothingEnabled=ctx.imageSmoothingEnabled;c.setTransform(m.a,m.b,m.c,m.d,m.e,m.f);
  nativeDrawImage.call(c,mmBase,0,0);
  MINIMAP_BASE_CACHE.source=mmBase;MINIMAP_BASE_CACHE.key=key;MINIMAP_BASE_CACHE.image=image;MINIMAP_BASE_CACHE.metrics.builds++;
 }else MINIMAP_BASE_CACHE.metrics.reuses++;
 ctx.save();ctx.setTransform(1,0,0,1,0,0);try{return nativeDrawImage.call(ctx,MINIMAP_BASE_CACHE.image,0,0);}finally{ctx.restore();}
}
const minimapTerrainInvalidation=invalidateTerrainCells;
invalidateTerrainCells=function(...args){const result=minimapTerrainInvalidation.apply(this,args);MINIMAP_BASE_CACHE.revision++;return result;};
