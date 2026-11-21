"""Validate the unprojected1407-card union and independent IX review boundary."""
from copy import deepcopy
import json
from pathlib import Path
from chapter09_extension import (ROOT,PREFIX,SCOPE,encoded,digest,require,
 assert_1247_preserved,check_evidence,PARAGRAPHS,sha)

def validate_release(bundle,root=ROOT,course=None,require_review=True,scope=None):
 course=course or root/PREFIX
 scope=scope or json.loads((root/'tools/geometry-textbook/release-scope.json').read_bytes())
 from advanced8_release import historical_ix_projection
 bundle,scope=historical_ix_projection(bundle,scope,root,course,require_review)
 assert_1247_preserved(bundle,root,course,scope)
 require(set(bundle)=={'catalog','lessons','sourceInventory','build'},'Unknown release envelope metadata')
 require(set(bundle['catalog'])=={'schemaVersion','book','inventoryComplete','entries'},'Unknown catalog metadata')
 require(set(bundle['build'])=={'authoredContentSha256','publicationReviewMatches','implementationSha256','implementationFiles','authoredCards','numberedExercises','chapters','supplements','fullTextbookComplete'},'Unknown build metadata')
 require([c['chapter'] for c in scope['chapters']]==[1,2,3,4,5,6,7,8,9],'Wrong1407 release scope')
 require([c['chapter'] for c in bundle['build']['chapters']]==[1,2,3,4,5,6,7,8,9],'Wrong1407 built scope')
 require(scope['totalCards']==bundle['build']['authoredCards']==len(bundle['lessons'])==len(bundle['catalog']['entries'])==1407,'Wrong full release union size')
 require(bundle['build']['numberedExercises']==823,'Wrong exercise endpoint')
 require(bundle['build']['fullTextbookComplete'] is False and bundle['catalog']['inventoryComplete'] is False,'Full book is not complete')
 source=json.loads((root/'tools/geometry-textbook/chapter-09-source-map.json').read_bytes())
 require(source['bookId']=='atanasyan-2023-7-9' and source['chapter']==9 and source['source']['sha256']=='3b2e890ce425ef9b4893f367e8680e18c0ed380c9bd86fe4eb65b44a2479ca72','Wrong IX source edition')
 require(source['paragraphs']==PARAGRAPHS,'Wrong IX paragraph inventory')
 require(source['counts']==dict(mainNumbers=87,mainParts=133,theoryPoints=8,selfcheckQuestions=19,cards=160),'Wrong independently inventoried IX counts')
 require([x['number'] for x in source['exercises']]==list(range(737,824)),'Wrong IX numbers')
 require([x['number'] for x in source['theory']]==list(range(76,84)),'Wrong IX theory')
 require([x['number'] for x in source['selfchecks']]==list(range(1,20)),'Wrong IX selfchecks')
 book={k:bundle['sourceInventory']['book'][k] for k in ('id','title','pdfPageCount','pdfPageOffset')}
 book.update(edition='Атанасян и др. · 7–9 классы · 14-е переработанное издание, 2023',title='Геометрия 7–9 · задачи учебника Атанасяна')
 require(bundle['catalog']['book']==book and bundle['catalog']['schemaVersion']==1,'Wrong catalog edition metadata')
 require({key:sum(row['source']['collection']==key for row in bundle['lessons']) for key in ('main','theory','selfcheck')}==dict(main=1136,theory=83,selfcheck=188),'Wrong full collection counts')
 expected={}
 for collection,field in [('main','exercises'),('theory','theory'),('selfcheck','selfchecks')]:
  for x in source[field]:
   for i,part in enumerate(x.get('parts',['single']),1):
    namespace='selfcheck-chapter-9' if collection=='selfcheck' else collection
    expected[f'atanasyan-7-9-{namespace}-{x["number"]}-part-{i}']=(collection,str(x['number']),part,x['printedPages'])
 rows=[x for x in bundle['lessons'] if x['source']['chapter']=='IX'];entries={x['id']:x for x in bundle['catalog']['entries']}
 require(len(expected)==len(rows)==160 and len(entries)==len({x['id'] for x in bundle['lessons']})==1407,'Duplicate or missing release identity')
 require([x['id'] for x in bundle['catalog']['entries']]==[x['id'] for x in bundle['lessons']],'Catalog/lesson ordering mismatch')
 require([x['id'] for x in rows]==list(expected),'Wrong IX identity or source ordering')
 labels=[c['label'] for c in scope['chapters']]+['7 класс · повышенная трудность']
 ordered=[r['id'] for label in labels for r in bundle['lessons'] if r['source']['chapter']==label]
 require([r['id'] for r in bundle['lessons']]==ordered,'Wrong full chapter/supplement order')
 chapter=next(c for c in bundle['build']['chapters'] if c['chapter']==9)
 require(chapter['chapterLabel']=='IX' and chapter['authoredCards']==160 and chapter['numberedExercises']==87 and chapter['theoryPoints']==8 and chapter['selfcheckQuestions']==19,'Wrong IX build record')
 published_manifest=json.loads((course/'release-review-chapter-09.json').read_bytes()) if chapter['publicationReviewMatches'] else {}
 expected_review={k:('passed' if chapter['publicationReviewMatches'] else 'pending') for k in ['source','mathematics','pedagogy']}
 expected_review.update(reviewer=published_manifest.get('reviewer',''),at=published_manifest.get('at',''))
 for row in rows:
  collection,number,part,pages=expected[row['id']];s=row['source']
  expected_source=dict(bookId='atanasyan-2023-7-9',chapter='IX',collection=collection,printedPages=pages,pdfPages=[p+1 for p in pages])
  expected_source['point' if collection=='theory' else 'exercise']=number
  if part!='single':expected_source['subpart']=part
  require(s==expected_source,'Wrong IX source metadata')
  require(row['schemaVersion']==1 and row['kind']==('theory' if collection=='theory' else 'exercise'),'Wrong IX lesson schema/kind')
  if collection=='main':title='Задача '+number+('' if part=='single' else ' · '+part)
  elif collection=='selfcheck':title='Вопрос '+number
  else:title='Пункт '+number+' · '+next(x['title'] for x in source['theory'] if str(x['number'])==number)
  require(row['title']==title,'Wrong IX lesson source title')
  require((s['collection'],s.get('point' if collection=='theory' else 'exercise'),s.get('subpart','single'),s['printedPages'])==(collection,number,part,pages),'Wrong IX source attribution')
  require(s['pdfPages']==[p+1 for p in pages] and row['revision']==1,'Wrong IX page/storage identity')
  require(entries[row['id']]=={k:row[k] for k in ('id','revision','kind','title','status','source')},'IX catalog mismatch')
  require(row['status']==('reviewed' if chapter['publicationReviewMatches'] else 'in-review'),'IX review/status mismatch')
  require(row.get('review')==expected_review,'IX review provenance/verdict mismatch')
 authored=[]
 for row in rows:
  row=deepcopy(row);row.pop('review');row['status']='draft';authored.append(row)
 require(digest(authored)==chapter['authoredContentSha256'],'IX authored-content digest is stale')
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
  require(type(built['publicationReviewMatches']) is bool,'Review flag must be Boolean')
  if 'chapter' in built:
   expected_scope=next(c for c in scope['chapters'] if c['chapter']==built['chapter'])
   require(label==expected_scope['label'],'Wrong built chapter label')
   review_file='release-review.json' if built['chapter']==1 else 'release-review-chapter-%02d.json'%built['chapter']
  else:review_file='release-review-advanced-07.json'
  require(built['reviewFile']==review_file,'Wrong built review-file identity')
  if label!='IX':require(built['publicationReviewMatches'] is True,'Historical chapter review revoked')
 if require_review:require(bundle['build']['publicationReviewMatches'] and chapter['publicationReviewMatches'],'IX independent content review incomplete')
 if chapter['publicationReviewMatches']:
  manifest=json.loads((course/'release-review-chapter-09.json').read_bytes())
  require(manifest.get('status')=='passed' and all(manifest.get(k)=='passed' for k in ['source','mathematics','models','pedagogy','browser']),'Missing IX independent review dimensions')
  require(bool(manifest.get('reviewer')) and bool(manifest.get('at')),'Missing IX reviewer provenance')
  require(manifest.get('authoredContentSha256')==chapter['authoredContentSha256'] and manifest.get('implementationSha256')==bundle['build']['implementationSha256'],'Stale IX content/runtime review')
  require(manifest.get('scope',{}).get('chapter')=='IX' and manifest['scope'].get('cards')==160,'Wrong IX review scope')
  check_evidence(manifest.get('evidence'),root,'independent IX content')
  source_path='tools/geometry-textbook/chapter-09-source-map.json'
  require({'path':source_path,'sha256':sha((root/source_path).read_bytes())} in manifest['evidence'],'IX review must bind the independent source map')
 return True
