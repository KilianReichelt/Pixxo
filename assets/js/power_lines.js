/* Pole routes reuse the road planner, but reserve only the distributed pole sites. */
const POWER_POLE_SPAN=6;
Object.assign(B.kabelmast,{allowSand:true,requiresRoad:false,transportRange:0,d:'Leitet Strom ohne Straßenanschluss. Vom Startplatz am Kraftwerk oder einem bestehenden Mast aus ziehen; Masten werden automatisch verteilt.'});
function powerLineEnabled(){return UI.type==='kabelmast';}
function powerPoleAt(x,y){const id=INMAP(x,y)&&G.occ[IDX(x,y)];return G.byId.get(id)||(G.buildingPlans||[]).find(p=>p.id===id);}
function powerAdjacent(b,x,y){return ringCells(b).some(([a,c])=>a===x&&c===y);}
function powerPoleStartAnchor(x,y,excludeId){return [...G.blds,...(G.buildingPlans||[])].find(b=>b.id!==excludeId&&((['dampfkraftwerk','kabelstation'].includes(b.type)&&powerAdjacent(b,x,y))||(b.type==='kabelmast'&&Math.hypot(cx(b)-x-.5,cy(b)-y-.5)>.01&&Math.hypot(cx(b)-x-.5,cy(b)-y-.5)<=POWER_POLE_SPAN)));}
function powerNodesCanConnect(a,b){if(Math.hypot(cx(a)-cx(b),cy(a)-cy(b))>POWER_POLE_SPAN)return false;const generator=a.type==='dampfkraftwerk'?a:b.type==='dampfkraftwerk'?b:null,pole=a.type==='kabelmast'?a:b.type==='kabelmast'?b:null;return !generator||!pole||powerAdjacent(generator,pole.x,pole.y);}
const poleCanPlace=canPlace;canPlace=function(type,x,y){const r=poleCanPlace(type,x,y);if(type==='kabelmast'&&(r.ok||r.afford===false)&&!powerPoleStartAnchor(x,y))return {ok:false,why:'Am Kraftwerk, an der Kabelstation oder einem bestehenden Mast beginnen.'};return r;};
const poleCanMove=canMoveBuilding;canMoveBuilding=function(b,x,y){const r=poleCanMove(b,x,y);return b?.type==='kabelmast'&&r.ok&&!powerPoleStartAnchor(x,y,b.id)?{ok:false,why:'Mast benötigt Anschluss an das Stromnetz.'}:r;};
function powerPoleGeometry(x,y){const old=planningGeometryOnly;planningGeometryOnly=true;try{return poleCanPlace('kabelmast',x,y);}finally{planningGeometryOnly=old;}}
function powerRouteAllowed(x,y,island=activeIsland){if(!INMAP(x,y)||islandAt(x,y)!==island)return false;const b=powerPoleAt(x,y);if(b&&b.type!=='kabelmast')return false;return (BUILDABLE(G.tiles[IDX(x,y)])||isRiver(IDX(x,y)))&&!(G.deposits||[]).some(n=>x>=n.x&&x<n.x+B[n.type].w&&y>=n.y&&y<n.y+B[n.type].h);}
function powerRootSlots(b){return ringCells(b).filter(([x,y])=>powerPoleAt(x,y)?.type==='kabelmast'||powerPoleGeometry(x,y).ok).map(([x,y])=>({x,y,root:b}));}
function powerLineTargets(start,end){
 let from={...start};const source=powerPoleAt(start.x,start.y);
 if(source&&['dampfkraftwerk','kabelstation'].includes(source.type)){const slots=powerRootSlots(source).sort((a,b)=>Math.hypot(a.x-end.x,a.y-end.y)-Math.hypot(b.x-end.x,b.y-end.y));if(!slots.length)return {ok:false,why:'Kein freier Startplatz am Gebäude.'};from=slots[0];}
 const existing=powerPoleAt(from.x,from.y)?.type==='kabelmast';
 if(!existing&&!powerPoleStartAnchor(from.x,from.y))return {ok:false,why:'An einem markierten Startplatz oder bestehenden Mast beginnen.'};
 let to={...end};const receiver=powerPoleAt(end.x,end.y);if(receiver&&['dampfkraftwerk','kabelstation','umspannwerk'].includes(receiver.type)){const slots=powerRootSlots(receiver).sort((a,b)=>Math.hypot(a.x-from.x,a.y-from.y)-Math.hypot(b.x-from.x,b.y-from.y));if(!slots.length)return {ok:false,why:'Kein freier Anschlussplatz am Zielgebäude.'};to=slots[0];}
 const distance=Math.hypot(from.x-to.x,from.y-to.y),path=plannedRoadPath(from,to,activeIsland,distance*1.6+16,{allowed:powerRouteAllowed,step:()=>true,corner:(x,y,dx,dy,island)=>powerRouteAllowed(x,y,island),exact:true,preferRoads:false});
 if(!path)return {ok:false,why:'Kein freier Leitungsverlauf zum Ziel.'};
 const sites=[],allSites=[],first={x:from.x,y:from.y,existing};if(!existing&&!powerPoleGeometry(first.x,first.y).ok)return {ok:false,why:'Startplatz ist nicht bebaubar.'};allSites.push(first);if(!existing)sites.push(first);
 let cursor=0;
 while(cursor<path.length-1){let best=-1,length=0;const origin=allSites.at(-1);for(let i=cursor+1;i<path.length;i++){const previous=path[i-1],k=path[i],x=k%MAPW,y=Math.floor(k/MAPW);length+=Math.hypot(x-previous%MAPW,y-Math.floor(previous/MAPW));if(length>POWER_POLE_SPAN+.001)break;const old=powerPoleAt(x,y)?.type==='kabelmast';if(Math.hypot(x-origin.x,y-origin.y)<=POWER_POLE_SPAN&&(old||powerPoleGeometry(x,y).ok))best=i;}
  if(best<0)return {ok:false,why:'Im Leitungsverlauf fehlt ein freier Maststandort.',path,allSites,sites};
  const k=path[best],site={x:k%MAPW,y:Math.floor(k/MAPW),existing:powerPoleAt(k%MAPW,Math.floor(k/MAPW))?.type==='kabelmast'};allSites.push(site);if(!site.existing)sites.push(site);cursor=best;
 }
 const cost=Object.fromEntries(Object.entries(B.kabelmast.cost).map(([g,n])=>[g,n*sites.length]));return {ok:true,path,sites,allSites,cost};
}
function commitPowerLine(plan){
 if(plan.island!==activeIsland||!powerLineEnabled())return {ok:false,why:'Die Bauauswahl hat sich geändert.'};
 const target=powerLineTargets(plan.start,plan.end);if(!target.ok)return target;
 const oldMode=UI.planningMode,planned=oldMode||!canAfford(target.cost),created=[],stock={...G.stock},gold=G.gold;
 UI.planningMode=planned;
 try{for(const site of target.sites){const r=place('kabelmast',site.x,site.y);if(!r.ok)throw Error(r.why||'Maststandort ist nicht mehr verfügbar.');created.push(r);}}
 catch(error){for(const r of created.reverse())if(r.planned)removeBuildingPlan(r.b);else removeBld(r.b,false);Object.assign(G.stock,stock);G.gold=gold;rebuildNet();return {ok:false,why:error.message};}
 finally{UI.planningMode=oldMode;}
 rebuildNet();saveGame();renderTop(true);renderBar();return {ok:true,built:planned?0:created.length,planned:planned?created.length:0};
}
const poleBeginPlan=beginConstructionPlan;beginConstructionPlan=function(t){if(UI.tool!=='build'||!powerLineEnabled())return poleBeginPlan(t);constructionPlan={tool:'power-line',start:{...t},end:null,island:activeIsland};updateConstructionPlan(t);};
const poleUpdatePlan=updateConstructionPlan;updateConstructionPlan=function(t){const p=constructionPlan;if(p?.tool!=='power-line')return poleUpdatePlan(t);if(p.end?.x===t.x&&p.end?.y===t.y)return;p.end={...t};p.poles=powerLineTargets(p.start,t);updateHint();};
const poleFinishPlan=finishConstructionPlan;finishConstructionPlan=function(){const p=constructionPlan;if(p?.tool!=='power-line')return poleFinishPlan();constructionPlan=null;const r=commitPowerLine(p);UI.paintFail=r.ok?'':r.why;if(!r.ok)msg(r.why,'i_alert');updateHint();return r;};
const poleHint=updateHint;updateHint=function(...args){const p=constructionPlan;if(p?.tool==='power-line')constructionPlan=null;try{poleHint(...args);}finally{if(p?.tool==='power-line')constructionPlan=p;}if(UI.tool!=='build'||!powerLineEnabled())return;const hint=$('#hint');hint.classList.add('show');hint.textContent=p?.tool==='power-line'?(p.poles.ok?p.poles.sites.length+' Masten · '+Object.entries(p.poles.cost).map(([g,n])=>n+' '+(GN[g]?.n||g)).join(' · ')+(UI.planningMode||!canAfford(p.poles.cost)?' · als Bauplan':'')+' · Loslassen zum Verlegen.':p.poles.why):'Kabelmasten · An markiertem Startplatz oder bestehendem Mast ziehen · Kein Straßenanschluss nötig.';};
let poleSlotCache=null;
function visiblePowerStartSlots(){const signature=G.blds.length+':'+(G.buildingPlans?.length||0)+':'+G.nid+':'+Math.floor(performance.now()/200);if(poleSlotCache?.g===G&&poleSlotCache.signature===signature)return poleSlotCache.slots;const slots=[...G.blds,...(G.buildingPlans||[])].filter(b=>['dampfkraftwerk','kabelstation'].includes(b.type)).flatMap(powerRootSlots);poleSlotCache={g:G,signature,slots};return slots;}
const poleGhost=drawGhost;drawGhost=function(ctx,...args){
 if(UI.tool!=='build'||!powerLineEnabled())return poleGhost(ctx,...args);
 const p=constructionPlan,route=p?.tool==='power-line'?p.poles:null;
 if(!route)poleGhost(ctx,...args);else{UI.gr={ok:route.ok,why:route.why};UI.gpos=null;placementFeedback.hidden=true;}
 const bounds=visibleWorldBounds();ctx.save();ctx.lineWidth=2/UI.sc;
 for(const slot of visiblePowerStartSlots()){if(slot.x*16>bounds.b.x||slot.y*16>bounds.b.y||(slot.x+1)*16<bounds.a.x||(slot.y+1)*16<bounds.a.y)continue;ctx.fillStyle='rgba(239,200,104,.22)';ctx.strokeStyle='#f0cf82';ctx.fillRect(slot.x*16,slot.y*16,16,16);ctx.strokeRect(slot.x*16+.5,slot.y*16+.5,15,15);}
 if(route){ctx.strokeStyle=route.ok?'#8dccff':'#ef9b85';ctx.setLineDash([5/UI.sc,4/UI.sc]);const points=route.allSites||[];if(points.length&&!window.PowerCablePreview?.drawRoute(ctx,points,route.ok)){ctx.beginPath();points.forEach((s,i)=>{const x=(s.x+.5)*16,y=(s.y+.5)*16-16;if(!i)ctx.moveTo(x,y);else{const a=points[i-1],xx=(a.x+.5)*16,yy=(a.y+.5)*16-16;ctx.quadraticCurveTo((xx+x)/2,(yy+y)/2+5,x,y);}});ctx.stroke();}ctx.setLineDash([]);for(const site of route.sites||[]){const b=placementPreviewBuilding('kabelmast',site.x,site.y),name=placementPreviewSprite(b),sprite=SP[name],m=SPB[name];ctx.globalAlpha=.6;if(sprite)ctx.drawImage(sprite,(site.x+.5)*16-sprite.width/2,(site.y+1)*16-m.H);ctx.globalAlpha=1;ctx.fillStyle=route.ok?'rgba(100,190,240,.3)':'rgba(235,70,50,.3)';ctx.fillRect(site.x*16,site.y*16,16,16);ctx.strokeRect(site.x*16+.5,site.y*16+.5,15,15);}}
 ctx.restore();
};
const poleBubble=bubbleFor;bubbleFor=function(b,...args){return b.type==='kabelmast'&&b.fire<=0?null:poleBubble(b,...args);};
const poleWindowStatus=buildingWindowStatus;buildingWindowStatus=function(b){return b.type==='kabelmast'?{text:b.fire>0?'In Flammen':b.paused?'Pausiert':b.powered?'Leitet Strom':'Keine Stromverbindung',error:b.fire>0||!b.paused&&!b.powered}:poleWindowStatus(b);};
