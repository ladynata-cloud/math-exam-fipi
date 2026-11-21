'use strict';
const assert = require('node:assert/strict');

module.exports = async function checkDiagramText(page) {
  const result = await page.evaluate(() => {
    const preview = document.createElement('div'), problems = [];
    preview.style.cssText='position:absolute;top:0;left:0;width:290px;visibility:hidden;pointer-events:none';
    document.querySelector('#work').append(preview);
    let count=0;
    try {
      for (const lesson of window.MathExamTopicPractice.lessons.values()) {
        for (let sample=1; sample<=11; sample++) {
          preview.innerHTML=window.MathExamTopicEdition.figure(lesson.make(sample));
          const svg=preview.querySelector('svg'), bounds=svg.viewBox.baseVal;
          for (const label of svg.querySelectorAll('text')) {
            const box=label.getBBox(), tolerance=0.1;
            if (box.x<bounds.x-tolerance || box.y<bounds.y-tolerance ||
                box.x+box.width>bounds.x+bounds.width+tolerance || box.y+box.height>bounds.y+bounds.height+tolerance) {
              problems.push({lesson:lesson.id,sample,label:label.textContent});
            }
          }
          count++;
        }
      }
    } finally {preview.remove();}
    return {count,problems};
  });
  assert.equal(result.count,45*11);
  assert.deepEqual(result.problems,[],'Every generated model label must fit its SVG viewBox');
};
