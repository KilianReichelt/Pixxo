/* Four stable detail bands, bounded caches, one world draw per frame. */
const DETAIL_LOD={thresholds:[.45,.72,1.1],hysteresis:.035,level:3,zoom:null,cache:new Map(),bytes:0,maxBytes:8*1024*1024,maxEntries:192,metrics:{hits:0,misses:0,changes:0}};
let lodArtRevision=0;const lodArtPublish=publishPixel;
publishPixel=function(...args){const result=lodArtPublish(...args);lodArtRevision++;return result;};
const LOD_OVERVIEW_BUILDINGS=new WeakMap();
function overviewBuildingVisual(b){
 let cached=LOD_OVERVIEW_BUILDINGS.get(b);
 if(!cached||cached.revision!==lodArtRevision||cached.type!==b.type||cached.tier!==b.tier||cached.rotation!==b.rotation||cached.variant!==b.visualVariant||cached.w!==b.w||cached.h!==b.h||SP[cached.name]!==cached.sprite){
  const name=typeof placementPreviewSprite==='function'?placementPreviewSprite(b):workshopSprite(b),sprite=SP[name];if(!sprite)return null;
  cached={name,sprite,width:sprite.width,height:SPB[name]?.H||sprite.height,low:lodPixelSource(sprite,0),revision:lodArtRevision,type:b.type,tier:b.tier,rotation:b.rotation,variant:b.visualVariant,w:b.w,h:b.h};LOD_OVERVIEW_BUILDINGS.set(b,cached);
 }
 return cached;
}
function drawOverviewBuilding(ctx,b){
 const cached=overviewBuildingVisual(b);if(!cached)return;
 const x=b.x*16+b.w*8-cached.width/2,y=(b.y+b.h)*16-cached.height;
 nativeDrawImage.call(ctx,cached.low||cached.sprite,x,y,cached.width,cached.height);DETAIL_LOD.metrics.overviewDraws=(DETAIL_LOD.metrics.overviewDraws||0)+1;
 if(b.fire>0&&SP.fire0)nativeDrawImage.call(ctx,SP.fire0,b.x*16+b.w*8-8,(b.y+b.h)*16-22,16,16);
}
function worldDetailLevel(){const z=UI.z;if(DETAIL_LOD.zoom===z)return DETAIL_LOD.level;DETAIL_LOD.zoom=z;let level=DETAIL_LOD.level;while(level<3&&z>DETAIL_LOD.thresholds[level]+DETAIL_LOD.hysteresis)level++;while(level>0&&z<DETAIL_LOD.thresholds[level-1]-DETAIL_LOD.hysteresis)level--;if(level!==DETAIL_LOD.level){DETAIL_LOD.metrics.changes++;DETAIL_LOD.transition=WORK_ART.reduced.matches?null:{from:DETAIL_LOD.level,start:performance.now(),duration:120};}return DETAIL_LOD.level=level;}
worldOverview=function(){return worldDetailLevel()===0;};
function lodPixelSource(source,level){const pixel=PERF_PIXEL_IMAGES.get(source)||HD_CATALOG.get(source)?.pixelSource||source;if(!pixel?.width||!pixel.height)return null;if(level>=3)return pixel;let entries=DETAIL_LOD.cache.get(pixel);const old=entries?.get(level);if(old){DETAIL_LOD.metrics.hits++;DETAIL_LOD.cache.delete(pixel);DETAIL_LOD.cache.set(pixel,entries);return old;}DETAIL_LOD.metrics.misses++;const divisor=level===2?2:level===1?3:4,canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.ceil(pixel.width/divisor));canvas.height=Math.max(1,Math.ceil(pixel.height/divisor));const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;nativeDrawImage.call(c,pixel,0,0,canvas.width,canvas.height);if(!entries){entries=new Map();DETAIL_LOD.cache.set(pixel,entries);}entries.set(level,canvas);DETAIL_LOD.bytes+=canvas.width*canvas.height*4;while(DETAIL_LOD.bytes>DETAIL_LOD.maxBytes||DETAIL_LOD.cache.size>DETAIL_LOD.maxEntries){const key=DETAIL_LOD.cache.keys().next().value;for(const entry of DETAIL_LOD.cache.get(key).values())DETAIL_LOD.bytes-=entry.width*entry.height*4;DETAIL_LOD.cache.delete(key);}return canvas;}
const lodCanvasImage=CanvasRenderingContext2D.prototype.drawImage;
CanvasRenderingContext2D.prototype.drawImage=function(source,...args){const level=this._detailLOD;if(level===undefined||args.length===8)return lodCanvasImage.call(this,source,...args);if(level>=3){const t=DETAIL_LOD.transition,blend=t?clamp((performance.now()-t.start)/t.duration,0,1):1;if(t&&blend<1&&t.from<3){const old=lodPixelSource(source,t.from),target=args.length===2?[...args,source.width,source.height]:args,alpha=this.globalAlpha;if(old)nativeDrawImage.call(this,old,...target);this.globalAlpha=alpha*blend;try{return lodCanvasImage.call(this,source,...args);}finally{this.globalAlpha=alpha;}}return lodCanvasImage.call(this,source,...args);}const low=lodPixelSource(source,level);if(!low)return lodCanvasImage.call(this,source,...args);if(args.length===2)args.push(source.width,source.height);const transition=DETAIL_LOD.transition,blend=transition?clamp((performance.now()-transition.start)/transition.duration,0,1):1;if(transition&&blend<1&&transition.from!==level){const previous=lodPixelSource(source,transition.from),alpha=this.globalAlpha;if(previous)nativeDrawImage.call(this,previous,...args);else lodCanvasImage.call(this,source,...args);this.globalAlpha=alpha*blend;try{return nativeDrawImage.call(this,low,...args);}finally{this.globalAlpha=alpha;}}return nativeDrawImage.call(this,low,...args);};
const lodWorkshop=workshopSprite;workshopSprite=function(b){if(worldDetailLevel()>=2)return lodWorkshop(b);return b.type==='haus'?houseVariantSprite(b):rotatedSprite(typeSprite(b.type,b.tier),b.type==='gehege'?b.rotation||0:0);};
drawBld=function(ctx,b){const level=worldDetailLevel();if(level===0)return drawOverviewBuilding(ctx,b);const previous=ctx._detailLOD;ctx._detailLOD=level;try{return zoomDrawBld(ctx,b);}finally{ctx._detailLOD=previous;}};
/* The lowest band now keeps original silhouettes/textures through its cached
   reduced sources. Overview still limits actors and effects, not building art. */
const lodPeople=addStreetPeople;addStreetPeople=function(...args){if(worldDetailLevel()>=2)return lodPeople(...args);};
const lodFieldWorkers=drawFieldWorkers;drawFieldWorkers=function(...args){if(worldDetailLevel()>=3)return lodFieldWorkers(...args);};
