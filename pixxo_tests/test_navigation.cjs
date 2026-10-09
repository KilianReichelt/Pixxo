/* Ausführen mit Node.js; keine Browser- oder Paketabhängigkeiten. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'pixxo.html'),'utf8');
const noop=()=>{},canvasContext=new Proxy({},{get:()=>noop,set:()=>true});
const facts={innerHTML:'',contains:()=>false};
const sandbox={Math,Map,Set,WeakMap,Uint8Array,Uint32Array,Int32Array,Float64Array,
 MAPW:12,MAPH:12,T:{DEEP:0,SHAL:1,SAND:2},G:{tiles:new Uint8Array(144),blds:[]},
 IDX:(x,y)=>y*12+x,INMAP:(x,y)=>x>=0&&y>=0&&x<12&&y<12,
 WORLD:{rootSeed:42,islands:[],routes:[],fleet:[]},UI:{z:1,viewedIsland:0},activeIsland:0,islandOwners:new Int16Array(144).fill(-1),
 ISLANDS:[{name:'Prüfinsel',wx:8,wy:8,size:1,fert:['getreide']}],GN:{getreide:{n:'Getreide'}},SHIPS:{schooner:{speed:1,slots:2},clipper:{speed:2,slots:4}},
 seaPath:noop,routeWaterPath:noop,voyageTime:noop,sailShip:noop,freeShipPosition:noop,shipActivity:noop,renderBar:noop,renderTop:noop,routeForm:noop,shipHTML:()=>'',winAct:noop,updateFog:noop,renderIslandFacts:noop,makeDirectionalShip:noop,drawFleet:noop,drawLandRegion:noop,drawWorldFog:noop,worldBuildings:noop,
 waterRoutes:new Map(),SP:{},urlC:{},SHIP_SPRITES:{schooner:[],clipper:[]},soundEffect:noop,headingForPath:()=>0,drawShipSprite:noop,
 fogClock:0,fogDirty:false,fogFades:new Map(),PERF_FOG:{miniDirty:false,chunks:new Map()},revealSea:noop,
 document:{createElement:()=>({getContext:()=>canvasContext,toDataURL:()=>'',setAttribute:noop}),activeElement:null,querySelector:()=>null},
 $:selector=>selector==='#islandfacts'?facts:null,esc:s=>s,attr:s=>s,ic:()=>'',unsettledDeposits:()=>[],
 land:{},buildLand:noop,mmBase:{},nativeDrawImage:noop,prepareFog:noop,scr2w:(x,y)=>({x,y}),innerWidth:1440,innerHeight:1000,
 clamp:(n,a,b)=>Math.max(a,Math.min(b,n))};
vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(root,'assets','js','pixxo_navigation.js'),'utf8'),sandbox);
const run=s=>vm.runInContext(s,sandbox),checks=[];
function check(ok,label){assert.ok(ok,label);checks.push(label);}
let p=run('seaPath({x:1,y:1},{x:9,y:9})');
check(p.length===9&&p.every((n,i)=>!i||n[0]-p[i-1][0]===1&&n[1]-p[i-1][1]===1),'Freie See nutzt diagonale Wege');
check(Math.abs(run('seaPathLength(seaPath({x:1,y:1},{x:9,y:9}))')-8*Math.SQRT2)<1e-8,'Reisedauer berücksichtigt diagonale Streckenlänge');
run('G.tiles[IDX(2,1)]=T.SAND;G.tiles[IDX(1,2)]=T.SAND;seaSearch=null');
p=run('seaPath({x:1,y:1},{x:2,y:2})');
check(p.length>2,'Schiffe schneiden keine Küstenecken');
run('G.tiles=new Uint8Array(144);for(let y=4;y<=8;y++)for(let x=4;x<=8;x++)G.tiles[IDX(x,y)]=T.SAND;G.tiles[IDX(6,6)]=T.DEEP;seaSearch=null');
const nearest=run('nearestWater({x:1,y:1},{x:6,y:6})');
check(Math.hypot(nearest.x-6,nearest.y-6)===3,'Landziel wählt die nächste erreichbare Küste statt eines eingeschlossenen Sees');
const sh={id:1,type:'schooner',at:0,route:null,buildLeft:0,cargo:[],anchor:{x:1,y:1}};
sandbox.WORLD.islands=[{dock:{x:1,y:1},blds:[],deposits:[{type:'mine'}]}];sandbox.WORLD.fleet=[sh];sandbox.sh=sh;
check(run('sailShip(sh,6,6)')===true&&sh.manualTrip.path.length>1,'Landklick startet eine Fahrt');
check(run('shipActivity(sh)[0]')==='i_sailing','Fahrendes Schiff zeigt Bewegungszeichen');
const atStart=run('freeShipPosition(sh)');sh.manualTrip.remaining-=.01;const moving=run('freeShipPosition(sh)');
check(Math.hypot(moving.x-atStart.x,moving.y-atStart.y)>0,'Schiff fährt kontinuierlich zwischen Wegpunkten');
sh.route=7;sandbox.WORLD.routes=[{id:7,paused:false}];
check(run('shipActivity(sh)[0]')==='i_route','Handelsroute hat ein eigenes Zustandszeichen');
check(run('sailShip(sh,1,1)')!==true,'Manuelle Fahrt übernimmt kein Schiff auf einer Route');
sh.route=null;delete sh.manualTrip;
check(run('shipActivity(sh)[0]')==='i_anchor','Stehendes Schiff zeigt Ankerzeichen');
sandbox.WORLD.islands.push({dock:{x:10,y:10},blds:[]});
check(run('routeWaterPath(0,1).length')>1&&run('routeWaterPath(1,0)[0][0]')===10.5,'Handelswege nutzen dieselbe sichere Navigation in beiden Richtungen');
sandbox.WORLD.fog={cells:new Uint8Array(144),islands:[false]};sh.anchor={x:8,y:8};sandbox.PERF_FOG.chunks.set('old',{});
sandbox.islandOwners[8*12+8]=0;sandbox.G.tiles[8*12+8]=2;
run('updateFog(.2)');
check(sandbox.WORLD.fog.islands[0]&&!sandbox.fogFades.size&&!sandbox.PERF_FOG.chunks.size,'Entdeckte Insel wird sofort ohne Nebelblende sichtbar');
check(facts.innerHTML.includes('Getreide')&&facts.innerHTML.includes('Eisenerz'),'Ressourcennamen sind über der Minikarte sichtbar');
const old=run('worldBuildings()');sandbox.WORLD.islands[0].blds.push({id:4});
check(run('worldBuildings().length')===1&&run('worldBuildings()')!==old,'Gebäudecache berücksichtigt Neubauten');
check(html.includes('WINS.route.static=true')&&html.includes('if(w.static||'),'Routenformular bleibt bei periodischen Aktualisierungen erhalten');
check(html.includes('routecargo[hidden]{display:none!important}'),'Nicht vorhandene Frachträume bleiben verborgen');
check(!fs.readFileSync(path.join(root,'assets','js','pixxo_gameplay.js'),'utf8').includes("b.type==='haus'&&b.acc>=0"),'Gezeichnete Hausanschlüsse sind entfernt');
// Bestehende Handelssimulation mit neuer Navigation: Restladung darf nie verschwinden.
const fleetCode=html.slice(html.indexOf('function stepFleet(dt)'),html.indexOf('function drawFleet(ctx)'));
sandbox.islandCap=()=>100;sandbox.portSpeed=()=>10;sandbox.msg=()=>{};sandbox.establishIsland=()=>true;
sandbox.ISLANDS.push({name:'Zielinsel',wx:10,wy:10,size:1,fert:[]});
vm.runInContext(fleetCode,sandbox);
run("WORLD.islands=[{dock:{x:1,y:1},blds:[],stock:{bretter:0,trauben:0}},{dock:{x:10,y:10},blds:[],stock:{bretter:100,trauben:60}}];WORLD.routes=[{id:7,from:0,to:1,reserve:10,out:[{good:'bretter',qty:50}],back:[{good:'trauben',qty:50}],paused:false}];WORLD.fleet=[{id:1,type:'schooner',at:1,route:7,phase:'unload',remaining:0,buildLeft:0,cargo:[{good:'bretter',qty:12}]}];");
run('stepFleet(1)');check(run('WORLD.fleet[0].cargo[0].qty===12&&WORLD.fleet[0].phase==="load"'),'Volles Lager erhält die Restladung');
run('WORLD.fleet[0].remaining=0;stepFleet(1)');
check(run('WORLD.fleet[0].cargo.length===2&&WORLD.islands[1].stock.trauben===10'),'Rückfracht berücksichtigt Mindestbestand und freie Frachträume');
run('WORLD.fleet[0].remaining=0;stepFleet(1)');
check(run('WORLD.fleet[0].cargo.length===0&&WORLD.islands[0].stock.bretter===12&&WORLD.islands[0].stock.trauben===50'),'Restladung und Rückfracht kommen vollständig im Quellhafen an');
const routeError={textContent:''};sandbox.$=selector=>selector==='#routeerror'?routeError:null;
sandbox.routeEdit=null;sandbox.closeWin=noop;sandbox.refreshWins=noop;sandbox.saveGame=()=>{sandbox.saved=true;};sandbox.GN.bretter={n:'Bretter'};
vm.runInContext(html.slice(html.indexOf('function saveRoute(e)'),html.indexOf('function openWin_buildings()')),sandbox);
run("WORLD.routes=[];WORLD.nextId=20;WORLD.fleet[0].route=null;WORLD.fleet[0].at=0;WORLD.fleet[0].phase='load';WORLD.fleet[0].anchor={x:1,y:1};");
const elements={ship:{value:'1'},from:{value:'0'},to:{value:'1'},reserve:{value:'10'},name:{value:'Prüfroute'},waitForSpace:{checked:true}};
for(const dir of ['out','back'])for(let j=0;j<2;j++){elements[dir+'good'+j]={value:dir==='out'&&j===0?'bretter':''};elements[dir+'qty'+j]={value:'25'};}
sandbox.routeEvent={target:{elements},preventDefault:noop};run('saveRoute(routeEvent)');
check(run('WORLD.routes[0].out[0].qty===25&&WORLD.routes[0].waitForSpace&&WORLD.fleet[0].route===20&&!WORLD.fleet[0].anchor&&saved'),'Routenformular speichert Frachtauftrag, Warteoption und Schiffszuteilung');
console.log(JSON.stringify({passed:checks.length,checks},null,2));
