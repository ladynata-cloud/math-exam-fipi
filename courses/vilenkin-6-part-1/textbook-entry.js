(function () {
  'use strict';
  // Existing cabinet attempts retain their established lesson IDs and contract.
  // The revised textbook exercises have separate IDs and browser progress.
  const params = new URLSearchParams(location.search);
  if (params.get('learning') === '1' || params.get('legacy') === '1' || location.protocol === 'file:') return;
  const target = new URL('textbook.html', location.href);
  const match = location.hash.match(/^#lesson\/(\d+)(?:\/|$)/);
  if (match && Number(match[1]) <= 23) target.hash = '#unit/' + Number(match[1]);
  else if (location.hash === '#progress') target.hash = '#progress';
  else if (location.hash.startsWith('#book')) target.hash = '#book';
  location.replace(target.href);
})();
