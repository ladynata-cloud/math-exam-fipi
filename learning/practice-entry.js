/* Explicit public practice links reuse each trainer's own navigation.
 * Managed attempts and ordinary entry links keep their existing behaviour. */
(function () {
  'use strict';
  const params = new URLSearchParams(location.search);
  if (params.get('practice') !== '1' || params.get('learning') === '1') return;

  const selectors = Object.freeze({
    '/trainers/oge-basics/negative-add-subtract.html': '.route.practice[data-route="practice"]',
    '/trainers/oge-basics/fraction-common-denominator.html': '.route.practice[data-route="practice"]',
    '/trainers/oge-basics/percentages/proportion.html': '.route[data-go="practice"]',
    '/trainers/oge-basics/percentages/percent-of-number-and-whole.html': '.route[data-go="practice"]',
    '/ege-baza/path/index.html': '.stage-nav [data-stage="2"]'
  });
  if (!Object.prototype.hasOwnProperty.call(selectors, location.pathname)) return;

  function enterPractice() {
    if (location.pathname === '/ege-baza/path/index.html') {
      const current = document.querySelector('.stage-nav [aria-current="step"]');
      // Keep the current task, draft, solved steps, independent attempt or
      // written reflection. Never click a button that creates a new variant.
      if (!current || !['0', '1'].includes(current.dataset.stage)) return;
    }
    const button = document.querySelector(selectors[location.pathname]);
    if (button && !button.disabled) button.click();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enterPractice, { once: true });
  } else {
    enterPractice();
  }
})();
