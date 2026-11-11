/* World-space ground sampling. Images stay editable; cells and saves stay16px. */
const TERRAIN_MATERIALS=(()=>{
 const period=256,control=64,limit=4096,axis=Array.from({length:256},(_,p)=>{const v=(p+.5)/control-.5,i=Math.floor(v),f=v-i,t=f*f*(3-2*f);return{i0:(i+4)%4,i1:(i+5)%4,w0:1-t,w1:t};});
 let materials={},overlays=[],profiles=[],seed=0,flowerDensity=null,flowerField=()=>false,cache=new Map(),board=null,atlas=null,viewAtlas=null,revision='',blendWidth=9,materialRevision='',sampleCache=new Map(),rockPatches=new Map(),rockPixels=new Map(),surfaceRegions=null,surfacePixels=new Map(),surfaceFields=new Map(),surfaceOffsets={},meshStrength=1;
 let baseSourcePixels=new WeakMap();const baseSourceIds=new WeakMap();let baseSourceSerial=0;
 const mod=(v,n)=>(v%n+n)%n,hash=(x,y,s)=>{let h=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(s|0,2147483647);h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return(h>>>0)/4294967296;};
 function pixels(image){if(image.data)return{w:image.w||image.width,h:image.h||image.height,data:image.data};const c=image.getContext('2d');return{w:image.width,h:image.height,data:c.getImageData(0,0,image.width,image.height).data};}
 // Palette calibration is a cached material-lighting operation. Original
 // editable PNGs and their pixel positions remain unchanged.
 function calibratedRock(image,palette){
  const source=pixels(image),anchors=palette?.anchors;
  if(!anchors?.length)return source;
  const luminance=rgb=>rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
  const ordered=anchors.map(a=>({...a,l:luminance(a.from)})).sort((a,b)=>a.l-b.l),curve=[];
  for(let l=0;l<256;l++){
   let i=0;while(i<ordered.length-1&&l>ordered[i+1].l)i++;
   const a=ordered[i],b=ordered[Math.min(i+1,ordered.length-1)],t=Math.max(0,Math.min(1,(l-a.l)/(b.l-a.l||1)));
   curve.push([0,1,2].map(c=>(a.to[c]-a.from[c])*(1-t)+(b.to[c]-b.from[c])*t));
  }
  const data=new Uint8ClampedArray(source.data);
  for(let p=0;p<data.length;p+=4){
   const r=data[p],g=data[p+1],b=data[p+2],hi=Math.max(r,g,b),lo=Math.min(r,g,b),sat=hi?(hi-lo)/hi:0;
   if(sat>=.48||g>r*1.04&&g>b*1.15)continue; // Moss, ores and timber retain their colors.
   const t=Math.max(0,Math.min(1,(sat-.28)/.2)),weight=1-t*t*(3-2*t),delta=curve[Math.round(luminance([r,g,b]))];
   for(let c=0;c<3;c++)data[p+c]+=delta[c]*weight;
  }
  return{w:source.w,h:source.h,data};
 }
 function periodic(image,grass=false){const source=pixels(image),{w,h}=source;let data=source.data;if(grass){const clean=new Uint8ClampedArray(data);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const p=(y*w+x)*4;if(!(data[p+2]>data[p+1]*.72&&data[p]>data[p+1]*.75||data[p]>data[p+1]*1.035))continue;const rgb=[0,0,0];let count=0;for(let radius=1;radius<=3&&!count;radius++)for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){const q=(mod(y+dy,h)*w+mod(x+dx,w))*4;if(data[q+1]>data[q]*1.05&&data[q+1]>data[q+2]*1.4){for(let c=0;c<3;c++)rgb[c]+=data[q+c];count++;}}if(count)for(let c=0;c<3;c++)clean[p+c]=rgb[c]/count;}data=clean;}const out=new Uint8ClampedArray(data.length);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const wx=Math.sin(Math.PI*(x+.5)/w)**2,wy=Math.sin(Math.PI*(y+.5)/h)**2,p=(y*w+x)*4;for(let channel=0;channel<3;channel++){let value=0;for(let j=0;j<2;j++)for(let i=0;i<2;i++)value+=data[(mod(y+j*h/2,h)*w+mod(x+i*w/2,w))*4+channel]*(i?1-wx:wx)*(j?1-wy:wy);out[p+channel]=value;}out[p+3]=255;}return{w,h,data:out};}
 function configure(options){const nextMaterials=(options.materialsRevision||options.revision)+':'+JSON.stringify(options.rockPalette||null)+':'+JSON.stringify(options.surfaceRegions||null);if(options.revision===revision&&nextMaterials===materialRevision)return false;revision=options.revision;meshStrength=options.rockPalette?.meshStrength??1;surfaceRegions=options.surfaceRegions?{size:Math.max(32,options.surfaceRegions.size||192),blend:Math.max(1,options.surfaceRegions.blend||24),warp:Math.max(0,options.surfaceRegions.warp??48)}:null;surfacePixels.clear();surfaceFields.clear();surfaceOffsets={};atlas=null;viewAtlas=null;if(nextMaterials!==materialRevision){materialRevision=nextMaterials;materials={};for(const kind of ['grass','sand','rock','ore'])materials[kind]=(options[kind]||[]).map(image=>kind==='rock'||kind==='ore'?calibratedRock(image,options.rockPalette):periodic(image,kind==='grass'&&options.surfaceRegions?.cleanGrassFlowers!==false));sampleCache.clear();rockPatches.clear();rockPixels.clear();atlas=null;viewAtlas=null;}overlays=(options.flowers||[]).map(pixels);profiles=[];for(const image of options.edgeMasks||[]){const p=pixels(image),line=[],direction=image._terrainDirection||'n',rotation=({n:0,e:1,s:2,w:3,ne:0,se:1,sw:2,nw:3})[direction]||0,red=(x,y)=>{let xx=x,yy=y;if(rotation===1){xx=p.w-1-y;yy=x;}else if(rotation===2){xx=p.w-1-x;yy=p.h-1-y;}else if(rotation===3){xx=y;yy=p.h-1-x;}return p.data[(yy*p.w+xx)*4];};for(let x=0;x<p.w;x++){let y=0;while(y<p.h&&red(x,y)<128)y++;line.push(y);}const mean=line.reduce((a,b)=>a+b,0)/line.length,scale=Math.max(1,...line.map(v=>Math.abs(v-mean)));profiles.push(line.map(v=>(v-mean)/scale));}seed=options.seed||1;blendWidth=options.transitionWidth||9;flowerField=options.hasFlowers||(()=>false);flowerDensity=options.flowerDensity||null;baseSourcePixels=new WeakMap();cache.clear();board=null;return true;}
 const ready=()=>materials.grass?.length>=2&&materials.sand?.length>=1;
 function rawSample(kind,x,y,forest=false){const list=materials[kind]||[],count=list.length;if(!count)return[0,0,0,255];const wx=mod(x,period),wy=mod(y,period),ax=axis[wx],ay=axis[wy],rgb=[0,0,0,255];for(let j=0;j<2;j++)for(let i=0;i<2;i++){const cx=i?ax.i1:ax.i0,cy=j?ay.i1:ay.i0,texture=list[Math.floor(hash(cx,cy,seed+(kind==='sand'?73:kind==='rock'?79:kind==='ore'?83:71))*count)],weight=(i?ax.w1:ax.w0)*(j?ay.w1:ay.w0),ox=Math.floor(hash(cx,cy,seed+89)*2)*texture.w/2,oy=Math.floor(hash(cx,cy,seed+97)*2)*texture.h/2,p=(mod(y+oy,texture.h)*texture.w+mod(x+ox,texture.w))*4;for(let c=0;c<3;c++)rgb[c]+=texture.data[p+c]*weight;}return rgb;}
 function gridFor(kind){let grid=sampleCache.get(kind);if(!grid){grid=new Uint8ClampedArray(period*period*4);for(let yy=0;yy<period;yy++)for(let xx=0;xx<period;xx++)grid.set(rawSample(kind,xx,yy),(yy*period+xx)*4);sampleCache.set(kind,grid);}return grid;}
 // Connected variant regions use coarse seeded domain warping. Expensive noise
 // is evaluated at shared world-tile corners, then interpolated per pixel.
 // Texture phase depends only on world position and variant, never region/chunk.
 function regionNoise(x,y,s){const ix=Math.floor(x),iy=Math.floor(y),fx=smooth(x-ix),fy=smooth(y-iy),a=hash(ix,iy,s),b=hash(ix+1,iy,s),c=hash(ix,iy+1,s),d=hash(ix+1,iy+1,s);return a+(b-a)*fx+(c-a)*fy+(a-b-c+d)*fx*fy;}
 function surfaceField(x,y){const key=x+':'+y;let field=surfaceFields.get(key);if(field)return field;const {size,warp}=surfaceRegions,scale=size*2;field=[];for(let j=0;j<2;j++)for(let i=0;i<2;i++){const wx=(x+i)*16,wy=(y+j)*16;field.push([(regionNoise(wx/scale,wy/scale,seed+211)-.5)*warp*2,(regionNoise(wx/scale,wy/scale,seed+223)-.5)*warp*2]);}surfaceFields.set(key,field);if(surfaceFields.size>limit)surfaceFields.delete(surfaceFields.keys().next().value);return field;}
 function regionAxis(v){const {size,blend}=surfaceRegions,half=Math.min(size/2,blend/2),cell=Math.floor(v/size),local=v-cell*size;if(local<half){const t=smooth((local+half)/(half*2));return[[cell-1,1-t],[cell,t]];}if(local>size-half){const t=smooth((local-size+half)/(half*2));return[[cell,1-t],[cell+1,t]];}return[[cell,1]];}
 function writeSurfacePixel(kind,x,y,px,py,corners,data,p){
  const list=materials[kind]||[],count=list.length;if(!count){data[p+3]=255;return;}
  const offsets=surfaceOffsets[kind]||(surfaceOffsets[kind]=list.map((texture,i)=>[Math.floor(hash(i,0,seed+229)*2)*texture.w/2,Math.floor(hash(i,0,seed+233)*2)*texture.h/2]));
  const fx=px/16,fy=py/16,wx=x*16+px,wy=y*16+py,warpAt=c=>corners[0][c]*(1-fx)*(1-fy)+corners[1][c]*fx*(1-fy)+corners[2][c]*(1-fx)*fy+corners[3][c]*fx*fy,ax=regionAxis(wx+warpAt(0)),ay=regionAxis(wy+warpAt(1));let red=0,green=0,blue=0;
  for(const [cy,vy]of ay)for(const [cx,vx]of ax){const index=Math.floor(hash(cx,cy,seed+(kind==='sand'?239:241))*count),texture=list[index],[ox,oy]=offsets[index],q=(mod(wy+oy,texture.h)*texture.w+mod(wx+ox,texture.w))*4,weight=vx*vy;red+=texture.data[q]*weight;green+=texture.data[q+1]*weight;blue+=texture.data[q+2]*weight;}
  data[p]=red;data[p+1]=green;data[p+2]=blue;data[p+3]=255;
 }
 function surfaceTilePixels(kind,x,y){
  const key=kind+':'+x+':'+y;let data=surfacePixels.get(key);if(data)return data;
  data=new Uint8ClampedArray(1024);const list=materials[kind]||[],corners=list.length===1?null:surfaceField(x,y);let cell=null,pure=list.length===1;
  // Most tiles lie wholly inside one region. Bilinear warp extrema are at
  // the four corners, so their agreement proves every pixel is unmixed.
  if(corners){pure=true;for(let i=0;i<4;i++){const ax=regionAxis(x*16+(i%2)*16+corners[i][0]),ay=regionAxis(y*16+Math.floor(i/2)*16+corners[i][1]);if(ax.length!==1||ay.length!==1||cell&&(cell[0]!==ax[0][0]||cell[1]!==ay[0][0])){pure=false;break;}cell=[ax[0][0],ay[0][0]];}}
  if(pure&&list.length){
   const index=cell?Math.floor(hash(cell[0],cell[1],seed+(kind==='sand'?239:241))*list.length):0,texture=list[index],offsets=surfaceOffsets[kind]||(surfaceOffsets[kind]=list.map((t,i)=>[Math.floor(hash(i,0,seed+229)*2)*t.w/2,Math.floor(hash(i,0,seed+233)*2)*t.h/2])),[ox,oy]=offsets[index];
   for(let py=0;py<16;py++){const row=mod(y*16+py+oy,texture.h)*texture.w;let at=0;while(at<16){const left=mod(x*16+at+ox,texture.w),run=Math.min(16-at,texture.w-left);data.set(texture.data.subarray((row+left)*4,(row+left+run)*4),py*64+at*4);at+=run;}}
  }else for(let py=0;py<16;py++)for(let px=0;px<16;px++)writeSurfacePixel(kind,x,y,px,py,corners,data,(py*16+px)*4);
  surfacePixels.set(key,data);if(surfacePixels.size>limit)surfacePixels.delete(surfacePixels.keys().next().value);return data;
 }
 function surfaceSample(kind,x,y){const data=surfaceTilePixels(kind,Math.floor(x/16),Math.floor(y/16)),p=(mod(y,16)*16+mod(x,16))*4;return[data[p],data[p+1],data[p+2],255];}
 // Rock keeps the original angular faces. Only the two pixels adjoining a
 // world-cell seam mix with its neighbour; patch interiors are source pixels.
 function rockPatch(kind,x,y){const key=kind+':'+x+':'+y;let patch=rockPatches.get(key);if(!patch){const list=materials[kind]||[];if(!list.length)return null;const texture=list[Math.floor(hash(x,y,seed+(kind==='ore'?83:79))*list.length)];patch={texture,ox:Math.floor(hash(x,y,seed+89)*texture.w),oy:Math.floor(hash(x,y,seed+97)*texture.h)};patch.rows=Array.from({length:16},(_,p)=>mod(p+patch.oy,texture.h)*texture.w*4);patch.columns=Array.from({length:16},(_,p)=>mod(p+patch.ox,texture.w)*4);rockPatches.set(key,patch);if(rockPatches.size>limit)rockPatches.delete(rockPatches.keys().next().value);}return patch;}
 function rockAxis(value){const cell=Math.floor(value/16),local=mod(value,16),distance=local<2?local+.5:local>=14?15.5-local:2;if(distance>=2)return[[cell,1]];const f=(2-distance)/4,weight=f*f*(3-2*f);return[[cell,1-weight],[cell+(local<2?-1:1),weight]];}
 // View-atlas coordinates are integer world pixels. Reuse their 16 fixed
 // edge weights and the patch's precomputed row/column offsets; keep the
 // original floating-point accumulation order before byte quantization.
 function sourceRockSample(kind,x,y){const rgb=[0,0,0,255],px=mod(x,16),py=mod(y,16),cellX=Math.floor(x/16),cellY=Math.floor(y/16);for(const [dy,wy]of rockAxes[py])for(const [dx,wx]of rockAxes[px]){const patch=rockPatch(kind,cellX+dx,cellY+dy);if(!patch)continue;const {texture,ox,oy}=patch,p=texture.w===16&&texture.h===16?patch.rows[py]+patch.columns[px]:(mod(py-dy*16+oy,texture.h)*texture.w+mod(px-dx*16+ox,texture.w))*4;for(let c=0;c<3;c++)rgb[c]+=texture.data[p+c]*wx*wy;}return rgb;}
 const rockAxes=Array.from({length:16},(_,v)=>rockAxis(v));
 function rockTilePixels(kind,x,y){const key=kind+':'+x+':'+y;let data=rockPixels.get(key);if(!data){data=new Uint8ClampedArray(1024);const patches=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)patches.push(rockPatch(kind,x+dx,y+dy));for(let py=0;py<16;py++)for(let px=0;px<16;px++){const out=(py*16+px)*4,rgb=[0,0,0];for(const [dy,wy]of rockAxes[py])for(const [dx,wx]of rockAxes[px]){const patch=patches[(dy+1)*3+dx+1];if(!patch)continue;const {texture,ox,oy}=patch,p=texture.w===16&&texture.h===16?patch.rows[py]+patch.columns[px]:(mod(py-dy*16+oy,texture.h)*texture.w+mod(px-dx*16+ox,texture.w))*4;for(let c=0;c<3;c++)rgb[c]+=texture.data[p+c]*wx*wy;}for(let c=0;c<3;c++)data[out+c]=rgb[c];data[out+3]=255;}rockPixels.set(key,data);if(rockPixels.size>limit)rockPixels.delete(rockPixels.keys().next().value);}return data;}
 function rockSample(kind,x,y){const data=rockTilePixels(kind,Math.floor(x/16),Math.floor(y/16)),p=(mod(y,16)*16+mod(x,16))*4;return[data[p],data[p+1],data[p+2],255];}
 function sample(kind,x,y){if(kind==='rock'||kind==='ore')return rockSample(kind,Math.floor(x),Math.floor(y));if(surfaceRegions&&(kind==='grass'||kind==='sand'))return surfaceSample(kind,Math.floor(x),Math.floor(y));const grid=gridFor(kind),p=(mod(y,period)*period+mod(x,period))*4;return[grid[p],grid[p+1],grid[p+2],255];}
 const smooth=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);};
 function edgeWidth(wx,wy,dx,dy){const index=dy<0?(dx<0?7:dx>0?4:0):dy>0?(dx<0?6:dx>0?5:2):dx>0?1:3,profile=profiles[index]||profiles[0],irregular=profile?profile[mod(wx+wy,profile.length)]:(hash(Math.floor(wx/3),Math.floor(wy/3),seed+101)-.5)*2;return blendWidth+irregular*1.5;}
 // Tile adjacency is constant for all 256 pixels. Preserve the original
 // dy/dx order while testing map boundaries and material only once per tile.
 function sandNeighbors(x,y,tiles,w,h,sandType){const neighbors=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy||x+dx<0||y+dy<0||x+dx>=w||y+dy>=h||tiles[(y+dy)*w+x+dx]!==sandType)continue;neighbors.push([dx,dy,sandDistances[(dy+1)*3+dx+1]]);}return neighbors;}
 // These distances depend only on the local pixel and direction, never on
 // world state. Store the original Math.hypot result at full precision.
 const sandDistances=Array.from({length:9},(_,direction)=>{const dx=direction%3-1,dy=Math.floor(direction/3)-1;return Float64Array.from({length:256},(_,p)=>{const px=p%16,py=Math.floor(p/16);return Math.hypot(dx<0?px+.5:dx>0?15.5-px:0,dy<0?py+.5:dy>0?15.5-py:0);});});
 function sandAmount(x,y,px,py,neighbors){let alpha=0;const p=py*16+px;for(const [dx,dy,distances]of neighbors){const distance=distances[p],width=edgeWidth(x*16+px,y*16+py,dx,dy);alpha=Math.max(alpha,1-smooth(distance/width));}return alpha;}
 function tilePixels(x,y,type,map,types,base=null){
  if(!ready())return null;const kind=type===types.SAND?'sand':type===types.ROCK?'rock':type===types.ORE?'ore':type===types.GRASS||type===types.FOREST?'grass':null;if(!kind||!materials[kind]?.length)return null;
  const forest=type===types.FOREST,density=type===types.GRASS&&flowerDensity?[flowerDensity(x,y,false,seed),flowerDensity(x+1,y,false,seed),flowerDensity(x,y+1,false,seed),flowerDensity(x+1,y+1,false,seed)]:null,flowers=type===types.GRASS&&(density?density.some(v=>v>0):flowerField(x,y,false,seed)),data=new Uint8ClampedArray(1024),neighbors=kind==='grass'?sandNeighbors(x,y,map.tiles,map.width,map.height,types.SAND):null,needsSand=!!neighbors?.length,overlay=flowers&&overlays.length?overlays[Math.floor(hash(Math.floor(x/2),Math.floor(y/2),seed+109)*overlays.length)]:null,grid=base&&kind==='grass'||kind==='rock'||kind==='ore'||surfaceRegions?null:gridFor(kind),sandGrid=needsSand&&!surfaceRegions?gridFor('sand'):null,sandSurface=needsSand&&surfaceRegions?surfaceTilePixels('sand',x,y):null,left=mod(x*16,period),top=mod(y*16,period);
  if(base&&kind==='grass'){let legacy=baseSourcePixels.get(base);if(!legacy){legacy=pixels(base);baseSourcePixels.set(base,legacy);}for(let py=0;py<16;py++)for(let px=0;px<16;px++){const p=(py*16+px)*4,q=(Math.floor(py*legacy.h/16)*legacy.w+Math.floor(px*legacy.w/16))*4;for(let c=0;c<4;c++)data[p+c]=legacy.data[q+c];}}
  else if(!grid)data.set(surfaceRegions&&(kind==='grass'||kind==='sand')?surfaceTilePixels(kind,x,y):rockTilePixels(kind,x,y));else for(let py=0;py<16;py++){const start=((top+py)*period+left)*4;data.set(grid.subarray(start,start+64),py*64);}
  if(needsSand||overlay)for(let py=0;py<16;py++)for(let px=0;px<16;px++){
   const wx=x*16+px,wy=y*16+py,p=(py*16+px)*4,sand=needsSand?sandAmount(x,y,px,py,neighbors):0,q=overlay?(mod(wy,overlay.h)*overlay.w+mod(wx,overlay.w))*4:0,alpha=overlay?overlay.data[q+3]/255*(1-sand)*(density?(density[0]*(1-px/16)*(1-py/16)+density[1]*(px/16)*(1-py/16)+density[2]*(1-px/16)*(py/16)+density[3]*(px/16)*(py/16)):1):0;if(!sand&&!alpha)continue;
   if(sand){const other=sandSurface?p:(mod(wy,period)*period+mod(wx,period))*4,source=sandSurface||sandGrid;for(let c=0;c<3;c++)data[p+c]=data[p+c]*(1-sand)+source[other+c]*sand;}
   if(alpha)for(let c=0;c<3;c++)data[p+c]=data[p+c]*(1-alpha)+overlay.data[q+c]*alpha;
  }
  return{w:16,h:16,data,type,flowers,forest};
 }
 function canvasFrom(data){const canvas=document.createElement('canvas');canvas.width=data.w;canvas.height=data.h;const ctx=canvas.getContext('2d'),image=ctx.createImageData(data.w,data.h);image.data.set(data.data);ctx.putImageData(image,0,0);canvas._terrainPixels=data;return canvas;}
 // Separate closure: an exported lazy view must not retain sampling scratch rows.
 function lazyAtlas(pixels,view){let image=null;return{...view,pixels,get image(){return image||(image=canvasFrom(pixels));}};}
 function tile(x,y,type,map,types,base=null){if(board!==map.tiles){board=map.tiles;cache.clear();}let neighbors='';for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)neighbors+=x+dx<0||y+dy<0||x+dx>=map.width||y+dy>=map.height?'x':map.tiles[(y+dy)*map.width+x+dx];if(base&&!baseSourceIds.has(base))baseSourceIds.set(base,++baseSourceSerial);const key=x+':'+y+':'+type+':'+neighbors+':'+(base?baseSourceIds.get(base):0);if(cache.has(key)){const result=cache.get(key);cache.delete(key);cache.set(key,result);return result;}const data=tilePixels(x,y,type,map,types,base);if(!data)return null;const result=canvasFrom(data);cache.set(key,result);if(cache.size>limit)cache.delete(cache.keys().next().value);return result;}
 function terrainAtlas(){if(!ready())return null;if(atlas)return atlas;const data=new Uint8ClampedArray(512*256*4),sand=surfaceRegions?new Uint8ClampedArray(period*period*4):gridFor('sand'),rock=new Uint8ClampedArray(period*period*4);for(let y=0;y<period;y++)for(let x=0;x<period;x++){rock.set(rockSample('rock',x,y),(y*period+x)*4);if(surfaceRegions)sand.set(surfaceSample('sand',x,y),(y*period+x)*4);}for(let y=0;y<256;y++){data.set(sand.subarray(y*1024,(y+1)*1024),y*2048);data.set(rock.subarray(y*1024,(y+1)*1024),y*2048+1024);}atlas=canvasFrom({w:512,h:256,data});return atlas;}

 // One bounded view atlas, with an integer sample stride only beyond its
 // native-pixel capacity. Margin and aligned origins avoid uploads each pan.
 function terrainViewAtlas(x0,y0,x1,y1){
  if(!ready())return null;
  const margin=96,quantum=64,left=Math.floor((x0-margin)/quantum)*quantum,top=Math.floor((y0-margin)/quantum)*quantum,right=Math.ceil((x1+margin)/quantum)*quantum,bottom=Math.ceil((y1+margin)/quantum)*quantum,step=Math.max(1,Math.ceil(Math.max(x1-x0+margin*2,y1-y0+margin*2)/1024));
  if(viewAtlas&&viewAtlas.step===step&&x0-32>=viewAtlas.x&&y0-32>=viewAtlas.y&&x1+32<=viewAtlas.x+viewAtlas.w*step&&y1+32<=viewAtlas.y+viewAtlas.h*step)return viewAtlas;
  const w=Math.min(1024,Math.ceil((right-left)/step)),h=Math.min(1024,Math.ceil((bottom-top)/step)),data=new Uint8ClampedArray(w*2*h*4),sand=surfaceRegions?null:gridFor('sand'),old=viewAtlas,overlap=old&&old.step===step&&(left-old.x)%step===0&&(top-old.y)%step===0;
  // Distant samples repeatedly visit the same source patches. Prepare their
  // horizontal weights once and retain at most three neighbouring patch rows.
  const columns=step>1?Array.from({length:w},(_,x)=>{const wx=left+x*step,cx=Math.floor(wx/16),px=mod(wx,16);return rockAxes[px].map(([dx,weight])=>({cx:cx+dx,weight,local:px-dx*16,px}));}):null,rows=new Map();let sampledY=-1,verticalRows=null;
  const firstPatch=Math.floor(left/16)-1,lastPatch=Math.floor((left+(w-1)*step)/16)+1;
  function patchRow(cy){let row=rows.get(cy);if(!row){row=new Array(lastPatch-firstPatch+1);rows.set(cy,row);if(rows.size>3)rows.delete(rows.keys().next().value);}return row;}
  function writePreparedRock(x,y,offset){
   if(sampledY!==y){sampledY=y;const wy=top+y*step,cy=Math.floor(wy/16),py=mod(wy,16);verticalRows=rockAxes[py].map(([dy,weight])=>({patches:patchRow(cy+dy),cy:cy+dy,weight,local:py-dy*16,py}));}
   let red=0,green=0,blue=0;for(const vertical of verticalRows)for(const horizontal of columns[x]){const index=horizontal.cx-firstPatch;let patch=vertical.patches[index];if(patch===undefined)vertical.patches[index]=patch=rockPatch('rock',horizontal.cx,vertical.cy);if(!patch)continue;const {texture,ox,oy}=patch,p=texture.w===16&&texture.h===16?patch.rows[vertical.py]+patch.columns[horizontal.px]:(mod(vertical.local+oy,texture.h)*texture.w+mod(horizontal.local+ox,texture.w))*4,wx=horizontal.weight,wy=vertical.weight;red+=texture.data[p]*wx*wy;green+=texture.data[p+1]*wx*wy;blue+=texture.data[p+2]*wx*wy;}data[offset]=red;data[offset+1]=green;data[offset+2]=blue;data[offset+3]=255;
  }
  let sampledPixels=0,copiedPixels=0;
  function fill(y,start,end){
   sampledPixels+=end-start;
   const wy=top+y*step,cy=Math.floor(wy/16),ry=mod(wy,16),sy=mod(wy,period);
   for(let x=start;x<end;){const wx=left+x*step,a=(y*w*2+x)*4;
    if(step===1){const rx=mod(wx,16),sx=mod(wx,period),run=Math.min(end-x,16-rx),rock=rockTilePixels('rock',Math.floor(wx/16),cy),sp=surfaceRegions?(ry*16+rx)*4:(sy*period+sx)*4,rp=(ry*16+rx)*4,sandSource=surfaceRegions?surfaceTilePixels('sand',Math.floor(wx/16),cy):sand;data.set(sandSource.subarray(sp,sp+run*4),a);data.set(rock.subarray(rp,rp+run*4),a+w*4);x+=run;}
    else{if(surfaceRegions){const cx=Math.floor(wx/16);writeSurfacePixel('sand',cx,cy,mod(wx,16),ry,surfaceField(cx,cy),data,a);}else{const sp=(sy*period+mod(wx,period))*4;for(let c=0;c<4;c++)data[a+c]=sand[sp+c];}writePreparedRock(x,y,a+w*4);x++;}
   }
  }
  for(let y=0;y<h;y++){
   const oldY=overlap?(top-old.y)/step+y:-1,start=overlap?Math.max(0,(old.x-left)/step):0,end=overlap?Math.min(w,(old.x-left)/step+old.w):0;
   if(oldY>=0&&oldY<old.h&&end>start){const oldX=(left-old.x)/step+start,from=(oldY*old.w*2+oldX)*4,to=(y*w*2+start)*4,length=(end-start)*4,previous=old.pixels?.data||old.image._terrainPixels.data;data.set(previous.subarray(from,from+length),to);data.set(previous.subarray(from+old.w*4,from+old.w*4+length),to+w*4);copiedPixels+=end-start;fill(y,0,start);fill(y,end,w);}
   else fill(y,0,w);
  }
  // The production WebGL path consumes exact RGBA bytes directly.
  // Materialize a 2D canvas only for consumers that actually request one.
  viewAtlas=lazyAtlas({w:w*2,h,data},{x:left,y:top,w,h,step,sampledPixels,copiedPixels});return viewAtlas;
 }

 return{configure,ready,sample,tilePixels,tile,terrainAtlas,terrainViewAtlas,cacheSize:()=>cache.size,surfaceCacheSize:()=>surfacePixels.size,rockStyle:()=>meshStrength,revision:()=>revision};
})();
