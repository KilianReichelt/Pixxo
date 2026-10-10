"""Native Rindergehege: Details, Animation, Drehungen und konstante Belegung."""
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    page=browser.new_page(viewport={'width':1000,'height':700})
    page.goto((root/'pixxo.html').as_uri());page.wait_for_function('StartScreen.ready')
    page.locator('[data-start=new]').click();page.wait_for_function('StartScreen.started')
    page.evaluate('tutorialFinish();setSpeed(0)')
    print(page.evaluate("""()=>{
        const pixels=c=>Array.from(c.getContext('2d').getImageData(0,0,c.width,c.height).data),original={time:G.time,speed:G.speed,fieldOwner:UI.fieldOwner},running=workshopRunning,stock=JSON.stringify(G.stock),c=document.createElement('canvas');
        c.width=740;c.height=400;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.fillStyle='#527139';g.fillRect(0,0,c.width,c.height);g.fillStyle='#fff';g.font='16px sans-serif';
        let minimumColors=100;
        for(const cattle of [false,true]){const hashes=new Set();g.fillText(cattle?'Rindergehege — sechs Frames':'Schafgehege — sechs Frames',10,cattle?215:20);
            for(let frame=0;frame<6;frame++){const source=livestockEnclosureArt(cattle,frame),data=pixels(source),colors=new Set();if(source.width!==32||source.height!==48||source!==livestockEnclosureArt(cattle,frame))throw Error('Raster oder Cache verändert');hashes.add(data.join(','));for(let i=0;i<data.length;i+=4)if(data[i+3])colors.add(data.slice(i,i+4).join(','));minimumColors=Math.min(minimumColors,colors.size);nativeDrawImage.call(g,source,10+frame*120,cattle?235:40,96,144);}
            if(hashes.size!==6)throw Error('Weniger als sechs verschiedene Phasen');
        }
        if(minimumColors<24)throw Error('Materialdetails fehlen');
        const owner={id:888777,type:'rinderhof',paused:false,fire:0},b={id:888778,type:'gehege',fieldOwner:owner.id,island:activeIsland,rotation:0,w:B.gehege.w,h:B.gehege.h};G.byId.set(owner.id,owner);
        try{workshopRunning=()=>true;G.speed=1;
            for(const type of ['rinderhof','schaefer']){owner.type=type;const names=new Set();for(let frame=0;frame<6;frame++){G.time=frame/3;names.add(workshopSprite(b));}if(names.size!==6)throw Error('Sechs Frames nicht ins Spiel eingebunden');
                for(let rotation=0;rotation<4;rotation++){b.rotation=rotation;const name=workshopSprite(b),sprite=SP[name];if(sprite.width!==(rotation%2?48:32)||sprite.height!==(rotation%2?32:48))throw Error('Gedrehtes Gehege verzerrt');}b.rotation=0;
                owner.paused=true;G.time=10;const stopped=workshopSprite(b);G.time=20;if(workshopSprite(b)!==stopped)throw Error('Pause bewegt Tiere');owner.paused=false;
            }
        }finally{G.byId.delete(owner.id);G.time=original.time;G.speed=original.speed;UI.fieldOwner=original.fieldOwner;workshopRunning=running;}
        if(JSON.stringify(G.stock)!==stock)throw Error('Grafik verändert Waren');
        const img=document.createElement('img');img.id='cattle-art';img.src=c.toDataURL();Object.assign(img.style,{position:'fixed',inset:0,zIndex:99999});document.body.append(img);return {native:[32,48],frames:6,minimumColors};
    }"""))
    page.locator('#cattle-art').screenshot(path=str(root/'pixxo_tests/cattle-enclosure.png'))
    page.emulate_media(reduced_motion='reduce')
    assert page.evaluate('WORK_ART.reduced.matches')
    page.evaluate("""()=>{const owner={id:888777,type:'schaefer',paused:false,fire:0},b={id:888778,type:'gehege',fieldOwner:owner.id,island:activeIsland,rotation:0},before={time:G.time,speed:G.speed},running=workshopRunning;G.byId.set(owner.id,owner);try{workshopRunning=()=>true;G.speed=1;for(const cattle of [false,true]){G.time=1;const a=livestockEnclosureSprite(b,cattle);G.time=2;if(a!==livestockEnclosureSprite(b,cattle))throw Error('Reduzierte Bewegung animiert Gehege');}}finally{G.byId.delete(owner.id);G.time=before.time;G.speed=before.speed;workshopRunning=running;}}""")
    browser.close()
