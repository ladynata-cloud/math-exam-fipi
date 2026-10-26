/* Real native pages in two independent DOMs. Transport/permissions use the root room suite. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,ResourceLoader,VirtualConsole}=require('jsdom');
const ROOT=path.resolve(__dirname,'..');
const pages={entry:'practice-1-5-entry-diagnostic-2026',plan:'practice-1-5-plan-reading',routes:'practice-1-5-routes-checkpoint-2026'};
class Local extends ResourceLoader{fetch(url){const p=new URL(url).pathname;if(p.endsWith('/board-bridge.js'))return Promise.resolve(Buffer.from(''));const file=path.join(ROOT,p);return fs.existsSync(file)&&fs.statSync(file).isFile()?Promise.resolve(fs.readFileSync(file)):null;}}
const tick=()=>new Promise(r=>setTimeout(r,20));
async function boot(kind,shared=true){
  const errors=[],reads=[],writes=[],timers=[];let api;
  const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e));
  const dom=new JSDOM(fs.readFileSync(path.join(ROOT,'trainers/oge-1-5-trainers',pages[kind]+'.html'),'utf8'),{
    url:'https://math.test/trainers/oge-1-5-trainers/'+pages[kind]+'.html'+(shared?'?board=1':''),runScripts:'dangerously',resources:new Local(),pretendToBeVisual:true,virtualConsole:vc,
    beforeParse(w){w.scrollTo=()=>{};w.confirm=()=>true;w.MathExamBoard={register(c){api=c;}};
      const proto=w.Storage.prototype,get=proto.getItem,set=proto.setItem;set.call(w.localStorage,'private-sentinel','preserved');
      proto.getItem=function(key){reads.push(key);return get.call(this,key);};proto.setItem=function(key,val){writes.push(key);return set.call(this,key,val);};
      const interval=w.setInterval.bind(w);w.setInterval=(f,ms)=>{timers.push(ms);return interval(f,ms);};
    }});
  await new Promise(r=>dom.window.addEventListener('load',r,{once:true}));await tick();
  assert.deepEqual(errors.map(e=>e.message),[],pages[kind]+': init');
  if(shared){assert.ok(api,pages[kind]+': SDK registered');assert.equal(api.id,pages[kind]);assert.ok(dom.window.document.querySelector('.practical-board-note'));}
  else assert.equal(api,undefined,'standalone does not register shared state');
  return{dom,w:dom.window,api,kind,errors,reads,writes,timers};
}
const $=(c,s)=>c.w.document.querySelector(s);
const snap=c=>JSON.parse(JSON.stringify(c.api.getState()));
function click(c,s){const el=$(c,s);assert.ok(el,'missing '+s);assert.notEqual(el.disabled,true,'disabled '+s);el.click();}
function input(c,s,value,type='input'){const el=$(c,s);assert.ok(el,s);el.value=String(value);el.dispatchEvent(new c.w.Event(type,{bubbles:true}));}
function select(c,s,value){input(c,s,value,'change');}
function projection(c){const selectors=c.kind==='entry'?['#question-title','#question-text','#question-visual','#review-box','#score-val','#topic-results']:c.kind==='plan'?['#question','#visual','#feedback','#score-label','#final-score','#skill-list']:['#question','#visual','#teacher-answer','#final-score','#review'];
  return selectors.map(s=>{const el=$(c,s);return el.closest('[hidden]')?[s,'hidden']:[s,el.innerHTML,false];}).concat([...c.w.document.querySelectorAll('#answer-area input,#answer-area select,#answer-control')].filter(el=>!el.closest('[hidden]')).map(el=>[el.id,el.value,el.disabled]));}
function send(a,b,compareView=true){const s=snap(a);assert.ok(Buffer.byteLength(JSON.stringify(s))<12000);assert.ok(!JSON.stringify(s).includes('<'));b.api.applyState(b.w.JSON.parse(JSON.stringify(s)));assert.deepEqual(snap(b),s,'semantic round trip '+a.kind);if(compareView)assert.deepEqual(projection(b),projection(a),'native rendered view '+a.kind);}
function attack(c,mutate){const old=snap(c),view=projection(c),bad=c.w.JSON.parse(JSON.stringify(old));mutate(bad);assert.equal(c.w.PracticalDiagnosticBoard.validateState(bad),false);assert.throws(()=>c.api.applyState(bad));assert.deepEqual(snap(c),old,'invalid state atomic');assert.deepEqual(projection(c),view);}
function commonAttacks(c){for(const fn of [s=>s.html='<b>peer</b>',s=>s.native.answerKey='1',s=>s.native.answers.push('0'),s=>s.native.index=10,s=>s.native.variant=99,s=>s.disclosures.push(false),s=>s.native.answers[0]='<img>',s=>s.native.answers[0]='a'.repeat(161),s=>delete s.native.answers[0],s=>Object.defineProperty(s.native,'mode',{get(){throw Error('getter executed');},enumerable:true}),s=>Object.setPrototypeOf(s.native,{polluted:true})])attack(c,fn);}
async function checkEnd(a,b){commonAttacks(b);const fresh=await boot(a.kind);send(a,fresh);await tick();for(const c of[a,b,fresh]){assert.deepEqual(c.reads,[],'shared cannot read private storage');assert.deepEqual(c.writes,[],'shared cannot write private storage');assert.deepEqual(c.timers,[],'shared timer frozen');assert.equal(c.w.localStorage['private-sentinel'],'preserved');assert.deepEqual(c.errors.map(e=>e.message),[]);c.w.close();}}

const entryAnswers=[['16','10','123','2','96','7','670','4','2040','600'],['11','15','129','2','96','8','700','8','2800','1000'],['15','13','135','2','72','7','740','16','2250','1000']];
async function entry(){const a=await boot('entry'),b=await boot('entry');let emitted=0,echoes=0;a.api.subscribe(()=>emitted++);b.api.subscribe(()=>echoes++);send(a,b,false);
  for(let variant=0;variant<3;variant++){
    select(a,'#variant-select',variant);click(a,'#start-btn');send(a,b);assert.match($(a,'#timer').textContent,/без таймера/);
    assert.equal($(b,'#review-box').textContent.trim(),'','diagnostic does not reveal key');assert.equal($(a,'#review-mode-btn').disabled,true);
    input(a,'#answer-control','-9');send(a,b);input(a,'#answer-control',entryAnswers[variant][0]);
    $(a,'details.pm-details').open=true;send(a,b);
    for(let i=0;i<10;i++){if(i){click(a,'#next-btn');}input(a,'#answer-control',entryAnswers[variant][i],i===3?'change':'input');send(a,b);}
    click(a,'#finish-btn');send(a,b);assert.equal($(b,'#score-val').textContent,'10','independent expected math '+variant);click(a,'#review-btn');send(a,b);assert.equal($(b,'#answer-control').disabled,true);assert.match($(b,'#review-box').textContent,/Верно|верно/);
    if(variant<2){click(a,'#retry-btn');send(a,b,false);}
  }
  click(a,'[data-mode="teacher"]');send(a,b);assert.equal(snap(a).native.assisted,true);await tick();assert.ok(emitted>0);assert.equal(echoes,0,'apply emits nothing');await checkEnd(a,b);console.log('✓ entry: three native variants, all 30 independently calculated answers, review, late join, private isolation');
}
const bankAnswers=[1,'10',[0,1,2],'3,6',[1,2,0,3],1,'30',2,1,2,'10,5',2];
const orders=['выполнить вычисления','прочитать вопрос','найти масштаб и нужные данные','проверить единицы ответа'];
function planAnswer(c,bankIndex){const answer=bankAnswers[bankIndex];if(bankIndex===4){for(const index of answer){const el=[...c.w.document.querySelectorAll('#order-bank .token')].find(x=>x.textContent===orders[index]);assert.ok(el);el.click();}}else if(Array.isArray(answer)){for(const index of answer)click(c,'.option[data-index="'+index+'"]');}else if(typeof answer==='number')click(c,'.option[data-index="'+answer+'"]');else input(c,'#number-answer',answer);}
async function plan(){const a=await boot('plan'),b=await boot('plan');let echoes=0;b.api.subscribe(()=>echoes++);send(a,b);
  click(a,'#check');send(a,b);assert.match($(b,'#feedback').textContent,/Сначала/);click(a,'#hint');send(a,b);assert.match($(b,'#feedback').textContent,/Подсказка/);
  click(a,'[data-mode="train"]');assert.equal($(a,'#hint').hidden,true);send(a,b);const bad=snap(a);bad.native.help[0]=true;bad.native.feedback='hint';assert.equal(b.w.PracticalDiagnosticBoard.validateState(b.w.JSON.parse(JSON.stringify(bad))),false,'train cannot import pre-check hints');
  click(a,'[data-mode="learn"]');
  for(let variant=1;variant<=2;variant++){
    select(a,'#variant',variant);click(a,'#start');send(a,b);
    const indices=variant===1?[0,1,2,3,4,5,6,7,8,9]:[2,3,4,5,6,7,8,9,10,11];
    for(let i=0;i<10;i++){planAnswer(a,indices[i]);send(a,b);click(a,'#check');send(a,b);assert.equal($(b,'#score-label').textContent,'Верно: '+(i+1));if($(a,'#number-answer'))assert.equal($(a,'#number-answer').disabled,true,'checked number cannot keep stale success after editing');click(a,'#next');send(a,b);}
    assert.equal($(b,'#final-score').textContent,'10');click(a,'#again');send(a,b);
  }
  // Viewing a key must not overwrite a previously checked wrong draft and change the peer's score.
  select(a,'#variant',1);click(a,'#start');click(a,'.option[data-index="0"]');click(a,'#check');send(a,b);click(a,'[data-mode="teacher"]');send(a,b);assert.equal(snap(a).native.answers[0],0);assert.equal($(b,'#score-label').textContent,'Верно: 0');click(a,'[data-mode="learn"]');send(a,b);assert.equal($(a,'#score-label').textContent,'Верно: 0');
  await tick();assert.equal(echoes,0);await checkEnd(a,b);console.log('✓ plan: both complete sets, single/multi/order/number drafts, hints, checks, teacher provenance, late join');
}
const routeAnswers=[['4213','7','5','20','5','7586','10','50','98','10'],['3142','14','10','35','5','2649','13','60','102','30']];
async function routes(){const a=await boot('routes'),b=await boot('routes');let echoes=0;b.api.subscribe(()=>echoes++);send(a,b,false);
  for(let variant=1;variant<=2;variant++){
    select(a,'#variant',variant);click(a,'#start');send(a,b);assert.equal($(b,'#teacher-answer').hidden,true);
    const grid=$(a,'[data-grid-width]'),w=Number(grid.dataset.gridWidth),h=Number(grid.dataset.gridHeight),cell=Number(grid.dataset.cellSize);assert.equal(w,variant===1?3:6);assert.equal(h,variant===1?4:8);assert.equal(grid.querySelectorAll('line').length,w+h+2);const vertical=[...grid.querySelectorAll('line')].slice(0,w+1);assert.ok(Math.abs(Number(vertical[1].getAttribute('x1'))-Number(vertical[0].getAttribute('x1'))-cell)<1e-8);
    for(let i=0;i<10;i++){input(a,'#answer-input',routeAnswers[variant-1][i]);send(a,b);if(i<9){click(a,'#next');send(a,b);}}
    click(a,'#finish');send(a,b);assert.equal($(b,'#final-score').textContent,'10','independent route calculations');if(variant===1){click(a,'#again');send(a,b,false);}
  }
  click(a,'#again');click(a,'[data-mode="teacher"]');click(a,'#start');send(a,b);assert.equal($(b,'#teacher-answer').hidden,false);assert.equal($(b,'#answer-input').disabled,true);await tick();assert.equal(echoes,0);await checkEnd(a,b);console.log('✓ routes: both complete variants, accurate cell geometry, no premature review, teacher mode, late join');
}
async function standalone(){for(const kind of Object.keys(pages)){const c=await boot(kind,false);if(kind==='entry'){click(c,'#start-btn');click(c,'#finish-btn');}else if(kind==='routes'){click(c,'#start');click(c,'#finish');}else{for(let i=0;i<10;i++){planAnswer(c,i);click(c,'#check');click(c,'#next');}}assert.ok(c.reads.length&&c.writes.length,kind+': standalone private persistence retained');if(kind!=='plan')assert.deepEqual(c.timers,[1000]);assert.equal($(c,'.practical-board-note'),null);assert.deepEqual(c.errors.map(e=>e.message),[]);c.w.close();}console.log('✓ standalone: native personal stores and timers retained');}
(async()=>{await entry();await plan();await routes();await standalone();console.log('OGE_PRACTICAL_DIAGNOSTIC_BOARD_OK');})().catch(e=>{console.error(e);process.exitCode=1;});
