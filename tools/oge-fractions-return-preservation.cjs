'use strict';

const assert = require('node:assert/strict');

const wayfinding = '<script defer src="/assets/oge-wayfinding.js"></script>\n';
const fractionsReturn = '<script defer src="/assets/oge-fractions-return.js?v=20261118-drafts"></script>\n';

// Invert only the exact learner-navigation include on the public source page.
// The caller still compares the remaining exercise to its historical receipt.
function restoreFractionsReturn(html) {
  assert.equal(html.split('oge-fractions-return.js').length, 2, 'One fraction return script reference');
  assert.equal(html.split(wayfinding + fractionsReturn).length, 2, 'Exact fraction return script after wayfinding');
  return html.replace(wayfinding + fractionsReturn, wayfinding);
}

module.exports = { fractionsReturn, restoreFractionsReturn };
