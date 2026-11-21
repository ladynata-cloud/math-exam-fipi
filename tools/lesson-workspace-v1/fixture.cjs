'use strict';

// Disposable identities and SQLite only. No deployed endpoint is configurable.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { randomUUID } = require('node:crypto');
const { createRequire } = require('node:module');
const ROOT = path.resolve(__dirname, '../..');
const express = createRequire(path.join(ROOT, 'board-server/package.json'))('express');
const { LearningStore } = require('../../board-server/learning-store');
const { createLearningApi } = require('../../board-server/learning-api');
const { createTeachingRouter, initializeTeaching } = require('../../board-server/learning-teaching');
const { FamilyAccess } = require('../../board-server/learning-family');
const contracts = require('../../board-server/learning-contracts');
const catalog = require('../../learning/catalog');
const HASH = 'scrypt1:' + '01'.repeat(16) + ':' + '02'.repeat(32);
const MATERIAL_IDS = ['path:equations-linear', 'path:percent'];
const copy = value => JSON.parse(JSON.stringify(value));

function fixture() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lesson-workspace-v1-'));
  const store = new LearningStore({ filePath: path.join(directory, 'learning.sqlite'), contracts });
  assert.equal(store.available, true, 'This gate requires actual SQLite, never an in-memory substitute');
  initializeTeaching(store);
  const teacher = store.activate(store.bootstrap({ login: 'lesson_gate_teacher', name: 'Преподаватель проверки' }).invitationToken, HASH);
  const pupils = ['pupil', 'peer'].map((name, index) => {
    const created = store.createStudent(teacher.account, { login: 'lesson_gate_' + name, name: 'Проверочный ученик ' + (index + 1) }, HASH);
    return store.createSession(created.student.id);
  });
  const [pupil, peer] = pupils;
  const family = new FamilyAccess(store);
  const invitation = family.write(teacher.sessionToken, pupil.account.id, { expectedVersion: 0, name: 'Проверочный родитель' });
  const parent = family.activate(invitation.invitationToken, HASH, family.invitation(invitation.invitationToken).row, () => {});
  let source = store.createAttempt(pupil.account, { opId: randomUUID(), trainerId: 'ege-path', contentId: 'equations-linear' }).attempt;
  const state = copy(source.state);
  state.work.draft = '17';
  source = store.action(pupil.account, source.id, { opId: randomUUID(), expectedVersion: source.version, type: 'state', payload: { state } }).attempt;
  const peerWork = store.createAttempt(peer.account, { opId: randomUUID(), trainerId: 'ege-path', contentId: 'percent' }).attempt;
  const materialItems = MATERIAL_IDS.map(id => {
    const item = catalog.get(id);
    assert(item && item.trainerId === 'ege-path', 'The fixture must use a real managed catalogue item');
    return item;
  });
  let closed = false;
  return {
    store, directory, teacher, pupil, peer, parent, source, peerWork, materialItems,
    close() {
      if (closed) return;
      closed = true;
      store.close();
      fs.rmSync(directory, { recursive: true, force: true });
    }
  };
}

// Content and attribution tables, including all events/operation receipts.
// Sessions are excluded because observing a page may legitimately refresh auth.
function learningSnapshot(store) {
  const tables = store.rows("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
    .map(row => row.name).filter(name => !/session|invitation|recovery|quick_grant/.test(name));
  return JSON.stringify(tables.map(name => [name,
    store.rows('SELECT * FROM "' + name.replace(/"/g, '""') + '"').map(row => JSON.stringify(row)).sort()]));
}

function listen(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, '127.0.0.1', () => resolve(server));
    server.once('error', reject);
  });
}
async function closeServer(server) {
  if (!server) return;
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}

async function serve(f) {
  let trainerServer, cabinetServer;
  const trainerRequests = [];
  const apiRequests = [];
  try {
    const trainer = express();
    trainer.use((req, _res, next) => {
      trainerRequests.push({ path: req.path, headers: { cookie: req.get('cookie'), authorization: req.get('authorization'),
        account: req.get('x-learning-account'), csrf: req.get('x-csrf-token'), referer: req.get('referer') } });
      next();
    });
    trainer.use(express.static(ROOT));
    trainerServer = await listen(trainer);
    // Different hostnames keep cabinet cookies off the trainer, not just origins.
    const trainerOrigin = 'http://localhost:' + trainerServer.address().port;
    const app = express();
    app.use(express.json({ limit: '200kb' }));
    cabinetServer = await listen(app);
    const origin = 'http://127.0.0.1:' + cabinetServer.address().port;
    app.get('/api/learning/status', (_req, res) => res.json({ ...f.store.status(), trainerOrigin }));
    app.use('/api/learning', (req, _res, next) => { apiRequests.push({ path: req.path, method: req.method }); next(); });
    const api = createLearningApi({ store: f.store, publicOrigin: origin, secureCookies: false });
    app.use('/api/learning', api.router, createTeachingRouter(api));
    app.use(express.static(ROOT));
    return { origin, trainerOrigin, trainerRequests, apiRequests,
      async close() { await closeServer(cabinetServer); await closeServer(trainerServer); } };
  } catch (error) {
    await closeServer(cabinetServer); await closeServer(trainerServer); throw error;
  }
}

module.exports = { ROOT, MATERIAL_IDS, fixture, serve, learningSnapshot, copy, catalog };
