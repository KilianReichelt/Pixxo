/* Die Tageszeit ist rein visuell; Wirtschaft und Spieltempo behalten ihre eigene Zeit. */
const DAY_LENGTH_SECONDS=1200;
let DAY_CLOUD_SPRITE=null,DAY_CLOUD_PATTERN=null;
function dayCloudSprite(){
 if(DAY_CLOUD_SPRITE)return DAY_CLOUD_SPRITE;
 const a=document.createElement('canvas');a.width=a.height=512;const c=a.getContext('2d');
 for(const cloud of [{x:100,y:110,r:34,stretch:1.5},{x:332,y:180,r:75,stretch:1.35},{x:160,y:370,r:52,stretch:1.8}])for(const [ox,oy,f] of [[0,0,1],[-.48,.12,.72],[.45,-.12,.64]]){
  c.save();c.translate(cloud.x+ox*cloud.r,cloud.y+oy*cloud.r);c.scale(cloud.stretch,1);const radius=cloud.r*f,g=c.createRadialGradient(0,0,radius*.12,0,0,radius);
  g.addColorStop(0,'rgba(24,35,46,.42)');g.addColorStop(.48,'rgba(24,35,46,.25)');g.addColorStop(1,'rgba(24,35,46,0)');c.fillStyle=g;c.fillRect(-radius,-radius,radius*2,radius*2);c.restore();
 }
 // Quantised opacity and a two-pixel grid make the shadow edges visibly pixelated.
 const image=c.getImageData(0,0,512,512),data=image.data;
 for(let y=0;y<512;y+=2)for(let x=0;x<512;x+=2){const sample=((y+1)*512+x+1)*4,alpha=Math.min(192,Math.round(data[sample+3]*1.2/24)*24);for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){const i=((y+dy)*512+x+dx)*4;data[i]=24;data[i+1]=35;data[i+2]=46;data[i+3]=alpha;}}
 c.putImageData(image,0,0);DAY_CLOUD_SPRITE=a;return a;
}
function drawDayClouds(ctx,x0,y0,x1,y1){
 const daylight=1-nightAmount();if(daylight<=.01)return;
 const time=WORK_ART.reduced.matches?0:G.time,pattern=DAY_CLOUD_PATTERN||(DAY_CLOUD_PATTERN=ctx.createPattern(dayCloudSprite(),'repeat'));
 ctx.save();ctx.imageSmoothingEnabled=false;
 for(const [scale,speedX,speedY,opacity,offset] of [[3,.75,.19,.5,0],[2,.45,.12,.28,811]]){
  pattern.setTransform(new DOMMatrix().translate(offset+time*speedX,offset*.37+time*speedY).scale(scale));ctx.globalAlpha=opacity*daylight;ctx.fillStyle=pattern;ctx.fillRect(x0,y0,x1-x0,y1-y0);
 }ctx.restore();
}
function dayClock(){if(!WORLD)return {minutes:720,enabled:true,system:false};return WORLD.dayClock??={minutes:720,enabled:true,system:false};}
function dayMinutes(){const c=dayClock();if(c.system){const now=new Date();return now.getHours()*60+now.getMinutes()+now.getSeconds()/60;}return c.minutes;}
function dayTimeLabel(){const m=Math.floor(dayMinutes());return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');}
function twilightFade(value){const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t);}
function nightAmount(){const h=dayMinutes()/60;return h<5||h>=21?1:h<7?1-twilightFade((h-5)/2):h>=18?twilightFade((h-18)/3):0;}
// Fog follows the night tint without changing discovery alpha.
const dayPrepareFog=prepareFog;
let nightFogCanvas=null,nightFogLevel=-1;
function nightFogEdgeColor(){
 const amount=nightAmount()*.58;
 return 'rgb('+[189,201,208].map((channel,i)=>Math.round(channel*(1-amount)+[8,16,42][i]*amount)).join(',')+')';
}
prepareFog=function(){
 const changed=fogDirty||fogFades.size>0||PERF_FOG.miniDirty,source=dayPrepareFog();if(!source)return source;
 const level=Math.round(nightAmount()*100);if(level===0){nightFogLevel=-1;return source;}
 if(!nightFogCanvas||nightFogCanvas.width!==source.width||nightFogCanvas.height!==source.height){
  nightFogCanvas=document.createElement('canvas');nightFogCanvas.width=source.width;nightFogCanvas.height=source.height;nightFogLevel=-1;
 }
 if(changed||level!==nightFogLevel){
  const c=nightFogCanvas.getContext('2d');c.clearRect(0,0,source.width,source.height);c.drawImage(source,0,0);
  c.save();c.globalCompositeOperation='source-atop';c.fillStyle='rgba(8,16,42,'+(level/100*.58)+')';c.fillRect(0,0,source.width,source.height);c.restore();nightFogLevel=level;
 }
 return nightFogCanvas;
};
// The detailed map uses chunked fog instead of the minimap canvas.
const dayFogChunk=fogChunk,nightFogChunks=new WeakMap();
fogChunk=function(x,y){
 const source=dayFogChunk(x,y),level=Math.round(nightAmount()*100);if(!level)return source;
 const stamp=PERF_FOG.chunks.get(x+':'+y);let entry=nightFogChunks.get(source);
 if(!entry||entry.level!==level||entry.stamp!==stamp){
  const canvas=entry?.canvas||document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
  const c=canvas.getContext('2d');c.drawImage(source,0,0);c.globalCompositeOperation='source-atop';
  c.fillStyle='rgba(8,16,42,'+(level/100*.58)+')';c.fillRect(0,0,canvas.width,canvas.height);c.globalCompositeOperation='source-over';
  entry={canvas,level,stamp};nightFogChunks.set(source,entry);
 }
 return entry.canvas;
};
const dayStepWorld=stepWorld;stepWorld=function(dt){dayStepWorld(dt);const c=dayClock();if(c.enabled&&!c.system)c.minutes=(c.minutes+dt*1440/DAY_LENGTH_SECONDS)%1440;};
const clockPopup=document.createElement('section');clockPopup.id='clock-popup';clockPopup.className='clock-popup';clockPopup.hidden=true;clockPopup.setAttribute('role','dialog');clockPopup.setAttribute('aria-label','Tageszeit');
clockPopup.innerHTML='<div class="clock-heading"><strong>Tageszeit</strong><button type="button" class="btn" data-clock-close aria-label="Tageszeit schließen">×</button></div><p data-clock-label></p><label><input type="checkbox" data-clock-enabled> Tag/Nacht-Wechsel</label><label><input type="checkbox" data-clock-system> Mit Systemuhr koppeln</label><form data-clock-form><label for="clock-time">Zu einer Uhrzeit springen</label><div class="clock-jump"><input id="clock-time" type="time" value="12:00" required><button class="btn" type="submit">Übernehmen</button></div></form><p class="small">Ein Spieltag dauert 20 Minuten bei normalem Tempo. Der Zeitsprung behält den eingestellten Wechsel bei. Zum Festhalten einer Uhrzeit schalte den Wechsel aus.</p>';
document.body.append(clockPopup);
function updateClockPopup(){const c=dayClock();clockPopup.querySelector('[data-clock-enabled]').checked=c.enabled;clockPopup.querySelector('[data-clock-enabled]').disabled=c.system;clockPopup.querySelector('[data-clock-system]').checked=c.system;clockPopup.querySelector('[data-clock-label]').textContent=(c.system?'Systemzeit: ':'Spielzeit: ')+dayTimeLabel();}
function closeClockPopup(){clockPopup.hidden=true;document.querySelector('[data-clock-toggle]')?.setAttribute('aria-expanded','false');}
$('#top').addEventListener('click',e=>{if(!e.target.closest('[data-clock-toggle]'))return;clockPopup.hidden=!clockPopup.hidden;updateClockPopup();e.target.closest('[data-clock-toggle]').setAttribute('aria-expanded',String(!clockPopup.hidden));if(!clockPopup.hidden)clockPopup.querySelector('[data-clock-close]').focus();});
clockPopup.addEventListener('click',e=>{if(e.target.closest('[data-clock-close]')){closeClockPopup();document.querySelector('[data-clock-toggle]')?.focus();}});
clockPopup.addEventListener('change',e=>{const c=dayClock();if(e.target.matches('[data-clock-enabled]'))c.enabled=e.target.checked;if(e.target.matches('[data-clock-system]')){c.minutes=dayMinutes();c.system=e.target.checked;}updateClockPopup();saveGame();});
clockPopup.querySelector('form').addEventListener('submit',e=>{e.preventDefault();const input=clockPopup.querySelector('#clock-time');if(!input.checkValidity())return;const [h,m]=input.value.split(':').map(Number);Object.assign(dayClock(),{minutes:h*60+m,system:false});updateClockPopup();renderTop(true);saveGame();});
document.addEventListener('pointerdown',e=>{if(!clockPopup.hidden&&!clockPopup.contains(e.target)&&!e.target.closest('[data-clock-toggle]'))closeClockPopup();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!clockPopup.hidden){closeClockPopup();document.querySelector('[data-clock-toggle]')?.focus();}});
const dayRenderTop=renderTop;renderTop=function(...args){dayRenderTop(...args);let button=document.querySelector('[data-clock-toggle]');if(!button){button=document.createElement('button');button.className='navbtn';button.type='button';button.dataset.clockToggle='';button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-controls','clock-popup');$('#top').insertBefore(button,$('#top').querySelector('.speeds'));}button.textContent=(nightAmount()>.5?'☾ ':'☀ ')+dayTimeLabel();button.setAttribute('aria-label','Tageszeit einstellen · '+dayTimeLabel());button.setAttribute('aria-expanded',String(!clockPopup.hidden));document.documentElement.style.setProperty('--topH',$('#top').offsetHeight+'px');if(!clockPopup.hidden)updateClockPopup();};
const NIGHT_WINDOWS=new Map();
const NIGHT_WINDOW_STATES=new WeakMap();
let NIGHT_GLOW=null;
function nightWindows(name){
 if(NIGHT_WINDOWS.get(name)?.sprite===SP[name])return NIGHT_WINDOWS.get(name);
 const sprite=SP[name],source=HD_CATALOG.get(name)?.pixelSource||smallPixelSource(sprite),w=source.width,h=source.height,seen=new Set(),components=[];
 const pixels=source._nightWindows?null:source.getContext('2d').getImageData(0,0,w,h).data;
 const warm=k=>{const i=k*4;return pixels[i+3]>200&&pixels[i+1]>pixels[i]*1.08&&pixels[i+2]>pixels[i]*1.12&&pixels[i+1]>45;};
 if(source._nightWindows){for(const p of source._nightWindows){const pane=[];for(let y=p.y;y<p.y+p.h;y++)for(let x=p.x;x<p.x+p.w;x++){if(p.cross&&(x===p.x+Math.floor(p.w/2)||y===p.y+Math.floor(p.h/2)))continue;if(x>=0&&y>=0&&x<w&&y<h)pane.push(y*w+x);}if(pane.length>=4)components.push({pixels:pane,x:p.x+p.w/2,y:p.y+p.h/2});}}
 else for(let y=Math.floor(h*.15);y<Math.floor(h*.92);y++)for(let x=1;x<w-1;x++){const start=y*w+x;if(seen.has(start)||!warm(start))continue;const queue=[start];seen.add(start);let minX=x,maxX=x,minY=y,maxY=y;for(let j=0;j<queue.length;j++){const k=queue[j],xx=k%w,yy=Math.floor(k/w);minX=Math.min(minX,xx);maxX=Math.max(maxX,xx);minY=Math.min(minY,yy);maxY=Math.max(maxY,yy);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=xx+dx,ny=yy+dy;if(nx<0||ny<0||nx>=w||ny>=h)continue;const n=ny*w+nx;if(warm(n)&&!seen.has(n)){seen.add(n);queue.push(n);}}}if(queue.length>=4&&queue.length<=120&&maxX-minX>=1&&maxY-minY>=1&&maxX-minX<=12&&maxY-minY<=14)components.push({pixels:queue,x:(minX+maxX+1)/2,y:(minY+maxY+1)/2});}
 const result={sprite,w,h,lights:components.slice(0,40)};NIGHT_WINDOWS.set(name,result);return result;
}
function nightWindowState(windows,b){let states=NIGHT_WINDOW_STATES.get(windows);if(!states){states=new Map();NIGHT_WINDOW_STATES.set(windows,states);}const day=Math.floor((WORLD?.islands[b.island??activeIsland]?.time||G.time)/DAY_LENGTH_SECONDS),home=b.type==='haus';let selected=windows.lights.map((_,i)=>!home||hs(b.id+i*791,b.island||0,(WORLD?.rootSeed||G.seed)+day*37)>.4);if(home&&selected.length){if(!selected.some(Boolean))selected[b.id%selected.length]=true;if(selected.length>1&&selected.every(Boolean))selected[(b.id+1)%selected.length]=false;}const key=selected.map(v=>v?'1':'0').join('');if(states.has(key))return states.get(key);const mask=document.createElement('canvas');mask.width=windows.w;mask.height=windows.h;const c=mask.getContext('2d'),image=c.createImageData(windows.w,windows.h),lights=windows.lights.filter((_,i)=>selected[i]);for(const p of lights)for(const k of p.pixels){image.data.set([255,218,123,255],k*4);}c.putImageData(image,0,0);const state={mask,lights};if(states.size>=24)states.delete(states.keys().next().value);states.set(key,state);return state;}
function nightGlowSprite(){if(NIGHT_GLOW)return NIGHT_GLOW;const a=document.createElement('canvas');a.width=a.height=40;const c=a.getContext('2d'),g=c.createRadialGradient(20,20,0,20,20,20);g.addColorStop(0,'rgba(255,194,75,.3)');g.addColorStop(1,'rgba(255,194,75,0)');c.fillStyle=g;c.fillRect(0,0,40,40);return NIGHT_GLOW=a;}
function drawNight(ctx,x0,y0,x1,y1){const amount=nightAmount();if(amount<=0)return;ctx.save();ctx.fillStyle=`rgba(8,16,42,${amount*.58})`;ctx.fillRect(x0,y0,x1-x0,y1-y0);
 if(worldOverview()){ctx.restore();return;}
 for(const b of worldBuildings()){const d=B[b.type],lamp=['deko_laterne','deko_lampe'].includes(b.type);if(b.x*16+b.w*16+64<x0||b.x*16-64>x1||(b.y+b.h)*16<y0||b.y*16-128>y1||b.fire>0||(!lamp&&!d.nightLight&&!['home','prod','svc','wh','shipyard','monument'].includes(d.kind)))continue;const name=spName(b),s=SP[name],m=SPB[name];if(!s||!m)continue;const dx=b.x*16+b.w*8-s.width/2,dy=(b.y+b.h)*16-m.H;if(dx+s.width<x0||dx>x1||dy+m.H<y0||dy>y1)continue;const windows=lamp?null:nightWindows(name),state=windows?nightWindowState(windows,b):null,lights=lamp?[[dx+s.width*.5,dy+m.H*.27]]:state.lights.map(c=>[dx+c.x/windows.w*s.width,dy+c.y/windows.h*m.H]);
  ctx.globalAlpha=amount;for(const [x,y] of lights){const radius=lamp?18:9;nativeDrawImage.call(ctx,nightGlowSprite(),x-radius,y-radius,radius*2,radius*2);if(lamp){ctx.fillStyle='#ffe8a1';ctx.fillRect(Math.round(x)-1,Math.round(y)-1,2,3);}}
  if(state){ctx.globalAlpha=amount*(b.paused?.5:1);ctx.drawImage(state.mask,dx,dy,s.width,m.H);}ctx.globalAlpha=1;
 }ctx.restore();}
