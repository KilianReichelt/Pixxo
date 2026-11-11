/* Editable code-native mask. Reuses the exact existing navigation mast geometry.
   Does not draw a new flag, move cloth or touch poles, sails, rigging or hull. */
(function(root){
 const colors=['#b7463d','#4275a8','#d2a546','#56865a','#9064a8','#3c9494'];
 function anchors(type,dir){
  const a=dir*Math.PI/4,clipper=type==='clipper';
  return (clipper?[-12,0,12]:[-6,7]).map(u=>({x:Math.round(32+Math.cos(a)*u),y:Math.round(44+Math.sin(a)*.65*u-(clipper?(u===0?32:27):(u<0?27:23)))}));
 }
 function mask(image,type,dir,frame=0){
  const swell=[0,1,2,1,0,-1][frame%6],pixels=new Set(),palette=type==='clipper'?[[71,127,145],[136,183,189]]:[[164,81,64],[223,153,112]];
  for(const p of anchors(type,dir)){
   // Narrow stripe crosses the existing painted cloth, never its fixed mast edge.
   for(let dx=1;dx<=5;dx++){
    const x=p.x+dx,y=p.y+Math.round(swell*dx/6)+1;
    if(x<0||x>=64||y<0||y>=64)continue;
    const k=(y*64+x)*4;
    if(image.data[k+3]===255&&palette.some(c=>c.every((v,i)=>v===image.data[k+i])))pixels.add(y*64+x);
   }
  }
  return [...pixels];
 }
 function apply(ctx,type,dir,color,frame=0){
  if(!colors.includes(color))throw Error('Unknown owner color');
  const im=ctx.getImageData(0,0,64,64),points=mask(im,type,dir,frame);
  // Parse hex without changing alpha or unmasked source pixels.
  const values=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));
  for(const p of points)for(let c=0;c<3;c++)im.data[p*4+c]=values[c];
  ctx.putImageData(im,0,0);return points;
 }
 // Controlled isolated-sprite preview of daynight.js drawNight's scene tint.
 // Live integration must continue to call the existing shared scene pass once.
 function nightImage(image,amount=1){
  const alpha=Math.max(0,Math.min(1,amount))*.58,tint=[8,16,42];
  for(let k=0;k<image.data.length;k+=4)if(image.data[k+3])for(let c=0;c<3;c++)image.data[k+c]=Math.round(image.data[k+c]*(1-alpha)+tint[c]*alpha);
  return image;
 }
 function night(ctx,amount=1){ctx.putImageData(nightImage(ctx.getImageData(0,0,64,64),amount),0,0);}
 const api={colors,anchors,mask,apply,nightImage,night};root.OwnerFlagStrips=api;
 if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
