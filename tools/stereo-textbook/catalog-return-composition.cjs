'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const record=require('./catalog-return-composition.json');
const catalog=require('./catalog-return-migration.json');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function beforeCombinedCatalogReturn(file,bytes){
 if(file!==record.file||hash(bytes)!==record.combinedSHA256)return bytes;
 assert.equal(record.schemaVersion,1);
 assert.equal(record.file,'stereo-course/textbook/assets/engine.js');
 assert.equal(record.catalogReturnSHA256,'8b233b55bd72852274fcd6b2eb6a6cd8b0d66e3e0ffb23998be0e27c19f9dc54');
 assert.equal(catalog.file,record.file);
 assert.equal(catalog.afterSHA256,record.catalogReturnSHA256);
 assert.equal(catalog.changes.length,4);
 let restored=bytes.toString('utf8');
 for(const {added,previous=''} of catalog.changes){
  assert.ok(added&&restored.split(added).length===2,'unique exact catalog-return span');
  restored=restored.replace(added,()=>previous);
 }
 assert.equal(record.harmonizationSHA256,'d938edf8cf7f7043e2e45b2e1ae391e5a9af496ba2a4fa1b38299619a89a4c23');
 assert.equal(hash(restored),record.harmonizationSHA256,'all remaining bytes equal the reviewed harmonization parent');
 return Buffer.from(restored);
}
module.exports={beforeCombinedCatalogReturn};
