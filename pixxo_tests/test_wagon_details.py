"""Native Karrendetails, Ladungsvarianten, Richtungen und Liefer-Ausblendung."""
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
    page.locator('[data-start=new]').click()
    page.wait_for_function('StartScreen.started')
    page.evaluate('tutorialFinish();setSpeed(0)')
    result=page.evaluate("""() => {
        const goods=[null,'holz','stein','getreide','bier','werkzeug'],dirs=[[1,0],[-1,0],[0,1],[0,-1]],data=c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data;
        const originals=JSON.stringify(G.carts),stock=JSON.stringify(G.stock),masks=new Set();let minColors=100;
        for(const good of goods)for(const [dx,dy] of dirs)for(let frame=0;frame<2;frame++){
            const sprite=wagonSprite(dx,dy,frame,good),pixels=data(sprite),colors=new Set();
            if(sprite.width!==40||sprite.height!==40)throw Error('Falsche Quellauflösung');
            if(sprite!==wagonSprite(dx,dy,frame,good))throw Error('Instabiler Spritecache');
            for(let i=0;i<pixels.length;i+=4)if(pixels[i+3])colors.add(Array.from(pixels.slice(i,i+4)).join(','));
            minColors=Math.min(minColors,colors.size);if(colors.size<15)throw Error('Zu wenig Materialdetails');
        }
        for(const good of goods){
            masks.add(Array.from(data(wagonSprite(1,0,0,good))).join(','));
            for(const [a,b,horizontal] of [[[1,0],[-1,0],true],[[0,1],[0,-1],false]]){
                const p=data(wagonSprite(...a,0,good)),q=data(wagonSprite(...b,0,good));
                for(let y=0;y<40;y++)for(let x=0;x<40;x++)for(let k=0;k<4;k++)if(p[(y*40+x)*4+k]!==q[((horizontal?y:39-y)*40+(horizontal?39-x:x))*4+k])throw Error('Richtungsspiegelung');
            }
        }
        if(masks.size!==6||WAGON_SPRITES.size!==48)throw Error('Ladungsvarianten fehlen');
        const c=document.createElement('canvas');c.width=900;c.height=420;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.fillStyle='#527139';g.fillRect(0,0,900,420);g.font='16px sans-serif';
        const labels=['Leer','Holz','Stein / Erz','Säcke','Fässer','Kisten'];
        for(let j=0;j<6;j++){g.fillStyle='#fff';g.fillText(labels[j],j*150+8,24);
            for(let d=0;d<4;d++){const s=wagonSprite(...dirs[d],0,goods[j]);nativeDrawImage.call(g,s,j*150+10,40+d*86,80,80);nativeDrawImage.call(g,s,j*150+104,64+d*86,20,20);}}
        const image=document.createElement('img');image.id='wagon-details';image.src=c.toDataURL();Object.assign(image.style,{position:'fixed',inset:0,zIndex:99999});document.body.append(image);
        const test=document.createElement('canvas');test.width=test.height=80;const t=test.getContext('2d'),cart={path:[IDX(100,100),IDX(101,100)],t:.3,col:'holz',qty:1};
        drawWagon(t,40,40,cart);const full=data(test);t.clearRect(0,0,80,80);drawWagon(t,40,40,cart,.5);const faded=data(test);
        let occupied=0;for(let i=3;i<full.length;i+=4)if(full[i]){occupied++;if(faded[i]>Math.ceil(full[i]*.5))throw Error('Ausblendung nicht erhalten');}
        for(let y=0;y<80;y++)for(let x=0;x<80;x++)if((x<30||x>=50||y<30||y>=50)&&full[(y*80+x)*4+3])throw Error('Karrengröße verändert');
        if(!occupied||JSON.stringify(G.carts)!==originals||JSON.stringify(G.stock)!==stock)throw Error('Lieferdaten verändert');
        return {variants:WAGON_SPRITES.size,minColors,worldSize:20};
    }""")
    page.locator('#wagon-details').screenshot(path=str(root/'pixxo_tests/wagon-details.png'))
    page.evaluate('document.querySelector("#wagon-details").remove()')
    played=(root/'pixxo_tests/showcase-played-save.json').read_text(encoding='utf-8')
    page.evaluate('(save)=>{localStorage.setItem(SAVEKEY,save);loadGame();tutorialFinish();setSpeed(1);for(let i=0;i<80;i++)stepWorld(.25);setSpeed(0);dayClock().system=false;dayClock().minutes=720;}',played)
    scene=page.evaluate("""() => {
        const cart=G.carts.find(c=>c.path.length>1);if(!cart)throw Error('Keine aktive Lieferung in der Testpartie');
        const i=Math.min(cart.path.length-2,Math.floor(cart.t)),a=cart.path[i],b=cart.path[i+1],f=cart.t-i;
        const x=a%MAPW+(b%MAPW-a%MAPW)*f+.5,y=Math.floor(a/MAPW)+(Math.floor(b/MAPW)-Math.floor(a/MAPW))*f+.5;
        UI.sel=null;UI.z=3;UI.sc=UI.z*UI.DR;centerOn(x,y);render();return {carts:G.carts.length,good:cart.col};
    }""")
    page.screenshot(path=str(root/'pixxo_tests/wagons-in-game.png'))
    page.emulate_media(reduced_motion='reduce')
    assert page.evaluate('WORK_ART.reduced.matches')
    assert not errors,errors
    browser.close()
    print('PASS: Detaillierte Karren, sechs Ladungsformen, vier Richtungen, unveränderte Größe, Spritecache und Ausblendung.',result,scene)
