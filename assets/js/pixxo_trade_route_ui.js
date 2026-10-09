/* Stationsmatrix mit Warenfeldern statt Waren-Dropdowns. */
let tradeDraft=null,tradePicker=null;
function tradeAvailableShips(id){return WORLD.fleet.filter(s=>!s.buildLeft&&!s.manualTrip&&s.expedition===undefined&&(!s.route||s.route===id)&&(s.route||!s.anchor||Math.hypot(s.anchor.x-WORLD.islands[s.at]?.dock?.x,s.anchor.y-WORLD.islands[s.at]?.dock?.y)<=8));}
function tradeOrderHTML(order,station,slot,mode){
 const label=mode==='load'?'↑ Laden':'↓ Entladen',base=`data-station="${station}" data-slot="${slot}" data-mode="${mode}"`;
 return `<div class="trade-order ${mode}"><span>${label}</span><button type="button" class="trade-good" data-route-action="goods" ${base} aria-label="Station ${station+1}, Frachtraum ${slot+1}: ${order?attr(GN[order.good]?.n||order.good)+', '+order.qty+' t. ':''}Ware zum ${mode==='load'?'Laden':'Entladen'} auswählen">${order?ic(order.good,2)+`<span>${esc(GN[order.good]?.n||order.good)}</span>`:'<span>+ Ware</span>'}</button><div class="trade-quantity"><label>${mode==='load'?'Laden':'Entladen'} (t)<input aria-label="${mode==='load'?'Laden':'Entladen'} (t), Station ${station+1}, Frachtraum ${slot+1}" type="number" min="1" max="50" step="1" value="${order?.qty||50}" data-route-quantity ${base} ${order?'required':'disabled'}></label><button type="button" class="btn" data-route-action="clear" ${base} aria-label="${mode==='load'?'Ladeauftrag':'Entladeauftrag'} in Station ${station+1}, Frachtraum ${slot+1} entfernen" ${order?'':'disabled'}>×</button></div></div>`;
}
function tradeDraftHTML(){
 const d=tradeDraft,ships=tradeAvailableShips(routeEdit),ship=WORLD.fleet.find(s=>s.id===d.ship),count=SHIPS[ship.type].slots;
 const picker=tradePicker?`<fieldset class="trade-goods-picker"><legend>Ware zum ${tradePicker.mode==='load'?'Laden':'Entladen'} · Station ${tradePicker.station+1}, Frachtraum ${tradePicker.slot+1}</legend><div class="trade-goods-grid">${GOODS.map(g=>`<button type="button" class="trade-good" data-route-action="pick" data-good="${g.id}">${ic(g.id,2)}<span>${esc(g.n)}</span></button>`).join('')}</div><button type="button" class="btn" data-route-action="picker-close">Zurück zu den Stationen</button></fieldset>`:'';
 return `<div class="trade-route-header"><label>Routenname<input name="name" maxlength="50" required value="${attr(d.name)}"></label><label>Schiff auf dieser Route<select name="ship">${ships.map(s=>`<option value="${s.id}" ${s.id===d.ship?'selected':''}>${esc(s.name)} · ${SHIPS[s.type].slots} Frachträume</option>`).join('')}</select></label></div><p class="trade-itinerary" role="status">${d.stations.map(s=>esc(ISLANDS[s.island].name)).join(' → ')}${d.stations.length?' → zurück zum Start':''}</p><h2>Handelsstationen</h2><p class="small">Je Station zuerst entladen, dann laden. Mengen gelten pro Besuch; nicht ausgewählte Waren bleiben an Bord.</p><div class="trade-stations">${d.stations.map((station,j)=>`<section class="trade-station" aria-label="Station ${j+1}: ${attr(ISLANDS[station.island].name)}" style="--trade-slots:${count}"><div class="trade-station-port"><h3>${j+1}. ${esc(ISLANDS[station.island].name)}</h3><div class="trade-station-tools"><button type="button" class="btn" data-route-action="up" data-station="${j}" aria-label="Station ${j+1} nach oben verschieben" ${j?'':'disabled'}>↑</button><button type="button" class="btn" data-route-action="down" data-station="${j}" aria-label="Station ${j+1} nach unten verschieben" ${j<d.stations.length-1?'':'disabled'}>↓</button><button type="button" class="btn" data-route-action="remove" data-station="${j}" aria-label="Station ${j+1} entfernen">×</button></div></div><div class="trade-station-cargo">${station.slots.map((slot,k)=>`<fieldset class="trade-slot"><legend>Frachtraum ${k+1}</legend>${tradeOrderHTML(slot.unload,j,k,'unload')}${tradeOrderHTML(slot.load,j,k,'load')}</fieldset>`).join('')}</div></section>`).join('')}</div>${picker}<fieldset class="trade-add-station"><legend>Insel als nächste Station hinzufügen</legend><div class="trade-port-list">${WORLD.islands.map((g,i)=>g?.dock?`<button type="button" class="btn" data-route-action="add" data-island="${i}" ${d.stations.at(-1)?.island===i?'disabled':''}>+ ${esc(ISLANDS[i].name)}</button>`:'').join('')}</div></fieldset><details class="trade-options"><summary>Warteverhalten und Mindestbestand</summary><label>Mindestbestand im Quelllager (t)<input type="number" name="reserve" min="0" max="500" step="1" value="${d.reserve}" required></label><label class="trade-checkbox"><input type="checkbox" name="waitForSpace" ${d.waitForSpace?'checked':''}>Bei fehlendem Lagerplatz auf die Entladung warten</label><label class="trade-checkbox"><input type="checkbox" name="waitForGoods" ${d.waitForGoods?'checked':''}>Auf die vollständige Lademenge warten</label><p class="small">Ohne Warten wird nur die verfügbare Menge übertragen. Restladung bleibt im selben Frachtraum und kann andere Waren dort blockieren.</p></details><p id="routeerror" role="alert" class="bad"></p><div class="trade-route-footer"><button type="submit" class="btn primary">Route speichern</button><button type="button" class="btn" data-route-action="cancel">Abbrechen</button></div>`;
}
function readTradeDraft(form){
 tradeDraft.name=form.elements.name.value;tradeDraft.reserve=Number(form.elements.reserve.value);tradeDraft.waitForSpace=form.elements.waitForSpace.checked;tradeDraft.waitForGoods=form.elements.waitForGoods.checked;
 for(const input of form.querySelectorAll('[data-route-quantity]')){const ds=input.dataset,order=tradeDraft.stations[+ds.station]?.slots[+ds.slot]?.[ds.mode];if(order)order.qty=Number(input.value);}
}
function renderTradeDraft(focus){
 const form=$('#routeform'),scroll=WINS.route.body.scrollTop;form.innerHTML=tradeDraftHTML();WINS.route.body.scrollTop=scroll;
 if(focus){let target=form.querySelector(focus);if(target?.disabled)target=target.closest('.trade-station')?.querySelector('[data-route-action="remove"]');target?.focus();}
}
routeForm=function(id){
 const ships=tradeAvailableShips(id);if(!ships.length){msg('Für eine Route wird ein freies Schiff im eigenen Hafen benötigt.','i_alert');return;}
 const ports=WORLD.islands.map((g,i)=>g?.dock?i:-1).filter(i=>i>=0);if(ports.length<2){msg('Für eine Handelsroute werden mindestens zwei eigene Häfen benötigt.','i_alert');return;}
 const r=WORLD.routes.find(r=>r.id===id),ship=ships.find(s=>s.id===(r?.ship??UI.selectedShip))||ships[0];routeEdit=id;tradePicker=null;
 tradeDraft=r?JSON.parse(JSON.stringify({name:r.name,ship:ship.id,reserve:r.reserve||0,waitForSpace:!!r.waitForSpace,waitForGoods:!!r.waitForGoods,stations:tradeStations(r)})):{name:'Neue Handelsroute',ship:ship.id,reserve:10,waitForSpace:false,waitForGoods:false,stations:[{island:ship.at,slots:Array.from({length:SHIPS[ship.type].slots},emptyTradeSlot)}]};
 if(WINS.route)closeWin('route');openWin('route',r?'Handelsroute bearbeiten':'Handelsroute einrichten',()=>`<form id="routeform" class="routeform trade-route-form">${tradeDraftHTML()}</form>`);WINS.route.static=true;
 const form=$('#routeform');form.addEventListener('submit',saveRoute);form.addEventListener('click',tradeDraftClick);
 form.addEventListener('change',e=>{
  readTradeDraft(form);if(e.target.name!=='ship')return;
  const selected=WORLD.fleet.find(s=>s.id===+e.target.value),count=SHIPS[selected.type].slots;
  if(tradeDraft.stations.some(s=>s.slots.slice(count).some(slot=>slot.load||slot.unload))){e.target.value=tradeDraft.ship;$('#routeerror').textContent='Entferne zuerst die Warenaufträge in den zusätzlichen Frachträumen.';return;}
  tradeDraft.ship=selected.id;tradeDraft.stations.forEach(s=>{s.slots=Array.from({length:count},(_,i)=>s.slots[i]||emptyTradeSlot());});tradePicker=null;renderTradeDraft('[name="ship"]');
 });form.addEventListener('keydown',e=>{if(e.key==='Escape'&&tradePicker){e.preventDefault();e.stopPropagation();tradeDraftClick({target:{closest:()=>({dataset:{routeAction:'picker-close'}})},preventDefault(){}});}});form.elements.name.focus();
};
function tradeDraftClick(e){
 const button=e.target.closest('[data-route-action]');if(!button||button.disabled)return;e.preventDefault();readTradeDraft($('#routeform'));
 const ds=button.dataset,j=+ds.station,k=+ds.slot;let focus;
 switch(ds.routeAction){
  case 'add':tradeDraft.stations.push({island:+ds.island,slots:Array.from({length:SHIPS[WORLD.fleet.find(s=>s.id===tradeDraft.ship).type].slots},emptyTradeSlot)});focus=`[data-route-action="remove"][data-station="${tradeDraft.stations.length-1}"]`;break;
  case 'remove':tradeDraft.stations.splice(j,1);focus='[data-route-action="add"]';break;
  case 'up':case 'down':{const next=j+(ds.routeAction==='up'?-1:1);[tradeDraft.stations[j],tradeDraft.stations[next]]=[tradeDraft.stations[next],tradeDraft.stations[j]];focus=`[data-route-action="${ds.routeAction}"][data-station="${next}"]`;break;}
  case 'goods':tradePicker={station:j,slot:k,mode:ds.mode};renderTradeDraft('[data-route-action="pick"]');$('#routeform').querySelector('.trade-goods-picker').scrollIntoView({block:'nearest'});return;
  case 'pick':{const p=tradePicker;tradeDraft.stations[p.station].slots[p.slot][p.mode]={good:ds.good,qty:tradeDraft.stations[p.station].slots[p.slot][p.mode]?.qty||50};focus=`[data-route-action="goods"][data-station="${p.station}"][data-slot="${p.slot}"][data-mode="${p.mode}"]`;break;}
  case 'clear':tradeDraft.stations[j].slots[k][ds.mode]=null;focus=`[data-route-action="goods"][data-station="${j}"][data-slot="${k}"][data-mode="${ds.mode}"]`;break;
  case 'picker-close':{const p=tradePicker;focus=`[data-route-action="goods"][data-station="${p.station}"][data-slot="${p.slot}"][data-mode="${p.mode}"]`;break;}
  case 'cancel':closeWin('route');return;
 }
 tradePicker=null;renderTradeDraft(focus);
}
saveRoute=function(e){
 e.preventDefault();readTradeDraft(e.target);const result=commitTradeRoute(tradeDraft,routeEdit);
 if(result!==true){$('#routeerror').textContent=result;return;}closeWin('route');refreshWins();renderTop(true);renderBar();
};
fleetHTML=function(){
 let h='<div class="sect">Flotte</div>'+(WORLD.fleet.map(sh=>`<section class="routecard"><h3>${ic('i_ship',1)} ${esc(sh.name)}</h3><p>${esc(sh.status||'Im Hafen')}</p><p>${esc(ISLANDS[sh.at].name)} · ${sh.cargo.map(c=>`${esc(GN[c.good].n)} ${c.qty} t`).join(', ')||'Keine Ladung'}</p></section>`).join('')||'<p>Keine Schiffe vorhanden.</p>');
 h+='<div class="sect">Handelsrouten</div><button class="btn primary" data-act="route-new">Route einrichten</button>';
 for(const r of WORLD.routes)h+=`<section class="routecard"><h3>${esc(r.name)}</h3><p>${esc(tradeRouteLabel(r))} → Start</p><p>${tradeStations(r).length} Stationen · ${r.paused?'Pausiert':'Aktiv'}</p><div class="btns"><button class="btn" data-act="route-edit" data-id="${r.id}">Bearbeiten</button><button class="btn" data-act="route-pause" data-id="${r.id}">${r.paused?'Fortsetzen':'Pausieren'}</button><button class="btn" data-act="route-delete" data-id="${r.id}">Route beenden</button></div></section>`;
 return h;
};
const stationDrawShipMini=drawSelectedShipMini;drawSelectedShipMini=function(c){
 const sh=WORLD.fleet.find(s=>s.id===UI.selectedShip),r=WORLD.routes.find(r=>r.id===sh?.route);if(!r){stationDrawShipMini(c);return;}
 c.drawImage(mmBase,0,0,112,112);c.save();c.scale(112/MAPW,112/MAPH);drawFogMini(c);c.restore();c.strokeStyle='#fff3b0';c.lineWidth=1.5;c.setLineDash([3,2]);
 for(const [a,b] of tradeRouteLegs(r)){const path=routeWaterPath(a,b);if(!path)continue;c.beginPath();path.forEach((p,i)=>i?c.lineTo(p[0]/MAPW*112,p[1]/MAPH*112):c.moveTo(p[0]/MAPW*112,p[1]/MAPH*112));c.stroke();}
 c.setLineDash([]);const p=freeShipPosition(sh);if(p){c.fillStyle='#fff3b0';c.fillRect(p.x/MAPW*112-2,p.y/MAPH*112-2,4,4);}
};
