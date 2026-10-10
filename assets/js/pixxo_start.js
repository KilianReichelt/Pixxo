/* Startmenü, lokale Musik und geführte Einführung. */
const PIXXO_MUSIC=[
 'Track01_Horizon Unbound.wav','Track02_Morning Over Meadows.wav',
 'Track03_The Long Road Out.wav','Track04_Whispering Plains.wav',
 'Track05_Beneath Ancient Skies.wav','Track06_River of Light.wav',
 'Track07_Fading Sunfields.wav','Track08_Where Shadows Lengthen.wav',
 'Track09_Quiet Wanderer.wav','Track10_Starlit Expanse.wav',
 'Track11_Embers of the Far Hills.wav','Track12_Return to the Horizon.wav'
];
const StartScreen={ready:false,started:false,page:'home',returnToGame:false};
const startDialog=document.createElement('dialog');
startDialog.id='pixxo-start';startDialog.setAttribute('aria-labelledby','start-title');document.body.append(startDialog);
let musicPlayer=null,musicIndex=0,musicUnlocked=false,musicPending=false,musicAwaitingGesture=false;
let tourResumeSpeed=null,mapKeyboardActive=false;
const failedMusic=new Set();
let musicQueue=[];
const MUSIC_LAST_KEY='pixxo_last_music_track';
function musicShuffle(previous=-1){
 const queue=PIXXO_MUSIC.map((_,i)=>i);
 for(let i=queue.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[queue[i],queue[j]]=[queue[j],queue[i]];}
 if(queue.length>1&&queue[0]===previous){const j=1+Math.floor(Math.random()*(queue.length-1));[queue[0],queue[j]]=[queue[j],queue[0]];}
 return queue;
}
function musicChoose(){
 if(!musicQueue.length)musicQueue=musicShuffle(musicIndex);
 let next;do{if(!musicQueue.length)musicQueue=musicShuffle(musicIndex);next=musicQueue.shift();}while(failedMusic.has(next)&&failedMusic.size<PIXXO_MUSIC.length);
 musicIndex=next;try{localStorage.setItem(MUSIC_LAST_KEY,String(next));}catch{}
}
// Stream only the current track. Native audio also works locally without CORS.
// SFX retain their independent Web Audio bus and limiter.
function musicEnsure(){
 if(musicPlayer)return;
 let previous=-1;try{const stored=localStorage.getItem(MUSIC_LAST_KEY);if(stored!==null)previous=Number(stored);}catch{}
 musicQueue=musicShuffle(previous);musicChoose();
 musicPlayer=new Audio();musicPlayer.preload='none';
 musicPlayer.addEventListener('ended',musicNext);
 musicPlayer.addEventListener('error',()=>{
  failedMusic.add(musicIndex);
  if(failedMusic.size<PIXXO_MUSIC.length)musicNext();
  else{musicPlayer.pause();musicStatus('Musik konnte nicht geladen werden. Spielgeräusche bleiben verfügbar.');}
 });
 musicPlayer.addEventListener('playing',()=>{failedMusic.clear();musicStatus();});
 musicPlayer.src='assets/music/compressed/'+encodeURIComponent(PIXXO_MUSIC[musicIndex].replace('.wav','.mp3'));
}
function musicStatus(message){
 const el=document.getElementById('start-music-status');
 if(el)el.textContent=message||(musicAwaitingGesture?'Browser wartet auf deine erste Eingabe.':'Aktueller Titel: '+PIXXO_MUSIC[musicIndex].replace(/^Track\d+_/,'').replace('.wav',''));
}
function musicNext(){
 if(!musicPlayer)return;musicPlayer.pause();
 musicChoose();
 musicPlayer.src='assets/music/compressed/'+encodeURIComponent(PIXXO_MUSIC[musicIndex].replace('.wav','.mp3'));musicStatus();musicSync();
}
function musicSync(){
 if(!musicUnlocked)return;musicEnsure();musicPlayer.volume=Sound.prefs.music*.65;
 if(document.hidden||audioChannelMuted('music')||!Sound.prefs.music){musicPlayer.pause();return;}
 if(!musicPlayer.paused||musicPending||musicAwaitingGesture||failedMusic.size===PIXXO_MUSIC.length)return;
 musicPending=true;const source=musicPlayer.src;
 musicPlayer.play().catch(error=>{
  if(error.name==='NotAllowedError'){musicAwaitingGesture=true;musicStatus();}
 }).finally(()=>{
  musicPending=false;
  if(document.hidden||audioChannelMuted('music')||!Sound.prefs.music)musicPlayer.pause();
  else if(source!==musicPlayer.src)musicSync();
 });
}
function musicUnlock(){musicUnlocked=true;musicAwaitingGesture=false;musicSync();}
document.addEventListener('pointerdown',musicUnlock,{capture:true});
document.addEventListener('keydown',musicUnlock,{capture:true});
document.addEventListener('visibilitychange',musicSync);
const startAudioLevels=audioLevels;
audioLevels=function(){startAudioLevels();musicSync();};
// Replace the synthesized music scheduler while preserving event sounds.
audioTick=function(){
 const c=Sound.ctx;if(!c||c.state!=='running'||document.hidden||!StartScreen.started||startDialog.open)return;
 // Fire audio belongs to a new, visible fire warning, never a periodic scan.
 for(const sh of WORLD.fleet){const old=Sound.seenShips.get(sh.id),state=sh.status;
  if(old&&old!==state&&['Im Hafen','Vor Anker'].includes(state))soundEffect('ship');
  if(old==='Im Bau'&&state!=='Im Bau')soundEffect('success');Sound.seenShips.set(sh.id,state);
 }
 if(G.speed>0&&c.currentTime-(Sound.last.get('production')??0)>12&&G.blds.some(b=>b.status==='Produziert'&&!b.paused))soundEffect('production');
};
function startHasSave(){
 if(StartScreen.started)return true;
 try{return pixxoSaveValid(JSON.parse(localStorage.getItem(SAVEKEY)));}catch{return false;}
}
function startRender(page='home'){
 if(page==='home')StartScreen.returnToGame=false;
 StartScreen.page=page;let content='',title='';
 if(page==='home')content='<nav class="start-actions" aria-label="Startmenü">'+
  (startHasSave()?'<button class="btn primary" data-start="continue">Spiel fortsetzen</button>':'')+
  '<button class="btn" data-start="new" '+(StartScreen.ready?'':'disabled')+'>Neues Spiel</button>'+
  '<button class="btn" data-start="settings">Einstellungen</button><button class="btn" data-start="credits">Credits</button></nav>';
 if(page==='settings'){
  title='Einstellungen';content='<div class="start-settings-grid"><section class="audio-settings"><h2>Ton</h2>';
  for(const [key,name] of AUDIO_CHANNELS){
   const value=Math.round(Sound.prefs[key]*100);
   content+='<label for="start-'+key+'-volume">'+name+' <output id="start-'+key+'-value">'+value+' %</output></label>'+
    '<input id="start-'+key+'-volume" type="range" min="0" max="100" value="'+value+'" data-start-audio="'+key+'">'+audioMuteButton(key,name);
  }
  content+='<p id="start-music-status" role="status"></p></section>'+
   '<section><h2>Spiel</h2><label class="start-motion-setting"><input type="checkbox" data-start-background '+(!sceneryUserPaused&&!sceneryReduced.matches?'checked':'')+' '+(sceneryReduced.matches?'disabled':'')+'>Bewegter Hintergrund</label>'+
  (StartScreen.started?'<button class="btn" data-start="tutorial">Tutorial neu starten</button>':'')+'</section></div>';
 }
 if(page==='credits'){
  title='Credits';content='<section><h2>Idee und Entwicklung</h2><p>Pixxo wurde von <strong>Kilian Reichelt</strong> erstellt.</p></section>'+
   '<section><h2>Spielmusik</h2><p>BGM: Open World Field BGM Series Vol.01 — Vacuous BGM</p>'+
   '<p>Alle zwölf Titel begleiten deine Partie als Hintergrundmusik.</p>'+
   '<a href="https://vacuous2409.itch.io/open-world-field-bgm-series-vol01" target="_blank" rel="noopener noreferrer">Musik von Vacuous BGM auf itch.io (neuer Tab)</a></section>';
 }
 if(page==='confirm'){
  title='Neues Spiel starten?';content='<p>Deine bisherige Partie wird durch eine neue Inselwelt ersetzt. Exportiere sie vorher im Spielmenü, wenn du sie behalten möchtest.</p>'+
   '<div class="start-actions"><button class="btn" data-start="home" autofocus>Abbrechen</button><button class="btn danger" data-start="confirm-new">Neues Spiel starten</button></div>';
 }
 startDialog.innerHTML='<div class="start-card '+(page==='settings'?'start-settings-card':'')+'"><img src="assets/pixxo-logo.svg" class="pixxo-logo" alt="Pixxo">'+
  '<h1 id="start-title" tabindex="-1">'+title+'</h1>'+content+
  (['settings','credits'].includes(page)?'<button class="btn start-back" data-start="'+(page==='settings'&&StartScreen.returnToGame?'continue':'home')+'">'+(page==='settings'&&StartScreen.returnToGame?'Spiel fortsetzen':'Zurück zum Startmenü')+'</button>':'')+'</div>';
 startDialog.prepend(startScenery);sceneryMotionUpdate();
 if(page==='settings'&&musicPlayer)musicStatus();
 if(startDialog.open)(page==='home'?startDialog.querySelector('button:not(:disabled)'):page==='confirm'?startDialog.querySelector('[autofocus]'):startDialog.querySelector('h1'))?.focus();
}
function startShow(page='home'){
 if(!startDialog.open){StartScreen.returnToGame=StartScreen.started&&page==='settings';if(StartScreen.started)saveGame();startRender(page);startDialog.showModal();}
 else startRender(page);
 document.body.classList.add('start-open');startDialog.querySelector(page==='home'?'button:not(:disabled)':'h1')?.focus();tutorialHighlightsClear();
}
function startClose(){startDialog.close();document.body.classList.remove('start-open');}
const startOriginalInit=init,startOriginalSave=saveGame,startOriginalStep=stepWorld;
saveGame=function(){if(StartScreen.started)return startOriginalSave();};
stepWorld=function(dt){if(!startDialog.open&&tutorialPanel.hidden)startOriginalStep(dt);};
const startSetSpeed=setSpeed;
setSpeed=function(speed){if(!tutorialPanel.hidden){tourResumeSpeed=speed;startSetSpeed(0);}else startSetSpeed(speed);};
init=function(){
 // Do not create or save a world until the player chooses a game.
 pixxoReceiveSaveHash();const legacy=atob('ZXdpZ2VzX2tvZW5pZ3JlaWNoX2Fubm9fdjE=');
 try{if(!localStorage.getItem(SAVEKEY)&&localStorage.getItem(legacy))localStorage.setItem(SAVEKEY,localStorage.getItem(legacy));}catch{}
 StartScreen.ready=true;startRender(StartScreen.page);pixxoLoaded();
};
function startPlay(fresh=false){
 if(!StartScreen.ready)return;startClose();musicUnlock();audioStart();
 try{
  if(!StartScreen.started){if(fresh)localStorage.removeItem(SAVEKEY);StartScreen.started=true;startOriginalInit();}
  else if(fresh){musicQueue=musicShuffle(musicIndex);musicNext();UI.unreadEvents=0;$('#toasts').replaceChildren();updateEventBadge();startNew();}
  else if(WORLD.tutorial?.version===2&&!WORLD.tutorial.done&&!WORLD.tutorial.dismissed)openTutorial();
  if(!tutorialPanel.hidden)tutorialPanel.querySelector('[data-tour="next"]')?.focus();else cv.focus();
 }catch(error){startShow();const p=document.createElement('p');p.setAttribute('role','alert');p.textContent='Die Partie konnte nicht gestartet werden. '+error.message;startDialog.querySelector('.start-card').append(p);console.error(error);}
}
startDialog.addEventListener('cancel',e=>{e.preventDefault();if(StartScreen.returnToGame&&StartScreen.page==='settings')startPlay();else if(StartScreen.page!=='home')startRender('home');});
startDialog.addEventListener('keydown',e=>{
 if(e.key==='Escape'){e.preventDefault();e.stopPropagation();if(StartScreen.returnToGame&&StartScreen.page==='settings')startPlay();else if(StartScreen.page!=='home')startRender('home');}
});
startDialog.addEventListener('click',e=>{
 const b=e.target.closest('[data-start]');if(!b||b.disabled)return;
 switch(b.dataset.start){
  case 'home':startRender();break;
  case 'continue':startPlay();break;
  case 'new':if(startHasSave())startRender('confirm');else startPlay(true);break;
  case 'confirm-new':startPlay(true);break;
  case 'tutorial':startPlay();WORLD.tutorial={version:2,step:0};openTutorial();saveGame();break;
  default:startRender(b.dataset.start);
 }
});
startDialog.addEventListener('input',e=>{
 if(e.target.matches('[data-start-background]')){scenerySetMotion(e.target.checked);return;}
 const key=e.target.dataset.startAudio;if(!AUDIO_CHANNELS.some(([k])=>k===key))return;
 Sound.prefs[key]=Number(e.target.value)/100;document.getElementById('start-'+key+'-value').textContent=e.target.value+' %';audioSave();
});
const startMenuHTML=menuHTML;
menuHTML=function(){
 let content=startMenuHTML();
 content=content.replace(/<label class="zoomlabel">[\s\S]*?<\/label>/,'');
 content=content.replace(/<details><summary>Steuerung<\/summary>[\s\S]*?<\/details>/,'');
 content=content.replace(/<div class="sect">Letzte Meldungen<\/div>[\s\S]*?(?=<div class="btns">|<div class="sect">|$)/,'');
 content=content.replace(/class="btn" data-act="new"/,'class="btn danger" data-act="new"');
 return '<div class="btns"><button class="btn primary" data-act="start-home">Startmenü</button><button class="btn" data-act="start-settings">Einstellungen</button><button class="btn" data-act="start-credits">Credits</button></div>'+content;
};
const startWinAct=winAct;
winAct=function(id,ds){
 if(ds.act==='start-home'){if(!confirm('Möchtest du wirklich zum Startmenü zurückkehren? Deine Partie wird gespeichert.'))return;startShow('home');return;}
 if(ds.act?.startsWith('start-')){startShow(ds.act.slice(6));return;}
 if(ds.act==='tutorial-open'){WORLD.tutorial={version:2,step:0};closeWin('menu');openTutorial();saveGame();return;}startWinAct(id,ds);
};
requestNewGame=function(){startShow('confirm');};
const TOUR_STEPS=[
 {title:'Beginn deiner Reise',text:'Das Kontor ist Hafen und gemeinsames Lager deiner Insel. Es ist der Ausgangspunkt für deine Straßen und Produktion.',target:'port'},
 {title:'Die Karte erkunden',text:'Ziehe die Karte um dich umzusehen. Die Minikarte hilft dir dich beser zu orientieren und hilft dir dabei, zwischen weiter entfernten Punkten zu springen.',target:'#mmw'},
 {title:'Baukategorien und Bauplätze',text:'In dieser Leiste findest du alle Baukategorien. Wähle ein Gebäude und setze es auf einen gültigen Bauplatz. Aber Achtung: Jedes GEbäude benötigt Artbeitskräfte und kostet dich laufend Unterhalt, baue also mit Bedacht.',target:'#bar',cat:'roh'},
 {title:'Holz und Bretter herstellen',text:'Zu beginn wirst du einen Holzfäller brauchen. Ein Holzfäller braucht Bäume in seiner Umgebung. Das Sägewerk verarbeitet das Holz zu Brettern.',target:'[data-b="holzfaeller"]',cat:'roh',goal:()=>['holzfaeller','saegewerk'].every(t=>G.blds.some(b=>b.type===t))},
 {title:'Straßen verbinden deine Siedlung',text:'Verbinde deine Gebäude mit Straßen untereinander und mit dem Kontor. Nur so können Waren zwischen ihnen transportiert werden.',target:'[data-tool="road"]',goal:()=>['holzfaeller','saegewerk'].every(t=>G.blds.some(b=>b.type===t&&b.conn))},
 {title:'Häuser und Marktplatz',text:'Deine ersten Siedler benötigen Waren welche sie sich auf dem Marktplatz besorgen, sorge also dafür, dass sie Zugang dazu haben.',target:'[data-cat="wohnen"]',cat:'wohnen',goal:()=>G.blds.some(b=>b.type==='markt'&&b.conn)&&G.blds.filter(b=>b.type==='haus'&&b.conn).length>=2},
 {title:'Küstengebäude',text:'Einige Gebäude, wie die Fischerhütte produziert an der Küste Nahrung und müssen daher ist Küstennähe platziert werden. ',target:'[data-b="fischer"]',cat:'roh',goal:()=>G.blds.some(b=>b.type==='fischer'&&b.conn)},
 {title:'Waren, Lager und Handel',text:'Die Warenleiste zeigt dir den Bestand deiner Insel. Im Lager siehst du deine Waren und kannst sehen, ob du gerade ausreichend Vorräte hast.',target:'[data-w="store"]',win:'store'},
 {title:'Gold und Arbeitskräfte',text:'Hier siehst du Gold und die Bilanz pro Minute. Verbrauchst du mehr Geld als du einnimmst, solltest du deine Befölkerung mit zusätzlichen Produkten versorgen - sie zalhen dann mehr Steuern. Hier kannst du außerdem ein Darlehen aufnemhen, wenn du einmal schnell Gold benötigst.',target:'[data-w="fin"]',win:'fin'},
 {title:'Aufträge und Ereignisse',text:'Aufträge geben dir eine Orientierung bei der Entwicklung deiner Insel und belohnen dich mit Gold. Darunter finden sich Ereignisse wie Feuer oder Handelsmeldungen.',target:'[data-side="quest"]',action:'quest'},
 {title:'Tempo und Tageszeit',text:'Dir geht es nicht schnell genug? Du hast die Wahl zwischen 1x, 2× und 4× Spielgeschwindigkeit.',target:'.speeds'},
 {title:'Ressourcen der Insel',text:'Manche Pflanzen wachsen nur auf bestimmten Inseln. Hier sihst du was auf deiner Insel wächst und welche Ressourcen es auf ihr gibt.',target:'#islandfacts'},
 {title:'Schiffe und Handel',text:'Sobald du die Segelschiffswerft gebaut hast, kannst du Schiffe, weitere Inseln entdecken und besiedeln. Du kannst hier außerdem Handelsrouten zwischen verschiedenen Inseln einrichten um Waren zu Importieren und Exportieren',target:'[data-w="fleet"]',win:'fleet'},
 {title:'Werkzeuge und Dekoration',text:'Du kannst Gebäude ausbauen, wenn du die Vorraussetzungen dafür erfüllst. Verbesserte Häuser können zum Beispiel mehr Bewohner beherbergen.',target:'[data-tool="upgrade"]'},
 {title:'Speichern und weiterspielen',text:'Deine Spiel wird automatisch gespeichert. Im Menü kannst du trotzdem jederzeit speichern, sowie deinen Spielstand exportieren oder importieren, dir die Einführung erneut ansehen oder Einstellungen und Credits aufrufen. Und jetzt, viel Spaß!',target:'[data-w="menu"]'}
];
const tutorialPanel=document.createElement('section');
tutorialPanel.id='pixxo-tour';tutorialPanel.hidden=true;tutorialPanel.setAttribute('role','region');tutorialPanel.setAttribute('aria-labelledby','tour-title');document.body.append(tutorialPanel);
const tutorialOutline=document.createElement('div');tutorialOutline.id='tour-outline';tutorialOutline.hidden=true;tutorialOutline.setAttribute('aria-hidden','true');document.body.append(tutorialOutline);
let tourWindow=null,tourPreviousCat=null,tourPreviousMode=null,tourIsCollapsed=false;
function tutorialHighlightsClear(){tutorialOutline.hidden=true;document.querySelectorAll('.tour-target').forEach(el=>el.classList.remove('tour-target'));}
function tutorialStep(){return TOUR_STEPS[Math.max(0,Math.min(TOUR_STEPS.length-1,WORLD?.tutorial?.step||0))];}
function tutorialCleanup(){
 tutorialHighlightsClear();if(tourWindow&&WINS[tourWindow])closeWin(tourWindow);tourWindow=null;
 if(tourPreviousMode!==null){UI.cat=tourPreviousCat;UI.barMode=tourPreviousMode;tourPreviousMode=null;renderBar();}
}
function tutorialEnter(){
 tutorialCleanup();const step=tutorialStep();
 if(step.cat){tourPreviousCat=UI.cat;tourPreviousMode=UI.barMode;UI.barMode='build';UI.cat=step.cat;renderBar();}
 if(step.win&&!WINS[step.win]){toggleWin(step.win);tourWindow=step.win;}
 if(step.action==='quest'&&UI.sidebarTab!=='quest')toggleSidebar('quest');
 tutorialRender();tutorialUpdate();
}
function tutorialRender(){
 const state=WORLD.tutorial,step=tutorialStep();tutorialPanel.classList.toggle('collapsed',tourIsCollapsed);
 tutorialPanel.innerHTML='<div class="tour-header"><span>Einführung · '+(state.step+1)+' / '+TOUR_STEPS.length+'</span>'+
  '<button class="btn" data-tour="collapse" aria-expanded="'+!tourIsCollapsed+'" aria-controls="tour-content">'+(tourIsCollapsed?'Aufklappen':'Einklappen')+'</button></div>'+
  '<div id="tour-content" '+(tourIsCollapsed?'hidden':'')+'><h2 id="tour-title" tabindex="-1">'+step.title+'</h2><p>'+step.text+'</p>'+
  (step.action==='map'?'<button class="btn" data-tour="map">Karte per Tastatur erkunden</button>':'')+
  (state.step===0?'<button class="btn" data-tour="port">Kontor zeigen</button>':'')+
  '<p id="tour-goal" role="status">'+(step.goal?(step.goal()?'✓ Ziel erreicht.':'Optional: Probiere diesen Schritt aus. Du kannst auch direkt weitergehen.'):'')+'</p></div>'+
  '<div class="tour-actions" '+(tourIsCollapsed?'hidden':'')+'><button class="btn" data-tour="back" '+(state.step===0?'disabled':'')+'>Zurück</button><button class="btn primary" data-tour="next">'+(state.step===TOUR_STEPS.length-1?'Losspielen':'Weiter')+'</button></div>'+
  '<button class="btn tour-skip" data-tour="skip">Tutorial überspringen</button>';
}
function tutorialUpdate(){
 if(tutorialPanel.hidden||!StartScreen.started||startDialog.open){tutorialHighlightsClear();return;}
 const step=tutorialStep(),target=step.target==='port'?null:document.querySelector(step.target);let r;
 if(step.target==='port'){
  const b=G.blds.find(b=>b.type==='kontor');if(b){const scale=UI.sc/UI.DR;r={left:innerWidth/2+(b.x*16-UI.cam.x)*scale,top:innerHeight/2+(b.y*16-20-UI.cam.y)*scale,width:b.w*16*scale,height:(b.h*16+20)*scale};}
 }else if(target){r=target.getBoundingClientRect();if(!target.classList.contains('tour-target')){document.querySelectorAll('.tour-target').forEach(el=>el.classList.remove('tour-target'));target.classList.add('tour-target');}}
 if(r&&r.width&&r.height&&r.left<innerWidth&&r.top<innerHeight&&r.left+r.width>0&&r.top+r.height>0){
  tutorialOutline.hidden=false;Object.assign(tutorialOutline.style,{left:Math.max(3,r.left-4)+'px',top:Math.max(3,r.top-4)+'px',width:Math.min(innerWidth-6,r.width+8)+'px',height:Math.min(innerHeight-6,r.height+8)+'px'});
 }else tutorialOutline.hidden=true;
 if(step.goal){const label=document.getElementById('tour-goal'),text=step.goal()?'✓ Ziel erreicht.':'Optional: Probiere diesen Schritt aus. Du kannst auch direkt weitergehen.';if(label&&label.textContent!==text)label.textContent=text;}
}
function tutorialFinish(done=false){
 WORLD.tutorial.done=done;WORLD.tutorial.dismissed=!done;tutorialPanel.hidden=true;tutorialCleanup();
 if(tourResumeSpeed!==null){startSetSpeed(tourResumeSpeed);tourResumeSpeed=null;}
 mapKeyboardActive=false;document.body.classList.remove('map-key-focus');saveGame();cv.focus();
}
openTutorial=function(){
 if(!StartScreen.started||startDialog.open)return;
 if(WORLD.tutorial?.version!==2)WORLD.tutorial={version:2,step:0};
 if(WORLD.tutorial.done||WORLD.tutorial.dismissed)return;
 if(tutorialPanel.hidden){tourResumeSpeed=G.speed;startSetSpeed(0);}
 tutorialPanel.hidden=false;tourIsCollapsed=false;tutorialEnter();tutorialPanel.querySelector('[data-tour="next"]')?.focus();
};
const tourStartNew=startNew;
startNew=function(...args){tutorialPanel.hidden=true;tutorialCleanup();const result=tourStartNew(...args);WORLD.tutorial={version:2,step:0};openTutorial();saveGame();return result;};
tutorialPanel.addEventListener('click',e=>{
 const action=e.target.closest('[data-tour]')?.dataset.tour;if(!action)return;
 if(action==='skip'){tutorialFinish();return;}
 if(action==='collapse'){tourIsCollapsed=!tourIsCollapsed;tutorialRender();tutorialPanel.querySelector('[data-tour="collapse"]').focus();return;}
 if(action==='map'){cv.focus();return;}
 if(action==='port'){const b=G.blds.find(b=>b.type==='kontor');if(b)centerOn(cx(b),cy(b));return;}
 if(action==='next'&&WORLD.tutorial.step===TOUR_STEPS.length-1){tutorialFinish(true);return;}
 if(action==='next'||action==='back'){WORLD.tutorial.step=Math.max(0,WORLD.tutorial.step+(action==='next'?1:-1));tutorialEnter();saveGame();tutorialPanel.querySelector('#tour-title')?.focus();}
});
setInterval(tutorialUpdate,200);
cv.tabIndex=0;
cv.setAttribute('aria-label','Spielkarte. Pfeiltasten verschieben, Plus und Minus zoomen. Enter wählt oder baut in der Kartenmitte. Bei Straßen und Betriebsflächen: Enter setzt Start und Ziel. R dreht das Bauwerkzeug, Escape beendet es.');
const mapCursor=document.createElement('div');mapCursor.id='map-key-cursor';mapCursor.setAttribute('aria-hidden','true');document.body.append(mapCursor);
const mapKeyStatus=document.createElement('p');mapKeyStatus.id='map-key-status';mapKeyStatus.className='map-key-status';mapKeyStatus.setAttribute('role','status');document.body.append(mapKeyStatus);
function mapKeyboardPosition(){
 const t=tileAt(innerWidth/2,innerHeight/2);UI.hover=t;UI.ghostT=t;
 if(constructionPlan)updateConstructionPlan(t);
 const b=INMAP(t.x,t.y)?G.byId.get(G.occ[IDX(t.x,t.y)]):null;
 mapKeyStatus.textContent='Kachel '+t.x+', '+t.y+(b?': '+bname(b):'')+(UI.tool?' · '+(UI.type?B[UI.type]?.n||UI.tool:UI.tool):'');
 updateHint();return t;
}
function mapKeyboardDeactivate(){mapKeyboardActive=false;document.body.classList.remove('map-key-focus');}
document.addEventListener('pointerdown',mapKeyboardDeactivate,{capture:true});
cv.addEventListener('pointermove',mapKeyboardDeactivate);
cv.addEventListener('wheel',mapKeyboardDeactivate,{passive:true});
document.addEventListener('keydown',e=>{if(e.key==='Tab'){mapKeyboardActive=true;if(document.activeElement===cv)document.body.classList.add('map-key-focus');}},{capture:true});
cv.addEventListener('focus',()=>{if(StartScreen.started&&mapKeyboardActive){document.body.classList.add('map-key-focus');mapKeyboardPosition();}});
cv.addEventListener('blur',()=>document.body.classList.remove('map-key-focus'));
cv.addEventListener('keydown',e=>{
 if(startDialog.open)return;const delta=(UI.tool?1:e.shiftKey?24:8)*16;
 if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Enter',' ','Escape','r','R'].includes(e.key)){mapKeyboardActive=true;document.body.classList.add('map-key-focus');}
 if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){
  e.preventDefault();if(e.key==='ArrowLeft')UI.cam.x-=delta;if(e.key==='ArrowRight')UI.cam.x+=delta;if(e.key==='ArrowUp')UI.cam.y-=delta;if(e.key==='ArrowDown')UI.cam.y+=delta;clampCam();mapKeyboardPosition();
 }else if(['+','=','-'].includes(e.key)){e.preventDefault();setZoom(UI.z*(e.key==='-'?.8:1.25),innerWidth/2,innerHeight/2);mapKeyboardPosition();}
 else if(e.key.toLowerCase()==='r'&&['build','move'].includes(UI.tool)){e.preventDefault();UI.rotation=((UI.rotation||0)+1)%4;mapKeyboardPosition();}
 else if(e.key==='Enter'||e.key===' '){
  e.preventDefault();const t=mapKeyboardPosition();
  if(['road','demo','upgrade'].includes(UI.tool)||UI.tool==='build'&&fieldRectangleEnabled()){if(constructionPlan)finishConstructionPlan();else beginConstructionPlan(t);}
  else clickTile(t);
  mapKeyboardPosition();
 }
 else if(e.key==='Escape'){e.preventDefault();cancelConstructionPlan();setTool(null);}
});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&!startDialog.open&&!e.target.closest('input,select,textarea')){
  const win=e.target.closest('.win');if(win){closeWin(win.dataset.id);return;}
  if(UI.tool){setTool(null);return;}
  if(!tutorialPanel.hidden&&tutorialPanel.contains(e.target))tutorialFinish();
 }
});
startRender();startDialog.showModal();document.body.classList.add('start-open');musicUnlock();
