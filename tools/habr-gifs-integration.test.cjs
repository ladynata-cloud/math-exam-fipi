'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {restoreHabrHelp,manifest}=require('./habr-gifs-preservation.cjs');
const root=path.resolve(__dirname,'..'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
test('seven exact standalone shells invert to the complete reviewed documents',()=>{
  assert.deepEqual(Object.keys(manifest.pages),['trainers/negative-numbers-line.html','trainers/percent-part-whole-trainer.html','oge/skills/index.html','ege-profil/circle/index.html','ege-profil/trainers/trigonometry.html','stereo-course/literacy/index.html','stereo-course/sections/index.html']);
  for(const [name,row] of Object.entries(manifest.pages)) {
    const actual=fs.readFileSync(path.join(root,name));
    const original=execFileSync('git',['show',manifest.sourceTree+':'+name],{cwd:root,maxBuffer:16e6});
    assert.equal(hash(actual),row.afterSha256,name+' exact integration payload');
    assert.equal(hash(original),row.beforeSha256,name+' immutable before bytes');
    assert.deepEqual(restoreHabrHelp(name,actual),original,name+' math, controls, storage and links unchanged');
  }
});
test('exact inverse rejects altered, missing, duplicate or unlisted blocks and source edits',()=>{
  for(const [name,row] of Object.entries(manifest.pages)) {
    const raw=fs.readFileSync(path.join(root,name),'utf8');
    for(const changed of [raw.replace(row.block,row.block+row.block),raw.replace('habr-entry-help:start','habr-entry-help:altered'),raw.replace('<title>','<title>Changed source '),raw+'\n<script>void 1;</script>',raw.replace(row.block,row.block.replace('habr-entry-gifs','habr-entry-other'))]) {
      assert.notEqual(changed,raw,'effective probe '+name);
      assert.equal(restoreHabrHelp(name,changed).toString(),changed,'unknown bytes must remain raw');
      assert.notEqual(hash(restoreHabrHelp(name,changed)),row.beforeSha256);
    }
    assert.equal(restoreHabrHelp('trainers/trainer-board.html',raw).toString(),raw);
    const missing=raw.replace(row.block,'');
    assert.notEqual(hash(missing),row.afterSha256,'missing feature cannot pass current payload gate');
  }
});
test('OGE actual generated output still has no external scripts; only new standalone help is inlined',()=>{
  const html=fs.readFileSync(path.join(root,'oge/skills/index.html'),'utf8');
  assert(!/<script\b[^>]*\bsrc\s*=/i.test(html),'actual OGE output keeps offline script contract');
  assert(html.slice(0,1024).includes('<meta charset="utf-8">'),'UTF-8 declaration remains within first1024bytes for file://');
  const row=manifest.pages['oge/skills/index.html'];
  assert(row.block.includes(fs.readFileSync(path.join(root,'assets/habr-entry-gifs.js'),'utf8')));
  assert(row.block.includes(fs.readFileSync(path.join(root,'assets/habr-entry-gifs.css'),'utf8')));
});
test('board wrappers, storage/model runtimes and every existing offline output are byte-identical', () => {
  const protectedPaths = [
    'downloads',
    'stereo-course/sections/download',
    'stereo-course/sections/assets',
    'stereo-course/sections/data',
    'stereo-course/literacy/app.js',
    'stereo-course/literacy/data',
    'stereo-course/assets',
    'trainers/trainer-board.html',
    'trainers/board-picker.js',
    'trainers/sections-from-zero.html',
    'trainers/board-bridge.js',
    'trainers/vendor',
    'board-server',
    'ege-profil/circle/app.js',
    'ege-profil/circle/models.js',
    'ege-profil/circle/state.js',
    'ege-profil/circle/board-session.js',
    'oge/skills/engine.js',
    'oge/skills/series-runtime.js',
    'oge/skills/course-data.json',
    'oge/skills/series-catalog.json',
  ];
  // The separate geometry release replaces exactly one download before the Habr guides ship.
  const geometryIntegration = '868fb01a936f2f1abccd407cf879379815de2bd0';
  const ancestors = execFileSync('git', ['rev-list', 'HEAD'], {cwd: root, encoding: 'ascii', maxBuffer: 16 * 1024 * 1024});
  if (ancestors.split('\n').includes(geometryIntegration)) {
    const archive = 'downloads/trainers/geometry-course/geometry-course-package.zip';
    assert.equal(hash(fs.readFileSync(path.join(root, archive))), '51b16f99d3388ca06454ea41cac5bd4e244964fefeb2b11f0621d188c7df5b93',
      'The independently verified geometry ZIP must be preserved byte-for-byte');
    const indexedArchive = execFileSync('git', ['ls-files', '--stage', '--', archive], {cwd: root, encoding: 'utf8'}).trimEnd();
    assert.equal(indexedArchive, `100644 4acc20eb3e34d1969d34ce15bdf0e246cf5887bf 0\t${archive}`);
    execFileSync('git', ['diff', '--quiet', '--', archive], {cwd: root});
    protectedPaths.push(`:(top,exclude,literal)${archive}`);
  }
  execFileSync('git', ['diff', '--quiet', manifest.sourceTree, '--', ...protectedPaths], {cwd: root});
});
