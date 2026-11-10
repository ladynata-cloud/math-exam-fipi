'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const C=require('../foundations/route-core.js'),Store=require('../foundations/route-store.js'),catalog=require('../foundations/route-catalog.js'),preparation=require('../learning/preparation-map.js'),O=require('./foundations-routes-oracle.cjs');
const root=path.resolve(__dirname,'..');
function fixture(blocked=false){
 const data=new Map([['mathExamCourseProgress.v1','legacy-exact'],['mathExamFoundations.visits.v1','old-visits-exact']]);let tick=1762770000000,serial=0;
 const storage={get length(){if(blocked)throw Error('denied');return data.size},key:i=>[...data.keys()][i],getItem:key=>{if(blocked)throw Error('denied');return data.has(key)?data.get(key):null;},setItem:(key,value)=>{if(blocked)throw Error('denied');data.set(key,String(value));}};
 const opts={now:()=>++tick,random:()=>String(++serial).padStart(12,'0')};
 return{data,storage,create:()=>Store.create(catalog,storage,opts)};
}
function solve(store,id,route,mode,change){const qs=C.questions(route,mode);for(const [i,q]of qs.entries()){store.act(id,'view',q.id);if(change)change(store,id,q,i);store.act(id,'submit',q.id,String(q.answer));}return store.act(id,'finish');}
const first=catalog.routes[0];

test('all twelve groups and 181 substantive entrances have exact, group-appropriate routes',()=>{
 assert.equal(preparation.allItems.length,185);assert.equal(catalog.groups.length,12);assert.equal(Object.keys(catalog.byItem).length,181);assert.equal(catalog.overview.length,4);
 for(const g of preparation.groups){assert(catalog.groups.find(x=>x.id===g.id).routes.length>1);for(const item of g.items){if(C.overview.includes(item.id)){assert.equal(catalog.byItem[item.id],undefined);continue;}assert.equal(catalog.byItem[item.id].group,g.id,item.id);}}
 assert.equal(catalog.byId.constructor,undefined);assert.equal(catalog.byId.__proto__,undefined);
});

test('every question has independent exact mathematics, unambiguous choices and a distinct condition',()=>{
 let count=0;
 for(const r of catalog.routes){assert.equal(r.questions.length,18,r.id);assert(new Set(r.trainers.map(t=>t.href)).size>=2,r.id);const seen=new Set();
  for(const q of r.questions){O.verify(q);assert(C.correct(q,String(q.answer)),r.id+'/'+q.id);const fingerprint=JSON.stringify([q.prompt,q.visual||null]);assert(!seen.has(fingerprint),'Repeated condition '+r.id+'/'+q.id);seen.add(fingerprint);assert(!C.correct(q,''));assert(!C.correct(q,'Infinity'));assert(!C.correct(q,'0/0'));if(q.input==='choice')assert.equal(new Set(q.choices).size,q.choices.length);count++;
   const v=q.visual;if(!v)continue;
   if(v.type==='numberLine'){assert(v.max>v.min);for(const p of v.points||[])assert(Number.isFinite(p.value)&&p.value>=v.min&&p.value<=v.max,q.id);}
   if(v.type==='graph'){assert(v.xmax>v.xmin&&v.ymax>v.ymin&&v.step>0);const inside=(x,y)=>x>=v.xmin&&x<=v.xmax&&y>=v.ymin&&y<=v.ymax;for(const p of v.points||[])assert(inside(p.x,p.y),q.id);for(const s of v.segments||[])assert(inside(s.x1,s.y1)&&inside(s.x2,s.y2),q.id);}
   if(v.type==='rectangle')assert(v.width>0&&v.height>0,q.id);
   if(v.type==='angle')assert(v.degrees>0&&v.degrees<=180,q.id);
   if(v.type==='fraction')assert(Number.isInteger(v.parts)&&v.parts>0&&v.parts<=100&&Number.isInteger(v.shaded)&&v.shaded>=0&&v.shaded<=5*v.parts,q.id);
  }
 }
 console.log('EXACT_ROUTE_QUESTIONS_OK '+count+' questions / '+catalog.routes.length+' routes');
});

test('all trainer files exist and safe local paths cannot become arbitrary iframe sources',()=>{
 for(const r of catalog.routes)for(const t of r.trainers){assert(C.validHref(t.href),t.href);const u=new URL(t.href,'https://mathexam.space');assert.equal(u.origin,'https://mathexam.space');let file=path.join(root,decodeURIComponent(u.pathname));if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');assert(fs.existsSync(file),'Missing trainer '+r.id+' '+t.href);assert(t.instruction.length>10&&t.finish.length>5);}
 for(const bad of ['https://example.com','//example.com','/../secret','/a/../b','/\\evil','/x\nbad','javascript:alert(1)'])assert.equal(C.validHref(bad),false,bad);
});

test('Russian decimals, exact fractions, mixed numbers and invalid arithmetic input',()=>{
 for(const [a,b]of [['0,125','1/8'],['−1 1/2','-3/2'],[' +3,0 ','3'],['.25','1/4'],['2 / 4','0.5'],['0/9','0']])assert(C.equalNumber(a,b),a);
 for(const bad of ['', ' ', '1/0','NaN','Infinity','1e3','2+3','3,1.2','1//2','-1 3/2','<script>'])assert.equal(C.parseNumber(bad),null,bad);
});

test('a finite new check earns credit only after six independent first answers and explicit finish',()=>{
 const f=fixture(),s=f.create(),id=s.start(first.id,'check-a'),qs=C.questions(first,'check-a');
 assert.equal(s.get(id).verified,false);for(const q of qs)s.act(id,'submit',q.id,String(q.answer));
 assert.equal(s.get(id).complete,true);assert.equal(s.get(id).verified,false);const completed=s.act(id,'finish');assert.equal(completed.independent,6);assert.equal(completed.verified,true);
 const before=f.data.size;s.act(id,'submit',qs[5].id,String(qs[5].answer));s.act(id,'finish');assert.equal(f.data.size,before,'no duplicate credit/events');
 assert.equal(f.data.get('mathExamCourseProgress.v1'),'legacy-exact');assert.equal(f.data.get('mathExamFoundations.visits.v1'),'old-visits-exact');
});

test('a hint or wrong first attempt survives reload and cannot become independent',()=>{
 for(const action of ['hint','reveal','wrong']){const f=fixture(),s=f.create(),id=s.start(first.id,'check-a');const result=solve(s,id,first,'check-a',(st,sid,q,i)=>{if(i!==0)return;if(action==='wrong')st.act(sid,'submit',q.id,'999999999');else st.act(sid,action,q.id);});
  assert.equal(result.verified,false,action);assert.equal(result.assisted,1,action);const reload=f.create();assert.equal(reload.get(id).assisted,1);assert.equal(reload.start(first.id,'check-a'),id);}
});

test('practice is finite learning, and a replay of familiar questions cannot earn new-check credit',()=>{
 const f=fixture(),s=f.create();const p=s.start(first.id,'practice');assert.equal(solve(s,p,first,'practice').verified,false);
 const firstCheck=s.start(first.id,'check-a');assert.equal(solve(s,firstCheck,first,'check-a').verified,true);
 const again=s.start(first.id,'check-a',true),replayed=solve(s,again,first,'check-a');assert.equal(replayed.repeated,6);assert.equal(replayed.independent,0);assert.equal(replayed.verified,false);
 const different=s.start(first.id,'check-b');assert.equal(solve(s,different,first,'check-b').verified,true);
});

test('tabs merge immutable events: hidden peer help and duplicate answers cannot erase evidence',()=>{
 const f=fixture(),a=f.create(),b=f.create(),id=a.start(first.id,'check-a');assert.equal(b.start(first.id,'check-a'),id);
 const q=C.questions(first,'check-a')[0];a.act(id,'view',q.id);b.act(id,'hint',q.id);a.act(id,'submit',q.id,String(q.answer));assert.equal(a.get(id).items[0].help,true);
 const n=f.data.size;b.act(id,'submit',q.id,String(q.answer));assert.equal(f.data.size,n);assert.equal(b.get(id).independent,0);
});

test('draft restores exact typed text, and corrupted draft/event bytes are not overwritten',()=>{
 const f=fixture(),s=f.create(),id=s.start(first.id,'practice'),q=C.questions(first,'practice')[0];s.setDraft(id,q.id,' −1,25 ');assert.equal(f.create().getDraft(id,q.id),' −1,25 ');
 const key=C.PREFIX+'draft.'+id+'.'+q.id,bad=JSON.stringify({version:1,session:id,question:q.id,value:42});f.data.set(key,bad);s.getDraft(id,q.id);s.setDraft(id,q.id,'9');assert.equal(f.data.get(key),bad);
 f.data.set(C.PREFIX+'event.broken','{oops');assert.equal(s.read().reliable,false);assert.equal(f.data.get(C.PREFIX+'event.broken'),'{oops');
});

test('storage denial leaves a usable temporary session and explicitly unconfirmed persistence',()=>{
 const f=fixture(true),s=f.create(),id=s.start(first.id,'practice');const q=C.questions(first,'practice')[0];s.act(id,'hint',q.id);s.act(id,'submit',q.id,String(q.answer));assert.equal(s.get(id).items[0].correct,true);assert.equal(s.read().reliable,false);assert(s.read().notice.length>10);
});

test('deleting storage in another tab does not resurrect cached events or old sessions',()=>{
 const f=fixture(),s=f.create(),id=s.start(first.id,'practice');const q=C.questions(first,'practice')[0];s.act(id,'hint',q.id);for(const key of [...f.data.keys()])if(key.startsWith(C.PREFIX))f.data.delete(key);assert.equal(s.get(id),null);assert.equal(s.summary()[first.id].started,false);
});

test('malformed/out-of-order stored events do not bypass the six-step sequence',()=>{
 const f=fixture(),s=f.create(),id=s.start(first.id,'check-a'),qs=C.questions(first,'check-a');
 assert.equal(s.act(id,'submit',qs[5].id,String(qs[5].answer)).index,0);
 assert.equal(s.act(id,'finish').finished,false);
 assert.equal(C.validEvent({version:1,id:'event-123',session:id,route:'constructor',mode:'check-a',at:100,type:'start'},catalog),false);
});

test('archived signed trainers differ from their base only in the reviewed return links',()=>{
 const baseline={"trainers/archive-5-weeks/opposite-numbers-c45c9e7e.html":"ca7f2d8cd870113fb531dc497d62b972efa77a98","trainers/archive-5-weeks/zero-lake-1d5fb3a3.html":"88e4a93a6e1ca87398d2c3f17f566fcb763ab069","trainers/archive-5-weeks/module-distance-1-743ac077.html":"fcc6481cf2ef934867888f3b67cb63680f96d052","trainers/archive-5-weeks/rewrite-before-calc-1-7e6bf87d.html":"d7153a8b96e153a68b9186a8d14365ea2664a5db","trainers/archive-5-weeks/find-the-error-1-0a615cbc.html":"a4eb70c12366c5444ec82d1c85b989cc1bdc1d16","trainers/archive-5-weeks/quick-skill-check-7668e263.html":"e8084f28dc7d3cb8496bfd81bf03bdae00e1426d"};
 const replacements={"skill-map.html":"/foundations/#topic=signed","negative-plus-negative.html":"/foundations/route.html#signed-add-negative","battle-numbers.html":"/foundations/route.html#signed-add-different","subtraction-as-addition.html":"/foundations/route.html#signed-subtraction","brackets-and-signs.html":"/foundations/route.html#signed-brackets","mixed-expressions.html":"/foundations/route.html#signed-mixed-check"};
 for(const [file,sha]of Object.entries(baseline)){let content=fs.readFileSync(path.join(root,file),'utf8');for(const [old,next]of Object.entries(replacements))content=content.split(next).join(old);const bytes=Buffer.from(content),hash=crypto.createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');assert.equal(hash,sha,file);}
});

test('a transient missing help write is flushed before later answers and remains assisted after reload',()=>{
 const f=fixture(),baseSet=f.storage.setItem;let rejectHint=true;
 f.storage.setItem=(key,value)=>{const e=key.startsWith(C.PREFIX+'event.')?JSON.parse(value):null;if(e&&e.type==='hint'&&rejectHint){rejectHint=false;throw Error('one transient write');}baseSet(key,value);};
 const st=f.create(),id=st.start(first.id,'check-a'),q=C.questions(first,'check-a')[0];st.act(id,'hint',q.id);assert.equal(st.read().pending,1);
 solve(st,id,first,'check-a');assert.equal(st.read().pending,0);const reload=f.create().get(id);assert.equal(reload.assisted,1);assert.equal(reload.verified,false);
});

test('a persistent missing event cannot be overtaken by a durable answer or finish',()=>{
 const f=fixture(),baseSet=f.storage.setItem;let rejectHint=true;
 f.storage.setItem=(key,value)=>{const e=key.startsWith(C.PREFIX+'event.')?JSON.parse(value):null;if(e&&e.type==='hint'&&rejectHint)throw Error('quota');baseSet(key,value);};
 const st=f.create(),id=st.start(first.id,'check-a'),q=C.questions(first,'check-a')[0];st.act(id,'hint',q.id);solve(st,id,first,'check-a');
 const diskEvents=[...f.data.entries()].filter(([k])=>k.startsWith(C.PREFIX+'event.')).map(([,v])=>JSON.parse(v));
 assert(!diskEvents.some(e=>e.type==='submit'||e.type==='finish'),'later evidence must stay in memory behind missing help');
 assert(st.read().pending>1);assert.equal(f.create().get(id).verified,false);
 rejectHint=false;assert.equal(st.flush(),true);assert.equal(f.create().get(id).assisted,1);
});

test('new unsaved draft wins over an older disk draft in the same tab',()=>{
 const f=fixture(),st=f.create(),id=st.start(first.id,'practice'),q=C.questions(first,'practice')[0];
 st.setDraft(id,q.id,'old');const key=C.PREFIX+'draft.'+id+'.'+q.id,baseSet=f.storage.setItem;
 f.storage.setItem=(k,v)=>{if(k===key)throw Error('quota');baseSet(k,v);};st.setDraft(id,q.id,'new, exact');
 assert.equal(st.getDraft(id,q.id),'new, exact');assert.equal(JSON.parse(f.data.get(key)).value,'old');
});

test('same-time events cannot hide a stored peer hint or wrong answer behind a correct answer',()=>{
 const qs=C.questions(first,'check-a'),sid='session-peer-order',events=[C.event({id:'event-start-000',session:sid,route:first.id,mode:'check-a',type:'start',at:100})];
 for(const [i,q]of qs.entries())events.push(C.event({id:'event-a-correct-'+i,session:sid,route:first.id,mode:'check-a',question:q.id,type:'submit',value:String(q.answer),at:200+i}));
 events.push(C.event({id:'event-finish-000',session:sid,route:first.id,mode:'check-a',type:'finish',at:300}));
 for(const extra of [{type:'hint'},{type:'reveal'},{type:'submit',value:'999999999'}]){
  const state=C.session(catalog,[...events,C.event({id:'event-z-peer-000',session:sid,route:first.id,mode:'check-a',question:qs[0].id,at:200,...extra})],sid);
  assert.equal(state.verified,false,extra.type);assert.equal(state.assisted,1,extra.type);
 }
});
