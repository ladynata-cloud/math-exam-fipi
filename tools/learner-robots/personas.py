#!/usr/bin/env python3
"""Deterministic fictional learners; not a model of a medical diagnosis.

--selftest checks profiles and arithmetic without a browser. --browser performs
real UI actions in an environment where normal navigation is permitted. Never
bypass a browser policy or report planned journeys as executed journeys.
"""
from __future__ import annotations
import argparse, dataclasses, functools, json, re, subprocess, threading
from pathlib import Path
from fractions import Fraction
from http.server import ThreadingHTTPServer
from learner_robots import (Audit, DivisionLearner, QuietHandler, DIV, BASIC, GEOM,
    SHARED, frac, snapshot, basic_answer)

@dataclasses.dataclass(frozen=True)
class Learner:
    id: str
    description: str
    scenario: str
    pace_ms: int = 80
    control: str = 'mouse'
    error_rule: str = 'none'
    help_policy: str = 'none'
    interruption: str = 'none'
    repeated_submit: int = 1
    reduced_motion: bool = False

LEARNERS = (
    Learner('precise', 'Спокойно проверяет вычисления, вводит ответ без помощи.', 'division', pace_ms=150),
    Learner('hurried', 'Торопится, повторяет отправку и Enter.', 'division', pace_ms=0, repeated_submit=3),
    Learner('multiplication-gap', 'Выбирает слишком большую цифру частного, возвращается к таблице.', 'division', error_rule='too-large-digit', help_policy='table'),
    Learner('place-value-gap', 'Пропускает ноль, после ошибки просит локальную подсказку.', 'division', error_rule='drop-zero', help_policy='hint'),
    Learner('returning', 'Оставляет незаконченный ввод и возвращается после обновления.', 'division', interruption='reload'),
    Learner('phone-rotation', 'Использует касания и поворачивает экран во время ввода.', 'division', control='touch', interruption='rotate', reduced_motion=True),
    Learner('keyboard', 'Работает Tab/Enter, без кликов мышью.', 'division', control='keyboard', pace_ms=100),
    Learner('denominator-gap', 'Складывает знаменатели, исправляется после подсказки.', 'fractions', error_rule='add-denominators', help_policy='hint'),
    Learner('hint-dependent', 'Просит свойство и меняет вкладку посреди разбора.', 'geometry', help_policy='hint', interruption='tab', pace_ms=200),
    Learner('answer-repeater', 'Открывает шаг и повторяет отправку готового ответа.', 'geometry', help_policy='reveal', repeated_submit=3),
    Learner('two-notebooks', 'Решает разные задачи в двух вкладках одного браузера.', 'two-tabs'),
    Learner('bad-saved-data', 'Открывает тренажёр с повреждённой записью прогресса.', 'storage', reduced_motion=True),
)

LABELS = {'start':'Первое неполное делимое','count':'Намечаем места для ответа',
'digit':'Находим цифру ответа','product':'Умножаем','subtract':'Вычитаем',
'remainder-check':'Проверяем остаток','bring':'Сносим одну цифру','partial':'Читаем новое неполное делимое',
'comma':'Ставим запятую','answer':'Читаем ответ','final-remainder':'Записываем остаток',
'verify':'Проверяем решение','shift-count':'Готовим делитель','shift-factor':'Меняем оба числа одинаково',
'shift-divisor':'Меняем делитель','shift-dividend':'Меняем делимое'}

def mistaken_answer(rule: str, expected: str, prompt: str) -> str:
    """Change one operation. Never silently produce the correct answer."""
    if rule == 'too-large-digit':
        return str(min(99, int(frac(expected)) + 1))
    if rule == 'drop-zero':
        raw = expected.replace('0', '', 1)
        return raw if raw and raw != expected else str(frac(expected) + 1)
    if rule == 'add-denominators':
        terms = re.findall(r'(\d+)\s*/\s*(\d+)', prompt)
        if len(terms) >= 2:
            (a,b),(c,d) = terms[:2]
            wrong = str(Fraction(int(a)+int(c), int(b)+int(d)))
            return wrong if frac(wrong) != frac(expected) else str(frac(expected)+1)
    return str(frac(expected)+1)

class Actions:
    def __init__(self, page, learner):
        self.page, self.learner, self.trace = page, learner, []
    def pause(self):
        self.page.wait_for_timeout(self.learner.pace_ms)
    def focus_with_keyboard(self, target, selector):
        for _ in range(100):
            if target.evaluate('(e)=>document.activeElement===e'):
                return
            self.page.keyboard.press('Tab')
        raise AssertionError('Keyboard could not reach ' + selector)
    def press(self, selector):
        target = self.page.locator(selector).first
        if self.learner.control == 'keyboard':
            self.focus_with_keyboard(target, selector)
            self.page.keyboard.press('Enter')
        elif self.learner.control == 'touch':
            target.tap()
        else:
            target.click()
        self.trace.append({'action':'activate','target':selector,'control':self.learner.control})
        self.pause()
    def type(self, selector, value):
        target = self.page.locator(selector).first
        if self.learner.control == 'keyboard':
            self.focus_with_keyboard(target, selector)
            self.page.keyboard.press('ControlOrMeta+A')
            self.page.keyboard.insert_text(value)
        else:
            target.fill(value)
        self.trace.append({'action':'input','target':selector,'value':value})
        self.pause()

def check_layout(page):
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+1'), 'Horizontal overflow'

def division(page, url, learner, out, label):
    topic = 'zero' if learner.error_rule == 'drop-zero' else 'twoDigit' if learner.help_policy == 'table' else 'start'
    page.goto(url+'#'+topic)
    page.wait_for_function('window.__divisionGuidedDebug')
    a = Actions(page, learner)
    cur = snapshot(page)['sessions'][topic]
    t = cur['task']
    robot = DivisionLearner(t['dividend'], t['divisor'], t['level']=='remainder')
    did, history = False, 0
    for _ in range(240):
        cur = snapshot(page)['sessions'][topic]
        if cur['done']:
            break
        if cur['accepted']:
            a.press('#primary')
            continue
        step = page.locator('#step-name').inner_text()
        prompt = page.locator('#prompt').inner_text()
        answer = robot.answer(step, prompt)
        trigger = step in ('Находим цифру ответа','Читаем новое неполное делимое')
        if learner.error_rule == 'drop-zero':
            trigger = '0' in answer and len(answer)>1 and step in ('Читаем новое неполное делимое','Читаем ответ')
        if not did and trigger:
            did = True
            if learner.error_rule != 'none':
                a.type('#answer', mistaken_answer(learner.error_rule, answer, prompt))
                a.press('#primary')
                z = snapshot(page)['sessions'][topic]
                assert not z['accepted'] and z['errors']>=1, 'Misconception unexpectedly accepted'
            if learner.help_policy == 'hint':
                a.press('#help-toggle')
            if learner.help_policy == 'table':
                before = snapshot(page)['sessions'][topic]
                a.press('#multiplication-refresh')
                a.press('.mr-help')
                a.press('.mr-return')
                after = snapshot(page)['sessions'][topic]
                assert (after['answers'],after['step']) == (before['answers'],before['step'])
            if learner.interruption in ('reload','rotate'):
                a.type('#answer', '7')
                before = snapshot(page)
                if learner.interruption == 'reload':
                    page.reload()
                    page.wait_for_function('window.__divisionGuidedDebug')
                else:
                    original_viewport = dict(page.viewport_size)
                    page.set_viewport_size({'width':original_viewport['height'],'height':original_viewport['width']})
                    check_layout(page)
                    page.set_viewport_size(original_viewport)
                assert snapshot(page)==before, 'Interrupted learner lost progress or draft'
        if step == 'Проверяем остаток':
            a.press('[data-option="'+answer+'"]')
        elif step == 'Готовим делитель':
            for _ in range(int(answer)):
                a.press('.ds-forward')
        else:
            a.type('#answer', answer)
        a.press('#primary')
        z = snapshot(page)['sessions'][topic]
        assert z['accepted'] or z['done'], 'Correct step rejected: '+step+' -> '+answer
        assert len(z['answers'])>=history, 'Accepted steps disappeared'
        history = len(z['answers'])
        for _ in range(learner.repeated_submit-1):
            before = snapshot(page)
            page.locator('#answer').press('Enter')
            after = snapshot(page)
            assert after['records']==before['records'], 'Repeated Enter minted credit'
            assert after['sessions'][topic]['answers']==before['sessions'][topic]['answers'], 'Repeated Enter changed accepted answers'
    else:
        raise AssertionError('No completion within bounded actions')
    assert did, 'Fixture did not exercise this profile intervention; not a passed scenario'
    state = snapshot(page)
    assert len(state['records'])==1
    check_layout(page)
    page.screenshot(path=str(out/(label+'.png')),full_page=True)
    return {'profile':dataclasses.asdict(learner),'original':t,'record':state['records'][0],'actions':a.trace}

def fraction_gap(page, url, learner):
    page.goto(url)
    a = Actions(page, learner)
    a.press('.nav [data-route="practice"]')
    for _ in range(12):
        prompt = page.locator('#practicePrompt').inner_text()
        zone = page.locator('#practiceAnswer')
        if zone.locator('input').count() and 'Вычислите' in prompt:
            break
        a.press('#nextTask')
    else:
        raise AssertionError('No visible fraction-sum task available')
    answer = basic_answer(prompt, [])
    a.type('#practiceAnswer input', mistaken_answer(learner.error_rule,answer,prompt))
    a.press('#checkTask')
    a.press('#hint1')
    a.type('#practiceAnswer input',answer)
    a.press('#checkTask')
    state = page.evaluate('JSON.parse(localStorage.getItem("mathExamBasics.fraction-common-denominator.v1"))')
    assert state['independent']==0 and state['supported']>=1
    return {'profile':dataclasses.asdict(learner),'condition':prompt,'state':state,'actions':a.trace}

def geometry(page, url, learner):
    page.goto(url)
    page.wait_for_function('window.__oge15')
    page.evaluate('window.__oge15.trainWith("bisIso",{d:"B",L:"K",g:28,f:0})')
    page.wait_for_timeout(450)
    a = Actions(page, learner)
    text = page.locator('#taskText').inner_text()
    match = re.search(r'Угол ACB равен\s+(\d+)°', text)
    assert match, 'Independent angle reader did not recognize visible condition'
    angle_c = int(match.group(1))
    answers = (angle_c, 2*angle_c, 180-3*angle_c)
    a.press('#ladBtn')
    for i, answer in enumerate(answers):
        step = page.locator('.lstep').nth(i)
        if i == 0:
            if learner.help_policy == 'hint':
                step.locator('button.soft').click()
            if learner.help_policy == 'reveal':
                step.locator('button.sec').click()
                continue
            if learner.interruption == 'tab':
                before = step.inner_text()
                a.press('.tab[data-tab="razbor"]')
                a.press('.tab[data-tab="train"]')
                assert page.locator('.lstep').nth(i).inner_text()==before, 'Tab changed help history'
        step.locator('input').fill(str(answer))
        step.locator('input').press('Enter')
        for previous in range(i+1):
            assert page.locator('.lstep').nth(previous).is_visible(), 'Previously completed step disappeared'
    rec = page.evaluate('JSON.parse(localStorage.getItem("mathExamCourseProgress.v1"))["oge-t15-treugolniki"]')
    final = page.locator('#after').inner_text()
    assert 'Все шаги решены самостоятельно' not in final
    assert rec['train']['independent']==0
    assert rec['lastPracticeOutcome']['kind']==('shown' if learner.help_policy=='reveal' else 'supported')
    for _ in range(learner.repeated_submit-1):
        page.keyboard.press('Enter')
    after = page.evaluate('JSON.parse(localStorage.getItem("mathExamCourseProgress.v1"))["oge-t15-treugolniki"]')
    assert after==rec, 'Completion replay inflated credit'
    return {'profile':dataclasses.asdict(learner),'condition':text,'record':rec,'final':final,'actions':a.trace}

def two_tabs(page, url, learner):
    other = page.context.new_page()
    try:
        for p in (page,other):
            p.goto(url)
            p.wait_for_function('window.__oge15')
        for p,k,params,answer in [(page,'angSum',{'a':48,'b':67,'f':0},'65'),(other,'extAng',{'d':'ext','a':40,'b':65},'105')]:
            p.evaluate('([k,p])=>window.__oge15.trainWith(k,p)',[k,params])
            p.wait_for_timeout(450)
            p.locator('#ans').fill(answer)
            p.locator('#check').click()
        rec = page.evaluate('JSON.parse(localStorage.getItem("mathExamCourseProgress.v1"))["oge-t15-treugolniki"]')
        assert rec['solvedByType']['angSum']==rec['solvedByType']['extAng']==1
        assert rec['train']['independent']==2
        return {'record':rec,'profile':dataclasses.asdict(learner)}
    finally:
        other.close()

def bad_storage(page, url, learner):
    result = []
    for raw in ('null','[]','{"oge-t15-treugolniki":null}','{"oge-t15-treugolniki":{"train":null}}'):
        page.goto(url)
        page.evaluate('([k,v])=>localStorage.setItem(k,v)',[SHARED,raw])
        page.reload()
        page.wait_for_function('window.__oge15')
        page.evaluate('window.__oge15.trainWith("angSum",{a:48,b:67,f:0})')
        page.wait_for_timeout(450)
        page.locator('#ans').fill('65')
        page.locator('#check').click()
        assert 'Верно' in page.locator('#fb').inner_text()
        result.append(raw)
    return {'inputs':result,'profile':dataclasses.asdict(learner)}

def selftest(root, out):
    a = Audit(root,out)
    def profiles():
        assert len(LEARNERS)==12 and len({p.id for p in LEARNERS})==12
        assert {'keyboard','mouse','touch'}=={p.control for p in LEARNERS}
        assert {'none','reload','rotate','tab'}=={p.interruption for p in LEARNERS}
        assert all(p.pace_ms>=0 and p.repeated_submit in (1,3) for p in LEARNERS)
        return [dataclasses.asdict(p) for p in LEARNERS]
    a.run('12 executable persona definitions',profiles)
    def misconceptions():
        cases=[('too-large-digit','4','Сколько раз 7 помещается в 28?'),('drop-zero','105','Читаем новое неполное делимое'),('add-denominators','5/6','Вычислите 1/2 + 1/3')]
        for rule,answer,prompt in cases:
            assert frac(mistaken_answer(rule,answer,prompt))!=frac(answer)
        return {'cases':len(cases)}
    a.run('misconceptions alter the mathematical operation',misconceptions)
    def independent_steps():
        core=root/'trainers/oge-basics/multiplication-division/division-guided-core.js'
        js='const G=require(process.argv[1]);console.log(JSON.stringify(G.topics.flatMap(t=>Array.from({length:64},(_,i)=>{const x=G.make(t.id,i);return {t:x,actions:G.plan(x).actions}}))));'
        rows=json.loads(subprocess.check_output(['node','-e',js,str(core)],text=True,timeout=45))
        checks,failures=0,[]
        for row in rows:
            t=row['t']
            learner=DivisionLearner(t['dividend'],t['divisor'],t['level']=='remainder')
            for step in row['actions']:
                answer=learner.answer(LABELS[step['kind']],step['prompt'])
                expected=str(step['answer'])
                checks+=1
                try:
                    equal=frac(answer)==frac(expected)
                except (ValueError,ZeroDivisionError):
                    equal=answer==expected
                if not equal:
                    failures.append({'task':t,'kind':step['kind'],'actual':answer,'expected':expected})
        assert not failures,json.dumps(failures[:8],ensure_ascii=False)
        return {'tasks':len(rows),'independent_step_answers':checks,'oracle':'original operands and displayed prompt; expected fields are comparison only'}
    a.run('independent step-by-step arithmetic',independent_steps)
    return a.save()

def browser(root, candidate, out, seeds):
    from playwright.sync_api import sync_playwright
    a=Audit(root,out)
    servers=[]
    def serve(path):
        server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(QuietHandler,directory=str(path)))
        servers.append(server)
        threading.Thread(target=server.serve_forever,daemon=True).start()
        return 'http://127.0.0.1:'+str(server.server_port)+'/'
    base=serve(root)
    geom=serve(candidate)+GEOM
    try:
        with sync_playwright() as pw:
            b=pw.chromium.launch(headless=True)
            try:
                for seed in seeds:
                    for width in (360,1280):
                        for persona in LEARNERS:
                            name=f'{persona.id}-{width}-seed{seed}'
                            def run(p=persona):
                                c=b.new_context(viewport={'width':width,'height':740 if width==360 else 900},has_touch=p.control=='touch',reduced_motion='reduce' if p.reduced_motion else 'no-preference')
                                c.add_init_script(f'(()=>{{let s={seed};Math.random=()=>{{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;}};}})();')
                                page=c.new_page()
                                errors=[]
                                page.on('pageerror',lambda e:errors.append(str(e)))
                                try:
                                    if p.scenario=='division':
                                        result=division(page,base+DIV,p,out,name)
                                    elif p.scenario=='fractions':
                                        result=fraction_gap(page,base+BASIC+'fraction-common-denominator.html',p)
                                    elif p.scenario=='geometry':
                                        result=geometry(page,geom,p)
                                    elif p.scenario=='two-tabs':
                                        result=two_tabs(page,geom,p)
                                    else:
                                        result=bad_storage(page,geom,p)
                                    assert not errors,repr(errors)
                                    check_layout(page)
                                    page.screenshot(path=str(out/(name+'.png')),full_page=True)
                                    return result
                                except Exception:
                                    try:
                                        page.screenshot(path=str(out/(name+'-FAIL.png')),full_page=True)
                                    except Exception:
                                        pass
                                    raise
                                finally:
                                    c.close()
                            a.run(name,run)
            finally:
                b.close()
    finally:
        for server in servers:
            server.shutdown()
            server.server_close()
    return a.save()

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root',type=Path,required=True)
    parser.add_argument('--candidate',type=Path)
    parser.add_argument('--out',type=Path,default=Path('persona-evidence'))
    parser.add_argument('--selftest',action='store_true')
    parser.add_argument('--browser',action='store_true')
    parser.add_argument('--seeds',default='17,203,20261009')
    args=parser.parse_args()
    args.out.mkdir(parents=True,exist_ok=True)
    failures=selftest(args.root.resolve(),args.out/'selftest')
    if args.browser:
        if not args.candidate:
            parser.error('--browser requires --candidate')
        failures+=browser(args.root.resolve(),args.candidate.resolve(),args.out/'browser',[int(v) for v in args.seeds.split(',')])
    print(json.dumps({'selftests_executed':True,'browser_requested':args.browser,'failures':failures}))
    return int(failures>0)
if __name__=='__main__':
    raise SystemExit(main())
