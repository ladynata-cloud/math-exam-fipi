'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('./data.js');
const P = require('./plot.js');
const task = id => D.tasks.find(item => item.id === id);
const close = (actual, expected, message) => assert.ok(Math.abs(actual - expected) < 0.002, message || `${actual} ≈ ${expected}`);
function coordinates(path) {
  return [...path.matchAll(/[ML](-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g)].map(match => ({x: Number(match[1]), y: Number(match[2])}));
}
function mathCoordinates(t, path) { return coordinates(path).map(p => P.fromScreen(t, p.x, p.y)); }

test('every authored curve contains only finite SVG coordinates inside its x viewport', () => {
  for (const t of D.tasks) {
    const paths = P.curvePaths(t);
    assert.ok(paths.length > 0, t.id);
    for (const path of paths) {
      assert.doesNotMatch(path, /NaN|Infinity|undefined/, t.id);
      const points = coordinates(path);
      assert.ok(points.length > 1, t.id);
      assert.equal((path.match(/M/g) || []).length, 1, t.id);
      for (const p of points) {
        assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y), t.id);
        assert.ok(p.x >= P.frame.left - .001 && p.x <= P.frame.right + .001, t.id);
      }
    }
  }
});

test('downward and upward jumps retain two distinct one-sided branch endpoints', () => {
  for (const [id, x, leftY, rightY] of [['F3',2,3,2],['F4',2,2,3],['F6',1,1,2],['F7',4,2,3],['F8',-1,-2,0]]) {
    const t = task(id), paths = P.curvePaths(t).map(path => mathCoordinates(t, path));
    assert.equal(paths.length, id === 'F8' ? 3 : 2, id);
    close(paths[0].at(-1).x, x, id + ' left x');
    close(paths[0].at(-1).y, leftY, id + ' left limit');
    close(paths[1][0].x, x, id + ' right x');
    close(paths[1][0].y, rightY, id + ' right value');
  }
});

test('logarithms never include their forbidden boundary or cross the vertical asymptote', () => {
  for (const id of ['E1','E2','E3','E4','E5','E6','E7','E8']) {
    const t=task(id), edge=t.asymptotes.find(a=>a.axis==='x').value;
    for (const path of P.curvePaths(t)) for (const p of mathCoordinates(t,path)) {
      assert.ok(id==='E4' ? p.x < edge : p.x > edge, id);
    }
  }
});

test('inverse coordinates and letterboxed click positions preserve graph values', () => {
  const t=task('F5');
  for (const p of t.points) {
    const s=P.toScreen(t,p.x,p.y), restored=P.fromScreen(t,s.x,s.y);
    close(restored.x,p.x); close(restored.y,p.y);
    // 1000 × 460 places the 640 × 460 viewBox between horizontal margins.
    const svg={getBoundingClientRect:()=>({left:20,top:30,width:1000,height:460})};
    const clicked=P.pointFromEvent(svg,{clientX:20+180+s.x,clientY:30+s.y},t);
    close(clicked.x,p.x); close(clicked.y,p.y);
    assert.equal(P.pointFromEvent(svg,{clientX:30,clientY:100},t),null);
  }
  assert.equal(P.pointFromEvent({getBoundingClientRect:()=>({width:0,height:0})},{clientX:0,clientY:0},t),null);
});

function fakeSvg() {
  const document={createElementNS:(_ns,name)=>new Element(name)};
  class Element {
    constructor(name) {this.name=name;this.attrs={};this.children=[];this.ownerDocument=document;}
    setAttribute(key,value) {this.attrs[key]=value;}
    appendChild(child) {this.children.push(child);return child;}
    replaceChildren() {this.children=[];}
  }
  return new Element('svg');
}
function allNodes(node) {return [node,...node.children.flatMap(allNodes)];}
test('before graph reveal, only supplied checked points appear and no endpoints or asymptotes leak', () => {
  for (const id of ['E1','F7']) {
    const t=task(id), svg=fakeSvg();
    P.render(svg,t,{showCurve:false,showGuides:true,points:[t.points[0]]});
    const nodes=allNodes(svg);
    assert.equal(nodes.filter(n=>n.attrs['data-point']==='checked').length,1,id);
    assert.equal(nodes.filter(n=>n.attrs['data-curve']||n.attrs['data-endpoint']||n.attrs['data-guide']).length,0,id);
    assert.equal(svg.attrs.role,'img');
  }
});

test('piecewise reveal marks open limits and the actual included boundary separately', () => {
  const svg=fakeSvg(), t=task('F7');
  P.render(svg,t,{showCurve:true,showGuides:true,points:[]});
  const endpoints=allNodes(svg).filter(n=>n.attrs['data-endpoint']);
  assert.equal(endpoints.length,3);
  const atBoundary=endpoints.filter(n=>Math.abs(Number(n.attrs.cx)-P.toScreen(t,4,0).x)<.002);
  assert.equal(atBoundary.length,2);
  const open=atBoundary.find(n=>n.attrs['data-endpoint']==='open');
  const closed=atBoundary.find(n=>n.attrs['data-endpoint']==='closed');
  close(Number(open.attrs.cy),P.toScreen(t,4,2).y);
  close(Number(closed.attrs.cy),P.toScreen(t,4,3).y);
  assert.equal(open.attrs.fill,'#fff');
  assert.notEqual(closed.attrs.fill,'#fff');
});
