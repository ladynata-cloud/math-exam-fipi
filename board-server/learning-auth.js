'use strict';

const crypto = require('node:crypto');
const { promisify } = require('node:util');
const scrypt = promisify(crypto.scrypt);
const HASH_OPTIONS = Object.freeze({ N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 });
const TOKEN_RE = /^[A-Za-z0-9_-]{22,100}$/;
const token = (bytes = 32) => crypto.randomBytes(bytes).toString('base64url');
const tokenHash = value => crypto.createHash('sha256').update(String(value)).digest('hex');
let hashTail = Promise.resolve();
let hashQueueSize = 0;

class LearningError extends Error {
  constructor(code, status = 400) { super(code); this.name = 'LearningError'; this.code = code; this.status = status; }
}
function requireValue(condition, code = 'LEARNING_INVALID', status = 400) {
  if (!condition) throw new LearningError(code, status);
}
function passwordValid(value, role = 'teacher') {
  // Keep codes as exact strings, including leading zeroes. Older clients may
  // still issue their existing role-specific passwords during the transition.
  return typeof value === 'string' && value.length <= 128
    && ((value.length === 4 && /^[0-9]{4}$/.test(value)) || value.length >= (role === 'student' ? 8 : 12));
}
async function serializedHash(operation) {
  requireValue(hashQueueSize < 8, 'LEARNING_BUSY', 429);
  hashQueueSize++;
  const result = hashTail.then(operation, operation);
  hashTail = result.catch(() => {});
  try { return await result; } finally { hashQueueSize--; }
}
async function hashPassword(password, role = 'teacher') {
  requireValue(passwordValid(password, role), role === 'student' ? 'LEARNING_STUDENT_PASSWORD_INVALID' : 'LEARNING_PASSWORD_INVALID');
  return serializedHash(async () => {
    const salt = crypto.randomBytes(16);
    const hash = await scrypt(password, salt, 32, HASH_OPTIONS);
    return `scrypt1:${salt.toString('hex')}:${hash.toString('hex')}`;
  });
}
async function verifyPassword(password, encoded) {
  // Accept four-digit codes and all previously supported passwords. Creation
  // policy is selected by trusted server-side account roles, never login input.
  if (!passwordValid(password, 'student')) return false;
  const valid = /^scrypt1:([a-f0-9]{32}):([a-f0-9]{64})$/.exec(encoded || '');
  // Unknown accounts take the same expensive path as a wrong password.
  const salt = valid ? Buffer.from(valid[1], 'hex') : Buffer.alloc(16);
  const expected = valid ? Buffer.from(valid[2], 'hex') : Buffer.alloc(32);
  return serializedHash(async () => {
    const actual = await scrypt(password, salt, 32, HASH_OPTIONS);
    return crypto.timingSafeEqual(actual, expected) && !!valid;
  });
}
function normalizeLogin(value) {
  requireValue(typeof value === 'string', 'LEARNING_LOGIN_INVALID');
  const login = value.trim().toLowerCase();
  requireValue(/^[a-z0-9][a-z0-9._-]{2,47}$/.test(login), 'LEARNING_LOGIN_INVALID');
  return login;
}
function safeName(value, max = 80) {
  requireValue(typeof value === 'string', 'LEARNING_NAME_INVALID');
  const name = value.trim().replace(/\s+/g, ' ');
  requireValue(name.length > 0 && name.length <= max && !/[<>\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/u.test(name), 'LEARNING_NAME_INVALID');
  return name;
}
function exactKeys(value, allowed, required = []) {
  requireValue(value !== null && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value).every(key => allowed.includes(key)) && required.every(key => Object.hasOwn(value, key)));
}
class RateLimiter {
  constructor(clock = Date.now) { this.clock = clock; this.buckets = new Map(); }
  take(key, capacity = 8, windowMs = 15 * 60 * 1000) {
    const now = this.clock();
    if (this.buckets.size >= 10000) for (const [old, value] of this.buckets) if (value.reset <= now) this.buckets.delete(old);
    requireValue(this.buckets.has(key) || this.buckets.size < 10000, 'LEARNING_RATE_LIMITED', 429);
    let current = this.buckets.get(key);
    if (!current || current.reset <= now) { current = { count: 0, reset: now + windowMs }; this.buckets.set(key, current); }
    requireValue(++current.count <= capacity, 'LEARNING_RATE_LIMITED', 429);
  }
}

module.exports = { LearningError, requireValue, exactKeys, safeName, normalizeLogin,
  token, tokenHash, TOKEN_RE, hashPassword, verifyPassword, passwordValid, RateLimiter };
