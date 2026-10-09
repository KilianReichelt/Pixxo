/* Wissen und Forschung sind jeweils an eine Insel gebunden. */
B.forschung={n:'Forschungsstube',cat:'dienst',kind:'research',w:Math.ceil(2*BUILDING_SCALE),h:Math.ceil(2*BUILDING_SCALE),max:1,req:40,cost:{gold:1000,bretter:12,stein:10},upk:20,knowledgeRange:30,d:'Einmal je Insel. Erzeugt Wissen aus Einwohnern, die über höchstens 30 Straßenfelder erreichbar sind. Forschung verbessert die gesamte Insel.'};
BASE_GEOMETRY.forschung={w:2,h:2};BUILD_SIZES.forschung={w:B.forschung.w,h:B.forschung.h};BUILD_TIER.forschung=1;
GN.wissen={id:'wissen',n:'Wissen',transportable:false};
const RESEARCH_BRANCHES=[['religion','Religion'],['fire','Brandschutz'],['market','Marktversorgung'],['logistics','Logistik'],['production','Produktion'],['knowledge','Wissenschaft']];
const RESEARCH_NODES=[
 {id:'grundlagen',name:'Geordnete Aufzeichnungen',branch:'root',requires:[],gold:150,wissen:1200,time:300,effect:{},description:'Eröffnet alle sechs Forschungszweige.'},
 {id:'seelsorge',name:'Seelsorge',branch:'religion',requires:['grundlagen'],gold:250,wissen:2000,time:1200,effect:{kapelle:15},description:'Kapellenreichweite +15 %.'},
 {id:'gemeinden',name:'Gemeindeverbindungen',branch:'religion',requires:['seelsorge'],gold:500,wissen:4500,time:3600,effect:{kapelle:15,kirche:15},description:'Kapellen- und Kirchenreichweite jeweils +15 %.'},
 {id:'glocken',name:'Glockennetz',branch:'religion',requires:['gemeinden','marktwege'],gold:900,wissen:9000,time:10800,effect:{kapelle:20,kirche:20},description:'Kapellen- und Kirchenreichweite jeweils +20 %.'},
 {id:'brandwachen',name:'Brandwachen',branch:'fire',requires:['grundlagen'],gold:250,wissen:2000,time:1200,effect:{feuer:15},description:'Feuerwehrreichweite +15 %.'},
 {id:'loeschzuege',name:'Löschzüge',branch:'fire',requires:['brandwachen'],gold:500,wissen:4500,time:3600,effect:{feuer:20},description:'Feuerwehrreichweite +20 %.'},
 {id:'alarmnetz',name:'Alarmnetz',branch:'fire',requires:['loeschzuege','karten'],gold:900,wissen:9000,time:10800,effect:{feuer:25},description:'Feuerwehrreichweite +25 %.'},
 {id:'marktwege',name:'Marktwege',branch:'market',requires:['grundlagen'],gold:250,wissen:2000,time:1200,effect:{markt:15},description:'Marktreichweite +15 %.'},
 {id:'boten',name:'Botenwesen',branch:'market',requires:['marktwege'],gold:500,wissen:4500,time:3600,effect:{markt:20},description:'Marktreichweite +20 %.'},
 {id:'handelsplaetze',name:'Handelsplätze',branch:'market',requires:['boten','umschlag'],gold:900,wissen:9000,time:10800,effect:{markt:15},description:'Marktreichweite +15 %.'},
 {id:'karten',name:'Straßenkarten',branch:'logistics',requires:['grundlagen'],gold:250,wissen:2000,time:1200,effect:{transport:20},description:'Transportreichweite aller Produktionsbetriebe +20 %.'},
 {id:'umschlag',name:'Umschlagplanung',branch:'logistics',requires:['karten'],gold:500,wissen:4500,time:3600,effect:{transport:20},description:'Transportreichweite aller Produktionsbetriebe +20 %.'},
 {id:'fernwege',name:'Fernwege',branch:'logistics',requires:['umschlag'],gold:900,wissen:9000,time:10800,effect:{transport:30},description:'Transportreichweite aller Produktionsbetriebe +30 %.'},
 {id:'handwerk',name:'Handwerkslehre',branch:'production',requires:['grundlagen'],gold:250,wissen:2000,time:1200,effect:{production:5},description:'Produktionsgeschwindigkeit aller Betriebe +5 %.'},
 {id:'normen',name:'Einheitliche Werkzeuge',branch:'production',requires:['handwerk'],gold:500,wissen:4500,time:3600,effect:{production:5},description:'Produktionsgeschwindigkeit aller Betriebe +5 %.'},
 {id:'meister',name:'Meisterausbildung',branch:'production',requires:['normen','studien'],gold:900,wissen:9000,time:10800,effect:{production:10},description:'Produktionsgeschwindigkeit aller Betriebe +10 %.'},
 {id:'studien',name:'Studienkreise',branch:'knowledge',requires:['grundlagen'],gold:250,wissen:2000,time:1200,effect:{knowledge:20},description:'Wissenserzeugung +20 %.'},
 {id:'bibliotheken',name:'Wanderbibliotheken',branch:'knowledge',requires:['studien'],gold:500,wissen:4500,time:3600,effect:{knowledgeRange:20},description:'Straßenreichweite der Forschungsstube +20 %.'},
 {id:'akademie',name:'Inselakademie',branch:'knowledge',requires:['bibliotheken'],gold:900,wissen:9000,time:10800,effect:{knowledge:30,knowledgeRange:20},description:'Wissenserzeugung +30 % und Straßenreichweite +20 %.'}
];
const RESEARCH_BY_ID=new Map(RESEARCH_NODES.map(n=>[n.id,n])),RESEARCH_EFFECT_CACHE=new WeakMap(),KNOWLEDGE_SOURCE_CACHE=new WeakMap();
function islandResearch(g=G){g.research??={wissen:0,done:[],active:null};g.research.wissen=Math.max(0,Number(g.research.wissen)||0);g.research.done??=[];const active=g.research.active,node=RESEARCH_BY_ID.get(active?.id);if(active&&node&&!active.duration){const oldDuration={300:30,1200:60,3600:90,10800:120}[node.time];if(active.remaining<=oldDuration)active.remaining=Math.max(0,active.remaining)*node.time/oldDuration;active.duration=node.time;}return g.research;}
function researchEffects(g=G){
 const state=islandResearch(g),old=RESEARCH_EFFECT_CACHE.get(g);if(old?.array===state.done&&old.length===state.done.length)return old.effects;
 const effects={};for(const id of state.done)for(const [key,n] of Object.entries(RESEARCH_BY_ID.get(id)?.effect||{}))effects[key]=(effects[key]||0)+n;
 RESEARCH_EFFECT_CACHE.set(g,{array:state.done,length:state.done.length,effects,definitions:new Map()});return effects;
}
const researchBaseDef=def;def=function(b){
 const original=researchBaseDef(b),g=WORLD?.islands[b.island??Math.floor(b.id/100000)]||G;if(!g)return original;
 const effects=researchEffects(g),range=effects[b.type]||0,transport=original.kind==='prod'?effects.transport||0:0,production=original.kind==='prod'?effects.production||0:0;
 if(!range&&!transport&&!production)return original;
 const cache=RESEARCH_EFFECT_CACHE.get(g).definitions,key=[b.type,original.r,original.transportRange,original.cycle,original.w,original.h].join(':');if(cache.has(key))return cache.get(key);
 const d={...original};if(range&&original.r)d.r=Math.ceil(original.r*(1+range/100));if(transport&&original.transportRange)d.transportRange=Math.ceil(original.transportRange*(1+transport/100));if(production&&original.cycle)d.cycle=original.cycle/(1+production/100);cache.set(key,d);return d;
};
function researchBuilding(g=G){return g.blds.find(b=>b.type==='forschung');}
function researchOperating(g=G){const b=researchBuilding(g);return !!b&&b.conn&&!b.paused&&b.fire<=0;}
function knowledgeCoverage(g=G){
 const b=researchBuilding(g);if(!b)return {population:0,rate:0,range:30,houses:0,buildings:[]};
 const effects=researchEffects(g),range=Math.ceil(B.forschung.knowledgeRange*(1+(effects.knowledgeRange||0)/100)),key=[g.researchNetworkRevision||0,b.id,b.x,b.y,range].join(':'),old=KNOWLEDGE_SOURCE_CACHE.get(g);let houses;
 if(old?.key===key)houses=old.houses;else{
  const distance=new Map(),queue=[];for(const [x,y] of ringCells(b))if(INMAP(x,y)&&g.road[IDX(x,y)]){const k=IDX(x,y);if(!distance.has(k)){distance.set(k,0);queue.push(k);}}
  for(let head=0;head<queue.length;head++){const k=queue[head],depth=distance.get(k);if(depth>=range)continue;const x=k%MAPW,y=Math.floor(k/MAPW);for(const n of roadNeighbours(k,g)){const next=depth+Math.hypot(n%MAPW-k%MAPW,Math.floor(n/MAPW)-Math.floor(k/MAPW));if(next<=range&&(!distance.has(n)||distance.get(n)>next)){distance.set(n,next);queue.push(n);}}}
  houses=g.blds.filter(h=>h.type==='haus'&&ringCells(h).some(([x,y])=>INMAP(x,y)&&distance.has(IDX(x,y))));KNOWLEDGE_SOURCE_CACHE.set(g,{key,houses});
 }
 const population=houses.reduce((sum,h)=>sum+(h.fire>0?0:Math.floor(h.pop||0)),0),rate=researchOperating(g)?houses.reduce((sum,h)=>sum+(h.fire>0?0:Math.floor(h.pop||0)*h.tier/5),0)*(1+(effects.knowledge||0)/100):0;return {population,rate,range,houses:houses.length,buildings:houses};
}
const researchRebuild=rebuildNet;rebuildNet=function(){researchRebuild();G.researchNetworkRevision=(G.researchNetworkRevision||0)+1;};
function startResearch(id,g=G){
 const node=RESEARCH_BY_ID.get(id),state=islandResearch(g);if(!node)return 'Diese Forschung gibt es nicht.';
 if(!researchOperating(g))return 'Eine betriebsbereite Forschungsstube mit Straßenanschluss wird benötigt.';
 if(state.active)return 'Auf dieser Insel läuft bereits eine Forschung.';if(state.done.includes(id))return 'Diese Forschung ist bereits abgeschlossen.';
 if(node.requires.some(parent=>!state.done.includes(parent)))return 'Zuerst müssen alle Voraussetzungen erforscht werden.';
 if(G.gold<node.gold||state.wissen<node.wissen)return 'Gold oder Wissen fehlen.';
 G.gold-=node.gold;for(const island of WORLD.islands)if(island&&!island.cpu)island.gold=G.gold;state.wissen-=node.wissen;state.active={id,remaining:node.time,duration:node.time};return true;
}
const researchStep=step;step=function(dt){
 researchStep(dt);const state=islandResearch(G);if(!researchOperating(G))return;state.wissen+=knowledgeCoverage(G).rate*dt/60;
 if(!state.active)return;const node=RESEARCH_BY_ID.get(state.active.id);if(!node){state.active=null;return;}
 state.active.remaining=Math.max(0,state.active.remaining-dt);if(state.active.remaining===0){state.done.push(node.id);state.active=null;G.dirty=true;msg(ISLANDS[G.island].name+': '+node.name+' erforscht.','wissen');}
};
const researchPackIsland=packIsland;packIsland=function(g){return {...researchPackIsland(g),research:islandResearch(g)};};
const researchUnpackIsland=unpackIsland;unpackIsland=function(...args){const g=researchUnpackIsland(...args);g.research=args[0].research||{wissen:0,done:[],active:null};g.dirty=true;return g;};
function researchDuration(seconds){
 const total=Math.max(0,Math.ceil(Number(seconds)||0)),hours=Math.floor(total/3600),minutes=Math.floor(total%3600/60),rest=total%60;
 return [hours?hours+' Std.':'',minutes?minutes+' Min.':'',rest?rest+' Sek.':''].filter(Boolean).join(' ')||'0 Sek.';
}
function knowledgeTopHTML(){
 const islands=(WORLD?.islands||[G]).filter(Boolean);let total=0,rate=0;
 for(const g of islands){total+=Math.max(0,Number(g.research?.wissen)||0);rate+=knowledgeCoverage(g).rate;}
 if(total<=0&&rate<=0)return '';
 return `<button type="button" class="chip knowledge" data-research-building aria-label="Forschungsstube öffnen. Gesamtwissen: ${Math.floor(total)}. Erzeugung: ${rate.toFixed(1)} pro Minute." title="Gesamter Wissensvorrat aller Inseln. Forschung verwendet den Vorrat ihrer jeweiligen Insel.">${ic('wissen',2)}<span><b>${fmt(Math.floor(total))} Wissen</b><span class="rate">+${rate.toFixed(1)} / Min.</span></span></button>`;
}
function openResearchBuilding(){
 const view=UI.viewedIsland??activeIsland,islands=WORLD?.islands||[],candidates=[view,activeIsland,...islands.map((g,i)=>i)];
 for(const i of new Set(candidates)){const g=islands[i],b=g&&researchBuilding(g);if(!b)continue;if(i!==activeIsland)activateIsland(i);selectB(b.id);return true;}
 msg('Baue eine Forschungsstube.','i_alert');return false;
}
function researchHTML(i){
 const g=WORLD.islands[i];if(!g)return '<p>Diese Insel ist noch nicht besiedelt.</p>';
 const state=islandResearch(g),coverage=knowledgeCoverage(g),active=RESEARCH_BY_ID.get(state.active?.id),operating=researchOperating(g);
 const card=node=>{const done=state.done.includes(node.id),running=state.active?.id===node.id,parents=node.requires.map(id=>RESEARCH_BY_ID.get(id)),ready=parents.every(p=>state.done.includes(p.id)),enabled=operating&&!state.active&&!done&&ready&&G.gold>=node.gold&&state.wissen>=node.wissen;
  return `<article class="research-node ${done?'researched':running?'researching':''}"><h4>${node.name}</h4><p>${node.description}</p><p class="research-cost">${ic('gold',1)} ${node.gold} Gold · ${ic('wissen',1)} ${node.wissen} Wissen · ${researchDuration(node.time)}</p>${done?'<p class="research-state">✓ Erforscht</p>':running?`<p class="research-state">In Arbeit · ${researchDuration(state.active.remaining)}</p>`:`<button class="btn" data-act="research-start" data-research="${node.id}" data-island="${i}" ${enabled?'':'disabled'}>${ready?'Erforschen':'Voraussetzung fehlt'}</button>`}</article>`;
 };
 return `<h2 class="research-island" tabindex="-1">${esc(ISLANDS[i].name)}</h2><div class="research-summary"><strong>${ic('wissen',2)} ${Math.floor(state.wissen)} Wissen</strong><span>+${coverage.rate.toFixed(1)} / Min.</span><span>${coverage.population} Einwohner · ${coverage.range} Straßenfelder</span></div><p role="status">${operating?(active?active.name+' · '+researchDuration(state.active.remaining)+' verbleibend.':'Keine Forschung in Arbeit.'):'Verbinde eine aktive Forschungsstube über Straßen mit deinen Häusern.'}</p><div class="research-root">${card(RESEARCH_NODES[0])}</div><div class="research-tree">${RESEARCH_BRANCHES.map(([branch,name])=>`<section class="research-branch"><h3>${name}</h3>${RESEARCH_NODES.filter(n=>n.branch===branch).map(card).join('')}</section>`).join('')}</div>`;
}
function openResearchTree(i=activeIsland){openWin('research','Forschungsbaum',()=>researchHTML(i));}
const researchInfoHTML=infoHTML;infoHTML=function(){const b=G.byId.get(UI.sel);if(b?.type!=='forschung')return researchInfoHTML();const coverage=knowledgeCoverage(),state=islandResearch();return `<div class="hd">${ic('b_forschung',1)}<div><b>Forschungsstube</b><p>${coverage.population} erreichbare Einwohner</p></div></div><div class="kv"><span>Wissen</span><b>${Math.floor(state.wissen)} · +${coverage.rate.toFixed(1)} / Min.</b></div><p>${coverage.range} Straßenfelder Reichweite · ${B.forschung.upk} Gold Unterhalt / Min.</p><p>${coverage.houses} über Straßen erreichbare Häuser sind auf der Karte farbig und mit einem Häkchen markiert.</p><p class="small">Je 5 erreichbare Einwohner: 1 Wissen bei Siedlern, 2 bei Bürgern, 3 bei Patriziern pro Minute.</p><button class="btn primary" data-act="research-open">Forschungsbaum öffnen</button><div class="btns"><button class="btn" data-act="pause">${b.paused?'Fortsetzen':'Pausieren'}</button><button class="btn" data-act="move">Verschieben</button><button class="btn danger" data-act="demo">Abreißen</button></div>`;};
const researchWinAct=winAct;winAct=function(id,ds){if(ds.act==='research-open'){openResearchTree();return;}if(ds.act==='research-start'){const i=Number(ds.island),g=WORLD.islands[i],result=g?startResearch(ds.research,g):'Diese Insel ist nicht verfügbar.';if(result!==true)msg(result,'i_alert');else saveGame();const w=WINS.research;if(w){w.hold=false;refreshWin(w);}return;}researchWinAct(id,ds);};
const researchRefreshWin=refreshWin;refreshWin=function(w){if(w.id!=='research'){researchRefreshWin(w);return;}const focused=w.body.contains(document.activeElement)?document.activeElement?.dataset?.research:null;researchRefreshWin(w);if(focused)(w.body.querySelector(`[data-research="${focused}"]:not(:disabled)`)||w.body.querySelector('.research-island'))?.focus({preventScroll:true});};
function researchBuildingArt(){
 const low=document.createElement('canvas');low.width=32;low.height=40;const c=low.getContext('2d');c.imageSmoothingEnabled=false;
 c.fillStyle='#585741';c.fillRect(1,29,30,10);c.fillStyle='#9b9174';c.fillRect(3,18,26,18);c.fillStyle='#d7c7a0';c.fillRect(5,18,22,16);c.fillStyle='#66533d';c.fillRect(14,25,5,11);
 for(const x of [7,22]){c.fillStyle='#584b39';c.fillRect(x,23,4,6);c.fillStyle='#dfc977';c.fillRect(x+1,24,2,4);}
 const tiled=buildingRequiresBricks('forschung');c.fillStyle=tiled?'#4c352a':'#37434b';for(let y=0;y<10;y++)c.fillRect(15-y,8+y,3+y*2,2);c.fillStyle=tiled?'#955b3e':'#61727b';for(let y=0;y<8;y++)c.fillRect(15-y,9+y,2+y*2,1);c.fillStyle=tiled?'#cf9670':'#94a1a1';c.fillRect(7,16,19,1);
 c.fillStyle='#a99c7d';c.fillRect(23,3,5,16);c.fillStyle='#493f33';c.fillRect(24,5,3,4);c.fillStyle='#d7b75d';c.fillRect(25,6,1,2);c.fillStyle='#6b4432';c.fillRect(22,2,7,2);
 c.fillStyle='#765337';c.fillRect(7,31,7,4);c.fillStyle='#f1deb0';c.fillRect(8,31,5,2);c.fillStyle='#8d7045';c.fillRect(10,31,1,2);
 return {low,w:B.forschung.w*16,h:B.forschung.h*16+16,meta:{tw:B.forschung.w,th:B.forschung.h,ex:16,hub:null,smoke:null}};
}
function installResearchArt(){const art=researchBuildingArt();publishPixel('b_forschung',art.low,art.w,art.h,art.meta);}
installResearchArt();
/* Die Auswahl zeigt dieselben Häuser wie die Berechnung der Wissenserzeugung. */
function drawResearchCoverage(ctx){
 const b=G.byId.get(UI.sel);if(b?.type!=='forschung')return;
 const coverage=knowledgeCoverage(G);ctx.save();ctx.lineWidth=2;ctx.strokeStyle='#e9f8ff';ctx.fillStyle='rgba(80,190,160,.35)';
 for(const house of coverage.buildings){
  const x=house.x*16,y=house.y*16,w=house.w*16,h=house.h*16;
  ctx.fillRect(x,y,w,h);ctx.strokeRect(x+1,y+1,w-2,h-2);
  // Ein Häkchen kennzeichnet die Erreichbarkeit zusätzlich zur Farbe.
  ctx.beginPath();ctx.moveTo(x+5,y+9);ctx.lineTo(x+9,y+13);ctx.lineTo(x+17,y+5);ctx.stroke();
 }
 ctx.restore();
}
const researchDrawGhost=drawGhost;drawGhost=function(ctx){researchDrawGhost(ctx);drawResearchCoverage(ctx);};
const knowledgeIcon=document.createElement('canvas');knowledgeIcon.width=knowledgeIcon.height=16;const knowledgePen=knowledgeIcon.getContext('2d');knowledgePen.fillStyle='#60492f';knowledgePen.fillRect(1,3,14,11);knowledgePen.fillStyle='#ead4a1';knowledgePen.fillRect(2,4,5,8);knowledgePen.fillRect(9,4,5,8);knowledgePen.fillStyle='#a78a54';knowledgePen.fillRect(7,3,2,11);knowledgePen.fillStyle='#816d48';for(let y=6;y<=10;y+=2){knowledgePen.fillRect(3,y,3,1);knowledgePen.fillRect(10,y,3,1);}publishPixel('wissen',knowledgeIcon,16,16);
