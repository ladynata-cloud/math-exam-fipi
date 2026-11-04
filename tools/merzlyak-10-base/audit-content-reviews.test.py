#!/usr/bin/env python3
"""Isolated negative provenance fixtures; never modifies production evidence."""
import copy
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

spec=importlib.util.spec_from_file_location('review_audit',Path(__file__).with_name('audit-content-reviews.py'))
a=importlib.util.module_from_spec(spec);spec.loader.exec_module(a)

class AuditTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name);self.addCleanup(self.tmp.cleanup)
  self.path=a.LESSON_DIR+'/ex-01-001.json';self.rpath=a.TOOL_DIR+'/independent.json'
  self.card={'schemaVersion':1,'revision':1,'id':'sample','kind':'exercise','title':'A','status':'draft','source':{},'statement':{'text':'original condition'},'visualization':{},'help':[],'steps':[],'answer':{},'review':dict.fromkeys(a.DIMENSIONS,'pending')}
  self.put(self.path,self.card);self.before=(self.root/self.path).read_bytes()
  self.report={'reviewer':'/root/reviewer','verdicts':dict.fromkeys(a.DIMENSIONS,'PASS'),'unresolved':[],'cards':[{'path':self.path,'id':'sample','sha256':a.sha(self.before),**dict.fromkeys(a.DIMENSIONS,'PASS')}]}
  self.put(self.rpath,self.report)
  self.manifest={'schemaVersion':1,'expectedLessonCount':1,'lessonDirectory':a.LESSON_DIR,'contentKeys':a.CONTENT_KEYS,'authors':[{'fileNameRegex':r'ex-01-001\.json','agent':'/root/author'}],
   'reports':[{'path':self.rpath,'sha256':a.sha((self.root/self.rpath).read_bytes()),'reviewerAgent':'/root/reviewer','identityCheck':{'selector':'reviewer','equals':'/root/reviewer'},'fileNameRegex':r'ex-01-001\.json','expectedCards':1,'records':'cards','pathKey':'path','idKey':'id','hashKey':'sha256','topLevelPassChecks':[{'selector':'verdicts.'+d,'equals':'PASS'}for d in a.DIMENSIONS],'dimensions':{d:{'selector':d,'accept':['PASS']}for d in a.DIMENSIONS},'unresolvedSelectors':['unresolved']}]}
  self.save_manifest()
 def put(self,path,data):
  p=self.root/path;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(a.json_bytes(data))
 def save_manifest(self):self.put(a.TOOL_DIR+'/content-review-manifest.json',self.manifest)
 def repin(self):
  self.put(self.rpath,self.report);self.manifest['reports'][0]['sha256']=a.sha((self.root/self.rpath).read_bytes());self.save_manifest()
 def run_audit(self):return a.audit(self.root,write=False)
 def promote(self,fallback=False):
  after=copy.deepcopy(self.card);after['status']='reviewed';after['review']=dict.fromkeys(a.DIMENSIONS,'passed');self.put(self.path,after)
  entry={'path':self.path,'lessonId':'sample','beforeSha256':a.sha(self.before),'afterSha256':a.sha((self.root/self.path).read_bytes()),'contentSha256':a.content_hash(after)}
  if fallback:entry['beforeFileUtf8']=self.before.decode()
  else:entry.update(beforeValues={'status':'draft','review':self.card['review']},serialization=a.SERIALIZATION)
  self.ledger={'schemaVersion':1,'contentKeys':a.CONTENT_KEYS,'allowedChangedKeys':['status','review'],'entries':[entry]};self.put(a.TOOL_DIR+'/content-review-ledger.json',self.ledger)
  return after
 def test_exact_draft_pass_and_no_mutation(self):
  before={p:p.read_bytes()for p in self.root.rglob('*')if p.is_file()};self.assertEqual(self.run_audit()['status'],'PASS');self.assertEqual(before,{p:p.read_bytes()for p in self.root.rglob('*')if p.is_file()})
 def test_workflow_only_ledger_pass(self):
  self.promote();r=self.run_audit();self.assertEqual(r['status'],'PASS');self.assertEqual(r['cards'][0]['evidence']['source'][0]['match'],'ledger-restored-exact')
 def test_semantic_corruption_even_with_updated_current_hash_fails(self):
  after=self.promote();after['statement']['text']='altered condition';self.put(self.path,after);e=self.ledger['entries'][0];e['afterSha256']=a.sha((self.root/self.path).read_bytes());e['contentSha256']=a.content_hash(after);self.put(a.TOOL_DIR+'/content-review-ledger.json',self.ledger);self.assertEqual(self.run_audit()['status'],'FAIL')
 def test_revision_outside_content_keys_still_fails(self):
  after=self.promote();after['revision']=2;self.put(self.path,after);self.ledger['entries'][0]['afterSha256']=a.sha((self.root/self.path).read_bytes());self.put(a.TOOL_DIR+'/content-review-ledger.json',self.ledger);self.assertEqual(self.run_audit()['status'],'FAIL')
 def test_nonstandard_before_fallback_pass(self):
  self.before=json.dumps(self.card,ensure_ascii=False,separators=(',',':')).encode();(self.root/self.path).write_bytes(self.before);self.report['cards'][0]['sha256']=a.sha(self.before);self.repin();self.promote(True);self.assertEqual(self.run_audit()['status'],'PASS')
 def test_fallback_content_substitution_fails(self):
  after=self.promote(True);after['title']='changed';self.put(self.path,after);e=self.ledger['entries'][0];e['afterSha256']=a.sha((self.root/self.path).read_bytes());e['contentSha256']=a.content_hash(after);self.put(a.TOOL_DIR+'/content-review-ledger.json',self.ledger);self.assertEqual(self.run_audit()['status'],'FAIL')
 def test_after_hash_fails(self):
  self.promote();self.ledger['entries'][0]['afterSha256']='0'*64;self.put(a.TOOL_DIR+'/content-review-ledger.json',self.ledger);self.assertEqual(self.run_audit()['status'],'FAIL')
 def test_report_tampering_without_manifest_change_fails(self):
  self.report['new']='altered';self.put(self.rpath,self.report);self.assertEqual(self.run_audit()['status'],'FAIL')
 def test_explicit_nonpass_even_after_repin_fails(self):
  self.report['cards'][0]['mathematics']='FAIL';self.repin();self.assertEqual(self.run_audit()['status'],'FAIL')
 def test_nonindependent_reviewer_fails(self):
  self.manifest['authors'][0]['agent']='/root/reviewer';self.save_manifest();self.assertEqual(self.run_audit()['status'],'FAIL')
 def test_bad_identity_and_duplicate_paths_fail(self):
  for change in ('id','path','duplicate'):
   with self.subTest(change=change):
    old=copy.deepcopy(self.report)
    if change=='duplicate':self.report['cards'].append(copy.deepcopy(self.report['cards'][0]))
    else:self.report['cards'][0][change]='bad'
    self.repin();self.assertEqual(self.run_audit()['status'],'FAIL');self.report=old
 def test_partial_or_duplicate_ledger_fails(self):
  self.promote();original=copy.deepcopy(self.ledger['entries'])
  for entries in [[],original+original]:
   self.ledger['entries']=entries;self.put(a.TOOL_DIR+'/content-review-ledger.json',self.ledger);self.assertEqual(self.run_audit()['status'],'FAIL')
 def test_missing_or_uninspected_report_is_pending(self):
  self.manifest['reports'][0]['sha256']=None;self.save_manifest();self.assertEqual(self.run_audit()['status'],'PENDING');(self.root/self.rpath).unlink();self.assertEqual(self.run_audit()['status'],'PENDING')
 def test_duplicate_dimension_agreement_is_recorded(self):
  second=copy.deepcopy(self.manifest['reports'][0]);second['path']=a.TOOL_DIR+'/independent2.json';self.put(second['path'],self.report);self.manifest['reports'].append(second);self.save_manifest();r=self.run_audit();self.assertEqual(r['status'],'PASS');self.assertEqual(r['duplicateDimensionAgreements'],3)
 def test_duplicate_json_keys_fail_closed(self):
  raw=(self.root/self.path).read_text();(self.root/self.path).write_text(raw.replace('"title": "A"','"title": "A", "title": "B"'));self.assertEqual(self.run_audit()['status'],'FAIL')

if __name__=='__main__':unittest.main()
