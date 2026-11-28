"""Third stage of the existing factory. Seed the real preceding 20 steps."""
import importlib.util
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('polynomial_regression', ROOT / 'tools/like-terms-factory-polynomials.browser.py')
poly = importlib.util.module_from_spec(spec)
spec.loader.exec_module(poly)
KEY = 'likeTermsFactory.grouping.v1'
OLD_KEYS = [poly.BASE, poly.OLD, poly.KEY]
IDS = ['multiply','common-binomial','opposite','independent-grouping','square-sum','square-difference','conjugates','independent-squares']
ANS = [
    ['x²+5x+2x+10','x²+7x+10'],
    ['3a','5','x+2','3a+5','3ax+6a+5x+10'],
    ['-5','2a-5','x-3','2ax-6a-5x+15'],
    ['15x+10y','4xy+6x²','2x+5','3x+2y'],
    ['x²+3x+3x+9','x²+6x+9'],
    ['4x²-6x-6x+9','4x²-12x+9'],
    ['4x²+6x-6x-9','4x²-9'],
    ['2x+5','2x-5','4x²-10x+10x-25','4x²-25'],
]

def state(page):
    return page.evaluate('(k) => JSON.parse(localStorage.getItem(k))',KEY)

def snapshot(page):
    return {k:poly.saved(page,k) for k in OLD_KEYS}

def launch(page):
    page.locator('#polyToGrouping').click()

def seed_twenty(page,url):
    poly.seed_brackets(page,url)
    poly.launch(page)
    for answers in poly.ANS:
        poly.fill(page,answers)
        expect(page.locator('#poly-next')).to_be_visible()
        page.locator('#poly-next').click()
    expect(page.locator('#bridgeContent')).to_have_attribute('data-step','polynomials')

def run(browser,url,width,offline=False):
    with browser.new_context(viewport={'width':width,'height':850},offline=offline) as context:
        context.route('https://**/*',lambda route:route.abort())
        page=context.new_page(); errors=[]; page.on('pageerror',lambda e:errors.append(str(e)))
        seed_twenty(page,url); before=snapshot(page); launch(page)
        for i,step in enumerate(IDS):
            expect(page.locator('#bridgeContent')).to_have_attribute('data-step','grouping-'+step)
            poly.old.check_width(page)
            if step in ('multiply','square-sum'):
                expect(page.get_by_role('table',name='Четыре произведения')).to_be_visible()
                expect(page.get_by_role('table',name='Четыре произведения').locator('td')).to_have_count(4)
            if step=='multiply':
                poly.fill(page,['x²+7x+10','x²+7x+10'])
                expect(page.locator('#poly-feedback')).to_contain_text('промежуточная сумма')
                page.get_by_role('button',name='Подсказка',exact=True).click()
                expect(page.locator('#poly-feedback')).to_contain_text('Каждый член')
            if step=='common-binomial':
                page.locator('#poly-answer-0').fill('3a')
                page.reload(); poly.launch(page); launch(page)
                expect(page.locator('#poly-answer-0')).to_have_value('3a')
            if step=='opposite':
                poly.fill(page,['5','2a-5','x-3','2ax-6a-5x+15'])
                expect(page.locator('#poly-feedback')).to_contain_text('Новый множитель')
            if step=='square-sum':
                poly.fill(page,['x²+9','x²+9'])
                expect(page.locator('#poly-feedback')).to_contain_text('Проверь знак')
            if step.startswith('independent-'):
                expect(page.get_by_role('button',name='Подсказка',exact=True)).to_have_count(0)
            poly.fill(page,ANS[i])
            expect(page.locator('#poly-next')).to_be_visible()
            page.locator('#poly-next').click()
        expect(page.locator('#bridgeContent')).to_have_attribute('data-step','grouping')
        expect(page.locator('#bridgeContent')).to_contain_text('Итоги: группировка и первые формулы')
        expect(page.locator('#bridgeContent a[href$="formuly-sokrashchennogo-umnozheniya.html"]')).to_be_visible()
        assert all(r['done'] for r in state(page)['records'].values())
        assert state(page)['records']['multiply']['first']=='wrong'
        assert state(page)['records']['multiply']['hints']==1
        assert state(page)['records']['independent-grouping']['first']=='correct'
        assert state(page)['records']['independent-squares']['first']=='correct'
        assert snapshot(page)==before
        page.get_by_role('button',name='← Итоги урока о многочленах').click()
        expect(page.locator('#bridgeContent')).to_have_attribute('data-step','polynomials')
        launch(page); expect(page.locator('#bridgeContent')).to_have_attribute('data-step','grouping')
        assert not errors,errors
    print(f'PASS grouping {width}px {"offline" if offline else "HTTP"}: 8 steps, area tables, alternative groups, signs, no-hint transfer, old keys')

def two_tabs(browser,url):
    with browser.new_context() as context:
        a,b=context.new_page(),context.new_page()
        seed_twenty(a,url); before=snapshot(a); launch(a)
        a.locator('#poly-answer-0').fill('x²+')
        b.goto(url+'#brackets'); poly.launch(b); launch(b)
        expect(b.locator('#poly-answer-0')).to_have_value('x²+')
        poly.fill(b,ANS[0]); expect(b.locator('#poly-next')).to_be_visible()
        a.locator('#poly-answer-0').fill('0')
        a.reload(); poly.launch(a); launch(a)
        assert state(a)['records']['multiply']['done']
        expect(a.locator('#poly-answer-0')).to_have_value(ANS[0][0])
        assert snapshot(a)==before
    print('PASS grouping two-tab completed evidence')

def storage_denial(browser,url):
    with browser.new_context() as context:
        page=context.new_page(); seed_twenty(page,url); before=snapshot(page)
        page.evaluate("Object.defineProperty(Storage.prototype,'setItem',{value:function(){throw Error('denied')}})")
        launch(page); page.locator('#poly-answer-0').fill('x²+')
        page.get_by_role('button',name='← Итоги урока о многочленах').click(); launch(page)
        expect(page.locator('#poly-answer-0')).to_have_value('x²+')
        poly.fill(page,ANS[0]); expect(page.locator('#poly-next')).to_be_visible()
        assert snapshot(page)==before
    print('PASS grouping denied-storage in-session return')

if __name__=='__main__':
    with poly.old.serve_project() as url, sync_playwright() as pw:
        with pw.chromium.launch(executable_path=os.environ.get('CHROMIUM_EXECUTABLE_PATH')) as browser:
            for w in (320,1280): run(browser,url,w)
            run(browser,(ROOT/poly.old.TRAINER).as_uri(),390,True)
            two_tabs(browser,url); storage_denial(browser,url)
