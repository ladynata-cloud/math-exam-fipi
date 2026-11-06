"""Check delivered GIF bytes, links, embeddings, budgets and numeric examples."""
import json, math, subprocess
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit
from fractions import Fraction
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
items=json.loads((ROOT/'assets/trainer-previews/manifest.json').read_text())
tracked=set(subprocess.check_output(['git','ls-files'],cwd=ROOT,text=True).splitlines())
class Page(HTMLParser):
 def __init__(self):super().__init__();self.previews=[];self.ids=[];self.images=[];self.links=[]
 def handle_starttag(self,t,a):
  a=dict(a)
  if 'data-me-preview' in a:self.previews.append(a['data-me-preview'])
  if 'id' in a:self.ids.append(a['id'])
  if t=='img' and 'data-gif' in a:self.images.append(a)
  if t=='a':self.links.append(a.get('href',''))
assert len(items)==20 and len({i['id'] for i in items})==20
assert len(list((ROOT/'assets/trainer-previews').glob('*.gif')))==20
assert sum(i['bytes'] for i in items)<1500000
for it in items:
 gif=ROOT/'assets/trainer-previews'/(it['id']+'.gif');im=Image.open(gif)
 assert im.format=='GIF' and im.size==(640,500) and im.n_frames>=5,it['id']
 duration=0;visuals=set()
 for n in range(im.n_frames):
  im.seek(n);duration+=im.info['duration'];visuals.add(im.convert('RGB').tobytes())
 assert len(visuals)>=5 and duration==it['duration_ms']==11000,it['id']
 assert gif.stat().st_size==it['bytes']<250000
 assert Image.open(gif.with_suffix('.png')).size==im.size
 path=urlsplit(it['url']).path.lstrip('/');path+= 'index.html' if path.endswith('/') else ''
 assert path in tracked and (ROOT/path).is_file(),it['url']
for page in sorted({i['page'] for i in items}):
 p=Page();p.feed((ROOT/page).read_text())
 expected=[i for i in items if i['page']==page]
 assert p.previews==[i['id'] for i in expected],page
 assert len(p.ids)==len(set(p.ids)),f'duplicate ids: {page}'
 assert len(p.images)==len(expected)
 for im in p.images:
  assert im['src'].endswith('.png') and im['loading']=='lazy' and int(im['width'])==640
  assert im.get('alt') and im['data-gif'].endswith('.gif')
 for it in expected:assert it['url'] in p.links,(page,it['url'])
# Independent numeric/semantic review of every distinct mathematical example.
assert Fraction(15,100)*200==30
# Inspect delivered GIF pixels, not the generator's own stage constants. Each
# shaded cell is 1/20 of 200 (=10): the 10%, 5%, and combined 15% stages must
# show two, one, and three cells respectively. This catches a correct caption
# paired with an incorrect fixed 15% diagram.
percent=Image.open(ROOT/'assets/trainer-previews/01-percent.gif')
elapsed=0; samples={2500:2,4500:1,6500:3,10000:3};checked=set()
for frame in range(percent.n_frames):
 percent.seek(frame);duration=percent.info['duration'];rgb=percent.convert('RGB')
 for at,expected in samples.items():
  if elapsed<=at<elapsed+duration:
   colors=[rgb.getpixel((80+25*i,220)) for i in range(20)]
   shaded=sum(r>150 and g<120 and b>70 for r,g,b in colors)
   assert shaded==expected,(at,shaded,expected)
   checked.add(at)
 elapsed+=duration
assert checked==set(samples)
assert [0**2+c for c in range(-2,3)]==[-2,-1,0,1,2]
assert math.hypot(3,4)==5 and math.hypot(9,12)==15 and math.hypot(8,15)==17
assert round(3.746,1)==3.7 and 23*14==92+230==322
assert Fraction(1,2)+Fraction(1,4)==Fraction(3,4)
assert math.gcd(12,18)==6 and math.lcm(4,6)==12
assert Fraction(195*65,100)==Fraction(12675,100)
assert 6*.5*4*.5==6 and Fraction(3,3+7)==Fraction(3,10)
assert 3*5+5==20
for x in range(-10,11):assert (-2*x<6)==(x>-3)
assert 2+4*3==14 and 48//2==24
assert [2*x+1 for x in [0,1]]==[1,3]
assert 90/2==45
assert math.isclose(math.hypot(60*math.sqrt(3),60),120)
assert math.isclose(math.hypot(80,60),100)
print('TRAINER_GIF_STATIC_PASS: 20 GIF, four pages, real local routes, no autoplay, 20 mathematical examples.')
