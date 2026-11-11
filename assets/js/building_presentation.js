/* Dedicated dock glyphs are delivered by the specialist art workflow. */
const BUILD_DOCK_BADGES={
 lager:['i_build_lager','logistics'],haus:['i_build_haus','housing'],
 markt:['i_build_markt','trade'],kapelle:['i_build_kapelle','faith'],feuer:['i_build_feuer','safety'],
 brunnen:['i_build_brunnen','water'],werft:['i_build_werft','harbour'],forschung:['i_build_forschung','knowledge'],
 depot:['i_build_depot','logistics'],schule:['i_build_schule','knowledge'],
 krankenhaus:['i_build_krankenhaus','health'],kirche:['i_build_kirche','faith'],
 gemeinschaftshaus:['i_build_gemeinschaftshaus','community'],transitpier:['i_build_transitpier','harbour'],
 universitaet:['i_build_universitaet','knowledge'],oper:['i_build_oper','culture']
};
function dockBuildingBadge(type){const [key,theme]=BUILD_DOCK_BADGES[type],ready=!!SP[key],source=ready?key:typeSprite(type);return '<span class="building-icon-badge" data-icon-theme="'+theme+'" data-building-icon="'+key+'" data-icon-ready="'+ready+'" aria-hidden="true"><img class="px" src="'+url(source)+'" alt=""></span>';}
const buildingBadgeCard=dockCard;dockCard=function(entry){const html=buildingBadgeCard(entry);return entry.good||!BUILD_DOCK_BADGES[entry.type]?html:html.replace(/<img class="px" src="[^"]+" alt="">/,dockBuildingBadge(entry.type));};

/* Placement resolves the same static family as building previews, including
 * the review build's approval/footprint/variant selection. No asset is drawn here. */
function placementPreviewBuilding(type,x,y,rotation=0,source=null){return {...source,id:source?.id??G.nid,type,x,y,...(source?{w:source.w,h:source.h}:buildingSize(type,rotation)),tier:source?.tier||1,rotation:buildingRotation(type,rotation),island:activeIsland,fieldOwner:source?.fieldOwner??UI.fieldOwner,paused:true,fire:0,prog:0,visualVariant:source?.visualVariant??0};}
function placementPreviewSprite(b){const resolve=()=>buildingPreviewSprite(b),key=b.fieldOwner<0&&typeof withPlannedFieldOwner==='function'?withPlannedFieldOwner(b.fieldOwner,resolve):resolve();if(SP[key])return key;const fallback=typeSprite(b.type);return SP[fallback]?fallback:null;}
const presentedHouseUpgrade=upgradeHouse;upgradeHouse=function(b,...args){const tier=b?.tier,result=presentedHouseUpgrade(b,...args);if(!G.cpu&&b?.tier!==tier&&UI.sel===b.id&&WINS.info)refreshWin(WINS.info,true);return result;};
