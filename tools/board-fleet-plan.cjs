'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const ROOT=path.resolve(__dirname,'..');
const MANIFEST='trainers/board-compat.json';
function project(row) {
  return {trainerId:row.trainerId,file:row.file,version:row.version,stateSchemaVersion:row.stateSchemaVersion,bridgeProtocolVersion:row.bridgeProtocolVersion,allowLegacyHtml:row.allowLegacyHtml};
}

function mirrors(manifest) {
  if(!manifest || !Array.isArray(manifest.trainers))throw Error('Invalid manifest');
  const list=manifest.trainers.filter(x=>x.boardCompatibility==='board-mirror');
  return list.sort((a,b)=>a.trainerId<b.trainerId?-1:a.trainerId>b.trainerId?1:0);
}

function directChange(file, changed) {
  const stem=file.replace(/\.html$/,'');
  if(changed===file||changed.startsWith(stem+'.')||changed.startsWith(stem+'-'))return true;
  if(file.endsWith('/index.html')){
    const folder=file.slice(0,-'index.html'.length);
    return changed.startsWith(folder);
  }
  return false;
}

function selectMirrors(current, previous, changed, all=false) {
  const list=mirrors(current);
  const shared=changed.some(file=>/^tools\/board-fleet(?:[-.]|$)/.test(file)||
    file==='.github/workflows/board-fleet-acceptance.yml'||
    file==='trainers/trainer-board.html'||
    /^trainers\/board-(?:bridge|picker|writing|layout|workspace|ink|images|tools)\.(?:js|css)$/.test(file)||
    /^board-server\/(?:index|trainer-registry|room-store)\.js$/.test(file));
  if(all||shared)return {mode:all?'full-manual':'full-shared-change',entries:list};
  const old=new Map(mirrors(previous).map(row=>[row.trainerId,JSON.stringify(project(row))]));
  return {mode:'changed-mirrors',entries:list.filter(row=>old.get(row.trainerId)!==JSON.stringify(project(row))||changed.some(file=>directChange(row.file,file)))};
}

function partition(entries,index,total) {
  if(!Number.isSafeInteger(index)||!Number.isSafeInteger(total)||total<1||index<0||index>=total)throw Error('Invalid shard');
  return entries.filter((_,i)=>i%total===index);
}

function plan(base,index,total,all=false){
  const current=JSON.parse(fs.readFileSync(path.join(ROOT,MANIFEST),'utf8'));
  let previous=current,changed=[];
  if(!all){
    if(!/^[0-9a-f]{40}$/.test(base||''))throw Error('Expected exact merge-base commit SHA');
    previous=JSON.parse(execFileSync('git',['show',base+':'+MANIFEST],{cwd:ROOT,encoding:'utf8'}));
    changed=execFileSync('git',['diff','--name-only','-z',base,'HEAD'],{cwd:ROOT,encoding:'utf8',maxBuffer:16*1024*1024}).split('\0').filter(Boolean);
  }
  const selected=selectMirrors(current,previous,changed,all);
  return {mode:selected.mode,total:selected.entries.length,entries:partition(selected.entries,index,total),manifest:current};
}
function args(argv){
  const options={all:false,base:'',index:0,total:1,planOnly:false};
  for(let i=0;i<argv.length;i++){
    if(argv[i]==='--all')options.all=true;
    else if(argv[i]==='--base')options.base=argv[++i];
    else if(argv[i]==='--index')options.index=Number(argv[++i]);
    else if(argv[i]==='--total')options.total=Number(argv[++i]);
    else if(argv[i]==='--plan')options.planOnly=true;
    else throw Error('Unknown argument '+argv[i]);
  }
  if(options.all&&options.base)throw Error('Use either --all or --base');
  return options;
}
module.exports={project,mirrors,directChange,selectMirrors,partition,plan,args};
