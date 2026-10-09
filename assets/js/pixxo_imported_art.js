/* Import der vom Nutzer bereitgestellten Pixelentwürfe und Warenicons. */
const IMPORTED_BUILD_NAMES={haus:['siedlerhaus','buergerhaus','patrizierhaus'],kontor:['kontor_stufe_1','kontor_stufe_2','kontor_stufe_3','kontor_stufe_4'],lager:'lagerhaus',werft:'segelschiffwerft',markt:'marktplatz',holzfaeller:'holzfaeller',fischer:'fischerhuette',mine:'eisenmine',farm:'bauernhof',schaefer:'schaeferei',hopfen:'hopfenfarm',gewuerzfarm:'gewuerzplantage',schmelze:'eisenschmelze',feuer:'feuerwehr',acker:'ackerflaeche',gehege:'tiergehege'};
const IMPORTED_ICONS=['holz','bretter','stein','erz','eisen','werkzeug','fisch','getreide','mehl','brot','hopfen','bier','trauben','wein','gewuerz','aepfel','honig','most','wolle','tuch','talg','blueten','goldstaub','seife','moebel','parfuem','schmuck'];
const IMPORTED_ENTRIES=new Map(IMPORTED_SPRITE_DATA.atlas.map(e=>[e.id,e])),IMPORTED_SHEETS={},IMPORTED_PIXEL_CACHE=new Map();
for(const [name,sheet] of Object.entries(IMPORTED_SPRITE_DATA.images)){
 const canvas=document.createElement('canvas');canvas.width=sheet.w;canvas.height=sheet.h;const c=canvas.getContext('2d'),image=c.createImageData(sheet.w,sheet.h),bytes=atob(sheet.data);
 for(let k=0;k<bytes.length;k++)image.data.set(IMPORTED_SPRITE_DATA.palette[bytes.charCodeAt(k)],k*4);
 c.putImageData(image,0,0);IMPORTED_SHEETS[name]=canvas;
}
function buildingRequiresBricks(type,tier=1){
 if((B[type]?.cost?.ziegel||0)>0)return true;
 const upgrades=type==='haus'?UPG:type==='kontor'?PORT:null;
 for(let level=2;level<=tier;level++)if((upgrades?.[level]?.cost?.ziegel||upgrades?.[level]?.ziegel||0)>0)return true;
 return false;
}
function importedPixels(entry,frame=0,brickRoof=false){
 const key=entry.id+':'+frame+':'+brickRoof;if(IMPORTED_PIXEL_CACHE.has(key))return IMPORTED_PIXEL_CACHE.get(key);
 const low=document.createElement('canvas');low.width=entry.w;low.height=entry.h;const c=low.getContext('2d');c.imageSmoothingEnabled=false;
 const animated=entry.frames>1&&frame>0;
 const sheet=(animated?'animations':'buildings')+(brickRoof?'':'_without_bricks');
 nativeDrawImage.call(c,IMPORTED_SHEETS[sheet],animated?frame%4*entry.w:entry.x,animated?entry.animationY:entry.y,entry.w,entry.h,0,0,entry.w,entry.h);
 IMPORTED_PIXEL_CACHE.set(key,low);return low;
}
function importedBuilding(type,tier=1,frame=0){
 if(type==='depot')return depotBuildingArt();
 const alias=IMPORTED_BUILD_NAMES[type],id=Array.isArray(alias)?alias[tier-1]:alias||type,entry=IMPORTED_ENTRIES.get(id);
 if(!entry)throw Error('Gebäudesprite fehlt: '+type);
 const d=B[type],extra=d.kind==='field'?0:Math.max(12,Math.round(d.h*5)),w=d.w*16,h=d.h*16+extra;
 return {low:importedPixels(entry,entry.frames>1?frame:0,buildingRequiresBricks(type,tier)),w,h,meta:{tw:d.w,th:d.h,ex:extra,hub:null,smoke:null}};
}
installNativeBuildings=function(){
 for(const name of Object.keys(SP))if(name.includes('_rotation')||name.includes('_work')){delete SP[name];delete SPB[name];HD_CATALOG.delete(name);}
 for(const type of Object.keys(B))for(const tier of type==='haus'?[1,2,3]:type==='kontor'?[1,2,3,4]:[1]){const a=importedBuilding(type,tier);const name=typeSprite(type,tier);publishPixel(name,a.low,a.w,a.h,a.meta);const alias=IMPORTED_BUILD_NAMES[type],id=Array.isArray(alias)?alias[tier-1]:alias||type;if(IMPORTED_ENTRIES.get(id)?.frames>1)for(let f=0;f<4;f++){const animated=importedBuilding(type,tier,f);publishPixel(name+'_work'+f,animated.low,animated.w,animated.h,animated.meta);}}
 land?.chunks?.clear();
};
workshopSprite=function(b){
 const name=typeSprite(b.type,b.tier);if(!workshopRunning(b)||WORK_ART.reduced.matches)return rotatedSprite(name,b.rotation||0);
 const frame=Math.floor(G.time*6+b.id)%4,key=name+'_work'+frame;
 if(!HD_CATALOG.has(key)){const a=importedBuilding(b.type,b.tier,frame);publishPixel(key,a.low,a.w,a.h,a.meta);}return rotatedSprite(key,b.rotation||0);
};
installNativeBuildings();
IMPORTED_ICONS.forEach((id,i)=>{
 const low=document.createElement('canvas');low.width=low.height=16;const c=low.getContext('2d');c.imageSmoothingEnabled=false;
 nativeDrawImage.call(c,IMPORTED_SHEETS.icons,(i%8)*16,Math.floor(i/8)*16,16,16,0,0,16,16);publishPixel(id,low,16,16);
});


