/* Eight native collapse frames, shared by appearance and drawn in world depth order. */
const DEMOLITION_ART={frames:8,duration:.72,reducedDuration:.18,budgetMs:4,cachePixels:2000000,cacheEntries:48};
const DEMOLITION_EFFECTS=[];
const DEMOLITION_FRAMES=new Map();let demolitionWorld=null,demolitionPixels=0;
function demolitionSource(b){const name=buildingPreviewSprite(b),source=HD_CATALOG.get(name)?.pixelSource||SP[name];if(!source)return null;return {source,x:Math.round(b.x*16+b.w*8-source.width/2),y:Math.round((b.y+b.h)*16-(SPB[name]?.H||source.height))};}
function demolitionFrames(source){
 if(DEMOLITION_FRAMES.has(source)){const frames=DEMOLITION_FRAMES.get(source);DEMOLITION_FRAMES.delete(source);DEMOLITION_FRAMES.set(source,frames);return frames;}
 const frames=[],w=source.width,h=source.height,base=h-3,center=(w-1)/2,steps=[0,.06,.17,.34,.56,.8,.96,1];
 for(let frame=0;frame<8;frame++){
  const a=document.createElement('canvas');a.width=w;a.height=h;const c=a.getContext('2d');c.imageSmoothingEnabled=false;
  if(frame===0)nativeDrawImage.call(c,source,0,0);
  else{
   const t=steps[frame];
   // Move solid 4px fragments on the native grid; never stretch or smooth them.
   for(let y=h-4;y>=-3;y-=4)for(let x=0;x<w;x+=4){
    const sy=Math.max(0,y),sh=Math.min(4,h-sy),sw=Math.min(4,w-x),seed=hs(x,sy,193);
    const dx=Math.max(0,Math.min(w-sw,Math.round(x+(center-x)*t*.48+(seed-.5)*t*4)));
    const pile=base-((Math.floor(x/4)+Math.floor(sy/4))%3)*2;
    const dy=Math.max(0,Math.min(h-sh,Math.round(sy+(pile-sy)*t+(seed-.5)*t*3)));
    nativeDrawImage.call(c,source,x,sy,sw,sh,dx,dy,sw,sh);
   }
   // Sparse, hard-edged dust, only around the collapsed body.
   if(frame>=2&&frame<=6)for(let p=0;p<8;p++){const dx=Math.round(center+(hs(p,19,5)-.5)*w*.65),dy=Math.max(0,Math.min(h-2,base-2-Math.round(hs(p,31,7)*8*(frame<5?1:1.5))));c.fillStyle=p%2?'#9d927b':'#b5a78b';c.fillRect(dx,dy,p%3===0?2:1,1);}
  }
  frames.push(a);
 }
 DEMOLITION_FRAMES.set(source,frames);demolitionPixels+=w*h*8;
 while(DEMOLITION_FRAMES.size>DEMOLITION_ART.cacheEntries||demolitionPixels>DEMOLITION_ART.cachePixels){const oldest=DEMOLITION_FRAMES.keys().next().value;DEMOLITION_FRAMES.delete(oldest);demolitionPixels-=oldest.width*oldest.height*8;}
 return frames;
}
function demolitionEffect(b){const sprite=demolitionSource(b);if(!sprite)return null;return {...sprite,island:b.island??activeIsland,board:G.tiles,depth:(b.y+b.h)*16,start:null,frames:null};}
const demolitionRemoveBld=removeBld;
removeBld=function(b,refund){
 if(!refund||!b||!G.byId.has(b.id))return demolitionRemoveBld(b,refund);
 if(demolitionWorld!==WORLD){DEMOLITION_EFFECTS.length=0;demolitionWorld=WORLD;}
 const targets=[b,...G.blds.filter(f=>f.fieldOwner===b.id)],effects=targets.map(target=>({target,effect:demolitionEffect(target)})).filter(entry=>entry.effect);
 const result=demolitionRemoveBld(b,refund);
 for(const {target,effect} of effects)if(!G.byId.has(target.id))DEMOLITION_EFFECTS.push(effect);
 return result;
};
function addDemolitionEffects(x0,y0,x1,y1){
 if(demolitionWorld!==WORLD){DEMOLITION_EFFECTS.length=0;demolitionWorld=WORLD;}
 const deadline=performance.now()+DEMOLITION_ART.budgetMs,time=UI.vt;
 for(let i=DEMOLITION_EFFECTS.length-1;i>=0;i--){
  const effect=DEMOLITION_EFFECTS[i],duration=WORK_ART.reduced.matches?DEMOLITION_ART.reducedDuration:DEMOLITION_ART.duration;
  if(effect.start!==null&&time-effect.start>=duration){DEMOLITION_EFFECTS.splice(i,1);continue;}
  if(effect.x+effect.source.width<x0||effect.x>x1||effect.y+effect.source.height<y0||effect.y>y1){if(effect.start===null)effect.start=time;continue;}
  if(effect.start===null){
   if(WORK_ART.reduced.matches||worldOverview()){effect.start=time;}
   else if(DEMOLITION_FRAMES.has(effect.source)||performance.now()<deadline){effect.frames=demolitionFrames(effect.source);effect.start=time;}
  }
  ENT.push([effect.depth,6,effect]);
 }
}
function drawDemolition(ctx,effect){
 const reduced=WORK_ART.reduced.matches,elapsed=effect.start===null?0:Math.max(0,UI.vt-effect.start),duration=reduced?DEMOLITION_ART.reducedDuration:DEMOLITION_ART.duration,index=Math.min(7,Math.floor(elapsed/duration*8));
 ctx.save();ctx.imageSmoothingEnabled=false;
 ctx.globalAlpha*=reduced?Math.max(0,1-elapsed/duration):index<5?1:[.8,.45,.12][index-5];
 nativeDrawImage.call(ctx,!reduced&&!worldOverview()&&effect.frames?effect.frames[index]:effect.source,effect.x,effect.y);
 ctx.restore();
}
const demolitionStreetEntities=addStreetPeople;addStreetPeople=function(...args){demolitionStreetEntities(...args);addDemolitionEffects(...args);};
