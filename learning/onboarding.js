/* Teacher-only onboarding form. Credentials stay in this document's memory. */
(function (root) {
  'use strict';

  const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));
  const defaultDirections = Object.freeze({
    school: 'Школьная программа', foundations: 'Математические основы',
    oge: 'Подготовка к ОГЭ', ege: 'ЕГЭ · базовый уровень',
    'ege-profile': 'ЕГЭ · профильный уровень', vilenkin6: '6 класс · Виленкин'
  });

  function mount(host, options = {}) {
    const editing = options.mode === 'edit';
    const catalog = options.catalog || root.LearningCourseProgram;
    if (!host || !Array.isArray(catalog?.courses) || typeof options.onSave !== 'function') {
      throw Error('LEARNING_ONBOARDING_UNAVAILABLE');
    }
    const courses = catalog.courses;
    const byId = new Map(courses.map(course => [course.id, course]));
    const maxCourses = catalog.MAX_COURSES || 24;
    const directions = { ...defaultDirections, ...(catalog.directions || {}) };
    const student = options.student || {};
    const initialProfile = options.profile || student.profile || { course: 'school', goal: null, focus: '', version: 0 };
    let profileVersion = initialProfile.version || 0;
    let focusNote = initialProfile.focus || '';
    let onSave = options.onSave, onComplete = options.onComplete, onCancel = options.onCancel;
    let onReload = options.onReload, errorText = options.errorText, generatePassword = options.generatePassword;
    let alive = true, busy = false, complete = false, conflict = false, creationChanged = false, step = 1, operation = null;
    let submittedPayload = null;
    const listeners = new AbortController();
    const initialIds = new Set((initialProfile.program?.courseIds || []).filter(id => byId.has(id)));
    const gradeValue = initialProfile.program && Object.hasOwn(initialProfile.program, 'grade')
      ? initialProfile.program.grade === null ? 'other' : String(initialProfile.program.grade) : '';
    const formId = editing ? 'student-program-form' : 'student-form';
    const titleId = formId + '-stage-title';
    const labelForGrade = value => value === 'other' ? 'Вне школы' : value ? value + ' класс' : 'Класс не выбран';

    host.innerHTML = `<section class="learning-onboarding" data-onboarding>
      <p class="onboarding-lead">${editing
        ? 'Выберите программу для ' + escape(student.name || 'ученика') + '. Его вход и прежние работы сохранятся.'
        : 'Укажите ученика, выберите курсы и получите готовую ссылку для входа.'}</p>
      <ol class="onboarding-steps" aria-label="Этапы настройки кабинета">
        ${['Ученик', 'Курсы', 'Проверка'].map((title, index) => `<li data-onboarding-progress="${index + 1}"><span aria-hidden="true">${index + 1}</span><b>${title}</b></li>`).join('')}
      </ol>
      <form id="${formId}" class="form-stack onboarding-form" autocomplete="off" novalidate aria-busy="false">
        <section class="onboarding-stage" data-onboarding-step="1" aria-labelledby="${titleId}-1">
          <h3 id="${titleId}-1" tabindex="-1" data-onboarding-stage-title>1. ${editing ? 'Уровень и направление' : 'Об ученике'}</h3>
          ${editing ? `<p class="onboarding-student-name">${escape(student.name || 'Ученик')}</p>`
            : '<label>Имя ученика<input name="name" maxlength="80" autocomplete="off" required></label>'}
          <div class="onboarding-fields">
            <label>Класс<select name="grade" required><option value="">Выберите класс</option>${Array.from({ length: 11 }, (_, i) => `<option value="${i + 1}">${i + 1} класс</option>`).join('')}<option value="other">Вне школы</option></select></label>
            <label>Направление подготовки<select name="course" required>${Object.entries(directions).map(([id, title]) => `<option value="${escape(id)}">${escape(title)}</option>`).join('')}</select></label>
          </div>
          <label data-onboarding-goal hidden>Цель подготовки к ОГЭ<select name="goal"><option value="">Выберем позже</option><option value="pass">Уверенно сдать</option><option value="grade5">Подготовка на 5</option></select></label>
          ${editing ? '' : `<fieldset class="onboarding-access"><legend>Готовый вход</legend>
            <p>Логин и код уже предложены. Их можно оставить или изменить.</p>
            <label>Логин для входа<input name="login" pattern="[a-zA-Z0-9._-]{3,48}" minlength="3" maxlength="48" autocapitalize="none" spellcheck="false" autocomplete="off" required></label>
            <div class="student-password-row"><label>Код входа · 4 цифры<input name="password" type="text" inputmode="numeric" pattern="[0-9]{4}" minlength="4" maxlength="4" autocapitalize="none" spellcheck="false" autocomplete="off" required></label><button type="button" id="generate-password" data-onboarding-generate>Другой код</button></div>
          </fieldset>`}
        </section>
        <section class="onboarding-stage" data-onboarding-step="2" aria-labelledby="${titleId}-2" hidden>
          <h3 id="${titleId}-2" tabindex="-1" data-onboarding-stage-title>2. Выберите курсы</h3>
          <p>Можно выбрать несколько курсов и позже изменить программу.</p>
          <label class="onboarding-search">Найти курс<input type="search" data-onboarding-search placeholder="Название курса или тема" autocomplete="off"></label>
          <p class="onboarding-selection-count" data-onboarding-count role="status" aria-live="polite"></p>
          <fieldset class="onboarding-course-fieldset" tabindex="-1"><legend class="sr-only">Доступные курсы</legend>
            <div class="onboarding-course-list">${courses.map(course => `<label class="onboarding-course" data-onboarding-course="${escape(course.id)}">
              <input type="checkbox" name="courseIds" value="${escape(course.id)}"${initialIds.has(course.id) ? ' checked' : ''}>
              <span class="onboarding-course-copy"><strong>${escape(course.title)}</strong><span>${escape(course.description || '')}</span>${course.storageLabel ? `<small>${escape(course.storageLabel)}</small>` : ''}</span>
            </label>`).join('')}</div>
          </fieldset>
          <p data-onboarding-no-results hidden>Курс с таким названием не найден. Попробуйте другое слово.</p>
        </section>
        <section class="onboarding-stage" data-onboarding-step="3" aria-labelledby="${titleId}-3" hidden>
          <h3 id="${titleId}-3" tabindex="-1" data-onboarding-stage-title>3. Проверьте программу</h3>
          <div class="onboarding-summary" data-onboarding-summary></div>
          <p>${editing ? 'После сохранения ученик увидит новую программу. Прежние решения останутся в истории.' : 'После сохранения появятся ссылка, логин и код. Ученик сможет сразу войти и открыть свои курсы.'}</p>
        </section>
        <p class="form-error" data-onboarding-error role="alert" aria-live="assertive"></p>
        <section class="onboarding-conflict" data-onboarding-conflict hidden>
          <button type="button" data-onboarding-reload>Загрузить текущую программу</button>
          <div data-onboarding-current></div>
        </section>
        <p class="onboarding-status" data-onboarding-status role="status" aria-live="polite"></p>
        <div class="onboarding-actions">
          <button type="button" data-onboarding-cancel>Отмена</button>
          <button type="button" data-onboarding-back hidden>← Назад</button>
          <button type="button" class="primary" data-onboarding-next>Выбрать курсы →</button>
          <button type="submit" class="primary" hidden>${editing ? 'Сохранить программу' : 'Создать кабинет'}</button>
        </div>
      </form>
    </section>`;
    const section = host.querySelector('[data-onboarding]');
    const form = section.querySelector('form');
    const find = selector => section.querySelector(selector);
    const field = name => form.elements.namedItem(name);
    const error = find('[data-onboarding-error]');
    const status = find('[data-onboarding-status]');
    const chosenIds = () => [...form.querySelectorAll('[name=courseIds]:checked')].map(input => input.value);
    const listen = (node, event, callback) => node?.addEventListener(event, callback, { signal: listeners.signal });
    const current = () => alive && section.isConnected;
    const setError = message => { if (current()) error.textContent = message; };
    field('grade').value = gradeValue;
    field('course').value = Object.hasOwn(directions, initialProfile.course) ? initialProfile.course : 'school';
    field('goal').value = initialProfile.goal || '';
    if (!editing) {
      field('name').value = student.name || '';
      field('login').value = options.initialLogin || '';
      field('password').value = options.initialPassword || '';
    }
    // Do not retain the options object carrying the initial plaintext code.
    options = null;

    function syncGoal() {
      const show = field('course').value === 'oge';
      find('[data-onboarding-goal]').hidden = !show;
      field('goal').disabled = busy || complete || creationChanged || !show;
    }
    function syncSelection() {
      const chosen = chosenIds();
      find('[data-onboarding-count]').textContent = 'Выбрано курсов: ' + chosen.length;
      form.querySelectorAll('[data-onboarding-course]').forEach(card => {
        card.dataset.selected = String(card.querySelector('input').checked);
      });
    }
    function summaryMarkup(profile, name, login = '') {
      const program = profile.program || {};
      const grade = program.grade === null ? 'other' : program.grade == null ? '' : String(program.grade);
      return `<dl><div><dt>Ученик</dt><dd>${escape(name)}</dd></div><div><dt>Класс</dt><dd>${escape(labelForGrade(grade))}</dd></div><div><dt>Направление</dt><dd>${escape(directions[profile.course] || profile.course)}</dd></div>${profile.course === 'oge' && profile.goal ? `<div><dt>Цель</dt><dd>${profile.goal === 'grade5' ? 'Подготовка на 5' : 'Уверенно сдать'}</dd></div>` : ''}${login ? `<div><dt>Логин</dt><dd>${escape(login)}</dd></div>` : ''}</dl><h4>Назначенные курсы</h4><ul>${(program.courseIds || []).map(id => `<li>${escape(byId.get(id)?.title || 'Курс недоступен в текущем каталоге')}</li>`).join('')}</ul>`;
    }
    function values() {
      const profile = {
        course: field('course').value,
        goal: field('course').value === 'oge' ? field('goal').value || null : null,
        focus: focusNote,
        program: { grade: field('grade').value === 'other' ? null : Number(field('grade').value), courseIds: chosenIds() }
      };
      return editing ? { expectedVersion: profileVersion, ...profile }
        : { name: field('name').value.trim(), login: field('login').value.trim(), password: field('password').value, profile };
    }
    function updateSummary() {
      const value = values();
      find('[data-onboarding-summary]').innerHTML = summaryMarkup(editing ? value : value.profile,
        editing ? student.name || 'Ученик' : value.name, editing ? '' : value.login);
      if (!editing) value.password = '';
    }
    function setStep(next, focus = true) {
      if (!current() || busy || complete) return;
      step = next;
      form.querySelectorAll('[data-onboarding-step]').forEach(stage => { stage.hidden = Number(stage.dataset.onboardingStep) !== step; });
      section.querySelectorAll('[data-onboarding-progress]').forEach(item => {
        const number = Number(item.dataset.onboardingProgress);
        if (number === step) item.setAttribute('aria-current', 'step'); else item.removeAttribute('aria-current');
        item.dataset.complete = String(number < step);
      });
      find('[data-onboarding-back]').hidden = step === 1;
      find('[data-onboarding-next]').hidden = step === 3;
      find('[data-onboarding-next]').textContent = step === 1 ? 'Выбрать курсы →' : 'Проверить программу →';
      form.querySelector('[type=submit]').hidden = step !== 3;
      if (step === 3) updateSummary();
      if (focus) find('[data-onboarding-step="' + step + '"] [data-onboarding-stage-title]').focus();
    }
    function validatePupil() {
      const names = editing ? ['grade', 'course'] : ['name', 'grade', 'course', 'login', 'password'];
      if (!editing) {
        field('name').setCustomValidity(field('name').value.trim() ? '' : 'Введите имя ученика.');
        field('login').value = field('login').value.trim();
      }
      for (const name of names) {
        const input = field(name);
        if (!input.checkValidity()) {
          setStep(1, false);
          setError(name === 'grade' ? 'Выберите класс или вариант «Вне школы».'
            : name === 'password' ? 'Код входа — ровно 4 цифры.'
              : name === 'login' ? 'Логин: от 3 до 48 латинских букв, цифр, точек, дефисов или подчёркиваний.'
                : name === 'name' ? 'Введите имя ученика.' : 'Выберите направление подготовки.');
          input.focus(); input.reportValidity(); return false;
        }
      }
      return true;
    }
    function validateCourses() {
      const count = chosenIds().length;
      if (count > 0 && count <= maxCourses) return true;
      setStep(2, false);
      setError(count ? 'Можно выбрать не больше ' + maxCourses + ' курсов.' : 'Выберите хотя бы один курс.');
      find('.onboarding-course-fieldset').focus();
      return false;
    }
    function setBusy(value) {
      busy = value;
      if (!current()) return;
      form.setAttribute('aria-busy', String(value));
      for (const input of form.elements) {
        input.disabled = value || complete || (creationChanged && !input.hasAttribute('data-onboarding-cancel'));
      }
      syncGoal();
      if (!value) form.querySelector('[type=submit]').disabled = complete || conflict || creationChanged;
      status.textContent = value ? 'Сохраняем программу…' : '';
    }
    function next() {
      if (busy || complete) return;
      setError('');
      if (step === 1 && validatePupil()) setStep(2);
      else if (step === 2 && validateCourses()) setStep(3);
    }
    function scrub() {
      form.querySelectorAll('[name=password]').forEach(input => { input.value = ''; input.defaultValue = ''; });
      if (submittedPayload && Object.hasOwn(submittedPayload, 'password')) submittedPayload.password = '';
      submittedPayload = null;
      if (operation) operation.fingerprint = '';
      operation = null;
    }
    async function submit(event) {
      event.preventDefault();
      if (!current() || busy || complete || conflict || creationChanged) return;
      if (step !== 3) { next(); return; }
      if (!validatePupil() || !validateCourses()) return;
      setError('');
      const value = values(), fingerprint = JSON.stringify(value);
      if (!operation || operation.fingerprint !== fingerprint) operation = { fingerprint, id: crypto.randomUUID() };
      const payload = { ...value, opId: operation.id };
      if (!editing) value.password = '';
      if (submittedPayload && Object.hasOwn(submittedPayload, 'password')) submittedPayload.password = '';
      submittedPayload = payload;
      setBusy(true);
      let saved = false;
      try {
        const result = await onSave(payload);
        saved = true;
        if (!current()) return;
        complete = true;
        onComplete?.(result, payload);
        scrub();
      } catch (reason) {
        if (!current()) return;
        if (saved) {
          complete = true;
          setError('Программа сохранена. Закройте это окно и откройте карточку ученика, чтобы посмотреть результат.');
          scrub();
        } else {
          conflict = editing && reason?.code === 'LEARNING_PROFILE_CONFLICT';
          creationChanged = !editing && reason?.code === 'LEARNING_ONBOARDING_CHANGED';
          find('[data-onboarding-conflict]').hidden = !conflict || typeof onReload !== 'function';
          if (conflict) find('[data-onboarding-reload]').hidden = false;
          setError(creationChanged
            ? 'Кабинет уже создан, но его программу или данные входа изменили. Закройте это окно и откройте ученика в списке «Мои ученики», чтобы проверить кабинет и получить актуальную ссылку.'
            : conflict
            ? 'Программу уже изменили в другом окне. Загрузите текущую версию и сравните её со своим выбором.'
            : reason?.name === 'AbortError' || reason instanceof TypeError
              ? 'Ответ сервера не получен. Сохраните выбранные данные и нажмите кнопку сохранения ещё раз: повторная отправка не создаст второго ученика.'
              : errorText?.(reason) || 'Не удалось сохранить программу. Проверьте данные и попробуйте ещё раз.');
        }
      } finally {
        if (saved || !alive) {
          if (Object.hasOwn(payload, 'password')) payload.password = '';
          if (submittedPayload === payload) submittedPayload = null;
        }
        if (current()) setBusy(false);
      }
    }
    async function reload() {
      if (!current() || busy || complete || typeof onReload !== 'function') return;
      setBusy(true); setError('');
      status.textContent = 'Загружаем текущую программу…';
      try {
        const result = await onReload();
        if (!current()) return;
        const profile = result.profile || result;
        if (!Number.isSafeInteger(profile.version) || profile.version < 0) throw Error('INVALID_PROFILE');
        profileVersion = profile.version;
        focusNote = profile.focus || '';
        if (operation) operation.fingerprint = '';
        operation = null; conflict = false;
        find('[data-onboarding-current]').innerHTML = '<h4>Сейчас сохранено</h4>' + summaryMarkup(profile, student.name || 'Ученик')
          + '<p>Ваш выбор в форме сохранён. Сравните программы и нажмите «Сохранить программу», если хотите применить свой вариант.</p>';
        find('[data-onboarding-reload]').hidden = true;
        updateSummary();
      } catch (reason) {
        setError(errorText?.(reason) || 'Не удалось загрузить программу. Попробуйте ещё раз.');
      } finally { if (current()) setBusy(false); }
    }

    listen(form, 'submit', submit);
    listen(find('[data-onboarding-next]'), 'click', next);
    listen(find('[data-onboarding-back]'), 'click', () => { if (!busy && !complete) { setError(''); setStep(Math.max(1, step - 1)); } });
    listen(find('[data-onboarding-cancel]'), 'click', () => { if (!busy) onCancel?.(); });
    listen(find('[data-onboarding-reload]'), 'click', reload);
    listen(find('[data-onboarding-generate]'), 'click', () => {
      if (!busy && typeof generatePassword === 'function') field('password').value = generatePassword();
    });
    listen(form, 'input', event => {
      if (busy || complete) return;
      if (event.target.name === 'name') event.target.setCustomValidity('');
      if (!conflict && !creationChanged) setError('');
      if (event.target.name === 'course') syncGoal();
    });
    listen(form, 'change', event => {
      if (busy || complete) return;
      if (event.target.name === 'course') syncGoal();
      if (event.target.name === 'courseIds') {
        if (chosenIds().length > maxCourses) {
          event.target.checked = false;
          setError('Можно выбрать не больше ' + maxCourses + ' курсов.');
        }
        syncSelection();
      }
    });
    listen(find('[data-onboarding-search]'), 'input', event => {
      const query = event.target.value.trim().toLocaleLowerCase('ru');
      let visible = 0;
      for (const card of section.querySelectorAll('[data-onboarding-course]')) {
        const course = byId.get(card.dataset.onboardingCourse);
        const text = course.title + ' ' + (course.description || '');
        card.hidden = !!query && !text.toLocaleLowerCase('ru').includes(query);
        if (!card.hidden) visible++;
      }
      find('[data-onboarding-no-results]').hidden = visible > 0;
    });
    syncGoal(); syncSelection(); setStep(1, false);
    (editing ? field('grade') : field('name')).focus();

    return {
      destroy() {
        if (!alive) return;
        alive = false;
        listeners.abort();
        scrub();
        onSave = null; onComplete = null; onCancel = null; onReload = null;
        errorText = null; generatePassword = null; focusNote = '';
      }
    };
  }

  root.LearningOnboarding = Object.freeze({ mount });
})(typeof globalThis === 'undefined' ? this : globalThis);
