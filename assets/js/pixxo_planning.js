/* Straße und Flächenabriss werden erst nach der Vorschau ausgeführt. */
let constructionPlan=null,pendingAreaDemolition=null;
function roadTileAllowed(x,y,island=activeIsland){return INMAP(x,y)&&islandAt(x,y)===island&&!G.occ[IDX(x,y)]&&BUILDABLE(G.tiles[IDX(x,y)])&&!(G.deposits||[]).some(n=>x>=n.x&&x<n.x+B[n.type].w&&y>=n.y&&y<n.y+B[n.type].h);}
function roadEndpoint(point,towards,island){
 if(roadTileAllowed(point.x,point.y,island))return point;
 const building=INMAP(point.x,point.y)?G.byId.get(G.occ[IDX(point.x,point.y)]):null;if(!building)return null;
 return ringCells(building).filter(([x,y])=>roadTileAllowed(x,y,island)).map(([x,y])=>({x,y})).sort((a,b)=>Math.hypot(a.x-towards.x,a.y-towards.y)-Math.hypot(b.x-towards.x,b.y-towards.y))[0]||null;
}
function plannedRoadPath(start,end,island=activeIsland,maxLength=Infinity){
 if(start.x===end.x&&start.y===end.y)return roadTileAllowed(start.x,start.y,island)?[IDX(start.x,start.y)]:null;
 const from=roadEndpoint(start,end,island),to=roadEndpoint(end,start,island);if(!from||!to)return null;
 if(Math.hypot(from.x-to.x,from.y-to.y)>maxLength)return null;
 const first=IDX(from.x,from.y),goal=IDX(to.x,to.y),heap=[],cost=new Map([[first,0]]),prev=new Map([[first,-1]]),closed=new Set();
 const heuristic=(x,y)=>Math.hypot(x-to.x,y-to.y)*.35,less=(a,b)=>Math.abs(a.f-b.f)<1e-8?a.h<b.h:a.f<b.f;
 const push=entry=>{let i=heap.length;heap.push(entry);while(i){const p=(i-1)>>1;if(!less(entry,heap[p]))break;heap[i]=heap[p];i=p;}heap[i]=entry;};
 const pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let c=i*2+1;if(c+1<heap.length&&less(heap[c+1],heap[c]))c++;if(!less(heap[c],last))break;heap[i]=heap[c];i=c;}heap[i]=last;}return top.k;};
 push({k:first,f:heuristic(from.x,from.y),h:heuristic(from.x,from.y)});
 while(heap.length){const k=pop();if(closed.has(k))continue;closed.add(k);if(k===goal){const path=[];for(let p=goal;p>=0;p=prev.get(p))path.push(p);return path.reverse();}
  const x=k%MAPW,y=Math.floor(k/MAPW);for(const [dx,dy] of LAND_STEPS){const nx=x+dx,ny=y+dy;if(Math.hypot(nx-from.x,ny-from.y)+Math.hypot(nx-to.x,ny-to.y)>maxLength||!roadTileAllowed(nx,ny,island)||!roadStepAllowed(x,y,nx,ny)||dx&&dy&&(!roadTileAllowed(nx,y,island)||!roadTileAllowed(x,ny,island)))continue;const n=IDX(nx,ny),next=cost.get(k)+(G.road[n]?.35:1)*Math.hypot(nx-x,ny-y);if(closed.has(n)||cost.has(n)&&next>=cost.get(n))continue;cost.set(n,next);prev.set(n,k);const h=heuristic(nx,ny);push({k:n,f:next+h,h});}
 }
 return null;
}
function areaDemolitionTargets(a,b,island=activeIsland){
 const rect={x0:Math.max(0,Math.min(a.x,b.x)),y0:Math.max(0,Math.min(a.y,b.y)),x1:Math.min(MAPW-1,Math.max(a.x,b.x)),y1:Math.min(MAPH-1,Math.max(a.y,b.y))},buildings=new Set();
 for(const building of G.blds)if(building.type!=='kontor'&&building.x<=rect.x1&&building.x+building.w>rect.x0&&building.y<=rect.y1&&building.y+building.h>rect.y0){buildings.add(building);if(FIELD_RULES[building.type])for(const field of fieldModules(building))buildings.add(field);}
 const roads=[];for(const k of minimapRoadCells(G.road)){const x=k%MAPW,y=Math.floor(k/MAPW);if(x>=rect.x0&&x<=rect.x1&&y>=rect.y0&&y<=rect.y1&&islandAt(x,y)===island)roads.push(k);}
 return {rect,buildings:[...buildings],roads,island};
}
function areaUpgradeTargets(a,b,type,island=activeIsland){
 const rect={x0:Math.max(0,Math.min(a.x,b.x)),y0:Math.max(0,Math.min(a.y,b.y)),x1:Math.min(MAPW-1,Math.max(a.x,b.x)),y1:Math.min(MAPH-1,Math.max(a.y,b.y))},buildings=[],roads=[],cost={};
 const add=price=>{for(const [good,n] of Object.entries(price))cost[good]=(cost[good]||0)+n;};
 if(type==='road'&&stoneRoadUnlocked())for(const k of minimapRoadCells(G.road)){const x=k%MAPW,y=Math.floor(k/MAPW);if(G.road[k]===1&&x>=rect.x0&&x<=rect.x1&&y>=rect.y0&&y<=rect.y1&&islandAt(x,y)===island){roads.push(k);add({gold:4,stein:1});}}
 if(type==='haus'||type==='kontor')for(const building of G.blds)if(building.type===type&&building.x<=rect.x1&&building.x+building.w>rect.x0&&building.y<=rect.y1&&building.y+building.h>rect.y0){const request=upgradeRequest(building);if(request?.ready){buildings.push({building,tier:building.tier});add(request.cost);}}
 return {rect,buildings,roads,cost,type,island};
}
function commitUpgradePlan(plan){
 const targets=plan.upgrades;if(activeIsland!==plan.island)return 'Die ausgewählte Insel hat sich geändert.';
 if(!targets.buildings.length&&!targets.roads.length)return plan.source==='road'&&!stoneRoadUnlocked()?'Steinbruch fehlt':'Keine aufwertbaren Objekte dieser Art ausgewählt.';
 const fresh=areaUpgradeTargets(plan.start,plan.end,plan.source,plan.island);
 if(targets.roads.some(k=>!fresh.roads.includes(k))||targets.buildings.some(({building,tier})=>building.tier!==tier||!fresh.buildings.some(n=>n.building===building)))return 'Die Auswahl hat sich geändert. Bitte erneut auswählen.';
 const cost={};for(const k of targets.roads){cost.gold=(cost.gold||0)+4;cost.stein=(cost.stein||0)+1;}for(const {building} of targets.buildings)for(const [good,n] of Object.entries(upgradeRequest(building).cost))cost[good]=(cost[good]||0)+n;
 if(!canAfford(cost))return upgradeOnlyFundsMissing(cost)?false:'Für die gesamte Auswahl fehlt Baumaterial.';
 for(const k of targets.roads)roadUpgrade(k%MAPW,Math.floor(k/MAPW));
 for(const {building} of targets.buildings)if(building.type==='haus')upgradeHouse(building);else upgradePort(building);
 rebuildNet();refreshWins();renderTop(true);saveGame();return true;
}
function beginConstructionPlan(t){
 const owner=islandAt(t.x,t.y);if(owner>=0&&owner!==activeIsland&&WORLD.islands[owner])activateIsland(owner);
 const source=UI.tool==='upgrade'?(INMAP(t.x,t.y)&&G.road[IDX(t.x,t.y)]?'road':upgradeBuildingAt(t)?.type):null;
 constructionPlan={tool:UI.tool,start:{...t},end:null,island:activeIsland,source};updateConstructionPlan(t);
}
function updateConstructionPlan(t){
 const plan=constructionPlan;if(!plan||plan.end?.x===t.x&&plan.end?.y===t.y)return;plan.end={...t};
 if(plan.tool==='road'){plan.path=plannedRoadPath(plan.start,t,plan.island);plan.newRoads=plan.path?.filter(k=>!G.road[k])||[];plan.gold=plan.newRoads.length*ROAD_COST;}
 else if(plan.tool==='upgrade')plan.upgrades=areaUpgradeTargets(plan.start,t,plan.source,plan.island);
 else plan.targets=areaDemolitionTargets(plan.start,t,plan.island);
 updateHint();
}
function cancelConstructionPlan(){constructionPlan=null;updateHint();}
function commitRoadPlan(plan){
 if(!plan.path)return 'Zwischen Start und Ziel gibt es keinen bebaubaren Straßenweg.';
 if(activeIsland!==plan.island||plan.newRoads.some(k=>!roadTileAllowed(k%MAPW,Math.floor(k/MAPW),plan.island)||G.road[k]))return 'Die Baufläche hat sich geändert. Bitte die Straße erneut planen.';
 if(!whList().length)return 'Zuerst ein Kontor gründen.';if(G.gold<plan.gold)return 'Für die gesamte Straße fehlt Gold.';
 for(const k of plan.newRoads)placeRoad(k%MAPW,Math.floor(k/MAPW));if(plan.newRoads.length){rebuildNet();saveGame();renderTop(true);}return true;
}
function areaDemolitionHTML(){
 const targets=pendingAreaDemolition;if(!targets)return null;const population=targets.buildings.reduce((sum,b)=>sum+Math.floor(b.pop||0),0),refund=targets.buildings.reduce((sum,b)=>sum+demolitionRefund(b).gold,0)+targets.roads.length;
 const counts=new Map();for(const b of targets.buildings)counts.set(B[b.type].n,(counts.get(B[b.type].n)||0)+1);
 return `<p><b>${targets.buildings.length} Gebäude und ${targets.roads.length} Straßenfelder abreißen?</b></p><ul>${[...counts].map(([name,n])=>`<li>${n} × ${esc(name)}</li>`).join('')}</ul><p>Rückerstattung: ${refund} Gold.${population?' '+population+' Einwohner verlieren ihr Haus.':''}</p><p class="small">Kontore bleiben erhalten. Berührte Gebäude und zugehörige Betriebsflächen werden vollständig abgerissen.</p><div class="btns"><button class="btn danger" data-act="area-demolish-confirm">Bereich abreißen</button><button class="btn" data-act="area-demolish-cancel">Abbrechen</button></div>`;
}
function finishConstructionPlan(){
 const plan=constructionPlan;constructionPlan=null;if(!plan)return;
 if(plan.tool==='road'){const result=commitRoadPlan(plan);UI.paintFail=result===true?'':result;if(result!==true)msg(result,'i_alert');}
 else if(plan.tool==='upgrade'){const result=commitUpgradePlan(plan);UI.paintFail=typeof result==='string'?result:'';if(typeof result==='string')msg(result,'i_alert');}
 else if(plan.start.x===plan.end.x&&plan.start.y===plan.end.y){const result=demolishAt(plan.end.x,plan.end.y);if(typeof result==='string')msg(result,'i_alert');saveGame();}
 else if(plan.targets.buildings.length||plan.targets.roads.length){pendingAreaDemolition=plan.targets;openWin('area-demolition','Flächenabriss prüfen',areaDemolitionHTML);}
 updateHint();
}
const planningSetTool=setTool;setTool=function(...args){constructionPlan=null;planningSetTool(...args);};
const planningHint=updateHint;updateHint=function(){
 planningHint();const hint=$('#hint');if(!hint)return;let info=hint.querySelector('[data-plan-info]');if(!constructionPlan){info?.remove();return;}
 if(!info){info=document.createElement('span');info.dataset.planInfo='';hint.prepend(info);}
 const plan=constructionPlan;if(plan.tool==='upgrade'){const targets=plan.upgrades,cost=Object.entries(targets.cost).map(([good,n])=>`${n} ${good==='gold'?'Gold':GN[good].n}`).join(' · ');info.textContent=`${targets.buildings.length+targets.roads.length} × ${plan.source==='road'?'Straße':B[plan.source]?.n||'kein Gebäudetyp'}${cost?' · '+cost:''}${upgradeMaterialsAvailable(targets.cost)?'':' · Material fehlt'} · Loslassen zum Aufwerten. `;return;}
 info.textContent=plan.tool==='road'?(plan.path?`${plan.newRoads.length} neue Straßenfelder · ${plan.gold} Gold${G.gold<plan.gold?' · Gold fehlt':''} · Loslassen zum Bauen. `:'Kein bebaubarer Weg zum Ziel. '):`${plan.targets.buildings.length} Gebäude · ${plan.targets.roads.length} Straßenfelder · Loslassen zum Prüfen. `;
};
const planningGhost=drawGhost;drawGhost=function(ctx){
 const plan=constructionPlan;if(!plan){planningGhost(ctx);return;}
 ctx.save();ctx.lineWidth=1/UI.sc;
 if(plan.tool==='road'){ctx.fillStyle=plan.path&&G.gold>=plan.gold?'rgba(235,212,149,.55)':'rgba(222,107,88,.5)';ctx.strokeStyle='#fff0c1';for(const k of plan.newRoads){const x=k%MAPW*16,y=Math.floor(k/MAPW)*16;ctx.fillRect(x,y,16,16);ctx.strokeRect(x+1,y+1,14,14);}}
 else if(plan.tool==='upgrade'){const {rect,buildings,roads,cost}=plan.upgrades;ctx.strokeStyle='#ffe3a0';ctx.strokeRect(rect.x0*16,rect.y0*16,(rect.x1-rect.x0+1)*16,(rect.y1-rect.y0+1)*16);ctx.fillStyle=canAfford(cost)?'rgba(235,212,149,.45)':'rgba(222,107,88,.45)';for(const k of roads)ctx.fillRect(k%MAPW*16,Math.floor(k/MAPW)*16,16,16);for(const {building:b} of buildings){ctx.fillRect(b.x*16,b.y*16,b.w*16,b.h*16);ctx.strokeRect(b.x*16,b.y*16,b.w*16,b.h*16);}}
 else{const {rect,buildings}=plan.targets;ctx.fillStyle='rgba(194,76,60,.3)';ctx.fillRect(rect.x0*16,rect.y0*16,(rect.x1-rect.x0+1)*16,(rect.y1-rect.y0+1)*16);ctx.strokeStyle='#ffceac';ctx.strokeRect(rect.x0*16,rect.y0*16,(rect.x1-rect.x0+1)*16,(rect.y1-rect.y0+1)*16);for(const b of buildings)ctx.strokeRect(b.x*16,b.y*16,b.w*16,b.h*16);}
 ctx.restore();
};
const areaDemolitionAct=winAct;winAct=function(id,ds){
 if(ds.act==='area-demolish-cancel'){pendingAreaDemolition=null;closeWin('area-demolition');return;}
 if(ds.act==='area-demolish-confirm'){
  const targets=pendingAreaDemolition;pendingAreaDemolition=null;closeWin('area-demolition');if(!targets||!WORLD.islands[targets.island])return;if(activeIsland!==targets.island)activateIsland(targets.island);
  for(const b of targets.buildings)if(G.byId.has(b.id)&&b.type!=='kontor')removeBld(b,true);
  for(const k of targets.roads)if(G.road[k]&&islandAt(k%MAPW,Math.floor(k/MAPW))===targets.island){G.road[k]=0;G.roads--;G.gold+=1;PERF_ROADS.get(G.road)?.delete(k);}
  G.dirty=true;if(UI.sel&&!G.byId.has(UI.sel))selectB(null);rebuildNet();refreshWins();renderTop(true);saveGame();soundEffect('demolish');return;
 }
 areaDemolitionAct(id,ds);
};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&constructionPlan&&!e.target.closest('input,select,textarea')){e.preventDefault();cancelConstructionPlan();drag=null;}});
