/* New homes use 3x3. Saved homes keep their occupied cells during load/move. */
(()=>{
 const savedSize=b=>({w:Number.isInteger(b.w)&&b.w>0?b.w:2,h:Number.isInteger(b.h)&&b.h>0?b.h:2});
 const restore=restoredBuildingSize,move=movedBuildingSize,configure=configureBuildingScale;
 restoredBuildingSize=function(saved){return saved.type==='haus'?savedSize(saved):restore(saved);};
 movedBuildingSize=function(b,rotation){return b.type==='haus'?savedSize(b):move(b,rotation);};
 function newHomes(){B.haus.w=B.haus.h=3;BUILD_SIZES.haus={w:3,h:3};}
 configureBuildingScale=function(...args){const result=configure(...args);newHomes();return result;};
 newHomes();
})();
