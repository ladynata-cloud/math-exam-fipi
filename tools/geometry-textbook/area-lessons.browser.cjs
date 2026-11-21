const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const artifact=process.env.AREA_SCREENSHOTS;
if(artifact)fs.mkdirSync(artifact,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css'};
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+decodeURIComponent(url.pathname)+(url.pathname.endsWith('/')?'index.html':''));
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port+'/geometry-course/textbook/';
 const browser=await chromium.launch({headless:true, ...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 try {
 const answers={842:'8',843:'3',844:'64',845:'9',846:'40',847:'49',848:'19',849:'20',850:'40',851:'19',852:'15',853:'6'};
 for(const width of [320,1280]) {
  const page=await browser.newPage({viewport:{width,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);
  await page.getByText(/Полностью доступны задачи: 853/).waitFor();
  for(const [n,value] of Object.entries(answers)) {
   const id='atanasyan-7-9-main-'+n+'-part-1';
   await page.goto(base+'#'+id);
   await page.locator('#final-answer').fill('Проверяю площадь и равные высоты');
   await page.locator('[data-final-form] button').click();
   await page.locator('[data-main-help] > summary').click();
   await page.getByRole('button',{name:'Разобрать по шагам'}).click();
   while(await page.getByRole('button',{name:'Следующий шаг'}).isVisible()) await page.getByRole('button',{name:'Следующий шаг'}).click();
   const form=page.locator('[data-step] form');await form.locator('input').fill('1000');await form.locator('button').click();
   assert.doesNotMatch(await form.locator('[role=status]').innerText(),/совпал/);
   await form.locator('input').fill(value);await form.locator('button').click();
   assert.match(await form.locator('[role=status]').innerText(),/верно|совп/i);
   await page.reload();await page.locator('#final-answer').waitFor();
   assert.equal(await page.locator('#final-answer').inputValue(),'Проверяю площадь и равные высоты');
   assert.equal(await page.locator('[data-step] input').inputValue(),value);
   await page.locator('[data-main-model] svg').waitFor();
   if(artifact) {
    await page.locator('[data-main-model]').screenshot({path:artifact+'/plot-'+n+'-'+width+'.png'});
   }
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  }
  assert.deepEqual(errors,[]);
  await page.close();
 }
 } finally { await browser.close(); server.close(); }
})().catch(error=>{console.error(error);server.close();process.exitCode=1});
