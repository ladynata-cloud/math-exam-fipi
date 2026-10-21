'use strict';
// Final cloud gate: untrusted/incomplete shard evidence never becomes combined PASS.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {EXPECTED_COUNT,combine}=require('./browser-shards.cjs');
const sha=data=>crypto.createHash('sha256').update(data).digest('hex');
function collect({input,out,lessons,options}){
 input=path.resolve(input);out=path.resolve(out);assert(out!==input&&!out.startsWith(input+path.sep),'output is separate from inputs');
 assert(/^[a-f0-9]{40}$/.test(options.commit),'collector requires the exact CI Git SHA');
 assert.equal(options.count,4,'production collection requires all four shards');
 const entries=fs.readdirSync(input,{withFileTypes:true}),wanted=Array.from({length:options.count},(_,i)=>'atanasyan-textbook-shard-'+i);
 assert.deepEqual(entries.map(x=>x.name).sort(),wanted.sort(),'exact four artifact directories');assert(entries.every(x=>x.isDirectory()&&!x.isSymbolicLink()),'artifact directories only');
 const inputs=entries.map(entry=>{
  const dir=path.join(input,entry.name),file=path.join(dir,'browser-evidence.json');assert(fs.lstatSync(file).isFile(),'regular evidence file');const raw=fs.readFileSync(file),evidence=JSON.parse(raw);
  assert.equal(entry.name,'atanasyan-textbook-shard-'+evidence.shard?.index,'artifact name matches shard index');return {dir,evidence,sha256:sha(raw)};
 });
 const evidence=combine(inputs.map(x=>x.evidence),lessons,options),pngs=new Map();
 const provenance={schemaVersion:1,commit:options.commit,authoredFileSha256:options.authoredFileSha256,bundleFileSha256:options.bundleFileSha256,shardCount:options.count,shards:[],pngs:[]};
 for(const item of inputs){
  const shots=[...item.evidence.screenshots,...item.evidence.expansionScreenshots],expected=['browser-evidence.json',...shots.map(x=>x.file)].sort(),files=fs.readdirSync(item.dir,{withFileTypes:true});
  assert.deepEqual(files.map(x=>x.name).sort(),expected,'no missing or extra artifact files');assert(files.every(x=>x.isFile()&&!x.isSymbolicLink()),'artifact regular files only');
  for(const shot of shots){assert(/^[a-z0-9-]+\.png$/.test(shot.file),'flat safe PNG filename');assert(!pngs.has(shot.file),'no duplicate PNG filename');const file=path.join(item.dir,shot.file),bytes=fs.readFileSync(file);assert(bytes.length>=45&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))&&bytes.toString('ascii',12,16)==='IHDR','actual PNG '+shot.file);assert.equal(bytes.readUInt32BE(16),shot.width,'PNG viewport width');assert(bytes.readUInt32BE(20)>0,'positive PNG height');pngs.set(shot.file,{file,bytes});provenance.pngs.push({file:shot.file,sha256:sha(bytes),bytes:bytes.length,shard:item.evidence.shard.index});}
  provenance.shards.push({index:item.evidence.shard.index,evidenceSha256:item.sha256,assignedIds:item.evidence.shard.assignedIds,cards:item.evidence.cards.length,screenshots:shots.length,completed:true});
 }
 assert.equal(pngs.size,evidence.screenshots.length+evidence.expansionScreenshots.length,'all flat PNGs');
 if(fs.existsSync(out))assert.deepEqual(fs.readdirSync(out),[],'output must be empty, no stale artifacts');else fs.mkdirSync(out,{recursive:true});
 for(const [name,item] of pngs)fs.writeFileSync(path.join(out,name),item.bytes);
 provenance.shards.sort((a,b)=>a.index-b.index);provenance.pngs.sort((a,b)=>a.file.localeCompare(b.file));
 fs.writeFileSync(path.join(out,'browser-evidence.json'),JSON.stringify(evidence,null,2));fs.writeFileSync(path.join(out,'browser-shards-provenance.json'),JSON.stringify(provenance,null,2));
 return {cards:evidence.cards.length,labels:evidence.labels.length,screenshots:pngs.size,expansions:evidence.expansions.length,twoTabs:evidence.twoTabs.length};
}
function main(){
 const root=path.resolve(process.env.TEXTBOOK_ROOT||path.join(__dirname,'../..')),bundle=path.join(root,'stereo-course/textbook/data/course.json'),expected=path.resolve(process.env.TEXTBOOK_EXPECTED_BUNDLE||bundle),raw=fs.readFileSync(expected),data=JSON.parse(raw),lessons=Array.isArray(data)?data:data.lessons;
 assert.equal(lessons.length,Number(process.env.TEXTBOOK_EXPECTED_COUNT||EXPECTED_COUNT),'explicit authored batch count');
 const result=collect({input:process.env.TEXTBOOK_SHARD_INPUT||'artifacts/shards',out:process.env.TEXTBOOK_ARTIFACTS||'artifacts/textbook',lessons,options:{count:Number(process.env.TEXTBOOK_SHARD_COUNT||4),commit:process.env.GITHUB_SHA,authoredFileSha256:sha(raw),bundleFileSha256:sha(fs.readFileSync(bundle)),separateAuthorBundle:!!process.env.TEXTBOOK_EXPECTED_BUNDLE}});
 console.log('ATANASYAN_TEXTBOOK_SHARDS_OK: '+JSON.stringify(result));
}
if(require.main===module){try{main();}catch(error){console.error(error);process.exitCode=1;}}
module.exports={collect};
