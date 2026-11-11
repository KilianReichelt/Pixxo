/* Approved Batch147 controller, runtime copy; no topology/save changes. */
(()=>{
// Draft, isolated code-native cable geometry. No topology, sprite or save mutations.
const directions=['n','ne','e','se','s','sw','w','nw'];
// Native pixel centres on painted insulators, measured on approved Batch100 16x32 art.
const anchors={n:[[7.5,2.5],[7.5,5.5]],ne:[[2.5,5.5],[12.5,1.5]],e:[[2.5,3.5],[13.5,3.5]],se:[[3.5,2.5],[13.5,5.5]],s:[[7.5,2.5],[7.5,5.5]],sw:[[4.5,5.5],[11.5,1.5]],w:[[1.5,4.5],[7.5,5.5]],nw:[[3.5,2.5],[11.5,5.5]]};
function anchor(node,toward){
 if(node.attachment)return {x:node.attachment.x,y:node.attachment.y};
 if(!anchors[node.direction])throw Error('Resolve the actual displayed pole direction before drawing');
 const dx=toward.x-node.x,dy=toward.y-node.y;
 const pts=anchors[node.direction],p=pts.reduce((best,p)=>((p[0]-8)*dx+(p[1]-4)*dy)>((best[0]-8)*dx+(best[1]-4)*dy)?p:best);
 return {x:node.x-8+p[0],y:node.y-32+p[1]}; // node x/y = footprint-bottom-centre in world pixels
}
function point(g,t){return {x:g.a.x+(g.b.x-g.a.x)*t,y:g.a.y+(g.b.y-g.a.y)*t+4*g.sag*t*(1-t)};}
function geometry(a,b){
 const aa=anchor(a,b),bb=anchor(b,a),length=Math.hypot(bb.x-aa.x,bb.y-aa.y),sag=Math.min(6,Math.max(1,length*.055));
 return Object.freeze({a:aa,b:bb,sag,bounds:{left:Math.min(aa.x,bb.x)-2,right:Math.max(aa.x,bb.x)+2,top:Math.min(aa.y,bb.y)-2,bottom:Math.max(aa.y,bb.y)+sag+2}});
}
class CableGeometryCache{
 constructor(limit=384){this.limit=limit;this.entries=new Map();}
 get(a,b){const key=[a,b].map(n=>[n.id,n.x,n.y,n.direction,n.attachment?.x,n.attachment?.y].join(',')).join('|');let g=this.entries.get(key);if(!g){g=geometry(a,b);this.entries.set(key,g);if(this.entries.size>this.limit)this.entries.delete(this.entries.keys().next().value);}return g;}
 clear(){this.entries.clear();}
}
function visible(g,v){return !v||g.bounds.right>=v.left&&g.bounds.left<=v.right&&g.bounds.bottom>=v.top&&g.bounds.top<=v.bottom;}
function activity(g,phase){return point(g,(phase%8+.5)/8);}
function drawCable(ctx,g,{phase=0,powered=false,reducedMotion=false,night=0,fog=0,scale=1,viewport=null}={}){
 if(!visible(g,viewport))return false;
 ctx.save();ctx.globalAlpha*=1-Math.min(.95,Math.max(0,fog));ctx.lineWidth=1/Math.max(.5,scale);ctx.strokeStyle=night>.5?'#77776c':'#544f3b';
 ctx.beginPath();ctx.moveTo(g.a.x,g.a.y);ctx.quadraticCurveTo((g.a.x+g.b.x)/2,(g.a.y+g.b.y)/2+2*g.sag,g.b.x,g.b.y);ctx.stroke();
 // Eight distinct positions ON this same curve; no detached lightning zigzags.
 if(powered&&!reducedMotion){const p=activity(g,phase);ctx.fillStyle=night>.5?'#bbd9dd':'#b0bdb3';ctx.globalAlpha*=.65;ctx.fillRect(Math.round(p.x)-.5,Math.round(p.y)-.5,1,1);}
 ctx.restore();return true;
}

window.GAME_POWER_CABLE_ART=Object.freeze({directions,anchors,anchor,point,geometry,CableGeometryCache,visible,activity,drawCable});
})();

/* Approved147 shared adapter. Explicit call-site hooks prevent duplicate wires.
 * Unknown endpoint/art geometry returns false before touching canvas or topology.
 */
(()=>{
 const cacheByArt=new WeakMap();let previousWorld=null;
 // Pixel-centre contacts measured on approved native day sprites. Roof/metal
 // junctions are attachment projections; no painted insulator is invented.
 const contacts=Object.freeze({dampfkraftwerk_5x4:{w:5,h:4,x:8.5,bottom:33.5},dampfkraftwerk_4x5:{w:4,h:5,x:7.5,bottom:35.5},umspannwerk_3x3:{w:3,h:3,x:8.5,bottom:21.5},kabelstation:{w:3,h:3,x:23.5,bottom:40.5}});
 function displayedNode(b,preview=false){
  const review=window.SpriteReview||window.ApprovedSpriteArt;
  if(!b||!review||review.mode==='original'||typeof spName!=='function')return null;
  const key=preview&&typeof placementPreviewSprite==='function'?placementPreviewSprite(b):spName(b);
  if(typeof SP==='undefined'||!SP[key])return null;
  const base={id:b.id??('plan:'+b.x+':'+b.y),x:(b.x+(b.w||1)/2)*16,y:(b.y+(b.h||1))*16};
  if(b.type==='kabelmast'){
   const direction=review.poleDirection(b);
   if(key!=='review_kabelmast_'+direction+'_0'&&!key.startsWith('approved_kabelmast_'+direction+'_'))return null;
   return {...base,direction};
  }
  const id=Object.keys(contacts).find(id=>key.startsWith('review_'+id+'_')||key.startsWith('approved_'+id+'_'));
  const c=contacts[id];if(!c||b.w!==c.w||b.h!==c.h)return null;
  return {...base,attachment:{x:b.x*16+c.x,y:base.y-c.bottom}};
 }
 function resolved(a,b,preview=false){
  const art=window.GAME_POWER_CABLE_ART;
  if(!art?.CableGeometryCache||!art?.drawCable||!art?.point)return null;
  const aa=displayedNode(a,preview),bb=displayedNode(b,preview);return aa&&bb?{art,aa,bb}:null;
 }
 function handles(a,b){return !!resolved(a,b);}
 function draw(ctx,a,b,options={}){
  const r=resolved(a,b,!!options.preview);if(!r)return false;
  let cache=cacheByArt.get(r.art);if(!cache){cache=new r.art.CableGeometryCache(384);cacheByArt.set(r.art,cache);}
  if(previousWorld!==WORLD){cache.clear();previousWorld=WORLD;}
  const curve=cache.get(r.aa,r.bb),bounds=typeof visibleWorldBounds==='function'?visibleWorldBounds():null,viewport=bounds?{left:bounds.a.x,right:bounds.b.x,top:bounds.a.y,bottom:bounds.b.y}:null;
  if(viewport&&(curve.bounds.right<viewport.left||curve.bounds.left>viewport.right||curve.bounds.bottom<viewport.top||curve.bounds.top>viewport.bottom))return true;
  // Conservative world fog: never expose a wire through an unrevealed middle cell.
  let fog=0;if(typeof fogAlpha==='function')for(let i=0;i<=8;i++){const p=r.art.point(curve,i/8),x=Math.floor(p.x/16),y=Math.floor(p.y/16);if(typeof INMAP==='function'&&!INMAP(x,y)){fog=1;break;}fog=Math.max(fog,fogAlpha(x,y));}
  if(fog>=.95)return true;
  const reduced=typeof WORK_ART!=='undefined'&&WORK_ART.reduced.matches,phase=Math.floor((UI.vt||0)*6),active=options.activity!==false&&!options.preview&&UI.z>=.72&&a.powered&&b.powered&&(a.id+b.id+phase)%12===0;
  ctx.save();
  if(options.preview)ctx.setLineDash([5/UI.sc,4/UI.sc]);
  else if(options.overlay&&a.powered&&b.powered){ctx.setLineDash([6/UI.sc,4/UI.sc]);ctx.lineDashOffset=reduced?0:-(typeof G!=='undefined'?G.time:0)*12;}
  else ctx.setLineDash([]);
  // Continuous shared night lighting on the approved geometry.
  const night=typeof nightAmount==='function'?Math.max(0,Math.min(1,nightAmount())):0;
  ctx.globalAlpha*=1-night*.3;
  if(options.preview){
   ctx.lineWidth=2.5/(UI.sc||1);ctx.strokeStyle=options.valid===false?'#ef9b85':'#b5e6ff';ctx.globalAlpha*=1-Math.min(.95,fog);
   ctx.beginPath();ctx.moveTo(curve.a.x,curve.a.y);ctx.quadraticCurveTo((curve.a.x+curve.b.x)/2,(curve.a.y+curve.b.y)/2+2*curve.sag,curve.b.x,curve.b.y);ctx.stroke();
  }else r.art.drawCable(ctx,curve,{phase,powered:active,reducedMotion:reduced,night:0,fog,scale:UI.sc||1,viewport});
  ctx.restore();return true;
 }
 function drawRoute(ctx,sites,valid=true){
  if(!sites||sites.length<2||typeof IDX!=='function'||typeof INMAP!=='function')return false;
  const nodes=[];for(const site of sites){if(!INMAP(site.x,site.y))return false;const node=typeof powerPoleAt==='function'?powerPoleAt(site.x,site.y):G.byId.get(G.occ[IDX(site.x,site.y)]);nodes.push(node||(typeof placementPreviewBuilding==='function'?placementPreviewBuilding('kabelmast',site.x,site.y):null));}
  for(let i=1;i<nodes.length;i++)if(!resolved(nodes[i-1],nodes[i],true))return false;
  for(let i=1;i<nodes.length;i++)draw(ctx,nodes[i-1],nodes[i],{preview:true,valid,activity:false});return true;
 }
 window.PowerCablePreview=Object.freeze({handles,draw,drawRoute,displayedNode,contacts});
})();
