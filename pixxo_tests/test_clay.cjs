const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'pixxo.html'),'utf8'),checks=[],noop=()=>{};
const g={island:0,seed:137,blds:[],byId:new Map(),tiles:new Uint8Array(80*40).fill(3),occ:new Int32Array(80*40),road:new Uint8Array(80*40),deposits:[]};
const c={G:g,WORLD:{islands:[g],fleet:[]},activeIsland:0,MAPW:80,MAPH:40,ISLAND_SIZE:40,ISLANDS:[{ox:0,oy:0,size:.56},{ox:40,oy:0,size:.14}],B:{},BUILDING_SCALE:1.5,UI:{tool:'build',type:'lehmgrube',rotation:0},T:{DEEP:0,SHAL:1,SAND:2,GRASS:3,FOREST:4,ROCK:5,ORE:6},
 IDX:(x,y)=>y*80+x,INMAP:(x,y)=>x>=0&&x<80&&y>=0&&y<40,islandAt:(x,y)=>x>=0&&x<80&&y>=0&&y<40?(x<40?0:1):-1,BUILDABLE:t=>[2,3,4].includes(t),
 footprintCells:(x,y,w,h)=>Array.from({length:w*h},(_,i)=>[x+i%w,y+Math.floor(i/w)]),buildingSize:()=>({w:3,h:3}),islandMeta:()=>({fert:[]}),canAfford:()=>true,unlocked:()=>true,whList:()=>[{type:'kontor'}],buildingUnlockText:()=>'',nearWater:()=>false,atBeach:()=>false,GN:{},
 createDeposits:()=>[{type:'steinbruch',x:4,y:4}],unpackIsland:()=>g,ghostTile:()=>c.UI.hover,clickTile:t=>{c.clicked=t;},drawDeposits:noop,allDeposits:()=>g.deposits,worldBuildings:()=>g.blds,freeNodeCache:new Map(),SP:{lehm:{}},Math,Map,Set,Uint8Array,Int32Array};
vm.createContext(c);const run=s=>vm.runInContext(s,c),check=(ok,label)=>{assert.ok(ok,label);checks.push(label);};
run(html.split('\n').find(l=>l.startsWith('const hs=')));
run(fs.readFileSync(path.join(root,'assets','js','pixxo_bricks.js'),'utf8').split('\n').find(l=>l.startsWith('B.lehmgrube=')));
run(html.slice(html.indexOf('function canPlace(type,x,y)'),html.indexOf('function nearRock')));
run(html.split('\n').find(l=>l.startsWith('function canMoveBuilding(')));
run(fs.readFileSync(path.join(root,'assets','js','pixxo_clay.js'),'utf8'));
g.deposits=run('createDeposits(G.tiles,G.seed)');const clay=g.deposits.filter(n=>n.type==='lehmgrube');
check(clay.length===3,'Große neue Insel erhält drei zufällige Lehmvorkommen');
check(clay.every(n=>n.x<40&&c.footprintCells(n.x-1,n.y-1,5,5).every(([x,y])=>c.islandAt(x,y)===0&&g.tiles[c.IDX(x,y)]===3)),'Vorkommen liegen vollständig mit Rand auf baubarem Land ihrer Insel');
check(JSON.stringify(run('createDeposits(G.tiles,G.seed)'))===JSON.stringify(g.deposits),'Gleicher Inselstartwert erzeugt dieselben Lehmplätze');
check(JSON.stringify(run('createDeposits(G.tiles,G.seed+1)'))!==JSON.stringify(g.deposits),'Anderer Startwert verteilt die Vorkommen anders');
check(run('generateClayDeposits(G.tiles,G.seed,1).length')===1,'Kleine Insel erhält ein eigenes Lehmvorkommen');
check(clay.every((a,i)=>clay.every((b,j)=>i===j||Math.hypot(a.x-b.x,a.y-b.y)>=10)),'Lehmvorkommen überlappen nicht und halten Abstand');
c.node=clay[0];check(run('canPlace("lehmgrube",node.x,node.y).ok'),'Lehmgrube ist auf einem inland gelegenen Vorkommen ohne Küstenkontakt baubar');
check(!run('canPlace("lehmgrube",1,1).ok'),'Beliebige Landkacheln ohne Lehmvorkommen werden abgelehnt');
g.road[c.IDX(clay[0].x,clay[0].y)]=1;check(!run('canPlace("lehmgrube",node.x,node.y).ok'),'Straße auf dem Vorkommen verhindert einen überlappenden Bau');g.road.fill(0);
c.mine={type:'lehmgrube',island:0,w:3,h:3,fire:0};check(run('canMoveBuilding(mine,node.x,node.y).ok')&&!run('canMoveBuilding(mine,1,1).ok'),'Verschieben ist ebenfalls an passende Vorkommen gebunden');
c.UI.hover={x:clay[0].x,y:clay[0].y};const snapped=run('ghostTile()');check(snapped.x===clay[0].x+1&&snapped.y===clay[0].y+1,'Die Bauvorschau rastet beim Zeigen auf das Vorkommen ein');
run('clickTile(UI.hover)');check(c.clicked.x===snapped.x&&c.clicked.y===snapped.y,'Ein Klick baut an derselben eingerasteten Position wie die Vorschau');
const oldMine={id:1,type:'lehmgrube',x:6,y:30,w:3,h:3,island:0};g.blds=[oldMine];g.byId.set(1,oldMine);for(const [x,y] of c.footprintCells(oldMine.x,oldMine.y,3,3)){g.occ[c.IDX(x,y)]=1;g.tiles[c.IDX(x,y)]=2;}
g.occ[c.IDX(15,15)]=2;g.road[c.IDX(17,17)]=1;c.old={deposits:[]};run('unpackIsland(old)');
check(g.deposits.some(n=>n.type==='lehmgrube'&&n.x===6&&n.y===30&&!n.legacy),'Bestehende Strandgruben erhalten beim Laden ein nutzbares Vorkommen');
check(g.deposits.filter(n=>n.type==='lehmgrube'&&!(n.x===6&&n.y===30)).every(n=>c.footprintCells(n.x-1,n.y-1,5,5).every(([x,y])=>!g.occ[c.IDX(x,y)]&&!g.road[c.IDX(x,y)])),'Zusätzliche Vorkommen im alten Spielstand meiden Gebäude und Straßen');
const saved=JSON.parse(JSON.stringify(g.deposits));c.old={deposits:saved};run('unpackIsland(old)');check(JSON.stringify(g.deposits)===JSON.stringify(saved),'Gespeicherte Lehmplätze bleiben beim erneuten Laden an derselben Position');
const terrainCode=html.slice(html.indexOf('function vnoise('),html.indexOf('function genMap('))+html.slice(html.indexOf('function limitBeaches('),html.indexOf('/* ==========================================================',html.indexOf('function limitBeaches(')));
const terrainFactory=new Function('ISLAND_SIZE','ARCHIPELAGO_VERSION','B','hs','lerpN',html.split('\n').find(l=>l.startsWith('const T='))+html.split('\n').find(l=>l.startsWith('const BUILDABLE='))+terrainCode+';return {localTerrain,limitBeaches};');
const noise=run('hs'),terrain=terrainFactory(320,2,{kontor:{w:5,h:5}},noise,(a,b,t)=>a+(b-a)*t);
const clayCode=fs.readFileSync(path.join(root,'assets','js','pixxo_clay.js'),'utf8');
const clayFactory=new Function('ISLANDS','B','MAPW','MAPH','ISLAND_SIZE','INMAP','islandAt','IDX','BUILDABLE','T','hs',clayCode.slice(0,clayCode.indexOf('const clayCreateDeposits='))+';return generateClayDeposits;');
for(const size of [.14,.56])for(const seed of [17,289,9137]){
 const profile={ox:0,oy:0,size,ore:1,name:'Testinsel'},tiles=terrain.localTerrain(seed,profile).tiles;terrain.limitBeaches(tiles,seed);
 const inside=(x,y)=>x>=0&&x<320&&y>=0&&y<320,idx=(x,y)=>y*320+x,owner=(x,y)=>inside(x,y)&&tiles[idx(x,y)]>=2?0:-1;
 const generate=clayFactory([profile],{lehmgrube:{w:3,h:3}},320,320,320,inside,owner,idx,t=>[2,3,4].includes(t),c.T,noise);
 check(generate(tiles,seed,0).length===Math.ceil(size*5),`Echte Kartengeneration, Größe ${size}, Startwert ${seed}: Lehmvorkommen auf nutzbarem Inland vorhanden`);
}
console.log(JSON.stringify({passed:checks.length,checks},null,2));
