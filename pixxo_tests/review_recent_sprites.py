"""Aktuelle Spielgrafiken und vier Animationsbilder zur Sichtprüfung exportieren."""
from pathlib import Path
import sys
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root / 'assets/sprites/source'))
import sprites2

entries = {entry['key']: entry for entry in sprites2.SPR}
font = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 18)
review = Image.new('RGB', (1120, 1300), '#21190f')
draw = ImageDraw.Draw(review)
for row, (key, label) in enumerate([('lehmgrube', 'Lehmgrube'), ('ziegelei', 'Ziegelei'), ('marktplatz', 'Markt · Besucher 2 × 7 px'), ('tiergehege', 'Tiergehege')]):
    draw.text((16, row * 250 + 5), label, font=font, fill='#f3e2bb')
    frames = [sprites2.render_native(entries[key], f, False) for f in range(4)]
    assert len({frame.tobytes() for frame in frames}) == 4, key
    for f, image in enumerate(frames):
        factor = 2 if key == 'marktplatz' else 3
        image = image.resize((image.width * factor, image.height * factor), Image.Resampling.NEAREST)
        x = f * 280 + (280 - image.width) // 2
        review.paste(image, (x, row * 250 + 32), image)

for i, (key, label) in enumerate([('bauernhof', 'Getreidehof · 5 × 4'), ('brauerei', 'Brauerei · 5 × 4'), ('deposit_lehm', 'Freies Lehmvorkommen'), ('icon_lehm', 'Lehm'), ('icon_ziegel', 'Ziegel')]):
    image = sprites2.render_native(entries[key], 0, False)
    if i < 2:
        image = image.resize((80, 84), Image.Resampling.NEAREST)
    factor = 2 if i < 3 else 6
    image = image.resize((image.width * factor, image.height * factor), Image.Resampling.NEAREST)
    x = i * 224 + (224 - image.width) // 2
    draw.text((i * 224 + 8, 1010), label, font=font, fill='#f3e2bb')
    review.paste(image, (x, 1050), image)
review.save(root / 'pixxo_tests/recent_sprite_review.png')
print('Gebäude, Vorkommen, Icons und vier Animationsbilder exportiert.')
