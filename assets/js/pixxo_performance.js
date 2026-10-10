/* Kosten der großen Karte auf sichtbare Bereiche und tatsächliche Änderungen begrenzen. */
const PERF_FOG={cells:null,chunks:new Map(),mini:null,miniDirty:true,signature:'',revision:0,metrics:{chunkPixels:0,miniPixels:0}},FOG_CHUNK_SIZE=64,FOG_CHUNK_LIMIT=96;
const PERF_ROADS=new WeakMap();
function minimapRoadCells(roads){
 let cells=PERF_ROADS.get(roads);if(!cells){cells=new Set();for(let k=0;k<roads.length;k++)if(roads[k])cells.add(k);PERF_ROADS.set(roads,cells);}return cells;
}
function fogCacheState(){
 if(!WORLD?.fog)return false;
 const signature=MAPW+':'+MAPH+':'+WORLD.fog.islands.join('');
 if(PERF_FOG.cells!==WORLD.fog.cells||PERF_FOG.signature!==signature){
  PERF_FOG.cells=WORLD.fog.cells;PERF_FOG.signature=signature;PERF_FOG.chunks.clear();PERF_FOG.mini=null;PERF_FOG.miniDirty=true;
 }
 return true;
}
function fogFading(owner){
 if(owner<0||!WORLD.fog.islands[owner])return null;
 const start=fogFades.get(owner);if(start===undefined)return 0;
 const fade=Math.max(0,1-(UI.vt-start)/1.4);if(!fade)fogFades.delete(owner);return fade;
}
function fogAlpha(x,y){
 const k=y*MAPW+x,owner=islandOwners[k],fading=fogFading(owner);let a=fading===null?1-WORLD.fog.cells[k]/255:fading;
 const edge=Math.min(x,y,MAPW-1-x,MAPH-1-y);if(edge<12)return 1;if(edge<20)a=Math.max(a,(20-edge)/8);return a;
}
function fogChunk(cx,cy){
 const key=cx+':'+cy,phase=fogFades.size?Math.floor(UI.vt*12):-1,old=PERF_FOG.chunks.get(key);
 if(old&&old.phase===phase){PERF_FOG.chunks.delete(key);PERF_FOG.chunks.set(key,old);return old.canvas;}
 const left=cx*FOG_CHUNK_SIZE,top=cy*FOG_CHUNK_SIZE,w=Math.min(FOG_CHUNK_SIZE,MAPW-left),h=Math.min(FOG_CHUNK_SIZE,MAPH-top);
 const canvas=old?.canvas||document.createElement('canvas');canvas.width=w;canvas.height=h;
 const c=canvas.getContext('2d'),image=c.createImageData(w,h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const wx=left+x,wy=top+y,p=(y*w+x)*4,col=186+Math.floor(hs(wx,wy,31)*10)+Math.round(Math.sin((wx+wy)/29)*3);
  image.data[p]=col;image.data[p+1]=col+10;image.data[p+2]=col+16;image.data[p+3]=Math.round(fogAlpha(wx,wy)*255);
 }
 c.putImageData(image,0,0);PERF_FOG.metrics.chunkPixels+=w*h;PERF_FOG.chunks.set(key,{canvas,phase});
 while(PERF_FOG.chunks.size>FOG_CHUNK_LIMIT)PERF_FOG.chunks.delete(PERF_FOG.chunks.keys().next().value);return canvas;
}
prepareFog=function(){
 if(!fogCacheState())return null;
 const w=Math.ceil(MAPW/8),h=Math.ceil(MAPH/8);
 if(!PERF_FOG.mini){PERF_FOG.mini=document.createElement('canvas');PERF_FOG.mini.width=w;PERF_FOG.mini.height=h;PERF_FOG.miniDirty=true;}
 if(!PERF_FOG.miniDirty&&!fogFades.size)return PERF_FOG.mini;
 const c=PERF_FOG.mini.getContext('2d'),image=c.createImageData(w,h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const wx=Math.min(MAPW-1,x*8+4),wy=Math.min(MAPH-1,y*8+4),p=(y*w+x)*4;image.data[p]=190;image.data[p+1]=200;image.data[p+2]=206;image.data[p+3]=Math.round(fogAlpha(wx,wy)*255);}
 c.putImageData(image,0,0);PERF_FOG.metrics.miniPixels+=w*h;PERF_FOG.miniDirty=false;fogDirty=false;return PERF_FOG.mini;
};
drawWorldFog=function(c,x0,y0,x1,y1){
 if(!fogCacheState())return;
 const unit=FOG_CHUNK_SIZE*16,cx0=Math.max(0,Math.floor(x0/unit)),cy0=Math.max(0,Math.floor(y0/unit)),cx1=Math.min(Math.ceil(MAPW/FOG_CHUNK_SIZE)-1,Math.floor(x1/unit)),cy1=Math.min(Math.ceil(MAPH/FOG_CHUNK_SIZE)-1,Math.floor(y1/unit));
 for(let cy=cy0;cy<=cy1;cy++)for(let cx=cx0;cx<=cx1;cx++){const canvas=fogChunk(cx,cy);nativeDrawImage.call(c,canvas,cx*unit,cy*unit,canvas.width*16,canvas.height*16);}
 c.fillStyle=nightFogEdgeColor();if(x0<0)c.fillRect(x0,y0,-x0,y1-y0);if(y0<0)c.fillRect(0,y0,MAPW*16,-y0);if(x1>MAPW*16)c.fillRect(MAPW*16,y0,x1-MAPW*16,y1-y0);if(y1>MAPH*16)c.fillRect(0,MAPH*16,MAPW*16,y1-MAPH*16);
};
function invalidateTerrainCells(x,y,w=1,h=1){
 if(land?._tiles!==G.tiles)return;
 for(let cy=Math.floor((y-1)/LAND_CHUNK);cy<=Math.floor((y+h)/LAND_CHUNK);cy++)for(let cx=Math.floor((x-1)/LAND_CHUNK);cx<=Math.floor((x+w)/LAND_CHUNK);cx++)land.chunks.delete(cx+':'+cy);
 if(mmBase){const c=mmBase.getContext('2d'),colors=['#1f4f86','#3d83c0','#d8c27a','#5a9a3c','#2f6a2a','#7a8190','#a0603c'];for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(INMAP(xx,yy)){c.fillStyle=colors[G.tiles[IDX(xx,yy)]];c.fillRect(xx,yy,1,1);}}
}
const performancePlaceRoad=placeRoad;placeRoad=function(x,y){const result=performancePlaceRoad(x,y);if(result){PERF_ROADS.get(G.road)?.add(IDX(x,y));invalidateTerrainCells(x,y);}return result;};
const performanceDemolish=demolishAt;demolishAt=function(x,y){const roads=G.road,k=INMAP(x,y)?IDX(x,y):-1,result=performanceDemolish(x,y);if(k>=0&&!roads[k])PERF_ROADS.get(roads)?.delete(k);return result;};
const performancePlace=place;place=function(type,x,y){const result=performancePlace(type,x,y);if(result.ok){invalidateTerrainCells(x,y,result.b?.w||B[type].w,result.b?.h||B[type].h);}return result;};
/* Kleine Zeichenquellen direkt verwenden statt vervielfachter Zwischenbilder. */
CanvasRenderingContext2D.prototype.drawImage=function(source,...args){

 const hd=HD_IMAGES.get(source);if(!hd)return nativeDrawImage.call(this,source,...args);
 const pixel=PERF_PIXEL_IMAGES.get(source);
 if(pixel){if(args.length===2)args.push(source.width,source.height);else if(args.length===8){args[0]*=pixel.width/source.width;args[1]*=pixel.height/source.height;args[2]*=pixel.width/source.width;args[3]*=pixel.height/source.height;}return nativeDrawImage.call(this,pixel,...args);}
 if(args.length===2)args.push(source.width,source.height);else if(args.length===8)for(let i=0;i<4;i++)args[i]*=ART_DENSITY;return nativeDrawImage.call(this,hd,...args);
};
const PERF_PIXEL_IMAGES=new WeakMap(),performancePublishPixel=publishPixel;
publishPixel=function(name,low,w,h,meta){const small=performancePublishPixel(name,low,w,h,meta);PERF_PIXEL_IMAGES.set(small,low);return small;};
for(const entry of HD_CATALOG.values())if(entry.pixelSource)PERF_PIXEL_IMAGES.set(entry.small,entry.pixelSource);
HD_BUILD_CACHE.clear();

/* Muster und Drehungen verwenden ebenfalls direkt das kleine Pixelraster. */
CanvasRenderingContext2D.prototype.createPattern=function(source,repetition){
 const low=PERF_PIXEL_IMAGES.get(source),pattern=nativeCreatePattern.call(this,low||source,repetition);
 if(low&&pattern)pattern.setTransform(new DOMMatrix().scale(source.width/low.width,source.height/low.height));return pattern;
};
const performanceRotatedSprite=rotatedSprite;
rotatedSprite=function(name,rotation=0){
 rotation=(rotation+4)%4;const entry=HD_CATALOG.get(name);if(!rotation||!entry?.pixelSource)return performanceRotatedSprite(name,rotation);
 const key=name+'_rotation'+rotation;if(SP[key])return key;
 const source=entry.pixelSource,low=document.createElement('canvas');low.width=rotation%2?source.height:source.width;low.height=rotation%2?source.width:source.height;
 const c=low.getContext('2d');c.imageSmoothingEnabled=false;c.translate(low.width/2,low.height/2);c.rotate(rotation*Math.PI/2);nativeDrawImage.call(c,source,-source.width/2,-source.height/2);
 if(source._nightWindows)low._nightWindows=source._nightWindows.map(p=>rotation===1?{...p,x:source.height-p.y-p.h,y:p.x,w:p.h,h:p.w}:rotation===2?{...p,x:source.width-p.x-p.w,y:source.height-p.y-p.h}:{...p,x:p.y,y:source.width-p.x-p.w,w:p.h,h:p.w});
 publishPixel(key,low,rotation%2?entry.h:entry.w,rotation%2?entry.w:entry.h,{...SPB[name],hub:null,smoke:null});return key;
};



/* Die Wegsuche beendet sich an der tatsächlichen Transportreichweite. */
deliveryPath=function(a,b){
 const range=def(a).transportRange||Infinity,key=[a.id,a.x,a.y,a.w,a.h,b.id,b.x,b.y,b.w,b.h,range].join(':');
 G.deliveryPaths??=new Map();if(G.deliveryPaths.has(key))return G.deliveryPaths.get(key);
 const gapX=Math.max(0,a.x-b.x-b.w,b.x-a.x-a.w),gapY=Math.max(0,a.y-b.y-b.h,b.y-a.y-a.h);
 if(gapX+gapY>range+2){G.deliveryPaths.set(key,null);return null;}
 const ends=new Set(ringCells(b).filter(([x,y])=>INMAP(x,y)&&G.road[IDX(x,y)]).map(([x,y])=>IDX(x,y))),queue=[],prev=new Map(),depth=new Map();
 for(const [x,y] of ringCells(a))if(INMAP(x,y)&&G.road[IDX(x,y)]){const k=IDX(x,y);if(!prev.has(k)){prev.set(k,-1);depth.set(k,0);queue.push(k);}}
 let end=-1;
 for(let i=0;i<queue.length;i++){
  const k=queue[i],d=depth.get(k);if(ends.has(k)){end=k;break;}if(d>=range)continue;
  const x=k%MAPW,y=Math.floor(k/MAPW);
  for(const [nx,ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]])if(INMAP(nx,ny)){const n=IDX(nx,ny);if(G.road[n]&&!prev.has(n)){prev.set(n,k);depth.set(n,d+1);queue.push(n);}}
 }
 let path=null;if(end>=0){path=[];for(let k=end;k>=0;k=prev.get(k))path.push(k);path.reverse();}
 G.deliveryPaths.set(key,path);return path;
};

/* Nebel-Speicherung komprimiert nur tatsächlich veränderte Zeilen erneut. */
const PERF_FOG_SAVE=new WeakMap(),performancePackFog=packFogCells;
function invalidateFogRows(cells,y0,y1){const cache=PERF_FOG_SAVE.get(cells);if(cache)for(let y=Math.max(0,Math.floor(y0));y<=Math.min(MAPH-1,Math.ceil(y1));y++)cache.dirty.add(y);}
packFogCells=function(cells){
 if(cells.length!==MAPW*MAPH)return performancePackFog(cells);
 let cache=PERF_FOG_SAVE.get(cells);
 if(!cache){cache={width:MAPW,rows:[],dirty:new Set(Array.from({length:MAPH},(_,i)=>i)),packed:null};PERF_FOG_SAVE.set(cells,cache);}
 if(!cache.dirty.size&&cache.packed)return cache.packed;
 for(const y of cache.dirty){const start=y*MAPW,runs=[];let value=cells[start],count=0;for(let x=0;x<MAPW;x++){const next=cells[start+x];if(next===value)count++;else{runs.push(count,value);count=1;value=next;}}runs.push(count,value);cache.rows[y]=runs;}
 cache.dirty.clear();const runs=[];
 for(const row of cache.rows)for(let i=0;i<row.length;i+=2){if(runs.length&&runs[runs.length-1]===row[i+1])runs[runs.length-2]+=row[i];else runs.push(row[i],row[i+1]);}
 cache.packed={encoding:'rle',length:cells.length,runs};return cache.packed;
};
revealSea=function(x,y,r=30){
 if(!WORLD?.fog)return;const cells=WORLD.fog.cells;let changed=false;
 for(let cy=Math.max(0,Math.floor(y-r));cy<Math.min(FOG_H,Math.ceil(y+r));cy++)for(let cx=Math.max(0,Math.floor(x-r));cx<Math.min(FOG_W,Math.ceil(x+r));cx++){
  const d=Math.hypot(cx+.5-x,cy+.5-y),value=Math.round(clamp((r-d)/7,0,1)*255),k=cy*FOG_W+cx;
  if(value>cells[k]){cells[k]=value;changed=true;}
 }
 if(!changed)return;fogDirty=true;invalidateFogRows(cells,y-r,y+r);if(!fogCacheState())return;PERF_FOG.miniDirty=true;PERF_FOG.revision++;
 for(let cy=Math.max(0,Math.floor((y-r)/FOG_CHUNK_SIZE));cy<=Math.min(Math.ceil(MAPH/FOG_CHUNK_SIZE)-1,Math.floor((y+r)/FOG_CHUNK_SIZE));cy++)
 for(let cx=Math.max(0,Math.floor((x-r)/FOG_CHUNK_SIZE));cx<=Math.min(Math.ceil(MAPW/FOG_CHUNK_SIZE)-1,Math.floor((x+r)/FOG_CHUNK_SIZE));cx++)PERF_FOG.chunks.delete(cx+':'+cy);
};
/* Simulation mit 20 Takten, Weltzeichnen höchstens 60-mal pro Sekunde.
   Auf schnellen Displays keine identischen Weltbilder unnötig neu zeichnen. */
let simulationAccumulator=0,lastWorldRender=-Infinity;
frame=function(now){
 if(document.hidden){lastT=now;simulationAccumulator=0;requestAnimationFrame(frame);return;}
 const dt=clamp((now-lastT)/1000,0,.1);lastT=now;UI.vt+=dt;
 if(G.speed>0){simulationAccumulator+=dt;while(simulationAccumulator>=.05){let remaining=.05*G.speed;while(remaining>0){const tick=Math.min(remaining,.2);stepWorld(tick);remaining-=tick;}simulationAccumulator-=.05;}}else simulationAccumulator=0;
 clampCam();if(now-lastWorldRender>=1000/60-.5){render();lastWorldRender=now;}uiAcc+=dt;mmAcc+=dt;
 if(mmAcc>.2){mmAcc=0;drawMini();if(UI.tool)updateHint();}
 if(uiAcc>.5){uiAcc=0;renderTop();refreshWins();renderItems();}
 requestAnimationFrame(frame);
};

