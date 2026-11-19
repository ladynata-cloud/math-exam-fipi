// Offline preparation only. No provider client, credentials, uploads or model calls.
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import navigator from '../../assets/assistant/navigator-data.js';
import { validateInput, loadEvaluation } from './evaluate-predictions.mjs';

export const serviceRoot = fileURLToPath(new URL('../', import.meta.url));
export const trainingRoot = resolve(serviceRoot, 'training');
export const repositoryRoot = resolve(serviceRoot, '..');
export const origins = Object.freeze({math:'https://mathexam.space', reader:'https://usel-toski-po-miru.art', tarot:'https://kabbala-tarot.online'});
export const sha256 = value => createHash('sha256').update(value).digest('hex');
export const normalizeQuestion = text => text.normalize('NFKC').toLowerCase().replace(/ё/g,'е').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const assert = (ok, message) => { if (!ok) throw new Error(message); };
const object = value => value && typeof value === 'object' && !Array.isArray(value);

export async function readJsonl(path) {
  const text = await readFile(path, 'utf8');
  assert(text.trim().length > 0, 'Empty JSONL: '+path);
  return text.trimEnd().split(/\r?\n/).map((line,index) => {
    assert(line.trim().length > 0, `Blank JSONL row ${index+1}: ${path}`);
    try { return JSON.parse(line); } catch { throw new Error(`Invalid JSONL row ${index+1}: ${path}`); }
  });
}

export function validateTrainingRows(datasets, provenance, holdouts = []) {
  const ids = new Set(), prompts = new Set(), dialogues = new Set();
  const counts = {};
  assert(Array.isArray(provenance), 'Provenance must be an array');
  for (const [site,origin] of Object.entries(origins)) {
    const rows = datasets[site];
    assert(Array.isArray(rows) && rows.length > 0, 'Missing dataset '+site);
    const sources = provenance.filter(p => p.site === site);
    assert(sources.length === rows.length, 'Provenance count mismatch: '+site);
    counts[site] = rows.length;
    const lines = new Set();
    for (const source of sources) {
      assert(Number.isInteger(source.line) && source.line >= 1 && source.line <= rows.length && !lines.has(source.line), 'Duplicate or invalid provenance line: '+site);
      lines.add(source.line);
    }
    for (const [index,row] of rows.entries()) {
      const label = `${site}:${index+1}`;
      assert(object(row) && Object.keys(row).length === 1 && Array.isArray(row.messages), 'Only messages permitted in training row '+label);
      assert(row.messages.map(m=>m.role).join(',') === 'system,user,assistant,user,assistant', 'Expected two complete turns: '+label);
      for (const message of row.messages) {
        assert(object(message) && Object.keys(message).every(key=>['role','content'].includes(key)), 'Unexpected message fields: '+label);
        assert(typeof message.content === 'string' && message.content.trim() && message.content.length <= 18000, 'Invalid or excessive message: '+label);
        assert(!/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/u.test(message.content), 'Control character: '+label);
        assert(!/(?:sk-[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9]{20,}|-----BEGIN .*PRIVATE KEY-----|(?:api[_-]?key|authorization)\s*[:=]\s*["']?(?:bearer\s+)?[A-Za-z0-9_.-]{16,})/iu.test(message.content), 'Possible credential: '+label);
        assert(!/\/(?:workspace|home|Users)\//u.test(message.content), 'Machine path: '+label);
      }
      const source = sources.find(p=>p.line === index+1);
      assert(source && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(source.id) && !ids.has(source.id), 'Missing or duplicate provenance ID: '+label);
      ids.add(source.id);
      assert(source.split === 'train' && source.creation === 'editorial_synthetic', 'Unapproved training origin: '+label);
      assert(typeof source.source_locator === 'string' && source.source_locator.trim(), 'Missing source locator: '+label);
      assert(typeof source.family === 'string' && source.family.trim(), 'Missing scenario family: '+label);
      assert(new URL(source.source_url).origin === origin, 'Cross-site source: '+label);
      assert(row.messages[0].content.includes(source.source_url), 'Source absent from context: '+label);
      assert(typeof source.source_repository === 'string' && /^ladynata-cloud\/[a-z0-9-]+$/.test(source.source_repository), 'Missing repository provenance: '+label);
      assert(/^[0-9a-f]{40}$/.test(source.source_revision), 'Unpinned source: '+label);
      assert(Array.isArray(source.source_paths) && source.source_paths.length && source.source_paths.every(path=>typeof path==='string' && path && !path.startsWith('/') && !path.split(/[\\/]/).includes('..') && !path.includes('\\')), 'Unsafe source path: '+label);
      assert(Array.isArray(source.entity_ids) && source.entity_ids.every(id=>typeof id==='string' && id.trim()), 'Invalid source IDs: '+label);
      const fingerprint = sha256(JSON.stringify(row.messages));
      assert(!dialogues.has(fingerprint), 'Duplicate complete dialogue: '+label);
      dialogues.add(fingerprint);
      for (const message of row.messages.filter(m=>m.role==='user')) prompts.add(normalizeQuestion(message.content));
    }
  }
  assert(ids.size === provenance.length, 'Unexpected provenance site or record');
  for (const item of holdouts) {
    assert(typeof item.id === 'string' && item.id && !ids.has(item.id), 'Duplicate train/evaluation ID');
    ids.add(item.id);
    if(Object.hasOwn(item,'messages')) validateInput(item);
    // Check all supplied user turns, not just the final question.
    const questions = item.messages?.filter(m=>m.role==='user').map(m=>m.content) ?? [item.user];
    for (const question of questions) {
      assert(typeof question==='string' && question.trim(), 'Missing evaluation question: '+item.id);
      assert(!prompts.has(normalizeQuestion(question)), 'Question leaks between train and evaluation: '+item.id);
    }
  }
  return {counts,total:Object.values(counts).reduce((a,b)=>a+b,0),evaluationCases:holdouts.length};
}

export async function sourceAllowlist() {
  const reader = JSON.parse(await readFile(resolve(serviceRoot,'reader/pilot.json'),'utf8'));
  const tarot = JSON.parse(await readFile(resolve(serviceRoot,'tarot/symbols.json'),'utf8'));
  const urls = new Set([origins.math+'/',origins.reader+'/poisk-po-pamyati/',origins.tarot+'/']);
  for (const item of navigator.catalogue) urls.add(new URL(item.url,origins.math).href);
  for (const item of reader.before) urls.add(item.url);
  for (const item of reader.after) {
    urls.add(item.url);
    for (const link of [...(item.sources??[]),...(item.sections??[])]) urls.add(link.url);
  }
  for (const item of tarot.records) {
    urls.add(item.url);
    for (const link of item.sources) urls.add(link.url);
  }
  const supplemental = JSON.parse(await readFile(resolve(trainingRoot,'supplemental-sources.json'),'utf8'));
  for (const source of supplemental.sources) urls.add(source.url);
  return {urls,reader,tarot,supplemental};
}

export async function checkTraining() {
  const datasets = Object.fromEntries(await Promise.all(Object.keys(origins).map(async site=>[site,await readJsonl(resolve(trainingRoot,`train-${site}.jsonl`))])));
  const provenance = await readJsonl(resolve(trainingRoot,'provenance.jsonl'));
  const routing = await readJsonl(resolve(trainingRoot,'routing-holdout.jsonl'));
  const evaluation = (await loadEvaluation()).inputs;
  const summary = validateTrainingRows(datasets,provenance,[...routing,...evaluation]);
  const sources = await sourceAllowlist();
  const inventory=JSON.parse(await readFile(resolve(trainingRoot,'provenance-sources.json'),'utf8'));
  validateProvenanceInventory(provenance,inventory);
  const pins=JSON.parse(await readFile(resolve(trainingRoot,'source-pins.json'),'utf8'));
  for(const [path,expected] of Object.entries(pins.runtime_snapshots)) {
    assert(/^[a-f0-9]{64}$/.test(expected) && sha256(await readFile(resolve(repositoryRoot,path)))===expected, 'Runtime source changed since source review: '+path);
  }
  const knownIds = new Set([...navigator.catalogue.map(item=>item.id),...sources.reader.before.map(item=>item.id),...sources.tarot.records.map(item=>item.id)]);
  for (const source of provenance) {
    assert(sources.urls.has(source.source_url), 'Unlisted source URL: '+source.id+' '+source.source_url);
    if (source.source_repository==='ladynata-cloud/math-exam-fipi') {
      for (const path of source.source_paths) {
        const full = resolve(repositoryRoot,path);
        assert(!relative(repositoryRoot,full).startsWith('..'+sep), 'Escaped source path');
        await readFile(full); // Fail if the declared local source is missing.
      }
      for (const id of source.entity_ids) assert(knownIds.has(id), 'Unknown source entity: '+source.id+' '+id);
    } else {
      for (const path of source.source_paths) assert(sources.supplemental.sources.some(record=>record.repository===source.source_repository && record.revision===source.source_revision && record.path===path && /^[a-f0-9]{64}$/.test(record.sha256)), 'External source is not pinned in supplemental inventory: '+source.id);
    }
  }
  return {...summary,datasets,provenance,coverage:{mathDestinations:navigator.catalogue.length,readerBefore:sources.reader.before.length,readerAfter:sources.reader.after.length,tarotEntities:sources.tarot.records.length}};
}

export function validateProvenanceInventory(provenance,inventory) {
  assert(inventory.version===1 && Array.isArray(inventory.sources), 'Missing historical source inventory');
  for(const source of provenance) for(const path of source.source_paths) {
    const pinned=inventory.sources.find(item=>item.repository===source.source_repository && item.revision===source.source_revision && item.path===path);
    assert(pinned && /^[a-f0-9]{40}$/.test(pinned.git_blob) && /^[a-f0-9]{64}$/.test(pinned.sha256) && Number.isSafeInteger(pinned.bytes) && pinned.bytes>0, 'Unverified historical source: '+source.id+' '+path);
  }
}

export async function walkFiles(root, prefix='', exclude=()=>false) {
  const files=[];
  for (const item of (await readdir(root,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name,'en'))) {
    const rel=prefix+item.name;
    if(exclude(rel)) continue;
    if(item.isDirectory()) files.push(...await walkFiles(resolve(root,item.name),rel+'/',exclude));
    else if(item.isFile()) files.push(rel);
  }
  return files;
}

export async function buildManifest() {
  const checked = await checkTraining();
  const paths = (await walkFiles(trainingRoot)).filter(path=>path!=='manifest.json');
  const files={};
  for (const path of paths) {
    const data=await readFile(resolve(trainingRoot,path));
    files[path]={bytes:data.length,sha256:sha256(data)};
  }
  const knowledge={};
  for(const path of ['assets/assistant/navigator-data.js','assets/assistant/division-dialogue.js','site-assistant/reader/pilot.json','site-assistant/reader/search.cjs','site-assistant/tarot/symbols.json','site-assistant/tarot/rules.cjs']) {
    const data=await readFile(resolve(repositoryRoot,path));
    knowledge[path]={bytes:data.length,sha256:sha256(data)};
  }
  const tooling={};
  for(const path of await toolkitPaths()) {
    if(path.startsWith('site-assistant/training/') || Object.hasOwn(knowledge,path)) continue;
    const data=await readFile(resolve(repositoryRoot,path));
    tooling[path]={bytes:data.length,sha256:sha256(data)};
  }
  return {schemaVersion:1,status:'prepared_for_offline_review',modelTraining:'not_run',counts:checked.counts,totalTrainingDialogues:checked.total,evaluationCases:checked.evaluationCases,coverage:checked.coverage,files,knowledge,tooling};
}

export async function toolkitPaths() {
  const excluded=['prepared','reports','node_modules','.git'];
  const files=(await walkFiles(serviceRoot,'',path=>excluded.some(dir=>path===dir || path.startsWith(dir+'/')))).filter(path=>
    ['package.json','README.md','Dockerfile','server.mjs','dialogue.mjs','client.js','demo.js','demo.html','demo.css'].includes(path) ||
    /^(?:scripts|test|reader|tarot|training)\/.+\.(?:mjs|js|cjs|json|jsonl|md)$/.test(path));
  return [...files.map(path=>'site-assistant/'+path),'assets/assistant/navigator-data.js','assets/assistant/division-dialogue.js'].sort();
}
