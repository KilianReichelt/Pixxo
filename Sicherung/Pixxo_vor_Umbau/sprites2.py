"""Neue Gebäudesprites: native Pixelgrafik mit 16 Pixeln je Kachel."""
from pixlib import hsh
import math, os
from PIL import Image, ImageDraw

BAYER = [[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]]

SPR = [{'key': 'siedlerhaus',
  'label': 'Siedlerhaus',
  'cat': 'Wohngebäude',
  'ground': 'grass',
  'anim': False,
  'path': None},
 {'key': 'buergerhaus',
  'label': 'Bürgerhaus',
  'cat': 'Wohngebäude',
  'ground': 'grass',
  'anim': False,
  'path': None},
 {'key': 'patrizierhaus',
  'label': 'Patrizierhaus',
  'cat': 'Wohngebäude',
  'ground': 'grass',
  'anim': False,
  'path': None},
 {'key': 'kontor_stufe_1',
  'label': 'Kontor – Stufe 1',
  'cat': 'Lager und Hafen',
  'ground': 'sand',
  'anim': False,
  'path': None},
 {'key': 'kontor_stufe_2',
  'label': 'Kontor – Stufe 2',
  'cat': 'Lager und Hafen',
  'ground': 'sand',
  'anim': False,
  'path': None},
 {'key': 'kontor_stufe_3',
  'label': 'Kontor – Stufe 3',
  'cat': 'Lager und Hafen',
  'ground': 'sand',
  'anim': False,
  'path': None},
 {'key': 'kontor_stufe_4',
  'label': 'Kontor – Stufe 4',
  'cat': 'Lager und Hafen',
  'ground': 'sand',
  'anim': False,
  'path': None},
 {'key': 'lagerhaus',
  'label': 'Lagerhaus',
  'cat': 'Lager und Hafen',
  'ground': 'sand',
  'anim': False,
  'path': None},
 {'key': 'segelschiffwerft',
  'label': 'Segelschiffwerft',
  'cat': 'Lager und Hafen',
  'ground': 'sand',
  'anim': False,
  'path': None},
 {'key': 'marktplatz',
  'label': 'Marktplatz',
  'cat': 'Öffentliche Gebäude',
  'ground': 'none',
  'anim': True,
  'path': None},
 {'key': 'kapelle',
  'label': 'Kapelle',
  'cat': 'Öffentliche Gebäude',
  'ground': 'grass',
  'anim': False,
  'path': None},
 {'key': 'kirche',
  'label': 'Kirche',
  'cat': 'Öffentliche Gebäude',
  'ground': 'grass',
  'anim': False,
  'path': None},
 {'key': 'feuerwehr',
  'label': 'Feuerwehr',
  'cat': 'Öffentliche Gebäude',
  'ground': 'grass',
  'anim': False,
  'path': None},
 {'key': 'holzfaeller',
  'label': 'Holzfäller',
  'cat': 'Rohstoffbetriebe',
  'ground': 'grass',
  'anim': True,
  'path': 10.5},
 {'key': 'fischerhuette',
  'label': 'Fischerhütte',
  'cat': 'Rohstoffbetriebe',
  'ground': 'sand',
  'anim': True,
  'path': None},
 {'key': 'steinbruch',
  'label': 'Steinbruch',
  'cat': 'Rohstoffbetriebe',
  'ground': 'gravel',
  'anim': True,
  'path': None},
 {'key': 'eisenmine',
  'label': 'Eisenmine',
  'cat': 'Rohstoffbetriebe',
  'ground': 'gravel',
  'anim': True,
  'path': None},
 {'key': 'bauernhof',
  'label': 'Bauernhof',
  'cat': 'Rohstoffbetriebe',
  'ground': 'grass',
  'anim': True,
  'path': None},
 {'key': 'schaeferei',
  'label': 'Schäferei',
  'cat': 'Rohstoffbetriebe',
  'ground': 'grass',
  'anim': True,
  'path': 8.5},
 {'key': 'hopfenfarm',
  'label': 'Hopfenfarm',
  'cat': 'Rohstoffbetriebe',
  'ground': 'grass',
  'anim': True,
  'path': 7.5},
 {'key': 'weingut',
  'label': 'Weingut',
  'cat': 'Rohstoffbetriebe',
  'ground': 'grass',
  'anim': True,
  'path': 10.5},
 {'key': 'gewuerzplantage',
  'label': 'Gewürzplantage',
  'cat': 'Rohstoffbetriebe',
  'ground': 'grass',
  'anim': True,
  'path': 7.5},
 {'key': 'imkerei',
  'label': 'Imkerei',
  'cat': 'Rohstoffbetriebe',
  'ground': 'grass',
  'anim': True,
  'path': 7.5},
 {'key': 'obsthof',
  'label': 'Obsthof',
  'cat': 'Rohstoffbetriebe',
  'ground': 'grass',
  'anim': True,
  'path': 7.5},
 {'key': 'schweinehof',
  'label': 'Schweinehof',
  'cat': 'Rohstoffbetriebe',
  'ground': 'grass',
  'anim': True,
  'path': 8.5},
 {'key': 'blumenhof',
  'label': 'Blumenhof',
  'cat': 'Rohstoffbetriebe',
  'ground': 'grass',
  'anim': True,
  'path': None},
 {'key': 'goldwaescherei',
  'label': 'Goldwäscherei',
  'cat': 'Rohstoffbetriebe',
  'ground': 'sand',
  'anim': True,
  'path': None},
 {'key': 'saegewerk',
  'label': 'Sägewerk',
  'cat': 'Verarbeitende Produktionsstätten',
  'ground': 'grass',
  'anim': True,
  'path': None},
 {'key': 'muehle',
  'label': 'Mühle',
  'cat': 'Verarbeitende Produktionsstätten',
  'ground': 'grass',
  'anim': True,
  'path': None},
 {'key': 'baeckerei',
  'label': 'Bäckerei',
  'cat': 'Verarbeitende Produktionsstätten',
  'ground': 'grass',
  'anim': True,
  'path': 18.5},
 {'key': 'weberei',
  'label': 'Weberei',
  'cat': 'Verarbeitende Produktionsstätten',
  'ground': 'grass',
  'anim': True,
  'path': 11.5},
 {'key': 'brauerei',
  'label': 'Brauerei',
  'cat': 'Verarbeitende Produktionsstätten',
  'ground': 'grass',
  'anim': True,
  'path': 17.5},
 {'key': 'kelterei',
  'label': 'Kelterei',
  'cat': 'Verarbeitende Produktionsstätten',
  'ground': 'grass',
  'anim': True,
  'path': None},
 {'key': 'eisenschmelze',
  'label': 'Eisenschmelze',
  'cat': 'Verarbeitende Produktionsstätten',
  'ground': 'gravel',
  'anim': True,
  'path': None},
 {'key': 'schmiede',
  'label': 'Schmiede',
  'cat': 'Verarbeitende Produktionsstätten',
  'ground': 'grass',
  'anim': True,
  'path': 8.5},
 {'key': 'mosterei',
  'label': 'Mosterei',
  'cat': 'Verarbeitende Produktionsstätten',
  'ground': 'grass',
  'anim': True,
  'path': 7.5},
 {'key': 'seifensiederei',
  'label': 'Seifensiederei',
  'cat': 'Verarbeitende Produktionsstätten',
  'ground': 'grass',
  'anim': True,
  'path': 8.5},
 {'key': 'tischlerei',
  'label': 'Tischlerei',
  'cat': 'Verarbeitende Produktionsstätten',
  'ground': 'grass',
  'anim': True,
  'path': 10.5},
 {'key': 'parfuemerie',
  'label': 'Parfümerie',
  'cat': 'Verarbeitende Produktionsstätten',
  'ground': 'grass',
  'anim': True,
  'path': 14.5},
 {'key': 'juwelier',
  'label': 'Juwelier',
  'cat': 'Verarbeitende Produktionsstätten',
  'ground': 'grass',
  'anim': True,
  'path': 14.5},
 {'key': 'ackerflaeche',
  'label': 'Ackerfläche',
  'cat': 'Betriebsflächen',
  'ground': 'none',
  'anim': False,
  'path': None},
 {'key': 'tiergehege',
  'label': 'Tiergehege',
  'cat': 'Betriebsflächen',
  'ground': 'none',
  'anim': True,
  'path': None},
 {'key': 'blumenwiese',
  'label': 'Blumenwiese',
  'cat': 'Betriebsflächen',
  'ground': 'none',
  'anim': False,
  'path': None}]

NATIVE_TILES = {
    'siedlerhaus': (3, 3), 'buergerhaus': (3, 3), 'patrizierhaus': (3, 3),
    'lagerhaus': (5, 5), 'segelschiffwerft': (5, 5), 'marktplatz': (5, 5),
    'holzfaeller': (3, 3), 'fischerhuette': (3, 3), 'steinbruch': (5, 3),
    'eisenmine': (3, 3), 'bauernhof': (5, 5), 'schaeferei': (5, 3),
    'hopfenfarm': (5, 3), 'weingut': (5, 3), 'gewuerzplantage': (5, 5),
    'saegewerk': (5, 3), 'muehle': (3, 3), 'baeckerei': (3, 3),
    'weberei': (5, 3), 'brauerei': (5, 5), 'kelterei': (3, 3),
    'eisenschmelze': (5, 3), 'schmiede': (5, 3), 'kapelle': (3, 3),
    'kirche': (5, 5), 'feuerwehr': (3, 3),
    'ackerflaeche': (1, 1), 'tiergehege': (2, 3), 'blumenwiese': (1, 1)
}
SPR += [{'key':'depot','label':'Depot','cat':'Lager und Hafen','ground':'gravel','anim':False,'path':None}]
SPR += [{'key':'lehmgrube','label':'Lehmgrube','cat':'Rohstoffe','ground':'gravel','anim':True,'path':None},
        {'key':'ziegelei','label':'Ziegelei','cat':'Veredelung','ground':'gravel','anim':True,'path':None}]
SPR += [{'key':'acker_'+crop,'label':label,'cat':'Betriebsflächen','ground':'dirt','anim':False,'path':None} for crop,label in [('getreide','Getreidefeld'),('hopfen','Hopfenfeld'),('trauben','Weinfeld'),('gewuerz','Gewürzfeld'),('obst','Obstgarten'),('blumen','Blumenfeld')]]
SPR += [{'key':'icon_lehm','label':'Lehm','cat':'Waren','ground':'none','anim':False,'path':None},
        {'key':'icon_ziegel','label':'Ziegel','cat':'Waren','ground':'none','anim':False,'path':None}]
SPR += [{'key':'deposit_lehm','label':'Unbebautes Lehmvorkommen','cat':'Vorkommen','ground':'none','anim':False,'path':None}]
SPR += [{'key':'forschung','label':'Forschungsstube','cat':'Öffentliche Gebäude','ground':'grass','anim':True,'path':None}]
SPR += [{'key':'ruine','label':'Gebäuderuine','cat':'Ruinen','ground':'gravel','anim':True,'path':None},
        {'key':'acker_ruine','label':'Verbranntes Ackerland','cat':'Betriebsflächen','ground':'none','anim':True,'path':None}]
NATIVE_TILES['acker_ruine']=(1,1)
NATIVE_TILES.update({entry['key']:(1,1) for entry in SPR if entry['key'].startswith('acker_')})
NATIVE_TILES.update({'icon_lehm':(1,1),'icon_ziegel':(1,1)})
NATIVE_TILES['deposit_lehm']=(3,3)

def native_dimensions(e):
    tw, th = NATIVE_TILES.get(e['key'], (5, 5) if e['key'].startswith('kontor_') else (3, 3))
    extra = 0 if e['cat'] in ('Betriebsflächen','Waren','Vorkommen') else max(12, th * 5)
    return tw * 16, th * 16 + extra, tw, th

class NativePainter:
    def __init__(self, w, h):
        from pixlib import PALETTE
        self.palette = PALETTE
        self.w, self.h = w, h
        self.brick_roof = True
        self.im = Image.new('RGBA', (w,h))
        self.d = ImageDraw.Draw(self.im)
    def color(self, c): return self.palette.get(c, c)
    def rect(self, x, y, w, h, c):
        if w>0 and h>0:self.d.rectangle((round(x),round(y),round(x+w-1),round(y+h-1)),fill=self.color(c))
    def line(self, points, c, width=1):
        self.d.line([(round(x),round(y)) for x,y in points],fill=self.color(c),width=width)
    def poly(self, points, c, border=None):
        self.d.polygon([(round(x),round(y)) for x,y in points],fill=self.color(c),outline=self.color(border) if border else None)
    def oval(self, x,y,w,h,c,border=None):
        self.d.ellipse((round(x),round(y),round(x+w-1),round(y+h-1)),fill=self.color(c),outline=self.color(border) if border else None)
    def px(self,x,y,c):self.rect(x,y,1,1,c)
    def ground(self,kind='grass'):
        family=('g1','g2','g3') if kind=='grass' else ('sd1','sd2','cr2') if kind=='sand' else ('st1','st2','st3')
        top=round(self.h*.73);cx=(self.w-1)/2;cy=(top+self.h-1)/2;rx=self.w*.52;ry=(self.h-top)/2+.5
        for y in range(top,self.h):
            for x in range(self.w):
                v=abs((x-cx)/rx)**3+abs((y-cy)/ry)**3
                if v>1 or (v>.55 and (BAYER[y%4][x%4]+.5)/16 < (v-.55)/.45):continue
                q=hsh(x,y)
                self.px(x,y,family[0] if q%11==0 else family[2] if q%17==0 else family[1])
    def crate(self,x,y,w=7,h=6):
        self.rect(x,y,w,h,'w1');self.rect(x+1,y+1,w-2,h-2,'w3');self.line([(x+1,y+1),(x+w-2,y+h-2)],'w2');self.line([(x+w-2,y+1),(x+1,y+h-2)],'w2')
    def barrel(self,x,y,w=6,h=8):
        self.oval(x,y,w,h,'w1');self.rect(x+1,y+1,w-2,h-2,'w3');self.line([(x+2,y+1),(x+2,y+h-2)],'w4')
        for yy in (y+2,y+h-3):self.rect(x,yy,w,1,'iron')
    def window(self,x,y,w=5,h=6,lit=False):
        self.rect(x-1,y-1,w+2,h+2,'w1');self.rect(x,y,w,h,'th2' if lit else 'wa1');self.rect(x+1,y+1,max(1,w-2),max(1,h-2),'th3' if lit else 'wa2')
        self.line([(x+w//2,y),(x+w//2,y+h-1)],'cr2');self.line([(x,y+h//2),(x+w-1,y+h//2)],'cr2');self.rect(x-1,y+h,w+2,1,'cr3')
    def door(self,x,y,w=7,h=12,arch=False):
        if arch:self.oval(x-1,y-2,w+2,6,'st3');self.oval(x,y-1,w,5,'w1')
        self.rect(x-1,y,w+2,h,'st3');self.rect(x,y,w,h,'w1');self.rect(x+1,y+1,w-2,h-1,'w2')
        for xx in range(round(x+2),round(x+w-1),3):self.line([(xx,y+1),(xx,y+h-1)],'w3')
        self.px(x+w-2,y+h//2,'gold')
    def roof(self,x,y,w,h,family='rr'):
        if family == 'rr' and not self.brick_roof: family = 'bl'
        self.poly([(x,y+h),(x+5,y),(x+w-8,y),(x+w,y+h)],family+'1','ol')
        for yy in range(1,h):
            inset=round(5*(1-yy/h))
            for xx in range(inset+1,w-inset):
                c=family+'2'
                if yy%3==2:c=family+'1'
                elif (xx+(yy//3%2)*2)%5==0:c=family+'3'
                self.px(x+xx,y+yy,c)
        self.line([(x+5,y),(x+w-8,y)],family+'3');self.rect(x-1,y+h,w+2,2,'w1')
    def block(self,x,y,w,h,roofh=14,roof='rr',wall='plaster',timber=False):
        self.rect(x,y+roofh,w,h,'ol')
        for yy in range(h-1):
            for xx in range(1,w-1):
                q=hsh(xx,yy)
                if wall=='wood':c='w2' if xx%4==0 else 'w3' if q%13 else 'w4'
                elif wall=='stone':c='st1' if yy%4==3 or (xx+(yy//4%2)*3)%7==0 else 'st2' if q%9 else 'st3'
                elif wall=='brick':c='rr1' if yy%3==2 or (xx+(yy//3%2)*2)%6==0 else 'rr2'
                else:c='cr2' if q%17 else 'cr3' if q%2 else 'cr1'
                self.px(x+xx,y+roofh+yy,c)
        self.rect(x+w-4,y+roofh,3,h-1,'w2' if wall=='wood' else 'cr1' if wall=='plaster' else 'st1')
        if timber:
            for xx in (x+1,x+w//2,x+w-5):self.rect(xx,y+roofh,2,h,'w1')
            self.rect(x,y+roofh+h//2,w-3,2,'w1')
            self.line([(x+2,y+roofh+2),(x+w//2-1,y+roofh+h//2-1)],'w2')
            self.line([(x+w//2+2,y+roofh+h//2+2),(x+w-6,y+roofh+h-2)],'w2')
        self.roof(x-1,y,w+2,roofh,roof)
    def tree(self,x,y,fruit=False):
        self.rect(x+6,y+9,2,13,'w2');self.oval(x,y,15,15,'g0')
        for yy in range(y+1,y+14):
            for xx in range(x+1,x+14):
                if (xx-x-7)**2+(yy-y-7)**2<43:
                    q=hsh(xx,yy);self.px(xx,yy,'g3' if q%8==0 else 'g1' if q%3==0 else 'g2')
        if fruit:
            for dx,dy in ((4,5),(9,4),(7,10)):self.rect(x+dx,y+dy,2,2,'rr2')
    def animal(self,x,y,pig=False,frame=0):
        stride=(frame//2)%2
        self.rect(x+stride,y+4,1,3,'w1');self.rect(x+5-stride,y+4,1,3,'w1')
        self.oval(x-1,y,8,5,'pk2' if pig else 'cr3');self.rect(x+5,y+1,3,3,'pk1' if pig else 'w2');self.px(x+6,y+1,'ol')
        if frame%2:self.px(x-2,y+1,'pk3' if pig else 'cr2')
    def smoke(self,x,y,frame):
        for i in range(3):
            offset=(frame+i)%4;self.rect(x+offset//2,y-i*5-offset,2+i%2,2,'st3' if i<2 else 'st4')
    def worker(self,x,y,frame):
        self.rect(x,y,3,3,'cr2');self.rect(x-1,y+3,5,5,'bl2');self.rect(x,y+8,1,3,'w1');self.rect(x+3,y+8,1,3,'w1')
        self.line([(x+4,y+4),(x+6,y+3-frame%3)],'cr2')

def native_blueprint(e,f=0,brick_roof=True):
    w,h,tw,th=native_dimensions(e);p=NativePainter(w,h);key=e['key'];floor=h-7
    p.brick_roof = brick_roof
    if key=='deposit_lehm':
        p.poly([(2,22),(6,12),(16,8),(26,10),(38,7),(45,17),(46,28),(40,41),(27,44),(17,41),(6,44),(2,33)],'g1')
        p.poly([(4,24),(8,14),(17,11),(27,13),(37,10),(43,18),(42,28),(37,38),(26,41),(16,38),(8,40),(5,32)],'w1')
        p.poly([(7,23),(10,16),(19,13),(28,16),(36,13),(40,19),(39,29),(34,36),(25,38),(16,35),(9,36)],'or1')
        p.line([(9,22),(13,18),(20,16),(28,19),(35,16),(38,20)],'or2',2)
        p.line([(10,27),(16,23),(24,25),(33,22),(38,25)],'w4')
        p.poly([(12,30),(17,26),(26,28),(34,25),(37,30),(32,35),(24,36),(18,33)],'w2')
        p.poly([(17,31),(21,29),(27,31),(29,34),(24,35),(20,33)],'wa1')
        p.line([(20,31),(25,32)],'wa2')
        for i in range(45):
            x=8+hsh(i,9)%30;y=14+hsh(i,15)%24
            if p.im.getpixel((x,y))[:3] in (tuple(bytes.fromhex(p.color('or1')[1:])),tuple(bytes.fromhex(p.color('w2')[1:]))):p.rect(x,y,2,1,'or2' if i%3 else 'w1')
        for x,y in ((5,20),(8,39),(39,15),(40,34),(28,42)):
            p.rect(x,y,2,3,'g2');p.px(x+1,y-1,'g3')
        for x,y in ((10,31),(32,18),(34,34)):
            p.oval(x,y,4,3,'w1');p.rect(x+1,y,2,1,'or2')
        return p.im
    if key=='icon_lehm':
        p.poly([(1,12),(3,8),(7,8),(9,12),(7,15),(2,15)],'w1','ol')
        p.poly([(2,12),(4,9),(6,9),(8,12),(6,14),(2,14)],'or1')
        p.line([(3,11),(5,10),(7,11)],'w4')
        p.poly([(7,14),(8,8),(11,6),(15,9),(15,13),(12,15)],'w2','ol')
        p.poly([(8,11),(10,7),(12,7),(14,10),(12,12)],'or2')
        p.line([(10,8),(12,8),(13,9)],'w4');p.line([(11,11),(10,13),(13,13)],'or1')
        p.poly([(4,9),(4,5),(7,2),(11,3),(12,6),(9,10)],'w1','ol')
        p.poly([(5,7),(5,5),(7,3),(10,4),(11,6),(8,8)],'or2')
        p.line([(6,5),(8,4),(10,5)],'w4');p.line([(7,7),(8,6),(9,7)],'or1')
        p.px(3,13,'w4');p.px(14,12,'w4');return p.im
    if key=='icon_ziegel':
        for x,y in ((1,10),(8,10),(4,6),(8,2)):
            p.poly([(x,y+1),(x+4,y),(x+6,y+2),(x+6,y+5),(x+2,y+6),(x,y+4)],'rr1','ol')
            p.poly([(x+1,y+2),(x+4,y+1),(x+5,y+2),(x+2,y+3)],'rr3')
            p.poly([(x+1,y+3),(x+2,y+4),(x+2,y+5),(x+1,y+4)],'rr2')
            p.poly([(x+3,y+4),(x+5,y+3),(x+5,y+4),(x+3,y+5)],'rr2')
            p.px(x+4,y+1,'or2')
        return p.im
    # Reservierte Betriebsflächen: eigenes Raster ohne Gebäudegrundstück.
    if key=='ackerflaeche' or (key.startswith('acker_') and key!='acker_ruine'):
        crop='getreide' if key=='ackerflaeche' else key.removeprefix('acker_')
        p.rect(0,0,w,h,'w2')
        for yy in range(h):
            for xx in range(w):
                q=hsh(xx,yy)
                if q%9==0:p.px(xx,yy,'w3')
                elif q%13==0:p.px(xx,yy,'w1')
        if crop=='getreide':
            for y in (3,8,13):
                p.rect(0,y+2,w,1,'w1')
                for x in (2,6,10,14):
                    p.line([(x,y+1),(x,y-2)],'th1');p.px(x,y-2,'th3');p.px(x-1,y-1,'th2');p.px(x+1,y,'th3')
        elif crop=='hopfen':
            for x in (3,11):
                p.rect(x,1,1,14,'w1');p.px(x,1,'w4')
                p.line([(x+1,3),(min(w-1,x+4),3),(x+1,12)],'g1')
                for y in (5,8,11):p.rect(x+1,y,3,2,'g2');p.px(x+2,y,'g3')
            p.line([(3,2),(14,2)],'w3');p.line([(3,13),(14,13)],'w3')
        elif crop=='trauben':
            for y in (4,11):
                p.rect(0,y+2,w,1,'w1');p.line([(1,y-2),(14,y-2)],'w3')
                for x in (2,7,12):
                    p.rect(x,y-2,1,5,'w1');p.oval(x-1,y-1,4,3,'g2');p.px(x,y-1,'g3');p.rect(x+1,y+1,2,2,'pu2');p.px(x+2,y+1,'pu3')
        elif crop=='gewuerz':
            for y in (4,11):
                p.rect(0,y+3,w,1,'w1')
                for x in (3,10):
                    p.oval(x-1,y-2,5,5,'g1');p.oval(x,y-1,3,3,'g2');p.px(x+1,y-1,'g3');p.px(x,y+1,'or2');p.px(x+2,y,'or1')
        elif crop=='obst':
            p.rect(7,8,2,7,'w1');p.px(8,12,'w3');p.oval(2,1,12,11,'g0');p.oval(3,2,10,8,'g1');p.oval(4,2,8,6,'g2')
            for x,y in ((5,4),(9,3),(10,7)):p.rect(x,y,2,2,'rr2');p.px(x,y,'rr3')
            p.px(4,3,'g3');p.px(7,2,'g3');p.px(11,5,'g3');p.rect(5,15,7,1,'w1')
        else:
            for i,(x,y) in enumerate(((3,3),(10,3),(6,8),(13,9),(2,13),(9,14))):
                p.rect(x,y+1,1,2,'g2');p.px(x+1,y+2,'g3');p.rect(x-1,y,3,1,('pk2','pu2','cr3')[i%3]);p.px(x,y-1,('pk3','pu3','th3')[i%3]);p.px(x,y,'th2')
        return p.im
    if key=='tiergehege':
        p.rect(0,0,w,h,'g2')
        for i in range(w*h//10):p.px(hsh(i,1)%w,hsh(i,2)%h,'g1' if i%2 else 'g3')
        for y in (2,h-4):p.rect(1,y,w-2,1,'w3')
        for x in (2,w-3):
            p.rect(x,1,1,h-2,'w2')
            for y in range(1,h,6):p.rect(x-1,y,2,3,'w4')
        step=[0,1,2,1][f%4]
        p.animal(8+step,12,frame=f);p.animal(w-12-step,h//2,frame=f+1);p.animal(7,h-13-step,frame=f+2);return p.im
    if key=='blumenwiese':
        p.rect(0,0,w,h,'g2')
        for i in range(w*h//8):
            x=hsh(i,4)%w;y=hsh(i,5)%h;p.px(x,y,['pk2','cr3','pu2','th3'][i%4])
        return p.im
    ground='gravel' if key in ('steinbruch','eisenmine','eisenschmelze','schmiede','marktplatz','depot','lehmgrube','ziegelei') else 'sand' if key.startswith('kontor_') or key in ('lagerhaus','segelschiffwerft','fischerhuette','goldwaescherei') else 'grass'
    p.ground(ground)
    if key in ('ruine','acker_ruine'):
        field=key=='acker_ruine'
        if field:
            p.rect(0,0,w,h,'w1')
            for y in (3,7,11,15):p.rect(0,y,w,1,'bk')
            for i in range(22):p.px(hsh(i,2)%w,hsh(i,3)%h,'st1')
            sx,sy=8,9
        else:
            p.poly([(3,47),(8,38),(37,39),(45,51),(37,60),(5,58)],'st1','ol')
            p.rect(7,31,4,25,'st2');p.rect(8,29,2,27,'st3')
            p.poly([(11,41),(15,34),(17,40),(22,38),(25,46),(37,44),(39,55),(11,55)],'st2','st1')
            p.rect(34,26,6,28,'st1');p.rect(35,24,4,30,'st2')
            for y in range(29,54,4):p.rect(35,y,4,1,'st3')
            p.line([(12,54),(28,41)],'bk',3);p.line([(17,54),(30,44)],'w1',2)
            for i in range(30):
                x=5+hsh(i,1)%37;y=49+hsh(i,4)%10
                p.rect(x,y,2,2,'st3' if i%3 else 'bk')
            sx,sy=24,36
        # Vier Rauchphasen; das Spiel hält bei reduzierter Bewegung ein Bild an.
        for i in range(3):
            rise=(f*2+i*5)%13;size=3+i
            p.oval(sx-2+((f+i)%3-1),sy-rise-i*3,size,size,'st2' if i%2 else 'st1')
        return p.im
    if key=='forschung':
        # Bibliothek mit Ziegeldach, Beobachtungsturm und offenem Studiertisch.
        p.block(4,15,36,29,15,'rr','plaster',True)
        p.rect(4,57,36,3,'st1');p.rect(5,57,34,1,'st3')
        p.door(18,43,8,14,True)
        p.window(8,36,6,8,True);p.window(29,36,6,8,True)
        p.rect(7,45,8,2,'st3');p.rect(28,45,8,2,'st3')
        p.block(31,7,12,24,8,'rr','stone')
        p.window(34,20,5,7,True);p.rect(30,38,14,2,'st1')
        p.line([(36,7),(36,2)],'iron');p.px(36,1,'gold')
        # Messingteleskop auf einem Stativ vor dem Turm.
        p.line([(39,48),(36,57)],'w1');p.line([(39,48),(43,57)],'w1')
        shift=[0,1,2,1][f%4]
        p.line([(36,47),(43,43-shift)],'w1',3)
        p.line([(36,46),(43,42-shift)],'gold',2);p.px(43,42-shift,'wa3')
        # Bücher, Schriftrollen und wandernde Feder am Arbeitstisch.
        p.rect(3,51,13,3,'w1');p.rect(4,50,11,2,'w4')
        p.rect(4,54,2,5,'w2');p.rect(13,54,2,5,'w2')
        p.rect(5,47,8,3,'cr3');p.rect(8,47,1,3,'w3')
        p.line([(6,48),(7,48)],'w2');p.line([(10,48),(11,48)],'w2')
        p.line([(10+f%2,48),(12+f%2,44)],'cr3');p.px(12+f%2,44,'w1')
        for i,c in enumerate(('bl2','pu2','w3')):
            p.rect(3,45-i*2,4,2,c);p.rect(4,45-i*2,2,1,'cr2')
        p.rect(19,32,9,5,'w1');p.rect(20,33,3,3,'cr3');p.rect(24,33,3,3,'cr3')
        p.px(21,34,'w2');p.px(25,34,'w2')
        p.rect(9,39,2,2,('th3','cr3','th2','gold')[f%4])
        # Ein Gelehrter bewegt sich zwischen Tisch und Eingang.
        x=16+[0,1,2,1][f%4];y=51
        p.rect(x,y,2,2,'cr2');p.rect(x,y+2,2,3,'pu2')
        p.rect(x+f%2,y+5,1,2,'w1');p.px(x+1-f%2,y+5,'w1')
        return p.im
    if key=='lehmgrube':
        # Gestufter Abbau, hölzerner Fördergalgen und gedeckte Gerätehütte.
        p.poly([(3,43),(9,36),(28,36),(32,45),(27,57),(7,57)],'w1','ol')
        p.poly([(5,43),(10,38),(26,38),(29,45),(25,55),(8,55)],'or1')
        p.line([(7,44),(11,40),(25,40),(27,44)],'w4')
        p.poly([(9,46),(13,43),(23,43),(25,47),(22,53),(12,53)],'w2')
        p.line([(10,48),(14,45),(23,45)],'or2')
        for x,y in ((12,48),(16,50),(20,47),(21,51),(8,44)):p.rect(x,y,2,1,'or2' if x%2 else 'w4')
        p.block(30,25,14,15,8,'bl','wood');p.door(35,40,6,10)
        p.rect(25,23,2,32,'w1');p.rect(26,24,1,30,'w4')
        p.rect(12,23,18,3,'w1');p.rect(12,23,18,1,'w4')
        p.line([(26,35),(18,26)],'w2',2);p.oval(15,24,4,4,'iron');p.px(16,25,'st3')
        bucket_y=35+[0,2,4,2][f%4]
        p.line([(16,28),(16,bucket_y)],'cr1');p.rect(13,bucket_y,7,5,'iron');p.rect(14,bucket_y+1,5,3,'w3');p.rect(14,bucket_y,5,1,'or2')
        p.line([(24,40),(29,40-f%2)],'iron');p.oval(23,39,3,3,'w4')
        p.worker(31,floor-13,f);p.line([(36,floor-7),(39-f%2,floor-2)],'w1');p.rect(38-f%2,floor-3,3,2,'st2')
        p.crate(3,32,7,6);p.barrel(40,51,5,7)
        p.oval(3,54,7,4,'or1');p.line([(4,55),(7,55)],'or2')
        return p.im
    if key=='ziegelei':
        # Brennhaus, gemauerter Schornstein, Trockenregal und Ziegeltransport.
        p.block(4,26,29,24,10,'rr','brick')
        p.rect(35,18,7,34,'rr1');p.rect(36,19,5,32,'rr2')
        for y in range(20,49,3):p.line([(36,y),(40,y)],'rr1');p.px(38+(y%2),y-1,'rr3')
        p.rect(34,16,9,3,'st1');p.rect(35,16,7,1,'st3');p.smoke(37,14,f)
        p.oval(15,40,12,13,'st1');p.oval(17,41,8,10,'bk');p.rect(17,47,8,6,'bk')
        p.rect(18,48,6,4,'or1');p.rect(19+f%2,47-f%2,2,5,'or2');p.rect(22-f%2,49,2,3,'or3')
        p.line([(16,53),(26,53)],'st3');p.rect(5,39,7,12,'w1')
        for y in (41,45,49):p.rect(6,y,5,1,'w3')
        p.window(28,39,4,5,True)
        p.rect(2,53,10,6,'w1')
        for y in (53,56):
            for x in (3,7):p.rect(x,y,3,2,'rr2');p.rect(x,y,3,1,'rr3')
        p.rect(31,53,12,5,'w2');p.rect(30,52,14,1,'w4')
        for x in (32,36,40):p.rect(x,51,3,2,'rr2');p.px(x,51,'rr3')
        cart_x=12+[0,1,2,1][f%4]
        p.rect(cart_x,56,9,3,'w3');p.rect(cart_x+1,55,7,1,'rr2');p.oval(cart_x+1,59,3,3,'iron');p.oval(cart_x+7,59,3,3,'iron')
        p.line([(cart_x+9,57),(cart_x+13,55)],'w1');p.worker(cart_x+13,49,f)
        return p.im
    if key=='depot':
        p.block(4,15,w-10,27,12,'rr','stone')
        for x in (9,w-19):p.window(x,32,5,6)
        p.rect(4,40,w-10,2,'w1');p.rect(5,41,w-12,1,'w3')
        p.door(13,floor-17,13,17)
        p.line([(14,floor-15),(24,floor-4)],'w4');p.line([(24,floor-15),(14,floor-4)],'w3')
        p.rect(12,floor+1,16,2,'st1');p.rect(11,floor+3,18,1,'st3')
        p.block(w-16,floor-23,12,14,9,'rr','wood')
        p.door(w-12,floor-11,5,11);p.window(6,34,4,6,True)
        p.line([(w-3,floor),(w-3,24),(w-12,24)],'w1',2);p.line([(w-12,25),(w-12,35)],'iron')
        p.crate(w-16,36,8,6);p.crate(2,floor-4,8,7);p.crate(4,floor-10,6,6);p.barrel(w-8,floor-4,6,8)
        p.rect(27,33,3,4,'w1');p.rect(28,34,1,2,'th3');p.line([(26,32),(29,32)],'iron')
        p.rect(12,27,15,3,'w2');p.rect(13,28,13,1,'w4')
        return p.im
    if key in ('siedlerhaus','buergerhaus','patrizierhaus'):
        tier=('siedlerhaus','buergerhaus','patrizierhaus').index(key)+1
        bw=w-14;rh=14+tier*2;bh=22+tier*2;y=floor-bh-rh
        p.block(7,y,bw,bh,rh,'th' if tier==1 else 'rr','wood' if tier==1 else 'plaster' if tier==2 else 'stone',tier==2)
        p.door(w//2-3,floor-12,6,12,tier==3)
        for x in (11,w-17):p.window(x,floor-20,4,5,tier==1)
        if tier>1:
            for x in (12,w-18):p.window(x,floor-32,4,5)
            p.rect(w-15,y+4,4,10,'rr1');p.rect(w-16,y+3,6,2,'st2')
        if tier==3:
            p.block(w//2-7,y+3,13,3,6,'rr','plaster');p.window(w//2-2,y+10,4,4)
            p.rect(w//2-5,floor+1,11,2,'st3');p.rect(w//2-7,floor+3,15,1,'st2')
        p.barrel(3,floor-5,5,6);return p.im
    if key.startswith('kontor_') or key=='lagerhaus':
        level=int(key[-1]) if key.startswith('kontor_') else 1
        p.block(9,12,w-21,39,25,'rr' if key=='lagerhaus' else 'bl','stone',False)
        for x in (16,35,54):
            p.door(x,floor-22,12,20,True);p.window(x+2,43,6,7)
        p.rect(4,floor+1,w-8,5,'w2')
        for x in range(4,w-4,4):p.rect(x,floor+1,1,5,'w4')
        p.crate(3,floor-6,9,7);p.crate(12,floor-3,6,5);p.barrel(w-9,floor-8)
        if key.startswith('kontor_'):
            p.line([(w-15,floor),(w-15,17),(w-35,17)],'w1',2);p.line([(w-35,17),(w-35,33+f)],'iron')
            p.crate(w-39,34+f,8,7);p.poly([(w-14,18),(w-4,20),(w-14,24)],'rr2')
            if level>=2:p.block(3,21,15,20,13,'bl','plaster');p.window(7,37,5,6)
            if level>=3:p.block(w-23,4,16,31,16,'bl','stone');p.window(w-18,24,5,7)
            if level>=4:p.rect(w//2,4,2,14,'w1');p.poly([(w//2+2,4),(w//2+13,6),(w//2+2,10)],'rr2')
        return p.im
    if key=='segelschiffwerft':
        p.block(3,20,30,35,17,'rr','wood',True)
        p.poly([(36,floor-1),(w-4,floor-1),(w-7,floor-29),(w-18,floor-38),(40,floor-29)],'w1')
        for y in range(floor-27,floor-1,4):p.line([(40,y),(w-9,y)],'w3',2)
        p.line([(w-9,floor-8),(w-9,8),(42,10)],'w1',2);p.line([(42,10),(42,34)],'iron')
        p.worker(35,floor-13,f);p.crate(4,floor-5);return p.im
    if key in ('kirche','kapelle'):
        big=key=='kirche';bw=w-18;bh=30 if big else 23;rh=17
        p.block(9,floor-bh-rh,bw,bh,rh,'bl','stone')
        towerw=19 if big else 11;tx=w//2-towerw//2;ty=3 if big else 7
        # Der Turm überlappt das Kirchenschiff ohne transparente Fuge.
        towerh=max(34,floor-bh-rh-ty-12+2) if big else 19
        p.block(tx,ty,towerw,towerh,12,'bl','stone')
        p.window(tx+4,ty+17,towerw-8,8,True);p.door(w//2-4,floor-17,8,17,True)
        p.line([(w//2,0),(w//2,7)],'w1');p.line([(w//2-3,2),(w//2+3,2)],'w1')
        if big:
            for x in (13,w-20):p.window(x,floor-24,7,10)
        return p.im
    if key=='marktplatz':
        p.poly([(4,28),(w-6,28),(w-2,floor+2),(2,floor+2)],'st2','st1')
        for y in range(30,floor+1,4):
            for x in range(5,w-5,6):
                xx=x+(y//4%2)*3
                p.line([(xx,y),(min(w-4,xx+4),y)],'st3');p.px(xx+1,y+1,'st1')
        cx=w//2;cy=floor-37
        p.oval(cx-8,cy+1,17,10,'st1');p.oval(cx-7,cy,15,8,'st3');p.oval(cx-5,cy+1,11,5,'wa1');p.line([(cx-3,cy+2),(cx+3,cy+2)],'wa3')
        p.rect(cx-1,cy-8,3,10,'st1');p.rect(cx,cy-7,1,8,'st3');p.oval(cx-3,cy-9,7,4,'st3');p.line([(cx-2,cy-7),(cx-4,cy+2)],'wa2')
        for i,(x,y) in enumerate(((7,25),(w-34,29),(9,floor-23),(w-34,floor-23))):
            family=('cu','bl','th','cr')[i]
            p.rect(x,y+7,26,15,'w1');p.rect(x+2,y+11,22,10,'w2')
            for xx in range(26):p.rect(x+xx,y,1,8,family+'3' if xx//4%2 else family+'2')
            p.line([(x-1,y),(x+26,y)],family+'1');p.rect(x-1,y+8,28,2,'w1')
            for xx in (x,x+25):p.rect(xx,y+1,1,22,'w1');p.px(xx,y+21,'w4')
            p.rect(x+1,y+18,24,2,'w3');p.line([(x+2,y+11),(x+23,y+11)],'w4')
            for j,dx in enumerate((3,10,17)):
                p.rect(x+dx,y+12,6,5,'w1');p.rect(x+dx+1,y+13,4,3,'w3')
                if i==0:
                    p.oval(x+dx,y+11,6,3,'g2' if j%2 else 'rr2');p.px(x+dx+2,y+11,'g3' if j%2 else 'rr3')
                elif i==1:
                    p.line([(x+dx,y+13),(x+dx+4,y+13)],'wa3');p.px(x+dx+4,y+12,'wa2');p.px(x+dx+1,y+14,'cr3')
                elif i==2:
                    p.oval(x+dx,y+11,6,4,'th2');p.line([(x+dx+1,y+12),(x+dx+3,y+12)],'th3')
                else:
                    p.rect(x+dx,y+11,5,5,('pu2','bl2','cr2')[j]);p.rect(x+dx+1,y+11,3,1,('pu3','bl3','cr3')[j])
            p.line([(x+2,y+20),(x+23,y+20)],'w4')
        p.barrel(3,floor-7);p.crate(w-10,floor-5,7,6);p.crate(w-11,floor-11,6,6)
        # Schlichte Besucher, jeweils exakt zwei Pixel breit und sieben hoch.
        step=[0,3,6,3][f%4]
        for i,(x,y,dx,dy) in enumerate(((cx-4,cy+13,0,1),(cx+4,cy+27,0,-1),(20,55,1,0),(55,56,-1,0),(37,83,0,-1))):
            x+=dx*step;y+=dy*step
            leg=([0,1,0,0][f%4]+i)%2
            p.rect(x,y,2,2,'cr2');p.rect(x,y+2,2,3,('bl2','pu2','cu2','w3','cr1')[i]);p.rect(x+leg,y+5,1,2,'w1');p.px(x+1-leg,y+5,'w1')
        p.rect(cx-10,14,21,7,'w1');p.rect(cx-9,15,19,5,'w3');p.oval(cx-4,15,8,4,'th2');p.px(cx,15,'th3')
        p.line([(cx-9,21),(cx-9,29)],'w1');p.line([(cx+9,21),(cx+9,29)],'w1')
        return p.im
    if key=='feuerwehr':
        p.block(5,10,w-10,26,16,'rr','brick')
        for x in (9,w-22):p.door(x,floor-19,11,17,True)
        p.rect(w//2-3,14,6,13,'st3');p.window(w//2-2,17,4,5)
        p.oval(3,floor-4,6,6,'iron');p.oval(16,floor-4,6,6,'iron');p.rect(5,floor-9,15,6,'rr2');p.barrel(w-9,floor-6)
        return p.im
    if key in ('eisenmine','steinbruch'):
        p.poly([(2,floor),(6,24),(w//3,12),(w*2//3,18),(w-5,30),(w-2,floor)],'st2','st1')
        for i in range(w*2):
            x=3+hsh(i,3)%(w-6);y=24+hsh(i,7)%max(1,floor-25)
            if p.im.getpixel((x,y))[3]:p.line([(x,y),(min(w-4,x+3),y-1)],'st3' if i%3 else 'st1')
        x=w//2-9;p.oval(x-2,floor-26,22,28,'w1');p.rect(x,floor-22,18,23,'bk')
        for xx in (x-1,x+17):p.rect(xx,floor-23,2,24,'w3')
        p.rect(x-2,floor-25,22,3,'w4')
        for xx in (x+5,x+13):p.line([(xx,floor-14),(xx+2,floor+4)],'iron')
        p.rect(x+4+f,floor-10,10,6,'w3');p.oval(x+4+f,floor-5,3,3,'iron');p.oval(x+11+f,floor-5,3,3,'iron')
        return p.im
    if key=='muehle':
        cx=w//2;p.poly([(cx-9,floor),(cx+10,floor),(cx+6,23),(cx-5,23)],'cr2','st1')
        for y in range(26,floor,4):p.line([(cx-6,y),(cx+6,y)],'cr1')
        p.roof(cx-8,11,17,12,'rr');p.door(cx-3,floor-10,6,10)
        hub=(cx,25)
        for i in range(4):
            angle=math.pi/2*i+f*math.pi/8;dx,dy=math.cos(angle),math.sin(angle);nx,ny=-dy,dx
            points=[(cx+dx*u+nx*v,25+dy*u+ny*v) for u,v in ((3,-2),(17,-2),(17,2),(3,2))]
            p.poly(points,'cr3','w2');p.line([(cx,25),(cx+dx*18,25+dy*18)],'w1')
        p.oval(cx-2,23,4,4,'w4');p.crate(3,floor-4);return p.im
    # Landwirtschaft mit eigenen Gebäuden, Nebenbauten und charakteristischen Geräten.
    rural=('bauernhof','holzfaeller','fischerhuette','schaeferei','hopfenfarm','weingut','gewuerzplantage','imkerei','obsthof','schweinehof','blumenhof')
    if key in rural:
        wide=w>=80;bw=42 if wide else 27;bh=36 if key in ('bauernhof','gewuerzplantage') else 20;rh=25 if key in ('bauernhof','gewuerzplantage') else 14
        p.block(5,floor-bh-rh,bw,bh,rh,'th' if key in ('bauernhof','schaeferei','imkerei') else 'bl' if key=='fischerhuette' else 'rr','wood',True)
        p.door(14,floor-13,8,13);p.window(8,floor-23,5,6,True)
        if key=='bauernhof':
            p.block(w-30,floor-46,23,28,18,'rr','wood');p.door(w-24,floor-16,12,16);p.window(8,floor-39,5,6)
            p.oval(4,floor-5,13,7,'th2');p.line([(5,floor-3),(15,floor-3)],'th3')
        elif key=='holzfaeller':
            for i in range(4):p.rect(5+i,floor-4+i,18,2,'w3');p.oval(21+i,floor-4+i,3,3,'w4')
            p.tree(w-18,floor-32);p.worker(28,floor-10,f)
        elif key=='fischerhuette':
            for y in range(floor-11,floor+1,3):p.line([(w-16,y),(w-3,y)],'wa2')
            for x in range(w-16,w-2,3):p.line([(x,floor-11),(x,floor)],'cr1')
            p.barrel(3,floor-6);p.line([(w-10,floor-19),(w-6,floor-2)],'w2')
        elif key in ('schaeferei','schweinehof'):
            x=w-24
            for yy in (floor-19,floor-1):p.line([(x,yy),(w-3,yy)],'w3')
            for xx in range(x,w-2,5):p.rect(xx,floor-19,1,21,'w1')
            p.animal(x+4,floor-14,key=='schweinehof',f);p.animal(x+11,floor-8,key=='schweinehof',f)
        elif key in ('hopfenfarm','weingut'):
            for x in range(w-30,w-3,6):
                p.rect(x,floor-30,1,30,'w1')
                for y in range(floor-27,floor-2,5):p.line([(x,y),(min(w-3,x+5),y)],'g2');p.px(x+2,y+1,'pu2' if key=='weingut' else 'g3')
        elif key in ('obsthof','gewuerzplantage'):
            p.tree(w-17,floor-36,True)
            if wide:p.tree(w-34,floor-22,True)
            p.crate(w-15,floor-5);p.rect(w-13,floor-6,4,2,'rr2' if key=='obsthof' else 'or2')
        elif key=='imkerei':
            for x,y in ((w-14,floor-18),(w-23,floor-7),(w-10,floor-7)):
                p.rect(x,y,7,7,'th1');p.rect(x+1,y+1,5,5,'th2');p.roof(x-1,y-3,9,3,'w')
                p.rect(x+2,y+5,3,1,'w1');p.px(x-2+f,y+2,'th3')
        elif key=='blumenhof':
            for y in (floor-12,floor-5):
                for x in range(w-18,w-4,4):p.rect(x,y,3,4,'w2');p.px(x+1,y-2,'pk2' if x%2 else 'pu3');p.line([(x+1,y-1),(x+1,y+1)],'g3')
        return p.im
    # Eigenständige Werkstattentwürfe mit erkennbaren Produktionsgeräten.
    bw=w-15;rh=22 if key=='brauerei' else 16;bh=36 if key=='brauerei' else 26;y=floor-bh-rh
    roof='cu' if key in ('brauerei','seifensiederei') else 'bl' if key in ('schmiede','juwelier','weberei') else 'rr'
    p.block(6,y,bw,bh,rh,roof,'stone' if key in ('eisenschmelze','schmiede','seifensiederei','juwelier') else 'plaster',key in ('tischlerei','mosterei','kelterei'))
    p.door(w//2-4,floor-13,8,13);p.window(10,floor-24,6,6,True);p.window(w-19,floor-24,5,6)
    if key in ('eisenschmelze','schmiede','baeckerei','brauerei','seifensiederei','parfuemerie'):
        p.rect(w-18,y-5,5,17,'st1');p.rect(w-19,y-6,7,2,'st3');p.smoke(w-17,y-7,f)
    if key in ('saegewerk','tischlerei'):
        for i in range(4):p.rect(5,floor-4-i*3,w//3,2,'w3');p.rect(5+i*4,floor-4-i*3,2,1,'w4')
        cx=w-17;cy=floor-5;p.oval(cx-6,cy-6,12,12,'st1');p.oval(cx-4,cy-4,8,8,'st3')
        angle=f*math.pi/4;p.line([(cx-math.cos(angle)*5,cy-math.sin(angle)*5),(cx+math.cos(angle)*5,cy+math.sin(angle)*5)],'iron')
        p.worker(w//2+5,floor-10,f)
    elif key=='baeckerei':
        p.rect(4,floor-8,14,6,'w2')
        for x in (5,9,13):p.oval(x,floor-10,4,3,'th2');p.px(x+1,floor-10,'cr3')
    elif key=='weberei':
        for i in range(3):p.rect(5+i*6,floor-15,5,10,['pu2','bl2','cr2'][i]);p.line([(5+i*6,floor-12),(9+i*6,floor-12)],'cr3')
        p.worker(w-19,floor-10,f)
    elif key in ('kelterei','mosterei'):
        x=w-19;p.rect(x,floor-19,12,16,'w1');p.rect(x+2,floor-17,8,11,'w3');p.rect(x+5,floor-23+f%2,2,16,'iron')
        p.barrel(3,floor-6);p.barrel(10,floor-4)
        p.oval(x+3,floor-5,6,3,'pu2' if key=='kelterei' else 'rr2')
    elif key in ('eisenschmelze','schmiede'):
        p.rect(5,floor-11,13,10,'st1');p.oval(7,floor-10,9,9,'bk');p.rect(8,floor-5,7,3,'or1');p.rect(10+f%2,floor-7,3,4,'or2')
        p.rect(w-19,floor-7,14,3,'iron');p.rect(w-14,floor-4,4,4,'st2');p.worker(w//2,floor-10,f)
    elif key in ('brauerei','seifensiederei','parfuemerie'):
        for x in (4,w-12):
            p.barrel(x,floor-10,8,11);p.oval(x+1,floor-11,6,3,'cu2' if key=='brauerei' else 'cr3' if key=='seifensiederei' else 'pu2')
        if key=='parfuemerie':
            p.rect(w//2-8,y+8,16,8,'cr3');p.line([(w//2-4,y+9),(w//2,y+14),(w//2+4,y+9)],'g2');p.px(w//2,y+11,'pk2')
    elif key=='juwelier':
        p.rect(5,floor-9,14,6,'w2');p.oval(8,floor-12,7,7,'gold');p.oval(10,floor-10,3,3,'w1');p.rect(10,floor-13,3,2,'wa3')
    elif key=='goldwaescherei':
        p.rect(4,floor-7,w-8,6,'w2');p.rect(5,floor-6,w-10,3,'wa1')
        for x in range(6,w-7,4):p.line([(x,floor-5),(x+2,floor-5)],'wa2');p.px(x+f%2,floor-4,'gold')
        p.worker(w-15,floor-19,f);p.crate(3,floor-4)
    p.crate(w-9,floor-4,6,5);return p.im

def render_native(e,f=0,brick_roof=True):
    """Vollständig neuer Entwurf, unmittelbar im Raster der Gebäudegrundfläche."""
    im = native_blueprint(e,f,brick_roof)
    if e['anim'] and e['key'] not in ('eisenmine','steinbruch','muehle','holzfaeller','segelschiffwerft','goldwaescherei','lehmgrube','ziegelei','marktplatz','tiergehege','forschung','ruine','acker_ruine'):
        p = NativePainter(*im.size);p.im=im;p.d=ImageDraw.Draw(im)
        p.worker(im.width//2+3,im.height-20,f)
    return im

if __name__ == '__main__':
    import runpy
    runpy.run_path(os.path.join(os.path.dirname(__file__), 'build.py'), run_name='__main__')


