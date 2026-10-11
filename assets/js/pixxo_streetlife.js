/* Sichtbare Lieferketten, zweiton­nige Wagen und Bewohner auf dem Straßennetz. */
const CART_SPEED=1.2,CART_CAPACITY=2,CART_BATCH_SECONDS=2;
function queueGoodsCart(cart){let qty=cart.qty;const same=G.carts.find(c=>c.t===0&&c.wait>0&&c.source===cart.source&&c.target===cart.target&&c.col===cart.col&&c.qty<CART_CAPACITY);if(same){const n=Math.min(qty,CART_CAPACITY-same.qty);same.qty+=n;qty-=n;if(same.qty>=CART_CAPACITY)same.wait=0;}while(qty>1e-9){const n=Math.min(CART_CAPACITY,qty);G.carts.push({...cart,path:cart.path.slice(),qty:n,t:0,wait:n<CART_CAPACITY?CART_BATCH_SECONDS:0});qty-=n;}}
deliverProduction=function(b,g,qty,target){const dest=target||warehouseTarget(b);if(!dest)return;OUTSTAT('prod',g,qty);queueGoodsCart({path:dest.path,col:g,qty,target:dest.b.id,source:b.id,destination:def(dest.b).kind==='wh'?'warehouse':'input'});};
requestLogistics=function(dt){returnMarketSupply();G.logisticsClock=(G.logisticsClock||0)+dt;if(G.logisticsClock<2)return;G.logisticsClock=0;for(const b of G.blds){const d=def(b);if(!Object.keys(d.in||{}).length||!b.conn||b.paused||b.fire>0)continue;const w=warehouseTarget(b);if(!w)continue;for(const [g,n] of Object.entries(d.in)){const need=Math.max(0,n*2-(b.inputStock?.[g]||0)-deliveryIncoming(b,g)),qty=Math.min(CART_CAPACITY,need,G.stock[g]||0);if(qty<=0)continue;G.stock[g]-=qty;queueGoodsCart({path:w.path.slice().reverse(),col:g,qty,target:b.id,source:w.b.id,destination:'input'});}}};
advanceDeliveries=function(dt){const keep=[],fades=visibleCartFades();for(const c of G.carts){if(c.wait>0){c.wait=Math.max(0,c.wait-dt);keep.push(c);continue;}if(!c.qty){c.t=cartPathAdvance(c,dt*CART_SPEED);if(c.t<c.path.length-1)keep.push(c);continue;}let target=G.byId.get(c.target);if(!target||target.fire>0||!ringCells(target).some(([x,y])=>INMAP(x,y)&&IDX(x,y)===c.path[c.path.length-1])||c.path.some(k=>!G.road[k])){const recovery=recoverCartPath(c);if(recovery){c.target=recovery.b.id;c.destination='warehouse';c.path=recovery.path;c.t=0;target=recovery.b;}}const touches=target&&ringCells(target).some(([x,y])=>INMAP(x,y)&&IDX(x,y)===c.path[c.path.length-1]);if(!touches||target.fire>0||c.path.some(k=>!G.road[k])){keep.push(c);continue;}c.t=cartPathAdvance(c,dt*CART_SPEED);if(c.t<c.path.length-1){keep.push(c);continue;}if(def(target).kind==='wh'){const qty=Math.min(c.qty,Math.max(0,capOf()-(G.stock[c.col]||0)));G.stock[c.col]=(G.stock[c.col]||0)+qty;c.qty-=qty;if(c.qty>1e-9){keep.push(c);continue;}}else{target.inputStock??={};target.inputStock[c.col]=(target.inputStock[c.col]||0)+c.qty;}fades.push({...c,path:[c.path[c.path.length-1]],t:0,fadeStart:UI.vt});}G.carts=keep;};
const WAGON_SPRITES=new Map();
function wagonCargoType(good){
 if(['holz','bretter'].includes(good))return 'timber';
 if(['stein','erz','eisen','lehm','ziegel','goldstaub'].includes(good))return 'stone';
 if(['getreide','mehl','wolle','hopfen','gewuerz','wachs'].includes(good))return 'sacks';
 if(['bier','wein','most','honig','schnaps','talg','parfuem'].includes(good))return 'barrels';
 return good?'crates':'empty';
}
function wagonSprite(dx,dy,frame,good=null){
 if(dx&&dy)return wagonDiagonalSprite(dx,dy,frame,good);
 const dir=Math.abs(dx)>Math.abs(dy)?(dx<0?'w':'e'):(dy<0?'n':'s'),cargo=wagonCargoType(good),key=dir+':'+frame+':'+cargo;
 if(WAGON_SPRITES.has(key))return WAGON_SPRITES.get(key);
 // Double-resolution pixel drawing, still exactly 20 × 20 world pixels.
 const c=document.createElement('canvas');c.width=c.height=40;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
 const horizontal=dir==='w'||dir==='e',flip=dir==='w'||dir==='n',r=(x,y,w,h,color)=>{g.fillStyle=color;g.fillRect(x,y,w,h);};
 g.translate(20,20);if(flip)g.scale(horizontal?-1:1,horizontal?1:-1);
 const bx=horizontal?-14:-8,by=horizontal?-6:-14,bw=horizontal?19:16,bh=horizontal?13:16;
 r(bx-1,by+bh, bw+2,2,'#27302a55');
 const wheel=(x,y,vertical)=>{
  const w=vertical?3:6,h=vertical?8:3;r(x,y,w,h,'#292a27');r(x+1,y+1,w-2,h-2,'#7d7059');
  r(x+1,y+1,w-2,1,'#a99c7b');r(x+1,y+h-2,w-2,1,'#4b4539');
  r(x+Math.floor(w/2),y+1,1,h-2,'#d0b481');r(x+1,y+Math.floor(h/2),w-2,1,'#c1a573');
  r(x+Math.floor(w/2),y+Math.floor(h/2),1,1,'#424d50');
  if(frame)r(x+1,y+h-2,1,1,'#c5ad81');
 };
 if(horizontal){r(-12,-2,16,2,'#535953');wheel(-12,-8,false);wheel(-1,-8,false);wheel(-12,6,false);wheel(-1,6,false);}
 else{r(-10,-8,20,2,'#535953');wheel(-10,-11,true);wheel(7,-11,true);}
 r(bx,by,bw,bh,'#3a2a1c');r(bx+1,by+1,bw-2,bh-2,'#977245');
 for(let y=by+2;y<by+bh-1;y+=3){r(bx+1,y,bw-2,1,'#b58f5a');r(bx+2,y+1,bw-4,1,'#745430');}
 r(bx+2,by+2,1,bh-4,'#ccb27b');r(bx+bw-3,by+2,1,bh-4,'#6f4d2f');
 // Cargo uses drawn silhouettes, not downscaled UI icons.
 if(cargo==='timber'){
  for(let j=0;j<3;j++){const y=by+3+j*3;r(bx+3,y,bw-6,3,'#57402a');r(bx+3,y,bw-7,1,'#d1ad71');r(bx+4,y+1,bw-8,1,'#9d7543');r(bx+bw-5,y+1,2,2,'#d8b883');r(bx+bw-4,y+1,1,1,'#856137');}
  r(bx+6,by+3,1,9,'#635343');r(bx+bw-7,by+3,1,9,'#635343');
 }else if(cargo==='stone'){
  for(const [x,y,w,h] of [[bx+3,by+4,6,5],[bx+bw-9,by+3,5,5],[bx+5,by+8,7,4]]){r(x+1,y,w-2,h,'#737b76');r(x,y+1,w,h-2,'#8f9690');r(x+1,y,w-2,1,'#b5b6a7');r(x+w-2,y+2,1,h-2,'#555e5b');}
 }else if(cargo==='sacks'){
  for(let j=0;j<2;j++){const x=bx+3+j*6,y=by+3+j;r(x+1,y,4,2,'#796445');r(x,y+2,6,6,'#c0ad7d');r(x+1,y+2,1,5,'#e0ce9c');r(x+4,y+3,1,5,'#98835c');r(x+2,y+1,2,1,'#4b4233');r(x+1,y+8,4,1,'#7a6849');}
 }else if(cargo==='barrels'){
  for(let j=0;j<2;j++){const x=bx+3+j*6,y=by+3;r(x+1,y,4,10,'#63462b');r(x,y+2,6,6,'#a57a45');r(x+1,y+1,4,1,'#d2b179');r(x+1,y+3,1,4,'#c49a5e');r(x,y+3,6,1,'#616964');r(x,y+7,6,1,'#545e5b');r(x+2,y+1,1,1,'#66513a');}
 }else if(cargo==='crates'){
  r(bx+3,by+3,bw-6,bh-6,'#68482c');r(bx+4,by+4,bw-8,bh-8,'#b58f5b');
  for(let y=by+5;y<by+bh-4;y+=3)r(bx+4,y,bw-8,1,'#8f683d');
  r(bx+5,by+4,1,bh-8,'#d4b681');r(bx+bw-6,by+4,1,bh-8,'#d4b681');r(bx+4,by+bh-5,bw-8,1,'#d4b681');
 }
 // Rim, iron corner fittings, nails and two shafts stay visible above the load.
 r(bx,by,bw,2,'#d3b27b');r(bx,by+bh-2,bw,2,'#76502d');
 for(const x of [bx,bx+bw-3]){r(x,by,3,2,'#606964');r(x+1,by,1,1,'#c5c4ac');r(x,by+bh-2,3,2,'#464e48');}
 if(horizontal){r(5,-2,9,1,'#c5a477');r(5,3,9,1,'#795634');r(13,-2,1,6,'#493c2d');
  r(12,-8,4,4,'#caa27b');r(12,-8,4,1,'#806044');r(13,-6,1,1,'#e5c49b');r(12,-4,4,6,'#5b8387');r(12,-3,1,4,'#85a4a0');r(12,1,1,2,'#c49b74');
  r(12-(frame?1:0),2,2,4,'#3a302a');r(15+(frame?1:0),2,2,4,'#3a302a');
 }else{r(-4,2,1,8,'#c5a477');r(3,2,1,8,'#795634');r(-4,9,8,1,'#493c2d');
  r(-2,8,4,4,'#caa27b');r(-2,8,4,1,'#806044');r(-2,12,4,4,'#5b8387');r(-2,12,1,3,'#85a4a0');
  r(-2-(frame?1:0),16,2,4,'#3a302a');r(frame?1:0,16,2,4,'#3a302a');
 }
 WAGON_SPRITES.set(key,c);return c;
}
function wagonDiagonalSprite(dx,dy,frame,good){
 const sx=Math.sign(dx),sy=Math.sign(dy),key=(sx>0?'e':'w')+(sy>0?'s':'n')+':'+frame+':'+wagonCargoType(good);
 if(WAGON_SPRITES.has(key))return WAGON_SPRITES.get(key);
 const base=wagonSprite(1,0,frame,good),pixels=base.getContext('2d').getImageData(0,0,40,40).data;
 const c=document.createElement('canvas');c.width=c.height=40;const g=c.getContext('2d'),image=g.createImageData(40,40);
 const workerColors=new Set(['202,162,123','128,96,68','229,196,155','91,131,135','133,164,160','196,155,116','58,48,42']);
 // Project the cart and its cargo into a diagonal pixel grid. Keep the
 // walking worker upright rather than rotating the entire sprite.
 for(let y=0;y<40;y++)for(let x=0;x<40;x++){
  const px=(x+.5-20)*sx,py=(y+.5-20)*sy,u=(.46*px+.6*py)/.6072,v=(-.46*px+.72*py)/.6072;
  const bx=Math.floor(u+20),by=Math.floor(v+20);if(bx<0||by<0||bx>=40||by>=40)continue;
  const i=(by*40+bx)*4;if(bx>=31&&workerColors.has(pixels[i]+','+pixels[i+1]+','+pixels[i+2]))continue;
  image.data.set(pixels.subarray(i,i+4),(y*40+x)*4);
 }
 g.putImageData(image,0,0);
 const x=Math.round(20+sx*10)-2,y=Math.round(20+sy*6),r=(xx,yy,w,h,color)=>{g.fillStyle=color;g.fillRect(xx,yy,w,h);};
 r(x,y-11,4,4,'#caa27b');r(x,y-11,4,1,'#806044');r(x+1,y-9,1,1,'#e5c49b');
 r(x,y-7,4,6,'#5b8387');r(x,y-6,1,4,'#85a4a0');r(x+3*sx,y-5,1,3,'#c49b74');
 r(x-(frame?1:0),y-1,2,4,'#3a302a');r(x+3+(frame?1:0),y-1,2,4,'#3a302a');
 WAGON_SPRITES.set(key,c);return c;
}
function drawWagon(ctx,px,py,c,alpha=1){ctx.save();ctx.globalAlpha*=alpha;const i=Math.min(c.path.length-2,Math.max(0,Math.floor(c.t))),a=c.path[Math.max(0,i)],b=c.path[Math.min(c.path.length-1,i+1)],dx=b%MAPW-a%MAPW,dy=Math.floor(b/MAPW)-Math.floor(a/MAPW),frame=!WORK_ART.reduced.matches?Math.floor(c.t*4)%2:0;if(UI.sel&&(c.source===UI.sel||c.target===UI.sel)){ctx.strokeStyle='#ffe16a';ctx.lineWidth=1.5;ctx.strokeRect(Math.round(px)-10,Math.round(py)-10,20,20);}ctx.imageSmoothingEnabled=false;ctx.drawImage(wagonSprite(dx,dy,frame,c.col),Math.round(px)-10,Math.round(py)-10,20,20);ctx.restore();}
function drawGoodsRoutes(ctx){const b=G.byId.get(UI.sel);if(!b||def(b).kind!=='prod')return;const paths=G.carts.filter(c=>c.source===b.id||c.target===b.id).map(c=>c.path);for(const good of Object.keys(def(b).out||{})){const target=deliveryTarget(b,good,1)||warehouseTarget(b);if(target)paths.push(target.path);}ctx.save();ctx.strokeStyle='#ffda55';ctx.lineWidth=1.5;ctx.setLineDash([5,4]);ctx.lineDashOffset=-G.time*2;const seen=new Set();for(const path of paths){if(!path?.length)continue;const key=path.join(',');if(seen.has(key))continue;seen.add(key);ctx.beginPath();path.forEach((k,i)=>{const x=(k%MAPW+.5)*16,y=(Math.floor(k/MAPW)+.5)*16;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();}ctx.restore();}
const streetPools=new WeakMap();
function streetPeople(g){let pool=streetPools.get(g);if(!pool||pool.next<=g.time||pool.roads!==g.roads||pool.houses!==g.blds.length){pool={next:g.time+8,roads:g.roads,houses:g.blds.length,people:[]};const homes=g.blds.filter(b=>b.type==='haus'&&b.pop>0&&b.conn),roads=minimapRoadCells(g.road);for(const b of homes){const count=Math.min(10,Math.ceil(b.pop/4));for(let j=0;j<count&&pool.people.length<240;j++){const candidates=ringCells(b).filter(([x,y])=>INMAP(x,y)&&roads.has(IDX(x,y)));if(!candidates.length)continue;const [x,y]=candidates[(b.id+j)%candidates.length];let k=IDX(x,y),prev=-1;const path=[k];for(let n=0;n<7;n++){const neighbours=streetNeighbours(k,g).filter(q=>q!==prev);if(!neighbours.length)break;const next=neighbours[Math.floor(hs(b.id+j,n,g.seed)*neighbours.length)];path.push(next);prev=k;k=next;}if(path.length>1)pool.people.push({path,seed:b.id+j*17});}}streetPools.set(g,pool);}return pool.people;}
function streetNeighbours(k,g=G){return roadNeighbours(k,g);}
function addStreetPeople(x0,y0,x1,y1){for(const g of WORLD?.islands.filter(Boolean)||[G])for(const person of streetPeople(g)){
 const length=person.path.length-1,time=WORK_ART.reduced.matches?0:g.time,phase=(time*.48+person.seed*.27)%(length*2),reverse=phase>length,t=reverse?length*2-phase:phase,i=Math.min(length-1,Math.floor(t)),a=person.path[i],b=person.path[i+1],f=t-i,dx=b%MAPW-a%MAPW,dy=Math.floor(b/MAPW)-Math.floor(a/MAPW);
 const x=(a%MAPW+dx*f+.5)*16,y=(Math.floor(a/MAPW)+dy*f+.5)*16;
 if(x>=x0-8&&x<=x1+8&&y>=y0-8&&y<=y1+8)ENT.push([y+2,5,x,y,person.seed,time*.48*8+person.seed,dx*(reverse?-1:1),dy*(reverse?-1:1)]);
}}
const STREET_PERSON_SPRITES=new Map();
function streetPersonSprite(dx,dy,frame,color=0){
 const key=frame+':'+color;
 if(STREET_PERSON_SPRITES.has(key))return STREET_PERSON_SPRITES.get(key);
 const c=document.createElement('canvas');c.width=2;c.height=8;const g=c.getContext('2d');
 g.fillStyle='#dcad83';g.fillRect(0,0,2,2);
 g.fillStyle=['#7398a3','#ab735a','#929561','#9078a0'][color];g.fillRect(0,2,2,4);
 // Nur die letzten zwei Reihen wechseln. In Ruhe stehen beide Füße.
 g.fillStyle='#3a302a';if(frame===2)g.fillRect(0,6,2,2);else g.fillRect(frame%2,6,1,2);
 STREET_PERSON_SPRITES.set(key,c);return c;
}
function drawStreetPerson(ctx,e){const frame=!WORK_ART.reduced.matches?Math.floor(e[5])%2:2;ctx.drawImage(streetPersonSprite(e[6]||0,e[7]||1,frame,e[4]%4),Math.round(e[2]),Math.round(e[3])-8);}

const streetLoadGame=loadGame;loadGame=function(...args){const ok=streetLoadGame(...args);if(ok)for(const g of WORLD.islands.filter(Boolean)){const split=[];for(const c of g.carts){if(c.qty>CART_CAPACITY){let qty=c.qty;while(qty>1e-9){const n=Math.min(CART_CAPACITY,qty);split.push({...c,path:c.path.slice(),qty:n});qty-=n;}}else split.push(c);}g.carts=split;}return ok;};
