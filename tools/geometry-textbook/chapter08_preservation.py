"""Immutable published-through-639 oracle; candidate work cannot rewrite approval."""
from copy import deepcopy
import hashlib,json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
COURSE=ROOT/'geometry-course/textbook'
FIXTURE=ROOT/'tools/geometry-textbook/published-through-639.json'
FIXTURE_SHA='64c4d8dcedc2d98acf4474eb649ba5c7bbba398516491b3e9d2ca6205501f6b3'
BASE='884d1b646cb67a115f4bf70c2c0ce2ed7b987e52'
def sha(raw):return hashlib.sha256(raw).hexdigest()
def digest(value):return sha(json.dumps(value,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode())
def require(condition,message):
 if not condition:raise AssertionError(message)
def frozen():
 raw=FIXTURE.read_bytes();require(sha(raw)==FIXTURE_SHA,'Published1083 oracle changed')
 data=json.loads(raw);require(data['sourceCommit']==BASE and data['cards']==1083,'Wrong publication base')
 return data
def assert_public1083(bundle,root=ROOT,check_files=True):
 base=frozen();require(sha((json.dumps(bundle,ensure_ascii=False,separators=(',',':'))+'\n').encode())==base['courseSha256'],'Published bundle metadata or content changed')
 require(len(bundle['lessons'])==len(bundle['catalog']['entries'])==1083,'Wrong public card count')
 require(digest(bundle['lessons'])==base['lessonsSha256'],'Published lesson content/order/status/review/revision changed')
 require(digest(bundle['catalog']['entries'])==base['catalogEntriesSha256'],'Published catalog identity/order/status changed')
 require(bundle['build']['publicationReviewMatches'] is True,'Published review lost')
 require(bundle['build']['implementationSha256']==base['implementationSha256'],'Published runtime changed')
 require(bundle['build']['authoredCards']==1083 and bundle['build']['numberedExercises']==639,'Published endpoint changed')
 require(bundle['build']['fullTextbookComplete'] is False,'Whole book is not complete')
 if check_files:
  for name,expected in base['immutableFiles'].items():require(sha((root/name).read_bytes())==expected,'Published file changed: '+name)
 return True
def assert_candidate_old_teaching(bundle):
 # Isolated paragraph metadata invalidates runtime approval, so the preview is
 # deliberately in-review. It cannot alter any original teaching/work identity.
 rows=[l for l in bundle['lessons'] if l['source']['chapter']!='VIII']
 teaching=[{k:v for k,v in row.items() if k not in ('status','review')} for row in rows]
 require(len(rows)==1083 and digest(teaching)==frozen()['authoredLessonsSha256'],'Candidate changed old teaching/order/storage identity')
 return True
