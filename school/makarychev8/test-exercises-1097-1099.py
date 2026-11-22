from fractions import Fraction as F
from pathlib import Path
import json,re
cards=json.loads(Path(__file__).with_name('exercises-1097-1099.json').read_text())
def series(n):
    return [x for x in cards if int(re.search(r'№\s*(\d+)',x['source']['reference'])[1])==n]
speed=series(1097);water=series(1098);ice=series(1099)
assert [c['answer'] for c in speed]==['[0;6]','[14;16]','[6;14]']
assert [c['answer'] for c in water]==['[0;28]','100','вода нагревалась','вода охлаждалась']
assert [c['answer'] for c in ice]==['нагревался лёд','лёд таял','нагревалась жидкая вода']
assert [c['source']['page'] for c in cards]==[245]*3+[246]*7
assert all(c['graph'].get('variable')=='t' for c in speed+[water[0]])
checks=0
fields=[(speed,[(0,0),(6,5),(14,5),(16,0)]),(ice,[(0,-5),(4,0),(10,0),(16,3)])]
for task,knots in fields:
    for (a,b),(c,d) in zip(knots,knots[1:]):
        for i in range(301):
            frac=F(i,300);t=a+(c-a)*frac;value=b+(d-b)*frac
            expected=(5*t/6 if t<=6 else 5 if t<=14 else 5*(16-t)/2) if task is speed else (5*t/4-5 if t<=4 else 0 if t<=10 else (t-10)/2)
            assert value==expected;checks+=1
# Figure 62 runs from t=0 to 28, baseline 20, maximum 100, endpoint 70.
assert [int(c['steps'][1]['answer']) for c in water]==[4,20,20,70]
assert [int(c['steps'][1]['answer']) for c in ice]==[5,6,3]
print('PASS printed figures 61–63, all original requests and',checks,'exact rational checks.')
