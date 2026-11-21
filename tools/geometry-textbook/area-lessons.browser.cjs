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
 const answers={842:'8',843:'3',844:'64',845:'9',846:'40',847:'49',848:'19',849:'20',850:'40',851:'19',852:'15',853:'6',854:'24',855:'9',856:'37',857:'51',858:'61',859:'125','860-1':'108','860-2':'12,96',861:'6',862:'32',863:'9',864:'50',865:'3',866:'2',867:'1,44','868-1':'4,8','868-2':'100','868-3':'4','869-1':'135','869-2':'30',870:'14',871:'10',872:'10',873:'10',874:'7',875:'9',876:'2',877:'2',878:'12',879:'21',880:'9',881:'6',882:'16',883:'10',884:'8',885:'4',886:'15',887:'8',888:'8',889:'6',890:'6',891:'0,25',892:'1',893:'1,5',894:'6',895:'2,4',896:'5',897:'1,4',898:'1,5',899:'4',900:['8','5'],'901-1':['42','36'],'901-2':['6','4'],'901-3':['3','16'],902:['50','65'],903:['4','6'],904:['28','9'],905:['18','8'],906:['5','6'],907:['43','140'],908:['51','52'],909:['10','9'],910:['60','36'],911:['37','17'],912:['11','8'],913:['12','17'],914:['9','16'],915:['4','90'],916:['5','144'],917:['5','21,25'],918:['7','4,5'],919:['6','14'],920:['3','2'],921:['3','24'],922:['8','12'],'923-1':['1','2'],'923-2':['5','10'],924:['8','12'],925:['3','2'],t84:['0','7'],t85:['2','1'],t86:['4','-1'],926:['2','12'],927:['5','3'],'928-1':['25','35'],'928-2':['15','1'],'929-1':['2','3'],'929-2':['1','2'],'929-3':['2','1'],'929-4':['1','2'],'930-1':['0','1'],'930-2':['2','1'],'930-3':['1','1'],931:['6','3'],932:['2','3'],933:['73','10'],934:['50','117'],'935-1':['4','12'],'935-2':['2','4'],'935-3':['0','3'],'936-1':['8','2'],'936-2':['1','1'],'936-3':['7','18'],'936-4':['1','0'],'937-1':['2','1'],'937-2':['7','18'],'937-3':['7','1'],'937-4':['6','9'],'937-5':['9','10'],938:['4','9'],'939-1':['89','28'],'939-2':['1','2'],'940-1':['2','1'],'940-2':['2','1'],'940-3':['0','1'],'940-4':['2','2'],'940-5':['0','3'],t87:['4','0'],t88:['4','5'],t89:['1','0'],t90:['-3','-6'],941:['5','10'],942:['2','7'],943:['5','-2'],944:['-1','7'],945:['5','-2'],'946-1':['7','-2'],'946-2':['-7','0'],'946-3':['-3','-6'],'947-1':['1','5'],'947-2':['5','-3'],948:['5','4'],949:['0','7'],'950-1':['9','5'],'950-2':['27','75'],'950-3':['27','75'],'950-4':['9','5'],'950-5':['9','5'],'951-1':['-2','13'],'951-2':['14','13'],'951-3':['14','13'],'951-4':['-2','13'],'952-1':['6','3'],'952-2':['1','-3']};
 for(const width of [320,1280]) {
  const catalog=await browser.newPage({viewport:{width,height:900}});
  const errors=[]; catalog.on('pageerror',e=>errors.push(e.message));
  await catalog.goto(base);
  await catalog.getByText(/Полностью доступны задачи: 952/).waitFor();
  await catalog.close();
  for(const [n,value] of Object.entries(answers)) {
   const page=await browser.newPage({viewport:{width,height:900}});
   page.on('pageerror',e=>errors.push(e.message));
   const theory=n.startsWith('t');
   const [number,part='1']=(theory?n.slice(1):n).split('-');
   const id='atanasyan-7-9-'+(theory?'theory-':'main-')+number+'-part-'+part;
   await page.goto(base+'#'+id);
   await page.locator('[data-main-model] svg').waitFor();
   assert.equal(await page.evaluate(id=>JSON.parse(localStorage.getItem('mathExamTextbook.v1:atanasyan-2023-7-9:'+id+':r1'))?.checked===true,id),false);
   if(!theory){
    await page.locator('#final-answer').fill('Синтетический черновик решения');
    await page.locator('[data-final-form] button').click();
    if(Number(number)>=937){
     const state=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),'mathExamTextbook.v1:atanasyan-2023-7-9:'+id+':r1');
     assert.equal(state.checked,false);
     assert.equal(state.assisted,false);
     assert.match(await page.locator('[data-final-feedback]').innerText(),/Рассуждение сохранено/);
    }
   }
   await page.locator('[data-main-help] > summary').click();
   await page.getByRole('button',{name:'Разобрать по шагам'}).click();
   while(await page.getByRole('button',{name:'Следующий шаг'}).isVisible()) await page.getByRole('button',{name:'Следующий шаг'}).click();
   const forms=page.locator('[data-step] form');
   const expected=Array.isArray(value)?value:[value];
   assert.equal(await forms.count(),expected.length);
   for (const [index,answer] of expected.entries()) {
    const form=forms.nth(index);
    await form.locator('input').fill('1000');await form.locator('button').click();
    const hint=await form.locator('[role=status]').innerText();
    assert.ok(hint.trim().length>0);assert.notEqual(hint,'Ответ на этот шаг совпал.');
    await form.locator('input').fill(answer);await form.locator('button').click();
    assert.equal(await form.locator('[role=status]').innerText(),'Ответ на этот шаг совпал.');
   }
   const vectorCases={t87:'case-2',t88:'case-4',t89:'case-2',t90:'case-3',941:'case-2',942:'case-2',943:'case-2',944:'case-6',945:'case-5','946-1':'case-5','946-2':'case-6','946-3':'case-2'};
   const vectorProofCase=n.startsWith('947-')||n.startsWith('952-')?'case-3':Number(number)>=948&&Number(number)<=951?'case-2':null;
   const switchCase=vectorProofCase||vectorCases[n]||(n==='918'?'case-all-nine':n==='926'?'case-2':n==='933'?'case-4':n==='934'?'case-3':n.startsWith('935-')?'case-2':n.startsWith('937-')||n==='938'||n==='939-1'?'case-2':null);
   if(switchCase) {
    await page.locator('[data-case="'+switchCase+'"]').click();
    assert.equal(await page.locator('[data-main-model] svg').getAttribute('data-view'),switchCase);
   }
   await page.reload();await page.locator('[data-main-model] svg').waitFor();
   if(switchCase) assert.equal(await page.locator('[data-main-model] svg').getAttribute('data-view'),switchCase);
   if(!theory) assert.equal(await page.locator('#final-answer').inputValue(),'Синтетический черновик решения');
   if(!theory&&Number(number)>=937){
    const state=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),'mathExamTextbook.v1:atanasyan-2023-7-9:'+id+':r1');
    assert.equal(state.assisted,true);assert.equal(state.checked,false);
   }
   for (const [index,answer] of expected.entries()) {
    assert.equal(await forms.nth(index).locator('input').inputValue(),answer);
   }
   await page.locator('[data-main-model] svg').waitFor();
   if(artifact) {
    await page.locator('[data-main-model]').screenshot({path:artifact+'/plot-'+n+'-'+width+'.png'});
   }
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await page.close();
  }
  assert.deepEqual(errors,[]);
 }
 } finally { await browser.close(); server.close(); }
})().catch(error=>{console.error(error);server.close();process.exitCode=1});
