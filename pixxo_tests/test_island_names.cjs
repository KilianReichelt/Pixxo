const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict'),root=path.resolve(__dirname,'..'),checks=[];
const check=(value,label)=>{assert.ok(value,label);checks.push(label);},html=fs.readFileSync(path.join(root,'pixxo.html'),'utf8');
const listeners={},islands=[{name:'Heimat'},{name:'Ferninsel'},{name:'Verborgene Insel'}],g={seed:1,blds:[],stock:{},gold:100,time:0},escape=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
let saved,updates=0;
const c={ISLANDS:islands,WORLD:{islands:[g,null,null],fog:{islands:[true,true,false],cells:[]}},G:g,activeIsland:0,WINS:{island:{title:{},el:{setAttribute(){}},hold:false}},islandName:i=>i===2?'Unentdeckt':i===0?islands[i].name:'Unbesiedelte Insel',islandHTML:()=>'<p>Inselinformationen</p>',esc:escape,attr:s=>escape(s).replace(/"/g,'&quot;'),$:()=>({addEventListener:(name,fn)=>{listeners[name]=fn;}}),renderTop:()=>{updates++;},renderIslandFacts(){},refreshWins(){},resetWorld(){},saveGame(){saved=islands.map(m=>m.customName||null);},String};
vm.createContext(c);const run=s=>vm.runInContext(s,c);run(fs.readFileSync(path.join(root,'assets','js','pixxo_island_names.js'),'utf8'));
check(run('islandHTML(0)').includes('name="islandName"')&&run('islandHTML(0)').includes('maxlength="40"'),'Das Inselfenster besitzt ein beschriftetes Namensfeld und einen Speicherbutton');
check(run('renameIsland(0,"  Königshafen  ")')&&run('islandName(0)')==='Königshafen','Ein eigener Name mit Umlauten wird übernommen und getrimmt');
check(saved[0]==='Königshafen'&&updates===1&&c.WINS.island.title.textContent==='Königshafen','Speichern aktualisiert Spielstand, Kopfzeile und Fenstertitel sofort');
check(!run('renameIsland(0,"   ")')&&!run('renameIsland(0,"x".repeat(41))'),'Leere und überlange Namen werden abgewiesen');
check(run('renameIsland(1,"Neue Küste")')&&run('islandName(1)')==='Neue Küste','Entdeckte unbesiedelte Inseln lassen sich ebenfalls benennen');
check(!run('renameIsland(2,"Geheim")')&&!run('islandHTML(2)').includes('island-rename'),'Unentdeckte Inseln erhalten kein Namensformular');
run('renameIsland(0,\'<Hafen> "Nord"\')');check(run('islandHTML(0)').includes('&lt;Hafen&gt; &quot;Nord&quot;'),'Sonderzeichen werden sicher im Eingabefeld ausgegeben');
run('resetWorld()');check(islands[0].name==='Heimat'&&!islands[0].customName,'Eine neue Welt setzt eigene Inselnamen auf die Vorgaben zurück');
// Die tatsächliche Ladefunktion mit einer kleinen gespeicherten Welt ausführen.
const load=html.match(/function loadGame\(\)\{[^\n]+/)[0];
Object.assign(c,{localStorage:{getItem:()=>JSON.stringify({v:9,islands:[{seed:1,blds:[]}],islandNames:['Königshafen'],gold:100,time:0})},SAVEKEY:'test',MAPW:896,MAPH:672,setWorldSize(){},newGame(){c.G={...g};islands[0]={name:'Heimat'};},resetWorld(){c.WORLD={board:{},islands:[c.G]};},unpackIsland:()=>({...g}),rebuildNet(){},initFog(){},fogDirty:false,DEFAULT_PINS:[],GN:{},JSON,Math});
run(load);check(run('loadGame()')&&islands[0].name==='Königshafen'&&islands[0].customName==='Königshafen','Laden stellt den gespeicherten Namen in den Inselmetadaten wieder her');
c.localStorage.getItem=()=>JSON.stringify({v:9,islands:[{seed:1,blds:[]}],gold:100,time:0});check(run('loadGame()')&&islands[0].name==='Heimat','Bestehende Spielstände ohne eigene Namen laden unverändert');
for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){const src=match[1].match(/src="([^"]+)"/);new vm.Script(src?fs.readFileSync(path.join(root,src[1]),'utf8'):match[2]);}
check(true,'Alle eingebundenen Spielmodule und Inline-Skripte sind syntaktisch gültig');
console.log(JSON.stringify({passed:checks.length,checks},null,2));
