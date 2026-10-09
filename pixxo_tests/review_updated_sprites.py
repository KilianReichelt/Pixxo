"""Exportiert die tatsächlichen neuen Spriteentwürfe zur Sichtprüfung."""
from pathlib import Path
import sys
from PIL import Image, ImageDraw, ImageFont
root=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(root/'assets/sprites/source'))
import sprites2
font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',18)
canvas=Image.new('RGB',(960,890),'#21190f');draw=ImageDraw.Draw(canvas)
def sprite(key):
    return sprites2.render_native(next(e for e in sprites2.SPR if e['key']==key),brick_roof=False)
for i,(key,label) in enumerate([('depot','Depot · Ladebereich, Kisten und Laterne'),('marktplatz','Markt · Warenstände, Brunnen und Pflaster')]):
    image=sprite(key);factor=4 if key=='depot' else 3
    image=image.resize((image.width*factor,image.height*factor),Image.Resampling.NEAREST)
    draw.text((i*480+24,16),label,font=font,fill='#f3e2bb')
    canvas.paste(image,(i*480+(480-image.width)//2,55),image)
fields=[('getreide','Getreide · Bauernhof'),('hopfen','Hopfen · Hopfenfarm'),('trauben','Wein · Weingut'),('gewuerz','Gewürze · Gewürzplantage'),('obst','Obst · Obsthof'),('blumen','Blumen · Blumenhof')]
images=[]
for i,(key,label) in enumerate(fields):
    tile=sprite('acker_'+key);images.append(tile.tobytes())
    field=Image.new('RGBA',(48,48))
    for y in range(3):
        for x in range(3):field.paste(tile,(x*16,y*16))
    field=field.resize((144,144),Image.Resampling.NEAREST)
    x,y=i%3*320,400+i//3*240
    draw.text((x+24,y),label,font=font,fill='#f3e2bb');canvas.paste(field,(x+88,y+40),field)
assert len(set(images))==6,'Die sechs Kulturarten müssen visuell unterschiedlich sein.'
canvas.save(root/'pixxo_tests/updated_sprite_review.png')
print('Depot, Markt und sechs verschiedene Kulturarten exportiert.')
