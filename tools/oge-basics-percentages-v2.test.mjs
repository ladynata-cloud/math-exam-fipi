import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const moduleRoot = path.join(repoRoot, 'trainers', 'oge-basics', 'percentages');
const fixturePath = path.join(
  repoRoot,
  'tools',
  'fixtures',
  'oge-basics-percentages-v2-sha256.json'
);
const sourceFixPath = path.join(
  repoRoot,
  'tools',
  'fixtures',
  'oge-basics-percentages-v2-source-fix.json'
);
const validationRoot = path.join(
  repoRoot,
  'tools',
  'fixtures',
  'oge-basics-percentages-v2-validation'
);
const manifestPath = path.join(repoRoot, 'trainers', 'board-compat.json');
const baseSha = '41f38657f7e72cc65d24ad275a4330ceccc55d0a';
const origin = 'https://mathexam.space';

const expectedEntries = [
  {
    trainerId: 'oge-basics-percentages-map',
    file: 'trainers/oge-basics/percentages/index.html',
    title: 'Математическая база: проценты и пропорции'
  },
  {
    trainerId: 'oge-basics-percent-meaning',
    file: 'trainers/oge-basics/percentages/percent-meaning.html',
    title: 'Проценты: 100%, 1% и доля'
  },
  {
    trainerId: 'oge-basics-percent-parts',
    file: 'trainers/oge-basics/percentages/percent-of-number-and-whole.html',
    title: 'Проценты: три вопроса'
  },
  {
    trainerId: 'oge-basics-percent-choose',
    file: 'trainers/oge-basics/percentages/percent-choose-question.html',
    title: 'Проценты: что спрашивают в задаче'
  },
  {
    trainerId: 'oge-basics-percent-change',
    file: 'trainers/oge-basics/percentages/percent-change.html',
    title: 'Проценты: увеличение и уменьшение'
  },
  {
    trainerId: 'oge-basics-proportion',
    file: 'trainers/oge-basics/percentages/proportion.html',
    title: 'Пропорция как общий способ'
  },
  {
    trainerId: 'oge-basics-percent-final',
    file: 'trainers/oge-basics/percentages/percent-final-checkpoint.html',
    title: 'Проценты: итоговая проверка'
  }
];

function sha256(file) {
  return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function repoPath(file) {
  return path.relative(repoRoot, file).replaceAll(path.sep, '/');
}

function canonicalUrl(file) {
  const pathname = file.endsWith('/index.html')
    ? `/${file.slice(0, -'index.html'.length)}`
    : `/${file}`;
  return `${origin}${pathname}`;
}

function gitShow(file) {
  return execFileSync(
    'git',
    ['-c', `safe.directory=${repoRoot}`, 'show', `${baseSha}:${file}`],
    { cwd: repoRoot, encoding: 'utf8' }
  );
}

function uniqueCaseFold(values, label) {
  const seen = new Map();
  for (const value of values) {
    const key = value.toLowerCase();
    assert.equal(seen.has(key), false, `${label}: ${seen.get(key)} / ${value}`);
    seen.set(key, value);
  }
}

function resolveReference(sourceFile, rawReference) {
  const reference = rawReference.replaceAll('&amp;', '&').split(/[?#]/, 1)[0];
  if (!reference || reference.startsWith('#')) return null;
  let target = reference.startsWith('/')
    ? path.join(repoRoot, ...reference.slice(1).split('/'))
    : path.resolve(path.dirname(sourceFile), reference);
  if (reference.endsWith('/') || (fs.existsSync(target) && fs.statSync(target).isDirectory())) {
    target = path.join(target, 'index.html');
  }
  return target;
}

function sitemapLocations(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
}

const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
const sourceFix = JSON.parse(fs.readFileSync(sourceFixPath, 'utf8'));
const expectedFiles = fixture.files.map(item => item.path);
const trainerFiles = expectedFiles.filter(file => !file.endsWith('/index.html'));

test('canonical fixture contains all seven pages and exact corrected hashes', () => {
  assert.equal(fixture.schemaVersion, 1);
  assert.equal(fixture.sourcePackage, 'percentages-proportions-v2-for-codex.zip');
  assert.equal(
    fixture.sourcePackageSha256,
    '195b5a668743ce1872bde3f6b8f201582f66b317bf60f5869a58dddd237eb0fa'
  );
  assert.equal(fixture.expectedHtmlCount, 7);
  assert.equal(fixture.files.length, 7);
  assert.equal(new Set(expectedFiles).size, 7);
  for (const item of fixture.files) {
    assert.match(item.path, /^trainers\/oge-basics\/percentages\/[^/]+\.html$/);
    assert.match(item.sha256, /^[0-9a-f]{64}$/);
    assert.equal(sha256(path.join(repoRoot, item.path)), item.sha256, item.path);
  }
  assert.equal(
    fixture.files.find(item => item.path.endsWith('/index.html')).sourceIdentity,
    'original'
  );
  assert.deepEqual(
    fs.readdirSync(moduleRoot).filter(name => name.endsWith('.html')).sort(),
    expectedFiles.map(file => path.posix.basename(file)).sort()
  );
});

test('old/new provenance covers exactly the six idempotence corrections', () => {
  assert.equal(sourceFix.schemaVersion, 1);
  assert.equal(sourceFix.sourcePackage, fixture.sourcePackage);
  assert.equal(sourceFix.fix, 'idempotent-review-guard');
  assert.equal(sourceFix.files.length, 6);
  assert.deepEqual(
    sourceFix.files.map(item => item.path).sort(),
    [...trainerFiles].sort()
  );
  const canonical = new Map(fixture.files.map(item => [item.path, item.sha256]));
  for (const item of sourceFix.files) {
    assert.match(item.originalSha256, /^[0-9a-f]{64}$/);
    assert.match(item.correctedSha256, /^[0-9a-f]{64}$/);
    assert.notEqual(item.originalSha256, item.correctedSha256);
    assert.equal(item.changedLines, 2);
    assert.equal(item.onlyIdempotentReviewGuard, true);
    assert.equal(item.correctedSha256, canonical.get(item.path));
    assert.equal(sha256(path.join(repoRoot, item.path)), item.correctedSha256);
  }
});

test('full-review counter is idempotent per task and supported answers remain supported', () => {
  for (const file of trainerFiles) {
    const html = fs.readFileSync(path.join(repoRoot, file), 'utf8');
    assert.match(
      html,
      /function showSolution\(\)\{if\(solved\)return;solved=true;state\.reviewed=\(state\.reviewed\|\|0\)\+1;/
    );
    assert.equal(
      (html.match(/state\.reviewed=\(state\.reviewed\|\|0\)\+1/g) ?? []).length,
      1,
      file
    );
    assert.match(
      html,
      /\$\('p-check'\)\.disabled=false;\$\('p-next'\)\.disabled=false;renderStats\(\);renderChips\(\)\}/
    );
    assert.match(html, /const solo=tries===1&&!hint&&!solved;/);
    assert.match(
      html,
      /task=norm\(makeTask\(key\)\);task\.skill=key;tries=0;hint=0;solved=false;done=false;/
    );
    assert.match(html, /reviewed:0,bestCheck:0,lastCheck:null/);
    const hintBody = html.match(/function showHint\(n\)\{([\s\S]*?)\nfunction showSolution/)?.[1];
    assert.ok(hintBody, file);
    assert.doesNotMatch(hintBody, /reviewed/, file);
    assert.match(
      html,
      /else\{state\.supported\[task\.skill\]\+\+;state\.streak\[task\.skill\]=0\}/
    );
  }
});

test('HTML structure, inline JavaScript, links, and security scans pass', () => {
  let scripts = 0;
  for (const file of expectedFiles) {
    const absolute = path.join(repoRoot, file);
    const html = fs.readFileSync(absolute, 'utf8');
    assert.match(html, /^\s*<!doctype html>/i, file);
    assert.match(html, /<title>[\s\S]+?<\/title>/i, file);
    assert.match(html, /<meta\s+name="viewport"/i, file);
    assert.match(html, /<\/html>\s*$/i, file);
    assert.doesNotMatch(
      html,
      /(?:token|password|passwd|api[_-]?key|secret)\s*[:=]\s*["'][^"']+["']/i,
      file
    );
    assert.doesNotMatch(
      html,
      /(?:[A-Za-z]:[\\/](?:Users|home)[\\/]|file:\/\/|\/Users\/|\/home\/)/i,
      file
    );
    assert.doesNotMatch(html, /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/u, file);
    assert.doesNotMatch(html, /[\u200b-\u200f\u202a-\u202e\u2060\u2066-\u2069\ufeff]/u, file);
    assert.doesNotMatch(html, /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(/, file);
    assert.doesNotMatch(html, /\b(?:TrainerBridge|postMessage|socket\.io)\b/i, file);
    assert.doesNotMatch(html, /\b(?:href|src)=["']https?:\/\//i, file);
    for (const match of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)) {
      if (/\bsrc\s*=/i.test(match[1])) continue;
      new vm.Script(match[2], { filename: file });
      scripts += 1;
    }
    for (const match of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)) {
      const reference = match[1];
      if (/^(?:#|data:|mailto:|tel:|javascript:|https?:)/i.test(reference)) continue;
      const target = resolveReference(absolute, reference);
      assert.ok(target?.startsWith(`${repoRoot}${path.sep}`), `${file}: ${reference}`);
      assert.equal(fs.existsSync(target), true, `${file}: ${reference} -> ${repoPath(target)}`);
    }
  }
  assert.equal(scripts, 7);
});

test('topic IDs and storage keys are isolated while the shared progress key is stable', () => {
  const topicIds = [];
  const ownKeys = [];
  for (const file of trainerFiles) {
    const html = fs.readFileSync(path.join(repoRoot, file), 'utf8');
    const topic = html.match(/const TOPIC='([^']+)'/)?.[1];
    const ownKey = html.match(/const OWN_KEY='([^']+)'/)?.[1];
    assert.ok(topic, file);
    assert.ok(ownKey, file);
    assert.match(html, /const MAP_KEY='mathExamCourseProgress\.v1';/);
    topicIds.push(topic);
    ownKeys.push(ownKey);
  }
  uniqueCaseFold(topicIds, 'topicId collision');
  uniqueCaseFold(ownKeys, 'storage key collision');
  uniqueCaseFold(expectedFiles, 'canonical path collision');
  uniqueCaseFold(expectedFiles.map(canonicalUrl), 'canonical URL collision');
});

test('independent mathematical validation reproduces 288,000 tasks with zero findings', () => {
  const output = execFileSync(process.execPath, ['verify.js'], {
    cwd: validationRoot,
    encoding: 'utf8',
    timeout: 120_000
  });
  assert.match(output, /сгенерировано и проверено задач:\s*288000/);
  assert.match(output, /замечаний нет/);
});

test('parent map, catalog, OGE section, and sitemap expose exactly the approved module', () => {
  const parent = fs.readFileSync(path.join(repoRoot, 'trainers', 'oge-basics', 'index.html'), 'utf8');
  const catalog = fs.readFileSync(path.join(repoRoot, 'trainers', 'index.html'), 'utf8');
  const oge = fs.readFileSync(path.join(repoRoot, 'oge', 'index.html'), 'utf8');
  const sitemap = fs.readFileSync(path.join(repoRoot, 'sitemap.xml'), 'utf8');

  assert.match(parent, /href="#percentages">Проценты<\/a>/);
  assert.match(parent, /id="percentages"[\s\S]*?Проценты и пропорции/);
  assert.match(parent, /href="percentages\/index\.html"/);
  assert.match(
    parent,
    /href="\.\.\/oge-1-5-trainers\/percent-table-trainer\.html"[^>]*>Дополнительная смешанная практика/
  );
  assert.equal((catalog.match(/\.\/oge-basics\/percentages\//g) ?? []).length, 1);
  assert.equal(
    (oge.match(/href="\.\.\/trainers\/oge-basics\/percentages\/"/g) ?? []).length,
    1
  );

  assert.match(sitemap, /^<\?xml[^>]+>\s*<urlset\b[\s\S]*<\/urlset>\s*$/);
  const locations = sitemapLocations(sitemap);
  uniqueCaseFold(locations, 'sitemap collision');
  for (const url of expectedFiles.map(canonicalUrl)) {
    assert.equal(locations.filter(item => item === url).length, 1, url);
  }
  assert.equal(
    locations.filter(url => url.startsWith(`${origin}/trainers/oge-basics/percentages/`)).length,
    7
  );
  assert.equal(
    locations.some(url => url.endsWith('/trainers/oge-basics/percentages/index.html')),
    false
  );
});

test('board discovery is exactly seven catalog-only entries and baseline records are preserved', () => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const baseline = JSON.parse(gitShow('trainers/board-compat.json'));
  for (const entry of baseline.trainers) {
    assert.deepEqual(
      manifest.trainers.find(item => item.trainerId === entry.trainerId),
      entry,
      entry.trainerId
    );
  }
  const actual = manifest.trainers.filter(entry =>
    entry.file.startsWith('trainers/oge-basics/percentages/')
  );
  assert.equal(actual.length, 7);
  assert.deepEqual(
    actual.map(({ trainerId, file, title }) => ({ trainerId, file, title })),
    expectedEntries
  );
  for (const entry of actual) {
    assert.equal(entry.group, 'Математическая база / проценты');
    assert.equal(entry.boardCompatibility, 'opens-in-board');
    assert.equal(entry.supportsSeed, false);
    assert.equal(entry.supportsBoardMirror, false);
    assert.equal(entry.supportsSemanticEvents, false);
    for (const field of ['version', 'stateSchemaVersion', 'bridgeProtocolVersion', 'allowLegacyHtml']) {
      assert.equal(Object.hasOwn(entry, field), false, `${entry.trainerId}: ${field}`);
    }
  }
  assert.equal(manifest.trainers.length, baseline.trainers.length + 7);
  assert.equal(manifest.trainers.filter(entry => entry.supportsBoardMirror).length, 3);
  uniqueCaseFold(manifest.trainers.map(entry => entry.trainerId), 'trainerId collision');
  uniqueCaseFold(manifest.trainers.map(entry => entry.file), 'manifest path collision');
});

test('server, board, Bridge, protocol, and deployment implementation are unchanged', () => {
  const protectedDiff = execFileSync(
    'git',
    [
      '-c',
      `safe.directory=${repoRoot}`,
      'diff',
      '--name-only',
      baseSha,
      '--',
      'board-server/index.js',
      'board-server/trainer-registry.js',
      'trainers/trainer-board.html',
      'trainers/board-bridge.js',
      'deploy',
      'amvera.yml',
      'render.yaml',
      'Dockerfile'
    ],
    { cwd: repoRoot, encoding: 'utf8' }
  ).trim();
  assert.equal(protectedDiff, '');
});
