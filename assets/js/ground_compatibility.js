/* Restore existing legacy grass art, keeping the material transition renderer. */
const GAME_GROUND_STYLE=Object.freeze({legacyGrass:true});
const originalGroundGrass=landscapeGrassSprite;
function legacyGrassSource(x,y){
 // Flower heads remain in the separate meadow layer, never baked into RGB.
 return originalGroundGrass(x,y,true);
}
let legacyGroundConfigured=null;
function legacyGroundTile(x,y,type){
 if(window.SpriteReview||typeof TERRAIN_MATERIALS==='undefined'||![T.GRASS,T.FOREST].includes(type))return null;
 if(legacyGroundConfigured!==G.tiles){const source=key=>HD_CATALOG.get(key)?.pixelSource||SP[key],seed=WORLD?.rootSeed||G.seed||1;TERRAIN_MATERIALS.configure({revision:'original-grass-soft-sand:'+seed,grass:[0,1,2,3].map(i=>source('grass'+i)),sand:[0,1,2].map(i=>source('sand'+i)),seed,flowers:[],hasFlowers:()=>false});legacyGroundConfigured=G.tiles;}
 return TERRAIN_MATERIALS.tile(x,y,type,{tiles:G.tiles,width:MAPW,height:MAPH},T,legacyGrassSource(x,y));
}
