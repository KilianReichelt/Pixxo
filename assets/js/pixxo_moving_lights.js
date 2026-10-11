/* Small native lanterns and cached night glows. No new simulation entities. */
const MOVING_LIGHTS={maxLamps:48,lamp:null,glows:new Map()};
function movingLampSprite(){
 if(MOVING_LIGHTS.lamp)return MOVING_LIGHTS.lamp;
 const a=document.createElement('canvas');a.width=2;a.height=3;const {r}=civicPainter(a);
 r(0,0,2,3,'#3b2d1e');r(0,1,1,1,'#bd8e42');r(1,1,1,1,'#fff0b3');return MOVING_LIGHTS.lamp=a;
}
function movingGlowSprite(fire=false){
 const key=fire?'fire':'lamp';if(MOVING_LIGHTS.glows.has(key))return MOVING_LIGHTS.glows.get(key);
 const a=document.createElement('canvas');a.width=a.height=64;const c=a.getContext('2d'),g=c.createRadialGradient(32,32,1,32,32,32),power=fire?.8:.58;
 g.addColorStop(0,'rgba(255,193,81,'+power+')');g.addColorStop(.45,'rgba(240,151,53,'+(power*.35)+')');g.addColorStop(1,'rgba(230,125,40,0)');c.fillStyle=g;c.fillRect(0,0,64,64);MOVING_LIGHTS.glows.set(key,a);return a;
}
function wagonLampPosition(e){
 const c=e[4],i=Math.min(c.path.length-2,Math.max(0,Math.floor(c.t))),a=c.path[i],b=c.path[i+1];if(a===undefined||b===undefined)return null;
 const dx=Math.sign(b%MAPW-a%MAPW),dy=Math.sign(Math.floor(b/MAPW)-Math.floor(a/MAPW));
 const offset=dx&&dy?[-6*dx,-3*dy]:dx?[dx>0?-8:6,1]:[4,dy>0?-5:2];return {x:Math.round(e[2]+offset[0]),y:Math.round(e[3]+offset[1]),radius:19,alpha:e[5]??1};
}
function boatLampPosition(e){
 const name=e[2],vertical=name.includes(':v:'),flip=name.includes(':true:'),x=e[3],y=e[4];
 // Stern follows the heading. The passenger and bow remain unobstructed.
 return {x:Math.round(x+(vertical?7:flip?13:0)),y:Math.round(y+(vertical?flip?12:1:10)),radius:15,alpha:1};
}
function fireLightPulse(b,index,time=UI.vt){return WORK_ART.reduced.matches?.68:.6+.23*Math.sin(time*6+index*2.1+b.id*.17);}
function drawMovingNightLights(ctx,x0,y0,x1,y1){
 const amount=nightAmount();if(amount<=0||worldOverview())return;ctx.save();let lamps=0;
 for(const e of ENT){
  if(lamps>=MOVING_LIGHTS.maxLamps)break;const lamp=e[1]===2?wagonLampPosition(e):e[1]===7?boatLampPosition(e):null;if(!lamp||lamp.alpha<=0)continue;
  if(lamp.x<x0-20||lamp.x>x1+20||lamp.y<y0-20||lamp.y>y1+20)continue;
  if(e[1]===7){const board=ambientBoard(),k=IDX(Math.floor(lamp.x/16),Math.floor(lamp.y/16));if(ambientBridge(board,k))continue;}
  ctx.globalAlpha=amount*lamp.alpha;ctx.drawImage(movingGlowSprite(),lamp.x-lamp.radius, lamp.y-lamp.radius, lamp.radius*2,lamp.radius*2);
  ctx.drawImage(movingLampSprite(),lamp.x,lamp.y);lamps++;
 }
 for(const b of worldBuildings()){
  if(b.fire<=0||b.x*16>x1+32||(b.x+b.w)*16<x0-32||b.y*16>y1+32||(b.y+b.h)*16<y0-32)continue;
  const source=SP[workshopSprite(b)],left=Math.round(b.x*16+b.w*8-(source?.width||b.w*16)/2);
  for(let i=0;i<3;i++){
   const x=Math.round(left+(i+.5)*b.w*16/3-8),y=Math.round((b.y+b.h)*16-20-(i===1?8:0)),pulse=fireLightPulse(b,i),radius=24+6*pulse;
   ctx.globalAlpha=amount*pulse;ctx.drawImage(movingGlowSprite(true),x+8-radius,y+10-radius,radius*2,radius*2);
   const frame=WORK_ART.reduced.matches?0:Math.floor(UI.vt*7+i)%3;ctx.globalAlpha=amount;ctx.drawImage(SP['fire'+frame],x,y);
  }
 }ctx.restore();
}
const movingLightsDrawNight=drawNight;
drawNight=function(...args){movingLightsDrawNight(...args);drawMovingNightLights(...args);};
