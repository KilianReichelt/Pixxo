/* Recipe graph built only on demand; no work in the world render loop. */
const productionPreview=document.createElement('aside');productionPreview.id='production-preview';productionPreview.hidden=true;productionPreview.tabIndex=0;productionPreview.setAttribute('role','region');productionPreview.setAttribute('aria-label','Produktionskette');document.body.append(productionPreview);
let productionPreviewCard=null,productionPreviewTimer,productionPreviewContext='';
function productionGraph(type){
 const highest=WORLD?.highestTier||1;
 const recipes=Object.entries(B).filter(([id,d])=>d.kind==='prod'&&d.out&&Object.keys(d.out).length&&buildingPopulationTier(id)<=highest);
 const current=new Set(B[type]?.kind==='prod'&&buildingPopulationTier(type)<=highest?Object.keys(B[type].out||{}):[]);if(!current.size)return null;
 const goods=new Set(current),selected=new Set();
 // Follow the selected product to its consumers, then include their ingredients.
 let changed=true;while(changed){changed=false;for(const [id,d] of recipes)if(Object.keys(d.in||{}).some(g=>goods.has(g))||id===type){selected.add(id);for(const g of Object.keys(d.out))if(!goods.has(g)){goods.add(g);changed=true;}}}
 changed=true;while(changed){changed=false;for(const [id,d] of recipes)if(Object.keys(d.out).some(g=>goods.has(g))){selected.add(id);for(const g of Object.keys(d.in||{}))if(!goods.has(g)){goods.add(g);changed=true;}}}
 const edges=new Map(),blocked=new Set();
 for(const id of selected){const d=B[id];for(const output of Object.keys(d.out)){if(!goods.has(output))continue;const producers=recipes.filter(([,p])=>p.out[output]);if(producers.length&&producers.every(([,p])=>p.fertility&&!islandMeta().fert.includes(p.fertility)))blocked.add(output);for(const input of Object.keys(d.in||{}))if(goods.has(input))edges.set(input+'>'+output,[input,output]);}}
 const ranks=new Map([...goods].map(g=>[g,0]));
 // Cyclic mod recipes remain bounded rather than stalling the UI.
 for(let pass=0;pass<goods.size;pass++){let moved=false;for(const [a,b] of edges.values())if(ranks.get(b)<=ranks.get(a)&&ranks.get(a)<goods.size-1){ranks.set(b,ranks.get(a)+1);moved=true;}if(!moved)break;}
 return {goods:[...goods],current,edges:[...edges.values()],blocked,ranks};
}
function positionProductionPreview(){
 if(productionPreview.hidden)return;
 const decorative=productionPreviewCard?.matches('.deko-card'),tray=decorative?productionPreviewCard.getBoundingClientRect():document.getElementById('items').getBoundingClientRect(),filter=decorative?null:document.getElementById('population-filters')?.getBoundingClientRect(),gap=8;
 productionPreview.style.maxWidth=Math.max(0,innerWidth-16)+'px';
 const width=productionPreview.getBoundingClientRect().width;
 let left=filter?filter.right+gap:tray.left;
 const beside=!filter||left+width<=innerWidth-8,bottom=beside?(filter?.bottom??tray.top):(filter.top-gap);
 if(!beside)left=tray.left;
 // Use the available screen height; short chains keep their natural height.
 productionPreview.style.maxHeight=Math.max(100,bottom-8)+'px';
 const height=productionPreview.getBoundingClientRect().height;
 productionPreview.style.left=Math.max(8,Math.min(left,innerWidth-width-8))+'px';productionPreview.style.top=Math.max(8,bottom-height)+'px';
}
function hideProductionPreview(){clearTimeout(productionPreviewTimer);productionPreview.hidden=true;productionPreviewCard?.removeAttribute('aria-details');productionPreviewCard=null;}
function showProductionPreview(card){
 clearTimeout(productionPreviewTimer);const type=card.dataset.b,d=B[type],graph=productionGraph(type);productionPreviewContext=activeIsland+':'+islandMeta().fert.join(',')+':'+(WORLD?.highestTier||1);productionPreview.setAttribute('aria-label',graph?'Produktionskette':'Gebäudebeschreibung');if(!d){hideProductionPreview();return;}
 if(!graph){productionPreviewCard?.removeAttribute('aria-details');productionPreviewCard=card;card.setAttribute('aria-details','production-preview');productionPreview.innerHTML='<strong id="production-node-name">'+esc(d.n)+'</strong><p class="production-description">'+esc(d.kind==='decor'?'Ein Stück Stadtleben: '+d.n+' schmückt deine Siedlung.':d.kind==='prod'?'Diese Produktionskette wird mit einer höheren Bevölkerungsstufe freigeschaltet.':d.d||'Dieses Gebäude ergänzt deine Siedlung.')+'</p>';productionPreview.hidden=false;positionProductionPreview();return;}
 productionPreviewCard?.removeAttribute('aria-details');productionPreviewCard=card;card.setAttribute('aria-details','production-preview');
 const incoming=new Map();for(const [input,output] of graph.edges){if(!incoming.has(output))incoming.set(output,[]);incoming.get(output).push(input);}
 const consumed=new Set(graph.edges.map(([input])=>input)),roots=graph.goods.filter(g=>!consumed.has(g));
 if(!roots.length)roots.push(...graph.current);
 const nodes=[],links=[];let maxDepth=0;
 function move(node,offset){node.y+=offset;for(const child of node.children)move(child,offset);}
 function profile(node,rows=new Map()){const range=rows.get(node.depth);rows.set(node.depth,range?[Math.min(range[0],node.y),Math.max(range[1],node.y)]:[node.y,node.y]);for(const child of node.children)profile(child,rows);return rows;}
 function pack(siblings){const occupied=new Map();for(const node of siblings){const rows=profile(node);let offset=0;for(const [depth,range] of rows)if(occupied.has(depth))offset=Math.max(offset,occupied.get(depth)[1]+52-range[0]);move(node,offset);for(const [depth,range] of profile(node)){const previous=occupied.get(depth);occupied.set(depth,previous?[Math.min(previous[0],range[0]),Math.max(previous[1],range[1])]:range);}}}
 function branch(good,depth,path){
  const node={good,depth,y:0,children:[]};nodes.push(node);maxDepth=Math.max(maxDepth,depth);
  if(!path.has(good)){const next=new Set(path);next.add(good);for(const input of incoming.get(good)||[])node.children.push(branch(input,depth+1,next));}
  if(node.children.length){pack(node.children);node.y=(node.children[0].y+node.children.at(-1).y)/2;move(node,-node.y);}
  return node;
 }
 const trees=roots.map(good=>branch(good,0,new Set()));pack(trees);
 const minY=Math.min(...nodes.map(n=>n.y)),maxY=Math.max(...nodes.map(n=>n.y));for(const node of nodes)node.y+=26-minY;
 const width=(maxDepth+1)*76,height=Math.max(76,maxY-minY+52);
 for(const node of nodes)node.x=38+(maxDepth-node.depth)*76;
 // One shared trunk per recipe. Independent subtrees occupy disjoint rows.
 for(const node of nodes)if(node.children.length){
  const spine=node.x-38,ys=node.children.map(c=>c.y);
  for(const child of node.children)links.push('<path d="M '+(child.x+22)+' '+child.y+' H '+spine+'"/>');
  if(ys.length>1)links.push('<path d="M '+spine+' '+Math.min(...ys)+' V '+Math.max(...ys)+'"/>');
  links.push('<path d="M '+spine+' '+node.y+' H '+(node.x-25)+'" marker-end="url(#production-arrow)"/>');
 }
 const lines='<g fill="none" stroke="#d2bd8a" stroke-width="2">'+links.join('')+'</g>';
 const nodeImages=nodes.map(p=>{const g=p.good,missing=graph.blocked.has(g),selected=graph.current.has(g);return '<g class="production-node" data-good="'+g+'" tabindex="0" role="img" aria-label="'+attr(GN[g].n+(missing?': Fruchtbarkeit fehlt':''))+'" transform="translate('+p.x+' '+p.y+')">'+(selected?'<circle r="25" fill="none" stroke="#ffe3a0" stroke-width="3"/>':'')+'<circle r="21" fill="#241b10" stroke="'+(missing?'#a69d8c':'#c8ae79')+'" stroke-width="2"/><image href="'+url(g)+'" x="-16" y="-16" width="32" height="32"'+(missing?' style="filter:grayscale(1);opacity:.5"':'')+'/>'+(missing?'<circle cx="17" cy="17" r="8" fill="#241b10"/><path d="M 13 13 L 21 21 M 21 13 L 13 21" stroke="#ff7161" stroke-width="3"/>':'')+'</g>';}).join('');
 const description=graph.edges.map(([a,b])=>GN[a].n+' → '+GN[b].n).join('; ')+'. '+[...graph.current].map(g=>'Ausgewählt: '+GN[g].n).join('. ')+'. '+[...graph.blocked].map(g=>GN[g].n+': Fruchtbarkeit fehlt').join('. ');
 productionPreview.innerHTML='<strong id="production-node-name" aria-live="polite">'+esc(B[card.dataset.b].n)+'</strong><div class="production-graph-scroll" tabindex="0" role="group" aria-label="Produktionskette verschieben"><svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="'+height+'" role="group" aria-label="'+attr(description)+'"><defs><marker id="production-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 0 L 8 4 L 0 8 Z" fill="#d2bd8a"/></marker></defs>'+lines+nodeImages+'</svg></div>';
 document.getElementById('production-node-name').style.minWidth=Math.min(Math.max(width,220),460)+'px';
 productionPreview.hidden=false;positionProductionPreview();
}
function deferProductionPreviewHide(){clearTimeout(productionPreviewTimer);productionPreviewTimer=setTimeout(()=>{if(!productionPreview.matches(':hover')&&!productionPreview.contains(document.activeElement)&&!productionPreviewCard?.matches(':hover,:focus'))hideProductionPreview();},450);}
const productionTray=document.getElementById('items');
productionTray.addEventListener('pointerover',e=>{const card=e.target.closest('[data-b]');if(card&&card!==productionPreviewCard)showProductionPreview(card);});
productionTray.addEventListener('focusin',e=>{const card=e.target.closest('[data-b]');if(card)showProductionPreview(card);});
productionTray.addEventListener('pointerleave',deferProductionPreviewHide);productionTray.addEventListener('focusout',deferProductionPreviewHide);
const decorationTray=document.getElementById('bar');decorationTray.addEventListener('pointerover',e=>{const card=e.target.closest('.deko-card[data-b]');if(card&&card!==productionPreviewCard)showProductionPreview(card);});decorationTray.addEventListener('focusin',e=>{const card=e.target.closest('.deko-card[data-b]');if(card)showProductionPreview(card);});decorationTray.addEventListener('pointerleave',deferProductionPreviewHide);decorationTray.addEventListener('focusout',deferProductionPreviewHide);
productionPreview.addEventListener('pointerenter',()=>clearTimeout(productionPreviewTimer));productionPreview.addEventListener('pointerleave',deferProductionPreviewHide);productionPreview.addEventListener('focusout',deferProductionPreviewHide);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!productionPreview.hidden){hideProductionPreview();}});
addEventListener('resize',positionProductionPreview);
const previewRenderItems=renderItems;renderItems=function(...args){const result=previewRenderItems(...args);if(productionPreviewCard){if((!UI.cat&&!productionPreviewCard.matches('.deko-card'))||!productionPreviewCard.isConnected||productionPreviewCard.hidden)hideProductionPreview();else if(productionPreviewContext!==activeIsland+':'+islandMeta().fert.join(',')+':'+(WORLD?.highestTier||1))showProductionPreview(productionPreviewCard);else positionProductionPreview();}return result;};

function productionNodeName(node){if(!node)return;clearTimeout(productionPreviewTimer);const good=node.dataset.good;document.getElementById('production-node-name').textContent=GN[good].n;positionProductionPreview();}
productionPreview.addEventListener('pointerover',e=>productionNodeName(e.target.closest('[data-good]')));
productionPreview.addEventListener('focusin',e=>productionNodeName(e.target.closest('[data-good]')));
// Keep a safe passage between the source card and the popup, even for slow movement.
document.addEventListener('pointermove',e=>{
 if(productionPreview.hidden||!productionPreviewCard)return;
 const a=productionPreviewCard.getBoundingClientRect(),b=productionPreview.getBoundingClientRect();
 const inPassage=e.clientX>=Math.min(a.left,b.left)-8&&e.clientX<=Math.max(a.right,b.right)+8&&e.clientY>=Math.min(a.top,b.top)-8&&e.clientY<=Math.max(a.bottom,b.bottom)+8;
 if(inPassage)clearTimeout(productionPreviewTimer);else if(!productionPreview.contains(document.activeElement))hideProductionPreview();
});
