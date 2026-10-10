from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True,args=['--allow-file-access-from-files'])
    page=browser.new_page(viewport={'width':1500,'height':1000})
    page.on('pageerror',lambda e:print('ERROR:',e,flush=True))
    page.goto((root/'pixxo.html').as_uri());page.wait_for_function('StartScreen.ready')
    page.locator('[data-start=new]').click();page.wait_for_function('StartScreen.started');page.evaluate('tutorialFinish();setSpeed(0)')
    print(page.evaluate("""()=>{const c=document.createElement('canvas');c.width=1450;c.height=940;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.fillStyle='#657b5e';g.fillRect(0,0,c.width,c.height);g.fillStyle='#fff';g.font='16px sans-serif';const report=[];
      for(let tier=1;tier<=4;tier++){const name='b_haus'+tier,src=HD_CATALOG.get(name)?.pixelSource||SP[name];g.fillText(name+' '+src.width+'x'+src.height,12+(tier-1)*350,22);nativeDrawImage.call(g,src,12+(tier-1)*350,30,src.width*5,src.height*5);report.push([name,src.width,src.height]);}
      let i=0;for(const id of NATIVE_GOOD_IDS){g.fillText(id,10+i*84,450);nativeDrawImage.call(g,nativeGoodArt(id),10+i*84,465,64,60);i++;}
      i=0;for(const type of CIVIC_ART_TYPES){const a=civicBuildingArt(type,0,CIVIC_PROJECTS[type]?null:null);g.fillText(type,10+(i%8)*178,560+Math.floor(i/8)*190);nativeDrawImage.call(g,a.low,10+(i%8)*178,570+Math.floor(i/8)*190,Math.min(162,a.low.width*2),Math.min(166,a.low.height*2));i++;}
      const img=document.createElement('img');img.id='native-art-inspection';img.src=c.toDataURL();Object.assign(img.style,{position:'fixed',inset:0,zIndex:999999});document.body.append(img);return report;}"""))
    page.locator('#native-art-inspection').screenshot(path=str(root/'pixxo_tests/native-art-inspection.png'))
    browser.close()
