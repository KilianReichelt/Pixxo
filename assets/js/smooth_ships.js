/* Freie Kurse, aufrechte Segel, Liegeplätze und tiefenabhängige Bodenschatten. */
const SMOOTH_SEA_PATHS=new WeakMap(),SMOOTH_SHIP_STATE=new WeakMap(),SHIP_BED_SHADOWS=new Map();
function smoothSeaWater(x,y,margin=0){
 for(const [dx,dy] of margin?[[0,0],[-margin,0],[margin,0],[0,-margin],[0,margin]]:[[0,0]]){const tx=Math.floor(x+dx),ty=Math.floor(y+dy);if(!INMAP(tx,ty)||G.tiles[IDX(tx,ty)]>T.SHAL||G.bridges?.[IDX(tx,ty)]?.pier)return false;}return true;
}
function smoothSeaLine(a,b){const n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*6));for(let i=0;i<=n;i++){const t=i/n;if(!smoothSeaWater(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,.18))return false;}return true;}
function smoothSeaGeometry(path){
 let entry=SMOOTH_SEA_PATHS.get(path);if(entry?.board===G.tiles)return entry;
 if(!path?.length)return null;const simple=[path[0]];
 for(let i=0;i<path.length-1;){let next=i+1;const limit=path.berthApproach&&i<path.length-2?path.length-2:path.length-1;for(let j=Math.min(limit,i+80);j>i+1;j--)if(smoothSeaLine(path[i],path[j])){next=j;break;}simple.push(path[next]);i=next;}
 const points=[simple[0]];
 for(let i=1;i<simple.length-1;i++){
  const a=simple[i-1],b=simple[i],c=simple[i+1],ab=Math.hypot(b[0]-a[0],b[1]-a[1]),bc=Math.hypot(c[0]-b[0],c[1]-b[1]),r=Math.min(1.2,ab*.32,bc*.32);
  const p=[b[0]+(a[0]-b[0])*r/ab,b[1]+(a[1]-b[1])*r/ab],q=[b[0]+(c[0]-b[0])*r/bc,b[1]+(c[1]-b[1])*r/bc],curve=[p];
  for(let j=1;j<=12;j++){const t=j/12;curve.push([(1-t)**2*p[0]+2*t*(1-t)*b[0]+t*t*q[0],(1-t)**2*p[1]+2*t*(1-t)*b[1]+t*t*q[1]]);}
  if(curve.every((v,j)=>!j||smoothSeaLine(curve[j-1],v)))points.push(...curve);else points.push(b);
 }
 if(simple.length>1)points.push(simple.at(-1));const lengths=[0];for(let i=1;i<points.length;i++)lengths.push(lengths.at(-1)+Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]));
 entry={board:G.tiles,points,lengths,length:lengths.at(-1)};SMOOTH_SEA_PATHS.set(path,entry);return entry;
}
function smoothSeaSample(geometry,distance){const {points,lengths,length}=geometry,d=Math.max(0,Math.min(length,distance));let lo=0,hi=lengths.length-1;while(lo+1<hi){const m=(lo+hi)>>1;if(lengths[m]<=d)lo=m;else hi=m;}const a=points[lo],b=points[Math.min(lo+1,points.length-1)],span=(lengths[lo+1]??0)-lengths[lo],t=span>0?(d-lengths[lo])/span:0;return {x:a[0]+(b[0]-a[0])*t,y:a[1]+(b[1]-a[1])*t};}
interpolatedSeaPosition=function(path,progress){const geometry=smoothSeaGeometry(path);if(!geometry)return null;const t=Math.max(0,Math.min(1,progress)),distance=t*geometry.length,p=smoothSeaSample(geometry,distance),a=smoothSeaSample(geometry,distance-.08),b=smoothSeaSample(geometry,distance+.08);return {...p,index:t*(path.length-1),heading8:Math.atan2(b.y-a.y,b.x-a.x)*4/Math.PI};};
headingForPath=function(path,index){return interpolatedSeaPosition(path,path.length>1?index/(path.length-1):0)?.heading8||0;};
// Der vorhandene Zeichner projiziert den Rumpf im Raum; Segelmasten bleiben senkrecht.
const smoothDirectionalShip=makeDirectionalShip;
makeDirectionalShip=function(dir,type,frame=0){const quantized=Math.round(((dir%8+8)%8)*32)/32;const image=smoothDirectionalShip(quantized,type,frame);while(MARITIME_SHIP_CACHE.size>512)MARITIME_SHIP_CACHE.delete(MARITIME_SHIP_CACHE.keys().next().value);return image;};
function smoothBerthGeometry(island){
 const g=WORLD.islands[island],port=g?.blds.find(b=>b.type==='kontor');if(!port)return null;const plan=typeof coastPierPlanFor==='function'?coastPierPlanFor(port):null,side=plan?.side||gameCoastSide(port.x,port.y,port.w,port.h);if(!side)return null;const cells=plan?.cells||gamePierCells(port,side);if(!cells.length)return null;
 const [dx,dy]={north:[0,-1],east:[1,0],south:[0,1],west:[-1,0]}[side],mid=cells[Math.floor(cells.length/2)],center={x:mid[0]+.5+dx*.55,y:mid[1]+.5+dy*.55};return {center,dx,dy,heading8:Math.atan2(dy,dx)*4/Math.PI};
}
function smoothPortShips(island){const dock=WORLD.islands[island]?.dock;return [...WORLD.fleet,...(WORLD.cpuFleet||[])].filter(s=>!s.buildLeft&&!s.manualTrip&&s.expedition===undefined&&(s.routeApproach?.island===island||!s.routeApproach&&(s.at===island&&s.phase!=='travel'&&(!s.anchor||dock&&Math.hypot(s.anchor.x-dock.x,s.anchor.y-dock.y)<5)||s.to===island&&s.phase==='travel'))).sort((a,b)=>a.id-b.id);}
function smoothBerth(sh,island){
 const geometry=smoothBerthGeometry(island);if(!geometry)return null;const ships=smoothPortShips(island),used=new Set();
 // Bestehende Reservierungen bleiben erhalten, wenn das Nachbarschiff ablegt.
 for(const s of ships){s.berths??={};const slot=s.berths[island];if((slot===0||slot===1)&&!used.has(slot))used.add(slot);else delete s.berths[island];}
 for(const s of ships)if(s.berths[island]===undefined){const free=[0,1].find(n=>!used.has(n));if(free!==undefined){s.berths[island]=free;used.add(free);}}
 const slot=sh.berths?.[island],waiting=slot===undefined,rank=Math.max(0,ships.filter(s=>s.berths?.[island]===undefined).findIndex(s=>s.id===sh.id)),side=slot===0?-1:1,{center,dx,dy}=geometry;
 let p=waiting?{x:center.x+dx*(5+Math.floor(rank/2)*3)-dy*(rank%2?3:-3),y:center.y+dy*(5+Math.floor(rank/2)*3)+dx*(rank%2?3:-3)}:{x:center.x-dy*side*1.15,y:center.y+dx*side*1.15};
 if(!smoothSeaWater(p.x,p.y,.25)){
  // Ungewöhnlich enge Häfen verwenden die nächste freie Wasserstelle auf derselben Seite.
  let best=null;for(let f=0;f<6&&!best;f++)for(let across=0;across<5;across++){const q={x:p.x+dx*f-dy*side*across*.5,y:p.y+dy*f+dx*side*across*.5};if(smoothSeaWater(q.x,q.y,.35))best=q;}if(!best)return null;p=best;
 }
 return {...p,heading8:geometry.heading8,waiting,dx,dy};
}
const SMOOTH_BERTH_PATHS=new WeakMap();
function smoothBerthPath(path,sh,island){const berth=smoothBerth(sh,island);if(!berth||!path?.length)return path;let cache=SMOOTH_BERTH_PATHS.get(path);if(!cache){cache=new Map();SMOOTH_BERTH_PATHS.set(path,cache);}const key=sh.id+':'+berth.x+':'+berth.y;if(cache.has(key))return cache.get(key);
 const approach=[berth.x-berth.dx*1.6,berth.y-berth.dy*1.6],end=[berth.x,berth.y];let result=path;
 for(let i=Math.max(0,path.length-12);i<path.length;i++)if(smoothSeaLine(path[i],approach)&&smoothSeaLine(approach,end)){result=path.slice(0,i+1).concat([approach,end]);break;}
 if(result===path&&smoothSeaLine(path.at(-1),end))result=path.concat([end]);
 const start=sh.berths?.[sh.at]!==undefined?smoothBerth(sh,sh.at):null;
 if(start){const first=[start.x,start.y];for(let i=1;i<Math.min(12,result.length);i++)if(smoothSeaLine(first,result[i])){result=[first,...result.slice(i)];break;}}
 if(result!==path)result.berthApproach=true;cache.set(key,result);return result;
}
const smoothOldPosition=freeShipPosition;
freeShipPosition=function(sh){
 let p,path,progress,berth=null;const residual=typeof simulationAccumulator==='number'?Math.max(0,simulationAccumulator)*(G.speed||0):0;
 if(sh.routeApproach){const t=sh.routeApproach;path=smoothBerthPath(t.path,sh,t.island);progress=1-Math.max(0,t.remaining-residual)/t.duration;}
 else if(sh.manualTrip){const t=sh.manualTrip;path=t.path;progress=1-Math.max(0,t.remaining-residual)/t.duration;}
 else if(sh.route&&sh.phase==='travel'){path=routeWaterPath(sh.at,sh.to);if(path)path=smoothBerthPath(path,sh,sh.to);progress=1-Math.max(0,(sh.remaining||0)-residual)/voyageTime(sh.at,sh.to,sh.type);}
 if(path)p=interpolatedSeaPosition(path,progress);else{
  berth=!sh.buildLeft&&sh.expedition===undefined&&smoothPortShips(sh.at).includes(sh)?smoothBerth(sh,sh.at):null;p=berth||smoothOldPosition(sh);
 }
 if(!p)return p;const time=UI.vt||0;let state=SMOOTH_SHIP_STATE.get(sh);if(!state){state={angle:p.heading8??sh.heading??0,time,p};SMOOTH_SHIP_STATE.set(sh,state);}
 if(berth){const goal=berth.x+':'+berth.y;
  if(state.dockGoal&&state.dockGoal!==goal&&Math.hypot(state.p.x-p.x,state.p.y-p.y)>.2){let approach;if(smoothSeaLine([state.p.x,state.p.y],[p.x,p.y]))approach=[[state.p.x,state.p.y],[p.x,p.y]];else if(typeof seaPath==='function'){approach=seaPath(state.p,p);if(approach?.length){approach[0]=[state.p.x,state.p.y];approach[approach.length-1]=[p.x,p.y];}}
   if(approach?.length)state.dockApproach={path:approach,start:G.time||0,duration:Math.max(1,smoothSeaGeometry(approach).length/2)};
  }state.dockGoal=goal;
  if(state.dockApproach){const a=state.dockApproach,t=((G.time||0)+residual-a.start)/a.duration;if(t>=1)delete state.dockApproach;else p=interpolatedSeaPosition(a.path,t);}
 }else{delete state.dockGoal;delete state.dockApproach;}
 const dt=Math.max(0,Math.min(.1,time-state.time)),target=p.heading8??state.angle,delta=((target-state.angle+12)%8)-4;
 if(dt>0){state.angle+=Math.max(-dt*2.4,Math.min(dt*2.4,delta));state.time=time;}
 state.p={...p,heading8:state.angle};return state.p;
};
const smoothSailShip=sailShip;sailShip=function(sh,x,y){const from=freeShipPosition(sh),result=smoothSailShip(sh,x,y);if(result===true&&sh.manualTrip){const path=sh.manualTrip.path;if(from&&smoothSeaLine([from.x,from.y],path[1]||path[0]))path[0]=[from.x,from.y];const target=[Number.isInteger(x)?x+.5:x,Number.isInteger(y)?y+.5:y];if(smoothSeaLine(path[Math.max(0,path.length-2)],target))path[path.length-1]=target;SMOOTH_SEA_PATHS.delete(path);}return result;};
const smoothStepFleet=stepFleet;stepFleet=function(dt){const fleet=WORLD.fleet,waiting=fleet.filter(s=>s.route&&s.phase!=='travel'&&!s.manualTrip&&(smoothBerth(s,s.at)?.waiting||SMOOTH_SHIP_STATE.get(s)?.dockApproach));for(const s of waiting)s.status=SMOOTH_SHIP_STATE.get(s)?.dockApproach?'Legt am Kontor an':'Wartet auf freien Liegeplatz';if(!waiting.length)return smoothStepFleet(dt);WORLD.fleet=fleet.filter(s=>!waiting.includes(s));try{return smoothStepFleet(dt);}finally{WORLD.fleet=fleet;}};
function smoothShipBedShadow(ctx,p,type){
 if(typeof GAME_EFFECTS!=='undefined'&&!GAME_EFFECTS.shipShadows||UI.z<.7||typeof GAME_WATER_DEPTH==='undefined')return;
 const depth=Math.max(2,GAME_WATER_DEPTH.sample(p.x,p.y));if(depth>=15)return;const hour=dayMinutes()/60,sun=Math.max(0,Math.sin((hour-6)/12*Math.PI)),rain=typeof weatherRainAmount==='function'?weatherRainAmount():0,alpha=.5*Math.exp(-depth*.09)*Math.max(0,1-depth/15)*sun*(1-rain*.65);if(alpha<.015)return;
 const bin=Math.round((p.heading8||0)*8),soft=Math.min(9,3+Math.floor(depth*.5)),key=type+':'+bin+':'+soft;let image=SHIP_BED_SHADOWS.get(key);
 if(!image){image=document.createElement('canvas');image.width=80;image.height=64;const c=image.getContext('2d'),pixels=c.createImageData(80,64),angle=bin/8*Math.PI/4,dx=Math.cos(angle),dy=Math.sin(angle),length=type==='clipper'?24:20;
  for(let y=0;y<64;y++)for(let x=0;x<80;x++){const px=x-40,py=(y-32)/.65,u=px*dx+py*dy,v=-px*dy+py*dx,tip=Math.max(0,1-Math.max(0,u-length*.45)/(length*.65)),width=(type==='clipper'?7:6)*Math.min(1,tip),edge=Math.min(length+2-Math.abs(u),width-Math.abs(v)),t=Math.max(0,Math.min(1,(edge+soft)/(soft*2))),a=t*t*(3-2*t);if(a){const k=(y*80+x)*4;pixels.data[k]=13;pixels.data[k+1]=35;pixels.data[k+2]=51;pixels.data[k+3]=Math.round(a*255);}}
  c.putImageData(pixels,0,0);SHIP_BED_SHADOWS.set(key,image);if(SHIP_BED_SHADOWS.size>128)SHIP_BED_SHADOWS.delete(SHIP_BED_SHADOWS.keys().next().value);
 }
 const angle=(hour-6)/12*Math.PI,offset=depth*5.5,x=p.x*16-Math.cos(angle)*offset*.75+offset*.25-40,y=p.y*16+offset*.8-36;
 ctx.save();ctx.beginPath();for(let ty=Math.floor(y/16);ty<=Math.ceil((y+64)/16);ty++)for(let tx=Math.floor(x/16);tx<=Math.ceil((x+80)/16);tx++)if(INMAP(tx,ty)&&G.tiles[IDX(tx,ty)]<=T.SHAL)ctx.rect(tx*16,ty*16,16,16);ctx.clip();ctx.globalAlpha=alpha;nativeDrawImage.call(ctx,image,x,y);ctx.restore();
}
const smoothOldShipDrawing=drawShipSprite;drawShipSprite=function(ctx,p,dir,type,color=null){const heading=p.heading8??dir;smoothShipBedShadow(ctx,p,type);smoothOldShipDrawing(ctx,p,heading,type,color);};
