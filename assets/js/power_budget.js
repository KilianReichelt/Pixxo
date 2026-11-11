/* A finite budget belongs to each connected cable network, including sea links. */
const POWER_BUDGET={buildingsPerPlant:40};
function powerConsumer(b){return !['dampfkraftwerk','kabelmast','umspannwerk','kabelstation'].includes(b.type)&&!['field','decor','ruin'].includes(B[b.type]?.kind);}
const budgetCpuPowerUpdate=needsPowerUpdate;
needsPowerUpdate=function(g=G){
 if(g.cpu)return budgetCpuPowerUpdate(g);
 const current=G,index=activeIsland,states=WORLD.islands.filter(s=>s&&!s.cpu),nets=new Map(),nodes=new Map(),adjacency=new Map(),owners=new Map();
 try{for(const state of states){G=state;activeIsland=state.island;const net=needsPowerTopology(state);nets.set(state,net);for(const b of net.nodes){nodes.set(b.id,b);owners.set(b.id,state);adjacency.set(b.id,net.neighbours.get(b.id).map(n=>n.id));}}}finally{G=current;activeIsland=index;}
 const live=b=>b&&!b.paused&&b.fire<=0,running=b=>b.type==='dampfkraftwerk'&&live(b)&&b.conn&&b.staffEff>0&&b.powerFuelRemaining>0;
 const signature=[...nets].map(([state,net])=>{if(!cableTopologyIds.has(net))cableTopologyIds.set(net,++cableTopologySerial);return state.island+':'+cableTopologyIds.get(net)+':'+state.blds.map(b=>[b.id,!b.paused,b.fire<=0,...(nodes.has(b.id)?[b.conn,b.staffEff>0,b.powerFuelRemaining>0]:[])].join(',')).join(';');}).join('|')+'#'+(WORLD.subseaCables||[]).map(c=>c.a+','+c.b).join(';');
 if(cableFlowState?.world===WORLD&&cableFlowState.signature===signature)return nets.get(g)||needsPowerTopology(g);
 for(const c of WORLD.subseaCables||[])if(live(nodes.get(c.a))&&live(nodes.get(c.b))&&adjacency.has(c.a)&&adjacency.has(c.b)){adjacency.get(c.a).push(c.b);adjacency.get(c.b).push(c.a);}
 const components=[],componentByNode=new Map();
 for(const source of nodes.values())if(live(source)&&!componentByNode.has(source.id)){
  const component={id:source.id,nodes:[],plants:[],capacity:0,demand:0,supplied:0,waiting:0,islands:new Map()},queue=[source.id];componentByNode.set(source.id,component);
  for(let i=0;i<queue.length;i++){const b=nodes.get(queue[i]);component.nodes.push(b);if(running(b))component.plants.push(b);for(const id of adjacency.get(b.id)||[])if(live(nodes.get(id))&&!componentByNode.has(id)){componentByNode.set(id,component);queue.push(id);}}
  component.id=Math.min(...queue);component.capacity=component.plants.length*POWER_BUDGET.buildingsPerPlant;components.push(component);
 }
 const depth=new Map(),flow=[...nodes.values()].filter(running).map(b=>b.id);for(const id of flow)depth.set(id,0);
 for(let i=0;i<flow.length;i++)for(const id of adjacency.get(flow[i])||[])if(live(nodes.get(id))&&!depth.has(id)){depth.set(id,depth.get(flow[i])+1);flow.push(id);}
 const candidates=[];
 for(const [state,net] of nets){
  const roadNetworks=new Map(),roads=new Set();
  for(const s of net.substations){const component=componentByNode.get(s.b.id);if(!component||!live(s.b)||!s.b.conn)continue;for(const [k] of s.roads){if(component.capacity)roads.add(k);if(!roadNetworks.has(k))roadNetworks.set(k,new Set());roadNetworks.get(k).add(component);}}
  state.powerRoads=roads;state.powerSummary={capacity:0,generated:0,supplied:0,demand:0,waiting:0,networks:[]};
  for(const b of state.blds){
   if(nodes.has(b.id)){b.powered=depth.has(b.id);b.powerDistance=depth.get(b.id)??Infinity;b.powerNetwork=componentByNode.get(b.id)||null;}
   const choices=new Set();if(live(b)&&powerConsumer(b))for(const [x,y] of ringCells(b))if(INMAP(x,y))for(const component of roadNetworks.get(IDX(x,y))||[])choices.add(component);
   if(choices.size)candidates.push({b,state,choices:[...choices],retain:!!(b.electrified||b.powerRetained)});
   else{b.electrified=false;b.powerRetained=false;b.powerWaiting=false;if(b.type==='haus'){b.cov??={};b.cov.strom=false;}}
   if(b.type==='dampfkraftwerk'){b.powerLoad=0;b.powerAtCapacity=false;}
  }
 }
 candidates.sort((a,b)=>Number(b.retain)-Number(a.retain)||a.b.id-b.b.id);
 for(const item of candidates){const {b,state,choices}=item;choices.sort((a,c)=>Number(c.id===b.powerNetworkId)-Number(a.id===b.powerNetworkId)||((c.capacity-c.supplied>0)-(a.capacity-a.supplied>0))||a.id-c.id);const component=choices.find(c=>c.supplied<c.capacity)||choices[0];
  component.demand++;b.electrified=component.supplied<component.capacity;b.powerRetained=b.electrified;b.powerWaiting=!b.electrified;b.powerNetworkId=component.id;
  if(b.electrified)component.supplied++;else component.waiting++;
  if(b.type==='haus'){b.cov??={};b.cov.strom=b.electrified;}
  if(!component.islands.has(state.island))component.islands.set(state.island,{island:state.island,capacity:0,generated:0,supplied:0,demand:0,waiting:0});
  const row=component.islands.get(state.island);row.demand++;if(b.electrified)row.supplied++;else row.waiting++;
 }
 for(const component of components){
  component.plants.sort((a,b)=>a.id-b.id);component.plants.forEach((b,i)=>{const state=owners.get(b.id),load=Math.floor(component.supplied/component.plants.length)+(i<component.supplied%component.plants.length?1:0);b.powerLoad=load;b.powerAtCapacity=load>=POWER_BUDGET.buildingsPerPlant;
   if(!component.islands.has(state.island))component.islands.set(state.island,{island:state.island,capacity:0,generated:0,supplied:0,demand:0,waiting:0});const row=component.islands.get(state.island);row.capacity+=POWER_BUDGET.buildingsPerPlant;row.generated+=load;
  });
  for(const row of component.islands.values()){const state=WORLD.islands[row.island],summary=state.powerSummary;for(const key of ['capacity','generated','supplied','demand','waiting'])summary[key]+=row[key];summary.networks.push(component);}
 }
 WORLD.powerNetworks=components;cableFlowState={world:WORLD,signature};return nets.get(g)||needsPowerTopology(g);
};
function powerBudgetHTML(b){
 const component=b.powerNetwork;if(!component)return '<p>Keine Verbindung zu einem Stromnetz.</p>';
 const total=component.capacity,used=component.supplied;
 let html='<section class="power-budget"><h3>Netzauslastung</h3><p>'+used+' / '+total+' Gebäude versorgt'+(component.waiting?' · '+component.waiting+' warten':'')+'</p>'+bar(total?used/total:0,component.waiting?'#ce7358':'#78bfff');
 if(b.type==='dampfkraftwerk')html+='<p>Dieses Kraftwerk: '+(b.powerLoad||0)+' / '+POWER_BUDGET.buildingsPerPlant+' · '+Math.round((b.powerLoad||0)/POWER_BUDGET.buildingsPerPlant*100)+' % Auslastung</p>';
 html+='<p>Ein Gebäude benötigt eine Einheit. Bestehende Versorgung hat Vorrang. Getrennte Kabelnetze teilen keine Kapazität.</p><table class="tbl"><thead><tr><th>Insel</th><th>Erzeugung</th><th>Verbrauch</th><th>Warten</th></tr></thead><tbody>';
 for(const row of component.islands.values()){const balance=row.generated-row.supplied;html+='<tr><th>'+esc(islandName(row.island))+'</th><td>'+row.generated+' / '+row.capacity+'</td><td>'+row.supplied+(balance?' <span data-game-tooltip="'+(balance>0?'Export':'Import')+': '+Math.abs(balance)+' Einheiten">'+(balance>0?'↑':'↓')+Math.abs(balance)+'</span>':'')+'</td><td>'+row.waiting+'</td></tr>';}
 html+='</tbody></table><h3>Kraftwerke dieses Netzes</h3>';
 for(const plant of component.nodes.filter(b=>b.type==='dampfkraftwerk'))html+='<button type="button" class="btn" data-act="power-source" data-building="'+plant.id+'" data-island="'+ownersIsland(plant)+'">'+esc(islandName(ownersIsland(plant)))+' · '+plant.x+', '+plant.y+' · '+(plant.powerLoad||0)+' / '+POWER_BUDGET.buildingsPerPlant+(component.plants.includes(plant)?'':' · nicht in Betrieb')+'</button>';
 return html+'</section>';
}
function ownersIsland(b){return b.island??WORLD.islands.find(g=>g?.byId.get(b.id)===b)?.island??activeIsland;}
const budgetInfo=infoHTML;infoHTML=function(...args){const html=budgetInfo(...args),b=G.byId.get(UI.sel);return b&&['dampfkraftwerk','kabelmast','umspannwerk','kabelstation'].includes(b.type)?html+powerBudgetHTML(b):html;};
const budgetWarning=buildingWarning;buildingWarning=function(b){const warning=budgetWarning(b);if(warning)return warning;if(b.type==='dampfkraftwerk'&&b.powerAtCapacity)return {key:'i_warn_stromlimit',fallback:'i_alert',text:'Kraftwerk ausgelastet: '+b.powerLoad+' / '+POWER_BUDGET.buildingsPerPlant+' Gebäude. '+(b.powerNetwork?.waiting||0)+' weitere Gebäude warten im Netz.'};return null;};
const budgetAction=winAct;winAct=function(id,ds){if(ds.act==='power-source'){const island=Number(ds.island),state=WORLD.islands[island],b=state?.byId.get(Number(ds.building));if(b&&!state.cpu){if(activeIsland!==island)activateIsland(island);centerOn(cx(b),cy(b));selectB(b.id);}return;}return budgetAction(id,ds);};
const budgetPack=packIsland;packIsland=function(g){const data=budgetPack(g);for(const b of data.blds)b.powerRetained=!!g.byId.get(b.id)?.electrified;return data;};
const budgetUnpack=unpackIsland;unpackIsland=function(data,...args){const g=budgetUnpack(data,...args),saved=new Map((data.blds||[]).map(b=>[b.id,b]));for(const b of g.blds)b.powerRetained=!!saved.get(b.id)?.powerRetained;return g;};
