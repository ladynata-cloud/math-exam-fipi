import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { readFile, readdir, lstat, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { createRequire } from 'node:module';

const execFileAsync = promisify(execFile);
const require = createRequire(import.meta.url);
const {
  TRAINER_PATH_LIMITS,
  canonicalTrainerFile,
  validateTrainerManifest
} = require('../../board-server/trainer-registry.js');

export const TOOL_VERSION = '1.0.0';
export const CANONICAL_ORIGIN = 'https://mathexam.space';
export const DESCRIPTOR_VERSION = 1;
export const REPORT_SCHEMA_VERSION = 1;
export const DUPLICATE_STATUSES = Object.freeze([
  'CANONICAL',
  'ALIAS',
  'REDIRECT_WRAPPER',
  'ARCHIVE_COPY',
  'EXACT_DUPLICATE_APPROVED',
  'DUPLICATE_UNRESOLVED'
]);
export const PILOT_A_PATHS = Object.freeze([
  'trainers/oge-task6-fractions.html',
  'trainers/oge-task8-powers-roots.html',
  'trainers/oge-task9-equations.html',
  'trainers/oge-task20-equations.html'
]);

const REQUIRED_URL_FAMILIES = new Set([
  'input-form',
  'hostname-case',
  'port',
  'query',
  'fragment',
  'index-html',
  'trailing-slash',
  'pathname-case',
  'raw-percent',
  'encoded-separator',
  'encoded-dot-segment',
  'dot-segment',
  'duplicate-slash',
  'separator',
  'unicode-separator',
  'origin',
  'credentials',
  'scheme',
  'filesystem-form',
  'malformed',
  'unsafe-text'
]);
const EXPECTED_URL_RESULTS = new Set([
  'NORMALIZED',
  'COLLISION',
  'DISTINCT',
  'REJECT'
]);
const UNSAFE_RAW_PATH = /[\u0000-\u001f\u007f-\u009f\u061c\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff\u2044\u2215\u29f8\uff0f\uff3c]/u;
const SECRET_KEY_PATTERN = /(?:token|secret|password|passwd|api[_-]?key|authorization|cookie)/i;
const ABSOLUTE_LOCAL_PATH_PATTERN = /(?:^|[\s"'(])(?:[A-Za-z]:[\\/]|\\\\[^\\\s]+\\[^\\\s]+|\/(?:Users|home|var|tmp)\/)/;
const DESCRIPTOR_KEYS = new Set([
  'descriptorVersion',
  'inventoryId',
  'sourceKind',
  'sourceSha256',
  'sizeBytes',
  'basename',
  'trainerId',
  'canonicalPath',
  'canonicalUrl',
  'mime',
  'publishedBaseline',
  'publicationSurfaces',
  'references',
  'html',
  'dependencies',
  'runtimeCrossCheck',
  'classification',
  'provenance',
  'review',
  'duplicate',
  'risks',
  'errors',
  'unresolvedQuestions'
]);
const RUNTIME_REPEATABLE_FIELDS = Object.freeze([
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
]);

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(item => stableStringify(item)).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function uniqueSorted(values) {
  return [...new Set(values.filter(value => value !== ''))].sort();
}

function slash(value) {
  return value.split(path.sep).join('/');
}

function isPlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function splitIdentitySuffix(raw) {
  const query = raw.indexOf('?');
  const fragment = raw.indexOf('#');
  const positions = [query, fragment].filter(index => index >= 0);
  const first = positions.length ? Math.min(...positions) : raw.length;
  return { identity: raw.slice(0, first), suffix: raw.slice(first) };
}

function rawPathnameFromInput(raw) {
  const { identity } = splitIdentitySuffix(raw);
  if (!identity || identity.startsWith('//') || identity.startsWith('\\\\')) {
    return null;
  }
  const absolute = identity.match(/^([a-z][a-z\d+.-]*):\/\//i);
  if (absolute) {
    const authorityStart = absolute[0].length;
    const slashIndex = identity.indexOf('/', authorityStart);
    return slashIndex < 0 ? '/' : identity.slice(slashIndex);
  }
  if (/^[A-Za-z]:[\\/]/.test(identity) || /^[a-z][a-z\d+.-]*:/i.test(identity)) {
    return null;
  }
  if (identity.startsWith('/')) return identity;
  if (!/^[A-Za-z0-9]/.test(identity)) return null;
  return `/${identity}`;
}

function validateRawPathname(rawPathname) {
  if (
    !rawPathname
    || rawPathname.length > TRAINER_PATH_LIMITS.maxUrlLength
    || rawPathname.includes('\\')
    || rawPathname.includes('%')
    || rawPathname.includes('//')
    || UNSAFE_RAW_PATH.test(rawPathname)
    || /\s/u.test(rawPathname)
  ) {
    return false;
  }
  const components = rawPathname.split('/').slice(1);
  return !components.some(component => component === '.' || component === '..');
}

function validateDiscoveryPathname(pathname) {
  if (pathname === '/') return true;
  if (!pathname.startsWith('/') || pathname.startsWith('//')) return false;
  if (pathname.startsWith('/trainers/') && pathname.endsWith('.html')) {
    return canonicalTrainerFile(pathname.slice(1)) === pathname.slice(1);
  }
  return pathname
    .split('/')
    .slice(1)
    .every(component => !component || /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(component));
}

export function normalizePublicUrl(input) {
  if (
    typeof input !== 'string'
    || !input
    || input.length > TRAINER_PATH_LIMITS.maxUrlLength
    || input !== input.trim()
  ) {
    return { ok: false, error: 'URL_INPUT_INVALID' };
  }
  const rawPathname = rawPathnameFromInput(input);
  if (!validateRawPathname(rawPathname)) {
    return { ok: false, error: 'URL_RAW_PATH_UNSAFE' };
  }
  let parsed;
  try {
    parsed = new URL(input, `${CANONICAL_ORIGIN}/`);
  } catch {
    return { ok: false, error: 'URL_PARSE_INVALID' };
  }
  if (
    input.startsWith('//')
    || parsed.protocol !== 'https:'
    || parsed.hostname !== 'mathexam.space'
    || parsed.port
    || parsed.username
    || parsed.password
    || parsed.origin !== CANONICAL_ORIGIN
    || parsed.pathname !== rawPathname
    || !validateDiscoveryPathname(parsed.pathname)
    || (parsed.pathname.startsWith('/trainers/') && parsed.pathname.endsWith('.html/'))
  ) {
    return { ok: false, error: 'URL_CANONICAL_CONTRACT_FAILED' };
  }
  let pathname = parsed.pathname;
  if (pathname.endsWith('/index.html')) {
    pathname = pathname.slice(0, -'index.html'.length);
  }
  return {
    ok: true,
    canonicalResult: `${CANONICAL_ORIGIN}${pathname}`,
    rawPathname,
    pathname
  };
}

export function evaluateUrlVector(vector) {
  const primary = normalizePublicUrl(vector.input);
  if (!primary.ok) return { outcome: 'REJECT', primary };
  if (!Object.hasOwn(vector, 'compareTo')) {
    return {
      outcome: 'NORMALIZED',
      primary,
      canonicalResult: primary.canonicalResult
    };
  }
  const comparison = normalizePublicUrl(vector.compareTo);
  if (!comparison.ok) {
    return { outcome: 'REJECT', primary, comparison };
  }
  return {
    outcome: primary.canonicalResult === comparison.canonicalResult
      ? 'COLLISION'
      : 'DISTINCT',
    primary,
    comparison,
    canonicalResult: primary.canonicalResult,
    compareCanonicalResult: comparison.canonicalResult
  };
}

export function validateUrlFixture(fixture) {
  const failures = [];
  if (
    !isPlainObject(fixture)
    || fixture.schemaVersion !== 1
    || fixture.canonicalOrigin !== CANONICAL_ORIGIN
    || !Array.isArray(fixture.vectors)
    || fixture.vectors.length === 0
  ) {
    return { ok: false, failures: ['FIXTURE_ROOT_INVALID'], executed: 0 };
  }
  const ids = new Set();
  const families = new Set();
  let executed = 0;
  for (const vector of fixture.vectors) {
    if (
      !isPlainObject(vector)
      || typeof vector.id !== 'string'
      || !vector.id
      || ids.has(vector.id)
      || typeof vector.family !== 'string'
      || !EXPECTED_URL_RESULTS.has(vector.expected)
      || typeof vector.input !== 'string'
      || typeof vector.reason !== 'string'
      || !vector.reason
    ) {
      failures.push(`FIXTURE_VECTOR_INVALID:${vector?.id ?? 'unknown'}`);
      continue;
    }
    ids.add(vector.id);
    families.add(vector.family);
    const result = evaluateUrlVector(vector);
    executed += 1;
    if (result.outcome !== vector.expected) {
      failures.push(`FIXTURE_OUTCOME_MISMATCH:${vector.id}`);
    }
    if (
      vector.expected !== 'REJECT'
      && (
        result.canonicalResult !== vector.canonicalResult
        || (Object.hasOwn(vector, 'compareTo')
          && result.compareCanonicalResult !== vector.compareCanonicalResult)
      )
    ) {
      failures.push(`FIXTURE_CANONICAL_MISMATCH:${vector.id}`);
    }
    if (vector.expected === 'REJECT' && Object.hasOwn(vector, 'canonicalResult')) {
      failures.push(`FIXTURE_REJECT_HAS_CANONICAL:${vector.id}`);
    }
  }
  for (const family of REQUIRED_URL_FAMILIES) {
    if (!families.has(family)) failures.push(`FIXTURE_FAMILY_MISSING:${family}`);
  }
  return { ok: failures.length === 0, failures, executed };
}

function decodeHtmlText(value) {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function attributeValues(html, tagName, attributeName) {
  const values = [];
  const tagPattern = new RegExp(`<${tagName}\\b[^>]*>`, 'gi');
  for (const tagMatch of html.matchAll(tagPattern)) {
    const attributePattern = new RegExp(
      `\\b${attributeName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
      'i'
    );
    const attribute = tagMatch[0].match(attributePattern);
    if (attribute) values.push(attribute[1] ?? attribute[2] ?? attribute[3] ?? '');
  }
  return values;
}

function allReferencedValues(html) {
  return [
    ...attributeValues(html, 'a', 'href'),
    ...attributeValues(html, 'link', 'href'),
    ...attributeValues(html, 'script', 'src'),
    ...attributeValues(html, 'img', 'src'),
    ...attributeValues(html, 'source', 'src'),
    ...attributeValues(html, 'iframe', 'src'),
    ...attributeValues(html, 'audio', 'src'),
    ...attributeValues(html, 'video', 'src')
  ];
}

function assetReferencedValues(html) {
  return [
    ...attributeValues(html, 'link', 'href'),
    ...attributeValues(html, 'script', 'src'),
    ...attributeValues(html, 'img', 'src'),
    ...attributeValues(html, 'source', 'src'),
    ...attributeValues(html, 'iframe', 'src'),
    ...attributeValues(html, 'audio', 'src'),
    ...attributeValues(html, 'video', 'src')
  ];
}

function evidenceFingerprint(value) {
  return `redacted:sha256:${sha256(value).slice(0, 16)}`;
}

function sanitizedEvidenceText(value, key = '') {
  if (
    ABSOLUTE_LOCAL_PATH_PATTERN.test(value)
    || (SECRET_KEY_PATTERN.test(key) && value !== '')
    || /[?&](?:token|secret|password|api[_-]?key)=/i.test(value)
  ) {
    return evidenceFingerprint(value);
  }
  return value;
}

function classifyReference(value, canonicalPath) {
  if (!value || value.startsWith('#') || /^(?:data|blob|mailto|tel):/i.test(value)) {
    return { kind: 'ignored' };
  }
  try {
    const base = `${CANONICAL_ORIGIN}/${canonicalPath}`;
    const parsed = new URL(value, base);
    if (!['https:', 'http:'].includes(parsed.protocol)) {
      return { kind: 'unsupported', fingerprint: evidenceFingerprint(value) };
    }
    if (parsed.origin !== CANONICAL_ORIGIN) {
      return { kind: 'external', origin: parsed.origin };
    }
    return {
      kind: 'internal',
      path: parsed.pathname.startsWith('/') ? parsed.pathname.slice(1) : parsed.pathname
    };
  } catch {
    return { kind: 'malformed', fingerprint: evidenceFingerprint(value) };
  }
}

export function analyzeHtml(html, canonicalPath) {
  const titleMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const rawTitle = titleMatch ? decodeHtmlText(titleMatch[1]) : '';
  const title = sanitizedEvidenceText(rawTitle, 'title');
  const metadata = {};
  for (const meta of html.matchAll(/<meta\b[^>]*>/gi)) {
    const name = meta[0].match(/\b(?:name|property)\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i);
    const content = meta[0].match(/\bcontent\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    if (name && content) {
      const key = (name[1] ?? name[2] ?? name[3]).toLowerCase();
      metadata[key] = sanitizedEvidenceText(content[1] ?? content[2] ?? content[3], key);
    }
  }
  const referenced = allReferencedValues(html).map(value => classifyReference(value, canonicalPath));
  const assetReferenced = assetReferencedValues(html)
    .map(value => classifyReference(value, canonicalPath));
  const internalAssets = uniqueSorted(
    assetReferenced
      .filter(item => item.kind === 'internal')
      .map(item => item.path)
      .filter(item => item && item !== canonicalPath)
  );
  const malformedReferences = uniqueSorted(
    referenced
      .filter(item => item.kind === 'malformed' || item.kind === 'unsupported')
      .map(item => item.fingerprint)
  );
  const externalOrigins = uniqueSorted(
    referenced.filter(item => item.kind === 'external').map(item => item.origin)
  );
  const networkSignals = uniqueSorted([
    /\bfetch\s*\(/.test(html) ? 'fetch' : '',
    /\bXMLHttpRequest\b/.test(html) ? 'XMLHttpRequest' : '',
    /\bWebSocket\s*\(/.test(html) ? 'WebSocket' : '',
    /\bEventSource\s*\(/.test(html) ? 'EventSource' : '',
    /\bsendBeacon\s*\(/.test(html) ? 'sendBeacon' : '',
    /\baxios(?:\.|\s*\()/.test(html) ? 'axios' : ''
  ]);
  const storageSignals = uniqueSorted([
    /\blocalStorage\b/.test(html) ? 'localStorage' : '',
    /\bsessionStorage\b/.test(html) ? 'sessionStorage' : '',
    /\bindexedDB\b/.test(html) ? 'indexedDB' : '',
    /\bdocument\.cookie\b/.test(html) ? 'cookie' : ''
  ]);
  const stateSignals = uniqueSorted([
    /\bstateSchemaVersion\b/.test(html) ? 'stateSchemaVersion' : '',
    /\b(?:get|export|serialize)State\b/.test(html) ? 'state-export' : '',
    /\b(?:set|import|restore|hydrate)State\b/.test(html) ? 'state-import' : '',
    /\bCustomEvent\b/.test(html) ? 'custom-events' : ''
  ]);
  const htmlErrors = [];
  if (!/<html\b/i.test(html) || !/<\/html\s*>/i.test(html)) {
    htmlErrors.push('HTML_DOCUMENT_BOUNDARY_MISSING');
  }
  if (!title) htmlErrors.push('HTML_TITLE_MISSING');
  if (malformedReferences.length) htmlErrors.push('HTML_REFERENCE_MALFORMED');
  return {
    html: {
      title,
      metadata: Object.fromEntries(Object.entries(metadata).sort(([a], [b]) => a.localeCompare(b))),
      hasViewport: Object.hasOwn(metadata, 'viewport'),
      language: (html.match(/<html\b[^>]*\blang\s*=\s*["']?([^"'\s>]+)/i) ?? [])[1] ?? null,
      inlineScriptCount: [...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>/gi)].length,
      inlineStyleCount: [...html.matchAll(/<style\b[^>]*>/gi)].length,
      iframeCount: [...html.matchAll(/<iframe\b[^>]*>/gi)].length,
      usesRandom: /\bMath\.random\s*\(|\bcrypto\.getRandomValues\s*\(/.test(html),
      usesBridge: /\bTrainerBridge\b|trainer-bridge|MATHEXAM_TRAINER_STATE/i.test(html),
      usesPostMessage: /\bpostMessage\s*\(/.test(html),
      usesSocketIo: /socket\.io|(?:^|[^\w])io\s*\(/im.test(html),
      stateSignals
    },
    dependencies: {
      internalAssets,
      externalOrigins,
      networkSignals,
      storageSignals,
      scriptSources: uniqueSorted(
        attributeValues(html, 'script', 'src')
          .map(value => classifyReference(value, canonicalPath))
          .map(item => item.path ?? item.origin ?? item.fingerprint ?? '')
      ),
      styleSources: uniqueSorted(
        attributeValues(html, 'link', 'href')
          .map(value => classifyReference(value, canonicalPath))
          .map(item => item.path ?? item.origin ?? item.fingerprint ?? '')
      ),
      malformedReferences
    },
    errors: htmlErrors
  };
}

function runtimeFields(entry) {
  if (!entry) return {};
  return Object.fromEntries(
    RUNTIME_REPEATABLE_FIELDS
      .filter(key => Object.hasOwn(entry, key))
      .map(key => [key, entry[key]])
  );
}

export function crossCheckRuntimeDescriptor(descriptor, manifest, validation = null) {
  const checkedValidation = validation ?? validateTrainerManifest(manifest);
  if (!checkedValidation.ok) {
    return { ok: false, error: checkedValidation.error };
  }
  const expected = descriptor.runtimeCrossCheck;
  if (!isPlainObject(expected) || expected.authority !== 'cross-check-only') {
    return { ok: false, error: 'DESCRIPTOR_RUNTIME_AUTHORITY_INVALID' };
  }
  const entry = manifest.trainers.find(item => item.file === descriptor.canonicalPath) ?? null;
  if (expected.registryEntryExpected !== Boolean(entry)) {
    return { ok: false, error: 'DESCRIPTOR_RUNTIME_PRESENCE_MISMATCH' };
  }
  if (!entry) {
    return Object.keys(expected.fields ?? {}).length === 0
      ? { ok: true }
      : { ok: false, error: 'DESCRIPTOR_RUNTIME_EXTRA_FIELD' };
  }
  const actual = runtimeFields(entry);
  if (stableStringify(expected.fields) !== stableStringify(actual)) {
    return { ok: false, error: 'DESCRIPTOR_RUNTIME_FIELD_MISMATCH' };
  }
  const projected = checkedValidation.trainers.some(item => item.file === entry.file);
  if (projected !== Boolean(entry.supportsBoardMirror)) {
    return { ok: false, error: 'DESCRIPTOR_SERVER_PROJECTION_MISMATCH' };
  }
  return { ok: true };
}

export function validateDescriptorShape(descriptor) {
  if (!isPlainObject(descriptor)) return { ok: false, error: 'DESCRIPTOR_INVALID' };
  const unknown = Object.keys(descriptor).filter(key => !DESCRIPTOR_KEYS.has(key));
  const missing = [...DESCRIPTOR_KEYS].filter(key => !Object.hasOwn(descriptor, key));
  if (unknown.length) return { ok: false, error: `DESCRIPTOR_UNKNOWN:${unknown.join(',')}` };
  if (missing.length) return { ok: false, error: `DESCRIPTOR_MISSING:${missing.join(',')}` };
  if (
    descriptor.descriptorVersion !== DESCRIPTOR_VERSION
    || !/^inv-(?:repo|intake|synthetic)-[a-f0-9]{24}$/.test(descriptor.inventoryId)
    || !['repo', 'intake', 'synthetic'].includes(descriptor.sourceKind)
    || !/^[a-f0-9]{64}$/.test(descriptor.sourceSha256)
    || !Number.isInteger(descriptor.sizeBytes)
    || descriptor.sizeBytes < 0
    || !DUPLICATE_STATUSES.includes(descriptor.duplicate.status)
  ) {
    return { ok: false, error: 'DESCRIPTOR_FIELD_INVALID' };
  }
  return { ok: true };
}

async function gitFiles(repoRoot, patterns = []) {
  const args = ['ls-files', '-z'];
  if (patterns.length) args.push('--', ...patterns);
  const { stdout } = await execFileAsync('git', args, {
    cwd: repoRoot,
    encoding: 'buffer',
    windowsHide: true,
    maxBuffer: 64 * 1024 * 1024
  });
  return stdout
    .toString('utf8')
    .split('\0')
    .filter(Boolean)
    .map(value => value.replaceAll('\\', '/'))
    .sort();
}

async function walkHtml(root, relative = '') {
  const found = [];
  const directory = path.join(root, relative);
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const childRelative = relative ? path.join(relative, entry.name) : entry.name;
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) {
      found.push(...await walkHtml(root, childRelative));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) {
      found.push(slash(childRelative));
    }
  }
  return found.sort();
}

async function readCandidate(candidate) {
  if (candidate.content) return Buffer.from(candidate.content);
  const stat = await lstat(candidate.absolutePath);
  if (stat.isSymbolicLink()) throw new Error('CANDIDATE_SYMLINK_FORBIDDEN');
  if (!stat.isFile()) throw new Error('CANDIDATE_NOT_FILE');
  return readFile(candidate.absolutePath);
}

function inventoryId(sourceKind, canonicalPath) {
  return `inv-${sourceKind}-${sha256(`${sourceKind}\0${canonicalPath}`).slice(0, 24)}`;
}

function classifySource(canonicalPath, html, manifestEntry) {
  if (canonicalPath.includes('/archive-') || canonicalPath.includes('/archive/')) {
    return {
      archetype: 'archive-copy',
      proposedTrack: 'STATIC_ASSET',
      evidence: ['tracked archive path'],
      ownerApprovalRequired: true
    };
  }
  if (manifestEntry?.supportsBoardMirror) {
    return {
      archetype: 'accepted-board-mirror',
      proposedTrack: 'MIRROR_STANDARD',
      evidence: ['runtime manifest mirror entry'],
      ownerApprovalRequired: true
    };
  }
  if (manifestEntry) {
    return {
      archetype: 'standalone-board-open',
      proposedTrack: 'CATALOG_ONLY',
      evidence: ['runtime manifest opens-in-board entry'],
      ownerApprovalRequired: true
    };
  }
  if (html.usesSocketIo || html.usesBridge) {
    return {
      archetype: 'stateful-standalone-candidate',
      proposedTrack: 'NEW_ARCHETYPE',
      evidence: uniqueSorted([
        html.usesBridge ? 'Bridge signal without manifest authority' : '',
        html.usesSocketIo ? 'Socket.IO signal without manifest authority' : ''
      ]),
      ownerApprovalRequired: true
    };
  }
  return {
    archetype: 'standalone-single-file',
    proposedTrack: 'CATALOG_ONLY',
    evidence: ['single HTML entrypoint; no runtime manifest entry'],
    ownerApprovalRequired: true
  };
}

function makeRuntimeCrossCheck(entry) {
  return {
    authority: 'cross-check-only',
    registryEntryExpected: Boolean(entry),
    fields: runtimeFields(entry),
    grantsRuntimeAuthorization: false
  };
}

function emptyReferenceRecord() {
  return { sitemap: [], course: [], manual: [], site: [] };
}

function buildReferenceIndex(referenceSources) {
  const index = new Map();
  for (const source of referenceSources) {
    const values = [
      ...attributeValues(source.text, 'a', 'href'),
      ...attributeValues(source.text, 'iframe', 'src'),
      ...attributeValues(source.text, 'script', 'src'),
      ...attributeValues(source.text, 'link', 'href'),
      ...[...source.text.matchAll(/<loc>([^<]+)<\/loc>/gi)].map(match => match[1].trim())
    ];
    for (const value of values) {
      const normalized = normalizePublicUrl(value);
      if (!normalized.ok) continue;
      if (!index.has(normalized.canonicalResult)) {
        index.set(normalized.canonicalResult, emptyReferenceRecord());
      }
      const record = index.get(normalized.canonicalResult);
      const category = source.path === 'sitemap.xml'
        ? 'sitemap'
        : source.path === 'trainers/oge-course/index.html'
          ? 'course'
          : source.path.startsWith('pedagogam/') || source.path.includes('manual')
            ? 'manual'
            : 'site';
      record[category].push(source.path);
    }
  }
  for (const record of index.values()) {
    for (const category of Object.keys(record)) {
      record[category] = uniqueSorted(record[category]);
    }
  }
  return index;
}

async function collectReferenceSources(repoRoot) {
  const paths = await gitFiles(repoRoot, ['*.html', '**/*.html', '*.xml', '**/*.xml']);
  const sources = [];
  for (const relative of paths) {
    const size = (await lstat(path.join(repoRoot, ...relative.split('/')))).size;
    if (size > 2 * 1024 * 1024) continue;
    sources.push({
      path: relative,
      text: await readFile(path.join(repoRoot, ...relative.split('/')), 'utf8')
    });
  }
  return sources;
}

function candidateErrorsForMissingAssets(repoRoot, dependencies, sourceKind) {
  if (sourceKind !== 'repo') return Promise.resolve([]);
  return Promise.all(
    dependencies.internalAssets.map(async asset => {
      try {
        const stat = await lstat(path.join(repoRoot, ...asset.split('/')));
        return stat.isFile() ? '' : `ASSET_NOT_FILE:${asset}`;
      } catch {
        return `ASSET_MISSING:${asset}`;
      }
    })
  ).then(values => uniqueSorted(values));
}

function descriptorFingerprintPayload(report) {
  return {
    schemaVersion: report.schemaVersion,
    toolVersion: report.toolVersion,
    canonicalOrigin: report.canonicalOrigin,
    inputs: report.inputs,
    descriptors: report.descriptors,
    findings: report.findings,
    pilotA: report.pilotA
  };
}

export function applyDuplicateAnalysis(descriptors) {
  const groups = {
    trainerId: new Map(),
    canonicalPath: new Map(),
    caseFoldPath: new Map(),
    canonicalUrl: new Map(),
    sourceSha256: new Map(),
    basename: new Map()
  };
  function add(map, key, descriptor) {
    if (key === null || key === undefined || key === '') return;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(descriptor);
  }
  for (const descriptor of descriptors) {
    add(groups.trainerId, descriptor.trainerId, descriptor);
    add(groups.canonicalPath, descriptor.canonicalPath, descriptor);
    add(groups.caseFoldPath, descriptor.canonicalPath?.replace(/[A-Z]/g, char => char.toLowerCase()), descriptor);
    add(groups.canonicalUrl, descriptor.canonicalUrl, descriptor);
    add(groups.sourceSha256, descriptor.sourceSha256, descriptor);
    add(groups.basename, descriptor.basename, descriptor);
  }
  const blockerRecords = [];
  const basenameWarnings = [];
  const mark = (type, key, members) => {
    const paths = uniqueSorted(members.map(item => item.canonicalPath));
    blockerRecords.push({ type, key, paths });
    for (const descriptor of members) {
      descriptor.duplicate.status = 'DUPLICATE_UNRESOLVED';
      descriptor.duplicate.blockers.push(type);
      descriptor.duplicate.groupKeys.push(`${type}:${key}`);
    }
  };
  for (const [type, map] of Object.entries(groups)) {
    for (const [key, members] of map) {
      if (members.length < 2) continue;
      if (type === 'basename') {
        basenameWarnings.push({ basename: key, paths: uniqueSorted(members.map(item => item.canonicalPath)) });
      } else {
        mark(
          type === 'sourceSha256' ? 'UNRESOLVED_EXACT_BLOB_DUPLICATE' : `DUPLICATE_${type.toUpperCase()}`,
          key,
          members
        );
      }
    }
  }
  for (const descriptor of descriptors) {
    descriptor.duplicate.blockers = uniqueSorted(descriptor.duplicate.blockers);
    descriptor.duplicate.groupKeys = uniqueSorted(descriptor.duplicate.groupKeys);
  }
  return {
    blockers: blockerRecords.sort((a, b) => `${a.type}:${a.key}`.localeCompare(`${b.type}:${b.key}`)),
    basenameWarnings: basenameWarnings.sort((a, b) => a.basename.localeCompare(b.basename))
  };
}

export async function inventoryCandidates(options) {
  const {
    repoRoot,
    candidates,
    manifest,
    referenceSources = [],
    previousReport = null,
    includeRunMetadata = true
  } = options;
  const startNs = process.hrtime.bigint();
  const startRss = process.memoryUsage().rss;
  const validation = validateTrainerManifest(manifest);
  if (!validation.ok) throw new Error(`RUNTIME_MANIFEST_INVALID:${validation.error}`);
  const manifestByFile = new Map(manifest.trainers.map(entry => [entry.file, entry]));
  const referenceIndex = buildReferenceIndex(referenceSources);
  const previousByPath = new Map(
    (previousReport?.descriptors ?? []).map(descriptor => [descriptor.canonicalPath, descriptor])
  );
  const descriptors = [];
  let incrementalReused = 0;
  for (const candidate of [...candidates].sort((a, b) => a.canonicalPath.localeCompare(b.canonicalPath))) {
    const errors = [];
    let bytes;
    try {
      bytes = await readCandidate(candidate);
    } catch (error) {
      bytes = Buffer.alloc(0);
      errors.push(error.message);
    }
    const sourceSha256 = sha256(bytes);
    const previous = previousByPath.get(candidate.canonicalPath);
    let analysis;
    if (previous?.sourceSha256 === sourceSha256) {
      analysis = {
        html: previous.html,
        dependencies: previous.dependencies,
        errors: Array.isArray(previous.errors)
          ? previous.errors.filter(
              item => typeof item === 'string' && item.startsWith('HTML_')
            )
          : []
      };
      incrementalReused += 1;
    } else {
      analysis = analyzeHtml(bytes.toString('utf8'), candidate.canonicalPath);
    }
    errors.push(...analysis.errors);
    errors.push(...await candidateErrorsForMissingAssets(repoRoot, analysis.dependencies, candidate.sourceKind));
    const normalized = normalizePublicUrl(`/${candidate.canonicalPath}`);
    if (!normalized.ok) errors.push(`CANONICAL_URL_INVALID:${normalized.error}`);
    const canonicalUrl = normalized.ok ? normalized.canonicalResult : null;
    const references = canonicalUrl
      ? referenceIndex.get(canonicalUrl) ?? emptyReferenceRecord()
      : emptyReferenceRecord();
    const manifestEntry = manifestByFile.get(candidate.canonicalPath) ?? null;
    const surfaces = {
      FILE_PUBLISHED: candidate.sourceKind === 'repo',
      SITE_DISCOVERY: Object.values(references).some(items => items.length > 0),
      BOARD_DISCOVERY: Boolean(manifestEntry),
      BOARD_MIRROR: Boolean(manifestEntry?.supportsBoardMirror)
    };
    const classification = classifySource(candidate.canonicalPath, analysis.html, manifestEntry);
    const descriptor = {
      descriptorVersion: DESCRIPTOR_VERSION,
      inventoryId: inventoryId(candidate.sourceKind, candidate.canonicalPath),
      sourceKind: candidate.sourceKind,
      sourceSha256,
      sizeBytes: bytes.length,
      basename: path.posix.basename(candidate.canonicalPath),
      trainerId: manifestEntry?.trainerId ?? null,
      canonicalPath: candidate.canonicalPath,
      canonicalUrl,
      mime: 'text/html',
      publishedBaseline: Object.values(surfaces).some(Boolean),
      publicationSurfaces: surfaces,
      references,
      html: analysis.html,
      dependencies: analysis.dependencies,
      runtimeCrossCheck: makeRuntimeCrossCheck(manifestEntry),
      classification,
      provenance: {
        status: candidate.sourceKind === 'repo'
          ? 'REPOSITORY_TRACKED_UNVERIFIED'
          : 'UNVERIFIED',
        usageAuthority: 'PENDING_OWNER_CONFIRMATION',
        sourceLocationDisclosed: false
      },
      review: {
        pedagogical: 'PENDING_OWNER_REVIEW',
        standaloneDesktop: 'NOT_RUN',
        standaloneMobile: 'NOT_RUN',
        iframeManualUrl: 'NOT_RUN',
        consoleErrors: 'NOT_RUN',
        pageErrors: 'NOT_RUN'
      },
      duplicate: {
        status: candidate.canonicalPath.includes('/archive-') || candidate.canonicalPath.includes('/archive/')
          ? 'ARCHIVE_COPY'
          : 'CANONICAL',
        blockers: [],
        groupKeys: [],
        authorizationUsesBasename: false
      },
      risks: uniqueSorted([
        classification.proposedTrack === 'NEW_ARCHETYPE' ? 'ARCHETYPE_ESCALATION_REQUIRED' : '',
        analysis.dependencies.externalOrigins.length ? 'EXTERNAL_ORIGIN_REVIEW_REQUIRED' : '',
        analysis.dependencies.networkSignals.length ? 'NETWORK_REVIEW_REQUIRED' : '',
        analysis.dependencies.storageSignals.length ? 'STORAGE_ISOLATION_REVIEW_REQUIRED' : ''
      ]),
      errors: uniqueSorted(errors),
      unresolvedQuestions: [
        'PROVENANCE_AND_USAGE_AUTHORITY',
        'PEDAGOGICAL_OWNER_ACCEPTANCE',
        'MOBILE_AND_IFRAME_ACCEPTANCE',
        'OWNER_PUBLICATION_SURFACE_DECISION'
      ]
    };
    const shape = validateDescriptorShape(descriptor);
    if (!shape.ok) descriptor.errors.push(shape.error);
    const crossCheck = crossCheckRuntimeDescriptor(descriptor, manifest, validation);
    if (!crossCheck.ok) descriptor.errors.push(crossCheck.error);
    descriptor.errors = uniqueSorted(descriptor.errors);
    descriptors.push(descriptor);
  }
  const duplicate = applyDuplicateAnalysis(descriptors);
  const inputEntries = descriptors.map(descriptor => ({
    canonicalPath: descriptor.canonicalPath,
    sha256: descriptor.sourceSha256,
    sizeBytes: descriptor.sizeBytes
  }));
  const pilotA = PILOT_A_PATHS.map(pilotPath => {
    const descriptor = descriptors.find(item => item.canonicalPath === pilotPath);
    return descriptor
      ? {
          canonicalPath: pilotPath,
          inventoryId: descriptor.inventoryId,
          sourceSha256: descriptor.sourceSha256,
          sizeBytes: descriptor.sizeBytes,
          canonicalUrl: descriptor.canonicalUrl,
          sitemapReferenced: descriptor.references.sitemap.includes('sitemap.xml'),
          courseReferenced: descriptor.references.course.includes('trainers/oge-course/index.html'),
          manifestEntry: descriptor.runtimeCrossCheck.registryEntryExpected,
          publicationSurfaces: descriptor.publicationSurfaces,
          archetype: descriptor.classification.archetype,
          proposedTrack: descriptor.classification.proposedTrack,
          duplicateStatus: descriptor.duplicate.status,
          unresolvedReview: descriptor.review
        }
      : { canonicalPath: pilotPath, error: 'PILOT_CANDIDATE_MISSING' };
  });
  const counts = {
    candidates: descriptors.length,
    descriptorsWithErrors: descriptors.filter(item => item.errors.length).length,
    releaseBlockers: duplicate.blockers.length,
    basenameWarnings: duplicate.basenameWarnings.length
  };
  const report = {
    schemaVersion: REPORT_SCHEMA_VERSION,
    toolVersion: TOOL_VERSION,
    canonicalOrigin: CANONICAL_ORIGIN,
    inputs: {
      manifestSha256: sha256(stableStringify(manifest)),
      candidateSetSha256: sha256(stableStringify(inputEntries)),
      candidates: inputEntries
    },
    descriptors,
    findings: {
      counts,
      blockers: duplicate.blockers,
      basenameWarnings: duplicate.basenameWarnings
    },
    pilotA
  };
  report.deterministicFingerprint = sha256(stableStringify(descriptorFingerprintPayload(report)));
  if (includeRunMetadata) {
    report.run = {
      completedAt: new Date().toISOString(),
      durationMs: Number(process.hrtime.bigint() - startNs) / 1e6,
      rssDeltaBytes: process.memoryUsage().rss - startRss,
      incrementalReused,
      outboundRequests: 0
    };
  }
  return report;
}

export async function collectRepositoryInputs(repoRoot, options = {}) {
  const trackedTrainerHtml = (await gitFiles(repoRoot, ['trainers/*.html', 'trainers/**/*.html']))
    .filter(relative => relative.endsWith('.html'));
  const candidates = trackedTrainerHtml.map(canonicalPath => ({
    sourceKind: 'repo',
    canonicalPath,
    absolutePath: path.join(repoRoot, ...canonicalPath.split('/'))
  }));
  if (options.intakeRoot) {
    const intakeFiles = await walkHtml(options.intakeRoot);
    for (const relative of intakeFiles) {
      const proposed = `trainers/intake/${relative}`;
      candidates.push({
        sourceKind: 'intake',
        canonicalPath: proposed,
        absolutePath: path.join(options.intakeRoot, ...relative.split('/'))
      });
    }
  }
  const manifestPath = path.join(repoRoot, 'trainers', 'board-compat.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const referenceSources = await collectReferenceSources(repoRoot);
  return { candidates, manifest, referenceSources };
}

export function generateSyntheticCandidates(count = 5000) {
  return Array.from({ length: count }, (_value, index) => {
    const serial = String(index).padStart(5, '0');
    const canonicalPath = `trainers/synthetic/cohort-${serial}.html`;
    return {
      sourceKind: 'synthetic',
      canonicalPath,
      content: Buffer.from(
        `<!doctype html><html lang="ru"><head><meta name="viewport" content="width=device-width"><title>Synthetic ${serial}</title></head><body data-id="${serial}"></body></html>`,
        'utf8'
      )
    };
  });
}

function humanSummary(report) {
  return [
    '# Trainer inventory summary',
    '',
    `- Tool version: \`${report.toolVersion}\``,
    `- Deterministic fingerprint: \`${report.deterministicFingerprint}\``,
    `- Candidates: ${report.findings.counts.candidates}`,
    `- Candidate errors: ${report.findings.counts.descriptorsWithErrors}`,
    `- Release blockers reported: ${report.findings.counts.releaseBlockers}`,
    `- Same-basename warnings: ${report.findings.counts.basenameWarnings}`,
    `- Incremental analyses reused: ${report.run?.incrementalReused ?? 0}`,
    '',
    'Inventory is evidence only. Owner approval is still required for track,',
    'public URL, discovery surfaces, batch membership, provenance, and release.',
    ''
  ].join('\n');
}

function sanitizedHandoff(report) {
  return {
    schemaVersion: report.schemaVersion,
    toolVersion: report.toolVersion,
    deterministicFingerprint: report.deterministicFingerprint,
    counts: report.findings.counts,
    blockers: report.findings.blockers,
    pilotA: report.pilotA,
    containsFileContents: false,
    containsCredentials: false,
    containsAbsoluteLocalPaths: false,
    publicationAuthorized: false
  };
}

export function scanSanitizedValue(value) {
  const serialized = JSON.stringify(value);
  const secretKeys = [];
  const visit = (current, trail = []) => {
    if (Array.isArray(current)) {
      current.forEach((item, index) => visit(item, [...trail, String(index)]));
    } else if (isPlainObject(current)) {
      for (const [key, child] of Object.entries(current)) {
        if (SECRET_KEY_PATTERN.test(key) && child !== false && child !== null) {
          secretKeys.push([...trail, key].join('.'));
        }
        visit(child, [...trail, key]);
      }
    }
  };
  visit(value);
  return {
    ok: secretKeys.length === 0 && !ABSOLUTE_LOCAL_PATH_PATTERN.test(serialized),
    secretKeys,
    absoluteLocalPathFound: ABSOLUTE_LOCAL_PATH_PATTERN.test(serialized)
  };
}

export async function writeInventoryOutputs(outputDir, report) {
  const handoff = sanitizedHandoff(report);
  const sanitized = scanSanitizedValue(handoff);
  if (!sanitized.ok) throw new Error('SANITIZED_HANDOFF_FAILED');
  await mkdir(outputDir, { recursive: true });
  await writeFile(
    path.join(outputDir, 'inventory.json'),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  await writeFile(path.join(outputDir, 'summary.md'), humanSummary(report), 'utf8');
  await writeFile(
    path.join(outputDir, 'sanitized-handoff.json'),
    `${JSON.stringify(handoff, null, 2)}\n`,
    'utf8'
  );
}

export async function loadPreviousReport(outputDir) {
  try {
    return JSON.parse(await readFile(path.join(outputDir, 'inventory.json'), 'utf8'));
  } catch {
    return null;
  }
}

export async function runRepositoryInventory(options) {
  const inputs = await collectRepositoryInputs(options.repoRoot, {
    intakeRoot: options.intakeRoot
  });
  const previousReport = options.previousReport
    ?? (options.outputDir ? await loadPreviousReport(options.outputDir) : null);
  return inventoryCandidates({
    repoRoot: options.repoRoot,
    ...inputs,
    previousReport,
    includeRunMetadata: options.includeRunMetadata !== false
  });
}
