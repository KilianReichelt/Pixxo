"""Lokale Ergänzung der fehlenden Pixelbibliothek für sprites2.py."""
from PIL import Image, ImageFont
import math
PALETTE = {
'ol':'#2c241d','bk':'#211c18','wh':'#eee4c6','w1':'#503622','w2':'#865632','w3':'#b98149','w4':'#d9aa65',
'th1':'#8e662e','th2':'#c09647','th3':'#e4c86c','rr1':'#76332c','rr2':'#b74e37','rr3':'#e1804f',
'bl1':'#28384f','bl2':'#526d8b','bl3':'#8dabc1','st1':'#414854','st2':'#737c88','st3':'#a8b0bc','st4':'#d3d8d8',
'cr1':'#9c8358','cr2':'#c6b17c','cr3':'#e8dab0','g0':'#244321','g1':'#3f652e','g2':'#64943e','g3':'#99bb57',
'pu1':'#52394f','pu2':'#8b5c87','pu3':'#bd8cbb','pk1':'#8e3f5b','pk2':'#ce7397','pk3':'#f0b0c3',
'cu1':'#345b52','cu2':'#648f72','cu3':'#9abb91','sd1':'#b99c68','sd2':'#d8c187',
'or1':'#a34726','or2':'#e99035','or3':'#ffd15c','wa1':'#254d67','wa2':'#4989ae','wa3':'#88c9e0','gold':'#edc246','iron':'#454b54'
}
# Gedeckte Naturpalette passend zu Holz, Vegetation und Stein der Spielwelt.
PALETTE.update({
'ol':'#302c25','bk':'#242620','wh':'#ded6bb','w1':'#514332','w2':'#806647','w3':'#a88b60','w4':'#c4ab79',
'th1':'#84733f','th2':'#aa9657','th3':'#c7b67e','rr1':'#70473c','rr2':'#995f4a','rr3':'#bc8060',
'bl1':'#37434b','bl2':'#61727b','bl3':'#94a1a1','st1':'#49514d','st2':'#788179','st3':'#a7afa2','st4':'#cad0be',
'cr1':'#8f8365','cr2':'#b6aa87','cr3':'#d6ccb0','g0':'#34462a','g1':'#506538','g2':'#718648','g3':'#9eaa65',
'pu1':'#514854','pu2':'#817184','pu3':'#ab99ac','pk1':'#80515b','pk2':'#b27e8e','pk3':'#d9afb9',
'cu1':'#435d51','cu2':'#718c71','cu3':'#a2b399','sd1':'#aa976e','sd2':'#cbbd93',
'or1':'#995737','or2':'#c8894a','or3':'#e4ba73','wa1':'#344d59','wa2':'#638595','wa3':'#99b6b9','gold':'#c5ac68','iron':'#50564e'
})
def hsh(x,y):
    n=(int(x)*374761393 ^ int(y)*668265263)&0xffffffff
    n=((n^(n>>13))*1274126177)&0xffffffff
    return (n^(n>>16))&0xffffffff
class Spr:
    def __init__(self,n): self.n=n; self.p=[[None]*n for _ in range(n)]
    def px(self,x,y,c):
        x,y=int(round(x)),int(round(y))
        if 0<=x<self.n and 0<=y<self.n:self.p[y][x]=c
    def hl(self,x0,x1,y,c):
        for x in range(int(round(x0)),int(round(x1))+1):self.px(x,y,c)
    def vl(self,x,y0,y1,c):
        for y in range(int(round(y0)),int(round(y1))+1):self.px(x,y,c)
    def rect(self,x0,y0,x1,y1,c):
        for y in range(int(round(y0)),int(round(y1))+1):self.hl(x0,x1,y,c)
    def line(self,x0,y0,x1,y1,c):
        x0,y0,x1,y1=map(lambda n:int(round(n)),(x0,y0,x1,y1))
        dx,dy=abs(x1-x0),-abs(y1-y0);sx=1 if x0<x1 else -1;sy=1 if y0<y1 else -1;e=dx+dy
        while True:
            self.px(x0,y0,c)
            if x0==x1 and y0==y1:break
            e2=2*e
            if e2>=dy:e+=dy;x0+=sx
            if e2<=dx:e+=dx;y0+=sy
    def disc(self,cx,cy,r,c):
        for y in range(math.floor(cy-r),math.ceil(cy+r)+1):
            for x in range(math.floor(cx-r),math.ceil(cx+r)+1):
                if (x-cx)**2+(y-cy)**2<=r*r:self.px(x,y,c)
    def outline(self):
        old=[row[:] for row in self.p]
        for y in range(self.n):
            for x in range(self.n):
                if old[y][x] is not None:
                    for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
                        xx,yy=x+dx,y+dy
                        if 0<=xx<self.n and 0<=yy<self.n and old[yy][xx] is None:self.p[yy][xx]='ol'
    def image(self):
        im=Image.new('RGBA',(self.n,self.n))
        im.putdata([tuple(bytes.fromhex(PALETTE[c].lstrip('#')))+(255,) if c else (0,0,0,0) for row in self.p for c in row])
        return im
def _font(n): return ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',n)

