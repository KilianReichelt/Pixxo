"""Prüft echte Rasterdaten einschließlich Animationen und Kirchenanschluss."""
import base64
import json
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root / 'assets/sprites/source'))
import sprites2
from pixlib import PALETTE

checks = []
def check(ok, label):
    assert ok, label
    checks.append(label)

def rgba(color):
    return tuple(bytes.fromhex(color.lstrip('#'))) + (255,)

mapping = {rgba(PALETTE['rr'+str(i)]): rgba(PALETTE['bl'+str(i)]) for i in range(1,4)}
for entry in sprites2.SPR:
    for frame in range(4 if entry['anim'] else 1):
        red = sprites2.render_native(entry,frame,True)
        plain = sprites2.render_native(entry,frame,False)
        check(all(a == b or mapping.get(a) == b for a,b in zip(red.getdata(),plain.getdata())), f"{entry['key']}, Bild {frame}: ausschließlich Dachfarben geändert, Konturen und übrige Details erhalten")

church = sprites2.render_native(next(e for e in sprites2.SPR if e['key']=='kirche'),brick_roof=False)
check(all(church.getpixel((x,y))[3] == 255 for x in range(church.width//2-4,church.width//2+5) for y in (49,50,51)), 'Kirchenturm und Hauptgebäude sind ohne transparente Pixelspalte verbunden')

data_text = (root / 'assets/sprites/sprite_data.js').read_text(encoding='utf-8')
data = json.loads(data_text.removeprefix('const IMPORTED_SPRITE_DATA=').removesuffix(';'))
for name, file in [('buildings','buildings_native.png'),('animations','animations_native.png'),('buildings_without_bricks','buildings_without_bricks.png'),('animations_without_bricks','animations_without_bricks.png'),('icons','icons_16.png')]:
    image = Image.open(root / 'assets/sprites' / file).convert('RGBA')
    encoded = data['images'][name]
    indices = base64.b64decode(encoded['data'])
    check(image.size == (encoded['w'],encoded['h']) and list(image.getdata()) == [tuple(data['palette'][index]) for index in indices], f'{name}: eingebettete Spielgrafik entspricht dem exportierten Spriteblatt')

font = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',16)
review = Image.new('RGB',(960,660),'#21190f')
draw = ImageDraw.Draw(review)
examples = [('siedlerhaus',False,'Siedler · ohne Ziegel'),('buergerhaus',False,'Bürger · ohne Ziegel'),('patrizierhaus',True,'Patrizier · mit Ziegeln'),('kirche',False,'Kirche · geschlossene Fuge'),('segelschiffwerft',False,'Werft · ohne Ziegel'),('feuerwehr',False,'Feuerwehr · ohne Ziegel'),('bauernhof',False,'Bauernhof · ohne Ziegel'),('lagerhaus',False,'Lagerhaus · ohne Ziegel')]
for i,(key,brick,label) in enumerate(examples):
    im=sprites2.render_native(next(e for e in sprites2.SPR if e['key']==key),brick_roof=brick)
    im=im.resize((im.width*3,im.height*3),Image.Resampling.NEAREST)
    x,y=i%4*240,i//4*330
    draw.text((x+8,y+8),label,font=font,fill='#f3e2bb')
    review.paste(im,(x+(240-im.width)//2,y+35),im)
review.save(root / 'pixxo_tests/roof_sprite_review.png')
result={'passed':len(checks),'checks':checks}
(root / 'pixxo_tests/roof_results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'{len(checks)} Rasterprüfungen bestanden.')
