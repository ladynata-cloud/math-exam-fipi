'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {args,inside,validatePlan,sha}=require('./habr-gifs.browser.cjs');
const plan=JSON.parse(fs.readFileSync(path.join(__dirname,'habr-gifs-capture-20261119.json'),'utf8'));
const expected=[
  '/trainers/negative-numbers-line.html?seed=habr-311',
  '/trainers/percent-part-whole-trainer.html?percent=80#exercise',
  '/oge/skills/?topic=base&route=family%3Aarith-battle-balance',
  '/ege-profil/circle/index.html?route=trigonometry&unit=m4-fractional-turns#lesson/m4-fractional-turns',
  '/ege-profil/trainers/trigonometry.html#sine-wave',
  '/stereo-course/literacy/#atanasyan2024-theory-001',
  '/stereo-course/sections/#starter-18',
  '/stereo-course/sections/#auth-core-05'
];
test('the plan covers only the eight exact standalone Habr entries',()=>{
  assert.deepEqual(plan.clips.map(c=>c.url),expected);
  assert.equal(new Set(plan.clips.map(c=>c.id)).size,8);
  assert.equal(plan.clips.reduce((n,c)=>n+c.frames.length,0),47);
  for(const c of plan.clips)assert(c.runtimeFiles.every(file=>plan.sourceHashes[file]));
  for(const h of Object.values(plan.sourceHashes))assert(/^[a-f0-9]{64}$/.test(h));
});
test('runtime bytes are verified; a changed source or unknown native action fails closed',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'habr-plan-test-'));
  try {
    fs.writeFileSync(path.join(root,'source.js'),'reviewed');
    const fixture=structuredClone(plan);fixture.sourceHashes={'source.js':sha('reviewed')};
    for(const c of fixture.clips)c.runtimeFiles=['source.js'];
    assert.equal(validatePlan(fixture,root).size,8);
    fs.writeFileSync(path.join(root,'source.js'),'changed');
    assert.throws(()=>validatePlan(fixture,root),/Runtime drift/);
    fs.writeFileSync(path.join(root,'source.js'),'reviewed');
    fixture.clips[0].frames[0].actions=[{type:'evaluate',selector:'body'}];
    assert.throws(()=>validatePlan(fixture,root),/Only native UI/);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('serving/artifact paths cannot escape their root, including symlinks',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'habr-path-test-'));
  try {
    assert.throws(()=>inside(root,'../outside'));
    assert.throws(()=>inside(root,'/etc/passwd'));
    fs.symlinkSync(os.tmpdir(),path.join(root,'outside'));
    assert.throws(()=>inside(root,'outside'),/Symlink escapes/);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('unknown or incomplete CLI arguments are rejected',()=>{
  assert.throws(()=>args(['--unsafe']));
  assert.throws(()=>args(['--repo']));
  assert.deepEqual(args(['--check','--clips','habr-sine-wave']),{check:true,clips:'habr-sine-wave'});
});
