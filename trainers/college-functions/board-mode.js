(function (root) {
  'use strict';
  let embedded = false;
  try {
    embedded = root.parent !== root && root.parent.location.origin === root.location.origin &&
      /\/trainers\/(?:trainer-board|group-board)\.html$/.test(root.parent.location.pathname);
  } catch (_) { /* Cross-origin parents are not trusted board hosts. */ }
  root.CollegeFunctionsBoardMode = embedded || new URLSearchParams(root.location.search).get('board') === '1';
  if (root.CollegeFunctionsBoardMode) document.documentElement.classList.add('college-board-mode');
})(window);
