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
 if(!worldOverview())return zoomDrawBld(ctx,b);
 const d=B[b.type],x=b.x*16,y=b.y*16,w=b.w*16,h=b.h*16;
 const roof=d.kind==='home'?['','#b79e73','#8b6e59','#8b6b80','#c6ac70'][b.tier||1]:d.kind==='prod'?'#ad7556':d.kind==='wh'?'#b9a475':d.kind==='decor'?'#789058':d.kind==='field'?'#8d9b59':d.kind==='ruin'?'#77736a':'#789b9b';
 ctx.fillStyle='#3d4034';ctx.fillRect(x,y+2,w,h);
 ctx.fillStyle=roof;ctx.fillRect(x+1,y+1,Math.max(1,w-2),Math.max(1,h-2));
 ctx.fillStyle='#dac59c';ctx.fillRect(x+1,y+h-6,Math.max(1,w-2),4);
 if(b.fire>0){ctx.fillStyle='#ec7943';ctx.fillRect(x+2,y+2,Math.max(2,w-4),3);ctx.fillStyle='#ffe3a4';ctx.fillRect(x+3,y+2,2,3);}
};
const zoomDrawRoad=drawRoadTile;
drawRoadTile=function(ctx,mask,paved,x,y){
 if(!worldOverview()||G.bridges?.[IDX(x,y)])return zoomDrawRoad(ctx,mask,paved,x,y);
 ctx.fillStyle=paved?'#808283':'#b8a277';ctx.fillRect(x*16,y*16,16,16);
};

/* Legacy-Fenster vor dem ersten Weltbild lesen. Native Paneele brauchen keine GPU-Rücklesung. */
for(const [name,entry] of HD_CATALOG){if(!name.startsWith('b_')||!entry.pixelSource)continue;const type=Object.keys(B).find(type=>typeSprite(type)===name);if(type&&['home','prod','svc','wh','shipyard','monument'].includes(B[type].kind))nightWindows(name);}
