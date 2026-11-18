'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {JSDOM} = require('jsdom');

const source = fs.readFileSync(path.join(__dirname, '../trainers/oge-informatics-1-10-tutor.html'), 'utf8');

function mount(t, savedMode) {
  const dom = new JSDOM(source, {url:'https://example.test/trainers/informatics', runScripts:'outside-only'});
  const {window} = dom;
  t.after(() => window.close());
  window.HTMLElement.prototype.scrollIntoView = () => {};
  let seed = 15049;
  window.Math.random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  if (savedMode) window.localStorage.setItem('ogeInfoTrainerMode', savedMode);
  const find = selector => window.document.querySelector(selector);
  window.eval(find('script:not([src])').textContent);
  return {find, attempts:() => JSON.parse(window.localStorage.getItem('ogeInfoTrainerStats') || '{}').attempts || 0};
}

test('checking, requesting help and switching modes preserve the pupil’s answer', t => {
  const {find, attempts} = mount(t, 'exam');
  const click = selector => find(selector).click();
  assert.equal(find('[data-mode="exam"]').classList.contains('active'), true);
  click('#checkBtn');
  assert.equal(attempts(), 0);
  assert.equal(find('#hintBtn').disabled, true);
  find('#answerInput').value = 'ошибка';
  click('#checkBtn');
  click('#checkBtn');
  assert.equal(attempts(), 1);
  assert.equal(find('#solutionBtn').disabled, false);
  assert.equal(find('#solutionBox').classList.contains('show'), false);
  assert.doesNotMatch(find('#feedback').textContent, /правильный ответ/i);

  click('#variantBtn');
  find('#miniAnswer0').value = 'черновик';
  click('[data-mode="learn"]');
  click('[data-mini-hint="0"]');
  click('[data-mode="exam"]');
  assert.equal(find('#miniAnswer0').value, 'черновик');
  assert.equal(find('#miniHint0').classList.contains('show'), false);
  click('[data-mini-check="1"]');
  assert.equal(attempts(), 1);
  click('[data-mini-check="0"]');
  assert.equal(attempts(), 2);
  assert.equal(find('#miniSolution0').classList.contains('show'), false);
  click('#checkVariantBtn');
  assert.equal(attempts(), 2);
  assert.equal(find('#miniResult1').textContent, 'пропущено');
  assert.equal(find('#miniAnswer0').readOnly, true);
  assert.equal(find('#miniSolution0').classList.contains('show'), true);
  click('#newVariantBtn');
  assert.equal(find('#variantScore').textContent, 'ещё не проверено');
  assert.equal(find('#checkVariantBtn').disabled, false);
});

test('the parameter threshold counts each displayed run, including equal s values', t => {
  const {find} = mount(t);
  find('[data-topic="6"]').click();
  let withDuplicates = 0;
  for (let i = 0; i < 40; i++) {
    const prompt = find('#taskText').textContent;
    const k = Number(prompt.match(/t > (\d+)/)[1]);
    const m = Number(prompt.match(/NO ровно (\d+)/)[1]);
    const pairs = Array.from(prompt.matchAll(/\((-?\d+), (-?\d+)\)/g), ([,s,t]) => [Number(s), Number(t)]);
    assert.equal(pairs.length, 9);
    const retained = pairs.filter(([,t]) => t <= k).map(([s]) => s).sort((a,b) => a-b);
    const thresholds = [];
    for (let a = Math.min(...retained)-1; a <= Math.max(...retained); a++) {
      if (pairs.filter(([s,t]) => !(s > a || t > k)).length === m) thresholds.push(a);
    }
    assert.ok(thresholds.length > 0);
    find('#answerInput').value = String(Math.max(...thresholds));
    find('#checkBtn').click();
    assert.ok(find('#feedback').classList.contains('good'));
    if (new Set(retained).size < retained.length && ++withDuplicates === 1) {
      find('#tutorOpenBtn').click();
      find('[data-tutor-next]').click();
      find('[data-tutor-next]').click();
      find('#s_tutorInput').value = [...new Set(retained)].join(',');
      find('[data-tutor-check]').click();
      assert.ok(find('[data-tutor-fb]').classList.contains('bad'));
      find('#s_tutorInput').value = retained.join(',');
      find('[data-tutor-check]').click();
      assert.ok(find('[data-tutor-fb]').classList.contains('good'));
    }
    find('#newTaskBtn').click();
  }
  assert.ok(withDuplicates > 0);
});

test('all ten generators match independent answers recovered from the displayed questions', t => {
  const dom = new JSDOM(source, {url:'https://example.test/oge',runScripts:'outside-only'});
  t.after(()=>dom.window.close());
  const {window:w}=dom;
  const body=w.document.querySelector('script:not([src])').textContent;
  w.eval(body.replace('  renderNav(); renderStats(); renderModeBar();',
    '  window.checks={buildTask,checkTask,stepIsCorrect}; renderNav(); renderStats(); renderModeBar();'));
  const {buildTask,checkTask,stepIsCorrect}=w.checks;
  const panel=w.document.createElement('section');
  const numbers=s=>Array.from(s.matchAll(/-?\d+/g),m=>Number(m[0]));
  const rows=()=>Array.from(panel.querySelectorAll('table tr')).slice(1)
    .map(row=>Array.from(row.cells,cell=>cell.textContent.trim()));
  for(let seed=0;seed<192;seed++) for(let n=1;n<=10;n++){
    // Spread the seeds across the PRNG's entire first draw to cover all logic variants.
    const task=buildTask(n,Math.imul(seed,2654435761)>>>0);
    panel.innerHTML=task.html;
    const text=panel.textContent;
    let answer;
    if(n===1){
      const [bits,bytes]=numbers(text);
      const names=text.match(/«([^»]+)»/)[1].split(', ').filter(name=>name.length+2===bytes*8/bits);
      assert.equal(names.length,1); [answer]=names;
    } else if(n===2){
      const message=panel.querySelector('p.mono').textContent.replace(/\s/g,'');
      const ways=[{pos:0,word:''}], words=[];
      const table=rows().map(([letter,code])=>[letter,code.replace(/\s/g,'')]);
      while(ways.length){
        const {pos,word}=ways.pop();
        if(pos===message.length) words.push(word);
        for(const [letter,code] of table) if(message.startsWith(code,pos)) ways.push({pos:pos+code.length,word:word+letter});
      }
      assert.equal(words.length,1); [answer]=words;
    } else if(n===3){
      const expression=panel.querySelector('p.mono').textContent;
      const [a,b,c]=numbers(expression);
      const good=[];
      for(let x=1;x<=100;x++){
        const desired=c!==undefined ? !((x>a)||!((x<b)&&(x>c))) : expression.startsWith('НЕ') ? !(x>a)&&x>b : x>a&&!(x>=b);
        if(desired) good.push(x);
      }
      answer=text.includes('наибольшее')?Math.max(...good):Math.min(...good);
    } else if(n===4){
      const data=rows(); const cities=data.map(r=>r[0]);
      const dist=data.map((r,i)=>r.slice(1).map((v,j)=>i===j?0:v?Number(v):Infinity));
      for(let k=0;k<5;k++) for(let i=0;i<5;i++) for(let j=0;j<5;j++) dist[i][j]=Math.min(dist[i][j],dist[i][k]+dist[k][j]);
      const points=Array.from(panel.querySelectorAll('p b'),v=>cities.indexOf(v.textContent));
      answer=dist[points[0]][points[1]];
    } else if(n===5){
      const [start,goal]=numbers(text.match(/из числа \d+ числа \d+/)[0]);
      for(let length=1;length<=5;length++) for(let mask=0;mask<2**length;mask++){
        const program=mask.toString(2).padStart(length,'0').replace(/[01]/g,c=>c==='0'?'1':'2');
        const value=Array.from(program).reduce((x,cmd)=>cmd==='1'?x*x:x+1,start);
        assert.equal(checkTask(task,program),value===goal);
        if(value===goal) answer=program;
      }
    } else if(n===6){
      const pairs=Array.from(text.matchAll(/\((-?\d+), (-?\d+)\)/g),m=>[Number(m[1]),Number(m[2])]);
      const k=Number(text.match(/t > (\d+)/)[1]),wanted=Number(text.match(/NO ровно (\d+)/)[1]);
      for(let a=-20;a<=20;a++) if(pairs.filter(([s,t])=>s<=a&&t<=k).length===wanted) answer=a;
    } else if(n===7){
      const [file,host,protocol]=Array.from(panel.querySelectorAll('p b'),v=>v.textContent);
      const frags=Array.from(panel.querySelectorAll('.fragment'),r=>[r.lastElementChild.textContent,r.firstElementChild.textContent.charAt(0)]);
      const [server,zone]=host.split('.'), [name,ext]=file.split('.');
      const seq=[protocol,'://',server,'.'+zone,'/',name+'.',ext].map(key=>frags.find(([part])=>part===key)[1]).join('');
      answer=seq;
      assert.ok(checkTask(task,seq.split('').join(', ')));
      assert.ok(!checkTask(task,'X'+seq));
    } else if(n===8){
      const [union,first,both]=rows().map(r=>Number(r[1]));
      answer=union-first+both;
    } else if(n===9){
      const edges=Array.from(panel.querySelectorAll('li'),li=>li.textContent.split(' → '));
      const frontier=['A']; answer=0;
      while(frontier.length){
        const city=frontier.pop(); if(city==='H'){answer++; continue;}
        const next=edges.find(e=>e[0]===city)[1]; if(next!=='дорог нет')frontier.push(...next.split(', '));
      }
    } else {
      answer=Array.from(task.html.matchAll(/([0-9A-F]+)<sub>(\d+)<\/sub>/g),m=>parseInt(m[1],Number(m[2]))).reduce((a,b)=>a+b,0);
    }
    assert.notEqual(answer,undefined);
    assert.equal(checkTask(task,String(answer)),true,`№${n} seed ${seed}`);
    assert.equal(checkTask(task,'невозможно!'),false);
    if([3,4,6,8,9,10].includes(n)){
      assert.ok(checkTask(task,(answer>=0?'+':'')+String(answer).replace('-','−')+',00'));
      assert.ok(!checkTask(task,answer+'e0'));
    }
    for(const step of task.steps){
      assert.ok(stepIsCorrect(step,step.expected),`№${n}: ${step.title}`);
      assert.ok(!stepIsCorrect(step,'@ошибка!'),`№${n}: ${step.title}`);
    }
  }
});

test('a tab reload resumes the same graph with solved city labels and first-attempt statistics',t=>{
  const route='https://example.test/trainers/oge-informatics-1-10-tutor.html';
  function open(url,previous){
    const dom=new JSDOM(source,{url,runScripts:'outside-only'});
    t.after(()=>dom.window.close());
    const w=dom.window;
    if(previous){
      for(const kind of ['localStorage','sessionStorage']){
        for(const key of Object.keys(previous[kind])) w[kind].setItem(key,previous[kind].getItem(key));
      }
    }
    w.eval(w.document.querySelector('script:not([src])').textContent);
    return w;
  }
  let w=open(route);
  const pick=selector=>w.document.querySelector(selector);
  pick('[data-topic="9"]').click();
  const roads=pick('#taskText .graph-key').textContent;
  pick('#answerInput').value='0'; pick('#checkBtn').click();
  pick('#tutorOpenBtn').click(); pick('#s_tutorInput').value='1'; pick('[data-tutor-check]').click();
  pick('[data-tutor-next]').click(); pick('[data-tutor-close]').click(); pick('#tutorOpenBtn').click();
  assert.equal(pick('[data-city="H"] .path-count').textContent,'1');
  w=open(route,w);
  assert.equal(pick('#taskText .graph-key').textContent,roads);
  assert.equal(pick('#s_tutorInput').value,'');
  assert.equal(pick('.active-city').dataset.city,'G');
  assert.equal(pick('[data-city="H"] .path-count').textContent,'1');
  assert.equal(pick('#answerInput').value,'0');
  pick('#checkBtn').click();
  assert.equal(JSON.parse(w.localStorage.getItem('ogeInfoTrainerStats')).attempts,1);
  w=open(route+'?example=paths-article',w);
  pick('#answerInput').value='6'; pick('#checkBtn').click();
  assert.ok(pick('#feedback.good'));
});
