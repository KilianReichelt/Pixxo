const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict'),root=path.resolve(__dirname,'..'),checks=[];
const check=(ok,label)=>{assert.ok(ok,label);checks.push(label);},noop=()=>{};
const g={island:0,blds:[],byId:new Map(),occ:new Int32Array(400),road:new Uint8Array(400),tiles:new Uint8Array(400).fill(3),gold:100,stock:{stein:20}};
const c={G:g,WORLD:{islands:[g]},activeIsland:0,UI:{tool:'upgrade'},B:{haus:{n:'Haus'},kontor:{n:'Kontor'}},GN:{stein:{n:'Stein'}},MAPW:20,MAPH:20,FIELD_RULES:{},IDX:(x,y)=>y*20+x,INMAP:(x,y)=>x>=0&&y>=0&&x<20&&y<20,islandAt:()=>0,BUILDABLE:()=>true,minimapRoadCells:a=>Array.from(a.keys()).filter(k=>a[k]),stoneRoadUnlocked:()=>true,
 upgradeBuildingAt:t=>g.byId.get(g.occ[c.IDX(t.x,t.y)]),upgradeRequest:b=>b.tier<3?{ready:b.ready!==false,cost:{gold:10*b.tier,stein:b.tier}}:null,canAfford:cost=>g.gold>=(cost.gold||0)&&g.stock.stein>=(cost.stein||0),
 upgradeHouse:b=>{g.gold-=10*b.tier;g.stock.stein-=b.tier;b.tier++;return true;},upgradePort:b=>{g.gold-=10*b.tier;g.stock.stein-=b.tier;b.tier++;},roadUpgrade:(x,y)=>{g.road[c.IDX(x,y)]=2;g.gold-=4;g.stock.stein--;},
 updateHint:noop,setTool:noop,drawGhost:noop,winAct:noop,document:{addEventListener:noop},$:()=>null,rebuildNet:noop,refreshWins:noop,renderTop:noop,saveGame:noop,msg:noop,Map,Set,Math};
vm.createContext(c);const run=s=>vm.runInContext(s,c);run(fs.readFileSync(path.join(root,'assets/js/pixxo_planning.js'),'utf8'));
const home={id:1,type:'haus',x:2,y:2,w:2,h:2,tier:1},other={id:2,type:'haus',x:6,y:2,w:2,h:2,tier:1},port={id:3,type:'kontor',x:10,y:2,w:2,h:2,tier:1};g.blds=[home,other,port];for(const b of g.blds){g.byId.set(b.id,b);for(let y=b.y;y<b.y+b.h;y++)for(let x=b.x;x<b.x+b.w;x++)g.occ[c.IDX(x,y)]=b.id;}
g.road[c.IDX(4,2)]=1;g.road[c.IDX(5,2)]=1;
run('beginConstructionPlan({x:2,y:2});updateConstructionPlan({x:12,y:4})');check(home.tier===1&&other.tier===1&&g.gold===100,'Ziehen wertet weder Gebäude noch Straßen vor dem Loslassen auf');
check(run('constructionPlan.upgrades.buildings.length')===2&&run('constructionPlan.upgrades.roads.length')===0,'Start auf einem Haus markiert ausschließlich Häuser');
run('finishConstructionPlan()');check(home.tier===2&&other.tier===2&&port.tier===1&&g.road[c.IDX(4,2)]===1&&g.gold===80,'Loslassen wertet exakt die markierten Häuser auf und lässt Kontor und Wege unverändert');
run('beginConstructionPlan({x:4,y:2});updateConstructionPlan({x:12,y:4})');check(run('constructionPlan.upgrades.roads.length')===2&&run('constructionPlan.upgrades.buildings.length')===0,'Start auf einer Straße bleibt auf Straßen derselben Auswahl beschränkt');run('finishConstructionPlan()');check(g.road[c.IDX(4,2)]===2&&home.tier===2,'Straßen werden erst beim Loslassen zu Steinstraßen');
run('beginConstructionPlan({x:10,y:2});updateConstructionPlan({x:2,y:4});finishConstructionPlan()');check(port.tier===2&&home.tier===2,'Start auf einem Kontor wertet ausschließlich Kontore auf');
g.gold=1;run('beginConstructionPlan({x:2,y:2});updateConstructionPlan({x:8,y:4});finishConstructionPlan()');check(home.tier===2&&other.tier===2&&g.gold===1,'Fehlende Gesamtkosten verhindern eine teilweise Aufwertung');
g.gold=100;run('beginConstructionPlan({x:2,y:2});cancelConstructionPlan()');check(home.tier===2&&run('constructionPlan===null'),'Abbrechen verändert weder Auswahlobjekte noch Ressourcen');
run('beginConstructionPlan({x:0,y:0});updateConstructionPlan({x:12,y:4});finishConstructionPlan()');check(home.tier===2&&port.tier===2,'Start auf freiem Boden legt keinen nachträglich wechselnden Gebäudetyp fest');
run('beginConstructionPlan({x:2,y:2});finishConstructionPlan()');check(home.tier===3&&other.tier===2,'Ein einzelner Klick wertet weiterhin genau ein Gebäude auf');
console.log(JSON.stringify({passed:checks.length,checks},null,2));
