/* Flache Weltansicht; gemeinsame Koordinatenhelfer ohne CSS-Perspektive. */
const WORLD_VIEW_DEFAULTS=Object.freeze({cornerSize:parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ui-corner-window'))||13,shimmer:true});
function worldToViewport(x,y){return {x:innerWidth/2+(x-UI.cam.x)*UI.z,y:innerHeight/2+(y-UI.cam.y)*UI.z};}
function worldRectToViewport(x,y,w,h){const p=[[x,y],[x+w,y],[x+w,y+h],[x,y+h]].map(([x,y])=>worldToViewport(x,y)),xs=p.map(p=>p.x),ys=p.map(p=>p.y);return {left:Math.min(...xs),top:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys)};}
function visibleWorldBounds(){const p=[[0,0],[innerWidth,0],[innerWidth,innerHeight],[0,innerHeight]].map(([x,y])=>scr2w(x,y));return {a:{x:Math.min(...p.map(p=>p.x)),y:Math.min(...p.map(p=>p.y))},b:{x:Math.max(...p.map(p=>p.x)),y:Math.max(...p.map(p=>p.y))}};}
function panWorldByViewport(ax,ay,bx,by){const a=scr2w(ax,ay),b=scr2w(bx,by);UI.cam.x+=a.x-b.x;UI.cam.y+=a.y-b.y;}
