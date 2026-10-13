/* Ressourcenicons führen ohne Platzliste zu freien und bebauten Vorkommen. */
const DEPOSIT_RESOURCE_ICONS=[['mine','erz','Eisenerz'],['goldmine','goldstaub','Gold'],['steinbruch','stein','Stein'],['lehmgrube','lehm','Lehm']];
const DEPOSIT_FOCUS_POSITIONS=new Map();
function islandDepositNodes(island,type){const g=WORLD.islands[island];return (g?.deposits||unsettledDeposits(island)).filter(n=>n.type===type&&(!n.legacy||g?.blds.some(b=>b.type===type&&b.x===n.x&&b.y===n.y)));}
function freeDepositNodes(island,type){
 const g=WORLD.islands[island],deposits=g?.deposits||unsettledDeposits(island);
 return deposits.filter(n=>n.type===type&&!n.legacy&&!g?.blds.some(b=>b.type===n.type&&b.x===n.x&&b.y===n.y)&&!footprintCells(n.x,n.y,B[type].w,B[type].h).some(([x,y])=>g&&(g.occ[IDX(x,y)]||g.road[IDX(x,y)])));
}
function focusNextDeposit(type,island=UI.viewedIsland??activeIsland){
 if(!DEPOSIT_RESOURCE_ICONS.some(([key])=>key===type)||WORLD.fog&&!WORLD.fog.islands[island])return false;
 const nodes=islandDepositNodes(island,type);if(!nodes.length){renderIslandFacts();return false;}
 const key=WORLD.rootSeed+':'+island+':'+type,last=DEPOSIT_FOCUS_POSITIONS.get(key),previous=last?nodes.findIndex(n=>n.x===last.x&&n.y===last.y):-1,n=nodes[(previous+1)%nodes.length];
 DEPOSIT_FOCUS_POSITIONS.set(key,{x:n.x,y:n.y});setTool(null);
 if(WORLD.islands[island]&&activeIsland!==island)activateIsland(island);
 if(WINS.deposit)closeWin('deposit');if(UI.sel)selectB(null);
 const d=B[type];centerOn(n.x+d.w/2,n.y+d.h/2);UI.viewedIsland=island;UI.depositFocus={island,type,x:n.x,y:n.y};
 cv.focus({preventScroll:true});renderIslandFacts();drawMini();return true;
}
renderIslandFacts=function(){
 const el=$('#islandfacts'),island=UI.viewedIsland??activeIsland,m=ISLANDS[island];if(!el||!m||!WORLD)return;
 if(WORLD.fog&&!WORLD.fog.islands[island]){el.innerHTML='';el._last=null;return;}
 const settled=!!WORLD.islands[island];el.classList.toggle('settled-facts',settled);
 const fertility=m.fert.map(good=>`<span class="factitem" title="${attr(GN[good].n)}: Fruchtbarkeit vorhanden">${ic(good,1)}${settled?'':`<span>${esc(GN[good].n)}</span>`}</span>`).join('');
 const resources=DEPOSIT_RESOURCE_ICONS.map(([type,icon,name])=>{
  const count=islandDepositNodes(island,type).length;if(!count)return '';
  const label=`${name}: ${count} Vorkommen, davon ${freeDepositNodes(island,type).length} frei. Zum nächsten Vorkommen springen.`;
  return `<button type="button" class="deposit-jump" data-deposit-type="${type}" title="${attr(label)}" aria-label="${attr(label)}"><span class="factitem">${ic(icon,1)}${settled?`<b>${count}</b>`:`<span>${esc(name)} · ${count}</span>`}</span></button>`;
 }).join('');
 const h=`<div class="factsummary" role="group" aria-label="Ressourcen auf ${attr(m.name)}">${settled?'':`<strong>${esc(m.name)}</strong>`}${fertility}${resources}${!settled&&!fertility&&!resources?'<span>Keine besonderen Vorkommen</span>':''}</div>`;
 if(el._last!==h){const focused=el.contains(document.activeElement)?document.activeElement?.dataset?.depositType:null;el.innerHTML=h;el._last=h;if(focused)(el.querySelector(`[data-deposit-type="${focused}"]`)||cv).focus({preventScroll:true});}
};
$('#islandfacts').addEventListener('click',e=>{const button=e.target.closest('[data-deposit-type]');if(button)focusNextDeposit(button.dataset.depositType);});
const depositFocusDrawing=drawDeposits;drawDeposits=function(ctx){
 depositFocusDrawing(ctx);const focus=UI.depositFocus;if(!focus||WORLD.fog&&!WORLD.fog.islands[focus.island]||!islandDepositNodes(focus.island,focus.type).some(n=>n.x===focus.x&&n.y===focus.y))return;
 const d=B[focus.type];ctx.save();ctx.strokeStyle='#ffe3a0';ctx.lineWidth=3/UI.sc;ctx.strokeRect(focus.x*16,focus.y*16,d.w*16,d.h*16);ctx.restore();
};
