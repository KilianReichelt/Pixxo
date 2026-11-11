/* Isolated draft, not a runtime asset. Native roof-peak mounts measured on
   approved 80px trading-post canvases. Original pixels are never rewritten. */
(function(root){
 const mounts={1:{x:40,y:14},2:{x:40,y:9},3:{x:40,y:14},4:{x:40,y:18}};
 function geometry(tier,frame=0){
  const p=mounts[tier];if(!p)return null;
  const top=Math.max(1,p.y-11),wave=[0,1,1,0,-1,-1,0,0][((frame%8)+8)%8];
  const cloth=[];for(let x=1;x<=7;x++)for(let y=0;y<4;y++)cloth.push([p.x+x,top+y+Math.round(wave*x/7)]);
  return {mount:p,top,cloth};
 }
 function draw(ctx,tier,frame,color,night=false){
  const g=geometry(tier,frame);if(!g)return;
  ctx.fillStyle=night?'#493e33':'#8a7049';ctx.fillRect(g.mount.x,g.top,1,g.mount.y-g.top+1);
  const rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));
  ctx.fillStyle=night?'rgb('+rgb.map((v,i)=>Math.round(v*.42+[8,16,42][i]*.58)).join(',')+')':color;
  for(const [x,y] of g.cloth)ctx.fillRect(x,y,1,1);
 }
 root.MountedOwnerFlags={mounts,geometry,draw};
})(globalThis);
