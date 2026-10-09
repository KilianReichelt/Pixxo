startNew();for(const id of Object.keys(WINS))closeWin(id);G.speed=0;G.gold=100000;for(const g of GOODS)G.stock[g.id]=100;G.quests.u_farm=true;G.quests.u_schaefer=true;
const port=G.blds.find(b=>b.type==='kontor'),candidates=[];
for(let y=port.y-40;y<port.y+40;y++)for(let x=port.x-40;x<port.x+40;x++)if(canPlace('farm',x,y).ok)candidates.push({x,y,d:Math.hypot(x-port.x,y-port.y)});
candidates.sort((a,b)=>a.d-b.d);const site=candidates[0];const farm=place('farm',site.x,site.y).b;UI.fieldOwner=farm.id;
for(let count=0;count<40;count++){const sites=[];for(let y=farm.y-10;y<farm.y+10;y++)for(let x=farm.x-10;x<farm.x+10;x++)if(canPlace('acker',x,y).ok)sites.push({x,y,d:Math.hypot(x-farm.x,y-farm.y)});sites.sort((a,b)=>a.d-b.d);if(sites.length)place('acker',sites[0].x,sites[0].y);}
for(let y=port.y-16;y<port.y+16;y++)for(let x=port.x-16;x<port.x+16;x++)if((y%5===0||x%8===0)&&!G.occ[IDX(x,y)])placeRoad(x,y);
rebuildNet();afterNewWorld();centerOn(cx(farm),cy(farm));UI.z=2;UI.sc=2*UI.DR;UI.sel=farm.id;openWin_info();renderTop(true);render();
const audit={factItems:Array.from(document.querySelectorAll('.factitem')).map(el=>{const r=el.getBoundingClientRect(),img=el.querySelector('img').getBoundingClientRect();return {width:r.width,height:r.height,iconWidth:img.width,iconHeight:img.height};}),fontViolations:[],smallTargets:[],unlabeledButtons:[],focus:[],viewport:{width:innerWidth,height:innerHeight}};
for(const el of document.querySelectorAll('button,input,select,th,td,p,h2,h3,.small,.tag,.sect')){const r=el.getBoundingClientRect(),css=getComputedStyle(el);if(r.width<=0||r.height<=0||css.visibility==='hidden'||css.display==='none')continue;const text=el.textContent.trim();if(text&&parseFloat(css.fontSize)<parseFloat(getComputedStyle(document.documentElement).fontSize)*.875)audit.fontViolations.push({text:text.slice(0,70),size:css.fontSize});if(el.tagName==='BUTTON'&&(r.width<44||r.height<44))audit.smallTargets.push({text:text.slice(0,70),width:r.width,height:r.height});if(el.tagName==='BUTTON'&&!text&&!el.getAttribute('aria-label')&&!el.getAttribute('title'))audit.unlabeledButtons.push(el.outerHTML.slice(0,200));}
for(const button of document.querySelectorAll('[data-act="fields"],[data-act="field-sites"]'))if(!button.disabled){button.focus();const css=getComputedStyle(button);audit.focus.push({text:button.textContent,focused:document.activeElement===button,outline:css.outlineStyle,width:css.outlineWidth});}
const result=document.createElement('script');result.type='application/json';result.id='ui-audit';result.textContent=JSON.stringify(audit);document.body.append(result);



