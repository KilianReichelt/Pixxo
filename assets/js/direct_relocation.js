/* Direct left-button gestures supplement the optional relocation tool. */
let directRelocationDrag=null;
const directRelocationTargets=relocationTargets;
relocationTargets=function(t){
 const targets=directRelocationTargets(t),offset=UI.directMoveOffset,bounds=UI.moveBounds;
 if(!offset||!bounds)return targets;
 let x=offset.x,y=offset.y,w=bounds.w,h=bounds.h;
 for(let i=0;i<(UI.moveQuarter||0);i++){[x,y]=[h-1-y,x];[w,h]=[h,w];}
 const dx=Math.floor(w/2)-x,dy=Math.floor(h/2)-y;
 return targets.map(p=>({...p,x:p.x+dx,y:p.y+dy}));
};
const directSetTool=setTool;setTool=function(tool,...args){if(tool!=='relocate'){delete UI.directMoveOffset;delete UI.automaticRelocation;}return directSetTool(tool,...args);};
const directRelocateClick=relocateClick;relocateClick=function(t){const automatic=UI.automaticRelocation,anchored=UI.moveAnchor,result=directRelocateClick(t);if(automatic&&anchored&&!UI.moveAnchor)setTool(null);return result;};
function directGestureTile(e){const t=tileAt(e.clientX,e.clientY),p=scr2w(e.clientX,e.clientY);return {...t,worldX:p.x,worldY:p.y};}
function releaseDirectGesture(e){if(cv.hasPointerCapture(e.pointerId))cv.releasePointerCapture(e.pointerId);}
cv.addEventListener('pointerdown',e=>{
 if(e.button!==0||UI.tool||UI.selectedShip||startDialog.open||sessionMenu.open||tutorialBlocksConstruction())return;
 const t=directGestureTile(e);if(!INMAP(t.x,t.y))return;
 const b=G.byId.get(G.occ[IDX(t.x,t.y)]);
 if(b&&(b.island!==activeIsland||G.cpu)||!b&&!BUILDABLE(G.tiles[IDX(t.x,t.y)]))return;
 e.preventDefault();e.stopImmediatePropagation();cv.setPointerCapture(e.pointerId);
 directRelocationDrag={id:e.pointerId,start:t,last:t,x:e.clientX,y:e.clientY,building:b,shift:e.shiftKey,moved:false};UI.hover=t;
},true);
cv.addEventListener('pointermove',e=>{
 const d=directRelocationDrag;if(!d||e.pointerId!==d.id)return;
 e.preventDefault();e.stopImmediatePropagation();const t=directGestureTile(e);d.last=t;UI.hover=t;
 if(!d.moved&&Math.hypot(e.clientX-d.x,e.clientY-d.y)>6){
  d.moved=true;
  if(d.building){setTool('relocate');startRelocation([d.building]);if(UI.moveAnchor){UI.automaticRelocation=true;UI.directMoveOffset={x:d.start.x-UI.moveBounds.x,y:d.start.y-UI.moveBounds.y};if(WINS.info)closeWin('info');}}
 }
 updateHint();
},true);
cv.addEventListener('pointerup',e=>{
 const d=directRelocationDrag;if(!d||e.pointerId!==d.id)return;
 e.preventDefault();e.stopImmediatePropagation();directRelocationDrag=null;releaseDirectGesture(e);const t=directGestureTile(e);UI.hover=t;
 if(!d.moved){clickTile(t);return;}
 if(d.building){if(UI.moveAnchor){const result=commitRelocation(t);if(result.ok){setTool(null);refreshWins();}else msg(result.why,'i_alert');}else setTool(null);}
 else{
  const x0=Math.min(d.start.x,t.x),y0=Math.min(d.start.y,t.y),x1=Math.max(d.start.x,t.x)+1,y1=Math.max(d.start.y,t.y)+1;
  const chosen=G.blds.filter(b=>b.x<x1&&b.x+b.w>x0&&b.y<y1&&b.y+b.h>y0&&b.fire<=0);
  if(chosen.length){setTool('relocate');startRelocation(chosen);UI.automaticRelocation=true;if(WINS.info)closeWin('info');}
 }
 updateHint();
},true);
cv.addEventListener('pointercancel',e=>{if(directRelocationDrag?.id===e.pointerId){directRelocationDrag=null;if(UI.tool==='relocate')setTool(null);}},true);
const directGhost=drawGhost;drawGhost=function(ctx,...args){directGhost(ctx,...args);const d=directRelocationDrag;if(!d||d.building||!d.moved)return;ctx.save();ctx.strokeStyle='#fff0b8';ctx.fillStyle='rgba(217,193,139,.12)';ctx.lineWidth=UI.DR/UI.sc;const x=Math.min(d.start.x,d.last.x)*16,y=Math.min(d.start.y,d.last.y)*16,w=(Math.abs(d.start.x-d.last.x)+1)*16,h=(Math.abs(d.start.y-d.last.y)+1)*16;ctx.fillRect(x,y,w,h);ctx.strokeRect(x,y,w,h);ctx.restore();};
const directInfoHTML=infoHTML;infoHTML=function(...args){return directInfoHTML(...args).replace(/<button\b[^>]*\bdata-act="move"[^>]*>[\s\S]*?<\/button>/g,'');};
const directControlIcons=refreshDesktopControlIcons;refreshDesktopControlIcons=function(){directControlIcons();if(!controlsHint.querySelector('[data-direct-move-hint]')){const row=document.createElement('li');row.dataset.directMoveHint='';row.innerHTML=(SP.i_cursor_move?ic('i_cursor_move',1):'')+'<span><kbd>LMB</kbd> ziehen: Gebäude / Auswahl verschieben</span>';controlsHint.querySelector('ul')?.append(row);}};
