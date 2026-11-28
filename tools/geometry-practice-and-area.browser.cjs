'use strict';
const assert = require('node:assert/strict');

const topics = ['practice-free-area','practice-fence','practice-spokes','practice-triangle-angle'];
const proofs = [
  '/geometry-course/atlas/area-triangle.html',
  '/geometry-pogorelov/atlas/pogorelov-base-9-126.html',
  '/geometry-merzlyak/atlas/merzlyak-base-8-22.html'
];

function answers(id, p) {
  switch (id) {
    case 'practice-free-area': return [p.a*p.a, p.b*p.c, p.a*p.a-p.b*p.c];
    case 'practice-fence': return [2*(p.a+p.b), 2*(p.a+p.b)-p.g];
    case 'practice-spokes': return [360, p.n, 360/p.n];
    case 'practice-triangle-angle': return [p.a+p.b, 180-p.a-p.b];
  }
}

async function checkVariants(page, id) {
  const errors=await page.evaluate(id=>{
    const bad=[];
    const angle=(v,p,q)=>{
      const u=[p[0]-v[0],p[1]-v[1]], w=[q[0]-v[0],q[1]-v[1]];
      return Math.acos((u[0]*w[0]+u[1]*w[1])/(Math.hypot(...u)*Math.hypot(...w)))*180/Math.PI;
    };
    for(let seed=0;seed<240;seed++) {
      const t=PathData.task(id,seed), p=t.params, raw=PathPlanePractice.frame(t).svg;
      const svg=new DOMParser().parseFromString(raw,'image/svg+xml').documentElement;
      if(svg.localName!=='svg'||/NaN|undefined|Infinity/.test(raw)){bad.push(seed);continue;}
      const labels=Array.from(svg.querySelectorAll('text'),el=>el.textContent);
      if(id==='practice-spokes' && svg.querySelectorAll('[data-spoke]').length!==p.n)bad.push(seed);
      if(id==='practice-fence' && ![p.a+' м',p.b+' м','проезд '+p.g+' м'].every(s=>labels.includes(s)))bad.push(seed);
      if(id==='practice-free-area' && ![p.a,p.b,p.c].every(n=>labels.includes(n+' м')))bad.push(seed);
      if(id==='practice-triangle-angle'){
        const xy=svg.querySelector('path').getAttribute('d').match(/-?[\d.]+/g).map(Number);
        const [a,b,c]=[xy.slice(0,2),xy.slice(2,4),xy.slice(4,6)];
        if(Math.abs(angle(a,b,c)-p.a)>0.05 || Math.abs(angle(b,a,c)-p.b)>0.05 || !labels.includes('?'))bad.push(seed);
        if(p.a+p.b===90){
          const result=new DOMParser().parseFromString(PathPlanePractice.frame(t,2).svg,'image/svg+xml');
          if(!/^M[^A]+L[^A]+L/.test(result.querySelector('[data-angle="C"]').getAttribute('d')))bad.push(seed);
        }
      }
    }
    return bad;
  },id);
  assert.deepEqual(errors,[],id+' uses the givens of every tested seed');
}

async function solve(page, origin, id) {
  await page.goto(origin+'/ege-baza/path/index.html#lesson='+id);
  const initial=page.locator('.task-first-problem > .task-support svg[data-step="-1"]');
  await initial.waitFor();
  assert(await initial.evaluate(el=>el.closest('.task-support').parentElement.nextElementSibling.matches('.task')), 'Figure precedes the condition');
  const params=await page.evaluate(id=>PathData.task(id,PathCourse.state().lessons[id].seed).params,id);
  await checkVariants(page,id);
  const values=answers(id,params);
  if(id==='practice-spokes') assert.equal(await initial.locator('[data-spoke]').count(),params.n);
  if(id==='practice-triangle-angle') assert((await initial.locator('text').allTextContents()).includes('?'));
  await page.locator('#startSteps').click();
  const field=page.locator('#stepAnswer'), submit=page.locator('#stepAnswerForm button[type=submit]');
  for (const [i,value] of values.entries()) {
    const drawing=page.locator('.plane-work svg[data-step="'+i+'"]');
    await drawing.waitFor();
    assert.equal(await page.locator('svg[data-plan]:visible').count(),1);
    if(id==='practice-free-area') assert.equal(await drawing.locator('[data-highlight]').getAttribute('data-highlight'),['plot','house','free'][i]);
    if(id==='practice-fence') assert.equal(await drawing.locator('[data-highlight="perimeter"]').count(),i===0?1:0);
    if(id==='practice-spokes') assert.equal(await drawing.locator('[data-highlight="sector"]').count(),i===0?0:1);
    const layout=await drawing.evaluate(svg=>{
      const figure=svg.getBoundingClientRect();
      const input=svg.closest('.plane-work').querySelector('#stepAnswer').getBoundingClientRect();
      return {width:innerWidth, gap:input.top-figure.bottom, beside:input.left>=figure.right-1};
    });
    assert(layout.gap<180, `${id}, step ${i+1} at ${layout.width}px: input is ${Math.round(layout.gap)}px below drawing`);
    if(layout.width>650) assert(layout.beside, `${id}, step ${i+1}: input must be beside drawing`);
    if(i===0){
      await field.fill('-1');await submit.click();
      assert(await drawing.isVisible(),'An incorrect answer must keep the current drawing');
    }
    await field.fill(String(value));await submit.click();
    if(i===0) await page.reload();
  }
  await page.getByText('Разбор завершён',{exact:true}).waitFor();
  assert.equal(await page.locator('.plane-history li').count(),values.length);
  if(id==='practice-triangle-angle'){
    const final=page.locator('svg[data-plan][data-step="2"]');
    assert((await final.locator('text').allTextContents()).includes(values.at(-1)+'°'));
    assert(!(await final.locator('text').allTextContents()).includes('?'));
  }
  await page.locator('#answer').fill(String(values.at(-1)));
  await page.locator('#answerForm button[type=submit]').click();
  assert(await page.evaluate(id=>PathCourse.state().lessons[id].done,id));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1), page.url());
}

async function prove(page, origin, route) {
  await page.goto(origin+route);
  await page.locator('[data-stage="2"]').first().click();
  const drawing=page.locator('[data-area-proof]');
  await drawing.waitFor();
  assert.equal(await drawing.getAttribute('data-area-proof'),'0');
  assert.equal(await drawing.locator('[data-construction]').count(),0);
  assert.equal(await drawing.locator('[data-right-angle="CHB"]').count(),1);
  await page.locator('[data-proof="s2"]').click();
  assert.equal(await drawing.locator('[data-construction]').count(),0,'Out-of-order argument cannot build D');
  for(const [i,key] of ['s1','s2','s3'].entries()){
    await page.locator('[data-proof="'+key+'"]').click();
    if(key==='s1') {
      assert.equal(await drawing.locator('[data-construction="D"]').count(),1);
      assert.equal(await drawing.locator('[data-region]').count(),0);
    }
    if(key==='s2') {
      assert.equal(await drawing.locator('[data-region]').count(),2);
      assert.equal(await drawing.locator('[data-diagonal="AC"]').count(),1);
    }
    await page.locator('#reason-choice').selectOption('yes');
    await page.locator('[data-action="reason-check"]').click();
    assert.equal(await drawing.getAttribute('data-area-proof'),String(i+1));
    if(key!=='s3') assert.equal(await page.locator('.area-proof-history[open]').count(),0);
    if(key==='s1') {await page.reload();await page.locator('[data-area-proof="1"]').waitFor();}
  }
  assert.match(await drawing.innerText(),/AB · h \/ 2/);
  await page.locator('[data-action="proof-reset"]').click();
  assert.equal(await drawing.locator('[data-construction]').count(),0);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1), page.url());
}

module.exports = async function checkGeometryPracticeAndArea(page, origin) {
  for(const id of topics) await solve(page,origin,id);
  for(const route of proofs) await prove(page,origin,route);
};

module.exports.checkManaged = async function checkManaged(page,origin) {
  const bridge='**/trainers/learning-bridge.js*';
  await page.route(bridge,route=>route.fulfill({contentType:'application/javascript',
    body:'window.MathExamLearning={register(adapter){window.testGeometryLesson=adapter;}};'}));
  try {
    for(const id of topics) {
      await page.goto(origin+'/ege-baza/path/index.html?learning=1#lesson='+id);
      const params=await page.evaluate(id=>{
        const task=PathData.task(id,17);
        window.testGeometrySpec={trainerId:'ege-path',contentVersion:1,id,contentId:id,seed:17,task};
        window.testGeometryLesson.applyState({taskSpec:window.testGeometrySpec,state:null,readOnly:false});
        return task.params;
      },id);
      await page.locator('[data-stage="2"]').click();
      const expected=answers(id,params);
      for(const [index,value] of expected.entries()) {
        await page.locator('.plane-work svg[data-step="'+index+'"]').waitFor();
        const field=page.locator('#answer');
        await field.fill(String(value));
        await page.locator('#answerForm').getByRole('button',{name:'Проверить',exact:true}).click();
        if(index===0){
          const saved=await page.evaluate(()=>window.testGeometryLesson.getState());
          await page.reload();
          await page.evaluate(({id,saved})=>{
            const spec={trainerId:'ege-path',contentVersion:1,id,contentId:id,seed:17,task:PathData.task(id,17)};
            window.testGeometryLesson.applyState({taskSpec:spec,state:saved,readOnly:false});
          },{id,saved});
        }
      }
      await page.getByText('Разбор завершён',{exact:true}).waitFor();
      assert.deepEqual(await page.evaluate(()=>window.testGeometryLesson.getState().work.answers),expected.map(String));
    }
  } finally { await page.unroute(bridge); }
};
