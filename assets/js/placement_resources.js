/* Counts and placement circles use the same geometry as validation. */
for(const rule of Object.values(FIELD_RULES))if(rule.radius)rule.radius=FIELD_PLACEMENT_RADII[rule.type]||rule.radius;
function placementResourceTargets(){
 if(UI.tool==='relocate'&&UI.moveAnchor&&UI.hover)return relocationTargets(UI.hover);
 if(!['build','move'].includes(UI.tool)||!B[UI.type])return [];
 const t=ghostTile();if(!t)return [];
 const source=UI.tool==='move'?G.byId.get(UI.moveId):null,size=buildingSize(UI.type,UI.rotation||0),p=constructionPosition(t);
 return [{b:source||{type:UI.type,fieldOwner:UI.fieldOwner},...p,...size}];
}
function placementFieldOwner(p,targets){const id=p.b.fieldOwner,owner=G.byId.get(id)||islandBuildingPlans().find(b=>b.id===id);if(!owner)return null;const moving=targets.find(t=>t.b.id===id);return moving?{...owner,x:moving.x,y:moving.y,w:moving.w,h:moving.h}:owner;}
function placementEnvironmentCount(p,targets){
 const d=def(p.b),env=d.env;if(!env)return null;
 const moved=new Set(targets.map(t=>t.b.id).filter(Number.isFinite)),workers=G.blds.filter(b=>B[b.type].env?.t==='tree'&&!moved.has(b.id)&&b.conn&&!b.paused&&b.fire<=0);
 const mx=p.x+p.w/2,my=p.y+p.h/2;let n=0;
 for(let y=Math.floor(my-env.r);y<=my+env.r;y++)for(let x=Math.floor(mx-env.r);x<=mx+env.r;x++){
  if(!INMAP(x,y)||Math.hypot(x+.5-mx,y+.5-my)>env.r)continue;const k=IDX(x,y),t=G.tiles[k],occupied=G.occ[k]&&!moved.has(G.occ[k]),covered=targets.some(v=>x>=v.x&&x<v.x+v.w&&y>=v.y&&y<v.y+v.h);
  if(env.t==='tree'){if(t===T.FOREST&&!occupied&&!G.road[k]&&!covered)n+=1/(1+workers.filter(b=>Math.hypot(x+.5-cx(b),y+.5-cy(b))<=B[b.type].env.r).length);}
  else if(env.t==='fish'&&G.fish[k]||env.t==='rock'&&[T.ROCK,T.ORE].includes(t)||env.t==='ore'&&t===T.ORE||env.t==='fert'&&t===T.GRASS&&!occupied&&!G.road[k]&&!covered)n++;
 }
 return {n,need:env.need,r:env.r};
}
let placementResourceCache=null;
function placementResourceData(){
 const targets=placementResourceTargets(),key=UI.tool+':'+targets.map(p=>[p.b.id,p.b.type,p.b.fieldOwner,p.x,p.y,p.w,p.h].join(',')).join(';')+':'+G.blds.length+':'+islandBuildingPlans().length+':'+Math.floor(G.time);
 if(placementResourceCache?.g===G&&placementResourceCache.key===key)return placementResourceCache;
 const labels=[],circles=new Map();
 for(const p of targets){const owner=B[p.b.type].kind==='field'?placementFieldOwner(p,targets):FIELD_RULES[p.b.type]?{...p.b,x:p.x,y:p.y,w:p.w,h:p.h}:null;
  if(owner){const rule=FIELD_RULES[owner.type];if(!rule)continue;const count=owner.id<0?islandBuildingPlans().filter(f=>f.fieldOwner===owner.id&&f.type===rule.type).length:owner.id?fieldModules(owner).length:0;labels.push(count+' / '+rule.count+' '+B[rule.type].n+' · '+B[owner.type].n);circles.set(owner.id||p.b.type,{b:owner,r:fieldPlacementRadius(owner)});}
  const environment=placementEnvironmentCount(p,targets);if(environment){labels.push(B[p.b.type].n+': '+environment.n.toLocaleString('de-DE',{maximumFractionDigits:1})+' / '+environment.need+' '+({tree:'Bäume',fish:'Fischgründe',rock:'Felsfelder',ore:'Erzfelder',fert:'Nutzflächen'}[B[p.b.type].env.t]||'Ressourcen'));circles.set(p.b.id||p.b.type,{b:{...p.b,x:p.x,y:p.y,w:p.w,h:p.h},r:environment.r});}
 }
 return placementResourceCache={g:G,key,targets,labels:[...new Set(labels)],circles:[...circles.values()]};
}
const resourceFieldProgress=updateFieldProgress;
updateFieldProgress=function(...args){resourceFieldProgress(...args);const data=placementResourceData();if(!data.labels.length)return;fieldProgress.hidden=false;const planned=constructionPlan?.tool==='fields'?constructionPlan.fields?.valid.length||0:0;const text=data.labels.join(' · ')+(planned?' · +'+planned+' beim Loslassen':'');if(fieldProgress.textContent!==text)fieldProgress.textContent=text;};
const resourceGhost=drawGhost;drawGhost=function(ctx,...args){const result=resourceGhost(ctx,...args);if(!['build','move','relocate'].includes(UI.tool))return result;const data=placementResourceData();ctx.save();for(const {b,r} of data.circles)ring(ctx,cx(b),cy(b),r,'#f8edb0',true);if(UI.tool==='relocate')for(const p of data.targets)if(B[p.b.type].kind==='svc')drawLogisticsReach(ctx,{...p.b,x:p.x,y:p.y,w:p.w,h:p.h});ctx.restore();return result;};
