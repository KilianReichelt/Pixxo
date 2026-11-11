/* Visual ridges only: no projection, terrain edits or resource reservation. */
const MOUNTAIN_TERRACES=new WeakMap();
function mountainVisualSeed(){return (typeof WORLD!=='undefined'&&WORLD?.rootSeed)||G.seed||1;}
function mountainVisualHash(x,y,seed){let n=Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(seed,1442695041);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;}
// Interpolated coarse fields create shared ridges across tiles, never pixel noise.
function mountainVisualNoise(x,y,seed){const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,s=fx*fx*(3-2*fx),t=fy*fy*(3-2*fy),a=mountainVisualHash(ix,iy,seed),b=mountainVisualHash(ix+1,iy,seed),c=mountainVisualHash(ix,iy+1,seed),d=mountainVisualHash(ix+1,iy+1,seed);return a+(b-a)*s+(c-a)*t+(a-b-c+d)*s*t;}
function rockCornerBevel(x,y,dx,dy,g=G){
 const rock=(a,b)=>INMAP(a,b)&&[T.ROCK,T.ORE].includes(g.tiles[IDX(a,b)]);
 return rock(x,y)&&INMAP(x+dx,y)&&INMAP(x,y+dy)&&BUILDABLE(g.tiles[IDX(x+dx,y)])&&BUILDABLE(g.tiles[IDX(x,y+dy)]);
}
// 6-px-Eckschnitte lassen selbst Einzelkacheln vier Pixel gerade Kante.
const TERRAIN_CORNER_CUT=6;
function traceTerrainCorners(ctx,px,py,nw,ne,se,sw){
 ctx.moveTo(px+nw,py);ctx.lineTo(px+16-ne,py);ctx.lineTo(px+16,py+ne);ctx.lineTo(px+16,py+16-se);ctx.lineTo(px+16-se,py+16);ctx.lineTo(px+sw,py+16);ctx.lineTo(px,py+16-sw);ctx.lineTo(px,py+nw);ctx.closePath();
}
function clipTerrainCorners(ctx,px,py,nw,ne,se,sw){
 ctx.beginPath();traceTerrainCorners(ctx,px,py,nw,ne,se,sw);ctx.clip();
}
function islandCornerBevel(x,y,dx,dy,g=G){
 const water=(a,b)=>!INMAP(a,b)||g.tiles[IDX(a,b)]<=T.SHAL;
 return INMAP(x,y)&&g.tiles[IDX(x,y)]>T.SHAL&&water(x+dx,y)&&water(x,y+dy);
}
function clipIslandTile(ctx,x,y,px,py){
 const cut=(dx,dy)=>islandCornerBevel(x,y,dx,dy)?TERRAIN_CORNER_CUT:0;
 clipTerrainCorners(ctx,px,py,cut(-1,-1),cut(1,-1),cut(1,1),cut(-1,1));
}
function clipRockTile(ctx,x,y,px,py){
 const cut=(dx,dy)=>{
  if(!rockCornerBevel(x,y,dx,dy))return 0;
  // Existing permitted corner roads retain their original clearance.
  if(G.road&&(G.road[IDX(x+dx,y)]||G.road[IDX(x,y+dy)]))return TERRAIN_CORNER_CUT;
  return 2+Math.floor(mountainVisualHash(x*2+dx,y*2+dy,mountainVisualSeed()+71)*5);
 };
 const nw=cut(-1,-1),ne=cut(1,-1),se=cut(1,1),sw=cut(-1,1);
 const rock=(a,b)=>INMAP(a,b)&&[T.ROCK,T.ORE].includes(G.tiles[IDX(a,b)]),seed=mountainVisualSeed();
 // Only already exposed edges recede into their own cell. The unchanged
 // corner diagonals retain the established six-pixel road clearance.
 const edge=(side,start,end,exposed)=>{
  const point=(u,v)=>side===0?[u,v]:side===1?[16-v,u]:side===2?[16-u,16-v]:[v,16-u];
  if(exposed&&end-start>=4){
   const depth=1+Math.floor(mountainVisualHash(x*4+side,y,seed+149)*4),other=1+Math.floor(mountainVisualHash(x,y*4+side,seed+151)*4);
   for(const [u,v] of [[Math.round(start+(end-start)*.3),depth],[Math.round(start+(end-start)*.7),other]]){const [a,b]=point(u,v);ctx.lineTo(px+a,py+b);}
  }
  const [a,b]=point(end,0);ctx.lineTo(px+a,py+b);
 };
 ctx.beginPath();ctx.moveTo(px+nw,py);
 edge(0,nw,16-ne,!rock(x,y-1));ctx.lineTo(px+16,py+ne);
 edge(1,ne,16-se,!rock(x+1,y));ctx.lineTo(px+16-se,py+16);
 edge(2,se,16-sw,!rock(x,y+1));ctx.lineTo(px,py+16-sw);
 edge(3,sw,16-nw,!rock(x-1,y));ctx.closePath();ctx.clip();
}
function mountainTerraceField(island,tiles=G.tiles){
 let islands=MOUNTAIN_TERRACES.get(tiles);if(!islands){islands=new Map();MOUNTAIN_TERRACES.set(tiles,islands);}
 if(islands.has(island))return islands.get(island);
 const meta=ISLANDS[island],size=ISLAND_SIZE,depth=new Uint16Array(size*size),queue=[];
 const rock=(x,y)=>x>=0&&y>=0&&x<size&&y<size&&INMAP(meta.ox+x,meta.oy+y)&&[T.ROCK,T.ORE].includes(tiles[IDX(meta.ox+x,meta.oy+y)]);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(rock(x,y)){
  if(LAND_STEPS.some(([dx,dy])=>!rock(x+dx,y+dy))){depth[y*size+x]=1;queue.push(y*size+x);}
 }
 for(let i=0;i<queue.length;i++){const k=queue[i],x=k%size,y=Math.floor(k/size);for(const [dx,dy] of LAND_STEPS){const nx=x+dx,ny=y+dy;if(!rock(nx,ny))continue;const n=ny*size+nx;if(!depth[n]){depth[n]=depth[k]+1;queue.push(n);}}}
 const seed=mountainVisualSeed(),heights=new Uint8Array(depth.length),facets=new Uint8Array(depth.length);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const k=y*size+x,d=depth[k];if(!d)continue;
  const wx=meta.ox+x,wy=meta.oy+y;
  const bend=(mountainVisualNoise(wx/13,wy/13,seed+73)-.5)*5;
  const ridge=1-Math.abs(mountainVisualNoise((wx+bend)/8,(wy-bend)/11,seed+79)*2-1);
  const shoulder=mountainVisualNoise(wx/5,wy/7,seed+83);
  // Depth only tapers the boundary; no evenly spaced erosion rings.
  const relief=1+ridge*3.8+shoulder*2.5;
  heights[k]=Math.max(1,Math.min(7,Math.round(1+(relief-1)*Math.min(1,d/(2.2+shoulder*2)))));
  facets[k]=Math.floor(mountainVisualNoise(wx/4,wy/5,seed+89)*4);
 }
 const field={heights,facets,size,x:meta.ox,y:meta.oy,max:heights.reduce((a,b)=>Math.max(a,b),0)};
 islands.set(island,field);return field;
}
function mountainTerraceHeight(x,y,tiles=G.tiles){
 if(!INMAP(x,y))return 0;const island=islandAt(x,y);if(island<0)return 0;
 const f=mountainTerraceField(island,tiles),xx=x-f.x,yy=y-f.y;
 return xx<0||yy<0||xx>=f.size||yy>=f.size?0:f.heights[yy*f.size+xx];
}
// Kept as a rendering hook; outer cells now receive the same continuous mesh
// as the interior. No separate tile-sized chips or perimeter stripes.
function drawMountainOuterFace(ctx,x,y,px,py){}
function mountainVisualVertex(gx,gy,seed){
 const x=gx*40+(mountainVisualHash(gx,gy,seed+113)-.5)*8,y=gy*40+(mountainVisualHash(gx,gy,seed+127)-.5)*8;
 const ridge=1-Math.abs(mountainVisualNoise(x/145,y/175,seed+79)*2-1),shoulder=mountainVisualNoise(x/82,y/110,seed+83);
 return [x,y,(ridge*.7+shoulder*.3)*120];
}
const MOUNTAIN_VISUAL_MESH={seed:null,cells:new Map(),limit:4096};
function mountainVisualMeshCell(i,j,seed){
 const cache=MOUNTAIN_VISUAL_MESH;
 if(cache.seed!==seed){cache.cells.clear();cache.seed=seed;}
 const key=i+':'+j;let faces=cache.cells.get(key);if(faces)return faces;
 const a=mountainVisualVertex(i,j,seed),b=mountainVisualVertex(i+1,j,seed),c=mountainVisualVertex(i+1,j+1,seed),d=mountainVisualVertex(i,j+1,seed);
 const triangles=mountainVisualHash(i,j,seed+131)<.5?[[a,b,c],[a,c,d]]:[[a,b,d],[b,c,d]];
 faces=triangles.map(triangle=>{
  const [p,q,r]=triangle,ux=q[0]-p[0],uy=q[1]-p[1],uz=q[2]-p[2],vx=r[0]-p[0],vy=r[1]-p[1],vz=r[2]-p[2];
  const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,len=Math.hypot(nx,ny,nz),light=(-nx*.52-ny*.62+nz*.59)/len;
  const shade=Math.round((light-.48)*8)/8,color=shade>=0?'rgba(247,236,210,'+Math.min(.32,shade*.62)+')':'rgba(24,28,35,'+Math.min(.48,-shade*.64)+')';
  return {triangle,color,minX:Math.min(...triangle.map(v=>v[0])),maxX:Math.max(...triangle.map(v=>v[0])),minY:Math.min(...triangle.map(v=>v[1])),maxY:Math.max(...triangle.map(v=>v[1]))};
 });
 cache.cells.set(key,faces);while(cache.cells.size>cache.limit)cache.cells.delete(cache.cells.keys().next().value);return faces;
}
function drawMountainTerrace(ctx,x,y,px,py){
 if(!INMAP(x,y)||![T.ROCK,T.ORE].includes(G.tiles[IDX(x,y)]))return;
 const seed=mountainVisualSeed(),wx=x*16,wy=y*16,gx=Math.floor(wx/40),gy=Math.floor(wy/40);
 ctx.save();ctx.globalAlpha*=typeof TERRAIN_MATERIALS!=='undefined'?(TERRAIN_MATERIALS.rockStyle?.()??1):1;ctx.beginPath();ctx.rect(px,py,16,16);ctx.clip();
 // Shared jittered vertices and constant face normals in absolute world
 // space: each polygon continues unchanged across tile/chunk boundaries.
 for(let j=gy-1;j<=gy+1;j++)for(let i=gx-1;i<=gx+1;i++){
  for(const face of mountainVisualMeshCell(i,j,seed)){
   if(face.maxX<wx||face.minX>wx+16||face.maxY<wy||face.minY>wy+16)continue;
   ctx.fillStyle=face.color;
   ctx.beginPath();face.triangle.forEach((v,k)=>{if(k===0)ctx.moveTo(px+v[0]-wx,py+v[1]-wy);else ctx.lineTo(px+v[0]-wx,py+v[1]-wy);});ctx.closePath();ctx.fill();
  }
 }
 ctx.restore();
}