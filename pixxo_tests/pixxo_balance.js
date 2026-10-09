/* Modellrechnung mit Spielpreisen und Produktionsketten bei voller Auslastung. */
function pixxoBalanceModel(){
 const scenarios=[{name:'Siedlung',population:[0,100,0,0]},{name:'Bürgerstadt',population:[0,100,200,0]},{name:'Patrizierstadt',population:[0,150,200,300]}],result=[];
 for(const scenario of scenarios)for(const extra of [false,true]){
 let fitted=false;scenario.population=[...scenario.population];for(let attempt=0;attempt<20;attempt++){
  const demand={},counts={},houses=[],work=[0,0,0,0];let income=0,serviceUpkeep=0,capital=0;
  for(const tier of [1,2,3]){const pop=scenario.population[tier];if(!pop)continue;const cap=TIERS[tier].cap*(extra?1:.6),houseCount=Math.ceil(pop/cap),h={type:'haus',tier,pop:pop/houseCount,conn:true,fire:0,mood:1,cov:{markt:true,kapelle:true,kirche:true},sat:{}};
   for(const good of Object.keys(TIERS[tier].goods))h.sat[good]=true;if(extra)for(const good of Object.keys({...additionalHouseGoods(h),...TIERS[tier].luxury}))h.sat[good]=true;
   income+=houseIncome(h)*houseCount;for(const [good,rate] of Object.entries(houseRates(h)))if(h.sat[good])demand[good]=(demand[good]||0)+rate*pop;
   const districts=Math.ceil(houseCount/24);for(const svc of TIERS[tier].svc){const d=B[svc==='kapelle'?'kapelle':svc==='kirche'?'kirche':'markt'];serviceUpkeep+=districts*d.upk;capital+=districts*d.cost.gold;}
   capital+=houseCount*(B.haus.cost.gold+[2,3].filter(t=>t<=tier).reduce((n,t)=>n+UPG[t].gold,0));
  }
  const pending={...demand},producers=Object.entries(B).filter(([,d])=>d.kind==='prod'),depth={};
  function cover(good,amount){if(amount<=1e-8)return;const producer=producers.find(([,d])=>d.out?.[good]);if(!producer)throw Error('Produktionskette fehlt: '+good);const [type,d]=producer,perMinute=d.out[good]*60/d.cycle;
   const available=(counts[type]||0)*perMinute-(depth[good]||0),needed=Math.max(0,Math.ceil((amount-available)/perMinute-1e-8));depth[good]=(depth[good]||0)+amount;if(!needed)return;counts[type]=(counts[type]||0)+needed;
   for(const [input,qty] of Object.entries(d.in||{}))cover(input,needed*qty*60/d.cycle);
  }
  for(const [good,amount] of Object.entries(pending))cover(good,amount);
  let productionUpkeep=0;for(const [type,count] of Object.entries(counts)){const d=B[type];productionUpkeep+=d.upk*count;capital+=d.cost.gold*count;if(d.workforce)work[d.workforce.tier]+=d.workforce.count*count;}
  const ships=scenario.population[3]?4:scenario.population[2]?2:0,shipUpkeep=ships*SHIPS.schooner.upk;
  const shortages=[1,2].filter(t=>work[t]>scenario.population[t]);if(shortages.length){for(const tier of shortages)scenario.population[tier]=Math.ceil(work[tier]/50)*50;continue;}fitted=true;
  result.push({scenario:scenario.name,extraSupply:extra,population:scenario.population.slice(1),income:+income.toFixed(1),upkeep:serviceUpkeep+productionUpkeep+shipUpkeep,net:+(income-serviceUpkeep-productionUpkeep-shipUpkeep).toFixed(1),constructionGold:capital,workers:work.slice(1),production:counts});break;
 }if(!fitted)throw Error('Arbeitskräftebedarf konnte nicht gedeckt werden: '+scenario.name);}
 return result;
}
