'use strict';
// DOM contract regression; actual geometry and scroll-clamping remain covered by
// tools/stereo-textbook/browser.cjs at 320/1280 with the real browser layout.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const dir=path.resolve(__dirname,'../..'),dom=new JSDOM('<dialog open><section><div id="model"></div></section></dialog>',{runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,d=w.document;
let x=17,y=811;const scrollCalls=[],focusCalls=[];
Object.defineProperties(w,{scrollX:{get:()=>x},scrollY:{get:()=>y}});
w.scrollTo=options=>{scrollCalls.push({...options});x=options.left;y=options.top;};
const nativeFocus=w.HTMLElement.prototype.focus;
w.HTMLElement.prototype.focus=function(options){focusCalls.push(options);if(!options?.preventScroll){x=0;y=0;}nativeFocus.call(this,options);};
w.eval(fs.readFileSync(path.join(dir,'stereo-course/assets/task-scene-viewer.js'),'utf8'));
const host=d.getElementById('model'),dialog=d.querySelector('dialog'),section=d.querySelector('section');
const source={points:{A:[0,0,0],B:[3,0,0],C:[0,2,1]},edges:[['A','B'],['B','C'],['C','A']],views:{neutral:{label:'Исходная фигура'},construction:{label:'Отрезок AB',segments:[['A','B']]}}};
const original=JSON.stringify(source);let changes=0;
const api=w.TaskSceneViewer.mount(host,source,{savedCamera:{yaw:1.1,pitch:.31},onChange:()=>changes++});api.setView('construction');
const shell=host.querySelector('.atanasyan-model'),svg=host.querySelector('svg'),button=host.querySelector('.am-expand'),camera=JSON.stringify(api.getState());
shell.getBoundingClientRect=()=>({x:20,y:10,width:640,height:784});shell.style.marginTop='12px';shell.style.marginBottom='7px';
d.body.style.overflow='scroll';
function resetScroll(){x=17;y=811;dialog.scrollLeft=5;dialog.scrollTop=243;section.scrollLeft=3;section.scrollTop=67;host.scrollTop=11;}
function checkRestored(){assert.equal(x,17);assert.equal(y,811);assert.equal(dialog.scrollLeft,5);assert.equal(dialog.scrollTop,243);assert.equal(section.scrollLeft,3);assert.equal(section.scrollTop,67);assert.equal(host.scrollTop,11);assert.equal(d.body.style.overflow,'scroll');assert.equal(host.querySelector('.am-expansion-placeholder'),null);assert.equal(button.getAttribute('aria-expanded'),'false');assert.strictEqual(host.querySelector('svg'),svg);assert.equal(svg.dataset.view,'construction');assert.equal(JSON.stringify(api.getState()),camera);assert.equal(changes,0);}
for(const method of ['button','Escape']){
 resetScroll();button.click();const placeholder=host.querySelector('.am-expansion-placeholder');assert(placeholder);assert.equal(placeholder.getAttribute('aria-hidden'),'true');assert.equal(placeholder.style.height,'784px');assert.equal(placeholder.style.marginTop,'12px');assert.equal(placeholder.style.marginBottom,'7px');assert.strictEqual(placeholder.nextSibling,shell);assert.equal(d.body.style.overflow,'hidden');assert.equal(x,17);assert.equal(y,811);assert.equal(focusCalls.at(-1).preventScroll,true);
 // Simulate changed scroll offsets while the fixed view is open. Closing must
 // restore the captured document and each ancestor, without queued callbacks.
 x=0;y=125;dialog.scrollTop=0;dialog.scrollLeft=0;section.scrollTop=0;section.scrollLeft=0;host.scrollTop=0;
 if(method==='button')button.click();else button.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));
 checkRestored();assert.equal(focusCalls.at(-1).preventScroll,true);assert.equal(scrollCalls.at(-1).behavior,'instant');
}
resetScroll();button.click();api.destroy();assert.equal(host.children.length,0,'destroy removes overlay and placeholder');assert.equal(d.body.style.overflow,'scroll');assert.equal(dialog.scrollTop,243);assert.equal(x,17);assert.equal(y,811);
api.destroy();assert.equal(host.children.length,0);assert.equal(JSON.stringify(source),original);assert.equal(changes,0);
console.log('TASK_SCENE_EXPANSION_OK: reserved geometry, ancestor/document scroll, preventScroll focus, both close paths, exact camera/view, teardown');dom.window.close();
