#!/usr/bin/env python3
"""Independent boundary checks supplement the auditor author's15fixtures."""
import copy,importlib.util,json,tempfile,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('audit_under_review',Path(__file__).with_name('audit-content-reviews.py'));a=importlib.util.module_from_spec(spec);spec.loader.exec_module(a)

class IndependentAuditReview(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name);self.addCleanup(self.temp.cleanup);self.reportpath=a.TOOL_DIR+'/proof.json'
  self.paths=[a.LESSON_DIR+f'/ex-01-00{n}.json'for n in [1,2]];self.cards=[]
  for n,p in enumerate(self.paths,1):
   d={'schemaVersion':1,'revision':1,'id':f'ex{n}','kind':'exercise','title':'Fixture','status':'draft','source':{},'statement':{'text':'Concrete condition'},'visualization':{},'help':[],'steps':[],'answer':{},'review':dict.fromkeys(a.DIMENSIONS,'pending')};self.cards.append(d);self.put(p,d)
  self.report={'reviewer':'/root/reviewer','verdict':'PASS','unresolved':[],'files':[{'path':p,'id':d['id'],'sha256':a.sha((self.root/p).read_bytes()),**dict.fromkeys(a.DIMENSIONS,'PASS')}for p,d in zip(self.paths,self.cards)]}
  self.put(self.reportpath,self.report)
  self.rule={'path':self.reportpath,'sha256':a.sha((self.root/self.reportpath).read_bytes()),'reviewerAgent':'/root/reviewer','identityCheck':{'selector':'reviewer','equals':'/root/reviewer'},'fileNameRegex':r'ex-01-00[12]\.json','expectedCards':2,'records':'files','pathKey':'path','idKey':'id','hashKey':'sha256','topLevelPassChecks':[{'selector':'verdict','equals':'PASS'}],'dimensions':{d:{'selector':d,'accept':['PASS']}for d in a.DIMENSIONS},'unresolvedSelectors':['unresolved']}
  self.manifest={'schemaVersion':1,'expectedLessonCount':2,'lessonDirectory':a.LESSON_DIR,'contentKeys':a.CONTENT_KEYS,'authors':[{'fileNameRegex':r'ex-01-00[12]\.json','agent':'/root/author'}],'reports':[self.rule]};self.write_manifest()
 def put(self,path,d):p=self.root/path;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(a.json_bytes(d))
 def write_manifest(self):self.put(a.TOOL_DIR+'/content-review-manifest.json',self.manifest)
 def repin(self):self.put(self.reportpath,self.report);self.rule['sha256']=a.sha((self.root/self.reportpath).read_bytes());self.write_manifest()
 def run_audit(self):return a.audit(self.root,write=False)
 def test_baseline_two_cards(self):r=self.run_audit();self.assertEqual(r['status'],'PASS');self.assertEqual(r['fullyReviewedCards'],2)
 def test_explicit_file_names_select_only_exact_reviewed_cards(self):
  self.rule.pop('fileNameRegex');self.rule['fileNames']=[Path(p).name for p in self.paths];self.write_manifest();self.assertEqual(self.run_audit()['status'],'PASS')
  self.rule['fileNames'][1]='ex-01-003.json';self.write_manifest();self.assertEqual(self.run_audit()['status'],'FAIL')
 def test_duplicate_explicit_file_name_rejected(self):
  self.rule.pop('fileNameRegex');self.rule['fileNames']=[Path(self.paths[0]).name]*2;self.write_manifest();self.assertEqual(self.run_audit()['status'],'FAIL')
 def test_one_bad_record_prevents_entire_report_acceptance(self):
  self.report['files'][1]['mathematics']='FAIL';self.repin();r=self.run_audit();self.assertEqual(r['status'],'FAIL');self.assertEqual(r['fullyReviewedCards'],0);self.assertTrue(all(not es for card in r['cards']for es in card['evidence'].values()))
 def test_missing_dimension_remains_pending(self):
  del self.rule['dimensions']['pedagogy'];self.write_manifest();r=self.run_audit();self.assertEqual(r['status'],'PENDING');self.assertEqual(r['dimensionPassCounts'],{'source':2,'mathematics':2,'pedagogy':0})
 def test_unresolved_report_rejected(self):self.report['unresolved']=['source text still uncertain'];self.repin();self.assertEqual(self.run_audit()['status'],'FAIL')
 def test_path_escape_rejected(self):self.rule['path']='../outside.json';self.write_manifest();self.assertEqual(self.run_audit()['status'],'FAIL')
 def test_historical_exclusion_requires_actual_all_dimension_replacement(self):
  historical=self.report['files'][1]['sha256'];self.report['files'][1]['sha256']='a'*64;self.rule['expectedCards']=1;self.rule['fileNameRegex']=r'ex-01-001\.json';newpath=a.TOOL_DIR+'/replacement.json';self.rule['excludedRecords']=[{'path':self.paths[1],'sha256':'a'*64,'reason':'superseded precise review','supersededByReport':newpath}];self.repin();self.assertEqual(self.run_audit()['status'],'FAIL')
  replacement=copy.deepcopy(self.report);replacement['files']=[replacement['files'][1]];replacement['files'][0]['sha256']=historical;self.put(newpath,replacement);r=copy.deepcopy(self.rule);r.pop('excludedRecords');r.update(path=newpath,sha256=a.sha((self.root/newpath).read_bytes()),fileNameRegex=r'ex-01-002\.json',expectedCards=1);self.manifest['reports'].append(r);self.write_manifest();self.assertEqual(self.run_audit()['status'],'PASS')
  del r['dimensions']['pedagogy'];self.write_manifest();self.assertEqual(self.run_audit()['status'],'FAIL')
 def test_writing_evidence_does_not_mutate_cards_or_reports(self):
  snapshot={str(p.relative_to(self.root)):p.read_bytes()for p in self.root.rglob('*')if p.is_file()};r=a.audit(self.root,write=True);self.assertEqual(r['status'],'PASS')
  for name,raw in snapshot.items():self.assertEqual((self.root/name).read_bytes(),raw)
  self.assertTrue((self.root/a.TOOL_DIR/'content-review-audit.json').exists())

if __name__=='__main__':unittest.main()
