/* Approved household economy, 15 October 2026. Shared simulation/UI data. */
const NEEDS_PLAN={
  "status": "Freigegeben am 15.10.2026; in die Simulation integriert; Grafikaufträge separat offen",
  "date": "2026-10-15",
  "rules": {
    "maxAdjacentTiers": 2,
    "luxuryRequiredForUpgrade": false,
    "houseUpgradeGold": 0,
    "toolsForTargets3And4": 0,
    "unlock": "Besitzerweit, monoton über Bevölkerungsspitzen; Stadtstufe UND Einwohnerzahl der betroffenen Stufe",
    "infrastructureException": [
      "Straßenanschluss",
      "Marktlogistik",
      "Brandschutz",
      "Gesundheitsschutz"
    ]
  },
  "tiers": [
    {
      "id": 1,
      "name": "Siedler",
      "capacity": 6,
      "baseGoods": [
        "fisch",
        "brot",
        "tuch"
      ],
      "baseServices": [
        "markt"
      ],
      "luxuryGoods": [
        "schnaps",
        "honig",
        "most"
      ],
      "luxuryServices": [
        "kapelle"
      ],
      "residentWeights": {
        "markt": 1,
        "fisch": 2,
        "brot": 2,
        "tuch": 1
      }
    },
    {
      "id": 2,
      "name": "Bürger",
      "capacity": 12,
      "baseGoods": [
        "fisch",
        "brot",
        "tuch",
        "wurst",
        "stiefel",
        "seife",
        "laternen"
      ],
      "baseServices": [
        "markt",
        "schule"
      ],
      "luxuryGoods": [
        "schnaps",
        "bier",
        "wein",
        "moebel"
      ],
      "luxuryServices": [
        "kapelle"
      ],
      "residentWeights": {
        "markt": 1,
        "fisch": 2,
        "brot": 2,
        "tuch": 1,
        "wurst": 2,
        "stiefel": 1,
        "seife": 1,
        "schule": 1,
        "laternen": 1
      }
    },
    {
      "id": 3,
      "name": "Patrizier",
      "capacity": 20,
      "baseGoods": [
        "wurst",
        "stiefel",
        "seife",
        "laternen",
        "feine_kleidung",
        "geschirr",
        "buecher",
        "gluehbirnen"
      ],
      "baseServices": [
        "schule",
        "gemeinschaft",
        "strom"
      ],
      "luxuryGoods": [
        "bier",
        "wein",
        "moebel",
        "parfuem",
        "schmuck"
      ],
      "luxuryServices": [
        "kirche"
      ],
      "residentWeights": {
        "wurst": 3,
        "stiefel": 2,
        "seife": 2,
        "schule": 3,
        "feine_kleidung": 2,
        "geschirr": 1,
        "buecher": 1,
        "gemeinschaft": 2,
        "strom": 1,
        "gluehbirnen": 1,
        "laternen": 2
      }
    },
    {
      "id": 4,
      "name": "Aristokraten",
      "capacity": 30,
      "baseGoods": [
        "feine_kleidung",
        "geschirr",
        "buecher",
        "gluehbirnen",
        "kaffee",
        "feinkost"
      ],
      "baseServices": [
        "gemeinschaft",
        "universitaet",
        "strom"
      ],
      "luxuryGoods": [
        "parfuem",
        "schmuck",
        "schaumwein",
        "schokolade",
        "taschenuhren",
        "grammophone"
      ],
      "luxuryServices": [
        "kirche",
        "oper"
      ],
      "residentWeights": {
        "feine_kleidung": 6,
        "geschirr": 4,
        "buecher": 4,
        "gluehbirnen": 2,
        "gemeinschaft": 2,
        "strom": 2,
        "universitaet": 2,
        "kaffee": 4,
        "feinkost": 4
      }
    }
  ],
  "newTier4Chains": [
    {
      "good": "kaffee",
      "name": "Kaffee",
      "inputs": {
        "kaffeebohnen": 1
      },
      "buildings": [
        "kaffeeplantage",
        "roesterei"
      ],
      "unlock": {
        "city": 7,
        "tier4": 1
      }
    },
    {
      "good": "feinkost",
      "name": "Feinkost",
      "inputs": {
        "wurst": 1,
        "brot": 1,
        "gewuerz": 0.25,
        "bier": 0.25
      },
      "buildings": [
        "feinkostkueche"
      ],
      "unlock": {
        "city": 7,
        "tier4": 100
      }
    },
    {
      "good": "schaumwein",
      "name": "Schaumwein",
      "inputs": {
        "wein": 1,
        "zucker": 0.25,
        "glas": 0.25
      },
      "buildings": [
        "zuckerrohrplantage",
        "zuckerraffinerie",
        "schaumweinkellerei"
      ],
      "unlock": {
        "city": 8,
        "tier4": 250
      }
    },
    {
      "good": "schokolade",
      "name": "Schokolade",
      "inputs": {
        "kakao": 1,
        "zucker": 1
      },
      "buildings": [
        "kakaoplantage",
        "schokoladenmanufaktur"
      ],
      "unlock": {
        "city": 8,
        "tier4": 400
      }
    },
    {
      "good": "taschenuhren",
      "name": "Taschenuhren",
      "inputs": {
        "praezisionsteile": 1,
        "glas": 0.25,
        "goldstaub": 0.25
      },
      "buildings": [
        "praezisionswerkstatt",
        "uhrmacherei"
      ],
      "unlock": {
        "city": 9,
        "tier4": 650
      }
    },
    {
      "good": "grammophone",
      "name": "Grammophone",
      "inputs": {
        "praezisionsteile": 1,
        "furniere": 1,
        "kupfer": 0.5
      },
      "buildings": [
        "furnierwerkstatt",
        "grammophonmanufaktur"
      ],
      "unlock": {
        "city": 10,
        "tier4": 1000
      }
    }
  ],
  "intermediates": [
    {
      "good": "kaffeebohnen",
      "building": "kaffeeplantage",
      "inputs": {},
      "fertility": "kaffee"
    },
    {
      "good": "zuckerrohr",
      "building": "zuckerrohrplantage",
      "inputs": {},
      "fertility": "zuckerrohr"
    },
    {
      "good": "zucker",
      "building": "zuckerraffinerie",
      "inputs": {
        "zuckerrohr": 2,
        "kohle": 0.25
      }
    },
    {
      "good": "kakao",
      "building": "kakaoplantage",
      "inputs": {},
      "fertility": "kakao"
    },
    {
      "good": "praezisionsteile",
      "building": "praezisionswerkstatt",
      "inputs": {
        "stahl": 1,
        "kupfer": 0.5
      }
    },
    {
      "good": "furniere",
      "building": "furnierwerkstatt",
      "inputs": {
        "bretter": 1
      }
    }
  ],
  "notes": [
    "Rezepte sind Startwerte für spätere Bilanzierung, keine behaupteten balancierten Zyklusquoten.",
    "Strom/Glühbirnen erst spät bei Patriziern als zusätzliche Pflichtversorgung; ab Aristokraten reguläre Grundversorgung.",
    "Keine automatisch aus der nächsten Hausstufe abgeleitete Zusatzversorgung.",
    "Planfreigabe 15.10.2026: Spiellogik implementiert; neue Grafiken ausschließlich durch den separaten Spriteworkflow."
  ]
};
const NEEDS_VERSION=1;
const NEEDS_BY_TIER=Object.fromEntries(NEEDS_PLAN.tiers.map(t=>[t.id,t]));
// [city stage, introducing population tier, owner-wide population peak]
const NEED_UNLOCK={markt:[1,1,0],fisch:[1,1,0],brot:[2,1,20],schnaps:[2,1,30],tuch:[3,1,40],kapelle:[3,1,40],honig:[3,1,60],most:[3,1,80],wurst:[4,2,1],stiefel:[4,2,40],bier:[4,2,60],seife:[4,2,80],laternen:[4,2,80],wein:[4,2,100],schule:[5,2,120],moebel:[5,2,160],feine_kleidung:[6,3,1],geschirr:[6,3,40],buecher:[6,3,80],gemeinschaft:[6,3,120],parfuem:[6,3,120],schmuck:[6,3,200],kirche:[6,3,200],strom:[6,3,250],gluehbirnen:[6,3,300],kaffee:[7,4,1],universitaet:[7,4,1],feinkost:[7,4,100],schaumwein:[8,4,250],schokolade:[8,4,400],taschenuhren:[9,4,650],oper:[9,4,750],grammophone:[10,4,1000]};
const NEED_RATES={fisch:.04,brot:.05,tuch:.03,schnaps:.018,honig:.0125,most:.0125,wurst:.008,stiefel:.0075,seife:.01,laternen:.006,bier:.015,wein:.012,moebel:.008,feine_kleidung:.012,geschirr:.01,buecher:.012,gluehbirnen:.008,parfuem:.006,schmuck:.005,kaffee:.014,feinkost:.012,schaumwein:.006,schokolade:.008,taschenuhren:.004,grammophone:.003};
const NEED_LUXURY_BONUS={schnaps:1,honig:1.2,most:1.8,bier:2,wein:2.4,moebel:2.6,parfuem:3.4,schmuck:3.8,schaumwein:4,schokolade:4.2,taschenuhren:4.8,grammophone:5.2,kapelle:1,kirche:2,oper:3};
const NEED_SERVICE_BUILDINGS={markt:'markt',kapelle:'kapelle',schule:'schule',kirche:'kirche',gemeinschaft:'gemeinschaftshaus',universitaet:'universitaet',oper:'oper',strom:'umspannwerk'};
const NEED_NEW_GOODS=[['kaffeebohnen','Kaffeebohnen',20,'getreide'],['kaffee','Kaffee',95,'bier'],['zuckerrohr','Zuckerrohr',18,'getreide'],['zucker','Zucker',45,'mehl'],['kakao','Kakao',30,'gewuerz'],['feinkost','Feinkost',125,'wurst'],['schaumwein','Schaumwein',145,'wein'],['schokolade','Schokolade',150,'honig'],['praezisionsteile','Präzisionsteile',100,'werkzeug'],['taschenuhren','Taschenuhren',220,'schmuck'],['furniere','Furniere',65,'bretter'],['grammophone','Grammophone',260,'moebel'],['kohle','Kohle',25,'erz'],['kupfer','Kupfer',45,'eisen'],['stahl','Stahl',85,'eisen'],['kupferdraht','Kupferdraht',65,'docht'],['guttapercha','Guttapercha',45,'talg'],['isolierte_kabel','Isolierte Kabel',95,'docht'],['gluehbirnen','Glühbirnen',85,'laternen']];
// Temporary aliases reuse existing approved art; no new image is generated here.
function needsAliasGood(id,source){if(!SP[id]&&SP[source]){SP[id]=SP[source];if(SPB[source])SPB[id]=SPB[source];if(HD_CATALOG.has(source))HD_CATALOG.set(id,{...HD_CATALOG.get(source),name:id});}}
window.GameGoodsAliases=Object.fromEntries(NEED_NEW_GOODS.map(([id,,,source])=>[id,source]));
for(const [id,n,v,source] of NEED_NEW_GOODS){if(!GN[id]){const good={id,n,v};GOODS.push(good);GN[id]=good;}needsAliasGood(id,source);GOOD_UNLOCK_TIER[id]=['kohle'].includes(id)?2:['kupfer','stahl','kupferdraht','guttapercha','isolierte_kabel','gluehbirnen'].includes(id)?3:4;STORE_GOOD_CATEGORIES.set(id,['kaffeebohnen','zuckerrohr','kakao','kohle','kupfer','guttapercha'].includes(id)?'raw':'craft');}
function needsRegisterBuilding(id,n,tier,input,out,cycle,workers,placeholder,extra={}){
 B[id]={n,kind:'prod',cat:Object.keys(input).length?'veredel':'roh',w:4,h:3,cost:{gold:400*tier,bretter:4*tier,...(tier>2?{ziegel:4*tier,glas:2*tier}:{stein:3*tier})},upk:6*tier,cycle,in:input,out,req:0,transportRange:54,workforce:{tier:Math.min(tier,3),count:workers},d:'Produziert '+Object.keys(out).map(g=>GN[g].n).join(', ')+'.',artPlaceholder:placeholder,...extra};
 BUILD_TIER[id]=BUILD_RELEVANCE[id]=tier;BUILD_SIZES[id]={w:B[id].w,h:B[id].h};BASE_GEOMETRY[id]={w:B[id].w/BUILDING_SCALE,h:B[id].h/BUILDING_SCALE,range:54/BUILDING_SCALE};
 needsAliasBuilding(id);
}
function needsAliasBuilding(id){const source='b_'+B[id].artPlaceholder;if(SP[source]){SP['b_'+id]=SP[source];SPB['b_'+id]={...SPB[source]};if(HD_CATALOG.has(source))HD_CATALOG.set('b_'+id,{...HD_CATALOG.get(source),name:'b_'+id});}IMPORTED_BUILD_NAMES[id]=IMPORTED_BUILD_NAMES[B[id].artPlaceholder]||B[id].artPlaceholder;}
const NEED_BUILDING_NAMES={kaffeeplantage:'Kaffeeplantage',roesterei:'Rösterei',feinkostkueche:'Feinkostküche',zuckerrohrplantage:'Zuckerrohrplantage',zuckerraffinerie:'Zuckerraffinerie',schaumweinkellerei:'Schaumweinkellerei',kakaoplantage:'Kakaoplantage',schokoladenmanufaktur:'Schokoladenmanufaktur',praezisionswerkstatt:'Präzisionswerkstatt',uhrmacherei:'Uhrmacherei',furnierwerkstatt:'Furnierwerkstatt',grammophonmanufaktur:'Grammophonmanufaktur'};
for(const intermediate of NEEDS_PLAN.intermediates){const farm=!!intermediate.fertility;needsRegisterBuilding(intermediate.building,NEED_BUILDING_NAMES[intermediate.building],4,intermediate.inputs,{[intermediate.good]:1},farm?40:45,farm?8:16,farm?'farm':'tischlerei',farm?{fertility:intermediate.fertility,workforce:{tier:1,count:8}}:{});if(farm){FIELD_RULES[intermediate.building]={type:'acker',count:24,radius:8};B[intermediate.building].fieldRule=FIELD_RULES[intermediate.building];}}
for(const chain of NEEDS_PLAN.newTier4Chains){const id=chain.buildings.at(-1);needsRegisterBuilding(id,NEED_BUILDING_NAMES[id],4,chain.inputs,{[chain.good]:1},60,20,id==='schaumweinkellerei'?'kelterei':id==='feinkostkueche'?'metzger':'tischlerei',{requiresElectricity:['taschenuhren','grammophone'].includes(chain.good)});}
needsRegisterBuilding('koehlerei','Köhlerei',2,{holz:2},{kohle:1},60,6,'holzfaeller');
needsRegisterBuilding('kohlemine','Kohlebergwerk',3,{},{kohle:1},30,12,'mine',{w:B.mine.w,h:B.mine.h,deposit:true});
needsRegisterBuilding('kupfermine','Kupfermine',3,{},{kupfer:1},45,12,'mine',{w:B.mine.w,h:B.mine.h,deposit:true});
needsRegisterBuilding('hochofen','Hochofen',3,{eisen:1,kohle:1},{stahl:1},60,16,'schmelze');
needsRegisterBuilding('drahtdreherei','Drahtdreherei',3,{kupfer:1},{kupferdraht:2},45,12,'dochtdreherei');
needsRegisterBuilding('guttaperchafarm','Guttaperchafarm',3,{},{guttapercha:1},40,8,'obsthof',{workforce:{tier:2,count:8}});FIELD_RULES.guttaperchafarm={type:'acker',count:24,radius:8};B.guttaperchafarm.fieldRule=FIELD_RULES.guttaperchafarm;
needsRegisterBuilding('kabelfabrik','Kabelfabrik',3,{kupferdraht:1,guttapercha:1},{isolierte_kabel:1},45,16,'tischlerei');
needsRegisterBuilding('gluehlampenmanufaktur','Glühlampenmanufaktur',3,{glas:1,kupferdraht:.5},{gluehbirnen:2},60,16,'laternenwerkstatt');
// Generators burn delivered coal; water is taken directly from the adjacent shore.
needsRegisterBuilding('dampfkraftwerk','Dampfkraftwerk',3,{kohle:1},{},30,24,'schmelze',{w:5,h:4,powerSource:true,allowSand:true,cost:{gold:2200,stahl:16,isolierte_kabel:10,bretter:20,stein:20},d:'Verbrennt angelieferte Kohle. Benötigt direkten Kontakt zu Fluss oder Meer; speist angeschlossene Kabelmasten.'});
for(const [id,n,tier,svc,range,placeholder] of [['schule','Schule',2,'schule',36,'forschung'],['universitaet','Universität',4,'universitaet',48,'gemeinschaftshaus'],['oper','Oper',4,'oper',48,'kirche'],['umspannwerk','Umspannwerk',3,'strom',32,'brunnen']]){
 needsRegisterBuilding(id,n,tier,{},{},1,0,placeholder,{kind:'svc',cat:'dienst',svc,r:range,serviceRange:range,transportRange:range,w:id==='umspannwerk'?3:4,h:id==='umspannwerk'?3:4,workforce:null,d:id==='umspannwerk'?'Verteilt Strom eines verbundenen Kraftwerks über bis zu 32 Straßenkacheln.':'Versorgt angeschlossene Häuser über Straßen mit '+n+'.'});SVCN[svc]=n;
}
needsRegisterBuilding('kabelmast','Kabelmast',3,{},{},1,0,'deko_laterne',{kind:'power',cat:'dienst',w:1,h:1,workforce:null,cost:{bretter:2,stahl:1,isolierte_kabel:1},upk:1,d:'Verbindet Kraftwerke, Masten und Umspannwerke bis zu sechs Kacheln Entfernung. Verbindungen werden automatisch hergestellt.'});SVCN.strom='Strom';
for(const id of ['umspannwerk'])B[id].cost={gold:800,stahl:6,isolierte_kabel:4,stein:8};
for(const t of TIERS.filter(Boolean)){const p=NEEDS_BY_TIER[t.id];t.goods=Object.fromEntries(p.baseGoods.map(g=>[g,NEED_RATES[g]]));t.svc=[...p.baseServices];t.luxury=Object.fromEntries(p.luxuryGoods.map(g=>[g,NEED_RATES[g]]));t.cap=p.capacity;}
// Dependency gates: a supplier is available as soon as its first unlocked end product.
const NEED_GOOD_GATES={},NEED_BUILD_GATES={};
function needsAddGate(map,key,gate){const gates=map[key]??=[];if(!gates.some(g=>g.join(':')===gate.join(':')))gates.push(gate);}
function needsGateChain(good,gate,path=new Set()){
 if(path.has(good))return;path=new Set(path);path.add(good);needsAddGate(NEED_GOOD_GATES,good,gate);
 for(const [id,d] of Object.entries(B))if(d.kind==='prod'&&id!=='goldwaescherei'&&d.out?.[good]){needsAddGate(NEED_BUILD_GATES,id,gate);for(const input of Object.keys(d.in||{}))needsGateChain(input,gate,path);}
}
for(const [key,gate] of Object.entries(NEED_UNLOCK)){if(NEED_SERVICE_BUILDINGS[key])needsAddGate(NEED_BUILD_GATES,NEED_SERVICE_BUILDINGS[key],gate);else needsGateChain(key,gate);}
// Energy infrastructure and every construction material must be startable by patricians.
for(const id of ['dampfkraftwerk','kabelmast','umspannwerk','hochofen','kupfermine','drahtdreherei','guttaperchafarm','kabelfabrik'])needsAddGate(NEED_BUILD_GATES,id,NEED_UNLOCK.strom);
for(const good of ['stahl','isolierte_kabel','kupfer','kupferdraht','guttapercha'])needsGateChain(good,NEED_UNLOCK.strom);
needsGateChain('kohle',[4,2,1]);NEED_BUILD_GATES.kohlemine=[NEED_UNLOCK.strom];
// Existing construction materials stay available independently of household tastes.
for(const [good,gate] of Object.entries({holz:[1,1,0],bretter:[1,1,0],stein:[1,1,0],lehm:[1,1,0],ziegel:[1,1,0],erz:[2,1,20],eisen:[2,1,20],werkzeug:[2,1,20],glas:[4,2,80],zement:[6,3,1],beton:[6,3,1],papier:[5,2,120]}))needsGateChain(good,gate);
for(const [id,gates] of Object.entries(NEED_BUILD_GATES)){const tier=Math.min(...gates.map(g=>g[1]));if(!B[id].deposit)BUILD_TIER[id]=BUILD_RELEVANCE[id]=tier;else BUILD_TIER[id]=BUILD_RELEVANCE[id]=3;if(B[id].workforce&&B[id].workforce.tier>tier)B[id].workforce.tier=tier;}
// Farms introduced at tier4 still use existing farmers; never need their own new residents.
for(const id of ['kaffeeplantage','zuckerrohrplantage','kakaoplantage'])B[id].workforce={tier:1,count:8};
// School unlock replaces the church in the early civic package.
B.garten.retired=true; // Keep the definition and art for existing saves only.
for(const level of window.GameCityLevels){level.goods=[];level.buildings=level.buildings.filter(id=>!B[id]?.retired&&(B[id]?.kind==='decor'||['rathaus','ausstellungspalast','werft','lager','feuer'].includes(id)));}
for(const [key,gate] of Object.entries(NEED_UNLOCK)){const level=window.GameCityLevels[gate[0]-1];if(NEED_SERVICE_BUILDINGS[key])level.buildings.push(NEED_SERVICE_BUILDINGS[key]);else level.goods.push(key);}
for(const [id,gates] of Object.entries(NEED_BUILD_GATES)){const stage=Math.min(...gates.map(g=>g[0]));const level=window.GameCityLevels[stage-1];if(!level.buildings.includes(id))level.buildings.push(id);}
