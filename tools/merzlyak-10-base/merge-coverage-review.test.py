#!/usr/bin/env python3
"""Independent regression review of explicit coverage imports.
Fixtures are isolated in temporary directories; production lessons/index are never changed.
"""
import copy,json,os,shutil,subprocess,tempfile,unittest
from pathlib import Path
R=Path(__file__).resolve().parents[2]

class CoverageImportReview(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name);self.course=self.root/'stereo-course/merzlyak-10-base';(self.course/'lessons').mkdir(parents=True)
  self.tool=self.root/'tools/merzlyak-10-base/merge-coverage.py';self.tool.parent.mkdir(parents=True);shutil.copyfile(R/'tools/merzlyak-10-base/merge-coverage.py',self.tool)
  self.index={'schemaVersion':1,'inventoryComplete':False,'bibliographicMetadata':{'retained':True},'entries':[]};self.counter=0
 def tearDown(self):self.temp.cleanup()
 def source(self,collection='main',chapter='Глава1',exercise='1.1',point=None,part=None,pages=None):
  d={'bookId':'merzlyak-2022-10-base','collection':collection,'chapter':chapter,'printedPages':[p-1 for p in(pages or[11])],'pdfPages':pages or[11]}
  if exercise is not None:d['exercise']=exercise
  if point is not None:d['point']=point
  if part is not None:d['subpart']=part
  return d
 def entry(self,identity,source):self.index['entries'].append({'id':identity,'source':copy.deepcopy(source),'requiredParts':['pending-placeholder'],'extraMetadata':'keep'})
 def lesson(self,source):
  self.counter+=1;p=self.course/f'lessons/test-{self.counter}.json';p.write_text(json.dumps({'id':f'test-{self.counter}','source':source,'status':'draft','review':{'source':'pending','mathematics':'pending','pedagogy':'pending'}}));return p.relative_to(self.root).as_posix()
 def write_manifest(self,obj):
  self.counter+=1;p=self.tool.parent/f'coverage-test-{self.counter}.json';p.write_text(json.dumps(obj));return p
 def run_import(self,*manifests):
  p=self.course/'source-index.json';p.write_text(json.dumps(self.index,ensure_ascii=False,indent=2)+'\n');before=p.read_bytes();lessons={str(q):q.read_bytes()for q in(self.course/'lessons').glob('*.json')}
  result=subprocess.run(['python3',str(self.tool),*map(str,manifests)],capture_output=True,text=True,env=dict(os.environ,PYTHONDONTWRITEBYTECODE='1'))
  for q,data in lessons.items():self.assertEqual(Path(q).read_bytes(),data,'importer must never promote or modify authored lessons')
  return result,before,p.read_bytes()
 def test_explicit_entries_pages_union_metadata_and_inventory_preserved(self):
  s=self.source();self.entry('source1',s);f=self.lesson(self.source(pages=[11,12]));m=self.write_manifest({'entries':[{'sourceId':'source1','requiredParts':[None],'lessonFiles':[f],'pdfPages':[10,11],'textbookParts':['а','б']}]})
  result,before,after=self.run_import(m);self.assertEqual(result.returncode,0,result.stderr);x=json.loads(after);self.assertFalse(x['inventoryComplete']);self.assertTrue(x['bibliographicMetadata']['retained']);e=x['entries'][0];self.assertEqual(e['requiredParts'],[None]);self.assertEqual(e['source']['pdfPages'],[10,11,12]);self.assertEqual(e['source']['printedPages'],[9,10,11]);self.assertEqual(e['extraMetadata'],'keep');self.assertEqual(e['textbookParts'],['а','б'])
 def test_theory_paragraphs_format_with_overview_and_details(self):
  s=self.source('theory',exercise=None,point='1');self.entry('theory1',s);f=self.lesson(self.source('theory',exercise=None,point='1',part='обзор'));g=self.lesson(self.source('theory',exercise=None,point='1',part='доказательство',pages=[12]));m=self.write_manifest({'paragraphs':[{'sourceId':'theory1','requiredParts':['обзор','доказательство'],'overview':{'file':f},'addedLessons':[{'file':g}],'pdfPages':[11]}]})
  result,_,after=self.run_import(m);self.assertEqual(result.returncode,0,result.stderr);self.assertEqual(json.loads(after)['entries'][0]['requiredParts'],['обзор','доказательство'])
 def test_theory_existing_overview_format(self):
  s=self.source('theory',exercise=None,point='10');self.entry('theory10',s);f=self.lesson(self.source('theory',exercise=None,point='10',part='обзор'));g=self.lesson(self.source('theory',exercise=None,point='10',part='задача',pages=[12]));m=self.write_manifest({'entries':[{'sourceEntryId':'theory10','requiredParts':['обзор','задача'],'existingOverview':{'lessonFile':f},'newLessonFiles':[g],'sourcePdfPages':[11]}]})
  result,_,after=self.run_import(m);self.assertEqual(result.returncode,0,result.stderr);self.assertEqual(json.loads(after)['entries'][0]['source']['pdfPages'],[11,12])
 def test_wrong_local_chapter_rejected_and_failure_atomic_for_both_collections(self):
  for collection in ['selfcheck','example']:
   with self.subTest(collection=collection):
    self.index['entries']=[];s=self.source(collection,chapter='Глава1',exercise='1');self.entry('good',s);self.entry('wrongchapter',s)
    f=self.lesson(s);g=self.lesson(self.source(collection,chapter='Глава2',exercise='1'))
    m=self.write_manifest({'entries':[{'sourceId':'good','requiredParts':[None],'file':f},{'sourceId':'wrongchapter','requiredParts':[None],'file':g}]})
    result,before,after=self.run_import(m);self.assertNotEqual(result.returncode,0,'chapter-scoped source identity must be checked');self.assertIn('chapter',result.stderr);self.assertEqual(after,before,'later failure must not partially write the first valid record')
 def test_wrong_book_and_unknown_part_rejected_atomically(self):
  s=self.source();self.entry('source1',s)
  for mode in ['book','part']:
   with self.subTest(mode=mode):
    bad=copy.deepcopy(s)
    if mode=='book':bad['bookId']='other'
    else:bad['subpart']='неизвестнаячасть'
    f=self.lesson(bad);m=self.write_manifest({'entries':[{'sourceId':'source1','requiredParts':[None],'file':f}]});result,before,after=self.run_import(m);self.assertNotEqual(result.returncode,0);self.assertEqual(after,before)
 def test_duplicate_required_parts_rejected(self):
  s=self.source();self.entry('source1',s);f=self.lesson(s);m=self.write_manifest({'entries':[{'sourceId':'source1','requiredParts':[None,None],'file':f}]});result,before,after=self.run_import(m);self.assertNotEqual(result.returncode,0);self.assertEqual(after,before)

if __name__=='__main__':unittest.main()
