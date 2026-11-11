/* Desktop construction management. Product chains stay open until explicitly closed. */
function constructionProducts(){
 const recipes=Object.entries(B).filter(([id,d])=>d.kind==='prod'&&buildingRelevant(id));
 const consumed=new Set(recipes.flatMap(([id,d])=>Object.keys(d.in||{})));
 const useful=new Set(['holz','bretter','stein','lehm','ziegel','eisen','werkzeug','glas','zement','beton','stahl','isolierte_kabel','gluehbirnen',...TIERS.filter(Boolean).flatMap(t=>[...Object.keys(t.goods||{}),...Object.keys(t.luxury||{})])]);
 return [...new Set(recipes.flatMap(([id,d])=>Object.keys(d.out||{})))].filter(g=>!consumed.has(g)||useful.has(g)).map(g=>({good:g,type:productionProducer(g)})).filter(p=>p.type);
}
const managementItems=renderItems;
renderItems=function(...args){
 if(!['roh','veredel'].includes(UI.cat)){managementItems(...args);const box=$('#items');box._productHTML=null;box.style.setProperty('--construction-filter-height',($('#population-filters')?.offsetHeight||0)+'px');return;}
 if(itemDrag)return;
 const box=$('#items'),products=constructionProducts(),highest=WORLD?.highestTier||1,tiers=[...new Set(products.map(p=>buildingPopulationTier(p.type)))].filter(t=>t<=highest).sort();
 if(!tiers.includes(UI.populationFilter))UI.populationFilter=tiers[0]||1;
 const query=(UI.buildingSearch||'').trim().toLocaleLowerCase('de');if(query){const matches=products.filter(p=>[GN[p.good].n,B[p.type].n,...chainBuildings(p.good).map(t=>B[t].n)].join(' ').toLocaleLowerCase('de').includes(query));if(matches.length&&!matches.some(p=>buildingPopulationTier(p.type)===UI.populationFilter))UI.populationFilter=buildingPopulationTier(matches[0].type);}const shown=products.filter(p=>buildingPopulationTier(p.type)===UI.populationFilter&&(!query||[GN[p.good].n,B[p.type].n,...chainBuildings(p.good).map(t=>B[t].n)].join(' ').toLocaleLowerCase('de').includes(query)));
 shown.sort((a,b)=>Number(!unlocked(a.type))-Number(!unlocked(b.type)));const html=shown.map(p=>'<button type="button" class="bi product-card" data-product="'+p.good+'" data-b="'+p.type+'" data-pop-tier="'+buildingPopulationTier(p.type)+'" aria-label="Produktionskette '+attr(GN[p.good].n)+' öffnen">'+ic(p.good,3)+'<b>'+esc(GN[p.good].n)+'</b></button>').join('')||'<p>Keine passenden Produkte.</p>';
 if(box._productHTML!==html||!box.querySelector('.items-viewport')){const scroll=box.querySelector('.items-viewport')?.scrollLeft||0;box._productHTML=html;box._last=null;box.innerHTML='<button type="button" class="item-scroll" data-item-scroll="left" aria-label="Vorherige Produkte" hidden>←</button><div id="items-viewport" class="items-viewport" tabindex="0" aria-label="Produktionsketten"><div class="items-track">'+html+'</div></div><button type="button" class="item-scroll" data-item-scroll="right" aria-label="Weitere Produkte" hidden>→</button>';box.querySelector('.items-viewport').scrollLeft=scroll;}
 box.classList.add('show');document.body.classList.add('items');
 let filter=$('#population-filters');if(!filter){filter=document.createElement('div');filter.id='population-filters';box.before(filter);}
 const filterHTML=tiers.map(t=>'<button type="button" data-population-filter="'+t+'" aria-pressed="'+(t===UI.populationFilter)+'">'+ic('i_t'+t,1)+' '+TIERS[t].n+'</button>').join('')+'<div class="building-search-row"><label class="building-search">'+ic('i_houses',1)+'<input id="building-search" type="search" placeholder="Gebäudesuche" aria-label="Produkte oder Gebäude suchen" value="'+attr(UI.buildingSearch||'')+'"></label></div>';
 if(filter._last!==filterHTML){const input=filter.querySelector('input'),focused=document.activeElement===input;filter._last=filterHTML;filter.innerHTML=filterHTML;if(input){filter.querySelector('input').replaceWith(input);input.value=UI.buildingSearch||'';if(focused)input.focus({preventScroll:true});}}
 filter.style.removeProperty('left');filter.style.removeProperty('bottom');filter.style.removeProperty('max-width');box.style.setProperty('--construction-filter-height',filter.offsetHeight+'px');updateItemNavigation();
};
function chainBuildings(good,seen=new Set()){if(seen.has(good))return [];seen.add(good);const type=productionProducer(good);return type?[type,...Object.keys(B[type].in||{}).flatMap(g=>chainBuildings(g,seen))]:[];}
$('#items').addEventListener('click',e=>{const card=e.target.closest('[data-product]');if(!card)return;e.preventDefault();e.stopImmediatePropagation();openProductChain(card.dataset.product);},true);
$('#items').addEventListener('wheel',e=>{const viewport=$('#items .items-viewport');if(!viewport)return;e.preventDefault();viewport.scrollLeft+=(Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY)*(e.deltaMode===1?16:1);updateItemNavigation();},{passive:false});
const managementBar=renderBar;renderBar=function(...args){managementBar(...args);const raw=$('#bar [data-cat="roh"]'),refined=$('#bar [data-cat="veredel"]');if(raw){raw.querySelector('span').textContent='Produktion';raw.title='Produktionsketten';raw.classList.toggle('on',['roh','veredel'].includes(UI.cat));}refined?.remove();bundleConstructionTools();};
const managementTool=setTool;setTool=function(t,...args){if(!t){UI.cat=null;UI.fieldOwner=null;UI.woodWarnings=[];delete UI.moveRoad;UI.moveSelection=null;UI.moveAnchor=null;hideProductionPreview(true);}return managementTool(t,...args);};
$('#bar').addEventListener('click',e=>{const category=e.target.closest('[data-cat]');if(category&&UI.cat===category.dataset.cat&&UI.tool==='build'){e.preventDefault();e.stopImmediatePropagation();setTool(null);}},true);
function bundleConstructionTools(){const bar=$('#bar');if(!bar||bar.classList.contains('fleet-mode'))return;const buttons=[...bar.querySelectorAll('[data-tool]')];if(!buttons.length)return;let group=bar.querySelector('.construction-tools');if(!group){group=document.createElement('div');group.className='construction-tools';group.setAttribute('role','group');group.setAttribute('aria-label','Bauwerkzeuge');bar.append(group);}for(const button of buttons)group.append(button);if(!group.querySelector('[data-management-move]'))group.insertAdjacentHTML('beforeend','<button type="button" class="cb" data-management-move title="Verschieben / Mehrfachauswahl">'+ic('i_cursor_move',2)+'<span>Verschieben</span></button>');group.querySelector('[data-management-move]').classList.toggle('on',UI.tool==='relocate'||UI.tool==='move');}
$('#bar').addEventListener('click',e=>{if(e.target.closest('[data-management-move]')){UI.cat=null;setTool(UI.tool==='relocate'?null:'relocate');}});
const controlsHint=document.createElement('aside');controlsHint.id='desktop-controls';controlsHint.setAttribute('aria-label','Steuerung');
const controlSymbols={pan:'<path d="M12 2v20M2 12h20M8 6l4-4 4 4M8 18l4 4 4-4M6 8l-4 4 4 4M18 8l4 4-4 4"/>',zoom:'<circle cx="10" cy="10" r="7"/><path d="M15 15l7 7M6 10h8M10 6v8"/>',rotate:'<path d="M20 9a8 8 0 1 0 0 6M20 3v6h-6"/>',cancel:'<path d="M5 5l14 14M19 5L5 19"/><rect x="2" y="2" width="20" height="20" rx="2"/>'};
function canRotateBuildingType(type){
 if(type==='gehege')return true;
 const d=B[type],size=BUILD_SIZES[type];
 if(!d||!size||size.w===size.h||d.kind==='field'||d.place==='coast'||['mine','steinbruch','goldmine','lehmgrube','kontor','fischer'].includes(type))return false;
 return !!window.SpriteReview?.hasFootprintOrientations?.(type);
}
function buildingRotationSteps(type){return type==='deko_bank'?4:2;}
function normalizeBuildingRotation(type,rotation=0){const count=buildingRotationSteps(type);return ((Math.trunc(Number(rotation)||0)%count)+count)%count;}
function buildingRotation(type,rotation=0){return canRotateBuildingType(type)?normalizeBuildingRotation(type,rotation):0;}
// Saved reservations retain their validated geometry before review images finish loading.
function storedBuildingRotation(type,rotation,w,h){const r=normalizeBuildingRotation(type,rotation),size=buildingSize(type,r);return type==='gehege'||r&&w===size.w&&h===size.h&&w!==h?r:0;}
function heldBuildingCanRotate(){
 if(UI.tool==='build')return canRotateBuildingType(UI.type);
 if(UI.tool==='move')return canRotateBuildingType(G.byId.get(UI.moveId)?.type);
 if(UI.tool!=='relocate'||!UI.moveAnchor||UI.moveRoad!==undefined)return false;
 const selected=(UI.moveSelection||[]).map(id=>G.byId.get(id));
 return selected.length>0&&selected.every(b=>b&&canRotateBuildingType(b.type));
}
function refreshDesktopControlIcons(){
 const markup='<ul>'+[['pan','RMB','ziehen: Karte verschieben'],['zoom','Mausrad','Zoom'],['rotate','R','Drehen'],['cancel','Esc / RMB','Abbrechen']].filter(([icon])=>icon!=='rotate'||heldBuildingCanRotate()).map(([icon,key,label])=>{
  const symbol=SP['i_control_'+icon]?ic('i_control_'+icon,1):'<svg class="control-symbol" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true">'+controlSymbols[icon]+'</svg>';
  return '<li>'+symbol+'<span><kbd>'+key+'</kbd> '+label+'</span></li>';
 }).join('')+'</ul>';
 if(controlsHint._markup!==markup){controlsHint.innerHTML=markup;controlsHint._markup=markup;}
}
refreshDesktopControlIcons();document.body.append(controlsHint);
const managementHint=updateHint;updateHint=function(){refreshDesktopControlIcons();if(UI.tool==='relocate'){const h=$('#hint');h.textContent=UI.moveAnchor?'Ziel anklicken'+(heldBuildingCanRotate()?' · R: Auswahl drehen':'')+' · RMB: Abbrechen':'Gebäude oder Straßenknoten anklicken · Ziehen: Mehrfachauswahl · Umschalt: ergänzen';h.classList.add('show');return;}managementHint();};
const managementPlace=place;place=function(type,x,y){const r=managementPlace(type,x,y);if(r.ok&&UI.tool==='build'&&UI.type===type&&FIELD_RULES[type]){UI.fieldOwner=r.b.id;setTool('build',FIELD_RULES[type].type);UI.fieldOwner=r.b.id;}return r;};
const managementClick=clickTile;clickTile=function(t){const field=INMAP(t.x,t.y)?G.byId.get(G.occ[IDX(t.x,t.y)]):null;if(UI.tool==='relocate'){relocateClick(t);return;}managementClick(t);if(!UI.tool&&field?.fieldOwner)UI.fieldHighlight=field.fieldOwner;else if(!UI.tool)UI.fieldHighlight=null;};
const managementBubble=bubbleFor;bubbleFor=function(b){if(b.type==='haus'&&b.fire<=0&&b.conn)return null;return managementBubble(b);};
/* Goods use shared in-game tooltips; house goods additionally open their chain. */
function goodsImageKey(img){return img.dataset.good||GOODS.find(g=>img.getAttribute('src')===url(g.id))?.id;}
function decorateGoodsWindows(){for(const img of document.querySelectorAll('.win img.px')){if(img.closest('.locked-need'))continue;const good=goodsImageKey(img);if(!good)continue;img.dataset.good=good;img.dataset.gameTooltip=GN[good].n;img.removeAttribute('title');if(img.closest('.needgroup')&&G.byId.get(UI.sel)?.type==='haus'&&!img.closest('button')){const button=document.createElement('button');button.type='button';button.className='need-product';button.dataset.needProduct=good;button.setAttribute('aria-label',GN[good].n+': Produktionskette öffnen');img.replaceWith(button);button.append(img);}}
 const w=WINS.info,b=G.byId.get(UI.sel);if(w){w.el.classList.toggle('house-management',b?.type==='haus');if(b?.type==='haus'){normalizeHouseNeedRows(w.body);const groups=[...w.body.querySelectorAll('.needgroup')],luxury=groups.find(g=>g.querySelector('h3')?.textContent==='Luxusbedürfnisse'),last=groups.find(g=>g.querySelector('h3')?.textContent==='Zusätzliche Versorgung')||groups.find(g=>g.querySelector('h3')?.textContent==='Warenversorgung');if(luxury&&last&&last.nextElementSibling!==luxury)last.after(luxury);decorateHouseActions(w.body);}}
}
const managementRefresh=refreshWin;refreshWin=function(...args){const r=managementRefresh(...args);decorateGoodsWindows();return r;};
document.addEventListener('click',e=>{const button=e.target.closest('[data-need-product]');if(button)openProductChain(button.dataset.needProduct,true);});
positionProductionPreview=function(){if(productionPreview.hidden)return;const box=$('#items').getBoundingClientRect();productionPreview.style.maxWidth=productionPreview.classList.contains('single-production-node')?'none':Math.min(700,innerWidth-32)+'px';productionPreview.style.maxHeight=Math.max(160,box.top-90)+'px';const r=productionPreview.getBoundingClientRect();productionPreview.style.left=Math.max(16,(innerWidth-r.width)/2)+'px';productionPreview.style.top=Math.max(70,box.top-r.height-12)+'px';};

const serviceInfoHTML=infoHTML;infoHTML=function(){let html=serviceInfoHTML();const b=G.byId.get(UI.sel);if(b&&B[b.type].kind==='svc'){html=html.replace('Wirkungsradius','Straßenreichweite');html=html.replace(/(<span>Versorgte Häuser<\/span><span>)[^<]*/,(_,prefix)=>prefix+G.blds.filter(h=>h.type==='haus'&&serviceCovers(b,h)).length);}return html;};

const feedbackClickTile=clickTile;clickTile=function(t){const placing=UI.tool==='build',count=G.blds.length;const r=feedbackClickTile(t);if(placing&&G.blds.length===count&&UI.gr&&!UI.gr.ok)msg(UI.gr.why,'i_alert');return r;};

/* Keep labels and bonuses together instead of letting global grid rules split them. */
function normalizeHouseNeedRows(body){
 for(const row of body.querySelectorAll('.needgroup .nd,.needgroup p')){
  if(!row.querySelector(':scope > .need-name'))continue;
  row.classList.add('house-need-row');
  const status=row.querySelector(':scope > .good,:scope > .bad');if(status)status.classList.add('need-status');
  let icon=row.querySelector(':scope > .need-product,:scope > .ic,:scope > .need-service-icon');if(!icon&&row.closest('.needgroup')?.querySelector('h3')?.textContent==='Öffentliche Dienste'){const name=row.querySelector(':scope > .need-name').textContent,service=Object.keys(SVCN).find(k=>SVCN[k]===name),type=Object.keys(B).find(k=>B[k].svc===service);if(type){icon=document.createElement('span');icon.className='need-service-icon';icon.dataset.gameTooltip=name;icon.innerHTML=ic(SP['i_build_'+type]?'i_build_'+type:typeSprite(type),1);row.prepend(icon);}}if(icon)icon.classList.add('need-icon');
  const text=[...row.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE);
  const consumption=text.map(n=>n.textContent).join('').replace(/^[\s·]+|[\s·]+$/g,'');
  text.forEach(n=>n.remove());if(consumption){const label=document.createElement('span');label.className='need-consumption';label.textContent=consumption;row.append(label);}
 }
 const luxury=[...body.querySelectorAll('.needgroup')].find(g=>g.querySelector('h3')?.textContent==='Luxusbedürfnisse');
 if(luxury&&!luxury.querySelector('.needs')){const list=document.createElement('div');list.className='needs';for(const row of [...luxury.querySelectorAll(':scope > p')])list.append(row);luxury.append(list);}
}
const fieldProgress=document.createElement('div');fieldProgress.id='field-placement-progress';fieldProgress.hidden=true;fieldProgress.setAttribute('role','status');document.body.append(fieldProgress);
function updateFieldProgress(){
 const owner=UI.tool==='build'&&B[UI.type]?.kind==='field'?G.byId.get(UI.fieldOwner):null,rule=owner&&FIELD_RULES[owner.type];
 fieldProgress.hidden=!rule;if(!rule)return;
 const count=fieldModules(owner).length,planned=constructionPlan?.tool==='fields'?constructionPlan.fields?.valid.length||0:0;
 const text=count+' / '+rule.count+' '+B[rule.type].n+' · '+B[owner.type].n+' · Radius '+fieldPlacementRadius(owner)+' Kacheln'+(planned?' · +'+planned+' beim Loslassen':'');
 if(fieldProgress.textContent!==text)fieldProgress.textContent=text;
}
const progressHint=updateHint;updateHint=function(...args){const r=progressHint(...args);updateFieldProgress();return r;};
const progressPlace=place;place=function(...args){const r=progressPlace(...args);updateFieldProgress();return r;};
const progressTool=setTool;setTool=function(...args){const r=progressTool(...args);updateFieldProgress();return r;};
const progressGhost=drawGhost;drawGhost=function(...args){updateFieldProgress();return progressGhost(...args);};

function decorateHouseActions(body){
 let footer=body.querySelector('.house-sticky-actions');if(!footer){footer=document.createElement('div');footer.className='house-sticky-actions';footer.setAttribute('role','group');footer.setAttribute('aria-label','Hausaktionen');body.append(footer);}
 for(const selector of ['.house-upgrade-action','.house-actions-anchor .building-actions']){const group=body.querySelector(selector);if(group){for(const button of [...group.querySelectorAll('button')])footer.append(button);group.remove();}}body.querySelector('.house-actions-anchor')?.remove();
 const downgrade=body.querySelector('[data-act="downgrade"]');if(downgrade){const group=downgrade.parentElement;footer.append(downgrade);if(group!==footer&&!group.children.length)group.remove();}
 if(body.lastElementChild!==footer)body.append(footer);
}

// Ein R-Eingabepfad für Maus- und Tastaturbedienung, für Gehege und vollständig gezeichnete Ausrichtungsfamilien.
document.addEventListener('keydown',e=>{
 if(e.key.toLowerCase()!=='r'||e.ctrlKey||e.metaKey||e.altKey||startDialog.open||e.target.closest('input,textarea,select,[contenteditable="true"]')||!heldBuildingCanRotate())return;
 e.preventDefault();e.stopImmediatePropagation();
 if(UI.tool==='relocate'){const steps=(UI.moveSelection||[]).some(id=>buildingRotationSteps(G.byId.get(id)?.type)===4)?4:2;UI.moveQuarter=((UI.moveQuarter||0)+1)%steps;}
 else {const type=UI.tool==='move'?G.byId.get(UI.moveId)?.type:UI.type;UI.rotation=buildingRotation(type,(UI.rotation||0)+1);}
 // R bleibt an der bestehenden Maus-/Vorschauposition; kein Sprung zur Kartenmitte.
 mapKeyboardDeactivate();updateHint();
},true);
