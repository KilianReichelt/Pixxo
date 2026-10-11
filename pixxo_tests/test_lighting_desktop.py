"""Approved native lanterns, individual fire glows and soft cloud shadows."""
import base64
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True,args=['--allow-file-access-from-files'])
    page=browser.new_page(viewport={'width':1920,'height':1080})
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((root/'pixxo.html').as_uri());page.wait_for_function('StartScreen.ready')
    page.locator('[data-start=new]').click();page.wait_for_function('StartScreen.started&&!StartScreen.loading');page.evaluate('tutorialFinish();setSpeed(0)')
    print(page.evaluate(r'''()=>{
      const check=(v,m)=>{if(!v)throw Error(m)},lamp=movingLampSprite();check(lamp.width===2&&lamp.height===3,'Lantern dimensions');
      const path=[IDX(4,4),IDX(5,4)],cart={path,t:.25,col:'bretter'},e=[80,2,70,76,cart,1],loc=wagonLampPosition(e);check(loc.x===62&&loc.y===77,'Lantern not alongside wagon');
      const boat=[140,7,ambientSprite('boat',1,0,3),110,120],stern=boatLampPosition(boat);check(stern.x===110&&stern.y===130,'Boat stern attachment');
      const house={id:45,type:'haus',tier:2,w:2,h:2,x:12,y:5,rotation:0,visualVariant:0,island:activeIsland,fire:20,pop:10},pulses=[0,1,2].map(i=>fireLightPulse(house,i,1));check(new Set(pulses).size===3,'Synchronized fire lights');check(fireLightPulse(house,0,2)!==pulses[0],'No flicker');
      const oldBuildings=worldBuildings,oldTime=G.time,oldClock={...dayClock()},oldReduced=StartPrefs.reducedMotion,oldEntities=ENT.slice();
      try{
        worldBuildings=()=>[house];ENT.length=0;ENT.push(e,boat);dayClock().system=false;dayClock().minutes=0;
        const canvas=document.createElement('canvas');canvas.width=320;canvas.height=180;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#657b4b';c.fillRect(0,0,320,180);c.fillStyle='#786b55';c.fillRect(0,74,160,18);c.fillStyle='#376d79';c.fillRect(0,110,165,70);drawWagon(c,70,76,cart);c.drawImage(SP[boat[2]],110,120);drawBld(c,house);drawNight(c,0,0,320,180);
        window.liveLights=canvas.toDataURL();check(MOVING_LIGHTS.glows.size===2,'Unbounded glow cache');
        const snapshot=canvas.toDataURL(),dayCanvas=document.createElement('canvas');dayCanvas.width=dayCanvas.height=512;const dc=dayCanvas.getContext('2d');dc.fillStyle='#657b4b';dc.fillRect(0,0,512,512);const before=dayCanvas.toDataURL();drawMovingNightLights(dc,0,0,512,512);check(dayCanvas.toDataURL()!==before,'Night lights absent');
        dayClock().minutes=720;dc.clearRect(0,0,512,512);const clear=dayCanvas.toDataURL();drawMovingNightLights(dc,0,0,512,512);check(dayCanvas.toDataURL()===clear,'Lights during day');
        const clouds=time=>{G.time=time;const a=document.createElement('canvas');a.width=1024;a.height=768;const c=a.getContext('2d');c.fillStyle='#76884e';c.fillRect(0,0,a.width,a.height);drawDayClouds(c,0,0,a.width,a.height);return a.toDataURL();};
        StartPrefs.reducedMotion=false;const first=clouds(0),second=clouds(120);check(first!==second,'Clouds do not drift');window.dayCloudPreview=second;
        StartPrefs.reducedMotion=true;check(clouds(10)===clouds(300),'Reduced-motion clouds move');check(fireLightPulse(house,0,1)===fireLightPulse(house,2,200),'Reduced-motion fire flickers');
        const data=dayCloudSprite().getContext('2d').getImageData(0,0,512,512).data;let min=255,max=0,soft=false;for(let i=3;i<data.length;i+=4){min=Math.min(min,data[i]);max=Math.max(max,data[i]);if(data[i]>0&&data[i]<100)soft=true;}check(min===0&&max>100&&soft,'Cloud edges not soft');
      }finally{worldBuildings=oldBuildings;G.time=oldTime;Object.assign(dayClock(),oldClock);StartPrefs.reducedMotion=oldReduced;ENT.length=0;ENT.push(...oldEntities);}
      return {lantern:'2x3',independentFlames:3,clouds:'multiple sizes, soft edges, reduced motion'};
    }'''))
    for filename,var in [('night-lights-live.png','liveLights'),('day-cloud-shadows.png','dayCloudPreview')]:
        (root/'pixxo_tests'/filename).write_bytes(base64.b64decode(page.evaluate(var).split(',')[1]))
    page.goto((root/'pixxo_tests/night-lanterns-preview.html').as_uri());page.wait_for_selector('#preview')
    first=page.locator('#preview').get_attribute('src');page.wait_for_function('document.querySelector("#preview").src!=='+repr(first))
    page.locator('#toggle').click();paused=page.locator('#preview').get_attribute('src');page.wait_for_timeout(350);assert paused==page.locator('#preview').get_attribute('src')
    assert not errors,errors
    browser.close();print('PASS: native lantern placement, independent fire lighting, cached shadows, daytime/nighttime and pause/reduced motion.')
