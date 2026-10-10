/* Stufenabhängige Warenanzeige und native 32-Pixel-Icons. */
const GOOD_UNLOCK_TIER={holz:1,bretter:1,stein:1,werkzeug:1,fisch:1,getreide:1,mehl:1,brot:1,wolle:1,tuch:1,erz:2,eisen:2,hopfen:2,bier:2,trauben:2,wein:2,gewuerz:2,wachs:1};
for(const [, ,tier, ,good] of PIXXO_CHAINS)GOOD_UNLOCK_TIER[good]=tier;
for(const chain of LUXURY_CHAINS){
 GOOD_UNLOCK_TIER[chain.good]=chain.tier;
 for(const [, ,input,output] of chain.steps)for(const good of [...Object.keys(input),output])GOOD_UNLOCK_TIER[good]=Math.min(GOOD_UNLOCK_TIER[good]??chain.tier,chain.tier);
}
function goodUnlockTier(id){
 if(GOOD_UNLOCK_TIER[id])return GOOD_UNLOCK_TIER[id];
 const producers=Object.entries(B).filter(([,b])=>b.out?.[id]).map(([type])=>BUILD_TIER[type]||1);
 return producers.length?Math.min(...producers):1;
}
function goodVisibleInStore(id){return goodUnlockTier(id)<=(WORLD?.highestTier||1);}
const STORE_FILTERS=[['all','Alle'],['raw','Rohstoffe'],['craft','Handwerk']];
const STORE_GOOD_CATEGORIES=new Map(GOODS.map(g=>[g.id,Object.values(B).some(b=>b.kind==='prod'&&b.cat==='roh'&&b.out?.[g.id])?'raw':'craft']));
function storeGoodMatches(id){const filter=UI.storeFilter||'all';return goodVisibleInStore(id)&&(filter==='all'||STORE_GOOD_CATEGORIES.get(id)===filter);}
function storeFiltersHTML(){return '<div class="store-filters" role="group" aria-label="Waren filtern">'+STORE_FILTERS.map(([id,label])=>`<button type="button" class="btn ${(UI.storeFilter||'all')===id?'primary':''}" data-act="store-filter" data-filter="${id}" aria-pressed="${(UI.storeFilter||'all')===id}" aria-controls="store-goods-table">${label}</button>`).join('')+'</div>';}
const storeFilterWinAct=winAct;
winAct=function(id,ds){
 if(id==='store'&&ds.act==='store-filter'){
  if(!STORE_FILTERS.some(([filter])=>filter===ds.filter))return;UI.storeFilter=ds.filter;
  const filter=ds.filter,w=WINS.store;if(w){if(w.body.contains(document.activeElement))document.activeElement.blur();w.hold=false;w.body.scrollTop=0;refreshWin(w);w.body.querySelector('[data-filter="'+filter+'"]').focus({preventScroll:true});}return;
 }return storeFilterWinAct(id,ds);
};
function detailedGoodIcon(id){
 const low=document.createElement('canvas');low.width=low.height=32;const c=low.getContext('2d');c.imageSmoothingEnabled=false;
 const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
 // Explicit pixel rasterization avoids blurred silhouette edges.
 const p=(points,color)=>{
  c.fillStyle=color;
  for(let y=0;y<32;y++)for(let x=0;x<32;x++){
   let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){
    const [a,b]=points[i],[d,e]=points[j];
    if((b>y+.5)!==(e>y+.5)&&x+.5<(d-a)*(y+.5-b)/(e-b)+a)inside=!inside;
   }
   if(inside)c.fillRect(x,y,1,1);
  }
 };
 if(id==='pixxo_deko'){
  p([[5,19],[26,19],[23,29],[9,29]],'#513426');p([[7,21],[24,21],[21,27],[10,27]],'#ad603a');
  r(5,18,22,4,'#e0a066');r(6,18,20,1,'#f6c28b');r(8,21,2,5,'#cf8550');r(10,28,12,2,'#75432d');r(12,25,9,1,'#89482f');
  for(const [x,y,col] of [[9,8,'#faf0c6'],[16,5,'#e9a1c5'],[23,9,'#9ec9ef'],[14,13,'#f5ce59']]){
   r(x,y+2,1,16-y,'#4f7336');r(x-2,y+5,2,1,'#79a552');r(x+1,y+7,2,1,'#365c2c');
   r(x-2,y,5,1,col);r(x-1,y-1,3,3,col);r(x,y-2,1,5,col);r(x,y,1,1,'#bf8534');
  }
  r(20,15,3,1,'#8eb561');r(7,15,3,1,'#a2bd70');
 }else if(id==='schnaps'){
  p([[12,6],[20,6],[20,11],[24,15],[24,27],[21,30],[10,30],[7,27],[7,15],[11,11],[11,7]],'#29382b');
  p([[13,7],[18,7],[18,12],[21,15],[22,26],[20,28],[11,28],[9,26],[9,15],[13,12]],'#657b46');
  r(11,22,10,5,'#b49341');r(11,25,10,2,'#927331');r(10,15,2,10,'#b8c69b');r(13,8,2,5,'#c6d4af');
  r(11,17,10,7,'#503d28');r(12,18,8,5,'#ece1b5');r(15,19,2,3,'#94703c');r(14,20,4,1,'#94703c');
  r(11,3,9,4,'#4e3524');r(12,3,7,2,'#b58a52');r(13,3,2,1,'#ddbc7b');
 }else if(id==='haeute'){
  p([[10,3],[14,6],[19,6],[23,3],[27,7],[23,12],[25,17],[29,22],[26,27],[22,25],[20,29],[16,26],[11,29],[9,25],[5,27],[2,22],[7,16],[6,12],[3,7],[7,3]],'#66503a');
  p([[10,5],[14,8],[19,8],[23,5],[25,7],[21,12],[23,18],[27,22],[25,24],[21,22],[19,26],[16,24],[12,26],[10,22],[6,24],[4,22],[9,17],[8,11],[5,7],[8,5]],'#d8c9a0');
  p([[11,9],[15,9],[16,12],[14,16],[10,15],[9,12]],'#7a5337');p([[18,15],[22,16],[23,20],[20,22],[17,20],[17,17]],'#6a4730');
  r(12,20,3,3,'#ad8151');r(17,9,2,2,'#eee1be');r(8,18,1,2,'#eee1be');r(22,10,1,2,'#eee1be');r(13,25,1,1,'#eee1be');r(15,23,1,1,'#beab84');r(16,17,1,2,'#c7b78c');r(10,14,2,1,'#936842');
 }else if(id==='leder'){
  p([[5,9],[24,9],[26,23],[23,28],[4,28],[6,24]],'#4b2e20');p([[7,11],[22,11],[24,23],[21,26],[6,26],[8,22]],'#a36c3e');
  r(9,14,12,1,'#c28c53');r(9,18,13,1,'#8d582f');r(9,22,11,1,'#b87e49');
  r(5,5,19,7,'#513423');r(6,4,17,7,'#c08b56');r(8,5,13,2,'#e0b37b');r(7,9,14,2,'#946037');
  r(22,5,4,8,'#4b2e20');r(23,6,3,6,'#e0b37b');r(23,7,2,4,'#8e5b32');r(24,8,1,2,'#4b2e20');
  r(12,5,2,21,'#674325');r(13,6,1,19,'#d3aa76');r(11,16,4,4,'#d8b778');r(12,17,2,2,'#533a29');
 }else if(id==='stiefel'){
  const boot=(x,y)=>{
   p([[x,y],[x+8,y],[x+8,y+13],[x+13,y+15],[x+14,y+18],[x+13,y+20],[x-1,y+20],[x-2,y+17],[x,y+14]],'#382a22');
   r(x+1,y+2,6,13,'#93613e');r(x+2,y+2,2,12,'#b6804c');r(x+6,y+2,1,14,'#69432c');r(x,y,8,3,'#513c2c');r(x+1,y+1,6,1,'#c69861');
   r(x,y+14,10,4,'#93613e');r(x+4,y+14,6,1,'#c69861');r(x-1,y+18,14,2,'#55432c');r(x,y+18,12,1,'#b79661');
   for(let k=0;k<4;k++){r(x+4,y+4+k*2,1,1,'#e0c599');r(x+3,y+5+k*2,1,1,'#382a22');}
  };boot(17,5);boot(4,9);
 }else if(id==='wachs'){
  p([[5,8],[21,5],[28,11],[27,24],[10,28],[3,23]],'#765126');p([[5,10],[20,7],[26,12],[24,22],[10,25],[5,22]],'#d7ac48');
  p([[5,10],[20,7],[26,12],[11,16]],'#f0d077');p([[11,16],[26,12],[24,22],[10,25]],'#bb8831');
  for(const [x,y] of [[8,10],[14,9],[19,10],[12,12]]){r(x,y,3,2,'#b48a37');r(x+1,y-1,1,4,'#b48a37');r(x+1,y,1,1,'#f6dfa0');}
  r(12,18,9,1,'#e4bd64');r(13,22,6,1,'#d5a14a');r(7,19,1,3,'#f3d88a');r(24,14,1,4,'#e4bd64');
 }else if(id==='kerzen'){
  for(const [x,y,h] of [[5,13,15],[14,7,21],[23,15,13]]){
   r(x-1,y,7,h,'#9c743c');r(x,y,5,h-1,'#ead8a1');r(x+1,y+1,2,h-3,'#fff0c8');r(x+4,y+2,1,h-4,'#c3a16b');
   r(x+1,y-1,3,1,'#fff0c8');r(x+2,y-3,1,3,'#493529');r(x,y+2,1,4,'#fff0c8');r(x+3,y+1,1,3,'#fff0c8');
  }
  p([[16,1],[19,5],[17,7],[14,5]],'#df9a3d');r(16,3,1,3,'#ffe8a3');r(3,28,27,2,'#705430');r(5,28,23,1,'#cba977');
 }
 return low;
}
const DETAILED_GOOD_IDS=['schnaps','haeute','leder','stiefel','wachs','kerzen'];
for(const id of DETAILED_GOOD_IDS)publishPixel(id,detailedGoodIcon(id),16,16);
publishPixel('pixxo_deko',detailedGoodIcon('pixxo_deko'),16,16);dekoToggle.innerHTML=ic('pixxo_deko',1.5);

// Centre the visible artwork, not transparent source padding. The bubble's
// rectangular body is centred at (10, 9); its lower pointer is not content.
const WARNING_ICON_LAYOUTS=new WeakMap();
function warningIconLayout(name){
 const source=PERF_PIXEL_IMAGES.get(SP[name])||HD_CATALOG.get(name)?.pixelSource||SP[name];if(!source)return null;
 if(WARNING_ICON_LAYOUTS.has(source))return WARNING_ICON_LAYOUTS.get(source);
 const pixels=source.getContext('2d').getImageData(0,0,source.width,source.height).data;
 let left=source.width,top=source.height,right=-1,bottom=-1;
 for(let y=0;y<source.height;y++)for(let x=0;x<source.width;x++)if(pixels[(y*source.width+x)*4+3]>=128){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
 if(right<left)return null;
 const sw=right-left+1,sh=bottom-top+1,scale=Math.min(16/sw,14/sh),width=sw*scale,height=sh*scale;
 const layout={source,sx:left,sy:top,sw,sh,x:10-width/2,y:9-height/2,width,height};WARNING_ICON_LAYOUTS.set(source,layout);return layout;
}
function drawWarningIcon(ctx,name){
 const p=warningIconLayout(name);if(!p)return;
 ctx.save();ctx.imageSmoothingEnabled=false;nativeDrawImage.call(ctx,p.source,p.sx,p.sy,p.sw,p.sh,p.x,p.y,p.width,p.height);ctx.restore();
}
