'use strict';

const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { io: createSocketClient } = require('socket.io-client');

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
      if (response.ok) return;
    } catch (_error) {
      // The process may still be binding its port.
    }
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw new Error(`server startup timed out: ${output.stderr}`);
}

async function startServer(registryPath, runtimeServerDir = serverDir) {
  const port = await freePort();
  const output = { stdout: '', stderr: '' };
  const env = {
    ...process.env,
    HOST: '127.0.0.1',
    PORT: String(port)
  };
  delete env.TRAINER_REGISTRY_PATH;
  if (registryPath) env.TRAINER_REGISTRY_PATH = registryPath;
  if (runtimeServerDir !== serverDir) {
    env.NODE_PATH = [path.join(serverDir, 'node_modules'), env.NODE_PATH]
      .filter(Boolean)
      .join(path.delimiter);
  }
  const child = spawn(process.execPath, ['index.js'], {
    cwd: runtimeServerDir,
    env,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  child.stdout.on('data', chunk => { output.stdout += chunk; });
  child.stderr.on('data', chunk => { output.stderr += chunk; });
  const baseUrl = `http://127.0.0.1:${port}`;
  await waitForHealth(baseUrl, child, output);
  return {
    baseUrl,
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

async function temporaryFile(content, callback) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mathexam-server-registry-'));
  const file = path.join(directory, 'board-compat.json');
  fs.writeFileSync(file, content, 'utf8');
  try {
    return await callback(file);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

function waitForSocketEvent(socket, event, predicate = () => true, timeoutMs = 2500) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(event, listener);
      reject(new Error(`timed out waiting for ${event}`));
    }, timeoutMs);
    function listener(payload) {
      if (!predicate(payload)) return;
      clearTimeout(timer);
      socket.off(event, listener);
      resolve(payload);
    }
    socket.on(event, listener);
  });
}

function expectNoSocketEvent(socket, event, action, timeoutMs = 250) {
  return new Promise((resolve, reject) => {
    const listener = payload => {
      clearTimeout(timer);
      socket.off(event, listener);
      reject(new Error(`unexpected ${event}: ${JSON.stringify(payload)}`));
    };
    const timer = setTimeout(() => {
      socket.off(event, listener);
      resolve();
    }, timeoutMs);
    socket.on(event, listener);
    action();
  });
}

async function connectParticipant(baseUrl, room, role) {
  const token = role === 'teacher' ? room.teacherToken : room.studentToken;
  const socket = createSocketClient(baseUrl, {
    autoConnect: false,
    forceNew: true,
    reconnection: false,
    transports: ['websocket', 'polling']
  });
  const connected = waitForSocketEvent(socket, 'connect');
  socket.connect();
  await connected;
  const roomState = waitForSocketEvent(socket, 'room:state');
  socket.emit('room:join', { roomId: room.roomId, role, token, proto: 2 });
  return { socket, token, state: await roomState };
}

async function createRoom(baseUrl) {
  const response = await fetch(`${baseUrl}/api/rooms`, { method: 'POST' });
  assert.equal(response.status, 201);
  return response.json();
}

function authPayload(room, participant, extra = {}) {
  return { roomId: room.roomId, token: participant.token, ...extra };
}

function bridgeState(room, participant, trainerId, state, extra = {}) {
  return authPayload(room, participant, {
    trainerId,
    trainer: trainerId,
    protocolVersion: 1,
    trainerVersion: '1.0.0',
    stateSchemaVersion: 1,
    state,
    ...extra
  });
}

test('valid registry endpoint, health, CORS, and room API are compatible', async t => {
  const server = await startServer();
  t.after(() => server.stop());

  const endpoint = await fetch(`${server.baseUrl}/api/trainer-registry`, {
    headers: { Origin: 'https://mathexam.space' },
    cache: 'no-store'
  });
  assert.equal(endpoint.status, 200);
  assert.match(endpoint.headers.get('cache-control') || '', /no-store/i);
  assert.equal(endpoint.headers.get('access-control-allow-origin'), 'https://mathexam.space');
  const registry = await endpoint.json();
  assert.equal(registry.schemaVersion, 1);
  assert.match(registry.digest, /^sha256:[0-9a-f]{64}$/);
  assert.equal(registry.trainers.length, 2);
  assert.deepEqual(
    registry.trainers.map(entry => entry.trainerId),
    ['linear-inequalities-stepwise', 'negative-numbers-line']
  );

  const localhostCors = await fetch(`${server.baseUrl}/api/trainer-registry`, {
    headers: { Origin: 'http://localhost:5173' },
    cache: 'no-store'
  });
  assert.equal(localhostCors.status, 200);
  assert.equal(localhostCors.headers.get('access-control-allow-origin'), 'http://localhost:5173');

  const healthResponse = await fetch(`${server.baseUrl}/health`, { cache: 'no-store' });
  assert.equal(healthResponse.status, 200);
  const health = await healthResponse.json();
  assert.equal(health.ok, true);
  assert.equal(typeof health.rooms, 'number');
  assert.equal(typeof health.serverStartedAt, 'string');
  assert.equal(typeof health.roomTtlMs, 'number');
  assert.equal(typeof health.roomCleanupIntervalMs, 'number');
  assert.equal(health.features.roomTtlCleanup, true);
  assert.equal(health.registryLoaded, true);
  assert.equal(health.registrySchemaVersion, 1);
  assert.equal(health.registryDigest, registry.digest);
  assert.equal(health.registrySource, 'bundled-default');
  assert.equal(health.registryEntryCount, 2);
  assert.equal(health.registryError, null);

  const roomResponse = await fetch(`${server.baseUrl}/api/rooms`, { method: 'POST' });
  assert.equal(roomResponse.status, 201);
  const room = await roomResponse.json();
  assert.equal(typeof room.roomId, 'string');
  assert.equal(typeof room.teacherToken, 'string');
  assert.equal(typeof room.studentToken, 'string');
  assert.equal(typeof room.state, 'object');

  const serializedRegistry = JSON.stringify(registry);
  for (const forbidden of ['teacherToken', 'studentToken', 'roomId', 'stack', manifestPath]) {
    assert.equal(serializedRegistry.includes(forbidden), false);
  }
  assert.equal(server.output.stderr.includes('Trainer registry parity check failed'), false);
});

test('invalid registry keeps health and room lifecycle alive', async () => {
  await temporaryFile('{ invalid json', async file => {
    const server = await startServer(file);
    try {
      const endpoint = await fetch(`${server.baseUrl}/api/trainer-registry`, { cache: 'no-store' });
      assert.equal(endpoint.status, 503);
      assert.match(endpoint.headers.get('cache-control') || '', /no-store/i);
      assert.deepEqual(await endpoint.json(), {
        schemaVersion: 1,
        digest: null,
        trainers: [],
        error: 'REGISTRY_JSON_INVALID'
      });

      const healthResponse = await fetch(`${server.baseUrl}/health`, { cache: 'no-store' });
      assert.equal(healthResponse.status, 200);
      const health = await healthResponse.json();
      assert.equal(health.ok, true);
      assert.equal(health.registryLoaded, false);
      assert.equal(health.registryEntryCount, 0);
      assert.equal(health.registryDigest, null);
      assert.equal(health.registryError, 'REGISTRY_JSON_INVALID');

      const roomResponse = await fetch(`${server.baseUrl}/api/rooms`, { method: 'POST' });
      assert.equal(roomResponse.status, 201);
      assert.equal(typeof (await roomResponse.json()).roomId, 'string');
    } finally {
      await server.stop();
    }
  });
});

test('Docker and Render-equivalent runtime layout resolves the bundled manifest', async () => {
  const rootDir = path.resolve(serverDir, '..');
  const dockerfile = fs.readFileSync(path.join(rootDir, 'Dockerfile'), 'utf8');
  assert.match(dockerfile, /WORKDIR \/app\/board-server/);
  assert.match(dockerfile, /COPY board-server\/ \.\//);
  assert.match(dockerfile, /COPY trainers\/board-compat\.json \/app\/trainers\/board-compat\.json/);

  const renderConfig = fs.readFileSync(path.join(rootDir, 'render.yaml'), 'utf8');
  assert.doesNotMatch(renderConfig, /^\s*rootDir:/m);
  assert.match(renderConfig, /npm --prefix board-server install/);
  assert.match(renderConfig, /npm --prefix board-server start/);
  assert.match(renderConfig, /trainers\/board-compat\.json/);

  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mathexam-runtime-layout-'));
  const runtimeServerDir = path.join(directory, 'app', 'board-server');
  const runtimeTrainerDir = path.join(directory, 'app', 'trainers');
  fs.mkdirSync(runtimeServerDir, { recursive: true });
  fs.mkdirSync(runtimeTrainerDir, { recursive: true });
  for (const file of ['index.js', 'trainer-registry.js']) {
    fs.copyFileSync(path.join(serverDir, file), path.join(runtimeServerDir, file));
  }
  fs.copyFileSync(manifestPath, path.join(runtimeTrainerDir, 'board-compat.json'));

  const server = await startServer(undefined, runtimeServerDir);
  try {
    const health = await (await fetch(`${server.baseUrl}/health`, { cache: 'no-store' })).json();
    assert.equal(health.registryLoaded, true);
    assert.equal(health.registrySource, 'bundled-default');
    assert.equal(health.registryEntryCount, 2);
  } finally {
    await server.stop();
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('runtime registry authorizes bridge and legacy mirror state for both reference trainers', async t => {
  const server = await startServer();
  t.after(() => server.stop());
  const room = await createRoom(server.baseUrl);
  const teacher = await connectParticipant(server.baseUrl, room, 'teacher');
  const student = await connectParticipant(server.baseUrl, room, 'student');
  t.after(() => teacher.socket.disconnect());
  t.after(() => student.socket.disconnect());
  const roomErrors = [];
  teacher.socket.on('room:error', error => roomErrors.push(error));
  student.socket.on('room:error', error => roomErrors.push(error));

  const negativeState = { taskIndex: 1, answer: 0 };
  const negativeReceived = waitForSocketEvent(student.socket, 'board:trainer-state-change');
  teacher.socket.emit(
    'board:trainer-state-change',
    bridgeState(room, teacher, 'negative-numbers-line', negativeState)
  );
  const normalizedNegative = await negativeReceived;
  assert.equal(normalizedNegative.trainerId, 'negative-numbers-line');
  assert.equal(normalizedNegative.trainer, 'negative-numbers-line');
  assert.deepEqual(normalizedNegative.state, negativeState);

  const legacyState = { instrHtml: '<strong>legacy</strong>', phase: 'answer' };
  const legacyReceived = waitForSocketEvent(student.socket, 'board:trainer-state-change');
  teacher.socket.emit('board:trainer-state-change', authPayload(room, teacher, {
    trainer: 'negative-numbers-line',
    state: legacyState
  }));
  assert.deepEqual((await legacyReceived).state, legacyState);

  await expectNoSocketEvent(student.socket, 'board:trainer-state-change', () => {
    teacher.socket.emit('board:trainer-state-change', authPayload(room, teacher, {
      trainerId: 'negative-numbers-line',
      trainer: 'negative-numbers-line',
      protocolVersion: 1,
      state: { partial: true }
    }));
  });
  await expectNoSocketEvent(student.socket, 'board:trainer-state-change', () => {
    teacher.socket.emit(
      'board:trainer-state-change',
      bridgeState(room, teacher, 'unknown-trainer', { invalid: true })
    );
  });
  for (const mismatch of [
    { trainerVersion: '2.0.0' },
    { stateSchemaVersion: 2 },
    { protocolVersion: 2 }
  ]) {
    await expectNoSocketEvent(student.socket, 'board:trainer-state-change', () => {
      teacher.socket.emit(
        'board:trainer-state-change',
        bridgeState(room, teacher, 'negative-numbers-line', { mismatch: true }, mismatch)
      );
    });
  }

  const urlChanged = waitForSocketEvent(student.socket, 'board:trainer-url-change');
  teacher.socket.emit('board:trainer-url-change', authPayload(room, teacher, {
    trainerUrl: '/trainers/linear-inequalities-stepwise.html?seed=registry-test#step'
  }));
  await urlChanged;
  await expectNoSocketEvent(student.socket, 'board:trainer-state-change', () => {
    teacher.socket.emit(
      'board:trainer-state-change',
      bridgeState(room, teacher, 'negative-numbers-line', { wrongFile: true })
    );
  });

  const linearState = { taskIndex: 2, step: 3, answerValue: '4' };
  const linearReceived = waitForSocketEvent(student.socket, 'board:trainer-state-change');
  teacher.socket.emit(
    'board:trainer-state-change',
    bridgeState(room, teacher, 'linear-inequalities-stepwise', linearState)
  );
  assert.deepEqual((await linearReceived).state, linearState);

  const duplicateParticipants = waitForSocketEvent(
    teacher.socket,
    'participants:state',
    payload => Array.isArray(payload?.participants)
  );
  teacher.socket.emit('room:join', {
    roomId: room.roomId,
    role: 'teacher',
    token: teacher.token,
    proto: 2
  });
  const duplicateState = await duplicateParticipants;
  assert.equal(
    duplicateState.participants.find(item => item.role === 'teacher').onlineCount,
    1
  );

  const lateStudent = await connectParticipant(server.baseUrl, room, 'student');
  t.after(() => lateStudent.socket.disconnect());
  assert.deepEqual(lateStudent.state.state.latestTrainerState.state, linearState);

  const studentControl = waitForSocketEvent(student.socket, 'control:changed');
  teacher.socket.emit('control:grant', authPayload(room, teacher));
  await studentControl;
  const studentState = { taskIndex: 2, step: 4, answerValue: '5' };
  const teacherReceived = waitForSocketEvent(teacher.socket, 'board:trainer-state-change');
  student.socket.emit(
    'board:trainer-state-change',
    bridgeState(room, student, 'linear-inequalities-stepwise', studentState)
  );
  assert.deepEqual((await teacherReceived).state, studentState);

  const teacherBg = waitForSocketEvent(student.socket, 'board:bg-change');
  teacher.socket.emit('board:bg-change', authPayload(room, teacher, {
    pageIndex: 0,
    bg: 'lined'
  }));
  assert.equal((await teacherBg).bg, 'lined');

  const started = waitForSocketEvent(teacher.socket, 'board:stroke-start');
  student.socket.emit('board:stroke-start', authPayload(room, student, {
    pageIndex: 0,
    stroke: { kind: 'path', points: [{ x: 10, y: 10 }] }
  }));
  await started;

  const teacherControl = waitForSocketEvent(student.socket, 'control:changed');
  teacher.socket.emit('control:revoke', authPayload(room, teacher));
  await teacherControl;
  await expectNoSocketEvent(teacher.socket, 'board:stroke-end', () => {
    student.socket.emit('board:stroke-end', authPayload(room, student, {
      pageIndex: 0,
      stroke: { kind: 'path', points: [{ x: 10, y: 10 }, { x: 20, y: 20 }] }
    }));
  });
  await expectNoSocketEvent(teacher.socket, 'board:trainer-state-change', () => {
    student.socket.emit(
      'board:trainer-state-change',
      bridgeState(room, student, 'linear-inequalities-stepwise', { revoked: true })
    );
  });
  assert.deepEqual(roomErrors, []);
});

test('empty registry rejects bridge and legacy mirror while room, canvas, and control stay live', async () => {
  await temporaryFile('{ invalid json', async file => {
    const server = await startServer(file);
    const sockets = [];
    try {
      const room = await createRoom(server.baseUrl);
      const teacher = await connectParticipant(server.baseUrl, room, 'teacher');
      const student = await connectParticipant(server.baseUrl, room, 'student');
      sockets.push(teacher.socket, student.socket);
      const roomErrors = [];
      teacher.socket.on('room:error', error => roomErrors.push(error));
      student.socket.on('room:error', error => roomErrors.push(error));

      await expectNoSocketEvent(student.socket, 'board:trainer-state-change', () => {
        teacher.socket.emit(
          'board:trainer-state-change',
          bridgeState(room, teacher, 'negative-numbers-line', { bridge: true })
        );
      });
      await expectNoSocketEvent(student.socket, 'board:trainer-state-change', () => {
        teacher.socket.emit('board:trainer-state-change', authPayload(room, teacher, {
          trainer: 'negative-numbers-line',
          state: { instrHtml: '<b>legacy</b>' }
        }));
      });

      const teacherStroke = waitForSocketEvent(student.socket, 'board:stroke-end');
      teacher.socket.emit('board:stroke-end', authPayload(room, teacher, {
        pageIndex: 0,
        stroke: { kind: 'path', points: [{ x: 1, y: 1 }, { x: 2, y: 2 }] }
      }));
      await teacherStroke;

      const studentControl = waitForSocketEvent(student.socket, 'control:changed');
      teacher.socket.emit('control:grant', authPayload(room, teacher));
      await studentControl;
      const studentStroke = waitForSocketEvent(teacher.socket, 'board:stroke-end');
      student.socket.emit('board:stroke-end', authPayload(room, student, {
        pageIndex: 0,
        stroke: { kind: 'path', points: [{ x: 3, y: 3 }, { x: 4, y: 4 }] }
      }));
      await studentStroke;

      const teacherControl = waitForSocketEvent(student.socket, 'control:changed');
      teacher.socket.emit('control:revoke', authPayload(room, teacher));
      await teacherControl;
      await expectNoSocketEvent(teacher.socket, 'board:stroke-end', () => {
        student.socket.emit('board:stroke-end', authPayload(room, student, {
          pageIndex: 0,
          stroke: { kind: 'path', points: [{ x: 5, y: 5 }, { x: 6, y: 6 }] }
        }));
      });
      assert.deepEqual(roomErrors, []);
    } finally {
      sockets.forEach(socket => socket.disconnect());
      await server.stop();
    }
  });
});

test('synthetic manifest entry is authorized without a core edit', async () => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const synthetic = {
    ...manifest.trainers.find(entry => entry.trainerId === 'linear-inequalities-stepwise'),
    trainerId: 'synthetic-registry-trainer',
    file: 'trainers/synthetic-registry-trainer.html',
    title: 'Synthetic registry trainer',
    allowLegacyHtml: false
  };
  manifest.trainers.push(synthetic);
  await temporaryFile(JSON.stringify(manifest), async file => {
    const server = await startServer(file);
    const sockets = [];
    try {
      const room = await createRoom(server.baseUrl);
      const teacher = await connectParticipant(server.baseUrl, room, 'teacher');
      const student = await connectParticipant(server.baseUrl, room, 'student');
      sockets.push(teacher.socket, student.socket);
      const urlChanged = waitForSocketEvent(student.socket, 'board:trainer-url-change');
      teacher.socket.emit('board:trainer-url-change', authPayload(room, teacher, {
        trainerUrl: 'synthetic-registry-trainer.html'
      }));
      await urlChanged;
      const received = waitForSocketEvent(student.socket, 'board:trainer-state-change');
      teacher.socket.emit(
        'board:trainer-state-change',
        bridgeState(room, teacher, synthetic.trainerId, { synthetic: true })
      );
      assert.deepEqual((await received).state, { synthetic: true });
      await expectNoSocketEvent(student.socket, 'board:trainer-state-change', () => {
        teacher.socket.emit('board:trainer-state-change', authPayload(room, teacher, {
          trainer: synthetic.trainerId,
          state: { legacy: true }
        }));
      });
    } finally {
      sockets.forEach(socket => socket.disconnect());
      await server.stop();
    }
  });
});

test('removing a manifest entry revokes bridge and legacy authorization', async () => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.trainers = manifest.trainers.filter(
    entry => entry.trainerId !== 'linear-inequalities-stepwise'
  );
  await temporaryFile(JSON.stringify(manifest), async file => {
    const server = await startServer(file);
    const sockets = [];
    try {
      const room = await createRoom(server.baseUrl);
      const teacher = await connectParticipant(server.baseUrl, room, 'teacher');
      const student = await connectParticipant(server.baseUrl, room, 'student');
      sockets.push(teacher.socket, student.socket);
      const urlChanged = waitForSocketEvent(student.socket, 'board:trainer-url-change');
      teacher.socket.emit('board:trainer-url-change', authPayload(room, teacher, {
        trainerUrl: 'linear-inequalities-stepwise.html'
      }));
      await urlChanged;
      await expectNoSocketEvent(student.socket, 'board:trainer-state-change', () => {
        teacher.socket.emit(
          'board:trainer-state-change',
          bridgeState(room, teacher, 'linear-inequalities-stepwise', { removed: true })
        );
      });
      await expectNoSocketEvent(student.socket, 'board:trainer-state-change', () => {
        teacher.socket.emit('board:trainer-state-change', authPayload(room, teacher, {
          trainer: 'linear-inequalities-stepwise',
          state: { removedLegacy: true }
        }));
      });
    } finally {
      sockets.forEach(socket => socket.disconnect());
      await server.stop();
    }
  });
});
