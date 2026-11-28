'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),school=path.join(root,'school'),entry=fs.readFileSync(path.join(school,'index.html'),'utf8');
const pages={
 'source-50':'5 14 22 27 31 38 44 49 54 60 65 75 81 87 92 98 108 114 117 122 125 130 134 144 148 154 161 168 172 182 187 191 194 198 202 211',
 'source-55':'5 11 16 27 30 40 55 63 72 81 94 113 122 136 145 150 154 159 168 180 204 212 219 225 233 238',
 'source-64':'5 10 19 24 35 41 51 59 67 75 89 94 105 109 116 126 133 144 157 164 172 182 188 197',
 'source-113':'1:6 2:10 3:13 4:17 5:18 6:20 7:27 8:33 9:39 10:44 11:48 12:54 13:56 14:57 15:60 16:61 17:63 18:67 19:71 20:75 21:76 22:79 23:84 24:86 25:89 26:90 27:94 28:95 29:98 30:103 31:106 32:113 33:118 34:123 35:127 36:130 37:133 38:135 39:146 40:148 41:151 42:154 43:157 44:160 45:163 46:165 47:170 48:173 49:176 50:179 51:182 52:186 53:189 54:193 55:195 56:197 57:198 58:201 59:203 60:205 61:208 62:209 63:211 64:215 65:216 66:220 67:223',
 'source-114':'1:6 2:14 3:24 4:28 5:37 6:50 7:71 8:77 9:84 10:97 11:102 12:111 13:119 14:124 15:131 16:133 17:141 18:143 19:148 20:152 21:154 22:156 23:157 24:160 25:163 26:166 27:183 28:192 29:197'
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
 if(name==='source-64'){
  const direct=[1,2,3,4,5,6,7,8,9,10,12,15,16,17,18,19,20,21,22,24];
  assert.deepEqual(Array.from(b.mapping).filter(m=>m.boardPath).map(m=>m.section),direct);
  assert.deepEqual(Array.from(b.mapping).filter(m=>!m.boardPath).map(m=>m.section),[11,13,14,23]);
 }
 for(const row of b.mapping){
  assert(w.WorkshopCurriculum.byId[row.skill]);assert(row.focus.length>20);
  if(row.externalPath){
   const url=new URL(row.externalPath,w.location.href),dest=path.join(root,url.pathname);
   assert(fs.existsSync(dest),dest);const id=url.hash.split('/')[1];
   if(row.boardPath){
    if(row.coverage==='module')assert.equal(id,name.slice(7)+'-'+row.section);
    else if(name==='source-64'){
     assert(m8Ids.has(id));
     assert.equal(url.pathname,'/school/makarychev8/index.html');
     assert.equal(row.boardPath,'/trainers/makarychev8.html#lesson/'+id+'/0');
    }else assert(profile.some(l=>l.id===id&&l.tasks.length>=6));
    const board=new URL(row.boardPath,w.location.href),reg=registry.find(r=>'/'+r.file===board.pathname);
    assert.equal(reg.boardCompatibility,'board-mirror');assert.equal(board.hash,url.hash);mirrors++;
   }else assert(m8Ids.has(id));
  }else{
   const t=w.WorkshopMath.generate(row.skill,row.seed);assert(t.steps.length&&t.prompt&&t.model);
   const button=w.document.querySelector('[data-value="'+name+'/'+row.section+'"]');assert(button);
  }
  all++;
 }
 const first=b.mapping.find(row=>!row.externalPath);
 if(first){
  w.document.querySelector('[data-value="'+name+'/'+first.section+'"]').click();assert.equal(w.location.hash,'#lesson/'+first.skill);
 }else{
  assert(b.mapping.every(row=>row.boardPath&&row.externalPath));
 }
 dom.window.close();
}
console.log('Verified '+all+' textbook section entries and '+mirrors+' mirrored lesson links in '+Object.keys(pages).length+' editions.');
