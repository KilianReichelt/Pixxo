/* CPU-Versorgung und reale, getrennt gespeicherte Nachbarflotten. */
function cpuDemand(g){const demand={};for(const b of g.blds)if(b.type==='haus')for(const [good,rate] of Object.entries(houseRates(b)))demand[good]=(demand[good]||0)+rate*Math.max(1,b.pop);return demand;}
const cpuBaseReserve=cpuReserve;cpuReserve=function(g,good){return Math.max(cpuBaseReserve(g,good),Math.ceil((cpuDemand(g)[good]||0)*5));};
function cpuSupplyBuilding(good,amount,visited=new Set()){
 if(visited.has(good))return null;visited.add(good);
 const producers=Object.entries(B).filter(([type,d])=>d.kind==='prod'&&d.out?.[good]&&cpuCanDevelop(type)&&(!d.fertility||islandMeta().fert.includes(d.fertility))).sort((a,b)=>(BUILD_TIER[a[0]]||1)-(BUILD_TIER[b[0]]||1));
 for(const [type,d] of producers){for(const [input,n] of Object.entries(d.in||{})){if((G.stock[input]||0)<n*3){const prerequisite=cpuSupplyBuilding(input,amount*n/(d.out[good]||1),new Set(visited));if(prerequisite)return prerequisite;}}
  const capacity=G.blds.filter(b=>b.type===type&&!b.paused&&b.fire<=0).reduce((n,b)=>n+d.out[good]*60/d.cycle*(b.eff||0),0),count=G.blds.filter(b=>b.type===type).length;
  if(!count||capacity<amount*1.2&&count<6)return type;
 }return null;
}
function cpuNeedsDecision(){
 const homes=G.blds.filter(b=>b.type==='haus');
 for(const b of homes){for(const service of TIERS[b.tier].svc){if(b.cov?.[service])continue;const type=Object.keys(B).find(type=>B[type].svc===service);if(type&&G.blds.filter(s=>s.type===type).length<4&&(cpuBuild(type)||CPU_BUILD_JOBS.has(G)))return true;}}
 const demand=cpuDemand(G),shortages=Object.entries(demand).filter(([good,amount])=>(G.stock[good]||0)<amount*3).sort((a,b)=>(G.stock[a[0]]||0)/a[1]-(G.stock[b[0]]||0)/b[1]);
 for(const [good,amount] of shortages){const type=cpuSupplyBuilding(good,amount);if(type&&(cpuBuild(type)||CPU_BUILD_JOBS.has(G)))return true;}
 return false;
}
const supplyCPUDecision=cpuDecision;cpuDecision=function(){if(!CPU_BUILD_JOBS.has(G)&&cpuNeedsDecision())return;supplyCPUDecision();};
// In einer Versorgungslücke kauft die CPU regulär Waren zum Händlerpreis,
// begrenzt durch ihren eigenen Goldvorrat; keine kostenlos erzeugten Waren.
function cpuBuyShortages(g){const demand=cpuDemand(g);for(const [good,amount] of Object.entries(demand)){const reserve=Math.max(2,Math.ceil(amount*2)),missing=Math.max(0,reserve-(g.stock[good]||0)),price=GN[good].v*1.2,qty=Math.min(missing,Math.max(0,(g.gold-600)/price));if(qty>0){g.stock[good]=(g.stock[good]||0)+qty;g.gold-=qty*price;g.cnt.buy+=qty*price;}}}
function cpuOwnedIslands(name){return WORLD.islands.filter(g=>g?.cpu?.name===name);}
function cpuPlayerIslandCount(){return WORLD.islands.filter(g=>g&&!g.cpu).length;}
function cpuShipPosition(sh){if(sh.manualTrip)return freeShipPosition(sh);if(sh.route&&sh.phase==='travel'){const path=routeWaterPath(sh.at,sh.to);if(path?.length){const p=path[Math.floor(clamp(1-sh.remaining/voyageTime(sh.at,sh.to,sh.type),0,1)*(path.length-1))];return {x:p[0],y:p[1]};}}return sh.anchor||WORLD.islands[sh.at]?.dock;}
function cpuTryExpansion(g){
 if(!g.dock)return;const name=g.cpu.name,owned=cpuOwnedIslands(name),limit=cpuPlayerIslandCount();if(limit<2||owned.length>=limit||g!==owned[0]||g.cpu.age<(g.cpu.nextExpansion||300)||(WORLD.cpuFleet||[]).some(sh=>sh.cpuOwner===name&&sh.cpuExpansion))return;
 g.cpu.nextExpansion=g.cpu.age+180;if(g.gold<4000||(g.stock.bretter||0)<10||(g.stock.werkzeug||0)<8)return;
 const free=ISLANDS.map((m,i)=>({m,i})).filter(({i})=>!WORLD.islands[i]).sort((a,b)=>b.m.size-a.m.size);
 for(const {m,i} of free){for(const site of m.beaches||[]){const size=B.kontor,candidates=[[site.x+size.w/2,site.y-1],[site.x+size.w,site.y+size.h/2],[site.x+size.w/2,site.y+size.h],[site.x-1,site.y+size.h/2]];for(const target of candidates){const path=seaPath(g.dock,{x:target[0],y:target[1]});if(!path)continue;const duration=Math.max(2,seaPathLength(path)/3/SHIPS.schooner.speed),sh={id:WORLD.nextId++,name:name+' · Entdecker',type:'schooner',at:g.island,cpuOwner:name,cargo:[{good:'bretter',qty:10,slot:0},{good:'werkzeug',qty:8,slot:1}],phase:'idle',remaining:0,status:'Auf Koloniefahrt',manualTrip:{path,duration,remaining:duration},cpuExpansion:{island:i,site,budget:1800}};g.stock.bretter-=10;g.stock.werkzeug-=8;g.gold-=2300;(WORLD.cpuFleet??=[]).push(sh);return;}}}
}
function cpuCompleteExpansion(sh){const trip=sh.cpuExpansion;if(!trip)return;if(WORLD.islands[trip.island]||cpuOwnedIslands(sh.cpuOwner).length>=cpuPlayerIslandCount()){const parent=cpuOwnedIslands(sh.cpuOwner)[0];if(parent)parent.gold+=trip.budget;delete sh.cpuExpansion;sh.status='Koloniefahrt abgebrochen';return;}
 const current=G,index=activeIsland;let colony=null;try{activeIsland=trip.island;newGame(WORLD.rootSeed+trip.island*913,1,WORLD.board);G.cpu={name:sh.cpuOwner,decision:0,age:0};G.gold=trip.budget;G.quests={};G.gotStart=true;G.startGoodsDelivered=true;const g=G;withCPU(g,()=>{const result=place('kontor',trip.site.x,trip.site.y);if(!result.ok)return;for(const c of sh.cargo)g.stock[c.good]=(g.stock[c.good]||0)+c.qty;sh.cargo=[];g.gotStart=true;g.startGoodsDelivered=true;cpuRoadHub(result.b);rebuildNet();colony=g;});if(colony){WORLD.islands[trip.island]=colony;sh.at=trip.island;sh.anchor=colony.dock;sh.status='Im Hafen';trip.budget=0;}}
 finally{G=current;activeIsland=index;}
 if(!colony){const parent=cpuOwnedIslands(sh.cpuOwner)[0];if(parent)parent.gold+=trip.budget;}delete sh.cpuExpansion;
}
function cpuCreateSupplyRoute(sh){if(sh.route||sh.manualTrip||sh.cpuExpansion)return;const islands=cpuOwnedIslands(sh.cpuOwner);if(islands.length<2)return;const home=islands[0],colony=islands.find(g=>g.island===sh.at&&g!==home)||islands[1];if(!routeWaterPath(home.island,colony.island))return;
 const demand=cpuDemand(colony),goods=colony.blds.filter(b=>b.type==='haus').length<3?['holz','bretter']:Object.keys(demand).sort((a,b)=>(colony.stock[a]||0)/(demand[a]||1)-(colony.stock[b]||0)/(demand[b]||1)).slice(0,2);if(!goods.length)goods.push('fisch','schnaps');const exports=Object.keys(colony.stock).filter(id=>(colony.stock[id]||0)>cpuReserve(colony,id)+5).slice(0,2),slots=(load,unload)=>Array.from({length:2},(_,j)=>({load:load[j]?{good:load[j],qty:10}:null,unload:unload[j]?{good:unload[j],qty:50}:null}));
 const route={id:WORLD.nextId++,cpuOwner:sh.cpuOwner,name:sh.cpuOwner+' · Versorgung',ship:sh.id,ships:[sh.id],reserve:5,waitForSpace:false,waitForGoods:false,stations:[{island:home.island,slots:slots(goods,exports)},{island:colony.island,slots:slots(exports,goods)}]};(WORLD.cpuRoutes??=[]).push(route);sh.route=route.id;sh.phase='unload';sh.remaining=0;delete sh.anchor;
}
function cpuRefreshSupplyRoute(sh,route){const home=WORLD.islands[route.stations[0].island],colony=WORLD.islands[route.stations[1].island];if(!home?.cpu||!colony?.cpu||sh.at!==home.island||sh.phase!=='unload'||sh.remaining>0)return;const demand=cpuDemand(colony),wanted=(colony.stock.holz||0)<30?['holz','bretter']:Object.keys(demand).sort((a,b)=>(colony.stock[a]||0)/(demand[a]||1)-(colony.stock[b]||0)/(demand[b]||1)).slice(0,2);if(!wanted.length)wanted.push('fisch','schnaps');for(let j=0;j<2;j++){const good=sh.cargo.find(c=>c.slot===j)?.good||wanted[j];route.stations[0].slots[j].load=good?{good,qty:10}:null;route.stations[1].slots[j].unload=good?{good,qty:50}:null;}}
function cpuFleetStep(dt){WORLD.cpuFleet??=[];WORLD.cpuRoutes??=[];for(const sh of WORLD.cpuFleet){if(sh.manualTrip){const t=sh.manualTrip;t.remaining=Math.max(0,t.remaining-dt);if(!t.remaining){const p=t.path.at(-1);sh.anchor={x:p[0],y:p[1]};delete sh.manualTrip;cpuCompleteExpansion(sh);}}else if(sh.route){const route=WORLD.cpuRoutes.find(r=>r.id===sh.route);if(route){cpuRefreshSupplyRoute(sh,route);stepTradeShip(sh,route,dt);}else sh.route=null;}else cpuCreateSupplyRoute(sh);const parent=cpuOwnedIslands(sh.cpuOwner)[0];if(parent)parent.gold-=SHIPS[sh.type].upk*dt/60;}}
const expansionStepWorld=stepWorld;stepWorld=function(dt){if(startDialog.open||!tutorialPanel.hidden||StartScreen.loading)return;expansionStepWorld(dt);for(const g of WORLD.islands){if(!g?.cpu)continue;g.cpu.supplyClock=(g.cpu.supplyClock||0)+dt;if(g.cpu.supplyClock>=20){g.cpu.supplyClock%=20;cpuBuyShortages(g);withCPU(g,()=>cpuTryExpansion(g));}}cpuFleetStep(dt);};
const cpuVisibleFleet=drawFleet;drawFleet=function(ctx){const fleet=WORLD.fleet;WORLD.fleet=fleet.concat(WORLD.cpuFleet||[]);try{return cpuVisibleFleet(ctx);}finally{WORLD.fleet=fleet;}};
