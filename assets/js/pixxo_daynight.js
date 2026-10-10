/* Die Tageszeit ist rein visuell; Wirtschaft und Spieltempo behalten ihre eigene Zeit. */
const DAY_LENGTH_SECONDS=1200;
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
function nightWindows(name){
 if(NIGHT_WINDOWS.get(name)?.sprite===SP[name])return NIGHT_WINDOWS.get(name);
 const sprite=SP[name],source=HD_CATALOG.get(name)?.pixelSource||smallPixelSource(sprite),w=source.width,h=source.height,pixels=source.getContext('2d').getImageData(0,0,w,h).data,seen=new Set(),components=[];
 const warm=k=>{const i=k*4;return pixels[i+3]>200&&pixels[i]>135&&pixels[i+1]>105&&pixels[i+2]<pixels[i+1]*.94&&pixels[i]>=pixels[i+1]*.98&&pixels[i]<pixels[i+1]*1.6;};
 for(let y=Math.floor(h*.28);y<Math.floor(h*.83);y++)for(let x=1;x<w-1;x++){const start=y*w+x;if(seen.has(start)||!warm(start))continue;const queue=[start];seen.add(start);let minX=x,maxX=x,minY=y,maxY=y,dark=0,edge=0;for(let j=0;j<queue.length;j++){const k=queue[j],xx=k%w,yy=Math.floor(k/w);minX=Math.min(minX,xx);maxX=Math.max(maxX,xx);minY=Math.min(minY,yy);maxY=Math.max(maxY,yy);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=xx+dx,ny=yy+dy;if(nx<0||ny<0||nx>=w||ny>=h)continue;const n=ny*w+nx;if(warm(n)){if(!seen.has(n)){seen.add(n);queue.push(n);}}else{edge++;if(pixels[n*4+3]>200&&pixels[n*4]+pixels[n*4+1]+pixels[n*4+2]<330)dark++;}}}if(queue.length<=12&&maxX-minX<=5&&maxY-minY<=4&&dark>=Math.max(2,edge*.2))components.push({pixels:queue,x:(minX+maxX+1)/2,y:(minY+maxY+1)/2});}
 const mask=document.createElement('canvas');mask.width=w;mask.height=h;const g=mask.getContext('2d'),image=g.createImageData(w,h);for(const c of components.slice(0,8))for(const k of c.pixels){image.data[k*4]=255;image.data[k*4+1]=226;image.data[k*4+2]=135;image.data[k*4+3]=255;}g.putImageData(image,0,0);const result={sprite,mask,w,h,lights:components.slice(0,8)};NIGHT_WINDOWS.set(name,result);return result;
}
function drawNight(ctx,x0,y0,x1,y1){const amount=nightAmount();if(amount<=0)return;ctx.save();ctx.fillStyle=`rgba(8,16,42,${amount*.58})`;ctx.fillRect(x0,y0,x1-x0,y1-y0);
 for(const b of worldBuildings()){const d=B[b.type],lamp=['deko_laterne','deko_lampe'].includes(b.type);if(b.fire>0||(!lamp&&!['home','prod','svc','wh','shipyard'].includes(d.kind)))continue;const name=b.type==='haus'?spName(b):rotatedSprite(typeSprite(b.type,b.tier),b.rotation||0),s=SP[name],m=SPB[name];if(!s||!m)continue;const dx=b.x*16+b.w*8-s.width/2,dy=(b.y+b.h)*16-m.H;if(dx+s.width<x0||dx>x1||dy+m.H<y0||dy>y1)continue;const windows=lamp?null:nightWindows(name),lights=lamp?[[dx+s.width*.5,dy+m.H*.27]]:windows.lights.map(c=>[dx+c.x/windows.w*s.width,dy+c.y/windows.h*m.H]);
  for(const [x,y] of lights){const radius=lamp?18:9,glow=ctx.createRadialGradient(x,y,0,x,y,radius);glow.addColorStop(0,`rgba(255,194,75,${amount*.3})`);glow.addColorStop(1,'rgba(255,194,75,0)');ctx.fillStyle=glow;ctx.fillRect(x-radius,y-radius,radius*2,radius*2);if(lamp){ctx.globalAlpha=amount;ctx.fillStyle='#ffe8a1';ctx.fillRect(Math.round(x)-1,Math.round(y)-1,2,3);ctx.globalAlpha=1;}}
  if(windows){ctx.globalAlpha=amount*(b.paused?.5:1);ctx.drawImage(windows.mask,dx,dy,s.width,m.H);ctx.globalAlpha=1;}
 }ctx.restore();}
