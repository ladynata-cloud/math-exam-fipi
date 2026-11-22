'use strict';

const assert = require('node:assert/strict');
const originalLessons = require('./ch3.json');
const supplement = [
  ...require('./exercises-743-752.json'), ...require('./exercises-753-763.json'),
  ...require('./exercises-764-782.json'), ...require('./exercises-783-797.json'),
  ...require('./exercises-798-805.json'), ...require('./exercises-806-821.json'),
  ...require('./exercises-822-831.json'), ...require('./exercises-832-837.json')
];

function sourceRecords(tasks) {
  return tasks.map(({ id, source }) => [id, source.reference, source.page, source.type, Boolean(source.adaptation)])
    .sort((a, b) => a[0].localeCompare(b[0]));
}

async function chapterThreeCards(page, lessonId, first, last) {
  const legacy = originalLessons.find(lesson => lesson.id === lessonId).tasks
    .filter(task => task.source.type === 'textbook');
  const original = [...legacy, ...require('./exercises-' + first + '-' + last + '.json')];
  const additional = supplement.filter(task => task.id.startsWith(lessonId + '-'));
  const rows = await page.evaluate(id => {
    const lesson = MakarychevCourse.lessons.find(item => item.id === id);
    return lesson.studyOrder.map(index => {
      const task = lesson.tasks[index];
      return { index, id: task.id, source: task.source, title: task.title, graph: Boolean(task.graph) };
    }).filter(row => row.source.type === 'textbook' || row.source.adaptation);
  }, lessonId);
  const sectionRows = rows.filter(row => !row.source.section);
  const appendixRows = rows.filter(row => row.source.section === 'additional-3');
  assert.equal(sectionRows.length + appendixRows.length, rows.length, lessonId + ' source section');
  assert.deepEqual(sourceRecords(sectionRows), sourceRecords(original), lessonId + ' numbered exercises and review questions');
  assert.deepEqual(sourceRecords(appendixRows), sourceRecords(additional), lessonId + ' supplementary exercises');
  return sectionRows;
}

module.exports = { chapterThreeCards };
