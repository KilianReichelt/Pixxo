"""Supplied pointer silhouette, palette, hotspot and unchanged tool bases."""
import base64
from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parent.parent
reference=Image.open(root/'assets/cursors/pointer-reference.png').convert('RGBA')
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True,args=['--allow-file-access-from-files'])
    page=browser.new_page(viewport={'width':1920,'height':1080},reduced_motion='reduce')
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((root/'pixxo.html').as_uri());page.wait_for_function('StartScreen.ready')
    pixels=page.evaluate('Array.from(PIXXO_CURSOR_BASES.pointer.getContext("2d").getImageData(0,0,16,16).data)')
    palette={'edge':(33,25,15,255),'shade':(182,138,77,255),'gold':(240,211,152,255),'light':(245,229,200,255)}
    for y in range(16):
        for x in range(16):
            source=reference.getpixel((x,y)) if x<reference.width else (0,0,0,0)
            expected=(0,0,0,0) if source[3]<128 else palette['edge' if source[0]<110 else 'shade' if source[0]<190 else 'gold' if source[0]<245 else 'light']
            assert tuple(pixels[(y*16+x)*4:(y*16+x)*4+4])==expected,(x,y)
    move_ref=Image.open(root/'assets/cursors/move-reference.png').convert('RGBA')
    move_pixels=page.evaluate('Array.from(PIXXO_CURSOR_BASES.window_move.getContext("2d").getImageData(0,0,16,16).data)')
    for y in range(16):
        for x in range(16):
            source=move_ref.getpixel((x,y));expected=(0,0,0,0) if source[3]<128 else palette['edge' if source[0]<110 else 'gold']
            assert tuple(move_pixels[(y*16+x)*4:(y*16+x)*4+4])==expected,(x,y)
    assert page.evaluate('PIXXO_CURSORS.window_move.css.endsWith("16 16, move")')
    move_preview=page.evaluate('''()=>{const a=document.createElement('canvas');a.width=224;a.height=112;const c=a.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#21190f';c.fillRect(0,0,112,112);c.fillStyle='#88a07c';c.fillRect(112,0,112,112);c.drawImage(PIXXO_CURSOR_BASES.window_move,8,8,96,96);c.drawImage(PIXXO_CURSOR_BASES.window_move,120,8,96,96);return a.toDataURL()}''')
    (root/'pixxo_tests/move-cursor-preview.png').write_bytes(base64.b64decode(move_preview.split(',')[1]))
    assert page.evaluate('PIXXO_CURSORS.pointer.css.endsWith("10 2, pointer")')
    assert page.locator('[data-start=new]').evaluate('e=>getComputedStyle(e).cursor===PIXXO_CURSORS.pointer.css')
    page.evaluate('''()=>{const base=PIXXO_CURSOR_BASES.default.getContext('2d').getImageData(0,0,16,16).data;
      for(const mode of ['default','buoy','upgrade','demo','build','road','move','road_path','road_stone','road_woodbridge','road_stonebridge']){
        const c=PIXXO_CURSORS[mode].canvas.getContext('2d'),pixels=c.getImageData(0,0,32,32).data;
        for(let y=0;y<32;y++)for(let x=0;x<32;x++)for(let k=0;k<4;k++)if(pixels[(y*32+x)*4+k]!==base[(Math.floor(y/2)*16+Math.floor(x/2))*4+k])throw Error('Tool base differs: '+mode);
      }}''')
    data=page.evaluate('PIXXO_CURSOR_BASES.pointer.toDataURL()')
    (root/'assets/cursors/pointer.png').write_bytes(base64.b64decode(data.split(',')[1]))
    preview=page.evaluate('''()=>{const a=document.createElement('canvas');a.width=224;a.height=112;const c=a.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#21190f';c.fillRect(0,0,112,112);c.fillStyle='#88a07c';c.fillRect(112,0,112,112);c.drawImage(PIXXO_CURSOR_BASES.pointer,8,8,96,96);c.drawImage(PIXXO_CURSOR_BASES.pointer,120,8,96,96);return a.toDataURL()}''')
    (root/'pixxo_tests/pointer-preview.png').write_bytes(base64.b64decode(preview.split(',')[1]))
    page.locator('[data-start=settings]').focus();page.keyboard.press('Enter');assert page.locator('#start-music-status').is_visible()
    assert not errors,errors
    browser.close()
    print('PASS: supplied hand silhouette, native palette, pointer hotspot, button cursor, keyboard and unchanged tool bases.')
