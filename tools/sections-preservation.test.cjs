'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const course = require('../stereo-course/sections/data/course.json');
const baseline = require('./sections-harmonization-baseline.json');

test('all 186 original cards retain the exact approved-base mathematical and teaching data', () => {
  assert.equal(baseline.base, '5f25f75b6e7178ad1d492c7bcb28ed9e63c97bae');
  assert.equal(baseline.lessons.length, 186);
  assert.deepEqual(course.lessons.map(l=>l.id), baseline.lessons.map(l=>l.id));
  for (let i=0;i<course.lessons.length;i++) {
    const lesson=course.lessons[i];
    assert.equal(createHash('sha256').update(JSON.stringify(lesson)).digest('hex'),baseline.lessons[i].sha256,
      lesson.id+': preserve original conditions, answers, geometry and authored steps; an intentional change needs separate scope');
  }
});
