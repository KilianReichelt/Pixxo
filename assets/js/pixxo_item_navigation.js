/* Seitliche Pfeile ersetzen die sichtbare Scrollleiste der Gebäudeliste. */
function updateItemNavigation(){
 const box=$('#items'),viewport=box?.querySelector('.items-viewport'),track=box?.querySelector('.items-track');if(!viewport||!track)return;
 const overflow=track.scrollWidth>box.clientWidth-16;box.classList.toggle('has-item-overflow',overflow);
 const max=Math.max(0,viewport.scrollWidth-viewport.clientWidth);for(const button of box.querySelectorAll('[data-item-scroll]')){button.hidden=!overflow;button.disabled=button.dataset.itemScroll==='left'?viewport.scrollLeft<=1:viewport.scrollLeft>=max-1;}
}
let itemDrag=null,itemDragClick=false;
const itemNavigationRender=renderItems;renderItems=function(...args){
 if(itemDrag)return;
 const box=$('#items'),scroll=box?.querySelector('.items-viewport')?.scrollLeft||0,category=box?._itemCategory;itemNavigationRender(...args);if(!box||!UI.cat)return;
 if(!box.querySelector('.items-viewport')){
  const cards=box.innerHTML;box.innerHTML=`<button type="button" class="item-scroll" data-item-scroll="left" aria-label="Vorherige Gebäude anzeigen" aria-controls="items-viewport" hidden>←</button><div id="items-viewport" class="items-viewport" role="group" aria-label="Gebäudeliste" tabindex="0"><div class="items-track">${cards}</div></div><button type="button" class="item-scroll" data-item-scroll="right" aria-label="Weitere Gebäude anzeigen" aria-controls="items-viewport" hidden>→</button>`;
  box.querySelector('.items-viewport').scrollLeft=category===UI.cat?scroll:0;
 }
 box._itemCategory=UI.cat;updateItemNavigation();
};
function scrollBuildingItems(direction){const viewport=$('#items')?.querySelector('.items-viewport');if(!viewport)return;viewport.scrollBy({left:direction*Math.max(178,Math.floor(viewport.clientWidth*.8)),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}
$('#items').addEventListener('click',e=>{const button=e.target.closest('[data-item-scroll]');if(button&&!button.disabled){scrollBuildingItems(button.dataset.itemScroll==='left'?-1:1);}});
$('#items').addEventListener('scroll',updateItemNavigation,true);
$('#items').addEventListener('keydown',e=>{if(!e.target.matches('.items-viewport'))return;const viewport=e.target;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();scrollBuildingItems(e.key==='ArrowLeft'?-1:1);}else if(e.key==='Home'||e.key==='End'){e.preventDefault();viewport.scrollLeft=e.key==='Home'?0:viewport.scrollWidth;updateItemNavigation();}});
new ResizeObserver(updateItemNavigation).observe($('#items'));
const itemDragBox=$('#items');
itemDragBox.addEventListener('pointerdown',e=>{
 if(!e.isPrimary||e.button!==0||e.pointerType==='touch'||e.target.closest('[data-item-scroll]'))return;
 const viewport=e.target.closest('.items-viewport');if(!viewport||viewport.scrollWidth<=viewport.clientWidth)return;
 itemDragClick=false;itemDrag={pointer:e.pointerId,viewport,x:e.clientX,scroll:viewport.scrollLeft,dragged:false};
});
itemDragBox.addEventListener('pointermove',e=>{
 const drag=itemDrag;if(!drag||drag.pointer!==e.pointerId)return;
 const dx=e.clientX-drag.x;if(!drag.dragged&&Math.abs(dx)<6)return;
 if(!drag.dragged){drag.dragged=true;drag.viewport.setPointerCapture(e.pointerId);drag.viewport.classList.add('is-dragging');}
 e.preventDefault();drag.viewport.scrollLeft=Math.max(0,Math.min(drag.viewport.scrollWidth-drag.viewport.clientWidth,drag.scroll-dx));updateItemNavigation();
});
function finishItemDrag(e){
 const drag=itemDrag;if(!drag||drag.pointer!==e.pointerId)return;
 itemDrag=null;itemDragClick=drag.dragged;drag.viewport.classList.remove('is-dragging');
 renderItems(true);
 if(drag.viewport.hasPointerCapture(e.pointerId))drag.viewport.releasePointerCapture(e.pointerId);
}
itemDragBox.addEventListener('pointerup',finishItemDrag);
itemDragBox.addEventListener('pointercancel',finishItemDrag);
itemDragBox.addEventListener('pointerleave',()=>{if(itemDrag&&!itemDrag.dragged)itemDrag=null;});
itemDragBox.addEventListener('lostpointercapture',finishItemDrag);
itemDragBox.addEventListener('click',e=>{if(itemDragClick&&e.detail!==0){itemDragClick=false;e.preventDefault();e.stopImmediatePropagation();}},true);
itemDragBox.addEventListener('dragstart',e=>{if(e.target.closest('.items-viewport'))e.preventDefault();});
