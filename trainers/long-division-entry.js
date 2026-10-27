/* The public download reuses the same trainer; only its outgoing links differ. */
(function () {
  'use strict';
  if (location.protocol !== 'file:' || !window.PreOgeArithmetic) return;
  const route = window.PreOgeArithmetic;
  for (const name of ['practiceURL', 'routeURL', 'guidedURL']) {
    const original = route[name];
    route[name] = function (level) {
      const value = original(level);
      return value ? new URL(value, 'https://mathexam.space/').href : value;
    };
  }
})();
