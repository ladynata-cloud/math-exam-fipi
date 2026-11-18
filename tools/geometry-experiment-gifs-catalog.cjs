#!/usr/bin/env node
'use strict';

/* Instructional UI recipes for the existing 147 two-dimensional atlas lessons.
 * Recorders execute these actions on fresh real controls; the player never does.
 * Keep manual construction and additional models separate: a future primary
 * investigation must not accidentally receive a legacy construction video.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'assets/geometry-experiment-gifs/catalog.json');
const SOURCE_BASE = '1469ad50a8659f66c8613164009e7387a3a68f2b';
// The original comparison base remains provenance; integration is checked
// against the independently reviewed upstream release, before these guides.
const INTEGRATION_BASE = '64ce01049377b4289f46979c52f2c50daf84b92f';
const OWNED_POGORELOV_TOPICS = new Set(['pogorelov-base-7-16','pogorelov-base-7-20','pogorelov-base-7-39','pogorelov-base-8-61','pogorelov-base-8-62','pogorelov-base-8-67','pogorelov-base-8-80','pogorelov-base-8-98','pogorelov-base-9-112','pogorelov-base-9-127','pogorelov-base-9-131']);
const INVESTIGATION_REF = '99b3bfb9c231d5fd3b5cdda2c543231171a57618';
const INVESTIGATION_SNAPSHOT = 'assets/geometry-experiment-gifs/atanasyan-investigations-99b3bfb9.json';
const courses = [
  {dir:'geometry-pogorelov', key:'pogorelov', expected:84},
  {dir:'geometry-course', key:'atanasyan', expected:63}
];
const tool = name => ({type:'tool', tool:name});
const point = id => ({type:'point', id});
const drag = (id, x, y) => ({type:'drag', id, to:[x,y]});
const slider = (index, value) => ({type:'slider', index, value});
const goal = () => ({type:'goal'});
const step = (caption, ...actions) => ({caption, actions});
const circleObject = (a,b) => ({type:'object', object:{type:'circle',a,b}});
const clone = x => JSON.parse(JSON.stringify(x));
const reading = file => fs.readFileSync(path.join(ROOT,file),'utf8');
const hash = text => crypto.createHash('sha256').update(text).digest('hex');

const names = {
  midpoint:'Как построить середину', median:'Как построить медиану',
  bisector:'Как построить биссектрису', perpendicular:'Как провести перпендикуляр',
  altitude:'Как построить высоту', parallel:'Как провести параллельную',
  reflection:'Как отразить точку', diagonal:'Как провести диагональ',
  perpbisector:'Как построить серединный перпендикуляр',
  midline:'Как построить среднюю линию', explore:'Как изменять этот чертёж'
};

function middleLineSetup() {
  return [tool('midpoint'),point('A'),point('C'),tool('midpoint'),point('B'),point('C'),tool('segment'),point('M'),point('N')];
}

function manualSteps(course, kind, figure, variant) {
  const check = step('Проверь построение. Затем запиши своё наблюдение.',goal());
  const move = (id,x,y,caption) => step(caption,tool('move'),drag(id,x,y));
  if(kind==='midline') {
    if(variant==='move') return [
      step('Средняя линия уже построена. Нажми «Двигать».',tool('move')),
      step('Потяни C: середины переместятся вместе со сторонами.',drag('C',350,135)),
      step('Сравни показания AB и MN под чертежом.'),
      step('Теперь потяни B, чтобы изменилась длина основания.',drag('B',435,330)),
      step('Снова сравни две длины на изменённом треугольнике.'),
      check
    ];
    return [
      step('Нажми «Середина».',tool('midpoint')),
      step('Укажи первый конец стороны — A.',point('A')),
      step('Укажи C. Появится середина AC.',point('C')),
      step('Снова выбери «Середина» и нажми B.',tool('midpoint'),point('B')),
      step('Нажми C. Появится середина BC.',point('C')),
      step('Нажми «Отрезок».',tool('segment')),
      step('Укажи первую построенную середину — M.',point('M')),
      step('Укажи вторую середину — N.',point('N')),
      check
    ];
  }
  if(kind==='midpoint') return [
    step('Нажми «Середина».',tool('midpoint')),
    step('Нажми первый конец отрезка — A.',point('A')),
    step('Нажми B. Появится зависимая середина.',point('B')),
    move('A',110,285,'Выбери «Двигать» и потяни A.'),
    step('Передвинь B и сравни две части отрезка.',drag('B',490,235)),
    check
  ];
  if(kind==='median') return [
    step('Нажми «Середина».',tool('midpoint')),
    step('Выбери A, затем B.',point('A'),point('B')),
    step('Теперь нажми «Отрезок».',tool('segment')),
    step('Соедини C с построенной серединой M.',point('C'),point('M')),
    move('C',figure==='right'?420:350,figure==='right'?170:135,'Потяни C и наблюдай за построенным отрезком.'),
    check
  ];
  if(kind==='bisector') return [
    step('Нажми «Биссектриса».',tool('bisector')),
    step('Первой выбери A на одном луче.',point('A')),
    step('Второй выбери вершину угла — C.',point('C')),
    step('Третьей выбери B на другом луче.',point('B')),
    move('C',figure==='angle'?185:figure==='iso'?320:350,figure==='angle'?265:figure==='iso'?165:135,'Выбери «Двигать» и потяни вершину C.'),
    check
  ];
  if(kind==='perpendicular'||kind==='altitude') {
    const steps = [
      step('Нажми «Перпендикуляр».',tool('perpendicular')),
      step('Сначала укажи точку, из которой строим: C.',point('C')),
      step('Затем выбери A на исходной прямой.',point('A')),
      step('Укажи вторую точку этой прямой — B.',point('B'))
    ];
    if(figure==='quad') steps.push(move('D',95,125,'Потяни D. Зависимая вершина C последует за ней.'));
    else if(figure==='iso') steps.push(move('C',320,165,'Потяни C: равнобедренная форма сохраняется.'));
    else if(figure==='right') steps.push(move('C',430,210,'Потяни C по дуге: прямой угол сохраняется.'));
    else if(figure==='triangle') steps.push(move('C',95,145,'Потяни C влево. Следи за основанием высоты.'));
    else steps.push(move('C',190,245,'Потяни C и наблюдай за перпендикуляром.'));
    steps.push(check);
    return steps;
  }
  if(kind==='parallel') return [
    move('C',figure==='angle'?230:205,figure==='angle'?285:130,'Подвинь C, чтобы рядом было место для построения.'),
    step('Нажми «Параллельная».',tool('parallel')),
    step('Сначала выбери точку новой прямой — C.',point('C')),
    step('Затем выбери A и B на исходной прямой.',point('A'),point('B')),
    move('C',figure==='angle'?240:250,figure==='angle'?255:150,'Вернись к «Двигать» и потяни C.'),
    check
  ];
  if(kind==='reflection') {
    // Pogorelov starts with AB at y=300; the initial image would be off canvas.
    // Atanasyan already starts with AB at y=230, so use its own visible example.
    const startY=course==='pogorelov'?235:155;
    const endY=course==='pogorelov'?255:175;
    return [
      move('C',270,startY,'Подведи C ближе к прямой AB — образ будет виден.'),
      step('Нажми «Отражение».',tool('reflection')),
      step('Первой выбери отражаемую точку C.',point('C')),
      step('Затем выбери A и B — две точки оси.',point('A'),point('B')),
      move('C',335,endY,'Потяни C и наблюдай за её построенным образом.'),
      check
    ];
  }
  if(kind==='diagonal') return [
    step('Нажми «Отрезок».',tool('segment')),
    step('Выбери вершину A.',point('A')),
    step('Выбери несоседнюю вершину C.',point('C')),
    figure==='square'?move('B',390,300,'Потяни B: размеры квадрата изменятся.'):
      move('D',figure==='trapezoid'?205:185,figure==='trapezoid'?145:140,'Потяни синюю вершину D. Рассмотри две части фигуры.'),
    check
  ];
  if(kind==='perpbisector') return [
    move('A',235,215,'Подвинь A ближе к середине поля.'),
    step('Подвинь B: оставь место для двух окружностей.',drag('B',405,215)),
    step('«Окружность»: сначала центр A, затем B.',tool('circle'),point('A'),point('B')),
    step('Ещё окружность: центр B, затем точка A.',tool('circle'),point('B'),point('A')),
    step('Нажми «Пересечение». Выбирай окружности, не точки.',tool('intersection')),
    step('Укажи окружность с центром A.',circleObject('A','B')),
    step('Укажи окружность с центром B. Появятся M и N.',circleObject('B','A')),
    step('«Прямая»: выбери две точки пересечения M и N.',tool('line'),point('M'),point('N')),
    check
  ];
  if(kind==='explore') {
    let steps;
    if(figure==='angle') steps=[
      step('Нажми «Двигать».',tool('move')),
      step('Потяни A ближе к C по тому же лучу. Сравни показание угла.',drag('A',430,290)),
      step('Теперь передвинь B. Сравни новое положение луча.',drag('B',370,130)),
      step('Запиши, что ты менял и что заметил.')
    ];
    else if(figure==='circle') steps=[
      step('Нажми «Двигать».',tool('move')),
      step('Потяни B по окружности. Следи за чертежом.',drag('B',250,100)),
      step('Потяни A, чтобы изменить радиус окружности.',drag('A',490,220)),
      step('Сравни рисунок и показания с первоначальными.')
    ];
    else if(figure==='two-circles') steps=[
      step('Нажми «Двигать».',tool('move')),
      step('Потяни E, чтобы изменить вторую окружность.',drag('E',600,220)),
      step('Потяни D: изменятся её центр и радиус.',drag('D',540,220)),
      step('Сравни положение окружностей до и после движения.')
    ];
    else if(figure==='segment') steps=[
      step('Нажми «Двигать».',tool('move')),
      step('Потяни A: изменятся длина и направление AB.',drag('A',165,300)),
      step('Теперь потяни B и сравни новое положение.',drag('B',475,180)),
      step('Запиши, что ты менял и что заметил.')
    ];
    else if(figure==='triangle') steps=[
      step('Нажми «Двигать».',tool('move')),
      step('Потяни вершину C и рассмотри изменённый треугольник.',drag('C',365,145)),
      step('Передвинь A. Сравни форму и показания.',drag('A',95,270)),
      step('Запиши, что изменилось и что удалось сохранить.')
    ];
    else throw Error('Unsupported exploration figure: '+figure);
    steps.push(step(course==='atanasyan'?'Нажми «Что записать в наблюдение?».':'Нажми «Проверить построение» для подсказки к наблюдению.',goal()));
    return steps;
  }
  throw Error('Unsupported manual goal: '+kind);
}

const experimentRecipes = {
  angles:{title:'Как менять угол пересечения',preferred:'geometry-course/atlas/measure-angle.html',steps:[
    step('Найди ползунок «Угол α, градусы».'),
    step('Поставь 110° и рассмотри подписи углов.',slider(0,110)),
    step('Поставь 40° и сравни новое положение.',slider(0,40)),
    step('Верни 60°. Запиши своё наблюдение.',slider(0,60))
  ]},
  trig:{title:'Как исследовать единичную окружность',preferred:'geometry-course/atlas/trig-circle.html',steps:[
    step('Найди ползунок угла под окружностью.'),
    step('Поставь 30° и посмотри на две координаты.',slider(0,30)),
    step('Поставь 150°. Сравни координаты и их знаки.',slider(0,150)),
    step('Теперь проверь 210°.',slider(0,210)),
    step('Проверь 330° и сформулируй своё наблюдение.',slider(0,330))
  ]},
  scale:{title:'Как менять коэффициент подобия',preferred:'geometry-course/atlas/homothety.html',steps:[
    step('Найди ползунок «Коэффициент k».'),
    step('Поставь k = 0,5. Сравни две фигуры.',slider(0,0.5)),
    step('Поставь k = 2 и сравни показания.',slider(0,2)),
    step('Теперь поставь k = −2. Следи за положением фигуры.',slider(0,-2)),
    step('Отдельно проверь k = 0 и прочитай предупреждение.',slider(0,0))
  ]},
  rotation:{title:'Как поворачивать всю фигуру',preferred:'geometry-course/atlas/translation-rotation.html',steps:[
    step('Найди ползунок угла под рисунком.'),
    step('Поставь 90°. Следи сразу за всеми вершинами.',slider(0,90)),
    step('Поставь 180° и сравни положение фигур.',slider(0,180)),
    step('Проверь 270°. Запиши, что изменяется при повороте.',slider(0,270))
  ]},
  area:{title:'Как перенести отрезанный треугольник',preferred:'geometry-course/atlas/area-parallelogram.html',steps:[
    step('Найди ползунок переноса под рисунком.'),
    step('Передвинь его примерно до середины.',slider(0,0.5)),
    step('Доведи до правого края.',slider(0,1)),
    step('Верни кусочек назад и сравни обе фигуры.',slider(0,0))
  ]},
  pythagoras:{title:'Как менять катет в модели площадей',preferred:'geometry-course/atlas/pythagoras.html',steps:[
    step('Найди ползунок «Катет a; катет b=4».'),
    step('Поставь a = 2. Рассмотри внутреннюю фигуру.',slider(0,2)),
    step('Поставь a = 5. Сравни рисунок и показания.',slider(0,5)),
    step('Верни a = 3 и запиши наблюдение своими словами.',slider(0,3))
  ]},
  circle:{title:'Как проверить положение двух окружностей',preferred:'geometry-course/atlas/circle-position.html',steps:[
    step('Найди ползунок расстояния d между центрами.'),
    step('Поставь d = 149 и рассмотри общие точки.',slider(0,149)),
    step('Поставь d = 150 и сравни положение.',slider(0,150)),
    step('Затем проверь d = 151.',slider(0,151)),
    step('Отдельно проверь d = 30.',slider(0,30)),
    step('Проверь d = 29. Сравни оба граничных случая.',slider(0,29))
  ]},
  projection:{title:'Как исследовать высоту и проекции',preferred:'geometry-pogorelov/atlas/pogorelov-base-8-63.html',steps:[
    step('Найди ползунок «Положение C, градусы».'),
    step('Поставь 30°. Следи за точками C и D.',slider(0,30)),
    step('Проверь 90° и сравни подписи отрезков.',slider(0,90)),
    step('Поставь 145°. Сопоставь оба равенства под рисунком.',slider(0,145))
  ]},
  coordinate:{title:'Как отдельно менять k и b',preferred:'geometry-pogorelov/atlas/pogorelov-base-8-78.html',steps:[
    step('Сначала работай только с ползунком k.'),
    step('Поставь k = 2. Ползунок b пока не трогай.',slider(0,2)),
    step('Проверь k = −1. Следи за отмеченными точками.',slider(0,-1)),
    step('Теперь оставь k на месте и поставь b = 2.',slider(1,2)),
    step('Поставь b = −2. Сравни два способа изменения прямой.',slider(1,-2))
  ]},
  'triangle-exists':{title:'Как проверить, получится ли треугольник',preferred:'geometry-pogorelov/atlas/pogorelov-base-8-66.html',steps:[
    step('Оставь AC = 4 и BC = 5. Меняй ползунок AB.'),
    step('Поставь AB = 9 и рассмотри положение точек.',slider(2,9)),
    step('Чуть уменьши основание: AB = 8,9.',slider(2,8.9)),
    step('Теперь поставь AB = 9,1. Сравни три случая.',slider(2,9.1))
  ]}
};

// Pending #623 is recorded as a separate, pinned surface. These assets are ready
// for a checked integration; they do not replace the current lesson runtime.
// Values are chosen to make the controls' purpose visible, not to select the
// correct prediction or fill in a learner's observation.
const investigationChanges = {
  segments:[['d',4],['angle',45],['offset',0]],
  angles:[['angle',110],['length',2]],
  equality:[['angle',90],['scale',1.5]],
  length:[['x',4],['x',7]],
  'measure-angle':[['ray',80],['ray',140]],
  perpendicular:[['angle',90],['angle',120]],
  'triangle-sas':[['angle',90],['mode','ssa']],
  cevians:[['x',3],['x',5]],
  'triangle-signs':[['mode','aaa'],['scale',2],['mode','sss']],
  compass:[['radius',0.8],['radius',0.5],['radius',0.4]],
  parallels:[['angle',110],['tilt',10]],
  'parallel-angles':[['angle',100],['angle',140]],
  'triangle-angles':[['a',7],['c',10]],
  'right-triangle':[['angle',50],['scale',1.5]],
  distance:[['x',0],['x',-3],['height',2]],
  'angle-locus':[['position',0.25],['angle',120],['position',0.5]],
  'perp-locus':[['x',2],['y',1],['x',0]],
  'chords-tangent':[['distance',2],['distance',3],['distance',4]],
  'triangle-circles':[['x',5],['height',2]],
  axis:[['x',1],['y',-1]],
  polygons:[['n',3],['n',7]],
  parallelogram:[['shift',-1],['height',4]],
  trapezoid:[['a',4],['b',6],['height',2]],
  rectangle:[['shift',1],['height',4]],
  rhombus:[['angle',90],['angle',120]],
  central:[['shift',-1],['height',4]],
  'area-basics':[['separate',2],['separate',0]],
  'area-parallelogram':[['shift',-2],['height',4]],
  'area-triangle':[['x',1],['x',7]],
  'area-trapezoid':[['height',4],['a',5],['b',2]],
  pythagoras:[['a',5],['b',3],['delta',0.5]],
  heron:[['a',7],['c',12]],
  similarity:[['scale',0.75],['scale',2]],
  'similarity-signs':[['mode','sas'],['scale',2]],
  midline:[['x',5],['height',2]],
  centers:[['x',-1],['height',2]],
  projections:[['x',1],['x',4]],
  'similarity-measure':[['sun',60],['height',1.5]],
  'trig-right':[['angle',60],['scale',2]],
  'circle-position':[['d',5],['d',5.5],['d',1]],
  inscribed:[['position',0.8],['arc',160]],
  'chord-angles':[['x',6],['angle',45]],
  'cyclic-quad':[['angle',55],['mode','tangent']],
  vectors:[['direction','opposite'],['scale',1.5],['angle',90]],
  'vector-add':[['angle',90],['operation','difference']],
  'vector-scale':[['scale',-0.5],['scale',0],['scale',2]],
  'vector-basis':[['angle',0],['angle',90],['x',3]],
  coordinates:[['x',-2],['y',4]],
  'line-circle-equations':[['x',1],['y',2],['mode','line']],
  'trig-circle':[['angle',30],['angle',150],['angle',210]],
  'area-sine':[['angle',90],['b',6]],
  'sine-rule':[['angle',140],['radius',2]],
  'cosine-rule':[['angle',110],['b',5]],
  'solve-triangle':[['mode','ssa'],['angle',20],['angle',40]],
  'dot-product':[['angle',90],['angle',120],['length',5]],
  'regular-polygons':[['n',8],['radius',2]],
  'circle-metric':[['angle',180],['radius',2]],
  movement:[['mode','translation'],['mode','scale'],['scale',2]],
  'translation-rotation':[['angle',90],['mode','translation'],['shift',-1]],
  'symmetry-method':[['x',-2],['x',2]],
  'polygon-similarity':[['scale',0.75],['scale',2]],
  homothety:[['scale',-1],['ox',1],['oy',2]],
  'similarity-method':[['x',5],['height',2]]
};

function refreshPinnedSnapshot() {
  const renderer='geometry-course/assets/investigations.js';
  const style='geometry-course/assets/course.css';
  const source=execFileSync('git',['show',INVESTIGATION_REF+':'+renderer],{cwd:ROOT,encoding:'utf8',maxBuffer:4*1024*1024});
  const css=execFileSync('git',['show',INVESTIGATION_REF+':'+style],{cwd:ROOT,encoding:'utf8',maxBuffer:4*1024*1024});
  const context={};context.window=context;
  vm.createContext(context);
  vm.runInContext(source,context,{timeout:2000,filename:renderer});
  const api=context.GeoInvestigations;
  if(!api||api.ids.length!==63)throw Error('Pinned #623 should expose 63 investigations');
  const topics={};
  for(const topic of api.ids) {
    const values={...api.defaults(topic)};
    for(const [key,value] of investigationChanges[topic]||[]) {
      values[key]=value;
      // The initial snapshot is checked against the actual immutable pure model.
      // Ordinary generation/checking remains independent of Git object availability.
      if(!api.model(topic,values))throw Error('Pinned model did not return '+topic);
    }
    topics[topic]={title:api.descriptions[topic].title,controls:clone(api.controls[topic])};
  }
  const snapshot={version:1,sourceRef:INVESTIGATION_REF,renderer,style,sourceHashes:{[renderer]:hash(source),[style]:hash(css)},topics};
  fs.mkdirSync(path.dirname(path.join(ROOT,INVESTIGATION_SNAPSHOT)),{recursive:true});
  fs.writeFileSync(path.join(ROOT,INVESTIGATION_SNAPSHOT),JSON.stringify(snapshot,null,2)+'\n');
}

function addPinnedInvestigations(pages,clips,sources) {
  const raw=reading(INVESTIGATION_SNAPSHOT),snapshot=JSON.parse(raw);
  if(snapshot.version!==1||snapshot.sourceRef!==INVESTIGATION_REF)throw Error('Pinned investigation metadata has the wrong source revision');
  const {renderer,style,topics}=snapshot;
  if(Object.keys(topics).length!==63)throw Error('Pinned metadata should describe 63 investigations');
  sources[INVESTIGATION_SNAPSHOT]=hash(raw);
  for(const file of [renderer,style]) {
    if(!/^[0-9a-f]{64}$/.test(snapshot.sourceHashes[file]||''))throw Error('Missing pinned source hash: '+file);
    sources[INVESTIGATION_REF+':'+file]=snapshot.sourceHashes[file];
  }
  const ids=Object.keys(topics);
  if(Object.keys(investigationChanges).length!==ids.length)throw Error('Pinned investigation recipes incomplete');
  for(const topic of ids) {
    const page='geometry-course/atlas/'+topic+'.html';
    if(!pages[page])throw Error('Pinned topic is outside the approved pages: '+topic);
    const controls=topics[topic].controls,changes=investigationChanges[topic];
    if(!changes)throw Error('Missing pinned topic recipe: '+topic);
    const steps=[
      step('Выбери свой прогноз. В примере — «Пока не знаю».',{type:'prediction',value:'unsure'}),
      step('Нажми «Проверить опытом» — откроются настройки.',{type:'open-experiment'})
    ];
    const values=Object.fromEntries(controls.map(c=>[c.key,c.value]));
    for(const [key,value] of changes) {
      const control=controls.find(c=>c.key===key);
      if(!control)throw Error('No control '+topic+'.'+key);
      let action,caption;
      if(control.options) {
        const option=control.options.find(o=>o[0]===value);
        if(!option)throw Error('No option '+topic+'.'+key+'='+value);
        action={type:'select',key,index:controls.filter(c=>c.options).findIndex(c=>c.key===key),value,label:control.label};
        caption='«'+control.label+'»: выбери «'+option[1]+'».';
      } else {
        const increments=(value-control.min)/control.step;
        if(typeof value!=='number'||value<control.min||value>control.max||Math.abs(increments-Math.round(increments))>1e-7)throw Error('Invalid slider value '+topic+'.'+key+'='+value);
        action={type:'slider',key,index:controls.filter(c=>!c.options).findIndex(c=>c.key===key),value,label:control.label};
        caption='Ползунок «'+control.label+'» → '+String(value).replace('.',',')+'.';
      }
      if(values[key]===value)throw Error('Recipe must visibly change a control: '+topic+'.'+key);
      values[key]=value;
      steps.push(step(caption,action));
    }
    steps.push(step('Вернись к своему прогнозу и запиши, что заметил.',{type:'observation'}));
    const id='atanasyan-topic-'+topic;
    // This recording is pinned to 99b3bfb9, where angles still had the
    // bisector manual goal. Its metadata must not follow the later live task.
    const recordedGoal = topic==='angles' ? 'bisector' : pages[page].goal;
    clips[id]=media({id,surface:'investigation',title:'Как провести опыт: '+topics[topic].title,topic,sourceCourse:'geometry-course',sourcePage:'/'+page,sourceRef:INVESTIGATION_REF,renderer,style,figure:pages[page].figure,goal:recordedGoal,experiment:null,setup:[],steps,note:'В примере выбран ответ «Пока не знаю». Свой прогноз и наблюдение формулируй самостоятельно.'});
    pages[page].investigations=[id];
  }
}

function media(clip) {
  clip.gif=clip.id+'.gif';
  clip.frames=clip.steps.map((_,i)=>clip.id+'-'+String(i+1).padStart(2,'0')+'.png');
  clip.poster=clip.frames[0];
  return clip;
}

function buildCatalog() {
  const pages={},clips={},configs=[],sources={};
  for(const course of courses) {
    const dataPath=course.dir+'/data/course.json';
    const raw=reading(dataPath);
    sources[dataPath]=hash(raw);
    const units=JSON.parse(raw).units.filter(u=>!u.space);
    if(units.length!==course.expected) throw Error(course.key+': expected '+course.expected+' two-dimensional lessons, got '+units.length);
    for(const file of ['geometry.js','lab.js','experiments.js',...(course.key==='pogorelov'?['extra-models.js']:[])]) {
      const p=course.dir+'/assets/'+file;sources[p]=hash(reading(p));
    }
    for(const unit of units) {
      const page=course.dir+'/atlas/'+unit.id+'.html';
      const match=reading(page).match(/window\.COURSE_CONFIG=(.*?);<\/script>/s);
      if(!match) throw Error('Missing generated COURSE_CONFIG: '+page);
      const cfg=JSON.parse(match[1]);
      if(cfg.unit.id!==unit.id||cfg.unit.goal!==unit.goal||cfg.unit.figure!==unit.figure) throw Error('Data and generated page disagree: '+page);
      const ownedTopic = course.key==='pogorelov' && !!unit.topicQuestion;
      if(course.key==='pogorelov' && ownedTopic !== OWNED_POGORELOV_TOPICS.has(unit.id)) throw Error('Unreviewed topic-guide ownership: '+unit.id);
      if(ownedTopic) {
        if(!reading(page).includes('../assets/topic-labs.js')) throw Error('Missing existing topic-guide runtime: '+page);
        pages[page]={unitId:unit.id,course:course.dir,title:unit.title,figure:unit.figure,goal:unit.goal,manual:[],experiments:[],investigations:[],primarySurface:'existing-topic-guide'};
        continue;
      }
      if(!names[unit.goal]) throw Error('No goal recipe: '+unit.goal);
      const variants=unit.goal==='midline'?['build','move']:[''];
      const ids=[];
      for(const variant of variants) {
        const id=course.key+'-'+unit.goal+'-'+unit.figure+(variant?'-'+variant:'');
        ids.push(id);
        if(!clips[id]) {
          const clip={id,surface:'manual',title:variant==='move'?'Как сравнить среднюю линию с основанием':names[unit.goal],sourceCourse:course.dir,sourcePage:'/'+page,figure:unit.figure,goal:unit.goal,experiment:null,setup:variant==='move'?middleLineSetup():[],steps:manualSteps(course.key,unit.goal,unit.figure,variant)};
          if(['midpoint','median','midline','perpbisector','reflection'].includes(unit.goal)) clip.note='Показан чистый пример. В твоём чертеже новые точки могут называться иначе: выбирай точки по их построению.';
          if(variant==='move') clip.note='В записи середины уже соединены. Если ещё не построил отрезок, сначала посмотри «Как построить среднюю линию». Буквы в твоём чертеже могут отличаться.';
          clips[id]=media(clip);
        }
        if((course.key==='pogorelov'&&unit.id==='pogorelov-base-8-58')||(course.key==='atanasyan'&&unit.id==='midline')) clips[id].sourcePage='/'+page;
      }
      pages[page]={unitId:unit.id,course:course.dir,title:unit.title,figure:unit.figure,goal:unit.goal,manual:ids,experiments:[],investigations:[],primarySurface:'manual'};
      configs.push({page,course,unit,experiment:cfg.experiment});
    }
  }
  // An identical model renderer can share a recording even when its outer course
  // page differs. Manual UIs are deliberately not shared between the two courses.
  if(reading('geometry-course/assets/experiments.js')!==reading('geometry-pogorelov/assets/experiments.js')) throw Error('Shared model renderers differ; split experiment clips by course before recording.');
  for(const cfg of configs) {
    if(!cfg.experiment) continue;
    const kind=cfg.experiment,recipe=experimentRecipes[kind];
    if(!recipe) throw Error('No experiment recipe: '+kind+' on '+cfg.page);
    const id='experiment-'+kind;
    pages[cfg.page].experiments.push(id);
    if(!clips[id]) {
      const preferred=configs.find(x=>x.page===recipe.preferred&&x.experiment===kind)||cfg;
      clips[id]=media({id,surface:'experiment',title:recipe.title,sourceCourse:preferred.course.dir,sourcePage:'/'+preferred.page,figure:preferred.unit.figure,goal:preferred.unit.goal,experiment:kind,setup:[],steps:clone(recipe.steps)});
    }
  }
  addPinnedInvestigations(pages,clips,sources);
  const sorted = obj => Object.fromEntries(Object.entries(obj).sort(([a],[b])=>a.localeCompare(b,'en')));
  if(Object.keys(pages).length!==147) throw Error('Expected 147 page mappings');
  return {version:1,sourceBase:SOURCE_BASE,integrationBase:INTEGRATION_BASE,sources:sorted(sources),coverage:{pogorelov:84,atanasyan:63,manualClips:Object.values(clips).filter(x=>x.surface==='manual').length,experimentClips:Object.values(clips).filter(x=>x.surface==='experiment').length,investigationClips:Object.values(clips).filter(x=>x.surface==='investigation').length},compatibility:{primarySurface:'manual',pendingAtanasyanPR:623,pendingHead:INVESTIGATION_REF,note:'Pinned topic recordings are active only with their exact reviewed sources. Manual guides belong with the retained construction board; existing Pogorelov topic guides keep ownership of their scenes.'},pages:sorted(pages),clips:sorted(clips)};
}

if(require.main===module) {
  if(process.argv.includes('--refresh-pinned-snapshot')) refreshPinnedSnapshot();
  const catalog=buildCatalog();
  const serialized=JSON.stringify(catalog,null,2)+'\n';
  if(process.argv.includes('--check')) {
    if(!fs.existsSync(OUTPUT)||fs.readFileSync(OUTPUT,'utf8')!==serialized) throw Error('Catalogue is stale: run node tools/geometry-experiment-gifs-catalog.cjs');
  } else {
    fs.mkdirSync(path.dirname(OUTPUT),{recursive:true});
    fs.writeFileSync(OUTPUT,serialized);
  }
  console.log(JSON.stringify({pages:Object.keys(catalog.pages).length,clips:Object.keys(catalog.clips).length,...catalog.coverage}));
}
module.exports={buildCatalog,manualSteps,experimentRecipes,investigationChanges};
