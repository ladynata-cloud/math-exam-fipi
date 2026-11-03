'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Ajv = require('ajv/dist/2020');
const root = path.resolve(__dirname, '../..');
const migration = require('./sphere-schema-migration.cjs');
const {assertSphereSchemaMigration, SCHEMA_PATH, BEFORE_FIXTURE, BEFORE_SHA256} = migration;
const read = file => fs.readFileSync(path.join(root, file));
const before = JSON.parse(read(BEFORE_FIXTURE)), after = JSON.parse(read(SCHEMA_PATH));
assertSphereSchemaMigration(SCHEMA_PATH, BEFORE_SHA256);
const baselineNames = ['polyhedra-practical', 'additional288', 'additional294', 'additional299', 'additional310', 'cylinder', 'cone', 'sphere'];
for (const name of baselineNames) assert.equal(require('./' + name + '-baseline.json').immutableFiles[SCHEMA_PATH], BEFORE_SHA256,
  name + ': original historical schema hash is retained');
let rejects = 0;
const reject = (fn, pattern) => { assert.throws(fn, pattern); rejects++; };
reject(() => assertSphereSchemaMigration('unlisted.schema.json', BEFORE_SHA256), /only the lesson schema/);
reject(() => assertSphereSchemaMigration(SCHEMA_PATH, '0'.repeat(64)), /original historical schema hash/);
reject(() => assertSphereSchemaMigration(SCHEMA_PATH, BEFORE_SHA256, file => file === BEFORE_FIXTURE
  ? Buffer.concat([read(file), Buffer.from('\nCORRUPTED')]) : read(file)), /archived pre-sphere schema/);
reject(() => assertSphereSchemaMigration(SCHEMA_PATH, BEFORE_SHA256, file => file === SCHEMA_PATH
  ? Buffer.from('not JSON') : read(file)), /requires valid JSON/);
for (const mutate of [
  schema => delete schema.$defs.model.properties.spheres,
  schema => schema.$defs.model.required.push('spheres'),
  schema => { schema.$defs.model.properties.unapproved = {type: 'string'}; },
  schema => { schema.$defs.model.additionalProperties = true; },
  schema => { schema.$defs.model.properties.spheres.items.additionalProperties = true; },
  schema => { schema.$defs.model.properties.spheres.items.properties.radius.exclusiveMinimum = -1; },
  schema => { schema.$defs.model.properties.spheres.items.properties.center.minItems = 2; },
  schema => { schema.$defs.model.properties.spheres.items.required.push('surfaceEdges'); },
  schema => { schema.$defs.model.properties.spheres.items.properties.surfaceEdges.items.minItems = 1; },
  schema => { schema.properties.revision.minimum = 0; }
]) {
  const changed = structuredClone(after); mutate(changed);
  reject(() => assertSphereSchemaMigration(SCHEMA_PATH, BEFORE_SHA256, file => file === SCHEMA_PATH
    ? Buffer.from(JSON.stringify(changed)) : read(file)), /exact additive sphere schema migration/);
}
reject(() => assertSphereSchemaMigration(SCHEMA_PATH, BEFORE_SHA256, file => file === SCHEMA_PATH
  ? Buffer.concat([read(file), Buffer.from('\n')]) : read(file)), /exact additive sphere schema migration bytes/);

function compile(schema) {
  const ajv = new Ajv({allErrors: true, strict: true});
  require('ajv-formats')(ajv);
  return ajv.compile(schema);
}
const oldValid = compile(before), newValid = compile(after);
const directory = path.join(root, 'stereo-course/textbook/lessons');
const filenames = require('./sphere-baseline.cjs').previousLessonFiles(directory);
assert.equal(filenames.length, 594);
for (const filename of filenames) {
  const lesson = JSON.parse(fs.readFileSync(path.join(directory, filename)));
  assert(oldValid(lesson), filename + ': exact prior schema accepts the published lesson');
  assert(newValid(lesson), filename + ': additive schema retains the prior lesson contract');
}
const original = JSON.parse(fs.readFileSync(path.join(directory, filenames[0])));
const withSpheres = value => {
  const lesson = structuredClone(original);
  lesson.visualization.model.spheres = value;
  return lesson;
};
for (const spheres of [[], [{center: [0, 0, 0], radius: 1}],
  [{center: [1, -2, 3], radius: 2.5, surfaceEdges: []}],
  [{center: [0, 0, 0], radius: 1, surfaceEdges: [['A', 'B']]}]]) {
  assert(newValid(withSpheres(spheres)), 'valid analytic-sphere shape: ' + JSON.stringify(newValid.errors));
  assert(!oldValid(withSpheres(spheres)), 'the new field was not silently allowed by the old schema');
}
const valid = {center: [0, 0, 0], radius: 1, surfaceEdges: [['A', 'B']]};
const invalid = [
  null, {}, {center: [0, 0, 0]}, {radius: 1},
  {...valid, center: [0, 0]}, {...valid, center: [0, 0, 0, 0]},
  {...valid, center: ['0', 0, 0]}, {...valid, center: [NaN, 0, 0]},
  {...valid, center: [Infinity, 0, 0]}, {...valid, radius: 0},
  {...valid, radius: -1}, {...valid, radius: '1'}, {...valid, radius: NaN},
  {...valid, radius: Infinity}, {...valid, extra: true},
  {...valid, surfaceEdges: null}, {...valid, surfaceEdges: ['A', 'B']},
  {...valid, surfaceEdges: [[]]}, {...valid, surfaceEdges: [['A']]},
  {...valid, surfaceEdges: [['A', 'B', 'C']]},
  {...valid, surfaceEdges: [['', 'B']]}, {...valid, surfaceEdges: [[1, 'B']]}
];
for (const sphere of invalid) {
  assert.equal(newValid(withSpheres([sphere])), false, 'invalid analytic sphere must be rejected');
  rejects++;
}
for (const value of [null, {}, 'sphere']) {
  assert.equal(newValid(withSpheres(value)), false, 'spheres itself is an array'); rejects++;
}
console.log('SPHERE_SCHEMA_MIGRATION_OK: exact optional field; 594 old cards valid under both schemas; '
  + baselineNames.length + ' frozen baseline hashes; ' + rejects + ' negative controls');
