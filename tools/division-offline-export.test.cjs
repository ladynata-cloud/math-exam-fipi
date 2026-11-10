'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');
const {JSDOM, VirtualConsole, ResourceLoader} = require('jsdom');
const {restorePublicNavigator, snippet, rollout} = require('./public-navigator-preservation.cjs');
const root = path.resolve(__dirname, '..');
const file = 'downloads/trainers/long-division-stepwise/long-division-stepwise.html';
const sourceFile = 'trainers/long-division-stepwise.html';
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const tick = () => new Promise(resolve => setImmediate(resolve));
const entry = require('../downloads/trainers-manifest.json').trainers.find(x => x.slug === 'long-division-stepwise');

test('the sanctioned source update is bound to only its exact navigator pair', () => {
  const raw = read(sourceFile), row = rollout.addedPages[sourceFile];
  assert.equal(hash(raw), row.afterSha256);
  assert.equal(hash(raw.replace(snippet, '')), row.beforeSha256);
  assert.equal(restorePublicNavigator(sourceFile, raw).toString(), raw.replace(snippet, ''));
  for (const mutation of [raw + '\n<!-- unreviewed -->', raw.replace(snippet, snippet + snippet), raw.replace('navigator-widget.js?v=20261105-site1', 'navigator-widget.js?v=other')]) assert.equal(restorePublicNavigator(sourceFile, mutation).toString(), mutation, 'Unknown bytes cannot be stripped by the receipt');
});

test('the exported HTML contains the current teaching and all bundled dependencies', () => {
  const d = new JSDOM(read(file)).window.document;
  assert.equal(d.querySelectorAll('script[src],link[rel="stylesheet"][href]').length, 0, 'Single-file export has no required external asset');
  assert.equal(d.querySelectorAll('[data-inline-source]').length, entry.inlineAssets.length);
  for (const asset of entry.inlineAssets) {
    const node = d.querySelector('[data-inline-source="' + asset + '"]'); assert(node, asset);
    const raw = read(asset.slice(1));
    const encoded = asset.endsWith('.js') ? raw.replace(/<\/script/gi, '<\\/script') : raw.replace(/<\/style/gi, '<\\/style');
    assert.equal(hash(node.textContent), hash('\n' + encoded + '\n'), 'No stale or transformed implementation in the export: ' + asset);
  }
});

test('the ZIP includes byte-identical current HTML and its adaptation prompt', () => {
  const zip = path.join(root, 'downloads/trainers/long-division-stepwise/long-division-stepwise-package.zip');
  const result = JSON.parse(execFileSync('python3', ['-c', 'import sys,zipfile,hashlib,json\nwith zipfile.ZipFile(sys.argv[1]) as z:\n print(json.dumps({n:hashlib.sha256(z.read(n)).hexdigest() for n in z.namelist()}))', zip], {encoding:'utf8'}));
  for (const name of ['long-division-stepwise.html', 'long-division-stepwise-deepseek-prompt.md']) assert.equal(result[name], hash(read('downloads/trainers/long-division-stepwise/' + name)), name);
});

test('a file URL completes division and builds multiples without loading website assets', async t => {
  const errors = [], requests = [];
  const console = new VirtualConsole(); console.on('jsdomError', error => errors.push(error.message));
  class OfflineLoader extends ResourceLoader { fetch(url) { requests.push(url); return null; } }
  const local = new Map();
  const storage = {getItem:key=>local.has(key)?local.get(key):null,setItem:(key,value)=>local.set(key,String(value)),removeItem:key=>local.delete(key)};
  const dom = new JSDOM(read(file), {
    url:'file:///tmp/long-division-stepwise.html?multiples=build#start', runScripts:'dangerously', resources:new OfflineLoader(), pretendToBeVisual:true, virtualConsole:console,
    beforeParse(w) {
      Object.defineProperty(w, 'localStorage', {value:storage});
      Object.defineProperty(w, 'sessionStorage', {value:storage});
      w.HTMLElement.prototype.scrollIntoView=()=>{};
      w.scrollTo=()=>{};
      w.structuredClone=structuredClone;
    }
  });
  t.after(()=>dom.window.close());
  const w=dom.window,d=w.document;
  await tick(); await tick();
  assert(w.__divisionGuidedDebug, 'Native engine initialized offline: ' + errors.join('; '));
  for(let n=1;n<=9;n++) {
    const input=d.querySelector('[data-multiple-input="'+n+'"]'); assert(input,'Multiples exercise is bundled');
    input.value=String(2*n); input.dispatchEvent(new w.Event('input',{bubbles:true}));
    d.querySelector('[data-multiple-check="'+n+'"]').click();
  }
  assert(w.__divisionGuidedDebug.state().sessions.start.multiples.checked.every(Boolean));
  let finished=false;
  for (let turn=0;turn<100;turn++) {
    const state=w.__divisionGuidedDebug.state(),s=state.sessions[state.active];
    if(s.done){finished=true;break;}
    const action=w.DivisionGuided.plan(s.task).actions[s.step];
    if(action.options)d.querySelector('[data-option="'+action.answer+'"]').click();
    else d.getElementById('answer').value=action.answer;
    d.getElementById('answer-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
  }
  assert(finished,'Complete all written actions offline');
  assert.equal(d.querySelector('.quotient').textContent.replace(/\s/g,''),'24');
  assert.equal(w.__divisionGuidedDebug.state().records.length,1);
  assert.equal(w.__divisionGuidedDebug.state().records[0].hints,1,'Using the table remains assisted practice offline');
  for(const link of d.querySelectorAll('.skill-support a'))assert.equal(new URL(link.href).origin,'https://mathexam.space',link.href);
  assert.equal(d.querySelector('[data-skill="subtract"]').target,'_blank');
  assert.equal(d.querySelectorAll('script[src],link[rel="stylesheet"][href]').length,0);
  assert.deepEqual(requests,[],'No local or network dependency was requested');
  assert.deepEqual(errors,[],'No runtime exceptions');
});
