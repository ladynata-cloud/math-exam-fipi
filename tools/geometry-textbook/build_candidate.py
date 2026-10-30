#!/usr/bin/env python3
"""Build an isolated, explicit review workspace; never edit the public bundle.

Usage: python tools/geometry-textbook/build_candidate.py --chapter 6 --output /tmp/chapter06-review
The output root is accepted by GEOMETRY_TEXTBOOK_ROOT in browser_check.js.
Any changed source index correctly invalidates runtime reviews in this preview.
No review manifest is created, copied forward, or marked passed by this command.
"""
import argparse,json,shutil
from pathlib import Path
from build_course import ROOT,COURSE,CHAPTER_LABELS,compose,read

def build(chapter,output):
    output=Path(output).resolve()
    if output==ROOT or ROOT in output.parents:
        raise ValueError('Review output must be outside the working repository')
    if output.exists():
        raise ValueError('Choose a new review output directory; existing output is not overwritten')
    registry=read(COURSE/'candidate-chapters.json')
    candidate=next((x for x in registry['chapters'] if x['chapter']==chapter),None)
    scope=read(ROOT/'tools/geometry-textbook/release-scope.json')
    released=next((x for x in scope['chapters'] if x['chapter']==chapter),None)
    if candidate is None and released is None:raise ValueError('Chapter is not a registered candidate or release chapter')
    if chapter == 8 and candidate is not None:
        from chapter08_extension import SCOPE, PARAGRAPHS
        if candidate != {'chapter': 8, 'scope': SCOPE, 'paragraphs': PARAGRAPHS}:
            raise ValueError('Chapter VIII candidate must use its exact source scope and paragraphs')
    target=output/'geometry-course/textbook'
    shutil.copytree(COURSE,target)
    inventory=read(target/'source-inventory.json')
    if candidate is not None:
        if any(x['chapter']==chapter for x in inventory['paragraphs']):
            raise ValueError('Candidate paragraph metadata would overwrite an existing chapter')
        inventory['paragraphs']+=candidate['paragraphs']
        (target/'source-inventory.json').write_text(json.dumps(inventory,ensure_ascii=False,indent=2)+'\n')
        bundle=compose(target,include_candidates=[chapter])
        scope['chapters'].append(candidate['scope']);scope['totalCards']+=candidate['scope']['cards']
    else:
        # Copy the exact release snapshot; never manufacture or refresh approval.
        bundle=compose(target)
    (target/'data/course.json').write_text(json.dumps(bundle,ensure_ascii=False,separators=(',',':'))+'\n')
    dest=output/'tools/geometry-textbook';dest.mkdir(parents=True)
    (dest/'release-scope.json').write_text(json.dumps(scope,ensure_ascii=False,indent=2)+'\n')
    # A separate explicit entry enables preview; index.html stays byte-identical.
    preview='''<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Проверка главы __CHAPTER__ — Атанасян 7–9</title><link rel="stylesheet" href="assets/style.css"><div id="textbook-app">Загрузка материалов на проверке…</div><script src="assets/math-text.js"></script><script src="assets/planar-viewer.js"></script><script src="assets/engine.js"></script><script>fetch('data/course.json').then(r=>r.json()).then(bundle=>{window.textbookApp=GeometryTextbook.createApp(document.getElementById('textbook-app'),{...bundle,allowInReview:true});});</script></html>'''
    (target/'review.html').write_text(preview.replace('__CHAPTER__',CHAPTER_LABELS[chapter]))
    print(json.dumps({'candidate':chapter,'cards':bundle['build']['authoredCards'],'publicationApprovalGranted':False,'publicBundleModified':False,'output':str(output)},ensure_ascii=False))
    return bundle
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--chapter',type=int,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args();build(a.chapter,a.output)
