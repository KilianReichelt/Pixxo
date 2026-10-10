/* Klassischer Pixellook: 32-Pixel-Zeichenraster und ursprüngliche Silhouetten. */
const PIXEL_BUILD_CACHE=new Map(),PIXEL_ROAD_CACHE=new Map(),PIXEL_ROAD_VARIANTS=8;
function publishPixel(name,low,w,h,meta){
 const a={canvas:low,ctx:low.getContext('2d'),w,h};
 const small=document.createElement('canvas');small.width=w;small.height=h;
 const c=small.getContext('2d');c.imageSmoothingEnabled=false;nativeDrawImage.call(c,low,0,0,w,h);
 HD_IMAGES.set(small,a.canvas);SP[name]=small;HD_CATALOG.set(name,{...a,small,pixelSource:low});delete urlC[name];if(meta)SPB[name]={...meta,W:w,H:h};return small;
}
function smallPixelSource(source,max=32){
 const low=document.createElement('canvas'),factor=Math.min(1,max/Math.max(source.width,source.height));
 low.width=Math.max(1,Math.round(source.width*factor));low.height=Math.max(1,Math.round(source.height*factor));
 const c=low.getContext('2d');c.imageSmoothingEnabled=false;nativeDrawImage.call(c,source,0,0,low.width,low.height);return low;
}
function pixelField(type){
 const low=document.createElement('canvas');low.width=type==='gehege'?22:32;low.height=32;const c=low.getContext('2d');
 c.fillStyle=type==='acker'?'#76603d':'#64863f';c.fillRect(0,0,low.width,32);
 if(type==='acker'){for(let y=2;y<32;y+=4){c.fillStyle='#504329';c.fillRect(0,y+2,32,1);for(let x=1;x<32;x+=3){c.fillStyle='#c0a751';c.fillRect(x,y,1,3);c.fillStyle='#e0c873';c.fillRect(x-1,y,3,1);}}}
 else if(type==='gehege'){c.fillStyle='#563c25';c.fillRect(1,1,20,1);c.fillRect(1,30,20,1);c.fillRect(1,1,1,30);c.fillRect(20,1,1,30);for(let y=1;y<32;y+=6){c.fillStyle='#c9a266';c.fillRect(1,y,2,3);c.fillRect(19,y,2,3);}for(const [x,y] of [[5,7],[12,16],[5,23]]){c.fillStyle='#453b31';c.fillRect(x,y+3,1,2);c.fillRect(x+4,y+3,1,2);c.fillStyle='#d8d7bb';c.fillRect(x,y,5,3);c.fillStyle='#f0e8cd';c.fillRect(x+1,y-1,3,2);c.fillStyle='#665847';c.fillRect(x+4,y,2,2);}}
 else for(let i=0;i<65;i++){const x=Math.floor(hs(i,1,4)*32),y=Math.floor(hs(i,2,4)*32);c.fillStyle=i%3?'#dfd6a3':'#b184a6';c.fillRect(x,y,1,1);}
 return low;
}
function classicBuilding(type,tier=1,frame=-1){
 const name=typeSprite(type,tier),base=BASE_BUILDING_ART[name]||BASE_BUILDING_ART[typeSprite(type)],d=B[type],key=[name,d.w,d.h,frame].join(':');
 if(PIXEL_BUILD_CACHE.has(key))return PIXEL_BUILD_CACHE.get(key);
 const work=LEGACY_WORLD_ART[name+'_work'+frame],source=frame>=0&&work?work:base?.image||HD_CATALOG.get(name).canvas;
 const low=d.kind==='field'?pixelField(type):smallPixelSource(source),c=low.getContext('2d'),p=c.getImageData(0,0,low.width,low.height),w=low.width,h=low.height;
 // Grundstücksecken stufig auflösen; Hauskonturen im oberen Bildteil erhalten.
 for(let y=Math.floor(h*.7);y<h;y++)for(let x=0;x<w;x++){
  const corner=(x<3||x>=w-3)&&y>=h-3,edge=Math.min(x,w-1-x,h-1-y);
  if(corner&&(x<2||x>=w-2||y===h-1))p.data[(y*w+x)*4+3]=0;
  else if(edge===0&&y>h*.84&&hs(x,y,type.length)<.35)p.data[(y*w+x)*4+3]=0;
 }
 c.putImageData(p,0,0);for(const [xx,yy] of [[0,0],[w-3,0],[0,h-3],[w-3,h-3]]){c.clearRect(xx,yy,1,1);c.clearRect(xx+2,yy,1,1);c.clearRect(xx,yy+2,1,1);}
 // Zusätzliche Einzelpixel für Fensterreflexe und Waren unterscheiden die Betriebe.
 if(LUXURY_CHAINS.some(chain=>chain.steps.some(step=>step[0]===type))){
  const good=LUXURY_CHAINS.find(chain=>chain.steps.some(step=>step[0]===type)).good,colors={honig:'#d2af58',most:'#a4b558',seife:'#d7cbbb',moebel:'#a37745',parfuem:'#b996bb',schmuck:'#e4c76c'};
  c.fillStyle='#453a2b';c.fillRect(w-7,h-6,5,4);c.fillStyle=colors[good];c.fillRect(w-6,h-5,3,2);c.fillStyle='#e6d7a5';c.fillRect(w-6,h-5,1,1);
 }
 const ex=Math.round((base?.meta.ex||16)*d.h/(BASE_GEOMETRY[type]?.h||d.h)),logicalW=d.w*16,logicalH=d.h*16+ex;
 const art={low,w:logicalW,h:logicalH,meta:{tw:d.w,th:d.h,ex,hub:null,smoke:null}};PIXEL_BUILD_CACHE.set(key,art);return art;
}
installNativeBuildings=function(){
 for(const type of Object.keys(B))for(const tier of type==='haus'?[1,2,3]:type==='kontor'?[1,2,3,4]:[1]){
  const a=classicBuilding(type,tier);publishPixel(typeSprite(type,tier),a.low,a.w,a.h,a.meta);
 }
 for(const name of Object.keys(SP))if(name.includes('_rotation')||name.includes('_work')){delete SP[name];delete SPB[name];HD_CATALOG.delete(name);}
 land?.chunks?.clear();
};
workshopSprite=function(b){
 const name=typeSprite(b.type,b.tier);if(!workshopRunning(b)||WORK_ART.reduced.matches)return rotatedSprite(name,b.rotation||0);
 const frame=Math.floor(G.time*4*Math.max(.15,b.eff)+b.id*3)%8,key=name+'_work'+frame;
 if(!HD_CATALOG.has(key)){const a=classicBuilding(b.type,b.tier,frame);publishPixel(key,a.low,a.w,a.h,a.meta);}return rotatedSprite(key,b.rotation||0);
};
/* Ursprüngliche Weltfarben und grobe Pixel verbinden Gebäude und Landschaft. */
for(const name of Object.keys(LEGACY_WORLD_ART)){
 if(!/^(grass|sand|rock|tree|water|ore|cart|stollen_|ship_)/.test(name))continue;
 const source=LEGACY_WORLD_ART[name],low=smallPixelSource(source);publishPixel(name,low,source.width,source.height);
}
pats.fill(null);
installNativeBuildings();
const ROAD_BAYER=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
function organicRoadSegments(mask,variant=0,stone=false){
 const amplitude=stone?0:(variant%4+1)*.22*(variant<4?1:-1),points=[],arms=[[8,0],[16,8],[8,16],[0,8]].filter((p,i)=>mask&(1<<i));
 const curve=(point)=>{let previous=null,total=0;for(let i=0;i<=32;i++){const t=i/32,p=point(t);if(previous){const length=Math.hypot(p[0]-previous[0],p[1]-previous[1]);points.push({a:previous,b:p,start:total,length});total+=length;}previous=p;}};
 if(mask===5||mask===10)curve(t=>{const u=16*t,bend=amplitude*Math.sin(2*Math.PI*t)*Math.sin(Math.PI*t)**2;return mask===5?[8+bend,u]:[u,8+bend];});
 else if(arms.length===2){const [a,b]=arms;curve(t=>{const u=1-t;return [u*u*a[0]+2*u*t*8+t*t*b[0],u*u*a[1]+2*u*t*8+t*t*b[1]];});}
 else for(const a of arms)curve(t=>[a[0]+(8-a[0])*t+(a[0]===8?amplitude*Math.sin(Math.PI*t)**2:0),a[1]+(8-a[1])*t+(a[1]===8?amplitude*Math.sin(Math.PI*t)**2:0)]);
 if(!points.length)points.push({a:[8,8],b:[8,8],start:0,length:0});return points;
}
function roadCoordinates(x,y,segments){
 let best={distance:Infinity,along:0,across:0,dx:1,dy:0};
 for(const s of segments){const dx=s.b[0]-s.a[0],dy=s.b[1]-s.a[1],n=dx*dx+dy*dy,t=n?clamp(((x-s.a[0])*dx+(y-s.a[1])*dy)/n,0,1):0,px=s.a[0]+dx*t,py=s.a[1]+dy*t,dist=Math.hypot(x-px,y-py);if(dist<best.distance){const l=Math.sqrt(n)||1;best={distance:dist,along:s.start+t*s.length,across:((x-px)*-dy+(y-py)*dx)/l,dx:dx/l,dy:dy/l};}}return best;
}
function makePixelRoad(mask,stone,variant=0){
 const low=document.createElement('canvas');low.width=low.height=32;const c=low.getContext('2d'),image=c.createImageData(32,32),segments=organicRoadSegments(mask,variant,stone);
 for(let y=0;y<32;y++)for(let x=0;x<32;x++){
  const px=(x+.5)/2,py=(y+.5)/2,q=roadCoordinates(px,py,segments);let dist=q.distance;
  // Identische Randprofile garantieren Übergänge unabhängig von der Variante.
  if(y<2&&(mask&1)||y>29&&(mask&4))dist=Math.abs(px-8);
  if(x<2&&(mask&8)||x>29&&(mask&2))dist=Math.abs(py-8);
  const inner=stone?4.25:3.4,outer=stone?4.8:5.6,coverage=clamp((outer-dist)/(outer-inner),0,1),threshold=(ROAD_BAYER[(y<2||y>29?0:y)%4][(x<2||x>29?0:x)%4]+.5)/16,p=(y*32+x)*4;
  if(coverage<=threshold)continue;
  let rgb;
  if(stone){
   // Längliche Steine folgen dem lokalen Tangentenverlauf, Reihen seinem Normalenvektor.
   if(y<2&&(mask&1)||y>29&&(mask&4)){q.along=py;q.across=8-px;}if(x<2&&(mask&8)||x>29&&(mask&2)){q.along=px;q.across=py-8;}const row=Math.floor((q.across+32)/2),along=((q.along+(row%2)*2)%4+4)%4,across=((q.across+32)%2+2)%2;
   const mortar=along<.4||across<.35,tone=mortar?91:128+(across<.7?14:0)+(hs(Math.floor(q.along/4),row,31)>.5?7:0);
   rgb=[tone,tone+2,tone+3];
   // Auf Kreuzungen liegt eine kleine Pflasterrosette statt abrupt wechselnder Streifen.
   if((mask===15||[7,11,13,14].includes(mask))&&Math.hypot(px-8,py-8)<2.2){const radius=Math.hypot(px-8,py-8),angle=Math.atan2(py-8,px-8),joint=radius%1.3<.3||Math.abs(Math.sin(angle*4))<.15,v=joint?91:141;rgb=[v,v+2,v+3];}
  }else{const boundary=x<2||x>29||y<2||y>29,v=hs(x<2||x>29?0:x,y<2||y>29?0:y,boundary?51:variant+51),shade=v<.18?-9:v>.82?6:0;rgb=[188+shade,155+shade,109+shade];}
  image.data.set([...rgb,255],p);
 }
 c.putImageData(image,0,0);const name=(stone?'stoneroad':'road')+mask+(variant?'_variant'+variant:'');return publishPixel(name,low,16,16);
}
for(let mask=0;mask<16;mask++){makePixelRoad(mask,true);for(let v=0;v<PIXEL_ROAD_VARIANTS;v++)makePixelRoad(mask,false,v);}
function pixelRoadSprite(mask,stone,x=0,y=0){const variant=stone?0:Math.floor(hs(x,y,1927)*PIXEL_ROAD_VARIANTS);return SP[(stone?'stoneroad':'road')+mask+(variant?'_variant'+variant:'')];}



/* Lagerwaren verwenden wieder die ursprünglichen Pixel-Icons. */
for(const good of GOODS){
 const original=LEGACY_WORLD_ART[good.id];if(!original)continue;
 publishPixel(good.id,original,original.width,original.height);
}

