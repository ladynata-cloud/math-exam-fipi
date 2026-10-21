'use strict';
// Focused contracts for the new owner PDF: attainable PB alignment, a restart
// that preserves answers, and a visible coordinate distance written as |…|.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=process.env.TASK19_TEST_ROOT||path.resolve(__dirname,'..');
const V=require(path.join(root,'trainers/task19-visual-models.js'));
const {cards}=require(path.join(root,'trainers/task19-visual-data.js'));
const byId=new Map(cards.map(c=>[c.id,c])),KEY='mathExam.task19.visualHints.v1';
const near=(a,b,label)=>assert(Math.abs(a-b)<1e-8,`${label}: ${a} != ${b}`);
const length=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const distanceToLine=(p,a,b)=>Math.abs((p[0]-a[0])*(b[1]-a[1])-(p[1]-a[1])*(b[0]-a[0]))/length(a,b);
const rows=result=>result.readout.map(row=>typeof row==='string'?row:row.text).join('\n');
const number=n=>(Object.is(n,-0)?0:n).toLocaleString('ru-RU').replace(/^-/,'−');
const lineHint=byId.get('prev-006').hint;

function boot(t,id,saved){
  const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
  const w=new JSDOM(fs.readFileSync(path.join(root,'trainers/task19-trainer.html'),'utf8'),{url:'https://example.test/trainers/task19-trainer.html?card='+id,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}).window;
  t.after(()=>w.close());if(saved)w.localStorage.setItem(KEY,JSON.stringify(saved));
  for(const name of ['task19-visual-data','task19-models-triangles','task19-models-circles','task19-models-lines-polygons','task19-visual-models','task19-reference','task19-visual-app'])w.eval(fs.readFileSync(path.join(root,'trainers/'+name+'.js'),'utf8'));
  return {w,errors,$:selector=>w.document.querySelector(selector),saved:()=>JSON.parse(w.localStorage.getItem(KEY)),input(key,value){const input=w.document.querySelector(`input[data-key="${key}"]`);assert(input,key+' exists');input.value=value;input.dispatchEvent(new w.Event('input',{bubbles:true}));}};
}

test('approaching B snaps to the exact line through both fixed points, only in the two-point experiment',()=>{
  for(const [start,requested] of [[20,28],[20,29],[40,32],[40,31],[29,31]]){
    const before=V.sample('lineThroughPoint',{...lineHint.params,angle:start});
    const next=V.updateModel('lineThroughPoint',before.values,'angle',requested),sample=V.sample('lineThroughPoint',next);
    assert.equal(sample.values.angle,sample.values.target);assert.equal(sample.metrics.distance,0);
    near(distanceToLine(sample.points.B,sample.points.U,sample.points.V),0,'B lies on the actual drawn line');
    assert.deepEqual(sample.points.P,before.points.P);assert.deepEqual(sample.points.B,before.points.B);
    assert.match(rows(V.render('lineThroughPoint',next)),/через обе точки P и B/);
  }
  assert.equal(V.updateModel('lineThroughPoint',lineHint.params,'angle',26).angle,26,'a distant line stays movable');
  for(const mode of ['parallel','perpendicular','many'])assert.equal(V.updateModel('lineThroughPoint',{mode,angle:20,target:30},'angle',29).angle,29,mode+' does not snap to an invisible B');
});

test('one-degree keyboard changes can leave the snap in either direction and return to it',()=>{
  for(const sign of [-1,1]){
    let p=V.updateModel('lineThroughPoint',lineHint.params,'angle',29);
    for(let step=1;step<=5;step++){p=V.updateModel('lineThroughPoint',p,'angle',p.angle+sign);assert.equal(p.angle,30+sign*step,'moving away is never trapped');}
    p=V.updateModel('lineThroughPoint',p,'angle',30+sign*2);assert.equal(p.angle,30,'approach catches B again');
  }
  const saved=V.restoreModel(lineHint,{params:{angle:30,target:80,mode:'many'},measured:true});
  assert.equal(saved.params.target,30);assert.equal(saved.params.mode,'twoPoints');assert.equal(saved.params.angle,30);
});

test('P stays above all lines with a clear halo and an offset label, including analogous modes',()=>{
  for(const card of cards.filter(c=>c.hint.model==='lineThroughPoint')){
    const control=V.controlsFor(card.hint.model,card.hint.params)[0];
    for(const angle of [control.min,30,44,90,control.max]){
      const result=V.render(card.hint.model,{...card.hint.params,angle});
      const w=new JSDOM(result.svg).window;
      try{
        const svg=w.document.querySelector('svg'),point=svg.querySelector('[data-geometry-point="P"]'),label=point.querySelector('text'),circles=point.querySelectorAll('circle');
        assert.equal(svg.lastElementChild,point,'the fixed point is drawn after every line');
        assert.equal(circles[0].getAttribute('fill'),'white');assert(Number(circles[0].getAttribute('r'))>Number(circles[1].getAttribute('r')));
        assert.equal(label.textContent,'P');assert.equal(label.getAttribute('paint-order'),'stroke fill');
        const actual=result.sample.values.angle*Math.PI/180,labelPoint=[Number(label.getAttribute('x')),Number(label.getAttribute('y'))];
        const separation=Math.abs((labelPoint[0]-280)*Math.sin(actual)+(labelPoint[1]-175)*Math.cos(actual));
        assert(separation>25,card.id+' label is offset from rotating line');
      }finally{w.close();}
    }
  }
});

test('coordinate distance uses the absolute difference for every attainable ordered pair',()=>{
  for(let a=-6;a<=6;a+=.5)for(let b=-6;b<=6;b+=.5){
    const result=V.render('coordinateMeasure',{mode:'line',a,b}),expected=Math.abs(b-a);
    near(result.sample.metrics.length,expected,'nonnegative length');near(length(result.sample.points.A,result.sample.points.B),expected,'actual points');
    const subtract=a<0?`(${number(a)})`:number(a);
    assert(rows(result).includes(`AB = |${number(b)} − ${subtract}| = |${number(b-a)}| = ${number(expected)}`),`modulus for A=${a}, B=${b}`);
    assert(!/NaN|Infinity/.test(result.svg+rows(result)));
  }
});

test('distance is visible on a highlighted AB segment; nearby/reversed/coincident points stay distinguishable',()=>{
  for(const [a,b] of [[-6,6],[6,-6],[-1.5,.5],[.5,-1.5],[-4,-1],[-1,-4],[0,.5],[.5,0],[0,0],[-6,-6],[6,6]]){
    const result=V.render('coordinateMeasure',{mode:'line',a,b}),w=new JSDOM(result.svg).window;
    try{
      const d=w.document,group=d.querySelector('[data-geometry-group="AB"]'),segment=group.querySelector('line[stroke-width="7"]');
      assert(group.textContent.includes('AB = '+number(Math.abs(b-a))));
      near(Number(segment.getAttribute('x1')),280+34*a,'segment starts at A');near(Number(segment.getAttribute('x2')),280+34*b,'segment ends at B');
      assert.equal(segment.getAttribute('y1'),segment.getAttribute('y2'));
      const texts=[...d.querySelectorAll('text')];
      if(a===b){assert(texts.some(t=>t.textContent==='A = B'));assert(!texts.some(t=>t.textContent==='A'||t.textContent==='B'));}
      else{const la=texts.find(t=>t.textContent==='A'),lb=texts.find(t=>t.textContent==='B');assert(la&&lb);assert(Math.abs(Number(la.getAttribute('x'))-Number(lb.getAttribute('x')))>=40,'close point labels stay separated in either order');}
    }finally{w.close();}
  }
});

test('midpoint construction keeps its two-coordinate controls, equal halves and existing interpretation',()=>{
  const hint=byId.get('prev-103').hint;
  assert.deepEqual(V.controlsFor(hint.model,hint.params).map(c=>c.key),['bx','by']);
  for(const bx of [-5,-3,0,5])for(const by of [-3,1,4]){
    const result=V.render(hint.model,{...hint.params,bx,by}),P=result.sample.points;
    near(P.M[0],(P.A[0]+P.B[0])/2,'midpoint x');near(P.M[1],(P.A[1]+P.B[1])/2,'midpoint y');
    near(length(P.A,P.M),length(P.B,P.M),'equal halves');
    assert.match(rows(result),/AM = /);assert.match(rows(result),/MB = /);assert(!rows(result).includes('|'));
  }
});

test('line restart and reload preserve progress and answers while resetting only the experiment',t=>{
  const f=boot(t,'prev-006');f.$('#hintToggle').click();const before=f.saved();
  f.input('angle',28);f.$('.t19-measure').click();const aligned=f.saved();
  assert.equal(aligned.current.modelState.params.angle,30);assert.equal(aligned.current.modelState.measured,true);
  f.$('#hintToggle').click();f.$('#hintToggle').click();assert.deepEqual(f.saved().current.modelState,aligned.current.modelState);
  const restored=boot(t,'prev-006',aligned);assert.equal(restored.$('input[data-key="angle"]').value,'30');assert.equal(restored.$('.t19-model-readout').hidden,false);
  restored.$('.t19-model-reset').click();const restarted=restored.saved();
  assert.equal(restarted.current.modelState.params.angle,lineHint.params.angle);assert.equal(restarted.current.modelState.measured,false);
  assert.equal(restarted.current.answer,null);assert.deepEqual(restarted.records,before.records);assert.equal(restored.$('#answerPanel').hidden,true);
  const reloaded=boot(t,'prev-006',restarted);assert.equal(reloaded.$('input[data-key="angle"]').value,String(lineHint.params.angle));assert.equal(reloaded.$('.t19-model-readout').hidden,true);
  reloaded.$('#btnTrue').click();const graded=reloaded.saved();reloaded.input('angle',28);reloaded.$('.t19-model-reset').click();
  assert.equal(reloaded.saved().current.answer,true);assert.deepEqual(reloaded.saved().records,graded.records);assert.equal(graded.records['prev-006'].attempts,1);
  assert.deepEqual(f.errors.concat(restored.errors,reloaded.errors),[]);
});

test('the same restart works in every related line experiment without appearing on unrelated models',t=>{
  for(const card of cards.filter(c=>c.hint.model==='lineThroughPoint')){
    const f=boot(t,card.id);f.$('#hintToggle').click();const expected=V.sample(card.hint.model,card.hint.params).values.angle;
    f.input('angle',60);f.$('.t19-measure').click();f.$('.t19-model-reset').click();
    assert.equal(Number(f.$('input[data-key="angle"]').value),expected,card.id);assert.equal(f.saved().current.modelState.measured,false);assert.equal(f.saved().current.answer,null);assert.deepEqual(f.errors,[]);
  }
  const distance=boot(t,'prev-102');distance.$('#hintToggle').click();assert.equal(distance.$('.t19-model-reset'),null);
});
