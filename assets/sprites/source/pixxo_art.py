"""Pixxo-Erweiterungen im vorhandenen nativen Raster und mit derselben Palette."""
from pixlib import hsh

DECOR={'blumenkuebel':(1,1),'wegweiser':(1,1),'laterne':(1,1),'lampe':(1,1),'strauch':(1,1),'bank':(2,1),'blumenbeet':(2,1),'baum':(2,2),'brunnen':(2,2),'teich':(3,2),'park':(3,3),'garten':(4,3)}
CHAIN={'kartoffelhof':'Kartoffelhof','brennerei':'Brennerei','rinderhof':'Rinderhof','gerberei':'Gerberei','schuster':'Schuster','kerzenzieherei':'Kerzenzieherei'}
GOODS=['kartoffeln','schnaps','haeute','leder','stiefel','wachs','kerzen']

def register(sprites,dimensions):
    for key,(w,h) in DECOR.items():
        sprites.append(dict(key='deko_'+key,label=key,cat='Dekoration',ground='grass',anim=False,path=None));dimensions['deko_'+key]=(w,h)
    for key,label in CHAIN.items():
        sprites.append(dict(key=key,label=label,cat='Produktion',ground='grass',anim=True,path=None));dimensions[key]=(3,3)
    sprites.append(dict(key='gehege_rinder',label='Rindergehege',cat='Betriebsflächen',ground='grass',anim=True,path=None));dimensions['gehege_rinder']=(2,3)
    sprites.append(dict(key='acker_kartoffeln',label='Kartoffelacker',cat='Betriebsflächen',ground='dirt',anim=False,path=None));dimensions['acker_kartoffeln']=(1,1)
    for good in GOODS:
        sprites.append(dict(key='icon_'+good,label=good,cat='Waren',ground='none',anim=False,path=None));dimensions['icon_'+good]=(1,1)
    for kind,size in [('mine',(3,3)),('steinbruch',(5,3))]:
        for side in ['north','east','south','west']:
            key=kind+'_berg_'+side;sprites.append(dict(key=key,label=key,cat='Abbau',ground='stone',anim=True,path=None));dimensions[key]=size
    sprites.append(dict(key='pixxo_deko',label='Dekoration',cat='Waren',ground='none',anim=False,path=None));dimensions['pixxo_deko']=(1,1)
    sprites.append(dict(key='pixxo_loeschwagen',label='Löschwagen',cat='Waren',ground='none',anim=False,path=None));dimensions['pixxo_loeschwagen']=(1,1)

def render(key,p,f):
    w,h=p.w,p.h;floor=h-5
    if key=='gehege_rinder':
        p.rect(0,0,w,h,'g2')
        for i in range(w*h//12):p.px(hsh(i,1)%w,hsh(i,2)%h,'g1' if i%2 else 'g3')
        for y in [1,h-3]:p.rect(1,y,w-2,2,'w3')
        for x in [1,w-3]:
            p.rect(x,1,2,h-2,'w2')
            for y in range(1,h-2,7):p.rect(x-1,y,3,3,'w4')
        for x,y in [(6+f%2,12),(13-f%2,29)]:
            p.rect(x+1,y+5,2,4,'w1');p.rect(x+8,y+5,2,4,'w1');p.oval(x,y,12,7,'cr2','w1');p.rect(x+3,y+1,4,3,'w2');p.rect(x+9,y+2,5,5,'w2');p.rect(x+12,y+5,3,2,'th2');p.px(x+12,y+3,'bk');p.px(x+9,y+1,'cr3');p.px(x+12,y+1,'cr3')
        return p.im
    if key=='acker_kartoffeln':
        p.rect(0,0,w,h,'w2')
        for y in range(2,h,4):
            p.rect(0,y+2,w,1,'w1')
            for x in range(1,w,4):p.rect(x,y,3,2,'g1');p.px(x+1,y-1,'g3')
        return p.im
    if key=='pixxo_deko':
        p.rect(3,10,10,5,'w2');p.rect(2,9,12,2,'th2');p.rect(4,11,7,3,'w3');p.oval(2,4,12,7,'g1');p.oval(4,3,8,7,'g2')
        for x,y,c in [(3,5,'pk2'),(7,2,'th3'),(11,5,'rr3')]:p.rect(x,y,3,3,c);p.px(x+1,y+1,'cr3')
        return p.im
    if key=='pixxo_loeschwagen':
        p.oval(2,10,4,4,'bk');p.oval(11,10,4,4,'bk');p.rect(2,5,12,6,'rr1');p.rect(3,6,10,3,'rr3');p.barrel(6,5,5,7);p.line([(1,4),(14,4)],'w4');p.rect(1,6,2,5,'w2');p.px(13,6,'cr3');return p.im
    if key.startswith('icon_') and key[5:] in GOODS:
        good=key[5:]
        if good=='kartoffeln':
            for x,y in [(2,7),(6,3),(8,8)]:p.oval(x,y,6,5,'th2','w2');p.px(x+2,y+2,'th3')
        elif good=='schnaps':p.rect(5,2,6,12,'g1');p.rect(6,4,4,8,'g3');p.rect(6,0,4,3,'w2');p.rect(6,7,4,3,'cr2');p.px(7,5,'cr3')
        elif good in ['leder','haeute']:
            p.poly([(2,3),(6,2),(8,4),(13,2),(14,6),(11,8),(14,12),(11,14),(6,12),(2,14),(1,9),(4,7)],'w3' if good=='leder' else 'th2','w1');p.line([(5,5),(8,6),(11,5)],'w4')
        elif good=='stiefel':
            for x,y in [(1,1),(7,4)]:p.rect(x+2,y,4,9,'w1');p.poly([(x+2,y+7),(x+6,y+7),(x+7,y+9),(x+1,y+10),(x,y+9)],'w2','bk');p.rect(x+3,y+1,2,6,'w3')
        elif good=='wachs':p.poly([(2,7),(8,3),(14,7),(14,12),(8,15),(2,12)],'th2','w2');p.line([(3,7),(8,10),(13,7)],'th3')
        else:
            for x,y in [(2,6),(6,2),(10,5)]:p.rect(x,y,3,9,'cr2');p.rect(x+1,y,1,8,'cr3');p.px(x+1,y-1,'bk');p.px(x+1,y-2,'or2')
        return p.im
    if key.startswith('deko_'):
        kind=key[5:];p.ground('grass')
        def flowers(x,y):
            p.rect(x,y,12,6,'w1');p.rect(x+1,y+1,10,4,'g1')
            for i in range(6):p.px(x+2+i*2,y+1+i%3,['rr3','pk2','th3'][i%3]);p.px(x+2+i*2,y+3,'g3')
        def tree(x,y):
            p.rect(x-1,y-10,3,12,'w2');p.line([(x,y-6),(x-4,y-12)],'w3');p.oval(x-9,y-24,18,18,'g1');p.oval(x-7,y-25,13,14,'g2');p.oval(x-5,y-23,8,8,'g3');p.rect(x-3,y-19,3,2,'g3')
        if kind=='blumenkuebel':p.rect(4,floor-6,8,6,'w2');p.rect(3,floor-7,10,2,'th2');p.rect(5,floor-5,5,4,'w3');p.oval(3,floor-14,10,8,'g1');flowers(2,floor-13)
        elif kind=='strauch':p.oval(2,floor-11,12,11,'g1');p.oval(4,floor-12,9,9,'g2');p.oval(6,floor-11,5,5,'g3');p.px(5,floor-6,'pk2');p.px(10,floor-8,'pk2')
        elif kind=='wegweiser':p.rect(7,4,2,h-7,'w2');p.poly([(2,7),(12,7),(14,9),(12,11),(2,11)],'w3','w1');p.line([(4,9),(10,9)],'cr2');p.poly([(3,14),(11,14),(11,18),(3,18),(1,16)],'w4','w1')
        elif kind in ['laterne','lampe']:
            p.rect(7,6,2,h-9,'iron');p.rect(5,floor-1,6,2,'st1');p.rect(4,3,8,9,'w1');p.rect(5,4,6,6,'th2');p.rect(6,4,2,5,'cr3');p.rect(7,3,1,8,'w2');p.poly([(3,3),(8,0),(13,3)],'bl1');p.rect(4,11,8,1,'iron')
            if kind=='lampe':p.line([(8,6),(12,4),(13,7)],'iron',2);p.rect(11,7,4,3,'th3')
        elif kind=='bank':
            p.rect(5,floor-5,2,6,'iron');p.rect(w-8,floor-5,2,6,'iron');p.rect(3,floor-7,w-6,3,'w3');p.rect(3,floor-13,w-6,2,'w4');p.rect(3,floor-10,w-6,2,'w3');p.rect(4,floor-13,1,10,'w1');p.rect(w-6,floor-13,1,10,'w1')
        elif kind=='blumenbeet':flowers(2,floor-8);flowers(17,floor-8)
        elif kind=='baum':tree(w//2,floor)
        elif kind=='brunnen':
            p.oval(3,floor-18,w-6,17,'st1');p.oval(4,floor-18,w-8,12,'st3');p.oval(7,floor-16,w-14,8,'wa1');p.line([(9,floor-13),(w-10,floor-13)],'wa3');p.rect(w//2-2,floor-27,4,15,'st2');p.oval(w//2-5,floor-29,10,5,'st3');p.px(w//2-1,floor-27,'cr3')
        elif kind=='teich':
            p.oval(2,floor-24,w-4,23,'st1');p.oval(4,floor-23,w-8,20,'g1');p.oval(7,floor-21,w-14,16,'wa1');p.oval(9,floor-20,w-18,12,'wa2');p.line([(13,floor-15),(23,floor-15)],'wa3');p.oval(w-20,floor-13,6,3,'g3');p.px(w-17,floor-13,'pk2')
            for x,y in [(5,floor-19),(w-8,floor-7)]:p.line([(x,y),(x,y-10)],'g2');p.rect(x,y-12,2,5,'th2')
        elif kind in ['park','garten']:
            p.oval(1,h//2,w-2,h//2-2,'g2');p.rect(w//2-3,h//2,6,h//2-2,'sd2');p.rect(3,h-16,w-6,5,'sd2');tree(13,h-16);tree(w-13,h-17);flowers(w//2-6,h-9)
            p.rect(w//2-12,h-22,22,2,'w3');p.rect(w//2-11,h-21,2,4,'iron');p.rect(w//2+8,h-21,2,4,'iron')
            if kind=='garten':flowers(w//2-6,h//2+1);p.oval(w//2-6,h//2-12,12,9,'st2');p.oval(w//2-4,h//2-11,8,5,'wa2')
        return p.im
    if '_berg_' in key:
        side=key.split('_berg_')[1];kind=key.split('_berg_')[0]
        # Felsstufen statt eines frei stehenden Hauses; Vorderseite zeigt zur Zufahrt.
        p.poly([(1,h-7),(0,18),(5,9),(w//3,3),(w//2,8),(w*3//4,2),(w-3,12),(w-1,h-8)],'st2','st1')
        for i in range(w*h//25):
            x=2+hsh(i,19)%(w-4);y=11+hsh(i,20)%(h-18);p.rect(x,y,2+i%3,1,'st3' if i%3 else 'st1')
        p.line([(5,19),(w//3,14),(w//2,18),(w-5,10)],'st3');p.line([(2,h-13),(w-4,h-10)],'st1',2)
        ex=w//2;ey=h-17
        if side=='north':ey=19
        elif side=='east':ex=w-13
        elif side=='west':ex=13
        if kind=='mine':
            p.poly([(ex-9,ey+11),(ex-9,ey-4),(ex-5,ey-10),(ex+4,ey-11),(ex+9,ey-4),(ex+9,ey+11)],'w1','st1');p.rect(ex-6,ey-6,12,17,'bk');p.rect(ex-9,ey-7,3,19,'w3');p.rect(ex+7,ey-7,3,19,'w3');p.rect(ex-9,ey-9,19,3,'w4');p.px(ex+7,ey-6,'cr3');p.rect(ex-5,ey+6,10,4,'st1');p.rect(ex-5,ey+5,10,1,'iron')
            if side in ['east','west']:
                direction=1 if side=='east' else -1
                for offset in [-2,3]:p.line([(ex,ey+offset),(w-1 if direction==1 else 0,ey+offset)],'iron')
                p.poly([(ex-5*direction,ey-7),(ex+5*direction,ey-4),(ex+5*direction,ey+8),(ex-5*direction,ey+10)],'bk');p.line([(ex-6*direction,ey-8),(ex+6*direction,ey-5),(ex+6*direction,ey+9)],'w4',2)
            else:
                direction=-1 if side=='north' else 1
                for offset in [-4,4]:p.line([(ex+offset,ey),(ex+offset+(offset//4)*2,0 if direction==-1 else h-1)],'iron')
            p.crate(ex+10,ey+11,6,5)
        else:
            for i in range(3):p.rect(ex-16+i*5,ey-8+i*5,28-i*4,5,'st1');p.rect(ex-16+i*5,ey-8+i*5,28-i*4,1,'st3')
            p.rect(ex+16,ey-15,3,25,'w2');p.line([(ex+17,ey-15),(ex+1,ey-6)],'w4',2);p.line([(ex+2,ey-6),(ex+2,ey+4)],'iron');p.rect(ex-17,ey+8,8,4,'st3')
        p.worker(ex-9+(f%2),ey+9,f);return p.im
    if key in CHAIN or key=='schmiede':
        p.ground('gravel' if key in ['schmiede','gerberei'] else 'grass')
        if key=='schmiede':
            p.block(4,10,w-17,24,14,'bl','stone');p.rect(7,h-30,w-22,22,'w1');p.rect(9,h-27,w-26,17,'bk');p.rect(8,h-28,2,20,'w3');p.rect(w-16,h-28,2,20,'w3');p.rect(10,h-25,8,13,'st1');p.rect(12,h-19,4,5,'or2');p.rect(14,h-21,2,4,'or1');p.rect(w-14,1,5,h-20,'st1');p.rect(w-15,0,7,2,'st3');p.smoke(w-12,0,f);p.rect(w//2-2,h-12,4,6,'st1');p.poly([(w//2-7,h-15),(w//2+7,h-15),(w//2+4,h-12),(w//2-4,h-12)],'iron');p.worker(w//2-8,h-15,f);p.line([(w//2-7,h-19-f%2),(w//2-2,h-18)],'w3',2)
            for x in range(w-13,w-4,3):p.line([(x,h-18),(x,h-10)],'iron');p.rect(x-1,h-19,3,2,'st3')
        elif key in ['kartoffelhof','rinderhof']:
            p.block(4,8,25,23,13,'rr','plaster',True);p.door(15,33,7,12);p.window(7,29,5,5)
            if key=='kartoffelhof':
                for y in [h-15,h-9]:
                    for x in range(4,w-3,5):p.oval(x,y,4,3,'g1');p.px(x+1,y-1,'g3');p.px(x+3,y+2,'th2')
                p.crate(w-13,h-19,8,7)
            else:
                p.line([(2,h-17),(w-2,h-17),(w-2,h-2),(2,h-2)],'w3');p.animal(9+f%2,h-10,frame=f);p.animal(w-16,h-8,frame=f+1);p.barrel(w-11,h-21)
        else:
            p.block(4,8,w-13,25,14,'rr' if key=='brennerei' else 'bl','plaster',key=='schuster');p.door(17,34,8,13);p.window(7,30,6,6);p.window(w-14,30,5,6)
            if key=='brennerei':p.rect(w-12,3,4,25,'st1');p.smoke(w-10,2,f);p.oval(3,h-20,13,12,'cu2');p.oval(5,h-20,9,5,'cu3');p.rect(8,h-25,3,7,'cu1');p.line([(10,h-24),(19,h-24),(19,h-11)],'cu2',2);p.barrel(w-12,h-12)
            elif key=='gerberei':
                for x in [4,w-16]:p.rect(x,h-24,2,22,'w2');p.rect(x+10,h-24,2,22,'w2');p.rect(x,h-23,12,2,'w4');p.poly([(x+2,h-21),(x+9,h-20),(x+8,h-9),(x+3,h-7)],'th2','w1')
                p.barrel(w//2-3,h-9,8,9)
            elif key=='schuster':p.rect(4,h-10,20,7,'w2');p.rect(7,h-15,5,7,'w1');p.rect(5,h-10,9,3,'w3');p.rect(17,h-14,4,6,'w1');p.rect(15,h-9,8,3,'w3');p.worker(w-16,h-10,f)
            elif key=='kerzenzieherei':
                p.rect(4,h-12,22,8,'w2')
                for x in range(6,25,4):p.rect(x,h-19,2,9,'cr2');p.px(x,h-20,'th3')
                p.barrel(w-12,h-13);p.rect(w-10,h-17,1,7,'cr3');p.worker(w//2+4,h-8,f)
        return p.im
    return None
