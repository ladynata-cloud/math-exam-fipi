#!/usr/bin/env python3
"""Merge explicit, checked authorship manifests; never infer or approve content."""
import argparse
import json
from pathlib import Path

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('manifests',nargs='+',type=Path)
    args=parser.parse_args()
    root=Path(__file__).resolve().parents[2]
    course=root/'stereo-course/merzlyak-10-base'
    path=course/'source-index.json'
    index=json.loads(path.read_text());entries={e['id']:e for e in index['entries']}
    changed=[]
    for manifest_path in args.manifests:
        manifest_path=manifest_path.resolve()
        manifest=json.loads(manifest_path.read_text())
        records=manifest.get('entries')
        if records is None and 'paragraphs' in manifest:
            records=[]
            for paragraph in manifest['paragraphs']:
                record=dict(paragraph)
                record['lessonFiles']=[paragraph['overview']['file']]+[x['file'] for x in paragraph['addedLessons']]
                records.append(record)
        if not isinstance(records,list):raise ValueError('No explicit coverage records: '+str(manifest_path))
        for record in records:
            identity=record.get('sourceEntryId',record.get('sourceId'))
            if identity not in entries:raise ValueError('Unknown source identity: '+str(identity))
            entry=entries[identity]
            parts=record['requiredParts']
            if not parts or len(set(parts))!=len(parts):raise ValueError('Invalid required parts: '+identity)
            files=record.get('lessonFiles') or ([record['file']] if 'file' in record else None)
            if files is None and 'existingOverview' in record:
                files=[record['existingOverview']['lessonFile']]+record['newLessonFiles']
            if files is None:
                ids=record.get('lessonIds',record.get('coveredBy',[]))
                files=[f'stereo-course/merzlyak-10-base/lessons/{i}.json' for i in ids]
            if not files:raise ValueError('No explicit authored files: '+identity)
            lessons=[json.loads((root/f).read_text()) for f in files]
            for lesson in lessons:
                identity_keys=['bookId','collection','exercise','point']
                if entry['source']['collection'] in ['selfcheck','example']:
                    identity_keys.append('chapter')
                for key in identity_keys:
                    if lesson['source'].get(key)!=entry['source'].get(key):
                        raise ValueError(f'{identity}: {lesson["id"]} mismatched source {key}')
            authored=[lesson['source'].get('subpart') for lesson in lessons]
            if sorted(authored,key=str)!=sorted(parts,key=str):
                raise ValueError(f'{identity}: required parts differ from authored identities {parts!r} {authored!r}')
            pages=record.get('sourcePdfPages',record.get('pdfPages',record.get('source',{}).get('pdfPages',[])))
            pages=sorted(set(pages)|{p for lesson in lessons for p in lesson['source']['pdfPages']})
            if not pages:raise ValueError('No source pages: '+identity)
            entry['requiredParts']=parts
            entry['source']['pdfPages']=pages
            entry['source']['printedPages']=[p-1 for p in pages]
            entry['coverageReview']='Explicit authored draft mapping; source, mathematical and pedagogical release reviews remain separate. Open-ended research entries represent worked guidance, not completed pupil reports.'
            entry['authorshipManifest']=manifest_path.relative_to(root).as_posix()
            for key in ['textbookParts','authoredSourceSubparts','sourceSubparts']:
                if key in record:entry['textbookParts']=record[key]
            if record.get('sourceIssue'):entry['sourceIssue']=record['sourceIssue']
            changed.append(identity)
    # Global completeness is a separately reviewed fact, never a side effect of authoring.
    path.write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'mappedSourcePositions':len(changed),'inventoryComplete':index['inventoryComplete']}))

if __name__=='__main__':main()
