/* Brandreste belegen ihre bisherige Fläche bis zum Abriss. */
B.ruine={n:'Ruine',kind:'ruin',cat:null,w:3,h:3,cost:{},upk:0,d:'Abgebranntes Gebäude. Mit dem Abrisstool entfernen, um die Fläche wieder zu bebauen.'};
BUILD_SIZES.ruine={w:3,h:3};
function ruinSprite(b,animated=false){
 const frame=animated&&!WORK_ART.reduced.matches?Math.floor(UI.vt*3)%4:0,key='b_ruine_'+b.w+'_'+b.h+'_'+(b.ruinField?'field':'building')+'_'+frame;
 if(!HD_CATALOG.has(key)){
  const entry=IMPORTED_ENTRIES.get(b.ruinField?'acker_ruine':'ruine'),extra=b.ruinField?0:Math.max(12,b.h*5);
  publishPixel(key,importedPixels(entry,frame,false),b.w*16,b.h*16+extra,{tw:b.w,th:b.h,ex:extra,hub:null,smoke:null});
 }
 return key;
}
const ruinSpName=spName;spName=function(b){return b.type==='ruine'?ruinSprite(b):ruinSpName(b);};
const ruinWorkshopSprite=workshopSprite;workshopSprite=function(b){return b.type==='ruine'?ruinSprite(b,true):ruinWorkshopSprite(b);};
const ruinBubbleFor=bubbleFor;bubbleFor=function(b){return b.type==='ruine'?null:ruinBubbleFor(b);};
function burnBuilding(b){
 if(!b||b.type==='ruine'||B[b.type]?.kind==='field')return;
 const fields=G.blds.filter(f=>f.fieldOwner===b.id),name=bname(b);
 for(const target of [b,...fields]){
  target.originalTier=target.tier||1;target.ruinOwner=target.fieldOwner;target.rebuildCost={...(B[target.type].cost||{})};
  if(target.type==='haus')for(let tier=2;tier<=target.originalTier;tier++)for(const [good,qty] of Object.entries(UPG[tier]||{}))target.rebuildCost[good]=(target.rebuildCost[good]||0)+qty;
  target.ruinName=target===b?name:'Ackerland ('+name+')';target.ruinField=B[target.type]?.kind==='field';target.originalType=target.type;
  target.type='ruine';target.tier=1;target.pop=0;target.fire=0;target.paused=true;target.prog=0;target.eff=0;target.conn=false;
  target.inputStock={};target.need={};target.sat={};target.cov={};target.status='Abgebrannt';delete target.fieldOwner;
 }
 G.dirty=true;rebuildNet();refreshWins();
}
function rebuildTargets(b){return b.ruinField?[b]:[b,...G.blds.filter(f=>f.type==='ruine'&&f.ruinOwner===b.id)];}
function ruinRebuildCost(b){const cost={};for(const target of rebuildTargets(b))for(const [good,qty] of Object.entries(target.rebuildCost||B[target.originalType]?.cost||{}))cost[good]=(cost[good]||0)+qty;return cost;}
function rebuildRuin(b){
 if(!b||b.type!=='ruine'||!B[b.originalType])return false;
 if(b.ruinField&&(!G.byId.get(b.ruinOwner)||G.byId.get(b.ruinOwner).type==='ruine')){msg('Zuerst das zugehörige Hauptgebäude wiederaufbauen.','i_alert');return false;}
 const targets=rebuildTargets(b),cost=ruinRebuildCost(b);if(!canAfford(cost)){msg('Gold oder Baumaterial für den Wiederaufbau fehlen.','i_alert');return false;}
 payCost(cost);
 for(const target of targets){
  target.type=target.originalType;target.tier=target.originalTier||1;target.pop=target.type==='haus'?1:0;target.paused=false;target.age=0;target.eff=1;target.status='Wiederaufgebaut';
  if(target.ruinField)target.fieldOwner=target.ruinOwner;
  for(const key of ['originalType','originalTier','ruinOwner','rebuildCost','ruinName','ruinField'])delete target[key];
 }
 G.dirty=true;rebuildNet();refreshWins();renderTop(true);saveGame();msg('Gebäude und zugehörige Betriebsflächen wiederaufgebaut.','i_lager');return true;
}
const ruinInfoHTML=infoHTML;infoHTML=function(){
 const b=G.byId.get(UI.sel);if(b?.type!=='ruine')return ruinInfoHTML();
 if(WINS.info)WINS.info.title.textContent='Ruine · '+(b.ruinName||'Gebäude');
 const cost=ruinRebuildCost(b),owner=b.ruinField?G.byId.get(b.ruinOwner):null,ready=!b.ruinField||owner&&owner.type!=='ruine';
 return `<div class="hd"><img class="px big" alt="" src="${url(spName(b))}"><div><b>${esc(b.ruinName||'Gebäude')}</b><p>Abgebrannt</p></div></div><p>${b.ruinField&&!ready?'Zuerst das zugehörige Hauptgebäude wiederaufbauen.':'Wiederaufbau zum ursprünglichen Baustandard'+(!b.ruinField?' einschließlich noch vorhandener Betriebsflächen.':'.')}</p><div class="cost">${costHTML(cost)}</div><div class="btns"><button class="btn primary" data-act="ruin-rebuild" ${ready&&canAfford(cost)?'':'disabled'}>Wiederaufbauen</button><button class="btn danger" data-act="demo">Ruine abreißen</button></div>`;
};
/* Aktionsklicks aktualisieren auch bei noch gesetztem Zeiger-Haltezustand. */
const liveWinAct=winAct;winAct=function(...args){
 if(args[1]?.act==='ruin-rebuild'){rebuildRuin(G.byId.get(UI.sel));if(WINS.info){WINS.info.hold=false;refreshWin(WINS.info);}return;}
 liveWinAct(...args);for(const w of Object.values(WINS)){const held=w.hold;w.hold=false;refreshWin(w);w.hold=held;}
};
const liveUpgradeHouse=upgradeHouse;upgradeHouse=function(b){const result=liveUpgradeHouse(b);if(result===true&&WINS.info){WINS.info.hold=false;refreshWin(WINS.info);}return result;};
const liveUpgradePort=upgradePort;upgradePort=function(b){const result=liveUpgradePort(b);if(WINS.info){WINS.info.hold=false;refreshWin(WINS.info);}return result;};
