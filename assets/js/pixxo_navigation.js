/* Gemeinsame Navigation für freie Fahrten und Handelsrouten. */
const SEA_STEPS=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,Math.SQRT2],[-1,1,Math.SQRT2],[1,-1,Math.SQRT2],[-1,-1,Math.SQRT2]];
let seaSearch=null;
function seaSearchState(){
 if(!seaSearch||seaSearch.tiles!==G.tiles){const n=MAPW*MAPH;seaSearch={tiles:G.tiles,stamp:new Uint32Array(n),closed:new Uint32Array(n),cost:new Float64Array(n),prev:new Int32Array(n),generation:0};waterRoutes.clear();}
 return seaSearch;
}
function seaStepAllowed(x,y,dx,dy){return INMAP(x+dx,y+dy)&&G.tiles[IDX(x+dx,y+dy)]<=T.SHAL&&(!dx||!dy||(G.tiles[IDX(x+dx,y)]<=T.SHAL&&G.tiles[IDX(x,y+dy)]<=T.SHAL));}
function nearestWater(from,to){
 if(!from||!INMAP(Math.floor(from.x),Math.floor(from.y))||!INMAP(Math.floor(to.x),Math.floor(to.y)))return null;
 if(G.tiles[IDX(Math.floor(from.x),Math.floor(from.y))]>T.SHAL)return null;
 let best=null,distance=Infinity;const x=Math.floor(to.x),y=Math.floor(to.y);
 // Der äußere Ring ist erst beendet, wenn kein näherer Punkt mehr möglich ist.
 for(let r=0;r<Math.max(MAPW,MAPH);r++){
  const candidates=[];
  const consider=(px,py)=>{if(!INMAP(px,py)||G.tiles[IDX(px,py)]>T.SHAL)return;const d=(px-x)**2+(py-y)**2;if(d<distance)candidates.push({x:px,y:py,d});};
  for(let dx=-r;dx<=r;dx++){consider(x+dx,y-r);if(r)consider(x+dx,y+r);}
  for(let dy=-r+1;dy<r;dy++){consider(x-r,y+dy);if(r)consider(x+r,y+dy);}
  candidates.sort((a,b)=>a.d-b.d);
  for(const candidate of candidates){if(candidate.d>=distance)break;const path=seaPath(candidate,from);if(path){distance=candidate.d;best={x:candidate.x,y:candidate.y,path:path.reverse()};break;}}
  if(best&&(r+1)**2>distance)break;
 }
 return best;
}
seaPath=function(from,to){
 if(!from||!to)return null;const sx=Math.floor(from.x),sy=Math.floor(from.y),ex=Math.floor(to.x),ey=Math.floor(to.y);
 if(!INMAP(sx,sy)||!INMAP(ex,ey)||G.tiles[IDX(sx,sy)]>T.SHAL||G.tiles[IDX(ex,ey)]>T.SHAL)return null;
 const s=seaSearchState(),gen=++s.generation,start=IDX(sx,sy),end=IDX(ex,ey),heap=[];
 const heuristic=(x,y)=>{const dx=Math.abs(ex-x),dy=Math.abs(ey-y);return Math.max(dx,dy)+(Math.SQRT2-1)*Math.min(dx,dy);};
 const less=(a,b)=>Math.abs(a[1]-b[1])<1e-8?a[2]<b[2]:a[1]<b[1];
 const push=(k,f,h)=>{const entry=[k,f,h];let i=heap.length;heap.push(entry);while(i){const p=(i-1)>>1;if(!less(entry,heap[p]))break;heap[i]=heap[p];i=p;}heap[i]=entry;};
 const pop=()=>{const root=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let c=i*2+1;if(c+1<heap.length&&less(heap[c+1],heap[c]))c++;if(!less(heap[c],last))break;heap[i]=heap[c];i=c;}heap[i]=last;}return root[0];};
 s.stamp[start]=gen;s.cost[start]=0;s.prev[start]=-1;push(start,heuristic(sx,sy),heuristic(sx,sy));
 while(heap.length){const k=pop();if(s.closed[k]===gen)continue;s.closed[k]=gen;if(k===end){const path=[];for(let p=end;p>=0;p=s.prev[p])path.push([p%MAPW+.5,Math.floor(p/MAPW)+.5]);return path.reverse();}
  const x=k%MAPW,y=Math.floor(k/MAPW);for(const [dx,dy,length] of SEA_STEPS){if(!seaStepAllowed(x,y,dx,dy))continue;const n=IDX(x+dx,y+dy),cost=s.cost[k]+length;if(s.closed[n]===gen||s.stamp[n]===gen&&cost>=s.cost[n])continue;s.stamp[n]=gen;s.cost[n]=cost;s.prev[n]=k;const h=heuristic(x+dx,y+dy);push(n,cost+h,h);}
 }
 return null;
};
const PATH_LENGTHS=new WeakMap();
function seaPathLength(path){if(!path)return 0;if(PATH_LENGTHS.has(path))return PATH_LENGTHS.get(path);let n=0;for(let i=1;i<path.length;i++)n+=Math.hypot(path[i][0]-path[i-1][0],path[i][1]-path[i-1][1]);PATH_LENGTHS.set(path,n);return n;}
routeWaterPath=function(a,b){
 const from=WORLD?.islands[a]?.dock,to=WORLD?.islands[b]?.dock;if(!from||!to)return null;seaSearchState();
 const key=[WORLD.rootSeed,from.x,from.y,to.x,to.y].join(':');if(waterRoutes.has(key))return waterRoutes.get(key);
 const path=seaPath(from,to);waterRoutes.set(key,path);if(path)waterRoutes.set([WORLD.rootSeed,to.x,to.y,from.x,from.y].join(':'),path.slice().reverse());return path;
};
voyageTime=function(a,b,type){return Math.max(35,seaPathLength(routeWaterPath(a,b))/3/SHIPS[type].speed);};
sailShip=function(sh,x,y){
 if(!sh||sh.route||sh.buildLeft>0||sh.expedition!==undefined)return 'Dieses Schiff ist nicht verfügbar.';
 const from=freeShipPosition(sh),target=nearestWater(from,{x,y});if(!target)return 'Hier gibt es keine erreichbare Wasserstelle.';
 const path=target.path;if(!path)return 'Dieses Fahrtziel ist nicht erreichbar.';
 if(path.length===1){delete sh.manualTrip;sh.status='Vor Anker';return true;}
 const duration=Math.max(2,seaPathLength(path)/3/SHIPS[sh.type].speed);sh.manualTrip={path,duration,remaining:duration};sh.status='Unterwegs';soundEffect('ship');renderBar();return true;
};
function interpolatedSeaPosition(path,progress){
 const index=clamp(progress,0,1)*(path.length-1),i=Math.floor(index),a=path[i],b=path[Math.min(i+1,path.length-1)],f=index-i;
 return {x:a[0]+(b[0]-a[0])*f,y:a[1]+(b[1]-a[1])*f,index};
}
freeShipPosition=function(sh){
 if(sh.manualTrip)return interpolatedSeaPosition(sh.manualTrip.path,1-sh.manualTrip.remaining/sh.manualTrip.duration);
 if(sh.route&&sh.phase==='travel'){const path=routeWaterPath(sh.at,sh.to);if(path)return interpolatedSeaPosition(path,1-(sh.remaining||0)/voyageTime(sh.at,sh.to,sh.type));}
 return sh.anchor||WORLD.islands[sh.at]?.dock;
};
shipActivity=function(sh){
 if(sh.buildLeft>0)return ['i_prod','Im Bau'];if(sh.expedition!==undefined)return ['i_quest','Gründung'];
 if(sh.route)return ['i_route',WORLD.routes.find(r=>r.id===sh.route)?.paused?'Route pausiert':'Auf Handelsroute'];
 return sh.manualTrip?['i_sailing','In Bewegung']:['i_anchor','Stehend'];
};
/* Drei bewusst unterschiedliche, auch textlich benannte Zustandszeichen. */
for(const [name,text] of [['i_sailing','➜'],['i_anchor','⚓'],['i_route','⇄']]){const c=document.createElement('canvas');c.width=c.height=24;const g=c.getContext('2d');g.fillStyle='#ffe3a0';g.font='bold 22px Segoe UI Symbol';g.textAlign='center';g.textBaseline='middle';g.fillText(text,12,12);SP[name]=c;urlC[name]=c.toDataURL();}
const navigationRenderBar=renderBar;renderBar=function(){navigationRenderBar();if(UI.barMode==='fleet')for(const sh of WORLD.fleet){const button=document.querySelector(`[data-select-ship="${sh.id}"]`);if(!button)continue;const text=(sh.name||SHIPS[sh.type].n)+' · '+shipActivity(sh)[1];button.setAttribute('aria-label',text);button.title=text;}};
const navigationRenderTop=renderTop;renderTop=function(...args){navigationRenderTop(...args);if(UI.barMode==='fleet')renderBar();};
const navigationRouteForm=routeForm;routeForm=function(id){
 navigationRouteForm(id);const form=$('#routeform');if(!form)return;
 const preview=document.createElement('p');preview.className='route-preview';preview.setAttribute('aria-live','polite');form.prepend(preview);
 const update=()=>{const from=+form.elements.from.value,to=+form.elements.to.value,sh=WORLD.fleet.find(s=>s.id===+form.elements.ship.value);preview.textContent=from===to?'Wähle zwei verschiedene Häfen.':`${ISLANDS[from].name} ⇄ ${ISLANDS[to].name} · ${SHIPS[sh.type].slots} Frachträume je Richtung · Entladung automatisch am Ziel`;};
 form.addEventListener('change',update);update();
};
const navigationDetails=shipHTML;shipHTML=function(){const h=navigationDetails(),sh=WORLD.fleet.find(s=>s.id===UI.selectedShip);if(!sh)return h;return h+`<div class="sect">Routenplanung</div><button class="btn primary" data-act="ship-plan-route" ${sh.buildLeft||sh.manualTrip||sh.expedition!==undefined?'disabled':''}>${sh.route?'Handelsroute bearbeiten':'Handelsroute einrichten'}</button><p class="small">Zwei besiedelte Inseln mit Kontor und ein freies Schiff im Hafen werden benötigt. Waren und Mengen legst du für jede Fahrtrichtung fest.</p>`;};
const navigationWinAct=winAct;winAct=function(id,ds){if(ds.act==='ship-plan-route'){const sh=WORLD.fleet.find(s=>s.id===UI.selectedShip);if(sh)routeForm(sh.route||null);return;}navigationWinAct(id,ds);};

/* Entdeckung ist sofort und dauerhaft; keine verzögerte Inselblende. */
updateFog=function(dt){
 if(!WORLD?.fog)return;fogClock+=dt;if(fogClock<.2)return;fogClock=0;
 for(const sh of WORLD.fleet){if(sh.buildLeft>0)continue;const p=freeShipPosition(sh);if(!p)continue;revealSea(p.x,p.y);
  const radius=23;
  for(let y=Math.max(0,Math.floor(p.y-radius));y<Math.min(MAPH,p.y+radius);y++)for(let x=Math.max(0,Math.floor(p.x-radius));x<Math.min(MAPW,p.x+radius);x++){
   const k=IDX(x,y),i=islandOwners[k];if(i<0||WORLD.fog.islands[i]||G.tiles[k]<T.SAND||Math.hypot(x+.5-p.x,y+.5-p.y)>radius)continue;
   WORLD.fog.islands[i]=true;fogFades.delete(i);fogDirty=true;PERF_FOG.miniDirty=true;PERF_FOG.chunks.clear();UI.viewedIsland=i;renderIslandFacts();
  }
 }
};
renderIslandFacts=function(){
 const el=$('#islandfacts'),i=UI.viewedIsland??activeIsland;if(!el||!ISLANDS[i])return;
 if(WORLD.fog&&!WORLD.fog.islands[i]){el.innerHTML='';el._last=null;return;}
 const m=ISLANDS[i],deposits=WORLD.islands[i]?.deposits||unsettledDeposits(i),goods=[...m.fert.map(k=>[k,GN[k].n]),...(['mine','steinbruch','lehmgrube'].filter(type=>deposits.some(n=>n.type===type)).map(type=>type==='mine'?['erz','Eisenerz']:type==='lehmgrube'?['lehm','Lehm']:['stein','Stein']))];
 const h=`<button class="factsummary" data-facts aria-label="Ressourcen auf ${attr(m.name)}. Abbauplätze öffnen"><strong>${esc(m.name)}</strong>${goods.map(([k,n])=>`<span class="factitem">${ic(k,1)}<span>${esc(n)}</span></span>`).join('')||'<span>Keine besonderen Vorkommen</span>'}</button>`;
 if(el._last!==h&&!el.contains(document.activeElement)){el.innerHTML=h;el._last=h;}
};

/* Pixelraster, Holzpalette und helle Segel passen zur vorhandenen Weltgrafik. */
const MARITIME_SHIP_FRAMES=6,MARITIME_SHIP_CACHE=new Map();
makeDirectionalShip=function(dir,type,frame=0){
 dir=((dir%8)+8)%8;type=type==='clipper'?'clipper':'schooner';frame=((frame%6)+6)%6;
 const key=type+':'+dir+':'+frame;if(MARITIME_SHIP_CACHE.has(key))return MARITIME_SHIP_CACHE.get(key);
 const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
 const angle=dir*Math.PI/4,dx=Math.cos(angle),dy=Math.sin(angle)*.65,nx=-Math.sin(angle),ny=Math.cos(angle)*.65,clipper=type==='clipper',length=clipper?24:20,width=clipper?7:6,swell=[0,1,2,1,0,-1][frame];
 const point=(u,v,z=0)=>[Math.round(32+dx*u+nx*v),Math.round(44+dy*u+ny*v-z)];
 const dot=(p,color)=>{g.fillStyle=color;g.fillRect(p[0],p[1],1,1);};
 const line=(a,b,color)=>{let [x,y]=a;const [bx,by]=b,ax=Math.abs(bx-x),ay=-Math.abs(by-y),sx=x<bx?1:-1,sy=y<by?1:-1;let error=ax+ay;for(;;){dot([x,y],color);if(x===bx&&y===by)break;const e=2*error;if(e>=ay){error+=ay;x+=sx;}if(e<=ax){error+=ax;y+=sy;}}};
 // Scan-converted polygons have solid native pixels, never blurred edges.
 const polygon=(points,color)=>{const minY=Math.max(0,Math.min(...points.map(p=>p[1]))),maxY=Math.min(63,Math.max(...points.map(p=>p[1])));g.fillStyle=color;
  for(let y=minY;y<=maxY;y++){const cuts=[];for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>y+.5)!==(b[1]>y+.5))cuts.push(a[0]+(y+.5-a[1])*(b[0]-a[0])/(b[1]-a[1]));}cuts.sort((a,b)=>a-b);for(let i=0;i+1<cuts.length;i+=2){const start=Math.max(0,Math.ceil(cuts[i]-.5)),end=Math.min(64,Math.ceil(cuts[i+1]-.5));if(end>start)g.fillRect(start,y,end-start,1);}}
 };
 const poly=(points,color,z=0)=>polygon(points.map(([u,v])=>point(u,v,z)),color),edge=(points,color,z=0)=>points.forEach((p,i)=>line(point(...p,z),point(...points[(i+1)%points.length],z),color));
 const hull=[[-length,-width+1],[-length+5,-width],[length-6,-width],[length+2,0],[length-6,width],[-length+5,width],[-length,width-1]];
 poly(hull,'#294e61',-5);poly(hull,'#352a25',-4);poly(hull,'#61412e',-3);poly(hull,'#92623b',-1);poly(hull,'#c39a63');edge(hull,'#46382a');
 const deck=[[-length+2,-width+2],[-length+5,-width+1],[length-7,-width+1],[length,0],[length-7,width-1],[-length+5,width-1],[-length+2,width-2]];
 poly(deck,clipper?'#b99b68':'#bfa16b');
 for(let v=-width+2;v<width-1;v+=2)line(point(-length+4,v),point(length-8,v),'#9a794d');
 for(let u=-length+5;u<length-6;u+=5)for(const v of [-width+2,width-2]){line(point(u,v,-2),point(u+2,v,-2),'#322b28');dot(point(u,v,-1),'#d5b47a');}
 for(const v of [-width,width]){line(point(-length+4,v,1),point(length-7,v,1),'#e2c28a');for(let u=-length+4;u<length-5;u+=5)line(point(u,v),point(u,v,2),'#705034');}
 // A raised stern cabin, hatch grate, and barrels on the working deck.
 const stern=-length+5;
 poly([[stern-2,-3],[stern+4,-3],[stern+4,3],[stern-2,3]],'#684b33',1);
 for(const v of [-3,3])line(point(stern-2,v,1),point(stern-2,v,5),'#49382a');
 poly([[stern-2,-3],[stern+4,-3],[stern+4,3],[stern-2,3]],'#d8b578',5);edge([[stern-2,-3],[stern+4,-3],[stern+4,3],[stern-2,3]],'#957343',5);
 for(const u of [stern,stern+2])dot(point(u,width>6?3:2,3),'#364d50');
 poly([[-2,-2],[3,-2],[3,2],[-2,2]],'#6c5438',1);for(let u=-1;u<3;u++)line(point(u,-1,2),point(u,1,2),'#b49360');
 for(const u of [-length+11,length-9]){const [x,y]=point(u,2,2);g.fillStyle='#5e4432';g.fillRect(x-1,y-1,3,3);g.fillStyle='#bc8e55';g.fillRect(x-1,y-1,3,1);dot([x,y+1],'#e0b571');}
 line(point(length-4,0,2),point(length+5,0,4),'#c3a370');
 const masts=(clipper?[-12,0,12]:[-6,7]).sort((a,b)=>point(a,0)[1]-point(b,0)[1]);
 for(const u of masts){const height=clipper?(u===0?32:27):(u<0?27:23),foot=point(u,0),top=point(u,0,height);
  for(const anchor of [-length+3,length-3])line(top,point(anchor,0),'#76664d');for(const v of [-width+1,width-1])line(point(u,0,height-8),point(u,v),'#897553');
  line(foot,top,'#3f3227');line(point(u,0,1),point(u,0,height-1),'#b39159');
  if(clipper){
   const sailPoint=(v,z)=>{const p=point(u,v,z);p[0]+=Math.round(v*dx*.7);return p;};
   for(const [z,span,depth] of [[height-4,5,7],[height-13,7,9]]){
    const sail=[sailPoint(-span,z),sailPoint(span,z),sailPoint(span+swell*.3,z-depth+1),sailPoint(swell*.4,z-depth-1),sailPoint(-span,z-depth+1)];
    polygon(sail,'#c6bb94');line(sail[0],sail[1],'#66543d');polygon([sailPoint(-span+1,z-1),sailPoint(span-1,z-1),sailPoint(span-1+swell*.3,z-depth+2),sailPoint(swell*.4,z-depth),sailPoint(-span+1,z-depth+2)],'#eee1b9');
    line(sailPoint(-span+2,z-2),sailPoint(-span+2,z-depth+2),'#fff0cd');line(sailPoint(span-2,z-2),sailPoint(span-2,z-depth+2),'#d7c99f');
   }
  }else{
   const sailPoint=(offset,v,z)=>{const p=point(u+offset,v,z);p[0]+=Math.round(offset*Math.abs(Math.sin(angle))*.65);return p;};
   const sail=[sailPoint(0,0,height-2),sailPoint(8,1+swell*.35,height-9),sailPoint(8,1+swell*.35,7),sailPoint(0,0,8)];polygon(sail,'#c2b58e');
   polygon([sailPoint(1,0,height-4),sailPoint(7,1+swell*.35,height-9),sailPoint(7,1+swell*.35,9),sailPoint(1,0,10)],'#eee0b8');line(sailPoint(2,0,height-6),sailPoint(2,0,11),'#fff0cb');line(sail[0],sail[1],'#685740');
  }
  const flutter=[0,0,1,1,-1,-1][frame],flag=[top,[top[0]+6,top[1]+swell],[top[0]+5+flutter,top[1]+3+swell],[top[0]+1,top[1]+2+flutter]];polygon(flag,clipper?'#477f91':'#a45140');line(flag[0],flag[1],clipper?'#88b7bd':'#df9970');
 }
 // Triangular jib from the forward mast to the bowsprit.
 polygon([point(length-8,0,19),point(length+5,0,4),point(length-8,0,7)],'#d4c69f');line(point(length-7,0,17),point(length+3,0,5),'#f6e7bf');
 MARITIME_SHIP_CACHE.set(key,c);return c;
};
for(const type of ['schooner','clipper'])for(let dir=0;dir<8;dir++)SHIP_SPRITES[type][dir]=makeDirectionalShip(dir,type);
drawShipSprite=function(ctx,p,dir,type){const frame=WORK_ART.reduced.matches?0:Math.floor(G.time*3)%MARITIME_SHIP_FRAMES;ctx.drawImage(makeDirectionalShip(dir||0,type,frame),Math.round(p.x*16)-32,Math.round(p.y*16)-48);};
const OCEAN_FRAMES=12,OCEAN_SPRITES=new Map();
function oceanSprite(frame){
 frame=((frame%OCEAN_FRAMES)+OCEAN_FRAMES)%OCEAN_FRAMES;if(OCEAN_SPRITES.has(frame))return OCEAN_SPRITES.get(frame);
 const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),image=g.createImageData(128,128),phase=frame*Math.PI*2/OCEAN_FRAMES;
 for(let y=0;y<128;y++)for(let x=0;x<128;x++){
  const a=x*Math.PI*2/128,b=y*Math.PI*2/128,depth=Math.sin(a*2+b)*Math.cos(b*2-a)*3,ripple=Math.sin(a*8+b*3-phase)+Math.sin(b*7-a*2+phase)*.5;
  const crest=Math.max(0,ripple-1.1)*18,noise=(hs(x,y,913)-.5)*3,i=(y*128+x)*4;
  image.data[i]=27+depth+ripple*2+crest*.7+noise;image.data[i+1]=88+depth*1.6+ripple*4+crest+noise;image.data[i+2]=139+depth+ripple*4+crest*.8+noise;image.data[i+3]=255;
 }
 g.putImageData(image,0,0);
 // Short, irregular glints swell and fade on a seamless periodic surface.
 for(let i=0;i<55;i++){const x=Math.floor(hs(i,2,925)*128),y=Math.floor(hs(i,3,925)*128),pulse=(Math.sin(phase+hs(i,4,925)*Math.PI*2)+1)/2,length=2+Math.floor(pulse*4),drift=Math.round(Math.sin(phase+hs(i,5,925)*6)*2);g.fillStyle=pulse>.75?'#75b2c2':pulse>.35?'#508fae':'#397ba3';for(let k=0;k<length;k++)g.fillRect((x+k+128)%128,(y+drift+128)%128,1,1);}
 OCEAN_SPRITES.set(frame,c);return c;
}
function drawOcean(ctx,x0,y0,x1,y1){const frame=WORK_ART.reduced.matches?0:Math.floor(G.time*3)%OCEAN_FRAMES;ctx.fillStyle=pats[frame]||(pats[frame]=ctx.createPattern(oceanSprite(frame),'repeat'));ctx.fillRect(x0,y0,x1-x0,y1-y0);}
function drawBeachSurf(ctx,tx0,ty0,tx1,ty1){
 const time=WORK_ART.reduced.matches?0:G.time;ctx.save();
 for(let y=ty0;y<=ty1;y++)for(let x=tx0;x<=tx1;x++){if(G.tiles[IDX(x,y)]!==T.SAND)continue;
  for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]){const nx=x+dx,ny=y+dy;if(!INMAP(nx,ny)||G.tiles[IDX(nx,ny)]>T.SHAL)continue;
   // Phase follows the coastline, not individual tile seeds, to avoid seams.
   const along=dx?y:x,phase=(time*.16+along*.027)%1,reach=Math.sin(phase*Math.PI)*5,alpha=Math.sin(phase*Math.PI)*.55;
   if(alpha<.025)continue;ctx.globalAlpha=alpha;ctx.fillStyle='#cbe5d8';
   for(let i=0;i<16;i++){const wobble=Math.round(Math.sin((along*16+i)*.22)*.6),distance=Math.round(reach)+wobble;
    const px=dx===1?(x+1)*16-distance:dx===-1?x*16+distance:x*16+i,py=dy===1?(y+1)*16-distance:dy===-1?y*16+distance:y*16+i;
    ctx.fillRect(px,py,dx?1:1+Number(i%5===0),dy?1:1+Number(i%5===0));
    if(i%3!==0){ctx.globalAlpha=alpha*.3;ctx.fillRect(px+dx*2,py+dy*2,1,1);ctx.globalAlpha=alpha;}
   }
  }
 }ctx.restore();
}
function shipyardLaunchPoint(yard,g=G,ignoreId=null){
 const side=pixxoCoastSide(yard.x,yard.y,yard.w,yard.h);if(!side)return null;
 const [dx,dy]={north:[0,-1],east:[1,0],south:[0,1],west:[-1,0]}[side],center={x:yard.x+yard.w/2+dx*(yard.w/2+2),y:yard.y+yard.h/2+dy*(yard.h/2+2)},candidates=[];
 for(let y=Math.floor(center.y)-3;y<=Math.ceil(center.y)+3;y++)for(let x=Math.floor(center.x)-3;x<=Math.ceil(center.x)+3;x++)if(INMAP(x,y)&&g.tiles[IDX(x,y)]<=T.SHAL&&!g.occ[IDX(x,y)]){
  const p={x:x+.5,y:y+.5};if((WORLD.fleet||[]).some(sh=>sh.id!==ignoreId&&!sh.buildLeft&&freeShipPosition(sh)&&Math.hypot(freeShipPosition(sh).x-p.x,freeShipPosition(sh).y-p.y)<1.5))continue;candidates.push(p);
 }
 candidates.sort((a,b)=>Math.hypot(a.x-center.x,a.y-center.y)-Math.hypot(b.x-center.x,b.y-center.y));
 return candidates.find(p=>!g.dock||seaPath(g.dock,p))||null;
}
const yardBuildShip=buildShip;
buildShip=function(type){
 const selected=G.byId.get(UI.sel),yard=selected?.type==='werft'?selected:G.blds.find(b=>b.type==='werft'&&b.conn&&!b.paused&&!b.fire);
 if(!yard||!yard.conn||yard.paused||yard.fire)return 'Eine angeschlossene Segelschiffwerft wird benötigt.';
 const anchor=shipyardLaunchPoint(yard);if(!anchor)return 'Vor der Werft ist kein freier, erreichbarer Liegeplatz.';
 const result=yardBuildShip(type);if(result===true){const sh=WORLD.fleet[WORLD.fleet.length-1];sh.yardId=yard.id;sh.anchor=anchor;}return result;
};
const yardStepFleet=stepFleet;
stepFleet=function(dt){const building=(WORLD?.fleet||[]).filter(sh=>sh.buildLeft>0);yardStepFleet(dt);for(const sh of building)if(sh.buildLeft<=0){const g=WORLD.islands[sh.at],yard=g?.byId.get(sh.yardId);if(yard){const anchor=shipyardLaunchPoint(yard,g,sh.id);if(anchor)sh.anchor=anchor;}sh.status='Vor Anker';}};
const SHIP_HIT_PIXELS=new WeakMap();
function shipAtWorldPoint(x,y){
 for(const sh of [...(WORLD?.fleet||[])].reverse()){if(sh.buildLeft>0)continue;const p=freeShipPosition(sh);if(!p)continue;
  const sprite=makeDirectionalShip(sh.heading||0,sh.type,WORK_ART.reduced.matches?0:Math.floor(G.time*3)%MARITIME_SHIP_FRAMES),sx=Math.floor(x-(Math.round(p.x*16)-32)),sy=Math.floor(y-(Math.round(p.y*16)-48));
  if(sx>=0&&sx<64&&sy>=0&&sy<64){let pixels=SHIP_HIT_PIXELS.get(sprite);if(!pixels){pixels=sprite.getContext('2d').getImageData(0,0,64,64).data;SHIP_HIT_PIXELS.set(sprite,pixels);}if(pixels[(sy*64+sx)*4+3]>0)return sh;}
  if(64*UI.sc/UI.DR<24&&Math.hypot(x-p.x*16,y-p.y*16)<12*UI.DR/UI.sc)return sh;
 }return null;
}
const maritimeClickTile=clickTile;
clickTile=function(t){if(!UI.tool){const sh=shipAtWorldPoint(t.worldX??(t.x+.5)*16,t.worldY??(t.y+.5)*16);if(sh){selectB(null);selectShip(sh.id);return;}}maritimeClickTile(t);};
drawFleet=function(ctx){
 const a=scr2w(0,0),b=scr2w(innerWidth,innerHeight);
 for(const sh of WORLD?.fleet||[]){if(sh.buildLeft>0)continue;const p=freeShipPosition(sh);if(!p||p.x*16<a.x-64||p.x*16>b.x+64||p.y*16<a.y-64||p.y*16>b.y+64)continue;
  const path=sh.manualTrip?.path||(sh.route&&sh.phase==='travel'?routeWaterPath(sh.at,sh.to):null);if(path)sh.heading=headingForPath(path,p.index||0);drawShipSprite(ctx,p,sh.heading||0,sh.type);
 }
};

/* Übersichtsdetail verhindert das Verdrängen hunderter Terrainkacheln pro Frame. */
const detailedLandRegion=drawLandRegion;
drawLandRegion=function(ctx,x0,y0,x1,y1){
 if(!land||land._tiles!==G.tiles)buildLand();
 if(UI.z<.45){nativeDrawImage.call(ctx,mmBase,x0/16,y0/16,(x1-x0)/16,(y1-y0)/16,x0,y0,x1-x0,y1-y0);return;}
 detailedLandRegion(ctx,x0,y0,x1,y1);
};
const detailedWorldFog=drawWorldFog;
drawWorldFog=function(ctx,x0,y0,x1,y1){
 if(UI.z>=.45){detailedWorldFog(ctx,x0,y0,x1,y1);return;}
 const image=prepareFog();if(image)nativeDrawImage.call(ctx,image,0,0,MAPW*16,MAPH*16);
 ctx.fillStyle=nightFogEdgeColor();if(x0<0)ctx.fillRect(x0,y0,-x0,y1-y0);if(y0<0)ctx.fillRect(0,y0,MAPW*16,-y0);if(x1>MAPW*16)ctx.fillRect(MAPW*16,y0,x1-MAPW*16,y1-y0);if(y1>MAPH*16)ctx.fillRect(0,MAPH*16,MAPW*16,y1-MAPH*16);
};
/* Gebäudeverweise bleiben gültig bei Bewegung; Neubauten und Laden erneuern die Liste. */
let buildingListCache={world:null,states:[],list:[]};
worldBuildings=function(){
 if(!WORLD)return G.blds;
 if(buildingListCache.world!==WORLD||WORLD.islands.some((g,i)=>buildingListCache.states[i]?.array!==g?.blds||buildingListCache.states[i]?.length!==g?.blds.length)){
  buildingListCache={world:WORLD,states:WORLD.islands.map(g=>({array:g?.blds,length:g?.blds.length})),list:WORLD.islands.filter(Boolean).flatMap(g=>g.blds)};
 }
 return buildingListCache.list;
};
