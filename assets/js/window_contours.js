/* Gemeinsame Konturen für gerahmte GUI: große Fenster gemischt, kompakte Elemente rund. */
const WINDOW_CONTOUR_SELECTOR='.win,.sidegroup,.start-card,.save-feedback,#game-tour,#trade-route-dialog,.new-game-dialog,.clock-popup,#production-overview,#production-building-preview,#mmw,#islandfacts,.top-panel,.top-location,#sidebar,#bar,.bi,.building-search,.item-scroll,#desktop-controls,.dock-tabs,#population-filters';
const windowContours=new Map(),windowContourRoots=new Set([document.body]);let windowContourFrame=0;
function windowContourPath(w,h,r,profile='concave'){
 const l=.5,t=.5,x=w-.5,y=h-.5;r=Math.max(0,Math.min(r,(w-1)/2,(h-1)/2));
 const corners=({round:['round','round','round','round'],round6:['round','round','round','round'],mixed:['concave','concave','round','round'],reverse:['round','round','concave','concave'],'top-concave':['concave','concave','square','square'],'bottom-round':['square','square','round','round'],'top-round':['round','round','square','square'],'panel-left':['square','square','concave','square'],'panel-center':['square','square','concave','concave'],'panel-right':['square','square','square','concave']})[profile]||['concave','concave','concave','concave'];
 const [tl,tr,br,bl]=corners,rt=k=>k==='square'?0:r;
 const corner=(kind,cx,cy,ex,ey)=>kind==='square'?'L'+ex+','+ey:kind==='concave'?'A'+r+','+r+' 0 0 0 '+ex+','+ey:'Q'+cx+','+cy+' '+ex+','+ey;
 return 'M'+(l+rt(tl))+','+t+'H'+(x-rt(tr))+corner(tr,x,t,x,t+rt(tr))+'V'+(y-rt(br))+corner(br,x,y,x-rt(br),y)+'H'+(l+rt(bl))+corner(bl,l,y,l,y-rt(bl))+'V'+(t+rt(tl))+corner(tl,l,t,l+rt(tl),t)+'Z';
}
function compactWindowControl(el){return !el.closest('#top,#bar')&&!el.matches('.deposit-jump')&&(el.matches('button,.btn,[role="button"],[role="tooltip"],.trade-tooltip,.need-unlock-tooltip,#house-supply-popup')||el.matches('.px.big,.tag,.tn')&&el.closest('.win,.start-card,#game-start,#session-menu'));}
function unclippedWindowControl(el){return el.matches('button,.btn,[role="button"],[role="tooltip"],.trade-tooltip,.need-unlock-tooltip,#house-supply-popup');}
function windowContourProfile(el){if(el.matches('.top-panel-left'))return 'panel-left';if(el.matches('.top-panel-center,.top-location'))return 'panel-center';if(el.matches('.top-panel-right'))return 'panel-right';if(compactWindowControl(el))return 'round6';if(el.id==='top')return 'reverse';if(el.matches('#sidebar,.sidebar'))return 'round6';if(el.matches('#mmw,#population-filters'))return 'bottom-round';if(el.id==='islandfacts')return 'top-concave';if(el.matches('.dock-tabs'))return 'top-round';if(el.matches('.bi,.building-search,.item-scroll,#desktop-controls'))return 'round6';return el.matches('.win,.sidegroup,.start-card,.save-feedback,#game-tour,.new-game-dialog,.clock-popup,#production-overview,#production-building-preview,#trade-route-dialog,#bar,#sidebar')?'mixed':'round';}
function scheduleWindowContours(){if(!windowContourFrame)windowContourFrame=requestAnimationFrame(updateWindowContours);}
const windowContourResize=new ResizeObserver(scheduleWindowContours);

// Approved16October: only the existing outer line of top/dock receives a fade.
// Keep the first/last SVG paths stable for the shared sizing code.
function installBrassContour(el,svg){
 if(!['top','bar'].includes(el.id)&&!el.matches('.top-panel,.top-location'))return;
 const defs=document.createElementNS('http://www.w3.org/2000/svg','defs'),id='game-brass-contour-'+(el.id||el.classList[1]);
 defs.innerHTML='<linearGradient id="'+id+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--game-frame-brass)" stop-opacity=".78"/><stop offset="21%" stop-color="var(--game-frame-brass)" stop-opacity=".351"/><stop offset="42%" stop-color="var(--game-frame-brass)" stop-opacity="0"/><stop offset="58%" stop-color="var(--game-frame-brass)" stop-opacity="0"/><stop offset="79%" stop-color="var(--game-frame-brass)" stop-opacity=".351"/><stop offset="1" stop-color="var(--game-frame-brass)" stop-opacity=".78"/></linearGradient>';
 svg.firstElementChild.after(defs);svg.firstElementChild.style.stroke='url(#'+id+')';
}

function registerWindowContour(el){
 // Frequently refreshed controls use their CSS border from the very first
 // paint. Attaching/removing an SVG rim on each refresh changed their geometry.
 if(el instanceof HTMLElement&&(el.matches('.pb,.pb *,.loan-progress,.loan-progress *,img.px.big,img.pix.big,.tag,.tn')||compactWindowControl(el)&&unclippedWindowControl(el)))return;
 if(el.matches?.('#top,[role="tooltip"],.trade-tooltip,.need-unlock-tooltip,#house-supply-popup,#game-loading,#game-loading *,#bar #items,#top button,#top button *,.sidetab,.sidetab *,.wt,.sidepanel header,#islandfacts .factsummary *,.energy-node-circle,.building-icon-badge,.house-need-progress')||windowContours.has(el)||!(el instanceof HTMLElement)||el.matches('html,body,script,style,link,option')||el.closest('svg'))return;
 const style=getComputedStyle(el),explicit=el.matches(WINDOW_CONTOUR_SELECTOR);
 const framed=['Top','Right','Bottom','Left'].every(side=>parseFloat(style['border'+side+'Width'])>0&&!['none','hidden'].includes(style['border'+side+'Style']));
 if(!explicit&&!framed)return;
 // Inputs cannot own an SVG child; native control content remains intact.
 if(el.matches('input,select,textarea,progress,meter,img,canvas')){el.dataset.controlContour='round';return;}
 const profile=windowContourProfile(el),overflow=el.matches('.top-panel,#sidebar,#bar,#islandfacts');
 if(style.position==='static')el.style.position='relative';
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('window-contour');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');svg.setAttribute('preserveAspectRatio','none');svg.innerHTML='<path class="window-contour-line"/><path class="window-contour-shimmer"/>';
 installBrassContour(el,svg);
 windowContours.set(el,{svg,signature:'',profile,overflow});windowContourResize.observe(el);el.dataset.windowContour=profile;if(overflow){el.style.setProperty('--contour-surface-background',style.background);if(el.matches('#sidebar,.sidebar'))el.style.setProperty('--contour-surface-image','none');el.dataset.contourOverflow='visible';}el.append(svg);
}
function updateWindowContours(){
 windowContourFrame=0;
 for(const root of windowContourRoots){if(!root.isConnected)continue;registerWindowContour(root);for(const el of root.querySelectorAll('*'))registerWindowContour(el);}windowContourRoots.clear();
 for(const el of document.querySelectorAll(WINDOW_CONTOUR_SELECTOR))registerWindowContour(el);
 for(const [el,state] of windowContours){
  if(!el.isConnected||el.matches('#bar #items')){windowContourResize.unobserve(el);windowContours.delete(el);state.svg.remove();delete el.dataset.windowContour;el.style.removeProperty('clip-path');continue;}
  if(state.svg.parentElement!==el)el.append(state.svg);
  const w=el.offsetWidth,h=el.offsetHeight;if(w<2||h<2)continue;
  state.profile=windowContourProfile(el);el.dataset.windowContour=state.profile;
  const r=Math.min(state.profile==='round6'?6:WORLD_VIEW_DEFAULTS.cornerSize,(Math.min(w,h)-1)/2),signature=[w,h,r,state.profile].join(':');
  const style=getComputedStyle(el),borderLeft=parseFloat(style.borderLeftWidth)||0,borderTop=parseFloat(style.borderTopWidth)||0;
  state.svg.style.left=(el.scrollLeft-borderLeft)+'px';state.svg.style.top=(el.scrollTop-borderTop)+'px';
  if(state.signature===signature)continue;state.signature=signature;state.svg.style.width=w+'px';state.svg.style.height=h+'px';state.svg.setAttribute('viewBox','0 0 '+w+' '+h);state.svg.setAttribute('width',w);state.svg.setAttribute('height',h);
  const contour=windowContourPath(w,h,r,state.profile);state.svg.firstElementChild.setAttribute('d',contour);state.svg.lastElementChild.setAttribute('d',windowContourPath(w-4,h-4,Math.max(1,r-2),state.profile));state.svg.lastElementChild.setAttribute('transform','translate(2 2)');
  if(state.overflow){el.style.setProperty('--contour-surface-path','path("'+contour+'")');}else if(unclippedWindowControl(el)){el.style.removeProperty('clip-path');}else el.style.clipPath='path("'+contour+'")';
 }
}
new MutationObserver(records=>{let changed=false;for(const record of records){if(record.target.closest?.('.window-contour'))continue;if(record.type==='attributes'){if(record.oldValue===record.target.getAttribute('class'))continue;windowContourRoots.add(record.target);changed=true;}else for(const node of [...record.addedNodes,...record.removedNodes])if(node.nodeType===1&&!node.classList?.contains('window-contour')){if(node.isConnected)windowContourRoots.add(node);changed=true;}}if(changed)scheduleWindowContours();}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class'],attributeOldValue:true});
document.addEventListener('scroll',e=>{if(windowContours.has(e.target))scheduleWindowContours();},true);scheduleWindowContours();
