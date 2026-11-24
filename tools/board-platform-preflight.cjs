'use strict';
// A preflight gate compares the actual merge candidate with its actual base.
// Test expectations are policy, not another hard-coded list of trainers.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
const ROOT = path.resolve(__dirname, '..');
const MANIFEST = 'trainers/board-compat.json';
const PICKER = 'trainers/board-picker-data.json';
const PICKER_JS = 'trainers/board-picker.js';
const RECEIPTS = 'tools/fixtures/board-registry-transitions.json';
function capability(row) {
  if (!row) return null;
  const mirror = row.boardCompatibility === 'board-mirror';
  return {file:row.file, boardCompatibility:row.boardCompatibility,
    supportsSeed:row.supportsSeed === true, supportsBoardMirror:row.supportsBoardMirror,
    version:mirror ? row.version : null,
    stateSchemaVersion:mirror ? row.stateSchemaVersion : null,
    bridgeProtocolVersion:mirror ? row.bridgeProtocolVersion : null,
    allowLegacyHtml:row.allowLegacyHtml === true,
    progressSchemaVersion:row.supportsProgressTracking === true ? row.progressSchemaVersion : null};
}

function equal(a,b) {
  // Projections are built with a stable property order; receipts can use any JSON key order.
  if (a === b) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a)!==Array.isArray(b)) return false;
  const keys=Object.keys(a);
  return keys.length===Object.keys(b).length && keys.every(k=>Object.hasOwn(b,k)&&equal(a[k],b[k]));
}

function checkEvolution(before, after, previousReceipts, receipts, beforeVisible, afterVisible) {
  const errors=[], approved=[], additions=[];
  const old=new Map(before.trainers.map(row=>[row.trainerId,row]));
  const current=new Map(after.trainers.map(row=>[row.trainerId,row]));
  if (old.size!==before.trainers.length || current.size!==after.trainers.length) errors.push('Duplicate trainer ID');
  if (receipts.length<previousReceipts.length || previousReceipts.some((row,i)=>!equal(row,receipts[i]))) errors.push('Registry change receipts are append-only');
  const unused=receipts.slice(previousReceipts.length).map(row=>({row,used:false}));
  for(const [id,row] of current) {
    const prior=old.get(id);
    if (row.allowLegacyHtml===true && prior?.allowLegacyHtml!==true) errors.push(id+': new legacy HTML authorization is prohibited');
    if(!prior) additions.push(id);
    if(row.boardCompatibility==='board-mirror' &&
       (!prior || prior.boardCompatibility!=='board-mirror' || beforeVisible.has(id)) &&
       !afterVisible.has(id)) errors.push(id+': missing reachable board picker entry');
  }
  for(const [id,prior] of old) {
    const from=capability(prior),to=capability(current.get(id));
    if(equal(from,to)) continue;
    const matches=unused.filter(item=>item.row && item.row.trainerId===id && equal(item.row.before,from) && equal(item.row.after,to) &&
      typeof item.row.reason==='string' && item.row.reason.trim().length>=20);
    if(matches.length!==1) {
      errors.push(id+': existing capability changed without one exact new review receipt');
      continue;
    }
    matches[0].used=true;
    approved.push(id);
  }
  for(const item of unused) if(!item.used) errors.push('Unmatched or malformed registry change receipt: '+String(item.row?.trainerId));
  return {errors,approved,additions};
}

function parseReceipts(raw){
  const value=JSON.parse(raw);
  if(value.schemaVersion!==1 || !Array.isArray(value.transitions)) throw Error('Invalid transition receipts');
  return value.transitions;
}
function visibleMirrorIds(manifest,picker,source){
  if(picker.version!==1 || !Array.isArray(picker.entries)) throw Error('Invalid picker data');
  const byFile=new Map(manifest.trainers.filter(row=>row.boardCompatibility==='board-mirror').map(row=>[row.file,row.trainerId]));
  const sandbox={window:{},location:new URL('https://mathexam.space/trainers/trainer-board.html'),URL};
  vm.runInNewContext(source,sandbox,{timeout:3000,filename:PICKER_JS});
  const ids=new Set();
  for(const row of picker.entries){
    if(typeof row.href!=='string' || typeof row.title!=='string' || typeof row.group!=='string') throw Error('Invalid picker entry');
    if(!row.href.startsWith('/') || row.href.startsWith('//')) throw Error('Non-local picker route: '+row.href);
    const normalized=sandbox.window.BoardPicker.normalize(row.href);
    const url=new URL(normalized,sandbox.location.href);
    // Mirror paths are explicit; a picker link alone never grants authorization.
    if(url.origin!==sandbox.location.origin) continue;
    const id=byFile.get(url.pathname.slice(1));
    if(id) ids.add(id);
  }
  return ids;
}
function readCurrent(file){return fs.readFileSync(path.join(ROOT,file),'utf8');}
function readBase(base,file){return execFileSync('git',['show',base+':'+file],{cwd:ROOT,encoding:'utf8',maxBuffer:32*1024*1024});}
function readOldReceipts(base){
  const names=execFileSync('git',['ls-tree','--name-only',base,'--',RECEIPTS],{cwd:ROOT,encoding:'utf8'}).trim();
  return names ? parseReceipts(readBase(base,RECEIPTS)) : [];
}
function main(base){
  if(!/^[0-9a-f]{40}$/.test(base)) throw Error('Pass an exact base commit SHA');
  const before=JSON.parse(readBase(base,MANIFEST));
  const after=JSON.parse(readCurrent(MANIFEST));
  const {validateTrainerManifest}=require('../board-server/trainer-registry');
  const result=validateTrainerManifest(after);
  if(!result.ok) throw Error('Invalid candidate manifest: '+result.error);
  const root=fs.realpathSync(ROOT);
  for(const row of after.trainers){
    const target=fs.realpathSync(path.resolve(root,row.file));
    if(!target.startsWith(root+path.sep)||!fs.statSync(target).isFile()) throw Error('Invalid catalog file: '+row.file);
  }
  const beforeVisible=visibleMirrorIds(before,JSON.parse(readBase(base,PICKER)),readBase(base,PICKER_JS));
  const afterVisible=visibleMirrorIds(after,JSON.parse(readCurrent(PICKER)),readCurrent(PICKER_JS));
  const report=checkEvolution(before,after,readOldReceipts(base),parseReceipts(readCurrent(RECEIPTS)),beforeVisible,afterVisible);
  if(report.errors.length) throw Error(report.errors.join('\n'));
  console.log('BOARD_PLATFORM_PREFLIGHT_OK: '+JSON.stringify({base,catalog:after.trainers.length,mirrors:result.trainers.length,discoverable:afterVisible.size,added:report.additions,reviewedTransitions:report.approved}));
}
if(require.main===module){
  try{main(process.argv[2]||'');}catch(error){console.error('BOARD_PLATFORM_PREFLIGHT_FAILED: '+error.message);process.exitCode=1;}
}
module.exports={capability,checkEvolution,visibleMirrorIds,parseReceipts};
