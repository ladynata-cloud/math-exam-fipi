import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';
import {
  HASH_BASES,
  PILOT_A_PATHS,
  analyzeHtml,
  applyDuplicateAnalysis,
  bindDescriptorSchema,
  collectRepositoryInputs,
  crossCheckRuntimeDescriptor,
  generateSyntheticCandidates,
  inventoryCandidates,
  normalizePublicUrl,
  runRepositoryInventory,
  scanSanitizedValue,
  sha256,
  stableStringify,
  validateDescriptorShape,
  validateUrlFixture,
  writeInventoryOutputs
} from '../index.mjs';

const execFileAsync = promisify(execFile);
const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '..', '..', '..');
const fixturePath = path.join(repoRoot, 'tools', 'fixtures', 'trainer-public-url-conformance.json');
const manifestPath = path.join(repoRoot, 'trainers', 'board-compat.json');
const schemaPath = path.join(
  repoRoot,
  'tools',
  'trainer-inventory',
  'schema',
  'trainer-inventory-descriptor.schema.json'
);
const emptyManifest = Object.freeze({ version: 1, schemaVersion: 1, trainers: [] });
const pilotExpected = Object.freeze({
  'trainers/oge-task6-fractions.html': {
    sha256: '54c7b7671ae13f180b1dd4d09440053c76c801d9b07a119b0009ea2b61f610ab',
    sizeBytes: 90714
  },
  'trainers/oge-task8-powers-roots.html': {
    sha256: 'df283d5147edaf536a885203dc8b8cc540c424f32d29369cb176e79823d6120a',
    sizeBytes: 98568
  },
  'trainers/oge-task9-equations.html': {
    sha256: 'c4813016e37b4e5b87524f1e3270cb3856027b01f89c616d4bcd619d58f343be',
    sizeBytes: 181899
  },
  'trainers/oge-task20-equations.html': {
    sha256: '839f2fcd27bea701be1e3178ff3863bd72283905b91c57c626395404629e90ad',
    sizeBytes: 163028
  }
});

let fullReportPromise;
let gitFixtureSequence = 0;

async function json(relativeOrAbsolute) {
  const target = path.isAbsolute(relativeOrAbsolute)
    ? relativeOrAbsolute
    : path.join(repoRoot, relativeOrAbsolute);
  return JSON.parse(await readFile(target, 'utf8'));
}

async function fullReport() {
  if (!fullReportPromise) {
    fullReportPromise = runRepositoryInventory({
      repoRoot,
      includeRunMetadata: true
    });
  }
  return fullReportPromise;
}

function syntheticCandidate(canonicalPath, body = '') {
  return {
    sourceKind: 'synthetic',
    hashBasis: 'FILESYSTEM_BYTES',
    canonicalPath,
    content: Buffer.from(
      `<!doctype html><html lang="ru"><head><title>${canonicalPath}</title></head><body>${body}</body></html>`,
      'utf8'
    )
  };
}

async function git(cwd, args) {
  return execFileAsync('git', args, {
    cwd,
    windowsHide: true,
    maxBuffer: 8 * 1024 * 1024
  });
}

async function createInventoryTestRepository(files) {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'trainer-inventory-git-object-'));
  gitFixtureSequence += 1;
  await mkdir(path.join(temporary, 'trainers'), { recursive: true });
  await writeFile(
    path.join(temporary, 'trainers', 'board-compat.json'),
    `${JSON.stringify(emptyManifest, null, 2)}\n${' '.repeat(gitFixtureSequence)}\n`,
    'utf8'
  );
  for (const [relative, content] of Object.entries(files)) {
    const absolute = path.join(temporary, ...relative.split('/'));
    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, content);
  }
  await git(temporary, ['init', '-b', 'main']);
  await git(temporary, ['config', 'user.name', 'Trainer Inventory Test']);
  await git(temporary, ['config', 'user.email', 'trainer-inventory@example.invalid']);
  await git(temporary, ['config', 'core.autocrlf', 'false']);
  await git(temporary, ['add', '.']);
  await git(temporary, ['commit', '-m', 'test fixture']);
  return temporary;
}

function duplicateCandidate({
  path: canonicalPath,
  trainerId = null,
  hash = null,
  canonicalUrl = null
}) {
  return {
    canonicalPath,
    trainerId,
    sourceSha256: hash ?? sha256(canonicalPath),
    canonicalUrl: canonicalUrl ?? `https://mathexam.space/${canonicalPath}`,
    basename: path.posix.basename(canonicalPath),
    duplicate: {
      status: 'CANONICAL',
      blockers: [],
      groupKeys: [],
      authorizationUsesBasename: false
    }
  };
}

function repeatedFields(entry) {
  const keys = [
    'trainerId',
    'file',
    'title',
    'group',
    'boardCompatibility',
    'supportsSeed',
    'supportsBoardMirror',
    'supportsSemanticEvents',
    'version',
    'stateSchemaVersion',
    'bridgeProtocolVersion',
    'allowLegacyHtml'
  ];
  return Object.fromEntries(keys.filter(key => Object.hasOwn(entry, key)).map(key => [key, entry[key]]));
}

// Run fault injection in a child so native-module mocks cannot affect other tests.
async function isolatedGitScenario(config) {
  const childProcess = (await import('node:child_process')).default;
  const { syncBuiltinESMExports } = await import('node:module');
  const { promisify: childPromisify } = await import('node:util');
  const { EventEmitter } = await import('node:events');
  const { PassThrough, Writable } = await import('node:stream');
  const realExecFile = childProcess.execFile;
  const realExecFileSync = childProcess.execFileSync;
  const realSpawn = childProcess.spawn;
  let movedHead = false;
  let batchStarted = false;
  const injectedExecFile = (command, args, options, callback) => realExecFile(
    command, args, options, (error, stdout, stderr) => {
      if (!error && command === 'git' && args[0] === 'ls-tree' && config.pathControl) {
        const invalidPath = 'trainers/control' + config.pathControl + 'name.html';
        const record = args.includes('--name-only')
          ? invalidPath + '\0'
          : '100644 blob ' + 'a'.repeat(40) + '\t' + invalidPath + '\0';
        stdout = Buffer.concat([Buffer.from(stdout), Buffer.from(record)]);
      }
      if (!error && config.moveHeadTo && !movedHead && command === 'git'
          && args.join(' ') === 'rev-parse --verify HEAD') {
        realExecFileSync('git', ['update-ref', '--no-deref', 'HEAD', config.moveHeadTo], {
          cwd: config.fixtureRoot, windowsHide: true
        });
        movedHead = true;
      }
      callback(error, stdout, stderr);
    }
  );
  injectedExecFile[childPromisify.custom] = (...args) => new Promise((resolve, reject) => {
    injectedExecFile(...args, (error, stdout, stderr) => (
      error ? reject(error) : resolve({ stdout, stderr })
    ));
  });
  childProcess.execFile = injectedExecFile;
  childProcess.spawn = (command, args, options) => {
    if (command !== 'git' || !args.includes('--batch')) {
      return realSpawn(command, args, options);
    }
    batchStarted = true;
    const child = new EventEmitter();
    child.stdout = new PassThrough();
    child.stderr = new PassThrough();
    const chunks = [];
    child.stdin = new Writable({
      write(chunk, _encoding, callback) {
        chunks.push(Buffer.from(chunk));
        callback();
      },
      final(callback) {
        callback();
        queueMicrotask(() => {
          if (config.mode === 'child-start-error') {
            child.emit('error', new Error('injected start error'));
            return;
          }
          try {
            const specs = Buffer.concat(chunks).toString('utf8').trimEnd().split('\n');
            const records = specs.map(spec => {
              let record = realExecFileSync('git', ['cat-file', '--batch'], {
                cwd: config.fixtureRoot, input: spec + '\n', windowsHide: true
              });
              if (!spec.endsWith(':' + config.targetPath)) return record;
              if (config.mode === 'missing') return Buffer.from(spec + ' missing\n');
              const newline = record.indexOf(0x0a);
              const header = record.subarray(0, newline).toString('utf8');
              const body = record.subarray(newline);
              if (config.mode === 'non-blob') {
                record = Buffer.concat([Buffer.from(header.replace(' blob ', ' tree ')), body]);
              } else if (config.mode === 'malformed-header') {
                record = Buffer.concat([Buffer.from('invalid header'), body]);
              } else if (config.mode === 'truncated-body') {
                record = record.subarray(0, record.length - 2);
              } else if (config.mode === 'missing-trailing-newline') {
                record[record.length - 1] = 0x58;
              } else if (config.mode === 'object-id-64') {
                record = Buffer.concat([Buffer.from(header.replace(/^[a-f0-9]+/, 'a'.repeat(64))), body]);
              }
              return record;
            });
            let output = Buffer.concat(records);
            if (config.mode === 'trailing-data') output = Buffer.concat([output, Buffer.from('extra')]);
            if (config.mode === 'empty-output') output = Buffer.alloc(0);
            child.stderr.end('injected diagnostic\n');
            child.stdout.end(output);
            child.emit('close', config.mode === 'child-nonzero' ? 1 : 0);
          } catch (error) {
            child.emit('error', error);
          }
        });
      }
    });
    return child;
  };
  syncBuiltinESMExports();
  try {
    const inventory = await import(config.moduleUrl);
    const result = config.runInventory
      ? await inventory.runRepositoryInventory({ repoRoot: config.fixtureRoot })
      : await inventory.collectRepositoryInputs(config.fixtureRoot);
    if (!config.runInventory) {
      result.candidates = result.candidates.map(candidate => ({
        canonicalPath: candidate.canonicalPath,
        objectId: candidate.gitObjectId,
        bytesHex: candidate.gitObjectBytes?.toString('hex') ?? null,
        error: candidate.gitObjectError
      }));
    }
    process.stdout.write(JSON.stringify({ result, movedHead, batchStarted }));
  } catch (error) {
    process.stdout.write(JSON.stringify({ error: error.message, movedHead, batchStarted }));
  }
}

async function gitScenario(fixtureRoot, config = {}) {
  const source = '(' + isolatedGitScenario.toString() + ')(JSON.parse(process.argv[1]))';
  const { stdout } = await execFileAsync(process.execPath, [
    '--input-type=module', '--eval', source,
    JSON.stringify({ fixtureRoot, moduleUrl: new URL('../index.mjs', import.meta.url).href, ...config })
  ], { cwd: repoRoot, windowsHide: true, maxBuffer: 8 * 1024 * 1024 });
  return JSON.parse(stdout);
}

function assertSameInventory(actual, expected) {
  assert.deepEqual(actual.descriptors, expected.descriptors);
  assert.deepEqual(actual.findings, expected.findings);
  assert.equal(actual.deterministicFingerprint, expected.deterministicFingerprint);
}

test('committed public URL fixture is closed, complete, and fully executed', async () => {
  const fixture = await json(fixturePath);
  const result = validateUrlFixture(fixture);
  assert.equal(result.ok, true, result.failures.join('\n'));
  assert.equal(result.executed, fixture.vectors.length);
  assert.ok(result.executed >= 30);
  assert.equal(new Set(fixture.vectors.map(vector => vector.id)).size, fixture.vectors.length);
});

test('public URL identity excludes query and fragment but validates raw pathname first', () => {
  assert.equal(
    normalizePublicUrl('/trainers/example.html?q=%2f#%2e%2e').canonicalResult,
    'https://mathexam.space/trainers/example.html'
  );
  for (const unsafe of [
    '/trainers/%2e%2e/example.html',
    '/trainers/group%2fexample.html',
    '/trainers/../example.html',
    '/trainers//example.html',
    '/trainers\\example.html',
    '/trainers/\u202eexample.html',
    '/trainers/\u0001example.html'
  ]) {
    assert.equal(normalizePublicUrl(unsafe).ok, false, unsafe);
  }
});

test('public URL normalizer preserves path case and never falls back to basename', () => {
  const upper = normalizePublicUrl('/trainers/Nested/Example.html');
  const lower = normalizePublicUrl('/trainers/nested/example.html');
  assert.equal(upper.ok, true);
  assert.equal(lower.ok, true);
  assert.notEqual(upper.canonicalResult, lower.canonicalResult);
  assert.equal(normalizePublicUrl('/other/example.html').canonicalResult, 'https://mathexam.space/other/example.html');
});

test('descriptor schema and fixture JSON parse without extensions', async () => {
  const schema = await json(schemaPath);
  assert.equal(schema.additionalProperties, false);
  assert.equal(schema.properties.descriptorVersion.const, 1);
  assert.deepEqual(schema.properties.hashBasis.enum, HASH_BASES);
  assert.ok(schema.required.includes('hashBasis'));
  assert.ok(schema.required.includes('provenance'));
  assert.ok(schema.required.includes('trainerId'));
});

test('every descriptor object schema has an explicit property policy', async () => {
  const schema = await json(schemaPath);
  const missingPolicies = [];
  const visit = (node, trail = '#') => {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'object' && !Object.hasOwn(node, 'additionalProperties')) {
      missingPolicies.push(trail);
    }
    for (const [key, child] of Object.entries(node)) {
      if (typeof child === 'object') visit(child, `${trail}/${key}`);
    }
  };
  visit(schema);
  assert.deepEqual(missingPolicies, []);
});

test('skill frontmatter and new documentation links are valid', async () => {
  const markdownFiles = [
    '.agents/skills/trainer-inventory/SKILL.md',
    'docs/tasks/TRAINER_FACTORY_INVENTORY_V1.md',
    'docs/tasks/TRAINER_INVENTORY_HASH_BASIS_V1.md',
    'docs/TRAINER_INVENTORY_FORMAT.md'
  ];
  for (const relative of markdownFiles) {
    const absolute = path.join(repoRoot, ...relative.split('/'));
    const source = await readFile(absolute, 'utf8');
    assert.match(source, /^# /m, relative);
    for (const match of source.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
      const target = match[1];
      if (/^(?:https?:|#)/.test(target)) continue;
      const withoutAnchor = target.split('#', 1)[0];
      const resolved = path.resolve(path.dirname(absolute), withoutAnchor);
      await readFile(resolved);
    }
  }
  const skill = await readFile(
    path.join(repoRoot, '.agents', 'skills', 'trainer-inventory', 'SKILL.md'),
    'utf8'
  );
  const frontmatter = skill.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(frontmatter);
  const keys = frontmatter[1]
    .split(/\r?\n/)
    .filter(Boolean)
    .map(line => line.slice(0, line.indexOf(':')));
  assert.deepEqual(keys, ['name', 'description']);
  assert.match(frontmatter[1], /^name: trainer-inventory$/m);
});

test('descriptor validator rejects unknown or missing top-level properties', async () => {
  const report = await inventoryCandidates({
    repoRoot,
    candidates: [syntheticCandidate('trainers/descriptor.html')],
    manifest: emptyManifest,
    includeRunMetadata: false
  });
  const descriptor = report.descriptors[0];
  assert.deepEqual(validateDescriptorShape(descriptor), { ok: true });
  assert.match(validateDescriptorShape({ ...descriptor, surprise: true }).error, /^DESCRIPTOR_UNKNOWN:/);
  const withoutReview = { ...descriptor };
  delete withoutReview.review;
  assert.match(validateDescriptorShape(withoutReview).error, /^DESCRIPTOR_MISSING:/);
});

test('manifest cross-check is exact and fail-closed', async () => {
  const manifest = await json(manifestPath);
  const entry = manifest.trainers[0];
  const descriptor = {
    canonicalPath: entry.file,
    runtimeCrossCheck: {
      authority: 'cross-check-only',
      registryEntryExpected: true,
      fields: repeatedFields(entry),
      grantsRuntimeAuthorization: false
    }
  };
  assert.deepEqual(crossCheckRuntimeDescriptor(descriptor, manifest), { ok: true });

  const stale = structuredClone(descriptor);
  stale.runtimeCrossCheck.fields.title = `${entry.title} changed`;
  assert.equal(crossCheckRuntimeDescriptor(stale, manifest).ok, false);

  const missing = structuredClone(descriptor);
  delete missing.runtimeCrossCheck.fields.title;
  assert.equal(crossCheckRuntimeDescriptor(missing, manifest).ok, false);

  const extra = structuredClone(descriptor);
  extra.runtimeCrossCheck.fields.notes = 'not repeatable';
  assert.equal(crossCheckRuntimeDescriptor(extra, manifest).ok, false);

  const absent = {
    canonicalPath: 'trainers/not-registered.html',
    runtimeCrossCheck: {
      authority: 'cross-check-only',
      registryEntryExpected: false,
      fields: {},
      grantsRuntimeAuthorization: false
    }
  };
  assert.deepEqual(crossCheckRuntimeDescriptor(absent, manifest), { ok: true });
});

test('HTML analysis reports storage, network, scripts, styles, iframe, state, and runtime signals', () => {
  const result = analyzeHtml(
    `<!doctype html><html><head>
      <title>Signals</title>
      <script src="https://cdn.example.test/library.js"></script>
      <link rel="stylesheet" href="/assets/site.css">
      </head><body><iframe src="/manual/"></iframe><script>
      localStorage.setItem('trainer-a:stats', '1');
      sessionStorage.setItem('session', '1');
      indexedDB.open('trainer-a');
      fetch('/api/example');
      new XMLHttpRequest();
      new WebSocket('wss://example.test');
      TrainerBridge.getState();
      window.postMessage({ stateSchemaVersion: 1 }, '*');
      io('/board');
      Math.random();
      </script></body></html>`,
    'trainers/signals.html'
  );
  assert.deepEqual(result.dependencies.storageSignals, ['indexedDB', 'localStorage', 'sessionStorage']);
  assert.deepEqual(result.dependencies.networkSignals, ['WebSocket', 'XMLHttpRequest', 'fetch']);
  assert.deepEqual(result.dependencies.externalOrigins, ['https://cdn.example.test']);
  assert.equal(result.html.iframeCount, 1);
  assert.equal(result.html.usesBridge, true);
  assert.equal(result.html.usesPostMessage, true);
  assert.equal(result.html.usesSocketIo, true);
  assert.equal(result.html.usesRandom, true);
  assert.ok(result.html.stateSignals.includes('stateSchemaVersion'));
});

test('malformed HTML and missing assets are isolated as candidate errors', async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'trainer-inventory-malformed-'));
  try {
    const report = await inventoryCandidates({
      repoRoot: temporary,
      repositoryTree: new Map(),
      candidates: [{
        sourceKind: 'repo',
        hashBasis: 'GIT_OBJECT',
        canonicalPath: 'trainers/malformed.html',
        gitObjectBytes: Buffer.from(
          '<html><head><title>Broken</title></head><body><img src="missing.png">'
        )
      }],
      manifest: emptyManifest,
      includeRunMetadata: false
    });
    assert.equal(report.descriptors.length, 1);
    assert.ok(report.descriptors[0].errors.includes('HTML_DOCUMENT_BOUNDARY_MISSING'));
    assert.ok(report.descriptors[0].errors.includes('ASSET_MISSING:trainers/missing.png'));
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test('Git-object read failure is explicit and does not abort the cohort', async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'trainer-inventory-error-'));
  try {
    const report = await inventoryCandidates({
      repoRoot: temporary,
      candidates: [
        syntheticCandidate('trainers/good.html'),
        {
          sourceKind: 'repo',
          hashBasis: 'GIT_OBJECT',
          canonicalPath: 'trainers/missing.html',
          gitObjectError: 'GIT_OBJECT_READ_FAILED:trainers/missing.html'
        }
      ],
      manifest: emptyManifest,
      includeRunMetadata: false
    });
    assert.equal(report.descriptors.length, 2);
    const missing = report.descriptors.find(
      item => item.canonicalPath === 'trainers/missing.html'
    );
    assert.equal(missing.hashBasis, 'GIT_OBJECT');
    assert.equal(missing.sourceSha256, null);
    assert.equal(missing.sizeBytes, null);
    assert.ok(missing.errors.includes('GIT_OBJECT_READ_FAILED:trainers/missing.html'));
    assert.equal(report.findings.counts.hashReadFailures, 1);
    assert.deepEqual(report.findings.hashReadFailures, [{
      canonicalPath: 'trainers/missing.html',
      error: 'GIT_OBJECT_READ_FAILED:trainers/missing.html'
    }]);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test('all release-blocking duplicate families fail closed', () => {
  const hash = sha256('same blob');
  const descriptors = [
    duplicateCandidate({ path: 'trainers/a/one.html', trainerId: 'same-id', hash, canonicalUrl: 'https://mathexam.space/trainers/shared.html' }),
    duplicateCandidate({ path: 'trainers/A/one.html', trainerId: 'same-id', hash, canonicalUrl: 'https://mathexam.space/trainers/shared.html' }),
    duplicateCandidate({ path: 'trainers/exact.html', trainerId: 'other-id' }),
    duplicateCandidate({ path: 'trainers/exact.html', trainerId: 'third-id' })
  ];
  const result = applyDuplicateAnalysis(descriptors);
  const types = new Set(result.blockers.map(blocker => blocker.type));
  assert.ok(types.has('DUPLICATE_TRAINERID'));
  assert.ok(types.has('DUPLICATE_CANONICALPATH'));
  assert.ok(types.has('DUPLICATE_CASEFOLDPATH'));
  assert.ok(types.has('DUPLICATE_CANONICALURL'));
  assert.ok(types.has('UNRESOLVED_EXACT_BLOB_DUPLICATE'));
  assert.ok(descriptors.every(item => item.duplicate.status === 'DUPLICATE_UNRESOLVED'));
});

test('same basename in different canonical directories is warning-only', () => {
  const descriptors = [
    duplicateCandidate({ path: 'trainers/a/example.html' }),
    duplicateCandidate({ path: 'trainers/b/example.html' })
  ];
  const result = applyDuplicateAnalysis(descriptors);
  assert.equal(result.blockers.length, 0);
  assert.equal(result.basenameWarnings.length, 1);
  assert.ok(descriptors.every(item => item.duplicate.authorizationUsesBasename === false));
});

test('repeated runs have stable order, IDs, findings, and fingerprint', async () => {
  const candidates = [
    syntheticCandidate('trainers/z-last.html'),
    syntheticCandidate('trainers/a-first.html'),
    syntheticCandidate('trainers/m-middle.html')
  ];
  const first = await inventoryCandidates({
    repoRoot,
    candidates,
    manifest: emptyManifest,
    includeRunMetadata: false
  });
  const second = await inventoryCandidates({
    repoRoot,
    candidates: [...candidates].reverse(),
    manifest: emptyManifest,
    includeRunMetadata: false
  });
  assert.equal(first.deterministicFingerprint, second.deterministicFingerprint);
  assert.equal(stableStringify(first), stableStringify(second));
  assert.deepEqual(first.descriptors.map(item => item.canonicalPath), [
    'trainers/a-first.html',
    'trainers/m-middle.html',
    'trainers/z-last.html'
  ]);
});

test('incremental run reuses unchanged analysis and preserves stable IDs', async () => {
  const originalCandidates = [
    syntheticCandidate('trainers/incremental-a.html'),
    syntheticCandidate('trainers/incremental-b.html')
  ];
  const first = await inventoryCandidates({
    repoRoot,
    candidates: originalCandidates,
    manifest: emptyManifest
  });
  const second = await inventoryCandidates({
    repoRoot,
    candidates: [...originalCandidates, syntheticCandidate('trainers/incremental-c.html')],
    manifest: emptyManifest,
    previousReport: first
  });
  assert.equal(second.run.incrementalReused, 2);
  for (const descriptor of first.descriptors) {
    assert.equal(
      second.descriptors.find(item => item.canonicalPath === descriptor.canonicalPath).inventoryId,
      descriptor.inventoryId
    );
  }
});

test('incremental reuse preserves malformed HTML findings and deterministic output', async () => {
  const malformed = {
    sourceKind: 'synthetic',
    canonicalPath: 'trainers/incremental-malformed.html',
    content: Buffer.from('<html><head><title>Unclosed</title></head><body>')
  };
  const fresh = await inventoryCandidates({
    repoRoot,
    candidates: [malformed],
    manifest: emptyManifest
  });
  const incremental = await inventoryCandidates({
    repoRoot,
    candidates: [malformed],
    manifest: emptyManifest,
    previousReport: fresh
  });
  assert.ok(incremental.run.incrementalReused > 0);
  assert.deepEqual(incremental.descriptors[0].errors, fresh.descriptors[0].errors);
  assert.deepEqual(incremental.descriptors[0], fresh.descriptors[0]);
  assert.deepEqual(incremental.findings.counts, fresh.findings.counts);
  assert.equal(incremental.deterministicFingerprint, fresh.deterministicFingerprint);
});

test('5,000-candidate synthetic cohort records exact scale and remains deterministic', async t => {
  const candidates = generateSyntheticCandidates(5000);
  const before = process.memoryUsage().rss;
  const started = performance.now();
  const fresh = await inventoryCandidates({
    repoRoot,
    candidates,
    manifest: emptyManifest
  });
  const freshElapsedMs = performance.now() - started;
  const repeatedStarted = performance.now();
  const repeated = await inventoryCandidates({
    repoRoot,
    candidates: [...candidates].reverse(),
    manifest: emptyManifest
  });
  const repeatedElapsedMs = performance.now() - repeatedStarted;
  const incrementalStarted = performance.now();
  const incremental = await inventoryCandidates({
    repoRoot,
    candidates,
    manifest: emptyManifest,
    previousReport: fresh
  });
  const incrementalElapsedMs = performance.now() - incrementalStarted;
  const rssDeltaBytes = process.memoryUsage().rss - before;
  assert.equal(fresh.findings.counts.candidates, 5000);
  assert.equal(fresh.descriptors.length, 5000);
  assert.equal(fresh.findings.counts.releaseBlockers, 0);
  assert.equal(fresh.descriptors[0].canonicalPath, 'trainers/synthetic/cohort-00000.html');
  assert.equal(fresh.descriptors.at(-1).canonicalPath, 'trainers/synthetic/cohort-04999.html');
  assert.equal(new Set(fresh.descriptors.map(item => item.inventoryId)).size, 5000);
  assert.equal(repeated.deterministicFingerprint, fresh.deterministicFingerprint);
  assert.equal(incremental.deterministicFingerprint, fresh.deterministicFingerprint);
  assert.deepEqual(repeated.descriptors, fresh.descriptors);
  assert.deepEqual(incremental.descriptors, fresh.descriptors);
  assert.equal(incremental.run.incrementalReused, 5000);
  t.diagnostic(
    `synthetic5000 freshMs=${freshElapsedMs.toFixed(1)} `
    + `repeatedMs=${repeatedElapsedMs.toFixed(1)} `
    + `incrementalMs=${incrementalElapsedMs.toFixed(1)} `
    + `rssDeltaBytes=${rssDeltaBytes}`
  );
});

test('repository collection is opt-in for intake and uses only tracked trainer HTML by default', async () => {
  const inputs = await collectRepositoryInputs(repoRoot);
  assert.ok(inputs.candidates.length >= 200);
  assert.ok(inputs.candidates.every(item => item.sourceKind === 'repo'));
  assert.ok(inputs.candidates.every(item => item.hashBasis === 'GIT_OBJECT'));
  assert.ok(inputs.candidates.every(item => Buffer.isBuffer(item.gitObjectBytes)));
  assert.ok(inputs.candidates.every(item => !Object.hasOwn(item, 'absolutePath')));
  assert.ok(inputs.candidates.every(item => item.canonicalPath.startsWith('trainers/')));
  assert.ok(inputs.candidates.every(item => !item.canonicalPath.includes('\\')));
  assert.match(inputs.sourceGitHead, /^[a-f0-9]{40,64}$/);
  assert.match(inputs.sourceGitTree, /^[a-f0-9]{40,64}$/);
});

test('LF Git blob remains the hash source for a CRLF worktree representation', async () => {
  const relative = 'trainers/line-endings.html';
  const lf = Buffer.from(
    '<!doctype html>\n<html><head><title>LF blob</title></head><body>one\ntwo</body></html>\n',
    'utf8'
  );
  const crlf = Buffer.from(lf.toString('utf8').replaceAll('\n', '\r\n'), 'utf8');
  const temporary = await createInventoryTestRepository({ [relative]: lf });
  try {
    await writeFile(path.join(temporary, ...relative.split('/')), crlf);
    const report = await runRepositoryInventory({ repoRoot: temporary });
    const descriptor = report.descriptors[0];
    assert.equal(descriptor.hashBasis, 'GIT_OBJECT');
    assert.equal(descriptor.sourceSha256, sha256(lf));
    assert.equal(descriptor.sizeBytes, lf.length);
    assert.notEqual(sha256(crlf), descriptor.sourceSha256);
    assert.notEqual(crlf.length, descriptor.sizeBytes);
    assert.match(report.run.sourceGitHead, /^[a-f0-9]{40,64}$/);
    assert.match(report.run.sourceGitTree, /^[a-f0-9]{40,64}$/);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test('one Git HEAD has cross-platform descriptor and fingerprint identity', async () => {
  const relative = 'trainers/cross-platform.html';
  const lf = Buffer.from(
    '<!doctype html>\n<html><head><title>Cross platform</title></head><body>same</body></html>\n',
    'utf8'
  );
  const temporary = await createInventoryTestRepository({ [relative]: lf });
  try {
    const linuxLike = await runRepositoryInventory({ repoRoot: temporary });
    await writeFile(
      path.join(temporary, ...relative.split('/')),
      Buffer.from(lf.toString('utf8').replaceAll('\n', '\r\n'), 'utf8')
    );
    const windowsLike = await runRepositoryInventory({ repoRoot: temporary });
    assert.deepEqual(windowsLike.descriptors, linuxLike.descriptors);
    assert.deepEqual(windowsLike.findings, linuxLike.findings);
    assert.equal(
      windowsLike.deterministicFingerprint,
      linuxLike.deterministicFingerprint
    );
    assert.equal(windowsLike.run.sourceGitHead, linuxLike.run.sourceGitHead);
    assert.equal(windowsLike.run.sourceGitTree, linuxLike.run.sourceGitTree);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test('unpublished LF and CRLF inputs retain distinct filesystem-byte hashes', async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'trainer-inventory-intake-bytes-'));
  const lfPath = path.join(temporary, 'lf.html');
  const crlfPath = path.join(temporary, 'crlf.html');
  const lf = Buffer.from(
    '<!doctype html>\n<html><head><title>LF</title></head><body></body></html>\n',
    'utf8'
  );
  const crlf = Buffer.from(lf.toString('utf8').replaceAll('\n', '\r\n'), 'utf8');
  try {
    await writeFile(lfPath, lf);
    await writeFile(crlfPath, crlf);
    const report = await inventoryCandidates({
      repoRoot,
      candidates: [
        {
          sourceKind: 'intake',
          hashBasis: 'FILESYSTEM_BYTES',
          canonicalPath: 'trainers/intake/lf.html',
          absolutePath: lfPath
        },
        {
          sourceKind: 'intake',
          hashBasis: 'FILESYSTEM_BYTES',
          canonicalPath: 'trainers/intake/crlf.html',
          absolutePath: crlfPath
        }
      ],
      manifest: emptyManifest,
      includeRunMetadata: false
    });
    const byPath = new Map(report.descriptors.map(item => [item.canonicalPath, item]));
    assert.equal(byPath.get('trainers/intake/lf.html').hashBasis, 'FILESYSTEM_BYTES');
    assert.equal(byPath.get('trainers/intake/crlf.html').hashBasis, 'FILESYSTEM_BYTES');
    assert.equal(byPath.get('trainers/intake/lf.html').sourceSha256, sha256(lf));
    assert.equal(byPath.get('trainers/intake/crlf.html').sourceSha256, sha256(crlf));
    assert.notEqual(
      byPath.get('trainers/intake/lf.html').sourceSha256,
      byPath.get('trainers/intake/crlf.html').sourceSha256
    );
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test('committed Git blob mutation changes descriptor and invalidates reuse', async () => {
  const relative = 'trainers/blob-mutation.html';
  const original = Buffer.from(
    '<!doctype html>\n<html><head><title>Original</title></head><body></body></html>\n',
    'utf8'
  );
  const changed = Buffer.from(
    '<!doctype html>\n<html><head><title>Changed</title></head><body></body></html>\n',
    'utf8'
  );
  const temporary = await createInventoryTestRepository({ [relative]: original });
  try {
    const first = await runRepositoryInventory({ repoRoot: temporary });
    await writeFile(path.join(temporary, ...relative.split('/')), changed);
    await git(temporary, ['add', relative]);
    await git(temporary, ['commit', '-m', 'mutate blob']);
    const second = await runRepositoryInventory({
      repoRoot: temporary,
      previousReport: first
    });
    assert.notEqual(
      second.descriptors[0].sourceSha256,
      first.descriptors[0].sourceSha256
    );
    assert.notDeepEqual(second.descriptors[0], first.descriptors[0]);
    assert.notEqual(second.run.sourceGitHead, first.run.sourceGitHead);
    assert.equal(second.run.incrementalReused, 0);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test('checkout-only line-ending mutation preserves descriptor, ID, and fingerprint', async () => {
  const relative = 'trainers/checkout-only.html';
  const lf = Buffer.from(
    '<!doctype html>\n<html><head><title>Checkout only</title></head><body></body></html>\n',
    'utf8'
  );
  const temporary = await createInventoryTestRepository({ [relative]: lf });
  try {
    const first = await runRepositoryInventory({ repoRoot: temporary });
    await writeFile(
      path.join(temporary, ...relative.split('/')),
      Buffer.from(lf.toString('utf8').replaceAll('\n', '\r\n'), 'utf8')
    );
    const second = await runRepositoryInventory({
      repoRoot: temporary,
      previousReport: first
    });
    assert.deepEqual(second.descriptors[0], first.descriptors[0]);
    assert.equal(second.descriptors[0].inventoryId, first.descriptors[0].inventoryId);
    assert.equal(second.deterministicFingerprint, first.deterministicFingerprint);
    assert.equal(second.run.incrementalReused, 1);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test('repository duplicate groups use Git-object hashes instead of checkout bytes', async () => {
  const firstPath = 'trainers/duplicate-a.html';
  const secondPath = 'trainers/duplicate-b.html';
  const lf = Buffer.from(
    '<!doctype html>\n<html><head><title>Duplicate</title></head><body></body></html>\n',
    'utf8'
  );
  const temporary = await createInventoryTestRepository({
    [firstPath]: lf,
    [secondPath]: lf
  });
  try {
    await writeFile(
      path.join(temporary, ...secondPath.split('/')),
      Buffer.from(lf.toString('utf8').replaceAll('\n', '\r\n'), 'utf8')
    );
    const report = await runRepositoryInventory({ repoRoot: temporary });
    assert.equal(report.descriptors[0].sourceSha256, report.descriptors[1].sourceSha256);
    assert.ok(report.descriptors.every(item => item.hashBasis === 'GIT_OBJECT'));
    assert.ok(report.descriptors.every(
      item => item.duplicate.status === 'DUPLICATE_UNRESOLVED'
    ));
    assert.ok(report.findings.blockers.some(
      item => item.type === 'UNRESOLVED_EXACT_BLOB_DUPLICATE'
    ));
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test('Pilot A reconciles exact hashes, references, surfaces, and pending reviews', async () => {
  const report = await fullReport();
  assert.equal(report.toolVersion, '1.0.1');
  const { stdout: head } = await git(repoRoot, ['rev-parse', 'HEAD']);
  const { stdout: tree } = await git(repoRoot, ['rev-parse', 'HEAD^{tree}']);
  assert.equal(report.run.sourceGitHead, head.trim());
  assert.equal(report.run.sourceGitTree, tree.trim());
  assert.equal(report.run.repositoryHashBasis, 'GIT_OBJECT');
  assert.equal(report.run.intakeHashBasis, 'FILESYSTEM_BYTES');
  assert.deepEqual(report.pilotA.map(item => item.canonicalPath), PILOT_A_PATHS);
  for (const pilot of report.pilotA) {
    const expected = pilotExpected[pilot.canonicalPath];
    assert.equal(pilot.hashBasis, 'GIT_OBJECT');
    assert.equal(pilot.sourceSha256, expected.sha256, pilot.canonicalPath);
    assert.equal(pilot.sizeBytes, expected.sizeBytes, pilot.canonicalPath);
    assert.deepEqual(pilot.errors, []);
    assert.equal(pilot.canonicalUrl, `https://mathexam.space/${pilot.canonicalPath}`);
    assert.equal(pilot.sitemapReferenced, true);
    assert.equal(pilot.courseReferenced, true);
    assert.equal(pilot.manifestEntry, false);
    assert.deepEqual(pilot.publicationSurfaces, {
      FILE_PUBLISHED: true,
      SITE_DISCOVERY: true,
      BOARD_DISCOVERY: false,
      BOARD_MIRROR: false
    });
    assert.equal(pilot.archetype, 'standalone-single-file');
    assert.equal(pilot.proposedTrack, 'CATALOG_ONLY');
    assert.equal(pilot.duplicateStatus, 'CANONICAL');
    assert.equal(pilot.unresolvedReview.pedagogical, 'PENDING_OWNER_REVIEW');
    assert.equal(pilot.unresolvedReview.standaloneMobile, 'NOT_RUN');
    assert.equal(pilot.unresolvedReview.iframeManualUrl, 'NOT_RUN');
  }
});

test('repository inputs remain byte-identical before and after inventory', async () => {
  const { stdout } = await execFileAsync(
    'git',
    ['ls-files', '-z'],
    { cwd: repoRoot, windowsHide: true, encoding: 'buffer', maxBuffer: 8 * 1024 * 1024 }
  );
  const tracked = stdout.toString('utf8').split('\0').filter(Boolean);
  const before = Object.fromEntries(await Promise.all(
    tracked.map(async relative => [relative, sha256(await readFile(path.join(repoRoot, ...relative.split('/'))))])
  ));
  await fullReport();
  const after = Object.fromEntries(await Promise.all(
    tracked.map(async relative => [relative, sha256(await readFile(path.join(repoRoot, ...relative.split('/'))))])
  ));
  assert.deepEqual(after, before);
});

test('inventory implementation makes no outbound request', async () => {
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async () => {
    requests += 1;
    throw new Error('OUTBOUND_FORBIDDEN');
  };
  try {
    const report = await inventoryCandidates({
      repoRoot,
      candidates: [syntheticCandidate('trainers/no-network.html', '<script>fetch("/api")</script>')],
      manifest: emptyManifest
    });
    assert.equal(requests, 0);
    assert.deepEqual(report.descriptors[0].dependencies.networkSignals, ['fetch']);
    assert.equal(report.run.outboundRequests, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('generated handoff is sanitized and generated output directory is ignored', async () => {
  const report = await inventoryCandidates({
    repoRoot,
    candidates: [syntheticCandidate('trainers/sanitized.html')],
    manifest: emptyManifest
  });
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'trainer-inventory-output-'));
  try {
    await writeInventoryOutputs(temporary, report);
    const handoff = await json(path.join(temporary, 'sanitized-handoff.json'));
    assert.equal(scanSanitizedValue(handoff).ok, true);
    assert.equal(handoff.containsCredentials, false);
    assert.equal(handoff.containsAbsoluteLocalPaths, false);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
  const { stdout } = await execFileAsync(
    'git',
    ['check-ignore', 'tools/trainer-inventory/.output/inventory.json'],
    { cwd: repoRoot, windowsHide: true }
  );
  assert.match(stdout, /tools\/trainer-inventory\/\.output\/inventory\.json/);
});

test('unsafe evidence values are redacted without losing the finding', () => {
  const localPath = 'C:/Users/example/private.js';
  const tokenUrl = 'https://cdn.example.test/app.js?token=secret-value';
  const result = analyzeHtml(
    `<!doctype html><html><head><title>${localPath}</title>
      <meta name="api-key" content="secret-value">
      <script src="${localPath}"></script>
      <script src="${tokenUrl}"></script>
      </head><body></body></html>`,
    'trainers/redacted.html'
  );
  const serialized = JSON.stringify(result);
  assert.equal(serialized.includes('secret-value'), false);
  assert.equal(serialized.includes('C:/Users/'), false);
  assert.ok(serialized.includes('redacted:sha256:'));
  assert.deepEqual(result.dependencies.externalOrigins, ['https://cdn.example.test']);
});

test('full report contains no machine-specific absolute path', async () => {
  const report = await fullReport();
  const serialized = JSON.stringify(report);
  assert.equal(/(?:^|[\s"'(])(?:[A-Za-z]:[\\/]|\\\\[^\\\s]+\\[^\\\s]+)/.test(serialized), false);
  assert.equal(serialized.includes(repoRoot), false);
});

test('inventory source contains exact-path runtime lookup and no basename authorization', async () => {
  const source = await readFile(path.join(repoRoot, 'tools', 'trainer-inventory', 'index.mjs'), 'utf8');
  assert.match(source, /manifestByFile\.get\(candidate\.canonicalPath\)/);
  assert.match(source, /authorizationUsesBasename: false/);
  assert.doesNotMatch(source, /manifestByFile\.get\(.*basename/);
});

test('scoped CLI marker cannot claim the full gate', async () => {
  const { stdout } = await execFileAsync(
    process.execPath,
    ['tools/trainer-inventory/cli.mjs', '--check'],
    { cwd: repoRoot, windowsHide: true, maxBuffer: 4 * 1024 * 1024 }
  );
  assert.match(stdout, /TRAINER_FACTORY_INVENTORY_V1_CHECK_OK/);
  assert.doesNotMatch(stdout, /TRAINER_FACTORY_INVENTORY_V1_GATE_OK/);
  assert.doesNotMatch(stdout, /TRAINER_FACTORY_INVENTORY_HASH_BASIS_V1_GATE_OK/);

  const cliSource = await readFile(
    path.join(repoRoot, 'tools', 'trainer-inventory', 'cli.mjs'),
    'utf8'
  );
  const gateSource = await readFile(
    path.join(repoRoot, 'tools', 'trainer-inventory', 'gate.mjs'),
    'utf8'
  );
  assert.doesNotMatch(cliSource, /TRAINER_FACTORY_INVENTORY_V1_GATE_OK/);
  assert.doesNotMatch(cliSource, /TRAINER_FACTORY_INVENTORY_HASH_BASIS_V1_GATE_OK/);
  assert.match(gateSource, /TRAINER_FACTORY_INVENTORY_V1_GATE_OK/);
  assert.match(gateSource, /TRAINER_FACTORY_INVENTORY_HASH_BASIS_V1_GATE_OK/);
  assert.match(gateSource, /Phase 1 tests/);
  assert.match(gateSource, /Board-server regression/);
  assert.match(gateSource, /Committed diff check/);
});

test('working diff stays inside the approved docs, skill, fixture, and tool scope', async () => {
  const { stdout } = await execFileAsync(
    'git',
    ['status', '--porcelain=v1', '-uall'],
    { cwd: repoRoot, windowsHide: true }
  );
  const changed = stdout
    .split(/\r?\n/)
    .filter(Boolean)
    .map(line => line.slice(3).replaceAll('\\', '/'));
  const { stdout: baseStdout } = await execFileAsync(
    'git',
    ['merge-base', 'HEAD', 'origin/main'],
    { cwd: repoRoot, windowsHide: true }
  );
  const { stdout: committedStdout } = await execFileAsync(
    'git',
    ['diff', '--name-only', `${baseStdout.trim()}..HEAD`],
    { cwd: repoRoot, windowsHide: true }
  );
  const allChanged = [
    ...changed,
    ...committedStdout.split(/\r?\n/).filter(Boolean).map(value => value.replaceAll('\\', '/'))
  ];
  // Owner-approved focused trainer fix: keep its exact six-file boundary
  // separate from the historical inventory-only task boundary below.
  const focusedFiles = new Set([
    'trainers/oge-task6-fractions.html',
    'tools/oge-task6-fractions-focused.test.mjs',
    'tools/oge-task6-fractions-focused.browser.mjs',
    'docs/tasks/OGE_TASK6_FRACTIONS_FOCUSED_FIX.md',
    'tools/trainer-inventory/test/inventory.test.mjs',
    'docs/tasks/TRAINER_INVENTORY_HASH_BASIS_V1.md'
  ]);
  const focusedTask = allChanged.some(relative => (
    relative === 'trainers/oge-task6-fractions.html'
    || relative === 'tools/oge-task6-fractions-focused.test.mjs'
    || relative === 'tools/oge-task6-fractions-focused.browser.mjs'
    || relative === 'docs/tasks/OGE_TASK6_FRACTIONS_FOCUSED_FIX.md'
  ));
  const allowed = allChanged.filter(relative => focusedTask ? focusedFiles.has(relative) : (
    relative === '.gitignore'
    || relative === '.agents/skills/trainer-inventory/SKILL.md'
    || relative === 'docs/TRAINER_INVENTORY_FORMAT.md'
    || relative === 'docs/tasks/TRAINER_FACTORY_INVENTORY_V1.md'
    || relative === 'docs/tasks/TRAINER_INVENTORY_HASH_BASIS_V1.md'
    || relative === 'tools/fixtures/trainer-public-url-conformance.json'
    || relative.startsWith('tools/trainer-inventory/')
  ));
  assert.deepEqual(allChanged.sort(), allowed.sort());
});

test('committed-scope sources contain no secret assignment or machine absolute path', async () => {
  const relativePaths = [
    '.agents/skills/trainer-inventory/SKILL.md',
    'docs/TRAINER_INVENTORY_FORMAT.md',
    'docs/tasks/TRAINER_FACTORY_INVENTORY_V1.md',
    'docs/tasks/TRAINER_INVENTORY_HASH_BASIS_V1.md',
    'tools/fixtures/trainer-public-url-conformance.json',
    'tools/trainer-inventory/cli.mjs',
    'tools/trainer-inventory/index.mjs',
    'tools/trainer-inventory/schema/trainer-inventory-descriptor.schema.json'
  ];
  for (const relative of relativePaths) {
    const source = await readFile(path.join(repoRoot, ...relative.split('/')), 'utf8');
    assert.doesNotMatch(
      source,
      /(?:token|password|passwd|api[_-]?key)\s*[:=]\s*["'][^"']+["']/i,
      relative
    );
    assert.doesNotMatch(
      source,
      /(?:^|[\s"'(])(?:[A-Za-z]:[\\/]Users[\\/]|\\\\(?:localhost|127\.0\.0\.1)\\)/m,
      relative
    );
  }
});


test('Git batch reader preserves spaces, nested Unicode, zero bytes, and both object-id lengths', async () => {
  const firstPath = 'trainers/nested/space name.html';
  const unicodePath = 'trainers/nested/кириллица.html';
  const zeroPath = 'trainers/zero.html';
  const bytes = Buffer.from('<html><head><title>Batch bytes</title></head><body></body></html>\n');
  const temporary = await createInventoryTestRepository({
    [firstPath]: bytes, [unicodePath]: bytes, [zeroPath]: Buffer.alloc(0)
  });
  try {
    const normal = await gitScenario(temporary, { targetPath: firstPath });
    assert.equal(normal.error, undefined);
    for (const relative of [firstPath, unicodePath]) {
      const candidate = normal.result.candidates.find(item => item.canonicalPath === relative);
      assert.equal(candidate.bytesHex, bytes.toString('hex'));
      assert.match(candidate.objectId, /^[a-f0-9]{40}$/);
    }
    assert.equal(normal.result.candidates.find(item => item.canonicalPath === zeroPath).bytesHex, '');
    const longId = await gitScenario(temporary, { targetPath: firstPath, mode: 'object-id-64' });
    assert.equal(longId.error, undefined);
    assert.equal(longId.result.candidates.find(item => item.canonicalPath === firstPath).objectId, 'a'.repeat(64));
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test('Git batch missing responses isolate candidates and references but reject a missing manifest', async () => {
  const candidatePath = 'trainers/batch-missing.html';
  const goodPath = 'trainers/batch-good.html';
  const bytes = Buffer.from('<html><head><title>Batch missing</title></head><body></body></html>');
  const temporary = await createInventoryTestRepository({
    [candidatePath]: bytes, [goodPath]: bytes,
    'sitemap.xml': '<urlset><url><loc>https://mathexam.space/' + goodPath + '</loc></url></urlset>'
  });
  try {
    const candidate = await gitScenario(temporary, {
      mode: 'missing', targetPath: candidatePath, runInventory: true
    });
    assert.equal(candidate.error, undefined);
    const missing = candidate.result.descriptors.find(item => item.canonicalPath === candidatePath);
    assert.equal(missing.sourceSha256, null);
    assert.equal(missing.sizeBytes, null);
    assert.ok(missing.errors.includes('GIT_OBJECT_READ_FAILED:' + candidatePath));
    assert.equal(candidate.result.findings.counts.hashReadFailures, 1);
    assert.equal(candidate.result.descriptors.find(item => item.canonicalPath === goodPath).sourceSha256, sha256(bytes));
    assert.equal(await readFile(path.join(temporary, candidatePath), 'utf8'), bytes.toString('utf8'));

    const reference = await gitScenario(temporary, {
      mode: 'missing', targetPath: 'sitemap.xml', runInventory: true
    });
    assert.equal(reference.error, undefined);
    assert.equal(reference.result.findings.counts.hashReadFailures, 0);
    assert.deepEqual(reference.result.findings.referenceReadFailures, [{
      canonicalPath: 'sitemap.xml', error: 'REFERENCE_GIT_OBJECT_READ_FAILED:sitemap.xml'
    }]);
    const manifest = await gitScenario(temporary, {
      mode: 'missing', targetPath: 'trainers/board-compat.json'
    });
    assert.equal(manifest.error, 'RUNTIME_MANIFEST_GIT_OBJECT_READ_FAILED');
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test('Git batch corrupt protocol and child failures abort the whole run', async t => {
  const relative = 'trainers/batch-protocol.html';
  const temporary = await createInventoryTestRepository({
    [relative]: '<html><head><title>Protocol</title></head><body></body></html>'
  });
  try {
    for (const [mode, expected] of [
      ['non-blob', 'GIT_OBJECT_BATCH_PROTOCOL_FAILED'],
      ['malformed-header', 'GIT_OBJECT_BATCH_PROTOCOL_FAILED'],
      ['truncated-body', 'GIT_OBJECT_BATCH_PROTOCOL_FAILED'],
      ['missing-trailing-newline', 'GIT_OBJECT_BATCH_PROTOCOL_FAILED'],
      ['empty-output', 'GIT_OBJECT_BATCH_PROTOCOL_FAILED'],
      ['trailing-data', 'GIT_OBJECT_BATCH_TRAILING_DATA'],
      ['child-start-error', 'GIT_OBJECT_BATCH_START_FAILED'],
      ['child-nonzero', 'GIT_OBJECT_BATCH_FAILED']
    ]) {
      await t.test(mode, async () => {
        const result = await gitScenario(temporary, { mode, targetPath: relative });
        assert.equal(result.error, expected);
        assert.equal(result.result, undefined);
      });
    }
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test('Git tree CR and LF paths fail before sending batch object specs', async t => {
  const temporary = await createInventoryTestRepository({
    'trainers/control-safe.html': '<html><head><title>Control</title></head><body></body></html>'
  });
  try {
    for (const [label, pathControl] of [['CR', '\r'], ['LF', '\n']]) {
      await t.test(label, async () => {
        const result = await gitScenario(temporary, { pathControl });
        assert.match(result.error, /GIT_(?:OBJECT|TREE)_PATH_CONTROL_FORBIDDEN/);
        assert.equal(result.batchStarted, false);
      });
    }
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test('captured head and tree remain paired when HEAD moves during collection', async () => {
  const relative = 'trainers/head-race.html';
  const original = '<html><head><title>Captured</title></head><body></body></html>';
  const temporary = await createInventoryTestRepository({ [relative]: original });
  try {
    const { stdout: originalHead } = await git(temporary, ['rev-parse', 'HEAD']);
    const { stdout: originalTree } = await git(temporary, ['rev-parse', 'HEAD^{tree}']);
    await writeFile(path.join(temporary, relative), original.replace('Captured', 'Later'));
    await git(temporary, ['add', relative]);
    await git(temporary, ['commit', '-m', 'later head fixture']);
    const { stdout: laterHead } = await git(temporary, ['rev-parse', 'HEAD']);
    await git(temporary, ['update-ref', '--no-deref', 'HEAD', originalHead.trim()]);
    const result = await gitScenario(temporary, { moveHeadTo: laterHead.trim() });
    assert.equal(result.error, undefined);
    assert.equal(result.movedHead, true);
    assert.equal(result.result.sourceGitHead, originalHead.trim());
    assert.equal(result.result.sourceGitTree, originalTree.trim());
    assert.equal(result.result.candidates[0].bytesHex, Buffer.from(original).toString('hex'));
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test('reference-only commit recomputes discovery while reusing unchanged candidate analysis', async () => {
  const relative = 'trainers/reference-only.html';
  const coursePath = 'trainers/oge-course/index.html';
  const html = '<html><head><title>Reference fixture</title></head><body></body></html>';
  const temporary = await createInventoryTestRepository({
    [relative]: html, [coursePath]: html, 'sitemap.xml': '<urlset></urlset>'
  });
  try {
    const previous = await runRepositoryInventory({ repoRoot: temporary });
    await writeFile(path.join(temporary, 'sitemap.xml'), '<urlset><url><loc>https://mathexam.space/' + relative + '</loc></url></urlset>');
    await writeFile(path.join(temporary, coursePath), html.replace('<body>', '<body><a href="/' + relative + '">Trainer</a>'));
    await git(temporary, ['add', 'sitemap.xml', coursePath]);
    await git(temporary, ['commit', '-m', 'reference-only fixture']);
    const fresh = await runRepositoryInventory({ repoRoot: temporary });
    const incremental = await runRepositoryInventory({ repoRoot: temporary, previousReport: previous });
    const before = previous.descriptors.find(item => item.canonicalPath === relative);
    const after = incremental.descriptors.find(item => item.canonicalPath === relative);
    assert.equal(incremental.run.incrementalReused, 1);
    assert.equal(after.sourceSha256, before.sourceSha256);
    assert.equal(before.publicationSurfaces.SITE_DISCOVERY, false);
    assert.equal(after.publicationSurfaces.SITE_DISCOVERY, true);
    assert.deepEqual(after.references.sitemap, ['sitemap.xml']);
    assert.deepEqual(after.references.course, [coursePath]);
    assertSameInventory(incremental, fresh);
    assert.notEqual(fresh.deterministicFingerprint, previous.deterministicFingerprint);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test('manifest-only commit recomputes runtime fields and classification with reused HTML', async () => {
  const relative = 'trainers/manifest-only.html';
  const temporary = await createInventoryTestRepository({
    [relative]: '<html><head><title>Manifest fixture</title></head><body></body></html>'
  });
  try {
    const previous = await runRepositoryInventory({ repoRoot: temporary });
    const manifest = { version: 1, schemaVersion: 1, trainers: [{
      trainerId: 'manifest-only', file: relative, title: 'Manifest entry', group: 'Test fixture',
      boardCompatibility: 'opens-in-board', supportsSeed: false, supportsBoardMirror: false
    }] };
    await writeFile(path.join(temporary, 'trainers/board-compat.json'), JSON.stringify(manifest));
    await git(temporary, ['add', 'trainers/board-compat.json']);
    await git(temporary, ['commit', '-m', 'manifest-only fixture']);
    const fresh = await runRepositoryInventory({ repoRoot: temporary });
    const incremental = await runRepositoryInventory({ repoRoot: temporary, previousReport: previous });
    assert.equal(incremental.run.incrementalReused, 1);
    assert.equal(incremental.descriptors[0].sourceSha256, previous.descriptors[0].sourceSha256);
    assert.equal(previous.descriptors[0].runtimeCrossCheck.registryEntryExpected, false);
    assert.equal(incremental.descriptors[0].runtimeCrossCheck.registryEntryExpected, true);
    assert.equal(incremental.descriptors[0].runtimeCrossCheck.fields.title, 'Manifest entry');
    assert.equal(incremental.descriptors[0].publicationSurfaces.BOARD_DISCOVERY, true);
    assert.equal(incremental.descriptors[0].classification.archetype, 'standalone-board-open');
    assertSameInventory(incremental, fresh);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test('incompatible or malformed previous reports cannot poison current HTML analysis', async t => {
  const candidates = [syntheticCandidate('trainers/cache-guard.html')];
  const fresh = await inventoryCandidates({ repoRoot, candidates, manifest: emptyManifest });
  const mutations = [
    ['older tool', report => { report.toolVersion = '1.0.0'; report.descriptors[0].html.title = 'STALE'; }],
    ['older schema', report => { report.schemaVersion = 0; report.descriptors[0].html.title = 'STALE'; }],
    ['different origin', report => { report.canonicalOrigin = 'https://example.invalid'; }],
    ['non-array descriptors', report => { report.descriptors = {}; }],
    ['null descriptor', report => { report.descriptors = [null]; }],
    ['missing HTML title', report => { delete report.descriptors[0].html.title; }],
    ['malformed HTML signal', report => { report.descriptors[0].html.usesBridge = 'true'; }],
    ['null dependencies', report => { report.descriptors[0].dependencies = null; }],
    ['non-array dependency', report => { report.descriptors[0].dependencies.internalAssets = 'invalid'; }],
    ['different source kind', report => { report.descriptors[0].sourceKind = 'repo'; report.descriptors[0].hashBasis = 'GIT_OBJECT'; }],
    ['different hash basis', report => { report.descriptors[0].hashBasis = 'GIT_OBJECT'; }],
    ['null-hash failure', report => {
      report.descriptors[0].sourceSha256 = null;
      report.descriptors[0].sizeBytes = null;
      report.descriptors[0].errors = ['GIT_OBJECT_READ_FAILED:trainers/cache-guard.html'];
    }]
  ];
  for (const [label, mutate] of mutations) {
    await t.test(label, async () => {
      const previousReport = structuredClone(fresh);
      mutate(previousReport);
      const payload = Object.fromEntries([
        'schemaVersion', 'toolVersion', 'canonicalOrigin', 'inputs', 'descriptors', 'findings', 'pilotA'
      ].map(key => [key, previousReport[key]]));
      previousReport.deterministicFingerprint = sha256(stableStringify(payload));
      const result = await inventoryCandidates({ repoRoot, candidates, manifest: emptyManifest, previousReport });
      assert.equal(result.run.incrementalReused, 0);
      assertSameInventory(result, fresh);
    });
  }
  await t.test('invalid fingerprint', async () => {
    const previousReport = structuredClone(fresh);
    previousReport.descriptors[0].html.title = 'STALE';
    const result = await inventoryCandidates({ repoRoot, candidates, manifest: emptyManifest, previousReport });
    assert.equal(result.run.incrementalReused, 0);
    assertSameInventory(result, fresh);
  });
});

test('repository asset findings stay fixed when a tracked asset disappears only from the checkout', async () => {
  const relative = 'trainers/asset-layout.html';
  const assetPath = 'assets/layout.svg';
  const temporary = await createInventoryTestRepository({
    [relative]: '<html><head><title>Asset layout</title></head><body><img src="/' + assetPath + '"></body></html>',
    [assetPath]: '<svg></svg>'
  });
  try {
    const full = await runRepositoryInventory({ repoRoot: temporary });
    assert.deepEqual(full.descriptors[0].errors, []);
    await rm(path.join(temporary, assetPath));
    const absent = await runRepositoryInventory({ repoRoot: temporary });
    assert.equal(absent.run.sourceGitHead, full.run.sourceGitHead);
    assert.equal(absent.run.sourceGitTree, full.run.sourceGitTree);
    assertSameInventory(absent, full);
    await mkdir(path.join(temporary, assetPath));
    const replacedWithDirectory = await runRepositoryInventory({ repoRoot: temporary });
    assertSameInventory(replacedWithDirectory, full);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test('repository missing assets cannot be masked by untracked checkout files', async () => {
  const assetPath = 'assets/untracked.svg';
  const temporary = await createInventoryTestRepository({
    'trainers/untracked-asset.html': '<html><head><title>Untracked asset</title></head><body><img src="/' + assetPath + '"></body></html>'
  });
  try {
    const absent = await runRepositoryInventory({ repoRoot: temporary });
    assert.deepEqual(absent.descriptors[0].errors, ['ASSET_MISSING:' + assetPath]);
    await mkdir(path.join(temporary, 'assets'));
    await writeFile(path.join(temporary, assetPath), '<svg></svg>');
    const masked = await runRepositoryInventory({ repoRoot: temporary });
    assert.equal(masked.run.sourceGitHead, absent.run.sourceGitHead);
    assert.equal(masked.run.sourceGitTree, absent.run.sourceGitTree);
    assertSameInventory(masked, absent);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test('one repository head has identical inventory in full and sparse-like checkout layouts', async () => {
  const relative = 'trainers/sparse-assets.html';
  const assetPath = 'assets/sparse.svg';
  const temporary = await createInventoryTestRepository({
    [relative]: '<html><head><title>Sparse assets</title></head><body><img src="/' + assetPath + '"></body></html>',
    [assetPath]: '<svg></svg>',
    'sitemap.xml': '<urlset><url><loc>https://mathexam.space/' + relative + '</loc></url></urlset>'
  });
  const sparse = await mkdtemp(path.join(os.tmpdir(), 'trainer-inventory-sparse-layout-'));
  try {
    const full = await runRepositoryInventory({ repoRoot: temporary });
    await git(temporary, ['clone', '--no-checkout', '--no-hardlinks', '--', temporary, sparse]);
    // No candidate, manifest, reference, or asset file is materialized here.
    await assert.rejects(readFile(path.join(sparse, relative)), { code: 'ENOENT' });
    await assert.rejects(readFile(path.join(sparse, assetPath)), { code: 'ENOENT' });
    const partial = await runRepositoryInventory({ repoRoot: sparse });
    assert.equal(partial.run.sourceGitHead, full.run.sourceGitHead);
    assert.equal(partial.run.sourceGitTree, full.run.sourceGitTree);
    assert.deepEqual(partial.descriptors[0].errors, []);
    assert.deepEqual(partial.descriptors[0].references.sitemap, ['sitemap.xml']);
    assertSameInventory(partial, full);
  } finally {
    await rm(sparse, { recursive: true, force: true });
    await rm(temporary, { recursive: true, force: true });
  }
});

test('repository asset-only commits recompute existence for fresh and incremental inventories', async () => {
  const relative = 'trainers/asset-commits.html';
  const assetPath = 'assets/committed.svg';
  const temporary = await createInventoryTestRepository({
    [relative]: '<html><head><title>Asset commits</title></head><body><img src="/' + assetPath + '"></body></html>'
  });
  try {
    const missing = await runRepositoryInventory({ repoRoot: temporary });
    assert.deepEqual(missing.descriptors[0].errors, ['ASSET_MISSING:' + assetPath]);
    await mkdir(path.join(temporary, 'assets'));
    await writeFile(path.join(temporary, assetPath), '<svg></svg>');
    await git(temporary, ['add', assetPath]);
    await git(temporary, ['commit', '-m', 'add referenced asset']);
    const addedFresh = await runRepositoryInventory({ repoRoot: temporary });
    const addedIncremental = await runRepositoryInventory({ repoRoot: temporary, previousReport: missing });
    assert.notEqual(addedFresh.run.sourceGitHead, missing.run.sourceGitHead);
    assert.equal(addedFresh.descriptors[0].sourceSha256, missing.descriptors[0].sourceSha256);
    assert.equal(addedIncremental.run.incrementalReused, 1);
    assert.deepEqual(addedFresh.descriptors[0].errors, []);
    assert.notDeepEqual(addedFresh.descriptors, missing.descriptors);
    assert.notEqual(addedFresh.deterministicFingerprint, missing.deterministicFingerprint);
    assertSameInventory(addedIncremental, addedFresh);

    await git(temporary, ['rm', '--', assetPath]);
    await git(temporary, ['commit', '-m', 'remove referenced asset']);
    const removedFresh = await runRepositoryInventory({ repoRoot: temporary });
    const removedIncremental = await runRepositoryInventory({ repoRoot: temporary, previousReport: addedFresh });
    assert.notEqual(removedFresh.run.sourceGitHead, addedFresh.run.sourceGitHead);
    assert.equal(removedFresh.descriptors[0].sourceSha256, addedFresh.descriptors[0].sourceSha256);
    assert.equal(removedIncremental.run.incrementalReused, 1);
    assert.deepEqual(removedFresh.descriptors[0].errors, ['ASSET_MISSING:' + assetPath]);
    assert.notEqual(removedFresh.deterministicFingerprint, addedFresh.deterministicFingerprint);
    assertSameInventory(removedIncremental, removedFresh);
    assertSameInventory(removedFresh, missing);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test('repository asset URLs decode spaces and Unicode exactly once for exact-tree lookup', async () => {
  const assetPaths = [
    'assets/space name.svg',
    'assets/nested/\u043a\u0438\u0440\u0438\u043b\u043b\u0438\u0446\u0430.svg',
    'assets/literal%20name.svg',
    'assets/literal%2fname.svg'
  ];
  const sources = assetPaths.map(relative => '/' + relative.split('/').map(encodeURIComponent).join('/'));
  const temporary = await createInventoryTestRepository({
    'trainers/encoded-assets.html': '<html><head><title>Encoded assets</title></head><body>'
      + sources.map(source => '<img src="' + source + '">').join('') + '</body></html>',
    ...Object.fromEntries(assetPaths.map(relative => [relative, '<svg></svg>']))
  });
  try {
    const report = await runRepositoryInventory({ repoRoot: temporary });
    assert.deepEqual(report.descriptors[0].errors, []);
    assert.equal(report.descriptors[0].dependencies.internalAssets.length, assetPaths.length);
    for (const relative of assetPaths) await rm(path.join(temporary, relative));
    const withoutCheckoutAssets = await runRepositoryInventory({ repoRoot: temporary });
    assertSameInventory(withoutCheckoutAssets, report);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test('repository malformed or unsafe encoded asset URLs fail closed before URL normalization', async t => {
  const vectors = [
    ['incomplete percent', '/assets/bad%.svg'],
    ['nonhex percent', '/assets/bad%GG.svg'],
    ['invalid UTF8', '/assets/bad%E0%A4%A.svg'],
    ['encoded slash', '/assets%2fimage.svg'],
    ['encoded backslash', '/assets%5cimage.svg'],
    ['literal dot', '/assets/./image.svg'],
    ['literal parent', '/assets/../image.svg'],
    ['encoded dot', '/assets/%2e/image.svg'],
    ['encoded parent', '/assets/%2E%2E/image.svg'],
    ['mixed encoded parent', '/assets/.%2e/image.svg'],
    ['NUL control', '/assets/bad%00.svg'],
    ['LF control', '/assets/bad%0a.svg'],
    ['DEL control', '/assets/bad%7f.svg'],
    ['bidi control', '/assets/bad%E2%80%AE.svg'],
    ['raw backslash', '/assets\\image.svg']
  ];
  for (const [label, source] of vectors) {
    await t.test(label, async () => {
      const report = await inventoryCandidates({
        repoRoot,
        repositoryTree: new Map([
          ['assets/image.svg', { type: 'blob' }],
          ['image.svg', { type: 'blob' }]
        ]),
        candidates: [{
          sourceKind: 'repo',
          canonicalPath: 'trainers/unsafe-asset.html',
          gitObjectBytes: Buffer.from('<html><head><title>Unsafe asset</title></head><body><img src="'
            + source + '"></body></html>')
        }],
        manifest: emptyManifest
      });
      assert.ok(report.descriptors[0].errors.includes('HTML_REFERENCE_MALFORMED'));
      assert.equal(report.descriptors[0].dependencies.malformedReferences.length, 1);
      assert.deepEqual(report.descriptors[0].dependencies.internalAssets, []);
    });
  }
});

test('repository directory asset evidence is NOT_FILE even when checkout path becomes a file', async () => {
  const assetPath = 'assets/directory';
  const temporary = await createInventoryTestRepository({
    'trainers/directory-asset.html': '<html><head><title>Directory asset</title></head><body><img src="/' + assetPath + '"></body></html>',
    [assetPath + '/child.svg']: '<svg></svg>'
  });
  try {
    const directory = await runRepositoryInventory({ repoRoot: temporary });
    assert.deepEqual(directory.descriptors[0].errors, ['ASSET_NOT_FILE:' + assetPath]);
    await rm(path.join(temporary, assetPath), { recursive: true });
    await writeFile(path.join(temporary, assetPath), '<svg></svg>');
    const checkoutFile = await runRepositoryInventory({ repoRoot: temporary });
    assertSameInventory(checkoutFile, directory);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});


function descriptorHashVectors(base) {
  const withKind = (kind, change = {}) => ({
    ...structuredClone(base),
    sourceKind: kind,
    inventoryId: 'inv-' + kind + '-' + '0'.repeat(24),
    hashBasis: kind === 'repo' ? 'GIT_OBJECT' : 'FILESYSTEM_BYTES',
    ...change
  });
  const pair = { sourceSha256: null, sizeBytes: null };
  const failure = 'GIT_OBJECT_READ_FAILED:' + base.canonicalPath;
  return [
    ['repo success', withKind('repo'), true],
    ['intake success', withKind('intake'), true],
    ['synthetic success', withKind('synthetic'), true],
    ['repo matching failure', withKind('repo', { ...pair, errors: [failure] }), true],
    ['repo null without failure', withKind('repo', pair), false],
    ['repo hash-only null', withKind('repo', { sourceSha256: null, errors: [failure] }), false],
    ['repo size-only null', withKind('repo', { sizeBytes: null, errors: [failure] }), false],
    ['repo foreign failure', withKind('repo', { ...pair, errors: ['GIT_OBJECT_READ_FAILED:trainers/other.html'] }), false, true],
    ['repo nonnull failure', withKind('repo', { errors: [failure] }), false],
    ['intake null without failure', withKind('intake', pair), false],
    ['intake forged failure', withKind('intake', { ...pair, errors: [failure] }), false],
    ['synthetic forged failure', withKind('synthetic', { ...pair, errors: [failure] }), false],
    ['synthetic null without failure', withKind('synthetic', pair), false],
    ['intake nonnull forged failure', withKind('intake', { errors: [failure] }), false],
    ['synthetic nonnull forged failure', withKind('synthetic', { errors: [failure] }), false],
    ['intake wrong basis', withKind('intake', { hashBasis: 'GIT_OBJECT' }), false],
    ['repo wrong basis', withKind('repo', { hashBasis: 'FILESYSTEM_BYTES' }), false],
    ['synthetic wrong basis', withKind('synthetic', { hashBasis: 'GIT_OBJECT' }), false],
    ['repo bare failure', withKind('repo', { ...pair, errors: ['GIT_OBJECT_READ_FAILED'] }), false],
    ['repo multiple failures', withKind('repo', { ...pair, errors: [failure, 'GIT_OBJECT_READ_FAILED:trainers/other.html'] }), false],
    ['errors must be an array', withKind('repo', { ...pair, errors: failure }), false],
    ['errors must contain strings', withKind('repo', { ...pair, errors: [null] }), false]
  ];
}

test('descriptor hash and size contract rejects forged and mismatched evidence', async t => {
  const report = await inventoryCandidates({
    repoRoot, candidates: [syntheticCandidate('trainers/hash-contract.html')], manifest: emptyManifest
  });
  const vectors = descriptorHashVectors(report.descriptors[0]);
  const schema = await json(schemaPath);
  const originalSchema = structuredClone(schema);
  assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
  assert.equal(schema.allOf.length, 2);
  const [basisRule, nullRule] = schema.allOf;
  assert.equal(basisRule.if.properties.sourceKind.const, 'repo');
  assert.equal(basisRule.then.properties.hashBasis.const, 'GIT_OBJECT');
  assert.equal(basisRule.else.properties.hashBasis.const, 'FILESYSTEM_BYTES');
  assert.equal(nullRule.then.properties.sourceKind.const, 'repo');
  assert.equal(nullRule.then.properties.sizeBytes.type, 'null');
  assert.deepEqual(nullRule.then.properties.errors.contains, { $ref: '#/$defs/candidateReadFailure' });
  assert.equal(nullRule.then.properties.errors.maxContains, 1);
  assert.equal(nullRule.else.properties.sizeBytes.type, 'integer');
  assert.equal(nullRule.else.properties.errors.not.contains.pattern, '^GIT_OBJECT_READ_FAILED');
  assert.equal(schema.$defs.candidateReadFailure.pattern, '^GIT_OBJECT_READ_FAILED:');

  // Optional standards-compliant review validator, installed outside this repo.
  // An explicitly supplied but unavailable validator must fail the gate.
  const validatorPath = process.env.TRAINER_INVENTORY_SCHEMA_VALIDATOR;
  let ajv;
  if (validatorPath) {
    const { default: Ajv2020 } = await import(pathToFileURL(validatorPath).href);
    ajv = new Ajv2020({ allErrors: true, strict: false });
  }
  const validateStatic = ajv?.compile(schema);
  for (const [label, descriptor, expected, staticExpected = expected] of vectors) {
    await t.test(label, () => {
      assert.equal(validateDescriptorShape(descriptor).ok, expected, label + ': executable');
      const bound = bindDescriptorSchema(schema, descriptor);
      assert.equal(bound.properties.canonicalPath.const, descriptor.canonicalPath);
      assert.equal(bound.$defs.candidateReadFailure.const, 'GIT_OBJECT_READ_FAILED:' + descriptor.canonicalPath);
      assert.deepEqual(bound.allOf, schema.allOf);
      assert.equal(Object.hasOwn(bound, '$id'), false);
      if (ajv) {
        // A foreign-path failure is structurally valid; the bound layer rejects it.
        assert.equal(validateStatic(descriptor), staticExpected, label + ': static schema');
        const validateBound = ajv.compile(bound);
        assert.equal(validateBound(descriptor), expected, label + ': path-bound schema');
      }
    });
  }
  assert.deepEqual(schema, originalSchema, 'binding must not mutate the static schema');
  assert.throws(() => bindDescriptorSchema(schema, {}), /DESCRIPTOR_SCHEMA_PATH_REQUIRED/);
  assert.throws(() => bindDescriptorSchema({}, report.descriptors[0]), /DESCRIPTOR_SCHEMA_INVALID/);
  const base = report.descriptors[0];
  if (ajv) {
    const validateBound = ajv.compile(bindDescriptorSchema(schema, base));
    assert.equal(validateBound({ ...base, canonicalPath: 'trainers/foreign.html' }), false);
  }
  t.diagnostic('hash contract vectors=' + vectors.length + '; executable and binding structure verified; '
    + (ajv ? 'static and path-bound Draft 2020-12 validation passed' : 'external schema validator not supplied'));
});

test('failed or null hash evidence never forms an exact-blob duplicate group', async () => {
  const candidates = ['one', 'two'].map(name => ({
    sourceKind: 'repo', canonicalPath: 'trainers/failed-' + name + '.html',
    gitObjectBytes: null, gitObjectError: 'GIT_OBJECT_READ_FAILED:trainers/failed-' + name + '.html'
  }));
  const report = await inventoryCandidates({ repoRoot, candidates, manifest: emptyManifest });
  assert.equal(report.findings.counts.hashReadFailures, 2);
  assert.equal(report.findings.blockers.filter(item => item.type === 'UNRESOLVED_EXACT_BLOB_DUPLICATE').length, 0);
  const forged = structuredClone(report.descriptors);
  for (const descriptor of forged) {
    descriptor.sourceSha256 = 'a'.repeat(64);
    descriptor.sizeBytes = 1;
    assert.equal(validateDescriptorShape(descriptor).ok, false);
  }
  assert.equal(applyDuplicateAnalysis(forged).blockers.filter(
    item => item.type === 'UNRESOLVED_EXACT_BLOB_DUPLICATE'
  ).length, 0);
});
