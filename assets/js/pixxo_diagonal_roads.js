/* Acht Straßenrichtungen teilen sich dieselben Regeln in Planung und Transport. */
const LAND_STEPS=[[0,-1],[1,0],[0,1],[-1,0],[1,-1],[1,1],[-1,1],[-1,-1]];
function roadStepAllowed(x,y,nx,ny,g=G){
 if(!INMAP(x,y)||!INMAP(nx,ny))return false;
 const dx=nx-x,dy=ny-y;if(Math.abs(dx)>1||Math.abs(dy)>1||!dx&&!dy)return false;
 // Keine Eck-Abkürzung: eine Straße auf einer der Zwischenkacheln verbindet
 // die Punkte bereits rechtwinklig. Das gilt für Zeichnung UND Wegfindung.
 // Buildings beside the shared corner do not remove an existing diagonal.
 return !(dx&&dy)||[IDX(nx,y),IDX(x,ny)].every(k=>!g.road[k]&&BUILDABLE(g.tiles[k]));
}
function roadNeighbours(k,g=G){const x=k%MAPW,y=Math.floor(k/MAPW);return LAND_STEPS.filter(([dx,dy])=>roadStepAllowed(x,y,x+dx,y+dy,g)&&g.road[IDX(x+dx,y+dy)]).map(([dx,dy])=>IDX(x+dx,y+dy));}
function roadPathDistance(path){let n=0;for(let i=1;i<path.length;i++)n+=Math.hypot(path[i]%MAPW-path[i-1]%MAPW,Math.floor(path[i]/MAPW)-Math.floor(path[i-1]/MAPW));return n;}
// Distance is base-speed time: split at tile boundaries so mixed roads remain
// accurate even when one simulation tick crosses several sections.
function cartPathAdvance(c,distance,g=G){let t=c.t;while(distance>0&&t<c.path.length-1){const i=Math.floor(t),a=c.path[i],b=c.path[i+1],fraction=t-i,length=Math.hypot(b%MAPW-a%MAPW,Math.floor(b/MAPW)-Math.floor(a/MAPW))||1,boundary=fraction<.5?.5:1,speed=g.road[fraction<.5?a:b]===2?1.3:1,remaining=(boundary-fraction)*length/speed;if(distance<remaining){t+=distance*speed/length;break;}t=i+boundary;distance-=remaining;}return t;}
const diagonalRoadCache=new Map();
// Vier logische Pixel Überstand füllen die Nachbarkacheln an diagonalen Ecken.
const DIAGONAL_ROAD_PAD=4;
function diagonalRoadSprite(mask,stone,x,y){
 if(!(mask&240))return pixelRoadSprite(mask,stone,x,y);
 const key=mask+':'+stone;if(diagonalRoadCache.has(key))return diagonalRoadCache.get(key);
 const size=(16+DIAGONAL_ROAD_PAD*2)*2,c=document.createElement('canvas');c.width=c.height=size;
 const g=c.getContext('2d'),image=g.createImageData(size,size),segments=LAND_STEPS.filter((_,i)=>mask&(1<<i)).map(([dx,dy])=>({a:[8,8],b:[8+dx*8,8+dy*8],start:0,length:Math.hypot(dx,dy)*8}));
 for(let py=0;py<size;py++)for(let px=0;px<size;px++){
  const lx=(px+.5)/2-DIAGONAL_ROAD_PAD,ly=(py+.5)/2-DIAGONAL_ROAD_PAD;
  const q=roadCoordinates(lx,ly,segments),inner=stone?4.25:3.4,outer=stone?4.8:5.6;
  // Der Überstand gehört nur zur Ecke einer vorhandenen Diagonalverbindung.
  if(lx<0||lx>=16||ly<0||ly>=16){const diagonal=segments.filter(s=>s.b[0]!==8&&s.b[1]!==8);if(!diagonal.some(s=>Math.hypot(lx-s.b[0],ly-s.b[1])<outer))continue;}
  const tx=(px-DIAGONAL_ROAD_PAD*2+32)%32,ty=(py-DIAGONAL_ROAD_PAD*2+32)%32;
  const coverage=clamp((outer-q.distance)/(outer-inner),0,1);if(coverage<=(ROAD_BAYER[ty%4][tx%4]+.5)/16)continue;
  let rgb;
  if(stone){
   // Weltweit gleiche Pflasterphase verhindert Sprünge an Kachelecken.
   const row=Math.floor(ly/2),along=((lx+(row%2)*2)%4+4)%4,across=((ly%2)+2)%2;
   const mortar=along<.4||across<.35,tone=mortar?91:128+(across<.7?14:0)+(hs(Math.floor(lx/4),row,31)>.5?7:0);rgb=[tone,tone+2,tone+3];
  }else{const v=hs(tx,ty,51),shade=v<.18?-9:v>.82?6:0;rgb=[188+shade,155+shade,109+shade];}
  image.data.set([...rgb,255],(py*size+px)*4);
 }
 g.putImageData(image,0,0);diagonalRoadCache.set(key,c);return c;
}
function drawRoadTile(ctx,mask,stone,x,y){
 const diagonal=!!(mask&240),pad=diagonal?DIAGONAL_ROAD_PAD:0,size=16+pad*2;
 ctx.drawImage(diagonalRoadSprite(mask,stone,x,y),x*16-pad,y*16-pad,size,size);
}
/* Dijkstra misst diagonale Abschnitte mit ihrer tatsächlichen Länge. */
deliveryPath=function(a,b){
 const range=def(a).transportRange||Infinity,key=[a.id,a.x,a.y,a.w,a.h,b.id,b.x,b.y,b.w,b.h,range].join(':');G.deliveryPaths??=new Map();if(G.deliveryPaths.has(key))return G.deliveryPaths.get(key);
 const gapX=Math.max(0,a.x-b.x-b.w,b.x-a.x-a.w),gapY=Math.max(0,a.y-b.y-b.h,b.y-a.y-a.h);if(Math.hypot(gapX,gapY)>range+3){G.deliveryPaths.set(key,null);return null;}
 const ends=new Set(ringCells(b).filter(([x,y])=>INMAP(x,y)&&G.road[IDX(x,y)]).map(([x,y])=>IDX(x,y))),prev=new Map(),distance=new Map(),heap=[];
 const push=(k,d)=>{let i=heap.length,entry={k,d};heap.push(entry);while(i){const p=(i-1)>>1;if(heap[p].d<=d)break;heap[i]=heap[p];i=p;}heap[i]=entry;};
 const pop=()=>{const root=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let child=i*2+1;if(child+1<heap.length&&heap[child+1].d<heap[child].d)child++;if(heap[child].d>=last.d)break;heap[i]=heap[child];i=child;}heap[i]=last;}return root;};
 for(const [x,y] of ringCells(a))if(INMAP(x,y)&&G.road[IDX(x,y)]){const k=IDX(x,y);if(!prev.has(k)){prev.set(k,-1);distance.set(k,0);push(k,0);}}
 let end=-1;while(heap.length){const {k,d}=pop();if(d!==distance.get(k))continue;if(ends.has(k)){end=k;break;}for(const n of roadNeighbours(k)){const next=d+Math.hypot(n%MAPW-k%MAPW,Math.floor(n/MAPW)-Math.floor(k/MAPW));if(next>range||distance.has(n)&&next>=distance.get(n))continue;distance.set(n,next);prev.set(n,k);push(n,next);}}
 let path=null;if(end>=0){path=[];for(let k=end;k>=0;k=prev.get(k))path.push(k);path.reverse();}G.deliveryPaths.set(key,path);return path;
};
roadReach=function(b,limit){const result=new Map(),queue=[];for(const [x,y] of ringCells(b)){if(!INMAP(x,y))continue;const k=IDX(x,y);if(G.road[k]&&!result.has(k)){result.set(k,0);queue.push(k);}}for(let i=0;i<queue.length;i++){const k=queue[i],d=result.get(k);for(const n of roadNeighbours(k)){const next=d+Math.hypot(n%MAPW-k%MAPW,Math.floor(n/MAPW)-Math.floor(k/MAPW));if(next>limit||result.has(n)&&result.get(n)<=next)continue;result.set(n,next);queue.push(n);}}return result;};
