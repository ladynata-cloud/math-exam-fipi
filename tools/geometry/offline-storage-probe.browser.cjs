'use strict';
// Diagnose native file:// persistence independently of every course script.
// This is additional evidence; it does not replace the atlas reload assertions.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'../..');
const OUT=path.resolve(process.env.GEOMETRY_STORAGE_PROBE_ARTIFACTS||path.join(ROOT,'artifacts/atanasyan-harmonization/storage-probe'));
const FIXTURES=path.join(OUT,'fixtures'),KEY='mathExamGeometryFileSentinel.v1';
const report={status:'RUNNING',key:KEY,cases:[],failures:[],blockingErrors:[],browserVersion:null};
fs.mkdirSync(FIXTURES,{recursive:true});
// No framework, listeners, debounce, lifecycle save, storage cleanup or retry.
const html='<!doctype html><meta charset="utf-8"><title>Native storage sentinel</title><script>'+`
const raw=localStorage.getItem(${JSON.stringify(KEY)});
window.sentinelEntry={url:location.href,origin:location.origin,raw,rawPresent:raw!==null,rawLength:raw?.length||0,unitIds:raw?Object.keys(JSON.parse(raw).units||{}):[],time:Date.now(),keys:Object.keys(localStorage).sort()};
`+'</script><p>Native file storage probe.</p>';
for(let n=0;n<63;n++)fs.writeFileSync(path.join(FIXTURES,n+'.html'),html);

async function frameStorage(cdp){
 const {frameTree:{frame}}=await cdp.send('Page.getFrameTree');
 const {storageKey}=await cdp.send('Storage.getStorageKeyForFrame',{frameId:frame.id});
 return {frameId:frame.id,loaderId:frame.loaderId,frameURL:frame.url,securityOrigin:frame.securityOrigin,storageKey};
}

async function run(context,mode,base){
 const p=await context.newPage(),cdp=await context.newCDPSession(p);
 p.on('pageerror',e=>report.blockingErrors.push({mode,error:String(e)}));
 try{
  // One context per mode, retained for every URL. Nothing is cleared between files.
  // HTTP is a control; all 63 distinct file URLs also receive a real immediate reload.
  const routes=[...Array.from({length:63},(_,n)=>({kind:'file',n,url:pathToFileURL(path.join(FIXTURES,n+'.html')).href})),
   ...Array.from({length:63},(_,n)=>({kind:'http',n,url:base+n+'.html'}))];
  for(const route of routes){
   const item={mode,kind:route.kind,n:route.n,url:route.url};
   try{
    await p.goto(route.url);
    item.before=await frameStorage(cdp);
    // The readback is in the SAME renderer turn as setItem; the very next browser
    // operation is reload. No CDP inspection or await is inserted between them.
    // Retain every earlier unit under one key, as the course does when the browser
    // exposes a shared file storage area. The snapshot grows from under 1 KB to
    // roughly 45 KB; a missing current unit can never be mistaken for success.
    item.write=await p.evaluate(({key,mode,kind,n})=>{
     const raw=localStorage.getItem(key),payload=raw?JSON.parse(raw):{version:1,units:{}};
     payload.units['sentinel-'+n]={mode,kind,n,text:'x'.repeat(n===0?700:650)};
     const value=JSON.stringify(payload);localStorage.setItem(key,value);
     return {value,readback:localStorage.getItem(key),unitIds:Object.keys(payload.units),previous:window.sentinelEntry,time:Date.now()};
    },{key:KEY,mode,kind:route.kind,n:route.n});
    await p.reload();
    item.payloadLength=item.write.value.length;
    item.reloaded=await p.evaluate(key=>({entry:window.sentinelEntry,raw:localStorage.getItem(key),url:location.href,origin:location.origin}),KEY);
    item.after=await frameStorage(cdp);
    item.pass=item.write.readback===item.write.value&&item.reloaded.entry.raw===item.write.value&&item.reloaded.raw===item.write.value;
    if(!item.pass){const failure={mode,kind:route.kind,n:route.n,error:'Native sentinel differs after immediate reload'};report.failures.push(failure);if(route.kind==='http')report.blockingErrors.push(failure);}
   }catch(e){item.pass=false;item.error=String(e?.stack||e);report.blockingErrors.push({mode,kind:route.kind,n:route.n,error:item.error});}
   report.cases.push(item);
  }
 }finally{await cdp.detach();await p.close();}
}

(async()=>{
 let server,browser,persistent,profile;
 try{
  server=http.createServer((req,res)=>{
   const name=(req.url||'').replace(/^\//,'');
   if(!/^\d+\.html$/.test(name)){res.writeHead(404).end();return;}
   const file=path.join(FIXTURES,name);
   if(!fs.existsSync(file)){res.writeHead(404).end();return;}
   res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fs.readFileSync(file));
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  const base='http://127.0.0.1:'+server.address().port+'/';
  const options={headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||process.env.GEOMETRY_CHROMIUM||undefined};
  browser=await chromium.launch(options);report.browserVersion=browser.version();
  const context=await browser.newContext({viewport:{width:320,height:900}});
  try{await run(context,'newContext',base);}finally{await context.close();}
  await browser.close();browser=null;
  // Compare the normal persistent profile used by an installed browser. This is
  // a separate diagnostic control, never a substitute for the existing context.
  profile=fs.mkdtempSync(path.join(os.tmpdir(),'geometry-storage-profile-'));
  persistent=await chromium.launchPersistentContext(profile,{...options,viewport:{width:320,height:900}});
  await run(persistent,'persistent-profile',base);
 }catch(e){report.blockingErrors.push({error:String(e?.stack||e)});}
 finally{
  if(persistent)await persistent.close();if(browser)await browser.close();
  if(server)await new Promise(resolve=>server.close(resolve));
  if(profile)fs.rmSync(profile,{recursive:true,force:true});
  report.status=report.blockingErrors.length?'FAIL':report.failures.length?'BASELINE_LOSS':'PASS';
  fs.writeFileSync(path.join(OUT,'storage-probe.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({status:report.status,browserVersion:report.browserVersion,cases:report.cases.length,failures:report.failures,blockingErrors:report.blockingErrors,artifact:path.join(OUT,'storage-probe.json')},null,2));
  // A diagnosed native file loss must not prevent the independent course suite
  // from recording its own strict result. Setup errors and HTTP control failures
  // still fail this command; the existing atlas gate is never relaxed.
  if(report.blockingErrors.length)process.exitCode=1;
 }
})();
