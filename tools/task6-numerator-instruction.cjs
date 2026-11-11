'use strict';

const assert = require('node:assert/strict');

const stepStart = "calculate([an, 1n], '*', [bn, 1n], 'Умножь числители.', "
  + "fraction(binaryHtml([an, 1n], '*', [bn, 1n]), binaryHtml([ad, 1n], '*', [bd, 1n])), ";
const reviewedStep = stepStart + '{\n'
  + "        answerLabel: 'Числитель', note: 'Введи только числитель.'\n"
  + '      });';
const historicalStep = stepStart + "{ answerLabel: 'Числитель' });";

// Recover the earlier teaching snapshot for byte-preservation checks.
function restoreFractionMultiplicationStep(source) {
  assert.equal(source.split(reviewedStep).length, 2, 'One exact multiplication-step instruction');
  return source.replace(reviewedStep, historicalStep);
}

module.exports = { restoreFractionMultiplicationStep };
