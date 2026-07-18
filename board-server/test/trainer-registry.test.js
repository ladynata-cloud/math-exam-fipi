'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  TRAINER_PATH_LIMITS,
  canonicalTrainerFile,
  canonicalRegistryJson,
  loadTrainerRegistry,
  registryDigest,
  trainerFileFromUrl,
  validateTrainerManifest
} = require('../trainer-registry');

const manifestPath = path.resolve(__dirname, '../../trainers/board-compat.json');
const conformanceFixturePath = path.resolve(
  __dirname,
  '../../tools/fixtures/trainer-path-conformance.json'
);
const expectedCatalogFiles = [
  'trainers/negative-numbers-line.html',
  'trainers/negative-numbers.html',
  'trainers/negative-numbers-alternative.html',
  'trainers/oge-task7-number-line.html',
  'trainers/inequalities-number-line.html',
  'trainers/linear-inequalities-basic.html',
  'trainers/linear-inequalities-stepwise.html',
  'trainers/like-terms-trainer.html',
  'trainers/percent-part-whole-trainer.html',
  'trainers/ege-t1-planimetry-trainer.html',
  'trainers/ege-t2-vectors-trainer.html',
  'trainers/oge-1-5-trainers/practice-1-5-roads-grid.html',
  'trainers/oge-1-5-trainers/practice-1-5-map.html',
  'trainers/oge-1-5-trainers/practice-1-5-entry-diagnostic-2026.html'
];

function currentManifest() {
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function copy(value) {
  return JSON.parse(JSON.stringify(value));
}

function mirrorEntry(manifest, trainerId = 'negative-numbers-line') {
  return manifest.trainers.find(entry => entry.trainerId === trainerId);
}

function expectError(mutate, error) {
  const manifest = currentManifest();
  mutate(manifest);
  assert.deepEqual(validateTrainerManifest(manifest), { ok: false, error });
}

function withTempManifest(content, callback) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mathexam-registry-'));
  const file = path.join(directory, 'board-compat.json');
  fs.writeFileSync(file, content, 'utf8');
  try {
    return callback(file, directory);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

function validateConformanceFixture(value) {
  assert.equal(value?.schemaVersion, 1, 'fixture schemaVersion');
  assert.deepEqual(value?.limits, TRAINER_PATH_LIMITS, 'fixture limits');
  assert.ok(Array.isArray(value?.vectors) && value.vectors.length > 0, 'fixture vectors');
  const ids = new Set();
  for (const vector of value.vectors) {
    assert.equal(typeof vector?.id, 'string', 'fixture vector id');
    assert.ok(!ids.has(vector.id), `duplicate fixture vector ${vector.id}`);
    ids.add(vector.id);
    assert.ok(['registry-file', 'trainer-url', 'manifest'].includes(vector.kind));
    assert.ok(['accept', 'reject'].includes(vector.expected));
    assert.equal(vector.canonical === null || typeof vector.canonical === 'string', true);
    assert.equal(typeof vector.note, 'string');
  }
  return value;
}

function loadConformanceFixture(file = conformanceFixturePath) {
  return validateConformanceFixture(JSON.parse(fs.readFileSync(file, 'utf8')));
}

function fixtureManifest(files) {
  return {
    version: 1,
    schemaVersion: 1,
    trainers: files.map((file, index) => ({
      trainerId: `fixture-${index + 1}`,
      file,
      title: `Fixture ${index + 1}`,
      group: 'Fixture',
      boardCompatibility: 'board-mirror',
      supportsBoardMirror: true,
      version: '1.0.0',
      stateSchemaVersion: 1,
      bridgeProtocolVersion: 1,
      allowLegacyHtml: false
    }))
  };
}

test('committed path fixture is present, well formed, unique, and limit-locked', () => {
  const fixture = loadConformanceFixture();
  assert.equal(fixture.vectors.length, 82);

  assert.throws(
    () => loadConformanceFixture(path.join(os.tmpdir(), 'fixture-missing-fail.json')),
    /ENOENT/,
    'fixture-missing-fail'
  );
  assert.throws(
    () => validateConformanceFixture(null),
    /fixture schemaVersion/,
    'fixture-malformed-fail'
  );
  const wrongLimits = copy(fixture);
  wrongLimits.limits.maxTotalLength += 1;
  assert.throws(
    () => validateConformanceFixture(wrongLimits),
    /fixture limits/,
    'fixture-limits-mismatch-fail'
  );
});

test('server consumes every committed registry-file and trainer-url vector', () => {
  const fixture = loadConformanceFixture();
  for (const vector of fixture.vectors) {
    let actual;
    if (vector.kind === 'registry-file') actual = canonicalTrainerFile(vector.input);
    else if (vector.kind === 'trainer-url') actual = trainerFileFromUrl(vector.input);
    else continue;
    assert.equal(actual, vector.canonical, vector.id);
    assert.equal(actual ? 'accept' : 'reject', vector.expected, vector.id);
  }
});

test('server consumes every committed manifest and authorization vector', () => {
  const fixture = loadConformanceFixture();
  for (const vector of fixture.vectors.filter(item => item.kind === 'manifest')) {
    const manifest = fixtureManifest(vector.input.files);
    if (vector.input.error) {
      assert.deepEqual(
        validateTrainerManifest(manifest),
        { ok: false, error: vector.input.error },
        vector.id
      );
      assert.equal(vector.expected, 'reject', vector.id);
      continue;
    }
    const validation = validateTrainerManifest(manifest);
    assert.equal(validation.ok, true, vector.id);
    withTempManifest(JSON.stringify(manifest), file => {
      const registry = loadTrainerRegistry({ env: { TRAINER_REGISTRY_PATH: file } });
      assert.equal(registry.loaded, true, vector.id);
      const entry = registry.getByTrainerUrl(vector.input.authorizeUrl);
      const actual = entry?.file || null;
      assert.equal(actual, vector.canonical, vector.id);
      assert.equal(actual ? 'accept' : 'reject', vector.expected, vector.id);
    });
  }
});

test('current manifest validates with fourteen catalog entries and three mirrors', () => {
  const manifest = currentManifest();
  const result = validateTrainerManifest(manifest);
  assert.equal(result.ok, true);
  assert.equal(manifest.version, 1);
  assert.equal(manifest.schemaVersion, 1);
  assert.deepEqual(manifest.trainers.map(entry => entry.file), expectedCatalogFiles);
  assert.equal(manifest.trainers.length, 14);
  assert.equal(result.trainers.length, 3);
});

test('runtime registry has exact parity with all three mirror authorizations', () => {
  const registry = loadTrainerRegistry({ env: {} });
  assert.deepEqual(registry.entries, [
    {
      trainerId: 'linear-inequalities-stepwise',
      file: 'trainers/linear-inequalities-stepwise.html',
      version: '1.0.0',
      stateSchemaVersion: 1,
      bridgeProtocolVersion: 1,
      allowLegacyHtml: true
    },
    {
      trainerId: 'negative-numbers-line',
      file: 'trainers/negative-numbers-line.html',
      version: '1.0.0',
      stateSchemaVersion: 1,
      bridgeProtocolVersion: 1,
      allowLegacyHtml: true
    },
    {
      trainerId: 'practice-1-5-roads-grid',
      file: 'trainers/oge-1-5-trainers/practice-1-5-roads-grid.html',
      version: '1.0.0',
      stateSchemaVersion: 1,
      bridgeProtocolVersion: 1,
      allowLegacyHtml: false
    }
  ]);
});

test('bundled default loads relative to the server module', () => {
  const registry = loadTrainerRegistry({ env: {} });
  assert.equal(registry.loaded, true);
  assert.equal(registry.source, 'bundled-default');
  assert.equal(registry.entries.length, 3);
  assert.match(registry.digest, /^sha256:[0-9a-f]{64}$/);
});

test('TRAINER_REGISTRY_PATH supports an absolute env override', () => {
  withTempManifest(JSON.stringify(currentManifest()), file => {
    const registry = loadTrainerRegistry({ env: { TRAINER_REGISTRY_PATH: file } });
    assert.equal(registry.loaded, true);
    assert.equal(registry.source, 'env');
  });
});

test('TRAINER_REGISTRY_PATH resolves relative to module baseDir, not cwd', () => {
  withTempManifest(JSON.stringify(currentManifest()), (_file, directory) => {
    const registry = loadTrainerRegistry({
      baseDir: directory,
      env: { TRAINER_REGISTRY_PATH: 'board-compat.json' }
    });
    assert.equal(registry.loaded, true);
    assert.equal(registry.source, 'env');
  });
});

test('missing and unreadable manifests fail closed without exposing paths', () => {
  const registry = loadTrainerRegistry({
    env: { TRAINER_REGISTRY_PATH: path.join(os.tmpdir(), 'missing-registry.json') }
  });
  assert.equal(registry.loaded, false);
  assert.equal(registry.error, 'REGISTRY_FILE_MISSING');
  assert.equal(registry.entries.length, 0);
  assert.equal(registry.getById('negative-numbers-line'), null);
  assert.equal(JSON.stringify(registry.publicPayload).includes(os.tmpdir()), false);
});

test('invalid JSON fails closed with a safe code', () => {
  withTempManifest('{ invalid', file => {
    const registry = loadTrainerRegistry({ env: { TRAINER_REGISTRY_PATH: file } });
    assert.equal(registry.loaded, false);
    assert.equal(registry.error, 'REGISTRY_JSON_INVALID');
    assert.deepEqual(registry.publicPayload.trainers, []);
  });
});

test('schemaVersion is required and supported', () => {
  expectError(manifest => { delete manifest.schemaVersion; }, 'REGISTRY_SCHEMA_REQUIRED');
  expectError(manifest => { manifest.schemaVersion = 2; manifest.version = 2; }, 'REGISTRY_SCHEMA_UNSUPPORTED');
});

test('legacy version must match schemaVersion when present', () => {
  expectError(manifest => { manifest.version = 2; }, 'REGISTRY_VERSION_MISMATCH');
  const manifest = currentManifest();
  delete manifest.version;
  assert.equal(validateTrainerManifest(manifest).ok, true);
});

test('duplicate trainer IDs and files are rejected', () => {
  expectError(manifest => {
    const duplicate = copy(manifest.trainers[0]);
    duplicate.file = 'trainers/duplicate.html';
    manifest.trainers.push(duplicate);
  }, 'REGISTRY_DUPLICATE_TRAINER_ID');
  expectError(manifest => {
    const duplicate = copy(manifest.trainers[0]);
    duplicate.trainerId = 'duplicate-trainer';
    manifest.trainers.push(duplicate);
  }, 'REGISTRY_DUPLICATE_FILE');
});

test('required catalog and mirror fields are enforced', () => {
  expectError(manifest => { delete manifest.trainers[0].title; }, 'REGISTRY_ENTRY_MISSING_FIELD');
  expectError(manifest => { delete mirrorEntry(manifest).version; }, 'REGISTRY_ENTRY_VERSION_INVALID');
  expectError(manifest => { delete mirrorEntry(manifest).allowLegacyHtml; }, 'REGISTRY_ENTRY_LEGACY_FLAG_INVALID');
});

test('trainer version and protocol versions are validated', () => {
  expectError(manifest => { mirrorEntry(manifest).version = 'latest'; }, 'REGISTRY_ENTRY_VERSION_INVALID');
  expectError(manifest => { mirrorEntry(manifest).stateSchemaVersion = 2; }, 'REGISTRY_ENTRY_STATE_SCHEMA_UNSUPPORTED');
  expectError(manifest => { mirrorEntry(manifest).bridgeProtocolVersion = 2; }, 'REGISTRY_ENTRY_PROTOCOL_UNSUPPORTED');
});

test('unsafe, absolute, traversal, and non-HTML files are rejected', () => {
  expectError(manifest => { manifest.trainers[0].file = 'https://mathexam.space/trainers/a.html'; }, 'REGISTRY_ENTRY_FILE_ABSOLUTE');
  expectError(manifest => { manifest.trainers[0].file = '/trainers/a.html'; }, 'REGISTRY_ENTRY_FILE_ABSOLUTE');
  expectError(manifest => { manifest.trainers[0].file = 'trainers/../a.html'; }, 'REGISTRY_ENTRY_FILE_UNSAFE');
  expectError(manifest => { manifest.trainers[0].file = 'trainers\\a.html'; }, 'REGISTRY_ENTRY_FILE_UNSAFE');
  expectError(manifest => { manifest.trainers[0].file = 'trainers/a.js'; }, 'REGISTRY_ENTRY_FILE_INVALID');
});

test('board compatibility and supportsBoardMirror must agree', () => {
  expectError(manifest => { manifest.trainers[0].supportsBoardMirror = false; }, 'REGISTRY_ENTRY_FLAGS_INCONSISTENT');
  expectError(manifest => { manifest.trainers[1].supportsBoardMirror = true; }, 'REGISTRY_ENTRY_FLAGS_INCONSISTENT');
  expectError(manifest => { manifest.trainers[1].boardCompatibility = 'unknown'; }, 'REGISTRY_ENTRY_COMPATIBILITY_INVALID');
  expectError(manifest => { manifest.trainers[1].allowLegacyHtml = true; }, 'REGISTRY_ENTRY_LEGACY_FLAG_INVALID');
});

test('catalog-only entries do not enter the mirror registry', () => {
  const result = validateTrainerManifest(currentManifest());
  assert.equal(result.ok, true);
  assert.equal(result.trainers.some(entry => entry.trainerId === 'negative-numbers'), false);
});

test('digest is deterministic across manifest and entry order', () => {
  const first = validateTrainerManifest(currentManifest());
  const reorderedManifest = currentManifest();
  reorderedManifest.trainers.reverse();
  const second = validateTrainerManifest(reorderedManifest);
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(registryDigest(1, first.trainers), registryDigest(1, second.trainers));
  assert.equal(canonicalRegistryJson(1, first.trainers), canonicalRegistryJson(1, second.trainers));
});

test('an additional synthetic mirror entry needs no registry core change', () => {
  const manifest = currentManifest();
  const synthetic = copy(mirrorEntry(manifest, 'linear-inequalities-stepwise'));
  synthetic.trainerId = 'synthetic-registry-trainer';
  synthetic.file = 'trainers/synthetic-registry-trainer.html';
  synthetic.allowLegacyHtml = false;
  manifest.trainers.push(synthetic);
  withTempManifest(JSON.stringify(manifest), file => {
    const registry = loadTrainerRegistry({ env: { TRAINER_REGISTRY_PATH: file } });
    assert.equal(registry.loaded, true);
    assert.equal(registry.entries.length, 4);
    assert.equal(registry.getById(synthetic.trainerId).file, synthetic.file);
  });
});

test('removing a mirror entry removes its runtime authorization', () => {
  const manifest = currentManifest();
  manifest.trainers = manifest.trainers.filter(entry => entry.trainerId !== 'linear-inequalities-stepwise');
  withTempManifest(JSON.stringify(manifest), file => {
    const registry = loadTrainerRegistry({ env: { TRAINER_REGISTRY_PATH: file } });
    assert.equal(registry.loaded, true);
    assert.equal(registry.entries.length, 2);
    assert.equal(registry.getById('linear-inequalities-stepwise'), null);
  });
});

test('runtime entries and public projection are immutable', () => {
  const registry = loadTrainerRegistry({ env: {} });
  assert.equal(Object.isFrozen(registry), true);
  assert.equal(Object.isFrozen(registry.entries), true);
  assert.equal(Object.isFrozen(registry.entries[0]), true);
  assert.equal(Object.isFrozen(registry.publicPayload), true);
  assert.throws(() => { registry.entries.push({}); }, TypeError);
  assert.throws(() => { registry.entries[0].trainerId = 'changed'; }, TypeError);
});

test('trainer URLs map to canonical manifest files', () => {
  const registry = loadTrainerRegistry({ env: {} });
  const values = [
    'negative-numbers-line.html',
    'trainers/negative-numbers-line.html',
    '/trainers/negative-numbers-line.html?seed=room#state',
    'https://mathexam.space/trainers/negative-numbers-line.html?seed=room'
  ];
  for (const value of values) {
    assert.equal(trainerFileFromUrl(value), 'trainers/negative-numbers-line.html');
    assert.equal(registry.getByTrainerUrl(value).trainerId, 'negative-numbers-line');
  }
  assert.equal(trainerFileFromUrl('../negative-numbers-line.html'), null);
  assert.equal(registry.getByTrainerUrl('other-trainer.html'), null);
});
