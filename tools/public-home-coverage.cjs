'use strict';

// Public learning pages must expose one shared home-return mechanism. Enumerate
// the tracked source rather than the older navigator rollout manifest, so a new
// course cannot silently escape the check. No HTML or manifest is written here.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://mathexam.space';
const PUBLIC_ROOTS = new Set([
  'articles', 'azbuka-postroeniy-reviewed', 'courses', 'ege-baza', 'ege-profil', 'ege-profile',
  'equations', 'foundations', 'geometry-course', 'geometry-merzlyak',
  'geometry-pogorelov', 'ggb', 'grade7', 'laboratory', 'learning', 'lessons', 'metod-racionalizacii', 'oge', 'pedagogam', 'school',
  'soviet-math', 'stereo-course', 'topics', 'trainers', 'trainings', 'video-lessons', 'vpr'
]);
const EXCLUDED = new Map([
  ['index.html', 'The destination homepage itself.'],
  ['index-old.html', 'Archived former homepage, not a course or trainer.'],
  ['courses/vilenkin-5-part-1/offline.html', 'Download/offline edition; preserve its standalone packaging.'],
  ['courses/vilenkin-6-part-1/offline.html', 'Download/offline edition; preserve its standalone packaging.'],
  ['ege-baza/sources/index.html', 'Source and coverage report, not a learner activity.'],
  ['oge/skills/app-fragment.html', 'Source fragment assembled into the covered skill course, not a standalone page.'],
  ['trainers/fipi-ege-informatics-task1-report.html', 'Source-import report, not an interactive trainer.'],
  ['trainers/fipi-oge-informatics-report.html', 'Source-import report, not an interactive trainer.'],
  ['trainers/testing-hub.html', 'Internal testing inventory, not a public course.'],
  ['video-lessons/studio.html', 'Authoring studio, not a published course.']
]);

function exclusion(name, html) {
  if (EXCLUDED.has(name)) return EXCLUDED.get(name);
  if (/^yandex_[a-z0-9]+\.html$|^google[a-z0-9]+\.html$/i.test(name)) return 'Search-provider verification file.';
  if (name.includes('/') && !PUBLIC_ROOTS.has(name.split('/')[0])) return 'Outside public course/trainer roots (including immutable book/b, downloads, backend, docs, assets and private workspaces).';
  if (/(?:^|\/)(?:archive[^/]*|drafts|src|fixtures?|tests?)(?:\/|$)/i.test(name)) return 'Archived, source-only, draft or test fixture directory.';
  if (!html.trim()) return 'Empty placeholder; becomes subject to coverage when content is added.';
  return null;
}

function attributes(tag) {
  const result = {};
  for (const m of tag.matchAll(/([a-z][\w:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi)) result[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4];
  return result;
}

function uncomment(html) {
  return html.replace(/<!--[\s\S]*?-->/g, '').replace(/<(?:template|noscript)\b[^>]*>[\s\S]*?<\/(?:template|noscript)\s*>/gi, '');
}

function hasHomeBundle(name, html) {
  for (const tag of uncomment(html).match(/<script\b[^>]*>/gi) || []) {
    const a = attributes(tag);
    if (!a.src || (a.type && !/^(?:module|(?:text|application)\/javascript)$/i.test(a.type))) continue;
    try {
      const u = new URL(a.src, SITE + '/' + name);
      if (u.origin === SITE && ['/assets/assistant/home-link.js', '/assets/assistant/navigator-widget.js'].includes(u.pathname)) return true;
    } catch (_) { /* A malformed source cannot count as executable coverage. */ }
  }
  return false;
}

function hasDirectHome(name, html) {
  const expected = name.startsWith('learning/') ? SITE + '/' : '/';
  return (uncomment(html).match(/<a\b[^>]*>/gi) || []).some(tag => {
    if (!/\sdata-mathexam-home-link(?:\s|=|>)/i.test(tag)) return false;
    const a = attributes(tag);
    return a.href === expected && a.target === '_self';
  });
}

function hasHomeReturn(name, html) {
  return hasDirectHome(name, html) || (!name.startsWith('learning/') && hasHomeBundle(name, html));
}

function redirectDestination(name, html) {
  for (const tag of uncomment(html).match(/<meta\b[^>]*>/gi) || []) {
    const a = attributes(tag);
    if (a['http-equiv']?.toLowerCase() !== 'refresh') continue;
    const m = /^\s*\d+(?:\.\d+)?\s*;\s*url\s*=\s*([\s\S]+)$/i.exec(a.content || '');
    if (!m) continue;
    const target = m[1].trim().replace(/^(["'])(.*)\1$/, '$2').replace(/&amp;/g, '&');
    return new URL(target, SITE + '/' + name);
  }
  return null;
}

function inventory(root = ROOT) {
  const files = execFileSync('git', ['ls-files', '-z', '--', '*.html'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean).sort();
  const eligible = [], excluded = [];
  for (const name of files) {
    const html = fs.readFileSync(path.join(root, name), 'utf8');
    const reason = exclusion(name, html);
    if (reason) excluded.push({ path: name, reason });
    else eligible.push(name);
  }
  return { files, eligible, excluded };
}

function checkCoverage(root = ROOT) {
  const listed = inventory(root), tracked = new Set(listed.files), eligible = new Set(listed.eligible);
  const covered = [], redirects = [], uncovered = [], failures = [];
  function resolve(name, chain = []) {
    if (chain.includes(name)) throw Error('Redirect cycle: ' + [...chain, name].join(' -> '));
    if (!tracked.has(name)) throw Error('Missing redirect target: ' + name);
    if (name === 'index.html') return name;
    if (!eligible.has(name)) throw Error('Redirect escapes eligible learning pages: ' + name);
    const html = fs.readFileSync(path.join(root, name), 'utf8');
    const next = redirectDestination(name, html);
    if (next) {
      if (next.origin !== SITE) throw Error('External redirect is not covered: ' + next.href);
      let dest = decodeURIComponent(next.pathname).replace(/^\//, '');
      if (!dest || dest.endsWith('/')) dest += 'index.html';
      return resolve(dest, [...chain, name]);
    }
    if (!hasHomeReturn(name, html)) throw Error('Missing home return: ' + name);
    return name;
  }
  for (const name of listed.eligible) {
    const html = fs.readFileSync(path.join(root, name), 'utf8');
    let redirect = null;
    try {
      redirect = redirectDestination(name, html);
      const target = resolve(name);
      if (redirect) redirects.push({ path: name, target });
      else covered.push(name);
    } catch (error) {
      if (!redirect && !hasHomeReturn(name, html)) uncovered.push(name);
      failures.push({ path: name, message: error.message });
    }
  }
  return { eligible: listed.eligible, covered, redirects, excluded: listed.excluded, uncovered, failures };
}

module.exports = { ROOT, PUBLIC_ROOTS, EXCLUDED, exclusion, attributes, hasHomeBundle, hasDirectHome, redirectDestination, inventory, checkCoverage };

if (require.main === module) {
  const report = checkCoverage();
  if (process.argv.includes('--list')) console.log(JSON.stringify(report, null, 2));
  else console.log(JSON.stringify({ eligible: report.eligible.length, covered: report.covered.length, redirects: report.redirects.length, excluded: report.excluded.length, uncovered: report.uncovered, failures: report.failures }, null, 2));
  process.exitCode = report.failures.length ? 1 : 0;
}
