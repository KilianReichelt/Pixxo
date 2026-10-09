const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict'),root=path.resolve(__dirname,'..'),checks=[],noop=()=>{};
const check=(ok,label)=>{assert.ok(ok,label);checks.push(label);};
const g={blds:[],deposits:[{type:'mine',x:2,y:2},{type:'mine',x:8,y:2},{type:'mine',x:14,y:2,legacy:true},{type:'lehmgrube',x:4,y:10}],occ:new Int32Array(400),road:new Uint8Array(400)};
const other={blds:[],deposits:[{type:'mine',x:3,y:5}],occ:new Int32Array(400),road:new Uint8Array(400)};
const el={innerHTML:'',contains:()=>false,classList:{toggle:noop},querySelector:()=>null,addEventListener:(event,fn)=>{c.onFactClick=fn;}};
const c={WORLD:{rootSeed:77,islands:[g,other],fog:{islands:[true,true]}},G:g,ISLANDS:[{name:'Hauptinsel',fert:['getreide']},{name:'Zielinsel',fert:[]}],activeIsland:0,UI:{viewedIsland:0,vt:0,sc:1},WINS:{},B:{mine:{w:2,h:2},steinbruch:{w:2,h:2},lehmgrube:{w:3,h:3}},GN:{getreide:{n:'Getreide'}},
 footprintCells:(x,y,w,h)=>Array.from({length:w*h},(_,i)=>[x+i%w,y+Math.floor(i/w)]),IDX:(x,y)=>y*20+x,
 unsettledDeposits:()=>[{type:'lehmgrube',x:10,y:12}],$:()=>el,ic:id=>`<img class="ic" data-icon="${id}">`,attr:s=>s,esc:s=>s,
 setTool:t=>{c.UI.tool=t;},activateIsland:i=>{c.activeIsland=i;c.G=c.WORLD.islands[i];},centerOn:(x,y)=>{c.center=[x,y];},cv:{focus:()=>{c.canvasFocused=true;}},document:{activeElement:null},closeWin:id=>{c.closed=id;},selectB:noop,drawMini:noop,renderIslandFacts:noop,drawDeposits:noop,Map};
vm.createContext(c);const run=s=>vm.runInContext(s,c);run(fs.readFileSync(path.join(root,'assets','js','pixxo_deposit_navigation.js'),'utf8'));
run('renderIslandFacts()');check(el.innerHTML.includes('data-deposit-type="mine"')&&el.innerHTML.includes('<b>2</b>')&&el.innerHTML.includes('data-deposit-type="lehmgrube"'),'Nur freie nutzbare Vorkommen erscheinen mit der richtigen Anzahl');
check(!el.innerHTML.includes('data-deposit-type="steinbruch"')&&!el.innerHTML.includes('data-facts'),'Null-Vorkommen und der alte Platzlisten-Auslöser werden nicht angezeigt');
run('focusNextDeposit("mine")');check(c.center[0]===3&&c.center[1]===3&&c.canvasFocused,'Klick auf Erz zentriert und fokussiert das erste freie Vorkommen');
run('focusNextDeposit("mine")');check(c.center[0]===9&&c.center[1]===3,'Erneuter Klick springt zum nächsten Vorkommen derselben Ressource');
run('focusNextDeposit("mine")');check(c.center[0]===3,'Nach dem letzten Platz beginnt der Wechsel wieder am ersten');
run('focusNextDeposit("lehmgrube")');check(c.center[0]===5.5&&c.center[1]===11.5,'Verschiedene Ressourcen behalten unabhängige Wechselpositionen');
g.road[c.IDX(2,2)]=1;run('focusNextDeposit("mine")');check(c.center[0]===9,'Ein inzwischen belegter Platz wird beim nächsten Sprung übersprungen');
g.blds.push({type:'mine',x:8,y:2});run('renderIslandFacts()');check(el.innerHTML.includes('data-deposit-type="mine"')&&el.innerHTML.includes('2 Vorkommen, davon 0 frei'),'Bebaute Vorkommen bleiben im Icon und in der Gesamtzahl erhalten');
const oldCenter=c.center;check(run('focusNextDeposit("mine")')&&c.center[0]===3,'Der Wechsel umfasst auch belegte Vorkommen');run('focusNextDeposit("mine")');check(c.center[0]===9,'Ein bereits bebautes Vorkommen wird ebenfalls fokussiert');
run('focusNextDeposit("mine",1)');check(c.activeIsland===1&&c.center[0]===4&&c.UI.viewedIsland===1,'Die Navigation bleibt auf die gewählte Insel beschränkt');
c.WORLD.islands[1]=null;run('renderIslandFacts()');check(el.innerHTML.includes('Lehm · 1')&&el.innerHTML.includes('Zielinsel'),'Unbesiedelte Inseln behalten ausgeschriebene Ressourcen mit direkten Sprungbuttons');
c.WORLD.fog.islands[1]=false;run('renderIslandFacts()');check(el.innerHTML===''&&!run('focusNextDeposit("lehmgrube",1)'),'Unentdeckte Inseln geben weder Ressourcen noch Sprungziele preis');
check(!fs.readFileSync(path.join(root,'pixxo.html'),'utf8').includes("openWin('deposits'"),'Die entfernte Abbauplatzliste wird im Spiel nicht mehr geöffnet');
console.log(JSON.stringify({passed:checks.length,checks},null,2));
