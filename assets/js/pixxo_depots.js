/* Zusätzliche Depots erweitern ausschließlich das Lager ihrer Insel. */
B.depot={n:'Depot',cat:'lager',kind:'wh',w:Math.ceil(2*BUILDING_SCALE),h:Math.ceil(2*BUILDING_SCALE),cost:{gold:750,bretter:12,stein:8},upk:12,cap:150,area:16,req:0,d:'Erweitert das gemeinsame Insellager um 150 Tonnen je Ware. Mehrere Depots sind möglich; die Kapazität wird addiert.'};
BASE_GEOMETRY.depot={w:2,h:2};BUILD_SIZES.depot={w:B.depot.w,h:B.depot.h};BUILD_TIER.depot=2;
function depotBuildingArt(){
 const d=B.depot,extra=Math.max(12,Math.round(d.h*5)),low=importedPixels(IMPORTED_ENTRIES.get('depot'),0,buildingRequiresBricks('depot'));
 return {low,w:d.w*16,h:d.h*16+extra,meta:{tw:d.w,th:d.h,ex:extra,hub:null,smoke:null}};
}
installNativeBuildings();
