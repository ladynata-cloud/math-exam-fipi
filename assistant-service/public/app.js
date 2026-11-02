'use strict';
import { appendGeometryFigure } from './geometry-figure.js';
import { installVisualLabs } from './visual-labs.js';
import { installStudyTools } from './study-ui.js';
import { topicHelp, practiceFor, visualFor } from './learning-aids.js';

(() => {
  fetch('/api/version', { credentials: 'omit', cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(version => {
    if (!version || !/^[a-f0-9]{40}$/.test(version.sourceCommit || '')) return;
    document.getElementById('release-label').textContent = `Версия ${version.sourceCommit.slice(0, 7)} · Что нового`;
    for (const text of (version.changes || []).slice(0, 10)) {
      if (typeof text !== 'string') continue;
      const item = document.createElement('li'); item.textContent = text.slice(0, 200); document.getElementById('release-changes').append(item);
    }
    document.getElementById('release-info').hidden = false;
  }).catch(() => {});
  const $ = (id) => document.getElementById(id);
  const elements = Object.fromEntries([
    'mode-badge', 'mode-description', 'page-message', 'access-panel', 'access-form',
    'access-description', 'pilot-key-field', 'pilot-key', 'access-button', 'workspace',
    'question-form', 'topic', 'sample-button', 'question', 'attempt', 'external-choice',
    'external-consent', 'external-consent-label', 'ask-button', 'empty-state',
    'answer-list', 'answer-actions', 'next-button', 'explain-button', 'answer-message',
    'forget-button', 'answer-title', 'task-help', 'topic-help',
  ].map((id) => [id, $(id)]));
  const state = {
    csrf: '', status: null, topics: [], busy: false, level: 0,
    signature: '', complete: false, generation: 0, activeRequest: null,
  };

  const labs = installVisualLabs(document.querySelector('.task-panel'));
  const study = installStudyTools({ elements, node, busy: () => state.busy, nextHint: () => ask('hint', Math.min(state.level + 1, 5)) });

  function message(id, text, isError = false) {
    elements[id].textContent = text;
    elements[id].classList.toggle('is-error', isError);
  }

  function node(tag, className, text) {
    const result = document.createElement(tag);
    if (className) result.className = className;
    if (typeof text === 'string') result.textContent = text;
    return result;
  }

  function setBusy(busy) {
    state.busy = busy;
    elements['access-button'].disabled = busy || !state.status;
    elements['ask-button'].disabled = busy;
    elements['sample-button'].disabled = busy;
    elements['next-button'].disabled = busy || state.complete || state.level >= 5;
    elements['explain-button'].disabled = busy || state.complete;
    elements['topic'].disabled = busy;
    elements['question'].disabled = busy;
    elements['attempt'].disabled = busy;
    elements['external-consent'].disabled = busy;
    elements['forget-button'].disabled = busy;
    for (const button of document.querySelectorAll('.feedback-button')) {
      button.disabled = busy || button.dataset.feedbackLocked === 'true';
    }
    for (const control of document.querySelectorAll('.learning-aid-control')) control.disabled = busy;
    elements['workspace'].setAttribute('aria-busy', String(busy));
  }

  async function request(path, {method = 'GET', body, csrf = false, signal} = {}) {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (csrf) headers['X-Assistant-CSRF'] = state.csrf;
    const response = await fetch(path, {
      method, headers, credentials: 'same-origin', cache: 'no-store',
      body: body === undefined ? undefined : JSON.stringify(body), signal,
    });
    let result;
    try { result = await response.json(); } catch { result = null; }
    if (!response.ok || !result || result.ok === false) {
      const error = new Error('Request failed');
      error.status = response.status;
      if (result?.error === 'PERSONAL_DATA_REJECTED') error.code = 'PERSONAL_DATA_REJECTED';
      throw error;
    }
    return result;
  }

  function errorText(error) {
    if (error.code === 'PERSONAL_DATA_REJECTED') return 'В тексте могут быть личные данные или ссылка. Убери их и оставь только математическое условие.';
    if (error.name === 'AbortError' || error.name === 'TimeoutError') return 'Ответ задержался. Попробуй чуть позже. Предыдущие подсказки остаются на экране.';
    if (error.status === 401 || error.status === 403) return 'Не удалось подтвердить сеанс. Открой закрытый тест заново.';
    if (error.status === 429) return 'Достигнут лимит запросов. Сделаем паузу: ты можешь вернуться к уже открытым шагам.';
    if (error.status === 400 || error.status === 422) return 'Проверь условие задачи. Для начала можно взять встроенный пример выбранной темы.';
    if (error.status === 503) return 'Этот режим сейчас недоступен. Попробуй встроенный пример без внешней модели или вернись позже.';
    return 'Не получилось получить ответ. Проверь соединение и попробуй позже.';
  }

  function clearAnswers() {
    study.clear();
    state.level = 0;
    state.signature = '';
    state.complete = false;
    elements['answer-list'].replaceChildren();
    elements['empty-state'].hidden = false;
    elements['answer-actions'].hidden = true;
    elements['ask-button'].textContent = 'Дай первый шаг';
    message('answer-message', '');
  }

  function clearSession() {
    state.generation += 1;
    state.activeRequest?.abort();
    state.activeRequest = null;
    state.csrf = '';
    state.topics = [];
    elements['topic-help'].replaceChildren();
    elements['task-help'].open = false;
    elements['topic'].replaceChildren();
    elements['question'].value = '';
    elements['attempt'].value = '';
    elements['pilot-key'].value = '';
    study.clearSession(); labs.clear();
    elements['external-consent'].checked = false;
    elements['workspace'].hidden = true;
    elements['access-panel'].hidden = false;
    elements['forget-button'].hidden = true;
    clearAnswers();
    setBusy(false);
  }

  function taskSignature() {
    return JSON.stringify([
      elements['topic'].value, elements['question'].value.trim(),
    ]);
  }

  function chooseExample(topic, question) {
    if (state.busy) return;
    elements['topic'].value = topic;
    elements['question'].value = question;
    elements['attempt'].value = '';
    elements['external-consent'].checked = false;
    elements['ask-button'].textContent = 'Дай первый шаг';
    updateTopicHelp();
    elements['question'].focus();
    message('page-message', 'Пример готов. Нажми «Дай первый шаг», чтобы начать.');
  }

  function appendHelp(container, topic) {
    const help = topicHelp(topic);
    if (help.examples.length) container.append(node('p', '', 'Нажми на пример записи, чтобы попробовать его:'));
    const examples = node('div', 'example-options');
    for (const question of help.examples) {
      const button = node('button', 'button button-secondary learning-aid-control', question);
      button.type = 'button';
      button.addEventListener('click', () => chooseExample(topic, question));
      examples.append(button);
    }
    container.append(examples);
    if (help.resource) {
      const link = node('a', 'learning-resource', help.resource.title);
      link.href = help.resource.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
      container.append(link);
    }
  }

  function updateTopicHelp() {
    if (state.status) elements['external-choice'].hidden = !state.status.externalEnabled || Boolean(state.topics.find(t => t.id === elements['topic'].value)?.offlineOnly);
    elements['topic-help'].replaceChildren();
    appendHelp(elements['topic-help'], elements['topic'].value);
    study.refresh();
  }

  function svgNode(tag, attributes = {}) {
    const result = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [name, value] of Object.entries(attributes)) result.setAttribute(name, String(value));
    return result;
  }

  function appendDataTable(card, data) {
    if (!data || typeof data.caption!=='string' || !Array.isArray(data.headers) || !Array.isArray(data.rows) || data.headers.length>13 || data.rows.length>36) return;
    if (!data.headers.every(x=>typeof x==='string'&&x.length<100) || !data.rows.every(row=>Array.isArray(row)&&row.length===data.headers.length&&row.every(x=>typeof x==='string'&&x.length<100))) return;
    const panel=node('div','table-scroll');panel.tabIndex=0;panel.setAttribute('role','region');panel.setAttribute('aria-label',data.caption);
    const table=node('table','math-table'),head=node('thead'),header=node('tr'),body=node('tbody');
    table.append(node('caption','',data.caption));for(const text of data.headers){const th=node('th','',text);th.scope='col';header.append(th);}head.append(header);
    for(const row of data.rows){const tr=node('tr');row.forEach((text,i)=>{const cell=node(i===0?'th':'td','',text);if(i===0)cell.scope='row';tr.append(cell);});body.append(tr);}
    table.append(head,body);panel.append(table);card.append(panel);
  }

  function appendExactFigure(card, figure) {
    if (figure?.kind !== 'unit-circle' || !Array.isArray(figure.points) || figure.points.length>32) return;
    const points=figure.points.filter(p=>typeof p.label==='string' && p.label.length<40 && Number.isFinite(p.x) && Number.isFinite(p.y) && Math.abs(p.x)<=1 && Math.abs(p.y)<=1);
    const panel=node('details','learning-visual'); panel.append(node('summary','','Корни на единичной окружности'));
    const label=`Единичная окружность. Выбранные углы: ${points.map(p=>p.label).join('; ') || 'нет'}. Координаты точек на рисунке приблизительные; отбор углов выполнен точно.`;
    const svg=svgNode('svg',{viewBox:'0 0 360 300',role:'img','aria-label':label});
    svg.append(svgNode('circle',{cx:180,cy:150,r:108,class:'visual-empty'}),svgNode('line',{x1:42,y1:150,x2:318,y2:150,class:'visual-line'}),svgNode('line',{x1:180,y1:15,x2:180,y2:285,class:'visual-line'}));
    for(const p of points){svg.append(svgNode('circle',{cx:180+108*p.x,cy:150-108*p.y,r:5,class:'visual-point'}));const text=svgNode('text',{x:180+128*p.x,y:154-128*p.y,'text-anchor':'middle'});text.textContent=p.label;svg.append(text);}
    panel.append(svg,node('p','',label));card.append(panel);
  }

  function appendVisual(card, task) {
    const visual = visualFor(task.topic, task.question);
    if (!visual) return;
    const button = node('button', 'button button-secondary learning-aid-control', 'Показать наглядно');
    button.type = 'button'; button.setAttribute('aria-expanded', 'false');
    const panel = node('div', 'learning-visual'); panel.hidden = true;
    const picture = (label, height = 40) => {
      panel.append(node('p', 'visual-label', label));
      const svg = svgNode('svg', { viewBox: `0 0 360 ${height}`, role: 'img', 'aria-label': label });
      panel.append(svg); return svg;
    };
    if (visual.kind === 'fraction-bars') {
      for (const { n, d, label } of visual.operands) {
        const svg = picture(`${label}: одно целое — одна полоска`, 34 * visual.units);
        for (let unit = 0; unit < visual.units; unit++) for (let part = 0; part < d; part++) {
          svg.append(svgNode('rect', { x: 2 + part * 352 / d, y: 2 + unit * 34, width: 352 / d, height: 26,
            class: unit * d + part < n ? 'visual-filled' : 'visual-empty' }));
        }
      }
    } else if (visual.kind === 'number-line') {
      for (const { n, d, label } of visual.operands) {
        const svg = picture(`${label} на числовой прямой`, 60);
        svg.append(svgNode('line', { x1: 24, y1: 20, x2: 336, y2: 20, class: 'visual-line' }));
        for (let tick = -3; tick <= 3; tick++) {
          const x = 180 + tick * 52;
          svg.append(svgNode('line', { x1: x, y1: 14, x2: x, y2: 26, class: 'visual-line' }));
          const text = svgNode('text', { x, y: 48, 'text-anchor': 'middle' }); text.textContent = String(tick); svg.append(text);
        }
        svg.append(svgNode('circle', { cx: 180 + (n / d) * 52, cy: 20, r: 6, class: 'visual-point' }));
      }
    } else {
      const svg = picture(`${visual.percent}% исходного целого`);
      svg.append(svgNode('rect', { x: 2, y: 2, width: 352, height: 28, class: 'visual-empty' }));
      if (visual.percent) svg.append(svgNode('rect', { x: 2, y: 2, width: 352 * visual.percent / 100, height: 28, class: 'visual-filled' }));
    }
    panel.append(node('p', 'visual-caption', visual.caption));
    button.addEventListener('click', () => {
      panel.hidden = !panel.hidden;
      button.setAttribute('aria-expanded', String(!panel.hidden));
      button.textContent = panel.hidden ? 'Показать наглядно' : 'Скрыть рисунок';
    });
    card.append(button, panel);
  }

  function appendPractice(card, task) {
    const practice = practiceFor(task.topic, task.question);
    if (!practice) return;
    const button = node('button', 'button button-secondary learning-aid-control practice-toggle', 'Попробовать похожий пример');
    button.type = 'button'; button.setAttribute('aria-expanded', 'false');
    const form = node('form', 'practice-form'); form.hidden = true;
    const label = node('label', '', 'Твой ответ');
    const input = node('input', 'learning-aid-control');
    input.type = 'text'; input.maxLength = 300; input.required = true; input.autocomplete = 'off';
    label.append(input);
    const submit = node('button', 'button button-primary learning-aid-control', 'Проверить пример');
    submit.type = 'submit';
    const result = node('p', 'practice-result'); result.setAttribute('aria-live', 'polite');
    form.append(node('h4', '', 'Один пример для закрепления'), node('p', 'practice-question', practice.question), label, submit, result);
    button.addEventListener('click', () => {
      form.hidden = !form.hidden; button.setAttribute('aria-expanded', String(!form.hidden));
      button.textContent = form.hidden ? 'Попробовать похожий пример' : 'Скрыть похожий пример';
      if (!form.hidden) input.focus();
    });
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (state.busy || !state.csrf || !form.reportValidity()) return;
      const generation = state.generation;
      const controller = new AbortController(); state.activeRequest = controller;
      const timeout = setTimeout(() => controller.abort(), 45000);
      setBusy(true); result.textContent = 'Проверяем пример…';
      try {
        const response = await request('/api/ask', { method: 'POST', csrf: true, signal: controller.signal,
          body: { ...practice, attempt: input.value.trim(), hintLevel: 1, mode: 'hint', externalConsent: false, requestId: crypto.randomUUID() } });
        if (generation !== state.generation) return;
        const answer = response.answer;
        if (answer?.verification !== 'deterministic' || typeof answer.text !== 'string') throw new Error('Unverified practice');
        result.textContent = [answer.text, Array.isArray(answer.steps) ? answer.steps[0] : ''].filter(value => typeof value === 'string').join(' ');
      } catch (error) {
        if (generation !== state.generation) return;
        result.textContent = errorText(error);
        if (error.status === 401 || error.status === 403) {
          state.csrf = ''; elements['access-panel'].hidden = false; elements['forget-button'].hidden = true;
          message('page-message', 'Сеанс закончился или не подтверждён. Войди заново, чтобы продолжить.', true);
        }
      }
      finally {
        clearTimeout(timeout);
        if (generation === state.generation) { state.activeRequest = null; setBusy(false); }
      }
    });
    card.append(button, form);
  }

  function appendSources(card, sources) {
    if (!Array.isArray(sources) || !sources.length) return;
    const list = node('div', 'answer-sources');
    list.append(node('span', '', 'Материалы:'));
    for (const source of sources.slice(0, 5)) {
      if (!source || typeof source.title !== 'string') continue;
      let safeUrl;
      try {
        if (typeof source.url !== 'string' || !source.url) throw new TypeError('Missing source');
        const parsed = new URL(source.url, 'https://mathexam.space/');
        const projectSource = ['mathexam.space', 'www.mathexam.space'].includes(parsed.hostname) ||
          (parsed.hostname === 'github.com' && parsed.pathname.startsWith('/ladynata-cloud/math-exam-fipi/'));
        if (parsed.protocol === 'https:' && !parsed.username && !parsed.password && !parsed.search && projectSource) safeUrl = parsed.href;
      } catch { /* An unavailable source link is rendered as text. */ }
      const item = node(safeUrl ? 'a' : 'span', '', source.title);
      if (safeUrl) {
        item.href = safeUrl;
        item.target = '_blank';
        item.rel = 'noopener noreferrer';
      }
      list.append(item);
    }
    card.append(list);
  }

  function appendFeedback(card, answerId) {
    if (typeof answerId !== 'string' || !answerId) return;
    const feedback = node('div', 'feedback');
    const status = node('p', '', 'Помогло разобраться?');
    status.setAttribute('aria-live', 'polite');
    const buttons = node('div', 'feedback-buttons');
    const choices = [['helpful', 'Стало понятно'], ['unclear', 'Объясни проще'], ['incorrect', 'Кажется, ошибка']];
    for (const [rating, label] of choices) {
      const button = node('button', 'feedback-button', label);
      button.type = 'button';
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', async () => {
        if (!state.csrf || state.busy) return;
        const generation = state.generation;
        for (const item of buttons.children) item.dataset.feedbackLocked = 'true';
        setBusy(true);
        try {
          await request('/api/feedback', {method: 'POST', csrf: true, body: {answerId, rating}, signal: AbortSignal.timeout(15000)});
          if (generation !== state.generation) return;
          button.setAttribute('aria-pressed', 'true');
          status.textContent = rating === 'unclear' ? 'Учтено. Следующая подсказка будет проще.' :
            rating === 'incorrect' ? 'Спасибо. Оценка сохранена для проверки; обсуди этот шаг с учителем.' : 'Спасибо! Оценка сохранена.';
        } catch {
          if (generation !== state.generation) return;
          status.textContent = 'Не удалось сохранить оценку. Можно попробовать ещё раз.';
          for (const item of buttons.children) delete item.dataset.feedbackLocked;
        } finally { if (generation === state.generation) setBusy(false); }
      });
      buttons.append(button);
    }
    feedback.append(status, buttons);
    card.append(feedback);
  }

  function renderAnswer(answer, mode, level, notice, task, attempt, submittedAttempt) {
    const card = node('article', 'answer-card');
    card.tabIndex = -1;
    const kicker = node('div', 'answer-kicker');
    kicker.append(node('span', 'answer-kind', mode === 'explain' ?
      (answer.verification === 'needs-teacher' ? 'Общий ориентир' : 'Полный разбор') : `Подсказка ${level}`));
    const verificationLabels = {
      deterministic: 'Вычисления проверены программой',
      'curated-guidance': 'Из проверенных материалов',
      'model-unverified': 'Ответ модели · нужна проверка',
      'needs-teacher': 'Нужна помощь учителя',
    };
    const caution = !['deterministic', 'curated-guidance'].includes(answer.verification);
    kicker.append(node('span', `verification${caution ? ' caution' : ''}`,
      verificationLabels[answer.verification] || 'Обсуди ответ с учителем'));
    card.append(kicker, node('h3', '', typeof answer.title === 'string' ? answer.title : 'Посмотрим на следующий шаг'));
    if (typeof answer.text === 'string' && answer.text) card.append(node('p', 'answer-text', answer.text));
    if (Array.isArray(answer.steps) && answer.steps.length) {
      const steps = node('ol', 'answer-steps');
      for (const step of answer.steps.slice(0, 12)) if (typeof step === 'string') steps.append(node('li', '', step));
      card.append(steps);
    }
    if (typeof answer.check === 'string' && answer.check) {
      const check = node('div', 'answer-check');
      check.append(node('strong', '', 'Попробуй сам'), node('span', '', answer.check));
      card.append(check);
    }
    if (typeof notice === 'string' && notice) card.append(node('p', 'answer-notice', notice));
    if (answer.verification === 'model-unverified') card.append(node('p', 'answer-notice', 'Модель может ошибиться или открыть лишние шаги. Этот ответ не становится частью проверенной базы знаний автоматически.'));
    if (answer.verification === 'deterministic') {
      appendVisual(card, task);
      if (answer.complete) { appendExactFigure(card, answer.figure); appendGeometryFigure(card, answer.figure); appendDataTable(card, answer.table); }
      if (answer.complete) appendPractice(card, task);
    } else if (answer.verification === 'needs-teacher') {
      const help = node('details', 'task-help');
      help.append(node('summary', '', 'Выбрать пример записи или материал'));
      appendHelp(help, task.topic); card.append(help);
    }
    appendSources(card, answer.sources);
    appendFeedback(card, answer.id);
    study.decorate(card, answer, task, attempt, submittedAttempt);
    elements['answer-list'].append(card);
    elements['empty-state'].hidden = true;
    card.focus({preventScroll: true});
    card.scrollIntoView({block: 'nearest', behavior: 'auto'});
  }

  async function ask(mode, requestedLevel) {
    if (state.busy || !state.csrf || !elements['question-form'].reportValidity()) return;
    const signature = taskSignature();
    const task = { topic: elements['topic'].value, question: elements['question'].value.trim() };
    const newTask = signature !== state.signature;
    const submittedAttempt = elements['attempt'].value.trim();
    const level = mode === 'explain' ? 5 : newTask ? 1 : requestedLevel;
    if (level < 1 || level > 5) return;
    const generation = state.generation;
    const controller = new AbortController();
    state.activeRequest = controller;
    const timeout = setTimeout(() => controller.abort(), 45000);
    setBusy(true);
    message('answer-message', mode === 'explain' ? 'Готовим разбор…' : 'Подбираем следующий шаг…');
    message('page-message', '');
    try {
      const result = await request('/api/ask', {
        method: 'POST', csrf: true, signal: controller.signal,
        body: {
          topic: elements['topic'].value,
          question: elements['question'].value.trim(),
          attempt: elements['attempt'].value.trim(),
          hintLevel: level, mode,
          externalConsent: Boolean(state.status.externalEnabled && elements['external-consent'].checked),
          requestId: crypto.randomUUID(),
        },
      });
      if (generation !== state.generation) return;
      if (!result.answer || typeof result.answer !== 'object') throw new Error('Missing answer');
      if (newTask) clearAnswers();
      state.signature = signature;
      state.level = level;
      state.complete = Boolean(result.answer.complete) || mode === 'explain';
      renderAnswer(result.answer, mode, level, result.notice, task, submittedAttempt, Boolean(submittedAttempt && mode === 'hint' && requestedLevel === 1));
      elements['answer-actions'].hidden = state.complete;
      elements['ask-button'].textContent = 'Проверить мой шаг';
      message('answer-message', result.answer.verification === 'needs-teacher' ?
        'Решение пока не проверено. Уточни условие или открой примеры записи и материалы по теме.' :
        state.complete ? 'Разбор открыт. Можно вернуться к любому шагу или начать новую задачу.' :
        level >= 5 ? 'Все небольшие подсказки открыты. При желании посмотри полный разбор.' : 'Попробуй выполнить этот шаг. Если нужно — попроси ещё одну подсказку.');
    } catch (error) {
      if (generation !== state.generation) return;
      message('answer-message', errorText(error), true);
      if (error.status === 401 || error.status === 403) {
        state.csrf = '';
        elements['access-panel'].hidden = false;
        elements['forget-button'].hidden = true;
        message('page-message', 'Сеанс закончился или не подтверждён. Войди заново, чтобы продолжить.', true);
      }
    } finally {
      clearTimeout(timeout);
      if (generation === state.generation) {
        state.activeRequest = null;
        setBusy(false);
      }
    }
  }

  elements['access-form'].addEventListener('submit', async (event) => {
    event.preventDefault();
    if (state.busy || !state.status) return;
    const pilotKey = elements['pilot-key'].value;
    elements['pilot-key'].value = '';
    setBusy(true);
    message('page-message', 'Открываем сеанс…');
    try {
      const session = await request('/api/session', {method: 'POST', body: {pilotKey}, signal: AbortSignal.timeout(15000)});
      if (typeof session.csrf !== 'string' || !session.csrf) throw new Error('Missing session');
      state.csrf = session.csrf;
      const result = await request('/api/topics', {signal: AbortSignal.timeout(15000)});
      state.topics = Array.isArray(result.topics) ? result.topics.filter((topic) => typeof topic.id === 'string' && typeof topic.title === 'string') : [];
      if (!state.topics.length) throw new Error('Missing topics');
      elements['topic'].replaceChildren(...state.topics.map((topic) => {
        const option = node('option', '', topic.title);
        option.value = topic.id;
        return option;
      }));
      clearAnswers();
      updateTopicHelp();
      elements['access-panel'].hidden = true;
      elements['workspace'].hidden = false;
      elements['forget-button'].hidden = false;
      message('page-message', 'Можно начинать. Выбери тему и задачу.');
      setBusy(false);
      elements['question'].focus({preventScroll: true});
    } catch (error) {
      message('page-message', error.status === 401 || error.status === 403 ?
        'Не удалось открыть тест. Проверь ключ доступа у учителя.' : 'Не удалось открыть тест. Попробуй ещё раз через некоторое время.', true);
      if (state.csrf) elements['forget-button'].hidden = false;
    } finally { setBusy(false); }
  });

  elements['question-form'].addEventListener('submit', (event) => { event.preventDefault(); ask('hint', 1); });
  elements['next-button'].addEventListener('click', () => ask('hint', state.level + 1));
  elements['explain-button'].addEventListener('click', () => ask('explain', 5));
  elements['sample-button'].addEventListener('click', () => {
    const topic = state.topics.find((item) => item.id === elements['topic'].value);
    if (topic && typeof topic.sample === 'string') {
      elements['question'].value = topic.sample;
      elements['attempt'].value = '';
      elements['external-consent'].checked = false;
      study.refresh();
      elements['question'].focus();
      message('page-message', 'Пример готов. Нажми «Дай первый шаг», чтобы начать.');
      elements['ask-button'].textContent = 'Дай первый шаг';
    }
  });
  for (const field of ['topic', 'question', 'attempt']) elements[field].addEventListener('input', () => {
    elements['external-consent'].checked = false;
    if (field !== 'attempt') updateTopicHelp();
    if (taskSignature() !== state.signature) elements['ask-button'].textContent = 'Дай первый шаг';
  });

  elements['forget-button'].addEventListener('click', async () => {
    if (state.busy || !state.csrf) return;
    setBusy(true);
    try {
      await request('/api/session', {method: 'DELETE', csrf: true, signal: AbortSignal.timeout(15000)});
      clearSession();
      message('page-message', 'Сеанс и связанные с ним оценки удалены. Текст на этой странице очищен.');
      elements['access-button'].focus();
    } catch (error) {
      if (error.status === 401) {
        clearSession();
        message('page-message', 'Сеанс уже завершён. Текст на странице очищен. Обезличенные оценки хранятся не дольше 30 дней.');
      } else message('page-message', 'Не удалось подтвердить удаление сеанса. Проверь соединение и нажми «Удалить мой сеанс» ещё раз.', true);
    } finally { setBusy(false); }
  });

  async function initialize() {
    try {
      state.status = await request('/api/status', {signal: AbortSignal.timeout(15000)});
      const external = Boolean(state.status.externalEnabled && state.status.mode === 'api');
      elements['mode-badge'].textContent = external ? 'Внешняя модель доступна по согласию' : 'Встроенные примеры · без внешней модели';
      elements['mode-description'].textContent = external ?
        'Есть проверенные примеры и дополнительный режим внешней модели. Перед отправкой текста нужно твоё согласие.' :
        'Сейчас доступны проверенные примеры и объяснения из подготовленных материалов. Это проверка основы помощника; генеративная модель не подключена.';
      elements['external-choice'].hidden = !external;
      if (external && typeof state.status.providerLabel === 'string') {
        elements['external-consent-label'].textContent = `Разрешаю отправить математический текст провайдеру «${state.status.providerLabel}» для этой задачи.`;
      }
      if (state.status.localDemo) {
        elements['pilot-key-field'].hidden = true;
        elements['pilot-key'].required = false;
        elements['access-button'].textContent = 'Начать локальную проверку';
        elements['access-description'].textContent = 'Локальный режим проверки. Можно попробовать встроенные примеры без ключа доступа и оплаты.';
      }
      setBusy(false);
    } catch {
      elements['mode-badge'].textContent = 'Сервис недоступен';
      elements['mode-description'].textContent = 'Не удалось проверить режим помощника. Обнови страницу через некоторое время.';
      message('page-message', 'Не удалось соединиться с помощником. Доступ к закрытому тесту пока не открыт.', true);
    }
  }
  initialize();
})();
