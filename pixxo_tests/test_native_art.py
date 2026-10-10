"""Native sprite dimensions, house ground contact, windows and static previews."""
from pathlib import Path
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True,args=['--allow-file-access-from-files'])
    page=browser.new_page(viewport={'width':1440,'height':1000})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((root/'pixxo.html').as_uri());page.wait_for_function('StartScreen.ready')
    page.locator('[data-start=new]').click();page.wait_for_function('StartScreen.started')
    page.evaluate('tutorialFinish();setSpeed(0)')
    print(page.evaluate("""()=>{
      const check=(ok,text)=>{if(!ok)throw Error(text);};
      for(const good of GOODS){const source=HD_CATALOG.get(good.id)?.pixelSource;check(source&&source.width<=16&&source.height<=15,'Oversized good '+good.id);}
      for(const id of NATIVE_GOOD_IDS){const a=nativeGoodArt(id);check(a.width===16&&a.height===15,'Native good dimensions '+id);}
      const tooLarge=document.createElement('canvas');tooLarge.width=17;tooLarge.height=15;let rejected=false;
      try{publishPixel('schnaps',tooLarge,17,15);}catch(e){rejected=true;}check(rejected,'Icon dimensions not enforced');
      for(let variant=0;variant<3;variant++){
        const a=nativeCivicArt('haus4',0,variant),pixels=a.low.getContext('2d').getImageData(0,0,48,48).data;
        check(a.low.width===48&&a.low.height===48&&a.meta.ex===0,'House dimensions');
        check(pixels[(46*48+24)*4+3]===255,'Missing ground contact at front door');
        for(let i=3;i<pixels.length;i+=4)check(pixels[i]===0||pixels[i]===255,'House not hard-edged pixel art');
      }
      const c=document.createElement('canvas');c.width=1000;c.height=720;const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.fillStyle='#657b5e';ctx.fillRect(0,0,1000,720);ctx.font='16px sans-serif';ctx.fillStyle='#fff';
      const combinations=new Set();let paneCount=0;
      for(let tier=1;tier<=4;tier++)for(let rotation=0;rotation<4;rotation++){
        const b={id:10+tier,island:activeIsland,type:'haus',tier,w:3,h:3,rotation,visualVariant:0},name=buildingPreviewSprite(b),windows=nightWindows(name),state=nightWindowState(windows,b);
        check(windows.lights.length>=2,'No complete windows '+[tier,rotation]);
        check(state.lights.length>0&&state.lights.length<windows.lights.length,'No occupied/unoccupied windows '+[tier,rotation]);
        check(state.lights.every(p=>p.pixels.length>=4),'Single-pixel light '+[tier,rotation]);paneCount+=state.lights.length;
        const x=(tier-1)*250+15,y=rotation*175+25,s=SP[name];ctx.fillText('Stufe '+tier+' / '+rotation*90+'°',x,y-7);nativeDrawImage.call(ctx,s,x,y,s.width*2,s.height*2);nativeDrawImage.call(ctx,state.mask,x,y,s.width*2,s.height*2);
      }
      const home={type:'haus',tier:4,island:activeIsland,rotation:0,visualVariant:0};
      for(let id=1;id<=12;id++){home.id=id;const windows=nightWindows(buildingPreviewSprite(home));combinations.add(nightWindowState(windows,home).lights.map(p=>p.x+':'+p.y).join(','));}
      check(combinations.size>=3,'House window selection not varied');
      const oldTime=G.time;for(const type of ['haus',...CIVIC_ART_TYPES]){
        const b={id:999,type,tier:4,island:activeIsland,w:B[type].w,h:B[type].h,rotation:0,conn:true,status:'Produziert',fire:0,project:CIVIC_PROJECTS[type]?{stage:1,active:true,progress:.4,workers:20}:undefined};
        G.time=1;const first=url(buildingPreviewSprite(b));G.time=13;check(first===url(buildingPreviewSprite(b)),'Animated window preview '+type);
      }G.time=oldTime;
      check(B.garten.n==='Garten'&&SVCN.garten==='Garten','Garden not renamed');
      const img=document.createElement('img');img.id='native-window-test';img.src=c.toDataURL();Object.assign(img.style,{position:'fixed',inset:0,zIndex:999999});document.body.append(img);
      return {goods:GOODS.length,houseRotations:16,completeLitWindows:paneCount,windowSelections:combinations.size,staticPreviews:true};
    }"""))
    page.locator('#native-window-test').screenshot(path=str(root/'pixxo_tests/native-house-windows.png'))
    assert not errors,errors
    browser.close()
