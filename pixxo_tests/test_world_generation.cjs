const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path'),root=path.resolve(__dirname,'..'),checks=[];
const check=(ok,label)=>{assert.ok(ok,label);checks.push(label);};
const islands=Array.from({length:12},(_,i)=>({name:'Alt '+i,size:.5,ore:1,fert:['hopfen','getreide']}));let stored=null,starts=0,generated=[],dialog;
const mockButton=()=>({handlers:{},addEventListener(type,fn){this.handlers[type]=fn;},focus(){this.focused=true;}});
const cancel=mockButton(),confirm=mockButton();
const c={ISLANDS:islands,ORIGINAL_ISLAND_SIZES:Array(12).fill(1),Math,JSON,Set,Number,Array,SAVEKEY:'test',UI:{},G:{speed:4},preferredLayout:[1],
 localStorage:{getItem:()=>stored},genMap:seed=>{generated=islands.map(p=>({...p,fert:[...p.fert]}));return {seed};},startNew:()=>{starts++;c.genMap(12345);},loadGame:()=>{if(!stored)return false;const data=JSON.parse(stored);c.genMap(data.rootSeed||12345);return true;},setSpeed:s=>c.G.speed=s,updateEventBadge(){},$:()=>({replaceChildren(){}}),
 document:{body:{append(){}},createElement(){dialog={open:false,handlers:{},setAttribute(){},querySelector:s=>s==='[data-new-cancel]'?cancel:confirm,addEventListener(type,fn){this.handlers[type]=fn;},showModal(){this.open=true;},close(){this.open=false;}};return dialog;}}};
vm.createContext(c);const run=s=>vm.runInContext(s,c);run(fs.readFileSync(path.join(root,'assets/js/pixxo_world_generation.js'),'utf8'));
const a=run('generateIslandProfiles(1)'),b=run('generateIslandProfiles(2)');
check(JSON.stringify(a)===JSON.stringify(run('generateIslandProfiles(1)')),'Derselbe Zufallswert erzeugt reproduzierbare Inselprofile');
check(a.map(p=>p.name).join()!==b.map(p=>p.name).join()&&a.map(p=>p.size).join()!==b.map(p=>p.size).join()&&a.map(p=>p.fert.join()).join()!==b.map(p=>p.fert.join()).join(),'Neue Weltwerte ändern Namen, Größen und Fruchtbarkeiten');
check(new Set(a.map(p=>p.name)).size===12&&a.every(p=>p.name.length<=40),'Alle zwölf Inseln erhalten eindeutige Namen');
check(a.filter(p=>p.size>=.44).length===4&&a.filter(p=>p.size<.33).length===4,'Jede Welt enthält vier große und vier kleine Inseln');
check(a.every(p=>!p.fert.includes('getreide')),'Getreide benötigt keine Insel-Fruchtbarkeit mehr');
for(let seed=1;seed<=200;seed++){
 const profiles=run('generateIslandProfiles('+seed+')');
 assert.ok(profiles.every(p=>p.size>=.22&&p.size<=.56&&p.ore>=0&&p.ore<=2.5&&p.fert.length>=1));
 assert.ok(['hopfen','trauben','gewuerz'].every(crop=>profiles.filter(p=>p.fert.includes(crop)).length>=2));
}
check(true,'200 Welten behalten gültige Größen, Vorkommen und mindestens zwei Inseln je Kultur');
const html=fs.readFileSync(path.join(root,'pixxo.html'),'utf8'),noise=new Function(html.split('\n').find(l=>l.startsWith('const hs='))+';return hs;')();
const terrainCode=html.slice(html.indexOf('function vnoise('),html.indexOf('function genMap('))+html.slice(html.indexOf('function limitBeaches('),html.indexOf('/* ==========================================================',html.indexOf('function limitBeaches(')));
const terrain=new Function('ISLAND_SIZE','ARCHIPELAGO_VERSION','B','hs','lerpN',html.split('\n').find(l=>l.startsWith('const T='))+html.split('\n').find(l=>l.startsWith('const BUILDABLE='))+terrainCode+';return {localTerrain,limitBeaches};')(320,2,{kontor:{w:5,h:5}},noise,(a,b,t)=>a+(b-a)*t);
for(const seed of [1,42,713,12345,55172,975321]){
 const profiles=run('generateIslandProfiles('+seed+')');let ports=0;
 for(let i=0;i<profiles.length;i++)if(profiles[i].size>=.44){const tiles=terrain.localTerrain(seed+i*913,profiles[i]).tiles;ports+=terrain.limitBeaches(tiles,seed+i*913).length;}
 assert.ok(ports>0,'Freier Starthafen für Welt '+seed);
}
check(true,'Sechs echte Geländegenerationen mit zufälligen Profilen bieten nutzbare Starthäfen');
run('startNew()');check(starts===1&&c.preferredLayout===null&&generated.every(p=>p.generatedName===p.name),'Neustart erzeugt die Profile vor dem Gelände und verwirft das alte Layout');
const saved=run('savedIslandProfiles()');stored=JSON.stringify({rootSeed:12345,archipelagoVersion:2,islandProfiles:saved});islands[0].size=.99;islands[0].name='Falsch';run('loadGame()');check(JSON.stringify(generated.map(p=>({name:p.name,size:p.size,ore:p.ore,fert:p.fert})))===JSON.stringify(saved.map(p=>({name:p.name,size:p.size,ore:p.ore,fert:p.fert}))),'Laden stellt gespeicherte Profile ohne erneutes Würfeln wieder her');
stored=JSON.stringify({archipelagoVersion:1});run('loadGame()');check(generated[0].name==='Alt 0'&&generated[0].size===1&&!generated[0].generatedName,'Alte Spielstände behalten ihre bisherigen Inselprofile');
const before=starts;run('requestNewGame()');check(starts===before&&dialog.open&&c.G.speed===0&&cancel.focused,'Neustart wartet auf einen modalen Dialog und setzt den Fokus auf Abbrechen');
cancel.handlers.click();check(starts===before&&!dialog.open&&c.G.speed===4,'Abbrechen bewahrt das Spiel und sein vorheriges Tempo');
run('requestNewGame()');let prevented=false;dialog.handlers.cancel({preventDefault(){prevented=true;}});check(prevented&&!dialog.open&&starts===before,'Escape bricht den Neustart ab');
run('requestNewGame()');confirm.handlers.click();check(starts===before+1&&!dialog.open,'Erst die ausdrückliche Bestätigung startet die neue Welt');
console.log(JSON.stringify({passed:checks.length,checks},null,2));
