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
const TRAINER_FILE_PATTERN = /^trainers\/[A-Za-z0-9][A-Za-z0-9._-]*\.html$/;

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

function validateTrainerFile(file) {
  if (typeof file !== 'string' || !file) return 'REGISTRY_ENTRY_FILE_INVALID';
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
    || file.split('/').includes('..')
  ) {
    return 'REGISTRY_ENTRY_FILE_UNSAFE';
  }
  return TRAINER_FILE_PATTERN.test(file) ? '' : 'REGISTRY_ENTRY_FILE_INVALID';
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
    trainerIds.add(entry.trainerId);
    files.add(entry.file);

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

function trainerFileFromUrl(value) {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return null;
  let normalized = raw;
  if (!/^[a-z][a-z\d+.-]*:\/\//i.test(raw)) {
    if (raw.startsWith('trainers/')) normalized = `/${raw}`;
    else if (!raw.startsWith('/') && !raw.includes('/')) normalized = `/trainers/${raw}`;
  }
  try {
    const url = new URL(normalized, 'https://mathexam.space/');
    const file = url.pathname.replace(/^\/+/, '');
    return validateTrainerFile(file) ? null : file;
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
  canonicalRegistryJson,
  loadTrainerRegistry,
  registryDigest,
  trainerFileFromUrl,
  validateTrainerManifest
});
