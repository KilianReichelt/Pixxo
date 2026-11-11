(()=>{
// Approved code-native warning surface, batch146.
const warningSurface = Object.freeze({
  width:20, height:22, contentCenter:[10,9], contentBounds:[2,2,16,14],
  pointer:[10,21], frames:1,
  // Integer run rectangles keep all contour edges on the native pixel grid.
  layers:[
    {color:'#493b2b',runs:[[1,1,18,16],[8,17,5,1],[9,18,3,2],[10,20,1,2]]},
    {color:'#d8c795',runs:[[2,2,16,14],[9,16,3,2],[10,18,1,2]]},
    {color:'#f3e5bd',runs:[[2,2,16,1],[2,3,1,12]]},
    {color:'#a89365',runs:[[3,15,15,1],[17,3,1,12]]}
  ]
});
function drawWarningSurface(ctx){
  ctx.save();
  for(const layer of warningSurface.layers){ctx.fillStyle=layer.color;for(const run of layer.runs)ctx.fillRect(...run);}
  ctx.restore();
}

let canvas;window.GAME_WARNING_SURFACE={geometry:warningSurface,create(){if(!canvas){canvas=document.createElement("canvas");canvas.width=warningSurface.width;canvas.height=warningSurface.height;drawWarningSurface(canvas.getContext("2d"));}return canvas;}};
})();
