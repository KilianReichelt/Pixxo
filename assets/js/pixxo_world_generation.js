/* Inselprofile werden je neuer Welt erzeugt und zusammen mit ihr gespeichert. */
const LEGACY_GENERATION_PROFILES=ISLANDS.map((m,i)=>({...m,size:ORIGINAL_ISLAND_SIZES[i],forestThreshold:m.forestThreshold??(m.name==='Nordwald'?.46:m.name==='Grünau'?.68:.56),fert:[...m.fert]}));
let generateFreshProfiles=false,loadedIslandProfiles=null;
function generateIslandProfiles(seed,count=12){
 let state=(seed^0x6d2b79f5)>>>0;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 const shuffle=values=>{const result=[...values];for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;};
 const first=['Kron','Weiden','Sonnen','Eichen','Silber','Raben','Falken','Birken','Nebel','Bernstein','Linden','Dorn','Wellen','Möwen','Kiesel','Grün','Gold','Wind','Stern','Rosen'];
 const last=['holm','hafen','au','fels','wacht','ort','riff','hain','bucht','werder','strand','küste'];
 const names=shuffle(first.flatMap(a=>last.map(b=>a+b))),sizes=shuffle(Array.from({length:count},(_,i)=>i%3));
 const crops=['hopfen','trauben','gewuerz'],profiles=[];
 for(let i=0;i<count;i++){
  const size=Number((sizes[i]===0?.44+random()*.12:sizes[i]===1?.33+random()*.1:.22+random()*.1).toFixed(3));
  const ore=Number((random()<.15?0:.15+random()*2.35).toFixed(2)),fert=shuffle(crops).slice(0,1+Math.floor(random()*2)),forestThreshold=Number((.46+random()*.2).toFixed(3));
  const name=names[i];profiles.push({name,generatedName:name,size,ore,fert,forestThreshold,perk:'Getreideanbau ist überall möglich.',drawback:ore<.5?'Wenige Erzvorkommen.':size<.33?'Kleine Baufläche.':'Fruchtbarkeiten und Vorkommen ergänzen sich mit anderen Inseln.'});
 }
 // Jede Kultur ist auf mindestens zwei Inseln verfügbar.
 for(let k=0;k<crops.length;k++)for(let n=0;n<2;n++){const p=profiles[(k*2+n)%count];if(!p.fert.includes(crops[k])){if(p.fert.length===2)p.fert.pop();p.fert.push(crops[k]);}}
 return profiles;
}
function applyIslandProfiles(profiles){
 for(let i=0;i<ISLANDS.length;i++){const m=ISLANDS[i],p=profiles[i];if(!p)continue;delete m.generatedName;Object.assign(m,p,{fert:[...p.fert].slice(0,2)});delete m.customName;}
}
function savedIslandProfiles(){return ISLANDS.map(m=>({name:m.generatedName||m.name,generatedName:m.generatedName,size:m.size,ore:m.ore,fert:[...m.fert],forestThreshold:m.forestThreshold,perk:m.perk,drawback:m.drawback}));}
const profileGenMap=genMap;genMap=function(seed,...args){
 if(generateFreshProfiles){applyIslandProfiles(generateIslandProfiles(seed,ISLANDS.length));generateFreshProfiles=false;}
 else if(loadedIslandProfiles){applyIslandProfiles(loadedIslandProfiles);loadedIslandProfiles=null;}
 return profileGenMap(seed,...args);
};
const profileStartNew=startNew;startNew=function(...args){generateFreshProfiles=true;loadedIslandProfiles=null;preferredLayout=null;return profileStartNew(...args);};
const profileLoadGame=loadGame;loadGame=function(...args){
 let saved;try{saved=JSON.parse(localStorage.getItem(SAVEKEY));}catch{}
 const profiles=saved?.islandProfiles,valid=Array.isArray(profiles)&&profiles.length===ISLANDS.length&&profiles.every(p=>p&&typeof p.name==='string'&&p.name.length<=40&&Number.isFinite(p.size)&&p.size>0&&p.size<=1.2&&Number.isFinite(p.ore)&&p.ore>=0&&p.ore<=3&&Array.isArray(p.fert)&&p.fert.every(k=>['getreide','hopfen','trauben','gewuerz'].includes(k)));
 loadedIslandProfiles=valid?profiles:LEGACY_GENERATION_PROFILES.map(p=>({...p,size:p.size*((saved?.archipelagoVersion||1)>=2?.5:1),fert:[...p.fert].slice(0,2)}));
 generateFreshProfiles=false;try{return profileLoadGame(...args);}finally{loadedIslandProfiles=null;}
};
let newGameDialog=null,newGamePreviousSpeed=1;
function cancelNewGame(){if(!newGameDialog?.open)return;newGameDialog.close();setSpeed(newGamePreviousSpeed);}
function requestNewGame(){
 if(!newGameDialog){
  newGameDialog=document.createElement('dialog');newGameDialog.className='new-game-dialog';newGameDialog.setAttribute('aria-labelledby','new-game-title');newGameDialog.setAttribute('aria-describedby','new-game-description');
  newGameDialog.innerHTML='<h2 id="new-game-title">Neues Spiel starten?</h2><p id="new-game-description">Dein aktuelles Spiel und der lokal gespeicherte Spielstand werden ersetzt. Die neue Welt erhält zufällige Inseln, Namen und Fruchtbarkeiten.</p><div class="btns"><button type="button" class="btn" data-new-cancel autofocus>Abbrechen</button><button type="button" class="btn danger" data-new-confirm>Neues Spiel starten</button></div>';
  document.body.append(newGameDialog);
  newGameDialog.querySelector('[data-new-cancel]').addEventListener('click',cancelNewGame);
  newGameDialog.querySelector('[data-new-confirm]').addEventListener('click',()=>{newGameDialog.close();UI.unreadEvents=0;$('#toasts').replaceChildren();updateEventBadge();startNew();});
  newGameDialog.addEventListener('cancel',e=>{e.preventDefault();cancelNewGame();});
 }
 if(newGameDialog.open)return;newGamePreviousSpeed=G.speed;setSpeed(0);newGameDialog.showModal();newGameDialog.querySelector('[data-new-cancel]').focus();
}
