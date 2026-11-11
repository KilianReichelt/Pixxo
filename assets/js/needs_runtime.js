/* One household definition drives population, demand, income and upgrades. */
gameResidentsForNeed=function(b,key){return NEEDS_BY_TIER[b.tier]?.residentWeights[key]||0;};
cityHouseTotalMaximum=function(tier){return NEEDS_BY_TIER[tier]?.capacity||0;};
additionalHouseGoods=function(){return {};};
function needsLuxuryServices(b){return withCityContext(b,()=>NEEDS_BY_TIER[b.tier].luxuryServices.filter(s=>cityServiceUnlocked(s)));}
function needsHouseMood(b){if(!b.conn||b.fire>0)return 0;const needs=gameHouseNeeds(b),keys=[...needs.goods,...needs.services],fulfilled=keys.filter(k=>needs.services.includes(k)?b.cov?.[k]:houseGoodSupplied(b,k)).length,base=keys.length?fulfilled/keys.length:0,luxury=[...Object.keys(TIERS[b.tier].luxury),...needsLuxuryServices(b)],bonus=luxury.filter(k=>NEED_SERVICE_BUILDINGS[k]?b.cov?.[k]:houseGoodSupplied(b,k)).length;return base*(.8+(luxury.length?.2*bonus/luxury.length:0));}
const needsBaseRates=houseRates;houseRates=function(b){return withCityContext(b,()=>needsBaseRates(b));};
luxuryBonus=function(b,key){return Math.max(0,b.pop)*(NEED_LUXURY_BONUS[key]||0);};
breadIncome=function(){return 0;};
extraHouseIncome=function(b){if(b.type!=='haus'||!b.conn||!b.cov?.markt||b.fire>0)return 0;return withCityContext(b,()=>Object.keys(TIERS[b.tier].luxury).filter(g=>houseGoodSupplied(b,g)).reduce((n,g)=>n+luxuryBonus(b,g),0)+needsLuxuryServices(b).filter(s=>b.cov?.[s]).reduce((n,s)=>n+luxuryBonus(b,s),0));};
houseIncome=function(b){if(b.type!=='haus'||!b.conn||b.fire>0)return 0;const mood=Math.max(needsHouseMood(b),b.needsTransition?.remaining>0?b.needsTransition.mood||0:0);return (Math.max(0,b.pop)*TIERS[b.tier].tax*mood*mood+extraHouseIncome(b))*civicEffects(WORLD?.islands[b.island]||G).tax;};
gameNeedIncome=function(b,key){if(NEEDS_BY_TIER[b.tier].luxuryGoods.includes(key)||NEEDS_BY_TIER[b.tier].luxuryServices.includes(key))return luxuryBonus({...b,pop:cityHouseTotalMaximum(b.tier)},key);return gameResidentsForNeed(b,key)*TIERS[b.tier].tax;};
gameHouseNeedLabel=function(b,key,name){const luxury=NEEDS_BY_TIER[b.tier].luxuryGoods.includes(key)||NEEDS_BY_TIER[b.tier].luxuryServices.includes(key);return '<span class="need-name">'+esc(name)+'</span><span class="need-residents" data-game-tooltip="Einkommensbeitrag bei voller Versorgung">'+(luxury?'':'+'+gameResidentsForNeed(b,key)+' '+ic(TIERS[b.tier].icon,1)+' | ')+'+'+gameNeedIncome(b,key).toLocaleString('de-DE',{maximumFractionDigits:1})+' '+ic('gold',1)+'/min</span>';};
const needsPopulationStep=gameHousePopulationStep;gameHousePopulationStep=function(b,target,dt,...args){if(b.needsTransition?.remaining>0&&b.conn&&b.fire<=0)target=Math.max(target,b.needsTransition.floor);return needsPopulationStep(b,target,dt,...args);};
const needsUpgrade=upgradeHouse;upgradeHouse=function(b){const sat={...b.sat},r=needsUpgrade(b);if(r===true){b.sat=Object.fromEntries(Object.entries(sat).filter(([key])=>Object.hasOwn(houseRates(b),key)));delete b.needsTransition;b.supplyTime=0;}return r;};
const needsDowngrade=downgradeHouse;downgradeHouse=function(b){const result=needsDowngrade(b);if(result){delete b.needsTransition;b.need={};b.sat={};}return result;};
// No hidden legacy consumption, bonuses, or saves that silently restart the grace period.
function needsNormalizeIsland(g,legacy=false){
 for(const good of GOODS)g.stock[good.id]??=0;
 for(const b of g.blds)if(b.type==='haus'){
  const p=NEEDS_BY_TIER[b.tier],allowed=new Set([...p.baseGoods,...p.luxuryGoods]);
  b.need=Object.fromEntries(Object.entries(b.need||{}).filter(([k])=>allowed.has(k)));b.sat=Object.fromEntries(Object.entries(b.sat||{}).filter(([k])=>allowed.has(k)));
  b.pop=Math.min(p.capacity,Math.max(0,Math.round(b.pop||0)));
  if(legacy&&!b.needsTransition)b.needsTransition={remaining:600,floor:b.pop,mood:Math.max(.8,b.mood||0)};
 }
 g.needsVersion=NEEDS_VERSION;return g;
}
const needsNewGame=newGame;newGame=function(...args){const g=needsNewGame(...args);g.needsVersion=NEEDS_VERSION;return needsNormalizeIsland(g);};
const needsUnpack=unpackIsland;unpackIsland=function(data,...args){const g=needsUnpack(data,...args),saved=new Map((data.blds||[]).map(b=>[b.id,b]));for(const b of g.blds)if(saved.get(b.id)?.needsTransition)b.needsTransition={...saved.get(b.id).needsTransition};g.needsLegacyMigration=(data.needsVersion||0)<NEEDS_VERSION;return needsNormalizeIsland(g,g.needsLegacyMigration);};
const needsPack=packIsland;packIsland=function(g){const saved=needsPack(g);saved.needsVersion=NEEDS_VERSION;for(const b of saved.blds){const live=g.byId.get(b.id);if(live.needsTransition?.remaining>0)b.needsTransition={...live.needsTransition};if(live.powerFuelRemaining>0)b.powerFuelRemaining=live.powerFuelRemaining;}return saved;};
function needsMigrateOwner(g=G){const state=cityState(g),highest=Math.max(1,...cityOwnerStates(g).flatMap(s=>s.blds.filter(b=>b.type==='haus').map(b=>b.tier)));
 // Existing higher homes prove that their earlier population gates were reached.
 for(let tier=1;tier<highest;tier++)state.peaks[tier]=Math.max(state.peaks[tier]||0,...Object.values(NEED_UNLOCK).filter(gate=>gate[1]===tier).map(gate=>gate[2]));
 state.legacyGoods=[];state.legacyServices=[];
}
const needsLoadGame=loadGame;loadGame=function(...args){const result=needsLoadGame(...args);if(!result)return result;needsEnsureFertilities();for(const g of WORLD.islands.filter(Boolean)){needsNormalizeIsland(g);if(g.needsLegacyMigration)needsMigrateOwner(g);delete g.needsLegacyMigration;}updateCityProgress(false);renderBar();refreshWins();if(cityOwnerStates().some(g=>g.blds.some(b=>b.needsTransition?.remaining>0)))msg('Neue Versorgung: Bestehende Häuser behalten ihre Belegung und Grundzufriedenheit für 10 Spielminuten.','i_houses');return result;};
// Storage and pinned goods share exactly the same unlock rules as the dock.
goodVisibleInStore=function(id){return cityGoodUnlocked(id);};
const needsHouseHTML=infoHTML;infoHTML=function(...args){let html=needsHouseHTML(...args),b=G.byId.get(UI.sel);if(!html||b?.type!=='haus')return html;
 const services=needsLuxuryServices(b);if(services.length){const rows=services.map(s=>'<p><span class="need-service-icon" data-game-tooltip="'+attr(SVCN[s])+'">'+ic(typeSprite(NEED_SERVICE_BUILDINGS[s]),1)+'</span> '+chk(b.conn&&b.fire<=0&&b.cov?.[s])+' '+gameHouseNeedLabel(b,s,SVCN[s])+'</p>').join(''),at=html.indexOf('<h3>Luxusbedürfnisse</h3>');if(at>=0)html=html.slice(0,at)+html.slice(at).replace('<h3>Luxusbedürfnisse</h3>','<h3>Luxusbedürfnisse</h3>'+rows);}
 if(b.needsTransition?.remaining>0)html='<p class="needs-transition" role="status">Versorgungsumstellung: '+Math.ceil(b.needsTransition.remaining/60)+' Min. Bestandsschutz für Belegung und Grundzufriedenheit.</p>'+html;
 return html;};

/* New fruitfulness is guaranteed world-wide, deterministic, and saved with island profiles. */
function needsEnsureFertilities(){for(const [key,offset] of [['kaffee',0],['zuckerrohr',2],['kakao',4]])for(let n=0;n<2;n++){const m=ISLANDS[(offset+n+1)%ISLANDS.length];if(!m.fert.includes(key))m.fert.push(key);}}
const needsGenerateProfiles=generateIslandProfiles;generateIslandProfiles=function(...args){const profiles=needsGenerateProfiles(...args);for(const [key,offset] of [['kaffee',0],['zuckerrohr',2],['kakao',4]])for(let n=0;n<2;n++){const p=profiles[(offset+n+1)%profiles.length];if(!p.fert.includes(key))p.fert.push(key);}return profiles;};
const needsApplyProfiles=applyIslandProfiles;applyIslandProfiles=function(profiles){needsApplyProfiles(profiles);for(let i=0;i<profiles.length;i++)if(ISLANDS[i])ISLANDS[i].fert=[...new Set(profiles[i].fert)];needsEnsureFertilities();};
const needsAfterNew=afterNewWorld;afterNewWorld=function(...args){needsEnsureFertilities();return needsAfterNew(...args);};

/* Coal and copper use reserved mine sites; terrain and older mines are never overwritten. */
const NEED_MINE_TYPES=new Set(['mine','steinbruch','goldmine','kohlemine','kupfermine']);
const needsMountainSite=gameMountainSite;gameMountainSite=function(type,x,y){return B[type]?.deposit?G.deposits.some(n=>n.type===type&&n.x===x&&n.y===y&&!n.legacy):needsMountainSite(type,x,y);};
const needsCanPlace=canPlace;canPlace=function(type,x,y){if(B[type]?.retired)return {ok:false,why:'Dieses Gebäude ist nicht mehr baubar.'};if(B[type]?.deposit&&!G.deposits.some(n=>n.type===type&&n.x===x&&n.y===y&&!n.legacy))return {ok:false,why:B[type].n+' benötigt ein passendes Vorkommen.'};if(type==='dampfkraftwerk'&&!nearWater(x,y,B[type].w,B[type].h))return {ok:false,why:'Kraftwerk muss direkt an Fluss oder Meer grenzen.'};return needsCanPlace(type,x,y);};
const needsCanMove=canMoveBuilding;canMoveBuilding=function(b,x,y){if(B[b?.type]?.deposit&&!G.deposits.some(n=>n.type===b.type&&n.x===x&&n.y===y&&!n.legacy))return {ok:false,why:'Nur auf ein passendes Vorkommen verschieben.'};if(b?.type==='dampfkraftwerk'&&!nearWater(x,y,b.w,b.h))return {ok:false,why:'Kraftwerk muss direkt an Fluss oder Meer grenzen.'};return needsCanMove(b,x,y);};
for(const [type,icon,name] of [['kohlemine','kohle','Kohle'],['kupfermine','kupfer','Kupfer']])DEPOSIT_RESOURCE_ICONS.push([type,icon,name]);
const needsOpenDeposit=openDeposit;openDeposit=function(n){if(!B[n.type]?.deposit)return needsOpenDeposit(n);UI.depositChoice=n;openWin('deposit',B[n.type].n,()=>{const r=canPlace(n.type,n.x,n.y);return '<p>'+esc(B[n.type].n)+' · '+n.x+', '+n.y+'</p><div class="cost">'+costHTML(B[n.type].cost)+'</div><p>'+esc(r.ok?'Abbauplatz verfügbar.':r.why)+'</p><button class="btn primary" data-act="deposit-build" data-type="'+n.type+'" '+(r.ok?'':'disabled')+'>Bauen</button>';});};

/* Electricity: cached cable topology plus actual road-distance coverage. */
B.dampfkraftwerk.kind='generator';
function needsPowerTopology(g=G){if(g.powerTopology)return g.powerTopology;const nodes=g.blds.filter(b=>['dampfkraftwerk','kabelmast','umspannwerk','kabelstation'].includes(b.type)),bins=new Map(),links=[],neighbours=new Map(nodes.map(b=>[b.id,[]]));
 for(const b of nodes){const bx=Math.floor(cx(b)/6),by=Math.floor(cy(b)/6);for(let y=by-1;y<=by+1;y++)for(let x=bx-1;x<=bx+1;x++)for(const a of bins.get(x+':'+y)||[])if(powerNodesCanConnect(a,b)){links.push([a,b]);neighbours.get(a.id).push(b);neighbours.get(b.id).push(a);}const key=bx+':'+by;if(!bins.has(key))bins.set(key,[]);bins.get(key).push(b);}
 const substations=nodes.filter(b=>b.type==='umspannwerk').map(b=>({b,roads:roadReach(b,def(b).serviceRange||def(b).r)}));return g.powerTopology={nodes,links,neighbours,substations};
}
function needsPowerUpdate(g=G){const net=needsPowerTopology(g),live=b=>!b.paused&&b.fire<=0,queue=net.nodes.filter(b=>b.type==='dampfkraftwerk'&&live(b)&&b.conn&&b.staffEff>0&&b.powerFuelRemaining>0),seen=new Set(queue.map(b=>b.id));
 for(let i=0;i<queue.length;i++)for(const b of net.neighbours.get(queue[i].id)||[])if(live(b)&&!seen.has(b.id)){seen.add(b.id);queue.push(b);}
 const roads=new Set();for(const s of net.substations)if(seen.has(s.b.id)&&s.b.conn)for(const [k] of s.roads)roads.add(k);
 g.powerRoads=roads;for(const b of g.blds){b.electrified=!!(live(b)&&ringCells(b).some(([x,y])=>INMAP(x,y)&&roads.has(IDX(x,y))));if(b.type==='haus'){b.cov??={};b.cov.strom=b.electrified;}if(net.neighbours.has(b.id))b.powered=seen.has(b.id);}
 return net;
}
const needsRebuildNet=rebuildNet;rebuildNet=function(...args){const result=needsRebuildNet(...args);G.powerTopology=null;needsPowerUpdate();return result;};
const needsWorkforce=assignWorkforce;assignWorkforce=function(g){const result=needsWorkforce(g);for(const b of g.blds)if(B[b.type].requiresElectricity&&!b.electrified)b.eff=0;return result;};
function needsPowerStep(dt){if(!needsPowerTopology().nodes.length)return;for(const b of G.blds)if(b.type==='dampfkraftwerk'){
 if(b.paused||b.fire>0||!b.conn||!(b.staffEff>0)){b.status=b.paused?'Pausiert':!b.conn?'Kein Straßenanschluss':'Arbeitskräfte fehlen';continue;}
 b.powerFuelRemaining=Math.max(0,(b.powerFuelRemaining||0)-dt);
 if(b.powerFuelRemaining<=0&&(b.inputStock?.kohle||0)>=1){consumeDeliveryInput(b,'kohle',1);b.powerFuelRemaining=30/Math.max(.01,b.staffEff);}
 b.status=b.powerFuelRemaining>0?'Erzeugt Strom':'Kohle fehlt';
 }needsPowerUpdate();}
const needsStep=step;step=function(dt){if(G.dirty)rebuildNet();needsPowerStep(dt);const result=needsStep(dt);for(const b of G.blds)if(b.type==='haus'){b.mood=Math.max(needsHouseMood(b),b.needsTransition?.remaining>0?b.needsTransition.mood||0:0);if(b.needsTransition)b.needsTransition.remaining=Math.max(0,b.needsTransition.remaining-dt);}return result;};
const needsProductionStatus=gameProductionStatus;gameProductionStatus=function(b){return B[b.type].requiresElectricity&&!b.electrified?'Stromversorgung fehlt':needsProductionStatus(b);};
const needsPowerInfo=infoHTML;infoHTML=function(...args){let html=needsPowerInfo(...args),b=G.byId.get(UI.sel);if(!html||!b)return html;if(['dampfkraftwerk','umspannwerk','kabelmast'].includes(b.type))html+='<section><h3>Stromnetz</h3><p>'+esc(b.powered?'Mit einem laufenden Kraftwerk verbunden.':'Keine Verbindung zu einem laufenden Kraftwerk.')+'</p>'+(b.type==='dampfkraftwerk'?'<p>Kohle im Betrieb: '+fmt(b.inputStock?.kohle||0)+' · Brennstoffrest: '+Math.ceil(b.powerFuelRemaining||0)+'s</p>':'')+'</section>';return html;};
// Expose energy as one coherent group rather than scattering its infrastructure across the dock.
const needsDockEntries=dockEntries;dockEntries=function(tier=UI.populationFilter||1){const entries=needsDockEntries(tier),energyTypes=new Set(['dampfkraftwerk','kabelmast','umspannwerk','kabelstation']),energyGoods=new Set(['kupfer','kupferdraht','guttapercha']);const filtered=entries.filter(e=>!energyTypes.has(e.type)&&!energyGoods.has(e.good));if(tier===3&&cityServiceUnlocked('strom'))filtered.push({id:'energy',energy:true,name:'Energie'});return filtered;};
const needsDockCard=dockCard;dockCard=function(entry){if(!entry.energy)return needsDockCard(entry);return '<button type="button" class="bi dock-card energy-card" data-energy-group aria-label="Energieversorgung öffnen">'+ic(SP.i_energy?'i_energy':'laternen',2)+'<b>Energie</b><span class="production-chain-marker" aria-hidden="true">+</span></button>';};
$('#items').addEventListener('click',e=>{if(!e.target.closest('[data-energy-group]'))return;e.preventDefault();e.stopImmediatePropagation();openEnergyWindow();},true);
const needsWinAct=winAct;winAct=function(id,ds){if(ds.act==='energy-build'){if(unlocked(ds.type)){closeWin('energy');setTool('build',ds.type);}return;}return needsWinAct(id,ds);};
const needsDrawWarnings=drawBuildingWarnings;drawBuildingWarnings=function(ctx,...args){needsDrawWarnings(ctx,...args);if(worldOverview())return;const selected=G.byId.get(UI.sel),overlay=['dampfkraftwerk','kabelmast','umspannwerk'].includes(selected?.type);ctx.save();ctx.lineWidth=2/UI.sc;
 for(const g of WORLD.islands.filter(Boolean))for(const [p,q] of g.powerTopology?.links||[]){const [a,b]=(p.powerDistance||0)>(q.powerDistance||0)?[q,p]:[p,q];if(window.PowerCablePreview?.draw(ctx,a,b,{overlay}))continue;const x=cx(a)*16,y=cy(a)*16-16,xx=cx(b)*16,yy=cy(b)*16-16;if(Math.max(x,xx)<UI.cam.x-innerWidth/UI.z||Math.min(x,xx)>UI.cam.x+innerWidth/UI.z)continue;ctx.lineWidth=(overlay&&a.powered&&b.powered?2.5:2)/UI.sc;ctx.setLineDash(overlay&&a.powered&&b.powered?[6/UI.sc,4/UI.sc]:[]);ctx.lineDashOffset=overlay&&!WORK_ART.reduced.matches?-G.time*12:0;ctx.strokeStyle=overlay&&a.powered&&b.powered?'#9ddfff':'#b5a486';ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo((x+xx)/2,(y+yy)/2+5,xx,yy);ctx.stroke();}
 if(overlay){ctx.setLineDash([]);ctx.strokeStyle='#78bfff';for(const b of G.blds)if(b.electrified&&(!selected||selected.type!=='umspannwerk'||serviceCovers(selected,b)))ctx.strokeRect(b.x*16+1,b.y*16+1,b.w*16-2,b.h*16-2);}
 ctx.restore();};

const needsInstallArt=installNativeBuildings;installNativeBuildings=function(...args){const result=needsInstallArt(...args);for(const id of Object.keys(B))if(B[id].artPlaceholder)needsAliasBuilding(id);return result;};
const needsWorkshopSprite=workshopSprite;workshopSprite=function(b){return B[b.type].artPlaceholder?typeSprite(B[b.type].artPlaceholder):needsWorkshopSprite(b);};

// Patricians introduce electricity as their final additional mandatory supply;
// aristocrats list the same requirements as regular basic services/goods.
const needsPatricianHTML=infoHTML;infoHTML=function(...args){const html=needsPatricianHTML(...args),b=G.byId.get(UI.sel);if(!html||b?.type!=='haus'||b.tier!==3)return html;const template=document.createElement('template');template.innerHTML=html;const moved=[];for(const row of template.content.querySelectorAll('.needgroup .nd'))if(row.querySelector('[data-good="gluehbirnen"]')||row.querySelector('.need-name')?.textContent===SVCN.strom)moved.push(row);if(!moved.length)return html;const section=document.createElement('section');section.className='needgroup';section.innerHTML='<h3>Zusätzliche Versorgung</h3><div class="needs"></div>';section.querySelector('.needs').append(...moved);const luxury=[...template.content.querySelectorAll('.needgroup')].find(s=>s.querySelector('h3')?.textContent==='Luxusbedürfnisse');if(luxury)luxury.before(section);else template.content.querySelector('.house-upgrade-summary')?.before(section);return template.innerHTML;};
