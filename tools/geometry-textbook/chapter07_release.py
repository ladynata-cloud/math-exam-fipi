"""Validate the unprojected1083-card union and independent VII review boundary."""
from copy import deepcopy
import json
from pathlib import Path
from chapter07_extension import (ROOT,PREFIX,SCOPE,encoded,digest,require,
 assert_893_preserved,check_evidence)

def validate_release(bundle,root=ROOT,course=None,require_review=True,scope=None):
 course=course or root/PREFIX
 scope=scope or json.loads((root/'tools/geometry-textbook/release-scope.json').read_bytes())
 assert_893_preserved(bundle,root,course,scope)
 require([c['chapter'] for c in scope['chapters']]==[1,2,3,4,5,6,7],'Wrong1083 release scope')
 require([c['chapter'] for c in bundle['build']['chapters']]==[1,2,3,4,5,6,7],'Wrong1083 built scope')
 require(scope['totalCards']==bundle['build']['authoredCards']==len(bundle['lessons'])==len(bundle['catalog']['entries'])==1083,'Wrong full release union size')
 require(bundle['build']['numberedExercises']==639,'Wrong exercise endpoint')
 require(bundle['build']['fullTextbookComplete'] is False and bundle['catalog']['inventoryComplete'] is False,'Full book is not complete')
 source=json.loads((root/'tools/geometry-textbook/chapter-07-source-map.json').read_bytes())
 require(source['counts']==dict(mainNumbers=99,mainParts=169,theoryPoints=9,selfcheckQuestions=12,cards=190),'Wrong independently inventoried VII counts')
 require([x['number'] for x in source['exercises']]==list(range(541,640)),'Wrong VII numbers')
 require([x['number'] for x in source['theory']]==list(range(54,63)),'Wrong VII theory')
 require([x['number'] for x in source['selfchecks']]==list(range(1,13)),'Wrong VII selfchecks')
 expected={}
 for collection,field in [('main','exercises'),('theory','theory'),('selfcheck','selfchecks')]:
  for x in source[field]:
   for i,part in enumerate(x.get('parts',['single']),1):
    namespace='selfcheck-chapter-7' if collection=='selfcheck' else collection
    expected[f'atanasyan-7-9-{namespace}-{x["number"]}-part-{i}']=(collection,str(x['number']),part,x['printedPages'])
 rows=[x for x in bundle['lessons'] if x['source']['chapter']=='VII'];entries={x['id']:x for x in bundle['catalog']['entries']}
 require(len(expected)==len(rows)==190 and len(entries)==len({x['id'] for x in bundle['lessons']})==1083,'Duplicate or missing release identity')
 require([x['id'] for x in bundle['catalog']['entries']]==[x['id'] for x in bundle['lessons']],'Catalog/lesson ordering mismatch')
 require([x['id'] for x in rows]==list(expected),'Wrong VII identity or source ordering')
 chapter=next(c for c in bundle['build']['chapters'] if c['chapter']==7)
 require(chapter['chapterLabel']=='VII' and chapter['authoredCards']==190 and chapter['numberedExercises']==99 and chapter['theoryPoints']==9 and chapter['selfcheckQuestions']==12,'Wrong VII build record')
 published_manifest=json.loads((course/'release-review-chapter-07.json').read_bytes()) if chapter['publicationReviewMatches'] else {}
 expected_review={k:('passed' if chapter['publicationReviewMatches'] else 'pending') for k in ['source','mathematics','pedagogy']}
 expected_review.update(reviewer=published_manifest.get('reviewer',''),at=published_manifest.get('at',''))
 for row in rows:
  collection,number,part,pages=expected[row['id']];s=row['source']
  require(s['bookId']=='atanasyan-2023-7-9','Wrong VII edition')
  require((s['collection'],s.get('point' if collection=='theory' else 'exercise'),s.get('subpart','single'),s['printedPages'])==(collection,number,part,pages),'Wrong VII source attribution')
  require(s['pdfPages']==[p+1 for p in pages] and row['revision']==1,'Wrong VII page/storage identity')
  require(entries[row['id']]=={k:row[k] for k in ('id','revision','kind','title','status','source')},'VII catalog mismatch')
  require(row['status']==('reviewed' if chapter['publicationReviewMatches'] else 'in-review'),'VII review/status mismatch')
  require(row.get('review')==expected_review,'VII review provenance/verdict mismatch')
 authored=[]
 for row in rows:
  row=deepcopy(row);row.pop('review');row['status']='draft';authored.append(row)
 require(digest(authored)==chapter['authoredContentSha256'],'VII authored-content digest is stale')
 all_authored=[]
 for row in bundle['lessons']:
  row=deepcopy(row);row.pop('review');row['status']='draft';all_authored.append(row)
 require(digest(all_authored)==bundle['build']['authoredContentSha256'],'Full authored-content digest is stale')
 require(bundle['build']['publicationReviewMatches']==all(c['publicationReviewMatches'] for c in bundle['build']['chapters']+bundle['build']['supplements']),'Global publication flag disagrees with chapter reviews')
 require([c['key'] for c in bundle['build']['supplements']]==['7-advanced'],'Wrong supplement build scope')
 for built in bundle['build']['chapters']+bundle['build']['supplements']:
  label=built.get('chapterLabel',built.get('label'));group=[x for x in bundle['lessons'] if x['source']['chapter']==label]
  require(built['authoredCards']==len(group),'Stale chapter card count')
  require(built['numberedExercises']==len({x['source']['exercise'] for x in group if x['source']['collection']=='main'}),'Stale chapter exercise count')
  require(built['theoryPoints']==sum(x['source']['collection']=='theory' for x in group),'Stale theory count')
  require(built['selfcheckQuestions']==sum(x['source']['collection']=='selfcheck' for x in group),'Stale selfcheck count')
  require(digest([x for x in all_authored if x['source']['chapter']==label])==built['authoredContentSha256'],'Stale chapter authored digest')
  if label!='VII':require(built['publicationReviewMatches'] is True,'Historical chapter review revoked')
 if require_review:
  require(bundle['build']['publicationReviewMatches'] and chapter['publicationReviewMatches'],'VII independent content review incomplete')
  manifest=json.loads((course/'release-review-chapter-07.json').read_bytes())
  require(manifest.get('status')=='passed' and all(manifest.get(k)=='passed' for k in ['source','mathematics','models','pedagogy','browser']),'Missing VII independent review dimensions')
  require(bool(manifest.get('reviewer')) and bool(manifest.get('at')),'Missing VII reviewer provenance')
  require(manifest.get('authoredContentSha256')==chapter['authoredContentSha256'] and manifest.get('implementationSha256')==bundle['build']['implementationSha256'],'Stale VII content/runtime review')
  require(manifest.get('scope',{}).get('chapter')=='VII' and manifest['scope'].get('cards')==190,'Wrong VII review scope')
  check_evidence(manifest.get('evidence'),root,'independent VII content')
 return True
