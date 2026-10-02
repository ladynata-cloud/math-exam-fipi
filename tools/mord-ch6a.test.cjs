'use strict';
/* Independent oracle transcribed from the supplied exercises. No expected
   answer from lesson metadata is used to derive the mathematical oracle. */
const assert = require('node:assert/strict');
const test = require('node:test');
const lessons = require('../ege-profil/circle/chapter6a.js');
const tasks = lessons.flatMap(l => l.tasks);
const P = Math.PI, sin=Math.sin, cos=Math.cos, tan=Math.tan;
const cot=t=>cos(t)/sin(t);
const alphabet=['а','б','в','г'];
const find=(book,part)=>{const t=tasks.find(t=>t.book===book&&t.part===part);assert.ok(t,`missing ${book}${part}`);return t;};
const field=(t,id)=>{const f=t.fields.find(f=>f.id===id);assert.ok(f,`${t.id}: missing ${id}`);return f;};
const label=f=>{const o=f.options.find(o=>o.value===f.expected);assert.ok(o,`unknown choice ${f.id}`);return o.label;};
const close=(actual,expected,why='')=>assert.ok(Math.abs(actual-expected)<1e-8,`${why}: got ${actual}; expected ${expected}`);
const normalized=t=>((t%(2*P))+2*P)%(2*P);
const circularClose=(a,b)=>Math.abs(Math.sin((a-b)/2))<1e-8;

test('74 exact source subparts, ordered 8 lessons, valid data and opaque choices',()=>{
  assert.equal(lessons.length,8); assert.equal(tasks.length,74);
  assert.equal(new Set(tasks.map(t=>t.id)).size,74);
  for(let number=1;number<=19;number++){
    const parts=number===7?alphabet.slice(0,2):alphabet;
    assert.deepEqual(tasks.filter(t=>t.book===`6.${number}`).map(t=>t.part),parts);
  }
  for(const l of lessons){
    assert.equal(l.chapter,6);assert.ok(l.intro.length>200);assert.ok(l.summary);assert.ok(l.lab);
    for(const t of l.tasks){
      assert.ok(t.steps.length>=2,t.id);assert.ok(t.explanation.length>0,t.id);
      assert.equal(t.meta.source,'user-supplied-textbook');
      for(const question of [...t.steps,{fields:t.fields}]){
        const ids=question.fields.map(f=>f.id);assert.equal(new Set(ids).size,ids.length,t.id);
        for(const f of question.fields){
          if(f.kind==='number'||f.kind==='point') assert.ok(Number.isFinite(f.expected),t.id);
          else if(f.kind==='choice'){
            assert.ok(f.options.length>=3,t.id);assert.equal(new Set(f.options.map(o=>o.label)).size,f.options.length,t.id);
            assert.ok(f.options.every(o=>/^[a-z]$/.test(o.value)),t.id);label(f);
          }else assert.fail(`unsupported field ${f.kind}`);
        }
      }
    }
  }
});

test('6.1–6.5 all 20 angles: independently calculated sin, cos, tg, coordinates and placement',()=>{
  const inputAngles={
    '6.1':[0,P/2,3*P/2,P],
    '6.2':[-2*P,-P/2,-3*P/2,-P],
    '6.3':[5*P/6,5*P/4,7*P/6,7*P/4],
    '6.4':[-7*P/4,-4*P/3,-5*P/6,-5*P/3],
    '6.5':[13*P/6,-8*P/3,23*P/6,-11*P/4]
  };
  for(const [book,angles] of Object.entries(inputAngles)) angles.forEach((angle,i)=>{
    const t=find(book,alphabet[i]);
    close(field(t,'sin').expected,sin(angle),t.id+' sine');
    close(field(t,'cos').expected,cos(angle),t.id+' cosine');
    const tf=field(t,'tan');
    if(Math.abs(cos(angle))<1e-10) assert.equal(label(tf),'Не существует');
    else close(tf.expected,tan(angle),t.id+' tangent');
    assert.ok(circularClose(t.steps[0].fields[0].expected,angle),t.id+' point');
    close(t.steps[1].fields.find(f=>f.id==='x').expected,cos(angle),t.id+' x');
    close(t.steps[1].fields.find(f=>f.id==='y').expected,sin(angle),t.id+' y');
    assert.match(label(t.steps[2].fields[0]),/y на x/);
  });
});

test('6.6–6.9 all 14 numerical expressions from source, including zero factors',()=>{
  const oracle={
    '6.6':[
      sin(-P/4)+cos(P/3)+cos(-P/6),
      cos(P/6)*cos(P/4)*cos(P/3)*cos(P/2),
      sin(-P/2)-cos(-P)+sin(-3*P/2),
      sin(P/6)*sin(P/4)*sin(P/3)*sin(P/2)
    ],
    '6.7':[
      sin(-3*P/4)+cos(-P/4)+sin(P/4)*cos(P/2)+cos(0)*sin(P/2),
      cos(5*P/3)+cos(4*P/3)+sin(3*P/2)*sin(5*P/8)*cos(3*P/2)
    ],
    '6.8':[tan(P/4)+cot(5*P/4),cot(P/3)-tan(P/6),tan(P/6)-cot(P/6),tan(9*P/4)+cot(P/4)],
    '6.9':[tan(P/4)*sin(P/3)*cot(P/6),2*sin(P)+3*cos(P)+cot(P/2),2*sin(P/3)*cos(P/6)-.5*tan(P/3)**2,2*tan(0)+8*cos(3*P/2)-6*sin(P/3)**2]
  };
  for(const [book,answers] of Object.entries(oracle)) answers.forEach((answer,i)=>close(field(find(book,alphabet[i]),'result').expected,answer,book+alphabet[i]));
  assert.match(label(find('6.6','б').steps[0].fields[0]),/^cos\(π\/2\)$/);
  assert.match(label(find('6.7','б').steps[1].fields[0]),/cos\(3π\/2\) = 0/);
  const stepOracle={
    '6.6а':[[sin(-P/4),cos(-P/6)],[cos(P/3)]],
    '6.6в':[[sin(-P/2),cos(-P),sin(-3*P/2)],[-cos(-P)]],
    '6.6г':[[sin(P/6),sin(P/4)],[sin(P/3),sin(P/2)]],
    '6.7а':[[sin(-3*P/4),cos(-P/4)],[sin(P/4)*cos(P/2),cos(0)*sin(P/2)]],
    '6.8а':[[tan(P/4)],[cot(5*P/4)]], '6.8б':[[cot(P/3)],[tan(P/6)]],
    '6.8в':[[tan(P/6)],[cot(P/6)]], '6.8г':[[tan(9*P/4)],[cot(P/4)]],
    '6.9а':[[tan(P/4),sin(P/3)],[cot(P/6)]], '6.9б':[[sin(P),cos(P)],[cot(P/2)]],
    '6.9в':[[2*sin(P/3)*cos(P/6)],[tan(P/3)**2]], '6.9г':[[tan(0),cos(3*P/2)],[sin(P/3)**2]]
  };
  for(const [key,steps] of Object.entries(stepOracle)){
    const t=find(key.slice(0,-1),key.slice(-1));
    steps.forEach((answers,j)=>answers.forEach((answer,k)=>close(t.steps[j].fields[k].expected,answer,key+' step '+j)));
  }
});

test('6.10 reciprocal product and all four actual input angles have valid domains',()=>{
  [[P/5,1],[2.3,3],[P/7,1],[P/12,7]].forEach(([angle,k],i)=>{
    assert.ok(Math.abs(sin(angle))>1e-8&&Math.abs(cos(angle))>1e-8);
    const t=find('6.10',alphabet[i]); close(field(t,'result').expected,k*tan(angle)*cot(angle),t.id);
    assert.match(label(t.steps[0].fields[0]),/sin t ≠ 0 и cos t ≠ 0/);
    close(t.steps[1].fields[0].expected,tan(angle)*cot(angle),t.id);
  });
});

test('6.11 identities preserve exact domains and source typo is explicitly disproved',()=>{
  const candidates=[.17,.62,1.21,2.41,3.3,4.5,5.9,-.3,-2.4];
  const actual=[x=>sin(x)*cot(x),x=>sin(x)/tan(x),x=>cot(x)*tan(x),x=>cos(x)/cot(x)];
  const correct=[cos,cos,()=>1,sin];
  alphabet.forEach((part,i)=>{
    const t=find('6.11',part);
    for(const x of candidates) close(actual[i](x),correct[i](x),t.id);
    const domain=label(field(t,'domain'));
    if(i===0) assert.match(domain,/^sin t ≠ 0; t ≠ πk/);
    else assert.match(domain,/^sin t ≠ 0 и cos t ≠ 0; t ≠ πk\/2/);
  });
  const typo=find('6.11','в');
  assert.match(typo.prompt,/ctg t · tg t = sin t/);
  assert.match(typo.explanation,/опечатка/);
  assert.match(label(field(typo,'verdict')),/неверно/);
  close(typo.steps[1].fields[0].expected,cot(P/4)*tan(P/4));
  close(typo.steps[1].fields[1].expected,sin(P/4));
  assert.ok(Math.abs(cot(P/4)*tan(P/4)-sin(P/4))>.2);
  // Defined at pi/2 only for the first identity; the two quotient forms
  // retain the additional zero-divisor restriction after simplification.
  assert.ok(Math.abs(sin(P/2))>1e-8);
  assert.match(label(field(find('6.11','б'),'domain')),/cos t ≠ 0/);
  assert.match(label(field(find('6.11','г'),'domain')),/sin t ≠ 0/);
});

test('6.12 four simplifications against independent formulas and retained exclusions',()=>{
  const original=[x=>sin(x)*cos(x)*tan(x),x=>sin(x)*cos(x)*cot(x)-1,x=>sin(x)**2-tan(x)*cot(x),x=>(1-cos(x)**2)/(1-sin(x)**2)];
  const simplified={'sin²t':x=>sin(x)**2,'−sin²t':x=>-(sin(x)**2),'−cos²t':x=>-(cos(x)**2),'tg²t':x=>tan(x)**2};
  const exact=['sin²t','−sin²t','−cos²t','tg²t'];
  const allowedDomain=[/^cos t ≠ 0;/,/^sin t ≠ 0;/,/^sin t ≠ 0 и cos t ≠ 0;/,/^cos t ≠ 0;/];
  alphabet.forEach((part,i)=>{
    const t=find('6.12',part), selected=label(field(t,'result'));
    assert.equal(selected,exact[i]); assert.match(label(field(t,'domain')),allowedDomain[i]);
    for(const x of [.19,.81,1.13,2.2,3.7,4.23,5.7,-.8]) close(original[i](x),simplified[selected](x),t.id);
  });
});

test('6.13–6.14 argument versus square of value, independently calculated',()=>{
  const args=[[P/2,2,cos],[-P/3,.5,sin],[-P/6,2,sin],[2*P/3,.5,cos]];
  args.forEach(([t,m,f],i)=>{
    const task=find('6.13',alphabet[i]);close(field(task,'result').expected,f(m*t),task.id);
    close(task.steps[0].fields[0].expected,m*t,task.id);assert.ok(circularClose(task.steps[1].fields[0].expected,m*t));
  });
  [[P/3,-1],[P/4,1],[P/4,-1],[P/6,1]].forEach(([angle,sign],i)=>{
    const t=find('6.14',alphabet[i]);close(field(t,'result').expected,sin(angle)**2+sign*cos(angle)**2,t.id);
    close(t.steps[0].fields[0].expected,sin(angle));close(t.steps[0].fields[1].expected,cos(angle));
    close(t.steps[1].fields[0].expected,sin(angle)**2);close(t.steps[1].fields[1].expected,cos(angle)**2);
  });
});

test('6.15 extrema reached at actual circle points; negative factors reverse endpoints',()=>{
  const fn=[x=>2*sin(x),x=>3+4*cos(x),x=>-3*cos(x),x=>3-5*sin(x)];
  alphabet.forEach((part,i)=>{
    const t=find('6.15',part), lo=field(t,'min').expected,hi=field(t,'max').expected;
    const extremeValues=[0,P/2,P,3*P/2].map(fn[i]);
    close(lo,Math.min(...extremeValues),t.id);close(hi,Math.max(...extremeValues),t.id);
    for(let j=0;j<=64;j++){const v=fn[i](j*P/32);assert.ok(v>=lo-1e-9&&v<=hi+1e-9,t.id);}
  });
  assert.ok(find('6.15','в').steps[1].fields[0].expected>find('6.15','в').steps[1].fields[1].expected);
  assert.ok(find('6.15','г').steps[1].fields[0].expected>find('6.15','г').steps[1].fields[1].expected);
});

function coefficient(s){
  s=s.replace(/−/g,'-');
  if(s==='0')return 0;
  const m=s.match(/^([+-]?\d*)π(?:\/(\d+))?$/);assert.ok(m,'cannot parse angle '+s);
  return (m[1]===''||m[1]==='+'?1:m[1]==='-'?-1:Number(m[1]))*P/(m[2]?Number(m[2]):1);
}
function solutionsFromChoice(text){
  if(text==='Решений нет')return [];
  const generated=[];
  for(let part of text.split('или')){
    part=part.replace(/\s/g,'').replace(/^t=/,'');
    let offset='0', period;
    if(part==='2πk'||part==='πk')period=part==='2πk'?2*P:P;
    else {const m=part.match(/^(.*)\+(2?)πk$/);assert.ok(m,'cannot parse family '+part);offset=m[1];period=m[2]?2*P:P;}
    const offsets=offset.startsWith('±')?[coefficient(offset.slice(1)),-coefficient(offset.slice(1))]:[coefficient(offset)];
    for(const base of offsets) for(let k=-6;k<=6;k++)generated.push(base+period*k);
  }
  return generated;
}
function oracleRoots(fn,value){
  if(Math.abs(value)>1)return [];
  const a=fn===sin?Math.asin(value):Math.acos(value);
  const candidates=fn===sin?[a,P-a]:[a,-a];
  const roots=[]; for(const v of candidates)if(!roots.some(r=>circularClose(r,v)))roots.push(normalized(v));
  return roots;
}
function verifySolutionSet(t,fn,value,fieldId){
  const actual=solutionsFromChoice(label(field(t,fieldId))),roots=oracleRoots(fn,value);
  if(!roots.length){assert.deepEqual(actual,[],t.id);return;}
  assert.ok(actual.length>0,t.id);
  for(const angle of actual)close(fn(angle),value,t.id+' generated angle '+angle);
  for(const root of roots)for(let k=-2;k<=2;k++)assert.ok(actual.some(v=>Math.abs(v-(root+2*P*k))<1e-8),t.id+' missing branch '+root+' at '+k);
  for(const angle of actual)assert.ok(roots.some(r=>circularClose(r,angle)),t.id+' extraneous branch');
  const countStep=t.steps.find(s=>s.fields[0].id==='count');
  if(countStep){const f=countStep.fields[0];assert.equal(f.kind==='choice'?Number(label(f)):f.expected,roots.length,t.id+' point count');}
  if(t.lab) {assert.equal(t.lab.axis,fn===sin?'y':'x');close(t.lab.threshold,value);}
}

test('6.16–6.18 full solution families, both branches, all turns, impossible values',()=>{
  const cases={
    '6.16':[[cos,Math.SQRT1_2],[sin,-.5],[cos,-.5],[sin,Math.SQRT1_2]],
    '6.17':[[sin,-Math.sqrt(3)/2],[sin,Math.sqrt(3)],[cos,-Math.sqrt(3)/2],[cos,-P/3]],
    '6.18':[[sin,-1],[cos,1],[sin,.5],[cos,.5]]
  };
  for(const [book,cs] of Object.entries(cases))cs.forEach(([fn,value],i)=>{
    const t=find(book,alphabet[i]);verifySolutionSet(t,fn,value,'solutions');close(t.steps[0].fields[0].expected,value);
    const points=t.steps.flatMap(s=>s.fields).filter(f=>f.kind==='point').map(f=>f.expected),roots=oracleRoots(fn,value);
    assert.equal(points.length,roots.length,t.id);
    for(const root of roots)assert.ok(points.some(p=>circularClose(p,root)),t.id+' missing guided point');
  });
});

test('6.19 excludes every zero denominator, including zero-over-zero and both cos=0 branches',()=>{
  const cases=[[cos,0],[sin,Math.sqrt(3)/2],[sin,1],[cos,.5]];
  cases.forEach(([fn,value],i)=>verifySolutionSet(find('6.19',alphabet[i]),fn,value,'excluded'));
  assert.match(find('6.19','а').prompt,/sin t − 1/);
  assert.match(find('6.19','в').prompt,/3 − 3 sin t/);
  const a=solutionsFromChoice(label(field(find('6.19','а'),'excluded')));
  assert.ok(a.some(t=>Math.abs(t-P/2)<1e-8));assert.ok(a.some(t=>Math.abs(t-3*P/2)<1e-8));
  close(sin(P/2)-1,0);close(cos(P/2),0); // Both-zero point is still excluded.
  const c=solutionsFromChoice(label(field(find('6.19','в'),'excluded')));
  assert.ok(c.some(t=>Math.abs(t-P/2)<1e-8));assert.ok(!c.some(t=>Math.abs(t-3*P/2)<1e-8));
  for(const t of c){close(3-3*sin(t),0);close(cos(t),0);}
});
