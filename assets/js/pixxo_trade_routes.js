/* Stationsrouten: Frachträume behalten ihre Position über alle Häfen hinweg. */
function emptyTradeSlot(){return {load:null,unload:null};}
function tradeStations(r){
 if(Array.isArray(r.stations))return r.stations;
 const count=SHIPS[WORLD.fleet.find(s=>s.id===r.ship)?.type||'clipper'].slots;
 const slots=(loads,unloads)=>Array.from({length:count},(_,j)=>({load:loads?.[j]?{...loads[j]}:null,unload:unloads?.[j]?{good:unloads[j].good,qty:50}:null}));
 r.stations=[{island:r.from,slots:slots(r.out,r.back)},{island:r.to,slots:slots(r.back,r.out)}];return r.stations;
}
function tradeRouteLabel(r){return tradeStations(r).map(s=>ISLANDS[s.island]?.name||'Unbekannter Hafen').join(' → ');}
function tradeRouteLegs(r){const stations=tradeStations(r);return stations.map((s,j)=>[s.island,stations[(j+1)%stations.length].island]);}
function assignTradeCargoSlots(sh,r){
 const used=new Set();for(const c of sh.cargo){if(Number.isInteger(c.slot)&&c.slot>=0&&c.slot<SHIPS[sh.type].slots&&!used.has(c.slot)){used.add(c.slot);continue;}delete c.slot;}
 const station=tradeStations(r).find(s=>s.island===sh.at);
 for(const c of sh.cargo)if(c.slot===undefined){let j=station?.slots.findIndex((s,j)=>!used.has(j)&&s.load?.good===c.good);if(!(j>=0))j=Array.from({length:SHIPS[sh.type].slots},(_,i)=>i).find(i=>!used.has(i));if(j!==undefined){c.slot=j;used.add(j);}}
}
function beginTradeOperations(sh,station,mode){
 sh.phase=mode;sh.routePending=station.slots.map(s=>s[mode]?.qty||0);
}
function performTradeOperations(sh,r,station,mode){
 const g=WORLD.islands[station.island];let moved=0,blocked=false;
 if(!Array.isArray(sh.routePending))sh.routePending=station.slots.map(s=>s[mode]?.qty||0);
 station.slots.forEach((s,j)=>{
  const order=s[mode],pending=sh.routePending[j]||0;if(!order||!pending)return;
  let c=sh.cargo.find(c=>c.slot===j),n=0;
  if(mode==='unload'){
   if(c?.good!==order.good){sh.routePending[j]=0;return;}
   n=Math.min(pending,c.qty,Math.max(0,islandCap(g)-(g.stock[order.good]||0)));
   c.qty-=n;g.stock[order.good]=(g.stock[order.good]||0)+n;sh.routePending[j]-=n;
   if(!c.qty){sh.cargo=sh.cargo.filter(c=>c.qty>0);sh.routePending[j]=0;}else if(sh.routePending[j]>0)blocked=true;
  }else{
   if(c&&c.good!==order.good){sh.routePending[j]=0;return;}
   const room=50-(c?.qty||0),available=Math.max(0,Math.floor(g.stock[order.good]||0)-(r.reserve||0));
   n=Math.min(pending,room,available);if(n){g.stock[order.good]-=n;if(c)c.qty+=n;else sh.cargo.push({good:order.good,qty:n,slot:j});}
   sh.routePending[j]-=n;if(room===n)sh.routePending[j]=0;else if(sh.routePending[j]>0)blocked=true;
  }
  moved+=n;
 });
 sh.cargo.sort((a,b)=>a.slot-b.slot);return {moved,waiting:blocked&&(mode==='unload'?r.waitForSpace:r.waitForGoods)};
}
function departTradeShip(sh,r,index){
 const station=tradeStations(r)[index];if(!WORLD.islands[station?.island]?.dock||!routeWaterPath(sh.at,station.island)){sh.status='Route unterbrochen: Hafen oder Wasserweg fehlt';sh.remaining=5;return false;}
 sh.to=station.island;sh.routeNextIndex=index;sh.phase='travel';sh.remaining=voyageTime(sh.at,sh.to,sh.type);delete sh.routePending;
 sh.status='Unterwegs nach '+ISLANDS[sh.to].name;return true;
}
function stepTradeShip(sh,r,dt){
 const stations=tradeStations(r);assignTradeCargoSlots(sh,r);if(stations.length<2){sh.status='Route benötigt mindestens zwei Stationen';return;}
 if(sh.remaining>0){sh.remaining=Math.max(0,sh.remaining-dt);if(sh.remaining>0)return;}
 if(sh.phase==='travel'){
  sh.at=sh.to;sh.routeStopIndex=sh.routeNextIndex??stations.findIndex(s=>s.island===sh.at);delete sh.routeNextIndex;delete sh.anchor;
  if(stations[sh.routeStopIndex]?.island!==sh.at)sh.routeStopIndex=stations.findIndex(s=>s.island===sh.at);
  if(sh.routeStopIndex>=0)beginTradeOperations(sh,stations[sh.routeStopIndex],'unload');
 }
 if(r.paused){sh.status='Route pausiert';return;}
 if(!Number.isInteger(sh.routeStopIndex)||stations[sh.routeStopIndex]?.island!==sh.at){sh.routeStopIndex=stations.findIndex(s=>s.island===sh.at);delete sh.routePending;}
 if(sh.routeStopIndex<0){departTradeShip(sh,r,0);return;}
 const station=stations[sh.routeStopIndex];if(!WORLD.islands[station.island]?.dock){sh.status='Route unterbrochen: Hafen fehlt';return;}
 if(sh.phase!=='unload'&&sh.phase!=='load'&&sh.phase!=='depart')beginTradeOperations(sh,station,'unload');
 if(sh.phase==='depart'){departTradeShip(sh,r,(sh.routeStopIndex+1)%stations.length);return;}
 const mode=sh.phase,result=performTradeOperations(sh,r,station,mode);
 if(result.waiting){sh.status=(mode==='unload'?'Wartet auf Lagerplatz in ':'Wartet auf Waren in ')+ISLANDS[sh.at].name;sh.remaining=Math.max(5,result.moved/portSpeed(WORLD.islands[sh.at]));return;}
 if(mode==='unload')beginTradeOperations(sh,station,'load');else{sh.phase='depart';delete sh.routePending;}
 sh.remaining=Math.max(2,result.moved/portSpeed(WORLD.islands[sh.at]));sh.status=(mode==='unload'?'Entlädt in ':'Belädt in ')+ISLANDS[sh.at].name;
}
const stationBaseStepFleet=stepFleet;
stepFleet=function(dt){
 const all=WORLD.fleet,routes=new Map(WORLD.routes.map(r=>[r.id,r])),assigned=all.filter(sh=>routes.has(sh.route));
 WORLD.fleet=all.filter(sh=>!routes.has(sh.route));try{stationBaseStepFleet(dt);}finally{WORLD.fleet=all;}
 for(const sh of assigned)stepTradeShip(sh,routes.get(sh.route),dt);
};
function validateTradeRoute(draft,ship,id){
 if(!ship||ship.buildLeft||ship.manualTrip||ship.expedition!==undefined||ship.route&&ship.route!==id)return 'Dieses Schiff ist bereits im Einsatz.';
 if(draft.stations.length<2||new Set(draft.stations.map(s=>s.island)).size<2)return 'Füge mindestens zwei verschiedene Inseln hinzu.';
 if(!Number.isInteger(draft.reserve)||draft.reserve<0||draft.reserve>500)return 'Der Mindestbestand muss zwischen 0 und 500 t liegen.';
 let orders=0;
 for(let j=0;j<draft.stations.length;j++){
  const station=draft.stations[j],next=draft.stations[(j+1)%draft.stations.length];
  if(!WORLD.islands[station.island]?.dock)return 'Jede Station benötigt ein eigenes Kontor mit Hafen.';
  if(station.island===next.island)return 'Direkt aufeinanderfolgende Stationen müssen unterschiedliche Inseln sein.';
  if(!routeWaterPath(station.island,next.island))return 'Zwischen '+ISLANDS[station.island].name+' und '+ISLANDS[next.island].name+' fehlt ein Wasserweg.';
  if(station.slots.length!==SHIPS[ship.type].slots)return 'Die Zahl der Frachträume passt nicht zum Schiff.';
  for(const slot of station.slots)for(const mode of ['unload','load'])if(slot[mode]){orders++;const o=slot[mode];if(!GN[o.good]||!Number.isInteger(o.qty)||o.qty<1||o.qty>50)return 'Jeder Warenauftrag benötigt eine Menge zwischen 1 und 50 t.';}
 }
 if(!orders)return 'Wähle mindestens einen Lade- oder Entladeauftrag.';
 const origin=ship.route===id&&ship.phase==='travel'?ship.to:ship.at;
 if(!draft.stations.some(s=>s.island===origin)&&!routeWaterPath(origin,draft.stations[0].island))return 'Das Schiff kann den Routenstart nicht erreichen.';
 return null;
}
function commitTradeRoute(draft,id){
 const ship=WORLD.fleet.find(s=>s.id===draft.ship),error=validateTradeRoute(draft,ship,id);if(error)return error;
 let r=WORLD.routes.find(r=>r.id===id);if(!r){r={id:WORLD.nextId++};WORLD.routes.push(r);}
 const sailing=ship.route===r.id&&ship.phase==='travel';
 for(const s of WORLD.fleet)if(s.route===r.id){
  if(s===ship&&sailing){delete s.routePending;delete s.routeStopIndex;delete s.routeNextIndex;continue;}
  if(s.phase==='travel'){const duration=voyageTime(s.at,s.to,s.type),path=routeWaterPath(s.at,s.to);s.manualTrip={path,duration,remaining:s.remaining};s.status='Unterwegs';}else s.status='Im Hafen';
  s.route=null;s.phase='idle';s.remaining=0;for(const c of s.cargo)delete c.slot;delete s.routePending;delete s.routeStopIndex;delete s.routeNextIndex;
 }
 Object.assign(r,JSON.parse(JSON.stringify(draft)),{name:draft.name.trim()||'Handelsroute',paused:false});
 r.from=r.stations[0].island;r.to=r.stations[1].island;r.out=r.stations[0].slots.map(s=>s.load).filter(Boolean);r.back=r.stations[1].slots.map(s=>s.load).filter(Boolean);
 ship.route=r.id;if(!sailing){ship.phase='unload';ship.remaining=0;ship.routeStopIndex=r.stations.findIndex(s=>s.island===ship.at);}delete ship.anchor;delete ship.routePending;assignTradeCargoSlots(ship,r);
 saveGame();return true;
}
/* Eine Route darf im Hafen mit Restladung beendet werden. */
const stationWinAct=winAct;winAct=function(id,ds){
 if(ds.act==='route-delete'){
  const ships=WORLD.fleet.filter(s=>s.route===+ds.id);if(ships.some(s=>s.phase==='travel')){msg('Die Route kann nach der Ankunft im Hafen beendet werden.','i_alert');return;}
  WORLD.routes=WORLD.routes.filter(r=>r.id!==+ds.id);for(const sh of ships){sh.route=null;sh.phase='idle';sh.remaining=0;sh.status='Im Hafen';for(const c of sh.cargo)delete c.slot;delete sh.routePending;delete sh.routeStopIndex;delete sh.routeNextIndex;}
  refreshWins();renderTop(true);saveGame();return;
 }
 stationWinAct(id,ds);
};
