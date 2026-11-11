/* Nur neu erzeugtes Gelände: kleine, über Kanten verbundene Felsinseln entfernen. */
function pruneSmallMountainGroups(tiles,massif,width,height=width,minimum=6){
 const visited=new Uint8Array(tiles.length),rock=k=>tiles[k]===T.ROCK||tiles[k]===T.ORE;let removed=0;
 for(let start=0;start<tiles.length;start++){
  if(visited[start]||!rock(start))continue;
  const group=[start];visited[start]=1;
  for(let i=0;i<group.length;i++){
   const k=group[i],x=k%width,y=Math.floor(k/width);
   for(const next of [x>0?k-1:-1,x+1<width?k+1:-1,y>0?k-width:-1,y+1<height?k+width:-1]){
    if(next<0||visited[next]||!rock(next))continue;visited[next]=1;group.push(next);
   }
  }
  if(group.length<minimum)for(const k of group){tiles[k]=T.GRASS;if(massif)massif[k]=0;removed++;}
 }
 return removed;
}
const clusteredLocalTerrain=localTerrain;
localTerrain=function(...args){const terrain=clusteredLocalTerrain(...args);pruneSmallMountainGroups(terrain.tiles,terrain.massif,ISLAND_SIZE);return terrain;};
