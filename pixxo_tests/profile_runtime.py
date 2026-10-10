"""Repeatable runtime CPU measurements in an isolated Chrome profile."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parent.parent
label=os.environ.get('PIXXO_PROFILE_LABEL','before')
duration=int(os.environ.get('PIXXO_PROFILE_SECONDS','30'))
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True,args=['--allow-file-access-from-files','--disable-background-timer-throttling'])
    page=browser.new_page(viewport={'width':1440,'height':1000})
    page.goto((root/'pixxo.html').as_uri());page.wait_for_function('StartScreen.ready')
    page.evaluate('(save)=>{localStorage.setItem(SAVEKEY,save);startRender();}',(root/'Pixxo_Demo_Flussstadt.json').read_text(encoding='utf-8'))
    page.locator('[data-start=continue]').click();page.wait_for_function('StartScreen.started&&!StartScreen.loading')
    page.evaluate("""()=>{tutorialFinish();setSpeed(4);WORLD.dayClock={minutes:1320,enabled:false,system:false};const m=ISLANDS[activeIsland];setZoom(1.1,innerWidth/2,innerHeight/2);centerOn(m.wx,m.wy);UI.cat='veredel';renderItems(true);const b=G.blds.find(b=>b.type==='betonwerk');selectB(b.id);
      window.runtimeStats={calls:{},frames:[],longTasks:[]};new PerformanceObserver(list=>runtimeStats.longTasks.push(...list.getEntries().map(e=>({ms:e.duration,start:e.startTime})))).observe({type:'longtask',buffered:false});
      const names=['stepWorld','step','render','drawMini','renderTop','renderItems','refreshWins','saveGame','rebuildNet','plannedRoadPath','assignWorkforce','requestLogistics','deliveryPath','civicRequestProjects','civicStepProjects','drawNight','nightWindows','drawDayClouds','publishPixel','spName','worldBuildings','canPlace','cpuBuild'];
      for(const name of names){const fn=window[name];if(typeof fn!=='function')continue;runtimeStats.calls[name]={count:0,total:0,max:0,slow:0};window[name]=function(...args){const start=performance.now();try{return fn.apply(this,args);}finally{const ms=performance.now()-start,s=runtimeStats.calls[name];s.count++;s.total+=ms;s.max=Math.max(s.max,ms);if(ms>50)s.slow++;}};}
      let prev=performance.now();const frame=now=>{runtimeStats.frames.push(now-prev);prev=now;requestAnimationFrame(frame);};requestAnimationFrame(frame);
    }""")
    cdp=page.context.new_cdp_session(page);cdp.send('Profiler.enable');cdp.send('Profiler.setSamplingInterval',{'interval':1000});cdp.send('Profiler.start')
    # Advance enough simulated time to include periodic saving and CPU planning.
    page.wait_for_timeout(duration*1000)
    profile=cdp.send('Profiler.stop')['profile']
    stats=page.evaluate("""()=>{setSpeed(0);const frames=runtimeStats.frames.slice().sort((a,b)=>a-b),quantile=p=>frames[Math.min(frames.length-1,Math.floor(frames.length*p))];return {calls:runtimeStats.calls,frames:{count:frames.length,p50:quantile(.5),p95:quantile(.95),p99:quantile(.99),max:frames.at(-1),over100:frames.filter(t=>t>100).length},longTasks:runtimeStats.longTasks,heap:performance.memory?{used:performance.memory.usedJSHeapSize,total:performance.memory.totalJSHeapSize}:null};}""")
    nodes={n['id']:n for n in profile['nodes']};counts={}
    for sample in profile.get('samples',[]):
        node=nodes[sample];fn=node['callFrame'];key=fn['functionName']+' @ '+fn['url'].split('/')[-1]+':'+str(fn['lineNumber']+1);counts[key]=counts.get(key,0)+1
    stats['cpuSamples']=sorted(counts.items(),key=lambda item:item[1],reverse=True)[:35]
    output=root/'pixxo_tests'/('runtime-'+label+'.json');output.write_text(json.dumps(stats,indent=2),encoding='utf-8')
    print(json.dumps(stats,indent=2),flush=True)
    browser.close()
