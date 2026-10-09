"""Pixxo-Pixelschrift und Favicon ohne externe Schriftdateien."""
from pathlib import Path
root=Path(__file__).resolve().parent.parent
font={'P':['11110','10001','10001','11110','10000','10000','10000'],'I':['111','010','010','010','010','010','111'],'X':['10001','10001','01010','00100','01010','10001','10001'],'O':['01110','10001','10001','10001','10001','10001','01110']}
rects=[];offset=0
for char in 'PIXXO':
    glyph=font[char]
    for y,row in enumerate(glyph):
        for x,on in enumerate(row):
            if on=='1':rects.append(f'<rect x="{offset+x}" y="{y}" width="1" height="1"/>')
    offset+=len(glyph[0])+1
logo=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1 -1 {offset+1} 10" role="img" aria-label="Pixxo" shape-rendering="crispEdges"><g fill="#8b5d38" transform="translate(0 1)">{"".join(rects)}</g><g fill="#e8cb85">{"".join(rects)}</g></svg>'
(root/'assets/pixxo-logo.svg').write_text(logo)
favicon='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges"><rect width="16" height="16" rx="2" fill="#281d16"/><g fill="#e8cb85" transform="translate(3 1) scale(2)">'+''.join(f'<rect x="{x}" y="{y}" width="1" height="1"/>' for y,row in enumerate(font['P']) for x,c in enumerate(row) if c=='1')+'</g></svg>'
(root/'assets/favicon.svg').write_text(favicon)
