"""Hinweise nur für ungeschützte Brände; gelesen beim Schließen geleert."""
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe', headless=True,ignore_default_args=['--hide-scrollbars'])
    page = browser.new_page(viewport={'width':1440, 'height':1000})
    errors=[]
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto((root/'pixxo.html').as_uri())
    page.wait_for_function('StartScreen.ready')
    page.locator('[data-start=new]').click()
    page.wait_for_function('StartScreen.started')
    page.evaluate('tutorialFinish();setSpeed(0)')
    print(page.evaluate("""() => {
        const check=(ok,text)=>{if(!ok)throw Error(text)},box=$('#toasts');
        box.replaceChildren();UI.log=[];UI.unreadEvents=0;
        for(const text of ['Alle Betriebsflächen vorhanden','Gold fehlt','Ein Brand ist ausgebrochen','Der Brand wurde gelöscht','Ein Haus ist niedergebrannt','Forschung abgeschlossen']){msg(text,'i_alert');toast(text,'i_alert');}
        check(!box.children.length&&!UI.log.length&&!UI.unreadEvents,'Andere Meldungen in Hinweisen');
        const target={id:987654,type:'haus',x:20,y:20,w:2,h:2,tier:1,fire:0},station={id:987655,type:'feuer',x:22,y:20,w:2,h:2,conn:true,paused:false,fire:0};
        const buildings=G.blds,route=deliveryPath;G.blds=[target,station];deliveryPath=()=>[IDX(21,22),IDX(22,22)];
        try{
            check(pixxoIgnite(target),'Brand nicht gestartet');check(!box.children.length,'Erreichbare Feuerwehr erzeugt Warnung');
            station.paused=true;pixxoWarnUnprotectedFire(target);check(box.children.length===1&&UI.unreadEvents===1,'Ungeschützter Brand ohne Warnung');
            pixxoWarnUnprotectedFire(target);check(box.children.length===1,'Doppelte Brandwarnung');
            toggleSidebar('events');check(box.children.length===1&&UI.unreadEvents===0,'Öffnen entfernt lesbare Warnung');
            toggleSidebar('events');check(!box.children.length&&!UI.log.length&&!UI.unreadEvents,'Gelesene Liste nicht geleert');
            pixxoWarnUnprotectedFire(target);check(!box.children.length,'Gelesener Brand erneut gemeldet');
            target.fire=0;pixxoIgnite(target);check(box.children.length===1,'Neuer Brand nicht gemeldet');
            toggleSidebar('events');toggleSidebar('quest');check(!box.children.length,'Tabwechsel leert Liste nicht');
            target.fire=0;station.paused=false;deliveryPath=()=>null;pixxoIgnite(target);check(box.children.length===1,'Feuerwehr ohne Straßenweg unterdrückt Warnung');
        }finally{G.blds=buildings;deliveryPath=route;}
        const funds=G.gold,stock=G.stock,request=nextTierReq,effect=soundEffect;let sounds=0;
        try{G.gold=0;G.stock={holz:100};nextTierReq=()=>({ok:true,cost:{gold:100,holz:5}});soundEffect=()=>sounds++;
            check(upgradeHouse(target)===false&&sounds===0,'Geldmangel erzeugt Fehler oder Fehlerton');
        }finally{G.gold=funds;G.stock=stock;nextTierReq=request;soundEffect=effect;}
        const g=G,k=IDX(100,100),q=IDX(101,101),a=IDX(101,100),b=IDX(100,101),saved=[k,q,a,b].map(i=>[i,g.road[i],g.occ[i],g.tiles[i]]);
        try{for(const i of [k,q,a,b]){g.tiles[i]=T.GRASS;g.road[i]=0;g.occ[i]=0;}g.road[k]=g.road[q]=1;g.occ[a]=123;
            check(roadStepAllowed(100,100,101,101),'Gebäude trennt Diagonalstraße');g.road[b]=1;
            check(!roadStepAllowed(100,100,101,101),'T-Kreuzung bildet Dreieck');
        }finally{for(const [i,road,occ,tile] of saved){g.road[i]=road;g.occ[i]=occ;g.tiles[i]=tile;}}
        const original={blds:G.blds,occ:G.occ,road:G.road,cpu:G.cpu,fieldOwner:UI.fieldOwner},modules=fieldModules,type=Object.keys(FIELD_RULES)[0],d=B[type];
        const owners=[{id:80001,type,x:100,y:100,w:d.w,h:d.h},{id:80002,type,x:140,y:100,w:d.w,h:d.h}];
        try{G.blds=owners;G.occ=new Int32Array(MAPW*MAPH).fill(1);G.road=new Uint8Array(MAPW*MAPH);G.cpu={age:300};fieldModules=()=>[];
            cpuFields();check(CPU_FIELD_SEARCHES.get(owners[0]).cursor===96,'Feldsuche ohne Taktbudget');
            cpuFields();check(CPU_FIELD_SEARCHES.get(owners[0]).cursor===192,'Feldsuche setzt nicht fort');
            for(let i=0;i<20;i++)cpuFields();check(CPU_FIELD_SEARCHES.get(owners[1])?.retryAt>300,'Zweiter Hof verhungert bei der Suche');
            G.cpu.age=361;cpuFields();check(CPU_FIELD_SEARCHES.get(owners[0]).cursor===96,'Blockierter Hof wird nicht erneut geprüft');
        }finally{Object.assign(G,{blds:original.blds,occ:original.occ,road:original.road,cpu:original.cpu});UI.fieldOwner=original.fieldOwner;fieldModules=modules;}
        const path=[IDX(100,100),IDX(101,100),IDX(102,100)],roads=new Uint8Array(MAPW*MAPH),cart={path,t:0};
        const near=(a,b)=>Math.abs(a-b)<1e-9;
        path.forEach(k=>roads[k]=1);check(near(cartPathAdvance(cart,.4,{road:roads}),.4),'Normalstraße verändert');
        path.forEach(k=>roads[k]=2);check(near(cartPathAdvance(cart,.4,{road:roads}),.52),'Steinstraße nicht 30% schneller');
        check(near(cartPathAdvance(cart,1,{road:roads}),1.3),'Bonus über mehrere Abschnitte falsch');
        roads[path[0]]=1;check(near(cartPathAdvance(cart,.6,{road:roads}),.63),'Mischstraße ohne abschnittsgenauen Bonus');
        const diagonal={path:[IDX(100,100),IDX(101,101)],t:0};roads[diagonal.path[0]]=roads[diagonal.path[1]]=2;
        check(near(cartPathAdvance(diagonal,.4,{road:roads}),.52/Math.SQRT2),'Diagonalbonus falsch');
        dayClock().system=false;dayClock().minutes=1080;check(nightAmount()===0,'18 Uhr bereits volle Nacht');
        dayClock().minutes=1170;check(nightAmount()>0&&nightAmount()<1,'19:30 ohne Dämmerung');
        dayClock().minutes=1260;check(nightAmount()===1,'21 Uhr nicht dunkel');
        check(WEATHER_RULES.dryMin===900&&WEATHER_RULES.dryMax===1800&&WEATHER_RULES.rainMin===360&&WEATHER_RULES.rainMax===720,'Regenintervalle');
        return 'PASS: Brandhinweise, Feuerwehr und Straßenweg, gelesenes Leeren, neue Brände, stille Geldknappheit, Diagonalstraßen, Abend und Regen.';
    }"""))
    page.evaluate("""() => {openWin_store();const w=document.querySelector('.win[data-id=store]'),body=w.querySelector('.wb');w.style.height='260px';body.style.maxHeight='140px';body.style.overflow='auto';
        const thumb=getComputedStyle(body,'::-webkit-scrollbar-thumb'),track=getComputedStyle(body,'::-webkit-scrollbar-track');
        if(thumb.borderRadius!=='0px'||thumb.backgroundColor!=='rgb(185, 154, 97)'||track.backgroundColor!=='rgb(33, 25, 15)')throw Error('Pixel-Scrollstil fehlt');
        const luminance=rgb=>rgb.map(c=>{c/=255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4}).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
        if((luminance([185,154,97])+.05)/(luminance([33,25,15])+.05)<3)throw Error('Scrollgriff-Kontrast unter 3:1');
        for(const el of w.querySelectorAll('button,label,td,th,p'))if(el.getClientRects().length&&parseFloat(getComputedStyle(el).fontSize)<14)throw Error('Text kleiner als 14px');
    }""")
    panel=page.locator('.win[data-id=store] .wb')
    panel.hover()
    page.mouse.wheel(0,180)
    page.wait_for_timeout(150)
    assert panel.evaluate('(el)=>el.scrollTop>0'),'Native Scrollfunktion fehlt'
    page.locator('.win[data-id=store]').screenshot(path=str(root/'pixxo_tests/pixel-scrollbars.png'))
    page.emulate_media(forced_colors='active')
    assert panel.evaluate("el=>getComputedStyle(el).scrollbarColor==='auto'")
    assert not errors,errors
    browser.close()
