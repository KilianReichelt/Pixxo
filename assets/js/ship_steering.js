/* Vorwärtsfahrt und Drehung sind eine gemeinsame Bewegung mit Wendekreis. */
const SHIP_STEERING=new WeakMap();
function shipSteeringLeg(sh){
 if(sh.routeApproach){const leg=sh.routeApproach;return {key:leg,path:smoothBerthPath(leg.path,sh,leg.island),duration:leg.duration,remaining:leg.remaining};}
 if(sh.manualTrip)return {key:sh.manualTrip,...sh.manualTrip};
 if(sh.route&&sh.phase==='travel'){const path=routeWaterPath(sh.at,sh.to);if(path)return {key:path,path:smoothBerthPath(path,sh,sh.to),duration:voyageTime(sh.at,sh.to,sh.type),remaining:sh.remaining};}
 const dock=SMOOTH_SHIP_STATE.get(sh)?.dockApproach;if(dock)return {key:dock,path:dock.path,duration:dock.duration,remaining:Math.max(0,dock.duration-(G.time||0)+dock.start),docking:true};
 return null;
}
function shipRouteProjection(geometry,x,y){let best=Infinity,distance=0;for(let i=1;i<geometry.points.length;i++){const a=geometry.points[i-1],b=geometry.points[i],dx=b[0]-a[0],dy=b[1]-a[1],length=dx*dx+dy*dy,t=length?Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/length)):0,d=(x-a[0]-dx*t)**2+(y-a[1]-dy*t)**2;if(d<best){best=d;distance=geometry.lengths[i-1]+Math.sqrt(length)*t;}}return distance;}
function shipForwardStep(state,speed,turn,dt){const angle=state.angle+turn*dt*.5;return {x:state.x+Math.cos(angle)*speed*dt,y:state.y+Math.sin(angle)*speed*dt,angle:state.angle+turn*dt};}
function shipArcClear(state,speed,turn,duration){let p=state;const steps=Math.max(2,Math.ceil(duration*speed*6));for(let i=0;i<steps;i++){p=shipForwardStep(p,speed,turn,duration/steps);if(!smoothSeaWater(p.x,p.y,.16))return false;}return true;}
function shipSteerForward(state,geometry,speed,dt,type){
 const end=geometry.points.at(-1),goalDistance=Math.hypot(end[0]-state.x,end[1]-state.y),last=geometry.points[Math.max(0,geometry.points.length-2)],endAngle=Math.atan2(end[1]-last[1],end[0]-last[0]);
 if(goalDistance<.12&&Math.cos(endAngle-state.angle)>.85){state.arrived=true;return;}
 const routeDistance=shipRouteProjection(geometry,state.x,state.y),target=smoothSeaSample(geometry,routeDistance+Math.max(1.25,speed*.85)),desired=Math.atan2(target.y-state.y,target.x-state.x),delta=Math.atan2(Math.sin(desired-state.angle),Math.cos(desired-state.angle));
 const radius=type==='clipper'?1.65:1.35,maxTurn=speed/radius;
 let turn=Math.max(-maxTurn,Math.min(maxTurn,delta*2.2));
 if(Math.abs(delta)>2.65&&!state.turnSide){const candidates=[1,-1].map(side=>({side,clear:shipArcClear(state,speed,side*maxTurn,Math.PI/maxTurn)}));state.turnSide=(candidates.find(c=>c.clear)||{side:delta>=0?1:-1}).side;}
 if(state.turnSide){if(Math.abs(delta)<1.25)delete state.turnSide;else turn=state.turnSide*maxTurn;}
 // Im freien Wasser bleibt der Wendebogen erhalten; enge Häfen erlauben Pivotieren.
 const pivot=()=>{if(!smoothSeaWater(state.x,state.y,.12)){state.blocked=true;return;}state.angle+=Math.max(-maxTurn*dt,Math.min(maxTurn*dt,delta));state.blocked=false;state.pivoting=true;delete state.turnSide;};
 state.pivoting=false;
 if(!shipArcClear(state,speed,turn,.6)){
  const options=[-maxTurn,maxTurn,0,-maxTurn*.5,maxTurn*.5].filter(w=>shipArcClear(state,speed,w,.65));
  if(!options.length){pivot();return;}
  turn=options.reduce((best,w)=>{const score=v=>{const q=shipForwardStep(state,speed,v,.65);return Math.hypot(target.x-q.x,target.y-q.y)+Math.abs(v-turn)*.12;};return score(w)<score(best)?w:best;},options[0]);
 }
 const step=shipForwardStep(state,speed,turn,dt);if(!smoothSeaWater(step.x,step.y,.12)){pivot();return;}
 Object.assign(state,step);state.blocked=false;
}
const steeringStationaryPosition=freeShipPosition;
freeShipPosition=function(sh){
 const leg=shipSteeringLeg(sh),residual=typeof simulationAccumulator==='number'?Math.max(0,simulationAccumulator)*(G.speed||0):0,time=(G.time||0)+residual;
 let state=SHIP_STEERING.get(sh);
 if(!leg){const p=steeringStationaryPosition(sh);if(p){SHIP_STEERING.set(sh,{x:p.x,y:p.y,angle:(p.heading8??sh.heading??0)*Math.PI/4,time,arrived:true,key:null});}return p;}
 const geometry=smoothSeaGeometry(leg.path);if(!geometry)return steeringStationaryPosition(sh);
 if(!state){const p=interpolatedSeaPosition(leg.path,1-(leg.remaining||0)/leg.duration);state={x:p.x,y:p.y,angle:(p.heading8||0)*Math.PI/4,time,key:leg.key,arrived:false};SHIP_STEERING.set(sh,state);}
 if(state.key!==leg.key){state.key=leg.key;state.arrived=false;delete state.turnSide;}
 let dt=Math.max(0,Math.min(.5,time-state.time));state.time=time;
 const speed=Math.max(.15,geometry.length/Math.max(1,leg.duration));
 while(dt>1e-6&&!state.arrived){const step=Math.min(1/30,dt);shipSteerForward(state,geometry,speed,step,sh.type);dt-=step;}
 if(state.arrived&&leg.docking){const visual=SMOOTH_SHIP_STATE.get(sh);if(visual)delete visual.dockApproach;}
 const p={x:state.x,y:state.y,heading8:state.angle*4/Math.PI,index:geometry.length?shipRouteProjection(geometry,state.x,state.y)/geometry.length*(leg.path.length-1):0};
 // Auch das spätere Festmachen übernimmt den tatsächlich gefahrenen Kurs.
 const visual=SMOOTH_SHIP_STATE.get(sh);if(visual){visual.angle=p.heading8;visual.p=p;visual.time=UI.vt||0;}
 return p;
};
const steeringStepFleet=stepFleet;stepFleet=function(dt){
 for(const sh of WORLD.fleet){const leg=shipSteeringLeg(sh),state=SHIP_STEERING.get(sh);if(!leg||!state||state.arrived)continue;
  if(sh.manualTrip)sh.manualTrip.remaining=Math.max(sh.manualTrip.remaining,dt+.05);
  else if(sh.routeApproach)sh.routeApproach.remaining=Math.max(sh.routeApproach.remaining,dt+.05);
  else sh.remaining=Math.max(sh.remaining||0,dt+.05);
  if(state.pivoting)sh.status='Wendet auf der Stelle';
  else if(state.blocked)sh.status='Wartet auf freie Fahrt';
 }
 return steeringStepFleet(dt);
};
