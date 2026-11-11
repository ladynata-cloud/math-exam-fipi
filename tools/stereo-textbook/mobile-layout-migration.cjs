'use strict';
// Content-only release gates froze the former UI. Preserve those checks against
// byte-exact archived files and also pin the explicitly requested layout update.
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),manifest=require('./mobile-layout-migration.json');
const {restorePublicNavigator}=require('../public-navigator-preservation.cjs');
const {restoreEarlyStudy}=require('./early-study-migration.cjs');
const originals={
 'stereo-course/textbook/assets/engine.js':'9da6fb10924d50793521740ea779d81ef78fe3dfee5dbd71ab138b7d345dba74',
 'stereo-course/textbook/assets/style.css':'56b3ec43f680dde578320a9ea1c5969a9a15d2d0344bfa1eda903f5bd3e09f51',
 'stereo-course/textbook/index.html':'af453fa854b9995f3a41bbf1a476564116a8efff43cee2234716e2c5489b5e55'
};
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function historicalRead(file,read=name=>fs.readFileSync(path.join(root,name))){
 if(!Object.hasOwn(originals,file))return read(file);
 assert.equal(manifest.base,'0d96ad84f0dd9dcadf123b3845db75c5476be93a');
 assert.deepEqual(Object.keys(manifest.files).sort(),Object.keys(originals).sort());
 const row=manifest.files[file];assert.equal(row.beforeSHA256,originals[file]);
 assert.equal(row.beforeFixture,'tools/stereo-textbook/fixtures/mobile-layout-before/'+path.basename(file));
 assert.match(row.afterSHA256,/^[a-f0-9]{64}$/);
 assert.equal(hash(restorePublicNavigator(file,restoreEarlyStudy(file,read))),row.afterSHA256,'exact reviewed companion migration / reading layout: '+file);
 const before=read(row.beforeFixture);assert.equal(hash(before),originals[file],'archived pre-layout bytes: '+file);
 return before;
}
module.exports={historicalRead,originals};
