/* Aristokraten, Wohnviertel und optionale, einmalige Insel-Großprojekte. */
const CIVIC_GOODS=[['sand','Sand',14],['kalk','Kalk',24],['zement','Zement',45],['beton','Beton',65],['glas','Glas',55],['geschirr','Geschirr',100],['papier','Papier',35],['farbstoff','Farbstoff',65],['buecher','Bücher',110],['feine_kleidung','Feine Kleidung',135]];
for(const [id,n,v] of CIVIC_GOODS){const good={id,n,v};GOODS.push(good);GN[id]=good;GOOD_UNLOCK_TIER[id]=3;}
Object.assign(GOOD_UNLOCK_TIER,{sand:2,kalk:2,glas:2,blueten:2});
const CIVIC_CHAINS=[
 ['sandgrube','Sandgrube','roh',{}, {sand:2},35,10,'sand'],
 ['kalkbrennerei','Kalkbrennerei','veredel',{stein:2,holz:1},{kalk:2},50,16,'kalk'],
 ['zementwerk','Zementwerk','veredel',{kalk:2,lehm:1},{zement:2},60,20,'zement'],
 ['betonwerk','Betonwerk','veredel',{zement:2,sand:2,stein:1},{beton:2},65,24,'beton'],
 ['glashuette','Glashütte','veredel',{sand:2,kalk:1,holz:1},{glas:2},55,20,'glas'],
 ['geschirrmanufaktur','Geschirrmanufaktur','veredel',{glas:1,lehm:1},{geschirr:1},60,24,'geschirr'],
 ['papiermuehle','Papiermühle','veredel',{holz:2},{papier:2},45,16,'papier'],
 ['faerberei','Färberei','veredel',{blueten:2},{farbstoff:2},45,16,'farbstoff'],
 ['druckerei','Druckerei','veredel',{papier:2,tuch:1,farbstoff:1},{buecher:2},70,24,'buecher'],
 ['schneiderei','Schneiderei','veredel',{tuch:2,farbstoff:1,leder:1},{feine_kleidung:2},75,24,'feine_kleidung']
];
for(const [id,n,cat,input,out,cycle,workers,good] of CIVIC_CHAINS){
 B[id]={n,cat,kind:'prod',w:4,h:3,cost:{gold:1600+workers*35,bretter:18,ziegel:16,werkzeug:8},upk:35+workers,cycle,in:input,out,transportRange:54,req:0,workforce:{tier:3,count:workers},d:`Produziert ${GN[good].n}. Neue Produktionskette für Aristokraten und repräsentative Bauten.`};
 if(id==='sandgrube')B[id].place='coast';
 BUILD_TIER[id]=3;BUILD_SIZES[id]={w:4,h:3};BASE_GEOMETRY[id]={w:4,h:3};
 if(['sandgrube','kalkbrennerei','glashuette'].includes(id)){
  BUILD_TIER[id]=2;B[id].workforce={tier:2,count:workers};
  B[id].cost={gold:id==='sandgrube'?350:id==='kalkbrennerei'?550:900,bretter:8,stein:6,werkzeug:3};
  B[id].upk=id==='sandgrube'?15:id==='kalkbrennerei'?25:35;
  B[id].d=`Produziert ${GN[good].n}. Zulieferer für Seife und später Parfüm und Geschirr.`;
 }
}
for(const [id] of CIVIC_GOODS)STORE_GOOD_CATEGORIES.set(id,Object.values(B).some(b=>b.kind==='prod'&&b.cat==='roh'&&b.out?.[id])?'raw':'craft');
Object.assign(B,{
 brunnen:{n:'Brunnen',cat:'wohnen',kind:'svc',svc:'brunnen',r:20,w:1,h:1,cost:{gold:150,stein:8,bretter:2},upk:3,req:0,d:'Senkt das Brandrisiko angeschlossener Gebäude in Reichweite um 50 %.'},
 garten:{n:'Garten',cat:'wohnen',kind:'svc',svc:'garten',r:24,w:3,h:3,cost:{gold:350,bretter:8,stein:4},upk:5,req:0,d:'Senkt den Verbrauch von Brot, Honig und Apfelmost benachbarter, angeschlossener Häuser um 15 %.'},
 gemeinschaftshaus:{n:'Gemeinschaftshaus',cat:'wohnen',kind:'svc',svc:'gemeinschaft',r:32,w:4,h:4,cost:{gold:1800,bretter:22,ziegel:18,werkzeug:6},upk:35,req:0,d:'Erfüllt das Wohnbedürfnis Gemeinschaft für Patrizier und Aristokraten.'}
});
Object.assign(SVCN,{brunnen:'Brunnen',garten:'Garten',gemeinschaft:'Gemeinschaft'});
// Community starts with patricians; the first upgrade does not require it.
for(const [id,tier] of [['brunnen',1],['garten',2],['gemeinschaftshaus',3]]){BUILD_TIER[id]=tier;BUILD_SIZES[id]={w:B[id].w,h:B[id].h};BASE_GEOMETRY[id]={w:B[id].w,h:B[id].h};}
TIERS[3].svc.push('gemeinschaft');
TIERS.push({id:4,n:'Aristokraten',cap:22,tax:8,goods:{...TIERS[3].goods,feine_kleidung:.012,geschirr:.01,buecher:.012},svc:['markt','kirche','gemeinschaft'],luxury:{parfuem:.006,schmuck:.005,moebel:.006},icon:'i_t4'});
HN[4]='Aristokratenhaus';
UPG[4]={gold:1100,bretter:24,ziegel:24,beton:20,glas:12,werkzeug:10};
pixxoRefreshHouseCapacities();
// Retain definitions and save data until grand projects are ready for release.
let CIVIC_PROJECTS_ENABLED=false;
const CIVIC_PROJECTS={
 rathaus:{n:'Großes Rathaus',tier:3,w:8,h:8,upk:100,effects:{tax:.1,upkeep:-.1},description:'+10 % Steuereinnahmen · −10 % Gebäudeunterhalt auf dieser Insel',stages:[
  {n:'Fundament',seconds:180,workers:40,cost:{gold:4000,stein:120,ziegel:80,bretter:60,werkzeug:20}},
  {n:'Hauptbau',seconds:300,workers:60,cost:{gold:7000,stein:160,ziegel:180,bretter:100,eisen:40,werkzeug:40}},
  {n:'Innenausbau',seconds:240,workers:80,cost:{gold:10000,moebel:80,tuch:80,kerzen:60,wein:40,werkzeug:30}}
 ]},
 ausstellungspalast:{n:'Ausstellungspalast',tier:4,w:12,h:10,upk:200,effects:{production:.2,luxury:-.1,tax:.1},description:'+20 % Produktion · −10 % Luxusverbrauch · +10 % Steuereinnahmen auf dieser Insel',stages:[
  {n:'Fundament',seconds:240,workers:80,cost:{gold:15000,beton:200,stein:160,ziegel:120,werkzeug:60}},
  {n:'Tragwerk',seconds:360,workers:120,cost:{gold:20000,beton:300,eisen:160,bretter:140,werkzeug:80}},
  {n:'Seitenflügel',seconds:360,workers:160,cost:{gold:25000,beton:220,ziegel:240,glas:120,eisen:100}},
  {n:'Glaskuppel',seconds:420,workers:180,cost:{gold:30000,glas:300,eisen:180,beton:120,werkzeug:120}},
  {n:'Innenausbau',seconds:360,workers:200,cost:{gold:35000,moebel:160,geschirr:160,feine_kleidung:120,buecher:160,kerzen:100,schmuck:60}}
 ]}
};
// Simulation seconds: each phase takes twenty minutes at full staffing, after delivery.
for(const project of Object.values(CIVIC_PROJECTS))for(const stage of project.stages)stage.seconds=20*60;
for(const [id,d] of Object.entries(CIVIC_PROJECTS)){B[id]={n:d.n,cat:'dienst',kind:'monument',w:d.w,h:d.h,cost:{gold:d.tier===3?3000:10000},upk:d.upk,req:0,transportRange:72,d:'Optionales Großprojekt, einmal pro Spiel. '+d.description+'.'};BUILD_TIER[id]=d.tier;BUILD_SIZES[id]={w:d.w,h:d.h};BASE_GEOMETRY[id]={w:d.w,h:d.h};}
for(const good of CIVIC_GOODS)STORE_GOOD_CATEGORIES.set(good[0],good[0]==='sand'?'raw':'craft');
for(const id of ['brunnen','garten','gemeinschaftshaus',...CIVIC_CHAINS.map(c=>c[0]),...Object.keys(CIVIC_PROJECTS)])BASE_GEOMETRY[id]={w:B[id].w/1.5,h:B[id].h/1.5};
const civicUnlock=unlocked;unlocked=function(type){if(CIVIC_PROJECTS[type]&&!CIVIC_PROJECTS_ENABLED)return false;if(B[type]?.kind==='monument'||['brunnen','garten','gemeinschaftshaus',...CIVIC_CHAINS.map(c=>c[0])].includes(type))return (WORLD?.highestTier||1)>=(BUILD_TIER[type]||1);return civicUnlock(type);};
const civicLuxuryBonus=luxuryBonus;luxuryBonus=function(b,g){return b.tier===4?Math.max(0,b.pop)*({parfuem:4.5,schmuck:5,moebel:3}[g]||0):civicLuxuryBonus(b,g);};
function civicProjectState(b){return b.project??={stage:0,active:false,progress:0,workers:0};}
function civicProjects(g=G){if(!CIVIC_PROJECTS_ENABLED)return [];return (g?.projectIds||[]).map(id=>g.byId.get(id)).filter(b=>b&&CIVIC_PROJECTS[b.type]);}
function civicEffects(g=G){const effect={production:1,tax:1,upkeep:1,luxury:1};for(const b of civicProjects(g))if(civicProjectState(b).stage>=CIVIC_PROJECTS[b.type].stages.length&&b.conn&&!b.paused&&b.fire<=0)for(const [key,value] of Object.entries(CIVIC_PROJECTS[b.type].effects))effect[key]+=value;return effect;}
function civicNormalize(g){g.projectClaims??={};g.projectIds=[];for(const [id] of CIVIC_GOODS)g.stock[id]??=0;for(const b of g.blds){if(CIVIC_PROJECTS[b.type]){g.projectIds.push(b.id);g.projectClaims[b.type]=true;const p=civicProjectState(b);if(!CIVIC_PROJECTS_ENABLED){b.paused=true;p.workers=0;p.byTier=Array(TIERS.length).fill(0);b.status='Großprojekt vorübergehend deaktiviert';}else b.paused=false;}if(CIVIC_PROJECTS[b.originalType])g.projectClaims[b.originalType]=true;}if(!CIVIC_PROJECTS_ENABLED){const projectIds=new Set(g.projectIds);g.carts=(g.carts||[]).filter(cart=>{if(!cart.projectCargo&&!projectIds.has(cart.target))return true;if(cart.qty>0)g.stock[cart.col]=(g.stock[cart.col]||0)+cart.qty;return false;});}return g;}
const civicNewGame=newGame;newGame=function(...args){const result=civicNewGame(...args);civicNormalize(G);return result;};
const civicPack=packIsland;packIsland=function(g){const packed=civicPack(g);packed.projectClaims={...g.projectClaims};for(const b of packed.blds){const live=g.byId.get(b.id);if(live?.project)b.project={...live.project};}return packed;};
const civicUnpack=unpackIsland;unpackIsland=function(o,...args){const g=civicUnpack(o,...args),saved=new Map(o.blds.map(b=>[b.id,b]));g.projectClaims={...o.projectClaims};for(const b of g.blds){const old=saved.get(b.id);if(old?.project)b.project={...old.project,workers:0};}return civicNormalize(g);};
function civicClaimed(type){return (WORLD?.islands||[G]).some(g=>g&&!g.cpu&&(g.projectClaims?.[type]||g.blds.some(b=>b.type===type||b.originalType===type)));}
const civicCanPlace=canPlace;canPlace=function(type,x,y){if(CIVIC_PROJECTS[type]&&!CIVIC_PROJECTS_ENABLED)return {ok:false,why:'Großprojekte sind vorübergehend deaktiviert.'};if(CIVIC_PROJECTS[type]&&civicClaimed(type))return {ok:false,why:B[type].n+' ist einmal pro Spiel möglich und wurde bereits begonnen.'};return civicCanPlace(type,x,y);};
const civicPlace=place;place=function(...args){const result=civicPlace(...args);if(result.ok&&CIVIC_PROJECTS[result.b.type]){civicNormalize(G);civicProjectState(result.b);result.b.status='Baustelle geplant';}return result;};
const civicHouseRates=houseRates;houseRates=function(b){const rates=civicHouseRates(b),effects=civicEffects(WORLD?.islands[b.island??activeIsland]||G);for(const good in rates){if(b.cov?.garten&&['brot','honig','most'].includes(good))rates[good]*=.85;if(TIERS[b.tier].luxury[good])rates[good]*=effects.luxury;}return rates;};
const civicHouseIncome=houseIncome;houseIncome=function(b){return civicHouseIncome(b)*civicEffects(WORLD?.islands[b.island??activeIsland]||G).tax;};
const civicUpkeep=buildingUpkeep;buildingUpkeep=function(b){if(!CIVIC_PROJECTS_ENABLED&&CIVIC_PROJECTS[b.type])return 0;return civicUpkeep(b)*civicEffects(WORLD?.islands[b.island??activeIsland]||G).upkeep;};
function civicWellCovered(b){return G.blds.some(w=>w.type==='brunnen'&&w.conn&&!w.paused&&w.fire<=0&&Math.hypot(cx(w)-cx(b),cy(w)-cy(b))<=B.brunnen.r&&deliveryPath(w,b)?.length);}
const civicIgnite=pixxoIgnite;pixxoIgnite=function(b){if(b&&civicWellCovered(b)&&Math.random()<.5)return false;return civicIgnite(b);};
const civicFireStep=pixxoFireStep;pixxoFireStep=function(dt){for(const b of G.blds)if(b.fire>0&&pixxoEngineArrived(b)&&civicWellCovered(b))b.extinguish=Math.min(1,(b.extinguish||0)+dt/48);civicFireStep(dt);};
// Regular workplaces keep priority. Construction binds only genuinely free residents.
workforceFor=function(g){const supply=Array(TIERS.length).fill(0),demand=Array(TIERS.length).fill(0);if(g)for(const b of g.blds){if(b.type==='haus')supply[b.tier]+=b.pop||0;const w=B[b.type].workforce;if(w&&!b.paused&&b.fire<=0)demand[w.tier]+=w.count;}for(let tier=1;tier<TIERS.length;tier++)supply[tier]=Math.floor(supply[tier]);
 const regular=demand.slice(),construction=Array(TIERS.length).fill(0);
 for(const b of civicProjects(g)){const p=civicProjectState(b),stage=CIVIC_PROJECTS[b.type].stages[p.stage];p.workers=0;p.byTier=Array(TIERS.length).fill(0);if(!p.active||!stage||b.paused||b.fire>0||!b.conn)continue;let remaining=stage.workers;for(let tier=1;tier<TIERS.length;tier++){const count=Math.min(remaining,Math.max(0,supply[tier]-demand[tier]));demand[tier]+=count;construction[tier]+=count;p.byTier[tier]=count;p.workers+=count;remaining-=count;}}
 return {supply,demand,construction,free:supply.map((n,i)=>n-demand[i]),ratio:supply.map((n,i)=>regular[i]?Math.min(1,n/regular[i]):1)};
};
const civicAssignWorkforce=assignWorkforce;assignWorkforce=function(g){const staff=civicAssignWorkforce(g),effects=civicEffects(g);for(const b of g.blds)if(B[b.type].kind==='prod')b.eff*=effects.production;return staff;};
workforceTop=function(g){const w=workforceFor(g);return TIERS.filter(t=>t&&t.id<=(WORLD?.highestTier||1)).map(t=>`<span class="${w.free[t.id]<0?'neg':''}" title="${t.n}: ${w.free[t.id]} freie Arbeitskräfte" aria-label="${t.n}: ${w.free[t.id]} freie Arbeitskräfte">${ic(t.icon,1)}${w.free[t.id]}</span>`).join(' ');};
workforceTable=function(){const w=workforceFor(G);return `<div class="sect">Arbeitskräfte auf dieser Insel</div><p>Baustellen binden nur freie Bewohner bis zum Abschluss der Bauphase.</p><table class="tbl"><thead><tr><th scope="col">Stufe</th><th scope="col">Bewohner</th><th scope="col">Betriebe</th><th scope="col">Bau</th><th scope="col">Frei</th></tr></thead><tbody>${TIERS.filter(t=>t&&t.id<=(WORLD?.highestTier||1)).map(t=>`<tr><th scope="row">${ic(t.icon,1)} ${t.n}</th><td>${w.supply[t.id]}</td><td>${w.demand[t.id]-w.construction[t.id]}</td><td>${w.construction[t.id]}</td><td>${w.free[t.id]}</td></tr>`).join('')}</tbody></table>`;};
function civicProjectStatus(b){if(!CIVIC_PROJECTS_ENABLED)return 'Großprojekt vorübergehend deaktiviert';const p=civicProjectState(b),stage=CIVIC_PROJECTS[b.type].stages[p.stage];if(b.fire>0)return 'In Flammen';if(b.paused)return 'Pausiert';if(!b.conn)return 'Straßenanschluss fehlt';if(!stage)return 'Fertiggestellt · Inselboni aktiv';if(!p.active)return p.stage?'Bereit für die nächste Bauphase':'Baustelle geplant';if(!p.workers)return 'Freie Bauarbeiter fehlen';if(Object.entries(stage.cost).some(([g,n])=>g!=='gold'&&(b.inputStock?.[g]||0)<n))return 'Material wird angeliefert';return p.workers<stage.workers?'Im Bau · Personal fehlt':'Im Bau';}
function civicStartStage(b){if(!CIVIC_PROJECTS_ENABLED)return false;if(!b||!CIVIC_PROJECTS[b.type])return false;const p=civicProjectState(b),stage=CIVIC_PROJECTS[b.type].stages[p.stage];if(!stage||p.active)return false;if(!b.conn||b.fire>0){p.message='Verbinde die Baustelle mit einem Lager über Straßen.';return false;}if(G.gold<(stage.cost.gold||0)){p.message='Für diese Bauphase fehlt Gold.';return false;}if(!civicProjectWarehouses(b).length){p.message='Kein Lager innerhalb von 72 Straßenfeldern erreichbar.';return false;}G.gold-=stage.cost.gold||0;p.active=true;b.paused=false;delete p.message;assignWorkforce(G);return true;}
function civicProjectWarehouses(b){return whList().map(w=>({b:w,path:deliveryPath(b,w)})).filter(w=>w.path?.length).sort((a,b)=>roadPathDistance(a.path)-roadPathDistance(b.path));}
function civicRequestProjects(dt){G.projectClock=(G.projectClock||0)+dt;if(G.projectClock<2)return;G.projectClock=0;let budget=Math.max(0,Math.min(8,140-G.carts.length));for(const b of civicProjects()){const p=civicProjectState(b),stage=CIVIC_PROJECTS[b.type].stages[p.stage];if(!p.active||!stage||b.paused||!b.conn||b.fire>0||!budget)continue;const warehouses=civicProjectWarehouses(b);if(!warehouses.length)continue;let index=p.dispatchIndex||0;const goods=Object.entries(stage.cost).filter(([g])=>g!=='gold');for(let i=0;i<goods.length&&budget;i++){const [good,n]=goods[(index+i)%goods.length],need=n-(b.inputStock?.[good]||0)-deliveryIncoming(b,good),qty=Math.min(5,need,G.stock[good]||0);if(qty<=0)continue;const w=warehouses[(p.cartNumber||0)%warehouses.length];p.cartNumber=(p.cartNumber||0)+1;G.stock[good]-=qty;G.carts.push({path:w.path.slice().reverse(),t:0,col:good,qty,target:b.id,source:w.b.id,destination:'input',projectCargo:true});budget--;}p.dispatchIndex=(index+1)%goods.length;}}
function civicStepProjects(dt){for(const b of civicProjects()){const p=civicProjectState(b),d=CIVIC_PROJECTS[b.type],stage=d.stages[p.stage];if(p.active&&stage&&!b.paused&&b.conn&&b.fire<=0&&p.workers>0){const materials=Object.entries(stage.cost).every(([g,n])=>g==='gold'||(b.inputStock?.[g]||0)>=n);if(materials){p.progress=Math.min(1,p.progress+dt/stage.seconds*p.workers/stage.workers);if(p.progress>=1){for(const [good,n] of Object.entries(stage.cost))if(good!=='gold'){b.inputStock[good]-=n;OUTSTAT('cons',good,n);}p.stage++;p.active=false;p.progress=0;p.workers=0;G.dirty=true;delete p.message;}}}b.status=civicProjectStatus(b);}}
const civicRequestLogistics=requestLogistics;requestLogistics=function(dt){civicRequestLogistics(dt);civicRequestProjects(dt);};
const civicStep=step;step=function(dt){civicStep(dt);civicStepProjects(dt);};
const civicRemove=removeBld;removeBld=function(b,refund){if(CIVIC_PROJECTS[b.type]||CIVIC_PROJECTS[b.originalType]){for(const cart of G.carts)if(cart.target===b.id&&cart.qty>0){G.stock[cart.col]=(G.stock[cart.col]||0)+cart.qty;cart.qty=0;}for(const [good,n] of Object.entries(b.inputStock||{}))G.stock[good]=(G.stock[good]||0)+n;b.inputStock={};G.carts=G.carts.filter(c=>!c.projectCargo||c.qty>0);G.projectIds=(G.projectIds||[]).filter(id=>id!==b.id);}return civicRemove(b,refund);};

const civicBuildingRelevant=buildingRelevant;buildingRelevant=function(type){return CIVIC_PROJECTS[type]&&!CIVIC_PROJECTS_ENABLED?false:civicBuildingRelevant(type);};
