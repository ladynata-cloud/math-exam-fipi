'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {historicalRead,originals,restoreCourseShell}=require('./mobile-layout-migration.cjs'),manifest=require('./mobile-layout-migration.json');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p));let negatives=0;
for(const [file,expected]of Object.entries(originals)){
 assert.equal(crypto.createHash('sha256').update(historicalRead(file)).digest('hex'),expected);
 for(const target of [file,manifest.files[file].beforeFixture]){assert.throws(()=>historicalRead(file,p=>p===target?Buffer.concat([read(p),Buffer.from('CORRUPTED')]):read(p)));negatives++;}
}
const untouched='stereo-course/textbook/data/course.json';assert.deepEqual(historicalRead(untouched),read(untouched));
const index='stereo-course/textbook/index.html',raw=read(index),link='<link rel="stylesheet" href="/assets/course-ui.css?v=20261109-1">\n';
for(const text of [
 raw.toString().replace('20261109-1','20261109-2'),
 raw.toString().replace('data-mx-course="stereo"','data-mx-course="geometry"'),
 raw.toString().replace(link,link+link),
 raw.toString().replace('assets/engine.js','assets/other.js')
]){assert.notEqual(text,raw.toString());assert.throws(()=>historicalRead(index,p=>p===index?Buffer.from(text):read(p)));negatives++;}
const shell=require('../public-navigator-preservation.cjs').restorePublicNavigator(index,raw),original=restoreCourseShell(index,shell);
assert.equal(crypto.createHash('sha256').update(original).digest('hex'),manifest.files[index].afterSHA256);
assert.deepEqual(restoreCourseShell(index,original),original);
assert.deepEqual(restoreCourseShell('unrelated.html',shell),shell,'shell exception is path-bound');
console.log('ATANASYAN_LAYOUT_MIGRATION_OK: 3 exact old/new UI files, '+negatives+' negative controls, untouched lesson bytes');
