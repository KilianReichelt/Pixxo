/* Zwei unabhängige Nachbarn bauen auf freien Inseln und verkaufen reale Überschüsse. */
let CPU_WORK=false;
const CPU_NAMES=['Mara von Linden','Jonas Hafenfeld'];
function withCPU(g,fn){const current=G,index=activeIsland,work=CPU_WORK,hook=MSGHOOK,highest=WORLD.highestTier,fieldOwner=UI.fieldOwner,tool=UI.tool,rotation=UI.rotation,sound=soundEffect,save=saveGame,top=renderTop,wins=refreshWins;try{CPU_WORK=true;G=g;activeIsland=g.island;MSGHOOK=()=>{};soundEffect=()=>{};saveGame=()=>{};renderTop=()=>{};refreshWins=()=>{};UI.tool=null;UI.rotation=0;return fn();}finally{G=current;activeIsland=index;CPU_WORK=work;MSGHOOK=hook;soundEffect=sound;saveGame=save;renderTop=top;refreshWins=wins;WORLD.highestTier=highest;UI.fieldOwner=fieldOwner;UI.tool=tool;UI.rotation=rotation;}}
function initCPUIslands(){if(!WORLD||WORLD.cpuInitialized)return;WORLD.cpuInitialized=true;let n=0;const free=ISLANDS.map((m,i)=>({m,i})).filter(({i})=>!WORLD.islands[i]).sort((a,b)=>b.m.size-a.m.size||b.i-a.i);for(const {i} of free){if(n>=2)break;const current=G,index=activeIsland;try{activeIsland=i;newGame(WORLD.rootSeed+i*913,1,WORLD.board);G.cpu={name:CPU_NAMES[n],decision:0,age:0};G.gold=5000;G.quests={};const state=G;const result=withCPU(state,()=>{const sites=ISLANDS[i].beaches||[];for(const site of sites){if(!canPlace('kontor',site.x,site.y).ok)continue;const result=place('kontor',site.x,site.y);if(result.ok){Object.assign(G.stock,{holz:60,bretter:60,stein:15,werkzeug:10,fisch:25,schnaps:20,tuch:15});G.gotStart=true;G.startGoodsDelivered=true;const center=ISLANDS[i];const hub=ringCells(result.b).filter(([x,y])=>roadTileAllowed(x,y)).sort((a,b)=>Math.hypot(a[0]-center.wx,a[1]-center.wy)-Math.hypot(b[0]-center.wx,b[1]-center.wy))[0];if(hub){G.cpu.hub=IDX(...hub);placeRoad(...hub);}rebuildNet();return true;}}return false;});if(result){WORLD.islands[i]=state;n++;}}finally{G=current;activeIsland=index;}}}
function cpuPreservesRoadCorners(x,y,w,h){for(const [a,b] of footprintCells(x,y,w,h))for(const dx of [-1,1])for(const dy of [-1,1])if(INMAP(a+dx,b)&&INMAP(a,b+dy)&&G.road[IDX(a+dx,b)]&&G.road[IDX(a,b+dy)])return false;return true;}
function cpuRoadHub(port){if(Number.isInteger(G.cpu.hub)&&G.road[G.cpu.hub])return G.cpu.hub;const cells=ringCells(port).filter(([x,y])=>roadTileAllowed(x,y));const existing=cells.find(([x,y])=>G.road[IDX(x,y)]),site=existing||cells[0];if(!site)return null;G.cpu.hub=IDX(...site);if(!existing)placeRoad(...site);return G.cpu.hub;}
// Der Ausbau folgt der stärksten eigenen Siedlung; Unterhalt und Versorgung laufen weiter.
function cpuProgress(g){
 const homes=g.blds.filter(b=>b.type==='haus'),production=new Set(g.blds.filter(b=>B[b.type]?.kind==='prod').map(b=>b.type));
 const population=homes.reduce((n,b)=>n+b.pop,0),tier=Math.max(1,...homes.map(b=>b.tier));
 return {homes:homes.length,population,tier,production,score:homes.length*2+population*.12+production.size*4+(tier-1)*20};
}
function cpuPace(g){
 const own=(WORLD?.islands||[]).filter(g=>g&&!g.cpu).map(cpuProgress).sort((a,b)=>b.score-a.score),player=own[0]||{homes:0,population:0,tier:1,production:new Set(),score:0},cpu=cpuProgress(g);
 const ceiling=Math.max(24,player.score*1.15+12),behind=cpu.score<player.score*.8;
 return {player,cpu,ceiling,homeLimit:Math.max(3,Math.min(32,Math.ceil(player.homes*1.15)+2)),interval:behind?8:cpu.score>ceiling?45:20};
}
function cpuCanDevelop(type){
 const pace=cpuPace(G),{player,cpu}=pace;
 if(type==='haus')return cpu.homes<pace.homeLimit;
 if((BUILD_TIER[type]||B[type]?.workforce?.tier||1)>player.tier)return false;
 if(B[type]?.kind==='prod'&&!player.production.has(type)&&!cpu.production.has(type)&&cpu.production.size>=player.production.size+3)return false;
 return true;
}
const CPU_BUILD_JOBS=new WeakMap(),CPU_BUILD_SCAN_BUDGET=96;
function cpuBuild(type){
 if(CPU_BUILD_JOBS.has(G)&&CPU_BUILD_JOBS.get(G).type!==type)return false;
 if(!cpuCanDevelop(type)){if(CPU_BUILD_JOBS.get(G)?.type===type)CPU_BUILD_JOBS.delete(G);return false;}
 const retries=G.cpu.retries??={};if(retries[type]>G.cpu.age)return false;
 const d=B[type];if(!d||!canAfford(d.cost)){if(CPU_BUILD_JOBS.get(G)?.type===type)CPU_BUILD_JOBS.delete(G);return false;}
 const essential=['haus','markt','holzfaeller','saegewerk','fischer','feuer','kartoffelhof','brennerei','steinbruch','lager'].includes(type);
 if(!essential&&G.gold<(d.cost.gold||0)+1200){CPU_BUILD_JOBS.delete(G);return false;}
 const port=G.blds.find(b=>b.type==='kontor');if(!port){CPU_BUILD_JOBS.delete(G);return false;}
 let job=CPU_BUILD_JOBS.get(G);
 if(job&&job.type!==type)return false;
 if(!job){const meta=ISLANDS[activeIsland];job={type,port:port.id,sites:[],x0:Math.max(meta.ox+2,port.x-30),x1:Math.min(meta.ox+ISLAND_SIZE-2,port.x+32),y0:Math.max(meta.oy+2,port.y-30),y1:Math.min(meta.oy+ISLAND_SIZE-2,port.y+32),cursor:0,index:0,endpoint:0,nextAt:0};
  if(['mine','steinbruch','lehmgrube'].includes(type)){job.sites=G.deposits.filter(n=>n.type===type&&!nodeUsed(n)).map(n=>({...n}));job.scanned=true;}
  CPU_BUILD_JOBS.set(G,job);
 }
 if(job.port!==port.id){CPU_BUILD_JOBS.delete(G);return false;}
 const now=performance.now();if(now<job.nextAt)return false;job.nextAt=now+16;
 if(!job.scanned){
  const width=job.x1-job.x0,total=width*(job.y1-job.y0);let budget=CPU_BUILD_SCAN_BUDGET;
  while(job.cursor<total&&budget-->0&&performance.now()-now<3){
   const x=job.x0+job.cursor%width,y=job.y0+Math.floor(job.cursor/width);job.cursor++;
   if(!canPlace(type,x,y).ok)continue;let resource=0;
   if(d.env)for(let dy=-d.env.r;dy<=d.env.r;dy+=2)for(let dx=-d.env.r;dx<=d.env.r;dx+=2){const nx=Math.floor(x+d.w/2+dx),ny=Math.floor(y+d.h/2+dy);if(!INMAP(nx,ny))continue;const k=IDX(nx,ny);if(d.env.t==='tree'&&G.tiles[k]===T.FOREST||d.env.t==='fish'&&G.fish[k]||d.env.t==='rock'&&[T.ROCK,T.ORE].includes(G.tiles[k]))resource++;}
   job.sites.push({x,y,score:Math.hypot(x-port.x,y-port.y)-Math.min(28,resource*1.5)+footprintCells(x,y,d.w,d.h).filter(([x,y])=>G.tiles[IDX(x,y)]===T.FOREST).length*2});
  }
  if(job.cursor<total)return false;job.scanned=true;
 }
 if(!job.sorted){job.sites.sort((a,b)=>(a.score??Math.hypot(a.x-port.x,a.y-port.y))-(b.score??Math.hypot(b.x-port.x,b.y-port.y)));job.sites=job.sites.slice(0,80);job.sorted=true;return false;}
 let budget=CPU_BUILD_SCAN_BUDGET;
 while(job.index<job.sites.length&&budget-->0){
  const site=job.sites[job.index],mock={x:site.x,y:site.y,w:d.w,h:d.h};
  if(!canPlace(type,site.x,site.y).ok||!cpuPreservesRoadCorners(site.x,site.y,d.w,d.h)){job.index++;job.endpoint=0;continue;}
  const cells=footprintCells(mock.x,mock.y,mock.w,mock.h).map(([x,y])=>IDX(x,y));
  const endpoints=ringCells(mock).filter(([x,y])=>roadTileAllowed(x,y)&&!cells.includes(IDX(x,y))).sort((a,b)=>Math.hypot(a[0]-cx(port),a[1]-cy(port))-Math.hypot(b[0]-cx(port),b[1]-cy(port))).slice(0,4);
  if(job.endpoint>=endpoints.length){job.index++;job.endpoint=0;continue;}
  const [x,y]=endpoints[job.endpoint++];let path;const occupied=cells.map(k=>G.occ[k]);
  for(const k of cells)G.occ[k]=-1;
  // Existing limit is 36 path nodes; allow 35 diagonal segments as well.
  try{const hub=cpuRoadHub(port);path=hub===null?null:plannedRoadPath({x:hub%MAPW,y:Math.floor(hub/MAPW)},{x,y},activeIsland,35*Math.SQRT2);}
  finally{cells.forEach((k,i)=>G.occ[k]=occupied[i]);}
  if(path&&path.length<=36&&path.every(k=>!cells.includes(k))&&G.gold>=(d.cost.gold||0)+path.filter(k=>!G.road[k]).length*ROAD_COST){
   const result=place(type,site.x,site.y);if(result.ok){for(const k of path)placeRoad(k%MAPW,Math.floor(k/MAPW));rebuildNet();delete retries[type];CPU_BUILD_JOBS.delete(G);return result.b;}
  }
  return false; // At most one bounded route search per slice.
 }
 CPU_BUILD_JOBS.delete(G);retries[type]=G.cpu.age+90;return false;
}
const CPU_FIELD_SEARCHES=new WeakMap(),CPU_FIELD_SEARCH_BUDGET=96;
function cpuFields(){
 let budget=CPU_FIELD_SEARCH_BUDGET;
 for(const owner of G.blds){
  const rule=FIELD_RULES[owner.type],count=rule?fieldModules(owner).length:0;if(!rule||count>=rule.count)continue;
  UI.fieldOwner=owner.id;const d=B[rule.type];let search=CPU_FIELD_SEARCHES.get(owner);
  const stamp=owner.x+':'+owner.y+':'+count;
  if(!search||search.stamp!==stamp){
   const sites=[];for(let y=owner.y-10;y<=owner.y+owner.h+10;y++)for(let x=owner.x-10;x<=owner.x+owner.w+10;x++)sites.push({x,y,distance:Math.max(Math.abs(x-cx(owner)),Math.abs(y-cy(owner)))});
   sites.sort((a,b)=>a.distance-b.distance||a.y-b.y||a.x-b.x);search={stamp,sites,cursor:0};CPU_FIELD_SEARCHES.set(owner,search);
  }
  if(search.retryAt>(G.cpu?.age||0))continue;
  while(search.cursor<search.sites.length&&budget-->0){
   const {x,y}=search.sites[search.cursor++];if(!INMAP(x,y)||!INMAP(x+d.w-1,y+d.h-1))continue;
   const cells=footprintCells(x,y,d.w,d.h);if(cells.some(([a,b])=>G.occ[IDX(a,b)]||G.road[IDX(a,b)]||G.tiles[IDX(a,b)]===T.FOREST))continue;
   if(canPlace(rule.type,x,y).ok&&cpuPreservesRoadCorners(x,y,d.w,d.h)){const result=place(rule.type,x,y);if(result.ok){G.dirty=true;return true;}}
  }
  if(search.cursor>=search.sites.length){search.cursor=0;search.retryAt=(G.cpu?.age||0)+60;}
  if(budget<=0)return false;
 }
 return false;
}
function cpuDecision(){const count=type=>G.blds.filter(b=>b.type===type).length,homes=count('haus'),population=totalPop(),age=G.cpu.age;
 if(CPU_BUILD_JOBS.has(G))return;
 for(const b of G.blds)if(b.type==='ruine'&&!b.ruinField&&canAfford(ruinRebuildCost(b))&&rebuildRuin(b))return;
 if(G.cpu.age>220&&!count('feuer')&&(cpuBuild('feuer')||CPU_BUILD_JOBS.has(G)))return;
 if(cpuFields())return;
 if(G.blds.some(b=>b.fire>0)&&!count('feuer')&&(cpuBuild('feuer')||CPU_BUILD_JOBS.has(G)))return;
 const pace=cpuPace(G);if(pace.cpu.score>pace.ceiling)return;
 const goals=[['haus',Math.min(6,pace.homeLimit)],['markt',1],['holzfaeller',1],['saegewerk',1],['fischer',2],['haus',Math.min(28,pace.homeLimit)],['kartoffelhof',1],['brennerei',1],['steinbruch',1],['schaefer',1],['weberei',1],['farm',1],['muehle',1],['baeckerei',1],['kapelle',1],['feuer',1],['rinderhof',1],['gerberei',1],['schuster',1],['lager',1],['mine',1],['schmelze',1],['schmiede',1],['imkerei',1],['kerzenzieherei',1],['kirche',1],['hopfen',1],['brauerei',1],['weingut',1],['kelterei',1]];
 for(const [type,desired] of goals){if(count(type)>=desired||B[type].fertility&&!islandMeta().fert.includes(B[type].fertility))continue;if(cpuBuild(type)||CPU_BUILD_JOBS.has(G))return;}
 for(const b of G.blds.filter(b=>b.type==='haus'&&b.tier<pace.player.tier)){const r=nextTierReq(b);const staff=workforceFor(G);if(r?.ok&&canAfford(r.cost)&&staff.supply[b.tier]-Math.ceil(b.pop)>=staff.demand[b.tier]*.85){upgradeHouse(b);return;}}
 if(population>30&&G.blds.filter(b=>def(b).kind==='prod'&&b.staffEff<.8).length&&homes<32)cpuBuild('haus');
}
const cpuStepWorld=stepWorld;stepWorld=function(dt){cpuStepWorld(dt);const speed=G.speed;for(const g of WORLD.islands){if(!g?.cpu)continue;withCPU(g,()=>{g.speed=speed;g.cpu.age+=dt;g.cpu.decision+=dt;step(dt);const pending=CPU_BUILD_JOBS.get(g);if(pending)cpuBuild(pending.type);const interval=cpuPace(g).interval;if(g.cpu.decision>=interval){g.cpu.decision%=interval;cpuDecision();}g.cpu.tradeClock=(g.cpu.tradeClock||0)+dt;if(g.cpu.tradeClock>=20){g.cpu.tradeClock%=20;for(const good of GOODS){const excess=Math.max(0,(g.stock[good.id]||0)-cpuReserve(g,good.id)-25),qty=Math.min(2,excess);if(qty>0){g.stock[good.id]-=qty;g.gold+=qty*good.v*.6;}}}});}};
const cpuCheckQuests=checkQuests;checkQuests=function(...args){if(!G.cpu)return cpuCheckQuests(...args);};
const cpuAfterNewWorld=afterNewWorld;afterNewWorld=function(...args){const result=cpuAfterNewWorld(...args);initCPUIslands();return result;};
const cpuActivateIsland=activateIsland;activateIsland=function(i){return WORLD.islands[i]?.cpu?false:cpuActivateIsland(i);};
const cpuCanPlace=canPlace;canPlace=function(...args){return G.cpu&&!CPU_WORK?{ok:false,why:'Diese Insel gehört einem anderen Siedler.'}:cpuCanPlace(...args);};
const cpuDemolish=demolishAt;demolishAt=function(x,y){return WORLD.islands[islandAt(x,y)]?.cpu&&!CPU_WORK?'Diese Insel gehört einem anderen Siedler.':cpuDemolish(x,y);};
const cpuMove=canMoveBuilding;canMoveBuilding=function(b,...args){return WORLD.islands[b?.island]?.cpu&&!CPU_WORK?{ok:false,why:'Dieses Gebäude gehört einem anderen Siedler.'}:cpuMove(b,...args);};
const cpuUpgrade=upgradeRequest;upgradeRequest=function(b){return WORLD.islands[b?.island]?.cpu&&!CPU_WORK?null:cpuUpgrade(b);};
const cpuClick=clickTile;clickTile=function(t){const i=islandAt(t.x,t.y),state=WORLD.islands[i];if(!state?.cpu)return cpuClick(t);if(UI.tool){msg('Diese Insel gehört '+state.cpu.name+'.','i_alert');return;}if(WORLD.fog&&!WORLD.fog.islands[i])return;UI.viewedIsland=i;const b=G.byId.get(G.occ[IDX(t.x,t.y)]);if(b?.type==='kontor')openCPUTrade(i);else openWin_island();};
function cpuReserve(g,good){return good==='bretter'?15:good==='holz'?20:good==='werkzeug'?5:good==='stein'?8:['fisch','brot','tuch','bier','wein'].includes(good)?5:2;}
function cpuOffers(g){return GOODS.map(good=>({good:good.id,qty:Math.max(0,Math.floor((g.stock[good.id]||0)-cpuReserve(g,good.id))),price:Math.ceil(good.v*1.2)})).filter(o=>o.qty>0);}
function cpuNearbyShips(i){const dock=WORLD.islands[i]?.dock;if(!dock)return [];return WORLD.fleet.filter(sh=>{const p=freeShipPosition(sh);return !sh.route&&!sh.manualTrip&&!sh.buildLeft&&sh.expedition===undefined&&p&&Math.hypot(p.x-dock.x,p.y-dock.y)<=10;});}
let cpuTradeIsland=null;
function cpuTradeHTML(){const i=cpuTradeIsland,g=WORLD.islands[i];if(!g?.cpu)return '';const ships=cpuNearbyShips(i),offers=cpuOffers(g);return `<p>${esc(g.cpu.name)} · ${esc(islandName(i))}</p><p class="small">Bringe ein freies Schiff vor das Kontor. Einkäufe werden direkt an Bord geladen. Die Angebote stammen aus dem Warenlager dieses Siedlers.</p>${ships.length?`<label>Schiff<select id="cpu-trade-ship">${ships.map(sh=>`<option value="${sh.id}">${esc(sh.name)}</option>`).join('')}</select></label>`:'<p>Kein freies Schiff in Reichweite.</p>'}<div class="cpu-offers">${offers.map(o=>`<div class="cpu-offer"><span>${ic(o.good,1)} ${GN[o.good].n}<small>${o.qty} t verfügbar · ${o.price} Gold/t</small></span><button type="button" class="btn" data-act="cpu-buy" data-good="${o.good}" ${ships.length&&G.gold>=o.price?'':'disabled'}>1 t kaufen</button><button type="button" class="btn" data-act="cpu-buy" data-good="${o.good}" data-qty="5" ${ships.length&&o.qty>=5&&G.gold>=o.price*5?'':'disabled'}>5 t</button></div>`).join('')||'<p>Aktuell keine Überschüsse zum Verkauf.</p>'}</div>`;}
function openCPUTrade(i){cpuTradeIsland=i;openWin('cpu-trade','Handel am Kontor',cpuTradeHTML);}
function buyCPUTrade(i,shipId,good,requested){const seller=WORLD.islands[i],sh=cpuNearbyShips(i).find(s=>s.id===shipId),offer=seller?.cpu&&cpuOffers(seller).find(o=>o.good===good);if(!sh||!offer||!Number.isInteger(requested)||requested<=0)return 'Schiff oder Angebot ist nicht mehr verfügbar.';const stack=sh.cargo.find(c=>c.good===good),room=stack?50-stack.qty:sh.cargo.length<SHIPS[sh.type].slots?50:0;if(room<requested)return 'An Bord ist nicht genug Platz.';if(offer.qty<requested)return 'Der angebotene Bestand reicht nicht aus.';if(G.gold<offer.price*requested)return 'Zu wenig Gold.';G.gold-=offer.price*requested;seller.gold+=offer.price*requested;seller.stock[good]-=requested;if(stack)stack.qty+=requested;else sh.cargo.push({good,qty:requested});G.cnt.buy+=offer.price*requested;pixxoSyncGold();saveGame();return true;}
const cpuWinAct=winAct;winAct=function(id,ds){if(ds.act==='cpu-trade'){openCPUTrade(Number(ds.i));return;}if(ds.act==='cpu-buy'){const result=buyCPUTrade(cpuTradeIsland,Number($('#cpu-trade-ship')?.value),ds.good,Number(ds.qty||1));if(result!==true)msg(result,'i_alert');refreshWins();renderTop(true);return;}cpuWinAct(id,ds);};
const cpuIslandHTML=islandHTML;islandHTML=function(i){const g=WORLD.islands[i];return !g?.cpu?cpuIslandHTML(i):`<p>${esc(g.cpu.name)} entwickelt diese Insel eigenständig.</p><p>${Math.floor(g.blds.reduce((n,b)=>n+(b.pop||0),0))} Einwohner · ${g.blds.length} Gebäude</p><div class="factfert">${ISLANDS[i].fert.map(k=>`<span>${ic(k,1)} ${GN[k].n}</span>`).join('')}</div><button class="btn primary" data-act="cpu-trade" data-i="${i}">Angebote am Kontor ansehen</button>`;};

const cpuSelectB=selectB;selectB=function(id){const b=G.byId.get(id),g=WORLD?.islands[b?.island];if(g?.cpu){UI.sel=null;closeWin('info');if(WORLD.fog&&!WORLD.fog.islands[g.island])return;UI.viewedIsland=g.island;if(b.type==='kontor')openCPUTrade(g.island);else openWin_island();return;}return cpuSelectB(id);};
