#!/usr/bin/env python3
"""Reproducible mathematical GIFs and still frames (Pillow, DejaVu Sans).
Each still is one exact state: no interpolated labels or approximate roots.
"""
from pathlib import Path
import json, math, re
from PIL import Image, ImageDraw, ImageFont
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/course-examples'; OUT.mkdir(exist_ok=True)
DATA=json.loads((ROOT/'content/course-entrances/topics.json').read_text())
W,H=720,420
BG='#f6faf7';INK='#183f36';GREEN='#237b5d';ORANGE='#b74b25';LIGHT='#cce6d9';GRAY='#c6d5cf'
F='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';B=F.replace('.ttf','-Bold.ttf')
def render(item,stage):
 im=Image.new('RGB',(W,H),BG);d=ImageDraw.Draw(im)
 def text(x,y,s,n=28,c=INK,b=False,anchor=None):d.text((x,y),str(s),font=ImageFont.truetype(B if b else F,n),fill=c,anchor=anchor)
 def line(points,c=INK,w=3):d.line(points,fill=c,width=w)
 def box(rect,c=LIGHT):d.rounded_rectangle(rect,8,fill=c)
 def dot(x,y,r=7,c=GREEN):d.ellipse((x-r,y-r,x+r,y+r),fill=c)
 def arrow(x1,y1,x2,y2,c=GREEN,w=5):
  line([(x1,y1),(x2,y2)],c,w);a=math.atan2(y2-y1,x2-x1);line([(x2-15*math.cos(a-.5),y2-15*math.sin(a-.5)),(x2,y2),(x2-15*math.cos(a+.5),y2-15*math.sin(a+.5))],c,w)
 def frac(x,y,top,bottom,n=32):
  font=ImageFont.truetype(F,n);width=max(d.textlength(top,font=font),d.textlength(bottom,font=font))+16
  text(x+width/2,y,top,n,anchor='mt');line([(x,y+n+4),(x+width,y+n+4)],INK,2);text(x+width/2,y+n+8,bottom,n,anchor='mt');return width
 text(28,20,item['short'],27,b=True)
 text(28,60,'ШАГ '+str(stage+1)+' ИЗ 5',17,c=GREEN)
 k=item['kind'];formula=''
 if k=='fractions':
  n=4 if stage<2 else 12;filled=3 if stage<2 else 9 if stage==2 else 11
  for j in range(n):
   x=54+j*612/n;d.rectangle((x,156,x+612/n-3,239),fill=GREEN if j<filled else '#fff',outline=INK,width=1)
  formula=['0,75 + 1/6','0,75 = 3/4','3/4 = 9/12; 1/6 = 2/12','9/12 + 2/12 = 11/12','11/12 < 1'][stage]
  text(54,265,'Одно целое · '+str(n)+' равных частей',24)
 elif k=='river':
  box((35,112,685,297),'#e3eff6');arrow(50,142,180,142,'#427894',4);text(210,121,'Течение: 3 км/ч',26)
  right=stage<3;cx=310
  d.polygon([(cx-65,217),(cx+65,217),(cx+43,250),(cx-43,250)],fill=GREEN)
  d.polygon([(cx,170),(cx,214),(cx+43 if right else cx-43,214)],fill=ORANGE)
  arrow(190 if right else 530,279,530 if right else 190,279)
  formula=['В стоячей воде: 12 км/ч','Вода движется вправо','По течению: 12 + 3 = 15 км/ч','Против течения: 12 − 3 = 9 км/ч','За 2 часа: 9 · 2 = 18 км'][stage]
 elif k=='percent':
  for j in range(20):
   x=45+j*31;d.rectangle((x,160,x+29,237),fill=GREEN if j<(0 if stage==0 else 2 if stage==1 else 1 if stage==2 else 3) else '#fff',outline=INK)
  text(45,263,'Целое: 240 страниц',27)
  formula=['100% — 240 страниц','10% — 24 страницы','5% — 12 страниц','15% — 36 страниц','Осталось: 240 − 36 = 204'][stage]
 elif k=='cancel':
  if stage<3:
   top='x² − 4' if stage<2 else '(x − 2)(x + 2)';frac(150,130,top,'x − 2',38)
   if stage>=1:text(245,265,'x ≠ 2',36,c=ORANGE,b=True)
  else:
   ox,oy,sc=180,290,35
   arrow(60,oy,580,oy,INK,2);arrow(ox,315,ox,95,INK,2)
   pts=[(ox+x*sc,oy-(x+2)*sc) for x in [-2.3,3.2]];line(pts,GREEN,4)
   px,py=ox+2*sc,oy-4*sc;d.ellipse((px-9,py-9,px+9,py+9),fill=BG,outline=ORANGE,width=3)
   text(px+18,py-5,'(2; 4) исключена',24,ORANGE);text(580,292,'x',23);text(190,90,'y',23);text(190,292,'0',20)
   for x in [1,2,3]:text(ox+x*sc,oy+5,str(x),20,anchor='mt')
  formula=['Сокращаем множители','Сначала ограничение','Разность квадратов','y = x + 2, x ≠ 2','При x = 3 значение равно 5'][stage]
 elif k=='root':
  x=[-5,-5,0,5,-5][stage];ox=360;oy=210;sc=42;arrow(90,oy,630,oy,INK,2)
  for j in [-5,0,5]:line([(ox+j*sc,oy-8),(ox+j*sc,oy+8)]);text(ox+j*sc,oy+18,str(j),25,anchor='mt')
  dot(ox+x*sc,oy,9,ORANGE);text(170,108,'x = '+str(x),32);text(390,108,'|x| = '+str(abs(x)),32,c=GREEN)
  if x:line([(ox,185),(ox+x*sc,185)],GREEN,6);text(275,270,'Расстояние до 0',25)
  formula=['(−5)² = 25','√25 = 5, не −5','√0 = 0','√(5²) = 5','√(x²) = |x| ≥ 0'][stage]
 elif k=='quadratic':
  ox,oy,sc=150,244,70
  arrow(75,oy,545,oy,INK,2);arrow(ox,310,ox,95,INK,2)
  pts=[]
  for i in range(401):
   x=-.2+i*.011;y=x*x-5*x+6;px,py=ox+x*sc,oy-y*sc
   if 98<=py<=310:pts.append((px,py))
   elif len(pts)>1:line(pts,GREEN,4);pts=[]
  if len(pts)>1:line(pts,GREEN,4)
  text(560,240,'x',23);text(155,89,'y',23);text(138,250,'0',20)
  for x in [2,3]:
   line([(ox+x*sc,oy-5),(ox+x*sc,oy+5)]);text(ox+x*sc,oy+14,str(x),25,anchor='mt')
   if stage>=2:dot(ox+x*sc,oy,7,ORANGE)
  formula=['x² − 5x + 6 = 0','D = 25 − 24 = 1','Корни: x₁ = 2 и x₂ = 3','Два пересечения с осью x','Оба корня проверены подстановкой'][stage]
 elif k=='packs':
  count=1 if stage<2 else 4 if stage==2 else 5
  for j in range(count):
   x=48+j*124;box((x,147,x+108,247));text(x+54,177,'6 шт.',28,anchor='mt')
  text(48,275,'Нужно: 28 тетрадей',27)
  formula=['Покупаем целые упаковки','В одной упаковке 6 тетрадей','24 < 28 — четырёх не хватит','30 ≥ 28 — пяти хватит','Минимум: 5 упаковок'][stage]
 elif k=='probability':
  for j in range(10):
   x=100+(j%5)*128;y=150+(j//5)*100;d.ellipse((x-32,y-32,x+32,y+32),fill=GREEN if j<3 else '#fff',outline=INK,width=2);text(x,y,'З' if j<3 else 'Б',25,'white' if j<3 else INK,anchor='mm')
  formula=['З — зелёный, Б — белый','Всего: 3 + 7 = 10','Подходящих исходов: 3','P(зелёный) = 3/10 = 0,3','P(белый) = 0,7'][stage]
 elif k=='change':
  for y,value,label in [(132,1000,'Было'),(202,800,'После скидки'),(272,960,'После роста')][:1 if stage==0 else 2 if stage<4 else 3]:
   text(38,y-2,label,23);box((230,y,230+value*.4,y+39));text(240,y+4,str(value)+' ₽',24)
  formula=['100% — это 1000 рублей','1000 · 0,8 = 800 рублей','Новое целое: 800 рублей','20% от 800 — это 160','800 · 1,2 = 960 рублей'][stage]
 # Typeset ordinary fractions with a real horizontal bar.
 tokens=re.split(r'(\d+/\d+)',formula);normal=ImageFont.truetype(B,26);small=ImageFont.truetype(B,23)
 widths=[]
 for part in tokens:
  if re.fullmatch(r'\d+/\d+',part):widths.append(max(d.textlength(x,font=small) for x in part.split('/'))+14)
  else:widths.append(d.textlength(part,font=normal))
 x=(W-sum(widths))/2
 for part,width in zip(tokens,widths):
  if re.fullmatch(r'\d+/\d+',part):
   a,b=part.split('/');d.text((x+width/2,335),a,font=small,fill=INK,anchor='mt');line([(x+3,364),(x+width-3,364)],INK,2);d.text((x+width/2,369),b,font=small,fill=INK,anchor='mt')
  else:d.text((x,366),part,font=normal,fill=INK,anchor='lm')
  x+=width

 return im
for item in DATA:
 frames=[render(item,i) for i in range(5)]
 for i,im in enumerate(frames):im.save(OUT/f'{item["id"]}-{i}.png',optimize=True)
 frames[0].save(OUT/f'{item["id"]}.gif',save_all=True,append_images=frames[1:],duration=[2200]*5,optimize=True,disposal=2)
print(f'{len(DATA)} GIFs, {len(DATA)*5} still frames; {sum(p.stat().st_size for p in OUT.glob("*")):,} bytes')
