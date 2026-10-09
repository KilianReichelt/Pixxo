startNew();G.speed=0;
const measure=(fn,n=8)=>{const times=[];for(let i=0;i<n;i++){const t=performance.now();fn(i);times.push(performance.now()-t);}times.sort((a,b)=>a-b);return {mean:times.reduce((a,b)=>a+b,0)/n,p95:times[Math.min(n-1,Math.floor(n*.95))],max:times[n-1]};};
render();drawMini();
const metrics={map:[MAPW,MAPH],mini:measure(()=>drawMini()),fog:measure(i=>{revealSea(1100+i,800,30);prepareFog();}),render:measure(()=>render(),30),simulation:measure(()=>stepWorld(.1),20),save:measure(()=>saveGame(),3)};
const panOrigin={...UI.cam};metrics.pan=measure(i=>{UI.cam.x=panOrigin.x+i*64;UI.cam.y=panOrigin.y+(i%3)*64;render();},45);Object.assign(UI.cam,panOrigin);
// Große, vollständig verbundene Siedlung als synthetischer Belastungstest.
G.tiles.fill(T.GRASS);G.occ.fill(0);G.road.fill(0);G.blds=[];G.byId.clear();PERF_ROADS.delete(G.road);G.nid=1;
const make=(type,x,y)=>{const d=B[type],b={id:G.nid++,type,x,y,w:d.w,h:d.h,tier:1,island:0,pop:type==='haus'?4:0,conn:false,acc:-1,eff:1,envEff:1,staffEff:1,fire:0,paused:false,prog:0,age:0,need:{},sat:{},cov:{},mood:1,status:'',inputStock:{}};G.blds.push(b);G.byId.set(b.id,b);for(const [xx,yy] of footprintCells(x,y,b.w,b.h))G.occ[IDX(xx,yy)]=b.id;return b;};
make('kontor',995,897);
for(let i=0;i<600;i++){const x=1002+(i%30)*6,y=904+Math.floor(i/30)*7;make('haus',x,y);}
for(let i=0;i<90;i++){const x=1002+(i%30)*6,y=1050+Math.floor(i/30)*7;make(['saegewerk','baeckerei','weberei'][i%3],x,y);}
for(let row=0;row<23;row++){const y=(row<20?904+row*7:1050+(row-20)*7)-1;for(let x=1000;x<=1181;x++)G.road[IDX(x,y)]=1;}
for(let y=896;y<=1071;y++)G.road[IDX(1000,y)]=1;
for(let row=0;row<4;row++)make('lager',1002+row*45,1080);
G.stock=Object.fromEntries(GOODS.map(g=>[g.id,100000]));G.nextFire=G.nextShip=1e9;G.dirty=true;
metrics.network=measure(()=>rebuildNet(),1);land=null;buildLand();UI.cam.x=1080*16;UI.cam.y=970*16;UI.sc=1.5;
render();stepWorld(.1);metrics.settlement={buildings:G.blds.length,render:measure(()=>render(),60),simulation:measure(()=>stepWorld(.1),60),mini:measure(()=>drawMini()),save:measure(()=>saveGame(),2)};
const output=document.createElement('pre');output.id='test-results';output.textContent=JSON.stringify({passed:1,total:1,results:[{name:'Messung',ok:true}],metrics});document.body.append(output);
