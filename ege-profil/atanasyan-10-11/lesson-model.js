(function () {
  'use strict';
  const lesson = window.MathExamGuidedLesson;
  const viewer = window.AtanasyanModel.mount(document.getElementById('model'), lesson.model);
  let lastView;

  function update() {
    const state = window.__atanasyanLesson.getState();
    const index = Math.min(state.step, lesson.steps.length - 1);
    const step = lesson.steps[index];
    const reveal = state.solved.includes(index) || state.helps.includes(index);
    const view = (!reveal && step.promptView) || step.modelView || 'neutral';
    if (view !== lastView) {
      viewer.setView(view);
      lastView = view;
    }
  }

  const observer = new MutationObserver(update);
  observer.observe(document.getElementById('step-count'), { childList: true });
  observer.observe(document.getElementById('hint-text'), { attributes: true, attributeFilter: ['hidden'] });
  update();
  window.addEventListener('pagehide', event => {
    if (!event.persisted) {
      observer.disconnect();
      viewer.destroy();
    }
  });
})();
