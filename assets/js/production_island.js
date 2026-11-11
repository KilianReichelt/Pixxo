/* Reuse recipe nodes for island markers and the energy infrastructure window. */
let productionMarkerTypes=new Map();
function refreshProductionMarkerGoods(){const goods=new Set([...productionPreview.querySelectorAll('.production-node[data-good]')].map(n=>n.dataset.good));productionMarkerTypes=new Map(Object.entries(B).flatMap(([type,d])=>{const good=Object.keys(d.out||{}).find(g=>goods.has(g));return good?[[type,good]]:[];}));for(const node of productionPreview.querySelectorAll('.energy-node[data-building]')){const type=node.dataset.building;productionMarkerTypes.set(type,Object.keys(B[type].out||{})[0]||typeSprite(type));}}
const islandShowProduction=showProductionPreview;showProductionPreview=function(...args){if(args[0]?.matches('[data-energy-group]'))return openEnergyWindow(true);productionPreview.classList.remove('energy-production');const r=islandShowProduction(...args);refreshProductionMarkerGoods();return r;};
function productionIslandMarkers(){
 if(productionPreview.hidden||!productionPinned)return [];
 return G.blds.flatMap(b=>{const good=productionMarkerTypes.get(b.type);return good?[{b,good}]:[];});
}
const productionIslandWarnings=drawBuildingWarnings;
drawBuildingWarnings=function(ctx,...args){
 productionIslandWarnings(ctx,...args);if(productionPreview.hidden||!productionPinned)return;
 const bounds=visibleWorldBounds(),scale=1/UI.z;
 ctx.save();for(const {b,good} of productionIslandMarkers()){
  const x=cx(b)*16,y=upgradeArrowTop(b)-24*scale;
  if(x+24*scale<bounds.a.x||x-24*scale>bounds.b.x||y+24*scale<bounds.a.y||y-24*scale>bounds.b.y)continue;
  ctx.fillStyle='#241b10';ctx.strokeStyle='#c8ae79';ctx.lineWidth=2*scale;ctx.beginPath();ctx.arc(x,y,21*scale,0,Math.PI*2);ctx.fill();ctx.stroke();
  if(SP[good])ctx.drawImage(SP[good],x-16*scale,y-16*scale,32*scale,32*scale);
 }ctx.restore();
};
function energyProductionGraph(){
 const types=new Set(['koehlerei','kohlemine','dampfkraftwerk','kabelmast','umspannwerk','kabelstation'].filter(t=>B[t]&&cityBuildingUnlocked(t)));
 // Resolve actual recipe inputs recursively, including wood, ore, sand and lime.
 for(const type of types)for(const good of Object.keys(B[type].in||{})){const producer=productionProducer(good);if(producer&&cityBuildingUnlocked(producer))types.add(producer);}
 const links=[];for(const to of types)for(const [good,amount] of Object.entries(B[to].in||{}))for(const from of types)if(from!==to&&B[from].out?.[good])links.push({from,to,good,amount});
 for(const [from,to] of [['dampfkraftwerk','kabelmast'],['kabelmast','umspannwerk'],['kabelmast','kabelstation']])if(types.has(from)&&types.has(to))links.push({from,to,power:true});
 return {types,links};
}
function energyRecipeLayout(graph,root){
 const nodes=[],links=[];let row=0,maxDepth=0;
 function branch(type,depth,path){const node={type,depth,x:0,y:0};nodes.push(node);maxDepth=Math.max(maxDepth,depth);const next=new Set(path);next.add(type);const children=graph.links.filter(l=>!l.power&&l.to===type&&!next.has(l.from)).map(l=>({link:l,node:branch(l.from,depth+1,next)}));
  if(children.length){node.y=(children[0].node.y+children.at(-1).node.y)/2;for(const child of children)links.push({...child.link,a:child.node,b:node});}else node.y=30+row++*52;
  return node;
 }
 branch(root,0,new Set());for(const n of nodes)n.x=38+(maxDepth-n.depth)*76;return {nodes,links,width:(maxDepth+1)*76,height:Math.max(76,row*52+12)};
}
function energyNodeHTML(node){const type=node.type,good=Object.keys(B[type].out||{})[0],inputs=Object.entries(B[type].in||{}).map(([g,n])=>n+' '+GN[g].n).join(', ');return '<button type="button" class="production-node energy-node" style="left:'+(node.x-22)+'px;top:'+(node.y-22)+'px" data-building="'+type+'" data-type="'+type+'" data-act="energy-build" aria-label="'+attr(B[type].n+(inputs?', benötigt '+inputs:'')+' bauen')+'"><span class="energy-node-circle">'+ic(good||typeSprite(type),2)+'</span></button>';}
function energyDiagramHTML(layout,id){
 // Shared right-angle input trunk, matching the normal production overview.
 const targets=new Map();for(const link of layout.links){if(!targets.has(link.b))targets.set(link.b,[]);targets.get(link.b).push(link);}
 const paths=[...targets].map(([target,links])=>{const x=target.x-38,ys=links.map(l=>l.a.y),power=links[0].power;return '<g '+(power?'data-power-link':'data-recipe-links')+' fill="none" stroke="'+(power?'var(--ui-electric)':'var(--ui-accent-brass)')+'" stroke-width="2"'+(power?' stroke-dasharray="4 3"':'')+'>'+links.map(l=>'<path data-from="'+l.from+'" data-to="'+l.to+'" d="M '+(l.a.x+24)+' '+l.a.y+' H '+x+'"/>').join('')+'<path d="M '+x+' '+Math.min(target.y,...ys)+' V '+Math.max(target.y,...ys)+' M '+x+' '+target.y+' H '+(target.x-25)+'" marker-end="url(#'+id+')"/></g>';}).join('');
 return '<div class="energy-graph" style="width:'+layout.width+'px;height:'+layout.height+'px"><svg width="'+layout.width+'" height="'+layout.height+'" aria-hidden="true"><defs><marker id="'+id+'" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 0 L 8 4 L 0 8 Z" fill="context-stroke"/></marker></defs>'+paths+'</svg>'+layout.nodes.map(energyNodeHTML).join('')+'</div>';
}
function energyNodesHTML(){const graph=energyProductionGraph(),layout=energyRecipeLayout(graph,'dampfkraftwerk'),generator=layout.nodes.find(n=>n.type==='dampfkraftwerk'),positions=new Map(layout.nodes.map(n=>[n.type,n]));
 // Continue the fuel recipe directly into the electrical network; one generator node.
 for(const [type,offset,dy] of [['kabelmast',76,0],['umspannwerk',152,0],['kabelstation',152,60]])if(graph.types.has(type)){const node={type,x:generator.x+offset,y:generator.y+dy};positions.set(type,node);layout.nodes.push(node);}
 for(const link of graph.links)if(link.power&&positions.has(link.from)&&positions.has(link.to))layout.links.push({...link,a:positions.get(link.from),b:positions.get(link.to)});
 layout.width=Math.max(...layout.nodes.map(n=>n.x))+38;layout.height=Math.max(...layout.nodes.map(n=>n.y))+38;
 return '<div class="energy-graph-scroll" tabindex="0" aria-label="Energieversorgung"><section class="energy-chain-section"><h3>Energieversorgung</h3>'+energyDiagramHTML(layout,'energy-supply-arrow')+'</section></div>';
}
function openEnergyWindow(refresh=false){
 if(!refresh&&!productionPreview.hidden&&productionPreview.classList.contains('energy-production')){hideProductionPreview(true);return;}
 let card=document.querySelector('#items [data-energy-group]');if(!card){UI.barMode='build';UI.cat='roh';UI.populationFilter=3;UI.dockCollapsed=false;renderItems(true);card=document.querySelector('#items [data-energy-group]');}if(!card)return;
 hideProductionPreview(true);productionPreview.classList.remove('single-production-node','flavor-production');productionPreview.classList.add('energy-production');productionPreviewCard=card;card.setAttribute('aria-details','production-overview');productionPreviewContext=activeIsland+':'+islandMeta().fert.join(',')+':'+(WORLD?.highestTier||1);UI.productionGood=null;
 productionPreview.setAttribute('aria-label','Energieversorgung');productionPreview.innerHTML=productionPreviewHeader('Energie')+energyNodesHTML();productionPreview.hidden=false;productionPinned=true;refreshProductionMarkerGoods();positionProductionPreview();
}
const energyRenderItems=renderItems;renderItems=function(...args){const r=energyRenderItems(...args);if(!productionPreview.hidden&&productionPreview.classList.contains('energy-production')){const card=document.querySelector('#items [data-energy-group]');if(card){productionPreviewCard?.removeAttribute('aria-details');productionPreviewCard=card;card.setAttribute('aria-details','production-overview');positionProductionPreview();}else hideProductionPreview(true);}return r;};
// Compatibility for old energy-window actions; all new interaction uses the shared overview.
const productionEnergyClose=closeWin;closeWin=function(id,...args){if(id==='energy'&&productionPreview.classList.contains('energy-production'))hideProductionPreview(true);return productionEnergyClose(id,...args);};
