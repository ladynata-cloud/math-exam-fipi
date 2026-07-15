'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const REGISTRY_SCHEMA_VERSION = 1;
const SUPPORTED_STATE_SCHEMA_VERSIONS = new Set([1]);
const SUPPORTED_BRIDGE_PROTOCOL_VERSIONS = new Set([1]);
const BOARD_COMPATIBILITY_VALUES = new Set([
  'opens-in-board',
  'seed-ready',
  'board-mirror'
]);
const TRAINER_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TRAINER_VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const TRAINER_PATH_LIMITS = Object.freeze({
  maxComponents: 8,
  maxComponentLength: 64,
  maxTotalLength: 96,
  maxUrlLength: 2048
});
const TRAINER_COMPONENT_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const WINDOWS_RESERVED_STEMS = new Set([
  'CON',
  'PRN',
  'AUX',
  'NUL',
  ...Array.from({ length: 9 }, (_value, index) => `COM${index + 1}`),
  ...Array.from({ length: 9 }, (_value, index) => `LPT${index + 1}`)
]);
const UNSAFE_PATH_TEXT_PATTERN = /[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069\u2044\u2215\u29f8\uff0f\uff3c]/u;

function isPlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function validationFailure(error) {
  return { ok: false, error };
}

function canonicalMirrorEntry(entry) {
  return {
    trainerId: entry.trainerId,
    file: entry.file,
    version: entry.version,
    stateSchemaVersion: entry.stateSchemaVersion,
    bridgeProtocolVersion: entry.bridgeProtocolVersion,
    allowLegacyHtml: entry.allowLegacyHtml
  };
}

function compareTrainerIds(left, right) {
  if (left.trainerId < right.trainerId) return -1;
  if (left.trainerId > right.trainerId) return 1;
  return 0;
}

function canonicalRegistryJson(schemaVersion, trainers) {
  const canonicalTrainers = trainers
    .map(canonicalMirrorEntry)
    .sort(compareTrainerIds);
  return JSON.stringify({ schemaVersion, trainers: canonicalTrainers });
}

function registryDigest(schemaVersion, trainers) {
  return `sha256:${crypto
    .createHash('sha256')
    .update(canonicalRegistryJson(schemaVersion, trainers), 'utf8')
    .digest('hex')}`;
}

function trainerFileComponents(file) {
  if (typeof file !== 'string' || !file || file !== file.trim()) return null;
  if (file.length > TRAINER_PATH_LIMITS.maxTotalLength) return null;
  if (!file.startsWith('trainers/')) return null;
  const components = file.slice('trainers/'.length).split('/');
  if (
    components.length < 1
    || components.length > TRAINER_PATH_LIMITS.maxComponents
  ) {
    return null;
  }
  for (const component of components) {
    if (
      !component
      || component.length > TRAINER_PATH_LIMITS.maxComponentLength
      || component === '.'
      || component === '..'
      || component.endsWith('.')
      || !TRAINER_COMPONENT_PATTERN.test(component)
      || WINDOWS_RESERVED_STEMS.has(component.split('.', 1)[0].toUpperCase())
    ) {
      return null;
    }
  }
  if (!components.at(-1).endsWith('.html')) return null;
  return components;
}

function canonicalTrainerFile(file) {
  return trainerFileComponents(file) ? file : null;
}

function validateTrainerFile(file) {
  if (typeof file !== 'string' || !file || file !== file.trim()) {
    return 'REGISTRY_ENTRY_FILE_INVALID';
  }
  if (
    path.posix.isAbsolute(file)
    || path.win32.isAbsolute(file)
    || /^[a-z][a-z\d+.-]*:/i.test(file)
  ) {
    return 'REGISTRY_ENTRY_FILE_ABSOLUTE';
  }
  if (
    file.includes('\\')
    || file.includes('?')
    || file.includes('#')
    || file.includes('%')
    || file.split('/').some(component => component === '.' || component === '..')
    || UNSAFE_PATH_TEXT_PATTERN.test(file)
  ) {
    return 'REGISTRY_ENTRY_FILE_UNSAFE';
  }
  return canonicalTrainerFile(file) ? '' : 'REGISTRY_ENTRY_FILE_INVALID';
}

function validateTrainerManifest(manifest) {
  if (!isPlainObject(manifest)) return validationFailure('REGISTRY_ROOT_INVALID');
  if (!Number.isInteger(manifest.schemaVersion)) {
    return validationFailure('REGISTRY_SCHEMA_REQUIRED');
  }
  if (manifest.schemaVersion !== REGISTRY_SCHEMA_VERSION) {
    return validationFailure('REGISTRY_SCHEMA_UNSUPPORTED');
  }
  if (
    Object.prototype.hasOwnProperty.call(manifest, 'version')
    && manifest.version !== manifest.schemaVersion
  ) {
    return validationFailure('REGISTRY_VERSION_MISMATCH');
  }
  if (!Array.isArray(manifest.trainers)) {
    return validationFailure('REGISTRY_TRAINERS_INVALID');
  }

  const trainerIds = new Set();
  const files = new Set();
  const caseFoldedFiles = new Set();
  const mirrorTrainers = [];

  for (const entry of manifest.trainers) {
    if (!isPlainObject(entry)) return validationFailure('REGISTRY_ENTRY_INVALID');
    if (
      typeof entry.trainerId !== 'string'
      || !TRAINER_ID_PATTERN.test(entry.trainerId)
      || typeof entry.title !== 'string'
      || !entry.title.trim()
      || typeof entry.group !== 'string'
      || !entry.group.trim()
      || typeof entry.boardCompatibility !== 'string'
      || typeof entry.supportsBoardMirror !== 'boolean'
    ) {
      return validationFailure('REGISTRY_ENTRY_MISSING_FIELD');
    }
    if (!BOARD_COMPATIBILITY_VALUES.has(entry.boardCompatibility)) {
      return validationFailure('REGISTRY_ENTRY_COMPATIBILITY_INVALID');
    }
    const fileError = validateTrainerFile(entry.file);
    if (fileError) return validationFailure(fileError);
    if (trainerIds.has(entry.trainerId)) {
      return validationFailure('REGISTRY_DUPLICATE_TRAINER_ID');
    }
    if (files.has(entry.file)) return validationFailure('REGISTRY_DUPLICATE_FILE');
    const caseFoldedFile = entry.file.toLowerCase();
    if (caseFoldedFiles.has(caseFoldedFile)) {
      return validationFailure('REGISTRY_DUPLICATE_FILE_CASEFOLD');
    }
    trainerIds.add(entry.trainerId);
    files.add(entry.file);
    caseFoldedFiles.add(caseFoldedFile);

    const isMirror = entry.boardCompatibility === 'board-mirror';
    if (entry.supportsBoardMirror !== isMirror) {
      return validationFailure('REGISTRY_ENTRY_FLAGS_INCONSISTENT');
    }
    if (!isMirror) {
      if (
        Object.prototype.hasOwnProperty.call(entry, 'allowLegacyHtml')
        && entry.allowLegacyHtml !== false
      ) {
        return validationFailure('REGISTRY_ENTRY_LEGACY_FLAG_INVALID');
      }
      continue;
    }

    if (typeof entry.version !== 'string' || !TRAINER_VERSION_PATTERN.test(entry.version)) {
      return validationFailure('REGISTRY_ENTRY_VERSION_INVALID');
    }
    if (!SUPPORTED_STATE_SCHEMA_VERSIONS.has(entry.stateSchemaVersion)) {
      return validationFailure('REGISTRY_ENTRY_STATE_SCHEMA_UNSUPPORTED');
    }
    if (!SUPPORTED_BRIDGE_PROTOCOL_VERSIONS.has(entry.bridgeProtocolVersion)) {
      return validationFailure('REGISTRY_ENTRY_PROTOCOL_UNSUPPORTED');
    }
    if (typeof entry.allowLegacyHtml !== 'boolean') {
      return validationFailure('REGISTRY_ENTRY_LEGACY_FLAG_INVALID');
    }
    mirrorTrainers.push(canonicalMirrorEntry(entry));
  }

  return {
    ok: true,
    schemaVersion: manifest.schemaVersion,
    trainers: mirrorTrainers
  };
}

function rawPathnameFromUrlInput(raw) {
  if (raw.startsWith('//')) return null;
  const absoluteMatch = raw.match(/^([a-z][a-z\d+.-]*):\/\//i);
  if (absoluteMatch) {
    if (!/^https?$/i.test(absoluteMatch[1])) return null;
    const authorityStart = absoluteMatch[0].length;
    const delimiterOffset = raw.slice(authorityStart).search(/[\/?#]/);
    if (delimiterOffset < 0) return '/';
    const delimiterIndex = authorityStart + delimiterOffset;
    return raw[delimiterIndex] === '/'
      ? raw.slice(delimiterIndex).split(/[?#]/, 1)[0]
      : '/';
  }
  if (/^[a-z][a-z\d+.-]*:/i.test(raw)) return null;
  return raw.split(/[?#]/, 1)[0];
}

function trainerFileFromUrl(value, options = {}) {
  if (typeof value !== 'string' || !value || value.length > TRAINER_PATH_LIMITS.maxUrlLength) {
    return null;
  }
  const raw = value.trim();
  if (!raw) return null;
  const rawPathname = rawPathnameFromUrlInput(raw);
  if (
    !rawPathname
    || rawPathname.includes('\\')
    || rawPathname.includes('%')
    || UNSAFE_PATH_TEXT_PATTERN.test(rawPathname)
  ) {
    return null;
  }

  const suffix = raw.slice(rawPathname.length);
  const isAbsoluteUrl = /^https?:\/\//i.test(raw);
  let normalized = raw;
  let preparseFile = null;
  if (isAbsoluteUrl) {
    preparseFile = rawPathname.startsWith('/') ? rawPathname.slice(1) : '';
  } else if (rawPathname.startsWith('/trainers/')) {
    preparseFile = rawPathname.slice(1);
  } else if (rawPathname.startsWith('trainers/')) {
    preparseFile = rawPathname;
    normalized = `/${raw}`;
  } else if (!rawPathname.includes('/')) {
    preparseFile = `trainers/${rawPathname}`;
    normalized = `/trainers/${rawPathname}${suffix}`;
  }
  if (!canonicalTrainerFile(preparseFile)) return null;

  const origin = typeof options.origin === 'string' && options.origin
    ? options.origin
    : 'https://mathexam.space';
  try {
    const base = new URL('/trainers/trainer-board.html', origin);
    const url = new URL(normalized, base);
    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== base.origin) return null;
    if (!url.pathname.startsWith('/') || url.pathname.startsWith('//')) return null;
    const file = url.pathname.slice(1);
    return canonicalTrainerFile(file);
  } catch (_error) {
    return null;
  }
}

function freezeEntry(entry) {
  return Object.freeze(canonicalMirrorEntry(entry));
}

function createRuntimeRegistry({ source, schemaVersion, trainers }) {
  const entries = Object.freeze(
    trainers
      .map(freezeEntry)
      .sort(compareTrainerIds)
  );
  const byId = new Map(entries.map(entry => [entry.trainerId, entry]));
  const byFile = new Map(entries.map(entry => [entry.file, entry]));
  const digest = registryDigest(schemaVersion, entries);
  const publicPayload = Object.freeze({ schemaVersion, digest, trainers: entries });

  return Object.freeze({
    loaded: true,
    schemaVersion,
    digest,
    source,
    error: null,
    entries,
    publicPayload,
    getById(trainerId) {
      return byId.get(trainerId) || null;
    },
    getByFile(file) {
      return byFile.get(file) || null;
    },
    getByTrainerUrl(value) {
      const file = trainerFileFromUrl(value);
      return file ? byFile.get(file) || null : null;
    }
  });
}

function createUnavailableRegistry(source, error) {
  const entries = Object.freeze([]);
  return Object.freeze({
    loaded: false,
    schemaVersion: REGISTRY_SCHEMA_VERSION,
    digest: null,
    source,
    error,
    entries,
    publicPayload: Object.freeze({
      schemaVersion: REGISTRY_SCHEMA_VERSION,
      digest: null,
      trainers: entries,
      error
    }),
    getById() {
      return null;
    },
    getByFile() {
      return null;
    },
    getByTrainerUrl() {
      return null;
    }
  });
}

function loadTrainerRegistry(options = {}) {
  const env = options.env || process.env;
  const baseDir = options.baseDir || __dirname;
  const configuredPath = typeof env.TRAINER_REGISTRY_PATH === 'string'
    ? env.TRAINER_REGISTRY_PATH.trim()
    : '';
  const source = configuredPath ? 'env' : 'bundled-default';
  const registryPath = configuredPath
    ? path.resolve(baseDir, configuredPath)
    : path.resolve(baseDir, '../trainers/board-compat.json');

  let raw;
  try {
    raw = fs.readFileSync(registryPath, 'utf8');
  } catch (error) {
    const code = error && error.code === 'ENOENT'
      ? 'REGISTRY_FILE_MISSING'
      : 'REGISTRY_FILE_UNREADABLE';
    return createUnavailableRegistry(source, code);
  }

  let manifest;
  try {
    manifest = JSON.parse(raw);
  } catch (_error) {
    return createUnavailableRegistry(source, 'REGISTRY_JSON_INVALID');
  }

  const validation = validateTrainerManifest(manifest);
  if (!validation.ok) return createUnavailableRegistry(source, validation.error);
  return createRuntimeRegistry({
    source,
    schemaVersion: validation.schemaVersion,
    trainers: validation.trainers
  });
}

module.exports = Object.freeze({
  REGISTRY_SCHEMA_VERSION,
  TRAINER_PATH_LIMITS,
  canonicalTrainerFile,
  canonicalRegistryJson,
  loadTrainerRegistry,
  registryDigest,
  trainerFileFromUrl,
  validateTrainerManifest
});
