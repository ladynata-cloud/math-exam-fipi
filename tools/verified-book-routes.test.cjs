'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),school=path.join(root,'school'),entry=fs.readFileSync(path.join(school,'index.html'),'utf8');
const pages={
 'source-64':'5 10 19 24 35 41 51 59 67 75 89 94 105 109 116 126 133 144 157 164 172 182 188 197',
 'source-113':'1:6 2:10 3:13 7:27 8:33 10:44 11:48 12:54 14:57 20:75 21:76 22:79 23:84 25:89 26:90 27:94 28:95 29:98 30:103 31:106 32:113 33:118 34:123 36:130 37:133 38:135 39:146 40:148 42:154 45:163 46:165 47:170 48:173 49:176 50:179 51:182 52:186 53:189 54:193 56:197 58:201 59:203 60:205 64:215',
 'source-114':'1:6 2:14 3:24 4:28 5:37 6:50 7:71 8:77 9:84 14:124 15:131 16:133 17:141 18:143 19:148 24:160 25:163 26:166 27:183'
};
const m8={window:{}};vm.runInNewContext(fs.readFileSync(path.join(school,'makarychev8/data.js'),'utf8'),m8);
const m8Ids=new Set(m8.window.MakarychevCourse.lessons.map(l=>l.id));
const profile=require('../ege-profil/start/probability-data.js');
const registry=require('../trainers/board-compat.json').trainers;
let all=0,mirrors=0;
for(const [name,sourcePages] of Object.entries(pages)){
 const dom=new JSDOM(entry,{url:'https://mathexam.space/school/index.html#book/'+name,runScripts:'outside-only'}),w=dom.window;
 w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
 for(const match of entry.matchAll(/<script defer src="([^"?]+\.js)/g)){
  const file=match[1];
  if(!file.startsWith('/')||file.startsWith('/courses/')){
   const source=file.startsWith('/')?path.join(root,file):path.join(school,file);
   w.eval(fs.readFileSync(source,'utf8'));
  }
 }
 const b=w.WorkshopCurriculum.books.find(b=>b.id===name);
 const expected=sourcePages.split(' ').map((s,i)=>s.includes(':')?s:(i+1)+':'+s);
 assert.deepEqual(Array.from(b.mapping,m=>m.section+':'+m.page),expected);
 assert.equal(w.document.querySelectorAll('#main .skill-row').length,b.mapping.length);
 for(const row of b.mapping){
  assert(w.WorkshopCurriculum.byId[row.skill]);assert(row.focus.length>20);
  if(row.externalPath){
   const url=new URL(row.externalPath,w.location.href),dest=path.join(root,url.pathname);
   assert(fs.existsSync(dest),dest);const id=url.hash.split('/')[1];
   if(row.boardPath){
    assert(profile.some(l=>l.id===id&&l.tasks.length>=6));
    const board=new URL(row.boardPath,w.location.href),reg=registry.find(r=>'/'+r.file===board.pathname);
    assert.equal(reg.boardCompatibility,'board-mirror');assert.equal(board.hash,url.hash);mirrors++;
   }else assert(m8Ids.has(id));
  }else{
   const t=w.WorkshopMath.generate(row.skill,row.seed);assert(t.steps.length&&t.prompt&&t.model);
   const button=w.document.querySelector('[data-value="'+name+'/'+row.section+'"]');assert(button);
  }
  all++;
 }
 const first=b.mapping.find(row=>!row.externalPath);w.document.querySelector('[data-value="'+name+'/'+first.section+'"]').click();
 assert.equal(w.location.hash,'#lesson/'+first.skill);dom.window.close();
}
console.log('Verified '+all+' textbook section entries and '+mirrors+' mirrored lesson links in 3 editions.');
