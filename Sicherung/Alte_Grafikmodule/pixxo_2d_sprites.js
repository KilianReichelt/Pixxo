/* Werkstattdetails und acht Arbeitsphasen im vorhandenen Pixelraster. */
const WORK_ART={frames:8,names:[],reduced:matchMedia('(prefers-reduced-motion: reduce)')};
function workshopRunning(b){
 if(b.paused||b.fire>0||!b.conn||b.eff<=0)return false;
 if(b.type==='werft')return (WORLD?.fleet||[]).some(sh=>sh.at===(b.island??activeIsland)&&sh.buildLeft>0);
 return (b.status||'').startsWith('Produziert');
}
function workshopSprite(b){
 const name=typeSprite(b.type,b.tier);
 if(!WORK_ART.names.includes(name))return spName(b);
 const moving=workshopRunning(b)&&!WORK_ART.reduced.matches;
 const f=moving?Math.floor(G.time*5*Math.max(.15,b.eff)+(b.id||0)*3)%8:-1;
 return rotatedSprite(f<0?name:name+'_work'+f,b.rotation||0);
}
function workshopPixels(ctx,type,H,f){
 const active=f>=0,t=active?f:0,step=[0,1,2,1,0,-1,-2,-1][t],pulse=[0,1,2,3,2,1,0,1][t];
 const r=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h)};
 const line=(x,y,xx,yy,c)=>{let dx=Math.abs(xx-x),sx=x<xx?1:-1,dy=-Math.abs(yy-y),sy=y<yy?1:-1,e=dx+dy;for(;;){r(x,y,1,1,c);if(x===xx&&y===yy)break;const n=2*e;if(n>=dy){e+=dy;x+=sx}if(n<=dx){e+=dx;y+=sy}}};
 const wood=RAMPS.wood,iron=RAMPS.iron,stone=RAMPS.stone;
 const barrel=(x,y)=>{r(x+1,y,4,1,wood[3]);r(x,y+1,6,5,wood[1]);r(x+1,y+1,1,5,wood[2]);r(x,y+2,6,1,iron[1]);r(x,y+5,6,1,iron[1]);r(x+1,y+6,4,1,wood[0])};
 const sack=(x,y)=>{r(x+1,y,3,1,RAMPS.sack[1]);r(x,y+1,5,4,RAMPS.sack[2]);r(x+1,y+2,1,2,RAMPS.sack[3]);r(x+1,y+5,3,1,RAMPS.sack[0])};
 const planks=(x,y)=>{for(let i=0;i<3;i++){r(x,y+i*2,9,1,wood[3]);r(x,y+i*2+1,9,1,wood[1]);r(x+2+i,y+i*2,1,1,wood[0])}};
 const person=(x,y,job='carry')=>{
  const crouch=active&&t>=4&&t<=6?1:0;y+=crouch;
  r(x+1,y,3,1,wood[0]);r(x+1,y+1,3,2,RAMPS.skin[2]);r(x+3,y+2,1,1,RAMPS.skin[1]);
  r(x,y+3,4,3,'#586e76');r(x+1,y+3,1,3,'#8a9b91');
  r(x+1,y+6,1,2,wood[0]);r(x+3,y+6,1,2,wood[0]);
  if(job==='hammer'||job==='axe'){
   const reach=active?step:0;line(x+4,y+4,x+6,y+2-reach,wood[2]);r(x+5,y+1-reach,3,2,iron[2]);r(x+5,y+1-reach,2,1,iron[3]);
  }else if(job==='harvest'){
   r(x+4,y+4,2,1,RAMPS.skin[1]);line(x+5,y+4,x+7,y+2+(active?step:0),iron[2]);r(x+7,y+2+(active?step:0),2,1,iron[3]);
  }else{r(x+4,y+4,2,1,RAMPS.skin[1]);r(x+3,y+4,4,2,wood[2]);r(x+3,y+4,4,1,wood[3])}
 };
 const glow=(x,y,w,h)=>{r(x,y,w,h,'#211a16');if(active){r(x+1,y+h-3,w-2,2,'#a74422');r(x+2,y+h-4-pulse%2,Math.max(1,w-4),2,RAMPS.fire[2]);r(x+2+(t%2),y+h-3,2,1,RAMPS.fire[3])}};
 const smoke=(x,y)=>{if(!active)return;for(let i=0;i<3;i++){const p=(t+i*3)%8;r(x+Math.floor(p/3)+(i%2),y-p*2,2+(i%2),2,p>5?'#acaaa1':'#cbc7b4')}};
 switch(type){
  case 'holzfaeller':
   planks(16,H-7);r(3,H-12,7,2,wood[1]);r(4,H-13,5,1,wood[3]);r(5,H-10,1,7,wood[0]);person(9,H-13,'axe');
   if(active&&t===3){r(5,H-14,1,1,wood[3]);r(7,H-16,1,1,wood[2])}break;
  case 'saegewerk':{
   planks(3,H-7);r(8,H-12,27,3,wood[1]);r(9,H-12,25,1,wood[3]);
   const cx=20,cy=H-14;for(let y=-5;y<=5;y++)for(let x=-5;x<=5;x++)if(x*x+y*y<=25)r(cx+x,cy+y,1,1,x+y<0?iron[3]:iron[1]);
   for(let i=0;i<8;i++){const a=(i+(active?t/8:0))*Math.PI/4;r(cx+Math.round(Math.cos(a)*5),cy+Math.round(Math.sin(a)*5),1,1,iron[3])}
   r(cx-1,cy-1,3,3,iron[0]);r(cx,cy,1,1,iron[3]);r(10+(active?step:0),H-10,17,2,wood[2]);
   if(active&&t%2===0){r(23,H-8,1,1,wood[3]);r(25,H-7,1,1,wood[2])}person(33,H-13);break;
  }
  case 'fischer':
   barrel(1,H-9);r(24,H-22,6,13,wood[0]);
   for(let y=0;y<12;y++)for(let x=0;x<5;x++)r(25+x,H-21+y,1,1,(x+y+(active?t%2:0))%3===0?'#a7a68a':'#526663');
   person(17,H-9);if(active)r(26+step,H-9,2,1,RAMPS.fish[3]);break;
  case 'steinbruch':
   r(3,H-6,12,1,stone[0]);r(5,H-7,5,2,stone[2]);r(6,H-7,3,1,stone[3]);person(15,H-13,'hammer');
   r(25,H-21,2,13,wood[1]);line(26,H-23,20,H-22,wood[3]);line(20,H-22,20,H-13+(active?step:0),iron[1]);
   r(18,H-13+(active?step:0),4,3,stone[2]);if(active&&t===3){r(11,H-10,1,1,stone[3]);r(13,H-11,1,1,stone[2])}break;
  case 'mine':
   glow(10,H-20,12,16);r(10,H-4,19,1,iron[1]);r(10,H-1,19,1,iron[1]);
   for(let x=11;x<29;x+=4)r(x,H-4,1,4,wood[1]);
   {const x=13+(active?step:0);r(x,H-9,10,5,iron[1]);r(x+1,H-9,8,1,iron[3]);r(x+2,H-11,3,2,RAMPS.rust[2]);r(x+6,H-10,2,1,stone[2]);r(x+1,H-3,2,2,iron[0]);r(x+7,H-3,2,2,iron[0])}break;
  case 'farm':
   planks(27,H-7);sack(36,H-8);sack(41,H-9);
   for(let row=0;row<3;row++)for(let col=0;col<8;col++){const x=5+col*4,y=H-20+row*5;line(x,y,x+(active?(t+col)%3-1:0),y-3,RAMPS.field[2]);r(x+(active?(t+col)%3-1:0),y-4,2,2,RAMPS.field[3])}
   person(19+(active?Math.floor(t/4):0),H-14,'harvest');break;
  case 'muehle':
   sack(23,H-8);sack(27,H-6);r(10,H-8,9,1,wood[0]);person(4,H-9);
   // Flügel werden in die einzelnen Bildphasen eingebettet.
   break;
  case 'baeckerei':
   glow(11,H-10,7,6);sack(1,H-8);r(25,H-11,6,2,wood[1]);r(25,H-11,6,1,wood[3]);
   for(let x=25;x<30;x+=2){r(x,H-13,2,2,RAMPS.bread[2]);r(x,H-13,1,1,RAMPS.bread[3])}
   person(19,H-9);smoke(24,H-41);break;
  case 'schaefer':
   sack(17,H-7);for(const [i,x,y] of [[0,27,H-12],[1,36,H-10],[2,41,H-14]]){
    r(x-3,y-2,6,4,RAMPS.white[2]);r(x-2,y-2,3,1,RAMPS.white[3]);r(x+2+(active?(t+i)%3-1:0),y-1,2,2,wood[0]);r(x-2,y+2,1,2,wood[0]);r(x+1,y+2,1,2,wood[0]);
   }person(20,H-14);break;
  case 'weberei':
   r(8,H-16,20,12,wood[0]);r(9,H-15,18,9,RAMPS.parch[1]);
   for(let x=10;x<27;x+=2)r(x,H-15,1,9,RAMPS.cloth[2]);r(9,H-12,18,1,wood[3]);r(10+(active?t*2:7),H-10,4,2,wood[1]);
   r(37,H-17,3,5,RAMPS.cloth[2]);r(37,H-17,1,5,RAMPS.cloth[3]);person(28,H-10);break;
  case 'hopfen':case 'weingut':case 'gewuerzfarm':{
   barrel(2,H-9);sack(12,H-7);const green=RAMPS.leaf;
   for(let i=0;i<5;i++){const x=22+i*5,y=H-22+(i%2)*4;r(x+(active?(t+i)%3-1:0),y,2,2,green[2]);r(x,y+2,1,1,green[3])}
   person(type==='hopfen'?17:21,H-13,'harvest');break;
  }
  case 'brauerei':
   barrel(1,H-11);barrel(8,H-9);barrel(39,H-9);glow(20,H-12,7,8);r(29,H-24,4,13,RAMPS.copper[1]);r(29,H-24,3,1,RAMPS.copper[3]);
   person(31,H-11);smoke(39,H-59);break;
  case 'kelterei':
   r(12,H-15,10,2,wood[3]);r(13,H-13,2,9,wood[0]);r(20,H-13,2,9,wood[0]);r(16,H-15,2,10,iron[1]);
   r(14,H-9+(active?step:0),6,2,wood[2]);r(15,H-4,4,2,RAMPS.grape[1]);barrel(25,H-10);person(6,H-10);break;
  case 'schmelze':
   glow(12,H-16,13,12);r(28,H-8,9,2,iron[1]);r(29,H-8,7,1,iron[3]);
   person(3,H-12);smoke(37,H-59);if(active&&t%3===0){r(24,H-15-pulse,1,1,RAMPS.fire[3]);r(27,H-18,1,1,RAMPS.fire[2])}break;
  case 'schmiede':
   glow(10,H-13,8,10);r(25,H-10,10,2,iron[2]);r(25,H-10,10,1,iron[3]);r(28,H-8,4,5,iron[0]);person(20,H-15,'hammer');
   smoke(36,H-43);if(active&&t===3){r(30,H-12,1,1,RAMPS.fire[3]);r(33,H-13,1,1,RAMPS.fire[2])}break;
  case 'werft':
   planks(4,H-8);person(23,H-22,'hammer');person(37,H-11);
   line(43,H-49,43,H-36+(active?step:0),iron[1]);r(42,H-36+(active?step:0),3,2,iron[2]);break;
 }
}
function installWorkshopArt(){
 for(let f=0;f<8;f++)mk('work_sails'+f,40,40,s=>{
  const cx=20,cy=20,a=f*Math.PI/16;
  for(let k=0;k<4;k++){
   const angle=a+k*Math.PI/2,dx=Math.cos(angle),dy=Math.sin(angle),px=-dy,py=dx;
   const pt=(r,t)=>[cx+dx*r+px*t,cy+dy*r+py*t];
   P(s,SG(cx,cy,cx+dx*18,cy+dy*18,.65),RAMPS.wood,()=>1);
   P(s,PG([pt(5,.5),pt(17,.5),pt(17,4.5),pt(5,4.5)]),RAMPS.parch,(x,y)=>(x+y)%4===0?1:2);
   for(let r=5;r<18;r+=3){const p=pt(r,.5),q=pt(r,4.5);P(s,SG(...p,...q,.4),RAMPS.wood,()=>2)}
  }
  P(s,E(cx,cy,2.1,2.1),RAMPS.iron,()=>1);d(s,cx-1,cy-1,RAMPS.iron[3]);
 });
 for(const type in B){const name=typeSprite(type);if(!SP[name])continue;
  const original=SP[name],meta=SPB[name];if(!meta)continue;
  const production=B[type].kind==='prod'||type==='werft';
  if(!production)continue;
  const side=type==='muehle'?4:0,top=type==='muehle'?4:meta.smoke?14:0;
  const make=f=>{
   const c=document.createElement('canvas');c.width=original.width+side*2;c.height=original.height+top;const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;
   ctx.drawImage(original,side,top);ctx.save();ctx.translate(side,top);
   workshopPixels(ctx,type,original.height,f);
   if(type==='muehle'){
    const [cx,cy]=meta.hub;ctx.drawImage(SP['work_sails'+(f>=0?f:0)],cx-20,cy-20);
   }
   ctx.restore();return c;
  };
  SP[name]=make(-1);SPB[name]={...meta,W:SP[name].width,H:SP[name].height,ex:meta.ex+top,hub:null,smoke:null};delete urlC[name];
  for(let f=0;f<8;f++){const key=name+'_work'+f;SP[key]=make(f);SPB[key]={...SPB[name]}}
  WORK_ART.names.push(name);
 }
}
installWorkshopArt();
drawBld=function(ctx,b){
 const name=workshopSprite(b),sprite=SP[name],meta=SPB[name];if(!sprite)return;
 const dx=Math.round(b.x*16+b.w*8-sprite.width/2),dy=Math.round((b.y+b.h)*16-meta.H);
 ctx.drawImage(sprite,dx,dy);
 if(b.fire>0)for(let i=0;i<3;i++){const f=WORK_ART.reduced.matches?0:Math.floor(UI.vt*7+i)%3;ctx.drawImage(SP['fire'+f],Math.round(dx+(i+.5)*b.w*16/3-8),Math.round((b.y+b.h)*16-20-(i===1?8:0)))}
};
