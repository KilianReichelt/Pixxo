/* Local placement aid; never persisted and never scans the map. */
function drawPlacementGrid(ctx){
 if(!['build','move'].includes(UI.tool)||!B[UI.type])return;
 const t=ghostTile(),placed=UI.placementGridPlaced;if(!t)return;
 if(placed&&placed.tool===UI.tool&&placed.type===UI.type&&placed.x===t.x&&placed.y===t.y)return;
 const d=buildingSize(UI.type,UI.rotation||0),x=t.x-Math.floor(d.w/2),y=t.y-Math.floor(d.h/2),pad=8;
 const left=Math.max(0,x-pad),top=Math.max(0,y-pad),right=Math.min(MAPW,x+d.w+pad),bottom=Math.min(MAPH,y+d.h+pad),bands=Array.from({length:8},()=>[]);
 const add=(ax,ay,bx,by)=>{
  const mx=(ax+bx)/2,my=(ay+by)/2,dx=Math.max(x-mx,0,mx-x-d.w),dy=Math.max(y-my,0,my-y-d.h),fade=Math.max(0,1-Math.hypot(dx,dy)/pad);
  if(fade>0)bands[Math.min(7,Math.floor(fade*8))].push([ax*16,ay*16,bx*16,by*16]);
 };
 for(let xx=left;xx<=right;xx++)for(let yy=top;yy<bottom;yy++)add(xx,yy,xx,yy+1);
 for(let yy=top;yy<=bottom;yy++)for(let xx=left;xx<right;xx++)add(xx,yy,xx+1,yy);
 ctx.save();for(let i=0;i<bands.length;i++){
  if(!bands[i].length)continue;ctx.beginPath();for(const [ax,ay,bx,by] of bands[i]){ctx.moveTo(ax,ay);ctx.lineTo(bx,by);}
  const alpha=.55*Math.pow((i+1)/8,1.4);ctx.strokeStyle='rgba(33,25,15,'+alpha+')';ctx.lineWidth=3/UI.sc;ctx.stroke();ctx.strokeStyle='rgba(240,211,152,'+alpha+')';ctx.lineWidth=1/UI.sc;ctx.stroke();
 }ctx.restore();
}
const placementGridSetTool=setTool;setTool=function(...args){UI.placementGridPlaced=null;return placementGridSetTool(...args);};
