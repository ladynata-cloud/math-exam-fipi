"""Complete chapter II: independently reviewed source coverage and preserved work.

The three source/math oracles are prepared in cross-review, independently of the
range author. Their file hashes pin what was actually reviewed. This gate does
not treat the source-map range or an author's canonical-answer self-check as
proof of complete textbook coverage.
"""
import hashlib
import json
import re
import subprocess
from pathlib import Path

P = Path(__file__).resolve().parent
SOURCE = '356695f0f11a489090ed72428320a6d6cc343747eec02968b716c2204caaced8'
RANGES = [(268, 344), (345, 436), (437, 509)]
checks = 0

def ok(value, message):
    global checks
    assert value, message
    checks += 1

def read(name):
    return json.loads((P / name).read_text())

def digest(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, separators=(',', ':')).encode()).hexdigest()

lessons = sum((read(f) for f in ['ch1.json', 'ch2.json', 'ch3.json', 'ch4-6.json']), [])
lessons.sort(key=lambda l: l['order'])
by_lesson = {l['id']: l for l in lessons}
for file, topic in [('exercises-1-24.json', 'p01'), ('exercises-25-54.json', 'p02'), ('exercises-55-74.json', 'p03'), ('exercises-75-109.json', 'p04')]:
    by_lesson[topic]['tasks'].extend(read(file))
baseline = read('roots-prior-tasks.json')
ok(baseline['count'] == 722, 'prior course has exactly 722 frozen task records')
ok(len(baseline['records']) == 722, '722 actual frozen records')
old_addresses = {(l['id'], i, t['id']) for l in lessons for i, t in enumerate(l['tasks'])}
frozen_addresses = {(r['lesson'], r['index'], r['id']) for r in baseline['records']}
ok(len(old_addresses) == len(frozen_addresses) == 722 and old_addresses == frozen_addresses, 'unique complete prior routes and identities')
ok(baseline['storageKey'] == 'mathexam.makarychev8.2024.v1', 'unchanged learner storage identity')
for record in baseline['records']:
    task = by_lesson[record['lesson']]['tasks'][record['index']]
    ok(task['id'] == record['id'] and digest(task) == record['sha256'], 'old task payload/route changed: ' + record['id'])

ranges = []
for first, last in RANGES:
    name = f'roots-{first}-{last}.json'
    content = read(name)
    ok(content['sourceSha256'] == SOURCE, name + ' exact uploaded edition')
    ok(content['range'] == [first, last], name + ' assigned source range')
    for topic, tasks in content['topics'].items():
        ok(topic in {f'p{i:02}' for i in range(10, 20)}, name + ' existing chapter topic')
        by_lesson[topic]['tasks'].extend(tasks)
    ranges.append((name, content))
review = read('roots-review.json')
ok(review['sourceSha256'] == SOURCE, 'same source for review questions')
for topic, tasks in review['topics'].items():
    by_lesson[topic]['tasks'].extend(tasks)

all_tasks = [t for l in lessons for t in l['tasks']]
by_id = {t['id']: t for t in all_tasks}
ok(len(by_id) == len(all_tasks), 'all task IDs are unique')
roots = [t for l in lessons if 10 <= l['order'] <= 19 for t in l['tasks']]
source_tasks = [t for t in roots if t['source']['type'] == 'textbook']
number = lambda t: int(re.search(r'№\s*(\d+)', t['source']['reference'])[1])
numbers = {number(t) for t in source_tasks}
coverage = sorted([c for _, content in ranges for c in content['coverage']], key=lambda c: c['number'])
ok([c['number'] for c in coverage] == list(range(268, 510)), 'one ordered coverage record per number')
for c in coverage:
    ok(c['taskIds'] and all(id in by_id and by_id[id]['source']['type'] == 'textbook' and number(by_id[id]) == c['number'] for id in c['taskIds']), f'coverage/source identity №{c["number"]}')
ok(len([id for c in coverage for id in c['taskIds']]) == len(source_tasks) and {id for c in coverage for id in c['taskIds']} == {t['id'] for t in source_tasks}, 'exact distinct coverage of every source card')
ok(numbers == set(range(268, 510)), 'exactly every chapter II number, no missing or extra exercise')
for t in source_tasks:
    ok(64 <= t['source']['page'] <= 114, t['id'] + ' printed chapter page')
for t in roots:
    ok(len(t['steps']) >= 2 and all(q.get('prompt') and q.get('answer') is not None and q.get('explanation') for q in t['steps']), t['id'] + ' complete retained steps')
    if t['id'].startswith('roots-'):
        ok(t['id'].isascii(), t['id'] + ' stable ASCII ID')
        # A complete equation can be shorter than a prose sentence (e.g. 0=0/1).
        # Require an actual mathematical relation/result for a short conclusion.
        ok(len(t['explanation']) >= 25 or re.search(r'[=<>≤≥≈]|равен|равна|равно|равны|Решения:', t['explanation']), t['id'] + ' mathematical conclusion')

# Independent cross-review may supply an executable exact oracle or a pinned
# fixture. At least one is mandatory for each entire source block.
independent_cases = []
checked_review_ids = set()
for first, last in RANGES:
    name = f'roots-{first}-{last}.json'
    fixture = P / f'roots-oracle-{first}-{last}.json'
    script = P / f'test-roots-{first}-{last}.py'
    ok(fixture.exists() or script.exists(), f'independent source/math oracle missing: {first}–{last}')
    if script.exists():
        subprocess.run(['python', str(script)], check=True)
    if fixture.exists():
        oracle = json.loads(fixture.read_text())
        ok(oracle['range'] == [first, last], 'reviewed range')
        ok(oracle['reviewedFileSha256'] == hashlib.sha256((P / name).read_bytes()).hexdigest(), name + ' changed after independent review')
        expected_counts = {int(n): count for n, count in oracle['counts'].items()}
        ok(set(expected_counts) == set(range(first, last + 1)), name + ' independently enumerated exercise coverage')
        for n, expected in expected_counts.items():
            ok(sum(number(t) == n for t in source_tasks) == expected, f'№{n}: incomplete/duplicate source parts or secondary questions')
        ok({case['taskId'] for case in oracle['checks']} == {t['id'] for t in source_tasks if first <= number(t) <= last}, name + ' independently checked final answer for every source card')
        for case in oracle['checks']:
            ok(case['taskId'] in by_id, 'independent expectation has a real route ' + case['taskId'])
            task = by_id[case['taskId']]
            ok(first <= number(task) <= last, 'case belongs to assigned range')
            ok(case.get('reason') and case.get('sourcePage') == task['source']['page'], case['taskId'] + ' independent justification/page')
            independent_cases.append({'task': task, 'expected': str(case['answer']), 'wrong': case.get('rejects', [])})

        if 'reviewChecks' in oracle:
            ok(oracle['reviewedReviewFileSha256'] == hashlib.sha256((P / 'roots-review.json').read_bytes()).hexdigest(), 'review questions changed after review')
            ok({c['taskId'] for c in oracle['reviewChecks']} == {t['id'] for ts in review['topics'].values() for t in ts}, 'all review-card answers independently checked')
            for case in oracle['reviewChecks']:
                task = by_id[case['taskId']]
                checked_review_ids.add(case['taskId'])
                ok(case['sourcePage'] == task['source']['page'] and case.get('reason'), case['taskId'] + ' review source/reason')
                independent_cases.append({'task': task, 'expected': str(case['answer']), 'wrong': case.get('rejects', [])})

ok(checked_review_ids == {t['id'] for ts in review['topics'].values() for t in ts}, 'mandatory independent coverage of every review card')

if independent_cases:
    node = "const C=require('./check.js');let s='';process.stdin.on('data',c=>s+=c);process.stdin.on('end',()=>{let n=0;for(const c of JSON.parse(s)){if(!C.check(c.expected,c.task))throw Error(c.task.id+' rejects independently calculated '+c.expected);for(const a of c.wrong)if(C.check(a,c.task))throw Error(c.task.id+' accepts wrong '+a);n++;}console.log(JSON.stringify({independentAnswers:n,status:'PASS'}));});"
    subprocess.run(['node', '-e', node], input=json.dumps(independent_cases), text=True, cwd=P, check=True)

# Review questions really cover all seven + four + three textbook prompts;
# extra cards split compound prompts and retain the equal-conjugate case.
review_cards = [t for tasks in review['topics'].values() for t in tasks]
ok(len(review_cards) == 21, 'complete review-question adaptations')
for section, count in [(4, 7), (5, 4), (6, 3)]:
    for q in range(1, count + 1):
        ok(any(re.match(fr'^roots-review-{section}-{q}(?:-|$)', t['id']) for t in review_cards), f'review §{section} question {q}')

# Compare the actual built course, so an append-only source cannot hide a build
# that reorders, replaces or drops an existing record.
text = (P / 'data.js').read_text()
built = json.loads(text.split('window.MakarychevCourse=', 1)[1].removesuffix(';\n'))
ok(len(built['lessons']) == len(lessons) == 51, 'all original topics retained')
for original, actual in zip(lessons, built['lessons']):
    ok(original['id'] == actual['id'] and original['tasks'] == actual['tasks'], original['id'] + ' exact append-only tasks in built course')
    if 10 <= original['order'] <= 19:
        positions = {t['id']: i for i, t in enumerate(original['tasks'])}
        source_ids = [id for c in coverage for id in c['taskIds'] if id in positions]
        ordered = set(source_ids)
        expected_order = [positions[id] for id in source_ids] + [i for i, t in enumerate(original['tasks']) if t['id'] not in ordered]
        ok(actual['studyOrder'] == expected_order and sorted(actual['studyOrder']) == list(range(len(original['tasks']))), original['id'] + ' complete source-ordered navigation with preserved URL indices')
for record in baseline['records']:
    t = next(l for l in built['lessons'] if l['id'] == record['lesson'])['tasks'][record['index']]
    ok(digest(t) == record['sha256'], 'built prior payload unchanged ' + record['id'])
print(json.dumps({'status': 'PASS', 'checks': checks, 'sourceNumbers': len(numbers), 'rootCards': len(roots), 'reviewCards': len(review_cards), 'priorTasksPreserved': baseline['count']}, ensure_ascii=False))
