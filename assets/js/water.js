/* Pixelwasser: vorhandene Terraintexturen, kontinuierliche Wellenzüge und Brandung.
   Eigenständiger WebGL-1-Shader ohne zusätzliche externe Ressourcen. */
const GAME_WATER_DEPTH={data:null,width:0,height:0,board:null,
 sample(x,y){if(!this.data||this.board!==G.tiles)return 32;const px=x-.5,py=y-.5,ix=Math.floor(px),iy=Math.floor(py),fx=px-ix,fy=py-iy;let depth=0,river=0;
  for(let j=0;j<2;j++)for(let i=0;i<2;i++){const k=(Math.max(0,Math.min(this.height-1,iy+j))*this.width+Math.max(0,Math.min(this.width-1,ix+i)))*4,w=(i?fx:1-fx)*(j?fy:1-fy);depth+=this.data[k]/255*32*w;river+=this.data[k+3]/255*w;}
  const d=.45+Math.pow(Math.max(0,Math.min(1,(depth-.2)/3.5)),1.35)*10.5;return depth*(1-river)+d*river;
 }};
const GAME_WATER_QUALITY={maxWidth:1200,maxHeight:800,maxFps:30,metrics:{draws:0,reused:0,width:0,height:0}};
function uploadWaterTerrainArt(gl,art){
 const p=art.pixels;if(p)gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,p.w,p.h,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array(p.data.buffer,p.data.byteOffset,p.data.byteLength));
 else gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,art.image);
}
(() => {
 'use strict';
 const options=new URLSearchParams(location.search);
 if(options.get('wasser')==='klassisch')return;
 const originalOcean=drawOcean, originalSurf=drawBeachSurf;
 const surface=document.createElement('canvas');
 const gl=surface.getContext('webgl',{alpha:false,antialias:false,depth:false,preserveDrawingBuffer:true});
 if(!gl){cv.dataset.water='fallback';return;}
 let ready=false,enabled=true,terrain=null,riverTerrain=null,worldWidth=0,worldHeight=0,texture,artTexture,artLoaded=false,artWindow=null,lastView=null,lastPaint=-Infinity;
 GAME_WATER_QUALITY.refreshTerrainArt=()=>{artLoaded=false;artWindow=null;lastView=null;lastPaint=-Infinity;};
 const waterTime=()=>WORK_ART.reduced.matches?0:UI.vt;
 const vertex=`attribute vec2 position; varying vec2 uv;
 void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
 const fragment=`precision highp float;
 varying vec2 uv;
 uniform sampler2D bathymetry,terrainArt,approvedWater;
 uniform float approvedWaterReady;
 uniform float materialMacro;
 uniform vec2 artOrigin,artExtent;
 uniform float artStep;
 uniform vec2 origin,extent,worldSize;
 uniform float time,sunStrength;
 uniform vec3 sunDirection,sunColor;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
 vec4 bed(vec2 p){vec2 q=p/worldSize;return texture2D(bathymetry,clamp(q,vec2(.00001),vec2(.99999)));}
 vec3 waterArt(vec2 p,float slot){return texture2D(approvedWater,(vec2(slot*16.,0.)+mod(floor(p),16.)+.5)/vec2(80.,16.)).rgb;}
 float phase(float period){return time*6.2831853072/period;}
 float waves(vec2 p){
 // Wandernde Wellenpakete verändern lokal Richtung, Steilheit und Abstände.
 vec2 warp=vec2(noise(p*.009+vec2(time*.012,-time*.009)),noise(p*.011+37.+vec2(-time*.008,time*.014)))*14.;
 float group=.32+.68*noise(p*.018+vec2(time*.013,-time*.008));
 p+=warp;
 return sin(dot(p,vec2(.061,.019))-phase(8.8))*group
 +sin(dot(p,vec2(-.029,.077))-phase(13.6))*(.25+group*.4)
 +sin(dot(p,vec2(.121,-.091))+phase(5.6))*.22
 +sin(dot(p,vec2(-.233,-.127))-phase(3.2))*.085
 +sin(dot(p,vec2(.71,-.43))+phase(2.4))*.024
 +sin(dot(p,vec2(-1.11,.63))-phase(4.8))*.017;}
 vec2 slope(vec2 p){return vec2(waves(p+vec2(.6,0))-waves(p-vec2(.6,0)),waves(p+vec2(0,.6))-waves(p-vec2(0,.6)))/1.2;}
 vec3 groundArt(vec2 p,float rock){
 if(materialMacro>1.5){vec2 pixel=clamp(floor((floor(p)-artOrigin)/artStep),vec2(0.),artExtent-1.);vec2 a=(pixel+.5)/vec2(artExtent.x*2.,artExtent.y);vec2 b=(pixel+vec2(artExtent.x,0.)+.5)/vec2(artExtent.x*2.,artExtent.y);return mix(texture2D(terrainArt,a).rgb,texture2D(terrainArt,b).rgb,rock);}
 if(materialMacro>.5){vec2 pixel=mod(floor(p),256.);vec2 a=(pixel+.5)/vec2(512.,256.);vec2 b=(pixel+vec2(256.,0.)+.5)/vec2(512.,256.);return mix(texture2D(terrainArt,a).rgb,texture2D(terrainArt,b).rgb,rock);}
 vec2 tile=floor(p/16.);float variant=floor(hash(tile)*4.);
 vec2 pixel=mod(floor(p),16.);
 vec2 uvRock=(vec2(variant*16.,0.)+pixel+.5)/vec2(64.,32.);
 vec2 uvSand=(vec2(mod(variant,3.)*16.,16.)+pixel+.5)/vec2(64.,32.);
 return mix(texture2D(terrainArt,uvSand).rgb,texture2D(terrainArt,uvRock).rgb,rock);
 }
 float causticCells(vec2 p){
 vec2 cell=floor(p),f=fract(p);float nearest=9.,second=9.;
 for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){
  vec2 id=cell+vec2(float(x),float(y)),seed=vec2(hash(id),hash(id+19.));
  vec2 point=vec2(float(x),float(y))+.5+(seed-.5)*.62+sin(seed*6.283+time*vec2(.41,.53))*.19-f;
  float d=dot(point,point);if(d<nearest){second=nearest;nearest=d;}else second=min(second,d);
 }
 return 1.-smoothstep(.012,.09,sqrt(second)-sqrt(nearest));
 }
 float seaWhitecap(vec2 p,float depth){
 vec2 id=floor(p/vec2(96.,80.));float seed=hash(id+91.),period=9.+seed*7.;
 float age=time/period+seed*19.,cycle=floor(age),life=fract(age);
 float enabled=step(.7,hash(id+cycle*vec2(17.,31.)));
 vec2 center=(id+vec2(.25+hash(id+7.)*.5,.25+hash(id+13.)*.5))*vec2(96.,80.);
 vec2 direction=normalize(vec2(.7+seed*.5,.15+hash(id+43.)*.65)),q=p-center-direction*(life-.5)*13.;
 float along=dot(q,direction),across=dot(q,vec2(-direction.y,direction.x)),length=5.+hash(id+cycle)*8.;
 float arc=across+along*along*.025+sin(along*.6+seed*9.)*.55;
 float shape=(1.-smoothstep(.7,2.,abs(arc)))*(1.-smoothstep(length*.6,length,abs(along)));
 float flecks=smoothstep(.3,.72,noise(p*.55+vec2(time*.17,-time*.12)));
 float fade=smoothstep(.05,.25,life)*(1.-smoothstep(.58,.92,life));
 return enabled*shape*flecks*fade*smoothstep(4.,8.,depth);
 }
 void main(){
 vec2 p=floor(origin+vec2(uv.x,1.-uv.y)*extent)+.5;
 vec4 terrain=bed(p);float depth=terrain.r*32.;
 // Zellgenaue Flussmaske: keine Meeresbrandung an Flussufern, auch unter Brücken.
 float river=bed(p).a;
 vec2 grad=slope(p)*mix(1.,.38,river);vec3 normal=normalize(vec3(-grad*2.7,1.));
 vec2 refracted=floor(p+grad*(2.+min(depth,10.)*.65))+.5;
 vec4 under=bed(refracted);depth=mix(depth,under.r*32.,.35*(1.-river));
 // Ein ausgeprägtes Querprofil lässt die Flussmitte tiefer als die Ufer erscheinen.
 float riverDepth=.45+pow(clamp((depth-.2)/3.5,0.,1.),1.35)*10.5;
 depth=mix(depth,riverDepth,river);
 // Sandmulden, unregelmäßige Felsgruppen und erhöhte Steinköpfe unter Wasser.
 float formation=noise(refracted*.021)*.57+noise(refracted*.053+31.)*.29+noise(refracted*.13+71.)*.14;
 float rockAmount=smoothstep(.49-under.g*.09,.61-under.g*.07,formation);
 float terrainRelief=(formation-.46)*5.-rockAmount*2.4;
 depth=max(.25,depth+terrainRelief*(1.-river)*smoothstep(.8,3.,depth));
 float shelf=exp(-depth*.115);
 vec3 deep=mix(vec3(.012,.065,.15),vec3(.025,.13,.19),river),lagoon=mix(vec3(.10,.49,.52),vec3(.12,.40,.39),river);
 if(approvedWaterReady>.5){deep=waterArt(p,0.);lagoon=waterArt(p,1.);}
 vec3 color=mix(deep,lagoon,shelf);
 // Genau die Pixeltexturen von Sand und Gestein aus der vorhandenen Landschaft.
 vec3 floorColor=groundArt(refracted,rockAmount);
 if(approvedWaterReady>.5)floorColor=mix(waterArt(refracted,2.),waterArt(refracted,3.),rockAmount);
 float facet=noise(refracted*.025+vec2(-.5,-.4))-noise(refracted*.025+vec2(.5,.4));
 floorColor*=mix(1.,clamp(.86+facet*.9,.5,1.2),rockAmount);
 float lightNet=0.;if(depth<14.){
 vec2 lightWarp=vec2(noise(refracted*.035+vec2(time*.08,0.)),noise(refracted*.047+vec2(17.,-time*.06)))*1.7;
 lightNet=causticCells(refracted*.075+lightWarp+vec2(time*.012,-time*.018));
 lightNet*=(.35+.65*noise(refracted*.05+vec2(-time*.025,time*.04)))*(1.-smoothstep(9.,14.,depth));}
 floorColor+=vec3(.10,.15,.115)*lightNet*(.25+.75*sunStrength);
 // Exponentielle Absorption lässt Felsen kontinuierlich in der Tiefe verschwinden.
 vec3 transmission=exp(-vec3(.25,.14,.085)*depth);
 color=mix(color,floorColor*vec3(.57,.95,1.03),transmission*.88);
 vec3 light=normalize(sunDirection);
 float sun=pow(max(dot(reflect(-light,normal),vec3(0,0,1)),0.),180.);
 float glitter=pow(max(dot(reflect(-light,normalize(vec3(-grad*4.,1.))),vec3(0,0,1)),0.),170.);
 vec2 sky=p*.0018+grad*.6+vec2(time*.0021,-time*.0013);
 float cloud=smoothstep(.42,.74,noise(sky*4.)*.7+noise(sky*9.)*.3);
 float fresnel=.055+.32*pow(1.-normal.z,2.);
 color=mix(color,mix(vec3(.25,.49,.62),vec3(.68,.79,.81),cloud),fresnel+cloud*.055);
 float sparkles=smoothstep(.46,.77,noise(p*1.1+grad*4.));
 color+=sunColor*(sun*.19+glitter*.24)*sparkles*sunStrength;
 color+=vec3(.04,.09,.09)*dot(normal,light);
 float wind=sin(dot(p,vec2(.18,.09))-phase(5.6)+noise(p*.04+time*.008)*3.);
 color+=vec3(.018,.035,.058)*pow(max(0.,wind),13.)*smoothstep(.35,.8,noise(p*.027))*(1.-shelf);
 // Spiegelnde Küstenkante: Wellen brechen die Silhouette am Fuß der Felsen.
 float coastReflection=bed(p+vec2(grad.x*8.,-9.+grad.y*7.)).b;
 color=mix(color,vec3(.085,.19,.27),coastReflection*.17);
 // Zwei versetzte Brecher laufen mit der Küstenentfernung zum Ufer.
 float shore=terrain.r*272.;float along=noise(p*.015)*6.;
 float cycle=fract(time/8.8+along*.11),stepPhase=cycle;
 float front=31.*(1.-stepPhase)+2.;
 float breakup=noise(p*.27+vec2(time*.09,-time*.065));
 float patch=smoothstep(.49,.72,noise(p*.075+vec2(-time*.055,time*.03)))*smoothstep(.22,.65,breakup);
 float band=(1.-smoothstep(1.,3.5,abs(shore-front+(noise(p*.09)-.5)*4.)));
 float crest=band*patch*sin(stepPhase*3.14159);
 float secondCycle=fract(time/13.6+along*.08+.45);
 float secondFront=23.*(1.-secondCycle)+3.;
 crest=max(crest,(1.-smoothstep(.7,2.2,abs(shore-secondFront)))*patch*sin(secondCycle*3.14159)*.65);
 float wash=(1.-smoothstep(2.,15.,shore))*(.24+.13*sin(phase(8.8)+along));
 wash*=smoothstep(.25,.72,noise(p*.47+grad));
 float foam=max(crest*.78,wash*.65);
 foam=max(foam,seaWhitecap(p,depth)*.72);
 color=mix(color,approvedWaterReady>.5?waterArt(p,4.):vec3(.79,.89,.94),foam*(1.-terrain.b)*(1.-river));
 // Begrenzte Farbstufen und ortsfestes Dithering erhalten den Pixelcharakter.
 color=floor(clamp(color,0.,1.)*48.+hash(floor(p))*.45)/48.;
 gl_FragColor=vec4(color,1.);
 }`;
 function compile(type,source){const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));return shader;}
 let program,uniforms,pendingDepth=null,approvedTexture=null,approvedAtlas=null;
 try{
  program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  uniforms=Object.fromEntries(['approvedWater','approvedWaterReady','origin','extent','worldSize','time','bathymetry','terrainArt','materialMacro','artOrigin','artExtent','artStep','sunDirection','sunColor','sunStrength'].map(key=>[key,gl.getUniformLocation(program,key)]));
  texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
  for(const axis of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,axis,gl.CLAMP_TO_EDGE);
  for(const filter of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,filter,gl.LINEAR);
  artTexture=gl.createTexture();gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,artTexture);
  for(const axis of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,axis,gl.CLAMP_TO_EDGE);
  for(const filter of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,filter,gl.NEAREST);
  gl.activeTexture(gl.TEXTURE0);
  approvedTexture=gl.createTexture();gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,approvedTexture);
  for(const axis of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,axis,gl.CLAMP_TO_EDGE);
  for(const filter of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,filter,gl.NEAREST);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,255]));gl.activeTexture(gl.TEXTURE0);
  ready=true;
 }catch(error){console.warn('Wasserdarstellung: ursprünglicher Renderer wird verwendet.',error);return;}
 // Chamfer-Distanzfeld: linearer Aufwand statt Küstensuche pro Bildpunkt.
 function updateDepth(){
  if(!artLoaded){
   const macro=window.SpriteReview?.terrainAtlas?.(),atlas=macro||document.createElement('canvas');
   if(!macro){atlas.width=64;atlas.height=32;const c=atlas.getContext('2d');c.imageSmoothingEnabled=false;for(let i=0;i<4;i++){c.drawImage(landscapeClone('rock'+i),i*16,0,16,16);c.drawImage(landscapeClone('sand'+(i%3)),i*16,16,16,16);}}
   gl.uniform1f(uniforms.materialMacro,macro?1:0);
   gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,artTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,atlas);artLoaded=true;
  }
  gl.activeTexture(gl.TEXTURE0);
  const board=G.tiles,river=G.river,w=MAPW,h=MAPH;
  if(pendingDepth?.board===board&&pendingDepth.river===river&&pendingDepth.w===w&&pendingDepth.h===h)return false;
  const request={board,river,w,h};pendingDepth=request;
  const commit=data=>{
   if(!ready||pendingDepth!==request||G.tiles!==board||G.river!==river||MAPW!==w||MAPH!==h)return false;
   gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,data);
   if(gl.getError()!==gl.NO_ERROR)throw Error('Water depth texture upload failed');
   Object.assign(GAME_WATER_DEPTH,{data,width:w,height:h,board});terrain=board;riverTerrain=river;worldWidth=w;worldHeight=h;lastView=null;pendingDepth=null;return true;
  };
  const result=TERRAIN_JOBS.depth({tiles:board,river,width:w,height:h,shallow:T.SHAL,rock:T.ROCK,ore:T.ORE});
  if(typeof result.then!=='function')return commit(result);
  result.then(data=>{try{commit(data);}catch(error){depthFailed(error);}},error=>{if(pendingDepth!==request)return;if(error.name==='AbortError')pendingDepth=null;else depthFailed(error);});return false;
 }
 function depthFailed(error){ready=false;pendingDepth=null;land?.chunks?.clear();cv.dataset.water='fallback';console.warn('Water depth fallback',error);}

 // Keep the last complete world frame while preparing a different board.
 // Never replace the approved water with a temporary classic-water frame.
 const waterPreparedRender=render;
 render=function(...args){
  if(ready&&enabled&&(terrain!==G.tiles||riverTerrain!==G.river||worldWidth!==MAPW||worldHeight!==MAPH)){
   try{if(!updateDepth()){cv.dataset.water='preparing';return false;}}
   catch(error){depthFailed(error);}
  }
  return waterPreparedRender(...args);
 };

 surface.addEventListener('webglcontextlost',event=>{event.preventDefault();ready=false;land?.chunks?.clear();cv.dataset.water='fallback';});
 drawOcean=function(ctx,x0,y0,x1,y1){
  if(!ready||!enabled){originalOcean(ctx,x0,y0,x1,y1);return;}
  try{
   if(terrain!==G.tiles||riverTerrain!==G.river||worldWidth!==MAPW||worldHeight!==MAPH){if(!updateDepth()){cv.dataset.water='preparing';originalOcean(ctx,x0,y0,x1,y1);return;}}
   const approved=window.GAME_MATERIAL_RUIN_ART?.waterAtlas();
   if(approved!==approvedAtlas){approvedAtlas=approved;lastView=null;if(approved){approvedTexture=approvedTexture||gl.createTexture();gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,approvedTexture);for(const axis of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,axis,gl.CLAMP_TO_EDGE);for(const filter of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,filter,gl.NEAREST);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,approved);gl.activeTexture(gl.TEXTURE0);}}
   gl.uniform1i(uniforms.approvedWater,2);gl.uniform1f(uniforms.approvedWaterReady,approved?1:0);
   // Begrenzte Auflösung hält auch hochauflösende Displays spielbar.
   const scale=Math.min(1,GAME_WATER_QUALITY.maxWidth/cv.width,GAME_WATER_QUALITY.maxHeight/cv.height),w=Math.max(1,Math.round(cv.width*scale)),h=Math.max(1,Math.round(cv.height*scale)),time=waterTime(),sunMinute=Math.floor((typeof dayMinutes==='function'?dayMinutes():720)/5),view=[x0,y0,x1,y1,w,h,sunMinute].join(':');
   if(lastView===view&&time>=lastPaint&&time-lastPaint<1/GAME_WATER_QUALITY.maxFps-.001){ctx.save();ctx.imageSmoothingEnabled=false;nativeDrawImage.call(ctx,surface,x0,y0,x1-x0,y1-y0);ctx.restore();GAME_WATER_QUALITY.metrics.reused++;return;}
   // Refracted positions extend beyond the camera; the view atlas includes
   // margins and is reused until the camera approaches its boundary.
   const windowArt=window.SpriteReview?.terrainAtlas?.([x0,y0,x1,y1]);
   if(windowArt&&(windowArt.pixels||windowArt.image)){if(artWindow!==windowArt){gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,artTexture);uploadWaterTerrainArt(gl,windowArt);artWindow=windowArt;gl.activeTexture(gl.TEXTURE0);}gl.uniform1f(uniforms.materialMacro,2);gl.uniform2f(uniforms.artOrigin,windowArt.x,windowArt.y);gl.uniform2f(uniforms.artExtent,windowArt.w,windowArt.h);gl.uniform1f(uniforms.artStep,windowArt.step);artLoaded=true;}
   if(surface.width!==w||surface.height!==h){surface.width=w;surface.height=h;}
   gl.viewport(0,0,w,h);gl.useProgram(program);gl.uniform2f(uniforms.origin,x0,y0);gl.uniform2f(uniforms.extent,x1-x0,y1-y0);gl.uniform2f(uniforms.worldSize,MAPW*16,MAPH*16);
   const hour=(typeof dayMinutes==='function'?dayMinutes():720)/60,angle=(hour-6)/12*Math.PI,elevation=Math.max(0,Math.sin(angle)),warm=Math.max(0,1-elevation);
   gl.uniform3f(uniforms.sunDirection,Math.cos(angle)*.75,-.5,.3+elevation);gl.uniform3f(uniforms.sunColor,1,.95-warm*.16,.83-warm*.3);gl.uniform1f(uniforms.sunStrength,elevation);
   gl.uniform1f(uniforms.time,time);gl.uniform1i(uniforms.bathymetry,0);gl.uniform1i(uniforms.terrainArt,1);gl.drawArrays(gl.TRIANGLES,0,6);lastView=view;lastPaint=time;Object.assign(GAME_WATER_QUALITY.metrics,{draws:GAME_WATER_QUALITY.metrics.draws+1,width:w,height:h});
   ctx.save();ctx.imageSmoothingEnabled=false;nativeDrawImage.call(ctx,surface,x0,y0,x1-x0,y1-y0);ctx.restore();cv.dataset.water='webgl';
  }catch(error){ready=false;land?.chunks?.clear();cv.dataset.water='fallback';console.warn('Wasser-Fallback',error);originalOcean(ctx,x0,y0,x1,y1);}
 };
 // Die alten transparenten Flachwasserkacheln würden den Tiefenverlauf verdecken.
 const oldChunk=terrainChunk;
 terrainChunk=function(x,y){const key=x+':'+y,exists=land.chunks.has(key),image=oldChunk(x,y);if(ready&&enabled&&!exists){const c=image.getContext('2d');
  for(let j=0;j<image.height/16;j++)for(let i=0;i<image.width/16;i++){
   const wx=x*LAND_CHUNK+i,wy=y*LAND_CHUNK+j,k=wy*MAPW+wx,t=G.tiles[k];
   if(t<=T.SHAL){c.clearRect(i*16,j*16,16,16);continue;}
   // Drei Pixel Übergang statt einer schwarzen, vollständig deckenden Abrisskante.
   if(t!==T.SAND&&t!==T.ROCK&&t!==T.ORE)continue;
   c.save();c.globalCompositeOperation='destination-out';
   for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
    if(!INMAP(wx+dx,wy+dy)||G.tiles[(wy+dy)*MAPW+wx+dx]>T.SHAL)continue;
    for(let a=0;a<16;a++)for(let d=0;d<3;d++){
     const px=i*16+(dx?dx>0?15-d:d:a),py=j*16+(dy?dy>0?15-d:d:a);
     c.globalAlpha=[.76,.44,.17][d]*(.8+hs(wx*16+a,wy*16,41)*.2);c.fillRect(px,py,1,1);
    }
   }c.restore();
  }
 }return image;};
 drawBeachSurf=function(ctx,tx0,ty0,tx1,ty1){
  if(!ready||!enabled){originalSurf(ctx,tx0,ty0,tx1,ty1);return;}if(UI.z<.6)return;
  const time=waterTime(),brokenTick=Math.floor(time*.7)*.47,foamTick=Math.floor(time*.5);ctx.save();ctx.imageSmoothingEnabled=false;
  // A packet's phase is shared by every shoreline pixel that samples it.
  // Reuse only within this draw: time changes never require invalidation.
  const packets=new Map();
  function packetAt(group,salt){
   const key=group*8+salt+3;let packet=packets.get(key);if(packet)return packet;
   const seed=hs(group,salt,881),radius=14+seed*10,cycle=(time/(5.5+seed*6)+hs(group,salt,887)*7)%1,u=cycle<.42?cycle/.42:(1-cycle)/.58;
   packet={radius,cycle,smooth:u*u*(3-2*u),reach:hs(group,salt,889)};packets.set(key,packet);return packet;
  }
  for(let y=ty0;y<=ty1;y++)for(let x=tx0;x<=tx1;x++){
   const t=G.tiles[y*MAPW+x];if(t!==T.SAND&&t!==T.ROCK&&t!==T.ORE)continue;
   const stone=t!==T.SAND;
   for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
    if(!INMAP(x+dx,y+dy)||G.tiles[(y+dy)*MAPW+x+dx]>T.SHAL||G.river?.[(y+dy)*MAPW+x+dx])continue;
    for(let i=0;i<16;i++){
     const along=dx?y*16+i:x*16+i,segment=Math.floor(along/24),salt=dx+dy*3;let surge=0,phase=0,reach=0,packet=0;
     // Überlappende Einzelwellen mit eigenen Laufzeiten, Reichweiten und Startpunkten.
     // Radius is below24px: only the current and nearer adjacent packet can contribute.
     const firstGroup=along-segment*24<12?segment-1:segment;
     for(let group=firstGroup;group<=firstGroup+1;group++){
      const wave=packetAt(group,salt),weight=Math.max(0,1-Math.abs(along-(group+.5)*24)/wave.radius),energy=wave.smooth*Math.sqrt(weight);
      if(energy>surge){surge=energy;phase=wave.cycle;reach=(stone?2:7)+wave.reach*(stone?2:6);packet=weight;}
     }
     const boundaryX=x*16+(dx===1?16:dx===-1?0:i),boundaryY=y*16+(dy===1?16:dy===-1?0:i);
     const place=(distance,alpha,color)=>{const px=Math.floor(boundaryX+dx*distance),py=Math.floor(boundaryY+dy*distance),tx=Math.floor(px/16),ty=Math.floor(py/16);if(!INMAP(tx,ty)||G.occ?.[ty*MAPW+tx])return;if(distance<0&&!stone&&G.tiles[ty*MAPW+tx]!==T.SAND)return;ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.fillRect(px,py,1,1);};
     const irregular=hs(along,salt,617),front=Math.round(7-surge*(7+reach)+Math.sin(along*.27)*.5),envelope=Math.min(1,phase*7,(1-phase)*7)*Math.min(1,packet*2);
     // Feuchter Sand und ein flacher, blau durchscheinender Wasserfilm.
     const wet=stone?2:4;
     for(let d=-wet;d<=1;d++)place(d,(1-Math.abs(d)/(wet+2))*(stone?.1:.09),'#28536f');
     if(!stone&&front<0)for(let d=front;d<=0;d++){const fade=1-(d-front)/Math.max(1,-front+2);place(d,(.08+fade*.12)*envelope,'#79b7be');}
     // Schaumfront, abreißende Bläschen und zurückbleibender Schaumteppich.
     const broken=Math.max(0,Math.sin(along*.41+salt*3+brokenTick));
     if(irregular>.33&&broken>.24){place(front,(.58+irregular*.25)*envelope*(phase<.42?1:.62),'#dcebf0');if(irregular>.74)place(front+1,.32*envelope,'#bed9e7');}
     for(let d=front+2;d<front+6;d++)if(hs(along,d+foamTick,619)>.85)place(d,.28*(1-(d-front)/7)*envelope,'#bad6e5');
     // Einzelne Spritzer am Fels statt einer gleichförmigen weißen Umrandung.
     if(stone&&phase>=.5&&phase<=.875&&irregular>.81){const lift=Math.round(Math.sin((phase-.4)*Math.PI)*4);place(-1-lift,.8,'#e9f3f5');place(2+Math.round(irregular*3),.48,'#d2e7ef');}
    }
   }
  }ctx.restore();
 };
 if(options.has('wasser-vorschau')){
  const style=document.createElement('style');style.textContent='.water-compare{position:fixed;right:16px;top:88px;z-index:50;min-height:44px;min-width:44px;padding:10px 16px;background:#241b10;color:#ffedb3;border:2px solid #a78d50;font:600 14px/1.4 system-ui;cursor:pointer}.water-compare:focus-visible{outline:3px solid white;outline-offset:3px}@media(max-width:600px){.water-compare{top:120px;right:8px}}';document.head.append(style);
  const button=document.createElement('button');button.type='button';button.className='water-compare';button.textContent='Neues Wasser';button.setAttribute('aria-label','Neues Wasser zum Vergleich ein- oder ausschalten');button.setAttribute('aria-pressed','true');
  button.addEventListener('click',()=>{enabled=!enabled;land?.chunks?.clear();button.setAttribute('aria-pressed',String(enabled));button.textContent=enabled?'Neues Wasser':'Bisheriges Wasser';cv.dataset.water=enabled?'webgl':'classic';});document.body.append(button);
 }
})();
