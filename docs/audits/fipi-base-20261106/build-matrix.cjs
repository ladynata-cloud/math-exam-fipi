'use strict';
// Run with Node from any directory. It reads the shipping course, never the network.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..'),dir=path.join(root,'ege-baza/path');
const html=fs.readFileSync(path.join(dir,'index.html'),'utf8');const scripts=[...html.matchAll(/<script[^>]*?src="([^"?#]+)/g)].map(x=>x[1]);
assert(scripts.includes('models.js'));for(const script of scripts.slice(0,scripts.indexOf('models.js'))){assert(/^[\w-]+\.js$/.test(script));require(path.join(dir,script));}
const D=globalThis.PathData,rows=[],seen=new Set(),column=['position','site_family_id','site_family_title','type','official_bank_id','official_subtype_match','lesson','explanation_evidence','model_evidence','practice_evidence','new_condition_evidence'];
const norm=x=>JSON.stringify(x),seeds=[0,1,2,3,7,11];
for(const m of D.meta.filter(x=>Number.isInteger(x.pos)&&x.pos>=1&&x.pos<=21)){
 assert(!seen.has(m.id));seen.add(m.id);const ts=seeds.map(x=>D.task(m.id,x));
 for(const t of ts){assert(t&&typeof t.q==='string'&&t.q.trim()&&Array.isArray(t.steps)&&t.steps.length,m.id);}
 const full=ts.flatMap(t=>t.steps),n=full.filter(x=>typeof x.why==='string'&&x.why.trim()).length,
 kinds=[...new Set(ts.map(t=>t.model?.kind||'none'))],forms=new Set(ts.map(t=>t.q)).size, payloads=new Set(ts.map(t=>norm([t.q,t.model,t.params,t.steps,t.answer,t.solutions]))).size;
 rows.push([m.pos,m.id,m.title,m.trainingOnly?'supplementary training':'course practice','','unverified: official bank not retrieved','/ege-baza/path/index.html#lesson='+m.id,n+'/'+full.length+' sampled steps include an explanation',kinds.join('|')+' (generator metadata; visual quality not graded here)',seeds.length+' generated tasks; seeds '+seeds.join('/'),forms+' distinct question texts; '+payloads+' distinct task payloads in sample; pupil mastery not measured']);
}
rows.sort((a,b)=>a[0]-b[0]||a[1].localeCompare(b[1],'en'));assert.equal(rows.length,111);assert.equal(new Set(rows.map(x=>x[0])).size,21);assert.equal(rows.filter(x=>x[3]==='supplementary training').length,4);
const q=x=>'"'+String(x).replace(/"/g,'""')+'"';const csv=[column,...rows].map(r=>r.map(q).join(',')).join('\n')+'\n';const target=path.join(__dirname,'coverage-1-21.csv');
if(process.argv.includes('--check'))assert.equal(fs.readFileSync(target,'utf8'),csv);else fs.writeFileSync(target,csv);
console.log(JSON.stringify({siteFamilies:rows.length,positions:21,trainingOnly:4,generatedConditions:rows.length*seeds.length,officialBankIDs:0,lessThan2ObservedQuestionTexts:rows.filter(x=>parseInt(x[10],10)<2).map(x=>x[1])}));
