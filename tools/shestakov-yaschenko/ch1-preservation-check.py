"""Exact released-record preservation and exhaustive chapter-one source coverage."""
from pathlib import Path
import hashlib,json

root=Path(__file__).resolve().parents[2]
course=root/'stereo-course/shestakov-yaschenko-10-11'
scope=json.loads((Path(__file__).with_name('ch1-completion-scope.json')).read_text())
chapter=json.loads((course/'chapters/ch1.json').read_text())
inventory=json.loads((course/'data/source-index.json').read_text())
def digest(record):
    return hashlib.sha256(json.dumps(record,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def key(record):
    return f"{record['section']}-{record['level']}{record['number']}-{record['part']}"
actual={key(record):record for record in chapter['lessons']}
expected={f"{record['section']}-{record['level']}{record['number']}-{part}" for record in inventory['tasks'] if record['section'].startswith('1.') for part in ['a','b']}
assert len(actual)==len(chapter['lessons'])==252
assert set(actual)==expected,{'missing':sorted(expected-set(actual)),'extra':sorted(set(actual)-expected)}
assert len(scope['preservedLessons'])==60
for identifier,expected_hash in scope['preservedLessons'].items():
    assert digest(actual[identifier])==expected_hash,identifier+' changed released content'
theory={record['section']:record for record in chapter['theory']}
assert len(theory)==len(chapter['theory'])==len(scope['preservedTheory'])==5
for identifier,expected_hash in scope['preservedTheory'].items():
    assert digest(theory[identifier])==expected_hash,identifier+' changed released theory'
new=set(actual)-set(scope['preservedLessons'])
assert len(new)==scope['newVariants']==192
for section,count in scope['expectedPerSection'].items():
    assert sum(record['section']==section for record in actual.values())==count,section
print('SHESTAKOV_CH1_PRESERVATION_OK: 60 released variants and 5 theories unchanged; all 252 chapter variants present, 192 additions')
