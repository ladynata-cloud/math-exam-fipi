#!/usr/bin/env python3
"""Chapter VII candidate boundary and complete source coverage; no review approval."""
import contextlib,io,itertools,json,math,shutil,tempfile,unittest
from copy import deepcopy
from pathlib import Path
from build_course import ROOT,COURSE,compose,read,digest
from build_candidate import build
from check_models import validate
from chapter07_preservation import (BASE,FIXTURE,FIXTURE_SHA,sha,frozen,
 assert_public893,assert_candidate_old_teaching,require)


def source_coverage(bundle):
 source=read(ROOT/'tools/geometry-textbook/chapter-07-source-map.json')
 require(source['bookId']=='atanasyan-2023-7-9' and source['chapter']==7,'Wrong VII source')
 require(source['source']['sha256']=='3b2e890ce425ef9b4893f367e8680e18c0ed380c9bd86fe4eb65b44a2479ca72','Wrong source edition')
 require(source['counts']==dict(mainNumbers=99,mainParts=169,theoryPoints=9,selfcheckQuestions=12,cards=190),'VII source counts changed')
 require([x['number'] for x in source['exercises']]==list(range(541,640)),'Wrong source exercise inventory')
 require([x['number'] for x in source['theory']]==list(range(54,63)),'Wrong source theory inventory')
 require([x['number'] for x in source['selfchecks']]==list(range(1,13)),'Wrong source review inventory')
 lessons=[x for x in bundle['lessons'] if x['source']['chapter']=='VII']
 require(len(lessons)==190 and len({x['id'] for x in lessons})==190,'Missing/duplicate/foreign VII card')
 entries={x['id']:x for x in bundle['catalog']['entries']}
 expected=[]
 for collection,field in [('main','exercises'),('theory','theory'),('selfcheck','selfchecks')]:
  selected=[x for x in lessons if x['source']['collection']==collection]
  collection_ids=[]
  for item in source[field]:
   for index,part in enumerate(item.get('parts',['single']),1):
    namespace='selfcheck-chapter-7' if collection=='selfcheck' else collection
    ident=f'atanasyan-7-9-{namespace}-{item["number"]}-part-{index}'
    row=next(x for x in selected if x['id']==ident);s=row['source']
    require(s.get('point' if collection=='theory' else 'exercise')==str(item['number']),'Wrong source number')
    require(s.get('subpart','single')==part,'Wrong source part')
    require(s['printedPages']==item['printedPages'] and s['pdfPages']==[p+1 for p in item['printedPages']],'Wrong source page')
    require(row['status']=='in-review' and all(row['review'][k]=='pending' for k in ['source','mathematics','pedagogy']),'Unreviewed VII must remain pending')
    require(row['revision']==1,'Wrong VII work identity')
    require(entries[ident]=={k:row[k] for k in ['id','revision','kind','title','status','source']},'VII catalog disagreement')
    model=row['visualization']['model'];require(not validate(model),'Invalid model '+ident+': '+str(validate(model)))
    step_views={'step-'+str(i) for i in range(1,len(row['steps'])+1)}
    require([x['view'] for x in row['steps']]==['step-'+str(i) for i in range(1,len(row['steps'])+1)],'Unreachable step view')
    require(step_views.issubset(model['views']),'Missing step view')
    for name,view in model['views'].items():
     require(name=='neutral' or name in step_views or name.startswith('case-'),'Unreachable authored view')
     if name.startswith('case-'):
      unlock=view.get('availableFromStep',0);require(isinstance(unlock,int) and 0<=unlock<=len(row['steps']),'Wrong case unlock')
     visible=[p for p in view.get('points',[]) if not p.startswith('_')]
     for a,b in itertools.combinations(visible,2):require(math.dist(model['points'][a],model['points'][b])>1e-6,'Merge coincident displayed labels: '+ident+'/'+name+'/'+a+'/'+b)
    collection_ids.append(ident)
  require([x['id'] for x in selected]==collection_ids,'Wrong source ordering/extra collection card')
  expected.extend(collection_ids)
 require([x['id'] for x in lessons]==expected,'Wrong VII course order')
 return lessons


class ChapterVIIPublishedBoundary(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.public=compose();cls.released=any(c['chapter']==7 for c in cls.public['build']['chapters'])
 def test_exact893_public_bundle_and167_published_files(self):
  self.assertEqual(sha(FIXTURE.read_bytes()),FIXTURE_SHA)
  self.assertEqual(frozen()['sourceCommit'],BASE);self.assertEqual(len(frozen()['immutableFiles']),167)
  if self.released:
   from chapter07_release import validate_release
   validate_release(self.public)
  else:
   assert_public893(self.public)
   self.assertEqual(sha((COURSE/'data/course.json').read_bytes()),frozen()['courseSha256'])
  self.assertEqual((json.dumps(self.public,ensure_ascii=False,separators=(',',':'))+'\n').encode(),(COURSE/'data/course.json').read_bytes())
 def test_public_preservation_rejects_content_review_identity_and_order_changes(self):
  for mode in ['text','review','status','revision','order','catalog','missing','extra','scope']:
   with self.subTest(mode=mode):
    b=deepcopy(self.public)
    if mode=='text':b['lessons'][0]['statement']['text']+=' changed'
    elif mode=='review':b['lessons'][0]['review']['at']='changed'
    elif mode=='status':b['lessons'][0]['status']='in-review'
    elif mode=='revision':b['lessons'][0]['revision']+=1
    elif mode=='order':b['lessons'][0],b['lessons'][1]=b['lessons'][1],b['lessons'][0]
    elif mode=='catalog':b['catalog']['entries'][0]['id']='changed'
    elif mode=='missing':b['lessons'].pop()
    elif mode=='extra':b['lessons'].append(deepcopy(b['lessons'][0]))
    else:b['build']['numberedExercises']=-1
    with self.assertRaises(AssertionError):
     if self.released:
      from chapter07_release import validate_release
      validate_release(b)
     else:assert_public893(b,check_files=False)
 def test_registry_cannot_hide_published_or_include_unregistered(self):
  with tempfile.TemporaryDirectory() as name:
   course=Path(name)/'course';shutil.copytree(COURSE,course)
   p=course/'candidate-chapters.json';r=read(p);r['chapters'].append({'chapter':6});p.write_text(json.dumps(r))
   with self.assertRaisesRegex(ValueError,'cannot hide'):compose(course)
  with self.assertRaisesRegex(ValueError,'registered'):compose(include_candidates=[8])


class ChapterVIICompleteCandidate(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.temp=tempfile.TemporaryDirectory();cls.addClassCleanup(cls.temp.cleanup)
  cls.out=Path(cls.temp.name)/'preview';cls.public=compose()
  with contextlib.redirect_stdout(io.StringIO()):cls.bundle=build(7,cls.out)
  cls.released=any(c['chapter']==7 for c in cls.public['build']['chapters'])
  if cls.released:
   target=cls.out/'geometry-course/textbook';(target/'release-review-chapter-07.json').unlink(missing_ok=True);cls.bundle=compose(target)
 def test_complete190_source_cards_and_unapproved_isolated1083(self):
  self.assertEqual(len(source_coverage(self.bundle)),190)
  self.assertEqual(len(self.bundle['lessons']),1083);self.assertEqual(len(self.bundle['catalog']['entries']),1083)
  self.assertEqual(self.bundle['build']['authoredCards'],1083);self.assertEqual(self.bundle['build']['numberedExercises'],639)
  self.assertEqual([x['chapter'] for x in self.bundle['build']['chapters']],[1,2,3,4,5,6,7])
  self.assertFalse(self.bundle['build']['publicationReviewMatches']);self.assertFalse(self.bundle['build']['fullTextbookComplete'])
  self.assertEqual((COURSE/'release-review-chapter-07.json').exists(),self.released)
  if self.released:
   from chapter07_extension import assert_893_preserved
   from chapter07_release import validate_release
   assert_893_preserved(self.bundle);validate_release(self.public)
  else:
   self.assertTrue(all(x['status']=='in-review' for x in self.bundle['lessons']),'Changed preview runtime cannot inherit old approval')
   assert_public893(self.public)
  assert_candidate_old_teaching(self.bundle)
  self.assertEqual((self.out/'geometry-course/textbook/index.html').read_bytes(),(COURSE/'index.html').read_bytes())
  self.assertIn('Проверка главы VII',(self.out/'geometry-course/textbook/review.html').read_text())
 def test_only_three_exact_paragraphs_change_isolated_runtime(self):
  before=self.public['sourceInventory'];after=deepcopy(self.bundle['sourceInventory']);source=read(ROOT/'tools/geometry-textbook/chapter-07-source-map.json')
  if self.released:
   from chapter07_extension import previous_inventory
   before=json.loads(previous_inventory((COURSE/'source-inventory.json').read_bytes()))
  self.assertEqual(after['paragraphs'][-3:],source['paragraphs']);after['paragraphs']=after['paragraphs'][:-3]
  self.assertEqual(after,before);self.assertEqual(len(self.bundle['sourceInventory']['paragraphs']),25)
  new=self.bundle['build']['implementationFiles'];old={name:frozen()['immutableFiles']['geometry-course/textbook/'+name] for name in new}
  self.assertEqual(set(old),set(new));self.assertEqual([k for k in old if old[k]!=new[k]],['source-inventory.json'])
 def test_source_coverage_rejects_missing_page_namespace_part_and_duplicate(self):
  for mode in ['missing','page','namespace','part','duplicate','catalog']:
   with self.subTest(mode=mode):
    changed=deepcopy(self.bundle);row=next(x for x in changed['lessons'] if x['source']['chapter']=='VII')
    if mode=='missing':changed['lessons'].remove(row)
    elif mode=='page':row['source']['printedPages']=[999]
    elif mode=='namespace':row['id']='atanasyan-7-9-selfcheck-1-part-1'
    elif mode=='part':row['source']['subpart']='wrong'
    elif mode=='duplicate':changed['lessons'].append(deepcopy(row))
    else:next(x for x in changed['catalog']['entries'] if x['id']==row['id'])['revision']=2
    with self.assertRaises((AssertionError,StopIteration)):source_coverage(changed)
 def test_missing_candidate_number_preserves_public_but_fails_explicit_composition(self):
  with tempfile.TemporaryDirectory() as name:
   course=Path(name)/'course';shutil.copytree(COURSE,course)
   p=next((course/'preparation').glob('chapter-07-[a-z].json'));obj=read(p);obj['exercises'].pop();p.write_text(json.dumps(obj))
   if not self.released:assert_public893(compose(course),check_files=False)
   with self.assertRaisesRegex(ValueError,'every exercise 541'):compose(course,include_candidates=[] if self.released else [7])
 def test_candidate_cannot_change_old_teaching_even_behind_preview_status(self):
  changed=deepcopy(self.bundle);changed['lessons'][0]['statement']['text']+=' changed'
  with self.assertRaises(AssertionError):assert_candidate_old_teaching(changed)

if __name__=='__main__':unittest.main(verbosity=2)
