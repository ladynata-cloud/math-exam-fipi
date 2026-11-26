"""Real-origin acceptance test. Run from a clean candidate checkout with Playwright
and Chromium installed. No injected storage or lock manager; serves only the
checkout on loopback. Failure to navigate is a failed/unavailable gate, not PASS.
"""
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
from tempfile import TemporaryDirectory
from playwright.sync_api import sync_playwright
import json, os
ROOT = Path(__file__).resolve().parents[2]
KEY = 'mathexam:lesson-cycle-pilot:v2:area'
class Handler(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
server = ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
origin=f'http://127.0.0.1:{server.server_port}'
url=origin+'/trainers/lesson-cycle/START.html?topic=area'
def drain(p): p.wait_for_function('!Object.values(metadata).some(m=>m.pending)')
def boot(p):
    p.goto(url);p.wait_for_function('typeof navigator.locks?.request === "function" && isSecureContext');p.wait_for_selector('#answer-0-0')
    p.on('dialog',lambda d:d.accept())
def downloaded(p):
    with p.expect_download() as dl:p.locator('#export').click()
    return json.loads(Path(dl.value.path()).read_text())
try:
  with sync_playwright() as pw, TemporaryDirectory() as profile:
    opts=dict(headless=True,accept_downloads=True,viewport={'width':390,'height':800})
    if os.getenv('CHROMIUM_EXECUTABLE_PATH'):opts['executable_path']=os.environ['CHROMIUM_EXECUTABLE_PATH']
    def context():
        c=pw.chromium.launch_persistent_context(profile,**opts)
        c.route('**/*',lambda r:r.continue_() if r.request.url.startswith(origin+'/') else r.abort())
        return c
    c=context(); a=c.new_page();b=c.new_page();guard=c.new_page();boot(a);boot(b);boot(guard)
    guard.evaluate('(key)=>{window.held=navigator.locks.request(key,()=>new Promise(resolve=>window.release=resolve));}',KEY)
    guard.wait_for_function('typeof window.release === "function"')
    a.locator('#answer-0-0').fill('первая вкладка');b.locator('#answer-0-0').fill('вторая вкладка')
    a.wait_for_function('mode(data.id).pending>0');b.wait_for_function('mode(data.id).pending>0')
    guard.evaluate('window.release()');drain(a);drain(b)
    assert sorted([a.evaluate('mode(data.id).status'),b.evaluate('mode(data.id).status')])==['conflict','ok']
    winner=a if a.evaluate('mode(data.id).status')=='ok' else b;loser=b if winner is a else a
    winner_text=winner.locator('#answer-0-0').input_value();loser_text=loser.locator('#answer-0-0').input_value()
    assert winner_text!=loser_text;assert downloaded(loser)['backupState']['drafts']['0:0']==loser_text
    assert winner.evaluate('(key)=>JSON.parse(localStorage.getItem(key)).drafts["0:0"]',KEY)==winner_text
    print('PASS real concurrent Web Locks: winner durable, losing draft export intact',flush=True)
    winner.get_by_role('button',name='Зафиксировать первую запись').click();drain(winner);c.close()
    c=context(); p=c.new_page();p.goto(url);p.wait_for_selector('#screen h2');assert p.locator('#screen h2').inner_text()=='Объяснение';assert downloaded(p)['backupState']['locked']['0'][0]==winner_text
    print('PASS persistent profile restart and immutable first record',flush=True)
    home=p.locator('[data-mathexam-home-link]');assert home.count()==1 and home.get_attribute('href')=='/' and home.get_attribute('target')=='_self'
    before_pages=tuple(c.pages)
    home.click();p.wait_for_url(origin+'/')
    assert tuple(c.pages)==before_pages, 'home navigation must retain exactly the pre-existing pages'
    print('PASS same-tab home navigation without opening additional tabs',flush=True)
    # Verify actual host integration in the exact checkout, not just snippets.
    p.goto(origin+'/trainers/oge-written-practice.html#area-workshop');area=p.locator('[data-mathexam-lesson-cycle="area"]');area.wait_for(state='visible');p.locator('#area-transfer-open').click();area.wait_for(state='hidden')
    p.goto(origin+'/trainers/oge-written-practice.html#area-transfer');p.locator('#area-step-title').wait_for();assert not p.locator('[data-mathexam-lesson-cycle="area"]:visible').count()
    p.goto(origin+'/trainers/tyurin-statistics/?lab=condition#lesson/114-10');p.locator('[data-mathexam-lesson-cycle="prob"]').wait_for(state='visible')
    p.goto(origin+'/trainers/college-functions/');p.locator('#learn-mode').click();rate=p.locator('[data-mathexam-lesson-cycle="rate"]');rate.wait_for(state='visible');p.locator('#test-mode').click();rate.wait_for(state='hidden')
    p.goto(origin+'/trainers/college-functions/?board=1');p.locator('#open-rate-lab').wait_for(state='attached');assert not p.locator('[data-mathexam-lesson-cycle="rate"]:visible').count()
    p.goto(origin+'/trainers/motion-grade6/#model');motion=p.locator('[data-mathexam-lesson-cycle="motion"]');motion.wait_for(state='attached');assert motion.locator('a').get_attribute('href')==origin+'/trainers/lesson-cycle/START.html?topic=motion'
    c.close()
    # Local file version must not navigate to the filesystem root. It is tested
    # independently of the origin's persistence; no network is required.
    browser=pw.chromium.launch(**{k:v for k,v in opts.items() if k in ('headless','executable_path')})
    # A genuine downloaded backup must restore every legal long field,
    # including the immutable first records and the separate correction.
    source=browser.new_context(viewport={'width':390,'height':800},accept_downloads=True)
    source.route('**/*',lambda r:r.continue_() if r.request.url.startswith(origin+'/') else r.abort())
    p=source.new_page();boot(p)
    counts=[3,1,2,1,3,1,1];expected={}
    for i,count in enumerate(counts):
        if i==6:p.get_by_role('button',name='Начать повторную проверку').click()
        for j in range(count):
            value='\\'*11994+f'{i}:{j:04d}'
            assert len(value)==12000
            p.locator(f'#answer-{i}-{j}').fill(value)
            expected[f'{i}:{j}']=value
        p.locator('#screen button.primary').click()
        if i==3:
            p.locator('#nav button').nth(3).click()
            expected['revision']='\\'*11999+'R'
            p.locator('#revision').fill(expected['revision'])
            p.get_by_role('button',name='Следующий этап').click()
    drain(p)
    assert p.evaluate('mode(data.id).status')=='ok'
    with p.expect_download() as dl:p.locator('#export').click()
    raw=Path(dl.value.path()).read_bytes();payload=json.loads(raw);record=payload['backupState']
    assert record['done']==[True]*7 and record['drafts']==expected
    assert all(record['locked'][str(i)]==[expected[f'{i}:{j}'] for j in range(n)] for i,n in enumerate(counts))
    assert payload['practiceRevision']==expected['revision']
    assert len(json.dumps(record,ensure_ascii=False,separators=(',',':')))>420000
    assert len(raw)<=p.evaluate('MAX_BACKUP_BYTES')
    for denied in (False,True):
        target=browser.new_context(viewport={'width':390,'height':800},accept_downloads=True)
        target.route('**/*',lambda r:r.continue_() if r.request.url.startswith(origin+'/') else r.abort())
        if denied:
            target.add_init_script("const originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k.startsWith('mathexam:lesson-cycle-pilot:v2:'))throw new DOMException('test quota','QuotaExceededError');return originalSetItem.call(this,k,v)}")
        q=target.new_page();boot(q)
        q.locator('#import-file').set_input_files({'name':'long-backup.json','mimeType':'application/json','buffer':raw})
        q.wait_for_function("document.querySelector('#import-status').textContent.includes('восстановлена')")
        drain(q)
        assert downloaded(q)['backupState']==record
        assert q.evaluate('mode(data.id).status')==('unavailable' if denied else 'ok')
        if denied:
            assert q.evaluate('(k)=>localStorage.getItem(k)',KEY) is None
        else:
            q.reload();q.wait_for_function("state.done.every(Boolean)")
            assert downloaded(q)['backupState']==record
        target.close()
    source.close()
    print('PASS real large file export/import, restart, immutable records and simulated quota-denied memory recovery',flush=True)
    offline=browser.new_context(offline=True);p=offline.new_page()
    p.goto((ROOT/'trainers/lesson-cycle/START.html').as_uri());p.wait_for_selector('#screen h2')
    home=p.locator('[data-mathexam-home-link]');assert home.get_attribute('href')=='https://mathexam.space/' and home.get_attribute('target')=='_self'
    assert p.locator('#screen h2').inner_text()=='Вход А'
    assert p.evaluate('document.documentElement.scrollWidth <= innerWidth')
    offline.close();browser.close()
    print('PASS native HTTP/file: true concurrent Web Locks, losing draft backup, persistent restart, same-tab home, actual four host entries, local file fallback')
finally:
 server.shutdown();server.server_close()
