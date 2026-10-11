/* Local placement aid; never persisted and never scans the map. */
function drawPlacementGrid(ctx){
 if(!['build','move'].includes(UI.tool)||!B[UI.type])return;
 const t=ghostTile(),placed=UI.placementGridPlaced;if(!t)return;
 if(placed&&placed.tool===UI.tool&&placed.type===UI.type&&placed.x===t.x&&placed.y===t.y)return;
 const d=buildingSize(UI.type,UI.rotation||0),x=t.x-Math.floor(d.w/2),y=t.y-Math.floor(d.h/2),pad=3;
 const left=Math.max(0,x-pad)*16,top=Math.max(0,y-pad)*16,right=Math.min(MAPW,x+d.w+pad)*16,bottom=Math.min(MAPH,y+d.h+pad)*16;
 ctx.save();ctx.lineWidth=1/UI.sc;ctx.beginPath();
 for(let px=left;px<=right;px+=16){ctx.moveTo(px,top);ctx.lineTo(px,bottom);}
 for(let py=top;py<=bottom;py+=16){ctx.moveTo(left,py);ctx.lineTo(right,py);}
 ctx.strokeStyle='rgba(33,25,15,.55)';ctx.lineWidth=3/UI.sc;ctx.stroke();ctx.strokeStyle='rgba(240,211,152,.55)';ctx.lineWidth=1/UI.sc;ctx.stroke();ctx.restore();
}
const placementGridSetTool=setTool;setTool=function(...args){UI.placementGridPlaced=null;return placementGridSetTool(...args);};
