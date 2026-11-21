'use strict';

const assert = require('node:assert/strict');

// Numerical mistakes linked to the actual diagram or unit choice at each step.
const misconceptions = new Map([
  ['ex-main-0423/step-2', '4*sqrt(10)'], // Apothem of the other face.
  ['ex-main-0423/step-3', '3*sqrt(17)'],
  ['ex-main-0430-b/step-4', '5/4'], // Centre on the opposite side of the base plane.
  ['ex-main-0433/step-2', 'sqrt(33)/6'], // Half the height in place of the inradius.
  ['ex-main-0433/step-3', '4*sqrt(33)/11'], // Omitted factor 2 in the denominator.
  ['ex-main-0434/step-4', '2*sqrt(2)'], // Half-side in place of the side.
  ['ex-main-0436-a/step-4', '2/sqrt(3)'], // Reversed ratio of the legs.
  ['ex-main-0436-b/step-4', '6*sqrt(3)'],
  ['ex-main-0444/step-4', '3900'], // Grams instead of kilograms.
  ['theory-053/step-2', '1440'], // Counted the small cubes without converting their volume.
]);

function wrongStepAnswers(lessonId, step) {
  const accepted = step.input.accepted;
  const first = accepted[0];
  if (first === 'да') return ['нет'];
  if (first === 'нет') return ['да'];

  const misconception = misconceptions.get(lessonId + '/' + step.id);
  if (misconception) return [misconception];

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
