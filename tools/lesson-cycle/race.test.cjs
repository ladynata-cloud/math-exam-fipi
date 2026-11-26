const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../../trainers/lesson-cycle/START.html'),'utf8');
const src=html.split('<script>')[1].split('function isBlank(')[0];
const KEY='mathexam:lesson-cycle-pilot:v2:area';
function shared(){const records=new Map([['old-key','historical']]),locks=new Map(),calls=[];let writes=0;
 const localStorage={getItem:k=>records.get(k)??null,setItem(k,v){writes++;records.set(k,String(v))}};
 const api={request(k,opts,fn){assert.equal(opts.mode,'exclusive');calls.push(k);const prior=locks.get(k)||Promise.resolve();const next=prior.then(fn);locks.set(k,next.catch(()=>{}));return next}};
 return {records,localStorage,api,calls,get writes(){return writes}};
}
function tab(shared,api=shared.api){const el={storage:{},reload:{}},window={addEventListener(){}};const context=vm.createContext({window,navigator:{locks:api},localStorage:shared.localStorage,document:{getElementById:id=>el[id]}});vm.runInContext(src+'\nstate=read(data.id);',context);return {context,el,eval:code=>vm.runInContext(code,context),write:val=>{context.input=val;return vm.runInContext("state.drafts['0:0']=input;save()",context)},status:()=>vm.runInContext('mode(data.id).status',context)}}
(async()=>{
 const s=shared(),a=tab(s),b=tab(s);assert.equal(s.writes,0);const p=a.write('первая'),q=b.write('вторая');await Promise.all([p,q]);assert.equal(s.writes,1);assert.equal(JSON.parse(s.records.get(KEY)).drafts['0:0'],'первая');assert.equal(a.status(),'ok');assert.equal(b.status(),'conflict');assert.equal(b.eval("state.drafts['0:0']"),'вторая');await b.write('вторая исправлена');assert.equal(s.writes,1);assert.equal(b.eval("state.drafts['0:0']"),'вторая исправлена');
 const c=tab(s);await Promise.all([c.write('а'),c.write('б'),c.write('в')]);assert.equal(JSON.parse(s.records.get(KEY)).drafts['0:0'],'в');assert.equal(c.status(),'ok');assert.equal(c.eval('mode(data.id).pending'),0);
 const noLocks=tab(s,null);assert.equal(noLocks.status(),'unavailable');const prev=s.records.get(KEY),oldWrites=s.writes;await noLocks.write('только в памяти');assert.equal(s.writes,oldWrites);assert.equal(s.records.get(KEY),prev);assert.equal(noLocks.eval("state.drafts['0:0']"),'только в памяти');
 const reject=tab(s,{request(){return Promise.reject(new Error('denied'))}});await reject.write('не потеряно');assert.equal(reject.status(),'unavailable');assert.equal(s.records.get(KEY),prev);assert.equal(reject.eval("state.drafts['0:0']"),'не потеряно');
 s.records.set(KEY,'broken');const corrupt=tab(s);assert.equal(corrupt.status(),'corrupt');await corrupt.write('новое');assert.equal(s.records.get(KEY),'broken');assert.equal(s.records.get('old-key'),'historical');
 console.log('PASS mock shared lock manager: competing tabs, ordered same-tab writes, unavailable/denied locks, corrupt record, unchanged old key');
})().catch(e=>{console.error(e);process.exit(1)});
