(function (root) {
  'use strict';

  const COURSE = '/stereo-course/sections/';
  const WRAPPER = '/trainers/sections-from-zero.html';
  const REQUEST = 'sections:board-request';
  const validId = value => typeof value === 'string' && value.length > 0 &&
    value.length <= 96 && /^[\p{L}\p{N}_-]+$/u.test(value);

  function mount(options) {
    const { frame, currentUrl, canSelect, open } = options || {};
    const doc = root.document;
    if (!frame || typeof currentUrl !== 'function' || typeof canSelect !== 'function' ||
        typeof open !== 'function' || doc.getElementById('sectionsCourseToggle')) return null;
    const bar = doc.querySelector('.workspace-bar');
    if (!bar) return null;

    function exactPath(value, path) {
      try {
        const url = new URL(value, root.location.href);
        const searchAllowed = !url.search || (path === WRAPPER &&
          [...url.searchParams.keys()].every(key => key === 'seed') &&
          url.searchParams.getAll('seed').length === 1 && url.searchParams.get('seed').length <= 128);
        return url.origin === root.location.origin && url.pathname === path && searchAllowed;
      } catch (_) { return false; }
    }
    function sharedLesson() {
      try {
        if (!exactPath(currentUrl(), WRAPPER) || !exactPath(frame.contentWindow.location.href, WRAPPER)) return null;
        const api = frame.contentWindow.__sectionsBoard;
        const state = api?.getState();
        return state && api.validateState(state) && validId(state.lessonId) ? state.lessonId : null;
      } catch (_) { return null; }
    }
    function element(tag, attrs, text) {
      const node = doc.createElement(tag);
      Object.entries(attrs || {}).forEach(([name, value]) => node.setAttribute(name, value));
      if (text) node.textContent = text;
      return node;
    }

    const toggle = element('button', {
      id: 'sectionsCourseToggle', class: 'btn', type: 'button', hidden: '',
      'aria-haspopup': 'dialog', 'aria-controls': 'sectionsCoursePanel', 'aria-expanded': 'false'
    }, 'К курсу');
    bar.insertBefore(toggle, doc.getElementById('workspaceModes'));
    const panel = element('dialog', {
      id: 'sectionsCoursePanel', class: 'sections-course-panel', 'aria-labelledby': 'sectionsCourseTitle'
    });
    const heading = element('header', { class: 'sections-course-heading' });
    const title = element('h2', { id: 'sectionsCourseTitle' }, 'Курс «Сечения с нуля»');
    const close = element('button', { class: 'btn', type: 'button', 'data-sections-course-close': '' }, '← На доску');
    heading.append(title, close);
    const status = element('p', { class: 'sections-course-status', role: 'status', 'data-sections-course-status': '', hidden: '' });
    const course = element('iframe', {
      id: 'sectionsCourseFrame', title: 'Курс «Сечения с нуля»',
      referrerpolicy: 'no-referrer'
    });
    course.inert = true;
    panel.append(heading, status, course);
    doc.body.append(panel);
    let boundWindow = null, boundDocument = null, requestHandler = null;

    function announce(text) {
      status.textContent = text;
      status.hidden = !text;
    }
    function leaveCourse() {
      if (panel.open) panel.close();
    }
    function refresh() {
      toggle.hidden = !exactPath(currentUrl(), WRAPPER);
      toggle.disabled = !sharedLesson();
      if (toggle.hidden) leaveCourse();
    }
    function bindCourse() {
      course.inert = true;
      try {
        if (boundWindow && requestHandler) boundWindow.removeEventListener(REQUEST, requestHandler);
      } catch (_) { /* A navigated frame may no longer have the same origin. */ }
      boundWindow = null; boundDocument = null; requestHandler = null;
      try {
        const view = course.contentWindow, document = view.document;
        if (!exactPath(view.location.href, COURSE) || !view.SECTIONS_APP || !view.SECTIONS_MASTER) return;
        boundWindow = view; boundDocument = document;
        requestHandler = event => {
          // This listener belongs to the authored course document, not to the
          // host's postMessage transport. Recheck the document after navigation.
          try {
            if (!panel.open || course.contentWindow !== view || view.document !== document ||
                document !== boundDocument || event.target !== view || !exactPath(view.location.href, COURSE)) return;
          } catch (_) { return; }
          event.preventDefault();
          const id = event.detail?.lessonId;
          const api = view.SECTIONS_APP;
          if (!validId(id) || !api?.lessons?.some(lesson => lesson.id === id) ||
              api.getCurrentLesson()?.id !== id) {
            announce('Выберите задание в курсе и нажмите «На доску».'); return;
          }
          const active = sharedLesson();
          if (!active) { announce('Дождитесь загрузки задания на доске и попробуйте ещё раз.'); return; }
          if (id === active) { leaveCourse(); return; }
          if (!canSelect()) {
            announce('Другое задание на общей доске выбирает преподаватель, когда ход у него. Вернуться к уроку можно кнопкой «На доску» сверху.');
            return;
          }
          if (open(WRAPPER + '#' + encodeURIComponent(id)) === false) {
            announce('Не удалось открыть задание. Вернитесь на доску и проверьте подключение.'); return;
          }
          leaveCourse(); refresh();
        };
        view.addEventListener(REQUEST, requestHandler);
        course.inert = false;
        course.removeAttribute('aria-busy');
        announce('');
      } catch (_) { announce('Курс ещё загружается. Вернуться на доску можно верхней кнопкой.'); }
    }
    toggle.addEventListener('click', () => {
      const id = sharedLesson();
      if (!id) { refresh(); return; }
      announce('');
      let reused = false;
      try {
        const view = course.contentWindow;
        if (!course.inert && view.document === boundDocument && exactPath(view.location.href, COURSE) && view.SECTIONS_MASTER?.openLesson) {
          view.SECTIONS_MASTER.openLesson(id); reused = true;
        }
      } catch (_) { /* The initial frame has no course document yet. */ }
      if (!reused) {
        course.inert = true;
        course.setAttribute('aria-busy', 'true');
        announce('Курс загружается…');
        // The inert initial about:blank needs no permissions. Apply the same
        // restrictions before navigating, avoiding a needless browser warning
        // on every unrelated board load.
        course.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-downloads');
        course.src = COURSE + '#' + encodeURIComponent(id);
      }
      if (!panel.open) panel.showModal();
      toggle.setAttribute('aria-expanded', 'true');
      close.focus();
    });
    close.addEventListener('click', leaveCourse);
    panel.addEventListener('close', () => {
      toggle.setAttribute('aria-expanded', 'false');
      if (!toggle.hidden) toggle.focus();
    });
    course.addEventListener('load', bindCourse);
    frame.addEventListener('load', refresh);
    const observer = new root.MutationObserver(refresh);
    observer.observe(frame, { attributes: true, attributeFilter: ['src'] });
    refresh();
    return Object.freeze({ refresh });
  }

  root.MathExamSectionsCourseNavigation = Object.freeze({ mount });
})(window);
