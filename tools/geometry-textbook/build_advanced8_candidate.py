#!/usr/bin/env python3
"""Isolated preview of 824–841; cannot approve or replace the published course."""
import argparse
import hashlib
import json
import shutil
from copy import deepcopy
from pathlib import Path
from build_course import ROOT, COURSE, read, digest
from advanced8_release import historical_ix_projection, previous_scope, serialized, BASE_BUNDLE_SHA

LABEL='8 класс · повышенная трудность'
KEY='8-advanced-824-841'
AUTHOR=ROOT/'content-drafts/atanasyan-grade8-advanced/authored.json'

def candidate():
    authored=read(AUTHOR)
    assert authored['review']['status']=='in-review'
    assert all(authored['review'][k]=='pending' for k in ['independentSource','independentMathematics','independentPedagogy'])
    published=read(COURSE/'data/course.json')
    old,_=historical_ix_projection(published,read(ROOT/'tools/geometry-textbook/release-scope.json'))
    assert hashlib.sha256(serialized(old)).hexdigest()==BASE_BUNDLE_SHA
    bundle=deepcopy(old)
    ids={int(l['source']['point']):l['id'] for l in old['lessons'] if l['source']['collection']=='theory'}
    for c in authored['cards']:
        n=c['number'];ident=f'atanasyan-7-9-main-{n}-part-1'
        source=dict(bookId=authored['bookId'],collection='main',chapter=LABEL,
                    advancedGrade=8,relatedChapters=[6],exercise=str(n),
                    printedPages=c['printedPages'],pdfPages=c['pdfPages'])
        entry=dict(id=ident,revision=1,kind='exercise',title=f'Задача {n}',status='in-review',source=source)
        steps=[];related=set()
        for i,s in enumerate(c['steps'],1):
            assert set(s['theoryPoints'])<=set(ids)
            refs=[ids[p] for p in s['theoryPoints']];related.update(refs)
            reason=dict(kind='reason',text=s['justification'])
            if refs:reason['theoryId']=refs[0]
            steps.append(dict(id=f'step-{i}',title=f'Шаг {i}',prompt=s['prompt'],
                        explanation=s['explanation'],view=f'step-{i}',justifications=[reason]))
        help_items=[]
        if related:help_items.append(dict(id='recall-theory',question='Какие определения и свойства пригодятся?',
                text='Открой нужное объяснение и вернись к своему решению.',theoryIds=sorted(related)))
        help_items.append(dict(id='compare-result',question='Сверить итог рассуждения',text=c['answer']))
        lesson=dict(schemaVersion=1,**entry,statement=dict(text=c['condition'],
                goal='Сначала предложи своё решение. Подсказки и разбор можно открыть рядом.'),
                visualization=dict(type='scene3d',caption='Измерение на чертеже не заменяет доказательство.',model=c['model']),
                help=help_items,steps=steps,answer=dict(mode='manual',prompt='Запиши ответ и объясни рассуждение.'),
                review=dict(source='pending',mathematics='pending',pedagogy='pending',reviewer='',at=''))
        bundle['catalog']['entries'].append(entry);bundle['lessons'].append(lesson)
    assert bundle['lessons'][:len(old['lessons'])]==old['lessons']
    assert bundle['catalog']['entries'][:len(old['catalog']['entries'])]==old['catalog']['entries']
    assert len({l['id'] for l in bundle['lessons']})==len(bundle['lessons'])
    bundle['build']['publicationReviewMatches']=False
    bundle['build']['authoredCards']=len(bundle['lessons'])
    bundle['build']['numberedExercises']+=18
    bundle['build']['authoredContentSha256']=digest(bundle['lessons'])
    bundle['build']['supplements'].append(dict(key=KEY,label=LABEL,authoredCards=18,numberedExercises=18,
        publicationReviewMatches=False,reviewFile=None,authoredContentSha256=digest(bundle['lessons'][-18:]),
        theoryPoints=0,selfcheckQuestions=0))
    bundle['build']['candidateOnly']=True
    return bundle

def build(output):
    output=Path(output).resolve()
    if output==ROOT or ROOT in output.parents or output.exists():
        raise ValueError('Choose a new output directory outside the repository')
    target=output/'geometry-course/textbook';shutil.copytree(COURSE,target)
    bundle=candidate()
    (target/'data/course.json').write_text(json.dumps(bundle,ensure_ascii=False,separators=(',',':'))+'\n')
    scope=previous_scope(read(ROOT/'tools/geometry-textbook/release-scope.json'))
    scope['supplements'].append(dict(key=KEY,label=LABEL,exerciseNumbers=[824,841],mainParts=18,cards=18))
    scope['totalCards']+=18
    dest=output/'tools/geometry-textbook';dest.mkdir(parents=True)
    (dest/'release-scope.json').write_text(json.dumps(scope,ensure_ascii=False,indent=2)+'\n')
    preview='''<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Атанасян: проверка задач 824–841</title><link rel="stylesheet" href="assets/style.css"><div id="textbook-app">Загрузка материалов на проверке…</div><script src="assets/math-text.js"></script><script src="assets/planar-viewer.js"></script><script src="assets/engine.js"></script><script>fetch('data/course.json').then(r=>r.json()).then(bundle=>{window.textbookApp=GeometryTextbook.createApp(document.getElementById('textbook-app'),{...bundle,allowInReview:true});});</script></html>'''
    (target/'review.html').write_text(preview)
    # index.html is the unchanged ordinary entry: it still excludes candidates.
    (output/'candidate-evidence.json').write_text(json.dumps(dict(sourceSha256=hashlib.sha256(AUTHOR.read_bytes()).hexdigest(),
        publishedBundleSha256=hashlib.sha256((COURSE/'data/course.json').read_bytes()).hexdigest(),
        preservedCards=1407,newInReviewCards=18,publicationApprovalGranted=False),indent=2)+'\n')
    print(json.dumps(dict(cards=len(bundle['lessons']),candidateOnly=True,output=str(output))))
    return bundle

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path,required=True)
    build(parser.parse_args().output)
