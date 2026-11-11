/* Legacy callers retain immutable source art. Batch 151 mounted flags are added
   by mounted_owner_flags.js after the approved-art runtime. Never search roof colors. */
function kontorFlagPixels(tier){return {source:HD_CATALOG.get(typeSprite('kontor',tier))?.pixelSource,pixels:[]};}
function kontorFlagSprite(tier,frame){return typeSprite('kontor',tier);}
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
