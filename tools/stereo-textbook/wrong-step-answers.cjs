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
  ['ex-main-0456-d/step-4', '45'], // Central angle before drawing its bisector.
  ['ex-main-0461/step-4', '8500'], // Kilograms in the field asking for tonnes.
  ['ex-main-0463/step-4', '2.25'], // Outer cross-section without subtracting the hole.
  ['ex-main-0466/step-2', '2/3'], // Side before squaring.
  ['ex-main-0467/step-2', '1/2'], // Radius in the area field.
  ['ex-main-0468/step-1', '1/2'], // Height in place of horizontal radius.
  ['ex-main-0468/step-2', '1/4'], // Radius before squaring it.
  ['ex-main-0468/step-3', '1/3'], // Integrating the radius instead of its square.
  ['ex-main-0469/step-1', '6'], // Half of the base instead of its altitude.
  ['ex-main-0469/step-2', '96'], // Omitting the triangle area factor.
  ['ex-main-0470/step-3', '5'], // Side length in the height field.
  ['ex-main-0471/step-1', '27'], // Squared median before taking two thirds.
  ['ex-main-0472/step-2', '25'], // Diameter instead of radius.
  ['ex-main-0472/step-3', '168'], // Area of the enclosing rectangle.
  ['theory-056/step-2', '2'], // Area without multiplying by layer thickness.
  ['theory-057/step-3', '6'], // Area in the volume field.
  ['theory-058/step-2', '1/2'], // Length ratio before squaring.
  ['theory-058/step-3', '24'], // Volume of the corresponding prism.
  ['theory-059/step-2', '1/2'], // Radius ratio in place of the area ratio.
  ['theory-059/step-3', '16'], // Volume coefficient for a full cylinder.
  ['ex-main-0464-c/step-4', '2.25'], // One of the six equilateral triangles.
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
