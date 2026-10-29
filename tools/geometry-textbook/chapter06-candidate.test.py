#!/usr/bin/env python3
"""Candidate boundaries, source coverage and targeted numerical checks.

These are author-run regression tests, not independent mathematical review.
"""
import contextlib,hashlib,io,itertools,json,math,shutil,tempfile,unittest
from copy import deepcopy
from pathlib import Path
from build_course import ROOT,COURSE,compose,digest,read
from build_candidate import build
from check_models import validate
from chapter06_extension import assert_755_preserved, previous_inventory

FIXTURE=ROOT/'tools/geometry-textbook/published-through-461.json'
FIXTURE_SHA='8a552a7b75e1401178a2aea29c8b180d6acdfb33bff5d9757f2e8073a61ad98e'
def sha(raw):return hashlib.sha256(raw).hexdigest()
def teaching(row):
 row=deepcopy(row);row.pop('status');row.pop('review');return row

def source_coverage(bundle):
 source=read(ROOT/'tools/geometry-textbook/chapter-06-source-map.json')
 lessons=[x for x in bundle['lessons'] if x['source']['chapter']=='VI']
 assert len(lessons)==138
 assert len({x['id'] for x in lessons})==138
 for collection,field in [('main','exercises'),('theory','theory'),('selfcheck','selfchecks')]:
  selected=[x for x in lessons if x['source']['collection']==collection]
  expected=[]
  for x in source[field]:
   for i,part in enumerate(x.get('parts',['single']),1):
    numberfield='point' if collection=='theory' else 'exercise'
    item=next(y for y in selected if y['source'][numberfield]==str(x['number']) and y['source'].get('subpart','single')==part)
    assert item['source']['printedPages']==x['printedPages']
    assert item['source']['pdfPages']==[p+1 for p in x['printedPages']]
    namespace='selfcheck-chapter-6' if collection=='selfcheck' else collection
    assert item['id']==f'atanasyan-7-9-{namespace}-{x["number"]}-part-{i}'
    assert item['status']=='in-review' and all(item['review'][k]=='pending' for k in ['source','mathematics','pedagogy'])
    assert not validate(item['visualization']['model']),item['id']
    model=item['visualization']['model']
    for view in model['views'].values():
     visible=[p for p in view.get('points',[]) if not p.startswith('_')]
     for a,b in itertools.combinations(visible,2):
      assert math.dist(model['points'][a],model['points'][b])>1e-6, (item['id'],a,b,'merge coincident labels explicitly')
    expected.append(item['id'])
  assert [x['id'] for x in selected]==expected
 assert [x['number'] for x in source['exercises']]==list(range(462,541))
 assert [x['number'] for x in source['theory']]==list(range(46,54))
 assert [x['number'] for x in source['selfchecks']]==list(range(1,23))
 return lessons

class CandidateVI(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.temp=tempfile.TemporaryDirectory();cls.addClassCleanup(cls.temp.cleanup)
  cls.out=Path(cls.temp.name)/'preview'
  cls.public=compose();cls.frozen=read(FIXTURE)
  cls.released=any(c['chapter']==6 for c in cls.public['build']['chapters'])
  with contextlib.redirect_stdout(io.StringIO()):cls.bundle=build(6,cls.out)
  if cls.released:
   target=cls.out/'geometry-course/textbook'
   (target/'release-review-chapter-06.json').unlink(missing_ok=True)
   cls.bundle=compose(target)
 def test_exact_755_published_cards_and_all_63_source_runtime_review_files(self):
  self.assertEqual(sha(FIXTURE.read_bytes()),FIXTURE_SHA)
  self.assertEqual(self.frozen['sourceCommit'],'d3122b9f3905cd8f7715cee6a873d031cdb43de4')
  if self.released:
   assert_755_preserved(self.public)
   assert_755_preserved(self.bundle)
   return
  self.assertEqual(sha((COURSE/'data/course.json').read_bytes()),self.frozen['courseSha256'])
  self.assertEqual(digest(self.public['lessons']),self.frozen['lessonsSha256'])
  self.assertEqual(digest(self.public['catalog']['entries']),self.frozen['catalogEntriesSha256'])
  self.assertTrue(self.public['build']['publicationReviewMatches'])
  for path,expected in self.frozen['immutableFiles'].items():self.assertEqual(sha((ROOT/path).read_bytes()),expected,path)
 def test_complete_candidate_source_models_and_unapproved_status(self):
  self.assertEqual(len(source_coverage(self.bundle)),138)
  self.assertEqual(len(self.bundle['lessons']),893)
  self.assertFalse(self.bundle['build']['publicationReviewMatches'])
  self.assertEqual((COURSE/'release-review-chapter-06.json').exists(),self.released)
  ids={x['id'] for x in self.public['lessons'] if x['source']['chapter']!='VI'}
  self.assertEqual([teaching(x) for x in self.bundle['lessons'] if x['id'] in ids],[teaching(x) for x in self.public['lessons'] if x['id'] in ids])
  original=(json.loads(previous_inventory((COURSE/'source-inventory.json').read_bytes())) if self.released else read(COURSE/'source-inventory.json'))
  preview=self.bundle['sourceInventory']
  self.assertEqual(preview['paragraphs'][:-3],original['paragraphs'])
  for key,value in original.items():
   if key!='paragraphs':self.assertEqual(preview[key],value)
  self.assertEqual(len(preview['paragraphs']),22)
 def test_source_coverage_rejects_missing_wrong_page_and_wrong_namespace(self):
  for mode in ['missing','page','namespace']:
   changed=deepcopy(self.bundle);item=next(x for x in changed['lessons'] if x['source']['chapter']=='VI')
   if mode=='missing':changed['lessons'].remove(item)
   elif mode=='page':item['source']['printedPages']=[999]
   else:item['id']='atanasyan-7-9-selfcheck-1-part-1'
   with self.assertRaises((AssertionError,StopIteration)):source_coverage(changed)
 def test_candidate_registry_cannot_hide_published_chapter_or_include_unknown(self):
  with tempfile.TemporaryDirectory() as name:
   course=Path(name)/'course';shutil.copytree(COURSE,course)
   registry=read(course/'candidate-chapters.json');registry['chapters'].append({'chapter':1})
   (course/'candidate-chapters.json').write_text(json.dumps(registry))
   with self.assertRaisesRegex(ValueError,'cannot hide'):compose(course)
  with self.assertRaisesRegex(ValueError,'registered'):compose(include_candidates=[7])
 def test_missing_candidate_number_fails_explicit_build(self):
  with tempfile.TemporaryDirectory() as name:
   course=Path(name)/'course';shutil.copytree(COURSE,course)
   path=course/'preparation/chapter-06-d.json';p=read(path);p['exercises'].pop();path.write_text(json.dumps(p))
   with self.assertRaisesRegex(ValueError,'every exercise 462'):compose(course,include_candidates=[] if self.released else [6])
   if not self.released:self.assertEqual(digest(compose(course)['lessons']),self.frozen['lessonsSha256'])
 def test_targeted_answers_and_non_generic_cases(self):
  rows=source_coverage(self.bundle);by={(x['source']['collection'],x['source'].get('exercise'),x['source'].get('subpart','single')):x for x in rows}
  answer=lambda n,p='single':next(h['text'] for h in by['main',str(n),p]['help'] if h['id']=='compare-result')
  self.assertIn('144',answer(490));self.assertIn('63',answer(490))
  self.assertIn('198,1',answer(504,'а'));self.assertIn('122,6',answer(504,'а'))
  self.assertIn('19,8',answer(504,'б'));self.assertIn('23,4',answer(504,'б'))
  self.assertIn('18',answer(506));self.assertIn('36,8',answer(532));self.assertIn('8',answer(534))
  # Exact counterexample: equal radii and equal rod/base do not imply parallelism in a crossed linkage.
  a=(0,1);b=(210/37,-35/37)
  self.assertAlmostEqual(math.hypot(b[0]-6,b[1]),1)
  self.assertAlmostEqual(math.dist(a,b),6)
  self.assertNotEqual(a[1],b[1])
  # 535: many trapezoids with complementary base angles; half-difference, never half-sum.
  for base,top in [(11,3),(8,4),(15,2)]:
   d=base-top
   for fraction in [.15,.3,.5,.7,.85]:
    x=d*fraction;h=math.sqrt(x*(d-x))
    lower=math.degrees(math.atan2(h,x))+math.degrees(math.atan2(h,d-x))
    length=math.hypot(x-d/2,h)
    self.assertAlmostEqual(lower,90)
    self.assertAlmostEqual(length,d/2)
    self.assertNotAlmostEqual(length,(base+top)/2)
  # The short diagonal equals the side in the 60/120 degree rhombus, not a square.
  for side in [1,5,10.5]:
   diagonal=math.hypot(side+side*math.cos(math.radians(120)),side*math.sin(math.radians(120)))
   self.assertAlmostEqual(diagonal,side)
if __name__=='__main__':unittest.main(verbosity=2)
