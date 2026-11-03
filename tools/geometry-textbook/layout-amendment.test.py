"""The layout exception is exact and reversible, never a wildcard hash bypass."""
import hashlib,json,shutil,tempfile,unittest
from pathlib import Path
from layout_amendment import BASE,PATCH,historical_bytes
from build_course import ROOT,COURSE,compose

class LayoutAmendment(unittest.TestCase):
 def test_exact_two_file_boundary_and_original_bytes(self):
  patch=json.loads(PATCH.read_text());self.assertEqual(set(patch['files']),set(BASE))
  for name,item in patch['files'].items():
   current=(COURSE/name).read_bytes();self.assertEqual(hashlib.sha256(current).hexdigest(),item['afterSha256'])
   original=historical_bytes(COURSE/name);self.assertEqual(hashlib.sha256(original).hexdigest(),BASE[name])
   self.assertEqual(historical_bytes(COURSE/name,original),original)
   if name.endswith('.css'):
    self.assertTrue(current.startswith(original),'Existing sizing, labels and viewer CSS stays byte-identical')
   else:
    self.assertEqual(len(item['changes']),2)
    for change in item['changes']:
     self.assertTrue(change['before'].startswith(('  const header=', '  main.append(')))
     self.assertNotIn('save()',change['after']);self.assertNotIn('localStorage',change['after'])
 def test_changed_math_storage_or_unreviewed_css_is_not_normalized(self):
  for name in BASE:
   raw=(COURSE/name).read_bytes()
   for changed in (raw+b'\n/* unreviewed */',raw.replace(b'font-size',b'font-FAKE-size',1),raw.replace(b'function save()',b'function changedSave()',1)):
    if changed!=raw:self.assertEqual(historical_bytes(COURSE/name,changed),changed)
 def test_all1247_cards_and_historical_review_identity_remain_exact(self):
  actual=compose();published=json.loads((COURSE/'data/course.json').read_text())
  self.assertEqual(actual,published,'No teaching/review/revision/storage-key migration')
  self.assertEqual(len(actual['lessons']),1247)
  self.assertTrue(actual['build']['publicationReviewMatches'])
 def test_unbound_runtime_change_invalidates_publication(self):
  with tempfile.TemporaryDirectory() as folder:
   course=Path(folder)/'course';shutil.copytree(COURSE,course)
   p=course/'assets/engine.js';p.write_bytes(p.read_bytes()+b'\n/* not bound to the UI amendment */')
   result=compose(course)
   self.assertFalse(result['build']['publicationReviewMatches'])
   self.assertTrue(all(x['status']=='in-review' for x in result['lessons']))
 def test_other_files_cannot_use_the_layout_exception(self):
  raw=(COURSE/'assets/engine.js').read_bytes()
  self.assertEqual(historical_bytes(Path('unrelated.js'),raw),raw)

if __name__=='__main__':unittest.main()
