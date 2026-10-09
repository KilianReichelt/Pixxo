const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');const html=fs.readFileSync('pixxo.html','utf8'),pixxo=fs.readFileSync('assets/js/pixxo.js','utf8'),checks=[];
const c={ISLAND_SIZE:320,MAPW:320,MAPH:320,ARCHIPELAGO_VERSION:2,PIXXO_TERRAIN_VERSION:3,activeIsland:0,B:{kontor:{w:5,h:5},mine:{w:3,h:3},steinbruch:{w:5,h:3}},ISLANDS:[{}],generateClayDeposits:()=>[],createDeposits:()=>[],Math,Set,Uint8Array,Float32Array};vm.createContext(c);const run=s=>vm.runInContext(s,c);
for(const prefix of ['const hs=','const lerpN=','const T=','const BUILDABLE=','const IDX=','const INMAP='])run(html.split('\n').find(l=>l.startsWith(prefix)));
run('function footprintCells(x,y,w,h){const a=[];for(let j=0;j<h;j++)for(let i=0;i<w;i++)a.push([x+i,y+j]);return a;} function islandAt(x,y){return INMAP(x,y)?0:-1;}');
run(html.slice(html.indexOf('function vnoise('),html.indexOf('function genMap(')));run(html.slice(html.indexOf('function limitBeaches('),html.indexOf('/* ==========================================================',html.indexOf('function limitBeaches('))));
run(pixxo.slice(pixxo.indexOf('const pixxoLocalTerrain='),pixxo.indexOf('const pixxoUnpackIsland=')));
const check=(ok,label)=>{assert.ok(ok,label);checks.push(label)};
for(const seed of [1,42,713,12345,55172,975321])for(const size of [.56,.45,.39,.275,.22]){
 c.seed=seed;c.profile={size,ore:1.5,forestThreshold:.55,ox:0,oy:0};c.ISLANDS[0]=c.profile;
 const terrain=run('localTerrain(seed,profile)'),beaches=run('limitBeaches(localTerrain(seed,profile).tiles,seed)');c.tiles=terrain.tiles;
 check(beaches.length>0,`Hafen vorhanden: Welt ${seed}, Inselgröße ${size}`);
 const deposits=run('createDeposits(tiles,seed)');check(deposits.some(n=>n.type==='steinbruch'),`Steinabbau garantiert: Welt ${seed}, Inselgröße ${size}`);
 for(const node of deposits){c.node=node;check(run('footprintCells(node.x,node.y,B[node.type].w,B[node.type].h).every(([x,y])=>[T.ROCK,T.ORE].includes(tiles[IDX(x,y)]))'),'Abbau vollständig auf Fels');}
}
console.log(JSON.stringify({passed:checks.length,checks},null,2));
