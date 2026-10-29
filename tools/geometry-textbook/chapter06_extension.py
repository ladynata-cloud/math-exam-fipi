"""Verify the exact, independently reviewed three-paragraph runtime extension.

This preserves the previous 755-card oracle and the historical caption receipt.
No content approval is created by this validator.
"""
from copy import deepcopy
import hashlib,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
PREFIX='geometry-course/textbook/'
FIXTURE='tools/geometry-textbook/published-through-461.json'
FIXTURE_SHA='8a552a7b75e1401178a2aea29c8b180d6acdfb33bff5d9757f2e8073a61ad98e'
RECEIPT='docs/reviews/ATANASYAN_7_9_CHAPTER_VI_RUNTIME_EXTENSION_REVIEW.json'
LABELS='docs/reviews/ATANASYAN_7_9_LABELS_RUNTIME_REVIEW.json'
LABELS_SHA='0ade5dd181b4467a1af642d0bfa13e5192f64e3093e73035bf0835a10b1faf00'
RUNTIME=('index.html','assets/engine.js','assets/planar-viewer.js','assets/style.css','assets/math-text.js','source-inventory.json','assets/board-adapter.js')
PARAGRAPHS=[
 {'chapter':6,'number':1,'title':'Многоугольники','pointNumbers':[46,47],'exerciseNumbers':[462,470],'printedPages':[121,123]},
 {'chapter':6,'number':2,'title':'Параллелограмм и трапеция','pointNumbers':[48,50],'exerciseNumbers':[471,501],'printedPages':[124,131]},
 {'chapter':6,'number':3,'title':'Прямоугольник, ромб, квадрат','pointNumbers':[51,53],'exerciseNumbers':[502,519],'printedPages':[131,135]}]
def sha(raw):return hashlib.sha256(raw).hexdigest()
def encoded(obj):return (json.dumps(obj,ensure_ascii=False,indent=2)+'\n').encode()
def digest(obj):return sha(json.dumps(obj,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode())
def require(ok,message):
 if not ok:raise AssertionError(message)
def frozen(root=ROOT):
 raw=(root/FIXTURE).read_bytes();require(sha(raw)==FIXTURE_SHA,'755-card oracle changed');return json.loads(raw)
def previous_inventory(raw,root=ROOT):
 from chapter07_extension import has_vii,previous_inventory as before_vii
 if has_vii(raw):raw=before_vii(raw,root)
 current=json.loads(raw);require(raw==encoded(current),'Unrelated source-index formatting changes')
 require(current.get('paragraphs',[])[-3:]==PARAGRAPHS,'VI paragraphs must be the exact reviewed suffix')
 old=deepcopy(current);old['paragraphs']=old['paragraphs'][:-3]
 require(sha(encoded(old))==frozen(root)['immutableFiles'][PREFIX+'source-inventory.json'],'Previous source index, order or metadata changed')
 return encoded(old)
def validate_extension(root=ROOT,course=None):
 course=course or root/PREFIX
 base=frozen(root);raw=(root/RECEIPT).read_bytes();review=json.loads(raw)
 require(review.get('status')=='passed' and review.get('browser')=='passed','Runtime extension lacks completed review')
 require(bool(review.get('reviewer')) and bool(review.get('at')),'Runtime extension lacks provenance')
 require(review.get('previousSourceCommit')==base['sourceCommit'],'Wrong previous publication')
 require(review.get('preservedCards')==755 and review.get('contentApprovalGranted') is False,'Runtime review cannot approve content')
 oldfiles={name:base['immutableFiles'][PREFIX+name] for name in RUNTIME}
 files={name:sha((course/name).read_bytes()) for name in RUNTIME}
 from chapter07_extension import has_vii,previous_inventory as before_vii,validate_extension as validate_vii
 inventory_raw=(course/'source-inventory.json').read_bytes()
 if has_vii(inventory_raw):
  validate_vii(root,course)
  files['source-inventory.json']=sha(before_vii(inventory_raw,root))
 require(review.get('oldImplementationSha256')==digest(oldfiles)==base['implementationSha256'],'Wrong prior runtime chain')
 require(review.get('implementationFiles')==files and review.get('implementationSha256')==digest(files),'Stale extension runtime files')
 require([name for name in RUNTIME if oldfiles[name]!=files[name]]==['source-inventory.json'],'Only the source paragraph index may change')
 previous_inventory((course/'source-inventory.json').read_bytes(),root)
 require(review.get('paragraphsAdded')==PARAGRAPHS,'Unreviewed paragraph additions')
 require(sha((root/LABELS).read_bytes())==LABELS_SHA,'Historical caption receipt changed')
 require(review.get('previousRuntimeReview')=={'path':LABELS,'sha256':LABELS_SHA},'Wrong prior runtime receipt binding')
 require(json.loads((root/LABELS).read_bytes())['implementationFiles']==oldfiles,'Caption receipt does not match frozen755 runtime')
 evidence=review.get('evidence',[]);require(bool(evidence),'Missing independent runtime evidence')
 for item in evidence:
  p=Path(item['path']);require(not p.is_absolute() and '..' not in p.parts,'Evidence must be repo-relative')
  require(sha((root/p).read_bytes())==item['sha256'],'Stale runtime evidence: '+str(p))
 return review,{'path':RECEIPT,'sha256':sha(raw)}
def restore_manifest(name,raw,root=ROOT,course=None):
 """Undo ONLY this amendment, then compare the entire previous manifest bytes."""
 from chapter07_extension import BINDING as VII_BINDING,restore_manifest as before_vii_manifest
 if VII_BINDING in json.loads(raw):raw=before_vii_manifest(name,raw,root,course)
 base=frozen(root);review,binding=validate_extension(root,course);obj=json.loads(raw)
 require(raw==encoded(obj),'Unrelated review formatting change')
 require(obj.pop('runtimeExtensionReview',None)==binding,'Missing/stale extension binding')
 require(obj.get('implementationSha256')==review['implementationSha256'],'Stale manifest runtime')
 obj['implementationSha256']=base['implementationSha256'];oldraw=encoded(obj)
 require(name in base['immutableFiles'] and sha(oldraw)==base['immutableFiles'][name],'Previous review evidence/provenance changed')
 return oldraw

def assert_755_preserved(bundle,root=ROOT):
 base=frozen(root);lessons=[x for x in bundle['lessons'] if x['source']['chapter'] not in ('VI','VII')];entries=[x for x in bundle['catalog']['entries'] if x['source']['chapter'] not in ('VI','VII')]
 require(len(lessons)==len(entries)==755,'Unexpected old-card scope')
 require(digest(lessons)==base['lessonsSha256'],'Previous755 lesson/order/review/storage identity changed')
 require(digest(entries)==base['catalogEntriesSha256'],'Previous755 catalog changed')
 review,_=validate_extension(root)
 from chapter07_extension import has_vii,validate_extension as validate_vii
 if has_vii((root/PREFIX/'source-inventory.json').read_bytes()):review,_=validate_vii(root)
 require(bundle['build']['implementationSha256']==review['implementationSha256'],'Stale bundle runtime')
 require(bundle['sourceInventory']==json.loads((root/PREFIX/'source-inventory.json').read_bytes()),'Stale bundle source index')
 for name,expected in base['immutableFiles'].items():
  raw=(root/name).read_bytes()
  if name==PREFIX+'source-inventory.json':previous_inventory(raw,root)
  elif name.startswith(PREFIX+'release-review'):restore_manifest(name,raw,root)
  else:require(sha(raw)==expected,'Previous file changed: '+name)
