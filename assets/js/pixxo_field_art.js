/* Jede Ackerfläche zeigt die Kultur ihres gespeicherten Mutterbetriebs. */
const FIELD_CROP_SPRITES={farm:'acker_getreide',hopfen:'acker_hopfen',weingut:'acker_trauben',gewuerzfarm:'acker_gewuerz',obsthof:'acker_obst',blumenhof:'acker_blumen'};
function fieldCropType(b){
 const island=b.island??Math.floor((b.id||0)/100000),g=WORLD?.islands[island]||G,owner=g?.byId.get(b.fieldOwner);
 return FIELD_CROP_SPRITES[owner?.type]?owner.type:'farm';
}
function cropFieldArt(crop){const d=B.acker,entry=IMPORTED_ENTRIES.get(FIELD_CROP_SPRITES[crop]||FIELD_CROP_SPRITES.farm);return {low:importedPixels(entry),w:d.w*16,h:d.h*16,meta:{tw:d.w,th:d.h,ex:0,hub:null,smoke:null}};}
function cropFieldSprite(crop){const name='b_acker_crop_'+crop+'_'+B.acker.w+'_'+B.acker.h;if(!HD_CATALOG.has(name)){const a=cropFieldArt(crop);publishPixel(name,a.low,a.w,a.h,a.meta);}return name;}
const cropWorkshopSprite=workshopSprite;workshopSprite=function(b){
 if(b.type==='acker')return rotatedSprite(cropFieldSprite(fieldCropType(b)),b.rotation||0);
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
 cropSetTool(...args);if(UI.type!=='acker'||!['build','move'].includes(UI.tool))return;
 const field=UI.tool==='move'?G.byId.get(UI.moveId):{fieldOwner:UI.fieldOwner,island:activeIsland},a=cropFieldArt(fieldCropType(field||{}));
 for(const name of Object.keys(SP))if(name.startsWith('b_acker_rotation')){delete SP[name];delete SPB[name];HD_CATALOG.delete(name);}
 publishPixel('b_acker',a.low,a.w,a.h,a.meta);
};
