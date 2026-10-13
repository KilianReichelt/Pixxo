/* Aufgaben 13.10: Wirtschaft. Neue Grafiken bleiben bis zur Assetfreigabe Platzhalter. */
B.markt.upk=0;
BUILD_TIER.dochtdreherei=BUILD_TIER.kerzenzieherei=1;
BUILD_RELEVANCE.dochtdreherei=BUILD_RELEVANCE.kerzenzieherei=1;
GOOD_UNLOCK_TIER.docht=GOOD_UNLOCK_TIER.kerzen=1;
B.dochtdreherei.workforce={tier:1,count:4};B.kerzenzieherei.workforce={tier:1,count:4};
for(const tier of TIERS.filter(Boolean))tier.tax=({1:2.4,2:4,3:8,4:7.2})[tier.id]??tier.tax;
const OCT13_GOODS=[['schweine','Schweine',18,'haeute'],['wurst','Wurst',48,'stiefel'],['laternen','Laternen',70,'kerzen']];
for(const [id,n,v,placeholder] of OCT13_GOODS){const good={id,n,v};GOODS.push(good);GN[id]=good;GOOD_UNLOCK_TIER[id]=2;const source=HD_CATALOG.get(placeholder)?.pixelSource;if(source)publishPixel(id,source,16,16);}
B.schweinehof.out={schweine:1};B.schweinehof.d='Züchtet Schweine für Talgfabrik und Metzger. Benötigt vier Tiergehege.';
const OCT13_BUILDINGS=[['talgfabrik','Talgfabrik',{schweine:1},{talg:1},30,20,'seifensiederei'],['metzger','Metzger',{schweine:1,gewuerz:1},{wurst:1},45,28,'seifensiederei'],['laternenwerkstatt','Laternenwerkstatt',{kerzen:1,eisen:1,werkzeug:1},{laternen:1},60,32,'tischlerei']];
for(const [id,n,input,out,cycle,upk,placeholder] of OCT13_BUILDINGS){B[id]={n,cat:'veredel',kind:'prod',w:3,h:3,cost:{gold:650,bretter:8,stein:6},upk,cycle,in:input,out,req:0,transportRange:36,workforce:{tier:2,count:4},d:'Produziert '+Object.keys(out).map(g=>GN[g].n).join(', ')+'. Benötigt '+Object.keys(input).map(g=>GN[g].n).join(', ')+'.'};IMPORTED_BUILD_NAMES[id]=IMPORTED_BUILD_NAMES[placeholder]||placeholder;BUILD_TIER[id]=BUILD_RELEVANCE[id]=2;BUILD_SIZES[id]={w:3,h:3};BASE_GEOMETRY[id]={w:2,h:2,range:24};SP['b_'+id]=SP['b_'+placeholder];SPB['b_'+id]={...SPB['b_'+placeholder]};}
for(const tier of TIERS.filter(Boolean)){if(tier.id>=2){delete tier.goods.kerzen;tier.goods.wurst=tier.id===2?.008:.012;tier.goods.laternen=tier.id===2?.006:.01;}}
// Keine neue Bürgerware als verpflichtendes Siedler-Vorbedürfnis.
const oct13AdditionalGoods=additionalHouseGoods;additionalHouseGoods=function(b){const goods=oct13AdditionalGoods(b);if(b.tier<2){delete goods.wurst;delete goods.laternen;}return goods;};
const oct13NextTierReq=nextTierReq;nextTierReq=function(b){const result=oct13NextTierReq(b);if(result?.nt===2){result.list=result.list.filter(r=>!['wurst','laternen'].includes(r.icon));result.ok=result.list.every(r=>r.ok);}return result;};
pixxoRefreshHouseCapacities();
for(const good of GOODS)STORE_GOOD_CATEGORIES.set(good.id,Object.values(B).some(b=>b.kind==='prod'&&b.cat==='roh'&&b.out?.[good.id])?'raw':'craft');
const oct13NewGame=newGame;newGame=function(...args){const result=oct13NewGame(...args);for(const [id] of OCT13_GOODS)G.stock[id]??=0;return result;};
const oct13Unpack=unpackIsland;unpackIsland=function(data,...args){const g=oct13Unpack(data,...args);for(const [id] of OCT13_GOODS)g.stock[id]??=0;return g;};
// Tax share is the attainable per-need contribution at full satisfaction,
// not a misleading attribution of the nonlinear current mood-squared tax.
function pixxoNeedIncome(b,need){if(Object.hasOwn(TIERS[b.tier].luxury,need))return luxuryBonus({...b,pop:TIERS[b.tier].cap},need);const all=pixxoHouseNeeds(b),capacity=TIERS[b.tier].cap,pop=pixxoResidentsForNeed(b,need);let income=pop*TIERS[b.tier].tax;if(all.goods.includes(need)&&need==='brot')income+=capacity*.25*EXTRA_INCOME_MULTIPLIER;else if(Object.hasOwn(additionalHouseGoods(b),need))income+=capacity*.125*EXTRA_INCOME_MULTIPLIER;return income;}
pixxoHouseNeedLabel=function(b,need,name){const t=TIERS[b.tier];return '<span class="need-name">'+esc(name)+'</span><span class="need-residents" title="Einkommensbeitrag bei voller Versorgung">+'+(Object.hasOwn(t.luxury,need)?0:pixxoResidentsForNeed(b,need))+' '+ic(t.icon,1)+' | +'+pixxoNeedIncome(b,need).toLocaleString('de-DE',{maximumFractionDigits:1})+' '+ic('gold',1)+'/min</span>';};
pixxoGoldRate=function(value){const text=String(value);return '<span class="gold-rate">'+esc(/^[+−-]/.test(text)?text:'+'+text)+' '+ic('gold',1)+' / min</span>';};
