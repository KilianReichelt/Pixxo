/* Beispielpartie über reguläre Bau-, Straßen-, Produktions- und Aufstiegsregeln. */
async function playShowcase(seed=7341,minutes=160,resume=false){
 const random=Math.random;let state=seed;
 Math.random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 try{if(!resume)startNew();}finally{Math.random=random;}
 tutorialFinish();setSpeed(0);
 const events=[],blocked={},retry={},count=t=>G.blds.filter(b=>b.type===t).length;
 const port=G.blds.find(b=>b.type==='kontor'),island=ISLANDS[activeIsland],home=activeIsland;
 for(const [x,y] of ringCells(port))if(roadTileAllowed(x,y))placeRoad(x,y);
 for(const x of [port.x-1,port.x+port.w])for(const y of [port.y-1,port.y+port.h])if(roadTileAllowed(x,y))placeRoad(x,y);
 rebuildNet();
 let hub=null,fishingSite=null;
 function hubCell(){
  if(hub!==null&&G.road[hub])return hub;
  const site=ringCells(port).filter(([x,y])=>roadTileAllowed(x,y)).sort((a,b)=>Math.hypot(a[0]-island.wx,a[1]-island.wy)-Math.hypot(b[0]-island.wx,b[1]-island.wy))[0];
  if(!site)return null;hub=IDX(...site);if(!G.road[hub])placeRoad(...site);return hub;
 }
 function build(type,near=null){
  if((retry[type]||0)>G.time)return false;
  const d=B[type];if(!d||!unlocked(type)||!canAfford(d.cost)||G.gold<(d.cost.gold||0)+100)return false;
  let sites=[];
  if(['steinbruch','mine','lehmgrube'].includes(type))sites=G.deposits.filter(n=>n.type===type&&!nodeUsed(n));
  else for(let y=port.y-(type==='fischer'?140:58);y<port.y+(type==='fischer'?141:59);y++)for(let x=port.x-(type==='fischer'?140:58);x<port.x+(type==='fischer'?141:59);x++){
   if(!canPlace(type,x,y).ok)continue;
   let resources=0;if(d.env)for(let dy=-d.env.r;dy<=d.env.r;dy+=2)for(let dx=-d.env.r;dx<=d.env.r;dx+=2){
    const xx=Math.floor(x+d.w/2+dx),yy=Math.floor(y+d.h/2+dy);if(!INMAP(xx,yy))continue;const k=IDX(xx,yy);
    if(d.env.t==='tree'&&G.tiles[k]===T.FOREST||d.env.t==='fish'&&G.fish[k])resources++;
   }
   const markets=G.blds.filter(b=>b.type==='markt'),nearMarket=markets.length?Math.min(...markets.map(b=>Math.hypot(cx(b)-x,cy(b)-y))):0;
   const quarry=G.deposits.filter(n=>n.type==='steinbruch').sort((a,b)=>Math.hypot(a.x-port.x,a.y-port.y)-Math.hypot(b.x-port.x,b.y-port.y))[0];
   const coverage=type==='kapelle'?G.blds.filter(b=>b.type==='haus'&&!b.cov?.kapelle&&Math.hypot(cx(b)-x-d.w/2,cy(b)-y-d.h/2)<=d.r).length:0;
   sites.push({x,y,score:Math.hypot(x-port.x,y-port.y)-Math.min(28,resources*1.6)-coverage*10+(type==='haus'?nearMarket*.7:0)+(type==='lager'&&(near||quarry)?Math.hypot(x-(near||quarry).x,y-(near||quarry).y)*4:0)+footprintCells(x,y,d.w,d.h).filter(([a,b])=>G.tiles[IDX(a,b)]===T.FOREST).length*.4});
  }
  sites.sort((a,b)=>(a.score??Math.hypot(a.x-port.x,a.y-port.y))-(b.score??Math.hypot(b.x-port.x,b.y-port.y)));
  if(type==='fischer')fishingSite=sites.find(s=>Math.hypot(s.x-port.x,s.y-port.y)>45)||null;
  for(const site of sites.slice(0,250)){
   if(!canPlace(type,site.x,site.y).ok||type!=='fischer'&&!cpuPreservesRoadCorners(site.x,site.y,d.w,d.h))continue;
   const mock={x:site.x,y:site.y,w:d.w,h:d.h},cells=footprintCells(mock.x,mock.y,mock.w,mock.h).map(([x,y])=>IDX(x,y));
   const endpoints=ringCells(mock).filter(([x,y])=>roadTileAllowed(x,y)).sort((a,b)=>Math.hypot(a[0]-cx(port),a[1]-cy(port))-Math.hypot(b[0]-cx(port),b[1]-cy(port)));
   let path;
   for(const [x,y] of endpoints.slice(0,5)){
    for(const k of cells)G.occ[k]=-1;
    try{const starts=whList().flatMap(b=>ringCells(b)).filter(([a,b])=>roadTileAllowed(a,b)).sort((a,b)=>Math.hypot(a[0]-x,a[1]-y)-Math.hypot(b[0]-x,b[1]-y));const from=starts[0];path=from?plannedRoadPath({x:from[0],y:from[1]},{x,y}):null;}
    finally{for(const k of cells)G.occ[k]=0;}
    if(path&&!path.some(k=>cells.includes(k)))break;path=null;
   }
   if(!path||roadPathDistance(path)>(d.kind!=='prod'||['steinbruch','farm'].includes(type)?110:d.transportRange||36)||G.gold<(d.cost.gold||0)+path.filter(k=>!G.road[k]).length*ROAD_COST+100)continue;
   const result=place(type,site.x,site.y);if(!result.ok)continue;
   for(const k of path)placeRoad(k%MAPW,Math.floor(k/MAPW));
   rebuildNet();events.push({time:Math.round(G.time),type,x:site.x,y:site.y});return result.b;
  }
  blocked[type]=(blocked[type]||0)+1;retry[type]=G.time+120;if(blocked[type]===1)console.log(JSON.stringify({blockedType:type,sites:sites.length}));return false;
 }
 function fields(){
  for(const owner of G.blds){
   const rule=FIELD_RULES[owner.type];if(!rule||fieldModules(owner).length>=rule.count)continue;
   UI.fieldOwner=owner.id;const d=B[rule.type];
   for(let r=1;r<=12;r++)for(let y=owner.y-r;y<=owner.y+owner.h+r;y++)for(let x=owner.x-r;x<=owner.x+owner.w+r;x++){
    if(!canPlace(rule.type,x,y).ok||!cpuPreservesRoadCorners(x,y,d.w,d.h))continue;
    const result=place(rule.type,x,y);if(result.ok)return true;
   }
  }
  return false;
 }
 let upgrades=0,nextDecision=0;
 function decide(){
  // Normal emergency demolition prevents spread where no fire engine can reach.
  for(const b of G.blds)if(b.fire>0&&b.fire<48&&!G.fireEngines?.some(e=>e.phase!=='return'&&e.target===b.id)){
   events.push({time:Math.round(G.time),emergencyDemolition:b.type});removeBld(b,true);rebuildNet();return;
  }
  if(fields())return;
  for(const b of G.blds)if(b.type==='ruine'&&!b.ruinField&&rebuildRuin(b))return;
  const distillers=totalPop()>150?4:totalPop()>90?3:2;
  if(count('brennerei')<distillers&&count('brennerei')>=2){if(build('brennerei'))return;}
  if(count('brennerei')>=3&&count('kartoffelhof')<3){if(build('kartoffelhof'))return;}
  if(fishingSite&&count('fischer')<3&&count('lager')<2&&G.gold>1500){if(build('lager',fishingSite))return;}
  if(count('kapelle')&&count('kapelle')<5&&G.blds.filter(b=>b.type==='haus'&&b.tier===1&&!b.cov?.kapelle).length>12&&G.stock.stiefel>0){if(build('kapelle'))return;}
  if(G.gold<900&&count('haus')>=14&&count('haus')<40&&canAfford(B.haus.cost)&&G.stock.honig>1&&G.stock.most>1){if(build('haus'))return;}
  const goals=[['holzfaeller',1],['saegewerk',1],['markt',1],['haus',8],['fischer',2],['kartoffelhof',1],['brennerei',1],['haus',14],['imkerei',1],['obsthof',1],['mosterei',1],['feuer',1],['steinbruch',1],['farm',1],['muehle',1],['baeckerei',1],['kartoffelhof',2],['brennerei',2],['haus',24],['kapelle',1],['haus',32],['schaefer',1],['weberei',1],['rinderhof',1],['gerberei',1],['schuster',1],['fischer',3],['imkerei',2],['obsthof',2],['mosterei',2],['markt',2],['haus',44]];
  for(const [type,desired] of goals)if(count(type)<desired&&unlocked(type)){if(type==='fischer'&&count(type)>=2){if(build(type))return;continue;}if(type==='steinbruch'&&blocked[type]&&!count('lager'))build('lager');else build(type);return;}
  const work=workforceFor(G);
  for(const b of G.blds.filter(b=>b.type==='haus'&&b.tier===1)){
   if(work.supply[1]-b.pop<Math.max(45,work.demand[1]+8))continue;
   if(nextTierReq(b)?.ok&&upgradeHouse(b)===true){upgrades++;rebuildNet();events.push({time:Math.round(G.time),upgrade:b.id});return;}
  }
  if(empireTier(2)>40)for(const [type,desired] of [['mine',1],['schmelze',1],['schmiede',1],['lehmgrube',1],['ziegelei',1],['hopfen',1],['brauerei',1],['imkerei',1],['kerzenzieherei',1],['haus',52],['fischer',5],['kartoffelhof',2],['brennerei',2]])
   if(count(type)<desired&&build(type))return;
  if(empireTier(2)>=150&&!count('werft')&&build('werft'))return;
  if(count('werft')&&WORLD.fleet.length<2&&!WORLD.fleet.some(sh=>sh.buildLeft)&&canAfford(SHIPS.schooner.cost))buildShip('schooner');
  if(empireTier(2)>20&&port.tier<3){const before=port.tier;upgradePort(port);if(port.tier!==before)return;}
  if(empireTier(2)>40)for(const [type,desired] of [['holzfaeller',2],['saegewerk',2],['lager',1],['forschung',1]])if(count(type)<desired&&build(type))return;
  if(count('haus')<60&&economy().net>40)build('haus');
 }
 for(let second=0;second<minutes*60;second++){
  if(second%8===0)for(const b of G.blds){
   const limits={fischer:['fisch',30,12],steinbruch:['stein',20,10],kartoffelhof:['kartoffeln',12,4],brennerei:['schnaps',12,4],imkerei:['honig',18,5],mosterei:['most',18,5],obsthof:['aepfel',12,4]},limit=limits[b.type];
   if(!limit)continue;const n=G.stock[limit[0]]||0,want=n>limit[1]?true:n<limit[2]?false:b.paused;
   if(!!b.paused!==!!want){const selected=UI.sel;UI.sel=b.id;winAct('info',{act:'pause'});UI.sel=selected;}
  }
  if(second>=nextDecision){nextDecision=second+8;decide();}
  if(G.gold<700&&!WORLD.loan)pixxoBorrow(5000);
  // Normal simulation at half-second steps, including logistics, tax and fires.
  stepWorld(.5);stepWorld(.5);
  if(second%300===0){console.log(JSON.stringify({minute:Math.round(G.time/60),gold:Math.round(G.gold),people:Math.round(totalPop()),citizens:Math.round(empireTier(2)),homes:count('haus'),upgrades,net:Math.round(economy().net),stock:G.stock,blocked}));await new Promise(resolve=>setTimeout(resolve,0));}
  if(G.gold<0)break;
  if(empireTier(2)>=50&&G.time>60*75)break;
 }
 saveGame();return {seed,home,upgrades,time:G.time,gold:G.gold,population:totalPop(),citizens:empireTier(2),counts:Object.fromEntries([...new Set(G.blds.map(b=>b.type))].map(t=>[t,count(t)])),events,blocked,debug:G.blds.filter(b=>B[b.type].kind==='prod').map(b=>({type:b.type,status:b.status,eff:b.eff,conn:b.conn,x:b.x,y:b.y,input:b.inputStock,linked:productionLinked(b)})),houses:G.blds.filter(b=>b.type==='haus').slice(0,3).map(b=>({pop:b.pop,cov:b.cov,sat:b.sat,req:nextTierReq(b)}))};
}
