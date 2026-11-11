/* Tiergehege besitzen genau zwei Ausrichtungen; Altsaves behalten dieselbe Grundfläche. */
function enclosureRotation(rotation=0){return ((Math.trunc(Number(rotation)||0)%2)+2)%2;}
function normalizeEnclosures(){for(const g of WORLD?.islands||[])for(const b of g?.blds||[])if(b.type==='gehege')b.rotation=enclosureRotation(b.rotation);}
const enclosureLoad=loadGame;loadGame=function(...args){const result=enclosureLoad(...args);if(result)normalizeEnclosures();return result;};
const enclosureAfterWorld=afterNewWorld;afterNewWorld=function(...args){normalizeEnclosures();return enclosureAfterWorld(...args);};
const enclosureTool=setTool;setTool=function(tool,type,...args){if(tool==='move'){const b=G.byId.get(UI.moveId);if(b?.type==='gehege')b.rotation=enclosureRotation(b.rotation);}const result=enclosureTool(tool,type,...args);if(UI.type==='gehege')UI.rotation=enclosureRotation(UI.rotation);return result;};
const enclosureRelocation=startRelocation;startRelocation=function(buildings){for(const b of buildings)if(b?.type==='gehege')b.rotation=enclosureRotation(b.rotation);return enclosureRelocation(buildings);};
const enclosureRotatedSprite=rotatedSprite;rotatedSprite=function(name,rotation=0){return enclosureRotatedSprite(name,name.includes('gehege')?enclosureRotation(rotation):rotation);};
