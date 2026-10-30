#!/usr/bin/env python3
"""VII chain, exact1083 union and negative probes; synthetic receipts stay temp-only."""
from copy import deepcopy
import json,tempfile,unittest
from pathlib import Path
from build_course import compose,read
from chapter07_preservation import assert_public893
from chapter07_extension import (ROOT,PREFIX,RECEIPT,PREVIOUS_RECEIPT,BINDING,RUNTIME,
 frozen,encoded,sha,digest,validate_extension,restore_manifest,assert_893_preserved)
from chapter07_release import validate_release
from chapter07_release_test_support import fixture,compose_at,synthetic_content_review

class ChapterVIIRelease(unittest.TestCase):
 def test_current_declared_candidate_or_release_stage(self):
  b=compose()
  if any(c['chapter']==7 for c in b['build']['chapters']):validate_release(b)
  else:assert_public893(b)
 def test_runtime_receipt_never_approves190_new_cards(self):
  with tempfile.TemporaryDirectory() as temp:
   root,course=fixture(temp);b=compose_at(root);validate_extension(root,course)
   validate_release(b,root,course,require_review=False)
   self.assertEqual(sum(l['status']=='reviewed' for l in b['lessons']),893)
   self.assertTrue(all(l['status']=='in-review' for l in b['lessons'] if l['source']['chapter']=='VII'))
   with self.assertRaises(AssertionError):validate_release(b,root,course)
 def test_all_seven_previous_manifests_restore_exact_git_snapshot_bytes(self):
  with tempfile.TemporaryDirectory() as temp:
   root,course=fixture(temp);base=frozen(root);names=[n for n in base['immutableFiles'] if n.startswith(PREFIX+'release-review')];self.assertEqual(len(names),7)
   for name in names:self.assertEqual(sha(restore_manifest(name,(root/name).read_bytes(),root,course)),base['immutableFiles'][name])
 def test_semantic_runtime_tampering_fails_even_with_rehashed_receipt(self):
  for mode in ['old paragraph','old order','wrong VII','missing VII','extra VII','engine','runtime name','previous receipt','previous binding','old runtime','evidence','content approval']:
   with self.subTest(mode=mode),tempfile.TemporaryDirectory() as temp:
    root,course=fixture(temp);p=course/'source-inventory.json';inv=read(p);review=read(root/RECEIPT)
    if mode=='old paragraph':inv['paragraphs'][0]['title']+=' changed'
    elif mode=='old order':inv['paragraphs'][0],inv['paragraphs'][1]=inv['paragraphs'][1],inv['paragraphs'][0]
    elif mode=='wrong VII':inv['paragraphs'][-1]['pointNumbers'][1]=999
    elif mode=='missing VII':inv['paragraphs'].pop()
    elif mode=='extra VII':inv['paragraphs'].append(deepcopy(inv['paragraphs'][-1]))
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
 def test_missing_stale_and_wrong_chapter_vii_review_keeps893_old_cards(self):
  with tempfile.TemporaryDirectory() as temp:
   root,course=fixture(temp);original=synthetic_content_review(root);b=compose_at(root);validate_release(b,root,course)
   for mode in ['missing','content','runtime','chapter','verdict']:
    with self.subTest(mode=mode):
     p=course/'release-review-chapter-07.json';obj=deepcopy(original)
     if mode=='missing':p.unlink(missing_ok=True)
     else:
      if mode=='content':obj['authoredContentSha256']='stale'
      elif mode=='runtime':obj['implementationSha256']='stale'
      elif mode=='chapter':obj['scope']['chapter']='VI'
      else:obj['mathematics']='pending'
      p.write_bytes(encoded(obj))
     b=compose_at(root);assert_893_preserved(b,root,course)
     self.assertEqual(sum(l['status']=='reviewed' for l in b['lessons']),893)
     with self.assertRaises(AssertionError):validate_release(b,root,course)
 def test_full_union_rejects_corruptions_that_historical_projections_cannot_see(self):
  with tempfile.TemporaryDirectory() as temp:
   root,course=fixture(temp);synthetic_content_review(root);original=compose_at(root);validate_release(original,root,course)
   for mode in ['old text','old order','old review','old revision','foreign VIII','foreign VII','missing VII','duplicate VII','VII page','VII scope','fullbook','new review','new at','new verdict','catalog order','full digest','chapter digest','chapter count','global review','new authored']:
    with self.subTest(mode=mode):
     b=deepcopy(original);vii=next(x for x in b['lessons'] if x['source']['chapter']=='VII')
     if mode=='old text':b['lessons'][0]['statement']['text']+=' changed'
     elif mode=='old order':b['lessons'][0],b['lessons'][1]=b['lessons'][1],b['lessons'][0]
     elif mode=='old review':b['lessons'][0]['review']['reviewer']='changed'
     elif mode=='old revision':b['lessons'][0]['revision']+=1
     elif mode.startswith('foreign '):b['lessons'].append({**vii,'id':'foreign','source':{**vii['source'],'chapter':mode.split()[1]}})
     elif mode=='missing VII':b['lessons'].remove(vii)
     elif mode=='duplicate VII':b['lessons'].append(deepcopy(vii))
     elif mode=='VII page':vii['source']['printedPages']=[999]
     elif mode=='VII scope':b['build']['chapters'].append({'chapter':8})
     elif mode=='fullbook':b['build']['fullTextbookComplete']=True
     elif mode=='new review':vii['review']['reviewer']='changed'
     elif mode=='new at':vii['review']['at']='changed'
     elif mode=='new verdict':vii['review']['mathematics']='pending'
     elif mode=='catalog order':
      indices=[i for i,x in enumerate(b['catalog']['entries']) if x['source']['chapter']=='VII'];a,c=indices[:2];b['catalog']['entries'][a],b['catalog']['entries'][c]=b['catalog']['entries'][c],b['catalog']['entries'][a]
     elif mode=='full digest':b['build']['authoredContentSha256']='stale'
     elif mode=='chapter digest':b['build']['chapters'][0]['authoredContentSha256']='stale'
     elif mode=='chapter count':b['build']['chapters'][0]['authoredCards']=1
     elif mode=='global review':b['build']['publicationReviewMatches']=False
     else:vii['statement']['text']+=' changed'
     with self.assertRaises(AssertionError):validate_release(b,root,course)
 def test_pending_review_provenance_is_also_exact(self):
  with tempfile.TemporaryDirectory() as temp:
   root,course=fixture(temp);b=compose_at(root);next(x for x in b['lessons'] if x['source']['chapter']=='VII')['review']['reviewer']='unearned approval'
   with self.assertRaises(AssertionError):validate_release(b,root,course,require_review=False)
 def test_missing_runtime_receipt_never_preserves_amended_approval(self):
  with tempfile.TemporaryDirectory() as temp:
   root,course=fixture(temp);(root/RECEIPT).unlink();b=compose_at(root)
   self.assertEqual(sum(l['status']=='reviewed' for l in b['lessons']),0)
   with self.assertRaises(FileNotFoundError):validate_extension(root,course)

if __name__=='__main__':unittest.main(verbosity=2)
