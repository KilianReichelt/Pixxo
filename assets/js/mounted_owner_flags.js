/* Batch 151: approved measured geometry, composited on immutable approved sources. */
(function(root){
 const cache=new Map(),records=new Map(),limit=192;let serial=0,entryConfig=null,entryCount=-1,entriesById=new Map();
 const colors=['#b7463d','#4275a8','#d2a546','#56865a','#9064a8','#3c9494'];
 function forget(key){cache.delete(key);records.delete(key);delete SP[key];delete SPB[key];HD_CATALOG.delete(key);if(typeof urlC!=='undefined')delete urlC[key];}
 function clear(){for(const key of [...records.keys()])forget(key);}
 function approved(b,name){
  const match=/^review_(.+)_([0-7])$/.exec(name||''),runtime=root.ApprovedSpriteArt||root.SpriteReview;
  const config=runtime?.config;
  if(config&&(entryConfig!==config||entryCount!==config.entries.length)){entryConfig=config;entryCount=config.entries.length;entriesById=new Map(config.entries.map(e=>[e.id,e]));}
  const e=match&&entriesById.get(match[1]);
  return e&&e.buildingType==='kontor'&&e.tier===b.tier&&e.lighting!=='night'&&e.w===80&&e.h===(b.tier<3?96:112)&&e.footprint?.w===5&&e.footprint?.h===5&&b.w===5&&b.h===5?e:null;
 }
 function phase(b){const g=typeof WORLD!=='undefined'&&WORLD?.islands?.[b.island]||G;return WORK_ART.reduced.matches||g.speed===0?0:((Math.floor((g.time||0)/.17+(b.id||0))%8)+8)%8;}
 function compose(source,tier,frame,color,night){const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(source,0,0);root.MountedOwnerFlags.draw(ctx,tier,frame,color,night);return canvas;}
 function sprite(b,name){
  if(b.type!=='kontor'||!root.MountedOwnerFlags||!approved(b,name))return name;
  const color=typeof identityForIsland==='function'?identityForIsland(b.island)?.color:null;if(!colors.includes(color))return name;
  const source=HD_CATALOG.get(name)?.pixelSource||SP[name];if(!source||source.width!==80||source.height!==(b.tier<3?96:112))return name;
  const frame=phase(b),signature=name+':'+color+':'+frame;
  for(const [key,r] of records)if(r.signature===signature){if(r.source===source&&SP[key])return key;forget(key);break;}
  const key='b_mounted_owner_flag_'+(++serial),canvas=compose(source,b.tier,frame,color,false);
  publishPixel(key,canvas,SP[name].width,SP[name].height,SPB[name]);
  const record={signature,source,name,tier:b.tier,frame,color};cache.set(key,record);records.set(key,record);
  while(cache.size>limit)forget(cache.keys().next().value);return key;
 }
 const previous=workshopSprite;workshopSprite=function(b){return sprite(b,previous(b));};
 if(typeof spName==='function'){const previousName=spName;spName=function(b){return sprite(b,previousName(b));};}
 const previousNight=nightBuildingSprite;nightBuildingSprite=function(name){const r=records.get(name);if(!r)return previousNight(name);const source=previousNight(r.name);if(!source)return null;if(r.nightSource!==source){r.nightSource=source;r.night=compose(source,r.tier,r.frame,r.color,true);}return r.night;};
 root.MountedOwnerFlagRuntime={sprite,phase,approved,clear,colors,get size(){return cache.size;}};
})(window);
