import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const batchRoot = path.join(repoRoot, 'trainers', 'oge-basics');
const fixturePath = path.join(
  repoRoot,
  'tools',
  'fixtures',
  'oge-mathematical-likbez-v2-sha256.json'
);
const normalizationFixturePath = path.join(
  repoRoot,
  'tools',
  'fixtures',
  'oge-mathematical-likbez-v2-whitespace-normalization.json'
);
const manifestPath = path.join(repoRoot, 'trainers', 'board-compat.json');
const sitemapPath = path.join(repoRoot, 'sitemap.xml');
const baseSha = '452f4658da04990fd31d73e35c499e86c16cd180';
const origin = 'https://mathexam.space';
const expectedBoardFiles = [
  'trainers/oge-basics/index.html',
  'trainers/oge-basics/multiplication-division/index.html',
  'trainers/oge-basics/multiplication-division/long-division-from-simple-to-decimals.html',
  'trainers/oge-basics/multiplication-division/long-division-mixed-checkpoint.html'
];

function walkFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(target) : [target];
  });
}

function repoPath(file) {
  return path.relative(repoRoot, file).replaceAll(path.sep, '/');
}

function sha256(file) {
  return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function canonicalUrl(file) {
  let pathname = `/${file}`;
  if (pathname.endsWith('/index.html')) pathname = pathname.slice(0, -'index.html'.length);
  return `${origin}${pathname}`;
}

function effectiveMetadata(html) {
  const source = html.match(/\bconst\s+(?:SPEC|CONFIG)\s*=\s*(\{[^\r\n]+\});/)?.[1];
  return source ? JSON.parse(source) : null;
}

function effectiveTitle(html) {
  const metadataTitle = effectiveMetadata(html)?.title;
  if (metadataTitle) return metadataTitle;
  return html.match(/<title>([\s\S]*?)<\/title>/i)?.[1].trim() ?? '';
}

function uniqueCaseFold(values, label) {
  const seen = new Map();
  for (const value of values) {
    const key = value.toLowerCase();
    assert.equal(seen.has(key), false, `${label} collision: ${seen.get(key)} / ${value}`);
    seen.set(key, value);
  }
}

function gitShow(file) {
  return execFileSync(
    'git',
    ['-c', `safe.directory=${repoRoot}`, 'show', `${baseSha}:${file}`],
    { cwd: repoRoot, encoding: 'utf8' }
  );
}

function sitemapLocations(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
}

function resolveInternalReference(sourceFile, rawReference) {
  const reference = rawReference.replaceAll('&amp;', '&').split(/[?#]/, 1)[0];
  if (!reference) return null;
  let target = reference.startsWith('/')
    ? path.join(repoRoot, ...reference.slice(1).split('/'))
    : path.resolve(path.dirname(sourceFile), reference);
  if (reference.endsWith('/') || (fs.existsSync(target) && fs.statSync(target).isDirectory())) {
    target = path.join(target, 'index.html');
  }
  return target;
}

const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
const normalizationFixture = JSON.parse(
  fs.readFileSync(normalizationFixturePath, 'utf8')
);
const expectedFiles = fixture.files.map(item => item.path);

test('repository fixture is complete and every canonical HTML blob matches SHA-256', () => {
  assert.equal(fixture.schemaVersion, 1);
  assert.equal(fixture.sourcePackage, 'mathexam-oge-basics-v2-for-codex.zip');
  assert.equal(fixture.expectedHtmlCount, 31);
  assert.equal(fixture.files.length, 31);
  assert.equal(new Set(expectedFiles).size, 31);
  for (const item of fixture.files) {
    assert.match(item.path, /^trainers\/oge-basics\/.+\.html$/);
    assert.match(item.sha256, /^[0-9a-f]{64}$/);
    assert.equal(sha256(path.join(repoRoot, item.path)), item.sha256, item.path);
  }
  const actualFiles = walkFiles(batchRoot)
    .filter(file => path.extname(file).toLowerCase() === '.html')
    .map(repoPath)
    .sort();
  assert.deepEqual(actualFiles, [...expectedFiles].sort());
});

test('source provenance records only the approved EOL-whitespace normalization', () => {
  assert.equal(normalizationFixture.schemaVersion, 1);
  assert.equal(normalizationFixture.sourcePackage, fixture.sourcePackage);
  assert.equal(
    normalizationFixture.oldReviewedHead,
    'ce192d21d3236232650f257c4fbcc24f4b3d3e0d'
  );
  assert.equal(
    normalizationFixture.normalization,
    'trailing-eol-ascii-whitespace-only'
  );
  assert.equal(normalizationFixture.files.length, 19);
  assert.equal(
    new Set(normalizationFixture.files.map(item => item.path)).size,
    normalizationFixture.files.length
  );

  const canonicalShaByPath = new Map(
    fixture.files.map(item => [item.path, item.sha256])
  );
  for (const item of normalizationFixture.files) {
    assert.equal(canonicalShaByPath.has(item.path), true, item.path);
    assert.match(item.oldSha256, /^[0-9a-f]{64}$/);
    assert.match(item.newSha256, /^[0-9a-f]{64}$/);
    assert.notEqual(item.oldSha256, item.newSha256);
    assert.equal(item.changedLines, 1);
    assert.equal(item.removedAsciiSpaces, 2);
    assert.equal(item.eolWhitespaceOnly, true);
    assert.equal(canonicalShaByPath.get(item.path), item.newSha256, item.path);
    assert.equal(sha256(path.join(repoRoot, item.path)), item.newSha256, item.path);
    assert.doesNotMatch(
      fs.readFileSync(path.join(repoRoot, item.path), 'utf8'),
      /[ \t]+(?:\r?\n|$)/,
      item.path
    );
  }
});

test('paths, public URLs, effective titles, topic IDs, and owned storage keys are unique', () => {
  uniqueCaseFold(expectedFiles, 'canonical path');
  uniqueCaseFold(expectedFiles.map(canonicalUrl), 'canonical public URL');

  const titles = [];
  const topicIds = [];
  const storageKeys = [];
  for (const file of expectedFiles) {
    const html = fs.readFileSync(path.join(repoRoot, file), 'utf8');
    const title = effectiveTitle(html);
    assert.ok(title, `effective title: ${file}`);
    titles.push(title);
    const metadata = effectiveMetadata(html);
    if (!metadata) continue;
    assert.equal(typeof metadata.topicId, 'string', `topicId: ${file}`);
    assert.equal(typeof metadata.storageKey, 'string', `storageKey: ${file}`);
    topicIds.push(metadata.topicId);
    storageKeys.push(metadata.storageKey);
  }
  assert.equal(topicIds.length, 29);
  assert.equal(storageKeys.length, 29);
  uniqueCaseFold(titles, 'effective title');
  uniqueCaseFold(topicIds, 'topicId');
  uniqueCaseFold(storageKeys, 'trainer-owned localStorage key');

  const allTrainerFiles = walkFiles(path.join(repoRoot, 'trainers'))
    .filter(file => path.extname(file).toLowerCase() === '.html')
    .map(repoPath);
  uniqueCaseFold(allTrainerFiles, 'repository trainer path');
});

test('every relative link and asset reference resolves inside the repository', () => {
  for (const file of expectedFiles) {
    const absolute = path.join(repoRoot, file);
    const html = fs.readFileSync(absolute, 'utf8');
    const references = [...html.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)]
      .map(match => match[1]);
    for (const reference of references) {
      if (
        reference.startsWith('#')
        || /^(?:data:|mailto:|tel:|javascript:|https?:)/i.test(reference)
      ) {
        continue;
      }
      const target = resolveInternalReference(absolute, reference);
      assert.ok(target?.startsWith(`${repoRoot}${path.sep}`), `${file}: ${reference}`);
      assert.equal(fs.existsSync(target), true, `${file}: ${reference} -> ${repoPath(target)}`);
    }
  }
});

test('inline JavaScript parses and trainer sources pass security and sanitization scans', () => {
  let inlineScripts = 0;
  for (const file of expectedFiles) {
    const html = fs.readFileSync(path.join(repoRoot, file), 'utf8');
    assert.doesNotMatch(
      html,
      /(?:token|password|passwd|api[_-]?key|secret)\s*[:=]\s*["'][^"']+["']/i,
      file
    );
    assert.doesNotMatch(html, /(?:[A-Za-z]:[\\/](?:Users|home)[\\/]|file:\/\/|\/Users\/|\/home\/)/i, file);
    assert.doesNotMatch(html, /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/u, file);
    assert.doesNotMatch(html, /[\u202a-\u202e\u2066-\u2069]/u, file);
    assert.doesNotMatch(html, /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(/, file);
    assert.doesNotMatch(html, /\b(?:TrainerBridge|postMessage|socket\.io)\b/i, file);
    assert.doesNotMatch(html, /\b(?:href|src)=["']https?:\/\//i, file);
    for (const match of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)) {
      if (/\bsrc\s*=/i.test(match[1])) continue;
      new vm.Script(match[2], { filename: file });
      inlineScripts += 1;
    }
  }
  assert.equal(inlineScripts, 30);
});

test('site discovery and sitemap expose the approved collection without URL collisions', () => {
  const course = fs.readFileSync(path.join(repoRoot, 'trainers', 'oge-course', 'index.html'), 'utf8');
  const catalog = fs.readFileSync(path.join(repoRoot, 'trainers', 'index.html'), 'utf8');
  const oge = fs.readFileSync(path.join(repoRoot, 'oge', 'index.html'), 'utf8');
  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  const approvedTitle = 'Математическая база для ОГЭ: ликбез без пробелов';
  const approvedCopy = 'Короткие маршруты по арифметике, дробям, отрицательным числам, округлению, единицам, умножению и делению.';
  assert.ok(course.includes(approvedTitle));
  assert.ok(course.includes(approvedCopy));
  assert.ok(course.indexOf('/trainers/oge-basics/') < course.indexOf('/trainers/arifmetika.html'));
  assert.ok(catalog.includes('./oge-basics/'));
  assert.ok(oge.includes('../trainers/oge-basics/'));

  assert.match(sitemap, /^<\?xml[^>]+>\s*<urlset\b[\s\S]*<\/urlset>\s*$/);
  const locations = sitemapLocations(sitemap);
  assert.equal((sitemap.match(/<url>/g) ?? []).length, (sitemap.match(/<\/url>/g) ?? []).length);
  assert.equal(locations.length, (sitemap.match(/<loc>/g) ?? []).length);
  uniqueCaseFold(locations.map(url => new URL(url).href), 'sitemap URL');
  const batchLocations = locations.filter(url => url.startsWith(`${origin}/trainers/oge-basics/`));
  assert.deepEqual([...batchLocations].sort(), expectedFiles.map(canonicalUrl).sort());

  const baselineLocations = sitemapLocations(gitShow('sitemap.xml'));
  for (const location of baselineLocations) {
    assert.ok(locations.includes(location), `pre-existing sitemap URL: ${location}`);
  }
});

test('board quick-select has exactly four iframe-only entries and preserves the baseline', () => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const baseline = JSON.parse(gitShow('trainers/board-compat.json'));
  for (const baselineEntry of baseline.trainers) {
    assert.deepEqual(
      manifest.trainers.find(entry => entry.trainerId === baselineEntry.trainerId),
      baselineEntry,
      `pre-existing manifest entry: ${baselineEntry.trainerId}`
    );
  }
  const entries = manifest.trainers.filter(entry => entry.file.startsWith('trainers/oge-basics/'));
  assert.deepEqual(entries.map(entry => entry.file), expectedBoardFiles);
  assert.equal(entries.length, 4);
  for (const entry of entries) {
    assert.equal(entry.group, 'ОГЭ / математическая база');
    assert.equal(entry.boardCompatibility, 'opens-in-board');
    assert.equal(entry.supportsSeed, false);
    assert.equal(entry.supportsBoardMirror, false);
    assert.equal(entry.supportsSemanticEvents, false);
    assert.equal(Object.hasOwn(entry, 'stateSchemaVersion'), false);
    assert.equal(Object.hasOwn(entry, 'bridgeProtocolVersion'), false);
  }
  assert.equal(manifest.trainers.filter(entry => entry.supportsBoardMirror).length, 3);
  assert.equal(manifest.trainers.length, 21);
});

test('publication artifacts contain no basename authorization or unexpected child manifest record', () => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const batchManifestFiles = manifest.trainers
    .filter(entry => entry.file.startsWith('trainers/oge-basics/'))
    .map(entry => entry.file);
  assert.deepEqual(batchManifestFiles, expectedBoardFiles);
  for (const entry of manifest.trainers) {
    assert.ok(entry.file.includes('/'), entry.trainerId);
    assert.equal(entry.file, path.posix.normalize(entry.file), entry.trainerId);
  }
  const registryImplementationDiff = execFileSync(
    'git',
    [
      '-c',
      `safe.directory=${repoRoot}`,
      'diff',
      '--name-only',
      baseSha,
      '--',
      'board-server/trainer-registry.js',
      'board-server/index.js',
      'trainers/trainer-board.html'
    ],
    { cwd: repoRoot, encoding: 'utf8' }
  ).trim();
  assert.equal(registryImplementationDiff, '');
});
