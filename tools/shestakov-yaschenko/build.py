#!/usr/bin/env python3
"""Deterministic course bundle. Only independently reviewed chapter bytes become available."""
import json,hashlib,argparse
from pathlib import Path
root=Path(__file__).resolve().parents[2]
course=root/'stereo-course/shestakov-yaschenko-10-11'
parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');args=parser.parse_args()
inv=json.loads((course/'data/source-index.json').read_text())
book={'id':'shestakov-yaschenko-2021-10-11','title':'Геометрия 10–11 · Шестаков — Ященко','edition':'И. В. Ященко, С. А. Шестаков · универсальный многоуровневый сборник задач · 3-е издание · 2021','pdfPageCount':240}
sections={s['id']:s for s in inv['sections']};chapters={c['id']:c for c in inv['chapters']}
tasks={(t['section'],t['level'],t['number']):t for t in inv['tasks']}
assert len(tasks)==990 and sum(s['taskCount'] for s in sections.values())==990
reviewfile=root/'tools/shestakov-yaschenko/content-reviews.json'
reviews=json.loads(reviewfile.read_text()) if reviewfile.exists() else {}
entries={};lessons=[]
def sid(section,level=None,number=None,part=None):
 return 'sy-'+section.replace('.','-')+('-'+level.lower()+str(number)+'-'+part if level else '-theory')
def source(section,pages,level=None,number=None,part=None):
 s={'bookId':book['id'],'collection':'main' if level else 'theory','chapter':'Глава '+str(sections[section]['chapter'])+'. '+chapters[sections[section]['chapter']]['title'],'section':section,'printedPages':pages,'pdfPages':pages}
 if level:s.update(exercise=section+' '+level+str(number),subpart={'a':'а','b':'б'}[part],level=level)
 else:s['point']=section
 return s
for t in inv['tasks']:
 for part in ['a','b']:
  id=sid(t['section'],t['level'],t['number'],part)
  entries[id]={'id':id,'revision':1,'kind':'exercise','title':t['section']+' · '+t['level']+str(t['number'])+{'a':'а','b':'б'}[part]+' · '+sections[t['section']]['title'],'status':'draft','source':source(t['section'],list(range(t['pdfPage'],t['endPdfPage']+1)),t['level'],t['number'],part)}
for chapter in range(1,7):
 path=course/f'chapters/ch{chapter}.json'
 if not path.exists():continue
 raw=path.read_bytes();data=json.loads(raw)
 assert data['chapter']==chapter
 rev=reviews.get(str(chapter),{})
 reviewed=rev.get('sha256')==hashlib.sha256(raw).hexdigest() and rev.get('verdict')=='passed' and rev.get('reviewer') and rev.get('at')
 seen=set()
 for kind,records in [('theory',data['theory']),('exercise',data['lessons'])]:
  for r in records:
   section=r['section'];assert sections[section]['chapter']==chapter
   isex=kind=='exercise';level=r.get('level');number=r.get('number');part=r.get('part')
   id=sid(section,level,number,part) if isex else sid(section)
   assert id not in seen,id;seen.add(id)
   pages=r['pages'];assert pages and all(isinstance(p,int) and 5<=p<=238 for p in pages)
   if isex:
    t=tasks[(section,level,number)]
    assert part in ['a','b'] and all(t['pdfPage']<=p<=t['endPdfPage'] for p in pages),(id,pages,t['pdfPage'],t['endPdfPage'])
   status='reviewed' if reviewed else 'in-review'
   title=(section+' · '+level+str(number)+{'a':'а','b':'б'}[part]+' · ' if isex else section+' · Теория · ')+r['title']
   identity={'id':id,'revision':1,'kind':kind,'title':title,'status':status,'source':source(section,pages,level,number,part) if isex else source(section,pages)}
   model=r['model'];model.setdefault('title',title);model.setdefault('note','Размеры и отношения заданы условием; рисунок не заменяет доказательство.')
   steps=[]
   for i,s in enumerate(r['steps'],1):
    step={'id':'step-'+str(i),'title':s['title'],'prompt':s['prompt'],'explanation':s['explanation'],'view':s.get('view','neutral'),'justifications':[{'kind':'theorem','text':s['reason']}]}
    if s.get('input'):step['input']=s['input']
    steps.append(step)
   helpitem={'id':'help-start','question':'С чего начать?','text':r['hint'],'view':'neutral'}
   if isex:helpitem['theoryIds']=[sid(section)]
   lesson={'schemaVersion':1,**identity,'statement':{'text':r['text'],'goal':r['goal']},'visualization':{'type':'scene3d','caption':r.get('caption','На рисунке показаны данные задачи. Дополнительные построения открываются по шагам.'),'model':model},'help':[helpitem],'steps':steps,'review':{'source':'passed' if reviewed else 'pending','mathematics':'passed' if reviewed else 'pending','pedagogy':'passed' if reviewed else 'pending'}}
   if isex:
    lesson['answer']=dict(r['answer'])
    if lesson['answer']['prompt'].lower().startswith(('введи ответ','ответ','результат')):lesson['answer']['prompt']=r['goal'].rstrip('.')+'. '+lesson['answer']['prompt']
   if reviewed:lesson['review'].update(reviewer=rev['reviewer'],at=rev['at'])
   entries[id]=identity;lessons.append(lesson)
# Inventory theory independently of how many content chapters have arrived.
for s in sections.values():
 id=sid(s['id'])
 if id not in entries:entries[id]={'id':id,'revision':1,'kind':'theory','title':s['id']+' · Теория · '+s['title'],'status':'draft','source':source(s['id'],[s['pdfPage']])}
key=lambda x:(tuple(map(int,x['source']['section'].split('.'))),0 if x['kind']=='theory' else 1,x['source'].get('level',''),int(x['source'].get('exercise','A0').split()[-1][1:]) if x['kind']=='exercise' else 0,x['source'].get('subpart',''))
bundle={'catalog':{'schemaVersion':1,'book':book,'inventoryComplete':True,'sections':[{'id':s['id'],'title':s['title']} for s in sections.values()],'entries':sorted(entries.values(),key=key)},'lessons':sorted(lessons,key=key)}
assert len(entries)==2007
output=json.dumps(bundle,ensure_ascii=False,indent=2)+'\n'
dest=course/'data/course.json'
if args.check:assert dest.read_text()==output,'Bundle differs from authored sources/review records'
else:dest.write_text(output)
print(json.dumps({'numberedTasks':990,'variants':1980,'theory':27,'authoredExercises':sum(l['kind']=='exercise' for l in lessons),'authoredTheory':sum(l['kind']=='theory' for l in lessons),'reviewedCards':sum(l['status']=='reviewed' for l in lessons)},ensure_ascii=False))
