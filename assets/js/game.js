/* Goldstaub stammt künftig aus seltenen Bergvorkommen; Altbetriebe bleiben ladbar. */
B.goldmine={...B.goldwaescherei,n:'Goldmine',in:{},out:{goldstaub:1},d:'Fördert Goldstaub für Schmuck an einem seltenen festen Goldvorkommen. Ab Patriziern verfügbar.'};
LUXURY_CHAINS.find(c=>c.good==='schmuck').steps[0][0]='goldmine';LUXURY_CHAINS.find(c=>c.good==='schmuck').steps[0][1]='Goldmine';
BUILD_TIER.goldmine=3;BUILD_SIZES.goldmine={...BUILD_SIZES.goldwaescherei};BASE_GEOMETRY.goldmine={...BASE_GEOMETRY.goldwaescherei};
SP.b_goldmine=SP.b_goldwaescherei;SPB.b_goldmine=SPB.b_goldwaescherei;IMPORTED_BUILD_NAMES.goldmine='goldwaescherei';
const goldBuildingRelevant=buildingRelevant;buildingRelevant=function(type){return type!=='goldwaescherei'&&goldBuildingRelevant(type);};
function gameGoldIsland(seed,island=activeIsland){return hs(island,17,seed-island*913+731)<.25;}
/* Gameplay: Versorgung, Notfälle, Darlehen und neue Bauobjekte. */
let GAME_TERRAIN_VERSION=3;
const GAME_GOODS=[['kartoffeln','Kartoffeln',12],['schnaps','Schnaps',30],['haeute','Häute',14],['leder','Leder',25],['stiefel','Lederstiefel',50],['wachs','Wachs',18],['docht','Docht',18],['kerzen','Kerzen',45]];
for(const [id,n,v] of GAME_GOODS){const good={id,n,v};GOODS.push(good);GN[id]=good;}
const GAME_CHAINS=[
 ['kartoffelhof','Kartoffelhof',1,{},'kartoffeln',30,12,200],
 ['brennerei','Brennerei',1,{kartoffeln:1},'schnaps',30,18,300],
 ['rinderhof','Rinderhof',2,{},'haeute',60,20,450],
 ['gerberei','Gerberei',2,{haeute:1},'leder',45,25,600],
 ['schuster','Schuster',2,{leder:1},'stiefel',60,30,700],
 ['dochtdreherei','Dochtdreherei',2,{wolle:1},'docht',30,18,400],
 ['kerzenzieherei','Kerzenzieherei',2,{wachs:1,docht:1},'kerzen',60,35,1000]
];
for(const [id,n,tier,input,good,cycle,upk,gold] of GAME_CHAINS){
 B[id]={n,cat:Object.keys(input).length?'veredel':'roh',kind:'prod',w:3,h:3,cost:{gold,bretter:4+tier*2,...(tier>1?{stein:6+tier*2}:{})},upk,cycle,in:input,out:{[good]:1},transportRange:36,req:0,workforce:{tier:Math.max(1,tier-1),count:tier===1?3:4},d:`Produziert ${GN[good].n}. Verbinde den Betrieb über Straßen mit einem Lager oder Abnehmer.`};
 BASE_GEOMETRY[id]={w:2,h:2,range:24};BUILD_SIZES[id]={w:3,h:3};BUILD_TIER[id]=Math.max(1,tier-1);
}
// Dochtdreherei: einheitlich 3 × 2 Kacheln, auch nach startNew/Skalierung.
BASE_GEOMETRY.dochtdreherei.h=4/3;
BUILD_TIER.dochtdreherei=2;B.dochtdreherei.h=2;BUILD_SIZES.dochtdreherei.h=2;B.dochtdreherei.workforce={tier:2,count:4};BUILD_TIER.kerzenzieherei=2;B.kerzenzieherei.workforce={tier:2,count:4};
FIELD_RULES.kartoffelhof={type:'acker',count:16};B.kartoffelhof.fieldRule=FIELD_RULES.kartoffelhof;
FIELD_RULES.rinderhof={type:'gehege',count:3};B.rinderhof.fieldRule=FIELD_RULES.rinderhof;
FIELD_CROP_SPRITES.kartoffelhof='acker_kartoffeln';
B.imkerei.out.wachs=1;B.imkerei.d='Gewinnt Honig und Wachs.';
TIERS[1].goods.schnaps=.018;TIERS[2].goods.stiefel=.015;TIERS[2].goods.kerzen=.012;TIERS[3].goods.kerzen=.012;
for(const [g,rate] of Object.entries(TIERS[2].goods))TIERS[2].goods[g]=rate*.5;
const HOUSE_FLAVOR=Object.freeze({
 1:'Einfache einfaches und bescheidenes Haus.',
 2:'Ein Haus von einfachem Wohlstand.',
 3:'Ein Haus mit gehobener Ausstattung.',
 4:'Ein großes und luxuriöses Haus.'
});
// Each fulfilled need grants whole residents; luxury only grants income.
function gameHouseNeeds(b){const t=TIERS[b.tier];return {services:t.svc,goods:Object.keys({...t.goods,...additionalHouseGoods(b)})};}
function gameHouseNeedCount(b){const needs=gameHouseNeeds(b);return needs.services.length+needs.goods.length;}
const GAME_NEED_BONUSES=Object.freeze({3:Object.freeze({kerzen:2,feine_kleidung:2,geschirr:2,buecher:2}),4:Object.freeze({brot:1,tuch:1})});
function gameResidentsForNeed(b,need){return GAME_NEED_BONUSES[b.tier]?.[need]??(b.tier===4?2:1);}
function gameRefreshHouseCapacities(){
 for(const tier of TIERS.filter(Boolean)){const b={tier:tier.id},needs=gameHouseNeeds(b);tier.cap=[...needs.services,...needs.goods].reduce((sum,need)=>sum+gameResidentsForNeed(b,need),0);}
}
gameRefreshHouseCapacities();
function gameHouseNeedLabel(b,need,name){const t=TIERS[b.tier];return `<span class="need-name">${esc(name)}</span><span class="need-residents">(+${gameResidentsForNeed(b,need)} ${ic(t.icon,1)}<span class="sr-only">${esc(t.n)}</span>)</span>`;}
function gameHouseCapacity(b){
 if(!b.conn||b.fire>0)return 0;
 const needs=gameHouseNeeds(b);
 return needs.services.filter(s=>!!b.cov[s]).reduce((sum,s)=>sum+gameResidentsForNeed(b,s),0)+needs.goods.filter(g=>houseGoodSupplied(b,g)).reduce((sum,g)=>sum+gameResidentsForNeed(b,g),0);
}
function gameHousePopulationStep(b,target,dt,lossSeconds=60){
 const cap=typeof cityHouseTotalMaximum==='function'?cityHouseTotalMaximum(b.tier):TIERS[b.tier].cap;
 b.pop=Math.max(0,Math.round(Number.isFinite(Number(b.pop))?Number(b.pop):0));target=Math.max(0,Math.min(cap,Math.round(target)));
 const direction=Math.sign(target-b.pop);
 if(!direction){b.populationProgress=0;b.populationDirection=0;return;}
 if(!(dt>0)||!Number.isFinite(dt))return;
 if(b.populationDirection!==direction)b.populationProgress=0;
 b.populationDirection=direction;
 b.populationProgress=(b.populationProgress||0)+cap/(direction>0?40:lossSeconds)*dt;
 const people=Math.min(Math.abs(target-b.pop),Math.floor(b.populationProgress+1e-9));
 b.pop+=direction*people;b.populationProgress=Math.max(0,b.populationProgress-people);
 if(b.pop===target){b.populationProgress=0;b.populationDirection=0;}
}
const gamePopulationUnpack=unpackIsland;
unpackIsland=function(...args){const island=gamePopulationUnpack(...args);for(const b of island.blds)if(b.type==='haus')b.pop=Math.max(0,Math.round(Number.isFinite(Number(b.pop))?Number(b.pop):0));return island;};
const gamePopulationPack=packIsland;
packIsland=function(island){const saved=gamePopulationPack(island);for(const b of saved.blds)if(b.type==='haus'){const live=island.byId.get(b.id);b.populationProgress=live.populationProgress||0;b.populationDirection=live.populationDirection||0;}return saved;};
function gameProductionStatus(b){
 if(b.fire>0)return 'In Flammen';if(b.paused)return 'Pausiert';if(!b.conn)return 'Kein Straßenanschluss';
 if(B[b.type].kind!=='prod')return 'In Betrieb';if(!productionLinked(b))return 'Verbinde den Betrieb mit einem Lager oder Abnehmer';
 if(b.eff<=0)return b.staffEff===0?'Arbeitskräfte fehlen':'Ressourcen fehlen';
 if(Object.entries(B[b.type].in||{}).some(([g,n])=>deliveryStock(b,g)<n))return 'Rohstoffe fehlen';return 'Produziert';
}
function buildingWindowStatus(b){
 const d=def(b);let text=b.fire>0?'In Flammen':b.paused?'Pausiert':d.kind==='prod'?gameProductionStatus(b):b.status||'In Betrieb';
 if(!b.fire&&!b.paused&&d.kind==='prod'&&text==='Produziert'&&b.status)text=b.status;
 if(!b.fire&&!b.paused&&d.transportRange&&!warehouseTarget(b)&&!(d.kind==='prod'&&productionLinked(b)))text='Kein Lager in Reichweite';
 return {text,error:b.fire>0||(!b.paused&&(/fehlt|fehlen|^Kein|^Keine|außerhalb|Wartet|voll|Unzufrieden|Verelendet/.test(text)||d.kind==='prod'&&!text.startsWith('Produziert')))};
}
for(const [type,d] of Object.entries(B))if((BUILD_TIER[type]||d.workforce?.tier||1)>=2){
 d.cost=Object.fromEntries(Object.entries(d.cost||{}).map(([g,n])=>[g,Math.ceil(n*1.3)]));d.upk=Math.ceil((d.upk||0)*1.3);
}
for(const tier of [2,3])UPG[tier]=Object.fromEntries(Object.entries(UPG[tier]).map(([g,n])=>[g,Math.ceil(n*1.3)]));
B.feuer.d='Verbinde die Wache mit Straßen. Ein Löschwagen bekämpft jeweils einen Brand in Reichweite.';
B.markt.d='Versorgt angeschlossene Häuser in Reichweite mit Waren aus dem Inselvorrat.';
B.lager.d='Erweitert den Inselvorrat. Verbinde das Lager über Straßen mit deinen Betrieben.';
B.fischer.d='Fängt Fisch. Platziere die Hütte direkt an einer Wasserkante.';
B.haus.d='Verbinde das Haus mit Straßen und versorge es über einen Marktplatz.';
B.kontor.d='Hafen und Inselvorrat. Baue Betriebe und verbinde sie über Straßen mit dem Kontor.';
B.farm.d='Erntet Getreide. Lege die benötigten Ackerflächen an.';
B.lehmgrube.d='Gewinnt Lehm. Platziere die Grube auf einem Lehmvorkommen.';
B.ziegelei.d='Brennt Lehm und Holz zu Ziegeln.';
B.forschung.d='Erzeugt Wissen aus angeschlossenen Häusern. Öffne den Forschungsbaum und wähle eine Forschung.';
B.steinbruch.d='Gewinnt Stein. Platziere den Steinbruch auf einem Steinabbauplatz und baue eine Zufahrtsstraße.';
B.mine.d='Fördert Eisenerz. Platziere die Mine auf einem Erzabbauplatz und baue eine Zufahrtsstraße.';

const GAME_DECOR=[
 ['blumenkuebel','Blumenkübel',1,1,25],['wegweiser','Wegweiser',1,1,35],['laterne','Laterne',1,1,45],['lampe','Straßenlampe',1,1,60],
 ['strauch','Zierstrauch',1,1,25],['bank','Gartenbank',2,1,50],['blumenbeet','Blumenbeet',2,1,60],['baum','Zierbaum',2,2,90],
 ['brunnen','Zierbrunnen',2,2,150],['teich','Gartenteich',3,2,180],['park','Kleiner Park',3,3,250],['garten','Großer Garten',4,3,350]
];
for(const [id,n,w,h,gold] of GAME_DECOR){const type='deko_'+id;B[type]={n,cat:'deko',kind:'decor',w,h,cost:{gold},upk:0,req:0,d:'Platziere die Dekoration auf einer freien Grünfläche.'};BUILD_SIZES[type]={w,h};BASE_GEOMETRY[type]={w:w/1.5,h:h/1.5};}
Object.assign(B.steinbruch,{w:2,h:3});BUILD_SIZES.steinbruch={w:2,h:3};
const gameScale=configureBuildingScale;configureBuildingScale=function(...args){gameScale(...args);Object.assign(B.dochtdreherei,{w:3,h:2});BUILD_SIZES.dochtdreherei={w:3,h:2};Object.assign(B.steinbruch,{w:2,h:3});BUILD_SIZES.steinbruch={w:2,h:3};for(const [id,,w,h] of GAME_DECOR){const d=B['deko_'+id];Object.assign(d,{w,h});BUILD_SIZES['deko_'+id]={w,h};}installNativeBuildings();};

/* Der Strand richtet sich nach der tatsächlichen Wasserkante der Grundfläche. */
function gameCoastSide(x,y,w,h){
 const sides=[['north',Array.from({length:w},(_,i)=>[x+i,y-1])],['east',Array.from({length:h},(_,i)=>[x+w,y+i])],['south',Array.from({length:w},(_,i)=>[x+i,y+h])],['west',Array.from({length:h},(_,i)=>[x-1,y+i])]];
 const ranked=sides.map(([side,cells])=>({side,count:cells.filter(([a,b])=>INMAP(a,b)&&G.tiles[IDX(a,b)]<=T.SHAL).length})).sort((a,b)=>b.count-a.count);
 return ranked[0].count>=2?ranked[0].side:null;
}
function gameMountainSite(type,x,y){return ['mine','steinbruch','goldmine'].includes(type)&&G.deposits.some(n=>n.type===type&&n.x===x&&n.y===y&&n.inMountain&&!n.legacy);}
function gameReservedLand(type,x,y,w,h){
 const cells=footprintCells(x,y,w,h),nodes=G.deposits||[];
 for(const n of nodes){const d=B[n.type];if(n.type===type&&n.x===x&&n.y===y)continue;
  if(cells.some(([a,b])=>a>=n.x&&a<n.x+d.w&&b>=n.y&&b<n.y+d.h))return 'Halte das Vorkommen für den Abbaubetrieb frei.';
 }
 if(B[type].place!=='coast'&&!B[type].allowSand&&cells.some(([a,b])=>INMAP(a,b)&&G.tiles[IDX(a,b)]===T.SAND))return 'Kann nicht auf Sand gebaut werden.';
 return null;
}
const gameCanPlace=canPlace;canPlace=function(type,x,y){if(type==='goldwaescherei')return {ok:false,why:'Baue eine Goldmine an einem Goldvorkommen.'};const size=buildingSize(type,UI.tool==='build'&&UI.type===type?UI.rotation||0:0),why=gameReservedLand(type,x,y,size.w,size.h);return why?{ok:false,why}:gameCanPlace(type,x,y);};
const gameCanMove=canMoveBuilding;canMoveBuilding=function(b,x,y){if(!b)return gameCanMove(b,x,y);const size=movedBuildingSize(b,UI.tool==='move'&&UI.moveId===b.id?UI.rotation||0:b.rotation||0),why=gameReservedLand(b.type,x,y,size.w,size.h);return why?{ok:false,why}:gameCanMove(b,x,y);};
const gamePlaceRoad=placeRoad;placeRoad=function(x,y){if((G.deposits||[]).some(n=>{const d=B[n.type];return x>=n.x&&x<n.x+d.w&&y>=n.y&&y<n.y+d.h;}))return false;return gamePlaceRoad(x,y);};
const gameTool=setTool;setTool=function(t,type){gameTool(t,type);if(['mine','steinbruch','goldmine','lehmgrube'].includes(type))UI.rotation=0;};

/* Jeder Waldtile liefert insgesamt höchstens einen Ressourcenpunkt. */
function gameAssignTrees(){
 const workers=G.blds.filter(b=>B[b.type].env?.t==='tree'&&!b.paused&&b.fire<=0&&b.conn);
 for(const b of G.blds.filter(b=>B[b.type].env?.t==='tree')){b.envCount=0;b.envEff=0;b.eff=0;}
 const claims=new Map();
 for(const b of workers){const r=B[b.type].env.r;for(let y=Math.floor(cy(b)-r);y<=cy(b)+r;y++)for(let x=Math.floor(cx(b)-r);x<=cx(b)+r;x++){
  if(!INMAP(x,y)||Math.hypot(x+.5-cx(b),y+.5-cy(b))>r)continue;const k=IDX(x,y);if(G.tiles[k]!==T.FOREST||G.occ[k]||G.road[k])continue;
  if(!claims.has(k))claims.set(k,[]);claims.get(k).push(b);
 }}
 for(const list of claims.values())for(const b of list)b.envCount+=1/list.length;
 for(const b of workers){b.envEff=Math.min(1,b.envCount/B[b.type].env.need);b.eff=b.envEff*(b.staffEff??1);}
}
const gameRebuild=rebuildNet;rebuildNet=function(){gameRebuild();gameAssignTrees();};
const gameEnvFor=envFor;envFor=function(type,x,y){const result=gameEnvFor(type,x,y);if(!result||B[type].env.t!=='tree')return result;const d=B[type],workers=G.blds.filter(b=>b.type===type&&!b.paused&&b.fire<=0&&b.conn&&!(UI.tool==='move'&&UI.moveId===b.id));let n=0;
 for(let j=Math.floor(y+d.h/2-d.env.r);j<=y+d.h/2+d.env.r;j++)for(let i=Math.floor(x+d.w/2-d.env.r);i<=x+d.w/2+d.env.r;i++){if(!INMAP(i,j)||Math.hypot(i+.5-x-d.w/2,j+.5-y-d.h/2)>d.env.r)continue;const k=IDX(i,j);if(G.tiles[k]!==T.FOREST||G.occ[k]||G.road[k]||i>=x&&i<x+d.w&&j>=y&&j<y+d.h)continue;n+=1/(1+workers.filter(b=>Math.hypot(i+.5-cx(b),j+.5-cy(b))<=B[b.type].env.r).length);}
 return {n,need:d.env.need,eff:Math.min(1,n/d.env.need)};
};

/* Brände: ein Wagen je Wache, Straßenfahrt, Ausbreitung und geschützter Löscheinsatz. */
function gameFireProtected(b){return G.blds.some(station=>station.type==='feuer'&&station.conn&&!station.paused&&station.fire<=0&&serviceCovers(station,b)&&deliveryPath(station,b)?.length);}
function gameWarnUnprotectedFire(b){if(b.fireWarningRaised||gameFireProtected(b))return;b.fireWarningRaised=true;const name=bname(b);msg(name+' brennt und es ist keine Feuerwehr in der Nähe!','i_alert',{buildingId:b.id,island:b.island??activeIsland,buildingName:name});}
function gameIgnite(b){if(!b||b.fire>0||B[b.type].cat==='dienst'||['wh','field','ruin','decor','svc'].includes(B[b.type].kind))return false;b.fire=60;b.extinguish=0;b.fireWarningRaised=false;G.dirty=true;gameWarnUnprotectedFire(b);return true;}
function gameEngineArrived(b){return (G.fireEngines||[]).some(e=>e.phase!=='return'&&e.target===b.id&&e.t>=e.path.length-1&&gameValidEngine(e));}
function gameValidEngine(e){const station=G.byId.get(e.station),target=G.byId.get(e.target);if(!station||!station.conn||station.paused||station.fire>0||!e.path.length||e.path.some(k=>!G.road[k]))return false;
 if(e.phase==='return')return ringCells(station).some(([x,y])=>INMAP(x,y)&&IDX(x,y)===e.path[e.path.length-1]);
 return target&&target.fire>0&&(e.phase==='service'||ringCells(station).some(([x,y])=>INMAP(x,y)&&IDX(x,y)===e.path[0]))&&ringCells(target).some(([x,y])=>INMAP(x,y)&&IDX(x,y)===e.path[e.path.length-1])&&serviceCovers(station,target);
}
function gameEngineRoadPath(start,target){const ends=new Set(ringCells(target).filter(([x,y])=>INMAP(x,y)&&G.road[IDX(x,y)]).map(([x,y])=>IDX(x,y))),queue=[start],previous=new Map([[start,-1]]);for(let i=0;i<queue.length;i++){const cell=queue[i];if(ends.has(cell)){const path=[];for(let k=cell;k>=0;k=previous.get(k))path.push(k);return path.reverse();}for(const next of roadNeighbours(cell))if(!previous.has(next)){previous.set(next,cell);queue.push(next);}}return null;}
function gameReturnEngine(e){const station=G.byId.get(e.station),start=e.path[Math.min(e.path.length-1,Math.floor(e.t))];e.path=station&&gameEngineRoadPath(start,station)||e.path.slice(0,Math.min(e.path.length,Math.ceil(e.t)+1)).reverse();e.t=0;e.phase='return';}
function gameDispatchNextFire(e){const station=G.byId.get(e.station),start=e.path.at(-1);if(!station)return false;const targets=G.blds.filter(b=>b.fire>0&&!G.fireEngines.some(other=>other!==e&&other.phase!=='return'&&other.target===b.id)&&serviceCovers(station,b)).sort((a,b)=>a.fire-b.fire);for(const target of targets){const path=gameEngineRoadPath(start,target);if(path?.length){e.target=target.id;e.path=path;e.t=0;e.phase='service';return true;}}return false;}
function gameFireStep(dt){
 for(const b of G.blds)if(B[b.type].cat==='dienst'||['field','svc'].includes(B[b.type].kind))b.fire=0;
 for(const e of G.fireEngines||[])if(e.phase!=='return'&&G.byId.get(e.target)?.fire<=0)gameReturnEngine(e);
 G.fireEngines=(G.fireEngines||[]).filter(e=>gameValidEngine(e)&&!(e.phase==='return'&&e.t>=e.path.length-1));G.nextFire-=dt;
 if(G.nextFire<=0){G.nextFire=420+Math.random()*300;const candidates=G.blds.filter(b=>B[b.type].cat!=='dienst'&&!['wh','field','ruin','decor','svc'].includes(B[b.type].kind)&&b.fire<=0);if(candidates.length>10&&totalPop()>=40)gameIgnite(candidates[Math.floor(Math.random()*candidates.length)]);}
 const burning=G.blds.filter(b=>b.fire>0&&B[b.type].kind!=='field');
 for(const station of G.blds.filter(b=>b.type==='feuer'&&b.conn&&!b.paused&&b.fire<=0)){
  let available=emergencyVehicleCapacity(station)-G.fireEngines.filter(e=>e.station===station.id).length;
  if(available<=0)continue;
  const candidates=burning.filter(b=>!G.fireEngines.some(e=>e.target===b.id)&&serviceCovers(station,b)).sort((a,b)=>a.fire-b.fire);
  for(const b of candidates){const path=deliveryPath(station,b);if(path?.length){G.fireEngines.push({station:station.id,target:b.id,path,t:0});if(--available<=0)break;}}
 }
 for(const e of G.fireEngines)e.t=Math.min(e.path.length-1,e.t+dt*2.4);
 for(const b of burning){
  gameWarnUnprotectedFire(b);
  if(gameEngineArrived(b)){b.extinguish=Math.min(1,(b.extinguish||0)+dt/12);b.status='Wird gelöscht';if(b.extinguish>=1){b.fire=0;b.extinguish=0;G.dirty=true;for(const e of G.fireEngines.filter(e=>e.phase!=='return'&&e.target===b.id))if(!gameDispatchNextFire(e))gameReturnEngine(e);msg('Der Brand in '+bname(b)+' wurde gelöscht.','i_kreuz');}continue;}
  const neighbors=G.blds.filter(n=>n!==b&&n.fire<=0&&B[n.type].cat!=='dienst'&&!['wh','field','ruin','decor','svc'].includes(B[n.type].kind)&&Math.hypot(Math.max(0,n.x-b.x-b.w,b.x-n.x-n.w),Math.max(0,n.y-b.y-b.h,b.y-n.y-n.h))<=1.5);
  for(const neighbor of neighbors)if(Math.random()<1-Math.exp(-.004*dt))gameIgnite(neighbor);
  b.fire-=dt;if(b.fire<=0){msg(bname(b)+' ist niedergebrannt. Baue die Ruine wieder auf.','i_alert');burnBuilding(b);}
 }
 G.fireEngines=G.fireEngines.filter(gameValidEngine);
}
function gameVehicleDirection(e){const last=e.path.length-1,i=Math.min(last,Math.floor(e.t)),a=e.path[i],next=e.path[Math.min(i+1,last)],previous=next===a&&i>0?e.path[i-1]:a,dx=Math.sign(next%MAPW-previous%MAPW),dy=Math.sign(Math.floor(next/MAPW)-Math.floor(previous/MAPW));return (dy<0?'n':dy>0?'s':'')+(dx<0?'w':dx>0?'e':'')||'e';}
const gameDrawWarnings=drawBuildingWarnings;drawBuildingWarnings=function(ctx,...args){gameDrawWarnings(ctx,...args);
 for(const g of WORLD.islands.filter(Boolean))for(const e of g.fireEngines||[]){const i=Math.min(e.path.length-1,Math.floor(e.t)),a=e.path[i],b=e.path[Math.min(i+1,e.path.length-1)],f=e.t-i,x=((a%MAPW)+(b%MAPW-a%MAPW)*f+.5)*16,y=(Math.floor(a/MAPW)+(Math.floor(b/MAPW)-Math.floor(a/MAPW))*f+.5)*16;const direction=gameVehicleDirection(e),review=window.SpriteReview?.vehiclePresentation('fire-engine',direction,g,e.t<e.path.length-1,e.target||0);const size=review?review.width:16;ctx.drawImage(review||SP['game_loeschwagen_'+direction],x-size/2,y-size/2-1,size,size);}
 for(const b of worldBuildings())if(b.fire>0&&b.extinguish>0){const x=cx(b)*16-16,y=b.y*16-18;ctx.fillStyle='#231b13';ctx.fillRect(x-1,y-1,34,6);ctx.fillStyle='#617052';ctx.fillRect(x,y,32,4);ctx.fillStyle='#78bd69';ctx.fillRect(x,y,32*b.extinguish,4);}
};

/* Darlehen gelten für das gesamte Reich. Raten können den Goldstand ins Minus bringen. */
const LOAN_OPTIONS=[{amount:5000,tier:1,name:'Winziges Darlehen'},{amount:10000,tier:2,name:'Kleines Darlehen'},{amount:50000,tier:3,name:'Großes Darlehen'},{amount:100000,tier:4,name:'Riesiges Darlehen'}];
function loanUnlocked(option){return (WORLD?.highestTier||1)>=option.tier;}
function gameBorrow(amount){const option=LOAN_OPTIONS.find(o=>o.amount===amount);if(WORLD.loan||!option||!loanUnlocked(option))return false;WORLD.loan={principal:amount,balance:amount*1.1,rate:amount*1.1/30,remaining:1800};G.gold+=amount;gameSyncGold();saveGame();return true;}
function gameSyncGold(){for(const g of WORLD.islands)if(g&&!g.cpu)g.gold=G.gold;}
function gameRepay(){const loan=WORLD.loan;if(!loan||G.gold+1e-8<loan.balance)return false;G.gold-=loan.balance;WORLD.loan=null;gameSyncGold();saveGame();return true;}
function gameLoanStep(dt){const loan=WORLD.loan;if(!loan)return;const payment=Math.min(loan.balance,loan.rate*dt/60);G.gold-=payment;loan.balance=Math.max(0,loan.balance-payment);loan.remaining=Math.max(0,loan.remaining-dt);if(loan.balance<1e-7){WORLD.loan=null;msg('Dein Darlehen ist vollständig zurückgezahlt.','gold');}gameSyncGold();}
const gameStepWorld=stepWorld;stepWorld=function(dt){gameStepWorld(dt);gameLoanStep(dt);gameQuestBadge();};
const gameFinHTML=finHTML;finHTML=function(){const loan=WORLD.loan;return gameFinHTML()+`<div class="sect">Darlehen</div>${loan?`<div class="kv"><span>Restschuld</span><b>${loan.balance.toFixed(1)} Gold</b></div><p>${loan.rate.toFixed(1)} Gold / Min. · ${Math.ceil(loan.remaining/60)} Min. verbleibend</p><button class="btn" data-act="loan-repay" ${G.gold>=loan.balance?'':'disabled'}>Restschuld zurückzahlen</button>`:`<p>10 % Gesamtzins · automatische Raten über 30 Spielminuten</p><div class="loan-options">${LOAN_OPTIONS.map(option=>`<button class="btn" data-act="loan-borrow" data-amount="${option.amount}" ${loanUnlocked(option)?'':'disabled'}><b>${option.name}</b><span>${fmt(option.amount)} Gold · ab ${TIERS[option.tier].n}</span></button>`).join('')}</div>`}`;};
const gameEconomy=economy;economy=function(){const e=gameEconomy(),payment=WORLD?.loan?.rate||0;return {...e,upk:e.upk+payment,net:e.net-payment};};
const gameWinAct=winAct;winAct=function(id,ds){if(ds.act==='loan-borrow')gameBorrow(Number(ds.amount));else if(ds.act==='loan-repay')gameRepay();else gameWinAct(id,ds);if(ds.act==='pause'||ds.act.startsWith('loan-')){const held=UI.holdUI;UI.holdUI=false;for(const w of Object.values(WINS)){w.hold=false;w.last=null;refreshWin(w);}renderTop(true);UI.holdUI=held;}};

/* Ungeschützte Brände lösen genau eine Warnung und einen Alarm je Brand aus. */
function gameIsFireWarning(text,icon){return icon==='i_alert'&&typeof text==='string'&&text.endsWith(' brennt und es ist keine Feuerwehr in der Nähe!');}
const questButton=sidebar.querySelector('[data-side="quest"]');questButton.insertAdjacentHTML('beforeend','<span class="side-event-count" aria-hidden="true" hidden></span>');
function gameQuestBadge(){if(!WORLD)return;const seen=new Set(WORLD.questSeen||[]),current=activeQuest(),notifications=[...QUESTS.filter(q=>G.quests[q.id]).map(q=>'done:'+q.id),...(current?['new:'+current.id]:[])],unread=notifications.filter(key=>!seen.has(key));
 if(UI.sidebarTab==='quest'){WORLD.questSeen=[...new Set([...seen,...notifications])];unread.length=0;}
 const badge=questButton.querySelector('.side-event-count');badge.textContent=String(unread.length);badge.hidden=!unread.length;questButton.setAttribute('aria-label',unread.length?'Aufträge · '+unread.length+' neue Meldungen':'Aufträge');
}
const gameToggleSidebar=toggleSidebar;toggleSidebar=function(...args){gameToggleSidebar(...args);gameQuestBadge();};
const gameOpenQuest=openWin_quest;openWin_quest=function(){gameOpenQuest();WORLD.questSeen=[...QUESTS.filter(q=>G.quests[q.id]).map(q=>'done:'+q.id),...(activeQuest()?['new:'+activeQuest().id]:[])];gameQuestBadge();};
// Zwei übereinanderliegende Icon-Schalter für Schiffe und Dekoration.
const barModes=document.createElement('div');barModes.id='barModes';
const dekoToggle=document.createElement('button');dekoToggle.id='dekoToggle';dekoToggle.type='button';dekoToggle.setAttribute('aria-label','Dekoration anzeigen');dekoToggle.title='Dekoration';dekoToggle.innerHTML=ic('b_deko_blumenkuebel',1.5);
document.body.append(barModes);barModes.append(dekoToggle,$('#barToggle'));
const gameRenderBar=renderBar;renderBar=function(){
 $('#bar').classList.toggle('deko-mode',UI.barMode==='deko');
 if(UI.barMode==='deko'){
  UI.cat=null;renderItems(true);const el=$('#bar'),h=GAME_DECOR.map(([id,n,w,h])=>{const type='deko_'+id,d=B[type];return `<button class="cb shiptile deko-card ${UI.tool==='build'&&UI.type===type?'on':''}" data-deko-build="${type}" data-b="${type}" title="${attr(n)} · ${w} × ${h}"><img class="px" alt="" src="${url(typeSprite(type))}" style="height:40px;width:auto"><span>${esc(n)}</span><span class="cost">${costHTML(d.cost)}</span></button>`;}).join('');if(el._last!==h){const scroll=el.querySelector('.deko-viewport')?.scrollLeft||0;el.innerHTML=`<button type="button" class="item-scroll" data-deko-scroll="left" aria-label="Vorherige Dekorationen anzeigen" aria-controls="deko-viewport" hidden>←</button><div id="deko-viewport" class="deko-viewport" role="group" aria-label="Dekorationen" tabindex="0"><div class="deko-track">${h}</div></div><button type="button" class="item-scroll" data-deko-scroll="right" aria-label="Weitere Dekorationen anzeigen" aria-controls="deko-viewport" hidden>→</button>`;el.querySelector('.deko-viewport').scrollLeft=scroll;el._last=h;el._fleetLast=null;}updateDekoNavigation();
  $('#barToggle').innerHTML=ic('i_ship',1.5);$('#barToggle').setAttribute('aria-label','Schiffe anzeigen');$('#barToggle').setAttribute('aria-pressed','false');
 }else gameRenderBar();
 dekoToggle.classList.toggle('on',UI.barMode==='deko');dekoToggle.setAttribute('aria-pressed',String(UI.barMode==='deko'));dekoToggle.setAttribute('aria-label',UI.barMode==='deko'?'Baukategorien anzeigen':'Dekoration anzeigen');
 const dekoIcon=UI.barMode==='deko'?'i_houses':'game_deko';if(dekoToggle.dataset.icon!==dekoIcon){dekoToggle.innerHTML=ic(dekoIcon,1.5);dekoToggle.dataset.icon=dekoIcon;}dekoToggle.title=UI.barMode==='deko'?'Baukategorien anzeigen':'Dekoration anzeigen';
};
function updateDekoNavigation(){
 const box=$('#bar'),viewport=box.querySelector('.deko-viewport');if(!viewport)return;
 const track=viewport.querySelector('.deko-track'),overflow=track.scrollWidth>box.clientWidth-12;box.classList.toggle('has-deko-overflow',overflow);
 const max=Math.max(0,viewport.scrollWidth-viewport.clientWidth);for(const button of box.querySelectorAll('[data-deko-scroll]')){button.hidden=!overflow;button.disabled=button.dataset.dekoScroll==='left'?viewport.scrollLeft<=1:viewport.scrollLeft>=max-1;}
}
function scrollDekoItems(direction){const viewport=$('#bar').querySelector('.deko-viewport');if(viewport)viewport.scrollBy({left:direction*Math.max(180,Math.floor(viewport.clientWidth*.8)),behavior:WORK_ART.reduced.matches?'auto':'smooth'});}
$('#bar').addEventListener('click',e=>{const button=e.target.closest('[data-deko-scroll]');if(button&&!button.disabled)scrollDekoItems(button.dataset.dekoScroll==='left'?-1:1);});
$('#bar').addEventListener('scroll',updateDekoNavigation,true);
$('#bar').addEventListener('keydown',e=>{if(!e.target.matches('.deko-viewport'))return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();scrollDekoItems(e.key==='ArrowLeft'?-1:1);}else if(e.key==='Home'||e.key==='End'){e.preventDefault();e.target.scrollLeft=e.key==='Home'?0:e.target.scrollWidth;updateDekoNavigation();}});
new ResizeObserver(updateDekoNavigation).observe($('#bar'));
dekoToggle.addEventListener('click',()=>{UI.barMode=UI.barMode==='deko'?'build':'deko';UI.cat=null;setTool(null);$('#bar')._last=null;renderBar();});
$('#bar').addEventListener('click',e=>{const button=e.target.closest('[data-deko-build]');if(button){setTool('build',button.dataset.dekoBuild);selectB(null);renderBar();}});
// Die geführte Einführung wird im abschließend geladenen Startmodul eingerichtet.
const gameInfoHTML=infoHTML;infoHTML=function(){let h=gameInfoHTML();const b=G.byId.get(UI.sel);if(b?.fire>0&&gameEngineArrived(b))h+=`<p>Löscheinsatz · ${Math.round((b.extinguish||0)*100)} %</p>${bar(b.extinguish||0,'#78bd69')}`;return h;};

/* Neue Welten erhalten gerade Hafenstrände und Abbauflächen im Gebirge. */
const gameLocalTerrain=localTerrain;localTerrain=function(seed,profile,...args){
 const result=gameLocalTerrain(seed,profile,...args);if(GAME_TERRAIN_VERSION<3)return result;
 const size=ISLAND_SIZE,mx=Math.floor(size/2),my=Math.floor(size/2),halfW=Math.max(8,Math.round(profile.size*22)),halfH=Math.max(6,Math.round(profile.size*14));
 // Abgerundete, unregelmäßige Felsrücken mit zugänglichen Abbaukanten.
 const phase=hs(seed,81,9)*Math.PI*2;
 for(let y=my-halfH-2;y<=my+halfH+2;y++)for(let x=mx-halfW-2;x<=mx+halfW+2;x++){
  const k=y*size+x;if(result.tiles[k]<=T.SHAL)continue;
  const nx=(x-mx)/halfW,ny=(y-my)/halfH,angle=Math.atan2(ny,nx),edge=.84+.09*Math.sin(angle*3+phase)+.06*Math.sin(angle*5-phase)+.12*(fbm(seed+81,x/7,y/7)-.5);
  if(Math.hypot(nx,ny)<edge){result.tiles[k]=profile.ore>0&&hs(x,y,seed+812)<Math.min(.5,profile.ore*.22)?T.ORE:T.ROCK;result.massif[k]=1;}
  else if(result.tiles[k]===T.ROCK||result.tiles[k]===T.ORE){result.tiles[k]=T.GRASS;result.massif[k]=0;}
 }
 return result;
};
const gameLimitBeaches=limitBeaches;limitBeaches=function(tiles,seed){
 const beaches=gameLimitBeaches(tiles,seed);if(GAME_TERRAIN_VERSION<3)return beaches;
 const size=ISLAND_SIZE,w=B.kontor.w,h=B.kontor.h,at=(x,y)=>x<0||y<0||x>=size||y>=size?T.DEEP:tiles[y*size+x];
 const usable=(x,y)=>footprintCells(x,y,w,h).every(([a,b])=>BUILDABLE(at(a,b)))&&[
  Array.from({length:w},(_,i)=>at(x+i,y-1)),Array.from({length:w},(_,i)=>at(x+i,y+h)),
  Array.from({length:h},(_,i)=>at(x-1,y+i)),Array.from({length:h},(_,i)=>at(x+w,y+i))
 ].some(cells=>cells.filter(t=>t<=T.SHAL).length>=2);
 return beaches.flatMap(beach=>{for(let r=0;r<=5;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++)if(usable(beach.x+dx,beach.y+dy))return [{x:beach.x+dx,y:beach.y+dy}];return [];});
};
function gameDepositAnchor(x,y,w,h,side){
 return {x:side==='west'?x:side==='east'?x+w-1:x+Math.floor((w-1)/2),y:side==='north'?y:side==='south'?y+h-1:y+Math.floor((h-1)/2),side};
}
/* Mine access must belong to the continuous main building area, not a tiny
   grass pocket enclosed by rock or sea. Computed once per generation pass. */
function depositAccessMap(tiles,profile=ISLANDS[activeIsland]){
 const size=ISLAND_SIZE,labels=new Int32Array(size*size);let label=0,largest=0,largestCount=0;
 const open=(x,y)=>x>=0&&y>=0&&x<size&&y<size&&BUILDABLE(tiles[IDX(profile.ox+x,profile.oy+y)]);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const start=y*size+x;if(labels[start]||!open(x,y))continue;label++;const queue=[start];labels[start]=label;
  for(let i=0;i<queue.length;i++){const k=queue[i],a=k%size,b=Math.floor(k/size);for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=a+dx,ny=b+dy,n=ny*size+nx;if(open(nx,ny)&&!labels[n]){labels[n]=label;queue.push(n);}}}
  if(queue.length>largestCount){largestCount=queue.length;largest=label;}
 }
 return (x,y)=>{const a=x-profile.ox,b=y-profile.oy;return largest>0&&a>=0&&b>=0&&a<size&&b<size&&labels[b*size+a]===largest;};
}
function depositHasMainAccess(n,access){const {w,h}=B[n.type];const side=n.anchor?.side;
 const cells=n.inMountain?(side==='north'?footprintCells(n.x,n.y-1,w,1):side==='south'?footprintCells(n.x,n.y+h,w,1):side==='west'?footprintCells(n.x-1,n.y,1,h):footprintCells(n.x+w,n.y,1,h)):ringCells({...n,w,h});
 return cells.some(([x,y])=>access(x,y));
}
const gameCreateDeposits=createDeposits;createDeposits=function(tiles,seed){
 if(GAME_TERRAIN_VERSION<3)return gameCreateDeposits(tiles,seed);
 const profile=ISLANDS[activeIsland],access=depositAccessMap(tiles,profile),nodes=[],rock=(x,y)=>INMAP(x,y)&&[T.ROCK,T.ORE].includes(tiles[IDX(x,y)]),land=(x,y)=>INMAP(x,y)&&[T.GRASS,T.FOREST].includes(tiles[IDX(x,y)])&&access(x,y);
 for(const [type,max] of [['steinbruch',2*Math.max(1,Math.floor(profile.size*5))],['mine',Math.max(1,2*Math.floor(profile.ore*2))],...(B.kohlemine?[['kohlemine',1+Math.floor(hs(activeIsland,seed,731)*2)],['kupfermine',activeIsland===1||activeIsland!==0&&hs(activeIsland,seed,991)>.45?2:0]]:[]),['goldmine',gameGoldIsland(seed)?2:0]]){
  if(!max)continue;const {w,h}=B[type],candidates=[];
  for(let y=profile.oy+3;y<profile.oy+ISLAND_SIZE-h-3;y++)for(let x=profile.ox+3;x<profile.ox+ISLAND_SIZE-w-3;x++){
   if(!footprintCells(x,y,w,h).every(([a,b])=>rock(a,b)&&islandAt(a,b)===activeIsland))continue;
   // Iron is guaranteed even on islands with a low ore profile.

   const sides=[['north',Array.from({length:w},(_,i)=>[x+i,y-1])],['south',Array.from({length:w},(_,i)=>[x+i,y+h])],['west',Array.from({length:h},(_,i)=>[x-1,y+i])],['east',Array.from({length:h},(_,i)=>[x+w,y+i])]];
   const contact=sides.find(([,cells])=>cells.every(([a,b])=>land(a,b)));if(contact)candidates.push({type,x,y,inMountain:true,anchor:gameDepositAnchor(x,y,w,h,contact[0]),score:hs(x,y,seed+183)});
  }
  candidates.sort((a,b)=>a.score-b.score);let count=0;for(const n of candidates){if(count>=max)break;if(nodes.some(o=>Math.hypot(o.x-n.x,o.y-n.y)<8))continue;delete n.score;nodes.push(n);count++;}
 }

 // Narrow massifs may have no full in-mountain footprint. Reserve a free
 // land-side access beside the existing rock instead of changing any terrain.
 for(const type of B.kohlemine?['mine','kohlemine',...(activeIsland===1?['kupfermine']:[])]:[]){
  if(nodes.some(n=>n.type===type))continue;const {w,h}=B[type];let found=null;
  for(let y=profile.oy+3;y<profile.oy+ISLAND_SIZE-h-3&&!found;y++)for(let x=profile.ox+3;x<profile.ox+ISLAND_SIZE-w-3&&!found;x++){
   if(!footprintCells(x,y,w,h).every(([a,b])=>land(a,b)&&islandAt(a,b)===activeIsland))continue;
   if(nodes.some(n=>x<n.x+B[n.type].w&&x+w>n.x&&y<n.y+B[n.type].h&&y+h>n.y))continue;
   if(G?.tiles===tiles&&footprintCells(x,y,w,h).some(([a,b])=>G.occ[IDX(a,b)]||G.road[IDX(a,b)]))continue;
   const sides=[['north',Array.from({length:w},(_,i)=>[x+i,y-1])],['south',Array.from({length:w},(_,i)=>[x+i,y+h])],['west',Array.from({length:h},(_,i)=>[x-1,y+i])],['east',Array.from({length:h},(_,i)=>[x+w,y+i])]];
   for(const [side,cells] of sides){const contact=cells.find(([a,b])=>rock(a,b));if(contact){found={type,x,y,inMountain:false,anchor:{x:contact[0],y:contact[1],side}};break;}}
  }
  if(found)nodes.push(found);
 }
 return [...nodes,...generateClayDeposits(tiles,seed,activeIsland,nodes)];
};
const gameUnpackIsland=unpackIsland;unpackIsland=function(o,...args){const g=gameUnpackIsland(o,...args);
 // Belegte und gespeicherte Bergplätze behalten bei neuen Konturen ihre Koordinaten.
 if(GAME_TERRAIN_VERSION>=3){
  const mainAccess=depositAccessMap(g.tiles),saved=(o.deposits||[]).filter(n=>['mine','steinbruch','goldmine','kohlemine','kupfermine'].includes(n.type)&&n.inMountain&&(g.blds.some(b=>b.type===n.type&&b.x===n.x&&b.y===n.y)||depositHasMainAccess(n,mainAccess)));
  for(const n of saved){const d=B[n.type],side=n.anchor?.side||'south';n.anchor=gameDepositAnchor(n.x,n.y,d.w,d.h,side);
   for(const [x,y] of footprintCells(n.x,n.y,d.w,d.h))if(INMAP(x,y)){g.tiles[IDX(x,y)]=n.type==='mine'?T.ORE:T.ROCK;mountainMassifs[IDX(x,y)]=1;}
   const access=side==='north'?footprintCells(n.x,n.y-1,d.w,1):side==='south'?footprintCells(n.x,n.y+d.h,d.w,1):side==='west'?footprintCells(n.x-1,n.y,1,d.h):footprintCells(n.x+d.w,n.y,1,d.h);
   for(const [x,y] of access)if(INMAP(x,y)&&[T.ROCK,T.ORE].includes(g.tiles[IDX(x,y)])){g.tiles[IDX(x,y)]=T.GRASS;mountainMassifs[IDX(x,y)]=0;}
  }
  if(saved.length)g.deposits=[...saved,...g.deposits.filter(n=>!['mine','steinbruch','goldmine','kohlemine','kupfermine'].includes(n.type)||!saved.some(s=>Math.hypot(s.x-n.x,s.y-n.y)<8)&&footprintCells(n.x,n.y,B[n.type].w,B[n.type].h).every(([x,y])=>!g.occ[IDX(x,y)]&&!g.road[IDX(x,y)]))];
  for(const k of o.roads||[])if([T.ROCK,T.ORE].includes(g.tiles[k]))g.tiles[k]=T.GRASS;
 }
 g.fireEngines=(o.fireEngines||[]).filter(e=>Array.isArray(e.path)&&Number.isFinite(e.t));for(const good of GAME_GOODS)g.stock[good[0]]??=0;return g;};
function gameSaveValid(data){return data&&[2,3,4,5,6,7,8,9].includes(data.v)&&(data.v===2?Array.isArray(data.blds):Array.isArray(data.islands)&&data.islands.some(Boolean));}
function gameReceiveSaveHash(){const prefix=['#save=','#game-save=','#pixxo-save='].find(value=>location.hash.startsWith(value));if(!prefix)return;try{const json=new TextDecoder().decode(Uint8Array.from(atob(decodeURIComponent(location.hash.slice(prefix.length))),c=>c.charCodeAt(0))),data=JSON.parse(json);if(gameSaveValid(data))localStorage.setItem(SAVEKEY,json);}catch(error){console.warn('Spielstandsübernahme fehlgeschlagen.',error);}finally{history.replaceState(null,'',location.pathname+location.search);}}
const gameLoadGame=loadGame;loadGame=function(...args){gameReceiveSaveHash();const previousKey=atob('ZXdpZ2VzX2tvZW5pZ3JlaWNoX2Fubm9fdjE=');if(!localStorage.getItem(SAVEKEY)&&localStorage.getItem(previousKey))localStorage.setItem(SAVEKEY,localStorage.getItem(previousKey));let saved;try{saved=JSON.parse(localStorage.getItem(SAVEKEY));}catch{}GAME_TERRAIN_VERSION=saved?.terrainVersion||1;return gameLoadGame(...args);};
const gameStartNew=startNew;startNew=function(...args){GAME_TERRAIN_VERSION=3;const result=gameStartNew(...args);if(!G.deposits.some(n=>n.type==='steinbruch'))throw new Error('Startinsel ohne Steinabbauplatz');gameQuestBadge();return result;};

/* Bestehende Palette und native 16 Pixel je Kachel. */
function gameNativeArt(type,tier=1,frame=0){if(type==='dochtdreherei'){const d=B[type],w=48,h=44,low=document.createElement('canvas'),c=low.getContext('2d');low.width=w;low.height=h;low._nightWindows=[{x:9,y:25,w:5,h:6,cross:true},{x:34,y:25,w:5,h:6,cross:true}];const r=(x,y,a,b,color)=>{c.fillStyle=color;c.fillRect(x,y,a,b);};r(2,39,44,4,'#615840');r(4,18,40,23,'#48382d');r(5,19,38,21,'#c1a77b');r(8,22,32,2,'#ead2a1');for(let i=0;i<5;i++)r(4+i*2,16-i*3,40-i*4,3,'#453c3c');r(6,15,36,3,'#776457');r(17,29,13,12,'#483629');r(19,31,9,10,'#94704c');r(9,25,5,6,'#456778');r(34,25,5,6,'#456778');for(const x of [11,36]){r(x,25,1,6,'#d9c49a');r(x-2,28,5,1,'#d9c49a');}r(22,24,4,5,'#4b382b');r(23,24,2,3,'#e9d7a6');r(15,41,18,2,'#876644');return {low,w,h,meta:{tw:d.w,th:d.h,ex:12,hub:null,smoke:null}};}const alias=IMPORTED_BUILD_NAMES[type],id=Array.isArray(alias)?alias[tier-1]:alias||type,entry=IMPORTED_ENTRIES.get(id);if(!entry)return null;const d=B[type],extra=d.kind==='decor'?12:Math.max(12,Math.round(d.h*5));return {low:importedPixels(entry,frame,buildingRequiresBricks(type,tier)),w:d.w*16,h:d.h*16+extra,meta:{tw:d.w,th:d.h,ex:extra,hub:null,smoke:null}};}
const gameImportedBuilding=importedBuilding;importedBuilding=function(type,tier=1,frame=0){return type.startsWith('deko_')||GAME_CHAINS.some(c=>c[0]===type)?gameNativeArt(type,tier,frame):gameImportedBuilding(type,tier,frame);};
installNativeBuildings();
publishPixel('game_deko',importedPixels(IMPORTED_ENTRIES.get('game_deko')),16,16);dekoToggle.innerHTML=ic('game_deko',1.5);
for(const [id] of GAME_GOODS){const entry=IMPORTED_ENTRIES.get('icon_'+id);if(entry)publishPixel(id,importedPixels(entry),16,16);}
const engineEntry=IMPORTED_ENTRIES.get('game_loeschwagen');publishPixel('game_loeschwagen',importedPixels(engineEntry),16,16);
const diagonalEngine=document.createElement('canvas');diagonalEngine.width=diagonalEngine.height=16;{const c=diagonalEngine.getContext('2d');c.imageSmoothingEnabled=false;c.translate(8,8);c.rotate(-Math.PI/4);nativeDrawImage.call(c,SP.game_loeschwagen,-8,-8);}
for(const direction of ['e','se','s','sw','w','nw','n','ne']){const source=SP.game_loeschwagen,canvas=document.createElement('canvas');canvas.width=canvas.height=16;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;if(direction==='e')nativeDrawImage.call(c,source,0,0);else if(direction==='w'){c.translate(16,0);c.scale(-1,1);nativeDrawImage.call(c,source,0,0);}else if(direction.length===2){if(direction.includes('w')){c.translate(16,0);c.scale(-1,1);}if(direction.includes('s')){c.translate(0,16);c.scale(1,-1);}nativeDrawImage.call(c,diagonalEngine,0,0);}else{const front=direction==='s',r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};r(2,5,2,8,'#2e2924');r(12,5,2,8,'#2e2924');r(3,2,10,12,'#422f27');r(4,3,8,10,'#a96f51');r(4,front?3:11,8,2,'#d9b986');r(5,front?5:3,6,3,'#d9c698');r(6,front?6:4,4,1,'#776b50');r(5,front?9:7,6,2,'#704b38');r(6,front?10:8,4,1,'#c7ad7d');r(4,front?12:2,8,1,'#d4b47d');}publishPixel('game_loeschwagen_'+direction,canvas,16,16);}
function gameMiningSprite(b){
 const island=WORLD?.islands[b.island]||G,node=island.deposits.find(n=>n.type===b.type&&n.x===b.x&&n.y===b.y);if(!node?.inMountain)return null;
 const frame=workshopRunning(b)&&!WORK_ART.reduced.matches?Math.floor(G.time*4+b.id)%4:0,side=node.anchor?.side||'south',key='b_'+b.type+'_berg_'+side+'_'+b.w+'x'+b.h+'_'+frame;
 if(!HD_CATALOG.has(key)){const extra=12;publishPixel(key,miningEntranceArt(b,side,frame),b.w*16,b.h*16+extra,{tw:b.w,th:b.h,ex:extra,hub:null,smoke:null});}return key;
}
function miningEntranceArt(b,side,frame){
 const source=importedPixels(IMPORTED_ENTRIES.get((b.type==='goldmine'?'mine':b.type)+'_berg_'+side),0),low=document.createElement('canvas');low.width=b.w*16;low.height=b.h*16+12;
 const c=low.getContext('2d');c.imageSmoothingEnabled=false;nativeDrawImage.call(c,source,0,0,low.width,low.height);
 const image=c.getImageData(0,0,low.width,low.height);for(let i=0;i<image.data.length;i+=4){const r=image.data[i],g=image.data[i+1],v=image.data[i+2];if(image.data[i+3]&&(r>g*1.12&&g>v*1.1||r+g+v<150)){const tone=hs(i%low.width,Math.floor(i/low.width),57)>.5?116:104;image.data.set([tone,tone+5,tone+12,255],i);}}c.putImageData(image,0,0);
 const portal=document.createElement('canvas');portal.width=18;portal.height=26;const g=portal.getContext('2d'),r=(color,x,y,w,h)=>{g.fillStyle=color;g.fillRect(x,y,w,h);};
 r('#49494c',1,3,16,20);r('#333236',3,5,12,17);r('#181e21',5,7,8,14);r('#242a2c',6,8,6,12);
 for(const x of [2,14]){r('#4e3728',x,3,2,19);r('#99733f',x,4,1,17);for(const y of [5,10,16])r('#d5b378',x,y,1,1);}
 r('#4c382a',2,2,14,3);r('#ba9358',3,2,12,1);r('#836039',3,4,12,1);r('#b1a27b',1,22,16,2);
 const resourceTone=b.type==='goldmine'?'#e0ac35':b.type==='mine'?'#ac6841':'#a7adae';r('#2d2925',5,0,8,3);r(resourceTone,7,0,4,2);r(resourceTone,6,1,6,1);
 for(const x of [6,11]){r('#3b4245',x,17,2,9);r('#a4a9a1',x,17,1,9);}for(const y of [19,22,25])r('#745d40',5,y,8,1);
 r('#483a2d',15,9,3,5);r('#efba62',16,10,1,2);r('#ffe2a0',16,10,1,1);
 if(frame>0){const y=18+[0,1,2,1][frame%4];r('#3b3830',5,y+4,8,2);r('#57402e',4,y,10,4);r('#a28250',5,y,8,1);r(b.type==='goldmine'?'#e0ac35':b.type==='mine'?'#a26c4c':'#9aa1a2',6,y-2,5,2);r('#d1c4a1',7,y-2,2,1);}
 const turn={south:0,west:1,north:2,east:3}[side]||0,rotated=document.createElement('canvas');rotated.width=turn%2?26:18;rotated.height=turn%2?18:26;const out=rotated.getContext('2d');out.imageSmoothingEnabled=false;out.translate(rotated.width/2,rotated.height/2);out.rotate(turn*Math.PI/2);out.drawImage(portal,-9,-13);
 const x=side==='west'?0:side==='east'?low.width-rotated.width:Math.floor((low.width-rotated.width)/2),y=side==='north'?12:side==='south'?low.height-rotated.height:12+Math.floor((b.h*16-rotated.height)/2);c.drawImage(rotated,x,y);return low;
}
// World mine placeholders are foreshortened except for the south-facing front.
for(let frame=0;frame<5;frame++)for(const [side,turn] of [['left',1],['right',3],['back',2]]){
 const source=HD_CATALOG.get('stollen_front'+frame)?.pixelSource||SP['stollen_front'+frame],rotated=document.createElement('canvas');rotated.width=rotated.height=16;const c=rotated.getContext('2d');c.imageSmoothingEnabled=false;c.translate(8,8);c.rotate(turn*Math.PI/2);nativeDrawImage.call(c,source,-8,-8,16,16);
 const low=document.createElement('canvas');low.width=low.height=16;const out=low.getContext('2d');out.imageSmoothingEnabled=false;
 const ww=turn%2?12:16,hh=turn%2?16:12;nativeDrawImage.call(out,rotated,Math.floor((16-ww)/2),Math.floor((16-hh)/2),ww,hh);publishPixel('stollen_'+side+frame,low,16,16);
}
function gameCattleSprite(b){if(b.type!=='gehege')return null;const g=WORLD.islands[b.island]||G,owner=g.byId.get(b.fieldOwner);return livestockEnclosureSprite(b,enclosureAnimal(owner));}
const gameWorkshopSprite=workshopSprite;workshopSprite=function(b){if(gameCattleSprite(b))return gameCattleSprite(b);return ['mine','steinbruch','goldmine'].includes(b.type)?gameMiningSprite(b)||gameWorkshopSprite(b):gameWorkshopSprite(b);};
const gameSpName=spName;spName=function(b){if(b.type==='werft')return shipyardSprite(b);if(gameCattleSprite(b))return gameCattleSprite(b);return ['mine','steinbruch','goldmine'].includes(b.type)?gameMiningSprite(b)||gameSpName(b):gameSpName(b);};
const gameBubbleFor=bubbleFor;bubbleFor=function(b){return B[b.type].kind==='decor'?null:gameBubbleFor(b);};
const GAME_PIER_IMAGES={};
for(const direction of ['north','east','south','west'])for(const role of ['start','middle','end']){
 const image=new Image();image.src='assets/sprites/structures/piers/16x16/pier_'+direction+'_'+role+'.png';
 image.addEventListener('load',()=>{if(G)G.dirty=true;});GAME_PIER_IMAGES[direction+'_'+role]=image;
}
function gamePierCells(b,side){
 const step={north:[0,-1],east:[1,0],south:[0,1],west:[-1,0]}[side];
 const across=side==='north'||side==='south'?b.w:b.h,choices=[];
 for(let offset=0;offset<across;offset++){
  const x=side==='west'?b.x-1:side==='east'?b.x+b.w:b.x+offset;
  const y=side==='north'?b.y-1:side==='south'?b.y+b.h:b.y+offset;
  const cells=[];
  for(let length=0;length<3;length++){
   const px=x+step[0]*length,py=y+step[1]*length;
   if(!INMAP(px,py)||G.tiles[IDX(px,py)]>T.SHAL)break;
   cells.push([px,py]);
  }
  if(cells.length)choices.push({cells,offset});
 }
 choices.sort((a,b)=>Math.abs(a.offset-(across-1)/2)-Math.abs(b.offset-(across-1)/2)||b.cells.length-a.cells.length);
 return choices[0]?.cells||[];
}
const gameDrawBld=drawBld;drawBld=function(ctx,b){
 gameDrawBld(ctx,b);};
function drawCoastPier(ctx,b){if(B[b.type].place!=='coast')return;
 const plan=coastPierPlanFor(b);if(!plan)return;
 const {side,cells}=plan;
 for(let i=0;i<cells.length;i++){
  const role=i===cells.length-1?'end':i===0?'start':'middle';
  const key=side+'_'+role,review=window.ApprovedSpriteArt||window.SpriteReview;
  const approved=review&&review.mode!=='original'?review.loaded.get('pier_'+key)?.frames[0]:null;
  const fallback=GAME_PIER_IMAGES[key],image=approved||(fallback.complete&&fallback.naturalWidth?fallback:null);if(!image)continue;
  ctx.drawImage(image,cells[i][0]*16,cells[i][1]*16,16,16);
 }
};
// Start- und Reload-Ladebildschirm erst nach dem ersten gezeichneten Frame ausblenden.
document.querySelector('#game-loading progress').setAttribute('aria-label','Ladefortschritt');
const GAME_LOADING_TEMPLATE=document.getElementById('game-loading').cloneNode(true);
function gameLoadingShow(text){let screen=document.getElementById('game-loading');if(!screen){screen=GAME_LOADING_TEMPLATE.cloneNode(true);document.body.append(screen);}clearTimeout(screen.dismissTimer);screen.loadToken=(screen.loadToken||0)+1;screen.classList.remove('loaded');screen.querySelector('progress').value=5;screen.querySelector('p').textContent=text;screen.tabIndex=-1;return screen;}
function gameLoaded(onDone){if(typeof StartScreen!=='undefined'&&StartScreen.loading)return;const screen=document.getElementById('game-loading');if(!screen){onDone?.();return;}const token=screen.loadToken=(screen.loadToken||0)+1,progress=screen.querySelector('progress');progress.value=100;requestAnimationFrame(()=>requestAnimationFrame(()=>{if(token!==screen.loadToken)return;screen.classList.add('loaded');screen.dismissTimer=setTimeout(()=>{if(token!==screen.loadToken)return;screen.remove();onDone?.();},450);}));}
const gameAfterNewWorld=afterNewWorld;afterNewWorld=function(...args){clearClayDepositTrees(G.tiles,allDeposits());const result=gameAfterNewWorld(...args);gameLoaded();return result;};

// Spielstände zwischen lokaler Datei und gehosteter Partie übertragen.
function gameExportSave(){saveGame();const json=localStorage.getItem(SAVEKEY);if(!json)return;const a=document.createElement('a'),link=URL.createObjectURL(new Blob([json],{type:'application/json'}));a.href=link;a.download=GAME_BRAND.exportFilename;a.click();setTimeout(()=>URL.revokeObjectURL(link),1000);}
function gameImportSave(json){const data=JSON.parse(json);if(!gameSaveValid(data))throw new Error('Wähle eine gültige Spielstandsdatei.');const previous=localStorage.getItem(SAVEKEY);try{localStorage.setItem(SAVEKEY,json);if(!loadGame())throw new Error('Spielstand konnte nicht geladen werden.');afterNewWorld();const port=G.blds.find(b=>b.type==='kontor');if(port)centerOn(cx(port),cy(port));renderTop(true);if(previous)localStorage.setItem('pixxo_import_backup',previous);saveGame();return true;}catch(error){if(previous){localStorage.setItem(SAVEKEY,previous);loadGame();afterNewWorld();}else localStorage.removeItem(SAVEKEY);throw error;}}
const gameSaveMenu=menuHTML;menuHTML=function(){return gameSaveMenu()+`<div class="sect">Spielstand übertragen</div><div class="btns"><button class="btn" data-act="save-export">Exportieren</button><button class="btn" data-act="save-import">Importieren</button>${localStorage.getItem('pixxo_import_backup')?'<button class="btn" data-act="save-restore">Vorherige Partie wiederherstellen</button>':''}</div>`;};
const gameSaveAct=winAct;winAct=function(id,ds){if(ds.act==='save-export'){gameExportSave();return;}if(ds.act==='save-import'){const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.addEventListener('change',async()=>{if(!input.files[0])return;try{gameImportSave(await input.files[0].text());}catch(error){msg(error.message,'i_alert');}});input.click();return;}if(ds.act==='save-restore'){const backup=localStorage.getItem('pixxo_import_backup');if(backup)gameImportSave(backup);return;}gameSaveAct(id,ds);};
