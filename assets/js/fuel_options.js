/* Optional citizen-era fuel recipe; old wood inputs and saves stay valid. */
const COAL_CONVERTIBLE=new Set(['schmelze','schmiede']);
function coalRecipeAvailable(){return cityGoodUnlocked('kohle')&&(cityState().peaks[2]||0)>=1;}
const fuelDefinition=def;def=function(b){const d=fuelDefinition(b);if(!COAL_CONVERTIBLE.has(b.type)||b.fuelMode!=='coal')return d;const input={...d.in,kohle:1};delete input.holz;return {...d,in:input};};
function setFuelRecipe(b,mode){if(!b||!COAL_CONVERTIBLE.has(b.type)||!['wood','coal'].includes(mode)||mode==='coal'&&!coalRecipeAvailable())return false;if(b.prog>1e-8)b.pendingFuelMode=mode;else{b.fuelMode=mode;delete b.pendingFuelMode;}G.logisticsClock=2;return true;}
const fuelStep=step;step=function(dt){const pending=G.blds.filter(b=>b.pendingFuelMode).map(b=>[b,b.prog]);const r=fuelStep(dt);for(const [b,before] of pending)if(b.prog<before||b.prog<=1e-8){b.fuelMode=b.pendingFuelMode;delete b.pendingFuelMode;G.logisticsClock=2;}return r;};
const fuelInfo=infoHTML;infoHTML=function(...args){let html=fuelInfo(...args),b=G.byId.get(UI.sel);if(html&&b&&COAL_CONVERTIBLE.has(b.type)&&coalRecipeAvailable())html+='<section><h3>Brennstoff</h3><p>'+esc(b.fuelMode==='coal'?'Kohle: 1 pro Zyklus.':'Bestehendes Holzrezept.')+(b.pendingFuelMode?' Wechsel zu '+(b.pendingFuelMode==='coal'?'Kohle':'Holz')+' nach dem laufenden Zyklus.':'')+'</p><button type="button" class="btn" data-act="fuel-switch" data-mode="'+((b.pendingFuelMode||b.fuelMode)==='coal'?'wood':'coal')+'">'+((b.pendingFuelMode||b.fuelMode)==='coal'?'Holzrezept verwenden':'Auf Kohle umstellen')+'</button></section>';return html;};
const fuelAction=winAct;winAct=function(id,ds){if(ds.act==='fuel-switch'){const b=G.byId.get(UI.sel);if(setFuelRecipe(b,ds.mode)){if(WINS[id]){WINS[id].hold=false;refreshWin(WINS[id]);}saveGame();}return;}return fuelAction(id,ds);};
const fuelPack=packIsland;packIsland=function(g){const saved=fuelPack(g);for(const b of saved.blds){const live=g.byId.get(b.id);if(COAL_CONVERTIBLE.has(b.type)){b.fuelMode=live.fuelMode||'wood';if(live.pendingFuelMode)b.pendingFuelMode=live.pendingFuelMode;}}return saved;};

NEED_BUILD_GATES.kohlemine=[[6,3,1]];
