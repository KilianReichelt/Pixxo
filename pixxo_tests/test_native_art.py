"""Native sprite dimensions, house ground contact, windows and static previews."""
import base64
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
      for(const good of GOODS){const source=HD_CATALOG.get(good.id)?.pixelSource;check(source&&source.width<=16&&source.height<=16,'Oversized good '+good.id);}
      for(const id of NATIVE_GOOD_IDS){const a=nativeGoodArt(id);check(a.width===16&&a.height===16,'Native good dimensions '+id);}
      const portrait=HD_CATALOG.get('i_t4').pixelSource,pixels=portrait.getContext('2d').getImageData(0,0,16,16).data;
      check(portrait.width===16&&portrait.height===16,'Aristocrat portrait dimensions');
      for(let i=3;i<pixels.length;i+=4)check(pixels[i]===0||pixels[i]===255,'Portrait not hard-edged');
      check(url('i_t4')!==url('i_t3'),'Patrician and aristocrat portraits must differ');
      const tooLarge=document.createElement('canvas');tooLarge.width=17;tooLarge.height=16;let rejected=false;
      try{publishPixel('schnaps',tooLarge,17,16);}catch(e){rejected=true;}check(rejected,'Icon dimensions not enforced');
      for(let variant=0;variant<4;variant++){
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
    page.emulate_media(reduced_motion='reduce')
    houses=page.evaluate("""()=>{
      const a=document.createElement('canvas');a.width=1000;a.height=960;const c=a.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#657b5e';c.fillRect(0,0,a.width,a.height);c.font='14px sans-serif';
      const native=new Map();
      for(const tier of [3,4])for(let v=0;v<4;v++)for(let rotation=0;rotation<4;rotation++){
        const b={id:12+tier,island:activeIsland,type:'haus',tier,w:3,h:3,rotation,visualVariant:v},n=buildingPreviewSprite(b),source=HD_CATALOG.get(n).pixelSource,world=HD_CATALOG.get(spName(b)).pixelSource;
        if(source.width!==48||source.height!==48||source.toDataURL()!==world.toDataURL())throw Error('Preview/world mismatch '+[tier,v,rotation]);
        const pixels=source.getContext('2d').getImageData(0,0,48,48).data;
        for(let i=3;i<pixels.length;i+=4)if(pixels[i]!==0&&pixels[i]!==255)throw Error('Soft house edge');
        if(!rotation)native.set(tier+':'+v,pixels);
        const windows=nightWindows(n),state=nightWindowState(windows,b);
        if(windows.lights.length<4||!state.lights.length||state.lights.length>=windows.lights.length)throw Error('Incomplete night windows '+[tier,v,rotation]);
        const x=((tier-3)*4+v)*125+10,y=rotation*240;c.fillStyle='#fff';c.fillText((tier===3?'P':'A')+' '+(v+1)+' / '+rotation*90+'°',x,y+18);
        nativeDrawImage.call(c,source,x,y+28,96,96);c.fillStyle='#303e45';c.fillRect(x-2,y+130,100,100);nativeDrawImage.call(c,source,x,y+132,96,96);nativeDrawImage.call(c,state.mask,x,y+132,96,96);
      }
      // Compare every cross-tier pair, including different variants. Catch a
      // regression to the old shared facade with only a shifted roof line.
      for(let p=0;p<4;p++)for(let n=0;n<4;n++){
        const left=native.get('3:'+p),right=native.get('4:'+n);let occupied=0,different=0;
        for(let i=0;i<left.length;i+=4)if(left[i+3]||right[i+3]){occupied++;if(left.slice(i,i+4).some((v,k)=>v!==right[i+k]))different++;}
        if(different/occupied<.5)throw Error('House tiers visually too similar '+[p,n]);
      }
      return a.toDataURL();
    }""")
    (root/'pixxo_tests/house-tier-directions-night.png').write_bytes(base64.b64decode(houses.split(',')[1]))
    goods=page.evaluate("""()=>{const a=document.createElement('canvas');a.width=800;a.height=550;const c=a.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#657b5e';c.fillRect(0,0,a.width,a.height);c.font='16px sans-serif';const entries=[...GOODS.map(g=>({id:g.id,n:g.n})),{id:'i_t4',n:'Aristokraten'}];entries.forEach((g,i)=>{const x=i%8*100+12,y=Math.floor(i/8)*90+22,source=HD_CATALOG.get(g.id).pixelSource;c.fillStyle='#fff';c.fillText(g.n,x,y-5,88);nativeDrawImage.call(c,source,x,y,64,64);});return a.toDataURL()}""")
    (root/'pixxo_tests/native-goods-grid.png').write_bytes(base64.b64decode(goods.split(',')[1]))
    assert not errors,errors
    browser.close()
