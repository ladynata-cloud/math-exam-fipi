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
 // A complete legitimate record can exceed the former 420000-character cap.
 const boundary=tab(shared());
 for(const cp of [120,10,34,92,1046,0x1f600,0,0xd800]){
   boundary.context.cp=cp;
   const result=boundary.eval([
     '(()=>{',
     'const x=blank(), v=String.fromCodePoint(cp).repeat(MAX_TEXT).slice(0,MAX_TEXT);',
     'for(let i=0;i<COUNTS.length;i++){x.done[i]=true;x.times[i]="2026-11-26T01:00:00.000Z";x.locked[i]=[];for(let j=0;j<COUNTS[i];j++){x.drafts[i+":"+j]=v;x.locked[i].push(v)}}',
     'x.stage=6;x.drafts.revision=v;',
     'const raw=JSON.stringify(x);',
     'const report={schema:"mathexam-lesson-cycle-pilot-v2",backupState:x,module:data.id,title:data.title,exportedAt:"2026-11-26T01:00:00.000Z",stages:STAGES.map((name,i)=>({name,completed:x.done[i],recordedAt:x.times[i],firstRecord:x.locked[i],draft:Object.fromEntries(Object.entries(x.drafts).filter(([k])=>k.startsWith(i+":")))})),practiceRevision:x.drafts.revision,assessment:"manual"};',
     'const roundTrip=JSON.stringify(decode(raw))===raw;',
     'const exported=JSON.stringify(report,null,2);',
     'x.drafts.revision=v+"x";const oversizedFieldRejected=!validState(x);',
     'let oversizedRawRejected=false;try{decode(" ".repeat(MAX_JSON+1))}catch(e){oversizedRawRejected=e.message==="invalid length"}',
     'return {roundTrip,rawLength:raw.length,maxJson:MAX_JSON,maxBackup:MAX_BACKUP_BYTES,exported,oversizedFieldRejected,oversizedRawRejected};',
     '})()'
   ].join('\n'));
   assert(result.roundTrip,'maximum legal field must round-trip: '+cp);
   assert(result.rawLength<=result.maxJson);
   assert(Buffer.byteLength(result.exported,'utf8')<=result.maxBackup,'own exported backup must fit import limit');
   assert(result.oversizedFieldRejected);assert(result.oversizedRawRejected);
   if(cp===0||cp===0xd800)assert(result.rawLength>420000,'stress case must exceed old cap');
 }
 console.log('PASS maximum-sized records: eight encodings, exact decode, bounded export and rejected oversized input');
 console.log('PASS mock shared lock manager: competing tabs, ordered same-tab writes, unavailable/denied locks, corrupt record, unchanged old key');
})().catch(e=>{console.error(e);process.exit(1)});
