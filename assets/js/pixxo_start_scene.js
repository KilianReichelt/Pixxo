/* One stationary scene is selected once per page start. */
const START_SCENES=['assets/start-world.png','assets/start-world-harbor.png','assets/start-world-citizens.png','assets/start-world-aristocrats.png'];
const startSceneIndex=Math.floor(Math.random()*START_SCENES.length);
const startScenery=document.createElement('div');startScenery.className='start-scenery scenery-paused';startScenery.setAttribute('aria-hidden','true');
const sceneryImage=document.createElement('img');sceneryImage.src=START_SCENES[startSceneIndex];sceneryImage.alt='';startScenery.append(sceneryImage);
const sceneryShade=document.createElement('div');sceneryShade.className='scenery-shade';startScenery.append(sceneryShade);
const sceneryReduced=matchMedia('(prefers-reduced-motion: reduce)');
const sceneryUserPaused=true;
function sceneryMotionUpdate(){startScenery.classList.add('scenery-paused');}
function scenerySetMotion(){sceneryMotionUpdate();}
