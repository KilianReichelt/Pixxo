/* Eigene Inselnamen bleiben auch nach dem Laden des Spielstands erhalten. */
const defaultIslandNames=ISLANDS.map(m=>m.name),namedResetWorld=resetWorld;
resetWorld=function(...args){ISLANDS.forEach((m,i)=>{m.name=m.generatedName||defaultIslandNames[i];delete m.customName;});return namedResetWorld(...args);};
const namedIslandName=islandName;
islandName=function(i){return WORLD?.fog&&!WORLD.fog.islands[i]?namedIslandName(i):ISLANDS[i]?.customName||ISLANDS[i]?.generatedName||namedIslandName(i);};
const namedIslandHTML=islandHTML;
islandHTML=function(i){
 const html=namedIslandHTML(i);if(WORLD?.fog&&!WORLD.fog.islands[i])return html;
 return `<form class="island-rename" data-island-rename="${i}"><label for="island-name-${i}">Inselname</label><input id="island-name-${i}" name="islandName" value="${attr(ISLANDS[i].name)}" maxlength="40" required autocomplete="off"><button type="submit" class="btn">Name speichern</button><p role="status" class="island-name-status"></p></form>`+html;
};
function renameIsland(i,value){
 const name=String(value).trim();if(!ISLANDS[i]||!name||name.length>40||WORLD?.fog&&!WORLD.fog.islands[i])return false;
 ISLANDS[i].name=name;ISLANDS[i].customName=name;
 const w=WINS.island;if(w){w.title.textContent=islandName(i);w.el.setAttribute('aria-label',islandName(i));}
 const hold=w?.hold;if(w)w.hold=true;
 renderTop(true);renderIslandFacts();refreshWins();if(w)w.hold=hold;saveGame();return true;
}
$('#wins').addEventListener('submit',e=>{
 const form=e.target;if(!form.matches('[data-island-rename]'))return;e.preventDefault();
 const input=form.elements.islandName,i=+form.dataset.islandRename;
 if(!renameIsland(i,input.value)){input.setCustomValidity('Gib einen Inselnamen mit 1 bis 40 Zeichen ein.');input.reportValidity();return;}
 input.value=ISLANDS[i].name;form.querySelector('.island-name-status').textContent='Inselname gespeichert.';
});
$('#wins').addEventListener('input',e=>{if(e.target.closest('[data-island-rename]'))e.target.setCustomValidity('');});
