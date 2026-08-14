'use strict';

const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const serverDir = path.resolve(__dirname, '..');
const manifestPath = path.resolve(serverDir, '../trainers/board-compat.json');

async function freePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();
  await new Promise(resolve => server.close(resolve));
  return port;
}

async function waitForHealth(baseUrl, child, output) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`server exited early (${child.exitCode}): ${output.stderr}`);
    }
    try {
      const response = await fetch(`${baseUrl}/health`, { cache: 'no-store' });
      if (response.ok) return response.json();
    } catch (_error) {
      // The process may still be binding its port.
    }
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw new Error(`server startup timed out: ${output.stderr}`);
}

async function startServer({ registryPath, progressPath } = {}) {
  const port = await freePort();
  const output = { stdout: '', stderr: '' };
  const env = {
    ...process.env,
    HOST: '127.0.0.1',
    PORT: String(port),
    PROGRESS_CREATE_LIMIT: '100'
  };
  delete env.TRAINER_REGISTRY_PATH;
  delete env.PROGRESS_STORE_PATH;
  delete env.PROGRESS_PERSISTENCE_CONFIRMED;
  if (registryPath) env.TRAINER_REGISTRY_PATH = registryPath;
  if (progressPath) {
    env.PROGRESS_STORE_PATH = progressPath;
    env.PROGRESS_PERSISTENCE_CONFIRMED = '1';
  }
  const child = spawn(process.execPath, ['index.js'], {
    cwd: serverDir,
    env,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  child.stdout.on('data', chunk => { output.stdout += chunk; });
  child.stderr.on('data', chunk => { output.stderr += chunk; });
  const baseUrl = `http://127.0.0.1:${port}`;
  const health = await waitForHealth(baseUrl, child, output);
  return {
    baseUrl,
    health,
    output,
    async stop() {
      if (child.exitCode !== null) return;
      child.kill();
      await Promise.race([
        new Promise(resolve => child.once('exit', resolve)),
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);
      if (child.exitCode === null) child.kill('SIGKILL');
    }
  };
}

function bearer(code) {
  return { Authorization: `Bearer ${code}` };
}

async function jsonRequest(url, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  const response = await fetch(url, {
    ...options,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });
  return { response, body: await response.json() };
}

function progressManifest(directory) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const trainer = manifest.trainers.find(entry => entry.trainerId === 'ege-t1-planimetry');
  trainer.supportsProgressTracking = true;
  trainer.progressSchemaVersion = 1;
  const file = path.join(directory, 'board-compat.json');
  fs.writeFileSync(file, JSON.stringify(manifest), 'utf8');
  return file;
}

function sampleProgress() {
  return {
    schemaVersion: 1,
    tasks: {
      't1-17': { line: 1, state: 'clean', attempts: 2, errors: 1, hints: 0 },
      't2-4': { line: 2, state: 'helped', attempts: 3, errors: 2, hints: 1 }
    },
    drill: { runs: 2, best: 10, passed: true }
  };
}

test('progress API separates roles, persists across restart, and never places codes in URLs', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mathexam-progress-server-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const registryPath = progressManifest(directory);
  const progressPath = path.join(directory, 'progress.json');
  let server = await startServer({ registryPath, progressPath });
  t.after(async () => { await server.stop(); });

  assert.equal(server.health.progressStoreReady, true);
  assert.equal(server.health.progressStoreError, null);
  assert.equal(server.health.progressPersistenceConfirmed, true);
  assert.equal(server.health.progressAuthorizedTrainerCount, 1);
  assert.match(server.health.progressRegistryDigest, /^sha256:[0-9a-f]{64}$/);

  const workspaceResult = await jsonRequest(`${server.baseUrl}/api/progress/workspaces`, {
    method: 'POST',
    body: {}
  });
  assert.equal(workspaceResult.response.status, 201);
  assert.equal(workspaceResult.response.headers.get('cache-control'), 'no-store');
  assert.equal(workspaceResult.response.headers.get('x-powered-by'), null);
  const { workspaceId, teacherCode } = workspaceResult.body;
  assert.equal(new URL(workspaceResult.response.url).search, '');
  assert.equal(workspaceResult.response.url.includes(teacherCode), false);

  const deniedCreate = await jsonRequest(
    `${server.baseUrl}/api/progress/workspaces/${workspaceId}/assignments`,
    { method: 'POST', body: { studentLabel: 'Анна', trainerId: 'ege-t1-planimetry' } }
  );
  assert.equal(deniedCreate.response.status, 403);
  assert.equal(deniedCreate.body.error, 'PROGRESS_ACCESS_DENIED');

  const assignmentResult = await jsonRequest(
    `${server.baseUrl}/api/progress/workspaces/${workspaceId}/assignments`,
    {
      method: 'POST',
      headers: bearer(teacherCode),
      body: { studentLabel: 'Анна', trainerId: 'ege-t1-planimetry' }
    }
  );
  assert.equal(assignmentResult.response.status, 201);
  const { assignmentId, studentCode } = assignmentResult.body;
  assert.equal(assignmentResult.response.url.includes(studentCode), false);
  assert.equal(JSON.stringify(assignmentResult.body).includes('TokenHash'), false);

  const queryCodeRejected = await jsonRequest(
    `${server.baseUrl}/api/progress/workspaces/${workspaceId}/assignments?token=${teacherCode}`
  );
  assert.equal(queryCodeRejected.response.status, 403);

  const teacherCannotReadAsStudent = await jsonRequest(
    `${server.baseUrl}/api/progress/assignments/${assignmentId}`,
    { headers: bearer(teacherCode) }
  );
  assert.equal(teacherCannotReadAsStudent.response.status, 403);

  const updated = await jsonRequest(
    `${server.baseUrl}/api/progress/assignments/${assignmentId}`,
    {
      method: 'PUT',
      headers: bearer(studentCode),
      body: { trainerId: 'ege-t1-planimetry', progress: sampleProgress() }
    }
  );
  assert.equal(updated.response.status, 200);
  assert.equal(updated.body.revision, 1);
  assert.equal(updated.body.summary.started, 2);
  assert.equal(updated.body.summary.solved, 2);
  assert.equal(updated.body.summary.clean, 1);
  assert.equal(updated.body.summary.helped, 1);
  assert.equal(updated.body.summary.attempts, 5);
  assert.equal(updated.body.summary.errors, 3);
  assert.equal(updated.body.summary.lines[1].clean, 1);
  assert.equal(updated.body.summary.lines[2].helped, 1);
  assert.deepEqual(updated.body.summary.drill, { runs: 2, best: 10, passed: true });

  const listed = await jsonRequest(
    `${server.baseUrl}/api/progress/workspaces/${workspaceId}/assignments`,
    { headers: bearer(teacherCode) }
  );
  assert.equal(listed.response.status, 200);
  assert.equal(listed.body.assignments.length, 1);
  assert.equal(listed.body.assignments[0].studentLabel, 'Анна');
  assert.equal(listed.body.assignments[0].lastActivityAt, updated.body.lastActivityAt);
  assert.equal(JSON.stringify(listed.body).includes('Code'), false);
  assert.equal(JSON.stringify(listed.body).includes('TokenHash'), false);

  const persisted = fs.readFileSync(progressPath, 'utf8');
  assert.equal(persisted.includes(teacherCode), false);
  assert.equal(persisted.includes(studentCode), false);

  await server.stop();
  server = await startServer({ registryPath, progressPath });
  assert.equal(server.health.progressStoreReady, true);
  const afterRestart = await jsonRequest(
    `${server.baseUrl}/api/progress/workspaces/${workspaceId}/assignments`,
    { headers: bearer(teacherCode) }
  );
  assert.equal(afterRestart.response.status, 200);
  assert.equal(afterRestart.body.assignments[0].revision, 1);
  assert.equal(afterRestart.body.assignments[0].summary.drill.best, 10);
});

test('missing durable path returns 503 while rooms stay available', async t => {
  const server = await startServer();
  t.after(() => server.stop());
  assert.equal(server.health.progressStoreReady, false);
  assert.equal(server.health.progressStoreError, 'PROGRESS_PERSISTENCE_NOT_CONFIRMED');
  assert.equal(server.health.progressPersistenceConfirmed, false);

  const workspace = await jsonRequest(`${server.baseUrl}/api/progress/workspaces`, {
    method: 'POST',
    body: {}
  });
  assert.equal(workspace.response.status, 503);
  assert.equal(workspace.body.error, 'PROGRESS_PERSISTENCE_NOT_CONFIRMED');

  const room = await jsonRequest(`${server.baseUrl}/api/rooms`, { method: 'POST' });
  assert.equal(room.response.status, 201);
  assert.equal(typeof room.body.teacherToken, 'string');
});

test('valid store still rejects trainers without registry opt-in', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mathexam-progress-registry-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const server = await startServer({ progressPath: path.join(directory, 'progress.json') });
  t.after(() => server.stop());
  assert.equal(server.health.progressStoreReady, true);
  assert.equal(server.health.progressAuthorizedTrainerCount, 0);
  assert.match(server.health.progressRegistryDigest, /^sha256:[0-9a-f]{64}$/);

  const workspace = await jsonRequest(`${server.baseUrl}/api/progress/workspaces`, {
    method: 'POST',
    body: {}
  });
  const assignment = await jsonRequest(
    `${server.baseUrl}/api/progress/workspaces/${workspace.body.workspaceId}/assignments`,
    {
      method: 'POST',
      headers: bearer(workspace.body.teacherCode),
      body: { studentLabel: 'Ученик', trainerId: 'ege-t1-planimetry' }
    }
  );
  assert.equal(assignment.response.status, 422);
  assert.equal(assignment.body.error, 'PROGRESS_TRAINER_NOT_AUTHORIZED');
});
