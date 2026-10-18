'use strict';
// Exercise the actual presentation module with synthetic accounts and API data.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const catalog = require('../learning/catalog');
const map = require('../learning/preparation-map');
const contracts = require('../board-server/learning-contracts');
const plan = require('../docs/tasks/VERTICAL_DIVISION_ROUTE.plan.json');
const source = fs.readFileSync(path.join(__dirname, '../learning/preparation.js'), 'utf8');
const labels = { started: 'Начато', independent: 'Решено самостоятельно', hinted: 'Решено с подсказкой' };
const first = catalog.get(plan.items[0].catalogId), second = catalog.get(plan.items[1].catalogId);
const summary = (item, completed, outcome, id) => ({trainerId:item.trainerId,contentId:item.contentId,completed,latest:{id,outcome}});
const tick = () => new Promise(resolve => setImmediate(resolve));

async function mount(options={}) {
  const dom = new JSDOM('<main></main>', {url:'https://example.test/learning/',runScripts:'outside-only'});
  const {window} = dom, calls=[], writes=[];
  window.LearningPreparation=map;
  window.eval(source);
  const host=window.document.querySelector('main');
  const context={account:{id:'fixture',role:'student'},profile:{course:'oge',goal:'pass'},page:'home',catalog,labels,attempts:[],assignments:[],
    api:async route=>{writes.push(route);if(route==='/plan'){if(options.planError)throw Error('offline');return options.plan||plan;}if(route==='/progress'){if(options.progressError)throw Error('offline');return {progress:options.progress||[]};}return {totalPoints:0,pointsWithinLevel:0,level:1,nextLevelAt:100,uniqueCompleted:0,badges:[]};},
    openContent:async(...args)=>calls.push(JSON.parse(JSON.stringify(args))),...options.context};
  const unmount=window.LearningPreparationUI.mountRoute(host,context);
  await tick();
  return {dom,host,calls,writes,unmount};
}

(async()=>{
  assert.equal(plan.items.length,26);assert.equal(new Set(plan.items.map(x=>x.catalogId)).size,26);
  for(const row of plan.items){const item=catalog.get(row.catalogId);assert(item,row.catalogId);const a=contracts.create(item.trainerId,item.contentId,239);contracts.normalize(item.trainerId,a.taskSpec,a.state);}
  for(const page of ['home','route']){
    const t=await mount({context:{page}}),{host}=t;
    assert.deepEqual([...host.querySelectorAll('.prep-route-step')].map(x=>x.dataset.prepItem),plan.items.map(x=>x.catalogId),'All steps, in teacher order');
    assert.equal(host.querySelectorAll('[aria-current="step"]').length,1);
    assert.equal(host.querySelector('[data-prep-next] [data-prep-start]').dataset.prepStart,first.id);
    assert.equal(host.querySelectorAll('.primary').length,1);
    assert.match(host.querySelector('.prep-route-stage').textContent,/Деление уголком/);
    assert.equal(host.querySelectorAll('.prep-route-stage').length,4,'Four uninterrupted curriculum stages');
    assert(!host.querySelector('.prep-route-list').closest('details'),'Entire path is expanded');
    host.querySelector('[data-prep-next] button').click();await tick();assert.deepEqual(t.calls,[[first.id,{}]]);
    assert.deepEqual(t.writes.sort(),['/plan','/progress','/rewards'],'Reading route never mutates progress');
    t.unmount();assert.equal(host.children.length,0);t.dom.window.close();
  }
  // Full-history completion survives omission from the recent 200 attempts.
  const completed=await mount({progress:[summary(first,true,'independent','old-result')]});
  assert.equal(completed.host.querySelector('[aria-current="step"]').dataset.prepItem,second.id);
  const repeat=completed.host.querySelector('[data-prep-item] [data-prep-start]');assert.equal(repeat.dataset.prepFresh,'true');
  repeat.click();await tick();assert.deepEqual(completed.calls,[[first.id,{fresh:true,sourceAttemptId:'old-result'}]]);
  assert.match(completed.host.querySelector('.prep-next > .small').textContent,/1 из 26/);completed.dom.window.close();
  const started=await mount({progress:[summary(first,false,'started','draft')]});
  assert.equal(started.host.querySelector('[aria-current="step"]').dataset.prepItem,first.id);assert.match(started.host.querySelector('[data-prep-next] button').textContent,/Продолжить/);started.dom.window.close();
  const failed=await mount({progressError:true});assert.equal(failed.host.querySelectorAll('[aria-current]').length,0);assert(failed.host.querySelector('[data-prep-retry]'));assert.equal(failed.host.querySelectorAll('.prep-route-step').length,26);failed.dom.window.close();
  const homework=await mount({context:{assignments:[{id:'homework',learnerId:'fixture',status:'published',title:'Работа от преподавателя'}]}});
  assert.equal(homework.host.querySelector('[data-prep-next] a.primary').getAttribute('href'),'#assignment=homework');assert.equal(homework.host.querySelectorAll('.primary').length,1);homework.dom.window.close();
  const done=await mount({progress:plan.items.map((x,i)=>summary(catalog.get(x.catalogId),true,'hinted','a'+i))});
  assert.equal(done.host.querySelectorAll('[aria-current]').length,0);assert.match(done.host.querySelector('.prep-route-finish').textContent,/Повтори трудные/);assert.equal(done.host.querySelectorAll('[data-prep-fresh]').length,26);done.dom.window.close();
  const fallback=await mount({plan:{items:[]}});assert(!fallback.host.querySelector('.prep-journey'));assert(fallback.host.querySelector('[data-prep-next]'));fallback.dom.window.close();
  const unavailable=await mount({planError:true});assert(!unavailable.host.querySelector('.prep-journey'));assert.match(unavailable.host.textContent,/не загрузились/);unavailable.dom.window.close();
  const custom=await mount({plan:{items:[{catalogId:'path:triangle',reason:'<img src=x onerror=bad()>',priority:'high'}],note:'<script>bad()</script>'}});
  assert.equal(custom.host.querySelector('[data-prep-item]').dataset.prepItem,'path:triangle');assert.equal(custom.host.querySelectorAll('script,img').length,0);custom.dom.window.close();
  console.log('LEARNING_VERTICAL_ROUTE_DOM_OK (26 valid tasks; home/route order; 4 stages; completed/started/full history; repeat/resume; homework priority; API failures; safe arbitrary plans)');
})().catch(error=>{console.error(error);process.exitCode=1;});
