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
  function personalLogin() {
    const params = new URLSearchParams(location.hash.slice(1)), login = params.get('login');
    return [...params.keys()].length === 1 && /^parent-[a-z0-9_-]{16}$/.test(login || '') ? login : '';
  }
  function rememberLogin(login) { loginHint = login; history.replaceState(null, '', returnLink(login)); }
  function readFragment() {
    const params = new URLSearchParams(location.hash.slice(1));
    loginHint = '';
    if (params.has('invite')) {
      const token = params.get('invite'); scrubFragment();
      if (busy) { notice('Вход уже выполняется. Дождитесь завершения, затем снова откройте нужное приглашение.', true); return 'busy'; }
      invitation = [...params.keys()].length === 1 && /^[a-zA-Z0-9_-]{43}$/.test(token || '') ? token : null;
      return invitation ? 'invite' : 'invalid';
    }
    invitation = null;
    loginHint = personalLogin();
    return loginHint ? 'login' : '';
  }
  let loginProgressRevision = 0;
  const initialFragment = readFragment();
  function errorText(error, operation = '') {
    if (error?.status === 429) return 'Слишком много попыток. Подождите немного и попробуйте снова.';
    if (error?.code === 'LEARNING_PASSWORD_INVALID') return 'Введите код из 4 цифр, например 0427.';
    if (error?.code === 'LEARNING_PARENT_INVITATION_INVALID') return 'Приглашение истекло или уже использовано. Если Вы уже создавали код входа или пароль, войдите с ним. Иначе попросите Наталью Михайловну выдать новую ссылку.';
    if (error?.status === 401 && personalLogin()) return operation === 'login' ? 'Не удалось войти. Проверьте код.' : 'Войдите снова. Если код не подходит, обратитесь к Наталье Михайловне.';
    if (error?.status === 401) return operation === 'login' ? 'Не удалось войти. Проверьте логин и код входа или прежний пароль.' : 'Вход завершён или отключён. Войдите снова; при необходимости попросите новое приглашение.';
    return 'Не удалось получить ответ сервера. Проверьте связь и попробуйте снова. Если код уже сохранился, он подойдёт для обычного входа.';
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
    $('parent-account').innerHTML = parent ? `<span><strong>${E(parent.name)}</strong><small>Родитель${childName ? ' · '+E(childName) : ''}</small></span><button type="button" id="parent-logout">Выйти</button>` : '';
    $('parent-logout')?.addEventListener('click', logout);
    document.querySelector('.brand').href = parent ? returnLink() : personalLogin() ? returnLink(personalLogin()) : 'parent.html';
  }
  function setLoginProgress(show, captured = 0) {
    if (!show && captured && captured !== loginProgressRevision) return;
    loginProgressRevision = show ? captured : 0; $('parent-auth-progress').hidden = !show; main.setAttribute('aria-busy', String(show));
    const form = $('parent-auth-form');
    if (form) { form.setAttribute('aria-busy', String(show)); const button = form.querySelector('[type=submit]');
      if (show) { button.dataset.idleLabel = button.textContent; button.textContent = 'Входим…'; button.disabled = true; }
      else if (button.dataset.idleLabel) { button.textContent = button.dataset.idleLabel; delete button.dataset.idleLabel; }
    }
  }
  function loading() { clearPasswords(); main.innerHTML = '<section class="panel loading" role="status" aria-live="polite"><span class="login-dots" aria-hidden="true"><span class="login-dot"></span><span class="login-dot"></span><span class="login-dot"></span></span><h1>Открываем кабинет</h1><p>Проверяем Ваш вход…</p></section>'; }
  function authPage() {
    clearPasswords(); header(); const activate = !!invitation, linkLogin = personalLogin();
    if (!activate && linkLogin) main.innerHTML = `<section class="panel auth-card parent-code-entry" id="parent-code-entry"><h1>Кабинет родителя</h1><p>Введите код от Натальи Михайловны.</p><form id="parent-auth-form" data-mode="login"><label>Код<input name="password" id="parent-password" data-parent-password type="password" inputmode="numeric" autocomplete="current-password" minlength="1" maxlength="128" required></label><p class="form-error" id="parent-auth-error" role="alert"></p><button type="submit" class="primary" id="parent-auth-submit">Войти</button></form></section>`;
    else main.innerHTML = `<nav class="role-choices" aria-label="Выбор кабинета"><a href="./?role=teacher#students">Преподаватель</a><a href="./?role=student">Ученик</a><a href="parent.html" aria-current="page">Родитель</a></nav><div class="auth-layout"><section class="auth-intro"><p class="eyebrow">МАТЕМАТИКА С НАТАЛЬЕЙ МИХАЙЛОВНОЙ</p><h1>Как движется<br>подготовка.</h1><p>Отдельная страница для родителя: домашняя работа, самостоятельные решения и темы, где пока нужна помощь.</p><ul><li>Здесь показана работа, сохранённая в кабинете ученика.</li><li>Ученик продолжает решать в своём кабинете.</li><li>Здесь можно только смотреть результаты.</li></ul></section><section class="panel auth-card"><h2>${activate?'Создайте код входа':'Войти в кабинет родителя'}</h2><form id="parent-auth-form" data-mode="${activate?'activate':'login'}">${activate?'':`<label>Логин родителя<input name="login" id="parent-login" autocomplete="username" autocapitalize="none" spellcheck="false" minlength="3" maxlength="48" required value="${E(loginHint)}"></label>`}<label>${activate?'Код входа':'Код входа или прежний пароль'}<input name="password" id="parent-password" data-parent-password type="password" autocomplete="${activate?'new-password':'current-password'}" minlength="${activate?4:1}" maxlength="${activate?4:128}" ${activate?'inputmode="numeric" pattern="[0-9]{4}"':''} required></label>${activate?'<p>Ровно 4 цифры. Сохраните этот код: он подойдёт и для следующих входов.</p><label>Повторите код<input name="confirm" data-parent-password type="password" autocomplete="new-password" inputmode="numeric" pattern="[0-9]{4}" minlength="4" maxlength="4" required></label>':''}<label class="checkbox"><input id="parent-show-password" type="checkbox">Показать код или пароль</label><p class="form-error" id="parent-auth-error" role="alert"></p><button type="submit" class="primary" id="parent-auth-submit">${activate?'Сохранить код и войти':'Войти'}</button></form>${activate?'<button type="button" class="subtle" id="parent-use-login">У меня уже есть код входа или пароль</button>':'<p class="hint" style="margin-top:18px">Введите сохранённый логин и код входа или прежний пароль.</p>'}</section></div>`;
    $('parent-show-password')?.addEventListener('change', event => { main.querySelectorAll('[data-parent-password]').forEach(input => { input.type = event.target.checked ? 'text' : 'password'; }); });
    $('parent-use-login')?.addEventListener('click', () => { if (busy) return; invitation = null; clearPasswords(); notice(''); authPage(); });
    $('parent-auth-form').onsubmit = event => submitAuth(event, linkLogin);
  }
  function returnLink(login = parent.login) { const url = new URL(location.pathname, location.origin); url.hash = 'login=' + encodeURIComponent(login); return url.href; }
  function outcome(value) { return `<span class="outcome" data-outcome="${E(Object.hasOwn(labels,value)?value:'started')}">${E(labels[value] || 'Начато')}</span>`; }
  function renderOverview(data, savedLogin = false) {
    const progress = data.progress, homework = data.homework, profile = data.profile;
    const course = courses[profile.course] || 'Математика', goal = profile.course === 'oge' ? goals[profile.goal] : '';
    const recent = progress.recent || [], assignments = homework.recent || [];
    childName = data.student.name; header(); notice('');
    main.innerHTML = `<div id="parent-overview"><section class="family-identity" aria-label="Текущий кабинет"><strong>Вы вошли как ${E(parent.name)} · Родитель</strong><span>Смотрите результаты: ${E(childName)}</span></section><div class="page-heading"><div><p class="eyebrow">ПОДГОТОВКА УЧЕНИКА</p><h1>${E(data.student.name)}</h1><p>${E(course)}${goal?' · '+E(goal):''}</p><span class="readonly-badge">Только просмотр</span></div><div class="refresh-box"><button type="button" id="parent-refresh">Обновить результаты</button><p class="hint" id="parent-updated" role="status">${data.fetchedAt ? 'Обновлено: '+E(dateTime(data.fetchedAt)) : 'Результаты загружены'}</p></div></div><p class="hint" data-saved-only>Здесь видна только работа, сохранённая в личном кабинете. Результат свободного тренажёра, открытого отдельно, здесь может не появиться.</p>${profile.course==='ege-profile'?'<p class="hint" data-profile-storage>Решения в курсе ЕГЭ профиль пока сохраняются в браузере ученика и не входят в итоги ниже.</p>':''}<section aria-labelledby="progress-heading"><h2 id="progress-heading">Что получается</h2><div class="stats"><div class="stat"><strong data-parent-count="independent">${count(progress.independentAttempts)}</strong><span>Самостоятельно</span></div><div class="stat"><strong data-parent-count="helped">${count(progress.helpedAttempts)}</strong><span>С подсказкой или вместе</span></div><div class="stat"><strong data-parent-count="practiced">${count(progress.practicedAttempts)}</strong><span>Верно на знакомом задании</span></div><div class="stat"><strong data-parent-count="started">${count(progress.startedAttempts)}</strong><span>Ещё в работе</span></div></div><p class="hint">Всего сохранённых попыток: <b data-parent-count="total">${count(progress.totalAttempts)}</b>. Это результаты отдельных решений, а не оценка освоения всей темы. Самостоятельное повторение входит в число самостоятельных решений.</p><p class="hint">${progress.lastActivityAt?'Последнее действие: '+E(dateTime(progress.lastActivityAt))+'.':'Сохранённых решений пока нет.'}</p></section><div class="dashboard-grid"><section class="panel" aria-labelledby="homework-heading"><div class="section-heading"><h2 id="homework-heading">Домашняя работа</h2><span data-parent-count="homework">${count(homework.total)}</span></div>${assignments.length?`<ul class="work-list" id="parent-homework">${assignments.map(item=>`<li class="work-row"><h3>${E(item.title)}</h3>${outcome(item.outcome)}<p>${item.dueAt?'К '+E(date(item.dueAt)):'Без срока'}</p><p>${item.submittedAt?'Текущая версия отправлена преподавателю '+E(date(item.submittedAt))+'.':'Текущая версия ещё не отправлена преподавателю.'}</p></li>`).join('')}</ul>${count(homework.total)>assignments.length?`<p class="hint" style="margin-top:14px">Показаны последние ${assignments.length} из ${count(homework.total)} домашних работ.</p>`:''}`:'<p class="empty">Выданной домашней работы пока нет.</p>'}<p class="hint" style="margin-top:16px">Отправленная работа ещё не означает, что преподаватель её проверил. Решения на бумаге проверяются отдельно.</p></section><section class="panel" aria-labelledby="recent-heading"><div class="section-heading"><h2 id="recent-heading">Последние решения</h2></div>${recent.length?`<ul class="work-list" id="parent-recent">${recent.map(item=>`<li class="work-row"><h3>${E(item.title)}</h3>${outcome(item.outcome)}<p>${E(date(item.updatedAt))}${item.outcome==='hinted'?' · использована подсказка':item.outcome==='together'?' · решали с преподавателем':''}</p></li>`).join('')}</ul>${count(progress.totalAttempts)>recent.length?`<p class="hint" style="margin-top:14px">Показаны последние ${recent.length} из ${count(progress.totalAttempts)} попыток. Числа выше учитывают всю текущую историю.</p>`:''}`:'<p class="empty">Когда ученик начнёт заниматься, здесь появятся результаты.</p>'}</section></div><details class="return-card" id="parent-return-card" ${savedLogin?'open':''}><summary>${savedLogin?'Код сохранён. Ваша постоянная ссылка':'Как войти снова'}</summary><p>Сохраните эту ссылку. В следующий раз откройте её и введите свой код.</p><div class="return-fields"><label>Постоянная ссылка<input id="parent-return-link" readonly autocomplete="off" value="${E(returnLink())}"></label></div><div class="actions"><button type="button" id="parent-copy-return">Скопировать ссылку</button><button type="button" id="parent-select-return">Выделить ссылку</button></div><p id="parent-copy-status" class="hint" role="status">Ссылка остаётся той же при каждом входе.</p></details><p class="parent-footer">Данные относятся только к этому ученику. За разбором ошибок и планом дальнейшей подготовки обратитесь к Наталье Михайловне.</p></div>`;
    $('parent-refresh').onclick = () => loadOverview();
    $('parent-select-return').onclick = () => { $('parent-return-link').focus(); $('parent-return-link').select(); $('parent-copy-status').textContent = 'Ссылка выделена. Скопируйте её через Ctrl+C или меню «Копировать» на телефоне.'; };
    $('parent-copy-return').onclick = async () => { const actor = parent?.login; try { await navigator.clipboard.writeText(returnLink()); if (parent?.login === actor && $('parent-copy-status')) $('parent-copy-status').textContent = 'Ссылка скопирована.'; } catch (_) { if (parent?.login === actor && $('parent-return-link')) { $('parent-return-link').focus(); $('parent-return-link').select(); $('parent-copy-status').textContent = 'Ссылка выделена. Скопируйте её вручную.'; } } };
    main.focus({preventScroll:true});
  }
  async function loadOverview(savedLogin = false) {
    if (!parent) return;
    const captured = revision, actor = parent.login, button = $('parent-refresh'); if (button) button.disabled = true;
    try { const data = await api('/overview'); if (captured !== revision || parent?.login !== actor) return; renderOverview(data, savedLogin); }
    catch (error) {
      if (captured !== revision || parent?.login !== actor) return;
      if (error.code === 'LEARNING_PARENT_ACCOUNT_CHANGED') { busy = false; childName = ''; parent = null; csrf = ''; invitation = null; await checkSession('В другом окне изменился вход. Сейчас показан текущий кабинет родителя.'); return; }
      if (error.status === 401) { rememberLogin(parent.login); childName = ''; parent = null; csrf = ''; invitation = null; authPage(); notice(errorText(error), true); }
      else { notice('Результаты сейчас не загрузились. Можно повторить запрос; сохранённая работа остаётся на сервере.', true); if (!$('parent-overview')) { main.innerHTML = '<section class="panel loading"><h1>Кабинет доступен</h1><p>Не удалось загрузить результаты.</p><button id="parent-retry" type="button" class="primary">Загрузить снова</button></section>'; $('parent-retry').onclick = () => loadOverview(savedLogin); } }
    } finally { if (button?.isConnected) button.disabled = false; }
  }
  async function checkSession(message = '') {
    if (busy) return;
    const captured = ++revision; busy = true; childName = ''; loading(); $('parent-account').replaceChildren();
    try {
      const result = await api('/session'); if (captured !== revision) return;
      const hadInvite = !!invitation; invitation = null; parent = result.parent; csrf = result.csrfToken || csrf; rememberLogin(parent.login);
      header(); await loadOverview(); if (captured !== revision) return; if (hadInvite) notice(signedInMessage, true); else if (message) notice(message, true);
    } catch (error) {
      if (captured !== revision) return;
      if (error.status === 401) { parent = null; csrf = ''; authPage(); if (message) notice(message, true); }
      else { main.innerHTML = '<section class="panel loading"><h1>Не удалось проверить вход</h1><p>Проверьте связь и попробуйте снова.</p><button id="parent-session-retry" type="button" class="primary">Попробовать снова</button></section>'; $('parent-session-retry').onclick = () => checkSession(message); }
    } finally { if (captured === revision) busy = false; }
  }
  async function submitAuth(event, linkLogin) {
    event.preventDefault(); if (busy || event.currentTarget !== $('parent-auth-form')) return;
    const form = event.currentTarget, token = invitation, activating = !!token, data = new FormData(form);
    let password = String(data.get('password') || ''); data.delete('password');
    if (activating && (password.length !== 4 || !/^[0-9]{4}$/.test(password))) { $('parent-auth-error').textContent = 'Введите код из 4 цифр, например 0427.'; password = ''; return; }
    if (activating && password !== data.get('confirm')) { $('parent-auth-error').textContent = 'Коды не совпадают. Введите один и тот же код в оба поля.'; password = ''; return; }
    const login = String(data.get('login') || linkLogin).trim(); if (!activating) loginHint = login;
    const captured = ++revision; busy = true; setLoginProgress(true, captured); form.querySelectorAll('input,button').forEach(el => { el.disabled = true; }); $('parent-auth-error').textContent = '';
    try {
      // A parent may have signed in in another tab. Never replace that account.
      try { const existing = await api('/session'); if (captured !== revision) return; parent = existing.parent; invitation = null; rememberLogin(parent.login); clearPasswords(); header(); await loadOverview(); notice(signedInMessage, true); return; }
      catch (error) { if (captured !== revision) return; if (error.status !== 401) throw error; parent = null; csrf = ''; }
      const request = post(activating ? '/activate' : '/login', activating ? {token,password} : {login,password}); password = ''; clearPasswords();
      const result = await request; if (captured !== revision) return;
      parent = result.parent; invitation = null; csrf = result.csrfToken || csrf; rememberLogin(parent.login);
      notice(''); header(); await loadOverview(activating);
    } catch (error) {
      if (captured !== revision) return;
      if (!error.status || error.status >= 500 || error.message === 'INVALID_RESPONSE') {
        // An activation may have reached the server even when its response was lost.
        // Read the session once; never repeat a password-changing request automatically.
        try {
          const recovered = await api('/session'); if (captured !== revision) return;
          parent = recovered.parent; invitation = null; csrf = recovered.csrfToken || csrf; rememberLogin(parent.login);
          clearPasswords(); header(); notice('Вход подтверждён.'); await loadOverview(activating); return;
        } catch (_) { if (captured !== revision) return; }
      }
      if (error.code === 'LEARNING_PARENT_ALREADY_SIGNED_IN') {
        invitation = null; try { const result = await api('/session'); if (captured !== revision) return; parent = result.parent; rememberLogin(parent.login); header(); await loadOverview(); notice(signedInMessage, true); } catch (_) { if (captured === revision) { parent = null; authPage(); notice('Вход изменился в другом окне. Обновите страницу перед продолжением.', true); } } return;
      }
      if (error.code === 'LEARNING_PARENT_INVITATION_INVALID') invitation = null;
      if (!activating && linkLogin) rememberLogin(login);
      authPage(); $('parent-auth-error').textContent = errorText(error, activating ? 'activate' : 'login');
    } finally { password = ''; if (captured === revision) { busy = false; if (form.isConnected) form.querySelectorAll('input,button').forEach(el => { el.disabled = false; }); } setLoginProgress(false, captured); }
  }
  async function logout() {
    if (busy || !parent) return;
    const login = parent.login, captured = ++revision; busy = true; const button = $('parent-logout'); if (button) button.disabled = true;
    try { await post('/logout', {}); if (captured !== revision) return; rememberLogin(login); childName = ''; parent = null; csrf = ''; invitation = null; clearPasswords(); authPage(); notice(''); }
    catch (error) { if (captured !== revision) return; if (error.code === 'LEARNING_PARENT_ACCOUNT_CHANGED') { busy = false; childName = ''; parent = null; csrf = ''; invitation = null; await checkSession('В другом окне изменился вход. Проверьте имя перед выходом.'); return; } if (error.status === 401) { rememberLogin(login); parent = null; csrf = ''; invitation = null; authPage(); } else notice('Не удалось подтвердить выход. Проверьте связь и нажмите «Выйти» снова.', true); }
    finally { if (captured === revision) { busy = false; if (button?.isConnected) button.disabled = false; } }
  }
  window.addEventListener('focus', () => { if (parent && !busy) checkSession(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && parent && !busy) checkSession(); });
  document.querySelector('.skip-link').addEventListener('click', event => { event.preventDefault(); main.focus(); });
  window.addEventListener('hashchange', () => {
    if (busy && loginProgressRevision) { if (/^parent-[a-z0-9_-]{16}$/.test(loginHint)) rememberLogin(loginHint); else scrubFragment(); return; }
    const result = readFragment();
    if (parent) { rememberLogin(parent.login); if (result === 'invite') { invitation = null; notice(signedInMessage, true); } return; }
    if (result === 'busy') return;
    if (result === 'invite' || result === 'invalid') checkSession(result === 'invalid' ? 'Приглашение недействительно. Попросите новую личную ссылку.' : '');
    else if (!busy) { notice(''); authPage(); }
  });
  window.addEventListener('pagehide', () => { setLoginProgress(false); hiddenDuringInvite = !!invitation; invitation = null; ++revision; busy = false; for (const controller of controllers) controller.abort(); clearPasswords(); main.replaceChildren(); $('parent-account').replaceChildren(); });
  window.addEventListener('pageshow', event => { if (event.persisted) { const message = hiddenDuringInvite ? 'Если Вы ещё не создали код входа, откройте личное приглашение заново.' : ''; hiddenDuringInvite = false; checkSession(message); } });
  window.addEventListener('beforeunload', event => { if (busy) { event.preventDefault(); event.returnValue = ''; } });
  checkSession(initialFragment === 'invalid' ? 'Приглашение недействительно. Попросите новую личную ссылку.' : '');
})();
