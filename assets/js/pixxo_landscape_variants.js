/* Kleine, gecachte Pixelvarianten; reine Darstellung, keine neuen Ressourcen. */
const LANDSCAPE_CACHE=new Map();
const TREE_TONES=[[1,1,1],[.64,1.12,.60],[1.42,1.13,.55],[.65,.80,1.18],[1.16,1.27,.84],[.77,.83,.45],[.56,1.04,1.18],[1.65,.88,.55]];
const LANDSCAPE_TREE_NAMES=['tree0','tree1','tree_birch','tree_oak'];
function landscapeNewTree(name){
 // Die bestehenden Blätter und ihre Textur bleiben die Quelle, kein zweiter
 // Zeichenstil: native Pixel, gleiche Farbrampen und unvermischte Konturen.
 const source=landscapeClone('tree1'),low=document.createElement('canvas');low.width=source.width;low.height=Math.round(source.height*1.1);
 const c=low.getContext('2d');c.imageSmoothingEnabled=false;const w=low.width,h=low.height,birch=name==='tree_birch';
 const trunkW=Math.max(1,Math.round(w*(birch ? .12 : .20))),trunkX=Math.floor((w-trunkW)/2),trunkY=Math.floor(h*.52);
 c.fillStyle=birch?'#dedbc1':'#755235';c.fillRect(trunkX,trunkY,trunkW,h-trunkY-1);c.fillStyle=birch?'#8c8b76':'#493726';c.fillRect(trunkX+trunkW-1,trunkY,1,h-trunkY-1);
 if(birch){c.fillStyle='#615849';for(let y=trunkY+2;y<h-1;y+=3)c.fillRect(trunkX,y,Math.max(1,trunkW-1),1);}
 const image=source.getContext('2d').getImageData(0,0,source.width,source.height),foliage=document.createElement('canvas');foliage.width=source.width;foliage.height=source.height;
 for(let i=0;i<image.data.length;i+=4){const y=Math.floor(i/4/source.width);if(y>source.height*.72||image.data[i]>image.data[i+1]*1.15&&image.data[i]>image.data[i+2]*1.2)image.data[i+3]=0;}
 foliage.getContext('2d').putImageData(image,0,0);
 if(birch)nativeDrawImage.call(c,foliage,Math.round(w*.13),0,Math.round(w*.74),h-1);
 else{nativeDrawImage.call(c,foliage,0,Math.round(h*.10),w,source.height);nativeDrawImage.call(c,foliage,Math.round(w*.13),0,Math.round(w*.74),source.height);}
 return low;
}
function landscapeClone(name){
 const original=HD_CATALOG.get(name)?.pixelSource||SP[name],low=document.createElement('canvas');
 low.width=original.width;low.height=original.height;const c=low.getContext('2d');c.imageSmoothingEnabled=false;nativeDrawImage.call(c,original,0,0);return low;
}
function landscapeTreeSprite(x,y){
 const seed=WORLD?.rootSeed||G.seed,kind=hs(x,y,seed+499);
 const base=LANDSCAPE_TREE_NAMES[kind<.35?0:kind<.70?1:kind<.85?2:3];
 const tone=Math.min(7,Math.floor(hs(x*3+7,y*5-11,seed+503)*8)),key=base+'_tone'+tone;
 if(!LANDSCAPE_CACHE.has(key)){
  const low=base==='tree_birch'||base==='tree_oak'?landscapeNewTree(base):landscapeClone(base),c=low.getContext('2d'),image=c.getImageData(0,0,low.width,low.height),data=image.data;
  for(let i=0;i<data.length;i+=4)if(data[i+3]&&data[i+1]>data[i]*1.07&&data[i+1]>data[i+2]*1.07){
   for(let channel=0;channel<3;channel++)data[i+channel]=Math.min(255,Math.round(data[i+channel]*TREE_TONES[tone][channel]));
  }
  c.putImageData(image,0,0);publishPixel(key,low,SP[base]?.width||16,SP[base]?.height||22);LANDSCAPE_CACHE.set(key,SP[key]);
 }
 return LANDSCAPE_CACHE.get(key);
}
function landscapeGrassSprite(x,y,forest=false){
 const base='grass'+Math.floor(hs(x,y,77)*4),seed=WORLD?.rootSeed||G.seed;
 const flower=landscapeHasFlowers(x,y,forest,seed);
 const variant=flower?8+Math.floor(hs(x*3+17,y*5-13,seed+511)*4):Math.floor(hs(x*5-11,y*3+19,seed+513)*8),key=base+'_meadow'+variant;
 if(!LANDSCAPE_CACHE.has(key)){
  const low=landscapeClone(base),c=low.getContext('2d'),image=c.getImageData(0,0,low.width,low.height),data=image.data;
  const offset=[-5,-3,-1,0,1,3,4,6,0,1,-1,2][variant];
  for(let i=0;i<data.length;i+=4){data[i]=Math.max(0,Math.min(255,data[i]+offset));data[i+1]=Math.max(0,Math.min(255,data[i+1]+offset));}
  c.putImageData(image,0,0);
  // Blumeninseln bleiben in der Kachel; Waldboden bleibt ohne Blüten.
  const count=variant>=8?4:variant%3;
  for(let n=0;n<count;n++){
   const px=3+Math.floor(hs(n,variant,521)*(low.width-6)),py=4+Math.floor(hs(n,variant,523)*(low.height-7));
   c.fillStyle='#477c32';c.fillRect(px,py,1,2);c.fillStyle='#8aae55';c.fillRect(px+1,py+1,1,1);
   if(variant>=8){c.fillStyle=['#fff1c3','#ee8ec8','#b0cfff','#ffd453'][variant-8];c.fillRect(px-1,py-1,3,1);c.fillRect(px,py-2,1,3);c.fillStyle='#e99a32';c.fillRect(px,py-1,1,1);}
  }
  publishPixel(key,low,SP[base].width,SP[base].height);LANDSCAPE_CACHE.set(key,SP[key]);
 }
 return LANDSCAPE_CACHE.get(key);
}
function landscapeHasFlowers(x,y,forest=false,seed=WORLD?.rootSeed||G.seed){return !forest&&fbm(seed+509,x/9,y/9)>.51&&hs(x*3+5,y*7-3,seed+510)<.8;}
