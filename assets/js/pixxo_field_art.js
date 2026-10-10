/* Jede Ackerfläche zeigt die Kultur ihres gespeicherten Mutterbetriebs. */
const FIELD_CROP_SPRITES={farm:'acker_getreide',hopfen:'acker_hopfen',weingut:'acker_trauben',gewuerzfarm:'acker_gewuerz',obsthof:'acker_obst',blumenhof:'acker_blumen'};
function fieldCropType(b){
 const island=b.island??Math.floor((b.id||0)/100000),g=WORLD?.islands[island]||G,owner=g?.byId.get(b.fieldOwner);
 return FIELD_CROP_SPRITES[owner?.type]?owner.type:'farm';
}
function cropFieldArt(crop){const d=B.acker,entry=IMPORTED_ENTRIES.get(FIELD_CROP_SPRITES[crop]||FIELD_CROP_SPRITES.farm);return {low:importedPixels(entry),w:d.w*16,h:d.h*16,meta:{tw:d.w,th:d.h,ex:0,hub:null,smoke:null}};}
function cropFieldSprite(crop){const name='b_acker_crop_'+crop+'_'+B.acker.w+'_'+B.acker.h;if(!HD_CATALOG.has(name)){const a=cropFieldArt(crop);publishPixel(name,a.low,a.w,a.h,a.meta);}return name;}
const LIVESTOCK_FRAMES=6,LIVESTOCK_ART=new Map();
function livestockEnclosureArt(cattle,frame=0){
 const key=(cattle?'cattle':'sheep')+':'+frame;if(LIVESTOCK_ART.has(key))return LIVESTOCK_ART.get(key);
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
 const animals=cattle?[[5,12,0],[16,24,1],[5,34,0]]:[[5,10,0],[17,19,1],[5,28,0],[17,36,1]];
 for(let i=0;i<animals.length;i++){
  const [x,y,flip]=animals[i];c.save();c.translate(x+(flip?12:0),y);if(flip)c.scale(-1,1);
  rect('#53673a',0,7,12,2);const dip=(head+(i%2))%3;
  if(cattle){
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
 const frame=active?Math.floor(g.time*3+(b.id||0))%LIVESTOCK_FRAMES:0,name='b_gehege_'+(cattle?'rinder':'schafe')+'_detail_'+frame;
 if(!HD_CATALOG.has(name))publishPixel(name,livestockEnclosureArt(cattle,frame),B.gehege.w*16,B.gehege.h*16,{tw:B.gehege.w,th:B.gehege.h,ex:0,hub:null,smoke:null});
 return rotatedSprite(name,b.rotation||0);
}
publishPixel('b_gehege',livestockEnclosureArt(false,0),B.gehege.w*16,B.gehege.h*16,{tw:B.gehege.w,th:B.gehege.h,ex:0,hub:null,smoke:null});
const cropWorkshopSprite=workshopSprite;workshopSprite=function(b){
 if(b.type==='acker')return rotatedSprite(cropFieldSprite(fieldCropType(b)),b.rotation||0);
 if(b.type==='gehege'){const island=b.island??Math.floor((b.id||0)/100000),g=WORLD?.islands[island]||G;return livestockEnclosureSprite(b,g?.byId.get(b.fieldOwner)?.type==='rinderhof');}
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
  const b=UI.tool==='move'?G.byId.get(UI.moveId):{fieldOwner:UI.fieldOwner,island:activeIsland},g=WORLD?.islands[b?.island]||G,cattle=g.byId.get(b?.fieldOwner)?.type==='rinderhof';
  for(const name of Object.keys(SP))if(name.startsWith('b_gehege_rotation')){delete SP[name];delete SPB[name];HD_CATALOG.delete(name);}
  publishPixel('b_gehege',livestockEnclosureArt(cattle,0),B.gehege.w*16,B.gehege.h*16,{tw:B.gehege.w,th:B.gehege.h,ex:0,hub:null,smoke:null});return;
 }
 if(UI.type!=='acker')return;
 const field=UI.tool==='move'?G.byId.get(UI.moveId):{fieldOwner:UI.fieldOwner,island:activeIsland},a=cropFieldArt(fieldCropType(field||{}));
 for(const name of Object.keys(SP))if(name.startsWith('b_acker_rotation')){delete SP[name];delete SPB[name];HD_CATALOG.delete(name);}
 publishPixel('b_acker',a.low,a.w,a.h,a.meta);
};
