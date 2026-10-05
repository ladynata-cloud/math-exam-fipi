/* Teacher reports, reviewed plans and two-format homework. No external AI or
 * messaging service is called by this module. */
(function (root) {
  'use strict';
  const E = value => String(value == null ? '' : value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const labels = root.LearningOutcomes && root.LearningOutcomes.labels || { started: 'Начато', together: 'Разобрали вместе', hinted: 'Решено с подсказкой', independent: 'Решено самостоятельно', repeated: 'Самостоятельно повторено', practiced: 'Верно на знакомом задании' };
  const paperTopics = { 'negative-numbers': 'Положительные и отрицательные числа', fractions: 'Обыкновенные дроби', 'linear-equations': 'Линейные уравнения', brackets: 'Уравнения со скобками', proportions: 'Пропорции', percentages: 'Проценты', 'adjacent-angles': 'Смежные углы' };
  const priorityLabels = { high: 'В первую очередь', normal: 'Затем', low: 'Для закрепления' };
  const priorities = Object.keys(priorityLabels);
  const date = raw => raw != null && raw !== '' && Number.isFinite(new Date(raw).getTime()) ? new Date(raw).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  function problem(error) {
    if (error && error.status === 401) return 'Войдите в кабинет снова.';
    if (error && error.status === 403) return 'Для этого действия нет доступа.';
    if (error && error.status === 404) return 'Эта работа недоступна.';
    if (error && error.status === 409) return 'Данные изменились. Обновите страницу перед повторением действия.';
    if (error && error.status === 413) return 'Файл слишком большой. Выберите более компактное изображение.';
    if (error && error.status === 429) return 'Подождите несколько секунд перед следующим действием.';
    return error && error.userMessage || 'Не удалось сохранить. Проверьте подключение и попробуйте ещё раз.';
  }
  function download(filename, contents, type) {
    const url = URL.createObjectURL(new Blob([contents], { type: type || 'text/plain;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function validateRecommendations(raw, catalog) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw Error('Ожидается объект JSON с полем recommendations.');
    if (!Array.isArray(raw.recommendations) || raw.recommendations.length < 1 || raw.recommendations.length > 30) throw Error('Нужно от 1 до 30 рекомендаций.');
    const seen = new Set();
    const recommendations = raw.recommendations.map((item, index) => {
      if (!item || typeof item !== 'object' || Array.isArray(item) || typeof item.catalogId !== 'string' || !catalog.get(item.catalogId)) throw Error('Неизвестный тренажёр в рекомендации ' + (index + 1) + '.');
      if (seen.has(item.catalogId)) throw Error('Тренажёр повторяется: ' + catalog.get(item.catalogId).title + '.');
      seen.add(item.catalogId);
      if (typeof item.reason !== 'string' || !item.reason.trim() || item.reason.length > 1000) throw Error('У каждой рекомендации должна быть причина до 1000 символов.');
      if (!priorities.includes(item.priority)) throw Error('Приоритет должен быть high, normal или low.');
      return { catalogId: item.catalogId, reason: item.reason.trim(), priority: item.priority };
    });
    if (raw.parentNote != null && (typeof raw.parentNote !== 'string' || raw.parentNote.length > 4000)) throw Error('Комментарий родителям должен быть текстом до 4000 символов.');
    return { recommendations, parentNote: raw.parentNote || '' };
  }
  function safePhotoUrl(value) {
    try { const url = new URL(value, location.origin); return url.origin === location.origin && /^\/api\/learning\/photos\/[a-zA-Z0-9_-]+$/.test(url.pathname) && !url.search && !url.hash ? url.href : ''; } catch (_) { return ''; }
  }
  async function preparePhoto(file) {
    if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw Object.assign(Error('image_type'), { userMessage: 'Выберите изображение JPG, PNG или WebP.' });
    if (file.size > 20 * 1024 * 1024) throw Object.assign(Error('image_size'), { userMessage: 'Исходное изображение должно быть меньше 20 МБ.' });
    const image = await createImageBitmap(file, { imageOrientation: 'from-image' });
    try {
      if (image.width < 16 || image.height < 16) throw Object.assign(Error('image_dimensions'), { userMessage: 'Изображение слишком маленькое: нужны хотя бы 16 × 16 пикселей.' });
      if (image.width * image.height > 40000000) throw Object.assign(Error('image_pixels'), { userMessage: 'Изображение слишком большое. Сохраните его копию меньшего размера.' });
      let scale = Math.min(1, 3000 / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      let blob;
      for (let attempt = 0; attempt < 6; attempt++) {
        canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext('2d'); context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(image, 0, 0, canvas.width, canvas.height);
        blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', attempt === 0 ? 0.94 : 0.88));
        if (blob && blob.size <= 3 * 1024 * 1024) break;
        scale *= 0.8;
      }
      if (!blob || blob.size > 3 * 1024 * 1024) throw Object.assign(Error('image_size'), { userMessage: 'Не удалось подготовить изображение меньше 3 МБ.' });
      const data = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.onerror = reject; reader.readAsDataURL(blob); });
      const base = file.name.replace(/\.[^.]+$/, '').replace(/[^\p{L}\p{N} _.-]/gu, '').trim().slice(0, 80) || 'reshenie';
      return { filename: base + '.jpg', mime: 'image/jpeg', data, blob, width: canvas.width, height: canvas.height };
    } finally { image.close(); }
  }
  function itemFor(attempt, catalog) { return attempt && catalog.items.find(item => item.trainerId === attempt.trainerId && item.contentId === attempt.contentId); }

  function mount(host, config) {
    const context = config || {}, api = context.api, catalog = context.catalog || root.LearningCatalog;
    if (!host || typeof api !== 'function' || !catalog) throw TypeError('Teaching context is required');
    const teacher = context.account && context.account.role === 'teacher';
    let alive = true, photoUrl = '', prepared = null, generation = 0, batchSelection = null, feedbackDraft = null, readinessTimer = null;
    const publishOperations = new Map();
    const section = document.createElement('section'); section.className = 'teaching-screen'; host.replaceChildren(section);
    const active = () => alive && section.isConnected;
    const post = (path, body) => api(path, { method: 'POST', body: JSON.stringify(body) });
    const tell = (text, error) => { if (active() && context.notice) context.notice(text, !!error); };
    const navigate = hash => context.navigate ? context.navigate(hash) : (location.hash = hash);
    const $ = selector => section.querySelector(selector);
    const on = (selector, type, handler) => { const element = $(selector); if (element) element.addEventListener(type, handler); };
    const mutation = async (form, path, body) => {
      const signature = JSON.stringify(body);
      if (form._operationSignature !== signature) { form._operationSignature = signature; form._operationId = crypto.randomUUID(); }
      const result = await post(path, { opId: form._operationId, ...body });
      delete form._operationSignature; delete form._operationId;
      return result;
    };
    async function act(button, work) {
      button.disabled = true;
      try { await work(); } catch (error) { tell(problem(error), true); }
      finally { if (button.isConnected) button.disabled = false; }
    }
    const back = (hash, title) => `<a class="teaching-back" href="#${E(hash)}">← ${E(title)}</a>`;
    function loading() { section.innerHTML = '<p class="status-line" role="status">Открываем учебную историю…</p>'; }
    function failure(error) { if (active()) section.innerHTML = `<div class="empty"><h2>Не удалось открыть</h2><p>${E(problem(error))}</p><button type="button" data-retry>Попробовать снова</button></div>`; on('[data-retry]', 'click', load); }

    function renderReports() {
      const students = context.students || [];
      section.innerHTML = `<div class="page-heading"><div><p class="eyebrow">УЧЕБНАЯ ИСТОРИЯ</p><h1>Результаты и планы</h1><p>Откройте ученика: ход работы, следующий шаг и отчёт для родителей.</p></div></div><div class="list">${students.length ? students.map(student => `<article class="list-row"><div><h2>${E(student.name || student.displayName || student.login)}</h2><p>Индивидуальная история и план занятий</p></div><a class="button" href="#student=${encodeURIComponent(student.id)}">Открыть →</a></article>`).join('') : '<div class="empty">Добавьте ученика в разделе «Ученики».</div>'}</div>`;
    }
    async function renderStudent() {
      const id = encodeURIComponent(context.id);
      const [reportResult, planResult, draftsResult] = await Promise.all([api('/teacher/students/' + id + '/report'), api('/teacher/students/' + id + '/plan'), api('/teacher/students/' + id + '/ai-drafts')]);
      if (!active()) return;
      const report = reportResult.report || reportResult;
      const student = report.student || (context.students || []).find(person => person.id === context.id) || {};
      const attempts = report.attempts || [];
      const summary = report.counts || report.summary || {};
      const plan = planResult.plan || planResult;
      const planItems = Array.isArray(plan.items) ? plan.items : [];
      const savedDrafts = Array.isArray(draftsResult.drafts) ? draftsResult.drafts.slice(0, 10) : [];
      const parentText = typeof report.parentReport === 'string' ? report.parentReport : report.parentReport && report.parentReport.text || report.parentText || '';
      const independent = attempts.filter(attempt => !attempt.archivedAt && ['independent', 'repeated'].includes(attempt.outcome));
      const strengths = [...new Set(independent.map(attempt => attempt.title || itemFor(attempt, catalog)?.title).filter(Boolean))].slice(0, 6);
      const parentFallback = `${student.name || student.displayName || 'Ученик'}\nОтчёт за ${date(report.generatedAt || new Date().toISOString())}\n\n${Object.keys(labels).map(key => labels[key] + ': ' + (Number.isFinite(summary[key]) ? summary[key] : attempts.filter(attempt => attempt.outcome === key && !attempt.archivedAt).length)).join('\n')}\n\nСамостоятельные решения:\n${strengths.length ? strengths.join('\n') : 'Самостоятельных решений пока нет в сохранённой истории.'}\n\nСледующие шаги:\n${planItems.map(item => (catalog.get(item.catalogId)?.title || 'Тренажёр') + ' — ' + item.reason).join('\n') || 'План уточняется с преподавателем.'}\n\nЭто результаты конкретных попыток. Одно решение не означает освоение всей темы или номера ЕГЭ. Письменные работы по фотографиям проверяются преподавателем отдельно.`;
      const printText = parentText || parentFallback;
      section.innerHTML = `${back('reports', 'Все ученики')}<div class="page-heading"><div><p class="eyebrow">ЛИЧНАЯ ИСТОРИЯ</p><h1>${E(student.name || student.displayName || student.login || 'Ученик')}</h1><p>Видно, что получилось самостоятельно и где понадобилась помощь.</p></div><a class="button primary" href="#assignments">Домашние задания →</a></div>
        <div class="teaching-stat-grid">${Object.keys(labels).map(key => `<div class="teaching-stat"><strong>${E(Number.isFinite(summary[key]) ? summary[key] : attempts.filter(attempt => attempt.outcome === key && !attempt.archivedAt).length)}</strong><span>${E(labels[key])}</span></div>`).join('')}</div>
        <div class="teaching-columns"><section class="panel"><h2>Следующие шаги</h2><p class="teaching-muted">План проверяет и сохраняет преподаватель.</p><form id="teaching-plan" class="form-stack"><div class="teaching-plan-items">${planItems.map((item, index) => planRow(item, index)).join('')}</div><div class="actions"><button type="button" data-add-plan>Добавить тренажёр</button><button class="primary" type="submit">Сохранить план</button></div><label>Комментарий к плану<textarea name="note" maxlength="4000" rows="3">${E(plan.note || '')}</textarea></label><p class="form-error" role="alert"></p></form></section>
        <section class="panel teaching-parent-report"><p class="eyebrow">ДЛЯ РОДИТЕЛЕЙ</p><h2>Понятный итог</h2><p class="teaching-muted no-print">Проверьте текст перед передачей. Он остаётся у Вас, пока Вы сами его не отправите.</p><textarea id="teaching-parent-text" rows="12" aria-label="Текст отчёта для родителей">${E(printText)}</textarea><pre class="teaching-print-text"></pre><div class="actions no-print"><button type="button" data-parent-print>Печать / PDF</button><button type="button" data-parent-download>Скачать текст</button></div></section></div>
        <section class="panel teaching-section"><div class="section-heading"><h2>Работа ученика</h2><span class="badge">${attempts.length} попыток</span></div><div class="teaching-table-wrap"><table class="teaching-table"><thead><tr><th>Тренажёр</th><th>Результат</th><th>Обновлено</th><th></th></tr></thead><tbody>${attempts.map(attempt => `<tr><td>${E(itemFor(attempt, catalog)?.title || attempt.title || 'Задание')}${attempt.archivedAt ? '<small>Архив до нового отсчёта</small>' : ''}</td><td>${E(labels[attempt.outcome] || 'Начато')}</td><td>${E(date(attempt.updatedAt))}</td><td><a href="#attempt=${encodeURIComponent(attempt.id)}">Посмотреть</a></td></tr>`).join('') || '<tr><td colspan="4">Ученик ещё не начал работу.</td></tr>'}</tbody></table></div></section>
        <details class="panel teaching-section"><summary>Результаты по заданиям ЕГЭ №1–21</summary><p class="teaching-muted">Учитываются конкретные попытки. Число самостоятельных решений не означает, что весь номер освоен.</p><div class="teaching-position-grid">${(report.positions || []).map(position => `<article><b>№${E(position.position)}</b><span>${E(position.started)} попыток</span><small>Самостоятельно: ${E(position.independentlySolved)}<br>Типов задач: ${E(position.contentCount)}</small></article>`).join('')}</div></details>
        <section class="panel teaching-section"><h2>Домашние и письменные работы</h2><div class="list">${(report.assignments || []).map(assignment => `<article class="list-row"><div><b>${E(assignment.title)}</b><p class="teaching-muted">${E(assignment.status !== 'published' ? ({draft:'Черновик',archived:'В архиве'}[assignment.status] || assignment.status) : assignment.submission?.stale ? 'Есть изменения после отправки' : ({submitted:'Отправлено',reviewed:'Проверено',revise:'Нужно исправить',accepted:'Проверено'}[assignment.submission?.status] || 'Выдано'))}${assignment.paperReady ? ' · Авторское задание' : ''} · Фото условия: ${E(assignment.taskPhotos)} · Фото решения: ${E(assignment.solutionPhotos)}</p>${assignment.photoReview ? `<p>Последний комментарий преподавателя · ${E(date(assignment.photoReview.createdAt))}: ${E(assignment.photoReview.text)}</p>` : '<p class="teaching-muted">Письменная работа ещё не проверена.</p>'}</div><a href="#assignment=${encodeURIComponent(assignment.id)}">Открыть</a></article>`).join('') || '<p class="teaching-muted">Домашних работ пока нет.</p>'}</div></section>
        <section class="panel teaching-section"><p class="eyebrow">ПОДГОТОВИТЬ ПЛАН</p><h2>Помощь ИИ под Вашим контролем</h2><p>Скачайте обезличенный пакет с учебными результатами и инструкцией. Ответ можно вставить сюда, проверить и сохранить как черновик.</p><div class="actions"><button type="button" data-ai-package>Скачать пакет для ИИ</button></div><details class="teaching-ai-import"><summary>Вставить рекомендации ИИ</summary><form id="teaching-ai" class="form-stack"><label>Ответ в формате JSON<textarea name="recommendations" rows="7" maxlength="50000" spellcheck="false" placeholder='{"recommendations":[{"catalogId":"path:triangle","reason":"Нужно закрепить выбор высоты","priority":"high"}],"parentNote":""}' required></textarea></label><p class="teaching-muted">Проверяются существующие тренажёры, причины и приоритеты. Черновик не назначает ученику работу.</p><button class="primary" type="submit">Проверить и сохранить черновик</button><p class="form-error" role="alert"></p></form><div class="teaching-ai-preview"></div></details>${savedDrafts.length ? `<details class="teaching-ai-saved"><summary>Сохранённые черновики ИИ (${savedDrafts.length})</summary><div class="list">${savedDrafts.map((draft,index)=>`<article class="list-row"><div><b>${E(date(draft.createdAt))}</b><p class="teaching-muted">${E(draft.recommendations.length)} рекомендаций · ожидает проверки</p></div><button type="button" data-open-ai="${index}">Открыть для проверки</button></article>`).join('')}</div></details>` : ''}</section>
        <details class="panel teaching-section teaching-reset"><summary>Начать отсчёт прогресса заново</summary><p>Предыдущие решения остаются в архиве. Новый отсчёт нужен, например, чтобы повторно проверить тему после перерыва.</p><form id="teaching-reset" class="form-stack"><label>Какую часть начать заново<select name="scope"><option value="topic">Одну тему</option><option value="content">Один тренажёр</option><option value="all">Весь курс ученика</option></select></label><label data-reset-target>Тема<select name="value">${catalog.topics.map(topic => `<option value="${E(topic.id)}">${E(topic.title)}</option>`).join('')}</select></label><label>Причина<textarea name="reason" rows="2" maxlength="1000" required placeholder="Например: повторная проверка после каникул"></textarea></label><label class="teaching-check"><input name="confirm" type="checkbox" required>Понимаю, что текущий прогресс выбранной части начнётся заново, а прежняя история сохранится.</label><button type="submit">Начать новый отсчёт</button><p class="form-error" role="alert"></p></form></details>`;
      function planRow(item, index) {
        return `<div class="teaching-plan-row" data-plan-row><label>Тренажёр<select name="catalogId">${catalog.items.map(entry => `<option value="${E(entry.id)}"${entry.id === item.catalogId ? ' selected' : ''}>${E(entry.title)}</option>`).join('')}</select></label><label>Зачем это задание<textarea name="reason" maxlength="1000" rows="2" required>${E(item.reason || '')}</textarea></label><div class="actions"><label>Приоритет<select name="priority">${priorities.map(priority => `<option value="${priority}"${priority === (item.priority || 'normal') ? ' selected' : ''}>${priorityLabels[priority]}</option>`).join('')}</select></label><button type="button" data-remove-plan aria-label="Убрать рекомендацию ${index + 1}">Убрать</button></div></div>`;
      }
      function bindRows() { section.querySelectorAll('[data-remove-plan]').forEach(button => { button.onclick = () => button.closest('[data-plan-row]').remove(); }); }
      bindRows();
      on('[data-add-plan]', 'click', () => { const container = $('.teaching-plan-items'); if (container.children.length >= 30) return tell('В плане может быть до 30 тренажёров.', true); container.insertAdjacentHTML('beforeend', planRow({ catalogId: catalog.items[0].id }, container.children.length)); bindRows(); });
      on('#teaching-plan', 'submit', event => {
        event.preventDefault(); const form = event.currentTarget, button = form.querySelector('[type=submit]');
        act(button, async () => {
          const items = [...form.querySelectorAll('[data-plan-row]')].map(row => ({ catalogId: row.querySelector('[name=catalogId]').value, reason: row.querySelector('[name=reason]').value.trim(), priority: row.querySelector('[name=priority]').value }));
          if (items.length) { try { validateRecommendations({ recommendations: items }, catalog); } catch (error) { form.querySelector('.form-error').textContent = error.message; return; } }
          await mutation(form, '/teacher/students/' + id + '/plan', { items, note: form.elements.note.value.trim() }); tell('План сохранён.');
        });
      });
      on('[data-parent-download]', 'click', () => download('otchet-roditelyam.txt', $('#teaching-parent-text').value));
      on('[data-parent-print]', 'click', () => { $('.teaching-print-text').textContent = $('#teaching-parent-text').value; document.body.classList.add('printing-parent-report'); const cleanup = () => { document.body.classList.remove('printing-parent-report'); window.removeEventListener('afterprint', cleanup); }; window.addEventListener('afterprint', cleanup); window.print(); });
      on('[data-ai-package]', 'click', event => act(event.currentTarget, async () => { const data = await api('/teacher/students/' + id + '/ai-package'); download('uchebnye-dannye-dlya-ai.json', JSON.stringify(data, null, 2), 'application/json'); tell('Пакет скачан.'); }));
      function showAiDraft(checked) {
          $('.teaching-ai-preview').innerHTML = `<h3>Черновик сохранён</h3><p>Выберите рекомендации для учебного плана.</p>${checked.recommendations.map((item, index) => `<label class="teaching-ai-choice"><input type="checkbox" data-ai-choice="${index}"><span><b>${E(catalog.get(item.catalogId).title)}</b><small>${E(priorityLabels[item.priority])}</small>${E(item.reason)}</span></label>`).join('')}<button type="button" data-ai-to-plan>Добавить выбранное в план для проверки</button>${checked.parentNote ? `<div class="teaching-parent-draft"><h4>Предложенный комментарий родителям</h4><p>${E(checked.parentNote)}</p><button type="button" data-ai-parent-note>Добавить в черновик отчёта для редактирования</button></div>` : ''}`;
          on('[data-ai-parent-note]', 'click', () => { $('#teaching-parent-text').value += '\n\nЧерновик комментария для проверки преподавателем:\n' + checked.parentNote; $('#teaching-parent-text').scrollIntoView({behavior:'smooth',block:'center'}); });
          on('[data-ai-to-plan]', 'click', () => {
            const existing = new Set([...section.querySelectorAll('[data-plan-row] [name=catalogId]')].map(element => element.value));
            const container = $('.teaching-plan-items');
            section.querySelectorAll('[data-ai-choice]:checked').forEach(element => { const item = checked.recommendations[Number(element.dataset.aiChoice)]; if (!existing.has(item.catalogId) && container.children.length < 30) { container.insertAdjacentHTML('beforeend', planRow(item, container.children.length)); existing.add(item.catalogId); } });
            bindRows(); $('#teaching-plan').scrollIntoView({ behavior: 'smooth', block: 'start' }); tell('Рекомендации добавлены в форму. Проверьте и сохраните план.');
          });
      }
      section.querySelectorAll('[data-open-ai]').forEach(button => button.addEventListener('click', () => {
        const draft = savedDrafts[Number(button.dataset.openAi)];
        try { const checked = validateRecommendations(draft, catalog); $('.teaching-ai-import').open = true; showAiDraft(checked); $('.teaching-ai-preview').scrollIntoView({behavior:'smooth',block:'start'}); } catch (error) { tell(error.message, true); }
      }));
      on('#teaching-ai', 'submit', event => {
        event.preventDefault(); const form = event.currentTarget;
        act(form.querySelector('[type=submit]'), async () => {
          let checked;
          try { checked = validateRecommendations(JSON.parse(form.elements.recommendations.value), catalog); } catch (error) { form.querySelector('.form-error').textContent = error instanceof SyntaxError ? 'Не удалось прочитать JSON. Вставьте только объект, без ограждения ```.' : error.message; return; }
          await mutation(form, '/teacher/students/' + id + '/ai-drafts', checked);
          if (!active()) return;
          form.querySelector('.form-error').textContent = '';
          showAiDraft(checked);
        });
      });
      on('#teaching-reset [name=scope]', 'change', event => {
        const field = $('[data-reset-target]'), select = field.querySelector('select'), scope = event.target.value;
        field.hidden = scope === 'all'; select.disabled = scope === 'all';
        select.innerHTML = (scope === 'content' ? catalog.items : catalog.topics).map(item => `<option value="${E(item.id)}">${E(item.title)}</option>`).join('');
        field.firstChild.textContent = scope === 'content' ? 'Тренажёр' : 'Тема';
      });
      on('#teaching-reset', 'submit', event => {
        event.preventDefault(); const form = event.currentTarget;
        act(form.querySelector('[type=submit]'), async () => {
          if (!form.elements.confirm.checked) return;
          const scope = form.elements.scope.value, body = { scope, reason: form.elements.reason.value.trim(), ...(scope === 'all' ? {} : { value: form.elements.value.value }) };
          await mutation(form, '/teacher/students/' + id + '/reset', body); tell('Новый отсчёт начат. Предыдущая история сохранена в архиве.'); if (context.onRefresh) await context.onRefresh(); else await load();
        });
      });
    }

    async function renderAssignment() {
      const id = encodeURIComponent(context.id), result = await api('/assignments/' + id);
      if (!active()) return;
      const assignment = result.assignment, attempt = result.attempt || assignment.attempt;
      const photos = result.photos || [], feedback = result.feedback || [], paper = result.paper || null;
      const submission = attempt?.submission || null;
      const workStatus = assignment.status === 'draft' ? 'Черновик' : assignment.status === 'archived' ? 'В архиве' : submission?.stale ? 'Есть изменения после отправки' : ({ submitted: 'Отправлено', reviewed: 'Проверено', revise: 'Нужно исправить', accepted: 'Проверено' }[submission?.status] || 'Выдано');
      const taskPhotos = photos.filter(photo => photo.kind === 'task'), solutionPhotos = photos.filter(photo => photo.kind === 'solution');
      const item = itemFor(attempt, catalog);
      const defaultPaperTopic = paper?.topic || (/fraction/.test(item?.contentId || '') ? 'fractions' : /percent/.test(item?.contentId || '') ? 'percentages' : /angle/.test(item?.contentId || '') ? 'adjacent-angles' : /negative|integer/.test(item?.contentId || '') ? 'negative-numbers' : 'linear-equations');
      const newPhotos = solutionPhotos.some(photo => !(submission?.photoIds || []).includes(photo.id));
      const alreadySent = submission && !submission.stale && !newPhotos;
      const batch = teacher && assignment.batchId && Array.isArray(result.batchAssignments) ? result.batchAssignments : [];
      const grouped = batch.length > 1, drafts = batch.filter(entry => entry.status === 'draft');
      if (grouped && batchSelection === null) batchSelection = new Set(drafts.map(entry => entry.id));
      const selectedTargets = () => grouped ? [...section.querySelectorAll('[data-batch-target]:checked')].map(input => input.value) : [assignment.id];
      const nameOf = entry => (context.students || []).find(student => student.id === entry.learnerId)?.name || 'Ученик';
      batch.sort((a, b) => nameOf(a).localeCompare(nameOf(b), 'ru', { numeric: true }));
      const ready = entry => !!entry.paperReady || (entry.taskPhotos || 0) > 0 || (entry.id === assignment.id && (!!paper || taskPhotos.length > 0));
      section.innerHTML = `${back('assignments', 'Задания')}<div class="page-heading"><div><p class="eyebrow">${assignment.status === 'archived' ? 'АРХИВ УЧЕБНОЙ РАБОТЫ' : assignment.status === 'published' ? 'ДОМАШНЯЯ РАБОТА' : 'ЧЕРНОВИК ЗАДАНИЯ'}</p><h1>${E(assignment.title)}</h1><p>${assignment.dueAt ? 'Выполнить до ' + E(date(assignment.dueAt)) : 'Срок не указан'}</p></div>${teacher && assignment.status === 'draft' && !grouped ? `<button class="primary" data-publish${(taskPhotos.length || paper) && attempt ? '' : ' disabled'}>Выдать ученику</button>` : ''}</div>
        ${teacher && assignment.status === 'draft' ? `<div class="teaching-draft-notice"><b>Перед выдачей подготовьте оба формата</b><p>${attempt ? '✓ Тренажёр прикреплён.' : 'Нужно выбрать тренажёр.'} ${paper ? '✓ Авторская письменная работа составлена.' : taskPhotos.length ? '✓ Фото условия прикреплено.' : 'Составьте авторскую письменную работу или добавьте фотографию условия ниже.'} Ученик увидит задание после нажатия «Выдать ученику».</p></div>` : ''}
        ${assignment.status === 'archived' ? '<div class="teaching-draft-notice"><b>Работа сохранена в архиве</b><p>После нового отсчёта здесь доступны прежние условия, фотографии и комментарии. Эту работу можно просматривать.</p></div>' : ''}
        ${grouped ? `<section class="panel teaching-batch"><h2>Общее задание для группы</h2><p>${drafts.length ? 'Один раз выберите фото условия и прикрепите его всем отмеченным ученикам. Решения каждого сохраняются отдельно.' : 'Откройте нужного ученика, чтобы посмотреть его фотографии и проверить решение.'}</p><fieldset><legend>Кому прикрепить фото и выдать задание</legend><div class="teaching-batch-targets">${batch.map(entry => `<label class="teaching-check"><input type="checkbox" data-batch-target value="${E(entry.id)}"${entry.status !== 'draft' ? ' disabled' : batchSelection.has(entry.id) ? ' checked' : ''}><span><a href="#assignment=${encodeURIComponent(entry.id)}">${E(nameOf(entry))}</a>${entry.id === assignment.id ? ' <span class="teaching-current">Открыто</span>' : ''}<small>${entry.status === 'published' ? 'Уже выдано' : entry.status === 'archived' ? 'В архиве' : ready(entry) ? 'Письменное задание готово' : 'Ждёт письменное задание'}</small></span></label>`).join('')}</div></fieldset><div class="actions"><button class="primary" type="button" data-publish-batch>Выдать выбранным ученикам</button></div><p class="teaching-muted" data-batch-progress aria-live="polite"></p></section>` : ''}
        <p class="teaching-work-status" data-work-status role="status"><b>${E(workStatus)}</b>${submission?.submittedAt ? ' · Отправлено ' + E(date(submission.submittedAt)) : ''}</p>
        ${teacher && assignment.status === 'draft' ? `<section class="panel teaching-section"><h2>Авторская домашняя работа</h2><p>Дополнительные задачи для тетради. Условие сохранится без изменений после выдачи; ответы видны только Вам.${grouped ? ' Здесь составляется вариант для открытого ученика.' : ''}</p><form id="teaching-paper" class="form-stack"><label>Тема письменной работы<select name="topic">${Object.entries(paperTopics).map(([key,title]) => `<option value="${E(key)}"${key === defaultPaperTopic ? ' selected' : ''}>${E(title)}</option>`).join('')}</select></label><button type="submit" class="primary">${paper ? 'Составить новый вариант' : 'Составить авторскую домашку'}</button><p class="form-error" role="alert"></p></form></section>` : ''}
        <div class="teaching-columns teaching-section"><section class="panel"><p class="eyebrow">НА САЙТЕ</p><h2>${E(item?.title || 'Тренажёр')}</h2><p>Текущий шаг и ответы сохраняются в личной истории.</p>${attempt ? `<a class="button primary" href="#attempt=${encodeURIComponent(attempt.id)}">${teacher ? 'Посмотреть работу' : 'Открыть тренажёр'} →</a><p class="teaching-muted">${E(labels[attempt.outcome] || 'Начато')}</p>` : '<p>Тренажёр ещё не прикреплён.</p>'}</section><section class="panel"><p class="eyebrow">В ТЕТРАДИ</p><h2>Условие для письменной работы</h2><p>${paper ? 'Ниже — дополнительные авторские задачи. Решите их в тетради и пришлите фотографии Наталье Михайловне в вашем чате в MAX. Покажите условие и весь ход решения.' : 'Откройте фото крупно и решайте в удобном темпе.'}</p>${taskPhotos.length || !paper ? gallery(taskPhotos, 'Письменное задание ещё не подготовлено.') : `<p class="badge">${paper.tasks.length} авторских задач · вариант ${E(paper.revision)}</p>`}</section></div>
        ${paper ? `<section class="panel teaching-section teaching-paper-sheet"><p class="eyebrow">ДОПОЛНИТЕЛЬНО К УЧЕБНИКУ</p><h2>${E(paper.title)}</h2><p class="teaching-muted">${E(assignment.title)} · вариант ${E(paper.revision)}</p><p>${E(paper.instructions)}</p><ol class="teaching-paper-tasks">${paper.tasks.map(task => `<li>${E(task.prompt)}</li>`).join('')}</ol><div class="actions no-print"><button type="button" data-paper-print>Печать / PDF</button><button type="button" data-paper-download>Скачать условия</button></div>${teacher && Array.isArray(paper.answerKeys) ? `<details class="teaching-paper-answers no-print" data-paper-answers><summary>Ответы для преподавателя</summary><p>Ученику эта часть недоступна. В печать и скачивание попадают только условия.</p><ol>${paper.answerKeys.map(key => `<li><b>${E(key.answer)}</b><p>${E(key.explanation)}</p></li>`).join('')}</ol></details>` : ''}</section>` : ''}
        <section class="panel teaching-section"><h2>${teacher ? 'Письменные решения в кабинете' : 'Копии решений в кабинете'}</h2><p class="teaching-muted">Бумажную работу можно отправить Наталье Михайловне в MAX. Фотографии из мессенджера не появляются здесь автоматически; дублировать их на сайте не обязательно.</p>${gallery(solutionPhotos, 'Фотографии решения ещё не добавлены.')}</section>
        ${assignment.status !== 'archived' && (!teacher || assignment.status === 'draft' || grouped && drafts.length) ? `<section class="panel teaching-section"><h2>${teacher ? 'Добавить фото условия' : 'Дополнительно: сохранить фото в кабинете'}</h2><form id="teaching-photo" class="form-stack"><label class="teaching-photo-label"><span>Фотография или скан</span><span class="teaching-photo-choice">Выбрать фотографию</span><span class="teaching-muted" data-file-name>Файл не выбран</span><input class="teaching-photo-input" aria-label="Фотография или скан" name="photo" type="file" accept="image/jpeg,image/png,image/webp" required></label><p class="teaching-muted">JPG, PNG или WebP. Перед отправкой проверьте, читаются ли числа, знаки и весь ход решения.</p><div class="teaching-photo-preview" hidden><img alt="Предпросмотр выбранной фотографии"><p data-photo-info></p></div><button class="primary" type="submit" disabled>${grouped && teacher ? 'Прикрепить выбранным ученикам' : 'Отправить фото'}</button><p class="form-error" role="alert"></p></form></section>` : ''}
        ${!teacher && assignment.status === 'published' && attempt ? `<section class="panel teaching-section teaching-submit"><h2>Сдача через кабинет — по желанию</h2><p>${solutionPhotos.length ? 'Проверьте, что прикреплены все страницы и виден ход решения. Отправка передаст сохранённую работу преподавателю.' : 'Если отправляете через кабинет, сначала прикрепите фото. Если работа уже отправлена в MAX, повторная отправка здесь не нужна.'}</p><button type="button" class="primary" data-submit-work${!solutionPhotos.length || alreadySent ? ' disabled' : ''}>${alreadySent ? submission.status === 'revise' ? 'Добавьте исправленное решение' : 'Работа отправлена' : 'Сдать Наталье Михайловне'}</button><p class="teaching-muted" data-submit-save-pending hidden>Сдача станет доступна, когда все действия этой работы сохранятся на сервере. При проблеме откройте тренажёр: там можно сохранить копию неподтверждённых действий.</p><p class="teaching-muted" data-submit-photo-pending hidden>Сначала прикрепите выбранную фотографию. После загрузки можно сдать работу.</p><p class="teaching-muted">Отправка не означает, что все решения верны. Результат проверки появится ниже.</p></section>` : ''}
        <section class="panel teaching-section"><h2>Обратная связь</h2><div class="teaching-feedback">${(Array.isArray(feedback) ? feedback : feedback ? [feedback] : []).map(entry => `<article><span class="badge">${E({ reviewed: 'Проверено', revise: 'Нужно исправить', accepted: 'Принято' }[entry.status] || 'Комментарий')}</span><p>${E(entry.text)}</p><small>${E(date(entry.createdAt))}</small></article>`).join('') || '<p class="teaching-muted">Комментариев пока нет.</p>'}</div>${teacher && assignment.status !== 'archived' ? '<form id="teaching-feedback" class="form-stack"><label>Комментарий ученику<textarea name="text" rows="4" maxlength="4000" required placeholder="Что получилось и какой шаг стоит исправить"></textarea></label><label>Результат проверки<select name="status"><option value="reviewed">Проверено</option><option value="revise">Нужно исправить</option><option value="accepted">Принято</option></select></label><button class="primary" type="submit">Сохранить комментарий</button><p class="form-error" role="alert"></p><button type="button" data-feedback-refresh hidden>Обновить решения, сохранив комментарий</button></form>' : ''}</section>`;
      function gallery(list, empty) {
        return list.length ? `<div class="teaching-photo-grid">${list.map(photo => { const url = safePhotoUrl(photo.url); return url ? `<figure><a href="${E(url)}" target="_blank" rel="noopener"><img src="${E(url)}" alt="${E(photo.filename || (photo.kind === 'task' ? 'Условие задания' : 'Решение ученика'))}" loading="lazy"></a><figcaption>${E(photo.filename)} <small>${E(date(photo.createdAt))}</small></figcaption></figure>` : ''; }).join('')}</div>` : `<p class="teaching-muted">${E(empty)}</p>`;
      }
      on('#teaching-paper', 'submit', event => {
        event.preventDefault(); const form = event.currentTarget;
        act(form.querySelector('[type=submit]'), async () => { await mutation(form, '/assignments/' + id + '/paper', { topic: form.elements.topic.value }); tell('Авторская работа составлена. Проверьте условия и выдайте ученику.'); await load(); });
      });
      on('[data-paper-download]', 'click', () => download('avtorskaya-domashnyaya-rabota.txt', `${assignment.title}\n${paper.title} · вариант ${paper.revision}\n\n${paper.instructions}\n\n${paper.tasks.map((task, index) => `${index + 1}. ${task.prompt}`).join('\n\n')}`));
      on('[data-paper-print]', 'click', () => { document.body.classList.add('printing-paper-homework'); const cleanup = () => { document.body.classList.remove('printing-paper-homework'); window.removeEventListener('afterprint', cleanup); }; window.addEventListener('afterprint', cleanup); window.print(); });
      const pendingPhoto = () => !!prepared || !!$('#teaching-photo [name=photo]')?.files.length;
      const savedWorkReady = () => typeof context.canSubmitAttempt !== 'function' || context.canSubmitAttempt(attempt.id, { quiet: true });
      const submitButton = $('[data-submit-work]'), photoPendingNote = $('[data-submit-photo-pending]'), savePendingNote = $('[data-submit-save-pending]');
      let submitting = false, waitingForSave = submitButton && !savedWorkReady();
      const updateSubmitState = () => {
        if (submitButton?.isConnected) submitButton.disabled = submitting || !solutionPhotos.length || !!alreadySent || pendingPhoto() || !savedWorkReady();
        if (photoPendingNote?.isConnected) photoPendingNote.hidden = !pendingPhoto();
        if (savePendingNote?.isConnected) savePendingNote.hidden = savedWorkReady();
      };
      updateSubmitState();
      if (submitButton) readinessTimer = setInterval(() => {
        if (!submitButton.isConnected) return;
        const ready = savedWorkReady(); updateSubmitState();
        // The assignment was opened before an online action was acknowledged.
        // Reload its confirmed revision once it is saved. Never discard a new
        // selected photo: its upload will reload the assignment itself.
        if (waitingForSave && ready && !pendingPhoto() && !submitting) { waitingForSave = false; load(); }
        else if (!ready) waitingForSave = true;
      }, 500);
      on('[data-submit-work]', 'click', event => {
        if (pendingPhoto()) { tell('Сначала прикрепите выбранную фотографию. Дождитесь подтверждения загрузки.', true); updateSubmitState(); return; }
        if (typeof context.canSubmitAttempt === 'function' && !context.canSubmitAttempt(attempt.id)) return;
        submitting = true;
        act(event.currentTarget, async () => { await mutation(event.currentTarget, '/attempts/' + encodeURIComponent(attempt.id) + '/submit', { expectedVersion: attempt.version }); tell('Работа отправлена Наталье Михайловне.'); await load(); }).finally(() => { submitting = false; updateSubmitState(); });
      });
      if (grouped) {
        const updateBatch = () => {
          const targets = selectedTargets(); batchSelection = new Set(targets);
          $('[data-publish-batch]').disabled = !targets.length || targets.some(target => !ready(batch.find(entry => entry.id === target)));
        };
        section.querySelectorAll('[data-batch-target]').forEach(input => input.addEventListener('change', updateBatch)); updateBatch();
        on('[data-publish-batch]', 'click', event => act(event.currentTarget, async () => {
          const targets = selectedTargets();
          for (let index = 0; index < targets.length; index++) {
            const target = targets[index]; if (!publishOperations.has(target)) publishOperations.set(target, crypto.randomUUID());
            $('[data-batch-progress]').textContent = `Выдаём задание: ${index + 1} из ${targets.length}…`;
            await post('/assignments/' + encodeURIComponent(target) + '/publish', { opId: publishOperations.get(target) });
            if (!active()) return;
          }
          tell('Задание выдано выбранным ученикам.'); if (context.onRefresh) await context.onRefresh(); else await load();
        }));
      }
      on('[data-publish]', 'click', event => act(event.currentTarget, async () => { await mutation(event.currentTarget, '/assignments/' + id + '/publish', {}); tell('Задание выдано ученику.'); if (context.onRefresh) await context.onRefresh(); else await load(); }));
      on('#teaching-photo [name=photo]', 'change', async event => {
        const current = ++generation, form = $('#teaching-photo'), submit = form.querySelector('[type=submit]'), error = form.querySelector('.form-error');
        prepared = null; submit.disabled = true; error.textContent = ''; if (photoUrl) URL.revokeObjectURL(photoUrl); photoUrl = '';
        const preview = $('.teaching-photo-preview'); preview.hidden = true;
        const file = event.target.files[0]; $('[data-file-name]').textContent = file ? file.name : 'Файл не выбран'; updateSubmitState(); if (!file) return;
        error.textContent = 'Готовим изображение…';
        try {
          const next = await preparePhoto(file); if (!active() || current !== generation) return;
          prepared = next; photoUrl = URL.createObjectURL(next.blob); preview.querySelector('img').src = photoUrl; preview.hidden = false;
          $('[data-photo-info]').textContent = `${next.width} × ${next.height} · ${Math.ceil(next.blob.size / 1024)} КБ`;
          error.textContent = ''; submit.disabled = false;
        } catch (reason) { if (active() && current === generation) error.textContent = problem(reason); }
      });
      on('#teaching-photo', 'submit', event => {
        event.preventDefault(); const form = event.currentTarget;
        act(form.querySelector('[type=submit]'), async () => {
          if (!prepared) return;
          const pending = prepared, { filename, mime, data } = pending;
          const targets = teacher ? selectedTargets() : [assignment.id];
          if (!targets.length) { tell('Выберите хотя бы одного ученика.', true); return; }
          if (!pending.operations) pending.operations = new Map();
          if (!pending.delivered) pending.delivered = new Set();
          form.elements.photo.disabled = true;
          try {
            for (let index = 0; index < targets.length; index++) {
              const target = targets[index];
              if (pending.delivered.has(target)) continue;
              if (!pending.operations.has(target)) pending.operations.set(target, crypto.randomUUID());
              if (grouped) $('[data-batch-progress]').textContent = `Прикрепляем фото: ${index + 1} из ${targets.length}…`;
              await post('/assignments/' + encodeURIComponent(target) + '/photos', { opId: pending.operations.get(target), kind: teacher ? 'task' : 'solution', filename, mime, data });
              pending.delivered.add(target); if (!active()) return;
            }
          } finally { if (form.isConnected) form.elements.photo.disabled = false; }
          prepared = null; if (photoUrl) URL.revokeObjectURL(photoUrl); photoUrl = ''; tell(targets.length > 1 ? 'Фотография прикреплена выбранным ученикам.' : 'Фотография сохранена.'); await load();
        });
      });
      if (feedbackDraft && $('#teaching-feedback')) {
        $('#teaching-feedback').elements.text.value = feedbackDraft.text;
        $('#teaching-feedback').elements.status.value = feedbackDraft.status;
        $('#teaching-feedback .form-error').textContent = 'Решения обновлены. Проверьте фотографии заново перед сохранением комментария.';
      }
      on('[data-feedback-refresh]', 'click', () => load());
      on('#teaching-feedback', 'submit', event => {
        event.preventDefault(); const form = event.currentTarget;
        act(form.querySelector('[type=submit]'), async () => {
          const draft = { text: form.elements.text.value.trim(), status: form.elements.status.value };
          try {
            await mutation(form, '/assignments/' + id + '/feedback', { ...draft, reviewRevision: result.reviewRevision });
          } catch (error) {
            if (error.status !== 409) throw error;
            feedbackDraft = draft;
            form.querySelector('.form-error').textContent = 'Ученик изменил работу после открытия страницы. Комментарий остался в форме. Обновите решения и проверьте новые фотографии.';
            form.querySelector('[data-feedback-refresh]').hidden = false;
            return;
          }
          feedbackDraft = null; tell('Комментарий сохранён.'); await load();
        });
      });
    }
    async function load() {
      if (!active()) return;
      if (readinessTimer) clearInterval(readinessTimer); readinessTimer = null;
      if (photoUrl) URL.revokeObjectURL(photoUrl); photoUrl = ''; prepared = null; generation++;
      loading();
      try {
        if (context.page === 'assignment') await renderAssignment();
        else if (!teacher) section.innerHTML = '<div class="empty">Этот раздел доступен преподавателю.</div>';
        else if (context.page === 'student') await renderStudent();
        else renderReports();
      } catch (error) { failure(error); }
    }
    load();
    return () => { alive = false; generation++; if (readinessTimer) clearInterval(readinessTimer); if (photoUrl) URL.revokeObjectURL(photoUrl); document.body.classList.remove('printing-parent-report', 'printing-paper-homework'); section.remove(); };
  }
  root.LearningTeaching = Object.freeze({ mount, validateRecommendations, preparePhoto, safePhotoUrl });
})(typeof globalThis === 'undefined' ? this : globalThis);
