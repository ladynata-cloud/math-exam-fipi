(function () {
  'use strict';
  const host = document.getElementById('ichenskaya-course');
  let dispose = () => {};
  function open() {
    dispose();
    dispose = IchenskayaGrade7Works.mount(host, {
      bundleUrl: '../../learning/ichenskaya-grade7-works/course.json',
      storageScope: 'public', initialLessonId: location.hash.slice(1), role: 'public'
    });
  }
  window.addEventListener('hashchange', open);
  window.addEventListener('pagehide', () => dispose(), { once: true });
  open();
})();
