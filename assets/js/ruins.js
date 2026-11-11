/* Brandreste belegen ihre bisherige Fläche bis zum Abriss. */
B.ruine={n:'Ruine',kind:'ruin',cat:null,w:3,h:3,cost:{},upk:0,d:'Abgebranntes Gebäude. Mit dem Abrisstool entfernen, um die Fläche wieder zu bebauen.'};
BUILD_SIZES.ruine={w:3,h:3};
// Each footprint is drawn on its own native grid, never stretched from a shared ruin.
const RUIN_FRAMES=8;
function nativeRuinArt(tw,th,field,frame){
 const w=tw*16,base=th*16,ex=field?0:12,a=document.createElement('canvas');a.width=w;a.height=base+ex;
 const {r,ln,p}=civicPainter(a),seed=tw*101+th*313+(field?719:0),edge='#282724',ash='#55534a',stone='#827d6b',light='#aaa18a',char='#39332a';
 // A recognisable roofless shell: intact lower walls, empty windows and charred beams.
 const rear=ex+Math.max(5,Math.floor(base*.25)),front=ex+base-4,left=2,right=w-3;
 for(let y=rear+2;y<front+2;y++)for(let x=left;x<=right;x++)if((x>left+2&&x<right-2)||hs(x,y,seed)>.4)r(x,y,1,1,hs(x,y,seed)>.92?ash:edge);
 if(!field){
  const wallH=Math.max(5,Math.min(14,Math.floor(base*.35))),bottom=front-2;
  // Jagged rear masonry, retaining the original building's width.
  for(let x=left;x<=right;x++){
   const height=wallH-(Math.floor(hs(Math.floor(x/3),th,seed)*4)),top=rear-height+Math.max(0,wallH-8);
   r(x,top,1,rear+5-top,edge);r(x,top+1,1,Math.max(1,rear+3-top),x%6===0?ash:stone);if(x%4===1)r(x,top,2,1,light);
  }
  // Side wall and a broken front façade preserve a readable house silhouette.
  for(let y=rear+3;y<bottom;y++){r(left,y,4,1,ash);r(left,y,1,1,edge);if(y%4===0)r(left+1,y,2,1,stone);}
  for(let x=left+3;x<=right;x++){
   const top=bottom-wallH+Math.floor(hs(Math.floor(x/4),th,seed+9)*5);
   r(x,top,1,front-top,edge);r(x,top+1,1,Math.max(1,front-top-2),stone);if(x%5===2)r(x,top+1,2,1,light);
  }
  // Horizontal brick courses avoid a fence-like silhouette.
  for(let yy=bottom-wallH+6;yy<front-1;yy+=4){r(left+4,yy,Math.max(1,w-8),1,ash);for(let xx=left+4+(yy%8?3:0);xx<right;xx+=7)r(xx,yy-2,1,2,ash);}
  const gableX=left+3,gableY=rear-6;p([[gableX,gableY],[gableX+5,gableY-5],[gableX+10,gableY+3],[gableX+6,gableY+1],[gableX+4,gableY+6]],ash);ln(gableX+1,gableY,gableX+5,gableY-4,char);
  const door=Math.max(left+4,Math.floor(w*.53)-2);r(door,bottom-wallH+3,4,wallH-1,char);r(door+1,bottom-wallH+4,2,Math.max(2,wallH-4),edge);
  if(w>=28)for(const x of [left+6,right-7]){r(x,bottom-wallH+3,4,4,edge);r(x,bottom-wallH+2,4,1,ash);}
  // Roof trusses have collapsed into the dark interior; a broken chimney remains.
  for(let i=0;i<Math.max(1,tw-1);i++){
   const x=left+4+i*16,y=rear+2;ln(x,y,Math.min(right-2,x+9),bottom-wallH+2,char);ln(x-1,y,Math.min(right-3,x+8),bottom-wallH+2,char);ln(x+1,y,Math.min(right-1,x+10),bottom-wallH+2,'#64523b');
  }
  const chimney=Math.max(3,w-9),cy=rear-7;r(chimney,cy,5,12,edge);r(chimney+1,cy+1,3,10,ash);for(let yy=cy+2;yy<cy+10;yy+=3)r(chimney+1,yy,3,1,stone);r(chimney,cy,3,1,light);
  for(let i=0;i<tw+th;i++){const x=left+3+Math.floor(hs(i,2,seed+8)*Math.max(1,w-9)),y=front-2+Math.floor(hs(i,3,seed+8)*3);r(x,y,3,2,ash);r(x,y,2,1,stone);}
 }else{
  for(let y=rear;y<front;y+=5)for(let x=4;x<w-4;x+=8){r(x,y,4,1,char);r(x+1,y-1,1,1,ash);}
 }
 // Two offset eight-frame smoke cycles: tiny opaque pixels keep the native grid crisp.
 for(let i=0;i<Math.min(3,tw+th);i++){
  const sx=Math.max(3,Math.min(w-5,Math.floor(w*(i+1)/(Math.min(3,tw+th)+1)))),sy=ex+Math.floor(base*(field?.64:.63)),phase=(frame+i*3)%RUIN_FRAMES;
  r(sx,sy,2,1,phase%3?'#8e5739':'#bd8650');r(sx+1,sy+1,1,1,char);
  const rise=phase+2,drift=[0,0,1,1,2,2,1,0][phase],smoke=['#626157','#626157','#757367','#757367','#858174','#858174','#757367','#626157'][phase];
  r(sx+drift,sy-rise,2+(phase>3?1:0),2,smoke);r(sx+drift-1,sy-rise+1,1,1,ash);
 }
 return {low:a,w,h:base+ex,meta:{tw,th,ex,hub:null,smoke:null}};
}
function ruinSprite(b,animated=false){
 const stem='b_ruine_'+b.w+'_'+b.h+'_'+(b.ruinField?'field':'building')+'_';
 if(!HD_CATALOG.has(stem+'0'))for(let f=0;f<RUIN_FRAMES;f++){const art=nativeRuinArt(b.w,b.h,!!b.ruinField,f);publishPixel(stem+f,art.low,art.w,art.h,art.meta);}
 const frame=animated&&!WORK_ART.reduced.matches?Math.floor(UI.vt*8)%RUIN_FRAMES:0;return stem+frame;
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
 return `<div class="hd"><img class="px big" alt="" src="${url(spName(b))}"><div><b>${esc(b.ruinName||'Gebäude')}</b><p>Abgebrannt</p></div></div><p>${b.ruinField&&!ready?'Zuerst das zugehörige Hauptgebäude wiederaufbauen.':'Dieses Gebäude muss wiederaufgebaut werden.'}</p><div class="cost">${costHTML(cost)}</div><div class="btns"><button class="btn primary" data-act="ruin-rebuild" ${ready&&canAfford(cost)?'':'disabled'}>Wiederaufbauen</button><button class="btn danger" data-act="demo">Ruine abreißen</button></div>`;
};
/* Aktionsklicks aktualisieren auch bei noch gesetztem Zeiger-Haltezustand. */
const liveWinAct=winAct;winAct=function(...args){
 if(args[1]?.act==='ruin-rebuild'){rebuildRuin(G.byId.get(UI.sel));if(WINS.info){WINS.info.hold=false;refreshWin(WINS.info);}return;}
 liveWinAct(...args);for(const w of Object.values(WINS)){const held=w.hold;w.hold=false;refreshWin(w);w.hold=held;}
};
const liveUpgradeHouse=upgradeHouse;upgradeHouse=function(b){const result=liveUpgradeHouse(b);if(result===true&&WINS.info){WINS.info.hold=false;refreshWin(WINS.info);}return result;};
const liveUpgradePort=upgradePort;upgradePort=function(b){const result=liveUpgradePort(b);if(WINS.info){WINS.info.hold=false;refreshWin(WINS.info);}return result;};
