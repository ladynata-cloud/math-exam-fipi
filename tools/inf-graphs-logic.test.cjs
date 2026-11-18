const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../trainers');
const html = fs.readFileSync(path.join(root, 'ege-informatics-task1-graphs-trainer.html'), 'utf8');
function data(id) {
  return JSON.parse(html.match(new RegExp('<script id="' + id + '" type="application/json">(.*?)</script>'))[1]);
}
const tasks = data('tasks-data');
const matrices = data('road-matrices');
assert.equal(tasks.length, 208);
const matrixTasks = tasks.filter(t => t.blocks.some(b => b.kind === 'table'));
assert.equal(matrixTasks.length, 100);
for (const t of matrixTasks) {
  const [labels,edges] = matrices[t.fipi_id];
  assert.equal(labels.length, new Set(labels).size);
  const rows = labels.map(() => labels.map(() => null));
  for (const [i,j,v] of edges) {
    assert.ok(i < j && i >= 0 && j < labels.length && rows[i][j] === null);
    assert.match(v,/^(?:\*|[1-9]\d*)$/);
    rows[i][j] = rows[j][i] = v;
  }
  const flat = [...labels,...rows.flatMap((row,i) => [labels[i],...row.filter(Boolean)])];
  const text = t.blocks.find(b => b.kind === 'table').text;
  // Two source cells contain internal typographic spaces ("1 0", "3 5").
  const tokens = text.split('\n').filter(v => v !== 'Номер пункта').map(v => v.replaceAll(' ',''));
  assert.deepEqual(flat,tokens,t.fipi_id);
}
// These three image transcriptions distinguish layouts with identical flattened rows.
// Original task illustrations reproduced at https://gdzotvet.ru/images/informatika/ege01/{id}.png .
for (const [id, expected] of Object.entries({
  '812675':['248','137','257','16','367','458','235','16'],
  'DAFB2E':['358','78','17','58','146','57','236','124'],
  'A9F1EC':['26','135','27','58','246','158','38','467']
})) {
  const [labels,edges] = matrices[id];
  const neighbours = labels.map(() => []);
  for (const [i,j] of edges) { neighbours[i].push(labels[j]); neighbours[j].push(labels[i]); }
  assert.deepEqual(neighbours.map(ns=>ns.sort().join('')),expected,id);
}
const graphContext = { MATCHING:data('matching-data'), escapeHtml:String, document:{getElementById:() => ({textContent:JSON.stringify(matrices)})} };
vm.createContext(graphContext);
vm.runInContext(html.slice(html.indexOf('  const roadMatrices ='),html.indexOf('  // --- render task ---')),graphContext);
for (const subtype of Object.keys(data('labels-data'))) {
  for (let v=0; v<210; v++) {
    const model = graphContext.warmupModel({subtype},v);
    const a=2+v%5, b=4+v%7;
    const routes = [[a,b],[b,2]];
    if (!(v%2)) routes.push([a,1,2]);
    if (!(v%3)) routes.push([a+b+2]);
    const distances=routes.map(route=>route.reduce((s,n)=>s+n,0));
    if (model.view.includes('road-grid')) {
      assert.equal(model.steps[0][1],1+v%5);
      assert.equal(model.steps[1][1],subtype==='weighted_graph_table_matching'?b:1+(v+4)%5);
    } else if(subtype==='count_paths_directed_graph'){
      assert.equal(model.steps[0][1],v%2?1:2);assert.equal(model.steps[1][1],routes.length);
    } else {
      assert.equal(model.steps[0][1],a+b);
      assert.equal(model.steps[1][1],subtype==='longest_path_length'?Math.max(...distances):Math.min(...distances));
    }
  }
}
for (const [fid,answer,reject] of [['0079D4','9,0','99'],['03D82F','1','2'],['812675','43','34'],['DAFB2E','21','12'],['A9F1EC','36','63']]) {
  const t=tasks.find(t=>t.fipi_id===fid);
  assert.ok(graphContext.keyMatches(t,answer)); assert.ok(!graphContext.keyMatches(t,reject));
}
for (const name of ['ege-informatics-task15-logic-operations.html','ege-informatics-task15-logic-operations-mini.html']) {
  const page = fs.readFileSync(path.join(root,name),'utf8');
  const js = page.match(/<script>([\s\S]*?)<\/script>/)[1];
  new vm.Script(js,{filename:name});
  const ctx={EXERCISES:[{id:'a'},{id:'b'}]};
  vm.createContext(ctx);
  vm.runInContext(js.slice(js.indexOf('function saveQuizSession'),js.indexOf('function stepHint')),ctx);
  const quiz={questions:ctx.EXERCISES,idx:1,answers:[{correct:true}],finished:false};
  assert.deepEqual(ctx.restoreQuizSession(ctx.saveQuizSession(quiz)).questions.map(x=>x.id).join(','),'a,b');
  assert.equal(ctx.restoreQuizSession({questions:['missing'],idx:0,answers:[]}),null);
}
const report = fs.readFileSync(path.join(root,'fipi-ege-informatics-task1-report.html'),'utf8');
assert.equal((report.match(/<img src="data:image\//g)||[]).length, (report.match(/<img /g)||[]).length);
assert.equal((report.match(/graphs-trainer\.html\?task=/g)||[]).length,208);
console.log('PASS: 208 graph records; all 100 road matrices; 8 × 210 generated warmups; 5 verified answer keys; quiz restore; report links and illustrations');
