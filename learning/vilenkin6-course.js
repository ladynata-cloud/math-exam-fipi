/* Cabinet entry for the existing 27-module Vilenkin course. All work is opened
 * through the account API; displaying this page never creates an attempt. */
(function (root) {
  'use strict';
  const trainerId = 'vilenkin6-part1';
  const E = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const groups = Object.freeze([
    {title:'Вычисления и построения', ids:[1,2,3,4,5,24]},
    {title:'Смешанные числа', ids:[6,7,8,9,10,11,12,13,14,15,16,17,25]},
    {title:'Отношения и пропорции', ids:[18,19,20,21,22,23,26]}
  ]);
  const catalogId = id => trainerId + ':lesson-' + id;
  function items(catalog) { return [0,...groups.flatMap(group => group.ids)].map(id => catalog?.get(catalogId(id))).filter(Boolean); }
  function preview(catalog) {
    const all = items(catalog);
    return `<section class="panel" data-vilenkin6-preview><h2>Виленкин · 6 класс · Часть 1</h2><p>${all.length} тем доступны в кабинете. Ответы, шаги, подсказки, модели и записи сохраняются в каждой работе.</p><details><summary>Оглавление курса</summary><ol>${all.map(item=>`<li>${E(item.title)}</li>`).join('')}</ol></details><p class="form-hint">Просмотр оглавления не создаёт работу ученика.</p></section>`;
  }
  function mount(host, context) {
    const {account, catalog, api, navigate, openContent, labels = {}} = context;
    const teacher = account.role === 'teacher', all = items(catalog);
    let alive = true, loading = !teacher, generation = 0, progress = new Map();
    const buttons = () => [...host.querySelectorAll('[data-vilenkin6-open]')];
    if (all.length !== 27) {
      host.innerHTML = '<section class="empty"><h1>Курс пока не загрузился</h1><p>Обновите страницу. Сохранённые работы остаются в кабинете.</p><a class="button" href="#assignments">Мои задания</a></section>';
      return () => { alive = false; };
    }
    function row(id) {
      const item = catalog.get(catalogId(id));
      return `<li><button type="button" data-vilenkin6-open="${E(item.id)}" ${teacher?'':'disabled'}>${E(item.title)} →</button><small data-vilenkin6-status="${E(item.id)}">${teacher?'Выбрать ученика и подготовить задание':'Загружаем сохранённую работу…'}</small></li>`;
    }
    const homework = (context.assignments || []).filter(a => a.status === 'published' && a.learnerId === account.id);
    host.innerHTML = `<section data-vilenkin6-course><div class="page-heading"><div><p class="eyebrow">6 КЛАСС · ВИЛЕНКИН · ЧАСТЬ 1</p><h1>${teacher?'Курс Виленкина':'Моя математика'}</h1><p>Одна тема — одна сохранённая работа. Разберись на модели, собери решение по шагам и проверь себя на пяти заданиях.</p></div>${teacher?'<a class="button" href="#course">Все тренажёры</a>':''}</div><section class="hero-card"><div><span class="badge">Продолжаем с того же места</span><h2>Ответы и записи остаются в кабинете.</h2><p>Можно вернуться с другого устройства. Наталья Михайловна видит эту же работу и может подключиться к решению на занятии.</p>${context.profile?.focus?`<p>${E(context.profile.focus)}</p>`:''}<p class="form-hint">Перед закрытием работы дождись сообщения «Все изменения сохранены» в кабинете. При потере связи неподтверждённые действия остаются в текущей вкладке до отправки.</p></div></section>${homework.length?`<section class="panel"><h2>Задания преподавателя</h2><ul class="catalog-items">${homework.map(a=>`<li><a class="button" href="#assignment=${encodeURIComponent(a.id)}">${E(a.title)}</a></li>`).join('')}</ul></section>`:''}${teacher?'':'<section class="panel" data-vilenkin6-plan hidden><h2>Рекомендации преподавателя</h2><div></div></section>'}<section class="panel"><h2>Перед началом · повторение основ</h2><ul class="catalog-items">${row(0)}</ul></section><p role="status" aria-live="polite" data-vilenkin6-progress>${teacher?'27 тем: назначьте нужную тему одному ученику или группе.':'Загружаем результаты из кабинета…'}</p><div class="catalog-grid">${groups.map(group=>`<section class="catalog-group"><h2>${E(group.title)}</h2><ul class="catalog-items">${group.ids.map(row).join('')}</ul></section>`).join('')}</div><details class="panel"><summary>Как учитываются результаты</summary><p>Подсказки и совместная работа сохраняются вместе с ответами. Завершённая проверка темы означает не менее четырёх верных ответов из пяти; она может быть выполнена с помощью. Это не доказательство самостоятельного освоения всей темы.</p><p>В этой части курса фиксированный набор авторских заданий. Повторное прохождение знакомых заданий отмечается отдельно. Оригинальные номера учебника доступны с записями внутри соответствующей темы.</p></details><p><a href="#division-course">Потренировать умножение и деление →</a></p></section>`;
    function bind(target = host) {
      target.querySelectorAll('[data-vilenkin6-open]').forEach(button => button.onclick = async () => {
        if (!alive || loading || button.disabled) return;
        const item = catalog.get(button.dataset.vilenkin6Open);
        if (!item || item.trainerId !== trainerId) return;
        const latest = progress.get(item.contentId)?.latest;
        if (!teacher && latest && /^[a-zA-Z0-9_-]{1,160}$/.test(latest.id || '')) {
          navigate('attempt=' + encodeURIComponent(latest.id));
          return;
        }
        button.disabled = true;
        try { await openContent(item.id); }
        finally { if (alive && button.isConnected) button.disabled = false; }
      });
    }
    bind();
    async function loadProgress() {
      const revision = ++generation;
      loading = true;
      buttons().forEach(button => { button.disabled = true; });
      const status = host.querySelector('[data-vilenkin6-progress]');
      status.textContent = 'Загружаем результаты из кабинета…';
      try {
        const result = await api('/progress');
        if (!alive || revision !== generation) return;
        if (!Array.isArray(result.progress)) throw Error('Invalid progress');
        progress = new Map(result.progress.filter(item => item.trainerId === trainerId && catalog.get(trainerId + ':' + item.contentId)).map(item => [item.contentId, item]));
        for (const item of all) {
          const entry = progress.get(item.contentId), latest = entry?.latest;
          const node = host.querySelector('[data-vilenkin6-status="' + item.id + '"]');
          node.textContent = latest ? 'Продолжить сохранённую работу · ' + (labels[latest.outcome] || 'Начато') : 'Ещё не начинали';
        }
        status.textContent = `Открыто ${progress.size} из 27 тем. Завершённая проверка есть у ${[...progress.values()].filter(item=>item.completed).length} тем.`;
        loading = false;
        buttons().forEach(button => { button.disabled = false; });
      } catch (_) {
        if (!alive || revision !== generation) return;
        status.innerHTML = 'Не удалось получить сохранённую работу. Повтори загрузку, чтобы продолжить с прежнего места. <button type="button" data-vilenkin6-retry>Повторить загрузку</button>';
        status.querySelector('button').onclick = loadProgress;
      }
    }
    async function loadPlan() {
      try {
        const result = await api('/plan');
        if (!alive) return;
        const plan = result.plan || result, entries = (plan.items || []).filter(entry => catalog.get(entry.catalogId)?.trainerId === trainerId);
        const box = host.querySelector('[data-vilenkin6-plan]');
        if (!entries.length && !plan.note) return;
        box.hidden = false;
        box.querySelector('div').innerHTML = `${plan.note?`<p>${E(plan.note)}</p>`:''}<ul class="catalog-items">${entries.map(entry=>`<li><button type="button" data-vilenkin6-open="${E(entry.catalogId)}" ${loading?'disabled':''}>${E(catalog.get(entry.catalogId).title)} →</button><small>${E(entry.reason)}</small></li>`).join('')}</ul>`;
        bind(box);
      } catch (_) { /* Optional advice never blocks the whole course. */ }
    }
    if (!teacher) { loadProgress(); loadPlan(); }
    return () => { alive = false; generation++; };
  }
  root.LearningVilenkin6 = Object.freeze({mount, preview, items, groups});
})(typeof window === 'undefined' ? globalThis : window);
