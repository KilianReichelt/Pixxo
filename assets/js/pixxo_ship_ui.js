/* Einheitliche Anzeige der Schiffbauzeit, auch bei angebrochenen Sekunden. */
function formatShipBuildTime(seconds){const total=Math.max(0,Math.ceil(Number(seconds)||0));return Math.floor(total/60)+' Min. '+String(total%60).padStart(2,'0')+' Sek.';}
const displayBuildShip=buildShip;
const SHIP_NAMES=['Aurora','Johanna','Elisabeth','Victoria','Luise','Therese','Clara','Helena','Amalia','Sophie','Mathilde','Charlotte','Margarete','Friedrich','Wilhelm','Heinrich','Alexander','Carl','Maria','Anna','Eleonore','Caroline','Dorothea','Emilie','Ferdinand','Georg','Hermann','Otto','Eduard','Albert','Isabella','Constanze','Friederike','Pauline','Agnes','Josephine','Henriette','Leonore','Adelheid','Emma','Rudolf','Anton','August','Richard','Robert','Ernst','Ludwig','Maximilian'];
function randomShipName(){
 const used=new Set(WORLD.fleet.map(s=>s.name?.trim().toLocaleLowerCase('de'))),available=SHIP_NAMES.filter(n=>!used.has(n.toLocaleLowerCase('de')));
 if(available.length)return available[Math.floor(Math.random()*available.length)];
 const ports=['Bremen','Hamburg','Lübeck','Rostock','Stralsund','Wismar','Danzig','Kiel'];
 const extended=SHIP_NAMES.flatMap(n=>ports.map(p=>n+' von '+p)).filter(n=>!used.has(n.toLocaleLowerCase('de')));
 return extended.length?extended[Math.floor(Math.random()*extended.length)]:SHIP_NAMES[Math.floor(Math.random()*SHIP_NAMES.length)];
}
buildShip=function(...args){
 const result=displayBuildShip(...args);
 if(result===true){WORLD.fleet.at(-1).name=randomShipName();const w=WINS.info;if(w&&G.byId.get(UI.sel)?.type==='werft'){w.hold=false;refreshWin(w);}}
 return result;
};
/* Direkte Warenübergabe zwischen Inselvorrat und Frachträumen. */
UI.transferAmount=10;
function shipTransferHarbor(sh){
 if(!sh||sh.route||sh.manualTrip||sh.buildLeft>0||sh.expedition!==undefined)return null;
 const p=freeShipPosition(sh);if(!p)return null;
 let found=null,distance=8;WORLD.islands.forEach((g,i)=>{if(!g?.dock)return;const d=Math.hypot(p.x-g.dock.x,p.y-g.dock.y);if(d<=distance){found={g,i};distance=d;}});return found;
}
shipAtHarbor=sh=>!!shipTransferHarbor(sh);
function shipCargoRoom(sh,good){return Math.max(0,SHIPS[sh.type].slots-sh.cargo.length)*50+sh.cargo.filter(c=>c.good===good).reduce((sum,c)=>sum+Math.max(0,50-c.qty),0);}
transferShip=function(sh,good,qty,load,slot=null){
 const harbor=shipTransferHarbor(sh);if(!harbor)return 'Das Schiff muss vor einem eigenen Hafen stehen.';
 if(!GN[good])return 'Diese Ware ist nicht verfügbar.';
 const amount=qty===Infinity?Infinity:Math.max(1,Math.floor(Number(qty)||1)),g=harbor.g;
 if(load){
  let remaining=Math.min(amount,Math.floor(g.stock[good]||0),shipCargoRoom(sh,good));if(!remaining)return 'Kein freier Frachtraum oder kein Inselvorrat vorhanden.';
  g.stock[good]-=remaining;
  for(const c of sh.cargo)if(c.good===good&&remaining>0){const n=Math.min(remaining,50-c.qty);c.qty+=n;remaining-=n;}
  while(remaining>0){const n=Math.min(50,remaining);sh.cargo.push({good,qty:n});remaining-=n;}
 }else{
  const cargo=slot===null?sh.cargo.filter(c=>c.good===good):[sh.cargo[slot]].filter(c=>c?.good===good);
  let remaining=Math.min(amount,Math.max(0,islandCap(g)-(g.stock[good]||0)),cargo.reduce((sum,c)=>sum+c.qty,0));if(!remaining)return 'Keine Ladung oder kein freier Lagerplatz vorhanden.';
  g.stock[good]=(g.stock[good]||0)+remaining;for(const c of cargo){const n=Math.min(c.qty,remaining);c.qty-=n;remaining-=n;}sh.cargo=sh.cargo.filter(c=>c.qty>0);
 }
 return true;
};
function discardShipCargo(sh,slot,good){const cargo=sh.cargo.find((c,i)=>(sh.route?(c.slot??i):i)===slot&&c.good===good);if(!cargo)return null;sh.cargo=sh.cargo.filter(c=>c!==cargo);return {good:cargo.good,qty:cargo.qty};}
shipHTML=function(){
 const sh=WORLD.fleet.find(s=>s.id===UI.selectedShip);if(!sh)return null;
 const d=SHIPS[sh.type],r=WORLD.routes.find(r=>r.id===sh.route),harbor=shipTransferHarbor(sh),free=!sh.route&&!sh.buildLeft&&sh.expedition===undefined,amount=UI.transferAmount,total=sh.cargo.reduce((n,c)=>n+c.qty,0);
 let h=`<div class="ship-heading"><div><h2><span>${esc(sh.name)}</span><button type="button" class="ship-rename-icon" data-act="ship-edit-name" aria-label="Schiff umbenennen">${ic('i_ship_edit',1.5)}</button></h2><p>${d.n}</p></div></div><p class="ship-state">${ic(shipActivity(sh)[0],1)} ${esc(sh.status||shipActivity(sh)[1])}${sh.buildLeft>0?' · '+formatShipBuildTime(sh.buildLeft):''}</p><div class="btns">${free?'<button class="btn primary" data-act="ship-sail">Fahrtziel wählen</button>':''}<button class="btn" data-act="ship-plan-route" ${sh.buildLeft||sh.manualTrip||sh.expedition!==undefined?'disabled':''}>${r?'Route bearbeiten':'Route einrichten'}</button></div>`;
 if(r)h+=`<section class="ship-route"><b>${esc(r.name)}</b><p>${esc(tradeRouteLabel(r))}</p><button class="btn" data-act="route-pause" data-id="${r.id}">${r.paused?'Route fortsetzen':'Route pausieren'}</button></section>`;
 h+=`<div class="sect">Ladung · ${total} / ${d.slots*50} t</div>`;
 if(harbor)h+=`<div class="transfer-amount" role="group" aria-label="Menge je Warenklick">${[1,10,50,'max'].map(n=>`<button class="btn ${n===amount?'primary':''}" aria-pressed="${n===amount}" data-act="ship-amount" data-amount="${n}">${n==='max'?'Max.':n+' t'}</button>`).join('')}</div><p class="small">Inselware anklicken zum Einladen, Ladung anklicken zum Ausladen.</p>`;
 const slots=Array.from({length:d.slots},(_,j)=>{const c=r?sh.cargo.find(c=>(c.slot??sh.cargo.indexOf(c))===j):sh.cargo[j];return c?`<div class="cargo-slot occupied"><button class="cargo-transfer" data-act="ship-transfer" data-load="false" data-good="${c.good}" data-slot="${j}" ${harbor?'':'disabled'} aria-label="${attr(GN[c.good].n)}: ${c.qty} von 50 Tonnen. ${harbor?'Zum Ausladen anklicken.':'Warenübergabe nur im Hafen.'}">${ic(c.good,2)}<span>${GN[c.good].n}</span><b>${c.qty} / 50 t</b>${harbor?'<span>↑ Ausladen</span>':''}</button><button type="button" class="cargo-discard" data-act="ship-discard" data-slot="${j}" data-good="${c.good}" aria-label="${c.qty} t ${attr(GN[c.good].n)} aus Frachtraum ${j+1} über Bord werfen" title="Gesamte Ladung dieses Frachtraums über Bord werfen"><span aria-hidden="true">×</span></button></div>`:`<div class="cargo-slot empty"><span class="cargo-slot-name" aria-label="Frachtraum ${j+1}"><span class="cargo-full-label">Frachtraum ${j+1}</span><span class="cargo-short-label" aria-hidden="true">Fach ${j+1}</span></span><b>Leer</b></div>`;}).join('');
 h+=`<div class="transfer-columns">${harbor?`<section aria-label="Inselvorrat"><h3>${esc(ISLANDS[harbor.i].name)} · Lager</h3><div class="warehouse-goods" data-transfer-scroll>${GOODS.filter(g=>(harbor.g.stock[g.id]||0)>=1).map(g=>`<button class="cargo-slot" data-act="ship-transfer" data-load="true" data-good="${g.id}" ${shipCargoRoom(sh,g.id)?'':'disabled'} aria-label="${attr(g.n)}: ${Math.floor(harbor.g.stock[g.id])} Tonnen im Lager. Zum Einladen anklicken.">${ic(g.id,2)}<span>${g.n}</span><b>${Math.floor(harbor.g.stock[g.id])} t</b><span>↓ Einladen</span></button>`).join('')||'<p class="small">Das Inselvorratslager ist leer.</p>'}</div></section>`:''}<section aria-label="Schiffsladung"><h3>Schiff · ${d.slots} Frachträume</h3><div class="cargo-goods" data-slots="${d.slots}">${slots}</div>${harbor&&sh.cargo.length?'<button class="btn unload-all" data-act="ship-unload-all">Alles ausladen</button>':''}</section></div>`;
 if(!harbor)h+=`<p class="small">${r?'Die Handelsroute übernimmt das Laden und Entladen.':sh.manualTrip?'Waren können nach der Ankunft im eigenen Hafen übergeben werden.':'Zum Warenübergang vor einem eigenen Kontor anlegen.'}</p>`;
 h+=`<p class="transfer-message" role="status" aria-live="polite">${esc(UI.transferMessage?.ship===sh.id?UI.transferMessage.text:'')}</p>`;return h;
};
const cargoRefreshWin=refreshWin;refreshWin=function(w){
 if(w.id!=='ship'){cargoRefreshWin(w);return;}
 const focused=w.body.contains(document.activeElement)?document.activeElement:null,key=focused?.dataset,scroll=w.body.querySelector('[data-transfer-scroll]')?.scrollTop||0,old=w.body.firstChild;
 cargoRefreshWin(w);
 if(w.body.firstChild!==old){const list=w.body.querySelector('[data-transfer-scroll]');if(list)list.scrollTop=scroll;
  if(key?.act){const selector=`[data-act="${key.act}"]`+(key.good?`[data-good="${key.good}"]`+(key.load!==undefined?`[data-load="${key.load}"]`:''):'')+(key.slot?`[data-slot="${key.slot}"]`:'')+(key.amount?`[data-amount="${key.amount}"]`:'');(w.body.querySelector(selector)||(key.act==='ship-discard'?(w.body.querySelector('.cargo-discard')||w.body.querySelector('[data-act="ship-plan-route"]')):null))?.focus({preventScroll:true});}
 }
};
const cargoWinAct=winAct;winAct=function(id,ds){
 const sh=WORLD.fleet.find(s=>s.id===UI.selectedShip);
 if(ds.act==='ship-edit-name'&&sh){openWin('shipname','Schiff umbenennen',()=>`<label class="shipname">Schiffsname<input id="shipname" value="${attr(sh.name)}" maxlength="40"></label><button class="btn primary" data-act="ship-rename">Speichern</button>`);$('#shipname').focus();return;}
 if(ds.act==='ship-rename'){cargoWinAct(id,ds);closeWin('shipname');return;}
 if(ds.act==='ship-discard'&&sh){const result=discardShipCargo(sh,Number(ds.slot),ds.good);UI.transferMessage={ship:sh.id,text:result?`${result.qty} t ${GN[result.good].n} über Bord geworfen.`:'Die Ladung hat sich geändert.'};saveGame();}
 else if(ds.act==='ship-amount'){UI.transferAmount=ds.amount==='max'?'max':Number(ds.amount);}
 else if(ds.act==='ship-transfer'&&sh){
  const qty=UI.transferAmount==='max'?Infinity:UI.transferAmount,r=transferShip(sh,ds.good,qty,ds.load==='true',ds.slot===undefined?null:Number(ds.slot));
  UI.transferMessage={ship:sh.id,text:r===true?`${GN[ds.good].n} ${ds.load==='true'?'eingeladen':'ausgeladen'}.`:r};saveGame();
 }else if(ds.act==='ship-unload-all'&&sh){
  const goods=[...new Set(sh.cargo.map(c=>c.good))];for(const good of goods)transferShip(sh,good,Infinity,false);
  UI.transferMessage={ship:sh.id,text:sh.cargo.length?'Lagerplatz reicht nicht für die gesamte Ladung. Restladung bleibt an Bord.':'Gesamte Ladung ausgeladen.'};saveGame();
 }else{cargoWinAct(id,ds);return;}
 const w=WINS.ship;if(w){w.hold=false;refreshWin(w);}renderTop(true);
};
const explorationIslandFacts=renderIslandFacts;renderIslandFacts=function(){
 const el=$('#islandfacts'),i=UI.viewedIsland??activeIsland;if(!el)return;el.classList.toggle('settled-facts',!!WORLD.islands[i]);
 if(WORLD.islands[i]){if(WORLD.fog&&!WORLD.fog.islands[i])return;fogFacts();}else explorationIslandFacts();
};
