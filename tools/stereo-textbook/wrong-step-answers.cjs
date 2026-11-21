'use strict';

const assert = require('node:assert/strict');

function wrongStepAnswers(lessonId, step) {
  const accepted = step.input.accepted;
  const first = accepted[0];
  if (first === 'да') return ['нет'];
  if (first === 'нет') return ['да'];

  // №423 has two slant heights. Picking the wrong face must trigger the hint
  // about the perpendicular from the centre to the chosen side.
  if (lessonId === 'ex-main-0423' && step.id === 'step-2') return ['4*sqrt(10)'];
  if (lessonId === 'ex-main-0423' && step.id === 'step-3') return ['3*sqrt(17)'];

  const match = /^(\d+)(?:\/(\d+))?$/.exec(first);
  assert(match, 'review a meaningful wrong answer for ' + lessonId + ' ' + step.id);
  const numerator = Number(match[1]) + 1;
  const answers = [match[2] ? numerator + '/' + match[2] : String(numerator)];
  if (accepted.some(answer => /^[а-яё]+$/iu.test(answer))) {
    const wrongWords = {3: 'четыре', 6: 'семь'};
    assert(wrongWords[match[1]], 'review a wrong word for mixed numeric/text input');
    answers.push(wrongWords[match[1]]);
  }
  return answers;
}

module.exports = {wrongStepAnswers};
