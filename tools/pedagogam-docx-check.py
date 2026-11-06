#!/usr/bin/env python3
"""Independent question-derived math and delivered Word package contracts."""
from fractions import Fraction
import hashlib
import json
from pathlib import Path
import re
import zipfile
from lxml import etree
import sympy as S
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'pedagogam/raboty'
source=json.loads((OUT/'word-packs.json').read_text())
manifest=json.loads((OUT/'word-manifest.json').read_text())
NS={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
    'm':'http://schemas.openxmlformats.org/officeDocument/2006/math',
    'v':'urn:schemas-microsoft-com:vml',
    'r':'http://schemas.openxmlformats.org/package/2006/relationships'}
x,y=S.symbols('x y')
checks=0
def require(condition,message):
    global checks
    checks+=1
    assert condition,message
def maths(text):return re.findall(r'\[\[(.*?)\]\]',text)
def plain(text):return re.sub(r'\[\[(.*?)\]\]',r'\1',text)
def expr(text):
    normalized=text.replace('−','-').replace('·','*').replace('°','').replace(':','/')
    require(bool(re.fullmatch(r'[0-9xy+*/().\s-]+',normalized)),('expression alphabet',text))
    return parse_expr(normalized,local_dict={'x':x,'y':y},transformations=standard_transformations+(implicit_multiplication_application,))
def equal(a,b,label):require(S.simplify(a-b)==0,label)
def numeric_solution_lines(task,substitutions):
    for step in task['solution']:
        for equation in maths(step):
            parts=equation.split('=')
            if len(parts)>1:
                values=[expr(p).subs(substitutions) for p in parts]
                for value in values[1:]:equal(value,values[0],(task['id'],'solution',equation))

require(len(source['packs'])==3,'three topics')
require({p['title'] for p in source['packs']}=={'Минус перед скобками','Сумма углов треугольника','Линейные графики ОГЭ'},'approved subjects')
require(hashlib.sha256((ROOT/source['bankPath']).read_bytes()).hexdigest()==source['bankSha256'],'existing bank unchanged')
bank={p['id']:p for p in json.loads((ROOT/source['bankPath']).read_text())}
require(len(bank)==145,'existing topic count')
ids=set();count=0
for pack in source['packs']:
    require(len(pack['variants'])==4,pack['id'])
    require([v['name'] for v in pack['variants']]==['1','2','3','4'],'variant identities')
    prompts=[]
    for variant in pack['variants']:
        tasks=variant['tasks']
        require(len(tasks)==4,'four questions')
        require([t['points'] for t in tasks]==[1,1,2,2],'equivalent scoring')
        for number,task in enumerate(tasks,1):
            require(task['id'] not in ids,'unique question identity');ids.add(task['id']);count+=1
            require(task['origin']['bankId']==pack['bankId'],'explicit provenance')
            require(len(task['solution'])>0,'teacher explanation')
            prompts.append(task['prompt'])
            if pack['id']=='minus-pered-skobkami':
                values=maths(task['prompt']);require(len(values)==1,'one bracket expression')
                require('− (' in values[0] or '−(' in values[0], 'minus before brackets')
                original=expr(values[0]);answer=expr(maths(task['answer'])[0])
                equal(original,answer,(task['id'],'expanded answer'))
                require(S.Poly(answer,x).total_degree()==1,'simple linear polynomial')
                for step in task['solution']:
                    for chain in maths(step):
                        for part in chain.split('='):equal(expr(part),original,(task['id'],'every transformation'))
            elif pack['id']=='summa-uglov-treugolnika':
                angles=list(map(int,re.findall(r'(\d+)°',task['prompt'])))
                require(all(0<a<180 for a in angles),'positive given angles')
                expected=[180-sum(angles),90-angles[0],S.Rational(180-angles[0],2),sum(angles)][number-1]
                answers=[expr(a) for a in maths(task['answer'])]
                require(len(answers)==(2 if number==3 else 1),'each requested angle')
                require(expected>0 and expected<180 and S.sympify(expected).is_Integer,'equally simple integer result')
                for answer in answers:equal(answer,expected,(task['id'],'angle answer'))
                numeric_solution_lines(task,{})
                if number!=3:
                    original=bank[pack['bankId']]['variants'][int(variant['name'])-1]['sr'][number-1]['q']
                    require(angles==list(map(int,re.findall(r'(\d+)°',original))),'reused source angles')
            else:
                equations=maths(task['prompt'])
                function=expr(equations[0].split('=')[1])
                require(S.Poly(function,x).total_degree()==1,'linear source formula')
                if number==1:
                    given=expr(equations[-1].split('=')[1]);expected=function.subs(x,given)
                    equal(expr(maths(task['answer'])[0]),expected,task['id'])
                    numeric_solution_lines(task,{x:given,y:expected})
                elif number==2:
                    given=expr(equations[-1].split('=')[1]);roots=S.solve(function-given,x)
                    require(len(roots)==1,'unique input')
                    equal(expr(maths(task['answer'])[0].split('=')[1]),roots[0],task['id'])
                    numeric_solution_lines(task,{x:roots[0],y:given})
                elif number==3:
                    graph=task['graph'];require(graph['range']==6,'shared grid scale')
                    equal(S.diff(function,x),graph['k'],'plotted slope');equal(function.subs(x,0),graph['b'],'plotted intercept')
                    pts=[tuple(expr(v) for v in text.strip('()').split(';')) for text in maths(task['answer'])]
                    require(len(pts)==2 and pts[0]!=pts[1],'two distinct construction points')
                    for px,py in pts:equal(function.subs(x,px),py,'point lies on line')
                    require(pts==[tuple(p) for p in graph['points']],'drawn points equal teacher answer')
                    require(all(-6<=c<=6 for pt in pts for c in pt),'construction points visible on grid')
                    substitutions=maths(task['solution'][0])
                    require(len(substitutions)==4,'two explicit construction substitutions')
                    for offset in [0,2]:
                        px=expr(substitutions[offset].split('=')[1]);py=expr(substitutions[offset+1].split('=')[1])
                        equal(function.subs(x,px),py,'teacher construction substitution')
                else:
                    tuples=[text for text in maths(task['answer']) if ';' in text]
                    require(len(tuples)==2,'both intercepts')
                    points=[tuple(expr(v) for v in text.strip('()').split(';')) for text in tuples]
                    require(points[0][1]==0 and points[1][0]==0,'ordered Ox/Oy intercepts')
                    for px,py in points:equal(function.subs(x,px),py,'axis intercept on source line')
                    for step,(px,py) in zip(task['solution'],points):
                        for equation in maths(step):
                            parts=equation.split('=')
                            if len(parts)>1:
                                values=[expr(p).subs({x:px,y:py}) for p in parts]
                                for value in values[1:]:equal(value,values[0],'teacher intercept calculation')
                original=bank[pack['bankId']]['variants'][int(variant['name'])-1]['sr'][number-1]
                require(re.findall(r'\d+',plain(task['prompt']))==re.findall(r'\d+',original['q']),'reused linear-function data')
    require(len(set(prompts))==16,'distinct numerical variants')
require(count==48,'48 verified questions')

require(manifest['tasks']==48 and manifest['variants']==12 and len(manifest['files'])==7,'artifact counts')
require(hashlib.sha256((OUT/'word-packs.json').read_bytes()).hexdigest()==manifest['sourceSha256'],'manifest source identity')
for row in manifest['files']:
    path=OUT/row['path'];data=path.read_bytes()
    require(len(data)==row['bytes'] and hashlib.sha256(data).hexdigest()==row['sha256'],'delivered file identity')
    with zipfile.ZipFile(path) as z:
        require(z.testzip() is None,'DOCX CRC')
        require('[Content_Types].xml' in z.namelist() and 'word/document.xml' in z.namelist(),'DOCX structure')
        for name in z.namelist():
            if name.endswith('.xml') or name.endswith('.rels'):etree.fromstring(z.read(name))
            require(not name.startswith('word/media/'),'editable vectors and math, no bitmap content')
            if name.endswith('.rels'):
                rels=etree.fromstring(z.read(name))
                require(not rels.xpath('//*[@TargetMode="External"]'),'no external relationship')
        tree=etree.fromstring(z.read('word/document.xml'))
        text=''.join(tree.xpath('//w:t/text()|//m:t/text()',namespaces=NS))
        require('[[' not in text and ']]' not in text,'no authoring markup leaks')
        require(not tree.xpath('//w:ins|//w:del|//w:documentProtection',namespaces=NS),'clean editable file')
        page_breaks=tree.xpath('//w:br[@w:type="page"]',namespaces=NS)
        require(len(page_breaks)==row['expectedPages']-1,'explicit variant page boundaries')
        titles=tree.xpath('//w:p[w:pPr/w:pStyle[@w:val="Title"]]',namespaces=NS)
        require(len(titles)==row['expectedPages'],'descriptive Word Title style on every sheet')
        if row['role']=='student':
            require('Ответ:' not in text and 'Ответы и решения' not in text,'no teacher answer in student file')
            require(not tree.xpath('//v:line[@strokeweight="1.5pt"]|//v:oval',namespaces=NS),'blank construction grid')
        if row.get('topic'):
            pack=next(p for p in source['packs'] if p['id']==row['topic'])
            for variant in pack['variants']:
                for task in variant['tasks']:
                    expected=plain(task['prompt']) if row['role']=='student' else plain(task['answer'])
                    require(expected in text,(row['path'],task['id'],'delivered question or answer'))
        if row.get('topic')=='lineynye-grafiki-oge':
            groups=tree.xpath('//v:group',namespaces=NS);require(len(groups)==4,'one native grid per variant')
            for i,group in enumerate(groups):
                require(group.xpath('./v:line[@from="240,32"][@to="240,440"]/v:stroke[@startarrow="block"]',namespaces=NS),'visible upward vertical axis')
                for box in group.xpath('./v:rect[v:textbox]',namespaces=NS):
                    require('width:50;' in box.get('style'),'signed labels have enough width')
                    require(box.get('filled')=='t' and box.get('fillcolor')=='#FFFFFF','readable label background')
                if row['role']=='answers':
                    line=group.xpath('./v:line[@strokeweight="1.5pt"]',namespaces=NS)
                    require(len(line)==1,'one plotted answer line')
                    require(all(group.index(box)>group.index(line[0]) for box in group.xpath('./v:rect[v:textbox]',namespaces=NS)),'labels render above the plotted line')
                    for endpoint in ['from','to']:
                        px,py=map(Fraction,line[0].get(endpoint).split(','))
                        mx=(px-240)/32;my=(240-py)/32
                        require(my==mx+(i+2),'actual Word line endpoints match question')
        if row['role']=='error-review':
            for field in ['Условие задания','Мой ответ и место ошибки','Почему появилась ошибка','Исправленное решение','Проверка и следующий шаг']:
                require(field in text,'blank error-review fields')
            require('Ответ:' not in text,'blank error review')
        settings=etree.fromstring(z.read('word/settings.xml'))
        require(not settings.xpath('//w:documentProtection|//w:trackRevisions',namespaces=NS),'no edit restriction')

with zipfile.ZipFile(OUT/source['archive']) as z:
    require(z.testzip() is None,'archive CRC')
    require(set(z.namelist())=={r['path'] for r in manifest['files']},'exact seven-file archive membership')
    for row in manifest['files']:require(z.read(row['path'])==(OUT/row['path']).read_bytes(),'archive bytes equal downloads')
require(hashlib.sha256((OUT/source['archive']).read_bytes()).hexdigest()==manifest['archive']['sha256'],'archive hash')
frozen=[]
for path in sorted(OUT.rglob('*')):
    if path.suffix in ['.pdf','.zip'] and path.name!=source['archive']:
        frozen.append([str(path.relative_to(OUT)),hashlib.sha256(path.read_bytes()).hexdigest()])
require(len(frozen)==source['preservedPdfCollection']['files'],'preserved PDF/archive path set')
require(hashlib.sha256(json.dumps(frozen,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()==source['preservedPdfCollection']['sha256'],'all existing PDF/archive bytes preserved')
print(json.dumps({'status':'PASS','checks':checks,'questions':count,'docx':7,'variants':12,'nativeGraphPages':8,'preservedPdfAndArchives':len(frozen)},ensure_ascii=False))
