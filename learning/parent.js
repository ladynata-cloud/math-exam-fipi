/* Read-only parent cabinet. Uses a separate session; no pupil or teacher APIs. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id), main = $('main');
  const E = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const labels = window.LearningOutcomes.labels;
  const courses = { school: '7 класс', foundations: 'Математическая основа', oge: 'ОГЭ по математике', ege: 'ЕГЭ · базовая математика', 'ege-profile': 'ЕГЭ · профильная математика' };
  const goals = { pass: 'Уверенно сдать', grade5: 'Подготовка на 5' };
  const controllers = new Set();
  let parent = null, csrf = '', invitation = null, loginHint = '', childName = '', revision = 0, busy = false, hiddenDuringInvite = false;
  const date = value => value && Number.isFinite(new Date(value).getTime()) ? new Date(value).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : '';
  const dateTime = value => value && Number.isFinite(new Date(value).getTime()) ? new Date(value).toLocaleString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
  const count = value => Number.isSafeInteger(value) && value >= 0 ? value : 0;
  const signedInMessage = 'Вы уже вошли в кабинет родителя. Приглашение не меняет этот вход. Чтобы использовать другое приглашение, сначала выйдите и откройте его снова.';
  function notice(message = '', error = false) { $('parent-notice').textContent = message; $('parent-notice').hidden = !message; $('parent-notice').classList.toggle('error', error); }
  function scrubFragment() { history.replaceState(null, '', location.pathname + location.search); }
  function readFragment() {
    const params = new URLSearchParams(location.hash.slice(1));
    if (params.has('invite')) {
      const token = params.get('invite'); scrubFragment();
      if (busy) { notice('Вход уже выполняется. Дождитесь завершения, затем снова откройте нужное приглашение.', true); return 'busy'; }
      invitation = [...params.keys()].length === 1 && /^[a-zA-Z0-9_-]{43}$/.test(token || '') ? token : null;
      return invitation ? 'invite' : 'invalid';
    }
    if (params.has('login')) {
      const login = params.get('login');
      if ([...params.keys()].length === 1 && /^[a-zA-Z0-9._-]{3,48}$/.test(login || '')) loginHint = login;
      if (!busy && !parent) invitation = null;
      return 'login';
    }
    return '';
  }
  const initialFragment = readFragment();
  function errorText(error, operation = '') {
    if (error?.status === 429) return 'Слишком много попыток. Подождите немного и попробуйте снова.';
    if (error?.code === 'LEARNING_PASSWORD_INVALID') return 'Придумайте пароль от 12 до 128 символов.';
    if (error?.code === 'LEARNING_PARENT_INVITATION_INVALID') return 'Приглашение истекло или уже использовано. Если Вы уже задавали пароль, войдите с ним. Иначе попросите Наталью Михайловну выдать новую ссылку.';
    if (error?.status === 401) return operation === 'login' ? 'Не удалось войти. Проверьте логин и пароль.' : 'Вход завершён или отключён. Войдите снова; при необходимости попросите новое приглашение.';
    return 'Не удалось получить ответ сервера. Проверьте связь и попробуйте снова. Если пароль уже сохранился, он подойдёт для обычного входа.';
  }
  async function api(path, options = {}) {
    const captured = revision, controller = new AbortController(), timer = setTimeout(() => controller.abort(), 12000); controllers.add(controller);
    try {
      const response = await fetch('/api/learning/parent' + path, { ...options, credentials: 'same-origin', cache: 'no-store', signal: controller.signal,
        headers: { ...(parent && path !== '/session' ? {'X-Learning-Parent':parent.login} : {}), ...(options.body ? {'Content-Type':'application/json'} : {}), ...(options.method === 'POST' && csrf ? {'X-CSRF-Token':csrf} : {}) } });
      let data; try { data = await response.json(); } catch (_) { throw Object.assign(Error('INVALID_RESPONSE'), {status:response.status}); }
      if (!response.ok) throw Object.assign(Error('PARENT_REQUEST_FAILED'), { status: response.status, code: data.error });
      if (captured === revision && data.csrfToken) csrf = data.csrfToken;
      return data;
    } finally { clearTimeout(timer); controllers.delete(controller); }
  }
  const post = (path, body) => api(path, { method: 'POST', body: JSON.stringify(body) });
  function clearPasswords() { document.querySelectorAll('input[type=password],input[data-parent-password]').forEach(input => { input.value = ''; }); }
  function header() {
    $('parent-account').innerHTML = parent ? `<span><strong>${E(parent.name)}</strong><small>Родитель${childName ? ' · '+E(childName) : ''}</small></span><button type="button" id="parent-logout">Сменить пользователя</button>` : '';
    $('parent-logout')?.addEventListener('click', logout);
  }
  function loading() { main.innerHTML = '<section class="panel loading" aria-live="polite"><h1>Открываем кабинет</h1><p>Проверяем Ваш вход…</p></section>'; }
  function authPage() {
    header(); const activate = !!invitation;
    main.innerHTML = `<nav class="role-choices" aria-label="Выбор кабинета"><a href="./?role=teacher#students">Преподаватель</a><a href="./?role=student">Ученик</a><a href="parent.html" aria-current="page">Родитель</a></nav><div class="auth-layout"><section class="auth-intro"><p class="eyebrow">МАТЕМАТИКА С НАТАЛЬЕЙ МИХАЙЛОВНОЙ</p><h1>Как движется<br>подготовка.</h1><p>Отдельная страница для родителя: домашняя работа, самостоятельные решения и темы, где пока нужна помощь.</p><ul><li>Здесь показана работа, сохранённая в кабинете ученика.</li><li>Ученик продолжает решать в своём кабинете.</li><li>Здесь можно только смотреть результаты.</li></ul></section><section class="panel auth-card"><h2>${activate?'Придумайте свой пароль':'Войти в кабинет родителя'}</h2><form id="parent-auth-form" data-mode="${activate?'activate':'login'}">${activate?'':`<label>Логин родителя<input name="login" id="parent-login" autocomplete="username" autocapitalize="none" spellcheck="false" minlength="3" maxlength="48" required value="${E(loginHint)}"></label>`}<label>${activate?'Новый пароль':'Пароль'}<input name="password" id="parent-password" data-parent-password type="password" autocomplete="${activate?'new-password':'current-password'}" minlength="${activate?12:1}" maxlength="128" required></label>${activate?'<p>Не менее 12 символов. Можно использовать несколько слов и цифры.</p><label>Повторите пароль<input name="confirm" data-parent-password type="password" autocomplete="new-password" minlength="12" maxlength="128" required></label>':''}<label class="checkbox"><input id="parent-show-password" type="checkbox">Показать пароль</label><p class="form-error" id="parent-auth-error" role="alert"></p><button type="submit" class="primary" id="parent-auth-submit">${activate?'Сохранить пароль и войти':'Войти'}</button></form>${activate?'<button type="button" class="subtle" id="parent-use-login">Я уже задавал(а) пароль</button>':'<p class="hint" style="margin-top:18px">Если забыли пароль, попросите Наталью Михайловну выдать новое приглашение для родителя.</p>'}</section></div>`;
    $('parent-show-password').onchange = event => { main.querySelectorAll('[data-parent-password]').forEach(input => { input.type = event.target.checked ? 'text' : 'password'; }); };
    $('parent-use-login')?.addEventListener('click', () => { if (busy) return; invitation = null; clearPasswords(); notice(''); authPage(); });
    $('parent-auth-form').onsubmit = submitAuth;
  }
  function returnLink() { const url = new URL(location.pathname, location.origin); url.hash = 'login=' + encodeURIComponent(parent.login); return url.href; }
  function outcome(value) { return `<span class="outcome" data-outcome="${E(Object.hasOwn(labels,value)?value:'started')}">${E(labels[value] || 'Начато')}</span>`; }
  function renderOverview(data, savedLogin = false) {
    const progress = data.progress, homework = data.homework, profile = data.profile;
    const course = courses[profile.course] || 'Математика', goal = profile.course === 'oge' ? goals[profile.goal] : '';
    const recent = progress.recent || [], assignments = homework.recent || [];
    childName = data.student.name; header(); notice('');
    main.innerHTML = `<div id="parent-overview"><section class="family-identity" aria-label="Текущий кабинет"><strong>Вы вошли как ${E(parent.name)} · Родитель</strong><span>Смотрите результаты: ${E(childName)}</span></section><div class="page-heading"><div><p class="eyebrow">ПОДГОТОВКА УЧЕНИКА</p><h1>${E(data.student.name)}</h1><p>${E(course)}${goal?' · '+E(goal):''}</p><span class="readonly-badge">Только просмотр</span></div><div class="refresh-box"><button type="button" id="parent-refresh">Обновить результаты</button><p class="hint" id="parent-updated" role="status">${data.fetchedAt ? 'Обновлено: '+E(dateTime(data.fetchedAt)) : 'Результаты загружены'}</p></div></div><p class="hint" data-saved-only>Здесь видна только работа, сохранённая в личном кабинете. Результат свободного тренажёра, открытого отдельно, здесь может не появиться.</p>${profile.course==='ege-profile'?'<p class="hint" data-profile-storage>Решения в курсе ЕГЭ профиль пока сохраняются в браузере ученика и не входят в итоги ниже.</p>':''}<section aria-labelledby="progress-heading"><h2 id="progress-heading">Что получается</h2><div class="stats"><div class="stat"><strong data-parent-count="independent">${count(progress.independentAttempts)}</strong><span>Самостоятельно</span></div><div class="stat"><strong data-parent-count="helped">${count(progress.helpedAttempts)}</strong><span>С подсказкой или вместе</span></div><div class="stat"><strong data-parent-count="practiced">${count(progress.practicedAttempts)}</strong><span>Верно на знакомом задании</span></div><div class="stat"><strong data-parent-count="started">${count(progress.startedAttempts)}</strong><span>Ещё в работе</span></div></div><p class="hint">Всего сохранённых попыток: <b data-parent-count="total">${count(progress.totalAttempts)}</b>. Это результаты отдельных решений, а не оценка освоения всей темы. Самостоятельное повторение входит в число самостоятельных решений.</p><p class="hint">${progress.lastActivityAt?'Последнее действие: '+E(dateTime(progress.lastActivityAt))+'.':'Сохранённых решений пока нет.'}</p></section><div class="dashboard-grid"><section class="panel" aria-labelledby="homework-heading"><div class="section-heading"><h2 id="homework-heading">Домашняя работа</h2><span data-parent-count="homework">${count(homework.total)}</span></div>${assignments.length?`<ul class="work-list" id="parent-homework">${assignments.map(item=>`<li class="work-row"><h3>${E(item.title)}</h3>${outcome(item.outcome)}<p>${item.dueAt?'К '+E(date(item.dueAt)):'Без срока'}</p><p>${item.submittedAt?'Текущая версия отправлена преподавателю '+E(date(item.submittedAt))+'.':'Текущая версия ещё не отправлена преподавателю.'}</p></li>`).join('')}</ul>${count(homework.total)>assignments.length?`<p class="hint" style="margin-top:14px">Показаны последние ${assignments.length} из ${count(homework.total)} домашних работ.</p>`:''}`:'<p class="empty">Выданной домашней работы пока нет.</p>'}<p class="hint" style="margin-top:16px">Отправленная работа ещё не означает, что преподаватель её проверил. Решения на бумаге проверяются отдельно.</p></section><section class="panel" aria-labelledby="recent-heading"><div class="section-heading"><h2 id="recent-heading">Последние решения</h2></div>${recent.length?`<ul class="work-list" id="parent-recent">${recent.map(item=>`<li class="work-row"><h3>${E(item.title)}</h3>${outcome(item.outcome)}<p>${E(date(item.updatedAt))}${item.outcome==='hinted'?' · использована подсказка':item.outcome==='together'?' · решали с преподавателем':''}</p></li>`).join('')}</ul>${count(progress.totalAttempts)>recent.length?`<p class="hint" style="margin-top:14px">Показаны последние ${recent.length} из ${count(progress.totalAttempts)} попыток. Числа выше учитывают всю текущую историю.</p>`:''}`:'<p class="empty">Когда ученик начнёт заниматься, здесь появятся результаты.</p>'}</section></div><details class="return-card" id="parent-return-card" ${savedLogin?'open':''}><summary>${savedLogin?'Пароль сохранён. Сохраните страницу для следующих входов':'Как войти снова'}</summary><p>Это Ваш отдельный логин. Пароль Вы придумали сами. Сохраните страницу входа в закладки или скопируйте её.</p><div class="return-fields"><label>Ваш логин<input id="parent-saved-login" readonly autocomplete="off" value="${E(parent.login)}"></label><label>Страница для следующих входов<input id="parent-return-link" readonly autocomplete="off" value="${E(returnLink())}"></label></div><div class="actions"><button type="button" id="parent-copy-return">Скопировать логин и ссылку</button><button type="button" id="parent-select-return">Выделить ссылку</button></div><p id="parent-copy-status" class="hint" role="status">Эта ссылка подставит логин. Для входа потребуется Ваш пароль.</p></details><p class="parent-footer">Данные относятся только к этому ученику. За разбором ошибок и планом дальнейшей подготовки обратитесь к Наталье Михайловне.</p></div>`;
    $('parent-refresh').onclick = () => loadOverview();
    $('parent-select-return').onclick = () => { $('parent-return-link').focus(); $('parent-return-link').select(); $('parent-copy-status').textContent = 'Ссылка выделена. Скопируйте её через Ctrl+C или меню «Копировать» на телефоне.'; };
    $('parent-copy-return').onclick = async () => { const actor = parent?.login; try { await navigator.clipboard.writeText('Кабинет родителя MathExam: ' + returnLink() + '\nЛогин: ' + parent.login); if (parent?.login === actor && $('parent-copy-status')) $('parent-copy-status').textContent = 'Логин и ссылка скопированы. Сохраните их в личной записи.'; } catch (_) { if (parent?.login === actor && $('parent-return-link')) { $('parent-return-link').focus(); $('parent-return-link').select(); $('parent-copy-status').textContent = 'Автоматическое копирование недоступно. Ссылка выделена; скопируйте её и логин выше вручную.'; } } };
    main.focus({preventScroll:true});
  }
  async function loadOverview(savedLogin = false) {
    if (!parent) return;
    const captured = revision, actor = parent.login, button = $('parent-refresh'); if (button) button.disabled = true;
    try { const data = await api('/overview'); if (captured !== revision || parent?.login !== actor) return; renderOverview(data, savedLogin); }
    catch (error) {
      if (captured !== revision || parent?.login !== actor) return;
      if (error.code === 'LEARNING_PARENT_ACCOUNT_CHANGED') { busy = false; childName = ''; parent = null; csrf = ''; invitation = null; await checkSession('В другом окне изменился вход. Сейчас показан текущий кабинет родителя.'); return; }
      if (error.status === 401) { loginHint = parent.login; childName = ''; parent = null; csrf = ''; invitation = null; authPage(); notice(errorText(error), true); }
      else { notice('Результаты сейчас не загрузились. Можно повторить запрос; сохранённая работа остаётся на сервере.', true); if (!$('parent-overview')) { main.innerHTML = '<section class="panel loading"><h1>Кабинет доступен</h1><p>Не удалось загрузить результаты.</p><button id="parent-retry" type="button" class="primary">Загрузить снова</button></section>'; $('parent-retry').onclick = () => loadOverview(savedLogin); } }
    } finally { if (button?.isConnected) button.disabled = false; }
  }
  async function checkSession(message = '') {
    if (busy) return;
    const captured = ++revision; busy = true; childName = ''; loading(); $('parent-account').replaceChildren();
    try {
      const result = await api('/session'); if (captured !== revision) return;
      const hadInvite = !!invitation; invitation = null; parent = result.parent; csrf = result.csrfToken || csrf; loginHint = parent.login;
      header(); await loadOverview(); if (captured !== revision) return; if (hadInvite) notice(signedInMessage, true); else if (message) notice(message, true);
    } catch (error) {
      if (captured !== revision) return;
      if (error.status === 401) { parent = null; csrf = ''; authPage(); if (message) notice(message, true); }
      else { main.innerHTML = '<section class="panel loading"><h1>Не удалось проверить вход</h1><p>Проверьте связь и попробуйте снова.</p><button id="parent-session-retry" type="button" class="primary">Попробовать снова</button></section>'; $('parent-session-retry').onclick = () => checkSession(message); }
    } finally { if (captured === revision) busy = false; }
  }
  async function submitAuth(event) {
    event.preventDefault(); if (busy) return;
    const form = event.currentTarget, token = invitation, activating = !!token, data = new FormData(form);
    let password = String(data.get('password') || ''); data.delete('password');
    if (activating && password !== data.get('confirm')) { $('parent-auth-error').textContent = 'Пароли не совпадают. Введите один и тот же пароль в оба поля.'; password = ''; return; }
    const login = String(data.get('login') || loginHint).trim(); if (!activating) loginHint = login;
    const captured = ++revision; busy = true; form.querySelectorAll('input,button').forEach(el => { el.disabled = true; }); $('parent-auth-error').textContent = '';
    try {
      // A parent may have signed in in another tab. Never replace that account.
      try { const existing = await api('/session'); if (captured !== revision) return; parent = existing.parent; invitation = null; clearPasswords(); header(); await loadOverview(); notice(signedInMessage, true); return; }
      catch (error) { if (captured !== revision) return; if (error.status !== 401) throw error; parent = null; csrf = ''; }
      const request = post(activating ? '/activate' : '/login', activating ? {token,password} : {login,password}); password = ''; clearPasswords();
      const result = await request; if (captured !== revision) return;
      parent = result.parent; invitation = null; csrf = result.csrfToken || csrf; loginHint = parent.login;
      history.replaceState(null, '', returnLink()); notice(''); header(); await loadOverview(activating);
    } catch (error) {
      if (captured !== revision) return;
      if (!error.status || error.status >= 500 || error.message === 'INVALID_RESPONSE') {
        // An activation may have reached the server even when its response was lost.
        // Read the session once; never repeat a password-changing request automatically.
        try {
          const recovered = await api('/session'); if (captured !== revision) return;
          parent = recovered.parent; invitation = null; csrf = recovered.csrfToken || csrf; loginHint = parent.login;
          history.replaceState(null, '', returnLink()); clearPasswords(); header(); notice('Вход подтверждён.'); await loadOverview(activating); return;
        } catch (_) { if (captured !== revision) return; }
      }
      if (error.code === 'LEARNING_PARENT_ALREADY_SIGNED_IN') {
        invitation = null; try { const result = await api('/session'); if (captured !== revision) return; parent = result.parent; header(); await loadOverview(); notice(signedInMessage, true); } catch (_) { if (captured === revision) { parent = null; authPage(); notice('Вход изменился в другом окне. Обновите страницу перед продолжением.', true); } } return;
      }
      if (error.code === 'LEARNING_PARENT_INVITATION_INVALID') invitation = null;
      authPage(); $('parent-auth-error').textContent = errorText(error, activating ? 'activate' : 'login');
    } finally { password = ''; if (captured === revision) { busy = false; if (form.isConnected) form.querySelectorAll('input,button').forEach(el => { el.disabled = false; }); } }
  }
  async function logout() {
    if (busy || !parent) return;
    const captured = ++revision; busy = true; const button = $('parent-logout'); if (button) button.disabled = true;
    try { await post('/logout', {}); if (captured !== revision) return; loginHint = ''; childName = ''; parent = null; csrf = ''; invitation = null; scrubFragment(); clearPasswords(); authPage(); notice('Вы вышли из кабинета родителя. Выберите нужный кабинет и войдите со своими данными.'); }
    catch (error) { if (captured !== revision) return; if (error.code === 'LEARNING_PARENT_ACCOUNT_CHANGED') { busy = false; childName = ''; parent = null; csrf = ''; invitation = null; await checkSession('В другом окне изменился вход. Проверьте имя перед выходом.'); return; } if (error.status === 401) { parent = null; csrf = ''; authPage(); } else notice('Не удалось подтвердить выход. Проверьте связь и нажмите «Сменить пользователя» снова.', true); }
    finally { if (captured === revision) { busy = false; if (button?.isConnected) button.disabled = false; } }
  }
  window.addEventListener('focus', () => { if (parent && !busy) checkSession(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && parent && !busy) checkSession(); });
  window.addEventListener('hashchange', () => { const result = readFragment(); if (result === 'busy') return; if (result === 'invite' || result === 'invalid') checkSession(result === 'invalid' ? 'Приглашение недействительно. Попросите новую личную ссылку.' : ''); else if (result === 'login' && !busy && !parent) { notice(''); authPage(); } });
  window.addEventListener('pagehide', () => { hiddenDuringInvite = !!invitation; invitation = null; ++revision; busy = false; for (const controller of controllers) controller.abort(); clearPasswords(); main.replaceChildren(); $('parent-account').replaceChildren(); });
  window.addEventListener('pageshow', event => { if (event.persisted) { const message = hiddenDuringInvite ? 'Если Вы ещё не задавали пароль, откройте личное приглашение заново.' : ''; hiddenDuringInvite = false; checkSession(message); } });
  window.addEventListener('beforeunload', event => { if (busy) { event.preventDefault(); event.returnValue = ''; } });
  checkSession(initialFragment === 'invalid' ? 'Приглашение недействительно. Попросите новую личную ссылку.' : '');
})();
