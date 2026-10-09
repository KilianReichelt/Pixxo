/* Neue Kartengeneration; bestehende Spielstände behalten ihre Geometrie. */
let ARCHIPELAGO_VERSION=2;
const ORIGINAL_ISLAND_SIZES=ISLANDS.map(m=>m.size);
function applyArchipelagoVersion(version){ARCHIPELAGO_VERSION=version>=2?2:1;ISLANDS.forEach((m,i)=>m.size=ORIGINAL_ISLAND_SIZES[i]*(ARCHIPELAGO_VERSION>=2?.5:1));}
applyArchipelagoVersion(2);
const archipelagoLoadGame=loadGame;loadGame=function(){
 let saved;try{saved=JSON.parse(localStorage.getItem(SAVEKEY));}catch{}
 applyArchipelagoVersion(saved?.archipelagoVersion||1);return archipelagoLoadGame();
};
const archipelagoStartNew=startNew;startNew=function(){applyArchipelagoVersion(2);archipelagoStartNew();};
const archipelagoIslandHTML=islandHTML;islandHTML=function(i){
 const size=ISLANDS[i].size/(ARCHIPELAGO_VERSION>=2?.5:1),label=size>=1?'Groß':size>=.75?'Mittel':size>=.5?'Klein':'Sehr klein';
 return archipelagoIslandHTML(i).replace(/^<p>[^<]*<\/p>/,`<p>${label}</p>`);
};
