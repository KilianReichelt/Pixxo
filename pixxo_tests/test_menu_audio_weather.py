"""Separate Audiokanäle, Menübestätigung, Transporthinweis und sichtbare Pfützen."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    page=browser.new_page(viewport={'width':1440,'height':1000})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((root/'pixxo.html').as_uri())
    page.wait_for_function('StartScreen.ready')
    page.locator('[data-start=settings]').click()
    assert page.locator('[data-audio-mute]').count()==0
    for key,value in [('music',41),('effects',62),('ambient',73)]:
        page.locator(f'#start-{key}-volume').fill(str(value))
        button=page.locator(f'[data-audio-channel-mute={key}]')
        button.focus();page.keyboard.press('Enter')
        assert page.evaluate('(key)=>Sound.prefs.channelMuted[key]',key)
        assert page.evaluate('(key)=>Sound.prefs[key]',key)==value/100
        assert button.inner_text()=='Aus'
        button.click()
        assert not page.evaluate('(key)=>Sound.prefs.channelMuted[key]',key)
    page.locator('[data-audio-channel-mute=ambient]').click()
    page.reload();page.wait_for_function('StartScreen.ready')
    page.locator('[data-start=settings]').click()
    assert page.evaluate('Sound.prefs.ambient')==.73
    assert page.locator('[data-audio-channel-mute=ambient]').inner_text()=='Aus'
    page.locator('[data-audio-channel-mute=ambient]').click()
    page.keyboard.press('Escape')
    played=(root/'pixxo_tests/showcase-played-save.json').read_text(encoding='utf-8')
    page.evaluate('(save)=>{localStorage.setItem(SAVEKEY,save);startRender();}',played)
    page.locator('[data-start=continue]').click()
    page.wait_for_function('StartScreen.started')
    page.evaluate('tutorialFinish();setSpeed(0);openWin_menu()')
    menu=page.locator('.win[data-id=menu]')
    assert menu.locator('[data-act=new]').evaluate('e=>getComputedStyle(e).backgroundColor')=='rgb(107, 48, 38)'
    for key in ['music','effects','ambient']:
        assert menu.locator(f'label[for={key}-volume]').evaluate('e=>getComputedStyle(e).minHeight')=='30px'
        slider=menu.locator(f'#{key}-volume').bounding_box()
        button=menu.locator(f'[data-audio-channel-mute={key}]').bounding_box()
        assert abs(slider['y']+slider['height']/2-button['y']-button['height']/2)<1
        assert button['x']>slider['x'] and button['width']>=44 and button['height']>=44
    dialogs=[]
    def dismiss(dialog):
        dialogs.append(dialog.message)
        dialog.dismiss()
    page.once('dialog',dismiss)
    menu.locator('[data-act=start-home]').click()
    assert len(dialogs)==1 and 'Startmenü' in dialogs[0]
    assert not page.locator('#pixxo-start').is_visible()
    page.once('dialog',lambda dialog:dialog.accept())
    menu.locator('[data-act=start-home]').click()
    assert page.locator('#pixxo-start').is_visible()
    assert page.evaluate('!!localStorage.getItem(SAVEKEY)')
    page.locator('[data-start=continue]').click()
    page.evaluate('closeWin("menu");setSpeed(0);dayClock().system=false;dayClock().minutes=720;dayClock().enabled=false')
    result=page.evaluate("""() => {
        const prod=G.blds.find(b=>def(b).transportRange&&warehouseTarget(b));
        if(!prod)throw Error('Testwelt ohne angeschlossenen Betrieb');
        UI.sel=prod.id;if(infoHTML().includes('Transportreichweite:'))throw Error('Unnötiger Transporthinweis');
        const target=warehouseTarget;warehouseTarget=()=>null;
        try{if(!infoHTML().includes('Kein Lager in Reichweite'))throw Error('Fehlende Transportwarnung');}finally{warehouseTarget=target;}
        WORLD.weather=weatherCreate(WORLD.rootSeed);weatherBeginRain();
        const duration=weatherState().end-weatherState().start;
        if(duration<360||duration>720)throw Error('Falsche Regendauer');weatherStep(230);
        const market=G.blds.find(b=>b.type==='markt');if(!market)throw Error('Testwelt ohne Markt');
        const c=document.createElement('canvas');c.width=c.height=200;const ctx=c.getContext('2d');
        const b={...market,x:3,y:3};drawMarketNightLights(ctx,0,0,200,200);
        const day=ctx.getImageData(0,0,200,200).data.some((v,i)=>i%4===3&&v>0);
        dayClock().minutes=0;marketNightDecor(ctx,b,nightAmount());
        const night=ctx.getImageData(0,0,200,200).data.some((v,i)=>i%4===3&&v>0);
        if(day||!night)throw Error('Marktbeleuchtung Tag/Nacht');dayClock().minutes=720;
        UI.sel=null;UI.z=2;UI.sc=UI.z*UI.DR;centerOn(cx(market),cy(market));render();
        const x0=cx(market)*16-300,y0=cy(market)*16-200;
        const puddles=document.createElement('canvas');puddles.width=600;puddles.height=400;
        const pc=puddles.getContext('2d');pc.translate(-x0,-y0);drawWeatherPuddles(pc,x0,y0,x0+600,y0+400);
        const data=pc.getImageData(0,0,600,400).data;let visible=0,maxAlpha=0;
        for(let i=3;i<data.length;i+=4)if(data[i]){visible++;maxAlpha=Math.max(maxAlpha,data[i]);}
        if(visible<50||maxAlpha<120)throw Error('Pfützen kaum sichtbar: '+visible+'/'+maxAlpha);
        return {duration,visible,maxAlpha,market:market.id};
    }""")
    page.screenshot(path=str(root/'pixxo_tests/visible-puddles.png'))
    page.evaluate('dayClock().minutes=0;render()')
    page.screenshot(path=str(root/'pixxo_tests/market-night-lights.png'))
    puddles=page.evaluate("""() => {
        const c=document.createElement('canvas');c.width=700;c.height=200;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.fillStyle='#527139';g.fillRect(0,0,700,200);g.font='16px sans-serif';
        for(let i=0;i<5;i++){const sprite=weatherPuddleSprite(i);g.fillStyle='#ffffff';g.fillText(sprite.width+' × '+sprite.height+' Pixel',i*140+8,28);nativeDrawImage.call(g,sprite,i*140+8,50,sprite.width*3,sprite.height*3);nativeDrawImage.call(g,sprite,i*140+8,140);}
        const image=document.createElement('img');image.id='puddle-variants';image.src=c.toDataURL();Object.assign(image.style,{position:'fixed',inset:0,zIndex:99999});document.body.append(image);
        const old=weatherState().time,event=weatherState().puddleEvents.at(-1);let values=[];
        for(let gy=0;gy<Math.ceil(MAPH/PUDDLE_CELL)&&!values.length;gy++)for(let gx=0;gx<Math.ceil(MAPW/PUDDLE_CELL);gx++){
            weatherState().time=event.start+230;const p=weatherPuddle(G,event,gx,gy);if(!p)continue;
            const levels=[0,30,60,120,230].map(t=>{weatherState().time=event.start+t;return weatherPuddle(G,event,gx,gy)?.wet||0;});
            if(levels.some((v,i)=>i&&v<levels[i-1])||levels[1]>=levels[4]*.3||levels[4]<=0)throw Error('Pfützen werden nicht langsam eingeblendet');values=levels;break;
        }
        weatherState().time=old;return {count:PUDDLE_SPRITES.size,levels:values};
    }""")
    assert puddles['count']==5 and len(puddles['levels'])==5,puddles
    page.locator('#puddle-variants').screenshot(path=str(root/'pixxo_tests/puddle-variants.png'))
    page.evaluate('document.querySelector("#puddle-variants").remove()')
    page.evaluate('openWin_menu()')
    axe=os.environ.get('PIXXO_AXE_SCRIPT')
    if axe:
        page.add_script_tag(path=axe)
        violations=page.evaluate("""async()=> (await axe.run(document.querySelector('.win[data-id=menu]'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))""")
        assert not violations,violations
    assert not errors,errors
    browser.close()
    print('PASS: Drei unabhängige Audio-Stummschalter mit Speicherung; Menübestätigung, roter Neustart, bedingter Transporthinweis, vierfache Regenzeit und sichtbare Pfützen.',json.dumps(result))
