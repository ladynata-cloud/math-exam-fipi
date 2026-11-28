"""Exercise the continuation after the real 13-step brackets route.
Run only after applying the patch to a full checkout. The old browser suite is
reused rather than replacing or weakening it. No pupil data is read.
"""
import importlib.util
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('brackets_regression', ROOT / 'tools/like-terms-factory.browser.py')
old = importlib.util.module_from_spec(spec)
spec.loader.exec_module(old)
KEY = 'likeTermsFactory.polynomials.v1'
OLD = 'likeTermsFactory.brackets.v1'
BASE = 'mathExamCourseProgress.v1'
ANS = [
    ['6x²+2x-1'], ['5ab-3b', '2'], ['-6x²+8x+x²','-5x²+8x'],
    ['3x','2x+3','6x²+9x'], ['4a²b','3a-2b','12a³b-8a²b²'],
    ['5y','-3y+2','-15y²+10y'], ['2x+3','8x²+12x'],
]
IDS = ['standard','degree','distribute','factor','factor-two-letters','independent-factor','independent-area']

def saved(page, key):
    return page.evaluate('(k) => localStorage.getItem(k)', key)

def state(page):
    return page.evaluate('(k) => JSON.parse(localStorage.getItem(k))', KEY)

def fill(page, answers):
    for n, value in enumerate(answers):
        page.locator(f'#poly-answer-{n}').fill(value)
    page.get_by_role('button', name='Проверить', exact=True).click()

def launch(page):
    page.locator('#bridgeToPolynomials').click()

def seed_brackets(page, url):
    page.goto(url)
    page.evaluate('([key, value]) => localStorage.setItem(key, value)', [old.KEY, __import__('json').dumps(old.SEED)])
    page.reload()
    old.play_legacy(page)
    old.play_bridge(page)
    expect(page.locator('#bridgeContent')).to_have_attribute('data-step', 'summary')

def run(browser, url, width, offline=False):
    with browser.new_context(viewport={'width':width,'height':850},offline=offline) as context:
        context.route('https://**/*',lambda route:route.abort())
        page=context.new_page(); errors=[]; page.on('pageerror',lambda e:errors.append(str(e)))
        seed_brackets(page,url); old_keys={k:saved(page,k) for k in [OLD,BASE]}; launch(page)
        fill(page,['6xx+2x-1']); expect(page.locator('#poly-feedback')).to_contain_text('степенью')
        page.get_by_role('button',name='Подсказка',exact=True).click(); expect(page.locator('#poly-feedback')).to_contain_text('Отдельно')
        fill(page,ANS[0]); expect(page.locator('#poly-next')).to_be_visible(); page.locator('#poly-next').click()
        page.locator('#poly-answer-0').fill('5ab-3b'); page.reload(); launch(page)
        expect(page.locator('#poly-answer-0')).to_have_value('5ab-3b'); fill(page,['5ab-3b','3']); expect(page.locator('#poly-feedback')).to_contain_text('степени')
        for i in range(1,len(ANS)):
            expect(page.locator('#bridgeContent')).to_have_attribute('data-step','polynomial-'+IDS[i]); old.check_width(page)
            if IDS[i]=='factor':
                fill(page,['x','6x+9','6x²+9x']); expect(page.locator('#poly-feedback')).to_contain_text('наибольший')
            if i>=5: expect(page.get_by_role('button',name='Подсказка',exact=True)).to_have_count(0)
            fill(page,ANS[i]); expect(page.locator('#poly-next')).to_be_visible(); page.locator('#poly-next').click()
        expect(page.locator('#bridgeContent')).to_contain_text('Итоги: многочлены и общий множитель')
        assert state(page)['records']['standard']['first']=='wrong'
        assert state(page)['records']['standard']['hints']==1
        assert state(page)['records']['independent-area']['first']=='correct'
        assert all(r['done'] for r in state(page)['records'].values())
        assert {k:saved(page,k) for k in [OLD,BASE]}==old_keys
        page.get_by_role('button',name='← Итоги урока о скобках').click()
        expect(page.locator('#bridgeContent')).to_have_attribute('data-step','summary')
        launch(page); expect(page.locator('#bridgeContent')).to_contain_text('Итоги: многочлены')
        assert not errors,errors
    print(f'PASS {width}px {"offline file" if offline else "HTTP"}: 7 steps, hints, errors, reload, checkpoint, old keys, return')

def two_tabs(browser,url):
    with browser.new_context() as context:
        a,b=context.new_page(),context.new_page(); seed_brackets(a,url); launch(a)
        a.locator('#poly-answer-0').fill('6x²+')
        b.goto(url+'#brackets'); launch(b); expect(b.locator('#poly-answer-0')).to_have_value('6x²+')
        fill(b,ANS[0]); expect(b.locator('#poly-next')).to_be_visible()
        a.locator('#poly-answer-0').fill('0'); a.reload(); launch(a)
        assert state(a)['records']['standard']['done']; expect(a.locator('#poly-answer-0')).to_have_value(ANS[0][0])
    print('PASS two-tab completed evidence preservation')

def storage_denial(browser,url):
    with browser.new_context() as context:
        page=context.new_page(); seed_brackets(page,url)
        page.evaluate("Object.defineProperty(Storage.prototype,'setItem',{value:function(){throw Error('denied')}})")
        launch(page); page.locator('#poly-answer-0').fill('6x²+')
        page.get_by_role('button',name='← Итоги урока о скобках').click(); launch(page)
        expect(page.locator('#poly-answer-0')).to_have_value('6x²+')
        fill(page,ANS[0]); expect(page.locator('#poly-next')).to_be_visible()
    print('PASS denied storage in-session return')

if __name__=='__main__':
    with old.serve_project() as url, sync_playwright() as pw:
        with pw.chromium.launch(executable_path=os.environ.get('CHROMIUM_EXECUTABLE_PATH')) as browser:
            for w in (320,1280): run(browser,url,w)
            run(browser,(ROOT/old.TRAINER).as_uri(),390,True)
            two_tabs(browser,url);storage_denial(browser,url)
