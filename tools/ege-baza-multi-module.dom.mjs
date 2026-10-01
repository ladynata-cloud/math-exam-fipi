// Full navigator script order and actual file-input restoration, using synthetic data.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const {JSDOM,VirtualConsole}=createRequire(import.meta.url)('jsdom');
const read=p=>fs.readFileSync(p,'utf8'),source=read('ege-baza/index.html');
const errors=[],downloads=[];let checks=0;
const ok=(v,m)=>{assert.ok(v,m);checks++;};
const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(source,{url:'https://example.test/ege-baza/#progress?module=m02',runScripts:'outside-only',virtualConsole:vc});
const w=dom.window,q=s=>w.document.querySelector(s),text=()=>q('#content').textContent;
w.TextEncoder=TextEncoder;w.HTMLElement.prototype.scrollIntoView=()=>{};
w.URL.createObjectURL=()=> 'blob:synthetic';w.URL.revokeObjectURL=()=>{};
w.HTMLAnchorElement.prototype.click=function(){if(this.download)downloads.push(this.download);};
const tick=()=>new Promise(r=>setTimeout(r,10));
const go=async hash=>{w.location.hash=hash;await tick();};
const click=async s=>{assert.ok(q(s),s);q(s).dispatchEvent(new w.MouseEvent('click',{bubbles:true,cancelable:true}));await tick();};
async function selectFile(content){const file=new w.File([content],'synthetic.json',{type:'application/json'});Object.defineProperty(q('#backup-file'),'files',{value:[file],configurable:true});q('#backup-file').dispatchEvent(new w.Event('change'));await tick();await tick();}
try{
 for(const [,file] of source.matchAll(/<script defer src="([^"]+)"/g))w.eval(read('ege-baza/'+file));
 const root=w.EgeBazaCourseState,one=root.forModule('m01'),two=root.forModule('m02'),b1=w.EgeBazaBackup,b2=b1.forModule('m02');
 const record=t=>({tries:1,hints:false,solution:false,done:true,answer:String(t.answer)});
 const m1={v:1,practice:{'decimal-practice-1':record(one.bank.tasks[0])},runs:{}};
 const m2={v:1,practice:Object.fromEntries(two.bank.tasks.filter(t=>t.phase==='practice').map(t=>[t.id,record(t)])),runs:{}};
 m2.practice['data-practice-1'].hints=true;
 w.localStorage.setItem(one.KEY,JSON.stringify(m1));w.localStorage.setItem(two.KEY,JSON.stringify(m2));w.localStorage.setItem('legacy','untouched');
 await click('[data-refresh]');
 ok(q('[data-stat="solved"]').textContent.trim()==='16 / 16','Second module denominator 16');
 ok(q('[data-stat="independent"]').textContent.trim()==='15 / 16','Help retained');
 ok(q('[data-stat="confirmed"]').textContent.trim()==='0 / 4','Four skills, not six');
 ok(q('a[href="../trainers/ege-baza/data-course/#learn-data"]'),'Correct lesson path');
 ok(q('[data-nav="today"]').getAttribute('href')==='#today?module=m02','Main navigation preserves module');
 await go('#today?module=m02');ok(q('[data-recommendation] .actions a').href.includes('/data-course/'),'Today launches second module');
 ok(q('a[href="#module?module=m02"]'),'Topic picker retains m02');
 await go('#module?module=m02');ok(w.document.querySelectorAll('.lesson a.btn').length===4,'Four launched lessons');
 ok(text().includes('практика 4/4'),'Per-lesson state comes from m02');
 await go('#progress?module=m01');ok(q('[data-stat="solved"]').textContent.trim()==='1 / 24','First module unchanged');
 const file1=b1.exportBackup(w.localStorage),file2=b2.exportBackup(w.localStorage);
 await go('#backup?module=m02');await click('[data-backup-export]');
 ok(downloads[0].startsWith('mathexam-ege-baza-m02-backup-'),'Second module filename');
 ok(q('a[href="#progress?module=m02"]'),'Back from backup keeps module');
 await selectFile(file1);ok(q('#backup-preview').hidden&&!q('#backup-status').hidden,'Wrong-module file rejected');
 w.localStorage.setItem(two.KEY,JSON.stringify({v:1,practice:{},runs:{}}));
 await selectFile(file2);ok(!q('#backup-preview').hidden&&q('#backup-preview').textContent.includes('16/16'),'M02 preview uses correct counts');
 ok(q('[data-backup-apply]').disabled,'Restoration requires consent');
 q('#backup-consent').checked=true;q('#backup-consent').dispatchEvent(new w.Event('change'));await click('[data-backup-apply]');
 ok(q('#backup-status').textContent.includes('Копия восстановлена'),'Real FileReader flow restores m02');
 ok(JSON.parse(w.localStorage.getItem(two.KEY)).practice['data-practice-1'].hints,'Hint restored');
 ok(w.localStorage.getItem(one.KEY)===JSON.stringify(m1)&&w.localStorage.getItem('legacy')==='untouched','M01 and unrelated storage untouched');
 await go('#progress?module=m02');ok(q('[data-stat="solved"]').textContent.trim()==='16 / 16','Restored work visible');
 await go('#backup?module=m02');await selectFile(file2);
 w.dispatchEvent(new w.StorageEvent('storage',{key:one.KEY}));ok(!q('#backup-preview').hidden,'Other module changes do not invalidate m02 preview');
 w.dispatchEvent(new w.StorageEvent('storage',{key:two.KEY}));ok(q('#backup-preview').hidden,'Selected module change invalidates preview');
 await go('#backup?module=m01');await selectFile(file1);ok(!q('#backup-preview').hidden,'Version-1 m01 still previews');
 for(const hash of ['#progress?module=m03','#today?module=unknown','#backup?module=m03']){await go(hash);ok(text().includes('Раздел не найден'),'No fabricated implemented route '+hash);}
 ok(errors.length===0,'No errors: '+errors.join('; '));
 console.log(`EGE_BAZA_MULTI_MODULE_DOM_OK: ${checks} selected-module routes, file input, restoration and isolation checks.`);
}finally{dom.window.close();}
