'use strict';
// Read-only publication gate. Never change pupil data or turn a mismatch into PASS.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ORIGIN = 'https://mathexam.space';
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

function buildManifest(root, routes) {
  const entries = new Map();
  const add = (href, relativeTo = ORIGIN + '/') => {
    const url = new URL(href.replaceAll('&amp;', '&'), relativeTo);
    if (url.origin !== ORIGIN) return;
    url.hash = '';
    let file = decodeURIComponent(url.pathname).replace(/^\/+/, '');
    if (!file || file.endsWith('/')) file += 'index.html';
    const absolute = path.resolve(root, file);
    if (!absolute.startsWith(path.resolve(root) + path.sep)) throw Error('Unsafe release path: ' + file);
    const bytes = fs.readFileSync(absolute); // Missing local evidence is a failure.
    entries.set(url.href, {url: url.href, file, sha256: hash(bytes)});
  };
  const pages = new Set([
    ...routes.pages, 'ege-baza/index.html', 'foundations/index.html',
    'trainers/oge-course/index.html', 'trainers/oge-basics/index.html',
    ...Object.values(routes.courseParents || {}).map(parent => parent.href.replace(/^\//, ''))
  ]);
  for (let file of pages) {
    if (file.endsWith('/')) file += 'index.html';
    const url = new URL(file, ORIGIN + '/');
    add(url.href);
    // The browser uses both explicit index.html URLs and directory returns.
    if (file.endsWith('index.html')) add(file.slice(0, -10));
    const html = fs.readFileSync(path.join(root, file), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
    for (const match of html.matchAll(/<(script|link)\b[^>]*>/gi)) {
      const tag = match[0];
      const attributes = new Map();
      for (const item of tag.matchAll(/\s+([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
        const key = item[1].toLowerCase();
        if (!attributes.has(key)) attributes.set(key, item[2] ?? item[3] ?? item[4] ?? '');
      }
      const attr = name => attributes.get(name);
      if (match[1].toLowerCase() === 'script') {
        const src = attr('src');
        if (src) add(src, url.href);
      } else if (/^(?:stylesheet|modulepreload)$/i.test(attr('rel') || '')) {
        const href = attr('href');
        if (href) add(href, url.href);
      }
    }
  }
  add('/assets/oge-wayfinding.js');
  add('/assets/oge-wayfinding.css');
  return [...entries.values()].sort((a, b) => a.url.localeCompare(b.url));
}

async function checkManifest(entries, fetchImpl = fetch, signal) {
  const failures = [];
  let next = 0;
  const worker = async () => {
    while (next < entries.length) {
      const entry = entries[next++];
      try {
        signal?.throwIfAborted();
        // Use the browser's actual query string, not a different cache-busting URL.
        const timeout = AbortSignal.timeout(15000);
        const response = await fetchImpl(entry.url, {cache: 'no-store', signal: signal ? AbortSignal.any([signal, timeout]) : timeout});
        if (!response.ok) throw Error('HTTP ' + response.status);
        if (response.url && new URL(response.url).origin !== ORIGIN) throw Error('Cross-origin redirect');
        if (hash(Buffer.from(await response.arrayBuffer())) !== entry.sha256) throw Error('content mismatch');
      } catch (error) {
        failures.push({url: entry.url, reason: error.message});
      }
    }
  };
  await Promise.all(Array.from({length: Math.min(8, entries.length)}, worker));
  return failures.sort((a, b) => a.url.localeCompare(b.url));
}

async function waitForRelease(entries, {fetchImpl = fetch, attempts = 30, delayMs = 15000,
  sleep = ms => new Promise(resolve => setTimeout(resolve, ms)), onAttempt = () => {},
  signal = AbortSignal.timeout(8 * 60 * 1000)} = {}) {
  if (!entries.length || !Number.isInteger(attempts) || attempts < 1) throw Error('Invalid publication gate input');
  let failures;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    signal.throwIfAborted();
    failures = await checkManifest(entries, fetchImpl, signal);
    onAttempt({attempt, failures});
    if (!failures.length) return;
    signal.throwIfAborted();
    if (attempt < attempts) await sleep(delayMs);
  }
  throw Error('Published release mismatch: ' + failures.map(item => item.url + ' (' + item.reason + ')').join(', '));
}

async function main() {
  const sha = process.env.OGE_ENTRY_RELEASE_SHA;
  if (!/^[0-9a-f]{40}$/.test(sha || '')) throw Error('An exact deployed commit SHA is required');
  const root = path.resolve(__dirname, '..');
  const manifest = buildManifest(root, require('./oge-learner-routes.json'));
  const out = path.resolve(process.env.OGE_ENTRY_ARTIFACTS || path.join(root, 'artifacts/oge-learner-entry'));
  fs.mkdirSync(out, {recursive: true});
  const phase = process.env.OGE_ENTRY_VERIFY_ONCE === '1' ? 'after-browser' : 'before-browser';
  const report = {sha, phase, status: 'WAITING', resources: manifest.length, attempts: []};
  try {
    await waitForRelease(manifest, {
      attempts: phase === 'after-browser' ? 1 : 30,
      onAttempt: result => {
        report.attempts.push({...result, checkedAt: new Date().toISOString()});
        console.log('Release ' + sha + ': ' + result.failures.length + '/' + manifest.length + ' mismatches');
        for (const failure of result.failures.slice(0, 12)) console.log(failure.url + ': ' + failure.reason);
      }
    });
    report.status = 'PASS';
    console.log('OGE_LEARNER_RELEASE_MATCH_OK ' + sha);
  } catch (error) {
    report.status = 'FAIL';
    throw error;
  } finally {
    fs.writeFileSync(path.join(out, 'release-' + phase + '.json'), JSON.stringify(report, null, 2) + '\n');
  }
}
if (require.main === module) main().catch(error => {console.error(error); process.exitCode = 1;});
module.exports = {buildManifest, checkManifest, waitForRelease, hash};
