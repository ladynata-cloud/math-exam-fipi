'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
const tick=()=>new Promise(resolve=>setTimeout(resolve,10));
test('every curated OGE entry survives canonical picker deduplication in its intended group',()=>{
 const dom=new JSDOM('',{url:'https://mathexam.space/trainers/trainer-board.html',runScripts:'outside-only'});
 try{const w=dom.window;w.eval(read('trainers/board-picker.js'));const first=new Map();for(const entry of JSON.parse(read('trainers/board-picker-data.json')).entries){const key=w.BoardPicker.canonical(entry.href);if(!first.has(key))first.set(key,entry);}for(const entry of JSON.parse(read('tools/fixtures/oge-course-board-entries.json'))){const chosen=first.get(w.BoardPicker.canonical('/'+entry.file));assert(chosen,entry.trainerId);assert.equal(chosen.group,entry.group);assert.equal(chosen.title,entry.title);}}finally{dom.window.close();}
});
test('mirror status remains visible beside the trainer and outside settings',()=>{
 const dom=new JSDOM(read('trainers/trainer-board.html'));
 try{const d=dom.window.document,node=d.getElementById('mirrorStatus');assert.equal(d.querySelectorAll('#mirrorStatus').length,1);assert(node.closest('.trainer .head'));assert.equal(node.closest('dialog'),null);assert.equal(node.closest('[hidden]'),null);assert(node.closest('.mirror-row').querySelector('button'));}finally{dom.window.close();}
});
test('picker reports runtime capability, refreshes readiness and preserves teacher-only opening',async()=>{
 const dom=new JSDOM(read('trainers/trainer-board.html'),{url:'https://mathexam.space/trainers/trainer-board.html',runScripts:'outside-only',pretendToBeVisual:true});
 try{const w=dom.window,d=w.document;w.matchMedia=()=>({matches:false,addEventListener(){}});w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 const fixtures=[{file:'trainers/oge-task6-fractions.html',title:'ОГЭ №6',group:'ОГЭ'},{file:'trainers/oge-1-5-trainers/practice-1-5-tires.html',title:'ОГЭ · Шины',group:'ОГЭ'}];
 w.fetch=async()=>({ok:true,json:async()=>({entries:fixtures.map(({file,title,group})=>({href:'/'+file,title,group}))}),headers:new w.Headers(),url:'https://mathexam.space/trainers/oge-task6-fractions.html'});
 let ready=false,role='teacher';const opened=[];w.eval(read('trainers/board-picker.js'));
 w.BoardPicker.mount({fallback:fixtures,role:()=>role,retry(){},open(url){opened.push(url);return true;},mirrorCapability:url=>!ready?'unknown':url.includes('fractions')?'supported':'unsupported'});
 await tick();d.getElementById('chooseTrainer').click();assert.equal(d.querySelectorAll('[data-mirror-capability="unknown"]').length,2);
 ready=true;d.dispatchEvent(new w.Event('mathexam:trainer-registry-change'));
 assert.equal(d.querySelectorAll('[data-mirror-capability="supported"]').length,1);assert.equal(d.querySelectorAll('[data-mirror-capability="unsupported"]').length,1);
 assert.match(d.querySelector('[data-mirror-capability="unsupported"]').textContent,/Без синхронизации/);
 ready=false;d.dispatchEvent(new w.Event('mathexam:trainer-registry-change'));assert.equal(d.querySelectorAll('[data-mirror-capability="unknown"]').length,2);ready=true;d.dispatchEvent(new w.Event('mathexam:trainer-registry-change'));
 d.querySelector('[data-mirror-capability="supported"]').closest('button').click();assert.deepEqual(opened,['/trainers/oge-task6-fractions.html']);
 role='student';d.getElementById('chooseTrainer').click();assert.equal(d.getElementById('trainerPicker').open,false);
 const source='/trainers/oge-task13-inequalities.html',target='/trainers/oge13-inequalities-series.html';
 for(const alias of [source,'oge-task13-inequalities.html','./oge-task13-inequalities.html','trainers/oge-task13-inequalities.html'])assert.equal(w.BoardPicker.normalize(alias+'?board=1#x'),target+'?board=1#x');
 assert.equal(w.BoardPicker.normalize('../trainers/oge-task13-inequalities.html'),'../trainers/oge-task13-inequalities.html');
 assert.equal(w.BoardPicker.normalize('https://other.example'+source),'https://other.example'+source);
 assert.equal(w.BoardPicker.normalize('/trainers/%6fge-task13-inequalities.html'),'/trainers/%6fge-task13-inequalities.html');
 }finally{dom.window.close();}
});
