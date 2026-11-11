/* Vergleich im laufenden Spiel, nur über ?effektmessung sichtbar. */
// Performance takes priority: shadows are opt-in diagnostics, never default work.
const GAME_EFFECTS={ao:false,shipShadows:false};
const effectGround=natureGround;natureGround=function(...args){if(GAME_EFFECTS.ao)return effectGround(...args);};
if(new URLSearchParams(location.search).has('effektmessung')){
 const shipMode=new URLSearchParams(location.search).get('effektmessung')==='schiffe',effect=shipMode?'shipShadows':'ao',previousSetting=GAME_EFFECTS[effect];
 const panel=document.createElement('div');panel.style.cssText='position:fixed;left:12px;bottom:130px;z-index:100;background:#241b10;color:#ffedb3;padding:12px;font:14px/1.5 system-ui;max-width:400px';
 const button=document.createElement('button');button.textContent='Leistung messen';button.style.cssText='font:inherit;min-height:44px;padding:8px';const status=document.createElement('p');status.setAttribute('role','status');status.textContent='Vier Durchgänge mit und ohne AO, unveränderte Kamera.';panel.append(button,status);document.body.append(panel);
 let running=false,phase=0,count=0,last=0,renderCost=0,groundCost=0,results=[],artCost=0,shadowCost=0,waterCost=0;
 if(shipMode)status.textContent='Vier Durchgänge mit und ohne Schiffsschatten.';
 const shipArt=makeDirectionalShip;makeDirectionalShip=function(...args){const t=performance.now(),r=shipArt(...args);artCost+=performance.now()-t;return r;};
 const bedShadow=smoothShipBedShadow;smoothShipBedShadow=function(...args){const t=performance.now(),r=bedShadow(...args);shadowCost+=performance.now()-t;return r;};
 const water=drawOcean;drawOcean=function(...args){const t=performance.now(),r=water(...args);waterCost+=performance.now()-t;return r;};
 const ground=natureGround;natureGround=function(...args){const t=performance.now();const r=ground(...args);groundCost+=performance.now()-t;return r;};
 const original=render;render=function(...args){const t=performance.now(),r=original(...args);renderCost+=performance.now()-t;return r;};
 function tick(now){if(!running)return;const gap=now-last;last=now;if(count>=25)results[phase].push({gap,render:renderCost,ao:groundCost,art:artCost,shadow:shadowCost,water:waterCost});renderCost=groundCost=artCost=shadowCost=waterCost=0;count++;
  if(count===145){phase++;count=0;if(phase===4){running=false;GAME_EFFECTS[effect]=previousSetting;button.disabled=false;const mean=(values,key)=>values.reduce((a,v)=>a+v[key],0)/values.length;const off=results[0].concat(results[2]),on=results[1].concat(results[3]);const result={effekt:effect,ohne:{bildMs:mean(off,'gap'),renderMs:mean(off,'render')},mit:{bildMs:mean(on,'gap'),renderMs:mean(on,'render'),aoMs:mean(on,'ao'),schiffsbildMs:mean(on,'art'),schiffsschattenMs:mean(on,'shadow'),wasserMs:mean(on,'water')}};status.textContent=JSON.stringify(result,null,2);console.info('Effektmessung',JSON.stringify(result));return;}results[phase]=[];GAME_EFFECTS[effect]=phase%2===1;status.textContent='Messung '+(phase+1)+'/4 · '+(shipMode?'Schiffsschatten':'AO')+' '+(GAME_EFFECTS[effect]?'an':'aus');}
  requestAnimationFrame(tick);
 }
 button.addEventListener('click',()=>{if(running)return;running=true;button.disabled=true;phase=0;count=0;results=[[]];renderCost=groundCost=artCost=shadowCost=waterCost=0;GAME_EFFECTS[effect]=false;last=performance.now();status.textContent='Messung 1/4 · '+(shipMode?'Schiffsschatten':'AO')+' aus';requestAnimationFrame(tick);});
}
