const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict'),root=path.resolve(__dirname,'..'),checks=[];
const check=(value,label)=>{assert.ok(value,label);checks.push(label);},stock=()=>({getreide:0,fisch:0,holz:0,stein:0});
let saves=0,delegated=[];
const c={WORLD:{fleet:[],routes:[],nextId:1,islands:Array.from({length:4},(_,i)=>({dock:{x:i,y:0},stock:stock(),cap:500}))},ISLANDS:['Heimat','Weidenholm','Steinort','Ferninsel'].map(name=>({name})),SHIPS:{schooner:{slots:2},clipper:{slots:4}},GN:{getreide:{n:'Getreide'},fisch:{n:'Fisch'},holz:{n:'Holz'},stein:{n:'Stein'}},GOODS:['getreide','fisch','holz','stein'].map(id=>({id,n:id})),UI:{},WINS:{},routeEdit:null,stepFleet:()=>{delegated=c.WORLD.fleet.map(s=>s.id);},routeWaterPath:()=>[[0,0],[1,1]],voyageTime:()=>10,islandCap:g=>g.cap,portSpeed:()=>10,saveGame:()=>{saves++;},winAct(){},msg(){},refreshWins(){},renderTop(){},JSON,Math,Set,Number,String};
vm.createContext(c);const run=s=>vm.runInContext(s,c);run(fs.readFileSync(path.join(root,'assets','js','pixxo_trade_routes.js'),'utf8'));
const order=(good,qty)=>({good,qty}),slot=(load=null,unload=null)=>({load,unload}),station=(island,...slots)=>({island,slots});
function reset(){c.WORLD.routes=[];c.WORLD.fleet=[];c.WORLD.islands.forEach(g=>{g.stock=stock();g.cap=500;});}
function ship(){return {id:1,name:'Schoner',type:'schooner',at:0,cargo:[],phase:'idle',remaining:0};}
function draft(stations){return {name:'Versorgungsrunde',ship:1,reserve:0,waitForSpace:false,waitForGoods:false,stations};}
function commit(d){c.draft=d;return run('commitTradeRoute(draft,null)');}
function tick(){run('stepFleet(20)');}
reset();const sh=ship();c.WORLD.fleet=[sh,{id:2,at:0,cargo:[]}];c.WORLD.islands[0].stock={...stock(),getreide:100,fisch:100};
const d=draft([station(0,slot(order('getreide',40),order('stein',50)),slot(order('fisch',20))),station(1,slot(null,order('getreide',10)),slot(order('holz',30),order('fisch',20))),station(2,slot(order('stein',50),order('getreide',30)),slot(null,order('holz',30)))]);
c.WORLD.islands[1].stock.holz=100;c.WORLD.islands[2].stock.stein=100;
check(commit(d)===true&&c.WORLD.routes[0].stations.length===3,'Eine Route speichert mehr als zwei Stationen mit getrennten Aufträgen');
const arrivals=[0];let previous=0;for(let i=0;i<30;i++){tick();if(sh.at!==previous){arrivals.push(sh.at);previous=sh.at;}if(arrivals.length===4&&sh.phase==='load')break;}
check(arrivals.join(',')==='0,1,2,0','Das Schiff fährt Heimat → Zwischenhafen → Zielhafen → Heimat in einer Endlosschleife');
check(c.WORLD.islands[1].stock.getreide===10&&c.WORLD.islands[2].stock.getreide===30,'Eine Ware wird auf zwei Stationen in exakt vorgegebenen Teilmengen entladen');
check(c.WORLD.islands[1].stock.fisch===20&&c.WORLD.islands[2].stock.holz===30,'Ein frei gewordener Frachtraum lädt am Zwischenhafen eine andere Ware zu');
check(c.WORLD.islands[0].stock.stein===50,'Die Rückkehr entlädt ausschließlich den für diese Station bestimmten Auftrag');
check(delegated.join(',')==='2','Freie Schiffe bleiben bei der bisherigen Navigation und Werftlogik');
check(run('tradeRouteLegs(WORLD.routes[0]).length')===3&&run('tradeRouteLabel(WORLD.routes[0])').includes('Steinort'),'Routenanzeige und Kartenverbindungen enthalten alle Stationen einschließlich Rückweg');
reset();const wait=ship();wait.cargo=[{good:'getreide',qty:40,slot:0}];wait.route=1;wait.phase='unload';c.WORLD.fleet=[wait];const wr={id:1,...draft([station(0,slot(null,order('getreide',20)),slot()),station(1,slot(),slot())]),waitForSpace:true};c.WORLD.routes=[wr];c.WORLD.islands[0].stock.getreide=495;
tick();check(wait.cargo[0].qty===35&&wait.routePending[0]===15&&wait.phase==='unload','Bei vollem Lager wird nur die verfügbare Teilmenge entladen und der Restauftrag behalten');
tick();check(wait.cargo[0].qty===35,'Warten auf Lagerplatz wiederholt keine bereits übertragene Ware');
c.WORLD.islands[0].stock.getreide=480;tick();check(wait.cargo[0].qty===20&&c.WORLD.islands[0].stock.getreide===495&&wait.phase==='load','Nach Freigabe des Lagerplatzes wird nur der noch offene Restauftrag übertragen');
reset();const partial=ship();partial.route=1;partial.phase='load';c.WORLD.fleet=[partial];c.WORLD.routes=[{id:1,...draft([station(0,slot(order('fisch',30)),slot()),station(1,slot(),slot())]),waitForGoods:true,reserve:10}];c.WORLD.islands[0].stock.fisch=20;
tick();check(partial.cargo[0].qty===10&&partial.routePending[0]===20&&c.WORLD.islands[0].stock.fisch===10,'Laden berücksichtigt den Mindestbestand und merkt sich fehlende Mengen');
c.WORLD.islands[0].stock.fisch+=25;tick();check(partial.cargo[0].qty===30&&partial.phase==='depart'&&c.WORLD.islands[0].stock.fisch===15,'Warten auf Waren lädt die fehlende Restmenge genau einmal zu');
reset();const carry=ship();carry.route=1;carry.phase='unload';carry.cargo=[{good:'getreide',qty:40,slot:0}];c.WORLD.fleet=[carry];c.WORLD.routes=[{id:1,...draft([station(0,slot(order('holz',30),order('getreide',20)),slot()),station(1,slot(),slot())])}];c.WORLD.islands[0].stock.getreide=500;c.WORLD.islands[0].stock.holz=100;
tick();tick();check(carry.cargo.length===1&&carry.cargo[0].good==='getreide'&&carry.cargo[0].qty===40&&c.WORLD.islands[0].stock.holz===100,'Ohne Warten bleibt Restladung an Bord und blockiert eine andere Ware im selben Frachtraum');
c.WORLD.routes[0].paused=true;tick();check(carry.phase==='depart'&&carry.status==='Route pausiert','Pausierte Routen starten keine neue Fahrt');
c.WORLD.routes[0].paused=false;tick();c.WORLD.routes[0].paused=true;tick();check(carry.at===1&&carry.phase==='unload','Eine Pause während der Fahrt lässt das Schiff noch im nächsten Hafen ankommen');
run('winAct("fleet",{act:"route-delete",id:"1"})');check(!carry.route&&carry.cargo[0].qty===40&&c.WORLD.routes.length===0,'Eine Route kann im Hafen beendet werden, ohne Restladung zu verlieren');
reset();const old=ship();old.route=5;old.phase='travel';old.to=1;old.remaining=5;old.cargo=[{good:'getreide',qty:25}];c.WORLD.fleet=[old];c.WORLD.routes=[{id:5,ship:1,from:0,to:1,out:[order('getreide',25)],back:[order('holz',20)],reserve:0}];c.WORLD.islands[1].stock.holz=100;
tick();tick();check(c.WORLD.routes[0].stations.length===2&&c.WORLD.islands[1].stock.getreide===25&&old.cargo[0].good==='holz','Bestehende Zweihafenrouten werden samt laufender Fahrt und Rückfracht übernommen');
reset();c.WORLD.fleet=[ship()];const repeated=draft([station(0,slot(order('fisch',1)),slot()),station(1,slot(),slot()),station(0,slot(),slot()),station(2,slot(),slot())]);check(commit(repeated)===true,'Eine Insel darf innerhalb einer Runde mehrfach als nicht benachbarte Station vorkommen');
const repeatShip=c.WORLD.fleet[0];for(let i=0;i<9;i++)tick();check(repeatShip.routeStopIndex===2&&repeatShip.at===0,'Wiederholte Inselbesuche behalten ihre konkrete Position in der Stationsliste');
reset();c.WORLD.fleet=[ship()];const bad=draft([station(0,slot(order('fisch',51)),slot()),station(1,slot(),slot())]);check(typeof commit(bad)==='string'&&c.WORLD.routes.length===0,'Ungültige Mengen verändern weder Route noch Schiff');
bad.stations[0].slots[0].load.qty=10;const originalPath=c.routeWaterPath;c.routeWaterPath=(a,b)=>a===1&&b===0?null:[];check(typeof commit(bad)==='string','Auch der Rückweg vom letzten Hafen zum Start muss erreichbar sein');c.routeWaterPath=originalPath;
commit(bad);const sailing=c.WORLD.fleet[0];sailing.phase='travel';sailing.to=1;sailing.remaining=8;sailing.cargo=[{good:'getreide',qty:12,slot:0}];c.draft={...bad,name:'Neue Runde',stations:[bad.stations[0],station(2,slot(),slot())]};check(run('commitTradeRoute(draft,WORLD.routes[0].id)')===true&&sailing.phase==='travel'&&sailing.to===1&&sailing.remaining===8,'Speichern während der Fahrt erhält das aktuelle Fahrtziel und den Fortschritt');tick();check(sailing.at===1&&sailing.to===0&&sailing.cargo[0].qty===12,'Nach einem entfernten Zielhafen fährt das Schiff ohne ungewolltes Entladen zum neuen Routenstart');sailing.remaining=6;c.WORLD.fleet.push({...ship(),id:2,at:2});c.draft={...c.draft,ship:2};check(run('commitTradeRoute(draft,WORLD.routes[0].id)')===true&&sailing.manualTrip.remaining===6&&!sailing.route&&c.WORLD.fleet[1].route===c.WORLD.routes[0].id,'Beim Schiffswechsel beendet das alte Schiff seine Fahrt mit unveränderter Restladung');
// Gespeicherter Fortschritt umfasst Slotnummern und offene Teilaufträge.
c.WORLD.fleet[0].routePending=[7,0];const saved=JSON.parse(JSON.stringify(c.WORLD));check(saved.fleet[0].routePending[0]===7&&saved.routes[0].stations.length===2,'Stationsliste und noch offene Warenmengen sind im Spielstand serialisierbar');

reset();const small=ship(),big={...ship(),id:2,type:'clipper',name:'Klipper'};c.WORLD.fleet=[small,big];c.WORLD.islands[0].stock={...stock(),fisch:500,holz:500};
const multi={...draft([station(0,slot(order('fisch',30)),slot(),slot(order('holz',40)),slot()),station(1,slot(null,order('fisch',30)),slot(),slot(null,order('holz',40)),slot())]),ships:[1,2]};
check(commit(multi)===true&&small.route===big.route&&c.WORLD.routes[0].ships.length===2,'Mehrere unterschiedlich große Schiffe werden derselben Route zugeordnet');
tick();tick();check(small.cargo.length===1&&small.cargo.every(c=>c.slot<2)&&big.cargo.length===2,'Kleine Schiffe ignorieren die zusätzlichen Slots des größten Schiffes');
const total=good=>c.WORLD.islands.reduce((sum,g)=>sum+(g.stock[good]||0),0)+c.WORLD.fleet.reduce((sum,s)=>sum+s.cargo.filter(c=>c.good===good).reduce((n,c)=>n+c.qty,0),0);
check(total('fisch')===500&&total('holz')===500,'Die Warenbilanz bleibt beim Beladen mehrerer Schiffe erhalten');
for(let i=0;i<3;i++)tick();check(c.WORLD.islands[1].stock.fisch===60&&c.WORLD.islands[1].stock.holz===40&&total('fisch')===500&&total('holz')===500,'Alle Schiffe entladen ihre eigenen Waren ohne zusätzliche Slots oder Warenverlust');
const snapshot=JSON.parse(JSON.stringify(c.WORLD));check(snapshot.routes[0].ships.join(',')==='1,2'&&snapshot.fleet.every(s=>s.route===snapshot.routes[0].id),'Mehrfachzuordnung und individueller Fortschritt sind serialisierbar');
c.WORLD=snapshot;tick();check(c.WORLD.fleet.every(s=>s.route===c.WORLD.routes[0].id&&s.cargo.every(c=>c.slot< c.SHIPS[s.type].slots))&&total('fisch')===500&&total('holz')===500,'Nach dem Spielstand-Roundtrip bleiben alle Schiffe, Slots und Warenbilanzen erhalten');
console.log(JSON.stringify({passed:checks.length,checks},null,2));
