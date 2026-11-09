'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {canonicalProfileLearningScripts}=require('./public-page-script.cjs');
const map=['journey.js?v=20261109','second-part.js?v=20261109'];
const runtime=['geometry-data.js','state.js?v=20261101-trainer-repair','calm-ui.js?v=20261109-journey','app.js?v=20261109-journey'];
const boardRuntime=['geometry-data.js','state.js?v=20261101-trainer-repair','calm-ui.js?v=20261101-trainer-repair','app.js?v=20261101-trainer-repair'].map(src=>'/ege-profil/start/'+src);
const html=sources=>sources.map(src=>'<script defer src="'+src+'"></script>').join('\n');
const canonical=html([...map,...runtime]),wrapper=html(boardRuntime);
function parity(page=canonical,board=wrapper){
 const actual=[...board.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g)].map(match=>match[1]);
 assert.deepEqual(actual,canonicalProfileLearningScripts(page,board).map(src=>'/ege-profil/start/'+src));
}

test('board contract excludes exactly two public map modules and permits only the reviewed runtime stamps',()=>{
 parity();
 assert.deepEqual(canonicalProfileLearningScripts(canonical,wrapper),boardRuntime.map(src=>src.slice('/ege-profil/start/'.length)));
});
test('adding, removing or reordering any learning script breaks parity in either page',()=>{
 for(const changed of [
  [...runtime,'unreviewed.js'], runtime.filter(src=>!src.startsWith('state.js')),
  [runtime[1],runtime[0],...runtime.slice(2)]
 ])assert.throws(()=>parity(html([...map,...changed]),wrapper));
 for(const changed of [
  [...boardRuntime,'/ege-profil/start/unreviewed.js'],boardRuntime.slice(1),
  [boardRuntime[1],boardRuntime[0],...boardRuntime.slice(2)]
 ])assert.throws(()=>parity(canonical,html(changed)));
});
test('unknown cache queries are rejected for reviewed and ordinary learning scripts',()=>{
 for(const src of runtime)assert.throws(()=>parity(canonical.replace(src,src.split('?')[0]+'?v=unreviewed'),wrapper));
 for(const src of boardRuntime)assert.throws(()=>parity(canonical,wrapper.replace(src,src.split('?')[0]+'?v=unreviewed')));
});
test('public map modules must appear once, first, in order and as exact deferred includes',()=>{
 for(const changed of [
  html([...map.slice(1),...runtime]),html([...map,...map,...runtime]),html([...map].reverse().concat(runtime)),
  html([runtime[0],...map,...runtime.slice(1)]),canonical.replace('journey.js?v=20261109','journey.js?v=unreviewed'),
  canonical.replace('<script defer src="journey.js','<script async src="journey.js')
 ])assert.throws(()=>canonicalProfileLearningScripts(changed,wrapper));
});
test('board wrappers explicitly reject either public map module, including equivalent local paths',()=>{
 for(const src of ['/ege-profil/start/journey.js?v=20261109','/ege-profil/start/second-part.js?v=20261109','./journey.js','../start/second-part.js'])
  assert.throws(()=>canonicalProfileLearningScripts(canonical,wrapper+html([src])),/Board wrappers must not load public map modules/);
});
