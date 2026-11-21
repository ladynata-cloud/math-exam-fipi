'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {JSDOM}=require('jsdom');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const cwd='trainers/peterson7-2011/',html=read(cwd+'index.html');
const catalog=vm.createContext({window:{}});
require('./public-page-script.cjs').loadSchoolModels(root,read('school/index.html'),catalog);
const book=catalog.window.WorkshopCurriculum.books.find(b=>b.id==='source-101');
assert.equal(book.source.sha256,'6c5f695ff056b44dc5c9a35778772d2cc9e2af77743715554457ac0d5107fa68');assert.equal(book.source.pages,139);
const pages=[3,10,16,23,28,34,41,45,52,58,64,69,76,81,88,93,99,103,110,116,122,128];
assert.deepEqual(Array.from(book.mapping,r=>r.page),pages);for(const [i,r] of book.mapping.entries()){
 assert.equal(new URL(r.sourcePath).hash,'#page='+(r.page+2));if(i){assert(r.bookOnly);assert(!r.boardPath);assert(!r.externalPath);}
}
const keys='abcd',letters='абвг',ids=[],printed=[];
for(let t=1;t<=3;t++)for(let j=0;j<4;j++){ids.push('1-'+t+keys[j]);printed.push('1('+t+')'+letters[j]);}
for(const [t,n] of [[2,3],[3,3],[4,3],[5,4]])for(let j=0;j<n;j++){ids.push(t+keys[j]);printed.push(t+letters[j]);}
for(let i=0;i<8;i++){ids.push('6'+'abcdefgh'[i]);printed.push('6'+'абвгдежз'[i]);}
ids.push('7');printed.push('7');
for(let k=1;k<=4;k++)for(let j=0;j<4;j++){ids.push('8-'+k+'abcd'[j]);printed.push('8('+k+')'+'абвг'[j]);}
for(const [n,k] of [[9,4],[10,4],[11,2]])for(let j=0;j<k;j++){ids.push(n+keys[j]);printed.push(n+letters[j]);}
for(let t=1;t<=2;t++)for(let j=0;j<2;j++){ids.push('12-'+t+keys[j]);printed.push('12('+t+')'+letters[j]);}
for(const [id,ref] of [['13a','13а'],['13b','13б'],['14','14'],['15','15*'],['16','16']]){ids.push(id);printed.push(ref);}
assert.equal(book.mapping[0].coverage,'module');
assert.deepEqual(Array.from(book.exercises,r=>r.path.split('/').pop()),ids.map(x=>'101-'+x));
assert.deepEqual(Array.from(book.exercises,r=>r.printed),printed);
const scripts=['trainers/tyurin-statistics/content.js',cwd+'modelling.js',cwd+'budget-remainders.js',cwd+'classify-powers.js',cwd+'equations-stories.js','trainers/tyurin-statistics/app.js'].map(read);
function open(entry,saved){
 const dom=new JSDOM(html,{url:'https://math.example'+entry.path,runScripts:'outside-only'}),w=dom.window;
 w.TextEncoder=TextEncoder;w.Math.random=()=>0;
 const id=entry.path.split('/').pop(), key='math:peterson7-2011:v1:'+id;if(saved)w.localStorage.setItem(key,saved);
 for(const script of scripts)w.eval(script);
 return {dom,w,doc:w.document,key,lesson:w.MathExamTopicPractice.lessons.get(id)};
}
function oracle(i,d){
 if(i>=50){
  if(i<=53||i===64||i===65){const L=x=>d.left1*(x+d.u)+d.left2*(x-d.v)+d.shift,R=x=>d.right1*(x-d.w)+d.tail;
   const lc=L(1)-L(0),rc=R(1)-R(0),rhs=R(0)-L(0),sol=rhs/(lc-rc);assert(Math.abs(L(sol)-R(sol))<1e-8);return [lc,rhs,sol];}
  if(i===54||i===55){const unit=d.total/(d.p+d.qv);return [d.p+d.qv,unit,unit*d.p];}
  if(i===56){const u=(d.total-d.gap)/(2*d.p+d.qv);return [d.total-d.gap,d.qv*u,d.p*u+d.gap];}
  if(i===57){const w=(d.sum-(2*d.slow-d.fast+d.four))/4;return [(d.slow-d.fast)/10,w/10,(w+d.four)/10];}
  if(i===58){const now=(d.total+d.delta)/2;return [2*now/100,now/100,10*now];}
  if(i===59){const diff=d.enter-d.exit;return [diff,2*diff,3*diff];}
  if(i>=60&&i<=63){const p=d.x+d.y,c=d.x*d.x*d.x+d.y*d.y*d.y;return [d.kind?p:d.x**3,d.kind?p*p*p:c,3*d.x*d.y*p];}
  if(i===66){const values=Array.from(d.lines,r=>r.a-(r.b-r.c)),order=[...values].sort((a,b)=>a-b);return [values[0],values.indexOf(order[0])+1,order[4]];}
  if(i===67){const next=(1+Math.sqrt(1+4*d.more))/2;return [d.n-1,d.n*(d.n-1),next];}
  const r=(d.up-d.down)/(d.up+d.down),length=d.down*(1+r);
  assert(Math.abs(d.up*(1-r)-length)<1e-8);return [r,length,length/2];
 }
 if(i>=34){
  const f=(a,b)=>[a**2+b**2,(a+b)*(a+b),a**2-b**2,(a-b)*(a-b)][d.kind];
  const a=d.x,b=d.y;return [d.kind%2===0?a*a:d.kind===1?a+b:a-b,f(a,b),f(2*a,2*b)];
 }
 if(i===33)return [1,(d.a+d.b)-d.b,d.b-(d.a+d.b)];
 if(i>=25){
  const k=d.i,a=d.a,b=d.b,c=d.c,v=d.v;
  if(k===0)return [1,b*c,a+b*c];
  if(k===1){const rhs=c*v-a;return [2,rhs+a,(rhs+a)/c];}
  if(k===2)return [1,-c*b,-a-c*(b*v+1)];
  if(k===3)return [3,Number(a>a+1),[0,1,2,3].find(u=>a+u>a+1)];
  if(k===4)return [1,b*b*b,a*a*a-b*b*b];
  if(k===5)return [1,a-b,(a-b)*(a-b)*(a-b)];
  if(k===6)return [3,1,Array.from({length:3*c},(_,x)=>a-c+x).filter(x=>a<=x&&x<a+c).length];
  return [3,(a-a)**2,Array.from({length:2*a+1},(_,x)=>x).filter(x=>!((x-a)**2>0)).length];
 }
 if(i>=21){
  const pairs=[];for(let n=1;n<d.sum;n++)if(n%d.mod===d.first&&(d.sum-n)%d.mod===d.last)pairs.push(n);
  return [(d.sum-d.first-d.last)/d.mod,pairs.length,Math.max(...pairs)];
 }
 if(i===18){let k=0;while(k*d.price<d.fixed+k*d.unit)k++;return [d.price-d.unit,k,k*d.price-k*d.unit-d.fixed];}
 if(i===19)return [d.qty*d.price,d.qty*d.unit,d.qty*d.price-d.qty*d.unit];
 if(i===20){const limit=Math.floor((d.qty*d.price-d.fixed)/d.qty);return [d.fixed/d.qty,limit,(limit+1)*d.qty+d.fixed-d.qty*d.price];}
 if(i<12){const small=(d.overall-d.diff)/2,big=d.overall-small;if(i>=8)assert.equal(small,0);return [d.overall+d.diff,big,small];}
 if(i===12){const sol=Array.from({length:10*d.t},(_,x)=>x).filter(x=>x>=d.t&&2*x-3*(x-d.t)===x);assert.equal(sol.length,1);return [3*d.t,sol[0],sol[0]-d.t];}
 if(i===13){const sol=Array.from({length:10*(d.cut+d.c)},(_,x)=>x).filter(x=>x>=d.cut&&5*(x-d.cut)-2*x===x+d.c);assert.equal(sol.length,1);return [3,sol[0],sol[0]*d.cakes];}
 if(i===14){const sol=Array.from({length:d.total},(_,x)=>x).filter(x=>d.m*x+x-d.diff-d.cut===d.total);assert.equal(sol.length,1);return [d.m+1,sol[0],sol[0]-d.diff];}
 const corrections=Array.from(d.deltas),change=corrections.reduce((a,b)=>a+b,0);const base=(d.sum-change)/3;
 assert.equal(corrections.map(k=>k+base).reduce((a,b)=>a+b,0),d.sum);
 return [change/100,base/100,(base+corrections[d.target])/100];
}
function printedSolutions(i,l){
 if(i>=50){
  const text=l.printedGuide;
  if(i<=53||i===64||i===65){
    const variants=[x=>2*(x-9.5)-3*(x+1.8)+4.4,x=>5.7-(x-11.3)-2*(x+3.7),x=>-4*(x-7.6)-8*(x-1.8)+3.2,x=>15.3-2*(x-0.9)+0.7-3*(x-2.4),x=>-(x+15.4)+5.4-(3.7-2*x),x=>x+12.3-5*(x-5.9)-8.6];
    const j=i>53?i-60:i-50,fn=variants[j],x=-fn(0)/(fn(1)-fn(0)),pretty=String(Math.round(x*10)/10).replace('.',
     ',').replace('-','−');assert(text.includes('x = '+pretty),l.id);return;
  }
  if(i===66){
   const values=[['П',-4.3+(-3.1-7.8)],['О',-6.4+5.2-(12.7-3.5)],['Я',-(11.2-2.4-32.5)],['И',5.8+13.1-(-3.4)],['Г',3.2+15.8-(-5+4)],['Л',-(11.8-3.6)+2.5],['О',(.5+14.9)-(17.4+1.9)],['Т',(18.1-17.3+2.5)-34.5],['О',45.7-38.9+(-28.4)]];
   const sorted=values.sort((a,b)=>a[1]-b[1]);assert.equal(sorted.map(x=>x[0]).join(''),'ТОПОЛОГИЯ');for(const [ch,v] of sorted)assert(text.includes(String(Math.round(v*10)/10).replace('-', '−').replace('.',',')+' '+ch));return;
  }
  if(i>=60&&i<=63){const [a,b]=i%2?[-5,2]:[3,1],expected=i<62?a**3+b**3:(a+b)**3;assert(text.includes('Получается '+expected+'.'));return;}
  const answers={54:'348 км',55:'1 113 000 руб.',56:'421, 385, 154',57:'26,3 с',58:'625 570 руб.',59:'24 человека',67:'26',68:'75 ступеней'};assert(text.includes(answers[i]),l.id);return;
 }
 if(i>=34){const pairs=[[8,2],[-4,3],[7,-5],[-9,-6]],j=i-34,[a,b]=pairs[j%4];
  const v=[a*a+b*b,(a+b)**2,a*a-b*b,(a-b)**2][Math.floor(j/4)];assert(l.printedGuide.includes('получается '+v+'.'));return;}
 if(i>=25){assert(l.printedGuide.length>45);if(i===28)assert(l.printedGuide.includes('ложно'));return;}
 if(i<12){
   const input=[[208,50],[180,46],[242,110],[210,62]][i%4];
   const expected=i>=8?input[0]:(input[0]+input[1])/2;
   assert(l.printedGuide.includes(String(expected)));
   if(i>=8){assert(l.printedGuide.includes('y = 0'));assert(l.printedGuide.includes('в этой формулировке не участвует'));}
   return;
 }
 if(i<21){const expected=['12 лет','30 яиц','540 м','97 680 руб.','32,68 км','115,89 т','1900 дисков','640 000 руб.','400 руб.'][i-12];assert(l.printedGuide.includes(expected),l.id);return;}
 const groups=[[12,5,3,4],[28,8,5,7],[44,11,9,2],[47,15,11,6]];const [sum,d,a,b]=groups[i-21],expected=[];
 for(let x=1;x<sum;x++)if(x%d===a&&(sum-x)%d===b)expected.push([x,sum-x]);
 const actual=[...l.printedGuide.matchAll(/\((\d+); (\d+)\)/g)].map(m=>[Number(m[1]),Number(m[2])]);
 assert.deepEqual(actual,expected,l.id);
}
function click(doc,id){const el=doc.querySelector('[data-action="'+id+'"]');assert(el,id);el.click();}
function reply(doc,v){const a=doc.querySelector('#answer');a.value=v;const E=doc.defaultView.Event;a.dispatchEvent(new E('input',{bubbles:true}));doc.querySelector('#work form').dispatchEvent(new E('submit',{bubbles:true,cancelable:true}));}
for(const [i,entry] of book.exercises.entries()){
 assert.equal(entry.path,entry.boardPath);assert.equal(entry.page,i<12?6:i<21?7:i<57?8:9);
 let {dom,w,doc,key,lesson}=open(entry);
 assert.equal(doc.querySelector('#lesson').value,lesson.id);assert.equal(doc.querySelectorAll('#lesson option').length,69);
 assert.equal(new URL(doc.querySelector('#board').href).searchParams.get('trainer'),entry.path);
 assert.equal(doc.querySelector('#source').hash,i<12?'#page=8':i<21?'#page=9':i<57?'#page=10':'#page=11');assert(doc.querySelector('#worked-data svg[aria-label]'));
 assert.deepEqual(JSON.parse(w.localStorage.getItem(key)).results,[]);
 assert(!doc.querySelector('#work').textContent.includes(lesson.printedGuide));click(doc,'printed-guide');assert(doc.querySelector('#work').textContent.includes(lesson.printedGuide));
 assert.equal(w.MathExamTopicEdition.nextId(lesson),ids[i+1]&&'101-'+ids[i+1]);
 printedSolutions(i,lesson);const seen=new Set();
 for(let s=1;s<=11;s++){
  const d=lesson.make(s),answers=oracle(i,d);seen.add(JSON.stringify([d.caption,d.rows]));
  d.questions.forEach((q,j)=>{assert(Math.abs(q.answer-answers[j])<1e-7,lesson.id+'/'+s+'/'+j);for(const [bad,msg] of q.mistakes){assert.notEqual(bad,q.answer);assert(msg.length>=20);}});
 }
 assert.equal(seen.size,11,lesson.id);
 click(doc,'practice');reply(doc,99999999);
 const saved=w.localStorage.getItem(key);dom.window.close();({dom,w,doc,key,lesson}=open(entry,saved));
 assert.equal(doc.querySelector('#answer').value,'99999999');
 reply(doc,oracle(i,lesson.make(2))[2]);click(doc,'next');
 for(let j=0;j<3;j++){
  const d=lesson.make(4+j);
  if(j===0){const [bad,msg]=d.questions[j].mistakes[0];reply(doc,bad);assert(doc.querySelector('#feedback').textContent.includes(msg));}
  if(j===2)click(doc,'hint');reply(doc,oracle(i,d)[j]);click(doc,'next');
 }
 assert.deepEqual(JSON.parse(w.localStorage.getItem(key)).results,['fixed','first','help']);
 click(doc,'again');assert.equal(JSON.parse(w.localStorage.getItem(key)).variant,7);dom.window.close();
}
console.log('Peterson 7, part 1 (2011): 19 numbered sections and 3 reviews, 69 exact original entries, 2277 model answers, all 69 independent corrections, help, return and retry. The literal repeated n in 1(3) is preserved for all four numeric sets.');
