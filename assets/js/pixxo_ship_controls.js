/* Native cursor art and selection feedback share the game's pixel palette. */
const PIXXO_CURSORS={},SHIP_OUTLINES=new WeakMap(),SHIP_ROUTE_PATHS=new WeakMap();
function makeCursorBase(kind){
 const native=document.createElement('canvas');native.width=native.height=16;const {r,p,ln}=civicPainter(native),edge='#21190f',gold='#f0d398';
 if(kind==='pointer'){
  // Native silhouette of the supplied cursor_hand.png; palette matches the game.
  const rows=['....#s........','...#oh#.......','...#oh#.......','...#oh#.......','...#oh##s.....','...#oh#oh##...','.#s#oh#oh#o##.','#oh#ohsoh#o#o#','#so#ohhhhsoso#','.#osohhhhhhhh#','.#sohhhhhhhho#','..#ohhhhhhhh#.','..#sohhhhhho#.','...#ohhhhhh#..','...#sssssss#..','....#######...'];
  const colors={'#':edge,s:'#b68a4d',o:gold,h:'#f5e5c8'};
  rows.forEach((row,y)=>[...row].forEach((pixel,x)=>{if(pixel!=='.')r(x,y,1,1,colors[pixel]);}));
 }
 else{
  // Exact 13 × 15 silhouette from cursor_hand_2.png, recolored on the native grid.
  const rows=['.##..........','#oo#.........','#oo#.........','#ooo#...###..','.#oo#.##oo##.','.#ooo#oo#oo##','..#ooo#oo#oo#','..#oooo#oooo#','.#o#oooooooo#','.#oooooooooo#','.#oooooooooo#','..#oooooooo#.','...#ooooo##..','....#oo##....','.....##......'];
  rows.forEach((row,y)=>[...row].forEach((pixel,x)=>{if(pixel!=='.')r(x,y,1,1,pixel==='#'?edge:gold);}));
 }
 publishPixel(kind==='pointer'?'i_cursor_pointer':'i_cursor_default',native,16,16);return native;
}
/* Each base is drawn once. Tool cursors only combine these unchanged icons. */
const PIXXO_CURSOR_BASES=Object.freeze({default:makeCursorBase('default'),pointer:makeCursorBase('pointer')});
const PIXXO_CURSOR_ACTIONS={};
for(const [mode,name] of Object.entries({upgrade:'i_upgrade',demo:'i_demo',build:'i_houses',road:'i_road',move:'i_move'})){
 const source=HD_CATALOG.get(name)?.pixelSource||SP[name];if(!source)continue;
 const icon=document.createElement('canvas');icon.width=icon.height=16;const c=icon.getContext('2d');c.imageSmoothingEnabled=false;nativeDrawImage.call(c,source,0,0,16,16);PIXXO_CURSOR_ACTIONS[mode]=icon;
}
{
 const icon=document.createElement('canvas');icon.width=icon.height=16;const q=civicPainter(icon);q.p([[7,1],[10,1],[10,5],[13,11],[13,13],[3,13],[3,11],[7,5]],'#21190f');q.r(8,2,1,4,'#f0d398');q.r(6,7,5,4,'#ba6450');q.r(5,11,7,1,'#e0bb7e');q.r(2,14,12,1,'#88c4ca');q.r(4,15,8,1,'#457e96');PIXXO_CURSOR_ACTIONS.buoy=icon;
}
if(!PIXXO_CURSOR_ACTIONS.move){
 const icon=document.createElement('canvas');icon.width=icon.height=16;const q=civicPainter(icon),gold='#f0d398';q.r(7,1,2,14,gold);q.r(1,7,14,2,gold);for(let k=0;k<3;k++){q.r(5+k,3-k,6-k*2,1,gold);q.r(5+k,12+k,6-k*2,1,gold);q.r(3-k,5+k,1,6-k*2,gold);q.r(12+k,5+k,1,6-k*2,gold);}PIXXO_CURSOR_ACTIONS.move=icon;
}
for(const [mode,name] of Object.entries({path:'i_road',stone:'i_stoneroad',woodbridge:'bridge_icon_1',stonebridge:'bridge_icon_2'}))PIXXO_CURSOR_ACTIONS['road_'+mode]=HD_CATALOG.get(name)?.pixelSource||SP[name];
function cursorArt(mode){
 const canvas=document.createElement('canvas');canvas.width=64;canvas.height=48;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
 nativeDrawImage.call(c,PIXXO_CURSOR_BASES[mode==='pointer'?'pointer':'default'],0,0,32,32);
 const icon=PIXXO_CURSOR_ACTIONS[mode];if(icon){
  if(icon.width===24)nativeDrawImage.call(c,icon,36,20);else nativeDrawImage.call(c,icon,32,16,32,32);
 }
 return canvas;
}
for(const mode of ['default','pointer','buoy','upgrade','demo','build','road','move','road_path','road_stone','road_woodbridge','road_stonebridge']){const canvas=cursorArt(mode);PIXXO_CURSORS[mode]={canvas,css:`url("${canvas.toDataURL()}") ${mode==='pointer'?'10 2':'3 1'}, ${mode==='pointer'?'pointer':'default'}`};}
const cursorStyle=document.createElement('style');cursorStyle.textContent=`body{cursor:${PIXXO_CURSORS.default.css}}button:not(:disabled),[role="button"],summary,select{cursor:${PIXXO_CURSORS.pointer.css}!important}input,textarea{cursor:text}input[type="checkbox"],input[type="radio"]{cursor:${PIXXO_CURSORS.pointer.css}}button:disabled{cursor:not-allowed}#cv{cursor:var(--pixxo-world-cursor,${PIXXO_CURSORS.default.css})}#cv:active{cursor:var(--pixxo-world-cursor,${PIXXO_CURSORS.default.css})}`;document.head.append(cursorStyle);
function updateWorldCursor(){
 let mode=UI.tool==='build'?'default':PIXXO_CURSORS[UI.tool]?UI.tool:'default';
 if(UI.tool==='road')mode='road_'+(UI.roadMode||'path');
 if(!UI.tool){const sh=WORLD?.fleet.find(s=>s.id===UI.selectedShip),t=UI.hover;if(sh&&!sh.route&&!sh.buildLeft&&sh.expedition===undefined&&t&&INMAP(t.x,t.y)&&G.tiles[IDX(t.x,t.y)]<=T.SHAL)mode='buoy';}
 else if(UI.tool==='sail')mode='buoy';
 if(UI.cursorMode!==mode){UI.cursorMode=mode;cv.style.setProperty('--pixxo-world-cursor',PIXXO_CURSORS[mode].css);}
 const hint=$('#hint');if(mode==='buoy'&&!UI.tool){hint.textContent='Fahrtziel setzen';hint.classList.add('show');hint.dataset.shipCursorHint='true';}
 else if(hint.dataset.shipCursorHint){delete hint.dataset.shipCursorHint;if(!UI.tool)hint.classList.remove('show');}
}
cv.addEventListener('pointermove',updateWorldCursor);
const cursorSetTool=setTool;setTool=function(...args){cursorSetTool(...args);updateWorldCursor();};
const highlightedSelectShip=selectShip;selectShip=function(...args){highlightedSelectShip(...args);updateWorldCursor();};
const deselectShipBuilding=selectB;selectB=function(id,...args){if(id!=null)UI.selectedShip=null;const result=deselectShipBuilding(id,...args);updateWorldCursor();return result;};
const selectedShipClose=closeWin;closeWin=function(id){selectedShipClose(id);if(id==='ship'){UI.selectedShip=null;drawMini();updateWorldCursor();}};
cv.addEventListener('keydown',e=>{if(e.key==='Escape'&&!UI.tool&&UI.selectedShip){if(WINS.ship)closeWin('ship');else{UI.selectedShip=null;drawMini();updateWorldCursor();}}});
const selectedShipBar=renderBar;renderBar=function(...args){selectedShipBar(...args);for(const button of document.querySelectorAll('[data-select-ship]'))button.setAttribute('aria-pressed',String(+button.dataset.selectShip===UI.selectedShip));};
const cursorUpdateHint=updateHint;updateHint=function(...args){cursorUpdateHint(...args);updateWorldCursor();};
const approachingShipPosition=freeShipPosition;freeShipPosition=function(sh){const a=sh.routeApproach;return a?interpolatedSeaPosition(a.path,1-a.remaining/a.duration):approachingShipPosition(sh);};
const shipDestinationClick=clickTile;clickTile=function(t){
 if(!UI.tool&&INMAP(t.x,t.y)){
  const hit=shipAtWorldPoint(t.worldX??(t.x+.5)*16,t.worldY??(t.y+.5)*16);if(hit){selectB(null);selectShip(hit.id);return;}
  const sh=WORLD.fleet.find(s=>s.id===UI.selectedShip);
  if(sh&&!sh.route&&!sh.buildLeft&&sh.expedition===undefined&&G.tiles[IDX(t.x,t.y)]<=T.SHAL){
   const result=sailShip(sh,t.x,t.y);UI.transferMessage={ship:sh.id,text:result===true?'Fahrtziel gesetzt.':result};
   if(result===true){saveGame();drawMini();}if(WINS.ship){WINS.ship.hold=false;refreshWin(WINS.ship);}updateWorldCursor();return;
  }
 }shipDestinationClick(t);
};
function shipOutline(sprite){
 if(SHIP_OUTLINES.has(sprite))return SHIP_OUTLINES.get(sprite);
 const a=document.createElement('canvas');a.width=a.height=68;const c=a.getContext('2d');c.imageSmoothingEnabled=false;
 for(const [x,y] of [[-2,0],[2,0],[0,-2],[0,2],[-1,-1],[1,-1],[-1,1],[1,1]])nativeDrawImage.call(c,sprite,2+x,2+y);
 c.globalCompositeOperation='source-in';c.fillStyle='#ffe7a1';c.fillRect(0,0,68,68);c.globalCompositeOperation='destination-out';nativeDrawImage.call(c,sprite,2,2);c.globalCompositeOperation='source-over';SHIP_OUTLINES.set(sprite,a);return a;
}
function shipRoutePath(path){
 if(SHIP_ROUTE_PATHS.has(path))return SHIP_ROUTE_PATHS.get(path);const result=new Path2D();path.forEach((p,i)=>i?result.lineTo(p[0]*16,p[1]*16):result.moveTo(p[0]*16,p[1]*16));SHIP_ROUTE_PATHS.set(path,result);return result;
}
function drawSelectedShipRoute(ctx,sh){
 const r=WORLD.routes.find(r=>r.id===sh.route),paths=sh.manualTrip?[sh.manualTrip.path]:r?tradeRouteLegs(r).map(([a,b])=>routeWaterPath(a,b)).filter(Boolean):[];if(sh.routeApproach)paths.push(sh.routeApproach.path);
 if(!paths.length)return;const pixel=UI.DR/UI.sc;ctx.save();ctx.lineWidth=2*pixel;ctx.strokeStyle='#fff1b5';ctx.setLineDash([8*pixel,6*pixel]);for(const path of paths)ctx.stroke(shipRoutePath(path));ctx.setLineDash([]);
 const path=sh.manualTrip?.path;if(path?.length){const [x,y]=path.at(-1);ctx.strokeStyle='#fff1b5';ctx.lineWidth=2*pixel;ctx.beginPath();ctx.arc(x*16,y*16,7*pixel,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(x*16,y*16-10*pixel);ctx.lineTo(x*16,y*16-18*pixel);ctx.stroke();}ctx.restore();
}
const selectedFleetDrawing=drawFleet;drawFleet=function(ctx){
 for(const s of WORLD?.fleet||[])if(s.routeApproach){const p=freeShipPosition(s);s.heading=headingForPath(s.routeApproach.path,p.index||0);}
 const sh=WORLD?.fleet.find(s=>s.id===UI.selectedShip),p=sh&&!sh.buildLeft&&freeShipPosition(sh);
 if(p){drawSelectedShipRoute(ctx,sh);const sprite=makeDirectionalShip(sh.heading||0,sh.type,WORK_ART.reduced.matches?0:Math.floor(G.time*3)%MARITIME_SHIP_FRAMES);nativeDrawImage.call(ctx,shipOutline(sprite),Math.round(p.x*16)-34,Math.round(p.y*16)-50);}
 selectedFleetDrawing(ctx);
};
