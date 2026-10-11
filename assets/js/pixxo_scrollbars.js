/* Browser-independent pixel scrollbars; wheel/native scrolling stays intact. */
const PIXXO_SCROLL_TARGETS='.wb,.trade-route-left,.trade-goods-grid,#production-preview,.production-graph-scroll,.save-feedback,.clock-popup,.new-game-dialog,#pixxo-start,#tour-content,#pixxo-tour,#goodsbar,#population-filters,.worldmapscroll';
const pixelScrollbars=new Map();let pixelScrollbarFrame=0,pixelScrollbarId=0;
function schedulePixelScrollbars(){if(!pixelScrollbarFrame)pixelScrollbarFrame=requestAnimationFrame(updatePixelScrollbars);}
function createPixelScrollbar(el,axis){
 const rail=document.createElement('div');rail.className='pixxo-scrollbar '+(axis==='y'?'vertical':'horizontal');
 const thumb=document.createElement('button');thumb.type='button';thumb.className='pixxo-scroll-thumb';thumb.setAttribute('role','scrollbar');thumb.setAttribute('aria-orientation',axis==='y'?'vertical':'horizontal');thumb.setAttribute('aria-label',axis==='y'?'Inhalt vertikal scrollen':'Inhalt horizontal scrollen');
 if(!el.id)el.id='pixxo-scroll-'+(++pixelScrollbarId);thumb.setAttribute('aria-controls',el.id);rail.append(thumb);
 const state={el,axis,rail,thumb,length:0,thumbLength:0,max:0,drag:null};
 const get=()=>axis==='y'?el.scrollTop:el.scrollLeft,set=value=>{if(axis==='y')el.scrollTop=value;else el.scrollLeft=value;schedulePixelScrollbars();};
 thumb.addEventListener('keydown',e=>{const size=axis==='y'?el.clientHeight:el.clientWidth,actions={ArrowDown:40,ArrowRight:40,ArrowUp:-40,ArrowLeft:-40,PageDown:size*.9,PageUp:-size*.9};if(e.key in actions){e.preventDefault();set(get()+actions[e.key]);}else if(e.key==='Home'||e.key==='End'){e.preventDefault();set(e.key==='Home'?0:state.max);}});
 thumb.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();thumb.focus({preventScroll:true});state.drag={pointer:e.pointerId,start:axis==='y'?e.clientY:e.clientX,scroll:get()};thumb.setPointerCapture(e.pointerId);});
 thumb.addEventListener('pointermove',e=>{const d=state.drag;if(!d||d.pointer!==e.pointerId)return;e.preventDefault();const delta=(axis==='y'?e.clientY:e.clientX)-d.start;set(d.scroll+delta*state.max/Math.max(1,state.length-state.thumbLength));});
 const stop=e=>{if(state.drag?.pointer===e.pointerId)state.drag=null;};for(const event of ['pointerup','pointercancel','lostpointercapture'])thumb.addEventListener(event,stop);
 rail.addEventListener('pointerdown',e=>{if(e.target!==rail||e.button!==0)return;const rect=thumb.getBoundingClientRect(),before=axis==='y'?e.clientY<rect.top:e.clientX<rect.left;set(get()+(before?-1:1)*(axis==='y'?el.clientHeight:el.clientWidth)*.9);});
 rail.addEventListener('wheel',e=>{e.preventDefault();set(get()+(axis==='y'?e.deltaY:e.deltaX||e.deltaY));},{passive:false});
 return state;
}
const pixelScrollResize=new ResizeObserver(schedulePixelScrollbars);
function updatePixelScrollbars(){
 pixelScrollbarFrame=0;
 for(const [el,entry] of pixelScrollbars)if(!el.isConnected){entry.x.rail.remove();entry.y.rail.remove();pixelScrollResize.unobserve(el);pixelScrollbars.delete(el);}
 for(const el of document.querySelectorAll(PIXXO_SCROLL_TARGETS))if(!pixelScrollbars.has(el)){
 const style=getComputedStyle(el),entry={x:createPixelScrollbar(el,'x'),y:createPixelScrollbar(el,'y')};
 el.style.setProperty('--pixxo-scroll-pad-right',style.paddingRight);el.style.setProperty('--pixxo-scroll-pad-bottom',style.paddingBottom);
 pixelScrollbars.set(el,entry);pixelScrollResize.observe(el);
 }
 const modals=[...document.querySelectorAll('dialog[open]')],modal=modals[modals.length-1];
 for(const [el,entry] of pixelScrollbars){
 const css=getComputedStyle(el),rect=el.getBoundingClientRect(),visible=el.getClientRects().length&&rect.width>0&&rect.height>0&&(!modal||el===modal||modal.contains(el));
 const y=visible&&/auto|scroll/.test(css.overflowY)&&el.scrollHeight>el.clientHeight+1,x=visible&&/auto|scroll/.test(css.overflowX)&&el.scrollWidth>el.clientWidth+1;
 el.classList.add('pixxo-scroll-surface');el.classList.toggle('pixxo-scroll-y',!!y);el.classList.toggle('pixxo-scroll-x',!!x);
 const host=el.closest('dialog[open],.win,#production-preview,.clock-popup,#pixxo-tour')||document.body,windowEl=el.closest('.win'),z=windowEl?parseInt(getComputedStyle(windowEl).zIndex)||100:parseInt(css.zIndex)||60;
 for(const state of [entry.x,entry.y]){
 const vertical=state.axis==='y',active=vertical?y:x,rail=state.rail;rail.hidden=!active;if(!active)continue;
 if(rail.parentNode!==host)host.append(rail);
 const size=vertical?el.clientHeight:el.clientWidth,content=vertical?el.scrollHeight:el.scrollWidth,position=vertical?el.scrollTop:el.scrollLeft;
 state.length=Math.max(24,size-(vertical?Number(x):Number(y))*14-4);state.max=Math.max(0,content-size);state.thumbLength=Math.min(state.length,Math.max(32,Math.floor(state.length*size/content)));
 rail.style.cssText='left:'+Math.round(vertical?rect.right-24-(parseFloat(css.borderRightWidth)||0):rect.left+(parseFloat(css.borderLeftWidth)||0))+'px;top:'+Math.round(vertical?rect.top+(parseFloat(css.borderTopWidth)||0):rect.bottom-24-(parseFloat(css.borderBottomWidth)||0))+'px;'+(vertical?'height:':'width:')+(state.length+4)+'px;z-index:'+(z+1);
 state.thumb.style.cssText=(vertical?'height:':'width:')+state.thumbLength+'px;transform:translate'+(vertical?'Y':'X')+'('+Math.round(position/state.max*(state.length-state.thumbLength))+'px)';
 state.thumb.setAttribute('aria-valuemin','0');state.thumb.setAttribute('aria-valuemax',String(Math.round(state.max)));state.thumb.setAttribute('aria-valuenow',String(Math.round(position)));
 }
 }
}
new MutationObserver(records=>{if(records.some(r=>!r.target.closest?.('.pixxo-scrollbar')&&[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1&&!n.classList?.contains('pixxo-scrollbar'))))schedulePixelScrollbars();}).observe(document.body,{childList:true,subtree:true});
document.addEventListener('scroll',schedulePixelScrollbars,true);window.addEventListener('resize',schedulePixelScrollbars);
document.addEventListener('pointermove',e=>{if(e.buttons)schedulePixelScrollbars();});document.addEventListener('click',schedulePixelScrollbars,true);document.addEventListener('keydown',schedulePixelScrollbars,true);
schedulePixelScrollbars();
