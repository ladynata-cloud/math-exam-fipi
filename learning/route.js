/* Free-choice route: all results refer to saved attempts, never to page/video views. */
(function(root,factory){'use strict';const value=factory();if(typeof module==='object'&&module.exports)module.exports=value;else root.LearningRoute=value;})(typeof globalThis==='undefined'?this:globalThis,function(){
'use strict';
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const B='oge-basics:',P='path:';
const groups=[
 {id:"grade7-algebra",title:"7 класс · Алгебра",lead:"От смысла выражения к уравнениям со скобками, дробями и десятичными числами.",items:["grade7-a-expression-structure", "grade7-a-opposite-expression", "grade7-a-two-variable-collect", "grade7-a-substitution-negative-fraction", "grade7-a-equation-two-brackets", "grade7-a-equation-denominators", "grade7-a-equation-decimals", "grade7-a-equation-word-perimeter"].map(x=>P+x),basis:["negative-add-subtract", "fraction-common-denominator", "order-of-operations"].map(x=>B+x),grade7:true},
 {id:"grade7-geometry",title:"7 класс · Геометрия",lead:"Читаем чертёж, называем углы, выбираем соответствующие элементы и обосновываем шаги.",items:["grade7-g-segment-order", "grade7-g-midpoint-chain", "grade7-g-angle-naming", "grade7-g-angle-addition", "grade7-g-angle-bisector", "grade7-g-adjacent-equation", "grade7-g-vertical-chain", "grade7-g-triangle-correspondence", "grade7-g-core-point-line-ray", "grade7-g-core-perpendicular", "grade7-g-core-angle-measure", "grade7-g-core-triangle-elements", "grade7-g-core-triangle-perimeter", "grade7-g-core-sas", "grade7-g-core-median", "grade7-g-core-bisector", "grade7-g-core-altitude", "grade7-g-core-isosceles-elements", "grade7-g-core-isosceles-base-angles", "grade7-g-core-isosceles-vertex-line", "grade7-g-practice-segment-equation", "grade7-g-practice-angle-parts", "grade7-g-practice-vertical-proof", "grade7-g-practice-sas-common-side", "grade7-g-practice-sas-vertical", "grade7-g-practice-cevian-reason", "grade7-g-practice-isosceles-perimeter", "grade7-g-practice-isosceles-proof"].map(x=>P+x),basis:["units-length-time", "multiplication-division", "order-of-operations"].map(x=>B+x),grade7:true},
 {id:"grade7-foundation",title:"Повторить основы",lead:"Дроби, разряды, знаки и пропорции. Открой именно то, что мешает сейчас.",items:["grade7-b-mixed-borrow", "grade7-b-fraction-product-cancel", "grade7-b-fraction-division-meaning", "grade7-b-decimal-place-align", "grade7-b-decimal-divisor-scale", "grade7-b-signed-fraction-sum", "grade7-b-ratio-units", "grade7-b-percent-proportion"].map(x=>P+x),basis:["fraction-meaning", "negative-number-line", "multiplication-division"].map(x=>B+x),grade7:true},
 {"id":"pre7-numbers","title":"Основы до 7 класса · Числа и действия","lead":"Разряды, нули, сравнение, сложение и вычитание. Можно начать с любого навыка.","items":["path:pre7-place-value","path:pre7-natural-compare","path:pre7-add-carry","path:pre7-subtract-borrow","path:pre7-smart-calculation","path:pre7-inverse-components"],"basis":["oge-basics:multiplication-division/multiplication-meaning","oge-basics:order-of-operations"],"grade7":true,"pre7":true},
 {"id":"pre7-fractions","title":"Основы до 7 класса · Дроби","lead":"Увидеть долю, сравнить записи и связать часть с целым.","items":["path:pre7-fraction-line","path:pre7-equivalent-fractions","path:pre7-fraction-compare","path:pre7-fraction-part-whole","path:pre7-decimal-compare"],"basis":["oge-basics:fraction-meaning","oge-basics:multiplication-division"],"grade7":true,"pre7":true},
 {"id":"pre7-measurements","title":"Основы до 7 класса · Задачи и измерения","lead":"Читаем шкалу и условие, измеряем длину, различаем периметр и площадь.","items":["path:pre7-divisibility","path:pre7-scale-reading","path:pre7-comparison-stories","path:pre7-mass-capacity","path:pre7-ruler-length","path:pre7-perimeter","path:pre7-grid-area"],"basis":["path:pre7-place-value","oge-basics:units-length-time","oge-basics:multiplication-division"],"grade7":true,"pre7":true},
 {id:'equations',title:'Линейные уравнения',lead:'Сохранить равенство, раскрыть скобки, разобраться с минусами.',items:['equations-linear','equations-signs','equations-brackets','equations-fractions'].map(x=>P+x),basis:['negative-number-line','negative-add-subtract','order-of-operations','fraction-common-denominator','multiplication-division'].map(x=>B+x),video:'linear-equation'},
 {id:'fractions',title:'Дроби и вычисления',lead:'Понять размер доли и уверенно выполнять действия.',items:['practice-fraction-add','practice-fraction-divide','practice-fraction-expression','practice-decimals','practice-decimal-division'].map(x=>P+x),basis:['fraction-meaning','fraction-common-denominator','decimal-add-subtract','multiplication-division/decimal-divisor-shift'].map(x=>B+x),video:'fractions'},
 {id:'percent',title:'Проценты и пропорции',lead:'Определить целое, найти часть и составить пропорцию.',items:['practice-percent-part','practice-percent-whole','practice-percent-rate','practice-direct-proportion'].map(x=>P+x),basis:['percentages/percent-meaning','percentages/percent-choose-question','percentages/proportion','fraction-meaning'].map(x=>B+x),video:'percentages'},
 {id:'geometry',title:'Первые геометрические задачи',lead:'Углы, клетки, длины и площади. Отдельные темы для тренировки.',items:['practice-spokes','practice-triangle-angle','grid','practice-fence'].map(x=>P+x),basis:['units-length-time','units-area','order-of-operations'].map(x=>B+x),video:'adjacent-angles'},
 {id:'word',title:'Задачи и рассуждения',lead:'Читать условие, выбирать величины, проверять смысл ответа.',items:['practice-meeting','practice-river','practice-ratio-parts','practice-logic-order'].map(x=>P+x),basis:['multiplication-division','units-length-time','percentages/proportion'].map(x=>B+x)},
 {id:'data',title:'Таблицы, формулы и диаграммы',lead:'Находить данные и аккуратно подставлять их в формулу.',items:['practice-chart','practice-ranking','practice-interval-data','practice-temperature'].map(x=>P+x),basis:['negative-add-subtract','order-of-operations','decimal-add-subtract'].map(x=>B+x)}
].map(g=>Object.freeze({...g,items:Object.freeze(g.items),basis:Object.freeze(g.basis)}));
const deeper={
 'multiplication-division/long-division-quotient-digit':['multiplication-division/quotient-estimate'],
 'multiplication-division/quotient-estimate':['multiplication-division/long-division-quotient-digit'],
 'fraction-common-denominator':['fraction-meaning','multiplication-division'],
 'decimal-add-subtract':['order-of-operations','multiplication-division'],
 'negative-add-subtract':['negative-number-line'],
 'order-of-operations':['multiplication-division'],
 'multiplication-division':['multiplication-division/multiplication-meaning','multiplication-division/tabular-division'],
 'multiplication-division/long-division-from-simple-to-decimals':['multiplication-division/long-division-quotient-digit','multiplication-division/long-division-one-digit'],
 'multiplication-division/long-division-one-digit':['multiplication-division/long-division-quotient-digit','multiplication-division/tabular-division'],
 'multiplication-division/long-division-two-digit':['multiplication-division/long-division-quotient-digit','multiplication-division/long-division-one-digit'],
 'multiplication-division/long-division-zero-in-quotient':['multiplication-division/long-division-one-digit'],
 'multiplication-division/division-append-zeros':['multiplication-division/long-division-one-digit','multiplication-division/long-division-zero-in-quotient'],
 'multiplication-division/decimal-division-natural':['multiplication-division/division-append-zeros','multiplication-division/long-division-one-digit'],
 'multiplication-division/decimal-divisor-shift':['multiplication-division/decimal-division-natural','multiplication-division/long-division-one-digit'],
 'percentages/proportion':['fraction-meaning','multiplication-division'],
 'percentages/percent-choose-question':['percentages/percent-meaning'],
 'percentages/percent-of-number-and-whole':['percentages/percent-meaning','percentages/percent-choose-question','multiplication-division'],
 'percentages/percent-meaning':['fraction-meaning'],
 'units-area':['units-length-time','multiplication-division']
};
const focused={
 "grade7-g-practice-segment-equation":["path:grade7-g-segment-order", "path:pre7-inverse-components"],
 "grade7-g-practice-angle-parts":["path:grade7-g-angle-addition", "path:grade7-g-angle-bisector"],
 "grade7-g-practice-vertical-proof":["path:grade7-g-vertical-chain", "path:grade7-g-adjacent-equation"],
 "grade7-g-practice-sas-common-side":["path:grade7-g-core-sas", "path:grade7-g-triangle-correspondence"],
 "grade7-g-practice-sas-vertical":["path:grade7-g-core-sas", "path:grade7-g-vertical-chain"],
 "grade7-g-practice-cevian-reason":["path:grade7-g-core-median", "path:grade7-g-core-bisector", "path:grade7-g-core-altitude"],
 "grade7-g-practice-isosceles-perimeter":["path:grade7-g-core-isosceles-elements", "path:grade7-g-core-triangle-perimeter"],
 "grade7-g-practice-isosceles-proof":["path:grade7-g-core-isosceles-base-angles", "path:grade7-g-core-sas"],
 "grade7-g-core-point-line-ray":["path:pre7-ruler-length"],
 "grade7-g-core-perpendicular":["path:grade7-g-angle-naming", "path:grade7-g-core-angle-measure"],
 "grade7-g-core-angle-measure":["path:pre7-scale-reading", "path:grade7-g-angle-naming"],
 "grade7-g-core-triangle-elements":["path:grade7-g-core-point-line-ray", "path:grade7-g-angle-naming"],
 "grade7-g-core-triangle-perimeter":["path:pre7-perimeter", "path:grade7-g-core-triangle-elements"],
 "grade7-g-core-sas":["path:grade7-g-triangle-correspondence", "path:grade7-g-core-triangle-elements"],
 "grade7-g-core-median":["path:grade7-g-midpoint-chain", "path:grade7-g-core-triangle-elements"],
 "grade7-g-core-bisector":["path:grade7-g-angle-bisector", "path:grade7-g-core-triangle-elements"],
 "grade7-g-core-altitude":["path:grade7-g-core-perpendicular", "path:grade7-g-core-triangle-elements"],
 "grade7-g-core-isosceles-elements":["path:grade7-g-core-triangle-elements"],
 "grade7-g-core-isosceles-base-angles":["path:grade7-g-core-isosceles-elements", "path:grade7-g-core-sas"],
 "grade7-g-core-isosceles-vertex-line":["path:grade7-g-core-median", "path:grade7-g-core-bisector", "path:grade7-g-core-altitude"],
 "pre7-place-value":[],
 "pre7-natural-compare":["path:pre7-place-value"],
 "pre7-add-carry":["path:pre7-place-value"],
 "pre7-subtract-borrow":["path:pre7-place-value", "path:pre7-add-carry"],
 "pre7-smart-calculation":["multiplication-division", "order-of-operations"],
 "pre7-inverse-components":["path:pre7-add-carry", "path:pre7-subtract-borrow", "multiplication-division"],
 "pre7-divisibility":["multiplication-division/multiplication-mixed", "path:pre7-place-value"],
 "pre7-scale-reading":["path:pre7-subtract-borrow", "multiplication-division/tabular-division"],
 "pre7-comparison-stories":["path:pre7-subtract-borrow", "multiplication-division/tabular-division"],
 "pre7-fraction-line":["fraction-meaning", "path:pre7-scale-reading"],
 "pre7-equivalent-fractions":["fraction-meaning", "multiplication-division"],
 "pre7-fraction-compare":["path:pre7-fraction-line", "path:pre7-equivalent-fractions"],
 "pre7-fraction-part-whole":["fraction-meaning", "multiplication-division/tabular-division"],
 "pre7-decimal-compare":["path:pre7-place-value", "path:pre7-natural-compare"],
 "pre7-mass-capacity":["path:pre7-place-value", "units-length-time"],
 "pre7-ruler-length":["path:pre7-scale-reading", "path:pre7-subtract-borrow"],
 "pre7-perimeter":["path:pre7-ruler-length", "multiplication-division"],
 "pre7-grid-area":["multiplication-division/multiplication-meaning", "path:pre7-ruler-length"],
 "grade7-b-mixed-borrow":["path:pre7-equivalent-fractions", "fraction-common-denominator"],
 "grade7-b-fraction-product-cancel":["path:pre7-equivalent-fractions", "multiplication-division"],
 "grade7-b-fraction-division-meaning":["path:pre7-fraction-line", "fraction-meaning", "multiplication-division/tabular-division"],
 "grade7-b-decimal-place-align":["path:pre7-place-value", "path:pre7-add-carry", "path:pre7-subtract-borrow"],
 "grade7-b-decimal-divisor-scale":["path:pre7-place-value", "multiplication-division/decimal-divisor-shift"],
 "grade7-b-signed-fraction-sum":["path:pre7-fraction-compare", "fraction-common-denominator", "negative-add-subtract"],
 "grade7-b-ratio-units":["path:pre7-mass-capacity", "units-length-time"],
 "grade7-b-percent-proportion":["path:pre7-fraction-part-whole", "percentages/percent-meaning", "percentages/proportion"],
 'equations-linear':['order-of-operations','multiplication-division'],
 'equations-signs':['negative-number-line','negative-add-subtract','multiplication-division'],
 'equations-brackets':['order-of-operations','negative-add-subtract','multiplication-division'],
 'equations-fractions':['fraction-meaning','fraction-common-denominator','multiplication-division']
};
function groupFor(id){return groups.find(g=>g.items.includes(id))||null;}
function itemFor(catalog,attempt){return catalog.items.find(i=>i.trainerId===attempt.trainerId&&i.contentId===attempt.contentId)||null;}
function ownAttempts(attempts,account){return attempts.filter(a=>a.learnerId===account.id&&!a.archivedAt);}
function latestFor(attempts,item){return attempts.filter(a=>!a.archivedAt&&a.contentId===item.contentId&&a.trainerId===item.trainerId).sort((a,b)=>String(b.updatedAt||b.createdAt).localeCompare(String(a.updatedAt||a.createdAt)))[0]||null;}
function progress(attempts,ids,catalog){const relevant=attempts.filter(a=>!a.archivedAt&&ids.some(id=>{const i=catalog.get(id);return i&&i.contentId===a.contentId&&i.trainerId===a.trainerId;}));return {opened:new Set(relevant.map(a=>a.trainerId+':'+a.contentId)).size,total:ids.length,independent:relevant.filter(a=>['independent','repeated'].includes(a.outcome)).length,helped:relevant.filter(a=>['hinted','together'].includes(a.outcome)).length,started:relevant.filter(a=>a.outcome==='started').length};}
function prerequisites(item,catalog,topicId){if(!item)return [];const g=groups.find(x=>x.id===topicId&&x.items.includes(item.id))||groupFor(item.id);const qualify=id=>id.startsWith(P)||id.startsWith(B)?id:B+id;const courseStage=globalThis.DivisionCourse?.has(item.contentId)?globalThis.DivisionCourse.stageFor(item.contentId):null;const ids=courseStage?(courseStage.prerequisite?[courseStage.prerequisite].map(qualify):[]):item.geometryRebuild?(item.prerequisites||[]).map(id=>P+id):item.family==='remediation'?(deeper[item.contentId]||[]).map(qualify):focused[item.contentId]?focused[item.contentId].map(qualify):g?.basis||[];return ids.map(id=>catalog.get(id)).filter(i=>i&&i.id!==item.id);}
function returnAttempt(attempts,account,id,currentId){if(typeof id!=='string'||id===currentId)return null;return ownAttempts(attempts,account).find(a=>a.id===id)||null;}
function status(attempt,labels){if(!attempt)return 'Ещё не открывали';const main=labels[attempt.outcome]||'Начато';const hint=attempt.outcome==='started'&&(attempt.assistance?.hints>0||attempt.assistance?.teacher)?' · с помощью':'';return main+hint;}
function lessonSteps(guide){return `<ol class="lesson-steps">${guide.steps.map(step=>`<li>${E(step)}</li>`).join('')}</ol>`;}
function makarychevCourse(){return '<section class="panel route-grade7"><p class="eyebrow">РЕПЕТИТОР ДЛЯ СЕМИКЛАССНИКА</p><h2>Алгебра, геометрия и опора для трудного шага</h2><p>Ниже общий маршрут: выбери тему, посмотри пример по желанию, попробуй модель или шаги, затем реши новое условие самостоятельно. Работу в кабинете можно сдать Наталье Михайловне.</p><a class="button" href="https://mathexam.space/grade7/" target="_blank" rel="noopener">Программа, шпаргалки и видео ↗</a></section>';}

function lessonIndex(){const guides=globalThis.LearningTopicGuides?.items||[];return guides.length?`<details class="panel route-lessons route-library"><summary>Все видео и инструкции по темам</summary><p>Открой пример, затем попробуй сама. Для каждого тренажёра есть короткая инструкция.</p><div class="lesson-links">${guides.map(g=>`<a class="button" href="#learn=${encodeURIComponent(g.id)}">${E(g.title)} →</a>`).join('')}</div></details>`:'';}
function mountLesson(host,ctx){const {guide,catalog,openContent}=ctx,item=guide.catalogId?catalog.get(guide.catalogId):null;host.innerHTML=`<section class="panel lesson-start"><p class="eyebrow">МОЖНО ИДТИ В СВОЁМ ТЕМПЕ</p><h1>${E(guide.title)}</h1><p class="lead">Сначала посмотри пример, если он нужен. Затем попробуй решить своё задание.</p><div class="actions"><a class="button" href="https://mathexam.space/video-lessons/cheatsheets.html#${encodeURIComponent(guide.id)}" target="_blank" rel="noopener">1. Открыть шпаргалку ↗</a><button type="button" data-lesson-video>▶ Разбор задачи</button><button type="button" data-lesson-trainer-video>Как работать в тренажёре</button></div><h2>Что делать в тренажёре</h2>${lessonSteps(guide)}${item?`<button class="primary" type="button" data-lesson-start>2. Открыть мою работу: ${E(guide.practiceLabel)}</button><p class="form-hint">Если ты уже начинала эту тему, продолжишь сохранённую работу. Просмотр примера не считается решением.</p>`:`<a class="button primary" data-lesson-practice href="${E(guide.publicUrl)}" target="_blank" rel="noopener">2. ${E(guide.practiceLabel)} ↗</a><p class="form-hint">${E(guide.progressNote)}</p>`}<h2>Если трудно</h2><p>${item?'Открой подсказку. В своей работе можно выбрать «Нужна основа?» и повторить более раннюю тему, затем вернуться к этой же задаче.':E(guide.helpNote||'В тренажёре нажми «💡 Подсказка». Если всё ещё трудно, вернись к шпаргалке и запиши, на каком шаге остановилась, — отправь это вместе с решением в MAX.')}</p><p><a href="#route">← Вернуться в мой маршрут</a></p></section>`;host.querySelector('[data-lesson-video]').onclick=()=>window.MathExamWelcome?.openVideo(guide.id);host.querySelector('[data-lesson-trainer-video]').onclick=()=>window.MathExamWelcome?.openVideo(guide.id,'trainer');const button=host.querySelector('[data-lesson-start]');if(button)button.onclick=async()=>{button.disabled=true;try{await openContent(item.id,{topicId:groupFor(item.id)?.id});}finally{if(button.isConnected)button.disabled=false;}};return()=>{};}
function studySuggestion(ctx){
 const map=globalThis.Grade7RouteMap;if(!map)return '';
 const {catalog,account,attempts,labels}=ctx;
 const mine=ownAttempts(attempts,account).filter(a=>map.stageFor(itemFor(catalog,a)?.id)).sort((a,b)=>String(b.updatedAt||b.createdAt).localeCompare(String(a.updatedAt||a.createdAt)));
 const recent=mine[0];
 if(!recent)return '<section class="study-next"><p class="eyebrow">С ЧЕГО НАЧАТЬ</p><h2>Выбери свою школьную тему</h2><p>В алгебре можно начать с рациональных чисел, в геометрии — с точек и отрезков. Открой остановку ниже: объяснение, видео и практика стоят рядом. Можно сразу перейти к тому, что проходят в школе.</p></section>';
 const item=itemFor(catalog,recent),stage=map.stageFor(item.id);
 if(recent.outcome==='started')return `<section class="study-next"><p class="eyebrow">ПРОДОЛЖИТЬ С ТОГО ЖЕ МЕСТА</p><h2>${E(item.title)}</h2><p>${E(status(recent,labels))}. Условие, введённый ответ и предыдущие шаги сохранены.</p><a class="button primary" href="#attempt=${encodeURIComponent(recent.id)}">Продолжить мою работу →</a></section>`;
 if(['hinted','together','practiced'].includes(recent.outcome))return `<section class="study-next"><p class="eyebrow">МОЖНО ЗАКРЕПИТЬ</p><h2>${E(item.title)}</h2><p>${E(status(recent,labels))}. Попробуй похожую задачу с новыми числами самостоятельно. Это рекомендация: можно выбрать другую тему ниже.</p><div class="actions"><button type="button" class="primary" data-study-fresh="${E(recent.id)}">Новый самостоятельный пример →</button><a class="button" href="#attempt=${encodeURIComponent(recent.id)}">Мой сохранённый разбор</a></div></section>`;
 const course=map.courses.find(c=>c.stages.includes(stage));
 const next=course?.stages.flatMap(s=>s.items).map(id=>catalog.get(id)).find(i=>!mine.some(a=>a.contentId===i.contentId&&a.trainerId===i.trainerId&&['independent','repeated'].includes(a.outcome)));
 return `<section class="study-next"><p class="eyebrow">ВОЗМОЖНЫЙ СЛЕДУЮЩИЙ ШАГ</p><h2>${E(next?.title||item.title)}</h2><p>В последней задаче: ${E(status(recent,labels))}. ${next?'Можно попробовать эту тему или выбрать другую остановку.':'Можно закрепить один из приёмов на новом примере.'} Результат относится к конкретной задаче.</p>${next?`<button type="button" class="primary" data-study-item="${E(next.id)}">Открыть задание →</button>`:`<button type="button" class="primary" data-study-fresh="${E(recent.id)}">Новый самостоятельный пример →</button>`}</section>`;
}
function studyMap(ctx){const map=globalThis.Grade7RouteMap;if(!map)return '';return `<section class="panel study-route-panel"><h2>Маршрут по 7 классу</h2>${map.render({catalog:ctx.catalog,guides:globalThis.LearningTopicGuides,mode:'cabinet',attempts:ctx.attempts,labels:ctx.labels,learnerId:ctx.account.id})}</section>`;}
// Two visible routes share existing task identities and saved attempts.
const geometryProofStages=[
 {title:'1. Научиться читать доказательство',goal:'Найди две стороны, угол между ними и причину каждого равенства.',items:['triangle-elements','triangle-included-angle','triangle-common-side','triangle-vertical-angle','triangle-proof-correspondence','triangle-proof-reasons']},
 {title:'2. Первый признак: две стороны и угол между ними',goal:'Собери доказательства к рисункам №1 и №3. Проверь, что выбран именно угол между равными сторонами.',items:['photo-proof-1','proof-builder-sas','triangle-sas-common','photo-proof-3','triangle-sas-cross','triangle-sas-insufficient','grade7-g-practice-sas-common-side']},
 {title:'3. Небольшой переход к третьему признаку',goal:'Разбери рисунок №2: здесь нужны три пары равных сторон. Это третий признак.',items:['photo-proof-2','proof-builder-sss']},
 {title:'Дополнительно: задачи на периметр',goal:'Потренируй вычисления, если остаётся время. Этот блок не входит в три основные миссии.',optional:true,items:['perimeter-chain-more-half','perimeter-chain-less-double','perimeter-equation-fourfold','perimeter-equation-threefold']}
].map(stage=>Object.freeze({...stage,items:Object.freeze(stage.items.map(id=>'path:'+(id.startsWith('grade7-')?id:'grade7-r-'+id)))}));
const geometrySections=Object.freeze([
 ['Точка, прямая, отрезок','Различай прямую и отрезок; находи точки и концы.'],
 ['Луч и угол','Находи начало луча, вершину и стороны угла.'],
 ['Измерение отрезков и углов','Собирай целое из частей и узнавай середину и биссектрису.'],
 ['Смежные и вертикальные углы','Объясняй, когда углы равны, а когда дают в сумме 180°.'],
 ['Треугольник','Называй стороны и углы, устанавливай соответствие, находи периметр.'],
 ['Первый признак равенства треугольников','Находи две равные стороны и равный угол между ними.'],
 ['Медиана, биссектриса и высота','Различай три отрезка по их свойствам.'],
 ['Равнобедренный треугольник','Находи основание и используй равенство углов при нём.'],
 ['Второй признак равенства треугольников','Выбирай сторону и два прилежащих к ней угла.'],
 ['Третий признак равенства треугольников','Доказывай равенство по трём парам сторон.'],
 ['Окружность','Различай радиус, диаметр, хорду и дугу.'],
 ['Признаки параллельности прямых','Находи пары углов и доказывай параллельность.'],
 ['Углы при параллельных прямых','Находи неизвестные углы, когда параллельность уже дана.'],
 ['Сумма углов треугольника','Находи третий угол и отличай внутренний угол от внешнего.'],
 ['Стороны и углы треугольника','Сравнивай стороны и углы; проверяй, существует ли треугольник.'],
 ['Свойства прямоугольного треугольника','Находи острые углы и применяй свойство катета напротив 30°.'],
 ['Равенство прямоугольных треугольников','Выбирай достаточные условия равенства и объясняй выбор.']
].map(([title,goal])=>Object.freeze({title,goal})));
function geometryJourney(ids,catalog,entries=[]){
 const items=[...new Set(ids)].map(id=>catalog.get(id)).filter(Boolean);
 const byContent=new Map(entries.filter(row=>row&&typeof row.contentId==='string').map(row=>[row.trainerId+':'+row.contentId,row]));
 const records=items.map(item=>({item,record:byContent.get(item.trainerId+':'+item.contentId)}));
 const started=records.filter(row=>row.record?.latest?.outcome==='started').sort((a,b)=>String(b.record.latest.updatedAt||b.record.latest.createdAt||'').localeCompare(String(a.record.latest.updatedAt||a.record.latest.createdAt||'')))[0];
 const next=started||records.find(row=>row.record?.completed!==true)||null;
 return {total:items.length,completed:records.filter(row=>row.record?.completed===true).length,next:next?.item||null,resume:!!started};
}
function geometryTrackGroups(catalog){
 const workbook=catalog.items.filter(item=>item.geometryRebuild&&!item.contentId.startsWith('grade7-r-photo-proof-'));
 return {proofs:geometryProofStages.filter(stage=>!stage.optional).flatMap(stage=>stage.items),workbook:geometrySections.flatMap((_,index)=>workbook.filter(item=>item.section===index+1).map(item=>item.id))};
}
function geometryTracks(catalog,rows){
 const workbook=catalog.items.filter(item=>item.geometryRebuild&&!item.contentId.startsWith('grade7-r-photo-proof-'));
 if(!workbook.length)return '';
 const next=key=>`<div class="geometry-next" data-geometry-next="${key}" aria-live="polite"><p>Загружаем сохранённый прогресс…</p></div>`;
 const mission=(stage,index)=>`<section class="geometry-route-mission"><h4>${E(stage.title)}</h4><p>${E(stage.goal)}</p><p class="geometry-checkpoint" data-geometry-checkpoint="proofs-${index}"></p>${rows(stage.items)}</section>`;
 return `<section class="panel geometry-tracks" aria-labelledby="geometry-tracks-title"><p class="eyebrow">ДВА МАРШРУТА ПО ГЕОМЕТРИИ</p><h2 id="geometry-tracks-title">Один понятный шаг за раз</h2><p>Нужно научиться доказывать по рисункам — начни с маршрута 1. Хочется разобраться с самого начала — выбери маршрут 2. Их можно чередовать.</p><ol class="geometry-session"><li><strong>Разберись.</strong> Открой «Мастерскую» или вкладку «Исследовать», найди элементы и собери рассуждение.</li><li><strong>Проверь себя.</strong> Возьми новый вариант и попробуй без подсказки. Для задач по фото выбери похожий урок: сам рисунок при повторе остаётся прежним.</li><li><strong>Объясни.</strong> Запиши решение своими словами и сдай Наталье Михайловне.</li></ol><p class="geometry-gentle">На одно занятие можно выбрать один небольшой урок. Подсказки доступны всегда; ошибки не отнимают уже сделанную работу.</p><div class="route-grid"><article class="route-card geometry-track-card"><p class="eyebrow">МАРШРУТ 1 · ТРИ МИССИИ</p><h3>Доказательства по рисункам</h3><p>От чтения чертежа — к собственному доказательству. Рисунки №1 и №3: первый признак. Рисунок №2: третий признак.</p>${next('proofs')}<details data-geometry-track="proofs"><summary>Все три миссии и дополнительная практика</summary>${geometryProofStages.filter(stage=>!stage.optional).map(mission).join('')}<details data-geometry-extra><summary>Дополнительно · периметр</summary>${mission(geometryProofStages[3],3)}</details><p class="geometry-progress-note">Проверка ответа в тренажёре относится к отдельному шагу. Полноту письменного доказательства проверяет преподаватель.</p></details></article><article class="route-card geometry-track-card"><p class="eyebrow">МАРШРУТ 2 · 17 ТЕМ</p><h3>Геометрия с самого начала</h3><p>Все разделы большой методички Т. В. Сиротиной: ${workbook.length} небольших уроков. Начни с точек и линий или выбери первую непонятную тему.</p>${next('workbook')}<details data-geometry-track="workbook"><summary>Выбрать тему из всей методички</summary>${geometrySections.map((section,index)=>{const items=workbook.filter(item=>item.section===index+1),pages=items.flatMap(item=>item.sourcePages);return `<details class="geometry-book-section" data-geometry-section="${index+1}"><summary><span class="geometry-section-number">${index+1}</span><span>${E(section.title)}</span></summary><p>${E(section.goal)}</p><p class="geometry-checkpoint" data-geometry-checkpoint="workbook-${index}"></p><p class="geometry-source">Страницы ${Math.min(...pages)}–${Math.max(...pages)} · ${items.length} небольших уроков</p>${rows(items.map(item=>item.id))}</details>`;}).join('')}<p><a href="https://mathexam.space/grade7/geometry-rebuild/" target="_blank" rel="noopener">Оглавление полного курса ↗</a></p></details></article></div><p class="geometry-progress-note">Счётчики на карточках показывают задания, в которых есть хотя бы один завершённый вариант, в том числе с помощью. Это не оценка за тему. Один урок может входить в оба маршрута: сохранённая работа у него общая.</p></section>`;
}

// Background refresh must not collapse a route or reset a selected study mode.
// This is ephemeral navigation state, isolated by DOM host and account identity.
const routeViews=new WeakMap();
function rememberRouteView(host,account){routeViews.set(host,{accountId:account.id,track:host.querySelector('[data-study-track][aria-pressed="true"]')?.dataset.studyTrack,courses:[...host.querySelectorAll('[data-study-course]')].map(node=>({id:node.dataset.studyCourse,mode:node.dataset.studyView,topic:node.querySelector('[data-study-select]')?.value})),openStages:[...host.querySelectorAll('.study-stage[open]')].map(node=>node.id),geometry:[...host.querySelectorAll('[data-geometry-track][open]')].map(node=>node.dataset.geometryTrack),geometrySections:[...host.querySelectorAll('[data-geometry-section][open]')].map(node=>node.dataset.geometrySection),geometryExtra:!!host.querySelector('[data-geometry-extra][open]')});}
function restoreRouteView(host,account){
 const view=routeViews.get(host);if(!view||view.accountId!==account.id){routeViews.delete(host);return;}
 [...host.querySelectorAll('[data-study-track]')].find(node=>node.dataset.studyTrack===view.track)?.click();
 for(const course of view.courses){const node=[...host.querySelectorAll('[data-study-course]')].find(node=>node.dataset.studyCourse===course.id);if(!node)continue;const select=node.querySelector('[data-study-select]');if(select&&[...select.options].some(option=>option.value===course.topic))select.value=course.topic;[...node.querySelectorAll('[data-study-mode]')].find(button=>button.dataset.studyMode===course.mode)?.click();}
 host.querySelectorAll('.study-stage').forEach(node=>{node.open=view.openStages.includes(node.id);});
 host.querySelectorAll('[data-geometry-track]').forEach(node=>{node.open=view.geometry.includes(node.dataset.geometryTrack);});
 host.querySelectorAll('[data-geometry-section]').forEach(node=>{node.open=view.geometrySections.includes(node.dataset.geometrySection);});
 host.querySelectorAll('[data-geometry-extra]').forEach(node=>{node.open=view.geometryExtra===true;});
}

function mount(host,ctx){const {catalog,account,attempts,labels,openContent,api}=ctx;let alive=true;const mine=ownAttempts(attempts,account),all=globalThis.Grade7RouteMap?.stages.flatMap(s=>s.items)||groups.flatMap(g=>g.items),total=progress(mine,all,catalog),recent=[...mine].sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)))[0];
 const rows=(ids,basis=false)=>`<ul class="route-items">${ids.map(id=>{const i=catalog.get(id);if(!i)return '';const a=latestFor(mine,i);return `<li><button type="button" ${basis?'data-route-basis':'data-route-item'}="${E(i.id)}">${E(i.title)} <span aria-hidden="true">↗</span></button><small data-route-status="${E(i.id)}">${E(status(a,labels))}</small></li>`;}).join('')}</ul>`;
 host.innerHTML=`<section class="route-intro"><div><p class="eyebrow">В СВОЁМ ТЕМПЕ</p><h1>Мой маршрут</h1><p class="lead">Выбирайте, что интересно или нужно сейчас. Все темы открыты: можно вернуться к основам и продолжить свою задачу.</p></div><div class="actions"><a class="button" href="https://mathexam.space/video-lessons/cheatsheets.html" target="_blank" rel="noopener">Шпаргалки по темам ↗</a><button type="button" data-route-welcome>Как здесь заниматься</button></div></section>${globalThis.LearningDivisionCourse?.entry()||''}${geometryTracks(catalog,rows)}${makarychevCourse()}${studySuggestion(ctx)}<section class="route-progress panel" aria-label="Мой сохранённый прогресс"><div><strong>${total.opened} / ${total.total}</strong><span>тренажёров основного маршрута открыто</span></div><div><strong>${total.independent}</strong><span>попыток решено самостоятельно</span></div><div><strong>${total.helped}</strong><span>попыток решено с помощью</span></div><p>Здесь результаты конкретных задач. Просмотр инструкции или видео не считается решением.</p></section><section class="panel route-recommendations" aria-label="Рекомендации преподавателя"><h2>Наталья Михайловна рекомендует</h2><div data-route-plan aria-live="polite"><p>Загружаем рекомендации…</p></div></section>${studyMap(ctx)}${lessonIndex()}<details class="route-library" data-route-library><summary>Полный список и дополнительные подборки</summary><div class="section-heading"><h2>Все доступные подборки</h2><a href="#assignments">Моя домашняя работа →</a></div><div class="route-grid">${groups.map(g=>{const p=progress(mine,g.items,catalog);return `<section class="route-card panel" id="route-${g.id}"><p class="eyebrow">${g.pre7?'ОСНОВЫ ДО 7 КЛАССА':g.grade7?'ТЕМЫ КУРСА · СОХРАНЯЮТСЯ В КАБИНЕТЕ':g.id==='geometry'?'ПОДБОРКА ТЕМ':'МОЖНО НАЧАТЬ ЗДЕСЬ'}</p><h2>${E(g.title)}</h2><p>${E(g.lead)}</p><p class="route-count">Открыто ${p.opened} из ${p.total} · самостоятельно решено попыток: ${p.independent}</p><progress value="${p.opened}" max="${p.total}" aria-label="Открыто тренажёров: ${p.opened} из ${p.total}"></progress>${rows(g.items)}${g.video?`<button type="button" class="small route-video" data-route-video="${g.video}">▶ Посмотреть разбор${g.id==='geometry'?' смежных углов':''}</button>`:''}<details class="route-foundations"><summary>↘ Вспомнить более ранние темы</summary><p>Это необязательная помощь. Любую основу можно открыть отдельно.</p>${rows(g.basis,true)}</details></section>`;}).join('')}</div><section class="panel route-extra"><h2>Можно вернуться ещё дальше</h2><p>Таблица умножения, деление уголком и смысл дроби — нормальная часть подготовки. Выбирайте нужный шаг без обязательной очереди.</p>${rows(['multiplication-division/multiplication-meaning','multiplication-division/multiplication-mixed','multiplication-division/long-division-one-digit','multiplication-division/long-division-from-simple-to-decimals','fraction-meaning','negative-number-line'].map(x=>B+x),true)}<p><a href="#course">Все тренажёры моего курса →</a></p></section></details>`;
 globalThis.Grade7RouteMap?.bind(host);restoreRouteView(host,account);
 host.querySelectorAll('[data-study-item]').forEach(button=>button.onclick=async()=>{button.disabled=true;try{const id=button.dataset.studyItem,checking=button.closest('[data-study-course]')?.dataset.studyView==='check',item=catalog.get(id),source=item&&latestFor(ownAttempts(attempts,account),item);await openContent(id,{topicId:groupFor(id)?.id,...(checking?{fresh:true,...(source?{sourceAttemptId:source.id}:{})}:{})});}finally{if(button.isConnected)button.disabled=false;}});
 host.querySelectorAll('[data-study-fresh]').forEach(button=>button.onclick=async()=>{const source=ownAttempts(attempts,account).find(a=>a.id===button.dataset.studyFresh);if(!source)return;const item=itemFor(catalog,source);if(!item)return;button.disabled=true;try{await openContent(item.id,{fresh:true,sourceAttemptId:source.id,topicId:groupFor(item.id)?.id});}finally{if(button.isConnected)button.disabled=false;}});
 host.querySelector('[data-route-welcome]').onclick=()=>window.MathExamWelcome?.open();
 function bind(container){container.querySelectorAll('[data-route-item],[data-route-basis]').forEach(b=>b.onclick=async()=>{b.disabled=true;try{await openContent(b.dataset.routeItem||b.dataset.routeBasis,{topicId:groupFor(b.dataset.routeItem)?.id});}finally{if(b.isConnected)b.disabled=false;}});container.querySelectorAll('[data-route-video]').forEach(b=>b.onclick=()=>window.MathExamWelcome?.openVideo(b.dataset.routeVideo));}
 bind(host);
 // Read the existing complete server summary. The recent attempts list is
 // bounded to 200 and must not erase older completed tasks on either journey.
 async function loadGeometryProgress(){
  const target=host.querySelector('.geometry-tracks');if(!target)return;
  const tracks=geometryTrackGroups(catalog);
  try{
   const result=await api('/progress');if(!alive||!target.isConnected)return;
   if(!Array.isArray(result.progress))throw Error('INVALID_PROGRESS');
   const entries=result.progress;
   for(const [key,ids] of Object.entries(tracks)){
    const value=geometryJourney(ids,catalog,entries),box=target.querySelector('[data-geometry-next="'+key+'"]');
    box.innerHTML=`<p class="geometry-saved-count"><strong>${value.completed} / ${value.total}</strong> заданий имеют завершённый вариант</p><progress value="${value.completed}" max="${value.total}" aria-label="Завершённые задания маршрута"></progress>${value.next?`<p class="geometry-next-title">${value.resume?'Продолжи начатое:':'Твой следующий небольшой шаг:'}<br><strong>${E(value.next.title)}</strong></p><button type="button" class="primary" data-geometry-start="${E(value.next.id)}">${value.resume?'Продолжить работу':value.completed?'Следующий шаг':'Начать маршрут'} →</button>`:'<p class="geometry-earned">✓ Во всех заданиях маршрута есть завершённый вариант.</p><p>Теперь можно закрепить трудное или обсудить решения с Натальей Михайловной. Любое задание доступно в списке ниже.</p>'}`;
   }
   const checkpointGroups={...Object.fromEntries(geometryProofStages.map((stage,index)=>['proofs-'+index,stage.items])),...Object.fromEntries(geometrySections.map((_,index)=>['workbook-'+index,tracks.workbook.filter(id=>catalog.get(id).section===index+1)]))};
   target.querySelectorAll('[data-geometry-checkpoint]').forEach(node=>{
    const value=geometryJourney(checkpointGroups[node.dataset.geometryCheckpoint]||[],catalog,entries);
    node.textContent=value.completed===value.total&&value.total?'✓ Во всех '+value.total+' заданиях есть завершённый вариант':'Завершено заданий: '+value.completed+' из '+value.total;
    node.classList.toggle('geometry-earned',value.completed===value.total&&value.total>0);
   });
   const byContent=new Map(entries.map(row=>[row.trainerId+':'+row.contentId,row]));
   target.querySelectorAll('[data-route-status]').forEach(node=>{const item=catalog.get(node.dataset.routeStatus),record=item&&byContent.get(item.trainerId+':'+item.contentId);node.textContent=record?(record.completed?'✓ Есть завершённый вариант. ':'')+'Последняя работа: '+status(record.latest,labels):'Ещё не начинали';});
   target.querySelectorAll('[data-geometry-start]').forEach(button=>button.onclick=async()=>{button.disabled=true;try{await openContent(button.dataset.geometryStart,{topicId:groupFor(button.dataset.geometryStart)?.id});}finally{if(button.isConnected)button.disabled=false;}});
  }catch(_){
   if(!alive||!target.isConnected)return;
   target.querySelectorAll('[data-geometry-next]').forEach(box=>{box.innerHTML='<p>Сохранённый прогресс пока не загрузился. Открой нужное задание в списке ниже — прежняя работа сохранена.</p><button type="button" data-geometry-retry>Повторить загрузку прогресса</button>';box.querySelector('button').onclick=loadGeometryProgress;});
  }
 }
 loadGeometryProgress();
 async function loadPlan(){const target=host.querySelector('[data-route-plan]');try{const result=await api('/plan');if(!alive||!target.isConnected)return;const plan=result.plan||result,items=(plan.items||[]).filter(i=>catalog.get(i.catalogId));target.innerHTML=`${plan.note?`<p class="route-plan-note">${E(plan.note)}</p>`:''}${items.length?`<p>Вы можете выбирать порядок и заглядывать в другие темы.</p><ul class="route-items">${items.map(entry=>{const i=catalog.get(entry.catalogId);return `<li><button type="button" data-route-item="${E(i.id)}">${E(i.title)} →</button><p>${E(entry.reason)}</p><small>${E(status(latestFor(mine,i),labels))}</small></li>`;}).join('')}</ul>`:'<p>Персональные рекомендации появятся здесь. Пока можно выбрать любую тему ниже.</p>'}`;bind(target);}catch(_){if(alive&&target.isConnected){target.innerHTML='<p>Рекомендации пока не загрузились. Ваши темы остаются доступными.</p><button type="button" class="small">Повторить загрузку</button>';target.querySelector('button').onclick=loadPlan;}}}loadPlan();return()=>{rememberRouteView(host,account);alive=false;};}
function roundingSupport(attempt){
 const item=globalThis.ArithmeticCourse?.roundingPreparation;
 if(!item||attempt.trainerId!=='oge-basics'||!['multiplication-division/course-estimate','multiplication-division/quotient-estimate'].includes(attempt.contentId))return '';
 return `<section class="panel rounding-preparation"><h2>${E(item.title)}</h2><p>${E(item.goal)}</p><a class="button" href="https://mathexam.space${E(item.publicUrl)}" target="_blank" rel="noopener">${E(item.action)} ↗</a><p>${E(item.returnNote)}</p><p>Эта работа останется здесь. Отдельная тренировка не входит в прогресс кабинета.</p></section>`;
}
function mountSupport(host,ctx){const {catalog,attempt,attempts,account,labels}=ctx,item=itemFor(catalog,attempt),basis=prerequisites(item,catalog,ctx.topicId),back=returnAttempt(attempts,account,ctx.returnTo,attempt.id),group=groupFor(item?.id),guide=globalThis.LearningTopicGuides?.forItem(item?.id),fractionPractice=attempt.trainerId==='ege-path'&&['fractions','practice-fraction-expression'].includes(attempt.contentId||attempt.taskSpec?.id);host.innerHTML=`${back?`<div class="route-return"><div><b>Вы повторяете основу</b><span>Исходная задача и её записи сохранены.</span></div><a class="button primary" href="#attempt=${encodeURIComponent(back.id)}">Вернуться к моей задаче →</a></div>`:''}${guide?`<section class="lesson-instructions"><h2>Что делать здесь</h2>${lessonSteps(guide)}<p>Сначала попробуй сама. Если нужна опора — открой разбор ниже; он показывает похожий пример.</p></section>`:''}<div class="route-support-actions"><div class="actions"><button type="button" class="primary" data-submit-attempt>Сдать Наталье Михайловне</button>${guide?`<button type="button" class="small" data-support-video="${guide.id}">▶ Анимированная шпаргалка</button>${guide.publicUrl===globalThis.LearningTopicGuides?.get(guide.id)?.publicUrl?`<button type="button" class="small" data-support-trainer-video="${guide.id}">Как работать в тренажёре</button>`:''}`:''}<a class="button small" href="https://mathexam.space/video-lessons/cheatsheets.html${guide?'#'+encodeURIComponent(guide.id):''}" target="_blank" rel="noopener">${guide?'Шпаргалка к этой работе':'Все шпаргалки'} ↗</a>${/^multiplication-division\//.test(item?.contentId||'')?'<a href="#division-course" class="button small">Умножение и деление →</a>':''}<a href="#route" class="button small">Мой маршрут</a></div><p data-submit-status role="status"></p></div>${roundingSupport(attempt)}${fractionPractice?'<section class="panel fraction-extra-practice"><h2>Ещё выражения с дробями</h2><p>Скобки и порядок действий: решай новые примеры по одному шагу.</p><a class="button" href="https://mathexam.space/school/index.html?course=vilenkin6#lesson/v6f-fraction-order" target="_blank" rel="noopener">Открыть тренировку →</a><p>Она откроется в другой вкладке. Эта работа останется здесь.</p></section>':''}${basis.length?`<details class="route-foundations"><summary>↘ Нужна основа? Можно заглянуть в раннюю тему</summary><p>Повторение откроется отдельной работой. Затем вернитесь к этой же задаче.</p><ul class="route-items">${basis.map(i=>`<li><button type="button" data-support-basis="${E(i.id)}">${E(i.title)} →</button><small>${E(status(latestFor(ownAttempts(attempts,account),i),labels))}</small></li>`).join('')}</ul></details>`:''}`;
 host.querySelector('[data-submit-attempt]').onclick=ctx.submit;const videoButton=host.querySelector('[data-support-video]');if(videoButton)videoButton.onclick=e=>window.MathExamWelcome?.openVideo(e.currentTarget.dataset.supportVideo);const trainerVideoButton=host.querySelector('[data-support-trainer-video]');if(trainerVideoButton)trainerVideoButton.onclick=e=>window.MathExamWelcome?.openVideo(e.currentTarget.dataset.supportTrainerVideo,'trainer');
 host.querySelectorAll('[data-support-basis]').forEach(b=>b.onclick=async()=>{if(!ctx.canLeave())return;b.disabled=true;try{await ctx.openContent(b.dataset.supportBasis,{returnTo:back?.id||attempt.id,topicId:group?.id||ctx.topicId});}finally{if(b.isConnected)b.disabled=false;}});}
return Object.freeze({geometryProofStages:Object.freeze(geometryProofStages),geometrySections,geometryJourney,geometryTrackGroups,geometryTracks,groups:Object.freeze(groups),groupFor,prerequisites,progress,returnAttempt,latestFor,mount,mountLesson,mountSupport});
});
