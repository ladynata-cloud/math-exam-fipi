#!/usr/bin/env python3
"""Public-route, media and mathematical regression checks for the nine entrances."""
from pathlib import Path
from html.parser import HTMLParser
from fractions import Fraction as F
from urllib.parse import urlsplit
import json,unittest,xml.etree.ElementTree as ET,subprocess
from PIL import Image
R=Path(__file__).resolve().parents[1];TOPICS=json.loads((R/'content/course-entrances/topics.json').read_text())
class Page(HTMLParser):
 def __init__(self,s):self.links=[];self.meta={};self.canonical=[];self.h1=0;super().__init__();self.feed(s)
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='a':self.links.append(a.get('href',''))
  if tag=='meta':self.meta[a.get('name',a.get('property'))]=a.get('content','')
  if tag=='link' and a.get('rel')=='canonical':self.canonical.append(a['href'])
  if tag=='h1':self.h1+=1
class Entrances(unittest.TestCase):
 def test_routes(self):
  urls={node.text for node in ET.parse(R/'sitemap.xml').iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc')}
  for t in TOPICS:
   parent='/ege-baza/' if t['course']=='ege-baza' else '/school/'+t['course']+'/'
   url=parent+'topics/'+t['slug']+'/'
   s=(R/url.strip('/')/'index.html').read_text();p=Page(s)
   self.assertEqual(p.h1,1);self.assertEqual(p.canonical,['https://mathexam.space'+url]);self.assertIn(p.canonical[0],urls)
   self.assertIn('description',p.meta);self.assertNotIn('noindex',p.meta.get('robots',''))
   for href in p.links:
    u=urlsplit(href)
    if u.scheme:continue
    target=R/u.path.lstrip('/');target=target/'index.html' if u.path.endswith('/') else target
    self.assertTrue(target.is_file(),href)
    if u.fragment and not u.fragment.startswith(('lesson/','lesson=')):
     self.assertIn('id="'+u.fragment+'"',target.read_text(),href)
  self.assertNotIn('https://mathexam.space/school/',urls)
  self.assertIn('noindex',Page((R/'school/index.html').read_text()).meta.get('robots',''))
 def test_mathematics(self):
  # Independent numeric checks of authored initial and transfer questions.
  expected=[(F(3,4)+F(1,6),F(1,2)+F(1,3)),(12-3,(16-4)*3),(240*F(15,100),180*(1-F(20,100))),((3**2-4)/(3-2),3),(abs(-5),abs(-7)),((-5)**2-4*1*6,1),((28+5)//6,(42+7)//8),(F(3,10),F(6,10)),(1000*F(8,10)*F(12,10),2000*F(11,10)*F(9,10))]
  for t,(answer,fresh) in zip(TOPICS,expected):self.assertEqual(F(t['answer']),answer,t['id']);self.assertEqual(F(t['freshAnswer']),fresh,t['id'])
  for x in [-5,0,5]:self.assertEqual((x*x)**.5,abs(x))
  self.assertEqual(2**2-5*2+6,0);self.assertEqual(3**2-5*3+6,0)
  self.assertEqual((-6)**2-4*9,0) # one distinct double root, not two different roots
 def test_media(self):
  for t in TOPICS:
   p=R/'assets/course-examples'/f'{t["id"]}.gif';self.assertLess(p.stat().st_size,160000)
   with Image.open(p) as im:
    self.assertEqual(im.n_frames,5);self.assertEqual(im.size,(720,420));self.assertNotIn('loop',im.info)
    for i in range(5):
     im.seek(i);self.assertEqual(im.info['duration'],2200)
     with Image.open(p.with_name(f'{t["id"]}-{i}.png')) as still:self.assertEqual(still.size,im.size)
 def test_generator(self):subprocess.run(['python3',str(R/'tools/build-course-entrances.py'),'--check'],check=True,cwd=R,stdout=subprocess.PIPE)
if __name__=='__main__':unittest.main()
