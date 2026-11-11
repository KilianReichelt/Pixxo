/* Gemeinsame, deterministische Stegreservierungen für Küstengebäude. */
function coastalPierChoices(b,claimed=new Set()){
 const choices=[],marine=(x,y)=>INMAP(x,y)&&G.tiles[IDX(x,y)]<=T.SHAL&&!isRiver(IDX(x,y));
 for(const [side,dx,dy] of [['north',0,-1],['east',1,0],['south',0,1],['west',-1,0]]){
  const across=dx?b.h:b.w;
  for(let offset=0;offset<across;offset++){
   const x=dx<0?b.x-1:dx>0?b.x+b.w:b.x+offset,y=dy<0?b.y-1:dy>0?b.y+b.h:b.y+offset;
   const cells=[];let depth=0,openness=0;
   for(let length=0;length<24;length++){
    const px=x+dx*length,py=y+dy*length;if(!marine(px,py))break;
    depth++;openness+=Number(marine(px+dy,py+dx))+Number(marine(px-dy,py-dx));
    if(length<3){const k=IDX(px,py);if(claimed.has(k)||G.occ[k]&&G.occ[k]!==b.id||G.road[k])break;cells.push([px,py]);}
   }
   if(cells.length)choices.push({side,cells,depth,openness,offset,center:Math.abs(offset-(across-1)/2)});
  }
 }
 // Prefer a centered attachment among viable seaward sides; never trade a
 // clear sea approach for a center slot that points into a narrow inlet.
 const bestDepth=Math.max(0,...choices.map(c=>c.depth));for(const c of choices)c.openSea=c.depth>=Math.min(8,bestDepth);
 choices.sort((a,b)=>Number(b.openSea)-Number(a.openSea)||a.center-b.center||b.cells.length-a.cells.length||b.depth-a.depth||b.openness-a.openness);
 return choices;
}
let coastalPierCache=null;
function coastalPierPlans(){
 const buildings=worldBuildings().filter(b=>B[b.type]?.place==='coast').sort((a,b)=>a.id-b.id);
 const signature=buildings.map(b=>[b.id,b.x,b.y,b.w,b.h].join(',')).join(';');
 if(coastalPierCache?.tiles===G.tiles&&coastalPierCache.signature===signature)return coastalPierCache.plans;
 const plans=new Map(),claimed=new Set();
 for(const b of buildings){const plan=coastalPierChoices(b,claimed)[0];if(!plan)continue;plans.set(b.id,plan);for(const [x,y] of plan.cells)claimed.add(IDX(x,y));}
 coastalPierCache={tiles:G.tiles,signature,plans};return plans;
}
function coastPierPlanFor(b){return coastalPierPlans().get(b.id);}
function coastalPierPlacement(b){
 const claimed=new Set();for(const [id,plan] of coastalPierPlans())if(id!==b.id)for(const [x,y] of plan.cells)claimed.add(IDX(x,y));
 for(let y=b.y;y<b.y+b.h;y++)for(let x=b.x;x<b.x+b.w;x++)if(claimed.has(IDX(x,y)))return {ok:false,why:'Hier verläuft bereits ein Steg.'};
 return coastalPierChoices(b,claimed).length?{ok:true}:{ok:false,why:'Kein freier Steg zur Meerseite.'};
}
const pierCanPlace=canPlace;canPlace=function(type,x,y){const result=pierCanPlace(type,x,y);if(B[type]?.place!=='coast'||!result.ok)return result;const size=buildingSize(type,UI.rotation||0),pier=coastalPierPlacement({type,x,y,...size});return pier.ok?result:pier;};
const pierCanMove=canMoveBuilding;canMoveBuilding=function(b,x,y){const result=pierCanMove(b,x,y);if(B[b?.type]?.place!=='coast'||!result.ok)return result;const pier=coastalPierPlacement({...b,x,y});return pier.ok?result:pier;};
const pierInvalidateTerrain=invalidateTerrainCells;invalidateTerrainCells=function(...args){coastalPierCache=null;return pierInvalidateTerrain(...args);};
gamePierCells=function(b){return coastPierPlanFor(b)?.cells||[];};
