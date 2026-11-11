/* A loading screen ends at usable content, not at a fixed number of RAFs. */
function gameLoadingContentReady(){
 if(!StartScreen.ready)return false;
 if(document.readyState!=='complete'||document.fonts?.status==='loading')return false;
 if([...document.images].some(image=>image.loading!=='lazy'&&!image.complete))return false;
 const review=window.SpriteReview;
 if(review&&!(review.startupReady??(review.loaded.size+(review.failed||0)>=review.config.entries.length)))return false;
 if(!StartScreen.started||startDialog.open)return true;
 if(!G||!WORLD||cv.dataset.water==='preparing')return false;
 if(typeof land==='undefined'||land?._tiles!==G.tiles)return false;
 // The overview intentionally uses its low-detail terrain, not these chunks.
 if(UI.z>=.45){
  const sc=UI.sc,size=LAND_CHUNK*16;
  if(!(sc>0)||!cv.width||!cv.height)return false;
  const ox=Math.round(cv.width/2-UI.cam.x*sc),oy=Math.round(cv.height/2-UI.cam.y*sc);
  const x0=Math.max(0,Math.floor(Math.floor(-ox/sc)/size)),y0=Math.max(0,Math.floor(Math.floor(-oy/sc)/size));
  const x1=Math.min(Math.ceil(MAPW/LAND_CHUNK)-1,Math.floor(Math.ceil((cv.width-ox)/sc)/size));
  const y1=Math.min(Math.ceil(MAPH/LAND_CHUNK)-1,Math.floor(Math.ceil((cv.height-oy)/sc)/size));
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(!land.chunks.has(x+':'+y))return false;
 }
 return true;
}
(()=>{
 let pending=null;
 function present(screen){if(screen.showModal&&!screen.open){screen.showModal();screen.addEventListener('cancel',event=>event.preventDefault(),{once:true});}}
 const show=gameLoadingShow;
 gameLoadingShow=function(text){const screen=show(text);present(screen);return screen;};
 gameLoaded=function(onDone){
  const screen=document.getElementById('game-loading');
  if(!screen||screen.classList.contains('loaded')){onDone?.();return;}
  // Modal start menus are above ordinary z-index layers. Keep their loader
  // in the top layer as well, without changing the existing loader design.
  present(screen);
  if(pending?.screen===screen&&pending.token===screen.loadToken){if(onDone)pending.callbacks.push(onDone);return;}
  const state=pending={screen,token:screen.loadToken,callbacks:onDone?[onDone]:[],stable:0,last:performance.now()};
  screen.querySelector('progress').value=90;
  function poll(){
   if(pending!==state||!screen.isConnected||state.token!==screen.loadToken)return;
   const before=performance.now();let painted=true;
   // render() may explicitly retain the preceding frame while a worker runs.
   if(StartScreen.started&&!startDialog.open){try{painted=render()!==false;}catch(error){screen.querySelector('p').textContent='Laden fehlgeschlagen. Bitte lade die Seite erneut.';console.error(error);return;}}
   const now=performance.now(),ready=painted&&gameLoadingContentReady();
   // Permit normal 30/60 Hz drawing, but reset after a long main-thread stall.
   state.stable=ready&&now-state.last<100&&now-before<100?state.stable+1:0;state.last=now;
   screen.querySelector('progress').value=ready?97:90;
   if(state.stable<3){requestAnimationFrame(poll);return;}
   // Yield a task once more: input and queued initialization get a turn before
   // committing. Recheck at that boundary rather than hiding during a stall.
   setTimeout(()=>{
    if(pending!==state||state.token!==screen.loadToken||!screen.isConnected)return;
    if(performance.now()-now>=100||!gameLoadingContentReady()){state.stable=0;requestAnimationFrame(poll);return;}
    pending=null;screen.querySelector('progress').value=100;
    if(screen.open)screen.close();
    for(const callback of state.callbacks)callback();
    screen.classList.add('loaded');
    screen.dismissTimer=setTimeout(()=>{if(state.token===screen.loadToken)screen.remove();},450);
   },0);
  }
  requestAnimationFrame(poll);
 };
 // Initial menu dialogs live in the browser's top layer. Block their input as
 // well, even when they are visually above the ordinary loading overlay.
 const block=e=>{if(e.type==='keydown'&&(e.key==='F5'||(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='r'))return;const screen=document.getElementById('game-loading');if(screen&&!screen.classList.contains('loaded')){e.preventDefault();e.stopImmediatePropagation();}};
 for(const type of ['pointerdown','pointerup','click','dblclick','contextmenu','keydown','wheel'])addEventListener(type,block,{capture:true,passive:false});
})();
