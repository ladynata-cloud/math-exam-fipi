"""Embed the exact authored transfer activity, keeping retained trainer bytes."""
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
START='<!-- atanasyan-active-practice:start -->'
END='<!-- atanasyan-active-practice:end -->'
runtime=(ROOT/'tools/atanasyan-active-practice.runtime.js').read_text()
configs=[]
for name in ['active-practice-ch12.json','active-practice-ch34.json']:
    data=json.loads((ROOT/'geometry-course/data'/name).read_text())
    assert isinstance(data,list),name
    configs+=data
by_id={item['id']:item for item in configs}
paths=sorted((ROOT/'geometry-course/trainers').glob('*.html'))
assert len(by_id)==len(configs)==len(paths)==70,'Every retained trainer must have exactly one bank'
assert set(by_id)=={p.stem for p in paths},'Bank must match exact retained trainer IDs'
for path in paths:
    config=by_id[path.stem]
    assert isinstance(config.get('topic'),str) and config['topic'].strip(),path
    assert len(config['tasks'])>=3,path
    ids=set();conditions=set()
    for task in config['tasks']:
        assert isinstance(task['id'],str) and task['id'] not in ids,path
        ids.add(task['id'])
        for field in ['prompt','hint','solution']:
            assert isinstance(task[field],str) and task[field].strip(),(path,field)
        answer=task['answer'];assert answer['kind'] in ['number','choice'],path
        if answer['kind']=='number':
            assert isinstance(answer['value'],(int,float)) and not isinstance(answer['value'],bool),path
            if 'tolerance' in answer:assert 0<=answer['tolerance']<=0.01,path
        else:
            options=answer['options'];assert len(options)>=2,path
            assert all(isinstance(o['value'],str) and isinstance(o['label'],str) for o in options),path
            assert len({o['value'] for o in options})==len(options),path
            assert answer['value'] in [o['value'] for o in options],path
        condition=json.dumps([task['prompt'],answer['kind'],answer['value']],ensure_ascii=False)
        assert condition not in conditions,'Repeated condition in '+str(path)
        conditions.add(condition)
        figure=task.get('figure','')
        if figure:
            assert re.match(r'^\s*<svg\b',figure) and re.search(r'</svg>\s*$',figure),path
            assert not re.search(r'<\s*(?:script|foreignObject|iframe|image|use|style)\b|\bon\w+\s*=|(?:href|src)\s*=|url\s*\(',figure,re.I),path
        assert all(isinstance(e.get('feedback'),str) for e in task.get('errors',[])),path
    content=path.read_bytes().decode('utf-8')
    assert content.count(START)==content.count(END)<=1,path
    content=re.sub(re.escape(START)+r'.*?'+re.escape(END)+r'\n?','',content,flags=re.S)
    assert content.count('</body>')==1,path
    encoded=json.dumps(config,ensure_ascii=False).replace('</','<\\/')
    block=START+'\n<script type="application/json" id="atanasyan-active-practice-config">'+encoded+'</script>\n<script>\n'+runtime.replace('</script','<\\/script')+'</script>\n'+END+'\n'
    result=content.replace('</body>',block+'</body>').encode('utf-8')
    if result!=path.read_bytes():path.write_bytes(result)
print('Embedded authored transfer tasks in',len(paths),'retained trainers')
