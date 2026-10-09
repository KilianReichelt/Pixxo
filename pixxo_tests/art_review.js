configureBuildingScale(1.5);
const sheet=document.createElement('canvas');sheet.width=1600;sheet.height=1560;const c=sheet.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#28392f';c.fillRect(0,0,sheet.width,sheet.height);c.fillStyle='#efe8d4';c.font='28px Segoe UI';c.fillText('Pixxo – native Sprites mit 16 Grafikpixeln je Kachel',28,40);
const items=[['haus',1],['haus',2],['haus',3],['kontor',1],['kontor',2],['kontor',3],['kontor',4],...Object.keys(B).filter(t=>!['haus','kontor'].includes(t)).map(t=>[t,1])];
items.forEach(([type,tier],i)=>{const col=i%8,row=Math.floor(i/8),x=20+col*198,y=64+row*210,name=typeSprite(type,tier),sp=SP[name],scale=Math.min(1.7,175/sp.width,160/sp.height);c.fillStyle='#354737';c.fillRect(x,y,186,196);c.drawImage(sp,x+(186-sp.width*scale)/2,y+166-sp.height*scale,sp.width*scale,sp.height*scale);c.fillStyle='#f4ebd5';c.font='18px Segoe UI';c.fillText((B[type].n||type)+(type==='haus'?['','', ' (Bürger)',' (Patrizier)'][tier]:type==='kontor'?' '+tier:''),x+8,y+189,170);});
const output=document.createElement('script');output.type='application/json';output.id='road-image';output.textContent=JSON.stringify({data:sheet.toDataURL('image/png').split(',')[1]});document.body.append(output);if(G)G.speed=0;





