'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {canonicalProfileLearningScripts}=require('./public-page-script.cjs');
const map=['../skill-map-data.js?v=20261112-vectors','../azbuka-metodov/catalog.js?v=20261113-routes','../skill-map.js?v=20261113-foundations','journey.js?v=20261113-foundations',
 'second-part.js?v=20261109','practice-feedback.js?v=20261109-active','practice-coach.js?v=20261109-integrity',
 'vector-basics-data.js?v=20261113-foundations','vector-basics-models.js?v=20261112-vectors'];
const runtime=['geometry-data.js?v=20261112-vectors','state.js?v=20261109-integrity','calm-data.js?v=20261112-vectors','calm-ui.js?v=20261113-foundations','app.js?v=20261113-foundations','checks.js?v=20261114-numeric-domain'];
const boardRuntime=['geometry-data.js','state.js?v=20261101-trainer-repair','calm-data.js?v=20261101-finance','calm-ui.js?v=20261101-trainer-repair','app.js?v=20261101-trainer-repair','checks.js?v=20261101-trainer-repair'].map(src=>'/ege-profil/start/'+src);
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

// The live START entry adds a public download panel. Its full-page navigator
// receipt is checked first; only the exact committed panel can then be inverted.
function downloadFixture(t){
 const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
 const root=path.resolve(__dirname,'..'),name='ege-profil/start/index.html';
 const source=fs.readFileSync(path.join(root,name),'utf8');
 const entry=require('../downloads/trainers-manifest.json').trainers.find(item=>item.sourceHtml==='/'+name);
 assert.ok(entry?.adaptation,'START has its reviewed standalone download');
 const begin='<!-- download-panel:start:'+entry.slug+' -->';
 const end='<!-- download-panel:end:'+entry.slug+' -->\n';
 const from=source.indexOf(begin),to=source.indexOf(end,from);
 assert.ok(from>=0&&to>from,'one complete generated START download panel');
 const panel=source.slice(from,to+end.length);
 const includes='<link rel="stylesheet" href="/assets/download-panel.css">\n'
  +'<link rel="stylesheet" href="/assets/download-adaptation.css">\n'
  +'<script defer src="/assets/download-adaptation.js"></script>\n';
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'profile-download-source-'));
 fs.mkdirSync(path.join(temp,path.dirname(name)),{recursive:true});
 t.after(()=>fs.rmSync(temp,{recursive:true,force:true}));
 const restore=require('./trainer-download-preservation.cjs').restoreTrainerDownload;
 const forBoard=require('./public-page-script.cjs').sourceForProfileBoard;
 return {root,name,source,panel,includes,restore,forBoard,
  checkChanged(changed){
   assert.notEqual(changed,source,'effective source mutation');
   fs.writeFileSync(path.join(temp,name),changed);
   assert.throws(()=>forBoard(temp,''),'an unreviewed complete page cannot become a board source');
  }};
}

test('START board source accepts only its exact reviewed public download controls',t=>{
 const f=downloadFixture(t),{snippet}=require('./public-navigator-preservation.cjs');
 const restored=f.forBoard(f.root,'');
 assert.equal(restored,f.source.replace(snippet,'').replace(f.includes,'').replace(f.panel,''),
  'all teaching markup, inline scripts, styles and learning includes are retained byte for byte');
 assert.doesNotMatch(restored,/data-trainer-download|\/assets\/download-adaptation\.|\/assets\/assistant\/navigator-/);
 assert.ok(restored.includes('id="main"'),'the learner surface remains present');
});

test('altered, duplicate or relocated download panels and assets are rejected',t=>{
 const f=downloadFixture(t);
 for(const changed of [
  f.source.replace(f.panel,f.panel.replace('\n','\n<!-- altered panel -->\n')),
  f.source.replace(f.panel,f.panel+f.panel),
  f.source.replace(f.includes,f.includes+f.includes),
  f.source.replace('/assets/download-adaptation.js','/assets/download-adaptation.js?v=unreviewed'),
  f.source.replace(f.includes,f.includes+'<!-- moved head boundary -->\n'),
  f.source.replace(f.panel,f.panel+'<!-- moved body boundary -->\n')
 ]){
  assert.throws(()=>f.restore(f.name,changed),'exact generated-panel validation rejects mutation');
  f.checkChanged(changed);
 }
 // Missing controls must still fail the full current-page receipt, even when
 // the inverse operation has no panel left to recognize.
 f.checkChanged(f.source.replace(f.panel,''));
 f.checkChanged(f.source.replace(f.includes,'').replace(f.panel,''));
});

test('download inversion cannot conceal unrelated learner or script changes',t=>{
 const f=downloadFixture(t);
 for(const [before,after] of [
  ['id="main"','id="unreviewed-main"'],
  ['geometry-data.js?v=20261112-vectors','geometry-data.js?v=unreviewed']
 ]){
  const changed=f.source.replace(before,after),restored=f.restore(f.name,changed);
  assert.ok(restored.includes(after),'unrelated mutation survives the download inverse');
  assert.doesNotMatch(restored,/data-trainer-download/);
  f.checkChanged(changed);
 }
});
