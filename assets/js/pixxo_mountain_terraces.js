/* Nach innen erodierte Felskonturen: zwei Kacheln Abstand je Höhenstufe.
   Nur Darstellung; Erz, Bauplätze und Abbaukontakte bleiben unverändert. */
const MOUNTAIN_TERRACES=new WeakMap();
function rockCornerBevel(x,y,dx,dy,g=G){
 const rock=(a,b)=>INMAP(a,b)&&[T.ROCK,T.ORE].includes(g.tiles[IDX(a,b)]);
 return rock(x,y)&&INMAP(x+dx,y)&&INMAP(x,y+dy)&&BUILDABLE(g.tiles[IDX(x+dx,y)])&&BUILDABLE(g.tiles[IDX(x,y+dy)]);
}
function clipRockTile(ctx,x,y,px,py){
 const nw=rockCornerBevel(x,y,-1,-1)?8:0,ne=rockCornerBevel(x,y,1,-1)?8:0,se=rockCornerBevel(x,y,1,1)?8:0,sw=rockCornerBevel(x,y,-1,1)?8:0;
 ctx.beginPath();ctx.moveTo(px+nw,py);ctx.lineTo(px+16-ne,py);ctx.lineTo(px+16,py+ne);ctx.lineTo(px+16,py+16-se);ctx.lineTo(px+16-se,py+16);ctx.lineTo(px+sw,py+16);ctx.lineTo(px,py+16-sw);ctx.lineTo(px,py+nw);ctx.closePath();ctx.clip();
}
function mountainTerraceField(island,tiles=G.tiles){
 let islands=MOUNTAIN_TERRACES.get(tiles);if(!islands){islands=new Map();MOUNTAIN_TERRACES.set(tiles,islands);}
 if(islands.has(island))return islands.get(island);
 const meta=ISLANDS[island],size=ISLAND_SIZE,depth=new Uint16Array(size*size),queue=[];
 const rock=(x,y)=>x>=0&&y>=0&&x<size&&y<size&&INMAP(meta.ox+x,meta.oy+y)&&[T.ROCK,T.ORE].includes(tiles[IDX(meta.ox+x,meta.oy+y)]);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(rock(x,y)){
  if(LAND_STEPS.some(([dx,dy])=>!rock(x+dx,y+dy))){depth[y*size+x]=1;queue.push(y*size+x);}
 }
 for(let i=0;i<queue.length;i++){const k=queue[i],x=k%size,y=Math.floor(k/size);for(const [dx,dy] of LAND_STEPS){const nx=x+dx,ny=y+dy;if(!rock(nx,ny))continue;const n=ny*size+nx;if(!depth[n]){depth[n]=depth[k]+1;queue.push(n);}}}
 const heights=Uint8Array.from(depth,d=>d?1+Math.floor((d-1)/2):0),field={heights,size,x:meta.ox,y:meta.oy,max:heights.reduce((a,b)=>Math.max(a,b),0)};
 islands.set(island,field);return field;
}
function mountainTerraceHeight(x,y,tiles=G.tiles){
 if(!INMAP(x,y))return 0;const island=islandAt(x,y);if(island<0)return 0;
 const f=mountainTerraceField(island,tiles),xx=x-f.x,yy=y-f.y;
 return xx<0||yy<0||xx>=f.size||yy>=f.size?0:f.heights[yy*f.size+xx];
}
function drawMountainTerrace(ctx,x,y,px,py){
 const height=mountainTerraceHeight(x,y);if(height<2)return;
 ctx.fillStyle='rgba(241,239,222,'+Math.min(.15,(height-1)*.025)+')';ctx.fillRect(px,py,16,16);
 if(mountainTerraceHeight(x,y+1)<height){ctx.fillStyle='rgba(20,22,30,.55)';ctx.fillRect(px,py+12,16,4);ctx.fillStyle='rgba(20,22,30,.30)';ctx.fillRect(px,py+10,16,2);ctx.fillStyle='rgba(231,232,222,.18)';ctx.fillRect(px,py+9,16,1);}
 if(mountainTerraceHeight(x,y-1)<height){ctx.fillStyle='rgba(255,255,255,.28)';ctx.fillRect(px,py,16,2);}
 if(mountainTerraceHeight(x-1,y)<height){ctx.fillStyle='rgba(255,255,255,.16)';ctx.fillRect(px,py,2,16);}
 if(mountainTerraceHeight(x+1,y)<height){ctx.fillStyle='rgba(0,0,0,.30)';ctx.fillRect(px+14,py,2,16);}
}
