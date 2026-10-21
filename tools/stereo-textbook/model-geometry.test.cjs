'use strict';
// Mathematical integrity of every authored drawing, including step-only sections.
// Source/proof review establishes that the drawing represents the right problem;
// this gate independently checks that its polygons can be planar faces/sections.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const file = process.argv[2] || path.join(__dirname, '../../stereo-course/textbook/data/course.json');
const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
const lessons = Array.isArray(raw) ? raw : raw.lessons;
assert(Array.isArray(lessons) && lessons.length, 'Expected nonempty authored lessons');
const sub = (a, b) => a.map((x, i) => x - b[i]);
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const norm = a => Math.hypot(...a);
const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const orient = (a,b,c) => (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
let faces = 0, segments = 0;
for (const lesson of lessons) {
  const model = lesson.visualization.model, points = model.points;
  const scale = Math.max(1, ...Object.values(points).map(norm));
  const epsilon = scale * 1e-8;
  const point = name => {
    const p = points[name];
    assert(Array.isArray(p) && p.length === 3 && p.every(Number.isFinite), lesson.id + ': finite point ' + name);
    return p;
  };
  for (const [a,b] of [...(model.edges||[]), ...(model.arrows||[]), ...Object.values(model.views).flatMap(v => v.segments||[])]) {
    assert(norm(sub(point(a), point(b))) > epsilon, lesson.id + ': zero length ' + a + b);
    segments++;
  }
  const polygons = [
    ...(model.faces||[]).map((names,i) => ({names, label:'face '+i})),
    ...Object.entries(model.views).filter(([,view]) => view.polygon?.length).map(([name,view]) => ({names:view.polygon, label:'view '+name}))
  ];
  for (const polygon of polygons) {
    const names = [...polygon.names];
    if (names.at(-1) === names[0]) names.pop();
    const label = lesson.id + ': ' + polygon.label;
    assert(names.length >= 3, label + ' needs three vertices');
    const vertices = names.map(point), origin = vertices[0];
    let normal = [0,0,0];
    for (let i=1;i<vertices.length-1;i++) {
      const candidate = cross(sub(vertices[i],origin),sub(vertices[i+1],origin));
      if (norm(candidate)>norm(normal)) normal=candidate;
    }
    assert(norm(normal)>epsilon*epsilon, label + ' is collinear');
    normal=normal.map(v=>v/norm(normal));
    for (let i=0;i<vertices.length;i++) {
      assert(Math.abs(dot(sub(vertices[i],origin),normal)) <= epsilon, label + ' is not planar at ' + names[i]);
      for(let j=0;j<i;j++) assert(norm(sub(vertices[i],vertices[j]))>epsilon, label+' repeats a vertex');
    }
    // Project onto the coordinate plane with the largest normal component.
    const drop = normal.map(Math.abs).indexOf(Math.max(...normal.map(Math.abs)));
    const flat = vertices.map(p=>p.filter((_,i)=>i!==drop));
    const tolerance=epsilon*scale;
    const on = (a,b,c) => Math.abs(orient(a,b,c))<=tolerance && c.every((v,i)=>v>=Math.min(a[i],b[i])-epsilon&&v<=Math.max(a[i],b[i])+epsilon);
    const hits = (a,b,c,d) => {
      const oa=orient(a,b,c),ob=orient(a,b,d),oc=orient(c,d,a),od=orient(c,d,b);
      return (oa*ob < -tolerance*tolerance && oc*od < -tolerance*tolerance) || on(a,b,c)||on(a,b,d)||on(c,d,a)||on(c,d,b);
    };
    for(let i=0;i<flat.length;i++) for(let j=i+1;j<flat.length;j++) {
      if(j===i+1||(i===0&&j===flat.length-1))continue;
      assert(!hits(flat[i],flat[(i+1)%flat.length],flat[j],flat[(j+1)%flat.length]), label+' has crossing nonadjacent edges');
    }
    faces++;
  }
}
console.log(`TEXTBOOK_MODEL_GEOMETRY_OK ${lessons.length} cards, ${faces} planar simple polygons, ${segments} nonzero segments`);
