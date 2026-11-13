(function (root) {
  'use strict';

  const storagePrefix = 'mathexam.profile-skill-map.v1.';
  const session = new Map();
  let nextDialogId = 0;
  let directOpenUsed = false;
  let canSave = true;

  function normalized(value) {
    return String(value).normalize('NFKC').toLowerCase().trim()
      .replace(/[−–—]/g, '-').replace(/\s+/g, ' ')
      .replace(/\s*([;:,=(){}\[\]/])\s*/g, '$1');
  }

  function fraction(value) {
    const ratio = value.match(/^([+-]?\d+)\/([+-]?\d+)$/);
    if (ratio) {
      const denominator = BigInt(ratio[2]);
      return denominator ? [BigInt(ratio[1]), denominator] : null;
    }
    const decimal = value.match(/^([+-]?)(\d*)(?:[,.](\d*))?$/);
    if (!decimal || !(decimal[2] || decimal[3])) return null;
    const digits = decimal[3] || '';
    return [BigInt(decimal[1] + decimal[2] + digits), 10n ** BigInt(digits.length)];
  }

  function matches(input, expected) {
    const value = normalized(input);
    if (!value || value.length > 120) return false;
    const a = fraction(value);
    return expected.some(answer => {
      const target = normalized(answer);
      const b = fraction(target);
      return a && b ? a[0] * b[1] === b[0] * a[1] : value === target;
    });
  }

  function read(key) {
    const fallback = session.get(key) || { values: [], hinted: false, solved: false, mistakes: 0 };
    if (!canSave) return fallback;
    try {
      const raw = root.localStorage.getItem(storagePrefix + key);
      if (!raw) return fallback;
      const saved = JSON.parse(raw);
      if (saved && Array.isArray(saved.values) && saved.values.every(value => typeof value === 'string') &&
          typeof saved.hinted === 'boolean' && typeof saved.solved === 'boolean' &&
          Number.isSafeInteger(saved.mistakes) && saved.mistakes >= 0) return saved;
    } catch (_) {
      // A damaged entry can be replaced by the next attempt.
    }
    return fallback;
  }

  function update(key, change) {
    const state = read(key);
    if (state.solved) return state;
    Object.assign(state, change);
    session.set(key, state);
    if (canSave) {
      try {
        root.localStorage.setItem(storagePrefix + key, JSON.stringify(state));
      } catch (_) {
        canSave = false;
      }
    }
    return state;
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function action(text, primary = false) {
    const button = element('button', 'profile-skill-button' + (primary ? ' profile-skill-button-primary' : ''), text);
    button.type = 'button';
    return button;
  }

  function keyFor(mapKey, challenge, index) {
    return `${mapKey}:${challenge.id || index}`;
  }

  function mapTitle(key, map) {
    return /^\d+$/.test(key) ? `№${key}${map.title ? ' · ' + map.title : ''}` : map.title;
  }

  function alphabetLinks(key, beforeLeave) {
    const catalog = root.ProfileAlphabetCatalog;
    const alphabets = catalog?.forNumber(key);
    if (!alphabets?.length) return null;
    const block = element('section', 'profile-skill-alphabets');
    block.append(element('h3', '', 'Азбуки к этому номеру'));
    const back = root.location.pathname + root.location.search + root.location.hash;
    for (const alphabet of alphabets) {
      const group = element('div', 'profile-skill-alphabet-group');
      group.append(element('strong', '', alphabet.short));
      const list = element('ul');
      for (const [id, skill] of Object.entries(alphabet.skills)) {
        if (!skill.numbers.includes(Number(key))) continue;
        const link = element('a', '', skill.title);
        link.href = catalog.href(alphabet.id, id, key, back);
        link.setAttribute('data-profile-alphabet-link', '');
        if (beforeLeave) link.addEventListener('click', async event => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          await beforeLeave();
          root.location.assign(link.href);
        });
        const row = element('li');
        row.append(link);
        list.append(row);
      }
      group.append(list);
      block.append(group);
    }
    return block;
  }

  function challengeForm(key, challenge, index, group, refresh) {
    const stateKey = keyFor(key, challenge, index);
    const state = read(stateKey);
    const card = element('article', 'profile-skill-challenge');
    card.setAttribute('data-profile-skill-challenge', '');
    card.append(element('h4', '', challenge.title), element('p', 'profile-skill-prompt', challenge.prompt));

    const form = element('form', 'profile-skill-form');
    const fields = challenge.fields || [{ label: 'Ответ', answers: challenge.answers }];
    const inputs = [];
    if (challenge.choices?.length) {
      const choices = element('fieldset', 'profile-skill-choices');
      choices.append(element('legend', '', 'Выберите ответ'));
      challenge.choices.forEach(choice => {
        const label = element('label', 'profile-skill-choice');
        const input = element('input');
        input.type = 'radio';
        input.name = `${group}-${index}`;
        input.value = choice;
        input.checked = state.values[0] === choice;
        input.setAttribute('data-profile-skill-answer', '');
        inputs.push(input);
        label.append(input, element('span', '', choice));
        choices.append(label);
      });
      form.append(choices);
    } else {
      fields.forEach((field, fieldIndex) => {
        const label = element('label', 'profile-skill-field', field.label || 'Ответ');
        const input = element('input');
        input.type = 'text';
        input.maxLength = 120;
        input.autocomplete = 'off';
        input.spellcheck = false;
        input.value = state.values[fieldIndex] || '';
        input.setAttribute('data-profile-skill-answer', '');
        inputs.push(input);
        label.append(input);
        form.append(label);
      });
    }

    function values() {
      return challenge.choices?.length ? [inputs.find(input => input.checked)?.value || ''] : inputs.map(input => input.value);
    }

    const submit = action('Проверить', true);
    submit.type = 'submit';
    form.append(submit);
    card.append(form);
    const hint = element('details', 'profile-skill-hint');
    hint.setAttribute('data-profile-skill-hint', '');
    hint.append(element('summary', '', 'Подсказка'), element('p', '', challenge.hint));
    const feedback = element('p', 'profile-skill-feedback');
    feedback.setAttribute('role', 'status');
    feedback.setAttribute('data-profile-skill-feedback', '');
    card.append(hint, feedback);

    function complete(record) {
      feedback.dataset.result = 'correct';
      feedback.textContent = (record.hinted ? 'Верно, с подсказкой. ' : 'Верно. ') + challenge.explanation;
      hint.hidden = true;
      submit.hidden = true;
      inputs.forEach(input => { input.disabled = true; input.removeAttribute('aria-invalid'); });
    }

    if (state.solved) complete(state);
    form.addEventListener('input', () => {
      inputs.forEach(input => input.removeAttribute('aria-invalid'));
      update(stateKey, { values: values() });
      refresh();
    });
    function recordHint() {
      update(stateKey, { hinted: true });
      refresh();
    }
    hint.querySelector('summary').addEventListener('click', () => { if (!hint.open) recordHint(); });
    hint.addEventListener('toggle', () => { if (hint.open) recordHint(); });
    form.addEventListener('submit', event => {
      event.preventDefault();
      const answers = values();
      if (answers.some(answer => !answer.trim())) {
        feedback.dataset.result = 'retry';
        feedback.textContent = challenge.choices?.length ? 'Выберите ответ.' : 'Заполните каждое поле.';
        const firstEmpty = answers.findIndex(answer => !answer.trim());
        inputs[firstEmpty]?.focus();
        return;
      }
      const results = fields.map((field, fieldIndex) => matches(answers[fieldIndex], field.answers));
      if (results.every(Boolean)) {
        complete(update(stateKey, { values: answers, solved: true, hinted: hint.open || read(stateKey).hinted }));
      } else {
        const mistakes = read(stateKey).mistakes + 1;
        const record = update(stateKey, { values: answers, mistakes });
        if (record.solved) complete(record);
        else {
          feedback.dataset.result = 'retry';
          feedback.textContent = `Пока не сходится. ${mistakes >= 2 ? 'Попробуйте подсказку.' : 'Сверьте ответ с условием.'}`;
          inputs.forEach((input, i) => input.setAttribute('aria-invalid', String(challenge.choices?.length || !results[i])));
        }
      }
      refresh();
    });
    return card;
  }

  function render(container, key, map, id, { lesson, beforeLeave }) {
    const layout = element('div', 'profile-skill-layout');
    const route = element('section', 'profile-skill-route');
    if (lesson?.skill) {
      route.append(element('h3', '', lesson.title), element('p', 'profile-skill-lesson-goal', lesson.skill));
    }
    route.append(element('h3', '', 'Что освоить'));
    const list = element('ol', 'profile-skill-steps');
    map.skills.forEach(skill => list.append(element('li', '', skill)));
    route.append(list);
    const alphabets = alphabetLinks(key, beforeLeave);
    if (alphabets) route.append(alphabets);

    const practice = element('section', 'profile-skill-practice');
    practice.append(element('h3', '', 'Творческие задания'));
    const summary = element('p', 'profile-skill-progress');
    summary.setAttribute('data-profile-skill-progress', '');
    practice.append(summary);
    function refresh() {
      const done = map.challenges.filter((challenge, index) => read(keyFor(key, challenge, index)).solved).length;
      summary.textContent = `Решено ${done} из ${map.challenges.length}${canSave ? '' : ' · до закрытия страницы'}`;
    }
    map.challenges.forEach((challenge, index) => practice.append(challengeForm(key, challenge, index, id, refresh)));
    refresh();
    layout.append(route, practice);
    container.replaceChildren(layout);
  }

  function mount(container, keys, options = {}) {
    const data = root.ProfileSkillMapData;
    if (!data || !container || root.self !== root.top || document.body.dataset.profileBoard) return null;
    const maps = [...new Set(keys.map(String))].map(key => [key, data.maps[key] || data.trainers[key]]).filter(([, map]) => map);
    if (!maps.length) return null;

    const id = 'profile-skill-dialog-' + (++nextDialogId);
    const entry = element('div', 'profile-skill-entry');
    const open = action('Карта навыков');
    open.setAttribute('data-profile-skill-trigger', '');
    open.setAttribute('aria-haspopup', 'dialog');
    open.setAttribute('aria-controls', id);
    const dialog = element('dialog', 'profile-skill-dialog');
    dialog.id = id;
    dialog.setAttribute('data-profile-skill-dialog', '');
    dialog.setAttribute('aria-labelledby', id + '-title');
    const heading = element('header', 'profile-skill-header');
    const title = element('h2', '', 'Карта навыков');
    title.id = id + '-title';
    const close = action('Вернуться');
    close.autofocus = true;
    heading.append(title, close);
    dialog.append(heading);

    const body = element('div', 'profile-skill-body');
    const select = element('select');
    let selected = maps[0];
    let lastPreferred;
    if (maps.length > 1) {
      select.setAttribute('data-profile-skill-select', '');
      for (const [key, map] of maps) {
        const option = element('option', '', mapTitle(key, map));
        option.value = key;
        select.append(option);
      }
      const label = element('label', 'profile-skill-picker', 'Выберите тему');
      label.append(select);
      dialog.append(label);
      select.addEventListener('change', () => {
        selected = maps.find(([key]) => key === select.value) || selected;
        render(body, ...selected, id, options);
      });
    } else {
      dialog.append(element('p', 'profile-skill-subtitle', mapTitle(...selected)));
    }
    dialog.append(body);
    entry.append(open, dialog);
    container.append(entry);

    function show() {
      const current = options.preferred?.();
      if (current && current !== lastPreferred) selected = maps.find(([key]) => key === String(current)) || selected;
      lastPreferred = current;
      select.value = selected[0];
      render(body, ...selected, id, options);
      if (typeof dialog.showModal === 'function') {
        if (!dialog.open) dialog.showModal();
      } else {
        dialog.setAttribute('open', '');
        close.focus();
      }
    }
    open.addEventListener('click', show);
    close.addEventListener('click', () => {
      if (typeof dialog.close === 'function') dialog.close();
      else { dialog.removeAttribute('open'); open.focus(); }
    });
    dialog.addEventListener('close', () => open.focus());
    if (!directOpenUsed && new URLSearchParams(root.location.search).get('skills') === '1') {
      directOpenUsed = true;
      // The course router focuses its heading immediately after rendering.
      root.setTimeout(() => { if (entry.isConnected) show(); }, 0);
    }
    return entry;
  }

  function optionByValue(spec, value) {
    return spec?.split(' ').find(pair => pair.split('=')[0] === value)?.split('=')[1];
  }

  function boot(script) {
    if (!script?.dataset.profileSkillMap || root.self !== root.top) return;
    const config = script.dataset;
    const keys = config.profileSkillMap.trim().split(/\s+/);
    let target = config.profileSkillTarget && document.querySelector(config.profileSkillTarget);
    if (!target) target = document.getElementById('profile-course-nav');
    if (!target) {
      const landmark = document.querySelector('h1, #pageTitle');
      if (!landmark) return;
      target = element('div', 'profile-skill-slot');
      landmark.after(target);
    }
    mount(target, keys, {
      preferred: () => optionByValue(config.profileSkillTopics, new URLSearchParams(root.location.search).get('topic')) ||
        optionByValue(config.profileSkillHashes, root.location.hash.slice(1))
    });
  }

  root.ProfileSkillMap = { mount, matches };
  if (typeof module !== 'undefined') module.exports = root.ProfileSkillMap;
  if (typeof document !== 'undefined') {
    const script = document.currentScript;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => boot(script), { once: true });
    else boot(script);
  }
})(globalThis);
