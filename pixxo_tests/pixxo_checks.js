/* Integrationstests im vollständigen Spiel; eigener LocalStorage-Schlüssel. */
function runPixxoChecks(){
 const checks=[],check=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);},near=(a,b)=>Math.abs(a-b)<1e-6;
 check(document.title==='Pixxo','Spielname Pixxo');check(!document.querySelector('#pixxo-loading'),'Ladebildschirm blendet nach Start aus');check(G.stock.bretter===30,'Startvorrat 30 Bretter');check(G.deposits.some(n=>n.type==='steinbruch'&&n.inMountain),'Startinsel hat Bergsteinbruch');
 for(let seed=1;seed<=200;seed++){const profiles=generateIslandProfiles(seed,ISLANDS.length);check(profiles.every(p=>p.fert.length<=2),'Maximal zwei Fruchtbarkeiten, Welt '+seed);}
 const balance=pixxoBalanceModel();window.pixxoBalanceResult=balance;check(balance.filter(r=>r.extraSupply&&r.luxury).every(r=>r.net>0),'Voll versorgte Beispielstädte finanzieren ihre Produktionsketten');
 const originalSaved=localStorage.getItem(SAVEKEY),baseX=Math.max(20,Math.min(MAPW-70,ISLANDS[activeIsland].ox+100)),baseY=Math.max(20,Math.min(MAPH-70,ISLANDS[activeIsland].oy+100));
 for(const type of ['mine','steinbruch'])for(const node of G.deposits.filter(n=>n.type===type))check(footprintCells(node.x,node.y,B[type].w,B[type].h).every(([x,y])=>[T.ROCK,T.ORE].includes(G.tiles[IDX(x,y)])),'Abbaufläche vollständig im Berg: '+type);
 for(const [id] of PIXXO_DECOR){check(B['deko_'+id].upk===0&&Object.keys(B['deko_'+id].cost).join()==='gold','Deko nur Gold: '+id);check(!!SP['b_deko_'+id],'Deko besitzt natives Sprite: '+id);}
 check(B.schuster.workforce.tier===1&&BUILD_TIER.schuster===1&&BUILD_TIER.kerzenzieherei===2,'Neue Pflichtwaren sind vor dem Aufstieg herstellbar');
 check(balance.filter(r=>r.extraSupply&&!r.luxury&&r.population[1]>0).every(r=>r.net>0),'Bürger-, Patrizier- und Aristokratenstädte finanzieren volle Bedürfnisse ohne Luxus');
 const house={type:'haus',tier:1,pop:4,conn:true,fire:0,sat:{fisch:true,schnaps:true},cov:{markt:true}};
 check(near(pixxoHouseCapacity(house),3*pixxoResidentsForNeed(house,'schnaps')),'Drei erfüllte Bedürfnisse ermöglichen ganze Bewohner');for(const g of Object.keys({...additionalHouseGoods(house),...TIERS[1].luxury}))house.sat[g]=true;
 check(near(pixxoHouseCapacity(house),TIERS[1].cap),'Vollversorgung belegt 100 %');house.cov.markt=false;check(near(pixxoHouseCapacity(house),0),'Ohne Markt keine Warenversorgung');house.cov.markt=true;house.sat.schnaps=false;check(pixxoHouseCapacity(house)===TIERS[1].cap-pixxoResidentsForNeed(house,'schnaps'),'Fehlendes Bedürfnis senkt Belegung um ganze Bewohner');
 check(Object.keys(TIERS[1].goods).includes('schnaps')&&Object.keys(TIERS[2].goods).includes('stiefel')&&Object.keys(TIERS[3].goods).includes('kerzen'),'Neue Waren sind Pflichtbedarf');
 check(near(TIERS[2].goods.fisch,.01),'Bürgerverbrauch um 50 % reduziert');
 WORLD.loan=null;const gold=G.gold;check(pixxoBorrow(1000)&&near(G.gold,gold+1000),'Darlehen zahlt Gold aus');check(!pixxoBorrow(2500),'Nur ein laufendes Darlehen');pixxoLoanStep(60);check(near(WORLD.loan.balance,1100-1100/30),'Eine Minute zieht korrekte Rate ab');G.gold=10000;check(pixxoRepay()&&!WORLD.loan,'Vorzeitige Rückzahlung');
 for(const amount of [1000,2500,5000]){check(pixxoBorrow(amount),'Darlehensgröße '+amount);pixxoLoanStep(1800);check(!WORLD.loan,'Nach 30 Minuten vollständig zurückgezahlt: '+amount);}
 UI.barMode='deko';renderBar();check($('#bar').querySelectorAll('[data-deko-category]').length===6,'Deko-Leiste zeigt sechs Kategorien');UI.cat='deko_natur';renderBar();check($('#items').querySelectorAll('[data-b]').length>=7,'Deko-Kategorie öffnet gemeinsame Objektauswahl');check(dekoToggle.querySelector('img')&&dekoToggle.textContent.trim()==='','Deko-Schalter besitzt nur ein Icon');check(Math.abs(barModes.getBoundingClientRect().height-$('#bar').getBoundingClientRect().height)<1,'Beide Icon-Buttons mit Abstand sind so hoch wie die Bauleiste');UI.barMode='build';UI.cat=null;renderBar();check(!WINS.tutorial,'Tutorial bleibt deaktiviert');
 // Synthetische Fläche im laufenden Spiel für Straßen, Einsatz, Platzierung und Versorgung.
 G.blds=[];G.byId.clear();G.deposits=[];G.fireEngines=[];G.road.fill(0);G.occ.fill(0);G.gold=100000;G.nextFire=10000;WORLD.highestTier=3;
 for(let y=baseY-20;y<baseY+65;y++)for(let x=baseX-20;x<baseX+65;x++){G.tiles[IDX(x,y)]=T.GRASS;if(G.river)G.river[IDX(x,y)]=0;islandOwners[IDX(x,y)]=activeIsland;}
 function add(type,x,y,extra={}){const d=B[type],b={id:G.nid++,island:activeIsland,type,x,y,w:d.w,h:d.h,tier:1,pop:0,paused:false,prog:0,conn:true,acc:-1,eff:1,status:'',fire:0,need:{},sat:{},mood:0,cov:{},age:0,...extra};G.blds.push(b);G.byId.set(b.id,b);for(const [a,c] of footprintCells(x,y,b.w,b.h))G.occ[IDX(a,c)]=b.id;return b;}
 const port=add('kontor',baseX,baseY);G.stock=Object.fromEntries(GOODS.map(g=>[g.id,100]));
 const clay={type:'lehmgrube',x:baseX+20,y:baseY+20};G.deposits=[clay];UI.tool=null;
 check(!canPlace('haus',clay.x,clay.y).ok,'Häuser blockieren Lehmvorkommen nicht');check(!placeRoad(clay.x,clay.y),'Straßen blockieren Lehmvorkommen nicht');
 const sandX=baseX+30,sandY=baseY+30;G.tiles[IDX(sandX,sandY)]=T.SAND;check(!canPlace('haus',sandX,sandY).ok,'Normale Gebäude nicht auf Sand');
 for(let x=sandX;x<sandX+5;x++){G.tiles[IDX(x,sandY-1)]=T.SHAL;G.tiles[IDX(x,sandY)]=T.SAND;}
 check(canPlace('fischer',sandX,sandY).ok,'Fischer an echter Wasserkante platzierbar');check(pixxoCoastSide(sandX,sandY,3,3)==='north','Himmelsrichtung der Küste korrekt');
 const station=add('feuer',baseX+10,baseY+8),target=add('haus',baseX+21,baseY+8,{pop:4,tier:1,fire:1}),neighbor=add('haus',baseX+25,baseY+8,{pop:2});
 for(let x=baseX+10;x<baseX+28;x++)G.road[IDX(x,baseY+11)]=1;rebuildNet();
 target.fire=60;pixxoFireStep(.1);check(G.fireEngines.length===1&&target.fire>0,'Feuerwehr verhindert Brand nicht und fährt aus');check(G.fireEngines[0].t<G.fireEngines[0].path.length-1,'Löschwagen startet am Straßenanschluss der Wache');
 for(let i=0;i<100&&!pixxoEngineArrived(target);i++)pixxoFireStep(.1);check(pixxoEngineArrived(target),'Löschwagen erreicht Brand über Straßen');
 target.fire=.001;pixxoFireStep(.1);check(target.fire>0&&target.extinguish>0,'Ankunft schützt Gebäude und startet grünen Löschfortschritt');
 for(let i=0;i<130&&target.fire>0;i++)pixxoFireStep(.1);check(target.type==='haus'&&target.fire===0,'Nach abgeschlossenem Löschen bleibt Haus bestehen');check(G.fireEngines[0]?.phase==='return','Löschwagen fährt zur Wache zurück');
 G.fireEngines=[];station.paused=true;target.fire=.05;pixxoFireStep(.1);check(target.type==='ruine','Ohne einsatzfähige Feuerwehr bleibt eine Brandruine');
 station.paused=false;target.type='haus';target.fire=10;neighbor.fire=0;const random=Math.random;Math.random=()=>0;pixxoFireStep(.1);Math.random=random;check(neighbor.fire>0,'Brand kann auf Nachbargebäude überspringen');
 G.fireEngines=[];for(const b of G.blds)b.fire=0;target.extinguish=0;
 // Waldpunkte werden unter allen angeschlossenen Holzfällern aufgeteilt.
 const a=add('holzfaeller',baseX+6,baseY+25),b=add('holzfaeller',baseX+10,baseY+25);a.conn=b.conn=true;a.staffEff=b.staffEff=1;
 let unique=0;for(let y=baseY+22;y<baseY+34;y++)for(let x=baseX+2;x<baseX+18;x++){const k=IDX(x,y);if(!G.occ[k]&&!G.road[k]&&(Math.hypot(x+.5-cx(a),y+.5-cy(a))<=B.holzfaeller.env.r||Math.hypot(x+.5-cx(b),y+.5-cy(b))<=B.holzfaeller.env.r)){G.tiles[k]=T.FOREST;unique++;}}
 pixxoAssignTrees();check(near(a.envCount+b.envCount,unique),'Überlappende Radien zählen jeden Baum insgesamt genau einmal');b.paused=true;pixxoAssignTrees();check(b.envCount===0,'Pausierter Holzfäller reserviert keine Bäume');
 // Verbrauch nur durch tatsächlich versorgte Einwohner.
 const h=add('haus',baseX+35,baseY+5,{pop:2,cov:{markt:true},conn:true});target.conn=neighbor.conn=false;
 const before=G.stock.fisch;prepareHouseSupply(60);check(near(before-G.stock.fisch,2*TIERS[1].goods.fisch),'Güterverbrauch nach Einwohnern statt voller Hauskapazität');
 h.cov.markt=false;const next=G.stock.fisch;prepareHouseSupply(60);check(near(next,G.stock.fisch),'Unversorgte Häuser verbrauchen keine Marktware');
 // Wissen: erreichbare Einwohner, anteilige Fünfergruppen, Stufenfaktor.
 const research=add('forschung',baseX+35,baseY+15),hh2=add('haus',baseX+39,baseY+5,{pop:5,tier:2}),hh3=add('haus',baseX+43,baseY+5,{pop:5,tier:3});
 for(let x=baseX+34;x<baseX+48;x++)G.road[IDX(x,baseY+8)]=1;for(let y=baseY+8;y<baseY+20;y++)G.road[IDX(baseX+34,y)]=1;rebuildNet();G.research={wissen:0,done:[],active:null};h.pop=5;hh2.pop=5;hh3.pop=5;check(near(knowledgeCoverage().rate,6),'Je fünf Siedler/Bürger/Patrizier erzeugen 1/2/3 Wissen');h.pop=2;check(near(knowledgeCoverage().rate,5.4),'Angefangene Fünfergruppen zählen anteilig');
 UI.sel=a.id;openWin_info();winAct('info',{act:'pause'});check(a.paused&&WINS.info.body.textContent.includes('Fortsetzen')&&WINS.info.body.textContent.includes('Pausiert'),'Pausieren aktualisiert das Produktionsfenster sofort');winAct('info',{act:'pause'});check(!a.paused&&WINS.info.body.textContent.includes('Pausieren'),'Fortsetzen aktualisiert den Button sofort');closeWin('info');
 UI.sidebarTab=null;WORLD.questSeen=[];pixxoQuestBadge();check(!questButton.querySelector('.side-event-count').hidden,'Neue Aufträge besitzen Zähler');toggleSidebar('quest');check(questButton.querySelector('.side-event-count').hidden,'Öffnen liest die Auftragsmeldungen');toggleSidebar('quest');
 const count=UI.log.length;MSGHOOK('Ein Haus wurde verschoben.','i_houses');check(UI.log.length===count,'Verschieben erzeugt kein Ereignis');
 const ratesBefore=G.cnt.prod.schnaps||0;
 const lager=add('lager',baseX+5,baseY+35),production=[];
 for(let i=0;i<PIXXO_CHAINS.length;i++){const type=PIXXO_CHAINS[i][0],b=add(type,baseX+12+i*5,baseY+40,{inputStock:Object.fromEntries(Object.keys(B[type].in).map(g=>[g,100]))});production.push(b);}
 for(let x=baseX+10;x<=baseX+42;x++)G.road[IDX(x,baseY+43)]=1;for(let y=baseY+35;y<=baseY+43;y++)G.road[IDX(baseX+10,y)]=1;
 // Echte Hauskapazitäten statt 100 Einwohner in einem einzelnen Testhaus.
 add('markt',baseX+25,baseY+24);add('kapelle',baseX+25,baseY+32);
 for(let row=0;row<4;row++)for(let col=0;col<4;col++){const tier=col<2&&row>=2?2:1;add('haus',baseX+35+col*4,baseY+24+row*4,{tier,pop:TIERS[tier].cap});}
 for(let y=baseY+5;y<=baseY+43;y++)G.road[IDX(baseX+34,y)]=1;
 for(let x=baseX;x<=baseX+34;x++)G.road[IDX(x,baseY+B.kontor.h)]=1;
 for(let y=baseY+B.kontor.h;y<=baseY+5;y++)G.road[IDX(baseX+34,y)]=1;
 for(let row=0;row<4;row++)for(let x=baseX+34;x<=baseX+51;x++)G.road[IDX(x,baseY+27+row*4)]=1;
 for(let y=baseY+24;y<=baseY+37;y++)G.road[IDX(baseX+25+B.markt.w,y)]=1;
 for(let x=baseX+25+B.markt.w;x<=baseX+34;x++)G.road[IDX(x,baseY+35)]=1;
 for(let x=baseX+10;x<=baseX+51;x++)G.road[IDX(x,baseY+43)]=1;
 for(const owner of production.filter(b=>FIELD_RULES[b.type])){const rule=FIELD_RULES[owner.type];for(let i=0;i<rule.count;i++)add(rule.type,baseX+10+i*(rule.type==='gehege'?3:1)%16,baseY+(rule.type==='gehege'?59:55)+Math.floor(i/16)*3,{fieldOwner:owner.id});}
 rebuildNet();const counters=Object.fromEntries(PIXXO_CHAINS.map(c=>[c[4],G.cnt.prod[c[4]]||0]));for(let i=0;i<750;i++)step(.1);for(const chain of PIXXO_CHAINS)check((G.cnt.prod[chain[4]]||0)>counters[chain[4]],'Produktionskette erzeugt Ware in echter Simulation: '+chain[1]+' '+JSON.stringify(production.find(b=>b.type===chain[0])));
 localStorage.setItem(SAVEKEY,originalSaved);check(loadGame(),'Spielstand nach Regeländerungen ladbar');check(G.deposits.some(n=>n.type==='steinbruch'&&n.inMountain),'Bergabbauplätze bleiben beim Laden erhalten');
 G.gold=10000;pixxoBorrow(2500);saveGame();check(loadGame()&&WORLD.loan.principal===2500,'Darlehen wird gespeichert und geladen');WORLD.loan=null;saveGame();
 const previousKey=atob('ZXdpZ2VzX2tvZW5pZ3JlaWNoX2Fubm9fdjE='),previousValue=localStorage.getItem(previousKey),freshSaved=localStorage.getItem(SAVEKEY);localStorage.removeItem(SAVEKEY);localStorage.setItem(previousKey,JSON.stringify(PIXXO_LEGACY_TEST_SAVE));check(loadGame(),'Vorhandener Browser-Spielstand wird unter Pixxo übernommen');check(PIXXO_TERRAIN_VERSION===1,'Alter Spielstand behält alte Geländegeneration');check(near(G.gold,PIXXO_LEGACY_TEST_SAVE.gold),'Übernahme erhält Gold');check(WORLD.islands.filter(Boolean).reduce((n,g)=>n+g.blds.length,0)===PIXXO_LEGACY_TEST_SAVE.islands.filter(Boolean).reduce((n,g)=>n+g.blds.length,0),'Übernahme erhält alle Gebäude');if(previousValue===null)localStorage.removeItem(previousKey);else localStorage.setItem(previousKey,previousValue);localStorage.setItem(SAVEKEY,freshSaved);check(loadGame(),'Neue Pixxo-Partie bleibt nach Übernahme weiter ladbar');
 const beforeImport=localStorage.getItem(SAVEKEY);let rejected=false;try{pixxoImportSave('{"v":9,"islands":[]}');}catch{rejected=true;}check(rejected&&localStorage.getItem(SAVEKEY)===beforeImport,'Ungültiger Import erhält die Partie');
 check(pixxoImportSave(beforeImport),'Gültiger JSON-Spielstand wird importiert');check(localStorage.getItem('pixxo_import_backup')===beforeImport,'Import sichert die vorige Partie');
 history.replaceState(null,'','#pixxo-save='+encodeURIComponent(btoa(Array.from(new TextEncoder().encode(beforeImport),c=>String.fromCharCode(c)).join(''))));check(loadGame()&&location.hash==='','Dateiübernahme lädt Spielstand und entfernt URL-Daten');
 history.replaceState(null,'','#pixxo-save=ungültig');check(loadGame()&&location.hash==='','Fehlerhafte Übernahme erhält gespeicherte Partie');
 afterNewWorld();setSpeed(0);for(const id of Object.keys(WINS))closeWin(id);render();
 return {passed:checks.length,checks,balance};
}
setTimeout(()=>{try{const result=runPixxoChecks();window.pixxoTestResult=result;const box=document.getElementById('pixxo-test-results');box.innerHTML='<h3>'+result.passed+' Prüfungen bestanden</h3>'+result.balance.map(r=>'<p>'+r.scenario+(r.extraSupply?' mit Zusatzversorgung':' mit Grundversorgung')+': '+r.net+' Gold / Min. · Einwohner '+r.population.join('/')+' · Arbeitskräftebedarf '+r.workers.join('/')+'</p>').join('')+'<p>Alle neuen Produktionsketten erzeugen Waren.</p><p>Feuerwehr, Speicherung, Platzierung und Versorgung bestanden.</p>';}catch(error){document.getElementById('pixxo-test-results').textContent='FEHLER: '+error.stack;console.error(error);}},8000);
