/* Die Vorschau stammt aus einer regulären Partie und dem echten Spielrenderer. */
const startScenery=document.createElement('div');
startScenery.className='start-scenery';startScenery.setAttribute('aria-hidden','true');
const sceneryImage=document.createElement('img');
sceneryImage.src='assets/start-world.png';sceneryImage.alt='';startScenery.append(sceneryImage);
const sceneryShade=document.createElement('div');sceneryShade.className='scenery-shade';startScenery.append(sceneryShade);
const sceneryReduced=matchMedia('(prefers-reduced-motion: reduce)');
let sceneryUserPaused=false;
try{sceneryUserPaused=localStorage.getItem('pixxo-background-motion')==='paused';}catch{}
function sceneryMotionUpdate(){
 startScenery.classList.toggle('scenery-paused',sceneryUserPaused||sceneryReduced.matches);
 const input=document.querySelector('[data-start-background]');
 if(input){input.checked=!sceneryUserPaused&&!sceneryReduced.matches;input.disabled=sceneryReduced.matches;}
}
function scenerySetMotion(enabled){
 sceneryUserPaused=!enabled;
 try{localStorage.setItem('pixxo-background-motion',enabled?'moving':'paused');}catch{}
 sceneryMotionUpdate();
}
sceneryReduced.addEventListener('change',sceneryMotionUpdate);
sceneryMotionUpdate();
