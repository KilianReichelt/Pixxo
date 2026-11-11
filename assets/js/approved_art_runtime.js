/* Preview-only topology. Compatible footprint edge midpoints must coincide. */
(function(root){
 const groups={deko_holzzaun:'wood',deko_lattenzaun:'wood',deko_weidenzaun:'wood',deko_holztor:'wood',deko_hecke:'hedge',deko_steinmauer:'stone',deko_steintor:'stone',deko_ziergitter:'metal',deko_ziergittertor:'metal'};
 function mask(b,g){if(!groups[b.type])return null;g=g||(typeof WORLD!=='undefined'&&WORLD?.islands?.[b.island])||(typeof G!=='undefined'?G:null);if(!g)return 0;let result=0;const candidates=new Set();
  if(g.occ&&g.byId&&typeof MAPW!=='undefined'){
   const add=(x,y)=>{if(x<0||y<0||x>=MAPW||typeof MAPH!=='undefined'&&y>=MAPH)return;const id=g.occ[y*MAPW+x],n=g.byId.get(id)||(id<0?g.buildingPlans?.find(p=>p.id===id):null);if(n)candidates.add(n);};
   for(let x=b.x;x<b.x+b.w;x++){add(x,b.y-1);add(x,b.y+b.h);}for(let y=b.y;y<b.y+b.h;y++){add(b.x-1,y);add(b.x+b.w,y);}
  }else for(const n of [...(g.blds||[]),...(g.buildingPlans||[])])candidates.add(n);
  for(const n of candidates){if(n===b||n.id===b.id&&n.x===b.x&&n.y===b.y||groups[n.type]!==groups[b.type])continue;
   const sameX=b.x+b.w/2===n.x+n.w/2,sameY=b.y+b.h/2===n.y+n.h/2;
   if(sameX&&n.y+n.h===b.y)result|=1;if(sameY&&n.x===b.x+b.w)result|=2;if(sameX&&n.y===b.y+b.h)result|=4;if(sameY&&n.x+n.w===b.x)result|=8;
  }return result;
 }
 root.reviewBoundaryMask=mask;
})(globalThis);

/* Generated canonical approved-art adapter; no sandbox or review controls. */
(()=>{
 const config=window.GAME_APPROVED_ART, loaded=new Map(), originals=new Map();
 const orderedEntries=[...config.entries].sort((a,b)=>(b.priority||0)-(a.priority||0));
 const entriesById=new Map(config.entries.map(e=>[e.id,e])),depositDays=new Map(),depositNights=new Map(),nightEntries=new Map();for(const e of config.entries){if(e.type!=='deposit')continue;const map=e.lighting==='night'?depositNights:depositDays,key=e.lighting==='night'?e.dayId:e.depositType+':'+e.side;if(!map.has(key))map.set(key,[]);map.get(key).push(e);}for(const e of orderedEntries)if(e.lighting==='night'&&e.dayId&&!nightEntries.has(e.dayId))nightEntries.set(e.dayId,e);
 const worldEntries=new Map(),worldOriginals=new Map(),vehicleEntries=new Map(),pullerEntries=new Map(),vehiclePresentations=new Map(),roadEntries=new Map(),pendingLoads=new Set(),failedLoads=new Set();let worldRevision='',groundSetup='',groundActive=false,groundMacroActive=false;
 for(const e of orderedEntries)if(e.type==='world-road'){const key=e.material+':'+e.mask+':'+e.variant;if(!roadEntries.has(key))roadEntries.set(key,e);}
 function roadSprite(mask,stone,x=0,y=0){
  if(mode==='original'||!roadEntries.size)return null;
  const seed=WORLD?.rootSeed||G?.seed||1,variant=Math.min(2,Math.floor(hs(x,y,seed+1927)*3)),entry=roadEntries.get((stone?'stoneroad':'road')+':'+mask+':'+variant);
  if(!entry||!enabled(entry))return null;
  if(!loaded.has(entry.id))loadEntry(entry);
  return loaded.get(entry.id)?.frames[0]||null;
 }
 // Keep the existing road geometry, placement, bridge dispatch and routing.
 if(typeof diagonalRoadSprite==='function'){const original=diagonalRoadSprite;diagonalRoadSprite=function(mask,stone,x,y){return roadSprite(mask,stone,x,y)||original(mask,stone,x,y);};}
 if(typeof pixelRoadSprite==='function'){const original=pixelRoadSprite;pixelRoadSprite=function(mask,stone,x,y){return roadSprite(mask,stone,x,y)||original(mask,stone,x,y);};}
 for(const e of orderedEntries)if(e.type==='puller'){const key=e.direction+'/'+e.lighting;if(!pullerEntries.has(key))pullerEntries.set(key,[]);pullerEntries.get(key).push(e);}
 for(const e of orderedEntries)if(e.type==='vehicle'){const key=e.vehicleType+'/'+e.direction+'/'+e.lighting;if(!vehicleEntries.has(key))vehicleEntries.set(key,[]);vehicleEntries.get(key).push(e);}
 for(const e of orderedEntries)if(e.type==='world'){if(!worldEntries.has(e.key))worldEntries.set(e.key,[]);worldEntries.get(e.key).push(e);}
 function worldSprite(key){if(typeof GAME_GROUND_STYLE!=='undefined'&&GAME_GROUND_STYLE.legacyGrass&&/^grass[0-3]$/.test(key))return null;const entries=worldEntries.get(key);if(!entries)return null;const day=entries.find(e=>e.lighting==='day'&&enabled(e)&&loaded.has(e.id));if(!day)return null;const dark=day.worldKind!=='terrain'&&day.worldKind!=='tree'&&(typeof nightAmount==='function'?nightAmount()>=.5:lighting.value==='night'),night=dark&&entries.find(e=>e.dayId===day.id&&e.lighting==='night'&&enabled(e)&&loaded.has(e.id));return loaded.get((night||day).id).frames[0];}
 function configureGround(){
  if(typeof TERRAIN_MATERIALS==='undefined')return false;
  const legacyGrass=typeof GAME_GROUND_STYLE!=='undefined'&&GAME_GROUND_STYLE.legacyGrass;
  const get=key=>{const e=(worldEntries.get(key)||[]).find(e=>e.lighting==='day'&&enabled(e)&&loaded.has(e.id));return e&&{entry:e,image:loaded.get(e.id).frames[0]};},fallback=key=>{const original=worldOriginals.get(key),image=original?.catalog?.pixelSource||original?.sprite||HD_CATALOG.get(key)?.pixelSource||SP[key];return image&&{entry:{id:'original:'+key,w:image.width},image,original:true};},grass=['grass0','grass1','grass2','grass3'].map(key=>(legacyGrass?null:get(key))||fallback(key)),sand=['sand0','sand1','sand2'].map(key=>get(key)||fallback(key)),rock=['rock0','rock1','rock2','rock3'].map(get).filter(Boolean),ore=[get('ore')].filter(Boolean),flowers=orderedEntries.filter(e=>e.type==='world-overlay'&&e.overlayKind==='wildflowers'&&enabled(e)&&loaded.has(e.id)),masks=['n','e','s','w','ne','se','sw','nw'].map(direction=>orderedEntries.find(e=>e.type==='terrain-edge-mask'&&e.direction===direction&&enabled(e)&&loaded.has(e.id))).filter(Boolean),seed=WORLD?.rootSeed||G?.seed||1,macros=grass.every(e=>e&&!e.original&&e.entry.w===32)&&sand.every(e=>e&&!e.original&&e.entry.w===32),active=mode!=='original'&&(legacyGrass||macros||rock.length===4)&&grass.every(Boolean)&&sand.every(Boolean),rockPalette=rock.map(e=>mode==='drafts'?(e.entry.draftRockPalette||e.entry.rockPalette):e.entry.rockPalette).find(Boolean),surfaceRegions=(legacyGrass?get('grass0'):grass.find(e=>e.entry.surfaceRegions))?.entry.surfaceRegions,signature=JSON.stringify([rockPalette||null,surfaceRegions||null,!!legacyGrass])+':'+mode+':'+seed+':'+[...grass,...sand,...rock,...ore].filter(Boolean).map(e=>e.entry.id).concat(flowers.map(e=>e.id),masks.map(e=>e.id)).join(',');
  if(signature===groundSetup)return false;groundSetup=signature;const changed=groundActive!==active;groundActive=active;groundMacroActive=macros||legacyGrass;if(!active)return changed;
  TERRAIN_MATERIALS.configure({flowerDensity:null,rockPalette,surfaceRegions,revision:signature,materialsRevision:seed+':'+[...grass,...sand,...rock,...ore].filter(Boolean).map(e=>e.entry.id).join(','),seed,grass:grass.map(e=>e.image),sand:sand.map(e=>e.image),rock:rock.map(e=>e.image),ore:ore.map(e=>e.image),flowers:[],edgeMasks:masks.map(e=>loaded.get(e.id).frames[0]),hasFlowers:()=>false});return true;
 }
 function terrainTile(x,y,type){worldArt();if(!groundMacroActive&&typeof T!=='undefined'&&[T.GRASS,T.FOREST,T.SAND].includes(type))return null;return groundActive&&typeof T!=='undefined'?TERRAIN_MATERIALS.tile(x,y,type,{tiles:G.tiles,width:MAPW,height:MAPH},T,typeof GAME_GROUND_STYLE!=='undefined'&&GAME_GROUND_STYLE.legacyGrass&&[T.GRASS,T.FOREST].includes(type)?legacyGrassSource(x,y):null):null;}
 function terrainAtlas(view){worldArt();return groundActive?(view?TERRAIN_MATERIALS.terrainViewAtlas(...view):TERRAIN_MATERIALS.terrainAtlas()):null;}
 function forestSprite(x,y,point){
  const seed=WORLD?.rootSeed||G.seed||1,slot=point?.slot||0,patch=hs(Math.floor(x/5),Math.floor(y/5),seed+499),local=hs(x*5+slot,y,seed+501),kind=local<.22?hs(x+slot*103,y+slot*47,seed+499):patch,base=['tree0','tree1','tree_birch','tree_oak'][kind<.35?0:kind<.70?1:kind<.85?2:3],size=hs(x*7+slot,y*3,seed+505),variant=size<.25?'_young':size>.62?'_mature':'';
  return worldSprite(base+variant)||worldSprite(base);
 }
 function worldArt(){
  const dark=typeof nightAmount==='function'?nightAmount()>=.5:lighting.value==='night',revision=mode+':'+dark+':'+loaded.size+':'+(WORLD?.rootSeed||G?.seed||1);if(worldRevision===revision)return;worldRevision=revision;
  let changed=false,changedGround=false;
  for(const [key,entries]of worldEntries){
   if(!worldOriginals.has(key))worldOriginals.set(key,{sprite:SP[key],catalog:HD_CATALOG.get(key),meta:SPB[key],url:urlC[key]});
   const image=worldSprite(key),original=worldOriginals.get(key);
   if(image){if(SP[key]===image||HD_CATALOG.get(key)?.pixelSource===image)continue;const e=entries[0];publishPixel(key,image,e.w,e.h,{tw:e.worldKind==='terrain'?e.w/16:1,th:e.worldKind==='terrain'?e.h/16:1,ex:e.worldKind==='terrain'?0:Math.max(0,e.h-16)});}
   else{if(SP[key]===original.sprite)continue;if(original.sprite)SP[key]=original.sprite;else delete SP[key];if(original.catalog)HD_CATALOG.set(key,original.catalog);else HD_CATALOG.delete(key);if(original.meta)SPB[key]=original.meta;else delete SPB[key];if(original.url)urlC[key]=original.url;else delete urlC[key];}
   changed=true;if(entries[0].worldKind==='terrain')changedGround=true;
  }
  if(configureGround())changedGround=true;
  if(changed&&typeof LANDSCAPE_CACHE!=='undefined')LANDSCAPE_CACHE.clear();if(changedGround){land?.chunks?.clear();if(typeof GAME_WATER_QUALITY!=='undefined')GAME_WATER_QUALITY.refreshTerrainArt?.();}if((changed||changedGround)&&G)G.dirty=true;
 }
 const entriesByBuilding=new Map(),fieldEntries=orderedEntries.filter(e=>e.type==='field');
 for(const e of orderedEntries)if(e.type==='building'){if(!entriesByBuilding.has(e.buildingType))entriesByBuilding.set(e.buildingType,[]);entriesByBuilding.get(e.buildingType).push(e);}
 const variantGroups=new Map();let variantRevision='';
 function reviewVariants(group){const revision=mode+':'+loaded.size;if(revision!==variantRevision){variantGroups.clear();variantRevision=revision;}if(!variantGroups.has(group))variantGroups.set(group,orderedEntries.filter(v=>v.variantGroup===group&&v.lighting==='day'&&enabled(v)&&loaded.has(v.id)).map(v=>v.variantIndex).filter((v,i,a)=>a.indexOf(v)===i).sort((a,b)=>a-b));return variantGroups.get(group);}
 const mode='approved',lighting={value:'clock'};let failed=0;
 const enabled=e=>mode==='drafts'||mode==='approved'&&e.status==='motiv_freigegeben';
 let refreshPending=false;
 const update=()=>{if(refreshPending)return;refreshPending=true;requestAnimationFrame(()=>{refreshPending=false;icons();worldArt();refreshReviewUI();if(typeof land!=='undefined')land?.chunks?.clear();if(typeof G!=='undefined'&&G)G.dirty=true;});};
 let previousPendingPortrait;
 const originalPortraitPool=typeof PLAYER_PORTRAITS!=='undefined'?[...PLAYER_PORTRAITS]:null;
 function icons(){for(const e of config.entries.filter(e=>e.type==='icon'||e.type==='portrait')){const a=loaded.get(e.id);if(!a)continue;if(!originals.has(e.key))originals.set(e.key,{sprite:SP[e.key],catalog:HD_CATALOG.get(e.key),meta:SPB[e.key],url:urlC[e.key]});if(enabled(e)){publishPixel(e.key,a.frames[0],e.w,e.h);SP[e.key]._logicalWidth=e.displaySize||16;SP[e.key]._logicalHeight=e.type==='portrait'?(e.displaySize||16)*e.h/e.w:e.displaySize||16;urlC[e.key]=e.path;}else{const o=originals.get(e.key);SP[e.key]=o.sprite;if(o.catalog)HD_CATALOG.set(e.key,o.catalog);else HD_CATALOG.delete(e.key);if(o.meta)SPB[e.key]=o.meta;else delete SPB[e.key];if(o.url)urlC[e.key]=o.url;else delete urlC[e.key];}}if(originalPortraitPool){const pool=config.entries.filter(e=>e.type==='portrait'&&enabled(e)&&loaded.has(e.id));PLAYER_PORTRAITS.splice(0,PLAYER_PORTRAITS.length,...(pool.length===10?pool.map(e=>e.key):originalPortraitPool));if(typeof pendingPortrait!=='undefined'){if(pool.length===10&&!PLAYER_PORTRAITS.includes(pendingPortrait)){previousPendingPortrait=pendingPortrait;pendingPortrait=PLAYER_PORTRAITS[0];}else if(pool.length!==10&&previousPendingPortrait!==undefined){pendingPortrait=previousPendingPortrait;previousPendingPortrait=undefined;}}}if(typeof dekoToggle!=='undefined')dekoToggle.innerHTML=ic('game_deko',1.5);if(typeof refreshDesktopControlIcons==='function')refreshDesktopControlIcons();}
 let uiPending=false;
 function refreshReviewUI(){if(uiPending)return;uiPending=true;const render=()=>{uiPending=false;if(!G||!WORLD)return;if(typeof refreshWins==='function')refreshWins();if(typeof renderTop==='function')renderTop(true);if(typeof renderBar==='function')renderBar();if(typeof renderItems==='function')renderItems(true);};if(typeof requestAnimationFrame==='function')requestAnimationFrame(render);else render();}
 function poleDirection(b){
  const directions=['e','se','s','sw','w','nw','n','ne'];
  if(directions.includes(b.poleDirection))return b.poleDirection;
  const g=WORLD?.islands[b.island]||G;
  const topology=g.powerTopology||(typeof needsPowerTopology==='function'?needsPowerTopology(g):null);
  const neighbours=topology?.neighbours?.get(b.id)||[];
  const next=[...neighbours].sort((a,c)=>(a.id||0)-(c.id||0))[0];
  if(!next)return 's';
  const dx=next.x+(next.w||B[next.type]?.w||1)/2-b.x-(b.w||1)/2,dy=next.y+(next.h||B[next.type]?.h||1)/2-b.y-(b.h||1)/2;
  return directions[(Math.round(Math.atan2(dy,dx)/(Math.PI/4))+8)%8];
 }
 function entryFor(b,preview=false){const direction=b.type==='kabelmast'?poleDirection(b):null,connectionMask=typeof reviewBoundaryMask==='function'?reviewBoundaryMask(b):0;return (b.type==='acker'?fieldEntries:entriesByBuilding.get(b.type)||[]).find(e=>{
  if(!enabled(e)||!loaded.has(e.id)||e.lighting==='night')return false;
  if(e.variantGroup){const variants=reviewVariants(e.variantGroup);const index=b.type==='haus'?0:Math.abs(b.id||0);if(e.variantIndex!==variants[index%variants.length])return false;}
  if(e.type==='field')return b.type==='acker'&&b.w*16===e.w&&b.h*16===e.h&&(WORLD?.islands[b.island]||G).byId.get(b.fieldOwner)?.type===e.ownerType;
  if(e.type!=='building'||e.buildingType!==b.type||e.tier&&e.tier!==b.tier)return false;
  if(e.connectionMask!=null&&e.connectionMask!==connectionMask)return false;
  if(e.ownerType&&(WORLD?.islands[b.island]||G).byId.get(b.fieldOwner)?.type!==e.ownerType)return false;
  if(e.serviceLevel&&e.serviceLevel!==Math.max(1,Math.min(b.type==='feuer'?4:3,Math.trunc(b.serviceLevel)||1)))return false;
  if(e.minStage!=null&&(b.project?.stage??0)<e.minStage)return false;
  if(e.maxStage!=null&&(b.project?.stage??0)>e.maxStage)return false;
  if(e.buildingType==='kabelmast'&&e.direction&&e.direction!==direction)return false;
  if(e.rotations&&!e.rotations.includes(((b.rotation||0)%4+4)%4))return false;
  if(e.w!==b.w*16+(e.visualOverhangX||0)*2||e.footprint&&e.footprint.h!==b.h)return false; // Legacy footprints retain their existing graphics.
  if(e.side){const node=(WORLD?.islands[b.island]||G).deposits.find(n=>n.type===b.type&&n.x===b.x&&n.y===b.y);if((node?.anchor?.side||(preview?'south':null))!==e.side)return false;}
  return true;
 });}
 function idleFor(e){const idle=e.idleId&&entriesById.get(e.idleId);return idle&&idle.type===e.type&&['building','field'].includes(idle.type)&&enabled(idle)&&loaded.has(idle.id)?idle:null;}
 function buildingRunning(b,e){
  if(e.animationMode==='enclosure'){const owner=(WORLD?.islands[b.island]||G).byId.get(b.fieldOwner);return !!owner&&!b.paused&&!b.fire&&workshopRunning(owner);}
  if(e.animationMode==='power')return !!b.powered&&!b.paused&&!b.fire&&(!e.nodeRequiresRoad||!!b.conn);
  if(e.animationMode==='generator')return !b.paused&&!b.fire&&!!b.conn&&b.staffEff>0&&b.powerFuelRemaining>0;
  if(e.animationMode==='service')return !b.paused&&!b.fire&&!!b.conn;
  return e.buildingType==='markt'||e.animationMode==='ambient'?!b.paused:workshopRunning(b);
 }
 function sprite(b){const e=entryFor(b);if(!e)return null;const g=WORLD?.islands[b.island]||G;const owner=e.type==='field'?g.byId.get(b.fieldOwner):null;const running=e.type==='field'?!!owner&&!b.paused&&!b.fire&&!owner.paused&&!owner.fire&&workshopRunning(owner):buildingRunning(b,e);const active=e.frames===8&&g.speed>0&&running&&!WORK_ART.reduced.matches;const idle=idleFor(e);if(!active&&idle)return 'review_'+idle.id+'_0';const frame=active?Math.floor((g.time||0)/.17+(b.id||0))%8:0;return 'review_'+e.id+'_'+frame;}
 function depositSprite(node,side){const day=(depositDays.get(node.type+':'+side)||[]).find(e=>enabled(e)&&loaded.has(e.id));if(!day)return null;const dark=typeof nightAmount==='function'?nightAmount()>=.5:lighting.value==='night';const night=dark&&(depositNights.get(day.id)||[]).find(e=>enabled(e)&&loaded.has(e.id));return loaded.get((night||day).id).frames[0];}
 function depositPlacement(node,side){const image=depositSprite(node,side),d=B[node.type];if(!image||!d||image.width>d.w*16||image.height>d.h*16)return null;return {image,x:side==='west'?node.x*16:side==='east'?(node.x+d.w)*16-image.width:node.x*16+Math.floor((d.w*16-image.width)/2),y:side==='north'?node.y*16:side==='south'?(node.y+d.h)*16-image.height:node.y*16+Math.floor((d.h*16-image.height)/2)};}
 function vehicleSprite(type,direction,g,travelling=true,phase=0){
  const family=(vehicleEntries.get(type+'/'+direction+'/day')||[]).filter(e=>enabled(e)&&loaded.has(e.id));
  const moving=travelling&&g.speed>0&&!WORK_ART.reduced.matches;
  let entry=family.find(e=>e.frames===(moving?8:1))||family.find(e=>e.frames===1);if(!entry)return null;
  const dark=typeof nightAmount==='function'?nightAmount()>=.5:lighting.value==='night';
  if(dark){const night=(vehicleEntries.get(type+'/'+direction+'/night')||[]).find(e=>e.dayId===entry.id&&enabled(e)&&loaded.has(e.id));if(night)entry=night;}
  const frame=moving&&entry.frames===8?Math.floor((g.time||0)/.17+phase)%8:0;
  return loaded.get(entry.id).frames[frame];
 }
 function vehiclePresentation(type,direction,g,travelling=true,phase=0){
  const body=vehicleSprite(type,direction,g,travelling,phase);if(!body)return null;
  const moving=travelling&&g.speed>0&&!WORK_ART.reduced.matches,dark=typeof nightAmount==='function'?nightAmount()>=.5:lighting.value==='night',family=(pullerEntries.get(direction+'/'+(dark?'night':'day'))||[]).filter(e=>enabled(e)&&loaded.has(e.id)),personEntry=family.find(e=>e.frames===(moving?8:1))||family.find(e=>e.frames===1),frame=moving&&personEntry?.frames===8?Math.floor((g.time||0)/Math.max(.06,(personEntry.frameDuration||170)/1000)+phase)%8:0,person=personEntry&&loaded.get(personEntry.id).frames[frame],bodySize=type==='cargo-cart'?20:22,key=mode+':'+loaded.size+':'+type+':'+direction+':'+dark+':'+(body._reviewFrameId||'')+':'+frame+':'+!!person;
  if(vehiclePresentations.has(key))return vehiclePresentations.get(key);
  const vehicleAttachment=(vehicleEntries.get(type+'/'+direction+'/'+(dark?'night':'day'))||[]).find(e=>enabled(e)&&loaded.has(e.id)&&e.pullerShaftMidpoint)?.pullerShaftMidpoint;
  const canvas=document.createElement('canvas');canvas.width=canvas.height=40;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;const bodyLeft=20-bodySize/2,grip=personEntry?.gripPoint||[8,10],shaft=vehicleAttachment||personEntry?.vehicleShaftMidpoint||[16,16],personLeft=Math.round(bodyLeft+shaft[0]*bodySize/32-grip[0]*.5),personTop=Math.round(bodyLeft+shaft[1]*bodySize/32-grip[1]*.5),drawPerson=()=>{if(person)c.drawImage(person,personLeft,personTop,8,10);};
  if(direction.includes('n'))drawPerson();c.drawImage(body,bodyLeft,bodyLeft,bodySize,bodySize);if(!direction.includes('n'))drawPerson();
  canvas._bodyDrawSize=bodySize;canvas._vehicleBody=body;canvas._puller=person;canvas._pullerContact=person?[personLeft+grip[0]*.5,personTop+grip[1]*.5]:null;canvas._shaftContact=[bodyLeft+shaft[0]*bodySize/32,bodyLeft+shaft[1]*bodySize/32];
  if(vehiclePresentations.size>512)vehiclePresentations.clear();vehiclePresentations.set(key,canvas);return canvas;
 }
 if(typeof natureBeginFrame==='function'){const previous=natureBeginFrame;natureBeginFrame=function(...args){worldArt();return previous(...args);};}
 if(typeof landscapeTreeSprite==='function'){const previous=landscapeTreeSprite;landscapeTreeSprite=function(x,y){worldArt();const seed=WORLD?.rootSeed||G.seed,kind=hs(x,y,seed+499),key=['tree0','tree1','tree_birch','tree_oak'][kind<.35?0:kind<.70?1:kind<.85?2:3];return worldSprite(key)||previous(x,y);};}
 if(typeof landscapeGrassSprite==='function'){const previous=landscapeGrassSprite;landscapeGrassSprite=function(x,y,forest=false){worldArt();return(typeof T!=='undefined'&&terrainTile(x,y,forest?T.FOREST:T.GRASS))||worldSprite('grass'+Math.floor(hs(x,y,77)*4))||previous(x,y,forest);};}
 if(typeof drawWagon==='function'){const previous=drawWagon;drawWagon=function(ctx,x,y,cart,alpha=1){const g=(typeof islandAt==='function'&&WORLD?.islands?.[islandAt(cart.path[0]%MAPW,Math.floor(cart.path[0]/MAPW))])||G,direction=gameVehicleDirection(cart),image=vehiclePresentation('cargo-cart',direction,g,!cart.wait&&cart.fadeStart===undefined&&cart.t<cart.path.length-1,cart.target||0);if(!image)return previous(ctx,x,y,cart,alpha);ctx.save();ctx.globalAlpha*=alpha;ctx.imageSmoothingEnabled=false;ctx.drawImage(image,Math.round(x)-20,Math.round(y)-20,40,40);if(cart.qty>0&&cart.col){const cargo=SP['g_'+cart.col]||SP[cart.col];if(cargo){const entry=(vehicleEntries.get('cargo-cart/'+direction+'/day')||[]).find(e=>e.frames===1&&enabled(e)&&loaded.has(e.id)),anchor=entry?.cargoAnchor||[16,14];ctx.drawImage(cargo,Math.round(x+(anchor[0]-16)*20/32-2.5),Math.round(y+(anchor[1]-16)*20/32-5),5,5);}}if(UI.sel&&(cart.source===UI.sel||cart.target===UI.sel)){ctx.strokeStyle='#ffe16a';ctx.lineWidth=1.5;ctx.strokeRect(Math.round(x)-13,Math.round(y)-13,26,26);}ctx.restore();};}
 function dedicatedNight(name){const match=/^review_(.+)_([0-7])$/.exec(name);if(!match)return null;const day=entriesById.get(match[1]);if(!day)return null;const frame=Number(match[2]);if(frame>=day.frames)return null;const night=nightEntries.get(day.id);return night&&loaded.has(night.id)?loaded.get(night.id).frames[frame%night.frames]:null;}
 if(typeof nightBuildingSprite==='function'){const automaticNight=nightBuildingSprite;nightBuildingSprite=function(name){return dedicatedNight(name)||automaticNight(name);};}

 // Specialist review: static plants, sparse separate workers moving within connected crop cells.
 const fieldWorkerEntry=ownerType=>orderedEntries.find(e=>e.type==='field-worker'&&e.ownerType===ownerType&&e.lighting==='day'&&enabled(e)&&loaded.has(e.id));
 const fieldMotionClocks=new WeakMap();
 function reviewFieldWorkerPositions(g){
  if(typeof fieldWorkerPool!=='function')return [];
  let clocks=fieldMotionClocks.get(g);if(!clocks){clocks=new Map();fieldMotionClocks.set(g,clocks);}
  const output=[],counts=new Map(),totals=new Map();for(const b of g.blds||[])if(b.type==='acker'&&b.fieldOwner&&!b.fire&&!b.paused)totals.set(b.fieldOwner,(totals.get(b.fieldOwner)||0)+1);
  for(const person of fieldWorkerPool(g).workers){
   const owner=g.byId.get(person.ownerId),entry=fieldWorkerEntry(owner?.type),count=counts.get(person.ownerId)||0,limit=Math.min(3,Math.ceil((totals.get(person.ownerId)||0)/8));if(!owner||!entry||count>=limit)continue;counts.set(person.ownerId,count+1);
   const path=person.path;if(!path.length)continue;
   const key=person.ownerId+':'+person.seed+':'+path.join(','),now=g.time||0,running=g.speed>0&&!owner.paused&&!owner.fire&&workshopRunning(owner)&&!WORK_ART.reduced.matches;
   let state=clocks.get(key);if(!state){state={clock:0,last:now,running};clocks.set(key,state);}if(running&&state.running)state.clock+=Math.max(0,now-state.last);state.last=now;state.running=running;
   const phase=state.clock%5,edges=Math.max(1,path.length-1),step=Math.floor(state.clock/5+(person.offset||0))%edges,a=path[step],b=path[Math.min(step+1,path.length-1)],moving=phase>=3.2&&a!==b,t=moving?(phase-3.2)/1.8:0;
   // Existing DFS routes consist only of cardinally adjacent owned field modules.
   const ax=a%MAPW,ay=Math.floor(a/MAPW),bx=b%MAPW,by=Math.floor(b/MAPW),x=(ax+(bx-ax)*t)*16+10,y=(ay+(by-ay)*t)*16+4;
   const frame=moving?5:Math.floor(state.clock/.17+(person.seed||0))%8;
   output.push({ownerId:owner.id,entry,x,y,frame,moving,from:a,to:b,progress:t});
  }return output;
 }
 if(typeof fieldWorkerPositions==='function'){const legacyPositions=fieldWorkerPositions;fieldWorkerPositions=function(g){return legacyPositions(g).filter(p=>!fieldWorkerEntry(g.byId.get(p.ownerId)?.type));};}
 if(typeof drawFieldWorkers==='function'){const legacyDrawFieldWorkers=drawFieldWorkers;drawFieldWorkers=function(ctx,x0,y0,x1,y1){
  legacyDrawFieldWorkers(ctx,x0,y0,x1,y1);
  if(typeof worldDetailLevel==='function'&&worldDetailLevel()<3||typeof WORLD_DETAIL!=='undefined'&&typeof UI!=='undefined'&&UI.z<WORLD_DETAIL.people)return;
  for(const g of WORLD?.islands.filter(Boolean)||[G])for(const person of reviewFieldWorkerPositions(g)){
   const {entry,x,y,frame}=person;if(x<x0-8||x>x1+8||y<y0-12||y>y1+12)continue;
   const night=typeof nightAmount==='function'&&nightAmount()>=.5?orderedEntries.find(n=>n.dayId===entry.id&&enabled(n)&&loaded.has(n.id)):null;
   ctx.drawImage(loaded.get((night||entry).id).frames[frame],Math.round(x),Math.round(y));
  }
 };}
 function ensureReviewFrame(key){
  if(!key||SP[key])return key;const match=/^review_(.+)_([0-7])$/.exec(key);if(!match)return null;
  const e=entriesById.get(match[1]),frame=loaded.get(match[1])?.frames[Number(match[2])];if(!e||!frame)return null;
  publishPixel(key,frame,e.w,e.h,{tw:e.footprint?.w||e.w/16,th:e.footprint?.h||B[e.buildingType]?.h||1,ex:e.overhang||0,hub:null,smoke:null});return key;
 }
 const previousSpName=spName;spName=function(b){return ensureReviewFrame(sprite(b))||previousSpName(b);};
 if(typeof buildingPreviewSprite==='function'){const previousPreview=buildingPreviewSprite;buildingPreviewSprite=function(b){const e=entryFor(b,true);if(!e)return previousPreview(b);const idle=idleFor(e)?.id||e.id;return ensureReviewFrame('review_'+idle+'_0')||previousPreview(b);};}
 const previousWorkshop=workshopSprite;workshopSprite=function(b){return ensureReviewFrame(sprite(b))||previousWorkshop(b);};
 function loadEntry(e){
  if(loaded.has(e.id)||pendingLoads.has(e.id)||failedLoads.has(e.id))return;pendingLoads.add(e.id);
  window.ApprovedArtLoader.load(e).then(asset=>{loaded.set(e.id,asset);pendingLoads.delete(e.id);update();},error=>{pendingLoads.delete(e.id);failedLoads.add(e.id);failed++;console.error(error);update();});
 }
 for(const e of config.entries)if(e.type!=='world-road'&&e.loadPolicy!=='metadata-only')loadEntry(e);
 update();window.ApprovedSpriteArt=window.SpriteReview={config,loaded,entryFor,selectedEntry(b){const day=entryFor(b);if(!day)return null;const key=sprite(b),match=/^review_(.+)_([0-7])$/.exec(key||'');const selected=match&&entriesById.get(match[1])||day;const night=typeof nightAmount==='function'&&nightAmount()>=.5&&config.entries.find(e=>e.dayId===selected.id&&e.lighting==='night'&&loaded.has(e.id));return night||selected;},get stats(){return {total:config.entries.length,loaded:loaded.size,pending:pendingLoads.size,failed};},roadSprite,get startupReady(){return config.entries.every(e=>e.type==='world-road'||e.loadPolicy==='metadata-only'||loaded.has(e.id)||failedLoads.has(e.id));},get failed(){return failed;},poleDirection,worldSprite,worldArt,terrainTile,terrainAtlas,forestSprite,vehicleSprite,vehiclePresentation,fieldWorkerPositions:reviewFieldWorkerPositions,dedicatedNight,depositSprite,depositPlacement,hasFootprintOrientations(type){const entries=orderedEntries.filter(e=>e.type==='building'&&e.buildingType===type&&e.lighting==='day'&&e.frames===1&&enabled(e)&&loaded.has(e.id)&&e.footprint&&orderedEntries.some(n=>n.dayId===e.id&&n.lighting==='night'&&n.frames===1&&enabled(n)&&loaded.has(n.id)));return entries.some(e=>e.footprint.w!==e.footprint.h&&entries.some(t=>t.footprint.w===e.footprint.h&&t.footprint.h===e.footprint.w));},get mode(){return mode;}};
})();

/* Shared approved adapter: art/workbench/effect-preview.js */
/* Local sprite workbench: select complete effect frames without changing simulation. */
(()=>{
 const review=window.SpriteReview;
 if(!review)return;
 const effects=review.config.entries.filter(e=>e.type==='world-effect').sort((a,b)=>(b.priority||0)-(a.priority||0));
 function fireSprite(offset=0){
  if(review.mode==='original')return null;
  const enabled=e=>review.mode==='drafts'||e.status==='motiv_freigegeben'||e.status==='integriert';
  const day=effects.find(e=>e.effectType==='fire'&&e.lighting!=='night'&&enabled(e)&&review.loaded.has(e.id));
  if(!day)return null;
  const dark=typeof nightAmount==='function'&&nightAmount()>=.5;
  const night=dark&&effects.find(e=>e.dayId===day.id&&e.lighting==='night'&&enabled(e)&&review.loaded.has(e.id));
  const entry=night||day,frames=review.loaded.get(entry.id)?.frames;
  if(!frames?.length)return null;
  const reduced=typeof WORK_ART!=='undefined'&&WORK_ART.reduced.matches;
  const time=typeof UI!=='undefined'?UI.vt:0;
  const phase=reduced?0:((Math.floor(time*(entry.fps||7))+offset)%frames.length+frames.length)%frames.length;
  return frames[phase];
 }
 function warningSurface(){return review.mode==='original'?null:window.GAME_WARNING_SURFACE?.create()||null;}
 window.SpriteEffectReview={fireSprite,warningSurface};
})();

/* Shared approved adapter: art/workbench/ambient-preview.js */
/* Local workbench only: wildlife art; keep habitats, motion and boats unchanged. */
(()=>{
 const review=window.SpriteReview;
 if(!review||typeof ambientSprite!=='function')return;
 const original=ambientSprite,entries=review.config.entries.filter(e=>e.type==='ambient-animal').sort((a,b)=>(b.frames||1)-(a.frames||1));
 const byKind=new Map();
 for(const entry of entries){const key=entry.ambientKind+':'+entry.direction;if(!byKind.has(key))byKind.set(key,[]);byKind.get(key).push(entry);}
 ambientSprite=function(kind,dx,dy,frame){
  if(kind==='boat'||review.mode==='original')return original(kind,dx,dy,frame);
  const direction=Math.abs(dx)>=Math.abs(dy)?(dx<0?'w':'e'):(dy<0?'n':'s');
  const pool=byKind.get(kind+':'+direction)||[],enabled=e=>(review.mode==='drafts'||e.status==='motiv_freigegeben')&&review.loaded.has(e.id);
  const day=pool.find(e=>e.lighting!=='night'&&enabled(e));
  if(!day)return original(kind,dx,dy,frame);
  const dark=typeof nightAmount==='function'&&nightAmount()>=.5;
  const entry=(dark&&pool.find(e=>e.lighting==='night'&&e.dayId===day.id&&enabled(e)))||day;
  const frames=review.loaded.get(entry.id).frames,time=typeof ambientTime==='function'?ambientTime():0;
  const reduced=typeof WORK_ART!=='undefined'&&WORK_ART.reduced.matches;
  // The caller supplies its old two-frame phase. Recover the stable seed parity
  // rather than adding that changing phase and skipping steps every half second.
  const seedParity=(((frame||0)-Math.floor(time*2))%2+2)%2;
  const phase=reduced?0:((Math.floor(time*(entry.fps||4))+seedParity*Math.floor(frames.length/2))%frames.length+frames.length)%frames.length;
  const key='review_'+entry.id+'_'+phase;
  if(!SP[key])publishPixel(key,frames[phase],entry.w,entry.h,{tw:1,th:1,ex:0,hub:null,smoke:null});
  return key;
 };
})();

/* Shared approved adapter: art/workbench/bridge-preview.js */
/* Approved native bridge spans; routing and physical cells remain unchanged. */
(()=>{
 const api=window.SpriteReview;if(!api)return;
 const spans=new Map(),lengths=new Map(),strips=new Map(),composites=new Map(),approaches=new Map();let frame=0;
 const drawn=new WeakMap(),enabled=e=>api.mode==='drafts'||api.mode==='approved'&&e.status==='motiv_freigegeben';
 for(const e of api.config.entries){
  if(e.type==='bridge-length-draft'||e.type==='bridge-length-span')lengths.set(e.material+':'+e.axis+':'+e.lighting+':'+e.length,e);
  if(e.type==='bridge-span')spans.set(e.material+':'+e.axis+':'+e.lighting,e);
  if(e.type==='bridge-overlay-strip'){if(!strips.has(e.fullSpanId))strips.set(e.fullSpanId,[]);strips.get(e.fullSpanId).push(e);}
 }
 function placement(b,lighting='day'){
  if(api.mode==='original'||![1,2].includes(b.kind)||!b.cells?.length||b.cells.length>16||b.planned)return null;
  const dx=Math.sign(b.dx),dy=Math.sign(b.dy);if(!dx&&!dy)return null;
  const axis=!dy?'horizontal':!dx?'vertical':dx*dy<0?'diagonal_ne_sw':'diagonal_nw_se';
  const material=b.kind===2?'stone':'wood',key=material+':'+axis+':'+lighting;
  const e=b.cells.length===3?spans.get(key):lengths.get(key+':'+b.cells.length);
  if(!e||!e.runtimeEligible||!enabled(e))return null;
  const [ux,uy]=e.canonicalDirection||[e.geometry?.dx,e.geometry?.dy];if(!Number.isFinite(ux)||!Number.isFinite(uy))return null;
  const cells=[...b.cells].sort((a,z)=>(a%MAPW-z%MAPW)*ux+(Math.floor(a/MAPW)-Math.floor(z/MAPW))*uy);
  for(let i=1;i<cells.length;i++)if(cells[i]%MAPW-cells[i-1]%MAPW!==ux||Math.floor(cells[i]/MAPW)-Math.floor(cells[i-1]/MAPW)!==uy)return null;
  if(b.cells.length!==3){
   const image=api.loaded.get(e.id)?.frames?.[0],g=e.geometry;if(!image||!g)return null;
   const first=cells[0],x=first%MAPW*16+g.drawOffset.x,y=Math.floor(first/MAPW)*16+g.drawOffset.y;
   return{image,x,y,entry:e,cells,key:e.id+':'+cells.join(',')};
  }
  const family=(strips.get(e.id)||[]).sort((a,z)=>a.sourceRect.x-z.sourceRect.x);
  if(!family.length||family.some(s=>!enabled(s)||!api.loaded.has(s.id)))return null;
  let cached=composites.get(e.id);
  if(!cached||family.some((s,i)=>cached.sources[i]!==api.loaded.get(s.id).frames[0])){
   const image=document.createElement('canvas');image.width=e.w;image.height=e.h;const ctx=image.getContext('2d');ctx.imageSmoothingEnabled=false;
   const sources=family.map(s=>api.loaded.get(s.id).frames[0]);family.forEach((s,i)=>ctx.drawImage(sources[i],s.sourceRect.x,s.sourceRect.y));
   cached={image,sources};composites.set(e.id,cached);if(composites.size>128)composites.delete(composites.keys().next().value);
   // Inspect the approved native alpha once when its source frames change.
   // Endpoints are the visible ramp ends, not the elevated water-deck anchors.
   if(ctx.getImageData){
    const pixels=ctx.getImageData(0,0,e.w,e.h).data,[ux,uy]=e.canonicalDirection,length=Math.hypot(ux,uy),vx=ux/length,vy=uy/length;
    cached.ends=[e.firstWaterCenter,e.lastWaterCenter].map((center,i)=>{
     const sign=i?1:-1,nominal={x:center.x+sign*ux*16,y:center.y+sign*uy*16},points=[];
     for(let y=0;y<e.h;y++)for(let x=0;x<e.w;x++)if(pixels[(y*e.w+x)*4+3]>127){
      const rx=x+.5-nominal.x,ry=y+.5-nominal.y,along=(rx*vx+ry*vy)*sign,across=-rx*vy+ry*vx;
      if(Math.abs(across)<=13&&Math.hypot(rx,ry)<=24)points.push({x:x+.5,y:y+.5,along});
     }
     if(!points.length)return nominal;
     const extreme=Math.max(...points.map(p=>p.along)),end=points.filter(p=>p.along>=extreme-1.25);
     return{x:end.reduce((n,p)=>n+p.x,0)/end.length,y:end.reduce((n,p)=>n+p.y,0)/end.length};
    });
   }
  }
  const first=cells[0],x=first%MAPW*16+e.drawOffsets.x,y=Math.floor(first/MAPW)*16+e.drawOffsets.y;
  return{image:cached.image,x,y,entry:e,cells,key:e.id+':'+cells.join(',')};
 }
 function approachGeometry(b){
  const p=placement(b,'day');if(!p)return null;
  if(p.entry.geometry?.roadApproaches)return{placement:p,paths:p.entry.geometry.roadApproaches};
  const ends=composites.get(p.entry.id)?.ends;if(!ends)return null;
  const e=p.entry,[dx,dy]=e.canonicalDirection;
  return{placement:p,paths:[e.firstWaterCenter,e.lastWaterCenter].map((center,i)=>{
   const sign=i?1:-1,ox=dx*sign,oy=dy*sign,l=Math.hypot(ox,oy),ux=ox/l,uy=oy/l;
   const bank={x:center.x+ox*16,y:center.y+oy*16},start={x:bank.x+ox*16,y:bank.y+oy*16},end={x:ends[i].x-ux*2,y:ends[i].y-uy*2};
   return{bank,start,end,ramp:ends[i],controls:[{x:start.x-ux*8,y:start.y-uy*8},{x:end.x+ux*6,y:end.y+uy*6}]};
  })};
 }
 function drawApproaches(ctx,b){
  const geometry=approachGeometry(b);if(!geometry)return false;
  const {placement:p,paths}=geometry,stone=b.kind===2;
  const roadSources=paths.map(path=>{
   const x=Math.floor((p.x+path.bank.x)/16),y=Math.floor((p.y+path.bank.y)/16);
   return api.roadSprite?.(10,stone,x,y)||(typeof pixelRoadSprite==='function'?pixelRoadSprite(10,stone,x,y):null);
  });
  if(roadSources.some(s=>!s))return false;
  const key=p.key;let cached=approaches.get(key);
  if(!cached||cached.bridge!==p.image||roadSources.some((s,i)=>cached.sources[i]!==s)){
   const image=document.createElement('canvas');image.width=p.image.width+96;image.height=p.image.height+96;
   const c=image.getContext('2d');c.imageSmoothingEnabled=false;
   paths.forEach((path,i)=>{
    const source=roadSources[i],sample=t=>{const a=1-t,[b,c]=path.controls;return{x:a*a*a*path.start.x+3*a*a*t*b.x+3*a*t*t*c.x+t*t*t*path.end.x,y:a*a*a*path.start.y+3*a*a*t*b.y+3*a*t*t*c.y+t*t*t*path.end.y};};
    let distance=0,previous=sample(0);
    // At most 128 narrow strips per bank; existing road alpha sets the width.
    for(let n=0;n<=128;n++){
     const t=n/128,point=sample(t),next=sample(Math.min(1,t+.001)),prior=sample(Math.max(0,t-.001));distance+=Math.hypot(point.x-previous.x,point.y-previous.y);previous=point;
     c.save();c.translate(point.x+48,point.y+48);c.rotate(Math.atan2(next.y-prior.y,next.x-prior.x));
     c.drawImage(source,Math.floor(distance%16)*source.width/16,0,source.width/16,source.height,-.6,-8,1.2,16);c.restore();
    }
   });
   cached={image,sources:roadSources,bridge:p.image};approaches.set(key,cached);if(approaches.size>128)approaches.delete(approaches.keys().next().value);
  }
  ctx.drawImage(cached.image,p.x-48,p.y-48);return true;
 }
 function paint(ctx,b,lighting='day',once=false){
  const p=placement(b,lighting);if(!p)return false;
  if(once){let state=drawn.get(ctx);if(!state||state.frame!==frame){state={frame,keys:new Set()};drawn.set(ctx,state);}if(state.keys.has(p.key))return true;state.keys.add(p.key);}
  if(lighting==='day')drawApproaches(ctx,b);
  ctx.drawImage(p.image,p.x,p.y);return true;
 }
 api.bridgePlacement=placement;api.bridgeApproachGeometry=approachGeometry;api.drawBridgeApproaches=drawApproaches;api.drawBridgeSpan=(ctx,b)=>paint(ctx,b,'day',true);
 if(typeof render==='function'){const previous=render;render=function(...args){frame++;return previous(...args);};}
 if(typeof drawRoadTile==='function'){const previous=drawRoadTile;drawRoadTile=function(ctx,mask,stone,x,y){const b=G.bridges?.[IDX(x,y)];if(b&&paint(ctx,b,'day',true))return;return previous(ctx,mask,stone,x,y);};}
 if(typeof drawStoneBridgeSpan==='function'){const previous=drawStoneBridgeSpan;drawStoneBridgeSpan=function(ctx,b){if(!paint(ctx,b,'day',true))return previous(ctx,b);};}
 if(typeof drawNight==='function'){
  const previous=drawNight;drawNight=function(ctx,x0,y0,x1,y1){previous(ctx,x0,y0,x1,y1);const amount=nightAmount();if(amount<=0)return;
   const seen=new Set();ctx.save();ctx.globalAlpha*=amount;
   for(const b of Object.values(G.bridges||{})){
    const p=placement(b,'night');if(!p||seen.has(p.key)||p.x+p.image.width<x0||p.y+p.image.height<y0||p.x>x1||p.y>y1)continue;
    seen.add(p.key);ctx.drawImage(p.image,p.x,p.y);
   }
   ctx.restore();
  };
 }
})();

/* Shared approved adapter: art/source/roads/materials/controller/frayed-v09/road-image-sampler.js */
(function(root){'use strict';
const mod=(n,m)=>(n%m+m)%m,clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),smooth=n=>{n=clamp(n,0,1);return n*n*(3-2*n);},key=p=>p[0]+','+p[1];
function create(options){
 const textures=options.textures,seed=Number(options.seed)||1,revision=options.revision||0,edges=options.edges||[],nodes=new Map(),links=[];
 const get=p=>{const k=key(p);if(!nodes.has(k))nodes.set(k,{p:p.slice(),links:[]});return nodes.get(k);};
 const isolated=[],seen=new Set();for(const edge of edges){const a=edge.a,b=edge.b,ak=key(a),bk=key(b),id=[ak,bk].sort().join('|');if(seen.has(id))continue;seen.add(id);if(ak===bk){isolated.push(a);continue;}const e={a:get(a),b:get(b),material:edge.material||'stoneroad',index:links.length};e.a.links.push(e);e.b.links.push(e);links.push(e);}
 const used=new Set(),chains=[],other=(e,n)=>e.a===n?e.b:e.a;
 for(const n of nodes.values())n.links.sort((a,b)=>key(other(a,n).p).localeCompare(key(other(b,n).p)));
 function walk(start,first){const points=[start.p],chain={points,closed:false};let node=start,e=first;while(e&&!used.has(e.index)){used.add(e.index);node=other(e,node);points.push(node.p);if(node===start){chain.closed=true;break;}if(node.links.length!==2)break;e=node.links.find(l=>!used.has(l.index));}chains.push(chain);}
 for(const n of [...nodes.values()].sort((a,b)=>key(a.p).localeCompare(key(b.p))))if(n.links.length!==2)for(const e of n.links)if(!used.has(e.index))walk(n,e);
 for(const n of [...nodes.values()].sort((a,b)=>key(a.p).localeCompare(key(b.p))))for(const e of n.links)if(!used.has(e.index))walk(n,e);
 const segments=[],buckets=new Map(),bucketSize=32,junctions=[...nodes.values()].filter(n=>n.links.length>=3),nodeBuckets=new Map();
 function bucketAdd(map,item,x0,y0,x1,y1){for(let y=Math.floor(y0/bucketSize);y<=Math.floor(y1/bucketSize);y++)for(let x=Math.floor(x0/bucketSize);x<=Math.floor(x1/bucketSize);x++){const k=x+','+y;if(!map.has(k))map.set(k,[]);map.get(k).push(item);}}
 const lerp=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
 for(const chain of chains){const p=chain.points,curve=chain.closed?[]:[p[0]],last=p.length-1;
  if(chain.closed){const count=p.length-1;for(let i=0;i<count;i++){const prev=p[mod(i-1,count)],center=p[i],next=p[(i+1)%count],l0=Math.hypot(center[0]-prev[0],center[1]-prev[1]),l1=Math.hypot(next[0]-center[0],next[1]-center[1]),radius=Math.min(8,l0*.48,l1*.48),a=lerp(center,prev,radius/l0),b=lerp(center,next,radius/l1);curve.push(a);for(let j=1;j<=8;j++){const t=j/8,s=1-t;curve.push([s*s*a[0]+2*s*t*center[0]+t*t*b[0],s*s*a[1]+2*s*t*center[1]+t*t*b[1]]);}}curve.push(curve[0]);}
  else{
  for(let i=1;i<last;i++){const prev=p[i-1],center=p[i],next=p[i+1],l0=Math.hypot(center[0]-prev[0],center[1]-prev[1]),l1=Math.hypot(next[0]-center[0],next[1]-center[1]);if(((center[0]-prev[0])*(next[0]-center[0])+(center[1]-prev[1])*(next[1]-center[1]))/(l0*l1)>.99999){curve.push(center);continue;}const radius=Math.min(8,l0*.48,l1*.48),a=lerp(center,prev,radius/l0),b=lerp(center,next,radius/l1);curve.push(a);for(let j=1;j<=8;j++){const t=j/8,s=1-t;curve.push([s*s*a[0]+2*s*t*center[0]+t*t*b[0],s*s*a[1]+2*s*t*center[1]+t*t*b[1]]);}}
  curve.push(p[last]);}
  let length=0;const local=[];for(let i=1;i<curve.length;i++){const a=curve[i-1],b=curve[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(len<1e-6)continue;const s={a,b,dx:(b[0]-a[0])/len,dy:(b[1]-a[1])/len,length:len,start:length,chain};length+=len;local.push(s);}chain.length=length;chain.phase=(p[0][0]*.73+p[0][1]*.41+seed*3.1);
  // Closed circuits end at the same mirrored-image phase, preventing a loop-anchor seam.
  chain.scale=chain.closed?Math.max(1,Math.round(length/50.16))*50.16/length:1;
  for(const s of local){segments.push(s);bucketAdd(buckets,s,Math.min(s.a[0],s.b[0])-7,Math.min(s.a[1],s.b[1])-7,Math.max(s.a[0],s.b[0])+7,Math.max(s.a[1],s.b[1])+7);}
 }
 for(const p of isolated){const s={a:p,b:p,dx:1,dy:0,length:1e-9,start:0,chain:{scale:1,phase:p[0]*.73+p[1]*.41+seed*3.1}};segments.push(s);bucketAdd(buckets,s,p[0]-7,p[1]-7,p[0]+7,p[1]+7);}
 for(const n of junctions)bucketAdd(nodeBuckets,n,n.p[0]-21,n.p[1]-21,n.p[0]+21,n.p[1]+21);
 // Mirror address repeats raw imagery continuously: opposite crop edges never meet.
 function texel(tex,u,v){const mirror=(n,size)=>{let q=mod(Math.floor(n),size*2);return q<size?q:size*2-1-q;},x=mirror(u,tex.width),y=mirror(v,tex.height),i=(y*tex.width+x)*4;return [tex.data[i],tex.data[i+1],tex.data[i+2]];}
 function texture(material,u,v,x,y){const tex=textures[material]||textures.stoneroad||textures.road;
  // Smooth world fields alter region tone/where original image is sampled; one source sample per pixel, never blended local variants.
  const region=Math.sin(x/91+seed*.27)*Math.cos(y/113-seed*.19),warp=Math.sin(x/137+y/157+seed)*.75,scale=tex.width/25.08;
  const rgb=texel(tex,(u+warp)*scale,(v+Math.sin(x/151-y/173)*.55)*scale),tone=1+region*.115;return rgb.map(c=>clamp(Math.round(c*tone),0,255));
 }
 function sample(x,y,material){const k=Math.floor(x/bucketSize)+','+Math.floor(y/bucketSize),near=buckets.get(k);if(!near)return [0,0,0,0];let best=null,dist=Infinity,along=0,across=0;
  for(const s of near){const t=clamp(((x-s.a[0])*s.dx+(y-s.a[1])*s.dy)/s.length,0,1),px=s.a[0]+s.dx*t*s.length,py=s.a[1]+s.dy*t*s.length,d=Math.hypot(x-px,y-py);if(d<dist){dist=d;best=s;along=s.start+t*s.length;const sign=(x-px)*-s.dy+(y-py)*s.dx;across=d*(sign<0?-1:1);}}
  const mat=material||'stoneroad';if(!best)return [0,0,0,0];
  if(mat==='road'){
   // Dirt alone gets an irregular global fringe. Absolute world coordinates keep
   // padded/tiled samples identical; the original image RGB and interior stay fixed.
   const radius=4.45+.46*Math.sin(x*.43+seed*.31)*Math.sin(y*.39-seed*.17)+.15*Math.sin(x*1.7+y*.9),inner=radius-.4,outer=radius+.55;
   if(dist>outer)return [0,0,0,0];
   if(dist>inner){const px=Math.floor(x*2),py=Math.floor(y*2),v=Math.sin(px*127.1+py*311.7+seed*.713)*43758.5453,threshold=v-Math.floor(v),coverage=clamp((outer-dist)/(outer-inner),0,1);if(coverage<threshold)return [0,0,0,0];}
  }else if(dist>4.55)return [0,0,0,0];
  let rgb=texture(mat,along*best.chain.scale+best.chain.phase,across,x,y);
  let junction=null,jd=Infinity;for(const n of nodeBuckets.get(k)||[]){const d=Math.hypot(x-n.p[0],y-n.p[1]);if(d<jd){jd=d;junction=n;}}
  // All overlapping45-degree branch arms fall inside the12worldpx shared core.
  // Consequently nearest-chain ownership can never expose a UV discontinuity there.
  if(junction&&jd<20){const world=texture(mat,x,y,x,y),t=smooth((20-jd)/8);rgb=rgb.map((c,i)=>Math.round(c*(1-t)+world[i]*t));}
  return [rgb[0],rgb[1],rgb[2],255];
 }
 const cache=new Map(),cacheLimit=options.cacheLimit||384;
 function renderRegion(x,y,width,height,settings){settings=settings||{};const density=settings.pixelsPerWorld||2,w=Math.round(width*density),h=Math.round(height*density),data=new Uint8ClampedArray(w*h*4);for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){const p=sample(x+(xx+.5)/density,y+(yy+.5)/density,settings.material),i=(yy*w+xx)*4;data[i]=p[0];data[i+1]=p[1];data[i+2]=p[2];data[i+3]=p[3];}return {width:w,height:h,data};}
 function renderTile(x,y,settings){settings=settings||{};const size=settings.logicalSize||16,pad=settings.padding||0,density=settings.pixelsPerWorld||2,k=[revision,seed,x,y,size,pad,density,settings.material||'stoneroad'].join(':');if(cache.has(k)){const v=cache.get(k);cache.delete(k);cache.set(k,v);return v;}const v=renderRegion(x-pad,y-pad,size+pad*2,size+pad*2,settings);cache.set(k,v);while(cache.size>cacheLimit)cache.delete(cache.keys().next().value);return v;}
 return {sample,renderRegion,renderTile,clearCache:()=>cache.clear(),stats:()=>({edges:links.length,chains:chains.length,segments:segments.length,spatialBuckets:buckets.size,cacheEntries:cache.size,cacheLimit}),revision,seed};
}
root.RoadImageSampler={create};
})(typeof globalThis!=='undefined'?globalThis:this);

/* Shared approved adapter: art/workbench/road-material-preview.js */
/* Workbench-only adapter. Load after runtime.js and road-image-sampler.js. */
(function(root){
 'use strict';
 if(!root.RoadImageSampler||typeof drawRoadTile!=='function'||!root.SpriteReview)return;
 const original=drawRoadTile,limit=384,versions=new WeakMap(),canvases=new Map(),accessCanvases=new Map();
 let state=null,builds=0,invalidations=0,decoded=null,decodedKey='',lastReason='startup',entryMemo=null;
 const steps=[[0,-1],[1,0],[0,1],[-1,0],[1,-1],[1,1],[-1,1],[-1,-1]];
 function invalidate(reason,g){g=g||(typeof G!=='undefined'?G:null);if(g&&typeof g==='object')versions.set(g,(versions.get(g)||0)+1);invalidations++;lastReason=reason||'explicit';if(state?.g===g){state=null;canvases.clear();accessCanvases.clear();}if(typeof land!=='undefined')land?.chunks?.clear();}
 function materialEntries(){
  const review=root.SpriteReview,mode=review.mode;if(mode!=='drafts'&&mode!=='approved')return null;
  const entries=review.config.entries;
  if(entryMemo&&entryMemo.entries===entries&&entryMemo.count===entries.length&&entryMemo.mode===mode&&entryMemo.packed===root.GAME_SPRITE_PIXELS)return entryMemo.found;
  const found={};
  for(const material of ['road','stoneroad']){
   const entry=entries.find(e=>e.type==='world-road-material'&&e.material===material&&(mode==='drafts'||e.status==='motiv_freigegeben')&&root.GAME_SPRITE_PIXELS?.[e.id]);
   if(!entry)return null;found[material]=entry;
  }
  entryMemo={entries,count:entries.length,mode,packed:root.GAME_SPRITE_PIXELS,found};return found;
 }
 function textures(entries){
  const key=entries.road.id+':'+entries.stoneroad.id;
  if(decoded&&decodedKey===key&&decoded.roadPacked===root.GAME_SPRITE_PIXELS[entries.road.id]&&decoded.stonePacked===root.GAME_SPRITE_PIXELS[entries.stoneroad.id])return decoded;
  const result={};
  for(const material of ['road','stoneroad']){
   const p=root.GAME_SPRITE_PIXELS[entries[material].id],bytes=atob(p.data),data=new Uint8ClampedArray(bytes.length);
   if(bytes.length!==p.w*p.h*4)throw Error('Invalid road material pixels: '+entries[material].id);
   for(let i=0;i<bytes.length;i++)data[i]=bytes.charCodeAt(i);
   result[material]={width:p.w,height:p.h,data};
  }
  result.roadPacked=root.GAME_SPRITE_PIXELS[entries.road.id];result.stonePacked=root.GAME_SPRITE_PIXELS[entries.stoneroad.id];decoded=result;decodedKey=key;return result;
 }
 function ensure(){
  const entries=materialEntries();if(!entries||!G?.road)return null;
  const seed=(typeof WORLD!=='undefined'&&WORLD?.rootSeed)||G.seed||1,version=versions.get(G)||0,tex=textures(entries);
  if(state&&state.g===G&&state.roads===G.road&&state.count===G.roads&&state.seed===seed&&state.version===version&&state.tex===tex&&state.bridges===G.bridges&&state.mapW===MAPW)return state;
  const cells=new Map(),edges=[],indexed=minimapRoadCells(G.road);
  for(const k of indexed)if(G.road[k])cells.set(k,G.road[k]===2?'stoneroad':'road');
  for(const [k,material] of cells){
   const x=k%MAPW,y=Math.floor(k/MAPW),a=[x*16+8,y*16+8];let neighbours=0;
   for(const [dx,dy] of steps){const nx=x+dx,ny=y+dy;if(!INMAP(nx,ny))continue;const n=IDX(nx,ny);if(!cells.has(n)||!roadStepAllowed(x,y,nx,ny,G))continue;neighbours++;if(k<n)edges.push({a,b:[nx*16+8,ny*16+8],material});}
   if(!neighbours)edges.push({a,b:a,material});
  }
  const sampler=root.RoadImageSampler.create({textures:tex,edges,seed,revision:++builds,cacheLimit:limit});
  state={g:G,roads:G.road,count:G.roads,seed,version,tex,bridges:G.bridges,mapW:MAPW,cells,sampler};canvases.clear();accessCanvases.clear();return state;
 }
 // Deterministic world-space Voronoi ownership: ties use the lower cell index.
 // Ownership includes the cell, not just its material, so padding never doubles alpha.
 function owner(s,wx,wy){
  const x=Math.floor(wx/16),y=Math.floor(wy/16);let best=-1,distance=Infinity;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
   const nx=x+dx,ny=y+dy;if(!INMAP(nx,ny))continue;const k=IDX(nx,ny);if(!s.cells.has(k))continue;
   const d=(wx-(nx*16+8))**2+(wy-(ny*16+8))**2;
   if(d<distance||d===distance&&k<best){distance=d;best=k;}
  }
  return best;
 }
 function pixels(s,x,y,pad){
  const originX=x*16-pad,originY=y*16-pad,k=IDX(x,y),settings={pixelsPerWorld:2,padding:pad,logicalSize:16};
  const earth=s.sampler.renderTile(x*16,y*16,{...settings,material:'road'}),stone=s.sampler.renderTile(x*16,y*16,{...settings,material:'stoneroad'}),data=new Uint8ClampedArray(earth.data.length);
  for(let py=0;py<earth.height;py++)for(let px=0;px<earth.width;px++){
   const cell=owner(s,originX+(px+.5)/2,originY+(py+.5)/2);if(cell!==k)continue;
   const src=s.cells.get(cell)==='stoneroad'?stone.data:earth.data,i=(py*earth.width+px)*4;
   if(src[i+3]){data[i]=src[i];data[i+1]=src[i+1];data[i+2]=src[i+2];data[i+3]=255;}
  }
  return {width:earth.width,height:earth.height,data};
 }
 function canvas(s,x,y,pad){
  const key=x+':'+y+':'+pad;if(canvases.has(key)){const c=canvases.get(key);canvases.delete(key);canvases.set(key,c);return c;}
  const p=pixels(s,x,y,pad),c=document.createElement('canvas');c.width=p.width;c.height=p.height;
  const ctx=c.getContext('2d'),image=ctx.createImageData(p.width,p.height);image.data.set(p.data);ctx.putImageData(image,0,0);
  canvases.set(key,c);while(canvases.size>limit)canvases.delete(canvases.keys().next().value);return c;
 }
 drawRoadTile=function(ctx,mask,stone,x,y){
  // Keep the existing bridge renderer (including whole-span stone bridges).
  if(G?.bridges?.[IDX(x,y)])return original.apply(this,arguments);
  const s=ensure();if(!s||!s.cells.has(IDX(x,y)))return original.apply(this,arguments);
  const pad=mask&240?4:0,size=16+pad*2,image=canvas(s,x,y,pad);
  // Preserve the existing rock-corner exclusion from terrain_road_clearance.js.
  const rocks=[];if(pad&&typeof traceTerrainCorners==='function'&&typeof T!=='undefined')for(let by=y-1;by<=y+1;by++)for(let bx=x-1;bx<=x+1;bx++)if(INMAP(bx,by)&&[T.ROCK,T.ORE].includes(G.tiles[IDX(bx,by)]))rocks.push([bx,by]);
  if(rocks.length){ctx.save();ctx.beginPath();ctx.rect(x*16-pad,y*16-pad,size,size);for(const [bx,by] of rocks){const cut=(dx,dy)=>rockCornerBevel(bx,by,dx,dy)?TERRAIN_CORNER_CUT:0;traceTerrainCorners(ctx,bx*16,by*16,cut(-1,-1),cut(1,-1),cut(1,1),cut(-1,1));}ctx.clip('evenodd');}
  ctx.drawImage(image,x*16-pad,y*16-pad,size,size);if(rocks.length)ctx.restore();
 };
 function drawBuildingAccess(ctx,access){
  const s=ensure();if(!s)return false;
  const material=access.stone?'stoneroad':'road',key=[s.version,...access.a,...access.b,material].join(':');let entry=accessCanvases.get(key);
  if(!entry){
   const left=Math.floor(Math.min(access.a[0],access.b[0])-6),top=Math.floor(Math.min(access.a[1],access.b[1])-6),width=Math.ceil(Math.abs(access.a[0]-access.b[0])+12),height=Math.ceil(Math.abs(access.a[1]-access.b[1])+12);
   const sampler=root.RoadImageSampler.create({textures:s.tex,edges:[{a:access.a,b:access.b,material}],seed:s.seed,cacheLimit:1}),p=sampler.renderRegion(left,top,width,height,{pixelsPerWorld:2,material});
   // Leave every already painted road pixel untouched, including mixed-material
   // junctions and bridges. Only the new visual spur contributes here.
   for(let y=0;y<p.height;y++)for(let x=0;x<p.width;x++)if(s.sampler.sample(left+(x+.5)/2,top+(y+.5)/2,material)[3])p.data[(y*p.width+x)*4+3]=0;
   const image=document.createElement('canvas');image.width=p.width;image.height=p.height;const c=image.getContext('2d'),data=c.createImageData(p.width,p.height);data.data.set(p.data);c.putImageData(data,0,0);
   entry={image,left,top,width,height};accessCanvases.set(key,entry);while(accessCanvases.size>limit)accessCanvases.delete(accessCanvases.keys().next().value);
  }
  ctx.drawImage(entry.image,entry.left,entry.top,entry.width,entry.height);return true;
 }
 // These are the actual mutation entry points, including bridge wrappers in rivers.js.
 // No preview/query hook: areaUpgradeTargets does not commit changes.
 for(const name of ['rebuildNet','placeRoad','demolishAt','roadUpgrade','commitUpgradePlan','commitRoadPlan','commitRoadNodeMove','loadGame','resetWorld']){
  const fn=root[name];if(typeof fn!=='function')continue;
  root[name]=function(...args){const before=typeof G!=='undefined'?G:null;try{return fn.apply(this,args);}finally{invalidate(name,before);if(typeof G!=='undefined'&&G!==before)invalidate(name,G);}};
 }
 const action=root.winAct;if(typeof action==='function')root.winAct=function(id,ds){try{return action.apply(this,arguments);}finally{if(ds?.act==='area-demolish-confirm')invalidate('bridge/demolition-confirm');}};
 root.RoadImageReview={invalidate,drawBuildingAccess,stats(){return {graphBuildCount:builds,invalidations,lastReason,canvasEntries:canvases.size,accessEntries:accessCanvases.size,canvasLimit:limit,roadCells:state?.cells.size||0,sampler:state?.sampler.stats()||null};},
  // Pure diagnostic rendering uses the same ownership path as native canvases.
  renderTile(x,y,padding=0){const s=ensure();return s?pixels(s,x,y,padding):null;},owner(wx,wy){const s=ensure();return s?owner(s,wx,wy):-1;}};
})(globalThis);

/* Shared approved adapter: art/workbench/meadow-layer.js */
/* Independent world decoration. No terrain RGB, map mutation or saved entities. */
const WORLD_MEADOW=(()=>{
 const bucketSize=128,limit=256,buckets=new Map(),chunks=new Map(),stamps=new Map(),chunkLimit=512;let seed=1,images=[],density=()=>0,revision='',board=null,emptyChunkCanvas=null;
 const hash=(x,y,s)=>{let h=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(s|0,2147483647);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296;};
 // Derive a separate flower-only mask from existing art at load time. This
 // preserves actual painted pixels, excludes green ground and writes no files.
 function flowerMask(image){const out=document.createElement('canvas');out.width=image.width;out.height=image.height;const c=out.getContext('2d');c.drawImage(image,0,0);const pixels=c.getImageData(0,0,out.width,out.height),d=pixels.data;for(let p=0;p<d.length;p+=4){const r=d[p],g=d[p+1],b=d[p+2],flower=(r>g*1.08&&r>b*1.1)||(b>g*.96&&b>r*.8)||(r>180&&g>180&&b>140&&Math.min(r,g,b)/Math.max(r,g,b)>.72);if(!flower)d[p+3]=0;}c.putImageData(pixels,0,0);return out;}
 function configure(options){const next=options.revision+':'+options.seed;if(next===revision)return false;revision=next;seed=options.seed||1;images=(options.images||[]).map(flowerMask);density=options.density||(()=>0);buckets.clear();chunks.clear();stamps.clear();return true;}
 // Resize each of the13 allowed sizes once at an unclipped positive origin.
 // Chunk-edge clipping must never change nearest source-pixel selection.
 function stamp(p){const key=p.image+':'+p.size;let canvas=stamps.get(key);if(!canvas){canvas=document.createElement('canvas');canvas.width=p.size;canvas.height=p.size;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(images[p.image],0,0,p.size,p.size);stamps.set(key,canvas);}return canvas;}
 function bucket(bx,by){const key=bx+':'+by;let points=buckets.get(key);if(points){buckets.delete(key);buckets.set(key,points);return points;}points=[];
  // Candidate lattice is24 WORLD PIXELS, explicitly independent of16px cells.
  // Bucket owns points by their lattice origin; jitter/overhang never re-own them.
  for(let gy=Math.ceil(by*bucketSize/24);gy<Math.ceil((by+1)*bucketSize/24);gy++)for(let gx=Math.ceil(bx*bucketSize/24);gx<Math.ceil((bx+1)*bucketSize/24);gx++){
   const x=gx*24+(hash(gx,gy,seed+571)-.5)*22,y=gy*24+(hash(gx,gy,seed+577)-.5)*22,d=density(x/16,y/16,false,seed);
   if(hash(gx,gy,seed+587)>=d)continue;
   points.push({id:gx+':'+gy,x:Math.round(x),y:Math.round(y),size:24+Math.floor(hash(gx,gy,seed+593)*13),image:Math.floor(hash(gx,gy,seed+599)*Math.max(1,images.length))});
  }
  buckets.set(key,points);while(buckets.size>limit)buckets.delete(buckets.keys().next().value);return points;
 }
 function placements(x0,y0,x1,y1){const points=[],margin=48;for(let by=Math.floor((y0-margin)/bucketSize);by<=Math.floor((y1+margin)/bucketSize);by++)for(let bx=Math.floor((x0-margin)/bucketSize);bx<=Math.floor((x1+margin)/bucketSize);bx++)for(const p of bucket(bx,by))if(p.x+p.size/2>x0&&p.y+p.size/2>y0&&p.x-p.size/2<x1&&p.y-p.size/2<y1)points.push(p);return points;}
 function allowed(x,y,map,types){if(x<0||y<0||x>=map.width||y>=map.height)return false;const k=y*map.width+x;return map.tiles[k]===types.GRASS&&!map.road?.[k]&&!map.occ?.[k];}
 function chunk(bx,by,map,types){
  const key=bx+':'+by,x0=bx*128,y0=by*128;let signature='';
  for(let y=by*8;y<by*8+8;y++)for(let x=bx*8;x<bx*8+8;x++)signature+=allowed(x,y,map,types)?'1':'0';
  let cached=chunks.get(key);if(cached?.signature===signature){chunks.delete(key);chunks.set(key,cached);return cached.canvas;}
  // A warm cache hit needs no per-cell coordinate arrays or clipping geometry.
  const cells=[];for(let i=0;i<64;i++)if(signature[i]==='1')cells.push([i%8*16,Math.floor(i/8)*16]);
  const canvas=cells.length?document.createElement('canvas'):(emptyChunkCanvas||(emptyChunkCanvas=document.createElement('canvas')));if(cells.length||!canvas.width){canvas.width=128;canvas.height=128;}canvas._meadowEmpty=cells.length===0;
  if(cells.length){const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.save();c.beginPath();for(const [x,y]of cells)c.rect(x,y,16,16);c.clip();for(const p of placements(x0,y0,x0+128,y0+128))c.drawImage(stamp(p),p.x-Math.floor(p.size/2)-x0,p.y-Math.floor(p.size/2)-y0);c.restore();}
  chunks.set(key,{signature,canvas});while(chunks.size>chunkLimit)chunks.delete(chunks.keys().next().value);return canvas;
 }
 function draw(ctx,x0,y0,x1,y1,map,types){if(!images.length||(x1-x0)*(y1-y0)>6000000)return 0;if(board!==map.tiles){board=map.tiles;chunks.clear();}ctx.save();ctx.imageSmoothingEnabled=false;ctx.beginPath();ctx.rect(x0,y0,x1-x0,y1-y0);ctx.clip();let count=0;for(let by=Math.floor(y0/128);by<Math.ceil(y1/128);by++)for(let bx=Math.floor(x0/128);bx<Math.ceil(x1/128);bx++){const image=chunk(bx,by,map,types);if(!image._meadowEmpty||ctx.globalCompositeOperation!=='source-over')ctx.drawImage(image,bx*128,by*128);count++;}ctx.restore();return count;}
 return{configure,draw,placements,allowed,bucketSize,cacheSize:()=>buckets.size,chunkCacheSize:()=>chunks.size,clear:()=>{buckets.clear();chunks.clear();},flowerMask};
})();

if(typeof window!=='undefined')window.GameMeadow=WORLD_MEADOW;

/* Shared approved adapter: art/workbench/meadow-preview.js */
/* Isolated review integration. Load AFTER meadow_layer.js and game scripts. */
(()=>{
 const previousConfigure=TERRAIN_MATERIALS.configure;
 TERRAIN_MATERIALS.configure=function(options){return previousConfigure.call(this,{...options,flowers:[],flowerDensity:null,hasFlowers:()=>false});};
 // Must run before the next review configure; invalidate its setup signature
 // through the root's normal workbench rebuild/reload, not a hidden art rewrite.
 const previousDraw=drawLandRegion;
 drawLandRegion=function(ctx,x0,y0,x1,y1){previousDraw(ctx,x0,y0,x1,y1);const review=window.SpriteReview;if(!review||review.mode==='original')return;
  const entries=review.config.entries.filter(e=>e.type==='world-overlay'&&e.overlayKind==='wildflowers'&&(review.mode==='drafts'||e.status==='motiv_freigegeben')&&review.loaded.has(e.id)),seed=WORLD?.rootSeed||G.seed||1;
  WORLD_MEADOW.configure({revision:'world-layer-v03:'+review.mode+':'+entries.map(e=>e.id).join(','),seed,images:entries.map(e=>review.loaded.get(e.id).frames[0]),density:landscapeFlowerDensity});
  WORLD_MEADOW.draw(ctx,x0,y0,x1,y1,{tiles:G.tiles,road:G.road,occ:G.occ,width:MAPW,height:MAPH},T);
 };
})();
