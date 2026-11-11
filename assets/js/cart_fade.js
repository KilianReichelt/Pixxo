/* Gelieferte Waren verschwinden sofort aus der Logik; der Wagen blendet weich aus. */
const CART_FADE_SECONDS=.45,cartFadeDeliveries=advanceDeliveries;
function visibleCartFades(g=G){g.visualCartFades=(g.visualCartFades||[]).filter(c=>UI.vt-c.fadeStart<CART_FADE_SECONDS);return g.visualCartFades;}
advanceDeliveries=function(dt){
 const before=G.carts.slice();cartFadeDeliveries(dt);const remaining=new Set(G.carts),fades=visibleCartFades();
 for(const c of before)if(!remaining.has(c)&&c.path?.length&&c.t>=c.path.length-1)fades.push({path:[c.path[c.path.length-1]],t:0,col:c.col,fadeStart:UI.vt});
};
