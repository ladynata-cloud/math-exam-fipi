'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const { LearningStore } = require('../learning-store');
const { createLearningApi } = require('../learning-api');
const { createTeachingRouter } = require('../learning-teaching');
const { generatePaper, topics, getPaper, hasPaper } = require('../learning-paper');
const { tokenHash } = require('../learning-auth');
const contracts = require('../learning-contracts');
const op = () => crypto.randomUUID();
const HASH = 'scrypt1:' + '01'.repeat(16) + ':' + '02'.repeat(32);
const plain = value => value.replaceAll('−', '-');
const firstNumber = value => Number(plain(value).match(/-?\d+(?:\.\d+)?/)[0]);
const integers = value => [...value.matchAll(/\d+/g)].map(match => Number(match[0]));
// Evaluate only the arithmetic expression extracted from our authored public
// prompt. This deliberately does not reuse the generator's hidden operands.
function arithmetic(source) {
  const expression = plain(source).replaceAll('·', '*').trim();
  assert.match(expression, /^[0-9+*() .\/-]+$/);
  return Function('"use strict"; return (' + expression + ')')();
}
function assertMath(topic, index, prompt, answer) {
  const nums = integers(prompt), numeric = firstNumber(answer);
  if (topic === 'negative-numbers') {
    const expected = index < 5 ? arithmetic(prompt.slice(prompt.indexOf(':') + 1, -1)) : -nums[0] + nums[1] - nums[2];
    assert.equal(numeric, expected);
  } else if (topic === 'fractions') {
    const value = answer.includes('/') ? arithmetic(answer) : numeric;
    const [a, b, c, d] = nums;
    const expected = index === 0 ? a / b + c / d : index === 1 ? a / b - c / d : index === 2 ? a / b + c / d : index === 3 ? (a / b) * (c / d) : index === 4 ? (a / b) / (c / d) : a * b / c;
    assert(Math.abs(value - expected) < 1e-10, `${prompt} -> ${answer}`);
    if (answer.includes('/')) { const [n, denominator] = integers(answer); assert(denominator > 1); for (let i = 2; i <= Math.min(n, denominator); i++) assert(!(n % i === 0 && denominator % i === 0), 'Answer fraction must be reduced'); }
  } else if (topic === 'linear-equations' || topic === 'brackets') {
    const expression = prompt.slice(prompt.indexOf(':') + 1, -1);
    const [left, right] = expression.split('=');
    const substituted = left.replace(/(\d)\(/g, '$1*(').replace(/(\d)x/g, '$1*x').replaceAll('x', '(' + numeric + ')');
    assert.equal(arithmetic(substituted), arithmetic(right), prompt + ': substitution must satisfy the public equation');
    const coefficient = arithmetic(left.replace(/(\d)\(/g, '$1*(').replace(/(\d)x/g, '$1*x').replaceAll('x', '(1)')) - arithmetic(left.replace(/(\d)\(/g, '$1*(').replace(/(\d)x/g, '$1*x').replaceAll('x', '(0)'));
    assert.notEqual(coefficient, 0, 'The equation must have exactly one root');
  } else if (topic === 'proportions') {
    if (index < 3) assert.equal(numeric * nums[2], nums[0] * nums[1]);
    else assert.equal(numeric * nums[0], nums[1] * nums[2]);
  } else if (topic === 'percentages') {
    if (index % 3 === 0) assert.equal(numeric, nums[0] * nums[1] / 100);
    if (index % 3 === 1) assert.equal(numeric * nums[1], nums[0] * 100);
    if (index % 3 === 2) assert.equal(numeric * nums[0], nums[1] * 100);
  } else if (topic === 'adjacent-angles') {
    const angles = [...answer.matchAll(/\d+(?:\.\d+)?/g)].map(match => Number(match[0]));
    if (index < 3) assert.equal(numeric + nums[0], 180);
    if (index === 3) { assert.equal(angles[0] + angles[1], 180); assert.equal(angles[1] - angles[0], nums[0]); }
    if (index === 4) { assert.equal(angles[0] + angles[1], 180); assert.equal(angles[1] / angles[0], nums[0]); }
    if (index === 5) assert.equal(2 * numeric + nums[0], 180);
    angles.forEach(angle => assert(angle > 0 && angle < 180));
  }
}

test('seven original families have independently verified answers for 8,400 authored tasks', () => {
  for (const topic of Object.keys(topics)) for (let seed = 0; seed < 200; seed++) {
    const paper = generatePaper(topic, 'quality-' + seed);
    assert.equal(paper.tasks.length, 6); assert.equal(paper.answerKeys.length, 6);
    assert.deepEqual(generatePaper(topic, 'quality-' + seed), paper, 'Same seed must reproduce the exact paper snapshot');
    paper.tasks.forEach((task, index) => {
      assert.deepEqual(Object.keys(task).sort(), ['id', 'prompt']);
      assert.equal(task.id, paper.answerKeys[index].id);
      assertMath(topic, index, task.prompt, paper.answerKeys[index].answer);
    });
  }
  for (const invalid of ['__proto__', ['fractions'], null, {}, 1]) assert.throws(() => generatePaper(invalid, 'quality'), error => error.code === 'LEARNING_PAPER_TOPIC_INVALID');
  assert.throws(() => generatePaper('fractions', ''), error => error.code === 'LEARNING_PAPER_SEED_INVALID');
});

async function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mathexam-paper-test-'));
  let tick = 1700000000000;
  const store = new LearningStore({ filePath: path.join(directory, 'learning.sqlite'), contracts, clock: () => ++tick });
  const invite = store.bootstrap({ login: 'paper_teacher', name: 'Teacher fixture' }), teacher = store.activate(invite.invitationToken, HASH);
  const students = [1, 2].map(i => { const invitation = store.createStudent(teacher.account, { login: 'paper_student_' + i, name: 'Student fixture ' + i }); return store.activate(invitation.invitationToken, HASH); });
  const app = express(); app.use(express.json());
  const learning = createLearningApi({ store, publicOrigin: 'https://cabinet.example', secureCookies: true });
  app.use('/api/learning', learning.router); app.use('/api/learning', createTeachingRouter(learning));
  const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  t.after(async () => { await new Promise(resolve => server.close(resolve)); store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  async function request(session, route, body, extras = {}) {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/learning` + route, { method: body === undefined ? 'GET' : 'POST', headers: {
      ...(session ? { Cookie: '__Host-mathexam_learning=' + session.sessionToken } : {}),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json', Origin: 'https://cabinet.example', 'x-csrf-token': tokenHash('learning-csrf:' + session.sessionToken) }), ...extras
    }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: response.status, body: await response.json() };
  }
  async function draft() { const r = await request(teacher, '/assignments', { opId: op(), learnerIds: [students[0].account.id], title: 'Original homework fixture', trainerId: 'ege-path', contentId: 'equations-linear' }); assert.equal(r.status, 201); return r.body.assignments[0]; }
  return { store, teacher, students, request, draft };
}

test('paper generation is teacher-owned, private, idempotent and freezes on publication', async t => {
  const f = await fixture(t), assignment = await f.draft(), route = '/assignments/' + assignment.id;
  const body = { opId: op(), topic: 'linear-equations' };
  assert.equal((await f.request(f.students[0], route + '/paper', body)).status, 403);
  assert.equal((await f.request(f.teacher, route + '/paper', body, { Origin: 'https://wrong.example' })).status, 403);
  assert.equal((await f.request(f.teacher, route + '/paper', body, { 'x-csrf-token': 'wrong' })).status, 403);
  for (const invalidTopic of ['https://example.org', ['fractions'], {}, null, 1]) assert.equal((await f.request(f.teacher, route + '/paper', { ...body, topic: invalidTopic })).status, 400);
  const first = await f.request(f.teacher, route + '/paper', body); assert.equal(first.status, 201); assert.equal(first.body.paper.revision, 1);
  assert.equal(first.body.paper.answerKeys.length, 6);
  const duplicate = await f.request(f.teacher, route + '/paper', body); assert.equal(duplicate.body.duplicate, true); assert.deepEqual(duplicate.body.paper, first.body.paper);
  assert.equal((await f.request(f.teacher, route + '/paper', { ...body, topic: 'fractions' })).status, 409);
  assert.equal((await f.request(f.students[0], route)).status, 404);
  assert.equal((await f.request(f.students[1], route)).status, 404);
  assert.throws(() => getPaper(f.store, { role: 'teacher', id: 'unrelated' }, assignment.id), error => error.code === 'LEARNING_NOT_FOUND');
  assert.equal(hasPaper(f.store, assignment.id), true);
  const second = await f.request(f.teacher, route + '/paper', { opId: op(), topic: 'fractions' }); assert.equal(second.status, 201); assert.equal(second.body.paper.revision, 2);
  const published = await f.request(f.teacher, route + '/publish', { opId: op() }); assert.equal(published.status, 200, 'Original authored tasks are a valid paper format without a task photograph');
  const pupil = await f.request(f.students[0], route); assert.equal(pupil.status, 200); assert.deepEqual(pupil.body.paper.tasks, second.body.paper.tasks);
  assert(!Object.hasOwn(pupil.body.paper, 'answerKeys')); assert(!JSON.stringify(pupil.body.paper).includes('explanation'));
  assert.equal((await f.request(f.students[1], route)).status, 404);
  assert.equal((await f.request(f.teacher, route + '/paper', { opId: op(), topic: 'percentages' })).status, 409);
  assert.deepEqual((await f.request(f.teacher, route)).body.paper, second.body.paper, 'Published snapshot cannot silently change');
  assert.equal(pupil.body.attempt.outcome, 'started', 'Generation/publication never awards mastery');
});

test('archived attempts and exhausted draft revision budget reject new variants atomically', async t => {
  const f = await fixture(t), a = await f.draft(), route = '/assignments/' + a.id + '/paper';
  assert.equal((await f.request(f.teacher, route, { opId: op(), topic: 'brackets' })).status, 201);
  f.store.run('UPDATE learning_paper_homework SET revision=100 WHERE assignment_id=?', a.id);
  const before = getPaper(f.store, f.teacher.account, a.id);
  assert.equal((await f.request(f.teacher, route, { opId: op(), topic: 'percentages' })).status, 507);
  assert.deepEqual(getPaper(f.store, f.teacher.account, a.id), before);
  f.store.run('UPDATE attempts SET archived_at=? WHERE id=?', f.store.clock(), a.attemptId);
  assert.equal((await f.request(f.teacher, route, { opId: op(), topic: 'brackets' })).status, 409);
  assert.deepEqual(getPaper(f.store, f.teacher.account, a.id), before);
});
