const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'pixxo.html'),'utf8'),checks=[];
const check=(ok,label)=>{assert.ok(ok,label);checks.push(label);};
const farm={id:1,type:'farm',w:5,h:4,x:1,y:1,fire:0,pop:0,inputStock:{getreide:10}},field={id:2,type:'acker',fieldOwner:1,w:1,h:1,x:8,y:1,fire:0},other={id:3,type:'acker',fieldOwner:4,w:1,h:1,x:9,y:1};
const g={blds:[farm,field,other],byId:new Map([[1,farm],[2,field],[3,other]]),occ:new Int32Array(100)},w={id:'info',hold:true};g.occ[11]=1;g.occ[18]=2;
let refreshes=0,rebuilds=0;
const c={B:{farm:{kind:'prod',cost:{gold:100,bretter:8}},acker:{kind:'field',cost:{gold:2}}},UPG:{},BUILD_SIZES:{},G:g,UI:{sel:1,vt:0},WORK_ART:{reduced:{matches:false}},WINS:{info:w},HD_CATALOG:new Map(),IMPORTED_ENTRIES:new Map([['ruine',{id:'ruine'}],['acker_ruine',{id:'acker_ruine'}]]),Math,
 spName:b=>'b_'+b.type,workshopSprite:b=>'b_'+b.type,bubbleFor:()=> 'i_road',infoHTML:()=>'<p>Alt</p>',winAct:()=>{},upgradeHouse:b=>{b.tier++;return true;},upgradePort:b=>{b.tier++;},
 bname:b=>b.type==='farm'?'Getreidehof':'Ackerfläche',rebuildNet:()=>rebuilds++,refreshWins:()=>refreshes++,refreshWin:win=>{if(!win.hold)refreshes++;},
 importedPixels:(entry,frame)=>({id:entry.id,frame}),publishPixel:(name,low,width,height,meta)=>c.HD_CATALOG.set(name,{low,width,height,meta}),url:s=>s,esc:s=>s,costHTML:()=>'',canAfford:()=>true,payCost:cost=>c.paid=cost,msg:()=>{},renderTop:()=>{},saveGame:()=>{c.saved=true;}};
vm.createContext(c);const run=s=>vm.runInContext(s,c);run(fs.readFileSync(path.join(root,'assets/js/pixxo_ruins.js'),'utf8'));c.farm=farm;c.field=field;
run('burnBuilding(field)');check(field.type==='acker','Ackerflächen brennen nicht eigenständig ab');
run('burnBuilding(farm)');check(farm.type==='ruine'&&field.type==='ruine'&&other.type==='acker','Ein abgebrannter Betrieb ersetzt ausschließlich seine eigenen Flächen durch Ruinen');
check(g.byId.get(1)===farm&&g.occ[11]===1&&g.occ[18]===2&&farm.w===5&&farm.h===4,'Ruinen behalten Identität, Grundfläche und Belegung');
check(field.ruinField&&field.fieldOwner===undefined&&farm.inputStock.getreide===undefined&&farm.eff===0,'Ruinen haben keine Produktion, Vorräte oder Feldzuordnung mehr');
check(rebuilds===1&&refreshes===1,'Brand aktualisiert das Straßennetz und die geöffneten Fenster sofort');
const normal=run('workshopSprite(farm)');c.UI.vt=.4;const moving=run('workshopSprite(farm)');check(normal!==moving,'Gebäuderuinen wechseln ihre Rauchbilder');
c.WORK_ART.reduced.matches=true;check(run('workshopSprite(farm)')===normal,'Reduzierte Bewegung hält die Rauchanimation an');
const fieldSprite=run('spName(field)');check(c.HD_CATALOG.get(fieldSprite).height===16&&c.HD_CATALOG.get(normal).width===80,'Feldruinen und Gebäuderuinen verwenden ihre tatsächlichen Abmessungen');
c.WINS.info.title={};check(run('infoHTML()').includes('Ruine abreißen')&&c.WINS.info.title.textContent.includes('Getreidehof'),'Ausgewählte Ruine zeigt ihren Ursprung und die Abrissaktion');
w.hold=true;const before=refreshes;run('winAct("info",{act:"pause"})');check(refreshes>before,'Fensteraktionen aktualisieren trotz gesetztem Haltezustand');
w.hold=true;c.house={tier:1};run('upgradeHouse(house)');check(c.house.tier===2&&!w.hold,'Hausaufwertung löst sofortige Fensteraktualisierung aus');
const fireSource=fs.readFileSync(path.join(root,'assets/js/pixxo.js'),'utf8');check(fireSource.includes("['wh','field','ruin','decor'].includes(B[b.type].kind)")&&fireSource.includes("if(B[b.type].kind==='field')b.fire=0"),'Zufällige Brände und bestehende Feldbrände schließen Betriebsflächen aus');
check(html.includes('ruinName:b.ruinName')&&html.includes("s.type==='ruine'?{w:s.w||3,h:s.h||3}"),'Spielstände speichern Ruineninformationen und stellen ihre Fläche wieder her');
check(run('ruinRebuildCost(farm).gold')===102&&run('ruinRebuildCost(farm).bretter')===8,'Wiederaufbau kostet das ursprüngliche Gebäude und seine verbliebenen Flächen');
check(run('rebuildRuin(field)')===false&&field.type==='ruine','Eine Feldruine kann ohne Hauptgebäude nicht wiederaufgebaut werden');
c.canAfford=()=>false;check(run('rebuildRuin(farm)')===false&&farm.type==='ruine'&&!c.paid,'Fehlende Ressourcen verhindern den gesamten Wiederaufbau');c.canAfford=()=>true;
check(run('rebuildRuin(farm)')===true&&farm.type==='farm'&&field.type==='acker'&&field.fieldOwner===1&&c.paid.gold===102&&c.saved,'Wiederaufbau stellt Betrieb und Felder atomar wieder her und speichert den Zustand');
check(farm.inputStock.getreide===undefined&&!farm.paused&&farm.originalType===undefined,'Wiederaufbau stellt keine verbrannten Waren wieder her und entfernt Ruinendaten');
console.log(JSON.stringify({passed:checks.length,checks},null,2));
