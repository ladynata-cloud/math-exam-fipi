'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {historicalRead,originals}=require('./mobile-layout-migration.cjs'),manifest=require('./mobile-layout-migration.json');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p));let negatives=0;
for(const [file,expected]of Object.entries(originals)){
 assert.equal(crypto.createHash('sha256').update(historicalRead(file)).digest('hex'),expected);
 for(const target of [file,manifest.files[file].beforeFixture]){assert.throws(()=>historicalRead(file,p=>p===target?Buffer.concat([read(p),Buffer.from('CORRUPTED')]):read(p)));negatives++;}
}
for (const [file, expected] of [
 ['stereo-course/assets/task-scene-viewer.js', '91ef00cd15e0e831fa835c089116e5150813ce0bd6554280d3e9f76a5c547f64'],
 ['stereo-course/textbook/schema/lesson.schema.json', 'ddd88a2bd8aea068fbdb0331c5d436529ed0bf12483732fddd2fc1e6a83efee1']
]) {
 assert.equal(crypto.createHash('sha256').update(historicalRead(file)).digest('hex'), expected);
 assert.throws(() => historicalRead(file, name => Buffer.concat([read(name), Buffer.from(' ')])));
 negatives++;
}
const untouched='stereo-course/textbook/data/course.json';assert.deepEqual(historicalRead(untouched),read(untouched));
console.log('ATANASYAN_LAYOUT_MIGRATION_OK: 3 exact old/new UI files, '+negatives+' negative controls, untouched lesson bytes');
