/* Native artwork from the approved hanging-sign study. */
function nativeEstateHouseArt(tier,variant){
 const a=document.createElement('canvas');a.width=a.height=48;a._nightWindows=[];
 const {r,p}=civicPainter(a),edge='#3d3b30',noble=tier===4;
 const stone=noble?'#eee0b9':'#d8bb8a',shade=noble?'#c4b48e':'#b49369';
 const pane=(x,y,w=5,h=6)=>{r(x-1,y-1,w+2,h+2,edge);r(x,y,w,h,'#42657b');r(x,y,1,h,'#7da8b0');r(x+Math.floor(w/2),y,1,h,stone);r(x,y+Math.floor(h/2),w,1,stone);r(x-1,y+h,w+2,1,stone);a._nightWindows.push({x,y,w,h,cross:true});};
 p([[3,42],[13,41],[24,42],[41,41],[46,44],[42,47],[25,46],[14,47],[2,45]],'#708348');
 if(!noble){
  // Narrow merchant houses: warm brick, high roof ridges and street-facing gables.
  const brick=['#a25d46','#ae6b4b','#925746','#a6684e'][variant],roof=['#94513b','#a96140','#824a39','#a1583e'][variant];
  r(8,22,32,22,edge);r(9,23,30,19,brick);r(37,23,2,19,'#764536');
  for(let y=26;y<42;y+=4){r(9,y,28,1,'#bc8160');for(let x=11+(y%8?3:0);x<37;x+=7)r(x,y-3,1,3,'#bc8160');}
  if(variant===2){
   for(const x of [7,23]){p([[x-2,24],[x+8,5],[x+18,24]],edge);p([[x,22],[x+8,8],[x+16,22]],roof);}
  }else if(variant===3){
   p([[5,24],[13,7],[34,7],[43,24]],edge);p([[7,22],[14,9],[33,9],[41,22]],roof);
  }else{
   const peak=variant===1?19:24;p([[5,24],[peak,3],[43,24]],edge);p([[7,22],[peak,6],[41,22]],roof);
  }
  // Sparse tile bands retain the roof's silhouette at the native scale.
  for(let y=15;y<23;y+=4){const inset=variant===2?0:Math.max(2,Math.floor((23-y)*.7));r(9+inset,y,28-inset*2,1,'#c18157');}
  if(variant===0){r(20,12,8,11,brick);r(18,19,12,4,brick);r(21,9,6,3,stone);r(19,12,10,1,stone);pane(22,15,4,5);}
  if(variant===1){r(10,16,10,8,brick);p([[8,17],[15,9],[22,17]],edge);p([[10,16],[15,12],[20,16]],roof);pane(13,18,4,4);}
  if(variant===2){pane(13,17,4,4);pane(29,17,4,4);}
  if(variant===3){r(29,13,9,11,brick);p([[27,14],[33,6],[40,14]],edge);p([[29,13],[33,9],[38,13]],roof);pane(31,16,4,5);}
  r(7,23,34,2,stone);r(9,33,28,1,shade);pane(12,27,5,4);pane(30,27,5,4);pane(12,36,5,5);pane(30,36,5,5);
  const chimney=variant%2?27:12;r(chimney,5,3,9,'#764536');r(chimney-1,5,5,1,stone);a._homeChimneys=[{x:chimney+1,y:5}];
 }else{
  // Broad villas: pale plaster, slate hip roofs, pilasters and a formal entrance.
  const roof=['#526e82','#567b79','#626d83','#4b7187'][variant];
  r(4,17,40,27,edge);r(5,18,38,25,stone);r(40,18,3,25,shade);
  p([[2,18],[12,6],[36,6],[46,18]],edge);p([[4,16],[13,8],[35,8],[44,16]],roof);
  r(12,10,24,1,'#90a9af');r(8,14,32,1,'#90a9af');
  r(2,17,44,2,stone);r(4,19,40,1,shade);r(5,31,37,2,shade);r(5,31,37,1,'#fff0ce');
  for(const x of [6,39]){r(x,20,2,23,'#fff0ce');r(x-1,20,4,1,shade);r(x-1,42,4,1,shade);}
  pane(11,23,5,6);pane(32,23,5,6);pane(11,35,5,6);pane(32,35,5,6);
  if(variant===0){p([[16,19],[24,11],[32,19]],edge);p([[18,18],[24,14],[30,18]],stone);r(23,16,2,2,shade);}
  if(variant===1){r(19,21,10,10,shade);pane(21,22,5,7);r(17,30,14,2,edge);for(let x=18;x<30;x+=3)r(x,30,1,2,stone);r(18,32,12,1,stone);}
  if(variant===2){r(18,20,12,1,shade);pane(21,23,5,6);r(17,30,14,3,edge);for(let x=18;x<30;x+=3)r(x,30,1,3,stone);r(16,33,16,1,stone);}
  if(variant===3){for(const x of [11,31]){r(x-1,9,7,7,stone);p([[x-3,10],[x+2,5],[x+7,10]],edge);pane(x,11,4,4);}}
  for(const x of [19,28]){r(x,35,2,9,'#fff0ce');r(x-1,34,4,1,shade);}
  p([[18,35],[24,30],[31,35]],edge);p([[20,34],[24,32],[29,34]],stone);
  for(const x of [9,35]){r(x,6,3,6,shade);r(x-1,6,5,1,stone);}a._homeChimneys=[{x:10,y:6},{x:36,y:6}];
 }
 r(21,34,7,11,edge);r(22,35,5,9,noble?'#52656b':'#6c4933');r(23,35,1,8,noble?'#8eaaac':'#a57a50');r(26,40,1,1,'#edd083');
 r(19,44,11,1,'#d2c6a4');r(18,45,13,1,'#9e9c75');r(20,46,9,1,'#bcb891');
 for(const x of noble?[5,38]:[8,36]){r(x,44,4,3,shade);r(x-1,42,6,2,'#507c48');}
 return {low:a,w:48,h:48,meta:{tw:3,th:3,ex:0,hub:null,smoke:null}};
}
function nativeTownHouseArt(tier,variant=0){
 if(tier===3||tier===4)return nativeEstateHouseArt(tier,variant);
 const a=document.createElement('canvas');a.width=a.height=48;a._nightWindows=[];
 const {r,p,ln}=civicPainter(a),edge='#3d3b30',roof=['#3e7693','#507d76','#8e6651','#657183'][variant],left=tier===2?8:5,right=tier===2?39:43,top=tier===4?17:22,bottom=44;
 p([[3,41],[13,40],[23,41],[40,40],[46,44],[42,47],[24,46],[15,47],[2,45]],'#708348');r(20,44,9,3,'#bcb891');
 r(left,top,right-left,bottom-top,edge);r(left+1,top+1,right-left-2,bottom-top-3,tier===2?'#c6bc92':'#dfc99b');r(right-3,top+1,2,bottom-top-3,'#ae9062');r(left+1,top+1,right-left-3,1,'#efdab1');
 const peak=variant===1?left+9:variant===3?right-9:24;
 if(variant===2){p([[left-3,top],[left+4,5],[right-6,5],[right+3,top]],edge);p([[left-1,top-2],[left+5,7],[right-7,7],[right+1,top-2]],roof)}
 else {p([[left-3,top],[peak,3+variant],[right+3,top]],edge);p([[left-1,top-2],[peak,5+variant],[right+1,top-2]],roof)}
 for(let y=9;y<top-1;y+=3){const inset=Math.max(2,Math.floor((top-y)*.65));r(left+inset,y,Math.max(1,right-left-inset*2),1,variant===2?'#c0936d':'#7fa7ad');for(let x=left+inset+3;x<right-inset;x+=6)r(x,y+1,1,1,'#3b5362')}
 r(left-2,top-1,right-left+4,2,'#d5b171');
 const pane=(x,y,w=5,h=6)=>{r(x-1,y-1,w+2,h+2,edge);r(x,y,w,h,'#42657b');r(x,y,1,h,'#7da8b0');r(x+Math.floor(w/2),y,1,h,'#d1bb89');r(x,y+Math.floor(h/2),w,1,'#d1bb89');r(x-2,y+h,w+4,1,'#efdab1');a._nightWindows.push({x,y,w,h,cross:true})};
 const upper=top+5;pane(left+5,upper);pane(right-11,upper);
 if(tier>=3){r(left+1,top+13,right-left-2,2,'#b58d53');pane(left+5,35);pane(right-11,35)}
 if(tier===2){for(const x of [left+1,right-3])r(x,top+2,2,19,'#70553a');r(left+1,top+12,right-left-2,2,'#70553a');ln(left+3,top+2,left+10,top+10,'#70553a');ln(right-4,top+2,right-11,top+10,'#70553a')}
 if(variant===1){r(left+3,10,9,9,'#e5cfa0');p([[left+1,11],[left+7,5],[left+14,11]],edge);pane(left+5,12,4,4)}
 if(variant===3){r(right-13,10,9,9,'#e5cfa0');p([[right-15,11],[right-9,5],[right-2,11]],edge);pane(right-11,12,4,4)}
 if(variant===0&&tier>=3){r(18,9,12,10,'#e5cfa0');p([[16,10],[24,3],[32,10]],edge);pane(21,12,5,5)}
 if(variant===2&&tier>=3){for(const x of [left+2,right-6]){r(x,top+2,3,20,'#efdab1');r(x-1,top+3,5,1,'#b99a62')}r(18,30,12,1,'#edc787');r(19,31,10,3,edge);for(let x=20;x<29;x+=3)r(x,31,1,3,'#d8b76d')}
 r(21,33,7,12,edge);r(22,34,5,9,'#946737');r(23,34,1,9,'#bd965f');r(26,39,1,1,'#edd083');r(19,44,11,1,'#d2c6a4');r(18,45,13,1,'#9e9c75');r(20,46,9,1,'#bcb891');
 const chimney=variant%2?right-8:left+6;r(chimney,5,3,10,'#82623e');r(chimney-1,5,5,1,'#d1bc8b');a._homeChimneys=[{x:chimney+1,y:5}];
 for(const x of [left,right-5]){r(x,44,5,3,'#936b42');r(x-1,42,6,2,'#507c48');r(x+1,41,1,1,variant%2?'#e0a2a3':'#f0d380')}
 return {low:a,w:48,h:48,meta:{tw:3,th:3,ex:0,hub:null,smoke:null}};
}
const detailedRotatedSprite=rotatedSprite;
rotatedSprite=function(name,rotation=0){
 rotation=(rotation+4)%4;if(!rotation)return name;
 const source=HD_CATALOG.get(name)?.pixelSource;
 if(!source?._nightWindows)return detailedRotatedSprite(name,rotation);
 const key=name+'_rotation'+rotation;if(HD_CATALOG.get(key)?._nativeRotationSource===source)return key;
 const a=document.createElement('canvas');a.width=rotation%2?source.height:source.width;a.height=rotation%2?source.width:source.height;
 const c=a.getContext('2d');c.imageSmoothingEnabled=false;c.translate(a.width/2,a.height/2);c.rotate(rotation*Math.PI/2);nativeDrawImage.call(c,source,-source.width/2,-source.height/2);
 a._nightWindows=source._nightWindows.map(p=>rotation===1?{...p,x:source.height-p.y-p.h,y:p.x,w:p.h,h:p.w}:rotation===2?{...p,x:source.width-p.x-p.w,y:source.height-p.y-p.h}:{...p,x:p.y,y:source.width-p.x-p.w,w:p.h,h:p.w});
 a._homeChimneys=source._homeChimneys?.map(p=>rotation===1?{x:source.height-1-p.y,y:p.x}:rotation===2?{x:source.width-1-p.x,y:source.height-1-p.y}:{x:p.y,y:source.width-1-p.x});
 const original=SP[name],meta=SPB[name];publishPixel(key,a,rotation%2?original.height:original.width,rotation%2?original.width:original.height,{...meta,smoke:null,hub:null});HD_CATALOG.get(key)._nativeRotationSource=source;return key;
};
const detailedImportedBuilding=importedBuilding;
importedBuilding=function(type,...args){
 const art=detailedImportedBuilding(type,...args);if(type!=='markt')return art;
 const a=document.createElement('canvas');a.width=art.low.width;a.height=art.low.height;a._nightWindows=[];
 const {c,r,ln}=civicPainter(a);nativeDrawImage.call(c,art.low,0,0);const left=3,right=a.width-4,top=Math.round(a.height*.28),mid=Math.round(a.width/2);
 ln(left,top,mid,top+4,'#514333');ln(mid,top+4,right,top,'#514333');
 for(let x=left+3;x<right-2;x+=6){const y=top+Math.round((1-Math.abs(x-mid)/mid)*4);r(x,y,2,2,'#e6cc87');a._nightWindows.push({x,y,w:2,h:2});}
 return {...art,low:a};
};
for(let frame=0;frame<4;frame++){const art=importedBuilding('markt',1,frame);publishPixel(frame?'b_markt_work'+frame:'b_markt',art.low,art.w,art.h,art.meta);}
function nativeCommunityArt(frame=0){
 const a=document.createElement('canvas');a.width=64;a.height=76;a._nightWindows=[];
 const {r,p,ln}=civicPainter(a);p([[5,66],[17,63],[55,64],[61,70],[54,75],[7,74]],'#708348');
 r(8,30,48,36,'#493e30');r(9,31,46,33,'#dfc99b');r(51,31,4,33,'#ae9062');
 p([[5,31],[17,12],[44,12],[59,31]],'#34414a');p([[8,29],[18,14],[43,14],[56,29]],'#49817e');
 for(let y=17;y<29;y+=3){const inset=Math.max(1,Math.ceil((30-y)*.6));r(10+inset,y,44-inset*2,1,'#83a6a0');for(let x=13+inset;x<51-inset;x+=6)r(x,y+1,1,1,'#345364')}
 r(6,30,52,2,'#d1ac6a');r(10,46,44,2,'#70553a');for(const x of [10,23,39,52])r(x,32,2,31,'#70553a');ln(12,33,21,43,'#70553a');ln(50,33,41,43,'#70553a');
 for(const x of [15,43])for(const y of [36,52]){r(x-1,y-1,8,10,'#493e30');r(x,y,6,7,'#42657b');r(x+3,y,1,7,'#d1bb89');r(x,y+3,6,1,'#d1bb89');r(x-2,y+8,10,1,'#efdab1');a._nightWindows.push({x,y,w:6,h:7,cross:true})}
 r(27,49,11,18,'#493e30');r(28,50,9,15,'#946737');r(32,50,1,15,'#493e30');r(30,58,1,1,'#edd083');r(34,58,1,1,'#edd083');r(25,66,15,2,'#d2c6a4');r(23,68,19,2,'#9e9c75');r(22,70,21,2,'#bcb891');
 for(const x of [9,45]){r(x,70,10,2,'#b89a62');r(x+1,72,1,3,'#70553a');r(x+8,72,1,3,'#70553a')}
 r(48,10,3,11,'#82623e');r(47,10,5,1,'#d1bc8b');
 return {low:a,w:64,h:76,meta:{tw:4,th:4,ex:12,hub:null,smoke:null}};
}
function nativeGardenArt(frame=0){
 const a=document.createElement('canvas');a.width=a.height=48;a._nightWindows=[];const {r,ln}=civicPainter(a);
 for(let y=0;y<48;y++)for(let x=0;x<48;x++){const e=Math.min(x,y,47-x,47-y);if(e<3&&hs(x,y,401)>(e+1)/4)continue;r(x,y,1,1,hs(x,y,402)>.85?'#81a455':'#629348')}
 r(22,4,4,42,'#bcac7d');r(4,23,40,3,'#bcac7d');
 for(const x of [7,29])for(const y of [8,29]){r(x,y,12,12,'#60492e');for(let j=0;j<3;j++)for(let i=0;i<3;i++){r(x+2+i*3,y+2+j*3,2,2,'#83aa53');r(x+2+i*3,y+1+j*3,1,1,y===8?'#e1c46c':'#d698a8')}}
 for(const y of [3,43]){ln(3,y+1,44,y+1,'#755333');ln(3,y+4,44,y+4,'#a7804c');for(let x=3;x<=44;x+=6){if(y===43&&x>=20&&x<=27)continue;r(x,y,1,5,'#d2ae70')}}
 for(const x of [3,44]){ln(x,5,x,43,'#755333');ln(x+1,5,x+1,43,'#a7804c');for(let y=5;y<43;y+=6)r(x-1,y,3,1,'#d2ae70')}
 a.getContext('2d').clearRect(22,43,4,5);r(22,43,4,5,'#bcac7d');
 return {low:a,w:48,h:48,meta:{tw:3,th:3,ex:0,hub:null,smoke:null}};
}
function nativeAristocratIcon(){
 const a=document.createElement('canvas');a.width=a.height=16;const {r,p}=civicPainter(a),edge='#382e23';
 // Powdered hair and a cravat distinguish this portrait from the patrician's top hat.
 p([[6,1],[10,1],[12,3],[12,8],[10,10],[6,10],[4,8],[4,3]],edge);
 r(6,2,4,1,'#eee3c7');r(5,3,6,2,'#c4bdad');r(6,3,4,1,'#f3e9cf');
 r(6,5,4,4,'#d3af81');r(6,5,1,3,'#ecd0a0');r(9,6,1,1,edge);r(8,8,2,1,'#956949');
 for(const x of [4,10]){r(x,5,2,4,'#c4bdad');r(x,5,1,1,'#f3e9cf');r(x,7,1,1,'#f3e9cf');}
 p([[2,15],[3,12],[6,10],[10,10],[13,12],[14,15]],edge);
 p([[3,14],[4,12],[6,11],[8,14],[10,11],[12,12],[13,14]],'#774854');
 r(4,12,1,2,'#b78381');r(11,12,1,2,'#b78381');r(7,10,2,4,'#efe3c4');r(7,11,2,1,'#c4bdad');r(8,13,1,1,'#b8a486');return a;
}
  function nativeSignGood(id){
    const a=document.createElement('canvas');a.width=8;a.height=8;const {r,p,ln}=civicPainter(a);
    if(id==='kalk'||id==='zement'){
      r(2,0,4,1,'#382e23');r(3,1,2,1,'#b79b6a');p([[2,2],[6,2],[7,4],[7,7],[0,7],[0,4]],'#382e23');r(1,4,5,2,id==='kalk'?'#e5e1c9':'#9fa894');r(2,3,3,1,id==='kalk'?'#f0ead5':'#c4c7b1');r(3,4,2,2,'#6a7161');
    } else if(id==='beton'){
      p([[0,3],[4,0],[7,2],[7,5],[3,7],[0,5]],'#382e23');p([[1,3],[4,1],[6,2],[3,4]],'#c6c6b1');r(1,4,2,2,'#969d8c');r(4,4,2,2,'#727d72');
    } else {
      p([[0,2],[5,0],[7,5],[2,7]],'#382e23');p([[1,3],[4,1],[6,5],[3,6]],'#71a6ae');ln(2,3,4,2,'#d7ece0');r(3,4,1,1,'#d7ece0');
    }
    return a;
  }

function nativeFactoryArt(type,frame=0){
 const a=document.createElement('canvas');a.width=64;a.height=60;a._nightWindows=[];const id={zementwerk:'zement',betonwerk:'beton',glashuette:'glas',kalkbrennerei:'kalk'}[type];
    const {c,r,p,ln}=civicPainter(a);c.translate(-10,-8);
    c.clearRect(0,0,80,72);
    const E='#38382d',stone='#c5b68e',brick='#b38e64',timber='#705137';
    p([[12,58],[22,55],[59,56],[74,59],[76,63],[67,67],[18,67],[9,63]],'#65764b');
    p([[15,59],[23,58],[66,58],[73,61],[69,64],[16,64]],'#9b9373');
    for(const [x,y] of [[14,61],[19,65],[72,60],[65,65],[12,58]])r(x,y,2,1,'#819554');
    const masonry=(x,y,w,h,col=stone)=>{r(x,y,w,h,E);r(x+1,y+1,w-2,h-2,col);r(x+w-3,y+1,2,h-2,'#9d8966');for(let yy=y+5;yy<y+h-2;yy+=5){r(x+1,yy,w-4,1,'#ad9c78');for(let xx=x+3+((yy-y)%2)*3;xx<x+w-3;xx+=8)r(xx,yy-3,1,3,'#b4a17c')}r(x+1,y+1,w-3,1,'#e4d1a1');r(x,y+h-2,w,2,'#786b50')};
    const roof=(x,y,w,h,pal)=>{p([[x-2,y+h],[x+9,y],[x+w-9,y],[x+w+2,y+h]],E);p([[x,y+h-2],[x+10,y+2],[x+w-10,y+2],[x+w,y+h-2]],pal[0]);for(let yy=4;yy<h-2;yy+=3){let inset=Math.max(1,Math.ceil(10*(1-yy/h)));r(x+inset,y+yy,w-inset*2,1,pal[1]);for(let xx=x+inset+2+(yy%2)*2;xx<x+w-inset-1;xx+=6)r(xx,y+yy+1,1,2,pal[2])}r(x+9,y,w-18,1,pal[1]);r(x-1,y+h-1,w+2,2,'#d0ad6f');r(x-1,y+h+1,w+2,1,E)};
    const pane=(x,y)=>{r(x-1,y-1,8,10,E);r(x,y,6,7,'#375968');r(x,y,1,7,'#81a5a6');r(x+3,y,1,7,'#b8a376');r(x,y+3,6,1,'#b8a376');r(x-2,y+8,10,1,'#e4c894')};
    const door=(x,y)=>{r(x-1,y-1,9,15,E);r(x,y,7,12,'#8d683e');for(let xx=x+2;xx<x+7;xx+=2)r(xx,y+1,1,10,'#664a31');r(x,y,7,1,'#c2a06b');r(x+5,y+6,1,1,'#e8c77c');r(x-2,y+12,11,2,'#b9ab85');r(x-3,y+14,13,1,'#7c775b')};
    const barrel=(x,y)=>{r(x+1,y,6,10,E);r(x,y+2,8,6,E);r(x+1,y+1,6,8,'#9d7546');r(x+2,y+2,1,6,'#c0a06b');r(x+5,y+2,1,6,'#775333');r(x+1,y+3,6,1,'#545849');r(x+1,y+7,6,1,'#545849');r(x+2,y,4,1,'#d1b781')};
    const sack=(x,y,light)=>{r(x+2,y,4,2,E);p([[x+2,y+2],[x+6,y+2],[x+8,y+5],[x+8,y+9],[x,y+9],[x,y+5]],E);r(x+1,y+5,6,3,light);r(x+2,y+3,4,2,light);r(x+2,y+5,1,3,'#eee1b9');r(x+3,y+2,2,1,'#8a7246')};
    const chimney=(x,y,h)=>{masonry(x,y,7,h,brick);r(x-1,y-1,9,2,'#d6bd8f');r(x+1,y,5,1,'#594d3a')};
    if(id==='zement'){
      masonry(17,31,36,29);roof(15,14,40,17,['#52767b','#8aaba6','#34545e']);
      r(18,33,33,2,timber);for(const x of [18,33,49]){r(x,35,2,21,timber);r(x,35,1,20,'#a08654')}ln(20,35,30,43,timber);ln(47,35,38,43,timber);pane(23,37);door(36,44);
      for(const x of [54,64]){r(x,13,9,44,E);r(x+1,15,7,37,'#8b9688');r(x+2,15,2,36,'#bac5aa');r(x+7,16,1,36,'#657364');r(x+1,13,7,2,'#c3c8aa');for(const yy of [24,39,50])r(x+1,yy,7,1,'#5c6b5c');p([[x,52],[x+9,52],[x+6,57],[x+3,57]],'#657364');r(x+3,57,3,5,'#48534a')}
      r(51,27,2,28,'#c2b78d');for(let y=29;y<54;y+=3)r(51,y,3,1,'#5b5b48');r(56,60,17,2,'#716249');sack(19,53,'#b2b6a0');sack(27,54,'#a4ae98');
    }else if(id==='beton'){
      masonry(17,33,37,27);roof(15,17,42,16,['#55758a','#90a7ac','#365164']);pane(23,39);door(37,44);
      r(52,37,21,2,'#c6aa75');r(54,39,2,20,timber);r(69,39,2,20,timber);ln(56,40,66,49,'#987344');
      p([[53,29],[72,29],[70,40],[63,48],[57,43]],E);p([[55,31],[70,31],[68,40],[63,45],[59,41]],'#718b88');r(56,31,13,1,'#b9c3a5');r(56,33,2,5,'#9cafa0');r(64,44,3,8,'#546e6b');r(62,51,7,2,'#bcab81');
      r(58,25,12,3,'#837b61');r(59,24,10,1,'#c3b88e');r(64,20,2,6,timber);r(58,19,9,2,'#a08555');
      for(const [x,y] of [[19,54],[26,58],[62,58]]){p([[x,y+2],[x+7,y],[x+11,y+2],[x+11,y+6],[x+4,y+9],[x,y+6]],E);p([[x+1,y+2],[x+7,y+1],[x+9,y+2],[x+4,y+4]],'#c4c5ac');r(x+1,y+4,3,3,'#9ba38c');p([[x+5,y+4],[x+10,y+3],[x+10,y+6],[x+5,y+8]],'#738270')}
    }else if(id==='glas'){
      masonry(17,31,50,29,'#c9b48b');roof(15,12,54,19,['#548880','#8db0a2','#345d5a']);chimney(57,4,24);pane(23,37);door(35,44);
      masonry(49,40,17,20,brick);r(51,41,13,2,'#d6b17b');p([[53,48],[55,45],[60,45],[62,48],[62,58],[53,58]],E);r(54,49,7,8,'#784229');r(55,52,5,5,'#d99544');r(57,51,2,6,'#f0cf82');r(53,58,10,1,'#c1a174');
      r(19,53,11,10,E);r(20,54,9,8,'#538c97');ln(20,56,26,54,'#c5e0d4');ln(23,61,28,58,'#9dc6bc');r(25,55,1,5,'#77afb1');r(18,62,14,2,timber);r(18,58,1,5,'#b39665');r(30,57,1,6,'#b39665');barrel(66,53);
    }else{
      masonry(17,35,29,25);roof(15,19,34,16,['#8b6549','#bd9365','#624c37']);pane(22,40);door(33,45);
      p([[46,20],[49,17],[66,17],[70,21],[70,57],[66,60],[49,60],[46,56]],E);r(48,21,20,35,'#b8b194');r(49,21,3,33,'#dad0ac');r(64,21,3,35,'#8f9178');
      for(let yy=25;yy<54;yy+=5){r(48,yy,20,1,'#8f9178');for(let xx=50+(yy%2)*3;xx<66;xx+=7)r(xx,yy-3,1,3,'#a29f83')}
      r(45,19,26,3,'#7c785d');r(47,17,22,2,'#dbcea4');r(50,15,16,2,'#8a8465');r(52,14,12,1,'#dbcea4');r(54,10,8,4,'#666853');r(53,9,10,2,'#c5bd98');
      p([[53,48],[55,45],[61,45],[64,48],[64,59],[53,59]],E);r(55,49,7,8,'#574630');r(56,53,5,4,'#d2934b');r(57,54,2,3,'#eed39a');r(51,59,15,2,'#cabd95');sack(19,54,'#e2dfc9');sack(25,55,'#d2d0b9');
    }
    c.setTransform(1,0,0,1,0,0);a._nightWindows.push({x:13,y:id==='kalk'?32:id==='beton'?31:29,w:6,h:7,cross:true});
    const size=8;
    if(size){const board=size+4,x=0,y=30;r(7,24,2,10,E);r(x+2,24,7-x,2,E);ln(3,24,7,28,E);r(x+3,26,1,4,'#a99668');r(x+board-4,26,1,4,'#a99668');r(x,y,board,board,E);r(x+1,y+1,board-2,board-2,'#b4915e');r(x+2,y+2,board-4,board-4,'#e0c99b');r(x+1,y+1,board-2,1,'#f0d5a0');nativeDrawImage.call(c,nativeSignGood(id),x+2,y+2);r(x+1,y+board-2,board-2,1,'#876a44')}
 return {low:a,w:64,h:60,meta:{tw:B[type].w,th:B[type].h,ex:12,hub:null,smoke:null}};
}

const detailedHouseVariantSprite=houseVariantSprite;houseVariantSprite=function(b){if(b.tier<2)return detailedHouseVariantSprite(b);const variant=houseVariant(b),key='native_home_'+b.tier+'_variant'+variant;if(!SP[key]){const art=nativeTownHouseArt(b.tier,variant);publishPixel(key,art.low,art.w,art.h,art.meta);}return rotatedSprite(key,b.rotation||0);};
