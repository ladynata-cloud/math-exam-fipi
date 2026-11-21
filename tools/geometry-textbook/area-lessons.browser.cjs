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
 const answers={842:'8',843:'3',844:'64',845:'9',846:'40',847:'49',848:'19',849:'20',850:'40',851:'19',852:'15',853:'6',854:'24',855:'9',856:'37',857:'51',858:'61',859:'125','860-1':'108','860-2':'12,96',861:'6',862:'32',863:'9',864:'50',865:'3',866:'2',867:'1,44','868-1':'4,8','868-2':'100','868-3':'4','869-1':'135','869-2':'30',870:'14',871:'10',872:'10',873:'10',874:'7',875:'9',876:'2',877:'2',878:'12',879:'21',880:'9',881:'6',882:'16',883:'10',884:'8',885:'4',886:'15',887:'8',888:'8',889:'6',890:'6',891:'0,25',892:'1',893:'1,5',894:'6',895:'2,4',896:'5',897:'1,4',898:'1,5',899:'4',900:['8','5'],'901-1':['42','36'],'901-2':['6','4'],'901-3':['3','16'],902:['50','65'],903:['4','6'],904:['28','9'],905:['18','8'],906:['5','6'],907:['43','140'],908:['51','52'],909:['10','9'],910:['60','36'],911:['37','17'],912:['11','8'],913:['12','17'],914:['9','16'],915:['4','90'],916:['5','144'],917:['5','21,25'],918:['7','4,5'],919:['6','14'],920:['3','2'],921:['3','24'],922:['8','12'],'923-1':['1','2'],'923-2':['5','10'],924:['8','12'],925:['3','2'],t84:['0','7'],t85:['2','1'],t86:['4','-1'],926:['2','12'],927:['5','3'],'928-1':['25','35'],'928-2':['15','1'],'929-1':['2','3'],'929-2':['1','2'],'929-3':['2','1'],'929-4':['1','2'],'930-1':['0','1'],'930-2':['2','1'],'930-3':['1','1'],931:['6','3'],932:['2','3'],933:['73','10'],934:['50','117'],'935-1':['4','12'],'935-2':['2','4'],'935-3':['0','3'],'936-1':['8','2'],'936-2':['1','1'],'936-3':['7','18'],'936-4':['1','0'],'937-1':['2','1'],'937-2':['7','18'],'937-3':['7','1'],'937-4':['6','9'],'937-5':['9','10'],938:['4','9'],'939-1':['89','28'],'939-2':['1','2'],'940-1':['2','1'],'940-2':['2','1'],'940-3':['0','1'],'940-4':['2','2'],'940-5':['0','3'],t87:['4','0'],t88:['4','5'],t89:['1','0'],t90:['-3','-6'],941:['5','10'],942:['2','7'],943:['5','-2'],944:['-1','7'],945:['5','-2'],'946-1':['7','-2'],'946-2':['-7','0'],'946-3':['-3','-6'],'947-1':['1','5'],'947-2':['5','-3'],948:['5','4'],949:['0','7'],'950-1':['9','5'],'950-2':['27','75'],'950-3':['27','75'],'950-4':['9','5'],'950-5':['9','5'],'951-1':['-2','13'],'951-2':['14','13'],'951-3':['14','13'],'951-4':['-2','13'],'952-1':['6','3'],'952-2':['1','-3'],953:['-4','7'],954:['2','-3'],'955-1':['-4','2'],'955-2':['3','-7'],'955-3':['-1','-5'],956:['-2','6'],957:['2','-7'],'958-1':['5','2'],'958-2':['5','-2'],'958-3':['5','-8'],959:['3','6'],960:['-4','8'],961:['5','8'],962:['60','45'],t91:['9','-9'],t92:['3','12'],963:['4','-3'],'964-1':['6','-4'],'964-2':['3','2'],'964-3':['7','10'],'964-4':['-3','18'],'964-5':['8','-16'],'964-6':['-4','-8'],965:['-5','10'],'966-1':['-14','23'],'966-2':['4','0'],967:['8','3'],'968-1':['2','-3'],'968-2':['-2','3'],'969-1':['24','0'],'969-2':['9','15'],'969-3':['-4','-8'],970:['2','1'],971:['3','-1'],'972-1':['-2','-3'],'972-2':['-2','-1'],973:['1','3'],974:['3','6'],975:['-3','5'],976:['1','7'],977:['2','-5'],978:['2','4'],979:['3','4'],980:['3','14'],981:['20','12'],982:['6,8','7,5'],983:['15','22'],984:['27','17'],985:['2','9'],986:['24','30'],987:['3','11'],988:['2','13'],989:['-1','17'],990:['5','-8'],991:['-2','7'],992:['3','10'],993:['3','1'],994:['1','8'],995:['10,5','4'],996:['3','12'],997:['2','7']};
 const coordinateAnswers={t93:['3','5'],t94:['-2','-4'],'998-1':['4','-3'],'998-2':['240','3'],'998-3':['400','-0,2'],'998-4':['25','4'],'999-1':['6','1/3'],'999-2':['7','1/4'],'999-3':['9','-1/3'],'999-4':['9','-1'],'999-5':['8','1'],'999-6':['5','-1/5'],'999-7':['12','4'],'999-8':['12','-5/4'],'999-9':['1','2']};
 const relationAnswers={'1000-1':['7','-5'],'1000-2':['-1','-5'],'1001-1':['1','-2'],'1001-2':['-1','2'],'1001-3':['3','4'],1002:['8','10'],'1003-1':['3','-4'],'1003-2':['-5','7'],'1003-3':['0','-7'],'1003-4':['1/3','2/3']};
 const gridAnswers={1004:['-3','5'],1005:['-5','5'],1006:['-0,5','0'],'1007-1':['1','-2'],'1007-2':['-3','4'],'1007-3':['0','-6'],'1007-4':['3','-4'],'1007-5':['0','-3'],'1008-1':['-2','-3'],'1008-2':['-3','-3'],'1008-3':['0','8'],'1008-4':['0','-2']};
 const actionAnswers={'1009-1':['7','1'],'1009-2':['1','1'],'1009-3':['1','-3'],'1009-4':['0','4'],'1010-1':['2','-7'],'1010-2':['0','-5'],'1010-3':['9','6'],'1010-4':['-2','2'],1011:['-6','-8'],1012:['2','8'],'1013-1':['7','9'],'1013-2':['28','-9'],'1013-3':['3','7'],'1013-4':['3','3'],1014:['-2','0'],1015:['2','21']};
 const positionAnswers={t95:['5','7'],t96:['5','-6'],'1016-1':['0','4'],'1016-2':['4','2,5'],1017:['75','50'],1018:['3','8'],1019:['-3','6'],1020:['7','3']};
 const reviewAnswers={r1:['7','0'],r2:['-3','0'],r3:['5','13'],r4:['2','5'],r5:['2','4'],r6:['4','6'],r7:['2','3'],r8:['3','8'],r9:['2','3'],r10:['4','-2'],r11:['3','-5'],r12:['3','-3'],r13:['-3','3'],r14:['-3','2'],'r15-1':['0','12'],'r15-2':['0','5'],r16:['-3','0'],r17:['-6','6'],r18:['-2','14'],r19:['5','7'],r20:['6','15']};
 for(const width of [320,1280]) {
  const catalog=await browser.newPage({viewport:{width,height:900}});
  const errors=[]; catalog.on('pageerror',e=>errors.push(e.message));
  await catalog.goto(base);
  await catalog.getByText(/Полностью доступны задачи: 1020/).waitFor();
  await catalog.close();
  for(const [n,value] of Object.entries({...answers,...reviewAnswers,...coordinateAnswers,...relationAnswers,...gridAnswers,...actionAnswers,...positionAnswers})) {
   const page=await browser.newPage({viewport:{width,height:900}});
   page.on('pageerror',e=>errors.push(e.message));
   const theory=n.startsWith('t');
   const review=n.startsWith('r');
   const [number,part='1']=(theory||review?n.slice(1):n).split('-');
   const id='atanasyan-7-9-'+(review?'selfcheck-chapter-10-':theory?'theory-':'main-')+number+'-part-'+part;
   await page.goto(base+'#'+id);
   await page.locator('[data-main-model] svg').waitFor();
   assert.equal(await page.evaluate(id=>JSON.parse(localStorage.getItem('mathExamTextbook.v1:atanasyan-2023-7-9:'+id+':r1'))?.checked===true,id),false);
   const coefficient={
    '998-1':['4','-4','отрицательный','−4,0'],'998-2':['2','20','в сантиметры','+20'],'998-3':['1','-1','противоположные','−1.0'],'998-4':['25','5','возведения в квадрат','+5'],
    '999-1':['0,5','2','обратный переход','2.0'],'999-2':['2','1/2','короче','½'],'999-3':['1/2','-1/2','отрицательным','−0,5'],'999-4':['-1','1','D→C','+1'],'999-5':['1','-1','направлению','−1.0'],
    1017:['130;75','100;75','координаты финиша','(100; 75)'],1020:['17;-3','7;-3','складывает B и C','(7; −3)'],
    '1009-1':['1;-3','5;7','противоположное действие','(5; 7)'],'1009-2':['2;-9','4;1','противоположное действие','(4; 1)'],'1009-3':['-9;-5','1;1','противоположное действие','(1; 1)'],'1009-4':['5;14','-1;0','взаимно компенсируются','(−1; 0)'],
    '1010-1':['7;4','3;2','вычитание отрицательной','(3; 2)'],'1010-2':['0;4','6;0','взаимно компенсируются','(6; 0)'],'1010-3':['7;3','-1;9','вычитание отрицательной','(−1; 9)'],'1010-4':['-3;-10','-7;-2','вычитание отрицательной','(−7; −2)'],
    '1013-1':['21;21','21;-21','знак множителя','(21; −21)'],'1013-2':['13;-24','13;24','знак множителя','(13; 24)'],'1013-3':['-21;14','-21;-14','знак множителя','(−21; −14)'],'1013-4':['2;-4','8;-10','знак множителя','(8; −10)'],
    '1008-1':['-2;5','5;-2','знак','(5; −2)'],'1008-2':['7;-3','-3;7','оси','(−3; 7)'],'1008-3':['0;-4','-4;0','нулевая','(−4; 0)'],'1008-4':['1;0','0;0','обе координаты','(0; 0)'],
    '1003-1':['3;-1','-1;3','порядок','(−1; 3)'],'1003-2':['4;5','4;-5','5+y','(4; −5)'],'1003-3':['3;0','0;3','xa','(0; 3)'],'1003-4':['1/3;-1','-1;1/3','порядок','−1;⅓'],
    '999-6':['1/4','-1/4','четверть','−¼'],'999-7':['1/3','3','не со всей','+3'],'999-8':['-3/4','-4/3','Делим целое','−4/3']
   }[n];
   const exactFinal=coefficient||{981:['20','10','сумма оснований'],983:['15','30','найден радиус'],984:['2,5','16','разность'],987:['3,5','7','полусумме оснований']}[n];
   const enteredFinal=coefficient?(width===320?coefficient[1]:coefficient[3]):exactFinal?exactFinal[1]+(width===320?',0':' см'):null;
   const readWork=()=>page.evaluate(id=>JSON.parse(localStorage.getItem('mathExamTextbook.v1:atanasyan-2023-7-9:'+id+':r1')),id);
   async function submitFinal(value){
    await page.locator('#final-answer').fill(value);
    await page.locator('[data-final-form] button').click();
   }
   if(exactFinal){
    await submitFinal(exactFinal[0]);
    assert((await page.locator('[data-final-feedback]').innerText()).includes(exactFinal[2]));
    assert.equal((await readWork()).checked,false);
    assert.equal((await readWork()).assisted,false);
    await page.reload();
    assert.equal(await page.locator('#final-answer').inputValue(),exactFinal[0]);
    if(width===320){
     await submitFinal(enteredFinal);
     assert.match(await page.locator('[data-final-feedback]').innerText(),/самостоятельно/);
    }
   }else if(!theory){
    await page.locator('#final-answer').fill('Синтетический черновик решения');
    await page.locator('[data-final-form] button').click();
    if(review||Number(number)>=937){
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
   const identityCases={953:3,954:2,955:2,956:4,957:4,958:2,959:3,960:2,961:2,962:2};
   const scaleCases={t91:2,t92:3,963:3,964:3,965:4,966:3};
   const algebraCases={967:4,968:2,969:2,970:3,971:3};
   const midpointCases={'972-1':5,'972-2':4,973:3,974:3,975:3};
   const appliedCases={976:2,977:4,978:2,979:3,980:3};
   const lengthCases={981:3,982:3,983:2,984:2,985:3,986:3,987:3};
   const extraCase=review||Object.hasOwn(coordinateAnswers,n)||Object.hasOwn(relationAnswers,n)||Number(number)>=988&&Number(number)<=997?'case-3':null;
   const gridCase=Object.hasOwn(gridAnswers,n)?'case-'+(Number(number)<=1006?6:3):null;
   const actionCase=Object.hasOwn(actionAnswers,n)?'case-'+(n==='1011'?4:n==='1012'?6:3):null;
   const switchCase=actionCase||gridCase||extraCase||(lengthCases[n]?'case-'+lengthCases[n]:null)||(appliedCases[n]?'case-'+appliedCases[n]:null)||(midpointCases[n]?'case-'+midpointCases[n]:null)||(n==='969-3'?'case-3':algebraCases[number]?'case-'+algebraCases[number]:null)||(scaleCases[theory?n:number]?'case-'+scaleCases[theory?n:number]:null)||(identityCases[number]?'case-'+identityCases[number]:null)||vectorProofCase||vectorCases[n]||(n==='918'?'case-all-nine':n==='926'?'case-2':n==='933'?'case-4':n==='934'?'case-3':n.startsWith('935-')?'case-2':n.startsWith('937-')||n==='938'||n==='939-1'?'case-2':null);
   if(switchCase) {
    await page.locator('[data-case="'+switchCase+'"]').click();
    assert.equal(await page.locator('[data-main-model] svg').getAttribute('data-view'),switchCase);
   }
   if(exactFinal&&width!==320){
    await submitFinal(enteredFinal);
    assert.match(await page.locator('[data-final-feedback]').innerText(),/после обращения к помощи/);
   }
   await page.reload();await page.locator('[data-main-model] svg').waitFor();
   if(switchCase) assert.equal(await page.locator('[data-main-model] svg').getAttribute('data-view'),switchCase);
   if(!theory) assert.equal(await page.locator('#final-answer').inputValue(),exactFinal?enteredFinal:'Синтетический черновик решения');
   if(!theory&&(review||Number(number)>=937)){
    const state=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),'mathExamTextbook.v1:atanasyan-2023-7-9:'+id+':r1');
    assert.equal(state.assisted,!exactFinal||width!==320);assert.equal(state.checked,Boolean(exactFinal));
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
