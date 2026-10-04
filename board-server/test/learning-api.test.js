'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const express = require('express');
const { once } = require('node:events');
const { createLearningApi } = require('../learning-api');
const { LearningStore } = require('../learning-store');
const { hashPassword } = require('../learning-auth');
const contracts = require('../learning-contracts');
const PASSWORD = 'correct horse battery staple';
const passwordHash = hashPassword(PASSWORD);
const ORIGIN = 'https://cabinet.example.test';

async function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'learning-api-test-'));
  const filePath = path.join(directory, 'learning.sqlite');
  const api = createLearningApi({ filePath, contracts, publicOrigin: ORIGIN, secureCookies: false });
  const bootstrap = api.store.bootstrap({ login: 'teacher', name: 'Teacher' });
  const activated = api.store.activate(bootstrap.invitationToken, await passwordHash);
  const app = express(); app.use(express.json({ limit: '128kb' })); app.use('/api/learning', api.router);
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  const address = `http://127.0.0.1:${server.address().port}/api/learning`;
  t.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); api.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  async function request(route, { method = 'GET', body, cookie, csrf, origin = ORIGIN } = {}) {
    const response = await fetch(address + route, { method, headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(origin ? { Origin: origin } : {}), ...(cookie ? { Cookie: cookie } : {}), ...(csrf ? { 'X-CSRF-Token': csrf } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const text = await response.text();
    let data; try { data = JSON.parse(text); } catch (_error) { data = text; }
    return { status: response.status, data, cookie: response.headers.get('set-cookie')?.split(';')[0], headers: response.headers };
  }
  return { api, request, activated, filePath };
}

test('same-origin cookie session has CSRF protection; trainer origin and missing headers cannot mutate', async t => {
  const { api, request } = await fixture(t);
  const login = await request('/login', { method: 'POST', body: { login: 'teacher', password: PASSWORD } });
  assert.equal(login.status, 200); assert.match(login.cookie, /^mathexam_learning_local=/);
  assert.ok(login.headers.get('set-cookie').includes('HttpOnly')); assert.ok(login.headers.get('set-cookie').includes('SameSite=Strict'));
  assert.ok(!JSON.stringify(login.data).includes('sessionToken'));
  const body = { name: 'Learner', login: 'learner' };
  for (const options of [{ origin: 'https://mathexam.space', csrf: login.data.csrfToken }, { origin: null, csrf: login.data.csrfToken }, { csrf: undefined }]) {
    const denied = await request('/teacher/students', { method: 'POST', body, cookie: login.cookie, ...options });
    assert.equal(denied.status, 403);
  }
  assert.equal(api.store.students(login.data.account).length, 0);
  const good = await request('/teacher/students', { method: 'POST', body, cookie: login.cookie, csrf: login.data.csrfToken });
  assert.equal(good.status, 201);
  const session = await request('/session', { cookie: login.cookie });
  assert.equal(session.data.account.id, login.data.account.id);
  assert.equal(session.data.csrfToken, login.data.csrfToken);
});

test('login failures are generic and account/source attempts are rate limited', async t => {
  const { request } = await fixture(t);
  const nonexistent = await request('/login', { method: 'POST', body: { login: 'unknown', password: PASSWORD } });
  const wrong = await request('/login', { method: 'POST', body: { login: 'teacher', password: 'different long password' } });
  assert.equal(nonexistent.status, 401); assert.equal(wrong.status, 401); assert.deepEqual(nonexistent.data, wrong.data);
  const blockedOrigin = await request('/login', { method: 'POST', body: { login: 'teacher', password: PASSWORD }, origin: 'https://mathexam.space' });
  assert.equal(blockedOrigin.status, 403);
  for (let i = 0; i < 7; i++) assert.equal((await request('/login', { method: 'POST', body: { login: 'teacher', password: 'short' } })).status, 401);
  const limited = await request('/login', { method: 'POST', body: { login: 'teacher', password: PASSWORD } });
  assert.equal(limited.status, 429); assert.equal(limited.headers.get('retry-after'), '60');
});

test('activation is one-use, student cannot create learners, recovery revokes earlier sessions', async t => {
  const { api, request, activated } = await fixture(t);
  const student = api.store.createStudent(activated.account, { name: 'Learner', login: 'learner' });
  const login = await request('/activate', { method: 'POST', body: { token: student.invitationToken, password: PASSWORD } });
  assert.equal(login.status, 200); assert.equal(login.data.account.role, 'student');
  const repeated = await request('/activate', { method: 'POST', body: { token: student.invitationToken, password: PASSWORD } });
  assert.equal(repeated.status, 401);
  const forbidden = await request('/teacher/students', { method: 'POST', body: { name: 'Other', login: 'other' }, cookie: login.cookie, csrf: login.data.csrfToken });
  assert.equal(forbidden.status, 403);
  const reset = api.store.recoverStudent(activated.account, student.student.id);
  assert.equal((await request('/session', { cookie: login.cookie })).status, 200);
  const recovered = await request('/activate', { method: 'POST', body: { token: reset.invitationToken, password: 'new correct password' } });
  assert.equal(recovered.status, 200);
  assert.equal((await request('/session', { cookie: login.cookie })).status, 401);
  assert.equal((await request('/session', { cookie: recovered.cookie })).status, 200);
});

test('durability, private file mode and exclusive ownership survive reopening with consumed recovery codes', async t => {
  const { api, activated, filePath } = await fixture(t);
  const second = new LearningStore({ filePath, contracts });
  assert.equal(second.status().available, false); second.close();
  const code = activated.recoveryCodes[0];
  const recovered = api.store.recoverTeacher('teacher', code, await passwordHash);
  api.close();
  const reopened = new LearningStore({ filePath, contracts });
  try {
    assert.equal(reopened.status().available, true);
    assert.equal(fs.statSync(filePath).mode & 0o777, 0o600);
    assert.equal(reopened.session(recovered.sessionToken).id, activated.account.id);
    assert.throws(() => reopened.session(activated.sessionToken), { code: 'LEARNING_UNAUTHORIZED' });
    assert.throws(() => reopened.recoverTeacher('teacher', code, 'unused'), { code: 'LEARNING_ACCESS_INVALID' });
    assert.throws(() => reopened.bootstrap({ login: 'another', name: 'Another' }), { code: 'LEARNING_ALREADY_BOOTSTRAPPED' });
  } finally { reopened.close(); }
});

test('real contracts cannot turn client completion state into an independent grade', async t => {
  const { api, activated } = await fixture(t);
  const invite = api.store.createStudent(activated.account, { name: 'Learner', login: 'learner' });
  const learner = api.store.activate(invite.invitationToken, await passwordHash).account;
  const item = contracts.list().find(item => item.trainerId === 'ege-path');
  const initial = api.store.createAttempt(learner, { opId: 'create_real_attempt_1', trainerId: item.trainerId, contentId: item.contentId }).attempt;
  const next = structuredClone(initial.state); next.work.stage = 3; next.work.done = true; next.work.draft = '999999999';
  const saved = api.store.action(learner, initial.id, { opId: 'forge_done_state_1', expectedVersion: 0, type: 'state', payload: { state: next } });
  assert.equal(saved.attempt.outcome, 'started');
  const checked = api.store.action(learner, initial.id, { opId: 'wrong_final_check_1', expectedVersion: 1, type: 'check', payload: { state: next, details: { scope: 'final', answer: '999999999' } } });
  assert.equal(checked.evaluation.correct, false); assert.equal(checked.attempt.outcome, 'started'); assert.equal(checked.attempt.version, 2);
});

test('lesson assignment clones one condition and learner fresh task atomically follows the same seat and presentation', async t => {
  const { api, activated } = await fixture(t);
  const learners = [];
  for (const login of ['first', 'second']) {
    const invite = api.store.createStudent(activated.account, { name: login, login });
    learners.push(api.store.activate(invite.invitationToken, await passwordHash).account);
  }
  const item = contracts.list().find(item => item.trainerId === 'ege-path');
  let lesson = api.store.createLesson(activated.account, { opId: 'lesson_creation_test', title: 'Lesson', learnerIds: learners.map(a => a.id) }).lesson;
  lesson = api.store.lessonAction(activated.account, lesson.id, { opId: 'lesson_assign_test', expectedVersion: 0, type: 'assign',
    payload: { learnerIds: [...learners.map(a => a.id), 'common'], trainerId: item.trainerId, contentId: item.contentId } }).lesson;
  assert.notEqual(lesson.seats[0].attemptId, lesson.seats[1].attemptId);
  assert.deepEqual(lesson.seats[0].attempt.taskSpec, lesson.seats[1].attempt.taskSpec);
  assert.deepEqual(lesson.common.taskSpec, lesson.seats[0].attempt.taskSpec);
  assert.equal(lesson.common.controller, 'teacher');
  const source = lesson.seats[0].attempt;
  lesson = api.store.lessonAction(activated.account, lesson.id, { opId: 'lesson_present_test', expectedVersion: 1, type: 'present', payload: { target: learners[0].id } }).lesson;
  const body = { opId: 'fresh_in_lesson_test', trainerId: item.trainerId, contentId: item.contentId, fresh: true, sourceAttemptId: source.id, lessonId: lesson.id };
  const created = api.store.createAttempt(learners[0], body);
  const updated = api.store.getLesson(activated.account, lesson.id);
  assert.equal(updated.version, 3); assert.equal(updated.seats[0].attemptId, created.attempt.id);
  assert.equal(updated.seats[1].attemptId, lesson.seats[1].attemptId);
  assert.equal(updated.presentation.attempt.id, created.attempt.id);
  assert.equal(api.store.createAttempt(learners[0], body).duplicate, true);
  assert.equal(api.store.getLesson(activated.account, lesson.id).version, 3);
});

test('fresh group task cannot replace a changed seat or bypass active teacher control', async t => {
  const { api, activated } = await fixture(t);
  const invite = api.store.createStudent(activated.account, { name: 'Learner', login: 'learner' });
  const learner = api.store.activate(invite.invitationToken, await passwordHash).account;
  const item = contracts.list().find(item => item.trainerId === 'ege-path');
  const source = api.store.createAttempt(learner, { opId: 'source_for_lesson', trainerId: item.trainerId, contentId: item.contentId }).attempt;
  const lesson = api.store.createLesson(activated.account, { opId: 'source_lesson_create', title: 'Lesson', learnerIds: [learner.id] }).lesson;
  api.store.action(activated.account, source.id, { opId: 'take_source_control', expectedVersion: 0, expectedTrainerVersion: 0, type: 'control', payload: { controller: 'teacher' } });
  const body = { opId: 'blocked_fresh_task', trainerId: item.trainerId, contentId: item.contentId, sourceAttemptId: source.id, fresh: true, lessonId: lesson.id };
  assert.throws(() => api.store.createAttempt(learner, body), { code: 'LEARNING_CONTROL_REQUIRED' });
  api.store.action(activated.account, source.id, { opId: 'return_source_control', expectedVersion: 1, expectedTrainerVersion: 1, type: 'control', payload: { controller: 'student' } });
  api.store.lessonAction(activated.account, lesson.id, { opId: 'change_source_task', expectedVersion: 0, type: 'assign', payload: { learnerIds: [learner.id], trainerId: item.trainerId, contentId: item.contentId } });
  assert.throws(() => api.store.createAttempt(learner, body), { code: 'LEARNING_LESSON_CONTEXT_INVALID' });
});
