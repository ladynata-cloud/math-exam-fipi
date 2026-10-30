#!/usr/bin/env python3
"""VIII chain, exact1247 union and negative probes; synthetic receipts stay temp-only."""
from copy import deepcopy
import json,tempfile,unittest
from pathlib import Path
from build_course import compose,read
from chapter08_preservation import assert_public1083
from chapter08_extension import (ROOT,PREFIX,RECEIPT,PREVIOUS_RECEIPT,BINDING,RUNTIME,
 frozen,encoded,sha,digest,validate_extension,restore_manifest,assert_1083_preserved)
from chapter08_release import validate_release
from chapter08_release_test_support import fixture,compose_at,synthetic_content_review

class ChapterVIIIRelease(unittest.TestCase):
 def test_current_declared_candidate_or_release_stage(self):
  b=compose()
  if any(c['chapter']==8 for c in b['build']['chapters']):validate_release(b)
  else:assert_public1083(b)
 def test_runtime_receipt_never_approves164_new_cards(self):
  with tempfile.TemporaryDirectory() as temp:
   root,course=fixture(temp);b=compose_at(root);validate_extension(root,course)
   validate_release(b,root,course,require_review=False)
   self.assertEqual(sum(l['status']=='reviewed' for l in b['lessons']),1083)
   self.assertTrue(all(l['status']=='in-review' for l in b['lessons'] if l['source']['chapter']=='VIII'))
   with self.assertRaises(AssertionError):validate_release(b,root,course)
 def test_all_eight_previous_manifests_restore_exact_git_snapshot_bytes(self):
  with tempfile.TemporaryDirectory() as temp:
   root,course=fixture(temp);base=frozen(root);names=[n for n in base['immutableFiles'] if n.startswith(PREFIX+'release-review')];self.assertEqual(len(names),8)
   for name in names:self.assertEqual(sha(restore_manifest(name,(root/name).read_bytes(),root,course)),base['immutableFiles'][name])
 def test_semantic_runtime_tampering_fails_even_with_rehashed_receipt(self):
  for mode in ['old paragraph','old order','wrong VIII','missing VIII','extra VIII','engine','runtime name','previous receipt','previous binding','old runtime','evidence','content approval']:
   with self.subTest(mode=mode),tempfile.TemporaryDirectory() as temp:
    root,course=fixture(temp);p=course/'source-inventory.json';inv=read(p);review=read(root/RECEIPT)
    if mode=='old paragraph':inv['paragraphs'][0]['title']+=' changed'
    elif mode=='old order':inv['paragraphs'][0],inv['paragraphs'][1]=inv['paragraphs'][1],inv['paragraphs'][0]
    elif mode=='wrong VIII':inv['paragraphs'][-1]['pointNumbers'][1]=999
    elif mode=='missing VIII':inv['paragraphs'].pop()
    elif mode=='extra VIII':inv['paragraphs'].append(deepcopy(inv['paragraphs'][-1]))
    elif mode=='engine':(course/'assets/engine.js').write_bytes(b'changed')
    elif mode=='previous receipt':(root/PREVIOUS_RECEIPT).write_bytes(b'changed')
    elif mode=='previous binding':review['previousRuntimeReview']['sha256']='forged'
    elif mode=='old runtime':review['oldImplementationSha256']='forged'
    elif mode=='evidence':(root/review['evidence'][0]['path']).write_bytes(b'changed')
    elif mode=='content approval':review['contentApprovalGranted']=True
    p.write_bytes(encoded(inv));files={name:sha((course/name).read_bytes()) for name in RUNTIME}
    if mode=='runtime name':files['unreviewed.js']='forged'
    review['implementationFiles']=files;review['implementationSha256']=digest(files);(root/RECEIPT).write_bytes(encoded(review))
    with self.assertRaises((AssertionError,ValueError)):validate_extension(root,course)
 def test_every_prior_manifest_rejects_rewritten_history_and_binding(self):
  with tempfile.TemporaryDirectory() as temp:
   root,course=fixture(temp);names=[n for n in frozen(root)['immutableFiles'] if n.startswith(PREFIX+'release-review')]
   for name in names:
    for mode in ['binding','reviewer','timestamp','old receipt','unknown field','runtime']:
     with self.subTest(name=name,mode=mode):
      obj=read(root/name)
      if mode=='binding':obj.pop(BINDING)
      elif mode=='reviewer':obj['reviewer']='changed'
      elif mode=='timestamp':obj['at']='changed'
      elif mode=='old receipt':obj['runtimeExtensionReview']={'forged':True}
      elif mode=='unknown field':obj['unreviewedField']=True
      else:obj['implementationSha256']='stale'
      with self.assertRaises(AssertionError):restore_manifest(name,encoded(obj),root,course)
 def test_missing_stale_and_wrong_chapter_viii_review_keeps1083_old_cards(self):
  with tempfile.TemporaryDirectory() as temp:
   root,course=fixture(temp);original=synthetic_content_review(root);b=compose_at(root);validate_release(b,root,course)
   for mode in ['missing','content','runtime','chapter','verdict']:
    with self.subTest(mode=mode):
     p=course/'release-review-chapter-08.json';obj=deepcopy(original)
     if mode=='missing':p.unlink(missing_ok=True)
     else:
      if mode=='content':obj['authoredContentSha256']='stale'
      elif mode=='runtime':obj['implementationSha256']='stale'
      elif mode=='chapter':obj['scope']['chapter']='VI'
      else:obj['mathematics']='pending'
      p.write_bytes(encoded(obj))
     b=compose_at(root);assert_1083_preserved(b,root,course)
     self.assertEqual(sum(l['status']=='reviewed' for l in b['lessons']),1083)
     with self.assertRaises(AssertionError):validate_release(b,root,course)
 def test_full_union_rejects_corruptions_that_historical_projections_cannot_see(self):
  with tempfile.TemporaryDirectory() as temp:
   root,course=fixture(temp);synthetic_content_review(root);original=compose_at(root);validate_release(original,root,course)
   for mode in ['old text','old order','old review','old revision','foreign IX','foreign VIII','missing VIII','duplicate VIII','VIII page','VIII scope','fullbook','new review','new at','new verdict','catalog order','full digest','chapter digest','chapter count','global review','new authored']:
    with self.subTest(mode=mode):
     b=deepcopy(original);vii=next(x for x in b['lessons'] if x['source']['chapter']=='VIII')
     if mode=='old text':b['lessons'][0]['statement']['text']+=' changed'
     elif mode=='old order':b['lessons'][0],b['lessons'][1]=b['lessons'][1],b['lessons'][0]
     elif mode=='old review':b['lessons'][0]['review']['reviewer']='changed'
     elif mode=='old revision':b['lessons'][0]['revision']+=1
     elif mode.startswith('foreign '):b['lessons'].append({**vii,'id':'foreign','source':{**vii['source'],'chapter':mode.split()[1]}})
     elif mode=='missing VIII':b['lessons'].remove(vii)
     elif mode=='duplicate VIII':b['lessons'].append(deepcopy(vii))
     elif mode=='VIII page':vii['source']['printedPages']=[999]
     elif mode=='VIII scope':b['build']['chapters'].append({'chapter':9})
     elif mode=='fullbook':b['build']['fullTextbookComplete']=True
     elif mode=='new review':vii['review']['reviewer']='changed'
     elif mode=='new at':vii['review']['at']='changed'
     elif mode=='new verdict':vii['review']['mathematics']='pending'
     elif mode=='catalog order':
      indices=[i for i,x in enumerate(b['catalog']['entries']) if x['source']['chapter']=='VIII'];a,c=indices[:2];b['catalog']['entries'][a],b['catalog']['entries'][c]=b['catalog']['entries'][c],b['catalog']['entries'][a]
     elif mode=='full digest':b['build']['authoredContentSha256']='stale'
     elif mode=='chapter digest':b['build']['chapters'][0]['authoredContentSha256']='stale'
     elif mode=='chapter count':b['build']['chapters'][0]['authoredCards']=1
     elif mode=='global review':b['build']['publicationReviewMatches']=False
     else:vii['statement']['text']+=' changed'
     with self.assertRaises(AssertionError):validate_release(b,root,course)
 def test_coherent_hash_forgeries_cannot_reorder_or_relabel_the_release(self):
  with tempfile.TemporaryDirectory() as temp:
   root,course=fixture(temp);synthetic_content_review(root);original=compose_at(root)
   for mode in ['chapter position','source metadata','kind','title','book','runtime files','review file','build metadata','rewritten content']:
    with self.subTest(mode=mode):
     b=deepcopy(original);row=next(x for x in b['lessons'] if x['source']['chapter']=='VIII')
     if mode=='chapter position':
      b['lessons']=[x for x in b['lessons'] if x['source']['chapter']=='VIII']+[x for x in b['lessons'] if x['source']['chapter']!='VIII']
     elif mode=='source metadata':row['source']['advancedGrade']=7
     elif mode=='kind':row['kind']='theory'
     elif mode=='title':row['title']='Invented source title'
     elif mode=='book':b['catalog']['book']['edition']='another edition'
     elif mode=='runtime files':b['build']['implementationFiles']['assets/engine.js']='forged'
     elif mode=='review file':b['build']['chapters'][0]['reviewFile']='unbound.json'
     elif mode=='build metadata':b['build']['unearnedPublicationApproved']=True
     else:row['statement']['text']+=' forged despite updated aggregate hashes'
     b['catalog']['entries']=[{k:r[k] for k in ('id','revision','kind','title','status','source')} for r in b['lessons']]
     authored=deepcopy(b['lessons'])
     for r in authored:r.pop('review');r['status']='draft'
     b['build']['authoredContentSha256']=digest(authored)
     for chapter in b['build']['chapters']:
      chapter['authoredContentSha256']=digest([r for r in authored if r['source']['chapter']==chapter['chapterLabel']])
     with self.assertRaises(AssertionError):validate_release(b,root,course,require_review=False)
 def test_historical_release_gate_validates_full_union_before_projection(self):
  from chapter07_release import validate_release as validate_vii
  with tempfile.TemporaryDirectory() as temp:
   root,course=fixture(temp);synthetic_content_review(root);b=compose_at(root);validate_vii(b,root,course)
   for mode in ['missing','foreign','metadata','order']:
    with self.subTest(mode=mode):
     changed=deepcopy(b);row=next(x for x in changed['lessons'] if x['source']['chapter']=='VIII')
     if mode=='missing':changed['lessons'].remove(row)
     elif mode=='foreign':row['source']['chapter']='IX'
     elif mode=='metadata':row['review']['at']='forged'
     else:changed['lessons'][0],changed['lessons'][-51]=changed['lessons'][-51],changed['lessons'][0]
     with self.assertRaises(AssertionError):validate_vii(changed,root,course,require_review=False)
 def test_source_map_content_cannot_change_behind_unchanged_inventory_counts(self):
  with tempfile.TemporaryDirectory() as temp:
   root,course=fixture(temp);original=synthetic_content_review(root);bundle=compose_at(root);validate_release(bundle,root,course)
   source_path=root/'tools/geometry-textbook/chapter-08-source-map.json';source=read(source_path)
   source['exercises'][0]['canonicalCondition']+=' changed'
   source_path.write_bytes(encoded(source))
   with self.assertRaisesRegex(AssertionError,'evidence'):validate_release(bundle,root,course)
   manifest=deepcopy(original);manifest['evidence']=[e for e in manifest['evidence'] if e['path']!='tools/geometry-textbook/chapter-08-source-map.json']
   (course/'release-review-chapter-08.json').write_bytes(encoded(manifest))
   with self.assertRaisesRegex(AssertionError,'source map'):validate_release(bundle,root,course)
 def test_stager_rejects_working_tree_existing_output_and_absent_receipts(self):
  from stage_chapter08_release import stage
  with self.assertRaisesRegex(AssertionError,'outside'):stage(ROOT/'stage-test')
  with tempfile.TemporaryDirectory() as temp:
   with self.assertRaisesRegex(AssertionError,'never overwritten'):stage(temp)
   if not (ROOT/RECEIPT).exists():
    with self.assertRaises(FileNotFoundError):stage(Path(temp)/'without-approval')
    self.assertFalse((Path(temp)/'without-approval').exists())
 def test_pending_review_provenance_is_also_exact(self):
  with tempfile.TemporaryDirectory() as temp:
   root,course=fixture(temp);b=compose_at(root);next(x for x in b['lessons'] if x['source']['chapter']=='VIII')['review']['reviewer']='unearned approval'
   with self.assertRaises(AssertionError):validate_release(b,root,course,require_review=False)
 def test_missing_runtime_receipt_never_preserves_amended_approval(self):
  with tempfile.TemporaryDirectory() as temp:
   root,course=fixture(temp);(root/RECEIPT).unlink();b=compose_at(root)
   self.assertEqual(sum(l['status']=='reviewed' for l in b['lessons']),0)
   with self.assertRaises(FileNotFoundError):validate_extension(root,course)

if __name__=='__main__':unittest.main(verbosity=2)
