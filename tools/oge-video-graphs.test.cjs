'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const lessons = require('../trainers/oge-video-graphs.js');
const by = id => lessons.find(x=>x.id===id);
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);

test('five scoped graph investigations expose independent exercises and reachable exact thresholds',()=>{
 assert.equal(lessons.length,5);assert.equal(new Set(lessons.map(x=>x.id)).size,5);
 for(const l of lessons){
  assert.ok(l.tasks.every(x=>[11,22].includes(x)));
  assert.equal(l.practices.length,3);assert.equal(new Set(l.practices.map(x=>x.prompt)).size,3);
  for(const q of [l.predict,l.reason])assert.ok(q.choices[q.answer]&&q.explain.length>20);
  for(const p of l.practices){assert.ok(Number.isFinite(p.answer));assert.ok(p.prompt&&p.hint&&p.solution);}
 }
 for(const [id,key,value] of [['absolute-intersections','c',2.25],['cancelled-hole','k',.25],['piecewise-boundary','c',1],['piecewise-boundary','c',3],['piecewise-boundary','c',4],['hyperbola-domain','k',0]]){
  const c=by(id).controls.find(c=>c.key===key);assert.ok(c.min<=value&&value<=c.max);close((value-c.min)/c.step,Math.round((value-c.min)/c.step));
 }
});

test('line slope is independent of intercept and zero slope remains a horizontal line',()=>{
 const l=by('line-parameters');
 for(const k of [-3,-.5,0,1.5,3])for(const b of [-4,0,4]){
  close(l.math.value(k,b,0),b);
  close(l.math.value(k,b,2)-l.math.value(k,b,-1),3*k);
 }
 assert.match(l.render({k:0,b:3}).readout,/горизонтальная/);
 assert.deepEqual(l.practices.map(x=>x.answer),[(7-3)/2,1+2*3,(1.5*2-4)-(1.5*0-4)]);
});

test('translated hyperbola keeps the source domain at k=0 and removes vertical asymptote',()=>{
 const l=by('hyperbola-domain');
 for(const a of [-3,-.5,0,2.5,3])for(const b of [-3,0,3])for(const k of [-4,0,4]){
  assert.equal(l.math.value(k,a,b,-a),null);
  for(const x of [-6,-4,4,6])if(x!==-a)close((l.math.value(k,a,b,x)-b)*(x+a),k);
  if(k===0){const r=l.render({k,a,b});assert.doesNotMatch(r.svg,/stroke-dasharray/);assert.match(r.svg,/<circle[^>]+fill="white"/);assert.match(r.readout,/Вертикальной асимптоты нет/);}
 }
 assert.deepEqual(l.practices.map(x=>x.answer),[-2,3,3/(2+1)-2]);
});

test('absolute parabola counts distinct roots at zero and exact reflected vertex',()=>{
 const l=by('absolute-intersections');
 for(const [c,n] of [[-1,0],[0,2],[.25,4],[2,4],[2.249,4],[2.25,3],[2.251,2],[4,2]]){
  const xs=l.math.intersections(c);assert.equal(xs.length,n,`c=${c}`);
  assert.equal(new Set(xs).size,xs.length);
  for(const x of xs)close(Math.abs(x*x+x-2),c);
 }
 assert.deepEqual(l.math.intersections(0),[-2,1]);
 close(l.math.intersections(2.25)[1],-.5);
 // Independent cases: x²=7 or1 (4 roots); x²=8 or0 (3); x²=19 or−1 (2).
 assert.deepEqual(l.practices.map(x=>x.answer),[4,3,2]);
 assert.equal(l.math.intersections(3,0,-4).length,4);
 assert.equal(l.math.intersections(4,0,-4).length,3);
 assert.equal(l.math.intersections(10,0,-9).length,2);
 // The reflected vertex is included, never styled as a deleted point.
 assert.doesNotMatch(l.render({c:2.25}).svg,/<circle[^>]+fill="white"/);
});

test('piecewise endpoints belong only to their permitted branch',()=>{
 const l=by('piecewise-boundary');
 assert.equal(l.math.value(-1),3);assert.ok(l.math.value(-1-1e-6)<1.00001);
 for(const [c,n] of [[-1,1],[1,1],[1.001,2],[2.999,2],[3,3],[3.5,3],[4,2],[4.001,1]]){
  const xs=l.math.intersections(c);assert.equal(xs.length,n,`c=${c}`);
  for(const x of xs)close(l.math.value(x),c);
 }
 assert.ok(!l.math.intersections(1).includes(-1));assert.ok(l.math.intersections(3).includes(-1));
 // Exercise candidates, filtering inequalities directly rather than reading model answers.
 const checks=[[-4,-1,1],[-10,0],[Math.sqrt(8)]];
 for(const [i,h,B,c] of [[0,1,5,4],[1,2,10,10],[2,2,10,2]]){
  const xs=l.math.intersections(c,h,B);assert.deepEqual(xs,checks[i]);assert.equal(l.practices[i].answer,checks[i].length);
 }
});

test('cancelled rational expression excludes zero and its hole before counting',()=>{
 const l=by('cancelled-hole');
 for(const h of [2,3,4,5]){
  assert.equal(l.math.value(0,h),null);assert.equal(l.math.value(h,h),null);
  for(const x of [-5,-2,-1,1,3,6])if(x!==h)close(l.math.value(x,h),(x-h)/(x*x-h*x));
  for(const k of [-1,0,1/(h*h),.5,2]){
   const xs=l.math.intersections(k,h);assert.equal(xs.length,k<=0?0:Math.abs(k-1/(h*h))<1e-12?1:2);
   for(const x of xs){assert.notEqual(x,0);assert.ok(Math.abs(x-h)>1e-9);close((x-h)/(x*x-h*x),k*x);}
  }
 }
 assert.deepEqual(l.math.intersections(.25),[-2]);
 assert.equal(l.math.intersections(.25+1e-12).length,2);
 assert.equal(l.math.intersections(.25-1e-12).length,2);
 assert.deepEqual(l.math.intersections(1/9,3),[-3]);
 assert.deepEqual(l.math.intersections(1/9,4),[-3,3]);
 assert.deepEqual(l.math.intersections(-1,5),[]);
 assert.deepEqual(l.practices.map(x=>x.answer),[1,2,0]);
});

test('every graph renders finite accessible SVG at control endpoints and defaults',()=>{
 for(const l of lessons){
  const values=l.controls.map(c=>[c.min,c.value,c.max]);
  function sweep(i,p){if(i===values.length){const r=l.render(p);assert.match(r.svg,/viewBox="0 0 480 300"/);assert.match(r.svg,/role="img" aria-label="[^"]+"/);assert.doesNotMatch(r.svg,/NaN|Infinity|undefined|<script|javascript:/);assert.ok(r.readout.length>20);return;}
   for(const v of values[i])sweep(i+1,{...p,[l.controls[i].key]:v});
  }sweep(0,{});
 }
});

test('non-step rational slopes fit visible intersections or explicitly report all distant points',()=>{
 const l=by('cancelled-hole');
 const circles=svg=>Array.from(svg.matchAll(/<circle\b([^>]+)>/g),m=>{
  const attr=k=>m[1].match(new RegExp(k+'="([^"]+)"'))?.[1];
  return {x:Number(attr('cx')),y:Number(attr('cy')),fill:attr('fill')};
 });
 for(const k of [.01,.001,.000625,.5,2]){
  const r=l.render({k}),points=circles(r.svg).filter(c=>c.fill==='#b45309');
  assert.equal(points.length,2,`k=${k}: both intersections displayed`);
  for(const p of points){assert.ok(p.x>=44&&p.x<=440);assert.ok(p.y>=42&&p.y<=258);}
  assert.doesNotMatch(r.readout,/за пределами окна/);
 }
 for(const k of [.0001,1e-9]){
  const r=l.render({k});assert.match(r.readout,/Общих точек: 2/);assert.match(r.readout,/Все 2 пересечения за пределами окна/);
  assert.match(r.svg,/2 пересечения вне окна/);
  assert.equal(circles(r.svg).filter(c=>c.fill==='#b45309').length,0,'no invisible out-of-window circles');
  for(const p of circles(r.svg)){assert.ok(p.x>=44&&p.x<=440);assert.ok(p.y>=42&&p.y<=258);}
 }
});

test('parameter labels retain tiny values and distinguish either side of exact thresholds',()=>{
 const h=by('cancelled-hole');
 assert.match(h.render({k:1e-9}).readout,/k = 1e−9\./);
 for(const k of [.250000001,.249999999]){
  const r=h.render({k});assert.match(r.readout,new RegExp('k = '+String(k).replace('.',',')+'\\.'));
  assert.match(r.readout,/Общих точек: 2/);assert.match(r.readout,/не равен 2/);
 }
 const a=by('absolute-intersections');
 assert.match(a.render({c:2.250000001}).readout,/c = 2,250000001\. Различных пересечений: 2/);
 assert.match(a.render({c:2.249999999}).readout,/c = 2,249999999\. Различных пересечений: 4/);
 const hyper=by('hyperbola-domain').render({k:1e-9,a:1.123456789,b:2.123456789});
 assert.match(hyper.readout,/1e−9/);assert.match(hyper.readout,/1,123456789/);assert.doesNotMatch(hyper.readout,/Вертикальной асимптоты нет/);
 assert.match(hyper.svg,/y = k\/\(x \+ a\) \+ b/,'bounded graph heading while exact formula remains in readout');
});
