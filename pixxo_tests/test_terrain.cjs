const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'..','pixxo.html'),'utf8');
const c={ISLAND_SIZE:320,ARCHIPELAGO_VERSION:2,B:{kontor:{w:5,h:5}}};vm.createContext(c);
const run=s=>vm.runInContext(s,c),checks=[];
const check=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);};
for(const prefix of ['const hs=','const lerpN=','const T=','const BUILDABLE='])run(html.split('\n').find(line=>line.startsWith(prefix)));
run(html.slice(html.indexOf('function vnoise('),html.indexOf('function genMap(')));
run(html.slice(html.indexOf('function limitBeaches('),html.indexOf('/* ==========================================================',html.indexOf('function limitBeaches('))));
for(const seed of [17,289,9137])for(const size of [.56,.45,.39,.275,.14]){
 c.seed=seed;c.profile={size,ore:1,name:'Testinsel'};
 const terrain=run('localTerrain(seed,profile)'),beaches=run('limitBeaches(localTerrain(seed,profile).tiles,seed)');
 check(terrain.tiles.some(t=>t>=2)&&beaches.length>0,`Inselgröße ${size}, Startwert ${seed}: Land und mindestens ein baubarer Hafen vorhanden`);
}
c.profile={size:.56,ore:1,name:'Testinsel'};c.seed=289;
const wide=run('limitBeaches(localTerrain(seed,profile).tiles,seed)');
c.ARCHIPELAGO_VERSION=1;const narrow=run('limitBeaches(localTerrain(seed,profile).tiles,seed)');
check(wide.length>0&&narrow.length>0,'Beide Kartenversionen erzeugen Hafenplätze');
console.log(JSON.stringify({passed:checks.length,checks},null,2));
