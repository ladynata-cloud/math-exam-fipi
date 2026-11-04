#!/usr/bin/env python3
"""Independent negative fixtures for the root-authored status-transition helper.
Fixture ledger rows are test data, never evidence for production lesson approval.
"""
import copy,importlib.util,json,tempfile,unittest
from pathlib import Path
R=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('state_under_review',R/'tools/merzlyak-10-base/review_state.py');state=importlib.util.module_from_spec(spec);spec.loader.exec_module(state)

class StateReview(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name);state.ROOT=self.root;state.ledger_entries.cache_clear();self.path=self.root/'stereo-course/merzlyak-10-base/lessons/test.json';self.path.parent.mkdir(parents=True);self.ledgerpath=self.root/'tools/merzlyak-10-base/content-review-ledger.json';self.ledgerpath.parent.mkdir(parents=True)
  self.draft=json.loads((R/'stereo-course/merzlyak-10-base/lessons/ex-14-005.json').read_text());self.draft.update(id='test',status='draft',review={'source':'pending','mathematics':'pending','pedagogy':'pending'})
  self.after=copy.deepcopy(self.draft);self.after.update(status='reviewed',review={'source':'passed','mathematics':'passed','pedagogy':'passed','reviewer':'Independent fixture reviewer','at':'2026-10-22T23:00:00+00:00'})
  self.row={'lessonId':'test','path':self.path.relative_to(self.root).as_posix(),'beforeSha256':state.sha(state.serialized(self.draft)),'afterSha256':state.sha(state.serialized(self.after)),'contentSha256':state.content_sha(self.after),'beforeValues':{'status':'draft','review':copy.deepcopy(self.draft['review'])}}
  self.ledger={'schemaVersion':1,'contentKeys':state.CONTENT_KEYS,'allowedChangedKeys':['status','review'],'serialization':state.SERIALIZATION,'entries':[self.row]};self.write()
 def tearDown(self):state.ledger_entries.cache_clear();state.ROOT=R;self.temp.cleanup()
 def write(self):self.path.write_bytes(state.serialized(self.after));self.ledgerpath.write_text(json.dumps(self.ledger));state.ledger_entries.cache_clear()
 def rejected(self,lesson=None):
  with self.assertRaises((AssertionError,KeyError,FileNotFoundError,TypeError,ValueError)):state.assert_review_state(lesson or self.after)
 def test_valid_draft_requires_no_ledger(self):self.ledgerpath.unlink();self.assertTrue(state.assert_review_state(self.draft))
 def test_valid_transition_and_authored_hash(self):
  self.assertTrue(state.assert_review_state(self.after));self.assertTrue(state.matches_reviewed_hash(self.path,self.row['beforeSha256']));self.assertTrue(state.matches_reviewed_hash(self.path,self.row['afterSha256']));self.assertFalse(state.matches_reviewed_hash(self.path,'0'*64))
 def test_wrong_status_or_review_rejected(self):
  for status,review in [('draft',self.after['review']),('in-review',self.draft['review']),('reviewed',self.draft['review'])]:
   with self.subTest(status=status,review=review):d=copy.deepcopy(self.draft);d.update(status=status,review=review);self.rejected(d)
 def test_missing_review_metadata_rejected_even_with_matching_file_hash(self):
  baseline=copy.deepcopy(self.after['review'])
  for key in ['reviewer','at']:
   with self.subTest(key=key):
    self.after['review']=copy.deepcopy(baseline);del self.after['review'][key];self.row['afterSha256']=state.sha(state.serialized(self.after));self.write();self.rejected()
 def test_invalid_reviewer_rejected_even_with_matching_file_hash(self):
  baseline=copy.deepcopy(self.after['review'])
  for value in ['', '   ', None, 123, []]:
   with self.subTest(value=value):
    self.after['review']=copy.deepcopy(baseline);self.after['review']['reviewer']=value;self.row['afterSha256']=state.sha(state.serialized(self.after));self.write();self.rejected()
 def test_invalid_review_time_rejected_even_with_matching_file_hash(self):
  baseline=copy.deepcopy(self.after['review'])
  for value in ['', 'not a date', '2026-10-22', '2026-10-22T23:00:00', '2026-02-30T23:00:00Z', '2026-10-22T23:00:00+99:00', None, 123, []]:
   with self.subTest(value=value):
    self.after['review']=copy.deepcopy(baseline);self.after['review']['at']=value;self.row['afterSha256']=state.sha(state.serialized(self.after));self.write();self.rejected()
 def test_reviewed_without_ledger_rejected(self):self.ledgerpath.unlink();self.rejected()
 def test_plain_after_file_mutation_rejected(self):self.after['statement']['text']+=' tampered';self.write();self.rejected()
 def test_updated_current_hash_and_content_hash_cannot_hide_content_change(self):
  self.after['steps'][0]['explanation']+=' tampered';self.row['afterSha256']=state.sha(state.serialized(self.after));self.row['contentSha256']=state.content_sha(self.after);self.write();self.rejected()
 def test_revision_and_unknown_field_also_bound_by_before_hash(self):
  for key,value in [('revision',123),('unexpectedMetadata','tampered')]:
   with self.subTest(key=key):
    old=copy.deepcopy(self.after);self.after[key]=value;self.row['afterSha256']=state.sha(state.serialized(self.after));self.row['contentSha256']=state.content_sha(self.after);self.write();self.rejected();self.after=old
 def test_wrong_in_memory_lesson_rejected(self):d=copy.deepcopy(self.after);d['title']+='different';self.rejected(d)
 def test_invalid_prior_state_rejected(self):self.row['beforeValues']['status']='reviewed';self.write();self.rejected()
 def test_wrong_after_digest_rejected(self):self.row['afterSha256']='0'*64;self.write();self.rejected()
 def test_wrong_content_digest_rejected(self):self.row['contentSha256']='0'*64;self.write();self.rejected()
 def test_duplicate_identity_or_path_rejected(self):
  for mode in ['id','path']:
   with self.subTest(mode=mode):
    other=copy.deepcopy(self.row)
    if mode=='id':other['path']='stereo-course/merzlyak-10-base/lessons/other.json'
    else:other['lessonId']='other'
    self.ledger['entries']=[self.row,other];self.write();self.rejected()
 def test_unsafe_allowed_changes_rejected(self):self.ledger['allowedChangedKeys'].append('steps');self.write();self.rejected()
 def test_wrong_path_and_missing_row_rejected(self):
  self.row['path']='outside.json';(self.root/'outside.json').write_bytes(state.serialized(self.after));self.write();self.rejected();self.ledger['entries']=[];self.write();self.rejected()
 def test_noncanonical_bytes_rejected_even_with_updated_hash(self):
  raw=json.dumps(self.after,ensure_ascii=False).encode();self.path.write_bytes(raw);self.row['afterSha256']=state.sha(raw);self.ledgerpath.write_text(json.dumps(self.ledger));state.ledger_entries.cache_clear();self.rejected()

if __name__=='__main__':unittest.main()
