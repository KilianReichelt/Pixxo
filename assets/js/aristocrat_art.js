/* Native pixel art, six bounded animation frames; no external raster dependencies. */
const CIVIC_ART_TYPES=new Set(['brunnen','garten','gemeinschaftshaus',...CIVIC_CHAINS.map(c=>c[0]),...Object.keys(CIVIC_PROJECTS)]);
function civicPainter(canvas){const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;const scale=canvas._civicScale||1;const pixel=(x,y,col)=>{c.fillStyle=col;c.fillRect(x,y,1,1);};
 const r=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x*scale),Math.round(y*scale),Math.max(1,Math.round(w*scale)),Math.max(1,Math.round(h*scale)));};
 const ln=(x,y,xx,yy,col)=>{x=Math.round(x*scale);y=Math.round(y*scale);xx=Math.round(xx*scale);yy=Math.round(yy*scale);const dx=Math.abs(xx-x),dy=-Math.abs(yy-y),sx=x<xx?1:-1,sy=y<yy?1:-1;let e=dx+dy;for(;;){pixel(x,y,col);if(x===xx&&y===yy)break;const d=e*2;if(d>=dy){e+=dy;x+=sx;}if(d<=dx){e+=dx;y+=sy;}}};
 const p=(pts,col)=>{pts=pts.map(([x,y])=>[x*scale,y*scale]);for(let y=Math.floor(Math.min(...pts.map(p=>p[1])));y<=Math.ceil(Math.max(...pts.map(p=>p[1])));y++)for(let x=Math.floor(Math.min(...pts.map(p=>p[0])));x<=Math.ceil(Math.max(...pts.map(p=>p[0])));x++){let on=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++)if((pts[i][1]>y+.5)!==(pts[j][1]>y+.5)&&x+.5<(pts[j][0]-pts[i][0])*(y+.5-pts[i][1])/(pts[j][1]-pts[i][1])+pts[i][0])on=!on;if(on)pixel(x,y,col);}};
 const window=(x,y)=>{r(x-1,y-1,15,19,'#514235');r(x,y,13,17,'#396177');r(x+1,y+1,3,7,'#94c8cf');r(x+8,y+11,3,4,'#7199aa');r(x+6,y,1,17,'#e0c595');r(x,y+8,13,1,'#e0c595');r(x-2,y+17,17,2,'#f0dab0');r(x-1,y-2,15,1,'#c09b62');(canvas._nightWindows??=[]).push({x:Math.round(x*scale),y:Math.round(y*scale),w:Math.round(13*scale),h:Math.round(17*scale),cross:true});};
 const roof=(x,y,w,h,col='#65717a')=>{p([[x-2,y+h],[x+w/2,y],[x+w+2,y+h]],'#353c40');p([[x,y+h-1],[x+w/2,y+2],[x+w,y+h-1]],col);for(let yy=3;yy<h;yy+=3){const span=w/2*yy/h;ln(x+w/2-span,y+yy,x+w/2+span,y+yy,'#919a95');for(let xx=x+w/2-span+2;xx<x+w/2+span;xx+=6)r(xx,y+yy,1,2,'#434d55');}r(x-1,y+h,w+2,2,'#d0bb8b');};
 const wall=(x,y,w,h,col='#c5bea3')=>{r(x,y,w,h,'#625d50');r(x+1,y+1,w-2,h-2,col);for(let yy=3;yy<h-1;yy+=5){r(x+1,y+yy,w-2,1,'#a3997e');for(let xx=4+(yy%2)*3;xx<w-1;xx+=9)r(x+xx,y+yy-3,1,3,'#aea58d');}r(x,y+h-3,w,3,'#777766');};
 const door=(x,y)=>{r(x-3,y-7,15,22,'#ddc89b');r(x-2,y-6,13,20,'#423326');r(x-1,y-5,11,18,'#957043');for(let i=1;i<10;i+=3)r(x+i,y-4,1,17,'#644b30');r(x,y-3,9,4,'#4a7181');r(x+4,y-3,1,4,'#c5b687');r(x+8,y+6,2,2,'#efd180');r(x-3,y+14,15,2,'#b4a47c');};
 const barrel=(x,y,col='#947346')=>{r(x+1,y,9,12,'#3d342a');r(x+2,y+1,7,10,col);r(x,y+3,11,1,'#393e3b');r(x,y+9,11,1,'#393e3b');r(x+3,y+1,1,9,'#c5a476');r(x+2,y,7,2,'#b6a17b');};
 const person=(x,y,f,col='#6b8491')=>{r(x,y,3,3,'#d4b487');r(x,y+3,3,6,col);r(x+(f%2),y+9,1,3,'#493e34');r(x+2-(f%2),y+9,1,3,'#493e34');r(x-1,y+5+(f%2),1,3,'#d4b487');};
 return {c,r,ln,p,window,roof,wall,door,barrel,person};
}
function civicGoodArt(id){const a=document.createElement('canvas');a.width=a.height=32;const {r,p,ln}=civicPainter(a);
 if(['sand','kalk','zement'].includes(id)){p([[9,4],[22,4],[20,8],[25,13],[26,27],[22,30],[8,30],[5,26],[6,13],[11,8]],'#493d2d');p([[10,6],[21,6],[18,9],[23,14],[24,26],[20,28],[9,28],[7,25],[8,14],[13,9]],id==='sand'?'#c8ab71':id==='kalk'?'#dad8bb':'#9b9c8a');for(let y=14;y<26;y+=4)r(9,y,2,1,'#eee0b1');r(10,9,10,2,'#826c4b');r(11,17,10,7,'#534932');r(12,18,8,5,'#e7ddb6');r(14,20,4,2,id==='sand'?'#c09c5d':id==='kalk'?'#a8ac9d':'#72796f');}
 else if(id==='beton'){p([[4,12],[17,5],[28,11],[28,24],[15,30],[4,24]],'#515953');p([[5,12],[17,7],[26,12],[15,18]],'#c0c2af');p([[5,14],[14,20],[14,28],[5,23]],'#919886');p([[16,20],[26,14],[26,23],[16,28]],'#747d72');for(const [x,y] of [[8,16],[9,22],[19,21],[22,16],[16,12]])r(x,y,2,1,'#d6d2b8');}
 else if(id==='glas'){p([[5,7],[24,4],[27,26],[8,29]],'#365c69');p([[7,9],[22,6],[25,24],[10,27]],'#72a9b1');ln(9,11,20,8,'#d4efde');ln(11,25,23,22,'#badbce');ln(10,12,17,20,'#a3d2d0');r(8,6,13,1,'#b5dacc');}
 else if(id==='geschirr'){p([[4,14],[7,10],[23,10],[28,16],[25,25],[20,28],[9,27],[5,24]],'#5c747b');p([[5,15],[9,12],[23,12],[26,17],[23,24],[9,25]],'#e1ddc4');ln(7,18,24,18,'#8faeb1');ln(8,22,23,22,'#bbbfae');r(13,6,9,9,'#ede5c9');r(14,5,7,1,'#65969a');r(22,7,4,1,'#e1ddc4');r(25,7,1,6,'#e1ddc4');r(22,12,4,1,'#e1ddc4');}
 else if(id==='papier'||id==='buecher'){const book=id==='buecher';for(let i=0;i<3;i++){const x=4+i*2,y=19-i*6;p([[x,y],[x+18,y-3],[x+22,y+2],[x+4,y+6]],book?['#715448','#416b6b','#a36a43'][i]:'#a5a48e');r(x+4,y+3,18,3,'#e4ddbc');ln(x+5,y+4,x+20,y+4,'#a7a38b');p([[x,y-1],[x+18,y-4],[x+22,y+1],[x+4,y+4]],book?['#a87558','#5f9492','#bf9564'][i]:'#eee7cb');if(book){ln(x+5,y,x+17,y-2,'#d7b46b');r(x+8,y,4,1,'#e3c684');}}}
 else if(id==='farbstoff'){r(8,4,15,3,'#735235');r(10,7,11,4,'#a8966f');p([[9,10],[23,10],[26,15],[26,27],[22,30],[8,30],[5,26],[5,15]],'#493945');r(7,15,17,12,'#875977');r(9,14,3,12,'#b591a7');r(12,19,10,6,'#e1d2b3');r(15,20,4,4,'#6d4568');r(8,4,15,1,'#cbb082');}
 else if(id==='feine_kleidung'){p([[11,4],[20,4],[23,8],[29,10],[26,18],[23,16],[24,29],[7,29],[8,16],[5,18],[2,11],[8,8]],'#3c475b');p([[12,6],[19,6],[22,10],[26,11],[25,15],[21,13],[22,27],[9,27],[10,13],[6,15],[5,12],[10,10]],'#69849d');p([[12,5],[16,11],[20,5],[18,16],[15,15]],'#ddd9bd');r(15,15,2,12,'#334555');for(let y=16;y<27;y+=3)r(16,y,1,1,'#e6c675');ln(11,24,14,24,'#ceaf71');ln(19,24,21,24,'#ceaf71');}
 else if(id==='i_t4'){p([[7,12],[8,6],[12,9],[16,3],[20,9],[25,6],[25,13]],'#634a2c');p([[9,11],[10,8],[13,11],[16,6],[19,11],[23,8],[23,11]],'#d4b168');r(8,12,17,3,'#eed28d');r(12,16,9,7,'#d4b487');r(13,16,7,1,'#e9d2a3');p([[6,30],[8,24],[13,22],[17,26],[21,22],[25,25],[28,30]],'#556b86');r(15,25,3,5,'#e0d4b3');r(16,27,1,1,'#a58a4c');}
 return a;}
for(const id of [...CIVIC_GOODS.map(g=>g[0]),'i_t4'])publishPixel(id,civicGoodArt(id),16,16);
function civicBuildingArt(type,frame=0,stage=null){const d=type==='haus4'?B.haus:B[type],project=CIVIC_PROJECTS[type],w=d.w*16,h=d.h*16+24,canvas=document.createElement('canvas');canvas._civicScale=project?.5:1;canvas.width=project?w:w*2;canvas.height=project?h:h*2;const {r,ln,p,window,roof,wall,door,barrel,person}=civicPainter(canvas),W=w*2,H=h*2,base=48,f=[0,1,2,1,0,-1][frame];
 // Leave the island's actual grass visible: workshops have no opaque foundation plate.
 const green=['garten','brunnen','gemeinschaftshaus'].includes(type);if(green){p([[13,base+9],[W*.42,base+4],[W-17,base+12],[W-7,H*.7],[W-16,H-13],[W*.63,H-5],[W*.3,H-11],[11,H-20],[5,H*.74]],'#64814a');for(let i=0;i<W*H/85;i++){const x=14+Math.floor(hs(i,type.length,4)*(W-30)),y=base+15+Math.floor(hs(i,type.length,8)*(H-base-35));r(x,y,2,1,i%3?'#7c9659':'#486b3e');}}
 const house=(x,y,ww,hh,style='#64717a')=>{const rh=ww<60?24:32;wall(x,y+rh,ww,hh-(rh-18));roof(x,y,ww,rh,style);for(let xx=x+8;xx<x+ww-18;xx+=28)for(let yy=y+rh+8;yy<y+hh-8;yy+=32)window(xx,yy);door(x+ww/2-4,y+hh+4);r(x+1,y+rh+2,ww-2,1,'#ebd3a4');};
 const flag=(x,y)=>{r(x,y,1,18,'#68543b');r(x+1,y+2+f,12,5,'#945747');r(x+1,y+2+f,10,1,'#d29770');r(x+10,y+5+f,3,2,'#623b35');};
 if(type==='brunnen'){
  const x=W/2,y=H-30;
  // Tall timber frame above a compact, individually masoned well shaft.
  p([[x-17,y],[x-11,y-7],[x+11,y-7],[x+17,y],[x+15,y+20],[x-15,y+20]],'#4f5140');
  p([[x-14,y],[x-9,y-4],[x+9,y-4],[x+14,y],[x+12,y+17],[x-12,y+17]],'#c9bf96');
  for(let yy=4;yy<18;yy+=5){r(x-13,y+yy,26,1,'#8d8b70');for(let xx=-10+(yy%2)*3;xx<12;xx+=8)r(x+xx,y+yy-3,1,3,'#9c9779');}
  p([[x-12,y],[x-7,y-3],[x+7,y-3],[x+12,y],[x+7,y+4],[x-7,y+4]],'#244d61');r(x-7+f,y,9,1,'#82c7cf');
  for(const dx of [-14,11]){r(x+dx,33,4,y-29,'#57402c');r(x+dx+1,35,1,y-34,'#c4a66c');ln(x+dx,45,x+dx+(dx<0?8:-8),35,'#967342');}
  roof(x-19,8,38,26,'#ad7044');r(x-15,35,30,3,'#d2ac6d');r(x-2,36,3,8,'#9d7d4d');r(x-8,42,16,3,'#473c2c');r(x+7,40,2,9,'#bda16d');
  ln(x,45,x,57+f,'#d7c79d');r(x-5,57+f,10,12,'#644931');r(x-4,58+f,8,1,'#d6b775');r(x-4,65+f,8,1,'#b19c77');
  r(x-18,y+21,36,2,'#a39c78');for(const xx of [x-21,x+18]){r(xx,H-17,4,4,'#4e7f49');r(xx+1,H-19,2,3,'#83a85c');}
 }
 else if(type==='garten'){for(let j=0;j<3;j++)for(let i=0;i<3;i++){const x=10+i*27,y=base+10+j*19;r(x,y,21,13,'#574a33');for(let k=0;k<4;k++){r(x+3+k*5,y+2,2,9,'#86a055');r(x+2+k*5,y+3,4,2,k%2?'#bac16c':'#a96e87');r(x+3+k*5,y+7,2,2,'#d5bd70');}}for(let x=6;x<W-4;x+=10){r(x,H-13,2,10,'#a88a59');r(x,H-13,2,1,'#d7bb84');}r(5,H-9,W-10,1,'#685537');barrel(W-19,base+4,'#768c85');person(12+frame*2,H-30,frame,'#a88855');}
 else if(type==='haus4'){
  // A narrow three-storey townhouse, drawn at its final proportions rather than stretched from another house.
  const sx=13,sy=8,ww=W-26,eaves=46,bottom=H-18;
  wall(sx,eaves,ww,bottom-eaves,'#e4cfa0');r(sx+2,eaves+2,ww-4,2,'#f3e0b5');
  p([[sx-4,eaves],[sx+7,sy+13],[sx+17,sy],[sx+ww-17,sy],[sx+ww-7,sy+13],[sx+ww+4,eaves]],'#344b59');
  p([[sx-1,eaves-3],[sx+10,sy+14],[sx+19,sy+3],[sx+ww-19,sy+3],[sx+ww-10,sy+14],[sx+ww+1,eaves-3]],'#3e7d98');
  for(let y=sy+8;y<eaves-3;y+=4){const inset=y<sy+16?17:Math.max(1,Math.round((eaves-y)*.32));r(sx+inset,y,ww-inset*2,1,'#82b4bb');for(let x=sx+inset+3;x<sx+ww-inset;x+=7)r(x,y+1,1,2,'#2f5d74');}
  r(sx-3,eaves-1,ww+6,3,'#e5c178');r(sx+17,sy-1,ww-34,2,'#deb575');
  for(const x of [sx+10,sx+ww-25]){wall(x-2,sy+19,18,23,'#efd8a7');roof(x-3,sy+9,20,11,'#416b83');window(x,sy+21);}
  for(const x of [sx+2,sx+ww-5]){r(x,eaves+3,3,bottom-eaves-5,'#f3e1ba');r(x-1,eaves+4,5,2,'#c59c59');}
  for(let y=eaves+9;y<bottom-29;y+=30){for(const x of [sx+9,sx+ww-23]){r(x-4,y,2,16,'#397f74');r(x+15,y,2,16,'#397f74');window(x,y);}r(sx+5,y+22,ww-10,2,'#bd955b');r(sx+5,y+23,ww-10,1,'#f3dfb1');}
  door(W/2-4,bottom-14);r(W/2-9,bottom-16,18,2,'#edd7a6');r(W/2-11,bottom,22,2,'#baac86');r(W/2-14,bottom+2,28,2,'#d3c5a0');
  const balconyY=eaves+39;r(W/2-16,balconyY,32,2,'#efce86');r(W/2-15,balconyY+1,30,6,'#394849');for(let x=W/2-14;x<W/2+15;x+=4)r(x,balconyY+1,1,5,'#dcb25f');r(W/2-16,balconyY+7,32,2,'#e6d4ad');
  for(const x of [sx+7,W-sx-12]){r(x,H-18,6,5,'#98633d');r(x-1,H-21,8,4,'#48835a');r(x,H-24,2,3,'#f0cf73');r(x+4,H-23,2,2,'#d88ba8');}
  flag(W*.67,sy+8);r(W*.67+1,sy+10+f,10,5,'#407d98');r(W*.67+1,sy+10+f,10,1,'#eac46e');
 }
 else if(type==='gemeinschaftshaus'){const ww=W-20,hh=H-63;house(10,12,ww,hh,'#487f8c');r(12,32,ww-4,2,'#e0d4ac');for(const xx of [15,W-20]){r(xx,32,3,hh-4,'#ece0bd');r(xx-1,31,5,2,'#d7bb7c');}roof(W/2-13,1,26,16,'#568f83');window(W/2-2,18);flag(W-12,5);r(W/2-5,H-29,10,16,'#c7b991');for(let y=H-27;y<H-13;y+=6)ln(W/2-5,y,W/2+4,y,'#a3997b');for(const [xx,yy] of [[18,H-23],[W-32,H-23]]){r(xx,yy,14,3,'#b19665');r(xx,yy+3,14,2,'#654d33');r(xx+1,yy+4,2,4,'#654d33');r(xx+11,yy+4,2,4,'#654d33');}person(22+frame*2,H-24,frame);person(W-35-frame,H-19,frame+1,'#a46a54');}
 else if(project){const level=stage??project.stages.length,complete=level>=project.stages.length;
  if(type==='ausstellungspalast'&&level>=3){
   // Open U-shaped exhibition grounds, not a rectangular slab or a solid square palace.
   const back=84,wingH=H-150;house(70,back-24,W-140,74,'#748f86');house(18,back+24,57,wingH,'#7d968a');house(W-75,back+36,57,wingH-12,'#7d968a');
   for(const xx of [24,55,W-69,W-38]){r(xx,back+46,3,wingH-18,'#e3d8b5');r(xx-2,back+43,7,3,'#d6bc87');}
   if(level>=4){p([[W/2-62,back-2],[W/2-48,back-31],[W/2-27,back-49],[W/2,back-58],[W/2+27,back-49],[W/2+48,back-31],[W/2+62,back-2]],'#355f69');for(let i=-4;i<=4;i++)ln(W/2+i*13,back-53+Math.abs(i)*7,W/2+i*13,back-2,'#c2dbce');for(let j=0;j<4;j++)ln(W/2-53+j*9,back-6-j*12,W/2+53-j*9,back-6-j*12,'#83b6b2');r(W/2-63,back-2,126,3,'#dacb9c');}
   p([[W/2-30,back+110],[W/2+27,back+109],[W/2+39,H-44],[W/2+15,H-28],[W/2-21,H-31],[W/2-36,H-52]],'#b4ae94');for(let yy=back+117;yy<H-36;yy+=7)ln(W/2-25,yy,W/2+23,yy,'#928c78');
   if(complete){const fx=W/2,fy=H-99;p([[fx-24,fy],[fx-14,fy-12],[fx+14,fy-12],[fx+24,fy],[fx+14,fy+12],[fx-14,fy+12]],'#556e68');p([[fx-19,fy],[fx-11,fy-8],[fx+11,fy-8],[fx+19,fy],[fx+11,fy+8],[fx-11,fy+8]],'#759da0');r(fx-2,fy-17,4,18,'#c7c4a3');ln(fx-1,fy-18,fx-10-f,fy-4,'#c4e0cf');ln(fx+1,fy-18,fx+10+f,fy-4,'#91c5c3');for(const xx of [88,W-97]){for(let yy=H-147;yy<H-45;yy+=24){p([[xx-6,yy],[xx,yy-7],[xx+10,yy-5],[xx+15,yy+3],[xx+8,yy+8],[xx-3,yy+6]],'#60834f');r(xx+3,yy-2,2,2,'#d2be7a');}}for(const xx of [30,W-30])flag(xx,back+6);person(W/2-14+frame*2,H-52,frame);person(94+frame,H-107,frame+1,'#a57560');}
   else{for(const xx of [83,W-86]){r(xx,back+21,2,H-back-48,'#b49966');for(let yy=back+44;yy<H-26;yy+=24){r(xx-8,yy,18,2,'#937046');ln(xx-8,yy,xx+7,yy-19,'#785839');}}person(W/2+25+frame*2,H-42,frame,'#8a7a58');}
  }else{
  if(level===0){r(16,H-53,W-32,32,'#746a56');for(let x=20;x<W-20;x+=22){r(x,H-51,14,18,'#53594e');r(x,H-51,14,2,'#b0ab8d');}for(let i=0;i<5;i++)barrel(20+i*14,H-20);}
  else{const ww=W-40,wallHeight=Math.round((H-base)*(level===1?.16:level===2?.38:.6)),yy=H-22-wallHeight-24;wall(20,yy+24,ww,wallHeight);if(level>=2)roof(20,yy,ww,24,'#626e78');for(let xx=34;xx<W-36;xx+=30){r(xx-4,yy+29,3,wallHeight-9,'#dbd4b8');for(let y=yy+33;y<H-47;y+=28)window(xx,y);}door(W/2-4,H-39);r(18,H-24,W-36,3,'#d7cfaf');r(W/2-25,H-21,50,3,'#c6bea2');
   if(type==='rathaus'&&level>=2){wall(W/2-17,yy-36,34,60);roof(W/2-20,yy-57,40,23,'#657989');r(W/2-7,yy-23,14,14,'#4c5147');r(W/2-6,yy-22,12,12,'#e5d5aa');ln(W/2,yy-19,W/2,yy-16,'#5b513b');ln(W/2,yy-16,W/2+4,yy-16,'#5b513b');flag(W/2,yy-74);}
   if(type==='ausstellungspalast'&&level>=3){house(12,yy-5,60,wallHeight+5,'#778e7e');house(W-72,yy-5,60,wallHeight+5,'#778e7e');if(level>=4){p([[W/2-57,yy+7],[W/2-45,yy-18],[W/2-25,yy-35],[W/2,yy-43],[W/2+25,yy-35],[W/2+45,yy-18],[W/2+57,yy+7]],'#345f6a');for(let i=-4;i<=4;i++){const xx=W/2+i*12,top=yy-40+Math.abs(i)*6;ln(xx,top,xx,yy+7,'#b9d5c4');}for(let j=0;j<4;j++)ln(W/2-48+j*8,yy-j*10,W/2+48-j*8,yy-j*10,'#7dabaa');r(W/2-59,yy+7,118,3,'#dcce9e');}if(complete){for(const xx of [14,W-15])flag(xx,yy-25);}}
  }
  if(!complete){for(let xx=12;xx<W-5;xx+=26){r(xx,36,3,H-45,'#6e5034');r(xx,36,1,H-45,'#b99a66');}for(let yy=58;yy<H-13;yy+=25){r(9,yy,W-17,2,'#9c7c4d');for(let xx=13;xx<W-13;xx+=26)ln(xx,yy,xx+22,yy-22,'#7e5c37');}r(W-43,16,3,H-39,'#b1955d');r(W-68,16,52,3,'#d2b881');r(W-21,19,1,22+f,'#c6b996');r(W-25,40+f,9,5,'#70583c');for(let i=0;i<5;i++)person(23+i*37+(frame%3)*2,H-21-(i%2)*7,frame+i,'#8a7a58');}
  else{r(8,H-13,W-16,3,'#7a8e5b');for(let i=0;i<5;i++){r(18+i*(W-40)/4,H-17,6,6,'#7c6244');r(18+i*(W-40)/4,H-19,6,4,'#7ea16a');}person(W/2+34+frame*2,H-17,frame);}
  }
 }
 else if(type==='sandgrube'){
  house(7,7,49,43,'#b98248');r(11,48,41,2,'#d9bf83');r(10,68,47,2,'#766344');
  const terrace=[[[59,46],[W-8,40],[W-4,H-34],[W-18,H-9],[23,H-13],[12,H-37],[28,79]],[[62,56],[W-17,52],[W-14,H-38],[W-25,H-21],[32,H-23],[24,H-41],[38,86]],[[64,68],[W-26,66],[W-24,H-42],[W-32,H-31],[43,H-34],[36,H-47],[47,94]]];
  terrace.forEach((points,i)=>{p(points,['#826647','#d0ad70','#eed093'][i]);for(let j=0;j<points.length;j++){const a=points[j],b=points[(j+1)%points.length];ln(a[0],a[1],b[0],b[1],i===0?'#a68a56':i===1?'#f2d49c':'#bb9359');}});
  for(let i=0;i<160;i++){const xx=36+hs(i,6,4)*(W-58),yy=77+hs(i,7,9)*(H-101);r(xx,yy,i%7===0?3:1,1,i%3?'#f4dfa9':'#bc945e');}
  for(let i=0;i<7;i++){const yy=75+i*6,xx=23+i*2;r(xx,yy,16,2,'#8e7049');r(xx,yy,16,1,'#e2bd80');}
  r(W-25,22,4,70,'#63472f');r(W-24,23,1,68,'#bb9660');r(W-47,22,40,3,'#c2a06a');ln(W-24,45,W-44,26,'#836039');ln(W-11,25,W-11,60+f,'#d9cba1');r(W-15,59+f,10,8,'#75513a');r(W-14,60+f,8,2,'#d7bc82');
  r(42,H-19,22,5,'#795538');r(46,H-14,3,4,'#353d37');r(60,H-15,3,4,'#353d37');ln(62,H-18,69,H-23,'#b2935e');r(46,H-22,13,4,'#edcd8d');person(72+frame,H-34,frame,'#af7851');barrel(8,H-20);
 }
 else{const furnace=['kalkbrennerei','zementwerk','glashuette','geschirrmanufaktur'].includes(type),forms={kalkbrennerei:[7,11,W-50,H-53,'#87604d'],zementwerk:[7,8,W-47,H-50,'#87604d'],betonwerk:[7,9,W-25,H-56,'#788e88'],glashuette:[7,8,W-34,H-51,'#78938e'],geschirrmanufaktur:[7,8,W-34,H-51,'#9f7355'],papiermuehle:[7,8,W-33,H-51,'#657a83'],faerberei:[9,12,W-24,H-55,'#8d6f67'],druckerei:[7,8,W-22,H-51,'#667281'],schneiderei:[10,7,W-26,H-50,'#65818c']};house(...(forms[type]||[7,8,W-25,H-51,'#647881']));
  if(type==='zementwerk'){for(const xx of [W-42,W-27]){wall(xx,34,11,H-60,'#c6c7aa');p([[xx-2,34],[xx+5,27],[xx+13,34]],'#65877e');r(xx+4,H-26,3,8,'#4d5952');}}
  if(type==='kalkbrennerei'){wall(W-46,H-67,26,47,'#bca17a');p([[W-48,H-67],[W-43,H-82],[W-27,H-82],[W-18,H-67]],'#d2bc8b');r(W-37,H-37,10,17,'#423b2e');r(W-35,H-35,6,12,'#c57a43');}
  if(furnace){wall(W-22,18,14,H-38,'#ad8760');r(W-24,15,18,4,'#e0c49a');r(W-21,18,12,2,'#504637');r(21,H-35,18,15,'#3f322a');r(23,H-33,14,11,'#b75e32');for(let i=0;i<4;i++)r(24+i*3,H-30+(i+frame)%3,2,6,'#e9aa50');for(let i=0;i<3;i++)r(W-20+f+i*3,10-i*4,5,3,'#9b9c8a');}
  if(type==='betonwerk'){r(70,H-40,35,24,'#444e4c');p([[74,H-43],[99,H-43],[106,H-35],[100,H-20],[73,H-20],[68,H-32]],'#8b9d93');r(75,H-40,22,3,'#b6c1aa');ln(72,H-36+f,100,H-30+f,'#4f6963');r(80,H-20,3,9,'#514434');r(95,H-20,3,9,'#514434');}
  else if(type==='papiermuehle'){const x=W-23,y=H-35;for(let i=0;i<8;i++){const a=i*Math.PI/4+frame*Math.PI/12;ln(x,y,x+Math.cos(a)*13,y+Math.sin(a)*13,'#ae8b54');r(x+Math.cos(a)*13-2,y+Math.sin(a)*13-2,4,4,'#584631');}r(x-2,y-2,5,5,'#e0c292');for(let i=0;i<3;i++)r(15+i*12,H-15,10,3,'#e2d9b7');}
  else if(type==='faerberei'){for(let i=0;i<3;i++){barrel(14+i*23,H-24,['#806080','#7a9891','#ad8458'][i]);r(12+i*23,H-31,12,8,['#b388a7','#9dbaab','#ccab79'][i]);}r(12,H-35,W-25,1,'#695338');}
  else if(type==='druckerei'){r(W-38,H-43,25,24,'#5c4934');r(W-36,H-42,3,21,'#bda270');r(W-17,H-42,3,21,'#bda270');r(W-33,H-32+f,17,4,'#444d49');r(W-31,H-26,14,3,'#e3dbb9');r(W-28,H-41,1,9+f,'#bbb38e');}
  else if(type==='schneiderei'){for(let i=0;i<3;i++){r(W-40+i*8,H-29,7,16,['#7596a5','#b18c9d','#d7be8d'][i]);r(W-39+i*8,H-29,1,14,'#e3d4aa');}r(W-43,H-33,29,2,'#5e4c36');}
  else if(type==='geschirrmanufaktur'){for(let i=0;i<3;i++){r(W-45+i*9,H-16,8,3,'#e7ddbf');r(W-43+i*9,H-20,4,4,'#b4c8bd');}}
  else if(type==='glashuette'){for(let i=0;i<4;i++){r(W-46+i*6,H-24,4,12,'#65a1a9');r(W-46+i*6,H-25,4,1,'#c6e2ce');}}
  else{for(let i=0;i<3;i++)barrel(W-43+i*12,H-21,'#aaa38a');}
  person(18+frame*2,H-19,frame);barrel(8,H-17);
 }
 // Rich slate/copper roofs and warm plaster distinguish the new workshops without changing the pixel language.
 if(!project&&!green&&type!=='haus4'){
  const context=canvas.getContext('2d'),img=context.getImageData(0,0,W,H),data=img.data;
  const palette={'197,190,163':[232,214,174],'163,153,126':[191,161,113],'174,165,141':[212,187,140],'119,119,102':[130,115,82],'145,154,149':[169,190,180],'67,77,85':[51,72,82],'100,113,122':[62,113,135],'102,114,129':[68,100,142],'101,122,131':[68,116,138],'101,129,140':[58,118,144],'120,147,142':[69,139,127],'120,142,136':[73,139,126],'135,96,77':[161,91,58],'159,115,85':[182,109,61],'141,111,103':[161,92,119]};
  for(let i=0;i<data.length;i+=4){if(!data[i+3])continue;const color=palette[data[i]+','+data[i+1]+','+data[i+2]];if(color){data[i]=color[0];data[i+1]=color[1];data[i+2]=color[2];}}context.putImageData(img,0,0);
 }
 // Only ground pixels are trimmed; architecture keeps its complete silhouette.
 const ctx=canvas.getContext('2d'),image=ctx.getImageData(0,0,canvas.width,canvas.height),pixels=image.data,ground=new Set(['97937b','aea78d','7a7c6b','64814a','7c9659','486b3e'].map(hex=>parseInt(hex,16)));for(let y=Math.floor(base*(canvas._civicScale||1));y<canvas.height;y++)for(let x=0;x<canvas.width;x++){const k=(y*canvas.width+x)*4;if(!pixels[k+3]||!ground.has((pixels[k]<<16)|(pixels[k+1]<<8)|pixels[k+2]))continue;const edge=Math.min(x,canvas.width-1-x,y-base*(canvas._civicScale||1),canvas.height-1-y),noise=hs(Math.floor(x/3),Math.floor(y/3),type.length+79);if(edge<5+noise*9||noise<.045)pixels[k+3]=0;}ctx.putImageData(image,0,0);
 return {low:canvas,w,h,meta:{tw:d.w,th:d.h,ex:24,hub:null,smoke:null}};
}
function civicSprite(b){const type=b.type==='haus'&&b.tier===4?'haus4':b.type;if(type!=='haus4'&&!CIVIC_ART_TYPES.has(type))return null;const g=WORLD?.islands[b.island??activeIsland]||G,p=CIVIC_PROJECTS[type]?civicProjectState(b):null,variant=type==='haus4'?houseVariant(b):0,active=type!=='haus4'&&!b.paused&&b.fire<=0&&(p?p.active||p.stage>=CIVIC_PROJECTS[type].stages.length:b.conn)&&(B[b.type].kind!=='prod'||b.status?.startsWith('Produziert')),frame=active&&!WORK_ART.reduced.matches?Math.floor((g?.time||0)*3+b.id)%6:0,key='civic_'+type+(p?'_stage'+p.stage:'')+'_v'+variant+'_f'+frame;
 if(!HD_CATALOG.has(key)){const a=civicBuildingArt(type,frame,p?.stage,variant);publishPixel(key,a.low,a.w,a.h,a.meta);}return rotatedSprite(key,b.rotation||0);
}
for(const type of CIVIC_ART_TYPES){const a=civicBuildingArt(type,0,CIVIC_PROJECTS[type]?0:null);publishPixel(typeSprite(type),a.low,a.w,a.h,a.meta);}const civicHomeArt=civicBuildingArt('haus4');publishPixel('b_haus4',civicHomeArt.low,civicHomeArt.w,civicHomeArt.h,civicHomeArt.meta);
const civicSpName=spName;spName=function(b){return civicSprite(b)||civicSpName(b);};
const civicWorkshop=workshopSprite;workshopSprite=function(b){return civicSprite(b)||civicWorkshop(b);};
const civicImportedBuilding=importedBuilding;importedBuilding=function(type,tier=1,frame=0){return CIVIC_ART_TYPES.has(type)?civicBuildingArt(type,frame,CIVIC_PROJECTS[type]?0:null):civicImportedBuilding(type,tier,frame);};
const civicInstallBuildings=installNativeBuildings;installNativeBuildings=function(){civicInstallBuildings();const a=civicBuildingArt('haus4');publishPixel('b_haus4',a.low,a.w,a.h,a.meta);for(const name of [...HD_CATALOG.keys()])if(name.startsWith('civic_')){HD_CATALOG.delete(name);delete SP[name];delete SPB[name];delete urlC[name];}};
