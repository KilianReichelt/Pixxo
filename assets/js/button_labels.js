/* Shared in-game tooltips. Legacy title attributes are migrated as elements appear. */
const gameTooltip=document.createElement('div');gameTooltip.id='game-tooltip';gameTooltip.hidden=true;gameTooltip.setAttribute('role','tooltip');document.body.append(gameTooltip);
let gameTooltipSource=null,gameTooltipTimer;
function removeButtonTitles(node){
 if(node.nodeType!==1)return;
 const titles=node.matches('[title]')?[node,...node.querySelectorAll('[title]')]:[...node.querySelectorAll('[title]')];
 for(const element of titles){const text=element.getAttribute('title').trim();if(text)element.dataset.gameTooltip=text;else delete element.dataset.gameTooltip;
  if(text&&element.matches('button,[role="button"],input[type="button"],input[type="submit"]')&&!element.hasAttribute('aria-label')&&!element.hasAttribute('aria-labelledby')&&!element.textContent.trim())element.setAttribute('aria-label',text);element.removeAttribute('title');
 }
 for(const title of node.querySelectorAll('svg title')){const parent=title.parentElement,text=title.textContent.trim();if(text&&!parent.dataset.gameTooltip)parent.dataset.gameTooltip=text;const desc=document.createElementNS('http://www.w3.org/2000/svg','desc');for(const attr of title.attributes)desc.setAttribute(attr.name,attr.value);desc.textContent=title.textContent;title.replaceWith(desc);}
}
function tooltipSourceFor(target){if(!(target instanceof Element)||target.closest('.bi.dock-card'))return null;if(target===cv&&typeof buildingStatusTooltipSource==='function')return buildingStatusTooltipSource();const source=target.closest('[data-game-tooltip],[title]');if(source?.hasAttribute('title'))removeButtonTitles(source);return source?.dataset.gameTooltip?.trim()?source:null;}
function hideGameTooltip(){clearTimeout(gameTooltipTimer);if(gameTooltipSource){const ids=(gameTooltipSource.getAttribute('aria-describedby')||'').split(/\s+/).filter(id=>id&&id!==gameTooltip.id);if(ids.length)gameTooltipSource.setAttribute('aria-describedby',ids.join(' '));else gameTooltipSource.removeAttribute('aria-describedby');}gameTooltipSource=null;gameTooltip.hidden=true;}
function positionGameTooltip(){
 if(!gameTooltipSource?.isConnected||gameTooltipSource.closest('[hidden],[inert]')){hideGameTooltip();return;}
 const a=gameTooltipSource.getBoundingClientRect(),b=gameTooltip.getBoundingClientRect();gameTooltip.style.left=Math.max(8,Math.min(a.left+a.width/2-b.width/2,innerWidth-b.width-8))+'px';gameTooltip.style.top=Math.max(8,Math.min(a.top-b.height-8>=8?a.top-b.height-8:a.bottom+8,innerHeight-b.height-8))+'px';
}
function showGameTooltip(source,immediate=false){
 if(!source){hideGameTooltip();return;}
 if(source===gameTooltipSource&&!(immediate&&gameTooltip.hidden)){if(!gameTooltip.hidden){gameTooltip.textContent=source.dataset.gameTooltip;positionGameTooltip();}return;}
 hideGameTooltip();gameTooltipSource=source;const reveal=()=>{if(gameTooltipSource!==source||!source.isConnected)return;const host=source.closest('dialog[open]')||document.body;if(gameTooltip.parentElement!==host)host.append(gameTooltip);gameTooltip.textContent=source.dataset.gameTooltip;gameTooltip.hidden=false;const ids=new Set((source.getAttribute('aria-describedby')||'').split(/\s+/).filter(Boolean));ids.add(gameTooltip.id);source.setAttribute('aria-describedby',[...ids].join(' '));positionGameTooltip();};
 if(immediate)reveal();else gameTooltipTimer=setTimeout(reveal,140);
}
removeButtonTitles(document.documentElement);
new MutationObserver(records=>{
 for(const record of records){if(record.type==='attributes'){if(record.attributeName==='title'&&record.target.hasAttribute('title'))removeButtonTitles(record.target);if(record.target===gameTooltipSource&&!gameTooltip.hidden){if(record.target.dataset.gameTooltip){gameTooltip.textContent=record.target.dataset.gameTooltip;positionGameTooltip();}else hideGameTooltip();}}else for(const node of record.addedNodes)removeButtonTitles(node);}
 if(gameTooltipSource&&!gameTooltipSource.isConnected)hideGameTooltip();
}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['title','data-game-tooltip']});
document.addEventListener('pointerover',e=>showGameTooltip(tooltipSourceFor(e.target)));
document.addEventListener('pointermove',e=>{const source=tooltipSourceFor(e.target);if(source!==gameTooltipSource)showGameTooltip(source);else if(!gameTooltip.hidden)positionGameTooltip();});
document.addEventListener('pointerout',e=>{if(tooltipSourceFor(e.relatedTarget)!==gameTooltipSource)hideGameTooltip();});
document.addEventListener('focusin',e=>showGameTooltip(tooltipSourceFor(e.target),true));
document.addEventListener('focusout',hideGameTooltip);document.addEventListener('pointerdown',hideGameTooltip,true);document.addEventListener('scroll',e=>{if(gameTooltipSource&&(e.target===document||e.target instanceof Element&&e.target.contains(gameTooltipSource)))hideGameTooltip();},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape')hideGameTooltip();});addEventListener('blur',hideGameTooltip);addEventListener('resize',hideGameTooltip);
