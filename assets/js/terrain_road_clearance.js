/* Diagonale Wege dürfen in die abgeschrägte Ecke ragen, aber nicht in den Fels. */
const terrainClearanceDrawRoad=drawRoadTile;
drawRoadTile=function(ctx,mask,stone,x,y){
 if(!(mask&240))return terrainClearanceDrawRoad(ctx,mask,stone,x,y);
 const rocks=[];
 for(let by=y-1;by<=y+1;by++)for(let bx=x-1;bx<=x+1;bx++)if(INMAP(bx,by)&&[T.ROCK,T.ORE].includes(G.tiles[IDX(bx,by)]))rocks.push([bx,by]);
 if(!rocks.length)return terrainClearanceDrawRoad(ctx,mask,stone,x,y);
 ctx.save();ctx.beginPath();const pad=DIAGONAL_ROAD_PAD;
 ctx.rect(x*16-pad,y*16-pad,16+pad*2,16+pad*2);
 for(const [bx,by] of rocks){
  const cut=(dx,dy)=>rockCornerBevel(bx,by,dx,dy)?TERRAIN_CORNER_CUT:0;
  traceTerrainCorners(ctx,bx*16,by*16,cut(-1,-1),cut(1,-1),cut(1,1),cut(-1,1));
 }
 ctx.clip('evenodd');terrainClearanceDrawRoad(ctx,mask,stone,x,y);ctx.restore();
};
