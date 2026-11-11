/* Pure terrain calculations shared by the main-thread fallback and one worker. */
function calculateWaterDepth(input){
  const {width:w,height:h,tiles,river,shallow,rock,ore}=input,n=w*h,dist=new Float32Array(n),rocks=new Uint8Array(n),data=new Uint8Array(n*4);
  for(let k=0;k<n;k++){const t=tiles[k];dist[k]=t>shallow?0:64;rocks[k]=t===rock||t===ore?255:0;}
  function relax(k,j,cost){const d=dist[j]+cost;if(d<dist[k]){dist[k]=d;rocks[k]=rocks[j];}}
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const k=y*w+x;if(x)relax(k,k-1,1);if(y)relax(k,k-w,1);if(x&&y)relax(k,k-w-1,1.414);if(x<w-1&&y)relax(k,k-w+1,1.414);}
  for(let y=h-1;y>=0;y--)for(let x=w-1;x>=0;x--){const k=y*w+x;if(x<w-1)relax(k,k+1,1);if(y<h-1)relax(k,k+w,1);if(x<w-1&&y<h-1)relax(k,k+w+1,1.414);if(x&&y<h-1)relax(k,k+w-1,1.414);}
  // Flusswasser läuft als kontinuierliches Mischfeld ins Meer aus.
  const riverDistance=new Float32Array(n);for(let k=0;k<n;k++)riverDistance[k]=river?.[k]?0:64;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const k=y*w+x;if(x)riverDistance[k]=Math.min(riverDistance[k],riverDistance[k-1]+1);if(y)riverDistance[k]=Math.min(riverDistance[k],riverDistance[k-w]+1);if(x&&y)riverDistance[k]=Math.min(riverDistance[k],riverDistance[k-w-1]+1.414);if(x<w-1&&y)riverDistance[k]=Math.min(riverDistance[k],riverDistance[k-w+1]+1.414);}
  for(let y=h-1;y>=0;y--)for(let x=w-1;x>=0;x--){const k=y*w+x;if(x<w-1)riverDistance[k]=Math.min(riverDistance[k],riverDistance[k+1]+1);if(y<h-1)riverDistance[k]=Math.min(riverDistance[k],riverDistance[k+w]+1);if(x<w-1&&y<h-1)riverDistance[k]=Math.min(riverDistance[k],riverDistance[k+w+1]+1.414);if(x&&y<h-1)riverDistance[k]=Math.min(riverDistance[k],riverDistance[k+w-1]+1.414);}
  for(let k=0;k<n;k++){const blend=Math.max(0,1-riverDistance[k]/3.5);data[k*4]=Math.round(Math.min(1,Math.max(0,dist[k]-.35)/17)*255);data[k*4+1]=rocks[k];data[k*4+2]=tiles[k]>shallow?255:0;data[k*4+3]=Math.round(blend*blend*(3-2*blend)*255);}
 return data;
}
const TERRAIN_JOBS=(()=>{
 let worker=null,url=null,serial=0,active=null,unavailable=false;
 const metrics={mode:'uninitialized',completed:0,cancelled:0,fallbacks:0,lastComputeMs:0};
 function release(){worker?.terminate();worker=null;if(url){URL.revokeObjectURL(url);url=null;}}
 function cancel(){if(active){clearTimeout(active.timer);active.reject(Object.assign(new Error('Superseded terrain calculation'),{name:'AbortError'}));active=null;metrics.cancelled++;}}
 function fail(){
  const job=active;active=null;if(job)clearTimeout(job.timer);release();unavailable=true;metrics.mode='main-thread-fallback';
  if(job){metrics.fallbacks++;try{job.resolve(calculateWaterDepth(job.input));}catch(error){job.reject(error);}}
 }
 function start(){
  if(unavailable||typeof Worker==='undefined'||typeof Blob==='undefined'||(typeof URL==='undefined'||typeof URL.createObjectURL!=='function')){unavailable=true;metrics.mode='main-thread-fallback';return false;}
  try{
   const script=calculateWaterDepth.toString()+`;onmessage=({data:{id,input}})=>{try{const start=performance.now(),pixels=calculateWaterDepth(input);postMessage({id,pixels,ms:performance.now()-start},[pixels.buffer]);}catch(error){postMessage({id,error:String(error)});}};`;
   url=URL.createObjectURL(new Blob([script],{type:'text/javascript'}));worker=new Worker(url);
   worker.onmessage=({data})=>{if(!active||data.id!==active.id)return;if(data.error){fail();return;}const job=active;active=null;clearTimeout(job.timer);metrics.completed++;metrics.lastComputeMs=data.ms;metrics.mode='worker';if(url){URL.revokeObjectURL(url);url=null;}job.resolve(data.pixels);};
   worker.onerror=event=>{event.preventDefault?.();fail();};worker.onmessageerror=fail;metrics.mode='worker';return true;
  }catch{fail();return false;}
 }
 function depth(input){
  if(active){cancel();release();}
  if(!worker&&!start()){metrics.fallbacks++;return calculateWaterDepth(input);}
  return new Promise((resolve,reject)=>{
   active={id:++serial,input,resolve,reject,timer:setTimeout(fail,15000)};
   // Transfer copies only: the simulation owns the original arrays throughout.
   const snapshot={...input,tiles:input.tiles.slice(),river:input.river?.slice()};
   const buffers=[snapshot.tiles.buffer];if(snapshot.river)buffers.push(snapshot.river.buffer);
   try{worker.postMessage({id:serial,input:snapshot},buffers);}catch{fail();}
  });
 }
 if(typeof addEventListener==='function')addEventListener('pagehide',()=>{cancel();release();});
 return {depth,metrics};
})();
