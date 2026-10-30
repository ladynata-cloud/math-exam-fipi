"""Validate the separately reviewed VIII runtime amendment and preserve1083 cards.

The receipt cannot approve geometric content. Every prior approval is restored
byte-for-byte against the actual preceding production Git snapshot.
"""
from copy import deepcopy
import hashlib,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
PREFIX='geometry-course/textbook/'
FIXTURE='tools/geometry-textbook/published-through-639.json'
FIXTURE_SHA='64c4d8dcedc2d98acf4474eb649ba5c7bbba398516491b3e9d2ca6205501f6b3'
RECEIPT='docs/reviews/ATANASYAN_7_9_CHAPTER_VIII_RUNTIME_EXTENSION_REVIEW.json'
PREVIOUS_RECEIPT='docs/reviews/ATANASYAN_7_9_CHAPTER_VII_RUNTIME_EXTENSION_REVIEW.json'
LABELS='docs/reviews/ATANASYAN_7_9_LABELS_RUNTIME_REVIEW.json'
BINDING='runtimeChapterVIIIReview'
RUNTIME=('index.html','assets/engine.js','assets/planar-viewer.js','assets/style.css','assets/math-text.js','source-inventory.json','assets/board-adapter.js')
PARAGRAPHS=[
 {'chapter': 8, 'number': 1, 'title': 'Определение подобных треугольников', 'pointNumbers': [63, 65], 'exerciseNumbers': [640, 656], 'printedPages': [163, 167]},
 {'chapter': 8, 'number': 2, 'title': 'Признаки подобия треугольников', 'pointNumbers': [66, 68], 'exerciseNumbers': [657, 671], 'printedPages': [167, 171]},
 {'chapter': 8, 'number': 3, 'title': 'Применение подобия к доказательству теорем и решению задач', 'pointNumbers': [69, 73], 'exerciseNumbers': [672, 696], 'printedPages': [171, 180]},
 {'chapter': 8, 'number': 4, 'title': 'Соотношения между сторонами и углами прямоугольного треугольника', 'pointNumbers': [74, 75], 'exerciseNumbers': [697, 709], 'printedPages': [181, 185]}]
SCOPE={'chapter': 8, 'label': 'VIII', 'exerciseNumbers': [640, 736], 'mainParts': 133, 'theoryPoints': [63, 75], 'selfcheckQuestions': 18, 'cards': 164}
def sha(raw):return hashlib.sha256(raw).hexdigest()
def encoded(obj):return (json.dumps(obj,ensure_ascii=False,indent=2)+'\n').encode()
def digest(obj):return sha(json.dumps(obj,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode())
def require(ok,message):
 if not ok:raise AssertionError(message)
def frozen(root=ROOT):
 raw=(root/FIXTURE).read_bytes();require(sha(raw)==FIXTURE_SHA,'1083-card oracle changed');obj=json.loads(raw)
 require(obj['sourceCommit']=='884d1b646cb67a115f4bf70c2c0ce2ed7b987e52' and obj['cards']==1083,'Wrong prior publication')
 return obj
def has_viii(raw):return any(p.get('chapter')==8 for p in json.loads(raw).get('paragraphs',[]))
def previous_inventory(raw,root=ROOT):
 current=json.loads(raw);require(raw==encoded(current),'Unrelated source-index formatting changes')
 require(current.get('paragraphs',[])[-4:]==PARAGRAPHS,'VIII paragraphs must be the exact reviewed suffix')
 old=deepcopy(current);old['paragraphs']=old['paragraphs'][:-4]
 require(sha(encoded(old))==frozen(root)['immutableFiles'][PREFIX+'source-inventory.json'],'Previous source index/order/metadata changed')
 return encoded(old)
def previous_scope(scope,root=ROOT):
 old=deepcopy(scope)
 require(old.get('chapters',[])[-1:]==[SCOPE] and old.get('totalCards')==1247,'Wrong VIII release union')
 old['chapters']=old['chapters'][:-1];old['totalCards']-=164
 require(sha(encoded(old))==frozen(root)['immutableFiles']['tools/geometry-textbook/release-scope.json'],'Previous release scope changed')
 return old
def check_evidence(items,root,label):
 require(isinstance(items,list) and bool(items),'Missing '+label+' evidence')
 for item in items:
  p=Path(item['path']);require(not p.is_absolute() and '..' not in p.parts,'Evidence must be repo-relative')
  require(sha((root/p).read_bytes())==item['sha256'],'Stale '+label+' evidence: '+str(p))
def validate_extension(root=ROOT,course=None):
 course=course or root/PREFIX;base=frozen(root);raw=(root/RECEIPT).read_bytes();review=json.loads(raw)
 require(review.get('status')=='passed' and review.get('browser')=='passed','VIII runtime extension lacks completed review')
 require(bool(review.get('reviewer')) and bool(review.get('at')),'VIII runtime extension lacks provenance')
 require(review.get('previousSourceCommit')==base['sourceCommit'],'Wrong previous publication')
 require(review.get('preservedCards')==1083 and review.get('contentApprovalGranted') is False,'Runtime review cannot approve VIII content')
 oldfiles={name:base['immutableFiles'][PREFIX+name] for name in RUNTIME}
 files={name:sha((course/name).read_bytes()) for name in RUNTIME}
 require(review.get('oldImplementationSha256')==digest(oldfiles)==base['implementationSha256'],'Wrong prior runtime chain')
 require(review.get('implementationFiles')==files and review.get('implementationSha256')==digest(files),'Stale VIII runtime files')
 require([name for name in RUNTIME if oldfiles[name]!=files[name]]==['source-inventory.json'],'Only VIII paragraph metadata may change')
 previous_inventory((course/'source-inventory.json').read_bytes(),root)
 require(review.get('paragraphsAdded')==PARAGRAPHS,'Unreviewed VIII paragraph additions')
 prior_raw=(root/PREVIOUS_RECEIPT).read_bytes();prior_hash=base['immutableFiles'][PREVIOUS_RECEIPT]
 require(sha(prior_raw)==prior_hash,'Historical VII runtime receipt changed')
 require(review.get('previousRuntimeReview')=={'path':PREVIOUS_RECEIPT,'sha256':prior_hash},'Wrong prior runtime receipt binding')
 prior=json.loads(prior_raw);require(prior['implementationFiles']==oldfiles,'VII receipt disagrees with frozen1083 runtime')
 check_evidence(prior['evidence'],root,'historical VII runtime')
 require(sha((root/LABELS).read_bytes())==base['immutableFiles'][LABELS],'Historical caption receipt changed')
 check_evidence(review.get('evidence'),root,'independent VIII runtime')
 return review,{'path':RECEIPT,'sha256':sha(raw)}
def restore_manifest(name,raw,root=ROOT,course=None):
 base=frozen(root);review,binding=validate_extension(root,course);obj=json.loads(raw)
 require(name in base['immutableFiles'] and name.startswith(PREFIX+'release-review'),'Not a prior published manifest')
 require(raw==encoded(obj),'Unrelated review formatting change')
 require(obj.pop(BINDING,None)==binding,'Missing/stale VIII extension binding')
 require(obj.get('implementationSha256')==review['implementationSha256'],'Stale manifest VIII runtime')
 obj['implementationSha256']=base['implementationSha256'];oldraw=encoded(obj)
 require(sha(oldraw)==base['immutableFiles'][name],'Previous review evidence/provenance changed')
 return oldraw

def assert_1083_preserved(bundle,root=ROOT,course=None,scope=None):
 course=course or root/PREFIX;base=frozen(root)
 rows=[x for x in bundle['lessons'] if x['source']['chapter']!='VIII']
 entries=[x for x in bundle['catalog']['entries'] if x['source']['chapter']!='VIII']
 require(len(rows)==len(entries)==1083,'Unexpected old-card scope')
 require(digest(rows)==base['lessonsSha256'],'Previous1083 lesson/order/status/review/storage identity changed')
 require(digest(entries)==base['catalogEntriesSha256'],'Previous1083 catalog changed')
 review,_=validate_extension(root,course)
 require(bundle['build']['implementationSha256']==review['implementationSha256'],'Stale bundle VIII runtime')
 require(bundle['build']['implementationFiles']==review['implementationFiles'],'Stale bundle VIII runtime file map')
 require(bundle['sourceInventory']==json.loads((course/'source-inventory.json').read_bytes()),'Stale bundle source index')
 scope=scope or json.loads((root/'tools/geometry-textbook/release-scope.json').read_bytes())
 previous_scope(scope,root)
 for name,expected in base['immutableFiles'].items():
  path=course/name.removeprefix(PREFIX) if name.startswith(PREFIX) else root/name
  raw=path.read_bytes()
  if name==PREFIX+'data/course.json':continue # The full1247 union is checked separately.
  if name=='tools/geometry-textbook/release-scope.json':continue # Exact suffix restoration above.
  if name==PREFIX+'source-inventory.json':previous_inventory(raw,root)
  elif name.startswith(PREFIX+'release-review'):restore_manifest(name,raw,root,course)
  else:require(sha(raw)==expected,'Previously published file changed: '+name)
 return True
