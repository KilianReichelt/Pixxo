"""Full-HD frame and subsystem measurements on the user's advanced demo save."""
import json
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parent.parent
destination=sys.argv[1] if len(sys.argv)>1 else 'performance-city-after.json'
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True,args=['--allow-file-access-from-files','--disable-backgrounding-occluded-windows'])
    page=browser.new_page(viewport={'width':1920,'height':1080})
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((root/'pixxo.html').as_uri());page.wait_for_function('StartScreen.ready')
    saved=(root/'Pixxo_Demo_Flussstadt.json').read_text(encoding='utf-8')
    page.evaluate('(save)=>{localStorage.setItem(SAVEKEY,save);startRender();}',saved)
    page.locator('[data-start=continue]').click();page.wait_for_function('StartScreen.started&&!StartScreen.loading')
    page.evaluate("""()=>{tutorialFinish();setSpeed(0);const homes=G.blds.filter(b=>b.type==='haus');centerOn(homes.reduce((n,b)=>n+cx(b),0)/homes.length,homes.reduce((n,b)=>n+cy(b),0)/homes.length);Object.assign(dayClock(),{minutes:720,system:false,enabled:false});UI.sel=null;UI.hover=null;setTool(null);}""")
    metadata=page.evaluate('({population:totalPop(),buildings:worldBuildings().length,roads:minimapRoadCells(G.road).size,viewport:[innerWidth,innerHeight],logicalProcessors:navigator.hardwareConcurrency})')
    measurements=page.evaluate("""()=>{
      const measure=(fn,count=40)=>{const samples=[];for(let i=0;i<count;i++){const t=performance.now();fn(i);samples.push(performance.now()-t);}samples.sort((a,b)=>a-b);return {mean:samples.reduce((a,b)=>a+b,0)/count,p95:samples[Math.floor(count*.95)],max:samples.at(-1)};};
      const functions=['drawOcean','drawLandRegion','drawRoadTile','drawDeposits','addStreetPeople','drawBld','drawBuildingWarnings','drawFieldWorkers','drawDayClouds','drawNight','drawWorldFog','bubbleFor','spName','streetPeople','minimapRoadCells','drawBeachSurf'],originals={},totals={};
      for(const name of functions){originals[name]=window[name];totals[name]={ms:0,calls:0};window[name]=function(...args){const t=performance.now();try{return originals[name](...args)}finally{totals[name].ms+=performance.now()-t;totals[name].calls++;}};}
      const zooms=[];
      try{for(const z of [1,.75,.5,.451,.4,.2,.05]){setZoom(z,innerWidth/2,innerHeight/2);render();for(const total of Object.values(totals)){total.ms=0;total.calls=0;}const renderTime=measure(()=>render());zooms.push({zoom:z,render:renderTime,subsystems:JSON.parse(JSON.stringify(totals)),entities:ENT.length});}}
      finally{for(const name of functions)window[name]=originals[name];}
      const simulation=measure(()=>stepWorld(.05),40),mini=measure(()=>drawMini(),10),top=measure(()=>renderTop(true),5);
      return {zooms,simulation,mini,top};
    }""")
    frame_results=[]
    for z in [1,.75,.5,.451,.4,.2,.05]:
        page.evaluate('(z)=>{setZoom(z,innerWidth/2,innerHeight/2);setSpeed(1)}',z)
        page.wait_for_timeout(200)
        frames=page.evaluate("""()=>new Promise(resolve=>{const samples=[],original=render;let last=null;const timer=setTimeout(()=>{render=original;resolve({timeout:true,frames:samples.length})},12000);render=function(...args){const now=performance.now();original(...args);if(last!==null)samples.push(now-last);last=now;if(samples.length>=120){render=original;clearTimeout(timer);samples.sort((a,b)=>a-b);const p95=samples[Math.floor(samples.length*.95)];resolve({p95Ms:p95,maxMs:samples.at(-1),p95Fps:1000/p95,meanFps:1000/(samples.reduce((a,b)=>a+b,0)/samples.length),frames:samples.length});}};})""")
        frames['zoom']=z;frame_results.append(frames)
    # Night lights and newly exposed terrain while moving the camera.
    for scenario in ['night','camera-pan']:
        page.evaluate('(kind)=>{setZoom(.5,innerWidth/2,innerHeight/2);dayClock().minutes=kind==="night"?0:720;setSpeed(1)}',scenario)
        extra=page.evaluate("""(kind)=>new Promise(resolve=>{const original=render,samples=[],origin={...UI.cam};let last=null;render=function(...args){const now=performance.now();if(kind==='camera-pan')UI.cam.x=origin.x+Math.sin(samples.length/25)*400;original(...args);if(last!==null)samples.push(now-last);last=now;if(samples.length>=120){render=original;UI.cam.x=origin.x;samples.sort((a,b)=>a-b);resolve({scenario:kind,p95Ms:samples[114],maxMs:samples.at(-1),meanFps:1000/(samples.reduce((a,b)=>a+b,0)/samples.length),frames:samples.length});}};})""",scenario)
        frame_results.append(extra)
    page.evaluate('dayClock().minutes=720;setSpeed(0);setZoom(.5,innerWidth/2,innerHeight/2);render()')
    page.screenshot(path=str(root/'pixxo_tests'/destination.replace('.json','.png')))
    assert not errors,errors
    result={'scene':metadata,'measurements':measurements,'frames':frame_results,'environment':'isolated headless Chrome, Full HD, device scale 1'}
    (root/'pixxo_tests'/destination).write_text(json.dumps(result,indent=2),encoding='utf-8')
    print(json.dumps({'scene':metadata,'render':[[m['zoom'],m['render']] for m in measurements['zooms']],'simulation':measurements['simulation'],'frames':frame_results},indent=2),flush=True)
    browser.close()
