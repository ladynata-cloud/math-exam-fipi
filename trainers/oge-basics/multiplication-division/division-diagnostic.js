/* An independent browser-tab check. It never reads or writes course attempts. */
(function () {
'use strict';
const C = window.DivisionDiagnostic, host = document.getElementById('diagnostic');
if (!C || !host) return;
const KEY = 'mathExam.divisionDiagnostic.tab.v1';
const E = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const params = new URLSearchParams(location.search);
const afterPractice = params.get('afterPractice') === '1';
const initialVariant = afterPractice && params.get('variant') === '1' ? 1 : 0;
const cabinet = params.get('from') === 'cabinet';
const courseURL = cabinet ? 'https://mathexam-board-ladynata.msk1.amvera.tech/learning/#division-course' : 'division-course.html';
const backLabel = cabinet ? 'Вернуться в кабинет' : 'К четырём линейкам';
document.getElementById('course-return').href = courseURL;
document.getElementById('course-return').textContent = '← ' + backLabel;
let state = fresh(initialVariant), model, queue, storageOK = true;
function fresh(variant = 0) { return {version:1, variant, screen:'intro', records:[], accepted:false, draft:'', selection:0}; }
function rebuild() {
  model = C.build(state.variant); queue = [...model.questions];
  if (state.records.length >= model.questions.length) {
    const uncertain = new Set(state.records.slice(0, model.questions.length).filter(r => !r.correct).map(r => r.skill));
    for (const skill of C.SKILL_ORDER) if (uncertain.has(skill)) queue.push(C.confirmation(skill, state.variant));
  }
}
function save() {
  if (!storageOK) return;
  try { sessionStorage.setItem(KEY, JSON.stringify(state)); }
  catch (_) { storageOK = false; document.getElementById('save-note').textContent = 'Сохранение в этой вкладке недоступно. Пройди проверку, не обновляя страницу.'; }
}
function restore() {
  try {
    const raw = sessionStorage.getItem(KEY); if (!raw) return;
    const saved = JSON.parse(raw);
    if (!saved || saved.version !== 1 || ![0,1].includes(saved.variant) || !['intro','test','report'].includes(saved.screen) || !Array.isArray(saved.records) || saved.records.length > 40 || typeof saved.accepted !== 'boolean' || typeof saved.draft !== 'string' || saved.draft.length > 8 || !Number.isInteger(saved.selection) || saved.selection < 0 || saved.selection > 3) throw Error('format');
    state = fresh(saved.variant); rebuild();
    for (const r of saved.records) {
      const q = queue[state.records.length];
      if (!q || r.id !== q.id || typeof r.value !== 'string' || r.value.length > 8 || typeof r.skipped !== 'boolean') throw Error('record');
      state.records.push({id:q.id, skill:q.skill, phase:q.phase, value:r.value, skipped:r.skipped, correct:!r.skipped && C.isCorrect(q,r.value)});
      rebuild();
    }
    if (saved.accepted && !state.records.length || saved.screen === 'intro' && state.records.length) throw Error('screen');
    state.screen = saved.screen; state.accepted = saved.accepted; state.draft = saved.draft; state.selection = saved.selection;
    if (state.screen === 'test' && state.records.length === queue.length && !state.accepted) state.screen = 'report';
  } catch (_) {
    state = fresh(initialVariant); storageOK = false;
    document.getElementById('save-note').textContent = 'Запись этой проверки прочитать не удалось или сохранение недоступно. Новая проверка будет без сохранения: не обновляй вкладку. Прогресс курса хранится отдельно.';
  }
}
function current() { return queue[state.records.length - (state.accepted ? 1 : 0)]; }
function notebook(p, visible, q = null) {
  const digits = p.digits, n = digits.length, a = q && Number.isInteger(q.actionIndex) ? p.actions[q.actionIndex] : null;
  const selecting = q?.kind === 'selection';
  const selected = selecting ? (state.accepted ? Number(q.answer) : state.selection) : 0;
  const row = (value, end, sub = false) => {
    const chars = String(value), start = end - chars.length + 1;
    let cells = sub ? '<span style="grid-column:' + (start + 1) + '">−</span>' : '';
    [...chars].forEach((d,i) => {cells += '<span class="' + (sub ? 'sub' : '') + '" style="grid-column:' + (start+i+2) + '">' + E(d) + '</span>';});
    return '<div class="numrow">' + cells + '</div>';
  };
  let top = '';
  digits.forEach((d,i) => {top += '<span class="' + (i < selected ? 'selected' : '') + '" style="grid-column:' + (i+2) + '">' + d + '</span>';});
  let rows = '<div class="numrow">' + top + '</div>';
  for (let i=0;i<p.cycles.length;i++) {
    const c = p.cycles[i];
    if (visible <= c.productAction) break;
    rows += row(c.product,c.sourceIndex,true);
    if (visible <= c.subtractAction) break;
    const next = p.cycles[i+1];
    const partialIndex = next ? p.actions.findIndex(x => x.kind === 'partial' && x.sourceIndex === next.sourceIndex) : -1;
    const brought = next && partialIndex < visible;
    rows += row(brought ? next.partial : c.remainder, brought ? next.sourceIndex : c.sourceIndex);
    if (next && a?.kind === 'partial' && a.sourceIndex === next.sourceIndex && !state.accepted) {
      rows += '<div class="numrow"><span class="arrow" style="grid-column:' + (next.sourceIndex+2) + '" aria-label="Сносим цифру ' + digits[next.sourceIndex] + '">↓</span></div>';
    }
  }
  const quotient = p.actions.slice(0,visible).filter(x=>x.kind==='digit').map(x=>x.answer).join('');
  return '<div class="notebook-wrap"><div class="notebook" style="--cols:' + (n+1) + '" aria-label="Деление ' + p.task.dividend + ' на ' + p.task.divisor + '"><div class="work">' + rows + '</div><div class="rightside"><div class="divisor">' + p.normalizedDivisor + '</div><div class="quotient">' + E(quotient) + (a?.kind==='digit' && !state.accepted ? '<span class="pending">?</span>' : quotient ? '' : '<span class="pending">?</span>') + '</div></div></div>' + (selecting ? '<p class="notebook-note">Стрелками выбери, сколько цифр взять слева.</p>' : '') + '</div>';
}
function selectionNotebook(q) {
  const p = {digits:[...q.selectionDigits].map(Number),task:{dividend:q.selectionDigits,divisor:q.selectionDivisor},cycles:[],actions:[],normalizedDivisor:q.selectionDivisor};
  return notebook(p,0,q);
}
function history(q) {
  return model.tasks.map((p,i) => {
    const questions = model.questions.filter(x=>x.taskIndex===i);
    const finished = questions.every(x=>state.records.some(r=>r.id===x.id));
    if (!finished || q?.taskIndex===i) return '';
    return '<details><summary>Решение ' + p.task.dividend + ' : ' + p.task.divisor + '</summary>' + notebook(p,p.actions.length) + '</details>';
  }).join('');
}
function practiceURL(meta) {
  const url = new URL(meta.url, 'https://mathexam.space');
  if (url.pathname.endsWith('/arithmetic-foundations.html')) {
    url.searchParams.set('diagnosticVariant', state.variant);
    if (cabinet) url.searchParams.set('from', 'cabinet');
  }
  return url.href;
}
function renderIntro() {
  host.innerHTML = '<section class="card intro"><p class="eyebrow">' + (afterPractice?'ПОСЛЕ ПРАКТИКИ':'ПЕРЕД ТРЕНИРОВКОЙ') + '</p><h1>' + (afterPractice?'Что теперь получается лучше?':'С чего мне начать?') + '</h1><p>Попробуй деление уголком. Посмотрим, какие шаги получаются, а что стоит повторить.</p><ul><li>Два деления и три коротких примера.</li><li>Один вопрос за раз. Без отметок и таймера.</li><li>Если трудно — нажми «Пока не знаю».</li></ul><p>После ошибки продолжим с правильного числа. В конце уточним трудные шаги на других числах.</p><div class="actions"><button class="primary" data-do="start">Начать проверку →</button><a class="button quiet" href="' + E(courseURL) + '">Сразу к тренировке</a></div></section>';
}
function renderTest(focus = false) {
  const q = current(); if (!q) { state.screen='report'; save(); renderReport(); return; }
  const answered = state.records.length, base = model.questions.length;
  const section = q.phase==='confirmation' ? 'Уточним трудный шаг' : Number.isInteger(q.taskIndex) ? 'Деление ' + (q.taskIndex+1) + ' из 2' : 'Короткая проверка вычислений';
  let paper = '';
  if (Number.isInteger(q.taskIndex)) paper = notebook(model.tasks[q.taskIndex],q.actionIndex+(state.accepted?1:0),q);
  else if (q.kind==='selection') paper = selectionNotebook(q);
  let controls = q.kind==='selection' ? '<div class="selection" aria-label="Выбор количества первых цифр"><button type="button" data-do="less" aria-label="Взять на одну цифру меньше"' + (state.selection<=1?' disabled':'') + '>←</button><output aria-live="polite">' + (state.selection ? state.selection + (state.selection===1?' цифра':' цифры') : 'Выбери') + '</output><button type="button" data-do="more" aria-label="Взять на одну цифру больше"' + (state.selection>=q.selectionDigits.length?' disabled':'') + '>→</button></div>' : '<label class="answer-label" for="answer">Твой ответ</label><input id="answer" inputmode="numeric" pattern="[0-9]*" autocomplete="off" maxlength="8" value="' + E(state.draft) + '">';
  if (state.accepted) controls = '';
  const r = state.accepted ? state.records.at(-1) : null;
  const answerText = q.kind==='selection' ? q.selectionDigits.slice(0,Number(q.answer)) + ' — первые ' + q.answer + (Number(q.answer)===1?' цифра':' цифры') : q.answer;
  const feedback = r ? '<section class="feedback' + (r.correct?' correct':'') + '" role="status"><p>' + (r.correct ? 'Получилось.' : r.skipped ? 'Этот шаг пока пропустили.' : 'Здесь получилось иначе.') + (r.correct ? '' : ' Для продолжения берём: <strong>' + E(answerText) + '</strong>.') + '</p><div class="actions"><button class="primary" data-do="next">' + (answered===queue.length?'Посмотреть мой маршрут':'Продолжить →') + '</button></div></section>' : '';
  host.innerHTML = '<section class="card"><div class="step-meta"><span>' + section + '</span><span>' + (q.phase==='confirmation' ? 'Уточнение ' + (answered-base+(state.accepted?0:1)) + ' из ' + (queue.length-base) : 'Шаг ' + (answered+(state.accepted?0:1)) + ' из ' + base) + '</span></div><progress max="' + queue.length + '" value="' + answered + '" aria-label="Пройдено шагов"></progress><div class="' + (paper?'workspace':'') + '">' + paper + '<div class="question"><h1 style="font-size:26px" tabindex="-1" id="question-title">' + E(q.prompt) + '</h1><form id="answer-form">' + controls + (!state.accepted?'<div class="actions"><button class="primary" type="submit">Готово</button><button type="button" class="quiet" data-do="skip">Пока не знаю</button></div><p id="input-error" class="error" role="alert" hidden></p>':'') + '</form></div></div>' + feedback + '</section><div class="exit-row"><button class="quiet" data-do="finish">Показать, что уже проверили</button></div>' + history(q);
  if (focus) host.querySelector(state.accepted?'[data-do="next"]':'#question-title')?.focus();
}
function suggested(report) {
  return report.filter(r=>['focus','uncertain'].includes(r.status)).sort((a,b)=>(a.status==='focus'?0:1)-(b.status==='focus'?0:1)||a.priority-b.priority);
}
function reportPlain(report) {
  return ['Проверка деления уголком', state.records.length<queue.length?'Проверка пройдена частично.':'Проверка завершена.', ...report.map(r=>r.title+': '+r.statusTitle+'. Самостоятельно '+r.counts.correct+' из '+r.counts.total+'.'), '', 'Первые шаги:', ...suggested(report).slice(0,3).map((r,i)=>(i+1)+'. '+r.recommendation.title+' — '+practiceURL(r.recommendation)),'','Результат относится только к проверенным примерам. Десятичные дроби и все случаи деления ещё не проверялись.'].join('\n');
}
function renderReport() {
  const report = C.report(state.records), recommendations = suggested(report), partial = state.records.length < queue.length;
  let start;
  if (recommendations.length) {
    const first = recommendations[0];
    start = '<p class="eyebrow">ПЕРВЫЙ ШАГ</p><h2>' + E(first.recommendation.title) + '</h2><p>' + E(first.status==='focus'?'Трудность повторилась в разных заданиях. Начни с этого упражнения.':'Здесь была ошибка или пропуск. Пока это ориентир: начни с короткого повторения.') + '</p><a class="button primary" href="' + E(practiceURL(first.recommendation)) + '" target="_blank" rel="noopener">Начать отсюда →</a>';
  } else if (partial) {
    start = '<h2>Нужно проверить остальные шаги</h2><p>В выполненных заданиях ошибок нет. Этого пока недостаточно, чтобы выбрать весь маршрут.</p><button class="primary" data-do="resume">Продолжить проверку →</button>';
  } else {
    start = '<h2>Можно начать с самостоятельного деления</h2><p>Проверенные задания получились. Попробуй новые примеры без подсказок.</p><a class="button primary" href="https://mathexam.space/trainers/oge-basics/multiplication-division/course-simple-check.html" target="_blank" rel="noopener">Решить новые примеры →</a>';
  }
  const next = recommendations.slice(1,3).map(r=>'<article class="recommendation"><h3>' + E(r.recommendation.title) + '</h3><p>' + E(r.statusTitle) + '</p><a href="' + E(practiceURL(r.recommendation)) + '" target="_blank" rel="noopener">Открыть упражнение →</a></article>').join('');
  host.innerHTML = '<section class="card"><p class="eyebrow">ТВОЙ МАРШРУТ</p><h1 tabindex="-1">Вот с чего можно начать</h1><p>' + (partial?'Это промежуточный результат. Проверены не все шаги.':'Проверка завершена. Рекомендации относятся только к этим заданиям.') + '</p><p class="small">Десятичные дроби, округление и другие случаи деления здесь ещё не проверялись.</p></section><section class="card start-here">' + start + '</section>' + (next?'<section class="card"><h2>Затем можно повторить</h2>'+next+'</section>':'') + '<section class="card"><h2>Что показали ответы</h2><ul class="result-list">' + report.map(r=>'<li><span class="status ' + E(r.status) + '">' + E(r.statusTitle) + '</span><h3>' + E(r.title) + '</h3><p>' + (r.counts.total?'Самостоятельно: '+r.counts.correct+' из '+r.counts.total+'.'+(r.counts.skipped?' Пропущено: '+r.counts.skipped+'.':''):'Заданий по этому навыку ещё нет.') + '</p>' + r.observations.map(t=>'<p class="small">'+E(t)+'</p>').join('') + '</li>').join('') + '</ul><details><summary>Текст результата для преподавателя</summary><textarea class="report-text" aria-label="Текст результата" readonly>' + E(reportPlain(report)) + '</textarea></details><div class="actions"><a class="button primary" href="' + E(courseURL) + '">' + backLabel + ' →</a>' + (partial&&recommendations.length?'<button data-do="resume">Закончить проверку</button>':'') + '<button class="quiet" data-do="restart">Я потренировался — проверить ещё раз</button></div><p class="small" style="margin-top:20px">Сначала потренируй трудные шаги: реши несколько новых примеров самостоятельно. Затем вернись сюда и пройди проверку ещё раз на другом наборе чисел. До нажатия кнопки этот результат остаётся на месте. Прогресс учебных ветвей не меняется.</p></section>' + history(null);
}
function render(focus = false) {
  rebuild();
  if (state.screen==='intro') renderIntro(); else if (state.screen==='test') renderTest(focus); else { renderReport(); if (focus) host.querySelector('h1')?.focus(); }
}
function submit(skipped = false) {
  if (state.accepted || state.screen!=='test') return;
  const q=current(), value=q.kind==='selection'?String(state.selection||''):state.draft.trim();
  if (!skipped && (!value || !/^(0|[1-9]\d*)$/.test(value))) {
    const error=document.getElementById('input-error'); error.hidden=false; error.textContent=q.kind==='selection'?'Сначала выбери цифры стрелками.':'Запиши целое число или нажми «Пока не знаю».';return;
  }
  state.records.push({id:q.id,skill:q.skill,phase:q.phase,value:skipped?'':value,skipped,correct:!skipped&&C.isCorrect(q,value)});
  state.accepted=true;rebuild();save();render(true);
}
host.addEventListener('submit',e=>{e.preventDefault();submit();});
host.addEventListener('input',e=>{if(e.target.id==='answer'){state.draft=e.target.value.slice(0,8);save();}});
host.addEventListener('click',e=>{
  const action=e.target.closest('[data-do]')?.dataset.do;if(!action)return;
  if(action==='start'){state.screen='test';save();render(true);}
  if(action==='less'||action==='more'){
    if(state.accepted)return;const q=current();
    state.selection=Math.min(q.selectionDigits.length,Math.max(1,state.selection+(action==='more'?1:-1)));save();render();
    (host.querySelector('[data-do="'+action+'"]:not(:disabled)') || host.querySelector('.selection button:not(:disabled)'))?.focus();
  }
  if(action==='skip')submit(true);
  if(action==='next'){state.accepted=false;state.draft='';state.selection=0;state.screen=state.records.length===queue.length?'report':'test';save();render(true);}
  if(action==='finish'){state.screen='report';state.accepted=false;save();render(true);}
  if(action==='resume'){state.screen='test';state.accepted=false;state.draft='';state.selection=0;save();render(true);}
  if(action==='restart'){state=fresh((state.variant+1)%2);save();render();}
});
host.addEventListener('keydown',e=>{
  if(state.screen!=='test'||state.accepted||current()?.kind!=='selection'||!['ArrowLeft','ArrowRight'].includes(e.key))return;
  e.preventDefault();host.querySelector('[data-do="'+(e.key==='ArrowRight'?'more':'less')+'"]:not(:disabled)')?.click();
});
restore();render();
})();
