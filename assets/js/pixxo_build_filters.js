/* Population relevance is distinct from unlock tier: prepare aristocrat chains as patricians. */
const BUILD_RELEVANCE={...BUILD_TIER};
for(const [id] of CIVIC_CHAINS)BUILD_RELEVANCE[id]=['sandgrube','kalkbrennerei','glashuette'].includes(id)?2:4;
Object.assign(BUILD_RELEVANCE,{rathaus:3,ausstellungspalast:4,garten:2,gemeinschaftshaus:3,brunnen:1});
function buildingPopulationTier(type){return BUILD_RELEVANCE[type]||1;}
const ROAD_MODES=[['path','Weg',1],['stone','Straße',2],['woodbridge','Holzbrücke',1],['stonebridge','Steinbrücke',2]];
function roadModesHTML(){return ROAD_MODES.map(([mode,name,tier])=>{const price=mode==='woodbridge'?{gold:4,bretter:3}:mode==='stonebridge'?{gold:10,holz:3,stein:3}:mode==='stone'?{gold:ROAD_COST+4,stein:1}:{gold:ROAD_COST},locked=tier===2&&!stoneRoadUnlocked(),icon=mode.includes('bridge')?url('bridge_icon_'+tier):url(mode==='stone'?'i_stoneroad':'i_road');return `<button type="button" class="bi ${(UI.roadMode||'path')===mode?'on':''}" data-road-mode="${mode}" data-pop-tier="${tier}" aria-pressed="${(UI.roadMode||'path')===mode}" ${locked?'disabled':''} aria-label="${name}${locked?': Steinbruch fehlt':''}"><img class="px" src="${icon}" alt=""><b>${name}</b><div class="cost">${costHTML(price)}</div><span class="sz">${mode.includes('bridge')?'je Flusskachel':'je Kachel'}</span></button>`;}).join('');}
for(const kind of [1,2])publishPixel('bridge_icon_'+kind,bridgeSprite(1,0,kind,'deck',true),24,24);
publishPixel('i_stoneroad',makePixelRoad(10,true,0),16,16);
const populationRenderItems=renderItems;renderItems=function(...args){
 const box=$('#items');if(UI.cat==='roads'){
  const focusedRoad=document.activeElement?.dataset?.roadMode,html=roadModesHTML();if(box._roadsHTML!==html||!box.querySelector('[data-road-mode]')){box._roadsHTML=html;box._last=null;box._itemCategory='roads';box.innerHTML=`<button type="button" class="item-scroll" data-item-scroll="left" aria-label="Vorherige Wege anzeigen" aria-controls="items-viewport" hidden>←</button><div id="items-viewport" class="items-viewport" role="group" aria-label="Wege und Brücken" tabindex="0"><div class="items-track">${html}</div></div><button type="button" class="item-scroll" data-item-scroll="right" aria-label="Weitere Wege anzeigen" aria-controls="items-viewport" hidden>→</button>`;if(focusedRoad)box.querySelector(`[data-road-mode="${focusedRoad}"]`)?.focus({preventScroll:true});}box.classList.add('show');document.body.classList.add('items');updateItemNavigation();document.getElementById('population-filters')?.remove();box.style.removeProperty('--population-min-width');return;
 }
 const focused=document.activeElement?.dataset?.populationFilter;populationRenderItems(...args);
 if(!UI.cat){document.getElementById('population-filters')?.remove();box.style.removeProperty('--population-min-width');return;}
 const cards=[...box.querySelectorAll('.bi[data-b]')].sort((a,b)=>buildingPopulationTier(a.dataset.b)-buildingPopulationTier(b.dataset.b)),track=box.querySelector('.items-track'),tiers=new Set(cards.map(c=>buildingPopulationTier(c.dataset.b))),highest=WORLD?.highestTier||1;
 for(const [index,card] of cards.entries())if(track.children[index]!==card)track.insertBefore(card,track.children[index]||null);
 // Measure the whole category before hiding cards: filters must not change
 // the tray height when their buildings have different cost/name row heights.
 const heightKey=UI.cat+':'+innerWidth+':'+getComputedStyle(box).fontSize;
 if(cards.length&&(box._populationHeightKey!==heightKey||box._populationHeightCard!==cards[0])){
  box.style.removeProperty('--population-track-height');
  for(const card of cards)card.hidden=false;
  const style=getComputedStyle(track),padding=style.boxSizing==='border-box'?parseFloat(style.paddingTop)+parseFloat(style.paddingBottom):0;
  box.style.setProperty('--population-track-height',Math.ceil(Math.max(...cards.map(card=>card.getBoundingClientRect().height))+padding)+'px');
  box._populationHeightKey=heightKey;box._populationHeightCard=cards[0];
 }
 const categoryChanged=UI.populationCategory!==UI.cat;if(categoryChanged){UI.populationCategory=UI.cat;UI.populationFilter=0;}
 const enabled=highest>=2&&tiers.size>1;
 if(!enabled||!tiers.has(UI.populationFilter))UI.populationFilter=0;
 for(const card of cards){const tier=buildingPopulationTier(card.dataset.b);card.dataset.popTier=tier;card.hidden=!!UI.populationFilter&&tier!==UI.populationFilter;
  card.querySelector('.population-badge')?.remove();const suffix=' · '+TIERS[tier].n,label=card.getAttribute('aria-label')||'';if(!label.includes(suffix))card.setAttribute('aria-label',label+suffix);card.removeAttribute('title');
 }
 let filter=document.getElementById('population-filters');if(enabled){if(!filter){filter=document.createElement('div');filter.id='population-filters';filter.setAttribute('role','group');filter.setAttribute('aria-label','Gebäude nach Bevölkerungsstufe filtern');filter.tabIndex=0;box.before(filter);}
  const selected=UI.populationFilter||0,html=[[0,'Alle'],...TIERS.filter(t=>t&&t.id<=highest&&tiers.has(t.id)).map(t=>[t.id,t.n])].map(([tier,label])=>`<button type="button" data-population-filter="${tier}" data-pop-tier="${tier}" aria-controls="items-viewport" aria-pressed="${selected===tier}">${label}</button>`).join('');
  if(filter.innerHTML!==html){filter.innerHTML=html;if(focused!==undefined)filter.querySelector(`[data-population-filter="${focused}"]`)?.focus({preventScroll:true});}
  box.style.setProperty('--population-min-width',Math.ceil([...filter.children].reduce((n,b)=>n+b.getBoundingClientRect().width,0)+Math.max(0,filter.children.length-1)*8+16)+'px');
  const rect=box.getBoundingClientRect();filter.style.left=rect.left+'px';filter.style.bottom=innerHeight-rect.top-2+'px';filter.style.maxWidth=rect.width+'px';
 }else {filter?.remove();box.style.removeProperty('--population-min-width');}
 box.querySelector('.population-empty')?.remove();updateItemNavigation();
};
document.addEventListener('click',e=>{const b=e.target.closest('[data-population-filter]');if(!b)return;UI.populationFilter=Number(b.dataset.populationFilter);renderItems(true);},true);
$('#bar').addEventListener('click',e=>{const button=e.target.closest('[data-tool="road"]');if(!button)return;e.preventDefault();e.stopImmediatePropagation();if(UI.cat==='roads'){UI.cat=null;setTool(null);}else{UI.cat='roads';setTool('road');}},true);
$('#items').addEventListener('click',e=>{const button=e.target.closest('[data-road-mode]');if(!button||button.disabled)return;UI.roadMode=button.dataset.roadMode;setTool('road');renderItems(true);});
const populationSetTool=setTool;setTool=function(t,...args){if(t==='road')UI.cat='roads';else if(UI.cat==='roads')UI.cat=null;const result=populationSetTool(t,...args);updateRiverPlanSummary();return result;};
const populationRenderBar=renderBar;renderBar=function(...args){const r=populationRenderBar(...args);$('#bar [data-tool="road"]')?.classList.toggle('on',UI.cat==='roads');return r;};
addEventListener('resize',()=>{if(G)renderItems(true);});
