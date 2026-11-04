'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
test('missing optional practice module returns unavailable without crashing cabinet startup',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'practice-module-isolation-'));
 try{for(const name of ['learning-assistant-practice.js','learning-auth.js'])fs.copyFileSync(path.join(__dirname,'..',name),path.join(dir,name));
 const code=`const express=require('express');const {createPracticeRouter}=require('./learning-assistant-practice');const app=express();app.use(createPracticeRouter({store:{available:false},authMiddleware:(q,s,n)=>n(),mutationMiddleware:(q,s,n)=>n(),handler:f=>(q,s)=>Promise.resolve(f(q,s)).catch(e=>s.status(e.status||500).json({error:e.code}))},{}));const server=app.listen(0,'127.0.0.1',async()=>{try{const r=await fetch('http://127.0.0.1:'+server.address().port+'/assistant/practice');const b=await r.json();if(r.status!==503||b.error!=='LEARNING_ASSISTANT_PRACTICE_UNAVAILABLE')process.exitCode=1;}catch{process.exitCode=1;}finally{server.closeAllConnections();server.close();}});`;
 const run=spawnSync(process.execPath,['-e',code],{cwd:dir,encoding:'utf8',timeout:10000,env:{...process.env,NODE_PATH:path.resolve(require.resolve('express/package.json'),'../..')}});assert.equal(run.status,0,run.stderr);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
