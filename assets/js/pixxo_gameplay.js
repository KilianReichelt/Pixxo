/* Spielregeln: Wohnhausbedarf, Luxus, Straßentransport und reservierte Betriebsflächen. */
function setWorldSize(w,h,size){MAPW=w;MAPH=h;ISLAND_SIZE=size;FOG_W=w;FOG_H=h;fogCanvas=null;fogDirty=true;}
B.markt.r=28;delete B.markt.transportRange;
B.markt.d='Versorgt die Nachbarschaft direkt aus dem Inselvorrat. Verbrauchswaren benötigen keinen Transport zum Markt.';
B.kontor.d='Hafen und gemeinsames Warenlager dieser Insel. Auf der gesamten Insel kann gebaut werden.';
B.lager.d='Zusätzlicher Lagerraum und Umschlagplatz für Betriebe. Auf der gesamten Insel kann gebaut werden.';
for(const d of Object.values(B))if(d.kind==='prod')d.transportRange=36;
const LUXURY_CHAINS=[
 {tier:1,good:'honig',name:'Honig',rate:.0125,bonus:1.2,steps:[['imkerei','Imkerei',{},'honig',45,12,'b_farm']]},
 {tier:1,good:'most',name:'Apfelmost',rate:.0125,bonus:1.8,steps:[['obsthof','Obsthof',{},'aepfel',30,10,'b_weingut'],['mosterei','Mosterei',{aepfel:1},'most',45,15,'b_kelterei']]},
 {tier:2,good:'seife',name:'Seife',rate:.01,bonus:2.2,steps:[['schweinehof','Schweinehof',{},'talg',30,15,'b_schaefer'],['seifensiederei','Seifensiederei',{talg:1,holz:1},'seife',45,25,'b_brauerei']]},
 {tier:2,good:'moebel',name:'Möbel',rate:.008,bonus:2.6,steps:[['tischlerei','Tischlerei',{bretter:1},'moebel',45,30,'b_weberei']]},
 {tier:3,good:'parfuem',name:'Parfüm',rate:.006,bonus:3.4,steps:[['blumenhof','Blumenhof',{},'blueten',30,20,'b_hopfen'],['parfuemerie','Parfümerie',{blueten:1,most:1},'parfuem',60,45,'b_kelterei']]},
 {tier:3,good:'schmuck',name:'Schmuck',rate:.005,bonus:3.8,steps:[['goldwaescherei','Goldwäscherei',{},'goldstaub',60,25,'b_mine'],['juwelier','Juwelier',{goldstaub:1,eisen:1},'schmuck',60,50,'b_schmiede']]}
];
const NEW_GOODS={honig:['Honig',24],most:['Apfelmost',30],aepfel:['Äpfel',12],talg:['Talg',16],seife:['Seife',45],moebel:['Möbel',55],blueten:['Blüten',18],parfuem:['Parfüm',85],goldstaub:['Goldstaub',55],schmuck:['Schmuck',110]};
for(const [id,[n,v]] of Object.entries(NEW_GOODS)){const g={id,n,v};GOODS.push(g);GN[id]=g;}
for(const tier of TIERS.filter(Boolean))tier.luxury={};
for(const chain of LUXURY_CHAINS){TIERS[chain.tier].luxury[chain.good]=chain.rate;
 for(const [id,n,input,output,cycle,upk,art] of chain.steps){
  B[id]={n,cat:Object.keys(input).length?'veredel':'roh',w:2,h:2,kind:'prod',cost:{gold:chain.tier*250,bretter:chain.tier*4,...(chain.tier>1?{stein:chain.tier*3}:{})},upk,cycle,in:input,out:{[output]:1},req:0,transportRange:36,workforce:{tier:chain.tier,count:chain.tier*4},d:`Produziert ${GN[output].n}. Benötigt ein Lager oder einen Abnehmer innerhalb von 36 Straßenfeldern.`};
  BUILD_TIER[id]=chain.tier;BUILD_SIZES[id]={w:2,h:2};
  // Vorhandene Handwerksdarstellung in eigener Größe, mit eindeutiger Warenmarkierung.
  mkB('b_'+id,2,2,16,s=>{yard(s,'cob');HOUSE(s,4,4,24,18,12,RAMPS.plaster,TX.n(chain.tier,.1),chain.tier===3?RAMPS.slate:RAMPS.roof,TX.shingle(chain.tier));DOOR(s,12,s.H-12,5,8);WIN(s,6,s.H-21,4,4);BARREL(s,24,s.H-9,5,7);P(s,R(23,s.H-12,7,7),chain.tier===3?RAMPS.gold:RAMPS.cloth,()=>2);});
 }
}
for(const [id] of Object.entries(NEW_GOODS))mk(id,16,16,s=>{P(s,R(3,3,10,11),RAMPS.wood,()=>1);P(s,R(5,5,6,7),id==='schmuck'||id==='goldstaub'?RAMPS.gold:id==='blueten'||id==='parfuem'?RAMPS.red:RAMPS.sack,()=>2);});
function luxuryBonus(b,g){return Math.max(0,b.pop)*(LUXURY_CHAINS.find(c=>c.tier===b.tier&&c.good===g)?.bonus||0);}
const oldExtraHouseIncome=extraHouseIncome;
extraHouseIncome=function(b){if(b.type!=='haus'||b.fire>0||!b.conn)return 0;return oldExtraHouseIncome(b)+Object.keys(TIERS[b.tier].luxury).filter(g=>b.sat[g]===true).reduce((sum,g)=>sum+luxuryBonus(b,g),0);};
houseIncome=function(b){return b.type==='haus'&&b.fire<=0&&b.conn?Math.max(0,b.pop)*TIERS[b.tier].tax*b.mood*b.mood+extraHouseIncome(b):0;};
houseGoodSupplied=function(b,g){return !!b.conn&&!!b.cov?.markt&&b.fire<=0&&b.sat[g]===true;};
function houseRates(b){return {...TIERS[b.tier].goods,...additionalHouseGoods(b),...TIERS[b.tier].luxury};}
// Ein gemeinsamer Zeitpunkt verhindert, dass zuerst simulierte Häuser alle Vorräte erhalten.
function returnMarketSupply(){
 // Bereits gespeicherte Marktbestände und Lieferungen verlustfrei zurückgeben.
 for(const b of G.blds)if(b.type==='markt'&&b.inputStock){for(const [g,qty] of Object.entries(b.inputStock))if(qty>0)G.stock[g]=(G.stock[g]||0)+qty;b.inputStock={};}
 G.carts=G.carts.filter(c=>{if(!c.marketSupply)return true;if(c.qty>0)G.stock[c.col]=(G.stock[c.col]||0)+c.qty;return false;});
}
function prepareHouseSupply(dt){returnMarketSupply();const demand={};for(const b of G.blds)if(b.type==='haus'&&b.conn&&b.cov?.markt&&b.fire<=0)for(const [g,rate] of Object.entries(houseRates(b)))demand[g]=(demand[g]||0)+rate*Math.max(1,b.pop)*dt/60;
 G.houseSupply={};for(const [g,amount] of Object.entries(demand)){const available=Math.max(0,G.stock[g]||0);G.houseSupply[g]=available>=Math.max(amount,1e-8)-1e-9;const used=G.houseSupply[g]?Math.min(amount,available):0;
 G.stock[g]=available-used;if(used>0)OUTSTAT('cons',g,used);}
}supplyHouseGood=function(b,g){b.need[g]=0;b.sat[g]=!!b.conn&&!!b.cov?.markt&&b.fire<=0&&G.houseSupply?.[g]===true;};
// Anschlüsse gelten ausschließlich entlang einer Gebäudekante; diagonale Berührung reicht nicht.
const logisticsRebuild=rebuildNet;
rebuildNet=function(){logisticsRebuild();for(const b of G.blds){if(def(b).kind==='wh')continue;b.warehouseAcc=b.acc;const ports=ringCells(b).filter(([x,y])=>INMAP(x,y)&&G.road[IDX(x,y)]);b.acc=ports.length?IDX(...ports[0]):-1;b.conn=ports.length>0;}
 for(const b of G.blds)if(b.type==='haus'){b.cov={};for(const service of G.blds)if(def(service).kind==='svc'&&service.conn&&!service.paused&&service.fire<=0&&Math.hypot(cx(service)-cx(b),cy(service)-cy(b))<=def(service).r&&deliveryPath(service,b))b.cov[def(service).svc]=true;}
 assignFieldEfficiency();assignWorkforce(G);
};
const unlimitedDeliveryPath=deliveryPath;
deliveryPath=function(a,b){const path=unlimitedDeliveryPath(a,b),range=def(a).transportRange;return path&&(!range||roadPathDistance(path)<=range)?path:null;};
function warehouseTarget(b){let best=null;for(const w of whList()){const path=deliveryPath(b,w);if(path&&(!best||path.length<best.path.length))best={b:w,path};}return best;}
function productionLinked(b){if(warehouseTarget(b))return true;for(const g of Object.keys(def(b).out||{}))if(G.blds.some(t=>t!==b&&def(t).in?.[g]&&t.conn&&!t.paused&&t.fire<=0&&deliveryPath(b,t)))return true;return false;}
function deliveryWarehouseIncoming(g){return G.carts.reduce((n,c)=>n+(c.col===g&&c.qty>0&&c.destination==='warehouse'?c.qty:0),0);}
deliveryStock=function(b,g){return b.inputStock?.[g]||0;};
consumeDeliveryInput=function(b,g,qty){b.inputStock??={};b.inputStock[g]=Math.max(0,(b.inputStock[g]||0)-qty);OUTSTAT('cons',g,qty);};
deliverProduction=function(b,g,qty,target){const dest=target||warehouseTarget(b);if(!dest)return;OUTSTAT('prod',g,qty);G.carts.push({path:dest.path.slice(),t:0,col:g,qty,target:dest.b.id,source:b.id,destination:def(dest.b).kind==='wh'?'warehouse':'input'});};
function requestLogistics(dt){returnMarketSupply();G.logisticsClock=(G.logisticsClock||0)+dt;if(G.logisticsClock<2)return;G.logisticsClock=0;
 for(const b of G.blds){const d=def(b);if(!Object.keys(d.in||{}).length)continue;if(!b.conn||b.paused||b.fire>0)continue;const w=warehouseTarget(b);if(!w)continue;
  for(const [g,n] of Object.entries(d.in||{})){const need=Math.max(0,n*2-(b.inputStock?.[g]||0)-deliveryIncoming(b,g)),qty=Math.min(need,G.stock[g]||0);if(qty<=0)continue;G.stock[g]-=qty;G.carts.push({path:w.path.slice().reverse(),t:0,col:g,qty,target:b.id,source:w.b.id,destination:'input'});}
 }
}
advanceDeliveries=function(dt){const keep=[];for(const c of G.carts){if(!c.qty){c.t+=dt*3.2;if(c.t<c.path.length-1)keep.push(c);continue;}
 const target=G.byId.get(c.target),source=G.byId.get(c.source),touches=target&&ringCells(target).some(([x,y])=>INMAP(x,y)&&IDX(x,y)===c.path[c.path.length-1]);
 if(!touches||target.fire>0||c.path.some(k=>!G.road[k])){keep.push(c);continue;}
 c.t+=dt*3.2;if(c.t<c.path.length-1){keep.push(c);continue;}
 if(def(target).kind==='wh'){const qty=Math.min(c.qty,Math.max(0,capOf()-(G.stock[c.col]||0)));G.stock[c.col]=(G.stock[c.col]||0)+qty;c.qty-=qty;if(c.qty>1e-9)keep.push(c);}
 else{target.inputStock??={};target.inputStock[c.col]=(target.inputStock[c.col]||0)+c.qty;}
 }G.carts=keep;
};
function goodsBalance(g){if(G.dirty)rebuildNet();assignWorkforce(G);let production=0,demand=0;for(const b of G.blds){const d=def(b);if(b.type==='haus'&&b.conn&&b.fire<=0)demand+=(houseRates(b)[g]||0)*Math.max(1,b.pop);
 if(d.kind==='prod'&&b.conn&&!b.paused&&b.fire<=0&&productionLinked(b)){production+=(d.out?.[g]||0)*60/d.cycle*b.eff;demand+=(d.in?.[g]||0)*60/d.cycle*b.eff;}}
 return {production,demand,net:production-demand};
}
const logisticsStoreHTML=storeHTML;storeHTML=function(){return logisticsStoreHTML();};
// Reservierte Module sind eigene belegte Kacheln und können nicht überbaut werden.
const FIELD_RULES={farm:{type:'acker',count:40},hopfen:{type:'acker',count:32},weingut:{type:'acker',count:32},gewuerzfarm:{type:'acker',count:40},obsthof:{type:'acker',count:24},blumenhof:{type:'acker',count:24},schaefer:{type:'gehege',count:4},schweinehof:{type:'gehege',count:4},imkerei:{type:'blumenwiese',count:12}};
for(const [type,n] of [['acker','Ackerfläche'],['gehege','Tiergehege'],['blumenwiese','Blumenwiese']]){const size=type==='gehege'?2:1;B[type]={n,cat:'roh',kind:'field',w:size,h:size,cost:{},upk:0,req:0,d:'Reservierte Betriebsfläche. Gehört zu einem Betrieb im Umkreis von 24 Feldern.'};BUILD_SIZES[type]={w:size,h:size};mkB('b_'+type,size,size,0,s=>{yard(s,type==='acker'?'dirt':'grass');if(type==='acker'){for(let y=2;y<s.H-1;y+=4)P(s,R(1,y,s.W-2,2),RAMPS.field,()=>2);}else if(type==='gehege'){for(let x=1;x<32;x+=6)P(s,R(x,1,1,30),RAMPS.wood,()=>1);SHEEP(s,10,14);SHEEP(s,23,23);}else for(let i=0;i<8;i++)d(s,2+i*7%12,2+i*11%12,'#fff4b0');});}for(const type of Object.keys(FIELD_RULES)){B[type].fieldRule=FIELD_RULES[type];delete B[type].env;}
function fieldModules(b){return G.blds.filter(f=>f.fieldOwner===b.id&&f.type===FIELD_RULES[b.type]?.type);}
function assignFieldEfficiency(){for(const b of G.blds){const rule=FIELD_RULES[b.type];if(!rule)continue;b.envCount=fieldModules(b).filter(f=>f.fire<=0).length;b.envEff=Math.min(1,b.envCount/rule.count);b.eff=b.envEff*(b.staffEff??1);}}
const fieldWorkforce=assignWorkforce;assignWorkforce=function(g){if(g===G)assignFieldEfficiency();return fieldWorkforce(g);};
const fieldCanPlace=canPlace;canPlace=function(type,x,y){if(B[type]?.kind==='field'){const owner=G.byId.get(UI.fieldOwner),rule=owner&&FIELD_RULES[owner.type];if(!rule||rule.type!==type)return {ok:false,why:'Zuerst beim Betrieb „Betriebsflächen anlegen“ wählen.'};if(fieldModules(owner).length>=rule.count)return {ok:false,why:'Alle Betriebsflächen vorhanden'};if(Math.hypot(x+B[type].w/2-cx(owner),y+B[type].h/2-cy(owner))>24)return {ok:false,why:'Betriebsfläche muss innerhalb von 24 Feldern liegen'};}return fieldCanPlace(type,x,y);};
const fieldPlace=place;place=function(type,x,y){const r=fieldPlace(type,x,y);if(r.ok&&B[type].kind==='field')r.b.fieldOwner=UI.fieldOwner;return r;};
const fieldMove=canMoveBuilding;canMoveBuilding=function(b,x,y){const r=fieldMove(b,x,y);if(!r.ok)return r;if(b.fieldOwner){const owner=G.byId.get(b.fieldOwner);if(!owner||Math.hypot(x+b.w/2-cx(owner),y+b.h/2-cy(owner))>24)return {ok:false,why:'Außerhalb der Reichweite des zugehörigen Betriebs'};}if(FIELD_RULES[b.type]&&fieldModules(b).some(f=>Math.hypot(cx(f)-x-b.w/2,cy(f)-y-b.h/2)>24))return {ok:false,why:'Betriebsflächen würden außerhalb der Reichweite liegen'};return r;};
const fieldRemove=removeBld;removeBld=function(b,refund){if(FIELD_RULES[b.type])for(const f of fieldModules(b).slice())fieldRemove(f,false);fieldRemove(b,refund);};
const fieldPack=packIsland;packIsland=function(g){const result=fieldPack(g);result.blds.forEach(b=>{const original=g.byId.get(b.id);if(original.fieldOwner)b.fieldOwner=original.fieldOwner;});return result;};
const fieldRelevant=buildingRelevant;buildingRelevant=function(type){return B[type]?.kind!=='field'&&fieldRelevant(type);};
const fieldUnlocked=unlocked;unlocked=function(type){return B[type]?.kind==='field'?!!G.byId.get(UI.fieldOwner):fieldUnlocked(type);};
const fieldAct=winAct;winAct=function(id,ds){if(ds.act==='fields'){const b=G.byId.get(UI.sel);if(!b||!FIELD_RULES[b.type])return;UI.fieldOwner=b.id;setTool('build',FIELD_RULES[b.type].type);closeWin('info');return;}fieldAct(id,ds);};
const logisticsInfoHTML=infoHTML;infoHTML=function(){const b=G.byId.get(UI.sel);let h=logisticsInfoHTML();if(!b)return h;const d=def(b),rule=FIELD_RULES[b.type];if(rule)h+=`<div class="sect">Reservierte Betriebsflächen</div><p>${fieldModules(b).length} / ${rule.count} ${B[rule.type].n}</p><button class="btn" data-act="fields" ${fieldModules(b).length>=rule.count?'disabled':''}>${rule.type==='gehege'?'Gehege platzieren':'Feld platzieren'}</button>`;
 if(b.type==='haus')h+=`<section class="needgroup"><h3>Luxusbedürfnisse</h3>${Object.keys(TIERS[b.tier].luxury).map(g=>`<p>${chk(houseGoodSupplied(b,g))} ${ic(g,1)} ${GN[g].n} · ${((TIERS[b.tier].luxury[g])*Math.max(0,b.pop)).toFixed(3)} t/Min. · +${luxuryBonus(b,g).toFixed(1)} Gold/Min.</p>`).join('')}</section>`;
 return h;};
function roadReach(b,limit){const result=new Map(),q=[];for(const [x,y] of ringCells(b)){if(!INMAP(x,y))continue;const k=IDX(x,y);if(G.road[k]&&!result.has(k)){result.set(k,0);q.push(k);}}for(let i=0;i<q.length;i++){const k=q[i],distance=result.get(k);if(distance>=limit)continue;const x=k%MAPW,y=Math.floor(k/MAPW);for(const n of roadNeighbours(k)){if(!result.has(n)){result.set(n,distance+1);q.push(n);}}}return result;}
function drawLogisticsReach(ctx,b){const range=def(b).transportRange;if(!range)return;ctx.save();ctx.fillStyle='rgba(80,190,255,.45)';ctx.strokeStyle='#e9f8ff';ctx.setLineDash([3,2]);ctx.lineWidth=1;for(const [k] of roadReach(b,range)){const x=k%MAPW*16,y=Math.floor(k/MAPW)*16;ctx.fillRect(x,y,16,16);ctx.strokeRect(x+2,y+2,12,12);}ctx.restore();}
const logisticsGhost=drawGhost;drawGhost=function(ctx){if(['build','move'].includes(UI.tool)&&UI.type){const t=ghostTile();if(t){const d=buildingSize(UI.type,UI.rotation||0),b={...d,type:UI.type,x:t.x-Math.floor(d.w/2),y:t.y-Math.floor(d.h/2)};drawLogisticsReach(ctx,b);if(B[UI.type].kind==='field'){const owner=G.byId.get(UI.fieldOwner);if(owner)ring(ctx,cx(owner),cy(owner),24,'#f8edb0',true);}}}logisticsGhost(ctx);};
const logisticsDrawBld=drawBld;drawBld=function(ctx,b){if(UI.sel===b.id)drawLogisticsReach(ctx,b);logisticsDrawBld(ctx,b);};



const logisticsPortHTML=portHTML;portHTML=function(b){return logisticsPortHTML(b).replace(/ · Baugebiet \d+/g,'');};
const logisticsTutorialHTML=tutorialHTML;tutorialHTML=function(){return logisticsTutorialHTML()+'<p>Verbinde Betriebe über höchstens 36 Straßenfelder mit einem Lager oder Abnehmer. Märkte versorgen angeschlossene Häuser aus dem Inselvorrat. Wähle bei Feld- und Tierbetrieben „Betriebsflächen anlegen“.</p>';};
// Neue Aktionen verwenden vorhandene Tastaturwege (Gebäudeliste, Bauplatzliste und Escape).
const fieldShowSites=showSites;showSites=function(type){if(B[type]?.kind==='field'&&UI.fieldOwner){setTool('build',type);}fieldShowSites(type);};


const fieldSitesAct=winAct;winAct=function(id,ds){if(ds.act==='field-sites'){const b=G.byId.get(UI.sel);if(!b||!FIELD_RULES[b.type])return;UI.fieldOwner=b.id;showSites(FIELD_RULES[b.type].type);return;}fieldSitesAct(id,ds);};
// Nach Abriss oder Straßenunterbrechung bleibt Fracht an ihrem tatsächlichen Ort.
function recoverCartPath(c){const position=c.path[Math.min(c.path.length-1,Math.floor(c.t))];if(!G.road[position])return null;const ends=new Map();for(const w of whList())for(const [x,y] of ringCells(w))if(INMAP(x,y)&&G.road[IDX(x,y)])ends.set(IDX(x,y),w);const queue=[position],prev=new Map([[position,-1]]);let end=-1;
 for(let i=0;i<queue.length;i++){const k=queue[i];if(ends.has(k)){end=k;break;}const x=k%MAPW,y=Math.floor(k/MAPW);for(const n of roadNeighbours(k)){if(!prev.has(n)){prev.set(n,k);queue.push(n);}}}
 if(end<0)return null;const path=[];for(let k=end;k>=0;k=prev.get(k))path.push(k);return {b:ends.get(end),path:path.reverse()};
}
const recoverDeliveries=advanceDeliveries;advanceDeliveries=function(dt){for(const c of G.carts){if(!c.qty)continue;const target=G.byId.get(c.target);if(!target||target.fire>0||!ringCells(target).some(([x,y])=>INMAP(x,y)&&IDX(x,y)===c.path[c.path.length-1])||c.path.some(k=>!G.road[k])){const destination=recoverCartPath(c);if(destination){c.target=destination.b.id;c.destination='warehouse';c.path=destination.path;c.t=0;}}}recoverDeliveries(dt);};

// Bestehende Bauern- und Tierbetriebe erhalten freie Betriebsflächen ohne neue Baukosten.
const fieldLoadGame=loadGame;loadGame=function(){let saved;try{saved=JSON.parse(localStorage.getItem(SAVEKEY));}catch{}const ok=fieldLoadGame();if(!ok||saved?.fieldModulesVersion>=2)return ok;const current=G,island=activeIsland,previousOwner=UI.fieldOwner;
 for(let i=0;i<WORLD.islands.length;i++){const g=WORLD.islands[i];if(!g)continue;G=g;activeIsland=i;if(saved?.fieldModulesVersion===1)for(const f of g.blds.slice()){if(!f.fieldOwner||B[f.type].w!==1)continue;UI.fieldOwner=f.fieldOwner;for(const [dx,dy] of [[1,0],[0,1],[1,1]])if(canPlace(f.type,f.x+dx,f.y+dy).ok)place(f.type,f.x+dx,f.y+dy);}for(const b of g.blds.slice()){const rule=FIELD_RULES[b.type];if(!rule)continue;UI.fieldOwner=b.id;const sites=[];for(let y=b.y-24;y<=b.y+24;y++)for(let x=b.x-24;x<=b.x+24;x++)if(canPlace(rule.type,x,y).ok)sites.push({x,y,d:Math.hypot(x+1-cx(b),y+1-cy(b))});sites.sort((a,b)=>a.d-b.d||a.y-b.y||a.x-b.x);for(const site of sites){if(fieldModules(b).length>=rule.count)break;if(canPlace(rule.type,site.x,site.y).ok)place(rule.type,site.x,site.y);}}rebuildNet();}
 G=current;activeIsland=island;UI.fieldOwner=previousOwner;G.dirty=true;rebuildNet();return true;
};


/* Größere Grundflächen; Felder bleiben 1×1, Tiergehege erhalten 2×3. */
const BASE_GEOMETRY=Object.fromEntries(Object.entries(B).map(([type,d])=>[type,{w:d.w,h:d.h,r:d.r,range:d.transportRange,env:d.env?{...d.env}:null}]));
const BASE_BUILDING_ART=Object.fromEntries(Object.entries(SPB).map(([name,meta])=>[name,{image:SP[name],meta:{...meta}}]));
let BUILDING_SCALE=1.5,TERRAIN_BASE_SIZE=null;
function configureBuildingScale(factor){BUILDING_SCALE=factor;for(const [type,base] of Object.entries(BASE_GEOMETRY)){const d=B[type],w=d.kind==='field'?base.w:Math.ceil(base.w*factor),h=d.kind==='field'?(type==='gehege'?3:base.h):['farm','brauerei','gewuerzfarm'].includes(type)?Math.round(base.h*factor*8/9):Math.ceil(base.h*factor);d.w=w;d.h=h;BUILD_SIZES[type]={w,h};if(base.r)d.r=Math.ceil(base.r*factor);if(base.range)d.transportRange=Math.ceil(base.range*factor);if(base.env)d.env={...base.env,r:Math.ceil(base.env.r*factor)};}
 for(const [name,entry] of Object.entries(BASE_BUILDING_ART)){if(!name.startsWith('b_')||name.includes('_rotation'))continue;let type=Object.keys(B).sort((a,b)=>b.length-a.length).find(t=>name.startsWith('b_'+t));if(!type)continue;const base=BASE_GEOMETRY[type],d=B[type],sx=d.w/base.w,sy=d.h/base.h,image=document.createElement('canvas');image.width=Math.round(entry.image.width*sx);image.height=Math.round(entry.image.height*sy);const context=image.getContext('2d');context.imageSmoothingEnabled=false;context.drawImage(entry.image,0,0,image.width,image.height);SP[name]=image;SPB[name]={...entry.meta,W:image.width,H:image.height,tw:d.w,th:d.h,ex:Math.round(entry.meta.ex*sy),hub:entry.meta.hub?.map((v,i)=>v*(i?sy:sx))||null,smoke:entry.meta.smoke?.map((v,i)=>v*(i?sy:sx))||null};}
 for(const name of Object.keys(SP))if(name.includes('_rotation')){delete SP[name];delete SPB[name];}freeNodeCache.clear();
}
function packFogCells(cells){const runs=[];let value=cells[0]||0,count=0;for(const next of cells){if(next===value)count++;else{runs.push(count,value);value=next;count=1;}}if(count)runs.push(count,value);return {encoding:'rle',length:cells.length,runs};}
function unpackFogRLE(saved){if(saved?.encoding!=='rle')return Uint8Array.from(saved||[]);const cells=new Uint8Array(saved.length);let offset=0;for(let i=0;i<saved.runs.length;i+=2){cells.fill(saved.runs[i+1],offset,offset+saved.runs[i]);offset+=saved.runs[i];}return cells;}
const largeRestoreFog=restoreFogCells;restoreFogCells=function(saved){return saved?.encoding==='rle'?unpackFogRLE(saved):largeRestoreFog(saved);};
const largeLocalTerrain=localTerrain;localTerrain=function(seed,profile,style){if(!TERRAIN_BASE_SIZE)return largeLocalTerrain(seed,profile,style);const size=ISLAND_SIZE,scale=size/TERRAIN_BASE_SIZE;ISLAND_SIZE=TERRAIN_BASE_SIZE;let original;try{original=largeLocalTerrain(seed,profile,style);}finally{ISLAND_SIZE=size;}const result={tiles:new Uint8Array(size*size),fish:new Uint8Array(size*size),massif:new Uint8Array(size*size)};for(let y=0;y<size;y++)for(let x=0;x<size;x++){const from=Math.floor(y/scale)*TERRAIN_BASE_SIZE+Math.floor(x/scale),to=y*size+x;for(const key of ['tiles','fish','massif'])result[key][to]=original[key][from];}return result;};
// Ein begrenzter Geländecache verhindert sehr große Canvas-Flächen pro Insel.
const LAND_CHUNK=16,LAND_CACHE_LIMIT=128;
buildLand=function(){if(land?._tiles===G.tiles)return;land={_tiles:G.tiles,parts:[],chunks:new Map()};mmBase=document.createElement('canvas');mmBase.width=MAPW;mmBase.height=MAPH;const context=mmBase.getContext('2d'),image=context.createImageData(MAPW,MAPH),colors=[[31,79,134],[61,131,192],[216,194,122],[90,154,60],[47,106,42],[122,129,144],[160,96,60]];for(let k=0;k<G.tiles.length;k++){const color=colors[G.tiles[k]],p=k*4;image.data[p]=color[0];image.data[p+1]=color[1];image.data[p+2]=color[2];image.data[p+3]=255;}context.putImageData(image,0,0);};
function terrainChunk(chunkX,chunkY){const key=chunkX+':'+chunkY;let image=land.chunks.get(key);if(image){land.chunks.delete(key);land.chunks.set(key,image);return image;}const minX=chunkX*LAND_CHUNK,minY=chunkY*LAND_CHUNK,maxX=Math.min(MAPW-1,minX+LAND_CHUNK-1),maxY=Math.min(MAPH-1,minY+LAND_CHUNK-1);image=document.createElement('canvas');image.width=(maxX-minX+1)*32;image.height=(maxY-minY+1)*32;const g=image.getContext('2d');g.scale(2,2);g.imageSmoothingEnabled=false; const tt=(x,y)=>INMAP(x,y)?G.tiles[IDX(x,y)]:T.DEEP;
 const isW=t=>t<=T.SHAL,isR=t=>t===T.ROCK||t===T.ORE;
 for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
  const t=tt(x,y),px=(x-minX)*16,py=(y-minY)*16;
  if(t===T.SHAL){g.fillStyle='rgba(140,220,235,.20)';g.fillRect(px,py,16,16);if(G.fish[IDX(x,y)]){}continue}
  if(t===T.DEEP)continue;
  const v=hs(x,y,77);let img;
  if(t===T.SAND)img=SP['sand'+Math.floor(v*3)];else if(t===T.ROCK)img=SP['rock'+Math.floor(hs(x,y,G.seed)*4)];else if(t===T.ORE)img=SP.ore;else img=landscapeGrassSprite(x,y,t===T.FOREST);
  if(isR(t)){g.drawImage(landscapeGrassSprite(x,y),px,py);g.save();clipRockTile(g,x,y,px,py);}
  g.drawImage(img,px,py);
  if(t===T.GRASS||t===T.FOREST){const shade=fbm(WORLD?.rootSeed||G.seed,x/11,y/11);g.fillStyle=shade>.6?'rgba(216,211,109,.12)':shade<.4?'rgba(13,61,35,.16)':'rgba(0,0,0,0)';g.fillRect(px,py,16,16);if(t===T.GRASS&&hs(x,y,G.seed+84)<.06){g.fillStyle='#b5be73';g.fillRect(px+4,py+8,2,1);g.fillRect(px+11,py+5,1,1)}}
  if(isR(t)){
   if(!isR(tt(x,y+1))){g.fillStyle='rgba(20,22,30,.55)';g.fillRect(px,py+12,16,4);g.fillStyle='rgba(20,22,30,.3)';g.fillRect(px,py+10,16,2)}
   if(!isR(tt(x,y-1))){g.fillStyle='rgba(255,255,255,.22)';g.fillRect(px,py,16,2)}
   if(!isR(tt(x-1,y))){g.fillStyle='rgba(255,255,255,.12)';g.fillRect(px,py,2,16)}
   if(!isR(tt(x+1,y))){g.fillStyle='rgba(0,0,0,.25)';g.fillRect(px+14,py,2,16)}
   drawMountainTerrace(g,x,y,px,py);
   g.restore();
  }
  // Uferlinien
  const sh=(dx,dy)=>isW(tt(x+dx,y+dy));
  g.fillStyle='rgba(60,45,20,.38)';
  if(sh(0,-1))g.fillRect(px,py,16,2);if(sh(0,1))g.fillRect(px,py+14,16,2);if(sh(-1,0))g.fillRect(px,py,2,16);if(sh(1,0))g.fillRect(px+14,py,2,16);
 }
 // Schaum auf dem Wasser neben dem Land
 for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
  const t=tt(x,y);if(!isW(t))continue;const px=(x-minX)*16,py=(y-minY)*16;
  const L=(dx,dy)=>{const q=tt(x+dx,y+dy);return !isW(q)};
  g.fillStyle='rgba(255,255,255,.55)';
  for(let i=0;i<16;i++){
   const o=hs(x*16+i,y,5)<.22?0:1;if(!o)continue;
   if(L(0,-1))g.fillRect(px+i,py+(i%5===0?1:0),1,2);
   if(L(0,1))g.fillRect(px+i,py+14+(i%4===0?-1:0),1,2);
   if(L(-1,0))g.fillRect(px+(i%5===0?1:0),py+i,2,1);
   if(L(1,0))g.fillRect(px+14+(i%4===0?-1:0),py+i,2,1);
  }
 }

 land.chunks.set(key,image);while(land.chunks.size>LAND_CACHE_LIMIT)land.chunks.delete(land.chunks.keys().next().value);return image;
}
drawLandRegion=function(ctx,x0,y0,x1,y1){if(!land||land._tiles!==G.tiles)buildLand();const size=LAND_CHUNK*16;for(let y=Math.max(0,Math.floor(y0/size));y<=Math.min(Math.ceil(MAPH/LAND_CHUNK)-1,Math.floor(y1/size));y++)for(let x=Math.max(0,Math.floor(x0/size));x<=Math.min(Math.ceil(MAPW/LAND_CHUNK)-1,Math.floor(x1/size));x++){const image=terrainChunk(x,y);nativeDrawImage.call(ctx,image,x*size,y*size,image.width/2,image.height/2);}};
configureBuildingScale(1.5);


const largeLimitBeaches=limitBeaches;limitBeaches=function(tiles,seed){if(!TERRAIN_BASE_SIZE)return largeLimitBeaches(tiles,seed);const size=ISLAND_SIZE,base=TERRAIN_BASE_SIZE,scale=size/base,source=new Uint8Array(base*base);for(let y=0;y<base;y++)for(let x=0;x<base;x++)source[y*base+x]=tiles[Math.floor(y*scale)*size+Math.floor(x*scale)];const width=B.kontor.w,height=B.kontor.h;let beaches;ISLAND_SIZE=base;B.kontor.w=3;B.kontor.h=3;try{beaches=largeLimitBeaches(source,seed);}finally{ISLAND_SIZE=size;B.kontor.w=width;B.kontor.h=height;}for(let y=0;y<size;y++)for(let x=0;x<size;x++)tiles[y*size+x]=source[Math.floor(y/scale)*base+Math.floor(x/scale)];return beaches.map(b=>({x:Math.round(b.x*scale),y:Math.round(b.y*scale)}));};
function migrateGeometry(saved){const scale=2,oldW=saved.mapWidth||896,oldH=saved.mapHeight||672,newW=oldW*scale;const index=k=>Math.floor(k/oldW)*scale*newW+k%oldW*scale;
 saved.terrainBaseSize=saved.islandSize||112;saved.mapWidth=newW;saved.mapHeight=oldH*scale;saved.islandSize=saved.terrainBaseSize*scale;saved.geometryVersion=3;saved.geometryScale=1.5;
 if(saved.layout)for(const m of saved.layout){for(const key of ['ox','oy','wx','wy'])if(Number.isFinite(m[key]))m[key]*=scale;}
 for(const island of saved.islands||[]){if(!island)continue;const roads=new Set(),stone=new Set();for(const k of island.roads||[])for(let y=0;y<scale;y++)for(let x=0;x<scale;x++)roads.add(index(k)+y*newW+x);for(const k of island.stoneRoads||[])for(let y=0;y<scale;y++)for(let x=0;x<scale;x++)stone.add(index(k)+y*newW+x);
  for(const b of island.blds||[]){const base=BASE_GEOMETRY[b.type];b.x*=scale;b.y*=scale;if(!base||B[b.type].kind==='field')continue;const old= b.rotation%2?{w:base.h,h:base.w}:base,newSize=buildingSize(b.type,b.rotation||0);
   for(let y=b.y;y<b.y+newSize.h;y++)if(roads.has(y*newW+b.x+old.w*scale))for(let x=b.x+newSize.w;x<b.x+old.w*scale;x++)roads.add(y*newW+x);
   for(let x=b.x;x<b.x+newSize.w;x++)if(roads.has((b.y+old.h*scale)*newW+x))for(let y=b.y+newSize.h;y<b.y+old.h*scale;y++)roads.add(y*newW+x);
  }
  island.roads=[...roads];island.stoneRoads=[...stone];island.deposits=[];island.ship=null;
  for(const c of island.carts||[]){const path=[];for(let i=0;i<c.path.length;i++){path.push(index(c.path[i]));if(i<c.path.length-1){const delta=c.path[i+1]-c.path[i];path.push(index(c.path[i])+(Math.abs(delta)===1?Math.sign(delta):Math.sign(delta)*newW));}}c.path=path;c.t=(c.t||0)*scale;}
 }
 if(saved.fog?.cells){const old=unpackFogRLE(saved.fog.cells),full=old.length===oldW*oldH,cells=new Uint8Array(newW*oldH*scale);for(let y=0;y<oldH*scale;y++)for(let x=0;x<newW;x++){const value=full?old[Math.floor(y/scale)*oldW+Math.floor(x/scale)]:old[Math.floor(y/(scale*4))*(oldW/4)+Math.floor(x/(scale*4))]?255:0;cells[y*newW+x]=value;}saved.fog.cells=packFogCells(cells);}
 for(const ship of saved.fleet||[]){if(ship.anchor){ship.anchor.x*=scale;ship.anchor.y*=scale;}if(ship.manualTrip){ship.manualTrip.path=ship.manualTrip.path.map(p=>p.map(v=>v*scale));ship.manualTrip.duration*=scale;ship.manualTrip.remaining*=scale;}if(ship.remaining)ship.remaining*=scale;}
 return saved;
}
const geometryLoadGame=loadGame;loadGame=function(){const original=localStorage.getItem(SAVEKEY);let saved;try{saved=JSON.parse(original);}catch{return geometryLoadGame();}if(!saved)return geometryLoadGame();configureBuildingScale(saved.geometryScale||1.5);TERRAIN_BASE_SIZE=saved.terrainBaseSize||null;let migrated=false;
 if(saved.v>=6&&saved.geometryVersion!==3){saved=migrateGeometry(saved);TERRAIN_BASE_SIZE=saved.terrainBaseSize;localStorage.setItem(SAVEKEY,JSON.stringify(saved));migrated=true;}
 try{return geometryLoadGame();}finally{if(migrated)localStorage.setItem(SAVEKEY,original);}
};

const fieldBubble=bubbleFor;bubbleFor=function(b){return B[b.type].kind==='field'?null:fieldBubble(b);};
/* Zwei Straßenstufen mit transparentem Rand und abgerundeten Kurven. */
function roadCenterline(mask){const arms=[[8,-4],[20,8],[8,20],[-4,8]].filter((p,i)=>mask&(1<<i));if(arms.length===2&&mask!==5&&mask!==10){const a=arms[0],b=arms[1],inner=p=>[8+(p[0]-8)/4,8+(p[1]-8)/4],first=inner(a),last=inner(b),points=[a,first];for(let i=1;i<=16;i++){const t=i/16,u=1-t;points.push([u*u*first[0]+2*u*t*8+t*t*last[0],u*u*first[1]+2*u*t*8+t*t*last[1]]);}points.push(b);return points.slice(1).map((p,i)=>[points[i],p]);}return arms.length?arms.map(p=>[[8,8],p]):[[[8,8],[8,8]]];}
function roadDistance(x,y,segments){let best=Infinity;for(const [a,b] of segments){const dx=b[0]-a[0],dy=b[1]-a[1],length=dx*dx+dy*dy,t=length?clamp(((x-a[0])*dx+(y-a[1])*dy)/length,0,1):0;best=Math.min(best,Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy));}return best;}
function makeRoadSprite(mask,stone){const canvas=document.createElement('canvas');canvas.width=canvas.height=16;const context=canvas.getContext('2d'),pixels=context.createImageData(16,16),segments=roadCenterline(mask);for(let y=0;y<16;y++)for(let x=0;x<16;x++){const distance=roadDistance(x+.5,y+.5,segments),outer=stone?5.3:6.3,inner=stone?4.5:3.1,fade=clamp((outer-distance)/(outer-inner),0,1),alpha=fade*fade*(3-2*fade);if(!alpha)continue;const p=(y*16+x)*4,noise=hs(x,y,913)*2-1;let color;if(stone){const row=Math.floor(y/4),offset=row%2?2:0,col=(x+offset)%4,py=y%4,mortar=col===3||py===3,light=py===0?12:col===0?7:0,corner=(py===0||py===2)&&(col===0||col===2),tone=mortar?91:corner?114:137+Math.round(noise*14)+light;color=[tone,tone+2,tone+3];}else{const tone=Math.round(noise*9),worn=distance<1?4:0;color=[190+tone+worn,159+tone+worn,115+tone+worn];}pixels.data[p]=color[0];pixels.data[p+1]=color[1];pixels.data[p+2]=color[2];pixels.data[p+3]=Math.round(alpha*255);}context.putImageData(pixels,0,0);return canvas;}
for(let mask=0;mask<16;mask++){SP['road'+mask]=makeRoadSprite(mask,false);SP['stoneroad'+mask]=makeRoadSprite(mask,true);}


const fieldPaintCell=paintCell;paintCell=function(x,y){if(UI.tool==='build'&&B[UI.type]?.kind==='field'&&B[UI.type].w===1){if(!INMAP(x,y)||G.occ[IDX(x,y)]||G.road[IDX(x,y)])return;const result=place(UI.type,x,y);UI.paintFail=result.ok?'':result.why;updateHint();return;}fieldPaintCell(x,y);};






