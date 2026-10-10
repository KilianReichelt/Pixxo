"""Echte diagonal ausgerichtete Kopfsteinpflaster-Sprites und Übergänge."""
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    page=browser.new_page(viewport={'width':1100,'height':650})
    page.goto((root/'pixxo.html').as_uri());page.wait_for_function('StartScreen.ready')
    page.locator('[data-start=new]').click();page.wait_for_function('StartScreen.started')
    page.evaluate('tutorialFinish();setSpeed(0)')
    report=page.evaluate("""()=>{
        const masks=[32|128,16|64,32,64,128,16,1|32,2|64];
        const pixels=c=>Array.from(c.getContext('2d').getImageData(0,0,c.width,c.height).data).join(',');
        if(pixels(diagonalRoadSprite(160,true,0,0))===pixels(diagonalRoadSprite(80,true,0,0)))throw Error('Diagonalen identisch');
        for(const m of masks){const c=diagonalRoadSprite(m,true,0,0);if(c.width!==48||c.height!==48||c!==diagonalRoadSprite(m,true,0,0))throw Error('Auflösung oder Cache falsch');if(pixels(c)===pixels(diagonalRoadSprite(m,false,0,0)))throw Error('Stein fällt auf Erde zurück');}
        if(diagonalRoadSprite(160,true,0,0)!==diagonalRoadSprite(160,true,3,3))throw Error('Periodischer Cache fehlt');
        const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=580;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#527139';c.fillRect(0,0,1000,580);c.fillStyle='#fff';c.font='18px sans-serif';c.fillText('Stufe 2: diagonales Kopfsteinpflaster',20,25);
        for(let scene=0;scene<2;scene++){c.save();c.translate(30+scene*470,55);c.scale(4,4);for(let i=0;i<7;i++){const y=scene?6-i:i,mask=i===0?(scene?16:32):i===6?(scene?64:128):(scene?80:160);drawRoadTile(c,mask,true,i,y);}c.restore();}
        const img=document.createElement('img');img.id='cobble-preview';img.src=canvas.toDataURL();Object.assign(img.style,{position:'fixed',inset:'0',zIndex:99999});document.body.append(img);return {variants:masks.length,source:48};
    }""")
    page.locator('#cobble-preview').screenshot(path=str(root/'pixxo_tests/diagonal-cobbles.png'))
    print('PASS: Diagonale Pflastervarianten, Stein/Erde getrennt, native Auflösung und periodischer Cache.',report)
    browser.close()
