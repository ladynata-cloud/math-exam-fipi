'use strict';
// Content-only release gates froze the former UI. Preserve those checks against
// byte-exact archived files and also pin the explicitly requested layout update.
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),manifest=require('./mobile-layout-migration.json');
const {restorePublicNavigator}=require('../public-navigator-preservation.cjs');
const originals={
 'stereo-course/textbook/assets/engine.js':'9da6fb10924d50793521740ea779d81ef78fe3dfee5dbd71ab138b7d345dba74',
 'stereo-course/textbook/assets/style.css':'56b3ec43f680dde578320a9ea1c5969a9a15d2d0344bfa1eda903f5bd3e09f51',
 'stereo-course/textbook/index.html':'af453fa854b9995f3a41bbf1a476564116a8efff43cee2234716e2c5489b5e55'
};
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function restoreCourseShell(file,raw){
 // This presentation opt-in has its own browser gate. The previous reading
 // layout receipt remains exact; no new script, model or lesson byte is hidden.
 if(file!=='stereo-course/textbook/index.html'||hash(raw)!=='2bf08f44e5ef7ae5cb5a4f236ba27c7db13c38546cba407046d4011af5012bfb')return raw;
 const link='<link rel="stylesheet" href="/assets/course-ui.css?v=20261109-1">\n',body='<body data-mx-course="stereo">',text=raw.toString('utf8');
 assert.equal(text.split(link).length,2,'one exact course stylesheet');
 assert.equal(text.split(body).length,2,'one exact course body opt-in');
 const restored=Buffer.from(text.replace(link,'').replace(body,'<body>'));
 assert.equal(hash(restored),'9539a3f97374f41fd9caa49b6d25c4922096afd7d52d5010184f66536839fb3c','course shell restores the entire reviewed reading layout');
 return restored;
}
function historicalRead(file,read=name=>fs.readFileSync(path.join(root,name))){
 if(!Object.hasOwn(originals,file))return read(file);
 assert.equal(manifest.base,'0d96ad84f0dd9dcadf123b3845db75c5476be93a');
 assert.deepEqual(Object.keys(manifest.files).sort(),Object.keys(originals).sort());
 const row=manifest.files[file];assert.equal(row.beforeSHA256,originals[file]);
 assert.equal(row.beforeFixture,'tools/stereo-textbook/fixtures/mobile-layout-before/'+path.basename(file));
 assert.match(row.afterSHA256,/^[a-f0-9]{64}$/);
 assert.equal(hash(restoreCourseShell(file,restorePublicNavigator(file,read(file)))),row.afterSHA256,'exact reviewed companion migration / reading layout: '+file);
 const before=read(row.beforeFixture);assert.equal(hash(before),originals[file],'archived pre-layout bytes: '+file);
 return before;
}
module.exports={historicalRead,originals,restoreCourseShell};
