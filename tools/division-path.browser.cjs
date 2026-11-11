'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://local');let file=path.resolve(root,'.'+u.pathname);if(!file.startsWith(root+path.sep))return res.writeHead(403).end();try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch(_){res.writeHead(404).end();}});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
 try{for(const width of [320,1280]){
 const page=await browser.newPage({viewport:{width,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/trainers/oge-basics/multiplication-division/division-path.html');
 await page.locator('#continue-division').waitFor();assert.equal(await page.locator('.path-step').count(),8);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'hub overflow '+width);
 if(process.env.DIVISION_SCREENSHOTS){fs.mkdirSync(process.env.DIVISION_SCREENSHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.DIVISION_SCREENSHOTS,'path-'+width+'.png'),fullPage:true});}
 await page.locator('#continue-division').click();await page.waitForFunction(()=>window.__divisionGuidedDebug);
 await page.locator('#answer').fill('4');await page.locator('#primary').click();await page.locator('#answer').fill('2');
 const before=await page.evaluate(()=>{const st=window.__divisionGuidedDebug.state();return st.sessions[st.active];});
 await page.locator('[data-skill-support] a[data-skill="subtract"]').click();
 await page.locator('[data-skill-return] a').waitFor();assert.match(page.url(),/arithmetic-foundations\.html/);
 await page.locator('[data-skill-return] a').click();await page.waitForFunction(()=>window.__divisionGuidedDebug);
 const after=await page.evaluate(()=>{const st=window.__divisionGuidedDebug.state();return st.sessions[st.active];});
 assert.equal(after.id,before.id);assert.equal(after.step,before.step);assert.equal(after.draft,before.draft);assert.equal(after.hints,before.hints+1);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'guided support overflow '+width);
 assert.deepEqual(errors,[]);await page.close();
 }console.log('DIVISION_PATH_BROWSER_OK: 320/1280, visible route, exact draft detour return and honest help');}
 finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
