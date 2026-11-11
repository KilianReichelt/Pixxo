/* Approved material and footprint artwork. Simulation and source pixels are unchanged. */
(()=>{
 const root=globalThis,waterIds=['deep','shallow','sandy_bed','rocky_bed','foam'].map(k=>'water_'+k+'_material_v01');
 let atlas=null,atlasSource=null,entryConfig=null,entriesById=new Map();
 function entry(id){const config=root.ApprovedSpriteArt?.config;if(config!==entryConfig){entryConfig=config;entriesById=new Map((config?.entries||[]).map(e=>[e.id,e]));}return entriesById.get(id);}
 function image(id){const a=root.ApprovedSpriteArt;return a?.mode==='original'?null:a?.loaded.get(id)?.frames[0]||null;}
 function waterAtlas(){
  const images=waterIds.map(image);if(images.some(x=>!x))return null;
  if(atlas&&atlasSource===images[0])return atlas;
  atlas=document.createElement('canvas');atlas.width=80;atlas.height=16;const c=atlas.getContext('2d');c.imageSmoothingEnabled=false;
  images.forEach((im,i)=>c.drawImage(im,i*16,0));atlasSource=images[0];return atlas;
 }
 function ruinId(b){
  if(b?.type!=='ruine')return null;
  const size=b.w+'x'+b.h,type=b.originalType,d=typeof B!=='undefined'?B[type]:null;
  if(b.ruinField)return size==='1x1'?'acker_ruine':null;
  if(type==='haus')return size==='3x3'?'ruine_haus':size==='2x2'?'ruine_haus_legacy':null;
  if(type==='kontor')return size==='5x5'?'ruine_hafen':null;
  if(!d)return null;
  const tier=typeof buildingPopulationTier==='function'?buildingPopulationTier(type):b.originalTier;
  if(tier===1&&d.kind==='prod'&&['3x2','2x3'].includes(size))return 'ruine_siedler_betrieb_'+size;
  if(tier===2&&d.kind==='prod'&&['4x3','3x4'].includes(size))return 'ruine_buerger_werkstatt_'+size;
  if(tier>=2&&['svc','service'].includes(d.kind)&&size==='3x3')return 'ruine_stein_gebaeude';
  return null;
 }
 function ruinKey(b){
  const id=ruinId(b);if(!id)return null;
  const selected=id,im=image(selected);
  if(!im)return null;const e=entry(selected);
  if(!e||e.footprint?.w!==b.w||e.footprint?.h!==b.h||im.width!==b.w*16)return null;
  const key='approved_ruin_'+selected;
  if(!HD_CATALOG.has(key))publishPixel(key,im,e.w,e.h,{tw:b.w,th:b.h,ex:e.h-b.h*16,hub:null,smoke:null});
  return key;
 }
 if(typeof nightBuildingSprite==='function'){const previous=nightBuildingSprite;nightBuildingSprite=function(name){const id=typeof name==='string'&&name.startsWith('approved_ruin_')?name.slice(14):null;return id&&image(id+'_night')||previous(name);};}
 root.GAME_MATERIAL_RUIN_ART={image,waterAtlas,ruinId,ruinKey};
 if(typeof ruinSprite==='function'){const previous=ruinSprite;ruinSprite=function(b,...args){return ruinKey(b)||previous(b,...args);};}
})();
