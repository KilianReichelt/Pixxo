/* Jede Ackerfläche zeigt die Kultur ihres gespeicherten Mutterbetriebs. */
const FIELD_CROP_SPRITES={farm:'acker_getreide',hopfen:'acker_hopfen',weingut:'acker_trauben',gewuerzfarm:'acker_gewuerz',obsthof:'acker_obst',blumenhof:'acker_blumen'};
function fieldCropType(b){
 const island=b.island??Math.floor((b.id||0)/100000),g=WORLD?.islands[island]||G,owner=g?.byId.get(b.fieldOwner);
 return FIELD_CROP_SPRITES[owner?.type]?owner.type:'farm';
}
function cropFieldArt(crop){const d=B.acker,entry=IMPORTED_ENTRIES.get(FIELD_CROP_SPRITES[crop]||FIELD_CROP_SPRITES.farm);return {low:importedPixels(entry),w:d.w*16,h:d.h*16,meta:{tw:d.w,th:d.h,ex:0,hub:null,smoke:null}};}
function cropFieldSprite(crop){const name='b_acker_crop_'+crop+'_'+B.acker.w+'_'+B.acker.h;if(!HD_CATALOG.has(name)){const a=cropFieldArt(crop);publishPixel(name,a.low,a.w,a.h,a.meta);}return name;}
// Workers are independent world sprites; crop textures stay unchanged.
const FIELD_WORK_FRAMES=6;
const FIELD_WORK_SPRITES=new Map(),FIELD_WORK_POOLS=new WeakMap();
function fieldWorkerSprite(frame){
 if(FIELD_WORK_SPRITES.has(frame))return FIELD_WORK_SPRITES.get(frame);
 const low=document.createElement('canvas');low.width=8;low.height=8;
 const c=low.getContext('2d');c.imageSmoothingEnabled=false;
 const rect=(color,x,y,w,h)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
 const x=1,y=0,bend=frame===2||frame===3;
 // Straw hat, face, two-pixel jacket, alternating feet, and a moving hoe.
 rect('#4a392b',x-1,y+7,5,1);rect('#c5a265',x,y,2,1);rect('#e6cb87',x-1,y+1,4,1);
 rect('#c2956a',x,y+2,2,1);rect('#704b39',x,y+3,2,1);rect('#b47a48',x,y+4,2,2);
 rect('#493a30',x,y+6,2,1);rect('#302a25',x+(frame%2),y+7,1,1);
 rect('#d9b68a',x+2,y+(bend?5:4),1,1);rect('#a98a54',x+3,y+(bend?4:2),1,bend?4:5);
 rect('#77776a',x+3,y+(bend?7:6),2,1);
 FIELD_WORK_SPRITES.set(frame,low);return low;
}
function fieldWorkerPool(g){
 const fields=[];let signature='';for(const b of g.blds)if(b.type==='acker'&&b.fieldOwner&&!b.fire&&!b.paused){fields.push(b);signature+=b.id+','+b.fieldOwner+','+b.x+','+b.y+';';}
 let pool=FIELD_WORK_POOLS.get(g);if(pool?.signature===signature)return pool;
 const groups=new Map();for(const b of fields){if(!groups.has(b.fieldOwner))groups.set(b.fieldOwner,new Map());groups.get(b.fieldOwner).set(IDX(b.x,b.y),b);}
 const workers=[];
 for(const [ownerId,cells] of groups){const remaining=new Set(cells.keys());
  while(remaining.size){const root=remaining.values().next().value,path=[root],stack=[{k:root,next:0}],component=[root];remaining.delete(root);
   // A closed depth-first walk visits every connected cell without corner cuts.
   while(stack.length){const node=stack[stack.length-1];if(node.next===4){stack.pop();if(stack.length)path.push(stack[stack.length-1].k);continue;}const [dx,dy]=[[1,0],[0,1],[-1,0],[0,-1]][node.next++],x=node.k%MAPW+dx,y=Math.floor(node.k/MAPW)+dy,k=IDX(x,y);if(INMAP(x,y)&&remaining.has(k)){remaining.delete(k);component.push(k);path.push(k);stack.push({k,next:0});}}
   for(let i=0;i<Math.min(4,Math.ceil(component.length/8));i++)workers.push({ownerId,path,offset:i*Math.max(1,path.length-1)/Math.min(4,Math.ceil(component.length/8)),seed:ownerId+i*17});
  }
 }
 pool={signature,workers};FIELD_WORK_POOLS.set(g,pool);return pool;
}
function fieldWorkerPositions(g){
 const positions=[];
 for(const person of fieldWorkerPool(g).workers){const owner=g.byId.get(person.ownerId);if(!owner||owner.paused||owner.fire||!workshopRunning(owner))continue;
  const time=WORK_ART.reduced.matches?0:g.time,length=person.path.length-1,t=length?(time*.32+person.offset+person.seed*.13)%length:0,i=Math.min(Math.floor(t),Math.max(0,length-1)),a=person.path[i],b=person.path[Math.min(i+1,length)],f=t-i;
  positions.push({x:(a%MAPW+(b%MAPW-a%MAPW)*f+.5)*16,y:(Math.floor(a/MAPW)+(Math.floor(b/MAPW)-Math.floor(a/MAPW))*f+.5)*16,frame:WORK_ART.reduced.matches?0:Math.floor(time*3+person.seed)%FIELD_WORK_FRAMES,ownerId:person.ownerId});
 }return positions;
}
function drawFieldWorkers(ctx,x0,y0,x1,y1){
 for(const g of WORLD?.islands.filter(Boolean)||[G])for(const person of fieldWorkerPositions(g))if(person.x>=x0-8&&person.x<=x1+8&&person.y>=y0-8&&person.y<=y1+8)ctx.drawImage(fieldWorkerSprite(person.frame),Math.round(person.x)-3,Math.round(person.y)-8);
}
const LIVESTOCK_FRAMES=6,LIVESTOCK_ART=new Map();
function livestockEnclosureArt(cattle,frame=0){
 const kind=cattle==='pig'?'pig':cattle?'cattle':'sheep',key=kind+':'+frame;if(LIVESTOCK_ART.has(key))return LIVESTOCK_ART.get(key);
 const low=document.createElement('canvas');low.width=32;low.height=48;const c=low.getContext('2d');
 const rect=(color,x,y,w,h)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
 rect('#71864d',0,0,32,48);
 for(let i=0;i<120;i++){const x=2+Math.floor(hs(i,4,73)*28),y=2+Math.floor(hs(i,6,73)*44);rect(['#5e753d','#829757','#a0a967'][i%3],x,y,1,i%7?1:2);}
 // A worn gate approach, scattered straw, and a wood-lined water trough.
 for(let y=40;y<47;y++)for(let x=12;x<21;x++)if(hs(x,y,91)>.35)rect(hs(x,y,92)>.5?'#9a8854':'#827342',x,y,1,1);
 for(const [x,y] of [[5,39],[8,41],[25,35],[23,37]]){rect('#b8a76c',x,y,3,1);rect('#cbbb7e',x+1,y-1,1,1);}
 rect('#3f3528',21,6,8,5);rect('#a88955',22,6,6,1);rect('#547f84',22,7,6,3);rect('#8aafab',23,7,3,1);rect('#705234',21,10,8,1);
 // Back and side rails, with small post caps and shaded inner edges.
 rect('#503b27',1,2,30,2);rect('#bb9d66',2,2,28,1);
 for(const x of [1,29]){rect('#523c27',x,2,2,44);rect('#a58552',x,3,1,43);}
 for(const x of [1,8,15,22,29]){rect('#775333',x,0,2,5);rect('#d0b078',x,0,2,1);rect('#a58251',x,1,1,3);}
 for(const y of [9,18,27,36])for(const x of [1,29]){rect('#705035',x,y,2,4);rect('#c1a16b',x,y,2,1);rect('#a38351',x,y+1,1,2);}
 const head=[0,0,1,2,1,0][frame],stride=[0,1,1,0,-1,-1][frame],tail=[0,-1,-1,0,1,1][frame];
 const animals=kind==='cattle'?[[5,12,0],[16,24,1],[5,34,0]]:[[5,10,0],[17,19,1],[5,28,0],[17,36,1]];
 for(let i=0;i<animals.length;i++){
  const [x,y,flip]=animals[i];c.save();c.translate(x+(flip?12:0),y);if(flip)c.scale(-1,1);
  rect('#53673a',0,7,12,2);const dip=(head+(i%2))%3;
  if(kind==='pig'){
   rect('#67473d',2,5+stride,1,3);rect('#67473d',7,5-stride,1,3);rect('#bc8272',2,5+stride,1,1);rect('#bc8272',7,5-stride,1,1);
   rect('#9a6259',1,1,8,5);rect('#c88e7e',0,2,10,3);rect('#dfa58f',1,1,8,3);rect('#edbca2',2,1,5,1);rect('#b2786b',1,5,8,1);
   rect('#d99b88',8,2+dip,3,3);rect('#e6af96',9,2+dip,2,2);rect('#f0b7a0',10,4+dip,2,2);rect('#955d58',11,5+dip,1,1);rect('#352c28',10,3+dip,1,1);
   rect('#a26960',8,1+dip,2,1);rect('#e8b29a',8,2+dip,1,1);
   rect('#d49985',-1,3+tail,2,1);rect('#edb69d',-1,2+tail,1,1);rect('#aa7164',0,2+tail,1,1);
   rect('#9b8250',3,4,2,1);
  }else if(kind==='cattle'){
   rect('#3e3026',2,6+stride,1,3);rect('#3e3026',7,6-stride,1,3);rect('#bca98b',2,6+stride,1,1);rect('#937e5e',7,6-stride,1,1);
   rect('#44392c',0,1,9,6);rect('#e0d4b3',1,1,7,4);rect('#b8a685',1,5,7,1);rect('#f0e4c5',2,1,5,1);
   rect(i===1?'#8d5938':'#604532',1,2,3,2);rect(i===1?'#976b43':'#71513a',5,3,3,2);rect('#b9a889',0,3,1,3);
   rect('#4b3527',8,2+dip,3,4);rect('#a87c50',8,2+dip,2,2);rect('#ccb596',10,5+dip,2,1);rect('#342c25',10,3+dip,1,1);
   rect('#e6d4aa',8,1+dip,1,1);rect('#e6d4aa',10,1+dip,1,1);rect('#8d633c',7,2+dip,1,1);
   rect('#6a5137',-1,3,1,3);rect('#3e3026',-1+tail,5,1,2);
  }else{
   rect('#443b30',2,5+stride,1,3);rect('#443b30',6,5-stride,1,3);
   rect('#9b9579',1,1,7,5);rect('#d4d0ae',0,2,9,3);rect('#e9e3c1',1,1,7,4);rect('#f4eccd',2,0,4,2);
   for(const [a,b] of [[1,2],[3,1],[5,2],[2,4],[6,4]]){rect('#bdb799',a,b,1,1);rect('#f4eccd',a+1,b-1,1,1);}
   rect('#544634',8,2+dip,3,3);rect('#806c50',9,2+dip,1,1);rect('#302b24',10,3+dip,1,1);rect('#b09d76',10,4+dip,2,1);
   rect('#79664b',8,1+dip,1,1);rect('#d4d0ae',-1,3+tail,2,1);
  }
  c.restore();
 }
 // Front rail is drawn last to preserve depth; the hinged gate has iron joints.
 rect('#503b27',1,45,30,2);rect('#bd9f69',2,45,28,1);
 for(const x of [1,11,21,29]){rect('#745032',x,43,2,5);rect('#c9a76e',x,43,2,1);rect('#aa8552',x,44,1,3);}
 rect('#a17b48',13,43,8,1);rect('#725335',13,44,8,1);rect('#4c4940',12,43,1,2);rect('#4c4940',20,43,1,2);
 LIVESTOCK_ART.set(key,low);return low;
}
function livestockEnclosureSprite(b,cattle=false){
 const island=b.island??Math.floor((b.id||0)/100000),g=WORLD?.islands[island]||G,owner=g?.byId.get(b.fieldOwner);
 const active=owner&&g.speed>0&&!owner.paused&&!owner.fire&&workshopRunning(owner)&&!WORK_ART.reduced.matches;
 const frame=active?Math.floor(g.time*3+(b.id||0))%LIVESTOCK_FRAMES:0,name='b_gehege_'+(cattle==='pig'?'schweine':cattle?'rinder':'schafe')+'_detail_'+frame;
 if(!HD_CATALOG.has(name))publishPixel(name,livestockEnclosureArt(cattle,frame),B.gehege.w*16,B.gehege.h*16,{tw:B.gehege.w,th:B.gehege.h,ex:0,hub:null,smoke:null});
 return rotatedSprite(name,b.rotation||0);
}
publishPixel('b_gehege',livestockEnclosureArt(false,0),B.gehege.w*16,B.gehege.h*16,{tw:B.gehege.w,th:B.gehege.h,ex:0,hub:null,smoke:null});
function enclosureAnimal(owner){return owner?.type==='schweinehof'?'pig':owner?.type==='rinderhof';}
function shipyardArt(frame,building){
 const a=importedBuilding('werft',1,0),low=document.createElement('canvas');low.width=a.low.width;low.height=a.low.height;const c=low.getContext('2d');c.imageSmoothingEnabled=false;nativeDrawImage.call(c,a.low,0,0);c.clearRect(Math.floor(low.width*.46),0,Math.ceil(low.width*.54),Math.floor(low.height*.5));
 const r=(color,x,y,w,h)=>{c.fillStyle=color;c.fillRect(x,y,w,h);},x=Math.floor(low.width*.56),y=Math.floor(low.height*.68),sway=[0,1,2,1,0,-1][frame],hoist=building?[0,1,2,3,2,1][frame]:0;
 // Framed workshop windows; separated amber panes also supply the night-light mask.
 for(const wx of [8,20])for(const wy of [43,58]){r('#352d28',wx-1,wy-1,5,5);r('#d2b578',wx,wy,3,3);r('#a8844e',wx,wy+4,4,1);}
 // Timber slipway, iron rail fasteners, a half-built hull and a hoisting crane.
 r('#44372b',x-5,y+1,30,23);for(let i=0;i<22;i+=3){r('#9c794b',x-4,y+2+i,28,2);r('#c3a16b',x-3,y+2+i,26,1);}
 for(const dx of [0,19]){r('#493e32',x+dx,y+2,2,21);r('#98998d',x+dx,y+2,1,20);for(let j=4;j<20;j+=5)r('#d4c8a1',x+dx,y+j,1,1);}
 r('#443426',x+2,y+6,16,12);r('#90663f',x+3,y+5,14,12);r('#c6a06a',x+4,y+5,12,1);r('#d7b981',x+5,y+7,10,8);
 for(let j=0;j<3;j++){r('#6c5033',x+5,y+8+j*3,10,1);r('#49382b',x+4+j*4,y+7,1,8);}
 r('#5a412d',x-5,y-17,3,26);r('#b68b52',x-5,y-17,1,26);r('#3b332a',x-7,y+7,7,3);r('#b18d56',x-5,y-17,22,2);r('#d4b77c',x-4,y-17,20,1);
 for(let i=0;i<13;i++)r('#7a5d39',x-3+i,y-15+i,1,1);
 r('#494640',x+14,y-16,3,3);r('#b9b194',x+15,y-15,1,8+hoist);r('#554638',x+13,y-7+hoist,5,4);r('#ba9866',x+13,y-7+hoist,5,1);
 r('#755333',x-12,y+17,5,6);r('#bd9058',x-12,y+17,5,1);r('#413b31',x-12,y+20,5,1);r('#d0a86b',x-9,y+18,1,4);
 r('#40362a',x+23,y+15,3,5);r('#ffdb83',x+24,y+16,1,2);
 const fx=Math.floor(low.width*.45),fy=Math.floor(low.height*.28);r('#62482f',fx,fy,1,12);r('#ad5141',fx+1,fy+sway,7,3);r('#de9670',fx+1,fy+sway,6,1);r('#71362c',fx+6,fy+2+sway,2,1);
 return {...a,low};
}
function shipyardSprite(b){
 const g=WORLD?.islands[b.island??activeIsland]||G,active=b.conn&&!b.paused&&!b.fire&&b.eff>0,building=workshopRunning(b),frame=active&&!WORK_ART.reduced.matches?Math.floor(g.time*3+b.id)%6:0,name='b_werft_detail_'+(building?'building':'idle')+'_'+frame;
 if(!HD_CATALOG.has(name)){const a=shipyardArt(frame,building);publishPixel(name,a.low,a.w,a.h,a.meta);}return rotatedSprite(name,b.rotation||0);
}
const cropWorkshopSprite=workshopSprite;workshopSprite=function(b){
 if(b.type==='werft')return shipyardSprite(b);
 if(b.type==='acker')return rotatedSprite(cropFieldSprite(fieldCropType(b)),b.rotation||0);
 if(b.type==='gehege'){const island=b.island??Math.floor((b.id||0)/100000),g=WORLD?.islands[island]||G;return livestockEnclosureSprite(b,enclosureAnimal(g?.byId.get(b.fieldOwner)));}
 if(b.type==='gehege'||b.type==='markt'||b.type==='forschung'){
  const island=b.island??Math.floor((b.id||0)/100000),g=WORLD?.islands[island]||G,owner=g?.byId.get(b.fieldOwner);
  const active=b.type==='forschung'?!!g?.research?.active&&researchOperating(g):b.type==='markt'?!b.paused&&!b.fire&&b.conn&&b.eff!==0:owner&&workshopRunning(owner),name=typeSprite(b.type,b.tier);
  if(!active||WORK_ART.reduced.matches)return rotatedSprite(name,b.rotation||0);
  const frame=Math.floor(G.time*3+(b.id||0))%4,key=name+'_work'+frame;
  if(!HD_CATALOG.has(key)){const a=importedBuilding(b.type,b.tier,frame);publishPixel(key,a.low,a.w,a.h,a.meta);}return rotatedSprite(key,b.rotation||0);
 }
 return cropWorkshopSprite(b);
};
const cropSetTool=setTool;setTool=function(...args){
 cropSetTool(...args);if(!['build','move'].includes(UI.tool))return;
 if(UI.type==='gehege'){
  const b=UI.tool==='move'?G.byId.get(UI.moveId):{fieldOwner:UI.fieldOwner,island:activeIsland},g=WORLD?.islands[b?.island]||G,cattle=enclosureAnimal(g.byId.get(b?.fieldOwner));
  for(const name of Object.keys(SP))if(name.startsWith('b_gehege_rotation')){delete SP[name];delete SPB[name];HD_CATALOG.delete(name);}
  publishPixel('b_gehege',livestockEnclosureArt(cattle,0),B.gehege.w*16,B.gehege.h*16,{tw:B.gehege.w,th:B.gehege.h,ex:0,hub:null,smoke:null});return;
 }
 if(UI.type!=='acker')return;
 const field=UI.tool==='move'?G.byId.get(UI.moveId):{fieldOwner:UI.fieldOwner,island:activeIsland},a=cropFieldArt(fieldCropType(field||{}));
 for(const name of Object.keys(SP))if(name.startsWith('b_acker_rotation')){delete SP[name];delete SPB[name];HD_CATALOG.delete(name);}
 publishPixel('b_acker',a.low,a.w,a.h,a.meta);
};
