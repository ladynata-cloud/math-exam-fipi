'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
const references=require('../trainers/task19-textbook-reference.js'),{cards}=require('../trainers/task19-visual-data.js');
const KEY='mathExam.task19.visualHints.v1';
const fixture={books:{a:{title:'Геометрия',authors:'Атанасян',edition:'Тестовое издание',url:'https://example.test/a.pdf'},m:{title:'Геометрия',authors:'Мерзляк',edition:'Тестовое издание',url:'https://example.test/m.pdf'}},topics:{line:{title:'Две точки',explanation:'Пояснение к утверждению.',passages:[{bookId:'a',section:'§ 1',printedPage:'3',pdfPage:5,url:'https://example.test/a.pdf#page=5'},{bookId:'m',section:'§ 2',printedPage:'8–9',pdfPage:10,url:'https://example.test/m.pdf#page=10'}]}},cards:{'prev-006':['line'],'prev-102':['line']}};
function boot(id='prev-006'){
 const dom=new JSDOM(read('trainers/task19-trainer.html'),{url:'https://example.test/trainers/task19-trainer.html?card='+id,runScripts:'outside-only'});
 dom.window.Task19TextbookData=fixture;
 for(const file of ['task19-visual-data.js','task19-models-triangles.js','task19-models-circles.js','task19-models-lines-polygons.js','task19-visual-models.js','task19-reference.js','task19-textbook-reference.js','task19-visual-app.js'])dom.window.eval(read('trainers/'+file));
 return {dom,w:dom.window,d:dom.window.document,el:id=>dom.window.document.getElementById(id),saved:()=>JSON.parse(dom.window.localStorage.getItem(KEY))};
}
test('renderer keeps textbook details optional and renders safe precise source links',()=>{
 const dom=new JSDOM('<div id="host"></div>');
 try{
  const host=dom.window.document.getElementById('host');references.mount(host,cards.find(c=>c.id==='prev-006'),fixture);
  const details=host.querySelector('details');assert(details&&!details.open);
  assert.equal(details.querySelector('summary').textContent,'Для ценителей строгости и точности');
  const links=[...host.querySelectorAll('a')];assert.equal(links.length,2);
  assert.equal(links[0].href,'https://example.test/a.pdf#page=5');assert.match(links[0].textContent,/§ 1 · с\. 3/);
  links.forEach(a=>{assert.equal(a.target,'_blank');assert.match(a.rel,/noopener/);assert.match(a.getAttribute('aria-label'),/новой вкладке/);});
  assert.match(host.textContent,/составлено для тренажёра/);
  const noted=structuredClone(fixture);noted.books.a.hostNote='Источник — проверенный внешний архив.';noted.topics.line.passages.push({...noted.topics.line.passages[0],section:'§ 3'});references.mount(host,{id:'prev-006',truth:true},noted);assert.equal(host.textContent.split(noted.books.a.hostNote).length-1,1,'archive provenance is shown once per book');
  const bad=structuredClone(fixture);bad.topics.line.title='<img src=x onerror=alert(1)>';bad.topics.line.explanation='<script>alert(1)</script>';bad.topics.line.passages[0].url='javascript:alert(1)';
  references.mount(host,{id:'prev-006',truth:true},bad);assert.equal(host.querySelectorAll('img,script').length,0);assert.equal(host.querySelectorAll('a').length,1);assert.match(host.textContent,/<script>/);
 }finally{dom.window.close();}
});
test('renderer makes unavailable sources honest and gives the same neutral guidance for true and false questions',()=>{
 const dom=new JSDOM('<main></main>');
 try{const host=dom.window.document.querySelector('main');references.mount(host,{id:'missing'},fixture);assert.match(host.textContent,/пока не удалось загрузить/);assert.equal(host.querySelectorAll('a').length,0);
 references.mount(host,{id:'prev-006',truth:false},fixture);assert.match(host.textContent,/Сравни их условия и вывод/);assert.doesNotMatch(host.textContent,/Неверная формулировка/);const falseText=host.textContent;
 references.mount(host,{id:'prev-006',truth:true},fixture);assert.equal(host.textContent,falseText,'generic source guidance does not reveal the verdict');
 }finally{dom.window.close();}
});
test('renderer includes a source excerpt only when explicitly supplied with an accessible image description',()=>{
 const dom=new JSDOM('<main></main>');try{
  const host=dom.window.document.querySelector('main'),data=structuredClone(fixture);
  data.topics.line.passages[0].excerpt={file:'/trainers/task19-reference/parallel-theorem.png',alt:'Проверенный фрагмент теоремы.',width:600,height:75};
  references.mount(host,{id:'prev-006',truth:true},data);const image=host.querySelector('img');assert(image);assert.equal(image.alt,'Проверенный фрагмент теоремы.');assert.equal(image.width,600);assert.equal(image.loading,'lazy');
  data.topics.line.passages[0].excerpt.file='https://unverified.test/full-book.png';references.mount(host,{id:'prev-006',truth:true},data);assert.equal(host.querySelectorAll('img').length,0);
 }finally{dom.window.close();}
});
test('reading and closing textbook help preserves experiment and does not submit an answer',()=>{
 const e=boot();try{
  const details=e.d.querySelector('.t19-textbook'),summary=details.querySelector('summary');assert(e.el('hintPanel').hidden);assert(!details.open);
  const before=e.saved();summary.click();assert(details.open);assert(e.el('hintPanel').hidden);
  summary.dispatchEvent(new e.w.KeyboardEvent('keydown',{code:'KeyN',key:'n',bubbles:true}));
  e.d.querySelector('.t19-textbook a').dispatchEvent(new e.w.KeyboardEvent('keydown',{code:'KeyJ',key:'j',bubbles:true}));
  assert.deepEqual(e.saved().records,before.records);assert.equal(e.saved().current.answer,null);
  e.el('hintToggle').click();const slider=e.d.querySelector('#visualHost input[type=range]');slider.value=slider.max;slider.dispatchEvent(new e.w.Event('input',{bubbles:true}));
  const changed=e.saved().current.modelState;e.el('hintToggle').click();assert(details.open);e.el('hintToggle').click();assert(details.open);assert.deepEqual(e.saved().current.modelState,changed);
  e.d.querySelector('.t19-textbook-close').click();assert(!details.open);assert.equal(e.d.activeElement,summary);assert.deepEqual(e.saved().current.modelState,changed);assert.deepEqual(e.saved().records,before.records);
  e.el('btnTrue').click();assert.equal(e.saved().records['prev-006'].attempts,1);assert.equal(e.saved().current.answer,true);
 }finally{e.dom.window.close();}
});
test('navigation replaces textbook references and removes them from an empty error list',()=>{
 const e=boot();try{
  const old=e.d.querySelector('.t19-textbook');old.open=true;e.el('nextCard').click();assert(!old.isConnected);assert(!e.d.querySelector('.t19-textbook').open);assert.equal(e.d.querySelector('.t19-textbook').dataset.cardId,e.saved().current.id);
  e.el('reviewOnly').checked=true;e.el('reviewOnly').dispatchEvent(new e.w.Event('change',{bubbles:true}));assert.equal(e.el('textbookHost').children.length,0);
 }finally{e.dom.window.close();}
});
test('every active assertion has verified passage metadata and renderable links for both textbook authors',()=>{
 const data=require('../trainers/task19-textbook-data.js'),dom=new JSDOM('<main></main>'),host=dom.window.document.querySelector('main');
 try{
  for(const card of cards){
   const topics=references.forCard(card,data);assert(topics.length,card.id+': topic mapping');
   const authors=new Set();
   for(const topic of topics){assert(typeof topic.explanation==='string'&&topic.explanation.trim(),card.id+': authored explanation');
    for(const passage of topic.passages){const book=data.books[passage.bookId];assert(book,card.id+': known book');assert(book.edition&&book.authors&&book.title,card.id+': identified edition');assert(passage.section&&String(passage.printedPage).trim(),card.id+': exact printed passage');assert(Number.isInteger(passage.pdfPage)&&passage.pdfPage>0,card.id+': physical PDF page');
     const url=new URL(passage.url);assert.equal(url.protocol,'https:',card.id+': secure source link');assert.equal(new URLSearchParams(url.hash.slice(1)).get('page'),String(passage.pdfPage),card.id+': PDF anchor matches evidence');
     if(/Атанасян/i.test(book.authors))authors.add('atanasyan');if(/Мерзляк/i.test(book.authors))authors.add('merzlyak');
    }
   }
   assert.deepEqual([...authors].sort(),['atanasyan','merzlyak'],card.id+': both author lines');references.mount(host,card,data);assert(host.querySelectorAll('a').length>=2,card.id+': actual passage links');assert(!host.querySelector('details').open,card.id+': stays optional');assert(!host.querySelector('iframe,blockquote'),card.id+': links and paraphrases, no embedded book or bulk quotations');
   const excerpts=topics.flatMap(topic=>topic.passages).filter(p=>p.excerpt);assert.equal(host.querySelectorAll('img').length,excerpts.length,card.id+': only explicitly verified short excerpts');
  }
 }finally{dom.window.close();}
});
