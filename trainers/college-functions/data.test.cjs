'use strict';

// Independent formula fixtures deliberately do not call the model evaluator or
// derive expected values/properties from data.js model parameters.
const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('./data.js');
const byId = Object.fromEntries(D.tasks.map(t => [t.id, t]));
const inf = Infinity;
const refs = {
  B1:x=>Math.sqrt(x+2), B2:x=>Math.sqrt(x-3),
  B3:x=>Math.sqrt(x)+2, B4:x=>Math.sqrt(x)-2,
  B5:x=>1+Math.sqrt(2*x), B6:x=>Math.sqrt(3-x),
  B7:x=>-Math.sqrt(x+1), B8:x=>2-Math.sqrt(x-1),
  C1:x=>x*x-4*x+3, C2:x=>x*x+2*x-3,
  C3:x=>(x-2)**2+1, C4:x=>-((x+1)**2)+4,
  C5:x=>x*x-2*x+10, C6:x=>-x*x+4*x,
  C7:x=>2*x*x-8, C8:x=>-2*(x-1)**2-3,
  D1:x=>2**x, D2:x=>0.5**x, D3:x=>2**(x-1), D4:x=>3**x-1,
  D5:x=>0.5**x+2, D6:x=>2-2**x, D7:x=>1.5**(x-2)+2,
  D8:x=>(1/3)**(x+1)-1,
  E1:x=>Math.log2(x+1), E2:x=>Math.log2(x-2),
  E3:x=>Math.log(x)/Math.log(3)+1, E4:x=>Math.log2(3-x),
  E5:x=>Math.log(x)/Math.log(0.5), E6:x=>Math.log(x+1)/Math.log(2/3),
  E7:x=>Math.log(x+1)/Math.log(3)+1, E8:x=>2-Math.log2(x-1),
  F1:x=>x<0?x+2:2-x,
  F2:x=>x<1?-x:x-2,
  F3:x=>x<2?x+1:2*x-2,
  F4:x=>x<2?2*x-2:x+1,
  F5:x=>x< -3?-x-3:x<0?x+3:x<3?-2*x+3:x/2-9/2,
  F6:x=>x<1?x*x:x+1,
  F7:x=>x<0?NaN:x<4?Math.sqrt(x):3,
  F8:x=>x< -1?-2:x<=2?x+1:3
};
const interval=(lo,hi,lc=false,rc=false)=>({lo,hi,lc,rc});
const set=(...intervals)=>({intervals,points:[]});
const all=()=>set(interval(-inf,inf));
const expected = {
  B1:[set(interval(-2,inf,true)),set(interval(0,inf,true)),[-2]],
  B2:[set(interval(3,inf,true)),set(interval(0,inf,true)),[3]],
  B3:[set(interval(0,inf,true)),set(interval(2,inf,true)),[]],
  B4:[set(interval(0,inf,true)),set(interval(-2,inf,true)),[4]],
  B5:[set(interval(0,inf,true)),set(interval(1,inf,true)),[]],
  B6:[set(interval(-inf,3,false,true)),set(interval(0,inf,true)),[3]],
  B7:[set(interval(-1,inf,true)),set(interval(-inf,0,false,true)),[-1]],
  B8:[set(interval(1,inf,true)),set(interval(-inf,2,false,true)),[5]],
  C1:[all(),set(interval(-1,inf,true)),[1,3]],
  C2:[all(),set(interval(-4,inf,true)),[-3,1]],
  C3:[all(),set(interval(1,inf,true)),[]],
  C4:[all(),set(interval(-inf,4,false,true)),[-3,1]],
  C5:[all(),set(interval(9,inf,true)),[]],
  C6:[all(),set(interval(-inf,4,false,true)),[0,4]],
  C7:[all(),set(interval(-8,inf,true)),[-2,2]],
  C8:[all(),set(interval(-inf,-3,false,true)),[]],
  D1:[all(),set(interval(0,inf)),[]],
  D2:[all(),set(interval(0,inf)),[]],
  D3:[all(),set(interval(0,inf)),[]],
  D4:[all(),set(interval(-1,inf)),[0]],
  D5:[all(),set(interval(2,inf)),[]],
  D6:[all(),set(interval(-inf,2)),[1]],
  D7:[all(),set(interval(2,inf)),[]],
  D8:[all(),set(interval(-1,inf)),[-1]],
  E1:[set(interval(-1,inf)),all(),[0]],
  E2:[set(interval(2,inf)),all(),[3]],
  E3:[set(interval(0,inf)),all(),[1/3]],
  E4:[set(interval(-inf,3)),all(),[2]],
  E5:[set(interval(0,inf)),all(),[1]],
  E6:[set(interval(-1,inf)),all(),[0]],
  E7:[set(interval(-1,inf)),all(),[-2/3]],
  E8:[set(interval(1,inf)),all(),[5]],
  F1:[all(),set(interval(-inf,2,false,true)),[-2,2]],
  F2:[all(),set(interval(-1,inf,true)),[0,2]],
  F3:[all(),all(),[-1]],
  F4:[all(),set(interval(-inf,2),interval(3,inf,true)),[1]],
  F5:[all(),set(interval(-3,inf,true)),[-3,1.5,9]],
  F6:[all(),set(interval(0,inf,true)),[0]],
  F7:[set(interval(0,inf,true)),{intervals:[interval(0,2,true)],points:[3]},[0]],
  F8:[all(),{intervals:[interval(0,3,true,true)],points:[-2]},[-1]]
};
function num(v){return v==='-inf'?-inf:v==='inf'?inf:v;}
function close(a,b,label){
  assert.ok(a===b || Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(a),Math.abs(b)),`${label}: ${a} != ${b}`);
}
function checkIntervals(actual,want,label){
  assert.equal(actual.length,want.length,label+' interval count');
  actual.forEach((i,n)=>{
    close(num(i.lo),want[n].lo,label+' lower');close(num(i.hi),want[n].hi,label+' upper');
    assert.equal(i.lc,want[n].lc,label+' left inclusion');
    assert.equal(i.rc,want[n].rc,label+' right inclusion');
  });
}
function checkSet(actual,want,label){
  checkIntervals(actual.intervals,want.intervals,label);
  assert.equal(actual.points.length,want.points.length,label+' singleton count');
  actual.points.forEach((p,n)=>close(p,want.points[n],label+' singleton'));
}
function member(s,x){
  return s.points.some(p=>p===x)||s.intervals.some(i=>
    (x>num(i.lo)||(i.lc&&x===num(i.lo)))&&(x<num(i.hi)||(i.rc&&x===num(i.hi))));
}

test('The PDF bank has exactly 40 graph tasks and eight diagnostics, with stable IDs',()=>{
  assert.deepEqual(D.tasks.map(t=>t.id),Object.keys(refs));
  assert.deepEqual(D.diagnostics.map(d=>d.id),Array.from({length:8},(_,i)=>'A'+(i+1)));
  assert.equal(new Set(D.tasks.map(t=>t.id)).size,40);
  assert.equal(new Set(D.diagnostics.map(t=>t.id)).size,8);
  const families={B:'sqrt',C:'quadratic',D:'exponential',E:'log',F:'piecewise'};
  for(const [prefix,family]of Object.entries(families)){
    assert.equal(D.tasks.filter(t=>t.family===family).length,8);
    assert.ok(D.tasks.filter(t=>t.id.startsWith(prefix)).every(t=>t.family===family));
  }
});

test('Every task has eight retained explanations and contextual hints',()=>{
  for(const t of D.tasks){
    for(const key of ['domain','points','placepoints','range','zeros','sign','monotonicity','parity']){
      assert.ok(t.explanations[key]?.length>10,t.id+' explanation '+key);
      assert.ok(t.stepsHint[key]?.length>10,t.id+' hint '+key);
    }
    assert.ok(t.formulaText.length>2&&t.formulaHtml.length>2,t.id+' formula');
    assert.ok(t.points.length>=4&&t.points.length<=5,t.id+' table workload');
    assert.equal(t.viewport.length,4,t.id+' viewport');
    assert.ok(t.viewport.every(Number.isFinite));
    assert.ok(t.viewport[0]<t.viewport[1]&&t.viewport[2]<t.viewport[3]);
  }
});

for(const id of Object.keys(refs)){
  test(id+': independent formula, manual D/E/zeros, table values and sign samples',()=>{
    const t=byId[id],ref=refs[id],[domain,range,zeros]=expected[id];
    checkSet(t.domain,domain,id+' D');checkSet(t.range,range,id+' E');
    assert.equal(t.zeros.length,zeros.length,id+' zero count');
    t.zeros.forEach((z,n)=>{close(z,zeros[n],id+' zero');close(ref(z),0,id+' direct zero');});
    for(const p of t.points){
      close(p.y,ref(p.x),id+' independent table');
      close(D.evaluate(t,p.x),ref(p.x),id+' evaluator table');
      assert.ok(member(domain,p.x),id+' point is in domain');
    }
    // Fixed non-integer samples avoid accidentally testing only the authored
    // table or the same integer roots used by the content generator.
    for(let j=0;j<701;j++){
      const x=-15+j/20+0.00123,y=ref(x),got=D.evaluate(t,x);
      assert.equal(Number.isFinite(got),Number.isFinite(y),id+' finite at '+x);
      assert.equal(member(t.domain,x),Number.isFinite(y),id+' domain at '+x);
      if(!Number.isFinite(y))continue;
      close(got,y,id+' evaluation at '+x);
      assert.ok(member(t.range,y),id+' range contains direct y='+y);
      assert.equal(member(t.positive,x),y>0,id+' positive at '+x);
      assert.equal(member(t.negative,x),y<0,id+' negative at '+x);
    }
    // A zero is not part of either STRICT sign region.
    for(const z of t.zeros){
      assert.equal(member(t.positive,z),false,id+' excludes zero from positive');
      assert.equal(member(t.negative,z),false,id+' excludes zero from negative');
    }
  });
}

test('Root boundary values are included; signs retain a nonzero closed boundary',()=>{
  const starts={B1:[-2,0],B2:[3,0],B3:[0,2],B4:[0,-2],B5:[0,1],B6:[3,0],B7:[-1,0],B8:[1,2]};
  for(const[id,[x,y]]of Object.entries(starts)){
    assert.ok(member(byId[id].domain,x),id+' domain start');
    close(D.evaluate(byId[id],x),y,id+' starting value');
    assert.equal(byId[id].endpoints.length,1,id+' graph marker count');
    close(byId[id].endpoints[0].x,x,id+' graph marker x');
    close(byId[id].endpoints[0].y,y,id+' graph marker y');
    assert.equal(byId[id].endpoints[0].closed,true,id+' graph marker included');
  }
  assert.ok(member(byId.B3.positive,0));assert.ok(member(byId.B5.positive,0));
  assert.ok(member(byId.B4.negative,0));assert.ok(member(byId.B8.positive,1));
  assert.equal(member(byId.B8.positive,5),false);
  checkSet(byId.B8.positive,set(interval(1,5,true)), 'B8 positive includes root start');
  checkSet(byId.B4.negative,set(interval(0,4,true)), 'B4 negative includes root start');
  assert.ok(Number.isNaN(D.evaluate(byId.B1,-2.001)));
  assert.ok(Number.isNaN(D.evaluate(byId.B6,3.001)));
});

test('Logarithm boundaries are excluded and asymptotes are not graph points',()=>{
  const edges={E1:-1,E2:2,E3:0,E4:3,E5:0,E6:-1,E7:-1,E8:1};
  for(const[id,x]of Object.entries(edges)){
    assert.equal(member(byId[id].domain,x),false,id+' open boundary');
    assert.ok(Number.isNaN(D.evaluate(byId[id],x)),id+' log zero undefined');
    assert.equal(byId[id].asymptotes.length,1);
    assert.equal(byId[id].asymptotes[0].axis,'x');
    close(byId[id].asymptotes[0].value,x,id+' asymptote');
    assert.deepEqual(byId[id].endpoints,[]);
  }
  close(D.evaluate(byId.E6,-5/9),2,'log base 2/3 at argument 4/9');
  close(D.evaluate(byId.E6,-1/3),1,'log base 2/3 at argument 2/3');
  close(D.evaluate(byId.E6,0.5),-1,'log base 2/3 at argument 3/2');
  assert.ok(D.evaluate(byId.E6,-0.5)>D.evaluate(byId.E6,0.5));
  assert.ok(D.evaluate(byId.E4,1)>D.evaluate(byId.E4,2),'decreasing argument reverses log');
});

test('Horizontal exponential asymptotes never become attained range boundaries',()=>{
  const levels={D1:0,D2:0,D3:0,D4:-1,D5:2,D6:2,D7:2,D8:-1};
  for(const[id,y]of Object.entries(levels)){
    assert.deepEqual(byId[id].asymptotes,[{axis:'y',value:y}]);
    assert.equal(member(byId[id].range,y),false,id+' asymptote not in range');
  }
  close(D.evaluate(byId.D7,-1),62/27,'shifted exponential exact fraction');
  close(D.evaluate(byId.D7,2),3,'zero exponent');
  assert.ok(byId.D2.down.length===1&&byId.D2.up.length===0);
  assert.ok(byId.D6.down.length===1&&byId.D6.up.length===0);
});

test('Piecewise boundaries select exactly one row and show the correct open/filled marker',()=>{
  const boundaries={F1:[[0,2]],F2:[[1,-1]],F3:[[2,2]],F4:[[2,3]],F5:[[-3,0],[0,3],[3,-3]],F6:[[1,2]],F7:[[0,0],[4,3]],F8:[[-1,0],[2,3]]};
  for(const[id,points]of Object.entries(boundaries)){
    for(const[x,y]of points){
      close(D.evaluate(byId[id],x),y,id+' boundary');
      const matching=byId[id].model.branches.filter(b=>(x>num(b.lo)||(b.lc&&x===num(b.lo)))&&(x<num(b.hi)||(b.rc&&x===num(b.hi))));
      assert.equal(matching.length,1,id+' exactly one branch for '+x);
    }
    for(const p of byId[id].endpoints){
      if(p.closed)close(refs[id](p.x),p.y,id+' filled marker');
      else assert.notEqual(refs[id](p.x),p.y,id+' open marker value differs');
    }
  }
  assert.deepEqual(byId.F3.endpoints,[{x:2,y:3,closed:false},{x:2,y:2,closed:true}]);
  assert.deepEqual(byId.F4.endpoints,[{x:2,y:2,closed:false},{x:2,y:3,closed:true}]);
});

test('F3 downward jump prevents global increase; F4 upward jump preserves it',()=>{
  assert.ok(refs.F3(1.9)>refs.F3(2));
  checkIntervals(byId.F3.up,[interval(-inf,2),interval(2,inf,true)],'F3 separate intervals');
  assert.ok(refs.F4(1.9)<refs.F4(2));
  checkIntervals(byId.F4.up,[interval(-inf,inf)],'F4 global increase');
  assert.equal(member(byId.F4.range,2),false);
  assert.equal(member(byId.F4.range,2.5),false);
  assert.equal(member(byId.F4.range,3),true);
});

test('F6 jump has no range gap; F7 and F8 have isolated range points',()=>{
  for(const y of [0,0.5,1,1.5,2,3,20]){
    assert.ok(member(byId.F6.range,y));
    close(refs.F6(-Math.sqrt(y)),y,'F6 left branch reaches y='+y);
  }
  assert.ok(member(byId.F7.range,0));assert.ok(member(byId.F7.range,1.999));
  assert.equal(member(byId.F7.range,2),false);assert.equal(member(byId.F7.range,2.5),false);
  assert.ok(member(byId.F7.range,3));assert.equal(member(byId.F7.range,3.1),false);
  checkIntervals(byId.F7.up,[interval(0,4,true,true)],'F7 includes jump');
  checkIntervals(byId.F7.constant,[interval(4,inf,true)],'F7 constant');
  for(const y of [-1.9,-1, -0.001,3.001])assert.equal(member(byId.F8.range,y),false);
  for(const y of [-2,0,1.5,3])assert.ok(member(byId.F8.range,y));
  checkIntervals(byId.F8.constant,[interval(-inf,-1),interval(2,inf,true)],'F8 constant');
});

test('Every stated monotonic or constant section agrees with independent evaluation',()=>{
  for(const t of D.tasks){
    for(const[field,direction]of [['up',1],['down',-1],['constant',0]]){
      for(const it of t[field]){
        let l=Math.max(num(it.lo),-10),r=Math.min(num(it.hi),15);
        if(!it.lc)l+=0.0001;if(!it.rc)r-=0.0001;
        let previous=refs[t.id](l);
        for(let j=1;j<=80;j++){
          const x=j===80?r:l+(r-l)*j/80,y=refs[t.id](x);
          if(direction===0)close(y,previous,t.id+' constant');
          else assert.ok((y-previous)*direction>0,t.id+' strict '+field+' at '+x);
          previous=y;
        }
      }
    }
  }
});

test('Only C7 and F1 are even; there are no odd functions in this graph bank',()=>{
  assert.deepEqual(D.tasks.filter(t=>t.parity==='even').map(t=>t.id),['C7','F1']);
  assert.deepEqual(D.tasks.filter(t=>t.parity==='odd').map(t=>t.id),[]);
  for(const id of ['C7','F1'])for(const x of [-3,-0.5,0,1,4])close(refs[id](x),refs[id](-x),id+' even');
  assert.equal(byId.C3.parity,'neither','shifted parabola is not even');
});

test('Diagnostic keys and HTML aliases are complete and consistent',()=>{
  const keys=[0,1,2,0,1,2,0,1];
  D.diagnostics.forEach((d,i)=>{
    assert.equal(d.correct,keys[i],d.id+' key');assert.equal(d.correctId,String(keys[i]));
    assert.equal(d.optionItems[d.correct].id,d.correctId);
    assert.equal(d.optionItems.length,d.options.length);
    assert.ok(d.options[d.correct].length>0);
    assert.equal(d.questionHtml,d.promptHtml);
    assert.equal(d.recommendFamily,d.family);
    assert.ok(D.families.some(f=>f.id===d.family));
  });
  assert.equal(D.diagnostics[6].options[keys[6]],'2','A7 picks x≥2 row');
  assert.equal(D.diagnostics[7].options[keys[7]],'Чётная; нечётная; ни та ни другая');
});

test('Authored fraction/root/piecewise HTML has explicit accessible text fallback',()=>{
  assert.match(byId.D7.formulaHtml,/class="frac"/);
  assert.match(byId.E6.formulaHtml,/class="frac"/);
  assert.match(byId.B1.formulaHtml,/class="sqrt"/);
  assert.match(byId.B1.formulaHtml,/class="radicand"/);
  assert.match(byId.F5.formulaHtml,/class="piecewise"/);
  assert.match(byId.F5.formulaHtml,/class="cases"/);
  assert.equal((byId.F5.formulaHtml.match(/class="case"/g)||[]).length,4);
  for(const t of D.tasks){
    assert.doesNotMatch(t.formulaText,/<\s*\/?[A-Za-z][^>]*>/);
    assert.doesNotMatch(t.formulaHtml,/<script|javascript:|\bon\w+=/i);
  }
});
