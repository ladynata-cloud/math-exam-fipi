"""Validate the separately reviewed IX runtime amendment and preserve1247 cards.

The receipt cannot approve geometric content. Every prior approval is restored
byte-for-byte against the actual preceding production Git snapshot.
"""
from layout_amendment import historical_bytes
from copy import deepcopy
import hashlib,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
PREFIX='geometry-course/textbook/'
FIXTURE='tools/geometry-textbook/published-through-736.json'
FIXTURE_SHA='b68fe9b0e0e0f0281683f11d319beecce281c71d745748039df255609c390e65'
RECEIPT='docs/reviews/ATANASYAN_7_9_CHAPTER_IX_RUNTIME_EXTENSION_REVIEW.json'
PREVIOUS_RECEIPT='docs/reviews/ATANASYAN_7_9_CHAPTER_VIII_RUNTIME_EXTENSION_REVIEW.json'
LABELS='docs/reviews/ATANASYAN_7_9_LABELS_RUNTIME_REVIEW.json'
BINDING='runtimeChapterIXReview'
RUNTIME=('index.html','assets/engine.js','assets/planar-viewer.js','assets/style.css','assets/math-text.js','source-inventory.json','assets/board-adapter.js')
PARAGRAPHS=[{'chapter': 9, 'number': 1, 'title': 'Окружность и прямые', 'pointNumbers': [76, 78], 'exerciseNumbers': [737, 761], 'printedPages': [189, 199]}, {'chapter': 9, 'number': 2, 'title': 'Центральные и вписанные углы', 'pointNumbers': [79, 81], 'exerciseNumbers': [762, 783], 'printedPages': [199, 206]}, {'chapter': 9, 'number': 3, 'title': 'Вписанная и описанная окружности четырёхугольников', 'pointNumbers': [82, 83], 'exerciseNumbers': [784, 795], 'printedPages': [206, 209]}]
SCOPE={'chapter': 9, 'label': 'IX', 'exerciseNumbers': [737, 823], 'mainParts': 133, 'theoryPoints': [76, 83], 'selfcheckQuestions': 19, 'cards': 160}
def sha(raw):return hashlib.sha256(raw).hexdigest()
def encoded(obj):return (json.dumps(obj,ensure_ascii=False,indent=2)+'\n').encode()
def digest(obj):return sha(json.dumps(obj,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode())
def require(ok,message):
 if not ok:raise AssertionError(message)
def frozen(root=ROOT):
 raw=(root/FIXTURE).read_bytes();require(sha(raw)==FIXTURE_SHA,'1247-card oracle changed');obj=json.loads(raw)
 require(obj['sourceCommit']=='3411acd7df5ebfbd4179cce85c2300c59677ddf7' and obj['cards']==1247,'Wrong prior publication')
 return obj
def has_ix(raw):return any(p.get('chapter')==9 for p in json.loads(raw).get('paragraphs',[]))
def previous_inventory(raw,root=ROOT):
 current=json.loads(raw);require(raw==encoded(current),'Unrelated source-index formatting changes')
 require(current.get('paragraphs',[])[-3:]==PARAGRAPHS,'IX paragraphs must be the exact reviewed suffix')
 old=deepcopy(current);old['paragraphs']=old['paragraphs'][:-3]
 require(sha(encoded(old))==frozen(root)['immutableFiles'][PREFIX+'source-inventory.json'],'Previous source index/order/metadata changed')
 return encoded(old)
def previous_scope(scope,root=ROOT):
 from advanced8_release import previous_scope as before_advanced8
 old=before_advanced8(scope)
 require(old.get('chapters',[])[-1:]==[SCOPE] and old.get('totalCards')==1407,'Wrong IX release union')
 old['chapters']=old['chapters'][:-1];old['totalCards']-=160
 require(sha(encoded(old))==frozen(root)['immutableFiles']['tools/geometry-textbook/release-scope.json'],'Previous release scope changed')
 return old
def check_evidence(items,root,label):
 require(isinstance(items,list) and bool(items),'Missing '+label+' evidence')
 for item in items:
  p=Path(item['path']);require(not p.is_absolute() and '..' not in p.parts,'Evidence must be repo-relative')
  require(sha((root/p).read_bytes())==item['sha256'],'Stale '+label+' evidence: '+str(p))
def validate_extension(root=ROOT,course=None):
 course=course or root/PREFIX;base=frozen(root);raw=(root/RECEIPT).read_bytes();review=json.loads(raw)
 require(review.get('status')=='passed' and review.get('browser')=='passed','IX runtime extension lacks completed review')
 require(bool(review.get('reviewer')) and bool(review.get('at')),'IX runtime extension lacks provenance')
 require(review.get('previousSourceCommit')==base['sourceCommit'],'Wrong previous publication')
 require(review.get('preservedCards')==1247 and review.get('contentApprovalGranted') is False,'Runtime review cannot approve IX content')
 oldfiles={name:base['immutableFiles'][PREFIX+name] for name in RUNTIME}
 files={name:sha(historical_bytes(course/name)) for name in RUNTIME}
 require(review.get('oldImplementationSha256')==digest(oldfiles)==base['implementationSha256'],'Wrong prior runtime chain')
 require(review.get('implementationFiles')==files and review.get('implementationSha256')==digest(files),'Stale IX runtime files')
 require([name for name in RUNTIME if oldfiles[name]!=files[name]]==['source-inventory.json'],'Only IX paragraph metadata may change')
 previous_inventory((course/'source-inventory.json').read_bytes(),root)
 require(review.get('paragraphsAdded')==PARAGRAPHS,'Unreviewed IX paragraph additions')
 prior_raw=(root/PREVIOUS_RECEIPT).read_bytes();prior_hash=base['immutableFiles'][PREVIOUS_RECEIPT]
 require(sha(prior_raw)==prior_hash,'Historical VIII runtime receipt changed')
 require(review.get('previousRuntimeReview')=={'path':PREVIOUS_RECEIPT,'sha256':prior_hash},'Wrong prior runtime receipt binding')
 prior=json.loads(prior_raw);require(prior['implementationFiles']==oldfiles,'VIII receipt disagrees with frozen1247 runtime')
 check_evidence(prior['evidence'],root,'historical VIII runtime')
 require(sha((root/LABELS).read_bytes())==base['immutableFiles'][LABELS],'Historical caption receipt changed')
 check_evidence(review.get('evidence'),root,'independent IX runtime')
 return review,{'path':RECEIPT,'sha256':sha(raw)}
def restore_manifest(name,raw,root=ROOT,course=None):
 base=frozen(root);review,binding=validate_extension(root,course);obj=json.loads(raw)
 require(name in base['immutableFiles'] and name.startswith(PREFIX+'release-review'),'Not a prior published manifest')
 require(raw==encoded(obj),'Unrelated review formatting change')
 require(obj.pop(BINDING,None)==binding,'Missing/stale IX extension binding')
 require(obj.get('implementationSha256')==review['implementationSha256'],'Stale manifest IX runtime')
 obj['implementationSha256']=base['implementationSha256'];oldraw=encoded(obj)
 require(sha(oldraw)==base['immutableFiles'][name],'Previous review evidence/provenance changed')
 return oldraw

def assert_1247_preserved(bundle,root=ROOT,course=None,scope=None):
 course=course or root/PREFIX;base=frozen(root)
 scope=scope or json.loads((root/'tools/geometry-textbook/release-scope.json').read_bytes())
 from advanced8_release import historical_ix_projection
 bundle,scope=historical_ix_projection(bundle,scope,root,course)
 rows=[x for x in bundle['lessons'] if x['source']['chapter']!='IX']
 entries=[x for x in bundle['catalog']['entries'] if x['source']['chapter']!='IX']
 require(len(rows)==len(entries)==1247,'Unexpected old-card scope')
 require(digest(rows)==base['lessonsSha256'],'Previous1247 lesson/order/status/review/storage identity changed')
 require(digest(entries)==base['catalogEntriesSha256'],'Previous1247 catalog changed')
 review,_=validate_extension(root,course)
 require(bundle['build']['implementationSha256']==review['implementationSha256'],'Stale bundle IX runtime')
 require(bundle['build']['implementationFiles']==review['implementationFiles'],'Stale bundle IX runtime file map')
 require(bundle['sourceInventory']==json.loads((course/'source-inventory.json').read_bytes()),'Stale bundle source index')
 scope=scope or json.loads((root/'tools/geometry-textbook/release-scope.json').read_bytes())
 previous_scope(scope,root)
 for name,expected in base['immutableFiles'].items():
  path=course/name.removeprefix(PREFIX) if name.startswith(PREFIX) else root/name
  raw=historical_bytes(path)
  if name==PREFIX+'data/course.json':continue # The full1407 union is checked separately.
  if name=='tools/geometry-textbook/release-scope.json':continue # Exact suffix restoration above.
  if name==PREFIX+'source-inventory.json':previous_inventory(raw,root)
  elif name.startswith(PREFIX+'release-review'):restore_manifest(name,raw,root,course)
  else:require(sha(raw)==expected,'Previously published file changed: '+name)
 return True
