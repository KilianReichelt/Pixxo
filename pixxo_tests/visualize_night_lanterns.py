"""Standalone proposal only: no changes to game lighting or assets."""
import base64
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    page=browser.new_page(viewport={'width':1920,'height':1080})
    page.goto((root/'pixxo.html').as_uri());page.wait_for_function('StartScreen.ready')
    frames=page.evaluate(r'''()=>Array.from({length:8},(_,frame)=>{
      const out=document.createElement('canvas');out.width=1920;out.height=920;const c=out.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#211d17';c.fillRect(0,0,1920,920);
      c.font='bold 34px sans-serif';c.fillStyle='#f3e6c8';c.fillText('Nachtbeleuchtung · Vorschau',36,54);c.font='20px sans-serif';c.fillStyle='#d5c7aa';c.fillText('2 × 3 Pixel kleine Laternen; jede Flamme mit eigenem flackerndem Licht.',36,90);
      const lamp=(g,x,y)=>{g.fillStyle='#3b2d1e';g.fillRect(x,y,2,3);g.fillStyle='#bd8e42';g.fillRect(x,y+1,1,1);g.fillStyle='#fff0b3';g.fillRect(x+1,y+1,1,1);};
      const glow=(g,x,y,radius,power)=>{const q=g.createRadialGradient(x,y,1,x,y,radius);q.addColorStop(0,'rgba(255,193,81,'+power+')');q.addColorStop(.45,'rgba(240,151,53,'+(power*.35)+')');q.addColorStop(1,'rgba(230,125,40,0)');g.fillStyle=q;g.fillRect(x-radius,y-radius,radius*2,radius*2);};
      for(let mode=0;mode<3;mode++){
        const a=document.createElement('canvas');a.width=148;a.height=154;const g=a.getContext('2d');g.imageSmoothingEnabled=false;
        g.fillStyle=mode===1?'#376d79':'#657b4b';g.fillRect(0,0,148,154);
        for(let i=0;i<900;i++){const x=Math.floor(hs(i,2,42)*148),y=Math.floor(hs(i,3,42)*154);g.fillStyle=mode===1?(i%3?'#427e86':'#598e93'):(i%3?'#718450':'#50693f');g.fillRect(x,y,mode===1?3:1,1);}
        if(mode!==1){
          g.fillStyle='#736955';g.fillRect(0,102,148,17);g.fillStyle='#aaa080';g.fillRect(0,106,148,1);g.fillStyle='#645847';for(let x=0;x<148;x+=6)g.fillRect(x,109,4,1);
          const b={type:'haus',tier:2,w:2,h:2,id:5,rotation:0,visualVariant:0},name=spName(b),source=HD_CATALOG.get(name)?.pixelSource||SP[name];nativeDrawImage.call(g,source,42,56,source.width,source.height);
          if(mode===0)nativeDrawImage.call(g,wagonSprite(1,0,1,'bretter'),53,100,20,20);
          if(mode===2)for(const x of [44,54,64])nativeDrawImage.call(g,SP['fire1'],x,62);
        }else{
          g.fillStyle='#657b4b';g.fillRect(0,0,24,154);g.fillStyle='#a4966b';g.fillRect(24,0,3,154);
          const span=stoneSpanArt(6,1,0);nativeDrawImage.call(g,span.canvas,28,44);
          nativeDrawImage.call(g,SP[ambientSprite('boat',1,0,3)],75,99);
          nativeDrawImage.call(g,SP[ambientSprite('boat',0,1,1)],112,119);
        }
        // Same night tint as the live game. These additions exist only in this canvas.
        g.fillStyle='rgba(8,16,42,.58)';g.fillRect(0,0,148,154);
        if(mode===0){glow(g,56,112,19,.58);g.fillStyle='#675238';g.fillRect(56,110,1,1);lamp(g,55,111);}
        if(mode===1){glow(g,76,111,15,.48);lamp(g,75,109);glow(g,120,122,14,.43);lamp(g,119,120);g.fillStyle='rgba(227,169,80,.35)';for(const [x,y,w] of [[73,115,5],[74,117,3],[117,128,4]])g.fillRect(x,y,w,1);}
        if(mode===2)[44,54,64].forEach((x,i)=>{const pulse=.6+.23*Math.sin(frame*Math.PI/4+i*2.1);glow(g,x+8,76,24+6*pulse,pulse);nativeDrawImage.call(g,SP['fire'+((Math.floor(frame*3/8)+i)%3)],x,62);});
        const x=36+mode*632;c.fillStyle='#f3e6c8';c.font='bold 25px sans-serif';c.fillText(['Karren · Laterne seitlich','Flussboote · Laterne am Heck','Brand · warmer Feuerschein'][mode],x,143);
        nativeDrawImage.call(c,a,x,172,592,616);
        c.font='20px sans-serif';c.fillStyle='#d5c7aa';c.fillText(['Kurzer Lichtschein auf Wagen und Straße.','Dezente Reflexionen auf dem Wasser.','Jede Flamme leuchtet und flackert unabhängig.'][mode],x,829);
      }
      c.font='18px sans-serif';c.fillStyle='#b6a88e';c.fillText('Originalspriten im nativen Pixelraster · vergrößerte Ansicht · noch nicht im Spiel aktiviert',36,884);
      return out.toDataURL();
    })''')
    path=root/'pixxo_tests/night-lanterns-preview.png';path.write_bytes(base64.b64decode(frames[0].split(',')[1]));print(path)
    import json
    html='''<!doctype html><html lang="de"><meta charset="utf-8"><title>Nachtbeleuchtung – Vorschau</title><style>body{margin:0;background:#211d17;color:#f3e6c8;font:16px sans-serif}button{min-width:160px;min-height:44px;margin:12px;background:#e8cb85;color:#21190f;border:2px solid #b3a789;font:inherit}button:focus-visible{outline:3px solid #fff0b3;outline-offset:3px}img{display:block;width:min(1920px,100%);height:auto;image-rendering:pixelated}</style><button type="button" id="toggle" aria-pressed="false">Animation pausieren</button><img id="preview" alt="Kleine Laterne seitlich am Karren, Laternen am Heck der Boote und drei unabhängig flackernde Flammen."><script>const frames='''+json.dumps(frames)+''';let paused=matchMedia('(prefers-reduced-motion:reduce)').matches,frame=0;const image=document.getElementById('preview'),button=document.getElementById('toggle');image.src=frames[0];function label(){button.textContent=paused?'Animation abspielen':'Animation pausieren';button.setAttribute('aria-pressed',String(paused));}label();button.onclick=()=>{paused=!paused;label()};setInterval(()=>{if(!paused){frame=(frame+1)%frames.length;image.src=frames[frame]}},150);</script></html>'''
    (root/'pixxo_tests/night-lanterns-preview.html').write_text(html,encoding='utf-8')
    browser.close()
