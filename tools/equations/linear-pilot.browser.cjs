'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),artifacts=path.join(root,'artifacts/linear-pilot');fs.mkdirSync(artifacts,{recursive:true});
(async()=>{const server=http.createServer((req,res)=>{let file=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(file.endsWith(path.sep))file+='index.html';if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(err,b)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(b);});});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=process.env.PILOT_BASE_URL||`http://127.0.0.1:${server.address().port}`;let browser;try{browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
// Exercise the real course entrances and gap-return links in a separate learner profile.
{
const context=await browser.newContext({viewport:{width:390,height:900}}),page=await context.newPage();
await page.goto(base+'/trainers/oge-course/');
await page.locator('a[href="/equations/linear-pilot/"]').first().click();
await page.waitForURL('**/equations/linear-pilot/');
await page.locator('#advanced-route').click();
await page.locator('#c0w0').fill('Черновик после входа из курса ОГЭ');
await page.goto(base+'/equations/');
await page.locator('a[href="/equations/linear-pilot/"]').first().click();
await page.waitForURL('**/equations/linear-pilot/');
await page.locator('#advanced-content').waitFor({state:'visible'});
assert.equal(await page.locator('#c0w0').inputValue(),'Черновик после входа из курса ОГЭ');
for(let j=0;j<3;j++){await page.locator('#c0p'+j).fill(String([-3,3,6][j]));await page.locator('#c0a'+j).fill(String([6,9,8][j]));await page.locator('#c0w'+j).fill('Сохраняю равенство одинаковым действием.');}
await page.getByRole('button',{name:'Сдать и открыть ключи',exact:true}).click();
await page.getByRole('button',{name:'Начать урок',exact:true}).click();
await page.locator('#l1t0work').fill('Мой ход до повторения: к обеим частям прибавить 7.');
await page.getByText('Нужны основы?',{exact:true}).click();
await page.locator('[data-gap]').click();
await page.waitForURL('**/equations/?return=linear-pilot#signed');
assert.equal(new URL(page.url()).search,'?return=linear-pilot');
assert.equal(new URL(page.url()).hash,'#signed');
await page.getByRole('link',{name:'← Вернуться к уроку',exact:true}).click();
await page.waitForURL('**/equations/linear-pilot/');
await page.locator('#advanced-content').waitFor({state:'visible'});
assert.equal(await page.locator('#l1t0work').inputValue(),'Мой ход до повторения: к обеим частям прибавить 7.');
assert.match(await page.locator('#position').innerText(),/Равенство/);
assert(await page.evaluate(()=>LinearPilotStore.create(localStorage).state().lessons[1].tasks[0].help.includes('gap')));
await page.screenshot({path:path.join(artifacts,'entrance-gap-return-390.png'),fullPage:true});
await context.close();
}
for(const width of [320,390,768,1280]){const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/equations/linear-pilot/');await page.locator('#advanced-route').click();await page.locator('#c0w0').fill('Черновик с клавиатуры');await page.reload();await page.locator('#advanced-content').waitFor({state:'visible'});assert.equal(await page.locator('#c0w0').inputValue(),'Черновик с клавиатуры');await page.getByRole('button',{name:'Сдать и открыть ключи'}).click();assert.equal(await page.locator('#advanced-content form').count(),1);
for(let j=0;j<3;j++){await page.locator('#c0p'+j).fill(String([-3,3,6][j]));await page.locator('#c0a'+j).fill(String([6,9,8][j]));await page.locator('#c0w'+j).fill('Одинаковое действие с обеими частями.');}await page.locator('#c0a2').press('Enter');await page.getByRole('button',{name:'Начать урок',exact:true}).click();
assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:path.join(artifacts,`lesson-${width}.png`),fullPage:true});
const other=await context.newPage();await other.goto(base+'/equations/linear-pilot/');await other.locator('#l1t0work').fill('Старая вкладка: прибавить 7.');
for(let i=1;i<=4;i++){const values=[[0,5],[0,-2],[0,-2],[1,180]][i-1];await page.locator('input[name="choice"]').nth(values[0]).check();await page.locator(`#l${i}t0answer`).fill(String(values[1]));await page.locator(`#l${i}t0work`).fill('Прибавляю одно и то же к обеим частям.');await page.getByRole('button',{name:'Проверить',exact:true}).click();await page.getByRole('button',{name:'Завершить занятие',exact:true}).click();}
await other.locator('#l1t0work').fill('Из старой вкладки, не стирая итог.');await page.reload();assert.equal(await page.locator('#c5a0').count(),1);
for(let j=0;j<3;j++){await page.locator('#c5a'+j).fill(String([5,6,6][j]));await page.locator('#c5w'+j).fill('Проверяю подстановкой.');}await page.getByRole('button',{name:'Сдать и открыть ключи'}).click();await page.getByRole('button',{name:'Открыть повтор',exact:true}).click();assert.equal(await page.locator('#c6a0').count(),0);
const at=await page.evaluate(()=>{const s=LinearPilotStore.create(localStorage).state();return s.checks[5][0].at;});await page.clock.install({time:new Date(at+5*86400000)});await page.reload();assert.equal(await page.locator('#c6a0').count(),1);await page.screenshot({path:path.join(artifacts,`repeat-${width}.png`),fullPage:true});await page.getByRole('button',{name:'Равенство ✓',exact:true}).click();assert.match(await page.locator('#screen').innerText(),/Занятие пройдено/);await page.getByText('Отчёт ученика и преподавателя',{exact:true}).click();await page.locator('#report-button').click();assert.match(await page.locator('#report').innerText(),/Из старой вкладки/);assert.deepEqual(errors,[]);await context.close();}
console.log('LINEAR_PILOT_BROWSER_OK: OGE and equations entrances, gap-return with draft and help, 4 widths, keyboard, complete route, two tabs, controlled delayed form, report');
}finally{if(browser)await browser.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
