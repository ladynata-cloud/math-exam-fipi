'use strict';
// The existing renderer already accepts analytic spheres. This schema change
// admits that one optional field; no earlier lesson contract may be changed.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const SCHEMA_PATH = 'stereo-course/textbook/schema/lesson.schema.json';
const BEFORE_FIXTURE = 'tools/stereo-textbook/fixtures/sphere-before/lesson.schema.json';
const BEFORE_SHA256 = '0afbe8ada69985cda31e8c77168ac101aac05f04ae53c401b91c1bfd969972ba';
const AFTER_SHA256 = 'ddd88a2bd8aea068fbdb0331c5d436529ed0bf12483732fddd2fc1e6a83efee1';
const originals = Object.freeze({[SCHEMA_PATH]: BEFORE_SHA256});
const SPHERES_SCHEMA = {
  type: 'array',
  items: {
    type: 'object', additionalProperties: false,
    properties: {
      center: {type: 'array', items: {type: 'number'}, minItems: 3, maxItems: 3},
      radius: {type: 'number', exclusiveMinimum: 0},
      surfaceEdges: {type: 'array', items: {
        type: 'array', items: {type: 'string', minLength: 1}, minItems: 2, maxItems: 2
      }}
    },
    // The renderer defaults absent surfaceEdges to []; center/radius are
    // mandatory. Point existence and on-sphere arc geometry remain runtime
    // and independent geometry checks, as for ordinary model edges.
    required: ['center', 'radius']
  }
};
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

function assertSphereSchemaMigration(file, expected, read = name => fs.readFileSync(path.join(root, name))) {
  assert.equal(file, SCHEMA_PATH, 'only the lesson schema may use the sphere schema migration');
  assert.equal(expected, BEFORE_SHA256, 'original historical schema hash must remain unchanged');
  const archived = read(BEFORE_FIXTURE);
  assert.equal(hash(archived), BEFORE_SHA256, 'archived pre-sphere schema is byte-identical');
  const before = JSON.parse(archived);
  assert(!Object.hasOwn(before.$defs.model.properties, 'spheres'), 'archived schema has no analytic sphere field');
  const addition = structuredClone(before);
  addition.$defs.model.properties.spheres = structuredClone(SPHERES_SCHEMA);
  const previous = beforeRightAngleSchema(read(file));
  assert.deepEqual(JSON.parse(previous), addition, 'exact additive sphere schema migration: only optional model.spheres');
}

function beforeRightAngleSchema(bytes) {
  let after;
  try { after = JSON.parse(bytes); }
  catch { assert.fail('exact additive sphere schema migration requires valid JSON'); }
  // Preserve the exact earlier schema after removing only the two angle fields.
  const rightAngles = {type: 'array', items: {type: 'array', items: {type: 'string', minLength: 1},
    minItems: 3, maxItems: 3, uniqueItems: true}};
  for (const kind of ['model', 'view']) {
    assert.deepEqual(after.$defs[kind].properties.rightAngles, rightAngles, 'exact optional right-angle schema');
    delete after.$defs[kind].properties.rightAngles;
  }
  const previous = Buffer.from(JSON.stringify(after, null, 2) + '\n');
  assert.equal(hash(previous), AFTER_SHA256, 'exact additive sphere schema migration before right angles');
  assert.equal(hash(bytes), '26c877296c167e4889a72ff67e569364cc03fc1912c3c6261b578c6d8887c2e0', 'exact additive sphere schema migration bytes with right angles');
  return previous;
}

module.exports = {assertSphereSchemaMigration, beforeRightAngleSchema, originals, SCHEMA_PATH, BEFORE_FIXTURE,
  BEFORE_SHA256, AFTER_SHA256, SPHERES_SCHEMA};
