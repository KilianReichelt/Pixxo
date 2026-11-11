/* One persistent desktop dock: tabs, compact tools, selectable motifs and chain. */
const dockLegacyTool=setTool;
function ensureBuildDock(){
 const bar=$('#bar');if(bar.querySelector('.dock-content'))return bar;
 const items=$('#items');bar.replaceChildren();bar.className='integrated-dock';
 bar.innerHTML='<div class="dock-tabs" role="tablist" aria-label="Bauleiste"><button type="button" role="tab" data-dock-tab="build">Gebäude</button><button type="button" role="tab" data-dock-tab="fleet">Schiffe</button><button type="button" role="tab" data-dock-tab="deko">Deko</button></div><div class="dock-toolbar"><div class="dock-tools" role="group" aria-label="Werkzeuge"></div><label class="building-search"><span class="sr-only">Gebäude oder Produkte suchen</span><input id="building-search" type="search" placeholder="Suchen" autocomplete="off"></label></div><div class="dock-content" role="tabpanel" id="dock-content"></div><div class="dock-filters"></div>';
 bar.querySelector('.dock-content').append(items);document.body.append(productionPreview);document.getElementById('population-filters')?.remove();
 $('#barToggle').hidden=true;if(typeof dekoToggle!=='undefined')dekoToggle.hidden=true;
 return bar;
}
function dockMode(){return ['fleet','deko'].includes(UI.barMode)?UI.barMode:'build';}
function renderDockTools(){const tools=$('#bar .dock-tools'),list=[['road','i_stoneroad','Straßen'],['upgrade','i_upgrade','Ausbauen'],['relocate','i_cursor_move','Verschieben und Mehrfachauswahl'],['demo','i_demo','Abriss']];const html=list.map(([tool,icon,name])=>'<button type="button" class="dock-tool '+(UI.tool===tool?'on':'')+'" data-dock-tool="'+tool+'" '+(tool==='relocate'?'data-management-move':'')+' aria-label="'+name+'" title="'+name+'" aria-pressed="'+(UI.tool===tool)+'">'+ic(icon,1.5)+'</button>').join('');if(tools._last!==html){tools._last=html;tools.innerHTML=html;}}
function dockEntries(tier=UI.populationFilter||1){
 const mode=dockMode();if(mode==='fleet')return WORLD.fleet.map(sh=>({id:'ship:'+sh.id,ship:sh, name:sh.name||SHIPS[sh.type].n}));
 if(mode==='deko'){const group=UI.dockDekoGroup||DEKO_GROUPS[0].id;return Object.entries(B).filter(([type,d])=>d.kind==='decor'&&d.cat==='deko_'+group).map(([type,d])=>({id:type,type,name:d.n}));}
 const direct=Object.entries(B).filter(([type,d])=>type!=='kontor'&&!d.retired&&!['prod','field','decor','ruin'].includes(d.kind)&&buildingRelevant(type)&&buildingPopulationTier(type)===tier).map(([type,d])=>({id:type,type,name:d.n}));
 const products=constructionProducts().filter(p=>p.good!=='holz'&&buildingPopulationTier(p.type)===tier).map(p=>({id:'product:'+p.good,...p,name:GN[p.good].n}));const road=tier===1?{id:'road:path',roadMode:'path',name:'Weg'}:tier===2?{id:'road:stone',roadMode:'stone',name:'Straße'}:null;return [...(road?[road]:[]),...direct,...products];
}
function dockCard(entry){
 if(entry.roadMode)return '<button type="button" class="bi dock-card '+(UI.tool==='road'&&UI.roadMode===entry.roadMode?'on':'')+'" data-dock-road="'+entry.roadMode+'" aria-label="'+entry.name+' bauen">'+ic(entry.roadMode==='stone'?'i_stoneroad':'i_road',2)+'<b>'+entry.name+'</b></button>';
 if(entry.ship){const sh=entry.ship,[icon,status]=shipActivity(sh);return '<button type="button" class="bi dock-card dock-ship '+(UI.selectedShip===sh.id?'on':'')+'" data-select-ship="'+sh.id+'" aria-label="'+attr(entry.name+': '+status)+'"><span class="shipthumb">'+ic('i_ship',2)+'<span class="activity">'+ic(icon,1)+'</span></span><b>'+esc(entry.name)+'</b></button>';}
 const d=B[entry.type],selected=UI.tool==='build'&&UI.type===entry.type,multiple=!!entry.good&&productionHasMultipleNodes(entry.good),label=entry.good?entry.name+(multiple?' · Produktionskette öffnen':' bauen'):entry.name,blocked=!entry.good&&!unlocked(entry.type);
 return '<button type="button" class="bi dock-card '+(entry.good?'product-card ':'')+(selected?'on ':'')+(blocked?'lock':'')+'" data-b="'+entry.type+'" '+(entry.good?'data-product="'+entry.good+'"':'')+' aria-label="'+attr(label)+'" '+(blocked?'disabled':'')+'>'+ (entry.good?ic(entry.good,2):'<img class="px" src="'+url(typeSprite(entry.type))+'" alt="">')+'<b>'+esc(entry.name)+'</b>'+(multiple?'<span class="production-chain-marker" aria-hidden="true">+</span>':'')+'</button>';
}
function renderDockFilters(){
 const bar=ensureBuildDock(),host=bar.querySelector('.dock-filters'),mode=dockMode();let filter=$('#population-filters');if(!filter){filter=document.createElement('div');filter.id='population-filters';host.append(filter);}else if(filter.parentElement!==host)host.append(filter);
 let html='';if(mode==='build')html=TIERS.filter(t=>t&&t.id<=(WORLD?.highestTier||1)).map(t=>'<button type="button" data-population-filter="'+t.id+'" aria-pressed="'+(t.id===(UI.populationFilter||1))+'">'+ic(t.icon,1)+' '+t.n+'</button>').join('');
 if(mode==='deko')html=DEKO_GROUPS.map(g=>'<button type="button" data-dock-deko="'+g.id+'" aria-pressed="'+(g.id===(UI.dockDekoGroup||DEKO_GROUPS[0].id))+'">'+g.n+'</button>').join('');
 if(filter._last!==html){filter._last=html;filter.innerHTML=html;}host.hidden=!html||UI.dockCollapsed;
}
/* Keep buttons alive across renders, including tooltip/ARIA mutations by UI helpers. */
let dockPointerPress=null,dockItemsPending=false;
function reconcileDockCards(track,entries,mode){
 const existing=new Map([...track.children].map(el=>[el.dataset.dockEntry,el]));
 const cards=entries.length?entries:[{id:'empty',empty:true}],keep=new Set();
 for(let i=0;i<cards.length;i++){
  const entry=cards[i],key=mode+':'+entry.id,html=entry.empty?'<p class="dock-empty">'+(mode==='fleet'?'Noch keine Schiffe vorhanden.':'Keine passenden Einträge.')+'</p>':dockCard(entry);
  let card=existing.get(key);if(!card){const template=document.createElement('template');template.innerHTML=html;card=template.content.firstElementChild;card.dataset.dockEntry=key;card._dockCardHTML=html;card._dockChildren=card.innerHTML;}
  else if(card._dockCardHTML!==html){
   const template=document.createElement('template');template.innerHTML=html;const next=template.content.firstElementChild;
   for(const attr of [...card.attributes])if(attr.name!=='data-dock-entry'&&attr.name!=='aria-details'&&!next.hasAttribute(attr.name))card.removeAttribute(attr.name);
   for(const attr of next.attributes)if(card.getAttribute(attr.name)!==attr.value)card.setAttribute(attr.name,attr.value);
   if(card._dockChildren!==next.innerHTML){card.replaceChildren(...next.childNodes);card._dockChildren=card.innerHTML;}card._dockCardHTML=html;
  }
  keep.add(card);if(track.children[i]!==card)track.insertBefore(card,track.children[i]||null);
 }
 for(const card of [...track.children])if(!keep.has(card))card.remove();
}
renderItems=function(){
 if(dockPointerPress||itemDrag){dockItemsPending=true;return;}dockItemsPending=false;
 const bar=ensureBuildDock(),box=$('#items'),mode=dockMode();if(UI.cat)UI.dockCollapsed=false;
 if(UI.dockCollapsed){box.classList.remove('show');document.body.classList.remove('items');bar.querySelector('.dock-content').hidden=true;bar.querySelector('.dock-filters').hidden=true;return;}
 bar.querySelector('.dock-content').hidden=false;
 const query=(UI.buildingSearch||'').trim().toLocaleLowerCase('de');let entries=dockEntries();if(query&&mode==='build'&&UI.cat!=='roads'&&!entries.some(e=>[e.name,e.type&&B[e.type]?.n,...(e.good?chainBuildings(e.good).map(t=>B[t].n):[])].join(' ').toLocaleLowerCase('de').includes(query))){for(const t of TIERS.filter(t=>t&&t.id<=(WORLD?.highestTier||1))){const candidates=dockEntries(t.id);if(candidates.some(e=>[e.name,e.type&&B[e.type]?.n,...(e.good?chainBuildings(e.good).map(t=>B[t].n):[])].join(' ').toLocaleLowerCase('de').includes(query))){UI.populationFilter=t.id;entries=candidates;break;}}}if(query)entries=entries.filter(e=>[e.name,e.type&&B[e.type]?.n,...(e.good?chainBuildings(e.good).map(t=>B[t].n):[])].join(' ').toLocaleLowerCase('de').includes(query));
 entries.sort((a,b)=>Number(!!a.type&&!unlocked(a.type))-Number(!!b.type&&!unlocked(b.type)));
 let viewport=box.querySelector('.items-viewport'),track=viewport?.querySelector('.items-track');
 if(!viewport||!track){box.innerHTML='<button type="button" class="item-scroll" data-item-scroll="left" aria-label="Vorherige Einträge" hidden>←</button><div id="items-viewport" class="items-viewport" tabindex="0"><div class="items-track"></div></div><button type="button" class="item-scroll" data-item-scroll="right" aria-label="Weitere Einträge" hidden>→</button>';viewport=box.querySelector('.items-viewport');track=viewport.querySelector('.items-track');}
 const label=mode==='fleet'?'Schiffe':mode==='deko'?'Dekorationen':'Gebäude und Produktionsketten';if(viewport.getAttribute('aria-label')!==label)viewport.setAttribute('aria-label',label);
 const scroll=viewport.scrollLeft;reconcileDockCards(track,entries,mode);viewport.scrollLeft=scroll;
 box.classList.add('show');document.body.classList.add('items');renderDockFilters();updateItemNavigation();updateDockSize();
};
renderBar=function(){
 const bar=ensureBuildDock(),mode=dockMode();bar.dataset.mode=mode;
 for(const tab of bar.querySelectorAll('[data-dock-tab]')){const selected=tab.dataset.dockTab===mode;tab.setAttribute('aria-selected',selected);tab.setAttribute('aria-controls','dock-content');tab.tabIndex=selected?0:-1;}
 renderDockTools();const search=$('#building-search');search.value=UI.buildingSearch||'';search.parentElement.hidden=mode==='fleet'||UI.dockCollapsed;
 renderItems();updateDockSize();
};
function updateDockSize(){const bar=$('#bar');if(dockMode()!=='fleet'&&!bar.querySelector('.dock-content[hidden]')){const height=Math.max(140,bar.offsetHeight,UI.dockExpandedHeight||0);if(height!==UI.dockExpandedHeight){UI.dockExpandedHeight=height;bar.style.setProperty('--dock-expanded-height',height+'px');}}document.documentElement.style.setProperty('--dock-height',bar.offsetHeight+'px');document.documentElement.style.setProperty('--barH',bar.offsetHeight+'px');const dockRect=bar.getBoundingClientRect();controlsHint.style.bottom=(innerHeight-dockRect.top-dockRect.height/2)+'px';if(!productionPreview.hidden)positionProductionPreview();}
setTool=function(t,...args){if(t)UI.dockCollapsed=false;const r=dockLegacyTool(t,...args);if(t==='road'){UI.cat='roh';renderBar();}return r;};
function switchDockTab(mode){setTool(null);UI.barMode=mode;UI.cat=mode==='build'?'roh':null;UI.buildingSearch='';UI.dockCollapsed=false;hideProductionPreview(true);renderBar();}
$('#bar').addEventListener('click',e=>{
 const tab=e.target.closest('[data-dock-tab]');if(tab){e.preventDefault();e.stopImmediatePropagation();switchDockTab(tab.dataset.dockTab);return;}
 const tool=e.target.closest('[data-dock-tool]');if(tool){e.stopImmediatePropagation();const t=tool.dataset.dockTool;UI.barMode='build';if(t==='road'){const cancel=UI.tool==='road'&&UI.roadMode==='stone';UI.roadMode='stone';setTool(cancel?null:'road');}else setTool(UI.tool===t?null:t);renderBar();return;}
 const road=e.target.closest('[data-dock-road]');if(road){e.stopImmediatePropagation();UI.roadMode=road.dataset.dockRoad;setTool('road');return;}
 const deko=e.target.closest('[data-dock-deko]');if(deko){e.stopImmediatePropagation();UI.dockDekoGroup=deko.dataset.dockDeko;renderItems();return;}
},true);
$('#bar').addEventListener('keydown',e=>{const tab=e.target.closest('[data-dock-tab]');if(!tab||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const tabs=[...$('#bar').querySelectorAll('[data-dock-tab]')],i=tabs.indexOf(tab),next=e.key==='Home'?0:e.key==='End'?2:(i+(e.key==='ArrowRight'?1:2))%3;switchDockTab(tabs[next].dataset.dockTab);tabs[next].focus();});
$('#bar').addEventListener('input',e=>{if(e.target.id!=='building-search')return;UI.buildingSearch=e.target.value;renderItems();});
$('#items').addEventListener('click',e=>{const ship=e.target.closest('[data-select-ship]');if(ship){e.stopImmediatePropagation();selectShip(Number(ship.dataset.selectShip));renderBar();}},true);
positionProductionPreview=function(){
 if(productionPreview.hidden)return;const bar=ensureBuildDock(),card=productionPreviewCard?.isConnected?productionPreviewCard:null,anchor=(card||bar).getBoundingClientRect(),gap=52;
 productionPreview.style.maxWidth=productionPreview.classList.contains('flavor-production')?Math.min(340,innerWidth-32)+'px':productionPreview.classList.contains('single-production-node')?'none':Math.min(700,innerWidth-32)+'px';productionPreview.style.maxHeight=Math.max(100,anchor.top-gap-16)+'px';
 const size=productionPreview.getBoundingClientRect();productionPreview.style.left=Math.max(16,Math.min(anchor.left+(anchor.width-size.width)/2,innerWidth-size.width-16))+'px';productionPreview.style.top=Math.max(16,anchor.top-size.height-gap)+'px';
};
const dockOpenChain=openProductChain;openProductChain=function(...args){UI.barMode='build';UI.dockCollapsed=false;const r=dockOpenChain(...args);renderDockFilters();updateDockSize();return r;};
const dockHideChain=hideProductionPreview;hideProductionPreview=function(...args){const r=dockHideChain(...args);if($('#bar .dock-content'))updateDockSize();return r;};
let dockSizeFrame=0;new ResizeObserver(()=>{if(!dockSizeFrame)dockSizeFrame=requestAnimationFrame(()=>{dockSizeFrame=0;updateDockSize();});}).observe($('#bar'));

const dockRoadHint=updateHint;updateHint=function(){dockRoadHint();if(UI.tool==='road'){const h=$('#hint');h.innerHTML=h.innerHTML.replace(/<b>(?:Weg|Straße)<\/b>/,'<b>'+((UI.roadMode||'path')==='stone'?'Straße':'Weg')+'</b>');if(!h.querySelector('.automatic-bridge-note'))h.insertAdjacentHTML('beforeend','<span class="automatic-bridge-note"> · Brücken entstehen automatisch über Flüsse.</span>');}};

/* Successful placement may clear the tool (e.g. a Kontor), but keeps the dock open. */
const dockPlacementClick=clickTile;clickTile=function(...args){const placing=UI.tool==='build',count=G.blds.length,mode=dockMode();const r=dockPlacementClick(...args);if(placing&&G.blds.length>count){UI.barMode=mode;UI.dockCollapsed=false;renderBar();}return r;};

/* A separate building window follows the hovered recipe node. */
const productionBuildingPreview=document.createElement('aside');productionBuildingPreview.id='production-building-preview';productionBuildingPreview.className='win';productionBuildingPreview.hidden=true;productionBuildingPreview.setAttribute('role','region');productionBuildingPreview.setAttribute('aria-label','Gebäudevorschau');document.body.append(productionBuildingPreview);
let productionBuildingNode=null,productionBuildingHideTimer;
function hideProductionBuilding(){clearTimeout(productionBuildingHideTimer);productionBuildingNode?.removeAttribute('aria-details');productionBuildingNode=null;productionBuildingPreview.hidden=true;}
function positionProductionBuilding(){
 if(productionBuildingPreview.hidden)return;const owner=productionBuildingNode?.closest('#production-overview,.win');if(!owner||owner.hidden||!productionBuildingNode?.isConnected){hideProductionBuilding();return;}
 const a=owner.getBoundingClientRect();productionBuildingPreview.style.maxHeight=Math.max(160,innerHeight-32)+'px';
 const b=productionBuildingPreview.getBoundingClientRect(),right=a.right+12,left=a.left-b.width-12;
 productionBuildingPreview.style.left=Math.max(16,Math.min(right+b.width<=innerWidth-16?right:left,innerWidth-b.width-16))+'px';
 productionBuildingPreview.style.top=Math.max(16,Math.min(a.top,innerHeight-b.height-16))+'px';
}
function showProductionBuilding(node){
 const type=node?.dataset.building||productionProducer(node?.dataset.good),d=B[type]&&def({type,island:activeIsland,serviceLevel:1});if(!d)return;clearTimeout(productionBuildingHideTimer);productionBuildingNode?.removeAttribute('aria-details');productionBuildingNode=node;node.setAttribute('aria-details','production-building-preview');
 const size=buildingSize(type,0),rule=FIELD_RULES[type],recipe=items=>Object.entries(items||{}).map(([g,n])=>'<span class="preview-good">'+ic(g,1)+' '+n+' '+esc(GN[g]?.n||g)+'</span>').join('')||'Keine';
 const data=[['Grundfläche',size.w+' × '+size.h+' Kacheln'],['Unterhalt',d.upk+' Gold / Min.'],['Arbeitskräfte',d.workforce?d.workforce.count+' '+esc(TIERS[d.workforce.tier].n):'Keine'],['Produktionszyklus',d.cycle+' Sekunden'],['Eingang',recipe(d.in)],['Ausgang',recipe(d.out)]];
 if(d.transportRange)data.push(['Transport','Bis zu '+d.transportRange+' Straßenkacheln']);
 if(rule)data.push(['Betriebsflächen',rule.count+' '+esc(B[rule.type].n)+' · Radius '+fieldPlacementRadius({type})+' Kacheln']);
 if(d.fertility)data.push(['Fruchtbarkeit',esc(GN[d.fertility]?.n||d.fertility)+' · '+(islandMeta().fert.includes(d.fertility)?'auf dieser Insel vorhanden':'wächst auf dieser Insel nicht')]);
 if(d.env)data.push(['Umgebung',esc(d.d||'Natürliche Ressourcen im Wirkungsbereich erforderlich.')]);
 const sprite=placementPreviewSprite(placementPreviewBuilding(type,0,0));
 productionBuildingPreview.dataset.building=type;productionBuildingPreview.innerHTML='<div class="preview-building-header">'+(sprite?'<img class="px preview-building-sprite" src="'+url(sprite)+'" alt="">':'<span>Vorschau wird geladen</span>')+'<div><strong>'+esc(d.n)+'</strong><p>'+esc(d.d||'')+'</p><p class="preview-island-count">'+G.blds.filter(b=>b.type===type).length+' auf Insel</p></div></div><h3>Baukosten</h3><div class="preview-building-cost">'+costHTML(d.cost)+'</div>'+(!unlocked(type)?'<p class="bad">'+esc(buildingUnlockText(type))+'</p>':'')+'<dl>'+data.map(([label,value])=>'<div><dt>'+label+'</dt><dd>'+value+'</dd></div>').join('')+'</dl>';
 for(const img of productionBuildingPreview.querySelectorAll('img.px')){const good=goodsImageKey(img);if(good)img.dataset.gameTooltip=GN[good].n;}
 productionBuildingPreview.hidden=false;positionProductionBuilding();
}
function deferProductionBuildingHide(){clearTimeout(productionBuildingHideTimer);productionBuildingHideTimer=setTimeout(()=>{if(!productionBuildingPreview.matches(':hover')&&!productionBuildingNode?.matches(':hover,:focus'))hideProductionBuilding();},180);}
productionPreview.addEventListener('pointerover',e=>{const node=e.target.closest('.production-node');if(node)showProductionBuilding(node);});
productionPreview.addEventListener('pointerout',e=>{if(e.target.closest('.production-node')&&!e.target.closest('.production-node').contains(e.relatedTarget))deferProductionBuildingHide();});
productionPreview.addEventListener('focusin',e=>{const node=e.target.closest('.production-node');if(node)showProductionBuilding(node);});
productionPreview.addEventListener('focusout',deferProductionBuildingHide);
productionBuildingPreview.addEventListener('pointerenter',()=>clearTimeout(productionBuildingHideTimer));productionBuildingPreview.addEventListener('pointerleave',deferProductionBuildingHide);
const buildingHideChain=hideProductionPreview;hideProductionPreview=function(...args){const r=buildingHideChain(...args);if(productionPreview.hidden)hideProductionBuilding();return r;};
const buildingPositionChain=positionProductionPreview;positionProductionPreview=function(...args){const r=buildingPositionChain(...args);positionProductionBuilding();return r;};

/* Release after the native click, rather than rebuilding between pointerdown and click. */
$('#items').addEventListener('pointerdown',e=>{if(e.button===0&&e.isPrimary)dockPointerPress=e.pointerId;},true);
function releaseDockPointer(e){if(dockPointerPress!==e.pointerId)return;requestAnimationFrame(()=>{if(dockPointerPress!==e.pointerId)return;dockPointerPress=null;if(dockItemsPending)renderItems();});}
addEventListener('pointerup',releaseDockPointer,true);addEventListener('pointercancel',releaseDockPointer,true);
addEventListener('blur',()=>{dockPointerPress=null;if(itemDrag){itemDrag.viewport.classList.remove('is-dragging');itemDrag=null;itemDragClick=false;}if(dockItemsPending)renderItems();});

$('#items').addEventListener('scroll',()=>{if(!productionPreview.hidden)positionProductionPreview();},true);
