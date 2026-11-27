(function () {
  'use strict';
  if (window.MathExamRemediationManaged) return;
  const G = window.DivisionGuided;
  const route = window.PreOgeArithmetic;
  const parameters = new URLSearchParams(location.search);
  const inCourse = parameters.get('course') === 'preoge';
  let buildMultiples = parameters.get('multiples') === 'build';
  const $ = id => document.getElementById(id);
  const fractionPilot = parameters.get('practice') === 'fraction-zeros';
  const ratioPractice = parameters.get('practice') === 'ratio-division';
  const ratioStages = {
    oneDigit: { pair: ['72', '3'], question: 'Сколько троек поместится в 72? Назови две круглые границы и проверь их умножением на 3.', proof: '3 · 20 = 60, 3 · 30 = 90. Значит, частное больше 20 и меньше 30.' },
    zero: { pair: ['1005', '5'], question: 'Как решить, может ли частное быть двузначным, ещё до деления?', proof: '5 · 200 = 1000, 5 · 210 = 1050. Частное между 200 и 210. Проверь место для десятков в уголке.' },
    decimalNatural: { pair: ['7,2', '3'], question: '7,2 литра поровну разливают по трём банкам. Сколько литров в одной банке? Назови две целые границы.', proof: 'По 2 л в трёх банках дадут 6 л, по 3 л — 9 л. На одну банку приходится больше 2 и меньше 3 л.' },
    decimalDivisor: { pair: ['7,2', '0,3'], question: 'Есть 7,2 литра и стаканы по 0,3 литра. Хватит ли 10 стаканов? А 30? Обоснуй обе границы.', proof: 'В 10 стаканах 3 л, в 30 стаканах 9 л. Число стаканов между 10 и 30. Можно считать в десятых литра: тогда обе величины увеличивают своё числовое значение в 10 раз.' }
  };
  const KEY = ratioPractice ? 'mathExamBasics.ratioDivision.v1' :
    fractionPilot ? 'mathExamBasics.fractionZeros.v1' : 'mathExamBasics.guidedDivision.v1';
  const esc = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const topicIds = new Set(G.topics.map(t => t.id));
  const names = { start:'Первое неполное делимое', count:'Намечаем места для ответа', digit:'Находим цифру ответа', product:'Умножаем', subtract:'Вычитаем', 'remainder-check':'Проверяем остаток', bring:'Сносим одну цифру', partial:'Читаем новое неполное делимое', comma:'Ставим запятую', answer:'Читаем ответ', 'final-remainder':'Записываем остаток', verify:'Проверяем решение', 'shift-count':'Готовим делитель', 'shift-factor':'Меняем оба числа одинаково', 'shift-divisor':'Меняем делитель', 'shift-dividend':'Меняем делимое' };
  let state = {version:1, active:'start', serial:0, next:{}, sessions:{}, records:[]};
  let lastRaw = null, blocked = false, storageAvailable = true, helpOpen = false, revealOpen = false;
  let feedback = '', feedbackKind = '';
  let errorStep = '', stepErrors = 0;
  let decimalShift = null, decimalShiftKey = '', normalizationKey = '';
  let multiplicationRefresh = null;
  let contextualHelp = null, contextualHost = null;
  let multiplesHost = null, multiplesFeedback = '';
  const PUBLIC_ORIGIN = location.protocol === 'file:' ? 'https://mathexam.space' : '';
  const PATH = PUBLIC_ORIGIN + '/trainers/oge-basics/multiplication-division/division-path.html';
  function updateContextualHelp(s,a){
    if(!window.MathExamBasicsHelp)return;
    if(s.done||s.accepted){contextualHelp?.close();if(contextualHost)contextualHost.hidden=true;return;}
    contextualHelp=contextualHelp||window.MathExamBasicsHelp.create();
    if(!contextualHost){contextualHost=document.createElement('div');contextualHost.className='basics-help-host';$('prompt').after(contextualHost);}
    contextualHost.hidden=false;$('help-toggle').hidden=true;
    const content=$('help-content');content.hidden=false;
    if($('multiplication-refresh').parentElement!==content)content.append($('multiplication-refresh'));
    contextualHelp.update({host:contextualHost,identity:s.id+':'+s.step,contentId:'multiplication-division/long-division-from-simple-to-decimals',context:{prompt:a.prompt,kind:a.kind},rootContent:content,onUse:()=>{recordSupport(s,'hint');helpOpen=true;save();}});
  }

  function notice(text) { $('storage-notice').hidden = false; $('storage-notice').textContent = text; }
  function whole(value, max = 1000000) { return Number.isSafeInteger(value) && value >= 0 && value <= max; }
  function fingerprint(task) { return task.dividend + ':' + task.divisor; }
  function digitErrors(mistake) { return mistake ? mistake.high + mistake.low : 0; }
  function readDigitMistake(mistake, plan, lastStep) {
    if (!mistake || !whole(mistake.step, lastStep) || plan.actions[mistake.step]?.kind !== 'digit' ||
        !whole(mistake.high) || !whole(mistake.low) || !digitErrors(mistake) ||
        !whole(mistake.digit, 9) || G.check(String(mistake.digit), plan.actions[mistake.step])) throw Error('Неверная запись подбора цифры.');
    return {step:mistake.step, high:mistake.high, low:mistake.low, digit:mistake.digit};
  }
  const outcomes = ['first','corrected','hint','revealed'];
  function recordSupport(s, kind) {
    const field = kind === 'revealed' ? 'reveals' : 'hints';
    s[field] = Math.min(1000000, s[field] + 1);
    if (s.stepEvidence && s.stepEvidence[s.step] !== 'revealed') s.stepEvidence[s.step] = kind;
  }
  function restoreEvidence(source, target, lastStep) {
    if (source.stepEvidence === undefined) return;
    if (!source.stepEvidence || Array.isArray(source.stepEvidence) || typeof source.stepEvidence !== 'object' ||
        !Object.entries(source.stepEvidence).every(([i,v]) => /^(0|[1-9]\d*)$/.test(i) && Number(i)<=lastStep && outcomes.includes(v)))
      throw Error('Неверная запись помощи к шагу.');
    target.stepEvidence = {...source.stepEvidence};
  }
  function restoreEstimate(source, target) {
    const e=source.estimate;
    if (fractionPilot && e && typeof e.input==='string' && e.input.length<=30 &&
        ['wrong','correct','guided','guidedCorrect','editing'].includes(e.status)) {
      target.estimate={input:e.input, status:e.status, missedZero:!!e.missedZero, hint:!!e.hint, retried:!!e.retried};
    }
  }
  function resultText(r) {
    if (r.reveals) return 'с помощью готового ответа к шагу';
    if (r.hints) return 'с помощью подсказки';
    if (r.errors) return 'после своих исправлений без дополнительной подсказки';
    return r.repeated ? 'повтор знакомого примера без подсказок' : 'пошагово без ошибок и дополнительных подсказок, новое условие';
  }
  function tenthsReport(record) {
    if (!record.stepEvidence) return '';
    const plan=G.plan(record.task);
    const index=plan.actions.findIndex(a=>a.kind==='digit' && a.answer==='0' &&
      plan.cycles[a.cycle].sourceIndex === plan.intLen);
    const outcome=record.stepEvidence[index];
    if (!outcome || (record.answers && index>=record.answers.length)) return '';
    return 'Ноль в десятых: '+({first:'вписан с первой попытки', corrected:'исправлен самостоятельно',
      hint:'вписан после подсказки', revealed:'вписан после показа ответа'})[outcome]+'.';
  }
  function validate(raw) {
    if (!raw || raw.version !== 1 || !topicIds.has(raw.active) || !whole(raw.serial) || !raw.sessions || typeof raw.sessions !== 'object' || !raw.next || typeof raw.next !== 'object' || !Array.isArray(raw.records) || raw.records.length > 10000) throw Error('Неверная запись');
    const out = {version:1, active:raw.active, serial:raw.serial, next:{}, sessions:{}, records:[]};
    if (fractionPilot && raw.comparison && ['wrong','correct','corrected'].includes(raw.comparison)) out.comparison=raw.comparison;
    if (raw.digitSkill !== undefined) {
      const skill = raw.digitSkill;
      if (!skill || typeof skill.verified !== 'boolean' || !Array.isArray(skill.seen) || skill.seen.length > 440 ||
          !skill.seen.every(key => typeof key === 'string' && /^\d{1,2}:[2-9]$/.test(key)) ||
          new Set(skill.seen).size !== skill.seen.length || (skill.verified && !skill.seen.length)) throw Error('Неверная запись самостоятельной проверки.');
      out.digitSkill = {seen:[...skill.seen], verified:skill.verified};
    }
    for (const [id, seq] of Object.entries(raw.next)) {
      if (!topicIds.has(id) || !whole(seq)) throw Error('Неверная тема');
      out.next[id] = seq;
    }
    for (const [id, s] of Object.entries(raw.sessions)) {
      if (!topicIds.has(id) || !s || s.task?.topicId !== id || !whole(s.id) || !whole(s.step, 200) || !Array.isArray(s.answers) || typeof s.accepted !== 'boolean' || typeof s.done !== 'boolean' || typeof s.repeated !== 'boolean' || typeof s.draft !== 'string' || s.draft.length > 30 || !['errors','hints','reveals'].every(k => whole(s[k]))) throw Error('Неверный шаг');
      const p = G.plan(s.task);
      const count = s.step + (s.accepted ? 1 : 0);
      if (s.step >= p.actions.length || count !== s.answers.length || s.done !== (count === p.actions.length) || !s.answers.every((v, i) => typeof v === 'string' && G.check(v, p.actions[i]))) throw Error('Ответы не совпали');
      out.sessions[id] = {id:s.id, task:p.task, step:s.step, answers:[...s.answers], accepted:s.accepted, done:s.done, draft:s.draft, errors:s.errors, hints:s.hints, reveals:s.reveals, repeated:s.repeated};
      restoreEstimate(s, out.sessions[id]);
      restoreEvidence(s, out.sessions[id], s.step);
      if (s.digitMistake !== undefined) out.sessions[id].digitMistake = readDigitMistake(s.digitMistake, p, s.step);
      if (s.multiples !== undefined) {
        const m = s.multiples;
        if (!m || m.divisor !== p.normalizedDivisor || typeof m.open !== 'boolean' || !Array.isArray(m.values) || m.values.length !== 9 || !m.values.every(v => typeof v === 'string' && v.length <= 12) || !Array.isArray(m.checked) || m.checked.length !== 9 || !m.checked.every((v, i) => typeof v === 'boolean' && (!v || G.equal(m.values[i], String(m.divisor * (i + 1))))) || s.hints < 1) throw Error('Неверная запись кратных.');
        out.sessions[id].multiples = {divisor:m.divisor, open:m.open, values:[...m.values], checked:[...m.checked]};
      }

      // Older v1 sessions could pause after checking. Keep the earned answer
      // and resume at the next question without asking for another confirmation.
      if (s.accepted && !s.done) {
        out.sessions[id].step++;
        out.sessions[id].accepted = false;
        out.sessions[id].draft = '';
      }
    }
    const ids = new Set();
    for (const r of raw.records) {
      if (!r || !whole(r.id) || ids.has(r.id) || !topicIds.has(r.topic) || !Number.isFinite(r.at) || typeof r.repeated !== 'boolean' || !['errors','hints','reveals'].every(k => whole(r[k]))) throw Error('Неверный итог');
      const p = G.plan(r.task);
      if (p.topicId !== r.topic) throw Error('Неверный итог темы');
      ids.add(r.id);
      out.records.push({id:r.id, task:p.task, topic:r.topic, at:r.at, errors:r.errors, hints:r.hints, reveals:r.reveals, repeated:r.repeated});
      restoreEstimate(r, out.records.at(-1));
      restoreEvidence(r, out.records.at(-1), p.actions.length-1);
      if (r.digitMistake !== undefined) out.records.at(-1).digitMistake = readDigitMistake(r.digitMistake, p, p.actions.length - 1);
    }
    for (const s of Object.values(out.sessions)) {
      if (s.id > out.serial || (s.done && !ids.has(s.id))) throw Error('Незавершённый итог');
    }
    return out;
  }
  try {
    lastRaw = localStorage.getItem(KEY);
    if (lastRaw) state = validate(JSON.parse(lastRaw));
  } catch (e) {
    blocked = true;
    notice('Не удалось открыть сохранённую работу. Прежняя запись сохранена без изменений. Сейчас можно потренироваться и отправить снимок экрана учителю.');
  }
  function save() {
    if (blocked || !storageAvailable) return;
    try {
      if (localStorage.getItem(KEY) !== lastRaw) {
        blocked = true;
        notice('Работа изменилась в другой вкладке. Обнови эту страницу, чтобы продолжить с последнего сохранённого шага.');
        return;
      }
      const raw = JSON.stringify(state);
      localStorage.setItem(KEY, raw);
      lastRaw = raw;
    } catch (e) {
      storageAvailable = false;
      notice('Браузер не смог сохранить работу. Пока страницу не закрывай: реши пример и отправь учителю результат или снимок экрана.');
    }
  }
  function current() { return state.sessions[state.active]; }
  function newSession(id, repeat) {
    const old = state.sessions[id];
    let sequence = state.next[id] || 0;
    const tier = G.progress(state.records, id).tier;
    let task = repeat && old ? old.task : G.makeProgressive(id, sequence, tier);
    if (!repeat) {
      const seen = new Set(state.records.map(record => fingerprint(record.task)));
      // Prefer an unseen example. The finite beginner bank may eventually repeat.
      for (let tries = 0; tries < 80 && seen.has(fingerprint(task)) && sequence < 1000000; tries++) task = G.makeProgressive(id, ++sequence, tier);
      state.next[id] = Math.min(1000000, sequence + 1);
    }
    if (fractionPilot && id==='appendZeros' && !repeat) {
      const completed = state.records.filter(r=>r.topic===id && !r.repeated).length;
      const pair = [['3','40'],['2','25']][completed];
      if (pair) task = {topicId:id, level:id, dividend:pair[0], divisor:pair[1]};
    }
    if (ratioPractice && ratioStages[id] && !old && !repeat) {
      const [dividend, divisor] = ratioStages[id].pair;
      task = {topicId:id, level:id, dividend, divisor};
    }
    const repeated = state.records.some(r => fingerprint(r.task) === fingerprint(task));
    state.serial++;
    state.sessions[id] = {id:state.serial, task, step:0, answers:[], accepted:false, done:false, draft:'', errors:0, hints:0, reveals:0, repeated, stepEvidence:{}};
    feedback = ''; helpOpen = false; revealOpen = false; multiplesFeedback = '';
    if (buildMultiples) prepareMultiples();
    save();
  }
  function independent(record) { return !record.errors && !record.hints && !record.reveals && !record.repeated; }

  $('feedback').insertAdjacentHTML('afterend', '<button id="digit-practice" class="quiet" type="button" aria-haspopup="dialog" hidden>Потренировать подбор цифры</button>');
  $('report-copy').insertAdjacentHTML('beforebegin', '<p id="digit-check-status" class="small"></p><button id="digit-check" class="quiet" type="button" aria-haspopup="dialog">Проверить подбор цифры самостоятельно</button> ');
  $('results').insertAdjacentHTML('afterend', `
    <dialog id="digit-skill-panel" aria-labelledby="digit-skill-title">
      <h2 id="digit-skill-title"></h2>
      <p id="digit-skill-prompt"></p>
      <form id="digit-skill-form" novalidate>
        <label for="digit-skill-answer">Цифра частного</label>
        <input id="digit-skill-answer" type="text" inputmode="numeric" maxlength="1" autocomplete="off">
        <label for="digit-skill-remainder">Остаток после вычитания</label>
        <input id="digit-skill-remainder" type="text" inputmode="numeric" maxlength="2" autocomplete="off">
        <button class="primary" type="submit">Проверить</button>
      </form>
      <p id="digit-skill-result" role="status"></p>
      <button id="digit-skill-next" class="primary" type="button" hidden>Другой пример</button>
      <button id="digit-skill-close" class="quiet" type="button">Вернуться к примеру</button>
    </dialog>`);
  let digitExercise = null;
  function openDigitExercise(mode) {
    const plan = G.plan(current().task);
    const check = mode === 'check';
    const seen = new Set(state.digitSkill?.seen);
    for (const item of [...state.records, ...Object.values(state.sessions)]) seen.add(fingerprint(item.task));
    for (const cycle of plan.cycles) seen.add(cycle.partial + ':' + plan.normalizedDivisor);
    const candidates = [];
    for (let divisor = 2; divisor <= 9; divisor++) {
      for (let partial = divisor * 2; partial < divisor * 10; partial++) {
        if (!seen.has(partial + ':' + divisor)) candidates.push({dividend:String(partial), divisor:String(divisor), topicId:'quotientDigit', level:'remainder'});
      }
    }
    const preferredDivisor = check ? plan.normalizedDivisor + 1 : plan.normalizedDivisor;
    const hasRemainder = task => Number(task.dividend) % Number(task.divisor) !== 0;
    const task = candidates.find(task => Number(task.divisor) === preferredDivisor && hasRemainder(task)) ||
      candidates.find(hasRemainder) || candidates[0];
    const panel = $('digit-skill-panel'), form = $('digit-skill-form');
    $('digit-skill-title').textContent = check ? 'Самостоятельная проверка' : 'Подбор цифры частного';
    $('digit-skill-prompt').textContent = task ? 'Подбери цифру частного и запиши остаток для ' + task.dividend + ' : ' + task.divisor + '.' : '';
    $('digit-skill-result').textContent = task ? '' : 'Все новые примеры для подбора цифры уже использованы.';
    $('digit-skill-next').hidden = true;
    form.hidden = !task;
    if (task) {
      state.digitSkill ??= {seen:[], verified:false};
      state.digitSkill.seen.push(fingerprint(task));
      digitExercise = {mode, plan:G.plan(task)};
      panel.dataset.partial = task.dividend;
      panel.dataset.divisor = task.divisor;
      form.reset();
      save();
    } else digitExercise = null;
    if (!panel.open) panel.showModal();
    if (task) $('digit-skill-answer').focus();
  }
  $('digit-practice').onclick = () => openDigitExercise('practice');
  $('digit-check').onclick = () => openDigitExercise('check');
  $('digit-skill-close').onclick = () => $('digit-skill-panel').close();
  $('digit-skill-panel').addEventListener('close', () => { digitExercise = null; });
  $('digit-skill-next').onclick = () => openDigitExercise('check');
  $('digit-skill-form').addEventListener('submit', event => {
    event.preventDefault();
    if (!digitExercise || event.currentTarget.hidden) return;
    const {mode, plan} = digitExercise;
    const digit = $('digit-skill-answer').value.trim(), remainder = $('digit-skill-remainder').value.trim();
    const message = $('digit-skill-result');
    if (!/^\d$/.test(digit) || !/^\d{1,2}$/.test(remainder)) {
      message.textContent = 'Впиши одну цифру частного и неотрицательный остаток.';
      return;
    }
    const correct = G.check(digit, plan.actions[0]) && G.equal(remainder, String(plan.remainder));
    if (correct || mode === 'check') {
      event.currentTarget.hidden = true;
      $('digit-skill-next').hidden = correct;
      message.textContent = correct ? 'Верно. Произведение помещается, а остаток меньше делителя.' : 'Пока не получилось. Возьми другой пример для самостоятельной проверки.';
      if (correct && mode === 'check') {
        state.digitSkill.verified = true;
        save();
        render();
      }
      $(correct ? 'digit-skill-close' : 'digit-skill-next').focus();
    } else {
      const product = Number(digit) * plan.normalizedDivisor;
      const partial = plan.cycles[0].partial;
      message.textContent = product > partial ? 'Произведение больше делимого. Попробуй меньшую цифру.' :
        partial - product >= plan.normalizedDivisor ? 'В остатке помещается ещё один делитель. Попробуй большую цифру.' :
        'Цифра подходит. Вычти ' + product + ' из ' + partial + ' и проверь остаток.';
    }
  });

  // Like arifmetika.html's renderCorner: every digit keeps its own column.
  // Visual choices only fill the existing draft; checking remains deliberate.
  function selectedPrefix(p, s) {
    const a = p.actions[s.step];
    if (a.kind === 'start' && s.accepted) return a.sourceIndex;
    if (a.kind !== 'start') return p.actions.slice(0, s.step).some(b => b.kind === 'start') ? p.cycles[0].sourceIndex : -1;
    const draft = s.draft.trim();
    for (let i = 0; i < p.intLen; i++) if (p.digits.slice(0, i + 1).join('') === draft) return i;
    return -1;
  }
  function drawNotebookMarks() {
    const notebook = $('notebook'), svg = notebook.querySelector('.notebook-marks');
    if (!svg || notebook.parentElement.hidden) return;
    // Marks belong to the notebook, not the viewport. Reading client rects
    // around an SVG write can mix origins when scrolling/anchoring relayouts.
    // Measure the layout first, then write the SVG once all coordinates agree.
    const width = notebook.offsetWidth, height = notebook.offsetHeight;
    function localBox(element) {
      if (!element) return null;
      let left = 0, top = 0, node = element;
      while (node && node !== notebook) {
        left += node.offsetLeft; top += node.offsetTop; node = node.offsetParent;
      }
      if (node !== notebook) return null;
      return {left, top, right:left + element.offsetWidth, bottom:top + element.offsetHeight, width:element.offsetWidth};
    }
    const archEnd = Number(notebook.dataset.selectedEnd);
    let marks = '';
    if (Number.isInteger(archEnd) && archEnd >= 0) {
      const first = localBox(notebook.querySelector('[data-source-digit="0"]'));
      const last = localBox(notebook.querySelector('[data-source-digit="' + archEnd + '"]'));
      if (first && last) {
        const x1 = first.left + 3, x2 = last.right - 3, y = first.top - 4;
        marks += '<path class="first-arch" data-first-arch data-selected-end="' + archEnd + '" d="M ' + x1 + ' ' + y + ' Q ' + ((x1 + x2) / 2) + ' ' + (y - 22) + ' ' + x2 + ' ' + y + '"/>';
      }
    }
    const target = notebook.querySelector('[data-bring-target]');
    if (target) {
      const index = target.dataset.bringTarget;
      const source = notebook.querySelector('[data-source-digit="' + index + '"]');
      const from = localBox(source), to = localBox(target);
      if (from && to) {
        const x1 = from.left + from.width / 2, y1 = from.bottom + 2;
        const x2 = to.left + to.width / 2, y2 = to.top - 3;
        marks += '<defs><marker id="bring-arrowhead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z"/></marker></defs><path data-bring-arrow data-source-index="' + index + '" class="bring-arrow" pathLength="1" marker-end="url(#bring-arrowhead)" d="M ' + x1 + ' ' + y1 + ' L ' + x2 + ' ' + y2 + '"/>';
      }
    }
    svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    svg.innerHTML = marks;
  }
  function renderNotebook(p, s) {
    const completed = s.step + (s.accepted ? 1 : 0);
    const a = p.actions[s.step];
    const visible = p.actions[completed]?.visibleBaseStep ?? p.baseActions.length;
    if (p.micropractice) {
      $('notebook').innerHTML = '<div class="microproblem">' + esc(p.task.dividend) + ' : ' + esc(p.task.divisor) + (s.done ? ' → ' + esc(p.actions[0].answer) : '') + '</div>';
      $('notebook-note').textContent = 'Подбираем одну цифру. Полный уголок здесь не нужен.';
      $('normalization').hidden = true;
      $('decimal-note').hidden = true;
      return;
    }
    const preparing = visible < p.normalizationEnd;
    $('normalization').hidden = !p.normalizationEnd;
    if (p.normalizationEnd) {
      const shift = p.baseActions.findIndex(x => x.kind === 'shift-factor');
      const factorDone = visible > shift;
      const factor = factorDone ? p.baseActions[shift].answer : '?';
      const divisorDone = visible > p.baseActions.findIndex(x => x.kind === 'shift-divisor');
      const dividendDone = visible > p.baseActions.findIndex(x => x.kind === 'shift-dividend');
      const pair = (id, label, original, result, earned) => '<div class="normalization-row" data-normalization="' + id + '" data-earned="' + earned + '"><span class="normalization-label">' + label + '</span><div class="normalization-equation"><span class="original-number" data-original>' + esc(original) + '</span><span class="transform-arrow"><small data-factor data-earned="' + factorDone + '">× ' + esc(factor) + '</small><svg viewBox="0 0 100 14" aria-hidden="true"><path d="M2 7H94M87 1L95 7L87 13"/></svg></span><strong class="changed-number ' + (earned ? 'earned' : 'pending') + '" data-normalized aria-label="' + (earned ? 'Получилось ' + esc(result) : 'Пока не вычислено') + '">' + (earned ? esc(result) : '?') + '</strong></div></div>';
      $('normalization').innerHTML = '<p class="normalization-title">Умножаем оба числа на одно и то же число.</p><div class="normalization-pair">' + pair('dividend', 'Делимое', p.task.dividend, p.normalizedDividend, dividendDone) + pair('divisor', 'Делитель', p.task.divisor, p.normalizedDivisor, divisorDone) + '</div>';
    }
    $('notebook').parentElement.hidden = preparing;
    if (preparing) {
      $('notebook-note').textContent = 'Начнём уголок, когда одинаково изменим оба числа.';
      $('decimal-note').hidden = true;
      return;
    }
    let length = p.originalLength;
    for (const b of p.baseActions.slice(0, visible)) if (b.kind === 'bring') length = Math.max(length, b.sourceIndex + 1);
    const earnedLength = length;
    const bringing = !s.done && ['bring', 'partial'].includes(a.kind);
    if (bringing) length = Math.max(length, a.sourceIndex + 1);
    const hasComma = length > p.intLen;
    const columns = ['var(--cell)'];
    const digitColumn = [];
    for (let i = 0; i < length; i++) {
      if (hasComma && i === p.intLen) columns.push('calc(var(--cell) * .35)');
      digitColumn[i] = columns.length + 1;
      columns.push('var(--cell)');
    }
    const template = columns.join(' ');
    function row(text, end, cls, minus, targetIndex = -1, pendingIndex = -1) {
      const start = end - String(text).length + 1;
      let cells = '';
      const minusColumn = hasComma && start === p.intLen ? digitColumn[start] - 2 : digitColumn[start] - 1;
      if (minus) cells += '<span class="minus" style="grid-column:' + minusColumn + '">−</span>';
      for (let j = 0; j < String(text).length; j++) cells += '<span class="' + cls + '" ' + (start + j === targetIndex ? 'data-bring-target="' + targetIndex + '" ' : '') + 'style="grid-column:' + digitColumn[start + j] + '">' + esc(String(text)[j]) + '</span>';
      if (pendingIndex >= 0) cells += '<span class="pending-digit" data-bring-target="' + pendingIndex + '" aria-label="Место для снесённой цифры" style="grid-column:' + digitColumn[pendingIndex] + '"></span>';
      if (cls.includes('subtraction') && hasComma && start < p.intLen && end >= p.intLen) cells += '<span class="subtraction" style="grid-column:' + (digitColumn[p.intLen] - 1) + '"></span>';
      return '<div class="number-row" style="--columns:' + template + '">' + cells + '</div>';
    }
    const activeCycle = Number.isInteger(a.cycle) ? a.cycle : p.cycles.findIndex(c => c.sourceIndex === a.sourceIndex);
    const activeIndex = a.sourceIndex ?? p.cycles[activeCycle]?.sourceIndex;
    const firstEnd = p.cycles[0].sourceIndex;
    const chosenEnd = selectedPrefix(p, s);
    const choosing = !s.accepted && a.kind === 'start';
    let top = '';
    for (let i = 0; i < length; i++) {
      const inFirst = ['start','count'].includes(a.kind) && i <= chosenEnd;
      const bringSource = bringing && i === a.sourceIndex;
      const firstActive = activeCycle === 0 && a.kind !== 'start' && i <= firstEnd;
      const cls = !s.done && (inFirst || bringSource || firstActive) ? 'current' : '';
      if (hasComma && i === p.intLen) top += '<span class="dividend-comma" data-dividend-comma style="grid-column:' + (digitColumn[i] - 1) + '">,</span>';
      const attrs = ' data-source-digit="' + i + '"' + (i >= p.originalLength ? ' data-append-zero data-earned="' + (i < earnedLength) + '"' : '') + ' style="grid-column:' + digitColumn[i] + '"';
      if (choosing && i < p.intLen) top += '<button type="button" class="prefix-digit ' + cls + '" data-prefix-end="' + i + '" aria-label="Начать с числа ' + p.digits.slice(0, i + 1).join('') + '" aria-pressed="' + (i <= chosenEnd) + '"' + attrs + '>' + p.digits[i] + '</button>';
      else top += '<span class="' + cls + (i >= earnedLength ? ' pending-digit' : '') + '"' + attrs + '>' + (i < earnedLength ? p.digits[i] : '') + '</span>';
    }
    let rows = '<div class="number-row" style="--columns:' + template + '">' + top + '</div>';
    for (let i = 0; i < p.cycles.length; i++) {
      const c = p.cycles[i];
      if (visible <= c.productAction) break;
      rows += row(c.product, c.sourceIndex, 'subtraction', true);
      if (visible <= c.subtractAction) break;
      const next = p.cycles[i + 1];
      const bringIndex = next ? p.baseActions.findIndex(b => b.kind === 'bring' && b.sourceIndex === next.sourceIndex) : -1;
      const brought = next && visible > bringIndex;
      const pending = next && bringing && a.kind === 'bring' && !s.accepted && a.sourceIndex === next.sourceIndex;
      let value = String(c.remainder), end = c.sourceIndex;
      if (brought) {
        // Like the arithmetic suite, extend the remainder to the next partial
        // dividend without padding it with unfamiliar leading zeros (05, 00).
        value = String(next.partial); end = next.sourceIndex;
      }
      const isActive = !s.done && (brought ? activeIndex === next.sourceIndex || activeCycle === i + 1 : activeCycle === i);
      rows += row(value, end, isActive ? 'current' : '', false, bringing && brought && a.sourceIndex === next?.sourceIndex ? next.sourceIndex : -1, pending ? next.sourceIndex : -1);
    }
    let quotient = '';
    for (const b of p.baseActions.slice(0, visible)) {
      if (b.kind === 'digit') quotient += b.answer;
      if (b.kind === 'comma') quotient += ',';
    }
    const countDone = p.actions.slice(0, completed).some(b => b.kind === 'count');
    const digitsDone = quotient.split(',')[0].length;
    const slotCount = countDone ? Math.max(0, p.integerDigitCount - digitsDone) : 0;
    let slots = Array.from({length:slotCount}, (_, i) => '<span class="slot' + (i === 0 && a.kind === 'digit' && !s.accepted ? ' next-slot' : '') + '" data-quotient-slot aria-label="Место для цифры ответа">·</span>').join('');
    if (!slotCount && a.kind === 'digit' && !s.accepted && quotient.includes(',')) slots = '<span class="slot next-slot" data-quotient-slot aria-label="Место для следующей цифры ответа">·</span>';
    if (!quotient && !slots) slots = '<span class="slot uncounted" aria-label="Здесь будет ответ">?</span>';
    const writtenQuotient = esc(quotient).replace(',', '<span data-quotient-comma class="quotient-comma">,</span>');
    $('notebook').dataset.selectedEnd = String(chosenEnd);
    $('notebook').innerHTML = '<div class="working">' + rows + '</div><div class="right-side"><div class="divisor">' + p.normalizedDivisor + '</div><div class="quotient">' + writtenQuotient + slots + '</div></div><svg class="notebook-marks" aria-hidden="true"></svg>';
    $('notebook-note').textContent = s.done ? 'Все строки решения остаются перед тобой.' : a.kind === 'start' ? s.accepted ? 'Первое неполное делимое выбрано. Можно продолжать.' : chosenEnd < 0 ? 'Нажми на последнюю цифру числа, с которого начнёшь делить.' : 'Дуга показывает твой выбор. Теперь проверь его.' : a.kind === 'shift-dividend' && s.accepted ? 'Числа подготовлены. Теперь начнём деление уголком.' : a.kind === 'bring' ? 'По стрелке сносим одну цифру к остатку.' : a.kind === 'digit' && !s.accepted ? 'Новую цифру ответа запишем справа, на отмеченном месте.' : countDone && !quotient ? 'Точки справа — места для цифр ответа.' : 'Выделено число, с которым сейчас работаем.';
    const appended = earnedLength - p.originalLength;
    const commaAction = a.kind === 'comma';
    const appendAction = bringing && p.baseActions.some(b => b.kind === 'bring' && b.sourceIndex === a.sourceIndex && b.appended);
    $('decimal-note').hidden = !(commaAction || appendAction || appended > 0);
    let cue = commaAction ? '<p>Цифры целой части делимого закончились. Перед делением десятых поставим запятую в ответе.</p>' + (quotient.startsWith('0') ? '<p>Ноль перед запятой сохраняем.</p>' : '') : appendAction ? '<p>Справа после запятой можно дописать ноль. Число останется тем же.</p>' : '';
    if (appended > 0) {
      const original = p.normalizedDividend;
      const extended = original + (original.includes(',') ? '' : ',');
      cue += '<p class="decimal-equality" data-zero-equality>' + esc(original) + ' = ' + Array.from({length:appended}, (_, i) => esc(extended + '0'.repeat(i + 1))).join(' = ') + '</p>';
    }
    $('decimal-note').innerHTML = cue;
    requestAnimationFrame(drawNotebookMarks);
  }

  function prepareMultiples() {
    const s = current();
    if (s.done || s.multiples) return;
    s.multiples = {divisor:G.plan(s.task).normalizedDivisor, open:true, values:Array(9).fill(''), checked:Array(9).fill(false)};
    // A visible table is an explicit scaffold, even when filled by the pupil.
    // The existing route summaries already understand this assistance counter.
    recordSupport(s,'hint');
    save();
  }
  function renderMultiples(p, s) {
    if (!multiplesHost) {
      multiplesHost = document.createElement('details');
      multiplesHost.id = 'multiples-builder';
      multiplesHost.className = 'multiples-builder';
      $('notebook-note').after(multiplesHost);
      multiplesHost.addEventListener('toggle', () => {
        const m = current()?.multiples;
        if (m && m.open !== multiplesHost.open) { m.open = multiplesHost.open; save(); }
      });
      multiplesHost.addEventListener('input', event => {
        const input = event.target.closest('[data-multiple-input]'), m = current().multiples;
        if (!input || !m || m.checked[Number(input.dataset.multipleInput) - 1]) return;
        m.values[Number(input.dataset.multipleInput) - 1] = input.value.slice(0, 12);
        save();
      });
      multiplesHost.addEventListener('keydown', event => {
        if (event.key !== 'Enter' || !event.target.matches('[data-multiple-input]')) return;
        event.preventDefault(); checkMultiple(Number(event.target.dataset.multipleInput));
      });
      multiplesHost.addEventListener('click', event => {
        const check = event.target.closest('[data-multiple-check]');
        if (check) { checkMultiple(Number(check.dataset.multipleCheck)); return; }
        const reveal = event.target.closest('[data-multiple-reveal]');
        if (reveal) {
          const s = current(), m = s.multiples, index = m.checked.findIndex(v => !v);
          if (index < 0 || s.done) return;
          m.values[index] = String(m.divisor * (index + 1)); m.checked[index] = true;
          recordSupport(s,'revealed');
          multiplesFeedback = 'Показано: ' + m.divisor + ' × ' + (index + 1) + ' = ' + m.values[index] + '. Следующую строку попробуй заполнить сам.';
          save(); render();
        }
      });
    }
    const m = s.multiples;
    multiplesHost.hidden = !m || s.done;
    if (!m) return;
    const checked = m.checked.filter(Boolean).length;
    multiplesHost.open = m.open;
    multiplesHost.innerHTML = '<summary>Моя выкладка кратных: ' + checked + ' из 9</summary>' +
      '<p>Заполни произведения. Каждое следующее на ' + m.divisor + ' больше предыдущего. Для 0 × ' + m.divisor + ' результат — 0.</p>' +
      (p.task.level === 'decimalDivisor' ? '<p>После переноса запятой делитель станет ' + m.divisor + '. Выкладку составляем для него.</p>' : '') +
      '<div class="multiples-builder-grid">' + m.values.map((value, i) => '<div class="multiple-row' + (m.checked[i] ? ' is-checked' : '') + '"><label for="multiple-value-' + i + '">' + m.divisor + ' × ' + (i + 1) + '</label><input id="multiple-value-' + i + '" data-multiple-input="' + (i + 1) + '" inputmode="numeric" autocomplete="off" maxlength="12" aria-label="' + m.divisor + ' умножить на ' + (i + 1) + '" value="' + esc(value) + '"' + (m.checked[i] ? ' readonly' : '') + '><button type="button" class="quiet" data-multiple-check="' + (i + 1) + '" aria-label="Проверить ' + m.divisor + ' умножить на ' + (i + 1) + '"' + (m.checked[i] ? ' disabled' : '') + '>' + (m.checked[i] ? '✓' : 'Проверить') + '</button></div>').join('') + '</div>' +
      '<p class="multiple-feedback" role="status">' + esc(multiplesFeedback || (checked === 9 ? 'Выкладка готова. Найди наибольшее кратное, которое не больше текущего неполного делимого.' : 'Вводи результаты по одному и нажимай «Проверить» или Enter.')) + '</p>' +
      (checked < 9 ? '<button type="button" class="quiet" data-multiple-reveal>Показать одну незаполненную строку</button>' : '') +
      '<p class="small">Это тренировка с опорой. Для решения без таблицы открой новый пример в обычном режиме.</p>';
  }
  function checkMultiple(multiplier) {
    const s = current(), m = s.multiples, index = multiplier - 1;
    if (!m || s.done || !Number.isInteger(index) || index < 0 || index > 8 || m.checked[index]) return;
    const input = multiplesHost.querySelector('[data-multiple-input="' + multiplier + '"]');
    m.values[index] = input.value.slice(0, 12);
    const raw = m.values[index].trim();
    if (!raw) multiplesFeedback = 'Сначала впиши произведение.';
    else if (!/^\d+$/.test(raw) || !G.equal(raw, String(m.divisor * multiplier))) {
      s.errors = Math.min(1000000, s.errors + 1);
      multiplesFeedback = 'Проверь ' + m.divisor + ' × ' + multiplier + ': прибавь ' + m.divisor + ' к предыдущему кратному.';
    } else {
      m.checked[index] = true;
      const complete = m.checked.every(Boolean);
      multiplesFeedback = complete ? 'Все кратные проверены. Теперь используй выкладку при делении.' : 'Верно. Заполни следующее кратное.';
      if (complete) m.open = false;
    }
    save(); render();
    const next = m.checked.findIndex(v => !v);
    if (m.open && next >= 0) multiplesHost.querySelector('[data-multiple-input="' + (next + 1) + '"]')?.focus({preventScroll:true});
    else $('answer').focus({preventScroll:true});
  }
  function renderRatioEstimate(s) {
    const stage = ratioStages[s.task.topicId];
    let panel = $('ratio-estimate');
    const show = stage && s.task.dividend === stage.pair[0] && s.task.divisor === stage.pair[1];
    if (!show) {
      if (panel) panel.remove();
      return;
    }
    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'ratio-estimate'; panel.className = 'workspace';
      panel.innerHTML = '<h2>Коридор ответа</h2><p></p><details><summary>Сверить обоснование границ</summary><p></p></details>';
      $('problem').closest('section').before(panel);
    }
    if (panel.dataset.session !== String(s.id)) {
      panel.dataset.session = String(s.id);
      panel.querySelector('p').textContent = stage.pair.join(' : ') + '. ' + stage.question;
      panel.querySelector('details').open = false;
      panel.querySelector('details p').textContent = stage.proof;
    }
  }
  function renderLearningRoute(s) {
    let nav = $('division-learning-route');
    if (!nav) {
      nav = document.createElement('nav'); nav.id = 'division-learning-route';
      nav.className = 'division-learning-route'; nav.setAttribute('aria-label', 'Учимся делению');
      $('main').prepend(nav);
    }
    const back = document.createElement('a');
    back.href = PATH; back.textContent = '← Все ступени деления';
    const other = document.createElement('a');
    other.href = PATH + '#other-trainers'; other.textContent = 'Другие тренажёры деления';
    nav.replaceChildren(back, other);
    const training = G.progress(state.records, state.active);
    let recommendation = $('division-recommendation');
    if (!recommendation) {
      recommendation = document.createElement('p'); recommendation.id = 'division-recommendation';
      $('completion-text').after(recommendation);
    }
    const missing = Math.max(0, training.target - training.independent);
    recommendation.textContent = training.ready
      ? 'Есть 3 разных решения по шагам без подсказок. Можно перейти к следующей теме или ' + (['start','quotientDigit'].includes(state.active) ? 'продолжить тренировку на новых примерах.' : 'продолжить на более сложных числах.') + ' Самостоятельная проверка — в конце маршрута.'
      : 'Перед следующей темой реши ещё ' + missing + (missing === 1 ? ' новый пример' : ' новых примера') + ' по шагам без подсказок. Тему можно сменить в любой момент.';
    if (ratioPractice && ratioStages[state.active]) {
      recommendation.textContent = s.task.topicId === 'decimalDivisor'
        ? 'Теперь самостоятельно проверь похожий пример или вернись к задаче на пропорцию.'
        : 'Можно перейти к следующему шагу урока или решить ещё один пример на этот приём.';
    }
    if (s.multiples) recommendation.textContent += ' Этот пример выполнен с выкладкой кратных.';
    let unassisted = $('next-without-multiples');
    if (!unassisted) {
      unassisted = document.createElement('button'); unassisted.id = 'next-without-multiples';
      unassisted.type = 'button'; unassisted.className = 'quiet';
      unassisted.textContent = 'Новый пример без выкладки';
      $('next-example').after(unassisted);
      unassisted.onclick = () => {
        buildMultiples = false;
        const url = new URL(location.href); url.searchParams.delete('multiples');
        history.replaceState(null, '', url.pathname + url.search + url.hash);
        newSession(state.active, false); render(); moveFocus();
      };
    }
    unassisted.hidden = !s.multiples || !s.done;
    let checkpoint = $('division-checkpoint-link');
    if (!checkpoint) {
      checkpoint = document.createElement('a'); checkpoint.id = 'division-checkpoint-link';
      checkpoint.href = PUBLIC_ORIGIN + '/trainers/oge-basics/multiplication-division/division-checkpoint.html';
      checkpoint.textContent = 'Самостоятельная проверка всех видов деления →';
      const line = document.createElement('p'); line.append(checkpoint); $('completion').append(line);
    }
    checkpoint.parentElement.hidden = !s.done || state.active !== 'decimalDivisor';


  }

  function renderResults() {
    const total = state.records.length;
    const alone = state.records.filter(independent).length;
    const corrected = state.records.filter(r=>r.errors && !r.hints && !r.reveals).length;
    const assisted = state.records.filter(r=>r.hints || r.reveals).length;
    $('results-text').textContent = total ? 'Закончено примеров по шагам: ' + total + '. Новых, без ошибок и дополнительных подсказок: ' + alone + '. После своих исправлений без подсказок: ' + corrected + '. С подсказкой или показом ответа: ' + assisted + '. Повторов без ошибок и подсказок: ' + (total-alone-corrected-assisted) + '.' : 'Здесь появятся законченные примеры.';
  }
  function renderRouteLinks() {
    const level = route?.levelForGuided(state.active);
    const returnURL = level ? route.routeURL(level) : '../arithmetic-route.html';
    $('course-navigation').hidden = !inCourse;
    $('course-return').href = returnURL;
    $('course-return-completion').href = returnURL;
    $('course-return-completion').hidden = !inCourse;
    if (level) {
      $('arithmetic-link').href = route.practiceURL(level);
      $('arithmetic-link').textContent = 'Потренироваться в арифметике: ' + G.topics.find(t => t.id === state.active).title.toLowerCase();
    }
  }
  // The comma position is another way to enter the existing shift-count draft.
  // Moving it never accepts an answer or skips one of the four preparation steps.
  function renderDecimalShift(p, s) {
    const a = p.actions[s.step];
    const completed = s.step + Number(s.accepted);
    const preparing = (p.actions[completed]?.visibleBaseStep ?? p.baseActions.length) < p.normalizationEnd;
    const show = preparing && !!window.DecimalShift;
    $('decimal-shift').hidden = !show;
    $('normalization-record').hidden = !p.normalizationEnd;
    const recordKey = s.id + ':' + String(show);
    if (normalizationKey !== recordKey) {
      $('normalization-record').open = !show;
      normalizationKey = recordKey;
    }
    if (!show) {
      decimalShift?.destroy(); decimalShift = null; decimalShiftKey = '';
      return;
    }
    const countIndex = p.actions.findIndex(action => action.kind === 'shift-count');
    const raw = a.kind === 'shift-count' ? s.draft.trim() : s.answers[countIndex];
    const value = /^\d+$/.test(raw) && Number.isSafeInteger(Number(raw)) ? Number(raw) : 0;
    const locked = a.kind !== 'shift-count' || s.accepted;
    const key = s.id + ':' + fingerprint(s.task);
    if (key !== decimalShiftKey) {
      decimalShift?.destroy();
      decimalShift = window.DecimalShift.create($('decimal-shift'), {
        dividend:s.task.dividend, divisor:s.task.divisor, value, locked,
        onChange(k) {
          const active = current();
          if (active.id !== s.id || active.accepted || active.done || G.plan(active.task).actions[active.step].kind !== 'shift-count') return;
          active.draft = String(k);
          $('answer').value = active.draft;
          feedback = ''; feedbackKind = '';
          $('feedback').textContent = ''; $('feedback').className = '';
          save();
        }
      });
      decimalShiftKey = key;
    } else {
      decimalShift.setValue(value);
      decimalShift.setLocked(locked);
    }
  }
  function render() {
    const s = current(), p = G.plan(s.task), a = p.actions[s.step];
    const topic = G.topics.find(t => t.id === state.active);
    $('topic-label').textContent = topic.title;
    $('problem').textContent = s.task.dividend + ' : ' + s.task.divisor;
    $('step-counter').textContent = s.done ? 'Готово' : 'Шаг ' + (s.step + 1) + ' из ' + p.actions.length;
    const percent = Math.round(100 * (s.step + Number(s.accepted)) / p.actions.length);
    $('step-progress').style.width = percent + '%';
    $('step-progress').parentElement.setAttribute('aria-valuenow', String(percent));
    const training = G.progress(state.records, state.active);
    $('topic-progress').textContent = 'По шагам без подсказок: ' + training.independent + ' · ориентир — ' + training.target + (training.supported ? ' · с помощью или повторно: ' + training.supported : '') + (training.tier && !['start','quotientDigit'].includes(state.active) ? ' · практика сложнее: ступень ' + (training.tier + 1) + ' из 3' : '');
    $('question').parentElement.classList.toggle('lesson-complete', s.done);
    $('notebook').parentElement.hidden = false;
    renderDecimalShift(p, s);
    renderNotebook(p, s);
    renderMultiples(p, s);
    renderLearningRoute(s);
    $('question').hidden = s.done;
    $('completion').hidden = !s.done;
    $('step-name').textContent = names[a.kind];
    $('prompt').textContent = a.kind === 'shift-count' && decimalShift ? 'Цель — убрать запятую в делителе.' : a.kind === 'shift-factor' && decimalShift ? 'Во сколько раз увеличились оба числа?' : a.kind === 'shift-divisor' && decimalShift ? 'Запиши новый делитель.' : a.kind === 'shift-dividend' && decimalShift ? 'Запиши новое делимое.' : a.prompt;
    $('answer-note').textContent = a.kind === 'shift-count' && decimalShift ? 'Для этого сдвигаем запятые в обоих числах вправо на одинаковое число разрядов. Когда делитель записан без запятой, нажми «Проверить». После подготовки чисел будем делить уголком, как обычно.' : a.kind === 'shift-divisor' && decimalShift ? 'Найди строку «Делитель» и перепиши новое число — теперь оно без запятой.' : a.kind === 'shift-dividend' && decimalShift ? 'Найди строку «Делимое» и перепиши новое число. В нём запятая может остаться: нам нужно было убрать её в делителе.' : a.kind === 'comma' ? 'Перепиши целую часть ответа. Сразу после неё поставь запятую.' : a.kind === 'remainder-check' ? 'Выбери ответ, затем нажми «Проверить».' : a.kind === 'start' ? (s.task.level === 'decimalDivisor' ? 'В делителе запятой нет. Теперь делим уголком, как обычно. ' : '') + 'Выбери цифры слева в уголке или впиши число здесь.' : a.kind === 'count' ? 'На каждую цифру ответа наметим одно место.' : ['digit','bring'].includes(a.kind) ? 'Впиши одну цифру.' : 'Впиши число и нажми «Проверить».';
    $('answer-label').textContent = a.kind === 'shift-count' ? 'На сколько мест сдвинули запятые?' : 'Твой ответ';
    $('answer').value = s.draft;
    $('answer').readOnly = s.accepted;
    $('answer').hidden = !!a.options;
    $('answer-label').hidden = !!a.options;
    $('answer-options').hidden = !a.options;
    $('answer-options').innerHTML = a.options ? a.options.map(o => '<button type="button" data-option="' + esc(o.value) + '" aria-pressed="' + (s.draft === o.value) + '" ' + (s.accepted ? 'disabled' : '') + '>' + esc(o.label) + '</button>').join('') : '';
    $('primary').textContent = 'Проверить';
    const needsDigitPractice = !s.done && !s.accepted && s.digitMistake?.step === s.step && digitErrors(s.digitMistake) >= 2;
    const digitPrompt = needsDigitPractice ? digitHint(p, a, s.digitMistake.digit) : '';
    $('feedback').textContent = feedback || digitPrompt || (s.accepted ? a.kind.startsWith('shift-') ? 'Верно. Оба числа изменяются одинаково.' : 'Верно. Посмотри, что записалось в уголке.' : '');
    $('feedback').className = feedbackKind || (digitPrompt ? 'error' : s.accepted ? 'good' : '');
    $('digit-practice').hidden = !needsDigitPractice;
    $('digit-check-status').textContent = state.digitSkill?.verified ? 'Подбор цифры частного проверен самостоятельно.' : '';
    $('help-area').hidden = s.accepted;
    $('multiplication-refresh').hidden = !window.MultiplicationRefresh;
    $('help-toggle').setAttribute('aria-expanded', String(helpOpen));
    $('help-content').hidden = !helpOpen;
    $('hint-text').textContent = a.kind==='digit' && a.answer==='0' && p.cycles[a.cycle].sourceIndex===p.intLen
      ? 'У тебя '+p.cycles[a.cycle].partial+' десятых. Сколько раз '+p.normalizedDivisor+' помещается в это число?' : a.hint;
    $('multiples').hidden = a.kind !== 'digit' && a.kind !== 'product';
    if (s.multiples) $('multiples').hidden = true;
    if (!$('multiples').hidden) $('multiples').innerHTML = '<p class="table-note">Нажми на строку, чтобы подставить ' + (a.kind === 'digit' ? 'цифру' : 'произведение') + '. Затем проверь ответ.</p>' + Array.from({length:10}, (_, q) => '<button type="button" data-multiple="' + (a.kind === 'digit' ? q : p.normalizedDivisor * q) + '">' + p.normalizedDivisor + ' × <b>' + q + '</b> = ' + p.normalizedDivisor * q + '</button>').join('');
    $('revealed').textContent = revealOpen ? 'В этом шаге ответ: ' + a.answer + '. Впиши его и нажми «Проверить».' : '';
    if (s.done) {
      const answer = p.micropractice ? p.actions[0].answer : p.quotient + (s.task.level === 'remainder' ? ' (остаток ' + p.remainder + ')' : '');
      $('completion-text').textContent = (p.micropractice ? 'Подходящая цифра: ' : 'Ответ: ') + answer + '. ' + (independent(s) ? 'Получилось без ошибок и подсказок.' : s.repeated && !s.hints && !s.reveals && !s.errors ? 'Знакомый пример повторён.' : 'Пример пройден '+resultText(s)+'.');
    }
    const nextTopic = followingTopic();
    $('next-topic').hidden = !s.done || !nextTopic;
    if (nextTopic) $('next-topic').textContent = (state.sessions[nextTopic.id] && !state.sessions[nextTopic.id].done ? 'Продолжить тему: ' : 'Следующая тема: ') + nextTopic.title;
    $('save-note').textContent = blocked || !storageAvailable ? 'Можно закончить на сегодня. Отправь учителю результат или снимок экрана: сохранение сейчас недоступно.' : 'Можно закончить на сегодня. Результат сохранится в этом браузере.';
    renderFractionEstimate(s);
    if (ratioPractice) renderRatioEstimate(s);
    renderResults();
    renderRouteLinks();
    updateContextualHelp(s,a);
    document.dispatchEvent(new CustomEvent('mathexam:division-step', {detail:{kind:a.kind, done:s.done}}));
  }
  function renderFractionEstimate(s) {
    let box=$('fraction-estimate');
    if (!fractionPilot || s.step>0 || s.done || s.task.dividend!=='3' || s.task.divisor!=='40') {
      if (box) { box.hidden=true; $('problem').closest('section').hidden=false; }
      return;
    }
    if (!box) {
      box=document.createElement('section'); box.id='fraction-estimate'; box.className='workspace';
      box.innerHTML='<h2>Запиши 3/40 десятичной дробью</h2><form><label for="fraction-guess">Твоя запись</label> <input id="fraction-guess" inputmode="decimal" maxlength="30"> <button>Проверить дробь</button></form><p role="status"></p><button type="button" data-fraction-hint>Помочь с десятыми</button> <button type="button" data-fraction-write>Перейти к делению уголком</button>';
      $('problem').closest('section').before(box);
      const input=$('fraction-guess');
      input.oninput=()=>{
        const session=current(),e=session.estimate;
        session.estimate={...e,input:input.value,status:'editing'}; save();
      };
      box.querySelector('form').onsubmit=event=>{
        event.preventDefault();
        const session=current(), raw=input.value.trim().replace('.',',');
        if (!raw) { input.focus(); return; }
        const firstWrong=!session.estimate?.retried;
        const correct=G.equal(raw,G.plan(session.task).quotient);
        session.estimate={...session.estimate,input:input.value,status:correct?'correct':'wrong',
          retried:!!session.estimate?.retried || !correct,
          missedZero:!!session.estimate?.missedZero || (!correct && firstWrong && G.equal(raw,'0,75'))};
        if (!correct) session.errors=Math.min(1000000,session.errors+1);
        save(); renderFractionEstimate(session);
      };
      box.querySelector('[data-fraction-hint]').onclick=()=>{
        const session=current();session.estimate={...session.estimate,input:input.value,hint:true,status:session.estimate?.status || 'editing'};
        session.hints=Math.min(1000000,session.hints+1);save();renderFractionEstimate(session);input.focus();
      };
      box.querySelector('[data-fraction-write]').onclick=()=>{
        const session=current();
        session.estimate={...session.estimate,input:input.value,status:session.estimate?.status==='correct'?'guidedCorrect':'guided'};
        save();render();moveFocus();
      };
    }
    const e=s.estimate;
    const visible=!e || !['guided','guidedCorrect'].includes(e.status);
    box.hidden=!visible;
    $('problem').closest('section').hidden=visible;
    if (!visible) return;
    $('fraction-guess').value=e?.input || '';
    $('fraction-guess').readOnly=e?.status==='correct';
    const correct=e?.status==='correct';
    box.querySelector('form button').disabled=correct;
    box.querySelector('[data-fraction-hint]').hidden=correct;
    box.querySelector('[role="status"]').textContent=correct?'Верно. Теперь можно проверить запись делением уголком.'
      : e?.hint?'После запятой у тебя 30 десятых. Сколько раз 40 помещается в 30?'
      : e?.status==='wrong'?'Проверь запись. Можно исправить её или попросить один вопрос.':'';
  }
  function moveFocus() {
    const s = current(), a = G.plan(s.task).actions[s.step];
    const target = s.done ? $('next-example') : a.options ? $('answer-options').querySelector('button') : $('answer');
    target?.focus({preventScroll:true});
    const box = $('question').getBoundingClientRect();
    if (!s.done && (box.top < 0 || box.top > innerHeight - 220)) $('question').scrollIntoView({block:'start'});
  }
  function errorText(raw, p, a) {
    if (!raw.trim()) return a.options ? 'Сначала выбери «Да» или «Нет».' : 'Сначала впиши ответ.';
    if (a.kind === 'start') {
      const end = selectedPrefix(p, {...current(), draft:raw});
      if (end < 0) return 'Начинаем с первой цифры слева. Можно взять несколько цифр подряд: нажми на последнюю из них в уголке.';
      if (end < a.sourceIndex) return raw + ' меньше делителя ' + p.normalizedDivisor + '. Возьми ещё одну цифру справа.';
      return 'Здесь взято слишком много цифр. Попробуй взять меньше: нам нужно самое короткое число слева, с которого можно начать деление.';
    }
    if (a.kind === 'digit' && /^\d$/.test(raw)) {
      const c = p.cycles[a.cycle], q = Number(raw), value = q * p.normalizedDivisor;
      return value > c.partial ? q + ' — много: ' + p.normalizedDivisor + ' × ' + q + ' = ' + value + ', а у нас ' + c.partial + '. Попробуй меньшую цифру.' : q + ' — мало: после вычитания можно взять делитель ещё раз. Попробуй большую цифру.';
    }
    if (a.kind === 'remainder-check') return 'Осталось ' + a.remainder + ', а делитель — ' + a.divisor + '. ' + a.remainder + ' меньше ' + a.divisor + (a.remainder === 0 ? ': ноль тоже подходит.' : '. Значит, ещё целый делитель взять нельзя.');
    if (a.kind === 'shift-dividend') {
      const factor = p.baseActions.find(b => b.kind === 'shift-factor').answer;
      return G.equal(raw, p.task.dividend) ? 'Это прежнее делимое. Оба числа умножаем на ' + factor + '. Прочитай новое делимое после переноса запятой.' : 'Оба числа меняем одинаково. Умножь ' + p.task.dividend + ' на ' + factor + ': перенеси запятую вправо на столько же мест, как у делителя.';
    }
    if (a.kind === 'shift-divisor') return 'Меняем именно делитель ' + p.task.divisor + '. Перенеси его запятую вправо на выбранное число мест: в новом делителе запятой не останется.';
    if (a.kind === 'shift-count') {
      const chosen = Number(raw);
      if (!Number.isSafeInteger(chosen) || chosen < 0) return 'Укажи целое число мест. Можно передвинуть запятые мышью или кнопками.';
      if (Number.isSafeInteger(chosen) && chosen > Number(a.answer)) return 'Так частное тоже не меняется, но достаточно меньшего сдвига: только до конца дробной части делителя. Верни обе запятые немного влево.';
      return 'В делителе ' + p.task.divisor + ' ещё остаются цифры после запятой. Сдвинь обе запятые ещё вправо. Остановись сразу после последней цифры делителя.';
    }
    if (a.kind === 'shift-factor') return 'Вспомни перенос запятой: одно место вправо — умножить на 10, два — на 100, три — на 1000.';
    if (a.kind === 'comma') {
      const clean = raw.trim().replace('.', ',');
      if (a.answer === '0,' && (clean === ',' || !clean.startsWith('0'))) return 'Ответ меньше единицы. Перед запятой нужен ноль. Запиши «0,» — без цифр после запятой.';
      if (!clean.includes(',') && clean === a.answer.slice(0, -1)) return 'Целая часть записана. Добавь запятую сразу после её последней цифры: дальше будем делить десятые.';
      return 'Сначала перепиши целую часть ' + a.answer.slice(0, -1) + '. Запятая должна стоять сразу после неё, в самом конце записи.';
    }
    if (a.kind === 'subtract') {
      const c = p.cycles[a.cycle];
      return 'Вычитаем ' + c.product + ' из ' + c.partial + '. Проверь свой результат: если прибавить к нему ' + c.product + ', должно получиться ' + c.partial + '.';
    }
    if (a.kind === 'final-remainder') return 'Остаток — самое нижнее число после вычитания. Посмотри на него в уголке. Число справа под чертой — это частное.';
    if (a.kind === 'bring') return a.appended ? 'Дописываем именно ноль после запятой. Затем сносим эту одну цифру к остатку.' : 'Сносим только одну выделенную цифру из верхней строки. Остаток к ней пока не приписывай: это следующий шаг.';
    if (a.kind === 'partial') return 'Прочитай нижнее выделенное число целиком: остаток и снесённую цифру справа. Если в начале получился ноль, его не пишем.';
    if (a.kind === 'product') return 'Сейчас нужно произведение: ' + p.normalizedDivisor + ' × ' + p.cycles[a.cycle].qd + '. Найденная цифра ответа уже записана справа под чертой.';
    if (a.kind === 'count') return 'Считай места от последней цифры выбранного числа до конца целой части делимого. Каждое место даст одну цифру ответа.';
    if (a.kind === 'digit') return 'Для одного места в ответе нужна одна цифра: от 0 до 9.';
    return 'Пока не совпало. Попробуй ещё раз или нажми «Помочь с этим шагом».';
  }
  function digitHint(plan, action, digit) {
    const {partial} = plan.cycles[action.cycle], divisor = plan.normalizedDivisor;
    return digit * divisor > partial ? 'Помещается ли ' + divisor + ' × ' + digit + ' в ' + partial + '?' :
      'Хватит ли остатка после вычитания ' + divisor + ' × ' + digit + ' ещё на один делитель?';
  }
  $('answer-form').addEventListener('submit', event => {
    event.preventDefault();
    const s = current(); if (s.done) return;
    const p = G.plan(s.task), a = p.actions[s.step];
    const raw = a.options ? s.draft : $('answer').value.trim();
    s.draft = raw;
    if (!G.check(raw, a)) {
      const identity = s.id + ':' + s.step;
      if (identity !== errorStep) { errorStep = identity; stepErrors = 0; }
      if (raw) { s.errors = Math.min(1000000, s.errors + 1); stepErrors++; if (s.stepEvidence && !s.stepEvidence[s.step]) s.stepEvidence[s.step]='corrected'; }
      feedback = fractionPilot && a.kind==='digit' && a.answer==='0' && p.cycles[a.cycle].sourceIndex===p.intLen && raw
        ? 'Проверь цифру десятых. Можно исправить запись или открыть подсказку.' : errorText(raw, p, a);
      if (!p.micropractice && a.kind === 'digit' && /^\d$/.test(raw)) {
        if (s.digitMistake?.step !== s.step) s.digitMistake = {step:s.step, high:0, low:0, digit:Number(raw)};
        const mistake = s.digitMistake;
        const side = Number(raw) > Number(a.answer) ? 'high' : 'low';
        mistake[side] = Math.min(1000000, mistake[side] + 1);
        mistake.digit = Number(raw);
        if (digitErrors(mistake) === 2) recordSupport(s,'hint');
        if (digitErrors(mistake) >= 2) feedback = digitHint(p, a, mistake.digit);
      } else if (stepErrors >= 2) feedback += ' Если трудно, открой подсказку к этому шагу.';
      feedbackKind = 'error'; save(); render(); return;
    }
    if (s.stepEvidence && !s.stepEvidence[s.step]) s.stepEvidence[s.step]='first';
    s.answers.push(raw); s.accepted = true;
    feedback = 'Предыдущий шаг выполнен: ' + raw + '. Ответ записан.'; feedbackKind = 'good';
    helpOpen = false; revealOpen = false; errorStep = ''; stepErrors = 0;
    s.done = s.answers.length === p.actions.length;
    if (s.done && !state.records.some(r => r.id === s.id)) {
      const record = {id:s.id, task:s.task, topic:state.active, at:Date.now(), errors:s.errors, hints:s.hints, reveals:s.reveals, repeated:s.repeated};
      restoreEstimate(s, record);
      if (s.stepEvidence) record.stepEvidence={...s.stepEvidence};
      if (s.digitMistake) record.digitMistake = {...s.digitMistake};
      state.records.push(record);
    }
    if (!s.done) { s.step++; s.accepted = false; s.draft = ''; }
    save(); render(); moveFocus();
  });
  $('answer').addEventListener('input', () => {
    const s = current(); s.draft = $('answer').value;
    if (feedbackKind === 'good') { feedback = ''; feedbackKind = ''; $('feedback').textContent = ''; $('feedback').className = ''; }
    save();
    const p = G.plan(s.task);
    if (p.actions[s.step].kind === 'start') renderNotebook(p, s);
    if (p.actions[s.step].kind === 'shift-count') renderDecimalShift(p, s);
  });
  function fillDraft(value) {
    const s = current(); if (s.accepted || s.done) return;
    s.draft = String(value); feedback = ''; feedbackKind = ''; save(); render();
  }
  $('notebook').addEventListener('click', event => {
    const digit = event.target.closest('[data-prefix-end]');
    if (!digit) return;
    const s = current(), p = G.plan(s.task);
    if (p.actions[s.step].kind !== 'start' || s.accepted) return;
    const index = Number(digit.dataset.prefixEnd);
    fillDraft(p.digits.slice(0, index + 1).join(''));
    $('notebook').querySelector('[data-prefix-end="' + index + '"]')?.focus({preventScroll:true});
  });
  $('multiples').addEventListener('click', event => {
    const option = event.target.closest('[data-multiple]');
    if (!option) return;
    fillDraft(option.dataset.multiple);
    $('answer').focus({preventScroll:true});
  });
  $('answer-options').addEventListener('click', event => {
    const button = event.target.closest('button[data-option]');
    if (!button || current().accepted) return;
    current().draft = button.dataset.option; feedback = ''; feedbackKind = ''; save(); render();
    $('primary').focus({preventScroll:true});
  });
  $('multiplication-refresh').onclick = () => {
    if (!window.MultiplicationRefresh) return;
    if (!multiplicationRefresh) multiplicationRefresh = window.MultiplicationRefresh.create({onHelp() {
      const s = current();
      if (!s || s.done) return;
      recordSupport(s,'hint');
      save();
    }});
    const p = G.plan(current().task);
    multiplicationRefresh?.open(p.normalizedDivisor >= 2 && p.normalizedDivisor <= 9 ? p.normalizedDivisor : undefined);
  };
  $('help-toggle').onclick = () => {
    if (!helpOpen) recordSupport(current(),'hint');
    helpOpen = !helpOpen; save(); render();
  };
  $('reveal').onclick = () => {
    if (!revealOpen) recordSupport(current(),'revealed');
    revealOpen = true; save(); render();
  };
  function followingTopic() {
    const route = ratioPractice && ratioStages[state.active]
      ? Object.keys(ratioStages).map(id => G.topics.find(t => t.id === id))
      : G.topics.filter(t => !t.optional);
    const index = route.findIndex(t => t.id === state.active);
    return index >= 0 ? route[index + 1] : null;
  }
  function showTopics() {
    const groups = [{title:'Целые числа', ids:['start','oneDigit','zero','remainder','twoDigit']}, {title:'Десятичные дроби', ids:['decimalNatural','appendZeros','decimalDivisor']}, {title:'Короткая тренировка', ids:['quotientDigit']}];
    $('topics-list').innerHTML = groups.map(group => '<section class="topic-group"><h3>' + group.title + '</h3>' + group.ids.map(id => {
      const t = G.topics.find(item => item.id === id), session = state.sessions[id];
      const training = G.progress(state.records, id);
      const progress = ('По шагам без подсказок: ' + training.independent + ' из 3.' + (training.supported ? ' С опорой или повторно: ' + training.supported + '.' : '')) + (session && !session.done ? ' Начат пример — шаг ' + (session.step + 1) + ' из ' + G.plan(session.task).actions.length + '.' : '');
      return '<button type="button" data-topic="' + t.id + '" aria-current="' + (state.active === t.id) + '">' + esc(t.title) + '<small>' + esc(t.description) + '</small><small class="topic-progress" data-topic-progress="' + t.id + '">' + progress + '</small></button>';
    }).join('') + '</section>').join('');
    $('topics-dialog').showModal();
    $('topics-close').focus();
  }
  $('topics-open').onclick = showTopics;
  $('topics-close').onclick = () => $('topics-dialog').close();
  function activateTopic(id) {
    state.active = id;
    history.replaceState(null, '', location.pathname + location.search + '#' + state.active);
    if (!current()) newSession(state.active, false);
    else if (buildMultiples) prepareMultiples();
    helpOpen = false; revealOpen = false; feedback = ''; feedbackKind = '';
    save(); render(); $('topics-dialog').close(); $('problem').scrollIntoView({block:'start'});
  }
  $('topics-list').onclick = event => {
    const button = event.target.closest('button[data-topic]'); if (!button) return;
    activateTopic(button.dataset.topic);
  };
  $('next-topic').onclick = () => { const next = followingTopic(); if (next) activateTopic(next.id); };
  $('next-example').onclick = () => { newSession(state.active, false); render(); $('problem').scrollIntoView({block:'start'}); };
  $('repeat-example').onclick = () => { newSession(state.active, true); render(); $('problem').scrollIntoView({block:'start'}); };
  function digitReport(mistake) {
    const parts = [];
    if (mistake.high) parts.push('завышенная цифра ×' + mistake.high);
    if (mistake.low) parts.push('заниженная цифра ×' + mistake.low);
    if (digitErrors(mistake) >= 2) parts.push('показана подсказка');
    return 'Подбор цифры (шаг ' + (mistake.step + 1) + '): ' + parts.join(', ') + '.';
  }
  function report() {
    const lines = ['Деление уголком · MathExam', $('results-text').textContent];
    if (state.digitSkill?.verified) lines.push('Подбор цифры частного проверен самостоятельно на отдельном примере.');
    for (const r of state.records.slice(-12)) {
      lines.push(r.task.dividend + ' : ' + r.task.divisor + ' — ' + resultText(r) + (r.repeated && (r.errors || r.hints || r.reveals) ? ' (повтор)' : ''));
      if (r.estimate?.missedZero) {
        const e=r.estimate;
        lines.push('Первая запись — 0,75 вместо 0,075. '+(['correct','guidedCorrect'].includes(e.status) ?
          (e.hint?'Исправлено после вопроса о десятых.':'Исправлено самостоятельно.') : 'Продолжение в уголке.'));
      }
      const tenths=tenthsReport(r); if (tenths) lines.push(tenths);
      if (r.digitMistake) lines.push(digitReport(r.digitMistake));
    }
    const s = current();
    if (!s.done) {
      lines.push('Начато: ' + s.task.dividend + ' : ' + s.task.divisor + ', шаг ' + (s.step + 1) + '.');
      if (s.digitMistake) lines.push(digitReport(s.digitMistake));
    }
    if (fractionPilot && state.comparison) lines.push('Сравнение 3/40 и 0,08: '+({
      wrong:'пока требуется исправление',correct:'верно с первой попытки',corrected:'верно после исправления'
    })[state.comparison]+'.');
    return lines.join('\n');
  }
  $('report-copy').onclick = async () => {
    const text = report(); $('report-text').value = text; $('report-text').hidden = false;
    try {
      if (!navigator.clipboard?.writeText) throw Error('Нет буфера');
      await navigator.clipboard.writeText(text);
      $('report-status').textContent = 'Скопировано. Теперь вставь текст в сообщение учителю.';
    } catch (e) {
      $('report-status').textContent = 'Выдели текст ниже и скопируй его. Можно отправить снимок экрана.';
      $('report-text').focus(); $('report-text').select();
    }
  };
  document.addEventListener('mathexam:skill-support', event => {
    const s = current(); if (!s || s.done) return;
    recordSupport(s,'hint'); save();
    if (blocked || !storageAvailable) event.preventDefault();
  });
  window.addEventListener('storage', event => {
    if (event.key === KEY || event.key === null) { blocked = true; notice('Работа изменилась в другой вкладке. Обнови страницу, прежде чем продолжить.'); }
  });
  window.addEventListener('resize', () => requestAnimationFrame(drawNotebookMarks));
  window.addEventListener('hashchange', () => {
    const id = location.hash.slice(1);
    if (!topicIds.has(id) || id === state.active) return;
    state.active = id;
    if (!current()) newSession(id, false);
    else if (buildMultiples) prepareMultiples();
    helpOpen = false; revealOpen = false; feedback = ''; feedbackKind = '';
    save(); render();
  });
  // Open the fraction route in its own saved notebook, so an unfinished
  // ordinary division is still on its original row after returning.
  const pilotURL = new URL(location.href);
  pilotURL.searchParams.set('practice','fraction-zeros'); pilotURL.hash='appendZeros';
  if (!fractionPilot) {
    if (!ratioPractice) {
      const line = document.createElement('p'), link = document.createElement('a');
      const url = new URL(location.href);
      url.searchParams.set('practice', 'ratio-division'); url.hash = 'oneDigit';
      link.href = url.href; link.textContent = 'Отношения и деление: от целых чисел к десятичным';
      line.append(link); $('topics-list').after(line);
    }
    const link=document.createElement('a');
    link.href=pilotURL.href; link.textContent='Дробь в десятичную: ноль в десятых';
    const line=document.createElement('p'); line.append(link); $('topics-list').after(line);
  } else {
    const compare=document.createElement('details');
    compare.innerHTML='<summary>На следующем уроке · сравни дроби</summary><p>Какой знак поставить между 3/40 и 0,08?</p><div></div><p role="status"></p>';
    const feedback=compare.lastElementChild;
    const messages={wrong:'Попробуй ещё раз. Можно записать обе дроби в тысячных.',correct:'Верно: 75 тысячных меньше 80 тысячных.',corrected:'Исправлено: 75 тысячных меньше 80 тысячных.'};
    function renderComparison() {
      feedback.textContent=messages[state.comparison] || '';
      for (const button of compare.querySelectorAll('button')) button.disabled=['correct','corrected'].includes(state.comparison);
    }
    for (const sign of ['<','=','>']) {
      const button=document.createElement('button'); button.type='button'; button.textContent=sign;
      button.setAttribute('aria-label',({'<':'Меньше','=':'Равно','>':'Больше'})[sign]);
      button.onclick=()=>{state.comparison=sign==='<'?(state.comparison==='wrong'?'corrected':'correct'):'wrong'; save(); renderComparison();};
      compare.querySelector('div').append(button);
    }
    compare.id='fraction-review'; compare.open=parameters.get('review')==='1';
    $('problem').closest('section').before(compare); renderComparison();
    if (compare.open) compare.querySelector('summary').focus();
  }
  const requested = location.hash.slice(1) || (fractionPilot ? 'appendZeros' : ratioPractice ? 'oneDigit' : '');
  if (topicIds.has(requested)) state.active = requested;
  if (!current()) newSession(state.active, false);
  else { if (buildMultiples) prepareMultiples(); save(); }
  window.addEventListener('mathexam-basics-help-ready',()=>render());
  render();
  const requestedSkill = parameters.get('digit-skill');
  if (requestedSkill === 'practice' || requestedSkill === 'check') {
    parameters.delete('digit-skill');
    const query = parameters.toString();
    history.replaceState(null, '', location.pathname + (query ? '?' + query : '') + location.hash);
    openDigitExercise(requestedSkill);
  }
  window.__divisionGuidedDebug = {KEY, state:() => structuredClone(state), plan:() => G.plan(current().task)};
})();
