/* Sparse decorative wildlife. Native pixels, bounded spatial caches, no economy or fleet entities. */
const AMBIENT_LIFE={chunk:32,maxChunks:80,maxVisible:32,maxBoats:3,boatFrames:8,maxSmoke:8};
const ambientPools=new WeakMap(),ambientSprites=new Map(),ambientCoasts=new WeakMap();
let ambientFrame={entities:0,boats:0,smoke:0};
function ambientBoard(){return WORLD?.board||G;}
function ambientBridge(board,k){
 if(board.bridges?.[k])return board.bridges[k];
 for(const g of WORLD?.islands||[G])if(g?.tiles===board.tiles&&g.bridges?.[k])return g.bridges[k];
 return null;
}
function ambientTime(){return WORK_ART.reduced.matches?0:G.time;}
function ambientNearBuildings(board,x,y,radius=3){
 for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++)if(INMAP(x+dx,y+dy)){const k=IDX(x+dx,y+dy);if(board.occ[k]||board.road[k])return true;}
 return false;
}
function ambientNearLand(board,x,y,min=1,max=6){
 for(let dy=-max;dy<=max;dy+=2)for(let dx=-max;dx<=max;dx+=2)if(Math.hypot(dx,dy)>=min&&INMAP(x+dx,y+dy)&&board.tiles[IDX(x+dx,y+dy)]>T.SHAL)return true;
 return false;
}
function ambientHabitat(board,kind,x,y){
 if(!INMAP(x,y))return false;const k=IDX(x,y),t=board.tiles[k];
 if(kind==='boat'){
  if(t>T.SHAL||board.occ[k]||board.road[k]&&!ambientBridge(board,k))return false;
  if(board.river?.[k]||t===T.SHAL)return true;
  let coast=ambientCoasts.get(board.tiles);if(!coast){coast=new Map();ambientCoasts.set(board.tiles,coast);}if(!coast.has(k)){if(coast.size>=20000)coast.clear();coast.set(k,ambientNearLand(board,x,y,1,6));}return coast.get(k);
 }
 if(board.occ[k]||board.road[k])return false;
 if(kind==='deer')return t===T.GRASS||t===T.FOREST;
 if(kind==='goat')return t===T.ROCK||t===T.ORE;
 if(kind==='gull')return t===T.SAND;
 if(kind==='fish')return t<=T.SHAL&&!board.river?.[k];
 return t===T.DEEP&&!board.river?.[k];
}
function ambientPath(board,kind,x,y,seed){
 const path=[IDX(x,y)],visited=new Set(path),limit=kind==='boat'?256:8;let dx=1,dy=0;
 for(let i=0;i<limit;i++){
  const choices=LAND_STEPS.filter(([sx,sy])=>ambientHabitat(board,kind,x+sx,y+sy)&&(!sx||!sy||ambientHabitat(board,kind,x+sx,y)&&ambientHabitat(board,kind,x,y+sy))&&!visited.has(IDX(x+sx,y+sy))&&(kind==='boat'||Math.hypot(x+sx-path[0]%MAPW,y+sy-Math.floor(path[0]/MAPW))<=3));
  if(!choices.length)break;
  const scored=choices.map(step=>{
   const [sx,sy]=step,score=kind==='boat'?(board.river?.[IDX(x+sx,y+sy)]?8:0)+(sx*dx+sy*dy)*2+LAND_STEPS.filter(([qx,qy])=>ambientHabitat(board,kind,x+sx+qx,y+sy+qy)).length:hs(seed,i,IDX(x+sx,y+sy));
   return {step,score};
  }).sort((a,b)=>b.score-a.score);
  [dx,dy]=scored[0].step;x+=dx;y+=dy;const k=IDX(x,y);path.push(k);visited.add(k);
 }
 return path;
}
function ambientChunk(board,chunkX,chunkY){
 let pool=ambientPools.get(board.tiles);if(!pool){pool={chunks:new Map()};ambientPools.set(board.tiles,pool);}
 const key=chunkX+':'+chunkY;if(pool.chunks.has(key)){const value=pool.chunks.get(key);pool.chunks.delete(key);pool.chunks.set(key,value);return value;}
 const entries=[],seed=WORLD?.rootSeed||G.seed,size=AMBIENT_LIFE.chunk;
 for(let y=chunkY*size+1;y<Math.min(MAPH,(chunkY+1)*size);y+=2)for(let x=chunkX*size+1;x<Math.min(MAPW,(chunkX+1)*size);x+=2){
  const k=IDX(x,y),chance=hs(x,y,seed+4871);if(chance<(board.tiles[k]<=T.SHAL&&!board.river?.[k]? .90:.95))continue;
  const t=board.tiles[k];let kind=null;
  if(board.river?.[k]){if(chance>.985&&!entries.some(e=>e.kind==='boat'))kind='boat';}
  else if(t===T.FOREST||t===T.GRASS)kind='deer';
  else if(t===T.ROCK||t===T.ORE)kind='goat';
  else if(t===T.SAND)kind='gull';
  else if(t<=T.SHAL){
   if(chance>.995&&!entries.some(e=>e.kind==='boat')&&ambientNearLand(board,x,y,1,6))kind='boat';
   else if(chance>.992&&t===T.DEEP&&ambientNearLand(board,x,y,5,10))kind='shark';
   else kind='fish';
  }
  if(!kind||entries.filter(e=>e.kind===kind).length>=(kind==='fish'?8:5)&&kind!=='boat'||!ambientHabitat(board,kind,x,y)||kind!=='boat'&&ambientNearBuildings(board,x,y,4))continue;
  const path=ambientPath(board,kind,x,y,k);if(kind==='boat'&&path.length<10)continue;
  entries.push({kind,path,seed:k,nextCheck:-1,clear:true});
 }
 pool.chunks.set(key,entries);while(pool.chunks.size>AMBIENT_LIFE.maxChunks)pool.chunks.delete(pool.chunks.keys().next().value);return entries;
}
function ambientPosition(entry,board,time=ambientTime()){
 // Bridge tiles stay navigable; genuinely blocked banks still truncate a path.
 let length=entry.path.length;
 for(let i=0;i<length;i++){const k=entry.path[i];if(!ambientHabitat(board,entry.kind,k%MAPW,Math.floor(k/MAPW))){length=i;break;}}
 if(!length)return null;
 const span=length-1,phase=span?((time*(entry.kind==='boat'?.38:.16)+entry.seed%31)%(span*2)):0,reverse=phase>span,t=reverse?span*2-phase:phase,i=Math.min(Math.max(0,span-1),Math.floor(t)),a=entry.path[i],b=entry.path[Math.min(i+1,span)],f=span?t-i:0;
 return {x:(a%MAPW+(b%MAPW-a%MAPW)*f+.5)*16,y:(Math.floor(a/MAPW)+(Math.floor(b/MAPW)-Math.floor(a/MAPW))*f+.5)*16,dx:(b%MAPW-a%MAPW)*(reverse?-1:1),dy:(Math.floor(b/MAPW)-Math.floor(a/MAPW))*(reverse?-1:1)};
}
function ambientSprite(kind,dx=1,dy=0,frame=0){
 const vertical=Math.abs(dy)>Math.abs(dx),flip=vertical?dy<0:dx<0,key=kind+':'+(vertical?'v':'h')+':'+flip+':'+frame;
 if(ambientSprites.has(key))return ambientSprites.get(key);
 const a=document.createElement('canvas');a.width=a.height=16;const c=a.getContext('2d'),{r,p,ln}=civicPainter(a),edge='#34372f';
 if(flip){c.translate(16,0);c.scale(-1,1);}
 if(kind==='boat'){
  if(vertical){p([[8,1],[12,5],[12,11],[8,15],[4,11],[4,5]],edge);p([[8,3],[10,6],[10,11],[8,13],[6,11],[6,6]],'#a87d4e');r(6,7,5,1,'#d2b17c');const stroke=[-3,-2,0,2,3,2,0,-2][frame%8];ln(7,8,1,8+stroke,'#c9ad78');ln(8,8,14,8-stroke,'#c9ad78');r(1,8+stroke,2,2,'#e0c48f');r(13,8-stroke,2,2,'#e0c48f');r(5+frame%3,14-(frame>=4?1:0),2,1,'#6b999d');}
  else{p([[0,10],[3,7],[12,7],[16,10],[12,13],[3,13]],edge);p([[2,10],[4,8],[11,8],[14,10],[11,11],[4,11]],'#a87d4e');r(4,8,7,1,'#d2b17c');const stroke=[-4,-3,-1,1,4,3,1,-1][frame%8];ln(8,9,8+stroke,14,'#c9ad78');r(7+stroke,13,3,2,'#e0c48f');r(2+(frame%4),12,2,1,'#6b999d');}
  r(7,5,3,3,'#d1ab83');r(7,5,3,1,'#725c41');r(7,8,3,3,'#648387');r(7,8,1,2,'#90a2a0');
 }else if(kind==='deer'||kind==='goat'){
  const goat=kind==='goat',base=goat?'#bdb6a0':'#a47d53',light=goat?'#ded6bc':'#c8a471';
  r(3,7,9,5,edge);r(4,7,7,4,base);r(4,7,7,1,light);r(10,4,3,5,edge);r(10,5,2,3,base);r(12,5,3,2,base);r(13,5,1,1,edge);r(10,2,1,3,light);r(12,2,1,2,light);
  if(!goat){r(9,1,1,3,'#c4b58e');r(12,0,1,3,'#c4b58e');r(8,2,2,1,'#c4b58e');r(12,1,2,1,'#c4b58e');}
  r(4+(frame?1:0),11,1,4,edge);r(9-(frame?1:0),11,1,4,edge);r(2,7,2,1,light);if(goat)r(12,8,1,2,light);
 }else if(kind==='gull'){
  r(6,6,6,5,edge);r(6,6,5,4,'#d5d3bc');r(6,9,5,1,'#999f96');r(10,4,3,4,'#d5d3bc');r(12,5,3,1,'#bca269');r(11,5,1,1,edge);p([[2,9],[6,7],[6,10]],'#999f96');r(7,11,1,2,'#bca269');r(10,11,1,2,'#bca269');
 }else if(kind==='fish'){
  for(const [x,y] of [[2,5],[8,9],[4,12]]){r(x,y,5,2,'#5c8e97');r(x+1,y,3,1,'#8cabb0');p([[x+4,y+1],[x+7,y-1],[x+7,y+3]],'#507b89');r(x,y,1,1,'#354f5a');}
 }else{
  p([[4,12],[9,3],[12,5],[12,12]],edge);p([[6,11],[10,5],[11,11]],'#738b8d');r(3,13,11,1,'#8bafb1');r(1,14,5,1,'#527f90');
 }
 publishPixel('ambient_'+key,a,16,16);ambientSprites.set(key,'ambient_'+key);return 'ambient_'+key;
}
function addAmbientLife(x0,y0,x1,y1){
 ambientFrame={entities:0,boats:0,smoke:0};if(UI.z<WORLD_DETAIL.people)return;
 const board=ambientBoard(),size=AMBIENT_LIFE.chunk,time=ambientTime(),minX=Math.max(0,Math.floor(x0/16/size)),minY=Math.max(0,Math.floor(y0/16/size)),maxX=Math.min(Math.ceil(MAPW/size)-1,Math.floor(x1/16/size)),maxY=Math.min(Math.ceil(MAPH/size)-1,Math.floor(y1/16/size));
 // At most one new spatial chunk per frame: camera movement cannot trigger a map scan.
 let builds=0;const pool=ambientPools.get(board.tiles);
 for(let cy=minY;cy<=maxY;cy++)for(let cx=minX;cx<=maxX;cx++){
  if(!pool?.chunks.has(cx+':'+cy)&&builds++>=1)continue;
  for(const entry of ambientChunk(board,cx,cy)){
   if(ambientFrame.entities>=AMBIENT_LIFE.maxVisible)break;
   if(entry.kind==='boat'&&ambientFrame.boats>=AMBIENT_LIFE.maxBoats)continue;
   if(!WORK_ART.reduced.matches&&(time+entry.seed%113)%150>95)continue;
   const pos=ambientPosition(entry,board,time);if(!pos||pos.x<x0||pos.x>x1||pos.y<y0||pos.y>y1)continue;
   if(entry.kind!=='boat'){
    if(entry.nextCheck<=G.time){entry.nextCheck=G.time+.5;entry.clear=!ambientNearBuildings(board,Math.floor(pos.x/16),Math.floor(pos.y/16),4);}
    if(!entry.clear||board.occ[IDX(Math.floor(pos.x/16),Math.floor(pos.y/16))])continue;
   }
   const frame=WORK_ART.reduced.matches||G.speed===0?0:Math.floor(time*(entry.kind==='boat'?6:2)+entry.seed)%(entry.kind==='boat'?AMBIENT_LIFE.boatFrames:2),name=ambientSprite(entry.kind,pos.dx,pos.dy,frame);
   ENT.push([pos.y+4,entry.kind==='boat'?7:4,name,Math.round(pos.x)-8,Math.round(pos.y)-12]);ambientFrame.entities++;if(entry.kind==='boat')ambientFrame.boats++;
  }
 }
}
const ambientStreetPeople=addStreetPeople;addStreetPeople=function(...args){ambientStreetPeople(...args);addAmbientLife(...args);};
function ambientHouseSmoke(b,time=G.time){return b.type==='haus'&&b.pop>0&&b.fire<=0&&(time+b.id*13)%96<20;}
const ambientDrawBld=drawBld;drawBld=function(ctx,b){
 ambientDrawBld(ctx,b);if(UI.z<WORLD_DETAIL.people||WORK_ART.reduced.matches||ambientFrame.smoke>=AMBIENT_LIFE.maxSmoke||!ambientHouseSmoke(b))return;
 const name=spName(b),s=SP[name],m=SPB[name],source=HD_CATALOG.get(name)?.pixelSource,chimneys=source?._homeChimneys;if(!chimneys?.length)return;
 const chimney=chimneys[b.id%chimneys.length],x=b.x*16+b.w*8-s.width/2+chimney.x,y=(b.y+b.h)*16-m.H+chimney.y;
 for(let i=0;i<3;i++){const phase=(G.time*.35+i/3+b.id*.17)%1;ctx.fillStyle=phase<.5?'#bbb9a7':'#929a91';ctx.fillRect(Math.round(x+phase*5)-1,Math.round(y-phase*13)-2,phase>.6?3:2,2);}
 ambientFrame.smoke++;
};

/* The boat travels beneath the original bridge deck, including partial occlusion. */
function drawAmbientBoat(ctx,e){
 ctx.drawImage(SP[e[2]],e[3],e[4]);ctx.save();ctx.beginPath();ctx.rect(e[3],e[4],16,16);ctx.clip();
 const board=ambientBoard(),x=Math.floor((e[3]+8)/16),y=Math.floor((e[4]+12)/16);
 for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(INMAP(x+dx,y+dy)){const k=IDX(x+dx,y+dy),bridge=ambientBridge(board,k);if(bridge)ctx.drawImage(bridgeSprite(bridge.dx,bridge.dy,bridge.kind,bridge.part,bridge.pier),(x+dx)*16-4,(y+dy)*16-4);}
 ctx.restore();
}
