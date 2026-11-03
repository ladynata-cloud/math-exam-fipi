'use strict';
// Explicit acceptance of published assets and one NEW anonymous synthetic room.
// Never authenticate to a cabinet or use an existing pupil/room identifier.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto'),{spawnSync}=require('node:child_process');
const ROOT=path.resolve(__dirname,'..'),SITE='https://mathexam.space',SERVER='https://mathexam-board-ladynata.msk1.amvera.tech';
const OUT=process.env.GEOMETRY7_PUBLISHED_OUTPUT||'/tmp/geometry7-published';fs.mkdirSync(OUT,{recursive:true});
const report={gate:'GEOMETRY7_PUBLISHED_ACCEPTANCE',startedAt:new Date().toISOString(),head:process.env.GITHUB_SHA||null,status:'RUNNING',assets:[],checks:[],realPupilAccountsUsed:0};
const hash=b=>createHash('sha256').update(b).digest('hex'),pause=ms=>new Promise(r=>setTimeout(r,ms));
const files=['geometry-course/grade7/index.html','geometry-course/board/catalog.json','geometry-course/board/practice.js','geometry-course/board/native-session.js','geometry-course/board/native.css','geometry-course/board/learning-support.js','geometry-course/textbook/assets/grade7-board-engine.js','geometry-course/textbook/assets/grade7-board-session.js','trainers/atanasyan-grade7.html','trainers/geometry7-practice.html','trainers/geometry7-rebuild.html','trainers/board-compat.json','trainers/board-picker.js','trainers/board-picker-data.json','ege-baza/path/board-session.js','learning/app.js',...require('../geometry-course/board/catalog.json').map(x=>'geometry-course/trainers/'+x.id+'.html')];
async function bytes(url){const r=await fetch(url,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(30000)});assert.equal(r.status,200,new URL(url).pathname);return Buffer.from(await r.arrayBuffer());}
async function deployed(){
 const stamp=process.env.GITHUB_SHA||'manual';
 for(const file of files){const expected=hash(fs.readFileSync(path.join(ROOT,file))),actual=hash(await bytes(SITE+'/'+file+'?g7-release='+stamp));assert.equal(actual,expected,'published asset '+file);}
 const registry=require('../board-server/trainer-registry').loadTrainerRegistry({env:{}}),health=JSON.parse(await bytes(SERVER+'/health'));
 assert.equal(health.registryDigest,registry.digest,'published server registry');
 assert.equal(hash(await bytes(SERVER+'/learning/app.js?g7-release='+stamp)),hash(fs.readFileSync(path.join(ROOT,'learning/app.js'))),'published cabinet program card');
 report.serverRegistryDigest=health.registryDigest;report.assets=files.map(file=>({file,sha256:hash(fs.readFileSync(path.join(ROOT,file)))}));
}
(async()=>{
 assert.equal(process.env.MATHEXAM_PUBLISHED_SMOKE,'1','explicit live acceptance opt-in');
 const deadline=Date.now()+600000;let last;
 while(Date.now()<deadline){try{await deployed();last=null;break;}catch(e){last=e;console.log('Waiting for published candidate:',e.message.split('\n')[0]);await pause(15000);}}
 if(last)throw last;console.log('PASS published assets and cabinet/registry identity',files.length);
 for(const [script,label]of [['geometry7-shared-board.browser.cjs','all 70 published native activities'],['geometry7-shared-board-deep.browser.cjs','65 published proof/construction/gesture checkpoints'],['geometry7-shared-board-room.browser.cjs','published teacher/pupil room, late join, reload and both reconnects']]){
  const result=spawnSync(process.execPath,[path.join(__dirname,script)],{cwd:ROOT,stdio:'inherit',timeout:480000,env:{...process.env,GEOMETRY7_SITE:SITE,GEOMETRY7_SERVER:SERVER,GEOMETRY7_OUTPUT:path.join(OUT,label.startsWith('all')?'native':'proofs'),EGE_BAZA_BOARD_SHOTS:path.join(OUT,'room')}});
  assert.equal(result.status,0,label+(result.error?': '+result.error.message:''));report.checks.push(label);
 }
 report.status='PASS';console.log('GEOMETRY7_PUBLISHED_ACCEPTANCE_PASS');
})().catch(e=>{report.status='FAIL';report.error=String(e.message).replace(/([?&](?:token|teacherToken|studentToken)=)[^&\s"'<>]+/gi,'$1[redacted]');console.error(report.error);process.exitCode=1;}).finally(()=>{report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(OUT,'acceptance.json'),JSON.stringify(report,null,2));});
