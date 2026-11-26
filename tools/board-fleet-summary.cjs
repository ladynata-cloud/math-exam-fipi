'use strict';
const fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const {plan,args}=require('./board-fleet-plan.cjs');
function combine(reports,expected,commit,base,shards,mode){
  const failures=[],rows=[],seen=new Set();
  for(let i=0;i<shards;i++){
    const report=reports[i],planned=expected.filter((_,j)=>j%shards===i);
    if(!report){failures.push('Missing report: shard '+i);continue;}
    if(report.schemaVersion!==1||report.commit!==commit||report.base!==base||report.mode!==mode||report.selected!==expected.length||report.shard!==i||report.shards!==shards)failures.push('Wrong candidate identity: shard '+i);
    if(JSON.stringify(report.plannedIds)!==JSON.stringify(planned))failures.push('Wrong planned coverage: shard '+i);
    if(report.infrastructureError)failures.push('Infrastructure error: shard '+i+' '+report.infrastructureError);
    if(!Array.isArray(report.rows)){failures.push('Invalid rows: shard '+i);continue;}
    for(const row of report.rows){
      if(!planned.includes(row.trainerId))failures.push('Unexpected trainer: '+row.trainerId+' in shard '+i);
      if(seen.has(row.trainerId))failures.push('Duplicate trainer: '+row.trainerId);
      seen.add(row.trainerId);rows.push(row);
      if(row.status!=='PASS')failures.push('Trainer failed: '+row.trainerId+' at '+row.stage);
    }
    for(const id of planned)if(!report.rows.some(row=>row.trainerId===id))failures.push('Not checked: '+id);
  }
  return {schemaVersion:1,commit,base,mode,expected:expected.length,checked:seen.size,passed:rows.filter(x=>x.status==='PASS').length,failed:rows.filter(x=>x.status!=='PASS').length,failures,rows:rows.sort((a,b)=>a.trainerId<b.trainerId?-1:a.trainerId>b.trainerId?1:0)};
}
function main(){
  const folder=process.env.BOARD_FLEET_REPORT_DIR||path.resolve(__dirname,'../artifacts/board-fleet');
  const opt=args(process.argv.slice(2));
  const selection=plan(opt.base,0,1,opt.all);
  const commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),reports=[];
  for(let i=0;i<opt.total;i++){
    try{reports.push(JSON.parse(fs.readFileSync(path.join(folder,'shard-'+i+'.json'),'utf8')));}catch(_){reports.push(null);}
  }
  const result=combine(reports,selection.entries.map(x=>x.trainerId),commit,opt.base||null,opt.total,selection.mode);
  fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(path.join(folder,'fleet-summary.json'),JSON.stringify(result,null,2)+'\n');
  const text=['## Board fleet — exact candidate acceptance','','Mode: '+result.mode,'','Expected: '+result.expected+'; checked: '+result.checked+'; passed: '+result.passed+'; failed: '+result.failed,'','| Trainer | Result | Stage | Bytes |','|---|---|---|---:|',...result.rows.map(r=>'| '+r.trainerId+' | '+r.status+' | '+r.stage+' | '+(r.stateBytes??'—')+' |'),'','### Coverage and failure diagnostics',...(result.failures.length?result.failures.map(s=>'- '+s):['No failures. All selected mirrors checked exactly once.']),''].join('\n');
  if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,text);
  console.log('BOARD_FLEET_SUMMARY expected='+result.expected+' checked='+result.checked+' passed='+result.passed+' failed='+result.failed+' issues='+result.failures.length);
  if(result.failures.length)process.exitCode=1;
}
if(require.main===module)main();
module.exports={combine};
