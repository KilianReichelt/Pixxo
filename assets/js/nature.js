/* Lebendige Umgebung für die 2D-Draufsicht. Keine Änderungen an der Wirtschaft. */
const NATURE={board:null,time:0,dt:0,threats:[],air:[],wakes:new Map(),shadows:new WeakMap(),shadowQueue:[],demo:[],metrics:{},lastTime:null};
function natureMotionTime(){return WORK_ART.reduced.matches?0:UI.vt;}
function natureLight(minutes=dayMinutes()){
 const h=minutes/60,day=Math.max(0,Math.sin((h-6)/12*Math.PI)),dawn=Math.exp(-(((h-7)/1.8)**2)),dusk=Math.exp(-(((h-18)/1.8)**2));
 const rain=typeof weatherRainAmount==='function'?weatherRainAmount():0;
 return {day,shadowX:-Math.cos((h-6)/12*Math.PI)*(.48+(1-day)*.82),shadowY:.18+day*.14,alpha:day/(day+.08)*(.46+.04*(1-day))*(1-rain*.78),warm:Math.min(1,dawn+dusk)*.12};
}
function natureColorGrade(minutes=dayMinutes()){
 const keys=[[0,[.46,.58,.82]],[300,[.46,.58,.82]],[360,[.58,.65,.9]],[450,[.72,.86,1]],[600,[1,1,1]],[840,[1,1,1]],[1020,[1,.72,.52]],[1080,[.9,.58,.48]],[1200,[.55,.56,.79]],[1320,[.46,.58,.82]],[1440,[.46,.58,.82]]];
 const m=((minutes%1440)+1440)%1440;
 for(let i=1;i<keys.length;i++)if(m<=keys[i][0]){const [a,from]=keys[i-1],[b,to]=keys[i],t=(m-a)/(b-a),blend=t*t*(3-2*t);return from.map((v,j)=>v+(to[j]-v)*blend);}
 return keys[0][1];
}
function natureBeginFrame(){
 const time=natureMotionTime();
 if(NATURE.board!==G.tiles){NATURE.board=G.tiles;NATURE.wakes.clear();NATURE.demo=[];NATURE.lastTime=null;}
 NATURE.dt=NATURE.lastTime===null?0:Math.max(0,Math.min(.1,time-NATURE.lastTime));NATURE.lastTime=time;NATURE.time=time;NATURE.air=[];NATURE.metrics={trees:0,shadows:0,wakePoints:0,birds:0};
 NATURE.threats=[];
 for(const sh of WORLD?.fleet||[]){if(sh.buildLeft>0)continue;const p=freeShipPosition(sh);if(p)NATURE.threats.push({x:p.x*16,y:p.y*16});}
 if(new URLSearchParams(location.search).has('natur-vorschau')){
  if(!NATURE.demo.length)naturePrepareDemo();
  for(const sh of NATURE.demo){const span=sh.path.length-1,t=(time*.8+sh.offset)%(2*span),index=t>span?2*span-t:t,i=Math.min(span-1,Math.floor(index)),f=index-i,a=sh.path[i],b=sh.path[i+1];
   sh.p={x:a[0]+(b[0]-a[0])*f,y:a[1]+(b[1]-a[1])*f};sh.reverse=t>span;NATURE.threats.push({x:sh.p.x*16,y:sh.p.y*16});}
 }
}
function naturePrepareDemo(){
 const cx=Math.floor(UI.cam.x/16),cy=Math.floor(UI.cam.y/16),sites=[];
 for(let y=Math.max(1,cy-16);y<Math.min(MAPH-1,cy+16);y+=2)for(let x=Math.max(1,cx-18);x<Math.min(MAPW-1,cx+18);x+=2)if(G.tiles[IDX(x,y)]<=T.SHAL&&!G.river?.[IDX(x,y)]&&!G.occ[IDX(x,y)])sites.push({x:x+.5,y:y+.5});
 if(sites.length<2)return;
 for(let j=0;j<2;j++){const a=sites[Math.floor(sites.length*(j?.25:.05))],b=sites[Math.floor(sites.length*(j?.75:.95))],path=seaPath(a,b);if(path?.length>6)NATURE.demo.push({id:'demo'+j,type:j?'clipper':'schooner',path,offset:j*4,p:a});}
}

// Stabile Zufallspositionen: Der Stamm bleibt einer Baukachel zugeordnet.
const NATURE_FORESTS=new WeakMap(),NATURE_FOREST_POINTS=new WeakMap();
const NATURE_FOREST_CACHE_LIMIT=30000;
function natureTreeCandidates(x,y){
 let cache=NATURE_FORESTS.get(G.tiles);if(!cache){cache=new Map();NATURE_FORESTS.set(G.tiles,cache);}
 const key=x+':'+y;if(cache.has(key))return cache.get(key);
 const seed=WORLD?.rootSeed||G.seed||1,cluster=hs(Math.floor(x/6),Math.floor(y/6),seed+831)*.65+hs(Math.floor(x/3),Math.floor(y/3),seed+835)*.35,clearing=hs(Math.floor(x/8),Math.floor(y/8),seed+833)>.9,density=(.32+cluster*.6)*(clearing?.45:1),points=[];
 for(let slot=0;slot<5;slot++)if(hs(x*5+slot,y,seed+837)<density){
  points.push({px:x*16+1+hs(x*5+slot,y,seed+839)*14,py:y*16+1+hs(x*5+slot,y,seed+853)*14,rank:hs(x*5+slot,y,seed+857),spacing:cluster>.55?5:6.5,slot});
 }
 cache.set(key,points);if(cache.size>NATURE_FOREST_CACHE_LIMIT)cache.delete(cache.keys().next().value);return points;
}
function natureTreePoints(x,y){
 if(!INMAP(x,y))return [];const k=IDX(x,y);if(G.tiles[k]!==T.FOREST||G.occ[k]||G.road[k])return [];
 let cache=NATURE_FOREST_POINTS.get(G.tiles);if(!cache){cache=new Map();NATURE_FOREST_POINTS.set(G.tiles,cache);}const key=x+':'+y,old=cache.get(key);if(old)return old;
 const points=natureTreeCandidates(x,y).filter(p=>{
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)for(const q of natureTreeCandidates(x+dx,y+dy)){
   if(!INMAP(x+dx,y+dy))continue;const neighbor=IDX(x+dx,y+dy);if(G.tiles[neighbor]!==T.FOREST||G.occ[neighbor]||G.road[neighbor])continue;
   if(q===p||q.rank>=p.rank)continue;if((q.px-p.px)**2+(q.py-p.py)**2<Math.min(p.spacing,q.spacing)**2)return false;
  }
  return true;
 });cache.set(key,points);if(cache.size>NATURE_FOREST_CACHE_LIMIT)cache.delete(cache.keys().next().value);return points;
}
function natureAddTrees(entities,x0,y0,x1,y1,step=1){
 const keep=1/(step*step);
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
  // The deterministic LOD test is only needed where a tree can exist.
  if(keep<1){if(!INMAP(x,y))continue;const k=IDX(x,y);if(G.tiles[k]!==T.FOREST||G.occ[k]||G.road[k]||hs(x,y,967)>keep)continue;}
  for(const p of natureTreePoints(x,y)){
  entities.push([p.py,0,x,y,p]);
  }
 }
}
function natureTreeSprite(x,y,point){return window.SpriteReview?.forestSprite?.(x,y,point)||landscapeTreeSprite(x+(point?.slot||0)*103,y+(point?.slot||0)*47);}
function natureTreePose(x,y,sprite,point){
 return point?{left:Math.round(point.px-sprite.width/2),base:Math.round(point.py)}:{left:x*16+Math.floor((hs(x,y,11)-.5)*4),base:y*16+16};
}
function natureShadowOval(ctx,cx,cy,rx,ry){
 for(let row=Math.floor(-ry);row<=Math.ceil(ry);row++){const v=row/ry;if(Math.abs(v)>1)continue;const edge=Math.sqrt(1-v*v)*rx,left=Math.round(cx-edge),right=Math.round(cx+edge);if(right>left)ctx.fillRect(left,Math.round(cy+row),right-left,1);}
}
function natureGround(ctx){
 if(worldOverview()||UI.z<1.2)return;
 // Ausschließlich bodennahes AO, ohne gerichtete oder gestreckte Schlagschatten.
 const layer=NATURE.shadowLayer||(NATURE.shadowLayer=document.createElement('canvas'));
 const transform=ctx.getTransform(),objects=ENT.filter(e=>e[1]===1||e[1]===0&&UI.z>=.7),signature=[ctx.canvas.width,ctx.canvas.height,transform.a,transform.b,transform.c,transform.d,transform.e,transform.f,...objects.map(e=>e[1]===0?e[2]+','+e[3]+','+e[4]?.slot:[e[2].x,e[2].y,e[2].w,e[2].h,e[2].type].join(','))].join('|');
 if(NATURE.aoSignature!==signature||NATURE.aoBoard!==G.tiles){
 NATURE.aoSignature=signature;NATURE.aoBoard=G.tiles;
 if(layer.width!==ctx.canvas.width||layer.height!==ctx.canvas.height){layer.width=ctx.canvas.width;layer.height=ctx.canvas.height;}
 const ao=layer.getContext('2d');ao.setTransform(1,0,0,1,0,0);ao.clearRect(0,0,layer.width,layer.height);ao.setTransform(ctx.getTransform());ao.globalCompositeOperation='darken';
 for(const e of objects){
  let cx,cy,rx,ry;
  if(e[1]===0){const s=natureTreeSprite(e[2],e[3],e[4]),p=natureTreePose(e[2],e[3],s,e[4]);cx=p.left+s.width/2;cy=p.base;rx=Math.max(4,s.width*.28);ry=2.7;}
  else if(e[1]===1){const b=e[2];if(B[b.type].kind==='field')continue;cx=(b.x+b.w/2)*16;cy=(b.y+b.h)*16;rx=b.w*8+2;ry=3.5;}
  else continue;
  for(const [scale,color] of [[1.35,'#c6c8c9'],[1,'#a0a4a7'],[.62,'#737a80']]){ao.fillStyle=color;natureShadowOval(ao,cx,cy,rx*scale,ry*scale);}
  NATURE.metrics.shadows++;
 }
 ao.globalCompositeOperation='source-over';
 }ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='multiply';ctx.globalAlpha=.45*Math.min(1,(UI.z-1.2)/.4);nativeDrawImage.call(ctx,layer,0,0);ctx.restore();
}
function natureDrawTree(ctx,x,y,sprite,point){
 const p=natureTreePose(x,y,sprite,point);ctx.drawImage(sprite,p.left,p.base-sprite.height);NATURE.metrics.trees++;
}
function natureWaterPixel(ctx,x,y,alpha,color='#d3e9ef'){
 const tx=Math.floor(x/16),ty=Math.floor(y/16);if(!INMAP(tx,ty)||G.tiles[IDX(tx,ty)]>T.SHAL||G.bridges?.[IDX(tx,ty)]?.pier)return;
 ctx.globalAlpha=Math.max(0,Math.min(1,alpha));ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),1,1);NATURE.metrics.wakePoints++;
}
function natureWake(ctx,id,p,type){
 const now=NATURE.time,x=p.x*16,y=p.y*16;let state=NATURE.wakes.get(id);
 if(!state){state={x,y,time:now,points:[],speed:0,dir:{x:0,y:-1},lastSample:now};NATURE.wakes.set(id,state);return;}
 const dt=now-state.time,dist=Math.hypot(x-state.x,y-state.y);
 if(dt>0&&dist>48){state.points=[];state.speed=0;}
 else if(dt>0&&dist>.005){state.dir={x:(x-state.x)/dist,y:(y-state.y)/dist};state.speed=state.speed*.7+Math.min(36,dist/dt)*.3;
  if(now-state.lastSample>=.12){state.points.push({x,y,time:now,dx:state.dir.x,dy:state.dir.y,speed:state.speed});state.lastSample=now;}}
 else if(dt>0)state.speed*=Math.exp(-dt*6);
 state.x=x;state.y=y;state.time=now;state.points=state.points.filter(q=>now-q.time<9).slice(-80);
 if(WORK_ART.reduced.matches)return;
 ctx.save();
 const hull=type==='clipper'?24:20;
 for(const q of state.points){const age=now-q.time,fade=Math.pow(1-age/9,1.2)*Math.min(1,q.speed/8),spread=4+age*2.1,sternX=q.x-q.dx*hull,sternY=q.y-4-q.dy*hull*.65;
  for(const side of [-1,1])for(let j=-2;j<=2;j++){const ripple=Math.sin(age*3.1+q.time*5+side)*Math.min(1.2,age*.4),a=sternX-q.dy*(spread+ripple)*side+q.dx*j,b=sternY+q.dx*(spread+ripple)*side*.65+q.dy*j;natureWaterPixel(ctx,a,b,fade*.72*(.75+.25*Math.sin(q.time*9+j)));}
  if(age<4.5)for(let j=-2;j<=2;j++){const swirl=Math.sin(q.time*8+age*4+j)*(.8+age*.5),offset=j*1.3+swirl;natureWaterPixel(ctx,sternX-q.dy*offset,sternY+q.dx*offset*.65,(1-age/4.5)*(.58-Math.abs(j)*.08),'#cee8ec');}
 }
 // Die Bugwelle entsteht nur bei tatsächlicher Bewegung, unabhängig vom Schiffskurs-Sprite.
 if(state.speed>.6){const d=state.dir,bow=hull+2,strength=Math.min(.96,state.speed/10),waterY=y-4;
  for(const side of [-1,1])for(let i=0;i<22;i++)for(let layer=0;layer<3;layer++){
   const u=i/21,pulse=.78+.22*Math.sin(now*6.1-u*9+side),spread=1+u*12+layer*(.8+u*.7)+Math.sin(now*4-u*11)*u*.6;
   const a=x+d.x*(bow-u*19)-d.y*side*spread,b=waterY+(d.y*(bow-u*19)+d.x*side*spread)*.65;
   natureWaterPixel(ctx,a,b,strength*(1-u*.55)*pulse*[.92,.62,.28][layer],layer===0?'#ecf5f3':'#b9dde7');
  }
  if(state.speed>5)for(let i=0;i<12;i++){const life=(now*.9+i*.137)%1;if(life>.68)continue;const side=i%2?1:-1,spread=2+life*10,a=x+d.x*(bow+life*4)-d.y*side*spread,b=waterY+(d.y*(bow+life*4)+d.x*side*spread)*.65;natureWaterPixel(ctx,a,b,(1-life)*strength*.65);}
 }ctx.restore();
}
const natureOldFleet=drawFleet;
drawFleet=function(ctx){
 if(!worldOverview())for(const sh of WORLD?.fleet||[]){if(sh.buildLeft>0)continue;const p=freeShipPosition(sh);if(p)natureWake(ctx,sh.id,p,sh.type);}
 // Historie verschwindet mit verkauften oder entfernten Schiffen.
 const ids=new Set([...(WORLD?.fleet||[]).map(s=>s.id),...NATURE.demo.map(s=>s.id)]);for(const id of NATURE.wakes.keys())if(!ids.has(id))NATURE.wakes.delete(id);
 for(const sh of NATURE.demo)if(sh.p)natureWake(ctx,sh.id,sh.p,sh.type);
 natureOldFleet(ctx);
 for(const sh of NATURE.demo)if(sh.p){const span=sh.path.length-1,t=(NATURE.time*.8+sh.offset)%(span*2),index=t>span?2*span-t:t,dir=headingForPath(sh.path,index);drawShipSprite(ctx,sh.p,sh.reverse?(dir+4)%8:dir,sh.type);}
 for(const b of NATURE.air)natureDrawFlyingBird(ctx,b);
};
function natureThreat(x,y,radius){
 let nearest=null,best=radius;for(const p of NATURE.threats){const d=Math.hypot(x-p.x,y-p.y);if(d<best){nearest=p;best=d;}}return nearest;
}
const natureOldHabitat=ambientHabitat,natureCoastPools=new WeakSet();
ambientHabitat=function(board,kind,x,y){
 if(kind==='gull'&&INMAP(x,y)&&board.tiles[IDX(x,y)]===T.ROCK&&!board.occ[IDX(x,y)]&&!board.road[IDX(x,y)])return [[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>INMAP(x+dx,y+dy)&&board.tiles[IDX(x+dx,y+dy)]<=T.SHAL&&!board.river?.[IDX(x+dx,y+dy)]);
 return natureOldHabitat(board,kind,x,y);
};
const natureOldAmbientChunk=ambientChunk;
ambientChunk=function(board,cx,cy){
 const entries=natureOldAmbientChunk(board,cx,cy);if(natureCoastPools.has(entries))return entries;natureCoastPools.add(entries);let count=0;
 // Vereinzelte Felsmöwen verwenden das vorhandene Tier-Sprite und denselben Cache.
 for(let y=cy*AMBIENT_LIFE.chunk;y<Math.min(MAPH,(cy+1)*AMBIENT_LIFE.chunk)&&count<2;y++)for(let x=cx*AMBIENT_LIFE.chunk;x<Math.min(MAPW,(cx+1)*AMBIENT_LIFE.chunk)&&count<2;x++){
  const k=IDX(x,y);if(board.tiles[k]!==T.ROCK||hs(x,y,(WORLD?.rootSeed||G.seed)+718)>.12||!ambientHabitat(board,'gull',x,y))continue;
  entries.unshift({kind:'gull',path:[k],seed:k,nextCheck:-1,clear:true});count++;
 }return entries;
};
const natureOldAmbientPosition=ambientPosition;
ambientPosition=function(entry,board,time){
 const pos=natureOldAmbientPosition(entry,board,time);if(!pos||WORK_ART.reduced.matches)return pos;
 const now=NATURE.time,threat=natureThreat(pos.x,pos.y,entry.kind==='gull'?110:65);
 if(entry.kind==='fish'||entry.kind==='shark'){if(threat)entry.natureDive=now+3.5;return entry.natureDive>now?null:pos;}
 if(entry.kind==='gull'){
  if(threat&&!entry.natureFlight)entry.natureFlight={x:pos.x,y:pos.y,start:now,home:{x:pos.x,y:pos.y},seed:entry.seed};
  const f=entry.natureFlight;if(!f)return pos;
  const age=now-f.start,near=natureThreat(f.home.x,f.home.y,125),landing=age>5&&!near;
  let target;
  if(landing)target={x:pos.x,y:pos.y};
  else{const angle=age*.5+entry.seed*.1;target={x:f.home.x+Math.cos(angle)*65,y:f.home.y+Math.sin(angle)*42-20};if(threat&&age<2)target={x:pos.x+(pos.x-threat.x)*2,y:pos.y+(pos.y-threat.y)*2};}
  const dx=target.x-f.x,dy=target.y-f.y,d=Math.hypot(dx,dy),step=Math.min(d,NATURE.dt*32);if(d>.01){f.x+=dx/d*step;f.y+=dy/d*step;}
  if(landing&&d<3){delete entry.natureFlight;return pos;}
  NATURE.air.push({x:f.x,y:f.y,height:Math.min(1,age)*Math.min(1,landing?d/35:1)*12,seed:entry.seed,dx});return null;
 }
 if(entry.kind==='deer'||entry.kind==='goat'){
  if(threat&&!entry.naturePanic)entry.naturePanic={x:pos.x,y:pos.y};
  const state=entry.naturePanic;if(!state)return pos;let target=pos;
  if(threat){const dx=pos.x-threat.x,dy=pos.y-threat.y,d=Math.hypot(dx,dy)||1;
   for(const distance of [24,14,6]){const x=pos.x+dx/d*distance,y=pos.y+dy/d*distance;if(ambientHabitat(board,entry.kind,Math.floor(x/16),Math.floor(y/16))){target={x,y};break;}}
  }
  const dx=target.x-state.x,dy=target.y-state.y,d=Math.hypot(dx,dy),step=Math.min(d,NATURE.dt*(threat?28:10)),x=state.x+(d?dx/d*step:0),y=state.y+(d?dy/d*step:0);
  if(ambientHabitat(board,entry.kind,Math.floor(x/16),Math.floor(y/16))){state.x=x;state.y=y;}else{delete entry.naturePanic;return pos;}
  if(!threat&&d<2)delete entry.naturePanic;return {...pos,x:state.x,y:state.y,dx,dy};
 }return pos;
};
function natureDrawFlyingBird(ctx,b){
 if(UI.z<.7)return;const name=ambientSprite('gull',1,0,WORK_ART.reduced.matches?0:Math.floor(NATURE.time*2+b.seed)%2),sprite=SP[name];if(!sprite)return;
 ctx.drawImage(sprite,Math.round(b.x)-8,Math.round(b.y-b.height)-12);NATURE.metrics.birds++;
}
function natureCloudTexture(seed){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d'),image=c.createImageData(256,256);
 const levels=[4,8,16,32].map((n,j)=>({n,values:Float32Array.from({length:n*n},(_,k)=>hs(k%n,Math.floor(k/n),seed+j*79))}));
 function sample(level,x,y){const {n,values}=level,px=x*n,py=y*n,ix=Math.floor(px),iy=Math.floor(py),fx=px-ix,fy=py-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),at=(a,b)=>values[((b%n+n)%n)*n+(a%n+n)%n];return (at(ix,iy)*(1-u)+at(ix+1,iy)*u)*(1-v)+(at(ix,iy+1)*(1-u)+at(ix+1,iy+1)*u)*v;}
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){
  const u=x/256,v=y/256,wx=u+Math.sin(v*Math.PI*2)*.045,wy=v+Math.sin(u*Math.PI*4)*.035;
  let field=0;for(let j=0;j<4;j++)field+=sample(levels[j],wx,wy)*[.54,.27,.13,.06][j];
  const t=Math.max(0,Math.min(1,(field-.43)/.26)),coverage=t*t*(3-2*t),i=(y*256+x)*4;
  image.data[i]=22;image.data[i+1]=40;image.data[i+2]=59;image.data[i+3]=Math.round(coverage*108/6)*6;
 }c.putImageData(image,0,0);return canvas;
}
drawDayClouds=function(ctx,x0,y0,x1,y1){
 if(worldOverview())return;const daylight=1-nightAmount();if(daylight<.01)return;
 if(!NATURE.cloudTextures)NATURE.cloudTextures=[natureCloudTexture(6821),natureCloudTexture(9871)];
 if(!NATURE.cloudPatterns)NATURE.cloudPatterns=NATURE.cloudTextures.map(c=>ctx.createPattern(c,'repeat'));
 const time=natureMotionTime(),noon=Math.exp(-(((dayMinutes()/60-12)/2.3)**2)),rain=typeof weatherRainAmount==='function'?weatherRainAmount():0;
 ctx.save();ctx.imageSmoothingEnabled=false;
 for(let i=0;i<2;i++){const pattern=NATURE.cloudPatterns[i],scale=i?4.7:3.2;pattern.setTransform(new DOMMatrix().translate(time*(i?.61:.94)+i*457,time*(i?.18:.27)+i*229).scale(scale));ctx.fillStyle=pattern;ctx.globalAlpha=daylight*(i?.26:.48)*(.72-noon*.32+rain*.3);ctx.fillRect(x0,y0,x1-x0,y1-y0);}
 ctx.restore();
};
const natureOldNight=drawNight;
drawNight=function(ctx,x0,y0,x1,y1){
 natureOldNight(ctx,x0,y0,x1,y1);
 // Einheitliche Lichtfarbe für die ganze Szene, ohne Änderungen an den 2D-Texturen.
 const grade=natureColorGrade().map(v=>Math.round(v*255));if(grade.some(v=>v!==255)){ctx.save();ctx.globalCompositeOperation='multiply';ctx.fillStyle='rgb('+grade.join(',')+')';ctx.fillRect(x0,y0,x1-x0,y1-y0);ctx.restore();}
 const rain=typeof weatherRainAmount==='function'?weatherRainAmount():0;
 if(rain>.001){ctx.save();ctx.globalCompositeOperation='saturation';ctx.globalAlpha=rain*.38;ctx.fillStyle='#808080';ctx.fillRect(x0,y0,x1-x0,y1-y0);ctx.globalCompositeOperation='multiply';ctx.globalAlpha=rain*.16;ctx.fillStyle='#6e7b88';ctx.fillRect(x0,y0,x1-x0,y1-y0);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=rain*.065;ctx.fillStyle='#a6b1ba';ctx.fillRect(x0,y0,x1-x0,y1-y0);ctx.restore();}
 const noon=Math.exp(-(((dayMinutes()/60-12)/2.3)**2))*(1-rain);if(noon>.01){ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=noon*.075;ctx.fillStyle='#ffeac4';ctx.fillRect(x0,y0,x1-x0,y1-y0);ctx.restore();}
 const night=nightAmount();if(night<=.01||worldOverview()||!NIGHT_LIGHTING_OPTIONS.extra)return;
 // Fenster und Laternen leuchten nach der Farbkorrektur mit ihrer eigenen Farbe.
 for(const b of worldBuildings()){
  if(b.fire>0||B[b.type].kind==='field'||b.x*16>x1+64||(b.x+b.w)*16<x0-64||b.y*16>y1+128||(b.y+b.h)*16<y0-64)continue;
  const name=workshopSprite(b),sprite=SP[name],meta=SPB[name];if(!sprite||!meta||hasDedicatedNightSprite(name))continue;
  const x=b.x*16+b.w*8-sprite.width/2,y=(b.y+b.h)*16-meta.H,lamp=['deko_laterne','deko_lampe'].includes(b.type);
  ctx.save();ctx.globalAlpha=night;ctx.filter='none';
  if(lamp){nativeDrawImage.call(ctx,nightGlowSprite(),x+sprite.width*.5-20,y+meta.H*.27-20,40,40);ctx.fillStyle='#ffe8a1';ctx.fillRect(Math.round(x+sprite.width*.5)-1,Math.round(y+meta.H*.27)-1,2,3);}
  else{const windows=nightWindows(name),state=nightWindowState(windows,b);for(const p of state.lights){const px=x+p.x/windows.w*sprite.width,py=y+p.y/windows.h*meta.H;nativeDrawImage.call(ctx,nightGlowSprite(),px-10,py-10,20,20);}ctx.globalAlpha=night*(b.paused?.5:1);ctx.drawImage(state.mask,x,y,sprite.width,meta.H);}
  ctx.restore();
 }
};
if(new URLSearchParams(location.search).has('natur-vorschau')){
 const natureInit=init;init=function(){natureInit();Object.assign(dayClock(),{minutes:960,enabled:false,system:false});G.speed=1;renderTop(true);};
 const controls=document.createElement('div');controls.className='nature-controls';controls.setAttribute('role','group');controls.setAttribute('aria-label','Naturvorschau: Tageslicht vergleichen');
 controls.addEventListener('keydown',event=>event.stopPropagation());
 const text=document.createElement('span');text.textContent='Vorführschiffe · Tageslicht';controls.append(text);
 for(const [name,minutes] of [['Morgen',450],['Mittag',720],['Abend',1020]]){const button=document.createElement('button');button.type='button';button.textContent=name;button.addEventListener('click',()=>{Object.assign(dayClock(),{minutes,enabled:false,system:false});renderTop(true);for(const b of controls.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b===button));});button.setAttribute('aria-pressed','false');controls.append(button);}
 const style=document.createElement('style');style.textContent='.nature-controls{position:fixed;left:12px;top:calc(var(--topH,120px) + 12px);z-index:45;display:flex;flex-wrap:wrap;gap:6px;max-width:calc(100vw - 24px);padding:6px;background:#241b10;color:#ffedb3;font:0.875rem/1.4 system-ui}.nature-controls span{align-self:center;padding:6px}.nature-controls button{min-width:44px;min-height:44px;padding:8px;border:1px solid #ac935a;background:#352817;color:#ffedb3;font:inherit}.nature-controls button[aria-pressed=true]{background:#ffedb3;color:#241b10}.nature-controls button:focus-visible{outline:3px solid white;outline-offset:2px}';document.head.append(style);document.body.append(controls);
}
