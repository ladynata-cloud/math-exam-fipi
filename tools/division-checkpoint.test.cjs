'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const base=path.resolve(__dirname,'../trainers/oge-basics/multiplication-division');
const C=require(path.join(base,'division-checkpoint.js'));
const D=require(path.join(base,'division-lab-core.js'));
const rational=text=>{const [whole,fraction='']=String(text).replace(',','.').split('.');return {n:BigInt(whole+fraction),d:10n**BigInt(fraction.length)};};

test('8,000 generated problems cover all eight skills and satisfy exact arithmetic',()=>{
  let previous=[];
  for(let serial=1;serial<=1000;serial++){
    const tasks=C.makeTasks(serial,previous),seen=new Set();
    assert.equal(tasks.length,8);
    tasks.forEach((task,index)=>{
      assert(C.matches(C.topics[index].id,task));
      const stamp=task.dividend+':'+task.divisor;
      assert(!seen.has(stamp));seen.add(stamp);
      assert(!previous.some(old=>old.dividend===task.dividend&&old.divisor===task.divisor),'new work must use new operands');
      const p=D.plan(task),a=rational(task.dividend),b=rational(task.divisor),q=rational(p.quotient);
      if(task.level==='remainder'){
        assert.equal(q.d,1n);assert.equal(a.n,b.n*q.n+BigInt(p.remainder));assert(p.remainder>0&&BigInt(p.remainder)<b.n);
      }else assert.equal(a.n*b.d*q.d,b.n*q.n*a.d);
      assert(C.evaluate(task,p.quotient,String(p.remainder)));
      assert(!C.evaluate(task,'99999999','0'));
    });previous=tasks;
  }
});

test('empty and malformed values do not consume the final attempt',()=>{
  const s=C.blank();
  for(const value of ['', ' ', '1e3', 'NaN', '<script>', '+2', '1,2,3']){
    const result=C.submit(s,value);assert.equal(result.changed,false);assert.deepEqual(result.state,s);
  }
  let r=C.blank();while(r.index<3){const p=D.plan(r.tasks[r.index]);r=C.advance(C.submit(r,p.quotient).state);}
  assert.equal(C.submit(r,'12','').changed,false);
  assert.equal(C.submit(r,'12','1,0').changed,false);
});

test('a wrong final answer cannot be replaced after feedback, nor double-counted',()=>{
  let s=C.blank();s=C.submit(s,'99999').state;
  const reviewed=JSON.stringify(s),correct=D.plan(s.tasks[0]).quotient;
  assert.equal(C.submit(s,correct).changed,false);assert.equal(JSON.stringify(C.submit(s,correct).state),reviewed);
  assert.equal(C.summary(s).incorrect,1);assert.equal(C.summary(s).independent,0);
  s=C.advance(s);assert.equal(s.index,1);assert.equal(C.advance(s).index,1);
});

test('help is recorded per task and cannot inflate independent results',()=>{
  let s=C.blank();
  for(let i=0;i<8;i++){
    if(i===1||i===4)s=C.help(s);
    const p=D.plan(s.tasks[i]);s=C.advance(C.submit(s,p.quotient,String(p.remainder)).state);
  }
  const result=C.summary(s);assert.equal(result.finished,true);assert.equal(result.independent,6);assert.equal(result.supported,2);assert.equal(result.incorrect,0);
  assert.equal(C.advance(s).index,8);assert.equal(C.submit(s,'0').changed,false);
  const next=C.blank(2,s.tasks);assert.equal(C.summary(next).answered,0);assert(next.assisted.every(x=>!x));
});

test('validation rejects inconsistent answers, task types and duplicate tasks',()=>{
  const changes=[s=>s.index=2,s=>s.tasks[2]=s.tasks[0],s=>s.tasks[3].divisor='0',s=>s.tasks[6]={level:'appendZeros',dividend:'12',divisor:'3'},s=>s.answers.push({answer:'2',remainder:'',assisted:true}),s=>s.draft.answer='x'.repeat(31),s=>s.version=2];
  for(const change of changes){const s=C.blank();change(s);assert.throws(()=>C.validate(s));}
  const s=C.blank();s.draft.answer='12,3';assert.deepEqual(C.validate(s),s);
});

function fixture(t,saved){
  const dom=new JSDOM(fs.readFileSync(path.join(base,'division-checkpoint.html'),'utf8'),{url:'https://mathexam.space/trainers/oge-basics/multiplication-division/division-checkpoint.html',runScripts:'outside-only',pretendToBeVisual:true});
  t.after(()=>dom.window.close());const w=dom.window;
  if(saved!==undefined)w.localStorage.setItem(C.KEY,typeof saved==='string'?saved:JSON.stringify(saved));
  for(const name of ['division-lab-core.js','division-checkpoint.js'])w.eval(fs.readFileSync(path.join(base,name),'utf8'));
  return {w,$:id=>w.document.getElementById(id),state:()=>w.__divisionCheckpointDebug.state(),stored:()=>w.localStorage.getItem(C.KEY)};
}
function answer(f,value,remainder=''){
  f.$('checkpoint-answer').value=value;f.$('checkpoint-remainder').value=remainder;
  f.$('checkpoint-form').dispatchEvent(new f.w.Event('submit',{cancelable:true}));
}

test('the page saves drafts, resumes the exact problem and reveals answers only after submission',t=>{
  const f=fixture(t),original=f.$('checkpoint-problem').textContent;
  assert.equal(f.$('checkpoint-review').hidden,true);assert.equal(f.$('checkpoint-correct-answer').textContent,'');
  answer(f,'');assert.equal(f.state().answers.length,0);
  f.$('checkpoint-answer').value='123';f.$('checkpoint-answer').dispatchEvent(new f.w.Event('input'));
  const resumed=fixture(t,f.stored());assert.equal(resumed.$('checkpoint-answer').value,'123');assert.equal(resumed.$('checkpoint-problem').textContent,original);
  answer(resumed,'999');assert.equal(resumed.$('checkpoint-review').hidden,false);assert.equal(resumed.$('checkpoint-form').hidden,true);
  assert.match(resumed.$('checkpoint-feedback').textContent,/Пока не получилось/);
  const reviewAgain=fixture(t,resumed.stored());assert.equal(reviewAgain.$('checkpoint-review').hidden,false);assert.equal(reviewAgain.state().answers.length,1);
  reviewAgain.$('checkpoint-next').click();assert.equal(reviewAgain.state().index,1);assert.equal(reviewAgain.$('checkpoint-answer').value,'');
});

test('full browser-like journey preserves remainder and gives eight targeted review links',t=>{
  const f=fixture(t);
  for(let i=0;i<8;i++){
    const task=f.state().tasks[i],p=D.plan(task);
    assert.equal(f.$('checkpoint-remainder-label').hidden,task.level!=='remainder');
    if(i===2)f.w.document.dispatchEvent(new f.w.CustomEvent('mathexam:skill-support',{cancelable:true,detail:{skill:'subtract'}}));
    answer(f,p.quotient.replace(',','.'),String(p.remainder));f.$('checkpoint-next').click();
  }
  assert.equal(f.$('checkpoint-results').hidden,false);assert.match(f.$('checkpoint-summary').textContent,/7 из 8/);
  const links=[...f.$('checkpoint-result-list').querySelectorAll('a')];assert.equal(links.length,8);assert.deepEqual(links.map(a=>a.hash.slice(1)),C.topics.map(t=>t.id));
  const old=f.state().tasks;f.$('checkpoint-new').click();assert.equal(f.state().index,0);assert.equal(f.$('checkpoint-results').hidden,true);assert.notDeepEqual(f.state().tasks,old);
});

test('corrupt and newer storage are never overwritten by this tab',t=>{
  const corrupt=fixture(t,'{broken');assert.equal(corrupt.stored(),'{broken');assert.equal(corrupt.$('checkpoint-storage').hidden,false);
  answer(corrupt,'999');assert.equal(corrupt.stored(),'{broken');
  const f=fixture(t);const newer=JSON.stringify(C.blank(15));f.w.localStorage.setItem(C.KEY,newer);answer(f,'999');assert.equal(f.stored(),newer);assert.match(f.$('checkpoint-storage').textContent,/другой вкладке/);
});

test('help after a checked answer does not retroactively change its result',t=>{
  const f=fixture(t),p=D.plan(f.state().tasks[0]);answer(f,p.quotient);
  f.w.document.dispatchEvent(new f.w.CustomEvent('mathexam:skill-support',{cancelable:true,detail:{skill:'table'}}));
  assert.equal(C.summary(f.state()).independent,1);assert.equal(f.state().answers[0].assisted,false);
});

test('a help detour keeps the original tab when saving is unavailable',t=>{
  const f=fixture(t,'{broken'),link=f.$('checkpoint-help');
  link.addEventListener('click',event=>event.preventDefault());link.click();
  assert.equal(link.target,'_blank');assert.equal(link.rel,'noopener');assert.equal(new URL(link.href).search,'');
  assert.equal(f.stored(),'{broken');
});

test('real Chromium: all eight examples and no overflow at 320/1280 px',{skip:process.env.CHECKPOINT_BROWSER!=='1'},async()=>{
  const http=require('node:http'),{chromium}=require('playwright'),root=path.resolve(__dirname,'..');
  const server=http.createServer((request,response)=>{
    const file=path.resolve(root,'.'+new URL(request.url,'http://localhost').pathname);
    if(!file.startsWith(root+path.sep)){response.writeHead(403);response.end();return;}
    try{response.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'})[path.extname(file)]||'text/plain');response.end(fs.readFileSync(file));}catch(_){response.writeHead(404);response.end();}
  });
  let browser;
  try{
    await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
    browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
    for(const width of [320,1280]){
      const page=await browser.newPage({viewport:{width,height:900}}),errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      await page.goto('http://127.0.0.1:'+server.address().port+'/trainers/oge-basics/multiplication-division/division-checkpoint.html');
      await page.waitForFunction(()=>window.__divisionCheckpointDebug);
      assert(await page.locator('#checkpoint-answer').isVisible());
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      for(let i=0;i<8;i++){
        const data=await page.evaluate(()=>{const state=window.__divisionCheckpointDebug.state(),task=state.tasks[state.index],plan=window.DivisionLab.plan(task);return {answer:plan.quotient,remainder:String(plan.remainder),hasRemainder:task.level==='remainder'};});
        await page.locator('#checkpoint-answer').fill(data.answer);
        if(data.hasRemainder)await page.locator('#checkpoint-remainder').fill(data.remainder);
        await page.locator('#checkpoint-submit').click();await page.locator('#checkpoint-next').click();
      }
      assert.match(await page.locator('#checkpoint-summary').innerText(),/8 из 8/);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      await page.reload();await page.waitForFunction(()=>window.__divisionCheckpointDebug);assert(await page.locator('#checkpoint-results').isVisible());
      assert.deepEqual(errors,[]);await page.close();
    }
  }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
});
