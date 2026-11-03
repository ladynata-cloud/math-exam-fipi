'use strict';
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto'),express=require('express');
const {once}=require('node:events');const {createLearningApi}=require('../../learning-api');const {hashPassword,tokenHash}=require('../../learning-auth');
const HASH=hashPassword('synthetic practice password');
module.exports=async function fixture(t,{enabled=true}={}){
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'assistant-private-practice-'));let api,server,origin,now=Date.UTC(2026,10,2,12);const filePath=path.join(directory,'practice.sqlite');
 async function start(){const app=express();app.use(express.json({limit:'128kb'}));server=app.listen(0,'127.0.0.1');await once(server,'listening');origin=`http://127.0.0.1:${server.address().port}`;
  api=createLearningApi({filePath,clock:()=>now,publicOrigin:origin,secureCookies:false,assistant:{config:{enabled,external:false,origin:'https://assistant.example.test',key:crypto.randomBytes(32).toString('base64url'),timeoutMs:100},fetchImpl:async()=>{throw Error('No external transport in practice fixture');}}});
  app.use('/api/learning',api.router);app.use('/learning',express.static(path.resolve(__dirname,'../../../learning')));
 }
 async function stop(){server.closeAllConnections();await new Promise(r=>server.close(r));api.close();}
 await start();const teacher=api.store.activate(api.store.bootstrap({login:'practice_teacher',name:'Synthetic teacher'}).invitationToken,await HASH),students=[];
 for(let i=0;i<2;i++)students.push(api.store.activate(api.store.createStudent(teacher.account,{login:'practice_student_'+i,name:'Synthetic learner '+i}).invitationToken,await HASH));
 t.after(async()=>{await stop();fs.rmSync(directory,{recursive:true,force:true});});
 async function request(session,route,body,extra={}){const r=await fetch(origin+'/api/learning'+route,{method:body===undefined?'GET':'POST',headers:{...(body===undefined?{}:{'Content-Type':'application/json',Origin:origin}),...(session?{Cookie:'mathexam_learning_local='+session.sessionToken,'X-CSRF-Token':tokenHash('learning-csrf:'+session.sessionToken),'X-Learning-Account':session.account.id}:{}),...extra},...(body===undefined?{}:{body:JSON.stringify(body)})});return {status:r.status,body:await r.json()};}
 for(const learner of students)await request(teacher,'/teacher/students/'+learner.account.id+'/assistant',{profileId:'peterson-decimals',enabled:true,dailyLimit:10,version:0});
 const base='/teacher/students/'+students[0].account.id+'/assistant/practice';
 return {get api(){return api;},get origin(){return origin;},teacher,students,request,base,now:()=>now,setNow:v=>{now=v;},restart:async()=>{await stop();await start();},snapshot:()=>Object.fromEntries(api.store.rows("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").map(({name})=>[name,api.store.rows('SELECT * FROM "'+name+'"')]))};
};
