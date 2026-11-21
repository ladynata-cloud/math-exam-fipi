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
 const answers={842:'8',843:'3',844:'64',845:'9',846:'40',847:'49',848:'19',849:'20',850:'40',851:'19',852:'15',853:'6',854:'24',855:'9',856:'37',857:'51',858:'61',859:'125','860-1':'108','860-2':'12,96',861:'6',862:'32',863:'9',864:'50',865:'3',866:'2',867:'1,44','868-1':'4,8','868-2':'100','868-3':'4','869-1':'135','869-2':'30',870:'14',871:'10',872:'10',873:'10',874:'7',875:'9',876:'2',877:'2',878:'12',879:'21',880:'9',881:'6',882:'16',883:'10',884:'8',885:'4',886:'15',887:'8',888:'8',889:'6',890:'6',891:'0,25',892:'1',893:'1,5',894:'6',895:'2,4',896:'5',897:'1,4',898:'1,5',899:'4'};
 for(const width of [320,1280]) {
  const page=await browser.newPage({viewport:{width,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);
  await page.getByText(/Полностью доступны задачи: 899/).waitFor();
  for(const [n,value] of Object.entries(answers)) {
   const [number,part='1']=n.split('-');
   const id='atanasyan-7-9-main-'+number+'-part-'+part;
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
