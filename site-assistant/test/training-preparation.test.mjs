import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { origins,validateTrainingRows,validateProvenanceInventory,checkTraining,buildManifest,trainingRoot,serviceRoot,walkFiles } from '../scripts/training-data.mjs';

function fixture() {
  const datasets={},provenance=[];
  for(const [site,origin] of Object.entries(origins)) {
    const url=origin+'/';
    datasets[site]=[{messages:[{role:'system',content:'Доступный источник: '+url},{role:'user',content:'Первый вопрос '+site},{role:'assistant',content:'Один следующий шаг.'},{role:'user',content:'Уточнение '+site},{role:'assistant',content:'Проверим вместе этот шаг.'}]}];
    provenance.push({id:site+'-fixture',site,split:'train',line:1,source_url:url,source_locator:'fixture',creation:'editorial_synthetic',family:site+'-fixture',source_repository:'ladynata-cloud/math-exam-fipi',source_revision:'a'.repeat(40),source_paths:['README.md'],entity_ids:[]});
  }
  return {datasets,provenance};
}

test('preparation rejects test-question leakage despite punctuation and ё/е changes',()=>{
  const f=fixture();
  f.datasets.math[0].messages[1].content='Ещё один вопрос!';
  assert.throws(()=>validateTrainingRows(f.datasets,f.provenance,[{id:'new-eval',site:'math',context:{mode:'test',source_urls:[origins.math+'/']},messages:[{role:'system',content:'Условие и источник: '+origins.math+'/'},{role:'user',content:'ЕЩЕ — один вопрос?'}]}]),/leaks/);
});

test('preparation rejects missing provenance, cross-site sources, credentials and exported local paths',()=>{
  const missing=fixture();missing.provenance.pop();
  assert.throws(()=>validateTrainingRows(missing.datasets,missing.provenance),/count/);
  const wrong=fixture();wrong.provenance[0].source_url=origins.reader+'/';
  assert.throws(()=>validateTrainingRows(wrong.datasets,wrong.provenance),/Cross-site/);
  const credential=fixture();credential.datasets.math[0].messages[2].content='api_key='+ 'x'.repeat(24);
  assert.throws(()=>validateTrainingRows(credential.datasets,credential.provenance),/credential/);
  for(const text of ['api_key="'+'x'.repeat(24)+'"','Authorization: Bearer '+'x'.repeat(24)]) {
    const quoted=fixture();quoted.datasets.math[0].messages[2].content=text;
    assert.throws(()=>validateTrainingRows(quoted.datasets,quoted.provenance),/credential/);
  }
  const path=fixture();path.provenance[0].source_paths=['../private'];
  assert.throws(()=>validateTrainingRows(path.datasets,path.provenance),/Unsafe source path/);
});

test('model inputs cannot contain rubrics or an empty conversation',()=>{
  const f=fixture();
  const input={id:'new-eval',site:'math',context:{mode:'test',source_urls:[origins.math+'/']},messages:[]};
  assert.throws(()=>validateTrainingRows(f.datasets,f.provenance,[input]),/messages/);
  input.messages=[{role:'system',content:'Условие'},{role:'user',content:'Новый контрольный вопрос'}];
  input.expected_answer='Эталон';
  assert.throws(()=>validateTrainingRows(f.datasets,f.provenance,[input]),/unknown field/);
});

test('preparation rejects duplicate provenance lines and extra training metadata',()=>{
  const f=fixture();f.provenance[0].line=2;
  assert.throws(()=>validateTrainingRows(f.datasets,f.provenance),/provenance line/);
  const extra=fixture();extra.datasets.reader[0].expected_answer='Do not train on rubrics';
  assert.throws(()=>validateTrainingRows(extra.datasets,extra.provenance),/Only messages/);
});

test('a well-formed but unverified historical revision cannot pass provenance checks',()=>{
  const f=fixture();
  const inventory={version:1,sources:[{repository:'ladynata-cloud/math-exam-fipi',revision:'a'.repeat(40),path:'README.md',git_blob:'b'.repeat(40),sha256:'c'.repeat(64),bytes:10}]};
  validateProvenanceInventory(f.provenance,inventory);
  f.provenance[0].source_revision='d'.repeat(40);
  assert.throws(()=>validateProvenanceInventory(f.provenance,inventory),/Unverified historical source/);
});

test('export rejects disguised child paths and symlinked training destinations before creating them',async()=>{
  const temp=await mkdtemp(resolve(tmpdir(),'site-assistant-path-'));
  try {
    const script=resolve(serviceRoot,'scripts/prepare-training.mjs');
    for(const target of [resolve(trainingRoot,'..review-output'),resolve(trainingRoot,'nested/new-export')]) {
      assert.throws(()=>execFileSync(process.execPath,[script,'--output',target],{stdio:'pipe'}),/Output must not overwrite/);
    }
    const alias=resolve(temp,'alias');await symlink(trainingRoot,alias,'dir');
    assert.throws(()=>execFileSync(process.execPath,[script,'--output',resolve(alias,'new-export')],{stdio:'pipe'}),/Output must not overwrite/);
  } finally {await rm(temp,{recursive:true,force:true});}
});

test('committed manifest matches all training files and their knowledge snapshots',async()=>{
  const checked=await checkTraining();
  assert.ok(checked.total>=72,'Expected an expanded, reviewed pilot');
  assert.deepEqual(JSON.parse(await readFile(resolve(trainingRoot,'manifest.json'),'utf8')),await buildManifest());
});

test('handoff export is deterministic, keeps evaluation out of upload, and refuses to overwrite a prior package',async()=>{
  const temp=await mkdtemp(resolve(tmpdir(),'site-assistant-preparation-'));
  try {
    // A recipient can unpack the handoff inside an unrelated ES-module project.
    await writeFile(resolve(temp,'package.json'),JSON.stringify({type:'module'}));
    const one=resolve(temp,'first'),two=resolve(temp,'second');
    const script=resolve(serviceRoot,'scripts/prepare-training.mjs');
    for(const target of [one,two]) execFileSync(process.execPath,[script,'--output',target],{stdio:'pipe'});
    assert.equal(await readFile(resolve(one,'bundle-manifest.json'),'utf8'),await readFile(resolve(two,'bundle-manifest.json'),'utf8'));
    assert.deepEqual(await walkFiles(resolve(one,'upload-training')),['train-math.jsonl','train-reader.jsonl','train-tarot.jsonl']);
    const input=await readFile(resolve(one,'evaluation-inputs/inputs.jsonl'),'utf8');
    assert.equal(input,await readFile(resolve(trainingRoot,'evaluation/inputs.jsonl'),'utf8'));
    execFileSync(process.execPath,[resolve(one,'offline-toolkit/site-assistant/scripts/check-training.mjs')],{cwd:resolve(one,'offline-toolkit'),stdio:'pipe'});
    assert.throws(()=>execFileSync(process.execPath,[script,'--output',one],{stdio:'pipe'}));
  } finally {await rm(temp,{recursive:true,force:true});}
});
