/* Wirtschaftssimulation mit regulären Kosten und echter Spielsimulation.
   Die Bauplätze, Straßen und Dienstabdeckung werden idealisiert; kein Geld,
   keine Waren und keine Einwohner werden nach dem Spielstart hinzugefügt. */
async function simulateCampaign(seed,maxMinutes=240){
 let rnd=seed>>>0;const originalRandom=Math.random;
 Math.random=()=>{rnd+=0x6d2b79f5;let t=rnd;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296};
 startNew();G.speed=0;for(const id in WINS)closeWin(id);
 const home=activeIsland,start=G.time,events=[],samples=[],blocked={},milestones={},minimum={gold:G.gold},plotCounts=new Map();
 const count=(type,g=G)=>g.blds.filter(b=>b.type===type).length;
 const record=(event)=>events.push({minute:+((G.time-start)/60).toFixed(2),event,gold:Math.round(G.gold)});
 const homeState=()=>WORLD.islands[home];
 const use=i=>{const gold=G.gold;for(const g of WORLD.islands)if(g)g.gold=gold;activeIsland=i;G=WORLD.islands[i]};
 function idealNetwork(g){
  g.dirty=false;g.deliveryPaths=new Map();g.nextFire=1e9;g.nextShip=1e9;g.ship=null;
  let hi=0;for(const b of g.blds){b.conn=true;b.envEff=1;b.envCount=B[b.type].env?.need||0;
   if(b.type==='haus'){const district=Math.floor(hi++/24);b.cov={markt:count('markt',g)>district,kapelle:count('kapelle',g)>district,kirche:count('kirche',g)>district};}
  }assignWorkforce(g);
 }
 function add(type){
  if(!unlocked(type)){blocked[type]=(blocked[type]||0)+1;return false}
  if(B[type].fertility&&!islandMeta().fert.includes(B[type].fertility))return false;
  if(['mine','steinbruch'].includes(type)&&count(type)>=G.deposits.filter(d=>d.type===type).length)return false;
  const c=B[type].cost;if(!canAfford(c)||G.gold<(c.gold||0)+120)return false;
  payCost(c);G.gold-=6*ROAD_COST;G.roads+=6;
  const n=plotCounts.get(activeIsland)||0;plotCounts.set(activeIsland,n+1);
  const x=ISLANDS[activeIsland].ox+9+(n%15)*6,y=ISLANDS[activeIsland].oy+15+Math.floor(n/15)*6;
  const b={id:G.nid++,island:activeIsland,type,x,y,...buildingSize(type,0),rotation:0,tier:1,pop:type==='haus'?1:0,paused:false,prog:0,conn:true,acc:IDX(x,y-1),eff:1,envEff:1,staffEff:1,status:'',fire:0,need:{},sat:{},mood:0,cov:{},age:0};
  G.blds.push(b);G.byId.set(b.id,b);
  for(let xx=ISLANDS[activeIsland].ox+9;xx<=ISLANDS[activeIsland].ox+98;xx++)G.road[IDX(xx,y-1)]=1;
  for(let yy=ISLANDS[activeIsland].oy+14;yy<=y;yy++)G.road[IDX(ISLANDS[activeIsland].ox+9,yy)]=1;
  for(const [xx,yy] of footprintCells(x,y,b.w,b.h))G.occ[IDX(xx,yy)]=b.id;
  idealNetwork(G);record('Bau '+type+' auf '+activeIsland);return true;
 }
 const producers=Object.fromEntries(Object.keys(B).filter(t=>B[t].kind==='prod').flatMap(t=>Object.keys(B[t].out).map(g=>[g,t])));
 function canMake(g,seen=new Set()){
  if(seen.has(g))return false;seen=new Set(seen);seen.add(g);
  const type=producers[g];if(!type)return false;
  const incoming=WORLD.routes.some(r=>r.from===activeIsland&&r.back.some(o=>o.good===g)||r.to===activeIsland&&r.out.some(o=>o.good===g));
  if(incoming)return true;
  const d=B[type];if(d.fertility&&!islandMeta().fert.includes(d.fertility))return false;
  if(['mine','steinbruch'].includes(type)&&!G.deposits.some(n=>n.type===type))return false;
  return Object.keys(d.in||{}).every(input=>canMake(input,seen));
 }
 function plannedDemand(){
  const demand={};for(const b of G.blds)if(b.type==='haus'){
   const pop=TIERS[b.tier].cap;
   for(const [g,rate] of Object.entries({...TIERS[b.tier].goods,...additionalHouseGoods(b)}))demand[g]=(demand[g]||0)+rate*pop;
  }
  demand.bretter=Math.max(demand.bretter||0,count('haus')<110?4:1);
  demand.stein=Math.max(demand.stein||0,1);
  if((WORLD.highestTier||1)>=2)demand.werkzeug=Math.max(demand.werkzeug||0,1);
  const desired={};
  function chain(g,amount){const type=producers[g];if(!type)return;
   if(!unlocked(type)&&!count(type))return;
   if(!canMake(g))return;
   const d=B[type],old=desired[type]||0;
   const margin=['fisch','brot','tuch','bier','wein','gewuerz'].includes(g)?1.02:1;
   const needed=Math.ceil(amount/(60/d.cycle*d.out[g])*margin-1e-9);desired[type]=Math.max(old,needed);
  }
  for(const [g,amount] of Object.entries(demand))chain(g,amount);
  for(let i=0;i<6;i++)for(const [type,n] of Object.entries({...desired}))for(const [g,qty] of Object.entries(B[type].in||{})){
   let required=0;for(const [other,m] of Object.entries(desired))required+=(B[other].in?.[g]||0)*60/B[other].cycle*m;
   chain(g,required);
  }
  return desired;
 }
 function constructHome(){
  idealNetwork(G);const homes=count('haus'),pop=popByTier(),districts=Math.ceil(homes/24);
  for(const type of ['holzfaeller','saegewerk','markt','fischer'])if(!count(type)){add(type);return;}
  if(count('markt')<districts){add('markt');return;}
  const citizenDistricts=Math.max(1,...G.blds.filter(b=>b.type==='haus').map((b,i)=>b.tier>=2?Math.floor(i/24)+1:0));
  if((WORLD.highestTier||1)>=2&&unlocked('kirche')&&G.stock.bier>0&&G.stock.wein>0&&G.stock.gewuerz>0&&count('kirche')<citizenDistricts){add('kirche');return;}
  const workers=workforceFor(G),farmerNeed=G.blds.reduce((n,b)=>n+(B[b.type].workforce?.tier===1?B[b.type].workforce.count:0),0);
  const desired=plannedDemand();
  // Früh günstiges Tuch aufbauen, dann Brot und die Eisenkette.
  const priority=['steinbruch','schaefer','weberei','farm','muehle','baeckerei','fischer','holzfaeller','saegewerk','mine','schmelze','schmiede','hopfen','brauerei','weingut','kelterei','gewuerzfarm'];
  if(homes<14||(workers.supply[1]<Math.max(68,farmerNeed+16)&&homes<160)){if(add('haus'))return;}
  if(!count('steinbruch')&&unlocked('steinbruch')){add('steinbruch');return;}
  const expansion=priority.filter(t=>(desired[t]||0)>count(t));
  if(!count('baeckerei')){
   for(const type of ['schaefer','weberei','farm','muehle','baeckerei'])if(!count(type)){add(type);return;}
   if(!count('kapelle')&&count('baeckerei')&&add('kapelle'))return;
  }
  if(count('baeckerei')&&count('weberei')&&count('kapelle')<citizenDistricts){add('kapelle');return;}
  expansion.sort((a,b)=>count(a)/desired[a]-count(b)/desired[b]);
  for(const type of expansion)if(add(type))return;
  if(count('kapelle')<citizenDistricts){add('kapelle');return;}
  if(homes>60&&count('lager')<2&&add('lager'))return;
  const farmerFloor=Math.max(60,farmerNeed+12);
  for(const b of G.blds){
   if(b.type!=='haus')continue;
   if(b.tier===1&&pop[2]<180&&pop[1]-b.pop>=farmerFloor&&nextTierReq(b)?.ok&&canAfford(UPG[2])){upgradeHouse(b);record('Aufstieg Bürger');return;}
   const citizenNeed=workers.demand[2];
   if(b.tier===2&&pop[2]-b.pop>=Math.max(155,citizenNeed+16)&&nextTierReq(b)?.ok&&canAfford(UPG[3])){upgradeHouse(b);record('Aufstieg Patrizier');return;}
  }
  if(empireTier(2)>=150&&!count('werft')){add('werft');return;}
  if(empireTier(3)>=30&&empirePop()<500&&homes<160&&add('haus'))return;
 }
 let trader=300+Math.random()*300;
 function trading(){
  if(G.time<trader)return;trader=G.time+300+Math.random()*300;
  G.ship={state:'dock',offers:newOffers(),until:G.time+75,path:[],pos:0};
  if(empireTier(2)>=80&&G.stock.werkzeug<12&&G.ship.offers.werkzeug){const budget=Math.max(0,Math.floor((G.gold-600)/buyPrice('werkzeug')));if(budget)tradeBuy('werkzeug',Math.min(12-G.stock.werkzeug,budget));}
  for(const g of ['holz','bretter','stein','werkzeug'])if(G.stock[g]>55)tradeSell(g,Math.floor(G.stock[g]-45));
  G.ship=null;
 }
 function optimize(){
  for(const b of G.blds)if(B[b.type].kind==='prod'){
   const goods=Object.keys(B[b.type].out),stocked=goods.every(g=>G.stock[g]>capOf()*.7);
   b.paused=stocked;
  }idealNetwork(G);
 }
 function expand(){
  let sh=WORLD.fleet.find(s=>!s.route&&!s.buildLeft);
  const missing=['getreide','hopfen','trauben','gewuerz'].filter(g=>!islandMeta().fert.includes(g)&&!WORLD.routes.some(r=>r.from===home&&r.back.some(o=>o.good===g)));
  if(!missing.length)return;
  if(!sh&&count('werft')&&!WORLD.fleet.some(s=>s.buildLeft)&&WORLD.fleet.length<4&&buildShip('schooner')===true){record('Schoner bestellt');return;}
  if(!sh)return;
  const target=ISLANDS.map((m,i)=>({i,m,score:missing.filter(g=>m.fert.includes(g)).length})).filter(q=>!WORLD.islands[q.i]&&q.score).sort((a,b)=>b.score-a.score)[0];
  if(!target)return;
  if(sh.manualTrip)return;
  if(sh.at===home&&!sh.anchor){
   if(G.stock.bretter<10||G.stock.werkzeug<8||G.gold<1200)return;
   transferShip(sh,'bretter',10,true);transferShip(sh,'werkzeug',8,true);
   let destination=null;
   for(const beach of target.m.beaches)for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){
    const x=beach.x+dx,y=beach.y+dy;if(INMAP(x,y)&&G.tiles[IDX(x,y)]<=T.SHAL&&!destination&&seaPath(freeShipPosition(sh),{x,y}))destination={x,y};
   }
   if(destination)sailShip(sh,destination.x,destination.y);return;
  }
  if(sh.anchor&&colonize(target.i,sh.id)===true){record('Insel gegründet '+target.i);delete sh.anchor;
   // Reguläre Handelsroute, zwei Frachträume je Richtung.
   const id=WORLD.nextId++;WORLD.routes.push({id,name:'Versorgung',ship:sh.id,from:home,to:target.i,out:[{good:'fisch',qty:25},{good:'bretter',qty:25}],back:target.m.fert.filter(g=>missing.includes(g)).slice(0,2).map(g=>({good:g,qty:25})),reserve:10,paused:false});
   sh.route=id;sh.phase='load';sh.remaining=0;record('Handelsroute eingerichtet');
  }
 }
 let failure=null;
 try{
  for(let second=0;second<maxMinutes*60;second++){
   use(home);if(second%10===0){optimize();constructHome();expand();trading();}
   for(let i=0;i<WORLD.islands.length;i++)if(i!==home&&WORLD.islands[i]){
    use(i);idealNetwork(G);
    if(second%10===0){
     if(!count('markt'))add('markt');else if(count('haus')<8||workforceFor(G).supply[1]<workforceFor(G).demand[1]+8)add('haus');else{
      if(!count('fischer')){add('fischer');continue;}
      const route=WORLD.routes.find(r=>r.to===activeIsland);
      const ship=WORLD.fleet.find(s=>s.route===route?.id),needsCitizens=route?.back.some(o=>B[producers[o.good]].workforce?.tier===2);
      if(needsCitizens){
       if(ship?.phase==='load'&&!ship.cargo.length&&G.stock.bretter>=18)route.out=[{good:'brot',qty:25},{good:'tuch',qty:25}];
       if(!count('kapelle')){add('kapelle');continue;}
       const staff=workforceFor(G);
       if(staff.supply[2]<Math.max(24,staff.demand[2]+8)){
        const h=G.blds.find(b=>b.type==='haus'&&b.tier===1&&staff.supply[1]-b.pop>=12&&nextTierReq(b)?.ok&&canAfford(UPG[2]));
        if(h){upgradeHouse(h);record('Kolonie: Bürgerhaus');idealNetwork(G);continue;}
       }
      }
      for(const order of route?.back||[]){
       const type=producers[order.good],consumer=Object.keys(B).find(t=>B[t].in?.[order.good]);
       const required=consumer?count(consumer,homeState())*B[consumer].in[order.good]*60/B[consumer].cycle:homeState().blds.filter(b=>b.type==='haus').reduce((n,b)=>n+(TIERS[b.tier].goods[order.good]||additionalHouseGoods(b)[order.good]||0)*TIERS[b.tier].cap,0);
       const needed=Math.ceil(required/(60/B[type].cycle));
       if(count(type)<Math.max(1,needed)&&add(type))break;
      }
     }
    }
   }
   use(home);stepWorld(1);minimum.gold=Math.min(minimum.gold,G.gold);
   if(!milestones.citizens&&empireTier(2)>=8){milestones.citizens=+(G.time/60).toFixed(2);record('Erste Bürger');}
   if(!milestones.ship&&WORLD.fleet.some(s=>!s.buildLeft)){milestones.ship=+(G.time/60).toFixed(2);record('Erstes Schiff fertig');}
   if(!milestones.colony&&WORLD.islands.filter(Boolean).length>=2)milestones.colony=+(G.time/60).toFixed(2);
   if(!milestones.patricians&&empireTier(3)>=30){milestones.patricians=+(G.time/60).toFixed(2);record('30 Patrizier');}
   if(second%300===0){samples.push({minute:+(G.time/60).toFixed(2),gold:Math.round(G.gold),population:Math.round(empirePop()),tiers:[1,2,3].map(t=>Math.round(empireTier(t))),net:Math.round(economy().net),buildings:homeState().blds.length,islands:WORLD.islands.filter(Boolean).length,stock:Object.fromEntries(['bretter','fisch','brot','tuch','bier','wein','werkzeug','gewuerz'].map(g=>[g,+G.stock[g].toFixed(2)])),workers:workforceFor(G)});}
   if(G.gold<0){failure='Konkurs';break;}
   if(empirePop()>=500&&empireTier(3)>=30&&WORLD.routes.length&&G.time>milestones.patricians*60+600)break;
   if(second%600===0)await new Promise(r=>setTimeout(r,0));
  }
  use(home);return {seed,startIsland:home,fert:ISLANDS[home].fert,minutes:+(G.time/60).toFixed(2),failure,milestones,minimum,samples,events,blocked,finished:empireTier(3)>=30&&WORLD.routes.length>0,counts:Object.fromEntries(Object.keys(B).map(t=>[t,count(t)])),stock:G.stock,workers:workforceFor(G),islands:WORLD.islands.filter(Boolean).length,colonyDetails:WORLD.islands.map((g,i)=>g?{i,stock:g.stock,buildings:g.blds.map(b=>({type:b.type,status:b.status,eff:b.eff,pop:b.pop})),workers:workforceFor(g)}:null).filter(Boolean),fleet:WORLD.fleet,routes:WORLD.routes};
 }finally{Math.random=originalRandom;G.speed=0;}
}
