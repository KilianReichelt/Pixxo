/* Native ornaments, grouped without changing their economic behaviour. */
const DEKO_GROUPS=[
 {id:'natur',n:'Natur',items:[['eiche','Eiche',2,2,90],['birke','Birke',2,2,90],['tanne','Tanne',2,2,90],['strauch','Zierstrauch',1,1,25],['hecke','Hecke',2,1,45],['blumenbeet','Blumenbeet',2,1,60],['blumenkuebel','Blumenkübel',1,1,25],['seerosenteich','Seerosenteich',3,2,180]]},
 {id:'stadt',n:'Stadtleben',items:[['bank','Sitzbank',2,1,50],['picknicktisch','Picknicktisch',2,2,75],['anschlagtafel','Anschlagtafel',2,1,45],['wegweiser','Wegweiser',1,1,35],['lampe','Straßenlaterne',1,1,60],['sonnenuhr','Sonnenuhr',1,1,70],['fahnenmast','Fahnenmast',1,1,65],['trinkbrunnen','Trinkbrunnen',1,1,90]]},
 {id:'land',n:'Landwirtschaft',items:[['heuwagen','Heuwagen',2,2,80],['heuhaufen','Heuhaufen',2,1,40],['strohballen','Strohballen',2,1,40],['holzstapel','Holzstapel',2,1,45],['regentonne','Regentonne',1,1,35],['schubkarre','Schubkarre',2,1,45],['vogelscheuche','Vogelscheuche',1,1,45],['geraetestaender','Geräteständer',2,1,50]]},
 {id:'hafen',n:'Hafen',items:[['kistenstapel','Kistenstapel',2,1,45],['fassgruppe','Fassgruppe',2,1,45],['warensaecke','Warensäcke',2,1,35],['marktstand','Marktstand',2,2,100],['handkarren','Handkarren',2,1,65],['fischernetz','Fischernetzständer',2,1,60],['seilrolle','Seilrolle',1,1,35],['anker','Anker',1,1,50]]},
 {id:'zaeune',n:'Zäune & Mauern',items:[['holzzaun','Holzzaun',2,1,35],['holztor','Holztor',2,1,45],['lattenzaun','Lattenzaun',2,1,35],['weidenzaun','Weidenzaun',2,1,35],['steinmauer','Steinmauer',2,1,55],['steintor','Steintor',2,1,80],['ziergitter','Ziergitter',2,1,60],['ziergittertor','Ziergittertor',2,1,75]]},
 {id:'fest',n:'Festschmuck',items:[['statue','Statue',1,1,120],['gedenkstein','Gedenkstein',1,1,90],['pavillon','Pavillon',3,3,180],['musikpodest','Musikpodest',3,2,120],['wimpelkette','Wimpelkette',2,1,65],['lichterbogen','Lichterkettenbogen',2,1,85],['festbanner','Festbanner',1,1,65],['springbrunnen','Springbrunnen',2,2,150]]}
];
const DEKO_DEFINITIONS=new Map();
for(const group of DEKO_GROUPS)for(const item of group.items){
 const [id,n,w,h,gold]=item,type='deko_'+id;DEKO_DEFINITIONS.set(type,{group:group.id,id});
 if(!B[type]){PIXXO_DECOR.push(item);B[type]={n,cat:'deko',kind:'decor',w,h,cost:{gold},upk:0,req:0,d:'Dekoration ohne Einfluss auf Versorgung oder Produktion.'};BUILD_SIZES[type]={w,h};BASE_GEOMETRY[type]={w:w/1.5,h:h/1.5};}
 B[type].cat='deko_'+group.id;B[type].nightLight=['lampe','lichterbogen','pavillon','musikpodest','springbrunnen'].includes(id);
}
// Retain previously placed ornaments and keep every existing object available.
for(const [id] of PIXXO_DECOR)if(!DEKO_DEFINITIONS.has('deko_'+id)){
 const group=DEKO_GROUPS.find(g=>g.id===(id==='laterne'?'stadt':id==='brunnen'?'fest':'natur'));
 group.items.push(PIXXO_DECOR.find(i=>i[0]===id));B['deko_'+id].cat='deko_'+group.id;
}
function nativeDecorationArt(type){
 const def=DEKO_DEFINITIONS.get(type);if(!def)return null;
 const d=B[type],w=d.w*16,h=d.h*16+12,a=document.createElement('canvas');a.width=w;a.height=h;a._nightWindows=[];
 const {r,p,ln}=civicPainter(a),id=def.id,E='#3e3b2f',wood='#987344',light='#cfad72',green='#547d44',x=Math.floor(w/2),y=h-5;
 const lamp=(xx,yy)=>{r(xx-2,yy-2,6,9,E);r(xx-1,yy,4,5,'#bcaf76');r(xx-2,yy-3,6,2,'#866c43');a._nightWindows.push({x:xx-1,y:yy,w:4,h:5});};
 const crate=(xx,yy)=>{r(xx,yy,10,10,E);r(xx+1,yy+1,8,8,wood);r(xx+1,yy+1,8,1,light);ln(xx+1,yy+2,xx+8,yy+8,'#6d5036');r(xx+1,yy+6,8,1,'#735438')};
 const barrel=(xx,yy)=>{r(xx+1,yy,7,11,E);r(xx,yy+2,9,7,E);r(xx+1,yy+1,7,9,wood);r(xx+2,yy+1,1,8,light);r(xx+1,yy+3,7,1,'#546057');r(xx+1,yy+8,7,1,'#546057')};
 const wheel=(xx,yy)=>{p([[xx-3,yy-2],[xx-2,yy-3],[xx+2,yy-3],[xx+3,yy-2],[xx+3,yy+2],[xx+2,yy+3],[xx-2,yy+3],[xx-3,yy+2]],E);r(xx-2,yy-2,5,5,'#aa9263');r(xx,yy-2,1,5,E);r(xx-2,yy,5,1,E)};
 if(['eiche','birke','tanne'].includes(id)){
  r(x-1,y-17,3,18,id==='birke'?'#dad2b4':wood);r(x,y-16,1,14,id==='birke'?'#6b6b59':'#705333');
  if(id==='tanne'){for(let i=0;i<3;i++){const yy=3+i*8,span=7+i*3;p([[x,yy],[x-span,yy+15],[x+span,yy+15]],E);p([[x,yy+2],[x-span+2,yy+13],[x+span-2,yy+13]],green);ln(x,yy+4,x-span+3,yy+12,'#7b9e55')}}
  else {p([[x-11,10],[x-5,4],[x+3,2],[x+12,8],[x+14,18],[x+9,28],[x-4,30],[x-13,23],[x-14,16]],E);p([[x-10,11],[x-4,6],[x+3,4],[x+10,9],[x+12,17],[x+7,25],[x-4,27],[x-11,22],[x-12,16]],green);p([[x-9,12],[x-3,7],[x+2,6],[x+7,10],[x+2,15],[x-6,18]],id==='birke'?'#a1b56b':'#7f9d51');r(x+5,20,5,2,'#3f6238')}
 }else if(['strauch','hecke','blumenbeet','blumenkuebel'].includes(id)){
  if(id==='blumenkuebel'){r(x-4,y-8,9,8,E);r(x-3,y-7,7,6,'#a7794b');r(x-4,y-8,9,2,light)}else if(id==='blumenbeet')r(2,y-8,w-4,9,'#705333');
  const top=id==='hecke'?y-14:y-12;r(2,top,w-4,8,green);r(3,top+1,w-6,2,'#81a65b');for(let xx=4;xx<w-3;xx+=5){r(xx,top-1,3,2,'#6e984b');if(id!=='hecke'&&id!=='strauch'){r(xx,top,2,2,xx%2?'#db8fa2':'#efcd76');r(xx+1,top+3,1,3,'#405f36')}}
 }else if(id==='seerosenteich'||id==='springbrunnen'){
  p([[3,y-17],[x-6,y-22],[w-5,y-19],[w-2,y-9],[w-7,y-2],[6,y-1],[1,y-8]],E);p([[4,y-15],[x-5,y-20],[w-7,y-17],[w-4,y-9],[w-9,y-4],[7,y-3],[3,y-8]],'#45778a');ln(8,y-9,w-10,y-9,'#7eafb4');
  if(id==='seerosenteich'){for(const [xx,yy] of [[10,y-13],[x+3,y-7],[w-14,y-15]]){r(xx,yy,5,2,'#799c58');r(xx+2,yy-1,2,2,'#e5b2c0')}}else{r(x-2,y-24,5,20,'#b7b394');r(x-3,y-25,7,2,'#d8cda7');ln(x,y-26,x-7,y-15,'#a0cccb');ln(x+1,y-26,x+8,y-15,'#a0cccb');for(const xx of [5,w-8]){r(xx,y-9,3,3,'#cec98b');a._nightWindows.push({x:xx,y:y-9,w:3,h:3})}}
 }else if(id==='bank'||id==='picknicktisch'){
  r(3,y-7,w-6,3,E);r(3,y-8,w-6,2,wood);r(4,y-8,w-8,1,light);for(const xx of [5,w-8]){r(xx,y-6,2,7,E);r(xx,y-13,2,6,wood)}r(3,y-13,w-6,2,wood);
  if(id==='picknicktisch'){r(7,y-17,w-14,6,wood);r(8,y-17,w-16,1,light);r(x,y-16,1,4,'#735438');r(9,y-11,2,7,E);r(w-12,y-11,2,7,E)}
 }else if(id==='anschlagtafel'||id==='wegweiser'){
  r(x-1,7,3,y-6,wood);r(x,7,1,y-6,light);const bw=id==='wegweiser'?12:24,bx=x-Math.floor(bw/2);r(bx,8,bw,12,E);r(bx+1,9,bw-2,10,wood);r(bx+1,9,bw-2,1,light);if(id==='anschlagtafel'){r(bx+3,11,6,6,'#dfd0ab');r(bx+12,12,7,5,'#d8c59b');r(bx+4,13,4,1,'#887658')}else{r(bx+3,12,6,1,'#ead5a3');r(bx+7,11,1,3,'#ead5a3')}
 }else if(id==='lampe'){
  r(x-1,9,2,y-8,E);r(x-2,y-1,5,2,'#89744d');lamp(x,7);
 }else if(id==='sonnenuhr'||id==='trinkbrunnen'||id==='statue'||id==='gedenkstein'){
  r(x-5,y-2,11,3,E);r(x-4,y-3,9,2,'#c4b993');r(x-3,y-13,7,10,'#a59d7d');r(x-2,y-12,2,8,'#d3c7a2');
  if(id==='sonnenuhr'){r(x-5,y-15,11,3,'#d5c498');ln(x,y-19,x+3,y-14,E)}
  if(id==='trinkbrunnen'){r(x-3,y-17,7,4,'#c4b993');r(x+2,y-14,3,1,E);r(x+4,y-13,1,4,'#86b5b7')}
  if(id==='statue'){r(x-2,y-24,5,5,E);r(x-1,y-23,3,3,'#d3c7a2');p([[x-4,y-13],[x-2,y-20],[x+2,y-20],[x+4,y-13]],'#b9b395');r(x-1,y-20,1,6,'#e0d6b3')}
  if(id==='gedenkstein'){r(x-4,y-21,9,15,E);r(x-3,y-20,7,13,'#a59d7d');r(x-2,y-17,5,1,'#6b6b57');r(x-2,y-14,5,1,'#6b6b57')}
 }else if(id==='fahnenmast'||id==='festbanner'||id==='vogelscheuche'){
  r(x-1,3,2,y-3,wood);r(x,3,1,y-3,light);r(x-3,y-1,6,2,E);
  if(id==='vogelscheuche'){r(x-6,12,13,2,wood);r(x-3,7,6,4,'#cfb687');r(x-4,6,8,2,'#ad8e55');r(x-3,12,6,8,'#72828a');r(x-4,18,8,1,'#b29760')}
  else{p([[x+1,5],[w-1,5],[w-3,11],[w-1,17],[x+1,17]],E);p([[x+2,6],[w-3,6],[w-5,11],[w-3,15],[x+2,15]],id==='festbanner'?'#a76b83':'#5d8795');r(x+3,8,3,5,'#dec17e')}
 }else if(['heuhaufen','strohballen','holzstapel','warensaecke'].includes(id)){
  if(id==='heuhaufen'){p([[2,y],[4,y-8],[x,y-18],[w-5,y-10],[w-2,y]],E);p([[4,y-1],[6,y-8],[x,y-15],[w-7,y-9],[w-4,y-1]],'#bda25f');for(let yy=y-11;yy<y;yy+=3)ln(x-4,yy,w-8,yy+2,'#dfc880')}
  else for(let i=0;i<3;i++){const xx=2+i*8,yy=y-8+(i%2)*2;if(id==='holzstapel'){r(xx,yy-5,8,13,E);r(xx+1,yy-4,6,11,wood);for(let j=0;j<3;j++){r(xx+1,yy-3+j*4,6,1,light);r(xx+3,yy-2+j*4,2,1,'#624a31')}}else{p([[xx,yy],[xx+2,yy-5],[xx+6,yy-6],[xx+8,yy],[xx+8,yy+6],[xx,yy+6]],E);r(xx+1,yy,6,5,'#c4ad71');r(xx+2,yy-4,4,5,'#dcc78e');r(xx+3,yy,1,5,'#937b4e')}}
 }else if(id==='regentonne'||id==='fassgruppe'){
  barrel(id==='regentonne'?x-4:3,y-11);if(id==='fassgruppe'){barrel(12,y-14);barrel(21,y-10)}
 }else if(id==='kistenstapel'){crate(2,y-10);crate(12,y-10);crate(7,y-20)}
 else if(['heuwagen','handkarren','schubkarre'].includes(id)){
  r(5,y-13,w-12,8,E);r(6,y-12,w-14,6,wood);r(6,y-12,w-14,1,light);for(let xx=8;xx<w-7;xx+=4)r(xx,y-11,1,5,'#725438');wheel(9,y-4);if(id!=='schubkarre')wheel(w-10,y-4);ln(w-8,y-8,w-2,y-3,wood);
  if(id==='heuwagen'){p([[6,y-13],[9,y-23],[x,y-25],[w-8,y-21],[w-7,y-13]],'#c4ad71');for(let yy=y-21;yy<y-13;yy+=3)r(11,yy,w-23,1,'#e0cd8c')}
 }else if(id==='geraetestaender'||id==='fischernetz'){
  for(const xx of [3,w-5])r(xx,9,2,y-8,wood);r(2,8,w-4,2,light);
  if(id==='fischernetz'){for(let yy=12;yy<y-1;yy+=4)ln(5,yy,w-6,yy,'#bcb297');for(let xx=6;xx<w-5;xx+=4)ln(xx,12,xx,y-3,'#bcb297')}
  else for(let xx=7;xx<w-6;xx+=6){r(xx,11,1,y-13,wood);r(xx-2,11,5,2,'#7b8986');r(xx+1,y-6,2,3,'#7b8986')}
 }else if(id==='seilrolle'){
  for(let i=0;i<3;i++){r(2+i, y-8+i*2,12-i*2,2,'#c9b583');r(3+i,y-7+i*2,10-i*2,1,'#8b7954')}r(6,y-5,4,2,E);
 }else if(id==='anker'){
  r(x-2,5,5,5,E);r(x-1,6,3,3,'#96a5a1');r(x,9,1,y-10,'#96a5a1');r(3,12,10,2,'#657775');ln(x,y-3,2,y-10,E);ln(x,y-3,13,y-10,E);ln(x,y-4,3,y-10,'#96a5a1');ln(x,y-4,12,y-10,'#96a5a1');r(2,y-12,2,5,E);r(12,y-12,2,5,E);
 }else if(id==='marktstand'){
  for(const xx of [3,w-5])r(xx,10,2,y-8,wood);p([[1,14],[6,6],[w-7,6],[w-1,14]],E);for(let xx=3;xx<w-3;xx+=5)r(xx,9,5,5,xx%2?'#a96555':'#dec598');r(3,y-12,w-6,7,wood);r(3,y-12,w-6,1,light);for(let xx=6;xx<w-5;xx+=5)r(xx,y-14,3,2,xx%2?'#b6784e':'#8c9e55');
 }else if(def.group==='zaeune'){
  const stone=id.startsWith('stein'),iron=id.startsWith('zier'),gate=id.endsWith('tor'),top=y-15;
  if(stone){r(1,top,w-2,16,E);r(2,top+1,w-4,13,'#a9a184');for(let yy=top+5;yy<y;yy+=4){r(2,yy,w-4,1,'#726f5a');for(let xx=4+(yy%2)*3;xx<w-3;xx+=7)r(xx,yy-3,1,3,'#857e65')}r(1,top,w-2,2,'#d0c6a3');if(gate){a.getContext('2d').clearRect(x-5,top+5,10,12);r(x-5,top+4,10,2,'#d0c6a3')}}
  else {const col=iron?'#657875':wood;for(const xx of [2,w-4]){r(xx,top-1,2,18,E);r(xx,top-1,1,17,iron?'#a0aaa0':light)}for(const yy of [top+4,top+12])r(3,yy,w-6,2,col);for(let xx=6;xx<w-4;xx+=4){r(xx,top+1,1,14,col);if(id==='lattenzaun')r(xx-1,top,3,14,light);if(id==='weidenzaun')for(let yy=top+3;yy<y;yy+=3)r(xx-1,yy,4,1,'#b49a61')}if(gate){r(x,top,1,16,E);r(x+2,top+8,2,2,'#d6bc7e')}if(id==='holzzaun'||id==='holztor')ln(4,top+3,w-5,top+12,wood)}
 }else if(id==='pavillon'){
  r(4,y-2,w-8,3,'#a59c77');for(const xx of [7,w-9]){r(xx,20,2,y-21,wood);r(xx,20,1,y-21,light)}p([[3,21],[x,3],[w-3,21]],E);p([[6,19],[x,5],[w-6,19]],'#698f85');r(4,21,w-8,2,light);r(8,y-13,w-16,2,wood);lamp(12,25);lamp(w-14,25);
 }else if(id==='musikpodest'){
  r(3,y-13,w-6,14,E);r(4,y-12,w-8,10,wood);for(let yy=y-10;yy<y;yy+=3)r(4,yy,w-8,1,light);r(x-5,y-23,11,9,'#8d6151');r(x-4,y-23,9,1,'#cfb58b');r(x-5,y-16,11,1,'#cfb58b');lamp(7,y-22);lamp(w-9,y-22);
 }else if(id==='wimpelkette'||id==='lichterbogen'){
  for(const xx of [2,w-4]){r(xx,7,2,y-6,wood);r(xx,7,1,y-6,light)}ln(3,9,x,13,E);ln(x,13,w-4,9,E);
  for(let xx=6;xx<w-5;xx+=5){const yy=10+Math.floor((1-Math.abs(xx-x)/x)*3);if(id==='wimpelkette'){p([[xx,yy],[xx+4,yy],[xx+2,yy+5]],xx%2?'#b87891':'#d9bc75')}else{r(xx,yy,2,3,'#e2cb82');a._nightWindows.push({x:xx,y:yy,w:2,h:3})}}
 }
 return {low:a,w,h,meta:{tw:d.w,th:d.h,ex:12,hub:null,smoke:null}};
}
const decorationNativeArt=pixxoNativeArt;pixxoNativeArt=function(type,...args){return nativeDecorationArt(type)||decorationNativeArt(type,...args);};
for(const type of DEKO_DEFINITIONS.keys()){const a=nativeDecorationArt(type);publishPixel(typeSprite(type),a.low,a.w,a.h,a.meta);}
// Use the same category buttons, item cards, keyboard behaviour and scrolling as buildings.
const groupedDecorRenderBar=renderBar;
renderBar=function(...args){
 const bar=$('#bar');bar.classList.toggle('deko-category-mode',UI.barMode==='deko');
 if(UI.barMode!=='deko'){const focused=document.activeElement?.dataset?.cat,result=groupedDecorRenderBar(...args);document.documentElement.style.setProperty('--barH',bar.offsetHeight+'px');for(const button of bar.querySelectorAll('[data-cat]')){button.setAttribute('aria-pressed',String(UI.cat===button.dataset.cat));button.setAttribute('aria-controls','items-viewport');}if(focused)bar.querySelector('[data-cat="'+focused+'"]')?.focus();return result;}
 if(dekoCategoryDrag)return;
 const previousScroll=bar.querySelector('.deko-viewport')?.scrollLeft||0;
 const originalCats=CATS.slice(),focused=document.activeElement?.dataset?.cat;
 const categoryIcons=['eiche','bank','heuwagen','kistenstapel','steinmauer','lichterbogen'];
 CATS.splice(0,CATS.length,...DEKO_GROUPS.map((group,i)=>({id:'deko_'+group.id,n:group.n,icon:'b_deko_'+categoryIcons[i]})));
 UI.barMode='build';
 try{groupedDecorRenderBar(...args);}finally{UI.barMode='deko';CATS.splice(0,CATS.length,...originalCats);}
 bar.classList.remove('deko-mode');bar.classList.add('deko-category-mode');document.documentElement.style.setProperty('--barH',bar.offsetHeight+'px');
 for(const group of DEKO_GROUPS){const button=bar.querySelector('[data-cat="deko_'+group.id+'"]');if(button){button.dataset.dekoCategory=group.id;button.setAttribute('aria-pressed',String(UI.cat==='deko_'+group.id));button.setAttribute('aria-label',group.n);button.setAttribute('aria-controls','items-viewport');}}
 wrapDekoCategories(previousScroll);
 if(focused)bar.querySelector('[data-cat="'+focused+'"]')?.focus();
 dekoToggle.classList.add('on');dekoToggle.setAttribute('aria-pressed','true');dekoToggle.setAttribute('aria-label','Baukategorien anzeigen');dekoToggle.innerHTML=ic('i_houses',1.5);dekoToggle.dataset.icon='i_houses';
 const viewport=$('#items .items-viewport');if(viewport)viewport.setAttribute('aria-label','Dekorationen');
 for(const button of $('#items').querySelectorAll('[data-item-scroll]'))button.setAttribute('aria-label',button.dataset.itemScroll==='left'?'Vorherige Dekorationen anzeigen':'Weitere Dekorationen anzeigen');
};

let dekoCategoryDrag=null,dekoCategorySuppressClick=false;
function wrapDekoCategories(scroll=0){
 const bar=$('#bar');if(!bar.querySelector('.deko-viewport')){
 const cards=bar.innerHTML;bar.innerHTML=`<button type="button" class="item-scroll" data-deko-scroll="left" aria-label="Vorherige Dekokategorien anzeigen" aria-controls="deko-viewport" hidden>←</button><div id="deko-viewport" class="deko-viewport" role="group" aria-label="Dekokategorien" tabindex="0"><div class="deko-track">${cards}</div></div><button type="button" class="item-scroll" data-deko-scroll="right" aria-label="Weitere Dekokategorien anzeigen" aria-controls="deko-viewport" hidden>→</button>`;
 }
 bar.querySelector('.deko-viewport').scrollLeft=scroll;updateDekoNavigation();
}
const dekoCategoryBar=$('#bar');
dekoCategoryBar.addEventListener('pointerdown',e=>{
 if(!e.isPrimary||e.button!==0||e.target.closest('[data-deko-scroll]'))return;
 const viewport=e.target.closest('.deko-viewport');if(!viewport||viewport.scrollWidth<=viewport.clientWidth)return;
 dekoCategorySuppressClick=false;dekoCategoryDrag={pointer:e.pointerId,viewport,x:e.clientX,scroll:viewport.scrollLeft,dragged:false};
});
dekoCategoryBar.addEventListener('pointermove',e=>{
 const d=dekoCategoryDrag;if(!d||d.pointer!==e.pointerId)return;const dx=e.clientX-d.x;if(!d.dragged&&Math.abs(dx)<6)return;
 if(!d.dragged){d.dragged=true;d.viewport.setPointerCapture(e.pointerId);d.viewport.classList.add('is-dragging');}
 e.preventDefault();d.viewport.scrollLeft=d.scroll-dx;updateDekoNavigation();
});
function finishDekoCategoryDrag(e){const d=dekoCategoryDrag;if(!d||d.pointer!==e.pointerId)return;dekoCategoryDrag=null;dekoCategorySuppressClick=d.dragged;d.viewport.classList.remove('is-dragging');if(d.viewport.hasPointerCapture(e.pointerId))d.viewport.releasePointerCapture(e.pointerId);}
for(const event of ['pointerup','pointercancel','lostpointercapture'])dekoCategoryBar.addEventListener(event,finishDekoCategoryDrag);
dekoCategoryBar.addEventListener('pointerleave',()=>{if(dekoCategoryDrag&&!dekoCategoryDrag.dragged)dekoCategoryDrag=null;});
dekoCategoryBar.addEventListener('click',e=>{if(dekoCategorySuppressClick&&e.detail!==0){dekoCategorySuppressClick=false;e.preventDefault();e.stopImmediatePropagation();}},true);
dekoCategoryBar.addEventListener('dragstart',e=>{if(e.target.closest('.deko-viewport'))e.preventDefault();});
