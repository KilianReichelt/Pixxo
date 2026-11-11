/* Three fixed desktop panels share the game's existing surface and contour system. */
function updateTopNavigationIcons(){
 const entries={fleet:['i_ship','Schiffe & Routen'],store:['i_lager','Lager'],diplomacy:['i_quest','Diplomatie'],menu:['i_menu','Spielmenü']};
 for(const button of document.querySelectorAll('#top .top-navigation button')){
  const entry=entries[button.dataset.w];if(!entry)continue;
  const [icon,label]=entry,html=icon?ic(icon,1.5):'<span class="navigation-gear" aria-hidden="true">⚙</span>';
  if(button._navigationIconHTML!==html){button.innerHTML=html;button._navigationIconHTML=html;}
  button.dataset.gameTooltip=label;button.setAttribute('aria-label',label);
 }
}
const SPEED_ICON_BOUNDS=new WeakMap();
function speedIconHTML(key){
 const sprite=SP[key];if(!sprite)return '';let bounds=SPEED_ICON_BOUNDS.get(sprite);if(!bounds){const source=PERF_PIXEL_IMAGES.get(sprite)||HD_CATALOG.get(key)?.pixelSource||sprite,data=source.getContext('2d').getImageData(0,0,source.width,source.height).data;let left=source.width,top=source.height,right=0,bottom=0;for(let y=0;y<source.height;y++)for(let x=0;x<source.width;x++)if(data[(y*source.width+x)*4+3]>32){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}bounds={left,top,w:right-left+1,h:bottom-top+1,width:source.width,height:source.height};SPEED_ICON_BOUNDS.set(sprite,bounds);}
 const scale=20/Math.max(1,bounds.h);return '<span class="speed-glyph" data-speed-icon="'+key+'" style="width:'+Math.ceil(bounds.w*scale)+'px;height:20px"><img class="px" alt="" src="'+url(key)+'" style="width:'+bounds.width*scale+'px!important;height:'+bounds.height*scale+'px!important;left:'+(-bounds.left*scale)+'px;top:'+(-bounds.top*scale)+'px"></span>';
}
function updateSpeedIcons(top){for(const button of top.querySelectorAll('.speeds button')){const label=button.getAttribute('aria-label'),key=label==='Fortsetzen'?'i_play':label==='Pause'?'i_pause':({1:'i_play',2:'i_ff',4:'i_fff'})[button.dataset.spd];if(!key)continue;const html=speedIconHTML(key);if(button._speedIconHTML!==html){button.innerHTML=html;button._speedIconHTML=html;}}}
function cityStageProgress(g=G){
 const state=cityState(g);if(state.level>=CITY_LEVELS.length)return 1;
 const tiers=[0,0,0,0,0],states=cityOwnerStates(g);let started=false;
 for(const s of states)for(const b of s.blds){if(b.type!=='kontor'&&B[b.type]?.kind!=='field')started=true;if(b.type==='haus')tiers[b.tier]+=Math.max(0,Math.floor(b.pop||0));}
 const total=tiers.reduce((a,b)=>a+b,0),next=state.level+1;
 const ratios={1:[Number(started)],2:[tiers[1]/20],3:[tiers[1]/40],4:[tiers[2]],5:[tiers[2]/120],6:[tiers[3]],7:[tiers[4]],8:[total/1000,tiers[4]/250],9:[total/2000,states.length/5],10:[total/3000,tiers[4]/500]};
 return Math.max(0,Math.min(1,...ratios[next]));
}
function loanRepaymentProgress(){const loan=WORLD?.loan;return loan?Math.max(0,Math.min(1,1-loan.balance/(loan.totalRepayment||loan.principal*1.1))):null;}
function loanProgressTooltip(){const loan=WORLD.loan,total=loan.totalRepayment||loan.principal*1.1,paid=Math.max(0,total-loan.balance),number=n=>Number(n).toLocaleString('de-DE',{maximumFractionDigits:1});return 'Darlehen: '+number(loan.principal)+' Gold\nGetilgt: '+Math.round(loanRepaymentProgress()*100)+' % · '+number(paid)+' / '+number(total)+' Gold\nRestschuld: '+number(loan.balance)+' Gold\nRate: '+number(loan.rate)+' Gold / Min.\nRestlaufzeit: ca. '+number(Math.ceil(loan.remaining/60))+' Min.';}
function updateTopPanels(){
 const top=$('#top');if(!top||!WORLD)return;
 if(!top.querySelector('.top-panel')){
  const panel=(name,label,nodes)=>{const el=document.createElement('div');el.className='top-panel top-panel-'+name;el.setAttribute('role','group');el.setAttribute('aria-label',label);for(const node of nodes)if(node)el.append(node);top.append(el);return el;};
  panel('left','Finanzen und Bevölkerung',[top.querySelector('.top-economy')]);
  panel('center','Waren',[top.querySelector('#goodsbar')]);
  panel('right','Spielsteuerung',[top.querySelector('.top-knowledge'),top.querySelector('.top-speed'),top.querySelector('.top-navigation')]);
  const location=top.querySelector('.top-location');if(location)top.append(location);
 }
 const name=top.querySelector('.worldname');if(name){
  let progress=name.querySelector('.city-stage-progress');if(!progress){progress=document.createElement('span');progress.className='city-stage-progress';progress.setAttribute('role','progressbar');progress.setAttribute('aria-label','Fortschritt zur nächsten Stadtstufe');progress.setAttribute('aria-valuemin','0');progress.setAttribute('aria-valuemax','100');name.append(progress);}
  const value=Math.round(cityStageProgress(WORLD.islands[UI.viewedIsland??activeIsland]||G)*100);progress.style.setProperty('--stage-progress',value+'%');progress.setAttribute('aria-valuenow',value);progress.setAttribute('aria-valuetext',sessionCityProgressHint(WORLD.islands[UI.viewedIsland??activeIsland]||G));
  const viewed=WORLD.islands[UI.viewedIsland??activeIsland];progress.hidden=!viewed||!!viewed.cpu;
 }
 const gold=top.querySelector('.chip.gold');if(gold){
  let line=top.querySelector('.loan-progress');const value=loanRepaymentProgress();
  if(value===null)line?.remove();else{if(!line){line=document.createElement('span');line.className='loan-progress';line.setAttribute('role','progressbar');line.setAttribute('aria-label','Darlehen getilgt');line.setAttribute('aria-valuemin','0');line.setAttribute('aria-valuemax','100');top.append(line);}line.style.setProperty('--loan-progress',value*100+'%');line.dataset.gameTooltip=loanProgressTooltip();line.setAttribute('aria-valuenow',Math.round(value*100));}
 }
 updateTopNavigationIcons();updateSpeedIcons(top);positionLoanProgress();document.documentElement.style.setProperty('--topH',top.offsetHeight+'px');
}
function positionLoanProgress(){const top=$('#top'),gold=top?.querySelector('.chip.gold'),line=top?.querySelector(':scope>.loan-progress'),panel=top?.querySelector('.top-panel-left');if(!line||!gold||!panel)return;const box=top.getBoundingClientRect(),chip=gold.getBoundingClientRect(),edge=panel.getBoundingClientRect();line.style.top=(edge.bottom-box.top+4)+'px';line.style.setProperty('--loan-center',(chip.left-box.left+chip.width/2)+'px');line.style.setProperty('--loan-width',Math.max(24,chip.width-12)+'px');}
addEventListener('resize',positionLoanProgress);
const panelsRenderTop=renderTop;renderTop=function(...args){const r=panelsRenderTop(...args);updateTopPanels();return r;};
