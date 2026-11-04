(function () {
  'use strict';
  const host = document.getElementById('atanasyan-course');
  let dispose = () => {};
  function open() {
    dispose();
    dispose = AtanasyanFirstSteps.mount(host, {
      bundleUrl: '../../learning/atanasyan-first-steps/course.json',
      storageScope: 'public', initialLessonId: location.hash.slice(1), role: 'public'
    });
  }
  window.addEventListener('hashchange', open);
  window.addEventListener('pagehide', () => dispose(), { once: true });
  open();
})();
