'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { restoreRootAcceptance, restoreRootAnchorLayout } = require('./oge8-root-acceptance-preservation.cjs');
const { restoreActiveLearningIncludes } = require('./oge-active-learning-preservation.cjs');
const source = fs.readFileSync(path.join(__dirname, '../trainers/oge-task8-powers-roots.html'), 'utf8');

function between(start, end) {
  const a = source.indexOf(start), b = source.indexOf(end, a);
  assert(a >= 0 && b > a, 'real source region exists: ' + start);
  return source.slice(a, b);
}

// Run the page's actual parser, exact arithmetic and handlers. This small DOM
// double checks returned feedback/state; it is not a visual/browser test.
function boot() {
  const nodes = Object.fromEntries(['sqFind','sqFb','unA','unB','unOut','halfIn','halfOut'].map(id => [id, {value:'',innerHTML:'',textContent:'',className:''}]));
  const cells = Array.from({length:90}, (_,i) => {
    const classes = new Set();
    return {dataset:{n:String(i+10)},classList:{toggle(c,on){on?classes.add(c):classes.delete(c);},remove(c){classes.delete(c);},contains(c){return classes.has(c);}}};
  });
  const context = vm.createContext({window:{},document:{getElementById:id=>nodes[id],querySelectorAll:s=>s==='table.sq td'?cells:s==='table.sq td.hl'?cells.filter(c=>c.classList.contains('hl')):[]}});
  context.window=context;
  vm.runInContext(between('function gcdB(', '/* ---- рендер каждого типа ---- */') + '\n' +
    between('window.sqCell=function', '</script>') + '\n' +
    between('window.halfGo=function', '/* --- ФСУ раскрывалка --- */'), context);
  const text = id => (nodes[id].textContent || nodes[id].innerHTML).replace(/<[^>]*>/g,'');
  function run(handler, inputs, output) {
    nodes[output].textContent=''; nodes[output].innerHTML='';
    Object.entries(inputs).forEach(([id,value])=>nodes[id].value=String(value));
    context.window[handler]();
    return text(output);
  }
  return {nodes,cells,run};
}

test('square lookup rejects negative radicands and removes a previous positive highlight', () => {
  const t=boot();
  assert.match(t.run('sqSearch',{sqFind:'2116'},'sqFb'), /√2116 = 46/);
  assert.equal(t.cells.filter(c=>c.classList.contains('hl')).length,1);
  for(const n of ['-4','−100','-2','-0.25']) {
    assert.match(t.run('sqSearch',{sqFind:n},'sqFb'), /корень из отрицательного числа не определён/);
    assert.equal(t.nodes.sqFb.className,'fb no');
    assert.equal(t.cells.filter(c=>c.classList.contains('hl')).length,0);
    assert.doesNotMatch(t.nodes.sqFb.textContent,/ = [0-9]/);
  }
});

test('square lookup preserves zero, positive squares and honest non-square feedback', () => {
  const t=boot();
  for(const [input,expected] of [['0','√0 = 0'],['4','√4 = 2'],['9801','√9801 = 99']])
    assert(t.run('sqSearch',{sqFind:input},'sqFb').includes(expected));
  assert.match(t.run('sqSearch',{sqFind:'2'},'sqFb'), /не точный квадрат/);
  assert.match(t.run('sqSearch',{sqFind:'0,25'},'sqFb'), /Корни из положительных дробей тоже существуют/);
  for(const value of ['', 'abc', '<b>4</b>']) assert.match(t.run('sqSearch',{sqFind:value},'sqFb'), /введи целое/);
  for(const value of ['1/0','0/0','-1/0']) assert.match(t.run('sqSearch',{sqFind:value},'sqFb'), /На ноль делить нельзя/);
});

test('combining roots accepts both zero boundaries and keeps exact positive examples', () => {
  const t=boot();
  for(const [a,b,answer] of [[0,4,0],[4,0,0],[0,0,0],[32,2,8],[1,1,1],[10000,10000,10000]]) {
    const output=t.run('uniGo',{unA:a,unB:b},'unOut');
    assert(output.includes(' = '+answer+' — полный квадрат'),output);
  }
  const nonSquare=t.run('uniGo',{unA:2,unB:4},'unOut');
  assert.match(nonSquare,/целого ответа нет; корень иногда можно упростить/);
  assert.doesNotMatch(nonSquare,/так и останется/);
});

test('combining roots explains negatives even when product is positive or zero', () => {
  const t=boot();
  for(const [a,b] of [[-1,-1],[-1,4],[4,-1],[-1,0],[0,-1],['-0.25',4]]) {
    const output=t.run('uniGo',{unA:a,unB:b},'unOut');
    assert.match(output,/Объединять нельзя/);
    assert.match(output,/сначала должны существовать оба корня/);
    assert.doesNotMatch(output,/ = /);
  }
});

test('model input limits are distinguished from mathematical domain and division by zero', () => {
  const t=boot();
  for(const a of ['0.25','1/4','10001']) {
    const output=t.run('uniGo',{unA:a,unB:4},'unOut');
    assert.match(output,/ограничение модели/);
    assert.match(output,/в том числе дробей/);
  }
  for(const a of ['', 'xyz']) assert.match(t.run('uniGo',{unA:a,unB:4},'unOut'),/Введи два числа/);
  for(const [a,b] of [['1/0',4],[4,'0/0'],['-1/0',4]])
    assert.match(t.run('uniGo',{unA:a,unB:b},'unOut'), /На ноль делить нельзя/);
});

test('power checker retains even/odd behavior and rejects unsupported exponents', () => {
  const t=boot();
  for(const n of [2,6,12]) assert.match(t.run('halfGo',{halfIn:n},'halfOut'),/показатель пополам/);
  for(const n of [1,3,11]) {
    const output=t.run('halfGo',{halfIn:n},'halfOut');
    assert.match(output,/нечётный/);
    assert.match(output,/В задачах №2 нашего банка/);
    assert.doesNotMatch(output,/В ОГЭ.*всегда/);
  }
  for(const n of ['', 'abc','0','-1','13','2.5','1/0'])
    assert.match(t.run('halfGo',{halfIn:n},'halfOut'),/целый показатель от 1 до 12/);
});

test('acceptance normalization restores the immutable PR485 page byte for byte', () => {
  const nativeSource=restoreActiveLearningIncludes('trainers/oge-task8-powers-roots.html',source);
  const restored=restoreRootAcceptance(restoreRootAnchorLayout(nativeSource));
  assert.equal(crypto.createHash('sha256').update(restored).digest('hex'),'8ace32a9b021ed5c6597b1ae990539936b245d8bea0ff15f7a36255aa48f897b');
  const marker='Любое ненулевое число в нулевой степени — единица!';
  assert.throws(()=>restoreRootAcceptance(source.replace(marker,'')),/fragment/);
  assert.throws(()=>restoreRootAcceptance(source+marker),/fragment/);
  assert.throws(()=>restoreRootAcceptance(source.replace('if(x.n<0n){fb.textContent=','if(x.n>0n){fb.textContent=')),/fragment/);
  assert.throws(()=>restoreRootAnchorLayout(source.replace('scroll-margin-top:10rem','scroll-margin-top:0')),/fragment/);
  assert.throws(()=>restoreRootAnchorLayout(restoreRootAnchorLayout(source)),/fragment/);
  assert.throws(()=>restoreRootAnchorLayout(source+source),/fragment/);
});

test('JSDOM: actual page buttons replace feedback and render domain explanations', async () => {
  const { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom');
  const root=path.resolve(__dirname,'..'), errors=[];
  class Local extends ResourceLoader {
    fetch(url) {
      const file=path.join(root,new URL(url).pathname);
      return file.startsWith(root+path.sep)&&fs.existsSync(file)?Promise.resolve(fs.readFileSync(file)):null;
    }
  }
  const vc=new VirtualConsole();
  vc.on('jsdomError',error=>errors.push(error.message));
  const dom=new JSDOM(source,{
    url:'https://mathexam.test/trainers/oge-task8-powers-roots.html',
    runScripts:'dangerously',resources:new Local(),virtualConsole:vc,pretendToBeVisual:true,
    beforeParse(w){
      w.scrollTo=()=>{};
      w.HTMLElement.prototype.scrollIntoView=()=>{};
      w.__TESTHOOK__=true;
    }
  });
  const settle=()=>new Promise(resolve=>setTimeout(resolve,35));
  try {
    await new Promise(resolve=>dom.window.addEventListener('load',resolve,{once:true}));
    await settle();
    const w=dom.window,d=w.document;
    assert.equal(d.documentElement.dataset.ogeAlgebraExperience,'ready','real local external adapter loaded');
    const input=(id,value)=>{
      const node=d.getElementById(id);assert(node,id+' exists');
      node.value=String(value);node.dispatchEvent(new w.Event('input',{bubbles:true}));
    };
    const click=selector=>{const node=d.querySelector(selector);assert(node,selector+' exists');node.click();};
    click('button[data-v="ref"]');await settle();
    input('sqFind',2116);click('button[onclick="sqSearch()"]');
    assert.match(d.getElementById('sqFb').textContent,/√2116 = 46/);
    assert.equal(d.querySelectorAll('table.sq td.hl').length,1);
    input('sqFind',-4);click('button[onclick="sqSearch()"]');
    assert.match(d.getElementById('sqFb').textContent,/корень из отрицательного числа не определён/);
    assert.equal(d.getElementById('sqFb').className,'fb no');
    assert.equal(d.querySelectorAll('table.sq td.hl').length,0);
    input('sqFind',0);click('button[onclick="sqSearch()"]');
    assert.match(d.getElementById('sqFb').textContent,/√0 = 0/);
    assert.doesNotMatch(d.getElementById('sqFb').textContent,/отрицательного/);
    assert.equal(d.getElementById('sqFb').className,'fb ok');

    click('button[data-v="learn"]');await settle();
    const before=w.localStorage.getItem('mathExamCourseProgress.v1');
    input('unA',0);input('unB',4);click('button[onclick="uniGo()"]');
    assert.match(d.getElementById('unOut').textContent,/ = 0 — полный квадрат/);
    assert(d.getElementById('unOut').querySelector('.rt'),'valid output contains rendered root markup');
    input('unA',-1);input('unB',-1);click('button[onclick="uniGo()"]');
    assert.match(d.getElementById('unOut').textContent,/Объединять нельзя/);
    assert.equal(d.getElementById('unOut').querySelector('.rt'),null,'textContent removes previous success markup');
    assert.doesNotMatch(d.getElementById('unOut').textContent,/полный квадрат/);
    input('unA',32);input('unB',2);click('button[onclick="uniGo()"]');
    assert.match(d.getElementById('unOut').textContent,/ = 8 — полный квадрат/);
    assert.doesNotMatch(d.getElementById('unOut').textContent,/Объединять нельзя/);
    assert(d.getElementById('unOut').querySelector('.rt'),'innerHTML replaces previous error text');

    const p3=d.getElementById('p3'),p4=d.getElementById('p4');
    assert.match(p3.textContent,/при a ≥ 0 и натуральном n/);
    assert.match(p3.textContent,/ = \|x\|/);
    assert.match(p3.textContent,/а не −3/);
    assert.match(p4.textContent,/при a ≥ 0 и b ≥ 0/);
    assert.match(p4.textContent,/при a ≥ 0 и b > 0/);
    assert.match(p4.textContent,/Сначала проверь каждый корень, затем объединяй/);
    assert.match(p4.textContent,/на ноль делить нельзя/);
    assert(p3.querySelectorAll('.rt').length>0&&p4.querySelectorAll('.rt').length>0,'math helper markup generated');
    assert.equal(w.localStorage.getItem('mathExamCourseProgress.v1'),before,'exploration does not award independent credit');
    assert.deepEqual(errors,[],'no page JavaScript errors during button journey');
  } finally { dom.window.close(); }
});
