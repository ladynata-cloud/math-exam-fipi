const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../school/curriculum.js'),M=require('../school/math.js');
const fmt=x=>Array.isArray(x)?x.map(fmt).join('; '):typeof x==='object'?M.fmt(x):String(x);
(async()=>{
let server;
if(!process.env.WORKSHOP_URL){
 const root=path.resolve(__dirname,'..');
 server=require('node:http').createServer((req,res)=>{
  const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end();}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(data);});
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
}
const base=process.env.WORKSHOP_URL||'http://127.0.0.1:'+server.address().port+'/school/index.html';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const ctx=await browser.newContext({viewport:{width:1280,height:900}}),page=await ctx.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const go=async h=>{await page.goto(base+'#'+h);await page.locator('h1').waitFor();};
await go('home');
await page.evaluate(()=>localStorage.setItem('legacy-course-test','keep'));
for(const l of C.lessons){await go('lesson/'+l.id);await page.locator('#model svg').waitFor();assert((await page.locator('h1').innerText()).includes(l.title));}
console.log('All 74 lesson/model pages render.');
for(const id of ['fraction','equation','decimaldiv','signed','coordinate','volume','percent','triangletypes','perpendicular']){
 await go('lesson/'+id);
 const t=M.generate(id,0),steps=t.steps.concat([{answer:t.answer}]);
 for(let i=0;i<steps.length;i++){
  await page.locator('#answer').fill(fmt(steps[i].answer));
  await page.locator('button[type=submit]').click();
  assert.equal(await page.locator('.feedback.error').count(),0,id+' step '+i);
  if(i<steps.length-1)await page.locator('[data-cmd=next]').click();
 }
}
console.log('Nine full guided paths accept independently checked keys.');
await go('lesson/unlike');
await page.locator('#answer').fill('12');
await page.locator('[data-cmd=prerequisite][data-value=common]').click();
await page.locator('h1').filter({hasText:'Делаем доли'}).waitFor();
await page.locator('[data-cmd=return]').click();
await page.locator('h1').filter({hasText:'Дроби с разными'}).waitFor();
assert.equal(await page.locator('#answer').inputValue(),'12');
await go('lesson/area');
const slider=page.locator('[data-param=a]'),node=await slider.elementHandle(),before=Number(await slider.inputValue());
await slider.focus();await page.keyboard.press('ArrowRight');
assert(await node.evaluate(el=>el.isConnected),'slider replacement interrupts drag');
assert.equal(Number(await slider.inputValue()),before+1);
await page.locator('[data-reset]').click();
assert.equal(Number(await page.locator('[data-param=a]').inputValue()),before);
await go('lesson/fraction');
await page.locator('[data-cmd=mode][data-value=check]').click();
await page.locator('[data-cmd=hint]').click();
const st1=await page.evaluate(()=>JSON.parse(localStorage.getItem('mathexam.workshop.v1')));
const t1=M.generate('fraction',st1.last.seed);
await page.locator('#answer').fill(fmt(t1.answer));await page.locator('button[type=submit]').click();
assert(await page.locator('.feedback').innerText().then(t=>t.includes('помощь')));
const st2=await page.evaluate(()=>JSON.parse(localStorage.getItem('mathexam.workshop.v1')));
assert.equal(st2.events.at(-1).independent,false);
console.log('Exact prerequisite return, stable slider, reset and assistance accounting pass.');
await go('teacher');
await page.locator('#group-name').fill('Пятница · 5 класс');
await page.locator('[data-cmd=new-group]').click();
await page.locator('input[name=skills][value=fraction]').check();
await page.locator('input[name=skills][value=area]').check();
await page.locator('[data-cmd=assignment]').click();
const code=await page.locator('#generated-code').inputValue();
await go('home');await page.locator('#assignment-code').fill(code);await page.locator('[data-cmd=load-code]').click();
assert(await page.locator('main').innerText().then(t=>t.includes('Задание преподавателя')));
await go('progress');await page.locator('#alias').fill('Ученик <img src=x>');
const [dl]=await Promise.all([page.waitForEvent('download'),page.locator('[data-cmd=report]').click()]);
const report=fs.readFileSync(await dl.path(),'utf8');assert.equal(JSON.parse(report).schema,'mathexam-report');
await go('teacher');await page.locator('[data-cmd=import-report]').click();
await page.locator('#file-input').setInputFiles({name:'report.json',mimeType:'application/json',buffer:Buffer.from(report)});
await page.locator('td').filter({hasText:'Ученик <img src=x>'}).waitFor();
assert.equal(await page.locator('td img').count(),0);
await page.locator('[data-cmd=choose-weak]').click();
assert(await page.locator('input[name=skills][value=fraction]').isChecked());
await go('progress');
const preserved=await page.evaluate(()=>localStorage.getItem('mathexam.workshop.v1'));
await page.locator('[data-cmd=import-progress]').click();
await page.locator('#file-input').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"schema":"other"}')});
await page.locator('#notice').filter({hasText:'Файл не загружен'}).waitFor();
assert.equal(await page.evaluate(()=>localStorage.getItem('mathexam.workshop.v1')),preserved);
await page.reload();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('mathexam.workshop.v1')).assignment.skills.length),2);
assert.equal(await page.evaluate(()=>localStorage.getItem('legacy-course-test')),'keep');
console.log('Teacher assignment, learner report, escaped display, weak-topic selection, rejected import and reload pass.');
const shots=process.env.WORKSHOP_SHOTS;if(shots)fs.mkdirSync(shots,{recursive:true});
for(const width of [360,768,1280]){
 await page.setViewportSize({width,height:900});
 for(const route of ['home','map','books','book/vilenkin6','lesson/fraction','lesson/volume','lesson/coordinate','teacher','progress']){
  await go(route);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false,width+' '+route);
  if(shots&&['home','lesson/volume','teacher'].includes(route))await page.screenshot({path:path.join(shots,width+'-'+route.replace('/','-')+'.png'),fullPage:true});
 }
}
const other=await ctx.newPage();await other.goto(base+'#home');
await page.goto(base+'#home');const beforeExternal=await page.evaluate(()=>JSON.parse(localStorage.getItem('mathexam.workshop.v1')));
await other.evaluate(()=>{let s=JSON.parse(localStorage.getItem('mathexam.workshop.v1'));s.route='all';localStorage.setItem('mathexam.workshop.v1',JSON.stringify(s));});
await page.locator('#notice').filter({hasText:'другой вкладке'}).waitFor();
await page.locator('#route').selectOption('6');
assert.equal(await other.evaluate(()=>JSON.parse(localStorage.getItem('mathexam.workshop.v1')).route),'all');
assert.deepEqual(errors,[]);
console.log('Three widths, cross-tab conflict protection and zero page errors pass.');
const recovery=await browser.newContext(),broken=await recovery.newPage();
await broken.addInitScript(()=>{localStorage.setItem('mathexam.workshop.v1','{broken');localStorage.setItem('mathexam.workshop.teacher.v1','{teacher-broken');});
await broken.goto(base+'#progress');
const [raw]=await Promise.all([broken.waitForEvent('download'),broken.locator('[data-cmd=raw-progress]').click()]);
assert.equal(fs.readFileSync(await raw.path(),'utf8'),'{broken');
await broken.locator('[data-nav=teacher]').click();
const [rawTeacher]=await Promise.all([broken.waitForEvent('download'),broken.locator('[data-cmd=raw-teacher]').click()]);
assert.equal(fs.readFileSync(await rawTeacher.path(),'utf8'),'{teacher-broken');
await broken.locator('#group-name').fill('Temporary');await broken.locator('[data-cmd=new-group]').click();
assert.equal(await broken.evaluate(()=>localStorage.getItem('mathexam.workshop.teacher.v1')),'{teacher-broken');
await recovery.close();
console.log('Corrupted progress and teacher records remain intact and export byte-for-byte.');
await browser.close();if(server)server.close();
})().catch(e=>{console.error(e);process.exit(1);});
