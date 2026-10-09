from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(r'C:\Users\k.reichelt\Desktop\Pixxo')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
 page=browser.new_page(viewport={'width':1440,'height':1000});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto((root/'pixxo.html').as_uri());page.evaluate('G.speed=0;for(const id in WINS)closeWin(id)')
 data=page.evaluate('''()=>{
  const rows=[];
  for(const name of WORK_ART.names){const base=SP[name],images=[];for(let i=0;i<8;i++)images.push(SP[name+'_work'+i].toDataURL());
   if(new Set(images).size<3)throw Error('Zu wenig Bewegung: '+name);
   const meta=SPB[name];if(meta.W!==base.width||meta.H!==base.height)throw Error('Sprite-Metadaten falsch '+name);
   for(let r=0;r<4;r++){const key=rotatedSprite(name+'_work3',r);if(!SP[key]||!SPB[key])throw Error('Rotation fehlt')}
   rows.push({name,frames:8,unique:new Set(images).size,width:base.width,height:base.height});
  }
  const names=Object.keys(SPB).filter(k=>!k.includes('_work')&&!k.includes('_rotation'));
  if(new Set(names.map(k=>SP[k].toDataURL())).size!==names.length)throw Error('Doppelte Gebäudesprites');
  const farm={id:90008,type:'farm',tier:1,rotation:0,paused:false,fire:0,conn:true,eff:1,staffEff:1,status:'Produziert',x:10,y:10,w:3,h:3,need:{},sat:{},cov:{},pop:0,prog:0};
  G.byId.set(farm.id,farm);UI.sel=farm.id;let html=infoHTML();
  if(B.farm.cycle!==60||B.farm.out.getreide!==1||!html.includes('Grundzyklus')||!html.includes('60 Sek.'))throw Error('Grundzyklus falsch');
  farm.eff=1/6;html=infoHTML();if(!html.includes('360 Sek.'))throw Error('Aktuelle Dauer falsch');
  farm.eff=0;html=infoHTML();if(!html.includes('Produktion steht')||html.includes('6000 Sek.'))throw Error('Stillstand falsch');
  farm.eff=.5;farm.status='Produziert · Personal fehlt';if(!workshopRunning(farm))throw Error('Teilbesetzung ohne Animation');
  const active=workshopSprite(farm);farm.paused=true;if(workshopSprite(farm)!=='b_farm')throw Error('Pause animiert');
  farm.paused=false;farm.status='Rohstoffe fehlen';if(workshopSprite(farm)!=='b_farm')throw Error('Fehlende Rohstoffe animiert');
  farm.status='Produziert';const current=workshopSprite(farm);UI.vt+=100;if(workshopSprite(farm)!==current)throw Error('Spielpause läuft weiter');
  return {rows,buildingSprites:names.length,farmBase:60,farmSlow:360};
 }''')
 page.emulate_media(reduced_motion='reduce')
 assert page.evaluate("workshopSprite({type:'saegewerk',tier:1,rotation:0,conn:true,eff:1,status:'Produziert'})")=='b_saegewerk'
 page.emulate_media(reduced_motion='no-preference')
 # Vergrößerte Übersicht aller acht Arbeitsphasen auf neutralem Spieluntergrund.
 page.evaluate('''()=>{
  const canvas=document.createElement('canvas');canvas.id='spriteReview';canvas.width=1152;canvas.height=WORK_ART.names.length*112;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
  ctx.fillStyle='#25311e';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.font='16px monospace';
  WORK_ART.names.forEach((name,row)=>{ctx.fillStyle='#f1e6c8';ctx.fillText(B[name.slice(2)].n,8,row*112+22);
   for(let f=0;f<8;f++){const image=SP[name+'_work'+f];ctx.drawImage(image,180+f*118,row*112+108-image.height*1.5,image.width*1.5,image.height*1.5)}
  });document.body.append(canvas);canvas.style='position:absolute;z-index:1000;left:0;top:0;background:#25311e';
 }''')
 page.locator('#spriteReview').screenshot(path=str(root/'pixxo_tests'/'pixxo-produktionssprites-phasen.png'))
 page.evaluate("document.querySelector('#spriteReview').remove()")
 page.evaluate('''()=>{
  const port=G.blds.find(b=>b.type==='kontor'),farm=G.byId.get(90008);
  Object.assign(farm,{x:port.x-5,y:port.y-6,conn:true,paused:false,fire:0,eff:1/6,envEff:1,staffEff:1/6,staffNeeded:8,staffAssigned:8/6,envCount:30,status:'Produziert · Personal fehlt'});
  G.blds.push(farm);G.dirty=false;
  const homes=G.blds.filter(b=>b.type==='haus');homes.forEach(b=>b.pop=0);homes[0].pop=2;
  for(let y=farm.y;y<farm.y+farm.h;y++)for(let x=farm.x;x<farm.x+farm.w;x++)G.occ[IDX(x,y)]=farm.id;
  for(let x=farm.x;x<=port.x+1;x++)G.road[IDX(x,farm.y+farm.h)]=1;
  centerOn(farm.x+4,farm.y+4);UI.z=2;UI.sc=2*UI.DR;UI.sel=farm.id;openWin_info();renderTop(true);render();
 }''')
 page.screenshot(path=str(root/'pixxo_tests'/'pixxo-bauernhof-zyklus-sprites.png'))
 assert 'Grundzyklus' in page.locator('body').inner_text() and '360 Sek.' in page.locator('body').inner_text()
 page.set_viewport_size({'width':1000,'height':780});page.evaluate('resize();render()')
 page.screenshot(path=str(root/'pixxo_tests'/'pixxo-produktionssprites-1000px.png'))
 print(data,'ERRORS',errors);assert not errors
 browser.close()
