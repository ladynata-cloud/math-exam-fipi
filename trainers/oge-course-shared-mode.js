/* Decide before native stores initialize: a shared room owns no personal work. */
(function (root) {
  'use strict';
  let embedded = false;
  try { embedded = root.parent !== root && root.parent.location.origin === root.location.origin && /\/(?:trainer-board|group-board)\.html$/.test(root.parent.location.pathname); } catch (_) {}
  root.OgeCourseSharedMode = embedded || new URLSearchParams(root.location.search).get('board') === '1';
})(window);
