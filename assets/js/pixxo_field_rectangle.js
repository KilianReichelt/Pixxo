/* Einzelklick und Rechteckauswahl benutzen dieselben verbindlichen Bauregeln. */
function fieldRectangleEnabled(type=UI.type,rotation=UI.rotation||0){if(B[type]?.kind!=='field')return false;const d=buildingSize(type,rotation);return d.w===1&&d.h===1;}
function fieldRectangleTargets(plan,end){
 const d=buildingSize(plan.type,plan.rotation),owner=G.byId.get(plan.owner),rule=owner&&FIELD_RULES[owner.type];
 const x0=Math.max(0,Math.min(plan.start.x,end.x)),y0=Math.max(0,Math.min(plan.start.y,end.y));
 const x1=Math.min(MAPW-1,Math.max(plan.start.x,end.x)),y1=Math.min(MAPH-1,Math.max(plan.start.y,end.y));
 const remaining=rule?Math.max(0,rule.count-fieldModules(owner).length):0,valid=[];let skipped=0,reason='';
 for(let y=Math.max(y0,owner?owner.y-25:y0);y<=Math.min(y1,owner?owner.y+owner.h+25:y0);y++){
  if((y-y0)%d.h)continue;
  for(let x=Math.max(x0,owner?owner.x-25:x0);x<=Math.min(x1,owner?owner.x+owner.w+25:x0);x++){
   if((x-x0)%d.w)continue;
   const r=canPlace(plan.type,x,y);
   if(r.ok&&valid.length<remaining)valid.push({x,y});else{skipped++;reason=r.why||'Alle Betriebsflächen vorhanden';}
  }
 }
 const total=(Math.floor((x1-x0)/d.w)+1)*(Math.floor((y1-y0)/d.h)+1);
 return {rect:{x0,y0,x1,y1},valid,skipped:Math.max(skipped,total-valid.length),reason};
}
const fieldRectangleBegin=beginConstructionPlan;
beginConstructionPlan=function(t){
 if(UI.tool!=='build'||B[UI.type]?.kind!=='field')return fieldRectangleBegin(t);
 if(!fieldRectangleEnabled()){constructionPlan=null;return;}
 constructionPlan={tool:'fields',start:{...t},end:null,island:activeIsland,type:UI.type,owner:UI.fieldOwner,rotation:UI.rotation||0};updateConstructionPlan(t);
};
const fieldRectangleUpdate=updateConstructionPlan;
updateConstructionPlan=function(t){
 const p=constructionPlan;if(p?.tool!=='fields')return fieldRectangleUpdate(t);
 p.end={...t};p.fields=fieldRectangleTargets(p,t);updateHint();
};
const fieldRectangleFinish=finishConstructionPlan;
finishConstructionPlan=function(){
 const p=constructionPlan;if(p?.tool!=='fields')return fieldRectangleFinish();
 constructionPlan=null;let placed=0;
 if(activeIsland===p.island&&UI.fieldOwner===p.owner&&UI.type===p.type&&(UI.rotation||0)===p.rotation){
  for(const t of p.fields.valid){if(!canPlace(p.type,t.x,t.y).ok)continue;if(place(p.type,t.x,t.y).ok)placed++;}
 }
 UI.paintFail=placed?'':p.fields.reason||'Keine zulässige Betriebsfläche ausgewählt.';
 if(placed){G.dirty=true;rebuildNet();saveGame();renderTop(true);refreshWins();}else msg(UI.paintFail,'i_alert');
 const status=document.querySelector('#map-key-status');if(status)status.textContent=placed+' Betriebsflächen angelegt. '+p.fields.skipped+' Positionen übersprungen.';
 updateHint();
};
const fieldRectangleHint=updateHint;
updateHint=function(){
 const p=constructionPlan;if(p?.tool!=='fields')return fieldRectangleHint();
 constructionPlan=null;try{fieldRectangleHint();}finally{constructionPlan=p;}
 const hint=document.querySelector('#hint');if(!hint)return;let info=hint.querySelector('[data-plan-info]');
 if(!info){info=document.createElement('span');info.dataset.planInfo='';hint.prepend(info);}
 info.textContent=p.fields.valid.length+' zulässige Betriebsflächen · '+p.fields.skipped+' übersprungen · Loslassen zum Anlegen. ';
};
const fieldRectangleGhost=drawGhost;
drawGhost=function(ctx){
 const p=constructionPlan;if(p?.tool!=='fields')return fieldRectangleGhost(ctx);
 const {rect,valid}=p.fields,d=buildingSize(p.type,p.rotation);
 ctx.save();ctx.lineWidth=1/UI.sc;ctx.strokeStyle='#fff0c1';ctx.setLineDash([4/UI.sc,3/UI.sc]);
 ctx.strokeRect(rect.x0*16,rect.y0*16,(rect.x1-rect.x0+1)*16,(rect.y1-rect.y0+1)*16);ctx.setLineDash([]);
 ctx.fillStyle='rgba(235,212,149,.55)';for(const t of valid){ctx.fillRect(t.x*16,t.y*16,d.w*16,d.h*16);ctx.strokeRect(t.x*16+1,t.y*16+1,d.w*16-2,d.h*16-2);}
 ctx.restore();
};
