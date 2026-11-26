"""Full continuation of the existing factory: 28 real preceding steps + 29 new ones.
Uses synthetic local progress only. No paid service or real pupil data.
"""
import importlib.util
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('grouping_regression', ROOT / 'tools/like-terms-factory-grouping.browser.py')
group = importlib.util.module_from_spec(spec)
spec.loader.exec_module(group)
poly = group.poly

STAGES = [
    {
        'name':'identities', 'prefix':'identity-', 'key':'likeTermsFactory.identities.v1',
        'entry':'#groupingToIdentities', 'back':'← Итоги урока о группировке', 'parent':'grouping',
        'ids':['reverse-square','not-square','cube-sum','cube-difference','sum-cubes','difference-cubes','independent-square','independent-chain','independent-identity'],
        'answers':[
            ['3x','5','30x','5+3x','25+30x+9x²'],
            ['12x','-2x'],
            ['x²+4x+4','x³+2x²+4x²+8x+4x+8','x³+6x²+12x+8'],
            ['4x²-4x+1','8x³-4x²-8x²+4x+2x-1','8x³-12x²+6x-1'],
            ['2x+3','4x²-6x+9','8x³-12x²+18x+12x²-18x+27','8x³+27'],
            ['3a-2','9a²+6a+4','27a³+18a²+12a-18a²-12a-8','27a³-8'],
            ['4y-5','-40y','16y²-40y+25'],
            ['3x','x²-4','x+2','x-2','-12x+3x³'],
            ['x²+8x+16','x²+8x','16']
        ],
        'link':'formuly-sokrashchennogo-umnozheniya.html'
    },
    {
        'name':'rational', 'prefix':'rational-', 'key':'likeTermsFactory.rational.v1',
        'entry':'#identityToRational', 'back':'← Итоги урока о формулах', 'parent':'identities',
        'ids':['domain','cancel-monomial','cancel-square','cancel-two-denominator','illegal-cancel','same-denominator','different-denominators','multiply-fractions','divide-fractions','independent-rational'],
        'answers':[
            ['4','0'], ['0','6x','2x','3'], ['3','x+3','x-3','x+3'],
            ['2;-3','x+3','x-2','x+2','x+3'], ['-3','1,75','2'],
            ['-2','4x+4','x+2'], ['-2;2','x+2','x-2','4x-4','x²-4'],
            ['-1;2','x-2','x+2','x+2'], ['3;-2','x+2','x-3','x+3'],
            ['3;-3','x+3','2','x+1']
        ],
        'link':'makarychev8/#lesson/p07'
    },
    {
        'name':'applications', 'prefix':'application-', 'key':'likeTermsFactory.applications.v1',
        'entry':'#rationalToApplications', 'back':'← Итоги урока об алгебраических дробях', 'parent':'rational',
        'ids':['linear','zero-product','square-equation','excluded-root','numerator-roots','rational-equation','negative-inequality','rational-sign','independent-inequality','independent-identity-domain'],
        'answers':[
            ['4x-11','3x','18','6','13'],
            ['1,5','-4','{3/2;-4}'], ['x-3','3'],
            ['2','x+2','2','нет'], ['2','3;2','3'],
            ['1;-1','2x+2','3x-3','5','0,5'],
            ['-2x+6','2','(-∞;-1]'],
            ['-1','2','+','−','+','[2;+inf) U (-inf;-1)'],
            ['2','-3','+','-','+','(-3;2)'],
            ['-3','x-3','(-∞;-3)∪(-3;+∞)']
        ],
        'link':'makarychev8/#lesson/p26'
    }
]
OLD_KEYS = group.OLD_KEYS + [group.KEY]

def snapshot(page, keys):
    return {k:poly.saved(page,k) for k in keys}

def state(page, stage):
    return page.evaluate('(k) => JSON.parse(localStorage.getItem(k))',stage['key'])

def seed_twenty_eight(page,url):
    group.seed_twenty(page,url); group.launch(page)
    for answers in group.ANS:
        poly.fill(page,answers)
        expect(page.locator('#poly-next')).to_be_visible()
        page.locator('#poly-next').click()
    expect(page.locator('#bridgeContent')).to_have_attribute('data-step','grouping')

def reach_after_reload(page,index):
    poly.launch(page); group.launch(page)
    for stage in STAGES[:index+1]:
        page.locator(stage['entry']).click()

def assert_rejected(page,answers,index,value,fragment):
    invalid=list(answers); invalid[index]=value
    poly.fill(page,invalid)
    expect(page.locator('#poly-feedback')).to_contain_text(fragment)
    expect(page.locator('#poly-next')).to_have_count(0)

# These are the existing school lessons, not a second practice bank.
FOLLOW_UPS = {
    'rational': [
        ('p03','§3 · Сложение и вычитание: одинаковые знаменатели','Сложение и вычитание дробей с одинаковыми знаменателями'),
        ('p04','§4 · Сложение и вычитание: разные знаменатели','Сложение и вычитание дробей с разными знаменателями'),
    ],
    'applications': [
        ('p21','Макарычев 8 · Формула корней и дискриминант','Формула корней квадратного уравнения'),
        ('p23','Макарычев 8 · Теорема Виета','Теорема Виета'),
        ('p25','Макарычев 8 · Разложение квадратного трёхчлена','Разложение квадратного трёхчлена на множители'),
        ('p31','Макарычев 8 · Решение систем','Алгебраический способ решения систем уравнений'),
        ('p33','Макарычев 8 · Уравнения с параметром','Уравнения с параметром'),
    ],
}

def check_follow_ups(page, stage, verify_destination=False):
    for lesson, label, title in FOLLOW_UPS.get(stage['name'], []):
        link = page.locator('#bridgeContent a[href="../school/makarychev8/#lesson/'+lesson+'"]')
        expect(link).to_have_count(1)
        expect(link).to_be_visible()
        expect(link).to_have_text(label)
        if verify_destination:
            target = page.context.new_page()
            try:
                # Navigate to the actual href from the factory, and check the
                # resolved course lesson instead of merely a successful HTTP load.
                response = target.goto(link.evaluate('(a) => a.href'))
                assert response is not None and response.ok, lesson
                expect(target.locator('h1.lesson-title')).to_have_text(title, timeout=15000)
            finally:
                target.close()

EXAM_FOLLOW_UPS = [
    ("ОГЭ №9 · Уравнения", "oge-task9-equations.html", "ОГЭ, задание 9: уравнения по шагам — тренажёр | MathExam", "ОГЭ №9 · Уравнения"),
    ("ОГЭ №13 · Неравенства", "oge13-inequalities-series.html", "ОГЭ №13: неравенства — тренажёр с подсказками | MathExam", "ОГЭ №13. Неравенства"),
    ("ОГЭ №20 · Письменные уравнения", "oge-task20-equations.html", "Задание 20 ОГЭ — тренажёр", "Алгебра"),
    ("ЕГЭ база · Линейные уравнения со скобками", "../ege-baza/path/index.html#lesson=equations-brackets", "Линейные: сначала раскрой скобки · ЕГЭ база", None),
]

def check_exam_follow_ups(page, verify_destination=False):
    for label, href, title, heading in EXAM_FOLLOW_UPS:
        link = page.locator('#bridgeContent a[href="'+href+'"]')
        expect(link).to_have_count(1)
        expect(link).to_be_visible()
        expect(link).to_have_text(label)
        if verify_destination:
            # A separate tab preserves the pupil's existing factory view.
            target = page.context.new_page()
            try:
                response = target.goto(link.evaluate('(a) => a.href'))
                assert response is not None and response.ok, href
                expect(target).to_have_title(title, timeout=15000)
                if heading:
                    assert target.url.endswith('/trainers/'+href), target.url
                    expect(target.locator('h1').first).to_have_text(heading)
                    expect(target.locator('h1').first).to_be_visible()
                else:
                    # The route must resolve to the specific generated family,
                    # not merely to the generic exam map or HTTP 200.
                    expect(target.locator('main h1')).to_have_text('Линейные: сначала раскрой скобки', timeout=15000)
                    expect(target.locator('main h1')).to_be_visible()
                    assert target.url.endswith('/ege-baza/path/index.html#lesson=equations-brackets'), target.url
            finally:
                target.close()

def run(browser,url,width,offline=False):
    with browser.new_context(viewport={'width':width,'height':850},offline=offline) as context:
        context.route('https://**/*',lambda route:route.abort())
        page=context.new_page(); errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        seed_twenty_eight(page,url)
        protected=list(OLD_KEYS)
        before=snapshot(page,protected)
        for stage_index,stage in enumerate(STAGES):
            page.locator(stage['entry']).click()
            for i,(step,answers) in enumerate(zip(stage['ids'],stage['answers'])):
                expect(page.locator('#bridgeContent')).to_have_attribute('data-step',stage['prefix']+step)
                poly.old.check_width(page)
                if i==0:
                    page.locator('#poly-answer-0').fill(answers[0])
                    page.reload(); reach_after_reload(page,stage_index)
                    expect(page.locator('#poly-answer-0')).to_have_value(answers[0])
                    page.get_by_role('button',name='Подсказка',exact=True).click()
                    assert state(page,stage)['records'][step]['hints']==1
                if step=='linear':
                    assert_rejected(page,answers,4,'1 3','Введи точное число')
                if step=='domain':
                    assert_rejected(page,answers,0,'0 4','исходные знаменатели')
                if step=='not-square':
                    assert_rejected(page,answers,0,'10x','Проверь знак')
                if step=='cube-sum':
                    assert_rejected(page,answers,1,'x³+6x²+12x+8','промежуточная сумма')
                if step=='cancel-two-denominator':
                    assert_rejected(page,answers,0,'-3','исходные знаменатели')
                if step=='different-denominators':
                    expect(page.locator('#bridgeContent .bridge-prompt')).to_contain_text('старшим коэффициентом 1 или −1')
                    if width != 1280 or offline:
                        answers=['-2;2','-x-2','-x+2','-4x+4','-x²+4']
                    assert_rejected(page,answers,0,'2','исходные знаменатели')
                    opposite='x²-4' if answers[4]=='-x²+4' else '-x²+4'
                    assert_rejected(page,answers,4,opposite,'Проверь знак')
                if step=='divide-fractions':
                    assert_rejected(page,answers,0,'-2','исходные знаменатели')
                if step=='excluded-root':
                    assert_rejected(page,answers,3,'2','множества корней')
                if step=='negative-inequality':
                    assert_rejected(page,answers,2,'[-1;+∞)','границы')
                if step=='rational-sign':
                    assert_rejected(page,answers,5,'(-∞;-1]∪[2;+∞)','границы')
                    assert_rejected(page,answers,5,'(-∞;-1)∪[0 2;+∞)','границы')
                if step.startswith('independent-'):
                    expect(page.get_by_role('button',name='Подсказка',exact=True)).to_have_count(0)
                poly.fill(page,answers); expect(page.locator('#poly-next')).to_be_visible()
                if step=='different-denominators':
                    assert state(page,stage)['records'][step]['drafts']==answers
                    page.reload(); reach_after_reload(page,stage_index)
                    expect(page.locator('#bridgeContent')).to_have_attribute('data-step',stage['prefix']+step)
                    for field_index,value in enumerate(answers):
                        expect(page.locator('#poly-answer-'+str(field_index))).to_have_value(value)
                    expect(page.locator('#poly-next')).to_be_visible()
                    assert state(page,stage)['records'][step]['done']
                page.locator('#poly-next').click()
            expect(page.locator('#bridgeContent')).to_have_attribute('data-step',stage['name'])
            expect(page.locator('#bridgeContent a[href$="'+stage['link']+'"]')).to_be_visible()
            check_follow_ups(page,stage,verify_destination=(width==1280 and not offline))
            if stage['name']=='applications':
                check_exam_follow_ups(page,verify_destination=(width==1280 and not offline))
            records=state(page,stage)['records']
            assert len(records)==len(stage['ids']) and all(r['done'] for r in records.values())
            assert records[stage['ids'][0]]['first']=='assisted'
            assert all(records[i]['first']=='correct' for i in stage['ids'] if i.startswith('independent-'))
            assert snapshot(page,protected)==before
            page.get_by_role('button',name=stage['back']).click()
            expect(page.locator('#bridgeContent')).to_have_attribute('data-step',stage['parent'])
            page.locator(stage['entry']).click()
            expect(page.locator('#bridgeContent')).to_have_attribute('data-step',stage['name'])
            protected.append(stage['key']); before=snapshot(page,protected)
        assert not errors,errors
    print(f'PASS algebra completion {width}px {"offline" if offline else "HTTP"}: 29 steps, 6 independent checkpoints, exact OДЗ/roots/intervals, old keys, reload and return')

def two_tabs(browser,url):
    stage=STAGES[0]
    with browser.new_context() as context:
        a,b=context.new_page(),context.new_page()
        seed_twenty_eight(a,url); before=snapshot(a,OLD_KEYS);a.locator(stage['entry']).click()
        a.locator('#poly-answer-0').fill('3x')
        b.goto(url+'#brackets');reach_after_reload(b,0)
        expect(b.locator('#poly-answer-0')).to_have_value('3x')
        poly.fill(b,stage['answers'][0]);expect(b.locator('#poly-next')).to_be_visible()
        a.locator('#poly-answer-0').fill('0')
        a.reload();reach_after_reload(a,0)
        assert state(a,stage)['records']['reverse-square']['done']
        expect(a.locator('#poly-answer-0')).to_have_value('3x')
        assert snapshot(a,OLD_KEYS)==before
    print('PASS completion two-tab evidence')

def storage_denial(browser,url):
    stage=STAGES[0]
    with browser.new_context() as context:
        page=context.new_page();seed_twenty_eight(page,url);before=snapshot(page,OLD_KEYS)
        page.evaluate("Object.defineProperty(Storage.prototype,'setItem',{value:function(){throw Error('denied')}})")
        page.locator(stage['entry']).click();page.locator('#poly-answer-0').fill('3x')
        page.get_by_role('button',name=stage['back']).click();page.locator(stage['entry']).click()
        expect(page.locator('#poly-answer-0')).to_have_value('3x')
        poly.fill(page,stage['answers'][0]);expect(page.locator('#poly-next')).to_be_visible()
        assert snapshot(page,OLD_KEYS)==before
    print('PASS completion denied-storage in-session return')

if __name__=='__main__':
    with poly.old.serve_project() as url, sync_playwright() as pw:
        with pw.chromium.launch(executable_path=os.environ.get('CHROMIUM_EXECUTABLE_PATH')) as browser:
            for w in (320,1280):run(browser,url,w)
            run(browser,(ROOT/poly.old.TRAINER).as_uri(),390,True)
            two_tabs(browser,url);storage_denial(browser,url)
