"""Synthetic-only release fixtures. Never an approval; writes only temp roots."""
from contextlib import contextmanager
from pathlib import Path
import json,shutil
import build_course as builder
from chapter07_extension import (ROOT,PREFIX,FIXTURE,RECEIPT,PREVIOUS_RECEIPT,BINDING,
 RUNTIME,PARAGRAPHS,SCOPE,frozen,sha,encoded,digest,has_vii,previous_inventory,
 previous_scope,restore_manifest,require)

@contextmanager
def temporary_builder_root(root):
 old=builder.ROOT;builder.ROOT=Path(root)
 try:yield
 finally:builder.ROOT=old

def compose_at(root):
 with temporary_builder_root(root):return builder.compose(Path(root)/PREFIX)

def fixture(root):
 root=Path(root).resolve()
 require(root!=ROOT and ROOT not in root.parents,'Test fixture cannot write to the repository')
 course=root/PREFIX;shutil.copytree(ROOT/PREFIX,course)
 base=frozen()
 for name in set(base['immutableFiles'])|{FIXTURE,'tools/geometry-textbook/chapter-07-source-map.json'}:
  p=root/name;p.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(ROOT/name,p)
 # Strip the later chapter only in this synthetic historical test root.
 from chapter08_extension import (has_viii,previous_inventory as before_viii,
  BINDING as VIII_BINDING,restore_manifest as before_viii_manifest,
  previous_scope as before_viii_scope)
 inventory_raw=(course/'source-inventory.json').read_bytes()
 if has_viii(inventory_raw):
  (course/'source-inventory.json').write_bytes(before_viii(inventory_raw,ROOT))
  for p in course.glob('release-review*.json'):
   if VIII_BINDING in json.loads(p.read_bytes()):
    p.write_bytes(before_viii_manifest(PREFIX+p.name,p.read_bytes(),ROOT,ROOT/PREFIX))
  p=root/'tools/geometry-textbook/release-scope.json'
  p.write_bytes(encoded(before_viii_scope(json.loads(p.read_bytes()),ROOT)))
 for folder in ['preparation','models']:
  for p in (course/folder).glob('chapter-08*.json'):p.unlink()
 (course/'release-review-chapter-08.json').unlink(missing_ok=True)
 # Reconstruct the true previous publication if tests run after promotion.
 inventory_raw=(course/'source-inventory.json').read_bytes()
 if has_vii(inventory_raw):(course/'source-inventory.json').write_bytes(previous_inventory(inventory_raw,ROOT))
 for name in base['immutableFiles']:
  if name.startswith(PREFIX+'release-review'):
   p=root/name;raw=p.read_bytes()
   if BINDING in json.loads(raw):p.write_bytes(restore_manifest(name,raw,ROOT,ROOT/PREFIX))
 scope=json.loads((root/'tools/geometry-textbook/release-scope.json').read_bytes())
 if any(c['chapter']==7 for c in scope['chapters']):scope=previous_scope(scope,ROOT)
 (root/'tools/geometry-textbook/release-scope.json').write_bytes(encoded(scope))
 (course/'candidate-chapters.json').write_bytes(encoded({'schemaVersion':1,'chapters':[{'chapter':7,'scope':SCOPE,'paragraphs':PARAGRAPHS}]}))
 (course/'release-review-chapter-07.json').unlink(missing_ok=True)
 before=compose_at(root);before_raw=(json.dumps(before,ensure_ascii=False,separators=(',',':'))+'\n').encode()
 require(sha(before_raw)==base['courseSha256'],'Test baseline failed exact893 reconstruction')
 (course/'data/course.json').write_bytes(before_raw)
 inventory=json.loads((course/'source-inventory.json').read_bytes());inventory['paragraphs']+=PARAGRAPHS
 (course/'source-inventory.json').write_bytes(encoded(inventory))
 scope['chapters'].append(SCOPE);scope['totalCards']+=190;(root/'tools/geometry-textbook/release-scope.json').write_bytes(encoded(scope))
 (course/'candidate-chapters.json').write_bytes(encoded({'schemaVersion':1,'chapters':[]}))
 evidence='docs/reviews/SYNTHETIC_VII_TEST_FIXTURE.txt';p=root/evidence;p.parent.mkdir(parents=True,exist_ok=True);p.write_text('TEST FIXTURE ONLY. NO INDEPENDENT REVIEW OR PUBLICATION APPROVAL.\n')
 files={name:sha((course/name).read_bytes()) for name in RUNTIME}
 receipt=dict(status='passed',browser='passed',reviewer='TEST FIXTURE ONLY',at='2000-01-01T00:00:00Z',previousSourceCommit=base['sourceCommit'],preservedCards=893,contentApprovalGranted=False,oldImplementationSha256=base['implementationSha256'],implementationSha256=digest(files),implementationFiles=files,paragraphsAdded=PARAGRAPHS,previousRuntimeReview={'path':PREVIOUS_RECEIPT,'sha256':base['immutableFiles'][PREVIOUS_RECEIPT]},evidence=[{'path':evidence,'sha256':sha(p.read_bytes())}])
 receipt_raw=encoded(receipt);(root/RECEIPT).write_bytes(receipt_raw);binding={'path':RECEIPT,'sha256':sha(receipt_raw)}
 for name in base['immutableFiles']:
  if name.startswith(PREFIX+'release-review'):
   p=root/name;obj=json.loads(p.read_bytes());obj['implementationSha256']=receipt['implementationSha256'];obj[BINDING]=binding;p.write_bytes(encoded(obj))
 return root,course

def synthetic_content_review(root):
 root=Path(root);course=root/PREFIX;b=compose_at(root);c=next(x for x in b['build']['chapters'] if x['chapter']==7)
 evidence='docs/reviews/SYNTHETIC_VII_TEST_FIXTURE.txt'
 manifest=dict(schemaVersion=1,status='passed',authoredContentSha256=c['authoredContentSha256'],implementationSha256=b['build']['implementationSha256'],source='passed',mathematics='passed',models='passed',pedagogy='passed',browser='passed',reviewer='TEST FIXTURE ONLY',at='2000-01-01T00:00:00Z',scope={'chapter':'VII','cards':190},evidence=[{'path':evidence,'sha256':sha((root/evidence).read_bytes())}])
 (course/'release-review-chapter-07.json').write_bytes(encoded(manifest))
 return manifest
