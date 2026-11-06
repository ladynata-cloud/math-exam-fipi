(function (root) {
  'use strict';
  let embedded = false;
  try {
    embedded = root.parent !== root && root.parent.location.origin === root.location.origin &&
      /\/trainers\/(?:trainer-board|group-board)\.html$/.test(root.parent.location.pathname);
  } catch (_) { /* A foreign parent is not a trusted board host. */ }
  // Runs in <head>, before any application code can read personal progress.
  root.CollegeLogarithmsBoardMode = embedded || new URLSearchParams(root.location.search).get('board') === '1';
  if (root.CollegeLogarithmsBoardMode) root.document.documentElement.classList.add('logarithm-board-mode');
})(window);
