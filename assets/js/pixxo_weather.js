/* Atmosphärisches Wetter ohne Einfluss auf Wirtschaft, Terrain oder Feuer.
   Gewitter sind im Schema vorbereitet; zunächst wird nur Regen ausgelöst. */
const WEATHER_TYPES={clear:{rain:false,implemented:true},rain:{rain:true,implemented:true},storm:{rain:true,implemented:false}};
const WEATHER_RULES={dryMin:240,dryMax:600,rainMin:360,rainMax:720,puddleDryMax:300};
function weatherRandom(w){w.rng=(Math.imul(1664525,w.rng)+1013904223)>>>0;return w.rng/4294967296;}
function weatherCreate(seed){const w={version:1,rng:(seed^0x51a7c09)>>>0,time:0,type:'clear',start:0,end:0,intensity:0,nextAt:0,puddleEvents:[]};w.nextAt=180+weatherRandom(w)*420;return w;}
function weatherState(){return WORLD.weather??=weatherCreate(WORLD.rootSeed||G.seed);}
function weatherBeginRain(duration=null){
 const w=weatherState(),d=duration??(WEATHER_RULES.rainMin+weatherRandom(w)*(WEATHER_RULES.rainMax-WEATHER_RULES.rainMin));
 if(!Number.isFinite(d)||d<=0)throw Error('Ungültige Regendauer');
 w.type='rain';w.start=w.time;w.end=w.time+d;w.nextAt=w.end;w.intensity=.5+weatherRandom(w)*.45;
 w.puddleEvents.push({seed:Math.floor(weatherRandom(w)*0x7fffffff),start:w.start,end:w.end,intensity:w.intensity});w.puddleEvents=w.puddleEvents.slice(-3);return w;
}
function weatherStep(dt){
 if(!Number.isFinite(dt)||dt<=0)return;const w=weatherState(),target=w.time+dt;
 while(w.nextAt<=target){w.time=w.nextAt;if(w.type==='clear')weatherBeginRain();else{w.type='clear';w.intensity=0;w.nextAt=w.time+WEATHER_RULES.dryMin+weatherRandom(w)*(WEATHER_RULES.dryMax-WEATHER_RULES.dryMin);}}
 w.time=target;w.puddleEvents=w.puddleEvents.filter(e=>w.time<e.end+WEATHER_RULES.puddleDryMax);
}
function weatherRainAmount(){const w=weatherState();return w.type==='rain'?w.intensity*Math.min(1,Math.max(0,(w.time-w.start)/8),Math.max(0,(w.end-w.time)/12)):0;}
const weatherWorldStep=stepWorld;stepWorld=function(dt){weatherWorldStep(dt);weatherStep(dt);};
function weatherRestore(saved){
 const valid=saved?.version===1&&['clear','rain'].includes(saved.type)&&['rng','time','start','end','intensity','nextAt'].every(k=>Number.isFinite(saved[k]))&&saved.time>=0&&saved.nextAt>=saved.time&&saved.intensity>=0&&saved.intensity<=1;
 if(!valid)return weatherCreate(WORLD.rootSeed||G.seed);
 return {...saved,puddleEvents:(Array.isArray(saved.puddleEvents)?saved.puddleEvents:[]).filter(e=>e&&['seed','start','end','intensity'].every(k=>Number.isFinite(e[k]))&&e.start>=0&&e.end>e.start&&e.intensity>0&&e.intensity<=1).slice(-3)};
}
const weatherLoadGame=loadGame;loadGame=function(...args){const ok=weatherLoadGame(...args);if(ok){let saved;try{saved=JSON.parse(localStorage.getItem(SAVEKEY));}catch{}WORLD.weather=weatherRestore(saved?.weather);}return ok;};
const PUDDLE_SPRITES=new Map();
const PUDDLE_CELL=4;
// Five fixed native-pixel silhouettes: little splash, shallow crescent,
// uneven oval, two joined pools and a wide irregular depression.
const PUDDLE_SHAPES=[
 {w:9,h:5,rows:[[3,6],[1,7],[0,8],[1,7],[3,5]]},
 {w:15,h:7,rows:[[5,9],[2,11],[1,13],[0,14],[2,13],[4,10],[6,8]]},
 {w:21,h:9,rows:[[7,13],[4,16],[2,17],[1,19],[0,20],[1,20],[3,17],[6,14],[8,11]]},
 {w:29,h:11,rows:[[6,12],[3,15],[2,20],[1,25],[0,27],[1,28],[3,27],[4,25],[7,24],[12,21],[16,19]]},
 {w:37,h:15,rows:[[13,20],[9,25],[6,27],[4,30],[2,32],[1,35],[0,36],[1,35],[3,33],[4,34],[6,32],[9,29],[13,26],[17,24],[19,22]]}
];
function weatherPuddleSprite(shape){
 if(PUDDLE_SPRITES.has(shape))return PUDDLE_SPRITES.get(shape);
 const spec=PUDDLE_SHAPES[shape],c=document.createElement('canvas');c.width=spec.w;c.height=spec.h;const g=c.getContext('2d');
 const inside=(x,y)=>y>=0&&y<spec.h&&x>=spec.rows[y][0]&&x<=spec.rows[y][1];
 for(let y=0;y<spec.h;y++)for(let x=spec.rows[y][0];x<=spec.rows[y][1];x++){
  const top=!inside(x,y-1),bottom=!inside(x,y+1),side=!inside(x-1,y)||!inside(x+1,y);
  g.fillStyle=bottom?'#455e66':top?'#96adb1':side?'#526d74':hs(x,y,shape+91)>.72?'#718f96':'#63828b';g.fillRect(x,y,1,1);
 }
 // Restrained broken sky reflections, all on the same one-pixel raster.
 g.fillStyle='#adc4c6';const ry=Math.max(1,Math.floor(spec.h*.28)),[left,right]=spec.rows[ry];
 for(let x=left+2;x<right-1;x++)if(x%5!==0)g.fillRect(x,ry,1,1);
 if(shape>=2){g.fillStyle='#879fa4';const yy=Math.floor(spec.h*.62);for(let x=spec.rows[yy][0]+4;x<spec.rows[yy][1]-4;x+=3)g.fillRect(x,yy,2,1);}
 PUDDLE_SPRITES.set(shape,c);return c;
}
function weatherPuddle(g,event,gx,gy){
 if(hs(gx*3+7,gy*5-11,event.seed)>.56)return null;
 const tx=gx*PUDDLE_CELL+Math.floor(hs(gx,gy,event.seed+13)*PUDDLE_CELL),ty=gy*PUDDLE_CELL+Math.floor(hs(gx,gy,event.seed+17)*PUDDLE_CELL);
 if(!INMAP(tx,ty)||![T.SAND,T.GRASS,T.FOREST].includes(g.tiles[IDX(tx,ty)])||g.occ[IDX(tx,ty)])return null;
 const x=tx*16+4+Math.floor(hs(gx,gy,event.seed+21)*8),y=ty*16+4+Math.floor(hs(gx,gy,event.seed+23)*8),shape=Math.floor(hs(gx*3+5,gy*7-3,event.seed+25)*PUDDLE_SHAPES.length),spec=PUDDLE_SHAPES[shape],rx=(spec.w-1)/2,ry=(spec.h-1)/2;
 for(let yy=Math.floor((y-ry)/16);yy<=Math.floor((y+ry)/16);yy++)for(let xx=Math.floor((x-rx)/16);xx<=Math.floor((x+rx)/16);xx++)if(!INMAP(xx,yy)||![T.SAND,T.GRASS,T.FOREST].includes(g.tiles[IDX(xx,yy)])||g.occ[IDX(xx,yy)])return null;
 const time=weatherState().time,dry=75+hs(gx,gy,event.seed+29)*225,delay=hs(gx,gy,event.seed+31)*45,fade=90+hs(gx*5+3,gy*3-1,event.seed+37)*90;
 const progress=Math.min(1,Math.max(0,(Math.min(time,event.end)-event.start-delay)/fade)),peak=progress*progress*(3-2*progress),wet=peak*(time<=event.end?1:Math.max(0,1-(time-event.end)/dry));
 return wet>0?{x,y,rx,ry,wet:wet*event.intensity,shape}:null;
}
function drawWeatherPuddles(ctx,x0,y0,x1,y1){
 if(UI.z<.25)return;const w=weatherState();if(!w.puddleEvents.length)return;
 const spacing=PUDDLE_CELL*16,gx0=Math.max(0,Math.floor(x0/spacing)),gy0=Math.max(0,Math.floor(y0/spacing)),gx1=Math.min(Math.ceil(MAPW/PUDDLE_CELL)-1,Math.floor(x1/spacing)),gy1=Math.min(Math.ceil(MAPH/PUDDLE_CELL)-1,Math.floor(y1/spacing));
 ctx.save();for(const event of w.puddleEvents)for(let gy=gy0;gy<=gy1;gy++)for(let gx=gx0;gx<=gx1;gx++){
  const p=weatherPuddle(G,event,gx,gy);if(!p)continue;ctx.globalAlpha=Math.min(.9,p.wet*.95);ctx.drawImage(weatherPuddleSprite(p.shape),Math.round(p.x-p.rx),Math.round(p.y-p.ry));
 }ctx.restore();
}
let rainAudio=null;
function weatherAudioSync(){
 const amount=weatherRainAmount(),c=Sound.ctx,active=amount>0&&c?.state==='running'&&G.speed>0&&!document.hidden&&!audioChannelMuted('ambient')&&Sound.prefs.ambient>0&&!document.body.classList.contains('start-open')&&document.querySelector('#pixxo-tour')?.hidden!==false;
 if(!rainAudio&&active){
  const buffer=c.createBuffer(1,c.sampleRate*2,c.sampleRate),data=buffer.getChannelData(0);let smooth=0;
  for(let i=0;i<data.length;i++){smooth=smooth*.6+(Math.random()*2-1)*.4;data[i]=smooth;}
  const source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();source.buffer=buffer;source.loop=true;filter.type='lowpass';filter.frequency.value=1800;gain.gain.value=0;source.connect(filter);filter.connect(gain);gain.connect(Sound.ambient);source.start();rainAudio={source,filter,gain,target:-1};
 }
 if(rainAudio){const target=active?amount*.10:0;if(target!==rainAudio.target){rainAudio.gain.gain.setTargetAtTime(target,c.currentTime,.22);rainAudio.target=target;}}
}
const weatherAudioLevels=audioLevels;audioLevels=function(...args){weatherAudioLevels(...args);if(WORLD)weatherAudioSync();};
document.addEventListener('visibilitychange',()=>{if(WORLD)weatherAudioSync();});
function drawWeatherRain(ctx,x0,y0,x1,y1){
 weatherAudioSync();const amount=weatherRainAmount();if(!amount)return;
 ctx.save();ctx.fillStyle='rgba(27,43,61,'+(amount*.07)+')';ctx.fillRect(x0,y0,x1-x0,y1-y0);
 if(!WORK_ART.reduced.matches){
  const w=weatherState(),spacing=Math.max(42,Math.ceil(Math.sqrt((x1-x0)*(y1-y0)/220))),phase=w.time,seed=w.puddleEvents.at(-1)?.seed||w.rng;
  ctx.strokeStyle='rgba(190,209,218,'+(amount*.48)+')';ctx.lineWidth=1;ctx.beginPath();
  for(let gy=Math.floor(y0/spacing)-1;gy<=Math.ceil(y1/spacing);gy++)for(let gx=Math.floor(x0/spacing)-1;gx<=Math.ceil(x1/spacing);gx++){
   const x=gx*spacing+hs(gx,gy,seed)*spacing-((phase*18)%spacing),y=gy*spacing+((hs(gx*3+1,gy*5-2,seed+7)*spacing+phase*100)%spacing);
   ctx.moveTo(x,y);ctx.lineTo(x-2,y+5+hs(gx,gy,seed+11)*3);
  }ctx.stroke();
 }ctx.restore();
}
const weatherDrawNight=drawNight;drawNight=function(ctx,x0,y0,x1,y1){weatherDrawNight(ctx,x0,y0,x1,y1);drawWeatherRain(ctx,x0,y0,x1,y1);};
