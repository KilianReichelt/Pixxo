/* Service coverage, previews and vehicles all measure the same road distance. */
const EMERGENCY_SERVICES={
 feuer:{ranges:[28,40,52,64],vehicle:'Löschwagen'},
 krankenhaus:{ranges:[36,48,60],vehicle:'Krankenwagen'}
};
const EMERGENCY_UPGRADE_COSTS={2:{bretter:16,stein:12,ziegel:8},3:{stein:24,ziegel:18,stahl:6},4:{stein:32,ziegel:24,glas:12,stahl:8}};
function emergencyMaxLevel(b){return EMERGENCY_SERVICES[b?.type]?.ranges.length||1;}
function emergencyLevel(b){return Math.max(1,Math.min(emergencyMaxLevel(b),Math.trunc(b.serviceLevel)||1));}
function emergencyVehicleCapacity(b){return EMERGENCY_SERVICES[b?.type]?emergencyLevel(b):1;}
function emergencyRange(b,level=emergencyLevel(b)){return Math.ceil(EMERGENCY_SERVICES[b.type].ranges[level-1]*(1+(researchEffects(WORLD?.islands[b.island]||G)[b.type]||0)/100));}
const emergencyDefinition=def;
def=function(b){const d=emergencyDefinition(b),settings=EMERGENCY_SERVICES[b.type];if(!settings){const range=d.r||d.serviceRange;return d.kind==='svc'&&(d.serviceRange!==range||d.transportRange!==range)?{...d,serviceRange:range,transportRange:range}:d;}const range=emergencyRange(b);return d.r===range&&d.serviceRange===range&&d.transportRange===range?d:{...d,r:range,serviceRange:range,transportRange:range};};
// Static previews use the basis range, live windows use def(building).
for(const [type,settings] of Object.entries(EMERGENCY_SERVICES))Object.assign(B[type],{r:settings.ranges[0],serviceRange:settings.ranges[0],transportRange:settings.ranges[0]});
for(const d of Object.values(B))if(d.kind==='svc'&&d.serviceRange){d.r=d.serviceRange;d.transportRange=d.serviceRange;}
let serviceReachCache=new WeakMap();
function serviceRoadRange(b){return def(b).serviceRange||def(b).r||0;}
function serviceRoadReach(b){let cache=serviceReachCache.get(G);if(!cache)serviceReachCache.set(G,cache=new Map());const key=[b.id,b.type,b.x,b.y,b.w,b.h,serviceRoadRange(b)].join(':');if(!cache.has(key)){if(cache.size>=128)cache.delete(cache.keys().next().value);cache.set(key,roadReach(b,serviceRoadRange(b)));}return cache.get(key);}
serviceCovers=function(service,building){const reach=serviceRoadReach(service);return ringCells(building).some(([x,y])=>INMAP(x,y)&&reach.has(IDX(x,y)));};
healthRoadCoverage=serviceCovers;
const emergencyRebuild=rebuildNet;rebuildNet=function(...args){serviceReachCache.delete(G);return emergencyRebuild(...args);};
const serviceLogisticsReach=drawLogisticsReach;drawLogisticsReach=function(ctx,b){if(def(b).kind!=='svc')return serviceLogisticsReach(ctx,b);ctx.save();ctx.fillStyle='rgba(80,190,255,.45)';ctx.strokeStyle='#e9f8ff';ctx.lineWidth=1;ctx.setLineDash([3,2]);for(const [k] of serviceRoadReach(b)){const x=k%MAPW*16,y=Math.floor(k/MAPW)*16;ctx.fillRect(x,y,16,16);ctx.strokeRect(x+2,y+2,12,12);}ctx.restore();};
const SERVICE_DISTANCE_HINT='Straßenentfernung ab dem ersten Anschluss: gerade 1, diagonal 1,41 je Abschnitt. Brücken zählen mit. Die hervorgehobenen Straßen zeigen die tatsächliche Reichweite einschließlich Forschung.';
function upgradeEmergencyService(b){
 if(!b||!EMERGENCY_SERVICES[b.type])return 'Kein ausbaubarer Einsatzdienst.';
 if(G.cpu||b.island!==activeIsland)return 'Nur eigene Gebäude ausbauen.';
 const level=emergencyLevel(b);if(level===emergencyMaxLevel(b))return 'Höchste Ausbaustufe erreicht.';
 if(b.fire>0)return 'Zuerst den Brand löschen.';
 const cost=EMERGENCY_UPGRADE_COSTS[level+1];if(!canAfford(cost))return 'Baumaterial für den Ausbau fehlt.';
 payCost(cost);b.serviceLevel=level+1;G.dirty=true;rebuildNet();saveGame();refreshWins();return true;
}
const emergencyInfo=infoHTML;infoHTML=function(...args){let html=emergencyInfo(...args),b=G.byId.get(UI.sel),settings=EMERGENCY_SERVICES[b?.type];if(html&&b&&B[b.type].kind==='svc')html=html.replace(/(Straßenreichweite<\/span>)<b>(\d+) Felder<\/b>/,(_,label,range)=>label+'<b data-game-tooltip="'+attr(SERVICE_DISTANCE_HINT)+'">'+range+' Straßenkacheln</b>');if(!html||!settings)return html;const level=emergencyLevel(b),vehicles=(b.type==='feuer'?G.fireEngines:G.ambulances)||[],busy=vehicles.filter(e=>e.station===b.id).length;
 html+='<section class="emergency-service"><h3>Ausbaustufe '+level+' / '+emergencyMaxLevel(b)+'</h3><p>'+busy+' / '+level+' '+settings.vehicle+' im Einsatz · '+serviceRoadRange(b)+' Straßenkacheln Reichweite</p>';
 if(level<emergencyMaxLevel(b))html+='<p>Nächste Stufe: '+(level+1)+' Fahrzeuge · '+emergencyRange(b,level+1)+' Straßenkacheln</p><button type="button" class="btn" data-act="emergency-upgrade" '+(!canAfford(EMERGENCY_UPGRADE_COSTS[level+1])?'disabled':'')+'>Ausbauen '+costHTML(EMERGENCY_UPGRADE_COSTS[level+1])+'</button>';
 return html+'</section>';
};
const emergencyAction=winAct;winAct=function(id,ds){if(ds.act==='emergency-upgrade'){const result=upgradeEmergencyService(G.byId.get(UI.sel));if(result!==true)msg(result,'i_alert');return;}return emergencyAction(id,ds);};
const emergencyPack=packIsland;packIsland=function(g){const data=emergencyPack(g);for(const b of data.blds)if(EMERGENCY_SERVICES[b.type])b.serviceLevel=emergencyLevel(g.byId.get(b.id));return data;};
const emergencyUnpack=unpackIsland;unpackIsland=function(data,...args){const g=emergencyUnpack(data,...args),saved=new Map((data.blds||[]).map(b=>[b.id,b]));for(const b of g.blds)if(EMERGENCY_SERVICES[b.type])b.serviceLevel=emergencyLevel(saved.get(b.id)||b);g.dirty=true;return g;};
