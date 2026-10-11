/* Full-screen route planning, shared orders and independent ships. */
let tradeDraft=null,tradePicker=null,tradeDialog=null,tradeOpener=null,tradeMapObserver=null;
function tradeAvailableShips(id){return WORLD.fleet.filter(s=>!s.buildLeft&&!s.manualTrip&&s.expedition===undefined&&(!s.route||s.route===id)&&WORLD.islands[s.at]?.dock&&!WORLD.islands[s.at].cpu);}
function tradeOwnPorts(){return WORLD.islands.flatMap((g,i)=>g?.dock&&!g.cpu?[i]:[]);}
function tradeResizeSlots(){const count=tradeSlotCount(tradeDraft);tradeDraft.ship=tradeDraft.ships[0];for(const s of tradeDraft.stations)s.slots=Array.from({length:count},(_,j)=>s.slots[j]||emptyTradeSlot());}
function tradeUnloadGoods(station,slot){
 const goods=new Set();for(const s of tradeDraft.stations)if(s.slots[slot]?.load)goods.add(s.slots[slot].load.good);
 for(const id of tradeShipIds(tradeDraft)){const sh=WORLD.fleet.find(s=>s.id===id);for(const [j,c] of (sh?.cargo||[]).entries())if((c.slot??j)===slot)goods.add(c.good);}return goods;
}
function tradeQuantityArrow(down=false){return '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><path '+(down?'transform="rotate(180 8 8)" ':'')+'d="M7 4h2v2h2v2h2v2H3V8h2V6h2Z" fill="currentColor"/></svg>';}
function tradeIconButton(action,label,content,extra=''){return `<button type="button" class="btn trade-icon-button" data-route-action="${action}" aria-label="${attr(label)}" title="${attr(label)}" ${extra}>${content}</button>`;}
function tradeOrderHTML(order,station,slot,mode){
 const load=mode==='load',enabled=load||!!order||tradeUnloadGoods(station,slot).size>0;
 const label=`${ISLANDS[tradeDraft.stations[station].island].name}, Frachtraum ${slot+1}: ${load?'Beladen':'Entladen'}${order?' · '+GN[order.good].n+' · '+order.qty+' t':''}`;
 return tradeIconButton('goods',label,`<span class="trade-order-icon"><span class="trade-order-arrow" aria-hidden="true">${ic(load?'i_cargo_down':'i_cargo_up',1)}</span><span class="trade-order-cargo">${ic(order?.good||'i_cargo_ship',2)}${order?`<b>${order.qty}</b>`:''}</span></span>`,`data-station="${station}" data-slot="${slot}" data-mode="${mode}" ${enabled?'':'disabled'}`);
}
function tradePickerHTML(){
 const p=tradePicker;if(!p)return '';
 if(p.kind==='ships')return `<section class="trade-picker" aria-label="Schiff hinzufügen"><div class="trade-picker-heading"><h3>Schiff hinzufügen</h3>${tradeIconButton('picker-close','Auswahl schließen','×')}</div><div class="trade-ship-choices">${tradeAvailableShips(routeEdit).filter(s=>!tradeDraft.ships.includes(s.id)).map(s=>`<button type="button" class="btn trade-ship-choice" data-route-action="ship-add" data-ship="${s.id}">${ic('i_ship',2)}<span>${esc(s.name)}<br>${SHIPS[s.type].slots} × 50 t</span></button>`).join('')||'<p>Kein weiteres freies Schiff verfügbar.</p>'}</div></section>`;
 const allowed=p.mode==='unload'?tradeUnloadGoods(p.station,p.slot):null;
 return `<section class="trade-picker trade-goods-picker" aria-label="Warenauftrag"><div class="trade-picker-heading"><h3>${p.mode==='load'?'Beladen':'Entladen'} · ${p.slot+1}</h3>${tradeIconButton('picker-close','Warenauswahl schließen','×')}</div><label class="trade-search">Ware suchen<input type="search" data-trade-search autocomplete="off"></label><div class="trade-goods-grid">${GOODS.filter(g=>!allowed||allowed.has(g.id)||p.good===g.id).map(g=>`<button type="button" class="btn trade-good" data-route-action="pick" data-good="${g.id}" aria-pressed="${p.good===g.id}">${ic(g.id,2)}<span>${esc(g.n)}</span></button>`).join('')}</div><div class="trade-picker-footer"><div class="trade-quantity"><label for="trade-picker-quantity">Menge (t)</label><div class="trade-quantity-control"><input id="trade-picker-quantity" type="number" data-picker-quantity min="1" max="50" step="1" value="${p.qty}" required><div class="trade-quantity-steps"><button type="button" class="trade-quantity-step" data-route-action="quantity-up" aria-label="Menge um eine Tonne erhöhen" aria-controls="trade-picker-quantity">${tradeQuantityArrow()}</button><button type="button" class="trade-quantity-step" data-route-action="quantity-down" aria-label="Menge um eine Tonne verringern" aria-controls="trade-picker-quantity">${tradeQuantityArrow(true)}</button></div></div></div><button type="button" class="btn primary" data-route-action="order-save" ${p.good?'':'disabled'}>${p.mode==='load'?'Ware laden':'Ware entladen'}</button>${tradeIconButton('order-clear','Warenauftrag entfernen','×',tradeDraft.stations[p.station].slots[p.slot][p.mode]?'':'disabled')}</div><p class="bad trade-picker-error" role="alert"></p></section>`;
}
function tradeMapPinsHTML(){return tradeOwnPorts().map(i=>{
 const m=ISLANDS[i],p=WORLD.islands[i].dock,selected=tradeDraft.stations.some(s=>s.island===i),last=tradeDraft.stations.at(-1)?.island===i;
 return `<button type="button" class="trade-map-port ${selected?'selected':''}" data-route-action="add" data-island="${i}" style="left:${p.x/MAPW*100}%;top:${p.y/MAPH*100}%" aria-label="${attr(m.name)} als nächste Station hinzufügen" aria-disabled="${last}" title="${attr(m.name)}${last?' · letzte Station':''}">${ic('i_ship',1.25)}<span class="trade-port-label">${esc(m.name)}${selected?' · Stationen '+tradeDraft.stations.flatMap((s,j)=>s.island===i?[j+1]:[]).join(' · '):''}</span>${selected?`<b>${tradeDraft.stations.findIndex(s=>s.island===i)+1}</b>`:''}</button>`;
 }).join('');}
function tradeOptionHTML(name,label,help,checked){return '<div class="trade-checkbox-row"><label class="trade-checkbox" for="trade-'+name+'"><input id="trade-'+name+'" type="checkbox" name="'+name+'" '+(checked?'checked':'')+'>'+label+'</label><span class="trade-help-wrap"><button type="button" class="trade-help" aria-label="Hilfe: '+attr(label)+'" aria-describedby="trade-help-'+name+'" aria-expanded="false">?</button><span id="trade-help-'+name+'" class="trade-tooltip" role="tooltip">'+esc(help)+'</span></span></div>';}
function tradeDraftHTML(){
 const d=tradeDraft,count=tradeSlotCount(d);
 return `<div class="trade-route-layout"><section class="trade-route-left" aria-label="Schiffe und Warenverwaltung"><header class="trade-route-heading"><h2>Route einrichten</h2>${tradeIconButton('cancel','Routenfenster schließen','×')}</header><label class="trade-name">Routenname<input name="name" maxlength="50" value="${attr(d.name)}" required></label><div class="trade-assigned-ships" role="group" aria-label="Zugewiesene Schiffe">${d.ships.map(id=>{const sh=WORLD.fleet.find(s=>s.id===id);return `<div class="trade-assigned-ship">${ic('i_ship',2)}<span>${esc(sh.name)}<br>${SHIPS[sh.type].slots} × 50 t</span>${tradeIconButton('ship-remove',sh.name+' von der Route entfernen','×',`data-ship="${id}"`)}</div>`;}).join('')}${tradeIconButton('ships','Schiff hinzufügen','+',tradeAvailableShips(routeEdit).some(s=>!d.ships.includes(s.id))?'':'disabled')}</div>${tradePickerHTML()}<div class="trade-stations">${d.stations.map((s,j)=>`<section class="trade-station" aria-label="Station ${j+1}: ${attr(ISLANDS[s.island].name)}"><div class="trade-station-port"><h3><span class="trade-stop-number">${j+1}</span>${esc(ISLANDS[s.island].name)}</h3><div class="trade-station-tools">${tradeIconButton('up',`Station ${j+1} nach oben verschieben`,'↑',`data-station="${j}" ${j?'':'disabled'}`)}${tradeIconButton('down',`Station ${j+1} nach unten verschieben`,'↓',`data-station="${j}" ${j<d.stations.length-1?'':'disabled'}`)}${tradeIconButton('remove',`Station ${j+1} entfernen`,'×',`data-station="${j}"`)}</div></div><div class="trade-station-cargo" style="--trade-slots:${Math.max(1,count)}">${s.slots.map((slot,k)=>`<div class="trade-slot" role="group" aria-label="Frachtraum ${k+1}"><span class="trade-slot-number" aria-hidden="true">Frachtplatz ${k+1}</span>${tradeOrderHTML(slot.load,j,k,'load')}${tradeOrderHTML(slot.unload,j,k,'unload')}</div>`).join('')}</div></section>`).join('')||'<p>Wähle eine eigene besiedelte Insel auf der Karte.</p>'}</div><section class="trade-options" aria-label="Routenoptionen"><h3>Routenoptionen</h3><label class="trade-reserve"><span>Reserve im Inselvorrat (t)</span><input type="number" name="reserve" min="0" max="500" step="1" value="${d.reserve}" required></label>${tradeOptionHTML('waitForSpace','Auf freien Lagerplatz warten','Das Schiff wartet im Hafen, wenn das Insellager die vorgesehene Entlademenge nicht aufnehmen kann. Ohne Häkchen fährt es mit der Restladung weiter.',d.waitForSpace)}${tradeOptionHTML('waitForGoods','Auf die volle Lademenge warten','Das Schiff wartet im Hafen auf fehlende Waren für den Ladeauftrag. Die eingestellte Reserve bleibt auf der Insel. Ohne Häkchen fährt es mit der verfügbaren Menge weiter.',d.waitForGoods)}</section><p id="routeerror" class="bad" role="alert"></p><p class="trade-route-hint" role="status">${!d.ships.length?'Füge ein freies Schiff hinzu.':''}</p><div class="trade-route-footer"><span class="trade-save-wrap ${tradeOwnPorts().length<2?'trade-save-blocked':''}" ${tradeOwnPorts().length<2?'tabindex="0" aria-describedby="trade-save-help"':''}><button type="submit" class="btn primary" ${tradeOwnPorts().length<2?'disabled aria-describedby="trade-save-help"':''}>Route speichern</button>${tradeOwnPorts().length<2?'<span id="trade-save-help" class="trade-tooltip" role="tooltip">Für eine Route musst du mindestens zwei Inseln besiedelt haben</span>':''}</span><button type="button" class="btn" data-route-action="cancel">Abbrechen</button></div></section><section class="trade-route-right" aria-label="Routenkarte"><div class="trade-map-heading"><h2>Inseln wählen</h2></div><div class="trade-map-stage"><div class="trade-map"><canvas id="trade-route-map" aria-label="Weltkarte mit Routenverlauf" role="img"></canvas><div class="trade-map-ports">${tradeMapPinsHTML()}</div></div></div><p class="trade-map-caption">Häfen anklicken, um eine Station hinzuzufügen.</p></section></div>`;
}
function readTradeDraft(form){
 tradeDraft.name=form.elements.name.value;tradeDraft.reserve=Number(form.elements.reserve.value);tradeDraft.waitForSpace=form.elements.waitForSpace.checked;tradeDraft.waitForGoods=form.elements.waitForGoods.checked;
 if(tradePicker?.kind!=='ships'&&form.querySelector('[data-picker-quantity]'))tradePicker.qty=Number(form.querySelector('[data-picker-quantity]').value);
}
function drawTradeRouteMap(){
 const canvas=$('#trade-route-map');if(!canvas||!mmBase)return;
 const rect=canvas.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,2);canvas.width=Math.max(1,Math.round(rect.width*ratio));canvas.height=Math.max(1,Math.round(rect.height*ratio));
 const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(mmBase,0,0,canvas.width,canvas.height);c.save();c.scale(canvas.width/MAPW,canvas.height/MAPH);drawFogMini(c);c.restore();
 const stops=tradeDraft.stations;c.lineWidth=3*ratio;c.strokeStyle='#ffe3a0';c.setLineDash([8*ratio,6*ratio]);const point=p=>[p[0]/MAPW*canvas.width,p[1]/MAPH*canvas.height];
 for(let j=0;j<stops.length;j++){
  if(stops.length<2)break;const path=routeWaterPath(stops[j].island,stops[(j+1)%stops.length].island);if(!path?.length)continue;
  c.beginPath();path.forEach((p,k)=>{const [x,y]=point(p);k?c.lineTo(x,y):c.moveTo(x,y);});c.stroke();
  if(path.length>1){const k=Math.max(1,Math.floor(path.length*.55)),[x,y]=point(path[k]),[ax,ay]=point(path[k-1]),angle=Math.atan2(y-ay,x-ax);c.save();c.translate(x,y);c.rotate(angle);c.setLineDash([]);c.fillStyle='#ffe3a0';c.beginPath();c.moveTo(8*ratio,0);c.lineTo(-6*ratio,-5*ratio);c.lineTo(-6*ratio,5*ratio);c.fill();c.restore();}
 }
 for(const id of tradeShipIds(tradeDraft)){const sh=WORLD.fleet.find(s=>s.id===id),p=sh&&freeShipPosition(sh);if(p){c.fillStyle='#fff5d0';c.fillRect(p.x/MAPW*canvas.width-3*ratio,p.y/MAPH*canvas.height-3*ratio,6*ratio,6*ratio);}}
}
function renderTradeDraft(focus){
 const form=$('#routeform'),scroll=form.querySelector('.trade-route-left')?.scrollTop||0,options=form.querySelector('.trade-options')?.open;
 form.innerHTML=tradeDraftHTML();form.querySelector('.trade-route-left').scrollTop=scroll;form.querySelector('.trade-options').open=!!options;
 tradeMapObserver?.disconnect();tradeMapObserver=new ResizeObserver(drawTradeRouteMap);tradeMapObserver.observe(form.querySelector('.trade-map'));drawTradeRouteMap();
 if(focus){let target=form.querySelector(focus);if(target?.disabled)target=target.closest('.trade-station')?.querySelector('[data-route-action="remove"]');(target||form.elements.name)?.focus();}
}
routeForm=function(id){
 const opener=document.activeElement;if(WINS.route)closeWin('route');tradeOpener=opener;routeEdit=id;tradePicker=null;
 const r=WORLD.routes.find(r=>r.id===id),available=tradeAvailableShips(id),ship=available.find(s=>s.id===(r?.ship??UI.selectedShip))||available[0],ids=r?tradeShipIds(r).filter(id=>available.some(s=>s.id===id)):ship?[ship.id]:[];
 tradeDraft=r?JSON.parse(JSON.stringify({name:r.name,ships:ids,reserve:r.reserve||0,waitForSpace:!!r.waitForSpace,waitForGoods:!!r.waitForGoods,stations:tradeStations(r)})):{name:'Neue Handelsroute',ships:ids,reserve:10,waitForSpace:false,waitForGoods:false,stations:ship&&tradeOwnPorts().includes(ship.at)?[{island:ship.at,slots:[]}]:[]};tradeResizeSlots();
 openWin('route','Route einrichten',()=>'<form id="routeform" class="routeform trade-route-form"></form>');WINS.route.static=true;
 tradeDialog=document.createElement('dialog');tradeDialog.id='trade-route-dialog';tradeDialog.setAttribute('aria-label','Route einrichten');document.body.append(tradeDialog);tradeDialog.append(WINS.route.el);WINS.route.el.setAttribute('role','presentation');WINS.route.el.removeAttribute('aria-label');tradeDialog.showModal();
 tradeDialog.addEventListener('cancel',e=>{e.preventDefault();if(tradePicker){tradePicker=null;renderTradeDraft('[data-route-action="ships"]');}else closeWin('route');});
 const form=$('#routeform');form.addEventListener('click',e=>{const button=e.target.closest('.trade-help');if(!button)return;const wrap=button.closest('.trade-help-wrap');wrap.classList.remove('tooltip-dismissed');wrap.classList.toggle('help-open');button.setAttribute('aria-expanded',String(wrap.classList.contains('help-open')));});
 form.addEventListener('pointerover',e=>e.target.closest('.trade-help-wrap,.trade-save-blocked')?.classList.remove('tooltip-dismissed'));
 form.addEventListener('focusin',e=>e.target.closest('.trade-help-wrap,.trade-save-blocked')?.classList.remove('tooltip-dismissed'));
 form.addEventListener('submit',saveRoute);form.addEventListener('click',tradeDraftClick);form.addEventListener('change',()=>readTradeDraft(form));
 form.addEventListener('input',e=>{if(e.target.matches('[data-trade-search]')){const text=e.target.value.toLocaleLowerCase('de');for(const b of form.querySelectorAll('.trade-goods-grid button'))b.hidden=!b.textContent.toLocaleLowerCase('de').includes(text);}});
 tradeDialog.addEventListener('keydown',e=>{
  if(e.key==='Escape'){const help=tradeDialog.querySelector('.trade-help-wrap:hover,.trade-help-wrap:focus-within,.trade-help-wrap.help-open,.trade-save-blocked:hover,.trade-save-blocked:focus');if(help&&!help.classList.contains('tooltip-dismissed')){help.classList.add('tooltip-dismissed');help.classList.remove('help-open');help.querySelector('button')?.setAttribute('aria-expanded','false');e.preventDefault();e.stopImmediatePropagation();return;}}
  if(e.key==='Tab'){const list=[...tradeDialog.querySelectorAll('button:not(:disabled),input:not(:disabled),summary,[tabindex="0"]')].filter(el=>el.getClientRects().length);if(list.length){e.preventDefault();const index=list.indexOf(document.activeElement);list[(index+(e.shiftKey?-1:1)+list.length)%list.length].focus();}}
  if(e.key==='Enter'&&e.target.matches('[data-picker-quantity]')){e.preventDefault();form.querySelector('[data-route-action="order-save"]').click();}
  if(e.key==='Escape'){e.preventDefault();if(tradePicker){const p=tradePicker;tradePicker=null;renderTradeDraft(p.kind==='ships'?'[data-route-action="ships"]':`[data-route-action="goods"][data-station="${p.station}"][data-slot="${p.slot}"][data-mode="${p.mode}"]`);}else closeWin('route');}e.stopPropagation();
 });
 form.addEventListener('click',e=>{if(e.target.id!=='trade-route-map')return;const rect=e.target.getBoundingClientRect(),x=Math.floor((e.clientX-rect.left)/rect.width*MAPW),y=Math.floor((e.clientY-rect.top)/rect.height*MAPH),i=islandOwners[IDX(x,y)];if(tradeOwnPorts().includes(i)&&tradeDraft.stations.at(-1)?.island!==i)tradeDraftClick({target:{closest:()=>({dataset:{routeAction:'add',island:i}})},preventDefault(){}});});
 renderTradeDraft('[name="name"]');
};
const tradeCloseWin=closeWin;closeWin=function(id){
 if(id!=='route'){tradeCloseWin(id);return;}const opener=tradeOpener;tradeMapObserver?.disconnect();tradeMapObserver=null;tradeCloseWin(id);tradeDialog?.close();tradeDialog?.remove();tradeDialog=null;tradePicker=null;
 if(opener?.isConnected&&!opener.disabled)opener.focus();else WINS.ship?.body.querySelector('[data-act="ship-plan-route"]')?.focus();
};
function tradeDraftClick(e){
 const button=e.target.closest('[data-route-action]');if(!button||button.disabled||button.getAttribute?.('aria-disabled')==='true')return;e.preventDefault();readTradeDraft($('#routeform'));
 const ds=button.dataset,j=+ds.station,k=+ds.slot;let focus='[data-route-action="ships"]';
 switch(ds.routeAction){
  case 'quantity-up':case 'quantity-down':{const input=document.querySelector('[data-picker-quantity]'),value=Number(input.value);input.value=Math.max(1,Math.min(50,Math.trunc(Number.isFinite(value)?value:1)+(ds.routeAction==='quantity-up'?1:-1)));tradePicker.qty=Number(input.value);input.dispatchEvent(new Event('input',{bubbles:true}));return;}
  case 'add':if(!tradeOwnPorts().includes(+ds.island)||tradeDraft.stations.at(-1)?.island===+ds.island)return;tradeDraft.stations.push({island:+ds.island,slots:Array.from({length:tradeSlotCount(tradeDraft)},emptyTradeSlot)});focus=`[data-route-action="goods"][data-station="${tradeDraft.stations.length-1}"]`;break;
  case 'remove':tradeDraft.stations.splice(j,1);focus='[data-route-action="add"]';break;
  case 'up':case 'down':{const next=j+(ds.routeAction==='up'?-1:1);[tradeDraft.stations[j],tradeDraft.stations[next]]=[tradeDraft.stations[next],tradeDraft.stations[j]];focus=`[data-route-action="${ds.routeAction}"][data-station="${next}"]`;break;}
  case 'ships':tradePicker={kind:'ships'};renderTradeDraft('[data-route-action="ship-add"]');return;
  case 'ship-add':if(!tradeAvailableShips(routeEdit).some(s=>s.id===+ds.ship))return;tradeDraft.ships.push(+ds.ship);tradeResizeSlots();break;
  case 'ship-remove':{const ids=tradeDraft.ships.filter(id=>id!==+ds.ship),count=tradeSlotCount({ships:ids});if(tradeDraft.stations.some(s=>s.slots.slice(count).some(slot=>slot.load||slot.unload))){$('#routeerror').textContent='Entferne zuerst die Aufträge in den zusätzlichen Frachträumen.';return;}tradeDraft.ships=ids;tradeResizeSlots();break;}
  case 'goods':{const order=tradeDraft.stations[j].slots[k][ds.mode];tradePicker={kind:'goods',station:j,slot:k,mode:ds.mode,good:order?.good||null,qty:order?.qty||50};renderTradeDraft('[data-trade-search]');return;}
  case 'pick':tradePicker.good=ds.good;renderTradeDraft('[data-picker-quantity]');return;
  case 'order-save':{const p=tradePicker;if(!p.good||!Number.isInteger(p.qty)||p.qty<1||p.qty>50){$('.trade-picker-error').textContent='Die Menge muss zwischen 1 und 50 t liegen.';return;}tradeDraft.stations[p.station].slots[p.slot][p.mode]={good:p.good,qty:p.qty};focus=`[data-route-action="goods"][data-station="${p.station}"][data-slot="${p.slot}"][data-mode="${p.mode}"]`;break;}
  case 'order-clear':{const p=tradePicker;tradeDraft.stations[p.station].slots[p.slot][p.mode]=null;focus=`[data-route-action="goods"][data-station="${p.station}"][data-slot="${p.slot}"][data-mode="${p.mode}"]`;break;}
  case 'picker-close':{const p=tradePicker;focus=p.kind==='ships'?'[data-route-action="ships"]':`[data-route-action="goods"][data-station="${p.station}"][data-slot="${p.slot}"][data-mode="${p.mode}"]`;break;}
  case 'cancel':closeWin('route');return;
 }tradePicker=null;renderTradeDraft(focus);
}
saveRoute=function(e){e.preventDefault();readTradeDraft(e.target);const result=commitTradeRoute(tradeDraft,routeEdit);if(result!==true){$('#routeerror').textContent=result;$('#routeerror').scrollIntoView({block:'nearest'});return;}closeWin('route');refreshWins();renderTop(true);renderBar();};
fleetHTML=function(){
 let h='<div class="sect">Flotte</div>'+(WORLD.fleet.map(sh=>`<section class="routecard"><h3>${ic('i_ship',1)} ${esc(sh.name)}</h3><p>${esc(sh.status||'Im Hafen')}</p><p>${esc(ISLANDS[sh.at].name)} · ${sh.cargo.map(c=>`${esc(GN[c.good].n)} ${c.qty} t`).join(', ')||'Keine Ladung'}</p></section>`).join('')||'<p>Keine Schiffe vorhanden.</p>');
 h+='<div class="sect">Handelsrouten</div><button class="btn primary" data-act="route-new">Route einrichten</button>';
 for(const r of WORLD.routes)h+=`<section class="routecard"><h3>${esc(r.name)}</h3><p>${esc(tradeRouteLabel(r))} → Start</p><p>${tradeShipIds(r).length} Schiffe · ${tradeStations(r).length} Stationen · ${r.paused?'Pausiert':'Aktiv'}</p><div class="btns"><button class="btn" data-act="route-edit" data-id="${r.id}">Bearbeiten</button><button class="btn" data-act="route-pause" data-id="${r.id}">${r.paused?'Fortsetzen':'Pausieren'}</button><button class="btn" data-act="route-delete" data-id="${r.id}">Route beenden</button></div></section>`;return h;
};
const stationDrawShipMini=drawSelectedShipMini;drawSelectedShipMini=function(c){
 const sh=WORLD.fleet.find(s=>s.id===UI.selectedShip),r=WORLD.routes.find(r=>r.id===sh?.route);if(!r){stationDrawShipMini(c);return;}c.drawImage(mmBase,0,0,112,112);c.save();c.scale(112/MAPW,112/MAPH);drawFogMini(c);c.restore();c.strokeStyle='#fff3b0';c.lineWidth=1.5;c.setLineDash([3,2]);
 for(const [a,b] of tradeRouteLegs(r)){const path=routeWaterPath(a,b);if(!path?.length)continue;c.beginPath();path.forEach((p,i)=>i?c.lineTo(p[0]/MAPW*112,p[1]/MAPH*112):c.moveTo(p[0]/MAPW*112,p[1]/MAPH*112));c.stroke();}c.setLineDash([]);const p=freeShipPosition(sh);if(p){c.fillStyle='#fff3b0';c.fillRect(p.x/MAPW*112-2,p.y/MAPH*112-2,4,4);}
};
/* Native 16px action icons, including their transparent margins. */
function makeTradeActionIcon(name,up,ship){
 const a=document.createElement('canvas');a.width=a.height=16;const c=a.getContext('2d'),r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
 if(ship){r(1,10,10,3,'#382e23');r(2,11,8,2,'#9e754a');r(3,13,6,1,'#382e23');r(5,2,1,8,'#382e23');r(6,3,1,6,'#ead8ad');r(7,4,1,5,'#ead8ad');r(8,6,1,3,'#bda97e');r(1,9,10,1,'#e0bd7c');}
 if(name==='i_cargo_ship'){publishPixel(name,a,16,16);return;}
 const arrow=(x,y,w,h,color)=>r(x,up?y:16-y-h,w,h,color);
 arrow(6,5,4,9,'#382e23');arrow(7,5,2,8,'#fff0bc');
 for(let k=0;k<5;k++)arrow(7-k,1+k,2+k*2,1,'#382e23');
 for(let k=0;k<4;k++)arrow(7-k,2+k,2+k*2,1,'#fff0bc');publishPixel(name,a,16,16);
}
makeTradeActionIcon('i_cargo_ship',true,true);makeTradeActionIcon('i_cargo_up',true,false);makeTradeActionIcon('i_cargo_down',false,false);
