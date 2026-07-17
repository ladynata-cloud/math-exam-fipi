import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
  PILOT_A_PATHS,
  analyzeHtml,
  applyDuplicateAnalysis,
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
    sha256: '24f7b404bc944fa9a528d50a3b76ece0c4526afb66eed3b96453fd94965fcd03',
    sizeBytes: 82390
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
    canonicalPath,
    content: Buffer.from(
      `<!doctype html><html lang="ru"><head><title>${canonicalPath}</title></head><body>${body}</body></html>`,
      'utf8'
    )
  };
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
      candidates: [{
        sourceKind: 'repo',
        canonicalPath: 'trainers/malformed.html',
        content: Buffer.from('<html><head><title>Broken</title></head><body><img src="missing.png">')
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

test('an unreadable candidate is reported without aborting the cohort', async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'trainer-inventory-error-'));
  try {
    const report = await inventoryCandidates({
      repoRoot: temporary,
      candidates: [
        syntheticCandidate('trainers/good.html'),
        {
          sourceKind: 'repo',
          canonicalPath: 'trainers/missing.html',
          absolutePath: path.join(temporary, 'does-not-exist.html')
        }
      ],
      manifest: emptyManifest,
      includeRunMetadata: false
    });
    assert.equal(report.descriptors.length, 2);
    assert.ok(report.descriptors.find(item => item.canonicalPath === 'trainers/missing.html').errors.length > 0);
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
  assert.ok(inputs.candidates.every(item => item.canonicalPath.startsWith('trainers/')));
  assert.ok(inputs.candidates.every(item => !item.canonicalPath.includes('\\')));
});

test('Pilot A reconciles exact hashes, references, surfaces, and pending reviews', async () => {
  const report = await fullReport();
  assert.deepEqual(report.pilotA.map(item => item.canonicalPath), PILOT_A_PATHS);
  for (const pilot of report.pilotA) {
    const expected = pilotExpected[pilot.canonicalPath];
    assert.equal(pilot.sourceSha256, expected.sha256, pilot.canonicalPath);
    assert.equal(pilot.sizeBytes, expected.sizeBytes, pilot.canonicalPath);
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

  const cliSource = await readFile(
    path.join(repoRoot, 'tools', 'trainer-inventory', 'cli.mjs'),
    'utf8'
  );
  const gateSource = await readFile(
    path.join(repoRoot, 'tools', 'trainer-inventory', 'gate.mjs'),
    'utf8'
  );
  assert.doesNotMatch(cliSource, /TRAINER_FACTORY_INVENTORY_V1_GATE_OK/);
  assert.match(gateSource, /TRAINER_FACTORY_INVENTORY_V1_GATE_OK/);
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
  const allowed = allChanged.filter(relative => (
    relative === '.gitignore'
    || relative === '.agents/skills/trainer-inventory/SKILL.md'
    || relative === 'docs/TRAINER_INVENTORY_FORMAT.md'
    || relative === 'docs/tasks/TRAINER_FACTORY_INVENTORY_V1.md'
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
