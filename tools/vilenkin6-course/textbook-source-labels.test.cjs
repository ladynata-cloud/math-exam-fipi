'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {test} = require('node:test');
const root = path.resolve(__dirname, '../../courses/vilenkin-6-part-1');
const labels = require(path.join(root, 'textbook-source-labels.js'));
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'textbook-data/source-catalog.json'), 'utf8'));
const units = ['A', 'B', 'C', 'D'].flatMap(block => JSON.parse(fs.readFileSync(path.join(root, `textbook-data/units-${block}.json`), 'utf8')));

test('all 44 point captions agree with the independently inventoried source hierarchy', () => {
  const {points, paragraphs, chapters} = catalog.hierarchy;
  assert.equal(points.length, 44);
  assert.deepEqual(points.map(point => point.id), Array.from({length:44}, (_, i) => i + 1));
  for (const point of points) {
    const paragraph = paragraphs.find(item => item.id === point.paragraph);
    const chapter = chapters.find(item => item.id === point.chapter);
    const actual = labels.hierarchyForPoint(point.id);
    assert(actual, `point ${point.id} must have a source paragraph`);
    assert(paragraph.pointIds.includes(point.id), `source paragraph must include point ${point.id}`);
    assert.equal(actual.id, paragraph.id, `point ${point.id} paragraph`);
    assert.equal(actual.title, paragraph.title, `point ${point.id} paragraph title`);
    assert.equal(actual.chapter, chapter.id, `point ${point.id} chapter`);
    assert.equal(actual.chapterTitle, chapter.title, `point ${point.id} chapter title`);
    assert.equal(actual.bookPart, point.bookPart, `point ${point.id} part`);
    assert.equal(labels.sectionLabel(point.id), `Пункт ${point.id} · § ${paragraph.id} «${paragraph.title}» · глава ${chapter.id} «${chapter.title}» · часть ${point.bookPart}`);
  }
});

test('exercise 2.14 is labelled as point 6 in paragraph 2, chapter I, part 1', () => {
  const unit = units.find(item => item.id === 6);
  const task = unit.tasks.find(item => item.source.number === '2.14' && item.source.part === 'а, число 108');
  const source = catalog.entries.find(item => item.bookPart === 1 && item.kind === 'exercise' && item.number === '2.14');
  assert(task && source);
  assert.equal(source.pointId, unit.id);
  assert.equal(source.paragraph, 2);
  assert.equal(source.chapter, 'I');
  assert.equal(source.printedPage, task.source.page);
  assert.equal(labels.taskLabel(task), 'Тренажёр к задаче № 2.14 · а, число 108');
  assert.equal(labels.sectionLabel(unit.id), 'Пункт 6 · § 2 «Действия со смешанными числами» · глава I «Смешанные числа» · часть 1');
  assert(!labels.sectionLabel(unit.id).includes('§ 6'), 'point number must not become paragraph number');
});

test('all current numbered exercise captions preserve actual source numbers and subparts', () => {
  let count = 0;
  for (const unit of units) for (const task of unit.tasks) {
    if (task.source.kind !== 'exercise') continue;
    count++;
    assert.equal(labels.taskLabel(task), `Тренажёр к задаче № ${task.source.number}${task.source.part ? ' · ' + task.source.part : ''}`);
  }
  assert(count > 100, 'the assertion must cover the current exercise collection');
});

test('grade 5 review and non-numbered source types are not presented as invented exercises', () => {
  assert.equal(labels.sectionLabel(0), 'Повторение за 5 класс');
  [0, -1, 45, 2.5, '6', null, NaN].forEach(point => assert.equal(labels.hierarchyForPoint(point), null));
  assert.equal(labels.taskLabel({source:{kind:'example', part:''}}), 'Разбор примера из учебника');
  assert.equal(labels.taskLabel({source:{kind:'question', part:''}}), 'Тренажёр к вопросу из учебника');
  assert.equal(labels.taskLabel({source:{kind:'check', part:'задание 1'}}), 'Тренажёр к проверочной работе · задание 1');
});
