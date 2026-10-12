/* Native 16 px/tile artwork. See SPRITE_STANDARDS.md before adding sprites. */
const NATIVE_ART_RULES=Object.freeze({tile:16,houseWidth:48,houseHeight:48,iconWidth:16,iconHeight:16});
const NATIVE_GOOD_IDS=['schnaps','haeute','leder','stiefel','wachs','docht','kerzen',...CIVIC_GOODS.map(g=>g[0])];
function nativeGoodArt(id){
 const a=document.createElement('canvas');a.width=16;a.height=16;const {r,p,ln}=civicPainter(a);
 const edge='#382e23',light='#f1d6a0';
 if(id==='schnaps'){r(6,0,4,2,edge);r(7,0,2,1,'#bf9a62');r(6,2,4,3,'#718863');p([[5,4],[10,4],[12,7],[12,13],[10,14],[4,14],[3,12],[3,7]],edge);r(4,7,7,6,'#4f7355');r(5,6,5,1,'#83a26d');r(4,8,1,4,'#a8bc84');r(6,8,4,4,'#deca93');r(7,9,2,2,'#7c633d');r(5,13,6,1,'#78946b');}
 else if(id==='haeute'){p([[2,1],[5,3],[8,1],[11,3],[14,1],[13,6],[15,9],[12,10],[13,14],[9,12],[6,14],[3,12],[0,14],[2,9],[0,6],[3,5]],edge);p([[3,3],[5,4],[8,3],[11,4],[12,3],[11,6],[13,8],[10,9],[11,12],[8,10],[6,12],[4,10],[2,11],[4,8],[2,6],[4,6]],'#c0a070');p([[6,4],[9,4],[10,7],[8,10],[5,8]],'#725337');r(4,5,2,1,'#e0bf8a');r(10,8,1,2,'#95724b');}
 else if(id==='leder'){p([[1,4],[11,1],[14,4],[14,11],[4,14],[1,11]],edge);p([[2,5],[11,2],[13,5],[4,8]],'#c18b55');p([[4,8],[13,5],[13,10],[4,13]],'#965e3a');r(2,6,2,5,'#6b402b');ln(5,9,11,7,'#d8aa70');ln(5,11,11,9,'#ad7a48');r(2,5,1,6,'#e0b984');r(11,3,1,2,'#74462e');}
 else if(id==='stiefel'){for(const [x,y] of [[1,1],[7,0]]){r(x,y,5,10,edge);r(x+1,y+1,3,7,'#8e6039');r(x+1,y+1,1,6,'#c89a62');r(x,y+1,5,1,'#dbbb81');r(x+1,y+8,6,3,'#805230');r(x+2,y+8,4,1,'#ad7c4b');r(x,y+11,8,2,edge);r(x+1,y+11,6,1,'#af9264');}}
 else if(id==='wachs'){p([[1,7],[6,3],[14,4],[15,10],[10,14],[2,13]],edge);p([[2,7],[6,4],[13,5],[9,9]],'#e5be5d');p([[2,8],[9,10],[9,13],[3,12]],'#bc873d');p([[10,10],[14,6],[14,10],[10,13]],'#d49f49');r(5,6,2,2,'#f4d780');r(9,5,3,1,'#f2d48a');r(4,9,1,2,'#dfae55');}
 else if(id==='docht'){r(2,11,12,2,edge);r(3,11,10,1,'#b99a64');for(const [x,y] of [[3,4],[7,2],[11,5]]){r(x,y,2,8,edge);r(x+1,y+1,1,6,'#e9d7a6');r(x,y-1,2,1,'#e9d7a6');}r(3,13,10,1,'#73573a');}
 else if(id==='kerzen'){r(1,12,14,2,edge);r(2,12,12,1,'#b89960');for(const [x,y] of [[3,6],[7,3],[11,7]]){r(x-1,y,4,12-y,edge);r(x,y,2,11-y,'#eedaa4');r(x+1,y+1,1,10-y,'#bfad7a');r(x,y-2,1,2,'#5d422a');r(x,y-3,1,2,'#f2a448');r(x,y-3,1,1,'#ffe4a1');r(x-1,y+3,1,2,'#ead49b');}}
 else if(['sand','kalk','zement'].includes(id)){const tones=id==='sand'?['#c6a267','#efcd8d','#987648']:id==='kalk'?['#d9d7c1','#f0ead5','#9fa694']:['#9a9e8d','#c4c7b1','#707769'];p([[4,1],[11,1],[10,4],[13,7],[14,12],[11,14],[3,14],[1,11],[3,6],[5,4]],edge);p([[5,2],[10,2],[8,4],[12,7],[12,12],[10,13],[4,13],[3,10],[4,7],[6,4]],tones[0]);r(5,4,5,1,'#826448');r(4,8,1,3,tones[1]);r(10,8,1,4,tones[2]);r(6,8,4,3,'#e9dec2');r(7,9,2,1,tones[2]);}
 else if(id==='beton'){p([[1,5],[8,1],[14,4],[14,10],[7,14],[1,11]],edge);p([[2,5],[8,2],[13,5],[7,8]],'#c6c6b1');p([[2,6],[6,9],[6,12],[2,10]],'#969d8c');p([[7,9],[13,6],[13,10],[7,13]],'#727d72');r(3,7,1,1,'#d6d3ba');r(9,9,2,1,'#a8ad98');r(8,4,1,1,'#ebdfc3');}
 else if(id==='glas'){p([[2,3],[12,0],[15,11],[5,14]],edge);p([[3,4],[11,2],[13,10],[6,12]],'#71a6ae');ln(4,5,10,3,'#d7ece0');ln(7,11,12,9,'#acd9d2');ln(5,6,9,9,'#a4d3cf');r(3,5,1,4,'#477a8d');}
 else if(id==='geschirr'){p([[1,8],[4,5],[12,5],[15,8],[12,13],[4,14],[1,11]],edge);p([[2,8],[5,6],[12,6],[13,8],[11,12],[4,12]],'#e2dcc2');ln(3,9,12,9,'#8cabad');r(6,2,5,6,'#eae2c7');r(6,2,5,1,'#78a1a1');r(11,3,3,1,'#e2dcc2');r(13,4,1,2,'#e2dcc2');r(11,6,3,1,'#b6c6b8');r(7,3,1,3,'#f2e9d0');}
 else if(id==='papier'||id==='buecher'){const book=id==='buecher';for(let i=0;i<3;i++){const x=1+i,y=10-i*4;p([[x,y],[x+9,y-2],[x+12,y+1],[x+3,y+4]],edge);r(x+3,y+2,9,1,'#e6dcc0');p([[x+1,y],[x+9,y-1],[x+11,y+1],[x+3,y+2]],book?['#a9724d','#628d83','#66839c'][i]:'#e9e0c4');if(book)r(x+4,y,4,1,'#dec17e');else ln(x+4,y,x+8,y-1,'#b7b49c');}}
 else if(id==='farbstoff'){r(4,0,8,2,edge);r(5,0,6,1,'#bb975e');r(6,2,4,3,'#a69169');p([[4,4],[11,4],[14,7],[14,12],[11,14],[3,14],[1,11],[2,7]],edge);r(3,7,9,6,'#885675');r(4,7,2,5,'#b38ca4');r(6,9,5,3,'#dfceb0');r(7,10,3,1,'#6c4266');r(11,8,1,4,'#633e59');}
 else if(id==='feine_kleidung'){p([[5,0],[10,0],[12,3],[15,5],[13,9],[11,8],[12,14],[3,14],[4,8],[2,9],[0,5],[3,3]],edge);p([[5,2],[10,2],[11,4],[13,5],[12,7],[10,6],[10,12],[5,12],[5,6],[3,7],[2,5],[4,4]],'#64829a');p([[5,1],[7,5],[10,1],[8,7],[7,7]],'#e0d4b5');r(7,7,1,6,'#34475b');for(const y of [7,9,11])r(8,y,1,1,'#e4c478');r(5,11,2,1,'#b7975c');r(9,11,2,1,'#b7975c');}
 return a;
}
function nativeCivicArt(type,frame=0,variant=0){
 if(['zementwerk','betonwerk','glashuette','kalkbrennerei'].includes(type))return nativeFactoryArt(type,frame);
 if(type==='gemeinschaftshaus')return nativeCommunityArt(frame);
 if(type==='garten')return nativeGardenArt(frame);
 if(type==='haus4')return nativeTownHouseArt(4,variant);
 const home=type==='haus4',d=home?B.haus:B[type],w=home?48:d.w*16,h=home?48:d.h*16+12,a=document.createElement('canvas');a.width=w;a.height=h;
 const {r,ln,p}=civicPainter(a),windows=[];a._nightWindows=windows;
 const pane=(x,y,ww=5,hh=6)=>{r(x-1,y-1,ww+2,hh+2,'#4a3b2d');r(x,y,ww,hh,'#42657b');r(x,y,1,hh,'#7da8b0');r(x+ww-1,y+hh-2,1,2,'#567f95');r(x-1,y+hh,ww+2,1,'#e6cfa0');windows.push({x,y,w:ww,h:hh});};
 const door=(x,y)=>{r(x-1,y-1,7,12,'#3e3026');r(x,y,5,10,'#946737');r(x+1,y,1,9,'#bd965f');r(x+4,y+6,1,1,'#edd083');r(x-2,y+10,9,2,'#bfac81');};
 const roof=(x,y,ww,hh,col='#3f6f88')=>{p([[x-2,y+hh],[x+ww/2,y],[x+ww+2,y+hh]],'#34414a');p([[x,y+hh-1],[x+ww/2,y+2],[x+ww,y+hh-1]],col);for(let j=4;j<hh;j+=3){const inset=Math.ceil(ww/2*(1-j/hh));r(x+inset,y+j,Math.max(1,ww-inset*2),1,'#7fa1a5');for(let i=x+inset+3;i<x+ww-inset;i+=6)r(i,y+j+1,1,1,'#345364');}r(x-1,y+hh,ww+2,2,'#d1ac6a');};
 const wall=(x,y,ww,hh,col='#d7c294')=>{r(x,y,ww,hh,'#5e5141');r(x+1,y+1,ww-2,hh-2,col);r(x+1,y+1,ww-2,1,'#efdab1');r(x+ww-3,y+2,2,hh-3,'#ae9062');r(x,y+hh-2,ww,2,'#938169');};
 const worker=(x,y)=>{r(x,y,2,2,'#d1ad7f');r(x,y+2,2,3,'#69818a');r(x+(frame%2),y+5,1,2,'#423729');};
 if(home){
  // Ground contact stays inside the 48 × 48 footprint. No rectangular slab:
  // an irregular lawn edge, earth and a narrow foundation shadow anchor it.
  p([[5,39],[13,40],[20,39],[29,40],[40,39],[45,42],[46,45],[42,47],[32,46],[24,47],[15,46],[6,47],[1,44],[3,41]],'#708348');
  for(let i=0;i<30;i++){const x=3+Math.floor(hs(i,7,91)*42),y=41+Math.floor(hs(i,8,91)*6);r(x,y,1,1,i%3?'#8d9858':'#586d3b');}
  r(6,43,36,3,'#4c5438');r(8,46,31,1,'#657741');
  const sx=5,sy=21,ww=38,bottom=44;
  wall(sx,sy,ww,bottom-sy,'#dfc99b');r(sx+1,sy+11,ww-2,2,'#b58d53');r(sx+1,sy+12,ww-2,1,'#ecd7a5');
  p([[2,22],[8,8],[15,3],[34,3],[41,8],[46,22]],'#303e49');p([[4,20],[10,9],[16,5],[33,5],[39,9],[44,20]],variant===1?'#507d76':variant===2?'#8e6651':'#3e7693');
  for(let y=8;y<20;y+=3){const inset=y<11?10:Math.max(2,Math.ceil((20-y)*.4));r(5+inset,y,38-inset*2,1,variant===2?'#c0936d':'#7fa7ad');for(let x=8+inset;x<42-inset;x+=6)r(x,y+1,1,1,'#3b5362');}
  r(3,21,42,2,'#e4c17f');r(16,3,18,1,'#bf9b60');
  for(const x of [10,31]){wall(x-1,12,8,9,'#e5cfa0');roof(x-2,7,10,5,'#4b7187');pane(x,14,5,5);}
  for(const x of [11,31]){pane(x,25);r(x-3,25,2,6,'#467768');r(x+6,25,2,6,'#467768');pane(x,35,5,6);}
  for(const x of [6,39]){r(x,24,2,18,'#f0dbb2');r(x-1,24,4,1,'#c4a063');}
  door(22,33);r(19,32,11,1,'#eddbb2');r(19,44,11,1,'#d2c6a4');r(18,45,13,1,'#9e9c75');r(20,46,9,1,'#bcb891');
  for(const x of [5,37]){r(x,44,6,3,'#936b42');r(x-1,42,7,2,'#507c48');r(x,41,1,1,'#d7a2a3');r(x+4,41,1,1,'#f0d380');}
  r(37,4,3,9,'#82623e');r(37,4,4,1,'#d1bc8b');
 }else if(type==='brunnen'){
  // One tile: roof, winch, dark water and a round stone curb remain legible.
  p([[1,23],[4,21],[12,21],[15,23],[13,27],[3,27]],'#58604e');
  r(3,24,10,2,'#b2ae8b');r(5,26,6,1,'#777c66');
  p([[2,20],[5,18],[11,18],[14,20],[12,23],[4,23]],'#c8c19a');
  p([[4,20],[6,19],[10,19],[12,20],[10,22],[6,22]],'#345b6b');
  r(5+(frame%2),20,5,1,'#72969c');
  r(2,10,2,12,'#65472e');r(2,10,1,11,'#b08b55');r(12,10,2,12,'#65472e');r(12,10,1,10,'#b08b55');
  r(4,12,8,2,'#c09d66');r(8,13,1,6,'#c9ba8a');r(7,17,3,3,'#8d7148');r(7,17,3,1,'#d3b780');
  p([[0,10],[3,4],[7,2],[9,2],[13,4],[16,10]],'#493a2b');
  p([[1,9],[4,5],[7,3],[9,3],[12,5],[15,9]],'#976d43');
  ln(4,5,12,5,'#c19a64');ln(2,8,14,8,'#725032');r(1,10,14,1,'#c6a372');
 }else if(type==='garten'){
  for(let j=0;j<3;j++)for(let i=0;i<3;i++){const x=4+i*13,y=17+j*11;r(x,y,11,7,'#60492e');for(let k=0;k<3;k++){r(x+2+k*3,y+2,1,4,'#729849');r(x+1+k*3,y+2,3,1,j%2?'#91b35c':'#d9b669');r(x+2+k*3,y+4,1,1,i%2?'#d08a9d':'#a9c467');}}for(let x=2;x<w-2;x+=7)r(x,h-10,1,7,'#bb965f');r(2,h-6,w-4,1,'#7e5b36');r(8,18,1,1,'#e8cca0');r(34,29,1,1,'#bc7895');worker(8+frame,h-20);
 }else{
  const community=type==='gemeinschaftshaus',tones={sandgrube:'#aa7647',kalkbrennerei:'#8b6549',zementwerk:'#52767b',betonwerk:'#55758a',glashuette:'#538d86',geschirrmanufaktur:'#83586f',papiermuehle:'#47767c',faerberei:'#81617d',druckerei:'#426b85',schneiderei:'#558778',gemeinschaftshaus:'#49817e'},roofCol=tones[type]||'#577787';
  const wing=community?10:Math.max(12,Math.round(w*.27)),mainW=w-wing-8,mainX=3,mainY=community?7:12,wallY=mainY+15;
  wall(mainX,wallY,mainW,h-wallY-8);roof(mainX,mainY,mainW,15,roofCol);
  wall(mainW+1,wallY+6,wing,h-wallY-14,'#bdac82');roof(mainW+1,wallY-3,wing,9,roofCol);
  for(let x=mainX+6;x<mainX+mainW-5;x+=12)pane(x,wallY+5);
  door(mainX+Math.floor(mainW/2)-2,h-20);pane(mainW+4,wallY+12,4,5);
  if(community){r(6,wallY+2,2,h-wallY-12,'#e9d4a8');r(mainW-2,wallY+2,2,h-wallY-12,'#e9d4a8');r(w-11,2,1,17,'#8a734b');r(w-10,4+(frame%2),7,3,'#9d634c');worker(7+frame,h-9);worker(w-12-frame,h-10);}
  else if(type==='sandgrube'){windows.length=0;a.getContext('2d').clearRect(0,0,w,h);p([[3,h-24],[12,h-35],[w-11,h-31],[w-3,h-14],[w-14,h-6],[8,h-8]],'#967448');p([[6,h-23],[14,h-30],[w-13,h-27],[w-7,h-15],[w-15,h-10],[11,h-11]],'#d6bc82');for(let i=0;i<28;i++)r(8+Math.floor(hs(i,3,73)*(w-20)),h-25+Math.floor(hs(i,4,73)*13),1,1,i%2?'#b69560':'#e7cd93');r(w-15,h-36,2,23,'#765532');r(w-27,h-36,15,2,'#c39c61');r(w-24,h-34,1,14+(frame%3),'#ded0a1');r(w-27,h-21+(frame%3),7,5,'#685032');ln(8,h-23,14,h-29,'#f0d9a3');ln(15,h-28,w-14,h-25,'#c6a970');ln(12,h-12,w-15,h-11,'#ad8953');for(const [x,y] of [[9,h-17],[w-15,h-12],[15,h-27]]){r(x,y,3,2,'#897d60');r(x,y,2,1,'#b8ae86');}r(6,h-21,1,7,'#443d31');r(5,h-15,3,3,'#7c8984');worker(10+frame,h-15);}
  else if(['kalkbrennerei','zementwerk','betonwerk','glashuette'].includes(type)){r(w-14,4,7,wallY+4,'#7a6b52');r(w-14,4,7,2,'#c8b489');for(let y=8;y<wallY;y+=4)r(w-13,y,5,1,'#ac9370');r(w-11,1+(frame%3),2,2,'#b2b3a1');r(w-9,2+(frame%3),2,2,'#c4c5b0');r(w-18,h-18,11,8,'#4b3b2c');r(w-16,h-16,7,4,frame%2?'#c98841':'#e1b064');r(w-15,h-15,3,2,'#f0d492');}
  else if(type==='papiermuehle'){const x=w-12,y=h-19;for(let i=0;i<8;i++){const angle=(i+frame/6)*Math.PI/4;ln(x,y,x+Math.cos(angle)*8,y+Math.sin(angle)*8,'#9d7543');}r(x-2,y-2,5,5,'#d8bf85');r(x-2,y-1,3,3,'#735333');}
  else if(type==='faerberei'){for(let i=0;i<3;i++){r(w-23+i*6,h-16,5,7,['#94718d','#6c9890','#b3995c'][i]);r(w-23+i*6,h-16,5,1,'#e1c99b');}r(w-25,h-20,22,1,'#6b4e32');}
  else if(type==='druckerei'){r(w-23,h-24,15,14,'#5b4530');r(w-22,h-23,2,12,'#c7a46c');r(w-11,h-23,2,12,'#c7a46c');r(w-20,h-18+(frame%3),10,2,'#424e4c');r(w-19,h-13,8,2,'#e8dec0');}
  else if(type==='schneiderei'){for(let i=0;i<3;i++){r(w-24+i*6,h-20,4,10,['#7695a6','#af8da0','#d6bc87'][i]);r(w-23+i*6,h-20,1,9,'#ead9ab');}r(w-25,h-23,22,1,'#6b5132');}
  else if(type==='geschirrmanufaktur'){for(let i=0;i<3;i++){r(w-22+i*6,h-11,5,2,'#e4d8b7');r(w-21+i*6,h-15,3,4,'#a8c0b9');}}
  if(!community&&type!=='sandgrube')worker(7+frame,h-10);
 }
 return {low:a,w,h,meta:{tw:d.w,th:d.h,ex:h-d.h*16,hub:null,smoke:null}};
}
const nativeProjectArt=civicBuildingArt;
const legacyCivicGoodArt=civicGoodArt;
civicGoodArt=function(id){return id==='i_t4'?nativeAristocratIcon():NATIVE_GOOD_IDS.includes(id)?nativeGoodArt(id):legacyCivicGoodArt(id);};
civicBuildingArt=function(type,frame=0,stage=null,variant=0){
 if(!CIVIC_PROJECTS[type])return nativeCivicArt(type,frame,variant);
 return nativeProjectArt(type,frame,stage);
};
// Replace old doubled-resolution bases and drop stale animation/rotation entries.
for(const name of [...HD_CATALOG.keys()])if(name.startsWith('civic_')){HD_CATALOG.delete(name);delete SP[name];delete SPB[name];delete urlC[name];}
for(const type of CIVIC_ART_TYPES){const art=civicBuildingArt(type,0,CIVIC_PROJECTS[type]?0:null);publishPixel(typeSprite(type),art.low,art.w,art.h,art.meta);}
const nativeHome=civicBuildingArt('haus4');publishPixel('b_haus4',nativeHome.low,nativeHome.w,nativeHome.h,nativeHome.meta);
for(let tier=1;tier<=3;tier++){const source=HD_CATALOG.get('b_haus'+tier)?.pixelSource;if(source?.width===48&&source.height===63){source._nightWindows=[{x:11,y:36,w:5,h:6,cross:true},{x:31,y:36,w:5,h:6,cross:true}];if(tier>=2)source._nightWindows.push({x:11,y:24,w:5,h:5,cross:true},{x:31,y:24,w:5,h:5,cross:true});if(tier===3)source._nightWindows.push({x:22,y:19,w:4,h:3});}}
const nativePublishPixel=publishPixel;
publishPixel=function(name,low,w,h,meta){if(GN[name]&&(low.width>16||low.height>16||w>16||h>16))throw Error('Waren-Icon '+name+' überschreitet das verbindliche 16 × 16 Pixelraster.');return nativePublishPixel(name,low,w,h,meta);};
for(const id of NATIVE_GOOD_IDS)publishPixel(id,nativeGoodArt(id),16,16);
// Normalize remaining legacy goods once; all registrations are checked.
for(const good of GOODS){if(NATIVE_GOOD_IDS.includes(good.id))continue;const source=HD_CATALOG.get(good.id)?.pixelSource||SP[good.id];if(!source)continue;const low=document.createElement('canvas');low.width=16;low.height=16;const c=low.getContext('2d');c.imageSmoothingEnabled=false;nativeDrawImage.call(c,source,0,0,16,16);publishPixel(good.id,low,16,16);}
publishPixel('i_t4',nativeAristocratIcon(),16,16);
const MUTED_GOOD_IDS=['tuch','hopfen','bier','trauben','gewuerz','aepfel','seife','blueten','parfuem','goldstaub','schmuck'];
const MUTED_GOOD_ORIGINALS=new Map();
for(const id of MUTED_GOOD_IDS){
 const source=HD_CATALOG.get(id).pixelSource;MUTED_GOOD_ORIGINALS.set(id,source);
 const a=document.createElement('canvas');a.width=a.height=16;const c=a.getContext('2d');nativeDrawImage.call(c,source,0,0);
 const image=c.getImageData(0,0,16,16),d=image.data;
 for(let i=0;i<d.length;i+=4){if(!d[i+3]||Math.max(d[i],d[i+1],d[i+2])<80)continue;
  const luminance=d[i]*.2126+d[i+1]*.7152+d[i+2]*.0722;
  for(let channel=0;channel<3;channel++)d[i+channel]=Math.round((d[i+channel]*.58+luminance*.42)*.9+4);
 }
 c.putImageData(image,0,0);publishPixel(id,a,16,16);
}
NIGHT_WINDOWS.clear();HOUSE_VARIANT_BASES.clear();
function buildingPreviewSprite(b){
 const type=b.type==='haus'&&b.tier===4?'haus4':b.type;
 if(type==='haus4'||CIVIC_ART_TYPES.has(type)){const stage=CIVIC_PROJECTS[type]?civicProjectState(b).stage:null,variant=type==='haus4'?houseVariant(b):0,key='preview_'+type+'_stage'+stage+'_variant'+variant;
  if(!SP[key]){const a=civicBuildingArt(type,0,stage,variant);publishPixel(key,a.low,a.w,a.h,a.meta);}return rotatedSprite(key,b.rotation||0);
 }
 if(b.type==='haus')return houseVariantSprite(b);
 // Resolve existing animated factories at a fixed frame without changing the world clock.
 const g=WORLD?.islands[b.island??activeIsland]||G,time=g?.time,globalTime=G?.time,reduced=WORK_ART.reduced;
 try{if(g)g.time=0;if(G)G.time=0;WORK_ART.reduced={matches:true};return spName(b);}finally{if(g)g.time=time;if(G)G.time=globalTime;WORK_ART.reduced=reduced;}
}

/* Native pencil used by the compact ship-name action. */
{
 const pencil=document.createElement('canvas');pencil.width=pencil.height=16;const q=civicPainter(pencil);
 for(let i=0;i<9;i++)q.r(3+i,10-i,4,4,'#21190f');
 for(let i=0;i<8;i++){q.r(4+i,11-i,2,2,'#e0bb7e');q.r(4+i,11-i,1,1,'#fff0c6');}
 q.r(11,2,2,2,'#bc7e71');q.r(3,13,2,1,'#e0bb7e');q.r(2,14,1,1,'#21190f');
 publishPixel('i_ship_edit',pencil,16,16);
}

// The one-tile well has no facing: its upright elevation stays upright when rotated.
const nativeWellRotation=rotatedSprite;
rotatedSprite=function(name,rotation=0){return name==='b_brunnen'||name.startsWith('civic_brunnen_')||name.startsWith('preview_brunnen_')?name:nativeWellRotation(name,rotation);};
