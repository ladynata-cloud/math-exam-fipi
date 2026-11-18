const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {chromium} = require('playwright');
const dir = path.resolve(__dirname, '../trainers');

function firstSeries(first, target, add, multiply, maximum) {
  const children = ([x,y]) => [[x+add,y],[x,y+add],[x*multiply,y],[x,y*multiply]];
  const terminal = ([x,y]) => x+y>=target;
  const win1 = p => !terminal(p) && children(p).some(terminal);
  const loss1 = p => !terminal(p) && children(p).every(win1);
  const win2 = p => !terminal(p) && !win1(p) && children(p).some(loss1);
  const loss2 = p => !terminal(p) && !loss1(p) && children(p).every(c=>win1(c)||win2(c));
  const list = pred=>Array.from({length:maximum},(_,i)=>i+1).filter(s=>pred([first,s]));
  return [list(p=>children(p).some(win1))[0],list(win2).slice(0,2).join(' '),list(loss2)[0]].map(String);
}
async function run(){
  let browser;
  try {
    browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || undefined, args:process.env.CHROMIUM_PATH?['--no-sandbox','--disable-dev-shm-usage','--no-zygote','--single-process']:[]});
    const page=await browser.newPage({viewport:{width:360,height:800}});
    page.setDefaultTimeout(20000);
    await page.route('**/*',async route=>{
      const url=new URL(route.request().url());
      const name=decodeURIComponent(url.pathname).slice(1);
      if(url.host!=='algorithms.test' || path.basename(name)!==name || !fs.existsSync(path.join(dir,name))) return route.abort();
      return route.fulfill({body:fs.readFileSync(path.join(dir,name)),contentType:name.endsWith('.js')?'text/javascript':'text/html; charset=utf-8'});
    });
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    const go=slug=>page.goto('http://algorithms.test/'+slug+'.html');
    for(const [name,count,params] of [['fipi',120,[11,154,4,3,142]],['yandex',240,[15,245,1,2,224]]]){
      await go('ege-informatics-19-21-'+name);
      assert.equal(await page.locator('p.answer').count(),count);
      await page.locator('.warmup summary').click();
      const rows=page.locator('.warmup .moves p');
      await rows.first().getByRole('button',{name:'+1',exact:true}).click();
      assert.match(await page.locator('.warmup [role=status]').innerText(),/Попробуйте/);
      for(let i=0;i<2;i++)await rows.nth(i).getByRole('button',{name:'×2',exact:true}).click();
      assert.match(await page.locator('.warmup [role=status]').innerText(),/любом выборе/);
      await page.locator('.warmup .variant').click();await page.locator('.warmup summary').click();
      const expected=firstSeries(...params);
      assert.deepEqual(await page.locator('p.answer').evaluateAll(nodes=>nodes.slice(0,3).map(x=>x.textContent.replace('Ответ: ','').replace(',',' '))),expected);
      const progress=page.locator('.progress'),input=page.locator('form input');
      const select=page.locator('select');
      await input.fill('0.5'); await input.press('Enter'); assert.match(await page.locator('section.game-practice [role=status]').innerText(),/Введите/);
      await page.locator('.hint summary').click();
      await select.selectOption({index:1});
      await input.fill(expected[1].replace(' ','; '));await input.press('Enter');
      assert.match(await progress.innerText(),/Решено: 1 из/);
      await page.reload();assert.equal(await select.evaluate(s=>s.selectedIndex),1);
      await page.locator('.next').click();
      assert.match(await page.locator('.title').innerText(),/Задание 20/);
      await page.locator('.reveal summary').click();
      await input.fill((await page.locator('.reveal p').innerText()).split(': ')[1]);await input.press('Enter');
      assert.match(await progress.innerText(),/Решено: 1 из/);
      if(name==='fipi') {
        const corrected=await select.locator('option').evaluateAll(options=>options.find(o=>o.value.includes('4ED215')).value);
        await select.selectOption(corrected);
        await input.fill('218 220'); await input.press('Enter'); assert.match(await page.locator('section.game-practice [role=status]').innerText(),/Проверьте/);
        await input.fill('36 71'); await input.press('Enter'); assert.match(await page.locator('section.game-practice [role=status]').innerText(),/Верно/);
        assert.match(await select.locator('option').evaluateAll(options=>options.find(o=>o.value.includes('DD29FA')).value),/Задание 21/);
        // Both variants numbered 21 refer to a different source 19 than their display order suggests.
        for(const [id,source] of [['5030FF','FB8AAF'],['F4D519','719FB2'],['B4B268','FB8AAF']]) {
          const title=await select.locator('option').evaluateAll((options,id)=>options.find(o=>o.value.includes(id)).value,id);
          await select.selectOption(title);
          assert((await page.locator('.context .task').textContent()).includes('/task/'+source));
        }
      }
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    }
    await go('recursion_ladder_paths');
    const rec=await page.evaluate(()=>{
      function enumerate(n,f,b,c,seen=false){
        if(n===b||n<f)return 0;
        if(n===f)return +(c==null||seen||n===c);
        return [n-1,n-4,Math.floor(n/3)].filter(k=>k>=0).reduce((a,k)=>a+enumerate(k,f,b,c,seen||n===c),0);
      }
      let tests=0;
      for(let n=5;n<=15;n++)for(let f=0;f<=2;f++)for(let b=f+1;b<n;b++)for(const c of [null,f+2]){
        const memo={};if(countPathsCP(n,f,b,c,memo)!==enumerate(n,f,b,c))return false;
        tests++;
      }
      return tests;
    });
    assert(rec>300);
    const wrong=await page.evaluate(()=>[...document.querySelectorAll('#l-choices1 button')].find(b=>b.textContent!=='G('+(ladderTask-2)+')').textContent);
    await page.getByRole('button',{name:wrong,exact:true}).click();
    assert.equal(await page.locator('#l-choices1 .correct').count(),0);
    const ladderStart=await page.evaluate(()=>ladderTask);
    await page.getByRole('button',{name:'G('+(ladderStart-2)+')',exact:true}).click();
    await page.waitForTimeout(660);
    assert.equal(await page.evaluate(()=>lStep),1);
    await page.evaluate(()=>{switchTab('tree',document.querySelectorAll('.tab')[1]);tInit(TREE_TASKS[2]);});
    const value=await page.evaluate(()=>countPathsCP(tTask.start,tTask.finish,tTask.bad,tTask.cp,{}));
    await page.locator('#t-answer-input').fill(value+'.8');await page.locator('#t-answer-input').press('Enter');
    assert.equal(await page.evaluate(()=>stats.solved),0);
    await page.locator('#t-answer-input').fill(String(value));await page.locator('#t-answer-input').press('Enter');
    assert.equal(await page.evaluate(()=>stats.correct),1);
    for(const old of ['modular-checked','modular-v3','student','universal','upgrade']){
      await go('turing-trainer-'+old);
      assert.equal(await page.locator('nav a[href="./informatics-versions/"]').count(),1);
      await page.locator('nav a[href="./turing-trainer-polish.html"]').click();
      assert(page.url().endsWith('/turing-trainer-polish.html'));
    }
    await go('turing-trainer-polish');
    assert((await page.evaluate(()=>runAllAutoTests())).every(t=>t.ok));
    const generated=await page.evaluate(()=>{
      for(let k=0;k<6;k++)for(let n=0;n<30;n++){
        const t=TASK_GENERATORS[k].fn(),{count0, count1,decimal:x}=t.initialTape;
        const oracle=[()=>count0+1,()=>count0+count1-1,()=>x-1,()=>2**x.toString(2).length-1-x,()=>x&(x-1),()=>x-2**(x.toString(2).length-1)][k]();
        if(t.answer!==oracle)return false;
      }
      return true;
    });
    assert(generated);
    await page.locator('[data-tab="binary"]').click();
    await page.locator('#conv-bin').fill('1'.repeat(64));await page.locator('#conv-to-dec').click();
    assert.equal(await page.locator('#conv-dec-out').textContent(),String(2n**64n-1n));
    await page.locator('[data-tab="library"]').click();
    await page.locator('[data-lib-pick]').first().click();
    const a=await page.evaluate(()=>libGetTask().answer);
    await page.locator('#lib-answer-input').fill(String(a+1));await page.locator('#lib-answer-input').press('Enter');
    await page.locator('#lib-answer-hint').click();
    await page.locator('#lib-answer-input').fill(String(a));await page.locator('#lib-answer-input').press('Enter');await page.locator('#lib-answer-input').press('Enter');
    assert.deepEqual(await page.evaluate(()=>[ProgressStore.getStreak().todaySolved,ProgressStore.getProgress().solvedNoGuide[libGetTask().id]||0]),[1,0]);
    await go('pitosha-python-trainer');
    assert(await page.evaluate(()=>cmpKey('if a < = b:')!==cmpKey('if a<=b:') && cmpKey('print("a  b")')!==cmpKey('print("a b")') && cmpKey('print("abc")')===cmpKey("print( 'abc' )")));
    const lessons=await page.evaluate(()=>LESSONS.map(l=>({program:l.lines.map(row=>'    '.repeat(row.indent)+joinTokens(row.tokens)).join('\n'),out:l.output})));
    await page.locator('[data-action="start"]').first().click();
    await page.locator('[data-action="pick"]').first().click();
    const picked=await page.locator('.answer').innerText();
    await page.reload();assert.equal(await page.locator('.answer').innerText(),picked);
    await go('python-for-nested-if-trainer');
    const nested=await page.evaluate(()=>tasks.map(t=>({program:sol(t),out:t.ans.join('\n')})));
    for(const {program,out} of [...lessons,...nested]){
      // Only the embedded programs from these two fixed teaching banks run here.
      const whitelist=/^(?:[A-Za-z_][A-Za-z_0-9]* = (?:\[.*\]|[-\w+ %\[\]]+)|(?:for |if |else:|results\.append\(|print\(|[a-z]+ = ).*)$/;
      assert(program.split('\n').every(line=>!line.trim() || whitelist.test(line.trim())));
      const actual=spawnSync('python3',['-I','-S','-'],{input:program,encoding:'utf8',timeout:2000});
      assert.equal(actual.status,0,actual.stderr);assert.equal(actual.stdout.trimEnd(),out);
    }
    const first=await page.evaluate(()=>lines(tasks[0]));
    const wrongButton=page.locator('.choice').filter({hasNotText:first[0]});
    await wrongButton.first().click();assert.equal(await page.evaluate(()=>state.step),0);
    await page.getByRole('button',{name:first[0],exact:true}).click();await page.reload();
    assert.equal(await page.evaluate(()=>state.step),1);
    for(const line of first.slice(1))await page.locator('.choice').filter({hasText:line.trim()}).evaluateAll((buttons,line)=>buttons.find(b=>b.dataset.choice===line).click(),line);
    await page.locator('#writeMode').click();
    await page.locator('#codeTry').fill(first.map(l=>l.trim()).join('\n'));await page.locator('#checkCode').click();
    assert.match(await page.locator('#msg').innerText(),/отступ/);
    await page.locator('#codeTry').fill(first.join('\n'));await page.locator('#checkCode').click();await page.reload();
    assert.equal(await page.locator('#solved').innerText(),'1');
    assert.deepEqual(errors,[]);
    console.log('PASS: 360 archive entries, two independent strategy triples, '+rec+' path counts, Turing library + 180 generator samples, '+(lessons.length+nested.length)+' Python programs, restore and retry in Chromium.');
  } finally {if(browser)await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
