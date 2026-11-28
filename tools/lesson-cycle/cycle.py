from playwright.sync_api import sync_playwright
from pathlib import Path
import json, os
root=Path(__file__).resolve().parents[2]/'trainers'/'lesson-cycle'; content=(root/'START.html').read_text()
# Browser receives a deterministic injected storage implementation because real navigation is blocked by environment policy.
def boot(page,store=None,deny=False):
 init='''<script>window.__records=Object.assign(Object.create(null),%s);window.__deny=%s;Object.defineProperty(navigator,'locks',{configurable:true,value:{request(name,options,callback){return Promise.resolve().then(callback)}}});Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem(k){if(window.__deny)throw Error('denied');return Object.hasOwn(window.__records,k)?window.__records[k]:null},setItem(k,v){if(window.__deny)throw Error('denied');window.__records[k]=String(v)}}});</script>'''%(json.dumps(store or {},ensure_ascii=False),str(deny).lower())
 page.set_content(content.replace('<script>',''+init+'<script>',1))

def drained(page):page.wait_for_function("!Object.values(metadata).some(m=>m.pending)")

def confirm(page):page.on('dialog',lambda d:d.accept())

def export(page):
 with page.expect_download() as dl:page.get_by_role('button',name='Выгрузить запись (JSON)').click()
 return json.loads(Path(dl.value.path()).read_text())

def import_(page,payload):
 page.locator('#import-file').set_input_files({'name':'backup.json','mimeType':'application/json','buffer':json.dumps(payload,ensure_ascii=False).encode()}); page.wait_for_function("document.querySelector('#import-status').textContent.length > 0")
 return page.locator('#import-status').inner_text()

with sync_playwright() as pw:
 b=pw.chromium.launch(**({'executable_path':os.environ['CHROMIUM_EXECUTABLE_PATH']} if os.getenv('CHROMIUM_EXECUTABLE_PATH') else {}),headless=True,args=['--no-sandbox'])
 for width in (320,390,1280):
  c=b.new_context(viewport={'width':width,'height':800},offline=True,accept_downloads=True);page=c.new_page(); confirm(page);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));boot(page)
  home=page.locator('[data-mathexam-home-link]');home.scroll_into_view_if_needed();box=home.bounding_box();assert box and box['x']>=0 and box['y']>=0 and box['x']+box['width']<=width+1 and box['height']>=44,box
  assert home.get_attribute('href')=='/' and home.get_attribute('target')=='_self'
  for tid in ('area','prob','rate','motion'):
   page.select_option('#topic',tid)
   assert page.locator('#screen h2').inner_text()=='Вход А' and page.locator('#nav button').nth(4).is_disabled()
   page.locator('#answer-0-0').fill(tid+' первая запись');page.select_option('#topic','prob' if tid=='area' else 'area');page.select_option('#topic',tid)
   assert page.locator('#answer-0-0').input_value()==tid+' первая запись'
   page.get_by_role('button',name='Зафиксировать первую запись').click();page.locator('#answer-1-0').fill('смысл');page.get_by_role('button',name='Завершить этап').click()
   assert page.locator('#screen a').get_attribute('href').startswith('https://mathexam.space/')
   page.locator('#answer-2-0').fill('прогноз');page.locator('#answer-2-1').fill('вывод');page.get_by_role('button',name='Завершить этап').click()
   page.locator('#answer-3-0').fill('решение до помощи');page.get_by_role('button',name='Зафиксировать первую запись').click();page.locator('#nav button').nth(3).click();assert page.locator('#answer-3-0').get_attribute('readonly') is not None
   page.locator('#revision').fill('исправление');page.get_by_role('button',name='Следующий этап').click();page.locator('#answer-4-0').fill('выход');page.get_by_role('button',name='Зафиксировать первую запись').click()
   assert (root/page.locator('#screen a').get_attribute('href')).is_file();page.get_by_role('button',name='Отметить получение задания').click();assert page.locator('#answer-6-0').count()==0
   page.get_by_role('button',name='Начать повторную проверку').click();page.locator('#answer-6-0').fill('перенос');page.get_by_role('button',name='Зафиксировать повторную попытку').click();assert '7 из 7' in page.locator('#progress').inner_text()
   rec=export(page);assert rec['module']==tid and rec['schema'].endswith('v2') and rec['stages'][0]['firstRecord'][0]==tid+' первая запись' and rec['stages'][3]['firstRecord'][0]=='решение до помощи' and rec['practiceRevision']=='исправление';assert page.evaluate('document.documentElement.scrollWidth <= innerWidth');drained(page);assert 'актуальна' in page.locator('#storage').inner_text();assert not page.locator('#reload').is_visible()
  drained(page);stored=page.evaluate('window.__records'); assert len(stored)==4
  page.close();page=c.new_page();confirm(page);boot(page,stored)
  for tid in ('area','prob','rate','motion'):
   page.select_option('#topic',tid);assert '7 из 7' in page.locator('#progress').inner_text();assert export(page)['stages'][0]['firstRecord'][0]==tid+' первая запись'
  page.select_option('#topic','area');page.get_by_role('button',name='Начать заново только эту тему').click();drained(page);assert '0 из 7' in page.locator('#progress').inner_text();page.select_option('#topic','prob');assert '7 из 7' in page.locator('#progress').inner_text();assert not errors,errors
  print(f'PASS {width}px: 4 routes, simulated persistence, isolation, export and reset');c.close()
 # Recovery and failure paths
 c=b.new_context(offline=True,accept_downloads=True);p=c.new_page();confirm(p);boot(p,deny=True);p.locator('#answer-0-0').fill('резерв');p.get_by_role('button',name='Зафиксировать первую запись').click();r=export(p);assert 'недоступно' in p.locator('#storage').inner_text();p.close();p=c.new_page();confirm(p);boot(p);assert 'восстановлена' in import_(p,r);assert p.locator('#screen h2').inner_text()=='Объяснение';assert export(p)['stages'][0]['firstRecord'][0]=='резерв';p.locator('#import-status').evaluate('(e)=>e.textContent=""');assert 'отклонён' in import_(p,r);p.close()
 # wrong module & invalid shape
 p=c.new_page();confirm(p);boot(p);p.select_option('#topic','prob');assert 'соответствующую тему' in import_(p,r);p.select_option('#topic','area');p.locator('#import-status').evaluate('(e)=>e.textContent=""');broken=json.loads(json.dumps(r));broken['backupState']['locked']['0'][0]='fake';assert 'формат резервной записи' in import_(p,broken).lower();assert '0 из 7' in p.locator('#progress').inner_text();p.close()
 # corruption cannot be silently overwritten
 k='mathexam:lesson-cycle-pilot:v2:area';p=c.new_page();confirm(p);boot(p,{k:'broken'});p.locator('#answer-0-0').fill('new');drained(p);assert p.evaluate('window.__records',)['mathexam:lesson-cycle-pilot:v2:area']=='broken';assert 'повреждена' in p.locator('#storage').inner_text();p.get_by_role('button',name='Начать заново только эту тему').click();assert p.locator('#answer-0-0').input_value()=='new';p.close()
 # Simulate sequential stale-tab conflict via different storage value and event.
 p=c.new_page();confirm(p);boot(p);p.locator('#answer-0-0').fill('первая вкладка');drained(p);other=p.evaluate('JSON.parse(window.__records["'+k+'"])');other['drafts']['0:0']='другая вкладка';p.evaluate('([k,r])=>{window.__records[k]=r;dispatchEvent(new StorageEvent("storage",{key:k,newValue:r}))}',[k,json.dumps(other,ensure_ascii=False)]);assert 'другой вкладке' in p.locator('#storage').inner_text();p.locator('#answer-0-0').fill('несохранённое');assert json.loads(p.evaluate('window.__records')[''+k])['drafts']['0:0']=='другая вкладка';assert export(p)['backupState']['drafts']['0:0']=='несохранённое';p.get_by_role('button',name='Загрузить сохранённую запись').click();assert p.locator('#answer-0-0').input_value()=='другая вкладка';print('PASS recovery: export/import, refusal for nonempty/wrong/invalid records, denied storage, corruption and sequential conflict');c.close();b.close()
