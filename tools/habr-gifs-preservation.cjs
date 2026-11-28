'use strict';
// Full-payload hashes guard this exact inverse. Unknown bytes are never stripped.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const manifest=require('./habr-gifs-integration.json');
const hash=raw=>crypto.createHash('sha256').update(raw).digest('hex');
function restoreHabrHelp(file,input) {
  const raw=Buffer.isBuffer(input)?input:Buffer.from(input);
  const name=path.isAbsolute(file)?path.relative(root,file).split(path.sep).join('/'):file;
  const row=manifest.pages[name];
  if(!row || hash(raw)!==row.afterSha256)return raw;
  const block=Buffer.from(row.block),text=raw.toString('utf8');
  assert.equal(text.split(row.block).length,2,'One exact Habr help block: '+name);
  const restored=Buffer.from(text.replace(row.block,''));
  assert.equal(hash(restored),row.beforeSha256,'Complete original document identity: '+name);
  return restored;
}
module.exports={restoreHabrHelp,manifest};
