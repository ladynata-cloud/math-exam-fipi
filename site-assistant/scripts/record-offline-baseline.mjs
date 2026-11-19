// Record the current rules honestly, including the questions they cannot answer.
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { respond } from '../dialogue.mjs';
import { loadEvaluation } from './evaluate-predictions.mjs';
import { repositoryRoot, sha256 } from './training-data.mjs';
const args=process.argv.slice(2);
if(args.length!==2 || args[0]!=='--output') throw new Error('Usage: record-offline-baseline.mjs --output <new-directory>');
const output=resolve(args[1]);
const evaluation=await loadEvaluation();
const predictions=[];
for(const item of evaluation.runtimeCases) {
  if(item.unsupportedReason) {
    predictions.push({id:item.id,status:'unsupported',reason:item.unsupportedReason});
    continue;
  }
  let state, answer, previousSite;
  for(const request of item.requests) {
    if(previousSite!==request.site) state=undefined;
    answer=respond({...request,...(state?{state}:{})});
    state=answer.state;
    previousSite=request.site;
  }
  if(!answer) throw new Error('Runtime case has no requests: '+item.id);
  const links=answer.links.map(link=>`${link.label} — ${link.url}`).join('\n');
  predictions.push({id:item.id,response:answer.reply+(links?'\n'+links:'')});
}
const code={};
for(const path of ['site-assistant/dialogue.mjs','assets/assistant/navigator-data.js','assets/assistant/division-dialogue.js','site-assistant/reader/search.cjs','site-assistant/reader/pilot.json','site-assistant/tarot/rules.cjs','site-assistant/tarot/symbols.json']) code[path]=sha256(await readFile(resolve(repositoryRoot,path)));
await mkdir(dirname(output),{recursive:true});
await mkdir(output);
await writeFile(resolve(output,'predictions.jsonl'),predictions.map(row=>JSON.stringify(row)).join('\n')+'\n');
await writeFile(resolve(output,'run.json'),JSON.stringify({kind:'runtime',label:'offline-rules',model:null,providerCalls:0,evalSetHash:evaluation.evalSetHash,runtimeSetHash:evaluation.runtimeSetHash,answered:predictions.filter(p=>p.response).length,unsupported:predictions.filter(p=>p.status==='unsupported').length,code},null,2)+'\n');
console.log(JSON.stringify({output,total:predictions.length,answered:predictions.filter(p=>p.response).length,unsupported:predictions.filter(p=>p.status==='unsupported').length,providerCalls:0}));
