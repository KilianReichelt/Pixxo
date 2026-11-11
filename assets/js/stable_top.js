/* Live values change; panel surfaces, SVG contours and focused buttons persist. */
function patchTopAttributes(current,next){for(const a of next.attributes){const name=a.name==='title'?'data-game-tooltip':a.name;if(current.getAttribute(name)!==a.value)current.setAttribute(name,a.value);}}
function patchTopValue(current,next){
 if(current.nodeType===Node.TEXT_NODE){if(current.nodeValue!==next.nodeValue)current.nodeValue=next.nodeValue;return;}
 patchTopAttributes(current,next);
 const a=[...current.childNodes],b=[...next.childNodes];
 if(a.length!==b.length||a.some((n,i)=>n.nodeType!==b[i].nodeType||n.nodeName!==b[i].nodeName)){current.replaceChildren(...b.map(n=>n.cloneNode(true)));return;}
 for(let i=0;i<a.length;i++)patchTopValue(a[i],b[i]);
}
function updateStableTop(top,html){
 if(!top.querySelector('.top-panel')){top.innerHTML=html;return;}
 const template=document.createElement('template');template.innerHTML=html;const content=template.content;
 for(const selector of ['.chip.gold','.chip.pop']){const current=top.querySelector(selector),next=content.querySelector(selector);if(current&&next)patchTopValue(current,next);}
 const knowledge=content.querySelector('.knowledge'),currentKnowledge=top.querySelector('.knowledge');
 if(knowledge&&currentKnowledge)patchTopValue(currentKnowledge,knowledge);
 else if(knowledge){let group=top.querySelector('.top-knowledge');if(!group){group=document.createElement('div');group.className='top-group top-knowledge';top.querySelector('.top-panel-right').prepend(group);}group.append(knowledge);}
 else currentKnowledge?.closest('.top-knowledge')?.remove();
 const speeds=top.querySelectorAll('.speeds button'),nextSpeeds=content.querySelectorAll('.speeds button');for(let i=0;i<speeds.length;i++)if(nextSpeeds[i])patchTopAttributes(speeds[i],nextSpeeds[i]);
 for(const next of content.querySelectorAll('.navbtn[data-w]:not(.worldname)')){const current=top.querySelector('.top-navigation [data-w="'+next.dataset.w+'"]');if(current)patchTopAttributes(current,next);}
 const goods=top.querySelector('#goodsbar'),nextGoods=content.querySelector('#goodsbar');if(goods&&nextGoods&&goods.getAttribute('aria-label')!==nextGoods.getAttribute('aria-label'))goods.setAttribute('aria-label',nextGoods.getAttribute('aria-label'));
}
