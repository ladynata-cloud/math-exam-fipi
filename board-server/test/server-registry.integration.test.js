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
