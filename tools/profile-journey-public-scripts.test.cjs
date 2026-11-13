'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {canonicalProfileLearningScripts}=require('./public-page-script.cjs');
const map=['../skill-map-data.js?v=20261112-vectors','../azbuka-metodov/catalog.js?v=20261113','../skill-map.js?v=20261113-foundations','journey.js?v=20261113-foundations',
 'second-part.js?v=20261109','practice-feedback.js?v=20261109-active','practice-coach.js?v=20261109-integrity',
 'vector-basics-data.js?v=20261113-foundations','vector-basics-models.js?v=20261112-vectors'];
const runtime=['geometry-data.js?v=20261112-vectors','state.js?v=20261109-integrity','calm-data.js?v=20261112-vectors','calm-ui.js?v=20261113-foundations','app.js?v=20261113-foundations'];
const boardRuntime=['geometry-data.js','state.js?v=20261101-trainer-repair','calm-data.js?v=20261101-finance','calm-ui.js?v=20261101-trainer-repair','app.js?v=20261101-trainer-repair'].map(src=>'/ege-profil/start/'+src);
const html=sources=>sources.map(src=>'<script defer src="'+src+'"></script>').join('\n');
const canonical=html([...map,...runtime]),wrapper=html(boardRuntime);
function parity(page=canonical,board=wrapper){
 const actual=[...board.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g)].map(match=>match[1]);
 assert.deepEqual(actual,canonicalProfileLearningScripts(page,board).map(src=>'/ege-profil/start/'+src));
}

test('board contract excludes public-only modules and permits only the reviewed runtime stamps',()=>{
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
test('public-only modules must appear once, first, in order and as exact deferred includes',()=>{
 for(const changed of [
  html([...map.slice(1),...runtime]),html([...map,...map,...runtime]),html([...map].reverse().concat(runtime)),
  html([runtime[0],...map,...runtime.slice(1)])
 ])assert.throws(()=>canonicalProfileLearningScripts(changed,wrapper));
 for(const src of map){
  assert.throws(()=>canonicalProfileLearningScripts(canonical.replace(src,src.split('?')[0]+'?v=unreviewed'),wrapper));
  assert.throws(()=>canonicalProfileLearningScripts(canonical.replace('<script defer src="'+src,'<script async src="'+src),wrapper));
 }
});
test('board wrappers explicitly reject any public-only module, including equivalent local paths',()=>{
 for(const src of map){
  const filename=src.split('?')[0];
  for(const alias of [new URL(src,'https://mathexam.space/ege-profil/start/index.html').pathname,'./'+filename,'../start/'+filename])
   assert.throws(()=>canonicalProfileLearningScripts(canonical,wrapper+html([alias])),/Board wrappers must not load public-only modules/);
 }
});
