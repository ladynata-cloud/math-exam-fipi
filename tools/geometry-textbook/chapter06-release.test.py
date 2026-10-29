#!/usr/bin/env python3
"""Exact893-card union, immutable755 records and runtime-chain corruption probes."""
from copy import deepcopy
from pathlib import Path
import json,shutil,tempfile,unittest
from build_course import compose,COURSE,ROOT,read
from chapter06_extension import (PREFIX,FIXTURE,RECEIPT,LABELS,PARAGRAPHS,encoded,sha,
 validate_extension,restore_manifest,assert_755_preserved,frozen,require)

def historical_vi_projection(bundle,scope):
 bundle,scope=deepcopy(bundle),deepcopy(scope)
 if any(c['chapter']==7 for c in scope['chapters']):
  bundle['lessons']=[r for r in bundle['lessons'] if r['source']['chapter']!='VII']
  bundle['catalog']['entries']=[r for r in bundle['catalog']['entries'] if r['source']['chapter']!='VII']
  bundle['build']['chapters']=[c for c in bundle['build']['chapters'] if c['chapter']!=7]
  bundle['build']['authoredCards']-=190;bundle['build']['numberedExercises']-=99
  scope['chapters']=[c for c in scope['chapters'] if c['chapter']!=7];scope['totalCards']-=190
 return bundle,scope

def validate_release(bundle,root=ROOT,require_review=True):
 assert_755_preserved(bundle,root)
 scope=read(root/'tools/geometry-textbook/release-scope.json')
 if any(c['chapter']==7 for c in scope['chapters']):
  # Validate the full union before projecting, so forged VII records cannot hide.
  from chapter07_release import validate_release as validate_vii_release
  validate_vii_release(bundle,root=root,require_review=require_review,scope=scope)
 bundle,scope=historical_vi_projection(bundle,scope)
 require([c['chapter'] for c in scope['chapters']]==[1,2,3,4,5,6],'Wrong release chapter scope')
 require([c['chapter'] for c in bundle['build']['chapters']]==[1,2,3,4,5,6],'Wrong built chapter scope')
 require(scope['totalCards']==bundle['build']['authoredCards']==len(bundle['lessons'])==len(bundle['catalog']['entries'])==893,'Wrong complete release size')
 require(bundle['build']['numberedExercises']==540,'Wrong exercise endpoint')
 require(bundle['build']['fullTextbookComplete'] is False,'Full textbook is not complete')
 source=read(root/'tools/geometry-textbook/chapter-06-source-map.json');expected={}
 require([x['number'] for x in source['exercises']]==list(range(462,541)),'VI source numbers changed')
 require([x['number'] for x in source['theory']]==list(range(46,54)),'VI theory numbers changed')
 require([x['number'] for x in source['selfchecks']]==list(range(1,23)),'VI selfcheck numbers changed')
 for collection,field in [('main','exercises'),('theory','theory'),('selfcheck','selfchecks')]:
  for x in source[field]:
   for i,part in enumerate(x.get('parts',['single']),1):
    namespace='selfcheck-chapter-6' if collection=='selfcheck' else collection
    expected[f'atanasyan-7-9-{namespace}-{x["number"]}-part-{i}']=(collection,str(x['number']),part,x['printedPages'])
 require(len(expected)==138,'VI source part count changed')
 rows=[x for x in bundle['lessons'] if x['source']['chapter']=='VI'];entries={x['id']:x for x in bundle['catalog']['entries']}
 require(len(entries)==893 and len({x['id'] for x in bundle['lessons']})==893,'Duplicate release ID')
 require({x['id'] for x in rows}==set(expected),'Missing/foreign VI identity')
 for row in rows:
  collection,number,part,pages=expected[row['id']];s=row['source']
  require((s['collection'],s.get('point' if collection=='theory' else 'exercise'),s.get('subpart','single'),s['printedPages'])==(collection,number,part,pages),'Wrong VI source attribution')
  require(s['pdfPages']==[p+1 for p in pages] and row['revision']==1,'Wrong VI page/storage identity')
  require(entries[row['id']]=={k:row[k] for k in ('id','revision','kind','title','status','source')},'VI catalog mismatch')
 if require_review:
  require(bundle['build']['publicationReviewMatches'] and all(x['status']=='reviewed' for x in rows),'VI review not complete')
  manifest=read(root/PREFIX/'release-review-chapter-06.json')
  require(manifest['scope']['cards']==138 and manifest['scope']['chapter']=='VI','Wrong VI review scope')
  require(bool(manifest.get('evidence')),'Missing VI review evidence')
  for item in manifest['evidence']:
   p=Path(item['path']);require(not p.is_absolute() and '..' not in p.parts,'Invalid evidence path')
   require(sha((root/p).read_bytes())==item['sha256'],'Stale independent VI evidence')
 return True

class ChapterVIRelease(unittest.TestCase):
 @classmethod
 def setUpClass(cls):cls.bundle=compose()
 def test_full893_union_and_755_full_records(self):validate_release(self.bundle)
 def test_missing_vi_review_preserves755_public_cards(self):
  with tempfile.TemporaryDirectory() as temp:
   course=Path(temp)/'course';shutil.copytree(COURSE,course);(course/'release-review-chapter-06.json').unlink(missing_ok=True)
   bundle=compose(course);assert_755_preserved(bundle)
   self.assertEqual(sum(x['status']=='reviewed' for x in bundle['lessons'] if x['source']['chapter']!='VII'),755)
   self.assertTrue(all(x['status']=='in-review' for x in bundle['lessons'] if x['source']['chapter']=='VI'))
 def test_union_cannot_hide_corruptions_behind_historical_projection(self):
  for mode in ('old text','old order','old review','old revision','foreign ID','missing VI','duplicate VI','VI page','VI scope','fullbook'):
   with self.subTest(mode=mode):
    b=deepcopy(self.bundle);vi=next(x for x in b['lessons'] if x['source']['chapter']=='VI')
    if mode=='old text':b['lessons'][0]['statement']['text']+=' changed'
    elif mode=='old order':b['lessons'][0],b['lessons'][1]=b['lessons'][1],b['lessons'][0]
    elif mode=='old review':b['lessons'][0]['review']['at']='changed'
    elif mode=='old revision':b['lessons'][0]['revision']+=1
    elif mode=='foreign ID':b['lessons'].append({**vi,'id':'foreign','source':{**vi['source'],'chapter':'VII'}})
    elif mode=='missing VI':b['lessons'].remove(vi)
    elif mode=='duplicate VI':b['lessons'].append(deepcopy(vi))
    elif mode=='VI page':vi['source']['printedPages']=[999]
    elif mode=='VI scope':b['build']['chapters'].append({'chapter':8})
    else:b['build']['fullTextbookComplete']=True
    with self.assertRaises(AssertionError):validate_release(b,require_review=False)
 def copy_chain(self,temp):
  root=Path(temp);base=frozen();paths=set(base['immutableFiles'])|{FIXTURE,RECEIPT,LABELS}
  paths|={x['path'] for x in read(ROOT/RECEIPT)['evidence']}
  from chapter07_extension import RECEIPT as VII_RECEIPT,FIXTURE as VII_FIXTURE
  if (ROOT/VII_RECEIPT).exists():
   paths|={VII_RECEIPT,VII_FIXTURE}
   paths|={x['path'] for x in read(ROOT/VII_RECEIPT)['evidence']}
  for name in paths:
   p=root/name;p.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(ROOT/name,p)
  return root
 def test_runtime_chain_rejects_realistic_tampering(self):
  for mode in ('old paragraph','paragraph order','wrong VI','extra VI','missing VI','engine','old receipt','old hash','evidence'):
   with self.subTest(mode=mode),tempfile.TemporaryDirectory() as temp:
    root=self.copy_chain(temp);p=root/PREFIX/'source-inventory.json';inventory=read(p);receipt=read(root/RECEIPT)
    if mode=='old paragraph':inventory['paragraphs'][0]['title']+=' changed'
    elif mode=='paragraph order':inventory['paragraphs'][0],inventory['paragraphs'][1]=inventory['paragraphs'][1],inventory['paragraphs'][0]
    elif mode=='wrong VI':inventory['paragraphs'][-1]['number']=99
    elif mode=='extra VI':inventory['paragraphs'].append(deepcopy(PARAGRAPHS[-1]))
    elif mode=='missing VI':inventory['paragraphs'].pop()
    elif mode=='engine':(root/PREFIX/'assets/engine.js').write_bytes(b'changed')
    elif mode=='old receipt':(root/LABELS).write_bytes(b'changed')
    elif mode=='old hash':receipt['oldImplementationSha256']='forged'
    else:(root/receipt['evidence'][0]['path']).write_bytes(b'changed')
    p.write_bytes(encoded(inventory));(root/RECEIPT).write_bytes(encoded(receipt))
    with self.assertRaises(AssertionError):validate_extension(root)
 def test_historical_manifest_metadata_and_binding_are_immutable(self):
  name=PREFIX+'release-review-chapter-05.json';original=read(ROOT/name)
  for mode in ('missing binding','stale binding','old at','old evidence','unknown field','old runtime'):
   with self.subTest(mode=mode):
    obj=deepcopy(original)
    if mode=='missing binding':obj.pop('runtimeExtensionReview')
    elif mode=='stale binding':obj['runtimeExtensionReview']['sha256']='stale'
    elif mode=='old at':obj['at']='changed'
    elif mode=='old evidence':obj['evidence'].pop()
    elif mode=='unknown field':obj['newUnreviewedField']=True
    else:obj['implementationSha256']=frozen()['implementationSha256']
    with self.assertRaises(AssertionError):restore_manifest(name,encoded(obj))
 def test_builder_checks_actual_temp_course_and_old_manifest_chain(self):
  for mode in ('old inventory','engine','binding','historical reviewer'):
   with self.subTest(mode=mode),tempfile.TemporaryDirectory() as temp:
    course=Path(temp)/'course';shutil.copytree(COURSE,course)
    if mode=='old inventory':
     p=course/'source-inventory.json';obj=read(p);obj['paragraphs'][0]['title']+=' changed';p.write_bytes(encoded(obj))
    elif mode=='engine':
     p=course/'assets/engine.js';p.write_bytes(p.read_bytes()+b'\n')
    else:
     p=course/'release-review-chapter-05.json';obj=read(p)
     if mode=='binding':obj.pop('runtimeExtensionReview')
     else:obj['reviewer']='changed'
     p.write_bytes(encoded(obj))
    b=compose(course);target=next(c for c in b['build']['chapters'] if c['chapter']==5)
    self.assertFalse(target['publicationReviewMatches'])
if __name__=='__main__':unittest.main(verbosity=2)
