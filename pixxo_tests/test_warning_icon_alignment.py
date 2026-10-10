"""Sichtbare Icon-Inhalte mittig im Sprechblasen-Körper, ohne Spitze."""
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
        const names=[...GOODS.map(g=>g.id),'i_alert','i_road','i_lager','i_kreuz'];
        for(const name of names){
            const p=warningIconLayout(name);if(!p)throw Error('Icon fehlt: '+name);
            if(p!==warningIconLayout(name))throw Error('Cache fehlt: '+name);
            if(Math.abs(p.x+p.width/2-10)>1e-9||Math.abs(p.y+p.height/2-9)>1e-9)throw Error('Icon nicht mittig: '+name);
            if(p.x<2||p.x+p.width>18||p.y<2||p.y+p.height>16)throw Error('Icon überschreitet Innenfläche: '+name);
            const c=document.createElement('canvas');c.width=80;c.height=88;const ctx=c.getContext('2d');ctx.scale(4,4);drawWarningIcon(ctx,name);
            const pixels=ctx.getImageData(0,0,80,88).data;let l=80,r=-1,t=88,b=-1;
            for(let y=0;y<88;y++)for(let x=0;x<80;x++)if(pixels[(y*80+x)*4+3]>=128){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
            if(Math.abs((l+r+1)/8-10)>.25||Math.abs((t+b+1)/8-9)>.25)throw Error('Gezeichnetes Icon nicht mittig: '+name);
        }
        const namesToShow=['schnaps','haeute','leder','stiefel','wachs','kerzen','i_alert','i_road','i_lager','i_kreuz'];
        const c=document.createElement('canvas');c.width=1100;c.height=260;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.fillStyle='#21190f';g.fillRect(0,0,c.width,c.height);g.font='14px sans-serif';
        for(let i=0;i<namesToShow.length;i++){
            const name=namesToShow[i];g.fillStyle='#f3e6c8';g.fillText(name,i*110+6,22);
            g.save();g.translate(i*110+12,34);g.scale(4,4);g.drawImage(SP.bubble,0,0);g.drawImage(SP[name],2,2,16,16);g.restore();
            g.save();g.translate(i*110+12,158);g.scale(4,4);g.drawImage(SP.bubble,0,0);drawWarningIcon(g,name);g.restore();
        }
        g.fillStyle='#f3e6c8';g.fillText('Vorher oben / korrigiert unten',6,144);
        const image=document.createElement('img');image.id='warning-alignment';image.src=c.toDataURL();Object.assign(image.style,{position:'fixed',inset:0,zIndex:99999});document.body.append(image);
        return {icons:names.length};
    }""")
    page.locator('#warning-alignment').screenshot(path=str(root/'pixxo_tests/warning-icon-alignment.png'))
    page.evaluate('document.querySelector("#warning-alignment").remove();render()')
    assert not errors,errors
    browser.close()
    print('PASS: Alle Waren- und Warnicons sichtbar horizontal/vertikal zentriert, innerhalb der Sprechblase, pixelgenau und gecacht.',result)
