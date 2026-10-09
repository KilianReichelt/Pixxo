"""Gebäude nativ mit 16 Grafikpixeln je Kachel reproduzierbar exportieren."""
import sprites2, json, base64
from pathlib import Path
from PIL import Image
out=Path(__file__).resolve().parent.parent
ents=sprites2.SPR
dims=[sprites2.native_dimensions(e) for e in ents]
cellw=max(d[0] for d in dims);cellh=max(d[1] for d in dims)
sheet=Image.new('RGBA',(8*cellw,((len(ents)+7)//8)*cellh))
plain_sheet=Image.new('RGBA',sheet.size)
animated=[e for e in ents if e['anim']]
frames=Image.new('RGBA',(4*cellw,sum(sprites2.native_dimensions(e)[1] for e in animated)))
plain_frames=Image.new('RGBA',frames.size)
items=[];animation_y=0
for i,e in enumerate(ents):
    w,h,tw,th=sprites2.native_dimensions(e)
    x,y=(i%8)*cellw,(i//8)*cellh
    sheet.paste(sprites2.render_native(e,0),(x,y))
    plain_sheet.paste(sprites2.render_native(e,0,False),(x,y))
    entry=dict(id=e['key'],name=e['label'],x=x,y=y,w=w,h=h,tileWidth=tw,tileHeight=th,frames=1)
    if e['anim']:
        for f in range(4):
            frames.paste(sprites2.render_native(e,f),(f*w,animation_y))
            plain_frames.paste(sprites2.render_native(e,f,False),(f*w,animation_y))
        entry.update(frames=4,animationY=animation_y)
        animation_y+=h
    items.append(entry)
sheet.save(out/'buildings_native.png');frames.save(out/'animations_native.png')
plain_sheet.save(out/'buildings_without_bricks.png');plain_frames.save(out/'animations_without_bricks.png')
(out/'atlas.json').write_text(json.dumps(items,ensure_ascii=False,indent=2),encoding='utf-8')
images={};palette=[(0,0,0,0)]
for key,im in [('buildings',sheet),('animations',frames),('buildings_without_bricks',plain_sheet),('animations_without_bricks',plain_frames),('icons',Image.open(out/'icons_16.png').convert('RGBA'))]:
    indices=bytearray()
    for pixel in im.getdata():
        color=pixel if pixel[3] else (0,0,0,0)
        if color not in palette:palette.append(color)
        indices.append(palette.index(color))
    images[key]=dict(w=im.width,h=im.height,data=base64.b64encode(indices).decode())
data=dict(palette=palette,atlas=items,images=images)
(out/'sprite_data.js').write_text('const IMPORTED_SPRITE_DATA='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';',encoding='utf-8')
print(len(items),'native Gebäudesprites,',len(animated),'Animationen,',len(palette),'Farben')
