#!/usr/bin/env python3
"""Synthetic learner audit. No student accounts, production writes or answer-key solving.
Run with Python 3.11+, Playwright; --math-only needs only the standard library.
Browser expectations are calculated from statements; debug state is observation only.
"""
from __future__ import annotations
import argparse, ast, functools, hashlib, json, math, re, subprocess, threading, traceback
from decimal import Decimal
from fractions import Fraction
from html.parser import HTMLParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

DIV = 'trainers/oge-basics/multiplication-division/long-division-from-simple-to-decimals.html'
BASIC = 'trainers/oge-basics/'
KEY = 'mathExamBasics.guidedDivision.v1'
GEOM = 'trainers/oge-task15-triangles.html'
SHARED = 'mathExamCourseProgress.v1'
TID = 'oge-t15-treugolniki'
NUM = r'-?\d+(?:[.,]\d+)?'

def frac(value):
    return Fraction(str(value).replace(',', '.').replace('−', '-'))

def fmt(value):
    f = Fraction(value)
    d = f.denominator
    for p in (2, 5):
        while d % p == 0:
            d //= p
    if d != 1:
        return str(f)
    return format(Decimal(f.numerator) / Decimal(f.denominator), 'f').rstrip('0').rstrip('.') if f.denominator != 1 else str(f.numerator)

class Tree(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.root = {'tag': 'root', 'attrs': {}, 'children': []}
        self.stack = [self.root]
        self.feed(source)
    def handle_starttag(self, tag, attrs):
        n = {'tag': tag, 'attrs': dict(attrs), 'children': []}
        self.stack[-1]['children'].append(n)
        if tag not in {'br', 'img', 'input', 'hr', 'meta', 'link'}:
            self.stack.append(n)
    def handle_endtag(self, tag):
        for i in range(len(self.stack)-1, 0, -1):
            if self.stack[i]['tag'] == tag:
                del self.stack[i:]
                return
    def handle_data(self, data):
        self.stack[-1]['children'].append(data)

def expr(node):
    if isinstance(node, str):
        return node.replace('−','-').replace('·','*').replace('×','*').replace(':','/').replace(',','.')
    children = node['children']
    cls = node['attrs'].get('class', '').split()
    if 'f' in cls:
        def part(c):
            return next(x for x in children if isinstance(x,dict) and c in x['attrs'].get('class','').split())
        return '(('+expr(part('fn'))+')/('+expr(part('fd'))+'))'
    if 'mx' in cls:
        return '('+'+'.join(expr(x) for x in children if not isinstance(x,str) or x.strip())+')'
    if node['tag'] == 'sup':
        return '**('+''.join(expr(x) for x in children)+')'
    return ''.join(expr(x) for x in children)

def evaluate(expression):
    """Only rational arithmetic, never eval() of supplied HTML or code."""
    tree = ast.parse(expression.strip(), mode='eval')
    def visit(n):
        if isinstance(n, ast.Constant) and type(n.value) in (int,float):
            return frac(ast.get_source_segment(expression.strip(), n))
        if isinstance(n,ast.UnaryOp):
            a=visit(n.operand)
            if isinstance(n.op,ast.USub): return -a
            if isinstance(n.op,ast.UAdd): return a
        if isinstance(n,ast.BinOp):
            a,b=visit(n.left),visit(n.right)
            if isinstance(n.op,ast.Add): return a+b
            if isinstance(n.op,ast.Sub): return a-b
            if isinstance(n.op,ast.Mult): return a*b
            if isinstance(n.op,ast.Div): return a/b
            if isinstance(n.op,ast.Pow) and b.denominator==1 and abs(b)<=20: return a**int(b)
        raise ValueError('Unsupported arithmetic syntax: '+ast.dump(n))
    return visit(tree.body)

def fraction_html(source):
    return evaluate(expr(Tree(source).root))

def bank(root):
    s=(root/'trainers/oge-task6-fractions.html').read_text(encoding='utf-8-sig')
    m=re.search(r'const\s+TASKS\s*=\s*',s)
    if not m: raise ValueError('Task-6 bank format changed')
    return json.JSONDecoder().raw_decode(s[m.end():])[0]

class Audit:
    def __init__(self, root, out):
        self.root, self.out = root, out
        self.results=[]
        out.mkdir(parents=True,exist_ok=True)
    def run(self, name, fn):
        try:
            detail=fn()
            self.results.append({'name':name,'status':'PASS','detail':detail})
        except Exception as e:
            self.results.append({'name':name,'status':'FAIL','error':str(e),'trace':traceback.format_exc()})
        print(self.results[-1]['status'],name,flush=True)
    def save(self):
        data={'synthetic':True,'real_pupils_tested':False,'results':self.results}
        (self.out/'results.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
        return sum(r['status']=='FAIL' for r in self.results)

def math_bank(root):
    tasks=bank(root); failures=[]
    for i,t in enumerate(tasks):
        try:
            got=fraction_html(t['html']); expected=Fraction(t['n'],t['d'])
            if got!=expected: failures.append({'index':i,'computed':str(got),'bank':str(expected)})
        except Exception as e: failures.append({'index':i,'error':str(e)})
    assert not failures, json.dumps(failures,ensure_ascii=False)
    return {'expressions_checked':len(tasks),'method':'HTML expression → restricted AST → exact Fraction'}

def math_division(root):
    core=root/'trainers/oge-basics/multiplication-division/division-guided-core.js'
    code="const G=require(process.argv[1]);const out=[];for(const t of G.topics)for(let i=0;i<64;i++){const x=G.make(t.id,i),p=G.plan(x);out.push({task:x,q:p.quotient,r:p.remainder});}console.log(JSON.stringify(out));"
    rows=json.loads(subprocess.check_output(['node','-e',code,str(core)],text=True,timeout=45))
    for row in rows:
        t=row['task']; a,b=frac(t['dividend']),frac(t['divisor']); q=frac(row['q'])
        got=q*b+(frac(row['r']) if t['level']=='remainder' else 0)
        assert got==a, str(row)
    return {'tasks_checked':len(rows),'method':'q × divisor + remainder = original dividend, exact rational arithmetic'}

class DivisionLearner:
    """Learner's own written-division working memory; never reads planner answers."""
    def __init__(self,a,b,remainder=False):
        self.a,self.b=frac(a),frac(b); self.remainder_mode=remainder
        self.shift=len(b.split(',')[1]) if ',' in b else len(b.split('.')[1]) if '.' in b else 0
        self.na,self.nb=fmt(self.a*10**self.shift),int(self.b*10**self.shift)
        integer=self.na.split('.')[0]
        self.prefix=integer[0]; self.end=0
        while int(self.prefix)<self.nb and self.end<len(integer)-1:
            self.end+=1;self.prefix=integer[:self.end+1]
        self.count=len(integer)-self.end
        self.digits=self.na.replace('.','');self.next_index=self.end+1
        self.rem=0;self.brought=0
    def answer(self,label,prompt):
        n=[frac(x) for x in re.findall(NUM,prompt)]
        if label=='Готовим делитель': return str(self.shift)
        if label=='Меняем оба числа одинаково': return str(10**self.shift)
        if label=='Меняем делитель': return str(self.nb)
        if label=='Меняем делимое': return self.na
        if label=='Первое неполное делимое': return self.prefix
        if label=='Намечаем места для ответа': return str(self.count)
        if label=='Находим цифру ответа': return str(int(n[1]//n[0]))
        if label=='Умножаем': return fmt(n[0]*n[1])
        if label=='Вычитаем': self.rem=int(n[0]-n[1]);return str(self.rem)
        if label=='Проверяем остаток': return 'да' if n[0]<n[1] else 'нет'
        if label=='Сносим одну цифру':
            self.brought=int(self.digits[self.next_index]) if self.next_index<len(self.digits) else 0
            self.next_index+=1;return str(self.brought)
        if label=='Читаем новое неполное делимое': return str(self.rem*10+self.brought)
        if label=='Ставим запятую': return str(int(self.a//self.b))+','
        if label=='Читаем ответ': return str(int(self.a//self.b)) if self.remainder_mode else fmt(self.a/self.b)
        if label=='Записываем остаток': return fmt(self.a%self.b)
        if label=='Проверяем решение': return fmt(self.a)
        raise ValueError('Unrecognized visible step: '+label+' | '+prompt)

def snapshot(page):
    return page.evaluate('() => window.__divisionGuidedDebug.state()')

def division_run(page,url,topic,persona,out,label):
    page.goto(url+'#'+topic);page.wait_for_function('window.__divisionGuidedDebug')
    s=snapshot(page); cur=s['sessions'][s['active']];t=cur['task']
    robot=DivisionLearner(t['dividend'],t['divisor'],t['level']=='remainder')
    injected=False; saved_rows=0
    for _ in range(240):
        all_state=snapshot(page);cur=all_state['sessions'][all_state['active']]
        if cur['done']: break
        if cur['accepted']:
            page.locator('#primary').click();continue
        step=page.locator('#step-name').inner_text();prompt=page.locator('#prompt').inner_text()
        answer=robot.answer(step,prompt)
        if not injected and step=='Находим цифру ответа':
            injected=True
            if persona=='wrong':
                page.locator('#answer').fill('99');page.locator('#primary').click()
                z=snapshot(page)['sessions'][topic]
                assert not z['accepted'] and z['errors']==1 and z['hints']==0
            if persona in ('hint','reveal'):
                page.locator('#help-toggle').click()
                if persona=='reveal': page.locator('#reveal').click()
            if persona=='return':
                page.locator('#answer').fill('7');before=snapshot(page);page.reload();page.wait_for_function('window.__divisionGuidedDebug')
                assert snapshot(page)==before,'Interruption lost the current step or draft'
            if persona=='table':
                page.locator('#answer').fill('7');before=snapshot(page)['sessions'][topic]
                page.locator('#multiplication-refresh').click()
                multiplication=[int(x) for x in re.findall(r'\d+',page.locator('.mr-question').inner_text())]
                page.locator('.mr-help').click()
                page.locator('.mr-answer').fill(str(multiplication[0]*multiplication[1]));page.locator('.mr-check').click()
                assert 'Верно' in page.locator('.mr-feedback').inner_text()
                page.locator('.mr-return').click()
                after=snapshot(page)['sessions'][topic]
                assert after['step']==before['step'] and after['draft']==before['draft'] and after['answers']==before['answers'],'Table lost division work'
        if step=='Готовим делитель':
            for _ in range(int(answer)): page.locator('.ds-forward').click()
            values=page.locator('.ds-handle').evaluate_all('(els)=>els.map(e=>Number(e.getAttribute("aria-valuenow")))')
            assert values==[int(answer),int(answer)],'Commas did not move together'
            assert 'делител' in page.locator('#prompt').inner_text().lower(),'Purpose of shift is missing'
        elif step=='Проверяем остаток': page.locator('[data-option="'+answer+'"]').click()
        else: page.locator('#answer').fill(answer)
        page.locator('#primary').click()
        z=snapshot(page)['sessions'][topic]
        assert z['accepted'] or z['done'],step+': correct answer rejected: '+answer
        rows=len(z['answers']);assert rows>=saved_rows,'Previous accepted steps disappeared';saved_rows=rows
    else: raise AssertionError('Division did not finish in 240 actions')
    records=snapshot(page)['records']; r=records[-1]
    assert r['topic']==topic and len(records)==1
    if persona=='hint': assert r['hints']>0
    if persona=='reveal': assert r['reveals']>0
    if persona=='wrong': assert r['errors']>0 and r['hints']==0
    if persona=='careful': assert not any(r[k] for k in ['errors','hints','reveals'])
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),'Horizontal page overflow'
    page.screenshot(path=str(out/(label+'.png')),full_page=True)
    before=snapshot(page);page.reload();page.wait_for_function('window.__divisionGuidedDebug')
    assert snapshot(page)==before,'Completion not restored after reload'
    return {'original':[t['dividend'],t['divisor']],'computed':fmt(robot.a/robot.b),'record':r,'steps':saved_rows}

def basic_answer(prompt,options):
    ns=[int(x) for x in re.findall(r'\d+',prompt)]
    fs=[Fraction(int(a),int(b)) for a,b in re.findall(r'(\d+)\s*/\s*(\d+)',prompt)]
    if 'общий знаменатель' in prompt: return str(math.lcm(*(f.denominator for f in fs)))
    if 'Приведите' in prompt: return str(int(Fraction(ns[0],ns[1])*ns[2]))
    if 'Вычислите' in prompt: return str(sum(fs,Fraction(0)))
    if 'Сократите' in prompt: return str(fs[0])
    if 'пропуск' in prompt: return str(int(Fraction(ns[0],ns[1])*ns[2]))
    if 'всех равных частей' in prompt: return str(ns[1])
    if 'больше' in prompt: return max(options,key=frac)
    raise ValueError('Unrecognized basic task: '+prompt)

def basic_submit(page,prefix,button,wrong=False):
    prompt=page.locator('#'+prefix+'Prompt').inner_text()
    zone=page.locator('#'+prefix+'Answer');choices=zone.locator('button')
    options=choices.all_text_contents() if choices.count() else []
    answer=basic_answer(prompt,options)
    if choices.count():
        target=next(i for i,x in enumerate(options) if x.strip()==answer.strip())
        if wrong: target=(target+1)%len(options)
        choices.nth(target).click()
    else: zone.locator('input').fill('999999' if wrong else answer)
    page.locator('#'+button).click()
    return prompt

def basics_route(page,url,out,label):
    page.goto(url)
    page.locator('.nav [data-route="check"]').click()
    for _ in range(5): basic_submit(page,'check','checkNext',wrong=True)
    assert page.locator('#resultScore').inner_text()=='0/5'
    page.locator('.nav [data-route="learn"]').click()
    assert page.locator('#lessonContent').inner_text().strip()
    page.locator('.nav [data-route="practice"]').click()
    seen=[]
    for i in range(3):
        seen.append(basic_submit(page,'practice','checkTask'))
        if i<2: page.locator('#nextTask').click()
    records=page.evaluate('() => Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith("mathExamBasics.")).map(k=>[k,JSON.parse(localStorage.getItem(k))]))')
    assert any(v.get('independent')==3 for v in records.values()),'Three clean answers were not recorded'
    page.locator('.nav [data-route="check"]').click()
    for _ in range(5): basic_submit(page,'check','checkNext')
    assert page.locator('#resultScore').inner_text()=='5/5'
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),'Basic route overflows phone'
    page.screenshot(path=str(out/(label+'.png')),full_page=True)
    return {'diagnostic':'0/5','practice':seen,'final':'5/5','three_distinct_prompts':len(set(seen))==3}

def basics_help(page,url,kind):
    page.goto(url);page.locator('.nav [data-route="practice"]').click()
    if kind=='hint':
        page.locator('#hint1').click();basic_submit(page,'practice','checkTask')
        saved=page.evaluate('() => JSON.parse(localStorage.getItem("mathExamBasics.fraction-common-denominator.v1"))')
        assert saved['independent']==0 and saved['supported']==1,'Hint credited as independent'
    else:
        page.locator('#solutionBtn').click()
        assert page.locator('#checkTask').is_hidden(),'Reveal still leaves check active'
        assert page.locator('#practiceAnswer input').is_disabled()
    return {'help_mode':kind}

def task6_run(page,url,persona,out,label):
    page.goto(url);page.locator('#ans').wait_for()
    for i in range(3):
        source=page.locator('.expr').inner_html();value=fraction_html(source)
        answer=str(value.numerator) if 'числитель' in page.locator('#formatHint').inner_text().lower() else fmt(value)
        if i==0 and persona=='wrong':
            page.locator('#ans').fill('999999');page.locator('#check').click()
        if i==0 and persona=='reveal':
            page.locator('#reveal').click()
            assert 'ответ показан 1' in page.locator('#counter').inner_text()
        else:
            page.locator('#ans').fill(answer);page.locator('#check').click()
            assert 'Верно' in page.locator('#mark').inner_text(),source+' => '+answer
        before=page.locator('#counter').inner_text()
        if i<2:
            page.locator('#check').click()
            assert page.locator('#counter').inner_text()==before,'Next counted an extra answer'
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),'Task 6 page overflow'
    page.screenshot(path=str(out/(label+'.png')),full_page=True)
    return {'persona':persona,'counter':page.locator('#counter').inner_text()}

def geometry_sample(page,url,candidate,out,label):
    page.goto(url);page.wait_for_function('window.__oge15')
    keys=['angSum','extAng','isoBase','isoApex','bisIso','bisExt','twoExt','bisAlt','altAlt','rtAcute','areaBH','midline']
    result=[]
    for k in keys:
        page.evaluate('(k)=>window.__oge15.trainWith(k,window.__oge15.SUBS[k].proto)',k)
        page.wait_for_timeout(450)
        source=page.locator('#taskText').inner_html()
        solver=(candidate/'tools/oge-task15-triangles.solve.mjs').as_uri()
        code='import {solve} from '+json.dumps(solver)+';console.log(JSON.stringify(solve(process.argv[1],process.argv[2])));'
        independent=json.loads(subprocess.check_output(['node','--input-type=module','-e',code,k,source],text=True,timeout=15))
        assert independent['ans'] is not None and math.isfinite(independent['ans']),k+': statement solver failed'
        answer=str(round(independent['ans'],6))
        svg=page.locator('.diagram svg').first
        assert svg.is_visible(),k+': missing diagram'
        assert not re.search(r'NaN|Infinity|undefined',svg.evaluate('(e)=>e.outerHTML')),k+': invalid diagram'
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),k+': page overflow'
        page.screenshot(path=str(out/(label+'-'+k+'.png')),full_page=True)
        page.locator('#ans').fill(answer);page.locator('#check').click()
        assert 'Верно' in page.locator('#fb').inner_text(),k+': independent answer rejected'
        rec=page.evaluate('(k)=>JSON.parse(localStorage.getItem("mathExamCourseProgress.v1"))["oge-t15-treugolniki"].solvedByType[k]',k)
        assert rec==1,k+': incorrect clean score'
        page.locator('#ans').press('Enter');page.locator('#ans').press('Enter')
        assert page.locator('#taskText').inner_html()==source,k+': Enter advanced the task'
        result.append({'type':k,'condition_html':source,'answer':independent['ans'],'constructed_points':independent['pts']})
    return result

def geometry_hint(page,url):
    page.goto(url);page.wait_for_function('window.__oge15')
    page.evaluate('() => window.__oge15.trainWith("bisIso",{d:"B",L:"K",g:28,f:0})')
    page.wait_for_timeout(450);page.locator('#ladBtn').click()
    prompted=[]
    for i in range(8):
        step=page.locator('.lstep').last
        if not step.locator('input').count() or step.locator('input').is_disabled(): break
        text=step.inner_text();prompted.append(text)
        hint=step.locator('button.soft')
        if i==0 and hint.count(): hint.click()
        if i==0: answer='28'
        elif i==1: answer='56'
        elif i==2: answer='96'
        else: raise AssertionError('Bisector ladder changed; update statement solver, do not use hidden answers')
        step.locator('input').fill(answer);step.locator('input').press('Enter')
        if page.locator('#after').count() and page.locator('#after').is_visible(): break
    final=page.locator('#after').inner_text()
    assert 'Все шаги решены самостоятельно' not in final,'CONTENT STANDARD: substantive hint followed by "Все шаги решены самостоятельно"'
    return {'steps':prompted,'final':final}

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass

def browser_checks(audit,candidate=None):
    from playwright.sync_api import sync_playwright
    handler=functools.partial(QuietHandler,directory=str(audit.root))
    server=ThreadingHTTPServer(('127.0.0.1',0),handler)
    thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
    origin='http://127.0.0.1:'+str(server.server_port)+'/'
    cserver=None
    if candidate:
        cserver=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(QuietHandler,directory=str(candidate)))
        threading.Thread(target=cserver.serve_forever,daemon=True).start()
    try:
        with sync_playwright() as pw:
            browser=pw.chromium.launch(headless=True)
            for width in [1280,360]:
                def journey(label,fn):
                    def run():
                        context=browser.new_context(viewport={'width':width,'height':900 if width==1280 else 800},has_touch=width==360)
                        context.add_init_script('''(() => { let s=20261009; Math.random=()=>{s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t^=t+Math.imul(t^(t>>>7),61|t);return ((t^(t>>>14))>>>0)/4294967296;};})();''')
                        page=context.new_page();errors=[]
                        page.on('pageerror',lambda e:errors.append(str(e)))
                        try:
                            detail=fn(page)
                            assert not errors,'Browser exceptions: '+repr(errors)
                            return detail
                        except Exception:
                            page.screenshot(path=str(audit.out/(label+'-FAIL.png')),full_page=True)
                            raise
                        finally: context.close()
                    audit.run(label,run)
                for topic,persona in [('start','careful'),('zero','wrong'),('appendZeros','hint'),('decimalDivisor','reveal'),('twoDigit','return'),('oneDigit','table')]:
                    label=f'division-{topic}-{persona}-{width}'
                    journey(label,lambda p,t=topic,r=persona,l=label:division_run(p,origin+DIV,t,r,audit.out,l))
                for page_name in ['fraction-meaning.html','fraction-common-denominator.html']:
                    label=f'route-{page_name}-{width}'
                    journey(label,lambda p,n=page_name,l=label:basics_route(p,origin+BASIC+n,audit.out,l))
                for kind in ['hint','reveal']:
                    journey(f'basic-help-{kind}-{width}',lambda p,k=kind:basics_help(p,origin+BASIC+'fraction-common-denominator.html',k))
                for persona in ['careful','wrong','reveal']:
                    label=f'exam6-{persona}-{width}'
                    journey(label,lambda p,r=persona,l=label:task6_run(p,origin+'trainers/oge-task6-fractions.html',r,audit.out,l))
                if cserver:
                    url='http://127.0.0.1:'+str(cserver.server_port)+'/'+GEOM
                    journey(f'geometry12-{width}',lambda p:geometry_sample(p,url,candidate,audit.out,f'geometry-{width}'))
                    journey(f'geometry-hint-{width}',lambda p:geometry_hint(p,url))
            browser.close()
    finally:
        server.shutdown();server.server_close()
        if cserver: cserver.shutdown();cserver.server_close()

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--root',type=Path,default=Path('.'))
    p.add_argument('--candidate',type=Path)
    p.add_argument('--out',type=Path,default=Path('robot-evidence'))
    p.add_argument('--math-only',action='store_true')
    a=p.parse_args();audit=Audit(a.root.resolve(),a.out.resolve())
    for name in [DIV,'trainers/oge-task6-fractions.html',BASIC+'fraction-meaning.html',BASIC+'fraction-common-denominator.html']:
        path=audit.root/name
        audit.results.append({'name':'identity:'+name,'status':'PASS','sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
    audit.run('fraction-bank-independent-math',lambda:math_bank(audit.root))
    audit.run('division-independent-math',lambda:math_division(audit.root))
    if not a.math_only:
        audit.run('browser-environment',lambda:browser_checks(audit,a.candidate.resolve() if a.candidate else None))
    failures=audit.save()
    print(json.dumps({'checks':len(audit.results),'failed':failures,'browser_run':not a.math_only}))
    return 1 if failures else 0
if __name__=='__main__':
    raise SystemExit(main())
