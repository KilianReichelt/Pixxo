/* Ziegel stehen rechtzeitig vor dem ersten Patrizieraufstieg zur Verfügung. */
for(const [id,n,v] of [['lehm','Lehm',8],['ziegel','Ziegel',24]]){const good={id,n,v};GOODS.push(good);GN[id]=good;}
B.lehmgrube={n:'Lehmgrube',cat:'roh',kind:'prod',w:Math.ceil(2*BUILDING_SCALE),h:Math.ceil(2*BUILDING_SCALE),cost:{gold:500,bretter:6,stein:4},upk:15,cycle:60,in:{},out:{lehm:1},transportRange:36,req:40,workforce:{tier:2,count:6},d:'Gewinnt Lehm an einem festen Lehmvorkommen an Land. Liefert bei voller Effizienz eine Tonne Lehm pro Minute.'};
B.ziegelei={n:'Ziegelei',cat:'veredel',kind:'prod',w:Math.ceil(2*BUILDING_SCALE),h:Math.ceil(2*BUILDING_SCALE),cost:{gold:1000,bretter:8,stein:8,werkzeug:2},upk:25,cycle:60,in:{lehm:2,holz:1},out:{ziegel:1},transportRange:36,req:40,workforce:{tier:2,count:10},d:'Brennt zwei Tonnen Lehm mit einer Tonne Holz zu einer Tonne Ziegel. Baumaterial für Patrizier und Forschung.'};
for(const type of ['lehmgrube','ziegelei']){BASE_GEOMETRY[type]={w:2,h:2,range:36};BUILD_SIZES[type]={w:B[type].w,h:B[type].h};BUILD_TIER[type]=2;}
UPG[3]={...UPG[3],ziegel:8};
Object.assign(B.forschung,{cost:{gold:5000,bretter:20,stein:20,ziegel:25,werkzeug:10},req:0});BUILD_TIER.forschung=2;
function brickBuildingArt(type,frame=0){
 const entry=typeof IMPORTED_ENTRIES!=='undefined'?IMPORTED_ENTRIES.get(type):null;if(entry){const d=B[type],extra=Math.max(12,Math.round(d.h*5));return {low:importedPixels(entry,frame,buildingRequiresBricks(type)),w:d.w*16,h:d.h*16+extra,meta:{tw:d.w,th:d.h,ex:extra,hub:null,smoke:null}};}
 const low=document.createElement('canvas');low.width=32;low.height=40;const c=low.getContext('2d');c.imageSmoothingEnabled=false;
 c.fillStyle='#867346';c.fillRect(1,27,30,12);c.fillStyle='#b4a072';c.fillRect(2,29,28,9);
 if(type==='lehmgrube'){
  c.fillStyle='#765139';c.fillRect(3,28,18,9);c.fillStyle='#9f6641';c.fillRect(5,30,14,5);c.fillStyle='#bb8559';c.fillRect(6,31,11,3);c.fillStyle='#4c3a2a';c.fillRect(22,17,6,20);c.fillStyle='#bc9b66';c.fillRect(21,16,8,2);c.fillRect(24,18,2,18);c.fillStyle='#66503a';c.fillRect(20,24,10,2);c.fillStyle='#d5bc83';c.fillRect(23,19,4,4);c.fillStyle='#715036';c.fillRect(24,19,2,3);
 }else{
  c.fillStyle='#57362b';c.fillRect(3,19,24,18);c.fillStyle='#b67d54';c.fillRect(4,20,22,15);c.fillStyle='#805336';for(let y=21;y<34;y+=3)for(let x=5+(y%2)*2;x<26;x+=5)c.fillRect(x,y,4,1);
  const tiled=buildingRequiresBricks(type);c.fillStyle=tiled?'#4b3228':'#37434b';for(let y=0;y<8;y++)c.fillRect(15-y,11+y,3+y*2,2);c.fillStyle=tiled?'#965a3c':'#61727b';for(let y=0;y<6;y++)c.fillRect(15-y,12+y,2+y*2,1);
  c.fillStyle='#6f4a35';c.fillRect(23,3,5,20);c.fillStyle='#c1966c';c.fillRect(24,4,2,18);c.fillStyle='#332b27';c.fillRect(22,2,7,2);c.fillRect(11,26,8,11);c.fillStyle=frame%2?'#db9b48':'#ad683b';c.fillRect(13,29,4,5);
  c.fillStyle='#9c5e3b';c.fillRect(23,34,7,4);c.fillStyle='#d1996b';c.fillRect(24,34,5,1);c.fillRect(24,36,5,1);
 }
 return {low,w:B[type].w*16,h:B[type].h*16+16,meta:{tw:B[type].w,th:B[type].h,ex:16,hub:null,smoke:null}};
}
function installBrickArt(){for(const type of ['lehmgrube','ziegelei']){const a=brickBuildingArt(type);publishPixel('b_'+type,a.low,a.w,a.h,a.meta);}for(const good of ['lehm','ziegel']){const entry=typeof IMPORTED_ENTRIES!=='undefined'?IMPORTED_ENTRIES.get('icon_'+good):null;if(entry){publishPixel(good,importedPixels(entry),16,16);continue;}const low=document.createElement('canvas');low.width=low.height=16;const c=low.getContext('2d');if(good==='lehm'){c.fillStyle='#614532';c.fillRect(2,9,12,5);c.fillStyle='#a57149';c.fillRect(4,6,8,6);c.fillStyle='#c19668';c.fillRect(6,5,5,2);}else{c.fillStyle='#633f30';c.fillRect(1,5,14,9);for(const [x,y] of [[2,6],[9,6],[5,10]]){c.fillStyle='#b57750';c.fillRect(x,y,5,3);c.fillStyle='#dfa478';c.fillRect(x,y,5,1);}}publishPixel(good,low,16,16);}}
installBrickArt();
installNativeBuildings();
const brickUnpackIsland=unpackIsland;unpackIsland=function(...args){const g=brickUnpackIsland(...args);g.stock.lehm??=0;g.stock.ziegel??=0;return g;};
