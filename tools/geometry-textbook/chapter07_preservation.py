"""Immutable published-through-540 oracle; candidate work cannot rewrite approval."""
from copy import deepcopy
import hashlib,json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
COURSE=ROOT/'geometry-course/textbook'
FIXTURE=ROOT/'tools/geometry-textbook/published-through-540.json'
FIXTURE_SHA='b53fe1c528bc0660f6f512a0e70ea77d4c9e9031b5905a954035ae54ca290935'
BASE='6fb959fc0130a0bb8842601d19297e305ac91ac0'
def sha(raw):return hashlib.sha256(raw).hexdigest()
def digest(value):return sha(json.dumps(value,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode())
def require(condition,message):
 if not condition:raise AssertionError(message)
def frozen():
 raw=FIXTURE.read_bytes();require(sha(raw)==FIXTURE_SHA,'Published893 oracle changed')
 data=json.loads(raw);require(data['sourceCommit']==BASE and data['cards']==893,'Wrong publication base')
 return data
def assert_public893(bundle,root=ROOT,check_files=True):
 base=frozen();require(len(bundle['lessons'])==len(bundle['catalog']['entries'])==893,'Wrong public card count')
 require(digest(bundle['lessons'])==base['lessonsSha256'],'Published lesson content/order/status/review/revision changed')
 require(digest(bundle['catalog']['entries'])==base['catalogEntriesSha256'],'Published catalog identity/order/status changed')
 require(bundle['build']['publicationReviewMatches'] is True,'Published review lost')
 require(bundle['build']['implementationSha256']==base['implementationSha256'],'Published runtime changed')
 require(bundle['build']['authoredCards']==893 and bundle['build']['numberedExercises']==540,'Published endpoint changed')
 require(bundle['build']['fullTextbookComplete'] is False,'Whole book is not complete')
 if check_files:
  for name,expected in base['immutableFiles'].items():require(sha((root/name).read_bytes())==expected,'Published file changed: '+name)
 return True
def assert_candidate_old_teaching(bundle):
 # Isolated paragraph metadata invalidates runtime approval, so the preview is
 # deliberately in-review. It cannot alter any original teaching/work identity.
 rows=[l for l in bundle['lessons'] if l['source']['chapter'] not in ('VII','VIII')]
 teaching=[{k:v for k,v in row.items() if k not in ('status','review')} for row in rows]
 require(len(rows)==893 and digest(teaching)==frozen()['authoredLessonsSha256'],'Candidate changed old teaching/order/storage identity')
 return True
