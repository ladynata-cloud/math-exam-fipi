'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {receipt,hash,committed,verifyAuditedSource,historicalAuditSource}=require('./oge-audit-source-preservation.cjs');
const {restoreVideoModels}=require('./oge-video-models-preservation.cjs');
const ROOT=path.resolve(__dirname,'..');
const files=['trainers/oge-task11-graphs-trainer.html','trainers/oge-task22-functions-graphs.html','trainers/oge-task24-proofs.html'];
test('the new receipt is confined to the three reviewed sources and preserves the original historical pins',()=>{
 assert.equal(receipt.task,'docs/tasks/OGE_AUDIT_LEARNING_20261111.md');
 assert.equal(receipt.baseCommit,'19811cc15a33d63fc0fcc0b6a11c34863ec64d03');
 assert.deepEqual(Object.keys(receipt.pages).sort(),files.sort());
 for(const fixture of ['tools/fixtures/oge-video-models-native-bytes.json','tools/fixtures/oge-worked-steps-native-bytes.json','tools/fixtures/oge-book-reviewed-board-inverse.json'])
  assert.equal(fs.readFileSync(path.join(ROOT,fixture),'utf8'),committed(receipt.baseCommit,fixture),fixture+' stays immutable');
});
for(const file of files)test(file+': exact content checkpoint, scoped model receipt and rejecting extra native bytes',()=>{
 const raw=fs.readFileSync(path.join(ROOT,file),'utf8'),pin=verifyAuditedSource(file,raw);
 assert.equal(hash(restoreVideoModels(file,raw)),pin.sha256);
 assert.equal(historicalAuditSource(file,raw),committed(receipt.baseCommit,file));
 for(const changed of [raw+'\n',raw.replace('<title>','<title>Unreviewed '),raw.replace('</body>','<script>void "unreviewed";</script></body>')])
  assert.throws(()=>verifyAuditedSource(file,changed),/every reviewed native byte/);
 assert.throws(()=>verifyAuditedSource('unrelated.html',raw),/explicitly reviewed/);
 const sourceCommit=pin.sourceCommit;
 try{
  pin.sourceCommit='212475fb159f8d215cbff42718819f4a751317b4';
  assert.throws(()=>verifyAuditedSource(file,raw),/exact allowed content checkpoint/);
 }finally{pin.sourceCommit=sourceCommit;}
});
