/* A local, task-scoped conversation. The course remains the only answer checker. */
(() => {
  'use strict';

  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  function mount({lesson, task, draft, modelRequired, save, taskPanel}) {
    const dialogue = window.ArzhenikovAssistantDialogue;
    if (!dialogue || typeof dialogue.context !== 'function' || typeof dialogue.reply !== 'function') return null;

    const panel = element('details', 'course-assistant ym-hide-content ym-disable-clickmap');
    panel.dataset.assistantTask = task.id;
    const summary = element('summary', '', 'Помощник по этому заданию');
    const body = element('div', 'course-assistant-body');
    const intro = element('p', 'course-assistant-intro', 'Помогаю разобраться в текущем шаге. Работаю и без интернета.');
    const scope = element('p', 'course-assistant-scope');
    scope.id = 'course-assistant-scope';
    let previousState = {};
    let replyBasis = '';
    const basis = context => {
      const focus = context.currentStep || context;
      return JSON.stringify([focus.input || '', focus.status || '', focus.formatIssue || '']);
    };

    function currentContext() {
      const context = dialogue.context({lesson, task, draft, modelRequired});
      if (panel.dataset.assistantFrame !== context.frame) {
        previousState = {};
        output.textContent = '';
      }
      const inputChanged = replyBasis !== basis(context);
      if (inputChanged && ['correct', 'retry', 'format', 'transform'].includes(output.dataset.kind)) {
        output.textContent = '';
      }
      panel.dataset.assistantFrame = context.frame || '';
      panel.dataset.assistantPhase = context.phase || '';
      scope.textContent = context.phase === 'model' ? 'Сейчас: покажи условие на модели.'
        : context.phase === 'solved' ? 'Ответ уже проверен. Можно перейти к следующему заданию.'
        : context.currentStep ? 'Сейчас: ' + context.currentStep.prompt
        : 'Сейчас: ' + task.label + (task.unit ? ' (' + task.unit + ')' : '') + '.';
      return context;
    }

    const actions = element('div', 'course-assistant-actions');
    const form = element('form', 'course-assistant-form');
    const label = element('label', '', 'Что осталось непонятным?');
    label.htmlFor = 'course-assistant-message';
    const input = element('textarea');
    input.id = 'course-assistant-message';
    input.name = 'course-assistant-message';
    input.rows = 2;
    input.maxLength = 400;
    input.autocomplete = 'off';
    input.setAttribute('aria-describedby', 'course-assistant-scope');
    input.placeholder = 'Например: почему здесь нужен ноль?';
    const submit = element('button', '', 'Спросить помощника');
    submit.type = 'submit';
    submit.dataset.assistantAction = 'ask';
    const output = element('p', 'course-assistant-reply');
    output.id = 'course-assistant-reply';
    output.setAttribute('role', 'status');
    output.setAttribute('aria-live', 'polite');
    output.setAttribute('aria-atomic', 'true');

    function registerHelp() {
      draft.helpUsed = true;
      // Persist attribution before showing any mathematical assistance.
      save();
      const host = panel.closest('#arz-courses');
      if (host && !host.querySelector('.course-help-record')) {
        host.append(element('p', 'course-help-record',
          'В этой задаче использована помощь. Это сохранено отдельно от самостоятельных ответов.'));
      }
    }

    function ask(message) {
      const context = currentContext();
      const result = dialogue.reply(String(message).slice(0, 400), context, previousState);
      if (result.countsAsHelp === true) registerHelp();
      previousState = result.state || {};
      replyBasis = basis(context);
      output.textContent = result.text;
      output.dataset.kind = result.kind || '';
    }

    for (const [action, text] of [['start', 'С чего начать?'], ['simpler', 'Объясни проще'],
      ['why', 'Почему так?'], ['check', 'Проверь мою запись']]) {
      const button = element('button', '', text);
      button.type = 'button';
      button.dataset.assistantAction = action;
      button.addEventListener('click', () => ask(text));
      actions.append(button);
    }
    form.addEventListener('submit', event => {
      event.preventDefault();
      ask(input.value);
      input.value = '';
      input.focus({preventScroll: true});
    });
    panel.addEventListener('toggle', () => { if (panel.open) currentContext(); });
    // Listen on this task's DOM node, which is discarded on navigation. A model
    // edit can reopen its gate without rerendering; an old verdict must also
    // disappear when the pupil changes the input it described.
    if (taskPanel) for (const type of ['input', 'change', 'click']) {
      taskPanel.addEventListener(type, () => currentContext());
    }
    currentContext();
    form.append(label, input, submit);
    body.append(intro, scope, actions, form, output);
    panel.append(summary, body);
    return panel;
  }

  window.ArzhenikovCourseAssistant = {mount};
})();
