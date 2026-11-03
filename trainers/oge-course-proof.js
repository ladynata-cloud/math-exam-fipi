/* Additive proof workspace: sources and drafts never grade an answer. */
(function(root){
'use strict';
const d=root.document,R=root.OgeCourseReference;
if(!d||!R||new URLSearchParams(root.location.search).get('selftest')==='1')return;
const taskNo=+(root.location.pathname.match(/oge-task(23|24|25)-/)||[])[1];if(!taskNo)return;
const q=(s,r=d)=>r.querySelector(s),qa=(s,r=d)=>Array.from(r.querySelectorAll(s));
const e=(tag,text,cls)=>{const n=d.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
const text=html=>{const n=e('div');n.innerHTML=html||'';return n.textContent;};
const topic23={rhombH:['rhombus','pythagoras'],pgramBis:['angle_bisector','parallel_angles','isosceles','parallelogram'],trapBis:['parallel_angles','angle_bisector','triangle_angles','pythagoras'],trapLeg:['trapezoid','trigonometry'],rhombAng:['rhombus','trigonometry'],trapEF:['trapezoid','triangle_similarity'],circR:['triangle_angles','inscribed_angles','sine_law'],hAB:['triangle_area','trigonometry'],hAC:['triangle_area','trigonometry'],projAB:['right_triangle','pythagoras'],paraBN:['parallel_angles','triangle_similarity'],paraMC:['parallel_angles','triangle_similarity'],chordDist:['equal_chords','pythagoras'],chordLen:['equal_chords','pythagoras'],secKP1:['triangle_similarity','inscribed_angles'],secKP2:['triangle_similarity','inscribed_angles'],rectPK:['rectangle','triangle_similarity'],rectBH:['rectangle','triangle_similarity'],tanSecAC:['tangent','triangle_similarity'],tanSecD:['tangent','triangle_similarity']};
const topic24={t1:['trapezoid','parallel_angles','triangle_similarity'],t10:['circumcircle','adjacent_vertical','triangle_similarity'],t13:['triangle_angles','right_triangle','triangle_similarity'],t15:['tangent','adjacent_vertical','triangle_similarity'],t2:['parallelogram','adjacent_vertical','triangle_congruence'],t3:['isosceles','angle_bisector','parallel_angles'],t4:['isosceles','angle_bisector','parallel_angles'],t5:['angle_bisector_locus','triangle_angles'],t7:['parallelogram','triangle_area'],t6:['trapezoid_midline','triangle_area'],t8:['triangle_area','triangle_midline'],t9:['triangle_area','triangle_similarity','parallel_angles'],t12:['inscribed_angles','circumcircle'],t11:['inscribed_angles','circumcircle'],t14:['circle_definition','perpendicular_bisector'],t16:['regular_polygon','inscribed_angles','triangle_congruence'],t17:['regular_polygon','circle_definition','isosceles'],t18:['regular_polygon','inscribed_angles','rectangle'],t19:['regular_polygon','inscribed_angles','right_triangle'],t20:['regular_polygon','inscribed_angles','isosceles']};
const topic25={1:['triangle_parts','angle_bisector','median_length','bisector_length'],2:['parallelogram','angle_bisector','parallel_angles','triangle_area'],3:['trapezoid','angle_bisector','triangle_similarity'],4:['trapezoid','triangle_midline','pythagoras'],5:['circle_definition','inscribed_angles','sine_law','trig_reduction'],6:['isosceles_trapezoid','incircle','tangent','triangle_similarity'],7:['tangent','inscribed_angles','triangle_similarity'],8:['circumcircle','tangent','inscribed_angles','triangle_similarity'],9:['triangle_parts','inscribed_angles','triangle_similarity'],10:['tangent','pythagoras','triangle_similarity'],11:['circumcircle','inscribed_angles','sine_law','trig_sum_identity'],12:['tangent','triangle_similarity','trigonometry','trig_sum_identity'],13:['angle_bisector_locus','trigonometry','trig_reduction','sine_law'],14:['trapezoid','tangent','triangle_similarity'],15:['incircle','angle_bisector_locus','triangle_area','parallelogram_area'],16:['incircle_area','isosceles','heron_formula']};
// Explicit mappings follow the actual mathematical dependency of each native proof step.
// Given facts and arithmetic retain the definition/formula from which they follow.
const proofStepTopics={
 t1:[['trapezoid'],['parallel_angles'],['triangle_similarity'],['triangle_similarity']],
 t10:[['points_lines'],['circumcircle'],['adjacent_vertical','circumcircle'],['points_lines'],['triangle_similarity']],
 t13:[['triangle_parts'],['triangle_parts','triangle_types'],['adjacent_vertical'],['triangle_parts','adjacent_vertical'],['triangle_similarity'],['triangle_similarity'],['triangle_similarity','adjacent_vertical']],
 t15:[['tangent'],['tangent','adjacent_vertical','triangle_similarity'],['triangle_similarity'],['circle_definition']],
 t2:[['parallelogram'],['parallel_angles'],['adjacent_vertical'],['triangle_congruence_asa'],['equal_figures','triangle_congruence_asa']],
 t3:[['angle_bisector'],['parallel_angles'],['isosceles'],['angle_bisector','parallel_angles','isosceles'],['parallelogram']],
 t4:[['segment_lengths'],['isosceles'],['parallel_angles'],['angle_bisector']],
 t5:[['angle_bisector_locus'],['angle_bisector_locus'],['angle_bisector_locus']],
 t7:[['parallelogram'],['perpendicular','triangle_parts'],['triangle_area'],['triangle_area','parallelogram_area']],
 t6:[['trapezoid_midline','triangle_midline'],['trapezoid_midline','triangle_midline'],['triangle_area'],['triangle_area','trapezoid_area']],
 t8:[['equal_area','triangle_area'],['triangle_midline'],['triangle_midline','triangle_area'],['trapezoid_area','triangle_area'],['equal_area']],
 t9:[['perpendicular','triangle_area'],['triangle_area'],['equal_area'],['equal_area']],
 t12:[['triangle_parts'],['diameter_locus'],['inscribed_angles']],
 t11:[['inscribed_angles'],['inscribed_angle_converse'],['inscribed_angles']],
 t14:[['circle_definition'],['circle_definition'],['perpendicular_bisector'],['points_lines','perpendicular_bisector']],
 t16:[['regular_polygon','polygon_angles'],['triangle_congruence'],['equal_figures'],['regular_polygon']],
 t17:[['regular_polygon','circle_definition'],['regular_polygon'],['isosceles','triangle_angles'],['circle_definition'],['isosceles']],
 t18:[['regular_polygon','circle_definition'],['circle_definition'],['parallelogram_tests'],['parallelogram_tests','rectangle']],
 t19:[['regular_polygon','circle_definition'],['regular_polygon'],['inscribed_angles'],['right_triangle']],
 t20:[['regular_polygon','isosceles'],['isosceles','triangle_angles'],['polygon_angles','regular_polygon'],['angle_measure','perpendicular']]
};
const calculationStepTopics={
 1:[['angle_bisector','triangle_parts'],['triangle_congruence_asa','isosceles'],['median_length'],['bisector_length'],['median_length','bisector_length'],['median_length','bisector_length']],
 2:[['parallel_angles','angle_bisector','triangle_angles'],['angle_bisector_locus'],['segment_lengths','perpendicular','parallelogram'],['parallelogram_area']],
 3:[['angle_bisector','trapezoid'],['parallel_angles','angle_bisector','isosceles'],['triangle_congruence_asa'],['segment_lengths'],['pythagoras'],['trapezoid_area']],
 4:[['trapezoid_midline'],['median_hypotenuse','parallel_angles'],['trapezoid_midline','median_hypotenuse'],['trapezoid_midline']],
 5:[['circle_definition','circumcircle'],['inscribed_angles'],['circumcircle','triangle_angles'],['sine_law','trig_reduction'],['sine_law','trig_reduction']],
 6:[['incircle','tangent','isosceles_trapezoid'],['trapezoid_area','tangent'],['isosceles_trapezoid','pythagoras'],['triangle_similarity']],
 7:[['perpendicular','trapezoid'],['tangent','inscribed_angles','triangle_similarity'],['triangle_similarity']],
 8:[['tangent','parallel_third'],['tangent','inscribed_angles','triangle_similarity'],['triangle_similarity'],['segment_lengths']],
 9:[['inscribed_angles','triangle_similarity'],['triangle_parts','triangle_similarity'],['triangle_similarity'],['segment_lengths']],
 10:[['tangent','circle_definition'],['tangent','triangle_similarity','trigonometry'],['triangle_similarity']],
 11:[['inscribed_angles','triangle_exterior'],['sine_law'],['trig_sum_identity','trig_reduction','sine_law'],['sine_law']],
 12:[['tangent','triangle_similarity'],['tangent','trigonometry'],['equal_chords','trigonometry'],['trig_sum_identity'],['trig_sum_identity'],['trig_reduction']],
 13:[['angle_bisector_locus','triangle_parts'],['angle_bisector_locus','trigonometry'],['trig_reduction'],['sine_law']],
 14:[['triangle_angles'],['triangle_similarity','parallel_angles'],['perpendicular_bisector','tangent'],['triangle_similarity'],['triangle_similarity']],
 15:[['incircle','angle_bisector','trigonometry'],['parallel_angles','trigonometry'],['triangle_angles'],['incircle_area','trigonometry','parallelogram']],
 16:[['isosceles'],['incircle_area'],['heron_formula','incircle_area'],['incircle_area']]
};
const extraReasons25={
 '1:1':'Опусти биссектрису-высоту BP на AD. Прямоугольные треугольники ABP и DBP имеют общую сторону BP и равные углы при B; по второму признаку они равны. Поэтому AB = BD. Затем используй определение медианы AD.',
 '1:4':'Это алгебраический шаг: приравняй выражения для AD² и BE², умножь обе части на 18 и собери подобные слагаемые. После подстановки найди c²; выбирай положительный корень, потому что c — длина.',
 '1:5':'Подставь найденную положительную длину c в уже доказанные равенства BC = 2c и 13b² = 45c². Для b также выбирай положительный корень.',
 '2:2':'Через K проведи перпендикуляр к AD. Он перпендикулярен и параллельной прямой BC. Точка K лежит между основаниями, поэтому два расстояния складываются в один отрезок высоты.',
 '3:3':'Точка B лежит между C и N, поэтому CN = CB + BN. Подставь доказанные равенства CN = CD и BN = AD, затем вычти CB из обеих частей.',
 '4:2':'Так как b — положительная длина, (a + b)/2 больше (a − b)/2. Поэтому большему данному отрезку соответствует средняя линия.',
 '4:3':'Сложи уравнения (a + b)/2 = m и (a − b)/2 = n: получишь a = m + n. Вычти второе из первого: получишь b = m − n.',
 '5:4':'Раздели обе части BC = AD·|cos(B + C)| на положительный множитель |cos(B + C)|. Модуль сохраняет положительную длину; знаменатель здесь не равен нулю.',
 '6:2':'В равнобедренной трапеции проекция каждой боковой стороны на большое основание равна половине разности оснований. Примени теорему Пифагора к треугольнику из высоты, этой проекции и боковой стороны. Затем сложи и вычти равенства для a + b и a − b.',
 '7:2':'Из уже доказанного EK² = BC·AD извлеки квадратный корень. Длина EK положительна, поэтому отрицательный корень не подходит.',
 '8:3':'Точка D лежит на отрезке AC, поэтому AC = AD + DC. Вычти найденный AD из AC.',
 '9:2':'Правые части DH·AD = BD·DC и MD² = BD·DC равны, поэтому DH·AD = MD². Раздели обе части на положительную длину AD.',
 '9:3':'H лежит на отрезке AD: AD = AH + HD. Поэтому искомая длина AH равна AD − HD.',
 '10:2':'Это разность квадратов: (r₁ + r₂)² − (r₁ − r₂)² = 4r₁r₂. Подставь d = r₁ + r₂ и раздели на положительное d.',
 '11:2':'Положи x = sin α, y = sin γ. Из косинуса суммы получаем cos α·cos γ = 1/2 + xy. Возведи в квадрат: (1 − x²)(1 − y²) = 1/4 + xy + x²y². Сократи x²y²: x² + y² + xy = 3/4. Теперь подставь x = AB/(2R), y = CD/(2R) и умножь на 4R².',
 '11:3':'Раздели доказанное равенство AB² + CD² + AB·CD = 3R² на 3. Радиус положителен, поэтому возьми положительный квадратный корень.',
 '12:4':'Вычти AT·cos A из равенства AT·cos A + R·sin A = (AM + AN)/2. Затем раздели на sin A. Угол A в данной задаче острый, поэтому sin A > 0.',
 '12:5':'Для острого угла sin A = √(1 − cos² A), знак корня положительный. Подставь значения в полученную формулу радиуса и умножь числитель и знаменатель на общий знаменатель дробей.',
 '14:4':'Подставь известные длины в доказанную формулу. Здесь AD > BC, поэтому знаменатель 2(AD − BC) положителен и не равен нулю.',
 '15:3':'Соедини инцентр с точками касания. В каждом прямоугольном треугольнике касательный отрезок равен r·ctg половины угла; сумма трёх таких отрезков — полупериметр. Из S△ = r·s получаем указанную формулу. Диагональ делит параллелограмм на два равных треугольника.',
 '16:3':'Из r·r_B = (AC/2)² вырази r: раздели обе части на положительный радиус r_B. Подставь основание AC из условия.'
};
const justification={aa:'triangle_similarity',sas_sim:'triangle_similarity',sas_eq:'triangle_congruence',asa:'triangle_congruence_asa',alt:'parallel_angles',vert:'adjacent_vertical',cyclic:'circumcircle',insc:'inscribed_angles',insc_conv:'inscribed_angle_converse',diam:'inscribed_angles',diamlocus:'diameter_locus',diagpar:'parallelogram',rectdiag:'rectangle',isoc:'isosceles',isoc_ang:'isosceles',bisec:'angle_bisector_locus',perpbis:'perpendicular_bisector',tang:'tangent',area:'triangle_area',sameB:'triangle_area',hexang:'regular_polygon',central:'inscribed_angles'};
const rules=[[/теорем.*синус|2R.*sin|хорда.*синус/i,'sine_law'],[/косинус.*сумм|косинус.*разност|cos\(.*[+−-]/i,'trig_sum_identity'],[/расстоян.*биссектрис|биссектрис.*расстоян|равноудал[её]н.*сторон/i,'angle_bisector_locus'],[/высот.*перпендик|перпендик.*высот/i,'triangle_parts'],[/сторон[а-я]* и двум прилежащим|второму признаку равенства/i,'triangle_congruence_asa'],[/Пифагор|гипотенуз|катет/i,'pythagoras'],[/подоби|пропорциональн/i,'triangle_similarity'],[/равенств.*треугольник|треугольник.*равн.*по|признак.*равенств/i,'triangle_congruence'],[/биссектрис/i,'angle_bisector'],[/накрест|односторонн|соответственн.*угл/i,'parallel_angles'],[/вертикальн.*угл|смежн/i,'adjacent_vertical'],[/равнобедрен/i,'isosceles'],[/касательн|точк.*касани/i,'tangent'],[/вписанн.*угол|угол.*диаметр|дуг/i,'inscribed_angles'],[/вписанн.*четыр[её]хугольник/i,'circumcircle'],[/серединн.*перпендикуляр/i,'perpendicular_bisector'],[/средн.*лини.*треугольник/i,'triangle_midline'],[/средн.*лини.*трапец/i,'trapezoid_midline'],[/площад/i,'triangle_area'],[/sin|cos|tg|синус|косинус/i,'trigonometry'],[/правильн.*шестиугольник|центральн.*60/i,'regular_polygon'],[/ромб/i,'rhombus'],[/параллелограмм/i,'parallelogram'],[/прямоугольник/i,'rectangle']];
function topicsForStep(step,fallback=[]){if(step.theoryTopics)return step.theoryTopics;const s=text([step.t,step.h,step.q,step.why,step.ok].filter(Boolean).join(' ')),ids=[];if(justification[step.jc])ids.push(justification[step.jc]);for(const[pattern,id]of rules)if(pattern.test(s))ids.push(id);return [...new Set(ids.length?ids:fallback)].slice(0,4);}
function cropsFor(topics){const m={pythagoras:'pythagoras',trigonometry:'trig-values',sine_law:'sine-cosine',cosine_law:'sine-cosine',trig_reduction:'trig-values',triangle_angles:'polygon-angles',triangle_area:'triangle-area',parallelogram_area:'parallelogram-area',rhombus_area:'rhombus-area',trapezoid_area:'trapezoid-area',triangle_midline:'midlines',trapezoid_midline:'midlines',circle_length_area:'circle',regular_polygon:'polygon-angles'};return[...new Set(topics.map(t=>m[t]).filter(Boolean))];}
function explain(host,step,fallback,pending=false){const state=pending?'pending':'accepted';if(host.dataset.ocpStep===state)return;const wasOpen=q(':scope > .ocp-step-reason',host)?.open||false;q(':scope > .ocp-step-reason',host)?.remove();host.dataset.ocpStep=state;const box=e('details',null,'ocp-step-reason'),summary=e('summary','Почему этот шаг верен?');box.append(summary);box.open=wasOpen;
 const reasoning=pending?'Назови, что уже известно. Проверь условия теоремы, затем примени её к указанным на чертеже объектам. Число этого шага найди самостоятельно.':step.why||step.ok||(/по условию|дано|общая/i.test(text(step.t||step.h))?'Это дано в условии или относится к одному и тому же объекту. В записи решения укажи это явно.':'Этот шаг использует уже установленные соотношения. Назови исходное равенство и покажи преобразование, не пропуская промежуточную запись.');
 box.append(e('p',text(reasoning)));const topics=topicsForStep(step,fallback);R.topicCards(box,topics);R.sheetCards(box,cropsFor(topics));host.append(box);
}
const shared=root.OgeCourseSharedMode===true;
const draftStore='oge-course-proof-drafts-v1';let drafts={};if(!shared)try{drafts=JSON.parse(root.localStorage.getItem(draftStore)||'{}')||{};}catch(_){}if(Array.isArray(drafts)||typeof drafts!=='object')drafts={};
function draft(anchor,key,proof=false){
 if(!anchor||anchor.parentElement?.querySelector(':scope > .ocp-writing'))return;
 const section=e('details',null,'ocp-writing');section.dataset.taskKey=key;
 const summary=e('summary',proof?'Записать своё доказательство':'Записать ход решения');
 const label=e('label',proof?'Обоснуй каждый вывод: что известно, что следует и почему.':'Запиши равенства и вычисления; укажи теорему для каждого геометрического вывода.');
 const textarea=e('textarea');textarea.rows=4;textarea.placeholder=proof?'Дано → вывод → обоснование → что требовалось доказать.':'Например: треугольник прямоугольный, поэтому применяю теорему Пифагора…';
 textarea.setAttribute('aria-label',proof?'Своя запись доказательства':'Своя запись решения');textarea.value=typeof drafts[key]==='string'?drafts[key]:'';
 const note=e('p',shared?'Запись видна участникам этой комнаты. Личный зачёт не изменяется.':'Запись сохраняется в этом браузере. Свободный текст можно обсудить с преподавателем. Ответ или собранные шаги проверяются отдельно.','ocp-writing-note');
 label.append(textarea);section.append(summary,label,note);
 if(shared)textarea.maxLength=6000;
 textarea.addEventListener('input',()=>{if(shared)textarea.value=textarea.value.replace(/</g,'＜').replace(/>/g,'＞').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').slice(0,6000);drafts[key]=textarea.value;const keys=Object.keys(drafts);if(keys.length>100)delete drafts[keys[0]];if(!shared)try{root.localStorage.setItem(draftStore,JSON.stringify(drafts));}catch(_){note.textContent='Запись остаётся на этой странице. Сохранение в браузере сейчас недоступно.';}});
 // The optional notebook follows the native answer / proof workspace, so it never
 // pushes the nearby help button or answer controls out of the way.
 anchor.parentElement.append(section);
}
function primaryFigures(){
 const selector=taskNo===23?'.train-host > .card > .fig-wrap':taskNo===24?'#view .figbox':'#panel-train .fig';
 qa(selector).forEach(figure=>{
  if(figure.closest('#courseHintPanel')||figure.dataset.ocpFigure)return;
  const svg=q('svg',figure);if(!svg)return;figure.dataset.ocpFigure='1';figure.classList.add('ocp-primary-figure');
  const view=(svg.getAttribute('viewBox')||'').trim().split(/[ ,]+/).map(Number),viewWidth=view[2]||Number(svg.getAttribute('width'))||520;
  const fonts=qa('text',svg).map(node=>parseFloat(node.getAttribute('font-size')||root.getComputedStyle(node).fontSize)).filter(n=>n>0);
  const smallest=fonts.length?Math.min(...fonts):15,readableWidth=Math.ceil(Math.max(440,viewWidth*Math.max(1,18/smallest)));
  const controls=e('div',null,'ocp-figure-controls'),button=e('button','Показать целиком','ocp-figure-zoom');button.type='button';button.setAttribute('aria-pressed','true');
  const note=e('p','Крупный чертёж: двигай его в стороны и вверх-вниз. С клавиатуры — стрелками после выбора рисунка.','ocp-figure-note');
  const pan=e('div',null,'ocp-figure-pan ocp-figure-large');pan.tabIndex=0;pan.setAttribute('role','region');pan.setAttribute('aria-label','Чертёж задачи. Для просмотра используй прокрутку или кнопку масштаба.');
  // Reparent the original SVG: preserve every point, label and native event handler.
  svg.before(pan);pan.append(svg);svg.style.width=readableWidth+'px';svg.style.maxWidth='none';
  controls.append(button);figure.prepend(controls,note);
  button.addEventListener('click',()=>{const large=button.getAttribute('aria-pressed')!=='true';button.setAttribute('aria-pressed',String(large));button.textContent=large?'Показать целиком':'Увеличить подписи';pan.classList.toggle('ocp-figure-large',large);svg.style.width=large?readableWidth+'px':'100%';svg.style.maxWidth=large?'none':'100%';note.textContent=large?'Крупный чертёж: двигай его в стороны и вверх-вниз. С клавиатуры — стрелками после выбора рисунка.':'Чертёж целиком. Чтобы прочитать мелкие подписи, нажми «Увеличить подписи».';pan.scrollLeft=0;pan.scrollTop=0;});
 });
}
function referencePanel(anchor,topics){if(!anchor||anchor.parentElement?.querySelector(':scope > .ocp-references'))return;const host=e('div',null,'ocp-references');R.topicCards(host,topics,{label:'На какую теорию можно опереться?'});R.sheetCards(host,cropsFor(topics));anchor.after(host);return host;}
let current23=null;
function decorate23(){const main=q('.train-host');if(!main)return;const card=q('.card',main),condition=card&&q('.q-text',card);if(!condition)return;let task=current23;const name=q('.q-theme',card)?.textContent||'';if(!task){const sub=Object.keys(topic23).find(k=>typeof SUBS!=='undefined'&&name.includes(SUBS[k].name));if(sub)task={sub};}if(!task)return;const topics=topic23[task.sub]||[];referencePanel(q('#courseHintPanel',card)||condition,topics);draft(condition,'23|'+condition.textContent);
 const steps=task.p&&typeof GUIDE!=='undefined'?GUIDE[task.sub](task.p):[];qa('.ladder .step',card).forEach(node=>{const n=q('.step-num',node)?.textContent.match(/^Шаг (\d+)/);if(n&&steps[+n[1]-1])explain(node,steps[+n[1]-1],topics,!node.classList.contains('done'));});qa('.sol li,.solution li',card).forEach(node=>explain(node,{h:node.textContent},topics));
}
function decorate24(){const main=q('#view');if(!main||typeof ST==='undefined'||!ST.queue||ST.mode==='exam')return;const t=curTask(),given=q('.givens',main);if(!given||!t)return;const topics=topic24[t.id]||[];referencePanel(q('#courseHintPanel',main)||given,topics);draft(given,'24|'+t.id,true);qa('.chain .citem',main).forEach((node,i)=>{if(t.steps[i])explain(q('.ctext',node)||node,{...t.steps[i],theoryTopics:proofStepTopics[t.id]?.[i]},topics);});
 const plate=q('.sheetplate',main);if(plate&&!plate.dataset.ocpSafe){plate.dataset.ocpSafe='1';plate.replaceChildren(e('span','Для доказательства нужны теоремы. Ниже можно открыть их формулировки; формулы из справочного листа добавлены там, где они применяются.'));}
}
function decorate25(){if(typeof trS==='undefined'||!trS)return;const main=q('#panel-train'),condition=q('.cond',main);if(!condition)return;const topics=topic25[trS.id]||[];referencePanel(q('#courseHintPanel',main)||condition,topics);draft(condition,'25|'+trS.id+'|'+JSON.stringify(trS.p));qa('.gsteps>li,.hintbox .steps>li',main).forEach((node,i)=>{const st=trS.b.steps[i];if(st)explain(node,{...st,why:extraReasons25[trS.id+':'+i]||st.why,theoryTopics:calculationStepTopics[trS.id]?.[i]},topics,!!q('.gq',node));});}
function correctReferenceCopy(){if(taskNo!==25)return;qa('.notsheet').forEach(n=>{if(n.textContent.includes('Вписанный угол на диаметр = 90° есть на листе'))n.textContent='Свойства вписанного угла на диаметр в справочном листе ОГЭ нет: его нужно обосновать теоремой о вписанном угле. Формулу для хорды получаем из теоремы синусов; дальнейшее равенство — вывод решения.';});}
let queued=false,disposed=false;function decorate(){queued=false;if(disposed)return;if(taskNo===23)decorate23();if(taskNo===24)decorate24();if(taskNo===25)decorate25();correctReferenceCopy();primaryFigures();const toggle=q('#courseHintToggle');if(toggle&&!toggle.dataset.ocpClose){toggle.dataset.ocpClose='1';toggle.textContent=toggle.getAttribute('aria-expanded')==='true'?'Убрать подсказку':'Хочешь подсказку?';toggle.addEventListener('click',()=>{toggle.textContent=toggle.getAttribute('aria-expanded')==='true'?'Убрать подсказку':'Хочешь подсказку?';});}d.documentElement.dataset.ogeCourseProof='ready';}
if(taskNo===23&&typeof buildTask==='function'){const nativeBuild=buildTask;buildTask=function(mount,task,mode,onDone){const result=nativeBuild(mount,task,mode,onDone);if(mode!=='quiz')current23=task;decorate();return result;};}
const observer=new MutationObserver(()=>{if(!queued){queued=true;queueMicrotask(decorate);}});observer.observe(d.body,{subtree:true,childList:true});
d.addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;const isReference=button.matches('.sp-go')||((taskNo===23)&&button.classList.contains('link-btn')&&/формула/.test(button.textContent));if(!isReference)return;const panel=q('.ocp-references');if(!panel)return;event.preventDefault();event.stopImmediatePropagation();const details=q('details',panel);details.open=true;details.querySelector('summary').focus();},true);
function sharedView(){return q(taskNo===23?'.train-host':taskNo===24?'#view':'#panel-train')||d.createElement('section');}
function sharedControls(){
 const host=sharedView();
 return {writing:q('.ocp-writing',host),textarea:q('.ocp-writing textarea',host),
 details:qa('.ocp-references details,.ocp-step-reason,.ocp-step-reason details',host),
 zoom:qa('.ocp-references .ocr-zoom,.ocp-step-reason .ocr-zoom',host),
 figures:qa('.ocp-figure-zoom',host)};
}
function exactShared(value,keys){
 if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value))||Reflect.ownKeys(value).length!==keys.length)return false;
 return keys.every(key=>{const prop=Object.getOwnPropertyDescriptor(value,key);return prop&&prop.enumerable&&Object.prototype.hasOwnProperty.call(prop,'value');});
}
function boolsShared(value,max){
 if(!Array.isArray(value)||Object.getPrototypeOf(value)!==Array.prototype||value.length>max||Reflect.ownKeys(value).length!==value.length+1)return false;
 return Array.from({length:value.length},(_,i)=>{const p=Object.getOwnPropertyDescriptor(value,String(i));return p&&p.enumerable&&Object.prototype.hasOwnProperty.call(p,'value')&&typeof p.value==='boolean';}).every(Boolean);
}
function validateState(state,matchCurrent=false){
 if(!exactShared(state,['notes','writingOpen','details','zoom','figureLarge'])||typeof state.notes!=='string'||state.notes.length>6000||/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(state.notes)||typeof state.writingOpen!=='boolean'||!boolsShared(state.details,100)||!boolsShared(state.zoom,40)||!boolsShared(state.figureLarge,4))throw new TypeError('Invalid proof workspace state');
 if(matchCurrent){const c=sharedControls();if(state.details.length!==c.details.length||state.zoom.length!==c.zoom.length||state.figureLarge.length!==c.figures.length||(!c.writing&&(state.notes!==''||state.writingOpen)))throw new TypeError('Proof workspace does not match this task');}
 return true;
}
function captureState(){decorate();const c=sharedControls();return {notes:c.textarea?c.textarea.value:'',writingOpen:!!c.writing?.open,details:c.details.map(x=>x.open),zoom:c.zoom.map(x=>x.getAttribute('aria-pressed')==='true'),figureLarge:c.figures.map(x=>x.getAttribute('aria-pressed')==='true')};}
function applyState(state){
 validateState(state);decorate();validateState(state,true);const c=sharedControls();
 if(c.textarea){c.textarea.value=state.notes;c.textarea.dispatchEvent(new root.Event('input',{bubbles:true}));}
 if(c.writing)c.writing.open=state.writingOpen;
 c.details.forEach((x,i)=>{x.open=state.details[i];});
 c.zoom.forEach((x,i)=>{if((x.getAttribute('aria-pressed')==='true')!==state.zoom[i])x.click();});
 c.figures.forEach((x,i)=>{if((x.getAttribute('aria-pressed')==='true')!==state.figureLarge[i])x.click();});
}
root.OgeCourseProof={topic23,topic24,topic25,proofStepTopics,calculationStepTopics,extraReasons25,topicsForStep,cropsFor,decorate,captureState,validateState,applyState,dispose:()=>{disposed=true;observer.disconnect();}};decorate();d.addEventListener('DOMContentLoaded',decorate,{once:true});
})(window);
