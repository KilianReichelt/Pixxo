/* Desktop-UI: stabile Gruppen, aktuelle Warenpins und klare Bauanschlüsse. */
function updateTopGroups(){
 const top=$('#top');if(!top||!WORLD)return;
 if(!top.querySelector('.top-economy')){
  const group=(name,nodes)=>{const el=document.createElement('div');el.className='top-group '+name;for(const node of nodes)if(node)el.append(node);top.append(el);return el;};
  group('top-economy',[top.querySelector('.gold'),top.querySelector('.pop')]);
  group('top-location',[top.querySelector('.worldname')]);
  const goods=top.querySelector('#goodsbar');if(goods)goods.classList.add('top-group','top-goods');
  const speed=top.querySelector('.speeds');if(speed)speed.classList.add('top-group','top-speed');
  group('top-navigation',[...top.querySelectorAll(':scope>.navbtn:not(.worldname)')]);
  const knowledge=top.querySelector('.knowledge');if(knowledge)group('top-knowledge',[knowledge]);
 }
 const view=UI.viewedIsland??activeIsland,identity=WORLD.islands[view]?identityForIsland(view):null,name=top.querySelector('.worldname');
 if(name){const stage=cityState(WORLD.islands[view]||G).level,level=CITY_LEVELS[Math.max(0,stage-1)];name.dataset.gameTooltip=typeof sessionCityProgressHint==='function'?sessionCityProgressHint(WORLD.islands[view]||G):'';const html='<span class="island-location-line"><span class="island-name">'+esc(islandName(view))+'</span><b class="island-city-stage">'+esc(level?.name||'Gründung')+'</b></span><span class="island-owner-line">'+(identity?ic(identity.portrait,1)+'<span>'+esc(identity.name)+'</span>':'Unbesiedelt')+'</span>';if(name._identityHTML!==html){name.innerHTML=html;name._identityHTML=html;}}
 const old=document.getElementById('island-owner-identity');if(old){old.hidden=true;if(old.childNodes.length)old.replaceChildren();}
 positionIslandFactsAtMinimap();document.documentElement.style.setProperty('--topH',top.offsetHeight+'px');
}
const desktopRenderTop=renderTop;renderTop=function(...args){const result=desktopRenderTop(...args);updateTopGroups();return result;};
// Owner identity now belongs to the island-name button, never to the minimap.
positionIslandOwnerIdentity=function(){islandOwnerIdentity.hidden=true;};
const desktopIslandFacts=renderIslandFacts;renderIslandFacts=function(...args){const result=desktopIslandFacts(...args);islandOwnerIdentity.hidden=true;positionIslandFactsAtMinimap();return result;};
function positionIslandFactsAtMinimap(){const facts=$('#islandfacts'),map=$('#mmw');if(!facts||!map)return;const rect=map.getBoundingClientRect();facts.style.right=(innerWidth-rect.right)+'px';facts.style.width=rect.width+'px';facts.style.bottom=(innerHeight-rect.top)+'px';}
new ResizeObserver(()=>requestAnimationFrame(positionIslandFactsAtMinimap)).observe($('#mmw'));addEventListener('resize',positionIslandFactsAtMinimap);

function pinsGoodIcon(id){return '<img class="px ic" src="'+url(id)+'" style="width:24px;height:24px" alt="">';}
function pinsFiltersHTML(){return '<div class="store-filters pins-filters" role="group" aria-label="Waren filtern">'+STORE_FILTERS.map(([id,name])=>'<button type="button" class="btn '+((UI.pinsFilter||'all')===id?'primary':'')+'" data-act="pins-filter" data-filter="'+id+'" aria-pressed="'+((UI.pinsFilter||'all')===id)+'">'+name+'</button>').join('')+'</div>';}
pinsHTML=function(){const filter=UI.pinsFilter||'all',goods=GOODS.filter(g=>goodVisibleInStore(g.id)&&(filter==='all'||STORE_GOOD_CATEGORIES.get(g.id)===filter));return pinsFiltersHTML()+'<p class="pins-count">'+WORLD.pins.length+' / 6 Ressourcen angeheftet</p><div class="pinlist">'+goods.map(g=>{const on=WORLD.pins.includes(g.id);return '<button type="button" class="btn '+(on?'on':'')+'" aria-pressed="'+on+'" '+(WORLD.pins.length>=6&&!on?'disabled':'')+' data-act="pin" data-g="'+g.id+'">'+pinsGoodIcon(g.id)+'<span>'+esc(g.n)+'</span><span class="pin-state">'+(on?'✓':'＋')+'</span></button>';}).join('')+'</div>';};
function refreshPinsNow(focus){const win=WINS.pins;if(!win)return;const scroll=win.body.scrollTop;if(win.body.contains(document.activeElement))document.activeElement.blur();win.hold=false;refreshWin(win);win.body.scrollTop=scroll;if(focus)win.body.querySelector(focus)?.focus({preventScroll:true});}
const desktopWinAct=winAct;winAct=function(id,ds){
 if(id==='pins'&&ds.act==='pins-filter'){if(!STORE_FILTERS.some(([key])=>key===ds.filter))return;UI.pinsFilter=ds.filter;refreshPinsNow('[data-filter="'+ds.filter+'"]');return;}
 const result=desktopWinAct(id,ds);if(ds.act==='pin')refreshPinsNow('[data-g="'+ds.g+'"]');return result;
};

function savedSlotSummary(data){const islands=(data.islands||[]).filter(g=>g&&!g.cpu),buildings=islands.flatMap(g=>g.blds||[]),tiers=[0,0,0,0,0];for(const b of buildings)if(b.type==='haus')tiers[b.tier]=(tiers[b.tier]||0)+(b.pop||0);const pop=Math.floor(tiers.reduce((a,b)=>a+b,0));let stage=data.cityProgress?.level;if(stage==null){stage=0;const stats={pop,tiers,islands:islands.length,started:buildings.some(b=>b.type!=='kontor'&&B[b.type]?.kind!=='field')};for(const level of CITY_LEVELS)if(cityLevelSatisfied(level.id,stats))stage=level.id;}return {islands,buildings,pop,status:CITY_LEVELS[stage-1]?.name||'Gründung'};}
function saveSlotCardHTML(data,i){
 if(!data)return '<span class="save-slot-number">Speicherplatz '+i+'</span><strong>Freier Speicherplatz</strong><span class="save-slot-meta">'+(slotMode==='load'?'Noch keine Partie gespeichert':'Eine neue Geschichte beginnen')+'</span>';
 const summary=savedSlotSummary(data),identity=data.identities?.player||{name:'Du',portrait:PLAYER_PORTRAITS[0],color:PLAYER_COLORS[0]},minutes=Math.floor((data.time||0)/60),duration=minutes>=60?Math.floor(minutes/60)+' Std. '+minutes%60+' Min.':minutes+' Min.',island=data.islandNames?.[data.active]||'';
 return '<span class="save-slot-number">Speicherplatz '+i+'</span><span class="save-slot-main"><span class="save-slot-portrait" style="--owner-color:'+attr(identity.color||PLAYER_COLORS[0])+'">'+ic(identity.portrait||PLAYER_PORTRAITS[0],3)+'</span><span class="save-slot-player"><strong>'+esc(identity.name||'Du')+'</strong><span class="save-slot-status">'+esc(summary.status)+'</span>'+(island?'<span>'+esc(island)+'</span>':'')+'</span></span><span class="save-slot-stats"><span>'+summary.pop+' Einwohner</span><span>'+summary.islands.length+' '+(summary.islands.length===1?'Insel':'Inseln')+'</span><span>'+duration+' Spielzeit</span></span><span class="save-slot-meta">'+(data.savedAt?'Gespeichert: '+new Date(data.savedAt).toLocaleString('de-DE'):'Bestehende Partie')+'</span>'+(slotMode==='new'?'<span class="save-slot-overwrite">Zum Überschreiben auswählen</span>':'');
}
const desktopStartRender=startRender;startRender=function(page='home'){const result=desktopStartRender(page);if(['slots','load-slots'].includes(StartScreen.page))for(const card of startDialog.querySelectorAll('[data-slot]')){const i=Number(card.dataset.slot),data=slotData(i);card.innerHTML=saveSlotCardHTML(data,i);card.setAttribute('aria-label','Speicherplatz '+i+(data?' · '+(data.identities?.player?.name||'Du')+' · '+savedSlotSummary(data).status:' · Frei'));}return result;};

// A second click on the same pinned product toggles its chain closed.
$('#bar').addEventListener('click',e=>{const card=e.target.closest('[data-product]');if(card&&productionPinned&&!productionPreview.hidden&&productionPreviewCard?.dataset.product===card.dataset.product){e.preventDefault();e.stopImmediatePropagation();hideProductionPreview(true);}},true);
cv.addEventListener('pointerdown',()=>hideProductionPreview(true),true);

let roadConnectionCache=null;
const connectionRebuildNet=rebuildNet;rebuildNet=function(...args){if(roadConnectionCache?.game===G)roadConnectionCache=null;return connectionRebuildNet(...args);};
function roadBuildingConnectionCells(){
 const key=activeIsland+':'+G.blds.length;if(roadConnectionCache?.game===G&&roadConnectionCache.key===key)return roadConnectionCache.cells;
 const cells=new Map();for(const b of G.blds){if(B[b.type]?.kind==='field'||B[b.type]?.kind==='decor'||b.type==='ruine')continue;for(const [x,y] of ringCells(b)){if(!INMAP(x,y))continue;const k=IDX(x,y);if(!G.road[k]&&!roadTileAllowed(x,y))continue;if(!cells.has(k))cells.set(k,{x,y,buildings:[]});cells.get(k).buildings.push(b.id);}}
 roadConnectionCache={game:G,key,cells};return cells;
}
let roadPreviewPath=null,roadPreviewCells=new Set();
const connectionDrawGhost=drawGhost;drawGhost=function(ctx,...args){const result=connectionDrawGhost(ctx,...args);if(UI.tool!=='road')return result;
 const path=constructionPlan?.tool==='road'?constructionPlan.path:null;if(path!==roadPreviewPath){roadPreviewPath=path;roadPreviewCells=new Set(path||[]);}const hover=UI.hover,hoverKey=hover&&INMAP(hover.x,hover.y)?IDX(hover.x,hover.y):-1,bounds=visibleWorldBounds();ctx.save();ctx.lineWidth=1.5/UI.sc;
 for(const [k,cell] of roadBuildingConnectionCells()){const x=cell.x*16,y=cell.y*16;if(x+16<bounds.a.x||x>bounds.b.x||y+16<bounds.a.y||y>bounds.b.y)continue;const selected=roadPreviewCells.has(k)||!path&&k===hoverKey,existing=!!G.road[k];ctx.fillStyle=selected?'rgba(128,218,173,.45)':existing?'rgba(120,191,210,.2)':'rgba(239,203,133,.13)';ctx.strokeStyle=selected?'#b6f1cf':existing?'#83c5db':'#c6ae79';ctx.fillRect(x+1,y+1,14,14);ctx.setLineDash(selected||existing?[]:[2/UI.sc,2/UI.sc]);ctx.strokeRect(x+1.5,y+1.5,13,13);}
 ctx.restore();return result;
};
