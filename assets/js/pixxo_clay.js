/* Lehmplätze sind zufällig verteilt und bleiben über den Inselspielstand erhalten. */
function clearClayDepositTrees(tiles,deposits){
 for(const n of deposits)if(n.type==='lehmgrube')for(const [x,y] of footprintCells(n.x,n.y,B.lehmgrube.w,B.lehmgrube.h)){if(INMAP(x,y)&&tiles[IDX(x,y)]===T.FOREST)tiles[IDX(x,y)]=T.GRASS;}
}
function clayDepositCount(island){return Math.max(1,Math.min(4,Math.ceil(ISLANDS[island].size*5)));}
function generateClayDeposits(tiles,seed,island,reserved=[],blocked=()=>false,count=clayDepositCount(island)){
 if(count<=0)return [];
 const m=ISLANDS[island],{w,h}=B.lehmgrube,candidates=[];let cutoff=Infinity;
 const clear=(x,y)=>{
  for(let j=y-1;j<y+h+1;j++)for(let i=x-1;i<x+w+1;i++)if(!INMAP(i,j)||islandAt(i,j)!==island||!BUILDABLE(tiles[IDX(i,j)])||tiles[IDX(i,j)]===T.SAND||blocked(i,j))return false;
  return !reserved.some(n=>Math.hypot(n.x-x,n.y-y)<10);
 };
 for(let y=Math.max(1,m.oy+1);y<Math.min(MAPH-h-1,m.oy+ISLAND_SIZE-h);y++)for(let x=Math.max(1,m.ox+1);x<Math.min(MAPW-w-1,m.ox+ISLAND_SIZE-w);x++){
  const score=hs(x,y,seed+1741);if(score>=cutoff||!clear(x,y))continue;candidates.push({type:'lehmgrube',x,y,score});
  if(candidates.length>128){candidates.sort((a,b)=>a.score-b.score);candidates.length=128;cutoff=candidates[127].score;}
 }
 candidates.sort((a,b)=>a.score-b.score);const result=[];for(const n of candidates){if(result.length>=count)break;if(result.some(p=>Math.hypot(p.x-n.x,p.y-n.y)<10))continue;result.push({type:n.type,x:n.x,y:n.y});}
 return result;
}
const clayCreateDeposits=createDeposits;createDeposits=function(tiles,seed){const deposits=clayCreateDeposits(tiles,seed);return [...deposits,...generateClayDeposits(tiles,seed,activeIsland,deposits)];};
const clayUnpackIsland=unpackIsland;unpackIsland=function(o,...args){
 const g=clayUnpackIsland(o,...args),other=g.deposits.filter(n=>n.type!=='lehmgrube'),saved=(o.deposits||[]).filter(n=>n.type==='lehmgrube'&&INMAP(n.x,n.y)&&islandAt(n.x,n.y)===g.island).map(n=>({type:'lehmgrube',x:n.x,y:n.y}));
 // Bestehende Gruben erhalten ihren Platz, auch wenn sie früher am Strand gebaut wurden.
 for(const b of g.blds)if(b.type==='lehmgrube'&&!saved.some(n=>n.x===b.x&&n.y===b.y))saved.push({type:'lehmgrube',x:b.x,y:b.y});
 const missing=Math.max(0,clayDepositCount(g.island)-saved.length),fresh=generateClayDeposits(g.tiles,g.seed,g.island,[...other,...saved],(x,y)=>!!g.occ[IDX(x,y)]||!!g.road[IDX(x,y)],missing);
 g.deposits=[...other,...saved,...fresh];clearClayDepositTrees(g.tiles,g.deposits);return g;
};
const clayCanPlace=canPlace;canPlace=function(type,x,y){
 if(type==='lehmgrube'&&!G.deposits.some(n=>n.type===type&&n.x===x&&n.y===y&&!n.legacy))return {ok:false,why:'Die Lehmgrube benötigt ein freies Lehmvorkommen an Land.'};return clayCanPlace(type,x,y);
};
const clayCanMove=canMoveBuilding;canMoveBuilding=function(b,x,y){
 if(b?.type==='lehmgrube'&&!G.deposits.some(n=>n.type===b.type&&n.x===x&&n.y===y&&!n.legacy))return {ok:false,why:'Die Lehmgrube kann nur auf ein passendes Lehmvorkommen verschoben werden.'};return clayCanMove(b,x,y);
};
// Im Baumenü gewählte Gruben rasten beim Zeigen auf ein Vorkommen dort ein.
function snapClayTile(t){if(!t||UI.type!=='lehmgrube'||!['build','move'].includes(UI.tool))return t;const d=buildingSize('lehmgrube',UI.rotation||0),deposits=WORLD.islands[islandAt(t.x,t.y)]?.deposits||G.deposits,n=deposits.find(n=>n.type==='lehmgrube'&&t.x>=n.x&&t.y>=n.y&&t.x<n.x+d.w&&t.y<n.y+d.h);return n?{x:n.x+Math.floor(d.w/2),y:n.y+Math.floor(d.h/2)}:t;}
const clayGhostTile=ghostTile;ghostTile=function(){return snapClayTile(clayGhostTile());};
const clayClickTile=clickTile;clickTile=function(t){clayClickTile(snapClayTile(t));};
const clayDrawDeposits=drawDeposits;drawDeposits=function(ctx){
 clayDrawDeposits(ctx);for(const n of allDeposits()){
  if(n.type!=='lehmgrube'||footprintCells(n.x,n.y,B.lehmgrube.w,B.lehmgrube.h).some(([x,y])=>G.occ[IDX(x,y)]))continue;
  const {w,h}=B.lehmgrube,x=n.x*16,y=n.y*16;ctx.save();const entry=typeof IMPORTED_ENTRIES!=='undefined'?IMPORTED_ENTRIES.get('deposit_lehm'):null;if(entry){ctx.drawImage(importedPixels(entry),x,y,w*16,h*16);}else{ctx.fillStyle='#765139';ctx.fillRect(x+2,y+2,w*16-4,h*16-4);ctx.fillStyle='#b08054';ctx.fillRect(x+5,y+5,w*16-10,h*16-10);
  for(let i=0;i<12;i++){const px=4+Math.floor(hs(i,n.x,n.y)*Math.max(1,w*16-10)),py=4+Math.floor(hs(n.y,i,n.x)*Math.max(1,h*16-10));ctx.fillStyle=i%2?'#c19668':'#9f6641';ctx.fillRect(x+px,y+py,4,3);}
  ctx.drawImage(SP.lehm,x+w*8-8,y+h*8-8,16,16);}if(UI.type===n.type&&['build','move'].includes(UI.tool)){ctx.strokeStyle='#ffe3a0';ctx.lineWidth=2/UI.sc;ctx.strokeRect(x,y,w*16,h*16);}ctx.restore();
 }
};
freeNodeCache.clear();
