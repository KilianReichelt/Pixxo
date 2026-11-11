/* Hit regions follow the actually painted status icons, including zoom and bobbing.
   One non-interactive anchor reuses the game's shared tooltip; no per-house DOM. */
const buildingStatusHits=[];
const buildingStatusAnchor=document.createElement('span');
buildingStatusAnchor.setAttribute('aria-hidden','true');
buildingStatusAnchor.style.cssText='position:fixed;pointer-events:none;opacity:0;';
document.body.append(buildingStatusAnchor);
let buildingStatusPointer=null,buildingStatusCurrent=null;
let buildingStatusCanvasRect=null;
function buildingStatusExplanation(b){
 const warning=buildingWarning(b);
 if(!warning)return '';
 if(b.fire>0)return 'Brand: Dieses Gebäude brennt. Eine angeschlossene Feuerwehr kann den Brand löschen.';
 if(b.sickness>0)return warning.text;
 if(!b.conn)return 'Straßenanschluss fehlt: Verbinde das Gebäude über einen Weg oder eine Straße mit dem Kontor oder einem Lagerhaus.';
 return warning.text+'.';
}
function beginBuildingStatusFrame(){buildingStatusHits.length=0;buildingStatusCanvasRect=cv.getBoundingClientRect();}
function registerBuildingStatusHit(ctx,b,x,y,w,h,text){
 if(!text||WORLD.fog&&!WORLD.fog.islands[b.island??activeIsland])return;
 const m=ctx.getTransform(),a=m.transformPoint({x,y}),z=m.transformPoint({x:x+w,y:y+h}),r=buildingStatusCanvasRect||cv.getBoundingClientRect();
 const sx=r.width/cv.width,sy=r.height/cv.height;
 const left=r.left+a.x*sx,top=r.top+a.y*sy,width=(z.x-a.x)*sx,height=(z.y-a.y)*sy;
 if(left+width<r.left||top+height<r.top||left>r.right||top>r.bottom)return;
 buildingStatusHits.push({b,text,left,top,width,height});
}
function buildingStatusTooltipSource(){return buildingStatusCurrent?buildingStatusAnchor:null;}
function updateBuildingStatusHover(){
 const p=buildingStatusPointer;
 let hit=null;
 if(p)for(let i=buildingStatusHits.length-1;i>=0;i--){const h=buildingStatusHits[i];if(p.x>=h.left&&p.x<=h.left+h.width&&p.y>=h.top&&p.y<=h.top+h.height){hit=h;break;}}
 buildingStatusCurrent=hit||null;
 if(!hit){if(gameTooltipSource===buildingStatusAnchor)hideGameTooltip();return;}
 const text=hit.text;
 if(buildingStatusAnchor.dataset.gameTooltip!==text)buildingStatusAnchor.dataset.gameTooltip=text;
 Object.assign(buildingStatusAnchor.style,{left:hit.left+'px',top:hit.top+'px',width:hit.width+'px',height:hit.height+'px'});
 showGameTooltip(buildingStatusAnchor);
}
cv.addEventListener('pointermove',e=>{buildingStatusPointer={x:e.clientX,y:e.clientY};updateBuildingStatusHover();});
cv.addEventListener('pointerleave',()=>{buildingStatusPointer=null;updateBuildingStatusHover();});
cv.addEventListener('pointerdown',()=>{buildingStatusPointer=null;updateBuildingStatusHover();});
addEventListener('blur',()=>{buildingStatusPointer=null;updateBuildingStatusHover();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){buildingStatusPointer=null;updateBuildingStatusHover();}});
