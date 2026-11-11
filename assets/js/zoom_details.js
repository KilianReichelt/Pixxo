/* Gemeinsame Detailgrenzen für Landschaft, Gebäude und kleine Animationen. */
const WORLD_DETAIL={overview:.45,people:.7,surf:.6};
function worldOverview(){return UI.z<WORLD_DETAIL.overview;}
const zoomStreetPeople=addStreetPeople;
addStreetPeople=function(...args){if(UI.z>=WORLD_DETAIL.people)zoomStreetPeople(...args);};
const zoomFieldWorkers=drawFieldWorkers;
drawFieldWorkers=function(...args){if(UI.z>=WORLD_DETAIL.people)zoomFieldWorkers(...args);};
const zoomBuildingWarnings=drawBuildingWarnings;
drawBuildingWarnings=function(...args){if(!worldOverview())zoomBuildingWarnings(...args);};
const zoomBeachSurf=drawBeachSurf;
drawBeachSurf=function(...args){if(UI.z>=WORLD_DETAIL.surf)zoomBeachSurf(...args);};
const zoomWeatherPuddles=drawWeatherPuddles;
drawWeatherPuddles=function(...args){if(!worldOverview())zoomWeatherPuddles(...args);};
const zoomDayClouds=drawDayClouds;
drawDayClouds=function(...args){if(!worldOverview())zoomDayClouds(...args);};
const zoomDrawBld=drawBld;
drawBld=function(ctx,b){
 return zoomDrawBld(ctx,b);
};
const zoomDrawRoad=drawRoadTile;
drawRoadTile=function(ctx,mask,paved,x,y){
 return zoomDrawRoad(ctx,mask,paved,x,y);
};

/* Legacy-Fenster vor dem ersten Weltbild lesen. Native Paneele brauchen keine GPU-Rücklesung. */
for(const [name,entry] of HD_CATALOG){if(!name.startsWith('b_')||!entry.pixelSource)continue;const type=Object.keys(B).find(type=>typeSprite(type)===name);if(type&&['home','prod','svc','wh','shipyard','monument'].includes(B[type].kind))nightWindows(name);}
