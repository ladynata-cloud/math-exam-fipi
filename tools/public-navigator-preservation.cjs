'use strict';
// Historical gates keep their existing receipts. Only this exact, hash-bound
// pair of public navigation includes can be inverted; unknown bytes stay raw.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const rollout=require('../assets/assistant/page-rollout.json');
const snippet='\n<script defer src="/assets/assistant/navigator-data.js?v=20261105-site1"></script>\n<script defer src="/assets/assistant/navigator-widget.js?v=20261105-site1"></script>\n';
assert.equal(rollout.schemaVersion,1);
assert.equal(rollout.snippet,snippet,'Only the two existing exact deferred navigator includes may be inverted');
const hash=raw=>crypto.createHash('sha256').update(raw).digest('hex');
function restorePublicNavigator(file,input){
  const raw=Buffer.isBuffer(input)?input:Buffer.from(input);
  const name=path.isAbsolute(file)?path.relative(root,file).split(path.sep).join('/'):file;
  const row=rollout.addedPages[name];
  if(!row||hash(raw)!==row.afterSha256)return raw;
  const text=raw.toString('utf8');
  assert.equal(text.split(snippet).length,2,'One exact navigator include pair: '+name);
  const restored=Buffer.from(text.replace(snippet,''));
  assert.equal(hash(restored),row.beforeSha256,'The full original document must be recovered: '+name);
  return restored;
}
module.exports={restorePublicNavigator,snippet,rollout};
