'use strict';
// The audit intentionally revises three native sources. Seal every new byte
// against its reviewed content commit; keep older book inverses immutable.
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const receipt=require('./fixtures/oge-audit-learning-native-bytes.json');
const ROOT=path.resolve(__dirname,'..');
const CONTENT_COMMIT='f20e80a896579b3febcb9e907ad1a51f97153ed4';
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
function committed(ref,file){return execFileSync('git',['show',ref+':'+file],{cwd:ROOT,encoding:'utf8',maxBuffer:2*1024*1024});}
function verifyAuditedSource(file,raw){
 const pin=receipt.pages[file];assert(pin,'Only an explicitly reviewed source has an audit receipt');
 assert.equal(pin.sourceCommit,CONTENT_COMMIT,file+': exact allowed content checkpoint');
 assert.equal(hash(raw),pin.rawSha256,file+': every reviewed native byte is required');
 assert.equal(String(raw),committed(pin.sourceCommit,file),file+': exact committed source checkpoint');
 return pin;
}
function historicalAuditSource(file,raw){
 verifyAuditedSource(file,raw);
 // This is an explicit historical fixture, not a filter applied to arbitrary
 // current text. The complete current source has already been verified above.
 return committed(receipt.baseCommit,file);
}
module.exports={receipt,hash,committed,verifyAuditedSource,historicalAuditSource};
