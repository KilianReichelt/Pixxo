/* Persistent city progress gates needs, demand and construction visibility together. */
const CITY_LEVELS=window.GameCityLevels;
const CITY_BUILD_STAGE={},CITY_GOOD_STAGE={fisch:1,holz:1,bretter:1,stein:1,lehm:1,ziegel:1},CITY_SERVICE_STAGE={markt:1,kapelle:2,kirche:5,gemeinschaft:6};
for(const level of CITY_LEVELS){for(const type of level.buildings)if(!type.startsWith('deko_'))CITY_BUILD_STAGE[type]=level.id;for(const good of level.goods)CITY_GOOD_STAGE[good]??=level.id;}
const CITY_TIER_SOURCES=TIERS.map(t=>t?{goods:{...t.goods},svc:[...t.svc],luxury:{...t.luxury},cap:t.cap}:null);
const CITY_EXTRA_SOURCES=TIERS.map(t=>t?{}:null);



const cityOriginalRelevant=buildingRelevant,cityOriginalUnlocked=unlocked;
let cityContext=null,citySilentLoad=false;
function cityEmptyState(){return {version:1,level:0,seen:[],pending:[],peaks:[0,0,0,0,0],totalPeak:0,legacyBuildings:[],legacyGoods:[],legacyServices:[]};}
function cityState(g=cityContext||G){if(!WORLD)return cityEmptyState();if(g?.cpu){WORLD.cpuCityProgress??={};return WORLD.cpuCityProgress[g.cpu.name]??=(cityEmptyState());}return WORLD.cityProgress??=cityEmptyState();}
function cityOwnerStates(g=G){return (WORLD?.islands||[]).filter(s=>s&&(g?.cpu?s.cpu?.name===g.cpu.name:!s.cpu));}
function cityLevelSatisfied(id,stats){const {pop,tiers,islands,started}=stats;return id===1?started:id===2?tiers[1]>=20:id===3?tiers[1]>=40:id===4?tiers[2]>=1:id===5?tiers[2]>=120:id===6?tiers[3]>=1:id===7?tiers[4]>=1:id===8?pop>=1000&&tiers[4]>=250:id===9?pop>=2000&&islands>=5:pop>=3000&&tiers[4]>=500;}
function updateCityProgress(notify=false,g=G){
 if(!WORLD)return;const state=cityState(g),states=cityOwnerStates(g),tiers=[0,0,0,0,0];let pop=0,started=false;
 for(const s of states)for(const b of s.blds){if(b.type!=='kontor'&&B[b.type]?.kind!=='field')started=true;if(b.type==='haus'){const count=Math.max(0,Math.floor(b.pop||0));tiers[b.tier]+=count;pop+=count;}}
 state.peaks=state.peaks.map((n,t)=>Math.max(n,tiers[t]||0));state.totalPeak=Math.max(state.totalPeak,pop);
 const stats={pop,tiers,islands:states.length,started};let next=state.level;for(const level of CITY_LEVELS)if(cityLevelSatisfied(level.id,stats))next=Math.max(next,level.id);
 if(next===state.level){cityAnnounceProgress(state,notify,g);return false;}const previous=state.level;state.level=next;for(let id=1;id<=next;id++)if(!state.seen.includes(id))state.seen.push(id);
 if(!g?.cpu&&!citySilentLoad&&StartScreen.started){state.pending??=[];for(let id=previous+1;id<=next;id++)if(!state.pending.includes(id))state.pending.push(id);}
 cityAnnounceProgress(state,notify,g);
 return true;
}
function cityAnnounceProgress(state,notify,g){if(!notify||g?.cpu||citySilentLoad||!StartScreen.started||!state.pending?.length)return;const pending=state.pending.splice(0).sort((a,b)=>a-b);for(const id of pending){const level=CITY_LEVELS[id-1],names=level.goods.filter(k=>cityGoodIsNeed(k)).map(k=>GN[k]?.n||k);if(window.GameMilestoneArt)window.GameMilestoneArt.enqueueCity(id);else msg('Neue Stadtstufe: '+level.name+(names.length?' · Neue Versorgung: '+names.join(', '):''),'i_houses');}renderBar();refreshWins();}
function cityGoodIsNeed(good){return CITY_TIER_SOURCES.some(t=>t&&(t.goods[good]||t.luxury[good]))||CITY_EXTRA_SOURCES.some(t=>t?.[good]);}
function needsGateUnlocked(gate,g=cityContext||G){const state=cityState(g);return state.level>=gate[0]&&(state.peaks[gate[1]]||0)>=gate[2];}
function needsGatesUnlocked(gates,g){return gates.some(gate=>needsGateUnlocked(gate,g));}
function cityGoodUnlocked(good,g=cityContext||G){return NEED_GOOD_GATES[good]?needsGatesUnlocked(NEED_GOOD_GATES[good],g):(CITY_GOOD_STAGE[good]||1)<=Math.max(1,cityState(g).level);}
function cityServiceUnlocked(service,g=cityContext||G){return NEED_UNLOCK[service]?needsGateUnlocked(NEED_UNLOCK[service],g):(CITY_SERVICE_STAGE[service]||1)<=Math.max(1,cityState(g).level);}
function cityBuildingUnlocked(type,g=cityContext||G){if(B[type]?.retired)return false;if(NEED_BUILD_GATES[type])return needsGatesUnlocked(NEED_BUILD_GATES[type],g);const s=cityState(g),stage=CITY_BUILD_STAGE[type]||1;return s.legacyBuildings.includes(type)||stage<=Math.max(1,s.level);}
function withCityContext(b,fn){const old=cityContext;cityContext=WORLD?.islands[b?.island]||G;try{return fn();}finally{cityContext=old;}}
function cityFilterGoods(goods){return Object.fromEntries(Object.entries(goods).filter(([good])=>cityGoodUnlocked(good)));}
function cityHouseMaximum(tier){const t=CITY_TIER_SOURCES[tier];if(!t)return 0;const services=t.svc.filter(s=>cityServiceUnlocked(s)),goods=Object.keys({...cityFilterGoods(t.goods),...cityFilterGoods(CITY_EXTRA_SOURCES[tier])});return [...services,...goods].reduce((n,key)=>n+gameResidentsForNeed({tier},key),0);}
for(const t of TIERS.filter(Boolean)){
 Object.defineProperties(t,{goods:{configurable:true,get(){return cityFilterGoods(CITY_TIER_SOURCES[t.id].goods);}},svc:{configurable:true,get(){return CITY_TIER_SOURCES[t.id].svc.filter(s=>cityServiceUnlocked(s));}},luxury:{configurable:true,get(){return cityFilterGoods(CITY_TIER_SOURCES[t.id].luxury);}},cap:{configurable:true,get(){return cityHouseMaximum(t.id);}}});
}
additionalHouseGoods=function(b){return withCityContext(b,()=>cityFilterGoods(CITY_EXTRA_SOURCES[b.tier]||{}));};
const cityHouseRates=houseRates;houseRates=function(b){return withCityContext(b,()=>cityHouseRates(b));};
const cityHouseNeeds=gameHouseNeeds;gameHouseNeeds=function(b){return withCityContext(b,()=>cityHouseNeeds(b));};
const cityHouseCapacity=gameHouseCapacity;gameHouseCapacity=function(b){return withCityContext(b,()=>cityHouseCapacity(b));};
const cityHouseSupply=houseGoodSupplied;houseGoodSupplied=function(b,good){return withCityContext(b,()=>cityGoodUnlocked(good)&&cityHouseSupply(b,good));};
buildingRelevant=function(type){return cityBuildingUnlocked(type)&&cityOriginalRelevant(type);};
unlocked=function(type){if(!cityBuildingUnlocked(type))return false;if(CIVIC_PROJECTS[type]&&!CIVIC_PROJECTS_ENABLED)return false;if(CITY_BUILD_STAGE[type])return (BUILD_TIER[type]||1)<=(WORLD?.highestTier||1)||cityState().legacyBuildings.includes(type);return cityOriginalUnlocked(type);};
const cityUnlockText=buildingUnlockText;buildingUnlockText=function(type){const gates=NEED_BUILD_GATES[type];if(gates&&!cityBuildingUnlocked(type))return gates.map(needsGateText).join(' oder ');const stage=CITY_BUILD_STAGE[type]||1;return !cityBuildingUnlocked(type)?'Ab '+CITY_LEVELS[stage-1].name+' · '+CITY_LEVELS[stage-1].threshold:cityUnlockText(type);};
/* House upgrades depend on the current home's essential needs and full potential. */
nextTierReq=function(b){if(b?.type!=='haus'||b.tier+1>=TIERS.length)return null;return withCityContext(b,()=>{const nt=b.tier+1,needs=gameHouseNeeds(b),habitable=b.conn&&b.fire<=0,list=[];for(const service of NEEDS_BY_TIER[b.tier].baseServices)list.push({label:SVCN[service],ok:!!(habitable&&cityServiceUnlocked(service)&&b.cov[service]),icon:service==='markt'?'i_lager':'i_kreuz'});for(const good of NEEDS_BY_TIER[b.tier].baseGoods)list.push({label:GN[good].n,ok:!!(habitable&&cityGoodUnlocked(good)&&houseGoodSupplied(b,good)),icon:good});const needsOK=list.every(n=>n.ok),maximum=cityHouseTotalMaximum(b.tier);list.push({label:'Maximale Belegung · '+Math.floor(b.pop)+' / '+maximum,ok:b.pop>=maximum,icon:'i_pop'});return {nt,list,cost:UPG[nt],needsOK,maximum,ok:list.every(n=>n.ok)};});};
const cityUpgradeHouse=upgradeHouse;upgradeHouse=function(...args){const r=cityUpgradeHouse(...args);if(r===true)updateCityProgress(true);return r;};
const cityPlace=place;place=function(...args){const r=cityPlace(...args);if(r.ok&&!G.cpu)updateCityProgress(StartScreen.started);return r;};
const cityReset=resetWorld;resetWorld=function(...args){const r=cityReset(...args);WORLD.cityProgress=cityEmptyState();WORLD.cpuCityProgress={};return r;};
const cityAfterNew=afterNewWorld;afterNewWorld=function(...args){updateCityProgress(false);return cityAfterNew(...args);};
const cityWorldStep=stepWorld;stepWorld=function(dt){updateCityProgress(true);const r=cityWorldStep(dt);updateCityProgress(true);for(const g of WORLD.islands.filter(s=>s?.cpu))updateCityProgress(false,g);return r;};
const citySave=saveGame;saveGame=function(...args){updateCityProgress(false);const ok=citySave(...args);if(ok){const data=JSON.parse(localStorage.getItem(SAVEKEY));data.cityProgress=WORLD.cityProgress;data.cpuCityProgress=WORLD.cpuCityProgress;localStorage.setItem(SAVEKEY,JSON.stringify(data));}return ok;};
function cityMigrateLegacy(){const state=cityEmptyState();WORLD.cityProgress=state;state.legacyBuildings=Object.keys(B).filter(type=>cityOriginalRelevant(type)&&cityOriginalUnlocked(type));for(const g of cityOwnerStates())for(const b of g.blds)if(!state.legacyBuildings.includes(b.type))state.legacyBuildings.push(b.type);const highest=WORLD.highestTier||1;for(let tier=1;tier<=highest;tier++){const t=CITY_TIER_SOURCES[tier];state.legacyGoods.push(...Object.keys({...t.goods,...t.luxury,...CITY_EXTRA_SOURCES[tier]}));state.legacyServices.push(...t.svc);}state.legacyGoods=[...new Set(state.legacyGoods)];state.legacyServices=[...new Set(state.legacyServices)];updateCityProgress(false);}
const cityLoad=loadGame;loadGame=function(...args){let saved;try{saved=JSON.parse(localStorage.getItem(SAVEKEY));}catch{}citySilentLoad=true;let ok;try{ok=cityLoad(...args);if(ok){WORLD.cityProgress=saved?.cityProgress||null;WORLD.cpuCityProgress=saved?.cpuCityProgress||{};if(!WORLD.cityProgress)cityMigrateLegacy();else updateCityProgress(false);renderBar();}return ok;}finally{citySilentLoad=false;}};
const cityProducts=constructionProducts;constructionProducts=function(){return cityProducts().filter(p=>cityGoodUnlocked(p.good));};
const cityGraph=productionGraph;productionGraph=function(type){return cityBuildingUnlocked(type)?cityGraph(type):null;};
const cityOpenProduct=openProductChain;openProductChain=function(good,...args){if(!cityGoodUnlocked(good)){msg('Diese Produktionskette ist noch nicht freigeschaltet.','i_alert');return;}return cityOpenProduct(good,...args);};
const cityRenderBar=renderBar;renderBar=function(...args){const r=cityRenderBar(...args);const toolbar=$('#bar .dock-toolbar');if(toolbar){let label=toolbar.querySelector('.dock-city-level');if(!label){label=document.createElement('span');label.className='dock-city-level';toolbar.querySelector('.dock-tools').after(label);}const state=cityState(),level=CITY_LEVELS[state.level-1];label.textContent=level?.name||'Gründung';label.title=state.level<10?'Nächste Stadtstufe: '+CITY_LEVELS[state.level].name+' · '+CITY_LEVELS[state.level].threshold:'Alle Stadtstufen erreicht';}return r;};

/* Display the house's complete potential without changing its current growth rules. */
function cityHouseTotalMaximum(tier){const t=CITY_TIER_SOURCES[tier];if(!t)return 0;return [...t.svc,...Object.keys({...t.goods,...CITY_EXTRA_SOURCES[tier]})].reduce((n,key)=>n+gameResidentsForNeed({tier},key),0);}
function needsGateText(gate){return 'Ab '+CITY_LEVELS[gate[0]-1].name+(gate[2]>0?' · '+gate[2]+' '+TIERS[gate[1]].n:'');}
function cityHouseUpcomingNeeds(b){return withCityContext(b,()=>{
 const t=NEEDS_BY_TIER[b.tier],pending=[];
 for(const key of [...t.baseServices,...t.luxuryServices,...t.baseGoods,...t.luxuryGoods]){const service=!!NEED_SERVICE_BUILDINGS[key],gate=NEED_UNLOCK[key];if(gate&&!(service?cityServiceUnlocked(key):cityGoodUnlocked(key)))pending.push({key,gate,stage:gate[0],name:service?SVCN[key]:GN[key].n,service});}
 pending.sort((a,b)=>a.gate[0]-b.gate[0]||a.gate[1]-b.gate[1]||a.gate[2]-b.gate[2]);const next=pending[0]?.gate;return next?pending.filter(n=>n.gate.join(':')===next.join(':')):[];
 });}
function cityHouseUpcomingHTML(b){const needs=cityHouseUpcomingNeeds(b);if(!needs.length)return '';return '<section class="needgroup upcoming-needs"><h3>Als Nächstes</h3><div class="upcoming-need-icons">'+needs.map(n=>{const label=n.name+' · '+needsGateText(n.gate),icon=n.service?typeSprite(NEED_SERVICE_BUILDINGS[n.key]):n.key;return '<button type="button" class="locked-need" data-game-tooltip="'+attr(label)+'" aria-disabled="true" aria-label="'+attr(label)+'" data-locked-need="'+n.key+'" data-unlock-stage="'+n.stage+'"><span class="need-silhouette" aria-hidden="true">'+ic(icon,1)+'</span><span class="need-lock" aria-hidden="true"></span></button>';}).join('')+'</div></section>';}
const cityHouseInfoHTML=infoHTML;infoHTML=function(...args){const html=cityHouseInfoHTML(...args),b=G.byId.get(UI.sel);if(b?.type!=='haus'||!html)return html;return html.replace('<div class="house-actions-anchor">',cityHouseUpcomingHTML(b)+'<div class="house-actions-anchor">');};
