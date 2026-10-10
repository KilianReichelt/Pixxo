"""Native Hausdetails in allen Stufen, Varianten und Drehungen prüfen."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parent.parent
capture_only=os.environ.get('PIXXO_HOUSE_CAPTURE_ONLY')=='1'
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    page=browser.new_page(viewport={'width':1440,'height':1000})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((root/'pixxo.html').as_uri())
    page.wait_for_function('StartScreen.ready')
    page.locator('[data-start="new"]').click()
    page.wait_for_function('StartScreen.started')
    page.evaluate('tutorialFinish();setSpeed(0)')
    result=page.evaluate("""() => {
        const sheet=document.createElement('canvas');sheet.width=1200;sheet.height=780;
        const c=sheet.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#21190f';c.fillRect(0,0,sheet.width,sheet.height);
        c.font='16px sans-serif';const results=[];
        for(let tier=1;tier<=3;tier++)for(let variant=0;variant<3;variant++){
            const base=typeSprite('haus',tier),original=HD_CATALOG.get(base).pixelSource;
            for(let rotation=0;rotation<4;rotation++){
                const b={id:100+tier,type:'haus',tier,visualVariant:variant,rotation,island:activeIsland};
                const name=houseVariantSprite(b),entry=HD_CATALOG.get(name),low=entry.pixelSource;
                const col=variant*4+rotation,row=tier-1;
                c.fillStyle='#f3e6c8';c.fillText('V'+variant+' / R'+rotation,col*100+4,row*260+24);
                nativeDrawImage.call(c,low,col*100+4,row*260+38,low.width*1.5,low.height*1.5);
                results.push({tier,variant,rotation,width:low.width,height:low.height,
                    expectedWidth:rotation%2?original.height:original.width,
                    expectedHeight:rotation%2?original.width:original.height});
                if(variant===0){
                    const actual=low.getContext('2d').getImageData(0,0,low.width,low.height).data;
                    const src=original.getContext('2d').getImageData(0,0,original.width,original.height).data;
                    let mismatch=0;
                    for(let y=0;y<original.height;y++)for(let x=0;x<original.width;x++){
                        const dx=rotation===0?x:rotation===1?original.height-1-y:rotation===2?original.width-1-x:y;
                        const dy=rotation===0?y:rotation===1?x:rotation===2?original.height-1-y:original.width-1-x;
                        for(let channel=0;channel<4;channel++)if(actual[(dy*low.width+dx)*4+channel]!==src[(y*original.width+x)*4+channel])mismatch++;
                    }
                    results[results.length-1].mismatch=mismatch;
                }
                if(houseVariantSprite(b)!==name||HD_CATALOG.get(name)!==entry)throw Error('Sprite-Cache instabil');
            }
        }
        const display=document.createElement('img');display.id='house-detail-sheet';display.src=sheet.toDataURL();
        document.body.append(display);Object.assign(display.style,{position:'fixed',inset:'0',width:'1200px',height:'780px',zIndex:99999});
        return results;
    }""")
    page.locator('#house-detail-sheet').screenshot(path=str(root/f'pixxo_tests/house-details-{"before" if capture_only else "after"}.png'))
    if not capture_only:
        for item in result:
            assert (item['width'],item['height'])==(item['expectedWidth'],item['expectedHeight']),item
            if item['variant']==0:
                assert item['mismatch']==0,item
        assert not errors,errors
        print('PASS: 36 Hausansichten behalten native Auflösung; alle zwölf Original-Rotationen pixelgenau und stabil gecacht.')
    else:
        print('Vorher-Vergleich aufgenommen:',result[0])
    browser.close()
