/* Acht diskrete Tuchphasen; das Kontorgebäude bleibt pixelgenau erhalten. */
const KONTOR_FLAGS=new Map();
function kontorFlagPixels(tier){
 const name=typeSprite('kontor',tier),entry=HD_CATALOG.get(name);let flag=KONTOR_FLAGS.get(name);
 if(flag?.source===entry.pixelSource)return flag;
 const source=entry.pixelSource,w=source.width,h=source.height,data=source.getContext('2d').getImageData(0,0,w,h).data,candidates=new Map(),components=[];
 for(let y=0;y<h*.4;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;if(data[i+3]&&data[i]>data[i+1]*1.4&&data[i]>data[i+2]*1.3)candidates.set(y*w+x,{x,y,rgba:Array.from(data.slice(i,i+4))});}
 while(candidates.size){const first=candidates.keys().next().value,queue=[first],component=[];for(let i=0;i<queue.length;i++){const k=queue[i],p=candidates.get(k);if(!p)continue;candidates.delete(k);component.push(p);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])if(p.x+dx>=0&&p.x+dx<w&&candidates.has((p.y+dy)*w+p.x+dx))queue.push((p.y+dy)*w+p.x+dx);}components.push(component);}
 const pixels=components.sort((a,b)=>b.length-a.length)[0]||[];
 flag={source,pixels,minX:Math.min(...pixels.map(p=>p.x)),maxX:Math.max(...pixels.map(p=>p.x))};KONTOR_FLAGS.set(name,flag);return flag;
}
function kontorFlagSprite(tier,frame){
 const name=typeSprite('kontor',tier);if(!frame)return name;
 const key=name+'_flag'+frame;if(HD_CATALOG.has(key))return key;
 const flag=kontorFlagPixels(tier);if(!flag.pixels.length)return name;
 const low=document.createElement('canvas');low.width=flag.source.width;low.height=flag.source.height;const c=low.getContext('2d');nativeDrawImage.call(c,flag.source,0,0);
 for(const p of flag.pixels)c.clearRect(p.x,p.y,1,1);
 for(const p of flag.pixels){
  const u=flag.maxX===flag.minX?1:(p.x-flag.minX)/(flag.maxX-flag.minX),wave=Math.sin(frame*Math.PI/4-u*3),dy=Math.round(wave*1.7*u),shade=1+wave*.12*u;
  c.fillStyle='rgba('+p.rgba.slice(0,3).map(v=>Math.min(255,Math.round(v*shade))).join(',')+','+(p.rgba[3]/255)+')';c.fillRect(p.x,p.y+dy,1,1);
 }
 const entry=HD_CATALOG.get(name);publishPixel(key,low,entry.w,entry.h,SPB[name]);return key;
}
const kontorWorkshopSprite=workshopSprite;
workshopSprite=function(b){
 if(b.type!=='kontor')return kontorWorkshopSprite(b);
 const time=WORLD?.islands[b.island]?.time??G.time,frame=G.speed>0&&!b.paused&&b.fire<=0&&!WORK_ART.reduced.matches?Math.floor(time*5+b.id)%8:0;
 return rotatedSprite(kontorFlagSprite(b.tier,frame),b.rotation||0);
};
// Warm pixel lamps and sagging fairy lights on the market stalls, at night only.
const MARKET_LIGHT_STRINGS=[[7,35,31,35],[47,39,70,39],[10,86,33,86],[47,86,70,86]];
function marketNightDecor(ctx,b,amount){
 const base=typeSprite('markt',b.tier),source=HD_CATALOG.get(base)?.pixelSource||SP[base],sprite=SP[rotatedSprite(base,b.rotation||0)];
 if(!source||!sprite)return;const w=SP[base].width,h=SP[base].height,r=((b.rotation||0)%4+4)%4;
 ctx.save();ctx.translate(b.x*16+b.w*8,(b.y+b.h)*16-sprite.height/2);ctx.rotate(r*Math.PI/2);ctx.scale(w/source.width,h/source.height);ctx.translate(-source.width/2,-source.height/2);
 ctx.globalAlpha=amount;ctx.lineWidth=1;ctx.strokeStyle='#3b281d';ctx.beginPath();
 for(const [x,y,end,ey] of MARKET_LIGHT_STRINGS){ctx.moveTo(x+.5,y+.5);ctx.lineTo((x+end)/2+.5,y+2.5);ctx.lineTo(end+.5,ey+.5);}ctx.stroke();
 const lights=MARKET_LIGHT_STRINGS.flatMap(([x,y,end])=>Array.from({length:5},(_,i)=>[Math.round(x+(end-x)*(i+.5)/5),y+1+Math.round(Math.sin((i+.5)/5*Math.PI)*2)]));
 lights.push([6,80],[74,80]);
 for(const [x,y] of lights){const glow=ctx.createRadialGradient(x+.5,y+.5,0,x+.5,y+.5,5);glow.addColorStop(0,'rgba(255,193,76,.38)');glow.addColorStop(1,'rgba(255,193,76,0)');ctx.fillStyle=glow;ctx.fillRect(x-5,y-5,11,11);ctx.fillStyle='#9d642b';ctx.fillRect(x-1,y-1,3,3);ctx.fillStyle='#ffe9a6';ctx.fillRect(x,y,1,2);}
 ctx.restore();
}
function drawMarketNightLights(ctx,x0,y0,x1,y1){
 const amount=nightAmount();if(amount<=0)return;
 for(const b of worldBuildings())if(b.type==='markt'&&b.fire<=0&&b.x*16<x1&&(b.x+b.w)*16>x0&&b.y*16-64<y1&&(b.y+b.h)*16>y0)marketNightDecor(ctx,b,amount);
}
const marketDrawNight=drawNight;drawNight=function(ctx,x0,y0,x1,y1){marketDrawNight(ctx,x0,y0,x1,y1);drawMarketNightLights(ctx,x0,y0,x1,y1);};
