'use strict';

// Finite source coverage is a reviewed mapping, not a keyword classifier and
// not a claim to have downloaded the complete official FIPI live bank.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
const data=require('../trainers/task19-visual-data.js');
const audit=require('../trainers/task19-exam-source-coverage.json');
const major=require('../trainers/task19-major-source-coverage.json');
const registry=require('../trainers/task19-source-coverage.json');
const V=require('../trainers/task19-visual-models.js');
const byId=new Map(data.cards.map(card=>[card.id,card]));
const hash=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const expected={
  '978344-2':['isosceles_trapezoid_diagonal_equal_triangles',false],
  '269D1C-3':['triangle_exterior_gt_nonadjacent',true],
  'C7D0DF-3':['triangle_exterior_sum_all_angles',false],
  'A9D5C9-1':['equilateral_triangle_is_isosceles',true],
  'E4BA92-2':['rectangle_always_has_incircle',false],
  'FA4567-1':['right_triangles_always_similar',false],
  'EB6B6A-2':['equilateral_triangle_is_acute',true],
  'F34539-1':['right_trapezoid_diagonals_equal',false],
  'B51738-1':['parallelogram_equal_perpendicular_diagonals_square',true],
  'E3F78B-1':['parallelogram_equal_diagonals_square',false]
};

test('the historical ten-formulation extension remains unchanged before the separate 135-card expansion',()=>{
  assert.equal(data.cards.length,379);
  assert.equal(new Set(data.cards.map(c=>c.id)).size,379);
  assert.equal(hash(data.cards.slice(0,234)),audit.baseline.cardsSha256,'all fields of all old cards remain identical');
  assert.equal(audit.baseline.cardsSha256,'32406aa0519b294b07736c66df2842dc3f6731564faee4cc2ca7ca6e78cb01eb');
  assert.deepEqual(data.cards.slice(234,244).map(c=>c.id),Object.values(expected).map(([id])=>id));
  assert.deepEqual(audit.additions,data.cards.slice(234,244).map(c=>c.id));
  const oldAliases=Object.fromEntries(Object.entries(data.aliases).filter(([key])=>!audit.additions.includes(key)&&!major.additions.includes(key)));
  assert.equal(hash(oldAliases),'880649d016e7f905c255e94d13d8b111909867ba37b5c97f6177084924788d27');
  for(const id of audit.additions)assert.deepEqual(byId.get(id).aliases,[id]);
  for(const [source,[id,truth]] of Object.entries(expected)){
    const [taskId,part]=source.split('-'),row=audit.assertions.find(r=>r.id===`mirror-${taskId}-19-${part}`);
    assert(row,source);assert.deepEqual(row.cardIds,[id],source+': reviewed direct assertion');
    assert.equal(row.truth,truth);assert.equal(byId.get(id).truth,truth);
  }
});

test('all 669 read occurrences and all 117 mirror types have explicit truth-preserving mappings',()=>{
  assert.equal(audit.assertions.length,669);assert.equal(new Set(audit.assertions.map(r=>r.id)).size,669);
  const counts={},sources=new Set(audit.sources.map(s=>s.id));
  for(const row of audit.assertions){
    assert(sources.has(row.sourceId),row.id+': source identified');
    assert(row.url.startsWith('https://')&&row.conditionReview.trim(),row.id+': exact location and review');
    assert(['exact-normalized','semantic-equivalent'].includes(row.matchType),row.id+': no mere topic or stronger-statement inclusion');
    assert(row.cardIds.length,row.id+': direct coverage');
    for(const id of row.cardIds){const c=byId.get(id);assert(c,row.id+': canonical ID '+id);assert.equal(c.truth,row.truth,row.id+': verdict');}
    counts[row.group]=(counts[row.group]||0)+1;
  }
  assert.deepEqual(counts,{'official-pdfs':39,'yashchenko-2026-36':108,'statgrad-6-works':72,'mirror-150':450});
  assert.deepEqual(audit.counts.groups,counts);
  assert.equal(audit.counts.coveredObservations,669);assert.equal(audit.counts.missingObservations,0);
  for(const [id,digest] of Object.entries(audit.cardSemanticsSha256)){
    const c=byId.get(id);assert(c,id);assert.equal(hash({text:c.text,truth:c.truth}),digest,id+': reviewed wording/quantifiers have not drifted');
  }
  const mirror=audit.assertions.filter(r=>r.group==='mirror-150'),byEvidence=new Map(mirror.map(r=>[r.id,r]));
  const taskIds=[...new Set(mirror.map(r=>r.taskId))];assert.equal(taskIds.length,150);
  for(const id of taskIds)assert.deepEqual(mirror.filter(r=>r.taskId===id).map(r=>r.part).sort(),[1,2,3],id+': all three assertions');
  assert.equal(audit.semanticTypes.length,117);assert.equal(new Set(audit.semanticTypes.map(t=>t.id)).size,117);
  const occurrences=[],forms=[];
  for(const type of audit.semanticTypes){
    assert(type.cardIds.length&&type.occurrenceIds.length,type.id);
    for(const id of type.cardIds)assert.equal(byId.get(id)?.truth,type.truth,type.id+': reviewed canonical verdict');
    for(const id of type.occurrenceIds){const r=byEvidence.get(id);assert(r,type.id+': occurrence exists');assert.equal(r.semanticTypeId,type.id);assert.equal(r.truth,type.truth);assert(r.cardIds.some(c=>type.cardIds.includes(c)),id+': same reviewed meaning');}
    occurrences.push(...type.occurrenceIds);forms.push(...type.formIds);
  }
  assert.equal(occurrences.length,450);assert.equal(new Set(occurrences).size,450);
  assert.equal(forms.length,122);assert.equal(new Set(forms).size,122);
  assert.equal(audit.counts.coveredMirrorSemanticTypes,117);
});

test('secondary cross-checks stay separate from unverified live-bank coverage',()=>{
  assert.equal(audit.officialBank.complete,false);assert.equal(audit.officialBank.questionBodiesRead,0);
  assert.equal(audit.officialBank.totalCurrentQuestions,null);assert.equal(registry.officialBank.complete,false);
  assert.match(audit.officialBank.status,/secondary reproduction.*not verification/);
  assert.equal(audit.crossChecks.length,41);assert.equal(new Set(audit.crossChecks.map(r=>r.taskId)).size,41);
  for(const row of audit.crossChecks){assert.equal(row.allThreeAssertionsMatch,true);assert.equal(new URL(row.url).hostname,'sdamgia.online');assert.equal(new URL(row.corroboratingUrl).hostname,'gia.guide');assert.match(row.sha256,/^[a-f0-9]{64}$/);}
  const crossChecked=new Set(audit.crossChecks.map(r=>r.taskId));
  assert.equal(registry.officialBank.recommendedIds.length,34);
  for(const id of registry.officialBank.recommendedIds)assert(crossChecked.has(id),id+': navigator ID cross-checked externally');
  for(const key of Object.keys(expected))assert(crossChecked.has(key.split('-')[0]),key+': new formulation cross-checked');
  for(const row of audit.assertions.filter(r=>r.group==='mirror-150'))assert.equal(row.officialBankBodyVerified,false);
  const additions=registry.sources.find(s=>s.id==='audited-mirror-additions-20261116');
  assert.equal(additions.type,'third-party-bank-reproduction-not-official-live-bank');assert.equal(additions.entries.length,10);
  for(const e of additions.entries){assert.equal(e.text,byId.get(e.cardId).text);assert.equal(e.officialBankBodyVerified,false);}
  // The commercial source bank is not reproduced in this mapping.
  for(const r of audit.assertions.filter(r=>['yashchenko-2026-36','statgrad-6-works'].includes(r.group)))assert(!Object.hasOwn(r,'text')&&!Object.hasOwn(r,'sourceText'));
});

const sub=(a,b)=>[a[0]-b[0],a[1]-b[1]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1],cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
const length=(a,b)=>Math.hypot(...sub(a,b));
const near=(a,b,label)=>assert(Math.abs(a-b)<1e-7,label+`: ${a} != ${b}`);
const angle=(a,o,b)=>Math.atan2(Math.abs(cross(sub(a,o),sub(b,o))),dot(sub(a,o),sub(b,o)))*180/Math.PI;
const area=(a,b,c)=>Math.abs(cross(sub(b,a),sub(c,a)))/2;
const lineDistance=(p,a,b)=>Math.abs(cross(sub(p,a),sub(b,a)))/length(a,b);
const parallel=(a,b,c,d)=>near(cross(sub(b,a),sub(d,c)),0,'parallel sides');
function samples(id){
  const h=byId.get(id).hint,controls=V.controlsFor(h.model,h.params),params=[h.params];
  for(const c of controls)for(const value of [c.min,(c.min+c.max)/2,c.max])params.push({...h.params,[c.key]:value});
  params.push(...controls.reduce((all,c)=>all.flatMap(p=>[{...p,[c.key]:c.min},{...p,[c.key]:c.max}]),[h.params]));
  return params.map(p=>V.sample(h.model,p));
}
function rectangle(P){parallel(P.A,P.B,P.D,P.C);parallel(P.A,P.D,P.B,P.C);near(angle(P.B,P.A,P.D),90,'right angle');}

test('trapezoid counterexamples retain the exact narrower class at every control boundary',()=>{
  const iso='isosceles_trapezoid_diagonal_equal_triangles';
  for(const {points:P} of samples(iso)){
    parallel(P.A,P.B,P.D,P.C);near(length(P.A,P.D),length(P.B,P.C),'equal legs');
    assert(area(P.A,P.B,P.C)>area(P.A,P.C,P.D),'parts have different areas, so cannot be equal triangles');
  }
  const P=samples(iso)[0].points;near(area(P.A,P.B,P.C),9,'first counterexample area');near(area(P.A,P.C,P.D),3,'second counterexample area');
  const right='right_trapezoid_diagonals_equal';assert.deepEqual(V.controlsFor(byId.get(right).hint.model,byId.get(right).hint.params).map(c=>c.key),['height']);
  for(const {points:P} of samples(right)){
    parallel(P.A,P.B,P.D,P.C);near(angle(P.B,P.A,P.D),90,'right angle at A');near(angle(P.A,P.D,P.C),90,'right angle at D');
    assert(Math.abs(length(P.A,P.C)-length(P.B,P.D))>1,'unequal diagonals in right trapezoid');
  }
});

test('external-angle prompts distinguish each remote angle from the sum of all three',()=>{
  for(const id of ['triangle_exterior_gt_nonadjacent','triangle_exterior_sum_all_angles'])for(const {points:P} of samples(id)){
    const a=angle(P.B,P.A,P.C),b=angle(P.A,P.B,P.C),c=angle(P.A,P.C,P.B),exterior=180-b;
    near(a+b+c,180,'interior sum');near(exterior,a+c,'two remote angles');
    assert(exterior>a&&exterior>c,'greater than each remote angle');assert(exterior<180,'not the sum of all three');
  }
  const s=samples('triangle_exterior_sum_all_angles')[0];near(180-angle(s.points.A,s.points.B,s.points.C),120,'explicit false-case angle');
});

test('equilateral inclusion and right-triangle dissimilarity keep their quantifiers',()=>{
  for(const id of ['equilateral_triangle_is_isosceles','equilateral_triangle_is_acute'])for(const {points:P} of samples(id)){
    near(length(P.A,P.B),length(P.A,P.C),'two equal sides');near(length(P.A,P.B),length(P.B,P.C),'third equal side');
    for(const [a,b,c] of [[P.A,P.B,P.C],[P.B,P.C,P.A],[P.C,P.A,P.B]])near(angle(a,b,c),60,'all angles are acute');
  }
  const h=byId.get('right_triangles_always_similar').hint;
  const states=[45,30].map(b=>V.sample(h.model,{...h.params,b}).points);
  for(const P of states)near(angle(P.B,P.A,P.C),90,'both are right triangles');
  const acute=states.map(P=>[angle(P.A,P.B,P.C),angle(P.A,P.C,P.B)].sort((a,b)=>a-b));
  near(acute[0][0],45,'first acute angle');near(acute[1][0],30,'second triangle acute angle');
  assert(Math.abs(acute[0][0]-acute[1][0])>10,'actual non-similar pair, not a model locked to similarity');
});

test('incircle experiment measures distances to sides, not distances to vertices',()=>{
  const id='rectangle_always_has_incircle',h=byId.get(id).hint;assert.equal(h.params.mode,'incircle');
  for(const {points:P,metrics:M} of samples(id)){
    rectangle(P);const distances=[[P.A,P.B],[P.B,P.C],[P.C,P.D],[P.D,P.A]].map(([a,b])=>lineDistance(P.O,a,b));
    near(M.radius,Math.min(...distances),'circle fits inside');
    if(Math.abs(length(P.A,P.B)-length(P.A,P.D))>1e-7)assert(Math.max(...distances)>M.radius+1e-7,'at least one pair is not tangent');
  }
  const first=samples(id)[0];near(first.metrics.OE,1.5,'half height');near(first.metrics.OF,3,'half width');
  const square=V.sample(h.model,{...h.params,width:3,height:3});for(const key of ['OE','OF','OG','OH'])near(square.metrics[key],square.metrics.radius,'special case does allow tangency');
});

test('equal diagonals alone and equal perpendicular diagonals remain different criteria',()=>{
  const trueId='parallelogram_equal_perpendicular_diagonals_square',falseId='parallelogram_equal_diagonals_square';
  for(const {points:P} of samples(trueId)){
    rectangle(P);near(length(P.A,P.C),length(P.B,P.D),'equal diagonals');near(dot(sub(P.C,P.A),sub(P.D,P.B)),0,'perpendicular diagonals');
    near(length(P.A,P.B),length(P.A,P.D),'equal adjacent sides');
  }
  for(const {points:P} of samples(falseId)){rectangle(P);near(length(P.A,P.C),length(P.B,P.D),'equal diagonals preserved');}
  const P=samples(falseId)[0].points;assert.notEqual(length(P.A,P.B),length(P.A,P.D),'explicit non-square rectangle');
  const h=byId.get(trueId).hint;assert.equal(h.model,'squareMeasure');assert.equal(h.params.focus,'diagonals');
  assert.deepEqual(data.cards.filter(c=>c.hint.params.neutralSideControl).map(c=>c.id),[trueId]);
  const controls=V.controlsFor(h.model,h.params);assert.equal(controls.length,1);assert.equal(controls[0].key,'side');assert.doesNotMatch(controls[0].label,/квадрат/iu);
  for(const card of data.cards.slice(0,234).filter(c=>c.hint.model==='squareMeasure'))assert.equal(V.controlsFor(card.hint.model,card.hint.params)[0].label,'Измени сторону квадрата','old label unchanged');
  for(const s of samples(trueId)){
    const drawing=V.render(h.model,s.values);assert.doesNotMatch(drawing.svg+JSON.stringify(drawing.readout),/квадрат/iu,'model does not name the conclusion');
    assert.match(drawing.svg,/data-geometry-group="AC"/);assert.match(drawing.svg,/data-geometry-group="BD"/);assert.match(drawing.svg,/data-geometry-group="diagonal-angle"/);
  }
});

const KEY='mathExam.task19.visualHints.v1';
const modules=['task19-board-session','task19-visual-data','task19-models-triangles','task19-models-circles','task19-models-lines-polygons','task19-visual-models','task19-reference','task19-textbook-data','task19-textbook-reference','task19-visual-app'];
function boot(file,id,records){
  const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
  const w=new JSDOM(read(file),{url:'https://example.test/'+file+'?card='+id,runScripts:'outside-only',virtualConsole:vc}).window;
  w.localStorage.setItem(KEY,JSON.stringify({version:1,topic:'',review:false,records,current:null}));
  for(const name of modules){
    const embedded=w.document.querySelector(`script[data-inline-source="/trainers/${name}.js"]`);
    if(file.startsWith('downloads/'))assert(embedded,name+': standalone dependency embedded');
    w.eval(embedded?embedded.textContent:read('trainers/'+name+'.js'));
  }
  return {w,errors,$:selector=>w.document.querySelector(selector),saved:()=>JSON.parse(w.localStorage.getItem(KEY))};
}

test('public entries and rebuilt standalone render every addition without losing any old progress',()=>{
  const records=Object.fromEntries(data.cards.slice(0,234).map((c,i)=>[c.id,{attempts:i%3+1,correct:i%3,needsReview:i%2===0}]));
  for(const file of ['trainers/task19-trainer.html','trainers/geometry_statements_trainer_improved.html','downloads/trainers/task19-trainer/task19-trainer.html'])for(const id of audit.additions){
    const e=boot(file,id,records);try{
      const card=byId.get(id);assert.equal(e.w.Task19Data.cards.length,379);assert.equal(e.$('#statement').textContent,card.text);
      assert.deepEqual(e.saved().records,records,'all old progress survives bank extension');assert(e.$('#hintPanel').hidden);assert(e.$('#answerPanel').hidden);
      e.$('#hintToggle').click();const input=e.$('#visualHost input[type="range"]');assert(input,id+': meaningful control');
      input.value=input.max;input.dispatchEvent(new e.w.Event('input',{bubbles:true}));e.$('.t19-measure').click();
      assert(!e.$('.t19-model-readout').hidden);assert(e.$('#answerPanel').hidden);assert.equal(e.saved().current.answer,null);assert.deepEqual(e.saved().records,records);
      assert(e.$('#textbookHost').querySelectorAll('a').length>=2,id+': existing textbook passages');
      e.$(card.truth?'#btnTrue':'#btnFalse').click();assert(!e.$('#answerPanel').hidden);assert.equal(e.saved().records[id].correct,1);
      const savedOld=Object.fromEntries(Object.entries(e.saved().records).filter(([key])=>key!==id));assert.deepEqual(savedOld,records);
      assert.deepEqual(e.errors,[],file+' '+id);
    }finally{e.w.close();}
  }
});
