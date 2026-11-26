'use strict';
const test=require('node:test'), assert=require('node:assert/strict');
const all=require('../trainers/like-terms-factory-polynomials.js');
const stages=['identities','rational','applications'];
const step=(k,id)=>all[k].steps.find(s=>s.id===id);
const answer=(k,id)=>step(k,id).fields.map(f=>f.expected);
function check(k,id,vals,status,index){
  const v=all[k].grade(step(k,id),vals);
  assert.equal(v.status,status,k+': '+id+' '+vals.join(' | '));
  assert.equal(v.done,status==='correct');
  if(index!==undefined)assert.equal(v.index,index);
}
function change(k,id,index,value,status){
  const vals=answer(k,id);vals[index]=value;check(k,id,vals,status,index);
}
test('every fixture and distinct stable stage keys; independent checkpoints',()=>{
  assert.deepEqual(all.steps.map(s=>s.id),['standard','degree','distribute','factor','factor-two-letters','independent-factor','independent-area']);
  assert.equal(all.grouping.steps.length,8);
  assert.deepEqual(stages.map(k=>all[k].steps.length),[9,10,10]);
  assert.deepEqual(stages.map(k=>all[k].steps.filter(s=>s.checkpoint).length),[3,1,2]);
  assert.equal(new Set([all.storageKey,all.grouping.storageKey,...stages.map(k=>all[k].storageKey)]).size,5);
  for(const k of stages){
    assert.equal(new Set(all[k].steps.map(s=>s.id)).size,all[k].steps.length);
    for(const s of all[k].steps){check(k,s.id,answer(k,s.id),'correct');for(const v of s.variants||[])check(k,s.id,v,'correct');}
  }
});
test('identity structures, signs, six products, equivalent ordering and failed false square',()=>{
  check('identities','reverse-square',['3x','5','30x','5+3x','25+30x+9x²'],'correct');
  change('identities','not-square',0,'10x','wrong');
  change('identities','cube-sum',1,'x³+6x²+12x+8','terms');
  change('identities','cube-sum',2,'x³+8','wrong');
  change('identities','cube-difference',0,'4x²+4x+1','wrong');
  change('identities','cube-difference',2,'8x³-12x²-6x-1','wrong');
  change('identities','sum-cubes',1,'4x²+6x+9','wrong');
  change('identities','sum-cubes',2,'8x³+27','terms');
  change('identities','difference-cubes',1,'9a²-6a+4','wrong');
  change('identities','independent-square',0,'4y+5','wrong');
  change('identities','independent-chain',0,'3','wrong');
  check('identities','independent-chain',['3x','x²-4','x+2','x-2','-12x+3x³'],'correct');
  change('identities','independent-identity',2,'16+0x','collect');
});
test('domain, division by zero, original holes, and common denominators',()=>{
  change('rational','domain',0,'-1;4','domain');
  change('rational','domain',1,'1/0','number');
  change('rational','cancel-monomial',0,'нет','domain');
  change('rational','cancel-monomial',1,'6','wrong');
  change('rational','cancel-square',0,'нет','domain');
  check('rational','cancel-two-denominator',['{2;-3}','x+3','x-2','2+x','3+x'],'correct');
  change('rational','cancel-two-denominator',0,'-3','domain');
  change('rational','cancel-two-denominator',0,'2','domain');
  change('rational','illegal-cancel',1,'2','number');
  check('rational','illegal-cancel',['-3','1,75','4/2'],'correct');
  change('rational','same-denominator',2,'2x+4','wrong');
  change('rational','different-denominators',1,'x-2','wrong');
  change('rational','different-denominators',4,'(x-2)(x+2)','expand');
  change('rational','different-denominators',0,'2','domain');
  change('rational','multiply-fractions',0,'2','domain');
  change('rational','divide-fractions',0,'-2','domain');
  change('rational','divide-fractions',0,'3','domain');
  change('rational','divide-fractions',1,'x-3','wrong');
  change('rational','independent-rational',0,'нет','domain');
  check('rational','independent-rational',['3;-3','3+x','2','1+x'],'correct');
});
test('exact roots and equivalence; extraneous roots rejected; signs and open holes',()=>{
  check('applications','zero-product',['1,5','-4.0','{3/2;-4}'],'correct');
  change('applications','zero-product',2,'-4','roots');
  change('applications','zero-product',2,'-4;1.5001','roots');
  change('applications','zero-product',2,'-4;3/0','roots');
  change('applications','excluded-root',3,'2','roots');
  change('applications','excluded-root',0,'нет','domain');
  check('applications','excluded-root',['2','2+x','2','∅'],'correct');
  change('applications','numerator-roots',2,'2;3','roots');
  change('applications','rational-equation',0,'-1','domain');
  check('applications','rational-equation',['1;-1','2+2x','-3+3x','5','0,5'],'correct');
  change('applications','negative-inequality',2,'[-1;+∞)','intervals');
  change('applications','negative-inequality',2,'(-∞;-1)','intervals');
  check('applications','negative-inequality',['6-2x','2','(-inf;-1/1]'],'correct');
  change('applications','rational-sign',3,'+','sign');
  change('applications','rational-sign',5,'(-∞;-1]∪[2;+∞)','intervals');
  change('applications','rational-sign',5,'(-∞;-1)∪(2;+∞)','intervals');
  check('applications','rational-sign',['-1','2','+','−','+','[2;+inf) U (-inf;-1)'],'correct');
  check('applications','rational-sign',['-1','2','+','-','+','(-∞;-1)∪[2;2]∪(2;+∞)'],'correct');
  check('applications','rational-sign',['-1','2','+','-','+','(2;+∞)∪(-∞;-1)∪[4/2;2,0]'],'correct');
  change('applications','rational-sign',5,'(-∞;-1)∪[-1;-1]∪[2;+∞)','intervals');
  change('applications','rational-sign',5,'(-∞;-1)∪(2;2)∪(2;+∞)','intervals');
  change('applications','rational-sign',5,'(-∞;-1)∪[2;2)∪(2;+∞)','intervals');
  change('applications','rational-sign',5,'(-∞;-1)∪[2;+∞)∪[0;0]','intervals');
  change('applications','rational-sign',5,'(-∞;-1)∪[3;2]∪[2;+∞)','intervals');
  change('applications','rational-sign',5,'(-∞;-1)∪[2;+∞)∪[+∞;+∞]','intervals');
  change('applications','independent-inequality',5,'(-3;2)∪[2;2]','intervals');
  change('applications','independent-identity-domain',2,'(-∞;-3)∪[-3;-3]∪(-3;+∞)','intervals');
  change('applications','independent-inequality',5,'[-3;2)','intervals');
  change('applications','independent-identity-domain',2,'(-∞;+∞)','intervals');
  change('applications','independent-identity-domain',2,'(-∞;-3]∪(-3;+∞)','intervals');
  check('applications','independent-identity-domain',['-3','x-3','(-∞;-4]∪(-4;-3)∪(-3;+∞)'],'correct');
});
test('all prior keys unchanged; new stage resumes drafts, rejects false completion, tolerates denial',()=>{
  const previous=['mathExamCourseProgress.v1','likeTermsFactory.brackets.v1',all.storageKey,all.grouping.storageKey];
  const saved=new Map(previous.map(k=>[k,'{"untouched":true}']));
  const storage={getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,v)};
  for(const k of stages){
    const w=all[k],s=w.steps[0],values=s.fields.map(f=>f.expected);
    const a=w.createStore(storage),b=w.createStore(storage);
    a.update(p=>{p.records[s.id].drafts[0]=values[0]});
    b.update(p=>{p.records[s.id].drafts[1]=values[1]});
    assert.deepEqual(a.read().records[s.id].drafts.slice(0,2),values.slice(0,2));
    b.update(p=>{Object.assign(p.records[s.id],{drafts:values,done:true,first:'correct',attempts:1});});
    assert.equal(a.read().records[s.id].done,true);
    assert.equal(w.cleanProgress({records:{[s.id]:{done:true,drafts:s.fields.map(()=> 'garbage')}}}).records[s.id].done,false);
    const cp=w.steps.find(s=>s.checkpoint);
    assert.equal(w.cleanProgress({records:{[cp.id]:{hints:99}}}).records[cp.id].hints,0);
    const denied=w.createStore({getItem(){throw Error('denied')},setItem(){throw Error('denied')}});
    denied.update(p=>{p.records[s.id].drafts[0]='unfinished';});
    assert.equal(denied.read().records[s.id].drafts[0],'unfinished');
  }
  for(const k of previous)assert.equal(saved.get(k),'{"untouched":true}');
});

test('spaces between tokens are allowed, spaces within digit strings are never silently joined',()=>{
  change('applications','linear',4,'1 3','number');
  change('applications','zero-product',0,'1 5/10','number');
  change('rational','domain',0,'0 4','domain');
  change('applications','zero-product',2,'{3/2; -0 4}','roots');
  change('applications','negative-inequality',2,'(-∞;-0 1]','intervals');
  change('applications','rational-sign',5,'(-∞;-1)∪[0 2;+∞)','intervals');
  change('applications','linear',4,'1\u00a03','number');
  check('applications','linear',['4x-11','3x','18','6',' 13 '],'correct');
  check('applications','rational-equation',['1; -1','2x+2','3x-3','5','1 / 2'],'correct');
  check('applications','zero-product',['1, 5','-4','{3 / 2; -4}'],'correct');
  check('applications','negative-inequality',['-2x+6','2','( -∞ ; -1 ]'],'correct');
  check('applications','rational-sign',['-1','2','+','−','+','(-∞; -1) U [2; +∞)'],'correct');
});

test('either sign of the least-degree common denominator, consistently throughout',()=>{
  const id='different-denominators', k='rational';
  const alt=['-2;2','-x-2','-x+2','-4x+4','-x²+4'];
  check(k,id,alt,'correct');
  check(k,id,['{2;-2}','−х−2','2−х','4−4х','4−х2'],'correct');
  const w=all[k], item=step(k,id);
  for(const [i,bad] of [[0,'2'],[0,'-2;2;0'],[1,'x+2'],[2,'x-2'],[3,'4x-4'],[4,'x²-4'],[4,'(2-x)(x+2)']]){
    const v=alt.slice();v[i]=bad;
    assert.equal(w.grade(item,v).done,false);
  }
  assert.equal(w.grade(item,['-2;2','2x+4','2x-4','8x-8','2x²-8']).done,false);
});
test('alternate common denominator preserves previous history and reloads without false completion',()=>{
  const w=all.rational, id='different-denominators';
  const alt=['-2;2','-x-2','-x+2','-4x+4','-x²+4'];
  const canonical=answer('rational',id);
  const map=new Map([['likeTermsFactory.brackets.v1','previous']]);
  const storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};
  const a=w.createStore(storage);
  const old={drafts:canonical,done:true,first:'wrong',attempts:2,hints:1};
  a.update(p=>{p.current=id;Object.assign(p.records[id],old)});
  assert.deepEqual(w.createStore(storage).read().records[id],old);
  const alternate={...old,drafts:alt};
  a.update(p=>Object.assign(p.records[id],alternate));
  assert.deepEqual(w.createStore(storage).read().records[id],alternate);
  const wrong=alt.slice();wrong[0]='2';
  assert.equal(w.cleanProgress({records:{[id]:{...alternate,drafts:wrong}}}).records[id].done,false);
  assert.equal(map.get('likeTermsFactory.brackets.v1'),'previous');
});
