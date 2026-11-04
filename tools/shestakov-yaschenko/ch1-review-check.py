"""Every added card must have a separate exact-module/record independent review."""
from pathlib import Path
import hashlib,json,runpy,sys
root=Path(__file__).resolve().parents[2]
folder=Path(__file__).with_name('expansion-ch1')
sys.path.insert(0,str(folder))
authors={'sections-1-1-1-5':'/root/source_inventory','section-1-2':'/root/chapter2','section-1-3':'/root/chapter3','section-1-4-a':'/root/chapter4','section-1-4-b':'/root/chapter5','section-1-4-c':'/root/chapter6'}
chapter=json.loads((root/'stereo-course/shestakov-yaschenko-10-11/chapters/ch1.json').read_text())
def key(record):return f"{record['section']}-{record['level']}{record['number']}-{record['part']}"
def digest(records):return hashlib.sha256(json.dumps(records,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
actual={key(record):record for record in chapter['lessons']}
checked=set()
for stem,author in authors.items():
    module=folder/(stem+'.py')
    records=runpy.run_path(str(module))['lessons']
    report=json.loads((folder/('review-'+stem+'.json')).read_text())
    ids=sorted(key(record) for record in records)
    assert not checked.intersection(ids),stem+' duplicated reviewed scope'
    assert report['verdict']=='passed' and report['remainingFindings']==[],stem
    assert report['author']==author and report['reviewer'] and report['reviewer']!=author,stem+' independent reviewer required'
    assert report['at'] and report['checkedIds']==ids,stem+' exact scope required'
    assert report['sha256']==hashlib.sha256(module.read_bytes()).hexdigest(),stem+' stale module review'
    assert report['recordsSHA256']==digest(records),stem+' stale generated-record review'
    assert digest([actual[key(record)] for record in records])==digest(records),stem+' reviewed records differ from chapter'
    assert (folder/('review-'+stem+'-checks.py')).is_file(),stem+' independent executable mathematics missing'
    checked.update(ids)
scope=json.loads(Path(__file__).with_name('ch1-completion-scope.json').read_text())
assert len(checked)==192 and checked==set(actual)-set(scope['preservedLessons'])
print('SHESTAKOV_CH1_INDEPENDENT_REVIEW_OK: six independently reviewed scopes, all 192 additions, exact module and record hashes')
