/* Gameplay discovery is permanent immediately; only its visible mist travels. */
const ISLAND_REVEALS=new Map();
function fogIslandChunkIntersects(island,cx,cy){const m=ISLANDS[island],x=cx*FOG_CHUNK_SIZE,y=cy*FOG_CHUNK_SIZE;return m&&x<m.ox+ISLAND_SIZE&&x+FOG_CHUNK_SIZE>m.ox&&y<m.oy+ISLAND_SIZE&&y+FOG_CHUNK_SIZE>m.oy;}
function invalidateIslandFog(island){for(const key of PERF_FOG.chunks.keys()){const [x,y]=key.split(':').map(Number);if(fogIslandChunkIntersects(island,x,y))PERF_FOG.chunks.delete(key);}PERF_FOG.miniDirty=true;}
function startIslandReveal(island,origin){if(WORK_ART.reduced.matches)return;const m=ISLANDS[island],reach=Math.max(...[[m.ox,m.oy],[m.ox+ISLAND_SIZE,m.oy],[m.ox,m.oy+ISLAND_SIZE],[m.ox+ISLAND_SIZE,m.oy+ISLAND_SIZE]].map(([x,y])=>Math.hypot(x-origin.x,y-origin.y)));ISLAND_REVEALS.set(island,{start:UI.vt,origin:{...origin},reach,duration:4.5});fogFades.set(island,UI.vt);invalidateIslandFog(island);}
fogFading=function(owner,x,y){if(owner<0||!WORLD.fog.islands[owner])return null;const r=ISLAND_REVEALS.get(owner);if(!r)return 0;const progress=clamp((UI.vt-r.start)/r.duration,0,1);if(progress>=1||WORK_ART.reduced.matches){ISLAND_REVEALS.delete(owner);fogFades.delete(owner);return 0;}return clamp((Math.hypot(x-r.origin.x,y-r.origin.y)-progress*(r.reach+8)+4)/8,0,1);};
function fogChunkAnimating(cx,cy){for(const island of ISLAND_REVEALS.keys())if(fogIslandChunkIntersects(island,cx,cy))return true;return false;}
const revealLoad=loadGame;loadGame=function(...args){ISLAND_REVEALS.clear();fogFades.clear();return revealLoad(...args);};
