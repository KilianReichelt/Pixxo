/* Individual approved PNG loader. No atlas, save changes or review controls. */
(()=>{
 'use strict';
 const queue=[],pending=new Map(),localScripts=new Map();let active=0;
 function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
 async function decodePNG(buffer){
  const bytes=new Uint8Array(buffer),view=new DataView(buffer),read=p=>view.getUint32(p);
  if(bytes[0]!==137||String.fromCharCode(...bytes.slice(1,4))!=='PNG'||bytes[24]!==8||bytes[25]!==6||bytes[28]!==0)throw Error('Expected native non-interlaced RGBA PNG');
  const w=read(16),h=read(20),parts=[];
  if(!w||!h||w*h>16777216)throw Error('Invalid sprite dimensions');
  for(let p=8;p+12<=bytes.length;){const n=read(p);if(p+n+12>bytes.length)throw Error('Truncated PNG');if(String.fromCharCode(...bytes.slice(p+4,p+8))==='IDAT')parts.push(bytes.slice(p+8,p+8+n));p+=n+12;}
  const raw=new Uint8Array(await new Response(new Blob(parts).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer()),stride=w*4,data=new Uint8ClampedArray(stride*h);
  if(raw.length!==(stride+1)*h)throw Error('Invalid native pixel length');
  const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
  for(let y=0;y<h;y++){const filter=raw[y*(stride+1)];if(filter>4)throw Error('Invalid PNG filter');for(let x=0;x<stride;x++){const k=y*stride+x,a=x>=4?data[k-4]:0,b=y?data[k-stride]:0,c=y&&x>=4?data[k-stride-4]:0;data[k]=(raw[y*(stride+1)+x+1]+[0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter])&255;}}
  return {w,h,data};
 }
 function localPNG(entry){return new Promise((resolve,reject)=>{
  if(entry.localPath!==entry.path+'.js'){reject(Error('Invalid local sprite path'));return;}
  const script=document.createElement('script');let delivered=false;
  const cleanup=()=>{clearTimeout(timer);script.remove();localScripts.delete(entry.id);};
  const fail=error=>{cleanup();reject(error);};
  const timer=setTimeout(()=>fail(Error('Sprite load timed out: '+entry.path)),20000);
  localScripts.set(entry.id,data=>{if(delivered)return;delivered=true;try{const bytes=atob(data),buffer=new Uint8Array(bytes.length);for(let i=0;i<bytes.length;i++)buffer[i]=bytes.charCodeAt(i);cleanup();resolve(buffer.buffer);}catch(error){fail(error);}});
  script.onerror=()=>fail(Error('Sprite unavailable: '+entry.path));
  script.onload=()=>{if(!delivered)fail(Error('Sprite callback missing: '+entry.path));};
  script.src=entry.localPath;(document.head||document.body).append(script);
 });}
 async function decode(e){
  if(!/^assets\/sprites\/.+\.png$/.test(e.path)||e.path.includes('..')||![1,8].includes(e.frames))throw Error('Invalid approved sprite entry: '+e.id);
  let pixels;
  // Both protocols decode the same individual PNG bytes into straight RGBA.
  // Local script sidecars avoid opaque file origins without tainted canvases.
  if(location.protocol!=='file:'){
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
   try{const response=await fetch(e.path,{signal:controller.signal});if(!response.ok)throw Error('Sprite HTTP '+response.status);pixels=await decodePNG(await response.arrayBuffer());}finally{clearTimeout(timer);}
  }else pixels=await decodePNG(await localPNG(e));
  const {w,h}=pixels;
  if(w!==e.w*e.frames||h!==e.h)throw Error('Invalid approved sprite dimensions: '+e.id);
  if(e.type==='icon'&&(![16,32].includes(e.w)||e.w!==e.h))throw Error('Invalid icon: '+e.id);
  if((e.key?.startsWith('g_')||e.path.includes('/goods/'))&&(e.w!==32||e.h!==32))throw Error('Goods must remain native 32px: '+e.id);
  const frames=[];
  for(let i=0;i<e.frames;i++){const frame=canvas(e.w,e.h),c=frame.getContext('2d');c.imageSmoothingEnabled=false;frame._reviewFrameId=e.id+':'+i;frame._terrainDirection=e.direction;
   const data=c.createImageData(e.w,e.h);for(let y=0;y<e.h;y++)data.data.set(pixels.data.subarray((y*w+i*e.w)*4,(y*w+(i+1)*e.w)*4),y*e.w*4);c.putImageData(data,0,0);
   frames.push(frame);
  }
  return {frames};
 }
 function drain(){while(active<8&&queue.length){const job=queue.shift();active++;decode(job.entry).then(job.resolve,job.reject).finally(()=>{active--;drain();});}}
 function load(entry){if(!pending.has(entry.id))pending.set(entry.id,new Promise((resolve,reject)=>{queue.push({entry,resolve,reject});drain();}));return pending.get(entry.id);}
 window.ApprovedArtLoader={load,decodePNG,receive(id,data){localScripts.get(id)?.(data);}};
})();
