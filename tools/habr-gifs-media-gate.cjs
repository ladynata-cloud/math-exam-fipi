#!/usr/bin/env node
'use strict';
// Final import gate: current UI bytes, genuine recording receipts and every media byte.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process');
const {validatePlan,sha,inside}=require('./habr-gifs.browser.cjs');
const root=path.resolve(__dirname,'..'),planFile=path.join(__dirname,'habr-gifs-capture-20261119.json');
const plan=JSON.parse(fs.readFileSync(planFile)),mediaRoot=path.join(root,'assets/habr-entry-gifs');
const json=p=>JSON.parse(fs.readFileSync(p));
validatePlan(plan,root);
const media=json(path.join(mediaRoot,'media.json'));
assert.equal(media.complete,true,'Eight genuine GIF recordings have not been imported yet');
const capturePath=path.join(mediaRoot,'receipts/capture.json'),capture=json(capturePath);
assert.equal(capture.complete,true);assert.equal(media.captureReceiptSha256,sha(fs.readFileSync(capturePath)));
const ids=plan.clips.map(c=>c.id);
assert.deepEqual(media.clipList,ids);assert.deepEqual(capture.clipList,ids);
assert.equal(media.clips.length,8);assert.equal(capture.records.length,8);
assert.deepEqual(media.clips.map(c=>c.id),ids);assert.deepEqual(capture.records.map(c=>c.id),ids);
for(const receipt of [media,capture]) {
  assert.equal(receipt.planSha256,sha(fs.readFileSync(planFile)));
  assert.equal(receipt.recorderSha256,sha(fs.readFileSync(path.join(__dirname,'habr-gifs.browser.cjs'))));
  assert.equal(receipt.encoderSha256,sha(fs.readFileSync(path.join(__dirname,'build-habr-gifs.py'))));
  assert.deepEqual(receipt.sourceHashes,plan.sourceHashes);
  assert(/^[0-9]+$/.test(String(receipt.workflowRunId)),'Actual GitHub recording run is required');
}
assert.equal(media.recordingHead,capture.head);assert.equal(media.recordingTree,capture.tree);
assert(/^[a-f0-9]{40}$/.test(capture.head) && /^[a-f0-9]{40}$/.test(capture.tree));
const git=(...args)=>cp.execFileSync('git',['-C',root,...args],{encoding:'utf8'}).trim();
assert.equal(git('rev-parse',capture.head+'^{tree}'),capture.tree);
git('merge-base','--is-ancestor',capture.head,'HEAD');
for(let i=0;i<8;i++) {
  const expected=plan.clips[i],entry=media.clips[i],raw=capture.records[i];
  assert.equal(entry.complete,true);assert.equal(raw.complete,true);assert.equal(entry.sourcePage,expected.url);
  const scenarioSha=sha(JSON.stringify(expected));assert.equal(entry.scenarioSha256,scenarioSha);
  const recordPath=path.join(mediaRoot,'receipts',entry.id+'.recording.json');
  assert.equal(sha(fs.readFileSync(recordPath)),raw.recordingSha256);assert.equal(entry.recordingSha256,raw.recordingSha256);
  const record=json(recordPath);assert.equal(record.complete,true);assert.equal(record.scenarioSha256,scenarioSha);
  assert.equal(record.url,expected.url);assert.deepEqual(record.sourceHashes,Object.fromEntries(expected.runtimeFiles.map(f=>[f,plan.sourceHashes[f]])));
  assert.equal(entry.frameCount,expected.frames.length);assert.equal(entry.frames.length,expected.frames.length);
  assert(entry.files[entry.id+'.gif']);
  for(let n=0;n<entry.frames.length;n++) {
    assert.equal(entry.frames[n].caption,expected.frames[n].caption);
    assert.equal(entry.frames[n].durationMs,expected.frames[n].durationMs);
    assert.equal(entry.frames[n].file,`frame-${String(n+1).padStart(2,'0')}.png`);
  }
  for(const [name,metadata] of Object.entries(entry.files)) {
    assert(/^(?:frame-\d{2}\.png|contact-sheet\.png|habr-[a-z0-9-]+\.gif)$/.test(name));
    const bytes=fs.readFileSync(inside(path.join(mediaRoot,entry.id),name));
    assert.equal(bytes.length,metadata.bytes);assert.equal(sha(bytes),metadata.sha256);
    if(name.endsWith('.gif'))assert(/^GIF8[79]a$/.test(bytes.subarray(0,6).toString()));
    else assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  }
}
console.log('HABR_EIGHT_NATIVE_GIFS_CURRENT_SOURCE_OK');
