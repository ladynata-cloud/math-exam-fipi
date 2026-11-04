'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const ROOT = path.resolve(__dirname, '../..');
const read = name => fs.readFileSync(path.join(ROOT, name), 'utf8');
const course = JSON.parse(read('geometry-course/data/course.json'));
function fixture() {
  const dom = new JSDOM('<main></main>', { runScripts:'outside-only', url:'https://geometry.example/' });
  dom.window.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get:()=>()=>{}, set:()=>true });
  dom.window.eval(read('geometry-course/assets/geometry.js'));
  dom.window.eval(read('geometry-course/assets/lab.js'));
  return dom;
}
test('all 63 thematic units name every point and all 194 initial objects by their source type', () => {
  const dom = fixture(), w = dom.window, host = w.document.querySelector('main');
  const counts={ point:0,segment:0,ray:0,line:0,circle:0 };
  try {
    for (const unit of course.units) {
      const view=w.GeoLab.mount(host,{figure:unit.figure,goal:unit.goal},()=>{});
      const before=view.board.snapshot();
      const pointOptions=[...host.querySelectorAll('.point-select option')];
      assert.deepEqual(pointOptions.map(option=>option.value),Array.from(view.board.points,point=>point.id));
      pointOptions.forEach(option=>assert.match(option.textContent,/^Точка [A-Z][A-Z0-9]* — (подвижная|построенная)$/));
      counts.point+=pointOptions.length;
      const objectOptions=[...host.querySelectorAll('.object-select option')];
      assert.deepEqual(objectOptions.map(option=>option.value),Array.from(view.board.objects,object=>object.id));
      for (let i=0;i<objectOptions.length;i++) {
        const object=view.board.objects[i], label=objectOptions[i].textContent;
        if (object.type==='circle') {
          assert.equal(label,'Окружность с центром '+object.a+' через точку '+object.b);counts.circle++;
        } else {
          const names={segment:'Отрезок',ray:'Луч',line:'Прямая'};
          assert(names[object.extent],unit.id+': explicit source extent');
          assert.equal(label,names[object.extent]+' '+object.a+object.b);counts[object.extent]++;
        }
      }
      host.querySelector('[data-tool=intersection]').click();
      host.querySelector('[data-act=object]').click();
      assert(host.querySelector('.tool-instruction').textContent.includes('Выбрано: '+objectOptions[0].textContent+'.'));
      assert.equal(view.board.snapshot(),before,'Naming and first selection do not change geometry');
      view.destroy();
    }
    assert.deepEqual(counts,{point:210,segment:175,ray:10,line:0,circle:9});
  } finally { w.close(); }
});
test('constructed line, segment, ray and circle keep exact IDs and distinct mathematical types', () => {
  const dom=fixture(),w=dom.window,host=w.document.querySelector('main');
  try {
    const view=w.GeoLab.mount(host,{figure:'triangle'},()=>{}),board=view.board;
    board.make('line',['A','B']);board.make('segment',['A','C']);board.make('bisector',['A','C','B']);board.make('circle',['A','B']);
    const before=board.snapshot();view.redraw();
    const labels=[...host.querySelectorAll('.object-select option')].map(option=>option.textContent);
    assert(labels.includes('Прямая AB'));assert(labels.includes('Отрезок AC'));
    const ray=board.objects.find(object=>object.extent==='ray');assert(labels.includes('Луч '+ray.a+ray.b));
    assert(labels.includes('Окружность с центром A через точку B'));
    assert.equal(board.snapshot(),before);
    host.querySelector('[data-tool=segment]').click();host.querySelector('[data-act=select]').click();
    assert.match(host.querySelector('.tool-instruction').textContent,/Выбрано: Точка A\./);
    assert.match(host.querySelector('.lab-readout').textContent,/AB = /,'Formula notation remains mathematical notation');
  } finally {w.close();}
});
test('all 63 published standalone pages contain the exact updated lab and retain canonical URLs', () => {
  const source=read('geometry-course/assets/lab.js').replace(/<\/script/g,'<\\/script');
  for (const unit of course.units) {
    const html=read('geometry-course/atlas/'+unit.id+'.html');
    assert.equal(html.split(source).length,2,unit.id+': exact lab source appears once');
    assert(html.includes('<link rel="canonical" href="https://mathexam.space/geometry-course/atlas/'+unit.id+'.html">'));
  }
});
