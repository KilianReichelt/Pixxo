/* Larger new-game islands; saved profiles/layouts are never resized. */
const ISLAND_SPACE_RULES=Object.freeze({startArea:12000,startConnected:6000,seaGap:18,maxAttempts:4});
let creatingIslandSpaceWorld=false,islandSpaceMapStyle=1;
const islandSpaceTerrainCache=new Map();
const islandSpaceLocalTerrain=localTerrain;
localTerrain=function(seed,profile,...args){
 const effectiveSeed=seed+(profile.terrainSeedOffset||0),cached=creatingIslandSpaceWorld&&islandSpaceTerrainCache.get(profile);
 if(cached&&cached.seed===effectiveSeed)return cached.terrain;
 return islandSpaceLocalTerrain(effectiveSeed,profile,...args);
};

/* Reuse the precomputed terrain when genMap copies tiles into the world.
 * Actual shallow-water bounds determine spacing, rather than a size heuristic. */
const islandSpaceLayout=layoutIslands;
layoutIslands=function(seed){
 if(!creatingIslandSpaceWorld||islandGenerationVersion<2||preferredLayout)return islandSpaceLayout(seed);
 let state=(seed>>>0)||1;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 const entries=ISLANDS.map((profile,i)=>{
  const terrain=localTerrain(seed+i*913,profile,islandSpaceMapStyle),center=ISLAND_SIZE/2;let radius=0;profile.terrainEdgeClipped=false;
  for(let k=0;k<terrain.tiles.length;k++)if(terrain.tiles[k]>T.DEEP){const x=k%ISLAND_SIZE,y=Math.floor(k/ISLAND_SIZE);radius=Math.max(radius,Math.hypot(x+.5-center,y+.5-center));if(terrain.tiles[k]>=T.SAND&&(x<4||y<4||x>=ISLAND_SIZE-4||y>=ISLAND_SIZE-4))profile.terrainEdgeClipped=true;}
  islandSpaceTerrainCache.set(profile,{seed:seed+i*913+(profile.terrainSeedOffset||0),terrain});
  return {profile,radius:Math.ceil(radius)+1};
 }).sort((a,b)=>b.radius-a.radius);
 const placed=[];
 for(const {profile,radius} of entries){
  let point=null;
  for(let attempt=0;attempt<40000;attempt++){
   const candidate={ox:Math.floor(20+random()*(MAPW-ISLAND_SIZE-40)),oy:Math.floor(20+random()*(MAPH-ISLAND_SIZE-40)),radius};
   if(placed.every(p=>Math.hypot(candidate.ox-p.ox,candidate.oy-p.oy)>=radius+p.radius+ISLAND_SPACE_RULES.seaGap)){point=candidate;break;}
  }
  if(!point)throw Error('Keine freie Inselposition für diese Welt.');
  placed.push(point);Object.assign(profile,point);profile.wx=profile.ox+ISLAND_SIZE/2;profile.wy=profile.oy+ISLAND_SIZE/2;profile.x=profile.wx/MAPW*100;profile.y=profile.wy/MAPH*100;
 }
};

function measureIslandSpace(board,profile,island){
 const width=ISLAND_SIZE,open=new Uint8Array(width*width),queue=new Int32Array(open.length);let area=0,largest=0,minX=width,minY=width,maxX=-1,maxY=-1;
 for(let y=0;y<width;y++)for(let x=0;x<width;x++){
  const k=IDX(profile.ox+x,profile.oy+y);if(islandOwners[k]!==island)continue;
  const tile=board.tiles[k];if(tile>=T.SAND){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
  if(tile===T.GRASS||tile===T.FOREST){open[y*width+x]=1;area++;}
 }
 for(let k=0;k<open.length;k++)if(open[k]){
  let count=1;queue[0]=k;open[k]=0;
  for(let h=0;h<count;h++){
   const cell=queue[h],x=cell%width,y=Math.floor(cell/width);
   for(const next of [x?cell-1:-1,x+1<width?cell+1:-1,y?cell-width:-1,y+1<width?cell+width:-1])if(next>=0&&open[next]){open[next]=0;queue[count++]=next;}
  }
  largest=Math.max(largest,count);
 }
 return {area,largest,bounds:{minX,minY,maxX,maxY}};
}
function updateIslandSpaceMetrics(board){
 ISLANDS.forEach((profile,i)=>{
  const measured=measureIslandSpace(board,profile,i);profile.buildableArea=measured.area;profile.largestBuildableArea=measured.largest;profile.spaceBounds=measured.bounds;
  profile.startEligible=profile.sizeClass==='large'&&!profile.terrainEdgeClipped&&profile.beaches?.length>0&&measured.area>=ISLAND_SPACE_RULES.startArea&&measured.largest>=ISLAND_SPACE_RULES.startConnected;
 });
}
function startingIslandChoices(habitable){
 if(islandGenerationVersion>=2)return habitable.filter(({m})=>m.startEligible);
 const large=habitable.filter(({m})=>m.size>=.78*(ARCHIPELAGO_VERSION>=2?.5:1));return large.length?large:habitable;
}

const islandSpaceGenMap=genMap;
genMap=function(seed,...args){
 const fresh=generateFreshProfiles,started=performance.now();creatingIslandSpaceWorld=fresh;islandSpaceMapStyle=args[0]??1;
 let board;
 try{
  for(let attempt=0;attempt<(fresh?ISLAND_SPACE_RULES.maxAttempts:1);attempt++){
   islandSpaceTerrainCache.clear();
   if(attempt){preferredLayout=null;for(const m of ISLANDS)m.terrainSeedOffset=attempt*104729;}
   board=islandSpaceGenMap(seed,...args);
   if(islandGenerationVersion<2)return board;
   updateIslandSpaceMetrics(board);
   if(!fresh||!ISLANDS.some(m=>m.terrainEdgeClipped)&&ISLANDS.some(m=>m.startEligible)){
    board.islandGeneration={version:islandGenerationVersion,attempts:attempt+1,ms:performance.now()-started};return board;
   }
  }
  throw Error('Keine ausreichend große Startinsel gefunden. Bitte eine neue Welt erzeugen.');
 }finally{creatingIslandSpaceWorld=false;islandSpaceTerrainCache.clear();}
};
