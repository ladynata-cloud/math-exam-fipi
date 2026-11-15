/* Read-only view of the published OGE trainers. Counters describe practice,
 * not independent mastery. No migration, network request or storage write. */
(function (root, factory) {
  'use strict';
  var api = factory(typeof module === 'object' && module.exports ? require('./registry.js') : root.RV);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.OgeLearningMap = api;
})(typeof window === 'object' ? window : null, function (registry) {
  'use strict';
  var KEY = 'mathExamCourseProgress.v1';
  var MAX_COUNT = 1000000;
  var REVIEW_DELAY = 24 * 60 * 60 * 1000;
  var EVIDENCE_TASKS = ['task-11','task-22','task-24'];
  var SKILLS11 = ['lin_k','lin_b','par_a','par_c','par_vertex','hyp','family','build','oge'];
  // Published TASKS category ranges; validation mirrors task 6 restoreProgress.
  // The model test compares every category with the trainer's current bank.
  var FRACTION_RANGES = {all:[0,173],bank:[0,80],progon:[81,106],dec:[107,127],frac:[128,145],combo:[146,163],adv:[164,173]};
  // Compact identity list from task19-visual-data.js; do not import its full lesson bank.
  // Its live reader canonicalizes aliases with the last stored record winning.
  var STATEMENTS19 = Object.create(null);
  for (var statementIndex=0;statementIndex<=104;statementIndex++) {
    var statementId='prev-'+String(statementIndex).padStart(3,'0');
    STATEMENTS19[statementId]=statementId;
  }
  [
    "prev-001|adjacent_angles_always_equal",
    "prev-004|fipi-042",
    "prev-005|fipi-027",
    "prev-006|fipi-073",
    "prev-012|fipi-023",
    "prev-014|fipi-031|fipi-065",
    "prev-015|fipi-010",
    "prev-017|fipi-006",
    "prev-022|fipi-005",
    "prev-023|fipi-066",
    "prev-025|fipi-011",
    "prev-027|fipi-016",
    "prev-040|fipi-071",
    "prev-042|fipi-007",
    "prev-043|fipi-032",
    "prev-044|fipi-055",
    "prev-047|fipi-056",
    "prev-052|fipi-015",
    "prev-053|fipi-004",
    "prev-054|fipi-033",
    "prev-057|fipi-040",
    "prev-063|fipi-012",
    "prev-067|fipi-049",
    "prev-073|fipi-020",
    "prev-074|fipi-013",
    "prev-076|fipi-062",
    "prev-081|fipi-017",
    "perpendicular_bisector_point_equidistant_endpoints|fipi-047",
    "point_on_angle_bisector_equidistant_sides",
    "circle_intersection_point_equidistant_centers",
    "circles_intersect_if_radius_bigger",
    "all_diameters_equal",
    "tangent_parallel_radius",
    "point_on_circle_distance_radius",
    "inscribed_angle_over_diameter_right",
    "inscribed_equals_central",
    "all_chords_equal|fipi-030",
    "triangle_area_less_than_product_two_sides",
    "similar_triangles_area_ratio_equals_k",
    "adjacent_angles_one_acute_one_obtuse_always",
    "angle_acute_adjacent_acute",
    "parallel_through_point_exists|fipi-001",
    "perp_through_point_exists",
    "three_lines_through_one_point_exist",
    "two_parallel_to_third_parallel|fipi-054",
    "two_parallel_to_third_perpendicular",
    "two_perp_to_third_perp",
    "isosceles_trapezoid_bases_equal",
    "trap_bases_trapezoid_parallel",
    "trapezoid_area_base_times_height",
    "trapezoid_diagonal_makes_equal_triangles",
    "trapezoid_diagonals_bisect",
    "trapezoid_midline_equals_sum_bases",
    "obtuse_triangle_all_obtuse|fipi-053",
    "right_triangle_angles_sum_90",
    "triangle_angles_sum_180|fipi-003",
    "triangle_angles_sum_360",
    "triangle_has_angle_le_60",
    "bisector_bisects_opposite_side",
    "median_bisects_angle|fipi-067",
    "circumcenter_always_inside|fipi-018",
    "hypotenuse_equals_sum_legs",
    "hypotenuse_less_than_sum_legs",
    "right_triangle_acute_sum_90|fipi-022",
    "right_triangle_area_equals_product_legs",
    "tri_aa_similarity",
    "tri_aaa_congruent",
    "tri_two_sides_congruent",
    "isosceles_all_bisectors_are_altitudes",
    "isosceles_all_bisectors_are_medians",
    "equilateral_altitudes_equal",
    "tri_1_2_4_exists",
    "tri_2_4_6_not_exist",
    "tan_acute_less_than_1",
    "parallelogram_cyclic",
    "square_area_adjacent_sides_product",
    "equidiagonal_orthogonal_quadrilateral_square",
    "quadrilaterals_equal_if_corresponding_sides_equal",
    "parallelogram_adjacent_sides_equal_rhombus",
    "parallelogram_equal_diagonals_rhombus|prev-048-reverse|fipi-002",
    "parallelogram_has_two_equal_angles",
    "rect_perp_diagonals_exists",
    "rect_diagonals_bisect",
    "rhombus_all_angles_equal",
    "rhombus_area_ab_sin",
    "rhombus_area_side_times_height",
    "rhombus_diagonals_bisect",
    "rhombus_diagonals_equal",
    "rhombus_right_angle_square",
    "summer-008|fipi-008",
    "summer-009|fipi-009",
    "summer-014|fipi-014",
    "summer-019|fipi-019",
    "summer-021|fipi-021",
    "summer-024|fipi-024",
    "summer-025|fipi-025",
    "summer-026|fipi-026",
    "summer-028|fipi-028",
    "summer-029|fipi-029",
    "summer-034|fipi-034",
    "summer-035|fipi-035",
    "summer-036|fipi-036",
    "summer-037|fipi-037",
    "summer-038|fipi-038",
    "summer-039|fipi-039",
    "summer-041|fipi-041",
    "summer-043|fipi-043",
    "summer-044|fipi-044",
    "summer-045|fipi-045",
    "summer-046|fipi-046",
    "summer-048|fipi-048",
    "summer-050|fipi-050",
    "summer-051|fipi-051",
    "summer-052|fipi-052",
    "summer-057|fipi-057",
    "summer-058|fipi-058",
    "summer-059|fipi-059",
    "summer-060|fipi-060",
    "summer-061|fipi-061",
    "summer-063|fipi-063",
    "summer-064|fipi-064",
    "summer-068|fipi-068",
    "summer-069|fipi-069",
    "summer-070|fipi-070",
    "summer-072|fipi-072",
    "reference-005",
    "reference-014",
    "reference-015",
    "reference-016",
    "reference-018",
    "reference-019",
    "reference-024",
    "reference-026",
    "reference-029",
    "reference-030",
    "reference-036",
    "reference-037",
    "reference-039",
    "reference-043",
    "reference-044",
    "reference-047",
    "reference-054",
    "reference-055",
    "reference-056",
    "reference-068",
    "reference-073",
    "reference-074",
    "reference-075",
    "reference-079",
    "reference-080",
    "reference-082",
    "reference-096",
    "reference-097",
    "reference-105",
    "reference-106",
    "tri_aaa_similarity"
  ].forEach(function(group){var names=group.split('|');names.forEach(function(id){STATEMENTS19[id]=names[0];});});
  function step(id, title, href, source, tid, key) {
    return { id:id, title:title, href:href, source:source, tid:tid || '', key:key || KEY };
  }
  function line(number, title, file, tid) {
    return step('task-'+number, title, '/trainers/'+file+'.html', 'line', tid);
  }
  var tracks = [
    { id:'numbers', title:'Числа и вычисления', summary:'Дроби, сравнение чисел, степени и корни.', steps:[
      step('task-6','№6 · Действия с дробями','/trainers/oge-task6-fractions.html','fractions','','mathExam.oge6.practice.v1'),
      line(7,'№7 · Числа на прямой','oge-task7-number-line','oge-t7-pryamaya'),
      line(8,'№8 · Степени и корни','oge-task8-powers-roots','oge-t8-stepeni')
    ]},
    { id:'practical', title:'Практические задачи', summary:'№1–5: прочитать условие, выбрать данные и единицы.', steps:[
      step('plot-tires','Шины','/trainers/oge-1-5-trainers/practice-1-5-tires.html','plot','practiceTiresTrainer'),
      step('plot-apartments','План квартиры','/trainers/oge-1-5-trainers/practice-1-5-apartments.html','plot','practiceApartmentsTrainer'),
      step('plot-roads-grid','Дороги по клеткам','/trainers/oge-1-5-trainers/practice-1-5-roads-grid.html','plot','practiceRoadsGridTrainer'),
      step('plot-roads-schema','Схемы дорог','/trainers/oge-1-5-trainers/practice-1-5-roads-schema.html','plot','practiceRoadsSchemaTrainer'),
      step('plot-stoves','Печки','/trainers/oge-1-5-trainers/practice-1-5-stoves.html','plot','practiceStovesTrainer'),
      step('plot-land','Участки','/trainers/oge-1-5-trainers/practice-1-5-land-plots.html','plot','practiceLandPlotsTrainer'),
      step('plot-tariffs','Тарифы','/trainers/oge-1-5-trainers/practice-1-5-tariffs.html','plot','practiceTariffsTrainer'),
      step('plot-paper','Листы бумаги','/trainers/oge-1-5-trainers/practice-1-5-paper-sheets.html','plot','practicePaperSheetsTrainer')
    ]},
    { id:'equations', title:'Уравнения и формулы', summary:'От простого уравнения к формулам и развёрнутому решению.', steps:[
      line(9,'№9 · Уравнения','oge-task9-equations','oge-t9-uravneniya'),
      line(12,'№12 · Расчёты по формулам','oge-task12-formulas-trainer','oge-t12-formuly'),
      step('task-20','№20 · Алгебра, часть 2','/trainers/oge-task20-equations.html','modules','oge-t20-algebra','mathExam.oge20.practice.v1')
    ]},
    { id:'inequalities', title:'Неравенства', summary:'Знак, граница, промежутки и системы.', steps:[
      step('task-13','№13 · Неравенства','/trainers/oge13-inequalities-series.html','inequalities','oge13InequalitiesSeries')
    ]},
    { id:'graphs', title:'Функции и графики', summary:'Читать график, связывать его с формулой, исследовать.', steps:[
      line(11,'№11 · Графики функций','oge-task11-graphs-trainer','oge-t11-grafiki'),
      step('task-22','№22 · Графики, часть 2','/trainers/oge-task22-functions-graphs.html','modules','oge-t22-grafiki','mathExam.oge22.practice.v1')
    ]},
    { id:'geometry', title:'Геометрия', summary:'Чертёж, свойства фигур, вычисления и доказательства.', steps:[
      line(15,'№15 · Треугольники','oge-task15-triangles','oge-t15-treugolniki'),
      line(16,'№16 · Окружность','oge-task16-circle','oge-task16-circle'),
      line(17,'№17 · Четырёхугольники','oge-task17-quadrilaterals','oge17-chetyrehugolniki'),
      line(18,'№18 · Клетчатая бумага','oge-task18-grid','oge18-kletki'),
      step('task-19','№19 · Утверждения','/trainers/task19-trainer.html','statements','','mathExam.task19.visualHints.v1'),
      line(23,'№23 · Геометрические вычисления','oge-task23-geometry-calculations','oge23-vychisleniya'),
      line(24,'№24 · Доказательства','oge-task24-proofs','oge24-dokazatelstva'),
      line(25,'№25 · Сложная геометрия','oge-task25-geometry','oge25-geometriya')
    ]},
    { id:'data', title:'Вероятность и задачи', summary:'Вероятность, последовательности, движение, работа и смеси.', steps:[
      line(10,'№10 · Вероятность','oge-task10-probability','oge-t10-veroyatnost'),
      line(14,'№14 · Прогрессии','oge-task14-progressions','oge-t14-progressii'),
      step('task-21','№21 · Текстовые задачи','/trainers/oge-task21-word-problems.html','word','oge-t21-tekst','oge21_prog')
    ]}
  ];
  function object(value) { return !!value && typeof value === 'object' && !Array.isArray(value); }
  function count(value) { return Number.isSafeInteger(value) && value >= 0 ? Math.min(value,MAX_COUNT) : 0; }
  function record(value) { return object(value) ? value : {}; }
  function stamp(value, now) { return Number.isSafeInteger(value) && value > 0 && value <= now + 60000 ? value : 0; }
  function types(tid) { return registry && typeof registry.typesOf === 'function' ? registry.typesOf(tid) : []; }
  function coverage(value,total,label) { return total > 0 ? {value:Math.min(value,total),total:total,label:label} : null; }
  // Read only facts produced by the three updated native trainers. Legacy
  // correct-answer counters cannot establish whether a hint was used.
  function learningEvidence(value, now, invalid) {
    if(value===undefined || value===null)return null;
    if(!object(value)||value.v!==1||!Array.isArray(value.attempts)){invalid();return null;}
    if(value.attempts.length>100){invalid();return null;}
    var byId=Object.create(null),conflicts=new Set();
    value.attempts.forEach(function(raw){
      if(!object(raw)||typeof raw.id!=='string'||!raw.id||raw.id.length>160||
        typeof raw.skill!=='string'||!raw.skill||raw.skill.length>120||
        typeof raw.taskKey!=='string'||!raw.taskKey||raw.taskKey.length>4000||
        !stamp(raw.at,now)||['independent','corrected','helped','familiar'].indexOf(raw.outcome)<0||
        typeof raw.fresh!=='boolean'||typeof raw.helpUsed!=='boolean') {invalid();return;}
      if((raw.outcome==='independent'||raw.outcome==='corrected')&&(!raw.fresh||raw.helpUsed) ||
        raw.outcome==='helped'&&!raw.helpUsed || raw.outcome==='familiar'&&raw.fresh) {invalid();return;}
      var row={id:raw.id,skill:raw.skill,taskKey:raw.taskKey,at:raw.at,outcome:raw.outcome,fresh:raw.fresh,helpUsed:raw.helpUsed};
      if(conflicts.has(row.id))return;
      if(byId[row.id]) {
        if(JSON.stringify(byId[row.id])!==JSON.stringify(row)){delete byId[row.id];conflicts.add(row.id);invalid();}
      } else byId[row.id]=row;
    });
    var rows=Object.keys(byId).map(function(id){return byId[id];}).sort(function(a,b){return a.at-b.at || a.id.localeCompare(b.id);});
    var result={total:rows.length,independent:0,corrected:0,helped:0,familiar:0,afterPause:0,lastAt:0,resumeAt:0,needsPractice:null,due:null};
    if(object(value.resume)&&value.resume.hasWork===true&&value.resume.unfinished===true) {
      result.resumeAt=stamp(value.resume.at,now);
      if(!result.resumeAt)invalid();
    }
    var seen=new Set(),skills=Object.create(null);
    rows.forEach(function(row){
      // Changing only an attempt id never turns a known condition into a new one.
      var identity=row.skill+'\u0000'+row.taskKey;
      if(seen.has(identity) && row.outcome!=='familiar'){row.outcome='familiar';row.fresh=false;}
      seen.add(identity);
      result[row.outcome]++;
      result.lastAt=Math.max(result.lastAt,row.at);
      var skill=skills[row.skill] || (skills[row.skill]={last:null,lastOwn:null,lastHelp:0});
      if(row.helpUsed)skill.lastHelp=Math.max(skill.lastHelp,row.at);
      if(row.fresh && !row.helpUsed && (row.outcome==='independent'||row.outcome==='corrected')) {
        if(skill.lastOwn && row.at-Math.max(skill.lastOwn.at,skill.lastHelp)>=REVIEW_DELAY)result.afterPause++;
        skill.lastOwn=row;
      }
      skill.last=row;
    });
    Object.keys(skills).forEach(function(id){
      var s=skills[id],last=s.last;
      if(s.lastHelp && (!s.lastOwn||s.lastOwn.at<=s.lastHelp) && (!result.needsPractice||s.lastHelp>result.needsPractice.at)) {
        result.needsPractice={skill:id,at:s.lastHelp,reason:'helped'};
      } else if(s.lastOwn && s.lastHelp<s.lastOwn.at && now-s.lastOwn.at>=REVIEW_DELAY) {
        var due=s.lastOwn.at+REVIEW_DELAY;
        if(!result.due||due<result.due.at)result.due={skill:id,at:due};
      }
    });
    // A requested hint can matter before the learner has completed anything.
    // Recommend returning to that draft without creating a successful attempt.
    if(result.resumeAt&&value.resume.helpUsed===true) {
      if(typeof value.resume.skill==='string'&&value.resume.skill&&value.resume.skill.length<=120) {
        if(!result.needsPractice||result.resumeAt>result.needsPractice.at)result.needsPractice={skill:value.resume.skill,at:result.resumeAt,reason:'helped'};
      } else invalid();
    }
    return result;
  }
  function stateFor(entry, read, now, invalid) {
    var all = record(read(KEY)), rawData = entry.key === KEY ? all[entry.tid] : read(entry.key), data = record(rawData);
    var out = Object.assign({},entry,{activity:0,label:'Нет сохранённых результатов',started:false,status:'new',coverage:null,updatedAt:0,passed:false});
    var ids = types(entry.tid), solved = 0, touched = 0, i;
    if (entry.source === 'line') {
      var byType = record(data.solvedByType);
      ids.forEach(function (id) { var n=count(byType[id]); solved+=n; if(n)touched++; });
      out.activity=solved;
      out.coverage=coverage(touched,ids.length,'Типов с верным ответом');
      out.passed=data.passed===true;
      out.started=solved>0 || count(data.runs)>0 || count(data.best)>0 || out.passed;
      out.label=solved ? 'Верных ответов: '+solved : 'Есть сохранённая попытка';
      if (out.passed) out.label='Зачёт сдан'+(count(data.total)>0?' · '+Math.min(count(data.best),count(data.total))+' из '+count(data.total):'');
      else if(count(data.total)>0 && count(data.runs)>0)out.label+=' · зачёт: '+Math.min(count(data.best),count(data.total))+' из '+count(data.total);
      if(entry.id==='task-11') {
        var skills=record(record(data.ext).skills), skillTotal=0;
        SKILLS11.forEach(function(id){skillTotal+=count(record(skills[id]).total);});
        // OGE exercises also increment ext.skills. Summing would double-count.
        out.activity=Math.max(out.activity,skillTotal);
        if(skillTotal>0){out.started=true;if(!out.passed)out.label='Верных ответов: '+out.activity;}
      }
      var mistakes=record(all.mistakes);
      ids.forEach(function(id){var r=record(mistakes[entry.tid+'|'+id]);if(count(r.w)>0){out.started=true;out.updatedAt=Math.max(out.updatedAt,stamp(r.last,now),stamp(r.lastWrong,now));}});
      if(out.started)out.updatedAt=Math.max(out.updatedAt,stamp(data.updatedAt,now));
    } else if(entry.source==='plot') {
      solved=count(data.solved);var total=count(data.total);
      out.activity=solved;out.started=solved>0;
      out.label='Прогресс тренажёра: '+solved+(total?' из '+total:'');
      out.coverage=coverage(solved,total,'Прогресс тренажёра');
      if(out.started)out.updatedAt=Math.max(stamp(data.updatedAt,now),stamp(record(record(all.topics)[entry.tid]).lastTouch,now));
    } else if(entry.source==='inequalities') {
      var attempts=count(data.solved);out.activity=Math.min(count(data.correct),attempts);
      out.started=attempts>0;out.label='Верных проверок: '+out.activity+' из '+attempts;
      // The published series has no per-type history or timestamp.
    } else if(entry.source==='fractions' && rawData!==null && rawData!==undefined) {
      var range=typeof data.cat==='string' && Object.prototype.hasOwnProperty.call(FRACTION_RANGES,data.cat) ? FRACTION_RANGES[data.cat] : null;
      var order=data.order, expectedLength=range ? range[1]-range[0]+1 : 0;
      var validOrder=data.v===1 && range && Array.isArray(order) && order.length===expectedLength && new Set(order).size===expectedLength && order.every(function(id){return Number.isInteger(id)&&id>=range[0]&&id<=range[1];});
      if(!validOrder || !Number.isInteger(data.pos) || data.pos<0 || data.pos>expectedLength)invalid();
      else {
        var records=Object.create(null), savedRecords=data.records;
        if(savedRecords && typeof savedRecords==='object')Object.keys(savedRecords).forEach(function(id){
          var r=savedRecords[id], index=Number(id);
          if(!order.includes(index) || !r || !Number.isSafeInteger(r.wrongAttempts) || r.wrongAttempts<0 || (r.status!==null && ['solved-first','solved-retry','revealed','skipped'].indexOf(r.status)<0)){invalid();return;}
          records[id]=r;
        });
        else if(savedRecords!==undefined && savedRecords!==null)invalid();
        order.forEach(function(id){var r=record(records[id]);if(['solved-first','solved-retry'].indexOf(r.status)>=0 && r.answerWasRevealed!==true)solved++;if(['solved-first','solved-retry','revealed','skipped'].indexOf(r.status)>=0 || count(r.wrongAttempts)>0)touched++;});
        out.activity=solved;out.started=touched>0;
        out.label='Верных в текущей подборке: '+solved+' из '+order.length;
        out.coverage=coverage(solved,order.length,'Верных в текущей подборке');
      }
    } else if(entry.source==='modules' || entry.source==='word') {
      var moduleIds=entry.id==='task-22'?['m1','m2','m3']:ids;
      moduleIds.forEach(function(id){var value=entry.source==='word'?count(data[id]):count(record(data[id]).solved);solved+=value;if(value)touched++;if(entry.id==='task-22'&&count(record(data[id]).tries)>0)out.started=true;});
      out.activity=solved;out.started=out.started || solved>0;
      out.label='Верных ответов: '+solved;
      out.coverage=coverage(touched,moduleIds.length,'Тем с верным ответом');
    } else if(entry.source==='statements' && data.version===1) {
      var statementRecords=record(data.records), canonicalRecords=Object.create(null), answers=0;
      Object.keys(statementRecords).forEach(function(id){
        if(Object.prototype.hasOwnProperty.call(STATEMENTS19,id)&&object(statementRecords[id]))canonicalRecords[STATEMENTS19[id]]=statementRecords[id];
      });
      Object.keys(canonicalRecords).forEach(function(id){
        var r=canonicalRecords[id], n=count(r.attempts);answers+=n;solved+=Math.min(n,count(r.correct));
      });
      out.activity=solved;out.started=answers>0;
      out.label='Верных ответов: '+solved+' из '+answers;
    }
    // Error practice remains distinct from evidence of independent learning.
    out.openMistakes=0;out.lastMistakeAt=0;
    var errors=record(all.mistakes);
    ids.forEach(function(id){var r=record(errors[entry.tid+'|'+id]);if(count(r.w)>0&&count(r.r)<3){out.openMistakes++;out.lastMistakeAt=Math.max(out.lastMistakeAt,stamp(r.lastWrong,now));}});
    out.evidence=EVIDENCE_TASKS.indexOf(entry.id)>=0 ? learningEvidence(record(record(all[entry.tid]).ext).auditLearning,now,invalid) : null;
    out.hasDraft=!!(out.evidence&&out.evidence.resumeAt);
    if(out.evidence&&(out.evidence.total||out.hasDraft)) {
      out.started=true;out.updatedAt=Math.max(out.updatedAt,out.evidence.lastAt,out.evidence.resumeAt);
      if(!out.activity&&!out.passed)out.label='Есть сохранённая учебная работа';
      if(out.hasDraft)out.label+=' · можно продолжить задачу';
    }
    out.status=out.passed?'check':out.started?'practice':'new';
    if(!out.started)out.label='Нет сохранённых результатов';
    return out;
  }
  function snapshot(storage, now) {
    now=Number.isFinite(now)?now:Date.now();
    var cache=Object.create(null), available=true, invalidData=false;
    function read(key) {
      if(Object.prototype.hasOwnProperty.call(cache,key))return cache[key];
      var raw;
      try { raw=storage.getItem(key); } catch (_) { available=false;return cache[key]=null; }
      if(raw===null)return cache[key]=null;
      try { var value=JSON.parse(raw);if(!object(value)){invalidData=true;return cache[key]=null;}return cache[key]=value; }
      catch(_){invalidData=true;return cache[key]=null;}
    }
    var flat=[], result=tracks.map(function(track){
      var steps=track.steps.map(function(entry){var s=stateFor(entry,read,now,function(){invalidData=true;});s.trackId=track.id;flat.push(s);return s;});
      var begun=steps.filter(function(s){return s.started;}).length;
      return Object.assign({},track,{steps:steps,started:begun,total:steps.length,coverage:{value:begun,total:steps.length,label:'Тем с сохранёнными результатами'}});
    });
    return {tracks:result,steps:flat,totals:{started:flat.filter(function(s){return s.started;}).length,total:flat.length},storageAvailable:available,invalidData:invalidData,at:now};
  }
  function recommend(view, cursor) {
    var steps=view && Array.isArray(view.steps)?view.steps:[], allowed=Object.create(null);
    tracks.forEach(function(t){t.steps.forEach(function(s){allowed[s.id]=s;});});
    var valid=steps.filter(function(s){return s&&allowed[s.id]&&s.href===allowed[s.id].href;});
    if(!valid.length)return null;
    var now=view.at || Date.now(), selected=object(cursor)?valid.find(function(s){return s.id===cursor.stepId;}):null;
    var selectedAt=selected?stamp(cursor.at,now):0;
    var latest=null;
    valid.forEach(function(s){if(s.started && stamp(s.updatedAt,now) && (!latest||s.updatedAt>latest.updatedAt))latest=s;});
    if(selected && selectedAt && (!latest||selectedAt>=latest.updatedAt))return {step:selected,reason:'selected'};
    if(latest)return {step:latest,reason:'latest'};
    return {step:valid[0],reason:'start'};
  }
  function recommendPractice(view) {
    var allowed=Object.create(null),candidates=[];
    tracks.forEach(function(t){t.steps.forEach(function(s){allowed[s.id]=s.href;});});
    (view&&Array.isArray(view.steps)?view.steps:[]).forEach(function(step){
      if(!step||allowed[step.id]!==step.href)return;
      var evidence=step.evidence;
      if(evidence&&evidence.needsPractice)candidates.push({step:step,reason:'helped',priority:0,at:evidence.needsPractice.at});
      else if(step.openMistakes)candidates.push({step:step,reason:'mistakes',priority:1,at:step.lastMistakeAt});
      else if(evidence&&evidence.due)candidates.push({step:step,reason:'after-pause',priority:2,at:evidence.due.at});
    });
    candidates.sort(function(a,b){return a.priority-b.priority || (a.reason==='after-pause'?a.at-b.at:b.at-a.at) || a.step.id.localeCompare(b.step.id);});
    return candidates[0]||null;
  }
  return {KEY:KEY,tracks:tracks,snapshot:snapshot,recommend:recommend,recommendPractice:recommendPractice,REVIEW_DELAY:REVIEW_DELAY};
});
