/* Explicit actions refresh immediately; periodic refresh still respects editing. */
function refreshActionWindows(){
 for(const w of Object.values(WINS))if(!w.static)refreshWin(w,true);
 renderTop(true);
}
const immediateWindowAction=winAct;
winAct=function(...args){const result=immediateWindowAction(...args);refreshActionWindows();return result;};
document.addEventListener('change',event=>{if(event.target.closest('.win')&&!event.target.closest('form'))queueMicrotask(refreshActionWindows);});
const pausedBuildingWarning=buildingWarning;
buildingWarning=function(b){return b.paused&&!(b.fire>0)&&b.type!=='ruine'?{key:'i_pause',fallback:'i_pause',text:'Betrieb pausiert. Im Gebäudefenster fortsetzen.'}:pausedBuildingWarning(b);};
const pausedBuildingBubble=bubbleFor;
bubbleFor=function(b,...args){return b.paused&&!(b.fire>0)&&b.type!=='ruine'?'i_pause':pausedBuildingBubble(b,...args);};
const pausedStatusExplanation=buildingStatusExplanation;
buildingStatusExplanation=function(b){return b.paused&&!(b.fire>0)?'Betrieb pausiert: Im Gebäudefenster auf Fortsetzen klicken.':pausedStatusExplanation(b);};

/* One timing rule is shared by simulation, rates and building information. */
function quarterMinuteCycle(seconds){return Math.max(15,Math.round(seconds/15)*15);}
function productionBaseCycle(type,seconds){const quantum=typeof ELECTRIC_PRODUCTION!=='undefined'&&ELECTRIC_PRODUCTION.has(type)?30:15;return Math.max(quantum,Math.round(seconds/quantum)*quantum);}
const PRODUCTION_CYCLE_REVIEW=[];
for(const [type,d]of Object.entries(B))if(d.kind==='prod'&&Number.isFinite(d.cycle)&&d.cycle>0){const old=d.cycle;d.cycle=productionBaseCycle(type,old);PRODUCTION_CYCLE_REVIEW.push({type,name:d.n,before:old,after:d.cycle});}
const quarterDefinition=def,quarterDefinitions=new WeakMap();
def=function(b){const d=quarterDefinition(b);if(d.kind!=='prod'||!Number.isFinite(d.cycle)||d.cycle<=0)return d;const cycle=productionBaseCycle(b.type,d.cycle);if(cycle===d.cycle)return d;let cached=quarterDefinitions.get(d);if(!cached||cached.cycle!==cycle){cached={...d,cycle};quarterDefinitions.set(d,cached);}return cached;};
const quarterWorkforce=assignWorkforce;
assignWorkforce=function(g){const result=quarterWorkforce(g);for(const b of g.blds){const d=def(b);if(d.kind==='prod'&&d.cycle>0&&b.eff>0)b.eff=d.cycle/quarterMinuteCycle(d.cycle/b.eff);}return result;};

/* Screen-space width stays legible while retaining the existing network. */
const POWER_LINE_STYLE=Object.freeze({wirePx:2,flowPx:2.5,previewPx:2.5});
function drawPowerConnectionPreview(ctx,from,to,valid=true){
 if(window.PowerCablePreview?.draw(ctx,from,to,{preview:true,valid,activity:false}))return;
 const x=cx(from)*16,y=cy(from)*16-16,xx=cx(to)*16,yy=cy(to)*16-16;
 ctx.save();ctx.lineWidth=POWER_LINE_STYLE.previewPx/UI.sc;ctx.strokeStyle=valid?'#b5e6ff':'#ef9b85';ctx.setLineDash([5/UI.sc,4/UI.sc]);ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo((x+xx)/2,(y+yy)/2+5,xx,yy);ctx.stroke();ctx.restore();
}
const connectedPoleGhost=drawGhost;
drawGhost=function(ctx,...args){const result=connectedPoleGhost(ctx,...args);if(UI.tool!=='build'||UI.type!=='kabelmast')return result;
 const route=constructionPlan?.tool==='power-line'?constructionPlan.poles:null,first=route?.allSites?.[0],position=first||UI.gpos||UI.hover;
 if(position){const anchor=powerPoleStartAnchor(position.x,position.y),to=placementPreviewBuilding('kabelmast',position.x,position.y);if(anchor)drawPowerConnectionPreview(ctx,anchor,to,route?route.ok:UI.gr?.ok!==false);}
 return result;
};
