/* Straßen werden ausschließlich als vollständiges Segment verbessert. */
function roadSegmentUpgradeTargets(point,island=activeIsland){
 const empty={type:'road',island,rect:{x0:point.x,y0:point.y,x1:point.x,y1:point.y},buildings:[],roads:[],cost:{}};
 if(!INMAP(point.x,point.y)||islandAt(point.x,point.y)!==island)return empty;
 const cells=new Set(roadSegment(IDX(point.x,point.y)).cells);
 // Brücken sind immer ein vollständiges Bauwerk, auch wenn ein Endpunkt ein Knoten ist.
 for(const k of cells)for(const n of G.bridges?.[k]?.cells||[])cells.add(n);
 const segment=[...cells].filter(k=>G.road[k]&&islandAt(k%MAPW,Math.floor(k/MAPW))===island),roads=segment.filter(k=>G.road[k]===1),cost={};
 for(const k of roads)for(const [good,n] of Object.entries(bridgeUpgradeTileCost(k)))cost[good]=(cost[good]||0)+n;
 const xs=segment.map(k=>k%MAPW),ys=segment.map(k=>Math.floor(k/MAPW));
 return {...empty,roads,cost,segment,rect:segment.length?{x0:Math.min(...xs),y0:Math.min(...ys),x1:Math.max(...xs),y1:Math.max(...ys)}:empty.rect};
}
const segmentAreaUpgrade=areaUpgradeTargets;
areaUpgradeTargets=function(a,b,type,island=activeIsland){return type==='road'?roadSegmentUpgradeTargets(a,island):segmentAreaUpgrade(a,b,type,island);};
function improveRoadSegment(point,island=activeIsland,expected=null){
 if(activeIsland!==island)return 'Die ausgewählte Insel hat sich geändert.';
 if(WORLD.islands[island]?.cpu&&!CPU_WORK)return 'Diese Insel gehört einem anderen Siedler.';
 if(!stoneRoadUnlocked())return 'Steinbruch fehlt';
 const target=roadSegmentUpgradeTargets(point,island);
 if(expected&&(target.roads.length!==expected.length||target.roads.some(k=>!expected.includes(k))))return 'Das Straßensegment hat sich geändert. Bitte erneut auswählen.';
 if(!target.roads.length)return 'Dieses Straßensegment ist bereits ausgebaut.';
 if(!canAfford(target.cost))return 'Für das gesamte Straßensegment fehlt Baumaterial.';
 payCost(target.cost);
 for(const k of target.roads){G.road[k]=2;if(G.bridges?.[k])G.bridges[k].kind=2;}
 G.dirty=true;UI.paintFail='';rebuildNet();refreshWins();renderTop(true);saveGame();soundEffect('road');return true;
}
const segmentCommitUpgrade=commitUpgradePlan;
commitUpgradePlan=function(plan){return plan.source==='road'?improveRoadSegment(plan.start,plan.island,plan.upgrades.roads):segmentCommitUpgrade(plan);};
roadUpgrade=function(x,y){
 if(!INMAP(x,y)||!G.road[IDX(x,y)])return false;
 const island=islandAt(x,y);if(island<0||!WORLD.islands[island]||WORLD.islands[island].cpu&&!CPU_WORK)return false;
 if(island!==activeIsland)activateIsland(island);
 const result=improveRoadSegment({x,y},island);UI.paintFail=result===true?'':result;return result===true;
};
const segmentUpgradeGhost=drawGhost;
drawGhost=function(ctx){segmentUpgradeGhost(ctx);if(UI.tool!=='upgrade'||constructionPlan)return;const t=ghostTile();if(!t||!INMAP(t.x,t.y)||!G.road[IDX(t.x,t.y)])return;const target=roadSegmentUpgradeTargets(t);ctx.save();ctx.fillStyle=stoneRoadUnlocked()&&canAfford(target.cost)?'rgba(235,212,149,.45)':'rgba(222,107,88,.45)';for(const k of target.roads)ctx.fillRect(k%MAPW*16,Math.floor(k/MAPW)*16,16,16);ctx.restore();};
const segmentUpgradeHint=updateHint;
updateHint=function(){segmentUpgradeHint();if(UI.tool!=='upgrade')return;const point=constructionPlan?.source==='road'?constructionPlan.start:ghostTile();if(!point||!INMAP(point.x,point.y)||!G.road[IDX(point.x,point.y)])return;const target=roadSegmentUpgradeTargets(point),cost=Object.entries(target.cost).map(([g,n])=>n+' '+(g==='gold'?'Gold':GN[g].n)).join(' · ');const hint=$('#hint');hint.textContent='Straßensegment verbessern · '+target.roads.length+' Felder'+(cost?' · '+cost:'')+(!stoneRoadUnlocked()?' · Steinbruch fehlt':!canAfford(target.cost)?' · Baumaterial fehlt':'')+' · Ein Klick wertet das ganze Segment auf.';hint.classList.add('show');};
