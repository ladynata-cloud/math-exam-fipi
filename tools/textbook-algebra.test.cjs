const assert=require('node:assert/strict');
const vm=require('node:vm');
const C=require('../school/curriculum.js'),M=require('../school/math.js'),S=require('../school/state.js');
const before=S.blank(),oldIds=C.lessons.map(x=>x.id);
S.result(before,{skill:'fraction',mode:'check',correct:true,assisted:false,exposed:false,attempt:1,time:100,fingerprint:'prior-fraction'});
require('../school/algebra7.js').install(C,M);
const ids=C.lessons.map(x=>x.id),newIds=ids.filter(x=>!oldIds.includes(x));
assert.equal(newIds.length,6);assert.equal(new Set(ids).size,ids.length);
assert.deepEqual(S.validate(JSON.parse(JSON.stringify(before)),ids),before);
const fmt=x=>Array.isArray(x)?x.map(fmt).join(';'):typeof x==='object'?M.fmt(x):String(x);
function calc(raw){const s=raw.replace(/−/g,'-').replace(/·/g,'*').replace(/:/g,'/').replace(/²/g,'**2');assert(/^[\d\s+*/().-]+$/.test(s),s);const n=vm.runInNewContext(s,{}, {timeout:100});return Object.is(n,-0)?0:n;}
function val(a){return typeof a==='object'?a.n/a.d:a;}
for(const id of newIds){
 assert(C.byId[id].detail.length===3);C.byId[id].requires.forEach(k=>assert(C.byId[k],k));
 for(let seed=0;seed<240;seed++){
  const t=M.generate(id,seed),p=t.prompt;
  assert(M.accepts(fmt(t.answer),t));for(const st of t.steps)assert(M.accepts(fmt(st.answer),st));
  if(id==='alg-rational'){
   if(p.startsWith('На прямой')){const n=Number(p.match(/сделали (\d+)/)[1])*(p.includes('влево')?-1:1);assert.equal(val(t.answer),n/4);}
   else if(p.startsWith('Вычисли'))assert.equal(val(t.answer),calc(p.slice(8,-1)));
   else {const m=p.match(/−(\d+) (\d+)\/10/);assert.equal(val(t.answer),-Number(m[1])-Number(m[2])/10);}
  }else if(id==='alg-order'){
   if(p.startsWith('Найди')){const n=Number(p.match(/\d+/)[0]);assert.equal(t.answer,n*n-(-n*n));}
   else assert.equal(t.answer,calc(p.slice(8,-1)));
  }else if(id==='alg-variable'){
   if(p.startsWith('Доставка')){const [b,a,c]=p.match(/\d+/g).map(Number);assert.equal(t.answer,b+a*c);}
   else {const [x]=p.match(/x = (−?-?\d+)/).slice(1).map(Number),expr=p.split('вычисли ')[1].slice(0,-1).replace(/(\d+)x/g,'$1*x').replace(/(\d+)\(/g,'$1*(').replace(/x/g,'('+x+')');assert.equal(t.answer,calc(expr));}
  }else if(id==='alg-compare'){
   const x=Number(p.match(/x = (-?\d+)/)[1]),a=p.match(/A = (.+) и B = (.+)\. Введи/);
   const evalAt=e=>calc(e.replace(/(\d+)x/g,'$1*x').replace(/x/g,'('+x+')'));
   const A=evalAt(a[1]),B=evalAt(a[2]);assert.equal(t.answer,A<B?'<':A>B?'>':'=');
  }else if(id==='alg-properties'){
   const left=p.match(/скобки (.+)\. Ответ/)[1];for(const x of [-7,-1,0,2,5])assert.equal(calc(left.replace(/(\d+)\(/g,'$1*(').replace(/x/g,'('+x+')')),t.answer[0]*x+t.answer[1]);
  }else if(typeof t.answer==='string'){
   const eq=p.match(/x: (.+) = (.+)\? Введи/);const f=(e,x)=>calc(e.replace(/(\d+)x/g,'$1*x').replace(/(\d+)\(/g,'$1*(').replace(/x/g,'('+x+')'));
   assert.notEqual(f(eq[1],0),f(eq[2],0));assert.equal(t.answer,'нет');
  }else{
   const expr=p.match(/(?:подобные: |Упрости )(.+)\. Запиши/)[1];for(const x of [-4,0,3])assert.equal(calc(expr.replace(/(\d+)x/g,'$1*x').replace(/x/g,'('+x+')')),t.answer[0]*x+t.answer[1]);
  }
 }
}
const book=C.books.find(x=>x.id==='makarychev7-2024');assert.deepEqual(book.mapping.map(x=>x.page),[5,11,14,19,23,26]);
// New content uses the same evidence rules, and never converts assisted work into mastery.
const s=S.blank();for(const e of [{mode:'learn',correct:true,assisted:false,exposed:false,attempt:1},{mode:'check',correct:true,assisted:true,exposed:false,attempt:1},{mode:'check',correct:true,assisted:false,exposed:true,attempt:1},{mode:'check',correct:true,assisted:false,exposed:false,attempt:2}])S.result(s,{...e,skill:newIds[0],time:100,fingerprint:JSON.stringify(e)});
assert.equal(s.skills[newIds[0]].checks.length,0);
console.log('PASS: 1,440 generated conditions independently checked; six mappings; prior progress and evidence rules preserved.');
