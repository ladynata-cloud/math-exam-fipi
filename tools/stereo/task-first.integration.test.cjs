'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'../..'),html=fs.readFileSync(root+'/stereo-course/index.html','utf8'),C=require(root+'/stereo-course/data/course.json');
const errors=[];
function boot(url){const virtualConsole=new VirtualConsole();virtualConsole.on('jsdomError',e=>errors.push(e.message));return new JSDOM(html,{url,runScripts:'dangerously',pretendToBeVisual:true,virtualConsole,beforeParse(w){w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};}});}
const tick=()=>new Promise(r=>setTimeout(r,8));
(async()=>{
 const dom=boot('https://example.test/stereo-course/index.html'),w=dom.window,d=w.document;let proofs=0;
 for(const u of C.units){
  d.querySelector('[data-unit="'+u.id+'"]').click();const svg=d.querySelector('#task-model svg'),input=d.querySelector('#answer');assert.ok(svg,u.id+' actual SVG');assert.ok(!/NaN|Infinity/.test(svg.innerHTML),u.id+' finite scene');input.value='черновик';input.dispatchEvent(new w.Event('input',{bubbles:true}));
  d.querySelector('#task-model button[aria-label="Повернуть влево"]')?.click();const original=svg.innerHTML;
  d.querySelector('[data-action=help]').click();d.querySelector('#task-guide>summary').click();await tick();d.querySelector('[data-action=close-help]').click();await tick();assert.strictEqual(d.querySelector('#task-model svg'),svg);assert.strictEqual(d.querySelector('#answer'),input);assert.equal(input.value,'черновик');assert.equal(svg.innerHTML,original,u.id+' exact view after help');
  d.querySelector('[data-stage="2"]').click();if(d.querySelector('#proof-model')){const proofSvg=d.querySelector('#proof-model svg');assert.ok(proofSvg,u.id+' actual proof SVG');assert.ok(!/NaN|Infinity/.test(proofSvg.innerHTML));assert.equal(d.querySelector('#task-model'),null);proofs++;if(d.querySelector('[data-proof="0"]')){d.querySelector('[data-proof="0"]').click();d.querySelector('[data-action="good-reason"]').click();assert.ok(d.querySelector('#proof-model svg'));}}
  d.querySelector('[data-stage="4"]').click();assert.equal(d.querySelector('#answer').value,'черновик');d.querySelector('[data-action=home]').click();
 }
 dom.window.close();assert.ok(proofs>=19);
 for(const [route,expected]of [['ege15','../ege-profil/atanasyan-10-11/index.html#route'],['ege3','../ege-profil/start/index.html#exam/3'],['https://bad.test/',null],['constructor',null],['__proto__',null]]){
  const x=boot('https://example.test/stereo-course/index.html?route='+encodeURIComponent(route)+'#box'),links=[...x.window.document.querySelectorAll('.toplinks a')].filter(a=>a.textContent.startsWith('←'));assert.equal(links.length,expected?1:0,route);if(expected)assert.equal(links[0].getAttribute('href'),expected);x.window.close();
 }
 assert.deepEqual(errors,[]);console.log('STEREO_TASK_FIRST_INTEGRATION_OK:39realnumeric scenes, '+proofs+' proof destinations, retained DOM/camera, exactreturnwhitelist');
})().catch(error=>{console.error(error);process.exitCode=1;});
