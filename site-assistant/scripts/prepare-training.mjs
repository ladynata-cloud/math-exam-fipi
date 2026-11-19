// Build a reproducible, reviewable handoff without contacting a provider.
import { mkdir, readFile, writeFile, realpath } from 'node:fs/promises';
import { resolve, dirname, basename, relative, sep, isAbsolute } from 'node:path';
import { trainingRoot,repositoryRoot,buildManifest,walkFiles,toolkitPaths,sha256 } from './training-data.mjs';
const args=process.argv.slice(2);
if(args.length!==2 || args[0]!=='--output') throw new Error('Usage: prepare-training.mjs --output <new-directory>');
const output=resolve(args[1]);
async function canonicalFuturePath(path) {
  const tail=[];let cursor=path;
  for(;;) {
    try{return resolve(await realpath(cursor),...tail);}
    catch(error) {
      if(error.code!=='ENOENT' || dirname(cursor)===cursor) throw error;
      tail.unshift(basename(cursor));cursor=dirname(cursor);
    }
  }
}
const canonicalOutput=await canonicalFuturePath(output);
const fromTraining=relative(await realpath(trainingRoot),canonicalOutput);
if(canonicalOutput===await realpath(repositoryRoot) || (!isAbsolute(fromTraining) && fromTraining!=='..' && !fromTraining.startsWith('..'+sep))) throw new Error('Output must not overwrite training sources');
const manifest=await buildManifest();
if(await readFile(resolve(trainingRoot,'manifest.json'),'utf8')!==JSON.stringify(manifest,null,2)+'\n') throw new Error('Stale manifest; run training:manifest after review');
async function copyVerified(source,destination,expected) {
  const data=await readFile(source);
  if(sha256(data)!==expected) throw new Error('Source changed during export: '+relative(repositoryRoot,source));
  await mkdir(dirname(destination),{recursive:true});
  await writeFile(destination,data);
}
await mkdir(dirname(output),{recursive:true});
await mkdir(output); // Existing directory is an error: never mix two versions.
for(const path of await walkFiles(trainingRoot)) {
  let destination;
  if(/^train-(math|reader|tarot)\.jsonl$/.test(path)) destination='upload-training/'+path;
  else if(path==='evaluation/inputs.jsonl') destination='evaluation-inputs/inputs.jsonl';
  else destination='review-only/'+path;
  const full=resolve(output,destination);
  const expected=path==='manifest.json'?sha256(JSON.stringify(manifest,null,2)+'\n'):manifest.files[path].sha256;
  await copyVerified(resolve(trainingRoot,path),full,expected);
}
for(const path of Object.keys(manifest.knowledge)) {
  const full=resolve(output,'knowledge',path);
  await copyVerified(resolve(repositoryRoot,path),full,manifest.knowledge[path].sha256);
}
for(const path of await toolkitPaths()) {
  const full=resolve(output,'offline-toolkit',path);
  const trainingPath=path.startsWith('site-assistant/training/')?path.slice('site-assistant/training/'.length):null;
  const expected=trainingPath==='manifest.json'?sha256(JSON.stringify(manifest,null,2)+'\n'):
    trainingPath?manifest.files[trainingPath].sha256:(manifest.knowledge[path]??manifest.tooling[path]).sha256;
  await copyVerified(resolve(repositoryRoot,path),full,expected);
}
// The two shared .js modules are CommonJS. Make the package independent of
// the module type of any directory in which the recipient unpacks it.
await writeFile(resolve(output,'offline-toolkit/package.json'),JSON.stringify({private:true,type:'commonjs'},null,2)+'\n');
if(JSON.stringify(await buildManifest())!==JSON.stringify(manifest)) throw new Error('Sources changed during export; the incomplete directory is not a handoff');
await writeFile(resolve(output,'START-HERE.md'),`# Передача подготовленных помощников\n\nСтатус: материалы и офлайн-проверки. Модель ещё не обучена.\n\n1. Прочитайте review-only/HANDOFF.md и review-only/DATASET_CARD.md.\n2. Для обучения выбирайте только нужные файлы в upload-training/. Каждый файл — отдельная роль.\n3. evaluation-inputs/ предназначен для одинакового испытания базовой и будущей модели.\n4. review-only/ содержит эталоны, рубрики и происхождение. Не включайте его в обучение и не подавайте эталоны модели.\n5. knowledge/ содержит публичные снимки источников, а не готовые ответы на контрольные вопросы.\n6. offline-toolkit/ содержит самостоятельную копию сервера, данных и скриптов. Нужен только Node.js 22+. Выполняйте команды из review-only/README.md, находясь в offline-toolkit/.\n7. Этот пакет не запускает обучение, не загружает данные и не содержит ключей.\n`);
const files={};
for(const path of await walkFiles(output)) {const data=await readFile(resolve(output,path));files[path]={bytes:data.length,sha256:sha256(data)};}
await writeFile(resolve(output,'bundle-manifest.json'),JSON.stringify({schemaVersion:1,trainingManifestSha256:sha256(JSON.stringify(manifest,null,2)+'\n'),files},null,2)+'\n');
console.log(JSON.stringify({output,trainingDialogues:manifest.totalTrainingDialogues,evaluationCases:manifest.evaluationCases,providerCalls:0}));
