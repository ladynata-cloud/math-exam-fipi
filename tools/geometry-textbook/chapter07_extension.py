"""Validate the separately reviewed VII runtime amendment and preserve893 cards.

The receipt cannot approve geometric content. Every prior approval is restored
byte-for-byte against the actual preceding production Git snapshot.
"""
from copy import deepcopy
import hashlib,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
PREFIX='geometry-course/textbook/'
FIXTURE='tools/geometry-textbook/published-through-540.json'
FIXTURE_SHA='b53fe1c528bc0660f6f512a0e70ea77d4c9e9031b5905a954035ae54ca290935'
RECEIPT='docs/reviews/ATANASYAN_7_9_CHAPTER_VII_RUNTIME_EXTENSION_REVIEW.json'
PREVIOUS_RECEIPT='docs/reviews/ATANASYAN_7_9_CHAPTER_VI_RUNTIME_EXTENSION_REVIEW.json'
LABELS='docs/reviews/ATANASYAN_7_9_LABELS_RUNTIME_REVIEW.json'
BINDING='runtimeChapterVIIReview'
RUNTIME=('index.html','assets/engine.js','assets/planar-viewer.js','assets/style.css','assets/math-text.js','source-inventory.json','assets/board-adapter.js')
PARAGRAPHS=[
 {'chapter':7,'number':1,'title':'Площадь многоугольника','pointNumbers':[54,56],'exerciseNumbers':[541,554],'printedPages':[139,145]},
 {'chapter':7,'number':2,'title':'Площади параллелограмма, треугольника и трапеции','pointNumbers':[57,59],'exerciseNumbers':[555,580],'printedPages':[146,152]},
 {'chapter':7,'number':3,'title':'Теорема Пифагора','pointNumbers':[60,62],'exerciseNumbers':[581,604],'printedPages':[152,158]}]
SCOPE={'chapter':7,'label':'VII','exerciseNumbers':[541,639],'mainParts':169,'theoryPoints':[54,62],'selfcheckQuestions':12,'cards':190}
def sha(raw):return hashlib.sha256(raw).hexdigest()
def encoded(obj):return (json.dumps(obj,ensure_ascii=False,indent=2)+'\n').encode()
def digest(obj):return sha(json.dumps(obj,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode())
def require(ok,message):
 if not ok:raise AssertionError(message)
def frozen(root=ROOT):
 raw=(root/FIXTURE).read_bytes();require(sha(raw)==FIXTURE_SHA,'893-card oracle changed');obj=json.loads(raw)
 require(obj['sourceCommit']=='6fb959fc0130a0bb8842601d19297e305ac91ac0' and obj['cards']==893,'Wrong prior publication')
 return obj
def has_vii(raw):return any(p.get('chapter')==7 for p in json.loads(raw).get('paragraphs',[]))
def previous_inventory(raw,root=ROOT):
 from chapter08_extension import has_viii,previous_inventory as before_viii
 if has_viii(raw):raw=before_viii(raw,root)
 current=json.loads(raw);require(raw==encoded(current),'Unrelated source-index formatting changes')
 require(current.get('paragraphs',[])[-3:]==PARAGRAPHS,'VII paragraphs must be the exact reviewed suffix')
 old=deepcopy(current);old['paragraphs']=old['paragraphs'][:-3]
 require(sha(encoded(old))==frozen(root)['immutableFiles'][PREFIX+'source-inventory.json'],'Previous source index/order/metadata changed')
 return encoded(old)
def previous_scope(scope,root=ROOT):
 from chapter08_extension import previous_scope as before_viii
 if any(c['chapter']==8 for c in scope['chapters']):scope=before_viii(scope,root)
 old=deepcopy(scope)
 require(old.get('chapters',[])[-1:]==[SCOPE] and old.get('totalCards')==1083,'Wrong VII release union')
 old['chapters']=old['chapters'][:-1];old['totalCards']-=190
 require(sha(encoded(old))==frozen(root)['immutableFiles']['tools/geometry-textbook/release-scope.json'],'Previous release scope changed')
 return old
def check_evidence(items,root,label):
 require(isinstance(items,list) and bool(items),'Missing '+label+' evidence')
 for item in items:
  p=Path(item['path']);require(not p.is_absolute() and '..' not in p.parts,'Evidence must be repo-relative')
  require(sha((root/p).read_bytes())==item['sha256'],'Stale '+label+' evidence: '+str(p))
def validate_extension(root=ROOT,course=None):
 course=course or root/PREFIX;base=frozen(root);raw=(root/RECEIPT).read_bytes();review=json.loads(raw)
 require(review.get('status')=='passed' and review.get('browser')=='passed','VII runtime extension lacks completed review')
 require(bool(review.get('reviewer')) and bool(review.get('at')),'VII runtime extension lacks provenance')
 require(review.get('previousSourceCommit')==base['sourceCommit'],'Wrong previous publication')
 require(review.get('preservedCards')==893 and review.get('contentApprovalGranted') is False,'Runtime review cannot approve VII content')
 oldfiles={name:base['immutableFiles'][PREFIX+name] for name in RUNTIME}
 files={name:sha((course/name).read_bytes()) for name in RUNTIME}
 from chapter08_extension import has_viii,previous_inventory as before_viii,validate_extension as validate_viii
 inventory_raw=(course/'source-inventory.json').read_bytes()
 if has_viii(inventory_raw):
  validate_viii(root,course)
  files['source-inventory.json']=sha(before_viii(inventory_raw,root))
 require(review.get('oldImplementationSha256')==digest(oldfiles)==base['implementationSha256'],'Wrong prior runtime chain')
 require(review.get('implementationFiles')==files and review.get('implementationSha256')==digest(files),'Stale VII runtime files')
 require([name for name in RUNTIME if oldfiles[name]!=files[name]]==['source-inventory.json'],'Only VII paragraph metadata may change')
 previous_inventory((course/'source-inventory.json').read_bytes(),root)
 require(review.get('paragraphsAdded')==PARAGRAPHS,'Unreviewed VII paragraph additions')
 prior_raw=(root/PREVIOUS_RECEIPT).read_bytes();prior_hash=base['immutableFiles'][PREVIOUS_RECEIPT]
 require(sha(prior_raw)==prior_hash,'Historical VI runtime receipt changed')
 require(review.get('previousRuntimeReview')=={'path':PREVIOUS_RECEIPT,'sha256':prior_hash},'Wrong prior runtime receipt binding')
 prior=json.loads(prior_raw);require(prior['implementationFiles']==oldfiles,'VI receipt disagrees with frozen893 runtime')
 check_evidence(prior['evidence'],root,'historical VI runtime')
 require(sha((root/LABELS).read_bytes())==base['immutableFiles'][LABELS],'Historical caption receipt changed')
 check_evidence(review.get('evidence'),root,'independent VII runtime')
 return review,{'path':RECEIPT,'sha256':sha(raw)}
def restore_manifest(name,raw,root=ROOT,course=None):
 from chapter08_extension import BINDING as VIII_BINDING,restore_manifest as before_viii_manifest
 if VIII_BINDING in json.loads(raw):raw=before_viii_manifest(name,raw,root,course)
 base=frozen(root);review,binding=validate_extension(root,course);obj=json.loads(raw)
 require(name in base['immutableFiles'] and name.startswith(PREFIX+'release-review'),'Not a prior published manifest')
 require(raw==encoded(obj),'Unrelated review formatting change')
 require(obj.pop(BINDING,None)==binding,'Missing/stale VII extension binding')
 require(obj.get('implementationSha256')==review['implementationSha256'],'Stale manifest VII runtime')
 obj['implementationSha256']=base['implementationSha256'];oldraw=encoded(obj)
 require(sha(oldraw)==base['immutableFiles'][name],'Previous review evidence/provenance changed')
 return oldraw

def assert_893_preserved(bundle,root=ROOT,course=None,scope=None):
 course=course or root/PREFIX;base=frozen(root)
 rows=[x for x in bundle['lessons'] if x['source']['chapter'] not in ('VII','VIII')]
 entries=[x for x in bundle['catalog']['entries'] if x['source']['chapter'] not in ('VII','VIII')]
 require(len(rows)==len(entries)==893,'Unexpected old-card scope')
 require(digest(rows)==base['lessonsSha256'],'Previous893 lesson/order/status/review/storage identity changed')
 require(digest(entries)==base['catalogEntriesSha256'],'Previous893 catalog changed')
 review,_=validate_extension(root,course)
 from chapter08_extension import has_viii,validate_extension as validate_viii
 if has_viii((course/'source-inventory.json').read_bytes()):review,_=validate_viii(root,course)
 require(bundle['build']['implementationSha256']==review['implementationSha256'],'Stale bundle VII runtime')
 require(bundle['sourceInventory']==json.loads((course/'source-inventory.json').read_bytes()),'Stale bundle source index')
 scope=scope or json.loads((root/'tools/geometry-textbook/release-scope.json').read_bytes())
 previous_scope(scope,root)
 for name,expected in base['immutableFiles'].items():
  path=course/name.removeprefix(PREFIX) if name.startswith(PREFIX) else root/name
  raw=path.read_bytes()
  if name==PREFIX+'data/course.json':continue # The full1083 union is checked separately.
  if name=='tools/geometry-textbook/release-scope.json':continue # Exact suffix restoration above.
  if name==PREFIX+'source-inventory.json':previous_inventory(raw,root)
  elif name.startswith(PREFIX+'release-review'):restore_manifest(name,raw,root,course)
  else:require(sha(raw)==expected,'Previously published file changed: '+name)
 return True
