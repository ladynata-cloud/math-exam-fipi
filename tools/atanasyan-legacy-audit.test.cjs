'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),cp=require('node:child_process'),crypto=require('node:crypto');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'geometry-course/trainers'),runtime=fs.readFileSync(path.join(__dirname,'atanasyan-legacy-audit.runtime.js'),'utf8');
const files=fs.readdirSync(dir).filter(n=>n.endsWith('.html'));assert.equal(files.length,70);
const baseline=require('./atanasyan-legacy-audit.baseline.json');
let assertions=0;function ok(value,message){assert.ok(value,message);assertions++;}
for(const file of files){
 const content=fs.readFileSync(path.join(dir,file),'utf8');
 const block=content.match(/<!-- atanasyan-personal-notebook:start -->[\s\S]*?<!-- atanasyan-personal-notebook:end -->\n/);
 ok(block,'notebook exists '+file);assert.equal(content.match(/id="atanasyan-notebook-config"/g).length,1);
 const core=content.replace(block[0],'');
 assert.equal(crypto.createHash('sha256').update(core).digest('hex'),baseline.files[file],'retained runtime and board contract byte identity '+file);assertions++;
 const config=JSON.parse(content.match(/id="atanasyan-notebook-config">([^<]+)<\/script>/)[1]);assert.equal(config.id,file.slice(0,-5));
 ok(fs.existsSync(path.join(root,'geometry-course/atlas',config.unit+'.html')),'offline linked atlas exists '+file);
 ok(content.includes(runtime),'embedded current runtime '+file);
 new vm.Script(runtime);
}
const beforeBuild=Object.fromEntries(files.map(file=>[file,fs.readFileSync(path.join(dir,file))]));
cp.execFileSync('python3',[path.join(__dirname,'atanasyan-legacy-audit.build.py')]);
for(const file of files){assert.deepEqual(fs.readFileSync(path.join(dir,file)),beforeBuild[file],'idempotent offline builder '+file);assertions++;}
function setup({native=false,badStorage=false}={}){
 const html='<script type="application/json" id="atanasyan-notebook-config">'+JSON.stringify({id:'test-trainer',unit:'triangle-sas',prompt:'Какие условия даны?'})+'</script>';
 const dom=new JSDOM(html,{url:'https://mathexam.space/geometry-course/trainers/test.html',runScripts:'outside-only'}),w=dom.window;
 if(native)w.Geometry7Native={};
 const old='{"test-trainer":{"passed":true,"best":100,"events":[{"e":"finish","t":17}]}}';w.localStorage.setItem('mathExamCourseProgress.v1',old);
 if(badStorage)w.localStorage.setItem('mathExamGeometryNotebook.v1.test-trainer','malformed');
 let calls=[];w.lS=()=>({events:[]});w.log=function(...args){calls.push({this:this,args});return 17;};w.eval(runtime);
 return {w,dom,calls,old,panel:w.document.getElementById('atanasyan-notebook'),key:'mathExamGeometryNotebook.v1.test-trainer'};
}
function input(ctx,field,value){const el=ctx.panel.querySelector('[data-note="'+field+'"]');el.value=value;el.dispatchEvent(new ctx.w.Event('input',{bubbles:true}));}
{
 const ctx=setup();ok(ctx.panel,'mounted offline notebook');ok(!ctx.panel.open,'does not occupy first viewport');
 const legacyBefore=ctx.w.localStorage.getItem('mathExamCourseProgress.v1');input(ctx,'prediction','Равны две стороны, но угол не между ними.');input(ctx,'reflection','Нужно проверить положение угла.');input(ctx,'next','Решить новый вариант.');
 assert.equal(ctx.w.localStorage.getItem('mathExamCourseProgress.v1'),legacyBefore,'notebook never rewrites old progress');assertions++;
 let record=JSON.parse(ctx.w.localStorage.getItem(ctx.key));assert.equal(record.prediction,'Равны две стороны, но угол не между ними.');assert.equal(record.events.length,0);assertions+=2;
 const receiver={x:4};assert.equal(ctx.w.log.call(receiver,'hint',{task:2}),17);assert.equal(ctx.calls[0].this,receiver);assert.equal(ctx.calls[0].args[0],'hint');assertions+=3;
 ctx.w.log('opt_wrong');ctx.w.log('solved');ctx.w.log('finish');record=JSON.parse(ctx.w.localStorage.getItem(ctx.key));assert.deepEqual(record.events.map(e=>e.type),['hint','opt_wrong','solved','finish']);assertions++;
 ok(!('independent' in record)&&!('passed' in record),'no fabricated mastery');ok(ctx.panel.querySelector('[data-journal]').textContent.includes('помощь — 1, ошибки — 1'),'observed help separated');
 ctx.panel.querySelector('[data-checkpoint]').click();record=JSON.parse(ctx.w.localStorage.getItem(ctx.key));assert.equal(record.checkpoints[0].days,1);ok(record.checkpoints[0].due>record.checkpoints[0].at,'real checkpoint next review');
 ctx.panel.querySelector('[data-days]').value='7';ctx.panel.querySelector('[data-checkpoint]').click();record=JSON.parse(ctx.w.localStorage.getItem(ctx.key));assert.equal(record.checkpoints[1].days,7);assertions+=2;
 const current=ctx.w.localStorage.getItem(ctx.key);ctx.w.document.getElementById('atanasyan-notebook').remove();ctx.w.eval(runtime);assert.equal(ctx.w.document.querySelector('[data-note="prediction"]').value,record.prediction);assert.equal(ctx.w.localStorage.getItem(ctx.key),current);assertions+=2;
 ctx.dom.window.close();
}
{
 const ctx=setup();input(ctx,'prediction','Моя сохранённая мысль');
 const newer={version:1,updated:Date.now()+10000,prediction:'Более свежая мысль',events:[],checkpoints:[]};ctx.w.localStorage.setItem(ctx.key,JSON.stringify(newer));
 input(ctx,'reflection','Мой ещё не сохранённый разбор');
 assert.equal(ctx.w.localStorage.getItem(ctx.key),JSON.stringify(newer),'stale input cannot overwrite fresh tab');assertions++;
 ok(ctx.panel.querySelector('[data-note="reflection"]').readOnly,'stale tab freezes');ctx.panel.querySelector('[data-latest]').click();
 assert.equal(ctx.panel.querySelector('[data-note="prediction"]').value,newer.prediction);ok(!ctx.panel.querySelector('[data-recovery]').hidden,'previous notebook stays available');ok(ctx.panel.querySelector('[data-recovery-notes]').textContent.includes('Прежнее рассуждение'),'old explanation recoverable');
 const areas=[...ctx.panel.querySelectorAll('[data-recovery-notes] textarea')];ok(areas.some(el=>el.value==='Мой ещё не сохранённый разбор'),'retains unsaved conflict text');ctx.dom.window.close();
}
{
 const ctx=setup({native:true});assert.equal(ctx.panel,null);assert.equal(ctx.w.localStorage.getItem(ctx.key),null);assertions+=2;ctx.dom.window.close();
}
{
 const ctx=setup({badStorage:true});input(ctx,'prediction','Не терять исходный файл');assert.equal(ctx.w.localStorage.getItem(ctx.key),'malformed','invalid notebook preserved');ok(ctx.panel.querySelector('[data-status]').textContent.includes('скачай'),'download fallback is explicit');ctx.dom.window.close();
}
{
 const ctx=setup();ctx.panel.querySelector('[data-checkpoint]').click();assert.equal(ctx.w.localStorage.getItem(ctx.key),null,'empty checkpoint does not invent progress');assertions++;ctx.dom.window.close();
}
console.log('Atanasyan retained notebooks PASS: '+files.length+' trainers, '+assertions+' checks');
