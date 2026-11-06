(function (root) {
  'use strict';
  // This script runs before the app can touch personal browser storage.
  let embedded = false;
  try {
    embedded = root.parent !== root &&
      root.parent.location.origin === root.location.origin &&
      /\/trainers\/(?:trainer-board|group-board)\.html$/.test(root.parent.location.pathname);
  } catch (_) { /* An unrelated cross-origin frame does not grant board access. */ }
  root.VPRBoardMode = embedded || new URLSearchParams(root.location.search).get('board') === '1';
  if (root.VPRBoardMode) root.document.documentElement.classList.add('board-mode');
})(window);
