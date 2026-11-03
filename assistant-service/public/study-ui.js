import { normalizeTask, inferTopic, ambiguity, FORMATS, GLOSSARY, whyStep, understanding, appendMath } from './study-tools.js';

export function installStudyTools({ elements: e, node, nextHint, busy }) {
  const button = (label, action, className = '') => { const b = node('button', `button button-secondary learning-aid-control ${className}`, label); b.type = 'button'; b.addEventListener('click', action); return b; };
  const details = (label, parent) => { const d = node('details', 'study-details'); d.append(node('summary', '', label)); parent.append(d); return d; };
  let auto = true, inputTarget = e.question, wrong = 0, taskKey = '', counter = 0;
  const suggestion = node('p', 'field-help'); suggestion.id = 'topic-suggestion';
  const automatic = node('input'); automatic.type = 'checkbox'; automatic.checked = true;
  const autoLabel = node('label', 'checkbox-label', 'Определять знакомую тему по условию'); autoLabel.prepend(automatic); e.topic.after(autoLabel, suggestion);
  automatic.addEventListener('change', () => { auto = automatic.checked; refresh(); });
  e.topic.addEventListener('change', () => { auto = false; automatic.checked = false; refresh(); });
  const preview = details('Как записано условие', e.question.parentElement);
  preview.id = 'condition-preview';
  const formula = node('div', 'condition-formula'); const warning = node('p', 'field-help'); warning.setAttribute('aria-live', 'polite');
  preview.append(formula, warning, button('Подтвердить эту запись', () => {
    if (busy()) return;
    e.question.value = normalizeTask(e.question.value); e.question.dispatchEvent(new Event('input', { bubbles: true }));
    warning.textContent = 'Запись подтверждена. Можно попросить первый шаг.';
  }));
  const locate = button('Показать место для уточнения', () => { const a = ambiguity(e.question.value, e.topic.value); if (a) { e.question.focus(); e.question.setSelectionRange(a.start, a.end); } });
  preview.append(locate);
  const format = node('p', 'field-help'); format.id = 'answer-format'; e.attempt.setAttribute('aria-describedby', format.id); e.attempt.after(format);
  const keys = details('Математическая клавиатура', e.attempt.parentElement);
  const keyRow = node('div', 'study-toolbar');
  for (const [label, value] of [['Дробь /', '/'], ['Степень ^', '^'], ['Корень √', '√'], ['Модуль | |', '||'], ['Меньше или равно ≤', '≤'], ['Больше или равно ≥', '≥'], ['Скобки ( )', '()'], ['Умножить ·', '*']]) {
    keyRow.append(button(label, () => {
      if (busy() || inputTarget.disabled) return;
      const start = inputTarget.selectionStart, end = inputTarget.selectionEnd;
      if (inputTarget.value.length - (end - start) + value.length > inputTarget.maxLength) return;
      inputTarget.setRangeText(value, start, end, 'end'); inputTarget.focus();
      if (['||', '()'].includes(value)) inputTarget.setSelectionRange(start + 1, start + 1);
      inputTarget.dispatchEvent(new Event('input', { bubbles: true }));
    }));
  }
  keys.append(node('p', 'field-help', 'Знак появится в последнем выбранном поле. Клавиатура не означает, что любая запись уже поддерживается.'), keyRow);
  for (const field of [e.question, e.attempt]) field.addEventListener('focus', () => { inputTarget = field; });
  const precheck = details('Проверю, понимаю ли правило', e.question.parentElement);
  const checkPanel = node('div'); precheck.append(checkPanel);
  function refresh() {
    const guess = inferTopic(e.question.value);
    if (auto && guess && [...e.topic.options].some(o => o.value === guess)) {
      e.topic.value = guess;
      suggestion.textContent = `Похоже на тему «${e.topic.selectedOptions[0].textContent}». Можно выбрать другую.`;
    } else suggestion.textContent = guess ? 'Тему можно изменить вручную.' : 'Выбери тему вручную: эта запись не распознана автоматически.';
    formula.replaceChildren(); appendMath(formula, normalizeTask(e.question.value));
    const a = ambiguity(e.question.value, e.topic.value); warning.textContent = a?.text || 'Сравни с исходным условием. Это предпросмотр записи, а не проверка решения.'; locate.hidden = !a;
    format.textContent = FORMATS[e.topic.value] || 'Уточни, что нужно найти и в каких единицах.';
    const quiz = understanding(e.topic.value); precheck.hidden = !quiz; checkPanel.replaceChildren();
    if (quiz) {
      const status = node('p'); status.setAttribute('aria-live', 'polite'); checkPanel.append(node('p', '', quiz.question));
      // Alternate order deterministically; do not teach that the first option is always right.
      const order = e.question.value.length % 2 ? [1, 0] : [0, 1];
      for (const index of order) checkPanel.append(button(quiz.options[index], () => { status.textContent = (index === quiz.correct ? 'Да. ' : 'Подумай ещё. ') + quiz.why; }));
      checkPanel.append(status);
    }
  }
  e.question.addEventListener('input', refresh); e.topic.addEventListener('input', () => { auto = false; automatic.checked = false; refresh(); });
  const options = details('Удобный вид и навигация', e.workspace);
  const toolbar = node('div', 'study-toolbar');
  const sizeLabel = node('label', '', 'Размер текста '); const size = node('select'); size.setAttribute('aria-label', 'Размер текста');
  for (const [value, label] of [['normal', 'Обычный'], ['large', 'Крупный'], ['largest', 'Очень крупный']]) { const o = node('option', '', label); o.value = value; size.append(o); }
  size.addEventListener('change', () => { document.body.classList.remove('text-large', 'text-largest'); if (size.value !== 'normal') document.body.classList.add(`text-${size.value}`); }); sizeLabel.append(size);
  const contrast = button('Высокий контраст', () => { const on = document.body.classList.toggle('high-contrast'); contrast.setAttribute('aria-pressed', String(on)); }); contrast.setAttribute('aria-pressed', 'false');
  const jump = target => { target?.focus({ preventScroll: true }); target?.scrollIntoView({ block: 'start', behavior: 'auto' }); };
  toolbar.append(sizeLabel, contrast, button('К условию', () => jump(e.question)), button('К началу решения', () => jump(e['answer-list'].querySelector('.answer-card') || e['answer-title'])), button('К последней подсказке', () => jump(e['answer-list'].lastElementChild || e['answer-title'])));
  options.append(toolbar);
  const bookmarks = details('Мои трудные шаги в этой вкладке', e['answer-list'].parentElement); const bookmarkList = node('div', 'study-toolbar'); bookmarks.append(bookmarkList);
  const help = node('div', 'two-errors'); help.hidden = true; help.setAttribute('role', 'status');
  help.append(node('p', '', 'Две попытки пока не подошли. Хочешь небольшую подсказку?'), button('Да, дай подсказку', () => { help.hidden = true; nextHint(); }), button('Попробую сам', () => { help.hidden = true; e.attempt.focus(); }));
  e['answer-actions'].after(help);
  const copyStatus = node('p', 'field-help'); copyStatus.setAttribute('aria-live', 'polite');
  async function copy(text) { try { await navigator.clipboard.writeText(text); copyStatus.textContent = 'Скопировано.'; } catch { copyStatus.textContent = 'Копирование недоступно. Можно выделить нужный текст вручную.'; } }
  e.question.parentElement.append(button('Скопировать условие', () => copy(e.question.value)), copyStatus);
  function decorate(card, answer, task, attempt, submittedAttempt) {
    if (typeof answer.answerFormat === 'string') format.textContent = answer.answerFormat;
    const key = JSON.stringify(task);
    if (key !== taskKey) { wrong = 0; taskKey = key; help.hidden = true; }
    if (submittedAttempt && answer.attemptStatus === 'incorrect') { wrong++; help.hidden = wrong < 2; }
    if (submittedAttempt && answer.attemptStatus === 'correct') { wrong = 0; help.hidden = true; }
    const content = [task.question, answer.title, answer.text, ...(answer.steps || []), answer.check].filter(s => typeof s === 'string').join('\n\n');
    for (const li of card.querySelectorAll('.answer-steps li')) {
      const text = li.textContent; li.replaceChildren(); appendMath(li, text);
      const why = details('Почему?', li); why.append(node('p', '', whyStep(task.topic, text)));
      li.append(button('Скопировать шаг', () => copy(text)));
    }
    const definitions = details('Незнакомые слова', card);
    let found = 0;
    for (const [word, meaning] of Object.entries(GLOSSARY)) if (content.toLowerCase().includes(word.slice(0, -1))) {
      const entry = details(word, definitions); entry.append(node('p', '', meaning)); found++;
    }
    definitions.hidden = found === 0;
    const tools = node('div', 'study-toolbar');
    if (attempt) tools.append(button('Изменить эту попытку', () => { if (busy()) return; e.attempt.value = attempt; e.attempt.dispatchEvent(new Event('input', { bubbles: true })); jump(e.attempt); }));
    const id = ++counter;
    const save = button('Отметить трудный шаг', () => {
      const saved = save.getAttribute('aria-pressed') !== 'true'; save.setAttribute('aria-pressed', String(saved));
      const prior = bookmarkList.querySelector(`[data-card="${id}"]`);
      if (saved && !prior) { const b = button(`Шаг ${id}: ${answer.title || 'Подсказка'}`, () => jump(card)); b.dataset.card = String(id); bookmarkList.append(b); }
      if (!saved) prior?.remove();
    }); save.setAttribute('aria-pressed', 'false');
    tools.append(save, button('Напечатать этот разбор', () => {
      document.getElementById('print-selection')?.remove();
      const print = node('section'); print.id = 'print-selection'; print.append(node('h1', '', 'Математика по шагам'));
      for (const text of content.split('\n\n')) { const p = node('p'); appendMath(p, text); print.append(p); }
      for (const visual of card.querySelectorAll('.learning-visual, .table-scroll')) { const copy=visual.cloneNode(true); copy.hidden=false; if(copy.tagName==='DETAILS')copy.open=true; for(const details of copy.querySelectorAll('details'))details.open=true; print.append(copy); }
      document.body.append(print); window.print();
    }));
    card.append(tools);
  }
  return { refresh, decorate, clear() { wrong = 0; taskKey = ''; help.hidden = true; bookmarkList.replaceChildren(); document.getElementById('print-selection')?.remove(); }, clearSession() { formula.replaceChildren(); warning.textContent = ''; copyStatus.textContent = ''; this.clear(); } };
}
