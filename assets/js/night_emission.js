/* Reuse original pixels; no sprite files or new authored textures are created. */
const NIGHT_EMISSION={strength:.48,cache:new Map(),bytes:0,maxBytes:4*1024*1024,maxEntries:128};
function nightEmissionPixels(day,night){
 // Strengthen only warm pixels genuinely brighter than the matching day pixel.
 // Preserve the night artist's RGB and alpha footprint; never paint white windows.
 const out=new Uint8ClampedArray(night.length);
 for(let p=0;p<night.length;p+=4){const r=night[p],g=night[p+1],b=night[p+2],before=day[p]*.2126+day[p+1]*.7152+day[p+2]*.0722,after=r*.2126+g*.7152+b*.0722;
  if(day[p+3]&&night[p+3]&&r>=145&&g>=95&&r>b*1.2&&g>b*1.05&&after>before+24&&after>before*1.2){out[p]=r;out[p+1]=g;out[p+2]=b;out[p+3]=Math.round(night[p+3]*Math.min(1,(after-before)/96));}
 }return out;
}
function dedicatedNightEmission(name){
 const night=window.SpriteReview?.dedicatedNight?.(name);if(!night)return null;
 const day=HD_CATALOG.get(name)?.pixelSource||SP[name],old=NIGHT_EMISSION.cache.get(night);if(old?.day===day)return old.mask;
 if(old)NIGHT_EMISSION.bytes-=old.bytes;
 let mask=null,bytes=0;
 try{if(day.width===night.width&&day.height===night.height){const dark=night.getContext('2d').getImageData(0,0,night.width,night.height).data,light=day.getContext('2d').getImageData(0,0,day.width,day.height).data,pixels=nightEmissionPixels(light,dark);
  if(pixels.some((v,i)=>i%4===3&&v)){mask=document.createElement('canvas');mask.width=night.width;mask.height=night.height;const c=mask.getContext('2d'),image=c.createImageData(mask.width,mask.height);image.data.set(pixels);c.putImageData(image,0,0);bytes=pixels.byteLength;}
 }}catch{} // Unavailable pixels remain unlit; never substitute guessed window positions.
 NIGHT_EMISSION.cache.set(night,{day,mask,bytes});NIGHT_EMISSION.bytes+=bytes;
 while(NIGHT_EMISSION.bytes>NIGHT_EMISSION.maxBytes||NIGHT_EMISSION.cache.size>NIGHT_EMISSION.maxEntries){const key=NIGHT_EMISSION.cache.keys().next().value;NIGHT_EMISSION.bytes-=NIGHT_EMISSION.cache.get(key).bytes;NIGHT_EMISSION.cache.delete(key);}
 return mask;
}
const strongerNightWindows=drawNight;
drawNight=function(ctx,x0,y0,x1,y1){const result=strongerNightWindows(ctx,x0,y0,x1,y1),amount=nightAmount();if(amount<=.01||worldOverview()||!NIGHT_LIGHTING_OPTIONS.extra)return result;
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.globalCompositeOperation='screen';
 for(const b of worldBuildings()){
  if(b.fire>0||B[b.type]?.kind==='field'||b.x*16>x1+64||(b.x+b.w)*16<x0-64||b.y*16>y1+128||(b.y+b.h)*16<y0-64)continue;
  const name=workshopSprite(b),sprite=SP[name],meta=SPB[name];if(!sprite||!meta)continue;
  let mask=dedicatedNightEmission(name);if(!mask){if(hasDedicatedNightSprite(name))continue;const windows=nightWindows(name);if(!windows.lights.length)continue;mask=nightWindowState(windows,b).mask;}
  ctx.globalAlpha=amount*NIGHT_EMISSION.strength*(b.paused?.5:1);ctx.filter='none';
  nativeDrawImage.call(ctx,mask,b.x*16+b.w*8-sprite.width/2,(b.y+b.h)*16-meta.H,sprite.width,meta.H);
 }ctx.restore();return result;
};
